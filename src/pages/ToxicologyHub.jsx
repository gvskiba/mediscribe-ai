// ToxicologyHub.jsx — Notrya
// 17 antidotes · 16 protocols · Dose Calculator · Rumack-Matthew · Toxidromes · Poison Control
// KEYBOARD: arrow nav · space/enter toggle · / search · H/L nomogram · C collapse all · ⌘1-6 tabs
// No router · no localStorage · no form/alert · straight quotes · <1600 lines

import { useState, useMemo, useCallback, useRef, useEffect } from "react";

(() => {
  if (document.getElementById("tox-fonts")) return;
  const l = document.createElement("link"); l.id = "tox-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "tox-css";
  s.textContent = `@keyframes tox-fade{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}.tox-fade{animation:tox-fade .18s ease forwards;}@keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}.shimmer-text{background:linear-gradient(90deg,#e8f0fe 0%,#fff 30%,#9b6dff 52%,#00e5c0 72%,#e8f0fe 100%);background-size:250% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 5s linear infinite;}`;
  document.head.appendChild(s);
})();

const T = { bg:"#050f1e",panel:"#081628",card:"#0b1e36",txt:"#f2f7ff",txt2:"#b8d4f0",txt3:"#82aece",txt4:"#5a82a8",teal:"#00e5c0",gold:"#f5c842",coral:"#ff6b6b",blue:"#3b9eff",orange:"#ff9f43",purple:"#9b6dff",green:"#3dffa0",red:"#ff4444",cyan:"#00d4ff" };
const EVID_COLOR = { "ACEP Policy":T.teal,"ACMT Statement":T.cyan,"Expert Consensus":T.gold,"Guideline":T.blue,"ACEP/ACMT":T.teal };

function KbHints({ hints }) {
  return (
    <div style={{ display:"flex",gap:14,flexWrap:"wrap",padding:"10px 0 2px",borderTop:"1px solid rgba(255,255,255,0.05)",marginTop:16 }}>
      {hints.map(({ key, label }) => (
        <span key={key} style={{ display:"flex",alignItems:"center",gap:5,fontSize:11,color:"#4b5563" }}>
          <kbd style={{ background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:5,color:"#94a3b8",fontFamily:"'JetBrains Mono',monospace",fontSize:10,padding:"2px 6px" }}>{key}</kbd>
          {label}
        </span>
      ))}
    </div>
  );
}

// ── ANTIDOTES ──────────────────────────────────────────────────────────────────
const ANTIDOTES = [
  { antidote:"Atropine", toxin:"Organophosphates / Carbamates / Nerve agents", color:T.orange, route:"IV / IM", urgency:"immediate", evidence:"Guideline",
    quickDose:"2-4 mg IV q5-10 min — no ceiling, titrate to dry secretions",
    dosing:"2-4 mg IV q5-10 min until secretions dry. No ceiling — titrate to bronchorrhea/bronchospasm resolution, NOT heart rate. Can require hundreds of mg in severe cases.",
    timing:"Start immediately for symptomatic cholinergic toxidrome. Do not delay for pralidoxime.",
    pearls:"Titration endpoint: dry secretions, clear breath sounds — NOT pupil dilation or HR. Pralidoxime (2-PAM) 1-2 g IV simultaneously for organophosphate (not carbamate).",
    peds:"Peds: 0.02-0.05 mg/kg IV q5-10 min (min 0.1 mg). No ceiling in severe toxidrome." },
  { antidote:"Sodium Bicarbonate", toxin:"Tricyclic antidepressants (TCA) / Sodium channel blockers", color:T.coral, route:"IV", urgency:"immediate", evidence:"Expert Consensus",
    quickDose:"1-2 mEq/kg IV bolus — repeat to QRS <100 ms, pH 7.45-7.55",
    dosing:"1-2 mEq/kg IV bolus. Repeat until QRS <120 ms or pH 7.45-7.55. Infusion: 150 mEq in 1L D5W at 1.5x maintenance.",
    timing:"Give for QRS >100 ms, ventricular dysrhythmia, or hypotension from TCA.",
    pearls:"Target pH 7.45-7.55 — alkalinization is the mechanism, not just sodium loading. Also for: cocaine QRS widening, flecainide, type Ia/Ic antiarrhythmics." },
  { antidote:"Hydroxocobalamin", toxin:"Cyanide / Smoke inhalation", color:T.red, route:"IV", urgency:"immediate", evidence:"Guideline",
    quickDose:"5 g IV over 15 min — repeat 5 g if unstable, max 15 g",
    dosing:"5 g IV over 15 min (adult). Pediatric: 70 mg/kg. Repeat 5 g if hemodynamically unstable. Max 15 g total.",
    timing:"First-line for smoke inhalation with suspected cyanide. Give empirically — do not wait for levels.",
    pearls:"Turns urine red for 5 days. Causes false SpO2 elevations — use co-oximetry. Compatible with sodium thiosulfate.",
    peds:"Peds: 70 mg/kg IV over 15 min. Repeat 70 mg/kg if unstable." },
  { antidote:"Pyridoxine (Vitamin B6)", toxin:"Isoniazid (INH) / Gyromitra mushrooms", color:T.green, route:"IV", urgency:"immediate", evidence:"Expert Consensus",
    quickDose:"1 mg/mg INH ingested (unknown: 5 g IV) — give with BZD simultaneously",
    dosing:"INH: 1 mg pyridoxine per 1 mg INH ingested. Unknown dose: 5 g IV. Give simultaneously with benzodiazepines for seizures.",
    timing:"Give immediately for INH-induced status epilepticus — BZD alone will fail.",
    pearls:"INH seizures are pyridoxine-depleted status — BZD + pyridoxine required. Phenytoin is ineffective for INH seizures.",
    peds:"Peds: same mg/mg INH approach. If unknown: 70 mg/kg IV (max 5 g)." },
  { antidote:"Naloxone", toxin:"Opioids", color:T.green, route:"IV / IM / IN / ETT", urgency:"urgent", evidence:"ACEP Policy",
    quickDose:"0.4-2 mg IV/IM/IN — titrate to respirations, NOT to full reversal",
    dosing:"0.4-2 mg IV/IM. Titrate to respirations — NOT to full reversal. IN: 4 mg (2 mg/nostril). Infusion: 2/3 of reversal dose per hour.",
    timing:"Onset IV 1-2 min, IM 5 min, IN 5-10 min. Half-life 60-90 min — shorter than most opioids.",
    pearls:"Buprenorphine: 4-8+ mg required. Fentanyl/xylazine (tranq dope): reverses opioid only — xylazine sedation persists. Nitazenes (novel synthetic opioids): may require very high doses, escalate early. Consider intubation if >10 mg given without response.",
    peds:"Peds: 0.01 mg/kg IV/IM/IN (max 0.4 mg/dose). Repeat q2-3 min prn. Infusion: 0.002-0.16 mg/kg/hr." },
  { antidote:"N-Acetylcysteine (NAC)", toxin:"Acetaminophen (APAP)", color:T.teal, route:"IV or PO", urgency:"urgent", evidence:"ACMT Statement",
    quickDose:"3-bag: 150/50/100 mg/kg  OR  2-bag (FDA 2024): 200/100 mg/kg",
    dosing:"3-bag: 150 mg/kg/60 min, then 50 mg/kg/4h, then 100 mg/kg/16h. 2-bag (FDA-approved late 2024, fewer reactions): 200 mg/kg/4h, then 100 mg/kg/16h. Both >=300 mg/kg in 20-21h. PO: 140 mg/kg load, 70 mg/kg q4h x17 doses.",
    timing:"Most effective within 8-10h. Still give >24h in fulminant failure. Do not wait if >8h and level pending.",
    pearls:"STOP criteria (ALL): APAP <10 mcg/mL AND INR <2 AND ALT/AST normal or decreased >=25-50% from peak AND clinically well. Fomepizole emerging as off-label adjunct for massive APAP OD — consult toxicology.",
    peds:"Peds: same weight-based dosing. Cap at 100 kg for dose calculations." },
  { antidote:"Buprenorphine (Suboxone)", toxin:"Opioid Use Disorder / Opioid Withdrawal", color:T.purple, route:"Sublingual", urgency:"urgent", evidence:"ACEP/ACMT",
    quickDose:"4-8 mg SL for moderate withdrawal (COWS >=8) — initiates MAT in the ED",
    dosing:"Moderate withdrawal (COWS 8-12): 4-8 mg SL. Severe (COWS >12): 8-12 mg SL. Fentanyl/high-potency opioid users: wait 12-24h or high-dose induction 16-24 mg to avoid precipitated withdrawal. Discharge bridge: 8-16 mg/day with MAT referral.",
    timing:"Give when COWS >=8. No X-waiver required as of 2023. Offer to all opioid OD patients at discharge.",
    pearls:"ACEP and ACMT endorse ED buprenorphine initiation as standard of care. For fentanyl users: longer wait (12-24h) or high-dose induction (16-24 mg) reduces precipitated withdrawal risk. Link to same-day bridge clinic." },
  { antidote:"Pralidoxime (2-PAM)", toxin:"Organophosphates", color:T.orange, route:"IV", urgency:"urgent", evidence:"Guideline",
    quickDose:"1-2 g IV over 15-30 min — give with atropine, not instead of",
    dosing:"1-2 g IV over 15-30 min. Infusion: 200-500 mg/hr. Give within 24-48h — less effective after acetylcholinesterase aging.",
    timing:"Give with atropine — not a substitute. Most effective before enzyme aging.",
    pearls:"NOT for carbamate poisoning. Ineffective once aging occurs. ICU for continuous infusion." },
  { antidote:"Digoxin-Specific Fab (Digibind / DigiFab)", toxin:"Digoxin / Digitalis glycosides", color:T.blue, route:"IV", urgency:"urgent", evidence:"Guideline",
    quickDose:"10-20 vials empiric acute · 1-6 vials chronic · or calculate",
    dosing:"Known dose: vials = (mg ingested x 0.8) / 0.5. Known level: vials = (level ng/mL x weight kg) / 100. Empiric acute OD: 10-20 vials. Empiric chronic: 1-6 vials.",
    timing:"Indicated for: life-threatening dysrhythmia, K+ >5.5, hemodynamic instability, level >15 ng/mL (acute).",
    pearls:"Post-digibind levels unreliable. Potassium shifts rapidly — monitor closely. Renal failure: prolonged half-life of complex." },
  { antidote:"Calcium (Gluconate or Chloride)", toxin:"Calcium channel blockers / Beta-blockers / Hyperkalemia / Fluoride", color:T.gold, route:"IV", urgency:"urgent", evidence:"Expert Consensus",
    quickDose:"Gluconate 3 g IV over 5 min (x3) — HDI: insulin 1 unit/kg + dextrose",
    dosing:"CCB OD: calcium gluconate 3g IV (CaCl 1g IV) over 5 min; repeat x3. HDI: regular insulin 1 unit/kg IV bolus + D50 1 amp, then 0.5-1 unit/kg/hr infusion. Intralipid 1.5 mL/kg for refractory CCB.",
    timing:"Give early in CCB/BB OD — before collapse. HDI is primary for severe CCB toxicity.",
    pearls:"CaCl = 3x more elemental calcium than gluconate — use centrally. HDI is now first-line for severe CCB alongside calcium." },
  { antidote:"Fomepizole (4-MP)", toxin:"Methanol / Ethylene glycol", color:T.cyan, route:"IV", urgency:"urgent", evidence:"Guideline",
    quickDose:"15 mg/kg IV loading dose — give empirically, don't wait for levels",
    dosing:"15 mg/kg IV over 30 min, then 10 mg/kg q12h x4, then 15 mg/kg q12h. Continue until level <20 mg/dL and asymptomatic.",
    timing:"Give immediately on clinical suspicion. Simultaneous HD for severe acidosis, level >50 mg/dL, or end-organ damage.",
    pearls:"Blocks alcohol dehydrogenase — prevents toxic metabolite formation. Ethanol infusion if unavailable. Dialysis removes parent compound and metabolites." },
  { antidote:"Methylene Blue", toxin:"Methemoglobinemia", color:T.blue, route:"IV", urgency:"urgent", evidence:"Expert Consensus",
    quickDose:"1-2 mg/kg IV over 5 min — MetHb >30% or symptomatic",
    dosing:"1-2 mg/kg IV over 5 min. Repeat 1 mg/kg in 1h if inadequate response. Max 7 mg/kg total.",
    timing:"MetHb >30% or symptomatic at any level. Response within 30-60 min.",
    pearls:"Ineffective in G6PD deficiency — exchange transfusion instead. Causes: dapsone, benzocaine, nitrites, primaquine. Co-oximetry required.",
    peds:"Peds: 1-2 mg/kg IV over 5 min (same as adult weight-based dosing)." },
  { antidote:"Lipid Emulsion (Intralipid 20%)", toxin:"Lipophilic drug toxicity — local anesthetics, CCB, TCA", color:T.gold, route:"IV", urgency:"urgent", evidence:"Expert Consensus",
    quickDose:"1.5 mL/kg IV bolus over 1 min — lipophilic drug arrest or peri-arrest",
    dosing:"1.5 mL/kg IV bolus over 1 min. Repeat x2 if no response. Infusion: 0.25 mL/kg/min for 30-60 min. Max 10-12 mL/kg.",
    timing:"Cardiac arrest or peri-arrest from lipophilic drug toxicity — when all else fails.",
    pearls:"Lipid sink mechanism draws drug from tissues. Bupivacaine arrest, refractory CCB, TCA. May impair vasopressor binding — continue vasopressors." },
  { antidote:"Glucagon", toxin:"Beta-blockers / Calcium channel blockers", color:T.orange, route:"IV", urgency:"urgent", evidence:"Expert Consensus",
    quickDose:"3-10 mg IV bolus — bridge therapy while setting up HDI",
    dosing:"3-10 mg IV bolus over 1-2 min. Infusion: effective bolus dose per hour.",
    timing:"Onset 1-3 min. Duration 15-20 min. Use while setting up HDI.",
    pearls:"Induces nausea/vomiting — have airway ready. Tachyphylaxis limits sustained use. HDI is preferred first-line." },
  { antidote:"Deferoxamine", toxin:"Iron overdose", color:T.red, route:"IV", urgency:"urgent", evidence:"Guideline",
    quickDose:"15 mg/kg/hr IV — titrate to urine color clearing (vin rose = effective)",
    dosing:"15 mg/kg/hr IV (max 35 mg/kg/hr severe). Continue until urine clears and clinically improved.",
    timing:"Serum iron >500 mcg/dL, symptomatic poisoning, metabolic acidosis.",
    pearls:"Urine turns rose/wine when effective. Do not use orally. Discontinue after 24h — risk of ARDS with prolonged use." },
  { antidote:"Flumazenil", toxin:"Benzodiazepines", color:T.purple, route:"IV", urgency:"caution", evidence:"Expert Consensus",
    quickDose:"0.2 mg IV q1 min to max 1 mg — rarely indicated, see contraindications",
    dosing:"0.2 mg IV over 30 sec; repeat 0.2 mg q1 min to max 1 mg total.",
    timing:"Short half-life — resedation likely within 1-2h.",
    pearls:"CONTRAINDICATED: chronic BZD users (seizures), mixed TCA ingestion, seizures controlled by BZD, elevated ICP. Rarely indicated — manage airway instead." },
  { antidote:"Physostigmine", toxin:"Anticholinergic toxidrome (pure — not mixed TCA)", color:T.purple, route:"IV", urgency:"caution", evidence:"Expert Consensus",
    quickDose:"1-2 mg IV over 5 min — PURE anticholinergic ONLY, TCA = fatal",
    dosing:"1-2 mg IV over 5 min. May repeat once in 20 min. Pediatric: 0.02 mg/kg (max 0.5 mg) over 5 min.",
    timing:"Pure anticholinergic only — absolutely contraindicated if TCA co-ingestion suspected.",
    pearls:"CONTRAINDICATED: TCA or sodium channel blocker ingestion (fatal bradycardia/asystole). Consult toxicology before use." },
];

const TIER_META = { immediate:{ label:"Immediate",sub:"life-threatening — give now",color:"#ff4444" },urgent:{ label:"Urgent",sub:"critical — prioritize",color:"#ff9f43" },caution:{ label:"Caution",sub:"contraindications apply",color:"#f5c842" } };
const TIER_ORDER = ["immediate","urgent","caution"];

// ── PROTOCOLS ─────────────────────────────────────────────────────────────────
const PROTOCOLS = [
  { id:"apap", name:"Acetaminophen", icon:"💊", color:T.teal,
    alert:"Plot APAP level (>=4h post-ingestion) on Rumack-Matthew nomogram — NOT valid for extended-release formulations",
    sections:[
      { label:"Immediate Steps", color:T.teal, items:["IV x2, cardiac monitor, pulse ox","APAP level >=4h post-ingestion to plot nomogram","LFTs, PT/INR, BMP, acetaminophen, ethanol level","Activated charcoal 1 g/kg PO/NG if <1h post-ingestion and protected airway","Extended-release APAP: check serial levels at 4h AND 8h — treat if either plots above line"] },
      { label:"NAC Regimen (choose one)", color:T.orange, items:["3-bag IV: 150 mg/kg/60 min, then 50 mg/kg/4h, then 100 mg/kg/16h","2-bag IV (FDA-approved late 2024, fewer reactions): 200 mg/kg/4h, then 100 mg/kg/16h","Both deliver >=300 mg/kg in 20-21h — ACMT/ACAP 2023 endorses either","NAC if >8h and level pending — do not wait. NAC for any symptomatic hepatotoxicity"] },
      { label:"Stop Criteria (ALL must be met)", color:T.teal, items:["APAP level <10 mcg/mL","INR <2","ALT/AST normal OR decreased >=25-50% from peak","Patient clinically well","If ALT still rising: continue NAC regardless of APAP level"] },
      { label:"Escalation", color:T.blue, items:["LFTs q8-12h during NAC","King's College Criteria: INR >6, creatinine >3.4, pH <7.30, Grade III/IV encephalopathy — transplant evaluation","Fomepizole as NAC adjunct: emerging off-label for massive APAP OD — consult toxicology"] },
    ],
    pearl:"APAP level <4h post-ingestion cannot be plotted — repeat at 4h. Extended-release APAP: nomogram is invalid — check 4h AND 8h levels, treat if either plots above line or if any rise between draws." },
  { id:"tca", name:"Tricyclic Antidepressants", icon:"⚡", color:T.coral,
    alert:"QRS >100 ms = sodium bicarbonate NOW — do not wait for worsening",
    sections:[
      { label:"Immediate Steps", color:T.coral, items:["12-lead EKG immediately — QRS width, terminal R in aVR >3 mm, R:S ratio >0.7 in aVR","Continuous cardiac monitoring — dysrhythmia can occur suddenly","IV x2, O2, establish airway early if AMS","BMP, acetaminophen, salicylate levels (TCA level correlates poorly with toxicity — EKG is better)"] },
      { label:"Antidote / Treatment", color:T.orange, items:["QRS >100 ms or dysrhythmia: sodium bicarb 1-2 mEq/kg IV bolus now","Repeat bicarb until QRS <100 ms — titrate to pH 7.45-7.55","Hypotension: IVF 1-2L, then norepinephrine — avoid dopamine","Seizures: benzodiazepines only — phenytoin CONTRAINDICATED for TCA seizures","Drug-induced torsades: avoid amiodarone — use magnesium 2 g IV or overdrive pacing"] },
      { label:"Dangerous Combinations", color:T.red, items:["Flumazenil: absolutely contraindicated — precipitates refractory seizures","Physostigmine: contraindicated — fatal bradycardia and asystole","Phenytoin: contraindicated for TCA-induced seizures","Amiodarone: avoid — worsens sodium channel blockade"] },
    ],
    pearl:"R wave in aVR >3 mm and R:S ratio >0.7 in aVR are the most specific EKG findings for TCA toxicity. Alkalinization — not just sodium — is the mechanism of bicarb." },
  { id:"ccb", name:"Calcium Channel Blockers", icon:"❤️", color:T.orange,
    alert:"High-dose insulin (HDI) is first-line — start early, do not wait for refractory hemodynamics",
    sections:[
      { label:"Immediate Steps", color:T.orange, items:["12-lead EKG, continuous monitoring — bradycardia, AV block, wide complex","IV x2, BMP (glucose), cardiac monitor","Transcutaneous pacer at bedside — transvenous for complete heart block","BGL monitoring q30min during HDI"] },
      { label:"First-Line Treatment", color:T.teal, items:["Calcium gluconate 3g IV (CaCl 1g IV) over 5 min — repeat x3 prn","HDI: regular insulin 1 unit/kg IV bolus + D50 1 amp — infusion 0.5-1 unit/kg/hr","Dextrose 0.5 g/kg/hr — maintain glucose 100-250 mg/dL","Vasopressors: norepinephrine or vasopressin for persistent hypotension"] },
      { label:"Salvage Therapies", color:T.red, items:["Intralipid 20%: 1.5 mL/kg bolus for arrest or peri-arrest","Glucagon 3-10 mg IV bolus as bridge (vomiting risk — protect airway)","ECMO / VA-ECMO for refractory cardiovascular collapse","Contact poison control and toxicology early — CCB OD has high mortality"] },
    ],
    pearl:"Dihydropyridines (amlodipine, nifedipine): vasodilation + reflex tachycardia. Non-dihydropyridines (diltiazem, verapamil): bradycardia + AV block. HDI improves myocardial metabolism — start early." },
  { id:"sympathomimetic", name:"Sympathomimetic Toxidrome", icon:"⚡", color:T.red,
    alert:"Hyperthermia is the primary killer — aggressive cooling and benzodiazepines are the core treatment",
    sections:[
      { label:"Recognition", color:T.red, items:["Mydriasis, tachycardia, hypertension, diaphoresis, hyperthermia","Agitation, psychosis, seizures — hallmarks of severe toxicity","Agents: cocaine, methamphetamine, MDMA, amphetamines, bath salts (cathinones)","MDMA: add hyponatremia risk (water intoxication) and hyperthermia"] },
      { label:"Treatment Ladder", color:T.orange, items:["BZD first: lorazepam 2-4 mg IV or diazepam 5-10 mg IV — titrate to sedation","Active cooling for temperature >39C: evaporative cooling, ice packs, cooling blankets","Additional agitation: haloperidol 5 mg IV (not first-line — lowers seizure threshold)","Hypertension: BZD alone usually sufficient — avoid pure beta-blockers (see Pearl)","Seizures: BZD, then phenobarbital — avoid phenytoin"] },
      { label:"Cocaine-Specific", color:T.coral, items:["Chest pain: treat as STEMI mimic — nitroglycerin + BZD; aspirin if ACS suspected","AVOID beta-blockers: unopposed alpha causes severe coronary spasm and hypertension","Wide-complex tachycardia: sodium bicarbonate 1-2 mEq/kg if cocaine-induced Na+ channel blockade","Hyperthermia >40C: aggressive cooling — major cause of death","Rhabdomyolysis: aggressive IVF — target urine output 1-3 mL/kg/hr"] },
      { label:"MDMA / Ecstasy", color:T.purple, items:["Hyponatremia: from SIADH + hypotonic fluid ingestion — check Na+ early","Symptomatic hyponatremia: hypertonic saline 100 mL 3% over 10 min (if seizure/coma)","Serotonin syndrome overlap: clonus + hyperreflexia — treat with cyproheptadine","Hyperthermia: aggressive cooling — direct cause of death in MDMA fatalities"] },
    ],
    pearl:"NEVER give beta-blockers for cocaine-induced hypertension or chest pain — unopposed alpha agonism causes severe coronary vasospasm and refractory hypertension. BZD + cooling is the cornerstone of all sympathomimetic toxicity." },
  { id:"alcohol_withdrawal", name:"Alcohol / Sedative Withdrawal", icon:"🍺", color:T.gold,
    alert:"Delirium tremens has 5-15% mortality untreated — aggressive BZD loading is life-saving",
    sections:[
      { label:"CIWA-Ar Thresholds", color:T.gold, items:["CIWA-Ar <8: mild — oral BZD prn, monitor q4-8h","CIWA-Ar 8-15: moderate — lorazepam 1-2 mg IV/IM or diazepam 5-10 mg PO/IV q4-6h prn","CIWA-Ar >15: severe — BZD loading protocol, ICU consideration","Seizure or DT: benzodiazepine IV bolus immediately, escalate rapidly","CIWA-Ar not reliable in cognitively impaired or sedated — use fixed-dose schedule"] },
      { label:"Treatment", color:T.orange, items:["Thiamine 100-500 mg IV BEFORE glucose — prevents Wernicke's encephalopathy","Lorazepam 2-4 mg IV q15-30 min or diazepam 5-20 mg IV q5-10 min for active seizures","Phenobarbital 10-15 mg/kg IV (200 mg/min max) for BZD-refractory withdrawal","Symptom-triggered vs fixed-dose BZD both acceptable — fixed preferred if unreliable history","IV fluids + electrolyte repletion: Mg2+, K+, phosphate are typically depleted"] },
      { label:"Wernicke's Prophylaxis", color:T.teal, items:["Give thiamine 100-500 mg IV in ALL alcohol-dependent patients — BEFORE dextrose","Wernicke's triad: confusion, ataxia, ophthalmoplegia — only 10% present with all 3","Treatment dose (suspected Wernicke's): thiamine 500 mg IV TID x3 days","Do NOT give glucose before thiamine — precipitates acute Wernicke's"] },
      { label:"BZD Withdrawal", color:T.blue, items:["Similar presentation to alcohol withdrawal — life-threatening seizures and DT possible","Cross-tolerant: treat with long-acting BZD (diazepam) or phenobarbital","Do NOT abruptly stop therapeutic benzodiazepines — taper over weeks","Phenobarbital 10-15 mg/kg IV for severe BZD withdrawal refractory to BZDs"] },
    ],
    pearl:"Thiamine BEFORE glucose is a hard rule — not a suggestion. In alcohol-dependent patients, IV dextrose without prior thiamine can precipitate Wernicke's encephalopathy acutely. Phenobarbital loading is increasingly preferred at many centers for severe alcohol withdrawal — single agent, long duration, no tolerance ceiling." },
  { id:"lithium", name:"Lithium Toxicity", icon:"🔋", color:T.blue,
    alert:"Serum level does NOT reliably predict toxicity — chronic toxicity is more dangerous at lower levels than acute",
    sections:[
      { label:"Acute vs Chronic — Critical Distinction", color:T.blue, items:["Acute OD (no chronic use): high serum level, lower CNS toxicity — GI symptoms predominate","Chronic toxicity: lower serum level, severe CNS toxicity — most dangerous presentation","Acute-on-chronic: both elevated level AND severe CNS toxicity","Therapeutic range: 0.6-1.2 mEq/L; toxic: >1.5; severe: >2.0 (lower threshold in chronic)"] },
      { label:"Clinical Features", color:T.coral, items:["Mild: tremor, nausea, vomiting, diarrhea, polyuria","Moderate: coarse tremor, ataxia, confusion, drowsiness, muscle twitching","Severe: seizures, coma, dysrhythmia, hypotension — SILENT PERIOD then delayed worsening","Post-resolution: neurologic sequelae can persist weeks (SILENT syndrome)"] },
      { label:"Treatment", color:T.orange, items:["Aggressive IVF with NS — volume restores GDR (sodium depletion worsens toxicity)","Sodium restriction and diuretics worsen toxicity — hold thiazides, NSAIDs, ACEi","No role for activated charcoal — lithium not adsorbed","Whole bowel irrigation for sustained-release lithium if presenting early","Hold lithium — contact prescriber"] },
      { label:"Hemodialysis Indications", color:T.red, items:["Level >4 mEq/L regardless of symptoms","Level >2.5 mEq/L with severe CNS toxicity (seizure, decreased consciousness)","Renal failure impairing elimination","Deteriorating despite IVF","Post-HD: rebound rise in level expected as Li redistributes — monitor 6h post-HD, may need repeat"] },
    ],
    pearl:"Lithium level may drop after HD but then rebound as intracellular lithium redistributes back to plasma — check level 6h post-HD. Sodium depletion is the most common precipitant of chronic toxicity: low-sodium diets, diuretics, GI losses, sweating all raise lithium levels." },
  { id:"decontamination", name:"GI Decontamination", icon:"🧹", color:T.purple,
    alert:"Decontamination is most effective within 1 hour of ingestion — call poison control to guide decisions",
    sections:[
      { label:"Activated Charcoal (AC)", color:T.purple, items:["Dose: 1 g/kg PO/NG (max 50-100 g) — most effective <1h post-ingestion","May benefit up to 2-4h for sustained-release formulations","CONTRAINDICATED: unprotected airway, ileus/obstruction, GI perforation, caustic ingestion, hydrocarbons","CONTRAINDICATED: iron, lithium, heavy metals, alcohol (not adsorbed by charcoal)","Multi-dose AC (0.5 g/kg q4h): carbamazepine, theophylline, phenobarbital, quinine, dapsone"] },
      { label:"Whole Bowel Irrigation (WBI)", color:T.teal, items:["PEG solution (GoLytely) 2 L/hr adult (25-40 mL/kg/hr peds) via NG until effluent clear","Indications: iron, lithium, zinc, sustained-release meds, body packers","Stop when rectal effluent runs clear","CONTRAINDICATED: ileus, perforation, unprotected airway, hemodynamic instability","Can use WITH activated charcoal for sustained-release meds"] },
      { label:"Gastric Lavage", color:T.orange, items:["Rarely recommended — only consider within 60 min of life-threatening ingestion","Requires intubation if AMS — aspiration risk","Large-bore OG tube (36-40 Fr adult) — irrigate with NS until clear","CONTRAINDICATED: caustics, hydrocarbons, sharp objects, hemodynamic instability","Evidence for improved outcomes is limited — poison control consultation before use"] },
      { label:"What NOT to Induce", color:T.red, items:["Syrup of ipecac: NO LONGER RECOMMENDED — no evidence of benefit, delays AC","Cathartics (sorbitol, magnesium citrate): no added benefit — fluid/electrolyte risk","Dilution (water/milk for caustics): controversial — limited evidence; do not induce vomiting","Call poison control (1-800-222-1222) before any decontamination decision"] },
    ],
    pearl:"Activated charcoal has the best evidence and widest applicability — when in doubt, charcoal. The biggest mistake is not using it within the first hour for a clearly toxic ingestion. Most decontamination decisions should be made in consultation with poison control." },
  { id:"co", name:"Carbon Monoxide Poisoning", icon:"💨", color:T.blue,
    alert:"ACEP 2025 Level C: selected patients may benefit from HBO2 based on severity and availability — not contraindicated, evidence insufficient for routine use",
    sections:[
      { label:"Immediate Management", color:T.blue, items:["100% O2 via NRB mask IMMEDIATELY — do not wait for COHgb level","Remove from CO source — decontamination is treatment","IV access, cardiac monitor, 12-lead EKG — CO causes myocardial injury","Co-oximetry for COHgb — pulse ox unreliable (reads COHgb as oxyhemoglobin)","BMP, lactate, troponin, CBC, ABG","ACEP Level B: do NOT use pulse CO-oximetry alone — co-oximetry required"] },
      { label:"COHgb Thresholds / HBO2", color:T.teal, items:["COHgb >25%: severe — HBO2 consultation","COHgb >15% + neurologic symptoms: HBO2 consultation","COHgb >15% + cardiovascular involvement: HBO2 consultation","Pregnancy: lower threshold — COHgb >15% or any symptoms","COHgb correlates poorly with severity — use clinical picture, not level alone"] },
      { label:"ACEP 2025 Level C Recommendation", color:T.gold, items:["In symptomatic CO poisoning, selected patients may benefit from HBO2 based on severity and availability (distance and time)","All 4 qualifying studies were Class III evidence — no new Class I or II data since 2017","May provide modest benefit for memory outcomes — evidence inconsistent across RCTs","Only a small proportion of HBO2 centers can treat high-acuity patients — transport risk","Normobaric 100% O2 x5-6 hours remains standard of care for most patients"] },
      { label:"Disposition + DNS Risk Factors", color:T.orange, items:["Mild (COHgb <15%, headache only): 6h observation, discharge if asymptomatic","Moderate (COHgb 15-25% or neurologic symptoms): admission","Severe (LOC, seizure, cardiac): ICU + HBO2 consultation","DNS risk: age >=36, COHgb >=25%, exposure >=24h, LOC, low GCS — closer follow-up","DNS onset 3-240 days: personality change, memory loss, Parkinson-like syndrome","Identify and secure source — do NOT return to contaminated environment"] },
    ],
    pearl:"Pulse oximetry reads COHgb as oxyhemoglobin — SpO2 99% with COHgb 40% is possible. ACEP 2025 Level C means selective HBO2 is appropriate, not that it is ineffective — evidence is insufficient to mandate or prohibit it." },
  { id:"opioid", name:"Opioid Toxidrome", icon:"💤", color:T.purple,
    alert:"Fentanyl/xylazine (tranq dope): naloxone reverses opioid only — xylazine sedation persists. Nitazenes: may require very high naloxone doses.",
    sections:[
      { label:"Immediate Steps", color:T.purple, items:["Airway — BVM if apneic before naloxone","Naloxone 0.4-2 mg IV/IM/IN — titrate to respirations, not full reversal","Do not fully reverse in opioid-tolerant patients — precipitates acute withdrawal","ACLS if cardiac arrest — naloxone + CPR simultaneously","Xylazine (tranq): naloxone reverses fentanyl component — xylazine sedation/bradycardia persists; supportive care + look for skin wounds"] },
      { label:"Specific Agents / Emerging Threats", color:T.blue, items:["Buprenorphine: partial agonist — requires 4-8+ mg naloxone, may be partially reversible","Methadone: long half-life (24-36h) — prolonged monitoring after naloxone","Fentanyl/carfentanil: extreme potency — multiple high-dose naloxone, low threshold to intubate","Nitazenes (isotonitazene, metonitazene): potency exceeds fentanyl — may require 10+ mg naloxone; escalate early","Xylazine (alpha-2 agonist): no antidote — identify by characteristic skin wounds"] },
      { label:"Monitoring / Disposition", color:T.gold, items:["Observe >=4-6h after last naloxone dose for resedation","Naloxone infusion: 2/3 of reversal dose per hour in D5W for long-acting opioids","Methadone ingestion: 12-24h monitoring minimum","Prescribe take-home naloxone at discharge — ACEP/ACMT standard"] },
      { label:"ED Buprenorphine — Standard of Care", color:T.teal, items:["Offer buprenorphine to all opioid OD patients — ACEP/ACMT endorse ED initiation","COWS >=8: buprenorphine 4-8 mg SL. No X-waiver required as of 2023","Fentanyl users: wait 12-24h or high-dose induction (16-24 mg) to avoid precipitated withdrawal","Link to same-day bridge clinic, MAT program, or peer recovery specialist"] },
    ],
    pearl:"Titrate naloxone to RR of 12, not to GCS 15. Xylazine: look for skin ulcers at injection sites AND distant locations — hallmark of tranq use. Nitazenes are emerging — if response to standard naloxone doses is inadequate, escalate dose aggressively before attributing to tolerance." },
  { id:"serotonin", name:"Serotonin Syndrome", icon:"🌡️", color:T.red,
    alert:"Hunter Criteria: clonus is key — check for inducible and spontaneous clonus",
    sections:[
      { label:"Hunter Criteria (ANY of):", color:T.red, items:["Spontaneous clonus","Inducible clonus + agitation or diaphoresis","Ocular clonus + agitation or diaphoresis","Tremor + hyperreflexia","Hypertonia + temperature >38C + ocular or inducible clonus"] },
      { label:"Treatment", color:T.orange, items:["Discontinue all serotonergic agents immediately","Cyproheptadine 12 mg PO/NG load, then 2 mg q2h prn (max 32 mg/day) — 5-HT2A antagonist","BZD liberally for agitation, seizures, muscle rigidity","Aggressive cooling for hyperthermia >41.1C — paralysis + intubation if needed","Avoid physical restraints — worsen hyperthermia and acidosis"] },
      { label:"Common Causative Combinations", color:T.purple, items:["SSRI/SNRI + tramadol (very common — tramadol has serotonergic properties)","SSRI + linezolid (antibiotic with MAO inhibition)","SSRI + triptans, methylene blue, or fentanyl","MAOI + any serotonergic agent — most severe cases"] },
    ],
    pearl:"SS vs NMS: SS has hyperreflexia + clonus + rapid onset (hours); NMS has lead-pipe rigidity + bradyreflexia + gradual onset (days) after antipsychotic exposure. Both are emergencies with different treatments." },
  { id:"nms", name:"Neuroleptic Malignant Syndrome", icon:"🧠", color:T.blue,
    alert:"NMS can be fatal — ICU admission, stop all antipsychotics immediately",
    sections:[
      { label:"Diagnosis (all 4 features)", color:T.blue, items:["Hyperthermia (>38C on two occasions)","Rigidity ('lead-pipe' — different from SS clonus)","Altered mental status","Autonomic instability (labile BP, diaphoresis, tachycardia)"] },
      { label:"Treatment", color:T.orange, items:["Stop ALL antipsychotics and dopamine-blocking agents immediately","Aggressive cooling — evaporative cooling, ice packs, cooling blankets","Dantrolene 1-2.5 mg/kg IV q6h for severe rigidity or hyperthermia","Bromocriptine 2.5 mg PO/NG TID (dopamine agonist) for mild cases","BZD for agitation; avoid physical restraints"] },
      { label:"Complications", color:T.red, items:["CK levels q6-8h — rhabdomyolysis risk, aggressive IVF","BMP — AKI from myoglobinuria, hyperkalemia","ICU course — days to weeks for resolution","Mortality without treatment: 10-20%"] },
    ],
    pearl:"NMS onset is days after starting/increasing antipsychotic. SS onset is hours after drug combination. NMS = rigidity + bradyreflexia; SS = clonus + hyperreflexia." },
  { id:"cholinergic", name:"Organophosphate / Cholinergic", icon:"☠️", color:T.green,
    alert:"SLUDGE = cholinergic toxidrome — atropine first, no ceiling dose",
    sections:[
      { label:"Toxidrome (SLUDGE)", color:T.green, items:["Salivation, Lacrimation, Urination, Defecation, GI cramps, Emesis","Bradycardia, bronchorrhea, bronchospasm — the life-threatening triad","Miosis (pinpoint pupils) — highly characteristic","Muscle weakness, fasciculations, paralysis — nicotinic effects"] },
      { label:"Treatment", color:T.orange, items:["Remove contaminated clothing, decontaminate skin (PPE for staff)","Atropine 2-4 mg IV q5-10 min — titrate to DRY secretions (not heart rate)","Pralidoxime (2-PAM) 1-2g IV over 30 min with atropine — for organophosphates only","BZD for seizures","Succinylcholine: CONTRAINDICATED (pseudocholinesterase inhibition = prolonged paralysis)"] },
      { label:"Sources", color:T.blue, items:["Pesticides (malathion, parathion) — most common worldwide","Nerve agents (sarin, VX, novichok) — mass casualty","Carbamates (aldicarb, carbaryl) — similar but no pralidoxime","Some mushrooms (Clitocybe, Inocybe species)"] },
    ],
    pearl:"Military auto-injectors: atropine 2 mg + pralidoxime 600 mg IM (DuoDote). Atropine endpoint is always DRY secretions — not heart rate." },
  { id:"anticholinergic", name:"Anticholinergic Toxidrome", icon:"🪶", color:T.gold,
    alert:"Hot, dry, blind, mad, red, full — physostigmine ONLY if pure anticholinergic, TCA = fatal",
    sections:[
      { label:"Recognition", color:T.gold, items:["Hot as a hare, Dry as a bone, Blind as a bat, Mad as a hatter, Red as a beet, Full as a flask","Hyperthermia, dry skin/mucous membranes, mydriasis, delirium, flushing, urinary retention"] },
      { label:"Sources", color:T.orange, items:["Diphenhydramine (Benadryl) — most common in OD","TCAs — MIXED picture, physostigmine CONTRAINDICATED","Atropine, scopolamine, ipratropium","Jimsonweed (Datura stramonium), deadly nightshade"] },
      { label:"Treatment", color:T.teal, items:["Supportive: IVF, cooling, BZD for agitation — first line","Physostigmine 1-2 mg IV over 5 min for PURE anticholinergic (no TCA)","Foley for urinary retention, cool environment for hyperthermia","Avoid restraints — worsen hyperthermia"] },
    ],
    pearl:"Never give physostigmine without ruling out TCA — check QRS width and R in aVR. BZD are safe for all anticholinergic agitation." },
  { id:"salicylate", name:"Salicylate Toxicity", icon:"🌡️", color:T.coral,
    alert:"Mixed respiratory alkalosis + anion gap metabolic acidosis = salicylate until proven otherwise",
    sections:[
      { label:"Immediate Steps", color:T.coral, items:["Salicylate level (toxic >30; severe >80-100 mg/dL)","ABG — classic: respiratory alkalosis + metabolic acidosis","BMP: glucose (hypoglycemia), K+ (hypokalemia worsens toxicity)","Serial levels q2h — may rise with enteric-coated aspirin"] },
      { label:"Treatment", color:T.orange, items:["Sodium bicarb infusion: target urine pH 7.5-8.0 (traps ionized salicylate)","Maintain serum pH 7.45-7.55 — do NOT intubate unless absolutely necessary","Aggressive fluid + K+ replacement — hypokalemia prevents urine alkalinization","Dextrose even if euglycemic — CNS glucose depletion despite normal serum level"] },
      { label:"Hemodialysis Indications", color:T.red, items:["Level >100 mg/dL (acute) or >60 mg/dL (chronic)","Renal failure preventing elimination","Severe CNS symptoms: seizures, coma, AMS","Pulmonary edema or hemodynamic instability"] },
    ],
    pearl:"NEVER intubate a spontaneously breathing salicylate patient without immediately achieving hyperventilation on the vent (pH 7.45+). Loss of spontaneous respiratory alkalosis in a ventilated patient is rapidly fatal." },
  { id:"methanol_eg", name:"Methanol / Ethylene Glycol", icon:"🧪", color:T.cyan,
    alert:"High anion gap + high osmol gap + visual symptoms = methanol until proven otherwise",
    sections:[
      { label:"Distinguishing Features", color:T.cyan, items:["Methanol: visual disturbance, blurry vision, scotoma, blindness — fundus disc hyperemia","Ethylene glycol: flank pain, calcium oxalate crystals in urine, renal failure","Both: elevated anion gap metabolic acidosis, elevated osmol gap early","Osmol gap = measured - calculated; >10 suggests toxic alcohol"] },
      { label:"Treatment", color:T.orange, items:["Fomepizole 15 mg/kg IV loading dose — first-line, give empirically","Ethanol infusion if fomepizole unavailable: target level 100-150 mg/dL","HD for: level >50 mg/dL, severe acidosis pH <7.2, visual symptoms","Folate 50 mg IV q4h (methanol) — cofactor for formate metabolism","Thiamine 100 mg IV + pyridoxine for ethylene glycol"] },
      { label:"Do Not Miss", color:T.red, items:["Osmol gap is NORMAL late — metabolites already formed","Closing osmol gap + rising anion gap = metabolic conversion — do not reassure","Methanol: optic nerve damage is irreversible — early fomepizole is vision-preserving","Ethanol raises osmol gap independently — confounds calculation"] },
    ],
    pearl:"Osmol gap is high EARLY (parent compound) and anion gap is high LATE (toxic metabolites). Normal osmol gap + high anion gap acidosis = late-presenting methanol or EG — do not be falsely reassured." },
  { id:"xylazine", name:"Xylazine / Tranq Dope", icon:"🩹", color:T.red,
    alert:"Naloxone does NOT reverse xylazine — it reverses the fentanyl co-component only. Xylazine sedation requires supportive care.",
    sections:[
      { label:"Recognition", color:T.red, items:["Xylazine is an alpha-2 adrenergic agonist veterinary sedative — not FDA approved for humans","Fentanyl/xylazine ('tranq dope') now present in most urban illicit opioid supply","Prolonged sedation beyond expected naloxone reversal, bradycardia, hypotension","Characteristic skin wounds: partial/full-thickness ulcers at injection sites AND distant locations","Medetomidine (more potent alpha-2 agonist) increasingly replacing xylazine in some markets — produces more severe withdrawal, ICU admission rate 91% in one series"] },
      { label:"Acute Management", color:T.orange, items:["Airway and ventilatory support — primary intervention","Naloxone for opioid component — standard doses; sedation may persist after reversal","Supportive: IVF for hypotension, cardiac monitor for bradycardia, warming","End-tidal CO2 monitoring preferred for respiratory monitoring","No antidote for xylazine or medetomidine — time and supportive care"] },
      { label:"Wound Assessment (Philadelphia 2024 Consensus)", color:T.gold, items:["Stage 1 (mild): superficial partial/full-thickness, no exposed tendon/muscle — wound care","Stage 2 (moderate): full-thickness, exposed/compromised tendon/muscle — surgery consult","Stage 3A: severe with preserved limb function — reconstruction possible","Stage 3B: severe without preserved function — amputation discussion","Culture wounds: Staph aureus predominant; saline irrigation, non-cytotoxic cleansers","Wounds heal better than comparably-sized wounds from other causes — conservative approach first"] },
      { label:"Disposition / Harm Reduction", color:T.teal, items:["Offer buprenorphine (high-dose induction often needed for fentanyl/xylazine)","Prescribe naloxone at discharge — reverses fentanyl component even if not xylazine","Wound care referral — multidisciplinary: addiction medicine, surgery if needed","Counsel: fentanyl/xylazine/medetomidine test strips; never use alone; 1-800-484-3731"] },
    ],
    pearl:"Xylazine and medetomidine both cause alpha-2 mediated sedation with no antidote. Philadelphia consensus (Nov 2024): addiction management + conservative wound care before surgical reconstruction. Xylazine wounds tend to heal better than expected — do not default to amputation prematurely." },
];

// ── TOXIDROMES ─────────────────────────────────────────────────────────────────
const TOXIDROMES = [
  { name:"Opioid",            color:T.purple, pupils:"Miosis (pinpoint)", ms:"Sedation / coma",         vitals:"Bradycardia, hypotension, bradypnea",     skin:"Normal",       other:"Respiratory depression, decreased bowel sounds",  treatment:"Naloxone" },
  { name:"Sympathomimetic",   color:T.red,    pupils:"Mydriasis",         ms:"Agitation, psychosis",    vitals:"Tachycardia, hypertension, hyperthermia",  skin:"Diaphoretic",  other:"Tremor, seizures, rhabdomyolysis",                 treatment:"BZD, cooling — NO beta-blockers in cocaine" },
  { name:"Cholinergic",       color:T.green,  pupils:"Miosis",            ms:"Agitation then sedation", vitals:"Bradycardia, bronchorrhea, bronchospasm",  skin:"Diaphoretic",  other:"SLUDGE, fasciculations, urination",                treatment:"Atropine, pralidoxime" },
  { name:"Anticholinergic",   color:T.gold,   pupils:"Mydriasis",         ms:"Delirium, hallucinations",vitals:"Tachycardia, hyperthermia",                skin:"Dry, flushed", other:"Urinary retention, decreased bowel sounds",        treatment:"BZD, physostigmine (pure only)" },
  { name:"Sedative-Hypnotic", color:T.blue,   pupils:"Normal or miosis",  ms:"Sedation, ataxia",        vitals:"Normal or mild bradycardia",               skin:"Normal",       other:"Slurred speech, nystagmus, hypothermia",           treatment:"Supportive, flumazenil (BZD only, caution)" },
  { name:"Serotonin Syndrome",color:T.coral,  pupils:"Mydriasis",         ms:"Agitation, confusion",    vitals:"Tachycardia, hyperthermia",                skin:"Diaphoretic",  other:"Clonus, hyperreflexia, tremor, diarrhea",          treatment:"Cyproheptadine, BZD, cooling" },
  { name:"Cardiac Toxicology",color:T.orange, pupils:"Variable",          ms:"Variable",                vitals:"Brady/tachydysrhythmia, QRS/QTc changes",  skin:"Diaphoretic",  other:"Wide-QRS (Na+ channel block), QTc prolongation, TdP", treatment:"See pearl row below" },
];
const CARDIAC_TOX_PEARL = "Wide QRS tachycardia from Na+ channel block (TCA, cocaine, flecainide): sodium bicarbonate 1-2 mEq/kg IV. Drug-induced torsades (QTc drugs): magnesium 2 g IV, isoproterenol for bradycardia-dependent TdP, avoid amiodarone. Digoxin dysrhythmia: digibind. Cocaine VT: bicarbonate + lidocaine (avoid amiodarone). Bradycardia from CCB/BB: calcium + HDI.";

// ── RUMACK-MATTHEW ─────────────────────────────────────────────────────────────
const RM_LINE = [[4,150],[5,120],[6,99],[7,83],[8,70],[9,60],[10,51],[11,44],[12,38],[13,32],[14,28],[15,24],[16,21],[17,18],[18,16],[19,14],[20,12],[21,10],[22,9],[23,8],[24,7]];
function rmTreatmentThreshold(hours) {
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

// ── DOSE CALCULATOR DATA ───────────────────────────────────────────────────────
const DOSE_CALCS = [
  { id:"nac", label:"NAC — Acetaminophen", color:T.teal,
    rows: w => [
      { label:"3-Bag: Bag 1 (150 mg/kg over 60 min)", val:(w*150).toFixed(0)+" mg", sub:"in 200 mL D5W" },
      { label:"3-Bag: Bag 2 (50 mg/kg over 4h)", val:(w*50).toFixed(0)+" mg", sub:"in 500 mL D5W" },
      { label:"3-Bag: Bag 3 (100 mg/kg over 16h)", val:(w*100).toFixed(0)+" mg", sub:"in 1000 mL D5W" },
      { label:"2-Bag: Bag 1 (200 mg/kg over 4h)", val:(w*200).toFixed(0)+" mg", sub:"in 500 mL D5W" },
      { label:"2-Bag: Bag 2 (100 mg/kg over 16h)", val:(w*100).toFixed(0)+" mg", sub:"in 1000 mL D5W" },
    ]},
  { id:"naloxone", label:"Naloxone Infusion", color:T.green,
    rows: w => [
      { label:"Reversal dose (typical starting)", val:"0.4 – 2 mg IV", sub:"not weight-based — titrate to respirations" },
      { label:"Infusion example (0.004 mg/kg/hr)", val:(w*0.004).toFixed(3)+" mg/hr", sub:"2/3 of effective reversal dose per hour" },
    ]},
  { id:"fomepizole", label:"Fomepizole (Methanol / EG)", color:T.cyan,
    rows: w => [
      { label:"Loading dose (15 mg/kg IV over 30 min)", val:(w*15).toFixed(0)+" mg", sub:"in 100 mL NS or D5W" },
      { label:"Maintenance doses 1-4 (10 mg/kg q12h)", val:(w*10).toFixed(0)+" mg q12h", sub:"in 100 mL NS or D5W" },
      { label:"Maintenance dose 5+ (15 mg/kg q12h)", val:(w*15).toFixed(0)+" mg q12h", sub:"in 100 mL NS or D5W — if dialysis: q4h during HD" },
    ]},
  { id:"atropine", label:"Atropine (Organophosphate)", color:T.orange,
    rows: w => [
      { label:"Initial dose (adult fixed)", val:"2 – 4 mg IV", sub:"no ceiling — titrate to dry secretions" },
      { label:"Peds initial (0.02-0.05 mg/kg)", val:(w*0.02).toFixed(2)+" – "+(w*0.05).toFixed(2)+" mg", sub:"min 0.1 mg, no ceiling in severe toxidrome" },
      { label:"May require total", val:"> 20 mg (sometimes 100s)", sub:"endpoint = dry secretions + clear breath sounds" },
    ]},
  { id:"methblue", label:"Methylene Blue (MetHb)", color:T.blue,
    rows: w => [
      { label:"Dose 1 (1-2 mg/kg IV over 5 min)", val:(w*1).toFixed(1)+" – "+(w*2).toFixed(1)+" mg", sub:"diluted in 50 mL NS or D5W" },
      { label:"Repeat dose if needed (1 mg/kg)", val:(w*1).toFixed(1)+" mg", sub:"at 1 hour if response inadequate" },
      { label:"Max total dose", val:(w*7).toFixed(1)+" mg (7 mg/kg)", sub:"doses above this may paradoxically cause MetHb" },
    ]},
  { id:"digibind", label:"Digoxin Fab (Digibind)", color:T.blue,
    custom: true,
    inputs:["level","wt"],
    rows: (w, level) => {
      const byLevel = level && w ? Math.ceil((parseFloat(level) * parseFloat(w)) / 100) : null;
      return [
        { label:"Empiric — acute OD", val:"10 – 20 vials IV", sub:"life-threatening dysrhythmia or hemodynamic instability" },
        { label:"Empiric — chronic toxicity", val:"1 – 6 vials IV", sub:"lower doses for chronic, renal failure patients" },
        { label:byLevel ? "Calculated (level x weight / 100)" : "Calculated (enter level + weight above)", val:byLevel ? byLevel+" vials" : "—", sub:byLevel ? "Level "+level+" ng/mL x "+w+" kg / 100" : "serum level (ng/mL) and weight required" },
      ];
    }},
  { id:"hydroxocob", label:"Hydroxocobalamin (Cyanide)", color:T.red,
    rows: w => [
      { label:"Adult dose (fixed)", val:"5 g IV over 15 min", sub:"repeat 5 g if unstable, max 15 g" },
      { label:"Peds dose (70 mg/kg)", val:(w*70).toFixed(0)+" mg", sub:"over 15 min; repeat if unstable" },
    ]},
];

// ── SUB-COMPONENTS ─────────────────────────────────────────────────────────────
function Bullet({ text, color }) {
  return (
    <div style={{ display:"flex",gap:6,alignItems:"flex-start",marginBottom:3 }}>
      <span style={{ color:color||T.teal,fontSize:7,marginTop:3,flexShrink:0 }}>▸</span>
      <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.txt3,lineHeight:1.55 }}>{text}</span>
    </div>
  );
}

function AntidoteCard({ a, focused, expanded, onToggle }) {
  const urgCol  = a.urgency === "immediate" ? T.red : a.urgency === "caution" ? T.gold : T.orange;
  const evidCol = EVID_COLOR[a.evidence] || T.txt4;
  return (
    <div onClick={onToggle}
      style={{ marginBottom:4,borderRadius:10,overflow:"hidden",cursor:"pointer",
        border:`1px solid ${focused ? a.color+"88" : expanded ? a.color+"55" : "rgba(26,53,85,0.4)"}`,
        borderLeft:`3px solid ${a.color}`,outline:focused ? "2px solid "+a.color+"55" : "none",outlineOffset:1 }}>
      <div style={{ display:"flex",alignItems:"center",gap:10,padding:"9px 12px",background:`linear-gradient(135deg,${a.color}09,rgba(8,22,40,0.9))` }}>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex",alignItems:"center",gap:6,flexWrap:"wrap" }}>
            <span style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:13,color:a.color }}>{a.antidote}</span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:urgCol,letterSpacing:1,textTransform:"uppercase",background:`${urgCol}12`,border:`1px solid ${urgCol}35`,borderRadius:4,padding:"1px 6px" }}>{a.urgency}</span>
            {a.evidence && <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:evidCol,letterSpacing:0.8,textTransform:"uppercase",background:`${evidCol}12`,border:`1px solid ${evidCol}35`,borderRadius:4,padding:"1px 6px" }}>{a.evidence}</span>}
          </div>
          {!expanded && a.quickDose && <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:10,fontWeight:600,color:a.color,marginTop:3,lineHeight:1.4 }}>{a.quickDose}</div>}
          <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.txt4,marginTop:2 }}>{a.toxin}</div>
        </div>
        <span style={{ fontSize:10,color:T.txt4 }}>{expanded ? "▲" : "▼"}</span>
      </div>
      {expanded && (
        <div style={{ padding:"10px 12px",borderTop:"1px solid rgba(26,53,85,0.3)" }}>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8 }}>
            {[{ label:"Route",val:a.route,color:T.blue },{ label:"Dosing",val:a.dosing,color:a.color },{ label:"Timing",val:a.timing,color:T.gold }].map(f => (
              <div key={f.label} style={{ padding:"7px 9px",borderRadius:7,background:`${f.color}08`,border:`1px solid ${f.color}22`,gridColumn:f.label==="Dosing"?"1/-1":"auto" }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:f.color,letterSpacing:1,textTransform:"uppercase",marginBottom:4 }}>{f.label}</div>
                <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.txt2,lineHeight:1.6 }}>{f.val}</div>
              </div>
            ))}
          </div>
          <div style={{ padding:"7px 10px",borderRadius:7,background:`${T.purple}08`,border:`1px solid ${T.purple}22` }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.purple,letterSpacing:1,textTransform:"uppercase" }}>Pearl: </span>
            <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.txt2 }}>{a.pearls}</span>
          </div>
          {a.peds && (
            <div style={{ padding:"6px 10px",borderRadius:7,marginTop:6,background:`${T.teal}08`,border:`1px solid ${T.teal}22` }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.teal,letterSpacing:1,textTransform:"uppercase" }}>Peds: </span>
              <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.txt2 }}>{a.peds}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ProtocolCard({ proto, focused, expanded, onToggle }) {
  return (
    <div onClick={onToggle}
      style={{ marginBottom:4,borderRadius:10,overflow:"hidden",cursor:"pointer",
        border:`1px solid ${focused ? proto.color+"88" : expanded ? proto.color+"55" : "rgba(26,53,85,0.4)"}`,
        borderTop:`3px solid ${proto.color}`,outline:focused ? "2px solid "+proto.color+"55" : "none",outlineOffset:1 }}>
      <div style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:`linear-gradient(135deg,${proto.color}0a,rgba(8,22,40,0.92))` }}>
        <span style={{ fontSize:18 }}>{proto.icon}</span>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:13,color:proto.color }}>{proto.name}</div>
          {!expanded && <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.txt4,marginTop:1 }}>{proto.alert}</div>}
        </div>
        <span style={{ fontSize:10,color:T.txt4 }}>{expanded ? "▲" : "▼"}</span>
      </div>
      {expanded && (
        <div style={{ padding:"0 12px 12px" }}>
          <div style={{ padding:"7px 10px",borderRadius:7,marginBottom:10,background:`${T.red}08`,border:`1px solid ${T.red}28` }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.red,letterSpacing:1,textTransform:"uppercase" }}>Alert: </span>
            <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.txt2 }}>{proto.alert}</span>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8 }}>
            {proto.sections.map((sec, i) => (
              <div key={i} style={{ padding:"8px 10px",borderRadius:8,background:`${sec.color}08`,border:`1px solid ${sec.color}22` }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:sec.color,letterSpacing:1.3,textTransform:"uppercase",marginBottom:6,paddingBottom:4,borderBottom:`1px solid ${sec.color}22` }}>{sec.label}</div>
                {sec.items.map((item, j) => <Bullet key={j} text={item} color={sec.color} />)}
              </div>
            ))}
          </div>
          <div style={{ padding:"7px 10px",borderRadius:7,background:`${T.gold}08`,border:`1px solid ${T.gold}22` }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.gold,letterSpacing:1,textTransform:"uppercase" }}>Pearl: </span>
            <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.txt2 }}>{proto.pearl}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── DOSE CALC TAB ─────────────────────────────────────────────────────────────
function DoseCalcTab() {
  const [weight, setWeight]     = useState("");
  const [level, setLevel]       = useState("");
  const [selectedId, setSelectedId] = useState("nac");
  const [inputActive, setInputActive] = useState(false);
  const panelRef = useRef(null);
  const weightRef = useRef(null);
  const levelRef  = useRef(null);

  useEffect(() => { panelRef.current?.focus(); }, []);

  const sel = DOSE_CALCS.findIndex(d => d.id === selectedId);
  const handleKey = useCallback((e) => {
    if (inputActive) { if (e.key === "Escape") { setInputActive(false); panelRef.current?.focus(); } return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedId(DOSE_CALCS[Math.min(sel+1,DOSE_CALCS.length-1)].id); return; }
    if (e.key === "ArrowUp")   { e.preventDefault(); setSelectedId(DOSE_CALCS[Math.max(sel-1,0)].id); return; }
    if (e.key === "w" || e.key === "W") { e.preventDefault(); setInputActive(true); weightRef.current?.focus(); }
    if (e.key === "l" || e.key === "L") { e.preventDefault(); setInputActive(true); levelRef.current?.focus(); }
  }, [inputActive, sel]);

  const w   = parseFloat(weight) || 0;
  const lv  = parseFloat(level) || 0;
  const calc = DOSE_CALCS.find(d => d.id === selectedId);
  const rows = calc && w > 0 ? (calc.custom ? calc.rows(w, lv || null) : calc.rows(w)) : null;

  const inputStyle = { ...{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,color:"#e8edf5",fontSize:18,fontWeight:700,padding:"8px 12px",outline:"none",fontFamily:"'JetBrains Mono',monospace",width:"100%"} };

  return (
    <div>
      <div style={{ marginBottom:14,padding:"10px 14px",borderRadius:10,background:"rgba(20,184,166,0.06)",border:"1px solid rgba(20,184,166,0.2)" }}>
        <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.txt4,letterSpacing:1.5,textTransform:"uppercase",marginBottom:4 }}>Patient Weight · press W</div>
        <div style={{ display:"flex",gap:10,flexWrap:"wrap" }}>
          <div style={{ flex:"0 0 130px" }}>
            <input ref={weightRef} style={inputStyle} value={weight} onChange={e => setWeight(e.target.value)}
              onFocus={() => setInputActive(true)} onBlur={() => { setInputActive(false); setTimeout(() => panelRef.current?.focus(), 50); }}
              placeholder="kg" />
          </div>
          {calc?.custom && (
            <div style={{ flex:"0 0 160px" }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.txt4,letterSpacing:1.5,textTransform:"uppercase",marginBottom:4 }}>Dig Level (ng/mL) · press L</div>
              <input ref={levelRef} style={{ ...inputStyle,fontSize:16 }} value={level} onChange={e => setLevel(e.target.value)}
                onFocus={() => setInputActive(true)} onBlur={() => { setInputActive(false); setTimeout(() => panelRef.current?.focus(), 50); }}
                placeholder="ng/mL" />
            </div>
          )}
        </div>
      </div>

      <div ref={panelRef} tabIndex={0} onKeyDown={handleKey} style={{ outline:"none",display:"grid",gridTemplateColumns:"1fr 1.6fr",gap:12 }}>
        {/* Drug selector */}
        <div style={{ background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:10,overflow:"hidden" }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.txt4,letterSpacing:1.5,textTransform:"uppercase",padding:"8px 12px",borderBottom:"1px solid rgba(255,255,255,0.05)" }}>Select Agent</div>
          {DOSE_CALCS.map(d => (
            <div key={d.id} onClick={() => setSelectedId(d.id)}
              style={{ padding:"8px 12px",cursor:"pointer",borderBottom:"1px solid rgba(255,255,255,0.04)",
                background: d.id === selectedId ? `${d.color}15` : "transparent",
                borderLeft: d.id === selectedId ? `3px solid ${d.color}` : "3px solid transparent" }}>
              <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:d.id===selectedId?700:400,color:d.id===selectedId?d.color:T.txt3 }}>{d.label}</div>
            </div>
          ))}
        </div>

        {/* Results */}
        <div>
          {!w && <div style={{ padding:"20px",textAlign:"center",color:T.txt4,fontFamily:"'DM Sans',sans-serif",fontSize:12 }}>Enter weight to calculate doses</div>}
          {w > 0 && calc && (
            <div style={{ background:"rgba(255,255,255,0.02)",border:`1px solid ${calc.color}30`,borderRadius:10,overflow:"hidden" }}>
              <div style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:14,color:calc.color,padding:"10px 14px",borderBottom:`1px solid ${calc.color}20` }}>
                {calc.label} — {w} kg
              </div>
              {(rows || []).map((row, i) => (
                <div key={i} style={{ padding:"10px 14px",borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.txt4,letterSpacing:0.8,textTransform:"uppercase",marginBottom:3 }}>{row.label}</div>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:20,fontWeight:700,color:calc.color }}>{row.val}</div>
                  {row.sub && <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.txt4,marginTop:2 }}>{row.sub}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <KbHints hints={[
        { key:"↑ ↓", label:"select agent" },
        { key:"W", label:"weight" },
        { key:"L", label:"dig level" },
        { key:"Esc", label:"back to panel" },
      ]} />
    </div>
  );
}

// ── MAIN EXPORT ────────────────────────────────────────────────────────────────
const TABS = [
  { id:"antidotes",  label:"Antidotes",          color:T.teal   },
  { id:"protocols",  label:"Protocols",           color:T.coral  },
  { id:"dosecalc",   label:"Dose Calc",           color:T.cyan   },
  { id:"nomogram",   label:"APAP Nomogram",       color:T.orange },
  { id:"toxidromes", label:"Toxidromes",          color:T.purple },
  { id:"poison",     label:"Poison Control",      color:T.blue   },
];

export default function ToxicologyHub({ embedded = false, onBack, demo, cc, vitals }) {
  const [mainTab,     setMainTab]     = useState("antidotes");
  const [expanded,    setExpanded]    = useState(null);
  const [search,      setSearch]      = useState("");
  const [focusIdx,    setFocusIdx]    = useState(0);
  const [inputActive, setInputActive] = useState(false);
  const [apapHours,   setApapHours]   = useState("");
  const [apapLevel,   setApapLevel]   = useState("");

  const wrapRef   = useRef(null);
  const panelRef  = useRef(null);
  const searchRef = useRef(null);
  const hoursRef  = useRef(null);
  const levelRef  = useRef(null);

  useEffect(() => {
    setFocusIdx(0); setExpanded(null);
    setTimeout(() => panelRef.current?.focus(), 60);
  }, [mainTab]);

  // ⌘1-6 tab switching scoped to this component
  useEffect(() => {
    const h = (e) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (!wrapRef.current?.contains(e.target)) return;
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= TABS.length) { e.preventDefault(); setMainTab(TABS[n-1].id); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const toggle = useCallback((id) => setExpanded(p => p === id ? null : id), []);

  // Unified search — works across antidotes + protocols
  const filteredAntidotes = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return ANTIDOTES;
    return ANTIDOTES.filter(a => a.antidote.toLowerCase().includes(q) || a.toxin.toLowerCase().includes(q));
  }, [search]);

  const filteredProtocols = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return PROTOCOLS;
    return PROTOCOLS.filter(p => p.name.toLowerCase().includes(q) || p.alert.toLowerCase().includes(q));
  }, [search]);

  const groupedAntidotes = useMemo(() => {
    const groups = {};
    filteredAntidotes.forEach(a => { if (!groups[a.urgency]) groups[a.urgency] = []; groups[a.urgency].push(a); });
    return TIER_ORDER.filter(t => groups[t]?.length).map(t => ({ tier:t, items:groups[t] }));
  }, [filteredAntidotes]);

  const rmThreshold = useMemo(() => rmTreatmentThreshold(apapHours), [apapHours]);
  const apapResult  = useMemo(() => {
    const h = parseFloat(apapHours); const l = parseFloat(apapLevel);
    if (isNaN(h) || isNaN(l) || h < 4) return null;
    const thresh = rmTreatmentThreshold(h);
    if (!thresh) return null;
    return { threshold:thresh, treat:l >= thresh, level:l, hours:h };
  }, [apapHours, apapLevel]);

  const listLength = mainTab === "antidotes" ? filteredAntidotes.length : filteredProtocols.length;

  const handleListKey = useCallback((e) => {
    if (inputActive) { if (e.key === "Escape") { setInputActive(false); panelRef.current?.focus(); } return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setFocusIdx(i => Math.min(i+1, listLength-1)); return; }
    if (e.key === "ArrowUp")   { e.preventDefault(); setFocusIdx(i => Math.max(i-1, 0)); return; }
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      const list = mainTab === "antidotes" ? filteredAntidotes : filteredProtocols;
      const item = list[focusIdx];
      if (item) toggle(item.antidote || item.id);
      return;
    }
    if (e.key === "Escape") { setExpanded(null); return; }
    if (e.key === "c" || e.key === "C") { setExpanded(null); return; } // collapse all
    if (e.key === "/" || e.key === "s" || e.key === "S") {
      e.preventDefault(); setInputActive(true); setTimeout(() => searchRef.current?.focus(), 20);
    }
  }, [inputActive, focusIdx, listLength, mainTab, filteredAntidotes, filteredProtocols, toggle]);

  const handleNomogramKey = useCallback((e) => {
    if (inputActive) { if (e.key === "Escape") { setInputActive(false); panelRef.current?.focus(); } return; }
    if (e.key === "h" || e.key === "H") { e.preventDefault(); setInputActive(true); hoursRef.current?.focus(); }
    if (e.key === "l" || e.key === "L") { e.preventDefault(); setInputActive(true); levelRef.current?.focus(); }
  }, [inputActive]);

  const tabBtnStyle = (id) => {
    const t = TABS.find(x => x.id === id);
    const active = mainTab === id;
    return { fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:12,padding:"7px 14px",borderRadius:9,cursor:"pointer",transition:"all .15s",border:`1px solid ${active ? t.color+"66" : "rgba(26,53,85,0.4)"}`,background:active ? `linear-gradient(135deg,${t.color}18,${t.color}06)` : "transparent",color:active ? t.color : T.txt4 };
  };

  const inputSt = { background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,color:"#e8edf5",fontSize:14,padding:"8px 12px",outline:"none",fontFamily:"'JetBrains Mono',monospace" };

  return (
    <div ref={wrapRef} style={{ fontFamily:"'DM Sans',sans-serif",background:embedded?"transparent":T.bg,minHeight:embedded?"auto":"100vh",color:T.txt }}>
      <div style={{ maxWidth:1200,margin:"0 auto",padding:embedded?"0":"0 16px" }}>

        {!embedded && (
          <div style={{ padding:"18px 0 14px" }}>
            {onBack && <button onClick={onBack} style={{ marginBottom:10,display:"inline-flex",alignItems:"center",gap:7,fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:600,background:"rgba(14,37,68,0.7)",border:"1px solid rgba(42,79,122,0.5)",borderRadius:8,padding:"5px 14px",color:T.txt3,cursor:"pointer" }}>Back to Hub</button>}
            <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:8 }}>
              <div style={{ background:"rgba(5,15,30,0.9)",border:"1px solid rgba(42,79,122,0.6)",borderRadius:10,padding:"5px 12px",display:"flex",alignItems:"center",gap:8 }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.purple,letterSpacing:3 }}>NOTRYA</span>
                <span style={{ color:T.txt4,fontFamily:"'JetBrains Mono',monospace",fontSize:10 }}>/</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.txt3,letterSpacing:2 }}>TOX</span>
              </div>
              <div style={{ height:1,flex:1,background:"linear-gradient(90deg,rgba(255,107,107,0.5),transparent)" }} />
            </div>
            <h1 className="shimmer-text" style={{ fontFamily:"'Playfair Display',serif",fontSize:"clamp(22px,4vw,38px)",fontWeight:900,letterSpacing:-0.5,lineHeight:1.1 }}>Toxicology Hub</h1>
            <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.txt4,marginTop:4 }}>
              {ANTIDOTES.length} Antidotes · {PROTOCOLS.length} Protocols · Dose Calculator · Rumack-Matthew · Toxidromes · Poison Control
            </p>
          </div>
        )}

        {embedded && (
          <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:12 }}>
            {onBack && <button onClick={onBack} style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:600,background:"rgba(14,37,68,0.7)",border:"1px solid rgba(42,79,122,0.5)",borderRadius:8,padding:"4px 12px",color:T.txt3,cursor:"pointer" }}>Back</button>}
            <span style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:15,color:T.coral }}>Toxicology Reference</span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.txt4,letterSpacing:1.5,textTransform:"uppercase",background:"rgba(255,107,107,0.1)",border:"1px solid rgba(255,107,107,0.25)",borderRadius:4,padding:"2px 7px" }}>{ANTIDOTES.length} antidotes</span>
          </div>
        )}

        {/* Tab bar */}
        <div style={{ display:"flex",gap:5,flexWrap:"wrap",padding:"6px",background:"rgba(8,22,40,0.7)",border:"1px solid rgba(26,53,85,0.4)",borderRadius:12,marginBottom:12 }}>
          {TABS.map((t, i) => (
            <button key={t.id} onClick={() => setMainTab(t.id)} style={tabBtnStyle(t.id)}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:mainTab===t.id?t.color+"aa":"#374151",marginRight:4 }}>{String.fromCharCode(8984)}{i+1}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* Unified search bar */}
        {(mainTab === "antidotes" || mainTab === "protocols") && (
          <div style={{ marginBottom:10 }}>
            <input ref={searchRef} type="text" value={search} onChange={e => setSearch(e.target.value)}
              onFocus={() => setInputActive(true)}
              onBlur={() => { setInputActive(false); setTimeout(() => panelRef.current?.focus(), 50); }}
              placeholder={search ? `"${search}" — showing results in both Antidotes and Protocols (press / to search)` : "Search antidotes or protocols... (press /)"}
              style={{ width:"100%",padding:"8px 14px",background:"rgba(14,37,68,0.8)",border:`1px solid ${search?"rgba(255,107,107,0.5)":"rgba(42,79,122,0.35)"}`,borderRadius:20,outline:"none",fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.txt }} />
            {search && mainTab === "antidotes" && filteredProtocols.length > 0 && (
              <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.txt4,marginTop:5 }}>
                Also matched in Protocols: {filteredProtocols.map(p => p.name).join(", ")} — 
                <span onClick={() => setMainTab("protocols")} style={{ color:T.coral,cursor:"pointer",marginLeft:4 }}>switch to Protocols tab</span>
              </div>
            )}
            {search && mainTab === "protocols" && filteredAntidotes.length > 0 && (
              <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.txt4,marginTop:5 }}>
                Also matched in Antidotes: {filteredAntidotes.map(a => a.antidote).join(", ")} — 
                <span onClick={() => setMainTab("antidotes")} style={{ color:T.teal,cursor:"pointer",marginLeft:4 }}>switch to Antidotes tab</span>
              </div>
            )}
          </div>
        )}

        {/* ANTIDOTES */}
        {mainTab === "antidotes" && (
          <div className="tox-fade">
            <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.txt4,letterSpacing:1.5,textTransform:"uppercase",marginBottom:8 }}>
              {filteredAntidotes.length} antidotes — quickDose visible without expanding
            </div>
            <div ref={panelRef} tabIndex={0} onKeyDown={handleListKey} style={{ outline:"none" }}>
              {groupedAntidotes.map(({ tier, items }) => {
                const m = TIER_META[tier];
                return (
                  <div key={tier}>
                    <div style={{ display:"flex",alignItems:"center",gap:8,margin:"14px 0 8px" }}>
                      <div style={{ width:3,height:16,borderRadius:2,background:m.color,flexShrink:0 }} />
                      <span style={{ fontFamily:"'Playfair Display',serif",fontSize:12,fontWeight:700,color:m.color }}>{m.label}</span>
                      <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.txt4 }}>— {m.sub}</span>
                      <div style={{ flex:1,height:1,background:"rgba(26,53,85,0.5)" }} />
                      <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.txt4 }}>{items.length}</span>
                    </div>
                    {items.map(a => {
                      const gi = filteredAntidotes.indexOf(a);
                      return <AntidoteCard key={a.antidote} a={a} focused={focusIdx===gi} expanded={expanded===a.antidote} onToggle={() => { setFocusIdx(gi); toggle(a.antidote); }} />;
                    })}
                  </div>
                );
              })}
              {filteredAntidotes.length === 0 && <div style={{ padding:"24px",textAlign:"center",background:"rgba(8,22,40,0.6)",border:"1px solid rgba(26,53,85,0.35)",borderRadius:10,fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.txt4 }}>No antidotes matching "{search}"</div>}
            </div>
            <KbHints hints={[{ key:"↑ ↓",label:"navigate" },{ key:"Space / Enter",label:"expand" },{ key:"C",label:"collapse all" },{ key:"/ or S",label:"search" },{ key:String.fromCharCode(8984)+"1-6",label:"tabs" }]} />
          </div>
        )}

        {/* PROTOCOLS */}
        {mainTab === "protocols" && (
          <div className="tox-fade">
            <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.txt4,letterSpacing:1.5,textTransform:"uppercase",marginBottom:8 }}>{filteredProtocols.length} protocols</div>
            <div ref={panelRef} tabIndex={0} onKeyDown={handleListKey} style={{ outline:"none" }}>
              {filteredProtocols.map((p, idx) => (
                <ProtocolCard key={p.id} proto={p} focused={focusIdx===idx} expanded={expanded===p.id} onToggle={() => { setFocusIdx(idx); toggle(p.id); }} />
              ))}
            </div>
            <KbHints hints={[{ key:"↑ ↓",label:"navigate" },{ key:"Space / Enter",label:"expand" },{ key:"C",label:"collapse all" },{ key:"/ or S",label:"search" }]} />
          </div>
        )}

        {/* DOSE CALC */}
        {mainTab === "dosecalc" && <div className="tox-fade"><DoseCalcTab /></div>}

        {/* NOMOGRAM */}
        {mainTab === "nomogram" && (
          <div className="tox-fade">
            <div ref={panelRef} tabIndex={0} onKeyDown={handleNomogramKey} style={{ outline:"none" }}>
              <div style={{ padding:"12px 14px",borderRadius:10,marginBottom:12,background:"rgba(255,159,67,0.07)",border:"1px solid rgba(255,159,67,0.3)" }}>
                <div style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:14,color:T.orange,marginBottom:4 }}>Rumack-Matthew Nomogram</div>
                <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.txt3,lineHeight:1.6 }}>
                  For acute single-ingestion APAP OD only. Level must be {">="} 4h post-ingestion. NOT valid for: chronic, extended-release (ER), staggered, or unknown ingestion time.
                </div>
              </div>

              <div style={{ padding:"10px 14px",borderRadius:9,marginBottom:12,background:"rgba(248,113,113,0.07)",border:"1px solid rgba(248,113,113,0.3)" }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.red,letterSpacing:1,textTransform:"uppercase",marginBottom:4 }}>Extended-Release APAP — Nomogram is Invalid</div>
                <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.txt3,lineHeight:1.6 }}>
                  Check APAP levels at BOTH 4h and 8h post-ingestion. Treat if either level plots above the treatment line. If both below the line but concern remains, check a third level at 12-16h. Do not apply the nomogram to ER products — it was derived from immediate-release formulations only.
                </div>
              </div>

              <div style={{ display:"flex",gap:10,flexWrap:"wrap",marginBottom:12 }}>
                <div style={{ flex:1,minWidth:150 }}>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.txt4,letterSpacing:1.3,textTransform:"uppercase",marginBottom:4 }}>Hours Since Ingestion · press H</div>
                  <input ref={hoursRef} type="number" value={apapHours} onChange={e => setApapHours(e.target.value)}
                    onFocus={() => setInputActive(true)} onBlur={() => { setInputActive(false); setTimeout(() => panelRef.current?.focus(), 50); }}
                    placeholder="e.g. 6" min="4" max="24"
                    style={{ ...inputSt,width:"100%",fontSize:18,fontWeight:700,color:T.orange }} />
                </div>
                <div style={{ flex:1,minWidth:150 }}>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.txt4,letterSpacing:1.3,textTransform:"uppercase",marginBottom:4 }}>APAP Level (mcg/mL) · press L</div>
                  <input ref={levelRef} type="number" value={apapLevel} onChange={e => setApapLevel(e.target.value)}
                    onFocus={() => setInputActive(true)} onBlur={() => { setInputActive(false); setTimeout(() => panelRef.current?.focus(), 50); }}
                    placeholder="e.g. 180"
                    style={{ ...inputSt,width:"100%",fontSize:18,fontWeight:700,color:T.teal }} />
                </div>
              </div>

              {rmThreshold && !apapResult && (
                <div style={{ padding:"10px 14px",borderRadius:9,background:"rgba(42,79,122,0.1)",border:"1px solid rgba(42,79,122,0.3)",marginBottom:10 }}>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.txt4,letterSpacing:1,marginBottom:3 }}>TREATMENT THRESHOLD AT {apapHours}h</div>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:24,fontWeight:700,color:T.orange }}>{rmThreshold} mcg/mL</div>
                </div>
              )}

              {apapResult && (
                <div style={{ padding:"14px 16px",borderRadius:10,marginBottom:12,background:apapResult.treat?"linear-gradient(135deg,rgba(255,107,107,0.12),rgba(8,22,40,0.95))":"linear-gradient(135deg,rgba(61,255,160,0.1),rgba(8,22,40,0.95))",border:`2px solid ${apapResult.treat?T.coral+"66":T.green+"66"}` }}>
                  <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:8 }}>
                    <div style={{ fontSize:28 }}>{apapResult.treat?"⚠️":"✅"}</div>
                    <div>
                      <div style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:18,color:apapResult.treat?T.coral:T.green }}>{apapResult.treat?"TREAT WITH NAC":"BELOW TREATMENT LINE"}</div>
                      <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.txt3,marginTop:2 }}>Level {apapResult.level} mcg/mL at {apapResult.hours}h · Threshold {apapResult.threshold} mcg/mL</div>
                    </div>
                  </div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.txt2,lineHeight:1.65 }}>
                    {apapResult.treat ? "APAP level is at or above the treatment line. Initiate IV NAC (3-bag or 2-bag protocol) immediately. Check LFTs and PT/INR. Continue until APAP undetectable, INR <2, and LFTs trending down."
                      : "Level is below the treatment line. NAC not indicated by nomogram. However — if ingestion time uncertain, levels still rising, ALT elevated, or extended-release formulation: treat empirically."}
                  </div>
                </div>
              )}

              <div style={{ padding:"10px 14px",borderRadius:10,background:"rgba(8,22,40,0.7)",border:"1px solid rgba(26,53,85,0.4)" }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.txt4,letterSpacing:1.5,textTransform:"uppercase",marginBottom:8 }}>Treatment Line Reference</div>
                <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
                  {[[4,150],[6,99],[8,70],[10,51],[12,38],[16,21],[20,12],[24,7]].map(([h,l]) => (
                    <div key={h} style={{ padding:"5px 10px",borderRadius:6,background:"rgba(255,159,67,0.08)",border:"1px solid rgba(255,159,67,0.22)",textAlign:"center" }}>
                      <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.txt4 }}>{h}h</div>
                      <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:700,color:T.orange }}>{l}</div>
                      <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:7,color:T.txt4 }}>mcg/mL</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop:10,fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.txt4,lineHeight:1.55 }}>150 mcg/mL at 4h line (original Rumack-Matthew). Some centers use 100 mcg/mL for higher-risk patients. Unknown ingestion time = treat empirically. Extended-release APAP = nomogram invalid — use serial levels at 4h and 8h.</div>
              </div>
            </div>
            <KbHints hints={[{ key:"H",label:"hours" },{ key:"L",label:"level" },{ key:"Esc",label:"back to panel" }]} />
          </div>
        )}

        {/* TOXIDROMES */}
        {mainTab === "toxidromes" && (
          <div className="tox-fade">
            <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.txt4,letterSpacing:1.5,textTransform:"uppercase",marginBottom:10 }}>Classic Toxidrome Recognition</div>
            {TOXIDROMES.map(tox => (
              <div key={tox.name} style={{ marginBottom:7,padding:"10px 13px",borderRadius:9,background:"rgba(8,22,40,0.65)",border:"1px solid rgba(26,53,85,0.4)",borderLeft:`4px solid ${tox.color}` }}>
                <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:7,flexWrap:"wrap" }}>
                  <span style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:13,color:tox.color }}>{tox.name}</span>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.teal,background:"rgba(0,229,192,0.09)",border:"1px solid rgba(0,229,192,0.3)",borderRadius:4,padding:"1px 8px" }}>Tx: {tox.treatment}</span>
                </div>
                <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:7 }}>
                  {[{ label:"Pupils",val:tox.pupils,color:T.blue },{ label:"Mental Status",val:tox.ms,color:T.purple },{ label:"Vitals",val:tox.vitals,color:T.coral },{ label:"Skin",val:tox.skin,color:T.gold },{ label:"Other",val:tox.other,color:T.teal }].map(f => (
                    <div key={f.label} style={{ padding:"6px 8px",background:`${f.color}09`,border:`1px solid ${f.color}22`,borderRadius:7 }}>
                      <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:7,color:f.color,letterSpacing:1,textTransform:"uppercase",marginBottom:3 }}>{f.label}</div>
                      <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.txt3,lineHeight:1.4 }}>{f.val}</div>
                    </div>
                  ))}
                </div>
                {tox.name === "Cardiac Toxicology" && (
                  <div style={{ marginTop:8,padding:"6px 10px",borderRadius:7,background:`${T.orange}08`,border:`1px solid ${T.orange}22` }}>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.orange,letterSpacing:1,textTransform:"uppercase" }}>Cardiac Pearl: </span>
                    <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.txt2 }}>{CARDIAC_TOX_PEARL}</span>
                  </div>
                )}
              </div>
            ))}
            <KbHints hints={[{ key:String.fromCharCode(8984)+"1-6",label:"switch tabs" }]} />
          </div>
        )}

        {/* POISON CONTROL */}
        {mainTab === "poison" && (
          <div className="tox-fade">
            {[
              { title:"US Poison Control Center", val:"1-800-222-1222", sub:"National 24/7 hotline — free, confidential, physician-to-physician consult available", color:T.red, icon:"☎️", big:true },
              { title:"CHEMTREC (hazmat / industrial)", val:"1-800-424-9300", sub:"24/7 chemical emergency response", color:T.orange, icon:"⚗️" },
              { title:"Never Use Alone (overdose monitoring)", val:"1-800-484-3731", sub:"Free real-time overdose monitoring — stays on the line while someone uses, calls 911 if no response", color:T.purple, icon:"📞" },
              { title:"Antidote Stocking Verification", val:"Check your pharmacy", sub:"Verify: NAC IV, fomepizole, hydroxocobalamin, digibind, physostigmine, Intralipid 20%, pralidoxime, methylene blue, deferoxamine, glucagon", color:T.gold, icon:"💊" },
            ].map(c => (
              <div key={c.title} style={{ padding:"13px 15px",borderRadius:10,marginBottom:8,background:`${c.color}0a`,border:`1px solid ${c.color}33`,borderLeft:`4px solid ${c.color}` }}>
                <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:4 }}>
                  <span style={{ fontSize:20 }}>{c.icon}</span>
                  <span style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:13,color:c.color }}>{c.title}</span>
                </div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:c.big?22:14,fontWeight:700,color:c.color,marginBottom:4 }}>{c.val}</div>
                <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.txt4,lineHeight:1.55 }}>{c.sub}</div>
              </div>
            ))}
            <div style={{ padding:"10px 13px",borderRadius:9,marginTop:4,background:"rgba(8,22,40,0.6)",border:"1px solid rgba(26,53,85,0.35)" }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.txt4,letterSpacing:1.5,textTransform:"uppercase",marginBottom:7 }}>Critical Antidote Availability — Verify in Your Pharmacy</div>
              <div style={{ display:"flex",flexWrap:"wrap",gap:5 }}>
                {["NAC (IV)","Fomepizole","Hydroxocobalamin","Digibind/DigiFab","Physostigmine","Intralipid 20%","Pralidoxime (2-PAM)","Methylene Blue","Atropine (large supply)","Glucagon","Deferoxamine","Protamine","Cyproheptadine"].map(drug => (
                  <span key={drug} style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:10,padding:"3px 9px",borderRadius:4,background:"rgba(42,79,122,0.2)",border:"1px solid rgba(42,79,122,0.35)",color:T.txt4 }}>{drug}</span>
                ))}
              </div>
            </div>
            <KbHints hints={[{ key:String.fromCharCode(8984)+"1-6",label:"switch tabs" }]} />
          </div>
        )}

        {!embedded && (
          <div style={{ textAlign:"center",padding:"24px 0 16px",fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.txt4,letterSpacing:1.5 }}>
            NOTRYA TOX HUB · FOR CLINICAL DECISION SUPPORT ONLY · VERIFY WITH POISON CONTROL AND TOXICOLOGY · LOCAL PROTOCOLS MAY DIFFER
          </div>
        )}
      </div>
    </div>
  );
}