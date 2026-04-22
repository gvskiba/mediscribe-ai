// QuickNoteData.jsx
// Chief Complaint categories and Hub mappings for QuickNote v8
// Imported by QuickNote.jsx

export const CC_CATEGORIES = [
  {
    id: "cardiac",
    label: "Cardiac / Chest",
    color: "#f87171",
    ccs: [
      { label: "Chest pain — acute",          text: "Chest pain, acute onset, severity __/10, sharp/pressure/squeezing, onset __h ago" },
      { label: "Chest pain — pleuritic",       text: "Chest pain, pleuritic, worsens with inspiration, onset __h ago" },
      { label: "Palpitations",                 text: "Palpitations, onset __, regular/irregular, associated dizziness/presyncope" },
      { label: "Syncope / near-syncope",       text: "Syncope, witnessed/unwitnessed, prodrome __, duration __, recovery __" },
      { label: "Dyspnea on exertion",          text: "Shortness of breath on exertion, NYHA class __, onset __, orthopnea/PND" },
      { label: "Hypertensive urgency",         text: "Hypertensive urgency, BP __, headache/visual changes/chest pain present/absent" },
    ],
  },
  {
    id: "respiratory",
    label: "Respiratory",
    color: "#38bdf8",
    ccs: [
      { label: "Shortness of breath — acute",  text: "Acute dyspnea, onset __, SpO2 __ on room air, wheezing/stridor present/absent" },
      { label: "Cough / hemoptysis",           text: "Cough, productive/dry, duration __, hemoptysis present/absent, fever present/absent" },
      { label: "Asthma exacerbation",          text: "Asthma exacerbation, baseline FEV1/peak flow __, last nebulizer __, steroid use" },
      { label: "COPD exacerbation",            text: "COPD exacerbation, home O2 present/absent, steroid/antibiotic use, baseline dyspnea" },
      { label: "Pneumonia symptoms",           text: "Fever, productive cough, pleuritic pain, onset __ days, O2 sat __" },
    ],
  },
  {
    id: "abdominal",
    label: "Abdominal / GI",
    color: "#fb923c",
    ccs: [
      { label: "Abdominal pain — diffuse",     text: "Diffuse abdominal pain, onset __, severity __/10, associated N/V/diarrhea" },
      { label: "RLQ pain / appendicitis",      text: "RLQ pain, migratory from periumbilical, onset __ hours, anorexia present/absent, fever" },
      { label: "RUQ pain / biliary",           text: "RUQ pain, onset __, relation to meals, radiation to shoulder/back, jaundice present/absent" },
      { label: "Nausea / vomiting",            text: "Nausea and vomiting, onset __, frequency __, blood/bile in emesis, last oral intake __" },
      { label: "GI bleed — upper",             text: "Upper GI bleed, hematemesis/melena, volume __, hemodynamics stable/unstable" },
      { label: "GI bleed — lower",             text: "Lower GI bleed, hematochezia, volume __, hemodynamics stable/unstable, prior colonoscopy" },
      { label: "Flank pain / renal colic",     text: "Flank pain, colicky, radiation to groin, hematuria present/absent, prior stones" },
    ],
  },
  {
    id: "neuro",
    label: "Neuro / Psych",
    color: "#a78bfa",
    ccs: [
      { label: "Headache — thunderclap",       text: "Thunderclap headache, worst-of-life, onset __, associated N/V/neck stiffness/photophobia" },
      { label: "Headache — migraine",          text: "Migraine, unilateral/bilateral, photophobia/phonophobia, aura present/absent, prior episodes" },
      { label: "Stroke symptoms",              text: "Acute focal neurologic deficit, FAST positive, LKW __, facial droop/arm drift/speech change" },
      { label: "Seizure",                      text: "Seizure, generalized/focal, duration __, post-ictal state, prior seizure history, AED compliance" },
      { label: "Altered mental status",        text: "Altered mental status, baseline __, acute/subacute change, fever/recent illness/medications" },
      { label: "Vertigo / dizziness",          text: "Vertigo, episodic/constant, HINTS exam __, hearing loss/tinnitus, falls" },
      { label: "Psychiatric — SI/HI",          text: "Suicidal ideation, plan __, means __, intent __, recent stressor, prior attempts, psychiatric history" },
    ],
  },
  {
    id: "msk",
    label: "MSK / Trauma",
    color: "#4ade80",
    ccs: [
      { label: "Extremity injury",             text: "Extremity injury, mechanism __, location __, weight-bearing status, neurovascular intact/compromised" },
      { label: "Back pain — acute",            text: "Low back pain, acute, mechanism __, radicular symptoms present/absent, bowel/bladder symptoms" },
      { label: "Joint swelling / arthritis",   text: "Joint swelling __, monoarticular/polyarticular, warm/erythematous, fever, prior gout/arthritis" },
      { label: "Wound / laceration",           text: "Laceration, location __, length __ cm, depth, wound contamination, tetanus status, mechanism" },
      { label: "Fall",                         text: "Fall, mechanism, loss of consciousness present/absent, head strike, anticoagulation, prior falls" },
    ],
  },
  {
    id: "other",
    label: "Infectious / Other",
    color: "#fbbf24",
    ccs: [
      { label: "Fever / sepsis concern",       text: "Fever __ °F, chills/rigors, suspected source __, hemodynamic status, immunocompromised present/absent" },
      { label: "UTI symptoms",                 text: "Dysuria, frequency, urgency, hematuria, flank pain present/absent, fever, prior UTIs" },
      { label: "Skin infection / abscess",     text: "Skin infection, location __, erythema __ cm, fluctuance present/absent, drainage, fever" },
      { label: "Allergic reaction",            text: "Allergic reaction, trigger __, hives/angioedema/wheeze/hypotension, Epi given present/absent" },
      { label: "Overdose / ingestion",         text: "Suspected overdose, substance __, amount __, time __, intentional/unintentional, vitals" },
      { label: "Weakness / fatigue",           text: "Generalized weakness, onset __, focal/diffuse, associated symptoms, functional decline" },
    ],
  },
];

// ─── HUB LINKS PER CATEGORY ───────────────────────────────────────────────────
export const CC_HUB_MAP = {
  cardiac: {
    primary: [
      { label: "Cardiac Hub",   route: "/cardiac-hub",   icon: "❤️",  color: "#f87171" },
      { label: "Chest Pain",    route: "/ChestPainHub",  icon: "🫀",  color: "#fb923c" },
      { label: "ECG Hub",       route: "/ecg-hub",       icon: "📈",  color: "#38bdf8" },
    ],
    secondary: [
      { label: "Score Hub",     route: "/score-hub",     icon: "🧮",  color: "#a78bfa" },
      { label: "Syncope Hub",   route: "/syncope-hub",   icon: "💫",  color: "#fbbf24" },
    ],
  },
  respiratory: {
    primary: [
      { label: "Dyspnea Hub",   route: "/DyspneaHub",   icon: "🫁",  color: "#38bdf8" },
      { label: "Airway Hub",    route: "/airway-hub",    icon: "🌬️", color: "#2dd4bf" },
    ],
    secondary: [
      { label: "Score Hub",     route: "/score-hub",     icon: "🧮",  color: "#a78bfa" },
    ],
  },
  abdominal: {
    primary: [
      { label: "Abd Pain Hub",  route: "/AbdominalPainHub", icon: "🩺", color: "#fb923c" },
    ],
    secondary: [
      { label: "Score Hub",     route: "/score-hub",     icon: "🧮",  color: "#a78bfa" },
      { label: "Imaging Ref",   route: "/radiology-hub", icon: "🔬",  color: "#38bdf8" },
    ],
  },
  neuro: {
    primary: [
      { label: "Stroke Hub",    route: "/StrokeAssessment", icon: "🧠", color: "#f87171" },
      { label: "Headache Hub",  route: "/HeadacheHub",   icon: "💊",  color: "#a78bfa" },
      { label: "AMS Hub",       route: "/ams-hub",        icon: "⚡",  color: "#fbbf24" },
    ],
    secondary: [
      { label: "Seizure Hub",   route: "/seizure-hub",   icon: "🔴",  color: "#fb923c" },
      { label: "Psych Hub",     route: "/psyche-hub",    icon: "🧩",  color: "#818cf8" },
    ],
  },
  msk: {
    primary: [
      { label: "Ortho Hub",     route: "/ortho-hub",     icon: "🦴",  color: "#4ade80" },
      { label: "Wound Hub",     route: "/wound-care-hub", icon: "🩹", color: "#fb923c" },
    ],
    secondary: [
      { label: "Pain Hub",      route: "/pain-hub",      icon: "💊",  color: "#fbbf24" },
    ],
  },
  other: {
    primary: [
      { label: "Sepsis Hub",    route: "/sepsis-hub",    icon: "🦠",  color: "#fbbf24" },
      { label: "Tox Hub",       route: "/tox-hub",       icon: "⚗️", color: "#f87171" },
      { label: "ID Hub",        route: "/id-hub",        icon: "🔬",  color: "#38bdf8" },
    ],
    secondary: [
      { label: "Score Hub",     route: "/score-hub",     icon: "🧮",  color: "#a78bfa" },
    ],
  },
};