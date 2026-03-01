import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search, Sparkles, Plus, X, ChevronDown, ChevronUp,
  AlertTriangle, Activity, Pill, FlaskConical, RefreshCw,
  Loader2, Shield, Clock, ArrowLeft, Check
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import MedicationRecommendations from "./MedicationRecommendations";
import TabDataPreview from "./TabDataPreview";
import ClinicalNotePreviewButton from "./ClinicalNotePreviewButton";

// ─── Data ─────────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "all", label: "All", color: "#6b7280" },
  { id: "analgesics", label: "Analgesics & Sedation", color: "#f97316" },
  { id: "cardiovascular", label: "Cardiovascular", color: "#ef4444" },
  { id: "respiratory", label: "Respiratory & Airway", color: "#06b6d4" },
  { id: "antimicrobials", label: "Antimicrobials", color: "#22c55e" },
  { id: "neuro", label: "Neurological", color: "#8b5cf6" },
  { id: "gi_gu_ob", label: "GI / GU / OB", color: "#f59e0b" },
];

const MEDICATIONS = [
  { id: "ketamine_pain", category: "analgesics", name: "Ketamine (Sub-dissociative)", line: "first", indications: ["Acute pain", "Procedural sedation"], adult_dose: "0.1–0.3 mg/kg IV over 10 min", onset: "1–2 min IV", duration: "15–30 min", contraindications: ["Elevated ICP", "Schizophrenia", "STEMI"], warnings: ["Emergence reactions — consider midazolam 0.05 mg/kg", "Increased secretions — consider atropine"], monitoring: ["HR", "BP", "O2 sat", "Mental status on emergence"], reversal: null },
  { id: "fentanyl", category: "analgesics", name: "Fentanyl", line: "first", indications: ["Moderate–severe pain", "Procedural sedation adjunct"], adult_dose: "1–2 mcg/kg IV q30–60min PRN", onset: "1–2 min IV", duration: "30–60 min", contraindications: ["Respiratory depression", "MAO inhibitors within 14 days"], warnings: ["Chest wall rigidity at high doses", "Naloxone reversal available"], monitoring: ["RR", "O2 sat", "Level of consciousness"], reversal: "Naloxone 0.01 mg/kg IV" },
  { id: "morphine", category: "analgesics", name: "Morphine Sulfate", line: "first", indications: ["Moderate–severe pain", "ACS pain management"], adult_dose: "2–4 mg IV q15–30min PRN; max 20 mg", onset: "5–10 min IV", duration: "3–5 hr", contraindications: ["Respiratory depression", "Paralytic ileus", "Head injury with AMS"], warnings: ["Hypotension", "Avoid in STEMI — may worsen outcomes"], monitoring: ["RR", "BP", "O2 sat"], reversal: "Naloxone 0.01 mg/kg IV" },
  { id: "ketorolac", category: "analgesics", name: "Ketorolac", line: "first", indications: ["Renal colic", "Musculoskeletal pain", "Headache"], adult_dose: "15–30 mg IV/IM; max 5-day course", onset: "30 min", duration: "4–6 hr", contraindications: ["GI bleed", "Renal insufficiency", "ASA/NSAID allergy", "Age < 6 months"], warnings: ["Limit to ≤ 5 days total", "GI prophylaxis with prolonged use"], monitoring: ["BMP (renal)", "GI symptoms"], reversal: null },
  { id: "acetaminophen_iv", category: "analgesics", name: "Acetaminophen IV (Ofirmev)", line: "first", indications: ["Pain", "Fever"], adult_dose: "1000 mg IV q6h; max 4 g/day", onset: "5–10 min", duration: "4–6 hr", contraindications: ["Hepatic failure", "Hypersensitivity to acetaminophen"], warnings: ["Max 2 g/day in hepatic disease", "Monitor hepatotoxicity"], monitoring: ["LFTs with repeated use"], reversal: "N-Acetylcysteine (OD)" },
  { id: "midazolam", category: "analgesics", name: "Midazolam", line: "first", indications: ["Procedural sedation", "Seizures", "Anxiety", "Alcohol withdrawal"], adult_dose: "1–2.5 mg IV; titrate to effect", onset: "2–3 min IV", duration: "30–60 min", contraindications: ["Acute angle-closure glaucoma", "Respiratory depression"], warnings: ["Flumazenil reversal available", "Resuscitative equipment at bedside"], monitoring: ["RR", "O2 sat", "BP", "Level of consciousness"], reversal: "Flumazenil 0.2 mg IV" },
  { id: "propofol", category: "analgesics", name: "Propofol", line: "second", indications: ["Procedural sedation", "Intubation induction", "Refractory seizures"], adult_dose: "1–2 mg/kg IV induction; 25–75 mcg/kg/min infusion", onset: "< 1 min", duration: "5–10 min", contraindications: ["Egg/soy allergy (relative)", "Hemodynamic instability"], warnings: ["Hypotension", "Apnea", "Propofol infusion syndrome"], monitoring: ["BP", "HR", "RR", "O2 sat", "EtCO2"], reversal: null },
  { id: "adenosine", category: "cardiovascular", name: "Adenosine", line: "first", indications: ["SVT termination", "Wide-complex tachycardia (diagnostic)"], adult_dose: "6 mg rapid IV push; if no response: 12 mg × 2", onset: "< 30 sec", duration: "< 2 min", contraindications: ["2nd/3rd degree AV block", "Sick sinus syndrome", "WPW with AF/Flutter", "Asthma (relative)"], warnings: ["Brief asystole expected — warn patient", "Use large antecubital vein with rapid saline flush"], monitoring: ["Continuous cardiac monitor", "BP", "12-lead ECG"], reversal: null },
  { id: "amiodarone", category: "cardiovascular", name: "Amiodarone", line: "first", indications: ["VF/pVT (pulseless)", "Stable VT", "AF with RVR"], adult_dose: "VF/pVT: 300 mg IV push; Stable VT: 150 mg over 10 min then 1 mg/min × 6 hr", onset: "Minutes", duration: "Hours (long tissue half-life)", contraindications: ["Bradycardia", "High-degree AV block without pacemaker"], warnings: ["Hypotension with rapid infusion", "QT prolongation", "Central line preferred for infusions"], monitoring: ["Continuous cardiac", "BP", "QTc"], reversal: null },
  { id: "metoprolol_iv", category: "cardiovascular", name: "Metoprolol IV", line: "first", indications: ["AF with RVR", "SVT", "Hypertensive urgency", "ACS rate control"], adult_dose: "2.5–5 mg IV over 2 min q5min × 3 (max 15 mg)", onset: "5 min", duration: "3–6 hr", contraindications: ["HR < 60 bpm", "SBP < 90 mmHg", "Cardiogenic shock", "HF decompensated"], warnings: ["Monitor BP and HR continuously", "Bronchospasm risk in reactive airway"], monitoring: ["Continuous cardiac", "BP q5min"], reversal: "Glucagon 3–10 mg IV for beta-blocker toxicity" },
  { id: "diltiazem", category: "cardiovascular", name: "Diltiazem IV", line: "first", indications: ["AF/Flutter with RVR", "SVT"], adult_dose: "0.25 mg/kg IV over 2 min (max 25 mg); repeat 0.35 mg/kg if needed", onset: "2–5 min", duration: "1–3 hr", contraindications: ["WPW with AF/Flutter", "Cardiogenic shock", "HR < 60 bpm", "Hypotension SBP < 90"], warnings: ["Hypotension", "Avoid in accessory pathway tachycardias"], monitoring: ["Continuous cardiac", "BP"], reversal: "Calcium chloride 1 g IV" },
  { id: "norepinephrine", category: "cardiovascular", name: "Norepinephrine", line: "first", indications: ["Septic shock (first-line vasopressor)", "Distributive shock"], adult_dose: "0.01–3 mcg/kg/min IV infusion; titrate to MAP ≥ 65 mmHg", onset: "1–2 min", duration: "Infusion-dependent", contraindications: ["Uncorrected hypovolemia"], warnings: ["Central line strongly preferred", "Tissue necrosis with extravasation"], monitoring: ["Continuous BP", "MAP q15min", "Lactate q2h", "UO"], reversal: null },
  { id: "epinephrine_infusion", category: "cardiovascular", name: "Epinephrine (Push-dose / Infusion)", line: "first", indications: ["Anaphylaxis refractory to IM epi", "Cardiogenic shock", "Cardiac arrest"], adult_dose: "Push-dose: 10–20 mcg IV bolus q2–5min; Infusion: 0.05–0.5 mcg/kg/min", onset: "< 1 min", duration: "3–10 min (bolus)", contraindications: ["Narrow-angle glaucoma (relative)"], warnings: ["Dysrhythmias", "Severe hypertension", "Prepare push-dose as 10 mcg/mL"], monitoring: ["Continuous cardiac", "BP", "ECG"], reversal: null },
  { id: "alteplase", category: "cardiovascular", name: "Alteplase (tPA)", line: "second", indications: ["Massive PE with hemodynamic instability", "Ischemic stroke (≤ 4.5 hr)", "STEMI when PCI unavailable"], adult_dose: "PE: 100 mg IV over 2 hr | Stroke: 0.9 mg/kg (max 90 mg), 10% bolus then remainder over 60 min", onset: "Minutes", duration: "Hours", contraindications: ["Active internal bleeding", "Recent surgery < 3 months", "Intracranial neoplasm", "Prior ICH"], warnings: ["ICH risk", "BP target < 180/105 for stroke tPA", "Hold anticoagulation × 24 hr post-tPA"], monitoring: ["Neuro checks q15min (stroke)", "BP q15min", "CBC, coags"], reversal: "Cryoprecipitate 10 units IV; TXA 1 g IV" },
  { id: "nitroglycerin", category: "cardiovascular", name: "Nitroglycerin", line: "first", indications: ["ACS", "Hypertensive emergency with pulmonary edema"], adult_dose: "SL: 0.4 mg q5min × 3; IV: 5–200 mcg/min titrated", onset: "1–3 min SL", duration: "30–60 min SL", contraindications: ["PDE-5 inhibitor use within 24–48 hr", "SBP < 90 mmHg", "RV infarction"], warnings: ["Headache", "Hypotension", "Reflex tachycardia"], monitoring: ["BP q5min", "HR", "Symptom response"], reversal: null },
  { id: "albuterol", category: "respiratory", name: "Albuterol", line: "first", indications: ["Asthma exacerbation", "COPD exacerbation", "Hyperkalemia (adjunct)"], adult_dose: "2.5 mg nebulized q20min × 3; MDI: 4–8 puffs q20min × 3", onset: "5–15 min", duration: "4–6 hr", contraindications: ["Tachyarrhythmia (relative)"], warnings: ["Hypokalemia with high doses", "Tachycardia"], monitoring: ["SpO2", "HR", "RR", "Peak flow"], reversal: null },
  { id: "ipratropium", category: "respiratory", name: "Ipratropium", line: "first", indications: ["Asthma moderate–severe (first hour)", "COPD exacerbation"], adult_dose: "0.5 mg nebulized q20min × 3 (first hour only)", onset: "15–30 min", duration: "3–6 hr", contraindications: ["Atropine allergy (relative)"], warnings: ["Narrow-angle glaucoma if near eyes", "No added benefit past first hour in asthma"], monitoring: ["SpO2", "Bronchospasm response"], reversal: null },
  { id: "dexamethasone", category: "respiratory", name: "Dexamethasone", line: "first", indications: ["Asthma exacerbation", "Croup", "Allergic reaction", "Cerebral edema"], adult_dose: "Asthma: 10 mg IV/PO × 1–2 doses; Cerebral edema: 10 mg IV load then 4 mg q6h", onset: "1–4 hr", duration: "36–72 hr", contraindications: ["Active systemic fungal infection", "Live vaccines within 3 months"], warnings: ["Hyperglycemia", "Immunosuppression"], monitoring: ["Blood glucose", "BP"], reversal: null },
  { id: "magnesium_asthma", category: "respiratory", name: "Magnesium Sulfate (Asthma)", line: "first", indications: ["Severe asthma refractory to bronchodilators"], adult_dose: "2 g IV over 20 min", onset: "10–20 min", duration: "2–4 hr", contraindications: ["Renal failure (reduce dose)", "Hypotension"], warnings: ["Flushing during infusion", "Loss of DTRs at toxic levels"], monitoring: ["BP", "RR", "DTRs", "SpO2"], reversal: "Calcium gluconate 1 g IV" },
  { id: "succinylcholine", category: "respiratory", name: "Succinylcholine", line: "first", indications: ["RSI neuromuscular blockade", "Laryngospasm"], adult_dose: "1.5 mg/kg IV (standard RSI)", onset: "45–60 sec", duration: "7–10 min", contraindications: ["Hyperkalemia", "Burns > 24 hr", "Crush injury > 24 hr", "Malignant hyperthermia history", "Myopathies"], warnings: ["Defasiculate pre-dose", "Rhabdomyolysis in undiagnosed myopathies", "Bradycardia in peds — atropine if < 5 yr"], monitoring: ["SpO2", "ETCO2", "Cardiac monitor"], reversal: "Sugammadex does NOT reverse — depolarizing; wait for spontaneous recovery" },
  { id: "rocuronium", category: "respiratory", name: "Rocuronium", line: "first", indications: ["RSI neuromuscular blockade", "Succinylcholine contraindicated"], adult_dose: "1.2 mg/kg IV (RSI); 0.6 mg/kg (facilitated intubation)", onset: "60–90 sec", duration: "45–60 min", contraindications: ["Hypersensitivity to rocuronium or bromide"], warnings: ["Prolonged blockade", "Sugammadex 16 mg/kg reverses if cannot intubate/oxygenate"], monitoring: ["SpO2", "ETCO2", "Neuromuscular monitor"], reversal: "Sugammadex 16 mg/kg IV" },
  { id: "etomidate", category: "respiratory", name: "Etomidate", line: "first", indications: ["RSI induction agent", "Hemodynamically unstable patients"], adult_dose: "0.3 mg/kg IV", onset: "< 1 min", duration: "5–15 min", contraindications: ["Adrenal insufficiency (relative — single dose acceptable per ACEP)"], warnings: ["Myoclonus during induction", "Does not provide analgesia — add fentanyl or ketamine"], monitoring: ["BP", "SpO2", "ETCO2"], reversal: null },
  { id: "ketamine_rsi", category: "respiratory", name: "Ketamine (RSI Induction)", line: "first", indications: ["RSI in bronchospasm or asthma", "Hypotensive patients", "Pediatric RSI"], adult_dose: "1–2 mg/kg IV", onset: "45–60 sec IV", duration: "10–20 min", contraindications: ["Elevated ICP (controversial)", "Uncontrolled HTN (relative)"], warnings: ["Emergence reactions", "Increased secretions"], monitoring: ["BP", "HR", "SpO2", "ETCO2"], reversal: null },
  { id: "piperacillin_tazobactam", category: "antimicrobials", name: "Piperacillin-Tazobactam", line: "first", indications: ["Sepsis empiric", "Intra-abdominal infections", "HCAP", "Febrile neutropenia"], adult_dose: "3.375–4.5 g IV q6–8h (extended infusion over 4 hr preferred)", onset: "30 min", duration: "6–8 hr", contraindications: ["Penicillin allergy (anaphylaxis)"], warnings: ["Renal dose adjustment", "Limited ESBL coverage — use carbapenem for confirmed ESBL"], monitoring: ["SCr", "BMP", "Blood cultures"], reversal: null },
  { id: "vancomycin", category: "antimicrobials", name: "Vancomycin", line: "first", indications: ["MRSA coverage", "Sepsis with MRSA risk", "Bacterial meningitis (empiric)", "SSTI"], adult_dose: "25–30 mg/kg IV loading dose; then 15–20 mg/kg q8–12h (AUC/MIC guided)", onset: "30–60 min", duration: "6–12 hr", contraindications: ["Hypersensitivity to vancomycin"], warnings: ["Nephrotoxicity", "Red man syndrome (rate-related — slow infusion)", "AUC/MIC monitoring preferred"], monitoring: ["SCr", "AUC-guided levels or troughs 15–20 mg/L", "CBC"], reversal: null },
  { id: "ceftriaxone", category: "antimicrobials", name: "Ceftriaxone", line: "first", indications: ["CAP", "Bacterial meningitis", "Gonorrhea", "Sepsis (community)", "Pyelonephritis"], adult_dose: "1–2 g IV/IM q24h; meningitis: 2 g IV q12h", onset: "30–60 min", duration: "24 hr", contraindications: ["Neonates with hyperbilirubinemia (< 28 days)", "Concurrent calcium IV in neonates"], warnings: ["Do NOT mix with calcium-containing IV", "< 2% cross-reactivity with PCN allergy"], monitoring: ["LFTs", "SCr", "CBC"], reversal: null },
  { id: "azithromycin", category: "antimicrobials", name: "Azithromycin", line: "first", indications: ["CAP (atypical coverage)", "Chlamydia", "Pertussis"], adult_dose: "500 mg IV/PO × 1, then 250 mg PO daily × 4 (CAP); 1 g PO × 1 (chlamydia)", onset: "1–2 hr PO", duration: "Long tissue half-life (68 hr)", contraindications: ["QT prolongation history", "Macrolide allergy"], warnings: ["QTc prolongation", "Drug–drug interactions"], monitoring: ["QTc on ECG", "LFTs"], reversal: null },
  { id: "meropenem", category: "antimicrobials", name: "Meropenem", line: "second", indications: ["ESBL organisms", "Severe sepsis MDR risk", "Gram-negative meningitis"], adult_dose: "1–2 g IV q8h (extended infusion over 3 hr preferred)", onset: "30 min", duration: "8 hr", contraindications: ["Carbapenem allergy", "Concurrent valproic acid — markedly reduces valproate levels"], warnings: ["Seizures at high doses in renal failure", "Decreases valproate 60–90%"], monitoring: ["SCr", "Valproate levels if applicable"], reversal: null },
  { id: "metronidazole", category: "antimicrobials", name: "Metronidazole (Flagyl)", line: "first", indications: ["Anaerobic infections", "Intra-abdominal sepsis", "C. difficile (PO)", "BV / Trichomonas"], adult_dose: "500 mg IV q8h; 500 mg PO q8h (C. diff); 2 g PO × 1 (Trichomonas)", onset: "1–2 hr PO", duration: "8 hr", contraindications: ["First trimester pregnancy (relative)", "Concurrent disulfiram use"], warnings: ["Disulfiram-like reaction with alcohol", "Peripheral neuropathy with prolonged use"], monitoring: ["CBC with prolonged use", "Neuro exam"], reversal: null },
  { id: "lorazepam", category: "neuro", name: "Lorazepam", line: "first", indications: ["Status epilepticus (first-line)", "Acute agitation", "Alcohol withdrawal seizures"], adult_dose: "Status epilepticus: 0.1 mg/kg IV (max 4 mg); repeat × 1 in 5–10 min", onset: "1–5 min IV", duration: "6–8 hr", contraindications: ["Respiratory depression", "Acute angle-closure glaucoma"], warnings: ["Respiratory depression — airway support ready", "Paradoxical agitation (rare)"], monitoring: ["RR", "SpO2", "Level of consciousness", "Seizure activity"], reversal: "Flumazenil 0.2 mg IV" },
  { id: "levetiracetam", category: "neuro", name: "Levetiracetam (Keppra)", line: "first", indications: ["Status epilepticus (second-line post-benzo)", "Seizure prophylaxis"], adult_dose: "60 mg/kg IV over 10 min (max 4500 mg) — ESETT trial", onset: "10–30 min", duration: "12 hr", contraindications: ["Hypersensitivity to levetiracetam"], warnings: ["Behavioral side effects — agitation", "Renal dose adjustment"], monitoring: ["Seizure activity", "SCr", "CBC"], reversal: null },
  { id: "fosphenytoin", category: "neuro", name: "Fosphenytoin", line: "first", indications: ["Status epilepticus (second-line)", "Seizure prophylaxis"], adult_dose: "20 mg PE/kg IV at max 150 mg PE/min", onset: "10–20 min", duration: "12–24 hr", contraindications: ["2nd/3rd degree AV block", "Bradycardia", "Hypotension"], warnings: ["Continuous cardiac monitoring required during infusion", "Purple glove syndrome"], monitoring: ["Continuous cardiac", "BP q5min during infusion", "Free phenytoin level"], reversal: null },
  { id: "labetalol_iv", category: "neuro", name: "Labetalol IV", line: "first", indications: ["Hypertensive encephalopathy", "Aortic dissection", "Pre-eclampsia/eclampsia"], adult_dose: "20 mg IV over 2 min; repeat 40–80 mg q10min; max 300 mg", onset: "5 min", duration: "2–4 hr", contraindications: ["Decompensated HF", "Bradycardia", "High-degree AV block", "Asthma (relative)"], warnings: ["Monitor BP q5min", "Avoid in cocaine-induced HTN — use phentolamine"], monitoring: ["BP q5min", "HR", "Neurologic exam"], reversal: "Glucagon 3–10 mg IV" },
  { id: "naloxone", category: "neuro", name: "Naloxone (Narcan)", line: "first", indications: ["Opioid reversal — respiratory depression", "Suspected opioid overdose"], adult_dose: "0.4–2 mg IV/IM/IN q2–3min; titrate to RR > 12", onset: "< 2 min IV", duration: "30–90 min (shorter than most opioids)", contraindications: ["None absolute in emergency setting"], warnings: ["Re-sedation risk — observe ≥ 2 hr", "Precipitated withdrawal — PE, agitation, dysrhythmias"], monitoring: ["RR", "SpO2", "Level of consciousness", "HR", "BP"], reversal: null },
  { id: "haloperidol", category: "neuro", name: "Haloperidol", line: "first", indications: ["Acute agitation", "Excited delirium", "Nausea/vomiting", "Migraine (adjunct)"], adult_dose: "Agitation: 5–10 mg IV/IM; Nausea: 0.5–1 mg IV", onset: "10–20 min IM", duration: "4–8 hr", contraindications: ["Known QT prolongation", "Parkinson's disease (relative)"], warnings: ["QTc prolongation — obtain ECG", "EPS — treat with benztropine 1–2 mg IV", "NMS (rare)"], monitoring: ["QTc on ECG", "Vital signs", "EPS symptoms"], reversal: null },
  { id: "ondansetron", category: "gi_gu_ob", name: "Ondansetron (Zofran)", line: "first", indications: ["Nausea/vomiting", "Hyperemesis gravidarum"], adult_dose: "4–8 mg IV/PO/ODT; may repeat q4–6h", onset: "< 30 min", duration: "4–8 hr", contraindications: ["Congenital long QT syndrome"], warnings: ["QTc prolongation — higher risk IV vs PO", "Serotonin syndrome with serotonergic agents"], monitoring: ["QTc if IV use"], reversal: null },
  { id: "metoclopramide", category: "gi_gu_ob", name: "Metoclopramide (Reglan)", line: "first", indications: ["Nausea/vomiting", "Gastroparesis", "Migraine headache"], adult_dose: "10 mg IV over 15 min", onset: "1–3 min IV", duration: "1–2 hr", contraindications: ["Bowel obstruction / GI perforation", "Pheochromocytoma"], warnings: ["EPS/akathisia — premedicate with diphenhydramine 25 mg IV", "Tardive dyskinesia with prolonged use"], monitoring: ["EPS symptoms", "BP"], reversal: "Diphenhydramine 25–50 mg IV for EPS/akathisia" },
  { id: "magnesium_obstetric", category: "gi_gu_ob", name: "Magnesium Sulfate (Eclampsia)", line: "first", indications: ["Eclampsia treatment and prophylaxis", "Pre-eclampsia with severe features"], adult_dose: "Loading: 4–6 g IV over 15–20 min; Maintenance: 1–2 g/hr infusion", onset: "Minutes", duration: "Infusion-dependent", contraindications: ["Myasthenia gravis", "Severe renal failure", "Heart block"], warnings: ["Toxicity: loss of DTRs (5–7 mEq/L) → respiratory arrest → cardiac arrest", "Calcium gluconate 1 g IV at bedside"], monitoring: ["DTRs q1h", "RR q1h", "UO ≥ 25 mL/hr"], reversal: "Calcium gluconate 1 g IV" },
  { id: "sodium_bicarbonate", category: "gi_gu_ob", name: "Sodium Bicarbonate", line: "first", indications: ["TCA overdose", "Hyperkalemia with cardiac toxicity", "Severe metabolic acidosis", "Salicylate toxicity"], adult_dose: "TCA: 1–2 mEq/kg IV bolus; Hyperkalemia: 1 mEq/kg IV", onset: "Minutes", duration: "Infusion-dependent", contraindications: ["Metabolic alkalosis", "Uncorrected hypocalcemia"], warnings: ["Hypernatremia with large doses", "Alkalosis overshoot", "Hypokalemia"], monitoring: ["ABG/VBG — target pH 7.45–7.55 for TCA", "Na+", "K+", "ECG"], reversal: null },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const T = {
  navy: "#050f1e", slate: "#0b1d35", panel: "#0e2340", edge: "#162d4f",
  border: "#1e3a5f", dim: "#4a7299", text: "#c8ddf0", bright: "#e8f4ff",
  teal: "#00d4bc",
};

const LINE_STYLE = {
  first: { bg: "bg-emerald-100 text-emerald-700 border border-emerald-200", label: "First-line" },
  second: { bg: "bg-amber-100 text-amber-700 border border-amber-200", label: "Second-line" },
};

function CategoryPill({ cat, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
        active
          ? "text-white border-transparent shadow-sm"
          : "bg-transparent border-slate-200 text-slate-500 hover:border-slate-400"
      }`}
      style={active ? { background: cat.color, borderColor: cat.color } : {}}
    >
      {cat.label}
    </button>
  );
}

function MedCard({ med, catColor, onAdd }) {
  const [open, setOpen] = useState(false);
  const line = LINE_STYLE[med.line] || LINE_STYLE.first;

  return (
    <div className={`rounded-xl border transition-all ${open ? "border-blue-300 shadow-md" : "border-slate-200 hover:border-slate-300"} bg-white overflow-hidden`}>
      {/* Header row */}
      <div
        className="flex items-start gap-3 p-3 cursor-pointer"
        onClick={() => setOpen(v => !v)}
        style={{ borderLeft: `3px solid ${catColor}` }}
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <span className="font-semibold text-slate-900 text-sm">{med.name}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded ${line.bg}`}>{line.label}</span>
          </div>
          <div className="flex flex-wrap gap-1 mb-1">
            {med.indications.slice(0, 3).map((ind, i) => (
              <span key={i} className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{ind}</span>
            ))}
          </div>
          <p className="text-xs text-slate-700 font-mono truncate"><span className="font-semibold text-slate-500">Dose:</span> {med.adult_dose}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={e => { e.stopPropagation(); onAdd(med); }}
            className="p-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
            title="Add to note"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </div>

      {/* Expanded */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2 border-t border-slate-100 space-y-3">
              {/* Timing */}
              <div className="flex gap-4 text-xs">
                <div><span className="text-slate-400 font-semibold uppercase tracking-wide">Onset</span><br /><span className="text-slate-800">{med.onset}</span></div>
                <div><span className="text-slate-400 font-semibold uppercase tracking-wide">Duration</span><br /><span className="text-slate-800">{med.duration}</span></div>
                {med.reversal && <div><span className="text-slate-400 font-semibold uppercase tracking-wide">Reversal</span><br /><span className="text-emerald-700 font-medium">{med.reversal}</span></div>}
              </div>

              {/* Contraindications */}
              {med.contraindications?.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-2.5">
                  <p className="text-xs font-bold text-red-600 uppercase tracking-wide flex items-center gap-1 mb-1.5">
                    <AlertTriangle className="w-3 h-3" /> Contraindications
                  </p>
                  <ul className="space-y-0.5">
                    {med.contraindications.map((c, i) => <li key={i} className="text-xs text-red-700 flex items-start gap-1"><span className="text-red-400 mt-0.5">•</span>{c}</li>)}
                  </ul>
                </div>
              )}

              {/* Warnings */}
              {med.warnings?.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                  <p className="text-xs font-bold text-amber-700 uppercase tracking-wide flex items-center gap-1 mb-1.5">
                    <Shield className="w-3 h-3" /> Warnings
                  </p>
                  <ul className="space-y-0.5">
                    {med.warnings.map((w, i) => <li key={i} className="text-xs text-amber-800 flex items-start gap-1"><span className="text-amber-400 mt-0.5">•</span>{w}</li>)}
                  </ul>
                </div>
              )}

              {/* Monitoring */}
              {med.monitoring?.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                    <Activity className="w-3 h-3" /> Monitoring
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {med.monitoring.map((m, i) => (
                      <span key={i} className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">{m}</span>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => onAdd(med)}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add to Note
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Reference Tab ─────────────────────────────────────────────────────────────
function MedReferenceTab({ onAddMed }) {
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("all");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return MEDICATIONS.filter(m => {
      const matchCat = activeCat === "all" || m.category === activeCat;
      const matchSearch = !q || m.name.toLowerCase().includes(q) || m.indications.some(i => i.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [search, activeCat]);

  const catColor = CATEGORIES.find(c => c.id === activeCat)?.color || "#6b7280";

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        <Input
          placeholder="Search by name or indication…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-8 text-sm h-8 border-slate-200"
        />
        {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="w-3.5 h-3.5" /></button>}
      </div>

      {/* Category pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORIES.map(cat => (
          <CategoryPill key={cat.id} cat={cat} active={activeCat === cat.id} onClick={() => setActiveCat(cat.id)} />
        ))}
      </div>

      {/* Count */}
      <p className="text-xs text-slate-400">{filtered.length} medication{filtered.length !== 1 ? "s" : ""}</p>

      {/* Cards */}
      <div className="space-y-2 max-h-[calc(100vh-380px)] overflow-y-auto pr-1">
        {filtered.length === 0
          ? <p className="text-sm text-center text-slate-400 py-10">No medications found</p>
          : filtered.map(med => {
              const cat = CATEGORIES.find(c => c.id === med.category);
              return <MedCard key={med.id} med={med} catColor={cat?.color || "#6b7280"} onAdd={onAddMed} />;
            })
        }
      </div>
    </div>
  );
}

// ─── Current Medications Panel ─────────────────────────────────────────────────
function CurrentMedsPanel({ note, noteId, queryClient }) {
  const { base44: b44 } = { base44 };

  const handleRemove = async (idx) => {
    const updated = note.medications.filter((_, i) => i !== idx);
    await base44.entities.ClinicalNote.update(noteId, { medications: updated });
    queryClient.invalidateQueries({ queryKey: ["note", noteId] });
    toast.success("Removed");
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-slate-400 shadow-sm overflow-hidden">
      <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-slate-400" />
          <span className="text-sm font-semibold text-slate-800">Current Medications</span>
          <span className="text-xs text-slate-400">({note.medications?.length || 0})</span>
        </div>
      </div>
      <div className="p-4">
        {note.medications?.length > 0 ? (
          <div className="space-y-1.5">
            {note.medications.map((med, idx) => (
              <div key={idx} className="group flex items-center gap-3 px-3 py-2 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">{idx + 1}</span>
                <p className="text-xs text-slate-800 flex-1">{med}</p>
                <button
                  onClick={() => handleRemove(idx)}
                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        ) : <p className="text-xs text-slate-400 text-center py-4">No medications documented yet.</p>}
      </div>
    </div>
  );
}

// ─── Drug Interaction Checker ──────────────────────────────────────────────────
function DrugInteractionPanel({ note, noteId, queryClient }) {
  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(false);

  const check = async () => {
    if (!note.medications?.length || note.medications.length < 2) {
      toast.error("Need at least 2 medications to check interactions");
      return;
    }
    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze potential drug-drug interactions in this medication list. For each significant interaction, provide severity, mechanism, and clinical recommendation.\n\nMEDICATIONS:\n${note.medications.join('\n')}\n\nReturn only clinically significant interactions.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            interactions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  drug_pair: { type: "string" },
                  severity: { type: "string", enum: ["mild", "moderate", "severe"] },
                  mechanism: { type: "string" },
                  recommendation: { type: "string" }
                }
              }
            }
          }
        }
      });
      setInteractions(result.interactions || []);
      if (!result.interactions?.length) toast.success("No significant interactions found");
    } catch (e) {
      toast.error("Failed to check interactions");
    } finally {
      setLoading(false);
    }
  };

  const sevColor = { severe: "border-red-200 bg-red-50", moderate: "border-amber-200 bg-amber-50", mild: "border-blue-200 bg-blue-50" };
  const sevBadge = { severe: "bg-red-600 text-white", moderate: "bg-amber-500 text-white", mild: "bg-blue-500 text-white" };

  if (!note.medications?.length || note.medications.length < 2) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-orange-500 shadow-sm overflow-hidden">
      <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-orange-500" />
          <span className="text-sm font-semibold text-slate-800">Drug Interaction Check</span>
        </div>
        {!loading && (
          <Button onClick={check} size="sm" variant="outline" className="text-xs h-6 px-2 gap-1 border-orange-200 text-orange-700 hover:bg-orange-50">
            <Sparkles className="w-3 h-3" />Check
          </Button>
        )}
        {loading && <Loader2 className="w-4 h-4 animate-spin text-orange-500" />}
      </div>
      {interactions.length > 0 && (
        <div className="p-4 space-y-2">
          {interactions.map((ix, idx) => (
            <div key={idx} className={`rounded-lg border px-3 py-2 flex items-start justify-between gap-2 ${sevColor[ix.severity] || "bg-slate-50 border-slate-200"}`}>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800">{ix.drug_pair}</p>
                <p className="text-xs text-slate-600 mt-0.5">{ix.mechanism}</p>
                <p className="text-xs text-slate-700 mt-0.5 italic">{ix.recommendation}</p>
              </div>
              <Badge className={`text-xs ml-2 flex-shrink-0 ${sevBadge[ix.severity] || "bg-slate-600 text-white"}`}>{ix.severity}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Export ───────────────────────────────────────────────────────────────
const TABS = [
  { id: "ai", label: "AI Recommendations", icon: Sparkles },
  { id: "reference", label: "ER Reference", icon: Pill },
];

export default function MedicationsTab({ note, noteId, queryClient, isFirstTab, isLastTab, handleBack, handleNext }) {
  const [activeTab, setActiveTab] = useState("ai");

  const handleAddMed = async (med) => {
    const label = typeof med === "string" ? med : `${med.name} — ${med.adult_dose}`;
    const updated = [...(note.medications || []), label];
    await base44.entities.ClinicalNote.update(noteId, { medications: updated });
    queryClient.invalidateQueries({ queryKey: ["note", noteId] });
    toast.success(`Added: ${typeof med === "string" ? med : med.name}`);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 space-y-3">
      {/* Page header */}
      <div>
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Medications</h2>
        <p className="text-xs text-slate-400 mt-0.5">ER reference, AI recommendations, and interaction checks</p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === tab.id ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* AI Recommendations tab */}
      {activeTab === "ai" && (
        <div className="space-y-3">
          <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-blue-500 shadow-sm overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-sm font-semibold text-slate-800">AI Recommendations</span>
            </div>
            <div className="p-4">
              <MedicationRecommendations note={note} onAddMedications={async (meds) => {
                const updated = [...(note.medications || []), ...meds];
                await base44.entities.ClinicalNote.update(noteId, { medications: updated });
                queryClient.invalidateQueries({ queryKey: ["note", noteId] });
              }} />
            </div>
          </div>

          <CurrentMedsPanel note={note} noteId={noteId} queryClient={queryClient} />
          <DrugInteractionPanel note={note} noteId={noteId} queryClient={queryClient} />
        </div>
      )}

      {/* ER Reference tab */}
      {activeTab === "reference" && (
        <div className="space-y-3">
          {/* Disclaimer */}
          <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">Clinical decision support only. Verify all doses independently. Not a substitute for clinical judgment.</p>
          </div>

          <MedReferenceTab onAddMed={handleAddMed} />

          {/* Current meds + interactions in reference tab too */}
          <CurrentMedsPanel note={note} noteId={noteId} queryClient={queryClient} />
          <DrugInteractionPanel note={note} noteId={noteId} queryClient={queryClient} />
        </div>
      )}

      {/* Footer nav */}
      <div className="flex justify-between items-center pt-1 border-t border-slate-100">
        <div className="flex gap-2">
          <TabDataPreview tabId="medications" note={note} />
          <ClinicalNotePreviewButton note={note} />
        </div>
        <div className="flex items-center gap-1.5">
          {!isFirstTab() && (
            <button onClick={handleBack} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          )}
          {!isLastTab() && (
            <button onClick={handleNext} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
              Next <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}