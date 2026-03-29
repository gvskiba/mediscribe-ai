import { useState } from "react";
import { useNavigate } from "react-router-dom";

/* ═══ TOKENS ═══════════════════════════════════════════════════════ */
const T = {
  bg:"#050f1e",panel:"#081628",card:"#0b1e36",up:"#0e2544",
  b:"rgba(26,53,85,0.8)",bhi:"rgba(42,79,122,0.9)",
  txt:"#e8f0fe",txt2:"#8aaccc",txt3:"#4a6a8a",txt4:"#2e4a6a",
  coral:"#ff6b6b",gold:"#f5c842",teal:"#00e5c0",blue:"#3b9eff",
  orange:"#ff9f43",purple:"#9b6dff",green:"#3dffa0",cyan:"#00d4ff",
};

/* ═══ CONDITIONS ════════════════════════════════════════════════════ */
const CONDITIONS = [
  { id:"opioid",   icon:"💊", title:"Opioid Toxidrome",         sub:"Heroin · Fentanyl · Oxycodone · Naloxone Protocol",         cat:"Toxidromes",     color:"#ff6b6b", gl:"rgba(255,107,107,0.07)",  br:"rgba(255,107,107,0.28)"  },
  { id:"stimulant",icon:"⚡", title:"Stimulant Toxidrome",       sub:"Cocaine · Amphetamines · MDMA · Sympathomimetic Crisis",    cat:"Toxidromes",     color:"#f5c842", gl:"rgba(245,200,66,0.07)",  br:"rgba(245,200,66,0.28)"   },
  { id:"cholinerg",icon:"🫧", title:"Cholinergic Toxidrome",     sub:"Organophosphates · Carbamates · SLUDGE/DUMBELS",           cat:"Toxidromes",     color:"#3dffa0", gl:"rgba(61,255,160,0.07)",  br:"rgba(61,255,160,0.28)"   },
  { id:"anticholinerg",icon:"🌡️",title:"Anticholinergic Toxidrome",sub:"TCAs · Antihistamines · Atropine · Dry Flushed",        cat:"Toxidromes",     color:"#ff9f43", gl:"rgba(255,159,67,0.07)",  br:"rgba(255,159,67,0.28)"   },
  { id:"serotonin",icon:"🧠", title:"Serotonin Syndrome",        sub:"SSRIs · MAOIs · Hunter Criteria · Cyproheptadine",         cat:"Toxidromes",     color:"#9b6dff", gl:"rgba(155,109,255,0.07)", br:"rgba(155,109,255,0.28)"  },
  { id:"acetaminophen",icon:"⚗️",title:"Acetaminophen OD",       sub:"Rumack-Matthew Nomogram · NAC Protocol · Hepatotoxicity",  cat:"Antidotes",      color:"#00d4ff", gl:"rgba(0,212,255,0.07)",   br:"rgba(0,212,255,0.28)"    },
  { id:"salicylate",icon:"🌡",  title:"Salicylate Toxicity",     sub:"ASA · Oil of Wintergreen · Alkalinisation · HD Criteria",  cat:"Antidotes",      color:"#3b9eff", gl:"rgba(59,158,255,0.07)",  br:"rgba(59,158,255,0.28)"   },
  { id:"tca",      icon:"⚠️", title:"TCA Overdose",              sub:"QRS Widening · Bicarb · ACLS Modifications",               cat:"Antidotes",      color:"#ff6b6b", gl:"rgba(255,107,107,0.07)",  br:"rgba(255,107,107,0.28)"  },
  { id:"methanol", icon:"🧪", title:"Toxic Alcohols",            sub:"Methanol · Ethylene Glycol · Fomepizole · HD",             cat:"Antidotes",      color:"#f5c842", gl:"rgba(245,200,66,0.07)",  br:"rgba(245,200,66,0.28)"   },
  { id:"co",       icon:"💨", title:"Carbon Monoxide Poisoning", sub:"HBO Indications · Carboxyhemoglobin · Pulse Ox Pitfall",   cat:"Environmental",  color:"#00e5c0", gl:"rgba(0,229,192,0.07)",   br:"rgba(0,229,192,0.28)"    },
  { id:"snake",    icon:"🐍", title:"Envenomation",              sub:"Crotalidae · Elapidae · Antivenom · CroFab",               cat:"Environmental",  color:"#3dffa0", gl:"rgba(61,255,160,0.07)",  br:"rgba(61,255,160,0.28)"   },
  { id:"beta",     icon:"❤️", title:"Beta-Blocker / CCB OD",     sub:"High-Dose Insulin · Lipid Emulsion · Calcium · Atropine",  cat:"Antidotes",      color:"#ff6b9d", gl:"rgba(255,107,157,0.07)", br:"rgba(255,107,157,0.28)"  },
];

const CATS = ["Toxidromes","Antidotes","Environmental"];

/* ═══ OVERVIEW ══════════════════════════════════════════════════════ */
const OVERVIEW = {
  opioid:{
    def:"Opioid toxidrome is characterized by the classic triad of miosis (pinpoint pupils), CNS depression, and respiratory depression. Fentanyl and synthetic opioids may require multiple or high-dose naloxone. Buprenorphine overdose is partial — full naloxone reversal may be incomplete. Always consider co-ingestants.",
    bullets:["Classic triad: Miosis + CNS depression + Respiratory depression (RR <12)","Naloxone 0.4–2 mg IV/IM/IN — titrate to respiratory rate, NOT full reversal (avoids precipitated withdrawal)","Fentanyl & analogues: may need higher naloxone doses (4–10 mg) or continuous infusion","Naloxone infusion: 2/3 of reversal dose/hour IV (e.g., if 2 mg reversed → infuse 1.3 mg/h)","Duration of naloxone (30–90 min) often shorter than opioid — ICU admission for extended-release or fentanyl patches","Never discharge without ≥6h observation after naloxone use"],
  },
  stimulant:{
    def:"Stimulant toxidrome (sympathomimetic) presents with hyperadrenergic features. Cocaine additionally causes sodium channel blockade (QRS widening risk). MDMA causes serotonin release. Key risks include hyperthermia (>40°C = emergency), hypertensive emergency, and coronary vasospasm.",
    bullets:["Symptoms: hyperthermia, tachycardia, hypertension, mydriasis, diaphoresis, agitation","Hyperthermia >40°C: most lethal complication — aggressive cooling + sedation with benzos IMMEDIATELY","Benzodiazepines: first-line for agitation AND hypertension in stimulant toxicity","AVOID beta-blockers without alpha-coverage (paradoxical hypertension via unopposed alpha)","Cocaine chest pain: treat as ACS — CCB (diltiazem) preferred over beta-blockers; aspirin for thrombosis","MDMA + hyponatremia: SIADH pattern — fluid restriction, not aggressive free water; risk of cerebral edema"],
  },
  cholinerg:{
    def:"Cholinergic toxidrome results from inhibition of acetylcholinesterase (organophosphates, nerve agents) or direct muscarinic agonism. SLUDGE/DUMBELS mnemonics capture muscarinic features. Nicotinic effects include muscle fasciculations → paralysis. Life-threatening: bronchospasm, excessive secretions, respiratory failure.",
    bullets:["SLUDGE: Salivation, Lacrimation, Urination, Defecation, GI distress, Emesis","DUMBELS: Diarrhea, Urination, Miosis, Bradycardia/Bronchospasm, Emesis, Lacrimation, Salivation","Atropine: 2–4 mg IV q5–10 min until secretions dry (NOT HR/pupils as endpoint) — may need hundreds of mg","Pralidoxime (2-PAM): 1–2 g IV over 15–30 min — for organophosphate only, before 'aging' (<24–48h)","Seizures: benzodiazepines first-line (atropine does NOT treat seizures in organophosphate toxicity)","Decontamination: remove clothing, irrigate skin — provider PPE critical before contact"],
  },
  anticholinerg:{
    def:"Anticholinergic toxidrome results from muscarinic receptor blockade. Classic mnemonic: 'Blind as a bat (mydriasis), Mad as a hatter (delirium), Red as a beet (flushing), Hot as a hare (hyperthermia), Dry as a bone (anhidrosis/urinary retention)'. TCAs, diphenhydramine, jimsonweed, and atropine are common causes.",
    bullets:["Classic features: mydriasis, tachycardia, hyperthermia, flushing, dry skin, urinary retention, ileus, altered mental status","TCA specifically: QRS widening (>100ms = severe), QTc prolongation, R wave in aVR >3mm","Physostigmine: antidote for pure anticholinergic toxicity (NOT TCAs — risk of asystole)","NaHCO₃ for TCAs: if QRS >100ms or hemodynamic instability — give 1–2 mEq/kg IV bolus","Benzodiazepines: for agitation and seizures. AVOID physostigmine if TCA suspected.","Hyperthermia: aggressive external cooling — risk of rhabdomyolysis and renal failure"],
  },
  serotonin:{
    def:"Serotonin syndrome results from excess serotonergic activity, classically via combination of serotonergic agents (SSRIs + MAOIs, SSRIs + triptans, linezolid + SSRIs). Distinguished from NMS by: rapid onset (<24h), hyperreflexia/clonus (vs rigidity in NMS), and presence of serotonergic drug. Hunter Criteria are more sensitive than Sternbach.",
    bullets:["Hunter Criteria (≥1 required): Clonus (inducible/spontaneous/ocular) + serotonergic agent exposure","Triad: altered mental status + neuromuscular findings (clonus/hyperreflexia) + autonomic instability","Mild: tachycardia, diaphoresis, tremor, myoclonus — stop offending agent, BZDs, supportive","Severe: hyperthermia >41°C, severe agitation, rigidity → ICU + cyproheptadine 12 mg PO/NG loading","Cyproheptadine: 5-HT2A antagonist — 12 mg load then 2 mg q2h (max 32 mg/day)","NMS vs SS: NMS is slower onset (days), LEAD-PIPE rigidity, extrapyramidal signs, responds to bromocriptine/dantrolene"],
  },
  acetaminophen:{
    def:"Acetaminophen (APAP) overdose is the most common cause of acute liver failure in the US. Toxicity results from saturation of glucuronidation/sulfation pathways → NAPQI accumulation → hepatocellular necrosis. Rumack-Matthew nomogram guides NAC therapy decision based on APAP level at 4+ hours post-ingestion.",
    bullets:["Phase 1 (0–24h): nausea/vomiting — AST/ALT may be normal; get level at 4h post-ingestion","Phase 2 (24–72h): RUQ pain, transaminase rise","Phase 3 (72–96h): fulminant hepatic failure — peak transaminases, coagulopathy, encephalopathy","Rumack-Matthew: plot APAP level vs time post-ingestion — treat if at or above treatment line","NAC: 150 mg/kg IV over 1h → 50 mg/kg over 4h → 100 mg/kg over 16h (21h protocol); oral NAC also effective","NAC criteria: APAP level on nomogram, unknown time, ingestion >150 mg/kg or >7.5g, any hepatotoxicity signs"],
  },
  salicylate:{
    def:"Salicylate (aspirin) toxicity causes a mixed acid-base disorder: initial respiratory alkalosis (direct CNS stimulation of respiratory center), then metabolic acidosis (uncouples oxidative phosphorylation). Toxicity severity correlates poorly with serum level alone — clinical assessment is paramount. Severe toxicity includes cerebral edema and pulmonary edema.",
    bullets:["Triad: tinnitus + tachypnea + altered mental status","Classic labs: respiratory alkalosis + anion gap metabolic acidosis (double gap)","Serum salicylate: toxic >30 mg/dL (mild), >50 mg/dL (moderate), >80–100 mg/dL (severe)","Urine alkalinization: NaHCO₃ to target urine pH 7.5–8.0 — enhances renal elimination (ion trapping)","Avoid intubation if possible — if required, hyperventilate aggressively to match pre-intubation compensation","HD criteria: level >100 mg/dL, renal failure, pulmonary edema, CNS changes, deteriorating despite treatment"],
  },
  tca:{
    def:"Tricyclic antidepressant (TCA) overdose is a true emergency — rapid progression from alert to comatose with seizures and cardiac arrest possible within 1 hour. Mechanism: sodium channel blockade (QRS widening, hypotension), alpha-blockade (vasodilation), and anticholinergic effects. QRS >100ms or QTc prolongation = high risk.",
    bullets:["Red flags: QRS >100ms, R-wave in aVR >3mm, right axis deviation","NaHCO₃ FIRST: 1–2 mEq/kg IV bolus if QRS >100ms, dysrhythmia, or hemodynamic compromise — target serum pH 7.50–7.55","Continuous bicarb infusion: 3 amps NaHCO₃ in D5W at 2× maintenance rate","Seizures: benzodiazepines first-line. AVOID physostigmine (asystole risk).","Refractory hypotension: norepinephrine preferred over dopamine. Lipid emulsion rescue if refractory.","Avoid: flumazenil (lowers seizure threshold), type 1A/1C antiarrhythmics, amiodarone, beta-blockers"],
  },
  methanol:{
    def:"Toxic alcohols (methanol, ethylene glycol) cause profound elevated anion gap metabolic acidosis via toxic metabolites: methanol → formaldehyde → formic acid (causes blindness, brain injury); ethylene glycol → oxalic acid (calcium oxalate crystals → renal failure). Elevated osmol gap precedes elevated anion gap in early toxicity.",
    bullets:["Osmol gap = measured Osm − calculated Osm (>10–20 = suspicious; may be normal in late toxicity)","Anion gap metabolic acidosis + high osmol gap → toxic alcohol until proven otherwise","Methanol features: visual disturbances ('snowstorm vision'), optic disc hyperemia","Ethylene glycol features: calcium oxalate crystals in urine, flank pain, hypocalcemia, renal failure","Fomepizole (4-MP): 15 mg/kg IV load — blocks alcohol dehydrogenase (ADH). First-line over ethanol.","HD indications: methanol/EG level >50 mg/dL, pH <7.20, renal failure, visual changes, deterioration despite fomepizole"],
  },
  co:{
    def:"Carbon monoxide (CO) poisoning is the most common cause of fatal poisoning in the US. CO binds hemoglobin with 240× greater affinity than O₂ → carboxyhemoglobin (COHb). Pulse oximetry is UNRELIABLE (reads COHb as oxyhemoglobin). Co-oximetry on ABG is required. Delayed neuropsychiatric sequelae (DNS) occur in 10–30% of significant exposures.",
    bullets:["Pulse oximetry FALSELY NORMAL in CO poisoning — requires co-oximetry (ABG/VBG) for COHb level","Symptoms: headache ('flu without fever'), nausea, confusion, syncope — suspect in multiple household members","100% NRB O₂: reduces CO half-life from 5h → 60–90 min; standard initial treatment","Hyperbaric oxygen (HBO) indications: COHb >25%, LOC, neurological symptoms, cardiac involvement, pregnancy, COHb >15% in children","HBO reduces DNS from ~30% → <5% (Weaver et al.)","Cyanide co-poisoning: consider in fire victims with unexplained severe lactic acidosis + hypotension despite 100% O₂"],
  },
  snake:{
    def:"North American snake envenomation: Crotalidae (pit vipers — rattlesnake, copperhead, cottonmouth) cause local tissue effects, hematotoxicity, and coagulopathy. Elapidae (coral snakes — 'Red on yellow kills a fellow') cause neurotoxicity with delayed onset. CroFab is the antivenom for Crotalidae. Antivenom decision is based on clinical severity, not bite location.",
    bullets:["Crotalidae: local pain/edema/ecchymosis, VICC (venom-induced consumptive coagulopathy), thrombocytopenia","Elapidae (coral): minimal local effects, delayed (hours) ascending flaccid paralysis — if respiratory failure, antivenom early","Dry bite (no venom): 20–30% of pit viper bites — 4–6h observation minimum","CroFab: 4–6 vials IV over 1h for moderate-severe; repeat 2-vial doses at 6, 12, 18h if recurrence","Labs: CBC, coags (PT/INR, fibrinogen), BMP, LFTs, UA, type & screen — repeat q4–6h","AVOID: incision/suction devices, tourniquets, electric shock, ice — worsens outcomes"],
  },
  beta:{
    def:"Beta-blocker and calcium channel blocker (CCB) overdoses both cause bradycardia and hypotension but via different mechanisms. CCBs affect both cardiac (heart block) and peripheral vasodilation (dihydropyridines). High-dose insulin euglycemia (HDIE) therapy dramatically shifts myocardial metabolism and has become first-line for severe toxicity. Lipid emulsion rescue is a last resort.",
    bullets:["Beta-blocker: bradycardia, hypotension, bronchospasm; glucagon 3–10 mg IV bolus (cAMP pathway)","CCB: profound bradycardia/heart block (non-DHP) or vasodilation (DHP — amlodipine, nifedipine)","High-Dose Insulin (HDIE): 1 unit/kg IV bolus → 0.5–1 unit/kg/h infusion. D50 1–2 amps pre-bolus. Monitor glucose q30 min.","Calcium: CaCl₂ 1g (or Ca-gluconate 3g) IV — may temporarily improve heart rate/BP; repeat q10–20min","Lipid emulsion (Intralipid 20%): 1.5 mL/kg IV bolus → 0.25 mL/kg/min infusion — lipid sink mechanism; last resort","ECMO: if refractory to all pharmacologic measures — early referral to ECMO center"],
  },
};

/* ═══ WORKUP ════════════════════════════════════════════════════════ */
const WORKUP = {
  opioid:[
    {icon:"🫁",label:"Respiratory Rate + SpO₂",detail:"RR <12 and SpO₂ <94% = definitive indication for naloxone. Continuous monitoring mandatory after naloxone — duration of naloxone (30–90 min) often shorter than opioid effect."},
    {icon:"👁️",label:"Pupil Exam",detail:"Miosis (pinpoint pupils) is the classic opioid sign. Bilateral fixed dilation suggests hypoxic brain injury or mixed ingestion. Asymmetric pupils → consider intracranial pathology."},
    {icon:"🧪",label:"Urine Drug Screen",detail:"Standard UDS may not detect fentanyl/analogues. Serum fentanyl levels not clinically available in real-time. UDS guides suspicion but does NOT replace clinical assessment."},
    {icon:"📊",label:"ECG",detail:"Methadone: QTc prolongation, risk of torsades. Check QTc for all methadone overdoses. Propoxyphene (withdrawn but occasionally encountered): sodium channel blockade similar to TCA."},
    {icon:"🩸",label:"BMP / ABG",detail:"ABG for respiratory failure assessment (pH, pCO₂, pO₂). BMP for electrolytes, renal function (important for dosing, complications). Check glucose — altered MS may also be hypoglycemia."},
  ],
  stimulant:[
    {icon:"🌡️",label:"Core Temperature",detail:"Rectal temp mandatory — hyperthermia >40°C is the most dangerous complication. External temperature will underestimate core temp in severe toxicity. Continuous monitoring."},
    {icon:"❤️",label:"ECG + Continuous Cardiac Monitoring",detail:"Cocaine: QRS widening (sodium channel blockade), QTc prolongation, ST changes (vasospasm vs infarction). ST elevation in cocaine chest pain may represent vasospasm — not necessarily STEMI."},
    {icon:"🧪",label:"Troponin + CK",detail:"Cocaine-associated chest pain: troponin for myocardial injury. CK for rhabdomyolysis (common with hyperthermia + agitation). CK-MB may be elevated from skeletal muscle without true MI."},
    {icon:"🩸",label:"BMP + Glucose",detail:"Hyponatremia in MDMA toxicity (SIADH). Hyperglycemia in stimulant crisis. Metabolic acidosis with lactic acidosis from seizures or hyperthermia."},
    {icon:"🧠",label:"CT Head (if AMS)",detail:"Cocaine: risk of hemorrhagic stroke (HTN-mediated), ischemic stroke (vasospasm), or subarachnoid hemorrhage. CT head if new focal deficits or altered consciousness."},
  ],
  cholinerg:[
    {icon:"🧫",label:"RBC Cholinesterase + Plasma ChE",detail:"RBC acetylcholinesterase is the gold standard but slow. Plasma pseudocholinesterase is rapid but less specific. >50% decrease from baseline = significant exposure. Baseline rarely known."},
    {icon:"🌡️",label:"Vitals + SLUDGE Assessment",detail:"Systematic SLUDGE exam: secretions (lungs/nose/mouth), lacrimation, bowel sounds, urination. HR may be bradycardic (muscarinic) or tachycardic (nicotinic) — variable."},
    {icon:"💊",label:"Atropine Titration Monitor",detail:"Atropine endpoint = DRY SECRETIONS (lungs clear on auscultation). NOT heart rate. NOT pupil size. Massive doses (hundreds of mg) may be required in severe organophosphate toxicity."},
    {icon:"🧪",label:"BMP + ABG",detail:"Metabolic acidosis from seizures or hypoxia. Electrolytes — hypokalemia from vomiting/diarrhea. ABG for respiratory failure assessment (bronchospasm + secretions are primary killers)."},
    {icon:"📊",label:"ECG",detail:"Prolonged QTc (common in OP toxicity). AV block. Torsades de pointes — QTc >500ms requires treatment. Bradycardia from muscarinic overstimulation."},
  ],
  anticholinerg:[
    {icon:"📊",label:"ECG — QRS + QTc",detail:"TCA specifically: QRS >100ms = high risk for arrhythmia/seizures. QRS >160ms = risk of VT/VF. R-wave in aVR >3mm, right axis deviation. Continuous monitoring until QRS normal for 6+ hours."},
    {icon:"🌡️",label:"Core Temperature",detail:"Anhidrosis prevents heat dissipation — hyperthermia can be severe. Rectal temperature mandatory. Cooling measures: ice packs, cool mist, benzodiazepines for agitation."},
    {icon:"🧪",label:"TCA Screen + APAP + ASA Levels",detail:"Always check co-ingestants in any OD: APAP and ASA levels. TCA immunoassay has false positives (diphenhydramine, carbamazepine, quetiapine can cross-react)."},
    {icon:"🩸",label:"BMP + ABG",detail:"Metabolic acidosis from seizures. Hyperkalemia from rhabdomyolysis. ABG: pH monitoring for TCA (target 7.50–7.55 with bicarb therapy)."},
    {icon:"🔬",label:"Urinalysis",detail:"Urinary retention is common — bedside bladder scan. Myoglobinuria if rhabdomyolysis (dipstick positive blood, no RBCs on micro). CK if rhabdomyolysis suspected."},
  ],
  serotonin:[
    {icon:"🧠",label:"Hunter Criteria Assessment",detail:"Hunter: (1) Spontaneous clonus, OR (2) Inducible clonus + agitation/diaphoresis, OR (3) Ocular clonus + agitation/diaphoresis, OR (4) Tremor + hyperreflexia, OR (5) Hypertonia + temp >38°C + ocular/inducible clonus — any one criterion = SS."},
    {icon:"🌡️",label:"Core Temperature",detail:"Temperature >41°C = life-threatening — requires immediate aggressive management. Unlike NMS, SS can progress to fulminant hyperthermia within hours. External cooling + heavy sedation + ICU."},
    {icon:"📊",label:"ECG + Continuous Monitoring",detail:"Tachycardia universal. QTc prolongation risk from causative agents. Dysrhythmias in severe toxicity."},
    {icon:"🧪",label:"CK + BMP",detail:"Rhabdomyolysis from hyperthermia + muscle rigidity. CK may be severely elevated. Renal failure risk. Electrolytes — hypokalemia from vomiting, metabolic alkalosis from hyperventilation."},
    {icon:"📋",label:"Medication Reconciliation",detail:"Complete list of all serotonergic agents: SSRIs, SNRIs, MAOIs, TCAs, triptans, tramadol, fentanyl (high doses), linezolid, dextromethorphan, lithium, St John's Wort."},
  ],
  acetaminophen:[
    {icon:"⏱️",label:"Time of Ingestion (Critical)",detail:"Must establish time of ingestion to use Rumack-Matthew nomogram. If time unknown or unreliable → treat as if on nomogram treatment line. APAP level before 4h may underestimate peak."},
    {icon:"🧪",label:"APAP Level at 4h Post-Ingestion",detail:"Draw at exactly 4h (or later) after ingestion. Plot on Rumack-Matthew nomogram. Level above treatment line = NAC indicated. All significant ingestions deserve APAP level check even if asymptomatic."},
    {icon:"🩸",label:"LFTs (AST/ALT) + INR + Bilirubin",detail:"Baseline and serial q12–24h. Transaminase rise begins at 24–36h. Peak at 72–96h. INR elevation indicates hepatic dysfunction. INR >2 at 48h = King's College Criteria consideration."},
    {icon:"🔬",label:"Renal Function (BMP)",detail:"Direct renal tubular toxicity can occur even without hepatotoxicity ('renal APAP toxicity'). Creatinine rise at 24–48h. Also check glucose (hepatic failure → hypoglycemia)."},
    {icon:"📊",label:"Phosphate Level",detail:"Hypophosphatemia is a poor prognostic sign in APAP-induced hepatic failure (King's College Criteria includes phosphate >3.75 mg/dL at 48–96h as high-risk marker for mortality without transplant)."},
  ],
  salicylate:[
    {icon:"🩸",label:"Serum Salicylate Level",detail:"q2–4h until declining. Level >30 mg/dL = toxic. >50 = moderate. >80–100 = severe. Note: Done nomogram NOT reliable — clinical severity correlates better than isolated level."},
    {icon:"🫁",label:"ABG — pH + pCO₂",detail:"Classic: respiratory alkalosis followed by anion gap metabolic acidosis. If pH <7.35 without corresponding hyperventilation → severe toxicity. Maintain patient's spontaneous hyperventilation — intubation is high risk."},
    {icon:"🧪",label:"BMP — Anion Gap + K⁺",detail:"Elevated anion gap metabolic acidosis. Hypokalemia (mandatory to correct — potassium depletion impairs urinary alkalinization). Serum glucose (cerebral glucose may be low even with normal serum glucose)."},
    {icon:"🌡️",label:"Temperature",detail:"Hyperthermia from uncoupled oxidative phosphorylation — marker of severe toxicity. Active cooling if >39°C. Hyperthermia correlates with poor prognosis."},
    {icon:"📊",label:"Renal Function + Urine pH",detail:"Urine pH monitoring during alkalinization (target 7.5–8.0). Renal failure impairs salicylate elimination — HD criteria. Foley catheter for accurate urine output monitoring during bicarb therapy."},
  ],
  tca:[
    {icon:"📊",label:"12-Lead ECG — QRS + aVR",detail:"QRS >100ms = high risk. QRS >160ms = VT/VF risk. R-wave in aVR >3mm = specific for TCA. Rightward terminal QRS axis (S wave in I + aVL, R wave in aVR). Serial ECGs q1–2h."},
    {icon:"🩸",label:"TCA Level + Co-ingestant Screen",detail:"TCA level >1000 ng/mL = severe toxicity. However, clinical signs (QRS, BP) more important than level. Always check APAP and ASA — common co-ingestants."},
    {icon:"📋",label:"pH Monitoring (Blood Gas)",detail:"Target pH 7.50–7.55 during sodium bicarbonate therapy. Alkalosis reduces TCA binding to sodium channels. Monitor pH q1–2h during bicarb infusion."},
    {icon:"🌡️",label:"Vital Signs + GCS",detail:"Rapid deterioration can occur — patient may be awake, then comatose within 60 minutes. Q15-minute vital sign and GCS checks. Early ICU admission for any significant ingestion."},
    {icon:"🩺",label:"Seizure Assessment",detail:"Seizures worsen acidosis → worsens sodium channel blockade (vicious cycle). Benzodiazepines first-line. If seizures persist → propofol or barbiturate (NOT phenytoin — worsens sodium channel toxicity)."},
  ],
  methanol:[
    {icon:"🧪",label:"Serum Methanol/Ethylene Glycol Level",detail:"Methanol: toxic >20 mg/dL; severe >50 mg/dL. Ethylene glycol: toxic >20 mg/dL. Levels guide fomepizole continuation and HD decisions. May not be immediately available — treat empirically based on clinical presentation."},
    {icon:"🩸",label:"ABG + Anion Gap + Osmol Gap",detail:"Elevated osmol gap (>10–20) + elevated anion gap = toxic alcohol until proven otherwise. Early: osmol gap high, anion gap normal. Late: osmol gap normalizing, anion gap rising (as metabolites accumulate)."},
    {icon:"👁️",label:"Visual Acuity + Fundoscopy",detail:"Methanol specifically: visual symptoms (blurred vision, 'snowstorm') = formate toxicity to optic nerve. Fundoscopy: optic disc hyperemia → papilledema. Visual changes = severe toxicity, HD urgently indicated."},
    {icon:"🔬",label:"Urinalysis — Calcium Oxalate Crystals",detail:"Ethylene glycol specifically: calcium oxalate monohydrate (needle-shaped) or dihydrate (envelope-shaped) crystals in urine. Pathognomonic if present. Wood's lamp: EG fluoresces (antifreeze contains fluorescein)."},
    {icon:"🩺",label:"Renal Function + Calcium",detail:"EG: hypocalcemia (oxalate chelates calcium) — tetany, QTc prolongation. Acute renal failure from calcium oxalate crystal deposition. Methanol: renal failure from severe acidosis + shock."},
  ],
  co:[
    {icon:"🩸",label:"Co-oximetry ABG/VBG — COHb Level",detail:"ONLY co-oximetry accurately measures COHb. Standard pulse ox is UNRELIABLE (reads COHb as oxyHb). Venous COHb is acceptable surrogate. COHb >25% = severe, >35% = critical, >50% = potentially fatal."},
    {icon:"🧪",label:"Lactate Level",detail:"Lactic acidosis in CO poisoning = tissue hypoxia. Elevated lactate + severe CO toxicity → consider concomitant cyanide poisoning (fire victims). Lactate >10 mmol/L despite O₂ → hydroxocobalamin empirically."},
    {icon:"📊",label:"ECG + Troponin",detail:"CO-induced cardiac toxicity: ST depression/elevation, dysrhythmias. Troponin elevation correlates with delayed neuropsychiatric sequelae and worse outcomes. Continuous monitoring."},
    {icon:"🧠",label:"Neuropsychiatric Assessment",detail:"Cognitive tests (Orientation, Digit Span, Similarities) — baseline document. DNS occurs in 10–30% of significant exposures, weeks after apparent recovery. HBO may reduce DNS risk."},
    {icon:"🤰",label:"Pregnancy Test + Fetal Assessment",detail:"CO crosses placenta — fetal COHb higher than maternal. Lower threshold for HBO in pregnancy (COHb >15%). Fetal assessment: cardiotocography, obstetric consultation even with mild maternal symptoms."},
  ],
  snake:[
    {icon:"📸",label:"Wound Measurement",detail:"Mark advancing edge of edema/erythema with skin marker q15–30 min. Documenting progression rate critical for antivenom decision and grading severity. Photography with timestamps."},
    {icon:"🩸",label:"CBC + Coags + BMP (Baseline + q4–6h)",detail:"Crotalidae VICC: fibrinogen <150, D-dimer elevated, platelet count falling, PT/INR prolonged. Serial labs q4–6h — coagulopathy can appear/worsen hours after antivenom. Check fibrinogen specifically (most sensitive)."},
    {icon:"🏥",label:"Poison Control (1-800-222-1222)",detail:"Call Poison Control for all envenomations — real-time guidance, antivenom availability, regional snake identification. 24/7 toxicologist consultation. Do NOT delay antivenom waiting for species ID."},
    {icon:"🔬",label:"Urinalysis + CK",detail:"Myoglobinuria from rhabdomyolysis (some snake venoms are directly myotoxic). Hemoglobinuria from hemolysis. CK for muscle damage. Renal function — hemolysis and myoglobin are nephrotoxic."},
    {icon:"📋",label:"Antivenom Readiness + Premedication",detail:"CroFab: hypersensitivity reactions in ~14%. Pre-mix in 250 mL NS. Epinephrine, diphenhydramine, corticosteroids at bedside. Do NOT skin test — not predictive and delays treatment."},
  ],
  beta:[
    {icon:"📊",label:"ECG — HR, PR, QRS, QTc",detail:"Bradycardia, first/second/third degree AV block, wide complex rhythm. CCB: profound bradycardia or vasodilation depending on class. Serial ECGs with every intervention. Continuous telemetry."},
    {icon:"🩸",label:"BMP + Glucose",detail:"Glucose: hyperglycemia in CCB (inhibits pancreatic insulin release) is a DIAGNOSTIC CLUE. Lactate for cardiogenic shock. K⁺ (calcium therapy causes shift). Monitor q30 min during HDIE insulin therapy."},
    {icon:"🏥",label:"Drug Level (if available)",detail:"Not routinely available real-time but confirms diagnosis. Clinical presentation (degree of block, BP) is more important for management decisions than level."},
    {icon:"💊",label:"Medication Bottle + Pill Count",detail:"Identify exact agent and formulation. Extended-release formulations (amlodipine, diltiazem ER, metoprolol succinate): delayed and prolonged toxicity — 24h+ observation, WBCT if <2h post-ingestion."},
    {icon:"🫀",label:"Bedside Echo / POCUS",detail:"LV function — cardiogenic shock assessment. Pericardial effusion (rare). Guides vasopressor selection. Serial assessment during resuscitation. Diltiazem: negative inotropy + chronotropy; amlodipine: primarily vasodilation."},
  ],
};

/* ═══ TREATMENT ═════════════════════════════════════════════════════ */
const TREATMENT = {
  opioid:[
    {cat:"First-Line Reversal",drug:"Naloxone (Narcan)",dose:"IV/IO: 0.4–2 mg; repeat q2–3 min\nIN: 4 mg per nostril (8 mg total available)\nIM: 0.4–2 mg deltoid or anterolateral thigh\nETT: 2–4 mg diluted in 10 mL NS\nGoal: RR >12, not full reversal",renal:"No dose adjustment. Renally cleared metabolites are inactive.",ivpo:"Buprenorphine OD: may need 4–10 mg or more naloxone. Partial response expected.\nMethadone OD: prolonged duration — infusion preferred.",deesc:"Naloxone infusion: 2/3 of reversal dose/hour. E.g., if 2 mg reversed → 1.3 mg/h. Titrate by RR.",note:"Duration 30–90 min — shorter than most opioids. Observe ≥6h after reversal. ICU for extended-release or fentanyl patch OD.",ref:"ToxBase 2024"},
    {cat:"Supportive",drug:"BVM / Supplemental O₂",dose:"If apnoeic or RR <8: BVM ventilation before naloxone\nNasal cannula 2–4 L/min for mild hypoventilation\nIntubation if: unresponsive to naloxone, aspiration, airway compromise",renal:"N/A",ivpo:"Avoid intubation if naloxone likely to work — post-intubation care is resource-intensive.",deesc:"Remove O₂ supplementation as naloxone reverses respiratory depression. Reassess q15 min.",note:"Aspiration is a key complication — place lateral decubitus position. Do not delay airway management for blood glucose check.",ref:""},
  ],
  stimulant:[
    {cat:"Agitation / Hyperthermia (First-Line)",drug:"Benzodiazepines",dose:"Lorazepam: 2–4 mg IV q5 min\nDiazepam: 5–10 mg IV q5 min\nMidazolam: 5–10 mg IM (fastest onset IM)\nTitrate to calm — large doses may be required",renal:"Lorazepam: no adjustment. Midazolam: active metabolite accumulates in renal failure — use lorazepam.",ivpo:"Droperidol 5–10 mg IM if benzos insufficient. Ketamine 4–5 mg/kg IM for violent agitation (caution: increases HR/BP).",deesc:"Cooling measures: remove clothes, ice packs to axilla/groin/neck, mist fans, cold IV fluids. Target temp <38.5°C.",note:"BZDs treat BOTH agitation AND hypertension in stimulant toxicity. Avoid antipsychotics that lower seizure threshold.",ref:"UpToDate 2024"},
    {cat:"Cocaine Chest Pain",drug:"Aspirin + Nitrates + CCBs",dose:"Aspirin 325 mg PO (antiplatelet for thrombosis)\nNitroglycerin 0.4 mg SL q5 min (vasospasm)\nDiltiazem 0.25 mg/kg IV (coronary vasospasm, rate control)\nHeparin if NSTEMI criteria met",renal:"NTG: no adjustment. Diltiazem: dose reduction in severe renal failure.",ivpo:"Phentolamine 1–2.5 mg IV if refractory hypertension with cocaine — alpha-blocker.",deesc:"Avoid: propranolol / metoprolol (unopposed alpha → paradoxical HTN). Labetalol has some alpha-blockade — use cautiously.",note:"NTG + benzodiazepines resolve majority of cocaine chest pain without cardiac catheterisation.",ref:"AHA 2023"},
  ],
  cholinerg:[
    {cat:"Muscarinic Reversal (First-Line)",drug:"Atropine",dose:"Initial: 2–4 mg IV q5–10 min\nSevere: 10–20 mg IV as initial dose\nTotal: may require 50–200 mg or more\nEndpoint: DRY SECRETIONS (lung fields clear)\nNOT heart rate, NOT pupil size",renal:"No adjustment. Large doses stored for anticipated ongoing use.",ivpo:"Glycopyrrolate (0.1–0.2 mg/kg): peripheral muscarinic blockade only — does not cross BBB. Adjunct if CNS effects manageable.",deesc:"Titrate atropine down once secretions controlled. Re-escalate if secretions recur. Long-acting OPs may require days of treatment.",note:"CRITICAL: Endpoint is SECRETION CONTROL not pupil size or heart rate. Under-treating leads to death from bronchospasm.",ref:"WHO OP Poisoning Guidelines"},
    {cat:"ADH Inhibitor",drug:"Pralidoxime (2-PAM)",dose:"1–2 g IV over 15–30 min (dilute in 100 mL NS)\nThen 250–500 mg/h infusion\nMaximum benefit: within 24–48h of exposure\nFor organophosphates ONLY (not carbamates)",renal:"Renally cleared — reduce infusion rate in significant renal failure.",ivpo:"If IV unavailable: autoinjector (600 mg IM) × 3 in severe exposure.",deesc:"Controversy exists around 2-PAM benefit in some settings. Atropine remains primary treatment — 2-PAM is adjunct.",note:"2-PAM prevents 'aging' (irreversible OP-enzyme bond). Ineffective once aging complete (>24–48h depending on agent).",ref:"WHO Guidelines"},
  ],
  anticholinerg:[
    {cat:"TCA — Sodium Bicarbonate (First-Line)",drug:"NaHCO₃ 8.4% (1 mEq/mL)",dose:"Bolus: 1–2 mEq/kg IV over 1–2 min\nRepeat boluses for persistent QRS widening or dysrhythmia\nInfusion: 3 amps NaHCO₃ in 1L D5W\nTarget: serum pH 7.50–7.55, QRS <100 ms",renal:"Caution: sodium load in renal failure. Adjust infusion rate. Monitor electrolytes.",ivpo:"Hyperventilation: adjunct for rapid alkalinization in intubated patients — target pCO₂ 25–30 mmHg.",deesc:"Once QRS normalizes and patient stable: wean bicarb infusion over 6–12h. Maintain pH monitoring q2–4h.",note:"Sodium bicarbonate works by: (1) sodium current reversal at blocked channels, (2) alkalosis reduces TCA-channel binding.",ref:"UpToDate 2024"},
    {cat:"Pure Anticholinergic — Antidote",drug:"Physostigmine",dose:"Adults: 1–2 mg slow IV over 5 min\nChildren: 0.02 mg/kg slow IV\nOnset: 5–15 min\nRepeat 1–2 mg in 10–30 min if needed",renal:"No dose adjustment. Duration 30–60 min — repeat dosing often required.",ivpo:"CONTRAINDICATIONS: TCA overdose (can cause asystole), asthma, COPD, GI obstruction, intestinal ileus.",deesc:"Benzodiazepines for agitation as alternative — safer when TCA cannot be excluded.",note:"ONLY use physostigmine if TCA overdose is definitively excluded. Diagnostic tool AND antidote for pure anticholinergic toxicity.",ref:""},
  ],
  serotonin:[
    {cat:"Sedation / Seizure Control",drug:"Benzodiazepines",dose:"Diazepam 5–10 mg IV q5–10 min (titrate)\nLorazepam 2–4 mg IV q5 min\nFor hyperthermia: BZDs reduce agitation and muscle activity → reduce heat production",renal:"Lorazepam preferred in renal failure (no active metabolites).",ivpo:"Propofol: for severe cases requiring intubation and NMB for temperature control.",deesc:"For mild-moderate SS: stop offending agent + BZDs. For severe: ICU + cyproheptadine + aggressive cooling.",note:"Stop ALL serotonergic medications immediately. If MAOI interaction: avoid foods/drugs for 2 weeks after discontinuation.",ref:""},
    {cat:"5-HT Antagonist",drug:"Cyproheptadine",dose:"Loading: 12 mg PO or crushed via NG tube\nMaintenance: 2 mg q2h (reassess q8h)\nMaximum: 32 mg/day\nClinical response: symptom improvement in 1–2h",renal:"No specific dose adjustment. Hepatic metabolism.",ivpo:"Chlorpromazine 50–100 mg IM/IV: alternative 5-HT2A antagonist. Caution: hypotension.",deesc:"Continue until symptoms resolve. Taper over 24–48h once clonus/agitation controlled.",note:"No IV formulation available — must use oral/NG route. Antihistamine effect may cause sedation (beneficial).",ref:"Boyer & Shannon NEJM 2005"},
  ],
  acetaminophen:[
    {cat:"First-Line Antidote",drug:"N-Acetylcysteine (NAC) — IV Protocol",dose:"Load: 150 mg/kg in 200 mL D5W over 60 min\nMaintenance 1: 50 mg/kg in 500 mL D5W over 4h\nMaintenance 2: 100 mg/kg in 1000 mL D5W over 16h\nTotal: 21h IV protocol",renal:"No dose adjustment. Safe in renal failure.",ivpo:"Oral NAC: 140 mg/kg load, then 70 mg/kg q4h × 17 doses — equivalent efficacy but poor tolerance (GI).",deesc:"Extended NAC indications: hepatotoxicity developing (rising AST), ingestion >24h prior, unknown time.",note:"NAC replenishes glutathione stores — critical to give early (<8h post-ingestion for best outcomes). Does not require diagnosis confirmation to start.",ref:"Rumack-Matthew / Acetylcysteine SPC"},
    {cat:"Decontamination",drug:"Activated Charcoal (AC)",dose:"1 g/kg PO (max 50 g) if within 2–4h of ingestion\nWill reduce absorption — benefit decreases after 2h\nDo NOT give if: altered consciousness, ileus, caustic ingestion",renal:"No adjustment. GI elimination.",ivpo:"WBCT (whole bowel irrigation) with GoLYTELY 2 L/h adult: for extended-release formulations.",deesc:"Consider charcoal if <2h post-ingestion, intact airway, able to cooperate.",note:"APAP is rapidly absorbed — charcoal benefit limited beyond 2h. Never delay NAC for charcoal administration.",ref:""},
  ],
  salicylate:[
    {cat:"Alkalinization",drug:"Sodium Bicarbonate Infusion",dose:"Bolus: 1–2 mEq/kg IV (correct pH <7.35)\nInfusion: 150 mEq NaHCO₃ (3 amps) in 1L D5W\nAdd 40 mEq KCl to infusion\nTarget: urine pH 7.5–8.0, serum pH 7.45–7.55\nRate: 1.5–2× maintenance",renal:"Caution: fluid overload in renal failure — HD may be required concurrently.",ivpo:"Correct potassium FIRST (hypokalaemia prevents urinary alkalinization). Cannot alkalinize urine without adequate K⁺.",deesc:"Monitor urine pH q2h. Serum electrolytes and pH q4h. Wean when salicylate level declining and clinical improvement.",note:"CRITICAL: maintain patient's spontaneous hyperventilation — DO NOT sedate unless intubating. If intubating: hyperventilate to match pre-intubation pCO₂.",ref:"Flomenbaum et al."},
    {cat:"HD Criteria",drug:"Hemodialysis Indications",dose:"ANY of the following:\n• Salicylate >100 mg/dL\n• pH <7.20 refractory to bicarb\n• Pulmonary edema\n• AKI (impairs elimination)\n• CNS changes (cerebral edema)\n• Clinical deterioration despite therapy",renal:"HD is both supportive (fluid removal) and eliminative (salicylate clearance) in renal failure.",ivpo:"CVVHD less effective than HD for salicylate removal — prefer intermittent HD if hemodynamically stable.",deesc:"Early nephrology consult for all moderate-severe salicylate poisoning.",note:"Salicylate poisoning: better to err towards early HD than wait for full deterioration.",ref:""},
  ],
  tca:[
    {cat:"Sodium Bicarbonate",drug:"NaHCO₃ — TCA Cardiac Protocol",dose:"Bolus: 1–2 mEq/kg IV over 1–2 min\nRepeat q5–10 min for dysrhythmia or QRS >100ms\nInfusion: 3 amps NaHCO₃ in D5W at 2× maintenance\nTarget: pH 7.50–7.55, serum Na 150–155 mEq/L",renal:"Monitor electrolytes closely. Sodium load significant in renal failure.",ivpo:"Hypertonic saline (3%): if bicarb fails and QRS persistently wide — 1–2 mL/kg IV.",deesc:"Wean bicarb when QRS <100ms stable for 6h. Taper gradually — abrupt stop can cause QRS re-widening.",note:"Dual mechanism: (1) sodium reverses channel blockade, (2) alkalosis reduces TCA binding affinity to Na channels.",ref:"UpToDate 2024"},
    {cat:"Seizure Management",drug:"Benzodiazepines",dose:"Lorazepam 2–4 mg IV\nDiazepam 5–10 mg IV\nRepeat q5 min PRN\nIf refractory: propofol or barbiturate coma",renal:"Lorazepam preferred in renal failure.",ivpo:"AVOID: phenytoin (worsens sodium channel toxicity), physostigmine (asystole), antipsychotics (lower seizure threshold).",deesc:"If 2+ seizures despite BZDs: intubation + propofol infusion. Continue bicarb. Re-check APAP (common co-ingestant).",note:"Seizures → lactic acidosis → worsens sodium channel toxicity (vicious cycle). Aggressive BZD use is critical.",ref:""},
  ],
  methanol:[
    {cat:"ADH Inhibitor (First-Line)",drug:"Fomepizole (4-Methylpyrazole)",dose:"Loading: 15 mg/kg IV over 30 min\nMaintenance: 10 mg/kg q12h × 4 doses\nThen: 15 mg/kg q12h (enzyme induction)\nDuring HD: 1–1.5 mg/kg/h infusion or dose q4h",renal:"Continue fomepizole during HD — cleared by dialysis, so supplemental dosing required.",ivpo:"Ethanol (EtOH): if fomepizole unavailable — target blood EtOH 100–150 mg/dL. Oral or IV route.",deesc:"Continue until methanol/EG undetectable, pH normalized, osmol gap normal.",note:"Fomepizole is expensive but far preferable to ethanol — no CNS depression, easier to dose, no monitoring of EtOH levels needed.",ref:"Barceloux et al. 2002"},
    {cat:"HD Criteria",drug:"Hemodialysis Indications",dose:"ANY of the following:\n• Methanol >50 mg/dL\n• Ethylene glycol >50 mg/dL\n• pH <7.25–7.30\n• Visual changes (methanol)\n• Renal failure\n• Deterioration despite fomepizole\nHD also removes toxic metabolites (formate, oxalate)",renal:"HD corrects metabolic acidosis AND removes parent compound and toxic metabolites.",ivpo:"CVVHD as bridge if HD not immediately available — less effective but better than nothing.",deesc:"Continue fomepizole during HD (supplement dosing). Stop when level <20 mg/dL and pH normalized.",note:"Early nephrology consult in all significant toxic alcohol exposures. Do NOT wait for visual symptoms in methanol.",ref:""},
    {cat:"Supportive",drug:"Folic Acid (Methanol) / Thiamine + Pyridoxine (EG)",dose:"Methanol: Folic acid 50 mg IV q4–6h (enhances formate metabolism)\nEthylene Glycol: Thiamine 100 mg IV q6h + Pyridoxine 50 mg IV q6h (shift oxalate away from toxic pathway)\nMagnesium: 2 g IV if deficient (cofactor for oxalate metabolism)",renal:"No significant adjustment.",ivpo:"Leucovorin (folinic acid) 1–2 mg/kg IV: preferred over folic acid for methanol (active form).",deesc:"Continue cofactors until levels undetectable. Inexpensive, safe — no reason to withhold.",note:"Cofactor therapy is adjunct — fomepizole + HD are the definitive treatments.",ref:""},
  ],
  co:[
    {cat:"First-Line O₂ Therapy",drug:"100% Non-Rebreather Mask",dose:"15 L/min O₂ via tight-fitting NRB immediately\nHalf-life of CO:\n  Room air: ~4–5 hours\n  100% O₂: ~60–90 min\n  HBO: ~20–30 min\nContinue until COHb <5%",renal:"No adjustment.",ivpo:"Intubation + 100% FiO₂: if unconscious or cannot protect airway. Same principle, more reliable delivery.",deesc:"Wean O₂ when COHb <5% and symptomatic improvement. Check COHb level at 2h and 4h.",note:"Source identification is critical — evacuate building, prevent re-exposure. Other household members/coworkers may also be poisoned.",ref:"Weaver et al. NEJM 2002"},
    {cat:"Hyperbaric O₂ (HBO)",drug:"HBO — Indications & Protocol",dose:"Indications (any one):\n• COHb >25%\n• LOC at any time\n• Neurological symptoms (confusion, ataxia, vision changes)\n• Cardiac involvement (ECG changes, troponin)\n• Pregnancy + COHb >15%\n• Age <36 months + COHb >15%\nProtocol: 100% O₂ at 2.4–3 ATA × 90–120 min",renal:"No adjustment.",ivpo:"If HBO unavailable: normobaric 100% O₂ × 4–6h. Transfer to HBO centre if meets criteria and transfer feasible.",deesc:"3 HBO sessions in 24h (Weaver protocol) reduced delayed neuropsychiatric sequelae from 30% to <5%.",note:"HBO reduces DNS from 30% → <5%. Transfer for HBO should not delay stabilisation — stabilise first, then transfer.",ref:"Weaver NEJM 2002"},
    {cat:"Cyanide Co-poisoning (Fire Victims)",drug:"Hydroxocobalamin (Cyanokit)",dose:"5 g IV over 15 min (adult)\n70 mg/kg IV (pediatric)\nRepeat 5 g if inadequate response\nMaximum: 15 g total",renal:"No dose adjustment.",ivpo:"Sodium thiosulfate 12.5 g IV: alternative if hydroxocobalamin unavailable. Slower onset.",deesc:"Consider empirically in fire victims with: unexplained lactic acidosis, hemodynamic collapse, coma.",note:"Hydroxocobalamin colours skin/urine dark red — transient and harmless. Will interfere with co-oximetry for several hours.",ref:""},
  ],
  snake:[
    {cat:"Antivenom — CroFab (Crotalidae)",drug:"Crotalidae Polyvalent Immune Fab",dose:"Moderate-Severe: 4–6 vials IV in 250 mL NS over 1h\nMild with progressing: 4–6 vials\nMaintenance: 2 vials q6h × 3 doses if initial control\nRepeat initial dose if: uncontrolled swelling, coagulopathy recurs, hemodynamic compromise",renal:"No dose adjustment. Protein — not renally cleared.",ivpo:"Anavip (F(ab')₂): alternative with longer half-life, potentially fewer recurrence episodes.",deesc:"Recurrence coagulopathy at 2–14 days after antivenom: treat with additional antivenom. Serial labs q4–6h × 18h.",note:"Early antivenom prevents tissue destruction — do not wait for 'severe' features. Allergic reactions in ~14% — premedicate.",ref:"Poison Control / ToxBase"},
    {cat:"Supportive Care",drug:"Wound + Supportive Management",dose:"IV access × 2 large bore\nIV fluids: LR or NS for hypotension / bleeding\nElevate extremity ABOVE heart level\nAnalgesia: opioids PRN (pain is severe)\nTetanus prophylaxis",renal:"Fluid resuscitation as needed — renal protection in hemolysis/rhabdomyolysis.",ivpo:"FFP/cryoprecipitate: for VICC only if life-threatening bleeding — antivenom is preferred over blood products.",deesc:"Remove all rings/jewellery from bitten extremity early — swelling may prevent later removal.",note:"Avoid: incision/suction, electric shock, ice, tourniquets, epinephrine at wound site — all worsen outcomes.",ref:""},
  ],
  beta:[
    {cat:"Calcium",drug:"Calcium Chloride / Calcium Gluconate",dose:"CaCl₂: 1g (10 mL of 10%) IV over 5–10 min via central line\nCa-Gluconate: 3g (30 mL of 10%) IV via peripheral\nRepeat q10–20 min × 3–4 doses\nThen infusion: CaCl₂ 0.2–0.4 mEq/kg/h",renal:"Monitor ionized Ca²⁺ — target 1.5–2× upper normal.",ivpo:"CaCl₂ preferred (3× more bioavailable than Ca-gluconate) but requires central line (tissue necrosis if extravasation).",deesc:"Calcium temporarily improves conduction — provides time for HDIE to work. Do not stop calcium abruptly.",note:"CCB toxicity is the primary indication. Beta-blocker: calcium less effective (different mechanism) but reasonable to try.",ref:""},
    {cat:"High-Dose Insulin Euglycemia (HDIE)",drug:"Insulin + Dextrose",dose:"Bolus: 1 unit/kg regular insulin IV\nPre-bolus: D50 50 mL (25g) IV unless glucose >250\nInfusion: 0.5–1 unit/kg/h (titrate up to 10 units/kg/h)\nD10W infusion: 0.5–1 g/kg/h to maintain glucose 100–200\nMonitor glucose q30 min until stable",renal:"Hypoglycemia risk increased in renal failure — glucose infusion required.",ivpo:"Add potassium: hypokalaemia common during HDIE — replace aggressively.",deesc:"Onset of hemodynamic effect: 20–40 min. May take 60–120 min for full benefit. Do NOT stop early.",note:"HDIE is now FIRST-LINE for significant CCB/BB toxicity. Shifts myocardial metabolism from fat→glucose oxidation. Dramatically improves contractility.",ref:"Holger & Engebretsen 2011"},
    {cat:"Lipid Emulsion Rescue",drug:"Intralipid 20%",dose:"Bolus: 1.5 mL/kg IV over 1 min\nRepeat bolus × 2 q5 min if no response\nThen: 0.25 mL/kg/min infusion × 30–60 min\nMaximum: 12 mL/kg total",renal:"No specific adjustment. Monitor triglycerides.",ivpo:"Glucagon 3–10 mg IV bolus (BB toxicity): cAMP pathway. Less effective for CCB.",deesc:"Lipid emulsion reserved for: refractory shock despite HDIE + calcium + vasopressors + glucagon.",note:"Mechanism: lipid sink — sequesters lipophilic drug in plasma. Most effective for lipophilic agents (verapamil, propranolol, amlodipine).",ref:"ACMT Position Statement 2016"},
  ],
};

const FOLLOWUP = {
  opioid:["Observe ≥6h after naloxone administration","ICU admission for: extended-release opioids, fentanyl patch, clinical deterioration","Harm reduction counselling + naloxone prescription for patient and household contacts","Addiction medicine/social work consultation before discharge","Consider buprenorphine initiation in ED if appropriate"],
  stimulant:["Temperature normalizes before discharge","ECG: QTc <450ms before discharge after cocaine","12–24h observation for cocaine chest pain + troponin trend","Substance use disorder counseling referral","Cardiovascular follow-up for cocaine-associated chest pain"],
  cholinerg:["ICU admission for all significant OP poisoning","Atropine weaning over 24–72h as tolerated — secretion reassessment q2–4h","Intermediate syndrome: proximal muscle weakness 24–96h post-acute phase — can occur even after apparent recovery","Occupational Health referral for pesticide workers","Decontamination of patient belongings and environment"],
  anticholinerg:["TCA: continuous cardiac monitoring ≥6h after QRS normalizes","Psychiatric evaluation before discharge for intentional overdose","Bicarb infusion: wean when QRS <100ms stable for 6h","Re-check APAP level at 4h if co-ingestion possible","Advise patient and family on TCA toxicity risks"],
  serotonin:["ICU for severe SS (hyperthermia >41°C, rigidity, altered mental status)","Stop all serotonergic medications immediately","Medication reconciliation with prescribing physician","If MAOIs involved: 14-day washout before resuming any serotonergic agent","Neuropsychiatric follow-up in 2–4 weeks"],
  acetaminophen:["NAC continued until APAP <10 mcg/mL AND LFTs improving","King's College Criteria: INR >6.5, creatinine >3.4, pH <7.30, age <10 or >40, jaundice to encephalopathy >7 days → transplant evaluation","Hepatology consultation for any hepatotoxicity","Daily LFTs until trending down","Psychiatric evaluation before discharge (intentional OD)"],
  salicylate:["Serial salicylate levels q2–4h until clearly declining","Nephrology for any moderate-severe poisoning — HD decision","Maintain urine alkalinization until levels <30 mg/dL and asymptomatic","Bicarb wean gradually — abrupt stop can cause rebound acidosis","Psychiatric consultation for intentional ingestion"],
  tca:["ICU admission for all significant TCA overdose","Cardiac monitoring ≥24h after QRS normalizes","Bicarb wean: gradual over 6–12h when QRS stable","Psychiatric evaluation before discharge","Prescriber notification — consider alternative antidepressant"],
  methanol:["Ophthalmology consultation for any visual symptoms","HD: coordinate with nephrology early","Continue fomepizole until level <20 mg/dL and pH normalized","Source identification — methanol in illicit alcohol, windscreen washer fluid","Report to public health if cluster (illicit alcohol supply)"],
  co:["COHb recheck at 2h and 4h after initiating 100% O₂","HBO: 3 sessions in 24h if criteria met (Weaver protocol)","Carbon monoxide detector in home — ensure functioning before return","Delayed neuropsychiatric sequelae follow-up at 4 weeks (cognitive testing)","Other household occupants evaluated","Source identification: heating system, vehicle, generator"],
  snake:["Hematology follow-up at 48–72h post-antivenom (recurrence coagulopathy)","24–48h admission after CroFab","Outpatient lab recheck at 2–3 days","Wound care: edema and skin necrosis management","Physiotherapy if significant limb involvement"],
  beta:["ICU mandatory for all significant CCB/BB toxicity","Continuous cardiac monitoring","Glucose monitoring q30min during HDIE, then q1–2h","Calcium and potassium replacement ongoing","Toxicology consultation","Consider ECMO early if progressive deterioration — activate team before arrest"],
};

const REFS = {
  opioid:"ToxBase 2024; Goldfrank's Toxicology 10th Ed; WHO Opioid OD Guidelines 2014",
  stimulant:"Hoffman RS. Cocaine. Up-to-date 2024; AHA Cocaine-Associated CV Emergencies 2023",
  cholinerg:"WHO OP Poisoning Management 2013; Eddleston et al. Lancet 2008",
  anticholinerg:"Flomenbaum et al. Goldfrank's 10th Ed; Dawson & Buckley. Br J Anaesth 2016",
  serotonin:"Boyer & Shannon. NEJM 2005; Hunter Criteria. QJM 2003",
  acetaminophen:"Rumack-Matthew Nomogram 1975; NAC Protocol — Prescott et al; King's College Criteria 1989",
  salicylate:"Flomenbaum et al. Goldfrank's; Dargan & Jones. Postgrad Med J 2002",
  tca:"Woolf et al. Am J Emerg Med 1989; Harrigan & Brady. J Emerg Med 1999; UpToDate 2024",
  methanol:"Barceloux et al. J Toxicol Clin Toxicol 2002; Zakharov et al. Ann Emerg Med 2014",
  co:"Weaver SC et al. NEJM 2002; Hampson et al. JAMA 1995",
  snake:"CroFab PI; Boyer et al. AJEM 2001; Poison Control",
  beta:"Holger & Engebretsen. Clin Toxicol 2011; ACMT Lipid Emulsion Position 2016; St-Onge et al. Clin Toxicol 2017",
};

/* ═══ DRUG ROW ══════════════════════════════════════════════════════ */
function DrugRow({ rx }) {
  const [open, setOpen] = useState(null);
  const panels = [
    {k:"renal", icon:"📋", label:"Renal / Detail",    color:T.blue},
    {k:"ivpo",  icon:"🔧", label:"Alternative / Tips", color:T.teal},
    {k:"deesc", icon:"📉", label:"Wean / Monitor",    color:T.green},
  ];
  const refBadge = (ref) => {
    if (!ref) return {bg:"rgba(155,109,255,0.1)",border:"1px solid rgba(155,109,255,0.3)",color:T.purple};
    if (ref.includes("NEJM")) return {bg:"rgba(0,229,192,0.1)",border:"1px solid rgba(0,229,192,0.4)",color:T.teal};
    return {bg:"rgba(155,109,255,0.1)",border:"1px solid rgba(155,109,255,0.3)",color:T.purple};
  };
  const rs = refBadge(rx.ref);
  return (
    <div style={{background:"rgba(14,37,68,0.45)",border:`1px solid ${T.b}`,borderRadius:10,marginBottom:8,overflow:"hidden"}}>
      <div style={{padding:"11px 14px"}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8,marginBottom:4}}>
          <div>
            <div style={{fontSize:12,fontWeight:700,color:T.txt}}>{rx.drug}</div>
            {rx.cat && <div style={{fontSize:10,color:T.txt3,marginTop:1}}>{rx.cat}</div>}
          </div>
          {rx.ref && <span style={{fontSize:9,fontFamily:"monospace",fontWeight:700,padding:"2px 7px",borderRadius:20,flexShrink:0,...rs}}>{rx.ref}</span>}
        </div>
        <div style={{fontSize:12,color:T.txt2,fontFamily:"monospace",lineHeight:1.6,whiteSpace:"pre-wrap"}}>{rx.dose}</div>
        {rx.note && <div style={{fontSize:10,color:T.txt3,marginTop:4,lineHeight:1.45}}>{rx.note}</div>}
      </div>
      <div style={{display:"flex",borderTop:`1px solid ${T.b}`,background:"rgba(5,15,30,0.4)"}}>
        {panels.filter(p=>rx[p.k]).map((p,i,arr)=>(
          <button key={p.k} onClick={()=>setOpen(open===p.k?null:p.k)} style={{flex:1,padding:"6px 4px",border:"none",borderRight:i<arr.length-1?`1px solid ${T.b}`:"none",background:open===p.k?`${p.color}12`:"transparent",color:open===p.k?p.color:T.txt4,fontSize:10,fontWeight:open===p.k?700:500,cursor:"pointer",fontFamily:"sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
            <span>{p.icon}</span>{p.label}
          </button>
        ))}
      </div>
      {open && rx[open] && (
        <div style={{padding:"10px 14px",background:`${panels.find(p=>p.k===open)?.color}08`,borderTop:`1px solid ${panels.find(p=>p.k===open)?.color}25`,fontSize:11,color:T.txt2,lineHeight:1.65,whiteSpace:"pre-wrap"}}>
          <span style={{color:panels.find(p=>p.k===open)?.color,fontWeight:700,marginRight:6}}>{panels.find(p=>p.k===open)?.icon}</span>{rx[open]}
        </div>
      )}
    </div>
  );
}

/* ═══ CONDITION PAGE ════════════════════════════════════════════════ */
function ConditionPage({ cond, onBack }) {
  const [tab, setTab] = useState("overview");
  const [checked, setChecked] = useState({});
  const ov = OVERVIEW[cond.id] || {};
  const rx = TREATMENT[cond.id] || [];
  const wu = WORKUP[cond.id] || [];
  const fu = FOLLOWUP[cond.id] || [];
  const tabs = [
    {id:"overview",  label:"Overview",  icon:"📋"},
    {id:"workup",    label:"Workup",    icon:"✅"},
    {id:"treatment", label:"Treatment", icon:"⚗️"},
    {id:"followup",  label:"Follow-up", icon:"📅"},
  ];
  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      <div style={{padding:"14px 20px 0",flexShrink:0}}>
        <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:6,background:"rgba(14,37,68,0.5)",border:`1px solid ${T.b}`,borderRadius:7,padding:"5px 12px",color:T.txt3,fontSize:11,cursor:"pointer",fontFamily:"sans-serif",marginBottom:12}}>← Back</button>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
          <div style={{width:44,height:44,borderRadius:12,background:cond.gl,border:`1px solid ${cond.br}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{cond.icon}</div>
          <div>
            <div style={{fontSize:16,fontWeight:700,color:T.txt,fontFamily:"'Playfair Display',serif"}}>{cond.title}</div>
            <div style={{fontSize:11,color:T.txt3}}>{cond.sub}</div>
          </div>
          <span style={{marginLeft:"auto",fontSize:9,fontFamily:"monospace",padding:"2px 8px",borderRadius:20,background:cond.gl,border:`1px solid ${cond.br}`,color:cond.color,fontWeight:700}}>{cond.cat.toUpperCase()}</span>
        </div>
        <div style={{display:"flex",gap:4,borderBottom:`1px solid ${T.b}`}}>
          {tabs.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"6px 14px",border:"none",borderBottom:tab===t.id?`2px solid ${cond.color}`:"2px solid transparent",background:"transparent",color:tab===t.id?T.txt:T.txt3,fontSize:11,fontWeight:tab===t.id?700:400,cursor:"pointer",fontFamily:"sans-serif",display:"flex",alignItems:"center",gap:5,marginBottom:-1}}>
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"16px 20px 24px"}}>
        {tab==="overview" && (
          <div>
            <div style={{background:"rgba(14,37,68,0.5)",border:`1px solid ${cond.br}`,borderLeft:`3px solid ${cond.color}`,borderRadius:8,padding:"12px 14px",marginBottom:14,fontSize:12,color:T.txt2,lineHeight:1.7}}>{ov.def}</div>
            {ov.bullets?.map((b,i)=>(
              <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"7px 0",borderBottom:i<ov.bullets.length-1?`1px solid rgba(26,53,85,0.4)`:"none"}}>
                <div style={{width:16,height:16,borderRadius:4,background:cond.gl,border:`1px solid ${cond.br}`,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:cond.color,marginTop:1}}>▪</div>
                <div style={{fontSize:12,color:T.txt2,lineHeight:1.55}}>{b}</div>
              </div>
            ))}
          </div>
        )}
        {tab==="workup" && (
          <div>
            {wu.map((item,i)=>(
              <div key={i} onClick={()=>setChecked(p=>({...p,[i]:!p[i]}))} style={{display:"flex",gap:12,alignItems:"flex-start",background:checked[i]?"rgba(0,229,192,0.07)":"rgba(14,37,68,0.4)",border:`1px solid ${checked[i]?"rgba(0,229,192,0.3)":T.b}`,borderRadius:9,padding:"11px 14px",marginBottom:8,cursor:"pointer"}}>
                <div style={{width:32,height:32,borderRadius:8,background:checked[i]?"rgba(0,229,192,0.15)":"rgba(14,37,68,0.6)",border:`1px solid ${checked[i]?"rgba(0,229,192,0.5)":T.b}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{checked[i]?"✓":item.icon}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,fontWeight:600,color:checked[i]?T.teal:T.txt,marginBottom:3}}>{item.label}</div>
                  <div style={{fontSize:11,color:T.txt3,lineHeight:1.55}}>{item.detail}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        {tab==="treatment" && (
          <div>
            {rx.length>0 ? rx.map((r,i)=><DrugRow key={i} rx={r} />) : <div style={{fontSize:12,color:T.txt3,textAlign:"center",padding:"32px 0"}}>No protocol data available</div>}
          </div>
        )}
        {tab==="followup" && (
          <div>
            {fu.map((item,i)=>(
              <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"9px 12px",background:"rgba(14,37,68,0.4)",border:`1px solid ${T.b}`,borderRadius:8,marginBottom:6}}>
                <div style={{width:22,height:22,borderRadius:6,background:"rgba(0,229,192,0.1)",border:"1px solid rgba(0,229,192,0.25)",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:T.teal,fontWeight:700,marginTop:1}}>{i+1}</div>
                <div style={{fontSize:12,color:T.txt2,lineHeight:1.6}}>{item}</div>
              </div>
            ))}
            {REFS[cond.id] && (
              <div style={{marginTop:14,padding:"10px 14px",background:"rgba(155,109,255,0.06)",border:"1px solid rgba(155,109,255,0.2)",borderRadius:8,fontSize:10,color:T.txt3,lineHeight:1.65}}>
                <span style={{color:T.purple,fontWeight:700,marginRight:6}}>📚</span>{REFS[cond.id]}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══ MAIN HUB ══════════════════════════════════════════════════════ */
export default function ToxicologyHub() {
  const navigate = useNavigate();
  const [activeCat, setActiveCat] = useState("All");
  const [selected, setSelected] = useState(null);

  const filtered = activeCat==="All" ? CONDITIONS : CONDITIONS.filter(c=>c.cat===activeCat);
  const catCounts = CATS.reduce((a,c)=>({...a,[c]:CONDITIONS.filter(x=>x.cat===c).length}),{});

  if (selected) {
    const cond = CONDITIONS.find(c=>c.id===selected);
    if (cond) return (
      <div style={{height:"100vh",background:T.bg,color:T.txt,fontFamily:"'DM Sans',sans-serif",display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <ConditionPage cond={cond} onBack={()=>setSelected(null)} />
      </div>
    );
  }

  return (
    <div style={{height:"100vh",background:T.bg,color:T.txt,fontFamily:"'DM Sans',sans-serif",display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(26,53,85,0.9);border-radius:2px}input,button{font-family:inherit}`}</style>

      {/* Header */}
      <div style={{background:T.panel,borderBottom:`1px solid ${T.b}`,padding:"14px 20px",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
          <button onClick={()=>navigate("/hub")} style={{display:"flex",alignItems:"center",gap:6,background:"rgba(8,22,40,0.7)",border:"1px solid rgba(61,255,160,0.3)",borderRadius:8,padding:"5px 12px",color:T.green,fontSize:11,fontWeight:700,cursor:"pointer",flexShrink:0}}>← Hub</button>
          <div style={{width:40,height:40,borderRadius:11,background:"rgba(61,255,160,0.12)",border:"1px solid rgba(61,255,160,0.35)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>☠️</div>
          <div>
            <div style={{fontSize:18,fontWeight:700,color:T.txt,fontFamily:"'Playfair Display',serif",lineHeight:1.2}}>Toxicology Hub</div>
            <div style={{fontSize:10,color:T.txt3}}>Toxidromes · Antidotes · Environmental · Overdose Protocols</div>
          </div>
          <div style={{marginLeft:"auto",display:"flex",gap:6,flexShrink:0}}>
            {["Goldfrank's 10th","ToxBase 2024","Poison Control"].map(b=>(
              <span key={b} style={{fontSize:9,fontFamily:"monospace",fontWeight:700,padding:"3px 9px",borderRadius:20,background:"rgba(61,255,160,0.1)",border:"1px solid rgba(61,255,160,0.3)",color:T.green}}>{b}</span>
            ))}
          </div>
        </div>
        {/* Category filter */}
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {["All",...CATS].map(c=>(
            <button key={c} onClick={()=>setActiveCat(c)} style={{padding:"5px 13px",borderRadius:20,border:`1px solid ${activeCat===c?"rgba(61,255,160,0.45)":T.b}`,background:activeCat===c?"rgba(61,255,160,0.12)":"transparent",color:activeCat===c?T.green:T.txt3,fontSize:11,fontWeight:activeCat===c?700:400,cursor:"pointer",fontFamily:"sans-serif",display:"flex",alignItems:"center",gap:5}}>
              {c} {c!=="All" && <span style={{fontSize:9,fontFamily:"monospace",color:activeCat===c?T.green:T.txt4}}>({catCounts[c]})</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div style={{flex:1,overflowY:"auto",padding:"16px 20px 24px"}}>
        {/* Quick reference banner */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:16}}>
          {[
            {icon:"📞",label:"Poison Control",val:"1-800-222-1222",color:T.green},
            {icon:"⏱",label:"Naloxone onset",val:"2–5 min IV",color:T.orange},
            {icon:"🧪",label:"NAC window",val:"Best <8h post-APAP",color:T.teal},
            {icon:"📺",label:"CO pulse ox",val:"Falsely NORMAL",color:T.coral},
          ].map((s,i)=>(
            <div key={i} style={{background:"rgba(14,37,68,0.5)",border:`1px solid ${s.color}30`,borderRadius:10,padding:"10px 12px",textAlign:"center"}}>
              <div style={{fontSize:18,marginBottom:4}}>{s.icon}</div>
              <div style={{fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:".06em",marginBottom:2}}>{s.label}</div>
              <div style={{fontSize:11,fontWeight:700,color:s.color,fontFamily:"monospace"}}>{s.val}</div>
            </div>
          ))}
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12}}>
          {filtered.map(c=>(
            <div key={c.id} onClick={()=>setSelected(c.id)}
              style={{background:c.gl,border:`1px solid ${c.br}`,borderRadius:12,padding:"14px 16px",cursor:"pointer",transition:"all .2s",position:"relative",overflow:"hidden"}}
              onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=`0 8px 24px ${c.color}20`}}
              onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none"}}>
              <div style={{position:"absolute",top:-20,right:-20,width:80,height:80,borderRadius:"50%",background:c.gl,opacity:.5}} />
              <div style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:10}}>
                <div style={{width:40,height:40,borderRadius:10,background:c.gl,border:`1px solid ${c.br}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{c.icon}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700,color:T.txt}}>{c.title}</div>
                  <div style={{fontSize:10,color:T.txt3,marginTop:1}}>{c.sub}</div>
                </div>
                <span style={{fontSize:9,fontFamily:"monospace",padding:"2px 7px",borderRadius:20,background:c.gl,border:`1px solid ${c.br}`,color:c.color,fontWeight:700,flexShrink:0}}>{c.cat}</span>
              </div>
              <div style={{display:"flex",gap:8,marginTop:10,fontSize:9,color:T.txt3,flexWrap:"wrap"}}>
                {TREATMENT[c.id]?.length>0 && <span style={{padding:"2px 7px",borderRadius:20,background:"rgba(0,229,192,0.08)",border:"1px solid rgba(0,229,192,0.2)",color:T.teal}}>⚗️ {TREATMENT[c.id].length} antidotes</span>}
                {WORKUP[c.id]?.length>0 && <span style={{padding:"2px 7px",borderRadius:20,background:"rgba(59,158,255,0.08)",border:"1px solid rgba(59,158,255,0.2)",color:T.blue}}>✅ {WORKUP[c.id].length} workup items</span>}
              </div>
            </div>
          ))}
        </div>

        <div style={{marginTop:20,padding:"12px 16px",background:"rgba(14,37,68,0.4)",border:`1px solid ${T.b}`,borderRadius:10,display:"flex",gap:16,flexWrap:"wrap",alignItems:"center"}}>
          <span style={{fontSize:9,fontWeight:700,color:T.txt4,textTransform:"uppercase",letterSpacing:".07em",flexShrink:0}}>Evidence Base</span>
          {["Goldfrank's Toxicology 10th Ed","ToxBase 2024","WHO Poisoning Guidelines","Weaver NEJM 2002 (CO)","Boyer & Shannon NEJM 2005 (SS)","Rumack-Matthew Nomogram","ACMT Position Statements"].map(e=>(
            <span key={e} style={{fontSize:9,color:T.txt4,fontFamily:"monospace"}}>{e}</span>
          ))}
        </div>
      </div>
    </div>
  );
}