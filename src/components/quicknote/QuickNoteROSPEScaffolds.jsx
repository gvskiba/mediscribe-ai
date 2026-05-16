// QuickNoteROSPEScaffolds.jsx  v1.0
// CC-driven contextual ROS + PE template injection
// Auto-surfaces when a recognized CC is entered. Zero-latency, no API call.
// Mirrors the HPI scaffold pattern. Drop-in for QuickNote v12.2.

import { useState, useMemo, useEffect } from "react";

// ── CC alias normalization ─────────────────────────────────────────────────────
const CC_ALIASES = {
  "sob": "shortness of breath", "dyspnea": "shortness of breath",
  "difficulty breathing": "shortness of breath", "cp": "chest pain",
  "chest pressure": "chest pain", "chest tightness": "chest pain",
  "chest discomfort": "chest pain", "chest heaviness": "chest pain",
  "abd pain": "abdominal pain", "stomach pain": "abdominal pain",
  "belly pain": "abdominal pain", "stomach ache": "abdominal pain",
  "epigastric pain": "abdominal pain",
  "ha": "headache", "migraine": "headache", "head pain": "headache",
  "worst headache": "headache", "thunderclap headache": "headache",
  "lbp": "back pain", "low back pain": "back pain", "low back": "back pain",
  "lumbar pain": "back pain", "mid back pain": "back pain",
  "dizzy": "dizziness", "vertigo": "dizziness", "lightheadedness": "dizziness",
  "lightheaded": "dizziness", "room spinning": "dizziness",
  "passed out": "syncope", "fainted": "syncope", "loc": "syncope",
  "loss of consciousness": "syncope", "near syncope": "syncope",
  "near-syncope": "syncope", "presyncopal": "syncope",
  "palp": "palpitations", "heart racing": "palpitations",
  "racing heart": "palpitations", "heart pounding": "palpitations",
  "ams": "altered mental status", "confusion": "altered mental status",
  "altered": "altered mental status", "encephalopathy": "altered mental status",
  "n/v": "nausea", "nausea and vomiting": "nausea", "vomiting": "nausea",
  "n/v/d": "nausea", "emesis": "nausea",
  "temp": "fever", "high fever": "fever", "febrile": "fever",
  "chills and fever": "fever",
  "leg swelling": "leg pain", "calf pain": "leg pain", "dvt": "leg pain",
  "calf swelling": "leg pain", "unilateral leg swelling": "leg pain",
  "focal weakness": "weakness", "arm weakness": "weakness",
  "leg weakness": "weakness", "facial droop": "weakness",
  "numbness": "weakness", "tingling": "weakness",
};

// ── ROS TEMPLATES ─────────────────────────────────────────────────────────────
const ROS_TEMPLATES = {
  "chest pain":
`Constitutional: [Fever/chills: absent]. [Diaphoresis: present/absent]. Denies weight loss, fatigue.
Cardiovascular: (+) Chest [pain/pressure/tightness] — [substernal/left chest/diffuse]. [Radiation: to left arm/jaw/back/none]. [Diaphoresis: present/absent]. Denies palpitations, near-syncope, syncope. [Orthopnea: present — ___ pillows/absent]. [PND: present/absent]. [Lower extremity edema: present/absent].
Respiratory: [Dyspnea: present/absent]. Denies cough, hemoptysis. [Pleuritic component: present — worse with inspiration/absent].
GI: [Nausea: present/absent]. [Vomiting: present/absent]. Denies dysphagia, heartburn, abdominal pain.
Musculoskeletal: [Chest wall tenderness: present/absent]. Denies recent trauma, injury.
Vascular: [Unilateral leg pain or swelling: present/absent]. Denies calf tenderness.
Neurologic: Denies syncope, focal weakness, numbness, headache.`,

  "shortness of breath":
`Constitutional: [Fever: present — ___°F/absent]. [Diaphoresis: present/absent]. Denies weight loss.
Cardiovascular: [Chest pain/tightness: present/absent]. Denies palpitations, syncope. [Orthopnea: present — ___ pillows/absent]. [PND: present — ___ episodes/week/absent]. [Lower extremity edema: present/absent].
Respiratory: (+) Dyspnea — [at rest/with minimal exertion/with moderate exertion]. [Cough: productive — color ___ /dry/absent]. Denies hemoptysis. [Wheezing: present/absent]. [Stridor: present/absent]. [Pleuritic chest pain: present/absent].
GI: [Nausea: present/absent]. [Vomiting: present/absent]. Denies abdominal distension.
Vascular: [Unilateral leg pain or swelling: present/absent]. Denies calf tenderness. [Recent immobilization or travel: present/absent].
Neurologic: Denies headache, dizziness, focal weakness.`,

  "abdominal pain":
`Constitutional: [Fever: present — ___°F/absent]. [Chills: present/absent]. [Anorexia: present/absent]. [Weight loss: present — ___ lbs/absent].
GI: (+) Abdominal pain — [RUQ/RLQ/LUQ/LLQ/epigastric/periumbilical/diffuse]. [Nausea: present/absent]. [Vomiting: present — ___ episodes, bilious/non-bilious/bloody/absent]. [Diarrhea: present — ___ stools/day, watery/bloody/absent]. [Constipation: last BM ___]. [Hematemesis: present/absent]. [Melena: present/absent]. [Hematochezia: present/absent]. [Jaundice: present/absent].
Genitourinary: [Dysuria: present/absent]. [Hematuria: present/absent]. [Flank pain: present/absent]. [LMP: ___]. [Vaginal discharge: present/absent]. [Vaginal bleeding: present/absent].
Cardiovascular: Denies chest pain, palpitations.
Respiratory: Denies dyspnea, cough.`,

  "headache":
`Constitutional: [Fever: present — ___°F/absent]. [Chills: present/absent]. Denies weight loss.
Neurologic: (+) Headache — [bilateral/unilateral-left/unilateral-right/retro-orbital]. [Thunderclap/maximal at onset: yes/no]. [Worst headache of life: yes/no]. [Aura: present — visual scotoma/sensory/speech/absent]. [Neck stiffness: present/absent]. [Photophobia: present/absent]. [Phonophobia: present/absent]. [Focal weakness: present/absent]. [Numbness: present/absent]. [Vision changes: present — diplopia/blurry/field cut/absent]. [Speech difficulty: present/absent]. [Confusion: present/absent]. [Seizure activity: present/absent].
HEENT: [Ear pain: present/absent]. [Sinus pressure: present/absent]. [Eye pain: present/absent].
GI: [Nausea: present/absent]. [Vomiting: present — projectile/non-projectile/absent].
Trauma: [Head trauma: present — mechanism ___ /absent].`,

  "back pain":
`Constitutional: [Fever: present — ___°F/absent]. [Weight loss: present/absent]. [Night sweats: present/absent].
Musculoskeletal: (+) Back pain — [cervical/thoracic/lumbar/sacral/paraspinal]. [Radiculopathy: radiates to left leg/right leg/both legs/groin/none]. [Weakness in extremities: present — distribution ___ /absent]. [Numbness or tingling: present — distribution ___ /absent].
Genitourinary: [Saddle anesthesia: present/absent]. [Urinary retention: present/absent]. [Urinary incontinence: new/absent]. [Fecal incontinence: new/absent]. [Dysuria: present/absent]. [Hematuria: present/absent]. [Flank pain: present/absent].
GI: [Abdominal pain: present/absent]. [Nausea/vomiting: present/absent].
Vascular: Denies unilateral leg swelling, calf tenderness.
Constitutional/Red flags: [Cancer history: present — type ___ /none]. [IVDU: present/absent]. [Immunocompromised: present/absent]. [Recent procedure/instrumentation: present/absent].`,

  "dizziness":
`Constitutional: [Nausea: present/absent]. [Vomiting: present/absent]. Denies fever, weight loss.
Neurologic: (+) Dizziness — [true vertigo: room spinning/presyncope: nearly fainted/disequilibrium: unsteady/nonspecific]. [Onset: sudden/gradual]. [Headache: present/absent]. [Focal weakness: present/absent]. [Numbness or tingling: present/absent]. [Dysarthria: present/absent]. [Dysphagia: present/absent]. [Diplopia: present/absent]. [Ataxia or incoordination: present/absent].
HEENT: [Hearing loss: present — unilateral/bilateral/absent]. [Tinnitus: present/absent]. [Ear fullness: present/absent]. [Ear pain: present/absent].
Cardiovascular: [Palpitations: present/absent]. [Chest pain: present/absent]. [Near-syncope: present/absent].
Recent illness: [Prior viral illness: present — ___ days ago/absent].`,

  "syncope":
`Constitutional: [Diaphoresis before event: present/absent]. [Pallor: present/absent]. Denies fever.
Neurologic: [Loss of consciousness confirmed: present/absent]. [Duration: ___ seconds/minutes]. [Prodrome: lightheadedness/nausea/palpitations/chest pain/no warning]. [Shaking or jerking: present — duration ___ sec /absent]. [Post-ictal confusion: present — ___ min /absent]. [Headache after event: present/absent]. [Focal weakness: present/absent].
Cardiovascular: [Chest pain before episode: present/absent]. [Palpitations before episode: present/absent]. [Exertional trigger: present/absent]. [Lower extremity edema: present/absent].
GI: [Nausea before episode: present/absent].
GU: [Urinary incontinence: present/absent].
MSK: [Tongue biting: present — lateral/tip/absent]. [Injury from fall: present — describe ___ /absent].`,

  "palpitations":
`Constitutional: [Diaphoresis: present/absent]. Denies fever, weight loss.
Cardiovascular: (+) Palpitations — [rapid/racing/irregular/skipped beats/pounding/fluttering]. [Duration: ___ sec/min/hours/ongoing]. [Abrupt onset: yes/no]. [Chest pain: present/absent]. [Dyspnea: present/absent]. [Near-syncope: present/absent]. [Syncope: present/absent].
Neurologic: [Lightheadedness: present/absent]. Denies focal weakness, numbness.
Endocrine: [Heat intolerance: present/absent]. [Tremor: present/absent]. [Weight loss: present/absent].
GI: Denies nausea, vomiting, diarrhea.
Stimulant exposure: [Caffeine: increased/normal]. [Recent decongestant/stimulant use: present/absent]. [Cocaine or amphetamine use: present/absent].`,

  "altered mental status":
`Constitutional: [Fever: present — ___°F/absent]. [Chills: present/absent]. Denies weight loss.
Neurologic: (+) Altered mental status — [confusion/agitation/lethargy/obtundation]. [Onset: acute/subacute]. [Baseline cognitive status: normal/mild impairment/dementia]. [Headache: present/absent]. [Neck stiffness: present/absent]. [Seizure activity: present — witnessed/suspected/absent]. [Focal weakness: present/absent]. [Speech difficulty: present/absent]. [Vision changes: present/absent]. [Fall or trauma: present/absent].
GI: [Nausea: present/absent]. [Vomiting: present/absent]. [Abdominal pain: present/absent]. [Jaundice: present/absent].
GU: [Urinary incontinence: new/absent]. [Dysuria: present/absent].
Exposure: [Alcohol: recent/last drink ___]. [Substance use: present — type ___ /absent]. [New or changed medications: present — name ___ /absent].
Skin: [Rash: present — description ___ /absent].`,

  "fever":
`Constitutional: (+) Fever — max temp ___°F at home. [Rigors/shaking chills: present/absent]. [Night sweats: present/absent]. [Anorexia: present/absent]. [Weight loss: present — ___ lbs over ___ weeks/absent].
Respiratory: [Cough: productive — color ___ /dry/absent]. [Dyspnea: present/absent]. [Sore throat: present/absent]. [Ear pain: present/absent]. [Rhinorrhea: present/absent]. [Sinus pressure: present/absent].
GI: [Nausea: present/absent]. [Vomiting: present/absent]. [Diarrhea: present — ___ stools/day/absent]. [Abdominal pain: present — location ___ /absent].
GU: [Dysuria: present/absent]. [Frequency/urgency: present/absent]. [Flank pain: present/absent]. [Vaginal discharge: present/absent].
Neurologic: [Headache: present/absent]. [Neck stiffness: present/absent]. [Photophobia: present/absent]. [Confusion: present/absent].
Skin: [Rash: present — description ___ /absent]. [Wound or skin infection: present — location ___ /absent].
MSK: [Joint pain or swelling: present — location ___ /absent].`,

  "nausea":
`Constitutional: [Fever: present — ___°F/absent]. [Diaphoresis: present/absent]. Denies weight loss.
GI: (+) Nausea. [Vomiting: present — ___ episodes, bilious/bloody/non-bilious/absent]. [Abdominal pain: present — location ___ /absent]. [Diarrhea: present — ___ stools/day, watery/bloody/absent]. [Constipation: last BM ___]. [Hematemesis: present/absent]. [Melena: present/absent]. [Last oral intake: ___ hours ago]. [Tolerating liquids: yes/no].
GU: [Dysuria: present/absent]. [LMP: ___]. [Pregnancy test: ordered/positive/negative/not applicable].
Neurologic: [Headache: present/absent]. [Dizziness: present/absent]. [Vertigo: present/absent].
Cardiovascular: Denies chest pain. [Palpitations: present/absent].
Exposure: [Recent food exposure or shared meal with sick contacts: present/absent]. [New medications: present — name ___ /absent]. [Alcohol: present/absent].`,

  "leg pain":
`Constitutional: Denies fever, chills, weight loss.
Vascular: (+) [Unilateral/bilateral] leg [pain/swelling] — [left/right/bilateral]. [Calf tenderness: present/absent]. [Erythema: present/absent]. [Warmth: present/absent]. [Pitting edema: present — 1+/2+/3+/absent]. [Recent travel > 4 hours: present/absent]. [Recent immobilization > 3 days: present/absent]. [Recent surgery: present — type ___ /absent]. [Recent trauma: present/absent]. [Prior DVT or PE: present/absent]. [OCP or hormone use: present/absent].
Respiratory: [Dyspnea: present/absent]. [Pleuritic chest pain: present/absent]. [Hemoptysis: present/absent].
Cardiovascular: [Chest pain: present/absent]. Denies palpitations, syncope.
Skin: [Skin discoloration or breakdown: present/absent].`,

  "weakness":
`Constitutional: [Fever: present — ___°F/absent]. Denies weight loss.
Neurologic: (+) Weakness — [focal: right arm/left arm/right leg/left leg/right hemiplegia/left hemiplegia/bilateral lower/facial/generalized]. [Onset: sudden/gradual — over ___ minutes/hours]. [Numbness or tingling: present — distribution ___ /absent]. [Facial droop: present — right/left/absent]. [Speech difficulty: dysarthria/aphasia/absent]. [Vision changes: present — monocular/binocular/hemianopia/diplopia/absent]. [Headache: present — thunderclap/gradual/absent]. [Ataxia or incoordination: present/absent]. [Dizziness: present/absent]. [NIHSS estimated: ___].
GU: [Bladder dysfunction: present — retention/incontinence/absent]. [Bowel dysfunction: present/absent].
Cardiovascular: [Chest pain: present/absent]. [Palpitations: present/absent — AF as stroke mechanism?].
Respiratory: Denies dyspnea, cough.`,
};

// ── PE TEMPLATES ──────────────────────────────────────────────────────────────
const PE_TEMPLATES = {
  "chest pain":
`General: Alert and oriented x4. [No acute distress / In mild-to-moderate distress]. [Diaphoresis: present/absent]. Appears stated age.
Vital Signs: See triage vitals. SpO2 [__]% on [room air / ___ L/min O2].
HEENT: Normocephalic, atraumatic. Pupils equal, round, reactive. Oropharynx clear. [JVD: absent / present at ___cm].
Cardiovascular: [Regular rate and rhythm / Irregular]. S1 S2 normal. [No S3, S4, murmur, rub, or gallop / Murmur: ___]. No JVD. Peripheral pulses [2+ bilaterally / diminished at ___]. Cap refill < 2 sec.
Respiratory: [Clear to auscultation bilaterally / Diminished at ___]. No wheezing, rhonchi, or rales. Effort [unlabored / labored]. [No accessory muscle use / Accessory muscle use present].
Abdomen: Soft, [nontender / epigastric tenderness], nondistended. Bowel sounds present. No organomegaly.
Musculoskeletal: Chest wall [non-tender to palpation / tender over ___ rib/costochondral junction]. No crepitus.
Extremities: [No cyanosis, clubbing, or edema / 1+ bilateral pitting edema]. Calves [non-tender bilaterally / tender at ___].
Skin: [Warm, dry, intact / Diaphoretic / Pallor]. No rash or mottling.
Neurologic: Alert and oriented x4. No focal neurological deficits. Strength 5/5 upper and lower extremities bilaterally.`,

  "shortness of breath":
`General: Alert and oriented x4. [No acute distress / Mild-to-moderate respiratory distress]. Speaking in [full sentences / 3-4 word sentences / unable to complete sentences]. Appears stated age.
Vital Signs: See triage vitals. SpO2 [__]% on [room air / ___ L NC / NRB / HFNC ___L at ___%].
HEENT: Normocephalic, atraumatic. Oropharynx [clear / erythematous]. [JVD: absent / present at ___cm at 45 degrees].
Cardiovascular: [Regular rate and rhythm / Irregular]. S1 S2 [normal / loud P2]. [No S3, S4 / S3 gallop present]. [No murmur / Murmur: ___]. No rub. [No peripheral edema / 1+ / 2+ pitting edema bilaterally].
Respiratory: [Clear to auscultation bilaterally / Diffuse expiratory wheezing / Bilateral rales at bases / Unilateral diminished breath sounds at ___]. Effort [unlabored / mildly labored / severely labored]. [No accessory muscle use / Accessory muscle use — SCM/intercostal]. [No prolonged expiratory phase / Prolonged expiratory phase present]. Percussion [resonant bilaterally / dull at ___].
Abdomen: Soft, nontender, nondistended. [No hepatomegaly / Hepatomegaly — ___cm below costal margin]. Bowel sounds present.
Extremities: [No cyanosis or clubbing / Digital clubbing present]. [No edema / 1+/2+ pitting edema]. Calves non-tender bilaterally.
Skin: [Warm, dry / Diaphoretic / Cyanotic — perioral/fingertips]. Good [/ poor] skin turgor.
Neurologic: Alert and oriented x4. No focal neurological deficits.`,

  "abdominal pain":
`General: Alert and oriented x4. [No acute distress / Moderate distress — guarding abdomen / Writhing in pain]. Appears stated age.
Vital Signs: See triage vitals. SpO2 [__]% on room air.
HEENT: Normocephalic, atraumatic. Oropharynx moist. [Scleral icterus: absent / present]. Conjunctivae [pink / pale].
Cardiovascular: Regular rate and rhythm. S1 S2 normal. No murmur. No peripheral edema.
Respiratory: Clear to auscultation bilaterally. Breathing unlabored.
Abdomen: [Soft / Rigid / Voluntary guarding / Involuntary guarding]. [Non-distended / Distended — tympanitic/dull to percussion]. Bowel sounds [present and normoactive / hypoactive / absent / high-pitched]. [Nontender / Tenderness — maximal at RUQ/RLQ/LUQ/LLQ/epigastric/diffuse]. [No rebound tenderness / Rebound tenderness present]. [Murphy sign: negative/positive]. [McBurney tenderness: present/absent]. [Psoas sign: positive/negative]. [Obturator sign: positive/negative]. [Rovsing sign: positive/negative]. [Pulsatile mass: absent/present — do not compress]. No hepatomegaly. No splenomegaly.
GU: [CVA tenderness: absent bilaterally / present — left/right]. [Pelvic exam: deferred / performed — see note].
Extremities: No cyanosis, clubbing, or edema.
Skin: [Warm, dry, intact / Jaundiced / Diaphoretic]. [No rash / Rash: ___]. [Good / Poor] skin turgor.
Neurologic: Alert and oriented x4. No focal neurological deficits.`,

  "headache":
`General: Alert and oriented x4. [No acute distress / In moderate pain distress]. [Photophobic — eyes closed/shielded]. Appears stated age.
Vital Signs: See triage vitals. SpO2 [__]% on room air.
HEENT: Normocephalic, atraumatic. [Temporal artery tenderness: absent / present — firm and tender cord]. Pupils [equal, round, reactive — ___ mm bilaterally / anisocoria — R ___mm / L ___mm]. [Fundoscopic exam: no papilledema / papilledema present / deferred]. Oropharynx clear. [Sinus tenderness: absent / frontal/maxillary — bilateral/left/right]. [Periorbital edema or injection: absent/present].
Neck: [Supple, full ROM, no meningismus / Nuchal rigidity present — Kernig positive/Brudzinski positive]. No lymphadenopathy. No carotid bruit.
Cardiovascular: Regular rate and rhythm. S1 S2 normal. No murmur.
Respiratory: Clear to auscultation bilaterally. Breathing unlabored.
Neurologic: Alert and oriented x4. CN II-XII intact — [facial symmetry preserved / facial droop — right/left]. Speech [clear and fluent / dysarthric / aphasic]. Motor strength [5/5 UE and LE bilaterally / weakness — describe ___]. [Pronator drift: negative / positive — right/left]. Sensation intact to light touch bilaterally [/ sensory deficit at ___]. Coordination [intact finger-nose bilaterally / dysmetria — right/left]. Gait [normal / ataxic / deferred]. Reflexes [2+ bilaterally symmetric / hyperreflexia / asymmetric]. [Dix-Hallpike: negative / positive — right/left].
Skin: [No rash / Petechiae — location ___]. No jaundice.`,

  "back pain":
`General: Alert and oriented x4. [No acute distress / Moderate pain distress — antalgic posture]. Ambulating [normally / with difficulty / unable to ambulate]. Appears stated age.
Vital Signs: See triage vitals. SpO2 [__]% on room air.
Cardiovascular: Regular rate and rhythm. S1 S2 normal. No murmur. Peripheral pulses [2+ bilaterally / diminished at ___]. [No pulsatile abdominal mass / Pulsatile abdominal mass — do not compress, vascular surgery notified].
Respiratory: Clear to auscultation bilaterally. Breathing unlabored.
Abdomen: Soft, [nontender / CVA tenderness — left/right], nondistended. Bowel sounds present. [No pulsatile mass palpated — aorta not enlarged].
Musculoskeletal: [Lumbar / Thoracic / Cervical] spine — [midline spinous process tenderness: present/absent]. [Paraspinal muscle tenderness: present — right/left/bilateral/absent]. ROM [full / limited by pain — flexion/extension/rotation]. [Percussion tenderness: present/absent]. [Sacroiliac joint tenderness: present/absent]. [Straight leg raise: negative bilaterally / positive — right at ___°/left at ___° reproducing radicular symptoms]. [FABER/FADIR: negative/positive].
Neurologic: Alert and oriented x4. Lower extremity strength: [Hip flexion 5/5 / Knee extension 5/5 / Dorsiflexion 5/5 / Plantar flexion 5/5 — bilateral / weakness at ___]. Sensation [intact to light touch bilateral LE / deficit at ___]. Reflexes [patellar 2+ bilateral / Achilles 2+ bilateral / diminished at ___]. [Babinski: negative bilaterally / positive — right/left]. [Perianal sensation and rectal tone: intact / deferred].
Skin: No rash, vesicles, or skin breakdown over affected area.`,

  "dizziness":
`General: Alert and oriented x4. [No acute distress / Uncomfortable with head movement]. Appears stated age.
Vital Signs: See triage vitals. [Orthostatic vitals: obtained — see results / not obtained]. SpO2 [__]% on room air.
HEENT: Normocephalic, atraumatic. Pupils equal, round, reactive. [External canals: clear bilaterally / cerumen impaction — right/left]. [TMs: intact bilaterally / erythematous — right/left / perforated — right/left]. [Nystagmus: absent at rest / horizontal — right-beating/left-beating/direction-changing / vertical / torsional — geotropic/apogeotropic]. Oropharynx clear. [Hearing: grossly intact bilaterally / reduced — right/left].
Cardiovascular: [Regular rate and rhythm / Irregular]. S1 S2 normal. No murmur. No carotid bruit.
Respiratory: Clear to auscultation bilaterally. Breathing unlabored.
Neurologic: Alert and oriented x4. [HiNTS exam: Head Impulse — abnormal (catch-up saccade present) / normal (no saccade) | Nystagmus — direction-fixed/direction-changing | Test of Skew — absent/present]. CN II-XII intact — [facial symmetry / facial droop: absent/present]. Speech [clear / dysarthric]. Strength 5/5 upper and lower extremities bilaterally [/ deficit: ___]. Coordination [intact finger-nose bilaterally / dysmetria — right/left]. [Romberg: negative / positive — falls to right/left/posterior]. Gait [normal / wide-based/ataxic / unable to stand safely].
[Dix-Hallpike: negative bilaterally / positive — right ear down: latency ___ sec, fatigable/non-fatigable / left ear down: positive/negative].
Skin: Warm, dry, intact.`,

  "syncope":
`General: Alert and oriented x4. [No acute distress / Post-event — mildly confused, improving]. [No injuries / Injuries: ___]. Appears stated age.
Vital Signs: See triage vitals. [Orthostatic vitals: obtained — see results / deferred]. SpO2 [__]% on room air.
HEENT: Normocephalic, [atraumatic / trauma — laceration at ___, length ___ cm]. Pupils equal, round, reactive. Oropharynx clear. [Tongue: no lacerations / laceration present — tip/lateral]. [JVD: absent / present at ___cm].
Cardiovascular: [Regular rate and rhythm / Irregular]. S1 S2 [normal / murmur — systolic/diastolic, grade ___/6, location ___]. No S3, S4, rub. [No peripheral edema / edema: ___].
Respiratory: Clear to auscultation bilaterally. Breathing unlabored.
Abdomen: Soft, nontender, nondistended. Bowel sounds present.
Extremities: [No injuries / injury: ___]. No cyanosis, clubbing, or edema.
Neurologic: Alert and oriented x4 [/ disoriented to ___, improving]. [Post-event confusion: resolving / resolved]. CN II-XII intact. [Facial symmetry preserved / droop present]. Strength 5/5 upper and lower extremities bilaterally [/ focal deficit: ___]. No focal neurological deficits detected.
Skin: [Warm, dry / Diaphoretic / Pallor]. No rash.`,

  "palpitations":
`General: Alert and oriented x4. [No acute distress / Anxious-appearing]. Appears stated age.
Vital Signs: See triage vitals. SpO2 [__]% on room air. [Heart rate currently regular at ___ bpm / Irregular at ___ bpm average].
HEENT: Normocephalic, atraumatic. Pupils equal, round, reactive. [Thyroid: nontender, no goiter / Goiter — diffuse/nodular]. [Exophthalmos: absent/present]. No JVD.
Cardiovascular: [Regular rate and rhythm / Irregular — no identifiable pattern / Irregularly irregular]. S1 S2 [normal / variable intensity — consistent with variable RR]. [No S3, S4 / S3 present]. [No murmur / Murmur: ___]. No rub. [No peripheral edema / edema: ___]. Peripheral pulses [regular / irregular] bilaterally.
Respiratory: Clear to auscultation bilaterally. Breathing unlabored.
Abdomen: Soft, nontender, nondistended. Bowel sounds present. No hepatomegaly.
Extremities: No cyanosis, clubbing, or edema. Warm peripherally.
Skin: [Warm, dry / Diaphoretic / Flushed / Moist]. [Fine tremor: present/absent]. No rash.
Neurologic: Alert and oriented x4. No focal neurological deficits. [Tremor: absent / fine resting/action tremor].`,

  "altered mental status":
`General: [Alert / Lethargic / Obtunded / Stuporous / Unresponsive]. Oriented to [person/place/time/events]. [Agitated — redirection: successful/unsuccessful / Calm / Somnolent]. Appears [stated age / older than stated age].
Vital Signs: See triage vitals. SpO2 [__]% on [room air / ___ L O2 — maintaining/not maintaining].
HEENT: Normocephalic, [atraumatic / trauma — describe]. Pupils [equal, round, reactive — ___ mm bilaterally / anisocoria — R ___mm / L ___mm / pinpoint / dilated — bilateral]. [Scleral icterus: absent/present]. Mucous membranes [moist / dry]. [Oropharynx: clear / secretions].
Neck: [Supple, full ROM / Meningismus — Kernig positive/Brudzinski positive]. No carotid bruit. No lymphadenopathy.
Cardiovascular: [Regular rate and rhythm / Irregular]. S1 S2 normal. [No murmur / murmur: ___]. No rub or gallop.
Respiratory: [Clear to auscultation bilaterally / Rhonchi at ___ / Diminished at ___ / Crackles at ___]. Breathing [unlabored / labored / Kussmaul pattern].
Abdomen: [Soft, nontender / Distended / Tenderness at ___]. Bowel sounds [present / hypoactive / absent]. [No hepatomegaly / Hepatomegaly — ___cm]. [Asterixis: present/absent].
Skin: [Warm, dry / Diaphoretic / Jaundiced / Rash: ___]. [No needle track marks / Track marks at ___]. [Skin turgor: good / poor — tenting].
Neurologic: [GCS: E___V___M___ = ___]. Speech [clear / dysarthric / aphasic / incoherent / none]. CN II-XII [intact as testable / deficit: ___]. Strength [5/5 / weakness: ___]. Reflexes [2+ bilaterally / hyperreflexia / hyporeflexia]. [Babinski: negative / positive — right/left]. [Cerebellar: intact / dysmetria]. [Gait: normal / ataxic / deferred — unsafe].`,

  "fever":
`General: Alert and oriented x4. [No acute distress / Ill-appearing / Toxic-appearing]. [Diaphoretic / Flushed / Rigoring]. Appears stated age.
Vital Signs: See triage vitals. Temp [___°F oral/rectal/tympanic]. SpO2 [__]% on room air.
HEENT: Normocephalic, atraumatic. Pupils equal, round, reactive. [Pharynx: clear / erythematous / tonsillar exudates — right/left/bilateral / peritonsillar bulge]. [TMs: clear bilaterally / erythematous — right/left]. [Sinus tenderness: absent / frontal/maxillary]. [Lymphadenopathy: absent / cervical/axillary/inguinal — soft/firm/tender].
Neck: [Supple, full ROM / Meningismus — Kernig positive/Brudzinski positive]. No JVD.
Cardiovascular: [Regular rate and rhythm / tachycardia]. S1 S2 [normal / murmur: ___]. No rub. [No peripheral edema / edema: ___].
Respiratory: [Clear to auscultation bilaterally / Rhonchi at ___ / Crackles at ___ / Dull to percussion at ___ — consolidation]. Breathing [unlabored / labored].
Abdomen: [Soft, nontender / Tenderness at ___]. [No CVA tenderness / CVA tenderness — right/left]. Bowel sounds present. [No hepatomegaly / Hepatomegaly]. [No splenomegaly / Splenomegaly].
Skin: [Warm, dry / Warm, flushed, diaphoretic]. [No rash / Rash: petechial/purpuric/maculopapular/erythematous — distribution ___]. [No wound / Wound at ___ — erythema, warmth, drainage: ___]. [No indwelling lines / Port/PICC/line site: ___].
GU (if applicable): [Suprapubic tenderness: absent/present]. [Pelvic exam: deferred / performed — see note].
MSK: [Joints: no effusion / effusion at ___ — warm, erythematous].
Neurologic: Alert and oriented x4. No focal neurological deficits.`,

  "nausea":
`General: Alert and oriented x4. [No acute distress / Mild distress — nauseated]. [Retching noted / Not actively emitting]. Appears stated age.
Vital Signs: See triage vitals. SpO2 [__]% on room air. [Orthostatic vitals: obtained — see results / not obtained].
HEENT: Normocephalic, atraumatic. Pupils equal, round, reactive. [Scleral icterus: absent/present]. Mucous membranes [moist / dry — dehydration]. Oropharynx clear. [Dentition: intact / erosion of enamel noted].
Cardiovascular: Regular rate and rhythm. S1 S2 normal. No murmur. [No peripheral edema].
Respiratory: Clear to auscultation bilaterally. Breathing unlabored.
Abdomen: [Soft / Mild epigastric guarding]. [Nontender / Tenderness at ___]. [Non-distended / Distended]. Bowel sounds [present / hypoactive / hyperactive]. [No rebound tenderness / Rebound present]. [Murphy sign: negative/positive]. [No hepatomegaly / Hepatomegaly]. No pulsatile mass.
GU: [Suprapubic tenderness: absent/present]. [CVA tenderness: absent bilaterally / present — right/left].
Extremities: No cyanosis, clubbing, or edema.
Skin: [Warm, dry / Diaphoretic / Jaundiced]. [Good / Poor] skin turgor — mucous membranes [moist / dry]. No rash.
Neurologic: Alert and oriented x4. No focal neurological deficits.`,

  "leg pain":
`General: Alert and oriented x4. [No acute distress / Mild distress]. Ambulating [normally / with difficulty / non-weight-bearing]. Appears stated age.
Vital Signs: See triage vitals. SpO2 [__]% on room air. [Heart rate and respiratory rate: normal / tachycardia or tachypnea noted].
HEENT: Normocephalic, atraumatic. Oropharynx clear.
Cardiovascular: Regular rate and rhythm. S1 S2 normal. No murmur. Peripheral pulses [2+ bilaterally / diminished at ___].
Respiratory: [Clear to auscultation bilaterally / Tachypnea with labored breathing — possible PE]. Breathing [unlabored / mildly labored].
Abdomen: Soft, nontender, nondistended. Bowel sounds present.
Extremities — [RIGHT / LEFT] lower extremity:
  Erythema: [absent / present — extends ___ cm, borders: ___].
  Warmth: [absent / present compared to contralateral].
  Edema: [absent / 1+ pitting / 2+ pitting]. Calf circumference: [symmetric / R ___cm / L ___cm — differential ___cm].
  Tenderness: [absent / present — calf/popliteal/thigh/entire extremity].
  Palpable cord: [absent / present at ___].
  Skin: [intact / erythema with streaking / ulceration at ___].
  Distal pulses (DP/PT): [2+ / 1+ / absent]. Skin temperature: [warm / cool distally].
  Homan sign: [negative / positive — note: low sensitivity and specificity].
Contralateral extremity: [Normal / ___].
Neurologic: Alert and oriented x4. [Sensation intact bilaterally / diminished at ___]. No focal deficits.`,

  "weakness":
`General: Alert and oriented x4. [No acute distress / Appears fatigued]. [Facial asymmetry: noted / not observed]. Appears stated age.
Vital Signs: See triage vitals. SpO2 [__]% on room air. BP [bilateral arms: R ___ / L ___].
HEENT: Normocephalic, atraumatic. Pupils [equal, round, reactive — ___ mm / anisocoria — R ___mm / L ___mm]. [Ptosis: absent / present — right/left]. [Facial droop: absent / present — upper motor neuron pattern: forehead spared / lower motor neuron pattern: forehead involved — right/left]. Oropharynx clear. [Tongue: midline / deviated to right/left]. [Gaze: conjugate / deviated to right/left].
Neck: Supple. No carotid bruit. No JVD.
Cardiovascular: [Regular rate and rhythm / Irregular — AF as possible embolic source]. S1 S2 [normal / murmur: ___]. No rub.
Respiratory: Clear to auscultation bilaterally. Breathing unlabored.
Abdomen: Soft, nontender, nondistended. Bowel sounds present.
Neurologic: Alert and oriented x4. [NIHSS: ___]. Speech: [clear and fluent / dysarthric / expressive aphasia / receptive aphasia / global aphasia].
  CN II-XII: [Intact / Deficits: ___].
  Motor — UE: [R ___/5 / L ___/5]. [Pronator drift: negative / positive — right/left].
  Motor — LE: [R ___/5 / L ___/5].
  Handgrip: [R intact / L intact / asymmetric — R ___ / L ___].
  Sensation: [Intact to light touch bilaterally / Hemibody deficit — right/left / dermatomal pattern: ___].
  Coordination: [Finger-nose intact bilaterally / Dysmetria — right/left]. [Heel-shin intact / ataxic].
  Gait: [Normal / Hemiparetic — right/left / Ataxic / Deferred — safety concern].
  Reflexes: [2+ bilaterally symmetric / Hyperreflexia at ___ / Asymmetric]. [Babinski: negative / positive — right/left].
Skin: Warm, dry, intact. No rash.`,
};

// ── CC → canonical key lookup ─────────────────────────────────────────────────
function resolveCC(ccText) {
  if (!ccText?.trim()) return null;
  const lower = ccText.toLowerCase().trim();
  const keys = Object.keys(ROS_TEMPLATES);
  if (keys.includes(lower)) return lower;
  if (CC_ALIASES[lower] && ROS_TEMPLATES[CC_ALIASES[lower]]) return CC_ALIASES[lower];
  for (const key of keys) { if (lower.includes(key)) return key; }
  for (const [alias, target] of Object.entries(CC_ALIASES)) {
    if (lower.includes(alias) && ROS_TEMPLATES[target]) return target;
  }
  return null;
}

function toTitleCase(str) {
  return str.replace(/\w\S*/g, w => w[0].toUpperCase() + w.slice(1));
}

// ── Component ──────────────────────────────────────────────────────────────────
export function QuickNoteROSPEScaffolds({ cc, ros, setRos, exam, setExam }) {
  const [expanded,    setExpanded]    = useState(false);
  const [dismissed,   setDismissed]   = useState(null);
  const [rosInserted, setRosInserted] = useState(false);
  const [peInserted,  setPeInserted]  = useState(false);
  const [activeTab,   setActiveTab]   = useState("both");
  const [lastCC,      setLastCC]      = useState(null);

  const matched = useMemo(() => resolveCC(cc), [cc]);

  useEffect(() => {
    if (matched !== lastCC) {
      setLastCC(matched);
      if (matched !== dismissed) setDismissed(null);
    }
  }, [matched]);

  if (!matched || dismissed === matched) return null;

  const rosTemplate = ROS_TEMPLATES[matched] || "";
  const peTemplate  = PE_TEMPLATES[matched]  || "";
  const displayCC   = toTitleCase(matched);
  const hasRos      = ros?.trim().length > 0;
  const hasPe       = exam?.trim().length > 0;

  const doInsertRos = (mode) => {
    if (mode === "replace" || mode === "insert") setRos(rosTemplate);
    else if (mode === "prepend") setRos(rosTemplate + "\n\n" + (ros||"").trim());
    setRosInserted(true);
    setTimeout(() => setRosInserted(false), 2500);
  };

  const doInsertPe = (mode) => {
    if (mode === "replace" || mode === "insert") setExam(peTemplate);
    else if (mode === "prepend") setExam(peTemplate + "\n\n" + (exam||"").trim());
    setPeInserted(true);
    setTimeout(() => setPeInserted(false), 2500);
  };

  const S = {
    label:  { fontFamily:"'JetBrains Mono',monospace", fontSize:8,  fontWeight:700, letterSpacing:1,   textTransform:"uppercase" },
    label2: { fontFamily:"'JetBrains Mono',monospace", fontSize:7.5, fontWeight:600, letterSpacing:.5 },
    body:   { fontFamily:"'DM Sans',sans-serif",        fontSize:11, lineHeight:1.65 },
    mono:   { fontFamily:"'JetBrains Mono',monospace", fontSize:9.5, lineHeight:1.6 },
  };

  const InsertButtons = ({ hasContent, onInsert, onPrepend, onReplace, inserted, color, colorRgb }) => (
    <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginTop:6 }}>
      {!hasContent ? (
        <button onClick={onInsert}
          style={{ padding:"5px 12px", borderRadius:6, cursor:"pointer", ...S.body, fontWeight:700, fontSize:11,
            border:`1px solid rgba(${colorRgb},.5)`, background:`rgba(${colorRgb},.12)`, color }}>
          {inserted ? "✓ Inserted" : "↓ Insert Template"}
        </button>
      ) : (
        <>
          <button onClick={onReplace}
            style={{ padding:"5px 12px", borderRadius:6, cursor:"pointer", ...S.body, fontWeight:700, fontSize:11,
              border:`1px solid rgba(${colorRgb},.5)`, background:`rgba(${colorRgb},.12)`, color }}>
            {inserted ? "✓ Replaced" : "↩ Replace"}
          </button>
          <button onClick={onPrepend}
            style={{ padding:"5px 12px", borderRadius:6, cursor:"pointer", ...S.body, fontWeight:700, fontSize:11,
              border:`1px solid rgba(${colorRgb},.35)`, background:`rgba(${colorRgb},.06)`, color }}>
            ↑ Prepend
          </button>
        </>
      )}
    </div>
  );

  const TemplatePreview = ({ text }) => (
    <pre style={{ margin:0, ...S.mono, color:"var(--qn-txt2)",
      background:"rgba(5,15,30,.55)", borderRadius:7,
      padding:"10px 12px", border:"1px solid rgba(42,79,122,.25)",
      maxHeight:210, overflowY:"auto", whiteSpace:"pre-wrap", wordBreak:"break-word" }}>
      {text}
    </pre>
  );

  return (
    <div style={{ marginBottom:10, borderRadius:12, overflow:"hidden",
      background:"rgba(0,229,192,.03)", border:"1px solid rgba(0,229,192,.2)" }}>

      {/* Collapsed header */}
      <div style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 14px",
        borderBottom: expanded ? "1px solid rgba(0,229,192,.15)" : "none", cursor:"pointer" }}
        onClick={() => setExpanded(p => !p)}>

        <span style={{ ...S.label, color:"var(--qn-teal)", fontSize:9 }}>
          📋 ROS + PE — {displayCC}
        </span>

        <span style={{ ...S.label2, color:"var(--qn-teal)",
          background:"rgba(0,229,192,.1)", border:"1px solid rgba(0,229,192,.25)",
          borderRadius:4, padding:"1px 6px" }}>
          {hasRos && hasPe ? "Both fields populated — compare / replace"
            : hasRos ? "ROS populated · PE empty"
            : hasPe  ? "PE populated · ROS empty"
            : "One-click insert"}
        </span>

        <div style={{ flex:1 }} />

        {!expanded && (
          <>
            <button onClick={e => { e.stopPropagation(); doInsertRos("replace"); }}
              style={{ padding:"3px 10px", borderRadius:5, cursor:"pointer",
                ...S.label, fontSize:7, color:"var(--qn-teal)",
                background: rosInserted ? "rgba(61,255,160,.12)" : "rgba(0,229,192,.08)",
                border:`1px solid ${rosInserted ? "rgba(61,255,160,.4)" : "rgba(0,229,192,.3)"}` }}>
              {rosInserted ? "✓ ROS" : hasRos ? "↩ ROS" : "↓ ROS"}
            </button>
            <button onClick={e => { e.stopPropagation(); doInsertPe("replace"); }}
              style={{ padding:"3px 10px", borderRadius:5, cursor:"pointer",
                ...S.label, fontSize:7, color:"var(--qn-blue)",
                background: peInserted ? "rgba(61,255,160,.12)" : "rgba(59,158,255,.08)",
                border:`1px solid ${peInserted ? "rgba(61,255,160,.4)" : "rgba(59,158,255,.3)"}` }}>
              {peInserted ? "✓ PE" : hasPe ? "↩ PE" : "↓ PE"}
            </button>
          </>
        )}

        <button onClick={e => { e.stopPropagation(); setDismissed(matched); setExpanded(false); }}
          style={{ padding:"2px 8px", borderRadius:4, cursor:"pointer",
            ...S.label, fontSize:7, color:"var(--qn-txt4)",
            background:"transparent", border:"1px solid rgba(42,79,122,.35)" }}>
          ✕
        </button>

        <span style={{ color:"var(--qn-txt4)", fontSize:10 }}>{expanded ? "▲" : "▼"}</span>
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div style={{ padding:"12px 14px" }}>

          <div style={{ display:"flex", gap:5, marginBottom:10 }}>
            {[
              { key:"both", label:"Side by Side" },
              { key:"ros",  label:"ROS only" },
              { key:"pe",   label:"PE only" },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                style={{ padding:"4px 11px", borderRadius:6, cursor:"pointer", ...S.label, fontSize:7,
                  color: activeTab === key ? "var(--qn-teal)" : "var(--qn-txt4)",
                  background: activeTab === key ? "rgba(0,229,192,.1)" : "transparent",
                  border:`1px solid ${activeTab === key ? "rgba(0,229,192,.4)" : "rgba(42,79,122,.3)"}` }}>
                {label}
              </button>
            ))}
          </div>

          <div style={{ display:"grid",
            gridTemplateColumns: activeTab === "both" ? "1fr 1fr" : "1fr",
            gap:10 }}>

            {(activeTab === "both" || activeTab === "ros") && (
              <div style={{ padding:"11px 12px", borderRadius:9,
                background:"rgba(0,229,192,.04)", border:"1px solid rgba(0,229,192,.2)" }}>
                <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:7 }}>
                  <span style={{ ...S.label, color:"var(--qn-teal)", fontSize:8 }}>Review of Systems</span>
                  {hasRos && (
                    <span style={{ ...S.label2, fontSize:7, color:"var(--qn-gold)",
                      background:"rgba(245,200,66,.1)", border:"1px solid rgba(245,200,66,.25)",
                      borderRadius:3, padding:"1px 5px" }}>Field has content</span>
                  )}
                </div>
                <TemplatePreview text={rosTemplate} />
                <InsertButtons
                  hasContent={hasRos} inserted={rosInserted}
                  color="var(--qn-teal)" colorRgb="0,229,192"
                  onInsert={() => doInsertRos("insert")}
                  onReplace={() => doInsertRos("replace")}
                  onPrepend={() => doInsertRos("prepend")}
                />
              </div>
            )}

            {(activeTab === "both" || activeTab === "pe") && (
              <div style={{ padding:"11px 12px", borderRadius:9,
                background:"rgba(59,158,255,.04)", border:"1px solid rgba(59,158,255,.2)" }}>
                <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:7 }}>
                  <span style={{ ...S.label, color:"var(--qn-blue)", fontSize:8 }}>Physical Exam</span>
                  {hasPe && (
                    <span style={{ ...S.label2, fontSize:7, color:"var(--qn-gold)",
                      background:"rgba(245,200,66,.1)", border:"1px solid rgba(245,200,66,.25)",
                      borderRadius:3, padding:"1px 5px" }}>Field has content</span>
                  )}
                </div>
                <TemplatePreview text={peTemplate} />
                <InsertButtons
                  hasContent={hasPe} inserted={peInserted}
                  color="var(--qn-blue)" colorRgb="59,158,255"
                  onInsert={() => doInsertPe("insert")}
                  onReplace={() => doInsertPe("replace")}
                  onPrepend={() => doInsertPe("prepend")}
                />
              </div>
            )}
          </div>

          {activeTab === "both" && (
            <div style={{ marginTop:9, display:"flex", alignItems:"center", gap:8 }}>
              <button
                onClick={() => { doInsertRos(hasRos ? "replace" : "insert"); doInsertPe(hasPe ? "replace" : "insert"); }}
                style={{ padding:"5px 16px", borderRadius:7, cursor:"pointer",
                  ...S.body, fontWeight:700, fontSize:11,
                  border:"1px solid rgba(155,109,255,.45)", background:"rgba(155,109,255,.1)",
                  color:"var(--qn-purple)" }}>
                {(rosInserted && peInserted) ? "✓ Both Inserted" : `↓ Insert Both ${hasRos || hasPe ? "(Replace)" : ""}`}
              </button>
              <span style={{ ...S.label, fontSize:7, color:"rgba(107,158,200,.4)" }}>
                Replaces existing content if present
              </span>
            </div>
          )}

          <div style={{ marginTop:9, ...S.label, fontSize:7, color:"rgba(107,158,200,.35)" }}>
            Templates use bracket placeholders — fill in findings after inserting · ROS for {displayCC} · AMA/ACEP format
          </div>
        </div>
      )}
    </div>
  );
}