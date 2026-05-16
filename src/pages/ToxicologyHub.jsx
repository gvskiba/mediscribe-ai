// ToxicologyHub.jsx — Notrya
// Modal overlay detail · contraindication-first · condition-treated on all cards · weight-dose callout
// No router · no localStorage · no form/alert · straight quotes · <1600 lines

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { InvokeLLM } from "@/integrations/Core";
import NotryaHubHeader from "@/components/HubHeader/NotryaHubHeader";
import NotryaNav from "@/components/HubHeader/NotryaNav";

(() => {
  if (document.getElementById("tox-fonts")) return;
  const l = document.createElement("link"); l.id = "tox-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "tox-css";
  s.textContent = `@keyframes tox-fade{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}.tox-fade{animation:tox-fade .16s ease forwards;}@keyframes panel-in{from{opacity:0;transform:translateX(14px)}to{opacity:1;transform:none}}.panel-in{animation:panel-in .18s ease forwards;}@keyframes modal-in{from{opacity:0;transform:scale(0.95) translateY(16px)}to{opacity:1;transform:scale(1) translateY(0)}}.modal-in{animation:modal-in .22s cubic-bezier(.22,.68,0,1.15) forwards;}@keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}.shimmer-text{background:linear-gradient(90deg,#e8f0fe 0%,#fff 30%,#9b6dff 52%,#00e5c0 72%,#e8f0fe 100%);background-size:250% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 5s linear infinite;}`;
  document.head.appendChild(s);
})();

const T = { bg:"#050f1e",panel:"#081628",card:"#0b1e36",txt:"#f2f7ff",txt2:"#b8d4f0",txt3:"#82aece",txt4:"#5a82a8",teal:"#00e5c0",gold:"#f5c842",coral:"#ff6b6b",blue:"#3b9eff",orange:"#ff9f43",purple:"#9b6dff",green:"#3dffa0",red:"#ff4444",cyan:"#00d4ff" };
const EVID_COLOR = { "ACEP Policy":T.teal,"ACMT Statement":T.cyan,"Expert Consensus":T.gold,"Guideline":T.blue,"ACEP/ACMT":T.teal };
const TIER_ORDER = ["immediate","urgent","caution"];
const TIER_META  = { immediate:{ label:"Immediate",color:T.red },urgent:{ label:"Urgent",color:T.orange },caution:{ label:"Caution",color:T.gold } };

// ─── ANTIDOTES ────────────────────────────────────────────────────────────────
const ANTIDOTES = [
  { antidote:"Atropine", toxin:"Organophosphates / Carbamates / Nerve agents", color:T.orange, route:"IV / IM", urgency:"immediate", evidence:"Guideline",
    quickDose:"2-4 mg IV q5-10 min — no ceiling, titrate to dry secretions",
    cardCalc: w => w < 40 ? `Peds: ${(w*0.02).toFixed(2)}–${(w*0.05).toFixed(2)} mg IV` : "Adult: 2–4 mg IV (no ceiling)",
    dosing:"2-4 mg IV q5-10 min until secretions dry. No ceiling — titrate to bronchorrhea/bronchospasm resolution, NOT heart rate. Can require hundreds of mg in severe cases.",
    timing:"Start immediately for symptomatic cholinergic toxidrome. Do not delay for pralidoxime.",
    pearls:"Endpoint: dry secretions + clear breath sounds — NOT pupils or HR. Pralidoxime (2-PAM) 1-2 g IV simultaneously for organophosphate (not carbamate).",
    peds:"0.02-0.05 mg/kg IV q5-10 min (min 0.1 mg). No ceiling in severe toxidrome." },
  { antidote:"Sodium Bicarbonate", toxin:"Tricyclic antidepressants / Sodium channel blockers", color:T.coral, route:"IV", urgency:"immediate", evidence:"Expert Consensus",
    quickDose:"1-2 mEq/kg IV bolus — repeat to QRS <100 ms, pH 7.45-7.55",
    cardCalc: w => `${(w*1).toFixed(0)}–${(w*2).toFixed(0)} mEq IV bolus`,
    dosing:"1-2 mEq/kg IV bolus. Repeat until QRS <120 ms or pH 7.45-7.55. Infusion: 150 mEq in 1L D5W at 1.5x maintenance.",
    timing:"Give for QRS >100 ms, ventricular dysrhythmia, or hypotension from TCA.",
    pearls:"Target pH 7.45-7.55 — alkalinization is the mechanism, not just sodium loading. Also for: cocaine QRS widening, flecainide, type Ia/Ic antiarrhythmics." },
  { antidote:"Hydroxocobalamin", toxin:"Cyanide / Smoke inhalation", color:T.red, route:"IV", urgency:"immediate", evidence:"Guideline",
    quickDose:"5 g IV over 15 min — repeat 5 g if unstable, max 15 g",
    cardCalc: w => w < 40 ? `Peds: ${(w*70).toFixed(0)} mg IV / 15 min` : "Adult: 5 g IV over 15 min",
    dosing:"5 g IV over 15 min (adult). Pediatric: 70 mg/kg. Repeat 5 g if hemodynamically unstable. Max 15 g total.",
    timing:"First-line for smoke inhalation with suspected cyanide. Give empirically — do not wait for levels.",
    pearls:"Turns urine red for 5 days. Causes false SpO2 elevations — use co-oximetry. Compatible with sodium thiosulfate.",
    peds:"70 mg/kg IV over 15 min. Repeat if unstable." },
  { antidote:"Pyridoxine (Vitamin B6)", toxin:"Isoniazid (INH) / Gyromitra mushrooms", color:T.green, route:"IV", urgency:"immediate", evidence:"Expert Consensus",
    quickDose:"1 mg/mg INH ingested (unknown: 5 g IV) — give with BZD simultaneously",
    cardCalc: w => `Peds unknown dose: ${(w*70).toFixed(0)} mg IV (max 5 g)`,
    dosing:"INH: 1 mg pyridoxine per 1 mg INH ingested. Unknown dose: 5 g IV. Give simultaneously with benzodiazepines for seizures.",
    timing:"Give immediately for INH-induced status epilepticus — BZD alone will fail.",
    pearls:"INH seizures are pyridoxine-depleted status — BZD + pyridoxine required. Phenytoin is ineffective for INH seizures.",
    peds:"Same mg/mg INH approach. If unknown: 70 mg/kg IV (max 5 g)." },
  { antidote:"Naloxone", toxin:"Opioids", color:T.green, route:"IV / IM / IN / ETT", urgency:"urgent", evidence:"ACEP Policy",
    quickDose:"0.4-2 mg IV/IM/IN — titrate to respirations, NOT to full reversal",
    cardCalc: w => w < 40 ? `Peds: ${(w*0.01).toFixed(3)} mg IV/IM (max 0.4 mg)` : "Adult: 0.4–2 mg — titrate to RR",
    dosing:"0.4-2 mg IV/IM. Titrate to respirations — NOT to full reversal. IN: 4 mg (2 mg/nostril). Infusion: 2/3 of reversal dose per hour.",
    timing:"Onset IV 1-2 min, IM 5 min, IN 5-10 min. Half-life 60-90 min — shorter than most opioids.",
    pearls:"Buprenorphine: 4-8+ mg required. Fentanyl/xylazine (tranq): reverses opioid only — xylazine sedation persists. Nitazenes: escalate dose early — may need 10+ mg. Intubate if >10 mg without response.",
    peds:"0.01 mg/kg IV/IM/IN (max 0.4 mg/dose). Repeat q2-3 min prn. Infusion: 0.002-0.16 mg/kg/hr." },
  { antidote:"N-Acetylcysteine (NAC)", toxin:"Acetaminophen (APAP)", color:T.teal, route:"IV or PO", urgency:"urgent", evidence:"ACMT Statement",
    quickDose:"3-bag: 150/50/100 mg/kg  OR  2-bag (FDA 2024): 200/100 mg/kg",
    cardCalc: w => `Bag 1: ${(w*150).toFixed(0)} mg IV / 60 min`,
    dosing:"3-bag: 150 mg/kg/60 min, then 50 mg/kg/4h, then 100 mg/kg/16h. 2-bag (FDA 2024, fewer reactions): 200 mg/kg/4h, then 100 mg/kg/16h. Both >=300 mg/kg in 20-21h. PO: 140 mg/kg load, 70 mg/kg q4h x17 doses.",
    timing:"Most effective within 8-10h. Still give >24h in fulminant failure. Do not wait if >8h and level pending.",
    pearls:"STOP criteria (ALL): APAP <10 mcg/mL AND INR <2 AND ALT/AST decreased >=25-50% from peak AND clinically well. Fomepizole emerging as off-label adjunct for massive APAP OD.",
    peds:"Same weight-based dosing. Cap at 100 kg for dose calculations." },
  { antidote:"Buprenorphine (Suboxone)", toxin:"Opioid Use Disorder / Opioid Withdrawal", color:T.purple, route:"Sublingual", urgency:"urgent", evidence:"ACEP/ACMT",
    quickDose:"4-8 mg SL for moderate withdrawal (COWS >=8) — initiates MAT in the ED",
    dosing:"Moderate (COWS 8-12): 4-8 mg SL. Severe (COWS >12): 8-12 mg SL. Fentanyl users: wait 12-24h or high-dose induction 16-24 mg.",
    timing:"Give when COWS >=8. No X-waiver required as of 2023. Offer to all opioid OD patients at discharge.",
    pearls:"ACEP/ACMT endorse ED buprenorphine initiation as standard of care. Fentanyl users: high-dose induction (16-24 mg) reduces precipitated withdrawal risk. Link to same-day bridge clinic." },
  { antidote:"Pralidoxime (2-PAM)", toxin:"Organophosphates", color:T.orange, route:"IV", urgency:"urgent", evidence:"Guideline",
    quickDose:"1-2 g IV over 15-30 min — give with atropine, not instead of",
    cardCalc: w => `${(w*15).toFixed(0)}–${(w*30).toFixed(0)} mg IV over 30 min`,
    dosing:"1-2 g IV over 15-30 min. Infusion: 200-500 mg/hr. Give within 24-48h — less effective after acetylcholinesterase aging.",
    timing:"Give with atropine — not a substitute. Most effective before enzyme aging.",
    pearls:"NOT for carbamate poisoning. Ineffective once aging occurs. ICU for continuous infusion." },
  { antidote:"Digoxin-Specific Fab (Digibind)", toxin:"Digoxin / Digitalis glycosides", color:T.blue, route:"IV", urgency:"urgent", evidence:"Guideline",
    quickDose:"10-20 vials empiric acute · 1-6 vials chronic · or calculate",
    cardCalc: _ => "Use Calculate tab → Digibind for level-based dosing",
    dosing:"Known dose: vials = (mg ingested x 0.8) / 0.5. Known level: vials = (level ng/mL x weight kg) / 100. Empiric acute OD: 10-20 vials. Empiric chronic: 1-6 vials.",
    timing:"Indicated for: life-threatening dysrhythmia, K+ >5.5, hemodynamic instability, level >15 ng/mL (acute).",
    pearls:"Post-digibind levels unreliable. Potassium shifts rapidly — monitor closely. Renal failure: prolonged half-life of complex." },
  { antidote:"Calcium (Gluconate or Chloride)", toxin:"Calcium channel blockers / Beta-blockers / Hyperkalemia / Fluoride", color:T.gold, route:"IV", urgency:"urgent", evidence:"Expert Consensus",
    quickDose:"Gluconate 3 g IV over 5 min (x3) — HDI: insulin 1 unit/kg + dextrose",
    cardCalc: w => `HDI: Insulin ${(w*1).toFixed(0)} units IV + D50 1 amp`,
    dosing:"CCB OD: calcium gluconate 3g IV (CaCl 1g IV) over 5 min; repeat x3. HDI: regular insulin 1 unit/kg IV bolus + D50 1 amp, then 0.5-1 unit/kg/hr. Intralipid 1.5 mL/kg for refractory CCB.",
    timing:"Give early in CCB/BB OD — before collapse. HDI is primary for severe CCB toxicity.",
    pearls:"CaCl = 3x more elemental calcium than gluconate — use centrally. HDI is now first-line for severe CCB alongside calcium." },
  { antidote:"Fomepizole (4-MP)", toxin:"Methanol / Ethylene glycol", color:T.cyan, route:"IV", urgency:"urgent", evidence:"Guideline",
    quickDose:"15 mg/kg IV loading dose — give empirically, don't wait for levels",
    cardCalc: w => `Load: ${(w*15).toFixed(0)} mg IV / 30 min`,
    dosing:"15 mg/kg IV over 30 min, then 10 mg/kg q12h x4, then 15 mg/kg q12h. Continue until level <20 mg/dL and asymptomatic.",
    timing:"Give immediately on clinical suspicion. HD for severe acidosis, level >50 mg/dL, or end-organ damage.",
    pearls:"Blocks alcohol dehydrogenase — prevents toxic metabolite formation. Ethanol infusion if unavailable. Dialysis removes parent compound and metabolites." },
  { antidote:"Methylene Blue", toxin:"Methemoglobinemia", color:T.blue, route:"IV", urgency:"urgent", evidence:"Expert Consensus",
    quickDose:"1-2 mg/kg IV over 5 min — MetHb >30% or symptomatic",
    cardCalc: w => `${(w*1).toFixed(1)}–${(w*2).toFixed(1)} mg IV over 5 min`,
    dosing:"1-2 mg/kg IV over 5 min. Repeat 1 mg/kg in 1h if inadequate response. Max 7 mg/kg total.",
    timing:"MetHb >30% or symptomatic at any level. Response within 30-60 min.",
    pearls:"Ineffective in G6PD deficiency — exchange transfusion instead. Causes: dapsone, benzocaine, nitrites, primaquine. Co-oximetry required.",
    peds:"1-2 mg/kg IV over 5 min." },
  { antidote:"Lipid Emulsion (Intralipid 20%)", toxin:"Lipophilic drug toxicity — local anesthetics, CCB, TCA", color:T.gold, route:"IV", urgency:"urgent", evidence:"Expert Consensus",
    quickDose:"1.5 mL/kg IV bolus over 1 min — cardiac arrest or peri-arrest",
    cardCalc: w => `Bolus: ${(w*1.5).toFixed(0)} mL IV over 1 min`,
    dosing:"1.5 mL/kg IV bolus over 1 min. Repeat x2 if no response. Infusion: 0.25 mL/kg/min for 30-60 min. Max 10-12 mL/kg.",
    timing:"Cardiac arrest or peri-arrest from lipophilic drug toxicity — when all else fails.",
    pearls:"Lipid sink mechanism draws drug from tissues. Bupivacaine arrest, refractory CCB, TCA. May impair vasopressor binding — continue vasopressors." },
  { antidote:"Glucagon", toxin:"Beta-blockers / Calcium channel blockers", color:T.orange, route:"IV", urgency:"urgent", evidence:"Expert Consensus",
    quickDose:"3-10 mg IV bolus — bridge while setting up HDI",
    dosing:"3-10 mg IV bolus over 1-2 min. Infusion: effective bolus dose per hour.",
    timing:"Onset 1-3 min. Duration 15-20 min. Use while setting up HDI.",
    pearls:"Induces nausea/vomiting — have airway ready. Tachyphylaxis limits sustained use. HDI is preferred first-line." },
  { antidote:"Deferoxamine", toxin:"Iron overdose", color:T.red, route:"IV", urgency:"urgent", evidence:"Guideline",
    quickDose:"15 mg/kg/hr IV — titrate to urine color clearing (vin rose = effective)",
    cardCalc: w => `${(w*15).toFixed(0)} mg/hr IV (max ${(w*35).toFixed(0)} mg/hr)`,
    dosing:"15 mg/kg/hr IV (max 35 mg/kg/hr severe). Continue until urine clears and clinically improved.",
    timing:"Serum iron >500 mcg/dL, symptomatic poisoning, metabolic acidosis.",
    pearls:"Urine turns rose/wine when effective. Do not use orally. Discontinue after 24h — risk of ARDS with prolonged use." },
  { antidote:"Flumazenil", toxin:"Benzodiazepines", color:T.purple, route:"IV", urgency:"caution", evidence:"Expert Consensus",
    quickDose:"0.2 mg IV q1 min to max 1 mg — rarely indicated, see contraindications",
    contraindication:"CONTRAINDICATED in: chronic BZD users (precipitates seizures) · TCA co-ingestion · seizures controlled by BZD · elevated ICP · mixed overdose. Rarely indicated — manage airway instead.",
    dosing:"0.2 mg IV over 30 sec; repeat 0.2 mg q1 min to max 1 mg total.",
    timing:"Short half-life — resedation likely within 1-2h.",
    pearls:"CONTRAINDICATED: chronic BZD users (seizures), mixed TCA ingestion, seizures controlled by BZD, elevated ICP. Rarely indicated — manage airway instead." },
  { antidote:"Physostigmine", toxin:"Anticholinergic toxidrome (pure — not mixed TCA)", color:T.purple, route:"IV", urgency:"caution", evidence:"Expert Consensus",
    quickDose:"1-2 mg IV over 5 min — PURE anticholinergic ONLY, TCA = fatal",
    contraindication:"CONTRAINDICATED if TCA or sodium channel blocker co-ingestion is possible — causes fatal bradycardia and asystole. Check QRS width and R wave in aVR before giving. Consult toxicology.",
    dosing:"1-2 mg IV over 5 min. May repeat once in 20 min. Pediatric: 0.02 mg/kg (max 0.5 mg) over 5 min.",
    timing:"Pure anticholinergic only — absolutely contraindicated if TCA co-ingestion suspected.",
    pearls:"CONTRAINDICATED: TCA or sodium channel blocker ingestion (fatal bradycardia/asystole). Always consult toxicology before use." },
];

// ─── PROTOCOLS ────────────────────────────────────────────────────────────────
const PROTOCOLS = [
  { id:"apap", name:"Acetaminophen OD", icon:"💊", color:T.teal,
    alert:"Plot APAP level (>=4h post-ingestion) on Rumack-Matthew nomogram — NOT valid for extended-release",
    sections:[
      { label:"Immediate Steps", color:T.teal, items:["IV x2, cardiac monitor, pulse ox","APAP level >=4h post-ingestion to plot nomogram","LFTs, PT/INR, BMP, acetaminophen, ethanol level","Activated charcoal 1 g/kg PO/NG if <1h and protected airway","Extended-release APAP: check levels at 4h AND 8h — treat if either above line"] },
      { label:"NAC Regimen", color:T.orange, items:["3-bag IV: 150 mg/kg/60 min → 50 mg/kg/4h → 100 mg/kg/16h","2-bag IV (FDA 2024, fewer reactions): 200 mg/kg/4h → 100 mg/kg/16h","NAC if >8h and level pending — do not wait","Stop criteria (ALL): APAP <10, INR <2, ALT/AST declining >=25%, clinically well"] },
    ], pearl:"APAP <4h cannot be plotted — repeat at 4h. ER-APAP: nomogram invalid — serial levels at 4h and 8h." },
  { id:"tca", name:"Tricyclic Antidepressants", icon:"⚡", color:T.coral,
    alert:"QRS >100 ms = sodium bicarbonate NOW — do not wait for worsening",
    sections:[
      { label:"Immediate Steps", color:T.coral, items:["12-lead EKG — QRS width, terminal R in aVR >3 mm, R:S ratio >0.7 in aVR","Continuous cardiac monitoring — dysrhythmia can occur suddenly","IV x2, O2, establish airway early if AMS"] },
      { label:"Antidote / Treatment", color:T.orange, items:["QRS >100 ms or dysrhythmia: sodium bicarb 1-2 mEq/kg IV bolus now","Repeat bicarb until QRS <100 ms — titrate to pH 7.45-7.55","Seizures: benzodiazepines only — phenytoin CONTRAINDICATED","Hypotension: IVF then norepinephrine — avoid dopamine"] },
      { label:"Never Use", color:T.red, items:["Flumazenil — precipitates refractory seizures","Physostigmine — fatal bradycardia/asystole","Phenytoin for TCA-induced seizures","Amiodarone — worsens sodium channel blockade"] },
    ], pearl:"R wave in aVR >3 mm is the most specific EKG finding. Alkalinization — not just sodium — is the mechanism." },
  { id:"ccb", name:"Calcium Channel Blockers", icon:"❤️", color:T.orange,
    alert:"High-dose insulin (HDI) is first-line — start early, do not wait for refractory hemodynamics",
    sections:[
      { label:"First-Line Treatment", color:T.teal, items:["Calcium gluconate 3g IV (CaCl 1g IV) over 5 min — repeat x3 prn","HDI: regular insulin 1 unit/kg IV bolus + D50 1 amp, then 0.5-1 unit/kg/hr","Dextrose 0.5 g/kg/hr — maintain glucose 100-250 mg/dL","Vasopressors: norepinephrine or vasopressin for persistent hypotension"] },
      { label:"Salvage", color:T.red, items:["Intralipid 20%: 1.5 mL/kg bolus for arrest or peri-arrest","Glucagon 3-10 mg IV bolus as bridge — airway risk","ECMO / VA-ECMO for refractory cardiovascular collapse"] },
    ], pearl:"Diltiazem/verapamil: bradycardia + AV block. Amlodipine: vasodilation + reflex tachycardia. HDI improves myocardial metabolism — start early." },
  { id:"opioid", name:"Opioid Toxidrome", icon:"💊", color:T.purple,
    alert:"Fentanyl/xylazine (tranq dope): naloxone reverses opioid only — xylazine sedation persists. Nitazenes require very high doses.",
    sections:[
      { label:"Immediate Steps", color:T.purple, items:["Airway — BVM if apneic before naloxone","Naloxone 0.4-2 mg IV/IM/IN — titrate to RR of 12, not to GCS 15","Do not fully reverse opioid-tolerant patients — precipitates withdrawal","ACLS if cardiac arrest — naloxone + CPR simultaneously"] },
      { label:"Emerging Threats", color:T.blue, items:["Xylazine: no antidote — airway support, look for characteristic skin wounds","Nitazenes: potency exceeds fentanyl — escalate naloxone aggressively (10+ mg)","Medetomidine: increasingly replacing xylazine — ICU admission 91% in one series"] },
      { label:"ED Buprenorphine", color:T.teal, items:["Offer to all opioid OD patients — ACEP/ACMT standard of care","COWS >=8: buprenorphine 4-8 mg SL — no X-waiver required since 2023","Fentanyl users: wait 12-24h or high-dose induction 16-24 mg"] },
    ], pearl:"Titrate naloxone to RR of 12, not GCS 15. Xylazine: skin ulcers at injection AND distant sites — hallmark. Infusion: 2/3 of reversal dose per hour." },
  { id:"sympathomimetic", name:"Sympathomimetic Toxidrome", icon:"⚠", color:T.red,
    alert:"Hyperthermia is the primary killer — aggressive cooling and benzodiazepines are the core treatment",
    sections:[
      { label:"Recognition", color:T.red, items:["Mydriasis, tachycardia, hypertension, diaphoresis, hyperthermia","Agitation, psychosis, seizures — hallmarks of severe toxicity","Agents: cocaine, methamphetamine, MDMA, amphetamines, cathinones"] },
      { label:"Treatment", color:T.orange, items:["BZD first: lorazepam 2-4 mg IV or diazepam 5-10 mg IV","Active cooling for temp >39C — evaporative cooling, ice packs","Cocaine chest pain: nitroglycerin + BZD; AVOID beta-blockers (unopposed alpha)","Cocaine wide-QRS: sodium bicarbonate 1-2 mEq/kg","Rhabdomyolysis: IVF — target urine output 1-3 mL/kg/hr"] },
    ], pearl:"NEVER give beta-blockers for cocaine — unopposed alpha causes severe coronary vasospasm. BZD + cooling is the cornerstone of all sympathomimetic toxicity." },
  { id:"alcohol_withdrawal", name:"Alcohol / Sedative Withdrawal", icon:"🍺", color:T.gold,
    alert:"Delirium tremens has 5-15% mortality untreated — aggressive BZD loading is life-saving",
    sections:[
      { label:"CIWA-Ar Thresholds", color:T.gold, items:["<8: mild — oral BZD prn","8-15: moderate — lorazepam 1-2 mg IV/IM q4-6h prn",">15: severe — BZD loading, ICU","Seizure or DT: BZD IV bolus immediately, escalate rapidly"] },
      { label:"Treatment", color:T.orange, items:["Thiamine 100-500 mg IV BEFORE glucose — prevents Wernicke's","Lorazepam 2-4 mg IV q15-30 min or diazepam 5-20 mg IV q5-10 min for seizures","Phenobarbital 10-15 mg/kg IV for BZD-refractory withdrawal","IVF + electrolytes: Mg2+, K+, phosphate typically depleted"] },
    ], pearl:"Thiamine BEFORE glucose is a hard rule. Phenobarbital increasingly preferred for severe withdrawal — single agent, long duration, no tolerance ceiling." },
  { id:"serotonin", name:"Serotonin Syndrome", icon:"🌡️", color:T.red,
    alert:"Hunter Criteria: clonus is key — check for inducible and spontaneous clonus",
    sections:[
      { label:"Hunter Criteria (ANY of)", color:T.red, items:["Spontaneous clonus","Inducible clonus + agitation or diaphoresis","Ocular clonus + agitation or diaphoresis","Tremor + hyperreflexia","Hypertonia + temp >38C + ocular or inducible clonus"] },
      { label:"Treatment", color:T.orange, items:["Discontinue all serotonergic agents immediately","Cyproheptadine 12 mg PO/NG load, then 2 mg q2h prn (max 32 mg/day)","BZD liberally for agitation, seizures, rigidity","Aggressive cooling for hyperthermia >41.1C — paralysis + intubation if needed","Common combos: SSRI + tramadol, SSRI + linezolid, MAOI + anything serotonergic"] },
    ], pearl:"SS vs NMS: SS = hyperreflexia + clonus + hours. NMS = lead-pipe rigidity + bradyreflexia + days after antipsychotic. Different treatments." },
  { id:"cholinergic", name:"Organophosphate / Cholinergic", icon:"☠️", color:T.green,
    alert:"SLUDGE = cholinergic toxidrome — atropine first, no ceiling dose",
    sections:[
      { label:"Toxidrome (SLUDGE)", color:T.green, items:["Salivation, Lacrimation, Urination, Defecation, GI cramps, Emesis","Bradycardia, bronchorrhea, bronchospasm — life-threatening triad","Miosis — highly characteristic · Fasciculations, weakness, paralysis — nicotinic"] },
      { label:"Treatment", color:T.orange, items:["Remove contaminated clothing, decontaminate skin (PPE for staff)","Atropine 2-4 mg IV q5-10 min — titrate to DRY secretions (not HR)","Pralidoxime (2-PAM) 1-2g IV over 30 min with atropine — organophosphates only","BZD for seizures — Succinylcholine CONTRAINDICATED (prolonged paralysis)"] },
    ], pearl:"Atropine endpoint is always DRY secretions — not heart rate. 2-PAM NOT for carbamate poisoning." },
  { id:"co", name:"Carbon Monoxide Poisoning", icon:"💨", color:T.blue,
    alert:"ACEP 2025 Level C: selected patients may benefit from HBO2 based on severity and availability",
    sections:[
      { label:"Immediate Management", color:T.blue, items:["100% O2 via NRB mask IMMEDIATELY — do not wait for COHgb","Co-oximetry — pulse ox unreliable (reads COHgb as oxyhemoglobin)","IV access, cardiac monitor, 12-lead EKG — CO causes myocardial injury","BMP, lactate, troponin, CBC, ABG"] },
      { label:"HBO2 Thresholds", color:T.teal, items:["COHgb >25%: severe — HBO2 consultation","COHgb >15% + neurologic symptoms: HBO2 consultation","Pregnancy: COHgb >15% or any symptoms","Normobaric 100% O2 x5-6h remains standard for most patients"] },
    ], pearl:"SpO2 99% with COHgb 40% is possible — pulse ox is unreliable. DNS risk factors: age >=36, COHgb >=25%, LOC, exposure >=24h." },
  { id:"salicylate", name:"Salicylate Toxicity", icon:"🌡️", color:T.coral,
    alert:"Mixed respiratory alkalosis + anion gap metabolic acidosis = salicylate until proven otherwise",
    sections:[
      { label:"Immediate Steps", color:T.coral, items:["Salicylate level (toxic >30; severe >80-100 mg/dL)","ABG — classic: respiratory alkalosis + metabolic acidosis","BMP: glucose (hypoglycemia), K+ (hypokalemia prevents urine alkalinization)","Serial levels q2h — may rise with enteric-coated aspirin"] },
      { label:"Treatment", color:T.orange, items:["Sodium bicarb infusion: target urine pH 7.5-8.0","Maintain serum pH 7.45-7.55 — do NOT intubate unless absolutely necessary","Aggressive fluid + K+ replacement","Dextrose even if euglycemic — CNS glucose depletion","HD: level >100 mg/dL, renal failure, severe CNS symptoms, pulmonary edema"] },
    ], pearl:"NEVER intubate a spontaneously breathing salicylate patient without immediately achieving hyperventilation (pH 7.45+) on the vent. Loss of respiratory alkalosis in a ventilated patient is rapidly fatal." },
  { id:"xylazine", name:"Xylazine / Tranq Dope", icon:"🩹", color:T.red,
    alert:"Naloxone does NOT reverse xylazine — reverses fentanyl component only. Supportive care required.",
    sections:[
      { label:"Recognition", color:T.red, items:["Alpha-2 agonist veterinary sedative — now widespread in illicit opioid supply","Prolonged sedation beyond expected naloxone reversal, bradycardia, hypotension","Skin wounds: partial/full-thickness ulcers at injection AND distant sites","Medetomidine increasingly replacing xylazine — ICU admission 91% in one series"] },
      { label:"Management", color:T.orange, items:["Airway and ventilatory support — primary intervention","Naloxone for opioid component — sedation may persist after reversal","Supportive: IVF, cardiac monitor, warming","Wound staging (Philadelphia 2024): conservative approach first","Offer buprenorphine; prescribe naloxone at discharge; 1-800-484-3731"] },
    ], pearl:"No antidote for xylazine or medetomidine. Philadelphia 2024 consensus: addiction management + conservative wound care before surgical reconstruction." },
];

// ─── TOXIDROMES ───────────────────────────────────────────────────────────────
const TOXIDROMES = [
  { name:"Opioid",             color:T.purple, pupils:"Miosis (pinpoint)", ms:"Sedation / coma",       vitals:"Brady, hypotension, bradypnea",    skin:"Normal",      tx:"Naloxone" },
  { name:"Sympathomimetic",    color:T.red,    pupils:"Mydriasis",         ms:"Agitation / psychosis", vitals:"Tachy, HTN, hyperthermia",         skin:"Diaphoretic", tx:"BZD, cooling" },
  { name:"Cholinergic",        color:T.green,  pupils:"Miosis",            ms:"Agitation → sedation",  vitals:"Brady, bronchorrhea, bronchospasm",skin:"Diaphoretic", tx:"Atropine, 2-PAM" },
  { name:"Anticholinergic",    color:T.gold,   pupils:"Mydriasis",         ms:"Delirium",              vitals:"Tachy, hyperthermia",              skin:"Dry, flushed", tx:"BZD, physostigmine (pure only)" },
  { name:"Sedative-Hypnotic",  color:T.blue,   pupils:"Normal / miosis",   ms:"Sedation, ataxia",      vitals:"Normal or mild brady",            skin:"Normal",      tx:"Supportive" },
  { name:"Serotonin Syndrome", color:T.coral,  pupils:"Mydriasis",         ms:"Agitation, confusion",  vitals:"Tachy, hyperthermia",              skin:"Diaphoretic", tx:"Cyproheptadine, BZD" },
];

// ─── TOXIDROME MATCHER ────────────────────────────────────────────────────────
const SYMPTOMS = [
  { id:"miosis",        label:"Miosis (pinpoint pupils)",    group:"eyes" },
  { id:"mydriasis",     label:"Mydriasis (dilated pupils)",  group:"eyes" },
  { id:"bradycardia",   label:"Bradycardia",                 group:"vitals" },
  { id:"tachycardia",   label:"Tachycardia",                 group:"vitals" },
  { id:"hyperthermia",  label:"Hyperthermia",                group:"vitals" },
  { id:"hypotension",   label:"Hypotension",                 group:"vitals" },
  { id:"diaphoresis",   label:"Diaphoresis (sweating)",      group:"skin" },
  { id:"dry_skin",      label:"Dry / flushed skin",          group:"skin" },
  { id:"agitation",     label:"Agitation / delirium",        group:"neuro" },
  { id:"sedation",      label:"Sedation / decreased LOC",    group:"neuro" },
  { id:"clonus",        label:"Clonus / hyperreflexia",      group:"neuro" },
  { id:"rigidity",      label:"Muscle rigidity (lead-pipe)", group:"neuro" },
  { id:"bronchorrhea",  label:"Bronchorrhea / wheezing",     group:"resp" },
  { id:"fasciculations",label:"Fasciculations",              group:"neuro" },
  { id:"urinary_ret",   label:"Urinary retention",           group:"other" },
  { id:"bradypnea",     label:"Bradypnea / apnea",           group:"resp" },
];

const TSYNDROMES = [
  { name:"Opioid",           color:T.purple, hallmarks:["miosis","sedation","bradypnea"],              supportive:["bradycardia","hypotension"],          antidotes:["Naloxone"], protocols:["opioid"] },
  { name:"Cholinergic",      color:T.green,  hallmarks:["miosis","bronchorrhea","diaphoresis"],         supportive:["bradycardia","fasciculations","sedation"], antidotes:["Atropine","Pralidoxime (2-PAM)"], protocols:["cholinergic"] },
  { name:"Sympathomimetic",  color:T.red,    hallmarks:["mydriasis","tachycardia","agitation"],         supportive:["hyperthermia","diaphoresis"],          antidotes:["Sodium Bicarbonate"], protocols:["sympathomimetic"] },
  { name:"Anticholinergic",  color:T.gold,   hallmarks:["mydriasis","dry_skin","tachycardia"],          supportive:["hyperthermia","agitation","urinary_ret"], antidotes:["Physostigmine"], protocols:["sympathomimetic"] },
  { name:"Serotonin Syndrome",color:T.coral, hallmarks:["clonus","tachycardia","agitation"],            supportive:["hyperthermia","diaphoresis","mydriasis"], antidotes:["Cyproheptadine"], protocols:["serotonin"] },
  { name:"Sedative-Hypnotic",color:T.blue,   hallmarks:["sedation"],                                    supportive:["bradycardia","bradypnea"],             antidotes:["Flumazenil"], protocols:["alcohol_withdrawal"] },
  { name:"Cholinergic (NMJ)",color:T.green,  hallmarks:["fasciculations","miosis","bronchorrhea"],      supportive:["diaphoresis","sedation"],              antidotes:["Atropine","Pralidoxime (2-PAM)"], protocols:["cholinergic"] },
  { name:"NMS",              color:T.blue,   hallmarks:["rigidity","hyperthermia"],                     supportive:["agitation"],                           antidotes:["Dantrolene/Bromocriptine"], protocols:["nms"] },
];

function scoreSyndrome(syndrome, selectedSet) {
  let score = 0;
  syndrome.hallmarks.forEach(s => { if (selectedSet.has(s)) score += 3; });
  syndrome.supportive.forEach(s => { if (selectedSet.has(s)) score += 1; });
  if (syndrome.hallmarks.includes("miosis")      && selectedSet.has("mydriasis"))   score -= 3;
  if (syndrome.hallmarks.includes("mydriasis")   && selectedSet.has("miosis"))      score -= 3;
  if (syndrome.hallmarks.includes("tachycardia") && selectedSet.has("bradycardia")) score -= 2;
  if (syndrome.hallmarks.includes("bradycardia") && selectedSet.has("tachycardia")) score -= 2;
  return score;
}

// ─── DOSE CALCULATOR DATA ─────────────────────────────────────────────────────
const RM_LINE = [[4,150],[5,120],[6,99],[7,83],[8,70],[9,60],[10,51],[11,44],[12,38],[13,32],[14,28],[15,24],[16,21],[17,18],[18,16],[19,14],[20,12],[21,10],[22,9],[23,8],[24,7]];
function rmThreshold(hours) {
  const h = parseFloat(hours);
  if (isNaN(h) || h < 4) return null;
  if (h > 24) return 7;
  const exact = RM_LINE.find(p => p[0] === Math.round(h));
  if (exact) return exact[1];
  const lo = RM_LINE.filter(p => p[0] <= h).pop();
  const hi = RM_LINE.find(p => p[0] > h);
  if (!lo || !hi) return null;
  return Math.round(lo[1] + (h - lo[0]) / (hi[0] - lo[0]) * (hi[1] - lo[1]));
}

const DOSE_CALCS = [
  { id:"nac", label:"NAC", color:T.teal,
    rows: w => [{ label:"3-Bag 1 — 150 mg/kg / 60 min",val:(w*150).toFixed(0)+" mg",sub:"in 200 mL D5W" },{ label:"3-Bag 2 — 50 mg/kg / 4h",val:(w*50).toFixed(0)+" mg",sub:"in 500 mL D5W" },{ label:"3-Bag 3 — 100 mg/kg / 16h",val:(w*100).toFixed(0)+" mg",sub:"in 1000 mL D5W" },{ label:"2-Bag 1 — 200 mg/kg / 4h",val:(w*200).toFixed(0)+" mg",sub:"in 500 mL D5W" },{ label:"2-Bag 2 — 100 mg/kg / 16h",val:(w*100).toFixed(0)+" mg",sub:"in 1000 mL D5W" }]},
  { id:"naloxone", label:"Naloxone", color:T.green,
    rows: w => [{ label:"Reversal dose",val:"0.4 – 2 mg IV/IM/IN",sub:"titrate to respirations, not full reversal" },{ label:"Infusion (0.004 mg/kg/hr)",val:(w*0.004).toFixed(3)+" mg/hr",sub:"2/3 of effective reversal dose per hour" }]},
  { id:"fomepizole", label:"Fomepizole", color:T.cyan,
    rows: w => [{ label:"Loading — 15 mg/kg / 30 min",val:(w*15).toFixed(0)+" mg",sub:"in 100 mL NS or D5W" },{ label:"Maintenance 1-4 — 10 mg/kg q12h",val:(w*10).toFixed(0)+" mg q12h",sub:"in 100 mL NS or D5W" },{ label:"Maintenance 5+ — 15 mg/kg q12h",val:(w*15).toFixed(0)+" mg q12h",sub:"if dialysis: q4h during HD" }]},
  { id:"atropine", label:"Atropine", color:T.orange,
    rows: w => [{ label:"Adult initial (fixed)",val:"2 – 4 mg IV",sub:"no ceiling — titrate to dry secretions" },{ label:"Peds (0.02-0.05 mg/kg)",val:(w*0.02).toFixed(2)+" – "+(w*0.05).toFixed(2)+" mg",sub:"min 0.1 mg" },{ label:"May require total",val:"> 20 mg (sometimes 100s)",sub:"endpoint = dry secretions + clear lungs" }]},
  { id:"methblue", label:"Methylene Blue", color:T.blue,
    rows: w => [{ label:"Dose 1 — 1-2 mg/kg / 5 min",val:(w*1).toFixed(1)+" – "+(w*2).toFixed(1)+" mg",sub:"in 50 mL NS or D5W" },{ label:"Repeat at 1h — 1 mg/kg",val:(w*1).toFixed(1)+" mg",sub:"if response inadequate" },{ label:"Max total — 7 mg/kg",val:(w*7).toFixed(1)+" mg",sub:"higher doses may worsen MetHb" }]},
  { id:"digibind", label:"Digibind", color:T.blue, custom:true,
    rows: (w, level) => {
      const c = level && w ? Math.ceil((parseFloat(level)*parseFloat(w))/100) : null;
      return [{ label:"Empiric — acute OD",val:"10 – 20 vials IV",sub:"life-threatening dysrhythmia or hemodynamic instability" },{ label:"Empiric — chronic",val:"1 – 6 vials IV",sub:"lower doses for chronic or renal failure" },{ label:c ? "Calculated" : "Enter level above",val:c ? c+" vials" : "—",sub:c ? "Level "+level+" ng/mL x "+w+" kg / 100" : "serum level (ng/mL) and weight required" }];
    }},
  { id:"hydroxocob", label:"Hydroxocobalamin", color:T.red,
    rows: w => [{ label:"Adult dose (fixed)",val:"5 g IV over 15 min",sub:"repeat 5 g if unstable, max 15 g" },{ label:"Peds — 70 mg/kg",val:(w*70).toFixed(0)+" mg",sub:"over 15 min; repeat if unstable" }]},
];

const QUICK_ACCESS = ["Naloxone","N-Acetylcysteine (NAC)","Atropine","Sodium Bicarbonate","Hydroxocobalamin","Calcium (Gluconate or Chloride)","Fomepizole (4-MP)","Digoxin-Specific Fab (Digibind)"];

const SUBSTITUTES = {
  "Fomepizole (4-MP)":               "Ethanol infusion 10% in D5W — load 0.6 g/kg IV, titrate to serum level 100–150 mg/dL",
  "Hydroxocobalamin":                 "Sodium thiosulfate 12.5 g IV (second-line only) — call Poison Control 1-800-222-1222",
  "Methylene Blue":                   "Exchange transfusion for G6PD deficiency or refractory MetHb — call hematology",
  "Digoxin-Specific Fab (Digibind)": "No adequate substitute — call Poison Control 1-800-222-1222 immediately",
  "Lipid Emulsion (Intralipid 20%)": "No substitute — contact pharmacy STAT, consider ECMO if available",
  "Pralidoxime (2-PAM)":             "Atropine only — escalate dose aggressively, no reactivator available; call Poison Control",
  "Deferoxamine":                    "Supportive care only — whole bowel irrigation if early; call Poison Control",
  "Pyridoxine (Vitamin B6)":         "No substitute — give max available dose + aggressive BZD; call Poison Control",
};
  { id:"hr",    label:"Resting Pulse Rate",    opts:[{v:0,l:"≤ 80 bpm"},{v:1,l:"81–100"},{v:2,l:"101–120"},{v:4,l:"> 120 bpm"}] },
  { id:"sweat", label:"Sweating",              opts:[{v:0,l:"None"},{v:1,l:"Moist brow"},{v:2,l:"Beads on brow"},{v:3,l:"Streaming"},{v:4,l:"Drenched"}] },
  { id:"rest",  label:"Restlessness",          opts:[{v:0,l:"Can sit still"},{v:1,l:"Difficulty sitting"},{v:3,l:"Frequent shifts"},{v:5,l:"Cannot sit still"}] },
  { id:"pupil", label:"Pupil Size",            opts:[{v:0,l:"Pinned < 2 mm"},{v:1,l:"Normal / slightly large"},{v:2,l:"Large > 3 mm"},{v:5,l:"Very dilated > 5 mm"}] },
  { id:"bone",  label:"Bone / Joint Aches",   opts:[{v:0,l:"None"},{v:1,l:"Mild diffuse"},{v:2,l:"Severe cramps"},{v:4,l:"Severe + rubbing"}] },
  { id:"nose",  label:"Runny Nose / Tearing", opts:[{v:0,l:"None"},{v:1,l:"Stuffiness"},{v:2,l:"Runny nose"},{v:4,l:"Constant flow"}] },
  { id:"gi",    label:"GI Upset",             opts:[{v:0,l:"None"},{v:1,l:"Stomach cramps"},{v:2,l:"Nausea / loose stool"},{v:3,l:"Vomiting"},{v:5,l:"Diarrhea + vomiting + cramps"}] },
  { id:"tremor",label:"Tremor",               opts:[{v:0,l:"None"},{v:1,l:"Slight on movement"},{v:2,l:"Moderate"},{v:4,l:"Severe"}] },
  { id:"yawn",  label:"Yawning",              opts:[{v:0,l:"None"},{v:1,l:"1–2× observed"},{v:2,l:"3× observed"},{v:4,l:"≥ 4× observed"}] },
  { id:"anx",   label:"Anxiety / Irritability",opts:[{v:0,l:"None"},{v:1,l:"Reports anxiety"},{v:2,l:"Obvious irritability"},{v:4,l:"Combative"}] },
  { id:"goose", label:"Gooseflesh Skin",      opts:[{v:0,l:"Smooth"},{v:3,l:"Piloerection felt"},{v:5,l:"Prominent piloerection"}] },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function SectionLabel({ label, color, count }) {
  return (
    <div style={{ display:"flex",alignItems:"center",gap:8,margin:"18px 0 9px" }}>
      <div style={{ width:3,height:14,borderRadius:2,background:color,flexShrink:0 }} />
      <span style={{ fontFamily:"'Playfair Display',serif",fontSize:12,fontWeight:700,color }}>{label}</span>
      {count != null && <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.txt4 }}>{count}</span>}
      <div style={{ flex:1,height:1,background:"rgba(26,53,85,0.5)" }} />
    </div>
  );
}
function CardGrid({ children }) {
  return <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))",gap:8 }}>{children}</div>;
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────
function StatCard({ item, isProtocol, onClick, globalWeight, notStocked }) {
  const color  = item.color;
  const urgCol = item.urgency ? { immediate:T.red,urgent:T.orange,caution:T.gold }[item.urgency] : color;
  const w      = parseFloat(globalWeight) || 0;
  const wDose  = !isProtocol && w > 0 && item.cardCalc ? item.cardCalc(w) : null;
  const isNS   = !isProtocol && notStocked?.has(item.antidote);
  return (
    <div onClick={onClick} style={{ borderRadius:10,cursor:"pointer",border:"1px solid rgba(26,53,85,0.5)",borderLeft:`3px solid ${color}`,background:`linear-gradient(135deg,${color}09,rgba(8,22,40,0.85))`,padding:"11px 13px",transition:"border-color .15s,box-shadow .15s",opacity:isNS?0.55:1 }}
      onMouseEnter={e => { e.currentTarget.style.borderColor=color+"55"; e.currentTarget.style.boxShadow=`0 0 18px ${color}1a`; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor="rgba(26,53,85,0.5)"; e.currentTarget.style.boxShadow="none"; }}>
      <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:6,marginBottom:3 }}>
        <span style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:13,color,lineHeight:1.2 }}>
          {isProtocol ? (item.icon+" "+item.name) : item.antidote}
        </span>
        <span style={{ color:T.txt4,fontSize:14,flexShrink:0,marginTop:1 }}>›</span>
      </div>
      {/* Condition treated — always visible for antidotes */}
      {!isProtocol && item.toxin && (
        <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.txt3,fontWeight:500,marginBottom:5,lineHeight:1.35 }}>{item.toxin}</div>
      )}
      {!isProtocol && item.urgency && (
        <div style={{ display:"flex",gap:4,flexWrap:"wrap",marginBottom:5 }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:7,color:urgCol,background:`${urgCol}15`,border:`1px solid ${urgCol}35`,borderRadius:4,padding:"1px 5px",textTransform:"uppercase",letterSpacing:0.8 }}>{item.urgency}</span>
          {item.evidence && <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:7,color:EVID_COLOR[item.evidence]||T.txt4,background:`${EVID_COLOR[item.evidence]||T.txt4}15`,border:`1px solid ${EVID_COLOR[item.evidence]||T.txt4}35`,borderRadius:4,padding:"1px 5px",textTransform:"uppercase",letterSpacing:0.8 }}>{item.evidence}</span>}
          {item.contraindication && <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:7,color:T.red,background:"rgba(255,68,68,0.15)",border:"1px solid rgba(255,68,68,0.4)",borderRadius:4,padding:"1px 5px",textTransform:"uppercase",letterSpacing:0.8 }}>⚠ contraindications</span>}
          {isNS && <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:7,color:T.txt4,background:"rgba(90,130,168,0.15)",border:"1px solid rgba(90,130,168,0.3)",borderRadius:4,padding:"1px 5px",textTransform:"uppercase",letterSpacing:0.8 }}>⊗ not stocked</span>}
        </div>
      )}
      <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:600,color,lineHeight:1.4,marginBottom:wDose?4:0 }}>
        {isProtocol ? item.alert : item.quickDose}
      </div>
      {wDose && (
        <div style={{ marginTop:5,padding:"5px 8px",borderRadius:6,background:`${color}18`,border:`1px solid ${color}35`,fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:700,color }}>
          {w} kg → {wDose}
        </div>
      )}
    </div>
  );
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function generateOrderText(item, w) {
  const wdose = w > 0 && item.cardCalc ? item.cardCalc(w) : null;
  const parts = [item.antidote];
  if (item.toxin)          parts.push("Indication: " + item.toxin);
  if (wdose)               parts.push("Dose (" + w + "kg): " + wdose);
  else if (item.quickDose) parts.push("Dose: " + item.quickDose);
  if (item.route)          parts.push("Route: " + item.route);
  if (item.timing)         parts.push("Timing: " + item.timing.split(".")[0].trim());
  return parts.join(" | ");
}

function printCard(item, w) {
  const win = window.open("", "_blank");
  if (!win) return;
  const wdose = w > 0 && item.cardCalc ? item.cardCalc(w) : null;
  const row = (lbl, content) => `<div class="sec"><div class="lbl">${lbl}</div>${content}</div>`;
  win.document.write(`<!DOCTYPE html><html><head><title>${item.antidote} — Notrya Tox</title>
<style>
  body { font-family: 'Courier New', monospace; padding: 28px; background: #fff; color: #000; max-width: 620px; margin: 0 auto; }
  h1 { font-size: 22px; margin: 0 0 3px; font-family: Georgia, serif; }
  .toxin { font-size: 13px; color: #444; margin: 0 0 10px; }
  .badges { margin: 0 0 14px; }
  .badge { display: inline-block; font-size: 9px; padding: 2px 8px; border: 1px solid #bbb; border-radius: 3px; margin-right: 5px; text-transform: uppercase; letter-spacing: .8px; }
  .contra { background: #fff0f0; border: 2px solid #c00; padding: 12px 14px; margin-bottom: 16px; border-radius: 4px; }
  .contra-lbl { font-size: 9px; text-transform: uppercase; letter-spacing: 1.5px; color: #c00; margin-bottom: 4px; font-weight: bold; }
  .sec { margin-bottom: 12px; padding: 10px 13px; border-left: 3px solid #333; background: #f7f7f7; }
  .lbl { font-size: 9px; text-transform: uppercase; letter-spacing: 1.3px; color: #666; margin-bottom: 4px; }
  .big { font-size: 26px; font-weight: bold; margin: 0 0 2px; font-family: 'Courier New', monospace; }
  .dose { font-size: 15px; font-weight: bold; line-height: 1.5; }
  p { font-size: 12px; line-height: 1.65; margin: 0; }
  .foot { margin-top: 22px; font-size: 9px; color: #aaa; border-top: 1px solid #ddd; padding-top: 8px; }
  @media print { body { padding: 16px; } }
</style></head><body>`);
  if (item.contraindication) {
    win.document.write(`<div class="contra"><div class="contra-lbl">⚠ Critical Contraindications — Read Before Dosing</div><p>${item.contraindication}</p></div>`);
  }
  win.document.write(`<h1>${item.antidote}</h1><div class="toxin">Treats: ${item.toxin || ""}</div>`);
  win.document.write(`<div class="badges"><span class="badge">${item.urgency || ""}</span><span class="badge">${item.route || ""}</span><span class="badge">${item.evidence || ""}</span></div>`);
  if (wdose) win.document.write(row("Calculated Dose — " + w + " kg Patient", `<div class="big">${wdose}</div>`));
  win.document.write(row("Quick Dose", `<div class="dose">${item.quickDose || ""}</div>`));
  win.document.write(row("Full Dosing", `<p>${item.dosing || ""}</p>`));
  if (item.timing) win.document.write(row("Timing", `<p>${item.timing}</p>`));
  win.document.write(row("Pearl", `<p>${item.pearls || ""}</p>`));
  if (item.peds) win.document.write(row("Peds", `<p>${item.peds}</p>`));
  win.document.write(`<div class="foot">NOTRYA TOX HUB · CLINICAL DECISION SUPPORT ONLY · Verify with Poison Control 1-800-222-1222 · ${new Date().toLocaleDateString()}</div>`);
  win.document.write(`</body></html>`);
  win.document.close();
  setTimeout(() => win.print(), 450);
}

// ─── DETAIL MODAL ─────────────────────────────────────────────────────────────
function DetailModal({ item, isProtocol, onClose, globalWeight, list, listIdx, onNavigate, notStocked, toggleNotStocked }) {
  const color  = item.color;
  const urgCol = item.urgency ? { immediate:T.red,urgent:T.orange,caution:T.gold }[item.urgency] : color;
  const w      = parseFloat(globalWeight) || 0;
  const wDose  = !isProtocol && w > 0 && item.cardCalc ? item.cardCalc(w) : null;
  const [copied, setCopied] = useState(false);
  const isNS = !isProtocol && notStocked?.has(item.antidote);

  const canPrev = list && listIdx > 0;
  const canNext = list && listIdx < list.length - 1;
  const goPrev  = () => { if (canPrev) onNavigate(list[listIdx - 1], isProtocol, list, listIdx - 1); };
  const goNext  = () => { if (canNext) onNavigate(list[listIdx + 1], isProtocol, list, listIdx + 1); };

  const copyOrder = () => {
    if (isProtocol) return;
    navigator.clipboard.writeText(generateOrderText(item, w)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  };

  useEffect(() => {
    const fn = e => {
      if (e.key === "Escape")     onClose();
      if (e.key === "ArrowLeft")  goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose, canPrev, canNext, listIdx]);

  return (
    <div onClick={onClose} style={{ position:"fixed",inset:0,zIndex:9000,background:"rgba(5,15,30,0.88)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",padding:16 }}>
      <div onClick={e => e.stopPropagation()} className="modal-in" style={{ width:"100%",maxWidth:680,maxHeight:"90vh",borderRadius:16,overflow:"hidden",display:"flex",flexDirection:"column",border:`1px solid ${color}55`,background:"rgba(8,22,40,0.98)",boxShadow:`0 0 60px ${color}22,0 24px 80px rgba(0,0,0,0.8)` }}>

        {/* Contraindication banner — ALWAYS first, impossible to scroll past */}
        {item.contraindication && (
          <div style={{ padding:"12px 20px",background:"rgba(255,44,44,0.22)",borderBottom:"2px solid rgba(255,44,44,0.78)",flexShrink:0 }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.red,letterSpacing:1.5,textTransform:"uppercase",marginBottom:4 }}>⚠ Critical Contraindications — Read Before Dosing</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#ffaaaa",lineHeight:1.65,fontWeight:600 }}>{item.contraindication}</div>
          </div>
        )}

        {/* Not stocked banner */}
        {isNS && (
          <div style={{ padding:"10px 20px",background:"rgba(90,130,168,0.14)",borderBottom:"1px solid rgba(90,130,168,0.4)",flexShrink:0 }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.txt3,letterSpacing:1.3,textTransform:"uppercase",marginBottom:3 }}>⊗ Not in Formulary</div>
            {SUBSTITUTES[item.antidote]
              ? <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.txt2,lineHeight:1.55 }}><span style={{ color:T.gold,fontWeight:600 }}>Alternative: </span>{SUBSTITUTES[item.antidote]}</div>
              : <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.txt4 }}>Contact pharmacy or call Poison Control 1-800-222-1222 for alternatives</div>
            }
          </div>
        )}

        {/* Header */}
        <div style={{ padding:"16px 20px",background:`linear-gradient(135deg,${color}1e,${color}07)`,borderBottom:`1px solid ${color}33`,flexShrink:0 }}>
          <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12 }}>
            <div style={{ flex:1,minWidth:0 }}>
              <div style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:20,color,lineHeight:1.2,marginBottom:6 }}>
                {isProtocol ? (item.icon+" "+item.name) : item.antidote}
              </div>
              {/* Condition treated — prominent subtitle */}
              {!isProtocol && item.toxin && (
                <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,color:T.txt2,fontWeight:600,marginBottom:8,lineHeight:1.4 }}>
                  <span style={{ color:T.txt4,fontWeight:400 }}>Treats: </span>{item.toxin}
                </div>
              )}
              {!isProtocol && (
                <div style={{ display:"flex",gap:5,flexWrap:"wrap" }}>
                  {item.urgency && <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:urgCol,background:`${urgCol}20`,border:`1px solid ${urgCol}45`,borderRadius:4,padding:"2px 7px",textTransform:"uppercase",letterSpacing:1 }}>{item.urgency}</span>}
                  {item.evidence && <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:EVID_COLOR[item.evidence]||T.txt4,background:`${EVID_COLOR[item.evidence]||T.txt4}20`,border:`1px solid ${EVID_COLOR[item.evidence]||T.txt4}45`,borderRadius:4,padding:"2px 7px",textTransform:"uppercase",letterSpacing:1 }}>{item.evidence}</span>}
                  {item.route && <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.blue,background:`${T.blue}20`,border:`1px solid ${T.blue}45`,borderRadius:4,padding:"2px 7px" }}>{item.route}</span>}
                </div>
              )}
            </div>
            <div style={{ display:"flex",gap:6,flexShrink:0,alignItems:"center" }}>
              {!isProtocol && (
                <button onClick={() => toggleNotStocked(item.antidote)} style={{ padding:"7px 13px",borderRadius:8,cursor:"pointer",border:`1px solid ${isNS ? "rgba(90,130,168,0.5)" : "rgba(255,255,255,0.14)"}`,background:isNS ? "rgba(90,130,168,0.18)" : "rgba(255,255,255,0.07)",color:isNS ? T.txt3 : T.txt4,fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:isNS?600:400,whiteSpace:"nowrap" }}>
                  {isNS ? "⊗ Not Stocked" : "Mark Not Stocked"}
                </button>
              )}
              {!isProtocol && (
                <button onClick={() => printCard(item, w)} style={{ display:"flex",alignItems:"center",gap:5,padding:"7px 13px",borderRadius:8,cursor:"pointer",border:"1px solid rgba(255,255,255,0.14)",background:"rgba(255,255,255,0.07)",color:T.txt3,fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:600,whiteSpace:"nowrap" }}>
                  🖨 Print
                </button>
              )}
              {!isProtocol && (
                <button onClick={copyOrder} style={{ display:"flex",alignItems:"center",gap:5,padding:"7px 13px",borderRadius:8,cursor:"pointer",border:`1px solid ${copied ? T.green+"66" : "rgba(255,255,255,0.14)"}`,background:copied ? "rgba(61,255,160,0.1)" : "rgba(255,255,255,0.07)",color:copied ? T.green : T.txt3,fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:600,whiteSpace:"nowrap",transition:"all .2s" }}>
                  {copied ? "✓ Copied" : "Copy Order"}
                </button>
              )}
              <button onClick={onClose} style={{ display:"flex",alignItems:"center",gap:5,padding:"7px 13px",background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.14)",borderRadius:8,color:T.txt3,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:600,whiteSpace:"nowrap" }}>✕ Close</button>
            </div>
          </div>
          {/* Prev / Next navigation — shows only when list context is available */}
          {list && list.length > 1 && (
            <div style={{ display:"flex",alignItems:"center",gap:8,marginTop:10 }}>
              <button onClick={goPrev} disabled={!canPrev} style={{ padding:"4px 14px",borderRadius:6,cursor:canPrev?"pointer":"default",border:`1px solid ${canPrev?color+"44":"rgba(26,53,85,0.3)"}`,background:"rgba(8,22,40,0.5)",color:canPrev?T.txt2:T.txt4,fontFamily:"'DM Sans',sans-serif",fontSize:12,opacity:canPrev?1:0.35,transition:"all .15s" }}>← Prev</button>
              <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.txt4 }}>{listIdx + 1} / {list.length}</span>
              <button onClick={goNext} disabled={!canNext} style={{ padding:"4px 14px",borderRadius:6,cursor:canNext?"pointer":"default",border:`1px solid ${canNext?color+"44":"rgba(26,53,85,0.3)"}`,background:"rgba(8,22,40,0.5)",color:canNext?T.txt2:T.txt4,fontFamily:"'DM Sans',sans-serif",fontSize:12,opacity:canNext?1:0.35,transition:"all .15s" }}>Next →</button>
              <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:9,color:T.txt4,marginLeft:2 }}>← → keys</span>
            </div>
          )}
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY:"auto",flex:1,padding:"18px 20px" }}>

          {/* Weight-based dose — large, dominant callout when weight is set */}
          {wDose && (
            <div style={{ padding:"16px 20px",borderRadius:12,marginBottom:18,background:`${color}1e`,border:`2px solid ${color}60`,boxShadow:`0 0 28px ${color}1a` }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.txt4,letterSpacing:1.5,textTransform:"uppercase",marginBottom:5 }}>⚖ Calculated Dose — {w} kg Patient</div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:32,fontWeight:700,color,lineHeight:1.15,marginBottom:5 }}>{wDose}</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.txt4 }}>See Calculate tab for full multi-bag regimen</div>
            </div>
          )}

          {isProtocol ? (
            <>
              <div style={{ padding:"11px 14px",borderRadius:9,marginBottom:14,background:`${T.red}0e`,border:`1px solid ${T.red}30` }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.red,letterSpacing:1,textTransform:"uppercase",marginBottom:3 }}>Alert</div>
                <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.txt2,lineHeight:1.65 }}>{item.alert}</div>
              </div>
              {item.sections.map((sec, i) => (
                <div key={i} style={{ marginBottom:10,padding:"11px 14px",borderRadius:9,background:`${sec.color}0a`,border:`1px solid ${sec.color}25` }}>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:sec.color,letterSpacing:1.2,textTransform:"uppercase",marginBottom:7,paddingBottom:4,borderBottom:`1px solid ${sec.color}25` }}>{sec.label}</div>
                  {sec.items.map((it, j) => (
                    <div key={j} style={{ display:"flex",gap:7,alignItems:"flex-start",marginBottom:5 }}>
                      <span style={{ color:sec.color,fontSize:7,marginTop:4,flexShrink:0 }}>◆</span>
                      <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.txt2,lineHeight:1.65 }}>{it}</span>
                    </div>
                  ))}
                </div>
              ))}
              <div style={{ padding:"11px 14px",borderRadius:9,background:`${T.gold}0a`,border:`1px solid ${T.gold}25` }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.gold,letterSpacing:1,textTransform:"uppercase" }}>Pearl: </span>
                <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.txt2,lineHeight:1.65 }}>{item.pearl}</span>
              </div>
            </>
          ) : (
            <>
              {/* Quick dose box */}
              <div style={{ padding:"13px 16px",borderRadius:11,marginBottom:14,background:`${color}12`,border:`1px solid ${color}44` }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.txt4,letterSpacing:1.5,textTransform:"uppercase",marginBottom:5 }}>Quick Dose</div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:16,fontWeight:700,color,lineHeight:1.5 }}>{item.quickDose}</div>
              </div>
              {/* Full dosing */}
              <div style={{ marginBottom:10,padding:"11px 14px",borderRadius:9,background:`${color}08`,border:`1px solid ${color}22` }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:8,color,letterSpacing:1,textTransform:"uppercase",marginBottom:5 }}>Full Dosing</div>
                <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.txt2,lineHeight:1.7 }}>{item.dosing}</div>
              </div>
              {/* Timing */}
              {item.timing && (
                <div style={{ marginBottom:10,padding:"11px 14px",borderRadius:9,background:`${T.gold}08`,border:`1px solid ${T.gold}22` }}>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.gold,letterSpacing:1,textTransform:"uppercase",marginBottom:5 }}>Timing</div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.txt2,lineHeight:1.7 }}>{item.timing}</div>
                </div>
              )}
              {/* Pearl */}
              <div style={{ marginBottom:10,padding:"11px 14px",borderRadius:9,background:`${T.purple}08`,border:`1px solid ${T.purple}22` }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.purple,letterSpacing:1,textTransform:"uppercase",marginBottom:5 }}>Pearl</div>
                <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.txt2,lineHeight:1.7 }}>{item.pearls}</div>
              </div>
              {/* Peds */}
              {item.peds && (
                <div style={{ padding:"11px 14px",borderRadius:9,background:`${T.teal}08`,border:`1px solid ${T.teal}22` }}>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.teal,letterSpacing:1,textTransform:"uppercase",marginBottom:5 }}>Peds</div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.txt2,lineHeight:1.7 }}>{item.peds}</div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── TOXIDROME MATCHER ────────────────────────────────────────────────────────
function ToxidromeMatcher({ onSelectAntidote }) {
  const [selected, setSelected] = useState(new Set());
  const toggle = id => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const clear  = () => setSelected(new Set());

  const matches = useMemo(() => {
    if (selected.size === 0) return [];
    return TSYNDROMES
      .map(s => ({ ...s, score:scoreSyndrome(s, selected) }))
      .filter(s => s.score > 0)
      .sort((a,b) => b.score - a.score)
      .slice(0, 3);
  }, [selected]);

  const groups = [
    { label:"Eyes",    ids:["miosis","mydriasis"] },
    { label:"Vitals",  ids:["bradycardia","tachycardia","hyperthermia","hypotension"] },
    { label:"Skin",    ids:["diaphoresis","dry_skin"] },
    { label:"Neuro",   ids:["agitation","sedation","clonus","rigidity","fasciculations"] },
    { label:"Other",   ids:["bronchorrhea","urinary_ret","bradypnea"] },
  ];

  return (
    <div style={{ marginBottom:16,padding:"14px 16px",borderRadius:12,background:"rgba(155,109,255,0.06)",border:"1px solid rgba(155,109,255,0.25)" }}>
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12 }}>
        <div>
          <div style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:14,color:T.purple }}>Toxidrome Matcher</div>
          <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.txt4,marginTop:2 }}>Check what you see — the hub surfaces the most likely toxidrome</div>
        </div>
        {selected.size > 0 && <button onClick={clear} style={{ background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:7,color:T.txt4,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:11,padding:"4px 10px" }}>Clear</button>}
      </div>
      {groups.map(g => (
        <div key={g.label} style={{ marginBottom:8 }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.txt4,letterSpacing:1.5,textTransform:"uppercase",marginBottom:5 }}>{g.label}</div>
          <div style={{ display:"flex",flexWrap:"wrap",gap:5 }}>
            {g.ids.map(id => {
              const s = SYMPTOMS.find(x => x.id === id);
              const on = selected.has(id);
              return (
                <button key={id} onClick={() => toggle(id)} style={{ padding:"5px 11px",borderRadius:20,cursor:"pointer",border:`1px solid ${on ? T.purple+"99" : "rgba(26,53,85,0.5)"}`,background:on ? `linear-gradient(135deg,${T.purple}30,${T.purple}14)` : "rgba(8,22,40,0.7)",color:on ? T.purple : T.txt4,fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:on?600:400,transition:"all .12s",boxShadow:on ? `0 0 10px ${T.purple}25` : "none" }}>
                  {on && "✓ "}{s?.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      {matches.length > 0 && (
        <div style={{ marginTop:12,borderTop:"1px solid rgba(155,109,255,0.2)",paddingTop:12 }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.purple,letterSpacing:1.5,textTransform:"uppercase",marginBottom:8 }}>Likely Toxidrome{matches.length > 1 ? "s" : ""}</div>
          {matches.map((m, i) => (
            <div key={m.name} style={{ marginBottom:8,padding:"10px 12px",borderRadius:9,background:`${m.color}0d`,border:`1px solid ${m.color}${i===0?"50":"30"}`,borderLeft:`3px solid ${m.color}` }}>
              <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap" }}>
                <span style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:13,color:m.color }}>{m.name}</span>
                {i === 0 && <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:7,color:m.color,background:`${m.color}20`,border:`1px solid ${m.color}40`,borderRadius:4,padding:"1px 6px",textTransform:"uppercase" }}>best match</span>}
              </div>
              {m.antidotes.length > 0 && (
                <div style={{ display:"flex",flexWrap:"wrap",gap:5 }}>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.txt4,marginRight:2 }}>Antidotes:</span>
                  {m.antidotes.map(ant => {
                    const a = ANTIDOTES.find(x => x.antidote === ant);
                    return a ? (
                      <button key={ant} onClick={() => onSelectAntidote(a)} style={{ padding:"3px 9px",borderRadius:12,cursor:"pointer",border:`1px solid ${a.color}55`,background:`${a.color}14`,color:a.color,fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600 }}>{ant}</button>
                    ) : (
                      <span key={ant} style={{ padding:"3px 9px",borderRadius:12,border:`1px solid ${m.color}35`,background:`${m.color}10`,color:m.color,fontFamily:"'DM Sans',sans-serif",fontSize:11 }}>{ant}</span>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {selected.size > 0 && matches.length === 0 && (
        <div style={{ marginTop:10,padding:"8px 12px",borderRadius:8,background:"rgba(90,130,168,0.08)",border:"1px solid rgba(90,130,168,0.2)",fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.txt4 }}>
          No strong toxidrome match — consider mixed ingestion. Call Poison Control: 1-800-222-1222
        </div>
      )}
    </div>
  );
}

// ─── AI TOXIDROME INTERPRETER ─────────────────────────────────────────────────
function AIToxInterpreter() {
  const [text,    setText]    = useState("");
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null);
  const [err,     setErr]     = useState(false);

  const confColor = { high:T.red, moderate:T.orange, low:T.gold };
  const urgColor  = { immediate:T.red, urgent:T.orange, caution:T.gold };

  const analyze = async () => {
    if (!text.trim() || loading) return;
    setLoading(true); setErr(false); setResult(null);
    try {
      const res = await InvokeLLM({
        prompt: `You are a board-certified emergency medicine toxicologist. Analyze this ED patient presentation and identify the most likely toxidrome(s), antidotes, and immediate actions. Be concise and clinically precise.

Patient presentation: ${text}

Return valid JSON only — no preamble, no markdown.`,
        response_json_schema: {
          type: "object",
          properties: {
            toxidromes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name:       { type: "string" },
                  confidence: { type: "string", enum: ["high","moderate","low"] },
                  rationale:  { type: "string" }
                },
                required: ["name","confidence","rationale"]
              }
            },
            antidotes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name:    { type: "string" },
                  urgency: { type: "string", enum: ["immediate","urgent","caution"] },
                  note:    { type: "string" }
                },
                required: ["name","urgency","note"]
              }
            },
            immediate_actions: { type: "array", items: { type: "string" } },
            pearl:             { type: "string" }
          },
          required: ["toxidromes","antidotes","immediate_actions","pearl"]
        }
      });
      setResult(res);
    } catch { setErr(true); }
    setLoading(false);
  };

  return (
    <div style={{ marginBottom:28 }}>
      <div style={{ marginBottom:5 }}>
        <div style={{ fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,color:T.purple }}>AI Toxidrome Interpreter</div>
        <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.txt4,marginTop:2,lineHeight:1.55 }}>
          Describe the patient in plain language — vitals, exam findings, suspected exposure. AI surfaces the most likely toxidrome and recommended antidotes.
        </div>
      </div>

      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="e.g. 55M found unresponsive, pinpoint pupils, RR 6, HR 44, diaphoretic, bilateral crackles, family reports lawn chemical exposure..."
        style={{ width:"100%",minHeight:90,padding:"10px 13px",background:"rgba(255,255,255,0.05)",border:`1px solid ${text ? "rgba(155,109,255,0.4)" : "rgba(255,255,255,0.1)"}`,borderRadius:9,color:T.txt,fontFamily:"'DM Sans',sans-serif",fontSize:12,lineHeight:1.6,outline:"none",resize:"vertical",boxSizing:"border-box",marginTop:8,transition:"border-color .2s" }}
      />

      <button
        onClick={analyze}
        disabled={!text.trim() || loading}
        style={{ display:"block",width:"100%",marginTop:8,padding:"11px",borderRadius:9,cursor:text.trim()&&!loading?"pointer":"default",border:`1px solid ${T.purple}55`,background:loading ? "rgba(155,109,255,0.06)" : `linear-gradient(135deg,${T.purple}22,${T.purple}08)`,color:text.trim()&&!loading?T.purple:T.txt4,fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:600,opacity:text.trim()&&!loading?1:0.55,transition:"all .2s" }}
      >
        {loading ? "Analyzing — please wait..." : "Analyze Toxidrome"}
      </button>

      {err && (
        <div style={{ marginTop:10,padding:"9px 13px",borderRadius:8,background:"rgba(255,68,68,0.08)",border:"1px solid rgba(255,68,68,0.3)",fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.red }}>
          Analysis failed — check connection and retry
        </div>
      )}

      {result && (
        <div className="tox-fade" style={{ marginTop:14 }}>
          {/* Toxidromes */}
          {result.toxidromes?.length > 0 && (
            <div style={{ marginBottom:12,padding:"12px 14px",borderRadius:10,background:"rgba(155,109,255,0.07)",border:"1px solid rgba(155,109,255,0.3)" }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.purple,letterSpacing:1.3,textTransform:"uppercase",marginBottom:9 }}>Likely Toxidrome{result.toxidromes.length > 1 ? "s" : ""}</div>
              {result.toxidromes.map((t, i) => (
                <div key={i} style={{ marginBottom:9,padding:"9px 11px",borderRadius:8,background:`${confColor[t.confidence]||T.gold}0d`,border:`1px solid ${confColor[t.confidence]||T.gold}35`,borderLeft:`3px solid ${confColor[t.confidence]||T.gold}` }}>
                  <div style={{ display:"flex",gap:8,alignItems:"center",marginBottom:4 }}>
                    <span style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:14,color:confColor[t.confidence]||T.gold }}>{t.name}</span>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:7,color:confColor[t.confidence]||T.gold,background:`${confColor[t.confidence]||T.gold}20`,border:`1px solid ${confColor[t.confidence]||T.gold}40`,borderRadius:4,padding:"1px 6px",textTransform:"uppercase" }}>{t.confidence}</span>
                    {i === 0 && <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:7,color:T.txt4,background:"rgba(255,255,255,0.06)",borderRadius:4,padding:"1px 6px",textTransform:"uppercase" }}>best match</span>}
                  </div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.txt3,lineHeight:1.6 }}>{t.rationale}</div>
                </div>
              ))}
            </div>
          )}

          {/* Antidotes */}
          {result.antidotes?.length > 0 && (
            <div style={{ marginBottom:12,padding:"12px 14px",borderRadius:10,background:"rgba(0,229,192,0.05)",border:"1px solid rgba(0,229,192,0.25)" }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.teal,letterSpacing:1.3,textTransform:"uppercase",marginBottom:9 }}>Recommended Antidotes</div>
              {result.antidotes.map((a, i) => (
                <div key={i} style={{ marginBottom:8,padding:"8px 11px",borderRadius:8,background:`${urgColor[a.urgency]||T.blue}0a`,border:`1px solid ${urgColor[a.urgency]||T.blue}28`,borderLeft:`3px solid ${urgColor[a.urgency]||T.blue}` }}>
                  <div style={{ display:"flex",gap:7,alignItems:"center",marginBottom:3 }}>
                    <span style={{ fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:13,color:urgColor[a.urgency]||T.blue }}>{a.name}</span>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:7,color:urgColor[a.urgency]||T.blue,background:`${urgColor[a.urgency]||T.blue}20`,borderRadius:4,padding:"1px 6px",textTransform:"uppercase" }}>{a.urgency}</span>
                  </div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.txt3,lineHeight:1.55 }}>{a.note}</div>
                </div>
              ))}
            </div>
          )}

          {/* Immediate actions */}
          {result.immediate_actions?.length > 0 && (
            <div style={{ marginBottom:12,padding:"12px 14px",borderRadius:10,background:`${T.orange}08`,border:`1px solid ${T.orange}28` }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.orange,letterSpacing:1.3,textTransform:"uppercase",marginBottom:9 }}>Immediate Actions</div>
              {result.immediate_actions.map((a, i) => (
                <div key={i} style={{ display:"flex",gap:8,alignItems:"flex-start",marginBottom:6 }}>
                  <span style={{ color:T.orange,fontSize:7,marginTop:4,flexShrink:0 }}>◆</span>
                  <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.txt2,lineHeight:1.6 }}>{a}</span>
                </div>
              ))}
            </div>
          )}

          {/* Pearl */}
          {result.pearl && (
            <div style={{ padding:"11px 14px",borderRadius:9,background:`${T.gold}08`,border:`1px solid ${T.gold}28` }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.gold,letterSpacing:1,textTransform:"uppercase" }}>Pearl: </span>
              <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.txt2,lineHeight:1.65 }}>{result.pearl}</span>
            </div>
          )}

          <div style={{ marginTop:8,fontFamily:"'DM Sans',sans-serif",fontSize:9,color:T.txt4,textAlign:"right" }}>
            AI analysis · Always verify with Poison Control 1-800-222-1222
          </div>
        </div>
      )}
    </div>
  );
}

// ─── DIGOXIN TOXICITY STAGING ─────────────────────────────────────────────────
const DIG_SX = [
  { id:"dysrhythmia", label:"Life-threatening dysrhythmia (VF / VT / CHB)" },
  { id:"unstable",    label:"Hemodynamic instability" },
  { id:"bradycardia", label:"Symptomatic bradycardia" },
  { id:"nv",          label:"Nausea, vomiting, or visual changes (xanthopsia)" },
];
function DigoxinStaging() {
  const [level, setLevel] = useState("");
  const [potK,  setPotK]  = useState("");
  const [sxSet, setSxSet] = useState(new Set());
  const toggle = id => setSxSet(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const result = useMemo(() => {
    const l = parseFloat(level), k = parseFloat(potK);
    const hasCrit = sxSet.has("dysrhythmia") || sxSet.has("unstable");
    const highK   = !isNaN(k) && k > 5.5;
    const highL   = !isNaN(l) && l > 5;
    const vHighL  = !isNaN(l) && l > 15;
    if (hasCrit || vHighL || (highK && highL))
      return { tier:"Severe",      color:T.red,    vials:"10–20 vials IV empiric",     action:"Digibind NOW — life-threatening toxicity. Monitor K+ closely post-treatment." };
    if (highL || highK || sxSet.has("bradycardia"))
      return { tier:"Moderate",    color:T.orange, vials:"2–6 vials — consult toxicology", action:"Digibind likely indicated. Serial levels, continuous telemetry, Poison Control." };
    if (sxSet.has("nv") || (!isNaN(l) && l >= 2))
      return { tier:"Mild",        color:T.gold,   vials:"Monitor — may not need Digibind", action:"Hold digoxin. Serial levels q2–4h. Cardiac monitor. Treat symptoms." };
    if (level || potK || sxSet.size > 0)
      return { tier:"Subtherapeutic / Indeterminate", color:T.green, vials:"Digibind not indicated", action:"Review dose and renal function. Repeat level if clinical suspicion remains." };
    return null;
  }, [level, potK, sxSet]);

  const iS = { padding:"9px 12px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:8, color:T.txt, fontFamily:"'JetBrains Mono',monospace", fontSize:15, fontWeight:700, outline:"none", width:"100%", boxSizing:"border-box" };

  return (
    <div style={{ marginBottom:28 }}>
      <div style={{ marginBottom:10 }}>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:700, color:T.blue }}>Digoxin Toxicity Staging</div>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt4, marginTop:2 }}>Level + potassium + symptoms → Digibind vial recommendation</div>
      </div>
      <div style={{ display:"flex", gap:10, marginBottom:12, flexWrap:"wrap" }}>
        <div style={{ flex:"1 1 140px" }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.txt4, letterSpacing:1.2, textTransform:"uppercase", marginBottom:5 }}>Dig Level (ng/mL)</div>
          <input type="number" value={level} onChange={e => setLevel(e.target.value)} placeholder="e.g. 3.2" style={{ ...iS, color:T.blue }} />
        </div>
        <div style={{ flex:"1 1 140px" }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.txt4, letterSpacing:1.2, textTransform:"uppercase", marginBottom:5 }}>Potassium (mEq/L)</div>
          <input type="number" value={potK} onChange={e => setPotK(e.target.value)} placeholder="e.g. 5.8" style={{ ...iS, color:T.gold }} />
        </div>
      </div>
      <div style={{ marginBottom:12 }}>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.txt4, letterSpacing:1.2, textTransform:"uppercase", marginBottom:8 }}>Symptoms / Signs</div>
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          {DIG_SX.map(s => {
            const on = sxSet.has(s.id);
            return (
              <button key={s.id} onClick={() => toggle(s.id)} style={{ display:"flex", alignItems:"center", gap:9, padding:"8px 12px", borderRadius:8, cursor:"pointer", border:`1px solid ${on ? T.blue+"66" : "rgba(26,53,85,0.4)"}`, background:on ? `${T.blue}15` : "rgba(8,22,40,0.6)", color:on ? T.blue : T.txt4, fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:on ? 600 : 400, textAlign:"left" }}>
                <span style={{ fontSize:13, flexShrink:0 }}>{on ? "✓" : "○"}</span>{s.label}
              </button>
            );
          })}
        </div>
      </div>
      {result ? (
        <div style={{ padding:"14px 18px", borderRadius:12, background:`${result.color}10`, border:`2px solid ${result.color}50` }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:700, color:result.color, marginBottom:5 }}>{result.tier}</div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:14, fontWeight:700, color:result.color, marginBottom:8 }}>{result.vials}</div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.txt2, lineHeight:1.6 }}>{result.action}</div>
          {result.tier !== "Subtherapeutic / Indeterminate" && (
            <div style={{ marginTop:10, padding:"8px 11px", borderRadius:7, background:"rgba(8,22,40,0.5)", fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt4, lineHeight:1.55 }}>
              Post-Digibind levels unreliable · K+ shifts rapidly after treatment · Renal failure prolongs Fab complex half-life · Poison Control 1-800-222-1222
            </div>
          )}
        </div>
      ) : (
        <div style={{ padding:"20px", textAlign:"center", color:T.txt4, fontFamily:"'DM Sans',sans-serif", fontSize:12, background:"rgba(8,22,40,0.5)", border:"1px solid rgba(26,53,85,0.3)", borderRadius:10 }}>
          Enter level, potassium, or symptoms above
        </div>
      )}
    </div>
  );
}

// ─── SERIAL LEVEL TRACKER ─────────────────────────────────────────────────────
function SerialLevelTracker() {
  const [mode,    setMode]    = useState("apap");
  const [entries, setEntries] = useState([]);
  const [timeH,   setTimeH]   = useState("");
  const [levelV,  setLevelV]  = useState("");

  const scol = { treat:T.red, severe:T.red, toxic:T.orange, below:T.green, early:T.txt4, range:T.gold };
  const slbl = { treat:"TREAT NOW", severe:"SEVERE", toxic:"TOXIC", below:"Below line", early:"Too early (< 4h)", range:"Out of range" };

  const addEntry = () => {
    const h = parseFloat(timeH), l = parseFloat(levelV);
    if (isNaN(h) || isNaN(l) || l < 0) return;
    const thresh = mode === "apap" ? rmThreshold(h) : null;
    const status = mode === "apap"
      ? (h < 4 ? "early" : !thresh ? "range" : l >= thresh ? "treat" : "below")
      : (l >= 80 ? "severe" : l >= 30 ? "toxic" : "below");
    setEntries(prev => [...prev, { h, l, thresh, status }].sort((a, b) => a.h - b.h));
    setTimeH(""); setLevelV("");
  };

  const units = mode === "apap" ? "mcg/mL" : "mg/dL";
  const iBase = { padding:"9px 12px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:8, color:T.txt, fontFamily:"'JetBrains Mono',monospace", fontSize:14, fontWeight:700, outline:"none", flex:1 };

  return (
    <div style={{ marginBottom:28 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
        <div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:700, color:T.orange }}>Serial Level Tracker</div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt4, marginTop:2 }}>Plot levels against treatment thresholds over time</div>
        </div>
        {entries.length > 0 && (
          <button onClick={() => setEntries([])} style={{ padding:"5px 12px", borderRadius:7, cursor:"pointer", border:"1px solid rgba(255,255,255,0.12)", background:"rgba(255,255,255,0.06)", color:T.txt4, fontFamily:"'DM Sans',sans-serif", fontSize:11 }}>Clear all</button>
        )}
      </div>

      {/* Mode toggle */}
      <div style={{ display:"flex", gap:6, marginBottom:12 }}>
        {[["apap","APAP (Rumack-Matthew)"],["salicylate","Salicylate"]].map(([m, label]) => (
          <button key={m} onClick={() => { setMode(m); setEntries([]); setTimeH(""); setLevelV(""); }}
            style={{ padding:"6px 16px", borderRadius:8, cursor:"pointer", border:`1px solid ${mode===m ? T.orange+"66" : "rgba(26,53,85,0.4)"}`, background:mode===m ? `${T.orange}15` : "transparent", color:mode===m ? T.orange : T.txt4, fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:mode===m ? 600 : 400 }}>
            {label}
          </button>
        ))}
      </div>

      {/* Threshold reference strip for APAP */}
      {mode === "apap" && (
        <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:12 }}>
          {[[4,150],[6,99],[8,70],[10,51],[12,38],[16,21],[20,12],[24,7]].map(([h, thr]) => (
            <div key={h} style={{ padding:"4px 8px", borderRadius:5, background:"rgba(255,159,67,0.08)", border:"1px solid rgba(255,159,67,0.2)", textAlign:"center" }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7, color:T.txt4 }}>{h}h</div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, fontWeight:700, color:T.orange }}>{thr}</div>
            </div>
          ))}
        </div>
      )}

      {/* Salicylate reference */}
      {mode === "salicylate" && (
        <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap" }}>
          {[{lbl:"Toxic threshold",val:"≥ 30 mg/dL",col:T.orange},{lbl:"Severe / HD consider",val:"≥ 80 mg/dL",col:T.red},{lbl:"HD threshold",val:"≥ 100 mg/dL + sx",col:T.red}].map(r => (
            <div key={r.lbl} style={{ padding:"6px 10px", borderRadius:7, background:`${r.col}0a`, border:`1px solid ${r.col}30`, flex:"1 1 140px" }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.txt4, marginBottom:2 }}>{r.lbl}</div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:13, fontWeight:700, color:r.col }}>{r.val}</div>
            </div>
          ))}
        </div>
      )}

      {/* Input row */}
      <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
        <input type="number" value={timeH} onChange={e => setTimeH(e.target.value)}
          placeholder="Hours post-ingestion" style={{ ...iBase, color:T.gold }} />
        <input type="number" value={levelV} onChange={e => setLevelV(e.target.value)}
          placeholder={`Level (${units})`} style={{ ...iBase, color:T.teal }} />
        <button onClick={addEntry} style={{ padding:"9px 20px", borderRadius:8, cursor:"pointer", border:`1px solid ${T.orange}55`, background:`${T.orange}15`, color:T.orange, fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600 }}>+ Add</button>
      </div>

      {/* Empty state */}
      {entries.length === 0 && (
        <div style={{ padding:"22px", textAlign:"center", color:T.txt4, fontFamily:"'DM Sans',sans-serif", fontSize:12, background:"rgba(8,22,40,0.5)", border:"1px solid rgba(26,53,85,0.3)", borderRadius:10 }}>
          Add time + level pairs — each plotted against the treatment threshold
        </div>
      )}

      {/* Entry list */}
      {entries.map((e, i) => (
        <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 14px", borderRadius:10, marginBottom:7, background:`${scol[e.status]}0d`, border:`1px solid ${scol[e.status]}35`, borderLeft:`3px solid ${scol[e.status]}` }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:17, fontWeight:700, color:T.gold, minWidth:38 }}>{e.h}h</div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:20, fontWeight:700, color:scol[e.status], flex:1 }}>{e.l} <span style={{ fontSize:11, fontWeight:400 }}>{units}</span></div>
          {e.thresh != null && (
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:T.txt4, textAlign:"right" }}>threshold<br />{e.thresh} {units}</div>
          )}
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:scol[e.status], background:`${scol[e.status]}20`, border:`1px solid ${scol[e.status]}40`, borderRadius:4, padding:"2px 7px", textTransform:"uppercase", whiteSpace:"nowrap" }}>{slbl[e.status]}</span>
          <button onClick={() => setEntries(p => p.filter((_, j) => j !== i))} style={{ background:"none", border:"none", color:T.txt4, cursor:"pointer", fontSize:14, padding:0, flexShrink:0 }}>✕</button>
        </div>
      ))}

      {/* Trend indicator */}
      {entries.length >= 2 && (() => {
        const last2 = entries.slice(-2);
        const rising = last2[1].l > last2[0].l;
        return (
          <div style={{ marginTop:4, padding:"9px 13px", borderRadius:8, background:`${rising ? T.coral : T.green}0d`, border:`1px solid ${rising ? T.coral : T.green}30`, fontFamily:"'DM Sans',sans-serif", fontSize:12, color:rising ? T.coral : T.green, fontWeight:600 }}>
            {rising ? "⬆ Rising — consider ER-APAP, delayed absorption, or repeat nomogram" : "⬇ Trending down — reassess per stop criteria before discontinuing NAC"}
          </div>
        );
      })()}
    </div>
  );
}

// ─── COWS CALCULATOR ──────────────────────────────────────────────────────────
function COWSCalculator() {
  const initScores = () => Object.fromEntries(COWS_ITEMS.map(i => [i.id, 0]));
  const [scores,   setScores]   = useState(initScores);
  const [fentanyl, setFentanyl] = useState(false);

  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  const tier  = total < 5 ? null : total <= 12 ? "mild" : total <= 24 ? "moderate" : total <= 36 ? "mod_severe" : "severe";
  const TIERS = {
    mild:       { label:"Mild (5–12)",              color:T.gold,   bupe:"Monitor — initiate buprenorphine when COWS ≥ 8" },
    moderate:   { label:"Moderate (13–24)",          color:T.orange, bupe:"Buprenorphine 4–8 mg SL" },
    mod_severe: { label:"Moderately Severe (25–36)", color:T.coral,  bupe:"Buprenorphine 8–12 mg SL" },
    severe:     { label:"Severe (> 36)",             color:T.red,    bupe:"Buprenorphine 8–16 mg SL" },
  };
  const tc = tier ? TIERS[tier].color : T.txt4;
  const selStyle = { width:"100%",padding:"5px 8px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:7,color:T.txt2,fontFamily:"'JetBrains Mono',monospace",fontSize:11,outline:"none" };

  return (
    <div>
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12 }}>
        <div>
          <div style={{ fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,color:T.purple }}>COWS Score Calculator</div>
          <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.txt4,marginTop:2 }}>Clinical Opiate Withdrawal Scale — buprenorphine initiation guide</div>
        </div>
        <button onClick={() => { setScores(initScores()); setFentanyl(false); }} style={{ padding:"5px 12px",borderRadius:7,cursor:"pointer",border:"1px solid rgba(255,255,255,0.12)",background:"rgba(255,255,255,0.06)",color:T.txt4,fontFamily:"'DM Sans',sans-serif",fontSize:11 }}>Reset</button>
      </div>

      {/* Score display */}
      <div style={{ display:"flex",alignItems:"center",gap:18,padding:"16px 20px",borderRadius:12,marginBottom:14,background:`${tc}10`,border:`2px solid ${tc}${tier?"55":"30"}` }}>
        <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:56,fontWeight:700,color:tc,lineHeight:1,flexShrink:0 }}>{total}</div>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,color:tc,marginBottom:5 }}>
            {tier ? TIERS[tier].label : "No significant withdrawal (< 5)"}
          </div>
          {tier && (
            <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.txt2,lineHeight:1.55 }}>
              {TIERS[tier].bupe}
              {fentanyl && tier !== "mild" && (
                <div style={{ marginTop:5,color:T.coral,fontWeight:600 }}>
                  Fentanyl: high-dose induction 16–24 mg SL — wait 12–24h after last use, or use low-dose split protocol to avoid precipitated withdrawal
                </div>
              )}
            </div>
          )}
          {!tier && <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.txt4 }}>Buprenorphine not yet indicated — reassess in 1–2h if symptomatic</div>}
        </div>
      </div>

      {/* Fentanyl flag */}
      <button onClick={() => setFentanyl(f => !f)} style={{ display:"flex",alignItems:"center",gap:8,marginBottom:14,padding:"8px 14px",borderRadius:9,cursor:"pointer",border:`1px solid ${fentanyl ? T.coral+"66" : "rgba(26,53,85,0.4)"}`,background:fentanyl ? "rgba(255,107,107,0.1)" : "rgba(8,22,40,0.6)",color:fentanyl ? T.coral : T.txt4,fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:fentanyl ? 600 : 400,width:"100%" }}>
        <span style={{ fontSize:14 }}>{fentanyl ? "✓" : "○"}</span>
        Suspected fentanyl / long-acting opioid exposure — apply high-dose induction guidance
      </button>

      {/* COWS items — 2 column grid */}
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
        {COWS_ITEMS.map(item => (
          <div key={item.id} style={{ padding:"9px 11px",borderRadius:9,background:"rgba(8,22,40,0.65)",border:"1px solid rgba(26,53,85,0.45)" }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.txt4,letterSpacing:1,textTransform:"uppercase",marginBottom:6 }}>{item.label}</div>
            <select value={scores[item.id]} onChange={e => setScores(s => ({ ...s, [item.id]:+e.target.value }))} style={selStyle}>
              {item.opts.map(o => <option key={o.v} value={o.v}>{o.v} — {o.l}</option>)}
            </select>
          </div>
        ))}
      </div>

      <div style={{ marginTop:12,padding:"9px 13px",borderRadius:8,background:"rgba(155,109,255,0.06)",border:"1px solid rgba(155,109,255,0.2)",fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.txt4,lineHeight:1.6 }}>
        COWS ≥ 8 = initiate buprenorphine · No X-waiver required (DEA 2023) · Reassess 45–60 min post-dose
      </div>
    </div>
  );
}

// ─── CALCULATE TAB ────────────────────────────────────────────────────────────
function CalculateTab({ globalWeight, setGlobalWeight }) {
  const [selectedId, setSelectedId] = useState("nac");
  const [level,      setLevel]      = useState("");
  const [apapH,      setApapH]      = useState("");
  const [apapL,      setApapL]      = useState("");

  const calc = DOSE_CALCS.find(d => d.id === selectedId);
  const w    = parseFloat(globalWeight) || 0;
  const rows = calc && w > 0 ? (calc.custom ? calc.rows(w, parseFloat(level) || null) : calc.rows(w)) : null;

  const thresh     = useMemo(() => rmThreshold(apapH), [apapH]);
  const apapResult = useMemo(() => {
    const h = parseFloat(apapH), l = parseFloat(apapL);
    if (isNaN(h) || isNaN(l) || h < 4) return null;
    const t = rmThreshold(h); if (!t) return null;
    return { threshold:t, treat:l >= t, level:l, hours:h };
  }, [apapH, apapL]);

  const iBase = { background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,color:"#e8edf5",fontFamily:"'JetBrains Mono',monospace",outline:"none",width:"100%" };

  return (
    <div>
      <div style={{ marginBottom:14,padding:"12px 16px",borderRadius:10,background:"rgba(20,184,166,0.06)",border:"1px solid rgba(20,184,166,0.2)" }}>
        <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.teal,letterSpacing:1.5,textTransform:"uppercase",marginBottom:6 }}>Patient Weight (kg) — applies hub-wide to all doses and cards</div>
        <input value={globalWeight} onChange={e => setGlobalWeight(e.target.value)} placeholder="kg" style={{ ...iBase,fontSize:26,fontWeight:700,padding:"10px 14px" }} />
      </div>
      <div style={{ display:"flex",gap:7,overflowX:"auto",paddingBottom:10,marginBottom:14,scrollbarWidth:"none" }}>
        {DOSE_CALCS.map(d => {
          const active = d.id === selectedId;
          return (
            <button key={d.id} onClick={() => setSelectedId(d.id)} style={{ flexShrink:0,padding:"8px 16px",borderRadius:22,cursor:"pointer",transition:"all .15s",border:`1px solid ${active ? d.color+"99" : "rgba(26,53,85,0.55)"}`,background:active ? `linear-gradient(135deg,${d.color}28,${d.color}0e)` : "rgba(8,22,40,0.75)",color:active ? d.color : T.txt3,fontFamily:"'DM Sans',sans-serif",fontWeight:active?700:400,fontSize:12,boxShadow:active ? `0 0 14px ${d.color}30` : "none" }}>
              {d.label}
            </button>
          );
        })}
      </div>
      {calc?.custom && (
        <div style={{ marginBottom:14,padding:"10px 14px",borderRadius:9,background:"rgba(59,158,255,0.06)",border:"1px solid rgba(59,158,255,0.22)" }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.txt4,letterSpacing:1.5,textTransform:"uppercase",marginBottom:6 }}>Dig Level (ng/mL)</div>
          <input value={level} onChange={e => setLevel(e.target.value)} placeholder="ng/mL" style={{ ...iBase,fontSize:18,fontWeight:700,padding:"8px 12px" }} />
        </div>
      )}
      {!w ? (
        <div style={{ padding:"28px",textAlign:"center",color:T.txt4,fontFamily:"'DM Sans',sans-serif",fontSize:13,background:"rgba(8,22,40,0.5)",border:"1px solid rgba(26,53,85,0.3)",borderRadius:10,marginBottom:20 }}>Enter weight above to calculate doses</div>
      ) : (
        <div className="tox-fade" style={{ background:"rgba(255,255,255,0.02)",border:`1px solid ${calc.color}35`,borderRadius:10,overflow:"hidden",marginBottom:20 }}>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 18px",borderBottom:`1px solid ${calc.color}22`,background:`linear-gradient(135deg,${calc.color}12,${calc.color}05)` }}>
            <span style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:14,color:calc.color }}>{calc.label}</span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:T.txt3 }}>{w} kg</span>
          </div>
          {(rows||[]).map((row, i) => (
            <div key={i} style={{ padding:"12px 18px",borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.txt4,letterSpacing:0.8,textTransform:"uppercase",marginBottom:3 }}>{row.label}</div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:26,fontWeight:700,color:calc.color,lineHeight:1.1 }}>{row.val}</div>
              {row.sub && <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.txt4,marginTop:3 }}>{row.sub}</div>}
            </div>
          ))}
        </div>
      )}
      <div style={{ borderTop:"1px solid rgba(26,53,85,0.5)",paddingTop:18 }}>
        <div style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:14,color:T.orange,marginBottom:4 }}>APAP Nomogram</div>
        <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.txt4,marginBottom:12,lineHeight:1.5 }}>{"Acute single-ingestion only · level ≥4h post-ingestion · invalid for extended-release APAP"}</div>
        <div style={{ display:"flex",gap:10,flexWrap:"wrap",marginBottom:12 }}>
          <div style={{ flex:"1 1 130px" }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.txt4,letterSpacing:1.3,textTransform:"uppercase",marginBottom:4 }}>Hours Since Ingestion</div>
            <input type="number" value={apapH} onChange={e => setApapH(e.target.value)} placeholder="e.g. 6" min="4" max="24" style={{ ...iBase,fontSize:18,fontWeight:700,padding:"8px 12px",color:T.orange }} />
          </div>
          <div style={{ flex:"1 1 130px" }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.txt4,letterSpacing:1.3,textTransform:"uppercase",marginBottom:4 }}>APAP Level (mcg/mL)</div>
            <input type="number" value={apapL} onChange={e => setApapL(e.target.value)} placeholder="e.g. 180" style={{ ...iBase,fontSize:18,fontWeight:700,padding:"8px 12px",color:T.teal }} />
          </div>
        </div>
        {thresh && !apapResult && (
          <div style={{ padding:"10px 14px",borderRadius:9,background:"rgba(42,79,122,0.1)",border:"1px solid rgba(42,79,122,0.3)",marginBottom:10 }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.txt4,marginBottom:3 }}>TREATMENT THRESHOLD AT {apapH}h</div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:24,fontWeight:700,color:T.orange }}>{thresh} mcg/mL</div>
          </div>
        )}
        {apapResult && (
          <div style={{ padding:"14px 16px",borderRadius:10,marginBottom:12,background:apapResult.treat?"linear-gradient(135deg,rgba(255,107,107,0.12),rgba(8,22,40,0.95))":"linear-gradient(135deg,rgba(61,255,160,0.1),rgba(8,22,40,0.95))",border:`2px solid ${apapResult.treat?T.coral+"66":T.green+"66"}` }}>
            <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:6 }}>
              <span style={{ fontSize:22 }}>{apapResult.treat?"⚠️":"✅"}</span>
              <div style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:16,color:apapResult.treat?T.coral:T.green }}>{apapResult.treat?"TREAT WITH NAC":"BELOW TREATMENT LINE"}</div>
            </div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.txt3,marginBottom:6 }}>Level {apapResult.level} mcg/mL at {apapResult.hours}h · Threshold {apapResult.threshold} mcg/mL</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.txt2,lineHeight:1.6 }}>
              {apapResult.treat ? "APAP at or above treatment line. Initiate IV NAC immediately. Check LFTs and PT/INR." : "Level below treatment line. NAC not indicated by nomogram. However — if uncertain ingestion time, level still rising, ALT elevated, or extended-release: treat empirically."}
            </div>
          </div>
        )}
        <div style={{ display:"flex",flexWrap:"wrap",gap:5 }}>
          {[[4,150],[6,99],[8,70],[10,51],[12,38],[16,21],[20,12],[24,7]].map(([h,l]) => (
            <div key={h} style={{ padding:"5px 9px",borderRadius:6,background:"rgba(255,159,67,0.08)",border:"1px solid rgba(255,159,67,0.22)",textAlign:"center" }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.txt4 }}>{h}h</div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:700,color:T.orange }}>{l}</div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:7,color:T.txt4 }}>mcg/mL</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────
export default function ToxicologyHub({ embedded = false, onBack }) {
  const [tab,            setTab]           = useState("search");
  const [query,          setQuery]         = useState("");
  const [detail,         setDetail]        = useState(null);
  const [globalWeight,   setGlobalWeight]  = useState("");
  const [recentlyViewed, setRecentlyViewed]= useState([]);
  const [showMatcher,    setShowMatcher]   = useState(false);
  const [notStocked,     setNotStocked]    = useState(new Set());
  const [showShortcuts,  setShowShortcuts] = useState(false);
  const searchRef = useRef(null);

  const toggleNotStocked = useCallback(name => {
    setNotStocked(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }, []);

  useEffect(() => { if (tab === "search") setTimeout(() => searchRef.current?.focus(), 80); }, [tab]);

  const openDetail = useCallback((item, isProtocol, list = null, listIdx = -1) => {
    setDetail({ item, isProtocol, list, listIdx });
    setRecentlyViewed(prev => {
      const key = isProtocol ? item.id : item.antidote;
      const filtered = prev.filter(r => (r.isProtocol ? r.item.id : r.item.antidote) !== key);
      return [{ item, isProtocol }, ...filtered].slice(0, 6);
    });
  }, []);
  const closeDetail = useCallback(() => setDetail(null), []);

  // ── Global keyboard shortcuts ──────────────────────────────────────────────
  // Skip when focus is inside any text input / textarea / select
  useEffect(() => {
    const isTyping = () => {
      const el = document.activeElement;
      return el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT");
    };
    const handler = e => {
      if (isTyping()) return;
      if (detail) return;              // modal open — only Esc handled inside modal
      switch (e.key) {
        case "1": case "2": case "3": case "4":
        case "5": case "6": case "7": case "8": {
          const idx = parseInt(e.key, 10) - 1;
          const name = QUICK_ACCESS[idx];
          if (!name) return;
          const a = ANTIDOTES.find(x => x.antidote === name);
          if (a) openDetail(a, false, ANTIDOTES, ANTIDOTES.indexOf(a));
          break;
        }
        case "s": case "S": case "/":
          e.preventDefault();
          setTab("search");
          setTimeout(() => searchRef.current?.focus(), 80);
          break;
        case "a": case "A":
          setTab("agents");
          break;
        case "c": case "C":
          setTab("calculate");
          break;
        case "t": case "T":
          setTab("search");
          setShowMatcher(p => !p);
          break;
        case "?":
          setShowShortcuts(p => !p);
          break;
        default: break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [detail, openDetail]);

  const filteredAntidotes = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return ANTIDOTES;
    return ANTIDOTES.filter(a => a.antidote.toLowerCase().includes(q) || a.toxin.toLowerCase().includes(q) || (a.quickDose||"").toLowerCase().includes(q) || (a.pearls||"").toLowerCase().includes(q));
  }, [query]);

  const filteredProtocols = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return PROTOCOLS;
    return PROTOCOLS.filter(p => p.name.toLowerCase().includes(q) || p.alert.toLowerCase().includes(q));
  }, [query]);

  const groupedAntidotes = useMemo(() => {
    const groups = {};
    ANTIDOTES.forEach(a => { if (!groups[a.urgency]) groups[a.urgency] = []; groups[a.urgency].push(a); });
    return TIER_ORDER.filter(t => groups[t]?.length).map(t => ({ tier:t, items:groups[t] }));
  }, []);

  const tabStyle = id => {
    const cols = { search:T.teal, agents:T.blue, calculate:T.cyan, tools:T.purple };
    const active = tab === id;
    return { fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:13,padding:"8px 18px",borderRadius:9,cursor:"pointer",border:`1px solid ${active ? cols[id]+"66" : "rgba(26,53,85,0.4)"}`,background:active ? `linear-gradient(135deg,${cols[id]}18,${cols[id]}06)` : "transparent",color:active ? cols[id] : T.txt4,transition:"all .15s" };
  };

  const w = parseFloat(globalWeight) || 0;

  return (
    <div style={{ display:"flex",minHeight:"100vh",background:embedded?"transparent":T.bg,color:T.txt }}>
      {!embedded && <NotryaNav currentHub="ToxicologyHub" />}
      <div style={{ flex:1,overflow:"auto",display:"flex",flexDirection:"column",minWidth:0 }}>
        {!embedded && <NotryaHubHeader hubName="Toxicology Hub" category="Tox" homeUrl="/" />}
        <div style={{ maxWidth:1100,margin:"0 auto",padding:embedded?"0":"0 16px",width:"100%" }}>

          {/* Global weight badge */}
          {w > 0 && (
            <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:10,padding:"7px 14px",borderRadius:9,background:"rgba(0,229,192,0.07)",border:"1px solid rgba(0,229,192,0.25)",width:"fit-content" }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:T.teal,fontWeight:700 }}>⚖ {w} kg patient</span>
              <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.txt4 }}>· weight-linked doses active</span>
              <button onClick={() => setGlobalWeight("")} style={{ background:"none",border:"none",color:T.txt4,cursor:"pointer",fontSize:12,padding:"0 2px" }}>✕</button>
            </div>
          )}

          {/* Tab bar */}
          <div style={{ display:"flex",gap:6,padding:"6px",background:"rgba(8,22,40,0.7)",border:"1px solid rgba(26,53,85,0.4)",borderRadius:12,marginBottom:14 }}>
            <button onClick={() => setTab("search")}    style={tabStyle("search")}>🔍 Search</button>
            <button onClick={() => setTab("agents")}    style={tabStyle("agents")}>⚗️ Agents</button>
            <button onClick={() => setTab("calculate")} style={tabStyle("calculate")}>
              ⚖️ Calculate{w > 0 && <span style={{ marginLeft:6,fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.teal,background:"rgba(0,229,192,0.15)",border:"1px solid rgba(0,229,192,0.35)",borderRadius:4,padding:"1px 5px" }}>{w}kg</span>}
            </button>
            <button onClick={() => setTab("tools")} style={tabStyle("tools")}>🩺 Tools</button>
            <button onClick={() => setShowShortcuts(p => !p)} style={{ marginLeft:"auto",padding:"8px 14px",borderRadius:9,cursor:"pointer",border:`1px solid ${showShortcuts ? T.txt3+"44" : "rgba(26,53,85,0.4)"}`,background:showShortcuts ? "rgba(255,255,255,0.08)" : "transparent",color:T.txt4,fontFamily:"'JetBrains Mono',monospace",fontSize:11 }}>?</button>
          </div>

          {/* Keyboard shortcut overlay */}
          {showShortcuts && (
            <div className="tox-fade" style={{ marginBottom:14,padding:"14px 18px",borderRadius:11,background:"rgba(8,22,40,0.9)",border:"1px solid rgba(255,255,255,0.1)" }}>
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12 }}>
                <div style={{ fontFamily:"'Playfair Display',serif",fontSize:13,fontWeight:700,color:T.txt2 }}>Keyboard Shortcuts</div>
                <button onClick={() => setShowShortcuts(false)} style={{ background:"none",border:"none",color:T.txt4,cursor:"pointer",fontSize:14 }}>✕</button>
              </div>
              <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:6 }}>
                {[
                  { key:"1 – 8",  desc:"Open Quick Access antidote" },
                  { key:"S  or  /", desc:"Focus search bar" },
                  { key:"A",       desc:"Go to Agents tab" },
                  { key:"C",       desc:"Go to Calculate tab" },
                  { key:"T",       desc:"Toggle Toxidrome Matcher" },
                  { key:"?",       desc:"Toggle this shortcut guide" },
                  { key:"← →",    desc:"Prev / Next in modal" },
                  { key:"Esc",     desc:"Close modal" },
                ].map(({ key, desc }) => (
                  <div key={key} style={{ display:"flex",alignItems:"center",gap:10 }}>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:700,color:T.teal,background:"rgba(0,229,192,0.1)",border:"1px solid rgba(0,229,192,0.25)",borderRadius:5,padding:"2px 9px",whiteSpace:"nowrap",minWidth:40,textAlign:"center" }}>{key}</span>
                    <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.txt3 }}>{desc}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop:10,fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.txt4 }}>Shortcuts disabled while typing in any input field</div>
            </div>
          )}

          {/* ── SEARCH TAB ── */}
          {tab === "search" && (
            <div className="tox-fade">
              <div style={{ marginBottom:12,position:"relative" }}>
                <span style={{ position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:16,pointerEvents:"none" }}>🔍</span>
                <input ref={searchRef} value={query} onChange={e => setQuery(e.target.value)}
                  placeholder="Search antidotes, toxins, protocols — type anything"
                  style={{ width:"100%",padding:"14px 42px",background:"rgba(14,37,68,0.9)",border:`1px solid ${query?"rgba(0,229,192,0.5)":"rgba(42,79,122,0.4)"}`,borderRadius:14,outline:"none",fontFamily:"'DM Sans',sans-serif",fontSize:15,color:T.txt,boxSizing:"border-box",transition:"border-color .2s" }} />
                {query && <button onClick={() => setQuery("")} style={{ position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"rgba(255,255,255,0.08)",border:"none",borderRadius:6,color:T.txt4,cursor:"pointer",fontSize:13,padding:"3px 8px" }}>✕</button>}
              </div>

              {!query ? (
                <>
                  {/* Recently viewed */}
                  {recentlyViewed.length > 0 && (
                    <>
                      <SectionLabel label="Recently Viewed" color={T.txt4} />
                      <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginBottom:4 }}>
                        {recentlyViewed.map((r, i) => {
                          const name = r.isProtocol ? r.item.name : r.item.antidote;
                          const col  = r.item.color;
                          return (
                            <button key={i} onClick={() => openDetail(r.item, r.isProtocol)} style={{ padding:"5px 12px",borderRadius:20,cursor:"pointer",border:`1px solid ${col}55`,background:`${col}10`,color:col,fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600 }}>
                              {r.isProtocol ? r.item.icon+" " : ""}{name}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {/* Toxidrome matcher toggle */}
                  <div style={{ margin:"14px 0 6px",display:"flex",alignItems:"center",gap:8 }}>
                    <button onClick={() => setShowMatcher(p => !p)} style={{ display:"flex",alignItems:"center",gap:7,padding:"7px 14px",borderRadius:9,cursor:"pointer",border:`1px solid ${showMatcher ? T.purple+"66" : "rgba(26,53,85,0.4)"}`,background:showMatcher ? `linear-gradient(135deg,${T.purple}18,${T.purple}06)` : "rgba(8,22,40,0.6)",color:showMatcher ? T.purple : T.txt4,fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:600 }}>
                      🧬 {showMatcher ? "Hide" : "Open"} Toxidrome Matcher
                    </button>
                    {!showMatcher && <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.txt4 }}>Check symptoms → surface likely toxidrome</span>}
                  </div>
                  {showMatcher && <ToxidromeMatcher onSelectAntidote={a => openDetail(a, false)} />}

                  {/* Quick Access — now includes condition treated */}
                  <SectionLabel label="Quick Access — Most Critical" color={T.red} />
                  <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:8,marginBottom:6 }}>
                    {QUICK_ACCESS.map(name => {
                      const a = ANTIDOTES.find(x => x.antidote === name);
                      if (!a) return null;
                      const uc   = { immediate:T.red,urgent:T.orange,caution:T.gold }[a.urgency];
                      const wStr = w > 0 && a.cardCalc ? a.cardCalc(w) : null;
                      return (
                        <div key={name} onClick={() => openDetail(a, false)}
                          style={{ padding:"12px 14px",borderRadius:10,cursor:"pointer",border:"1px solid rgba(26,53,85,0.5)",borderLeft:`3px solid ${a.color}`,background:`linear-gradient(135deg,${a.color}0e,rgba(8,22,40,0.85))`,transition:"all .15s" }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor=a.color+"55"; e.currentTarget.style.boxShadow=`0 0 16px ${a.color}22`; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor="rgba(26,53,85,0.5)"; e.currentTarget.style.boxShadow="none"; }}>
                          <div style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:13,color:a.color,marginBottom:3 }}>{a.antidote}</div>
                          {/* Condition treated — visible on every quick access card */}
                          <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.txt2,fontWeight:500,marginBottom:6,lineHeight:1.35 }}>{a.toxin}</div>
                          {wStr ? (
                            <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:700,color:a.color,lineHeight:1.35,marginBottom:5 }}>{w}kg → {wStr}</div>
                          ) : (
                            <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:10,fontWeight:600,color:a.color,lineHeight:1.35,marginBottom:5 }}>{a.quickDose.split("—")[0].trim()}</div>
                          )}
                          <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:7,color:uc,background:`${uc}18`,border:`1px solid ${uc}35`,borderRadius:4,padding:"1px 5px",textTransform:"uppercase" }}>{a.urgency}</span>
                        </div>
                      );
                    })}
                  </div>

                  <SectionLabel label="All Antidotes" color={T.teal} count={ANTIDOTES.length} />
                  <CardGrid>{ANTIDOTES.map((a, i) => <StatCard key={a.antidote} item={a} isProtocol={false} onClick={() => openDetail(a, false, ANTIDOTES, i)} globalWeight={globalWeight} notStocked={notStocked} />)}</CardGrid>
                </>
              ) : (
                <>
                  {filteredAntidotes.length > 0 && (
                    <>
                      <SectionLabel label="Antidotes" color={T.teal} count={filteredAntidotes.length} />
                      <CardGrid>{filteredAntidotes.map((a, i) => <StatCard key={a.antidote} item={a} isProtocol={false} onClick={() => openDetail(a, false, filteredAntidotes, i)} globalWeight={globalWeight} notStocked={notStocked} />)}</CardGrid>
                    </>
                  )}
                  {filteredProtocols.length > 0 && (
                    <>
                      <SectionLabel label="Protocols" color={T.coral} count={filteredProtocols.length} />
                      <CardGrid>{filteredProtocols.map((p, i) => <StatCard key={p.id} item={p} isProtocol={true} onClick={() => openDetail(p, true, filteredProtocols, i)} globalWeight={globalWeight} notStocked={notStocked} />)}</CardGrid>
                    </>
                  )}
                  {filteredAntidotes.length === 0 && filteredProtocols.length === 0 && (
                    <div style={{ padding:"32px",textAlign:"center",color:T.txt4,fontFamily:"'DM Sans',sans-serif",fontSize:13,background:"rgba(8,22,40,0.5)",border:"1px solid rgba(26,53,85,0.3)",borderRadius:10 }}>No results for "{query}"</div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── AGENTS TAB ── */}
          {tab === "agents" && (
            <div className="tox-fade">
              {groupedAntidotes.map(({ tier, items }) => {
                const m = TIER_META[tier];
                return (
                  <div key={tier}>
                    <SectionLabel label={m.label} color={m.color} count={items.length} />
                    <CardGrid>{items.map((a, i) => <StatCard key={a.antidote} item={a} isProtocol={false} onClick={() => openDetail(a, false, items, i)} globalWeight={globalWeight} notStocked={notStocked} />)}</CardGrid>
                  </div>
                );
              })}
              <SectionLabel label="Protocols" color={T.coral} count={PROTOCOLS.length} />
              <CardGrid>{PROTOCOLS.map((p, i) => <StatCard key={p.id} item={p} isProtocol={true} onClick={() => openDetail(p, true, PROTOCOLS, i)} globalWeight={globalWeight} notStocked={notStocked} />)}</CardGrid>
              <SectionLabel label="Toxidrome Reference" color={T.purple} />
              <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:7 }}>
                {TOXIDROMES.map(tox => (
                  <div key={tox.name} style={{ padding:"10px 12px",borderRadius:9,background:"rgba(8,22,40,0.65)",border:"1px solid rgba(26,53,85,0.4)",borderLeft:`3px solid ${tox.color}` }}>
                    <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:7 }}>
                      <span style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:12,color:tox.color }}>{tox.name}</span>
                      <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.teal,background:"rgba(0,229,192,0.09)",border:"1px solid rgba(0,229,192,0.3)",borderRadius:4,padding:"1px 7px" }}>Tx: {tox.tx}</span>
                    </div>
                    <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:5 }}>
                      {[{ l:"Pupils",v:tox.pupils },{ l:"Mental Status",v:tox.ms },{ l:"Vitals",v:tox.vitals },{ l:"Skin",v:tox.skin }].map(f => (
                        <div key={f.l} style={{ padding:"4px 7px",background:`${tox.color}09`,border:`1px solid ${tox.color}22`,borderRadius:5 }}>
                          <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:7,color:tox.color,textTransform:"uppercase",letterSpacing:0.8,marginBottom:2 }}>{f.l}</div>
                          <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.txt3,lineHeight:1.3 }}>{f.v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <SectionLabel label="Poison Control" color={T.red} />
              <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:8,marginBottom:14 }}>
                {[{ title:"US Poison Control",val:"1-800-222-1222",sub:"National 24/7 · physician-to-physician consult",color:T.red,icon:"☎️" },{ title:"CHEMTREC (hazmat)",val:"1-800-424-9300",sub:"24/7 chemical emergency response",color:T.orange,icon:"⚗️" },{ title:"Never Use Alone",val:"1-800-484-3731",sub:"Free overdose monitoring — stays on line, calls 911",color:T.purple,icon:"📞" }].map(c => (
                  <div key={c.title} style={{ padding:"12px 14px",borderRadius:10,background:`${c.color}0a`,border:`1px solid ${c.color}33`,borderLeft:`3px solid ${c.color}` }}>
                    <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:5 }}><span style={{ fontSize:18 }}>{c.icon}</span><span style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:13,color:c.color }}>{c.title}</span></div>
                    <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:18,fontWeight:700,color:c.color,marginBottom:4 }}>{c.val}</div>
                    <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.txt4,lineHeight:1.5 }}>{c.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── CALCULATE TAB ── */}
          {tab === "calculate" && <div className="tox-fade"><CalculateTab globalWeight={globalWeight} setGlobalWeight={setGlobalWeight} /></div>}

          {/* ── TOOLS TAB ── */}
          {tab === "tools" && (
            <div className="tox-fade">
              <AIToxInterpreter />
              <div style={{ height:1, background:"rgba(26,53,85,0.5)", margin:"4px 0 24px" }} />
              <SerialLevelTracker />
              <div style={{ height:1, background:"rgba(26,53,85,0.5)", margin:"4px 0 24px" }} />
              <COWSCalculator />
              <div style={{ height:1, background:"rgba(26,53,85,0.5)", margin:"4px 0 24px" }} />
              <DigoxinStaging />
            </div>
          )}

          {!embedded && (
            <div style={{ textAlign:"center",padding:"24px 0 16px",fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.txt4,letterSpacing:1.5 }}>
              NOTRYA TOX HUB · FOR CLINICAL DECISION SUPPORT ONLY · VERIFY WITH POISON CONTROL AND TOXICOLOGY
            </div>
          )}
        </div>
      </div>

      {/* Modal overlay — rendered outside main scroll container */}
      {detail && (
        <DetailModal
          item={detail.item}
          isProtocol={detail.isProtocol}
          onClose={closeDetail}
          globalWeight={globalWeight}
          list={detail.list}
          listIdx={detail.listIdx}
          onNavigate={openDetail}
          notStocked={notStocked}
          toggleNotStocked={toggleNotStocked}
        />
      )}
    </div>
  );
}