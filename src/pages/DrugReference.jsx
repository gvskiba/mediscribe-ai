import { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";

// ── STYLES ────────────────────────────────────────────────────────────────────
const G = {
  navy:"#050f1e", slate:"#0b1d35", panel:"#0d2240", edge:"#162d4f",
  border:"#1e3a5f", muted:"#2a4d72", dim:"#4a7299", text:"#c8ddf0",
  bright:"#e8f4ff", teal:"#00d4bc", amber:"#f5a623", red:"#ff5c6c",
  green:"#2ecc71", purple:"#9b6dff", blue:"#4a90d9", rose:"#f472b6",
};

// ── DRUG DATABASE ─────────────────────────────────────────────────────────────
const DRUG_DB = [
  {
    id:"warfarin", name:"Warfarin", brand:"Coumadin, Jantoven", category:"anticoag",
    drugClass:"Vitamin K Antagonist", highAlert:true, pregnancy:"X", color:"#ef4444",
    mechanism:"Inhibits VKORC1, reducing synthesis of clotting factors II, VII, IX, X and proteins C & S. Effect delayed 2–3 days; highly variable (CYP2C9, VKORC1 polymorphisms).",
    indications:"Non-valvular and valvular AF, VTE treatment/prevention, mechanical heart valves, hypercoagulable states.",
    dosing:[
      {indication:"AF / VTE",dose:"2–10 mg PO daily (INR-guided)",route:"PO",duration:"Ongoing",notes:"Target INR 2.0–3.0; 2.5–3.5 for mechanical valve."},
    ],
    renal:[
      {tier:"CrCl ≥60",dose:"Standard",note:""},
      {tier:"CrCl 30–59",dose:"No adjustment",note:"Monitor INR more frequently"},
      {tier:"CrCl 15–29",dose:"Use with caution",note:"Increased bleeding risk"},
      {tier:"CrCl <15 / HD",dose:"Extreme caution",note:"Consider alternatives"},
    ],
    hepatic:"Avoid in severe hepatic impairment. Unpredictable anticoagulation. Monitor INR frequently in mild-moderate disease.",
    contraindications:["Active bleeding","Pregnancy (teratogenic, esp. weeks 6–12)","Non-compliance or inability to monitor INR","Recent intracranial/spinal/ophthalmic surgery","Hypersensitivity"],
    warnings:["Narrow therapeutic index — multiple drug/food interactions","Vitamin K (leafy greens) reduces efficacy","NSAIDs, aspirin, antibiotics increase bleeding","CYP2C9 inhibitors (amiodarone, fluconazole, metronidazole) dramatically raise INR"],
    interactions:["Amiodarone (⚠ Major — doubles INR)","Aspirin (↑ bleeding)","NSAIDs (↑ bleeding)","Metronidazole (↑ INR)","Fluconazole (↑ INR)","Rifampin (↓ INR)","Ciprofloxacin (↑ INR)","Vitamin K foods (↓ INR)"],
    monitoring:"INR q2–4 weeks (stable); more frequent when initiating/changing co-meds. CBC, LFTs at baseline.",
    halfLife:"~40h (range 20–60h)", pb:"99%", renalExc:"92% (inactive metabolites)", ba:"~100% PO", vd:"0.14 L/kg",
  },
  {
    id:"apixaban", name:"Apixaban", brand:"Eliquis", category:"anticoag",
    drugClass:"Direct Xa Inhibitor (DOAC)", highAlert:true, pregnancy:"C", color:"#3b82f6",
    mechanism:"Direct inhibitor of free and prothrombinase-bound factor Xa. No antithrombin cofactor required. No routine INR monitoring needed.",
    indications:"Non-valvular AF, DVT/PE treatment & prevention, post-orthopedic VTE prophylaxis.",
    dosing:[
      {indication:"Non-valvular AF",dose:"5mg BID (2.5mg BID if ≥2 of: age≥80, wt≤60kg, SCr≥1.5)",route:"PO",duration:"Indefinite",notes:"Do NOT use with mechanical valves."},
      {indication:"VTE Treatment",dose:"10mg BID ×7d, then 5mg BID",route:"PO",duration:"≥3–6 months",notes:"Loading phase critical."},
    ],
    renal:[
      {tier:"CrCl ≥50",dose:"Standard dose",note:""},
      {tier:"CrCl 25–49",dose:"No adjustment for AF",note:"Use with caution for VTE"},
      {tier:"CrCl <25",dose:"2.5mg BID if 2 criteria met",note:"Limited data <CrCl 15"},
      {tier:"HD",dose:"2.5mg BID (limited data)",note:"NOT dialyzable"},
    ],
    hepatic:"Avoid severe (Child-Pugh C). Caution moderate. No adjustment mild (Child-Pugh A).",
    contraindications:["Active bleeding","Mechanical heart valves","Moderate-severe mitral stenosis","Pregnancy","Severe hypersensitivity"],
    warnings:["No routine monitoring; anti-Xa levels if needed","Reversal: Andexanet alfa or 4-factor PCC","Avoid strong dual CYP3A4/P-gp inhibitors (ketoconazole, ritonavir)","Avoid strong CYP3A4/P-gp inducers (rifampin, carbamazepine)"],
    interactions:["Rifampin (↓ levels significantly)","Ketoconazole (↑ levels — avoid)","Ritonavir / HIV PIs (↑ levels)","NSAIDs/aspirin (↑ bleeding)","P-gp/CYP3A4 inhibitors (↑ levels)"],
    monitoring:"No routine INR. Anti-Xa (apixaban-calibrated) if assessing drug effect. BMP, renal function annually.",
    halfLife:"~12h", pb:"87%", renalExc:"~27%", ba:"~50% PO", vd:"21 L",
  },
  {
    id:"amiodarone", name:"Amiodarone", brand:"Cordarone, Pacerone", category:"cardiac",
    drugClass:"Class III Antiarrhythmic", highAlert:true, pregnancy:"D", color:"#f97316",
    mechanism:"Prolongs action potential and refractory period. Also has Class I (Na+), Class II (β-block), and Class IV (Ca2+) effects. Highly lipophilic; enormous Vd.",
    indications:"VT/VF, AF rate/rhythm control (refractory), ACLS cardiac arrest.",
    dosing:[
      {indication:"VF / Pulseless VT (ACLS)",dose:"300mg IV push, then 150mg IV ×1",route:"IV",duration:"Arrest doses",notes:"Dilute in D5W."},
      {indication:"Stable VT (IV load)",dose:"150mg over 10 min, then 1mg/min ×6h, then 0.5mg/min",route:"IV",duration:"24h then oral",notes:"Monitor for hypotension."},
      {indication:"AF / Maintenance",dose:"Load 400–800mg/day ×1–3 wk; Maintenance 100–400mg/day",route:"PO",duration:"Lifelong typically",notes:"Lowest effective maintenance dose."},
    ],
    renal:[
      {tier:"All levels",dose:"No adjustment",note:"Not significantly renally eliminated"},
    ],
    hepatic:"Use with caution — amiodarone causes hepatotoxicity itself. Monitor LFTs q6 months. Dose reduction in severe hepatic disease.",
    contraindications:["Sinus bradycardia / SA block (without pacemaker)","2nd/3rd-degree AV block (without pacemaker)","Cardiogenic shock","Iodine/amiodarone hypersensitivity"],
    warnings:["⚠ Pulmonary toxicity — can be fatal","⚠ Thyroid dysfunction (37% iodine by weight)","⚠ Hepatotoxicity","⚠ Corneal microdeposits; rare optic neuropathy","Doubles INR on warfarin — reduce warfarin 30–50%","Increases digoxin levels 2×","QT prolongation","Half-life 40–55 days — interactions persist months after stopping"],
    interactions:["Warfarin (⚠ Critical — doubles INR)","Digoxin (↑ levels 2×)","Statins (↑ myopathy risk — cap atorvastatin 20mg)","Diltiazem/verapamil (↑ bradycardia)","Beta-blockers (↑ bradycardia)","Fluoroquinolones (QT prolongation)","QT-prolonging drugs"],
    monitoring:"CXR, PFTs at baseline & annually. TFTs q6 mo. LFTs q6 mo. Ophthalmology annually. ECG (QTc).",
    halfLife:"40–55 days", pb:"96%", renalExc:"<1% (biliary/fecal)", ba:"22–86% PO (variable)", vd:"60 L/kg",
  },
  {
    id:"metoprolol", name:"Metoprolol", brand:"Lopressor (tartrate), Toprol-XL (succinate)", category:"cardiac",
    drugClass:"Cardioselective β1-Blocker", highAlert:false, pregnancy:"C", color:"#4a90d9",
    mechanism:"Selective competitive antagonist of β1-adrenergic receptors. Reduces HR, contractility, CO, and BP. Decreases renin release.",
    indications:"Hypertension, stable angina, HFrEF (succinate), MI, AF rate control, hyperthyroidism.",
    dosing:[
      {indication:"HTN / Angina",dose:"Tartrate: 50–100mg BID; Succinate: 25–200mg daily",route:"PO",duration:"Ongoing",notes:"Titrate q2 weeks as tolerated."},
      {indication:"HFrEF",dose:"Succinate: Start 12.5–25mg daily; max 200mg",route:"PO",duration:"Ongoing",notes:"Must be euvolemic first. Start low, titrate slowly."},
      {indication:"AF rate / STEMI",dose:"2.5–5mg IV q5 min ×up to 3 doses",route:"IV",duration:"Then oral",notes:"Monitor HR and BP closely."},
    ],
    renal:[
      {tier:"All CrCl levels",dose:"No adjustment",note:"Primarily hepatic metabolism"},
    ],
    hepatic:"Reduce dose in severe hepatic impairment. Consider starting at 50% of usual dose.",
    contraindications:["Severe bradycardia (HR <45–50)","High-degree AV block without pacemaker","Decompensated heart failure (acute)","Sick sinus syndrome without pacemaker"],
    warnings:["Never abruptly discontinue — rebound HTN, angina, MI","Masks hypoglycemia in diabetics (except sweating)","Caution in COPD/asthma — not truly β1-selective at high doses","May worsen peripheral vascular disease"],
    interactions:["Amiodarone (↑ bradycardia/AV block)","Diltiazem/verapamil (↑ bradycardia — avoid)","Clonidine (rebound HTN if clonidine stopped first)","Insulin (masks hypoglycemia)","NSAIDs (↓ antihypertensive effect)"],
    monitoring:"HR, BP, respiratory status. ECG if symptomatic. Glucose in diabetics.",
    halfLife:"3–7h", pb:"12%", renalExc:"3–10%", ba:"~50% PO (first-pass)", vd:"5.6 L/kg",
  },
  {
    id:"lisinopril", name:"Lisinopril", brand:"Prinivil, Zestril", category:"cardiac",
    drugClass:"ACE Inhibitor", highAlert:false, pregnancy:"D", color:"#22c55e",
    mechanism:"Inhibits ACE, preventing angiotensin I→II conversion. Reduces vasoconstriction and aldosterone secretion. Inhibits bradykinin degradation → cough/angioedema.",
    indications:"Hypertension, HFrEF, post-MI cardioprotection, diabetic nephropathy.",
    dosing:[
      {indication:"Hypertension",dose:"Start 5–10mg daily; usual 10–40mg",route:"PO",duration:"Ongoing",notes:"Max 80mg/day."},
      {indication:"HFrEF",dose:"Start 2.5–5mg daily; titrate to 20–40mg",route:"PO",duration:"Ongoing",notes:"Target 20–40mg per HF guidelines."},
    ],
    renal:[
      {tier:"CrCl ≥30",dose:"Standard dose",note:""},
      {tier:"CrCl 10–29",dose:"Start 2.5–5mg daily; max 40mg",note:"Reduce starting dose"},
      {tier:"CrCl <10 / HD",dose:"Start 2.5mg daily",note:"~50% removed by HD; supplement after"},
    ],
    hepatic:"Not hepatically metabolized (excreted unchanged renally). No hepatic adjustment needed. Monitor for hypotension.",
    contraindications:["Prior ACE inhibitor angioedema","Aliskiren in diabetics (concurrent)","Bilateral renal artery stenosis","Pregnancy (2nd/3rd trimester — category D)","Severe hyperkalemia"],
    warnings:["Angioedema — life-threatening; more common in Black patients","Dry cough (~15%) — switch to ARB if intolerable","Hyperkalemia with K-sparing diuretics / K+ supplements","AKI in volume-depleted patients","Avoid ACE + ARB dual blockade"],
    interactions:["NSAIDs (↑ AKI, ↓ antihypertensive effect)","K-sparing diuretics / K+ supplements (hyperkalemia)","Aliskiren in diabetics (contraindicated)","Lithium (↑ lithium levels)","ARBs (dual blockade — avoid)"],
    monitoring:"BMP at baseline, 1 week, 1 month after start or dose change. BP. Cough assessment.",
    halfLife:"12h", pb:"<10%", renalExc:"100% (unchanged)", ba:"~25% PO", vd:"~0.5 L/kg",
  },
  {
    id:"metformin", name:"Metformin", brand:"Glucophage, Fortamet, Riomet", category:"other",
    drugClass:"Biguanide Antidiabetic", highAlert:false, pregnancy:"B", color:"#a855f7",
    mechanism:"Decreases hepatic glucose production (primary mechanism), improves insulin sensitivity, reduces intestinal glucose absorption. Does NOT stimulate insulin secretion — no monotherapy hypoglycemia.",
    indications:"Type 2 DM (first-line), prediabetes, PCOS (off-label).",
    dosing:[
      {indication:"Type 2 DM (IR)",dose:"Start 500mg BID or 850mg daily; titrate to 1000mg BID",route:"PO",duration:"Ongoing",notes:"Take with meals. Max 2550mg/day."},
      {indication:"Type 2 DM (ER)",dose:"Start 500–1000mg daily; max 2000–2500mg",route:"PO",duration:"Ongoing",notes:"Evening meal preferred. Fewer GI effects."},
    ],
    renal:[
      {tier:"eGFR ≥45",dose:"Standard dose",note:"Continue without adjustment"},
      {tier:"eGFR 30–44",dose:"Continue; reassess risk/benefit",note:"Consider reducing dose"},
      {tier:"eGFR <30",dose:"CONTRAINDICATED",note:"Lactic acidosis risk"},
      {tier:"HD",dose:"CONTRAINDICATED",note:"Lactic acidosis risk"},
    ],
    hepatic:"Avoid in hepatic impairment — impaired lactate clearance → lactic acidosis. Check LFTs; if ≥3× ULN, avoid.",
    contraindications:["eGFR <30 mL/min","Active hepatic disease or elevated LFTs","IV contrast (hold 48h before; restart after SCr confirmed stable)","Sepsis/shock — tissue hypoxia","Excessive alcohol","Type 1 DM"],
    warnings:["Lactic acidosis — rare but potentially fatal","HOLD before IV contrast (48h) and major surgery (resume when eating + renal function confirmed)","GI side effects — reduce with food and slow titration","Vitamin B12 deficiency long-term — check annually"],
    interactions:["Iodinated contrast (hold 48h — lactic acidosis)","Alcohol (↑ lactic acidosis)","Cimetidine (↑ metformin levels)","Topiramate/zonisamide (↑ acidosis risk)"],
    monitoring:"eGFR at baseline, annually. HbA1c q3–6 mo. Vitamin B12 annually. LFTs at baseline.",
    halfLife:"6.2h (plasma)", pb:"Negligible", renalExc:"90% (unchanged)", ba:"50–60% PO", vd:"654 L",
  },
  {
    id:"digoxin", name:"Digoxin", brand:"Lanoxin", category:"cardiac",
    drugClass:"Cardiac Glycoside", highAlert:true, pregnancy:"C", color:"#f472b6",
    mechanism:"Inhibits Na+/K+-ATPase → ↑ intracellular Ca2+ → positive inotropy. Increases vagal tone → slows AV conduction. Narrow therapeutic index.",
    indications:"HFrEF (adjunct), AF rate control.",
    dosing:[
      {indication:"HF / AF Rate Control",dose:"0.125–0.25mg PO daily (0.0625mg in elderly/low weight)",route:"PO",duration:"Ongoing",notes:"Target level 0.5–0.9 ng/mL. Higher levels do NOT improve outcomes."},
    ],
    renal:[
      {tier:"CrCl ≥50",dose:"Standard dose",note:"Monitor levels"},
      {tier:"CrCl 30–49",dose:"0.125mg daily or q48h",note:"Adjust per levels"},
      {tier:"CrCl <30",dose:"0.0625mg daily or q48h",note:"Monitor closely"},
      {tier:"HD",dose:"0.0625mg q48h (not dialyzable)",note:"No supplement needed after HD"},
    ],
    hepatic:"No hepatic adjustment — primarily renally eliminated.",
    contraindications:["Ventricular fibrillation","Active digoxin toxicity","2nd/3rd-degree AV block without pacemaker","WPW syndrome"],
    warnings:["Narrow therapeutic index — toxicity at >2 ng/mL","Toxicity: nausea, vomiting, visual halos (yellow-green), bradycardia, arrhythmias","Hypokalemia/hypomagnesemia markedly ↑ toxicity — keep K+ ≥3.5","Amiodarone increases digoxin 2× — reduce dose 50%"],
    interactions:["Amiodarone (↑ levels 2× — critical)","Quinidine (↑ levels 2×)","Verapamil/diltiazem (↑ levels, ↓ HR)","Loop/thiazide diuretics (↑ toxicity via hypokalemia)","Cholestyramine/antacids (↓ absorption)"],
    monitoring:"Digoxin level (target 0.5–0.9 ng/mL HF; 0.8–2.0 AF) — draw 6–8h post-dose. BMP (K+, Mg2+, Cr). ECG.",
    halfLife:"36–48h", pb:"25%", renalExc:"60–80%", ba:"60–80% PO", vd:"7 L/kg",
  },
  {
    id:"furosemide", name:"Furosemide", brand:"Lasix", category:"cardiac",
    drugClass:"Loop Diuretic", highAlert:false, pregnancy:"C", color:"#eab308",
    mechanism:"Inhibits NKCC2 cotransporter in the thick ascending limb of the Loop of Henle, blocking reabsorption of Na+, K+, Cl-. Potent diuresis; also venodilatory in acute pulmonary edema.",
    indications:"Edema (HF, cirrhosis, nephrotic syndrome), acute pulmonary edema, hypertension, hypercalcemia.",
    dosing:[
      {indication:"Acute Pulmonary Edema",dose:"20–40mg IV (or 2× oral dose if on chronic furosemide)",route:"IV",duration:"Single dose; repeat in 2h if inadequate",notes:"Onset 5 min IV, 60 min PO."},
      {indication:"Chronic HF Edema",dose:"20–80mg PO daily or BID",route:"PO/IV",duration:"Ongoing; titrate",notes:"IV:PO conversion ~1:2."},
    ],
    renal:[
      {tier:"CrCl ≥50",dose:"Standard dose",note:""},
      {tier:"CrCl 30–49",dose:"40–80mg per dose",note:"Reduced tubular secretion requires higher doses"},
      {tier:"CrCl <30",dose:"80–160mg per dose",note:"High resistance common — may need infusion"},
      {tier:"HD",dose:"Not removed by HD; dose after dialysis",note:"High doses often needed"},
    ],
    hepatic:"Caution in cirrhosis — electrolyte disturbances may trigger hepatic encephalopathy. Start low; add aldactone for synergy.",
    contraindications:["Anuria / complete renal failure","Sulfonamide hypersensitivity (rare cross-reactivity)","Hepatic coma / severe electrolyte depletion"],
    warnings:["Electrolyte depletion — hypokalemia, hypomagnesemia, hyponatremia","Ototoxicity — rapid IV infusion >4mg/min or concurrent aminoglycosides","Volume depletion, orthostatic hypotension","Increases digoxin toxicity via hypokalemia","Thiamine depletion with long-term use"],
    interactions:["Digoxin (hypokalemia → ↑ toxicity)","Aminoglycosides (additive ototoxicity)","NSAIDs (↓ efficacy, ↑ AKI)","Lithium (↑ levels/toxicity)","Antihypertensives (additive hypotension)"],
    monitoring:"BMP (K+, Mg2+, Na+, Cr) regularly. Daily weights in HF. I&O if inpatient. BP.",
    halfLife:"~2h", pb:"91–99%", renalExc:"66–75%", ba:"47–64% PO (variable in HF)", vd:"0.15 L/kg",
  },
  {
    id:"atorvastatin", name:"Atorvastatin", brand:"Lipitor", category:"cardiac",
    drugClass:"HMG-CoA Reductase Inhibitor (Statin)", highAlert:false, pregnancy:"X", color:"#06b6d4",
    mechanism:"Competitive inhibitor of HMG-CoA reductase (rate-limiting step in cholesterol synthesis). Upregulates LDL receptors. Anti-inflammatory/pleiotropic vascular effects.",
    indications:"Hypercholesterolemia, ASCVD primary/secondary prevention, familial hypercholesterolemia.",
    dosing:[
      {indication:"Primary Prevention / Hyperlipidemia",dose:"10–80mg PO daily",route:"PO",duration:"Ongoing",notes:"Max 80mg; take any time of day."},
      {indication:"High-Intensity (ASCVD / post-ACS)",dose:"40–80mg PO daily",route:"PO",duration:"Ongoing",notes:"High-intensity preferred for established CVD."},
    ],
    renal:[{tier:"All CrCl levels",dose:"No adjustment",note:"Primarily hepatic elimination"}],
    hepatic:"Contraindicated in active liver disease or persistent LFT elevation ≥3× ULN. Caution in heavy alcohol use.",
    contraindications:["Active liver disease or unexplained LFT ≥3× ULN","Pregnancy / breastfeeding (category X)","Strong CYP3A4 inhibitors with high doses"],
    warnings:["Myopathy/rhabdomyolysis — ↑ with high doses, fibrates (esp. gemfibrozil), cyclosporine, CYP3A4 inhibitors","New-onset T2DM — modest risk","LFT elevations — check baseline","Amiodarone interaction — caps atorvastatin at 20mg"],
    interactions:["Amiodarone (↑ levels — cap at 20mg)","Cyclosporine (↑ levels — cap at 10mg)","Gemfibrozil (↑ myopathy — avoid)","Diltiazem/verapamil (↑ levels)","Ketoconazole/itraconazole (↑ levels)","Rifampin (↓ levels)","Grapefruit juice (↑ levels)"],
    monitoring:"Lipids at 4–12 weeks, then annually. LFTs at baseline. CK if myalgia. HbA1c.",
    halfLife:"14h (metabolites ~20–30h)", pb:"≥98%", renalExc:"<2%", ba:"12% PO (first-pass)", vd:"381 L",
  },
  {
    id:"vancomycin", name:"Vancomycin", brand:"Vancocin", category:"abx",
    drugClass:"Glycopeptide Antibiotic", highAlert:true, pregnancy:"B", color:"#8b5cf6",
    mechanism:"Inhibits cell wall synthesis by binding D-Ala-D-Ala terminus of peptidoglycan precursors, preventing cross-linking. Active against gram-positives including MRSA.",
    indications:"MRSA bacteremia/endocarditis/SSTI/osteomyelitis/pneumonia, serious gram-positive infections, C. diff (oral only).",
    dosing:[
      {indication:"MRSA Bacteremia / Endocarditis",dose:"25–30 mg/kg/day IV divided q8–12h; AUC/MIC target 400–600",route:"IV",duration:"14–28+ days",notes:"AUC-guided dosing preferred over trough-only."},
      {indication:"C. diff (oral only)",dose:"125–500mg PO QID ×10 days",route:"PO",duration:"10 days",notes:"NOT absorbed. IV vanco does NOT treat C. diff."},
    ],
    renal:[
      {tier:"CrCl ≥50",dose:"15–20 mg/kg q8–12h",note:"AUC/trough monitoring"},
      {tier:"CrCl 25–49",dose:"15–20 mg/kg q24h",note:"Adjust interval; monitor levels"},
      {tier:"CrCl <25",dose:"15–20 mg/kg loading; then level-guided",note:"Extend interval to 24–72h"},
      {tier:"HD",dose:"15–25 mg/kg post-HD session",note:"Level-guided re-dosing"},
    ],
    hepatic:"No hepatic adjustment. Primarily renally eliminated.",
    contraindications:["True hypersensitivity (not red man syndrome — infusion-related, not allergic)"],
    warnings:["Nephrotoxicity — ↑ with aminoglycosides, NSAIDs, contrast","Ototoxicity with prolonged high levels","Red man syndrome — slow infusion rate; premedicate","Must infuse over ≥60 min","AUC-guided dosing preferred — trough-only being phased out"],
    interactions:["Aminoglycosides (↑ nephrotoxicity)","NSAIDs (↑ nephrotoxicity)","Loop diuretics (↑ ototoxicity)","Contrast agents (↑ nephrotoxicity)"],
    monitoring:"AUC/MIC target 400–600 (or trough 10–20 if traditional). SCr q2–3 days. CBC.",
    halfLife:"4–8h", pb:"10–55%", renalExc:"80–90%", ba:"~0% PO", vd:"0.7 L/kg",
  },
  {
    id:"azithromycin", name:"Azithromycin", brand:"Zithromax, Z-Pak", category:"abx",
    drugClass:"Macrolide Antibiotic", highAlert:false, pregnancy:"B", color:"#10b981",
    mechanism:"Binds 50S ribosomal subunit, inhibiting bacterial protein synthesis. Bacteriostatic. Excellent intracellular penetration — effective against atypicals.",
    indications:"CAP (atypical coverage), sinusitis/bronchitis, pharyngitis (PCN allergy), chlamydia, MAC prophylaxis.",
    dosing:[
      {indication:"CAP (outpatient atypical)",dose:"500mg day 1, then 250mg days 2–5",route:"PO",duration:"5 days (Z-Pak)",notes:"Plus beta-lactam for full CAP coverage."},
      {indication:"Chlamydia",dose:"1g PO × 1 dose",route:"PO",duration:"Single dose",notes:""},
    ],
    renal:[{tier:"All CrCl levels",dose:"No adjustment",note:"Primarily biliary/fecal elimination"}],
    hepatic:"Caution in severe hepatic impairment — primarily biliary. Avoid in severe cholestatic jaundice.",
    contraindications:["Cholestatic jaundice/hepatic dysfunction with prior azithromycin use","QT prolongation history","Known hypersensitivity"],
    warnings:["QT prolongation — ↑ with hypokalemia, hypomagnesemia, other QT-prolonging drugs","Hepatotoxicity — cholestatic jaundice (rare)","Exacerbation of myasthenia gravis","Resistance concerns for CAP (Strep pneumo)"],
    interactions:["QT-prolonging drugs (amiodarone, FQs, antipsychotics)","Warfarin (↑ INR)","Digoxin (↑ levels — P-gp inhibition)","Colchicine (↑ toxicity)"],
    monitoring:"ECG if QT concerns. LFTs if prolonged use. No routine drug level monitoring.",
    halfLife:"68h (tissue t½ much longer)", pb:"7–51%", renalExc:"6%", ba:"37% PO", vd:"31 L/kg",
  },
  {
    id:"lorazepam", name:"Lorazepam", brand:"Ativan", category:"psych",
    drugClass:"Benzodiazepine (Schedule IV)", highAlert:true, pregnancy:"D", color:"#ec4899",
    mechanism:"Enhances GABAergic inhibition via GABA-A receptors, increasing chloride channel opening frequency. Results in anxiolysis, sedation, anticonvulsant, muscle relaxant effects.",
    indications:"Anxiety, status epilepticus (IV preferred), procedural sedation, alcohol withdrawal, agitation.",
    dosing:[
      {indication:"Anxiety / Sedation",dose:"0.5–2mg PO/IV/IM q6–8h PRN",route:"PO/IV/IM",duration:"Short-term preferred",notes:"Lower doses in elderly."},
      {indication:"Status Epilepticus",dose:"0.05–0.1 mg/kg IV (max 4mg/dose); may repeat ×1",route:"IV",duration:"Single doses; follow with AED",notes:"Onset 2–3 min IV; duration 4–8h."},
    ],
    renal:[{tier:"All CrCl levels",dose:"No adjustment",note:"Glucuronide metabolites may accumulate in severe CKD"}],
    hepatic:"Phase II glucuronidation (not CYP-dependent) — preferred BZD in hepatic impairment. Reduce dose in severe disease.",
    contraindications:["Acute narrow-angle glaucoma","Severe respiratory depression (without resuscitation)","Pre-existing CNS depression","Hypersensitivity to benzodiazepines"],
    warnings:["Respiratory depression — have flumazenil/reversal available","Physical dependence — do NOT abruptly discontinue","Paradoxical excitation in elderly/children","Additive CNS depression with opioids, alcohol","Avoid in elderly (Beers Criteria)"],
    interactions:["Opioids (↑ respiratory depression — FDA boxed warning)","CNS depressants/alcohol (additive sedation)","Probenecid/valproate (↑ lorazepam levels)","Clozapine (additive respiratory/CV depression)"],
    monitoring:"Respiratory rate, O2 sat when giving IV. Sedation score. CIWA score for alcohol withdrawal.",
    halfLife:"10–20h", pb:"85–90%", renalExc:"75%", ba:"85–90% PO, ~90% IM", vd:"0.8–1.3 L/kg",
  },
  {
    id:"lithium", name:"Lithium", brand:"Lithobid, Eskalith", category:"psych",
    drugClass:"Mood Stabilizer", highAlert:true, pregnancy:"D", color:"#7c3aed",
    mechanism:"Modulates neurotransmitter systems; inhibits inositol monophosphatase; affects GSK-3β signal transduction. Narrow therapeutic index. Entirely renally eliminated (unchanged).",
    indications:"Bipolar disorder (mania + maintenance), treatment-resistant depression augmentation, cluster headache prevention.",
    dosing:[
      {indication:"Bipolar Acute Mania",dose:"900–1800mg/day PO divided TID (IR) or BID (ER)",route:"PO",duration:"Target 0.8–1.2 mEq/L",notes:"Draw level 12h after last dose."},
      {indication:"Bipolar Maintenance",dose:"600–1200mg/day PO",route:"PO",duration:"Indefinite; target 0.6–0.8 mEq/L",notes:""},
    ],
    renal:[
      {tier:"CrCl ≥60",dose:"Standard dose",note:"Monitor levels closely"},
      {tier:"CrCl 30–59",dose:"Reduce 25–50%",note:"Monitor q3–6 months"},
      {tier:"CrCl <30",dose:"Avoid or extreme caution; reduce 50–75%",note:"Entirely renally eliminated"},
      {tier:"HD",dose:"Give post-dialysis only; 300–600mg post-HD",note:"HD removes lithium — redose after each session"},
    ],
    hepatic:"No hepatic adjustment — not hepatically metabolized.",
    contraindications:["Severe renal impairment (CrCl <30)","Severe cardiovascular disease (SSS, AV block)","Severe sodium depletion","Pregnancy (cardiac malformations, Ebstein anomaly risk)"],
    warnings:["Narrow therapeutic index — toxicity >1.5 mEq/L (tremor, confusion, polyuria) and >2.0 (seizures, coma)","Dehydration, low-salt diets, NSAIDs, ACEi, thiazide diuretics ↑ levels → toxicity","Hypothyroidism in up to 40% long-term","Nephrogenic diabetes insipidus (polyuria/polydipsia)"],
    interactions:["NSAIDs (↑ levels — toxicity risk)","ACE inhibitors/ARBs (↑ levels significantly)","Thiazide diuretics (↑ levels)","Carbamazepine (↑ neurotoxicity without elevated levels)","Ibuprofen/naproxen (↑ levels — use acetaminophen instead)"],
    monitoring:"Lithium level (12h post-dose) q3–6 months. BMP (Na+, Cr, eGFR). TSH q6–12 months. Calcium. Weight.",
    halfLife:"18–36h", pb:"0%", renalExc:"95% (unchanged)", ba:"~100% PO", vd:"0.7–1.0 L/kg",
  },
  {
    id:"ondansetron", name:"Ondansetron", brand:"Zofran", category:"gi",
    drugClass:"5-HT3 Receptor Antagonist (Antiemetic)", highAlert:false, pregnancy:"B", color:"#0ea5e9",
    mechanism:"Selective serotonin 5-HT3 receptor antagonist. Blocks serotonin in vagal nerve terminals and chemoreceptor trigger zone, suppressing nausea/vomiting signals.",
    indications:"Chemotherapy-induced, post-operative, and general nausea/vomiting.",
    dosing:[
      {indication:"Post-op / Acute Nausea",dose:"4mg IV or 4–8mg PO/ODT",route:"IV/PO",duration:"q8h PRN",notes:"ODT dissolves under tongue — no water needed."},
      {indication:"Chemo-Induced",dose:"8–24mg PO/IV divided daily",route:"IV/PO",duration:"Per chemo protocol",notes:""},
    ],
    renal:[{tier:"All CrCl levels",dose:"No adjustment",note:""}],
    hepatic:"Max 8mg/day in severe hepatic impairment (Child-Pugh C). No adjustment mild-moderate.",
    contraindications:["Congenital long QT","Concurrent apomorphine","Hypersensitivity"],
    warnings:["QT prolongation — especially IV route >32mg","Serotonin syndrome — rare, with serotonergic drugs","Constipation common","Headache"],
    interactions:["QT-prolonging drugs (additive)","SSRIs/SNRIs/MAOIs (serotonin syndrome)","Apomorphine (severe hypotension — contraindicated)","Carbamazepine/phenytoin (↓ ondansetron levels)"],
    monitoring:"ECG if QT concern. No routine monitoring.",
    halfLife:"3–5h (normal)", pb:"70–76%", renalExc:"5%", ba:"56–60% PO", vd:"1.9 L/kg",
  },
];

const CAT_COLORS = {
  cardiac:"#ef4444", anticoag:"#3b82f6", abx:"#10b981",
  analgesic:"#f97316", psych:"#ec4899", gi:"#0ea5e9", other:"#a855f7",
};
const CAT_LABELS = {
  all:"All", cardiac:"❤️ Cardiac", anticoag:"🩸 Anticoag",
  abx:"🧬 Antibiotics", analgesic:"💊 Analgesic", psych:"🧠 Psych",
  gi:"🫃 GI", other:"⚙️ Other",
};

const PROC_RULES = {
  colonoscopy:{
    hold:["Metformin — hold day before (dehydration + bowel prep → lactic acidosis risk)","Anticoagulants (warfarin, apixaban, rivaroxaban) — hold per proceduralist based on VTE risk","Iron supplements — interfere with bowel prep","Fiber supplements / psyllium","GLP-1 agonists (semaglutide, liraglutide) — delay gastric emptying, ↑ aspiration risk"],
    caution:["Aspirin 81mg — discuss; typically continue for low polyp risk","NSAIDs — hold 5–7 days if high bleed concern","Diuretics — monitor hydration during prep"],
    cont:["Antihypertensives (ACEi, ARBs, beta-blockers, CCBs)","Statins","Thyroid medications","Antidepressants (SSRIs, SNRIs)"],
  },
  surgery_major:{
    hold:["Anticoagulants (warfarin, DOACs) — hold 3–7 days; bridge if high VTE risk","Antiplatelet agents (clopidogrel — hold 5–7 days)","Metformin — hold day of surgery and 48h after if contrast used","SGLT2 inhibitors — hold 3–4 days (DKA risk)","NSAIDs — hold 7 days","MAOIs — hold 2 weeks (serotonin/hypertensive crisis)","GLP-1 agonists — hold 1 week (daily) or 2 weeks (weekly) — aspiration risk"],
    caution:["ACE inhibitors / ARBs — some anesthesiologists hold morning of (hypotension risk)","Diuretics — hold morning of if concern for hypovolemia","Insulin / oral hypoglycemics — dose adjustment required day of surgery"],
    cont:["Cardiac medications (digoxin, amiodarone, statins)","Antiepileptics (continue — seizure risk)","SSRIs (continue)","Corticosteroids (continue + stress dosing if chronic)","Thyroid medications","Beta-blockers (continue — do NOT hold)"],
  },
  cardiac_cath:{
    hold:["Metformin — hold 48h before if contrast; restart when SCr stable","NSAIDs — hold 7 days"],
    caution:["Anticoagulants — discuss with interventionalist","P2Y12 inhibitors — discuss hold/continue based on indication","Diuretics — hold morning of if volume depletion concern"],
    cont:["Antihypertensives","Statins (especially if ACS)","Aspirin (usually continue for PCI)","Beta-blockers (do NOT hold)","Nitroglycerin / nitrates"],
  },
  epidural:{
    hold:["LMWH — hold 12–24h before","UFH IV — hold 4–6h","DOACs — hold 2–5 days","Clopidogrel — hold 7 days","Ticagrelor — hold 5 days","NSAIDs — hold 7 days for high-dose"],
    caution:["Aspirin 81mg — discuss with anesthesiologist (many continue for neuraxial)","SSRIs — mild antiplatelet effect; generally continue but note"],
    cont:["Antihypertensives","Cardiac medications","Antiepileptics","Opioids (taper plan if chronic)"],
  },
  ct_contrast:{
    hold:["Metformin — hold 48h before contrast (lactic acidosis risk if contrast causes AKI)","NSAIDs same day (nephrotoxicity)"],
    caution:["Renally cleared drugs in CKD — consider dose timing","Nephrotoxic combinations (aminoglycosides, vancomycin)"],
    cont:["Most medications","Hydration — encourage adequate fluids before and after"],
  },
  dental:{
    hold:["Anticoagulants — confirm INR ≤3.0 (warfarin); DOACs may hold 1 dose for invasive procedures"],
    caution:["Bisphosphonates — risk of osteonecrosis of jaw; inform dentist","Anticoagulants for simple extractions — often continue with local hemostasis"],
    cont:["Most medications (dental procedures have low systemic bleed risk)","Antihypertensives","Diabetes medications (take with normal meals)"],
  },
};

const SEV = {
  critical:{ color:G.red,   label:"Critical" },
  major:   { color:G.amber, label:"Major"    },
  moderate:{ color:G.blue,  label:"Moderate" },
  minor:   { color:G.green, label:"Minor"    },
};
const TYPE_STYLE = {
  interaction:{ bg:"rgba(255,92,108,.12)", border:"rgba(255,92,108,.3)", color:G.red },
  allergy:    { bg:"rgba(244,114,182,.12)",border:"rgba(244,114,182,.3)",color:G.rose },
  guideline:  { bg:"rgba(155,109,255,.12)",border:"rgba(155,109,255,.3)",color:G.purple },
  duplicate:  { bg:"rgba(74,144,217,.1)",  border:"rgba(74,144,217,.3)", color:G.blue },
  renal:      { bg:"rgba(245,166,35,.1)",  border:"rgba(245,166,35,.3)", color:G.amber },
};

function calculateWeightBasedDose(doseString, weight, unit) {
  if (!weight || weight <= 0) return null;
  const wt = unit === "lbs" ? weight / 2.205 : weight;
  const match = doseString.match(/(\d+(?:\.\d+)?)\s*(?:mg|mcg|g)?\/\s*kg/i);
  if (!match) return null;
  const dosePerKg = parseFloat(match[1]);
  const calculatedDose = (dosePerKg * wt).toFixed(1);
  return `${calculatedDose} ${doseString.match(/(mg|mcg|g)\//i)?.[1] || "mg"}`;
}

function ruleBasedScan(meds, allergies) {
  const ml = meds.map(m => m.toLowerCase());
  const has = n => ml.some(m => m.includes(n.toLowerCase()));
  const findings = [];

  if (has("warfarin") && has("amiodarone")) findings.push({ type:"interaction", severity:"critical", title:"Warfarin + Amiodarone", drugs:["Warfarin","Amiodarone"], description:"Amiodarone inhibits CYP2C9 and CYP3A4, significantly increasing warfarin levels and INR. Can double the INR within 1–2 weeks.", mechanism:"CYP2C9 and CYP3A4 inhibition reduces warfarin metabolism.", recommendation:"Reduce warfarin 30–50% when starting amiodarone. Monitor INR every 3–5 days until stable. Effect persists months after stopping amiodarone." });
  if (has("warfarin") && has("aspirin")) findings.push({ type:"interaction", severity:"major", title:"Warfarin + Aspirin", drugs:["Warfarin","Aspirin"], description:"Combined anticoagulant/antiplatelet use increases bleeding risk. Aspirin irritates GI mucosa.", mechanism:"Additive hemorrhagic risk; antiplatelet effect + mucosal damage.", recommendation:"Avoid unless specifically indicated (e.g., mechanical heart valve). If necessary, use lowest aspirin dose + PPI." });
  if (has("digoxin") && has("amiodarone")) findings.push({ type:"interaction", severity:"critical", title:"Digoxin + Amiodarone", drugs:["Digoxin","Amiodarone"], description:"Amiodarone doubles digoxin serum levels via P-gp inhibition and reduced renal clearance. Risk of digoxin toxicity.", mechanism:"P-gp inhibition + reduced renal clearance.", recommendation:"Reduce digoxin dose by 50% when starting amiodarone. Monitor digoxin levels and for signs of toxicity." });
  if (has("digoxin") && has("furosemide")) findings.push({ type:"interaction", severity:"major", title:"Digoxin + Furosemide (Hypokalemia)", drugs:["Digoxin","Furosemide"], description:"Loop diuretics cause K+/Mg2+ wasting, dramatically increasing digoxin toxicity risk even at normal levels.", mechanism:"Hypokalemia/hypomagnesemia increases myocardial digoxin binding.", recommendation:"Monitor electrolytes regularly. Supplement K+ to keep ≥3.5 mEq/L. Check digoxin levels periodically." });
  if (has("amiodarone") && (has("atorvastatin") || has("statin") || has("simvastatin"))) findings.push({ type:"interaction", severity:"major", title:"Amiodarone + Statin (Myopathy)", drugs:["Amiodarone","Statin"], description:"Amiodarone inhibits CYP3A4, increasing statin blood levels and risk of myopathy/rhabdomyolysis.", mechanism:"CYP3A4 inhibition increases statin AUC.", recommendation:"Cap atorvastatin at 20mg/day with amiodarone. Avoid simvastatin >10mg. Switch to rosuvastatin if higher doses needed." });
  if (has("lorazepam") && (has("morphine") || has("oxycodone") || has("fentanyl") || has("hydromorphone") || has("opioid"))) findings.push({ type:"interaction", severity:"critical", title:"Benzodiazepine + Opioid", drugs:["Lorazepam","Opioid"], description:"Combined CNS depression significantly increases risk of respiratory depression, sedation, and death. FDA black box warning.", mechanism:"Additive CNS/respiratory depression via GABA-A and mu-opioid receptors.", recommendation:"Avoid unless clearly indicated. Use lowest doses. Monitor O2 sat continuously. Have naloxone available." });
  if (has("lithium") && (has("ibuprofen") || has("naproxen") || has("nsaid"))) findings.push({ type:"interaction", severity:"major", title:"Lithium + NSAID (Toxicity Risk)", drugs:["Lithium","NSAID"], description:"NSAIDs reduce renal lithium clearance, increasing levels and risk of toxicity.", mechanism:"NSAID inhibition of prostaglandins reduces renal lithium excretion.", recommendation:"Avoid NSAIDs with lithium. Use acetaminophen for pain. Monitor lithium levels if NSAID unavoidable." });
  if (has("metformin")) findings.push({ type:"guideline", severity:"moderate", title:"Metformin — Hold Before Contrast / Surgery", drugs:["Metformin"], description:"Must be held before IV contrast and major surgery to prevent lactic acidosis.", mechanism:"AKI impairs metformin renal clearance → lactic acidosis.", recommendation:"Hold 48h before IV contrast. Hold day of surgery. Restart when SCr confirmed stable and patient eating." });

  allergies.forEach(allergy => {
    const al = allergy.toLowerCase();
    if (al.includes("pcn") || al.includes("penicillin")) {
      meds.forEach(med => {
        if (med.toLowerCase().includes("amoxicillin") || med.toLowerCase().includes("ampicillin")) {
          findings.push({ type:"allergy", severity:"critical", title:`PCN Allergy — ${med}`, drugs:[med], description:`Patient has documented penicillin allergy. ${med} is a penicillin antibiotic.`, mechanism:"IgE or T-cell mediated hypersensitivity.", recommendation:"Contraindicated. Use alternative based on indication (azithromycin, cephalosporin with caution, or FQ depending on indication)." });
        }
      });
    }
    if (al.includes("sulfa") || al.includes("sulfonamide")) {
      meds.forEach(med => {
        if (med.toLowerCase().includes("trimethoprim") || med.toLowerCase().includes("bactrim") || med.toLowerCase().includes("tmp")) {
          findings.push({ type:"allergy", severity:"critical", title:`Sulfa Allergy — ${med}`, drugs:[med], description:`Patient has documented sulfonamide allergy. ${med} contains a sulfonamide.`, mechanism:"Sulfonamide IgE or T-cell hypersensitivity.", recommendation:"Contraindicated. Consider nitrofurantoin or fosfomycin for UTI." });
        }
      });
    }
  });

  if (!findings.length) findings.push({ type:"guideline", severity:"minor", title:"No Major Interactions Detected", drugs:[], description:"No clinically significant interactions identified in this medication list using built-in rule-based checks.", mechanism:"", recommendation:"This does not replace full pharmacy review. Consider pharmacist consultation for complex regimens." });
  return findings;
}

function parseMedList(text) {
  if (!text.trim()) return [];
  return [...new Set(
    text.split(/[\n,;]+/)
      .map(m => m.trim())
      .filter(m => m.length > 1)
      .map(m => m.replace(/\s+\d+(\.\d+)?\s*(mg|mcg|g|mEq|units?|iu|ml|tablet|tab|cap|puff|patch).*$/i, "").trim())
      .filter(Boolean)
  )];
}

export default function DrugReference() {
  const [selectedDrug, setSelectedDrug]   = useState(null);
  const [searchQ, setSearchQ]             = useState("");
  const [activeCat, setActiveCat]         = useState("all");
  const [recentDrugs, setRecentDrugs]     = useState([]);
  const [activeTab, setActiveTab]         = useState("scanner");
  const [medListText, setMedListText]     = useState("");
  const [allergies, setAllergies]         = useState([]);
  const [allergyInput, setAllergyInput]   = useState("");
  const [scanResults, setScanResults]     = useState(null);
  const [scanning, setScanning]           = useState(false);
  const [procType, setProcType]           = useState("");
  const [procMeds, setProcMeds]           = useState("");
  const [procResults, setProcResults]     = useState(null);
  const [detailModal, setDetailModal]     = useState(null);
  const [procNoteModal, setProcNoteModal] = useState(false);
  const [procNote, setProcNote]           = useState("");
  const [patientWeight, setPatientWeight] = useState("");
  const [weightUnit, setWeightUnit]       = useState("kg");
  const [toast, setToast]                 = useState(null);

  const toastTimer = useRef(null);

  const showToast = useCallback((msg, color = G.teal) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, color });
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  const filteredDrugs = DRUG_DB.filter(d => {
    const matchCat = activeCat === "all" || d.category === activeCat;
    const q = searchQ.toLowerCase();
    const matchQ = !q || d.name.toLowerCase().includes(q) || d.brand.toLowerCase().includes(q) || d.drugClass.toLowerCase().includes(q) || d.indications.toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  const parsedMeds = parseMedList(medListText);

  function selectDrug(drug) {
    setSelectedDrug(drug);
    setRecentDrugs(prev => [drug, ...prev.filter(d => d.id !== drug.id)].slice(0, 6));
  }

  function addToScanner(name) {
    setMedListText(prev => prev.trim() ? prev.trim() + "\n" + name : name);
    setActiveTab("scanner");
    showToast(name + " added to scanner", G.purple);
  }

  function addAllergy() {
    const v = allergyInput.trim();
    if (v && !allergies.includes(v)) { setAllergies(prev => [...prev, v]); }
    setAllergyInput("");
  }

  async function runScan() {
    if (parsedMeds.length < 2) { showToast("Enter at least 2 medications", G.amber); return; }
    setScanning(true);
    setScanResults(null);

    const allergyStr = allergies.length ? `\nKnown Allergies: ${allergies.join(", ")}` : "";
    const prompt = `You are Notrya AI, a clinical pharmacology expert. Analyze this patient medication list for: drug-drug interactions, allergy conflicts, guideline deviations, duplicate classes, and renal/hepatic concerns.

Medication List:
${parsedMeds.join("\n")}${allergyStr}

Return ONLY a valid JSON array. Each object must have exactly these fields:
- type: "interaction" | "allergy" | "guideline" | "duplicate" | "renal"
- severity: "critical" | "major" | "moderate" | "minor"
- title: string (e.g., "Warfarin + Amiodarone")
- drugs: string array of involved drugs
- description: string (1–2 sentences on the clinical problem)
- mechanism: string (brief mechanism)
- recommendation: string (clear clinical action)

No markdown, no code fences, raw JSON array only.`;

    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            findings: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string" },
                  severity: { type: "string" },
                  title: { type: "string" },
                  drugs: { type: "array", items: { type: "string" } },
                  description: { type: "string" },
                  mechanism: { type: "string" },
                  recommendation: { type: "string" },
                }
              }
            }
          }
        }
      });
      setScanResults({ meds: parsedMeds, findings: res.findings || [] });
    } catch {
      setScanResults({ meds: parsedMeds, findings: ruleBasedScan(parsedMeds, allergies) });
      showToast("AI unavailable — rule-based scan applied", G.amber);
    }
    setScanning(false);
  }

  function runProcRecon() {
    const rules = PROC_RULES[procType];
    if (!rules) { setProcResults(null); return; }
    const meds = parseMedList(procMeds || medListText);
    const match = (list) => meds.length
      ? list.filter(r => meds.some(m => r.toLowerCase().includes(m.toLowerCase().split(" ")[0])))
      : list;
    const hold    = match(rules.hold);
    const caution = match(rules.caution);
    const cont    = match(rules.cont);
    setProcResults({ hold, caution, cont, meds, procType });
    const names = { colonoscopy:"Colonoscopy / Endoscopy", surgery_major:"Major Surgery (General Anesthesia)", cardiac_cath:"Cardiac Catheterization", epidural:"Neuraxial / Epidural Block", ct_contrast:"CT with Contrast", dental:"Dental Procedure" };
    const today = new Date().toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"});
    setProcNote(`PRE-PROCEDURE MEDICATION RECONCILIATION
Procedure: ${names[procType] || procType}
Date: ${today}

CURRENT MEDICATION LIST:
${procMeds || medListText || "See medication reconciliation in chart"}

MEDICATION MANAGEMENT PLAN:

HOLD BEFORE PROCEDURE:
${hold.length ? hold.map(r => "• " + r).join("\n") : "• No medications held"}

DISCUSS / CAUTION:
${caution.length ? caution.map(r => "• " + r).join("\n") : "• None identified"}

CONTINUE AS SCHEDULED:
${cont.length ? cont.map(r => "• " + r).join("\n") : "• All other medications — continue as prescribed"}

NOTES:
Generated by Notrya AI Pre-Procedure Reconciliation. Confirm with proceduralist and anesthesiologist as appropriate.`);
  }

  async function copyNote() {
    try { await navigator.clipboard.writeText(procNote); showToast("Note copied to clipboard ✓"); }
    catch { showToast("Copy failed — select text manually", G.red); }
  }

  const S = {
    root:{ fontFamily:"'DM Sans',system-ui,sans-serif", background:G.navy, color:G.text },
    ph:{ position:"relative", zIndex:1, padding:"16px 28px 12px", borderBottom:`1px solid rgba(30,58,95,.6)`, background:"rgba(11,29,53,.4)", display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, flexWrap:"wrap" },
    phIcon:{ width:46, height:46, background:"rgba(74,144,217,.1)", border:`1px solid rgba(74,144,217,.25)`, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 },
    phTitle:{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:22, fontWeight:700, color:G.bright },
    btn:(bg,color="#fff",border="transparent")=>({ padding:"8px 16px", borderRadius:8, fontFamily:"inherit", fontSize:12.5, fontWeight:700, cursor:"pointer", display:"inline-flex", alignItems:"center", gap:6, border:`1px solid ${border}`, background:bg, color, whiteSpace:"nowrap" }),
    mainLayout:{ position:"relative", zIndex:1, display:"grid", gridTemplateColumns:"280px 1fr 360px", flex:1, minHeight:0 },
    leftPanel:{ borderRight:`1px solid ${G.border}`, background:"rgba(11,29,53,.3)", display:"flex", flexDirection:"column", overflow:"hidden" },
    centerPanel:{ overflowY:"auto", background:"rgba(5,10,20,.3)", display:"flex", flexDirection:"column", minHeight:0 },
    rightPanel:{ borderLeft:`1px solid ${G.border}`, background:"rgba(11,29,53,.3)", display:"flex", flexDirection:"column", overflow:"hidden", minHeight:0 },
    panelHeading:{ padding:"10px 16px 8px", fontFamily:"'Playfair Display',Georgia,serif", fontSize:13, fontWeight:700, color:G.bright, borderBottom:`1px solid rgba(30,58,95,.4)`, background:"rgba(11,29,53,.5)", display:"flex", alignItems:"center", gap:7, flexShrink:0 },
    searchWrap:{ padding:12, borderBottom:`1px solid rgba(30,58,95,.5)` },
    searchInput:{ width:"100%", background:"rgba(22,45,79,.8)", border:`1px solid ${G.border}`, borderRadius:9, padding:"9px 11px 9px 34px", fontFamily:"inherit", fontSize:13, color:G.bright, outline:"none" },
    catPillsRow:{ display:"flex", flexWrap:"wrap", gap:5, padding:"10px 12px", borderBottom:`1px solid rgba(30,58,95,.4)` },
    catPill:(active)=>({ fontSize:10.5, fontWeight:700, padding:"4px 10px", borderRadius:20, border:`1px solid ${active ? G.teal : G.border}`, background:active ? "rgba(0,212,188,.08)" : "transparent", color:active ? G.bright : G.dim, cursor:"pointer", fontFamily:"inherit" }),
    drugList:{ flex:1, overflowY:"auto", padding:8 },
    dli:(active)=>({ display:"flex", alignItems:"center", gap:10, padding:"9px 11px", borderRadius:9, cursor:"pointer", border:`1px solid ${active ? "rgba(0,212,188,.25)" : "transparent"}`, background:active ? "rgba(0,212,188,.07)" : "transparent", marginBottom:2 }),
    recentSection:{ borderTop:`1px solid ${G.border}`, flexShrink:0 },
    recentChip:{ fontSize:11, fontWeight:600, padding:"4px 10px", borderRadius:20, background:"rgba(22,45,79,.6)", border:`1px solid ${G.border}`, color:G.dim, cursor:"pointer", fontFamily:"inherit" },
    emptyState:{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:14, padding:40, textAlign:"center", opacity:.6 },
    ddSection:{ background:G.panel, border:`1px solid ${G.border}`, borderRadius:13, overflow:"hidden" },
    ddSectionHeader:{ padding:"11px 16px", background:"rgba(22,45,79,.4)", borderBottom:`1px solid rgba(30,58,95,.5)`, display:"flex", alignItems:"center", gap:8 },
    ddSectionTitle:{ fontWeight:800, fontSize:12.5, color:G.bright, textTransform:"uppercase", letterSpacing:".05em" },
    infoBlock:{ background:"rgba(11,29,53,.5)", borderRadius:9, padding:"11px 13px", border:`1px solid rgba(30,58,95,.5)` },
    infoBlockLabel:{ fontSize:9.5, fontWeight:800, textTransform:"uppercase", letterSpacing:".08em", color:G.dim, marginBottom:5 },
    table:{ width:"100%", borderCollapse:"collapse", fontSize:12.5 },
    th:{ padding:"8px 12px", textAlign:"left", fontSize:10, fontWeight:800, textTransform:"uppercase", letterSpacing:".07em", color:G.dim, background:"rgba(22,45,79,.5)", borderBottom:`1px solid ${G.border}` },
    td:{ padding:"9px 12px", borderBottom:`1px solid rgba(30,58,95,.35)`, verticalAlign:"top", color:G.text, fontSize:12.5 },
    intBadge:(major)=>({ fontSize:11, fontWeight:700, padding:"3px 9px", borderRadius:8, border:`1px solid ${major ? "rgba(255,92,108,.4)" : "rgba(245,166,35,.35)"}`, background:major ? "rgba(255,92,108,.12)" : "rgba(245,166,35,.1)", color:major ? G.red : G.amber, cursor:"pointer", fontFamily:"inherit", marginRight:5, marginBottom:5, display:"inline-block" }),
    checkerTabs:{ display:"flex", borderBottom:`1px solid ${G.border}`, background:"rgba(11,29,53,.7)" },
    checkerTab:(active)=>({ flex:1, padding:"11px 6px", fontSize:11.5, fontWeight:700, textAlign:"center", cursor:"pointer", border:"none", background:"transparent", color:active ? G.bright : G.dim, fontFamily:"inherit", borderBottom:`2px solid ${active ? G.purple : "transparent"}` }),
    ciTextarea:{ width:"100%", background:"rgba(22,45,79,.7)", border:`1px solid ${G.border}`, borderRadius:9, padding:"10px 12px", fontFamily:"inherit", fontSize:12.5, color:G.bright, outline:"none", resize:"none", lineHeight:1.7 },
    resultCard:{ background:G.panel, border:`1px solid ${G.border}`, borderRadius:11, overflow:"hidden", marginBottom:8, cursor:"pointer" },
    rcHeader:{ padding:"10px 13px", borderBottom:`1px solid rgba(30,58,95,.4)`, display:"flex", alignItems:"center", gap:8 },
    typeBadge:(type)=>({ fontSize:9.5, fontWeight:800, padding:"3px 8px", borderRadius:8, border:`1px solid ${TYPE_STYLE[type]?.border||G.border}`, background:TYPE_STYLE[type]?.bg||"transparent", color:TYPE_STYLE[type]?.color||G.dim, textTransform:"uppercase", letterSpacing:".05em" }),
    allergyChip:{ fontSize:10.5, fontWeight:700, padding:"3px 8px", borderRadius:20, background:"rgba(255,92,108,.12)", border:`1px solid rgba(255,92,108,.3)`, color:G.red, display:"inline-flex", alignItems:"center", gap:5 },
    procItem:(type)=>({ padding:"10px 12px", borderRadius:9, fontSize:12, lineHeight:1.6, display:"flex", gap:8, marginBottom:5, background:type==="hold"?"rgba(255,92,108,.08)":type==="caution"?"rgba(245,166,35,.08)":"rgba(46,204,113,.07)", border:`1px solid ${type==="hold"?"rgba(255,92,108,.2)":type==="caution"?"rgba(245,166,35,.2)":"rgba(46,204,113,.2)"}`, color:type==="hold"?G.red:type==="caution"?G.amber:G.green }),
    overlay:{ position:"fixed", inset:0, background:"rgba(0,0,0,.72)", backdropFilter:"blur(8px)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center" },
    modal:(wide)=>({ background:G.slate, border:`1px solid ${G.border}`, borderRadius:18, width:wide?760:580, maxHeight:"88vh", overflowY:"auto" }),
    modalHeader:{ padding:"18px 22px 14px", borderBottom:`1px solid ${G.border}`, display:"flex", alignItems:"center", gap:10 },
    modalTitle:{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:18, fontWeight:700, color:G.bright, flex:1 },
    modalFooter:{ padding:"14px 22px", borderTop:`1px solid ${G.border}`, display:"flex", gap:8, justifyContent:"flex-end" },
    actionBar:{ position:"sticky", bottom:0, zIndex:10, height:60, background:"rgba(11,29,53,.97)", borderTop:`1px solid ${G.border}`, backdropFilter:"blur(16px)", padding:"0 28px", display:"flex", alignItems:"center", gap:12 },
    summaryBar:{ background:"rgba(22,45,79,.5)", border:`1px solid ${G.border}`, borderRadius:10, padding:"12px 14px", marginBottom:10, display:"flex", gap:16, alignItems:"center", flexWrap:"wrap" },
    statNum:(color)=>({ fontFamily:"'JetBrains Mono',monospace", fontSize:22, fontWeight:700, color, lineHeight:1 }),
    statLabel:{ fontSize:9.5, textTransform:"uppercase", letterSpacing:".06em", color:G.dim, fontWeight:700, marginTop:2 },
    shimmer:{ height:14, borderRadius:4, background:`linear-gradient(90deg,${G.edge} 25%,${G.muted} 50%,${G.edge} 75%)`, backgroundSize:"200% 100%", animation:"shimmerMove 1.4s infinite", marginBottom:8 },
    toastEl:(color)=>({ background:G.panel, border:`1px solid ${G.border}`, borderLeft:`3px solid ${color}`, borderRadius:10, padding:"11px 16px", fontSize:12.5, fontWeight:600, color:G.bright, boxShadow:"0 8px 24px rgba(0,0,0,.3)" }),
  };

  function DrugDetail({ drug }) {
    const color = drug.color || CAT_COLORS[drug.category] || G.dim;
    const wt = weightUnit === "lbs" ? parseFloat(patientWeight) / 2.205 : parseFloat(patientWeight);
    return (
      <div style={{ padding:24, display:"flex", flexDirection:"column", gap:18 }}>
        {patientWeight && (
          <div style={{ background:"rgba(0,212,188,.12)", border:"1px solid rgba(0,212,188,.3)", borderRadius:10, padding:"12px 14px" }}>
            <div style={{ fontSize:10, fontWeight:800, textTransform:"uppercase", letterSpacing:".08em", color:G.teal, marginBottom:6 }}>⚖️ Weight-Based Dosing</div>
            <div style={{ fontSize:13, color:G.bright }}>Patient Weight: {patientWeight} {weightUnit} ({wt.toFixed(1)} kg)</div>
          </div>
        )}
        <div style={{ display:"flex", alignItems:"flex-start", gap:14 }}>
          <div style={{ width:52, height:52, borderRadius:14, background:`${color}18`, border:`1px solid ${color}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, flexShrink:0 }}>💊</div>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:26, fontWeight:700, color:G.bright, lineHeight:1.1 }}>{drug.name}</div>
            <div style={{ fontSize:13, color:G.dim, marginTop:3 }}>{drug.brand}</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginTop:8 }}>
              <span style={{ fontSize:10.5, fontWeight:700, padding:"3px 9px", borderRadius:8, background:"rgba(74,144,217,.1)", border:"1px solid rgba(74,144,217,.25)", color:G.blue }}>{drug.drugClass}</span>
              {drug.highAlert && <span style={{ fontSize:10.5, fontWeight:700, padding:"3px 9px", borderRadius:8, background:"rgba(255,92,108,.12)", border:"1px solid rgba(255,92,108,.3)", color:G.red }}>⚡ High Alert</span>}
              {drug.pregnancy && <span style={{ fontSize:10.5, fontWeight:700, padding:"3px 9px", borderRadius:8, background:"rgba(244,114,182,.1)", border:"1px solid rgba(244,114,182,.3)", color:G.rose }}>Pregnancy {drug.pregnancy}</span>}
            </div>
          </div>
          <button style={S.btn("rgba(155,109,255,.1)",G.purple,"rgba(155,109,255,.3)")} onClick={() => addToScanner(drug.name)}>＋ Add to Scanner</button>
        </div>

        <div style={S.ddSection}>
          <div style={S.ddSectionHeader}><span>⚗️</span><span style={S.ddSectionTitle}>Mechanism of Action</span></div>
          <div style={{ padding:"14px 16px", fontSize:13, color:G.text, lineHeight:1.8 }}>{drug.mechanism}</div>
        </div>

        <div style={S.ddSection}>
          <div style={S.ddSectionHeader}><span>💊</span><span style={S.ddSectionTitle}>Dosing by Indication</span></div>
          <table style={S.table}>
            <thead><tr><th style={S.th}>Indication</th><th style={S.th}>Dose</th>{patientWeight && <th style={S.th}>Calculated</th>}<th style={S.th}>Route</th><th style={S.th}>Duration</th><th style={S.th}>Notes</th></tr></thead>
            <tbody>{drug.dosing.map((d,i) => {
              const calcDose = patientWeight ? calculateWeightBasedDose(d.dose, parseFloat(patientWeight), weightUnit) : null;
              return (
              <tr key={i}>
                <td style={{ ...S.td, fontWeight:700, color:G.bright }}>{d.indication}</td>
                <td style={{ ...S.td, fontFamily:"'JetBrains Mono',monospace", color:G.teal, fontSize:12 }}>{d.dose}</td>
                {patientWeight && <td style={{ ...S.td, fontFamily:"'JetBrains Mono',monospace", color:G.green, fontSize:12, fontWeight:600 }}>{calcDose || "—"}</td>}
                <td style={{ ...S.td, fontSize:11 }}>{d.route}</td>
                <td style={{ ...S.td, fontSize:11, color:G.dim }}>{d.duration}</td>
                <td style={{ ...S.td, fontSize:11, color:G.muted }}>{d.notes}</td>
              </tr>
            )})}
            </tbody>
          </table>
        </div>

        <div style={S.ddSection}>
          <div style={S.ddSectionHeader}><span>🫘</span><span style={S.ddSectionTitle}>Renal Dose Adjustments</span></div>
          <table style={S.table}>
            <thead><tr><th style={S.th}>Renal Function</th><th style={S.th}>Adjustment</th><th style={S.th}>Notes</th></tr></thead>
            <tbody>{drug.renal.map((r,i) => (
              <tr key={i}>
                <td style={{ ...S.td, fontWeight:700, color:G.bright, fontSize:12 }}>{r.tier}</td>
                <td style={{ ...S.td, fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:r.dose.toLowerCase().includes("contraindicated")||r.dose.toLowerCase().includes("avoid")?G.red:r.dose.toLowerCase().includes("reduce")||r.dose.toLowerCase().includes("caution")?G.amber:G.teal, fontWeight:600 }}>{r.dose}</td>
                <td style={{ ...S.td, fontSize:11, color:G.dim }}>{r.note}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>

        <div style={S.ddSection}>
          <div style={S.ddSectionHeader}><span>🍋</span><span style={S.ddSectionTitle}>Hepatic Considerations</span></div>
          <div style={{ padding:"14px 16px", fontSize:12.5, color:G.text, lineHeight:1.75 }}>{drug.hepatic}</div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <div style={S.ddSection}>
            <div style={S.ddSectionHeader}><span>🚫</span><span style={S.ddSectionTitle}>Contraindications &amp; Warnings</span></div>
            <div style={{ padding:"14px 16px" }}>
              {drug.contraindications.map((c,i) => (
                <div key={i} style={{ display:"flex", gap:8, fontSize:12.5, color:G.text, lineHeight:1.5, marginBottom:5 }}>
                  <span style={{ color:G.red, fontWeight:800, flexShrink:0, fontSize:11, marginTop:2 }}>✕</span>{c}
                </div>
              ))}
              {drug.warnings.map((w,i) => (
                <div key={i} style={{ display:"flex", gap:8, fontSize:12.5, color:G.text, lineHeight:1.5, marginBottom:5 }}>
                  <span style={{ color:G.amber, flexShrink:0, fontSize:11, marginTop:2 }}>⚠</span>{w}
                </div>
              ))}
            </div>
          </div>
          <div style={S.ddSection}>
            <div style={S.ddSectionHeader}><span>⚡</span><span style={S.ddSectionTitle}>Key Interactions</span></div>
            <div style={{ padding:"14px 16px" }}>
              <div style={{ display:"flex", flexWrap:"wrap" }}>
                {drug.interactions.map((inter,i) => {
                  const isMajor = inter.includes("⚠") || inter.toLowerCase().includes("major") || inter.toLowerCase().includes("critical");
                  return (
                    <button key={i} style={S.intBadge(isMajor)} onClick={() => setDetailModal({ type:"interaction", severity:isMajor?"major":"moderate", title:`${drug.name} + ${inter.split("(")[0].trim()}`, drugs:[drug.name, inter.split("(")[0].trim()], description:`See AI Scanner for a full analysis of this interaction with ${inter.split("(")[0].trim()}.`, mechanism:inter.includes("(") ? inter.split("(")[1].replace(")","") : "", recommendation:`Add both drugs to the AI Scanner tab for a comprehensive real-time interaction analysis.` })}>
                      {inter.split("(")[0].trim()}
                    </button>
                  );
                })}
              </div>
              <div style={{ fontSize:11, color:G.muted, marginTop:8 }}>Click any drug to view detail</div>
            </div>
          </div>
        </div>

        <div style={S.ddSection}>
          <div style={S.ddSectionHeader}><span>📊</span><span style={S.ddSectionTitle}>Pharmacokinetics</span></div>
          <div style={{ padding:"14px 16px" }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[["Half-life",drug.halfLife],["Protein Binding",drug.pb],["Bioavailability",drug.ba],["Volume of Dist.",drug.vd],["Renal Excretion",drug.renalExc,"span"]].map(([label,val,span]) => (
                <div key={label} style={{ ...S.infoBlock, ...(span?{gridColumn:"span 2"}:{}) }}>
                  <div style={S.infoBlockLabel}>{label}</div>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", color:G.teal, fontSize:12 }}>{val||"—"}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {drug.monitoring && (
          <div style={S.ddSection}>
            <div style={S.ddSectionHeader}><span>🔬</span><span style={S.ddSectionTitle}>Monitoring Parameters</span></div>
            <div style={{ padding:"14px 16px", fontSize:12.5, color:G.text, lineHeight:1.75 }}>{drug.monitoring}</div>
          </div>
        )}
      </div>
    );
  }

  function ScanResults({ data }) {
    const sortOrder = { critical:0, major:1, moderate:2, minor:3 };
    const sorted = [...data.findings].sort((a,b) => (sortOrder[a.severity]||3)-(sortOrder[b.severity]||3));
    const crit = data.findings.filter(f=>f.severity==="critical").length;
    const maj  = data.findings.filter(f=>f.severity==="major").length;
    const mod  = data.findings.filter(f=>f.severity==="moderate"||f.severity==="minor").length;

    return (
      <div>
        <div style={S.summaryBar}>
          <div style={{ textAlign:"center" }}><div style={S.statNum(G.teal)}>{data.meds.length}</div><div style={S.statLabel}>Meds Scanned</div></div>
          <div style={{ textAlign:"center" }}><div style={S.statNum(G.red)}>{crit}</div><div style={S.statLabel}>Critical</div></div>
          <div style={{ textAlign:"center" }}><div style={S.statNum(G.amber)}>{maj}</div><div style={S.statLabel}>Major</div></div>
          <div style={{ textAlign:"center" }}><div style={S.statNum(G.blue)}>{mod}</div><div style={S.statLabel}>Moderate</div></div>
        </div>
        {sorted.map((f,i) => (
          <div key={i} style={S.resultCard} onClick={() => setDetailModal(f)}>
            <div style={S.rcHeader}>
              <div style={{ width:4, height:32, borderRadius:2, background:SEV[f.severity]?.color||G.dim, flexShrink:0 }}/>
              <div style={{ fontWeight:700, fontSize:13, color:G.bright, flex:1 }}>{f.title}</div>
              <span style={S.typeBadge(f.type)}>{f.type}</span>
            </div>
            <div style={{ padding:"10px 13px", fontSize:12, color:G.text, lineHeight:1.65 }}>
              <div>{f.description}</div>
              {f.mechanism && <div style={{ fontSize:11.5, color:G.dim, marginTop:5, paddingTop:5, borderTop:`1px solid rgba(30,58,95,.3)` }}>⚗️ {f.mechanism}</div>}
              {f.recommendation && <div style={{ fontSize:11.5, color:G.green, fontWeight:600, marginTop:6, display:"flex", gap:6 }}><span>→</span><span>{f.recommendation}</span></div>}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={S.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#2a4d72;border-radius:2px}
        textarea:focus,input:focus,select:focus{outline:none;border-color:#00d4bc!important}
        @keyframes shimmerMove{to{background-position:-200% 0}}
        .drug-list-item:hover{background:rgba(22,45,79,.6)!important;border-color:rgba(30,58,95,.6)!important}
        .action-btn:hover{opacity:.85}
        .recent-chip:hover{color:#e8f4ff;border-color:#2a4d72}
        select option{background:#0d2240;color:#c8ddf0}
      `}</style>

      {/* PAGE HEADER */}
      <div style={S.ph}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <button onClick={() => window.location.href = window.location.href.replace(/\/[^/]*$/, '/DrugsBugs')} style={{ padding:"8px 14px", borderRadius:8, fontSize:12, fontWeight:700, cursor:"pointer", background:"transparent", border:`1px solid ${G.border}`, color:G.dim, display:"flex", alignItems:"center", gap:6 }}>← Back to Drugs & Bugs</button>
          <div style={S.phIcon}>💊</div>
          <div>
            <div style={S.phTitle}>Drug Reference &amp; Interactions</div>
            <div style={{ fontSize:12, color:G.dim, marginTop:2 }}>Dosing · Mechanism · Contraindications · Renal/Hepatic · AI Bulk Interaction Scan · Procedure Reconciliation</div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ padding:"6px 14px", borderRadius:20, fontSize:11.5, fontWeight:700, background:"rgba(74,144,217,.1)", border:"1px solid rgba(74,144,217,.25)", color:G.blue }}>📚 {DRUG_DB.length} Drugs</span>
          <span style={{ padding:"6px 14px", borderRadius:20, fontSize:11.5, fontWeight:700, background:"rgba(155,109,255,.1)", border:"1px solid rgba(155,109,255,.25)", color:G.purple }}>✦ AI-Powered Scan</span>
          <button className="action-btn" style={{ ...S.btn("transparent",G.text,G.border) }} onClick={()=>{setActiveTab("proc");setProcMeds(medListText);}}>🔗 Pre-Procedure</button>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div style={{ ...S.mainLayout, flex:1, overflowY:"auto" }}>

        {/* LEFT: DRUG LIST */}
        <div style={S.leftPanel}>
          <div style={S.searchWrap}>
            <div style={{ position:"relative" }}>
              <span style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", fontSize:14, color:G.dim, pointerEvents:"none" }}>🔍</span>
              <input style={S.searchInput} placeholder="Search medications…" value={searchQ} onChange={e=>setSearchQ(e.target.value)}/>
            </div>
          </div>
          <div style={S.catPillsRow}>
            {Object.entries(CAT_LABELS).map(([k,label])=>(
              <button key={k} style={S.catPill(activeCat===k)} onClick={()=>setActiveCat(k)}>{label}</button>
            ))}
          </div>
          <div style={S.drugList}>
            {filteredDrugs.length === 0 && <div style={{ padding:24, textAlign:"center", color:G.muted, fontSize:12.5 }}>No results for "{searchQ}"</div>}
            {filteredDrugs.map(drug=>(
              <div key={drug.id} style={S.dli(selectedDrug?.id===drug.id)} className="drug-list-item" onClick={()=>selectDrug(drug)}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:drug.color||CAT_COLORS[drug.category]||G.dim, flexShrink:0 }}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:12.5, color:G.bright, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{drug.name}</div>
                  <div style={{ fontSize:10.5, color:G.dim, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{drug.drugClass.split("(")[0].trim()}</div>
                </div>
                {drug.highAlert && <span style={{ fontSize:9.5, fontWeight:700, padding:"2px 7px", borderRadius:8, background:"rgba(255,92,108,.15)", border:"1px solid rgba(255,92,108,.3)", color:G.red, flexShrink:0 }}>High Alert</span>}
              </div>
            ))}
          </div>
          <div style={S.recentSection}>
            <div style={S.panelHeading}>🕐 Recent</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:5, padding:"8px 12px 10px" }}>
              {recentDrugs.length === 0 && <span style={{ fontSize:11, color:G.muted }}>No recent searches</span>}
              {recentDrugs.map(d=>(
                <button key={d.id} className="recent-chip" style={S.recentChip} onClick={()=>selectDrug(d)}>{d.name}</button>
              ))}
            </div>
          </div>
        </div>

        {/* CENTER: DRUG DETAIL */}
        <div style={S.centerPanel}>
          {!selectedDrug && (
            <div style={S.emptyState}>
              <div style={{ fontSize:52 }}>💊</div>
              <div style={{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:22, color:G.dim }}>Select a medication</div>
              <div style={{ fontSize:13, color:G.muted, maxWidth:320, lineHeight:1.7 }}>Search or browse the drug list to view full reference including dosing, mechanism, contraindications, and renal/hepatic adjustments.</div>
            </div>
          )}
          {selectedDrug && <DrugDetail drug={selectedDrug}/>}
        </div>

        {/* RIGHT: INTERACTION CHECKER */}
        <div style={S.rightPanel}>
          <div style={{ padding:"10px 12px", borderBottom:`1px solid rgba(30,58,95,.4)`, display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", flexShrink:0 }}>
            <span style={{ fontSize:10, fontWeight:800, textTransform:"uppercase", letterSpacing:".07em", color:G.dim }}>⚖️ Weight:</span>
            <input style={{ background:"rgba(22,45,79,.7)", border:`1px solid ${G.border}`, borderRadius:7, padding:"5px 9px", fontFamily:"inherit", fontSize:11.5, color:G.bright, outline:"none", width:70 }} type="number" placeholder="Weight" value={patientWeight} onChange={e=>setPatientWeight(e.target.value)}/>
            <select style={{ background:"rgba(22,45,79,.7)", border:`1px solid ${G.border}`, borderRadius:7, padding:"5px 6px", fontFamily:"inherit", fontSize:11.5, color:G.bright, outline:"none" }} value={weightUnit} onChange={e=>setWeightUnit(e.target.value)}>
              <option value="kg">kg</option>
              <option value="lbs">lbs</option>
            </select>
            {patientWeight && <button onClick={()=>{setPatientWeight("");setWeightUnit("kg");}} style={{ background:"rgba(255,92,108,.1)", border:`1px solid rgba(255,92,108,.3)`, borderRadius:6, padding:"4px 8px", color:G.red, fontFamily:"inherit", fontSize:11, fontWeight:600, cursor:"pointer" }}>Clear</button>}
          </div>
          <div style={S.checkerTabs}>
            <button style={S.checkerTab(activeTab==="scanner")} onClick={()=>setActiveTab("scanner")}>✦ AI Scanner</button>
            <button style={S.checkerTab(activeTab==="proc")} onClick={()=>{setActiveTab("proc");if(!procMeds)setProcMeds(medListText);}}>🔗 Pre-Procedure</button>
          </div>

          {/* AI SCANNER */}
          {activeTab==="scanner" && (
            <div style={{ display:"flex", flexDirection:"column", flex:1, overflow:"hidden", minHeight:0 }}>
              <div style={{ padding:"10px 12px", borderBottom:`1px solid rgba(30,58,95,.4)`, display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", flexShrink:0 }}>
                <span style={{ fontSize:10, fontWeight:800, textTransform:"uppercase", letterSpacing:".07em", color:G.dim }}>Allergies:</span>
                <input style={{ background:"rgba(22,45,79,.7)", border:`1px solid ${G.border}`, borderRadius:7, padding:"5px 9px", fontFamily:"inherit", fontSize:11.5, color:G.bright, outline:"none", width:110 }} placeholder="Add allergy…" value={allergyInput} onChange={e=>setAllergyInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();addAllergy();}}}/>
                {allergies.map((a,i)=>(
                  <span key={i} style={S.allergyChip}>{a}<button onClick={()=>setAllergies(prev=>prev.filter((_,j)=>j!==i))} style={{ background:"none", border:"none", color:"rgba(255,92,108,.6)", cursor:"pointer", fontSize:13, fontFamily:"inherit", padding:0, lineHeight:1 }}>✕</button></span>
                ))}
              </div>
              <div style={{ padding:12, borderBottom:`1px solid rgba(30,58,95,.5)`, flexShrink:0 }}>
                <textarea style={S.ciTextarea} rows={7} value={medListText} onChange={e=>setMedListText(e.target.value)} placeholder={`Paste patient's medication list here — one per line or comma-separated.\n\nExample:\nWarfarin 5mg daily\nAmiodarone 200mg\nMetformin 1000mg BID\nDigoxin 0.125mg daily`}/>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:8, flexWrap:"wrap" }}>
                  <span style={{ flex:1, fontSize:11, fontWeight:700, color:G.dim, fontFamily:"'JetBrains Mono',monospace" }}>{parsedMeds.length} med{parsedMeds.length!==1?"s":""} detected</span>
                  <button style={S.btn("transparent",G.text,G.border)} onClick={()=>setMedListText(`Warfarin 5mg daily\nAmiodarone 200mg daily\nMetformin 1000mg BID\nLisinopril 10mg\nFurosemide 40mg\nDigoxin 0.125mg\nAtorvastatin 40mg\nAspirin 81mg\nLorazepam 1mg TID PRN`)}>Load Sample</button>
                  <button className="action-btn" disabled={scanning} style={{ ...S.btn("linear-gradient(135deg,#9b6dff,#7c5cd6)"), opacity:scanning?.6:1 }} onClick={runScan}>
                    {scanning ? "⏳ Scanning…" : "✦ Scan Now"}
                  </button>
                </div>
              </div>
              <div style={{ flex:1, overflowY:"auto", padding:10 }}>
                {scanning && (
                  <div>
                    {[...Array(4)].map((_,i)=>(
                      <div key={i} style={{ background:G.panel, border:`1px solid ${G.border}`, borderRadius:10, padding:12, marginBottom:10 }}>
                        {[40,100,88,72].map((w,j)=>(<div key={j} style={{ ...S.shimmer, width:w+"%" }}/>))}
                      </div>
                    ))}
                  </div>
                )}
                {!scanning && !scanResults && (
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:200, gap:10, textAlign:"center", opacity:.5 }}>
                    <div style={{ fontSize:36 }}>🔬</div>
                    <div style={{ fontSize:12.5, color:G.muted, maxWidth:240, lineHeight:1.6 }}>Paste a medication list above and click Scan Now. Notrya AI will check for interactions, allergy conflicts, and guideline deviations.</div>
                  </div>
                )}
                {!scanning && scanResults && <ScanResults data={scanResults}/>}
              </div>
            </div>
          )}

          {/* PRE-PROCEDURE */}
          {activeTab==="proc" && (
            <div style={{ flex:1, overflowY:"auto", padding:12, display:"flex", flexDirection:"column", gap:10 }}>
              <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                <span style={{ fontSize:10, fontWeight:800, textTransform:"uppercase", letterSpacing:".07em", color:G.dim }}>Procedure Type</span>
                <select style={{ background:"rgba(22,45,79,.8)", border:`1px solid ${G.border}`, borderRadius:8, padding:"8px 12px", fontFamily:"inherit", fontSize:12.5, color:G.bright, outline:"none", width:"100%" }} value={procType} onChange={e=>setProcType(e.target.value)}>
                  <option value="">— Select Procedure —</option>
                  <option value="colonoscopy">Colonoscopy / Endoscopy</option>
                  <option value="surgery_major">Major Surgery (General Anesthesia)</option>
                  <option value="cardiac_cath">Cardiac Catheterization</option>
                  <option value="epidural">Neuraxial / Epidural Block</option>
                  <option value="ct_contrast">CT with Contrast / Angiogram</option>
                  <option value="dental">Dental Procedure</option>
                </select>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                <span style={{ fontSize:10, fontWeight:800, textTransform:"uppercase", letterSpacing:".07em", color:G.dim }}>Patient Medications</span>
                <textarea style={{ ...S.ciTextarea, resize:"vertical" }} rows={5} value={procMeds} onChange={e=>setProcMeds(e.target.value)} placeholder="Paste medication list or auto-filled from AI Scanner…"/>
              </div>
              <button className="action-btn" style={{ ...S.btn("linear-gradient(135deg,#00d4bc,#00a896)"), width:"100%", justifyContent:"center" }} onClick={runProcRecon}>🔗 Generate Reconciliation</button>
              {procResults && (
                <div>
                  {procResults.hold.length>0 && (
                    <div>
                      <div style={{ fontSize:9.5, fontWeight:800, textTransform:"uppercase", letterSpacing:".08em", color:G.red, margin:"4px 0 3px" }}>🛑 Hold Before Procedure</div>
                      {procResults.hold.map((r,i)=><div key={i} style={S.procItem("hold")}><span style={{ flexShrink:0 }}>🛑</span><div>{r}</div></div>)}
                    </div>
                  )}
                  {procResults.caution.length>0 && (
                    <div>
                      <div style={{ fontSize:9.5, fontWeight:800, textTransform:"uppercase", letterSpacing:".08em", color:G.amber, margin:"8px 0 3px" }}>⚠️ Discuss / Caution</div>
                      {procResults.caution.map((r,i)=><div key={i} style={S.procItem("caution")}><span style={{ flexShrink:0 }}>⚠️</span><div>{r}</div></div>)}
                    </div>
                  )}
                  {procResults.cont.length>0 && (
                    <div>
                      <div style={{ fontSize:9.5, fontWeight:800, textTransform:"uppercase", letterSpacing:".08em", color:G.green, margin:"8px 0 3px" }}>✅ Continue</div>
                      {procResults.cont.slice(0,4).map((r,i)=><div key={i} style={S.procItem("cont")}><span style={{ flexShrink:0 }}>✅</span><div>{r}</div></div>)}
                    </div>
                  )}
                  <button className="action-btn" style={{ ...S.btn("linear-gradient(135deg,#4a90d9,#2f6db5)"), width:"100%", justifyContent:"center", marginTop:8 }} onClick={()=>setProcNoteModal(true)}>📝 Generate Procedure Note</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ACTION BAR */}
      <div style={S.actionBar}>
        <div style={{ flex:1, display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:G.dim }}>{DRUG_DB.length} medications in reference database</span>
          <span style={{ fontSize:11, fontWeight:700, padding:"4px 12px", borderRadius:20, background:"rgba(155,109,255,.1)", border:"1px solid rgba(155,109,255,.25)", color:G.purple }}>✦ AI-Powered Scanning</span>
        </div>
        <button className="action-btn" style={{ ...S.btn("transparent",G.text,G.border) }} onClick={()=>{setActiveTab("proc");if(!procMeds)setProcMeds(medListText);}}>🔗 Pre-Procedure Recon</button>
        <button className="action-btn" style={{ ...S.btn("linear-gradient(135deg,#9b6dff,#7c5cd6)") }} onClick={()=>{if(parsedMeds.length>=2)runScan();else showToast("Enter at least 2 medications",G.amber);}}>✦ Quick Scan</button>
      </div>

      {/* FINDING DETAIL MODAL */}
      {detailModal && (
        <div style={S.overlay} onClick={()=>setDetailModal(null)}>
          <div style={S.modal(false)} onClick={e=>e.stopPropagation()}>
            <div style={S.modalHeader}>
              <span style={{ fontSize:20 }}>⚡</span>
              <div style={S.modalTitle}>{detailModal.title}</div>
              <button onClick={()=>setDetailModal(null)} style={{ background:"none", border:"none", color:G.dim, fontSize:20, cursor:"pointer", fontFamily:"inherit" }}>✕</button>
            </div>
            <div style={{ padding:"18px 22px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                <div style={{ width:10, height:10, borderRadius:"50%", background:SEV[detailModal.severity]?.color||G.dim }}/>
                <span style={{ fontWeight:700, color:SEV[detailModal.severity]?.color||G.dim }}>{(detailModal.severity||"").toUpperCase()}</span>
                <span style={{ fontSize:11, color:G.dim }}>· {detailModal.type}</span>
              </div>
              <div style={{ fontSize:13, color:G.text, lineHeight:1.75, marginBottom:12 }}>{detailModal.description}</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                {detailModal.mechanism && (
                  <div style={{ background:"rgba(22,45,79,.5)", border:`1px solid ${G.border}`, borderRadius:9, padding:12 }}>
                    <div style={{ fontSize:9.5, fontWeight:800, textTransform:"uppercase", letterSpacing:".08em", color:G.dim, marginBottom:5 }}>Mechanism</div>
                    <div style={{ fontSize:12.5, color:G.text, lineHeight:1.6 }}>{detailModal.mechanism}</div>
                  </div>
                )}
                <div style={{ background:"rgba(22,45,79,.5)", border:`1px solid ${G.border}`, borderRadius:9, padding:12, ...(!detailModal.mechanism?{gridColumn:"span 2"}:{}) }}>
                  <div style={{ fontSize:9.5, fontWeight:800, textTransform:"uppercase", letterSpacing:".08em", color:G.dim, marginBottom:5 }}>Clinical Recommendation</div>
                  <div style={{ fontSize:12.5, color:G.green, lineHeight:1.6 }}>{detailModal.recommendation}</div>
                </div>
                {detailModal.drugs?.length>0 && (
                  <div style={{ background:"rgba(22,45,79,.5)", border:`1px solid ${G.border}`, borderRadius:9, padding:12, gridColumn:"span 2" }}>
                    <div style={{ fontSize:9.5, fontWeight:800, textTransform:"uppercase", letterSpacing:".08em", color:G.dim, marginBottom:5 }}>Drugs Involved</div>
                    <div>{detailModal.drugs.map((d,i)=>(<span key={i} style={{ background:"rgba(74,144,217,.1)", border:"1px solid rgba(74,144,217,.25)", borderRadius:6, padding:"2px 8px", fontSize:12, marginRight:5 }}>{d}</span>))}</div>
                  </div>
                )}
              </div>
            </div>
            <div style={S.modalFooter}>
              <button style={S.btn("transparent",G.text,G.border)} onClick={()=>setDetailModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* PROCEDURE NOTE MODAL */}
      {procNoteModal && (
        <div style={S.overlay} onClick={()=>setProcNoteModal(false)}>
          <div style={{ ...S.modal(true), width:760 }} onClick={e=>e.stopPropagation()}>
            <div style={S.modalHeader}>
              <span style={{ fontSize:20 }}>📝</span>
              <div style={S.modalTitle}>Pre-Procedure Medication Reconciliation Note</div>
              <button onClick={()=>setProcNoteModal(false)} style={{ background:"none", border:"none", color:G.dim, fontSize:20, cursor:"pointer", fontFamily:"inherit" }}>✕</button>
            </div>
            <div style={{ padding:"18px 22px" }}>
              <div style={{ fontSize:11.5, color:G.dim, marginBottom:10 }}>Edit as needed before copying.</div>
              <textarea value={procNote} onChange={e=>setProcNote(e.target.value)} style={{ background:"rgba(22,45,79,.5)", border:`1px solid ${G.border}`, borderRadius:10, padding:16, fontSize:13, lineHeight:1.85, color:G.bright, outline:"none", minHeight:280, width:"100%", resize:"vertical", fontFamily:"'DM Sans',system-ui,sans-serif", whiteSpace:"pre-wrap" }}/>
            </div>
            <div style={S.modalFooter}>
              <button style={S.btn("transparent",G.text,G.border)} onClick={()=>setProcNoteModal(false)}>Close</button>
              <button className="action-btn" style={{ ...S.btn("linear-gradient(135deg,#00d4bc,#00a896)") }} onClick={copyNote}>📋 Copy to Clipboard</button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div style={{ position:"fixed", bottom:24, right:24, zIndex:999 }}>
          <div style={S.toastEl(toast.color)}>{toast.msg}</div>
        </div>
      )}
    </div>
  );
}