import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

// ── Theme ──────────────────────────────────────────────────────────────────
const T = {
  navy:"#050f1e", slate:"#0b1d35", panel:"#0d2240", edge:"#162d4f",
  border:"#1e3a5f", muted:"#2a4d72", dim:"#4a7299", text:"#c8ddf0",
  bright:"#e8f4ff", teal:"#00d4bc", amber:"#f5a623", red:"#ff5c6c",
  green:"#2ecc71", purple:"#9b6dff", blue:"#4a90d9",
};

// ── DRUG DATABASE ──────────────────────────────────────────────────────────
const DRUG_DATA = [
  // RESUSCITATION
  { id:'epi-arrest', name:'Epinephrine', indication:'Cardiac Arrest', category:'resuscitation', setting:'er', critical:true,
    route:'IV / IO', repeat:'q3–5 min',
    doses:[{ dosePerKg:0.01, unit:'mg', maxDose:1, label:'Standard' }],
    concentration:0.1, concLabel:'0.1 mg/mL (1:10,000)',
    note:'ET route: 0.1 mg/kg of 1:1,000 diluted in 3–5 mL NS. Give rapid IV push followed by 5 mL NS flush.',
    warning:'Confirm 1:10,000 concentration for IV/IO. 1:1,000 is 10× more concentrated.' },
  { id:'epi-ana', name:'Epinephrine', indication:'Anaphylaxis / Croup', category:'resuscitation', critical:true,
    route:'IM (anterolateral thigh)', repeat:'q5–15 min PRN',
    doses:[{ dosePerKg:0.01, unit:'mg', maxDose:0.5, label:'IM' }],
    concentration:1.0, concLabel:'1 mg/mL (1:1,000)',
    note:'Preferred site: anterolateral thigh. May repeat q5–15 min. Racemic epinephrine neb: 0.5 mL/kg of 2.25% (max 3 mL) for croup.',
    warning:null },
  { id:'adenosine', name:'Adenosine', indication:'SVT', category:'resuscitation', critical:true,
    route:'IV (rapid push + flush)', repeat:'May double and repeat ×1',
    doses:[
      { dosePerKg:0.1, unit:'mg', maxDose:6, label:'1st Dose' },
      { dosePerKg:0.2, unit:'mg', maxDose:12, label:'2nd Dose' }
    ],
    concentration:3.0, concLabel:'3 mg/mL',
    note:'Must be given RAPID IV push at most proximal site, immediately followed by 5–10 mL NS flush. Half-life 10 seconds.',
    warning:'Do NOT use for irregular/wide complex tachycardia. Pre-warn patient of transient chest pressure/flushing.' },
  { id:'atropine', name:'Atropine', indication:'Bradycardia / Pre-intubation', category:'resuscitation', critical:false,
    route:'IV / IO / ET', repeat:'q3–5 min (max 3 doses)',
    doses:[{ dosePerKg:0.02, unit:'mg', minDose:0.1, maxDose:0.5, label:'Standard' }],
    concentration:0.1, concLabel:'0.1 mg/mL',
    note:'Minimum dose 0.1 mg to avoid paradoxical bradycardia. Adolescent/adult max: 1 mg.',
    warning:'Minimum dose 0.1 mg — paradoxical bradycardia if subtherapeutic dose given.' },
  { id:'amiodarone', name:'Amiodarone', indication:'V-Fib / Pulseless V-Tach', category:'resuscitation', critical:true,
    route:'IV / IO (rapid for arrest)', repeat:'May repeat to 15 mg/kg total',
    doses:[{ dosePerKg:5, unit:'mg', maxDose:300, label:'Loading' }],
    concentration:50, concLabel:'50 mg/mL',
    note:'Pulseless arrest: rapid IV bolus. Perfusing V-tach: infuse over 20–60 min. Monitor for hypotension and bradycardia.',
    warning:'Dilute in D5W for infusion. May cause hypotension if given too rapidly.' },
  { id:'bicarb', name:'Sodium Bicarbonate', indication:'Severe Metabolic Acidosis', category:'resuscitation', critical:false,
    route:'IV / IO (slow push)', repeat:'Reassess ABG before repeat',
    doses:[{ dosePerKg:1, unit:'mEq', maxDose:50, label:'Standard' }],
    concentration:1.0, concLabel:'1 mEq/mL (8.4%)',
    note:'Give slowly over 1–2 min. Dilute 1:1 with sterile water in neonates/infants. Flush IV line before/after.',
    warning:'Do NOT mix with calcium. Incompatible with many drugs. Flush line well.' },
  { id:'calcium', name:'Calcium Chloride', indication:'Hypocalcemia / Hyperkalemia / CCB OD', category:'resuscitation', critical:true,
    route:'IV / IO (central preferred)', repeat:'May repeat in 10 min',
    doses:[{ dosePerKg:20, unit:'mg', maxDose:1000, label:'10% solution' }],
    concentration:100, concLabel:'100 mg/mL (10%)',
    note:'Calcium chloride preferred in arrest — 3× more elemental calcium than gluconate. Must use central line if possible — vesicant.',
    warning:'Severe tissue necrosis if extravasation. Use central access. Do NOT mix with bicarb.' },

  // RSI / AIRWAY
  { id:'ketamine-rsi', name:'Ketamine', indication:'RSI / Sedation (IV)', category:'rsi', critical:false,
    route:'IV', repeat:'Single dose for RSI',
    doses:[{ dosePerKg:1.5, unit:'mg', maxDose:200, label:'IV Dissociative' }],
    concentration:10, concLabel:'10 mg/mL',
    note:'Onset 30–60 sec. Duration 10–15 min. Maintains airway reflexes and respiratory drive.',
    warning:null },
  { id:'ketamine-im', name:'Ketamine', indication:'RSI / Sedation (IM)', category:'rsi', critical:false,
    route:'IM', repeat:'Single dose',
    doses:[{ dosePerKg:4, unit:'mg', maxDose:400, label:'IM Dissociative' }],
    concentration:50, concLabel:'50 mg/mL',
    note:'IM onset 3–5 min, duration 20–30 min. Use when IV access unavailable.',
    warning:null },
  { id:'rocuronium', name:'Rocuronium', indication:'RSI — Neuromuscular Blockade', category:'rsi', critical:true,
    route:'IV / IO (rapid push)', repeat:'Non-depolarizing — sugammadex reversal available',
    doses:[{ dosePerKg:1.0, unit:'mg', maxDose:100, label:'RSI dose' }],
    concentration:10, concLabel:'10 mg/mL',
    note:'Onset 45–60 sec at 1.2 mg/kg. Duration 30–60 min. Sugammadex reversal: 16 mg/kg IV for immediate reversal.',
    warning:'Ensure BVM ready. No reversal available at bedside without sugammadex.' },
  { id:'succinylcholine', name:'Succinylcholine', indication:'RSI — Depolarizing NMBA', category:'rsi', critical:true,
    route:'IV / IO (rapid push)', repeat:'Single dose only — depolarizing',
    doses:[{ dosePerKg:2.0, unit:'mg', maxDose:150, label:'<10 kg (infant)' }],
    concentration:20, concLabel:'20 mg/mL',
    note:'Infants/children <10 kg: 2 mg/kg. Children ≥10 kg: 1–1.5 mg/kg. Onset 30–60 sec, duration 8–10 min. No reversal.',
    warning:'CONTRAINDICATED: hyperkalemia, crush injury >72h, denervation, myopathies, personal/family hx malignant hyperthermia.' },
  { id:'midazolam-rsi', name:'Midazolam', indication:'Pre-intubation / Co-induction', category:'rsi', critical:false,
    route:'IV', repeat:'Single dose',
    doses:[{ dosePerKg:0.1, unit:'mg', maxDose:5, label:'IV pre-intubation' }],
    concentration:1, concLabel:'1 mg/mL (diluted)',
    note:'Co-induction with ketamine reduces hemodynamic effects. Blunts laryngoscopy response.',
    warning:null },

  // SEDATION / ANALGESIA
  { id:'ketamine-sub', name:'Ketamine', indication:'Sub-dissociative Analgesia', category:'sedation', critical:false,
    route:'IV (slow over 15 min)', repeat:'q15–20 min PRN',
    doses:[{ dosePerKg:0.3, unit:'mg', maxDose:30, label:'Sub-dissociative' }],
    concentration:10, concLabel:'10 mg/mL',
    note:'0.2–0.5 mg/kg IV over 15 min for analgesia without full dissociation.',
    warning:null },
  { id:'fentanyl', name:'Fentanyl', indication:'Pain / Procedural Sedation', category:'sedation', critical:false,
    route:'IV / IN', repeat:'q30–60 min PRN',
    doses:[{ dosePerKg:1.0, unit:'mcg', maxDose:100, label:'Standard analgesic' }],
    concentration:0.05, concLabel:'50 mcg/mL (0.05 mg/mL)',
    note:'IN dose: 1.5–2 mcg/kg (max 100 mcg) — atomize 0.3 mL/naris. IV onset 2 min.',
    warning:'Rapid IV push of large doses → chest wall rigidity. Give slow. Have naloxone available.' },
  { id:'morphine', name:'Morphine', indication:'Moderate-Severe Pain', category:'sedation', critical:false,
    route:'IV / IM / SC', repeat:'q2–4h PRN',
    doses:[{ dosePerKg:0.1, unit:'mg', maxDose:5, label:'Standard' }],
    concentration:4, concLabel:'4 mg/mL',
    note:'Onset 5–10 min IV. Titrate to effect. Consider antiemetic.',
    warning:null },
  { id:'lorazepam', name:'Lorazepam', indication:'Seizure / Anxiolysis', category:'sedation', critical:false,
    route:'IV / IO / IM / IN', repeat:'May repeat ×1 after 5 min',
    doses:[{ dosePerKg:0.1, unit:'mg', maxDose:4, label:'Seizure / sedation' }],
    concentration:2, concLabel:'2 mg/mL',
    note:'IN: 0.1 mg/kg (max 4 mg) atomized. Onset IV: 2–3 min. Duration 4–8h.',
    warning:'Respiratory depression — have bag-mask ventilation immediately available.' },
  { id:'midazolam-seiz', name:'Midazolam', indication:'Seizure / Procedural Sedation', category:'sedation', critical:false,
    route:'IN / IM / IV / Buccal', repeat:'May repeat ×1 after 5 min',
    doses:[{ dosePerKg:0.2, unit:'mg', maxDose:10, label:'IN / IM' }],
    concentration:5, concLabel:'5 mg/mL (for IN use)',
    note:'IN: 0.2 mg/kg atomized (0.1 mL/kg per naris, max 1 mL/naris). IV: 0.05–0.1 mg/kg. Fastest non-IV route for seizure rescue.',
    warning:'Monitor O2 sat. Respiratory depression risk especially if combined with opioids or barbiturates.' },

  // SEIZURE
  { id:'diazepam', name:'Diazepam', indication:'Seizure (Rectal)', category:'seizure', critical:false,
    route:'PR (rectal)', repeat:'May repeat in 5–10 min ×1',
    doses:[{ dosePerKg:0.5, unit:'mg', maxDose:20, label:'Rectal' }],
    concentration:5, concLabel:'5 mg/mL',
    note:'Rectal diazepam gel (Diastat) for out-of-hospital seizure. In-hospital use IV lorazepam preferred.',
    warning:null },
  { id:'levetiracetam', name:'Levetiracetam', indication:'Status Epilepticus (2nd line)', category:'seizure', critical:false,
    route:'IV (infuse over 15 min)', repeat:'Once; then maintenance',
    doses:[{ dosePerKg:40, unit:'mg', maxDose:3000, label:'Loading dose' }],
    concentration:100, concLabel:'100 mg/mL (dilute to 5 mg/mL)',
    note:'Dilute in NS. Infuse over 15 minutes. Fewer drug interactions than phenytoin.',
    warning:null },
  { id:'phenobarbital', name:'Phenobarbital', indication:'Status Epilepticus (2nd–3rd line)', category:'seizure', critical:false,
    route:'IV (slow infusion)', repeat:'Once; reassess',
    doses:[{ dosePerKg:20, unit:'mg', maxDose:1000, label:'Loading dose' }],
    concentration:65, concLabel:'65 mg/mL (dilute)',
    note:'Infuse at max 1 mg/kg/min over 20–30 min. Monitor for respiratory depression and hypotension.',
    warning:'Significant respiratory depression — especially when combined with benzodiazepines. Prepare for intubation.' },
  { id:'fosphenytoin', name:'Fosphenytoin', indication:'Status Epilepticus (2nd–3rd line)', category:'seizure', critical:false,
    route:'IV / IM', repeat:'Once; maintenance 4–8h later',
    doses:[{ dosePerKg:20, unit:'PE', maxDose:1500, label:'Loading (PE/kg)' }],
    concentration:50, concLabel:'50 mg PE/mL',
    note:'Dose expressed in Phenytoin Equivalents (PE). Max infusion rate: 3 mg PE/kg/min.',
    warning:'Monitor ECG, BP during infusion. May cause hypotension, bradycardia, cardiac arrhythmia if given too fast.' },

  // RESPIRATORY
  { id:'albuterol', name:'Albuterol', indication:'Bronchospasm / Asthma', category:'respiratory', critical:false,
    route:'Nebulized (or MDI + spacer)', repeat:'q20 min ×3, then q1–4h',
    doses:[{ dosePerKg:0.15, unit:'mg', minDose:2.5, maxDose:5, label:'Neb dose' }],
    concentration:5, concLabel:'5 mg/mL (0.5%)',
    note:'Dilute to total 3 mL with NS. Severe asthma: continuous neb 0.5 mg/kg/hr (max 20 mg/hr).',
    warning:null },
  { id:'dexamethasone', name:'Dexamethasone', indication:'Croup / Asthma / Anti-inflammatory', category:'respiratory', critical:false,
    route:'PO / IM / IV', repeat:'Single dose (croup); q6h (asthma)',
    doses:[{ dosePerKg:0.6, unit:'mg', maxDose:16, label:'Croup/Asthma' }],
    concentration:4, concLabel:'4 mg/mL',
    note:'Croup: single dose PO 0.6 mg/kg, onset 2h. Asthma: single-dose dex equivalent to 5d prednisolone.',
    warning:null },
  { id:'magnesium', name:'Magnesium Sulfate', indication:'Severe Asthma / Anti-arrhythmic', category:'respiratory', critical:false,
    route:'IV (infuse over 20–30 min)', repeat:'Single dose',
    doses:[{ dosePerKg:40, unit:'mg', maxDose:2000, label:'Bronchospasm' }],
    concentration:500, concLabel:'500 mg/mL (50%) — dilute to 20–40 mg/mL',
    note:'Dilute 50% solution before use. Infuse over 20–30 min. Also used for Torsades: 25–50 mg/kg IV rapid.',
    warning:'Must dilute 50% solution before administration. Rapid infusion → hypotension, bradycardia.' },
  { id:'ipratropium', name:'Ipratropium', indication:'Severe Asthma (adjunct)', category:'respiratory', critical:false,
    route:'Nebulized (fixed dose)', repeat:'q20 min ×3 (first 1h only)',
    doses:[{ dosePerKg:0, unit:'mcg', maxDose:null, fixedDose:true, label:'Fixed dose' }],
    concentration:0.2, concLabel:'0.2 mg/mL (0.02%)',
    note:'Fixed dosing: <20 kg → 250 mcg (1.25 mL); ≥20 kg → 500 mcg (2.5 mL). Combine with albuterol neb.',
    warning:null },

  // ANTIBIOTICS
  { id:'ceftriaxone', name:'Ceftriaxone', indication:'Sepsis / Meningitis / General', category:'antibiotics', critical:false,
    route:'IV / IM', repeat:'q12–24h',
    doses:[
      { dosePerKg:50, unit:'mg', maxDose:2000, label:'Standard (50 mg/kg)' },
      { dosePerKg:100, unit:'mg', maxDose:4000, label:'Meningitis (100 mg/kg)' }
    ],
    concentration:100, concLabel:'100 mg/mL (reconstituted)',
    note:'Standard: 50 mg/kg IV q24h (max 2g). Meningitis/severe: 100 mg/kg/day divided q12h (max 4g/day).',
    warning:'Do NOT give IV calcium simultaneously (neonates < 28 days). Jaundiced neonates: avoid.' },
  { id:'vancomycin', name:'Vancomycin', indication:'MRSA / Gram-positive Sepsis', category:'antibiotics', critical:false,
    route:'IV (infuse over 1h)', repeat:'q6h',
    doses:[{ dosePerKg:15, unit:'mg', maxDose:750, label:'Per dose' }],
    concentration:5, concLabel:'5 mg/mL (after dilution)',
    note:'Daily dose 40–60 mg/kg/day divided q6h. Infuse over at least 1h to prevent red man syndrome. Target AUC/MIC 400–600.',
    warning:'Infuse over ≥60 min. Red man syndrome if too rapid (not true allergy). Monitor troughs/AUC.' },
  { id:'ampicillin', name:'Ampicillin', indication:'Sepsis / Meningitis / Listeria', category:'antibiotics', critical:false,
    route:'IV', repeat:'q6h (q4h for meningitis)',
    doses:[
      { dosePerKg:50, unit:'mg', maxDose:2000, label:'Sepsis (q6h)' },
      { dosePerKg:75, unit:'mg', maxDose:3000, label:'Meningitis (q4–6h)' }
    ],
    concentration:100, concLabel:'100 mg/mL (reconstituted)',
    note:'Meningitis dose: 200–400 mg/kg/day divided q4–6h (max 12g/day). Neonates: empiric coverage for GBS and Listeria.',
    warning:null },
  { id:'acyclovir', name:'Acyclovir', indication:'HSV Encephalitis / Neonatal HSV', category:'antibiotics', critical:true,
    route:'IV (infuse over 1 hour)', repeat:'q8h',
    doses:[{ dosePerKg:20, unit:'mg', maxDose:800, label:'Encephalitis' }],
    concentration:5, concLabel:'5 mg/mL (after dilution)',
    note:'HSV encephalitis: 20 mg/kg/dose q8h. Neonatal HSV: 20 mg/kg q8h. Infuse over 1 hour.',
    warning:'IV hydration mandatory during infusion. Nephrotoxic if given too fast. Adjust for renal impairment.' },

  // OTHER / GI / FLUIDS
  { id:'ondansetron', name:'Ondansetron', indication:'Nausea / Vomiting', category:'other', critical:false,
    route:'IV / IM / PO / ODT', repeat:'q8h PRN',
    doses:[{ dosePerKg:0.15, unit:'mg', maxDose:4, label:'Standard' }],
    concentration:2, concLabel:'2 mg/mL',
    note:'PO/ODT: same dose as IV. <6 months: 0.1 mg/kg. Max 4 mg/dose IV. Onset IV 5–10 min.',
    warning:null },
  { id:'acetaminophen', name:'Acetaminophen', indication:'Pain / Fever', category:'other', critical:false,
    route:'IV / PO / PR', repeat:'q6h (IV/PO), q6–8h (PR)',
    doses:[{ dosePerKg:15, unit:'mg', maxDose:1000, label:'Standard dose' }],
    concentration:10, concLabel:'10 mg/mL (IV Ofirmev)',
    note:'PO: 10–15 mg/kg q4–6h (max 5 doses/24h). IV: 15 mg/kg q6h (<50 kg). Daily max: 75 mg/kg/day (max 4000 mg/day).',
    warning:'Daily max 75 mg/kg/day (<50 kg) or 4g/day. Account for all sources (combination products).' },
  { id:'ibuprofen', name:'Ibuprofen', indication:'Pain / Fever / Anti-inflammatory', category:'other', critical:false,
    route:'PO', repeat:'q6–8h PRN',
    doses:[{ dosePerKg:10, unit:'mg', maxDose:600, label:'Antipyretic/analgesic' }],
    concentration:20, concLabel:'20 mg/mL (100 mg/5 mL)',
    note:'Antipyretic: 5–10 mg/kg. Anti-inflammatory: 10 mg/kg. Max 40 mg/kg/day (max 2400 mg/day). Give with food.',
    warning:'AVOID <6 months of age, dehydration, renal impairment, active GI bleed.' },
  { id:'dextrose', name:'Dextrose', indication:'Hypoglycemia', category:'other', critical:false,
    route:'IV / IO (slow push)', repeat:'Recheck BG 15 min after',
    doses:[{ dosePerKg:0.5, unit:'g', maxDose:25, label:'Glucose repletion' }],
    concentration:0.1, concLabel:'D10W = 0.1 g/mL',
    note:'D10W (preferred): 5 mL/kg. D25W: 2 mL/kg (>1 month). D50W: 1 mL/kg (adolescents). Neonates: D10W 2 mL/kg.',
    warning:'Neonates: D10W only (D50/D25 hyperosmolar). Use D25 or D50 diluted for infants/children only.' },

  // ── OUTPATIENT / PO MEDICATIONS ──────────────────────────────────────────
  { id:'amox-po', name:'Amoxicillin', indication:'AOM / Pharyngitis / Mild CAP', category:'antibiotics', setting:'outpatient', critical:false,
    route:'PO', repeat:'q8–12h × 5–10 days',
    doses:[
      { dosePerKg:45, unit:'mg', maxDose:1500, label:'AOM high-dose (q12h)' },
      { dosePerKg:25, unit:'mg', maxDose:500, label:'Standard (q8h)' }
    ],
    concentration:80, concLabel:'400 mg/5 mL (80 mg/mL)',
    note:'AOM (high-dose): 90 mg/kg/day ÷ q12h (max 3g/day). Pharyngitis: 50 mg/kg once daily × 10d (max 1g). Mild CAP: 90 mg/kg/day.',
    warning:null },
  { id:'augmentin-po', name:'Amoxicillin-Clavulanate', indication:'AOM / Sinusitis / Bite Wounds', category:'antibiotics', setting:'outpatient', critical:false,
    route:'PO', repeat:'q12h × 7–10 days',
    doses:[{ dosePerKg:45, unit:'mg', maxDose:875, label:'Amox component (q12h)' }],
    concentration:80, concLabel:'400/57 mg per 5 mL (80 mg amox/mL)',
    note:'AOM high-risk: 90 mg/kg/day (amox component) divided q12h. Use 14:1 ratio formulation to limit GI effects. Max 875 mg/dose.',
    warning:'Diarrhea common. Avoid if mononucleosis (EBV) suspected.' },
  { id:'azithro-po', name:'Azithromycin', indication:'CAP / Pharyngitis (PCN allergy)', category:'antibiotics', setting:'outpatient', critical:false,
    route:'PO', repeat:'Once daily × 5 days',
    doses:[
      { dosePerKg:10, unit:'mg', maxDose:500, label:'Day 1 dose' },
      { dosePerKg:5, unit:'mg', maxDose:250, label:'Days 2–5 dose' }
    ],
    concentration:40, concLabel:'200 mg/5 mL (40 mg/mL)',
    note:'CAP: 10 mg/kg day 1 (max 500 mg), then 5 mg/kg/day × 4 days (max 250 mg). Pharyngitis (PCN allergy): 12 mg/kg/day × 5 days (max 500 mg).',
    warning:'QT prolongation risk. Avoid in significant hepatic disease.' },
  { id:'cephalexin-po', name:'Cephalexin', indication:'Skin / Soft Tissue / UTI', category:'antibiotics', setting:'outpatient', critical:false,
    route:'PO', repeat:'q6–8h × 7–10 days',
    doses:[{ dosePerKg:25, unit:'mg', maxDose:500, label:'Per dose' }],
    concentration:50, concLabel:'250 mg/5 mL (50 mg/mL)',
    note:'SSTI: 25–50 mg/kg/day ÷ q6–8h (max 4g/day). UTI: 25–50 mg/kg/day ÷ q6h. Step-down therapy for osteomyelitis (MSSA confirmed).',
    warning:null },
  { id:'tmpsmx-po', name:'TMP-SMX', indication:'UTI / MRSA SSTI / PCP', category:'antibiotics', setting:'outpatient', critical:false,
    route:'PO', repeat:'q12h × 3–7 days',
    doses:[{ dosePerKg:4, unit:'mg', maxDose:160, label:'TMP component per dose' }],
    concentration:8, concLabel:'40 mg TMP/5 mL (8 mg TMP/mL)',
    note:'UTI/MRSA SSTI: 8–10 mg TMP/kg/day ÷ q12h. Per dose = 4–5 mg/kg TMP. PCP treatment: 5 mg/kg TMP q6h.',
    warning:'Avoid <2 months, sulfa allergy, G6PD deficiency, CrCl <30 mL/min.' },
  { id:'clindamycin-po', name:'Clindamycin', indication:'MRSA SSTI / Streptococcal Infection', category:'antibiotics', setting:'outpatient', critical:false,
    route:'PO', repeat:'q8h × 7–10 days',
    doses:[{ dosePerKg:10, unit:'mg', maxDose:300, label:'Per dose' }],
    concentration:15, concLabel:'75 mg/5 mL (15 mg/mL)',
    note:'SSTI (MRSA/Strep): 30–40 mg/kg/day ÷ q8h (max 1800 mg/day). Check D-zone test for inducible clindamycin resistance before use.',
    warning:'C. diff risk with prolonged use. Confirm D-zone test negative before starting.' },
  { id:'prednisolone-po', name:'Prednisolone', indication:'Asthma Exacerbation / Croup', category:'respiratory', setting:'outpatient', critical:false,
    route:'PO', repeat:'Once daily × 3–5 days',
    doses:[{ dosePerKg:1, unit:'mg', maxDose:40, label:'Daily dose' }],
    concentration:3, concLabel:'15 mg/5 mL (3 mg/mL)',
    note:'Asthma exacerbation: 1–2 mg/kg/day (max 40–60 mg) × 3–5 days. Croup: dexamethasone 0.6 mg/kg PO × 1 dose is preferred alternative.',
    warning:null },
  { id:'dexamethasone-croup-po', name:'Dexamethasone (Croup)', indication:'Croup — Single PO Dose', category:'respiratory', setting:'outpatient', critical:false,
    route:'PO / IM', repeat:'Single dose',
    doses:[{ dosePerKg:0.6, unit:'mg', maxDose:16, label:'Croup dose' }],
    concentration:4, concLabel:'1 mg/mL (oral) / 4 mg/mL (injectable)',
    note:'0.6 mg/kg × 1 dose PO or IM (max 16 mg). Onset of benefit 2 hours. Superior to nebulized budesonide for croup. 0.15 mg/kg may be equally effective.',
    warning:null },
  { id:'diphenhydramine-po', name:'Diphenhydramine', indication:'Allergic Reaction / Urticaria', category:'other', setting:'outpatient', critical:false,
    route:'PO / IV / IM', repeat:'q6h PRN',
    doses:[{ dosePerKg:1.25, unit:'mg', maxDose:50, label:'Per dose' }],
    concentration:12.5, concLabel:'12.5 mg/5 mL syrup (2.5 mg/mL)',
    note:'1.25 mg/kg/dose (max 50 mg) q6h PRN. Use for urticaria and mild allergic reactions. Significant sedation expected.',
    warning:'Do NOT use OTC in children <2 years. Significant anticholinergic sedation.' },
  { id:'cetirizine-po', name:'Cetirizine', indication:'Allergic Rhinitis / Chronic Urticaria', category:'other', setting:'outpatient', critical:false,
    route:'PO', repeat:'Once daily',
    doses:[{ dosePerKg:0.25, unit:'mg', maxDose:10, label:'Daily dose' }],
    concentration:1, concLabel:'1 mg/mL syrup (5 mg/5 mL)',
    note:'Age-based dosing: 6 mo–2 yr: 2.5 mg/day; 2–5 yr: 2.5–5 mg/day; ≥6 yr: 5–10 mg/day. Max 10 mg/day. Non-sedating.',
    warning:null },
  { id:'oseltamivir-po', name:'Oseltamivir', indication:'Influenza Treatment / Prophylaxis', category:'other', setting:'outpatient', critical:false,
    route:'PO', repeat:'BID × 5 days (treatment)',
    doses:[{ dosePerKg:3, unit:'mg', maxDose:75, label:'Per dose (≥1 yr)' }],
    concentration:6, concLabel:'6 mg/mL suspension',
    note:'Weight-based: ≤15 kg: 30 mg BID; 15–23 kg: 45 mg BID; 23–40 kg: 60 mg BID; >40 kg: 75 mg BID. Start within 48h of symptoms. Prophylaxis: once daily × 10 days.',
    warning:null },
  { id:'ibuprofen-op', name:'Ibuprofen', indication:'Pain / Fever', category:'other', setting:'outpatient', critical:false,
    route:'PO', repeat:'q6–8h PRN',
    doses:[{ dosePerKg:10, unit:'mg', maxDose:600, label:'Antipyretic / Analgesic' }],
    concentration:20, concLabel:'100 mg/5 mL (20 mg/mL)',
    note:'Antipyretic: 5–10 mg/kg. Anti-inflammatory: 10 mg/kg. Max 40 mg/kg/day (max 2400 mg/day). Give with food or milk.',
    warning:'Avoid <6 months, dehydration, renal impairment, active GI bleed.' },
  { id:'acetaminophen-op', name:'Acetaminophen', indication:'Pain / Fever', category:'other', setting:'outpatient', critical:false,
    route:'PO / PR', repeat:'q4–6h PRN (max 5 doses/24h)',
    doses:[{ dosePerKg:15, unit:'mg', maxDose:1000, label:'Standard dose' }],
    concentration:32, concLabel:'160 mg/5 mL (32 mg/mL)',
    note:'10–15 mg/kg/dose q4–6h PO/PR. Max 75 mg/kg/day (max 4g/day). Can alternate with ibuprofen q3h for fever.',
    warning:'Daily max 75 mg/kg/day (<50 kg) or 4g/day. Account for all acetaminophen-containing products.' },
  { id:'zofran-po', name:'Ondansetron (ODT)', indication:'Nausea / Vomiting', category:'other', setting:'outpatient', critical:false,
    route:'PO / ODT', repeat:'q8h PRN',
    doses:[{ dosePerKg:0.15, unit:'mg', maxDose:8, label:'Per dose' }],
    concentration:0.8, concLabel:'4 mg ODT tablet / 4 mg/5 mL oral solution',
    note:'Weight-based: <15 kg = 2 mg; 15–30 kg = 4 mg; >30 kg = 4–8 mg. ODT dissolves under tongue — no water needed. Onset ~30 min.',
    warning:null },
];

// ── Broselow Bands ──────────────────────────────────────────────────────────
const BROSELOW = [
  { name:'Grey',   min:3,  max:5,  color:'#9ca3af', label:'3–5 kg',   age:'0–3 mo' },
  { name:'Pink',   min:6,  max:7,  color:'#ec4899', label:'6–7 kg',   age:'3–6 mo' },
  { name:'Red',    min:8,  max:9,  color:'#ef4444', label:'8–9 kg',   age:'6–9 mo' },
  { name:'Purple', min:10, max:11, color:'#a855f7', label:'10–11 kg', age:'9–18 mo' },
  { name:'Yellow', min:12, max:14, color:'#d4a017', label:'12–14 kg', age:'18 mo–3 yr' },
  { name:'White',  min:15, max:18, color:'#94a3b8', label:'15–18 kg', age:'3–5 yr' },
  { name:'Blue',   min:19, max:22, color:'#3b82f6', label:'19–22 kg', age:'5–7 yr' },
  { name:'Orange', min:23, max:29, color:'#f97316', label:'23–29 kg', age:'7–10 yr' },
  { name:'Green',  min:30, max:80, color:'#22c55e', label:'30+ kg',   age:'10+ yr' },
];

const CAT_COLORS = {
  resuscitation:'#ff5c6c', rsi:'#9b6dff', sedation:'#4a90d9',
  seizure:'#f472b6', respiratory:'#00d4bc', antibiotics:'#2ecc71', other:'#f5a623',
};
const ER_CATEGORIES = [
  { id:'all', icon:'⚡', label:'All Medications' },
  { id:'resuscitation', icon:'❤️', label:'Resuscitation' },
  { id:'rsi', icon:'💉', label:'RSI / Airway' },
  { id:'sedation', icon:'😴', label:'Sedation / Analgesia' },
  { id:'seizure', icon:'🧠', label:'Seizure' },
  { id:'respiratory', icon:'🫁', label:'Respiratory' },
  { id:'antibiotics', icon:'🧬', label:'Antibiotics' },
  { id:'other', icon:'💊', label:'Other / GI / Fluids' },
];
const OP_CATEGORIES = [
  { id:'all', icon:'⚡', label:'All Medications' },
  { id:'antibiotics', icon:'🧬', label:'Antibiotics' },
  { id:'respiratory', icon:'🫁', label:'Respiratory' },
  { id:'other', icon:'💊', label:'Other / GI / Fluids' },
];
const CAT_LABELS = {
  resuscitation:'❤️ Resuscitation', rsi:'💉 RSI / Airway', sedation:'😴 Sedation / Analgesia',
  seizure:'🧠 Seizure', respiratory:'🫁 Respiratory', antibiotics:'🧬 Antibiotics', other:'💊 Other / GI / Fluids',
};

// ── Helpers ─────────────────────────────────────────────────────────────────
function getBand(wt) {
  if (!wt) return null;
  return BROSELOW.find(b => wt >= b.min && wt <= b.max) || BROSELOW[BROSELOW.length - 1];
}

function formatNum(n) {
  if (n >= 100) return Math.round(n).toString();
  if (n >= 10)  return parseFloat(n.toFixed(1)).toString();
  if (n >= 1)   return parseFloat(n.toFixed(2)).toString();
  return parseFloat(n.toFixed(3)).toString();
}

function calcDrug(drug, weight, doseIdx = 0) {
  if (!weight) return null;
  const d = drug.doses[doseIdx] || drug.doses[0];
  if (d.fixedDose) {
    const fixedDose = weight < 20 ? 250 : 500;
    const vol = weight < 20 ? 1.25 : 2.5;
    return { dose: fixedDose, doseStr: fixedDose + ' mcg', volStr: vol.toFixed(2) + ' mL', capped: false, unit: 'mcg', minApplied: false };
  }
  let rawDose = d.dosePerKg * weight;
  let minApplied = false;
  if (d.minDose && rawDose < d.minDose) { rawDose = d.minDose; minApplied = true; }
  let capped = false;
  if (d.maxDose && rawDose > d.maxDose) { rawDose = d.maxDose; capped = true; }
  const volume = rawDose / drug.concentration;
  return { dose: rawDose, doseStr: formatNum(rawDose) + ' ' + d.unit, volStr: formatNum(volume) + ' mL', capped, minApplied, unit: d.unit, maxDose: d.maxDose, label: d.label };
}

// ── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, color, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3300);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderLeft: `3px solid ${color}`, borderRadius: 10, padding: '11px 16px', fontSize: 12.5, fontWeight: 600, color: T.bright, boxShadow: '0 8px 24px rgba(0,0,0,.3)', minWidth: 200 }}>
      {message}
    </div>
  );
}

// ── Drug Card ────────────────────────────────────────────────────────────────
function DrugCard({ drug, weight, onLog }) {
  const bandColor = getBand(weight)?.color || T.muted;
  const catColor = CAT_COLORS[drug.category] || T.dim;
  const calc0 = calcDrug(drug, weight, 0);
  const calc1 = drug.doses.length > 1 ? calcDrug(drug, weight, 1) : null;
  const noWt = !weight;
  const capped = calc0?.capped;

  let doseVal0 = noWt ? '—' : (calc0 ? calc0.doseStr : '—');
  let volVal0  = noWt ? '—' : (calc0 ? calc0.volStr : '—');
  if (drug.doses[0]?.fixedDose && !noWt) {
    doseVal0 = weight < 20 ? '250 mcg' : '500 mcg';
    volVal0  = weight < 20 ? '1.25 mL' : '2.50 mL';
  }

  const doseColor = capped ? T.amber : T.teal;
  const perKgText = drug.doses[0]?.dosePerKg ? `${drug.doses[0].dosePerKg} ${drug.doses[0].unit}/kg` : 'Fixed dose';

  return (
    <div style={{ background: T.panel, border: `1px solid ${drug.critical ? 'rgba(255,92,108,.25)' : T.border}`, borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'transform .15s, box-shadow .15s' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,.3)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
    >
      {/* Band bar */}
      <div style={{ height: 3, background: bandColor + '44' }} />

      {/* Header */}
      <div style={{ padding: '12px 14px 10px', borderBottom: `1px solid rgba(30,58,95,.5)`, background: 'rgba(22,45,79,.35)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: catColor, flexShrink: 0 }} />
          <div style={{ fontWeight: 800, fontSize: 14, color: T.bright, flex: 1 }}>{drug.name}</div>
          {drug.critical && <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.07em', padding: '2px 7px', borderRadius: 8, background: 'rgba(255,92,108,.15)', border: '1px solid rgba(255,92,108,.3)', color: T.red }}>⚡ Critical</span>}
        </div>
        <div style={{ fontSize: 10.5, color: T.dim, display: 'flex', alignItems: 'center', gap: 8 }}>
          {drug.indication}
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'rgba(74,144,217,.12)', border: '1px solid rgba(74,144,217,.25)', color: T.blue }}>{drug.route.split('/')[0].trim()}</span>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Primary dose row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div style={{ background: 'rgba(11,29,53,.6)', border: `1px solid ${T.border}`, borderRadius: 9, padding: '10px 12px' }}>
            <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.09em', color: T.dim }}>{drug.doses[0]?.label || 'Dose'}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 700, color: doseColor, lineHeight: 1.1, transition: 'color .2s' }}>{doseVal0}</div>
            <div style={{ fontSize: 10, color: T.dim, marginTop: 1 }}>
              dose
              {capped && <span style={{ marginLeft: 6, fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 5, background: 'rgba(245,166,35,.15)', border: '1px solid rgba(245,166,35,.4)', color: T.amber }}>⚠ MAX CAP</span>}
              {calc0?.minApplied && <span style={{ marginLeft: 6, fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 5, background: 'rgba(74,144,217,.1)', border: '1px solid rgba(74,144,217,.25)', color: T.blue }}>MIN DOSE</span>}
            </div>
          </div>
          <div style={{ background: 'rgba(11,29,53,.6)', border: `1px solid ${T.border}`, borderRadius: 9, padding: '10px 12px' }}>
            <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.09em', color: T.dim }}>Volume</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 700, color: T.green, lineHeight: 1.1 }}>{volVal0}</div>
            <div style={{ fontSize: 10, color: T.dim, marginTop: 1 }}>mL to draw</div>
          </div>
        </div>

        {/* Second dose row */}
        {calc1 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{ background: 'rgba(11,29,53,.6)', border: `1px solid ${T.border}`, borderRadius: 9, padding: '10px 12px' }}>
              <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.09em', color: T.dim }}>{drug.doses[1]?.label || '2nd Dose'}</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, fontWeight: 700, color: T.teal, lineHeight: 1.1 }}>{noWt ? '—' : calc1.doseStr}</div>
              <div style={{ fontSize: 10, color: T.dim, marginTop: 1 }}>dose</div>
            </div>
            <div style={{ background: 'rgba(11,29,53,.6)', border: `1px solid ${T.border}`, borderRadius: 9, padding: '10px 12px' }}>
              <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.09em', color: T.dim }}>Volume</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, fontWeight: 700, color: T.green, lineHeight: 1.1 }}>{noWt ? '—' : calc1.volStr}</div>
              <div style={{ fontSize: 10, color: T.dim, marginTop: 1 }}>mL to draw</div>
            </div>
          </div>
        )}

        {/* Meta chips */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10.5, padding: '3px 9px', borderRadius: 6, background: 'rgba(30,58,95,.6)', border: '1px solid rgba(30,58,95,.8)', color: T.purple, fontFamily: "'JetBrains Mono', monospace" }}>{drug.concLabel}</span>
          {drug.repeat && <span style={{ fontSize: 10.5, padding: '3px 9px', borderRadius: 6, background: 'rgba(30,58,95,.6)', border: '1px solid rgba(30,58,95,.8)', color: T.amber, fontFamily: "'JetBrains Mono', monospace" }}>{drug.repeat}</span>}
        </div>

        {/* Max/min */}
        {(drug.doses[0].maxDose || drug.doses[0].minDose) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
            {drug.doses[0].maxDose && <><span style={{ color: T.dim }}>Max dose:</span><span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: T.text }}>{formatNum(drug.doses[0].maxDose)} {drug.doses[0].unit}</span></>}
            {drug.doses[0].minDose && <><span style={{ color: T.dim, marginLeft: 8 }}>Min:</span><span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: T.text }}>{drug.doses[0].minDose} {drug.doses[0].unit}</span></>}
          </div>
        )}

        {/* Notes */}
        {drug.note && <div style={{ fontSize: 11, color: T.dim, lineHeight: 1.6, paddingTop: 4, borderTop: '1px solid rgba(30,58,95,.4)' }}>{drug.note}</div>}
        {drug.warning && (
          <div style={{ fontSize: 11, color: T.amber, lineHeight: 1.5, display: 'flex', gap: 6 }}>
            <span style={{ flexShrink: 0 }}>⚠️</span><span>{drug.warning}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '8px 14px', borderTop: '1px solid rgba(30,58,95,.4)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={() => onLog(drug)} style={{ fontSize: 11, fontWeight: 700, padding: '5px 10px', borderRadius: 7, background: 'rgba(0,212,188,.07)', border: '1px solid rgba(0,212,188,.2)', color: T.teal, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>＋ Log</button>
        <span style={{ fontSize: 10, color: T.muted, marginLeft: 'auto', fontFamily: "'JetBrains Mono', monospace" }}>{perKgText}</span>
      </div>
    </div>
  );
}

// ── Log Modal ────────────────────────────────────────────────────────────────
function LogModal({ onClose, onSave, prefillDrug, weight }) {
  const [drugName, setDrugName] = useState('');
  const [doseGiven, setDoseGiven] = useState('');
  const [volGiven, setVolGiven] = useState('');
  const [route, setRoute] = useState('IV');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (prefillDrug) {
      const calc = calcDrug(prefillDrug, weight);
      setDrugName(prefillDrug.name + ' (' + prefillDrug.indication + ')');
      setDoseGiven(calc ? calc.doseStr : '');
      setVolGiven(calc ? calc.volStr : '');
      setRoute(prefillDrug.route.split('/')[0].trim());
    }
  }, [prefillDrug, weight]);

  const calc = prefillDrug ? calcDrug(prefillDrug, weight) : null;

  const handleSave = () => {
    if (!drugName.trim()) return;
    onSave({ drug: drugName, dose: doseGiven, vol: volGiven, route, notes, weight, time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) });
    onClose();
  };

  const inputStyle = { background: 'rgba(22,45,79,.8)', border: `1px solid ${T.border}`, borderRadius: 8, padding: '9px 12px', fontFamily: "'DM Sans', sans-serif", fontSize: 12.5, color: T.bright, outline: 'none', width: '100%' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(6px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: T.slate, border: `1px solid ${T.border}`, borderRadius: 18, width: 520, maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '18px 22px 14px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>💊</span>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: T.bright, flex: 1 }}>Log Dose Administered</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: T.dim, fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ padding: '18px 22px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.07em', color: T.dim, marginBottom: 4 }}>Medication</div>
              <input style={inputStyle} value={drugName} onChange={e => setDrugName(e.target.value)} placeholder="e.g. Epinephrine" list="ped-drug-list" />
              <datalist id="ped-drug-list">
                {DRUG_DATA.map(d => <option key={d.id} value={d.name + ' (' + d.indication + ')'} />)}
              </datalist>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.07em', color: T.dim, marginBottom: 4 }}>Dose Given</div>
                <input style={inputStyle} value={doseGiven} onChange={e => setDoseGiven(e.target.value)} placeholder="e.g. 0.5 mg" />
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.07em', color: T.dim, marginBottom: 4 }}>Volume (mL)</div>
                <input style={inputStyle} value={volGiven} onChange={e => setVolGiven(e.target.value)} placeholder="e.g. 5 mL" />
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.07em', color: T.dim, marginBottom: 4 }}>Route</div>
              <select style={inputStyle} value={route} onChange={e => setRoute(e.target.value)}>
                {['IV','IO','IM','IN','PO','PR','ET','Nebulized'].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.07em', color: T.dim, marginBottom: 4 }}>Notes</div>
              <input style={inputStyle} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Rate, dilution, indication…" />
            </div>
            {calc && prefillDrug && (
              <div style={{ background: 'rgba(0,212,188,.07)', border: '1px solid rgba(0,212,188,.2)', borderRadius: 9, padding: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: T.teal, marginBottom: 8 }}>Current Calculated Dose</div>
                {[['Calculated Dose', calc.doseStr + (calc.capped ? ' ⚠ CAPPED' : '')], ['Calculated Volume', calc.volStr], ['Concentration', prefillDrug.concLabel]].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.text, marginBottom: 4 }}>
                    <span>{k}:</span><span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: T.teal }}>{v}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div style={{ padding: '14px 22px', borderTop: `1px solid ${T.border}`, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: 8, background: 'transparent', border: `1px solid ${T.border}`, color: T.text, cursor: 'pointer', fontSize: 12.5, fontWeight: 700 }}>Cancel</button>
          <button onClick={handleSave} style={{ padding: '9px 18px', borderRadius: 8, background: `linear-gradient(135deg, ${T.teal}, ${T.teal2})`, border: 'none', color: T.navy, cursor: 'pointer', fontSize: 12.5, fontWeight: 700 }}>💊 Log Entry</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function PediatricDosing() {
  const navigate = useNavigate();
  const [weight, setWeight] = useState(null);
  const [weightInput, setWeightInput] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [doseLog, setDoseLog] = useState(() => {
    try { return JSON.parse(localStorage.getItem('notrya-ped-log') || '[]'); } catch { return []; }
  });
  const [showLogModal, setShowLogModal] = useState(false);
  const [prefillDrug, setPrefillDrug] = useState(null);
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((msg, color = T.teal) => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, color }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  const band = getBand(weight);

  const handleWeightChange = (val) => {
    setWeightInput(val);
    const wt = parseFloat(val);
    setWeight(!isNaN(wt) && wt > 0 && wt <= 100 ? wt : null);
  };

  const saveLog = (entry) => {
    const updated = [{ ...entry, id: Date.now() }, ...doseLog];
    setDoseLog(updated);
    localStorage.setItem('notrya-ped-log', JSON.stringify(updated));
    addToast(entry.drug.split('(')[0].trim() + ' logged ✓');
  };

  const deleteLog = (id) => {
    const updated = doseLog.filter(e => e.id !== id);
    setDoseLog(updated);
    localStorage.setItem('notrya-ped-log', JSON.stringify(updated));
  };

  const openLog = (drug) => {
    setPrefillDrug(drug);
    setShowLogModal(true);
  };

  const cats = ['resuscitation','rsi','sedation','seizure','respiratory','antibiotics','other'];
  const filtered = activeCategory === 'all' ? DRUG_DATA : DRUG_DATA.filter(d => d.category === activeCategory);

  const catCountMap = {};
  cats.forEach(c => { catCountMap[c] = DRUG_DATA.filter(d => d.category === c).length; });

  // Group cards by category if showing all
  const renderCards = () => {
    if (activeCategory !== 'all') {
      return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        {filtered.map(d => <DrugCard key={d.id} drug={d} weight={weight} onLog={openLog} />)}
      </div>;
    }
    return (
      <div>
        {cats.map(cat => {
          const drugs = DRUG_DATA.filter(d => d.category === cat);
          if (!drugs.length) return null;
          return (
            <div key={cat} style={{ marginBottom: 28 }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: T.bright, paddingBottom: 8, borderBottom: `1px solid rgba(30,58,95,.5)`, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                {CAT_LABELS[cat]}
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, color: T.dim, background: 'rgba(30,58,95,.6)', padding: '2px 9px', borderRadius: 10 }}>{drugs.length}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                {drugs.map(d => <DrugCard key={d.id} drug={d} weight={weight} onLog={openLog} />)}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ background: T.navy, color: T.text, minHeight: '100vh', fontFamily: "'DM Sans', sans-serif", display: 'flex', flexDirection: 'column' }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" />

      {/* PAGE HEADER */}
      <div style={{ padding: '14px 24px 12px', borderBottom: `1px solid rgba(30,58,95,.6)`, background: 'rgba(11,29,53,.4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={() => navigate(createPageUrl('DrugsBugs'))} style={{ padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: 'transparent', border: `1px solid ${T.border}`, color: T.dim, display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'DM Sans', sans-serif" }}>← Back to Drugs & Bugs</button>
          <div style={{ width: 46, height: 46, background: 'rgba(245,166,35,.1)', border: '1px solid rgba(245,166,35,.25)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>👶</div>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: T.bright }}>Pediatric Dosing Calculator</div>
            <div style={{ fontSize: 12, color: T.dim, marginTop: 2 }}>Weight-based dosing · Safety caps · Broselow bands · 30 ED medications</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ background: 'rgba(245,166,35,.1)', border: '1px solid rgba(245,166,35,.25)', borderRadius: 20, padding: '6px 14px', fontSize: 11.5, fontWeight: 700, color: T.amber }}>⚠ Verify all doses clinically</div>
          <button onClick={() => { setPrefillDrug(null); setShowLogModal(true); }} style={{ padding: '9px 18px', borderRadius: 8, background: `linear-gradient(135deg, ${T.blue}, #2f6db5)`, border: 'none', color: '#fff', cursor: 'pointer', fontSize: 12.5, fontWeight: 700 }}>＋ Log Dose</button>
        </div>
      </div>

      {/* WEIGHT BAR */}
      <div style={{ background: 'rgba(11,29,53,.97)', backdropFilter: 'blur(16px)', borderBottom: `2px solid ${T.border}`, padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', position: 'sticky', top: 64, zIndex: 30 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.09em', color: T.dim }}>Weight</span>
          <input
            type="number" min="1" max="100" placeholder="—"
            value={weightInput}
            onChange={e => handleWeightChange(e.target.value)}
            style={{ width: 80, background: 'rgba(22,45,79,.9)', border: `2px solid ${weight ? T.amber : T.border}`, borderRadius: 10, padding: '10px 12px', fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700, color: T.bright, outline: 'none', textAlign: 'center' }}
          />
          <span style={{ fontSize: 13, fontWeight: 700, color: T.dim }}>kg</span>
          <input
            type="range" min="1" max="80" value={weight || 10}
            onChange={e => { const v = parseFloat(e.target.value); setWeight(v); setWeightInput(String(v)); }}
            style={{ width: 180, accentColor: T.amber, cursor: 'pointer' }}
          />
        </div>

        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, color: T.dim, minWidth: 80 }}>Age: {band ? band.age : '—'}</span>

        {/* Broselow band */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(22,45,79,.4)', minWidth: 220 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: band ? band.color : T.muted, transition: 'background .3s' }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 13, color: band ? band.color : T.dim, transition: 'color .3s' }}>{band ? band.name + ' Band' : 'Enter weight'}</div>
            <div style={{ fontSize: 10, color: T.dim, fontFamily: "'JetBrains Mono', monospace" }}>{band ? band.label + ' · ' + band.age : 'Broselow Band'}</div>
          </div>
        </div>

        <span style={{ marginLeft: 'auto', background: 'rgba(0,212,188,.1)', border: '1px solid rgba(0,212,188,.25)', borderRadius: 20, padding: '6px 14px', fontSize: 11.5, fontWeight: 700, color: T.teal }}>
          {filtered.length} medication{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* MAIN LAYOUT */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

        {/* LEFT SIDEBAR */}
        <div style={{ width: 260, borderRight: `1px solid ${T.border}`, background: 'rgba(11,29,53,.3)', overflowY: 'auto', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: '13px 16px 10px', fontFamily: "'Playfair Display', serif", fontSize: 13.5, fontWeight: 700, color: T.bright, borderBottom: '1px solid rgba(30,58,95,.5)', background: 'rgba(11,29,53,.5)', position: 'sticky', top: 0, zIndex: 4 }}>
            🏷 Categories
          </div>
          <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {CATEGORIES.map(cat => {
              const isActive = activeCategory === cat.id;
              const count = cat.id === 'all' ? DRUG_DATA.length : catCountMap[cat.id] || 0;
              return (
                <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                  style={{ width: '100%', textAlign: 'left', padding: '10px 12px', background: isActive ? 'rgba(0,212,188,.08)' : 'transparent', border: `1px solid ${isActive ? 'rgba(0,212,188,.3)' : 'rgba(30,58,95,.5)'}`, borderRadius: 9, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 12.5, fontWeight: 600, color: isActive ? T.bright : T.dim, display: 'flex', alignItems: 'center', gap: 9 }}>
                  <span style={{ fontSize: 17, width: 22, flexShrink: 0 }}>{cat.icon}</span>
                  {cat.label}
                  <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 800, background: isActive ? 'rgba(0,212,188,.15)' : 'rgba(30,58,95,.8)', padding: '2px 7px', borderRadius: 8, color: isActive ? T.teal : T.dim }}>{count}</span>
                </button>
              );
            })}
          </div>

          {/* DOSE LOG */}
          <div style={{ marginTop: 'auto', borderTop: `1px solid ${T.border}` }}>
            <div style={{ padding: '13px 16px 10px', fontFamily: "'Playfair Display', serif", fontSize: 13.5, fontWeight: 700, color: T.bright, borderBottom: '1px solid rgba(30,58,95,.5)', background: 'rgba(11,29,53,.5)' }}>
              📋 Dose Log
            </div>
            <div style={{ maxHeight: 260, overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 5 }}>
              {doseLog.length === 0 ? (
                <div style={{ padding: 16, textAlign: 'center', color: T.muted, fontSize: 12 }}>No doses logged.<br />Click ＋ on any card.</div>
              ) : doseLog.map(e => (
                <div key={e.id} style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 12, color: T.bright }}>{e.drug.split('(')[0].trim()}</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, color: T.dim }}>{e.time}</span>
                    <button onClick={() => deleteLog(e.id)} style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer', fontSize: 11, padding: 0 }}>✕</button>
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: T.teal, marginTop: 3 }}>
                    {e.dose}{e.vol ? ' · ' + e.vol : ''} · {e.route}
                  </div>
                  {e.notes && <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>{e.notes}</div>}
                </div>
              ))}
            </div>
            <button onClick={() => { setPrefillDrug(null); setShowLogModal(true); }} style={{ margin: 8, padding: 8, background: 'rgba(0,212,188,.07)', border: '1px dashed rgba(0,212,188,.3)', borderRadius: 8, color: T.teal, fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700, cursor: 'pointer', textAlign: 'center', width: 'calc(100% - 16px)' }}>
              ＋ Log Dose Administered
            </button>
          </div>
        </div>

        {/* CENTER PANEL */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20, background: 'rgba(5,10,20,.3)' }}>
          {renderCards()}
        </div>
      </div>

      {/* ACTION BAR */}
      <div style={{ height: 60, background: 'rgba(11,29,53,.97)', borderTop: `1px solid ${T.border}`, backdropFilter: 'blur(16px)', padding: '0 24px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', bottom: 0, zIndex: 30 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: T.dim }}>{weight ? `${weight} kg patient` : 'No weight entered'}</span>
          {band && <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: band.color + '22', border: `1px solid ${band.color}66`, color: band.color }}>{band.name} Band ({band.label})</span>}
        </div>
        {doseLog.length > 0 && (
          <button onClick={() => { setDoseLog([]); localStorage.removeItem('notrya-ped-log'); addToast('Log cleared', T.dim); }}
            style={{ padding: '9px 18px', borderRadius: 8, background: 'transparent', border: `1px solid ${T.border}`, color: T.text, cursor: 'pointer', fontSize: 12.5, fontWeight: 700 }}>
            Clear Log
          </button>
        )}
        <button onClick={() => { setPrefillDrug(null); setShowLogModal(true); }}
          style={{ padding: '9px 18px', borderRadius: 8, background: `linear-gradient(135deg, ${T.amber}, #e09010)`, border: 'none', color: '#fff', cursor: 'pointer', fontSize: 12.5, fontWeight: 700 }}>
          ＋ Log Dose
        </button>
      </div>

      {/* LOG MODAL */}
      {showLogModal && <LogModal onClose={() => { setShowLogModal(false); setPrefillDrug(null); }} onSave={saveLog} prefillDrug={prefillDrug} weight={weight} />}

      {/* TOASTS */}
      <div style={{ position: 'fixed', bottom: 80, right: 24, zIndex: 999, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
        {toasts.map(t => <Toast key={t.id} message={t.msg} color={t.color} onDone={() => setToasts(prev => prev.filter(x => x.id !== t.id))} />)}
      </div>
    </div>
  );
}