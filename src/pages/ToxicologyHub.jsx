import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";

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
  {
    antidote:"N-Acetylcysteine (NAC)",
    toxin:"Acetaminophen (APAP)",
    color:T.teal,
    route:"IV or PO",
    dosing:"IV: 150 mg/kg over 60 min → 50 mg/kg over 4h → 100 mg/kg over 16h (Rumack-Matthew guides). PO: 140 mg/kg load → 70 mg/kg q4h × 17 doses.",
    timing:"Most effective within 8–10h of ingestion. Still give >24h post-ingestion in fulminant failure.",
    pearls:"Check APAP level at 4h post-ingestion. Plot on Rumack-Matthew nomogram. ALT trending up = continue NAC regardless of level.",
    urgency:"urgent",
  },
  {
    antidote:"Flumazenil",
    toxin:"Benzodiazepines",
    color:T.purple,
    route:"IV",
    dosing:"0.2 mg IV over 30 sec; repeat 0.2 mg q1 min to max 1 mg total.",
    timing:"Short half-life — resedation likely within 1–2h. Re-dose or infusion may be needed.",
    pearls:"CONTRAINDICATED in: chronic BZD users (precipitates seizures), mixed TCA ingestion, seizures controlled by BZD, elevated ICP. Use is rarely indicated — manage airway instead.",
    urgency:"caution",
  },
  {
    antidote:"Naloxone",
    toxin:"Opioids",
    color:T.green,
    route:"IV / IM / IN / ETT",
    dosing:"0.4–2 mg IV/IM. Titrate to respirations — NOT to full reversal (precipitates withdrawal/violence). IN: 4 mg (2 mg per nostril). Infusion: 2/3 of reversal dose per hour.",
    timing:"Onset IV 1–2 min, IM 5 min, IN 5–10 min. Half-life 60–90 min — shorter than most opioids. Repeat dosing expected.",
    pearls:"Buprenorphine requires much higher doses (4–8 mg+). Methadone: prolonged monitoring required. Fentanyl analogues: may require repeated large doses.",
    urgency:"urgent",
  },
  {
    antidote:"Atropine",
    toxin:"Organophosphates / Carbamates / Nerve agents",
    color:T.orange,
    route:"IV / IM",
    dosing:"2–4 mg IV q5–10 min until secretions dry. No ceiling dose — titrate to bronchorrhea and bronchospasm resolution, NOT to heart rate. Can require hundreds of mg in severe cases.",
    timing:"Start immediately for symptomatic cholinergic toxidrome. Do not delay for pralidoxime.",
    pearls:"Titration endpoint: drying of secretions, clearing breath sounds — NOT pupil dilation or heart rate. Pralidoxime (2-PAM) 1–2 g IV given simultaneously for organophosphate (not carbamate).",
    urgency:"immediate",
  },
  {
    antidote:"Pralidoxime (2-PAM)",
    toxin:"Organophosphates",
    color:T.orange,
    route:"IV",
    dosing:"1–2 g IV over 15–30 min. Infusion: 200–500 mg/hr. Give within 24–48h of exposure — less effective after acetylcholinesterase aging.",
    timing:"Give with atropine — do not use as a substitute. Most effective before enzyme aging (organophosphate-specific).",
    pearls:"NOT for carbamate poisoning. Ineffective once aging occurs. Requires ICU admission for continuous infusion.",
    urgency:"urgent",
  },
  {
    antidote:"Digoxin-Specific Antibody Fragments (Digibind / DigiFab)",
    toxin:"Digoxin / Digitalis glycosides",
    color:T.blue,
    route:"IV",
    dosing:"Known dose: vials = (mg ingested × 0.8) / 0.5. Known level: vials = (level ng/mL × weight kg) / 100. Empiric acute OD: 10–20 vials. Empiric chronic tox: 1–6 vials.",
    timing:"Indicated for: life-threatening dysrhythmia, hyperkalemia >5.5, hemodynamic instability, level >15 ng/mL (acute).",
    pearls:"Post-digibind levels are unreliable. Potassium shifts rapidly — monitor closely. Renal failure: prolonged half-life of complex.",
    urgency:"urgent",
  },
  {
    antidote:"Sodium Bicarbonate",
    toxin:"Tricyclic antidepressants (TCA) / Sodium channel blockers",
    color:T.coral,
    route:"IV",
    dosing:"1–2 mEq/kg IV bolus. Repeat until QRS <120 ms or pH 7.45–7.55. Infusion: 150 mEq in 1L D5W at 1.5× maintenance rate.",
    timing:"Give for QRS >100 ms, ventricular dysrhythmia, or hypotension from TCA.",
    pearls:"Target pH 7.45–7.55 — alkalinization is the mechanism, not just sodium loading. Also used for: cocaine-related QRS widening, flecainide, type Ia/Ic antiarrhythmics.",
    urgency:"immediate",
  },
  {
    antidote:"Calcium (Gluconate or Chloride)",
    toxin:"Calcium channel blockers / Beta-blockers / Hyperkalemia / Fluoride",
    color:T.gold,
    route:"IV",
    dosing:"CCB OD: calcium gluconate 3g IV (CaCl 1g IV) over 5 min; repeat × 3. High-dose insulin: dextrose + regular insulin 1 unit/kg bolus → 0.5–1 unit/kg/hr. Lipid emulsion (Intralipid) 1.5 mL/kg bolus for refractory CCB.",
    timing:"Give early in CCB/BB OD — before hemodynamic collapse. HDI therapy is primary intervention for severe CCB toxicity.",
    pearls:"CaCl provides 3× more elemental calcium than gluconate — use centrally. High-dose insulin (HDI) is now first-line for severe CCB toxicity along with calcium.",
    urgency:"urgent",
  },
  {
    antidote:"Fomepizole (4-MP)",
    toxin:"Methanol / Ethylene glycol",
    color:T.cyan,
    route:"IV",
    dosing:"15 mg/kg IV loading dose over 30 min → 10 mg/kg q12h × 4 doses → 15 mg/kg q12h thereafter. Continue until level <20 mg/dL and asymptomatic.",
    timing:"Give immediately on clinical suspicion — do not wait for confirmatory levels. Simultaneous HD for severe acidosis, level >50 mg/dL, or end-organ damage.",
    pearls:"Blocks alcohol dehydrogenase — prevents toxic metabolite formation. Ethanol infusion is an alternative if fomepizole unavailable. Dialysis removes parent compound and metabolites.",
    urgency:"urgent",
  },
  {
    antidote:"Physostigmine",
    toxin:"Anticholinergic toxidrome (pure — not mixed TCA)",
    color:T.purple,
    route:"IV",
    dosing:"1–2 mg IV over 5 min. May repeat once in 20 min if needed. Pediatric: 0.02 mg/kg (max 0.5 mg) over 5 min.",
    timing:"Use only for pure anticholinergic toxidrome — absolutely contraindicated if TCA co-ingestion suspected.",
    pearls:"CONTRAINDICATED in: TCA or other sodium channel blocker ingestion (fatal bradycardia/asystole). Not for routine use. Consult toxicology.",
    urgency:"caution",
  },
  {
    antidote:"Pyridoxine (Vitamin B6)",
    toxin:"Isoniazid (INH) / Gyromitra mushrooms",
    color:T.green,
    route:"IV",
    dosing:"INH: 1 mg pyridoxine per 1 mg INH ingested. If unknown dose: 5 g IV. Give simultaneously with benzodiazepines for seizures.",
    timing:"Give immediately for INH-induced status epilepticus — BZD alone will fail without pyridoxine.",
    pearls:"INH seizures are pyridoxine-depleted status — BZD + pyridoxine combination is required. Phenytoin is ineffective for INH seizures.",
    urgency:"immediate",
  },
  {
    antidote:"Hydroxocobalamin",
    toxin:"Cyanide / Smoke inhalation",
    color:T.red,
    route:"IV",
    dosing:"5 g IV over 15 min (adult). Pediatric: 70 mg/kg. Repeat 5 g if hemodynamically unstable. Max 15 g total.",
    timing:"First-line for smoke inhalation with suspected cyanide. Give empirically — do not wait for cyanide levels.",
    pearls:"Turns urine red for 5 days — warn patient/staff. Causes false SpO2 elevations — use co-oximetry for accurate O2 saturation. Compatible with sodium thiosulfate.",
    urgency:"immediate",
  },
  {
    antidote:"Methylene Blue",
    toxin:"Methemoglobinemia",
    color:T.blue,
    route:"IV",
    dosing:"1–2 mg/kg IV over 5 min. Repeat 1 mg/kg in 1h if inadequate response. Max 7 mg/kg total.",
    timing:"Indicated for MetHb >30% or symptomatic at lower levels. Response expected within 30–60 min.",
    pearls:"Ineffective in G6PD deficiency — exchange transfusion for G6PD patients. Common causes: dapsone, benzocaine, nitrites, primaquine. Co-oximetry required (pulse ox unreliable in MetHb).",
    urgency:"urgent",
  },
  {
    antidote:"Lipid Emulsion (Intralipid 20%)",
    toxin:"Lipophilic drug toxicity — local anesthetics, CCB, TCA",
    color:T.gold,
    route:"IV",
    dosing:"1.5 mL/kg IV bolus over 1 min. Repeat bolus ×2 if no response. Infusion: 0.25 mL/kg/min for 30–60 min. Max 10–12 mL/kg.",
    timing:"Cardiac arrest or peri-arrest from lipophilic drug toxicity — give when all else fails.",
    pearls:"Mechanism: lipid sink draws drug from tissues. Used for: bupivacaine cardiac arrest, refractory CCB, TCA. May impair vasopressor binding — continue vasopressors. Do not use propofol as lipid source.",
    urgency:"urgent",
  },
  {
    antidote:"Glucagon",
    toxin:"Beta-blockers / Calcium channel blockers",
    color:T.orange,
    route:"IV",
    dosing:"3–10 mg IV bolus over 1–2 min. Infusion: effective bolus dose per hour. High-dose insulin is preferred first-line.",
    timing:"Onset 1–3 min. Duration 15–20 min. Use while setting up HDI therapy.",
    pearls:"Induces nausea/vomiting — have airway ready. Limited evidence but rapid onset makes it useful as bridge therapy. Tachyphylaxis limits sustained use.",
    urgency:"urgent",
  },
  {
    antidote:"Deferoxamine",
    toxin:"Iron overdose",
    color:T.red,
    route:"IV",
    dosing:"15 mg/kg/hr IV (max 35 mg/kg/hr in severe cases). Continue until urine clears (vin rose color resolves) and patient clinically improved.",
    timing:"Indicated for: serum iron >500 mcg/dL, symptomatic iron poisoning, metabolic acidosis.",
    pearls:"Chelates free iron — urine turns rose/wine color when effective. Do not use orally. Discontinue after 24h even if not complete — risk of ARDS with prolonged use.",
    urgency:"urgent",
  },
];

// ── INGESTION PROTOCOLS ───────────────────────────────────────────────────────
const PROTOCOLS = [
  {
    id:"apap", name:"Acetaminophen", icon:"💊", color:T.teal,
    alert:"Plot serum APAP level (drawn at ≥4h post-ingestion) on Rumack-Matthew nomogram — see Nomogram tab",
    sections:[
      {
        label:"Immediate Steps", color:T.teal, items:[
          "IV access × 2, cardiac monitor, pulse ox",
          "APAP level (must be ≥4h post-ingestion to plot nomogram)",
          "LFTs, PT/INR, BMP, acetaminophen, ethanol level",
          "Activated charcoal 1 g/kg PO/NG if <1h post-ingestion and protected airway",
        ],
      },
      {
        label:"Antidote", color:T.orange, items:[
          "NAC if APAP level plots above treatment line on nomogram",
          "NAC if >8h post-ingestion and level still pending — do not wait",
          "NAC for any symptomatic hepatotoxicity regardless of level",
          "IV NAC preferred — 3-bag protocol (see antidote reference)",
        ],
      },
      {
        label:"Monitoring", color:T.blue, items:[
          "LFTs q8–12h during NAC therapy",
          "PT/INR — hepatotoxicity marker",
          "If ALT rising: continue NAC regardless of level normalization",
          "Transplant evaluation if: INR >6, creatinine >3.4, Grade III/IV encephalopathy (King's College Criteria)",
        ],
      },
    ],
    pearl:"A single APAP level drawn <4h post-ingestion cannot be plotted — repeat at 4h. Unknown time of ingestion = assume worst case and treat.",
  },
  {
    id:"tca", name:"Tricyclic Antidepressants", icon:"⚡", color:T.coral,
    alert:"QRS >100 ms = sodium bicarbonate NOW — do not wait for worsening",
    sections:[
      {
        label:"Immediate Steps", color:T.coral, items:[
          "12-lead EKG immediately — QRS width, terminal R in aVR, R:S ratio >0.7 in aVR",
          "Continuous cardiac monitoring — dysrhythmia can occur suddenly",
          "IV access × 2, O2, establish airway early if AMS",
          "BMP, acetaminophen, salicylate, TCA level (level correlates poorly — EKG is better)",
        ],
      },
      {
        label:"Antidote / Treatment", color:T.orange, items:[
          "QRS >100 ms or dysrhythmia: sodium bicarbonate 1–2 mEq/kg IV bolus now",
          "Repeat bicarb until QRS <100 ms — titrate to pH 7.45–7.55",
          "Hypotension: IVF 1–2L, then norepinephrine — avoid dopamine",
          "Seizures: benzodiazepines only — phenytoin is CONTRAINDICATED in TCA seizures",
        ],
      },
      {
        label:"Dangerous Combinations", color:T.red, items:[
          "Flumazenil: absolutely contraindicated — precipitates refractory seizures",
          "Physostigmine: contraindicated — fatal bradycardia and asystole",
          "Phenytoin: contraindicated for TCA-induced seizures",
          "Sodium channel blockers (type Ia/Ic antiarrhythmics): avoid",
        ],
      },
    ],
    pearl:"The R wave in aVR >3 mm and R:S ratio >0.7 in aVR are the most specific EKG findings for TCA toxicity — more sensitive than QRS width alone. Alkalinization, not just sodium, is the mechanism of bicarb.",
  },
  {
    id:"ccb", name:"Calcium Channel Blockers", icon:"❤️", color:T.orange,
    alert:"High-dose insulin (HDI) is first-line — start early, do not wait for refractory hemodynamics",
    sections:[
      {
        label:"Immediate Steps", color:T.orange, items:[
          "12-lead EKG, continuous monitoring — bradycardia, AV block, wide complex",
          "IV access × 2, BMP (glucose), cardiac monitor",
          "Transcutaneous pacer at bedside — transvenous for sustained complete heart block",
          "BGL monitoring q30min during HDI therapy",
        ],
      },
      {
        label:"First-Line Treatment", color:T.teal, items:[
          "Calcium gluconate 3g IV (or CaCl 1g IV) over 5 min — repeat × 3 prn",
          "High-dose insulin (HDI): regular insulin 1 unit/kg IV bolus + D50 1 amp → infusion 0.5–1 unit/kg/hr",
          "Dextrose 0.5 g/kg/hr infusion with HDI — maintain glucose 100–250 mg/dL",
          "Vasopressors: norepinephrine or vasopressin for persistent hypotension",
        ],
      },
      {
        label:"Salvage Therapies", color:T.red, items:[
          "Lipid emulsion 20% (Intralipid): 1.5 mL/kg bolus for arrest or peri-arrest",
          "Glucagon 3–10 mg IV bolus as bridge therapy (vomiting risk — protect airway)",
          "ECMO / VA-ECMO for refractory cardiovascular collapse",
          "Contact poison control and toxicology early — CCB OD has high mortality",
        ],
      },
    ],
    pearl:"Dihydropyridines (amlodipine, nifedipine) cause vasodilation + reflex tachycardia. Non-dihydropyridines (diltiazem, verapamil) cause bradycardia + AV block. HDI works by improving myocardial metabolism — start with hemodynamic instability, not only in arrest.",
  },
  {
    id:"opioid", name:"Opioid Toxidrome", icon:"💤", color:T.purple,
    alert:"Fentanyl analogues may require 10+ mg naloxone — have high threshold to intubate",
    sections:[
      {
        label:"Immediate Steps", color:T.purple, items:[
          "Airway — BVM if apneic before naloxone",
          "Naloxone 0.4–2 mg IV/IM/IN — titrate to respirations, not full reversal",
          "Do not fully reverse in opioid-tolerant patients — precipitates acute withdrawal and violence",
          "ACLS if in cardiac arrest — naloxone + CPR simultaneously",
        ],
      },
      {
        label:"Specific Agents", color:T.blue, items:[
          "Buprenorphine: partial agonist — requires 4–8+ mg naloxone, may be partially reversible only",
          "Methadone: long half-life (24–36h) — prolonged monitoring after naloxone",
          "Fentanyl/carfentanil analogues: extreme potency — high naloxone doses, may need intubation",
          "Heroin: classic presentation, responds well to standard naloxone doses",
        ],
      },
      {
        label:"Monitoring / Disposition", color:T.gold, items:[
          "Observe ≥4–6h after last naloxone dose for resedation",
          "Naloxone infusion: 2/3 of reversal dose per hour in D5W for long-acting opioids",
          "Methadone ingestion: 12–24h monitoring minimum regardless of apparent response",
          "Harm reduction: prescribe naloxone at discharge, connect to treatment",
        ],
      },
    ],
    pearl:"'Start low, go slow' for naloxone in opioid-tolerant patients — precipitated withdrawal means a combative, vomiting, acutely distressed patient with fully intact pain sensitivity. Titrate to respiratory rate of 12, not to GCS 15.",
  },
  {
    id:"serotonin", name:"Serotonin Syndrome", icon:"🌡️", color:T.red,
    alert:"Hunter Criteria: clonus is key — check for inducible and spontaneous clonus",
    sections:[
      {
        label:"Hunter Criteria (ANY of):", color:T.red, items:[
          "Spontaneous clonus",
          "Inducible clonus + agitation or diaphoresis",
          "Ocular clonus + agitation or diaphoresis",
          "Tremor + hyperreflexia",
          "Hypertonia + temperature >38°C + ocular or inducible clonus",
        ],
      },
      {
        label:"Treatment", color:T.orange, items:[
          "Discontinue all serotonergic agents immediately",
          "Cyproheptadine 12 mg PO/NG load → 2 mg q2h prn (max 32 mg/day) — 5-HT2A antagonist",
          "Benzodiazepines liberally for agitation, seizures, and muscle rigidity",
          "Aggressive cooling for hyperthermia >41.1°C — paralysis + intubation if needed",
          "Avoid physical restraints — worsen hyperthermia and acidosis",
        ],
      },
      {
        label:"Common Causative Combinations", color:T.purple, items:[
          "SSRI/SNRI + tramadol (very common — tramadol has serotonergic properties)",
          "SSRI + linezolid (antibiotic with MAO inhibition)",
          "SSRI + triptans, methylene blue, or fentanyl",
          "MAOI + any serotonergic agent — most severe cases",
        ],
      },
    ],
    pearl:"Serotonin syndrome is a clinical diagnosis — no confirmatory lab test exists. Distinguish from NMS: SS has hyperreflexia + clonus + rapid onset (hours); NMS has lead-pipe rigidity + bradyreflexia + gradual onset (days) after antipsychotic exposure.",
  },
  {
    id:"nms", name:"Neuroleptic Malignant Syndrome", icon:"🧠", color:T.blue,
    alert:"NMS can be fatal — aggressive supportive care, ICU admission, immediate antipsychotic discontinuation",
    sections:[
      {
        label:"Diagnosis (all 4 features)", color:T.blue, items:[
          "Hyperthermia (temperature >38°C on two occasions)",
          "Rigidity ('lead-pipe' — different from SS clonus)",
          "Altered mental status",
          "Autonomic instability (labile BP, diaphoresis, tachycardia)",
        ],
      },
      {
        label:"Treatment", color:T.orange, items:[
          "Discontinue ALL antipsychotics and dopamine-blocking agents immediately",
          "Aggressive cooling — evaporative cooling, ice packs, cooling blankets",
          "Dantrolene 1–2.5 mg/kg IV q6h for severe rigidity or hyperthermia",
          "Bromocriptine 2.5 mg PO/NG TID (dopamine agonist) for mild cases",
          "Benzodiazepines for agitation; avoid physical restraints",
        ],
      },
      {
        label:"Monitoring / Complications", color:T.red, items:[
          "CK levels q6–8h — rhabdomyolysis risk, aggressive IVF",
          "BMP — AKI from myoglobinuria, hyperkalemia",
          "Prolonged ICU course — days to weeks for resolution",
          "Mortality without treatment: 10–20%",
        ],
      },
    ],
    pearl:"NMS onset is days after starting or increasing antipsychotic dose. SS onset is hours after drug combination. NMS = rigidity + bradyreflexia; SS = clonus + hyperreflexia. Both are medical emergencies with different antidotes.",
  },
  {
    id:"cholinergic", name:"Organophosphate / Cholinergic", icon:"☠️", color:T.green,
    alert:"SLUDGE + DUMBELS = cholinergic toxidrome — atropine first, no ceiling dose",
    sections:[
      {
        label:"Toxidrome Recognition (SLUDGE)", color:T.green, items:[
          "Salivation, Lacrimation, Urination, Defecation, GI cramps, Emesis",
          "Bradycardia, bronchorrhea, bronchospasm — the life-threatening triad",
          "Miosis (pinpoint pupils) — highly characteristic",
          "Muscle weakness, fasciculations, paralysis — nicotinic effects",
        ],
      },
      {
        label:"Treatment", color:T.orange, items:[
          "Remove contaminated clothing, decontaminate skin with soap/water (PPE for staff)",
          "Atropine 2–4 mg IV q5–10 min — titrate to drying of secretions (not heart rate)",
          "Pralidoxime (2-PAM) 1–2g IV over 30 min with atropine — for organophosphates",
          "Benzodiazepines for seizures",
          "Succinylcholine: CONTRAINDICATED (pseudocholinesterase inhibition = prolonged paralysis)",
        ],
      },
      {
        label:"Sources", color:T.blue, items:[
          "Pesticides (malathion, parathion, chlorpyrifos) — most common worldwide",
          "Nerve agents (sarin, VX, novichok) — mass casualty event",
          "Carbamates (aldicarb, carbaryl) — similar but no pralidoxime needed",
          "Some mushrooms (Clitocybe, Inocybe species) — muscarinic syndrome",
        ],
      },
    ],
    pearl:"Military / first responder auto-injectors: atropine 2 mg + pralidoxime 600 mg IM (DuoDote). In nerve agent mass casualty: use auto-injectors aggressively. Atropine titration endpoint is always DRY secretions — not heart rate.",
  },
  {
    id:"anticholinergic", name:"Anticholinergic Toxidrome", icon:"🫦", color:T.gold,
    alert:"Hot, dry, blind, mad, red, full — classic presentation. Physostigmine ONLY if pure anticholinergic.",
    sections:[
      {
        label:"Toxidrome Recognition", color:T.gold, items:[
          "Hot as a hare (hyperthermia)",
          "Dry as a bone (dry skin, dry mucous membranes, urinary retention)",
          "Blind as a bat (mydriasis, blurred vision)",
          "Mad as a hatter (delirium, hallucinations, agitation)",
          "Red as a beet (flushing)",
          "Full as a flask (urinary retention, decreased bowel sounds)",
        ],
      },
      {
        label:"Common Sources", color:T.orange, items:[
          "Diphenhydramine (Benadryl) — most common in OD",
          "Tricyclic antidepressants — MIXED picture, physostigmine CONTRAINDICATED",
          "Atropine, scopolamine, ipratropium",
          "Jimsonweed (Datura stramonium), deadly nightshade",
        ],
      },
      {
        label:"Treatment", color:T.teal, items:[
          "Supportive: IVF, cooling, BZD for agitation — first line",
          "Physostigmine 1–2 mg IV over 5 min for PURE anticholinergic (no TCA)",
          "Foley catheter for urinary retention",
          "Cool environment, ice packs for hyperthermia",
          "Avoid restraints — worsen hyperthermia",
        ],
      },
    ],
    pearl:"Never give physostigmine without ruling out TCA co-ingestion — check QRS width and R in aVR. If any doubt exists about TCA involvement, do not give physostigmine. Benzodiazepines are safe for all anticholinergic agitation.",
  },
  {
    id:"salicylate", name:"Salicylate Toxicity", icon:"🌡️", color:T.coral,
    alert:"Mixed respiratory alkalosis + anion gap metabolic acidosis = salicylate until proven otherwise",
    sections:[
      {
        label:"Immediate Steps", color:T.coral, items:[
          "Salicylate level (toxic >30 mg/dL; severe >80–100 mg/dL)",
          "ABG — classic: respiratory alkalosis + metabolic acidosis",
          "BMP: glucose (hypoglycemia), K+ (hypokalemia worsens toxicity)",
          "Serial levels q2h — levels may continue to rise with enteric-coated aspirin",
        ],
      },
      {
        label:"Antidote / Treatment", color:T.orange, items:[
          "Sodium bicarbonate infusion: target urine pH 7.5–8.0 (alkaline urine traps ionized salicylate)",
          "Maintain serum pH 7.45–7.55 — do NOT intubate unless absolutely necessary",
          "Aggressive fluid + potassium replacement — hypokalemia prevents urine alkalinization",
          "Dextrose even if euglycemic — CNS glucose depletion despite normal serum glucose",
        ],
      },
      {
        label:"Hemodialysis Indications", color:T.red, items:[
          "Level >100 mg/dL (acute) or >60 mg/dL (chronic)",
          "Renal failure preventing elimination",
          "Severe CNS symptoms: seizures, coma, altered mental status",
          "Pulmonary edema or hemodynamic instability",
        ],
      },
    ],
    pearl:"NEVER intubate a spontaneously breathing salicylate patient without immediately achieving hyperventilation on the ventilator (pH 7.45+). Loss of spontaneous respiratory alkalosis in a mechanically ventilated patient is rapidly fatal in severe salicylate toxicity.",
  },
  {
    id:"methanol_eg", name:"Methanol / Ethylene Glycol", icon:"🧪", color:T.cyan,
    alert:"High anion gap + high osmol gap + visual symptoms = methanol until proven otherwise",
    sections:[
      {
        label:"Distinguishing Features", color:T.cyan, items:[
          "Methanol: visual disturbance (blurry vision, scotoma, blindness), fundus: disc hyperemia",
          "Ethylene glycol: flank pain, calcium oxalate crystals in urine, renal failure",
          "Both: elevated anion gap metabolic acidosis, elevated osmol gap early",
          "Osmol gap = measured − calculated osmolality; >10 suggests toxic alcohol",
        ],
      },
      {
        label:"Treatment", color:T.orange, items:[
          "Fomepizole (4-MP) 15 mg/kg IV loading dose — first-line, give empirically",
          "Ethanol infusion if fomepizole unavailable: target level 100–150 mg/dL",
          "Hemodialysis for: level >50 mg/dL, severe acidosis (pH <7.2), visual symptoms",
          "Folate 50 mg IV q4h (methanol) — cofactor for formate metabolism",
          "Thiamine 100 mg IV + pyridoxine for ethylene glycol — promotes non-toxic metabolism",
        ],
      },
      {
        label:"Do Not Miss", color:T.red, items:[
          "Osmol gap is NORMAL late in toxicity — metabolites already formed",
          "Do not reassure if osmol gap is closing — anion gap rising = metabolic conversion",
          "Methanol: optic nerve damage is irreversible — early fomepizole is vision-preserving",
          "Both: ethanol ingestion raises osmol gap independently — confounds calculation",
        ],
      },
    ],
    pearl:"The osmol gap is high EARLY (parent compound) and the anion gap is high LATE (toxic metabolites). A patient with a normal osmol gap but high anion gap acidosis may have late-presenting methanol or EG poisoning — do not be falsely reassured.",
  },
];

// ── TOXIDROMES TABLE ──────────────────────────────────────────────────────────
const TOXIDROMES = [
  {
    name:"Opioid",       color:T.purple,
    pupils:"Miosis (pinpoint)", ms:"Sedation / coma",
    vitals:"Bradycardia, hypotension, bradypnea", skin:"Normal",
    other:"Respiratory depression, decreased bowel sounds",
    treatment:"Naloxone",
  },
  {
    name:"Sympathomimetic", color:T.red,
    pupils:"Mydriasis",     ms:"Agitation, psychosis",
    vitals:"Tachycardia, hypertension, hyperthermia", skin:"Diaphoretic",
    other:"Tremor, seizures, rhabdomyolysis",
    treatment:"BZD, cooling, supportive",
  },
  {
    name:"Cholinergic",   color:T.green,
    pupils:"Miosis",       ms:"Agitation then sedation",
    vitals:"Bradycardia, bronchorrhea, bronchospasm", skin:"Diaphoretic",
    other:"SLUDGE, fasciculations, urination",
    treatment:"Atropine, pralidoxime",
  },
  {
    name:"Anticholinergic", color:T.gold,
    pupils:"Mydriasis (dilated)", ms:"Delirium, hallucinations",
    vitals:"Tachycardia, hyperthermia", skin:"Dry, flushed",
    other:"Urinary retention, decreased bowel sounds",
    treatment:"BZD, physostigmine (pure only)",
  },
  {
    name:"Sedative-Hypnotic", color:T.blue,
    pupils:"Normal or miosis", ms:"Sedation, ataxia",
    vitals:"Normal or mild bradycardia", skin:"Normal",
    other:"Slurred speech, nystagmus, hypothermia",
    treatment:"Supportive, flumazenil (BZD only, caution)",
  },
  {
    name:"Serotonin Syndrome", color:T.coral,
    pupils:"Mydriasis",    ms:"Agitation, confusion",
    vitals:"Tachycardia, hyperthermia", skin:"Diaphoretic",
    other:"Clonus, hyperreflexia, tremor, diarrhea",
    treatment:"Cyproheptadine, BZD, cooling",
  },
];

// ── Rumack-Matthew nomogram zones ─────────────────────────────────────────────
const RM_LINE = [
  [4, 150], [5, 120], [6, 99], [7, 83], [8, 70], [9, 60],
  [10, 51], [11, 44], [12, 38], [13, 32], [14, 28], [15, 24],
  [16, 21], [17, 18], [18, 16], [19, 14], [20, 12], [21, 10],
  [22, 9],  [23, 8],  [24, 7],
];

function rmTreatmentThreshold(hours) {
  const h = parseFloat(hours);
  if (isNaN(h) || h < 4)  return null;
  if (h > 24)             return 7;
  const exact = RM_LINE.find(p => p[0] === Math.round(h));
  if (exact) return exact[1];
  const lo = RM_LINE.filter(p => p[0] <= h).pop();
  const hi = RM_LINE.find(p => p[0] > h);
  if (!lo || !hi) return null;
  const t  = (h - lo[0]) / (hi[0] - lo[0]);
  return Math.round(lo[1] + t * (hi[1] - lo[1]));
}

// ── Small reusable components ─────────────────────────────────────────────────
function Bullet({ text, color }) {
  return (
    <div style={{ display:"flex", gap:6, alignItems:"flex-start", marginBottom:3 }}>
      <span style={{ color:color||T.teal, fontSize:7, marginTop:3, flexShrink:0 }}>▸</span>
      <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
        color:T.txt3, lineHeight:1.55 }}>{text}</span>
    </div>
  );
}

function TabBtn({ id, label, activeId, setActiveId, color }) {
  const active = activeId === id;
  return (
    <button onClick={() => setActiveId(id)}
      style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600,
        fontSize:12, padding:"7px 14px", borderRadius:9,
        cursor:"pointer", transition:"all .15s",
        border:`1px solid ${active ? (color||T.teal)+"66" : "rgba(26,53,85,0.4)"}`,
        background:active
          ? `linear-gradient(135deg,${color||T.teal}18,${color||T.teal}06)`
          : "transparent",
        color:active ? (color||T.teal) : T.txt4 }}>
      {label}
    </button>
  );
}

// ── Antidote card ─────────────────────────────────────────────────────────────
function AntidoteCard({ a, expanded, onToggle }) {
  const urgCol = a.urgency==="immediate" ? T.red
    : a.urgency==="caution" ? T.gold : T.orange;
  return (
    <div style={{ marginBottom:6, borderRadius:10, overflow:"hidden",
      border:`1px solid ${expanded ? a.color+"55" : "rgba(26,53,85,0.4)"}`,
      borderLeft:`3px solid ${a.color}` }}>
      <div onClick={onToggle}
        style={{ display:"flex", alignItems:"center", gap:10,
          padding:"9px 12px", cursor:"pointer",
          background:`linear-gradient(135deg,${a.color}09,rgba(8,22,40,0.9))` }}>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontFamily:"'Playfair Display',serif",
              fontWeight:700, fontSize:13, color:a.color }}>
              {a.antidote}
            </span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:urgCol, letterSpacing:1, textTransform:"uppercase",
              background:`${urgCol}12`, border:`1px solid ${urgCol}35`,
              borderRadius:4, padding:"1px 6px" }}>
              {a.urgency}
            </span>
          </div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
            color:T.txt4, marginTop:1 }}>Antidote for: {a.toxin}</div>
        </div>
        <span style={{ fontSize:10, color:T.txt4 }}>{expanded?"▲":"▼"}</span>
      </div>
      {expanded && (
        <div style={{ padding:"10px 12px",
          borderTop:"1px solid rgba(26,53,85,0.3)" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr",
            gap:8, marginBottom:8 }}>
            {[
              { label:"Route", val:a.route, color:T.blue   },
              { label:"Dosing", val:a.dosing, color:a.color },
              { label:"Timing", val:a.timing, color:T.gold  },
            ].map(f => (
              <div key={f.label}
                style={{ padding:"7px 9px", borderRadius:7,
                  background:`${f.color}08`,
                  border:`1px solid ${f.color}22`,
                  gridColumn:f.label==="Dosing"?"1/-1":"auto" }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:8, color:f.color, letterSpacing:1,
                  textTransform:"uppercase", marginBottom:4 }}>{f.label}</div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                  color:T.txt2, lineHeight:1.6 }}>{f.val}</div>
              </div>
            ))}
          </div>
          <div style={{ padding:"7px 10px", borderRadius:7,
            background:`${T.purple}08`, border:`1px solid ${T.purple}22` }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace",
              fontSize:8, color:T.purple, letterSpacing:1,
              textTransform:"uppercase" }}>💎 Pearl: </span>
            <span style={{ fontFamily:"'DM Sans',sans-serif",
              fontSize:11, color:T.txt2 }}>{a.pearls}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Protocol card ─────────────────────────────────────────────────────────────
function ProtocolCard({ proto, expanded, onToggle }) {
  return (
    <div style={{ marginBottom:6, borderRadius:10, overflow:"hidden",
      border:`1px solid ${expanded ? proto.color+"55" : "rgba(26,53,85,0.4)"}`,
      borderTop:`3px solid ${proto.color}` }}>
      <div onClick={onToggle}
        style={{ display:"flex", alignItems:"center", gap:10,
          padding:"10px 12px", cursor:"pointer",
          background:`linear-gradient(135deg,${proto.color}0a,rgba(8,22,40,0.92))` }}>
        <span style={{ fontSize:18 }}>{proto.icon}</span>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:"'Playfair Display',serif",
            fontWeight:700, fontSize:13, color:proto.color }}>
            {proto.name}
          </div>
          {!expanded && (
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
              color:T.txt4, marginTop:1 }}>{proto.alert}</div>
          )}
        </div>
        <span style={{ fontSize:10, color:T.txt4 }}>{expanded?"▲":"▼"}</span>
      </div>
      {expanded && (
        <div style={{ padding:"0 12px 12px" }}>
          <div style={{ padding:"7px 10px", borderRadius:7, marginBottom:10,
            background:`${T.red}08`, border:`1px solid ${T.red}28` }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace",
              fontSize:8, color:T.red, letterSpacing:1,
              textTransform:"uppercase" }}>⚡ Alert: </span>
            <span style={{ fontFamily:"'DM Sans',sans-serif",
              fontSize:11, color:T.txt2 }}>{proto.alert}</span>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr",
            gap:8, marginBottom:8 }}>
            {proto.sections.map((sec, i) => (
              <div key={i} style={{ padding:"8px 10px", borderRadius:8,
                background:`${sec.color}08`,
                border:`1px solid ${sec.color}22` }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:8, color:sec.color, letterSpacing:1.3,
                  textTransform:"uppercase", marginBottom:6,
                  paddingBottom:4, borderBottom:`1px solid ${sec.color}22` }}>
                  {sec.label}
                </div>
                {sec.items.map((item, j) => (
                  <Bullet key={j} text={item} color={sec.color} />
                ))}
              </div>
            ))}
          </div>
          <div style={{ padding:"7px 10px", borderRadius:7,
            background:`${T.gold}08`, border:`1px solid ${T.gold}22` }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace",
              fontSize:8, color:T.gold, letterSpacing:1,
              textTransform:"uppercase" }}>💎 Pearl: </span>
            <span style={{ fontFamily:"'DM Sans',sans-serif",
              fontSize:11, color:T.txt2 }}>{proto.pearl}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────
export default function ToxicologyHub({ embedded = false, demo, cc, vitals }) {
  const navigate = useNavigate();
  const [mainTab,  setMainTab]  = useState("antidotes");
  const [expanded, setExpanded] = useState(null);
  const [search,   setSearch]   = useState("");

  const [apapHours, setApapHours] = useState("");
  const [apapLevel, setApapLevel] = useState("");

  const toggle = useCallback((id) =>
    setExpanded(p => p === id ? null : id), []);

  const filteredAntidotes = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return ANTIDOTES;
    return ANTIDOTES.filter(a =>
      a.antidote.toLowerCase().includes(q) ||
      a.toxin.toLowerCase().includes(q)
    );
  }, [search]);

  const filteredProtocols = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return PROTOCOLS;
    return PROTOCOLS.filter(p => p.name.toLowerCase().includes(q));
  }, [search]);

  const rmThreshold = useMemo(() => rmTreatmentThreshold(apapHours), [apapHours]);
  const apapResult  = useMemo(() => {
    const h = parseFloat(apapHours);
    const l = parseFloat(apapLevel);
    if (isNaN(h) || isNaN(l) || h < 4) return null;
    const thresh = rmTreatmentThreshold(h);
    if (!thresh) return null;
    return { threshold: thresh, treat: l >= thresh, level: l, hours: h };
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

      <div style={{ maxWidth:1200, margin:"0 auto",
        padding: embedded ? "0" : "0 16px" }}>

        {!embedded && (
          <div style={{ padding:"18px 0 14px" }}>
            <button onClick={() => navigate("/hub")}
              style={{ marginBottom:10,
                display:"inline-flex", alignItems:"center", gap:7,
                fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600,
                background:"rgba(14,37,68,0.7)",
                border:"1px solid rgba(42,79,122,0.5)",
                borderRadius:8, padding:"5px 14px",
                color:T.txt3, cursor:"pointer" }}>
              ← Back to Hub
            </button>
            <div style={{ display:"flex", alignItems:"center",
              gap:10, marginBottom:8 }}>
              <div style={{ background:"rgba(5,15,30,0.9)",
                border:"1px solid rgba(42,79,122,0.6)",
                borderRadius:10, padding:"5px 12px",
                display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:10, color:T.purple, letterSpacing:3 }}>NOTRYA</span>
                <span style={{ color:T.txt4, fontFamily:"'JetBrains Mono',monospace",
                  fontSize:10 }}>/</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:10, color:T.txt3, letterSpacing:2 }}>TOX</span>
              </div>
              <div style={{ height:1, flex:1,
                background:"linear-gradient(90deg,rgba(255,107,107,0.5),transparent)" }} />
            </div>
            <h1 className="shimmer-text"
              style={{ fontFamily:"'Playfair Display',serif",
                fontSize:"clamp(22px,4vw,38px)", fontWeight:900,
                letterSpacing:-0.5, lineHeight:1.1 }}>
              Toxicology Hub
            </h1>
            <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
              color:T.txt4, marginTop:4 }}>
              {ANTIDOTES.length} Antidotes · {PROTOCOLS.length} Ingestion Protocols ·
              Rumack-Matthew Nomogram · Toxidrome Recognition · Poison Control
            </p>
          </div>
        )}

        {embedded && (
          <div style={{ display:"flex", alignItems:"center",
            gap:8, marginBottom:12 }}>
            <span style={{ fontFamily:"'Playfair Display',serif",
              fontWeight:700, fontSize:15, color:T.coral }}>
              Toxicology Reference
            </span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:T.txt4, letterSpacing:1.5, textTransform:"uppercase",
              background:"rgba(255,107,107,0.1)",
              border:"1px solid rgba(255,107,107,0.25)",
              borderRadius:4, padding:"2px 7px" }}>
              {ANTIDOTES.length} antidotes
            </span>
          </div>
        )}

        <div style={{ display:"flex", gap:5, flexWrap:"wrap",
          padding:"6px", background:"rgba(8,22,40,0.7)",
          border:"1px solid rgba(26,53,85,0.4)",
          borderRadius:12, marginBottom:12 }}>
          {TABS.map(t => (
            <TabBtn key={t.id} id={t.id} label={t.label}
              activeId={mainTab} setActiveId={setMainTab}
              color={t.color} />
          ))}
        </div>

        {(mainTab === "antidotes" || mainTab === "protocols") && (
          <div style={{ marginBottom:10 }}>
            <input type="text" value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={mainTab==="antidotes"
                ? "Search antidotes or toxins..."
                : "Search protocols..."}
              style={{ width:"100%", padding:"8px 14px",
                background:"rgba(14,37,68,0.8)",
                border:`1px solid ${search ? "rgba(255,107,107,0.5)" : "rgba(42,79,122,0.35)"}`,
                borderRadius:20, outline:"none",
                fontFamily:"'DM Sans',sans-serif", fontSize:12,
                color:T.txt }} />
          </div>
        )}

        {mainTab === "antidotes" && (
          <div className="tox-fade">
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:T.txt4, letterSpacing:1.5, textTransform:"uppercase",
              marginBottom:8 }}>
              {filteredAntidotes.length} antidotes — tap to expand dosing
            </div>
            {filteredAntidotes.map(a => (
              <AntidoteCard key={a.antidote} a={a}
                expanded={expanded === a.antidote}
                onToggle={() => toggle(a.antidote)} />
            ))}
            {filteredAntidotes.length === 0 && (
              <div style={{ padding:"24px", textAlign:"center",
                background:"rgba(8,22,40,0.6)",
                border:"1px solid rgba(26,53,85,0.35)",
                borderRadius:10,
                fontFamily:"'DM Sans',sans-serif", fontSize:12,
                color:T.txt4 }}>
                No antidotes matching "{search}"
              </div>
            )}
          </div>
        )}

        {mainTab === "protocols" && (
          <div className="tox-fade">
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:T.txt4, letterSpacing:1.5, textTransform:"uppercase",
              marginBottom:8 }}>
              {filteredProtocols.length} ingestion protocols — tap to expand
            </div>
            {filteredProtocols.map(p => (
              <ProtocolCard key={p.id} proto={p}
                expanded={expanded === p.id}
                onToggle={() => toggle(p.id)} />
            ))}
          </div>
        )}

        {mainTab === "nomogram" && (
          <div className="tox-fade">
            <div style={{ padding:"12px 14px", borderRadius:10, marginBottom:12,
              background:"rgba(255,159,67,0.07)",
              border:"1px solid rgba(255,159,67,0.3)" }}>
              <div style={{ fontFamily:"'Playfair Display',serif",
                fontWeight:700, fontSize:14, color:T.orange, marginBottom:4 }}>
                Rumack-Matthew Nomogram
              </div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                color:T.txt3, lineHeight:1.6 }}>
                Determines NAC treatment threshold for acute single-ingestion APAP overdose.
                Level must be drawn ≥4h post-ingestion. Not valid for: chronic ingestion,
                extended-release formulations, unknown ingestion time, or staggered doses.
              </div>
            </div>

            <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:12 }}>
              <div style={{ flex:1, minWidth:150 }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                  color:T.txt4, letterSpacing:1.3, textTransform:"uppercase",
                  marginBottom:4 }}>Hours Since Ingestion</div>
                <input type="number" value={apapHours}
                  onChange={e => setApapHours(e.target.value)}
                  placeholder="e.g. 6" min="4" max="24"
                  style={{ width:"100%", padding:"9px 12px",
                    background:"rgba(14,37,68,0.75)",
                    border:`1px solid ${apapHours ? T.orange+"55" : "rgba(42,79,122,0.4)"}`,
                    borderRadius:8, outline:"none",
                    fontFamily:"'JetBrains Mono',monospace", fontSize:18,
                    fontWeight:700, color:T.orange }} />
              </div>
              <div style={{ flex:1, minWidth:150 }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                  color:T.txt4, letterSpacing:1.3, textTransform:"uppercase",
                  marginBottom:4 }}>APAP Level (mcg/mL)</div>
                <input type="number" value={apapLevel}
                  onChange={e => setApapLevel(e.target.value)}
                  placeholder="e.g. 180"
                  style={{ width:"100%", padding:"9px 12px",
                    background:"rgba(14,37,68,0.75)",
                    border:`1px solid ${apapLevel ? T.teal+"55" : "rgba(42,79,122,0.4)"}`,
                    borderRadius:8, outline:"none",
                    fontFamily:"'JetBrains Mono',monospace", fontSize:18,
                    fontWeight:700, color:T.teal }} />
              </div>
            </div>

            {rmThreshold && !apapResult && (
              <div style={{ padding:"10px 14px", borderRadius:9,
                background:"rgba(42,79,122,0.1)",
                border:"1px solid rgba(42,79,122,0.3)", marginBottom:10 }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:9, color:T.txt4, letterSpacing:1, marginBottom:3 }}>
                  TREATMENT THRESHOLD AT {apapHours}h
                </div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:24, fontWeight:700, color:T.orange }}>
                  {rmThreshold} mcg/mL
                </div>
                <div style={{ fontFamily:"'DM Sans',sans-serif",
                  fontSize:11, color:T.txt4, marginTop:2 }}>
                  Treat if APAP level ≥{rmThreshold} mcg/mL at {apapHours}h post-ingestion
                </div>
              </div>
            )}

            {apapResult && (
              <div style={{ padding:"14px 16px", borderRadius:10,
                background:apapResult.treat
                  ? "linear-gradient(135deg,rgba(255,107,107,0.12),rgba(8,22,40,0.95))"
                  : "linear-gradient(135deg,rgba(61,255,160,0.1),rgba(8,22,40,0.95))",
                border:`2px solid ${apapResult.treat ? T.coral+"66" : T.green+"66"}`,
                marginBottom:12 }}>
                <div style={{ display:"flex", alignItems:"center",
                  gap:12, marginBottom:8 }}>
                  <div style={{ fontSize:28 }}>
                    {apapResult.treat ? "⚠️" : "✅"}
                  </div>
                  <div>
                    <div style={{ fontFamily:"'Playfair Display',serif",
                      fontWeight:700, fontSize:18,
                      color:apapResult.treat ? T.coral : T.green }}>
                      {apapResult.treat ? "TREAT WITH NAC" : "BELOW TREATMENT LINE"}
                    </div>
                    <div style={{ fontFamily:"'JetBrains Mono',monospace",
                      fontSize:10, color:T.txt3, marginTop:2 }}>
                      Level {apapResult.level} mcg/mL at {apapResult.hours}h ·
                      Threshold {apapResult.threshold} mcg/mL
                    </div>
                  </div>
                </div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
                  color:T.txt2, lineHeight:1.65 }}>
                  {apapResult.treat
                    ? "APAP level is at or above the Rumack-Matthew treatment line. Initiate IV NAC (3-bag protocol) immediately. Check LFTs and PT/INR. Continue NAC until APAP undetectable and LFTs trending down."
                    : "APAP level is below the treatment line. NAC is not indicated based on the nomogram. However — if ingestion time is uncertain, serial levels are still rising, or ALT is elevated, treat empirically."}
                </div>
              </div>
            )}

            <div style={{ padding:"10px 14px", borderRadius:10,
              background:"rgba(8,22,40,0.7)",
              border:"1px solid rgba(26,53,85,0.4)" }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:T.txt4, letterSpacing:1.5, textTransform:"uppercase",
                marginBottom:8 }}>
                Treatment Line Reference (key hours)
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {[[4,150],[6,99],[8,70],[10,51],[12,38],[16,21],[20,12],[24,7]].map(([h,l]) => (
                  <div key={h} style={{ padding:"5px 10px", borderRadius:6,
                    background:"rgba(255,159,67,0.08)",
                    border:"1px solid rgba(255,159,67,0.22)",
                    textAlign:"center" }}>
                    <div style={{ fontFamily:"'JetBrains Mono',monospace",
                      fontSize:8, color:T.txt4 }}>{h}h</div>
                    <div style={{ fontFamily:"'JetBrains Mono',monospace",
                      fontSize:13, fontWeight:700, color:T.orange }}>{l}</div>
                    <div style={{ fontFamily:"'JetBrains Mono',monospace",
                      fontSize:7, color:T.txt4 }}>mcg/mL</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop:10, fontFamily:"'DM Sans',sans-serif", fontSize:10,
                color:T.txt4, lineHeight:1.55 }}>
                This is the 150 mcg/mL at 4h nomogram line (original Rumack-Matthew).
                Some centers use a 100 mcg/mL line for higher-risk patients.
                If ingestion time is unknown, treat empirically.
              </div>
            </div>
          </div>
        )}

        {mainTab === "toxidromes" && (
          <div className="tox-fade">
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:T.txt4, letterSpacing:1.5, textTransform:"uppercase",
              marginBottom:10 }}>
              Classic Toxidrome Recognition
            </div>
            {TOXIDROMES.map(tox => (
              <div key={tox.name} style={{ marginBottom:7,
                padding:"10px 13px", borderRadius:9,
                background:"rgba(8,22,40,0.65)",
                border:`1px solid rgba(26,53,85,0.4)`,
                borderLeft:`4px solid ${tox.color}` }}>
                <div style={{ display:"flex", alignItems:"center",
                  gap:8, marginBottom:7, flexWrap:"wrap" }}>
                  <span style={{ fontFamily:"'Playfair Display',serif",
                    fontWeight:700, fontSize:13, color:tox.color }}>
                    {tox.name}
                  </span>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace",
                    fontSize:9, color:T.teal, background:"rgba(0,229,192,0.09)",
                    border:"1px solid rgba(0,229,192,0.3)",
                    borderRadius:4, padding:"1px 8px" }}>
                    Tx: {tox.treatment}
                  </span>
                </div>
                <div style={{ display:"grid",
                  gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",
                  gap:7 }}>
                  {[
                    { label:"Pupils",        val:tox.pupils, color:T.blue   },
                    { label:"Mental Status", val:tox.ms,     color:T.purple },
                    { label:"Vitals",        val:tox.vitals, color:T.coral  },
                    { label:"Skin",          val:tox.skin,   color:T.gold   },
                    { label:"Other",         val:tox.other,  color:T.teal   },
                  ].map(f => (
                    <div key={f.label} style={{ padding:"6px 8px",
                      background:`${f.color}09`,
                      border:`1px solid ${f.color}22`,
                      borderRadius:7 }}>
                      <div style={{ fontFamily:"'JetBrains Mono',monospace",
                        fontSize:7, color:f.color, letterSpacing:1,
                        textTransform:"uppercase", marginBottom:3 }}>
                        {f.label}
                      </div>
                      <div style={{ fontFamily:"'DM Sans',sans-serif",
                        fontSize:10, color:T.txt3, lineHeight:1.4 }}>
                        {f.val}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {mainTab === "poison" && (
          <div className="tox-fade">
            {[
              {
                title:"US Poison Control Center",
                val:"1-800-222-1222",
                sub:"National 24/7 hotline — free, confidential",
                color:T.red, icon:"☎️", big:true,
              },
              {
                title:"CHEMTREC (hazmat / industrial)",
                val:"1-800-424-9300",
                sub:"24/7 chemical emergency response",
                color:T.orange, icon:"⚗️",
              },
              {
                title:"Toxicology Consult (in-hospital)",
                val:"Through poison control or pharmacist",
                sub:"Most centers provide physician-to-physician consult via poison control line",
                color:T.purple, icon:"🩺",
              },
              {
                title:"Antidote Stocking Verification",
                val:"Check your pharmacy",
                sub:"Critical antidotes to verify are stocked: fomepizole, hydroxocobalamin, digibind, physostigmine, Intralipid 20%, pralidoxime, methylene blue",
                color:T.gold, icon:"💊",
              },
            ].map(c => (
              <div key={c.title} style={{ padding:"13px 15px", borderRadius:10,
                marginBottom:8,
                background:`${c.color}0a`,
                border:`1px solid ${c.color}33`,
                borderLeft:`4px solid ${c.color}` }}>
                <div style={{ display:"flex", alignItems:"center",
                  gap:10, marginBottom:4 }}>
                  <span style={{ fontSize:20 }}>{c.icon}</span>
                  <span style={{ fontFamily:"'Playfair Display',serif",
                    fontWeight:700, fontSize:13, color:c.color }}>
                    {c.title}
                  </span>
                </div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize: c.big ? 22 : 14,
                  fontWeight:700, color:c.color, marginBottom:4 }}>
                  {c.val}
                </div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                  color:T.txt4, lineHeight:1.55 }}>{c.sub}</div>
              </div>
            ))}

            <div style={{ padding:"10px 13px", borderRadius:9, marginTop:4,
              background:"rgba(8,22,40,0.6)",
              border:"1px solid rgba(26,53,85,0.35)" }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:T.txt4, letterSpacing:1.5, textTransform:"uppercase",
                marginBottom:7 }}>
                Critical Antidote Availability — Verify in Your Pharmacy
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                {["NAC (IV)", "Fomepizole", "Hydroxocobalamin", "Digibind/DigiFab",
                  "Physostigmine", "Intralipid 20%", "Pralidoxime (2-PAM)",
                  "Methylene Blue", "Atropine (large supply)", "Glucagon",
                  "Deferoxamine", "Protamine"].map(drug => (
                  <span key={drug} style={{ fontFamily:"'JetBrains Mono',monospace",
                    fontSize:8, padding:"3px 9px", borderRadius:4,
                    background:"rgba(42,79,122,0.2)",
                    border:"1px solid rgba(42,79,122,0.35)",
                    color:T.txt4 }}>{drug}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {!embedded && (
          <div style={{ textAlign:"center", padding:"24px 0 16px",
            fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, letterSpacing:1.5 }}>
            NOTRYA TOX HUB · FOR CLINICAL DECISION SUPPORT ONLY · VERIFY WITH POISON CONTROL AND TOXICOLOGY · LOCAL PROTOCOLS MAY DIFFER
          </div>
        )}
      </div>
    </div>
  );
}