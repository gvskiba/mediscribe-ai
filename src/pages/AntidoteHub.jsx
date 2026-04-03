import { useState } from "react";
import { useNavigate } from "react-router-dom";

(() => {
  if (document.getElementById("antidote-fonts")) return;
  const l = document.createElement("link"); l.id = "antidote-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "antidote-css";
  s.textContent = `
    @keyframes fadeSlide{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
    .ant-fade{animation:fadeSlide .22s ease forwards;}
    .ant-shimmer{background:linear-gradient(90deg,#e8f0fe 0%,#fff 30%,#3dffa0 52%,#00e5c0 72%,#e8f0fe 100%);background-size:250% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 5s linear infinite;}
    ::-webkit-scrollbar{width:3px;} ::-webkit-scrollbar-thumb{background:rgba(42,79,122,0.5);border-radius:2px;}
  `;
  document.head.appendChild(s);
})();

const T = {
  bg:"#050f1e", panel:"#081628",
  txt:"#e8f0fe", txt2:"#8aaccc", txt3:"#4a6a8a", txt4:"#2e4a6a",
  red:"#ff4444", coral:"#ff6b6b", orange:"#ff9f43",
  yellow:"#f5c842", green:"#3dffa0", teal:"#00e5c0",
  blue:"#3b9eff", purple:"#9b6dff", cyan:"#00d4ff",
};
const glass = {
  backdropFilter:"blur(24px) saturate(200%)",
  WebkitBackdropFilter:"blur(24px) saturate(200%)",
  background:"rgba(8,22,40,0.78)",
  border:"1px solid rgba(42,79,122,0.35)",
  borderRadius:14,
};

const ANTIDOTES = [
  {
    id:"acetaminophen", toxin:"Acetaminophen (Paracetamol)", icon:"💊", color:T.teal, category:"Hepatotoxin",
    urgency:"HIGH", mechanism:"Depletes hepatic glutathione → NAPQI accumulation → centrilobular necrosis",
    antidote:"N-Acetylcysteine (NAC)", dosing:[
      "IV Loading dose: 150 mg/kg in 200 mL D5W over 60 min",
      "2nd bag: 50 mg/kg in 500 mL D5W over 4 hours",
      "3rd bag: 100 mg/kg in 1000 mL D5W over 16 hours",
      "Total: ~300 mg/kg over 21 hours",
      "Oral NAC (if IV unavailable): 140 mg/kg loading, then 70 mg/kg q4h × 17 doses",
    ],
    indications:["Serum APAP level above Rumack-Matthew nomogram treatment line","Any patient with hepatotoxicity symptoms + APAP history","Unknown overdose presenting within 24h","Late presentation with ALT elevation + APAP history"],
    monitoring:["LFTs, INR, creatinine q8–12h","Serum APAP level at 4h post-ingestion","Watch for anaphylactoid reaction to IV NAC (slow infusion rate)","Rumack-Matthew nomogram — use for acute single ingestion timing"],
    endpoints:["Continue until: APAP undetectable AND INR <2 AND ALT declining","Extended therapy if ALT still rising at 21h","Transplant criteria: King's College Criteria (pH <7.3, INR >6.5, Cr >3.4, grade III–IV encephalopathy)"],
    pearl:"NAC is most effective within 8h of ingestion (>98% hepatotoxicity prevention). Still give even >24h with hepatotoxicity. Anaphylactoid reactions: slow infusion to 1 mg/kg/min.",
    pitfall:"Do NOT use Rumack nomogram for staggered or chronic overdose — treat empirically. Fomepizole is NOT indicated.",
  },
  {
    id:"opioids", toxin:"Opioids (Heroin, Fentanyl, Oxycodone, Methadone)", icon:"💉", color:T.orange, category:"CNS Depressant",
    urgency:"CRITICAL", mechanism:"Mu-opioid receptor agonism → CNS/respiratory depression → apnea",
    antidote:"Naloxone (Narcan)", dosing:[
      "Respiratory arrest: 0.4–2 mg IV/IM/IN q2–3 min (titrate to adequate respiration)",
      "Partial overdose: 0.04–0.1 mg IV titrated (avoid precipitating acute withdrawal)",
      "IN route: 4 mg per nostril (standard for prehospital / lay responder)",
      "High-potency opioids (fentanyl, carfentanil): may need 4–10 mg total",
      "Infusion: 2/3 of effective bolus dose per hour in D5W (for methadone, long-acting agents)",
    ],
    indications:["Opioid toxidrome: miosis + CNS depression + respiratory depression","Apnea with suspected opioid use","Coma of unknown etiology (empiric trial reasonable)"],
    monitoring:["Respiratory rate, O2 sat continuously","Duration of action 30–90 min — shorter than most opioids (re-narcotization risk!)","Watch for pulmonary edema post-reversal","Repeat doses q2–3 min until respiratory rate >12 or SpO2 >94%"],
    endpoints:["Goal: adequate respirations — NOT full reversal (avoids precipitated withdrawal + agitation)","Discharge criteria: alert × 4h after last naloxone dose, no re-sedation"],
    pearl:"Fentanyl and carfentanil require MUCH higher doses. Duration of action of naloxone (30–90 min) is SHORTER than most opioids — admit and observe or infuse. Infusion rate = 2/3 effective reversal bolus/hour.",
    pitfall:"Naloxone does NOT reverse benzodiazepines. Miosis + sedation without respiratory depression may not need naloxone. Buprenorphine is partially reversed — higher doses needed.",
  },
  {
    id:"benzodiazepines", toxin:"Benzodiazepines", icon:"😴", color:T.blue, category:"CNS Depressant",
    urgency:"MODERATE", mechanism:"GABA-A potentiation → CNS depression (rarely fatal in isolation)",
    antidote:"Flumazenil (rarely indicated)", dosing:[
      "0.2 mg IV over 30 sec — repeat 0.2 mg q60 sec up to 1 mg total",
      "If no response at 1 mg: consider other etiologies",
      "Max 3 mg in 1 hour",
      "Duration: 30–60 min — re-sedation common",
    ],
    indications:["Reversal of procedural sedation (conscious sedation reversal ONLY)","Diagnosis of benzodiazepine overdose in select patients — NOT routine"],
    monitoring:["Re-sedation within 30–60 min — observe ≥2h post-administration","Watch for seizures in dependent patients or mixed overdose"],
    endpoints:["Rarely used in overdose — supportive care is standard","DO NOT use if: seizure disorder, chronic BZD user, mixed overdose (e.g. + TCA)"],
    pearl:"Flumazenil is CONTRAINDICATED in chronic BZD users (precipitates refractory seizures), known seizure disorder, or if TCA co-ingestion. Supportive care + airway management is the preferred approach in BZD overdose.",
    pitfall:"Flumazenil does NOT reverse other sedatives (barbiturates, alcohols, opioids). If patient seizes post-flumazenil — diazepam won't work; use barbiturates or propofol.",
  },
  {
    id:"tca", toxin:"Tricyclic Antidepressants (Amitriptyline, Imipramine, Nortriptyline)", icon:"⚡", color:T.red, category:"Cardiac Toxin",
    urgency:"CRITICAL", mechanism:"Na-channel blockade (QRS widening) + anticholinergic + antihistamine + α1-blockade",
    antidote:"Sodium Bicarbonate", dosing:[
      "Bolus: 1–2 mEq/kg IV push — repeat q5 min until QRS <100 ms or pH 7.50–7.55",
      "Infusion: 3 amps NaHCO3 (150 mEq) in 1L D5W at 250 mL/h",
      "Target serum pH: 7.45–7.55 (alkalinization reduces Na-channel binding)",
      "Hypertonic saline (3% NaCl): alternative if bicarb fails — 1–2 mL/kg bolus",
      "Intralipid 20%: 1.5 mL/kg bolus if refractory cardiovascular collapse",
    ],
    indications:["QRS >100 ms with suspected TCA ingestion","Hypotension with TCA toxicity","Ventricular dysrhythmia (VT, VF) with TCA","Seizures with TCA (phenytoin is NOT effective)"],
    monitoring:["Continuous ECG — QRS duration, terminal R in aVR (>3mm is high-risk marker)","Serum pH every 30–60 min","Monitor K+ closely — alkalosis drives K+ intracellular"],
    endpoints:["QRS <100 ms and pH 7.45–7.55","Admit to monitored bed ≥12h, ICU if QRS >100ms","Asymptomatic with QRS <100ms at 6h may be discharge candidates"],
    pearl:"Terminal R in aVR >3mm is most sensitive/specific ECG marker for TCA toxicity. QRS widening is the primary toxicity driver — bicarb reverses Na-channel blockade. Avoid physostigmine (can worsen cardiac toxicity).",
    pitfall:"Avoid Class IA/IC antiarrhythmics (procainamide, flecainide — same mechanism = additive toxicity). Phenytoin is NOT effective for TCA seizures — use benzodiazepines + barbiturates.",
  },
  {
    id:"organophosphate", toxin:"Organophosphates & Carbamates (Pesticides, Nerve Agents)", icon:"☠️", color:T.green, category:"Cholinergic Toxin",
    urgency:"CRITICAL", mechanism:"Irreversible acetylcholinesterase inhibition → cholinergic crisis (SLUDGE/DUMBELS)",
    antidote:"Atropine + Pralidoxime (2-PAM)", dosing:[
      "ATROPINE: 2–4 mg IV q5–10 min until secretions dry (not for miosis/HR)",
      "Atropine endpoint: dry secretions, improved bronchospasm — may need 20–100+ mg in severe poisoning",
      "PRALIDOXIME (2-PAM): 1–2g IV over 15–30 min, then 200–400 mg/h infusion",
      "2-PAM must be given EARLY — reactivates AChE before 'aging' occurs (irreversible binding within hours)",
      "Nerve agents (sarin, VX): dual auto-injector (atropine + 2-PAM); repeat q5–10 min until secretion control",
    ],
    indications:["SLUDGE toxidrome: Salivation, Lacrimation, Urination, Defecation, GI distress, Emesis","Bronchospasm + secretions + miosis + bradycardia","Known/suspected OP pesticide or nerve agent exposure"],
    monitoring:["Secretion control (primary atropine endpoint — NOT heart rate)","RBC cholinesterase activity (more reliable than plasma)","Repeated dosing until secretions dried","Watch for QTc prolongation with severe toxicity"],
    endpoints:["Atropine: continue until bronchospasm and secretions controlled","2-PAM: continue 24–48h after atropine no longer needed","Carbamates: 2-PAM usually not required (spontaneous reactivation)"],
    pearl:"Atropine dose titration goal is DRY secretions — NOT heart rate or pupil size. Tachycardia ≠ atropine excess. Massive doses may be needed. 2-PAM must start within hours before irreversible 'aging' of AChE.",
    pitfall:"Carbamates spontaneously reactivate — 2-PAM may not be needed and is controversial. Morphine, succinylcholine, and theophylline are CONTRAINDICATED in OP poisoning.",
  },
  {
    id:"cyanide", toxin:"Cyanide (HCN, Smoke Inhalation, Nitroprusside)", icon:"🏭", color:T.purple, category:"Cellular Toxin",
    urgency:"CRITICAL", mechanism:"Cytochrome c oxidase inhibition → histotoxic hypoxia → cellular energy failure",
    antidote:"Hydroxocobalamin (Cyanokit) — First Line", dosing:[
      "HYDROXOCOBALAMIN: 5g IV over 15 min (severe); 70 mg/kg pediatric",
      "Repeat 5g q15 min × 2 if inadequate response (max 15g)",
      "Hydroxocobalamin binds CN → cyanocobalamin → excreted renally",
      "Alternative (if no hydroxocobalamin): Sodium Nitrite 300 mg (10 mL 3%) IV over 3–5 min",
      "THEN Sodium Thiosulfate: 12.5g (50 mL 25%) IV over 10 min immediately after nitrite",
      "Pediatric nitrite: 0.2 mL/kg of 3% solution based on Hgb (do NOT use standard adult dose)",
    ],
    indications:["Smoke inhalation + persistent hemodynamic instability despite O2","Altered mental status + lactic acidosis (AG gap) + normal SpO2","Known cyanide ingestion (industrial/lab exposure)","Prolonged nitroprusside infusion with toxicity signs"],
    monitoring:["Lactate (marker of toxicity — should normalize with treatment)","Blood pressure and mental status (rapid response expected)","Hydroxocobalamin turns urine/skin red/orange — expected, not harmful","CO level if smoke inhalation (co-treat with O2)"],
    endpoints:["Hemodynamic stabilization and mental status improvement","Lactate normalization","Hydroxocobalamin preferred in smoke inhalation — does NOT cause methemoglobinemia"],
    pearl:"Hydroxocobalamin is preferred over nitrite/thiosulfate in smoke inhalation because it does NOT induce methemoglobinemia (CO already reduces O2 carrying capacity). Cyanide should be suspected in any fire victim with persistent hemodynamic instability despite O2.",
    pitfall:"Nitrite/thiosulfate kit: sodium nitrite causes methemoglobinemia — contraindicated in CO poisoning (combined exposure worsens O2 delivery). Hydroxocobalamin interferes with colorimetric lab tests (falsely elevated Cr, bilirubin).",
  },
  {
    id:"beta_blocker", toxin:"Beta-Blocker Overdose (Propranolol, Metoprolol, Atenolol)", icon:"💔", color:T.coral, category:"Cardiovascular Toxin",
    urgency:"HIGH", mechanism:"β1/β2 blockade → bradycardia, heart block, hypotension, bronchospasm",
    antidote:"Glucagon + High-Dose Insulin (HDI) + Calcium + Intralipid", dosing:[
      "GLUCAGON: 3–10 mg IV bolus (non-cAMP pathway inotropy) → 3–5 mg/h infusion",
      "HIGH-DOSE INSULIN (HDI): Regular insulin 1 unit/kg bolus, then 0.5–1 unit/kg/h infusion",
      "HDI glucose: D50W bolus if glucose <200, then D10W infusion to maintain glucose 150–200",
      "CALCIUM CHLORIDE 10%: 1g IV q10–20 min (positive chronotropy/inotropy)",
      "INTRALIPID 20%: 1.5 mL/kg bolus over 2–3 min → 0.25 mL/kg/min infusion (lipophilic BB)",
      "ATROPINE: 0.5–1 mg IV (often insufficient but worth attempting)",
    ],
    indications:["Bradycardia + hypotension after BB ingestion","Heart block (any degree) with hemodynamic compromise","Refractory shock after BB OD"],
    monitoring:["Continuous ECG — HR, PR interval, QRS duration","Glucose q15–30 min (HDI causes hypoglycemia)","K+ closely — HDI drives hypokalemia","BP and mentation every 5–10 min in acute phase"],
    endpoints:["HR >60, MAP >65, improved mental status","HDI may take 15–45 min to reach full effect — be patient","ECMO for refractory cases (lipophilic BB: metoprolol, propranolol)"],
    pearl:"High-Dose Insulin (HDI) is now the cornerstone of BB AND CCB overdose — superior to glucagon in evidence. Insulin acts on myocardial carbohydrate metabolism (not adrenergic pathway). Glucagon often causes vomiting — prepare antiemetics.",
    pitfall:"Glucagon requires cAMP pathway — may fail in severe toxicity. Propranolol (lipophilic): also blocks Na-channels (QRS widens) → sodium bicarb may also be needed. Transvenous pacing has unreliable capture in severe BB toxicity.",
  },
  {
    id:"ccb", toxin:"Calcium Channel Blocker OD (Verapamil, Diltiazem, Amlodipine)", icon:"🫀", color:T.yellow, category:"Cardiovascular Toxin",
    urgency:"HIGH", mechanism:"L-type Ca2+ channel blockade → vasodilation + negative inotropy/chronotropy",
    antidote:"Calcium + High-Dose Insulin (HDI) + Intralipid", dosing:[
      "CALCIUM CHLORIDE 10%: 1–2g IV q5 min (up to 3–4 doses); infusion 0.2–0.4 mL/kg/h CaCl2",
      "HIGH-DOSE INSULIN (HDI): Regular insulin 1 unit/kg bolus → 0.5–2 units/kg/h infusion",
      "Glucose supplementation: target BG 150–200 mg/dL (D50 + D10 infusion)",
      "INTRALIPID 20%: 1.5 mL/kg bolus → 0.25 mL/kg/min × 60 min (especially amlodipine)",
      "ATROPINE: 0.5–1 mg IV for bradycardia (often insufficient)",
      "Methylene Blue 1–2 mg/kg IV: for refractory vasoplegia (experimental but used clinically)",
    ],
    indications:["Bradycardia + heart block + hypotension after CCB ingestion","Cardiogenic shock with CCB toxicity","Refractory vasodilatory shock (dihydropyridines — amlodipine)"],
    monitoring:["Glucose q15–30 min (HDI causes hypoglycemia)","K+ (HDI → hypokalemia)","Ionized calcium — do NOT give bicarb concurrently (precipitates)","ECG for AV block progression"],
    endpoints:["HR >60, MAP >65, improved CO","HDI: allow 30–60 min for full effect before escalating","Dihydropyridines (amlodipine): primarily vasodilatory — vasopressors + intralipid may be key"],
    pearl:"HDI + Calcium is the core treatment. Verapamil/diltiazem: predominantly cardiac (bradycardia/block). Amlodipine: predominantly vasodilatory — vasopressors + intralipid often needed. ECMO is life-saving in refractory cases.",
    pitfall:"Calcium does NOT reverse vasodilation from dihydropyridines well — need vasopressors. Do NOT give calcium + sodium bicarb in same line (precipitates). Digoxin-toxic patients: calcium is RELATIVELY contraindicated (worsen cardiac toxicity).",
  },
  {
    id:"methanol_ethylene", toxin:"Methanol & Ethylene Glycol", icon:"🧪", color:T.cyan, category:"Toxic Alcohol",
    urgency:"HIGH", mechanism:"ADH metabolizes to toxic metabolites: formic acid (methanol) or oxalic acid (EG) → high AG metabolic acidosis + organ damage",
    antidote:"Fomepizole (4-MP) — Preferred over Ethanol", dosing:[
      "FOMEPIZOLE: Loading 15 mg/kg IV over 30 min",
      "Then 10 mg/kg q12h × 4 doses",
      "Then 15 mg/kg q12h (induces own metabolism)",
      "Continue until levels undetectable AND pH normalized",
      "ETHANOL (alternative): 10% EtOH in D5W — load to achieve blood level 100–150 mg/dL, maintain 100 mg/dL",
      "HEMODIALYSIS: for pH <7.25, serum level >50 mg/dL (methanol) or >50 mg/dL (EG), renal failure, visual symptoms",
    ],
    indications:["Elevated anion gap metabolic acidosis + osmol gap","Suspected methanol: visual symptoms (snowfield vision), formate acidosis","Suspected EG: calcium oxalate crystals in urine, renal failure","Any patient with toxic alcohol ingestion — treat before levels confirmed"],
    monitoring:["Methanol/EG serum levels q4–6h (if available)","Anion gap and osmol gap serial measurements","Urine for oxalate crystals (EG)","Ophthalmology consult for methanol (optic disc edema)","Visual acuity serially for methanol"],
    endpoints:["Levels undetectable AND anion gap normalized","Folinic acid 1 mg/kg IV q4–6h for methanol (promotes formate metabolism)","Pyridoxine 100 mg IV + thiamine 100 mg IV for ethylene glycol (shunts metabolism away from oxalate)","Dialysis removes both parent compound and metabolites"],
    pearl:"Fomepizole (not ethanol) is now standard — no CNS depression, easy dosing, no glucose issues. Treat empirically before levels return if presentation is consistent. Osmol gap = measured osmolality − calculated osmolality (normal <10).",
    pitfall:"Normal osmol gap does NOT rule out toxic alcohol — metabolites are formed and gap closes as they accumulate. Visual symptoms in methanol are ominous — permanent blindness/death. Ethanol (alternative) is difficult to dose and causes CNS depression.",
  },
  {
    id:"digoxin", toxin:"Digoxin / Cardiac Glycosides (Oleander, Foxglove)", icon:"🌿", color:T.green, category:"Cardiac Glycoside",
    urgency:"HIGH", mechanism:"Na/K-ATPase inhibition → intracellular Ca2+ accumulation → bradycardia, heart block, automaticity",
    antidote:"Digoxin-Specific Fab Antibody Fragments (Digibind / DigiFab)", dosing:[
      "Known ingested dose: vials = (mg ingested × 0.8) / 0.5",
      "Known serum level: vials = (serum level ng/mL × weight kg) / 100",
      "Empiric (chronic toxicity): 3–6 vials IV over 30 min",
      "Empiric (acute overdose): 10–20 vials IV over 30 min (life-threatening dysrhythmia: push)",
      "Each vial = 40 mg Fab — binds ~0.5 mg digoxin",
      "Maximum: 20 vials for acute OD (400 mg total Fab)",
    ],
    indications:["Life-threatening dysrhythmia: VF, VT, complete heart block","Hyperkalemia K+ >5.5 mEq/L with digoxin toxicity","Hemodynamic instability (bradycardia + hypotension)","Elevated digoxin level with symptoms — chronic toxicity more common"],
    monitoring:["Serum digoxin level post-Fab falsely elevated (measures bound + unbound)","K+ — hypokalemia worsens toxicity; K+ normalizes with Fab","Continuous ECG monitoring × 12–24h","Renal function (slower Fab clearance in renal failure — may re-toxify)"],
    endpoints:["Hemodynamic stabilization, resolution of heart block","K+ normalized","Symptomatic bradycardia after Fab: temporary pacing (atropine usually ineffective)"],
    pearl:"Calcium is RELATIVELY CONTRAINDICATED in digoxin toxicity — calcium overload worsens cardiac toxicity ('stone heart'). Hypokalemia potentiates digoxin — correct K+ but avoid rapid shifts. Magnesium 2g IV is safe and may be useful for digoxin-toxic arrhythmias.",
    pitfall:"Post-Fab serum digoxin levels are unreliable — do NOT use for dosing decisions. In renal failure, Fab-digoxin complex may not be cleared → re-toxic days later. Phenytoin is an option for digoxin-induced VT (increases conduction velocity).",
  },
  {
    id:"iron", toxin:"Iron Overdose", icon:"🔩", color:T.orange, category:"Heavy Metal",
    urgency:"HIGH", mechanism:"Free iron → reactive oxygen species → GI, hepatic, and systemic toxicity in 5 stages",
    antidote:"Deferoxamine (Desferal)", dosing:[
      "IV: 15 mg/kg/h infusion (max 6g/day) — preferred route",
      "IM: 90 mg/kg (max 1g) if IV access unavailable — less effective",
      "Continue until: urine no longer 'vin rosé' pink AND iron level <350 mcg/dL AND asymptomatic",
      "Do NOT exceed 24h continuous infusion without reassessment (pulmonary toxicity risk)",
      "Whole bowel irrigation with PEG solution if pills visible on X-ray",
    ],
    indications:["Serum iron >350–500 mcg/dL","Symptomatic toxicity (lethargy, GI hemorrhage, hemodynamic instability)","Toxic screen: iron pills visible on abdominal X-ray","Ingestion >60 mg/kg elemental iron"],
    monitoring:["Serum iron at 4–6h post-ingestion (peak level)","Urine color — vin rosé (pink/orange) = deferoxamine binding iron (chelation occurring)","Glucose, electrolytes, LFTs, coags","Abdominal X-ray for pill burden (confirm clearance with WBI)"],
    endpoints:["Clear urine (no longer vin rosé) AND iron level normalizing","WBI endpoint: clear rectal effluent","Admission for all symptomatic patients"],
    pearl:"Stage 5 (liver failure) has >10% mortality. The 'vin rosé' urine sign is specific but not sensitive — absence does not exclude chelation effect. Deferoxamine > 24h → risk of pulmonary toxicity and ARDS.",
    pitfall:"Serum iron levels can be falsely low if deferoxamine already given. TIBC is NOT useful in acute OD. Exchange transfusion rarely needed. Activated charcoal does NOT bind iron effectively.",
  },
  {
    id:"heparin", toxin:"Heparin Overdose / Anticoagulant Reversal", icon:"🩸", color:T.red, category:"Anticoagulant",
    urgency:"HIGH", mechanism:"Potentiated antithrombin III activity → factor Xa and thrombin inhibition",
    antidote:"Protamine Sulfate", dosing:[
      "1 mg neutralizes ~100 units of UFH (given within 30 min of last heparin dose)",
      "If heparin given 30–60 min ago: 0.5–0.75 mg per 100 units heparin",
      "If >60 min ago: 0.25–0.375 mg per 100 units",
      "Maximum 50 mg per dose (infuse slowly over 10 min — risk of hypotension/bradycardia)",
      "For LMWH: 1 mg protamine per 1 mg enoxaparin (given within 8h); 0.5 mg per 1 mg if >8h",
      "LMWH: protamine reverses anti-IIa activity fully; only partial anti-Xa reversal (~60–75%)",
    ],
    indications:["Surgical bleeding with UFH/LMWH","Supratherapeutic aPTT with active hemorrhage","Post-CPB heparin reversal"],
    monitoring:["aPTT or ACT 5–15 min post-protamine","Repeat dosing if aPTT still prolonged","Heparin rebound — re-anticoagulation 1–18h after reversal (especially LMWH)"],
    endpoints:["aPTT within therapeutic or normal range","Cessation of clinical bleeding"],
    pearl:"Protamine itself is anticoagulant in excess — do NOT overdose. Fish allergy / prior protamine exposure: anaphylaxis risk — have epinephrine ready. For NOACs (rivaroxaban, apixaban): andexanet alfa (Factor Xa inhibitors) or idarucizumab (dabigatran).",
    pitfall:"Protamine does NOT fully reverse LMWH anti-Xa activity. For fondaparinux: protamine is ineffective — rFVIIa (off-label) is the only option. Andexanet alfa reverses apixaban and rivaroxaban but is expensive.",
  },
];

const NOAC_REVERSAL = [
  { drug:"Dabigatran (Pradaxa)", class:"Direct Thrombin Inhibitor", antidote:"Idarucizumab (Praxbind)", dose:"5g IV (2 × 2.5g vials) — single administration", color:T.red, notes:"Immediate complete reversal. Rebind possible if residual dabigatran mobilizes from tissues — second dose available." },
  { drug:"Rivaroxaban (Xarelto)", class:"Factor Xa Inhibitor", antidote:"Andexanet Alfa (Andexxa)", dose:"Low dose: 400mg bolus + 480mg/2h infusion. High dose: 800mg bolus + 960mg/2h infusion", color:T.orange, notes:"Low dose: last dose >8h or <10mg rivaroxaban. High dose: last dose ≤8h or dose unknown. Expensive — reserve for life-threatening bleeding." },
  { drug:"Apixaban (Eliquis)", class:"Factor Xa Inhibitor", antidote:"Andexanet Alfa (Andexxa)", dose:"Low dose: 400mg bolus + 480mg/2h. High dose: 800mg bolus + 960mg/2h", color:T.orange, notes:"High dose if: last dose ≤8h or dose unknown or ≥10mg. Thrombotic risk post-reversal — restart anticoagulation as soon as hemostasis achieved." },
  { drug:"Edoxaban (Savaysa)", class:"Factor Xa Inhibitor", antidote:"Andexanet Alfa (off-label) / PCC", dose:"4-factor PCC 25–50 units/kg if andexanet unavailable", color:T.yellow, notes:"Andexanet not specifically FDA-approved for edoxaban. 4-factor PCC is reasonable alternative for all factor Xa inhibitors." },
  { drug:"Warfarin (Coumadin)", class:"Vitamin K Antagonist", antidote:"Vitamin K + 4-Factor PCC (Kcentra)", dose:"Urgent: 4F-PCC 25–50 units/kg (INR guided) + Vitamin K 10mg IV slow push. Non-urgent: Vitamin K 2.5–5mg PO", color:T.teal, notes:"4F-PCC acts immediately (minutes). Vitamin K takes 6–12h. Always combine both for urgent reversal. FFP is second-line (volume issues, delayed correction)." },
];

const CATEGORIES = ["All", "Hepatotoxin", "CNS Depressant", "Cardiac Toxin", "Cardiac Glycoside", "Cholinergic Toxin", "Cellular Toxin", "Cardiovascular Toxin", "Heavy Metal", "Toxic Alcohol", "Anticoagulant"];

const TABS = [
  { id:"antidotes", label:"Antidote Reference",  icon:"🧬" },
  { id:"noac",      label:"Anticoag Reversal",    icon:"🩸" },
  { id:"toxidromes", label:"Toxidrome Quick Ref", icon:"⚡" },
];

const TOXIDROMES = [
  { name:"Cholinergic", color:T.green, mnemonic:"SLUDGE / DUMBELS", cause:"Organophosphates, carbamates, nerve agents, physostigmine", signs:["Salivation, Lacrimation, Urination, Defecation","GI cramps, Emesis","Bronchospasm, Bradycardia, Bronchorrhea","Miosis (classic but not always present)"], tx:"Atropine + 2-PAM (OP only)" },
  { name:"Anticholinergic", color:T.red, mnemonic:"Blind as bat, Mad as hatter...", cause:"Antihistamines, TCAs, atropine, scopolamine, jimsonweed", signs:["Dry skin/mucous membranes, Flushing","Tachycardia, Hyperthermia","Urinary retention, Ileus","Agitation, delirium, hallucinations, Mydriasis (large pupils)"], tx:"Physostigmine (select cases) + benzodiazepines + cooling" },
  { name:"Opioid", color:T.orange, mnemonic:"Trio: CNS↓ + RR↓ + Miosis", cause:"Heroin, fentanyl, oxycodone, methadone, tramadol", signs:["Miosis (pinpoint pupils — classic)","CNS depression (sedation, coma)","Respiratory depression, apnea","Bradycardia, hypotension"], tx:"Naloxone 0.4–2mg IV/IM/IN" },
  { name:"Sympathomimetic", color:T.coral, mnemonic:"Fight or Flight × 10", cause:"Cocaine, amphetamines, MDMA, ephedrine, pseudoephedrine", signs:["Agitation, psychosis, seizures","Tachycardia, Hypertension, Hyperthermia","Diaphoresis, Mydriasis (dilated pupils)","Rhabdomyolysis, MI risk"], tx:"Benzodiazepines first-line (avoid beta-blockers without alpha coverage)" },
  { name:"Sedative-Hypnotic", color:T.blue, mnemonic:"Everything Slowed — pupils NORMAL", cause:"Benzodiazepines, barbiturates, GHB, ethanol, carisoprodol", signs:["CNS depression, slurred speech","Normal to slightly constricted pupils","Ataxia, respiratory depression","Hypothermia"], tx:"Supportive + airway + flumazenil (BZD only in select cases)" },
  { name:"Serotonin Syndrome", color:T.purple, mnemonic:"Hunter Criteria: clonus + agitation + hyperthermia", cause:"SSRIs, SNRIs, MAOIs, linezolid, tramadol, fentanyl, methylene blue", signs:["Agitation, confusion","Clonus (spontaneous/inducible/ocular — KEY finding)","Hyperthermia, Diaphoresis","Tachycardia, Hyperreflexia, Tremor"], tx:"Cyproheptadine 12mg PO/NG + benzodiazepines + aggressive cooling + paralysis if severe" },
  { name:"NMS (Neuroleptic Malignant)", color:T.yellow, mnemonic:"FALTER: Fever, Altered, Lead-pipe, Tachycardia, Elevated CK, Rigidity", cause:"Antipsychotics (haloperidol, risperidone), antiemetics (metoclopramide), lithium", signs:["Hyperthermia (>38.5°C)","Lead-pipe rigidity (severe, not clonus)","Altered mental status, Diaphoresis","Autonomic instability (BP/HR fluctuation), Elevated CK"], tx:"Dantrolene 2.5mg/kg IV + bromocriptine 2.5mg PO + stop offending drug + aggressive cooling" },
];

function AmbientBg() {
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0}}>
      <div style={{position:"absolute",top:"-15%",left:"-10%",width:"55%",height:"55%",background:"radial-gradient(circle,rgba(61,255,160,0.08) 0%,transparent 70%)"}}/>
      <div style={{position:"absolute",bottom:"-10%",right:"-5%",width:"50%",height:"50%",background:"radial-gradient(circle,rgba(0,229,192,0.06) 0%,transparent 70%)"}}/>
      <div style={{position:"absolute",top:"40%",left:"30%",width:"35%",height:"35%",background:"radial-gradient(circle,rgba(59,158,255,0.05) 0%,transparent 70%)"}}/>
    </div>
  );
}

function BulletRow({ text, color }) {
  return (
    <div style={{display:"flex",gap:7,alignItems:"flex-start",marginBottom:4}}>
      <span style={{color:color||T.teal,fontSize:8,marginTop:2,flexShrink:0}}>▸</span>
      <span style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.5}}>{text}</span>
    </div>
  );
}

function AntidoteCard({ a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{...glass,overflow:"hidden",marginBottom:10,
      border:`1px solid ${open?a.color+"55":"rgba(42,79,122,0.35)"}`,
      borderTop:`3px solid ${a.color}`,transition:"border-color .15s"}}>
      <div onClick={()=>setOpen(o=>!o)}
        style={{padding:"14px 18px",cursor:"pointer",display:"flex",alignItems:"center",gap:12,
          background:`linear-gradient(135deg,${a.color}08,rgba(8,22,40,0.9))`}}>
        <span style={{fontSize:22}}>{a.icon}</span>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontFamily:"Playfair Display",fontWeight:700,fontSize:15,color:a.color,marginBottom:2}}>{a.toxin}</div>
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            <span style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4}}>{a.category}</span>
            <span style={{fontFamily:"JetBrains Mono",fontSize:9,fontWeight:700,padding:"1px 7px",borderRadius:20,
              background:`${a.urgency==="CRITICAL"?T.red:a.urgency==="HIGH"?T.orange:T.yellow}18`,
              border:`1px solid ${a.urgency==="CRITICAL"?T.red:a.urgency==="HIGH"?T.orange:T.yellow}44`,
              color:a.urgency==="CRITICAL"?T.red:a.urgency==="HIGH"?T.orange:T.yellow}}>
              {a.urgency}
            </span>
          </div>
        </div>
        <div style={{textAlign:"right",flexShrink:0}}>
          <div style={{fontFamily:"JetBrains Mono",fontSize:10,fontWeight:700,color:a.color}}>{a.antidote}</div>
          <div style={{fontFamily:"DM Sans",fontSize:10,color:T.txt4,marginTop:2}}>Click to expand</div>
        </div>
        <span style={{color:T.txt4,fontSize:14,marginLeft:4}}>{open?"▲":"▼"}</span>
      </div>
      {open && (
        <div className="ant-fade" style={{padding:"0 18px 18px",borderTop:"1px solid rgba(42,79,122,0.2)"}}>
          <div style={{padding:"10px 12px",background:"rgba(14,37,68,0.6)",border:"1px solid rgba(42,79,122,0.3)",borderRadius:10,margin:"12px 0 12px"}}>
            <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.txt4,textTransform:"uppercase",letterSpacing:1.5,marginBottom:4}}>Mechanism</div>
            <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2}}>{a.mechanism}</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
            <div>
              <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:a.color,textTransform:"uppercase",letterSpacing:1.5,marginBottom:8,fontWeight:700}}>⚕ DOSING</div>
              {a.dosing.map((d,i) => <BulletRow key={i} text={d} color={a.color}/>)}
            </div>
            <div>
              <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.yellow,textTransform:"uppercase",letterSpacing:1.5,marginBottom:8,fontWeight:700}}>✅ INDICATIONS</div>
              {a.indications.map((ind,i) => <BulletRow key={i} text={ind} color={T.yellow}/>)}
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
            <div>
              <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.blue,textTransform:"uppercase",letterSpacing:1.5,marginBottom:8,fontWeight:700}}>📊 MONITORING</div>
              {a.monitoring.map((m,i) => <BulletRow key={i} text={m} color={T.blue}/>)}
            </div>
            <div>
              <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.teal,textTransform:"uppercase",letterSpacing:1.5,marginBottom:8,fontWeight:700}}>🏁 ENDPOINTS</div>
              {a.endpoints.map((e,i) => <BulletRow key={i} text={e} color={T.teal}/>)}
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div style={{padding:"10px 12px",background:`${a.color}0d`,border:`1px solid ${a.color}28`,borderRadius:10}}>
              <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:a.color,textTransform:"uppercase",letterSpacing:1.5,marginBottom:5,fontWeight:700}}>💎 PEARL</div>
              <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.6}}>{a.pearl}</div>
            </div>
            <div style={{padding:"10px 12px",background:`${T.red}0d`,border:`1px solid ${T.red}28`,borderRadius:10}}>
              <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.red,textTransform:"uppercase",letterSpacing:1.5,marginBottom:5,fontWeight:700}}>⚠️ PITFALL</div>
              <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.6}}>{a.pitfall}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AntidoteHub() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("antidotes");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const filtered = ANTIDOTES.filter(a => {
    const matchCat = category === "All" || a.category === category;
    const q = search.toLowerCase();
    const matchSearch = !q || a.toxin.toLowerCase().includes(q) || a.antidote.toLowerCase().includes(q) || a.category.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  return (
    <div style={{fontFamily:"DM Sans, sans-serif",background:T.bg,minHeight:"100vh",position:"relative",overflow:"hidden",color:T.txt}}>
      <AmbientBg/>
      <div style={{position:"relative",zIndex:1,maxWidth:1440,margin:"0 auto",padding:"0 16px"}}>

        {/* Header */}
        <div style={{padding:"18px 0 14px"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
            <div style={{backdropFilter:"blur(40px)",WebkitBackdropFilter:"blur(40px)",background:"rgba(5,15,30,0.9)",border:"1px solid rgba(42,79,122,0.6)",borderRadius:10,padding:"5px 12px",display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.teal,letterSpacing:3}}>NOTRYA</span>
              <span style={{color:T.txt4,fontFamily:"JetBrains Mono",fontSize:10}}>/</span>
              <span style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.txt3,letterSpacing:2}}>ANTIDOTE HUB</span>
            </div>
            <div style={{height:1,flex:1,background:"linear-gradient(90deg,rgba(61,255,160,0.4),transparent)"}}/>
            <button onClick={()=>navigate("/hub")} style={{padding:"5px 14px",borderRadius:8,background:"rgba(14,37,68,0.6)",border:"1px solid rgba(42,79,122,0.4)",color:T.txt2,fontFamily:"DM Sans",fontSize:12,fontWeight:600,cursor:"pointer",flexShrink:0}}>← Hub</button>
          </div>
          <h1 className="ant-shimmer" style={{fontFamily:"Playfair Display",fontSize:"clamp(26px,4vw,42px)",fontWeight:900,letterSpacing:-1,lineHeight:1.1}}>Antidote Hub</h1>
          <p style={{fontFamily:"DM Sans",fontSize:12,color:T.txt3,marginTop:4}}>Antidote Reference · NOAC Reversal · Toxidrome Quick Reference · Dosing · Indications · Monitoring</p>
        </div>

        {/* Stat banner */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10,marginBottom:16}}>
          {[
            {label:"Antidotes",    value:"12",          sub:"Dose · Endpoint · Pearl", color:T.green},
            {label:"NOAC Reversal",value:"5 Agents",    sub:"Idarucizumab · Andexanet", color:T.red},
            {label:"Toxidromes",   value:"7 Syndromes", sub:"Signs · Tx",              color:T.orange},
            {label:"Categories",   value:`${CATEGORIES.length-1}`,sub:"Organ-system based",color:T.blue},
            {label:"Critical ODs", value:"APAP · TCA · CN",sub:"Most common/deadly",   color:T.coral},
            {label:"Antidote Goal","value":"Right Drug Fast",sub:"Pearl + Pitfall each", color:T.teal},
          ].map((b,i)=>(
            <div key={i} style={{...glass,padding:"9px 13px",borderLeft:`3px solid ${b.color}`,background:`linear-gradient(135deg,${b.color}12,rgba(8,22,40,0.8))`,borderRadius:10}}>
              <div style={{fontFamily:"JetBrains Mono",fontSize:14,fontWeight:700,color:b.color,lineHeight:1}}>{b.value}</div>
              <div style={{fontFamily:"DM Sans",fontWeight:600,color:T.txt,fontSize:10,margin:"3px 0"}}>{b.label}</div>
              <div style={{fontFamily:"DM Sans",fontSize:9,color:T.txt4}}>{b.sub}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{...glass,padding:"6px",display:"flex",gap:4,marginBottom:16,flexWrap:"wrap"}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{flex:"1 1 auto",fontFamily:"DM Sans",fontWeight:600,fontSize:11,padding:"9px 6px",
                borderRadius:10,border:`1px solid ${tab===t.id?"rgba(61,255,160,0.5)":"transparent"}`,
                background:tab===t.id?"linear-gradient(135deg,rgba(61,255,160,0.18),rgba(61,255,160,0.07))":"transparent",
                color:tab===t.id?T.green:T.txt3,cursor:"pointer",textAlign:"center",transition:"all .15s",whiteSpace:"nowrap"}}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ═══ ANTIDOTES ═══ */}
        {tab === "antidotes" && (
          <div className="ant-fade">
            <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap"}}>
              <input value={search} onChange={e=>setSearch(e.target.value)}
                placeholder="Search toxin or antidote..."
                style={{flex:1,minWidth:200,background:"rgba(8,22,40,0.8)",border:"1px solid rgba(42,79,122,0.5)",
                  borderRadius:10,padding:"9px 14px",color:T.txt,fontFamily:"DM Sans",fontSize:13,outline:"none"}}/>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {CATEGORIES.slice(0,6).map(c=>(
                  <button key={c} onClick={()=>setCategory(c)}
                    style={{padding:"8px 12px",borderRadius:20,fontSize:11,fontWeight:600,fontFamily:"DM Sans",cursor:"pointer",
                      transition:"all .15s",background:category===c?"rgba(61,255,160,0.15)":"rgba(8,22,40,0.8)",
                      border:`1px solid ${category===c?"rgba(61,255,160,0.5)":"rgba(42,79,122,0.5)"}`,
                      color:category===c?T.green:T.txt4}}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
              {CATEGORIES.slice(6).map(c=>(
                <button key={c} onClick={()=>setCategory(c)}
                  style={{padding:"6px 12px",borderRadius:20,fontSize:10,fontWeight:600,fontFamily:"DM Sans",cursor:"pointer",
                    transition:"all .15s",background:category===c?"rgba(61,255,160,0.15)":"rgba(8,22,40,0.8)",
                    border:`1px solid ${category===c?"rgba(61,255,160,0.5)":"rgba(42,79,122,0.4)"}`,
                    color:category===c?T.green:T.txt4}}>
                  {c}
                </button>
              ))}
            </div>
            {filtered.length === 0 ? (
              <div style={{textAlign:"center",padding:"60px 0",color:T.txt4,fontFamily:"DM Sans"}}>No antidotes found for "{search}"</div>
            ) : (
              filtered.map(a => <AntidoteCard key={a.id} a={a}/>)
            )}
          </div>
        )}

        {/* ═══ NOAC REVERSAL ═══ */}
        {tab === "noac" && (
          <div className="ant-fade">
            <div style={{padding:"10px 14px",background:"rgba(255,68,68,0.07)",border:"1px solid rgba(255,68,68,0.2)",borderRadius:10,marginBottom:14,fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.7}}>
              🩸 <strong style={{color:T.red}}>Anticoagulant Reversal:</strong> Identify the agent, confirm last dose timing, and severity of bleeding before selecting reversal strategy. Thrombotic risk post-reversal — restart anticoagulation as soon as hemostasis is achieved.
            </div>
            {NOAC_REVERSAL.map((r,i)=>(
              <div key={i} style={{...glass,padding:"16px 18px",marginBottom:10,borderTop:`3px solid ${r.color}`,background:`linear-gradient(135deg,${r.color}08,rgba(8,22,40,0.9))`}}>
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10,flexWrap:"wrap",marginBottom:10}}>
                  <div>
                    <div style={{fontFamily:"Playfair Display",fontWeight:700,fontSize:16,color:r.color}}>{r.drug}</div>
                    <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,marginTop:2}}>{r.class}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontFamily:"DM Sans",fontWeight:700,fontSize:13,color:T.txt}}>{r.antidote}</div>
                  </div>
                </div>
                <div style={{padding:"8px 12px",background:"rgba(14,37,68,0.7)",border:"1px solid rgba(42,79,122,0.3)",borderRadius:9,marginBottom:8}}>
                  <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:r.color,textTransform:"uppercase",letterSpacing:1.5,marginBottom:3}}>DOSE</div>
                  <div style={{fontFamily:"JetBrains Mono",fontSize:11,color:T.txt,fontWeight:700}}>{r.dose}</div>
                </div>
                <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.6}}>{r.notes}</div>
              </div>
            ))}
            <div style={{...glass,padding:"14px 18px",marginTop:10,borderLeft:`4px solid ${T.yellow}`}}>
              <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.yellow,textTransform:"uppercase",letterSpacing:2,marginBottom:10}}>💎 Universal Reversal Pearls</div>
              {["4-Factor PCC (Kcentra) 25–50 units/kg is a reasonable empiric reversal for ANY anticoagulant when specific antidote unavailable",
                "Fresh Frozen Plasma (FFP): second-line — volume issues, slow correction, requires crossmatch — avoid as first-line in life-threatening bleeding",
                "Andexanet alfa: check formulary — expensive, limited availability, thrombotic risk 10–14 days post-reversal",
                "Activated charcoal 50g PO/NG if ingestion <2–4h and patient is able to protect airway (prevents further absorption)",
                "After reversal: plan for re-anticoagulation timing with hematology/cardiology — benefit of anticoagulation persists"].map((p,i)=>(
                <BulletRow key={i} text={p} color={T.yellow}/>
              ))}
            </div>
          </div>
        )}

        {/* ═══ TOXIDROMES ═══ */}
        {tab === "toxidromes" && (
          <div className="ant-fade">
            <div style={{padding:"10px 14px",background:"rgba(255,159,67,0.07)",border:"1px solid rgba(255,159,67,0.2)",borderRadius:10,marginBottom:14,fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.7}}>
              ⚡ <strong style={{color:T.orange}}>Toxidrome Recognition:</strong> Identify the toxidrome pattern FIRST — it guides empiric antidote selection before the toxicology report returns. Pupils + vital signs + skin + neuromuscular findings are most discriminating.
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:12}}>
              {TOXIDROMES.map((t,i)=>(
                <div key={i} style={{...glass,padding:"16px 18px",borderTop:`3px solid ${t.color}`}}>
                  <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:8}}>
                    <div>
                      <div style={{fontFamily:"Playfair Display",fontWeight:700,fontSize:16,color:t.color}}>{t.name}</div>
                      <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,marginTop:2,fontStyle:"italic"}}>"{t.mnemonic}"</div>
                    </div>
                  </div>
                  <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt3,marginBottom:10}}><strong style={{color:T.txt4}}>Causes: </strong>{t.cause}</div>
                  <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:t.color,textTransform:"uppercase",letterSpacing:1.5,marginBottom:7}}>Signs & Symptoms</div>
                  {t.signs.map((s,j)=><BulletRow key={j} text={s} color={t.color}/>)}
                  <div style={{marginTop:10,padding:"7px 10px",background:`${t.color}12`,border:`1px solid ${t.color}33`,borderRadius:8}}>
                    <span style={{fontFamily:"JetBrains Mono",fontSize:9,color:t.color,fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>Tx: </span>
                    <span style={{fontFamily:"DM Sans",fontSize:12,color:T.txt,fontWeight:600}}>{t.tx}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{textAlign:"center",paddingBottom:24,paddingTop:14}}>
          <span style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,letterSpacing:1.5}}>
            NOTRYA ANTIDOTE HUB · ALWAYS VERIFY WITH POISON CONTROL 1-800-222-1222 · FOR EDUCATIONAL USE
          </span>
        </div>
      </div>
    </div>
  );
}