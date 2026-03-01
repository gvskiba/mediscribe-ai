import React, { useState, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import {
  Search, Sparkles, Plus, X, ChevronDown, ChevronUp,
  AlertTriangle, Activity, Loader2, Shield, ArrowLeft,
  Baby, Heart, Pill, FlaskConical, Zap, RotateCcw,
  Skull, Wind, Syringe, Check
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import MedicationRecommendations from "./MedicationRecommendations";
import TabDataPreview from "./TabDataPreview";
import ClinicalNotePreviewButton from "./ClinicalNotePreviewButton";

// ─── Theme ─────────────────────────────────────────────────────────────────────
const T = {
  bg: "#050f1e", surface: "#0b1829", card: "#0e2040",
  border: "#1a2d45", border2: "#1e3555",
  text: "#c8ddf0", bright: "#e8f4ff", muted: "#4a7299", dim: "#2a4d72",
  green: "#2ecc71", green_dim: "#001a10",
  amber: "#f5a623", amber_dim: "#2a1500",
  red: "#ff5c6c", red_dim: "#2a0a0f",
  blue: "#3b82f6", blue_dim: "#0d1e3a",
  purple: "#9b6dff", purple_dim: "#140a2a",
  teal: "#00d4bc", teal2: "#00a896", teal_dim: "#002e28",
  orange: "#fb923c", orange_dim: "#2a1200",
  rose: "#f472b6", rose_dim: "#2a0a1a",
  gold: "#fbbf24", gold_dim: "#2a1a00",
};

// ─── Medication Data ────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "all",           label: "All Drugs",          icon: Pill,        color: T.dim },
  { id: "resuscitation", label: "Resuscitation",       icon: Heart,       color: T.red },
  { id: "airway_rsi",    label: "Airway / RSI",        icon: Wind,        color: T.teal },
  { id: "analgesia",     label: "Analgesia & Sedation",icon: Syringe,     color: T.purple },
  { id: "vasopressors",  label: "Vasopressors",        icon: Zap,         color: T.rose },
  { id: "antibiotics",   label: "Sepsis Antibiotics",  icon: FlaskConical,color: T.amber },
  { id: "reversal",      label: "Reversal Agents",     icon: RotateCcw,   color: T.green },
  { id: "toxicology",    label: "Toxicology",          icon: Skull,       color: T.orange },
  { id: "antiarrhythmics",label:"Antiarrhythmics",     icon: Activity,    color: T.gold },
];

const MEDICATIONS = [
  // ── Resuscitation ──
  { id:"epi",    cat:"resuscitation", name:"Epinephrine",       highAlert:true,  pals:true,  acls:true,  line:"first",
    adult:"1 mg IV/IO q3-5min (arrest); 0.3–0.5 mg IM (anaphylaxis)",
    ped:{dose:0.01,unit:"mg/kg",route:"IV/IO",max:"1 mg",notes:"ETT: 0.1 mg/kg"},
    reversal:null, onset:"<1 min", duration:"3–5 min",
    ci:["Uncorrected hypovolemia (relative)"],
    warn:["High-alert — prepare carefully","Tissue necrosis if extravasation"],
    monitor:["HR","BP","cardiac rhythm","SpO₂"], preg:"C" },
  { id:"amio",   cat:"resuscitation", name:"Amiodarone",        highAlert:true,  pals:true,  acls:true,  line:"first",
    adult:"300 mg IV push (VF/pVT); 150 mg over 10 min (stable VT)",
    ped:{dose:5,unit:"mg/kg",route:"IV/IO",max:"300 mg",notes:"Dilute in D5W"},
    reversal:null, onset:"Minutes", duration:"Hours",
    ci:["Bradycardia","High-degree AV block w/o pacer"],
    warn:["QT prolongation","Hypotension with rapid infusion","Phlebitis — central line for infusions"],
    monitor:["BP","HR","QTc"], preg:"D" },
  { id:"atrop",  cat:"resuscitation", name:"Atropine",          highAlert:false, pals:true,  acls:true,  line:"first",
    adult:"0.5–1 mg IV q3–5 min; max 3 mg (bradycardia)",
    ped:{dose:0.02,unit:"mg/kg",route:"IV/IO/ETT",max:"0.5 mg child / 1 mg teen",notes:"Min 0.1 mg — paradoxical brady risk"},
    reversal:null, onset:"1–2 min", duration:"4–6 hr",
    ci:["Tachycardia","Glaucoma (relative)"],
    warn:["Min 0.1 mg peds — paradoxical bradycardia below this","ETT: 0.04–0.06 mg/kg"],
    monitor:["HR","rhythm","BP"], preg:"C" },
  { id:"aden",   cat:"resuscitation", name:"Adenosine",         highAlert:false, pals:true,  acls:true,  line:"first",
    adult:"6 mg rapid IV push; repeat 12 mg × 2 (SVT)",
    ped:{dose:0.1,unit:"mg/kg",route:"IV rapid push",max:"6 mg 1st / 12 mg repeat",notes:"Flush rapidly"},
    reversal:null, onset:"<30 sec", duration:"<2 min",
    ci:["2nd/3rd degree AV block","WPW with AF","Asthma (relative)"],
    warn:["Transient asystole — warn patient & have crash cart ready","Rapid push required — large antecubital vein + saline flush"],
    monitor:["Continuous EKG","BP"], preg:"C" },
  { id:"bicarb", cat:"resuscitation", name:"Sodium Bicarbonate", highAlert:true, pals:true,  acls:false, line:"first",
    adult:"1 mEq/kg IV (arrest w/ hyperkalemia, TCA OD, metabolic acidosis)",
    ped:{dose:1,unit:"mEq/kg",route:"IV/IO",max:"50 mEq",notes:"Neonates: 4.2% only (osmolarity)"},
    reversal:null, onset:"Minutes", duration:"Variable",
    ci:["Metabolic alkalosis","Uncorrected hypocalcemia"],
    warn:["Do NOT mix with calcium","Flush line before/after","Hypernatremia with large doses"],
    monitor:["ABG/VBG","Na⁺","K⁺","iCa²⁺"], preg:"C" },
  { id:"cacl",   cat:"resuscitation", name:"Calcium Chloride",  highAlert:true,  pals:true,  acls:false, line:"first",
    adult:"500–1000 mg IV (hyperkalemia, hypocalcemia, CCB OD)",
    ped:{dose:20,unit:"mg/kg",route:"IV/IO",max:"1000 mg",notes:"Central line preferred — vesicant"},
    reversal:null, onset:"1–3 min", duration:"30–60 min",
    ci:["Digoxin toxicity (relative)"],
    warn:["Vesicant — central line preferred","Bradycardia during rapid push","Neonates: use Calcium Gluconate (less irritating)"],
    monitor:["EKG","ionized Ca²⁺","HR"], preg:"C" },
  { id:"mag_r",  cat:"resuscitation", name:"Magnesium Sulfate", highAlert:true,  pals:true,  acls:false, line:"first",
    adult:"1–2 g IV over 15 min (Torsades, severe asthma, eclampsia)",
    ped:{dose:25,unit:"mg/kg",route:"IV/IO",max:"2000 mg",notes:"Over 20 min"},
    reversal:"Calcium gluconate 1 g IV", onset:"5–10 min", duration:"2–4 hr",
    ci:["Renal failure (reduce dose)","Hypermagnesemia"],
    warn:["Toxicity: loss of DTRs → respiratory arrest → cardiac arrest","Ca gluconate antidote — keep at bedside"],
    monitor:["DTRs","RR","Mg level","UO"], preg:"A" },

  // ── Airway / RSI ──
  { id:"keta_r", cat:"airway_rsi", name:"Ketamine",             highAlert:false, pals:true,  acls:false, line:"first",
    adult:"RSI: 1.5–2 mg/kg IV | Dissociation: 1–2 mg/kg | IM: 4–6 mg/kg",
    ped:{dose:1.5,unit:"mg/kg",route:"IV/IO/IM/IN",max:"No ceiling",notes:"IN: 4–6 mg/kg via MAD"},
    reversal:null, onset:"45–60 sec", duration:"10–20 min",
    ci:["Uncontrolled hypertension (relative)","Schizophrenia (relative)"],
    warn:["Emergence reactions — pretreat with midazolam 0.05 mg/kg","Increased secretions — consider atropine/glycopyrrolate","Preserves airway reflexes and BP — preferred in hemodynamic instability"],
    monitor:["BP","HR","SpO₂","ETCO₂","emergence"], preg:"B" },
  { id:"sux",    cat:"airway_rsi", name:"Succinylcholine",      highAlert:true,  pals:true,  acls:false, line:"first",
    adult:"1.5 mg/kg IV (RSI); IM: 3–4 mg/kg if no IV",
    ped:{dose:2,unit:"mg/kg (<10 kg) / 1.5 mg/kg",route:"IV/IO/IM",max:"150 mg",notes:"AVOID in peds <8 yr without known indication (FDA black box — undiagnosed myopathy risk)"},
    reversal:"Dantrolene (malignant hyperthermia only)", onset:"45–60 sec", duration:"8–10 min",
    ci:["Hyperkalemia","Burns/crush >48h","Denervation injuries","Personal/family Hx malignant hyperthermia","Myopathies"],
    warn:["⚠ FDA BLACK BOX: AVOID in pediatric patients <8 yr without known indication","Rhabdomyolysis in undiagnosed myopathy","Bradycardia in peds — atropine pretreatment if <5 yr"],
    monitor:["HR","fasciculations","SpO₂","K⁺"], preg:"C" },
  { id:"roc",    cat:"airway_rsi", name:"Rocuronium",           highAlert:false, pals:true,  acls:false, line:"first",
    adult:"RSI: 1.2 mg/kg IV; standard: 0.6 mg/kg",
    ped:{dose:1.2,unit:"mg/kg",route:"IV/IO",max:"No ceiling",notes:"Preferred when succinylcholine CI"},
    reversal:"Sugammadex 16 mg/kg IV (immediate)", onset:"60–90 sec (1.2 mg/kg)", duration:"45–70 min",
    ci:["Hypersensitivity to rocuronium/bromide"],
    warn:["Prolonged blockade — secure airway first","16 mg/kg sugammadex for immediate reversal if CICV scenario"],
    monitor:["SpO₂","ETCO₂","neuromuscular monitor"], preg:"C" },
  { id:"etomi",  cat:"airway_rsi", name:"Etomidate",            highAlert:false, pals:false, acls:false, line:"first",
    adult:"0.3 mg/kg IV (RSI induction)",
    ped:{dose:0.3,unit:"mg/kg",route:"IV",max:"20 mg",notes:"Safe ≥10 yr; use ketamine <10 yr"},
    reversal:null, onset:"<1 min", duration:"5–15 min",
    ci:["Adrenal insufficiency (relative)","Septic shock (relative)"],
    warn:["Myoclonus during induction (common)","Single RSI dose: clinically insignificant adrenal suppression","Does NOT provide analgesia — add fentanyl or ketamine"],
    monitor:["BP","HR","SpO₂","myoclonus"], preg:"C" },
  { id:"propof", cat:"airway_rsi", name:"Propofol",             highAlert:true,  pals:false, acls:false, line:"second",
    adult:"Induction: 1–2 mg/kg IV | Sedation infusion: 5–50 mcg/kg/min",
    ped:{dose:2,unit:"mg/kg",route:"IV",max:"200 mg",notes:"Slow push; airway support mandatory"},
    reversal:null, onset:"<1 min", duration:"5–10 min",
    ci:["Egg/soy/peanut allergy (relative)","Hemodynamic instability"],
    warn:["PROPOFOL INFUSION SYNDROME — prolonged high-dose infusion","Significant hypotension","Pain on injection — pretreat with lidocaine 40 mg IV"],
    monitor:["BP","lipid panel","TG","pH","CK (prolonged infusion)"], preg:"B" },
  { id:"sugam",  cat:"airway_rsi", name:"Sugammadex",           highAlert:false, pals:false, acls:false, line:"first",
    adult:"Immediate reversal (roc/vec): 16 mg/kg IV | Routine: 4 mg/kg | Moderate: 2 mg/kg",
    ped:{dose:16,unit:"mg/kg (immediate)",route:"IV",max:"No ceiling",notes:"Monitor for re-curarization"},
    reversal:null, onset:"3 min", duration:"Full reversal",
    ci:["Hypersensitivity to sugammadex"],
    warn:["Anaphylaxis reported (~0.3%)","Re-curarization possible — monitor"],
    monitor:["NMB monitor","SpO₂","re-curarization"], preg:"C" },
  { id:"fent_a", cat:"airway_rsi", name:"Fentanyl",             highAlert:true,  pals:true,  acls:false, line:"first",
    adult:"Analgesia: 1–2 mcg/kg IV | RSI adjunct: 2–3 mcg/kg | IN: 1.5–2 mcg/kg",
    ped:{dose:1,unit:"mcg/kg",route:"IV/IO/IN",max:"100 mcg",notes:"IN via MAD: 1.5 mcg/kg each nostril"},
    reversal:"Naloxone 0.01 mg/kg IV/IM/IN", onset:"1–2 min IV", duration:"30–60 min",
    ci:["Respiratory depression","MAO inhibitors within 14 days"],
    warn:["Chest wall rigidity at high doses or rapid infusion","Re-narcotization possible with short-acting reversal"],
    monitor:["SpO₂","RR","BP","pain score"], preg:"C" },

  // ── Analgesia & Sedation ──
  { id:"midaz",  cat:"analgesia", name:"Midazolam",             highAlert:true,  pals:true,  acls:false, line:"first",
    adult:"Procedural: 1–2.5 mg IV titrate | RSI co-induction: 0.05–0.1 mg/kg | IM: 0.1–0.15 mg/kg",
    ped:{dose:0.1,unit:"mg/kg",route:"IV/IO/IM/IN/PO",max:"10 mg",notes:"IN: 0.2–0.5 mg/kg via MAD (max 10 mg)"},
    reversal:"Flumazenil 0.01 mg/kg IV (max 0.2 mg/dose)", onset:"2–3 min IV", duration:"30–60 min",
    ci:["Acute angle-closure glaucoma","Respiratory depression"],
    warn:["Resuscitative equipment at bedside","Re-sedation risk with flumazenil reversal","Paradoxical agitation (rare)"],
    monitor:["SpO₂","RR","BP","RASS"], preg:"D" },
  { id:"morph",  cat:"analgesia", name:"Morphine Sulfate",      highAlert:false, pals:false, acls:false, line:"first",
    adult:"2–4 mg IV q2–4h; titrate 1–2 mg q5–10 min",
    ped:{dose:0.05,unit:"mg/kg",route:"IV",max:"4 mg/dose",notes:"Titrate q15–30 min"},
    reversal:"Naloxone", onset:"5–10 min IV", duration:"3–5 hr",
    ci:["Respiratory depression","Paralytic ileus","Head injury w/ AMS"],
    warn:["Histamine release — pruritus/hypotension","Avoid in renal failure (active metabolite accumulates)"],
    monitor:["RR","BP","SpO₂"], preg:"C" },
  { id:"hydrom", cat:"analgesia", name:"Hydromorphone",         highAlert:false, pals:false, acls:false, line:"first",
    adult:"0.5–1 mg IV q3–4h; 1–2 mg IM/SC q3–4h",
    ped:{dose:0.015,unit:"mg/kg",route:"IV",max:"1 mg/dose",notes:"5× more potent than morphine"},
    reversal:"Naloxone", onset:"5 min IV", duration:"4–5 hr",
    ci:["Respiratory depression"],
    warn:["5× more potent than morphine","Less histamine release — preferred if morphine allergy"],
    monitor:["RR","SpO₂","BP"], preg:"C" },
  { id:"ketor",  cat:"analgesia", name:"Ketorolac",             highAlert:false, pals:false, acls:false, line:"first",
    adult:"15–30 mg IV/IM q6h; max 5-day course",
    ped:{dose:0.5,unit:"mg/kg",route:"IV/IM",max:"30 mg",notes:"Age ≥ 2 yr only"},
    reversal:null, onset:"30 min", duration:"4–6 hr",
    ci:["GI bleed","Renal insufficiency","ASA/NSAID allergy","Age <6 mo"],
    warn:["Limit ≤5 days total","GI prophylaxis with prolonged use"],
    monitor:["SCr","GI symptoms"], preg:"C" },
  { id:"apap_iv",cat:"analgesia", name:"Acetaminophen IV",      highAlert:false, pals:false, acls:false, line:"first",
    adult:"1000 mg IV q6h; max 4 g/day (3 g if liver disease)",
    ped:{dose:15,unit:"mg/kg",route:"IV",max:"1000 mg",notes:"Max 75 mg/kg/day"},
    reversal:"N-Acetylcysteine (OD)", onset:"5–10 min", duration:"4–6 hr",
    ci:["Hepatic failure"],
    warn:["Max 2 g/day in hepatic disease or alcoholism","Reduces opioid requirements (multimodal)"],
    monitor:["LFTs"], preg:"B" },
  { id:"naln",   cat:"analgesia", name:"Naloxone (Narcan)",     highAlert:false, pals:true,  acls:false, line:"first",
    adult:"0.04–2 mg IV/IM/IN q2–3 min (titrate); 2 mg IN for suspected OD",
    ped:{dose:0.01,unit:"mg/kg",route:"IV/IM/IO/IN",max:"0.4 mg/dose",notes:"IN via MAD: 0.1 mg/kg"},
    reversal:null, onset:"<2 min IV", duration:"30–90 min",
    ci:["None absolute in emergency"],
    warn:["Duration shorter than most opioids — re-narcotization risk","Precipitated withdrawal — pulmonary edema, agitation","Infusion: 2/3 reversal dose per hr for long-acting opioids"],
    monitor:["RR","SpO₂","consciousness","HR","BP"], preg:"C" },

  // ── Vasopressors ──
  { id:"norepi", cat:"vasopressors", name:"Norepinephrine",      highAlert:true,  pals:false, acls:false, line:"first",
    adult:"0.01–3 mcg/kg/min IV infusion; start 0.1 mcg/kg/min",
    ped:{dose:0.05,unit:"mcg/kg/min",route:"IV infusion",max:null,notes:"Titrate to age-appropriate MAP goal"},
    reversal:null, onset:"1–2 min", duration:"Infusion-dependent",
    ci:["Uncorrected hypovolemia"],
    warn:["First-line vasopressor for septic shock (SSC 2021)","Central line strongly preferred","Tissue necrosis with extravasation — phentolamine antidote"],
    monitor:["Continuous BP (arterial preferred)","MAP q15 min","Lactate q2h","UO"], preg:"C" },
  { id:"dopam",  cat:"vasopressors", name:"Dopamine",            highAlert:true,  pals:false, acls:false, line:"second",
    adult:"2–20 mcg/kg/min IV; low:2–5 (renal), mid:5–10 (cardiac), high:10–20 (vasopressor)",
    ped:{dose:5,unit:"mcg/kg/min",route:"IV",max:"20 mcg/kg/min",notes:"Titrate by 5 mcg/kg/min"},
    reversal:null, onset:"5 min", duration:"Infusion-dependent",
    ci:["Pheochromocytoma","Tachyarrhythmias"],
    warn:["Increased arrhythmia risk vs norepinephrine","Less preferred in septic shock (SSC 2021)"],
    monitor:["Continuous cardiac","BP","HR"], preg:"C" },
  { id:"vaso",   cat:"vasopressors", name:"Vasopressin",         highAlert:true,  pals:false, acls:false, line:"second",
    adult:"0.03–0.04 units/min IV fixed (do NOT titrate) — add-on to norepinephrine",
    ped:{dose:0.0003,unit:"units/kg/min",route:"IV",max:"0.002 units/kg/min",notes:"Fixed adjunct dose"},
    reversal:null, onset:"Minutes", duration:"Infusion-dependent",
    ci:["Mesenteric ischemia (caution)"],
    warn:["Fixed dose — do NOT titrate like other vasopressors","Add-on to NE to spare NE dose (VASST trial)"],
    monitor:["MAP","Na⁺","urine output"], preg:"X" },
  { id:"pheny",  cat:"vasopressors", name:"Phenylephrine",       highAlert:true,  pals:false, acls:false, line:"second",
    adult:"100–200 mcg IV bolus; infusion 0.5–6 mcg/kg/min",
    ped:null,
    reversal:null, onset:"<1 min", duration:"15–20 min",
    ci:["Severe bradycardia"],
    warn:["Pure alpha-1 — no inotropy","Reflex bradycardia risk","Use in tachycardia/vasodilatory shock without tachycardia contraindication"],
    monitor:["BP","HR"], preg:"C" },
  { id:"dobut",  cat:"vasopressors", name:"Dobutamine",          highAlert:true,  pals:false, acls:false, line:"first",
    adult:"2.5–20 mcg/kg/min IV infusion",
    ped:{dose:5,unit:"mcg/kg/min",route:"IV",max:"20 mcg/kg/min",notes:"Inotrope"},
    reversal:null, onset:"1–2 min", duration:"Infusion-dependent",
    ci:["Hypertrophic obstructive cardiomyopathy"],
    warn:["Inotrope — increases CO","May cause hypotension and tachycardia","Use in cardiogenic shock with low CO despite adequate MAP"],
    monitor:["CO/CI","BP","HR","SpO₂"], preg:"B" },

  // ── Sepsis Antibiotics ──
  { id:"piptaz", cat:"antibiotics", name:"Piperacillin-Tazobactam", highAlert:false, pals:false, acls:false, line:"first",
    adult:"4.5 g IV q6h (extended infusion over 4 hr preferred for sepsis)",
    ped:{dose:100,unit:"mg/kg",route:"IV",max:"4500 mg",notes:"Extended infusion preferred"},
    reversal:null, onset:"30 min", duration:"6–8 hr",
    ci:["Penicillin allergy (anaphylaxis)"],
    warn:["Renal dose adjustment required","Limited ESBL coverage — use carbapenem if confirmed ESBL"],
    monitor:["SCr","BMP","blood cultures"], preg:"B" },
  { id:"vanc",   cat:"antibiotics", name:"Vancomycin",            highAlert:false, pals:false, acls:false, line:"first",
    adult:"Loading: 25–30 mg/kg IV (max 3 g); then 15–20 mg/kg q8–12h (AUC/MIC guided)",
    ped:{dose:15,unit:"mg/kg",route:"IV",max:"3000 mg loading",notes:"q6h peds; infuse over ≥60 min"},
    reversal:null, onset:"30–60 min", duration:"6–12 hr",
    ci:["Hypersensitivity to vancomycin"],
    warn:["Red Man Syndrome (rate-related — NOT allergy; slow infusion)","Nephrotoxicity — monitor SCr q48h","AUC/MIC guided dosing preferred over troughs"],
    monitor:["SCr","AUC-guided levels","CBC"], preg:"C" },
  { id:"mero",   cat:"antibiotics", name:"Meropenem",             highAlert:false, pals:false, acls:false, line:"second",
    adult:"1–2 g IV q8h (extended 3–4 hr infusion for MDR/severe)",
    ped:{dose:20,unit:"mg/kg",route:"IV",max:"2000 mg",notes:"Meningitis: 40 mg/kg q8h"},
    reversal:null, onset:"30 min", duration:"8 hr",
    ci:["Carbapenem allergy","Concurrent valproic acid (↓ valproate levels 60–90%)"],
    warn:["Reserve for ESBL/MDR organisms","Seizures at high doses in renal failure","Decreases valproate levels significantly"],
    monitor:["SCr","valproate if applicable","seizures"], preg:"B" },
  { id:"ceftri", cat:"antibiotics", name:"Ceftriaxone",           highAlert:false, pals:false, acls:false, line:"first",
    adult:"1–2 g IV/IM q24h; meningitis: 2 g IV q12h",
    ped:{dose:50,unit:"mg/kg",route:"IV/IM",max:"2000 mg",notes:"Meningitis: 100 mg/kg/day ÷ q12h; avoid neonates <28 days"},
    reversal:null, onset:"30–60 min", duration:"24 hr",
    ci:["Neonates w/ hyperbilirubinemia","Concurrent calcium infusions (neonates)"],
    warn:["Do NOT mix with calcium-containing IV solutions","Biliary sludging with prolonged use"],
    monitor:["LFTs","SCr","CBC"], preg:"B" },
  { id:"metro",  cat:"antibiotics", name:"Metronidazole",         highAlert:false, pals:false, acls:false, line:"first",
    adult:"500 mg IV q8h OR 1 g q12h; PO: 500 mg TID",
    ped:{dose:7.5,unit:"mg/kg",route:"IV/PO",max:"500 mg",notes:"q8h; age >1 month"},
    reversal:null, onset:"1–2 hr PO", duration:"8 hr",
    ci:["1st trimester pregnancy (relative)","Concurrent disulfiram"],
    warn:["Disulfiram-like reaction with alcohol — avoid ×72 hr after course","Peripheral neuropathy with prolonged use"],
    monitor:["CBC prolonged use","neuro exam"], preg:"B" },
  { id:"micaf",  cat:"antibiotics", name:"Micafungin",            highAlert:false, pals:false, acls:false, line:"first",
    adult:"100 mg IV q24h (empiric candidemia/invasive fungal)",
    ped:{dose:2,unit:"mg/kg",route:"IV",max:"100 mg",notes:"≤40 kg: 2 mg/kg"},
    reversal:null, onset:"Loading", duration:"24 hr",
    ci:["Hypersensitivity to echinocandins"],
    warn:["First-line empiric antifungal in ICU/immunocompromised","Candida bloodstream infection preferred"],
    monitor:["LFTs","fungal cultures"], preg:"C" },

  // ── Reversal Agents ──
  { id:"flumax", cat:"reversal", name:"Flumazenil",               highAlert:false, pals:false, acls:false, line:"first",
    adult:"0.2 mg IV over 30 sec; repeat 0.2 mg q60 sec; max 1 mg",
    ped:{dose:0.01,unit:"mg/kg",route:"IV",max:"0.2 mg/dose",notes:"Repeat q60 sec; max 1 mg total"},
    reversal:null, onset:"1–2 min", duration:"1 hr (re-sedation common)",
    ci:["Benzodiazepine-dependent patients","TCA co-ingestion","Seizure disorder on BZDs"],
    warn:["AVOID in BZD-dependent — precipitates acute withdrawal/seizures","Re-sedation very common — monitor ≥2 hr","May lower seizure threshold"],
    monitor:["Level of consciousness","RR","seizure activity"], preg:"C" },
  { id:"proto",  cat:"reversal", name:"Protamine Sulfate",        highAlert:true,  pals:false, acls:false, line:"first",
    adult:"1 mg per 100 units heparin (max 50 mg over 10 min); LMWH: 1 mg per 1 mg enoxaparin",
    ped:{dose:1,unit:"mg / 100 units heparin",route:"IV",max:"50 mg",notes:"Slow infusion over 10 min"},
    reversal:null, onset:"5–10 min", duration:"2 hr",
    ci:["Fish allergy (relative)"],
    warn:["Hypotension/bradycardia/anaphylaxis risk","Max reversal of LMWH is ~60%","Never >50 mg in any dose"],
    monitor:["BP","HR","aPTT"], preg:"C" },
  { id:"andex",  cat:"reversal", name:"Andexanet Alfa",           highAlert:false, pals:false, acls:false, line:"first",
    adult:"Low: 400 mg bolus + 480 mg infusion (apixaban/rivaroxaban); High if recent or high dose",
    ped:null,
    reversal:null, onset:"Minutes", duration:"2 hr",
    ci:["Active thrombosis (caution)"],
    warn:["Specific for Factor Xa inhibitors (apixaban, rivaroxaban)","Expensive — use in life-threatening hemorrhage","ACEP recommends for massive bleeding"],
    monitor:["Anti-Xa activity","thromboembolic events"], preg:"C" },
  { id:"idaruc", cat:"reversal", name:"Idarucizumab (Praxbind)",  highAlert:false, pals:false, acls:false, line:"first",
    adult:"5 g IV (two 2.5 g vials) for dabigatran reversal",
    ped:null,
    reversal:null, onset:"Minutes", duration:"24 hr",
    ci:["Hypersensitivity to idarucizumab"],
    warn:["Specific for dabigatran (Pradaxa) only","Life-threatening hemorrhage or urgent surgery indication"],
    monitor:["dTT","ECT","thrombin time"], preg:"C" },
  { id:"vitk",   cat:"reversal", name:"Vitamin K",                highAlert:false, pals:false, acls:false, line:"first",
    adult:"Warfarin reversal (non-urgent): 2.5–10 mg IV/PO; Life-threatening: use with 4-factor PCC",
    ped:{dose:0.5,unit:"mg/kg",route:"IV/PO",max:"10 mg",notes:"IV over ≥15 min — anaphylaxis risk"},
    reversal:null, onset:"IV 6–12h; PO 12–24h", duration:"Days",
    ci:["None absolute"],
    warn:["IV anaphylaxis risk — give slowly over ≥15 min","Slow onset — use 4-factor PCC for urgent reversal","Check INR 12–24 hr after dose"],
    monitor:["INR","BP during IV infusion"], preg:"C" },
  { id:"pcc4",   cat:"reversal", name:"4-Factor PCC (Kcentra)",   highAlert:true,  pals:false, acls:false, line:"first",
    adult:"25–50 units/kg IV based on INR (max 5000 units) + Vitamin K 10 mg IV",
    ped:{dose:25,unit:"units/kg",route:"IV",max:"5000 units",notes:"Based on INR level"},
    reversal:null, onset:"Minutes", duration:"Hours",
    ci:["DIC","Heparin-induced thrombocytopenia"],
    warn:["Preferred over FFP for urgent warfarin reversal","Check INR 30 min post-infusion","Monitor for thrombosis"],
    monitor:["INR","thromboembolic events"], preg:"C" },
  { id:"nac",    cat:"reversal", name:"N-Acetylcysteine (NAC)",   highAlert:false, pals:false, acls:false, line:"first",
    adult:"Loading: 150 mg/kg IV over 60 min → 50 mg/kg over 4h → 100 mg/kg over 16h",
    ped:{dose:150,unit:"mg/kg loading",route:"IV/PO",max:"Use Rumack-Matthew nomogram",notes:"21-hr IV protocol"},
    reversal:null, onset:"1–4 hr", duration:"Protocol-based",
    ci:["Hypersensitivity to NAC"],
    warn:["Anaphylactoid reactions during loading — slow rate if reaction","Acetaminophen OD antidote — use Rumack-Matthew nomogram","Also for ALF not due to APAP"],
    monitor:["LFTs","INR","APAP level","anaphylactoid signs"], preg:"B" },

  // ── Toxicology ──
  { id:"charcoal",cat:"toxicology", name:"Activated Charcoal",   highAlert:false, pals:false, acls:false, line:"first",
    adult:"1 g/kg PO/NG (max 50–100 g); repeat doses: 0.5 g/kg q4h for specific ingestions",
    ped:{dose:1,unit:"g/kg",route:"PO/NG",max:"50 g",notes:"Within 1–2 hr of ingestion"},
    reversal:null, onset:"Immediate", duration:"Decontamination",
    ci:["Unprotected airway","GI obstruction/perforation","Caustic ingestion","Hydrocarbons"],
    warn:["Does NOT bind: iron, lithium, alcohols, heavy metals, cyanide","Aspiration risk — protect airway"],
    monitor:["Airway","bowel sounds","clinical response"], preg:"C" },
  { id:"intralip",cat:"toxicology", name:"Intralipid 20% (ILE)",  highAlert:true,  pals:false, acls:false, line:"first",
    adult:"LAST: 1.5 mL/kg IV over 1 min; infusion 0.25 mL/kg/min",
    ped:{dose:1.5,unit:"mL/kg",route:"IV",max:"12 mL/kg cumulative",notes:"Max cumulative 12 mL/kg"},
    reversal:null, onset:"Minutes", duration:"Variable",
    ci:["None absolute in LAST emergency"],
    warn:["Local anesthetic systemic toxicity antidote (LAST)","Also: lipophilic drug toxicity (TCA, CCB, beta-blocker)","Max cumulative: 12 mL/kg"],
    monitor:["Cardiac rhythm","BP","CNS status"], preg:"C" },
  { id:"glucag",  cat:"toxicology", name:"Glucagon",              highAlert:false, pals:false, acls:false, line:"first",
    adult:"Beta-blocker/CCB OD: 3–10 mg IV bolus; infusion 3–10 mg/hr",
    ped:{dose:0.1,unit:"mg/kg",route:"IV",max:"5 mg",notes:"Bolus then infusion"},
    reversal:null, onset:"1–3 min", duration:"5–10 min",
    ci:["Pheochromocytoma","Insulinoma"],
    warn:["Vomiting common — protect airway","Hyperglycemia","High-dose insulin therapy now preferred for CCB/BB OD"],
    monitor:["HR","BP","glucose","CO"], preg:"B" },
  { id:"hdi",     cat:"toxicology", name:"High-Dose Insulin (HDI)",highAlert:true, pals:false, acls:false, line:"first",
    adult:"CCB/BB OD: 1 unit/kg bolus IV; infusion 0.5–2 units/kg/hr with dextrose",
    ped:{dose:1,unit:"unit/kg",route:"IV",max:"No ceiling",notes:"Dextrose co-infusion mandatory"},
    reversal:null, onset:"15–30 min", duration:"Infusion-dependent",
    ci:["Hypoglycemia (without dextrose co-infusion)"],
    warn:["Emerging preferred for CCB/beta-blocker toxicity","Monitor glucose q30 min — large dextrose supplementation needed","Monitor K⁺ closely"],
    monitor:["Glucose q30 min","K⁺","HR","BP","CO"], preg:"C" },
  { id:"hydroco", cat:"toxicology", name:"Hydroxocobalamin (Cyanokit)",highAlert:false,pals:false,acls:false,line:"first",
    adult:"5 g IV over 15 min (cyanide poisoning, smoke inhalation with cyanide exposure)",
    ped:{dose:70,unit:"mg/kg",route:"IV",max:"5000 mg",notes:"Over 15 min"},
    reversal:null, onset:"Minutes", duration:"Single dose",
    ci:["None absolute in cyanide emergency"],
    warn:["Drug of choice for cyanide/smoke inhalation","Turns urine/skin red-brown — does not cause methemoglobin","Does not impair O₂ delivery"],
    monitor:["CN level if available","mental status","cardiac rhythm"], preg:"C" },
  { id:"fomep",   cat:"toxicology", name:"Fomepizole (4-MP)",     highAlert:false, pals:false, acls:false, line:"first",
    adult:"15 mg/kg IV over 30 min loading; 10 mg/kg q12h ×4 doses; then 15 mg/kg q12h",
    ped:{dose:15,unit:"mg/kg",route:"IV",max:"Use adult dosing",notes:"Same protocol as adults"},
    reversal:null, onset:"30 min", duration:"12 hr dosing",
    ci:["Hypersensitivity to fomepizole or pyrazole compounds"],
    warn:["Methanol/ethylene glycol OD antidote","Inhibits alcohol dehydrogenase — prevents toxic metabolite formation","Use instead of ethanol when available"],
    monitor:["Osmolal gap","anion gap","methanol/EG levels","osmolality"], preg:"C" },

  // ── Antiarrhythmics ──
  { id:"metop",   cat:"antiarrhythmics", name:"Metoprolol IV",   highAlert:false, pals:false, acls:true,  line:"first",
    adult:"AFib rate control: 2.5–5 mg IV q5 min ×3 doses max; PO: 25–100 mg BID",
    ped:{dose:0.1,unit:"mg/kg",route:"IV",max:"5 mg/dose",notes:"Over 5 min; age ≥1 yr"},
    reversal:"Glucagon 3–10 mg IV for beta-blocker toxicity", onset:"5 min", duration:"3–6 hr",
    ci:["HR <60 bpm","SBP <90 mmHg","Cardiogenic shock","Decompensated HF","High-degree AV block"],
    warn:["Monitor BP and HR continuously","Bronchospasm risk in reactive airway disease"],
    monitor:["Continuous cardiac","BP q5 min"], preg:"C" },
  { id:"diltia",  cat:"antiarrhythmics", name:"Diltiazem IV",    highAlert:false, pals:false, acls:false, line:"first",
    adult:"AFib rate: 0.25 mg/kg IV over 2 min; repeat 0.35 mg/kg; infusion 5–15 mg/hr",
    ped:{dose:0.25,unit:"mg/kg",route:"IV",max:"25 mg",notes:"Over 2 min"},
    reversal:"Calcium chloride 1 g IV", onset:"2–5 min", duration:"1–3 hr",
    ci:["WPW with AF/Flutter","Cardiogenic shock","HR <60","SBP <90"],
    warn:["Hypotension","Avoid in accessory pathway tachycardias"],
    monitor:["Continuous cardiac","BP"], preg:"C" },
  { id:"labetat", cat:"antiarrhythmics", name:"Labetalol IV",    highAlert:false, pals:false, acls:false, line:"first",
    adult:"20 mg IV over 2 min; repeat 40–80 mg q10 min; max 300 mg | Infusion: 0.5–2 mg/min",
    ped:{dose:0.2,unit:"mg/kg",route:"IV",max:"40 mg/dose",notes:"Infusion: 0.25–3 mg/kg/hr"},
    reversal:"Glucagon 3–10 mg IV", onset:"5 min", duration:"2–4 hr",
    ci:["Decompensated HF","Bradycardia HR <60","Asthma (relative)"],
    warn:["Alpha + beta blocker — avoid in cocaine-induced HTN (use phentolamine instead)","Monitor BP q5 min"],
    monitor:["BP q5 min","HR","neurologic exam"], preg:"C" },
  { id:"procain", cat:"antiarrhythmics", name:"Procainamide",    highAlert:true,  pals:false, acls:true,  line:"first",
    adult:"17 mg/kg IV at 20–50 mg/min (WPW+AFib, stable VT); max 1.7 g",
    ped:{dose:15,unit:"mg/kg",route:"IV",max:"1000 mg",notes:"At ≤1 mg/kg/min"},
    reversal:null, onset:"Minutes", duration:"3–6 hr",
    ci:["QT prolongation","Torsades de pointes","Lupus (relative)"],
    warn:["Stop if: BP drops >15 mmHg, QRS widens >50%, or arrhythmia terminates","Monitor QTc"],
    monitor:["Continuous cardiac","BP q5 min","QTc","QRS width"], preg:"C" },
];

// ─── Sepsis Data ─────────────────────────────────────────────────────────────
const BUNDLE = [
  { n:1, priority:"critical", action:"Measure lactate level", detail:"If initial lactate >2 mmol/L, re-measure within 2 hours to assess clearance. Goal: identify tissue hypoperfusion." },
  { n:2, priority:"high",     action:"Obtain blood cultures before antibiotics", detail:"≥2 sets (aerobic + anaerobic) before abx. Do NOT delay antibiotics >45 min waiting for cultures." },
  { n:3, priority:"critical", action:"Administer broad-spectrum antibiotics", detail:"Within 1 hour of sepsis/septic shock recognition. See empiric regimens." },
  { n:4, priority:"critical", action:"Start 30 mL/kg IV crystalloid", detail:"Balanced crystalloid preferred (LR or Plasmalyte). Reassess fluid responsiveness after each 500 mL bolus." },
  { n:5, priority:"high",     action:"Vasopressors if MAP <65 mmHg", detail:"Initiate norepinephrine. Target MAP ≥65 mmHg. Central line strongly preferred." },
];

const EMPIRIC = [
  { severity:"Moderate Sepsis — Community-Acquired", regimen:"Ceftriaxone 2 g IV q24h", add:"+ Azithromycin 500 mg IV if pneumonia suspected", note:"Covers most Gram-positive/Gram-negative community organisms." },
  { severity:"Severe Sepsis / Septic Shock", regimen:"Piperacillin-Tazobactam 4.5 g IV q6h (extended infusion 4 hr)", add:"+ Vancomycin 25–30 mg/kg IV loading if MRSA risk", note:"Broad empiric; tailor urgently to cultures; add micafungin 100 mg if immunocompromised." },
  { severity:"High ESBL / HAP / Recent Antibiotics", regimen:"Meropenem 1–2 g IV q8h (extended 3 hr infusion)", add:"+ Vancomycin 25–30 mg/kg IV load if MRSA risk", note:"Reserve carbapenems for true ESBL/MDR risk. De-escalate at 48–72 hr." },
];

// Broselow table
const BROSELOW = [
  { color:"Gray",   hex:"#9ca3af", range:"3–5 kg",   age:"0–3 mo" },
  { color:"Pink",   hex:"#f9a8d4", range:"6–7 kg",   age:"3–6 mo" },
  { color:"Red",    hex:"#f87171", range:"8–9 kg",   age:"6–9 mo" },
  { color:"Purple", hex:"#c084fc", range:"10–11 kg", age:"9–18 mo" },
  { color:"Yellow", hex:"#fde047", range:"12–14 kg", age:"18–36 mo" },
  { color:"White",  hex:"#e2e8f0", range:"15–18 kg", age:"3–4 yr" },
  { color:"Blue",   hex:"#60a5fa", range:"19–23 kg", age:"4–6 yr" },
  { color:"Orange", hex:"#fb923c", range:"24–29 kg", age:"6–8 yr" },
  { color:"Green",  hex:"#4ade80", range:"30–36 kg", age:"8–10 yr" },
  { color:"Black",  hex:"#6b7280", range:"≥37 kg",   age:">10 yr" },
];

function getBroselow(wt) {
  if (!wt) return null;
  if (wt <= 5) return BROSELOW[0];
  if (wt <= 7) return BROSELOW[1];
  if (wt <= 9) return BROSELOW[2];
  if (wt <= 11) return BROSELOW[3];
  if (wt <= 14) return BROSELOW[4];
  if (wt <= 18) return BROSELOW[5];
  if (wt <= 23) return BROSELOW[6];
  if (wt <= 29) return BROSELOW[7];
  if (wt <= 36) return BROSELOW[8];
  return BROSELOW[9];
}

// ─── MedCard ────────────────────────────────────────────────────────────────
function MedCard({ med, catColor, onAdd, weightKg }) {
  const [open, setOpen] = useState(false);

  const pedCalc = useMemo(() => {
    if (!med.ped || !med.ped.dose || !weightKg) return null;
    const raw = med.ped.dose * weightKg;
    const capped = med.ped.max && parseFloat(med.ped.max) ? Math.min(raw, parseFloat(med.ped.max)) : raw;
    return { dose: capped.toFixed(2), unit: med.ped.unit, capped: capped < raw };
  }, [med, weightKg]);

  return (
    <div style={{
      background: T.card, borderRadius: 8, overflow: "hidden",
      border: `1px solid ${open ? catColor + "60" : T.border}`,
      borderLeft: `3px solid ${catColor}`,
      transition: "border-color 0.15s"
    }}>
      <div
        className="flex items-start gap-3 p-3 cursor-pointer select-none"
        onClick={() => setOpen(v => !v)}
        onMouseEnter={e => e.currentTarget.style.background = T.surface}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1 mb-1">
            <span className="font-semibold text-sm" style={{ color: T.bright }}>{med.name}</span>
            {med.highAlert && <span className="px-1.5 py-0.5 rounded font-mono" style={{ fontSize: 9, background: T.amber_dim, color: T.amber, border: `1px solid ${T.amber}40` }}>⚠ HIGH ALERT</span>}
            {med.pals && <span className="px-1.5 py-0.5 rounded font-mono" style={{ fontSize: 9, background: T.teal_dim, color: T.teal }}>PALS</span>}
            {med.acls && <span className="px-1.5 py-0.5 rounded font-mono" style={{ fontSize: 9, background: T.blue_dim, color: T.blue }}>ACLS</span>}
            {med.line === "second" && <span className="px-1.5 py-0.5 rounded font-mono" style={{ fontSize: 9, background: T.dim, color: T.muted }}>2ND LINE</span>}
          </div>
          <p className="text-xs font-mono truncate" style={{ color: T.muted }}>
            <span style={{ color: T.muted }}>Adult: </span><span style={{ color: T.text }}>{med.adult}</span>
          </p>
          {weightKg && pedCalc && (
            <p className="text-xs font-mono mt-0.5 font-semibold" style={{ color: T.teal }}>
              Peds ({weightKg} kg): {pedCalc.dose} {pedCalc.unit} {med.ped.route}
              {pedCalc.capped && <span style={{ color: T.amber }}> (MAX DOSE)</span>}
            </p>
          )}
          {med.reversal && <p className="text-xs mt-0.5" style={{ color: T.green }}>↩ {med.reversal}</p>}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
          <button
            onClick={e => { e.stopPropagation(); onAdd(med); }}
            className="p-1 rounded transition-colors"
            style={{ background: T.blue_dim, color: T.blue }}
            onMouseEnter={e => { e.currentTarget.style.background = T.blue; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.background = T.blue_dim; e.currentTarget.style.color = T.blue; }}
            title="Add to note"
          ><Plus className="w-3.5 h-3.5" /></button>
          {open ? <ChevronUp className="w-3.5 h-3.5" style={{ color: T.muted }} /> : <ChevronDown className="w-3.5 h-3.5" style={{ color: T.muted }} />}
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-3 pb-3 pt-2 space-y-2.5" style={{ borderTop: `1px solid ${T.border}` }}>
              {/* Onset / Duration */}
              <div className="flex gap-4 text-xs">
                {[["Onset", med.onset], ["Duration", med.duration]].map(([l, v]) => (
                  <div key={l}>
                    <div style={{ color: T.muted, fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>{l}</div>
                    <div style={{ color: T.text }}>{v}</div>
                  </div>
                ))}
              </div>

              {/* Pediatric */}
              {med.ped && (
                <div className="rounded-lg p-2" style={{ background: T.blue_dim, border: `1px solid ${T.blue}30` }}>
                  <p className="font-mono text-xs font-bold mb-1" style={{ color: T.blue, fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    <Baby className="inline w-3 h-3 mr-1" />Pediatric Dosing
                  </p>
                  <p className="text-xs font-mono" style={{ color: T.text }}>
                    {med.ped.dose} {med.ped.unit}/kg {med.ped.route}
                    {med.ped.max && ` (max ${med.ped.max})`}
                  </p>
                  {med.ped.notes && <p className="text-xs mt-1" style={{ color: T.muted }}>{med.ped.notes}</p>}
                  {weightKg && pedCalc && (
                    <p className="text-xs font-mono font-bold mt-1.5 pt-1.5" style={{ color: T.teal, borderTop: `1px solid ${T.blue}30` }}>
                      Calculated ({weightKg} kg): {pedCalc.dose} {pedCalc.unit} {med.ped.route}
                      {pedCalc.capped && <span style={{ color: T.amber }}> ← MAX DOSE APPLIED</span>}
                    </p>
                  )}
                </div>
              )}

              {/* Contraindications */}
              {med.ci?.length > 0 && (
                <div className="rounded-lg p-2" style={{ background: T.red_dim, border: `1px solid ${T.red}30` }}>
                  <p className="mb-1 font-bold" style={{ color: T.red, fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    <AlertTriangle className="inline w-3 h-3 mr-1" />Contraindications
                  </p>
                  {med.ci.map((c, i) => <p key={i} className="text-xs" style={{ color: "#fca5a5" }}>• {c}</p>)}
                </div>
              )}

              {/* Warnings */}
              {med.warn?.length > 0 && (
                <div className="rounded-lg p-2" style={{ background: T.amber_dim, border: `1px solid ${T.amber}30` }}>
                  <p className="mb-1 font-bold" style={{ color: T.amber, fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    <Shield className="inline w-3 h-3 mr-1" />Warnings
                  </p>
                  {med.warn.map((w, i) => <p key={i} className="text-xs" style={{ color: "#fcd34d" }}>• {w}</p>)}
                </div>
              )}

              {/* Monitoring */}
              {med.monitor?.length > 0 && (
                <div>
                  <p className="mb-1 font-bold" style={{ color: T.muted, fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    <Activity className="inline w-3 h-3 mr-1" />Monitoring
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {med.monitor.map((m, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-full" style={{ background: T.blue_dim, color: T.blue, border: `1px solid ${T.blue}30` }}>{m}</span>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => onAdd(med)}
                className="w-full text-xs font-semibold py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all"
                style={{ background: T.teal_dim, color: T.teal, border: `1px solid ${T.teal}40` }}
                onMouseEnter={e => { e.currentTarget.style.background = T.teal; e.currentTarget.style.color = T.bg; }}
                onMouseLeave={e => { e.currentTarget.style.background = T.teal_dim; e.currentTarget.style.color = T.teal; }}
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

// ─── Pediatric Broselow Calculator ─────────────────────────────────────────
function PedCalcPanel() {
  const [wt, setWt] = useState("");
  const [wtLbs, setWtLbs] = useState("");
  const [selMed, setSelMed] = useState("");

  const wtKg = parseFloat(wt) || null;
  const brow = getBroselow(wtKg);

  const pedMeds = MEDICATIONS.filter(m => m.ped && m.ped.dose);

  const calcResult = useMemo(() => {
    if (!wtKg || !selMed) return null;
    const med = MEDICATIONS.find(m => m.id === selMed);
    if (!med?.ped?.dose) return null;
    const raw = med.ped.dose * wtKg;
    const maxRaw = med.ped.max ? parseFloat(med.ped.max) : null;
    const capped = maxRaw ? Math.min(raw, maxRaw) : raw;
    return { name: med.name, dose: capped.toFixed(2), unit: med.ped.unit, route: med.ped.route, maxApplied: maxRaw && capped < raw, notes: med.ped.notes };
  }, [wtKg, selMed]);

  const handleKgChange = (v) => { setWt(v); setWtLbs(v ? (parseFloat(v) * 2.205).toFixed(1) : ""); };
  const handleLbsChange = (v) => { setWtLbs(v); setWt(v ? (parseFloat(v) / 2.205).toFixed(1) : ""); };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Baby className="w-4 h-4" style={{ color: T.teal }} />
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: T.teal }}>Pediatric Dose Calculator</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs mb-1 block" style={{ color: T.muted }}>Weight (kg)</label>
          <input type="number" value={wt} onChange={e => handleKgChange(e.target.value)} placeholder="0.0"
            className="w-full text-xs h-8 px-3 rounded-lg outline-none"
            style={{ background: T.surface, border: `1px solid ${T.teal}50`, color: T.bright }} />
        </div>
        <div>
          <label className="text-xs mb-1 block" style={{ color: T.muted }}>Weight (lbs)</label>
          <input type="number" value={wtLbs} onChange={e => handleLbsChange(e.target.value)} placeholder="0.0"
            className="w-full text-xs h-8 px-3 rounded-lg outline-none"
            style={{ background: T.surface, border: `1px solid ${T.border2}`, color: T.text }} />
        </div>
      </div>

      {/* Broselow */}
      {brow && (
        <div className="rounded-lg px-3 py-2 flex items-center gap-3" style={{ background: T.card, border: `1px solid ${T.border2}` }}>
          <div className="w-5 h-5 rounded-full flex-shrink-0" style={{ background: brow.hex }} />
          <div>
            <p className="text-xs font-bold" style={{ color: T.bright }}>Broselow: {brow.color}</p>
            <p className="text-xs" style={{ color: T.muted }}>{brow.range} · ~{brow.age}</p>
          </div>
        </div>
      )}

      <div>
        <label className="text-xs mb-1 block" style={{ color: T.muted }}>Medication</label>
        <select value={selMed} onChange={e => setSelMed(e.target.value)}
          className="w-full text-xs h-8 px-2 rounded-lg outline-none"
          style={{ background: T.surface, border: `1px solid ${T.border2}`, color: T.text }}>
          <option value="">— Select medication —</option>
          {pedMeds.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>

      {/* Calc result */}
      <AnimatePresence>
        {calcResult && (
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <div className="rounded-xl p-3 space-y-2" style={{ background: T.teal_dim, border: `1px solid ${T.teal}50` }}>
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: T.teal }}>Calculated Dose</p>
              <div className="text-2xl font-bold font-mono" style={{ color: T.bright }}>
                {calcResult.dose} <span className="text-base" style={{ color: T.teal }}>{calcResult.unit}</span>
              </div>
              <p className="text-xs font-mono" style={{ color: T.muted }}>Route: {calcResult.route}</p>
              {calcResult.maxApplied && (
                <p className="text-xs font-bold" style={{ color: T.amber }}>⚠ Maximum dose applied</p>
              )}
              {calcResult.notes && <p className="text-xs" style={{ color: T.muted }}>{calcResult.notes}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Broselow Color Reference */}
      <div>
        <p className="text-xs mb-1.5 font-semibold uppercase tracking-wider" style={{ color: T.muted, fontSize: 9 }}>Broselow Color Reference</p>
        <div className="grid grid-cols-2 gap-1">
          {BROSELOW.map(b => (
            <div key={b.color} className="flex items-center gap-1.5 px-2 py-1 rounded text-xs" style={{ background: wtKg && brow?.color === b.color ? `${T.teal}20` : "transparent", border: `1px solid ${wtKg && brow?.color === b.color ? T.teal + "50" : T.border}` }}>
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: b.hex }} />
              <span style={{ color: wtKg && brow?.color === b.color ? T.teal : T.muted }}>{b.range}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Sepsis Panel ────────────────────────────────────────────────────────────
function SepsisPanel() {
  const [tab, setTab] = useState("bundle");

  return (
    <div className="space-y-3">
      <div className="flex gap-1 p-1 rounded-lg" style={{ background: T.border }}>
        {[{ id:"bundle", l:"Hour-1 Bundle" }, { id:"empiric", l:"Empiric Abx" }, { id:"criteria", l:"Criteria" }].map(s => (
          <button key={s.id} onClick={() => setTab(s.id)} className="flex-1 text-xs font-semibold px-2 py-1.5 rounded-md transition-all"
            style={tab === s.id ? { background: T.card, color: T.bright } : { background:"transparent", color: T.muted }}
          >{s.l}</button>
        ))}
      </div>

      {tab === "bundle" && (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: T.red, fontSize: 9 }}>
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: T.red }} />
            Surviving Sepsis Campaign 2021 — Hour-1 Bundle
          </p>
          {BUNDLE.map(s => (
            <div key={s.n} className="rounded-lg p-2.5" style={{ background: s.priority === "critical" ? T.red_dim : T.amber_dim, border: `1px solid ${s.priority === "critical" ? T.red : T.amber}40` }}>
              <div className="flex gap-2.5">
                <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold" style={{ background: s.priority === "critical" ? T.red : T.amber, color: T.bg }}>{s.n}</div>
                <div>
                  <p className="text-xs font-bold" style={{ color: s.priority === "critical" ? "#fca5a5" : "#fcd34d" }}>{s.action}</p>
                  <p className="text-xs mt-0.5" style={{ color: s.priority === "critical" ? "#fca5a5cc" : "#fcd34dcc" }}>{s.detail}</p>
                </div>
              </div>
            </div>
          ))}
          <div className="rounded-lg p-2.5" style={{ background: T.card, border: `1px solid ${T.border2}` }}>
            <p className="text-xs font-bold mb-1.5" style={{ color: T.text }}>Lactate Targets (SSC 2021)</p>
            {[["Preferred fluid","LR or Plasmalyte (balanced crystalloid)"],["Recheck interval","q2h if initial >2 mmol/L"],["Clearance goal","≥10% at 2 hr"],["High-risk threshold","≥4 mmol/L"],["UO target",">0.5 mL/kg/hr"]].map(([k,v]) => (
              <div key={k} className="flex justify-between text-xs py-0.5" style={{ borderBottom: `1px solid ${T.border}` }}>
                <span style={{ color: T.muted }}>{k}</span>
                <span style={{ color: T.text }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "empiric" && (
        <div className="space-y-2.5">
          <div className="rounded-lg px-3 py-2 text-xs" style={{ background: T.blue_dim, border: `1px solid ${T.blue}40`, color: T.blue }}>
            <span className="font-bold">Timing:</span> Within 1 hr of recognition. Obtain ≥2 blood culture sets before antibiotics — do not delay &gt;45 min.
          </div>
          {EMPIRIC.map((r, i) => (
            <div key={i} className="rounded-xl p-3 space-y-2" style={{ background: T.card, border: `1px solid ${T.border2}` }}>
              <p className="text-xs font-bold" style={{ color: T.bright, borderBottom: `1px solid ${T.border}`, paddingBottom: 6 }}>{r.severity}</p>
              <div className="flex items-start gap-1.5">
                <span className="text-xs font-bold flex-shrink-0" style={{ color: T.green }}>Primary:</span>
                <span className="text-xs font-mono" style={{ color: T.text }}>{r.regimen}</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-xs font-bold flex-shrink-0" style={{ color: T.blue }}>Add:</span>
                <span className="text-xs" style={{ color: T.muted }}>{r.add}</span>
              </div>
              <p className="text-xs italic" style={{ color: T.muted }}>{r.note}</p>
            </div>
          ))}
          <div className="rounded-lg px-3 py-2 text-xs" style={{ background: T.amber_dim, border: `1px solid ${T.amber}40`, color: T.amber }}>
            <span className="font-bold">De-escalation:</span> Reassess at 48–72 hr based on culture results. Narrow to targeted therapy.
          </div>
        </div>
      )}

      {tab === "criteria" && (
        <div className="space-y-2.5">
          <div className="rounded-xl p-3" style={{ background: T.card, border: `1px solid ${T.border2}` }}>
            <p className="text-xs font-bold mb-1" style={{ color: T.bright }}>Sepsis-3 Definition (2016)</p>
            <p className="text-xs mb-2" style={{ color: T.muted }}>Life-threatening organ dysfunction from dysregulated host response to infection. SOFA ≥2 from baseline + suspected infection.</p>
            <div className="rounded-lg p-2" style={{ background: T.surface }}>
              <p className="font-bold uppercase tracking-wider mb-1.5" style={{ color: T.dim, fontSize: 9 }}>qSOFA Bedside Screen (≥2 = high risk)</p>
              {[["Respiratory Rate","≥22 breaths/min"],["Altered Mental Status","GCS <15"],["Systolic BP","≤100 mmHg"]].map(([n,v],i) => (
                <div key={i} className="flex justify-between text-xs py-0.5">
                  <span style={{ color: T.muted }}>{n}</span>
                  <span className="font-mono" style={{ color: T.blue }}>{v} (+1)</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl p-3" style={{ background: T.card, border: `1px solid ${T.red}40` }}>
            <p className="text-xs font-bold mb-1" style={{ color: T.red }}>Septic Shock (Sepsis-3)</p>
            <p className="text-xs mb-2" style={{ color: T.muted }}>Sepsis + vasopressor to maintain MAP ≥65 mmHg AND lactate &gt;2 mmol/L despite fluids</p>
            <div className="grid grid-cols-3 gap-1.5">
              {[["MAP","<65 mmHg"],["Lactate",">2 mmol/L"],["Mortality",">40%"]].map(([n,v]) => (
                <div key={n} className="rounded-lg p-2 text-center" style={{ background: T.red_dim, border: `1px solid ${T.red}40` }}>
                  <div className="font-bold text-xs" style={{ color: T.red }}>{v}</div>
                  <div className="text-xs mt-0.5" style={{ color: T.muted }}>{n}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl p-3" style={{ background: T.card, border: `1px solid ${T.purple}40` }}>
            <p className="text-xs font-bold mb-1" style={{ color: T.purple }}>PHOENIX Pediatric Sepsis (JAMA 2024)</p>
            <p className="text-xs mb-2" style={{ color: T.muted }}>Score ≥2 with suspected/confirmed infection</p>
            {[["Respiratory","SpO₂/FiO₂ <292"],["Cardiovascular","Vasoactive infusion and/or lactate ≥5"],["Coagulation","INR ≥1.3, D-dimer ≥2, or Plt <100"],["Neurological","GCS ≤10 or AVPU = P/U"]].map(([d,c],i,a) => (
              <div key={d} className="flex justify-between text-xs py-1" style={{ borderBottom: i < a.length - 1 ? `1px solid ${T.purple}30` : "none" }}>
                <span className="font-semibold" style={{ color: T.purple }}>{d}</span>
                <span style={{ color: T.muted }}>{c}</span>
              </div>
            ))}
          </div>
          {/* SOFA summary */}
          <div className="rounded-xl p-3" style={{ background: T.card, border: `1px solid ${T.border2}` }}>
            <p className="text-xs font-bold mb-2" style={{ color: T.bright }}>SOFA Score Domains</p>
            {[["Respiration","PaO₂/FiO₂ ratio"],["Coagulation","Platelet count"],["Liver","Bilirubin"],["Cardiovascular","MAP or vasopressor"],["CNS","Glasgow Coma Scale"],["Renal","Creatinine or urine output"]].map(([d,c]) => (
              <div key={d} className="flex justify-between text-xs py-0.5">
                <span style={{ color: T.text }}>{d}</span>
                <span style={{ color: T.muted }}>{c}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AI Search Bar ────────────────────────────────────────────────────────────
function AISearchBar({ note, onAddMedications }) {
  const [complaint, setComplaint] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAISearch = async () => {
    if (!complaint.trim()) return;
    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a clinical pharmacist AI. Given the presenting complaint and patient context, recommend the most appropriate medications for emergency department management.

Presenting complaint: ${complaint}
Patient diagnoses: ${note.diagnoses?.join(", ") || "Not specified"}
Current medications: ${note.medications?.join(", ") || "None"}
Allergies: ${note.allergies?.join(", ") || "NKDA"}

Return 3-5 ranked medication recommendations for ER management.`,
        response_json_schema: {
          type: "object",
          properties: {
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  dose: { type: "string" },
                  route: { type: "string" },
                  priority: { type: "string", enum: ["first_line","second_line","adjunct","avoid"] },
                  rationale: { type: "string" },
                  evidence: { type: "string" }
                }
              }
            }
          }
        }
      });
      if (result.recommendations?.length) {
        onAddMedications(result.recommendations.map(r => `${r.name} ${r.dose} ${r.route} — ${r.rationale}`));
        toast.success(`Added ${result.recommendations.length} AI recommendations`);
      }
    } catch(e) { toast.error("AI search failed"); } finally { setLoading(false); }
  };

  return (
    <div className="rounded-xl p-3 relative overflow-hidden" style={{ background: T.card, border: `1px solid ${T.border2}` }}>
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, ${T.red}, ${T.amber}, ${T.teal})` }} />
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4" style={{ color: T.teal }} />
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: T.teal }}>AI Medication Recommender</span>
      </div>
      <div className="flex gap-2">
        <input
          value={complaint}
          onChange={e => setComplaint(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleAISearch()}
          placeholder="Enter presenting complaint (e.g., severe sepsis, anaphylaxis, chest pain)…"
          className="flex-1 text-xs h-9 px-3 rounded-lg outline-none"
          style={{ background: T.surface, border: `1px solid ${T.border2}`, color: T.text }}
        />
        <button
          onClick={handleAISearch}
          disabled={loading || !complaint.trim()}
          className="flex items-center gap-1.5 px-4 h-9 rounded-lg text-xs font-semibold transition-all flex-shrink-0"
          style={{ background: loading ? T.teal_dim : T.teal, color: loading ? T.teal : T.bg, opacity: !complaint.trim() ? 0.5 : 1 }}
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {loading ? "Analyzing…" : "Recommend"}
        </button>
      </div>
    </div>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────────────
const MAIN_TABS = [
  { id:"reference", label:"ER Reference", icon:Pill },
  { id:"ai",        label:"AI Assist",    icon:Sparkles },
  { id:"sepsis",    label:"Sepsis",       icon:Heart },
];

export default function MedicationsTab({ note, noteId, queryClient, isFirstTab, isLastTab, handleBack, handleNext }) {
  const [activeTab, setActiveTab] = useState("reference");
  const [activeCat, setActiveCat] = useState("all");
  const [search, setSearch] = useState("");
  const [weightKg, setWeightKg] = useState("");

  const handleAddMed = useCallback(async (med) => {
    const label = typeof med === "string" ? med : `${med.name} — ${med.adult}`;
    const updated = [...(note.medications || []), label];
    await base44.entities.ClinicalNote.update(noteId, { medications: updated });
    queryClient.invalidateQueries({ queryKey: ["note", noteId] });
    toast.success(`Added: ${typeof med === "string" ? med : med.name}`);
  }, [note, noteId, queryClient]);

  const handleAddMedications = useCallback(async (meds) => {
    const updated = [...(note.medications || []), ...meds];
    await base44.entities.ClinicalNote.update(noteId, { medications: updated });
    queryClient.invalidateQueries({ queryKey: ["note", noteId] });
  }, [note, noteId, queryClient]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return MEDICATIONS.filter(m => {
      const catMatch = activeCat === "all" || m.cat === activeCat;
      const srchMatch = !q || m.name.toLowerCase().includes(q) || m.adult.toLowerCase().includes(q);
      return catMatch && srchMatch;
    });
  }, [activeCat, search]);

  const wt = parseFloat(weightKg) || null;

  const catColor = CATEGORIES.find(c => c.id === activeCat)?.color || T.dim;

  return (
    <div className="flex flex-col h-full" style={{ background: T.bg, minHeight: "100%" }}>
      {/* Top Tab Bar */}
      <div className="flex gap-1 p-1.5 flex-shrink-0" style={{ borderBottom: `1px solid ${T.border}`, background: T.surface }}>
        {MAIN_TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
            style={activeTab === tab.id ? { background: T.teal_dim, color: T.teal, border: `1px solid ${T.teal}40` } : { background: "transparent", color: T.muted }}
          >
            <tab.icon className="w-3.5 h-3.5" />{tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
        {/* ── ER Reference: 3-column layout ── */}
        {activeTab === "reference" && (
          <div className="flex h-full" style={{ height: "calc(100vh - 140px)" }}>
            {/* LEFT: Category Nav */}
            <div className="flex-shrink-0 overflow-y-auto" style={{ width: 180, borderRight: `1px solid ${T.border}`, background: T.surface }}>
              <div className="p-2 space-y-0.5">
                {CATEGORIES.map(cat => (
                  <button key={cat.id} onClick={() => setActiveCat(cat.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all text-left"
                    style={activeCat === cat.id
                      ? { background: `${cat.color}20`, color: cat.color, borderLeft: `3px solid ${cat.color}` }
                      : { background: "transparent", color: T.muted, borderLeft: "3px solid transparent" }
                    }
                  >
                    <cat.icon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate font-medium">{cat.label}</span>
                  </button>
                ))}
                {/* Sepsis quick jump */}
                <div className="pt-2 mt-2" style={{ borderTop: `1px solid ${T.border}` }}>
                  <button onClick={() => setActiveTab("sepsis")}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                    style={{ background: T.red_dim, color: T.red, border: `1px solid ${T.red}30` }}
                  >
                    <Heart className="w-3.5 h-3.5" />→ Sepsis Protocol
                  </button>
                </div>
              </div>
            </div>

            {/* CENTER: Med List */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              {/* Disclaimer + Search */}
              <div className="p-3 flex-shrink-0 space-y-2" style={{ borderBottom: `1px solid ${T.border}` }}>
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg" style={{ background: T.amber_dim, border: `1px solid ${T.amber}30` }}>
                  <AlertTriangle className="w-3 h-3 flex-shrink-0" style={{ color: T.amber }} />
                  <p className="text-xs" style={{ color: T.amber }}>Clinical decision support only. Verify all doses independently.</p>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: T.muted }} />
                    <input placeholder="Search medications…" value={search} onChange={e => setSearch(e.target.value)}
                      className="w-full pl-8 pr-8 text-xs h-8 rounded-lg outline-none"
                      style={{ background: T.surface, border: `1px solid ${T.border2}`, color: T.text }} />
                    {search && <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: T.muted }}><X className="w-3 h-3" /></button>}
                  </div>
                  <div className="relative flex-shrink-0" style={{ width: 110 }}>
                    <Baby className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color: T.teal }} />
                    <input type="number" placeholder="kg" value={weightKg} onChange={e => setWeightKg(e.target.value)}
                      className="w-full pl-7 text-xs h-8 rounded-lg outline-none"
                      style={{ background: T.surface, border: `1px solid ${T.teal}40`, color: T.text }}
                      title="Enter weight for peds dose calc" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs" style={{ color: T.muted }}>{filtered.length} medication{filtered.length !== 1 ? "s" : ""} · <span style={{ color: catColor }}>{CATEGORIES.find(c=>c.id===activeCat)?.label}</span></p>
                  {wt && <p className="text-xs font-semibold" style={{ color: T.teal }}><Baby className="inline w-3 h-3 mr-1" />Peds doses for {wt} kg</p>}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {filtered.length === 0
                  ? <p className="text-center py-10 text-xs" style={{ color: T.muted }}>No medications found</p>
                  : filtered.map(med => {
                      const cat = CATEGORIES.find(c => c.id === med.cat);
                      return <MedCard key={med.id} med={med} catColor={cat?.color || T.dim} onAdd={handleAddMed} weightKg={wt} />;
                    })
                }
              </div>
            </div>

            {/* RIGHT: Ped Calc + Current Meds */}
            <div className="flex-shrink-0 overflow-y-auto p-3 space-y-4" style={{ width: 280, borderLeft: `1px solid ${T.border}`, background: T.surface }}>
              <PedCalcPanel />

              {/* Current Meds */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: T.muted, fontSize: 9 }}>Current Meds on Note ({note.medications?.length || 0})</p>
                {note.medications?.length > 0 ? (
                  <div className="space-y-1">
                    {note.medications.map((m, i) => (
                      <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                        <span className="w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: T.blue_dim, color: T.blue, fontSize: 9 }}>{i+1}</span>
                        <span className="flex-1 truncate" style={{ color: T.text }}>{m}</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-xs" style={{ color: T.muted }}>None documented</p>}
              </div>
            </div>
          </div>
        )}

        {/* ── AI Assist ── */}
        {activeTab === "ai" && (
          <div className="p-4 space-y-4 overflow-y-auto" style={{ height: "calc(100vh - 140px)" }}>
            <AISearchBar note={note} onAddMedications={handleAddMedications} />
            <div className="rounded-xl overflow-hidden" style={{ background: T.card, border: `1px solid ${T.border2}`, borderLeft: `4px solid ${T.blue}` }}>
              <div className="px-4 py-2.5 flex items-center gap-2" style={{ borderBottom: `1px solid ${T.border}` }}>
                <Sparkles className="w-4 h-4" style={{ color: T.blue }} />
                <span className="text-sm font-semibold" style={{ color: T.text }}>AI Recommendations from Note Context</span>
              </div>
              <div className="p-4">
                <MedicationRecommendations note={note} onAddMedications={handleAddMedications} />
              </div>
            </div>
            {/* Interaction Check */}
            {note.medications?.length >= 2 && <DrugInteractionPanel note={note} />}
          </div>
        )}

        {/* ── Sepsis ── */}
        {activeTab === "sepsis" && (
          <div className="p-4 overflow-y-auto" style={{ height: "calc(100vh - 140px)" }}>
            <SepsisPanel />
          </div>
        )}
      </div>

      {/* Footer Nav */}
      <div className="flex-shrink-0 flex justify-between items-center px-4 py-2" style={{ borderTop: `1px solid ${T.border}`, background: T.surface }}>
        <div className="flex gap-2">
          <TabDataPreview tabId="medications" note={note} />
          <ClinicalNotePreviewButton note={note} />
        </div>
        <div className="flex items-center gap-1.5">
          {!isFirstTab() && (
            <button onClick={handleBack} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
              style={{ background: T.surface, color: T.muted, border: `1px solid ${T.border2}` }}
              onMouseEnter={e => e.currentTarget.style.color = T.text}
              onMouseLeave={e => e.currentTarget.style.color = T.muted}
            ><ArrowLeft className="w-3.5 h-3.5" /> Back</button>
          )}
          {!isLastTab() && (
            <button onClick={handleNext} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
              style={{ background: T.teal_dim, color: T.teal, border: `1px solid ${T.teal}40` }}
              onMouseEnter={e => { e.currentTarget.style.background = T.teal; e.currentTarget.style.color = T.bg; }}
              onMouseLeave={e => { e.currentTarget.style.background = T.teal_dim; e.currentTarget.style.color = T.teal; }}
            >Next <ArrowLeft className="w-3.5 h-3.5 rotate-180" /></button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Drug Interaction Panel (inlined) ────────────────────────────────────────
function DrugInteractionPanel({ note }) {
  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(false);

  const check = async () => {
    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze drug-drug interactions for: ${note.medications.join(", ")}. Return only clinically significant interactions.`,
        response_json_schema: { type:"object", properties:{ interactions:{ type:"array", items:{ type:"object", properties:{ drug_pair:{type:"string"}, severity:{type:"string",enum:["mild","moderate","severe"]}, mechanism:{type:"string"}, recommendation:{type:"string"} } } } } }
      });
      setInteractions(result.interactions || []);
      if (!result.interactions?.length) toast.success("No significant interactions found");
    } catch(e) { toast.error("Failed"); } finally { setLoading(false); }
  };

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: T.card, border: `1px solid ${T.border2}`, borderLeft: `4px solid ${T.orange}` }}>
      <div className="px-4 py-2.5 flex items-center justify-between" style={{ borderBottom: `1px solid ${T.border}` }}>
        <span className="text-sm font-semibold" style={{ color: T.text }}>Drug Interaction Check</span>
        {!loading
          ? <button onClick={check} className="flex items-center gap-1 text-xs px-2.5 h-6 rounded font-semibold transition-all"
              style={{ border:`1px solid ${T.orange}40`, color:T.orange, background:"transparent" }}
              onMouseEnter={e=>{e.currentTarget.style.background=T.orange;e.currentTarget.style.color=T.bg;}}
              onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=T.orange;}}
            ><Sparkles className="w-3 h-3"/>Check</button>
          : <Loader2 className="w-4 h-4 animate-spin" style={{color:T.orange}} />
        }
      </div>
      {interactions.length > 0 && (
        <div className="p-3 space-y-2">
          {interactions.map((ix, idx) => {
            const c = {severe:{bg:T.red_dim,border:`${T.red}50`,text:"#fca5a5"},moderate:{bg:T.amber_dim,border:`${T.amber}50`,text:"#fcd34d"},mild:{bg:T.blue_dim,border:`${T.blue}50`,text:T.blue}}[ix.severity]||{bg:T.surface,border:T.border,text:T.muted};
            return (
              <div key={idx} className="rounded-lg px-3 py-2 flex gap-2" style={{background:c.bg,border:`1px solid ${c.border}`}}>
                <div className="flex-1">
                  <p className="text-xs font-semibold" style={{color:T.text}}>{ix.drug_pair}</p>
                  <p className="text-xs" style={{color:T.muted}}>{ix.mechanism}</p>
                  <p className="text-xs italic" style={{color:T.muted}}>{ix.recommendation}</p>
                </div>
                <span className="text-xs px-1.5 py-0.5 rounded font-mono uppercase flex-shrink-0" style={{color:c.text,background:c.border}}>{ix.severity}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}