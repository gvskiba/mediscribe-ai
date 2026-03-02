import React, { useState, useMemo, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Search, Loader2, ChevronDown, ChevronUp, Sparkles, Star, Plus, AlertTriangle, Save, Clock, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

// ─── Color palette ────────────────────────────────────────────────────────────
const T = {
  navy: "#050f1e", slate: "#0b1d35", panel: "#0e2340",
  edge: "#162d4f", border: "#1e3a5f", muted: "#2a4d72",
  dim: "#4a7299", text: "#c8ddf0", bright: "#e8f4ff",
  teal: "#00d4bc", amber: "#f5a623", red: "#ff5c6c",
  green: "#2ecc71", purple: "#9b6dff",
};

// ─── Calculator Categories ────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "all",       label: "All",              icon: "📋" },
  { id: "cardiac",   label: "Cardiac",          icon: "🫀" },
  { id: "pulmonary", label: "Pulmonary / VTE",  icon: "🫁" },
  { id: "neuro",     label: "Neurology",        icon: "🧠" },
  { id: "sepsis",    label: "Sepsis",           icon: "🦠" },
  { id: "gi",        label: "GI / Abdominal",   icon: "🫃" },
  { id: "ortho",     label: "Orthopedic",       icon: "🦴" },
  { id: "substance", label: "Substance / Tox",  icon: "💊" },
  { id: "general",   label: "General",          icon: "📊" },
];

const EVIDENCE_COLORS = {
  green: { bg: "rgba(46,204,113,.12)", color: "#2ecc71" },
  amber: { bg: "rgba(245,166,35,.1)",  color: "#f5a623" },
  red:   { bg: "rgba(255,92,108,.1)",  color: "#ff5c6c" },
  teal:  { bg: "rgba(0,212,188,.1)",   color: "#00d4bc" },
  dim:   { bg: "rgba(74,114,153,.12)", color: "#4a7299" },
};

// ─── Calculators Data ─────────────────────────────────────────────────────────
const CALCULATORS = [
  {
    id: "heart_score", name: "HEART Score", category: "cardiac",
    description: "Risk stratifies chest pain patients for MACE at 6 weeks.",
    source: "Backus et al., Heart 2010",
    fields: [
      { id:"history",  label:"History",          type:"select", options:[{label:"Slightly suspicious",value:0},{label:"Moderately suspicious",value:1},{label:"Highly suspicious",value:2}] },
      { id:"ekg",      label:"EKG",              type:"select", options:[{label:"Normal",value:0},{label:"Non-specific repolarization",value:1},{label:"Significant ST deviation",value:2}] },
      { id:"age",      label:"Age",              type:"select", options:[{label:"< 45 years",value:0},{label:"45–64 years",value:1},{label:"≥ 65 years",value:2}] },
      { id:"risk",     label:"Risk Factors",     type:"select", options:[{label:"No known risk factors",value:0},{label:"1–2 risk factors",value:1},{label:"≥ 3 risk factors or atherosclerotic disease",value:2}] },
      { id:"troponin", label:"Initial Troponin", type:"select", options:[{label:"≤ Normal limit",value:0},{label:"1–3× normal limit",value:1},{label:"> 3× normal limit",value:2}] },
    ],
    score: (v) => Object.values(v).reduce((a,b) => a + Number(b), 0),
    interpret: (s) =>
      s <= 3  ? { label:"Low Risk",    color:"green", action:"Consider discharge. < 2% 30-day MACE." } :
      s <= 6  ? { label:"Moderate Risk",color:"amber", action:"Observation and serial troponins. ~12% 30-day MACE." } :
               { label:"High Risk",   color:"red",   action:"Early invasive strategy. ~65% 30-day MACE." },
  },
  {
    id: "wells_pe", name: "Wells PE Score", category: "pulmonary",
    description: "Estimates pre-test probability of PE. Guides D-dimer / PERC / imaging decision.",
    source: "Wells et al., Thromb Haemost 2000",
    fields: [
      { id:"clinical_dvt", label:"Clinical signs/symptoms of DVT",                  type:"checkbox", value:3 },
      { id:"alt_dx",       label:"PE is #1 diagnosis OR equally likely",            type:"checkbox", value:3 },
      { id:"hr_100",       label:"Heart Rate > 100 bpm",                            type:"checkbox", value:1.5 },
      { id:"immob",        label:"Immobilization ≥ 3 days OR surgery in past 4 wks",type:"checkbox", value:1.5 },
      { id:"prev_pe_dvt",  label:"Previous PE or DVT",                              type:"checkbox", value:1.5 },
      { id:"hemoptysis",   label:"Hemoptysis",                                       type:"checkbox", value:1 },
      { id:"malignancy",   label:"Malignancy (active or palliative)",               type:"checkbox", value:1 },
    ],
    score: (v) => Object.entries(v).reduce((a,[k,checked]) => {
      const field = CALCULATORS.find(c=>c.id==="wells_pe").fields.find(f=>f.id===k);
      return a + (checked ? (field?.value||0) : 0);
    }, 0),
    interpret: (s) =>
      s < 2   ? { label:"Low Probability",      color:"green", action:"PERC rule applicable. D-dimer if PERC not met." } :
      s <= 6  ? { label:"Moderate Probability",  color:"amber", action:"D-dimer recommended. CTA-PE if positive." } :
               { label:"High Probability",      color:"red",   action:"CTA-PE without D-dimer. Empiric anticoagulation if delay." },
  },
  {
    id: "wells_dvt", name: "Wells DVT Score", category: "pulmonary",
    description: "Estimates pre-test probability of lower extremity DVT.",
    source: "Wells et al., Lancet 1997",
    fields: [
      { id:"active_cancer",  label:"Active cancer (treatment within 6 months)",   type:"checkbox", value:1 },
      { id:"paralysis",      label:"Paralysis, paresis, or recent cast",          type:"checkbox", value:1 },
      { id:"bedridden",      label:"Bedridden ≥ 3 days OR major surgery ≤12 wks",type:"checkbox", value:1 },
      { id:"tenderness",     label:"Tenderness along deep venous system",         type:"checkbox", value:1 },
      { id:"entire_leg",     label:"Entire leg swollen",                          type:"checkbox", value:1 },
      { id:"calf_swelling",  label:"Calf swelling > 3 cm vs asymptomatic leg",   type:"checkbox", value:1 },
      { id:"pitting",        label:"Pitting edema (greater in symptomatic leg)",  type:"checkbox", value:1 },
      { id:"collateral",     label:"Collateral non-varicose superficial veins",   type:"checkbox", value:1 },
      { id:"prev_dvt",       label:"Previously documented DVT",                   type:"checkbox", value:1 },
      { id:"alt_dx_likely",  label:"Alternative diagnosis at least as likely",    type:"checkbox", value:-2 },
    ],
    score: (v) => Object.entries(v).reduce((a,[k,checked]) => {
      const field = CALCULATORS.find(c=>c.id==="wells_dvt").fields.find(f=>f.id===k);
      return a + (checked ? (field?.value||0) : 0);
    }, 0),
    interpret: (s) =>
      s <= 0  ? { label:"Low Probability",    color:"green", action:"D-dimer; if negative, no imaging required." } :
      s <= 2  ? { label:"Moderate Probability",color:"amber", action:"D-dimer. Ultrasound if D-dimer positive." } :
               { label:"High Probability",   color:"red",   action:"Venous ultrasound recommended. Treat if confirmed." },
  },
  {
    id: "gcs", name: "Glasgow Coma Scale (GCS)", category: "neuro",
    description: "Assesses level of consciousness. Standard for neurological monitoring and intubation decision.",
    source: "Teasdale & Jennett, Lancet 1974",
    fields: [
      { id:"eyes",   label:"Eye Opening",     type:"select", options:[{label:"None (1)",value:1},{label:"To pain (2)",value:2},{label:"To voice (3)",value:3},{label:"Spontaneous (4)",value:4}] },
      { id:"verbal", label:"Verbal Response", type:"select", options:[{label:"None (1)",value:1},{label:"Incomprehensible (2)",value:2},{label:"Inappropriate words (3)",value:3},{label:"Confused (4)",value:4},{label:"Oriented (5)",value:5}] },
      { id:"motor",  label:"Motor Response",  type:"select", options:[{label:"None (1)",value:1},{label:"Decerebrate extension (2)",value:2},{label:"Decorticate flexion (3)",value:3},{label:"Withdrawal (4)",value:4},{label:"Localizes pain (5)",value:5},{label:"Obeys commands (6)",value:6}] },
    ],
    score: (v) => (Number(v.eyes||1)) + (Number(v.verbal||1)) + (Number(v.motor||1)),
    interpret: (s) =>
      s <= 8  ? { label:"Severe TBI",   color:"red",   action:`GCS ≤ 8 — consider intubation. Neurosurgery consult. CT head.` } :
      s <= 12 ? { label:"Moderate TBI", color:"amber", action:"Careful monitoring. CT head. Consider ICU." } :
               { label:"Mild / Normal", color:"green", action:"GCS 13–14: minor TBI. GCS 15: intact. Reassess frequently." },
  },
  {
    id: "nihss", name: "NIH Stroke Scale (NIHSS)", category: "neuro",
    description: "Quantifies stroke severity. Required for tPA eligibility determination.",
    source: "Brott et al., Stroke 1989",
    fields: [
      { id:"loc",       label:"1a. Level of Consciousness",   type:"select", options:[{label:"Alert (0)",value:0},{label:"Not alert, arousable (1)",value:1},{label:"Requires stimulation (2)",value:2},{label:"Unresponsive (3)",value:3}] },
      { id:"loc_q",     label:"1b. LOC Questions",           type:"select", options:[{label:"Both correct (0)",value:0},{label:"One correct (1)",value:1},{label:"Neither correct (2)",value:2}] },
      { id:"loc_cmd",   label:"1c. LOC Commands",            type:"select", options:[{label:"Both correct (0)",value:0},{label:"One correct (1)",value:1},{label:"Neither correct (2)",value:2}] },
      { id:"gaze",      label:"2. Best Gaze",                type:"select", options:[{label:"Normal (0)",value:0},{label:"Partial palsy (1)",value:1},{label:"Forced deviation (2)",value:2}] },
      { id:"visual",    label:"3. Visual Fields",            type:"select", options:[{label:"No loss (0)",value:0},{label:"Partial hemianopia (1)",value:1},{label:"Complete hemianopia (2)",value:2},{label:"Bilateral (3)",value:3}] },
      { id:"facial",    label:"4. Facial Palsy",             type:"select", options:[{label:"Normal (0)",value:0},{label:"Minor (1)",value:1},{label:"Partial (2)",value:2},{label:"Complete (3)",value:3}] },
      { id:"arm_l",     label:"5a. Motor Arm (Left)",        type:"select", options:[{label:"No drift (0)",value:0},{label:"Drift (1)",value:1},{label:"Some effort vs gravity (2)",value:2},{label:"No effort vs gravity (3)",value:3},{label:"No movement (4)",value:4}] },
      { id:"arm_r",     label:"5b. Motor Arm (Right)",       type:"select", options:[{label:"No drift (0)",value:0},{label:"Drift (1)",value:1},{label:"Some effort vs gravity (2)",value:2},{label:"No effort vs gravity (3)",value:3},{label:"No movement (4)",value:4}] },
      { id:"leg_l",     label:"6a. Motor Leg (Left)",        type:"select", options:[{label:"No drift (0)",value:0},{label:"Drift (1)",value:1},{label:"Some effort vs gravity (2)",value:2},{label:"No effort vs gravity (3)",value:3},{label:"No movement (4)",value:4}] },
      { id:"leg_r",     label:"6b. Motor Leg (Right)",       type:"select", options:[{label:"No drift (0)",value:0},{label:"Drift (1)",value:1},{label:"Some effort vs gravity (2)",value:2},{label:"No effort vs gravity (3)",value:3},{label:"No movement (4)",value:4}] },
      { id:"ataxia",    label:"7. Limb Ataxia",              type:"select", options:[{label:"Absent (0)",value:0},{label:"1 limb (1)",value:1},{label:"2 limbs (2)",value:2}] },
      { id:"sensory",   label:"8. Sensory",                  type:"select", options:[{label:"Normal (0)",value:0},{label:"Mild-moderate loss (1)",value:1},{label:"Severe/total loss (2)",value:2}] },
      { id:"language",  label:"9. Best Language",            type:"select", options:[{label:"No aphasia (0)",value:0},{label:"Mild-moderate (1)",value:1},{label:"Severe (2)",value:2},{label:"Mute/global (3)",value:3}] },
      { id:"dysarthria",label:"10. Dysarthria",              type:"select", options:[{label:"Normal (0)",value:0},{label:"Mild-moderate (1)",value:1},{label:"Severe/mute (2)",value:2}] },
      { id:"extinction",label:"11. Extinction/Inattention",  type:"select", options:[{label:"No abnormality (0)",value:0},{label:"1 modality (1)",value:1},{label:"Severe (2)",value:2}] },
    ],
    score: (v) => Object.values(v).reduce((a,b) => a + Number(b||0), 0),
    interpret: (s) =>
      s === 0 ? { label:"No Stroke",       color:"green", action:"Stroke absent or resolved. TIA protocol." } :
      s <= 4  ? { label:"Minor Stroke",    color:"teal",  action:"tPA may be beneficial. Neurology consult." } :
      s <= 15 ? { label:"Moderate Stroke", color:"amber", action:"Strong tPA candidate. Consider thrombectomy." } :
      s <= 20 ? { label:"Moderate-Severe", color:"red",   action:"High disability expected. Thrombectomy evaluation." } :
               { label:"Severe Stroke",   color:"red",   action:"Severe. Goals of care discussion. Thrombectomy if appropriate." },
  },
  {
    id: "chads_vasc", name: "CHA₂DS₂-VASc", category: "cardiac",
    description: "Estimates annual stroke risk in non-valvular atrial fibrillation. Guides anticoagulation.",
    source: "Lip et al., Chest 2010",
    fields: [
      { id:"chf",    label:"Congestive Heart Failure",                  type:"checkbox", value:1 },
      { id:"htn",    label:"Hypertension",                             type:"checkbox", value:1 },
      { id:"age_75", label:"Age ≥ 75 years",                          type:"checkbox", value:2 },
      { id:"dm",     label:"Diabetes Mellitus",                        type:"checkbox", value:1 },
      { id:"stroke", label:"Prior Stroke / TIA / Thromboembolism",     type:"checkbox", value:2 },
      { id:"vasc",   label:"Vascular Disease (MI, PAD, aortic plaque)",type:"checkbox", value:1 },
      { id:"age_65", label:"Age 65–74 years",                         type:"checkbox", value:1 },
      { id:"female", label:"Female Sex",                               type:"checkbox", value:1 },
    ],
    score: (v) => Object.entries(v).reduce((a,[k,checked]) => {
      const field = CALCULATORS.find(c=>c.id==="chads_vasc").fields.find(f=>f.id===k);
      return a + (checked ? (field?.value||0) : 0);
    }, 0),
    interpret: (s) =>
      s === 0 ? { label:"Low Risk",               color:"green", action:"No anticoagulation (male). Clinical judgment (female)." } :
      s === 1 ? { label:"Low-Moderate Risk",       color:"amber", action:"Consider anticoagulation in males. Sole female criterion: do NOT anticoagulate." } :
               { label:"High Risk — Anticoagulate",color:"red",   action:"Oral anticoagulation recommended (DOAC preferred). Assess bleeding risk (HAS-BLED)." },
  },
  {
    id: "curb65", name: "CURB-65", category: "pulmonary",
    description: "Predicts 30-day mortality in community-acquired pneumonia. Guides admission decision.",
    source: "Lim et al., Thorax 2003",
    fields: [
      { id:"confusion", label:"Confusion (new disorientation)",            type:"checkbox", value:1 },
      { id:"bun",       label:"BUN > 19 mg/dL (Urea > 7 mmol/L)",         type:"checkbox", value:1 },
      { id:"rr",        label:"Respiratory Rate ≥ 30 breaths/min",         type:"checkbox", value:1 },
      { id:"bp",        label:"BP: Systolic < 90 OR Diastolic ≤ 60 mmHg", type:"checkbox", value:1 },
      { id:"age_65",    label:"Age ≥ 65 years",                            type:"checkbox", value:1 },
    ],
    score: (v) => Object.values(v).reduce((a,b) => a + (b?1:0), 0),
    interpret: (s) =>
      s <= 1 ? { label:"Low Risk",      color:"green", action:"30-day mortality < 3%. Consider outpatient treatment." } :
      s === 2 ? { label:"Moderate Risk", color:"amber", action:"~9% mortality. Consider hospitalization." } :
               { label:"High Risk",     color:"red",   action:"15–40% mortality. Hospital admission required. ICU if score 4–5." },
  },
  {
    id: "qsofa", name: "qSOFA (Sepsis-3)", category: "sepsis",
    description: "Rapid bedside screen for sepsis in patients with suspected infection.",
    source: "Singer et al., JAMA 2016",
    fields: [
      { id:"rr",  label:"Respiratory Rate ≥ 22 breaths/min", type:"checkbox", value:1 },
      { id:"ams", label:"Altered Mentation (GCS < 15)",       type:"checkbox", value:1 },
      { id:"sbp", label:"Systolic BP ≤ 100 mmHg",            type:"checkbox", value:1 },
    ],
    score: (v) => Object.values(v).reduce((a,b) => a + (b?1:0), 0),
    interpret: (s) =>
      s < 2 ? { label:"Low Risk",           color:"green", action:"Low risk for poor outcome. Continue monitoring." } :
              { label:"High Risk — Sepsis", color:"red",   action:"qSOFA ≥ 2: Initiate Sepsis Bundle. Blood cultures. Lactate. Antibiotics within 1 hour." },
  },
  {
    id: "perc", name: "PERC Rule", category: "pulmonary",
    description: "Excludes PE without further testing. Apply only if Wells PE Score = Low Probability. ALL must be absent.",
    source: "Kline et al., J Thromb Haemost 2004",
    fields: [
      { id:"age",     label:"Age ≥ 50 years",                 type:"checkbox", value:1 },
      { id:"hr",      label:"Heart Rate ≥ 100 bpm",           type:"checkbox", value:1 },
      { id:"spo2",    label:"SpO₂ < 95% on room air",         type:"checkbox", value:1 },
      { id:"dvt",     label:"Unilateral leg swelling",         type:"checkbox", value:1 },
      { id:"hemopt",  label:"Hemoptysis",                      type:"checkbox", value:1 },
      { id:"surgery", label:"Surgery or trauma within 4 weeks",type:"checkbox", value:1 },
      { id:"prev_pe", label:"Prior PE or DVT",                 type:"checkbox", value:1 },
      { id:"hcg",     label:"Exogenous estrogen use",          type:"checkbox", value:1 },
    ],
    score: (v) => Object.values(v).reduce((a,b) => a + (b?1:0), 0),
    interpret: (s) =>
      s === 0 ? { label:"PERC Negative — PE Excluded",         color:"green", action:"All criteria absent: PE excluded without further testing in low pre-test probability patients." } :
               { label:"PERC Positive — Further Workup Needed",color:"red",   action:"Proceed with D-dimer. If positive, CTA-PE required." },
  },
  {
    id: "ciwa", name: "CIWA-Ar", category: "substance",
    description: "Quantifies alcohol withdrawal severity. Guides benzodiazepine dosing protocol.",
    source: "Sullivan et al., Br J Addict 1989",
    fields: [
      { id:"nausea",   label:"Nausea/Vomiting",     type:"select", options:[{label:"None (0)",value:0},{label:"Mild nausea (1)",value:1},{label:"Intermittent dry heaves (4)",value:4},{label:"Constant nausea/vomiting (7)",value:7}] },
      { id:"tremor",   label:"Tremor",               type:"select", options:[{label:"None (0)",value:0},{label:"Not visible, felt (1)",value:1},{label:"Moderate with arms extended (4)",value:4},{label:"Severe (7)",value:7}] },
      { id:"sweats",   label:"Diaphoresis",          type:"select", options:[{label:"None (0)",value:0},{label:"Barely perceptible (1)",value:1},{label:"Beads on forehead (4)",value:4},{label:"Drenching sweats (7)",value:7}] },
      { id:"anxiety",  label:"Anxiety",              type:"select", options:[{label:"None (0)",value:0},{label:"Mildly anxious (1)",value:1},{label:"Moderately anxious (4)",value:4},{label:"Acute panic state (7)",value:7}] },
      { id:"agitation",label:"Agitation",            type:"select", options:[{label:"Normal (0)",value:0},{label:"Somewhat more active (1)",value:1},{label:"Moderately fidgety (4)",value:4},{label:"Pacing/thrashing (7)",value:7}] },
      { id:"tactile",  label:"Tactile Disturbances", type:"select", options:[{label:"None (0)",value:0},{label:"Very mild itching (1)",value:1},{label:"Mild (2)",value:2},{label:"Moderate (3)",value:3},{label:"Mod-severe halluc. (4)",value:4},{label:"Severe (5)",value:5},{label:"Extremely severe (6)",value:6},{label:"Continuous (7)",value:7}] },
      { id:"auditory", label:"Auditory Disturbances",type:"select", options:[{label:"None (0)",value:0},{label:"Very mild (1)",value:1},{label:"Mild (2)",value:2},{label:"Moderate (3)",value:3},{label:"Mod-severe halluc. (4)",value:4},{label:"Severe (5)",value:5},{label:"Extremely severe (6)",value:6},{label:"Continuous (7)",value:7}] },
      { id:"visual",   label:"Visual Disturbances",  type:"select", options:[{label:"None (0)",value:0},{label:"Very mild (1)",value:1},{label:"Mild (2)",value:2},{label:"Moderate (3)",value:3},{label:"Mod-severe halluc. (4)",value:4},{label:"Severe (5)",value:5},{label:"Extremely severe (6)",value:6},{label:"Continuous (7)",value:7}] },
      { id:"headache", label:"Headache / Fullness",  type:"select", options:[{label:"None (0)",value:0},{label:"Very mild (1)",value:1},{label:"Mild (2)",value:2},{label:"Moderate (3)",value:3},{label:"Mod-severe (4)",value:4},{label:"Severe (5)",value:5},{label:"Very severe (6)",value:6},{label:"Extremely severe (7)",value:7}] },
      { id:"orient",   label:"Orientation/Clouding", type:"select", options:[{label:"Oriented, can do serial additions (0)",value:0},{label:"Cannot do serial additions or unsure of date (2)",value:2},{label:"Date disorientation ≤ 2 days (4)",value:4},{label:"Date disorientation > 2 days (6)",value:6}] },
    ],
    score: (v) => Object.values(v).reduce((a,b) => a + Number(b||0), 0),
    interpret: (s) =>
      s <= 9  ? { label:"Mild Withdrawal",    color:"green", action:"Monitor. PRN lorazepam. IV thiamine, folate, MVI." } :
      s <= 19 ? { label:"Moderate Withdrawal",color:"amber", action:"Symptom-triggered benzodiazepines. IV thiamine. Admit." } :
               { label:"Severe Withdrawal",  color:"red",   action:"High seizure/DT risk. IV diazepam protocol. ICU consideration. Seizure precautions." },
  },
  {
    id: "alvarado", name: "Alvarado Score", category: "gi",
    description: "Predicts likelihood of acute appendicitis. Guides CT decision and surgical consult.",
    source: "Alvarado, Ann Emerg Med 1986",
    fields: [
      { id:"migration",  label:"Migration of pain to RLQ",                type:"checkbox", value:1 },
      { id:"anorexia",   label:"Anorexia",                                type:"checkbox", value:1 },
      { id:"nausea",     label:"Nausea / Vomiting",                       type:"checkbox", value:1 },
      { id:"rlq_tend",   label:"RLQ Tenderness",                         type:"checkbox", value:2 },
      { id:"rebound",    label:"Rebound Tenderness",                      type:"checkbox", value:1 },
      { id:"temp",       label:"Elevated Temperature > 37.3°C (99.1°F)", type:"checkbox", value:1 },
      { id:"leukocytes", label:"Leukocytosis > 10,000",                   type:"checkbox", value:2 },
      { id:"shift",      label:"Left Shift (> 75% neutrophils)",          type:"checkbox", value:1 },
    ],
    score: (v) => Object.entries(v).reduce((a,[k,checked]) => {
      const field = CALCULATORS.find(c=>c.id==="alvarado").fields.find(f=>f.id===k);
      return a + (checked ? (field?.value||0) : 0);
    }, 0),
    interpret: (s) =>
      s <= 4 ? { label:"Low Probability",    color:"green", action:"< 5% probability. Observe, analgesia, serial exams." } :
      s <= 6 ? { label:"Moderate Probability",color:"amber", action:"~20–30%. CT abdomen/pelvis recommended. Surgery consult." } :
               { label:"High Probability",   color:"red",   action:"≥ 80%. Likely appendicitis. Surgical consult." },
  },
  {
    id: "ottawa_ankle", name: "Ottawa Ankle Rules", category: "ortho",
    description: "Determines necessity of ankle/foot X-ray after trauma.",
    source: "Stiell et al., JAMA 1994",
    fields: [
      { id:"posterior_fibula",label:"Bone tenderness: posterior 6cm fibula or lateral malleolus",type:"checkbox", value:1 },
      { id:"posterior_tibia", label:"Bone tenderness: posterior 6cm tibia or medial malleolus",  type:"checkbox", value:1 },
      { id:"navicular",       label:"Point tenderness at navicular",                              type:"checkbox", value:1 },
      { id:"fifth_met",       label:"Point tenderness at base of 5th metatarsal",               type:"checkbox", value:1 },
      { id:"wt_bearing",      label:"Unable to bear weight for 4 steps (at injury and in ED)",   type:"checkbox", value:1 },
    ],
    score: (v) => Object.values(v).reduce((a,b) => a + (b?1:0), 0),
    interpret: (s) =>
      s === 0 ? { label:"X-Ray NOT Required", color:"green", action:"No Ottawa criteria met. ~98% sensitivity. Treat as sprain." } :
               { label:"X-Ray REQUIRED",      color:"amber", action:"Obtain ankle and/or foot X-ray based on tenderness location." },
  },
  {
    id: "mews", name: "MEWS", category: "general",
    description: "Tracks physiological deterioration. Triggers rapid response team activation at threshold.",
    source: "Subbe et al., QJM 2001",
    fields: [
      { id:"sbp",  label:"Systolic BP (mmHg)",       type:"select", options:[{label:"≤ 70 (3)",value:3},{label:"71–80 (2)",value:2},{label:"81–100 (1)",value:1},{label:"101–199 (0)",value:0},{label:"≥ 200 (2)",value:2}] },
      { id:"hr",   label:"Heart Rate (bpm)",         type:"select", options:[{label:"< 40 (2)",value:2},{label:"40–50 (1)",value:1},{label:"51–100 (0)",value:0},{label:"101–110 (1)",value:1},{label:"111–129 (2)",value:2},{label:"≥ 130 (3)",value:3}] },
      { id:"rr",   label:"Respiratory Rate (/min)",  type:"select", options:[{label:"< 9 (2)",value:2},{label:"9–14 (0)",value:0},{label:"15–20 (1)",value:1},{label:"21–29 (2)",value:2},{label:"≥ 30 (3)",value:3}] },
      { id:"temp", label:"Temperature (°C)",         type:"select", options:[{label:"< 35.0 (2)",value:2},{label:"35.0–38.4 (0)",value:0},{label:"≥ 38.5 (2)",value:2}] },
      { id:"avpu", label:"AVPU Neurological Score",  type:"select", options:[{label:"Alert (0)",value:0},{label:"Voice responsive (1)",value:1},{label:"Pain responsive (2)",value:2},{label:"Unresponsive (3)",value:3}] },
    ],
    score: (v) => Object.values(v).reduce((a,b) => a + Number(b||0), 0),
    interpret: (s) =>
      s <= 2 ? { label:"Low Risk",     color:"green", action:"Routine monitoring. Reassess in 4–6 hours." } :
      s <= 4 ? { label:"Moderate Risk",color:"amber", action:"Increased monitoring. Physician notification." } :
               { label:"High Risk",   color:"red",   action:"MEWS ≥ 5: Urgent review. Consider rapid response. ICU evaluation." },
  },
];

// ─── Pediatric Drugs ──────────────────────────────────────────────────────────
// doseMode: "weight" | "bsa" | "crcl"
// For bsa drugs: dosePerBSA = { min, max } in mg/m² (or mg/m²/day)
// For crcl drugs: doseByCrCl = array of { maxCrCl, dose, note }
const PED_DRUGS = [
  // ── Analgesics / Antipyretics ──────────────────────────────────────────────
  { id:"acetaminophen_po", name:"Acetaminophen (PO)", category:"analgesic_antipyretic", indications:"Fever, Mild-moderate pain", route:"PO", doseMode:"weight", dosePerKg:{min:10,max:15}, unit:"mg/kg", maxSingle:1000, maxDaily:4000, frequency:"Q4-6h PRN", form:"160 mg/5 mL suspension", pearls:["Do not exceed 5 doses in 24 hours","Check for acetaminophen in combination products (Percocet, NyQuil)"] },
  { id:"ibuprofen_po", name:"Ibuprofen (PO)", category:"analgesic_antipyretic", indications:"Fever, Pain, Inflammation", route:"PO", doseMode:"weight", dosePerKg:{min:5,max:10}, unit:"mg/kg", maxSingle:400, maxDaily:1200, frequency:"Q6-8h PRN", form:"100 mg/5 mL suspension", ageRestriction:"≥ 6 months only", pearls:["Avoid in dehydration, renal insufficiency, GI bleed","Give with food"] },
  { id:"morphine_iv", name:"Morphine (IV/IM)", category:"analgesic_antipyretic", indications:"Moderate-severe pain, Post-op pain", route:"IV/IM", doseMode:"weight", dosePerKg:{min:0.05,max:0.1}, unit:"mg/kg", maxSingle:10, frequency:"Q2-4h PRN; titrate to effect", form:"1 mg/mL, 2 mg/mL, 4 mg/mL", ageRestriction:"≥ 6 months; use with caution in neonates", pearls:["Monitor respiratory status and SpO₂","Naloxone reversal: 0.01 mg/kg IV","Histamine release may cause pruritus","Reduce dose in renal impairment"] },
  { id:"ketorolac_iv", name:"Ketorolac (IV/IM)", category:"analgesic_antipyretic", indications:"Moderate-severe pain, Renal colic", route:"IV/IM", doseMode:"weight", dosePerKg:{min:0.5,max:0.5}, unit:"mg/kg", maxSingle:30, frequency:"Q6h (max 5 days total)", form:"15 mg/mL, 30 mg/mL", ageRestriction:"≥ 2 years", pearls:["Limit to ≤ 5 days (GI/renal toxicity)","Avoid in renal impairment, bleeding, or dehydration","IV/IM dose: 0.5 mg/kg (max 30 mg)"] },

  // ── Antibiotics ────────────────────────────────────────────────────────────
  { id:"amoxicillin_po", name:"Amoxicillin (PO)", category:"antibiotic", indications:"AOM, Strep pharyngitis, Sinusitis, CAP, UTI", route:"PO", doseMode:"weight", dosePerKg:{min:40,max:90}, unit:"mg/kg/day", maxSingle:875, frequency:"Divided Q8-12h × 5-10 days", form:"400 mg/5 mL suspension", pearls:["PCN allergy → azithromycin or clindamycin","High-dose 80-90 mg/kg/day for PCN-resistant AOM"] },
  { id:"azithromycin_po", name:"Azithromycin (PO)", category:"antibiotic", indications:"CAP, Atypical pneumonia, Strep (PCN-allergic), Pertussis", route:"PO", doseMode:"weight", dosePerKg:{min:5,max:12}, unit:"mg/kg/day", maxSingle:500, frequency:"QD × 5 days (10 mg/kg day 1, 5 mg/kg days 2-5)", form:"200 mg/5 mL suspension", ageRestriction:"≥ 6 months", pearls:["QTc prolongation risk","Not for S. aureus infections"] },
  { id:"ceftriaxone_im_iv", name:"Ceftriaxone (IM/IV)", category:"antibiotic", indications:"AOM (refractory), Pneumonia, UTI, Sepsis, Meningitis", route:"IM/IV", doseMode:"weight", dosePerKg:{min:50,max:100}, unit:"mg/kg/day", maxSingle:4000, frequency:"QD (Q12h for meningitis at 100 mg/kg/day)", form:"250 mg/mL reconstituted", pearls:["Lidocaine 1% diluent for IM reduces pain","Avoid in neonates < 28d with hyperbilirubinemia","Meningitis: 100 mg/kg/day divided Q12h"] },
  { id:"clindamycin_po_iv", name:"Clindamycin (PO/IV)", category:"antibiotic", indications:"MRSA skin/soft tissue, PCN allergy, Strep, Anaerobic infections", route:"PO/IV", doseMode:"weight", dosePerKg:{min:25,max:40}, unit:"mg/kg/day", maxSingle:600, frequency:"Divided Q6-8h", form:"75 mg/5 mL oral; 150 mg/mL IV", pearls:["C. diff risk — monitor for diarrhea","Drug of choice for MRSA SSTI in children","Oral bioavailability ~90% (equivalent to IV in mild-moderate disease)"] },
  { id:"trimethoprim_smx", name:"TMP-SMX (PO)", category:"antibiotic", indications:"UTI, MRSA SSTI, PCP prophylaxis/treatment", route:"PO", doseMode:"weight", dosePerKg:{min:6,max:12}, unit:"mg/kg/day TMP", maxSingle:320, frequency:"Divided Q12h", form:"40/200 mg per 5 mL suspension", ageRestriction:"≥ 2 months", pearls:["Dose based on TMP component","Avoid in sulfa allergy, G6PD deficiency","Excellent MRSA SSTI coverage — community acquired"] },
  { id:"vancomycin_iv", name:"Vancomycin (IV)", category:"antibiotic", indications:"MRSA, Serious gram-positive infections, Sepsis", route:"IV", doseMode:"weight", dosePerKg:{min:15,max:20}, unit:"mg/kg", maxSingle:3000, frequency:"Q6h — infuse over ≥ 60 min. Target AUC/MIC 400-600.", form:"500 mg, 1 g vials", pearls:["Infuse SLOWLY over ≥ 60 min — red man syndrome if rapid","Monitor renal function and trough levels (target trough 10-20 mcg/mL)","AUC-guided monitoring preferred in serious infections","Renal dose adjustment required"] },
  { id:"amox_clav_po", name:"Amoxicillin-Clavulanate (PO)", category:"antibiotic", indications:"AOM (failed therapy), Sinusitis, Animal bites, Skin infections", route:"PO", doseMode:"weight", dosePerKg:{min:40,max:90}, unit:"mg/kg/day", maxSingle:875, frequency:"Divided Q8-12h × 7-10 days", form:"600/42.9 mg per 5 mL (ES formulation)", pearls:["GI side effects common — give with food","Use ES formulation (90/6.4) for AOM in high PCN resistance areas","Dose based on amoxicillin component"] },
  { id:"gentamicin_iv", name:"Gentamicin (IV)", category:"antibiotic", indications:"Gram-negative infections, UTI, Sepsis, Synergy with PCN for endocarditis", route:"IV", doseMode:"crcl", dosePerKg:{min:2.5,max:3.5}, unit:"mg/kg", maxSingle:500, frequency:"Q8h standard dosing; extended interval Q24h in some protocols", form:"10 mg/mL, 40 mg/mL", doseByCrCl:[
    { maxCrCl: 10,  dose: "2 mg/kg Q48h",  note: "Severe renal impairment" },
    { maxCrCl: 30,  dose: "2 mg/kg Q24h",  note: "Moderate impairment" },
    { maxCrCl: 60,  dose: "2.5 mg/kg Q12h",note: "Mild impairment" },
    { maxCrCl: 999, dose: "2.5-3.5 mg/kg Q8h", note: "Normal function — standard dosing" },
  ], pearls:["Monitor peak (5-10 mcg/mL) and trough (< 2 mcg/mL) levels","Nephrotoxic + ototoxic — avoid with other nephrotoxins","Once-daily dosing (5-7 mg/kg Q24h) used in many pediatric centers for reduced toxicity"] },

  // ── Emergency / Resuscitation ─────────────────────────────────────────────
  { id:"epinephrine_im", name:"Epinephrine IM (Anaphylaxis)", category:"emergency", indications:"Anaphylaxis, Severe allergic reaction, Bronchospasm", route:"IM anterolateral thigh", doseMode:"weight", dosePerKg:{min:0.01,max:0.01}, unit:"mg/kg", maxSingle:0.5, frequency:"May repeat Q5-15 min × 1. If 2 doses needed, admit.", form:"1 mg/mL (1:1000)", pearls:["ALWAYS IM anterolateral thigh","EpiPen Jr (0.15 mg) for 10-25 kg; EpiPen (0.3 mg) for ≥ 25 kg","First-line — NO contraindications in anaphylaxis","Antihistamines/steroids are adjuncts only"] },
  { id:"adenosine_iv", name:"Adenosine (IV) — SVT", category:"emergency", indications:"SVT, Supraventricular tachycardia", route:"IV rapid push", doseMode:"weight", dosePerKg:{min:0.1,max:0.3}, unit:"mg/kg", maxSingle:12, frequency:"First dose: 0.1 mg/kg. If no response in 2 min → 0.2 mg/kg. Max third dose 0.3 mg/kg.", form:"3 mg/mL", pearls:["Rapid IV push into antecubital and IMMEDIATELY flush with 20 mL NS","Brief asystole (5-10 sec) is expected and therapeutic","Have defibrillator at bedside","Caffeine blocks effect — may need higher dose"] },
  { id:"atropine_bradycardia", name:"Atropine (IV) — Bradycardia", category:"emergency", indications:"Symptomatic bradycardia, Vagally-mediated bradycardia, Pre-intubation", route:"IV/IO", doseMode:"weight", dosePerKg:{min:0.02,max:0.02}, unit:"mg/kg", maxSingle:0.5, frequency:"May repeat × 1 in 3-5 min. Max total: 1 mg in children.", form:"0.1 mg/mL, 0.4 mg/mL", pearls:["Minimum dose 0.1 mg (paradoxical bradycardia risk with smaller doses)","Pre-RSI dose to prevent vagal response during laryngoscopy","Monitor for tachycardia, urinary retention"] },
  { id:"rocuronium_rsi", name:"Rocuronium (IV) — RSI", category:"emergency", indications:"RSI, Emergency intubation", route:"IV", doseMode:"weight", dosePerKg:{min:1.2,max:1.6}, unit:"mg/kg", maxSingle:200, frequency:"Single IV bolus. Onset 45-60 seconds.", form:"10 mg/mL", pearls:["Standard RSI: 1.2 mg/kg (onset 60s, duration 30-60 min)","If succinylcholine contraindicated: 1.6 mg/kg","Sugammadex reversal: 16 mg/kg IV","Atropine 0.02 mg/kg pretreatment for infants < 1 year"] },
  { id:"succinylcholine_rsi", name:"Succinylcholine (IV) — RSI", category:"emergency", indications:"RSI, Short-duration paralysis", route:"IV/IM", doseMode:"weight", dosePerKg:{min:1.5,max:2.0}, unit:"mg/kg", maxSingle:150, frequency:"Single bolus. Onset 30-60 sec. Duration 5-10 min.", form:"20 mg/mL", pearls:["CONTRAINDICATED in hyperkalemia — fatal cardiac arrest risk","Pediatric dose higher: 2 mg/kg for infants/children","IM dose: 4 mg/kg (onset 3-4 min)","Malignant hyperthermia risk — have dantrolene available"] },
  { id:"ns_bolus", name:"Normal Saline Bolus (IV)", category:"emergency", indications:"Dehydration, Hypovolemia, Shock, Sepsis", route:"IV", doseMode:"weight", dosePerKg:{min:10,max:20}, unit:"mL/kg", maxSingle:2000, frequency:"Over 15-60 min. Reassess after each bolus.", form:"0.9% NaCl — 250 mL or 500 mL bags", pearls:["Max 60 mL/kg total in first hour for septic shock","DKA: limit 10 mL/kg — avoid rapid shifts (cerebral edema risk)","Reassess for fluid overload after each bolus","LR may be preferred over NS for large-volume resuscitation"] },
  { id:"lorazepam_iv", name:"Lorazepam (IV/IM) — Seizure", category:"emergency", indications:"Acute seizure, Status epilepticus", route:"IV/IM", doseMode:"weight", dosePerKg:{min:0.05,max:0.1}, unit:"mg/kg", maxSingle:4, frequency:"May repeat × 1 after 5-10 min if seizure continues.", form:"2 mg/mL injectable", pearls:["IV lorazepam first-line for status epilepticus","IM equally effective if no IV access","Have bag-valve-mask and intubation equipment at bedside","Monitor respiratory rate and SpO₂ closely"] },
  { id:"glucose_d10", name:"Dextrose — Hypoglycemia", category:"emergency", indications:"Symptomatic hypoglycemia (glucose < 50 mg/dL)", route:"IV", doseMode:"weight", dosePerKg:{min:2,max:4}, unit:"mL/kg D10W", maxSingle:500, frequency:"Over 5-10 min. Recheck glucose in 15 min.", form:"D10W (10% dextrose)", pearls:["D10W preferred in children (D25W, D50W too hypertonic for small veins)","Recheck BGL in 15-30 min and start dextrose maintenance infusion","Cause of hypoglycemia must be identified"] },

  // ── Respiratory ───────────────────────────────────────────────────────────
  { id:"albuterol_neb", name:"Albuterol (Nebulized)", category:"respiratory", indications:"Asthma, Bronchospasm, Wheezing, RAD", route:"Inhalation", doseMode:"weight", dosePerKg:{min:0.15,max:0.15}, unit:"mg/kg", maxSingle:5, frequency:"Q20 min × 3 (acute), then Q4h PRN. Continuous neb for severe.", form:"2.5 mg/3 mL unit-dose nebulizer", pearls:["< 20 kg → 2.5 mg per neb; ≥ 20 kg → 5 mg per neb","MDI + valved spacer equals nebulizer in mild-moderate disease","Add ipratropium for first 3 treatments in moderate-severe asthma","Monitor for hypokalemia with high-dose"] },
  { id:"ipratropium_neb", name:"Ipratropium (Nebulized)", category:"respiratory", indications:"Asthma (add-on), COPD exacerbation", route:"Inhalation", doseMode:"weight", dosePerKg:{min:0.25,max:0.5}, unit:"mg (fixed)", maxSingle:0.5, frequency:"Q20 min × 3 doses alongside albuterol, then Q6h PRN", form:"0.5 mg/2.5 mL unit-dose nebulizer", pearls:["Fixed dose: < 20 kg → 0.25 mg; ≥ 20 kg → 0.5 mg","Use only for first 3 doses in acute asthma — no additional benefit afterward","Combined with albuterol reduces hospitalization in moderate-severe asthma"] },
  { id:"dexamethasone", name:"Dexamethasone (PO/IV/IM)", category:"respiratory", indications:"Croup, Asthma, Allergic reaction, Cerebral edema, Meningitis (adjunct)", route:"PO/IV/IM", doseMode:"weight", dosePerKg:{min:0.15,max:0.6}, unit:"mg/kg", maxSingle:16, frequency:"Single dose for croup/allergic. BID × 2 days for asthma.", form:"4 mg/mL injectable or 0.5 mg/5 mL oral", pearls:["Croup: 0.6 mg/kg PO, max 10 mg — single dose as effective as IM","Asthma: 2-day course non-inferior to 5-day prednisone","Meningitis: 0.15 mg/kg IV Q6h × 4 days — give BEFORE or WITH first antibiotic"] },
  { id:"magnesium_iv", name:"Magnesium Sulfate (IV) — Asthma", category:"respiratory", indications:"Severe/refractory asthma, Status asthmaticus", route:"IV", doseMode:"weight", dosePerKg:{min:25,max:75}, unit:"mg/kg", maxSingle:2000, frequency:"Single dose IV over 20-30 min. Repeat in 4-6h if needed.", form:"500 mg/mL (50%) diluted to 20 mg/mL", pearls:["Dilute to 20 mg/mL or less — infuse slowly over 20 min","Monitor BP and respiratory rate during infusion","Bronchodilatory effect: smooth muscle relaxation","Calcium gluconate (100 mg/kg IV) reverses toxicity if needed"] },
  { id:"racepinephrine_neb", name:"Racepinephrine (Nebulized) — Croup", category:"respiratory", indications:"Moderate-severe croup, Post-extubation stridor", route:"Inhalation", doseMode:"weight", dosePerKg:{min:0.5,max:0.5}, unit:"mL/kg of 2.25% solution", maxSingle:3, frequency:"Q1-4h PRN. Observe 2-4 hrs after last dose for rebound.", form:"2.25% racepinephrine solution", pearls:["Maximum: 3 mL of 2.25% solution; dilute to 3 mL total with NS","Rebound effect 2-4 hrs — keep patient for observation","Dexamethasone MUST accompany racepinephrine treatment","Does not change natural disease course — only symptomatic relief"] },

  // ── Antiemetics ───────────────────────────────────────────────────────────
  { id:"ondansetron", name:"Ondansetron (PO/IV)", category:"antiemetic", indications:"Nausea, Vomiting, Gastroenteritis", route:"PO/IV", doseMode:"weight", dosePerKg:{min:0.1,max:0.15}, unit:"mg/kg", maxSingle:8, frequency:"Q8h PRN", form:"4 mg ODT or 2 mg/mL IV", ageRestriction:"≥ 6 months IV, ≥ 4 years PO", pearls:["QTc prolongation — avoid if QTc > 450ms","ODT preferred for vomiting patients","Weight-based: < 30 kg → 4 mg, ≥ 30 kg → 8 mg"] },
  { id:"diphenhydramine", name:"Diphenhydramine (PO/IV/IM)", category:"antiemetic", indications:"Allergic reaction, Urticaria, Pruritus, Dystonic reaction", route:"PO/IV/IM", doseMode:"weight", dosePerKg:{min:1,max:1.25}, unit:"mg/kg", maxSingle:50, maxDaily:300, frequency:"Q6h PRN", form:"50 mg/mL injectable", ageRestriction:"Avoid < 2 years", pearls:["Significant sedation — warn family","For anaphylaxis: epinephrine is first-line, diphenhydramine is adjunct ONLY"] },

  // ── Oncology / BSA-Dosed ──────────────────────────────────────────────────
  { id:"vincristine", name:"Vincristine (IV)", category:"oncology", indications:"ALL, Lymphoma, Wilms tumor, Rhabdomyosarcoma", route:"IV", doseMode:"bsa", dosePerBSA:{min:1.5,max:2.0}, unit:"mg/m²", maxSingle:2, frequency:"Q1-3 weeks per protocol", form:"1 mg/mL (intrathecal administration is FATAL)", pearls:["NEVER intrathecal — causes fatal neurotoxicity","Max dose typically 2 mg regardless of BSA","Neurotoxic: monitor for peripheral neuropathy, constipation, SIADH","Vesicant — extravasation causes tissue necrosis"] },
  { id:"methotrexate_it", name:"Methotrexate (Intrathecal)", category:"oncology", indications:"CNS prophylaxis/treatment in ALL, Lymphomatous meningitis", route:"Intrathecal", doseMode:"bsa", dosePerBSA:{min:8,max:15}, unit:"mg/m²", maxSingle:15, frequency:"Per chemotherapy protocol (varies)", form:"25 mg/mL preservative-free solution", pearls:["BSA-based IT dosing; age-based alternative: < 1yr → 6 mg, 1-2yr → 8 mg, 2-3yr → 10 mg, > 3yr → 12 mg","Must use PRESERVATIVE-FREE formulation for IT route","Leucovorin rescue for high-dose IV methotrexate","Monitor CBC, LFTs, renal function"] },
  { id:"etoposide_iv", name:"Etoposide (VP-16) (IV)", category:"oncology", indications:"Relapsed leukemia, Lymphoma, Neuroblastoma, Germ cell tumors", route:"IV", doseMode:"bsa", dosePerBSA:{min:75,max:200}, unit:"mg/m²/day", maxSingle:500, frequency:"Per protocol (varies by indication)", form:"20 mg/mL — dilute to ≤ 0.4 mg/mL for infusion", pearls:["Infuse over ≥ 60 min — hypotension with rapid infusion","Significant myelosuppression — nadir 10-14 days","Secondary AML risk with cumulative exposure > 2000 mg/m²","Hypersensitivity reactions possible — premedicate"] },
  { id:"cytarabine_it", name:"Cytarabine (IT/IV)", category:"oncology", indications:"ALL, AML, Lymphoma, CNS prophylaxis", route:"IV/IT", doseMode:"bsa", dosePerBSA:{min:100,max:3000}, unit:"mg/m²", maxSingle:6000, frequency:"Per protocol (varies widely)", form:"20 mg/mL, 100 mg/mL", pearls:["High-dose (HD-Ara-C ≥ 1 g/m²): give pyridoxine and steroid eye drops to prevent ocular toxicity","IT: use preservative-free formulation only","Cerebellar toxicity with HD-Ara-C — assess for ataxia, dysarthria","Major myelosuppression — monitor CBC closely"] },
  { id:"carboplatin_iv", name:"Carboplatin (IV)", category:"oncology", indications:"Neuroblastoma, Brain tumors, Germ cell tumors, Osteosarcoma", route:"IV", doseMode:"bsa", dosePerBSA:{min:175,max:560}, unit:"mg/m²", maxSingle:Infinity, frequency:"Per protocol (typically Q3-4 weeks)", form:"10 mg/mL", pearls:["AUC-based dosing (Calvert formula) for adults; BSA-based for children","Thrombocytopenia is dose-limiting toxicity — nadir at 21 days","Less nephrotoxic/neurotoxic than cisplatin","Pre-hydration required; monitor renal function"] },

  // ── Renal-Dosed (CrCl) ───────────────────────────────────────────────────
  { id:"acyclovir_iv", name:"Acyclovir (IV)", category:"antiviral", indications:"HSV encephalitis, Disseminated HSV, Varicella-zoster (immunocompromised)", route:"IV", doseMode:"crcl", dosePerKg:{min:10,max:20}, unit:"mg/kg", maxSingle:800, frequency:"Q8h; adjust for renal impairment", form:"50 mg/mL for reconstitution", doseByCrCl:[
    { maxCrCl: 10,  dose: "10 mg/kg Q24h",  note: "Severe renal impairment" },
    { maxCrCl: 25,  dose: "10 mg/kg Q12h",  note: "Moderate impairment" },
    { maxCrCl: 50,  dose: "10 mg/kg Q8h", note: "Mild impairment — standard dose" },
    { maxCrCl: 999, dose: "10-20 mg/kg Q8h", note: "Normal function — full dose by indication" },
  ], pearls:["Nephrotoxic — pre-hydrate, infuse over ≥ 60 min","HSV encephalitis: 20 mg/kg/dose Q8h in children","Neonatal HSV: 60 mg/kg/day divided Q8h × 14-21 days","Precipitation in urine — keep patient well hydrated"] },
  { id:"trimethoprim_smx_crcl", name:"TMP-SMX Renal Dosing (IV)", category:"antiviral", indications:"PCP pneumonia, Serious UTI, Nocardia (renal adjusted)", route:"IV/PO", doseMode:"crcl", dosePerKg:{min:5,max:20}, unit:"mg/kg/day TMP", maxSingle:640, frequency:"Divided Q6-12h based on indication", form:"16 mg TMP + 80 mg SMX per mL IV", doseByCrCl:[
    { maxCrCl: 15,  dose: "Avoid if possible", note: "High risk of accumulation" },
    { maxCrCl: 30,  dose: "50% of normal dose", note: "Moderate impairment" },
    { maxCrCl: 999, dose: "Full dose Q6-12h per indication", note: "Normal function" },
  ], pearls:["PCP treatment: 15-20 mg/kg/day TMP component divided Q6h × 21 days","Monitor creatinine, BMP during therapy","Risk of hyperkalemia in renal impairment","Adequate hydration to prevent crystalluria"] },
];

// ─── Helper: initial field values ─────────────────────────────────────────────
function initValues(fields) {
  const v = {};
  fields.forEach(f => {
    if (f.type === "checkbox") v[f.id] = false;
    else v[f.id] = f.options?.[0]?.value ?? 0;
  });
  return v;
}

// ─── AI Insight Panel ─────────────────────────────────────────────────────────
function AIInsightPanel({ calc, values, score, result }) {
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState(null);
  const [open, setOpen] = useState(false);

  const handleAnalyze = async () => {
    setOpen(true);
    if (insight) return; // already loaded
    setLoading(true);

    // Build human-readable inputs summary
    const inputsSummary = calc.fields.map(f => {
      if (f.type === "checkbox") {
        return `${f.label}: ${values[f.id] ? "Yes" : "No"}`;
      } else {
        const selected = f.options?.find(o => String(o.value) === String(values[f.id]));
        return `${f.label}: ${selected?.label || values[f.id]}`;
      }
    }).join("\n");

    const resp = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a clinical decision support AI. A clinician has just calculated a ${calc.name} score.

Calculator: ${calc.name}
Description: ${calc.description}
Inputs entered:
${inputsSummary}

Calculated Score: ${score}
Result: ${result.label}
Standard Recommendation: ${result.action}

Provide a concise, clinically actionable AI analysis with:
1. clinical_context: 2-3 sentences explaining what this score means for this specific patient given their inputs. Be specific about which inputs drove the score.
2. next_steps: Array of 3-5 specific, prioritized clinical actions to take right now (e.g., order specific labs, consult, medication, imaging). Be concrete.
3. pitfalls: Array of 2-3 common pitfalls or caveats specific to this score and these inputs that the clinician should be aware of.
4. resources: Array of 2-3 relevant guidelines or reference resources (name and brief description only).`,
      response_json_schema: {
        type: "object",
        properties: {
          clinical_context: { type: "string" },
          next_steps: { type: "array", items: { type: "string" } },
          pitfalls: { type: "array", items: { type: "string" } },
          resources: { type: "array", items: { type: "string" } },
        }
      }
    });

    setInsight(resp);
    setLoading(false);
  };

  return (
    <div>
      <button
        onClick={handleAnalyze}
        className="px-3 py-1.5 rounded text-xs border border-[#9b6dff] bg-[rgba(155,109,255,0.1)] text-[#9b6dff] hover:bg-[rgba(155,109,255,0.2)] transition-all cursor-pointer flex items-center gap-1.5 font-semibold"
      >
        <Sparkles size={11} /> AI Analysis
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 rounded-lg border border-[#9b6dff]/40 bg-[rgba(155,109,255,0.06)] p-3 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#9b6dff]">
                  <Sparkles size={11} /> AI Clinical Insight
                </div>
                <button onClick={() => setOpen(false)} className="text-[#4a7299] hover:text-[#c8ddf0] text-xs cursor-pointer">✕</button>
              </div>

              {loading ? (
                <div className="flex items-center gap-2 py-3 justify-center">
                  <Loader2 size={14} className="animate-spin text-[#9b6dff]" />
                  <span className="text-xs text-[#4a7299]">Analyzing clinical context…</span>
                </div>
              ) : insight ? (
                <>
                  {insight.clinical_context && (
                    <div>
                      <div className="text-xs font-semibold text-[#c8ddf0] mb-1">Clinical Context</div>
                      <p className="text-xs text-[#a8c4e0] leading-relaxed">{insight.clinical_context}</p>
                    </div>
                  )}
                  {insight.next_steps?.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-[#00d4bc] mb-1.5">Recommended Next Steps</div>
                      <div className="flex flex-col gap-1">
                        {insight.next_steps.map((step, i) => (
                          <div key={i} className="flex gap-2 text-xs text-[#c8ddf0]">
                            <span className="text-[#00d4bc] font-bold shrink-0">{i + 1}.</span>
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {insight.pitfalls?.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-[#f5a623] mb-1.5 flex items-center gap-1">
                        <AlertTriangle size={11} /> Clinical Pitfalls
                      </div>
                      <div className="flex flex-col gap-1">
                        {insight.pitfalls.map((p, i) => (
                          <div key={i} className="flex gap-2 text-xs text-[#c8ddf0]">
                            <span className="text-[#f5a623] shrink-0">⚠</span>
                            <span>{p}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {insight.resources?.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-[#4a7299] mb-1.5">Resources & Guidelines</div>
                      <div className="flex flex-col gap-1">
                        {insight.resources.map((r, i) => (
                          <div key={i} className="text-xs text-[#4a7299] flex gap-1.5">
                            <span className="text-[#2a4d72]">📚</span>
                            <span>{r}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => { setInsight(null); setLoading(false); handleAnalyze(); }}
                    className="text-xs text-[#4a7299] hover:text-[#9b6dff] cursor-pointer self-start transition-all"
                  >
                    ↻ Re-analyze with current values
                  </button>
                </>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Calculator Card ──────────────────────────────────────────────────────────
function CalculatorCard({ calc, initialExpanded = false }) {
  const [values, setValues] = useState(() => initValues(calc.fields));
  const [expanded, setExpanded] = useState(initialExpanded);
  const [saved, setSaved] = useState(false);

  const score = useMemo(() => {
    try { return calc.score(values); } catch { return 0; }
  }, [values, calc]);

  const result = useMemo(() => calc.interpret(score), [score, calc]);
  const ec = EVIDENCE_COLORS[result.color] || EVIDENCE_COLORS.green;

  const handleChange = (id, val) => setValues(prev => ({ ...prev, [id]: val }));

  const handleReset = () => {
    setValues(initValues(calc.fields));
    setSaved(false);
  };

  return (
    <div className="bg-[#0e2340] border border-[#1e3a5f] rounded-xl transition-all">
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-[#162d4f] transition-all"
        onClick={() => setExpanded(e => !e)}
      >
        <div>
          <div className="text-sm font-bold text-[#e8f4ff]">{calc.name}</div>
          <div className="text-xs text-[#4a7299] mt-0.5">{calc.description}</div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {expanded && (
            <div className="px-2 py-1 rounded text-xs font-bold" style={{ background: ec.bg, color: ec.color }}>
              {score} — {result.label}
            </div>
          )}
          {expanded ? <ChevronUp size={14} className="text-[#4a7299]" /> : <ChevronDown size={14} className="text-[#4a7299]" />}
        </div>
      </div>

      {/* Body */}
      {expanded && (
        <div className="border-t border-[#1e3a5f] px-4 py-3 flex flex-col gap-3">
          <div className="text-xs text-[#4a7299] italic">{calc.source}</div>

          {/* Fields */}
          <div className="flex flex-col gap-2">
            {calc.fields.map(f => (
              <div key={f.id} className="flex items-center justify-between gap-2">
                <label className="text-xs text-[#c8ddf0] flex-1">{f.label}</label>
                {f.type === "checkbox" ? (
                  <input
                    type="checkbox"
                    checked={!!values[f.id]}
                    onChange={e => handleChange(f.id, e.target.checked)}
                    className="w-4 h-4 cursor-pointer accent-[#9b6dff]"
                  />
                ) : (
                  <select
                    value={values[f.id]}
                    onChange={e => handleChange(f.id, Number(e.target.value))}
                    className="bg-[#162d4f] border border-[#1e3a5f] text-[#c8ddf0] text-xs rounded px-2 py-1 cursor-pointer outline-none max-w-[55%]"
                  >
                    {f.options.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>

          {/* Score result */}
          <div className="rounded-lg p-3 mt-1 border" style={{ background: ec.bg, borderColor: ec.color + "40" }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold" style={{ color: ec.color }}>{result.label}</span>
              <span className="text-lg font-bold" style={{ color: ec.color }}>Score: {score}</span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: ec.color }}>{result.action}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleReset}
              className="px-3 py-1.5 rounded text-xs border border-[#1e3a5f] bg-[#162d4f] text-[#4a7299] hover:text-[#c8ddf0] transition-all cursor-pointer"
            >
              Reset
            </button>
            <button
              onClick={() => { setSaved(true); toast.success("Result saved to note"); }}
              className="px-3 py-1.5 rounded text-xs border border-[#00d4bc] bg-[rgba(0,212,188,0.1)] text-[#00d4bc] hover:bg-[rgba(0,212,188,0.2)] transition-all cursor-pointer flex items-center gap-1"
            >
              <Plus size={10} /> {saved ? "Saved ✓" : "Add to Note"}
            </button>
            <AIInsightPanel calc={calc} values={values} score={score} result={result} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── BSA Formula (Mosteller) ──────────────────────────────────────────────────
function calcBSA(weightKg, heightCm) {
  const w = parseFloat(weightKg);
  const h = parseFloat(heightCm);
  if (!w || !h || w <= 0 || h <= 0) return null;
  return Math.sqrt((w * h) / 3600);
}

// ─── Schwartz CrCl ────────────────────────────────────────────────────────────
function calcCrCl(heightCm, serumCr) {
  const h = parseFloat(heightCm);
  const scr = parseFloat(serumCr);
  if (!h || !scr || h <= 0 || scr <= 0) return null;
  // Bedside Schwartz formula: CrCl = 0.413 × Height(cm) / SCr
  return (0.413 * h) / scr;
}

const DRUG_CATEGORIES = [
  { id:"all", label:"All Drugs" },
  { id:"analgesic_antipyretic", label:"Analgesics" },
  { id:"antibiotic", label:"Antibiotics" },
  { id:"antiviral", label:"Antivirals" },
  { id:"antiemetic", label:"Antiemetics" },
  { id:"respiratory", label:"Respiratory" },
  { id:"emergency", label:"Emergency" },
  { id:"oncology", label:"Oncology (BSA)" },
];

// ─── Pediatric Dosing Calculator ──────────────────────────────────────────────
function PedDosingCalc() {
  const [weightKg, setWeightKg] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [serumCr, setSerumCr] = useState("");
  const [search, setSearch] = useState("");
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [drugCategory, setDrugCategory] = useState("all");

  const bsa = useMemo(() => calcBSA(weightKg, heightCm), [weightKg, heightCm]);
  const crCl = useMemo(() => calcCrCl(heightCm, serumCr), [heightCm, serumCr]);

  const filteredDrugs = useMemo(() => {
    let drugs = PED_DRUGS;
    if (drugCategory !== "all") drugs = drugs.filter(d => d.category === drugCategory);
    if (!search.trim()) return drugs;
    const q = search.toLowerCase();
    return drugs.filter(d =>
      d.name.toLowerCase().includes(q) ||
      d.indications.toLowerCase().includes(q) ||
      d.category.toLowerCase().includes(q)
    );
  }, [search, drugCategory]);

  const calcDose = (drug) => {
    const w = parseFloat(weightKg);
    if (drug.doseMode === "bsa") {
      if (!bsa) return null;
      const minDose = drug.dosePerBSA.min * bsa;
      const maxDose = drug.dosePerBSA.max * bsa;
      const capMin = drug.maxSingle && drug.maxSingle !== Infinity ? Math.min(minDose, drug.maxSingle) : minDose;
      const capMax = drug.maxSingle && drug.maxSingle !== Infinity ? Math.min(maxDose, drug.maxSingle) : maxDose;
      return { minDose: capMin.toFixed(2), maxDose: capMax.toFixed(2), capped: maxDose > (drug.maxSingle||Infinity), bsaUsed: bsa.toFixed(2), mode: "bsa" };
    }
    if (drug.doseMode === "crcl") {
      const weightDose = w > 0 ? (() => {
        const mn = drug.dosePerKg.min * w;
        const mx = drug.dosePerKg.max * w;
        return { min: Math.min(mn, drug.maxSingle||mn).toFixed(2), max: Math.min(mx, drug.maxSingle||mx).toFixed(2) };
      })() : null;
      const crClTier = crCl && drug.doseByCrCl ? drug.doseByCrCl.find(t => crCl <= t.maxCrCl) : null;
      return { weightDose, crClTier, crClValue: crCl ? crCl.toFixed(1) : null, mode: "crcl" };
    }
    // weight-based (default)
    if (!w || w <= 0) return null;
    const minDose = drug.dosePerKg.min * w;
    const maxDose = drug.dosePerKg.max * w;
    const capMin = drug.maxSingle ? Math.min(minDose, drug.maxSingle) : minDose;
    const capMax = drug.maxSingle ? Math.min(maxDose, drug.maxSingle) : maxDose;
    return { minDose: capMin.toFixed(2), maxDose: capMax.toFixed(2), capped: maxDose > (drug.maxSingle||Infinity), mode: "weight" };
  };

  const DosePreview = ({ drug }) => {
    const dose = calcDose(drug);
    if (!dose) {
      const needsBSA = drug.doseMode === "bsa";
      const needsCrCl = drug.doseMode === "crcl";
      return <div className="text-xs text-[#4a7299]">{needsBSA ? "Enter wt+ht" : needsCrCl ? "Enter inputs" : "Enter weight"}</div>;
    }
    if (dose.mode === "bsa") {
      return (
        <div className="text-right shrink-0">
          <div className="text-sm font-bold text-[#9b6dff]">
            {dose.minDose === dose.maxDose ? dose.minDose : `${dose.minDose}–${dose.maxDose}`} {drug.unit.replace("/m²","")}
          </div>
          <div className="text-xs text-[#4a7299]">BSA {dose.bsaUsed} m²</div>
          {dose.capped && <div className="text-xs text-[#f5a623]">Max capped</div>}
        </div>
      );
    }
    if (dose.mode === "crcl") {
      return (
        <div className="text-right shrink-0">
          {dose.crClTier ? (
            <div className="text-sm font-bold text-[#f5a623]">{dose.crClTier.dose}</div>
          ) : dose.weightDose ? (
            <div className="text-sm font-bold text-[#00d4bc]">{dose.weightDose.min === dose.weightDose.max ? dose.weightDose.min : `${dose.weightDose.min}–${dose.weightDose.max}`} {drug.unit.replace("/kg","")}</div>
          ) : null}
          {dose.crClValue && <div className="text-xs text-[#4a7299]">CrCl {dose.crClValue} mL/min</div>}
        </div>
      );
    }
    return (
      <div className="text-right shrink-0">
        <div className="text-sm font-bold text-[#00d4bc]">
          {dose.minDose === dose.maxDose ? dose.minDose : `${dose.minDose}–${dose.maxDose}`} {drug.unit.replace("/kg","").replace("/kg/day","")}
        </div>
        {dose.capped && <div className="text-xs text-[#f5a623]">Max capped</div>}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Patient Parameters */}
      <div className="bg-[#0e2340] border border-[#1e3a5f] rounded-xl p-4 flex flex-col gap-3">
        <div className="text-xs font-bold uppercase tracking-wide text-[#9b6dff]">Patient Parameters</div>

        {/* Weight + Height */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-[#4a7299] mb-1 block">Weight</label>
            <div className="flex items-center gap-1.5 bg-[#162d4f] border border-[#1e3a5f] rounded-lg px-2 py-1.5">
              <input type="number" min="0" step="0.1" placeholder="0.0" value={weightKg} onChange={e => setWeightKg(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-sm text-[#e8f4ff] placeholder:text-[#4a7299] w-0" />
              <span className="text-xs text-[#4a7299] shrink-0">kg</span>
            </div>
            {weightKg && <div className="text-xs text-[#4a7299] mt-0.5">= {(parseFloat(weightKg)*2.205).toFixed(1)} lbs</div>}
          </div>
          <div>
            <label className="text-xs text-[#4a7299] mb-1 block">Height</label>
            <div className="flex items-center gap-1.5 bg-[#162d4f] border border-[#1e3a5f] rounded-lg px-2 py-1.5">
              <input type="number" min="0" step="1" placeholder="0" value={heightCm} onChange={e => setHeightCm(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-sm text-[#e8f4ff] placeholder:text-[#4a7299] w-0" />
              <span className="text-xs text-[#4a7299] shrink-0">cm</span>
            </div>
            {heightCm && <div className="text-xs text-[#4a7299] mt-0.5">= {(parseFloat(heightCm)/2.54).toFixed(1)} in</div>}
          </div>
        </div>

        {/* Serum Creatinine */}
        <div>
          <label className="text-xs text-[#4a7299] mb-1 block">Serum Creatinine <span className="text-[#2a4d72]">(for CrCl dosing)</span></label>
          <div className="flex items-center gap-1.5 bg-[#162d4f] border border-[#1e3a5f] rounded-lg px-2 py-1.5 max-w-[180px]">
            <input type="number" min="0" step="0.01" placeholder="0.00" value={serumCr} onChange={e => setSerumCr(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-sm text-[#e8f4ff] placeholder:text-[#4a7299] w-0" />
            <span className="text-xs text-[#4a7299] shrink-0">mg/dL</span>
          </div>
        </div>

        {/* Derived values */}
        {(bsa || crCl) && (
          <div className="flex gap-3 flex-wrap">
            {bsa && (
              <div className="flex items-center gap-2 bg-[rgba(155,109,255,0.1)] border border-[#9b6dff]/30 rounded-lg px-3 py-1.5">
                <span className="text-xs text-[#4a7299]">BSA (Mosteller):</span>
                <span className="text-sm font-bold text-[#9b6dff]">{bsa.toFixed(2)} m²</span>
              </div>
            )}
            {crCl && (
              <div className="flex items-center gap-2 bg-[rgba(245,166,35,0.1)] border border-[#f5a623]/30 rounded-lg px-3 py-1.5">
                <span className="text-xs text-[#4a7299]">CrCl (Schwartz):</span>
                <span className="text-sm font-bold text-[#f5a623]">{crCl.toFixed(1)} mL/min</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Search + Category Filter */}
      <div className="flex gap-2">
        <div className="flex items-center gap-2 bg-[#0e2340] border border-[#1e3a5f] rounded-lg px-3 py-2 flex-1">
          <Search size={13} className="text-[#4a7299] shrink-0" />
          <input type="text" placeholder="Search drug, indication…" value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-xs text-[#e8f4ff] placeholder:text-[#4a7299]" />
        </div>
        <select value={drugCategory} onChange={e => setDrugCategory(e.target.value)}
          className="bg-[#0e2340] border border-[#1e3a5f] text-[#c8ddf0] text-xs rounded-lg px-2 py-2 outline-none cursor-pointer">
          {DRUG_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
      </div>

      {/* Legend */}
      <div className="flex gap-3 text-xs text-[#4a7299]">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#00d4bc] inline-block" /> Weight-based</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#9b6dff] inline-block" /> BSA-based</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#f5a623] inline-block" /> Renal-adjusted</span>
      </div>

      {/* Drug list */}
      <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col gap-2">
        {filteredDrugs.map(drug => {
          const isSelected = selectedDrug?.id === drug.id;
          const modeColor = drug.doseMode === "bsa" ? "#9b6dff" : drug.doseMode === "crcl" ? "#f5a623" : "#00d4bc";
          return (
            <div key={drug.id} className={`bg-[#0e2340] border rounded-xl overflow-hidden transition-all`}
              style={{ borderColor: isSelected ? modeColor : "#1e3a5f" }}>
              <div className="px-4 py-3 cursor-pointer hover:bg-[#162d4f] transition-all" onClick={() => setSelectedDrug(isSelected ? null : drug)}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-bold text-[#e8f4ff] truncate">{drug.name}</div>
                      <span className="text-xs px-1.5 py-0.5 rounded font-bold shrink-0" style={{ background: modeColor + "20", color: modeColor }}>
                        {drug.doseMode === "bsa" ? "BSA" : drug.doseMode === "crcl" ? "CrCl" : "Wt"}
                      </span>
                    </div>
                    <div className="text-xs text-[#4a7299] mt-0.5 truncate">{drug.indications}</div>
                  </div>
                  <DosePreview drug={drug} />
                  {isSelected ? <ChevronUp size={12} className="text-[#4a7299] shrink-0 ml-1" /> : <ChevronDown size={12} className="text-[#4a7299] shrink-0 ml-1" />}
                </div>
              </div>

              {isSelected && (() => {
                const dose = calcDose(drug);
                return (
                  <div className="border-t border-[#1e3a5f] px-4 py-3 flex flex-col gap-2">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      <div><span className="text-[#4a7299]">Route:</span> <span className="text-[#c8ddf0] font-medium">{drug.route}</span></div>
                      <div><span className="text-[#4a7299]">Frequency:</span> <span className="text-[#c8ddf0] font-medium">{drug.frequency}</span></div>
                      {drug.dosePerBSA && <div className="col-span-2"><span className="text-[#4a7299]">BSA Range:</span> <span className="text-[#c8ddf0] font-medium">{drug.dosePerBSA.min}–{drug.dosePerBSA.max} {drug.unit}</span></div>}
                      {drug.dosePerKg && !drug.dosePerBSA && <div className="col-span-2"><span className="text-[#4a7299]">Dose Range:</span> <span className="text-[#c8ddf0] font-medium">{drug.dosePerKg.min}–{drug.dosePerKg.max} {drug.unit}</span></div>}
                      {drug.maxSingle && drug.maxSingle !== Infinity && <div className="col-span-2"><span className="text-[#4a7299]">Max Single:</span> <span className="text-[#c8ddf0] font-medium">{drug.maxSingle} {drug.unit.replace("/kg","").replace("/m²","")}</span></div>}
                      <div className="col-span-2"><span className="text-[#4a7299]">Formulation:</span> <span className="text-[#c8ddf0] font-medium">{drug.form}</span></div>
                      {drug.ageRestriction && <div className="col-span-2"><span className="text-[#4a7299]">Age:</span> <span className="text-[#f5a623] font-medium">{drug.ageRestriction}</span></div>}
                    </div>

                    {/* Calculated dose box */}
                    {dose && dose.mode === "weight" && (
                      <div className="rounded-lg p-2.5 bg-[rgba(0,212,188,0.08)] border border-[rgba(0,212,188,0.2)]">
                        <div className="text-xs font-bold text-[#00d4bc] mb-1">Calculated Dose ({weightKg} kg)</div>
                        <div className="text-sm font-bold text-[#e8f4ff]">
                          {dose.minDose === dose.maxDose ? `${dose.minDose}` : `${dose.minDose} – ${dose.maxDose}`} {drug.unit.replace("/kg","").replace("/kg/day","")}
                        </div>
                        {dose.capped && <div className="text-xs text-[#f5a623] mt-0.5">⚠ Capped at maximum single dose</div>}
                      </div>
                    )}

                    {dose && dose.mode === "bsa" && (
                      <div className="rounded-lg p-2.5 bg-[rgba(155,109,255,0.08)] border border-[rgba(155,109,255,0.3)]">
                        <div className="text-xs font-bold text-[#9b6dff] mb-1">BSA-Calculated Dose (BSA = {dose.bsaUsed} m²)</div>
                        <div className="text-sm font-bold text-[#e8f4ff]">
                          {dose.minDose === dose.maxDose ? `${dose.minDose}` : `${dose.minDose} – ${dose.maxDose}`} {drug.unit.replace("/m²","")}
                        </div>
                        {dose.capped && <div className="text-xs text-[#f5a623] mt-0.5">⚠ Capped at maximum dose</div>}
                      </div>
                    )}

                    {dose && dose.mode === "crcl" && (
                      <div className="flex flex-col gap-2">
                        {dose.weightDose && (
                          <div className="rounded-lg p-2.5 bg-[rgba(0,212,188,0.08)] border border-[rgba(0,212,188,0.2)]">
                            <div className="text-xs font-bold text-[#00d4bc] mb-1">Weight-Based Dose ({weightKg} kg)</div>
                            <div className="text-sm font-bold text-[#e8f4ff]">
                              {dose.weightDose.min === dose.weightDose.max ? dose.weightDose.min : `${dose.weightDose.min} – ${dose.weightDose.max}`} {drug.unit.replace("/kg","")}
                            </div>
                          </div>
                        )}
                        {drug.doseByCrCl && (
                          <div className="rounded-lg p-2.5 bg-[rgba(245,166,35,0.08)] border border-[rgba(245,166,35,0.3)]">
                            <div className="text-xs font-bold text-[#f5a623] mb-2">Renal Dose Adjustment {dose.crClValue ? `(CrCl ${dose.crClValue} mL/min)` : ""}</div>
                            <div className="flex flex-col gap-1">
                              {drug.doseByCrCl.map((tier, i) => (
                                <div key={i} className={`flex items-center justify-between rounded px-2 py-1 text-xs ${dose.crClTier === tier ? "bg-[rgba(245,166,35,0.2)] border border-[#f5a623]/40" : ""}`}>
                                  <span className="text-[#4a7299]">CrCl ≤ {tier.maxCrCl === 999 ? "normal" : tier.maxCrCl}</span>
                                  <span className={`font-semibold ${dose.crClTier === tier ? "text-[#f5a623]" : "text-[#c8ddf0]"}`}>{tier.dose}</span>
                                </div>
                              ))}
                            </div>
                            {!crCl && <div className="text-xs text-[#4a7299] mt-1.5">Enter height + serum creatinine above to highlight recommended tier</div>}
                          </div>
                        )}
                      </div>
                    )}

                    {drug.pearls && drug.pearls.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-[#9b6dff] mb-1">Clinical Pearls</div>
                        {drug.pearls.map((p,i) => (
                          <div key={i} className="text-xs text-[#c8ddf0] flex gap-1.5 mb-0.5">
                            <span className="text-[#9b6dff] shrink-0">•</span>
                            <span>{p}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          );
        })}
        {filteredDrugs.length === 0 && (
          <div className="text-center text-[#4a7299] text-xs py-8">No drugs found</div>
        )}
      </div>
    </div>
  );
}

// ─── AI Complaint Search ──────────────────────────────────────────────────────
function AISearchPanel({ onSelectCalc }) {
  const [complaint, setComplaint] = useState("");
  const [loading, setLoading] = useState(false);
  const [recs, setRecs] = useState([]);

  const handleAI = async () => {
    if (!complaint.trim()) return;
    setLoading(true);
    setRecs([]);
    const resp = await base44.integrations.Core.InvokeLLM({
      prompt: `Given the clinical complaint or presentation: "${complaint}", identify the most relevant validated clinical scoring tools and calculators for emergency and inpatient medicine. Return a JSON array of 4-7 recommended calculators ranked by clinical importance. For each include: calculatorId (matching one of: heart_score, wells_pe, wells_dvt, gcs, nihss, chads_vasc, curb65, qsofa, perc, ciwa, alvarado, ottawa_ankle, mews), calculatorName, reason (why relevant, 1 sentence), priority (1=most important).`,
      response_json_schema: {
        type:"object",
        properties:{ recommendations:{ type:"array", items:{ type:"object", properties:{ calculatorId:{type:"string"}, calculatorName:{type:"string"}, reason:{type:"string"}, priority:{type:"number"} }}}}
      }
    });
    setRecs((resp?.recommendations || []).sort((a,b) => a.priority - b.priority));
    setLoading(false);
  };

  return (
    <div className="bg-[#0e2340] border border-[#1e3a5f] rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#9b6dff]">
        <Sparkles size={13} /> AI Calculator Finder
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Enter chief complaint or presentation…"
          value={complaint}
          onChange={e => setComplaint(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleAI()}
          className="flex-1 bg-[#162d4f] border border-[#1e3a5f] rounded-lg px-3 py-2 text-xs text-[#e8f4ff] outline-none placeholder:text-[#4a7299]"
        />
        <button
          onClick={handleAI}
          disabled={loading || !complaint.trim()}
          className="px-3 py-2 rounded-lg text-xs font-bold bg-[#9b6dff] text-white border-none cursor-pointer hover:bg-[#8b5cf6] disabled:opacity-50 flex items-center gap-1.5 transition-all"
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
          {loading ? "…" : "Search"}
        </button>
      </div>
      {recs.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <div className="text-xs text-[#4a7299] font-semibold">Recommended for: {complaint}</div>
          {recs.map((r,i) => (
            <button
              key={i}
              onClick={() => onSelectCalc(r.calculatorId)}
              className="flex items-start gap-2 p-2.5 rounded-lg border border-[#1e3a5f] bg-[#162d4f] hover:border-[#9b6dff] text-left transition-all cursor-pointer group"
            >
              <span className="text-xs font-bold text-[#9b6dff] shrink-0 mt-0.5">#{r.priority}</span>
              <div>
                <div className="text-xs font-semibold text-[#e8f4ff] group-hover:text-white">{r.calculatorName}</div>
                <div className="text-xs text-[#4a7299] mt-0.5">{r.reason}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Calculators() {
  const [activeTab, setActiveTab] = useState("calculators");
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [expandedCalcId, setExpandedCalcId] = useState(null);

  const filtered = useMemo(() => {
    return CALCULATORS.filter(c => {
      const matchCat = category === "all" || c.category === category;
      const matchSearch = !search.trim() ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.description.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [category, search]);

  const handleSelectCalc = (calcId) => {
    setCategory("all");
    setSearch("");
    setActiveTab("calculators");
    setTimeout(() => setExpandedCalcId(calcId), 100);
  };

  return (
    <div className="flex flex-col h-screen bg-[#050f1e] text-[#c8ddf0] overflow-hidden">
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap" />

      {/* Topbar */}
      <div className="h-14 bg-[#0b1d35] border-b border-[#1e3a5f] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-[#e8f4ff]">Medical Calculators</span>
          <span className="text-sm text-[#9b6dff] font-medium">— Clinical Decision Tools</span>
        </div>
        <div className="flex gap-2 items-center text-xs text-[#4a7299]">
          <span>{CALCULATORS.length} Calculators</span>
          <span>·</span>
          <span>{PED_DRUGS.length} Pediatric Drugs</span>
          <span>·</span>
          <span className="text-[#00d4bc] font-semibold">All calculations client-side · Validated formulas</span>
        </div>
      </div>

      {/* Content grid */}
      <div className="flex-1 grid grid-cols-[300px_1fr] gap-3 p-3 overflow-hidden">

        {/* Left Column */}
        <div className="flex flex-col gap-3 overflow-hidden">
          {/* AI Search */}
          <AISearchPanel onSelectCalc={handleSelectCalc} />

          {/* Category browser */}
          <div className="bg-[#0e2340] border border-[#1e3a5f] rounded-xl p-3 flex flex-col gap-2 overflow-y-auto scrollbar-hide flex-1">
            <div className="text-xs font-bold uppercase tracking-wide text-[#4a7299] mb-1">Categories</div>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => { setCategory(cat.id); setActiveTab("calculators"); }}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all text-left ${category === cat.id && activeTab === "calculators" ? "border border-[#9b6dff] bg-[rgba(155,109,255,0.15)] text-[#9b6dff]" : "border border-transparent text-[#4a7299] hover:bg-[#162d4f] hover:text-[#c8ddf0]"}`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                <span className="ml-auto text-[#2a4d72]">
                  {cat.id === "all" ? CALCULATORS.length : CALCULATORS.filter(c => c.category === cat.id).length}
                </span>
              </button>
            ))}
            <button
              onClick={() => setActiveTab("peddosing")}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all text-left mt-1 ${activeTab === "peddosing" ? "border border-[#00d4bc] bg-[rgba(0,212,188,0.12)] text-[#00d4bc]" : "border border-transparent text-[#4a7299] hover:bg-[#162d4f] hover:text-[#c8ddf0]"}`}
            >
              <span>👶</span>
              <span>Pediatric Dosing</span>
              <span className="ml-auto text-[#2a4d72]">{PED_DRUGS.length}</span>
            </button>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-3 overflow-hidden">
          {/* Tab bar */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("calculators")}
              className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all ${activeTab === "calculators" ? "border-[#9b6dff] bg-[rgba(155,109,255,0.15)] text-[#9b6dff]" : "border-[#1e3a5f] bg-[#0e2340] text-[#4a7299] hover:text-[#c8ddf0]"}`}
            >
              Clinical Calculators
            </button>
            <button
              onClick={() => setActiveTab("peddosing")}
              className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all ${activeTab === "peddosing" ? "border-[#00d4bc] bg-[rgba(0,212,188,0.12)] text-[#00d4bc]" : "border-[#1e3a5f] bg-[#0e2340] text-[#4a7299] hover:text-[#c8ddf0]"}`}
            >
              👶 Pediatric Dosing
            </button>

            {activeTab === "calculators" && (
              <div className="flex items-center gap-2 ml-auto bg-[#0e2340] border border-[#1e3a5f] rounded-lg px-3 py-1.5">
                <Search size={12} className="text-[#4a7299]" />
                <input
                  type="text"
                  placeholder="Search calculators…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs text-[#e8f4ff] placeholder:text-[#4a7299] w-36"
                />
              </div>
            )}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <div className="flex flex-col gap-2.5 pb-4">
            {activeTab === "calculators" && filtered.map(calc => (
              <CalculatorCard
                key={calc.id}
                calc={calc}
                initialExpanded={calc.id === expandedCalcId}
              />
            ))}
            {activeTab === "calculators" && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <div className="text-4xl">🔍</div>
                <div className="text-sm text-[#4a7299]">No calculators found for &quot;{search}&quot;</div>
              </div>
            )}
            {activeTab === "peddosing" && <PedDosingCalc />}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}