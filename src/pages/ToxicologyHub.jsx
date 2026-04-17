// ToxicologyHub.jsx
// 16 antidotes · 11 ingestion protocols · Rumack-Matthew nomogram ·
// toxidrome recognition · poison control reference
//
// Props:
//   embedded  bool          — suppress header/chrome when hosted inside another page
//   onBack    () => void    — navigate back to hub list (replaces router dependency)
//   demo, cc, vitals        — optional patient context (future use)
//
// Place at @/pages/ToxicologyHub.jsx
//
// Constraints: no form, no localStorage, no router, no sonner, no alert,
//   straight quotes only, border before borderTop/etc.

import { useState, useMemo, useCallback } from "react";

// ── Font injection ─────────────────────────────────────────────────────────────
(() => {
  if (document.getElementById("tox-fonts")) return;
  const l = document.createElement("link");
  l.id = "tox-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "tox-css";
  s.textContent = `
    @keyframes tox-fade{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
    .tox-fade{animation:tox-fade .18s ease forwards;}
    @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
    .shimmer-text{background:linear-gradient(90deg,#e8f0fe 0%,#fff 30%,#9b6dff 52%,#00e5c0 72%,#e8f0fe 100%);
    background-size:250% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;
    background-clip:text;animation:shimmer 5s linear infinite;}
  `;
  document.head.appendChild(s);
})();

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:"#050f1e", panel:"#081628", card:"#0b1e36",
  txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", blue:"#3b9eff",
  orange:"#ff9f43", purple:"#9b6dff", green:"#3dffa0", red:"#ff4444",
  cyan:"#00d4ff",
};

// ── ANTIDOTES ─────────────────────────────────────────────────────────────────
const ANTIDOTES = [
  { antidote:"N-Acetylcysteine (NAC)", toxin:"Acetaminophen (APAP)", color:T.teal, route:"IV or PO",
    dosing:"IV: 150 mg/kg over 60 min \u2192 50 mg/kg over 4h \u2192 100 mg/kg over 16h. PO: 140 mg/kg load \u2192 70 mg/kg q4h \u00d7 17 doses.",
    timing:"Most effective within 8\u201310h of ingestion. Still give >24h post-ingestion in fulminant failure.",
    pearls:"Check APAP level at 4h post-ingestion. Plot on Rumack-Matthew nomogram. ALT trending up = continue NAC regardless of level.", urgency:"urgent" },
  { antidote:"Flumazenil", toxin:"Benzodiazepines", color:T.purple, route:"IV",
    dosing:"0.2 mg IV over 30 sec; repeat 0.2 mg q1 min to max 1 mg total.",
    timing:"Short half-life \u2014 resedation likely within 1\u20132h. Re-dose or infusion may be needed.",
    pearls:"CONTRAINDICATED in: chronic BZD users (precipitates seizures), mixed TCA ingestion, seizures controlled by BZD, elevated ICP. Use is rarely indicated \u2014 manage airway instead.", urgency:"caution" },
  { antidote:"Naloxone", toxin:"Opioids", color:T.green, route:"IV / IM / IN / ETT",
    dosing:"0.4\u20132 mg IV/IM. Titrate to respirations \u2014 NOT to full reversal. IN: 4 mg (2 mg per nostril). Infusion: 2/3 of reversal dose per hour.",
    timing:"Onset IV 1\u20132 min, IM 5 min, IN 5\u201310 min. Half-life 60\u201390 min \u2014 shorter than most opioids.",
    pearls:"Buprenorphine requires much higher doses (4\u20138 mg+). Methadone: prolonged monitoring required. Fentanyl analogues: may require repeated large doses.", urgency:"urgent" },
  { antidote:"Atropine", toxin:"Organophosphates / Carbamates / Nerve agents", color:T.orange, route:"IV / IM",
    dosing:"2\u20134 mg IV q5\u201310 min until secretions dry. No ceiling dose \u2014 titrate to bronchorrhea resolution, NOT to heart rate. Can require hundreds of mg in severe cases.",
    timing:"Start immediately for symptomatic cholinergic toxidrome. Do not delay for pralidoxime.",
    pearls:"Titration endpoint: drying of secretions, clearing breath sounds \u2014 NOT pupil dilation or heart rate. Pralidoxime (2-PAM) 1\u20132 g IV simultaneously for organophosphate (not carbamate).", urgency:"immediate" },
  { antidote:"Pralidoxime (2-PAM)", toxin:"Organophosphates", color:T.orange, route:"IV",
    dosing:"1\u20132 g IV over 15\u201330 min. Infusion: 200\u2013500 mg/hr. Give within 24\u201348h of exposure.",
    timing:"Give with atropine \u2014 do not use as a substitute. Most effective before enzyme aging.",
    pearls:"NOT for carbamate poisoning. Ineffective once aging occurs. Requires ICU admission.", urgency:"urgent" },
  { antidote:"Digoxin-Specific Fab (Digibind / DigiFab)", toxin:"Digoxin / Digitalis glycosides", color:T.blue, route:"IV",
    dosing:"Known dose: vials = (mg ingested \u00d7 0.8) / 0.5. Known level: vials = (level ng/mL \u00d7 wt kg) / 100. Empiric acute OD: 10\u201320 vials. Empiric chronic: 1\u20136 vials.",
    timing:"Indicated for: life-threatening dysrhythmia, K+ >5.5, hemodynamic instability, level >15 ng/mL (acute).",
    pearls:"Post-digibind levels are unreliable. Potassium shifts rapidly \u2014 monitor closely. Renal failure: prolonged half-life of complex.", urgency:"urgent" },
  { antidote:"Sodium Bicarbonate", toxin:"Tricyclic antidepressants (TCA) / Sodium channel blockers", color:T.coral, route:"IV",
    dosing:"1\u20132 mEq/kg IV bolus. Repeat until QRS <120 ms or pH 7.45\u20137.55. Infusion: 150 mEq in 1L D5W at 1.5\u00d7 maintenance.",
    timing:"Give for QRS >100 ms, ventricular dysrhythmia, or hypotension from TCA.",
    pearls:"Target pH 7.45\u20137.55 \u2014 alkalinization is the mechanism, not just sodium loading. Also for: cocaine QRS widening, flecainide, type Ia/Ic antiarrhythmics.", urgency:"immediate" },
  { antidote:"Calcium (Gluconate or Chloride)", toxin:"Calcium channel blockers / Beta-blockers / Hyperkalemia / Fluoride", color:T.gold, route:"IV",
    dosing:"CCB OD: calcium gluconate 3g IV (CaCl 1g IV) over 5 min; repeat \u00d7 3. HDI: regular insulin 1 unit/kg bolus + D50 \u2192 0.5\u20131 unit/kg/hr infusion. Intralipid 1.5 mL/kg bolus for refractory CCB.",
    timing:"Give early in CCB/BB OD \u2014 before hemodynamic collapse.",
    pearls:"CaCl provides 3\u00d7 more elemental calcium than gluconate \u2014 use centrally. High-dose insulin (HDI) is now first-line for severe CCB toxicity along with calcium.", urgency:"urgent" },
  { antidote:"Fomepizole (4-MP)", toxin:"Methanol / Ethylene glycol", color:T.cyan, route:"IV",
    dosing:"15 mg/kg IV loading dose over 30 min \u2192 10 mg/kg q12h \u00d7 4 doses \u2192 15 mg/kg q12h. Continue until level <20 mg/dL and asymptomatic.",
    timing:"Give immediately on clinical suspicion \u2014 do not wait for confirmatory levels.",
    pearls:"Blocks alcohol dehydrogenase \u2014 prevents toxic metabolite formation. Ethanol infusion is alternative if unavailable. Dialysis removes parent compound and metabolites.", urgency:"urgent" },
  { antidote:"Physostigmine", toxin:"Anticholinergic toxidrome (pure \u2014 not mixed TCA)", color:T.purple, route:"IV",
    dosing:"1\u20132 mg IV over 5 min. May repeat once in 20 min if needed. Pediatric: 0.02 mg/kg (max 0.5 mg) over 5 min.",
    timing:"Use only for pure anticholinergic toxidrome \u2014 absolutely contraindicated if TCA suspected.",
    pearls:"CONTRAINDICATED in: TCA or other sodium channel blocker ingestion (fatal bradycardia/asystole). Not for routine use. Consult toxicology.", urgency:"caution" },
  { antidote:"Pyridoxine (Vitamin B6)", toxin:"Isoniazid (INH) / Gyromitra mushrooms", color:T.green, route:"IV",
    dosing:"INH: 1 mg pyridoxine per 1 mg INH ingested. Unknown dose: 5 g IV. Give simultaneously with benzodiazepines.",
    timing:"Give immediately for INH-induced status epilepticus \u2014 BZD alone will fail without pyridoxine.",
    pearls:"INH seizures are pyridoxine-depleted status \u2014 BZD + pyridoxine required. Phenytoin is ineffective for INH seizures.", urgency:"immediate" },
  { antidote:"Hydroxocobalamin", toxin:"Cyanide / Smoke inhalation", color:T.red, route:"IV",
    dosing:"5 g IV over 15 min (adult). Pediatric: 70 mg/kg. Repeat 5 g if hemodynamically unstable. Max 15 g total.",
    timing:"First-line for smoke inhalation with suspected cyanide. Give empirically.",
    pearls:"Turns urine red for 5 days. Causes false SpO2 elevations \u2014 use co-oximetry. Compatible with sodium thiosulfate.", urgency:"immediate" },
  { antidote:"Methylene Blue", toxin:"Methemoglobinemia", color:T.blue, route:"IV",
    dosing:"1\u20132 mg/kg IV over 5 min. Repeat 1 mg/kg in 1h if inadequate response. Max 7 mg/kg total.",
    timing:"Indicated for MetHb >30% or symptomatic at lower levels. Response expected within 30\u201360 min.",
    pearls:"Ineffective in G6PD deficiency \u2014 exchange transfusion for G6PD patients. Common causes: dapsone, benzocaine, nitrites, primaquine. Co-oximetry required.", urgency:"urgent" },
  { antidote:"Lipid Emulsion (Intralipid 20%)", toxin:"Lipophilic drug toxicity \u2014 local anesthetics, CCB, TCA", color:T.gold, route:"IV",
    dosing:"1.5 mL/kg IV bolus over 1 min. Repeat \u00d72 if no response. Infusion: 0.25 mL/kg/min for 30\u201360 min. Max 10\u201312 mL/kg.",
    timing:"Cardiac arrest or peri-arrest from lipophilic drug toxicity \u2014 give when all else fails.",
    pearls:"Mechanism: lipid sink draws drug from tissues. Used for: bupivacaine arrest, refractory CCB, TCA. Continue vasopressors. Do not use propofol as lipid source.", urgency:"urgent" },
  { antidote:"Glucagon", toxin:"Beta-blockers / Calcium channel blockers", color:T.orange, route:"IV",
    dosing:"3\u201310 mg IV bolus over 1\u20132 min. Infusion: effective bolus dose per hour. HDI is preferred first-line.",
    timing:"Onset 1\u20133 min. Duration 15\u201320 min. Use while setting up HDI therapy.",
    pearls:"Induces nausea/vomiting \u2014 have airway ready. Tachyphylaxis limits sustained use.", urgency:"urgent" },
  { antidote:"Deferoxamine", toxin:"Iron overdose", color:T.red, route:"IV",
    dosing:"15 mg/kg/hr IV (max 35 mg/kg/hr severe). Continue until urine clears (vin rose color resolves) and clinical improvement.",
    timing:"Indicated for: serum iron >500 mcg/dL, symptomatic poisoning, metabolic acidosis.",
    pearls:"Chelates free iron \u2014 urine turns rose/wine color when effective. Do not use orally. Discontinue after 24h \u2014 risk of ARDS with prolonged use.", urgency:"urgent" },
];

// ── INGESTION PROTOCOLS ───────────────────────────────────────────────────────
const PROTOCOLS = [
  {
    id:"apap", name:"Acetaminophen", icon:"\uD83D\uDC8A", color:T.teal,
    alert:"Plot serum APAP level (drawn at \u22654h post-ingestion) on Rumack-Matthew nomogram \u2014 see Nomogram tab",
    sections:[
      { label:"Immediate Steps", color:T.teal, items:["IV access \u00d7 2, cardiac monitor, pulse ox","APAP level (must be \u22654h post-ingestion to plot nomogram)","LFTs, PT/INR, BMP, acetaminophen, ethanol level","Activated charcoal 1 g/kg PO/NG if <1h post-ingestion and protected airway"] },
      { label:"Antidote", color:T.orange, items:["NAC if APAP level plots above treatment line on nomogram","NAC if >8h post-ingestion and level still pending \u2014 do not wait","NAC for any symptomatic hepatotoxicity regardless of level","IV NAC preferred \u2014 3-bag protocol (see antidote reference)"] },
      { label:"Monitoring", color:T.blue, items:["LFTs q8\u201312h during NAC therapy","PT/INR \u2014 hepatotoxicity marker","If ALT rising: continue NAC regardless of level normalization","Transplant evaluation if: INR >6, creatinine >3.4, Grade III/IV encephalopathy (King\u2019s College Criteria)"] },
    ],
    pearl:"A single APAP level drawn <4h post-ingestion cannot be plotted \u2014 repeat at 4h. Unknown time of ingestion = assume worst case and treat.",
  },
  {
    id:"tca", name:"Tricyclic Antidepressants", icon:"\u26A1", color:T.coral,
    alert:"QRS >100 ms = sodium bicarbonate NOW \u2014 do not wait for worsening",
    sections:[
      { label:"Immediate Steps", color:T.coral, items:["12-lead EKG immediately \u2014 QRS width, terminal R in aVR, R:S ratio >0.7 in aVR","Continuous cardiac monitoring \u2014 dysrhythmia can occur suddenly","IV access \u00d7 2, O2, establish airway early if AMS","BMP, acetaminophen, salicylate, TCA level (level correlates poorly \u2014 EKG is better)"] },
      { label:"Antidote / Treatment", color:T.orange, items:["QRS >100 ms or dysrhythmia: sodium bicarbonate 1\u20132 mEq/kg IV bolus now","Repeat bicarb until QRS <100 ms \u2014 titrate to pH 7.45\u20137.55","Hypotension: IVF 1\u20132L, then norepinephrine \u2014 avoid dopamine","Seizures: benzodiazepines only \u2014 phenytoin is CONTRAINDICATED in TCA seizures"] },
      { label:"Dangerous Combinations", color:T.red, items:["Flumazenil: absolutely contraindicated \u2014 precipitates refractory seizures","Physostigmine: contraindicated \u2014 fatal bradycardia and asystole","Phenytoin: contraindicated for TCA-induced seizures","Sodium channel blockers (type Ia/Ic antiarrhythmics): avoid"] },
    ],
    pearl:"The R wave in aVR >3 mm and R:S ratio >0.7 in aVR are the most specific EKG findings for TCA toxicity. Alkalinization, not just sodium, is the mechanism of bicarb.",
  },
  {
    id:"ccb", name:"Calcium Channel Blockers", icon:"\u2764\uFE0F", color:T.orange,
    alert:"High-dose insulin (HDI) is first-line \u2014 start early, do not wait for refractory hemodynamics",
    sections:[
      { label:"Immediate Steps", color:T.orange, items:["12-lead EKG, continuous monitoring \u2014 bradycardia, AV block, wide complex","IV access \u00d7 2, BMP (glucose), cardiac monitor","Transcutaneous pacer at bedside \u2014 transvenous for sustained complete heart block","BGL monitoring q30min during HDI therapy"] },
      { label:"First-Line Treatment", color:T.teal, items:["Calcium gluconate 3g IV (or CaCl 1g IV) over 5 min \u2014 repeat \u00d7 3 prn","HDI: regular insulin 1 unit/kg IV bolus + D50 1 amp \u2192 infusion 0.5\u20131 unit/kg/hr","Dextrose 0.5 g/kg/hr infusion with HDI \u2014 maintain glucose 100\u2013250 mg/dL","Vasopressors: norepinephrine or vasopressin for persistent hypotension"] },
      { label:"Salvage Therapies", color:T.red, items:["Lipid emulsion 20% (Intralipid): 1.5 mL/kg bolus for arrest or peri-arrest","Glucagon 3\u201310 mg IV bolus as bridge therapy (vomiting risk \u2014 protect airway)","ECMO / VA-ECMO for refractory cardiovascular collapse","Contact poison control and toxicology early \u2014 CCB OD has high mortality"] },
    ],
    pearl:"Dihydropyridines (amlodipine, nifedipine): vasodilation + reflex tachycardia. Non-dihydropyridines (diltiazem, verapamil): bradycardia + AV block. HDI improves myocardial metabolism \u2014 start with hemodynamic instability, not only in arrest.",
  },
  {
    id:"co", name:"Carbon Monoxide Poisoning", icon:"\uD83D\uDCA8", color:T.blue,
    alert:"HBO2 vs normobaric O2 \u2014 ACEP January 2025: aggregate evidence does NOT show HBO2 superior to normobaric O2 for most cognitive outcomes at 6 weeks",
    sections:[
      { label:"Immediate Management", color:T.blue, items:["100% O2 via non-rebreather mask IMMEDIATELY \u2014 do not wait for COHgb level","Remove from CO source \u2014 decontamination is treatment","IV access, cardiac monitor, 12-lead EKG \u2014 CO causes myocardial injury","Co-oximetry for COHgb level \u2014 pulse ox unreliable (reads COHgb as oxyhemoglobin)","BMP, lactate, troponin, CBC, ABG"] },
      { label:"COHgb Thresholds", color:T.teal, items:["COHgb > 25%: severe \u2014 consider HBO2 consultation","COHgb > 15% + neurologic symptoms: HBO2 consultation","COHgb > 15% + cardiovascular involvement: HBO2 consultation","Pregnancy: lower threshold \u2014 COHgb > 15% or any symptoms","Note: COHgb correlates poorly with clinical severity \u2014 use clinical picture, not level alone"] },
      { label:"HBO2 vs Normobaric O2 \u2014 ACEP 2025", color:T.gold, items:["ACEP January 2025: aggregate data does NOT show HBO2 superior to normobaric O2 for most cognitive outcomes at 6 weeks","Scheinkestel 1999 (pro-HBO2): significant methodologic limitations","Weaver 2002 (pro-HBO2): positive for cognitive sequelae, but single center","Meta-analyses: inconsistent results \u2014 no Class A/B evidence favoring HBO2 for routine use","HBO2 considered case-by-case for severe cases (LOC, seizure, cardiac, COHgb >25%, pregnancy)","Normobaric 100% O2 \u00d7 5\u20136 hours remains standard of care for most patients"] },
      { label:"Disposition", color:T.orange, items:["Mild (COHgb < 15%, no symptoms beyond headache): 6h observation","Moderate (COHgb 15\u201325% or neurologic symptoms): admission for monitoring","Severe (LOC, seizure, cardiac involvement): ICU + HBO2 consultation","All patients: evaluate for source \u2014 do NOT return to potentially contaminated environment","Delayed neurologic syndrome: 3\u2013240 days post-exposure (personality change, memory loss)"] },
    ],
    pearl:"Pulse oximetry reads COHgb as oxyhemoglobin \u2014 SpO2 99% with COHgb 40% is possible. Only co-oximetry accurately measures COHgb. ACEP 2025 does not recommend routine HBO2 for mild-moderate CO poisoning.",
  },
  {
    id:"opioid", name:"Opioid Toxidrome", icon:"\uD83D\uDCA4", color:T.purple,
    alert:"Fentanyl analogues may require 10+ mg naloxone \u2014 have high threshold to intubate",
    sections:[
      { label:"Immediate Steps", color:T.purple, items:["Airway \u2014 BVM if apneic before naloxone","Naloxone 0.4\u20132 mg IV/IM/IN \u2014 titrate to respirations, not full reversal","Do not fully reverse in opioid-tolerant patients \u2014 precipitates acute withdrawal","ACLS if in cardiac arrest \u2014 naloxone + CPR simultaneously"] },
      { label:"Specific Agents", color:T.blue, items:["Buprenorphine: partial agonist \u2014 requires 4\u20138+ mg naloxone, may be partially reversible","Methadone: long half-life (24\u201336h) \u2014 prolonged monitoring after naloxone","Fentanyl/carfentanil analogues: extreme potency \u2014 high naloxone doses, may need intubation","Heroin: classic presentation, responds well to standard doses"] },
      { label:"Monitoring / Disposition", color:T.gold, items:["Observe \u22654\u20136h after last naloxone dose for resedation","Naloxone infusion: 2/3 of reversal dose per hour in D5W for long-acting opioids","Methadone ingestion: 12\u201324h monitoring minimum","Harm reduction: prescribe naloxone at discharge, connect to treatment"] },
    ],
    pearl:"Titrate naloxone to respiratory rate of 12, not to GCS 15. In opioid-tolerant patients, precipitated withdrawal means a combative, vomiting, acutely distressed patient with fully intact pain sensitivity.",
  },
  {
    id:"serotonin", name:"Serotonin Syndrome", icon:"\uD83C\uDF21\uFE0F", color:T.red,
    alert:"Hunter Criteria: clonus is key \u2014 check for inducible and spontaneous clonus",
    sections:[
      { label:"Hunter Criteria (ANY of):", color:T.red, items:["Spontaneous clonus","Inducible clonus + agitation or diaphoresis","Ocular clonus + agitation or diaphoresis","Tremor + hyperreflexia","Hypertonia + temperature >38\u00b0C + ocular or inducible clonus"] },
      { label:"Treatment", color:T.orange, items:["Discontinue all serotonergic agents immediately","Cyproheptadine 12 mg PO/NG load \u2192 2 mg q2h prn (max 32 mg/day) \u2014 5-HT2A antagonist","Benzodiazepines liberally for agitation, seizures, and muscle rigidity","Aggressive cooling for hyperthermia >41.1\u00b0C \u2014 paralysis + intubation if needed","Avoid physical restraints \u2014 worsen hyperthermia and acidosis"] },
      { label:"Common Causative Combinations", color:T.purple, items:["SSRI/SNRI + tramadol (very common \u2014 tramadol has serotonergic properties)","SSRI + linezolid (antibiotic with MAO inhibition)","SSRI + triptans, methylene blue, or fentanyl","MAOI + any serotonergic agent \u2014 most severe cases"] },
    ],
    pearl:"Distinguish from NMS: SS has hyperreflexia + clonus + rapid onset (hours); NMS has lead-pipe rigidity + bradyreflexia + gradual onset (days) after antipsychotic exposure.",
  },
  {
    id:"nms", name:"Neuroleptic Malignant Syndrome", icon:"\uD83E\uDDE0", color:T.blue,
    alert:"NMS can be fatal \u2014 aggressive supportive care, ICU admission, immediate antipsychotic discontinuation",
    sections:[
      { label:"Diagnosis (all 4 features)", color:T.blue, items:["Hyperthermia (temperature >38\u00b0C on two occasions)","Rigidity ('lead-pipe' \u2014 different from SS clonus)","Altered mental status","Autonomic instability (labile BP, diaphoresis, tachycardia)"] },
      { label:"Treatment", color:T.orange, items:["Discontinue ALL antipsychotics and dopamine-blocking agents immediately","Aggressive cooling \u2014 evaporative cooling, ice packs, cooling blankets","Dantrolene 1\u20132.5 mg/kg IV q6h for severe rigidity or hyperthermia","Bromocriptine 2.5 mg PO/NG TID (dopamine agonist) for mild cases","Benzodiazepines for agitation; avoid physical restraints"] },
      { label:"Monitoring / Complications", color:T.red, items:["CK levels q6\u20138h \u2014 rhabdomyolysis risk, aggressive IVF","BMP \u2014 AKI from myoglobinuria, hyperkalemia","Prolonged ICU course \u2014 days to weeks for resolution","Mortality without treatment: 10\u201320%"] },
    ],
    pearl:"NMS onset is days after starting or increasing antipsychotic dose. SS onset is hours after drug combination. NMS = rigidity + bradyreflexia; SS = clonus + hyperreflexia. Both are medical emergencies with different treatments.",
  },
  {
    id:"cholinergic", name:"Organophosphate / Cholinergic", icon:"\u2620\uFE0F", color:T.green,
    alert:"SLUDGE + DUMBELS = cholinergic toxidrome \u2014 atropine first, no ceiling dose",
    sections:[
      { label:"Toxidrome Recognition (SLUDGE)", color:T.green, items:["Salivation, Lacrimation, Urination, Defecation, GI cramps, Emesis","Bradycardia, bronchorrhea, bronchospasm \u2014 the life-threatening triad","Miosis (pinpoint pupils) \u2014 highly characteristic","Muscle weakness, fasciculations, paralysis \u2014 nicotinic effects"] },
      { label:"Treatment", color:T.orange, items:["Remove contaminated clothing, decontaminate skin (PPE for staff)","Atropine 2\u20134 mg IV q5\u201310 min \u2014 titrate to drying of secretions (not heart rate)","Pralidoxime (2-PAM) 1\u20132g IV over 30 min with atropine \u2014 for organophosphates","Benzodiazepines for seizures","Succinylcholine: CONTRAINDICATED (pseudocholinesterase inhibition = prolonged paralysis)"] },
      { label:"Sources", color:T.blue, items:["Pesticides (malathion, parathion, chlorpyrifos) \u2014 most common worldwide","Nerve agents (sarin, VX, novichok) \u2014 mass casualty event","Carbamates (aldicarb, carbaryl) \u2014 similar but no pralidoxime needed","Some mushrooms (Clitocybe, Inocybe species) \u2014 muscarinic syndrome"] },
    ],
    pearl:"Military auto-injectors: atropine 2 mg + pralidoxime 600 mg IM (DuoDote). Atropine titration endpoint is always DRY secretions \u2014 not heart rate.",
  },
  {
    id:"anticholinergic", name:"Anticholinergic Toxidrome", icon:"\uD83E\uDEB6", color:T.gold,
    alert:"Hot, dry, blind, mad, red, full \u2014 classic presentation. Physostigmine ONLY if pure anticholinergic.",
    sections:[
      { label:"Toxidrome Recognition", color:T.gold, items:["Hot as a hare (hyperthermia)","Dry as a bone (dry skin, dry mucous membranes)","Blind as a bat (mydriasis, blurred vision)","Mad as a hatter (delirium, hallucinations, agitation)","Red as a beet (flushing)","Full as a flask (urinary retention, decreased bowel sounds)"] },
      { label:"Common Sources", color:T.orange, items:["Diphenhydramine (Benadryl) \u2014 most common in OD","Tricyclic antidepressants \u2014 MIXED picture, physostigmine CONTRAINDICATED","Atropine, scopolamine, ipratropium","Jimsonweed (Datura stramonium), deadly nightshade"] },
      { label:"Treatment", color:T.teal, items:["Supportive: IVF, cooling, BZD for agitation \u2014 first line","Physostigmine 1\u20132 mg IV over 5 min for PURE anticholinergic (no TCA)","Foley catheter for urinary retention","Cool environment, ice packs for hyperthermia","Avoid restraints \u2014 worsen hyperthermia"] },
    ],
    pearl:"Never give physostigmine without ruling out TCA co-ingestion \u2014 check QRS width and R in aVR. Benzodiazepines are safe for all anticholinergic agitation.",
  },
  {
    id:"salicylate", name:"Salicylate Toxicity", icon:"\uD83C\uDF21\uFE0F", color:T.coral,
    alert:"Mixed respiratory alkalosis + anion gap metabolic acidosis = salicylate until proven otherwise",
    sections:[
      { label:"Immediate Steps", color:T.coral, items:["Salicylate level (toxic >30 mg/dL; severe >80\u2013100 mg/dL)","ABG \u2014 classic: respiratory alkalosis + metabolic acidosis","BMP: glucose (hypoglycemia), K+ (hypokalemia worsens toxicity)","Serial levels q2h \u2014 levels may continue to rise with enteric-coated aspirin"] },
      { label:"Antidote / Treatment", color:T.orange, items:["Sodium bicarbonate infusion: target urine pH 7.5\u20138.0 (alkaline urine traps ionized salicylate)","Maintain serum pH 7.45\u20137.55 \u2014 do NOT intubate unless absolutely necessary","Aggressive fluid + potassium replacement \u2014 hypokalemia prevents urine alkalinization","Dextrose even if euglycemic \u2014 CNS glucose depletion despite normal serum glucose"] },
      { label:"Hemodialysis Indications", color:T.red, items:["Level >100 mg/dL (acute) or >60 mg/dL (chronic)","Renal failure preventing elimination","Severe CNS symptoms: seizures, coma, altered mental status","Pulmonary edema or hemodynamic instability"] },
    ],
    pearl:"NEVER intubate a spontaneously breathing salicylate patient without immediately achieving hyperventilation on the ventilator (pH 7.45+). Loss of spontaneous respiratory alkalosis in a ventilated patient is rapidly fatal in severe salicylate toxicity.",
  },
  {
    id:"methanol_eg", name:"Methanol / Ethylene Glycol", icon:"\uD83E\uDDEA", color:T.cyan,
    alert:"High anion gap + high osmol gap + visual symptoms = methanol until proven otherwise",
    sections:[
      { label:"Distinguishing Features", color:T.cyan, items:["Methanol: visual disturbance (blurry vision, scotoma, blindness), fundus: disc hyperemia","Ethylene glycol: flank pain, calcium oxalate crystals in urine, renal failure","Both: elevated anion gap metabolic acidosis, elevated osmol gap early","Osmol gap = measured \u2212 calculated osmolality; >10 suggests toxic alcohol"] },
      { label:"Treatment", color:T.orange, items:["Fomepizole (4-MP) 15 mg/kg IV loading dose \u2014 first-line, give empirically","Ethanol infusion if fomepizole unavailable: target level 100\u2013150 mg/dL","Hemodialysis for: level >50 mg/dL, severe acidosis (pH <7.2), visual symptoms","Folate 50 mg IV q4h (methanol) \u2014 cofactor for formate metabolism","Thiamine 100 mg IV + pyridoxine for ethylene glycol"] },
      { label:"Do Not Miss", color:T.red, items:["Osmol gap is NORMAL late in toxicity \u2014 metabolites already formed","Do not reassure if osmol gap is closing \u2014 anion gap rising = metabolic conversion","Methanol: optic nerve damage is irreversible \u2014 early fomepizole is vision-preserving","Both: ethanol ingestion raises osmol gap independently \u2014 confounds calculation"] },
    ],
    pearl:"The osmol gap is high EARLY (parent compound) and the anion gap is high LATE (toxic metabolites). Normal osmol gap + high anion gap acidosis may be late-presenting methanol or EG \u2014 do not be falsely reassured.",
  },
];

// ── TOXIDROMES TABLE ──────────────────────────────────────────────────────────
const TOXIDROMES = [
  { name:"Opioid",            color:T.purple, pupils:"Miosis (pinpoint)",      ms:"Sedation / coma",         vitals:"Bradycardia, hypotension, bradypnea",    skin:"Normal",       other:"Respiratory depression, decreased bowel sounds",  treatment:"Naloxone" },
  { name:"Sympathomimetic",   color:T.red,    pupils:"Mydriasis",              ms:"Agitation, psychosis",    vitals:"Tachycardia, hypertension, hyperthermia", skin:"Diaphoretic",  other:"Tremor, seizures, rhabdomyolysis",                 treatment:"BZD, cooling, supportive" },
  { name:"Cholinergic",       color:T.green,  pupils:"Miosis",                 ms:"Agitation then sedation", vitals:"Bradycardia, bronchorrhea, bronchospasm", skin:"Diaphoretic",  other:"SLUDGE, fasciculations, urination",                treatment:"Atropine, pralidoxime" },
  { name:"Anticholinergic",   color:T.gold,   pupils:"Mydriasis (dilated)",    ms:"Delirium, hallucinations",vitals:"Tachycardia, hyperthermia",               skin:"Dry, flushed", other:"Urinary retention, decreased bowel sounds",        treatment:"BZD, physostigmine (pure only)" },
  { name:"Sedative-Hypnotic", color:T.blue,   pupils:"Normal or miosis",       ms:"Sedation, ataxia",        vitals:"Normal or mild bradycardia",             skin:"Normal",       other:"Slurred speech, nystagmus, hypothermia",           treatment:"Supportive, flumazenil (BZD only, caution)" },
  { name:"Serotonin Syndrome",color:T.coral,  pupils:"Mydriasis",              ms:"Agitation, confusion",    vitals:"Tachycardia, hyperthermia",              skin:"Diaphoretic",  other:"Clonus, hyperreflexia, tremor, diarrhea",          treatment:"Cyproheptadine, BZD, cooling" },
];

// ── Rumack-Matthew nomogram ───────────────────────────────────────────────────
const RM_LINE = [
  [4,150],[5,120],[6,99],[7,83],[8,70],[9,60],
  [10,51],[11,44],[12,38],[13,32],[14,28],[15,24],
  [16,21],[17,18],[18,16],[19,14],[20,12],[21,10],[22,9],[23,8],[24,7],
];

function rmTreatmentThreshold(hours) {
  const h = parseFloat(hours);
  if (isNaN(h) || h < 4) return null;
  if (h > 24) return 7;
  const exact = RM_LINE.find(p => p[0] === Math.round(h));
  if (exact) return exact[1];
  const lo = RM_LINE.filter(p => p[0] <= h).pop();
  const hi = RM_LINE.find(p => p[0] > h);
  if (!lo || !hi) return null;
  const t = (h - lo[0]) / (hi[0] - lo[0]);
  return Math.round(lo[1] + t * (hi[1] - lo[1]));
}

// ── Sub-components ────────────────────────────────────────────────────────────
function Bullet({ text, color }) {
  return (
    <div style={{ display:"flex", gap:6, alignItems:"flex-start", marginBottom:3 }}>
      <span style={{ color:color||T.teal, fontSize:7, marginTop:3, flexShrink:0 }}>\u25b8</span>
      <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt3, lineHeight:1.55 }}>{text}</span>
    </div>
  );
}

function TabBtn({ id, label, activeId, setActiveId, color }) {
  const active = activeId === id;
  return (
    <button onClick={() => setActiveId(id)}
      style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:12,
        padding:"7px 14px", borderRadius:9, cursor:"pointer", transition:"all .15s",
        border:`1px solid ${active ? (color||T.teal)+"66" : "rgba(26,53,85,0.4)"}`,
        background: active ? `linear-gradient(135deg,${color||T.teal}18,${color||T.teal}06)` : "transparent",
        color: active ? (color||T.teal) : T.txt4 }}>
      {label}
    </button>
  );
}

function AntidoteCard({ a, expanded, onToggle }) {
  const urgCol = a.urgency==="immediate" ? T.red : a.urgency==="caution" ? T.gold : T.orange;
  return (
    <div style={{ marginBottom:6, borderRadius:10, overflow:"hidden",
      border:`1px solid ${expanded ? a.color+"55" : "rgba(26,53,85,0.4)"}`,
      borderLeft:`3px solid ${a.color}` }}>
      <div onClick={onToggle} style={{ display:"flex", alignItems:"center", gap:10,
        padding:"9px 12px", cursor:"pointer",
        background:`linear-gradient(135deg,${a.color}09,rgba(8,22,40,0.9))` }}>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:13, color:a.color }}>
              {a.antidote}
            </span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:urgCol,
              letterSpacing:1, textTransform:"uppercase", background:`${urgCol}12`,
              border:`1px solid ${urgCol}35`, borderRadius:4, padding:"1px 6px" }}>
              {a.urgency}
            </span>
          </div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:T.txt4, marginTop:1 }}>
            Antidote for: {a.toxin}
          </div>
        </div>
        <span style={{ fontSize:10, color:T.txt4 }}>{expanded ? "\u25b2" : "\u25bc"}</span>
      </div>
      {expanded && (
        <div style={{ padding:"10px 12px", borderTop:"1px solid rgba(26,53,85,0.3)" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
            {[
              { label:"Route",  val:a.route,  color:T.blue  },
              { label:"Dosing", val:a.dosing, color:a.color },
              { label:"Timing", val:a.timing, color:T.gold  },
            ].map(f => (
              <div key={f.label} style={{ padding:"7px 9px", borderRadius:7,
                background:`${f.color}08`, border:`1px solid ${f.color}22`,
                gridColumn: f.label==="Dosing" ? "1/-1" : "auto" }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:f.color,
                  letterSpacing:1, textTransform:"uppercase", marginBottom:4 }}>{f.label}</div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt2, lineHeight:1.6 }}>{f.val}</div>
              </div>
            ))}
          </div>
          <div style={{ padding:"7px 10px", borderRadius:7, background:`${T.purple}08`, border:`1px solid ${T.purple}22` }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.purple,
              letterSpacing:1, textTransform:"uppercase" }}>\uD83D\uDC8E Pearl: </span>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt2 }}>{a.pearls}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function ProtocolCard({ proto, expanded, onToggle }) {
  return (
    <div style={{ marginBottom:6, borderRadius:10, overflow:"hidden",
      border:`1px solid ${expanded ? proto.color+"55" : "rgba(26,53,85,0.4)"}`,
      borderTop:`3px solid ${proto.color}` }}>
      <div onClick={onToggle} style={{ display:"flex", alignItems:"center", gap:10,
        padding:"10px 12px", cursor:"pointer",
        background:`linear-gradient(135deg,${proto.color}0a,rgba(8,22,40,0.92))` }}>
        <span style={{ fontSize:18 }}>{proto.icon}</span>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:13, color:proto.color }}>
            {proto.name}
          </div>
          {!expanded && (
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:T.txt4, marginTop:1 }}>
              {proto.alert}
            </div>
          )}
        </div>
        <span style={{ fontSize:10, color:T.txt4 }}>{expanded ? "\u25b2" : "\u25bc"}</span>
      </div>
      {expanded && (
        <div style={{ padding:"0 12px 12px" }}>
          <div style={{ padding:"7px 10px", borderRadius:7, marginBottom:10,
            background:`${T.red}08`, border:`1px solid ${T.red}28` }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.red,
              letterSpacing:1, textTransform:"uppercase" }}>\u26a1 Alert: </span>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt2 }}>{proto.alert}</span>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
            {proto.sections.map((sec, i) => (
              <div key={i} style={{ padding:"8px 10px", borderRadius:8,
                background:`${sec.color}08`, border:`1px solid ${sec.color}22` }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:sec.color,
                  letterSpacing:1.3, textTransform:"uppercase", marginBottom:6,
                  paddingBottom:4, borderBottom:`1px solid ${sec.color}22` }}>
                  {sec.label}
                </div>
                {sec.items.map((item, j) => <Bullet key={j} text={item} color={sec.color} />)}
              </div>
            ))}
          </div>
          <div style={{ padding:"7px 10px", borderRadius:7, background:`${T.gold}08`, border:`1px solid ${T.gold}22` }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.gold,
              letterSpacing:1, textTransform:"uppercase" }}>\uD83D\uDC8E Pearl: </span>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt2 }}>{proto.pearl}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────
export default function ToxicologyHub({ embedded = false, onBack, demo, cc, vitals }) {
  const [mainTab,    setMainTab]    = useState("antidotes");
  const [expanded,   setExpanded]   = useState(null);
  const [search,     setSearch]     = useState("");
  const [apapHours,  setApapHours]  = useState("");
  const [apapLevel,  setApapLevel]  = useState("");

  const toggle = useCallback((id) => setExpanded(p => p === id ? null : id), []);

  const filteredAntidotes = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return ANTIDOTES;
    return ANTIDOTES.filter(a => a.antidote.toLowerCase().includes(q) || a.toxin.toLowerCase().includes(q));
  }, [search]);

  const filteredProtocols = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return PROTOCOLS;
    return PROTOCOLS.filter(p => p.name.toLowerCase().includes(q));
  }, [search]);

  const rmThreshold = useMemo(() => rmTreatmentThreshold(apapHours), [apapHours]);
  const apapResult  = useMemo(() => {
    const h = parseFloat(apapHours); const l = parseFloat(apapLevel);
    if (isNaN(h) || isNaN(l) || h < 4) return null;
    const thresh = rmTreatmentThreshold(h);
    if (!thresh) return null;
    return { threshold:thresh, treat:l >= thresh, level:l, hours:h };
  }, [apapHours, apapLevel]);

  const TABS = [
    { id:"antidotes",  label:"Antidotes",          color:T.teal   },
    { id:"protocols",  label:"Ingestion Protocols", color:T.coral  },
    { id:"nomogram",   label:"APAP Nomogram",       color:T.orange },
    { id:"toxidromes", label:"Toxidromes",          color:T.purple },
    { id:"poison",     label:"Poison Control",      color:T.blue   },
  ];

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif",
      background: embedded ? "transparent" : T.bg,
      minHeight:  embedded ? "auto" : "100vh",
      color:T.txt }}>
      <div style={{ maxWidth:1200, margin:"0 auto", padding: embedded ? "0" : "0 16px" }}>

        {/* ── Full header (non-embedded) ── */}
        {!embedded && (
          <div style={{ padding:"18px 0 14px" }}>
            {onBack && (
              <button onClick={onBack}
                style={{ marginBottom:10, display:"inline-flex", alignItems:"center", gap:7,
                  fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600,
                  background:"rgba(14,37,68,0.7)", border:"1px solid rgba(42,79,122,0.5)",
                  borderRadius:8, padding:"5px 14px", color:T.txt3, cursor:"pointer" }}>
                \u2190 Back to Hub
              </button>
            )}
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
              <div style={{ background:"rgba(5,15,30,0.9)", border:"1px solid rgba(42,79,122,0.6)",
                borderRadius:10, padding:"5px 12px", display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.purple, letterSpacing:3 }}>NOTRYA</span>
                <span style={{ color:T.txt4, fontFamily:"'JetBrains Mono',monospace", fontSize:10 }}>/</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.txt3, letterSpacing:2 }}>TOX</span>
              </div>
              <div style={{ height:1, flex:1, background:"linear-gradient(90deg,rgba(255,107,107,0.5),transparent)" }} />
            </div>
            <h1 className="shimmer-text"
              style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(22px,4vw,38px)",
                fontWeight:900, letterSpacing:-0.5, lineHeight:1.1 }}>
              Toxicology Hub
            </h1>
            <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.txt4, marginTop:4 }}>
              {ANTIDOTES.length} Antidotes \u00b7 {PROTOCOLS.length} Ingestion Protocols \u00b7
              Rumack-Matthew Nomogram \u00b7 Toxidrome Recognition \u00b7 Poison Control
            </p>
          </div>
        )}

        {/* ── Embedded header ── */}
        {embedded && (
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
            <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:15, color:T.coral }}>
              Toxicology Reference
            </span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.txt4,
              letterSpacing:1.5, textTransform:"uppercase", background:"rgba(255,107,107,0.1)",
              border:"1px solid rgba(255,107,107,0.25)", borderRadius:4, padding:"2px 7px" }}>
              {ANTIDOTES.length} antidotes
            </span>
          </div>
        )}

        {/* ── Tab bar ── */}
        <div style={{ display:"flex", gap:5, flexWrap:"wrap", padding:"6px",
          background:"rgba(8,22,40,0.7)", border:"1px solid rgba(26,53,85,0.4)",
          borderRadius:12, marginBottom:12 }}>
          {TABS.map(t => (
            <TabBtn key={t.id} id={t.id} label={t.label}
              activeId={mainTab} setActiveId={setMainTab} color={t.color} />
          ))}
        </div>

        {/* ── Search ── */}
        {(mainTab === "antidotes" || mainTab === "protocols") && (
          <div style={{ marginBottom:10 }}>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder={mainTab==="antidotes" ? "Search antidotes or toxins..." : "Search protocols..."}
              style={{ width:"100%", padding:"8px 14px", background:"rgba(14,37,68,0.8)",
                border:`1px solid ${search ? "rgba(255,107,107,0.5)" : "rgba(42,79,122,0.35)"}`,
                borderRadius:20, outline:"none",
                fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.txt }} />
          </div>
        )}

        {/* ── Antidotes tab ── */}
        {mainTab === "antidotes" && (
          <div className="tox-fade">
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.txt4,
              letterSpacing:1.5, textTransform:"uppercase", marginBottom:8 }}>
              {filteredAntidotes.length} antidotes \u2014 tap to expand dosing
            </div>
            {filteredAntidotes.map(a => (
              <AntidoteCard key={a.antidote} a={a}
                expanded={expanded === a.antidote}
                onToggle={() => toggle(a.antidote)} />
            ))}
            {filteredAntidotes.length === 0 && (
              <div style={{ padding:"24px", textAlign:"center", background:"rgba(8,22,40,0.6)",
                border:"1px solid rgba(26,53,85,0.35)", borderRadius:10,
                fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.txt4 }}>
                No antidotes matching "{search}"
              </div>
            )}
          </div>
        )}

        {/* ── Protocols tab ── */}
        {mainTab === "protocols" && (
          <div className="tox-fade">
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.txt4,
              letterSpacing:1.5, textTransform:"uppercase", marginBottom:8 }}>
              {filteredProtocols.length} ingestion protocols \u2014 tap to expand
            </div>
            {filteredProtocols.map(p => (
              <ProtocolCard key={p.id} proto={p}
                expanded={expanded === p.id}
                onToggle={() => toggle(p.id)} />
            ))}
          </div>
        )}

        {/* ── APAP Nomogram tab ── */}
        {mainTab === "nomogram" && (
          <div className="tox-fade">
            <div style={{ padding:"12px 14px", borderRadius:10, marginBottom:12,
              background:"rgba(255,159,67,0.07)", border:"1px solid rgba(255,159,67,0.3)" }}>
              <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:14,
                color:T.orange, marginBottom:4 }}>Rumack-Matthew Nomogram</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt3, lineHeight:1.6 }}>
                Determines NAC treatment threshold for acute single-ingestion APAP overdose.
                Level must be drawn \u22654h post-ingestion. Not valid for: chronic ingestion,
                extended-release formulations, unknown ingestion time, or staggered doses.
              </div>
            </div>
            <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:12 }}>
              <div style={{ flex:1, minWidth:150 }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.txt4,
                  letterSpacing:1.3, textTransform:"uppercase", marginBottom:4 }}>Hours Since Ingestion</div>
                <input type="number" value={apapHours} onChange={e => setApapHours(e.target.value)}
                  placeholder="e.g. 6" min="4" max="24"
                  style={{ width:"100%", padding:"9px 12px", background:"rgba(14,37,68,0.75)",
                    border:`1px solid ${apapHours ? T.orange+"55" : "rgba(42,79,122,0.4)"}`,
                    borderRadius:8, outline:"none",
                    fontFamily:"'JetBrains Mono',monospace", fontSize:18, fontWeight:700, color:T.orange }} />
              </div>
              <div style={{ flex:1, minWidth:150 }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.txt4,
                  letterSpacing:1.3, textTransform:"uppercase", marginBottom:4 }}>APAP Level (mcg/mL)</div>
                <input type="number" value={apapLevel} onChange={e => setApapLevel(e.target.value)}
                  placeholder="e.g. 180"
                  style={{ width:"100%", padding:"9px 12px", background:"rgba(14,37,68,0.75)",
                    border:`1px solid ${apapLevel ? T.teal+"55" : "rgba(42,79,122,0.4)"}`,
                    borderRadius:8, outline:"none",
                    fontFamily:"'JetBrains Mono',monospace", fontSize:18, fontWeight:700, color:T.teal }} />
              </div>
            </div>

            {rmThreshold && !apapResult && (
              <div style={{ padding:"10px 14px", borderRadius:9, background:"rgba(42,79,122,0.1)",
                border:"1px solid rgba(42,79,122,0.3)", marginBottom:10 }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.txt4,
                  letterSpacing:1, marginBottom:3 }}>TREATMENT THRESHOLD AT {apapHours}h</div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:24, fontWeight:700, color:T.orange }}>
                  {rmThreshold} mcg/mL
                </div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt4, marginTop:2 }}>
                  Treat if APAP level \u2265{rmThreshold} mcg/mL at {apapHours}h post-ingestion
                </div>
              </div>
            )}

            {apapResult && (
              <div style={{ padding:"14px 16px", borderRadius:10, marginBottom:12,
                background: apapResult.treat
                  ? "linear-gradient(135deg,rgba(255,107,107,0.12),rgba(8,22,40,0.95))"
                  : "linear-gradient(135deg,rgba(61,255,160,0.1),rgba(8,22,40,0.95))",
                border:`2px solid ${apapResult.treat ? T.coral+"66" : T.green+"66"}` }}>
                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
                  <div style={{ fontSize:28 }}>{apapResult.treat ? "\u26A0\uFE0F" : "\u2705"}</div>
                  <div>
                    <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:18,
                      color: apapResult.treat ? T.coral : T.green }}>
                      {apapResult.treat ? "TREAT WITH NAC" : "BELOW TREATMENT LINE"}
                    </div>
                    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.txt3, marginTop:2 }}>
                      Level {apapResult.level} mcg/mL at {apapResult.hours}h \u00b7 Threshold {apapResult.threshold} mcg/mL
                    </div>
                  </div>
                </div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.txt2, lineHeight:1.65 }}>
                  {apapResult.treat
                    ? "APAP level is at or above the Rumack-Matthew treatment line. Initiate IV NAC (3-bag protocol) immediately. Check LFTs and PT/INR. Continue NAC until APAP undetectable and LFTs trending down."
                    : "APAP level is below the treatment line. NAC is not indicated based on the nomogram. However \u2014 if ingestion time is uncertain, serial levels are still rising, or ALT is elevated, treat empirically."}
                </div>
              </div>
            )}

            <div style={{ padding:"10px 14px", borderRadius:10, background:"rgba(8,22,40,0.7)",
              border:"1px solid rgba(26,53,85,0.4)" }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.txt4,
                letterSpacing:1.5, textTransform:"uppercase", marginBottom:8 }}>
                Treatment Line Reference (key hours)
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {[[4,150],[6,99],[8,70],[10,51],[12,38],[16,21],[20,12],[24,7]].map(([h,l]) => (
                  <div key={h} style={{ padding:"5px 10px", borderRadius:6,
                    background:"rgba(255,159,67,0.08)", border:"1px solid rgba(255,159,67,0.22)",
                    textAlign:"center" }}>
                    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.txt4 }}>{h}h</div>
                    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:13, fontWeight:700, color:T.orange }}>{l}</div>
                    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7, color:T.txt4 }}>mcg/mL</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop:10, fontFamily:"'DM Sans',sans-serif", fontSize:10, color:T.txt4, lineHeight:1.55 }}>
                This is the 150 mcg/mL at 4h nomogram line (original Rumack-Matthew).
                Some centers use a 100 mcg/mL line for higher-risk patients.
                If ingestion time is unknown, treat empirically.
              </div>
            </div>
          </div>
        )}

        {/* ── Toxidromes tab ── */}
        {mainTab === "toxidromes" && (
          <div className="tox-fade">
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.txt4,
              letterSpacing:1.5, textTransform:"uppercase", marginBottom:10 }}>
              Classic Toxidrome Recognition
            </div>
            {TOXIDROMES.map(tox => (
              <div key={tox.name} style={{ marginBottom:7, padding:"10px 13px", borderRadius:9,
                background:"rgba(8,22,40,0.65)", border:"1px solid rgba(26,53,85,0.4)",
                borderLeft:`4px solid ${tox.color}` }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:7, flexWrap:"wrap" }}>
                  <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:13, color:tox.color }}>
                    {tox.name}
                  </span>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.teal,
                    background:"rgba(0,229,192,0.09)", border:"1px solid rgba(0,229,192,0.3)",
                    borderRadius:4, padding:"1px 8px" }}>
                    Tx: {tox.treatment}
                  </span>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:7 }}>
                  {[
                    { label:"Pupils",        val:tox.pupils, color:T.blue   },
                    { label:"Mental Status", val:tox.ms,     color:T.purple },
                    { label:"Vitals",        val:tox.vitals, color:T.coral  },
                    { label:"Skin",          val:tox.skin,   color:T.gold   },
                    { label:"Other",         val:tox.other,  color:T.teal   },
                  ].map(f => (
                    <div key={f.label} style={{ padding:"6px 8px", background:`${f.color}09`,
                      border:`1px solid ${f.color}22`, borderRadius:7 }}>
                      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7, color:f.color,
                        letterSpacing:1, textTransform:"uppercase", marginBottom:3 }}>{f.label}</div>
                      <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:T.txt3, lineHeight:1.4 }}>
                        {f.val}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Poison Control tab ── */}
        {mainTab === "poison" && (
          <div className="tox-fade">
            {[
              { title:"US Poison Control Center", val:"1-800-222-1222", sub:"National 24/7 hotline \u2014 free, confidential", color:T.red, icon:"\u260E\uFE0F", big:true },
              { title:"CHEMTREC (hazmat / industrial)", val:"1-800-424-9300", sub:"24/7 chemical emergency response", color:T.orange, icon:"\u2697\uFE0F" },
              { title:"Toxicology Consult (in-hospital)", val:"Through poison control or pharmacist", sub:"Most centers provide physician-to-physician consult via poison control line", color:T.purple, icon:"\uD83E\uDE7A" },
              { title:"Antidote Stocking Verification", val:"Check your pharmacy", sub:"Critical antidotes to verify: fomepizole, hydroxocobalamin, digibind, physostigmine, Intralipid 20%, pralidoxime, methylene blue", color:T.gold, icon:"\uD83D\uDC8A" },
            ].map(c => (
              <div key={c.title} style={{ padding:"13px 15px", borderRadius:10, marginBottom:8,
                background:`${c.color}0a`, border:`1px solid ${c.color}33`,
                borderLeft:`4px solid ${c.color}` }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
                  <span style={{ fontSize:20 }}>{c.icon}</span>
                  <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:13, color:c.color }}>
                    {c.title}
                  </span>
                </div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize: c.big ? 22 : 14,
                  fontWeight:700, color:c.color, marginBottom:4 }}>
                  {c.val}
                </div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt4, lineHeight:1.55 }}>
                  {c.sub}
                </div>
              </div>
            ))}
            <div style={{ padding:"10px 13px", borderRadius:9, marginTop:4,
              background:"rgba(8,22,40,0.6)", border:"1px solid rgba(26,53,85,0.35)" }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.txt4,
                letterSpacing:1.5, textTransform:"uppercase", marginBottom:7 }}>
                Critical Antidote Availability \u2014 Verify in Your Pharmacy
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                {["NAC (IV)","Fomepizole","Hydroxocobalamin","Digibind/DigiFab","Physostigmine",
                  "Intralipid 20%","Pralidoxime (2-PAM)","Methylene Blue","Atropine (large supply)",
                  "Glucagon","Deferoxamine","Protamine"].map(drug => (
                  <span key={drug} style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                    padding:"3px 9px", borderRadius:4, background:"rgba(42,79,122,0.2)",
                    border:"1px solid rgba(42,79,122,0.35)", color:T.txt4 }}>
                    {drug}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {!embedded && (
          <div style={{ textAlign:"center", padding:"24px 0 16px",
            fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.txt4, letterSpacing:1.5 }}>
            NOTRYA TOX HUB \u00b7 FOR CLINICAL DECISION SUPPORT ONLY \u00b7 VERIFY WITH POISON CONTROL AND TOXICOLOGY \u00b7 LOCAL PROTOCOLS MAY DIFFER
          </div>
        )}
      </div>
    </div>
  );
}