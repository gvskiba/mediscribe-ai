// QuickNoteTemplates.js
// ROS and PE documentation templates for QuickNote
// Imported by QuickNote.jsx — edit templates here, not in the main component
//
// Template format: { id, label, short, text }
// text uses \n to separate system lines
// ____ marks fields the physician fills in after insertion

// ─── ROS TEMPLATES ───────────────────────────────────────────────────────────
export const ROS_TEMPLATES = [
  { id:1, label:"Chest Pain",     short:"CP",
    text:"Constitutional: Denies fever, chills, diaphoresis.\nCardiovascular: Chest pain as described; denies palpitations, syncope, orthopnea, PND, leg swelling.\nRespiratory: Denies dyspnea at rest, cough, hemoptysis.\nGI: Denies nausea, vomiting, abdominal pain.\nMusculoskeletal: Denies wall tenderness, arm/jaw pain.\nNeuro: Denies dizziness, headache, focal weakness." },
  { id:2, label:"Dyspnea",        short:"SOB",
    text:"Constitutional: Denies fever, chills, night sweats.\nRespiratory: Shortness of breath as described; denies hemoptysis, wheezing.\nCardiovascular: Denies chest pain, palpitations, orthopnea, PND, leg swelling.\nAllergy: Denies new exposures, urticaria.\nNeuro: Denies dizziness, syncope." },
  { id:3, label:"Abdominal Pain", short:"Abd",
    text:"Constitutional: Denies fever, chills, anorexia, weight loss.\nGI: Abdominal pain as described; denies hematemesis, melena, hematochezia, diarrhea, constipation, jaundice.\nGU: Denies dysuria, hematuria, vaginal/penile discharge.\nGyn: Denies vaginal bleeding, LMP ____.\nNeuro: Denies dizziness." },
  { id:4, label:"Headache",       short:"HA",
    text:"Constitutional: Denies fever, neck stiffness, photophobia.\nNeuro: Headache as described; denies diplopia, focal weakness, numbness, speech changes, ataxia, seizure.\nCardiovascular: Denies palpitations, syncope.\nENT: Denies visual changes, rhinorrhea, ear pain.\nMSK: Denies neck pain, jaw claudication." },
  { id:5, label:"Syncope",        short:"Sync",
    text:"Constitutional: Denies fever, chills.\nCardiovascular: Denies palpitations, chest pain, prior syncope; prodrome of ____.\nNeuro: Denies focal weakness, post-ictal confusion, tongue biting, incontinence.\nRespiratory: Denies dyspnea.\nGI: Denies nausea, vomiting, diarrhea (vasovagal prodrome)." },
  { id:6, label:"AMS",            short:"AMS",
    text:"Constitutional: Denies fever, chills; baseline mental status: ____.\nNeuro: Altered mentation as described; denies focal weakness, seizure, headache.\nCardiovascular: Denies palpitations.\nGI: Denies nausea, vomiting.\nPsychiatric: Denies SI/HI; psychiatric history: ____.\nToxicology: Substance use: ____." },
  { id:7, label:"Extremity",      short:"Ext",
    text:"Constitutional: Denies fever, chills.\nMSK: Pain/injury as described; denies deformity, crepitus, neurovascular symptoms distal.\nVascular: Denies calf swelling, redness, cord-like tenderness (DVT symptoms).\nNeuro: Denies numbness, tingling, weakness distal to injury.\nSkin: Denies lacerations, open wounds, signs of infection." },
  { id:8, label:"Fever / Sepsis", short:"Sepsis",
    text:"Constitutional: Fever as described; denies rigors, weight loss.\nRespiratory: Denies cough, dyspnea, pleuritic pain.\nGU: Denies dysuria, frequency, flank pain.\nGI: Denies nausea, vomiting, diarrhea, abdominal pain.\nSkin: Denies rash, wound, cellulitis.\nNeuro: Denies headache, neck stiffness, photophobia, focal deficit." },
];

// ─── PE TEMPLATES ────────────────────────────────────────────────────────────
export const PE_TEMPLATES = [
  { id:1, label:"Normal Multisystem", short:"Normal",
    text:"General: Alert, oriented x3, no acute distress, well-appearing.\nVitals: As documented.\nHEENT: Normocephalic, atraumatic; PERRL, EOMI; oropharynx clear.\nNeck: Supple, no JVD, no lymphadenopathy, no meningismus.\nCV: RRR, no murmurs/rubs/gallops; distal pulses intact bilaterally.\nRespiratory: CTAB, no wheeze/rales/rhonchi; no respiratory distress.\nAbdomen: Soft, non-tender, non-distended; normoactive bowel sounds.\nExtremities: No cyanosis, clubbing, or edema; no calf tenderness.\nSkin: Warm, dry, no rash.\nNeuro: A&Ox3, CN II-XII grossly intact, strength 5/5 all extremities, sensation intact." },
  { id:2, label:"Chest Pain",        short:"CP",
    text:"General: Alert, in mild distress secondary to pain.\nVitals: As documented.\nHEENT: No diaphoresis, JVP ____.\nCV: RRR, no murmurs/rubs/gallops; no S3/S4; peripheral pulses equal bilaterally.\nRespiratory: CTAB, no wheeze; no crackles suggesting pulmonary edema.\nAbdomen: Soft, non-tender, non-distended.\nExtremities: No calf tenderness; no lower extremity edema.\nSkin: No mottling, no diaphoresis.\nNeuro: Alert, no focal deficits." },
  { id:3, label:"Abdominal",         short:"Abd",
    text:"General: Alert, uncomfortable; lying still [or] writhing.\nVitals: As documented.\nAbdomen: Soft [or] Rigid; tender in ____ quadrant(s); no guarding, no rebound [or] guarding/rebound present; Murphy sign negative [or] positive; McBurney tenderness negative [or] positive; bowel sounds normoactive [or] diminished.\nGU: No CVA tenderness bilaterally.\nPelvic (if applicable): ____.\nExtremities: No peripheral edema.\nSkin: No jaundice, no rash." },
  { id:4, label:"Neuro / Stroke",    short:"Neuro",
    text:"General: Alert [or] altered; oriented x____.\nVitals: As documented.\nHEENT: PERRL ____/____ mm; EOMI [or] gaze deviation to ____; facial droop ____ present/absent.\nSpeech: Clear [or] dysarthric/aphasic.\nMotor: Drift absent [or] drift present in ____; strength ____ upper extremity, ____ lower extremity.\nSensory: Intact bilaterally [or] deficit in ____.\nCoordination: Finger-nose intact [or] dysmetria ____.\nGait: Steady [or] ataxic.\nReflexes: Symmetric; Babinski negative [or] positive ____.\nNeglect: Absent [or] present ____." },
  { id:5, label:"Extremity / MSK",   short:"MSK",
    text:"General: Alert, ambulatory [or] non-weight-bearing.\nVitals: As documented.\nAffected Extremity: Inspection — swelling/ecchymosis/deformity absent [or] present; tenderness over ____; ROM limited [or] full active/passive; neurovascular exam distal — sensation intact, cap refill <2s, pulses 2+ ____.\nContralateral Extremity: Normal for comparison.\nSkin: Intact, no open wounds, no lacerations.\nSpecial Tests: ____." },
  { id:6, label:"Trauma Primary",    short:"Trauma",
    text:"Airway: Patent; self-maintained [or] assisted.\nBreathing: Spontaneous, symmetric chest rise; breath sounds bilateral; trachea midline.\nCirculation: Radial pulses palpable; skin warm/cool; no external hemorrhage identified.\nDisability: GCS ____; pupils ____/____ reactive; moving all extremities.\nExposure: Logrolled — no step-off, no midline tenderness. HEENT: ____. Chest: ____. Abdomen: ____. Pelvis: ____. Extremities: ____. Skin: ____." },
  { id:7, label:"Respiratory",       short:"Resp",
    text:"General: Alert; speaking in full sentences [or] labored speech; using accessory muscles? No [or] Yes.\nVitals: As documented; SpO2 ____ on ____.\nHEENT: No stridor, no lip cyanosis.\nNeck: No JVD, no tracheal deviation.\nCV: RRR, no murmurs.\nRespiratory: Inspection — ____ retractions; Percussion — resonant [or] dull ____; Auscultation — CTAB [or] decreased at ____, wheeze present [or] absent, crackles present [or] absent.\nExtremities: No peripheral edema, no clubbing." },
  { id:8, label:"Psychiatric",       short:"Psych",
    text:"General: Alert, cooperative [or] agitated; dressed ____, hygiene ____.\nBehavior: Calm [or] restless/pacing; eye contact appropriate [or] poor.\nSpeech: Normal rate and volume [or] ____.\nMood: Patient reports ____; affect ____.\nThought Process: Linear and goal-directed [or] ____.\nThought Content: No SI/HI [or] SI present — plan/intent ____.\nPerception: No AH/VH reported [or] ____.\nCognition: A&Ox3; judgment and insight ____.\nCV/Resp: No acute distress; vitals as documented." },
];
