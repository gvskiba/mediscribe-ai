/**
 * TriageHub.jsx — Notrya Clinical Platform (Combined)
 * ESI Calculator · ESI Reference Cards · START/SALT MCI · Danger Vitals
 * Fast Track · CC Quick Sort · Chief Complaint Protocols · AI Assistant
 */
import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";

(() => {
  const ID = "notrya-hub-fonts";
  if (document.getElementById(ID)) return;
  const l = document.createElement("link");
  l.id = ID; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;900&family=JetBrains+Mono:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
})();

const AC = "#fb923c";
const T = {
  bg:"#04080f", glass:"rgba(255,255,255,0.06)", glassD:"rgba(255,255,255,0.025)",
  border:"rgba(255,255,255,0.08)", borderHi:"rgba(255,255,255,0.16)",
  shine:"inset 0 1px 0 rgba(255,255,255,0.11)",
  txt:"#f0f4ff", txt2:"#a5b8d8", txt3:"#5a7490", txt4:"#2e4060",
  teal:"#2dd4bf", gold:"#fbbf24", coral:"#f87171",
  blue:"#60a5fa", purple:"#a78bfa", green:"#34d399", orange:"#fb923c",
};

// ── ESI Levels (enhanced: examples, criteria, disposition, vitals) ──
const ESI_LEVELS = [
  {
    level:1, label:"Resuscitation", color:"#f87171", bg:"rgba(248,113,113,0.12)", time:"Immediate", icon:"🔴",
    desc:"Requires immediate life-saving intervention",
    criteria:"Life-threatening — immediate MD intervention required",
    disposition:"Resuscitation bay — physician at bedside NOW",
    vitals:"Any critical vital sign abnormality",
    examples:["Cardiac arrest / PEA / VF / asystole","Respiratory arrest / apnea","Intubation required (severe distress)","Unresponsive / GCS ≤ 8","SBP < 80 — hemodynamic instability","Active major hemorrhage","Anaphylactic shock"],
  },
  {
    level:2, label:"Emergent", color:"#fb923c", bg:"rgba(251,146,60,0.12)", time:"< 15 min", icon:"🟠",
    desc:"High-risk situation, AMS, or severe pain/distress",
    criteria:"High-risk presentation OR confused/lethargic/disoriented OR severe pain (NRS ≥ 7)",
    disposition:"Rapid assessment room — immediate MD evaluation",
    vitals:"HR > 150, SBP < 90, SpO₂ < 90%, T > 38.5°C + 2 SIRS",
    examples:["Chest pain — possible ACS","Stroke symptoms (FAST positive)","Severe sepsis (≥ 2 SIRS + source)","Active suicidal ideation with plan","New altered mental status","GI bleed with hemodynamic changes","Ectopic pregnancy / ruptured ovarian cyst"],
  },
  {
    level:3, label:"Urgent", color:"#fbbf24", bg:"rgba(251,191,36,0.10)", time:"< 30 min", icon:"🟡",
    desc:"Multiple resources required, vitals stable",
    criteria:"Stable vitals + ≥ 2 resources (labs, imaging, IV fluids, consult, procedure)",
    disposition:"ED main — standard workup",
    vitals:"Normal or mildly abnormal — reassess q30 min",
    examples:["Moderate abdominal pain","Head injury minor (GCS 14–15)","Lacerations + imaging needed","Asthma moderate (SpO₂ > 92%)","Diabetic with high glucose, alert","Stable fracture with moderate pain"],
  },
  {
    level:4, label:"Less Urgent", color:"#34d399", bg:"rgba(52,211,153,0.10)", time:"< 60 min", icon:"🟢",
    desc:"Exactly one resource required",
    criteria:"Stable vitals + exactly 1 resource (one lab OR one X-ray)",
    disposition:"Fast track / urgent care area",
    vitals:"Normal",
    examples:["Simple laceration (< 2 cm, clean)","Earache / otitis media","Sore throat without stridor","Sprained ankle (mild, Ottawa neg.)","UTI symptoms — afebrile","Minor allergic reaction (skin only)"],
  },
  {
    level:5, label:"Non-Urgent", color:"#60a5fa", bg:"rgba(96,165,250,0.10)", time:"< 120 min", icon:"🔵",
    desc:"No resources anticipated — exam and/or Rx only",
    criteria:"Stable vitals + no resources beyond H&P and/or Rx",
    disposition:"Fast track / redirect to PCP or urgent care",
    vitals:"Normal",
    examples:["Medication refill","Suture removal","Cold / congestion — mild","Minor stable rash","Prescription lost","TB test read","Immunization request"],
  },
];

// ── Chief complaint categories & protocol cards ───────────────
const CATEGORIES = ["Respiratory","Cardiovascular","Neurological","Abdominal","Trauma","Other"];
const ITEMS = [
  {id:"dyspnea",   icon:"🫁",title:"Dyspnea / SOB",          subtitle:"Asthma · COPD · PE · CHF",             badge:"ESI 1–3",severity:"Assess work of breathing, SpO2, RR. HFNC if SpO2 <94% on NRM.",         cat:"Respiratory",   accent:"#60a5fa",esi:[1,2,3]},
  {id:"chest_pain",icon:"❤️",title:"Chest Pain",             subtitle:"ACS · PE · Dissection · Pericarditis",  badge:"ESI 1–2",severity:"12-lead within 10 min. HEART score risk stratification.",                cat:"Cardiovascular",accent:"#f87171",esi:[1,2]},
  {id:"stroke",    icon:"🧠",title:"Stroke / TIA",           subtitle:"FAST+ · Focal deficit · Dysarthria",    badge:"ESI 1–2",severity:"Activate stroke protocol. CT without contrast. LKW time critical.",        cat:"Neurological",  accent:"#a78bfa",esi:[1,2]},
  {id:"syncope",   icon:"😵",title:"Syncope / Near-Syncope", subtitle:"Vasovagal · Cardiac · Orthostatic",     badge:"ESI 2–3",severity:"ECG. Orthostatic vitals. Canadian Syncope Score.",                        cat:"Cardiovascular",accent:"#fb923c",esi:[2,3]},
  {id:"abd_pain",  icon:"🫃",title:"Abdominal Pain",         subtitle:"Appendicitis · Obstruction · Ectopic",  badge:"ESI 2–3",severity:"β-hCG in all reproductive-age females. Peritoneal signs = emergent.",      cat:"Abdominal",     accent:"#fbbf24",esi:[2,3]},
  {id:"altered",   icon:"🧩",title:"Altered Mental Status",  subtitle:"Hypoglycemia · Sepsis · OD · CVA",      badge:"ESI 1–2",severity:"POC glucose STAT. AEIOU-TIPS. Sepsis screen if febrile.",                 cat:"Neurological",  accent:"#f87171",esi:[1,2]},
  {id:"trauma",    icon:"🤕",title:"Major Trauma",           subtitle:"MVC · Fall · Penetrating",              badge:"ESI 1–2",severity:"ATLS primary survey. Activate trauma team. Two large-bore IVs.",           cat:"Trauma",        accent:"#f87171",esi:[1,2]},
  {id:"laceration",icon:"🩹",title:"Laceration / Minor Wound",subtitle:"Simple lac · Wound check · Suture",   badge:"ESI 4–5",severity:"Assess depth, contamination, tendon/nerve. Fast track eligible.",           cat:"Trauma",        accent:"#34d399",esi:[4,5]},
  {id:"uti",       icon:"💧",title:"UTI / Dysuria",          subtitle:"Uncomplicated UTI · Cystitis",          badge:"ESI 4–5",severity:"UA + culture. Fast track if afebrile and hemodynamically stable.",          cat:"Other",         accent:"#34d399",esi:[4,5]},
  {id:"uri",       icon:"🤧",title:"URI / Sore Throat",      subtitle:"Pharyngitis · Otitis · Sinusitis",      badge:"ESI 4–5",severity:"Rapid strep if ≥2 Centor criteria. Fast track eligible.",                  cat:"Other",         accent:"#2dd4bf",esi:[4,5]},
  {id:"sepsis",    icon:"🦠",title:"Sepsis / Infection",     subtitle:"SIRS · Septic shock · Source control",  badge:"ESI 1–2",severity:"Hour-1 bundle. Lactate, BCx×2, IVF, abx within 1h, vasopressors prn.",    cat:"Other",         accent:"#f87171",esi:[1,2]},
  {id:"back_pain", icon:"🦴",title:"Back Pain",              subtitle:"Musculoskeletal · Radiculopathy",       badge:"ESI 4–5",severity:"Red flags: saddle anesthesia, bilateral weakness, fever. Fast track if none.",cat:"Other",        accent:"#34d399",esi:[4,5]},
];

const ITEM_DATA = {
  dyspnea:{
    definition:"Dyspnea is subjective difficulty breathing with objective correlates: tachypnea, hypoxia, accessory muscle use, tripod positioning, inability to speak in full sentences. PE or tension PTX may present deceptively.",
    workup:[{icon:"🫁",label:"SpO2 + waveform capnography",detail:"Target ≥94% (88–92% in COPD). ETCO2 for ventilatory status."},{icon:"❤️",label:"ECG + BNP/NT-proBNP",detail:"Exclude ACS/arrhythmia. BNP >100 pg/mL suggests decompensated CHF."},{icon:"🩻",label:"CXR ± Lung POCUS",detail:"B-lines = pulmonary edema; absent sliding = PTX; consolidation = PNA."},{icon:"🧪",label:"ABG/VBG + D-dimer",detail:"pCO2 retention = respiratory failure. D-dimer if Wells ≥2."}],
    treatment:[{cat:"Airway",drug:"O2 supplementation",dose:"NC → NRM → HFNC (40–60 L/min) → BiPAP — titrate to SpO2 target",note:"HFNC preferred for moderate hypoxic RF; reduces intubation need.",ref:"Level A"},{cat:"Bronchospasm",drug:"Albuterol",dose:"2.5 mg neb q20 min × 3, then q1–4h; MDI 4–8 puffs",note:"Add ipratropium 0.5 mg q20 min × 3 for moderate–severe asthma/COPD.",ref:"Level A"}],
    followup:["Reassess SpO2 q15–30 min during initial stabilization","Admit if requiring >4L NC O2, persistent dyspnea, or unclear etiology","COPD/asthma: admit if FEV1 <40% predicted after treatment"],
    reference:"GOLD COPD 2024 · AHA/ACC HF 2022 · ACEP Dyspnea Policy",
  },
  chest_pain:{
    definition:"Chest pain demands immediate risk stratification for ACS, aortic dissection, PE, and tension PTX before more benign etiologies. Life-threatening diagnoses must be actively excluded, not assumed absent.",
    workup:[{icon:"❤️",label:"12-lead ECG within 10 min",detail:"STEMI criteria, Wellens, de Winter T-waves, Sgarbossa in LBBB."},{icon:"🧪",label:"High-sensitivity troponin 0h/1h",detail:"HEART ≤3 + negative troponin = 0.9–1.7% MACE. hs-cTnI <5 ng/L at 0h = 99.6% NPV."},{icon:"📊",label:"HEART / TIMI / GRACE Score",detail:"HEART ≤3 + negative serial troponins = safe for discharge pathway."}],
    treatment:[{cat:"STEMI",drug:"Aspirin + Heparin",dose:"ASA 325 mg PO; UFH 60 U/kg IV bolus (max 4000 U) + infusion",note:"Cath lab activation. Door-to-balloon <90 min. P2Y12 per interventionalist.",ref:"Level A"},{cat:"Dissection ⚠",drug:"Rate + BP control",dose:"Esmolol IV → HR <60, SBP 100–120 mmHg. AVOID thrombolytics.",note:"CTA chest immediately. Type A → emergent surgical consult.",ref:"Level A"}],
    followup:["STEMI: primary PCI goal <90 min from first medical contact","HEART ≤3 + negative serial troponins: discharge with cardiology f/u in 72h","High HEART or positive troponin: admission for further stratification"],
    reference:"ACC/AHA NSTEMI 2021 · ESC Chest Pain 2021 · ACEP Policy 2022",
  },
  stroke:{
    definition:"Ischemic stroke: sudden focal neurological deficit from cerebral ischemia. Time is brain — 1.9M neurons/min lost untreated. LKW time is the most critical data point at presentation.",
    workup:[{icon:"⏱️",label:"Last Known Well (LKW) time",detail:"tPA eligibility: 0–4.5h. Thrombectomy: 0–24h in DAWN/DEFUSE criteria."},{icon:"🧠",label:"CT head without contrast",detail:"Exclude hemorrhage before thrombolytics. ASPECTS ≥6 for EVT."},{icon:"📊",label:"NIHSS + CTA head/neck",detail:"NIHSS ≥6 = LVO likely → CTA. Document carefully for tPA/EVT eligibility."}],
    treatment:[{cat:"Thrombolysis",drug:"Alteplase (tPA)",dose:"0.9 mg/kg IV (max 90 mg); 10% bolus over 1 min, rest over 60 min",note:"0–4.5h from LKW. BP <185/110 before administration.",ref:"Level A"},{cat:"Thrombectomy",drug:"Mechanical EVT",dose:"LVO up to 24h from LKW in DAWN/DEFUSE-eligible patients",note:"Superior to tPA alone for LVO. Do NOT delay EVT to give tPA.",ref:"Level A"}],
    followup:["Admit to stroke unit or neuro-ICU","Aspirin 325 mg at 24h post-tPA; telemetry for paroxysmal AFib × 24–48h"],
    reference:"AHA/ASA Stroke 2019 (Updated 2022) · DAWN/DEFUSE-3 Trials",
  },
  sepsis:{
    definition:"Sepsis-3: life-threatening organ dysfunction from dysregulated host response (SOFA ≥2). Septic shock: vasopressor requirement for MAP ≥65 + lactate >2 mmol/L despite adequate fluids.",
    workup:[{icon:"🧪",label:"Lactate (POC preferred)",detail:"≥2 mmol/L = sepsis. ≥4 = high-risk shock. Repeat at 2h — goal >10% clearance."},{icon:"🩸",label:"Blood cultures × 2",detail:"Before abx if possible — do NOT delay abx >45 min for cultures."},{icon:"🩺",label:"CBC, CMP, coags, procalcitonin",detail:"Thrombocytopenia + elevated Cr + elevated bili = organ dysfunction."}],
    treatment:[{cat:"Hour-1",drug:"Crystalloid IVF",dose:"30 mL/kg IV over 3h; reassess with POCUS q30 min",note:"Balanced crystalloids (LR) preferred. Stop early if signs of volume overload.",ref:"Level A"},{cat:"Hour-1",drug:"Broad-spectrum Abx",dose:"Pip-tazo 3.375g q8h + vancomycin per weight/levels",note:"Within 1h. Source-direct at 48–72h; de-escalate per culture data.",ref:"Level A"},{cat:"Shock",drug:"Norepinephrine",dose:"0.1–0.3 mcg/kg/min; titrate MAP ≥65 mmHg",note:"Vasopressor of choice. Add vasopressin 0.03 U/min for refractory shock.",ref:"Level A"}],
    followup:["ICU for septic shock; stepdown for sepsis with close reassessment","Repeat lactate at 2h — >10% clearance failure = increased mortality"],
    reference:"Surviving Sepsis Campaign 2021 · SEP-1 Bundle · CMS Sepsis Measure",
  },
  altered:{
    definition:"Acute AMS: sudden change from cognitive baseline. AEIOU-TIPS covers reversible causes. Hypoglycemia is the most common immediately reversible cause — must be excluded first in every patient.",
    workup:[{icon:"🩸",label:"POC glucose STAT",detail:"Treat empirically if <60 mg/dL. Thiamine 100 mg IV before dextrose in malnourished."},{icon:"🧪",label:"BMP + ammonia + LFTs + TSH",detail:"Hyponatremia, uremia, hepatic encephalopathy, hypothyroidism."},{icon:"💊",label:"Tox screen + EtOH + APAP/ASA",detail:"UDS, serum APAP/ASA in all suspected intentional OD. Medication reconciliation."}],
    treatment:[{cat:"Hypoglycemia",drug:"Dextrose",dose:"D50W 25g IV; D10W 250 mL IV; glucagon 1 mg IM if no IV access",note:"Thiamine 100 mg IV before dextrose in malnourished/alcoholic patients.",ref:"Level A"},{cat:"Opioid OD",drug:"Naloxone",dose:"0.4–2 mg IV/IM/IN q2–3 min; titrate to RR ≥12 and arousability",note:"Avoid full reversal. Infusion at 2/3 reversal dose/hr for long-acting opioids.",ref:"Level A"}],
    followup:["Identify and treat underlying cause before disposition","All new-onset AMS without clear reversible etiology: admission + workup"],
    reference:"ACEP AMS Policy 2023 · AGS Beers Criteria 2023",
  },
  laceration:{
    definition:"Simple lacerations involve only epidermis/dermis without tendon, nerve, or vascular involvement. Fast track eligible unless complex features. Tendon/neurovascular involvement requires specialty consultation.",
    workup:[{icon:"🩺",label:"Depth, contamination, tendon/nerve exam",detail:"Motor and sensory testing distal to wound. Two-point discrimination for hand injuries."},{icon:"💉",label:"Tetanus status",detail:"Tdap if no booster in 10 years (5 years for contaminated). TIG if unimmunized."}],
    treatment:[{cat:"Simple",drug:"Primary closure",dose:"Nylon 3-0/4-0 (trunk/extremity), 5-0/6-0 (face), staples (scalp)",note:"Irrigate with NS ≥200 mL. Closure within 8–12h ideally.",ref:"Level A"},{cat:"Infected/Bite",drug:"Augmentin / Keflex",dose:"Amoxicillin-clavulanate 875/125 mg BID × 5d or cephalexin 500 mg QID",note:"MRSA coverage (TMP-SMX/doxycycline) if cellulitis risk factors.",ref:"Level B"}],
    followup:["Face: sutures 3–5d; scalp/extremity: 7–10d; joints: 10–14d","Return precautions: fever >101°F, erythema, purulent discharge, numbness"],
    reference:"ACEP Wound Care Guidelines · UpToDate Laceration Repair 2024",
  },
  uti:{
    definition:"Uncomplicated UTI: dysuria, frequency, urgency in non-pregnant women without fever or upper tract signs. Fast track eligible if afebrile and hemodynamically stable. Pyelonephritis is NOT fast track eligible.",
    workup:[{icon:"🧪",label:"UA + urine culture",detail:"Pyuria ≥10 WBC/hpf + bacteriuria. Culture if complicated, pregnant, or treatment failure."},{icon:"🌡️",label:"Vital signs (fever exclusion)",detail:"Temperature >38°C or tachycardia = pyelonephritis — remove from fast track."}],
    treatment:[{cat:"Uncomplicated",drug:"Nitrofurantoin",dose:"100 mg macrocrystals BID × 5d; avoid if CrCl <30 or pyelonephritis",note:"TMP-SMX DS BID × 3d if resistance <20%. Fosfomycin 3g × 1 as alternative.",ref:"Level A"},{cat:"Complicated",drug:"Cipro / Ceftriaxone",dose:"Ciprofloxacin 500 mg BID × 7d PO; ceftriaxone 1g IV if oral not tolerated",note:"Urology for recurrent UTI (≥3/year). Renal US if obstructive uropathy suspected.",ref:"Level B"}],
    followup:["Uncomplicated: discharge with oral abx; no routine follow-up needed","Pyelonephritis: IV abx if unable to tolerate PO, pregnant, or immunocompromised"],
    reference:"IDSA UTI Guidelines 2011 (Updated) · AUA/SUFU Recurrent UTI 2022",
  },
  uri:{
    definition:"URI encompasses pharyngitis, otitis media, rhinosinusitis. Vast majority are viral. Antibiotics only for confirmed/highly probable bacterial infection — empiric treatment drives resistance.",
    workup:[{icon:"🧪",label:"Rapid Strep A (Centor/McIsaac ≥2)",detail:"Exudate + cervical LAD + fever + no cough = 4 Centor criteria. Do NOT treat empirically in adults."},{icon:"🔬",label:"Monospot if mono suspected",detail:"Severe pharyngitis + splenomegaly + atypical lymphocytes. AVOID amoxicillin (maculopapular rash)."}],
    treatment:[{cat:"GAS Pharyngitis",drug:"Amoxicillin",dose:"500 mg BID × 10d PO; penicillin V 500 mg BID × 10d",note:"Azithromycin Z-pack if PCN allergic. Dexamethasone 10 mg IM/PO for symptom relief.",ref:"Level A"},{cat:"Otitis Media",drug:"Amoxicillin",dose:"875 mg BID × 5–7d; Augmentin if failure at 48–72h or recent amoxicillin",note:"Observation 48–72h acceptable for mild–moderate AOM in adults.",ref:"Level B"}],
    followup:["Viral URI: supportive care, return precautions for worsening","Strep: re-test if symptoms persist >3d after completing full antibiotics"],
    reference:"IDSA Pharyngitis 2012 · AAP AOM Guidelines 2022",
  },
  syncope:{
    definition:"Transient LOC from global cerebral hypoperfusion with spontaneous full recovery. Canadian Syncope Risk Score stratifies 30-day serious adverse event risk. Cardiac etiology carries highest mortality.",
    workup:[{icon:"❤️",label:"12-lead ECG",detail:"Prolonged QTc, Brugada, pre-excitation, LBBB/RBBB, sinus pauses, ischemic changes."},{icon:"📊",label:"Canadian Syncope Risk Score",detail:"Score ≥0 = not low risk → further workup. Assess: predisposition, trigger, heart disease, troponin, QRS."}],
    treatment:[{cat:"Vasovagal",drug:"IVF + Physical maneuvers",dose:"1–2L NS if volume depleted; physical counterpressure maneuvers for recurrent VVS",note:"No routine pharmacologic therapy for first-episode VVS.",ref:"Level B"}],
    followup:["High risk (structural heart disease, exertional, prior cardiac arrest): admit for monitoring","Canadian Score ≥0: 6h observation + continuous monitoring + cardiology"],
    reference:"Canadian Syncope Risk Score · ESC Syncope 2018 · SFSR Validation",
  },
  abd_pain:{
    definition:"Abdominal pain ranges from benign to life-threatening. β-hCG mandatory in all reproductive-age females — ectopic must be excluded first. Peritoneal signs = emergent surgical evaluation.",
    workup:[{icon:"🤰",label:"β-hCG STAT (all reproductive-age females)",detail:"Ectopic excluded before any other workup. POCUS if positive."},{icon:"🩻",label:"CT abdomen/pelvis with IV contrast",detail:"Gold standard. CT without contrast for urolithiasis. POCUS for biliary/aorta."},{icon:"🧪",label:"CBC, CMP, lipase, UA, lactate",detail:"Lipase for pancreatitis. Lactate if bowel ischemia suspected."}],
    treatment:[{cat:"Pain control",drug:"Ketorolac + Morphine",dose:"Ketorolac 15–30 mg IV; morphine 0.05–0.1 mg/kg IV; ondansetron 4 mg IV",note:"Early analgesia does NOT mask surgical abdomen — treat pain promptly.",ref:"Level A"}],
    followup:["Peritoneal signs, free air, mesenteric ischemia: emergent surgical consult","Appendicitis: surgery within 12–24h; observe 4–6h if diagnosis unclear"],
    reference:"ACEP Abdominal Pain Policy · ACS Clinical Practice Guidelines",
  },
  back_pain:{
    definition:"Acute low back pain requires active red flag screening for cauda equina, spinal infection, malignancy, and AAA before treating as musculoskeletal. Red flags must be explicitly documented.",
    workup:[{icon:"🚨",label:"Red flag screen (cauda equina)",detail:"Saddle anesthesia, bilateral leg weakness/numbness, bowel/bladder dysfunction → emergent MRI within 4h."},{icon:"🩺",label:"Straight leg raise + neurological exam",detail:"Positive SLR at <45° = radiculopathy. Document dermatomal sensory and motor deficits."}],
    treatment:[{cat:"Acute LBP",drug:"NSAIDs + Muscle relaxants",dose:"Ibuprofen 600–800 mg TID × 5–7d; cyclobenzaprine 5 mg TID × 3–5d",note:"Avoid opioids for uncomplicated LBP (ACEP/ACP guideline). Early mobilization.",ref:"Level A"}],
    followup:["Cauda equina: emergent MRI, neurosurgery consult — operative window ≤24–48h for best outcomes","Uncomplicated: discharge with NSAIDs, activity guidance, f/u in 2–4 weeks if not improving"],
    reference:"ACEP Low Back Pain Policy 2017 · ACP LBP Guidelines 2017",
  },
  trauma:{
    definition:"Major trauma requires ATLS primary survey. Life threats addressed in ABCDE sequence. 30% of trauma deaths are preventable with rapid hemorrhage control and airway management.",
    workup:[{icon:"🩻",label:"FAST exam",detail:"Free fluid abdomen, pericardial effusion, hemothorax/PTX. Takes <2 min — do not delay."},{icon:"🩸",label:"T&S + trauma labs",detail:"CBC, CMP, coags, lactate. MTP triggers: lactate >5, SBP <90 despite fluids, HR >120."}],
    treatment:[{cat:"Hemorrhagic shock",drug:"MTP",dose:"pRBC:FFP:Plt = 1:1:1; TXA 1g IV × 2 doses (≤3h from injury)",note:"Permissive hypotension SBP 80–90 until hemorrhage controlled. Ca 1g IV per 4U pRBC.",ref:"Level A"},{cat:"Airway",drug:"Video laryngoscopy RSI",dose:"Ketamine 1.5 mg/kg + succinylcholine 1.5 mg/kg or rocuronium 1.2 mg/kg",note:"Cric kit at bedside. C-spine precautions during laryngoscopy.",ref:"Level A"}],
    followup:["Transfer to Level I/II trauma center if resources unavailable locally","Tertiary survey within 24–48h to identify occult injuries"],
    reference:"ATLS 10th Edition · EAST Trauma Guidelines · ACEP Trauma Policies",
  },
};

// ── Danger vital sign thresholds with action triggers ─────────
const VITAL_THRESHOLDS = [
  {vital:"Heart Rate",       icon:"❤️",unit:"bpm",rows:[
    {label:"Severe Brady",    range:"< 40",    level:"emergent",  color:"#f87171",action:"Transcutaneous pacing, IV atropine 0.5 mg, cardiology stat"},
    {label:"Sinus Brady",     range:"40–59",   level:"high",      color:"#fb923c",action:"12-lead ECG, symptom assessment, atropine if symptomatic"},
    {label:"Normal",          range:"60–100",  level:"normal",    color:"#34d399",action:""},
    {label:"Tachycardia",     range:"101–149", level:"moderate",  color:"#fbbf24",action:"Assess cause: pain, fever, dehydration, PE, dysrhythmia"},
    {label:"SVT / Rapid AF",  range:"≥ 150",   level:"emergent",  color:"#f87171",action:"12-lead, vagal maneuvers, adenosine 6 mg IV, cardioversion if unstable"},
  ]},
  {vital:"Systolic BP",      icon:"🩸",unit:"mmHg",rows:[
    {label:"Hypotension",     range:"< 90",    level:"emergent",  color:"#f87171",action:"IV access ×2, fluid bolus 30 mL/kg, assess for sepsis/hemorrhage/cardiogenic"},
    {label:"Low-Normal",      range:"90–119",  level:"moderate",  color:"#fbbf24",action:"Monitor closely, assess symptoms, trend vitals q15 min"},
    {label:"Normal",          range:"120–139", level:"normal",    color:"#34d399",action:""},
    {label:"Stage 2 HTN",     range:"160–179", level:"high",      color:"#fb923c",action:"Assess for hypertensive urgency vs emergency (end-organ damage?)"},
    {label:"HTN Emergency",   range:"≥ 180",   level:"emergent",  color:"#f87171",action:"End-organ damage workup: ECG, CXR, troponin, BMP, CT head if AMS"},
  ]},
  {vital:"Respiratory Rate", icon:"🫁",unit:"br/min",rows:[
    {label:"Bradypnea",        range:"< 10",   level:"emergent",  color:"#f87171",action:"Stimulate patient, assess opioid toxicity, prepare for intubation"},
    {label:"Normal",           range:"12–20",  level:"normal",    color:"#34d399",action:""},
    {label:"Tachypnea",        range:"21–29",  level:"moderate",  color:"#fbbf24",action:"Assess: pain, anxiety, PE, pneumonia, metabolic acidosis"},
    {label:"Severe Tachypnea", range:"≥ 30",   level:"emergent",  color:"#f87171",action:"High-flow O₂, ABG, CXR, prepare for possible intubation"},
  ]},
  {vital:"SpO₂",             icon:"💧",unit:"%",rows:[
    {label:"Critical Hypoxia",  range:"< 88",  level:"emergent",  color:"#f87171",action:"BVM immediately, high-flow O₂, urgent intubation preparation"},
    {label:"Hypoxia",           range:"88–93", level:"high",      color:"#fb923c",action:"O₂ via NRB, investigate cause, ABG; target 88–92% in COPD"},
    {label:"Low-Normal",        range:"94–95", level:"moderate",  color:"#fbbf24",action:"O₂ if symptomatic, monitor closely"},
    {label:"Normal",            range:"96–100",level:"normal",    color:"#34d399",action:""},
  ]},
  {vital:"Temperature",      icon:"🌡️",unit:"°F",rows:[
    {label:"Severe Hypothermia",range:"< 95",      level:"emergent",  color:"#f87171",action:"Active rewarming, cardiac monitoring (Osborn J-waves), warm IVF"},
    {label:"Mild Hypothermia",  range:"95–96.8",   level:"high",      color:"#fb923c",action:"Passive rewarming, warm blankets, monitor for arrhythmia"},
    {label:"Normal",            range:"97–99.5",   level:"normal",    color:"#34d399",action:""},
    {label:"Fever",             range:"101–103.9", level:"high",      color:"#fb923c",action:"Source evaluation, antipyretics, blood cultures if sepsis concern"},
    {label:"Hyperpyrexia",      range:"≥ 104",     level:"emergent",  color:"#f87171",action:"Rapid cooling, sepsis workup, LP if meningism, acetaminophen IV"},
  ]},
  {vital:"GCS",              icon:"🧠",unit:"points",rows:[
    {label:"Severe Impairment",  range:"3–8",  level:"emergent",  color:"#f87171",action:"Airway protection, RSI preparation, emergent neuro/neurosurgery"},
    {label:"Moderate Impairment",range:"9–12", level:"high",      color:"#fb923c",action:"Close monitoring, CT head, tox screen, POC glucose"},
    {label:"Mild Impairment",    range:"13–14",level:"moderate",  color:"#fbbf24",action:"Thorough neuro exam, glucose, CT if indicated, serial assessments"},
    {label:"Normal",             range:"15",   level:"normal",    color:"#34d399",action:""},
  ]},
  {vital:"Blood Glucose",    icon:"🩺",unit:"mg/dL",rows:[
    {label:"Critical Hypoglycemia",range:"< 50",    level:"emergent",  color:"#f87171",action:"D50W 25g IV immediately; glucagon 1 mg IM if no IV access"},
    {label:"Hypoglycemia",         range:"50–69",   level:"high",      color:"#fb923c",action:"D50W or oral glucose if alert; recheck in 15 min"},
    {label:"Normal",               range:"70–140",  level:"normal",    color:"#34d399",action:""},
    {label:"Hyperglycemia",        range:"141–400", level:"moderate",  color:"#fbbf24",action:"Assess for DKA/HHS: ketones, ABG/VBG, bicarb, osmolality"},
    {label:"Critical Hyperglycemia",range:"> 400",  level:"high",      color:"#fb923c",action:"DKA/HHS protocol: IVF, insulin, electrolyte replacement, hourly glucose"},
  ]},
];

// ── CC Quick Sort with escalation flags ───────────────────────
const CC_SORT = [
  {cc:"Chest Pain",           esi:2,flag:"🚨",color:"#f87171",flags:["ST changes = ESI 1","Diaphoresis + CP = ESI 1","Hemodynamic instability = ESI 1","Pleuritic pain → consider PE"],workup:"12-lead ECG ≤ 10 min · hs-troponin · CXR · IV access · HEART score"},
  {cc:"Shortness of Breath",  esi:2,flag:"🚨",color:"#f87171",flags:["SpO₂ < 90% = ESI 1","Silent chest = ESI 1","Stridor = ESI 1–2","Accessory muscle use = ESI 2"],workup:"SpO₂, RR, POCUS · CXR · ABG if severe · BNP/D-dimer per presentation"},
  {cc:"Altered Mental Status",esi:2,flag:"🚨",color:"#f87171",flags:["GCS < 8 = ESI 1","Focal deficit = ESI 2","New onset = ESI 2","Signs of herniation = ESI 1"],workup:"POC glucose STAT · CT head · BMP · Tox screen · Blood cultures if febrile"},
  {cc:"Stroke Symptoms",      esi:2,flag:"🚨",color:"#f87171",flags:["LKW time critical — document immediately","NIHSS > 6 = LVO likely (CTA head/neck)","tPA window 0–4.5h; EVT window 0–24h","Activate stroke alert — do NOT delay CT"],workup:"CT head w/o contrast STAT · CTA head/neck · Glucose · CBC · INR"},
  {cc:"Seizure",              esi:2,flag:"⚠️",color:"#fb923c",flags:["Active seizure = ESI 1","Status epilepticus = ESI 1","New-onset adult = ESI 2","Febrile child = ESI 2–3"],workup:"Glucose · BMP · Tox screen · CT head if new-onset adult · EEG if persistent"},
  {cc:"Abdominal Pain",       esi:3,flag:"⚠️",color:"#fb923c",flags:["Hypotension + abd pain = ESI 1 (AAA?)","Rigid abdomen = ESI 2","β-hCG positive → ectopic = ESI 1–2","Peritoneal signs = ESI 2"],workup:"β-hCG females · BMP, CBC, lipase · UA · CT abd/pelvis per presentation"},
  {cc:"Trauma / MVC",         esi:1,flag:"🚨",color:"#f87171",flags:["Activate trauma team per protocol","Any unstable vitals = ESI 1","High-energy mechanism = ESI 1–2","LOC or AMS = ESI 1–2"],workup:"Primary survey ABCDE · FAST · CXR, pelvis XR · CT per mechanism · MTP prn"},
  {cc:"Fever (Adult)",        esi:3,flag:"📋",color:"#60a5fa",flags:["Immunocompromised = ESI 2","T > 104°F = ESI 2","Signs of sepsis = ESI 2 (lactate!)","Elderly + altered = ESI 2"],workup:"CBC · CMP · UA/culture · Blood cultures ×2 · CXR if resp sx · Lactate if sepsis"},
  {cc:"Headache",             esi:3,flag:"⚠️",color:"#fb923c",flags:["Thunderclap = ESI 1–2","Worst headache of life = ESI 2","Fever + stiff neck = ESI 2","Focal neuro signs = ESI 2"],workup:"BP check · Neuro exam · CT head if SAH concern · LP if CT neg + high suspicion"},
  {cc:"Back Pain",            esi:4,flag:"📋",color:"#60a5fa",flags:["Saddle anesthesia = ESI 2 (cauda equina!)","Bowel/bladder dysfunction = ESI 2","New neuro deficit = ESI 2–3","AAA concern = ESI 1"],workup:"Neuro exam · SLR · MRI if cauda equina concern · CT/US if vascular concern"},
  {cc:"Psychiatric",          esi:2,flag:"⚠️",color:"#fb923c",flags:["Active SI with plan/intent = ESI 2","Homicidal ideation = ESI 2","Psychosis with danger = ESI 2","Medical cause of AMS = ESI 1–2"],workup:"Safety assessment · Glucose · Tox screen · CBC/BMP medical clearance · MSE"},
  {cc:"Laceration",           esi:4,flag:"📋",color:"#60a5fa",flags:["Arterial bleeding = ESI 1–2","Neurovascular compromise = ESI 2","Tendon/bone visible = ESI 2–3","Face/cosmetic = ESI 3–4"],workup:"Wound depth/contamination · Neurovascular exam distal · XR if bone injury · Tetanus"},
];

// ── START triage ──────────────────────────────────────────────
const START_TAGS = [
  {color:"#34d399",label:"MINOR",    textColor:"#04080f",desc:"Walking wounded — can ambulate",        examples:["Minor lacerations","Sprains","Contusions","Walking wounded"]},
  {color:"#fbbf24",label:"DELAYED",  textColor:"#04080f",desc:"Serious but stable — delayed tx OK",    examples:["Stable fractures","Burns < 20% BSA","Responsive + radial pulse present"]},
  {color:"#f87171",label:"IMMEDIATE",textColor:"#fff",   desc:"Life-threatening — treat now",           examples:["RR < 10 or > 30","No radial pulse","Cannot follow commands","Airway compromise"]},
  {color:"#333",   label:"EXPECTANT",textColor:"#888",   desc:"Unsurvivable — comfort care only",       examples:["Apneic after airway opened","Burns > 60% BSA + trauma","Devastating head injury"]},
];
const START_STEPS = [
  {step:1,label:"Can the patient walk?",type:"yn",yes:{color:"#34d399",tag:"MINOR (GREEN)",action:"Tag GREEN — redirect to minor injury area. Monitor but not immediate priority."},no:{color:null,tag:null,action:"Proceed to Step 2 — assess breathing."}},
  {step:2,label:"Is the patient breathing?",type:"yn",yes:{color:null,tag:null,action:"Proceed to Step 3 — assess respiratory rate."},no:{color:"#f87171",tag:null,action:"Open airway (head-tilt/chin-lift or jaw thrust). Breathing resumes → IMMEDIATE. Still none → EXPECTANT."}},
  {step:3,label:"Respiratory Rate?",type:"multi",options:[{label:"< 10 or > 30 bpm",color:"#f87171",tag:"IMMEDIATE (RED)",action:"Tag RED — immediate life threat"},{label:"10–30 bpm",color:null,tag:null,action:"Proceed to Step 4 — assess perfusion"}]},
  {step:4,label:"Radial Pulse / Capillary Refill?",type:"multi",options:[{label:"No radial pulse OR CRT > 2 sec",color:"#f87171",tag:"IMMEDIATE (RED)",action:"Tag RED + control hemorrhage if visible"},{label:"Radial pulse present AND CRT ≤ 2 sec",color:null,tag:null,action:"Proceed to Step 5 — mental status"}]},
  {step:5,label:"Can the patient follow simple commands?",type:"yn",yes:{color:"#fbbf24",tag:"DELAYED (YELLOW)",action:"Tag YELLOW — delayed treatment, hemodynamically stable"},no:{color:"#f87171",tag:"IMMEDIATE (RED)",action:"Tag RED — unresponsive or cannot follow commands"}},
];

// ── SALT triage ───────────────────────────────────────────────
const SALT_STEPS = [
  {title:"S — Sort",icon:"📋",color:"#2dd4bf",desc:"Global sorting simultaneously. Identify: (1) walking wounded, (2) waving/purposeful movement, (3) still/obvious life threat. Move walking wounded to separate minor area first."},
  {title:"A — Assess",icon:"🔍",color:"#60a5fa",desc:"Individual assessment in priority order: (1) Still/obvious life threat → (2) Waving/purposeful movement → (3) Walking wounded. Brief, systematic, under 60 seconds per patient."},
  {title:"L — Lifesaving Interventions",icon:"🩺",color:"#f87171",desc:"Perform ONLY immediate lifesaving interventions before tagging: hemorrhage control · open airway · decompress tension PTX · antidote administration · auto-injectors. Nothing else."},
  {title:"T — Treatment/Transport",icon:"🚑",color:"#fb923c",desc:"Tag and initiate treatment or transport. Assign to appropriate treatment area. Reassess as resources become available. Document triage tag number and time of assessment."},
];
const SALT_TAGS = [
  {color:"#34d399",label:"MINIMAL",  textColor:"#04080f",desc:"Minor injuries — able to self-care. Low-priority queue."},
  {color:"#fbbf24",label:"DELAYED",  textColor:"#04080f",desc:"Serious but not immediately life-threatening. Can wait."},
  {color:"#f87171",label:"IMMEDIATE",textColor:"#fff",   desc:"Life-threatening but salvageable. Priority 1 treatment."},
  {color:"#555",   label:"EXPECTANT",textColor:"#aaa",   desc:"Unlikely to survive given available resources. Comfort care."},
  {color:"#222",   label:"DEAD",     textColor:"#666",   desc:"No respirations after airway repositioning."},
];

// ── Fast track data ───────────────────────────────────────────
const FAST_TRACK_CATS = [
  {icon:"🩹",cat:"Wound Care",    items:["Simple lacerations (≤5 cm, non-complex)","Wound check / suture removal","Superficial abscess I&D (afebrile, <2 cm)","Minor burn <10% BSA (2nd degree, non-face/hand)"]},
  {icon:"🦴",cat:"Musculoskeletal",items:["Ankle/foot sprain (Ottawa Rules negative)","Minor extremity injury, intact neurovascular exam","Low back pain (no red flags, afebrile)","Recurrent shoulder dislocation (prior successful reduction)"]},
  {icon:"🤧",cat:"Minor Illness", items:["URI / sore throat / ear pain (afebrile)","Uncomplicated UTI (afebrile, hemodynamically stable)","Conjunctivitis / external stye","Contact dermatitis / minor skin rash"]},
  {icon:"💊",cat:"Medication",    items:["IV infusion for stable chronic condition","Supratherapeutic INR without active bleeding","Prescription refill — stable chronic conditions"]},
  {icon:"🔬",cat:"Diagnostic",    items:["Lab draw / result follow-up","X-ray read (stable, ordered by PCP)","Straightforward follow-up after prior ED visit"]},
];
const FT_EXCLUSIONS = [
  "Any vital sign abnormality: HR >100, SBP <90 or >180, RR >20, SpO2 <95%, Temp >38.3°C",
  "Altered mental status, confusion, or lethargy at any point",
  "Active chest pain, palpitations, or dyspnea on presentation",
  "Signs of systemic infection — sepsis screen positive",
  "Pregnancy (unless routine OB care per institutional protocol)",
  "Active bleeding or anticoagulation-related complication",
  "ESI 1 or 2 assigned at initial triage assessment",
];

// ── Pediatric vitals & stat banner ────────────────────────────
const PEDS_VITALS = [
  {age:"Neonate (0–1 mo)",   hr:"100–160",rr:"40–60",sbp:"60–90",  wt:"3–4"},
  {age:"Infant (1–12 mo)",   hr:"100–150",rr:"30–50",sbp:"80–100", wt:"4–10"},
  {age:"Toddler (1–3 yr)",   hr:"90–140", rr:"24–40",sbp:"90–105", wt:"10–14"},
  {age:"Preschool (3–6 yr)", hr:"80–120", rr:"22–34",sbp:"95–110", wt:"14–20"},
  {age:"School (6–12 yr)",   hr:"75–110", rr:"18–26",sbp:"100–120",wt:"20–40"},
  {age:"Adolescent (12–18)", hr:"60–100", rr:"12–20",sbp:"110–130",wt:"40–70"},
];
const STAT_ITEMS = [
  {label:"ESI 1",    value:"Immediate",sub:"Physician at bedside NOW",  color:"#f87171"},
  {label:"ESI 2",    value:"< 15 min", sub:"Physician within 15 min",   color:"#fb923c"},
  {label:"Door→ECG", value:"≤ 10 min", sub:"Chest pain protocol",       color:"#fbbf24"},
  {label:"Door→ABX", value:"< 60 min", sub:"Sepsis bundle hour-1",      color:"#2dd4bf"},
  {label:"CT→Needle",value:"< 25 min", sub:"Stroke tPA target",         color:"#60a5fa"},
];

// ── Navigation tabs ───────────────────────────────────────────
const NAV_TABS = [
  {id:"reference",icon:"📋",label:"Chief Complaints",accent:"#fb923c"},
  {id:"esi",      icon:"🚦",label:"ESI System",      accent:"#f87171"},
  {id:"mci",      icon:"🚨",label:"MCI Triage",      accent:"#f87171"},
  {id:"vitals",   icon:"📊",label:"Danger Vitals",   accent:"#60a5fa"},
  {id:"fasttrack",icon:"⚡",label:"Fast Track",      accent:"#34d399"},
  {id:"ccsort",   icon:"🔍",label:"CC Quick Sort",   accent:"#2dd4bf"},
  {id:"ai",       icon:"🤖",label:"AI Assistant",    accent:"#a78bfa"},
];

const Gx = {
  panel:(a)=>({background:a?`linear-gradient(135deg,${a}0a,rgba(255,255,255,0.05))`:T.glass,backdropFilter:"blur(32px) saturate(160%)",WebkitBackdropFilter:"blur(32px) saturate(160%)",border:`1px solid ${a?a+"28":T.border}`,borderRadius:18,boxShadow:`0 8px 32px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.12)${a?`,0 0 30px ${a}12`:""}`,position:"relative",overflow:"hidden"}),
  row:(a)=>({background:a?`${a}08`:T.glassD,border:`1px solid ${a?a+"25":T.border}`,borderRadius:11,boxShadow:T.shine}),
  inp:()=>({background:"rgba(255,255,255,0.05)",border:`1px solid ${T.border}`,borderRadius:12,boxShadow:T.shine,color:T.txt,fontFamily:"'DM Sans',sans-serif",fontSize:13,outline:"none",transition:"border-color .2s,box-shadow .2s"}),
  btn:(a,f)=>({background:f?`linear-gradient(135deg,${a}cc,${a}88)`:"rgba(255,255,255,0.06)",border:`1px solid ${f?a+"60":T.borderHi}`,borderRadius:10,boxShadow:f?`0 4px 18px ${a}30,inset 0 1px 0 rgba(255,255,255,0.25)`:T.shine,color:f?"#fff":T.txt2,fontFamily:"'DM Sans',sans-serif",fontWeight:600,cursor:"pointer",transition:"all .2s"}),
};

// ════════════════════════════════════════════════════════════
//  MODULE-SCOPE PRIMITIVES
// ════════════════════════════════════════════════════════════
function AmbientBg() {
  return (
    <div style={{position:"fixed",inset:0,overflow:"hidden",pointerEvents:"none",zIndex:0}}>
      <div style={{position:"absolute",top:"-8%",left:"10%",width:700,height:700,borderRadius:"50%",background:`radial-gradient(circle,${AC}14 0%,transparent 65%)`,animation:"orb0 13s ease-in-out infinite"}}/>
      <div style={{position:"absolute",top:"30%",right:"-5%",width:600,height:600,borderRadius:"50%",background:`radial-gradient(circle,${AC}0d 0%,transparent 65%)`,animation:"orb1 16s ease-in-out infinite"}}/>
      <div style={{position:"absolute",bottom:"-5%",left:"20%",width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(96,165,250,0.09) 0%,transparent 65%)",animation:"orb2 12s ease-in-out infinite"}}/>
      <style>{`
        @keyframes orb0{0%,100%{transform:scale(1) translate(0,0)}50%{transform:scale(1.14) translate(2%,3%)}}
        @keyframes orb1{0%,100%{transform:scale(1.08) translate(0,0)}50%{transform:scale(0.9) translate(-3%,2%)}}
        @keyframes orb2{0%,100%{transform:scale(0.95) translate(0,0)}50%{transform:scale(1.1) translate(2%,-2%)}}
        @keyframes hubIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideIn{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}
        @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes pulseDot{0%,100%{opacity:1}50%{opacity:.4}}
        *{box-sizing:border-box} input::placeholder,textarea::placeholder{color:rgba(255,255,255,0.2)}
        button{outline:none} ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:4px}
      `}</style>
    </div>
  );
}

function GPanel({ children, style={}, accent=null }) {
  return (
    <div style={{...Gx.panel(accent),...style}}>
      <div style={{position:"absolute",top:0,left:"8%",right:"8%",height:1,background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.16),transparent)",pointerEvents:"none"}}/>
      {children}
    </div>
  );
}

function Chip({ label, color }) {
  const c = color||AC;
  return <span style={{fontSize:9,fontFamily:"'JetBrains Mono',monospace",fontWeight:700,padding:"2px 8px",borderRadius:20,background:`${c}18`,border:`1px solid ${c}35`,color:c,whiteSpace:"nowrap"}}>{label}</span>;
}

function EvidenceBadge({ level }) {
  const map = {"Level A":{bg:"rgba(45,212,191,0.12)",br:"rgba(45,212,191,0.4)",c:"#2dd4bf"},"Level B":{bg:"rgba(96,165,250,0.12)",br:"rgba(96,165,250,0.4)",c:"#60a5fa"}};
  const s = map[level]||{bg:`${AC}18`,br:`${AC}40`,c:AC};
  return <span style={{fontSize:9,fontFamily:"'JetBrains Mono',monospace",fontWeight:700,padding:"2px 7px",borderRadius:20,background:s.bg,border:`1px solid ${s.br}`,color:s.c,whiteSpace:"nowrap"}}>{level}</span>;
}

function SecHdr({ icon, title, sub, badge, accent }) {
  const c = accent||AC;
  return (
    <div style={{marginBottom:18,paddingBottom:14,borderBottom:`1px solid ${T.border}`}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:sub?5:0}}>
        <div style={{width:34,height:34,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,background:`${c}16`,border:`1px solid ${c}30`,flexShrink:0}}>{icon}</div>
        <div style={{flex:1,fontSize:16,fontWeight:700,color:T.txt,fontFamily:"'Playfair Display',serif"}}>{title}</div>
        {badge&&<Chip label={badge} color={c}/>}
      </div>
      {sub&&<p style={{fontSize:11,color:T.txt3,margin:"0 0 0 44px",lineHeight:1.55}}>{sub}</p>}
    </div>
  );
}

function GInput({ value, onChange, placeholder, accent, style:s={} }) {
  return <input value={value} onChange={onChange} placeholder={placeholder}
    style={{...Gx.inp(),padding:"10px 14px",width:"100%",...s}}
    onFocus={e=>{ e.target.style.borderColor=`${accent||AC}55`; e.target.style.boxShadow=`0 0 0 3px ${accent||AC}12`; }}
    onBlur={e=>{ e.target.style.borderColor=T.border; e.target.style.boxShadow=T.shine; }}/>;
}

function GPill({ label, active, accent, onClick }) {
  const c = accent||AC;
  return <button onClick={onClick} style={{padding:"6px 15px",borderRadius:24,fontSize:12,fontWeight:active?600:400,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",transition:"all .2s",background:active?`${c}18`:"rgba(255,255,255,0.04)",border:`1px solid ${active?c+"45":"rgba(255,255,255,0.09)"}`,color:active?c:T.txt3}}>{label}</button>;
}

function ESIBadge({ level }) {
  const cfg = ESI_LEVELS.find(e=>e.level===level)||ESI_LEVELS[2];
  return <span style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:9,fontFamily:"'JetBrains Mono',monospace",fontWeight:700,padding:"2px 9px",borderRadius:20,background:cfg.bg,border:`1px solid ${cfg.color}40`,color:cfg.color,whiteSpace:"nowrap"}}>ESI {level} · {cfg.label}</span>;
}

function ESICard({ esi, expanded, onToggle }) {
  return (
    <div onClick={onToggle} style={{...Gx.panel(null),border:`2px solid ${expanded?esi.color:esi.color+"44"}`,background:expanded?`linear-gradient(135deg,${esi.color}18,rgba(8,22,40,0.9))`:"rgba(8,22,40,0.7)",cursor:"pointer",transition:"all .2s",marginBottom:8}}>
      <div style={{display:"flex",alignItems:"center",gap:14,padding:"16px 20px"}}>
        <div style={{width:52,height:52,borderRadius:12,flexShrink:0,background:esi.color,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 ${expanded?"20px":"8px"} ${esi.color}60`}}>
          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:22,fontWeight:700,color:esi.level===3||esi.level===5?"#050f1e":"#fff"}}>{esi.level}</span>
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:3}}>
            <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:700,color:esi.color}}>ESI {esi.level} — {esi.label}</span>
            <Chip label={esi.time} color={esi.color}/>
          </div>
          <div style={{fontSize:12,color:T.txt2,marginBottom:2}}>{esi.desc}</div>
          <div style={{fontSize:10,color:T.txt3,fontFamily:"'JetBrains Mono',monospace"}}>Vitals concern: {esi.vitals}</div>
        </div>
        <span style={{color:T.txt4,fontSize:13,flexShrink:0}}>{expanded?"▲":"▼"}</span>
      </div>
      {expanded&&(
        <div style={{padding:"0 20px 18px",borderTop:"1px solid rgba(42,79,122,0.3)"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,paddingTop:14}}>
            <div>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Clinical Examples</div>
              {esi.examples.map((ex,i)=>(
                <div key={i} style={{display:"flex",gap:8,marginBottom:5}}>
                  <span style={{color:esi.color,fontSize:11,minWidth:10,flexShrink:0}}>▸</span>
                  <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.txt2,lineHeight:1.5}}>{ex}</span>
                </div>
              ))}
            </div>
            <div>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Triage Criteria</div>
              <div style={{fontSize:12,color:T.txt,lineHeight:1.6,marginBottom:12}}>{esi.criteria}</div>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>Disposition</div>
              <div style={{fontSize:12,color:esi.color,fontWeight:600}}>{esi.disposition}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function VitalRow({ row }) {
  return (
    <div style={{display:"grid",gridTemplateColumns:"130px 100px 80px 1fr",gap:10,alignItems:"center",padding:"9px 12px",background:"rgba(8,22,40,0.5)",borderRadius:9,border:`1px solid ${row.level==="emergent"?row.color+"44":"rgba(42,79,122,0.2)"}`,marginBottom:5}}>
      <span style={{fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:12,color:row.level==="normal"?T.txt3:T.txt}}>{row.label}</span>
      <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,fontWeight:700,color:row.color}}>{row.range}</span>
      <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:700,color:row.color,background:`${row.color}18`,padding:"2px 7px",borderRadius:4,textTransform:"uppercase",textAlign:"center"}}>{row.level}</span>
      <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.txt3,lineHeight:1.4}}>{row.action}</span>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ════════════════════════════════════════════════════════════
export default function TriageHub() {
  const navigate = useNavigate();
  const [nav, setNav]               = useState("reference");
  const [toasts, setToasts]         = useState([]);
  const [search, setSearch]         = useState("");
  const [catFilter, setCatFilter]   = useState("All");
  const [selected, setSelected]     = useState(null);
  const [detailTab, setDetailTab]   = useState("overview");
  const [aiInput, setAiInput]       = useState("");
  const [aiResult, setAiResult]     = useState(null);
  const [aiBusy, setAiBusy]         = useState(false);
  const [esiStep, setEsiStep]       = useState(0);
  const [esiResult, setEsiResult]   = useState(null);
  const [esiAgeGroup, setEsiAgeGroup] = useState("adult");
  const [esiView, setEsiView]       = useState("calculator");
  const [esiExpanded, setEsiExpanded] = useState(null);
  const [mciView, setMciView]       = useState("start");
  const [vitalExpanded, setVitalExpanded] = useState(null);
  const [ccSearch, setCcSearch]     = useState("");

  const toast = useCallback((msg, type="info") => {
    const id = Date.now()+Math.random();
    setToasts(p=>[...p,{id,msg,type}]);
    setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)), 3400);
  }, []);

  const resetESI = () => { setEsiStep(0); setEsiResult(null); setSaveModal(false); setSaveData({patient_name:"",patient_id:"",chief_complaint:"",triage_notes:""}); };

  const [saveModal, setSaveModal] = useState(false);
  const [saveData, setSaveData] = useState({patient_name:"",patient_id:"",chief_complaint:"",triage_notes:""});
  const [saveBusy, setSaveBusy] = useState(false);

  const saveAssessment = async (esiLevel) => {
    if (!saveData.chief_complaint.trim()) { toast("Chief complaint required","error"); return; }
    setSaveBusy(true);
    try {
      const cfg = ESI_LEVELS.find(e=>e.level===esiLevel);
      await base44.entities.TriageAssessment.create({
        esi_level: esiLevel,
        esi_label: cfg?.label||"",
        chief_complaint: saveData.chief_complaint,
        patient_name: saveData.patient_name||undefined,
        patient_id: saveData.patient_id||undefined,
        triage_notes: saveData.triage_notes||undefined,
        triage_time: new Date().toISOString(),
        disposition: "pending",
      });
      toast("Triage assessment saved","success");
      setSaveModal(false);
    } catch(e) { toast("Save failed","error"); }
    finally { setSaveBusy(false); }
  };

  const filtered = useMemo(()=>
    ITEMS.filter(i=>catFilter==="All"||i.cat===catFilter).filter(i=>!search||i.title.toLowerCase().includes(search.toLowerCase())||i.subtitle.toLowerCase().includes(search.toLowerCase()))
  , [search, catFilter]);

  const filteredCC = useMemo(()=>
    CC_SORT.filter(c=>c.cc.toLowerCase().includes(ccSearch.toLowerCase()))
  , [ccSearch]);

  const runAI = async () => {
    if (!aiInput.trim()||aiBusy) return;
    setAiBusy(true); setAiResult(null);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",max_tokens:2000,
          system:`You are a board-certified emergency medicine physician and triage expert. Answer triage clinical questions concisely. Return ONLY valid JSON, no markdown, no preamble.
Format: {"summary":"Direct answer","keyPoints":["Point 1","Point 2","Point 3"],"management":["Action 1","Action 2","Action 3"],"pearls":["Clinical pearl"],"caution":"Warning or null"}`,
          messages:[{role:"user",content:aiInput}]
        })
      });
      const data = await res.json();
      const raw = (data.content?.[0]?.text||"{}").replace(/```json|```/g,"").trim();
      setAiResult(JSON.parse(raw));
      toast("AI response ready","success");
    } catch(e){ toast("AI query failed","error"); }
    finally { setAiBusy(false); }
  };

  // ── ESI SYSTEM (Calculator + Reference sub-views) ────────
  const renderESI = () => {
    const subPills = (
      <div style={{display:"flex",gap:6,marginBottom:16}}>
        <GPill label="🧮 Calculator"    active={esiView==="calculator"} accent="#f87171" onClick={()=>setEsiView("calculator")}/>
        <GPill label="📖 ESI Reference" active={esiView==="reference"}  accent="#f87171" onClick={()=>setEsiView("reference")}/>
      </div>
    );
    if (esiView==="reference") return (
      <div style={{animation:"hubIn .35s ease"}}>
        {subPills}
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.teal,textTransform:"uppercase",letterSpacing:2,marginBottom:14}}>Emergency Severity Index (ESI v4) — Click to expand</div>
        {ESI_LEVELS.map(esi=><ESICard key={esi.level} esi={esi} expanded={esiExpanded===esi.level} onToggle={()=>setEsiExpanded(p=>p===esi.level?null:esi.level)}/>)}
        <GPanel style={{padding:"12px 16px",marginTop:10}}>
          <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.txt2,lineHeight:1.7,margin:0}}>📚 <strong style={{color:T.teal}}>ESI v4 (AHRQ 2012):</strong> Validated 5-level triage system with prediction accuracy for resource use and admission. For pediatrics, apply Pediatric Assessment Triangle (PAT) — Appearance, Work of Breathing, Circulation to skin — before ESI assignment.</p>
        </GPanel>
      </div>
    );
    // Calculator
    if (esiResult !== null) {
      const cfg = ESI_LEVELS.find(e=>e.level===esiResult);
      const actions = {
        1:["Assign to resuscitation bay IMMEDIATELY","Physician at bedside on patient arrival","Activate appropriate alert (trauma/STEMI/stroke/sepsis)","Two large-bore IVs, monitoring, airway + crash cart ready"],
        2:["Assign to acute care bed within 15 minutes","Reassess q15 min while awaiting room","Consider early standing orders / nursing protocols","Alert charge RN if no room available within 15 min"],
        3:["Assign to acute care or monitored waiting area","Reassess q30–60 min; sooner if deterioration","Place standing orders per protocol if room unavailable","Re-check vitals — upgrade to ESI 2 if danger zone met"],
        4:["Fast track eligible — reassess q60–90 min","Urine dip / X-ray may be initiated from triage per protocol","Discharge-focused workup; avoid over-testing","Provider-in-triage model can significantly reduce LOS"],
        5:["Fast track eligible — exam only, reassess q90–120 min","No labs or imaging anticipated — document rationale","Consider provider-in-triage or virtual triage","Redirect to PCP or urgent care if appropriate"],
      };
      return (
        <div style={{display:"flex",flexDirection:"column",gap:12,animation:"hubIn .4s ease"}}>
          {subPills}
          <GPanel style={{padding:"32px",textAlign:"center"}} accent={cfg.color}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,transparent,${cfg.color}80,transparent)`,borderRadius:"18px 18px 0 0"}}/>
            <div style={{fontSize:56,marginBottom:8}}>{cfg.icon}</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:40,fontWeight:700,color:cfg.color,marginBottom:4}}>ESI Level {esiResult}</div>
            <div style={{fontSize:17,color:T.txt,marginBottom:3,fontWeight:600}}>{cfg.label}</div>
            <div style={{fontSize:12,color:T.txt2,marginBottom:16}}>{cfg.desc}</div>
            <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"8px 20px",borderRadius:24,background:`${cfg.color}20`,border:`1px solid ${cfg.color}40`,fontSize:13,color:cfg.color,fontFamily:"'JetBrains Mono',monospace",fontWeight:700,marginBottom:24}}>
              ⏱ Target Door-to-Provider: {cfg.time}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:20,textAlign:"left"}}>
              {(actions[esiResult]||[]).map((a,i)=>(
                <div key={i} style={{...Gx.row(cfg.color),padding:"10px 13px",fontSize:12,color:T.txt2,display:"flex",gap:8}}>
                  <span style={{color:cfg.color,flexShrink:0}}>▸</span><span>{a}</span>
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:10,justifyContent:"center"}}>
              <button onClick={()=>setSaveModal(true)} style={{...Gx.btn(T.teal,true),padding:"10px 24px",fontSize:13}}>💾 Save Assessment</button>
              <button onClick={resetESI} style={{...Gx.btn(cfg.color,true),padding:"10px 30px",fontSize:14}}>🔄 New Patient</button>
            </div>
          </GPanel>
          {saveModal&&(
            <GPanel style={{padding:"22px 24px",animation:"hubIn .3s ease"}} accent={T.teal}>
              <SecHdr icon="💾" title="Save Triage Assessment" badge="SAVE" accent={T.teal}/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                <GInput value={saveData.patient_name} onChange={e=>setSaveData(p=>({...p,patient_name:e.target.value}))} accent={T.teal} placeholder="Patient name (optional)"/>
                <GInput value={saveData.patient_id} onChange={e=>setSaveData(p=>({...p,patient_id:e.target.value}))} accent={T.teal} placeholder="MRN / Patient ID (optional)"/>
              </div>
              <GInput value={saveData.chief_complaint} onChange={e=>setSaveData(p=>({...p,chief_complaint:e.target.value}))} accent={T.teal} placeholder="Chief complaint *" style={{marginBottom:10}}/>
              <textarea value={saveData.triage_notes} onChange={e=>setSaveData(p=>({...p,triage_notes:e.target.value}))} rows={3}
                placeholder="Additional triage notes (optional)"
                style={{...Gx.inp(),width:"100%",padding:"10px 14px",lineHeight:1.6,resize:"vertical",marginBottom:12}}/>
              <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                <button onClick={()=>setSaveModal(false)} style={{...Gx.btn(T.txt3,false),padding:"8px 18px",fontSize:12}}>Cancel</button>
                <button onClick={()=>saveAssessment(esiResult)} disabled={saveBusy||!saveData.chief_complaint.trim()} style={{...Gx.btn(T.teal,true),padding:"8px 22px",fontSize:13,opacity:saveBusy||!saveData.chief_complaint.trim()?0.5:1}}>
                  {saveBusy?"Saving…":"Save Assessment"}
                </button>
              </div>
            </GPanel>
          )}
        </div>
      );
    }
    if (esiStep===3) {
      const dz = {adult:{hr:">100",rr:">20",spo2:"<92%"},peds_infant:{hr:">160",rr:">60",spo2:"<92%"},peds_toddler:{hr:">140",rr:">40",spo2:"<92%"},peds_school:{hr:">120",rr:">30",spo2:"<92%"},peds_teen:{hr:">100",rr:">20",spo2:"<92%"}};
      const d = dz[esiAgeGroup]||dz.adult;
      return (
        <div style={{display:"flex",flexDirection:"column",gap:12,animation:"hubIn .35s ease"}}>
          {subPills}
          <div style={{display:"flex",gap:6}}>{[0,1,2,3].map(i=><div key={i} style={{flex:1,height:3,borderRadius:3,background:esiStep>i?"#fbbf24":esiStep===i?"rgba(251,191,36,0.5)":"rgba(255,255,255,0.1)"}}/>)}</div>
          <GPanel style={{padding:"22px 24px"}} accent={T.gold}>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.txt4,marginBottom:12}}>STEP 3 OF 3 — VITAL SIGN DANGER ZONE</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:T.txt,marginBottom:10}}>Upgrade to ESI 2 if any of the following are present:</div>
            <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
              {[["adult","Adult"],["peds_infant","Infant <1yr"],["peds_toddler","Toddler 1–3"],["peds_school","School 4–12"],["peds_teen","Teen 13–18"]].map(([v,l])=>(
                <GPill key={v} label={l} active={esiAgeGroup===v} accent={T.gold} onClick={()=>setEsiAgeGroup(v)}/>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:14}}>
              {[["❤️","Heart Rate",d.hr],["🫁","Resp Rate",d.rr],["🔵","O2 Sat",d.spo2]].map(([ico,lbl,val])=>(
                <div key={lbl} style={{...Gx.row(T.coral),padding:"14px",textAlign:"center"}}>
                  <div style={{fontSize:20,marginBottom:4}}>{ico}</div>
                  <div style={{fontSize:11,color:T.txt3,marginBottom:4}}>{lbl}</div>
                  <div style={{fontSize:16,fontFamily:"'JetBrains Mono',monospace",fontWeight:700,color:T.coral}}>{val}</div>
                </div>
              ))}
            </div>
          </GPanel>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <button onClick={()=>setEsiResult(2)} style={{...Gx.btn(T.coral,true),padding:"14px",fontSize:13,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
              <span>🚨 Danger Zone Vitals</span><span style={{fontSize:10,opacity:.8}}>→ Upgrade to ESI 2</span>
            </button>
            <button onClick={()=>setEsiResult(3)} style={{...Gx.btn(T.gold,true),padding:"14px",fontSize:13,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
              <span>✅ Vitals Normal</span><span style={{fontSize:10,opacity:.8}}>→ Assign ESI 3</span>
            </button>
          </div>
          <button onClick={()=>setEsiStep(2)} style={{...Gx.btn(T.txt3,false),padding:"8px",fontSize:12,color:T.txt3}}>← Previous</button>
        </div>
      );
    }
    if (esiStep===2) {
      const opts = [
        {label:"0 Resources",  sub:"Exam only — no labs, imaging, IVs, or procedures", action:()=>setEsiResult(5), note:"→ ESI 5"},
        {label:"1 Resource",   sub:"One of: labs, OR imaging, OR IV medication/fluids",  action:()=>setEsiResult(4), note:"→ ESI 4"},
        {label:"2+ Resources", sub:"Multiple categories needed (e.g. labs AND CT AND IV meds)", action:()=>setEsiStep(3), note:"→ Check vitals"},
      ];
      return (
        <div style={{display:"flex",flexDirection:"column",gap:12,animation:"hubIn .35s ease"}}>
          {subPills}
          <div style={{display:"flex",gap:6}}>{[0,1,2,3].map(i=><div key={i} style={{flex:1,height:3,borderRadius:3,background:esiStep>i?AC:esiStep===i?`${AC}60`:"rgba(255,255,255,0.1)"}}/>)}</div>
          <GPanel style={{padding:"26px 28px"}} accent={AC}>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.txt4,marginBottom:12}}>STEP 3 OF 3</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700,color:T.txt,marginBottom:8}}>How many resource types will this patient likely need?</div>
            <div style={{...Gx.row(null),padding:"10px 14px",marginBottom:18,fontSize:11,color:T.txt3}}>Resources = labs · imaging (X-ray/CT/US) · IV medications · IV fluids · specialty consult · complex procedure</div>
            {opts.map((opt,i)=>(
              <button key={i} onClick={opt.action}
                style={{...Gx.row(null),display:"flex",justifyContent:"space-between",alignItems:"center",padding:"15px 18px",marginBottom:8,cursor:"pointer",width:"100%",textAlign:"left",border:`1px solid ${T.border}`,transition:"all .2s"}}
                onMouseEnter={e=>{e.currentTarget.style.background=`${AC}10`;e.currentTarget.style.borderColor=`${AC}40`;e.currentTarget.style.transform="translateX(3px)";}}
                onMouseLeave={e=>{e.currentTarget.style.background=T.glassD;e.currentTarget.style.borderColor=T.border;e.currentTarget.style.transform="translateX(0)";}}>
                <div><div style={{fontSize:14,fontWeight:600,color:T.txt,marginBottom:2}}>{opt.label}</div><div style={{fontSize:11,color:T.txt3}}>{opt.sub}</div></div>
                <span style={{fontSize:11,color:AC,fontFamily:"'JetBrains Mono',monospace",fontWeight:700,flexShrink:0,marginLeft:12}}>{opt.note}</span>
              </button>
            ))}
          </GPanel>
          <button onClick={()=>setEsiStep(1)} style={{...Gx.btn(T.txt3,false),padding:"8px",fontSize:12,color:T.txt3}}>← Previous</button>
        </div>
      );
    }
    const stepDefs = [
      {stepLabel:"STEP 1 OF 3",q:"Does this patient require an IMMEDIATE life-saving intervention?",hint:"Intubation · defibrillation/cardioversion · needle thoracostomy · cricothyrotomy · massive hemorrhage control · CPR in progress",yesResult:1,noStep:1,yesLabel:"YES — Immediate intervention needed",noLabel:"NO — Continue"},
      {stepLabel:"STEP 2 OF 3",q:"Is this a HIGH-RISK situation?",hint:"Confused/lethargic/disoriented AMS · Severe pain/distress (NRS ≥ 7) · High-risk presentation (STEMI, stroke symptoms, sepsis, ectopic, PE)",yesResult:2,noStep:2,yesLabel:"YES — High risk / severe symptoms",noLabel:"NO — Stable presentation"},
    ];
    const sd = stepDefs[esiStep];
    return (
      <div style={{display:"flex",flexDirection:"column",gap:12,animation:"hubIn .35s ease"}}>
        {subPills}
        <div style={{display:"flex",gap:6}}>{[0,1,2,3].map(i=><div key={i} style={{flex:1,height:3,borderRadius:3,background:esiStep>i?AC:esiStep===i?`${AC}60`:"rgba(255,255,255,0.1)"}}/>)}</div>
        <GPanel style={{padding:"28px"}} accent={AC}>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.txt4,marginBottom:14}}>{sd.stepLabel}</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:T.txt,marginBottom:10,lineHeight:1.35}}>{sd.q}</div>
          <div style={{...Gx.row(null),padding:"12px 15px",marginBottom:22,fontSize:11,color:T.txt3,lineHeight:1.7}}>{sd.hint}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <button onClick={()=>setEsiResult(sd.yesResult)} style={{...Gx.btn(T.coral,true),padding:"18px",display:"flex",flexDirection:"column",alignItems:"center",gap:5,fontSize:14}}>
              <span style={{fontSize:22}}>✓</span><span style={{fontWeight:700}}>YES</span>
              <span style={{fontSize:10,opacity:.85}}>{sd.yesLabel}</span>
              <span style={{fontSize:11,marginTop:2,padding:"3px 10px",background:"rgba(0,0,0,0.2)",borderRadius:12}}>→ ESI {sd.yesResult}</span>
            </button>
            <button onClick={()=>setEsiStep(sd.noStep)} style={{...Gx.btn(T.green,true),padding:"18px",display:"flex",flexDirection:"column",alignItems:"center",gap:5,fontSize:14}}>
              <span style={{fontSize:22}}>✗</span><span style={{fontWeight:700}}>NO</span>
              <span style={{fontSize:10,opacity:.85}}>{sd.noLabel}</span>
              <span style={{fontSize:11,marginTop:2,padding:"3px 10px",background:"rgba(0,0,0,0.2)",borderRadius:12}}>→ Next step</span>
            </button>
          </div>
        </GPanel>
        {esiStep>0&&<button onClick={()=>setEsiStep(p=>p-1)} style={{...Gx.btn(T.txt3,false),padding:"8px",fontSize:12,color:T.txt3}}>← Previous</button>}
      </div>
    );
  };

  // ── MCI TRIAGE (START + SALT sub-views) ─────────────────
  const renderMCI = () => (
    <div style={{display:"flex",flexDirection:"column",gap:14,animation:"hubIn .35s ease"}}>
      <div style={{display:"flex",gap:6,marginBottom:2}}>
        <GPill label="🔴 START Triage" active={mciView==="start"} accent="#f87171" onClick={()=>setMciView("start")}/>
        <GPill label="🌊 SALT Triage"  active={mciView==="salt"}  accent="#2dd4bf" onClick={()=>setMciView("salt")}/>
      </div>
      {mciView==="start"&&(<>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {START_TAGS.map((tag,i)=>(
            <GPanel key={i} style={{padding:"14px 16px",borderLeft:`4px solid ${tag.color}`,background:`linear-gradient(135deg,${tag.color}15,rgba(8,22,40,0.85))`}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                <div style={{width:26,height:26,borderRadius:7,background:tag.color,flexShrink:0}}/>
                <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:700,color:tag.color}}>{tag.label}</span>
              </div>
              <div style={{fontSize:12,color:T.txt2,marginBottom:7,lineHeight:1.5}}>{tag.desc}</div>
              {tag.examples.map((ex,j)=><div key={j} style={{display:"flex",gap:6,marginBottom:3}}><span style={{color:tag.color,fontSize:10}}>▸</span><span style={{fontSize:11,color:T.txt3}}>{ex}</span></div>)}
            </GPanel>
          ))}
        </div>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.txt4,textTransform:"uppercase",letterSpacing:1}}>START Algorithm — Simple Triage And Rapid Treatment</div>
        {START_STEPS.map((step,i)=>(
          <GPanel key={i} style={{padding:"14px 18px"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
              <div style={{width:28,height:28,borderRadius:"50%",background:"rgba(96,165,250,0.2)",border:"1px solid rgba(96,165,250,0.4)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,fontWeight:700,color:T.blue}}>{step.step}</span>
              </div>
              <span style={{fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:14,color:T.txt}}>{step.label}</span>
            </div>
            {step.type==="multi" ? (
              <div style={{display:"flex",flexDirection:"column",gap:7,paddingLeft:38}}>
                {step.options.map((opt,j)=>(
                  <div key={j} style={{...Gx.row(opt.color),padding:"10px 13px"}}>
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:700,color:opt.color||T.txt2,marginBottom:3}}>{opt.label}</div>
                    {opt.tag&&<div style={{fontSize:12,color:opt.color,fontWeight:600,marginBottom:3}}>→ TAG: {opt.tag}</div>}
                    <div style={{fontSize:12,color:T.txt3}}>{opt.action}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,paddingLeft:38}}>
                {[{lbl:"YES",data:step.yes},{lbl:"NO",data:step.no}].map(({lbl,data})=>(
                  <div key={lbl} style={{...Gx.row(data.color),padding:"10px 13px"}}>
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:700,color:data.color||T.teal,marginBottom:3}}>{lbl}</div>
                    {data.tag&&<div style={{fontSize:12,color:data.color,fontWeight:600,marginBottom:3}}>→ TAG: {data.tag}</div>}
                    <div style={{fontSize:12,color:T.txt3,lineHeight:1.5}}>{data.action}</div>
                  </div>
                ))}
              </div>
            )}
          </GPanel>
        ))}
      </>)}
      {mciView==="salt"&&(<>
        {SALT_STEPS.map((step,i)=>(
          <GPanel key={i} style={{padding:"16px 20px",borderLeft:`4px solid ${step.color}`,background:`linear-gradient(135deg,${step.color}12,rgba(8,22,40,0.85))`}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
              <span style={{fontSize:22}}>{step.icon}</span>
              <span style={{fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:700,color:step.color}}>{step.title}</span>
            </div>
            <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:T.txt2,lineHeight:1.7,margin:0}}>{step.desc}</p>
          </GPanel>
        ))}
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.txt4,textTransform:"uppercase",letterSpacing:1}}>SALT Tag Categories</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:8}}>
          {SALT_TAGS.map((tag,i)=>(
            <GPanel key={i} style={{padding:"14px 16px",borderTop:`4px solid ${tag.color}`}}>
              <div style={{width:"100%",height:6,borderRadius:3,background:tag.color,marginBottom:8}}/>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:700,color:tag.color,marginBottom:5}}>{tag.label}</div>
              <div style={{fontSize:12,color:T.txt2,lineHeight:1.5}}>{tag.desc}</div>
            </GPanel>
          ))}
        </div>
        <GPanel style={{padding:"12px 16px"}}>
          <p style={{fontSize:12,color:T.txt2,lineHeight:1.7,margin:0}}>🌊 <strong style={{color:T.teal}}>SALT vs START:</strong> SALT (CHEMM/DHHS) is the US national standard for MCI triage. Key difference: SALT includes a global sorting step first and specifies 5 categories (including Dead) vs START's 4. SALT explicitly outlines lifesaving interventions before tagging.</p>
        </GPanel>
      </>)}
    </div>
  );

  // ── DANGER VITALS (action-trigger tables + peds) ─────────
  const renderVitals = () => (
    <div style={{display:"flex",flexDirection:"column",gap:12,animation:"hubIn .35s ease"}}>
      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.teal,textTransform:"uppercase",letterSpacing:2,marginBottom:2}}>Danger Vital Sign Thresholds — Action Triggers</div>
      {VITAL_THRESHOLDS.map((vg,i)=>(
        <GPanel key={i} style={{padding:"16px 18px"}}>
          <div onClick={()=>setVitalExpanded(p=>p===i?null:i)} style={{display:"flex",alignItems:"center",gap:10,marginBottom:vitalExpanded===i?12:0,cursor:"pointer"}}>
            <span style={{fontSize:20}}>{vg.icon}</span>
            <span style={{fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:15,color:T.txt,flex:1}}>{vg.vital}</span>
            <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.txt4}}>{vg.unit}</span>
            <div style={{display:"flex",gap:5,flexWrap:"wrap",marginRight:8}}>
              {vg.rows.filter(r=>r.level==="emergent").map((r,j)=>(
                <span key={j} style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,background:"rgba(248,113,113,0.15)",border:"1px solid rgba(248,113,113,0.35)",color:"#f87171",padding:"2px 8px",borderRadius:4}}>{r.range} = EMERGENT</span>
              ))}
            </div>
            <span style={{color:T.txt4,fontSize:13}}>{vitalExpanded===i?"▲":"▼"}</span>
          </div>
          {vitalExpanded===i&&(
            <div style={{animation:"hubIn .25s ease"}}>
              <div style={{display:"grid",gridTemplateColumns:"130px 100px 80px 1fr",gap:10,padding:"6px 12px",marginBottom:4}}>
                {["Category","Range","Level","Action"].map((h,hi)=>(
                  <span key={hi} style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:1}}>{h}</span>
                ))}
              </div>
              {vg.rows.map((row,j)=><VitalRow key={j} row={row}/>)}
            </div>
          )}
        </GPanel>
      ))}
      <GPanel style={{padding:"18px 22px"}} accent={T.gold}>
        <SecHdr icon="👶" title="Pediatric Vital Signs" badge="PEDS REFERENCE" accent={T.gold} sub="Normal ranges — values outside may indicate ESI upgrade"/>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"separate",borderSpacing:"0 4px",fontSize:11}}>
            <thead><tr>{["Age Group","HR (bpm)","RR (br/min)","SBP (mmHg)","Weight (kg)"].map(h=>(
              <th key={h} style={{textAlign:"left",padding:"7px 12px",color:T.txt3,fontFamily:"'JetBrains Mono',monospace",fontSize:9,textTransform:"uppercase",letterSpacing:".07em"}}>{h}</th>
            ))}</tr></thead>
            <tbody>{PEDS_VITALS.map((row,i)=>(
              <tr key={i} onMouseEnter={e=>e.currentTarget.style.background=`${T.gold}08`} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                {[row.age,row.hr,row.rr,row.sbp,row.wt].map((cell,j)=>(
                  <td key={j} style={{padding:"9px 12px",color:j===0?T.txt:T.txt2,borderBottom:`1px solid ${T.border}`,fontFamily:j>0?"'JetBrains Mono',monospace":"'DM Sans',sans-serif",fontSize:j===0?12:11}}>{cell}</td>
                ))}
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div style={{marginTop:12,...Gx.row(T.coral),padding:"9px 13px",borderLeft:`2px solid ${T.coral}60`}}>
          <span style={{fontSize:10,fontWeight:700,color:T.coral,marginRight:6}}>⚠ Broselow Tape:</span>
          <span style={{fontSize:11,color:T.txt2}}>Use length-based weight estimation for all pediatric drug dosing. Weight in kg required — never estimate without measurement.</span>
        </div>
      </GPanel>
    </div>
  );

  // ── FAST TRACK ──────────────────────────────────────────
  const renderFastTrack = () => (
    <div style={{display:"flex",flexDirection:"column",gap:14,animation:"hubIn .35s ease"}}>
      <GPanel style={{padding:"22px 24px"}} accent={T.green}>
        <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${T.green}70,transparent)`,borderRadius:"18px 18px 0 0"}}/>
        <SecHdr icon="⚡" title="Fast Track Eligible Chief Complaints" badge="ESI 4–5" accent={T.green} sub="All eligibility criteria must be met AND all exclusion criteria absent"/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(255px,1fr))",gap:10}}>
          {FAST_TRACK_CATS.map((cat,i)=>(
            <div key={i} style={{...Gx.row(T.green),padding:"14px 16px"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                <span style={{fontSize:20}}>{cat.icon}</span>
                <span style={{fontSize:12,fontWeight:700,color:T.green}}>{cat.cat}</span>
              </div>
              {cat.items.map((item,j)=>(
                <div key={j} style={{display:"flex",gap:7,alignItems:"flex-start",marginBottom:5}}>
                  <span style={{color:T.green,fontSize:10,marginTop:1,flexShrink:0}}>✓</span>
                  <span style={{fontSize:11,color:T.txt2,lineHeight:1.4}}>{item}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </GPanel>
      <GPanel style={{padding:"22px 24px"}} accent={T.coral}>
        <SecHdr icon="🚫" title="Fast Track Exclusion Criteria" badge="DISQUALIFIERS" accent={T.coral} sub="ANY of the following immediately disqualifies from fast track"/>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {FT_EXCLUSIONS.map((excl,i)=>(
            <div key={i} style={{...Gx.row(T.coral),display:"flex",gap:10,alignItems:"center",padding:"11px 14px"}}>
              <div style={{width:24,height:24,borderRadius:6,background:`${T.coral}18`,border:`1px solid ${T.coral}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,flexShrink:0}}>⛔</div>
              <span style={{fontSize:12,color:T.txt2,lineHeight:1.4}}>{excl}</span>
            </div>
          ))}
        </div>
      </GPanel>
      <GPanel style={{padding:"22px 24px"}} accent={T.teal}>
        <SecHdr icon="📈" title="Disposition Time Targets" badge="BENCHMARKS" accent={T.teal} sub="ACEP + ENA recommended door-to-provider targets by ESI level"/>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {ESI_LEVELS.map(e=>(
            <div key={e.level} style={{...Gx.row(e.color),display:"flex",alignItems:"center",gap:14,padding:"12px 16px"}}>
              <div style={{width:38,height:38,borderRadius:9,background:e.bg,border:`1px solid ${e.color}40`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{e.icon}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:700,color:e.color}}>ESI {e.level} — {e.label}</div>
                <div style={{fontSize:11,color:T.txt3,marginTop:1}}>{e.desc}</div>
              </div>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,fontWeight:700,color:e.color,background:e.bg,padding:"5px 13px",borderRadius:20,border:`1px solid ${e.color}40`,flexShrink:0}}>{e.time}</div>
            </div>
          ))}
        </div>
      </GPanel>
    </div>
  );

  // ── CHIEF COMPLAINT PROTOCOLS ────────────────────────────
  const renderReference = () => {
    if (selected) {
      const item = ITEMS.find(i=>i.id===selected);
      const data = ITEM_DATA[selected]||{};
      const accent = item?.accent||AC;
      const DTABS = [{id:"overview",label:"Overview",icon:"📋"},{id:"workup",label:"Workup",icon:"✅"},{id:"treatment",label:"Treatment",icon:"💊"},{id:"followup",label:"Follow-up",icon:"📅"}];
      return (
        <div style={{display:"flex",flexDirection:"column",gap:14,animation:"hubIn .35s ease"}}>
          <GPanel style={{padding:"20px 24px"}} accent={accent}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:2,borderRadius:"18px 18px 0 0",background:`linear-gradient(90deg,transparent,${accent}70,transparent)`}}/>
            <div style={{display:"flex",alignItems:"center",gap:14}}>
              <button onClick={()=>{setSelected(null);setDetailTab("overview");}} style={{...Gx.btn(T.txt3,false),padding:"6px 14px",fontSize:12,flexShrink:0}}>← Back</button>
              <div style={{width:46,height:46,borderRadius:12,background:`${accent}20`,border:`1px solid ${accent}35`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{item.icon}</div>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:2}}>
                  <span style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700,color:T.txt}}>{item.title}</span>
                  <Chip label={item.badge} color={accent}/>
                  {(item.esi||[]).map(l=><ESIBadge key={l} level={l}/>)}
                </div>
                <div style={{fontSize:12,color:T.txt3}}>{item.subtitle}</div>
              </div>
            </div>
          </GPanel>
          <div style={{display:"flex",gap:4,background:T.glass,backdropFilter:"blur(20px)",border:`1px solid ${T.border}`,borderRadius:14,padding:4}}>
            {DTABS.map(dt=>(
              <button key={dt.id} onClick={()=>setDetailTab(dt.id)} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 16px",borderRadius:10,background:detailTab===dt.id?`${accent}20`:"transparent",border:`1px solid ${detailTab===dt.id?accent+"40":"transparent"}`,color:detailTab===dt.id?accent:T.txt3,fontSize:12,fontWeight:detailTab===dt.id?700:400,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",transition:"all .2s"}}>{dt.icon} {dt.label}</button>
            ))}
          </div>
          <GPanel style={{padding:"22px 24px"}}>
            {detailTab==="overview"&&(<div>
              <SecHdr icon="📋" title="Clinical Overview" badge={item.badge} accent={accent}/>
              <div style={{...Gx.row(accent),padding:"12px 16px",marginBottom:12,borderLeft:`3px solid ${accent}60`}}>
                <div style={{fontSize:10,fontFamily:"'JetBrains Mono',monospace",color:accent,textTransform:"uppercase",marginBottom:4}}>Definition</div>
                <p style={{fontSize:13,color:T.txt2,margin:0,lineHeight:1.65}}>{data.definition}</p>
              </div>
              <div style={{...Gx.row(null),padding:"12px 16px",marginBottom:10}}>
                <div style={{fontSize:10,fontFamily:"'JetBrains Mono',monospace",color:T.txt3,textTransform:"uppercase",marginBottom:4}}>Triage Significance</div>
                <p style={{fontSize:12,color:T.txt2,margin:0,lineHeight:1.6}}>{item.severity}</p>
              </div>
              {data.reference&&<div style={{fontSize:10,color:T.txt4,fontFamily:"'JetBrains Mono',monospace",padding:"8px 12px",background:T.glassD,borderRadius:8,border:`1px solid ${T.border}`}}>📚 {data.reference}</div>}
            </div>)}
            {detailTab==="workup"&&(<div>
              <SecHdr icon="✅" title="Workup Checklist" badge="CHECKLIST" accent={accent}/>
              {(data.workup||[]).map((w,i)=>(
                <div key={i} style={{...Gx.row(null),display:"flex",gap:10,padding:"11px 13px",marginBottom:6}} onMouseEnter={e=>e.currentTarget.style.background=`${accent}07`} onMouseLeave={e=>e.currentTarget.style.background=T.glassD}>
                  <div style={{width:30,height:30,borderRadius:8,background:`${accent}14`,border:`1px solid ${accent}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>{w.icon}</div>
                  <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:T.txt,marginBottom:2}}>{w.label}</div><div style={{fontSize:11,color:T.txt3,lineHeight:1.5}}>{w.detail}</div></div>
                </div>
              ))}
            </div>)}
            {detailTab==="treatment"&&(<div>
              <SecHdr icon="💊" title="Treatment Protocol" badge="EVIDENCE-BASED" accent={accent}/>
              {(data.treatment||[]).map((rx,i)=>(
                <div key={i} style={{...Gx.row(null),padding:"11px 14px",marginBottom:6,borderLeft:`2px solid ${accent}40`}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontSize:13,fontWeight:700,color:T.txt}}>{rx.drug}</span>
                      {rx.cat&&<Chip label={rx.cat} color={accent}/>}
                    </div>
                    {rx.ref&&<EvidenceBadge level={rx.ref}/>}
                  </div>
                  {rx.dose&&<div style={{fontSize:12,color:T.txt2,fontFamily:"'JetBrains Mono',monospace",lineHeight:1.5,marginBottom:3}}>{rx.dose}</div>}
                  {rx.note&&<div style={{fontSize:10,color:T.txt3,lineHeight:1.4}}>{rx.note}</div>}
                </div>
              ))}
            </div>)}
            {detailTab==="followup"&&(<div>
              <SecHdr icon="📅" title="Follow-up & Disposition" badge="FOLLOW-UP" accent={accent}/>
              {(data.followup||[]).map((f,i)=>(
                <div key={i} style={{...Gx.row(null),display:"flex",gap:10,padding:"10px 13px",marginBottom:6}}>
                  <div style={{width:24,height:24,borderRadius:6,background:`${accent}18`,border:`1px solid ${accent}28`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:accent,flexShrink:0}}>{i+1}</div>
                  <p style={{fontSize:12,color:T.txt2,margin:0,lineHeight:1.6}}>{f}</p>
                </div>
              ))}
              <div style={{marginTop:12,fontSize:10,color:T.txt4,fontFamily:"'JetBrains Mono',monospace",padding:"8px 12px",background:T.glassD,borderRadius:8,border:`1px solid ${T.border}`}}>⚕ Clinical decision support only — final disposition decisions rest with the treating provider</div>
            </div>)}
          </GPanel>
        </div>
      );
    }
    return (
      <div style={{animation:"hubIn .35s ease"}}>
        <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:14,flexWrap:"wrap"}}>
          <GInput value={search} onChange={e=>setSearch(e.target.value)} accent={AC} placeholder={`Search ${ITEMS.length} protocols…`} style={{flex:"1 1 220px",maxWidth:360}}/>
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
            {["All",...CATEGORIES].map(cat=><GPill key={cat} label={cat} active={catFilter===cat} accent={AC} onClick={()=>setCatFilter(cat)}/>)}
          </div>
          <span style={{fontSize:11,color:T.txt4,fontFamily:"'JetBrains Mono',monospace",marginLeft:"auto"}}>{filtered.length} protocols</span>
        </div>
        {filtered.length===0 ? (
          <GPanel style={{padding:"50px 40px",textAlign:"center"}}>
            <div style={{fontSize:36,marginBottom:10,opacity:.3}}>🔍</div>
            <p style={{fontFamily:"'Playfair Display',serif",fontSize:16,color:T.txt2,margin:0}}>No protocols found</p>
          </GPanel>
        ) : (
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(278px,1fr))",gap:12}}>
            {filtered.map((item,i)=>{
              const accent = item.accent||AC;
              return (
                <div key={item.id} onClick={()=>{setSelected(item.id);setDetailTab("overview");}}
                  style={{...Gx.panel(null),padding:"20px",cursor:"pointer",animation:`hubIn .4s ease ${i*0.05}s both`,transition:"transform .25s,box-shadow .25s"}}
                  onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-5px)";e.currentTarget.style.border=`1px solid ${accent}45`;e.currentTarget.style.boxShadow=`0 16px 40px rgba(0,0,0,0.5),0 0 24px ${accent}14`;}}
                  onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.border=`1px solid ${T.border}`;e.currentTarget.style.boxShadow=`0 8px 32px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.12)`;}}>
                  <div style={{position:"absolute",top:0,left:0,right:0,height:2,borderRadius:"18px 18px 0 0",background:`linear-gradient(90deg,${accent},transparent)`,opacity:.3}}/>
                  <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:10}}>
                    <div style={{width:44,height:44,borderRadius:11,background:`${accent}20`,border:`1px solid ${accent}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{item.icon}</div>
                    <Chip label={item.badge} color={accent}/>
                  </div>
                  <div style={{fontSize:9,fontFamily:"'JetBrains Mono',monospace",color:accent,letterSpacing:".1em",textTransform:"uppercase",marginBottom:3,opacity:.85}}>{item.cat}</div>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,color:T.txt,marginBottom:4,lineHeight:1.3}}>{item.title}</div>
                  <div style={{fontSize:11,color:T.txt3,marginBottom:9,lineHeight:1.4}}>{item.subtitle}</div>
                  <div style={{height:1,background:`linear-gradient(90deg,${accent}40,transparent)`,marginBottom:7}}/>
                  <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:5}}>
                    {(item.esi||[]).map(l=><ESIBadge key={l} level={l}/>)}
                  </div>
                  <div style={{fontSize:10,color:T.txt3,lineHeight:1.4}}>{item.severity}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ── CC QUICK SORT ────────────────────────────────────────
  const renderCCSort = () => (
    <div style={{display:"flex",flexDirection:"column",gap:12,animation:"hubIn .35s ease"}}>
      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.teal,textTransform:"uppercase",letterSpacing:2,marginBottom:2}}>Chief Complaint Quick Sort — ESI Guidance & Escalation Flags</div>
      <GInput value={ccSearch} onChange={e=>setCcSearch(e.target.value)} accent={T.teal} placeholder="Search chief complaint…"/>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {filteredCC.map((item,i)=>{
          const esiData = ESI_LEVELS.find(e=>e.level===item.esi);
          return (
            <GPanel key={i} style={{padding:"16px 18px",borderLeft:`3px solid ${item.color}`}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12,flexWrap:"wrap"}}>
                <span style={{fontSize:18}}>{item.flag}</span>
                <span style={{fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:15,color:T.txt,flex:1}}>{item.cc}</span>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <div style={{width:28,height:28,borderRadius:7,background:esiData?.color||T.txt4,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 8px ${esiData?.color||T.txt4}60`}}>
                    <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,fontWeight:700,color:item.esi===3||item.esi===5?"#050f1e":"#fff"}}>{item.esi}</span>
                  </div>
                  <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:esiData?.color||T.txt3}}>ESI {item.esi} · {esiData?.label}</span>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Escalation Flags</div>
                  {item.flags.map((f,j)=>(
                    <div key={j} style={{display:"flex",gap:6,marginBottom:4}}>
                      <span style={{color:T.coral,fontSize:10,minWidth:8,flexShrink:0}}>▸</span>
                      <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.txt2,lineHeight:1.4}}>{f}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Immediate Workup</div>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.txt2,lineHeight:1.8}}>{item.workup}</div>
                </div>
              </div>
            </GPanel>
          );
        })}
        {filteredCC.length===0&&(
          <GPanel style={{padding:"40px",textAlign:"center"}}>
            <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:T.txt4}}>No chief complaints matching that search</p>
          </GPanel>
        )}
      </div>
    </div>
  );

  // ── AI ASSISTANT ────────────────────────────────────────
  const renderAI = () => (
    <div style={{display:"flex",flexDirection:"column",gap:14,animation:"hubIn .35s ease"}}>
      <GPanel style={{padding:"22px 24px"}} accent={T.purple}>
        <div style={{position:"absolute",top:0,left:0,right:0,height:2,borderRadius:"18px 18px 0 0",background:`linear-gradient(90deg,transparent,${T.purple}70,transparent)`,backgroundSize:"200% 100%",animation:"shimmer 3s linear infinite"}}/>
        <SecHdr icon="🤖" title="Triage AI Assistant" badge="AI-POWERED" accent={T.purple} sub="Ask triage clinical questions — responds as an experienced EM triage clinician"/>
        <textarea value={aiInput} onChange={e=>setAiInput(e.target.value)} rows={5}
          placeholder={`Ask a triage question…\ne.g. "What ESI level for a 67yo with sudden severe headache?"\n     "SALT vs START — when to use each in an MCI?"\n     "Fast track criteria for ankle sprain after a fall?"`}
          style={{...Gx.inp(),width:"100%",padding:"13px 15px",lineHeight:1.65,resize:"vertical"}}
          onFocus={e=>{e.target.style.borderColor=`${T.purple}55`;e.target.style.boxShadow=`0 0 0 3px ${T.purple}12`;}}
          onBlur={e=>{e.target.style.borderColor=T.border;e.target.style.boxShadow=T.shine;}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:10}}>
          <span style={{fontSize:10,color:T.txt4,fontFamily:"'JetBrains Mono',monospace"}}>{aiInput.length>0?`${aiInput.length} chars`:"Enter your question above"}</span>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>{setAiInput("");setAiResult(null);}} style={{...Gx.btn(null,false),padding:"8px 14px",fontSize:12}}>Clear</button>
            <button onClick={runAI} disabled={aiBusy||!aiInput.trim()} style={{...Gx.btn(T.purple,!aiBusy&&!!aiInput.trim()),padding:"8px 22px",fontSize:13,opacity:aiBusy||!aiInput.trim()?0.5:1}}>
              {aiBusy?"⏳ Thinking…":"🤖 Ask AI"}
            </button>
          </div>
        </div>
      </GPanel>
      {aiResult&&(
        <GPanel style={{padding:"22px 24px",animation:"hubIn .4s ease"}} accent={T.purple}>
          {aiResult.summary&&(
            <div style={{...Gx.row(T.purple),padding:"12px 16px",marginBottom:14,borderLeft:`3px solid ${T.purple}60`}}>
              <p style={{fontSize:14,color:T.txt,margin:0,fontFamily:"'Playfair Display',serif",lineHeight:1.6,fontStyle:"italic"}}>{aiResult.summary}</p>
            </div>
          )}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:12,marginBottom:aiResult.caution?12:0}}>
            {[{k:"keyPoints",label:"Key Points",color:AC},{k:"management",label:"Management",color:T.teal},{k:"pearls",label:"Clinical Pearls",color:T.gold}]
              .filter(s=>aiResult[s.k]?.length>0)
              .map(({k,label,color})=>(
                <div key={k} style={{...Gx.row(color),padding:"13px 14px"}}>
                  <div style={{fontSize:9,fontFamily:"'JetBrains Mono',monospace",color,letterSpacing:".08em",textTransform:"uppercase",marginBottom:7}}>{label}</div>
                  {aiResult[k].map((pt,idx)=><div key={idx} style={{fontSize:12,color:T.txt2,marginBottom:4,lineHeight:1.45}}>▸ {pt}</div>)}
                </div>
              ))}
          </div>
          {aiResult.caution&&aiResult.caution!=="null"&&(
            <div style={{...Gx.row(T.coral),padding:"10px 14px",borderLeft:`2px solid ${T.coral}60`,background:`${T.coral}07`}}>
              <span style={{fontSize:10,fontWeight:700,color:T.coral,marginRight:6}}>⚠ Caution:</span>
              <span style={{fontSize:12,color:T.txt2}}>{aiResult.caution}</span>
            </div>
          )}
        </GPanel>
      )}
    </div>
  );

  const SECTIONS = {reference:renderReference,esi:renderESI,mci:renderMCI,vitals:renderVitals,fasttrack:renderFastTrack,ccsort:renderCCSort,ai:renderAI};
  const activeNav = NAV_TABS.find(t=>t.id===nav);

  return (
    <div style={{display:"flex",minHeight:"100vh",background:`linear-gradient(135deg,#04080f 0%,#07101e 50%,#04080f 100%)`,fontFamily:"'DM Sans',sans-serif",position:"relative"}}>
      <AmbientBg/>
      {/* SIDEBAR */}
      <nav style={{width:224,minHeight:"100vh",position:"relative",zIndex:10,flexShrink:0,background:"rgba(255,255,255,0.04)",backdropFilter:"blur(40px) saturate(180%)",WebkitBackdropFilter:"blur(40px) saturate(180%)",borderRight:`1px solid rgba(255,255,255,0.09)`,boxShadow:"4px 0 40px rgba(0,0,0,0.5)",display:"flex",flexDirection:"column",padding:"24px 14px",gap:3}}>
        <div style={{position:"absolute",top:0,left:0,right:0,height:1,background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)",pointerEvents:"none"}}/>
        <div style={{marginBottom:24,paddingLeft:8}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
            <div style={{width:32,height:32,borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",background:`linear-gradient(135deg,${AC}40,${AC}20)`,border:`1px solid ${AC}30`,boxShadow:`0 0 16px ${AC}30`,fontSize:16}}>🏥</div>
            <span style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:T.txt}}>Notrya</span>
          </div>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:AC,letterSpacing:".18em",textTransform:"uppercase",paddingLeft:42}}>Triage Hub</div>
        </div>
        {NAV_TABS.map(item=>{
          const active = nav===item.id;
          return (
            <button key={item.id} onClick={()=>setNav(item.id)}
              style={{display:"flex",alignItems:"center",gap:9,padding:"10px 12px",borderRadius:11,border:active?`1px solid ${item.accent}30`:"1px solid transparent",width:"100%",cursor:"pointer",textAlign:"left",fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:active?600:400,transition:"all .2s",position:"relative",background:active?`linear-gradient(135deg,${item.accent}18,${item.accent}08)`:"transparent",color:active?item.accent:T.txt3}}
              onMouseEnter={e=>{if(!active){e.currentTarget.style.background="rgba(255,255,255,0.05)";e.currentTarget.style.color=T.txt2;}}}
              onMouseLeave={e=>{if(!active){e.currentTarget.style.background="transparent";e.currentTarget.style.color=T.txt3;}}}>
              {active&&<div style={{position:"absolute",left:0,top:"50%",transform:"translateY(-50%)",width:2.5,height:20,background:item.accent,borderRadius:"0 3px 3px 0",boxShadow:`0 0 8px ${item.accent}`}}/>}
              <span style={{fontSize:15,flexShrink:0}}>{item.icon}</span>
              <span style={{flex:1}}>{item.label}</span>
            </button>
          );
        })}
        <div style={{flex:1}}/>
        {/* Stat banner — always visible */}
        <div style={{padding:"10px 10px",borderRadius:11,background:"rgba(255,255,255,0.04)",border:`1px solid rgba(255,255,255,0.08)`,marginBottom:6}}>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:".1em",marginBottom:8}}>Time Targets</div>
          {STAT_ITEMS.map((s,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
              <span style={{fontSize:10,color:T.txt3,fontFamily:"'DM Sans',sans-serif"}}>{s.label}</span>
              <span style={{fontSize:11,fontFamily:"'JetBrains Mono',monospace",fontWeight:700,color:s.color}}>{s.value}</span>
            </div>
          ))}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:7,padding:"8px 12px",borderRadius:9,background:`${AC}05`,border:`1px solid ${AC}20`}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:AC,animation:"pulseDot 2s ease-in-out infinite"}}/>
          <span style={{fontSize:10,color:T.txt4,fontFamily:"'JetBrains Mono',monospace"}}>AI Ready</span>
        </div>
        <button onClick={()=>window.location.href='/QuickNote'} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 12px",borderRadius:10,border:`1px solid ${AC}35`,background:`${AC}0e`,color:AC,fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:600,cursor:"pointer",width:"100%",transition:"all .15s",marginBottom:6}} onMouseEnter={e=>{e.currentTarget.style.background=`${AC}1a`;e.currentTarget.style.borderColor=`${AC}60`;}} onMouseLeave={e=>{e.currentTarget.style.background=`${AC}0e`;e.currentTarget.style.borderColor=`${AC}35`;}}>
          <span style={{fontSize:15}}>⚡</span>
          <span>Open QuickNote</span>
        </button>
        <button onClick={()=>window.location.href='/hub'} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 12px",borderRadius:10,border:"1px solid rgba(42,79,122,0.4)",background:"rgba(14,37,68,0.5)",color:T.txt3,fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:600,cursor:"pointer",width:"100%",transition:"all .15s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(59,158,255,0.5)";e.currentTarget.style.color=T.txt2;}} onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(42,79,122,0.4)";e.currentTarget.style.color=T.txt3;}}>
          <span style={{fontSize:15}}>🏥</span>
          <span>Hub</span>
        </button>
      </nav>
      {/* MAIN */}
      <main style={{flex:1,padding:"30px 38px 52px",overflowY:"auto",position:"relative",zIndex:1}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:22}}>
          <button onClick={()=>navigate('/hub')} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 14px",borderRadius:9,border:"1px solid rgba(251,146,60,0.35)",background:"rgba(251,146,60,0.08)",color:AC,fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:600,cursor:"pointer",flexShrink:0,transition:"all .15s"}} onMouseEnter={e=>{e.currentTarget.style.background="rgba(251,146,60,0.18)";e.currentTarget.style.borderColor="rgba(251,146,60,0.6)";}} onMouseLeave={e=>{e.currentTarget.style.background="rgba(251,146,60,0.08)";e.currentTarget.style.borderColor="rgba(251,146,60,0.35)";}}>← Back to Hub</button>
          <div style={{height:1,width:24,background:`${activeNav?.accent||AC}60`,borderRadius:1}}/>
          <span style={{fontSize:10,fontFamily:"'JetBrains Mono',monospace",color:activeNav?.accent||AC,textTransform:"uppercase",letterSpacing:".14em",fontWeight:700}}>{activeNav?.label}</span>
          <div style={{flex:1,height:1,background:`linear-gradient(90deg,${activeNav?.accent||AC}30,transparent)`}}/>
          <span style={{fontSize:10,color:T.txt4,fontFamily:"'JetBrains Mono',monospace"}}>Notrya · Triage Hub</span>
        </div>
        {(SECTIONS[nav]||(() => null))()}
      </main>
      {/* TOASTS */}
      <div style={{position:"fixed",bottom:22,right:22,display:"flex",flexDirection:"column",gap:7,zIndex:200}}>
        {toasts.map(t=>{
          const c=t.type==="success"?T.green:t.type==="error"?T.coral:T.blue;
          return <div key={t.id} style={{padding:"10px 18px",borderRadius:12,background:"rgba(255,255,255,0.07)",backdropFilter:"blur(28px)",border:`1px solid ${c}30`,color:c,fontFamily:"'DM Sans',sans-serif",fontSize:13,boxShadow:`0 8px 32px rgba(0,0,0,0.6),0 0 16px ${c}20`,animation:"hubIn .25s ease",whiteSpace:"nowrap"}}>{t.msg}</div>;
        })}
      </div>
    </div>
  );
}