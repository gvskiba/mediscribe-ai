// QuickNoteTemplates.js
// ROS and PE documentation templates for QuickNote
// Imported by QuickNote.jsx — edit templates here, not in the main component
//
// Template format: { id, label, short, text }
// text uses \n to separate system lines
// ____ marks fields the physician fills in after insertion
// [or] marks toggle choices rendered by SmartFill
//
// ids 1–9: keyboard shortcut accessible (press number in picker)
// ids 10+: click-only in picker (still fully accessible)

// ─── ROS TEMPLATES ───────────────────────────────────────────────────────────
export const ROS_TEMPLATES = [
  { id:1, label:"Normal (All Systems)", short:"Normal",
    text:"Constitutional: Denies fever, chills, night sweats, weight loss, fatigue.\nCardiovascular: Denies chest pain, palpitations, orthopnea, PND, syncope, leg swelling.\nRespiratory: Denies dyspnea, cough, hemoptysis, wheezing.\nGI: Denies nausea, vomiting, abdominal pain, diarrhea, constipation, blood in stool.\nGU: Denies dysuria, hematuria, frequency, urgency, discharge.\nMusculoskeletal: Denies joint pain, swelling, back pain, extremity pain.\nNeuro: Denies headache, dizziness, focal weakness, numbness, vision changes, speech changes.\nPsychiatric: Denies depression, anxiety, SI/HI, recent behavioral changes.\nSkin: Denies rash, pruritus, new lesions.\nEndocrine: Denies polyuria, polydipsia, heat/cold intolerance." },

  { id:2, label:"Chest Pain", short:"CP",
    text:"Constitutional: Denies fever, chills, diaphoresis.\nCardiovascular: Chest pain as described; denies palpitations, syncope, orthopnea, PND, leg swelling.\nRespiratory: Denies dyspnea at rest, cough, hemoptysis.\nGI: Denies nausea, vomiting, abdominal pain.\nMusculoskeletal: Denies chest wall tenderness, arm/jaw pain.\nNeuro: Denies dizziness, headache, focal weakness." },

  { id:3, label:"Dyspnea", short:"SOB",
    text:"Constitutional: Denies fever, chills, night sweats.\nRespiratory: Shortness of breath as described; denies hemoptysis, wheezing.\nCardiovascular: Denies chest pain, palpitations, orthopnea, PND, leg swelling.\nAllergy/Immunology: Denies new exposures, urticaria, angioedema.\nNeuro: Denies dizziness, syncope." },

  { id:4, label:"Abdominal Pain", short:"Abd",
    text:"Constitutional: Denies fever, chills, anorexia, weight loss.\nGI: Abdominal pain as described; denies hematemesis, melena, hematochezia, diarrhea, constipation, jaundice.\nGU: Denies dysuria, hematuria, vaginal/penile discharge.\nGyn: Denies vaginal bleeding; LMP ____.\nNeuro: Denies dizziness." },

  { id:5, label:"Headache", short:"HA",
    text:"Constitutional: Denies fever, neck stiffness, photophobia, phonophobia.\nNeuro: Headache as described; denies diplopia, focal weakness, numbness, speech changes, ataxia, seizure, thunderclap onset.\nCardiovascular: Denies palpitations, syncope.\nENT: Denies visual changes, rhinorrhea, ear pain, sinus pressure.\nMSK: Denies neck pain, jaw claudication." },

  { id:6, label:"Syncope", short:"Sync",
    text:"Constitutional: Denies fever, chills.\nCardiovascular: Denies palpitations, chest pain, prior syncope; prodrome of ____.\nNeuro: Denies focal weakness, post-ictal confusion, tongue biting, incontinence, aura.\nRespiratory: Denies dyspnea, exertional symptoms.\nGI: Denies nausea, vomiting, diarrhea (vasovagal prodrome).\nEndocrine: Denies recent medication changes, insulin use, poor oral intake." },

  { id:7, label:"AMS", short:"AMS",
    text:"Constitutional: Denies fever, chills; baseline mental status: ____.\nNeuro: Altered mentation as described; denies focal weakness, seizure, headache, recent head trauma.\nCardiovascular: Denies palpitations, prior cardiac history.\nGI: Denies nausea, vomiting.\nPsychiatric: Denies SI/HI; prior psychiatric history: ____.\nToxicology: Substance use: ____; last known normal: ____.\nEndocrine: Denies polyuria, polydipsia, insulin/oral hypoglycemic use." },

  { id:8, label:"Extremity / MSK", short:"Ext",
    text:"Constitutional: Denies fever, chills.\nMSK: Pain/injury as described; denies deformity, crepitus, locking, instability.\nVascular: Denies calf swelling, redness, cord-like tenderness (DVT symptoms).\nNeuro: Denies numbness, tingling, weakness distal to injury.\nSkin: Denies lacerations, open wounds, signs of infection, skin breakdown." },

  { id:9, label:"Fever / Sepsis", short:"Sepsis",
    text:"Constitutional: Fever as described; denies rigors, weight loss, night sweats.\nRespiratory: Denies cough, dyspnea, pleuritic chest pain, sputum production.\nGU: Denies dysuria, frequency, urgency, flank pain, discharge.\nGI: Denies nausea, vomiting, diarrhea, abdominal pain.\nSkin: Denies rash, wound, cellulitis, skin breakdown.\nNeuro: Denies headache, neck stiffness, photophobia, focal neurologic deficit.\nMSK: Denies joint pain, joint swelling." },

  { id:10, label:"Back Pain", short:"Back",
    text:"Constitutional: Denies fever, chills, unexplained weight loss, night sweats.\nMSK: Back pain as described; denies prior spinal surgery, osteoporosis, malignancy history.\nNeuro: Denies bilateral leg weakness, saddle anesthesia, bowel/bladder incontinence or retention (cauda equina symptoms); denies numbness or tingling in extremities.\nVascular: Denies pulsatile abdominal mass, abdominal pain radiating to back.\nGI: Denies abdominal pain, change in bowel habits.\nGU: Denies flank pain, hematuria, dysuria." },

  { id:11, label:"Urinary / GU", short:"GU",
    text:"Constitutional: Denies fever, chills, rigors.\nGU: Urinary symptoms as described; denies flank pain, hematuria, penile/vaginal discharge, scrotal/pelvic pain.\nGyn: Denies vaginal discharge, vaginal bleeding; LMP ____; pregnancy test: ____.\nGI: Denies nausea, vomiting, abdominal pain.\nMSK: Denies back pain, CVA tenderness on history.\nNeuro: Denies confusion, altered mental status." },

  { id:12, label:"DVT / PE", short:"DVT",
    text:"Constitutional: Denies fever, chills.\nRespiratory: Dyspnea/pleuritic chest pain as described; denies hemoptysis, cough.\nCardiovascular: Denies chest tightness, palpitations, syncope.\nExtremity: Leg pain/swelling as described; denies bilateral leg swelling, prior DVT/PE.\nHistory: Denies recent surgery (within 90 days), prolonged immobility, pregnancy, active malignancy, prior clotting disorder.\nMedications: Denies oral contraceptive/hormone use." },

  { id:13, label:"Allergic Reaction / Anaphylaxis", short:"Allergy",
    text:"Constitutional: Denies fever, chills.\nAllergy/Immunology: Reaction as described; denies prior anaphylaxis requiring epinephrine, known allergies to ____.\nRespiratory: Denies stridor, wheezing, throat tightness, voice change.\nCardiovascular: Denies hypotension, syncope, palpitations.\nSkin: Denies urticaria, angioedema involving lips/tongue/throat.\nGI: Denies nausea, vomiting, abdominal cramping." },

  { id:14, label:"Pelvic Pain / OB-GYN", short:"Pelvic",
    text:"Constitutional: Denies fever, chills.\nGyn: Pelvic/lower abdominal pain as described; LMP ____; pregnancy test ____; denies abnormal vaginal discharge, vaginal bleeding, dyspareunia.\nGU: Denies dysuria, hematuria, urinary frequency.\nGI: Denies nausea, vomiting, diarrhea, constipation, abdominal pain.\nNeuro: Denies lightheadedness, syncope.\nEndocrine: Denies cycle irregularity, hormonal changes." },

  { id:15, label:"Overdose / Toxicology", short:"Tox",
    text:"Constitutional: Denies fever; time of ingestion: ____; substance(s): ____; quantity estimated: ____; coingestants: ____; intentional vs. unintentional: ____.\nNeuro: Denies seizure, focal weakness, altered baseline; last known normal: ____.\nCardiovascular: Denies chest pain, palpitations, syncope.\nRespiratory: Denies aspiration, dyspnea.\nGI: Denies hematemesis; vomiting since ingestion: yes/no.\nPsychiatric: SI/HI: yes/no; prior attempts: yes/no; prior psychiatric history: ____." },

  { id:16, label:"Eye Complaint", short:"Eye",
    text:"Constitutional: Denies fever, chills.\nOphthalmology: Eye complaint as described; denies vision loss, diplopia, flashes/floaters, photophobia, halos around lights; contact lens use: yes/no; chemical exposure: yes/no.\nENT: Denies sinus pain, rhinorrhea, ear pain.\nNeuro: Denies headache, facial numbness, facial droop.\nSkin: Denies periorbital rash, facial rash." },

  { id:17, label:"ENT — Ear / Throat", short:"ENT",
    text:"Constitutional: Denies fever, chills; fever by history: yes/no.\nENT: Complaint as described; denies stridor, drooling, trismus, voice change (hot-potato voice), dysphagia, neck stiffness.\nRespiratory: Denies dyspnea, wheezing, stridor.\nNeuro: Denies headache, facial numbness, dizziness.\nSkin: Denies facial swelling, neck swelling, rash.\nGI: Denies nausea, vomiting." },

  { id:18, label:"Psychiatric / SI", short:"Psych",
    text:"Constitutional: Denies medical illness contributing to symptoms; denies fever, recent medication change.\nPsychiatric: Presenting complaint as described; SI: present/absent — plan/means/intent: ____; HI: present/absent; AH/VH: present/absent; prior suicide attempts: yes/no; prior psychiatric hospitalizations: yes/no.\nNeuro: Denies focal weakness, seizure, headache, confusion beyond baseline.\nToxicology: Substance use: ____; last use: ____.\nMedications: Psychiatric medications: ____; compliance: yes/no.\nSocial: Current safety concerns: ____." },

  { id:19, label:"Skin / Wound / Infection", short:"Skin",
    text:"Constitutional: Denies fever, chills, rigors, night sweats.\nSkin: Lesion/wound as described; denies rapid progression, proximal streaking, bullae, skin necrosis, crepitus.\nImmunology: Denies immunocompromised state, diabetes, chronic steroid use, prior similar infections.\nVascular: Denies peripheral vascular disease, poor wound healing history.\nMSK: Denies joint involvement, bone pain.\nNeuro: Denies numbness, tingling in affected area." },
];

// ─── PE TEMPLATES ────────────────────────────────────────────────────────────
export const PE_TEMPLATES = [
  { id:1, label:"Normal (All Systems)", short:"Normal",
    text:"General: Alert, oriented x3, no acute distress, well-appearing.\nVitals: As documented.\nHEENT: Normocephalic, atraumatic; PERRL, EOMI; oropharynx clear.\nNeck: Supple, no JVD, no lymphadenopathy, no meningismus.\nCV: RRR, no murmurs/rubs/gallops; distal pulses intact bilaterally.\nRespiratory: CTAB, no wheeze/rales/rhonchi; no respiratory distress.\nAbdomen: Soft, non-tender, non-distended; normoactive bowel sounds.\nExtremities: No cyanosis, clubbing, or edema; no calf tenderness.\nSkin: Warm, dry, no rash.\nNeuro: A&Ox3, CN II-XII grossly intact, strength 5/5 all extremities, sensation intact." },

  { id:2, label:"Chest Pain", short:"CP",
    text:"General: Alert, in mild distress secondary to pain.\nVitals: As documented.\nHEENT: No diaphoresis; JVP ____.\nCV: RRR, no murmurs/rubs/gallops; no S3/S4; peripheral pulses equal bilaterally; no reproducible chest wall tenderness.\nRespiratory: CTAB, no wheeze; no crackles suggesting pulmonary edema; symmetric chest rise.\nAbdomen: Soft, non-tender, non-distended.\nExtremities: No calf tenderness; no lower extremity edema.\nSkin: No mottling, no diaphoresis.\nNeuro: Alert, oriented, no focal deficits." },

  { id:3, label:"Abdominal", short:"Abd",
    text:"General: Alert, uncomfortable; lying still [or] writhing.\nVitals: As documented.\nAbdomen: Soft [or] Rigid; tender in ____ quadrant(s); guarding absent [or] present; rebound absent [or] present; Murphy sign negative [or] positive; McBurney point tenderness negative [or] positive; Rovsing sign negative [or] positive; bowel sounds normoactive [or] diminished [or] absent.\nGU/Flank: No CVA tenderness bilaterally.\nPelvic (if indicated): ____.\nExtremities: No peripheral edema.\nSkin: No jaundice, no rash." },

  { id:4, label:"Neuro / Stroke", short:"Neuro",
    text:"General: Alert [or] altered; oriented x____.\nVitals: As documented; last known well: ____.\nHEENT: PERRL ____/____ mm; EOMI [or] gaze deviation to ____; facial droop absent [or] present ____.\nSpeech: Clear [or] dysarthric [or] aphasic.\nMotor: No drift [or] drift present in ____; strength ____ upper extremity, ____ lower extremity.\nSensory: Intact bilaterally [or] deficit in ____.\nCoordination: Finger-nose intact [or] dysmetria ____.\nGait: Steady [or] ataxic [or] unable to assess.\nReflexes: Symmetric; Babinski negative [or] positive ____.\nNeglect: Absent [or] present ____." },

  { id:5, label:"Extremity / MSK", short:"MSK",
    text:"General: Alert, ambulatory [or] non-weight-bearing.\nVitals: As documented.\nAffected Extremity: Inspection — swelling absent [or] present; ecchymosis absent [or] present; deformity absent [or] present; point tenderness over ____; ROM: full active/passive [or] limited due to ____; neurovascular exam distal — sensation intact, cap refill <2s, pulses 2+ ____.\nContralateral Extremity: Normal for comparison.\nSkin: Intact, no open wounds, no lacerations, no signs of infection." },

  { id:6, label:"Trauma Primary Survey", short:"Trauma",
    text:"Airway: Patent; self-maintained [or] assisted.\nBreathing: Spontaneous, symmetric chest rise; breath sounds equal bilaterally; trachea midline; no open chest wounds.\nCirculation: Radial pulses palpable; skin warm [or] cool/mottled; no active external hemorrhage identified.\nDisability: GCS ____; pupils ____/____ reactive; moving all extremities [or] deficit in ____.\nExposure/Secondary Survey: Logrolled — no step-off, no midline spinal tenderness. HEENT: ____. Chest: ____. Abdomen: ____. Pelvis: stable [or] unstable to compression. Extremities: ____. Skin: ____." },

  { id:7, label:"Respiratory / Dyspnea", short:"Resp",
    text:"General: Alert; speaking in full sentences [or] labored; using accessory muscles: no [or] yes; tripod positioning: no [or] yes.\nVitals: As documented; SpO2 ____ on ____.\nHEENT: No stridor; no lip/nail cyanosis; no nasal flaring.\nNeck: No JVD; no tracheal deviation; no cervical lymphadenopathy.\nCV: RRR, no murmurs; no S3 gallop.\nRespiratory: Inspection — ____ retractions; Percussion — resonant [or] dull ____; Auscultation — CTAB [or] decreased breath sounds at ____; wheeze absent [or] present; crackles absent [or] present; rhonchi absent [or] present.\nExtremities: No peripheral edema, no clubbing." },

  { id:8, label:"Psychiatric / Behavioral", short:"Psych",
    text:"General: Alert, cooperative [or] agitated; dressed ____; hygiene ____.\nBehavior: Calm [or] restless/pacing; eye contact appropriate [or] poor; psychomotor activity normal [or] ____.\nSpeech: Normal rate and volume [or] ____.\nMood: Patient reports ____; affect ____.\nThought Process: Linear and goal-directed [or] ____.\nThought Content: No SI/HI [or] SI present — plan/intent/means: ____.\nPerception: No AH/VH reported [or] ____.\nCognition: A&Ox3; memory grossly intact; judgment ____; insight ____.\nCV/Resp: No acute medical distress; vitals as documented." },

  { id:9, label:"Headache / Meningismus", short:"HA",
    text:"General: Alert; in ____ distress; photophobia absent [or] present; phonophobia absent [or] present.\nVitals: As documented.\nHEENT: Normocephalic, atraumatic; PERRL, EOMI intact; no papilledema on fundoscopic exam [or] not performed; temporal artery tenderness absent [or] present.\nNeck: Supple; nuchal rigidity absent [or] present; Kernig sign negative [or] positive; Brudzinski sign negative [or] positive.\nNeuro: A&Ox3; CN II-XII intact; no focal motor or sensory deficits; gait steady [or] ataxic.\nSkin: No petechiae, no purpura." },

  { id:10, label:"Syncope", short:"Sync",
    text:"General: Alert, well-appearing [or] mildly confused post-event; no acute distress at rest.\nVitals: As documented; orthostatic vitals: ____.\nHEENT: No tongue laceration; no facial injury; PERRL.\nCV: RRR [or] irregular; no murmurs/rubs/gallops; carotid bruits absent [or] present; peripheral pulses intact bilaterally.\nRespiratory: CTAB, no respiratory distress.\nNeuro: A&Ox3; CN II-XII grossly intact; no focal weakness; gait steady [or] mildly unsteady.\nSkin: No pallor, no diaphoresis; no signs of injury from fall.\nExtremities: No calf tenderness; no peripheral edema." },

  { id:11, label:"Sepsis / Infectious", short:"Sepsis",
    text:"General: Alert [or] altered; ill-appearing; flushed [or] diaphoretic [or] pale.\nVitals: As documented; temperature: ____.\nHEENT: Oropharynx clear [or] ____; no meningismus.\nNeck: Supple; no nuchal rigidity; no lymphadenopathy [or] lymphadenopathy ____.\nCV: Tachycardic [or] RRR; no murmurs; peripheral pulses ____; cap refill ____.\nRespiratory: CTAB [or] decreased/crackles at ____; no respiratory distress [or] mild/moderate respiratory distress.\nAbdomen: Soft, non-tender [or] tender in ____; no peritoneal signs.\nGU/Flank: No CVA tenderness [or] CVA tenderness ____.\nSkin: Warm [or] cool/mottled; no rash [or] rash ____; no cellulitis identified [or] cellulitis ____.\nExtremities: No joint swelling; no edema." },

  { id:12, label:"Back Pain", short:"Back",
    text:"General: Alert, ambulatory [or] in moderate distress with movement.\nVitals: As documented.\nSpine: Lumbar midline tenderness absent [or] present at ____; paraspinal muscle spasm absent [or] present; step-off deformity absent [or] present; CVAT absent [or] present.\nNeurologic: Lower extremity strength 5/5 bilateral [or] weakness ____; sensation intact bilateral lower extremities [or] deficit ____; reflexes symmetric; Babinski negative bilaterally; straight-leg raise negative [or] positive at ____.\nRectal tone (if indicated): ____.\nAbdomen: Soft, non-tender; no pulsatile mass palpated.\nExtremities: No lower extremity edema; peripheral pulses intact." },

  { id:13, label:"Urinary / Flank", short:"GU",
    text:"General: Alert; in ____ distress; uncomfortable [or] writhing with flank/pelvic pain.\nVitals: As documented.\nAbdomen: Soft; lower abdominal/suprapubic tenderness absent [or] present; no guarding, no rebound.\nGU/Flank: CVA tenderness absent [or] present ____; suprapubic tenderness absent [or] present.\nPelvic (if indicated): ____.\nSkin: No genital lesions, no discharge observed on exam [or] ____.\nExtremities: No peripheral edema." },

  { id:14, label:"Allergic Reaction / Anaphylaxis", short:"Allergy",
    text:"General: Alert [or] altered; in ____ distress; anxious [or] calm.\nVitals: As documented; blood pressure ____; HR ____.\nHEENT: Lips — normal [or] angioedema present; tongue — normal [or] angioedema present; oropharynx — clear [or] swollen/erythematous; voice — normal [or] hoarse/muffled; uvula midline.\nNeck: No stridor on auscultation [or] stridor present; no tracheal deviation.\nRespiratory: Clear [or] wheeze present; no respiratory distress [or] mild/moderate/severe distress; SpO2 ____.\nSkin: Urticaria absent [or] present (diffuse [or] localized to ____); erythema absent [or] present; no mottling.\nExtremities: No angioedema of extremities [or] present." },

  { id:15, label:"Eye", short:"Eye",
    text:"General: Alert, in ____ distress secondary to eye discomfort.\nVitals: As documented.\nOphthalmology — Affected Eye (____): Visual acuity ____; lid — normal [or] swollen/erythematous; conjunctiva — clear [or] injected/chemosis; cornea — clear [or] fluorescein uptake present at ____; anterior chamber — deep and quiet [or] hyphema/hypopyon present; PERRL — yes [or] no; EOMI — intact [or] limited in ____; fundus — normal [or] ____.\nContralateral Eye: ____.\nSkin: No periorbital cellulitis [or] periorbital erythema/edema present." },

  { id:16, label:"ENT — Ear / Throat", short:"ENT",
    text:"General: Alert; in ____ distress; no drooling; no stridor; voice normal [or] muffled/hoarse.\nVitals: As documented.\nENT: External ear — normal [or] ____; TM — pearly gray, landmarks intact [or] erythematous/bulging/perforated ____; oropharynx — clear [or] erythematous; tonsils — normal [or] enlarged/exudate; peritonsillar space — symmetric [or] asymmetric/bulging ____; uvula — midline [or] deviated; dentition ____.\nNeck: Supple; no meningismus; anterior cervical lymphadenopathy absent [or] present; no neck mass; trachea midline.\nRespiratory: No stridor on auscultation; CTAB." },

  { id:17, label:"Pelvic / OB-GYN", short:"Pelvic",
    text:"General: Alert, in ____ distress; no acute hemodynamic compromise.\nVitals: As documented.\nAbdomen: Soft; lower abdominal/pelvic tenderness present [or] absent; no guarding; no rebound; uterine fundal height (if pregnant): ____.\nPelvic Exam: External — normal [or] ____; vaginal vault — no abnormal discharge [or] discharge ____; cervix — closed os [or] open os; CMT absent [or] present; uterine tenderness absent [or] present; adnexal tenderness absent [or] present ____; adnexal mass absent [or] present ____.\nGU: No CVA tenderness bilaterally.\nSkin: No rash; no vaginal/labial lesions observed." },

  { id:18, label:"Skin / Wound / Abscess", short:"Skin",
    text:"General: Alert; in ____ distress.\nVitals: As documented; temperature ____.\nSkin — Affected Area: Location: ____; size: ____cm x ____cm; erythema: present [or] absent; warmth: present [or] absent; fluctuance: present [or] absent; induration: present [or] absent; skin breakdown/ulceration: absent [or] present; bullae/vesicles: absent [or] present; crepitus on palpation: absent [or] present; proximal lymphangitic streaking: absent [or] present.\nLymph Nodes: Regional lymphadenopathy absent [or] present ____.\nNeuro: Sensation intact in affected area [or] diminished.\nVascular: Capillary refill <2s; pulses intact distal to wound." },
];