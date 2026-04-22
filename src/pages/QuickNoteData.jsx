// QuickNoteData.js
// Chief Complaint categories, structured CC phrases, and hub routing map for QuickNote
// Imported by QuickNote.jsx — edit CC data and hub links here

// ─── CHIEF COMPLAINT CATEGORIES ─────────────────────────────────────────────
// text: structured phrase inserted into CC field; ___ = free-text blank;
//       option/option = toggle choices rendered by SmartFill bar
export const CC_CATEGORIES = [
  { id:"cardiac", label:"Cardiac / Pulm", color:"#ff6b6b", ccs:[
    { label:"Chest pain",            text:"Chest pain — onset: ___, character: ___, severity: ___/10, radiation: ___, exertional: yes/no" },
    { label:"Shortness of breath",   text:"Shortness of breath — onset: ___, severity: mild/moderate/severe, exertional: yes/no, orthopnea: yes/no" },
    { label:"Palpitations",          text:"Palpitations — onset: ___, duration: ___, associated syncope: yes/no, prior episodes: yes/no" },
    { label:"Syncope",               text:"Syncope — onset: ___, prodrome: ___, duration of LOC: ___, injuries: ___" },
    { label:"DVT / leg swelling",    text:"Leg swelling/pain — side: L/R, onset: ___, calf tenderness: yes/no, recent travel/immobility: yes/no" },
    { label:"Hemoptysis",            text:"Hemoptysis — onset: ___, quantity: ___, prior episodes: yes/no, anticoagulation: yes/no" },
  ]},
  { id:"abdominal", label:"Abdominal / GI", color:"#ff9f43", ccs:[
    { label:"Abdominal pain",        text:"Abdominal pain — location: ___, onset: ___, character: ___, severity: ___/10, radiation: ___" },
    { label:"Nausea / vomiting",     text:"Nausea and vomiting — onset: ___, frequency: ___, blood in emesis: yes/no, last PO: ___" },
    { label:"GI bleed",              text:"GI bleeding — hematemesis/melena/hematochezia: ___, onset: ___, hemodynamically stable: yes/no" },
    { label:"Flank pain",            text:"Flank pain — side: L/R, onset: ___, radiation to groin: yes/no, hematuria: yes/no" },
    { label:"Diarrhea",              text:"Diarrhea — onset: ___, frequency: ___, blood in stool: yes/no, fever: yes/no, sick contacts: yes/no" },
    { label:"Constipation",          text:"Constipation — duration: ___, last BM: ___, vomiting: yes/no, prior episodes: yes/no" },
    { label:"Rectal pain / bleeding",text:"Rectal pain/bleeding — onset: ___, quantity: ___, bright red/dark: ___, pain with defecation: yes/no" },
    { label:"Jaundice",              text:"Jaundice — onset: ___, dark urine: yes/no, pale stools: yes/no, abdominal pain: yes/no, fever: yes/no" },
  ]},
  { id:"neuro", label:"Neuro / Psych", color:"#9b6dff", ccs:[
    { label:"Headache",              text:"Headache — onset: ___, character: ___, severity: ___/10, thunderclap: yes/no, fever/meningismus: yes/no" },
    { label:"Dizziness / vertigo",   text:"Dizziness — vertigo vs presyncope: ___, onset: ___, positional: yes/no, nausea/vomiting: yes/no" },
    { label:"Weakness / numbness",   text:"Focal weakness/numbness — onset: ___, distribution: ___, last known well: ___, facial droop: yes/no" },
    { label:"Altered mental status", text:"Altered mental status — baseline: ___, onset: ___, fever: yes/no, recent medication change: yes/no" },
    { label:"Seizure",               text:"Seizure — type: focal/generalized, duration: ___, post-ictal: yes/no, prior seizures: yes/no" },
    { label:"Vision changes",        text:"Vision changes — onset: ___, monocular/binocular: ___, type: loss/blurry/double/floaters, painful: yes/no" },
    { label:"Suicidal ideation / psychiatric emergency", text:"Psychiatric emergency — SI: yes/no, plan/means: ___, HI: yes/no, command AH: yes/no, prior attempts: yes/no" },
    { label:"Agitation",             text:"Agitation — onset: ___, baseline behavior: ___, substances: yes/no, prior psychiatric history: ___" },
  ]},
  { id:"msk", label:"MSK / Trauma", color:"#f5c842", ccs:[
    { label:"Extremity pain / injury",text:"Extremity pain/injury — location: ___, mechanism: ___, weight-bearing: yes/no, neurovascular intact: yes/no" },
    { label:"Back pain",             text:"Back pain — onset: ___, mechanism: ___, radiation: ___, bowel/bladder changes: yes/no" },
    { label:"Neck pain",             text:"Neck pain — mechanism: ___, onset: ___, radiation: ___, midline tenderness: yes/no" },
    { label:"Fall",                  text:"Fall — mechanism: ___, LOC: yes/no, anticoagulation: yes/no, injuries identified: ___" },
    { label:"Head injury",           text:"Head injury — mechanism: ___, LOC: yes/no, amnesia: yes/no, vomiting: yes/no, anticoagulation: yes/no" },
    { label:"Wound / laceration",    text:"Wound/laceration — location: ___, mechanism: ___, last tetanus: ___, contaminated: yes/no, NV intact distal: yes/no" },
    { label:"Joint pain / swelling", text:"Joint pain/swelling — location: ___, onset: ___, trauma: yes/no, fever: yes/no, monoarticular/polyarticular: ___" },
  ]},
  { id:"ent", label:"ENT / Eye", color:"#00d4ff", ccs:[
    { label:"Eye pain / redness",    text:"Eye complaint — onset: ___, pain: yes/no, vision change: yes/no, discharge: yes/no, contact lenses: yes/no, trauma: yes/no" },
    { label:"Vision loss",           text:"Vision loss — onset: ___, monocular/binocular: ___, painful: yes/no, curtain/shadow: yes/no, prior episodes: yes/no" },
    { label:"Ear pain / discharge",  text:"Ear pain — side: L/R, onset: ___, discharge: yes/no, hearing loss: yes/no, fever: yes/no, recent URI: yes/no" },
    { label:"Sore throat",           text:"Sore throat — onset: ___, dysphagia: yes/no, fever: yes/no, trismus: yes/no, drooling: yes/no, stridor: yes/no" },
    { label:"Epistaxis",             text:"Epistaxis — side: L/R, duration: ___, prior episodes: yes/no, anticoagulation: yes/no, hemodynamically stable: yes/no" },
    { label:"Dental / jaw pain",     text:"Dental/jaw pain — location: ___, onset: ___, swelling: yes/no, fever: yes/no, trismus: yes/no, trauma: yes/no" },
    { label:"Facial swelling",       text:"Facial swelling — location: ___, onset: ___, dental source: yes/no, fever: yes/no, airway compromise: yes/no" },
  ]},
  { id:"obgyn", label:"OB / GYN / GU", color:"#ff6b9d", ccs:[
    { label:"Pelvic pain",           text:"Pelvic pain — onset: ___, LMP: ___, pregnancy test: positive/negative/pending, severity: ___/10, vaginal discharge: yes/no" },
    { label:"Vaginal bleeding",      text:"Vaginal bleeding — LMP: ___, quantity: ___, pregnancy test: positive/negative/pending, pain: yes/no" },
    { label:"Pregnancy complication",text:"Pregnancy complication — GA: ___ weeks, complaint: ___, fetal movement: normal/decreased/absent, contractions: yes/no" },
    { label:"Vaginal discharge",     text:"Vaginal discharge — onset: ___, character: ___, odor: yes/no, pelvic pain: yes/no, fever: yes/no" },
    { label:"Urinary symptoms",      text:"Urinary symptoms — dysuria/frequency/urgency/hematuria: ___, onset: ___, CVA tenderness: yes/no, fever: yes/no" },
    { label:"Urinary retention",     text:"Urinary retention — duration: ___, prior episodes: yes/no, suprapubic pain: yes/no, neurologic symptoms: yes/no" },
    { label:"Scrotal pain",          text:"Scrotal pain — side: L/R, onset: ___, severity: ___/10, nausea/vomiting: yes/no, cremasteric reflex: present/absent" },
  ]},
  { id:"tox", label:"Tox / Allergy", color:"#3dffa0", ccs:[
    { label:"Overdose / ingestion",  text:"Overdose/ingestion — substance: ___, quantity: ___, time of ingestion: ___, intentional/unintentional: ___, coingestants: ___" },
    { label:"Allergic reaction",     text:"Allergic reaction — trigger: ___, onset: ___, urticaria: yes/no, angioedema: yes/no, respiratory: yes/no, BP stable: yes/no" },
    { label:"Anaphylaxis",           text:"Anaphylaxis — trigger: ___, onset: ___, airway compromise: yes/no, hypotension: yes/no, epinephrine given: yes/no" },
    { label:"Alcohol intoxication",  text:"Alcohol intoxication — last drink: ___, quantity: ___, other substances: yes/no, trauma: yes/no, seizure history: yes/no" },
    { label:"Drug withdrawal",       text:"Withdrawal — substance: ___, last use: ___, prior withdrawal seizures: yes/no, prior DTs: yes/no, current symptoms: ___" },
    { label:"Environmental exposure",text:"Exposure — agent: ___, route: inhalation/ingestion/dermal, duration: ___, others exposed: yes/no, decontaminated: yes/no" },
    { label:"Bite / sting / envenomation", text:"Envenomation — agent: ___, location: ___, time: ___, progression of symptoms: ___, prior reaction: yes/no" },
  ]},
  { id:"derm", label:"Derm / Endocrine", color:"#a78bfa", ccs:[
    { label:"Rash",                  text:"Rash — distribution: ___, onset: ___, pruritic: yes/no, fever: yes/no, new medications: yes/no, sick contacts: yes/no" },
    { label:"Cellulitis / abscess",  text:"Skin infection — location: ___, onset: ___, size: ___, fluctuance: yes/no, fever: yes/no, immunocompromised: yes/no" },
    { label:"Wound infection",       text:"Wound infection — location: ___, original injury: ___, onset of redness/warmth: ___, fever: yes/no, streaking: yes/no" },
    { label:"Hypoglycemia",          text:"Hypoglycemia — glucose: ___, symptomatic: yes/no, diabetic: yes/no, last insulin/oral agent: ___, oral intake: ___" },
    { label:"Hyperglycemia / DKA",   text:"Hyperglycemia — glucose: ___, polyuria/polydipsia: yes/no, nausea/vomiting: yes/no, abdominal pain: yes/no, type 1/2: ___" },
    { label:"Generalized weakness / fatigue", text:"Weakness/fatigue — onset: ___, focal vs generalized: ___, fever: yes/no, recent illness: yes/no, functional decline: ___" },
    { label:"Fever",                 text:"Fever — Tmax: ___, onset: ___, localizing symptoms: ___, immunocompromised: yes/no, sick contacts: yes/no" },
  ]},
];

// ─── HUB ROUTING MAP ─────────────────────────────────────────────────────────
// Maps CC category IDs and specific CC labels to relevant Notrya hubs
// route must match App.jsx routes exactly
// primary: shown first (max 2), secondary: shown after (max 2)
export const CC_HUB_MAP = {
  cardiac: {
    primary:   [
      { icon:"💓", label:"Chest Pain Hub",    route:"/ChestPainHub",       color:"#ff6b6b" },
      { icon:"🫀", label:"ECG Hub",           route:"/ecg-hub",            color:"#f87171" },
    ],
    secondary: [
      { icon:"🩻", label:"Imaging",           route:"/imaging-interpreter",color:"#82aece" },
      { icon:"💫", label:"Syncope Hub",       route:"/syncope-hub",        color:"#f5c842" },
    ],
  },
  abdominal: {
    primary:   [
      { icon:"🔴", label:"Abdominal Pain Hub",route:"/AbdominalPainHub",   color:"#ff9f43" },
      { icon:"🩻", label:"Imaging",           route:"/imaging-interpreter",color:"#82aece" },
    ],
    secondary: [
      { icon:"🦠", label:"Sepsis Hub",        route:"/SepsisHub",          color:"#3dffa0" },
      { icon:"🧪", label:"Lab Interpreter",   route:"/LabInterpreter",     color:"#3dffa0" },
    ],
  },
  neuro: {
    primary:   [
      { icon:"🧠", label:"Stroke Hub",        route:"/stroke-hub",         color:"#9b6dff" },
      { icon:"🩻", label:"Imaging",           route:"/imaging-interpreter",color:"#82aece" },
    ],
    secondary: [
      { icon:"🤕", label:"Headache Hub",      route:"/HeadacheHub",        color:"#9b6dff" },
      { icon:"😵", label:"AMS Hub",           route:"/ams-hub",            color:"#9b6dff" },
    ],
  },
  msk: {
    primary:   [
      { icon:"🦴", label:"Ortho Hub",         route:"/OrthoHub",           color:"#a78bfa" },
      { icon:"🩻", label:"Imaging",           route:"/imaging-interpreter",color:"#82aece" },
    ],
    secondary: [
      { icon:"🩺", label:"Pain Hub",          route:"/pain-hub",           color:"#ff9f43" },
    ],
  },
  ent: {
    primary:   [
      { icon:"🩻", label:"Imaging",           route:"/imaging-interpreter",color:"#82aece" },
      { icon:"🧪", label:"Lab Interpreter",   route:"/LabInterpreter",     color:"#3dffa0" },
    ],
    secondary: [],
  },
  obgyn: {
    primary:   [
      { icon:"🤰", label:"OB/GYN Hub",        route:"/ob-hub",             color:"#ff6b9d" },
      { icon:"🩻", label:"Imaging",           route:"/imaging-interpreter",color:"#82aece" },
    ],
    secondary: [
      { icon:"🧪", label:"Lab Interpreter",   route:"/LabInterpreter",     color:"#3dffa0" },
    ],
  },
  tox: {
    primary:   [
      { icon:"☠️", label:"Toxicology Hub",    route:"/tox-hub",            color:"#3dffa0" },
      { icon:"🧬", label:"Antidote Hub",      route:"/antidote-hub",       color:"#3dffa0" },
    ],
    secondary: [
      { icon:"🧪", label:"Lab Interpreter",   route:"/LabInterpreter",     color:"#3dffa0" },
    ],
  },
  derm: {
    primary:   [
      { icon:"🧪", label:"Lab Interpreter",   route:"/LabInterpreter",     color:"#3dffa0" },
      { icon:"🦠", label:"Sepsis Hub",        route:"/SepsisHub",          color:"#3dffa0" },
    ],
    secondary: [
      { icon:"🩻", label:"Imaging",           route:"/imaging-interpreter",color:"#82aece" },
    ],
  },
};

// ─── CONTEXT-AWARE BLANK OPTIONS ─────────────────────────────────────────────
// Keys = lowercase word immediately before ___ in template text.
// Values = option array shown as buttons instead of free-text input.
// Unrecognized blanks fall back to the free-text popup (existing behavior).
export const BLANK_OPTIONS = {
  "severity":     ["1–3", "4–6", "7–8", "9–10"],
  "side":         ["Left", "Right", "Bilateral"],
  "onset":        ["Sudden", "Gradual", "Progressive", "Intermittent"],
  "character":    ["Sharp", "Dull", "Pressure", "Burning", "Tearing", "Crampy"],
  "mechanism":    ["Fall", "MVA", "Sports injury", "Direct blow", "Unknown"],
  "distribution": ["RUE", "LUE", "RLE", "LLE", "Face", "Trunk", "Diffuse"],
  "radiation":    ["None", "Left arm", "Jaw", "Right arm", "Back", "Shoulder"],
  "frequency":    ["Once", "2–3x today", "Constant", "Episodic"],
  "prodrome":     ["None", "Lightheadedness", "Nausea", "Diaphoresis", "Palpitations"],
  "injuries":     ["None identified", "Laceration", "Contusion", "Fracture suspected"],
  "baseline":     ["Alert/oriented", "Mild dementia", "Non-verbal at baseline"],
  "tmax":         ["37.5–38°C", "38–38.9°C", "39–39.9°C", "≥40°C"],
  "quantity":     ["Spotting", "Light", "Moderate", "Heavy", "Clots"],
  "duration":     ["<1 min", "1–5 min", "5–30 min", ">30 min"],
  "type":         ["Focal", "Generalized", "Focal with secondary generalization"],
  "monocular":    ["Monocular", "Binocular"],
  "complaint":    ["Contractions", "Bleeding", "Decreased fetal movement", "Leaking fluid", "Hypertension", "Pain"],
  "substance":    ["Opioids", "Benzodiazepines", "Alcohol", "Stimulants", "Cannabis", "Unknown"],
  "route":        ["Inhalation", "Ingestion", "Dermal", "IV"],
  "character:":   ["Purulent", "Clear", "Bloody", "Brown/malodorous"],
  "type:":        ["Loss/blurry", "Double vision", "Floaters/flashes", "Curtain/shadow"],
};