import { useState } from "react";
import { useNavigate } from "react-router-dom";

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
  { id:"diphenhydramine", icon:"🟣", title:"Diphenhydramine OD",       sub:"Benadryl · Anticholinergic + Na-block", cat:"Overdose",  color:T.purple, gl:"rgba(155,109,255,0.1)",  br:"rgba(155,109,255,0.4)" },
  { id:"betablocker",     icon:"💙", title:"Beta-Blocker OD",          sub:"Bradycardia · Hypotension · Hypoglycemia", cat:"Overdose", color:T.blue,   gl:"rgba(59,158,255,0.1)",   br:"rgba(59,158,255,0.4)"  },
  { id:"ccb",             icon:"🫀", title:"Calcium Channel Blocker OD",sub:"Bradycardia · Vasodilation · High-Dose Insulin", cat:"Overdose", color:T.coral, gl:"rgba(255,107,107,0.1)",  br:"rgba(255,107,107,0.4)" },
  { id:"co",              icon:"💨", title:"Carbon Monoxide",           sub:"Tissue Hypoxia · Headache · COHb",  cat:"Toxidrome", color:T.orange, gl:"rgba(255,159,67,0.1)",   br:"rgba(255,159,67,0.4)"  },
  { id:"etoh_intox",      icon:"🍺", title:"Alcohol Intoxication",      sub:"Acute EtOH · Wernicke · Aspiration", cat:"Toxidrome", color:T.gold,   gl:"rgba(245,200,66,0.1)",   br:"rgba(245,200,66,0.4)"  },
  { id:"etoh_withdrawal", icon:"🥴", title:"Alcohol Withdrawal",         sub:"AWS · DTs · CIWA · Banana Bag",      cat:"Toxidrome", color:T.orange, gl:"rgba(255,159,67,0.1)",   br:"rgba(255,159,67,0.4)"  },
  { id:"alcohols",        icon:"🧪", title:"Toxic Alcohols",            sub:"Methanol · Ethylene Glycol · Osmol Gap", cat:"Overdose", color:T.green,  gl:"rgba(61,255,160,0.1)",   br:"rgba(61,255,160,0.4)"  },
];

const BANNER = [
  { label:"Antidote Window", value:"0–2 hrs", sub:"Most time-critical reversal", color:T.coral },
  { label:"Naloxone Repeat", value:"q 2–3 min", sub:"Titrate RR > 12 & SpO₂ > 95%", color:T.orange },
  { label:"NAC Best Efficacy", value:"< 8 hours", sub:"Post-APAP ingestion", color:T.green },
  { label:"TCA Bicarb pH", value:"7.45–7.55", sub:"Target to narrow QRS < 100 ms", color:T.blue },
];

// ── Clinical Data ──────────────────────────────────────────────────
const DATA = {
  diphenhydramine: {
    overview: {
      def: "Diphenhydramine (Benadryl) overdose produces a DUAL toxidrome: (1) classic anticholinergic syndrome from H1/muscarinic blockade ('Mad as a hatter, dry as a bone, red as a beet, hot as a hare, blind as a bat, full as a flask') AND (2) potentially lethal sodium channel blockade at toxic doses causing QRS widening and ventricular dysrhythmias (identical mechanism to TCA toxicity). This combination makes diphenhydramine OD far more dangerous than pure anticholinergic agents.",
      bullets: [
        "Anticholinergic: mydriasis, tachycardia, dry flushed skin, urinary retention, hyperthermia, delirium, hallucinations",
        "QRS widening at toxic doses (>1 g adults) — Na-channel block identical to TCA toxicity mechanism",
        "R wave in aVR > 3 mm and QRS > 100 ms predict dysrhythmia risk — serial ECGs mandatory",
        "Seizures common — further worsen acidosis and Na-channel block in a dangerous feedback loop",
        "Physostigmine reverses anticholinergic delirium ONLY if QRS normal (contraindicated if QRS widened)",
        "NaHCO₃ is antidotal for QRS widening (same mechanism/treatment as TCA OD)",
        "Standard UDS diphenhydramine assays may cross-react with methadone — verify with clinical picture",
      ]
    },
    workup: [
      { icon:"🫀", label:"Serial ECGs (q30 min × 3, then q1h)", detail:"QRS duration (goal <100 ms), QTc, R wave in aVR (>3 mm = high risk), terminal rightward axis deviation. Bicarb decision driven by QRS. Most important monitoring parameter." },
      { icon:"🌡️", label:"Core Temperature (Rectal)", detail:"Anhidrosis prevents heat dissipation — temperature rises silently. Rectal preferred for accuracy. Hyperthermia >39°C requires active cooling." },
      { icon:"🔬", label:"Serum Diphenhydramine Level + TCA Screen", detail:"Quantitative diphenhydramine if available. TCA screen — cross-reactivity may give false positive. Clinical picture guides management." },
      { icon:"🧠", label:"Seizure Monitoring + Continuous EEG (if altered)", detail:"Seizures acidify blood → worsens Na-channel block → more QRS widening → more dysrhythmia. Rapid seizure termination is critical. EEG if postictal and unclear if ongoing activity." },
      { icon:"🫁", label:"Bladder Scan", detail:"Urinary retention is near-universal in significant DPH OD. Retention causes agitation which worsens hyperthermia. Catheterize early — behavioral improvement is dramatic." },
      { icon:"💉", label:"BMP + ABG", detail:"Acidosis worsens Na-channel block (pH-dependent). Metabolic acidosis from seizures/hyperthermia. ABG guides bicarb therapy target (pH 7.45–7.55)." },
    ],
    treatment: [
      { cat:"🅐 Antidote", drug:"Sodium Bicarbonate (QRS >100 ms)", dose:"1–2 mEq/kg IV bolus; repeat q5 min until QRS <100 ms; maintain pH 7.45–7.55 with infusion (150 mEq in 1L D5W at 200–250 mL/hr)", renal:"Monitor Na+ closely; reduce in hypernatremia", ivpo:"IV bolus + infusion", deesc:"Continue infusion 12–24h minimum when QRS widened. Wean when QRS <100 ms stable >6h AND hemodynamically stable. STOP at pH >7.55 or Na >155.", note:"SAME mechanism and treatment as TCA — Na loading overcomes Na-channel block; alkalosis reduces drug binding affinity. Do NOT wait for QRS to deteriorate further.", ref:"AHA / Goldfrank's" },
      { cat:"🅐 Antidote", drug:"Physostigmine (QRS NORMAL only)", dose:"1–2 mg IV over 5 min SLOWLY; may repeat 1 mg q10–20 min; max 4 mg initial session", renal:"No adjustment", ivpo:"IV (slow push — fast infusion causes bradycardia/seizures)", deesc:"CONTRAINDICATED if QRS >100 ms (may worsen conduction). Reverses anticholinergic delirium effectively. Duration 30–60 min; repeat PRN. Have atropine 0.5 mg at bedside.", note:"Most effective antidote for delirium when QRS normal. Underused — dramatically improves behavioral control and prevents hyperthermia-driven deterioration.", ref:"Goldfrank's" },
      { cat:"🅑 Sedation", drug:"Lorazepam", dose:"2–4 mg IV q5–10 min for agitation/seizures; aggressive dosing for seizure control", renal:"No adjustment", ivpo:"IV / IM", deesc:"First-line for seizures and agitation. Controls seizure-driven acidosis (reduces worsening Na-channel block). AVOID haloperidol — lowers seizure threshold, impairs heat dissipation.", note:"Seizure control is critical — each seizure worsens acidosis which worsens QRS widening. Aggressive BZD dosing is appropriate.", ref:"Toxicology" },
      { cat:"🅒 Supportive", drug:"Cooling + Foley Catheter", dose:"Tepid water + fan evaporative cooling (preferred over ice bath — peripheral vasoconstriction worsens heat retention in anhidrotic patient). Foley: insert early for urinary retention.", renal:"N/A", ivpo:"External", deesc:"Urinary catheterization often dramatically improves agitation (retention is a major driver of behavioral symptoms). Target temp <38.5°C.", note:"Avoid ice baths — anhidrosis + vasoconstriction impairs heat loss. Evaporative cooling (wet towels + fan) is more effective in anticholinergic hyperthermia.", ref:"Supportive" },
    ],
    followup: [
      "ICU admission for ANY ECG changes (QRS >100 ms, QTc prolongation, R in aVR >3 mm) or seizures",
      "Monitor ECG until QRS <100 ms without sodium bicarbonate for minimum 24 consecutive hours",
      "Mandatory psychiatric evaluation — diphenhydramine OD is frequently intentional",
      "Review ALL home medications for anticholinergic burden (Beers Criteria — DPH is a common OTC medication)",
      "Patient education: diphenhydramine is not a safe sleep aid and has narrow therapeutic-to-toxic ratio",
      "Confirm urinary voiding before discharge — retention may persist hours after resolution of other symptoms",
    ]
  },
  betablocker: {
    overview: {
      def: "Beta-blocker (BB) overdose causes bradycardia, hypotension, and conduction defects via competitive antagonism of beta-1 (cardiac) and beta-2 (pulmonary, vascular) adrenergic receptors. Propranolol is the most dangerous — non-selective, highly lipophilic (CNS effects), and has Na-channel blocking properties at high doses. Toxicity ranges from asymptomatic bradycardia to refractory cardiogenic shock and cardiac arrest within hours.",
      bullets: [
        "Bradycardia + hypotension = hallmarks; propranolol also causes QRS widening (Na-channel block)",
        "CNS toxicity: seizures and altered mental status (propranolol, metoprolol — lipophilic BBs cross BBB)",
        "Bronchospasm: from beta-2 blockade — especially problematic in asthma/COPD patients",
        "Hypoglycemia: blocks glycogenolysis — more common in children and diabetics",
        "Glucagon is unique antidote — activates cAMP independent of beta-receptors",
        "High-Dose Insulin (HDI) therapy is cornerstone of severe BB toxicity management",
        "ECMO: early consultation in refractory hemodynamic compromise (bridging therapy)",
      ]
    },
    workup: [
      { icon:"🫀", label:"Continuous ECG + 12-lead", detail:"HR, PR interval, QRS width (propranolol Na-channel block), QTc. Telemetry mandatory for minimum 6h post-ingestion. AV block grade and progression." },
      { icon:"🧪", label:"Blood Glucose (POC) q1h", detail:"Hypoglycemia common — BB blocks glycogenolysis and glucagon release. Check BG immediately and q1h. Treat with D50W + glucagon." },
      { icon:"💉", label:"BMP + Lactate", detail:"Metabolic acidosis from poor perfusion. Rising lactate = inadequate tissue oxygen delivery = shock. BG, potassium (HDI causes hypokalemia)." },
      { icon:"📊", label:"Bedside ECHO / Cardiac Output", detail:"Assess LV function, contractility, filling. Guides HDI dosing and vasopressor need. Transesophageal if poor windows." },
      { icon:"🫁", label:"SpO₂ + Bronchospasm Assessment", detail:"Beta-2 blockade → bronchospasm in reactive airway disease. Auscultation, peak flow if applicable. Albuterol may be paradoxically less effective." },
      { icon:"🧠", label:"Neurological Assessment", detail:"Lipophilic BBs (propranolol, metoprolol) cross BBB → confusion, seizures, coma. GCS and focal neurological exam." },
    ],
    treatment: [
      { cat:"🅐 Antidote", drug:"Glucagon", dose:"3–10 mg IV bolus over 3–5 min (adult); then 3–5 mg/hr infusion; children: 0.05–0.1 mg/kg bolus then 0.07 mg/kg/hr", renal:"No adjustment", ivpo:"IV", deesc:"Activates myocardial adenylyl cyclase directly (bypasses beta-receptor) → ↑ cAMP → inotropy and chronotropy. Nausea/vomiting common — premedicate with antiemetic. Effectiveness variable and often limited.", note:"First antidote to use. Positive chronotropic and inotropic effects independent of beta-receptor status. Mix in NS or D5W (NOT PROVIDED DILUENT — contains phenol).", ref:"Goldfrank's" },
      { cat:"🅐 Antidote", drug:"High-Dose Insulin (HDI) Therapy", dose:"Bolus: Regular insulin 1 unit/kg IV + D50W 25g IV simultaneously; Infusion: insulin 0.5–2 units/kg/hr + dextrose 0.5 g/kg/hr (titrate to BG 100–250)", renal:"Monitor K+ closely — insulin drives K+ intracellularly", ivpo:"IV continuous", deesc:"Titrate insulin to hemodynamic response (HR, MAP, cardiac output). Monitor BG q15–30 min initially. Monitor K+ q1–2h. Typical effective dose: 1 unit/kg/hr.", note:"CORNERSTONE of therapy for severe BB and CCB toxicity. Improves myocardial metabolic efficiency — heart preferentially uses glucose in poisoning states. Onset 20–30 min; full effect 45–60 min. Do NOT give insulin without dextrose co-infusion.", ref:"Engebretsen 2011 / Toxicology" },
      { cat:"🅑 Vasopressor", drug:"Norepinephrine / Epinephrine", dose:"NE: 0.1–3 mcg/kg/min IV; Epinephrine: 0.05–2 mcg/kg/min IV for refractory shock", renal:"No adjustment", ivpo:"IV infusion", deesc:"Epinephrine preferred for beta-2 mediated bronchospasm co-occurring with shock. Titrate to MAP >65 mmHg. Vasopressin as adjunct if catecholamine-refractory.", note:"Catecholamines may have reduced effect due to receptor blockade — use HDI as primary hemodynamic support and vasopressors as bridge.", ref:"Critical Care" },
      { cat:"🅒 QRS Widening", drug:"Sodium Bicarbonate (Propranolol)", dose:"1–2 mEq/kg IV bolus for QRS >100 ms (propranolol's Na-channel block); target pH 7.45–7.55", renal:"Monitor Na+", ivpo:"IV bolus + infusion", deesc:"Same treatment as TCA/DPH Na-channel block. Specific to propranolol (other BBs do not significantly block Na channels). Maintain bicarb infusion until QRS <100 ms.", note:"Propranolol is unique among BBs in causing significant Na-channel block. Atenolol, metoprolol do not. Check QRS on each ECG.", ref:"Toxicology" },
      { cat:"🅒 Rescue", drug:"Lipid Emulsion 20% (ILE)", dose:"1.5 mL/kg IV bolus over 1 min; then 0.25 mL/kg/min × 30–60 min (for lipophilic BBs: propranolol, metoprolol)", renal:"No adjustment", ivpo:"IV", deesc:"Consider for refractory cardiac arrest from lipophilic BB toxicity. ECMO consultation simultaneously. 'Lipid sink' sequesters propranolol.", note:"Reserve for cardiac arrest or refractory hemodynamic instability not responding to glucagon/HDI/vasopressors. ECMO is preferred rescue if available.", ref:"Toxicology / ILE" },
    ],
    followup: [
      "ICU admission for all symptomatic BB OD — minimum 6h monitoring even if initially asymptomatic",
      "HDI therapy: continue at least 6h after hemodynamic stability — premature wean causes rebound",
      "Monitor BG q30–60 min and K+ q1–2h during HDI infusion",
      "Mandatory psychiatric evaluation if intentional ingestion",
      "ECMO consultation should be initiated EARLY in refractory shock — do not wait for arrest",
      "Extended-release formulations: 12–24h observation mandatory (atenolol XL, metoprolol succinate)",
    ]
  },
  ccb: {
    overview: {
      def: "Calcium channel blocker (CCB) overdose is one of the most lethal cardiovascular drug toxicities. L-type calcium channel blockade in myocardium and vascular smooth muscle causes bradycardia, AV block, vasodilation, and negative inotropy. Non-dihydropyridines (verapamil, diltiazem) cause more cardiac effects; dihydropyridines (amlodipine, nifedipine) cause predominant vasodilation. High-Dose Insulin (HDI) is the cornerstone of treatment, bypassing the blocked calcium channels to restore metabolic efficiency.",
      bullets: [
        "Dihydropyridines (amlodipine, nifedipine): REFLEX TACHYCARDIA + vasodilation — not bradycardia",
        "Non-dihydropyridines (verapamil, diltiazem): bradycardia + AV block + myocardial depression",
        "Hyperglycemia paradox: CCBs block insulin secretion from pancreatic beta cells — hyperglycemia = poor prognostic sign",
        "HDI is superior to calcium, glucagon, and vasopressors for cardiogenic shock in CCB OD",
        "Calcium salts provide immediate (but transient) hemodynamic benefit — bridge to HDI",
        "Extended-release formulations: onset of toxicity delayed 6–12h — mandatory prolonged monitoring",
        "ECMO: early consultation for refractory hemodynamic failure (best outcomes with early use)",
      ]
    },
    workup: [
      { icon:"🫀", label:"Continuous ECG + Serial 12-leads", detail:"PR interval prolongation, AV block grade, QRS widening (verapamil Na-channel at high doses). Telemetry minimum 6h; 24h for extended-release formulations." },
      { icon:"🧪", label:"Blood Glucose q1–2h", detail:"Hyperglycemia from pancreatic beta-cell calcium channel blockade (inhibits insulin secretion). BG >150 mg/dL in CCB OD = poor prognosis marker. Paradoxically treated with insulin HDI." },
      { icon:"💉", label:"BMP + Lactate q2–4h", detail:"Rising lactate = cardiogenic shock. Hypokalemia during HDI therapy. Hyperglycemia as severity marker. Acidosis worsens prognosis." },
      { icon:"📊", label:"Bedside ECHO", detail:"LV/RV function, contractility, cardiac output. Essential for guiding HDI dosing and vasopressor selection. Pulmonary artery catheter if ECHO inadequate." },
      { icon:"🔬", label:"CCB Level (if available)", detail:"Quantitative verapamil/diltiazem levels if available. Do NOT wait for levels before initiating treatment. Clinical picture guides management." },
      { icon:"🏥", label:"ECMO Team Notification (Early)", detail:"Early consultation for any hemodynamic instability. Pre-cannulation while still responsive is preferable to emergent post-arrest ECMO. Verapamil/diltiazem OD: contact ECMO team at presentation." },
    ],
    treatment: [
      { cat:"🅐 Antidote", drug:"High-Dose Insulin (HDI) Therapy", dose:"Bolus: Regular insulin 1 unit/kg IV + D50W 25g; Infusion: 1–2 units/kg/hr + dextrose 0.5 g/kg/hr (titrate to BG 100–250 mg/dL)", renal:"Monitor K+ aggressively — HDI causes hypokalemia", ivpo:"IV continuous", deesc:"CORNERSTONE of CCB toxicity management. Onset 20–30 min; full effect 45–60 min. Improve metabolic substrate for myocardium (glucose utilization). Titrate to HR, MAP, and cardiac output. Do NOT give insulin without dextrose.", note:"HDI improves contractility via enhanced myocardial glucose metabolism — independent of calcium channels. Superior to all other pharmacological interventions for hemodynamic compromise in CCB OD.", ref:"Engebretsen 2011 / ACMT" },
      { cat:"🅐 Antidote", drug:"Calcium Gluconate / Calcium Chloride", dose:"Calcium gluconate: 3 g IV (30 mL of 10%) over 10–20 min; may repeat q20 min ×3; Calcium chloride: 1 g IV (10 mL of 10%) over 5 min", renal:"No adjustment", ivpo:"IV (calcium chloride: central line preferred)", deesc:"Provides immediate but transient hemodynamic benefit (30–60 min). Bridge to HDI and ECMO. Do NOT use alone — repeat calcium without HDI is insufficient. Ionized calcium 2× normal is target.", note:"3× more elemental calcium in calcium chloride vs gluconate per mL — preferred for cardiac arrest. Calcium gluconate safer peripherally. Both are temporary bridges.", ref:"Toxicology" },
      { cat:"🅑 Vasopressor", drug:"Norepinephrine + Vasopressin", dose:"NE: 0.1–3 mcg/kg/min; Vasopressin: 0.03–0.04 units/min as adjunct; Epinephrine: 0.05–2 mcg/kg/min for severe shock", renal:"No adjustment", ivpo:"IV continuous", deesc:"Primarily for vascular component (dihydropyridines). Vasopressors alone insufficient for myocardial depression component — HDI is more effective for inotropy.", note:"Non-dihydropyridine OD (verapamil/diltiazem): use vasopressors as BRIDGE while HDI/ECMO initiated. Target MAP >65 mmHg.", ref:"Critical Care" },
      { cat:"🅒 GI", drug:"Whole Bowel Irrigation (Extended-Release)", dose:"Polyethylene glycol-electrolyte solution (GoLYTELY) 1–2 L/hr PO/NG until rectal effluent clear", renal:"N/A", ivpo:"PO / NG", deesc:"For extended-release CCB if airway protected and presentation <6–8h. Do NOT give charcoal without WBI — limited adsorption of most CCBs.", note:"Extended-release verapamil and diltiazem can significantly benefit from WBI given slow GI transit time. Activated charcoal: limited role but may help within 1h.", ref:"ACMT / Toxicology" },
      { cat:"🅒 Rescue", drug:"Lipid Emulsion 20% (ILE)", dose:"1.5 mL/kg IV bolus; then 0.25 mL/kg/min × 30 min (for amlodipine — highly lipophilic)", renal:"No adjustment", ivpo:"IV", deesc:"Most evidence for amlodipine (highly lipophilic CCB). ECMO preferred if available. Consider ILE after failure of HDI + calcium + vasopressors.", note:"Amlodipine OD: high protein binding and lipophilicity make it amenable to lipid sequestration. Case reports of dramatic response.", ref:"Toxicology / ILE" },
    ],
    followup: [
      "ICU admission for ALL hemodynamically significant CCB OD — no exceptions",
      "Extended-release formulations: minimum 24h continuous monitoring even if initially asymptomatic",
      "HDI: continue minimum 6h after hemodynamic stability — abrupt wean causes rebound hemodynamic deterioration",
      "ECMO: do not delay cannulation — pre-arrest ECMO has far better outcomes than post-arrest",
      "Mandatory psychiatric evaluation for intentional overdose",
      "Cardiac catheterization: if coronary vasospasm or MI suspected from underlying ischemia vs toxicity",
    ]
  },
  co: {
    overview: {
      def: "Carbon monoxide (CO) poisoning is the leading cause of accidental poisoning death in the US. CO has 200–250× higher affinity for hemoglobin than oxygen → carboxyhemoglobin (COHb) → impairs O₂ delivery. Also directly binds cytochrome c oxidase → mitochondrial respiratory chain inhibition → cellular hypoxia independent of hemoglobin. Delayed neurological sequelae (DNS) occur 2–40 days post-exposure in up to 30% of cases.",
      bullets: [
        "SpO₂ pulse oximetry is FALSELY NORMAL — cannot detect COHb; only CO-oximetry (ABG co-oximeter) is diagnostic",
        "Symptoms: headache (most common), dizziness, nausea, confusion — progress to coma, seizures, cardiac arrest",
        "Classic 'cherry red skin' is a late and unreliable finding — do NOT rely on it",
        "COHb >25% = severe poisoning; >50% = typically fatal without treatment",
        "Hyperbaric oxygen (HBO): reduces CO half-life from ~5h (room air) to 23 min; reduces DNS incidence",
        "ALWAYS screen household members and check for CO source (generators, fires, faulty heaters)",
        "Pregnancy: fetal Hgb has higher CO affinity — treat mother aggressively; HBO strongly preferred",
      ]
    },
    workup: [
      { icon:"🩸", label:"CO-Oximetry (ABG co-oximeter) — STAT", detail:"ONLY accurate way to measure COHb. Standard pulse oximetry reads COHb as oxyHgb — gives falsely normal SpO₂. Venous COHb is acceptable if ABG not tolerated. Target COHb <5% (nonsmoker) or <10% (smoker)." },
      { icon:"🫀", label:"ECG + Troponin", detail:"CO-induced myocardial injury: ST changes, arrhythmias, ACS. Troponin elevation = significant myocardial injury. COHb >15% with cardiac symptoms → HBO strongly indicated." },
      { icon:"🧠", label:"Neurological Assessment + CT Head", detail:"Cognitive testing (Mini-Cog, orientation). Head CT to rule out structural pathology. Globus pallidus lucencies on CT = severe CO injury (bilateral hypodensities). MRI more sensitive for white matter changes." },
      { icon:"💉", label:"Lactate + BMP", detail:"Elevated lactate indicates significant cellular hypoxia (cytochrome c oxidase inhibition). Metabolic acidosis severity correlates with poisoning severity." },
      { icon:"👨‍👩‍👧", label:"Screen ALL Household Members", detail:"CO poisoning is typically a household event. ALL members must be evaluated. CO levels will differ based on activity level and location. Identify CO source (generator, fire, furnace)." },
      { icon:"🫀", label:"Echo (if COHb >25% or cardiac symptoms)", detail:"Stress cardiomyopathy (Takotsubo) and CO-induced myocardial depression. Guide resuscitation. RV dysfunction from pulmonary vasoconstriction." },
    ],
    treatment: [
      { cat:"🅐 Antidote", drug:"100% O₂ via NRB (First-Line)", dose:"100% O₂ via Non-Rebreather Mask at 15 L/min — start IMMEDIATELY upon suspicion; continue until COHb <5%; O₂ half-life: ~5h room air → ~90 min on 100% O₂", renal:"N/A", ivpo:"Inhalation", deesc:"Start 100% O₂ BEFORE labs — do NOT delay. O₂ displaces CO from hemoglobin competitively. Continue until COHb <5% AND symptoms resolved. Intubate and ventilate on FiO₂ 1.0 if unable to cooperate.", note:"Do NOT use Venturi mask or low-flow O₂ — need maximum possible FiO₂. Half-life of CO: room air 4–6h → 100% NRB ~90 min → HBO ~23 min.", ref:"CDC / UpToDate 2024" },
      { cat:"🅐 Antidote", drug:"Hyperbaric Oxygen (HBO)", dose:"2.5–3 ATA × 60–90 min (HBOT chamber)", renal:"N/A", ivpo:"Hyperbaric chamber", deesc:"Reduces CO half-life to ~23 min. Dissolves O₂ physically in plasma independent of hemoglobin. Reduces delayed neurological sequelae (DNS) incidence. Arrange transfer if HBO not available locally.", note:"HBO INDICATIONS: COHb >25%, any LOC, seizure, cardiac arrhythmia, ischemic ECG changes, neurological symptoms, pregnancy (any COHb), very young/elderly. Transport on 100% O₂ while arranging HBO.", ref:"Thom et al. / Weaver NEJM 2002" },
      { cat:"🅑 Seizures", drug:"Lorazepam + Levetiracetam", dose:"Lorazepam 0.1 mg/kg IV q5–10 min (first-line). Levetiracetam 60 mg/kg IV loading (second-line)", renal:"Adjust LEV for CrCl <60", ivpo:"IV", deesc:"Seizures from cerebral hypoxia and direct cytotoxicity. Phenytoin/fosphenytoin — relatively ineffective for hypoxic-metabolic seizures. Treat rapidly.", note:"If seizures refractory — consider propofol infusion. Maintain adequate oxygenation throughout. Correct metabolic acidosis.", ref:"Toxicology / AES" },
      { cat:"🅒 Supportive", drug:"Cardiac Monitoring + Resuscitation", dose:"IV fluid bolus 500 mL NS if hemodynamically unstable. Vasopressors (norepinephrine) if fluid-refractory shock. Targeted temperature management post-arrest.", renal:"N/A", ivpo:"IV", deesc:"CO-induced myocardial depression responds to supportive care and O₂ in most cases. True cardiogenic shock rare but may require dobutamine or mechanical support.", note:"Most hemodynamic instability resolves with 100% O₂ therapy. Persistent shock suggests significant myocardial injury — echo-guided management.", ref:"ACLS 2023" },
    ],
    followup: [
      "Discharge only when COHb <5%, all symptoms resolved, and home environment confirmed safe (CO source identified and corrected)",
      "Delayed neurological sequelae (DNS): warn all patients of memory loss, personality change, parkinsonism 2–40 days post-exposure",
      "HBO therapy reduces DNS from ~30% to ~18% — document discussion and rationale for HBO decision",
      "Report CO source to local fire department/gas utility for investigation",
      "Mandatory household CO detector installation — discuss at discharge",
      "Cognitive follow-up at 4–6 weeks: formal neuropsychiatric testing for persistent deficits",
      "Pregnancy: neonatal monitoring at delivery; obstetrics consult regardless of COHb level",
    ]
  },
  etoh_intox: {
    overview: {
      def: "Acute alcohol (ethanol) intoxication is the most common toxicological presentation in emergency departments. EtOH is a GABA-A agonist and NMDA antagonist causing dose-dependent CNS depression. Intoxication alone is rarely fatal; danger lies in airway compromise, aspiration, hypothermia, hypoglycemia, and co-ingestions. A critical pitfall: altered mental status attributed to 'just alcohol' may conceal head trauma, hypoglycemia, hyponatremia (MDMA), or Wernicke's encephalopathy.",
      bullets: [
        "EtOH level correlates loosely with symptoms — tolerance dramatically shifts the relationship (alcoholic may appear sober at 300 mg/dL)",
        "Airway protection is the primary concern — aspiration pneumonia risk is significant with vomiting + CNS depression",
        "Hypoglycemia: EtOH inhibits gluconeogenesis — check POC glucose immediately; treat empirically if borderline",
        "Hypothermia: peripheral vasodilation causes rapid heat loss — rectal temp mandatory; rewarm actively",
        "Wernicke's triad: encephalopathy + ophthalmoplegia + ataxia — present in <20%; any suspicion = thiamine IV FIRST",
        "ALWAYS rule out co-ingestion, head trauma (CT if focal neuro, ETOH level disproportionate to GCS), and metabolic causes",
        "NEVER give glucose before thiamine in at-risk patients — precipitates Wernicke's encephalopathy",
      ]
    },
    workup: [
      { icon:"🧪", label:"Serum EtOH Level", detail:"Blood alcohol concentration (BAC/EtOH level). Confirms exposure. Tolerance = unreliable clinical correlation. EtOH falls ~15–25 mg/dL/hr in chronic users (faster). Critical threshold: >300 mg/dL = high aspiration risk; >400 mg/dL = respiratory depression risk." },
      { icon:"💉", label:"POC Blood Glucose — STAT", detail:"EtOH inhibits hepatic gluconeogenesis → hypoglycemia (especially fasting, chronic use, pediatric). Check immediately. Treat BG <70 with D50W 25g IV. Thiamine BEFORE glucose in malnourished/chronic alcoholics." },
      { icon:"🌡️", label:"Core Temperature (Rectal)", detail:"EtOH causes peripheral vasodilation → rapid heat loss. Hypothermia impairs drug metabolism (prolongs intoxication) and causes cardiac arrhythmias. Rectal temp mandatory. Active warming for <35°C." },
      { icon:"🧠", label:"Neurological Assessment + CT Head", detail:"GCS, focal deficits, pupillary exam. CT head if: focal deficits, GCS disproportionate to EtOH level, head trauma signs, failure to improve with expected EtOH metabolism, anticoagulant use." },
      { icon:"🔬", label:"BMP + Osmol Gap", detail:"Hyponatremia (beer potomania, SIADH), hypocalcemia, hypomagnesemia. Osmol gap screens for toxic alcohol co-ingestion (methanol/EG). Metabolic acidosis from EtOH ketoacidosis (AKA) — HAGMA with low/normal glucose." },
      { icon:"🫀", label:"ECG", detail:"Holiday heart syndrome: atrial fibrillation from acute binge. QTc prolongation. Assess for co-ingestion-related dysrhythmia. Troponin if chest pain." },
    ],
    treatment: [
      { cat:"🅐 Airway", drug:"Positioning + Airway Management", dose:"Recovery position (lateral decubitus) for all obtunded, non-intubated patients. Airway adjuncts (NPA) if tolerated. RSI if: GCS ≤8 with aspiration risk, respiratory rate <10, SpO₂ <90% despite O₂, inadequate protective reflexes", renal:"N/A", ivpo:"Procedural", deesc:"Reassess airway q15–30 min. Avoid unnecessary intubation — most patients recover with positioning and supportive care. Nasopharyngeal airway (NPA) well tolerated in intoxicated patients.", note:"Lateral decubitus position is the single most effective intervention to reduce aspiration risk in acute intoxication. Do NOT leave patient supine and unmonitored.", ref:"ACEP / Goldfrank's" },
      { cat:"🅐 Thiamine (FIRST)", drug:"Thiamine (Vitamin B1)", dose:"Wernicke's prevention/treatment: 500 mg IV over 30 min q8h × 3 doses (first 24h); THEN 250 mg IV/IM daily × 3–5 days. Routine prophylaxis in at-risk patients: 100 mg IV/IM × 1 before glucose", renal:"No adjustment", ivpo:"IV (preferred — superior bioavailability vs IM vs PO)", deesc:"Wernicke's is a clinical diagnosis — do NOT wait for classic triad (only 16% present with all three features). Ophthalmoplegia responds rapidly to thiamine (hours). Ataxia/encephalopathy may take days to weeks.", note:"GIVE THIAMINE BEFORE GLUCOSE in at-risk patients. Glucose metabolism depletes remaining thiamine → precipitates acute Wernicke's. Thiamine is safe and cheap — no reason to withhold.", ref:"Royal College of Physicians / UpToDate" },
      { cat:"🅑 Nutrition", drug:"Banana Bag (Multivitamin Infusion)", dose:"Standard banana bag: Thiamine 100 mg + Folate 1 mg + MVI (multivitamin) 1 vial in 1L NS or D5W over 1h. Modified: add Magnesium sulfate 2 g if hypomagnesemic. Note: thiamine ONLY if at-risk — standard MVI alone insufficient for Wernicke's", renal:"No dose adjustment for standard components", ivpo:"IV (1L bag over 1–2h)", deesc:"'Banana bag' is a colloquial term for multivitamin repletion IV — named for the yellow color from riboflavin (B2). For Wernicke's risk: use HIGH-DOSE thiamine (500 mg IV q8h) — NOT standard 100 mg banana bag alone.", note:"Common misconception: banana bag thiamine dose (100 mg) is INSUFFICIENT for Wernicke's treatment or prevention in high-risk cases. High-dose thiamine 500 mg IV q8h is required. Banana bag is adjunct nutrition support.", ref:"Goldfrank's / BMJ" },
      { cat:"🅑 Nutrition", drug:"Folic Acid (Folate)", dose:"1 mg PO or IV daily. In alcoholic nutritional deficiency: 1 mg/day × 4 months minimum. In pregnancy with EtOH use: 4–5 mg/day (neural tube defect prevention)", renal:"No adjustment", ivpo:"PO preferred for non-acute; IV acceptable", deesc:"Folate deficiency from poor nutrition + EtOH-induced folate malabsorption. Megaloblastic anemia if chronic deficiency. Replace routinely in chronic alcohol use disorder.", note:"Folic acid (synthetic) vs folinic acid (leucovorin): for EtOH deficiency, folic acid is correct. Folinic acid is used in methanol poisoning (different metabolic role).", ref:"Nutritional Guidelines" },
      { cat:"🅒 Glucose", drug:"Dextrose D50W", dose:"BG <70 mg/dL: 25g D50W IV (1 amp) — give AFTER thiamine in malnourished patients. Maintenance: D5NS or D10W infusion if prolonged monitoring", renal:"Caution with renal failure fluid overload", ivpo:"IV", deesc:"Avoid hypotonic fluids (D5W alone) in EtOH patients — risk of hyponatremia. Use D5NS or normal saline with glucose supplements.", note:"Check glucose q1h during monitoring. EtOH-induced hypoglycemia may recur as liver glucose stores remain depleted.", ref:"Supportive Care" },
    ],
    followup: [
      "Discharge only when alert, ambulatory, able to protect airway, and blood glucose stable",
      "Minimum observation: sober to GCS 15, tolerating PO, stable vitals — typically 4–8h depending on initial presentation",
      "AUDIT-C screening: 3+ (men) or 2+ (women) = positive screen for hazardous drinking — brief intervention and referral",
      "Thiamine PO at discharge: 100 mg TID for all at-risk patients; folate 1 mg/day",
      "Wernicke's diagnosed or suspected: inpatient admission, ophthalmology consult, MRI brain (mammillary body enhancement)",
      "Head trauma CT results before discharge if any mechanism or concerning exam",
      "Addiction medicine / social work referral; SAMHSA National Helpline: 1-800-662-4357",
    ]
  },
  etoh_withdrawal: {
    overview: {
      def: "Alcohol withdrawal syndrome (AWS) results from abrupt cessation or reduction of ethanol after chronic heavy use. Chronic EtOH upregulates NMDA receptors and downregulates GABA-A receptors — abrupt cessation creates CNS hyperexcitability. Spectrum: autonomic hyperactivity (tremor, diaphoresis, tachycardia) → withdrawal seizures (12–48h) → delirium tremens (DTs, 48–96h post last drink). DTs carry 5–15% mortality untreated; <1% with treatment. CIWA-Ar protocol guides symptom-triggered therapy.",
      bullets: [
        "Timeline: tremor/anxiety 6–24h → hallucinosis 12–48h → seizures 12–48h → DTs 48–96h post last drink",
        "CIWA-Ar ≥10 = moderate/severe — initiate pharmacotherapy; ≥15 = aggressive BZD therapy",
        "Delirium tremens (DTs): triad of confusion + autonomic hyperactivity + fever — ICU admission mandatory",
        "Seizures are generalized tonic-clonic; focal seizures suggest structural pathology — CT head required",
        "Wernicke's encephalopathy: concurrent risk — high-dose IV thiamine in ALL admitted AWS patients",
        "BZDs are first-line (cross-reactive with GABA-A) — long-acting preferred (diazepam, chlordiazepoxide)",
        "Phenobarbital: adjunct or alternative for refractory AWS; synergistic with BZDs; emerging as first-line at many centers",
      ]
    },
    workup: [
      { icon:"📋", label:"CIWA-Ar Score (q1–4h)", detail:"10 items: nausea/vomiting, tremor, diaphoresis, anxiety, agitation, headache, perceptual disturbances, paresthesias, auditory/visual disturbances, orientation. Score 0–67. <10 = mild; 10–18 = moderate; >18 = severe. Triggers medication dosing in symptom-triggered protocols." },
      { icon:"💉", label:"BMP + Magnesium + Phosphate", detail:"Hypomagnesemia lowers seizure threshold — replace empirically (Mg <2.0 → 2–4g IV). Hypophosphatemia (refeeding risk). Hypokalemia from vomiting. Hyponatremia from beer potomania or SIADH." },
      { icon:"🧠", label:"CT Head (Seizure or Focal Deficits)", detail:"First-time seizure in AWS context: CT to rule out subdural hematoma (fall risk), intracranial hemorrhage, or structural lesion. Focal deficits = mandatory CT regardless of ETOH history." },
      { icon:"🔬", label:"LFTs + Coagulation (PT/INR)", detail:"Hepatic function guides BZD choice — avoid long-acting BZDs (diazepam, chlordiazepoxide) in severe hepatic failure (accumulate). Use lorazepam or oxazepam (safer in liver failure — no active metabolites)." },
      { icon:"🌡️", label:"Vitals q1h (HR, BP, Temp, RR)", detail:"Autonomic instability is the hallmark of DTs. HR >120, SBP >160, or temp >38.5°C = severe AWS. Trends matter — rapidly escalating vitals despite treatment = impending DTs." },
      { icon:"🧪", label:"Blood Cultures + Infectious Workup", detail:"DTs fever vs infection: cannot be distinguished clinically. LP if meningismus. Blood/urine cultures in febrile DTs patients. Aspiration pneumonia common. Lower threshold for broad-spectrum antibiotics." },
    ],
    treatment: [
      { cat:"🅐 Thiamine — FIRST", drug:"Thiamine (Vitamin B1) HIGH DOSE", dose:"Wernicke's prevention: 500 mg IV over 30 min q8h × 3 doses (first 24h); THEN 250 mg IV/IM daily × 3–5 days. Minimum: 100 mg IV before any glucose. PO supplementation at discharge: 100 mg TID", renal:"No adjustment", ivpo:"IV preferred (PO absorption unreliable in alcoholics due to GI malabsorption and thiamine transporter saturation)", deesc:"Give HIGH-DOSE IV thiamine in ALL admitted AWS patients. Standard 100 mg banana bag dose is insufficient for Wernicke's prevention/treatment in high-risk cases. Thiamine is safe and cheap — no reason to use low dose.", note:"IV > IM > PO for bioavailability in active drinkers. Wernicke's is underdiagnosed at autopsy — erring toward high-dose IV thiamine is strongly recommended by all major guidelines.", ref:"Royal College of Physicians 2014 / EFNS" },
      { cat:"🅐 First-Line Sedation", drug:"Diazepam (Valium) — Symptom-Triggered", dose:"Mild-moderate (CIWA 10–18): 5–10 mg PO/IV q1–4h PRN. Severe/DTs (CIWA >18): 10–20 mg IV q5–10 min until calm; front-loading: 10 mg q1h × 3–4 doses then PRN. Lorazepam 1–2 mg IV q30 min: safer in hepatic failure", renal:"No adjustment", ivpo:"IV (severe) / PO (mild-moderate)", deesc:"Long-acting BZDs (diazepam, chlordiazepoxide) preferred — self-tapering via active metabolites. Short-acting (lorazepam, oxazepam) for liver failure or elderly. Symptom-triggered therapy superior to fixed-schedule.", note:"Front-loading diazepam for severe AWS: give 10 mg IV q1h until CIWA <10 — reduces total drug needed and DT incidence. Goal: calm, not sedated (RASS 0 to -1).", ref:"NEJM AWS Review / Goldfrank's" },
      { cat:"🅐 Adjunct", drug:"Phenobarbital", dose:"Adjunct to BZDs: 260 mg IV over 30 min × 1 (can repeat q3–4h, max 3 doses for severe). Monotherapy loading: 10–15 mg/kg IV at ≤100 mg/min. Maintenance: 30–60 mg PO TID-QID tapering", renal:"Reduce in renal failure", ivpo:"IV (acute) / PO (maintenance/taper)", deesc:"GABA-B + NMDA modulator — different mechanism than BZDs, synergistic. Increasingly used as first-line or BZD adjunct for refractory/severe AWS. Reduces ICU admission vs BZD alone (Ibarra et al. 2020).", note:"Phenobarbital + BZD: enhanced sedation — monitor respiratory status closely. Phenobarbital monotherapy: favored at some centers for reliable absorption and long half-life (~100h). Less euphoric than BZDs — lower misuse potential.", ref:"Annals EM / Phenobarbital for AWS" },
      { cat:"🅑 Banana Bag", drug:"IV Multivitamin Repletion ('Banana Bag')", dose:"Standard: Thiamine 100 mg + Folic acid 1 mg + MVI (multivitamin) 1 vial in 1L NS over 1–2h. Add: Magnesium sulfate 2 g IV if Mg <2.0. Repeat daily during admission. HIGH-RISK: replace thiamine 100 mg with 500 mg per dose", renal:"Standard; adjust Mg repletion in AKI", ivpo:"IV", deesc:"Banana bag name = yellow color from riboflavin (B2) in MVI. Routine in all admitted AWS patients. Key limitation: standard 100 mg thiamine is insufficient for Wernicke's — must use high-dose regimen separately.", note:"Order banana bag as supplemental nutrition support. Order HIGH-DOSE thiamine protocol SEPARATELY as the actual Wernicke's prevention/treatment. Do not conflate the two.", ref:"Clinical Standard of Care" },
      { cat:"🅑 Micronutrients", drug:"Folic Acid + Magnesium + Multivitamin", dose:"Folic acid: 1 mg IV/PO daily. Magnesium: if Mg <2.0 → 2–4 g IV over 2–4h; if Mg <1.5 → 4–8 g IV. Potassium: replace per sliding scale. Zinc 220 mg PO daily. MVI 1 vial daily IV.", renal:"Adjust Mg, K+ for renal function", ivpo:"IV (acute); PO (maintenance/discharge)", deesc:"Magnesium replacement reduces seizure threshold. Hypomagnesemia refractory to replacement until K+ also repleted (renal K+ wasting linked). Zinc deficiency: impairs hepatic alcohol metabolism, worsens cognitive recovery.", note:"Discharge: thiamine 100 mg PO TID + folate 1 mg/day + MVI + abstinence counseling. PO thiamine absorption is reduced in active alcoholics — IV/IM preferred during admission.", ref:"Nutritional Guidelines" },
      { cat:"🅒 Seizure", drug:"Lorazepam + Phenobarbital (Seizure)", dose:"Active seizure: lorazepam 4 mg IV → repeat 4 mg if no cessation in 5 min. Status epilepticus: phenobarbital 20 mg/kg IV at ≤100 mg/min. Prophylaxis: NOT recommended routinely (BZD titration is preventive)", renal:"Adjust phenobarbital in renal failure", ivpo:"IV", deesc:"AWS seizures respond well to BZDs — first-line. Phenytoin/fosphenytoin NOT effective for AWS seizures (NMDA-mediated, not sodium-channel). Post-seizure: escalate BZD therapy urgently.", note:"First AWS seizure: CT head mandatory. AWS seizures rarely need EEG unless focal features, prolonged postictal, or suspected non-convulsive status epilepticus. Do NOT use phenytoin for AWS seizure prophylaxis.", ref:"AES / Goldfrank's" },
    ],
    followup: [
      "CIWA-Ar q4h × 48–72h post last drink or until <10 for 24h — then safe to taper",
      "Discharge oral thiamine 100 mg TID + folate 1 mg/day + MVI — minimum 3–6 months",
      "Outpatient BZD taper for mild AWS: chlordiazepoxide 25 mg QID tapering over 5–7 days (or diazepam equivalent)",
      "Medically assisted treatment (MAT): naltrexone 50 mg/day PO or acamprosate 666 mg TID — start after detox complete",
      "Wernicke-Korsakoff syndrome: if Korsakoff's psychosis develops (confabulation, anterograde amnesia) — likely permanent; chronic care planning",
      "Addiction medicine / alcohol use disorder program referral before discharge",
      "AUDIT-C, PHQ-9 (comorbid depression), and safety plan for suicidal ideation (AUD + depression is high-risk)",
    ]
  },
  alcohols: {
    overview: {
      def: "Toxic alcohol poisoning from methanol or ethylene glycol. Both are odorless, colorless liquids. Ethanol (EtOH) is intentionally consumed; methanol (windshield fluid, bootleg alcohol) and ethylene glycol (antifreeze) are toxic via their metabolites, not the parent compound. KEY CONCEPT: both cause an osmol gap early and anion-gap metabolic acidosis late, as alcohol is metabolized to toxic acids. Fomepizole (4-MP) inhibits alcohol dehydrogenase, blocking formation of toxic metabolites.",
      bullets: [
        "Osmol gap = measured osmolality − (2[Na] + [BUN/2.8] + [glucose/18]) — normal <10; elevated = unmetabolized alcohol present",
        "Methanol metabolites: formic acid → retinal/optic nerve toxicity (blindness) + severe HAGMA",
        "Ethylene glycol metabolites: oxalic acid → calcium oxalate crystals → AKI + hypocalcemia",
        "EARLY: osmol gap elevated, anion gap normal (parent alcohol not yet metabolized)",
        "LATE: osmol gap falls, anion gap rises (parent metabolized to toxic acids)",
        "Both can present with EtOH-like inebriation — clinical diagnosis requires osmol gap calculation",
        "Fomepizole is preferred antidote — safe, effective, no sedation (vs EtOH infusion which is still used as alternative)",
      ]
    },
    workup: [
      { icon:"🧪", label:"Serum Osmolality + Calculated Osmolality → Osmol Gap", detail:"Osmol gap = measured − calculated. Gap >10 = unmetabolized alcohol. Measure STAT and calculate. Falling gap + rising anion gap = metabolism occurring = worsening prognosis if untreated. Methanol and EG have different specific contributions per mM." },
      { icon:"💉", label:"ABG + Electrolytes (Anion Gap)", detail:"HAGMA (high anion gap metabolic acidosis): AG = Na − (Cl + HCO₃). pH <7.3 with HAGMA = metabolite accumulation = urgent fomepizole + possibly dialysis. Most important prognostic indicator." },
      { icon:"🔬", label:"Specific Toxic Alcohol Levels", detail:"Methanol and ethylene glycol quantitative levels if available. NOT universally available — do NOT wait for levels to treat if clinical picture and osmol gap support diagnosis. Methanol level >20 mg/dL = hemodialysis indication." },
      { icon:"👁️", label:"Visual Acuity + Fundoscopy (Methanol)", detail:"Methanol: papilledema, optic disc hyperemia, visual field defects. Any visual complaint in suspected methanol poisoning requires urgent ophthalmology consult. Visual loss can be rapid and irreversible." },
      { icon:"🫀", label:"Calcium (Ethylene Glycol)", detail:"EG metabolism produces oxalate → chelates calcium → hypocalcemia → tetany, seizures, cardiac dysfunction. Calcium is NOT just a monitoring parameter — symptomatic hypocalcemia requires IV calcium replacement." },
      { icon:"🔬", label:"Urinalysis (Ethylene Glycol)", detail:"Calcium oxalate crystals (envelope-shaped monohydrate) in urine = pathognomonic for ethylene glycol ingestion. Wood's lamp fluorescence: antifreeze contains fluorescein — urine may fluoresce (unreliable)." },
    ],
    treatment: [
      { cat:"🅐 Antidote", drug:"Fomepizole (4-MP, Antizol)", dose:"Loading: 15 mg/kg IV over 30 min; then 10 mg/kg IV q12h × 4 doses; then 15 mg/kg IV q12h until levels undetectable", renal:"Dose interval q4h during hemodialysis (fomepizole is dialyzed)", ivpo:"IV", deesc:"Inhibits alcohol dehydrogenase (ADH) → blocks conversion of methanol to formic acid and EG to glycolic/oxalic acid. PREFERRED over EtOH (no sedation, safer, reliable). Continue until toxic alcohol levels <20 mg/dL AND pH normal AND no metabolic acidosis.", note:"Start fomepizole immediately on clinical suspicion — do NOT wait for confirmatory levels. EtOH alternative: load to EtOH level 100–150 mg/dL via IV or PO (used if fomepizole unavailable).", ref:"Brent NEJM 2009 / ACMT" },
      { cat:"🅐 Antidote", drug:"Hemodialysis (HD)", dose:"Emergent HD: methanol level >25 mg/dL, or EG level >50 mg/dL, or severe HAGMA (pH <7.25), or AKI, or visual symptoms (methanol)", renal:"INDICATED for AKI from EG", ivpo:"Procedural", deesc:"HD removes toxic alcohols AND their toxic metabolites (formate, glycolate, oxalate). Also corrects metabolic acidosis. Increase fomepizole to q4h interval during HD (dialyzed). Continue HD until pH normal, gap closed, level <20 mg/dL.", note:"Both fomepizole AND HD simultaneously for severe cases — fomepizole prevents further metabolite formation while HD removes existing metabolites and parent alcohol.", ref:"EXTRIP Guidelines" },
      { cat:"🅑 Correction", drug:"Sodium Bicarbonate (Metabolic Acidosis)", dose:"1–2 mEq/kg IV bolus for severe acidosis (pH <7.2); infusion to target pH >7.3", renal:"Monitor Na+ and pH", ivpo:"IV", deesc:"Alkalinization helps trap ionized formate in circulation (reduces CNS penetration in methanol toxicity). Supportive measure — does NOT treat underlying cause. Primary treatment is fomepizole + HD.", note:"Bicarb is a BRIDGE — do not delay HD for bicarb correction. Maintain urine alkalinization (pH >7.0) to reduce renal oxalate precipitation in EG poisoning.", ref:"Toxicology" },
      { cat:"🅒 Cofactors", drug:"Folinic Acid (Methanol) / Thiamine + Pyridoxine (EG)", dose:"Methanol: Folinic acid 50 mg IV q6h (enhances formate metabolism to CO₂). EG: Thiamine 100 mg IV + Pyridoxine 50 mg IV q6h (redirect oxalate pathway)", renal:"No adjustment", ivpo:"IV", deesc:"Methanol: folinic acid (NOT folic acid) accelerates formate elimination via tetrahydrofolate pathway. EG: thiamine and pyridoxine redirect oxalate metabolism to less toxic products (glycine).", note:"Low risk, potential benefit — give empirically in all confirmed or suspected cases. Folinic acid (leucovorin) NOT folic acid — different metabolic role.", ref:"Goldfrank's / Toxicology" },
    ],
    followup: [
      "Ophthalmology consult for ALL methanol poisoning — even mildly symptomatic patients may develop delayed visual loss",
      "Serial ABG and osmol gap q4–6h until both normalized and fomepizole therapy complete",
      "Hemodialysis: continue until toxic alcohol level <20 mg/dL, pH >7.3, anion gap closed",
      "Nephrology follow-up: AKI from ethylene glycol may require dialysis for days-weeks",
      "Investigate source: methanol exposure may indicate attempted poisoning, industrial exposure, or contaminated bootleg alcohol (public health reporting)",
      "Substance use counseling and addiction medicine referral if exposure related to substance use disorder",
    ]
  },
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

// ── Weight Dose Calculator Helper ────────────────────────────────
function calcWeightDoses(doseStr, weightKg) {
  if (!weightKg || weightKg <= 0 || !doseStr) return [];
  const results = [];
  // Match patterns like: 1.5 mg/kg, 0.1–0.5 mg/kg, 10–15 mg/kg, 1.5 mL/kg, etc.
  const re = /([\d.]+)(?:\s*[–\-]\s*([\d.]+))?\s*(mg|mcg|g|mL|units?)\/kg/gi;
  let m;
  const seen = new Set();
  while ((m = re.exec(doseStr)) !== null) {
    const lo = parseFloat(m[1]);
    const hi = m[2] ? parseFloat(m[2]) : null;
    const unit = m[3];
    const key = `${lo}-${hi}-${unit}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const loD = (lo * weightKg).toFixed(lo < 1 ? 2 : 1);
    const hiD = hi ? (hi * weightKg).toFixed(hi < 1 ? 2 : 1) : null;
    results.push({ label: hiD ? `${lo}–${hi} ${unit}/kg` : `${lo} ${unit}/kg`, calc: hiD ? `${loD}–${hiD} ${unit}` : `${loD} ${unit}` });
  }
  return results;
}

// ── DrugRow Component ──────────────────────────────────────────────
function DrugRow({ d, color, idx, weightKg }) {
  const [open, setOpen] = useState(null);
  const catColors = { "🅐":T.coral, "🅑":T.blue, "🅒":T.teal };
  const cc = catColors[d.cat[0]] || color;
  const weightDoses = calcWeightDoses(d.dose, weightKg);
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
        {weightDoses.length > 0 && (
          <div style={{display:"flex",gap:5,flexWrap:"wrap",justifyContent:"flex-end"}}>
            {weightDoses.map((wd,i) => (
              <span key={i} style={{fontFamily:"JetBrains Mono",fontSize:11,color:T.gold,background:"rgba(245,200,66,0.15)",border:"1px solid rgba(245,200,66,0.4)",padding:"2px 8px",borderRadius:6,whiteSpace:"nowrap"}}>⚖️ {wd.calc}</span>
            ))}
          </div>
        )}
        <span style={{fontFamily:"JetBrains Mono",fontSize:11,color:T.txt3,flexShrink:0}}>{d.ivpo}</span>
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

function ProtocolTab({ tx, color, weightKg }) {
  return (
    <div className="fade-in">
      <div style={{fontFamily:"JetBrains Mono",fontSize:11,color:T.orange,textTransform:"uppercase",letterSpacing:2,marginBottom:14}}>TREATMENT PROTOCOL</div>
      {tx.map((d,i)=><DrugRow key={i} d={d} color={color} idx={i} weightKg={weightKg}/>)}
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
  const navigate = useNavigate();
  const [sel, setSel] = useState("opioid");
  const [tab, setTab] = useState("overview");
  const [filter, setFilter] = useState("All");
  const [weightVal, setWeightVal] = useState("");
  const [weightUnit, setWeightUnit] = useState("kg");
  const weightKg = weightVal ? (weightUnit === "lbs" ? parseFloat(weightVal) * 0.453592 : parseFloat(weightVal)) : 0;
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
            <button onClick={()=>navigate("/hub")} style={{fontFamily:"DM Sans",fontSize:12,fontWeight:600,padding:"6px 14px",borderRadius:10,border:"1px solid rgba(59,158,255,0.4)",background:"rgba(59,158,255,0.1)",color:T.blue,cursor:"pointer",display:"flex",alignItems:"center",gap:6,transition:"all .15s",flexShrink:0}}
              onMouseEnter={e=>{e.currentTarget.style.background="rgba(59,158,255,0.2)"}}
              onMouseLeave={e=>{e.currentTarget.style.background="rgba(59,158,255,0.1)"}}
            >← Hub</button>
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

            {/* Weight Calculator Widget — shown on Protocol tab */}
            {tab==="protocol" && (
              <div style={{...glassCard,padding:"10px 16px",marginBottom:10,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",borderColor:"rgba(245,200,66,0.35)",background:"rgba(245,200,66,0.05)"}}>
                <span style={{fontFamily:"JetBrains Mono",fontSize:11,color:T.gold,letterSpacing:1,whiteSpace:"nowrap"}}>⚖️ WEIGHT-BASED CALC</span>
                <input
                  type="number" min="0" placeholder="Patient weight…" value={weightVal}
                  onChange={e=>setWeightVal(e.target.value)}
                  style={{fontFamily:"JetBrains Mono",fontSize:13,width:140,padding:"6px 10px",borderRadius:8,border:"1px solid rgba(245,200,66,0.4)",background:"rgba(14,37,68,0.8)",color:T.txt,outline:"none"}}
                />
                <div style={{display:"flex",borderRadius:8,overflow:"hidden",border:"1px solid rgba(42,79,122,0.6)"}}>
                  {["kg","lbs"].map(u=>(
                    <button key={u} onClick={()=>setWeightUnit(u)} style={{padding:"6px 14px",border:"none",cursor:"pointer",fontFamily:"DM Sans",fontWeight:700,fontSize:12,background:weightUnit===u?"rgba(245,200,66,0.25)":"rgba(14,37,68,0.8)",color:weightUnit===u?T.gold:T.txt3,transition:"all .15s"}}>{u}</button>
                  ))}
                </div>
                {weightKg > 0 && <span style={{fontFamily:"JetBrains Mono",fontSize:11,color:T.txt3}}>= {weightKg.toFixed(1)} kg — doses shown in <span style={{color:T.gold}}>gold</span> on each drug</span>}
                {!weightKg && <span style={{fontFamily:"DM Sans",fontSize:12,color:T.txt4}}>Enter weight to auto-calculate mg/kg doses</span>}
              </div>
            )}

            {/* Tab Content */}
            <div style={{...glassCard,padding:"20px",minHeight:400,overflow:"auto",maxHeight:"calc(100vh - 400px)"}}>
              {tab==="overview" && <OverviewTab ov={data.overview}/>}
              {tab==="workup"   && <WorkupTab wk={data.workup}/>}
              {tab==="protocol" && <ProtocolTab tx={data.treatment} color={cond.color} weightKg={weightKg}/>}
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
}// ToxHub.jsx
// Toxicology & Overdose Hub — standalone page + embeddable in encounter.
// Sections: Antidote Lookup · Ingestion Protocols · Rumack-Matthew Nomogram
//           Toxidrome Table · Poison Control Reference
//
// Props (embedded): demo, vitals, cc, medications — for context
// Constraints: no form, no localStorage, straight quotes only,
//   single react import, border before borderTop/etc.

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
// Treatment line (lower bound of treatment zone) in mcg/mL at hours 4–24
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
  // Interpolate
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
export default function ToxHub({ embedded = false, demo, cc, vitals }) {
  const navigate = useNavigate();
  const [mainTab,  setMainTab]  = useState("antidotes");
  const [expanded, setExpanded] = useState(null);
  const [search,   setSearch]   = useState("");

  // Nomogram state
  const [apapHours, setApapHours] = useState("");
  const [apapLevel, setApapLevel] = useState("");

  const toggle = useCallback((id) =>
    setExpanded(p => p === id ? null : id), []);

  // Search filter
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

  // Nomogram calculation
  const rmThreshold = useMemo(() => rmTreatmentThreshold(apapHours), [apapHours]);
  const apapResult  = useMemo(() => {
    const h = parseFloat(apapHours);
    const l = parseFloat(apapLevel);
    if (isNaN(h) || isNaN(l) || h < 4) return null;
    const thresh = rmTreatmentThreshold(h);
    if (!thresh) return null;
    return {
      threshold: thresh,
      treat: l >= thresh,
      level: l,
      hours: h,
    };
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

        {/* ── Standalone header ─────────────────────────────────────────────── */}
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

        {/* ── Tab strip ─────────────────────────────────────────────────────── */}
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

        {/* ── Search bar (antidotes + protocols) ──────────────────────────── */}
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

        {/* ══ ANTIDOTES TAB ═══════════════════════════════════════════════════ */}
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

        {/* ══ PROTOCOLS TAB ═══════════════════════════════════════════════════ */}
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

        {/* ══ NOMOGRAM TAB ════════════════════════════════════════════════════ */}
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

            {/* Input */}
            <div style={{ display:"flex", gap:10, flexWrap:"wrap",
              marginBottom:12 }}>
              <div style={{ flex:1, minWidth:150 }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                  color:T.txt4, letterSpacing:1.3, textTransform:"uppercase",
                  marginBottom:4 }}>Hours Since Ingestion</div>
                <input type="number" value={apapHours}
                  onChange={e => setApapHours(e.target.value)}
                  placeholder="e.g. 6"
                  min="4" max="24"
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

            {/* Threshold display */}
            {rmThreshold && !apapResult && (
              <div style={{ padding:"10px 14px", borderRadius:9,
                background:"rgba(42,79,122,0.1)",
                border:"1px solid rgba(42,79,122,0.3)",
                marginBottom:10 }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:9, color:T.txt4, letterSpacing:1,
                  marginBottom:3 }}>
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

            {/* Result */}
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

            {/* Nomogram reference table */}
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
              <div style={{ marginTop:10,
                fontFamily:"'DM Sans',sans-serif", fontSize:10,
                color:T.txt4, lineHeight:1.55 }}>
                This is the 150 mcg/mL at 4h nomogram line (original Rumack-Matthew).
                Some centers use a 100 mcg/mL line for higher-risk patients.
                If ingestion time is unknown, treat empirically.
              </div>
            </div>
          </div>
        )}

        {/* ══ TOXIDROMES TAB ══════════════════════════════════════════════════ */}
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
                    { label:"Pupils",   val:tox.pupils,  color:T.blue   },
                    { label:"Mental Status", val:tox.ms, color:T.purple },
                    { label:"Vitals",   val:tox.vitals,  color:T.coral  },
                    { label:"Skin",     val:tox.skin,    color:T.gold   },
                    { label:"Other",    val:tox.other,   color:T.teal   },
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

        {/* ══ POISON CONTROL TAB ══════════════════════════════════════════════ */}
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