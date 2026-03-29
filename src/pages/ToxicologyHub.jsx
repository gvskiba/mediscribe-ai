import { useState } from "react";

// ── Design Tokens ──────────────────────────────────────────────────
const T = {
  bg:"#050f1e", panel:"#081628", card:"#0b1e36", up:"#0e2544",
  b:"rgba(26,53,85,0.8)", bhi:"rgba(42,79,122,0.9)",
  txt:"#e8f0fe", txt2:"#8aaccc", txt3:"#4a6a8a", txt4:"#2e4a6a",
  coral:"#ff6b6b", gold:"#f5c842", teal:"#00e5c0", blue:"#3b9eff",
  orange:"#ff9f43", purple:"#9b6dff", green:"#3dffa0", cyan:"#00d4ff",
};

// ── Font + Style Injection ─────────────────────────────────────────
(() => {
  if (document.getElementById("ntrya-fonts")) return;
  const l = document.createElement("link"); l.id="ntrya-fonts";
  l.rel="stylesheet";
  l.href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id="ntrya-css";
  s.textContent = `
    *{box-sizing:border-box;margin:0;padding:0;}
    ::-webkit-scrollbar{width:3px;height:3px;}
    ::-webkit-scrollbar-track{background:transparent;}
    ::-webkit-scrollbar-thumb{background:rgba(42,79,122,0.5);border-radius:2px;}
    .glass{backdrop-filter:blur(24px) saturate(200%);-webkit-backdrop-filter:blur(24px) saturate(200%);}
    .glass-deep{backdrop-filter:blur(40px) saturate(220%);-webkit-backdrop-filter:blur(40px) saturate(220%);}
    @keyframes fadeSlide{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
    @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
    @keyframes pulseRing{0%,100%{opacity:.4;transform:scale(1)}50%{opacity:.8;transform:scale(1.02)}}
    @keyframes glow{0%,100%{box-shadow:0 0 8px var(--gc,#ff6b6b)}50%{box-shadow:0 0 20px var(--gc,#ff6b6b)}}
    .fade-in{animation:fadeSlide .35s ease forwards;}
    .cond-item{transition:all .2s ease;cursor:pointer;}
    .cond-item:hover{transform:translateX(3px);}
    .tab-pill{transition:all .2s ease;cursor:pointer;}
    .tab-pill:hover{opacity:.9;}
    .drug-acc{transition:max-height .3s cubic-bezier(.4,0,.2,1),opacity .3s ease;}
    .banner-item{animation:pulseRing 4s ease infinite;}
    .shimmer-text{
      background:linear-gradient(90deg,#e8f0fe 0%,#ffffff 40%,#8aaccc 60%,#e8f0fe 100%);
      background-size:200% auto;
      -webkit-background-clip:text;-webkit-text-fill-color:transparent;
      background-clip:text;
      animation:shimmer 4s linear infinite;
    }
    .cond-active::before{
      content:'';position:absolute;left:0;top:10%;height:80%;width:2px;
      background:var(--cc,#ff6b6b);border-radius:2px;
      box-shadow:0 0 8px var(--cc,#ff6b6b);
    }
  `;
  document.head.appendChild(s);
})();

// ── Conditions ─────────────────────────────────────────────────────
const CONDITIONS = [
  { id:"opioid",         icon:"💊", title:"Opioid Toxidrome",      sub:"Resp. Depression · Miosis",     cat:"Toxidrome", color:T.coral,  gl:"rgba(255,107,107,0.1)",  br:"rgba(255,107,107,0.4)" },
  { id:"sympatho",       icon:"⚡", title:"Sympathomimetic",        sub:"HTN · Agitation · Hyperthermia",cat:"Toxidrome", color:T.orange, gl:"rgba(255,159,67,0.1)",   br:"rgba(255,159,67,0.4)"  },
  { id:"cholinergic",    icon:"🧪", title:"Cholinergic (SLUDGE)",   sub:"OP · Nerve Agent · SLUDGE-M",   cat:"Toxidrome", color:T.teal,   gl:"rgba(0,229,192,0.1)",    br:"rgba(0,229,192,0.4)"   },
  { id:"anticholinergic",icon:"🌡️", title:"Anticholinergic",        sub:"Mad Hatter · Mydriasis",        cat:"Toxidrome", color:T.purple, gl:"rgba(155,109,255,0.1)",  br:"rgba(155,109,255,0.4)" },
  { id:"sedative",       icon:"😴", title:"Sedative-Hypnotic",      sub:"CNS Depression · BZD/GHB",      cat:"Toxidrome", color:T.blue,   gl:"rgba(59,158,255,0.1)",   br:"rgba(59,158,255,0.4)"  },
  { id:"serotonin",      icon:"🔥", title:"Serotonin Syndrome",     sub:"Clonus · Hyperthermia",         cat:"Toxidrome", color:T.gold,   gl:"rgba(245,200,66,0.1)",   br:"rgba(245,200,66,0.4)"  },
  { id:"tca",            icon:"❤️", title:"TCA Overdose",           sub:"QRS Widening · Dysrhythmia",    cat:"Overdose",  color:T.coral,  gl:"rgba(255,107,107,0.1)",  br:"rgba(255,107,107,0.4)" },
  { id:"apap",           icon:"🟡", title:"Acetaminophen OD",       sub:"Hepatotoxicity · NAC Protocol", cat:"Overdose",  color:T.green,  gl:"rgba(61,255,160,0.1)",   br:"rgba(61,255,160,0.4)"  },
  { id:"salicylate",     icon:"🔵", title:"Salicylate OD",          sub:"Mixed Acid-Base · Tinnitus",    cat:"Overdose",  color:T.cyan,   gl:"rgba(0,212,255,0.1)",    br:"rgba(0,212,255,0.4)"   },
  { id:"digoxin",        icon:"💜", title:"Digoxin Toxicity",       sub:"AV Block · Bidirectional VT",   cat:"Overdose",  color:T.purple, gl:"rgba(155,109,255,0.1)",  br:"rgba(155,109,255,0.4)" },
];

const BANNER = [
  { label:"Antidote Window", value:"0–2 hrs", sub:"Most time-critical reversal", color:T.coral },
  { label:"Naloxone Repeat", value:"q 2–3 min", sub:"Titrate RR > 12 & SpO₂ > 95%", color:T.orange },
  { label:"NAC Best Efficacy", value:"< 8 hours", sub:"Post-APAP ingestion", color:T.green },
  { label:"TCA Bicarb pH", value:"7.45–7.55", sub:"Target to narrow QRS < 100 ms", color:T.blue },
];

// ── Clinical Data ──────────────────────────────────────────────────
const DATA = {
  opioid: {
    overview: {
      def: "Opioid toxidrome results from mu, kappa, and delta receptor agonism causing CNS and respiratory depression. Classic triad: miosis, decreased consciousness, and respiratory depression. Fatal apnea can occur within minutes of high-dose exposure. Fentanyl analogues and synthetic opioids may require repeat or high-dose naloxone.",
      bullets: [
        "Classic triad: miosis + altered mental status + respiratory depression",
        "RR < 12/min or SpO₂ < 90% requires immediate naloxone administration",
        "Non-cardiogenic pulmonary edema — especially common with heroin",
        "Fentanyl analogues often NOT detected by standard UDS — clinical diagnosis paramount",
        "Duration varies: heroin 4–6h; methadone 24–72h; buprenorphine partial naloxone response",
        "Naloxone half-life 30–90 min — watch for recurrence after dose wears off",
      ]
    },
    workup: [
      { icon:"🩺", label:"Vitals + SpO₂ Q15min", detail:"RR, depth of breathing, pulse oximetry trending — most critical monitoring parameters. Waveform capnography (ETCO₂) is gold standard if available." },
      { icon:"🔬", label:"Urine Drug Screen", detail:"Immunoassay detects morphine/codeine; fentanyl analogues frequently NOT detected. UDS negative does not rule out opioid toxicity." },
      { icon:"💉", label:"BMP + Lactate", detail:"Metabolic acidosis from hypoxia. Lactate elevated with significant respiratory compromise or shock." },
      { icon:"🫀", label:"ECG 12-lead", detail:"Rule out co-ingestion (TCA, QTc-prolonging agents). Some synthetic opioids cause QTc prolongation." },
      { icon:"🧠", label:"POC Blood Glucose", detail:"Always check — hypoglycemia mimics and co-occurs with opioid toxicity. Treat empirically if borderline." },
      { icon:"🫁", label:"Chest X-ray", detail:"Non-cardiogenic pulmonary edema in severe cases. Aspiration pneumonia after loss of airway protective reflexes." },
      { icon:"🧪", label:"Serum APAP + EtOH Level", detail:"Poly-drug co-ingestion is common. Check even without clear history — impacts management and disposition." },
    ],
    treatment: [
      { cat:"🅐 Antidote", drug:"Naloxone (Narcan)", dose:"0.4–2 mg IV/IM/IN q2–3 min; titrate to RR > 12 and SpO₂ > 95%; up to 10 mg if no response", renal:"No dose adjustment", ivpo:"IV / IM / SQ / IN", deesc:"Infuse 2/3 of effective reversal dose per hour if recurrent toxicity. Observe 4–6h after last dose for short-acting opioids.", note:"Start 0.04–0.1 mg in opioid-dependent patients to avoid precipitated withdrawal. IN route less reliable in profound shock.", ref:"Goldfrank's Toxicology" },
      { cat:"🅐 Antidote", drug:"Naloxone Infusion", dose:"Mix 2/3 of effective bolus dose in 250 mL NS/hr; titrate q30min; max 10 mg/hr continuous", renal:"No adjustment", ivpo:"IV infusion", deesc:"Wean by 25% q1–2h when stable. For methadone/extended-release opioids — run infusion 12–24h minimum.", note:"Infusion required for long-acting opioids (methadone, extended-release morphine). Monitor closely for re-sedation.", ref:"UpToDate" },
      { cat:"🅑 Airway", drug:"BVM + Airway Adjuncts", dose:"NPA 6–8 cm; OPA for unconscious. BVM ventilation 10–12 breaths/min if apneic; avoid hyperventilation", renal:"N/A", ivpo:"Procedural", deesc:"RSI if no naloxone response or aspiration suspected. Ketamine 1–2 mg/kg if hemodynamically stable. Avoid hyperventilation.", note:"Prioritize oxygenation. Bag-mask ventilation while awaiting naloxone effect. Suction secretions aggressively.", ref:"ACLS 2023" },
      { cat:"🅒 Supportive", drug:"0.9% NS Fluid Bolus", dose:"500 mL IV bolus if hypotensive (MAP < 65); repeat q30 min; target MAP > 65 mmHg", renal:"Caution in AKI or pulmonary edema", ivpo:"IV", deesc:"Restrict fluids if pulmonary edema present. Consider CPAP/BiPAP for oxygenation in edema. Vasopressors rarely needed.", note:"Pulmonary edema: restrict to minimum fluid, elevate HOB 30–45°, consider CPAP.", ref:"Supportive Care" },
    ],
    followup: [
      "Observe minimum 4 hours post-naloxone for short-acting opioids; 12–24 hours for methadone or extended-release formulations",
      "Addiction medicine consult or warm handoff to recovery services before discharge",
      "Prescribe naloxone kit (4 mg IN, Narcan) to patient AND household members at discharge — document",
      "Distribute fentanyl test strip information and harm reduction resources",
      "Screen with AUDIT-C and DAST-10; apply SBIRT framework",
      "Follow-up with primary care or substance use program within 72 hours — arrange before discharge",
      "Safe messaging: avoid shame-based language; use 'substance use disorder' not 'addict'",
    ]
  },
  sympatho: {
    overview: {
      def: "Sympathomimetic toxidrome from cocaine, amphetamines, methamphetamine, MDMA, cathinones ('bath salts'), or synthetic cannabinoids. Excess catecholamine release and/or reuptake inhibition causes hypertensive crisis, tachycardia, hyperthermia, and agitation. Beta-blockers are CONTRAINDICATED (unopposed alpha → paradoxical vasospasm).",
      bullets: [
        "Classic: hypertension + tachycardia + hyperthermia + agitation/psychosis + mydriasis + diaphoresis",
        "Cocaine: coronary vasospasm → acute MI even with angiographically normal coronaries",
        "MDMA: hyponatremia from SIADH + excessive water intake — seizure risk even with low total dose",
        "Beta-blockers CONTRAINDICATED — unopposed alpha → severe vasospasm and HTN crisis",
        "Hyperthermia > 39°C is a critical emergency — aggressive cooling is life-saving",
        "Excited delirium syndrome: extreme agitation + hyperthermia + strength = high mortality risk",
      ]
    },
    workup: [
      { icon:"🫀", label:"ECG 12-lead", detail:"Cocaine MI (STEMI/NSTEMI), QTc prolongation (cathinones/MDMA), wide-complex tachycardia (cocaine Na-channel block at toxic doses)." },
      { icon:"🌡️", label:"Core Temperature (Rectal)", detail:"Rectal or esophageal preferred. Hyperthermia drives mortality. > 40°C = critical threshold requiring aggressive intervention." },
      { icon:"🔬", label:"CK + Urinalysis (myoglobinuria)", detail:"Rhabdomyolysis from hyperthermia and agitation. CK, myoglobin, UA dipstick (blood positive without RBCs)." },
      { icon:"🧂", label:"Electrolytes + Serum Na", detail:"Hyponatremia in MDMA toxicity (dilutional + SIADH). Hypernatremia possible with severe hyperthermia and diaphoresis." },
      { icon:"💉", label:"Troponin I/T (0h, 3h)", detail:"Cocaine-associated chest pain — rule out STEMI and NSTEMI. Troponin may rise from direct cardiotoxicity independent of ischemia." },
      { icon:"🧠", label:"Head CT (if focal sx)", detail:"Intracerebral hemorrhage with severe hypertension. Cocaine vasculitis. Subarachnoid hemorrhage from sympathetic surge." },
    ],
    treatment: [
      { cat:"🅐 Sedation", drug:"Lorazepam (Ativan)", dose:"2–4 mg IV q5–10 min; titrate to calm; 2–4 mg IM if no IV access; higher doses may be needed in stimulant-driven agitation", renal:"No adjustment", ivpo:"IV / IM", deesc:"Benzodiazepines are the cornerstone — treating agitation directly reduces sympathetic drive, HR, and heat generation.", note:"Haloperidol second-line only (lowers seizure threshold, interferes with heat dissipation). BZDs first-line always.", ref:"Goldfrank's" },
      { cat:"🅐 Sedation", drug:"Diazepam (Valium)", dose:"5–10 mg IV q5 min; 10–20 mg IM alternative; superior long half-life provides sustained sedation", renal:"No adjustment", ivpo:"IV / IM", deesc:"Long half-life provides sustained effect. Some toxicologists prefer for excited delirium due to duration. Less titratable than lorazepam.", note:"Consider in cases where repeated lorazepam doses have not achieved adequate sedation.", ref:"Toxicology" },
      { cat:"🅑 HTN Crisis", drug:"Phentolamine", dose:"2.5–5 mg IV bolus for cocaine-induced HTN crisis; infusion 0.2–0.5 mg/min if sustained", renal:"No adjustment", ivpo:"IV", deesc:"Alpha-1 blocker — preferred over labetalol for cocaine-induced HTN (avoids unopposed-alpha concern). Titrate every 5 min.", note:"Labetalol is controversial in cocaine (not absolutely contraindicated per some evidence, but avoid per most guidelines).", ref:"UpToDate" },
      { cat:"🅑 HTN Crisis", drug:"Nitroglycerin IV", dose:"10–20 mcg/min IV; titrate q5 min by 5–10 mcg/min; target SBP < 160 mmHg", renal:"No adjustment", ivpo:"IV infusion", deesc:"Preferred for cocaine-associated chest pain + HTN (vasodilates coronary arteries directly). SL NTG 0.4 mg acceptable first step.", note:"Combination of BZD + NTG is preferred regimen for cocaine chest pain with HTN.", ref:"AHA Guidelines" },
      { cat:"🅒 Hyperthermia", drug:"Active Cooling Protocol", dose:"Ice water immersion preferred (fastest). Evaporative (wet + fan) second. Cold IV NS 1–2 L as adjunct. Target core temp < 38.5°C within 30 min", renal:"N/A", ivpo:"External", deesc:"Stop active cooling at 38.5°C to prevent overshoot hypothermia. Monitor temp q5–10 min.", note:"Antipyretics (acetaminophen, ibuprofen) are INEFFECTIVE for drug-induced hyperthermia — temperature set point is not elevated.", ref:"Toxicology" },
      { cat:"🅒 Hyperthermia", drug:"Dantrolene", dose:"2.5 mg/kg IV over 15 min; may repeat q5–10 min; max 10 mg/kg/day", renal:"No adjustment", ivpo:"IV", deesc:"Consider for refractory hyperthermia with significant muscle rigidity. Reduces skeletal muscle heat production.", note:"Dissolve in sterile water (not NS). Reserved for severe, cooling-refractory cases.", ref:"Toxicology" },
    ],
    followup: [
      "Cardiac monitoring minimum 6 hours; 12 hours if troponin elevated or ECG changes",
      "Cocaine-associated STEMI/NSTEMI: ACS protocol — avoid beta-blockers; prefer NTG + BZD + aspirin + heparin",
      "Psychiatric evaluation for stimulant use disorder before discharge",
      "Return precautions: chest pain, seizure, severe headache — provide written instructions",
      "Methamphetamine-associated psychosis may persist days — bridging antipsychotic after medical clearance",
      "Outpatient substance use counseling referral; SAMHSA helpline",
    ]
  },
  cholinergic: {
    overview: {
      def: "Cholinergic toxidrome from organophosphate or carbamate pesticides, nerve agents (VX, sarin, novichok), or muscarinic mushrooms (Inocybe/Clitocybe). Irreversible AChE inhibition causes ACh accumulation at muscarinic AND nicotinic receptors. Respiratory failure is the #1 cause of death from bronchospasm + bronchorrhea + paralysis.",
      bullets: [
        "SLUDGE-M: Salivation, Lacrimation, Urination, Defecation, GI distress, Emesis, Miosis",
        "Nicotinic: fasciculations → weakness → paralysis; tachycardia (counterintuitive — nicotinic effect)",
        "Respiratory failure = #1 cause of death (bronchospasm + bronchorrhea + diaphragm paralysis)",
        "Nerve agents: onset within seconds (vapor) to minutes (skin contact) — seconds to crisis",
        "Succinylcholine is CONTRAINDICATED — hydrolysis prolonged → persistent paralysis",
        "Intermediate syndrome: delayed proximal muscle weakness 24–96h after apparent recovery",
      ]
    },
    workup: [
      { icon:"🔬", label:"RBC Cholinesterase", detail:"Best marker of OP toxicity. > 50% suppression = significant exposure. Slow to return (weeks). Order stat and repeat q4–6h." },
      { icon:"🔬", label:"Plasma Pseudocholinesterase", detail:"Faster to obtain, less specific. Suppressed in liver disease. Useful for initial assessment when RBC ChE pending." },
      { icon:"🫁", label:"Auscultation + SpO₂", detail:"Bronchospasm and bronchorrhea — progressive wheeze and wet crackles. Continuous SpO₂; waveform capnography." },
      { icon:"🫀", label:"Continuous ECG", detail:"Bradycardia, AV heart block, QTc prolongation, ventricular fibrillation in severe cases." },
      { icon:"💪", label:"Serial Muscle Strength", detail:"Grip strength, respiratory effort (FVC, NIF), swallowing — track for intermediate syndrome at 24–96h." },
      { icon:"🧠", label:"Seizure Monitoring", detail:"Seizures occur with CNS penetrating agents. EEG if altered and unclear seizure activity. Status epilepticus possible." },
    ],
    treatment: [
      { cat:"🅐 Antidote", drug:"Atropine", dose:"ADULTS: 2–4 mg IV q5–10 min until secretions dry. CHILDREN: 0.02–0.05 mg/kg. NO MAXIMUM DOSE — titrate to secretions, NOT heart rate. Severe cases may require 100s of mg.", renal:"No adjustment", ivpo:"IV / IM (auto-injector)", deesc:"Endpoint: dry secretions and resolution of bronchospasm. Continue infusion 0.02–0.08 mg/kg/hr if needed. Maintain for 12–24h in severe cases.", note:"CRITICAL: Tachycardia is from nicotinic stimulation — do NOT stop atropine for tachycardia. Mydriasis signals adequate atropinization.", ref:"Goldfrank's / WHO" },
      { cat:"🅐 Antidote", drug:"Pralidoxime (2-PAM)", dose:"1–2 g IV over 15–30 min LOADING; then infusion 500 mg/hr (max 12 g/day); IM auto-injector: 600 mg if IV unavailable", renal:"Reduce infusion rate CrCl < 30 mL/min", ivpo:"IV / IM (auto-injector)", deesc:"Must give within 24–48h BEFORE irreversible aging occurs. Reactivates AChE. Continue 24–48h post-exposure minimum.", note:"Less effective (and controversial) for carbamate poisoning — use atropine as primary for carbamates. Carbamate toxicity is self-limited.", ref:"WHO / Toxicology" },
      { cat:"🅐 Antidote", drug:"Diazepam (Seizure Prophylaxis)", dose:"5–10 mg IV q10–15 min for seizures. 0.1–0.3 mg/kg IM if no IV. Military auto-injectors contain 10 mg IM.", renal:"No adjustment", ivpo:"IV / IM", deesc:"Benzodiazepines are FIRST-LINE for OP seizures. Phenytoin/fosphenytoin ineffective for this mechanism.", note:"Pre-treat with diazepam in severe exposure for seizure prophylaxis. Continuous infusion for status epilepticus.", ref:"Toxicology / Military" },
      { cat:"🅑 Airway", drug:"RSI (Rocuronium)", dose:"Rocuronium 1.2 mg/kg IV for RSI. Ketamine 1–2 mg/kg induction. AVOID succinylcholine (unpredictable prolonged paralysis)", renal:"Standard dosing", ivpo:"Procedural", deesc:"Early intubation before respiratory failure. Succinylcholine hydrolyzed by AChE — duration wildly unpredictable. Sugammadex available to reverse rocuronium.", note:"Bronchorrhea rapidly fills airway — suction aggressively before and after intubation. Have large-bore suction immediately available.", ref:"Airway Management" },
      { cat:"🅒 Decontamination", drug:"Skin + GI Decontamination", dose:"SKIN: Remove all clothing (reduces exposure 80%). Copious soap and water irrigation x 10–15 min. GI: Activated charcoal 1 g/kg PO (max 50g) if < 1h post-ingestion AND airway protected", renal:"N/A", ivpo:"External / PO", deesc:"Do NOT induce emesis. PPE Level B for healthcare providers — secondary contamination is a real documented risk.", note:"Organophosphates are highly lipophilic and absorb dermally. Decontamination is a priority, not afterthought.", ref:"CHEMM / CDC" },
    ],
    followup: [
      "Observe minimum 24 hours after clinical recovery for intermediate syndrome (proximal weakness at 24–96h)",
      "Serial respiratory assessment — FVC, NIF q4–6h; pulse oximetry continuously",
      "Occupational health and industrial hygiene referral for pesticide exposure (worker safety evaluation)",
      "Baseline and follow-up RBC cholinesterase levels (recovery takes weeks to months)",
      "Psychiatric support — organophosphate exposure associated with long-term neurocognitive effects and depression",
      "Mandatory reporting: occupational exposure to state public health authority",
    ]
  },
  anticholinergic: {
    overview: {
      def: "Anticholinergic toxidrome from atropine, diphenhydramine, TCAs, antipsychotics, scopolamine, jimsonweed (Datura), or belladonna alkaloids. Central and peripheral muscarinic receptor blockade. Mnemonic: 'Hot as a hare, dry as a bone, blind as a bat, red as a beet, mad as a hatter, full as a flask, the heart runs alone.'",
      bullets: [
        "Peripheral: mydriasis, tachycardia, dry flushed skin, urinary retention, decreased bowel sounds, ileus",
        "Central: agitation, delirium, hallucinations (picking at objects), seizures, hyperthermia",
        "Diphenhydramine: QRS widening (Na-channel block at OD doses) + QTc prolongation",
        "Physostigmine reverses BOTH central and peripheral effects — most effective antidote",
        "Temperature can rise rapidly — anhidrosis prevents heat dissipation",
        "Delirium may persist 12–24 hours — prolonged observation required",
      ]
    },
    workup: [
      { icon:"🫀", label:"ECG Serial", detail:"Diphenhydramine: QRS > 120 ms (Na-channel block). QTc prolongation from multiple agents. Monitor q1–2h." },
      { icon:"👁️", label:"Pupillary Exam", detail:"Fixed, dilated pupils (mydriasis) — bedside diagnosis. Document baseline size and reactivity. Serial re-assessment." },
      { icon:"🔬", label:"UDS + Serum TCA Level", detail:"Confirm anticholinergic vs other cause of delirium. TCA level if suspected co-ingestion — guides bicarb therapy." },
      { icon:"🌡️", label:"Core Temperature", detail:"Anhidrosis prevents heat dissipation — temperature rises without obvious diaphoresis. Rectal temp preferred." },
      { icon:"🫁", label:"Bladder Scan", detail:"Urinary retention common — urinary agitation is a significant contributor to behavioral symptoms. Catheterize if retention." },
      { icon:"🧠", label:"Head CT if focal sx", detail:"Rule out structural intracranial pathology when focal neurological deficits accompany altered mental status." },
    ],
    treatment: [
      { cat:"🅐 Antidote", drug:"Physostigmine", dose:"1–2 mg IV over 2–5 min SLOWLY (fast infusion → bradycardia/seizures); may repeat 1 mg q10–20 min; max 4 mg initial session", renal:"No adjustment", ivpo:"IV (slow push)", deesc:"Reversal of delirium lasts 30–60 min; repeat dosing every 30–60 min as needed. HAVE atropine 0.5 mg/vial at bedside (reversal if cholinergic excess).", note:"AVOID if QRS > 120 ms, reactive airway disease, AV block, known TCA co-ingestion. Underused — most effective antidote for pure anticholinergic delirium.", ref:"Goldfrank's" },
      { cat:"🅑 Sedation", drug:"Lorazepam", dose:"1–2 mg IV q5–10 min for agitation; titrate to calm without respiratory compromise", renal:"No adjustment", ivpo:"IV / IM", deesc:"Second-line after physostigmine or when physostigmine is contraindicated (QRS widening, TCA co-ingestion).", note:"AVOID haloperidol and phenothiazines — lower seizure threshold, worsen anticholinergic syndrome, impair heat dissipation.", ref:"Toxicology" },
      { cat:"🅒 QRS Widening", drug:"Sodium Bicarbonate", dose:"1–2 mEq/kg IV bolus for QRS > 120 ms (diphenhydramine OD); repeat q5 min; target serum pH 7.45–7.55", renal:"Caution in fluid overload", ivpo:"IV", deesc:"Maintain with bicarb infusion (150 mEq/L in D5W at 200–250 mL/hr). Stop at pH > 7.55 or Na > 155 mEq/L.", note:"Same mechanism as TCA protocol — Na loading overcomes Na-channel block. Monitor serum Na and pH hourly.", ref:"AHA / Toxicology" },
      { cat:"🅒 Supportive", drug:"Foley Catheter + Cooling", dose:"Catheterize if urinary retention. Cooling: tepid water + fan (avoid ice bath — vasoconstricts in anhidrotic patient)", renal:"N/A", ivpo:"Procedural", deesc:"Urinary retention → agitation → worsening hyperthermia. Catheterization often dramatically improves patient behavior.", note:"Cooling: avoid ice bath in anhidrotic patient (vasoconstriction impairs heat loss). Evaporative cooling preferred.", ref:"Supportive" },
    ],
    followup: [
      "Minimum 6-hour observation; 12–24 hours if severe delirium or cardiovascular effects present",
      "Review ALL home medications for anticholinergic burden (Beers Criteria agents — diphenhydramine, oxybutynin, etc.)",
      "Jimsonweed/Datura plant exposure: Poison Control consult; patient education on plant identification",
      "Ophthalmology follow-up if prolonged mydriasis (rare angle-closure glaucoma precipitation risk)",
      "Confirm voiding before discharge; return precautions for inability to urinate",
    ]
  },
  sedative: {
    overview: {
      def: "Sedative-hypnotic toxidrome from benzodiazepines, barbiturates, GHB, carisoprodol, zolpidem/Z-drugs, or meprobamate. GABA-A receptor potentiation causing CNS and respiratory depression. Generally less lethal when taken alone, but highly dangerous combined with opioids or alcohol. GHB has especially rapid onset/offset.",
      bullets: [
        "Pure BZD: rarely fatal alone; combined with opioids/EtOH is highly dangerous",
        "GHB: rapid onset and offset (1–4h); abrupt awakening; severe withdrawal if chronic use",
        "Barbiturates: deeper CNS depression than BZDs; more likely to cause fatal OD alone",
        "Flumazenil: rarely indicated in ED — risk of precipitating refractory seizures in BZD-dependent patients",
        "Hypothermia impairs drug metabolism — active rewarming accelerates recovery",
        "GHB withdrawal: severe (similar to alcohol withdrawal) — phenobarbital ± BZD",
      ]
    },
    workup: [
      { icon:"💉", label:"Serum Barbiturate Level", detail:"Quantitative phenobarbital/phenytoin if suspected. Guides hemodialysis decision. Level > 100 mg/L → consider HD." },
      { icon:"🔬", label:"UDS (with limitations)", detail:"Immunoassay positive for BZDs. GHB NOT detected on standard UDS (short half-life). Z-drugs not detected. Clinical diagnosis." },
      { icon:"🫁", label:"Serial Respiratory Assessment", detail:"RR, SpO₂, ETCO₂ — respiratory depression is the primary life threat. Consider intubation early if declining." },
      { icon:"🧪", label:"Serum EtOH Level", detail:"Co-ingestion extremely common and pharmacodynamically synergistic. Markedly worsens prognosis." },
      { icon:"🌡️", label:"Core Temperature", detail:"Hypothermia common — passive and active rewarming. Impairs CYP450 drug metabolism, prolonging toxicity." },
    ],
    treatment: [
      { cat:"🅐 Antidote", drug:"Flumazenil (Rarely Indicated)", dose:"0.2 mg IV over 30 sec; repeat 0.2 mg q1 min up to 1 mg total; infusion 0.1–0.4 mg/hr if resedation occurs", renal:"No adjustment", ivpo:"IV", deesc:"RARELY indicated in ED. Consider ONLY for isolated, iatrogenic BZD in opioid-naive, BZD-naive patient.", note:"CONTRAINDICATED: chronic BZD use, BZD dependence, TCA co-ingestion, known seizure disorder. Short half-life (30–60 min) → resedation is common. Prepare for seizures.", ref:"Goldfrank's" },
      { cat:"🅑 Airway", drug:"RSI / Endotracheal Intubation", dose:"Etomidate 0.3 mg/kg + succinylcholine 1.5 mg/kg; OR ketamine 1–2 mg/kg + rocuronium 1.2 mg/kg for RSI", renal:"Standard dosing", ivpo:"Procedural", deesc:"Intubate for GCS < 8 or progressive respiratory failure. Phenobarbital may need 24–48h ventilatory support for drug metabolism.", note:"HEMODIALYSIS for severe phenobarbital toxicity (level > 100 mg/L) or refractory supportive care. Multi-dose activated charcoal enhances phenobarbital elimination.", ref:"Critical Care" },
      { cat:"🅒 Supportive", drug:"Fluid + Thermoregulation", dose:"Warm 0.9% NS 250–500 mL bolus if hypotensive. Bair Hugger/forced air warming for hypothermia. Target temp > 36°C", renal:"Adjust rate in AKI", ivpo:"IV + External", deesc:"Gradual rewarming improves drug metabolism and recovery. Avoid vasopressors if possible — tend to be hemodynamically stable after warming.", note:"Recovery position if protecting airway without intubation. Warming most overlooked intervention — dramatically speeds recovery.", ref:"Supportive Care" },
    ],
    followup: [
      "GHB: discharge after 4–6h when fully awake; counsel chronic users on severe withdrawal syndrome risk",
      "BZD intentional OD: mandatory psychiatric evaluation before discharge",
      "Phenobarbital OD: ICU admission; consider multi-dose activated charcoal",
      "Screen for poly-substance use; addiction medicine referral",
      "Address underlying psychiatric condition if intentional ingestion — safety planning",
    ]
  },
  serotonin: {
    overview: {
      def: "Serotonin syndrome from excess 5-HT activity — single agent overdose (SSRI), dangerous combination (SSRI + tramadol, linezolid, methylene blue, triptans, MDMA, meperidine), or MAOI interactions. Hunter Criteria is most sensitive/specific: clonus (spontaneous/inducible/ocular) + agitation or diaphoresis + tremor or hyperreflexia.",
      bullets: [
        "Hunter Criteria: clonus (spontaneous/inducible/ocular) is pathognomonic for serotonin syndrome",
        "Clinical triad: cognitive changes + neuromuscular abnormalities + autonomic instability",
        "Differentiate from NMS: SS = acute onset hours; NMS = gradual days-weeks; bradykinesia predominates in NMS",
        "Hyperthermia driven by muscle activity — not hypothalamic set point change",
        "Temperature > 41°C = SEVERE — intubation + neuromuscular paralysis required",
        "MAOi interactions most severe — avoid all serotonergic drugs 14 days before/after MAOi",
      ]
    },
    workup: [
      { icon:"🔬", label:"CK + Metabolic Panel", detail:"Rhabdomyolysis from hyperthermia and rigidity. Renal function critical — rhabdo-induced AKI common in severe cases." },
      { icon:"🌡️", label:"Core Temperature (Rectal)", detail:"Drives severity classification. > 41°C = life-threatening → immediate paralysis and cooling required." },
      { icon:"💊", label:"Complete Medication Review", detail:"Serotonergic agents: SSRIs, SNRIs, MAOIs, tramadol, linezolid, triptans, dextromethorphan, fentanyl (mild), lithium, methylene blue, MDMA." },
      { icon:"🫀", label:"ECG 12-lead", detail:"QTc prolongation from underlying agents (citalopram, escitalopram). Sinus tachycardia expected — not specific." },
      { icon:"🧠", label:"Clonus Assessment", detail:"Ankle/patellar clonus (≥ 3 beats = inducible clonus). Ocular clonus (rhythmic oscillating eye movements) = pathognomonic." },
    ],
    treatment: [
      { cat:"🅐 Antidote", drug:"Cyproheptadine", dose:"12 mg PO/NG loading dose; then 2 mg q2h for persistent symptoms; max 32 mg/day", renal:"No adjustment", ivpo:"PO / NG tube", deesc:"5-HT2A antagonist. Improvement expected within 1–2h of loading dose. Taper over 24h after symptom resolution.", note:"Only available oral — give via NG if cannot swallow. Crush tablets in water. Adjunct to supportive care, not standalone treatment.", ref:"Goldfrank's / Hunter" },
      { cat:"🅑 Sedation", drug:"Lorazepam", dose:"2–4 mg IV q5–10 min for agitation/seizures; aggressive dosing to reduce muscle activity and heat generation", renal:"No adjustment", ivpo:"IV", deesc:"Cornerstone of management — reduces autonomic instability, controls clonus-associated muscle activity. Undertreated agitation worsens hyperthermia.", note:"Aggressive benzodiazepine therapy is key. Haloperidol AVOID (lowers seizure threshold, may worsen). BZDs directly reduce serotonergic neurotransmission.", ref:"Hunter Criteria" },
      { cat:"🅒 Hyperthermia", drug:"Cooling + NMB Paralysis", dose:"Ice packs groin/axilla/neck; cold IVF 1–2 L. T > 41°C: RSI + rocuronium 1.2 mg/kg (STOPS muscle heat generation immediately)", renal:"Standard dosing", ivpo:"External / IV", deesc:"Neuromuscular paralysis is most effective intervention for severe hyperthermia — immediately halts skeletal muscle heat production.", note:"Antipyretics are INEFFECTIVE. Temperature from muscle activity (not set-point elevation). Intubation required with paralysis — monitor EEG for ongoing seizures.", ref:"Toxicology" },
    ],
    followup: [
      "Discontinue all offending serotonergic agents — most cases resolve within 24 hours after cessation",
      "Temperature normalization and resolution of clonus required before discharge",
      "Review ALL serotonergic medications with patient; detailed drug interaction counseling",
      "Notify prescribing physician of serotonin syndrome diagnosis for medication reconciliation",
      "If MAOI involved: strict 14-day washout before initiating any new serotonergic agent",
      "Outpatient psychiatry follow-up for medication management within 1 week",
    ]
  },
  tca: {
    overview: {
      def: "Tricyclic antidepressant toxicity is a rapid-onset, life-threatening emergency. TCAs block fast sodium channels (QRS widening → VT), alpha-1 receptors (hypotension), muscarinic receptors (anticholinergic), potassium channels (QTc prolongation), and inhibit NE/5-HT reuptake. A patient can transition from 'talking and stable' to cardiac arrest in under 60 minutes.",
      bullets: [
        "QRS > 100 ms: 33% risk of seizures; QRS > 160 ms: 50% risk of ventricular tachycardia",
        "R wave in aVR > 3 mm or R/S ratio > 0.7 in aVR predicts severe toxicity",
        "Terminal 40ms rightward axis deviation (right axis): very sensitive marker",
        "Rapid deterioration: alert → cardiac arrest in < 60 minutes is documented",
        "Physostigmine CONTRAINDICATED in TCA OD — precipitates refractory bradycardia/asystole",
        "Sodium bicarbonate is antidotal, not just supportive — initiate with QRS > 100 ms",
      ]
    },
    workup: [
      { icon:"🫀", label:"Serial ECGs q30 min", detail:"QRS duration, QTc, R in aVR, terminal 40ms axis. Most important monitoring tool. Rapid progression possible." },
      { icon:"💊", label:"Serum TCA Level", detail:"Levels > 1000 ng/mL associated with severe toxicity. Correlates poorly — clinical picture supersedes lab value." },
      { icon:"🔬", label:"ABG + Electrolytes", detail:"Metabolic acidosis dramatically worsens Na-channel block (pH-dependent binding). Treat acidosis aggressively." },
      { icon:"🧠", label:"Continuous Seizure Watch", detail:"Neurological monitoring continuous. EEG if postictal or unclear if ongoing seizure. Seizures precipitate acidosis → more drug binding." },
      { icon:"💉", label:"BMP + LFTs", detail:"Baseline liver function (TCA is hepatically metabolized). Monitor serum Na during bicarb therapy." },
    ],
    treatment: [
      { cat:"🅐 Antidote", drug:"Sodium Bicarbonate", dose:"1–2 mEq/kg IV bolus IMMEDIATELY for QRS > 100 ms; repeat q5 min until QRS < 100 ms; maintain pH 7.45–7.55 with infusion (150 mEq in 1L D5W at 200–250 mL/hr)", renal:"Monitor Na closely; reduce in hypernatremia", ivpo:"IV bolus + infusion", deesc:"Continue infusion 12–24h minimum. Wean when QRS < 100 ms AND hemodynamically stable for 6 h. STOP at pH > 7.55 or Na+ > 155 mEq/L.", note:"Dual mechanism: (1) alkalemia reduces drug-protein binding affinity; (2) Na loading overcomes channel block. MOST important intervention — do not delay.", ref:"Goldfrank's / AHA" },
      { cat:"🅑 Seizures", drug:"Lorazepam", dose:"0.1 mg/kg IV (typically 4–8 mg adults) for seizures; repeat doses as needed; phenobarbital 15–20 mg/kg if refractory", renal:"No adjustment", ivpo:"IV", deesc:"BZDs first-line for TCA seizures. AVOID phenytoin/fosphenytoin — ineffective for Na-channel mechanism and worsens cardiac toxicity.", note:"Refractory seizures: phenobarbital 15–20 mg/kg; propofol infusion for status epilepticus; will require intubation.", ref:"Neurology / Toxicology" },
      { cat:"🅒 Dysrhythmia", drug:"Lipid Emulsion (ILE) 20%", dose:"1.5 mL/kg IV bolus over 1 min; then infusion 0.25 mL/kg/min × 30–60 min; may repeat bolus x1; max 10 mL/kg", renal:"No adjustment", ivpo:"IV", deesc:"Rescue therapy for refractory cardiac arrest or VT not responding to bicarb + ACLS. 'Lipid sink' sequesters lipophilic drug.", note:"Use in cardiac arrest from TCA after standard ACLS + sodium bicarb has failed. ECMO consultation if available.", ref:"Toxicology / ILE" },
      { cat:"🅒 Hypotension", drug:"Norepinephrine", dose:"0.1–0.5 mcg/kg/min IV; titrate to MAP > 65 mmHg. Preferred vasopressor in TCA-induced hypotension", renal:"No adjustment", ivpo:"IV infusion", deesc:"Dopamine less effective (NE reuptake inhibition by TCA depletes stores). Avoid epinephrine if possible (dysrhythmia risk).", note:"500 mL NS bolus first. Vasopressor for fluid-unresponsive hypotension. Central access preferred for norepinephrine.", ref:"Critical Care" },
    ],
    followup: [
      "ICU admission for ALL symptomatic TCA overdoses — no exceptions",
      "Monitor ECG until QRS < 100 ms without sodium bicarbonate for minimum 24 consecutive hours",
      "Mandatory psychiatric evaluation — TCA overdose is almost always intentional",
      "Reassess antidepressant choice with psychiatry — safer alternatives (SSRIs, SNRIs) are equally effective",
      "Family education on medication safety, storage, and recognizing recurrence",
    ]
  },
  apap: {
    overview: {
      def: "Acetaminophen (paracetamol) overdose is the leading cause of acute liver failure in the United States. Toxic metabolite NAPQI accumulates via CYP2E1 when hepatic glutathione is depleted. N-acetylcysteine replenishes glutathione and prevents hepatotoxicity when given early. The Rumack-Matthew nomogram at ≥ 4 hours post-ingestion guides NAC initiation.",
      bullets: [
        "4 phases: Phase I (0–24h) N/V/malaise; Phase II (24–72h) RUQ pain + rising LFTs; Phase III (72–96h) peak hepatotoxicity; Phase IV recovery or ALF",
        "Toxic: > 150 mg/kg or > 7.5 g adults (reduce threshold in fasting, chronic alcohol, malnutrition)",
        "Nomogram treatment line: 4h level ≥ 150 mcg/mL on Rumack-Matthew nomogram",
        "King's College Criteria: pH < 7.3 OR creatinine > 3.4 + INR > 6.5 + encephalopathy = transplant",
        "Extended-release formulations: levels may peak later — recheck at 8h if initial level below treatment line",
        "NAC anaphylactoid reaction in ~15%: slow infusion, antihistamine, temporary hold — do not discontinue",
      ]
    },
    workup: [
      { icon:"🧪", label:"APAP Level at ≥ 4h", detail:"Plot on Rumack-Matthew nomogram. Level ≥ 150 mcg/mL at 4h = initiate NAC. If < 4h post-ingestion, repeat at 4h." },
      { icon:"🔬", label:"LFTs + PT/INR q6–8h", detail:"Baseline then serial. AST/ALT rise = hepatocyte damage. INR reflects synthetic function — most important prognostic marker." },
      { icon:"💉", label:"BMP + Creatinine", detail:"Renal toxicity occurs independently in 25% of severe cases. AKI worsens prognosis significantly." },
      { icon:"🧠", label:"Mental Status + Encephalopathy Grade", detail:"Late sign — indicates severe hepatic failure. Grade I–IV encephalopathy grading critical for transplant decision." },
      { icon:"🫀", label:"Lactic Acid", detail:"King's College criteria surrogate. Elevated in severe hepatic dysfunction. pH < 7.3 despite resuscitation = transplant." },
    ],
    treatment: [
      { cat:"🅐 Antidote", drug:"N-Acetylcysteine IV — 21h Protocol", dose:"BAG 1: 150 mg/kg in 200 mL D5W over 60 min. BAG 2: 50 mg/kg in 500 mL D5W over 4h. BAG 3: 100 mg/kg in 1000 mL D5W over 16h", renal:"No dose adjustment; monitor fluid balance; use 100 mL bags in fluid-restricted patients", ivpo:"IV", deesc:"Start within 8h for maximum benefit (> 95% hepatoprotection). Still beneficial up to 24h+. Extend protocol if LFTs rising or INR > 2.", note:"Most common ADR: anaphylactoid reaction (flushing, rash, bronchospasm) ~15% — slow infusion rate, diphenhydramine 50 mg IV, temporary hold, then restart. NAC is antidote AND hepatoprotective even AFTER LFT elevation.", ref:"Prescott Protocol" },
      { cat:"🅐 Antidote", drug:"N-Acetylcysteine PO — 72h Protocol", dose:"140 mg/kg PO loading; then 70 mg/kg q4h × 17 doses (total 72h course)", renal:"No adjustment", ivpo:"PO / NG tube", deesc:"Equally effective as IV if tolerated. High nausea rate limits use. Can switch between IV ↔ PO protocols.", note:"Mix in juice or soda to mask sulfur taste. If vomited within 1h — repeat dose. Preferred by some centers for non-vomiting patients.", ref:"Rumack Protocol" },
      { cat:"🅑 GI Decon", drug:"Activated Charcoal", dose:"1 g/kg PO (max 50g) within 1–2h of ingestion if airway protected and no contraindications", renal:"N/A", ivpo:"PO / NG", deesc:"Do NOT delay NAC for charcoal — give charcoal then start NAC concurrently. Consider up to 4h for extended-release (Tylenol ER).", note:"Less effective > 2h. Contraindications: altered mental status (aspiration risk), GI obstruction, absent bowel sounds." },
      { cat:"🅒 ALF Management", drug:"Vitamin K1 (Phytonadione)", dose:"10 mg IV/SQ if INR rising; may repeat daily. Give IV SLOWLY over 30 min (rare anaphylaxis risk)", renal:"No adjustment", ivpo:"IV / SQ (avoid IM in coagulopathy)", deesc:"Replenishes vitamin K-dependent clotting factors. Not substitute for FFP in active bleeding. Adjunct to monitor synthetic function improvement.", note:"Monitor INR 6h after each dose. If INR not improving with Vitamin K = depleted synthetic capacity = worse prognosis.", ref:"Hepatology" },
    ],
    followup: [
      "Hepatology consult if AST/ALT > 1000, INR > 2, or rising creatinine",
      "Liver transplant evaluation immediately if King's College criteria met",
      "Continue extended NAC protocol until LFTs trending down AND INR < 2",
      "Mandatory psychiatric evaluation for intentional ingestions (majority of adult APAP ODs)",
      "Discharge education: strict 4 g/day maximum APAP; read ALL OTC labels; avoid with alcohol",
      "Follow-up LFTs at 24–48h if borderline nomogram presentation or delayed presentation",
    ]
  },
  salicylate: {
    overview: {
      def: "Salicylate (aspirin/salicylic acid) toxicity produces a unique mixed acid-base picture: primary respiratory alkalosis (direct medullary stimulation) + primary high anion-gap metabolic acidosis (mitochondrial uncoupling of oxidative phosphorylation). Acidemia is catastrophic — drives ionized salicylate across blood-brain barrier.",
      bullets: [
        "Classic triad: tinnitus + tachypnea + nausea/vomiting/GI pain",
        "Mixed acid-base: respiratory alkalosis + high anion-gap metabolic acidosis",
        "Acidemia is FATAL — pH < 7.4 drives salicylate into CNS causing cerebral edema",
        "Toxic: > 150 mg/kg; severe: > 300 mg/kg; level > 60 mg/dL requires HD consideration",
        "Enteric-coated: delayed, erratic, prolonged absorption — serial levels mandatory",
        "HD indications: level > 100 mg/dL, AKI, pulmonary edema, altered mental status, refractory acidosis",
      ]
    },
    workup: [
      { icon:"🧪", label:"Serial Salicylate Levels q2–4h", detail:"Until levels clearly declining. Done nomogram (acute ingestion only). Rising levels despite treatment = bezoar/enteric-coated." },
      { icon:"💉", label:"ABG + Electrolytes", detail:"Document mixed acid-base. Calculate anion gap. Bicarbonate level critical for alkalinization dosing. pH < 7.4 = emergency." },
      { icon:"🔬", label:"BMP + Serum Glucose", detail:"Hypoglycemia despite normal serum glucose — CNS glucose depleted. Glucose monitoring Q1h; treat empirically with D50W." },
      { icon:"🫁", label:"CXR + SpO₂", detail:"Non-cardiogenic pulmonary edema — precludes aggressive fluid loading. Avoid over-hydration." },
      { icon:"🧠", label:"Mental Status", detail:"Altered consciousness = CNS salicylate toxicity = severe; do NOT intubate unless absolutely necessary (loses hyperventilatory compensation)." },
    ],
    treatment: [
      { cat:"🅐 Alkalinization", drug:"Sodium Bicarbonate — Urinary Alkalinization", dose:"150 mEq NaHCO₃ in 1L D5W at 150–200 mL/hr; target urine pH 7.5–8.0 and serum pH 7.45–7.55", renal:"Caution AKI — may need early HD; monitor fluid balance", ivpo:"IV infusion", deesc:"Add 20–40 mEq KCl/L to infusion (hypokalemia blocks urinary alkalinization). Check urine pH q1h with dipstick.", note:"NEVER allow serum pH < 7.4 — drives salicylate into CNS. Hypokalemia must be corrected or alkalinization will fail (K+ shifts to urine instead of H+).", ref:"Prescott / Toxicology" },
      { cat:"🅑 Glucose", drug:"Dextrose D50W", dose:"25g (1 amp D50W) IV for ANY neurological symptoms regardless of serum glucose level; maintain serum BG 100–200 mg/dL", renal:"No adjustment", ivpo:"IV", deesc:"CNS glucose depletion despite normal serum levels. Empiric dextrose is safe and potentially life-saving. Add dextrose to bicarb infusion if BG < 150.", note:"Neuroglycopenia mechanism: salicylate uncouples glucose metabolism in CNS while serum glucose appears normal. Do NOT withhold.", ref:"Goldfrank's" },
      { cat:"🅒 Hemodialysis", drug:"Emergent Hemodialysis", dose:"Indications: level > 100 mg/dL; AKI; cerebral edema; pulmonary edema; refractory metabolic acidosis; level > 60 mg/dL with any clinical deterioration", renal:"Indicated FOR renal failure", ivpo:"Procedural", deesc:"Most effective elimination method — reduces level rapidly. Continue HD until < 30 mg/dL and clinical improvement. Consult nephrology at presentation for all moderate-severe cases.", note:"AVOID intubation if possible — loss of hyperventilatory compensation → acute acidemia → rapid CNS decompensation. If must intubate: hyperventilate to match patient's pre-intubation RR.", ref:"EXTRIP Guidelines" },
    ],
    followup: [
      "Observe minimum 6h for immediate-release ASA; 12–24h for enteric-coated formulations",
      "Serial levels until clearly downtrending — do NOT discharge with rising or plateau levels",
      "Mandatory psychiatric evaluation if intentional",
      "Educate on chronic salicylate toxicity risk — may be toxic at lower levels with chronic high-dose use",
      "Nephrology follow-up if transient AKI occurred",
    ]
  },
  digoxin: {
    overview: {
      def: "Digoxin toxicity from acute overdose or chronic accumulation (often from AKI, hypokalemia, drug interactions). Inhibits myocardial Na/K-ATPase pump → increased intracellular calcium → bradycardia, conduction block, and ventricular dysrhythmias. Bidirectional VT is near-pathognomonic. Digoxin immune Fab fragments (DigiFab) are life-saving.",
      bullets: [
        "Acute vs chronic: acute = hyperkalemia + more severe; chronic = hypokalemia facilitates toxicity",
        "ECG hallmarks: bradycardia, PAT with block, bidirectional VT, AV block, scooped ST (dig effect ≠ tox)",
        "Bidirectional VT is pathognomonic — immediate DigiFab required",
        "Hyperkalemia (K+ > 5 in acute OD) = poor prognostic marker; treat with DigiFab, NOT calcium",
        "Therapeutic: 0.5–2 ng/mL; toxic: > 2 ng/mL (chronic may be toxic at 1.5)",
        "Digoxin level unreliable in first 6h post-ingestion — must wait for distribution",
      ]
    },
    workup: [
      { icon:"🫀", label:"Continuous ECG Monitoring", detail:"PAT with block, bidirectional VT, VF, 2°/3° AV block, atrial fibrillation with slow ventricular response. Serial 12-leads q1h." },
      { icon:"🧪", label:"Digoxin Level (≥ 6h)", detail:"Must be at least 6h post-ingestion for distribution phase. Early levels unreliable. Repeat q4–6h. Clinical picture > lab value." },
      { icon:"💉", label:"Electrolytes (K+, Mg²⁺, Ca²⁺)", detail:"Hypokalemia/hypomagnesemia potentiate toxicity. Hyperkalemia in acute OD = severity marker. Correct K+ cautiously post-Fab (intracellular shift)." },
      { icon:"🔬", label:"Renal Function (BMP)", detail:"Digoxin is renally cleared. AKI dramatically worsens and prolongs toxicity. Guides DigiFab dosing calculation." },
      { icon:"🌡️", label:"Volume Status Assessment", detail:"Many digoxin-toxic patients have heart failure — complex hemodynamics. Avoid aggressive fluid loading." },
    ],
    treatment: [
      { cat:"🅐 Antidote", drug:"Digoxin Immune Fab (DigiFab)", dose:"EMPIRIC (unstable/arrest): 10–20 vials IV over 30 min. CALCULATED: vials = (serum level [ng/mL] × weight [kg]) ÷ 100. CHRONIC empiric: 3–6 vials", renal:"No dose reduction for AKI (Fab-dig complex excreted renally but Fab still binds free digoxin)", ivpo:"IV infusion (bolus in arrest)", deesc:"Heart rate and conduction normalize in 20–60 min. Total digoxin level RISES post-Fab (bound complex measured). Reassay FREE digoxin at 12h post-last Fab.", note:"One vial (38 mg) binds 0.5 mg digoxin. Anticipate hypokalemia post-Fab (K+ shifts intracellularly). Monitor K+ closely. Order early — procurement may take time.", ref:"DigiFab Prescribing Info" },
      { cat:"🅑 Dysrhythmia", drug:"Atropine", dose:"0.5–1 mg IV for symptomatic bradycardia; max 3 mg total; bridge to DigiFab effect", renal:"No adjustment", ivpo:"IV", deesc:"Temporizing measure only. Bridge to Fab or pacing. May be ineffective in complete AV block.", note:"External pacing if atropine fails and Fab not yet effective. Transvenous pacing carries risk of VF in digoxin-toxic myocardium — use cautiously.", ref:"ACLS 2023" },
      { cat:"🅒 Hyperkalemia", drug:"Sodium Bicarbonate", dose:"50–100 mEq IV for K+ > 6.0 in acute digoxin OD; insulin/dextrose second choice; AVOID calcium (theoretical 'stone heart')", renal:"Monitor Na+", ivpo:"IV", deesc:"Bicarb shifts K+ intracellularly. Traditional teaching: avoid IV calcium — 'stone heart' theoretical concern (mixed evidence). DigiFab is definitive — temporize.", note:"Some modern toxicologists use calcium for life-threatening hyperkalemia while awaiting Fab. Discuss with Poison Control. 1–800–222–1222.", ref:"Goldfrank's" },
      { cat:"🅒 Ventricular Dysrhythmia", drug:"Magnesium Sulfate", dose:"2 g IV over 10–20 min; may repeat once; for ventricular dysrhythmias as bridge to DigiFab", renal:"Reduce in severe AKI (CrCl < 30)", ivpo:"IV", deesc:"Stabilizes myocardial membranes. Useful for bidirectional VT as bridge. AVOID lidocaine, Class IA/IC agents (worsen conduction).", note:"Amiodarone relatively contraindicated. Phenytoin historically used — now avoided. Electrical cardioversion generally avoided (may precipitate refractory VF).", ref:"Toxicology" },
    ],
    followup: [
      "Monitor K+ and ECG q1–2h for 4–6h post-DigiFab (hypokalemia from K+ shift back intracellularly)",
      "Rebound toxicity in renal failure (Fab complex releases digoxin) — reassay free digoxin level at 12h and 24h",
      "Reassess necessity of digoxin — many current heart failure and AF indications no longer evidence-based",
      "If continuing: dose adjustment for renal function; drug interaction review (amiodarone, verapamil, macrolides double levels)",
      "Cardiology follow-up within 1 week with repeat level at steady state",
      "Mandatory psychiatric evaluation if intentional overdose",
    ]
  },
};

// ── DrugRow Component ──────────────────────────────────────────────
function DrugRow({ d, color, idx }) {
  const [open, setOpen] = useState(null);
  const catColors = { "🅐":T.coral, "🅑":T.blue, "🅒":T.teal };
  const cc = catColors[d.cat[0]] || color;
  const panels = [
    { id:0, icon:"📋", label:"Details", content: <><b style={{color:T.txt2}}>Dose: </b>{d.dose}<br/><br/><b style={{color:T.txt2}}>Route: </b>{d.ivpo}<br/><br/><b style={{color:T.txt2}}>Renal: </b>{d.renal}</> },
    { id:1, icon:"🔧", label:"Alt / Setup", content: <><b style={{color:T.txt2}}>Step-Down / Alt: </b>{d.deesc}{d.note ? <><br/><br/><b style={{color:T.txt2}}>Clinical Note: </b>{d.note}</> : null}</> },
    { id:2, icon:"📉", label:"Monitoring / Ref", content: <><b style={{color:T.txt2}}>Monitoring: </b>Serial ECG, vitals q15–30 min, labs per protocol<br/><br/><b style={{color:T.txt2}}>Reference: </b>{d.ref}</> },
  ];
  return (
    <div className="drug-row" style={{marginBottom:10,borderRadius:12,overflow:"hidden",border:`1px solid ${open!==null?cc+"66":"rgba(42,79,122,0.3)"}`,background:"rgba(8,22,40,0.6)",transition:"border-color .2s"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 16px",background:open!==null?`linear-gradient(90deg,${cc}18,transparent)`:"transparent"}}>
        <span style={{fontFamily:"JetBrains Mono",fontSize:11,color:cc,background:`${cc}22`,padding:"2px 8px",borderRadius:4,whiteSpace:"nowrap"}}>{d.cat}</span>
        <span style={{fontFamily:"DM Sans",fontWeight:600,color:T.txt,flex:1,fontSize:14}}>{d.drug}</span>
        <span style={{fontFamily:"JetBrains Mono",fontSize:11,color:T.txt3}}>{d.ivpo}</span>
      </div>
      <div style={{padding:"4px 16px 10px",display:"flex",gap:8,flexWrap:"wrap"}}>
        {panels.map(p=>(
          <button key={p.id} onClick={()=>setOpen(open===p.id?null:p.id)} style={{fontFamily:"DM Sans",fontSize:12,padding:"5px 12px",borderRadius:6,border:`1px solid ${open===p.id?cc+"99":"rgba(42,79,122,0.4)"}`,background:open===p.id?`${cc}22`:"rgba(14,37,68,0.8)",color:open===p.id?cc:T.txt2,cursor:"pointer",fontWeight:open===p.id?600:400,transition:"all .15s"}}>
            {p.icon} {p.label}
          </button>
        ))}
      </div>
      {open!==null && (
        <div className="fade-in" style={{margin:"0 16px 14px",padding:14,background:"rgba(5,15,30,0.7)",borderRadius:10,border:`1px solid ${cc}33`,fontFamily:"DM Sans",fontSize:13,color:T.txt2,lineHeight:1.7}}>
          {panels[open].content}
        </div>
      )}
    </div>
  );
}

// ── Tab Components ─────────────────────────────────────────────────
function OverviewTab({ ov }) {
  return (
    <div className="fade-in">
      <div style={{background:"rgba(14,37,68,0.5)",border:"1px solid rgba(42,79,122,0.3)",borderRadius:14,padding:"20px 22px",marginBottom:16}}>
        <div style={{fontFamily:"JetBrains Mono",fontSize:11,color:T.teal,textTransform:"uppercase",letterSpacing:2,marginBottom:10}}>DEFINITION</div>
        <p style={{fontFamily:"DM Sans",fontSize:14,color:T.txt,lineHeight:1.8}}>{ov.def}</p>
      </div>
      <div style={{background:"rgba(14,37,68,0.5)",border:"1px solid rgba(42,79,122,0.3)",borderRadius:14,padding:"20px 22px"}}>
        <div style={{fontFamily:"JetBrains Mono",fontSize:11,color:T.teal,textTransform:"uppercase",letterSpacing:2,marginBottom:14}}>KEY CLINICAL PEARLS</div>
        {ov.bullets.map((b,i)=>(
          <div key={i} style={{display:"flex",gap:12,marginBottom:12,alignItems:"flex-start"}}>
            <span style={{color:T.teal,fontFamily:"JetBrains Mono",fontSize:13,minWidth:18}}>▸</span>
            <span style={{fontFamily:"DM Sans",fontSize:13.5,color:T.txt2,lineHeight:1.65}}>{b}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function WorkupTab({ wk }) {
  return (
    <div className="fade-in">
      <div style={{fontFamily:"JetBrains Mono",fontSize:11,color:T.gold,textTransform:"uppercase",letterSpacing:2,marginBottom:14}}>DIAGNOSTIC WORKUP CHECKLIST</div>
      {wk.map((item,i)=>(
        <div key={i} style={{display:"flex",gap:12,padding:"13px 16px",background:"rgba(14,37,68,0.5)",border:"1px solid rgba(42,79,122,0.25)",borderRadius:12,marginBottom:8,alignItems:"flex-start"}}>
          <span style={{fontSize:18,minWidth:28}}>{item.icon}</span>
          <div style={{flex:1}}>
            <div style={{fontFamily:"DM Sans",fontWeight:600,color:T.txt,fontSize:14,marginBottom:4}}>{item.label}</div>
            <div style={{fontFamily:"DM Sans",fontSize:13,color:T.txt2,lineHeight:1.6}}>{item.detail}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProtocolTab({ tx, color }) {
  return (
    <div className="fade-in">
      <div style={{fontFamily:"JetBrains Mono",fontSize:11,color:T.orange,textTransform:"uppercase",letterSpacing:2,marginBottom:14}}>TREATMENT PROTOCOL</div>
      {tx.map((d,i)=><DrugRow key={i} d={d} color={color} idx={i}/>)}
    </div>
  );
}

function FollowupTab({ fu }) {
  return (
    <div className="fade-in">
      <div style={{fontFamily:"JetBrains Mono",fontSize:11,color:T.purple,textTransform:"uppercase",letterSpacing:2,marginBottom:14}}>DISCHARGE & FOLLOW-UP</div>
      {fu.map((item,i)=>(
        <div key={i} style={{display:"flex",gap:14,padding:"12px 16px",background:"rgba(14,37,68,0.5)",border:"1px solid rgba(42,79,122,0.25)",borderRadius:12,marginBottom:8}}>
          <span style={{fontFamily:"JetBrains Mono",fontSize:12,color:T.purple,minWidth:24}}>{String(i+1).padStart(2,"0")}</span>
          <span style={{fontFamily:"DM Sans",fontSize:13.5,color:T.txt2,lineHeight:1.65}}>{item}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main Hub ───────────────────────────────────────────────────────
export default function ToxHub() {
  const [sel, setSel] = useState("opioid");
  const [tab, setTab] = useState("overview");
  const [filter, setFilter] = useState("All");
  const cond = CONDITIONS.find(c=>c.id===sel) || CONDITIONS[0];
  const data = DATA[sel] || DATA[CONDITIONS[0].id];
  const cats = ["All","Toxidrome","Overdose"];
  const filtered = filter==="All"?CONDITIONS:CONDITIONS.filter(c=>c.cat===filter);
  const tabs = [
    { id:"overview", label:"Overview", icon:"📖" },
    { id:"workup",   label:"Workup",   icon:"🔬" },
    { id:"protocol", label:"Protocol", icon:"💉" },
    { id:"followup", label:"Follow-up",icon:"📋" },
  ];
  const glassCard = { backdropFilter:"blur(24px) saturate(200%)", WebkitBackdropFilter:"blur(24px) saturate(200%)", background:"rgba(8,22,40,0.75)", border:"1px solid rgba(42,79,122,0.35)", borderRadius:16 };
  const deepGlass = { backdropFilter:"blur(40px) saturate(220%)", WebkitBackdropFilter:"blur(40px) saturate(220%)", background:"rgba(5,15,30,0.85)", border:"1px solid rgba(26,53,85,0.6)" };

  return (
    <div style={{ fontFamily:"DM Sans",background:T.bg,minHeight:"100vh",position:"relative",overflow:"hidden" }}>
      {/* Ambient BG */}
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0}}>
        <div style={{position:"absolute",top:"-20%",left:"-10%",width:"60%",height:"60%",background:`radial-gradient(circle,${cond.color}18 0%,transparent 70%)`,transition:"background 1s ease"}}/>
        <div style={{position:"absolute",bottom:"-20%",right:"-10%",width:"50%",height:"50%",background:"radial-gradient(circle,rgba(59,158,255,0.12) 0%,transparent 70%)"}}/>
        <div style={{position:"absolute",top:"40%",left:"50%",width:"40%",height:"40%",background:"radial-gradient(circle,rgba(0,229,192,0.06) 0%,transparent 70%)"}}/>
      </div>
      <div style={{position:"relative",zIndex:1,maxWidth:1200,margin:"0 auto",padding:"0 16px"}}>

        {/* Header */}
        <div style={{padding:"24px 0 16px"}}>
          <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:6}}>
            <div style={{...deepGlass,borderRadius:12,padding:"6px 14px",display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.teal,letterSpacing:3,textTransform:"uppercase"}}>NOTRYA</span>
              <span style={{color:T.txt4,fontFamily:"JetBrains Mono",fontSize:10}}>/</span>
              <span style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.txt3,letterSpacing:2}}>TOX</span>
            </div>
            <div style={{height:1,flex:1,background:"linear-gradient(90deg,rgba(42,79,122,0.6),transparent)"}}/>
          </div>
          <h1 className="shimmer-text" style={{fontFamily:"Playfair Display",fontSize:"clamp(28px,5vw,46px)",fontWeight:900,letterSpacing:-1,lineHeight:1.1}}>
            Toxicology Hub
          </h1>
          <p style={{fontFamily:"DM Sans",fontSize:14,color:T.txt3,marginTop:6,letterSpacing:.3}}>Emergency Antidotes · Toxidromes · Overdose Protocols</p>
        </div>

        {/* Banner Targets */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:10,marginBottom:20}}>
          {BANNER.map((b,i)=>(
            <div key={i} className="banner-item" style={{...glassCard,padding:"14px 18px",borderLeft:`3px solid ${b.color}`,background:`linear-gradient(135deg,${b.color}14,rgba(8,22,40,0.8))`}}>
              <div style={{fontFamily:"JetBrains Mono",fontSize:20,fontWeight:700,color:b.color}}>{b.value}</div>
              <div style={{fontFamily:"DM Sans",fontWeight:600,color:T.txt,fontSize:13,margin:"2px 0"}}>{b.label}</div>
              <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt3}}>{b.sub}</div>
            </div>
          ))}
        </div>

        {/* Main Layout */}
        <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>

          {/* Sidebar */}
          <div style={{width:260,flexShrink:0}}>
            {/* Filter */}
            <div style={{...glassCard,padding:"10px",marginBottom:10,display:"flex",gap:6}}>
              {cats.map(c=>(
                <button key={c} onClick={()=>setFilter(c)} style={{flex:1,fontFamily:"DM Sans",fontWeight:600,fontSize:11,padding:"6px",borderRadius:8,border:`1px solid ${filter===c?"rgba(42,79,122,0.8)":"transparent"}`,background:filter===c?"rgba(14,37,68,0.9)":"transparent",color:filter===c?T.txt:T.txt3,cursor:"pointer",transition:"all .15s"}}>
                  {c}
                </button>
              ))}
            </div>
            {/* Condition List */}
            <div style={{...glassCard,padding:8,overflow:"auto",maxHeight:"calc(100vh - 280px)"}}>
              {filtered.map(c=>(
                <div key={c.id} className={`cond-item${sel===c.id?" cond-active":""}`} onClick={()=>{setSel(c.id);setTab("overview")}}
                  style={{"--cc":c.color,position:"relative",padding:"10px 14px",borderRadius:10,marginBottom:4,background:sel===c.id?`linear-gradient(90deg,${c.gl},rgba(14,37,68,0.6))`:"transparent",border:`1px solid ${sel===c.id?c.br:"transparent"}`,transition:"all .2s"}}>
                  <div style={{display:"flex",gap:10,alignItems:"center"}}>
                    <span style={{fontSize:18}}>{c.icon}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontFamily:"DM Sans",fontWeight:600,fontSize:13,color:sel===c.id?T.txt:T.txt2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.title}</div>
                      <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt3,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.sub}</div>
                    </div>
                    <span style={{fontFamily:"JetBrains Mono",fontSize:9,color:c.color,background:`${c.color}22`,padding:"2px 6px",borderRadius:4,whiteSpace:"nowrap"}}>{c.cat}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Content Panel */}
          <div style={{flex:1,minWidth:0}}>
            {/* Condition Header */}
            <div style={{...glassCard,padding:"18px 22px",marginBottom:12,background:`linear-gradient(135deg,${cond.gl},rgba(8,22,40,0.85))`,borderColor:cond.br,position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:-30,right:-30,fontSize:120,opacity:.06}}>{cond.icon}</div>
              <div style={{display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
                <span style={{fontSize:36}}>{cond.icon}</span>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
                    <h2 style={{fontFamily:"Playfair Display",fontSize:"clamp(18px,3vw,26px)",fontWeight:700,color:T.txt}}>{cond.title}</h2>
                    <span style={{fontFamily:"JetBrains Mono",fontSize:10,color:cond.color,background:`${cond.color}22`,padding:"2px 8px",borderRadius:4,border:`1px solid ${cond.color}44`}}>{cond.cat}</span>
                  </div>
                  <div style={{fontFamily:"DM Sans",fontSize:13,color:T.txt2}}>{cond.sub}</div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div style={{...glassCard,padding:"8px",display:"flex",gap:6,marginBottom:14}}>
              {tabs.map(t=>(
                <button key={t.id} className="tab-pill" onClick={()=>setTab(t.id)}
                  style={{flex:1,fontFamily:"DM Sans",fontWeight:600,fontSize:12,padding:"9px 6px",borderRadius:10,border:`1px solid ${tab===t.id?cond.color+"66":"transparent"}`,background:tab===t.id?`linear-gradient(135deg,${cond.color}22,${cond.color}11)`:"transparent",color:tab===t.id?cond.color:T.txt3,cursor:"pointer",textAlign:"center",whiteSpace:"nowrap"}}>
                  <span style={{marginRight:4}}>{t.icon}</span>{t.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div style={{...glassCard,padding:"20px",minHeight:400,overflow:"auto",maxHeight:"calc(100vh - 400px)"}}>
              {tab==="overview" && <OverviewTab ov={data.overview}/>}
              {tab==="workup"   && <WorkupTab wk={data.workup}/>}
              {tab==="protocol" && <ProtocolTab tx={data.treatment} color={cond.color}/>}
              {tab==="followup" && <FollowupTab fu={data.followup}/>}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{textAlign:"center",padding:"16px 0 24px"}}>
          <span style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.txt4,letterSpacing:2}}>NOTRYA TOXICOLOGY HUB · FOR CLINICAL REFERENCE ONLY · ALWAYS CONSULT POISON CONTROL 1-800-222-1222</span>
        </div>
      </div>
    </div>
  );
}