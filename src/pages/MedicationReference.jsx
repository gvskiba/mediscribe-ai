import { useState, useMemo } from "react";
import { ER_MEDICATIONS as MEDICATIONS } from "../components/drugreference/drugData";

// _STUB removed — data now in ER_MEDICATIONS (imported above)
const _IGNORE = [{ id:"fentanyl", category:"analgesics", name:"Fentanyl", subtitle:"Opioid Analgesic", code:"FEN-IV", line:"first", indications:["Moderate–severe pain","Procedural sedation adjunct"], adult_dose:"1–2 mcg/kg IV q30–60min PRN", ped:{mgkg:1.5,unit:"mcg",route:"IV/IN",max:100,notes:"IN: 2 mcg/kg max 100 mcg"}, onset:"1–2 min IV", duration:"30–60 min", contraindications:["Respiratory depression","MAO inhibitors within 14 days"], warnings:["Chest wall rigidity at high doses","Naloxone reversal available"], monitoring:["RR","O₂ sat","LOC"], reversal:"Naloxone 0.01 mg/kg IV", refs:["ACEP","WHO"] },
  { id:"morphine", category:"analgesics", name:"Morphine Sulfate", subtitle:"Opioid Analgesic", code:"MS-IV", line:"first", indications:["Moderate–severe pain","ACS pain management"], adult_dose:"2–4 mg IV q15–30min PRN; max 20 mg", ped:{mgkg:0.1,unit:"mg",route:"IV",max:5,notes:"Titrate q15–30 min"}, onset:"5–10 min IV", duration:"3–5 hr", contraindications:["Respiratory depression","Paralytic ileus","Head injury with AMS"], warnings:["Hypotension","Avoid in STEMI — CRUSADE data"], monitoring:["RR","BP","O₂ sat"], reversal:"Naloxone", refs:["ACEP","CRUSADE"] },
  { id:"ketorolac", category:"analgesics", name:"Ketorolac", subtitle:"NSAID Analgesic", code:"KTR-IV", line:"first", indications:["Renal colic","Musculoskeletal pain","Headache"], adult_dose:"15–30 mg IV/IM; max 5-day course", ped:{mgkg:0.5,unit:"mg",route:"IV/IM",max:30,notes:"Age ≥2 yr only"}, onset:"30 min", duration:"4–6 hr", contraindications:["GI bleed","Renal insufficiency","ASA allergy","Age <6 months"], warnings:["Limit ≤5 days","GI prophylaxis if prolonged use"], monitoring:["BMP (renal)","GI symptoms"], reversal:null, refs:["ACEP","Cochrane"] },
  { id:"acetaminophen_iv", category:"analgesics", name:"Acetaminophen IV", subtitle:"Ofirmev · Non-opioid", code:"APAP-IV", line:"first", indications:["Pain","Fever (antipyretic)"], adult_dose:"1000 mg IV q6h; max 4 g/day", ped:{mgkg:15,unit:"mg",route:"IV",max:1000,notes:"q6h; max 75 mg/kg/day"}, onset:"5–10 min", duration:"4–6 hr", contraindications:["Hepatic failure","Hypersensitivity"], warnings:["Hepatotoxicity — reduce dose in liver disease","Max 2 g/day with alcohol use"], monitoring:["LFTs with repeated use"], reversal:"N-Acetylcysteine (OD)", refs:["ACEP","FDA"] },
  { id:"midazolam", category:"analgesics", name:"Midazolam", subtitle:"Benzodiazepine Sedation", code:"MDZ-IV", line:"first", indications:["Procedural sedation","Seizures","Anxiety"], adult_dose:"1–2.5 mg IV; titrate to effect", ped:{mgkg:0.1,unit:"mg",route:"IV/IN/IM",max:5,notes:"IN: 0.2 mg/kg max 10 mg"}, onset:"2–3 min IV", duration:"30–60 min", contraindications:["Acute angle-closure glaucoma","Respiratory depression"], warnings:["Flumazenil reversal available","Paradoxical agitation (rare)"], monitoring:["RR","O₂ sat","BP","LOC"], reversal:"Flumazenil 0.2 mg IV", refs:["ACEP","PALS"] },
  { id:"propofol", category:"analgesics", name:"Propofol", subtitle:"Anesthetic · Procedural Sedation", code:"PRO-IV", line:"second", indications:["Procedural sedation","RSI induction","Refractory seizures"], adult_dose:"1–2 mg/kg IV induction; 25–75 mcg/kg/min infusion", ped:{mgkg:1,unit:"mg",route:"IV",max:200,notes:"Slow push; airway support required"}, onset:"<1 min", duration:"5–10 min", contraindications:["Egg/soy allergy (relative)","Hemodynamic instability"], warnings:["Apnea — airway management ready","Hypotension","Propofol infusion syndrome (prolonged use)"], monitoring:["BP","SpO₂","ETCO₂"], reversal:null, refs:["ACEP","SMACC"] },
  { id:"adenosine", category:"cardiovascular", name:"Adenosine", subtitle:"Antiarrhythmic · SVT Termination", code:"ADO-IV", line:"first", indications:["SVT termination","Wide-complex tachycardia (diagnostic)"], adult_dose:"6 mg rapid IV push; 12 mg ×2 if no response", ped:{mgkg:0.1,unit:"mg",route:"IV rapid push",max:6,notes:"2nd dose: 0.2 mg/kg (max 12 mg)"}, onset:"<30 sec", duration:"<2 min", contraindications:["2nd/3rd AV block","WPW with AF/Flutter","Sick sinus","Asthma (relative)"], warnings:["Brief asystole expected — warn patient","Use large antecubital vein + rapid saline flush","Theophylline antagonizes"], monitoring:["Continuous cardiac","BP","12-lead ECG"], reversal:null, refs:["AHA 2019","ACLS"] },
  { id:"amiodarone", category:"cardiovascular", name:"Amiodarone", subtitle:"Class III Antiarrhythmic", code:"AMI-IV", line:"first", indications:["VF/pVT pulseless","Stable VT","AF with RVR"], adult_dose:"VF: 300 mg IV push | Stable VT: 150 mg over 10 min → 1 mg/min", ped:{mgkg:5,unit:"mg",route:"IV",max:300,notes:"Over 20–60 min for stable rhythms"}, onset:"Minutes", duration:"Hours", contraindications:["Bradycardia","High-degree AV block","Thyroid disease (rel)"], warnings:["Hypotension with rapid infusion","QT prolongation","Phlebitis — central line preferred"], monitoring:["Cardiac monitor","QTc","BP"], reversal:null, refs:["AHA ACLS 2020","ALIVE Trial"] },
  { id:"metoprolol_iv", category:"cardiovascular", name:"Metoprolol IV", subtitle:"Beta-1 Blocker · Rate Control", code:"MET-IV", line:"first", indications:["AF with RVR","SVT","HTN urgency","ACS rate control"], adult_dose:"2.5–5 mg IV over 2 min q5min ×3 (max 15 mg)", ped:{mgkg:0.1,unit:"mg",route:"IV",max:5,notes:"Over 5 min; age ≥1 yr"}, onset:"5 min", duration:"3–6 hr", contraindications:["HR <60","SBP <90","Cardiogenic shock","Decompensated HF","High-degree AV block"], warnings:["Monitor BP/HR continuously","Bronchospasm risk in reactive airway disease"], monitoring:["Continuous cardiac","BP q5min"], reversal:"Glucagon 3–10 mg IV", refs:["AHA/ACC 2019","AFFIRM"] },
  { id:"diltiazem", category:"cardiovascular", name:"Diltiazem IV", subtitle:"CCB · Rate Control", code:"DIL-IV", line:"first", indications:["AF/Flutter with RVR","SVT"], adult_dose:"0.25 mg/kg IV over 2 min (max 25 mg); repeat 0.35 mg/kg", ped:{mgkg:0.25,unit:"mg",route:"IV",max:25,notes:"Over 2 min"}, onset:"2–5 min", duration:"1–3 hr", contraindications:["WPW with AF/Flutter","Cardiogenic shock","HR <60","Hypotension"], warnings:["Hypotension","Avoid in accessory pathway tachycardias"], monitoring:["Continuous cardiac","BP"], reversal:"Calcium chloride 1 g IV", refs:["AHA 2019"] },
  { id:"norepinephrine", category:"cardiovascular", name:"Norepinephrine", subtitle:"Vasopressor · Septic Shock 1st Line", code:"NE-INF", line:"first", indications:["Septic shock (1st line)","Distributive shock","Cardiogenic shock adjunct"], adult_dose:"0.01–3 mcg/kg/min IV; titrate to MAP ≥65 mmHg", ped:{mgkg:0.05,unit:"mcg/kg/min",route:"IV infusion",max:null,notes:"Start 0.05; titrate to age-appropriate MAP"}, onset:"1–2 min", duration:"Infusion-dependent", contraindications:["Uncorrected hypovolemia","Peripheral vascular thrombosis (rel)"], warnings:["Central line strongly preferred","Tissue necrosis if extravasated — phentolamine locally","Monitor lactate"], monitoring:["Arterial line BP preferred","MAP q15min","Lactate q2h","UO"], reversal:null, refs:["SSC 2018","SOAP II Trial"] },
  { id:"epinephrine_inf", category:"cardiovascular", name:"Epinephrine", subtitle:"Push-dose / Infusion Vasopressor", code:"EPI-PD", line:"first", indications:["Anaphylaxis refractory","Cardiogenic shock","Cardiac arrest"], adult_dose:"Push: 10–20 mcg IV q2–5min | Infusion: 0.05–0.5 mcg/kg/min", ped:{mgkg:0.01,unit:"mg",route:"IV/IO",max:1,notes:"Arrest: 0.01 mg/kg q3–5min"}, onset:"<1 min", duration:"3–10 min bolus", contraindications:["Narrow-angle glaucoma (relative)"], warnings:["Dysrhythmias","Severe hypertension","Prepare as 10 mcg/mL for push doses"], monitoring:["Continuous cardiac","BP","ECG"], reversal:null, refs:["ACLS 2020","ACEP"] },
  { id:"nitroglycerin", category:"cardiovascular", name:"Nitroglycerin", subtitle:"Nitrate · Vasodilator", code:"NTG-SL", line:"first", indications:["ACS","Hypertensive emergency + pulm edema","Flash pulmonary edema"], adult_dose:"SL: 0.4 mg q5min ×3 | IV: 5–200 mcg/min", ped:{mgkg:0.5,unit:"mcg/kg/min",route:"IV infusion",max:null,notes:"Start low; titrate"}, onset:"1–3 min SL", duration:"30–60 min SL", contraindications:["PDE-5 inhibitor ×24–48h","SBP <90","RV infarction"], warnings:["Headache","Hypotension","Reflex tachycardia"], monitoring:["BP q5min","HR","Symptom response"], reversal:null, refs:["ACC/AHA 2013"] },
  { id:"alteplase", category:"cardiovascular", name:"Alteplase (tPA)", subtitle:"Thrombolytic", code:"TPA-IV", line:"second", indications:["Massive PE + hemodynamic instability","Ischemic stroke ≤4.5 hr","STEMI if PCI unavailable"], adult_dose:"PE: 100 mg IV/2 hr | Stroke: 0.9 mg/kg (max 90 mg) 10% bolus + 60 min", ped:{mgkg:0.9,unit:"mg",route:"IV",max:90,notes:"Stroke only; adult PE dosing for adolescents"}, onset:"Minutes", duration:"Hours", contraindications:["Active bleeding","Recent surgery <3 months","Intracranial neoplasm","Prior ICH","Severe uncontrolled HTN"], warnings:["ICH risk — consent when feasible","Hold anticoagulation ×24h post-tPA (stroke)","Target BP <180/105 for stroke"], monitoring:["Neuro checks q15min (stroke)","BP q15min","CBC/coags"], reversal:"Cryoprecipitate 10U IV + TXA 1 g", refs:["AHA/ASA 2019","NINDS Trial"] },
  { id:"albuterol", category:"respiratory", name:"Albuterol", subtitle:"SABA Bronchodilator", code:"ALB-NEB", line:"first", indications:["Asthma exacerbation","COPD exacerbation","Bronchospasm","Hyperkalemia adjunct"], adult_dose:"2.5 mg neb q20min ×3 then q4h | MDI: 4–8 puffs q20min ×3", ped:{mgkg:0.15,unit:"mg",route:"Nebulized",max:5,notes:"Min 1.25 mg; continuous neb for severe"}, onset:"5–15 min", duration:"4–6 hr", contraindications:["Tachyarrhythmia (relative)"], warnings:["Hypokalemia with high doses","Tachycardia","Paradoxical bronchospasm (rare)"], monitoring:["SpO₂","HR","RR","Peak flow"], reversal:null, refs:["GINA 2023","ACEP"] },
  { id:"ipratropium", category:"respiratory", name:"Ipratropium", subtitle:"Anticholinergic Bronchodilator", code:"IPR-NEB", line:"first", indications:["Asthma moderate–severe (1st hour)","COPD exacerbation"], adult_dose:"0.5 mg neb q20min ×3 (first hour only — discontinue after)", ped:{mgkg:null,unit:"mg",route:"Nebulized",max:0.5,notes:"<12 yr: 0.25 mg | ≥12 yr: 0.5 mg; 1st hour only"}, onset:"15–30 min", duration:"3–6 hr", contraindications:["Atropine allergy (relative)"], warnings:["Glaucoma if nebulized near eyes","No added benefit past 1st hour (GINA)"], monitoring:["SpO₂","Bronchospasm response"], reversal:null, refs:["GINA 2023","Cochrane"] },
  { id:"dexamethasone", category:"respiratory", name:"Dexamethasone", subtitle:"Corticosteroid · Anti-inflammatory", code:"DEX-IV", line:"first", indications:["Asthma exacerbation","Croup","Allergic reaction","Meningitis adjunct"], adult_dose:"Asthma: 10 mg IV/PO ×1–2 | Cerebral edema: 10 mg IV load then 4 mg q6h", ped:{mgkg:0.6,unit:"mg",route:"PO/IV/IM",max:16,notes:"Croup: 0.6 mg/kg PO/IM ×1 (max 16 mg)"}, onset:"1–4 hr", duration:"36–72 hr", contraindications:["Active systemic fungal infection","Live vaccines"], warnings:["Hyperglycemia","Immunosuppression","HPA axis suppression prolonged use"], monitoring:["Blood glucose","BP","Infection signs"], reversal:null, refs:["ACEP","GINA 2023"] },
  { id:"magnesium_asthma", category:"respiratory", name:"Magnesium Sulfate", subtitle:"Refractory Asthma", code:"MG-AST", line:"first", indications:["Severe asthma refractory to bronchodilators"], adult_dose:"2 g IV over 20 min", ped:{mgkg:25,unit:"mg",route:"IV",max:2000,notes:"Over 20 min; max 2 g"}, onset:"10–20 min", duration:"2–4 hr", contraindications:["Renal failure (reduce dose)","Hypotension"], warnings:["Flushing during infusion","Hypotension with rapid infusion","Loss of DTRs = toxicity"], monitoring:["BP","RR","DTRs","SpO₂"], reversal:"Calcium gluconate 1 g IV", refs:["ACEP","Cochrane 2014"] },
  { id:"succinylcholine", category:"respiratory", name:"Succinylcholine", subtitle:"Depolarizing NMB · RSI", code:"SCH-RSI", line:"first", indications:["RSI neuromuscular blockade","Laryngospasm"], adult_dose:"1.5 mg/kg IV (standard RSI)", ped:{mgkg:2,unit:"mg",route:"IV/IO",max:150,notes:"<10 kg: 2 mg/kg | IM: 4 mg/kg if no IV"}, onset:"45–60 sec", duration:"7–10 min", contraindications:["Hyperkalemia","Burns >24 hr","Crush injury >24 hr","Malignant hyperthermia Hx","Myopathies"], warnings:["Defasiculate with vecuronium 0.01 mg/kg","Rhabdomyolysis in myopathies","Atropine pretreat peds <5 yr"], monitoring:["SpO₂","ETCO₂","Cardiac"], reversal:"Spontaneous only (depolarizing)", refs:["ACEP RSI","ATLS"] },
  { id:"rocuronium", category:"respiratory", name:"Rocuronium", subtitle:"Non-depolarizing NMB · RSI", code:"ROC-RSI", line:"first", indications:["RSI neuromuscular blockade","Succinylcholine contraindicated"], adult_dose:"1.2 mg/kg IV (RSI) | 0.6 mg/kg facilitated", ped:{mgkg:1.2,unit:"mg",route:"IV/IO",max:200,notes:"1.2 mg/kg RSI; reversal: sugammadex 16 mg/kg"}, onset:"60–90 sec", duration:"45–60 min", contraindications:["Hypersensitivity to rocuronium"], warnings:["Prolonged blockade — airway must be secured","Sugammadex 16 mg/kg reverses immediately (CICO)"], monitoring:["SpO₂","ETCO₂","NMB monitor"], reversal:"Sugammadex 16 mg/kg IV", refs:["ACEP RSI","CICO Protocol"] },
  { id:"etomidate", category:"respiratory", name:"Etomidate", subtitle:"Induction Agent · Hemodynamically Neutral", code:"ETO-RSI", line:"first", indications:["RSI induction","Hemodynamically unstable patients"], adult_dose:"0.3 mg/kg IV", ped:{mgkg:0.3,unit:"mg",route:"IV",max:30,notes:"≥10 yr; use ketamine in younger"}, onset:"<1 min", duration:"5–15 min", contraindications:["Adrenal insufficiency (relative — single dose acceptable ACEP)"], warnings:["Myoclonus during induction","Transient adrenal suppression (not significant single dose)","No analgesia — add fentanyl/ketamine"], monitoring:["BP","SpO₂","ETCO₂"], reversal:null, refs:["ACEP RSI 2022"] },
  { id:"ketamine_rsi", category:"respiratory", name:"Ketamine (RSI Induction)", subtitle:"Dissociative · Bronchodilator", code:"KET-RSI", line:"first", indications:["RSI in asthma/bronchospasm","Hypotensive patients","Pediatric RSI"], adult_dose:"1–2 mg/kg IV", ped:{mgkg:1.5,unit:"mg",route:"IV/IO",max:200,notes:"IM: 4–8 mg/kg; bronchodilation beneficial in asthma"}, onset:"45–60 sec IV", duration:"10–20 min", contraindications:["Severe HTN (relative)","Schizophrenia (relative)"], warnings:["Emergence reactions — midazolam for elective cases","Bronchodilation — preferred in asthma RSI","Increased secretions"], monitoring:["BP","HR","SpO₂","ETCO₂"], reversal:null, refs:["ACEP RSI 2022","CJEM"] },
  { id:"pip_tazo", category:"antimicrobials", name:"Piperacillin-Tazobactam", subtitle:"Extended-spectrum PCN · Gram-neg", code:"PIP-TZ", line:"first", indications:["Sepsis empiric","Intra-abdominal infections","HCAP","Febrile neutropenia"], adult_dose:"4.5 g IV q6–8h (extended infusion 4 hr preferred)", ped:{mgkg:100,unit:"mg",route:"IV",max:4500,notes:"q8h; piperacillin component; extended infusion preferred"}, onset:"30 min", duration:"6–8 hr interval", contraindications:["Penicillin allergy (anaphylaxis)"], warnings:["Renal dose adjustment","Sodium load — monitor electrolytes","Limited ESBL coverage"], monitoring:["SCr","BMP","Blood cultures"], reversal:null, refs:["SSC 2018","ACEP"] },
  { id:"vancomycin", category:"antimicrobials", name:"Vancomycin", subtitle:"Glycopeptide · MRSA Coverage", code:"VAN-IV", line:"first", indications:["MRSA coverage","Sepsis + MRSA risk","Bacterial meningitis","SSTI"], adult_dose:"25–30 mg/kg IV loading dose; then 15–20 mg/kg q8–12h (AUC-guided)", ped:{mgkg:15,unit:"mg",route:"IV",max:3000,notes:"q6h in children; infuse ≥60 min"}, onset:"30–60 min", duration:"6–12 hr interval", contraindications:["Hypersensitivity to vancomycin"], warnings:["Nephrotoxicity — monitor SCr q48–72h","Red man syndrome (rate-related infusion reaction)","AUC/MIC monitoring preferred over troughs"], monitoring:["SCr","AUC-guided levels","CBC"], reversal:null, refs:["ASHP/IDSA 2020","SSC 2018"] },
  { id:"ceftriaxone", category:"antimicrobials", name:"Ceftriaxone", subtitle:"3rd Gen Cephalosporin", code:"CTX-IV", line:"first", indications:["CAP","Bacterial meningitis","Gonorrhea","Urosepsis","Sepsis community-acquired"], adult_dose:"1–2 g IV/IM q24h | Meningitis: 2 g IV q12h", ped:{mgkg:50,unit:"mg",route:"IV/IM",max:2000,notes:"Meningitis: 100 mg/kg/day ÷q12h; avoid in neonates <28 days"}, onset:"30–60 min", duration:"24 hr interval", contraindications:["Neonates with hyperbilirubinemia (<28 days)","Calcium-containing IV solutions simultaneously"], warnings:["Do NOT mix with calcium IV solutions","PCN cross-reactivity <2%","Biliary sludging prolonged use"], monitoring:["LFTs","SCr","CBC"], reversal:null, refs:["IDSA 2019","ATS/IDSA CAP"] },
  { id:"azithromycin", category:"antimicrobials", name:"Azithromycin", subtitle:"Macrolide · Atypical Coverage", code:"AZI-IV", line:"first", indications:["CAP atypical coverage","Chlamydia","Pertussis"], adult_dose:"500 mg IV/PO ×1 then 250 mg ×4 (CAP) | 1 g PO ×1 (chlamydia)", ped:{mgkg:10,unit:"mg",route:"PO/IV",max:500,notes:"CAP: 10 mg/kg day 1 then 5 mg/kg ×4; ≥6 months"}, onset:"1–2 hr PO", duration:"68 hr half-life", contraindications:["QT prolongation Hx","Macrolide allergy"], warnings:["QTc prolongation — baseline ECG","Drug interactions (QT-prolonging meds)","Hepatotoxicity (rare)"], monitoring:["QTc on ECG","LFTs"], reversal:null, refs:["ATS/IDSA 2019"] },
  { id:"meropenem", category:"antimicrobials", name:"Meropenem", subtitle:"Carbapenem · MDR/ESBL Reserve", code:"MER-IV", line:"second", indications:["ESBL organisms","MDR sepsis","G-neg meningitis","Febrile neutropenia"], adult_dose:"1–2 g IV q8h (extended infusion 3 hr preferred)", ped:{mgkg:20,unit:"mg",route:"IV",max:2000,notes:"Meningitis: 40 mg/kg q8h (max 2 g)"}, onset:"30 min", duration:"8 hr interval", contraindications:["Carbapenem allergy","Concurrent valproic acid (significantly reduces VPA)"], warnings:["Seizures at high doses in renal failure","Decreases valproate 60–90% — use alternative AED","Reserve for confirmed ESBL/MDR"], monitoring:["SCr","VPA levels if applicable","Seizures"], reversal:null, refs:["IDSA 2016","SSC 2018"] },
  { id:"metronidazole", category:"antimicrobials", name:"Metronidazole (Flagyl)", subtitle:"Anaerobic Coverage", code:"MTZ-IV", line:"first", indications:["Anaerobic infections","Intra-abdominal sepsis","C. difficile (PO)","BV/Trichomonas"], adult_dose:"500 mg IV q8h | C. diff: 500 mg PO q8h | Trichomonas: 2 g PO ×1", ped:{mgkg:7.5,unit:"mg",route:"IV/PO",max:500,notes:"q8h; age >1 month"}, onset:"1–2 hr PO", duration:"8 hr interval", contraindications:["1st trimester pregnancy (relative)","Disulfiram use"], warnings:["Disulfiram reaction with alcohol — avoid ×72h post-course","Peripheral neuropathy prolonged use","Metallic taste common"], monitoring:["CBC prolonged use","Neuro exam"], reversal:null, refs:["IDSA C.diff 2021"] },
  { id:"lorazepam", category:"neuro", name:"Lorazepam", subtitle:"Benzodiazepine · Status Epilepticus", code:"LRZ-SE", line:"first", indications:["Status epilepticus (1st line)","Acute agitation","Alcohol withdrawal seizures"], adult_dose:"0.1 mg/kg IV (max 4 mg); repeat ×1 in 5–10 min", ped:{mgkg:0.1,unit:"mg",route:"IV/IM/IN",max:4,notes:"IN: 0.1 mg/kg (max 4 mg); repeat ×1 after 5 min"}, onset:"1–5 min IV", duration:"6–8 hr", contraindications:["Respiratory depression","Acute angle-closure glaucoma"], warnings:["Respiratory depression — airway support ready","Flumazenil reversal available","Paradoxical agitation (rare)"], monitoring:["RR","SpO₂","LOC","Seizure activity"], reversal:"Flumazenil 0.2 mg IV", refs:["AES 2016","ACEP"] },
  { id:"levetiracetam", category:"neuro", name:"Levetiracetam (Keppra)", subtitle:"2nd-line Status Epilepticus", code:"LEV-SE", line:"first", indications:["Status epilepticus 2nd line","Seizure prophylaxis"], adult_dose:"60 mg/kg IV over 10 min (max 4500 mg) — ESETT dosing", ped:{mgkg:60,unit:"mg",route:"IV",max:4500,notes:"Over 10 min; ESETT trial dosing"}, onset:"10–30 min", duration:"12 hr interval", contraindications:["Hypersensitivity to levetiracetam"], warnings:["Behavioral side effects — agitation, irritability","Renal dose adjustment","ESETT: comparable to fosphenytoin and valproate"], monitoring:["Seizure activity","SCr","CBC"], reversal:null, refs:["ESETT Trial NEJM 2019"] },
  { id:"fosphenytoin", category:"neuro", name:"Fosphenytoin", subtitle:"Phenytoin Prodrug · 2nd-line SE", code:"FOS-SE", line:"first", indications:["Status epilepticus 2nd line","Seizure prophylaxis"], adult_dose:"20 mg PE/kg IV at max 150 mg PE/min", ped:{mgkg:20,unit:"mg PE",route:"IV/IM",max:1500,notes:"≤3 mg PE/kg/min; IM acceptable"}, onset:"10–20 min", duration:"12–24 hr", contraindications:["2nd/3rd AV block","Bradycardia","Hypotension","SA block"], warnings:["Continuous cardiac monitoring during infusion","Hypotension with rapid infusion","Purple glove syndrome"], monitoring:["Continuous cardiac","BP q5min during infusion","Free phenytoin level"], reversal:null, refs:["ESETT Trial NEJM 2019"] },
  { id:"labetalol_iv", category:"neuro", name:"Labetalol IV", subtitle:"Alpha/Beta Blocker · HTN Emergency", code:"LAB-HTN", line:"first", indications:["Hypertensive encephalopathy","Aortic dissection","Pre-eclampsia/eclampsia","Hypertensive emergency"], adult_dose:"20 mg IV over 2 min; repeat 40–80 mg q10min; max 300 mg", ped:{mgkg:0.2,unit:"mg",route:"IV",max:40,notes:"Over 2 min q10min; infusion 0.25–3 mg/kg/hr"}, onset:"5 min", duration:"2–4 hr", contraindications:["Decompensated HF","Bradycardia","High-degree AV block","Asthma (rel)"], warnings:["Monitor BP q5min","Hypotension","Avoid in cocaine-induced HTN — use phentolamine"], monitoring:["BP q5min","HR","Neuro exam"], reversal:"Glucagon 3–10 mg IV", refs:["AHA/ASA 2018","JNC 8"] },
  { id:"naloxone", category:"neuro", name:"Naloxone (Narcan)", subtitle:"Opioid Antagonist · Reversal", code:"NLX-IV", line:"first", indications:["Opioid reversal — respiratory depression","Suspected opioid OD"], adult_dose:"0.4–2 mg IV/IM/IN q2–3min; titrate to RR >12 (avoid full reversal)", ped:{mgkg:0.01,unit:"mg",route:"IV/IM/IO/IN",max:2,notes:"IN: 0.1 mg/kg; repeat q2–3min as needed"}, onset:"<2 min IV", duration:"30–90 min (re-sedation risk)", contraindications:["None absolute in emergency setting"], warnings:["Shorter duration than most opioids — observe ≥2 hr","Precipitated withdrawal — pulm edema, agitation","Infusion at 2/3 reversal dose/hr for long-acting opioids"], monitoring:["RR","SpO₂","LOC","HR","BP"], reversal:null, refs:["ACEP 2022","CDC"] },
  { id:"haloperidol", category:"neuro", name:"Haloperidol", subtitle:"Antipsychotic · Acute Agitation", code:"HAL-IV", line:"first", indications:["Acute agitation","Excited delirium","Nausea/vomiting","Migraine adjunct"], adult_dose:"Agitation: 5–10 mg IV/IM | Nausea: 0.5–1 mg IV", ped:{mgkg:0.025,unit:"mg",route:"IV/IM",max:5,notes:"Age ≥3 yr; 0.025–0.075 mg/kg/dose"}, onset:"10–20 min IM", duration:"4–8 hr", contraindications:["Known QT prolongation","Parkinson's disease (rel)","NMS history"], warnings:["QTc prolongation — obtain ECG","EPS — treat with benztropine 1–2 mg IV","NMS rare but life-threatening"], monitoring:["QTc on ECG","VS","EPS symptoms"], reversal:null, refs:["ACEP Agitation 2021"] },
  { id:"ondansetron", category:"gi_gu_ob", name:"Ondansetron (Zofran)", subtitle:"5-HT3 Antagonist · Antiemetic", code:"ODZ-IV", line:"first", indications:["Nausea/vomiting","Chemo-induced N/V","Hyperemesis gravidarum"], adult_dose:"4–8 mg IV/PO/ODT q4–6h", ped:{mgkg:0.15,unit:"mg",route:"IV/PO/ODT",max:8,notes:"<15 kg: 2 mg | 15–30 kg: 4 mg | >30 kg: 8 mg"}, onset:"<30 min", duration:"4–8 hr", contraindications:["Hypersensitivity","Congenital long QT"], warnings:["QTc prolongation — higher risk IV vs PO","Serotonin syndrome with other serotonergics"], monitoring:["QTc if IV"], reversal:null, refs:["ACEP","Cochrane"] },
  { id:"metoclopramide", category:"gi_gu_ob", name:"Metoclopramide (Reglan)", subtitle:"Prokinetic Antiemetic", code:"MCP-IV", line:"first", indications:["Nausea/vomiting","Gastroparesis","Migraine adjunct"], adult_dose:"10 mg IV over 15 min", ped:{mgkg:0.1,unit:"mg",route:"IV",max:10,notes:"Over 15 min; age >1 yr"}, onset:"1–3 min IV", duration:"1–2 hr", contraindications:["Bowel obstruction","GI perforation","Pheochromocytoma","Seizure disorder"], warnings:["EPS/akathisia — premedicate diphenhydramine 25 mg IV","Tardive dyskinesia prolonged use","NMS (rare)"], monitoring:["EPS symptoms","BP"], reversal:"Diphenhydramine 25–50 mg IV (EPS)", refs:["ACEP"] },
  { id:"magnesium_ob", category:"gi_gu_ob", name:"Magnesium Sulfate (OB)", subtitle:"Eclampsia Prophylaxis & Treatment", code:"MG-ECL", line:"first", indications:["Eclampsia treatment/prophylaxis","Pre-eclampsia with severe features"], adult_dose:"Loading: 4–6 g IV over 15–20 min | Maintenance: 1–2 g/hr", ped:{mgkg:null,unit:"g",route:"IV",max:null,notes:"Adult OB indication only"}, onset:"Minutes", duration:"Infusion-dependent", contraindications:["Myasthenia gravis","Severe renal failure","Heart block"], warnings:["Toxicity: DTR loss → resp arrest → cardiac arrest","Calcium gluconate 1 g IV antidote — keep at bedside","Monitor UO ≥25 mL/hr hourly"], monitoring:["DTRs q1h","RR q1h","UO ≥25 mL/hr","Serum Mg in renal impairment"], reversal:"Calcium gluconate 1 g IV", refs:["ACOG 2020","Magpie Trial"] },
const CATEGORIES = [
  { id:"all", label:"All", icon:"💊", color:"#00c4a0" },
  { id:"analgesics", label:"Analgesics & Sedation", icon:"🩹", color:"#f97316" },
  { id:"cardiovascular", label:"Cardiovascular", icon:"🫀", color:"#ef4444" },
  { id:"respiratory", label:"Respiratory & Airway", icon:"🫁", color:"#06b6d4" },
  { id:"antimicrobials", label:"Antimicrobials", icon:"🦠", color:"#22c55e" },
  { id:"neuro", label:"Neurological", icon:"🧠", color:"#8b5cf6" },
  { id:"gi_gu_ob", label:"GI / GU / OB", icon:"💉", color:"#f59e0b" },
];
const CAT_COLOR = Object.fromEntries(CATEGORIES.map(c=>[c.id,c.color]));

const SEPSIS = {
  criteria:[
    { id:"sirs", label:"SIRS Criteria", badge:"≥2 Required", color:"#f59e0b", params:[{name:"Temperature",value:">38.3°C or <36°C"},{name:"Heart Rate",value:">90 bpm"},{name:"Respiratory Rate",value:">20/min or PaCO₂ <32"},{name:"WBC",value:">12k or <4k or >10% bands"}]},
    { id:"sepsis3", label:"Sepsis-3", badge:"SOFA ≥2", color:"#ef4444", desc:"Life-threatening organ dysfunction from dysregulated host response to infection", params:[{name:"SOFA Score",value:"≥2 from baseline"},{name:"qSOFA (screening)",value:"RR≥22 + AMS + SBP≤100"},{name:"Lactate",value:"Obtain for all suspected sepsis"}]},
    { id:"shock", label:"Septic Shock", badge:"MAP<65 + Lactate>2", color:"#b91c1c", desc:"Vasopressor requirement for MAP≥65 AND lactate >2 mmol/L despite fluid resuscitation", params:[{name:"MAP",value:"<65 mmHg despite resuscitation"},{name:"Lactate",value:">2 mmol/L (>4 = high risk)"},{name:"Vasopressor",value:"Required after adequate crystalloid"},{name:"Mortality",value:">40% in-hospital"}]},
    { id:"phoenix", label:"PHOENIX Peds 2024", badge:"Score≥2 + Infection", color:"#8b5cf6", desc:"PHOENIX Score ≥2 with suspected/confirmed infection (JAMA 2024, Schlapbach et al.)", params:[{name:"Respiratory",value:"SpO₂/FiO₂ <292=1pt; <220 on support=2pts"},{name:"Cardiovascular",value:"Vasoactive, lactate ≥5, pH <7.15"},{name:"Coagulation",value:"INR≥1.3, D-dimer≥2, Plt<100k"},{name:"Neurological",value:"GCS≤10 or AVPU P/U"}]},
  ],
  bundle:[
    {step:1,action:"Measure lactate level",detail:"Repeat at 2 hr if >2 mmol/L; target ≥10% clearance",priority:"high"},
    {step:2,action:"Blood cultures ×2 before antibiotics",detail:"Do NOT delay antibiotics >45 min waiting for cultures",priority:"high"},
    {step:3,action:"Broad-spectrum antibiotics",detail:"Within 1 hour of sepsis/septic shock recognition",priority:"critical"},
    {step:4,action:"30 mL/kg crystalloid (LR preferred)",detail:"For septic shock or lactate ≥4 mmol/L; reassess after each 500 mL bolus (PLR, PPV)",priority:"critical"},
    {step:5,action:"Vasopressors if MAP <65 mmHg",detail:"Norepinephrine 1st line; initiate during/after fluids if hypotension persists",priority:"critical"},
  ],
  fluids:{
    adult:{initial:"30 mL/kg LR or NS IV wide open",preferred:"Lactated Ringer's — SMART/SALT-ED: reduced AKI and 30-day mortality vs NS",vasopressor:"MAP <65 despite 30 mL/kg → initiate norepinephrine",caution:"Avoid fluid overload; reassess after each bolus; early vasopressors if poor response",list:[
      {name:"Lactated Ringer's (LR)",dose:"30 mL/kg",rate:"Wide open × 1 hr then reassess",note:"1st-line; SMART trial preferred"},
      {name:"Normal Saline (0.9% NS)",dose:"30 mL/kg",rate:"Wide open × 1 hr",note:"Risk hyperchloremic acidosis large volumes"},
      {name:"Albumin 5%",dose:"200–300 mL bolus",rate:"30–60 min",note:"Adjunct if crystalloid >4 L (ALBIOS trial)"},
    ]},
    pediatric:{initial:"10–20 mL/kg over 5–20 min; reassess after each",max:"40–60 mL/kg first hour (individualize)",caution:"FEAST trial: aggressive bolus ↑ mortality — reassess frequently",mapTargets:[
      {age:"0–1 month",sbp:60,map:40},{age:"1–12 months",sbp:70,map:50},{age:"1–5 years",sbp:80,map:55},
      {age:"6–12 years",sbp:90,map:60},{age:">12 years",sbp:100,map:65},
    ]},
  },
  antibiotics:{
    empiric:[
      {severity:"Moderate Sepsis — Community-Acquired",dot:"#f59e0b",primary:"Ceftriaxone 2 g IV q24h",addition:"+ Azithromycin 500 mg IV if pneumonia suspected",notes:"Add metronidazole for abdominal source; add vancomycin if MRSA risk"},
      {severity:"Severe Sepsis / Septic Shock",dot:"#ef4444",primary:"Piperacillin-Tazobactam 4.5 g IV q6–8h (extended infusion preferred)",addition:"+ Vancomycin 25–30 mg/kg IV load if MRSA risk",notes:"Add antifungal if immunocompromised; de-escalate at 48–72 hr with cultures"},
      {severity:"High ESBL Risk / HAP / Recent Antibiotics",dot:"#b91c1c",primary:"Meropenem 1–2 g IV q8h (extended infusion 3 hr preferred)",addition:"+ Vancomycin if MRSA risk",notes:"Reserve carbapenem for true ESBL/MDR; stewardship consultation; reassess 48–72 hr"},
    ],
    sources:[
      {source:"Pneumonia (CAP)",primary:"Ceftriaxone 1–2 g IV + Azithromycin 500 mg IV",alt:"Levofloxacin 750 mg IV (PCN allergy or atypical)",duration:"5–7 d (CAP); 7–14 d (HCAP)"},
      {source:"Urosepsis / Pyelonephritis",primary:"Ceftriaxone 1–2 g IV q24h",alt:"Pip-Tazo if healthcare-associated or recent UTI",duration:"7–14 days"},
      {source:"Intra-abdominal",primary:"Pip-Tazo 4.5 g IV q6h + urgent surgical/IR source control",alt:"Meropenem + Metronidazole (PCN allergy or HAI)",duration:"4–7 d if adequate source control"},
      {source:"SSTI / Necrotizing Fasciitis",primary:"Vancomycin 25–30 mg/kg + Pip-Tazo 4.5 g IV q6h (NF)",alt:"Daptomycin 6–10 mg/kg IV (confirmed MRSA)",duration:"NF: URGENT debridement within hours; until clinically improved"},
      {source:"Bacterial Meningitis",primary:"Ceftriaxone 2 g IV q12h + Vancomycin 15 mg/kg q8–12h + Dex 0.15 mg/kg q6h × 4d",alt:"+ Ampicillin 2 g IV q4h if Listeria risk (>50 yr, immunocompromised, pregnancy)",duration:"7–21 days depending on organism"},
      {source:"Febrile Neutropenia",primary:"Pip-Tazo 4.5 g IV q6h OR Cefepime 2 g IV q8h",alt:"Meropenem if high-risk Pseudomonas; + Vancomycin if catheter-related",duration:"Until ANC >500 and afebrile ≥48 hr"},
    ],
    pediatric:[
      {age:"Neonate (<1 mo)",primary:"Ampicillin 50 mg/kg IV q8h + Gentamicin 4–5 mg/kg IV q24h",mod:"+ Cefotaxime if meningitis; avoid ceftriaxone in neonates",notes:"GBS, E. coli, Listeria; add Acyclovir 20 mg/kg q8h if HSV suspected"},
      {age:"1–3 months",primary:"Ampicillin 50 mg/kg IV q6h + Cefotaxime 50 mg/kg IV q6h",mod:"Ceftriaxone acceptable if >28 days without hyperbilirubinemia",notes:"Consider viral; Acyclovir if encephalitis suspected"},
      {age:"3 mo – 5 years",primary:"Ceftriaxone 50–100 mg/kg IV q24h",mod:"Meningitis: + Vancomycin 15 mg/kg q6h + Dex 0.15 mg/kg q6h × 4d",notes:"Dexamethasone reduces hearing loss; Vancomycin for PCN-resistant S. pneumoniae"},
      {age:">5 years",primary:"Ceftriaxone 50–100 mg/kg IV q24h (max 2 g)",mod:"Septic shock: + Pip-Tazo 100 mg/kg q8h + Vancomycin 15 mg/kg q6h",notes:"Cultures before antibiotics without delaying >1 hr"},
    ],
  },
};

function estimateWeight(mo){if(mo<3)return 3.5+mo*0.9;if(mo<12)return 6+(mo-3)*0.5;const y=mo/12;if(y<=2)return 10+(y-1)*2.5;return y*3+7;}
function getBroselow(w){if(w<5)return{zone:"Grey",hex:"#9ca3af"};if(w<7)return{zone:"Pink",hex:"#ec4899"};if(w<9)return{zone:"Red",hex:"#ef4444"};if(w<11)return{zone:"Purple",hex:"#8b5cf6"};if(w<14)return{zone:"Yellow",hex:"#eab308"};if(w<18)return{zone:"White",hex:"#e2e8f0"};if(w<23)return{zone:"Blue",hex:"#3b82f6"};if(w<29)return{zone:"Orange",hex:"#f97316"};if(w<36)return{zone:"Green",hex:"#22c55e"};return{zone:"Adult",hex:"#6b7280"};}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --bg:#080e1a;--nav:#060b15;--c1:#0d1628;--c2:#111e33;--c3:#162240;
  --br:rgba(0,196,160,0.12);--br2:rgba(0,196,160,0.22);
  --teal:#00c4a0;--teal2:#00e5bb;--tdim:rgba(0,196,160,0.08);
  --tx:#e2e8f0;--tx2:#94a3b8;--tx3:#4a6080;
  --red:#ef4444;--yel:#f59e0b;--grn:#22c55e;--pur:#8b5cf6;--blu:#3b82f6;
  --r:10px;--r2:14px;--f:'Inter',sans-serif;
}
body{font-family:var(--f);background:var(--bg);color:var(--tx);min-height:100vh;}
.lay{display:flex;min-height:100vh;}
.sb{width:56px;background:var(--nav);border-right:1px solid var(--br);display:flex;flex-direction:column;align-items:center;padding:12px 0;gap:4px;position:fixed;left:0;top:0;bottom:0;z-index:200;}
.sb-logo{width:36px;height:36px;border-radius:10px;background:var(--teal);display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:800;color:#080e1a;margin-bottom:12px;}
.sbi{width:40px;height:40px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;cursor:pointer;transition:background .15s;color:var(--tx3);position:relative;}
.sbi:hover{background:var(--tdim);color:var(--teal);}
.sbi.on{background:var(--tdim);color:var(--teal);}
.sbi.on::before{content:'';position:absolute;left:0;top:50%;transform:translateY(-50%);width:3px;height:24px;background:var(--teal);border-radius:0 3px 3px 0;}
.sb-bot{margin-top:auto;display:flex;flex-direction:column;align-items:center;gap:4px;}
.topbar{position:fixed;top:0;left:56px;right:0;height:52px;z-index:100;background:rgba(8,14,26,0.92);backdrop-filter:blur(12px);border-bottom:1px solid var(--br);display:flex;align-items:center;justify-content:space-between;padding:0 20px;}
.tbl{display:flex;align-items:center;gap:8px;}
.tb-title{font-size:15px;font-weight:600;}
.tb-sep{color:var(--tx3);font-size:12px;}
.tb-bc{font-size:12px;color:var(--tx3);}
.tbr{display:flex;align-items:center;gap:8px;}
.tb-ai{display:flex;align-items:center;gap:6px;padding:5px 10px;border-radius:6px;font-size:11px;font-weight:600;letter-spacing:.04em;background:rgba(0,196,160,.12);border:1px solid rgba(0,196,160,.3);color:var(--teal);}
.tb-dot{width:7px;height:7px;border-radius:50%;background:var(--teal);animation:pulse 2s infinite;}
@keyframes pulse{0%,100%{opacity:1;}50%{opacity:.3;}}
.tb-btn{padding:6px 14px;border-radius:7px;font-size:12px;font-weight:500;cursor:pointer;border:1px solid var(--br2);background:transparent;color:var(--tx2);transition:all .15s;font-family:var(--f);}
.tb-btn:hover{background:var(--tdim);color:var(--teal);}
.tb-pri{padding:6px 16px;border-radius:7px;font-size:12px;font-weight:600;cursor:pointer;background:var(--teal);border:none;color:#080e1a;font-family:var(--f);transition:opacity .15s;}
.tb-pri:hover{opacity:.85;}
.main{margin-left:56px;margin-top:52px;padding:18px;}
.sh{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;}
.sh-l{display:flex;align-items:center;gap:10px;}
.sh-ico{width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px;background:var(--tdim);}
.sh-ttl{font-size:11px;font-weight:600;letter-spacing:.1em;color:var(--tx2);text-transform:uppercase;}
.sh-m{font-size:11px;color:var(--tx3);}
.ntabs{display:flex;gap:2px;margin-bottom:16px;}
.ntab{padding:7px 16px;border-radius:8px;font-size:12px;font-weight:500;cursor:pointer;border:1px solid transparent;color:var(--tx2);background:transparent;font-family:var(--f);transition:all .15s;}
.ntab:hover{background:var(--tdim);color:var(--tx);}
.ntab.on{background:var(--tdim);border-color:var(--br2);color:var(--teal);}
.sw{flex:1;display:flex;align-items:center;gap:8px;background:var(--c1);border:1px solid var(--br);border-radius:var(--r);padding:0 12px;transition:border-color .15s;}
.sw:focus-within{border-color:var(--br2);}
.sw input{flex:1;background:transparent;border:none;outline:none;color:var(--tx);font-size:13px;padding:9px 0;font-family:var(--f);}
.sw input::placeholder{color:var(--tx3);}
.fps{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;}
.fp{padding:4px 12px;border-radius:20px;font-size:11px;font-weight:500;cursor:pointer;border:1px solid var(--br);background:var(--c1);color:var(--tx2);transition:all .15s;}
.fp:hover{border-color:var(--br2);color:var(--tx);}
.fp.on{color:#080e1a;border-color:transparent;font-weight:600;}
.card{background:var(--c1);border:1px solid var(--br);border-radius:var(--r2);overflow:hidden;}
.chdr{display:flex;align-items:center;justify-content:space-between;padding:11px 16px;border-bottom:1px solid var(--br);background:var(--c2);}
.cbdy{padding:14px 16px;}
.mlist{display:flex;flex-direction:column;gap:3px;}
.mrow{display:flex;align-items:flex-start;gap:12px;padding:10px 14px;background:var(--c1);border:1px solid var(--br);border-radius:var(--r);cursor:pointer;transition:all .15s;}
.mrow:hover{background:var(--c2);border-color:var(--br2);}
.mrow.ex{background:var(--c2);border-color:var(--br2);border-radius:var(--r) var(--r) 0 0;border-bottom-color:transparent;}
.mdot{width:10px;height:10px;border-radius:50%;flex-shrink:0;margin-top:4px;}
.mrm{flex:1;min-width:0;}
.mrn{font-size:13px;font-weight:600;display:flex;align-items:center;gap:7px;flex-wrap:wrap;}
.mrs{font-size:11px;color:var(--tx2);margin-top:2px;}
.mcod{font-size:10px;font-family:monospace;padding:2px 6px;border-radius:4px;background:var(--c3);border:1px solid var(--br2);color:var(--tx2);font-weight:600;letter-spacing:.05em;}
.mlb{font-size:9px;padding:2px 6px;border-radius:3px;font-weight:700;letter-spacing:.06em;}
.l1{background:rgba(0,196,160,.1);color:var(--teal);border:1px solid rgba(0,196,160,.25);}
.l2{background:rgba(245,158,11,.1);color:var(--yel);border:1px solid rgba(245,158,11,.25);}
.mrr{display:flex;align-items:center;gap:8px;flex-shrink:0;}
.obtn{font-size:11px;color:var(--teal);background:transparent;border:none;cursor:pointer;font-family:var(--f);font-weight:500;white-space:nowrap;padding:4px 0;}
.obtn:hover{text-decoration:underline;}
.dpill{font-size:10px;background:var(--c3);border:1px solid var(--br);border-radius:4px;padding:2px 8px;color:var(--tx2);font-family:monospace;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.mdet{background:var(--c2);border:1px solid var(--br2);border-top:none;border-radius:0 0 var(--r) var(--r);padding:13px 13px 13px 36px;margin-bottom:3px;}
.dgrid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:13px;margin-bottom:11px;}
.dlbl{font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--tx3);margin-bottom:4px;}
.dval{font-size:12px;color:var(--tx);line-height:1.5;}
.dval.tl{color:var(--teal);font-weight:600;font-family:monospace;font-size:13px;}
.cir{display:flex;gap:6px;align-items:flex-start;font-size:11px;color:var(--red);padding:2px 0;}
.wr{display:flex;gap:6px;align-items:flex-start;font-size:11px;color:var(--tx2);padding:2px 0;}
.rtags{display:flex;gap:6px;flex-wrap:wrap;margin-top:9px;padding-top:9px;border-top:1px solid var(--br);}
.rtag{font-size:10px;padding:2px 8px;border-radius:4px;letter-spacing:.04em;background:rgba(0,196,160,.06);border:1px solid rgba(0,196,160,.2);color:var(--teal);}
.rvtag{font-size:10px;padding:2px 8px;border-radius:4px;background:rgba(139,92,246,.1);border:1px solid rgba(139,92,246,.25);color:var(--pur);}
.aip{background:var(--c2);border:1px solid rgba(0,196,160,.2);border-radius:var(--r2);padding:13px 15px;margin-bottom:16px;}
.aih{display:flex;align-items:center;gap:8px;margin-bottom:9px;}
.aitag{font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--teal);background:rgba(0,196,160,.1);border:1px solid rgba(0,196,160,.25);padding:3px 8px;border-radius:4px;}
.aim{font-size:11px;color:var(--tx3);margin-left:auto;}
.air{display:flex;gap:8px;}
.aii{flex:1;background:var(--c3);border:1px solid rgba(0,196,160,.15);border-radius:var(--r);padding:8px 12px;color:var(--tx);font-size:13px;font-family:var(--f);outline:none;transition:border-color .15s;}
.aii:focus{border-color:var(--br2);}
.aib{padding:8px 15px;background:var(--teal);border:none;border-radius:var(--r);color:#080e1a;font-size:12px;font-weight:700;cursor:pointer;font-family:var(--f);transition:opacity .15s;white-space:nowrap;}
.aib:hover{opacity:.85;}
.aib:disabled{opacity:.4;cursor:not-allowed;}
.airesp{margin-top:11px;padding:11px 13px;background:var(--c3);border-radius:var(--r);border:1px solid var(--br);font-size:12px;line-height:1.7;color:var(--tx2);white-space:pre-wrap;}
.cinps{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:14px;}
.ilbl{display:block;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--tx3);margin-bottom:5px;}
.inp,.sel{width:100%;background:var(--c3);border:1px solid var(--br);border-radius:var(--r);padding:8px 11px;color:var(--tx);font-size:13px;font-family:var(--f);outline:none;transition:border-color .15s;}
.inp:focus,.sel:focus{border-color:var(--br2);}
.sel option{background:var(--c3);}
.wbar{display:flex;align-items:center;gap:18px;padding:11px 15px;background:rgba(0,196,160,.05);border:1px solid rgba(0,196,160,.15);border-radius:var(--r);margin-bottom:13px;}
.wv{font-size:30px;font-weight:700;color:var(--teal);font-family:monospace;}
.wu{font-size:13px;color:var(--tx2);}
.west{font-size:10px;color:var(--tx3);letter-spacing:.05em;}
.bzb{padding:4px 11px;border-radius:5px;font-size:11px;font-weight:700;font-family:monospace;margin-left:auto;}
.cstat{background:var(--c3);border-radius:var(--r);padding:7px 12px;text-align:center;}
.csv{font-size:15px;font-weight:700;font-family:monospace;}
.csl{font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:var(--tx3);margin-top:2px;}
.rtbl{width:100%;border-collapse:collapse;}
.rtbl th{font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--tx3);text-align:left;padding:0 10px 7px;}
.rtbl td{padding:7px 10px;border-top:1px solid var(--br);font-size:12px;vertical-align:top;}
.rtbl tr:hover td{background:rgba(255,255,255,.015);}
.rdose{font-family:monospace;color:var(--teal);font-weight:700;font-size:13px;}
.rmax{font-size:9px;padding:2px 6px;border-radius:3px;background:rgba(245,158,11,.1);color:var(--yel);font-weight:700;}
.rcap{color:var(--yel)!important;}
.cgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:11px;margin-bottom:18px;}
.cc{background:var(--c1);border-radius:var(--r2);overflow:hidden;border:1px solid var(--br);}
.cct{padding:10px 13px;}
.ccb{font-size:9px;font-weight:700;letter-spacing:.08em;padding:2px 7px;border-radius:3px;display:inline-block;margin-bottom:5px;}
.ccl{font-size:12px;font-weight:700;}
.ccd{font-size:11px;color:var(--tx2);margin-top:3px;line-height:1.4;}
.ccp{border-top:1px solid var(--br);}
.cprow{display:flex;justify-content:space-between;gap:8px;padding:5px 13px;border-bottom:1px solid var(--br);font-size:11px;}
.cprow:last-child{border-bottom:none;}
.cpn{color:var(--tx2);flex-shrink:0;}
.cpv{color:var(--tx);text-align:right;font-family:monospace;font-size:10px;}
.blist{display:flex;flex-direction:column;gap:6px;}
.bstep{display:flex;gap:11px;align-items:flex-start;padding:9px 13px;background:var(--c1);border:1px solid var(--br);border-radius:var(--r);border-left:3px solid transparent;}
.bstep.critical{border-left-color:var(--red);}
.bstep.high{border-left-color:var(--yel);}
.snum{width:23px;height:23px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;font-family:monospace;}
.critical .snum{background:rgba(239,68,68,.12);color:var(--red);}
.high .snum{background:rgba(245,158,11,.12);color:var(--yel);}
.sact{font-size:13px;font-weight:600;}
.sdet{font-size:11px;color:var(--tx2);margin-top:2px;line-height:1.4;}
.fgrid{display:grid;grid-template-columns:1fr 1fr;gap:13px;margin-bottom:18px;}
.fn{font-size:12px;font-weight:600;color:var(--teal);font-family:monospace;}
.fd{font-size:11px;color:var(--tx2);margin-top:2px;}
.ft{width:100%;border-collapse:collapse;}
.ft th{font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--tx3);text-align:left;padding:0 8px 6px;}
.ft td{padding:6px 8px;border-top:1px solid var(--br);font-size:11px;vertical-align:top;}
.mtbl{width:100%;border-collapse:collapse;}
.mtbl th{font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--tx3);text-align:left;padding:0 10px 5px;}
.mtbl td{padding:5px 10px;border-top:1px solid var(--br);font-size:11px;}
.arow{background:var(--c1);border:1px solid var(--br);border-radius:var(--r);overflow:hidden;margin-bottom:6px;}
.asev{font-size:11px;font-weight:700;padding:8px 13px;background:var(--c2);border-bottom:1px solid var(--br);display:flex;align-items:center;gap:8px;}
.abdy{display:grid;grid-template-columns:1fr 1fr 1fr;gap:13px;padding:11px 13px;}
.al{font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--tx3);margin-bottom:4px;}
.ad{font-size:12px;font-family:monospace;color:var(--grn);font-weight:600;line-height:1.4;}
.aa{font-size:11px;color:var(--tx2);line-height:1.4;}
.an{font-size:11px;color:var(--tx3);line-height:1.4;}
.stabs{display:flex;gap:6px;margin-bottom:13px;}
.stab{padding:5px 13px;border-radius:6px;font-size:11px;font-weight:500;cursor:pointer;border:1px solid var(--br);background:var(--c1);color:var(--tx2);transition:all .15s;font-family:var(--f);}
.stab:hover{border-color:var(--br2);color:var(--tx);}
.stab.on{background:var(--tdim);border-color:var(--br2);color:var(--teal);}
.ibox{background:rgba(0,196,160,.05);border:1px solid rgba(0,196,160,.15);border-radius:var(--r);padding:9px 12px;font-size:11px;color:var(--tx2);line-height:1.6;margin-bottom:12px;}
.ibox strong{color:var(--teal);}
.empty{text-align:center;padding:44px;color:var(--tx3);}
.empty-i{font-size:34px;margin-bottom:9px;}
.empty-t{font-size:13px;}
@media(max-width:1100px){.cgrid{grid-template-columns:1fr 1fr;}.dgrid{grid-template-columns:1fr 1fr;}.abdy{grid-template-columns:1fr;}.cinps{grid-template-columns:1fr 1fr;}}
@media(max-width:768px){.main{padding:10px;}.cgrid,.fgrid,.cinps{grid-template-columns:1fr;}.dgrid{grid-template-columns:1fr;}}
`;

export default function MedicationReferencePage() {
  const [tab, setTab] = useState("medications");
  const [cat, setCat] = useState("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [pedAge, setPedAge] = useState("");
  const [pedUnit, setPedUnit] = useState("months");
  const [pedWt, setPedWt] = useState("");
  const [pedCat, setPedCat] = useState("all");
  const [sepTab, setSepTab] = useState("criteria");
  const [abxTab, setAbxTab] = useState("empiric");
  const [complaint, setComplaint] = useState("");
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const weight = useMemo(()=>{
    if(pedWt) return parseFloat(pedWt)||null;
    if(!pedAge) return null;
    const mo = pedUnit==="years" ? parseFloat(pedAge)*12 : parseFloat(pedAge);
    if(isNaN(mo)||mo<0) return null;
    return Math.round(estimateWeight(mo)*10)/10;
  },[pedAge,pedUnit,pedWt]);
  const bz = weight ? getBroselow(weight) : null;

  const filtered = useMemo(()=> MEDICATIONS.filter(m=>{
    if(cat!=="all"&&m.category!==cat) return false;
    const q=search.toLowerCase();
    if(!q) return true;
    return m.name.toLowerCase().includes(q)||m.indications.join(" ").toLowerCase().includes(q)||m.subtitle.toLowerCase().includes(q)||m.code.toLowerCase().includes(q);
  }),[cat,search]);

  const pedResults = useMemo(()=>{
    if(!weight) return [];
    return MEDICATIONS.filter(m=>(pedCat==="all"||m.category===pedCat)&&m.ped?.mgkg).map(m=>{
      const raw=weight*m.ped.mgkg;
      const capped=m.ped.max!==null&&raw>m.ped.max;
      const dose=capped?m.ped.max:Math.round(raw*10)/10;
      return{...m,calcDose:`${dose} ${m.ped.unit}`,capped};
    });
  },[weight,pedCat]);

  const handleAI = async()=>{
    if(!complaint.trim()) return;
    setAiLoading(true); setAiText("");
    try{
      const { base44 } = await import("@/api/base44Client");
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an ER physician AI following ACEP guidelines. Given this presenting complaint, provide concise clinical medication recommendations.\n\nPresenting Complaint: ${complaint}\n\nProvide:\n1. Immediate medications (with ER doses)\n2. Key monitoring parameters\n3. Critical contraindications to assess\n4. Disposition considerations\n\nBe concise and clinical.`
      });
      setAiText(typeof result === "string" ? result : JSON.stringify(result));
    }catch(e){setAiText("⚠ Unable to reach AI service.");}
    finally{setAiLoading(false);}
  };

  return(
    <>
      <style>{CSS}</style>
      <div className="lay">
        <div className="sb">
          <div className="sb-logo">Rx</div>
          {[["medications","💊"],["calculator","⚖️"],["sepsis","🔴"]].map(([id,ic])=>(
            <div key={id} className={`sbi ${tab===id?"on":""}`} onClick={()=>setTab(id)} title={id}>{ic}</div>
          ))}
          <div className="sb-bot">
            <div className="sbi" title="Settings">⚙️</div>
            <div style={{width:32,height:32,borderRadius:"50%",background:"#162240",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"var(--teal)",cursor:"pointer"}}>ER</div>
          </div>
        </div>

        <div className="topbar">
          <div className="tbl">
            <span className="tb-title">Medication Reference</span>
            <span className="tb-sep">/</span>
            <span className="tb-bc">ClinAI · Emergency Department</span>
          </div>
          <div className="tbr">
            <div className="tb-ai"><span className="tb-dot"/><span>AI ACTIVE</span></div>
            <button className="tb-btn">Export Protocol</button>
            <button className="tb-pri">Order Set →</button>
          </div>
        </div>

        <div className="main">
          {/* AI Panel */}
          <div className="aip">
            <div className="aih">
              <span style={{fontSize:15}}>⚡</span>
              <span className="aitag">AI CLINICAL INSIGHT</span>
              <span className="aim">Evidence-based · Real-time</span>
            </div>
            <div className="air">
              <input className="aii" placeholder="Enter presenting complaint for AI medication recommendations (e.g. 'septic shock, HR 125, temp 39.2°C, BP 82/54, lactate 4.8')..." value={complaint} onChange={e=>setComplaint(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleAI()}/>
              <button className="aib" onClick={handleAI} disabled={aiLoading}>{aiLoading?"Consulting...":"Analyze →"}</button>
            </div>
            {aiText&&<div className="airesp">{aiText}</div>}
          </div>

          {/* Main Tabs */}
          <div className="ntabs">
            {[["medications","💊 MEDICATIONS"],["calculator","⚖️ PED CALCULATOR"],["sepsis","🔴 SEPSIS PROTOCOL"]].map(([id,label])=>(
              <button key={id} className={`ntab ${tab===id?"on":""}`} onClick={()=>setTab(id)}>{label}</button>
            ))}
          </div>

          {/* MEDICATIONS */}
          {tab==="medications"&&(<>
            <div className="sh">
              <div className="sh-l"><div className="sh-ico">💊</div><span className="sh-ttl">ER MEDICATION REFERENCE</span></div>
              <span className="sh-m">ACEP Guidelines · {filtered.length} medications</span>
            </div>
            <div style={{display:"flex",gap:10,marginBottom:13}}>
              <div className="sw">
                <span style={{color:"var(--tx3)",fontSize:14}}>🔍</span>
                <input placeholder="Search medications, indications, drug codes..." value={search} onChange={e=>setSearch(e.target.value)}/>
                {search&&<span onClick={()=>setSearch("")} style={{cursor:"pointer",color:"var(--tx3)",fontSize:14}}>✕</span>}
              </div>
            </div>
            <div className="fps">
              {CATEGORIES.map(c=>(
                <div key={c.id} className={`fp ${cat===c.id?"on":""}`} style={cat===c.id?{background:c.color,color:"#080e1a"}:{}} onClick={()=>setCat(c.id)}>
                  {c.icon} {c.label}
                </div>
              ))}
            </div>
            <div className="card">
              <div className="chdr">
                <div className="sh-l"><span className="sh-ttl">CLINICAL RECOMMENDATIONS</span></div>
                <span className="sh-m">Evidence-based · Tap row for full details</span>
              </div>
              <div style={{padding:"10px 13px"}}>
                {filtered.length===0?(
                  <div className="empty"><div className="empty-i">🔍</div><div className="empty-t">No medications match your search</div></div>
                ):(
                  <div className="mlist">{filtered.map(med=><MedRow key={med.id} med={med} isExpanded={expanded===med.id} onToggle={()=>setExpanded(expanded===med.id?null:med.id)}/>)}</div>
                )}
              </div>
            </div>
          </>)}

          {/* PEDIATRIC CALCULATOR */}
          {tab==="calculator"&&(<>
            <div className="sh">
              <div className="sh-l"><div className="sh-ico">⚖️</div><span className="sh-ttl">PEDIATRIC MEDICATION CALCULATOR</span></div>
              <span className="sh-m">Weight-based dosing · Broselow · Max dose capping</span>
            </div>
            <div className="card" style={{marginBottom:14}}>
              <div className="chdr"><span className="sh-ttl">PATIENT PARAMETERS</span><span className="sh-m">Enter age or override with actual weight</span></div>
              <div className="cbdy">
                <div className="cinps">
                  <div><label className="ilbl">Age</label><div style={{display:"flex",gap:6}}><input className="inp" type="number" min="0" placeholder="0" value={pedAge} onChange={e=>setPedAge(e.target.value)} style={{flex:1}}/><select className="sel" value={pedUnit} onChange={e=>setPedUnit(e.target.value)} style={{width:90}}><option value="months">months</option><option value="years">years</option></select></div></div>
                  <div><label className="ilbl">Weight (kg) — optional override</label><input className="inp" type="number" min="0" step="0.1" placeholder="Auto-estimated from age" value={pedWt} onChange={e=>setPedWt(e.target.value)}/></div>
                  <div><label className="ilbl">Filter Drug Category</label><select className="sel" value={pedCat} onChange={e=>setPedCat(e.target.value)}><option value="all">All Categories</option>{CATEGORIES.filter(c=>c.id!=="all").map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select></div>
                </div>
                {weight&&bz&&(<>
                  <div className="wbar">
                    <div><div style={{fontSize:10,color:"var(--tx3)",letterSpacing:".08em",marginBottom:2}}>ESTIMATED WEIGHT</div><div style={{display:"flex",alignItems:"baseline",gap:5}}><span className="wv">{weight}</span><span className="wu">kg</span>{!pedWt&&<span className="west">(age-estimated)</span>}</div></div>
                    <div style={{display:"flex",gap:8,marginLeft:16}}>
                      <div className="cstat"><div className="csv" style={{color:"var(--teal)"}}>{weight<3?"2.5":weight<5?"3.0":(Math.round((weight/4+4)*2)/2).toFixed(1)} mm</div><div className="csl">ET TUBE</div></div>
                      <div className="cstat"><div className="csv" style={{color:"var(--yel)"}}>{Math.min(weight*2,120)} J</div><div className="csl">DEFIB 2 J/kg</div></div>
                      <div className="cstat"><div className="csv" style={{color:"var(--pur)"}}>{(weight*0.01).toFixed(2)} mg</div><div className="csl">EPI ARREST</div></div>
                    </div>
                    <div className="bzb" style={{background:bz.hex+"20",color:bz.hex,border:`1px solid ${bz.hex}40`}}>● {bz.zone}</div>
                  </div>
                  <div className="card" style={{background:"var(--c2)"}}>
                    <div className="chdr"><span className="sh-ttl">CALCULATED DOSES — {weight} kg PATIENT</span><span className="sh-m">{pedResults.length} medications</span></div>
                    <div style={{padding:"0 0 8px"}}>
                      <table className="rtbl">
                        <thead><tr><th>MEDICATION</th><th>CATEGORY</th><th>CALCULATED DOSE</th><th>ROUTE</th><th>NOTES</th></tr></thead>
                        <tbody>{pedResults.map(m=>(
                          <tr key={m.id}>
                            <td><div style={{fontWeight:600,fontSize:12}}>{m.name}</div><div style={{fontSize:10,color:"var(--tx3)"}}>{m.code}</div></td>
                            <td><span style={{fontSize:10,padding:"2px 6px",borderRadius:4,background:`${CAT_COLOR[m.category]}15`,color:CAT_COLOR[m.category],border:`1px solid ${CAT_COLOR[m.category]}30`}}>{m.category}</span></td>
                            <td><span className={`rdose ${m.capped?"rcap":""}`}>{m.calcDose}</span>{m.capped&&<span className="rmax"> MAX</span>}</td>
                            <td><span style={{fontFamily:"monospace",fontSize:11,color:"var(--tx2)"}}>{m.ped.route}</span></td>
                            <td style={{fontSize:11,color:"var(--tx2)"}}>{m.ped.notes}</td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                  </div>
                </>)}
                {!weight&&<div className="empty"><div className="empty-i">⚖️</div><div className="empty-t">Enter patient age or weight to calculate doses</div></div>}
              </div>
            </div>
          </>)}

          {/* SEPSIS PROTOCOL */}
          {tab==="sepsis"&&(<>
            <div className="sh">
              <div className="sh-l"><div className="sh-ico" style={{background:"rgba(239,68,68,.1)"}}>🔴</div><span className="sh-ttl">SEPSIS PROTOCOL</span></div>
              <span className="sh-m">SSC 2018 · PHOENIX 2024 · Sepsis-3</span>
            </div>
            <div className="ntabs">
              {[["criteria","📊 Criteria"],["bundle","⏱ Hour-1 Bundle"],["fluids","💧 Fluids"],["antibiotics","💉 Antibiotics"]].map(([id,label])=>(
                <button key={id} className={`ntab ${sepTab===id?"on":""}`} onClick={()=>setSepTab(id)}>{label}</button>
              ))}
            </div>

            {sepTab==="criteria"&&(
              <div className="cgrid">
                {SEPSIS.criteria.map(crit=>(
                  <div className="cc" key={crit.id} style={{borderTop:`3px solid ${crit.color}`}}>
                    <div className="cct">
                      <div className="ccb" style={{background:`${crit.color}15`,color:crit.color,border:`1px solid ${crit.color}30`}}>{crit.badge}</div>
                      <div className="ccl">{crit.label}</div>
                      {crit.desc&&<div className="ccd">{crit.desc}</div>}
                    </div>
                    <div className="ccp">{crit.params.map((p,i)=>(
                      <div className="cprow" key={i}><span className="cpn">{p.name}</span><span className="cpv">{p.value}</span></div>
                    ))}</div>
                  </div>
                ))}
              </div>
            )}

            {sepTab==="bundle"&&(
              <div className="card">
                <div className="chdr">
                  <div className="sh-l"><div className="sh-ico" style={{background:"rgba(245,158,11,.1)"}}>⏱</div><div><div className="sh-ttl">SURVIVING SEPSIS CAMPAIGN — HOUR-1 BUNDLE</div><div style={{fontSize:11,color:"var(--tx3)",marginTop:2}}>All elements initiated within 1 hour of recognition</div></div></div>
                </div>
                <div style={{padding:"13px 15px"}}>
                  <div className="blist">
                    {SEPSIS.bundle.map(s=>(
                      <div key={s.step} className={`bstep ${s.priority}`}>
                        <div className="snum">{s.step}</div>
                        <div style={{flex:1}}><div className="sact">{s.action}</div><div className="sdet">{s.detail}</div></div>
                        <span style={{fontSize:9,fontWeight:700,letterSpacing:".08em",padding:"2px 7px",borderRadius:3,flexShrink:0,background:s.priority==="critical"?"rgba(239,68,68,.12)":"rgba(245,158,11,.12)",color:s.priority==="critical"?"var(--red)":"var(--yel)"}}>{s.priority.toUpperCase()}</span>
                      </div>
                    ))}
                  </div>
                  <div className="ibox" style={{marginTop:12,marginBottom:0}}>
                    <strong>Lactate Targets:</strong> &gt;2 mmol/L = Sepsis · &gt;4 mmol/L = Septic Shock (even if normotensive) · Target ≥10% clearance at 2 hr · Non-clearance → reassess volume, vasopressor dose, source control
                  </div>
                </div>
              </div>
            )}

            {sepTab==="fluids"&&(
              <div className="fgrid">
                <div className="card" style={{borderTop:"3px solid var(--teal)"}}>
                  <div className="chdr"><span className="sh-ttl" style={{color:"var(--teal)"}}>🧑 ADULT RESUSCITATION</span></div>
                  <div className="cbdy">
                    <div className="ibox"><strong>Initial:</strong> {SEPSIS.fluids.adult.initial}<br/><strong>Preferred:</strong> {SEPSIS.fluids.adult.preferred}<br/><strong>Vasopressor:</strong> {SEPSIS.fluids.adult.vasopressor}<br/><strong>⚠</strong> {SEPSIS.fluids.adult.caution}</div>
                    <table className="ft"><thead><tr><th>FLUID</th><th>DOSE</th><th>NOTES</th></tr></thead><tbody>{SEPSIS.fluids.adult.list.map((f,i)=><tr key={i}><td><div className="fn">{f.name}</div></td><td style={{fontFamily:"monospace",fontSize:11}}>{f.dose}</td><td className="fd">{f.note}</td></tr>)}</tbody></table>
                  </div>
                </div>
                <div className="card" style={{borderTop:"3px solid var(--pur)"}}>
                  <div className="chdr"><span className="sh-ttl" style={{color:"var(--pur)"}}>👶 PEDIATRIC RESUSCITATION</span></div>
                  <div className="cbdy">
                    <div className="ibox"><strong>Initial:</strong> {SEPSIS.fluids.pediatric.initial}<br/><strong>Max 1st hr:</strong> {SEPSIS.fluids.pediatric.max}<br/><strong>⚠ FEAST:</strong> {SEPSIS.fluids.pediatric.caution}</div>
                    <div style={{fontSize:10,letterSpacing:".1em",textTransform:"uppercase",color:"var(--tx3)",marginBottom:7}}>AGE-APPROPRIATE BP TARGETS</div>
                    <table className="mtbl"><thead><tr><th>AGE GROUP</th><th>MIN SBP</th><th>TARGET MAP</th></tr></thead><tbody>{SEPSIS.fluids.pediatric.mapTargets.map((t,i)=><tr key={i}><td>{t.age}</td><td style={{fontFamily:"monospace",color:"var(--yel)"}}>≥{t.sbp} mmHg</td><td style={{fontFamily:"monospace",color:"var(--teal)"}}>≥{t.map} mmHg</td></tr>)}</tbody></table>
                  </div>
                </div>
              </div>
            )}

            {sepTab==="antibiotics"&&(<>
              <div className="stabs">
                {[["empiric","Empiric by Severity"],["sources","Source-Directed"],["pediatric","Pediatric"]].map(([id,label])=>(
                  <button key={id} className={`stab ${abxTab===id?"on":""}`} onClick={()=>setAbxTab(id)}>{label}</button>
                ))}
              </div>
              {abxTab==="empiric"&&SEPSIS.antibiotics.empiric.map((r,i)=>(
                <div className="arow" key={i}>
                  <div className="asev"><span style={{width:8,height:8,borderRadius:"50%",background:r.dot,display:"inline-block",flexShrink:0}}/>{r.severity}</div>
                  <div className="abdy"><div><div className="al">PRIMARY REGIMEN</div><div className="ad">{r.primary}</div></div><div><div className="al">ADD-ON COVERAGE</div><div className="aa">{r.addition}</div></div><div><div className="al">NOTES</div><div className="an">{r.notes}</div></div></div>
                </div>
              ))}
              {abxTab==="sources"&&SEPSIS.antibiotics.sources.map((s,i)=>(
                <div className="arow" key={i}>
                  <div className="asev"><span style={{color:"var(--teal)"}}>📍</span>{s.source}</div>
                  <div className="abdy"><div><div className="al">PRIMARY</div><div className="ad">{s.primary}</div></div><div><div className="al">ALTERNATIVE / PCN ALLERGY</div><div className="aa">{s.alt}</div></div><div><div className="al">DURATION</div><div className="an">{s.duration}</div></div></div>
                </div>
              ))}
              {abxTab==="pediatric"&&SEPSIS.antibiotics.pediatric.map((r,i)=>(
                <div className="arow" key={i}>
                  <div className="asev"><span style={{color:"var(--pur)"}}>👶</span>{r.age}</div>
                  <div className="abdy"><div><div className="al">PRIMARY REGIMEN</div><div className="ad">{r.primary}</div></div><div><div className="al">MODIFICATION</div><div className="aa">{r.mod}</div></div><div><div className="al">CLINICAL NOTES</div><div className="an">{r.notes}</div></div></div>
                </div>
              ))}
            </>)}
          </>)}
        </div>
      </div>
    </>
  );
}

function MedRow({med,isExpanded,onToggle}){
  const color = CAT_COLOR[med.category]||"#00c4a0";
  return(<>
    <div className={`mrow ${isExpanded?"ex":""}`} onClick={onToggle}>
      <div className="mdot" style={{background:med.line==="first"?color:"#f59e0b"}}/>
      <div className="mrm">
        <div className="mrn">
          <span className="mcod">{med.code}</span>
          {med.name}
          <span className={`mlb ${med.line==="first"?"l1":"l2"}`}>{med.line==="first"?"1ST LINE":"2ND LINE"}</span>
        </div>
        <div className="mrs">{med.subtitle} · {med.indications.slice(0,3).join(" · ")}</div>
      </div>
      <div className="mrr">
        <span className="dpill">{med.adult_dose.split(";")[0].slice(0,38)}{med.adult_dose.length>38?"…":""}</span>
        <button className="obtn" onClick={e=>{e.stopPropagation();}}>Order →</button>
        <span style={{color:"var(--tx3)",fontSize:11,transform:isExpanded?"rotate(180deg)":"none",transition:"transform .15s"}}>▼</span>
      </div>
    </div>
    {isExpanded&&(
      <div className="mdet">
        <div className="dgrid">
          <div><div className="dlbl">Adult Dose</div><div className="dval tl">{med.adult_dose}</div></div>
          <div><div className="dlbl">Pediatric Dose (weight-based)</div>
            {med.ped?.mgkg?(
              <div className="dval tl">{med.ped.mgkg} {med.ped.unit}/kg {med.ped.route}
                {med.ped.max&&<span style={{color:"var(--yel)",marginLeft:6,fontSize:11}}>max {med.ped.max} {med.ped.unit}</span>}
                <div style={{fontSize:11,color:"var(--tx2)",fontFamily:"inherit",fontWeight:400,marginTop:3}}>{med.ped.notes}</div>
              </div>
            ):<div className="dval" style={{color:"var(--tx2)"}}>{med.ped?.notes||"Adult dosing"}</div>}
          </div>
          <div><div className="dlbl">Onset / Duration</div><div className="dval"><span style={{color:"var(--teal)"}}>{med.onset}</span><span style={{color:"var(--tx3)"}}> → </span>{med.duration}</div>
            {med.reversal&&<><div className="dlbl" style={{marginTop:8}}>Reversal</div><div style={{fontSize:11,color:"var(--pur)",fontFamily:"monospace"}}>{med.reversal}</div></>}
          </div>
        </div>
        <div className="dgrid">
          <div><div className="dlbl">Contraindications</div>{med.contraindications.map((ci,i)=><div key={i} className="cir"><span style={{flexShrink:0}}>✕</span><span>{ci}</span></div>)}</div>
          <div><div className="dlbl">Warnings & Precautions</div>{med.warnings.map((w,i)=><div key={i} className="wr"><span style={{color:"var(--yel)",flexShrink:0}}>⚠</span><span>{w}</span></div>)}</div>
          <div><div className="dlbl">Monitoring Parameters</div>{med.monitoring.map((m,i)=><div key={i} style={{fontSize:11,color:"var(--tx2)",padding:"2px 0",display:"flex",gap:6,alignItems:"center"}}><span style={{color:"var(--teal)",fontSize:8}}>●</span>{m}</div>)}</div>
        </div>
        <div className="rtags">
          <span style={{fontSize:10,color:"var(--tx3)",alignSelf:"center"}}>References:</span>
          {med.refs.map((r,i)=><span key={i} className="rtag">{r}</span>)}
          {med.reversal&&<span className="rvtag">⟲ {med.reversal}</span>}
        </div>
      </div>
    )}
  </>);
}