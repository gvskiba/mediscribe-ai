// QuickNoteData.js
// Chief Complaint categories, structured CC phrases, and hub routing map for QuickNote
// Imported by QuickNote.jsx — edit CC data and hub links here

// ─── CHIEF COMPLAINT CATEGORIES ─────────────────────────────────────────────
// text: structured phrase inserted into CC field; ___ = free-text blank;
//       option/option = toggle choices rendered by SmartFill bar
export const CC_CATEGORIES = [
  { id:"cardiac", label:"Cardiac / Pulm", color:"#ff6b6b", ccs:[
    { label:"Chest pain",            text:"Chest pain — onset: ___, character: ___, severity: ___/10, radiation: ___" },
    { label:"Shortness of breath",   text:"Shortness of breath — onset: ___, severity: mild/moderate/severe, exertional: yes/no" },
    { label:"Palpitations",          text:"Palpitations — onset: ___, duration: ___, associated syncope: yes/no" },
    { label:"Syncope",               text:"Syncope — onset: ___, prodrome: ___, duration of LOC: ___, injuries: ___" },
  ]},
  { id:"abdominal", label:"Abdominal", color:"#ff9f43", ccs:[
    { label:"Abdominal pain",        text:"Abdominal pain — location: ___, onset: ___, character: ___, severity: ___/10" },
    { label:"Nausea / vomiting",     text:"Nausea and vomiting — onset: ___, frequency: ___, blood in emesis: yes/no, last PO: ___" },
    { label:"GI bleed",              text:"GI bleeding — hematemesis/melena/hematochezia: ___, onset: ___, hemodynamically stable: yes/no" },
    { label:"Flank pain",            text:"Flank pain — side: L/R, onset: ___, radiation to groin: yes/no, hematuria: yes/no" },
  ]},
  { id:"neuro", label:"Neuro / Psych", color:"#9b6dff", ccs:[
    { label:"Headache",              text:"Headache — onset: ___, character: ___, severity: ___/10, thunderclap: yes/no, fever/meningismus: yes/no" },
    { label:"Dizziness",             text:"Dizziness — vertigo vs presyncope: ___, onset: ___, positional: yes/no" },
    { label:"Weakness / numbness",   text:"Focal weakness/numbness — onset: ___, distribution: ___, last known well: ___, facial droop: yes/no" },
    { label:"Altered mental status", text:"Altered mental status — baseline: ___, onset: ___, fever: yes/no, recent medication change: yes/no" },
    { label:"Seizure",               text:"Seizure — type: focal/generalized, duration: ___, post-ictal: yes/no, prior seizures: yes/no" },
  ]},
  { id:"msk", label:"MSK / Trauma", color:"#f5c842", ccs:[
    { label:"Extremity pain / injury", text:"Extremity pain/injury — location: ___, mechanism: ___, weight-bearing: yes/no, neurovascular intact: yes/no" },
    { label:"Back pain",             text:"Back pain — onset: ___, mechanism: ___, radiation: ___, bowel/bladder changes: yes/no" },
    { label:"Neck pain",             text:"Neck pain — mechanism: ___, onset: ___, radiation: ___, midline tenderness: yes/no" },
    { label:"Fall",                  text:"Fall — mechanism: ___, LOC: yes/no, anticoagulation: yes/no, injuries identified: ___" },
  ]},
  { id:"other", label:"Other", color:"#3b9eff", ccs:[
    { label:"Fever",                 text:"Fever — Tmax: ___, onset: ___, localizing symptoms: ___, immunocompromised: yes/no" },
    { label:"Urinary symptoms",      text:"Urinary symptoms — dysuria/frequency/urgency/hematuria: ___, onset: ___, CVA tenderness: yes/no" },
    { label:"Rash",                  text:"Rash — distribution: ___, onset: ___, pruritic: yes/no, fever: yes/no, new medications: yes/no" },
    { label:"Vaginal bleeding",      text:"Vaginal bleeding — LMP: ___, quantity: ___, pregnancy test: positive/negative/pending" },
    { label:"Swelling",              text:"Swelling — location: ___, onset: ___, unilateral/bilateral: ___, pain/erythema/warmth: yes/no" },
  ]},
];

// ─── BLANK OPTIONS ───────────────────────────────────────────────────────────
// Context-keyed option lists for SmartFill ___ blanks.
// Key = last word before the blank (lowercase). Value = array of options.
export const BLANK_OPTIONS = {
  onset:       ["sudden", "gradual", "minutes ago", "hours ago", "days ago"],
  character:   ["sharp", "dull", "pressure", "burning", "cramping", "tearing", "throbbing"],
  severity:    ["1/10", "2/10", "3/10", "4/10", "5/10", "6/10", "7/10", "8/10", "9/10", "10/10"],
  radiation:   ["none", "to left arm", "to jaw", "to back", "to groin", "to right shoulder"],
  mechanism:   ["ground level fall", "MVC", "direct blow", "twisting injury", "lifting", "unknown"],
  side:        ["left", "right", "bilateral"],
  location:    ["RUQ", "RLQ", "LUQ", "LLQ", "epigastric", "periumbilical", "diffuse", "suprapubic"],
  distribution:["unilateral", "bilateral", "dermatomal", "generalized", "focal"],
  type:        ["focal", "generalized", "tonic-clonic", "absence", "complex partial"],
  baseline:    ["alert", "confused at baseline", "demented", "non-verbal"],
  frequency:   ["once", "2-3 times", "multiple times", "continuous"],
  quantity:    ["spotting", "light", "moderate", "heavy", "clots"],
};

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
  other: {
    primary:   [
      { icon:"🦠", label:"Sepsis Hub",        route:"/SepsisHub",          color:"#3dffa0" },
      { icon:"🧪", label:"Lab Interpreter",   route:"/LabInterpreter",     color:"#3dffa0" },
    ],
    secondary: [
      { icon:"🩻", label:"Imaging",           route:"/imaging-interpreter",color:"#82aece" },
    ],
  },
};