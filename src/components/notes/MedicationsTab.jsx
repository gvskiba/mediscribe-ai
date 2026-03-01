import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search, Sparkles, Plus, X, ChevronDown, ChevronUp,
  AlertTriangle, Activity, Pill, FlaskConical,
  Loader2, Shield, Clock, ArrowLeft, Check, Baby,
  Droplets, Heart, BookOpen
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import MedicationRecommendations from "./MedicationRecommendations";
import TabDataPreview from "./TabDataPreview";
import ClinicalNotePreviewButton from "./ClinicalNotePreviewButton";

// ─── Full Medication Data ──────────────────────────────────────────────────────
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
  { id: "ketamine_pain", category: "analgesics", name: "Ketamine (Sub-dissociative)", line: "first", indications: ["Acute pain", "Procedural sedation"], adult_dose: "0.1–0.3 mg/kg IV over 10 min", pediatric_dose: { mg_per_kg: 0.3, unit: "mg", route: "IV", max_dose_mg: 30, notes: "Over 10 min" }, onset: "1–2 min IV", duration: "15–30 min", contraindications: ["Elevated ICP", "Schizophrenia", "STEMI"], warnings: ["Emergence reactions — consider midazolam 0.05 mg/kg", "Increased secretions — consider atropine"], monitoring: ["HR", "BP", "O2 sat", "Mental status on emergence"], reversal: null, pregnancy_category: "C", renal_adjustment: false, hepatic_adjustment: false },
  { id: "fentanyl", category: "analgesics", name: "Fentanyl", line: "first", indications: ["Moderate–severe pain", "Procedural sedation adjunct"], adult_dose: "1–2 mcg/kg IV q30–60min PRN", pediatric_dose: { mg_per_kg: 1.5, unit: "mcg", route: "IV/IN", max_dose_mg: 100, notes: "IN: 2 mcg/kg max 100 mcg" }, onset: "1–2 min IV", duration: "30–60 min", contraindications: ["Respiratory depression", "MAO inhibitors within 14 days"], warnings: ["Chest wall rigidity at high doses", "Naloxone reversal available"], monitoring: ["RR", "O2 sat", "Level of consciousness"], reversal: "Naloxone 0.01 mg/kg IV", pregnancy_category: "C", renal_adjustment: true, hepatic_adjustment: true },
  { id: "morphine", category: "analgesics", name: "Morphine Sulfate", line: "first", indications: ["Moderate–severe pain", "ACS pain management"], adult_dose: "2–4 mg IV q15–30min PRN; max 20 mg", pediatric_dose: { mg_per_kg: 0.1, unit: "mg", route: "IV", max_dose_mg: 5, notes: "Titrate q15–30 min" }, onset: "5–10 min IV", duration: "3–5 hr", contraindications: ["Respiratory depression", "Paralytic ileus", "Head injury with altered mental status"], warnings: ["Hypotension", "Avoid in STEMI — may worsen outcomes per CRUSADE data"], monitoring: ["RR", "BP", "O2 sat"], reversal: "Naloxone 0.01 mg/kg IV", pregnancy_category: "C", renal_adjustment: true, hepatic_adjustment: true },
  { id: "ketorolac", category: "analgesics", name: "Ketorolac", line: "first", indications: ["Renal colic", "Musculoskeletal pain", "Headache"], adult_dose: "15–30 mg IV/IM; max 5-day course", pediatric_dose: { mg_per_kg: 0.5, unit: "mg", route: "IV/IM", max_dose_mg: 30, notes: "Age ≥ 2 years only" }, onset: "30 min", duration: "4–6 hr", contraindications: ["GI bleed", "Renal insufficiency", "ASA/NSAID allergy", "Age < 6 months"], warnings: ["Limit to ≤ 5 days total", "GI prophylaxis with prolonged use"], monitoring: ["BMP (renal)", "GI symptoms"], reversal: null, pregnancy_category: "C", renal_adjustment: true, hepatic_adjustment: false },
  { id: "acetaminophen_iv", category: "analgesics", name: "Acetaminophen IV (Ofirmev)", line: "first", indications: ["Pain", "Fever (antipyretic)"], adult_dose: "1000 mg IV q6h; max 4 g/day", pediatric_dose: { mg_per_kg: 15, unit: "mg", route: "IV", max_dose_mg: 1000, notes: "q6h; max 75 mg/kg/day" }, onset: "5–10 min", duration: "4–6 hr", contraindications: ["Hepatic failure", "Hypersensitivity to acetaminophen"], warnings: ["Monitor for hepatotoxicity", "Max 2 g/day in hepatic disease or alcoholism"], monitoring: ["LFTs with repeated use"], reversal: "N-Acetylcysteine (OD)", pregnancy_category: "B", renal_adjustment: false, hepatic_adjustment: true },
  { id: "midazolam", category: "analgesics", name: "Midazolam", line: "first", indications: ["Procedural sedation", "Seizures", "Anxiety", "Alcohol withdrawal"], adult_dose: "1–2.5 mg IV; titrate to effect", pediatric_dose: { mg_per_kg: 0.1, unit: "mg", route: "IV/IN/IM", max_dose_mg: 5, notes: "IN: 0.2 mg/kg, max 10 mg" }, onset: "2–3 min IV", duration: "30–60 min", contraindications: ["Acute angle-closure glaucoma", "Respiratory depression"], warnings: ["Flumazenil reversal available", "Resuscitative equipment at bedside", "Paradoxical agitation (rare)"], monitoring: ["RR", "O2 sat", "BP", "Level of consciousness"], reversal: "Flumazenil 0.2 mg IV", pregnancy_category: "D", renal_adjustment: false, hepatic_adjustment: true },
  { id: "propofol", category: "analgesics", name: "Propofol", line: "second", indications: ["Procedural sedation", "Intubation induction", "Refractory seizures"], adult_dose: "1–2 mg/kg IV induction; 25–75 mcg/kg/min infusion", pediatric_dose: { mg_per_kg: 1, unit: "mg", route: "IV", max_dose_mg: 200, notes: "Slow push; airway support required" }, onset: "< 1 min", duration: "5–10 min", contraindications: ["Egg/soy allergy (relative)", "Hemodynamic instability"], warnings: ["Hypotension", "Apnea — airway management ready", "Propofol infusion syndrome with prolonged/high-dose use"], monitoring: ["BP", "HR", "RR", "O2 sat", "EtCO2 if available"], reversal: null, pregnancy_category: "B", renal_adjustment: false, hepatic_adjustment: false },
  { id: "adenosine", category: "cardiovascular", name: "Adenosine", line: "first", indications: ["SVT termination", "Wide-complex tachycardia (diagnostic)"], adult_dose: "6 mg rapid IV push; if no response: 12 mg × 2", pediatric_dose: { mg_per_kg: 0.1, unit: "mg", route: "IV rapid push", max_dose_mg: 6, notes: "2nd dose: 0.2 mg/kg (max 12 mg)" }, onset: "< 30 sec", duration: "< 2 min", contraindications: ["2nd/3rd degree AV block", "Sick sinus syndrome", "WPW with AF/Flutter", "Asthma (relative)"], warnings: ["Brief asystole expected — warn patient", "Use large antecubital vein with rapid saline flush", "Theophylline/caffeine antagonize effect", "Dipyridamole potentiates — reduce dose to 3 mg"], monitoring: ["Continuous cardiac monitor", "BP", "12-lead ECG"], reversal: null, pregnancy_category: "C", renal_adjustment: false, hepatic_adjustment: false },
  { id: "amiodarone", category: "cardiovascular", name: "Amiodarone", line: "first", indications: ["VF/pVT (pulseless)", "Stable VT", "Atrial fibrillation with RVR"], adult_dose: "VF/pVT: 300 mg IV push; Stable VT: 150 mg over 10 min then 1 mg/min × 6 hr", pediatric_dose: { mg_per_kg: 5, unit: "mg", route: "IV", max_dose_mg: 300, notes: "Over 20–60 min for stable rhythms" }, onset: "Minutes", duration: "Hours (long tissue half-life)", contraindications: ["Bradycardia", "High-degree AV block without pacemaker", "Thyroid disease (relative)", "Iodine allergy (relative)"], warnings: ["Hypotension with rapid infusion", "QT prolongation", "Phlebitis — central line preferred for infusions", "Long half-life: drug interactions persist weeks"], monitoring: ["Continuous cardiac", "BP", "QTc", "TFTs with long-term use"], reversal: null, pregnancy_category: "D", renal_adjustment: false, hepatic_adjustment: true },
  { id: "metoprolol_iv", category: "cardiovascular", name: "Metoprolol IV", line: "first", indications: ["Atrial fibrillation with RVR", "SVT", "Hypertensive urgency", "ACS rate control"], adult_dose: "2.5–5 mg IV over 2 min q5min × 3 (max 15 mg)", pediatric_dose: { mg_per_kg: 0.1, unit: "mg", route: "IV", max_dose_mg: 5, notes: "Over 5 min; age ≥ 1 year" }, onset: "5 min", duration: "3–6 hr", contraindications: ["HR < 60 bpm", "SBP < 90 mmHg", "Cardiogenic shock", "Decompensated heart failure", "High-degree AV block"], warnings: ["Monitor BP and HR continuously", "Bronchospasm risk in reactive airway disease"], monitoring: ["Continuous cardiac", "BP q5min"], reversal: "Glucagon 3–10 mg IV for beta-blocker toxicity", pregnancy_category: "C", renal_adjustment: false, hepatic_adjustment: true },
  { id: "diltiazem", category: "cardiovascular", name: "Diltiazem IV", line: "first", indications: ["AF/Flutter with RVR", "SVT"], adult_dose: "0.25 mg/kg IV over 2 min (max 25 mg); repeat 0.35 mg/kg if needed", pediatric_dose: { mg_per_kg: 0.25, unit: "mg", route: "IV", max_dose_mg: 25, notes: "Over 2 min" }, onset: "2–5 min", duration: "1–3 hr", contraindications: ["WPW with AF/Flutter", "Cardiogenic shock", "HR < 60 bpm", "Hypotension SBP < 90"], warnings: ["Hypotension", "Avoid in accessory pathway tachycardias"], monitoring: ["Continuous cardiac", "BP"], reversal: "Calcium chloride 1 g IV", pregnancy_category: "C", renal_adjustment: false, hepatic_adjustment: true },
  { id: "norepinephrine", category: "cardiovascular", name: "Norepinephrine", line: "first", indications: ["Septic shock (first-line vasopressor)", "Distributive shock", "Cardiogenic shock adjunct"], adult_dose: "0.01–3 mcg/kg/min IV infusion; titrate to MAP ≥ 65 mmHg", pediatric_dose: { mg_per_kg: 0.05, unit: "mcg/kg/min", route: "IV infusion", max_dose_mg: null, notes: "Start 0.05 mcg/kg/min; titrate to age-appropriate MAP goal" }, onset: "1–2 min", duration: "Infusion-dependent", contraindications: ["Uncorrected hypovolemia", "Mesenteric or peripheral vascular thrombosis (relative)"], warnings: ["Central line strongly preferred", "Tissue necrosis with extravasation — treat with phentolamine 5–10 mg in 10 mL NS infiltrated locally", "Monitor lactate for perfusion adequacy"], monitoring: ["Continuous BP (arterial line preferred)", "MAP q15min", "Lactate q2h", "UO"], reversal: null, pregnancy_category: "C", renal_adjustment: false, hepatic_adjustment: false },
  { id: "epinephrine_infusion", category: "cardiovascular", name: "Epinephrine (Infusion / Push-dose)", line: "first", indications: ["Anaphylaxis refractory to IM epi", "Cardiogenic shock", "Cardiac arrest"], adult_dose: "Push-dose: 10–20 mcg IV bolus q2–5min; Infusion: 0.05–0.5 mcg/kg/min", pediatric_dose: { mg_per_kg: 0.01, unit: "mg", route: "IV/IO", max_dose_mg: 1, notes: "Cardiac arrest: 0.01 mg/kg q3–5min" }, onset: "< 1 min", duration: "3–10 min (bolus)", contraindications: ["Narrow-angle glaucoma (relative)"], warnings: ["Dysrhythmias", "Severe hypertension", "Prepare push-dose as 10 mcg/mL (1 mg in 100 mL NS)"], monitoring: ["Continuous cardiac", "BP", "ECG"], reversal: null, pregnancy_category: "C", renal_adjustment: false, hepatic_adjustment: false },
  { id: "alteplase", category: "cardiovascular", name: "Alteplase (tPA)", line: "second", indications: ["Massive PE with hemodynamic instability", "Ischemic stroke (≤ 4.5 hr onset)", "STEMI when PCI unavailable"], adult_dose: "PE: 100 mg IV over 2 hr | Stroke: 0.9 mg/kg (max 90 mg), 10% as bolus then remainder over 60 min", pediatric_dose: { mg_per_kg: 0.9, unit: "mg", route: "IV", max_dose_mg: 90, notes: "Stroke dosing only" }, onset: "Minutes", duration: "Hours", contraindications: ["Active internal bleeding", "Recent surgery or trauma < 3 months", "Intracranial neoplasm", "Prior intracranial hemorrhage", "Severe uncontrolled hypertension"], warnings: ["ICH risk — obtain consent when feasible", "Hold anticoagulation × 24 hr post-tPA for stroke", "BP target < 180/105 for stroke tPA"], monitoring: ["Neuro checks q15min × 2 hr (stroke)", "BP q15min", "CBC, coags"], reversal: "Cryoprecipitate 10 units IV; TXA 1 g IV", pregnancy_category: "C", renal_adjustment: false, hepatic_adjustment: false },
  { id: "nitroglycerin", category: "cardiovascular", name: "Nitroglycerin", line: "first", indications: ["ACS", "Hypertensive emergency with pulmonary edema", "Flash pulmonary edema"], adult_dose: "SL: 0.4 mg q5min × 3; IV: 5–200 mcg/min titrated", pediatric_dose: { mg_per_kg: 0.5, unit: "mcg/kg/min", route: "IV infusion", max_dose_mg: null, notes: "Start low; titrate to effect" }, onset: "1–3 min SL", duration: "30–60 min SL", contraindications: ["PDE-5 inhibitor use within 24–48 hr", "SBP < 90 mmHg", "Right ventricular infarction"], warnings: ["Headache (common)", "Hypotension", "Reflex tachycardia"], monitoring: ["BP q5min", "HR", "Symptom response"], reversal: null, pregnancy_category: "C", renal_adjustment: false, hepatic_adjustment: false },
  { id: "albuterol", category: "respiratory", name: "Albuterol", line: "first", indications: ["Asthma exacerbation", "COPD exacerbation", "Bronchospasm", "Hyperkalemia (adjunct)"], adult_dose: "2.5 mg nebulized q20min × 3, then q4h PRN; MDI: 4–8 puffs q20min × 3", pediatric_dose: { mg_per_kg: 0.15, unit: "mg", route: "Nebulized", max_dose_mg: 5, notes: "Min 1.25 mg; continuous neb 0.5 mg/kg/hr for severe (max 15 mg/hr)" }, onset: "5–15 min", duration: "4–6 hr", contraindications: ["Tachyarrhythmia (relative)"], warnings: ["Hypokalemia with high doses", "Tachycardia", "Paradoxical bronchospasm (rare)"], monitoring: ["SpO2", "HR", "RR", "Peak flow / FEV1 if available"], reversal: null, pregnancy_category: "C", renal_adjustment: false, hepatic_adjustment: false },
  { id: "ipratropium", category: "respiratory", name: "Ipratropium", line: "first", indications: ["Asthma moderate–severe (first hour)", "COPD exacerbation"], adult_dose: "0.5 mg nebulized q20min × 3 (first hour only), then discontinue", pediatric_dose: { mg_per_kg: null, unit: "mg", route: "Nebulized", max_dose_mg: 0.5, notes: "< 12 yr: 0.25 mg; ≥ 12 yr: 0.5 mg; first hour only" }, onset: "15–30 min", duration: "3–6 hr", contraindications: ["Atropine allergy (relative)"], warnings: ["Narrow-angle glaucoma if nebulized near eyes", "No added benefit continuing past first hour in acute asthma (GINA guidelines)"], monitoring: ["SpO2", "Bronchospasm response"], reversal: null, pregnancy_category: "B", renal_adjustment: false, hepatic_adjustment: false },
  { id: "dexamethasone", category: "respiratory", name: "Dexamethasone", line: "first", indications: ["Asthma exacerbation", "Croup", "Allergic reaction", "Cerebral edema", "Sepsis meningitis adjunct"], adult_dose: "Asthma: 10 mg IV/PO × 1–2 doses; Cerebral edema: 10 mg IV load then 4 mg IV q6h", pediatric_dose: { mg_per_kg: 0.6, unit: "mg", route: "PO/IV/IM", max_dose_mg: 16, notes: "Croup: 0.6 mg/kg PO/IM × 1 (max 16 mg); Asthma: 0.6 mg/kg (max 10 mg)" }, onset: "1–4 hr (full effect)", duration: "36–72 hr", contraindications: ["Active systemic fungal infection", "Live vaccines within 3 months"], warnings: ["Hyperglycemia — monitor glucose", "Immunosuppression", "HPA axis suppression with prolonged use"], monitoring: ["Blood glucose", "BP", "Signs of infection"], reversal: null, pregnancy_category: "C", renal_adjustment: false, hepatic_adjustment: false },
  { id: "magnesium_asthma", category: "respiratory", name: "Magnesium Sulfate (Asthma)", line: "first", indications: ["Severe asthma exacerbation refractory to bronchodilators"], adult_dose: "2 g IV over 20 min", pediatric_dose: { mg_per_kg: 25, unit: "mg", route: "IV", max_dose_mg: 2000, notes: "Over 20 min; max 2 g" }, onset: "10–20 min", duration: "2–4 hr", contraindications: ["Renal failure (reduce dose)", "Hypotension"], warnings: ["Flushing and warmth during infusion", "Hypotension with rapid infusion", "Loss of DTRs at toxic levels", "Calcium gluconate 1 g IV is antidote"], monitoring: ["BP", "RR", "DTRs", "SpO2", "Serum Mg if renal impairment"], reversal: "Calcium gluconate 1 g IV", pregnancy_category: "A", renal_adjustment: true, hepatic_adjustment: false },
  { id: "succinylcholine", category: "respiratory", name: "Succinylcholine", line: "first", indications: ["RSI — neuromuscular blockade", "Laryngospasm"], adult_dose: "1.5 mg/kg IV (standard RSI dose)", pediatric_dose: { mg_per_kg: 2, unit: "mg", route: "IV/IO", max_dose_mg: 150, notes: "< 10 kg: 2 mg/kg; ≥ 10 kg: 1.5 mg/kg; IM: 4 mg/kg if no IV access" }, onset: "45–60 sec", duration: "7–10 min", contraindications: ["Hyperkalemia", "Burns > 24 hr old", "Crush injury > 24 hr", "Prolonged immobility or denervation", "Personal or family history of malignant hyperthermia", "Pseudocholinesterase deficiency", "Myopathies (muscular dystrophies)"], warnings: ["Defasiculate with vecuronium 0.01 mg/kg or rocuronium 0.06 mg/kg pre-dose", "Rhabdomyolysis risk in undiagnosed myopathies", "Bradycardia especially in pediatric patients — atropine pretreatment if < 5 yr"], monitoring: ["SpO2", "ETCO2", "Cardiac monitor"], reversal: "Sugammadex does NOT reverse succinylcholine (depolarizing); wait for spontaneous recovery", pregnancy_category: "C", renal_adjustment: true, hepatic_adjustment: false },
  { id: "rocuronium", category: "respiratory", name: "Rocuronium", line: "first", indications: ["RSI — neuromuscular blockade", "Succinylcholine contraindicated"], adult_dose: "1.2 mg/kg IV (RSI); 0.6 mg/kg (facilitated intubation)", pediatric_dose: { mg_per_kg: 1.2, unit: "mg", route: "IV/IO", max_dose_mg: 200, notes: "1.2 mg/kg for RSI; reversal: sugammadex 16 mg/kg" }, onset: "60–90 sec (at 1.2 mg/kg)", duration: "45–60 min (1.2 mg/kg dose)", contraindications: ["Hypersensitivity to rocuronium or bromide"], warnings: ["Prolonged blockade — airway must be secured", "Sugammadex 16 mg/kg reverses immediately if cannot intubate cannot oxygenate", "Accumulation with repeat dosing or renal failure"], monitoring: ["SpO2", "ETCO2", "Neuromuscular blockade monitor"], reversal: "Sugammadex 16 mg/kg IV (immediate full reversal)", pregnancy_category: "C", renal_adjustment: true, hepatic_adjustment: true },
  { id: "etomidate", category: "respiratory", name: "Etomidate", line: "first", indications: ["RSI induction agent", "Hemodynamically unstable patients"], adult_dose: "0.3 mg/kg IV", pediatric_dose: { mg_per_kg: 0.3, unit: "mg", route: "IV", max_dose_mg: 30, notes: "Safe in children ≥ 10 years; use ketamine < 10 years" }, onset: "< 1 min", duration: "5–15 min", contraindications: ["Adrenal insufficiency — relative (single dose acceptable per ACEP)"], warnings: ["Myoclonus during induction", "Transient adrenal suppression — not clinically significant for single RSI dose", "Does not provide analgesia — add fentanyl or ketamine"], monitoring: ["BP", "SpO2", "ETCO2"], reversal: null, pregnancy_category: "C", renal_adjustment: false, hepatic_adjustment: false },
  { id: "ketamine_rsi", category: "respiratory", name: "Ketamine (RSI Induction)", line: "first", indications: ["RSI in bronchospasm or asthma", "Hypotensive patients", "Pediatric RSI"], adult_dose: "1–2 mg/kg IV", pediatric_dose: { mg_per_kg: 1.5, unit: "mg", route: "IV/IO", max_dose_mg: 200, notes: "IM: 4–8 mg/kg if no IV; bronchodilatory effect beneficial in asthma RSI" }, onset: "45–60 sec IV", duration: "10–20 min", contraindications: ["Elevated ICP (traditional; now controversial — ACEP supports use in most cases)", "Uncontrolled hypertension (relative)", "Schizophrenia or psychosis (relative)"], warnings: ["Emergence reactions on recovery — midazolam pre-dose for elective cases", "Bronchodilation — particularly beneficial for asthma RSI", "Increased secretions — consider atropine or glycopyrrolate pre-dose"], monitoring: ["BP", "HR", "SpO2", "ETCO2"], reversal: null, pregnancy_category: "B", renal_adjustment: false, hepatic_adjustment: true },
  { id: "piperacillin_tazobactam", category: "antimicrobials", name: "Piperacillin-Tazobactam", line: "first", indications: ["Sepsis empiric", "Intra-abdominal infections", "Healthcare-associated pneumonia", "Febrile neutropenia"], adult_dose: "3.375–4.5 g IV q6–8h (extended infusion over 4 hr preferred for sepsis)", pediatric_dose: { mg_per_kg: 100, unit: "mg", route: "IV", max_dose_mg: 4500, notes: "q8h; piperacillin component dosing; extended infusion preferred" }, onset: "30 min", duration: "6–8 hr dosing interval", contraindications: ["Penicillin allergy (anaphylaxis)"], warnings: ["Renal dose adjustment required", "Monitor electrolytes — significant sodium load", "Limited ESBL coverage — use carbapenem for confirmed ESBL"], monitoring: ["SCr", "BMP", "Blood cultures"], reversal: null, pregnancy_category: "B", renal_adjustment: true, hepatic_adjustment: false },
  { id: "vancomycin", category: "antimicrobials", name: "Vancomycin", line: "first", indications: ["MRSA coverage", "Sepsis with MRSA risk factors", "Bacterial meningitis (empiric)", "SSTI"], adult_dose: "25–30 mg/kg IV loading dose; then 15–20 mg/kg q8–12h (AUC/MIC guided)", pediatric_dose: { mg_per_kg: 15, unit: "mg", route: "IV", max_dose_mg: 3000, notes: "q6h in children; infuse over 60 min minimum; loads > 2 g over 90–120 min" }, onset: "30–60 min", duration: "6–12 hr dosing interval", contraindications: ["Hypersensitivity to vancomycin"], warnings: ["Nephrotoxicity — monitor SCr every 48–72 hr", "Red man syndrome (rate-related infusion reaction — NOT true allergy; slow infusion rate)", "AUC/MIC monitoring preferred over trough-only", "Ototoxicity with prolonged high levels"], monitoring: ["SCr", "AUC-guided levels or troughs 15–20 mg/L", "CBC"], reversal: null, pregnancy_category: "C", renal_adjustment: true, hepatic_adjustment: false },
  { id: "ceftriaxone", category: "antimicrobials", name: "Ceftriaxone", line: "first", indications: ["Community-acquired pneumonia", "Bacterial meningitis", "Gonorrhea", "Sepsis (community-acquired)", "Pyelonephritis"], adult_dose: "1–2 g IV/IM q24h; meningitis: 2 g IV q12h", pediatric_dose: { mg_per_kg: 50, unit: "mg", route: "IV/IM", max_dose_mg: 2000, notes: "Meningitis: 100 mg/kg/day divided q12h (max 4 g/day); avoid in neonates < 28 days" }, onset: "30–60 min", duration: "24 hr dosing interval", contraindications: ["Neonates with hyperbilirubinemia (< 28 days)", "Concurrent calcium-containing IV solutions in neonates"], warnings: ["Do NOT mix with calcium-containing IV solutions", "Cross-reactivity with penicillin allergy < 2%", "Biliary sludging with prolonged use"], monitoring: ["LFTs", "SCr", "CBC"], reversal: null, pregnancy_category: "B", renal_adjustment: false, hepatic_adjustment: false },
  { id: "azithromycin", category: "antimicrobials", name: "Azithromycin", line: "first", indications: ["Community-acquired pneumonia (atypical coverage)", "Chlamydia", "Pertussis"], adult_dose: "500 mg IV/PO × 1, then 250 mg PO daily × 4 (CAP); 1 g PO × 1 (chlamydia)", pediatric_dose: { mg_per_kg: 10, unit: "mg", route: "PO/IV", max_dose_mg: 500, notes: "CAP: 10 mg/kg day 1 then 5 mg/kg × 4; age ≥ 6 months" }, onset: "1–2 hr PO", duration: "Long tissue half-life (68 hr)", contraindications: ["QT prolongation history", "Macrolide allergy"], warnings: ["QTc prolongation — obtain baseline ECG; avoid with other QT-prolonging drugs", "Drug–drug interactions", "Hepatotoxicity (rare)"], monitoring: ["QTc on ECG", "LFTs"], reversal: null, pregnancy_category: "B", renal_adjustment: false, hepatic_adjustment: true },
  { id: "meropenem", category: "antimicrobials", name: "Meropenem", line: "second", indications: ["ESBL organisms", "Severe sepsis — MDR risk", "Gram-negative meningitis", "Febrile neutropenia"], adult_dose: "1–2 g IV q8h (extended infusion over 3 hr preferred for severe sepsis)", pediatric_dose: { mg_per_kg: 20, unit: "mg", route: "IV", max_dose_mg: 2000, notes: "Meningitis: 40 mg/kg q8h (max 2 g/dose)" }, onset: "30 min", duration: "8 hr dosing interval", contraindications: ["Carbapenem allergy", "Concurrent valproic acid — significantly reduces valproate levels"], warnings: ["Seizures at high doses in renal failure", "Decreases valproic acid levels 60–90% — use alternative anticonvulsant", "Reserve for confirmed ESBL or MDR organisms"], monitoring: ["SCr", "Valproate levels if applicable", "Seizure monitoring"], reversal: null, pregnancy_category: "B", renal_adjustment: true, hepatic_adjustment: false },
  { id: "metronidazole", category: "antimicrobials", name: "Metronidazole (Flagyl)", line: "first", indications: ["Anaerobic infections", "Intra-abdominal sepsis", "C. difficile (PO)", "BV / Trichomonas"], adult_dose: "500 mg IV q8h; 500 mg PO q8h (C. diff); 2 g PO × 1 (Trichomonas)", pediatric_dose: { mg_per_kg: 7.5, unit: "mg", route: "IV/PO", max_dose_mg: 500, notes: "q8h; age > 1 month" }, onset: "1–2 hr PO", duration: "8 hr dosing interval", contraindications: ["First trimester pregnancy (relative)", "Concurrent disulfiram use"], warnings: ["Disulfiram-like reaction with alcohol — avoid alcohol × 72 hr after course", "Peripheral neuropathy with prolonged use", "Metallic taste common"], monitoring: ["CBC with prolonged use", "Neuro exam"], reversal: null, pregnancy_category: "B", renal_adjustment: false, hepatic_adjustment: true },
  { id: "lorazepam", category: "neuro", name: "Lorazepam", line: "first", indications: ["Status epilepticus (first-line)", "Acute agitation", "Alcohol withdrawal seizures"], adult_dose: "Status epilepticus: 0.1 mg/kg IV (max 4 mg); repeat × 1 in 5–10 min", pediatric_dose: { mg_per_kg: 0.1, unit: "mg", route: "IV/IM/IN", max_dose_mg: 4, notes: "IN: 0.1 mg/kg (max 4 mg); can repeat × 1 after 5 min" }, onset: "1–5 min IV", duration: "6–8 hr", contraindications: ["Respiratory depression", "Acute angle-closure glaucoma"], warnings: ["Respiratory depression — airway support ready", "Paradoxical agitation (rare)", "Flumazenil reversal available"], monitoring: ["RR", "SpO2", "Level of consciousness", "Seizure activity"], reversal: "Flumazenil 0.2 mg IV", pregnancy_category: "D", renal_adjustment: false, hepatic_adjustment: true },
  { id: "levetiracetam", category: "neuro", name: "Levetiracetam (Keppra)", line: "first", indications: ["Status epilepticus (second-line or post-benzo)", "Seizure prophylaxis"], adult_dose: "60 mg/kg IV over 10 min (max 4500 mg) — ESETT trial dosing", pediatric_dose: { mg_per_kg: 60, unit: "mg", route: "IV", max_dose_mg: 4500, notes: "Over 10 min; ESETT trial dosing equivalent to fosphenytoin and valproate" }, onset: "10–30 min", duration: "12 hr dosing interval", contraindications: ["Hypersensitivity to levetiracetam"], warnings: ["Behavioral side effects — agitation, irritability", "Renal dose adjustment", "ESETT trial: comparable efficacy to fosphenytoin and valproate for benzodiazepine-refractory SE"], monitoring: ["Seizure activity", "SCr", "CBC"], reversal: null, pregnancy_category: "C", renal_adjustment: true, hepatic_adjustment: false },
  { id: "fosphenytoin", category: "neuro", name: "Fosphenytoin", line: "first", indications: ["Status epilepticus (second-line)", "Seizure prophylaxis"], adult_dose: "20 mg PE/kg IV at max 150 mg PE/min", pediatric_dose: { mg_per_kg: 20, unit: "mg PE", route: "IV/IM", max_dose_mg: 1500, notes: "Infuse ≤ 3 mg PE/kg/min; IM route acceptable" }, onset: "10–20 min", duration: "12–24 hr", contraindications: ["2nd/3rd degree AV block", "Bradycardia", "Hypotension", "Sinoatrial block"], warnings: ["Continuous cardiac monitoring required during infusion", "Hypotension with rapid infusion", "Purple glove syndrome (phlebitis at infusion site)"], monitoring: ["Continuous cardiac monitor", "BP q5min during infusion", "Free phenytoin level"], reversal: null, pregnancy_category: "D", renal_adjustment: false, hepatic_adjustment: true },
  { id: "labetalol_iv", category: "neuro", name: "Labetalol IV", line: "first", indications: ["Hypertensive encephalopathy", "Aortic dissection", "Pre-eclampsia/eclampsia", "Hypertensive emergency"], adult_dose: "20 mg IV over 2 min; repeat 40–80 mg q10min; max 300 mg | Or infusion 0.5–2 mg/min", pediatric_dose: { mg_per_kg: 0.2, unit: "mg", route: "IV", max_dose_mg: 40, notes: "Over 2 min q10min; infusion: 0.25–3 mg/kg/hr" }, onset: "5 min", duration: "2–4 hr", contraindications: ["Decompensated heart failure", "Bradycardia HR < 60", "High-degree AV block", "Asthma (relative)"], warnings: ["Monitor BP q5min", "Hypotension", "Avoid in cocaine-induced hypertension — use phentolamine instead"], monitoring: ["BP q5min", "HR", "Neurologic exam"], reversal: "Glucagon 3–10 mg IV for beta-blockade toxicity", pregnancy_category: "C", renal_adjustment: false, hepatic_adjustment: true },
  { id: "naloxone", category: "neuro", name: "Naloxone (Narcan)", line: "first", indications: ["Opioid reversal — respiratory depression", "Suspected opioid overdose (diagnostic/therapeutic)"], adult_dose: "0.4–2 mg IV/IM/IN q2–3min; titrate to RR > 12 (avoid full reversal to prevent precipitated withdrawal)", pediatric_dose: { mg_per_kg: 0.01, unit: "mg", route: "IV/IM/IO/IN", max_dose_mg: 2, notes: "IV: 0.01 mg/kg; IN: 0.1 mg/kg; repeat q2–3min as needed" }, onset: "< 2 min IV", duration: "30–90 min (shorter than most opioids — re-sedation risk)", contraindications: ["None absolute in emergency setting"], warnings: ["Duration shorter than most opioids — re-sedation possible; observe ≥ 2 hr", "Precipitated withdrawal — pulmonary edema, agitation, dysrhythmias", "Continuous infusion at 2/3 of reversal dose per hour for long-acting opioids"], monitoring: ["RR", "SpO2", "Level of consciousness", "HR", "BP"], reversal: null, pregnancy_category: "C", renal_adjustment: false, hepatic_adjustment: false },
  { id: "haloperidol", category: "neuro", name: "Haloperidol", line: "first", indications: ["Acute agitation", "Excited delirium", "Nausea/vomiting", "Migraine (adjunct)"], adult_dose: "Agitation: 5–10 mg IV/IM; Nausea: 0.5–1 mg IV", pediatric_dose: { mg_per_kg: 0.025, unit: "mg", route: "IV/IM", max_dose_mg: 5, notes: "Age ≥ 3 years; 0.025–0.075 mg/kg/dose" }, onset: "10–20 min IM", duration: "4–8 hr", contraindications: ["Known QT prolongation", "Parkinson's disease (relative)", "History of NMS"], warnings: ["QTc prolongation — obtain ECG", "Extrapyramidal symptoms — treat with benztropine 1–2 mg IV", "Neuroleptic malignant syndrome — rare but life-threatening", "Akathisia — treat with diphenhydramine or benzodiazepine"], monitoring: ["QTc on ECG", "Vital signs", "EPS symptoms"], reversal: null, pregnancy_category: "C", renal_adjustment: false, hepatic_adjustment: true },
  { id: "ondansetron", category: "gi_gu_ob", name: "Ondansetron (Zofran)", line: "first", indications: ["Nausea/vomiting", "Chemotherapy-induced N/V", "Hyperemesis gravidarum"], adult_dose: "4–8 mg IV/PO/ODT; may repeat q4–6h", pediatric_dose: { mg_per_kg: 0.15, unit: "mg", route: "IV/PO/ODT", max_dose_mg: 8, notes: "< 15 kg: 2 mg; 15–30 kg: 4 mg; > 30 kg: 8 mg; q4–6h" }, onset: "< 30 min", duration: "4–8 hr", contraindications: ["Hypersensitivity", "Congenital long QT syndrome"], warnings: ["QTc prolongation — higher risk with IV vs PO", "Serotonin syndrome with concomitant serotonergic agents", "Headache common"], monitoring: ["QTc if IV use", "Symptoms"], reversal: null, pregnancy_category: "B", renal_adjustment: false, hepatic_adjustment: true },
  { id: "metoclopramide", category: "gi_gu_ob", name: "Metoclopramide (Reglan)", line: "first", indications: ["Nausea/vomiting", "Gastroparesis", "Migraine headache (adjunct)"], adult_dose: "10 mg IV over 15 min", pediatric_dose: { mg_per_kg: 0.1, unit: "mg", route: "IV", max_dose_mg: 10, notes: "Over 15 min; age > 1 year" }, onset: "1–3 min IV", duration: "1–2 hr", contraindications: ["Bowel obstruction or GI perforation", "Pheochromocytoma", "Seizure disorder (relative)"], warnings: ["EPS/akathisia — premedicate with diphenhydramine 25 mg IV", "Tardive dyskinesia with prolonged or repeated use", "Neuroleptic malignant syndrome (rare)"], monitoring: ["EPS symptoms", "BP"], reversal: "Diphenhydramine 25–50 mg IV for EPS/akathisia", pregnancy_category: "B", renal_adjustment: true, hepatic_adjustment: false },
  { id: "magnesium_obstetric", category: "gi_gu_ob", name: "Magnesium Sulfate (Eclampsia)", line: "first", indications: ["Eclampsia treatment and prophylaxis", "Pre-eclampsia with severe features"], adult_dose: "Loading: 4–6 g IV over 15–20 min; Maintenance: 1–2 g/hr infusion", pediatric_dose: { mg_per_kg: null, unit: "g", route: "IV", max_dose_mg: null, notes: "Adult OB indication only" }, onset: "Minutes", duration: "Infusion-dependent", contraindications: ["Myasthenia gravis", "Severe renal failure — adjust dose carefully", "Heart block"], warnings: ["Toxicity sequence: loss of DTRs (5–7 mEq/L) → respiratory arrest (10–13 mEq/L) → cardiac arrest (> 15 mEq/L)", "Calcium gluconate 1 g IV is antidote — keep at bedside", "Monitor UO ≥ 25 mL/hr, DTRs, and RR hourly"], monitoring: ["DTRs q1h", "RR q1h", "UO ≥ 25 mL/hr", "Serum Mg levels if renal impairment"], reversal: "Calcium gluconate 1 g IV", pregnancy_category: "A", renal_adjustment: true, hepatic_adjustment: false },
  { id: "sodium_bicarbonate", category: "gi_gu_ob", name: "Sodium Bicarbonate", line: "first", indications: ["Tricyclic antidepressant overdose", "Hyperkalemia with cardiac toxicity", "Severe metabolic acidosis", "Salicylate toxicity (urinary alkalinization)"], adult_dose: "TCA: 1–2 mEq/kg IV bolus; repeat to maintain pH 7.45–7.55 | Hyperkalemia: 1 mEq/kg IV | Infusion: 150 mEq in D5W at 250 mL/hr", pediatric_dose: { mg_per_kg: 1, unit: "mEq", route: "IV/IO", max_dose_mg: 100, notes: "Dilute 1:1 with sterile water to reduce osmolality in peds; 1 mEq/kg bolus" }, onset: "Minutes", duration: "Infusion rate dependent", contraindications: ["Metabolic alkalosis", "Uncorrected hypocalcemia"], warnings: ["Hypernatremia with large doses", "Alkalosis overshoot — may worsen ionized hypocalcemia", "Hypokalemia", "Tissue necrosis with extravasation"], monitoring: ["ABG/VBG — target pH 7.45–7.55 for TCA", "Na+", "K+", "iCa2+", "ECG"], reversal: null, pregnancy_category: "C", renal_adjustment: false, hepatic_adjustment: false },
];

const SEPSIS_BUNDLE_STEPS = [
  { step: 1, action: "Measure lactate level", detail: "If initial lactate > 2 mmol/L, re-measure within 2 hours to assess clearance", priority: "high" },
  { step: 2, action: "Obtain blood cultures before administering antibiotics", detail: "≥ 2 sets (aerobic + anaerobic); do NOT delay antibiotics > 45 min waiting for cultures", priority: "high" },
  { step: 3, action: "Administer broad-spectrum antibiotics", detail: "Within 1 hour of sepsis/septic shock recognition; refer to antibiotic protocol", priority: "critical" },
  { step: 4, action: "Administer 30 mL/kg crystalloid for septic shock or lactate ≥ 4 mmol/L", detail: "Balanced crystalloid (LR preferred per SMART trial); reassess fluid responsiveness after each 500 mL bolus", priority: "critical" },
  { step: 5, action: "Apply vasopressors if hypotensive during or after fluid resuscitation", detail: "Target MAP ≥ 65 mmHg; initiate norepinephrine if MAP < 65 despite fluids", priority: "high" },
];

const SEPSIS_EMPIRIC = [
  { severity: "Moderate Sepsis — Community-Acquired", primary_regimen: "Ceftriaxone 2 g IV q24h", additional_coverage: "Add azithromycin 500 mg IV if pneumonia suspected", mrsa_coverage: "Add vancomycin if MRSA risk factors present", notes: "Covers most Gram-positive and Gram-negative community organisms" },
  { severity: "Severe Sepsis / Septic Shock", primary_regimen: "Piperacillin-Tazobactam 4.5 g IV q6–8h (extended infusion over 4 hr preferred)", additional_coverage: "Vancomycin 25–30 mg/kg IV loading dose if MRSA risk factors present", mrsa_coverage: "Vancomycin included as additional coverage", notes: "Broad-spectrum empiric; tailor urgently to culture results; add antifungal (micafungin 100 mg IV) if immunocompromised" },
  { severity: "High ESBL Risk / HAP / Recent Antibiotics", primary_regimen: "Meropenem 1–2 g IV q8h (extended infusion over 3 hr preferred)", additional_coverage: "Vancomycin 25–30 mg/kg IV load if MRSA risk", mrsa_coverage: "Vancomycin as additional coverage", notes: "Reserve carbapenem for true ESBL/MDR risk; reassess and de-escalate at 48–72 hr; stewardship consultation" },
];

const LINE_STYLE = {
  first: { bg: "bg-emerald-100 text-emerald-700 border border-emerald-200", label: "First-line" },
  second: { bg: "bg-amber-100 text-amber-700 border border-amber-200", label: "Second-line" },
};

const PREG_COLORS = { A: "text-emerald-700 bg-emerald-50", B: "text-blue-700 bg-blue-50", C: "text-amber-700 bg-amber-50", D: "text-orange-700 bg-orange-50", X: "text-red-700 bg-red-50" };

// ─── Category Pill ─────────────────────────────────────────────────────────────
function CategoryPill({ cat, active, onClick }) {
  return (
    <button onClick={onClick} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${active ? "text-white border-transparent shadow-sm" : "bg-transparent border-slate-200 text-slate-500 hover:border-slate-400"}`} style={active ? { background: cat.color, borderColor: cat.color } : {}}>
      {cat.label}
    </button>
  );
}

// ─── Med Card ──────────────────────────────────────────────────────────────────
function MedCard({ med, catColor, onAdd, weightKg }) {
  const [open, setOpen] = useState(false);
  const [showPeds, setShowPeds] = useState(false);
  const line = LINE_STYLE[med.line] || LINE_STYLE.first;

  const pedDose = useMemo(() => {
    if (!med.pediatric_dose || !med.pediatric_dose.mg_per_kg || !weightKg) return null;
    const raw = med.pediatric_dose.mg_per_kg * weightKg;
    const capped = med.pediatric_dose.max_dose_mg ? Math.min(raw, med.pediatric_dose.max_dose_mg) : raw;
    return `${capped.toFixed(1)} ${med.pediatric_dose.unit} ${med.pediatric_dose.route}`;
  }, [med, weightKg]);

  return (
    <div className={`rounded-xl border transition-all ${open ? "border-blue-300 shadow-md" : "border-slate-200 hover:border-slate-300"} bg-white overflow-hidden`}>
      <div className="flex items-start gap-3 p-3 cursor-pointer" onClick={() => setOpen(v => !v)} style={{ borderLeft: `3px solid ${catColor}` }}>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <span className="font-semibold text-slate-900 text-sm">{med.name}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded ${line.bg}`}>{line.label}</span>
            {med.pregnancy_category && <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${PREG_COLORS[med.pregnancy_category] || "bg-slate-100 text-slate-600"}`}>Preg {med.pregnancy_category}</span>}
            {med.renal_adjustment && <span className="text-xs px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">Renal ↓</span>}
            {med.hepatic_adjustment && <span className="text-xs px-1.5 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200">Hepatic ↓</span>}
          </div>
          <div className="flex flex-wrap gap-1 mb-1">
            {med.indications.slice(0, 3).map((ind, i) => <span key={i} className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{ind}</span>)}
          </div>
          <p className="text-xs text-slate-700 font-mono truncate"><span className="font-semibold text-slate-500">Adult:</span> {med.adult_dose}</p>
          {weightKg && pedDose && <p className="text-xs text-blue-700 font-mono truncate mt-0.5"><span className="font-semibold">Peds ({weightKg}kg):</span> {pedDose}</p>}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={e => { e.stopPropagation(); onAdd(med); }} className="p-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors" title="Add to note"><Plus className="w-3.5 h-3.5" /></button>
          {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 pt-2 border-t border-slate-100 space-y-3">
              {/* Timing */}
              <div className="flex flex-wrap gap-4 text-xs">
                <div><span className="text-slate-400 font-semibold uppercase tracking-wide">Onset</span><br /><span className="text-slate-800">{med.onset}</span></div>
                <div><span className="text-slate-400 font-semibold uppercase tracking-wide">Duration</span><br /><span className="text-slate-800">{med.duration}</span></div>
                {med.reversal && <div><span className="text-slate-400 font-semibold uppercase tracking-wide">Reversal</span><br /><span className="text-emerald-700 font-medium">{med.reversal}</span></div>}
              </div>

              {/* Pediatric dosing */}
              {med.pediatric_dose && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5">
                  <p className="text-xs font-bold text-blue-700 uppercase tracking-wide flex items-center gap-1 mb-1.5"><Baby className="w-3 h-3" /> Pediatric Dosing</p>
                  <p className="text-xs text-blue-800 font-mono">
                    {med.pediatric_dose.mg_per_kg ? `${med.pediatric_dose.mg_per_kg} ${med.pediatric_dose.unit}/kg ${med.pediatric_dose.route}` : `Fixed: see notes`}
                    {med.pediatric_dose.max_dose_mg && ` (max ${med.pediatric_dose.max_dose_mg} ${med.pediatric_dose.unit})`}
                  </p>
                  {med.pediatric_dose.notes && <p className="text-xs text-blue-700 mt-1">{med.pediatric_dose.notes}</p>}
                  {weightKg && pedDose && <p className="text-xs font-bold text-blue-900 mt-1.5 pt-1.5 border-t border-blue-200">Calculated ({weightKg} kg): {pedDose}</p>}
                </div>
              )}

              {/* Contraindications */}
              {med.contraindications?.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-2.5">
                  <p className="text-xs font-bold text-red-600 uppercase tracking-wide flex items-center gap-1 mb-1.5"><AlertTriangle className="w-3 h-3" /> Contraindications</p>
                  <ul className="space-y-0.5">{med.contraindications.map((c, i) => <li key={i} className="text-xs text-red-700 flex items-start gap-1"><span className="text-red-400 mt-0.5">•</span>{c}</li>)}</ul>
                </div>
              )}

              {/* Warnings */}
              {med.warnings?.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                  <p className="text-xs font-bold text-amber-700 uppercase tracking-wide flex items-center gap-1 mb-1.5"><Shield className="w-3 h-3" /> Warnings</p>
                  <ul className="space-y-0.5">{med.warnings.map((w, i) => <li key={i} className="text-xs text-amber-800 flex items-start gap-1"><span className="text-amber-400 mt-0.5">•</span>{w}</li>)}</ul>
                </div>
              )}

              {/* Monitoring */}
              {med.monitoring?.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center gap-1"><Activity className="w-3 h-3" /> Monitoring</p>
                  <div className="flex flex-wrap gap-1.5">{med.monitoring.map((m, i) => <span key={i} className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">{m}</span>)}</div>
                </div>
              )}

              <button onClick={() => onAdd(med)} className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add to Note
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── ER Reference Tab ──────────────────────────────────────────────────────────
function MedReferenceTab({ onAddMed }) {
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("all");
  const [weightKg, setWeightKg] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return MEDICATIONS.filter(m => {
      const matchCat = activeCat === "all" || m.category === activeCat;
      const matchSearch = !q || m.name.toLowerCase().includes(q) || m.indications.some(i => i.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [search, activeCat]);

  const catColor = CATEGORIES.find(c => c.id === activeCat)?.color || "#6b7280";
  const wt = parseFloat(weightKg) || null;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <Input placeholder="Search by name or indication…" value={search} onChange={e => setSearch(e.target.value)} className="pl-8 text-sm h-8 border-slate-200" />
          {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="w-3.5 h-3.5" /></button>}
        </div>
        <div className="relative w-28">
          <Baby className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-blue-400" />
          <Input type="number" placeholder="Wt (kg)" value={weightKg} onChange={e => setWeightKg(e.target.value)} className="pl-8 text-sm h-8 border-blue-200 focus:border-blue-400" title="Enter patient weight for pediatric dose calculation" />
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORIES.map(cat => <CategoryPill key={cat.id} cat={cat} active={activeCat === cat.id} onClick={() => setActiveCat(cat.id)} />)}
      </div>

      {wt && <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700"><Baby className="w-3.5 h-3.5" /><span>Showing calculated pediatric doses for <strong>{wt} kg</strong></span></div>}

      <p className="text-xs text-slate-400">{filtered.length} medication{filtered.length !== 1 ? "s" : ""}</p>

      <div className="space-y-2 max-h-[calc(100vh-420px)] overflow-y-auto pr-1">
        {filtered.length === 0
          ? <p className="text-sm text-center text-slate-400 py-10">No medications found</p>
          : filtered.map(med => {
              const cat = CATEGORIES.find(c => c.id === med.category);
              return <MedCard key={med.id} med={med} catColor={cat?.color || "#6b7280"} onAdd={onAddMed} weightKg={wt} />;
            })
        }
      </div>
    </div>
  );
}

// ─── Sepsis Protocol Tab ───────────────────────────────────────────────────────
function SepsisProtocolTab() {
  const [activeSection, setActiveSection] = useState("bundle");

  return (
    <div className="space-y-3">
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
        {[{ id: "bundle", label: "Hour-1 Bundle" }, { id: "empiric", label: "Empiric Antibiotics" }, { id: "criteria", label: "Sepsis Criteria" }].map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)} className={`flex-1 text-xs font-semibold px-2 py-1.5 rounded-md transition-all ${activeSection === s.id ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}>{s.label}</button>
        ))}
      </div>

      {activeSection === "bundle" && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Surviving Sepsis Campaign 2018 — Hour-1 Bundle</span>
          </div>
          {SEPSIS_BUNDLE_STEPS.map(s => (
            <div key={s.step} className={`rounded-lg border p-3 ${s.priority === "critical" ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"}`}>
              <div className="flex items-start gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${s.priority === "critical" ? "bg-red-600 text-white" : "bg-amber-500 text-white"}`}>{s.step}</div>
                <div>
                  <p className={`text-xs font-bold ${s.priority === "critical" ? "text-red-800" : "text-amber-900"}`}>{s.action}</p>
                  <p className={`text-xs mt-0.5 ${s.priority === "critical" ? "text-red-700" : "text-amber-800"}`}>{s.detail}</p>
                </div>
              </div>
            </div>
          ))}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mt-2">
            <p className="text-xs font-bold text-slate-700 mb-1.5">Lactate Targets</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
              <div><span className="font-semibold">Recheck:</span> q2h</div>
              <div><span className="font-semibold">Target clearance:</span> ≥ 10% at 2 hr</div>
              <div><span className="font-semibold">High-risk:</span> ≥ 4 mmol/L</div>
              <div><span className="font-semibold">Preferred fluid:</span> LR (SMART trial)</div>
            </div>
          </div>
        </div>
      )}

      {activeSection === "empiric" && (
        <div className="space-y-3">
          <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
            <span className="font-bold">Timing:</span> Within 1 hr of recognition. Obtain ≥ 2 blood culture sets before antibiotics — do not delay &gt; 45 min for cultures.
          </div>
          {SEPSIS_EMPIRIC.map((r, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2">
              <p className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-2">{r.severity}</p>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-start gap-2"><span className="text-emerald-600 font-semibold flex-shrink-0">Primary:</span><span className="text-slate-800 font-mono">{r.primary_regimen}</span></div>
                {r.additional_coverage && <div className="flex items-start gap-2"><span className="text-blue-600 font-semibold flex-shrink-0">Add:</span><span className="text-slate-700">{r.additional_coverage}</span></div>}
                <div className="text-slate-500 italic text-xs mt-1">{r.notes}</div>
              </div>
            </div>
          ))}
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800">
            <span className="font-bold">De-escalation:</span> Reassess regimen at 48–72 hr based on culture/sensitivity results; de-escalate to narrowest effective spectrum.
          </div>
        </div>
      )}

      {activeSection === "criteria" && (
        <div className="space-y-3">
          <div className="bg-white border border-slate-200 rounded-xl p-3.5">
            <p className="text-xs font-bold text-slate-800 mb-2">Sepsis-3 (2016)</p>
            <p className="text-xs text-slate-600 mb-2">Life-threatening organ dysfunction caused by a dysregulated host response to infection</p>
            <p className="text-xs font-semibold text-slate-700 mb-1">Criteria: Suspected/confirmed infection + SOFA score ≥ 2 from baseline</p>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 mt-2">
              <p className="text-xs font-bold text-slate-600 mb-1.5">qSOFA (bedside screen — score ≥ 2 = high risk)</p>
              {[{ name: "Respiratory Rate", value: "≥ 22 breaths/min" }, { name: "Altered Mental Status", value: "GCS < 15" }, { name: "Systolic BP", value: "≤ 100 mmHg" }].map((p, i) => (
                <div key={i} className="flex justify-between text-xs py-0.5"><span className="text-slate-700">{p.name}</span><span className="font-mono text-blue-700">{p.value} (+1)</span></div>
              ))}
            </div>
          </div>
          <div className="bg-white border border-red-200 rounded-xl p-3.5">
            <p className="text-xs font-bold text-red-700 mb-2">Septic Shock (Sepsis-3)</p>
            <p className="text-xs text-slate-600 mb-2">Sepsis + vasopressor requirement to maintain MAP ≥ 65 mmHg AND serum lactate &gt; 2 mmol/L despite adequate fluid resuscitation</p>
            <div className="grid grid-cols-3 gap-2 text-xs mt-2">
              {[{ name: "MAP", value: "< 65 mmHg" }, { name: "Lactate", value: "> 2 mmol/L" }, { name: "Mortality", value: "> 40%" }].map((t, i) => (
                <div key={i} className="bg-red-50 border border-red-200 rounded-lg p-2 text-center"><div className="font-bold text-red-700">{t.value}</div><div className="text-red-600 mt-0.5">{t.name}</div></div>
              ))}
            </div>
          </div>
          <div className="bg-white border border-purple-200 rounded-xl p-3.5">
            <p className="text-xs font-bold text-purple-700 mb-1">PHOENIX Sepsis Criteria (2024) — Pediatric</p>
            <p className="text-xs text-slate-500 mb-2">JAMA 2024; Schlapbach et al. — PHOENIX Sepsis Score ≥ 2 with suspected/confirmed infection</p>
            {[{ domain: "Respiratory", criteria: "SpO₂/FiO₂ < 292" }, { domain: "Cardiovascular", criteria: "Vasoactive infusion and/or lactate ≥ 5 mmol/L" }, { domain: "Coagulation", criteria: "INR ≥ 1.3, D-dimer ≥ 2 mg/L, or Plt < 100" }, { domain: "Neurological", criteria: "GCS ≤ 10 or AVPU = P/U" }].map((d, i) => (
              <div key={i} className="flex justify-between text-xs py-1 border-b border-purple-100 last:border-0"><span className="font-semibold text-purple-800">{d.domain}</span><span className="text-purple-600">{d.criteria}</span></div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Current Medications Panel ─────────────────────────────────────────────────
function CurrentMedsPanel({ note, noteId, queryClient }) {
  const handleRemove = async (idx) => {
    const updated = note.medications.filter((_, i) => i !== idx);
    await base44.entities.ClinicalNote.update(noteId, { medications: updated });
    queryClient.invalidateQueries({ queryKey: ["note", noteId] });
    toast.success("Removed");
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-slate-400 shadow-sm overflow-hidden">
      <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2.5">
        <div className="w-2 h-2 rounded-full bg-slate-400" />
        <span className="text-sm font-semibold text-slate-800">Current Medications</span>
        <span className="text-xs text-slate-400">({note.medications?.length || 0})</span>
      </div>
      <div className="p-4">
        {note.medications?.length > 0 ? (
          <div className="space-y-1.5">
            {note.medications.map((med, idx) => (
              <div key={idx} className="group flex items-center gap-3 px-3 py-2 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">{idx + 1}</span>
                <p className="text-xs text-slate-800 flex-1">{med}</p>
                <button onClick={() => handleRemove(idx)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity p-0.5"><X className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
        ) : <p className="text-xs text-slate-400 text-center py-4">No medications documented yet.</p>}
      </div>
    </div>
  );
}

// ─── Drug Interaction Panel ────────────────────────────────────────────────────
function DrugInteractionPanel({ note, noteId, queryClient }) {
  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(false);

  const check = async () => {
    if (!note.medications?.length || note.medications.length < 2) { toast.error("Need at least 2 medications to check interactions"); return; }
    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze potential drug-drug interactions in this medication list. For each significant interaction, provide severity, mechanism, and clinical recommendation.\n\nMEDICATIONS:\n${note.medications.join('\n')}\n\nReturn only clinically significant interactions.`,
        add_context_from_internet: true,
        response_json_schema: { type: "object", properties: { interactions: { type: "array", items: { type: "object", properties: { drug_pair: { type: "string" }, severity: { type: "string", enum: ["mild", "moderate", "severe"] }, mechanism: { type: "string" }, recommendation: { type: "string" } } } } } }
      });
      setInteractions(result.interactions || []);
      if (!result.interactions?.length) toast.success("No significant interactions found");
    } catch (e) { toast.error("Failed to check interactions"); } finally { setLoading(false); }
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
        {!loading ? (
          <Button onClick={check} size="sm" variant="outline" className="text-xs h-6 px-2 gap-1 border-orange-200 text-orange-700 hover:bg-orange-50"><Sparkles className="w-3 h-3" />Check</Button>
        ) : <Loader2 className="w-4 h-4 animate-spin text-orange-500" />}
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
  { id: "sepsis", label: "Sepsis Protocol", icon: Heart },
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
      <div>
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Medications</h2>
        <p className="text-xs text-slate-400 mt-0.5">ER reference · AI recommendations · Sepsis protocol · Interaction checks</p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-semibold transition-all ${activeTab === tab.id ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}>
            <tab.icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* AI tab */}
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
          <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">Clinical decision support only. Verify all doses independently. Not a substitute for clinical judgment.</p>
          </div>
          <MedReferenceTab onAddMed={handleAddMed} />
          <CurrentMedsPanel note={note} noteId={noteId} queryClient={queryClient} />
          <DrugInteractionPanel note={note} noteId={noteId} queryClient={queryClient} />
        </div>
      )}

      {/* Sepsis Protocol tab */}
      {activeTab === "sepsis" && <SepsisProtocolTab />}

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