import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
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
  // ── ADDITIONAL MEDICATIONS ────────────────────────────────────────────────────
  {
    id:"heparin", name:"Heparin (UFH)", brand:"Heparin Sodium", category:"anticoag",
    drugClass:"Unfractionated Heparin", highAlert:true, pregnancy:"C", color:"#60a5fa",
    mechanism:"Binds antithrombin III, accelerating inactivation of thrombin (IIa) and factor Xa. Immediate onset. Reversible with protamine sulfate.",
    indications:"VTE treatment/prophylaxis, STEMI/ACS bridging, DVT/PE, during cardiac/vascular surgery, heparin lock.",
    dosing:[
      {indication:"VTE Treatment (Weight-Based)",dose:"80 units/kg IV bolus, then 18 units/kg/hr infusion",route:"IV",duration:"Until therapeutic anticoagulation or bridge",notes:"Target aPTT 60–100 sec. Use institutional nomogram."},
      {indication:"VTE Prophylaxis",dose:"5,000 units SQ q8–12h",route:"SQ",duration:"Until ambulatory or discharge",notes:"Does not require aPTT monitoring for prophylaxis."},
    ],
    renal:[{tier:"All CrCl levels",dose:"No adjustment",note:"Monitor aPTT closely; metabolism independent of renal function"}],
    hepatic:"Use with caution in severe hepatic impairment. Heparin partially metabolized by reticuloendothelial system. Monitor aPTT.",
    contraindications:["Active major bleeding","HIT (heparin-induced thrombocytopenia) — absolute contraindication","Severe thrombocytopenia (<50k)","Recent intracranial surgery"],
    warnings:["HIT — check platelets q2–3 days; if ≥50% drop, stop immediately and use alternative","Bleeding — have protamine available","Osteoporosis with long-term use","Hyperkalemia — suppresses aldosterone"],
    interactions:["NSAIDs/aspirin (↑ bleeding)","Warfarin (additive anticoagulation)","Thrombolytics (↑ bleeding)","Protamine (reversal agent)"],
    monitoring:"aPTT q6h until therapeutic, then daily. Platelets q2–3 days (HIT surveillance). CBC, anti-Xa if obese.",
    halfLife:"1–2h (dose-dependent)", pb:"Binds plasma proteins extensively", renalExc:"<50% renal", ba:"~0% PO", vd:"0.07 L/kg",
  },
  {
    id:"rivaroxaban", name:"Rivaroxaban", brand:"Xarelto", category:"anticoag",
    drugClass:"Direct Xa Inhibitor (DOAC)", highAlert:true, pregnancy:"C", color:"#f43f5e",
    mechanism:"Direct, selective inhibitor of free and clot-bound factor Xa. Inhibits prothrombinase activity. No antithrombin cofactor required. Predictable pharmacokinetics.",
    indications:"Non-valvular AF, VTE treatment/prevention, post-orthopedic VTE prophylaxis, PAD, CAS.",
    dosing:[
      {indication:"Non-valvular AF",dose:"20mg PO daily with evening meal",route:"PO",duration:"Indefinite",notes:"15mg/day if CrCl 15–49. Take with food for adequate absorption."},
      {indication:"VTE Treatment",dose:"15mg BID ×21 days, then 20mg daily",route:"PO",duration:"≥3–6 months",notes:"Loading phase must be taken with food."},
    ],
    renal:[
      {tier:"CrCl ≥50",dose:"Standard dose",note:""},
      {tier:"CrCl 15–49",dose:"15mg daily (AF); 20mg daily (VTE — use with caution)",note:""},
      {tier:"CrCl <15",dose:"Avoid",note:"Insufficient data"},
      {tier:"HD",dose:"Avoid — not recommended",note:"Partly removed by dialysis (unclear benefit)"},
    ],
    hepatic:"Avoid moderate-severe (Child-Pugh B/C) — primarily hepatic metabolism (CYP3A4/CYP2J2). No adjustment mild.",
    contraindications:["Active bleeding","Mechanical heart valves","Moderate-severe mitral stenosis","CrCl <15","Severe hepatic impairment"],
    warnings:["Reversal: Andexanet alfa (factor Xa inhibitor antidote) or 4-factor PCC","No routine monitoring — anti-Xa if needed","Strong CYP3A4/P-gp inhibitors/inducers affect levels","Spinal/epidural hematoma risk with neuraxial anesthesia"],
    interactions:["Rifampin (↓ levels significantly — avoid)","Ketoconazole/itraconazole (↑ levels — avoid)","NSAIDs (↑ bleeding)","P-gp/CYP3A4 inhibitors (↑ levels)","Amiodarone (modest ↑ levels)"],
    monitoring:"No routine INR. Anti-Xa (rivaroxaban-calibrated) if needed. Renal function annually. CBC.",
    halfLife:"5–9h (young); 11–13h (elderly)", pb:"92–95%", renalExc:"33% unchanged", ba:"80–100% PO (with food)", vd:"50 L",
  },
  {
    id:"aspirin", name:"Aspirin", brand:"Bayer, Ecotrin, Bufferin", category:"analgesic",
    drugClass:"Antiplatelet / NSAID / Salicylate", highAlert:false, pregnancy:"C (D 3rd trimester)", color:"#f97316",
    mechanism:"Irreversibly acetylates COX-1/COX-2. At low doses (81mg): inhibits thromboxane A2 → antiplatelet. At higher doses: analgesic, antipyretic, anti-inflammatory via prostaglandin inhibition.",
    indications:"CV event prevention (primary/secondary), ACS/STEMI, ischemic stroke/TIA, pain, fever, Kawasaki disease.",
    dosing:[
      {indication:"Antiplatelet (CV prevention / post-ACS)",dose:"81mg PO daily",route:"PO",duration:"Indefinite",notes:"Loading dose 162–325mg for acute ACS/STEMI."},
      {indication:"Pain / Fever",dose:"325–650mg PO q4–6h PRN",route:"PO",duration:"Short-term",notes:"Max 4g/day. Take with food."},
    ],
    renal:[
      {tier:"CrCl ≥30",dose:"Standard dose",note:""},
      {tier:"CrCl <30",dose:"Avoid or use with caution",note:"Salt/fluid retention; reduced renal function"},
      {tier:"HD",dose:"Avoid for anti-inflammatory; low-dose may continue",note:"Discuss with nephrologist"},
    ],
    hepatic:"Avoid in severe hepatic impairment. Dose-dependent hepatotoxicity at high doses. Caution in cirrhosis.",
    contraindications:["Children/adolescents with viral illness (Reye syndrome)","Aspirin-exacerbated respiratory disease (AERD) / triad","Active peptic ulcer disease (relative)","Gout (high doses elevate urate)","Last trimester pregnancy"],
    warnings:["GI bleeding — use with PPI if high risk","Avoid with concurrent NSAID (loss of cardioprotective effect)","Tinnitus/salicylism at high doses","Increased bleeding with warfarin — avoid unless indicated (e.g., mechanical valve)"],
    interactions:["Warfarin (↑ bleeding — major)","NSAIDs (displace aspirin from COX-1 — ibuprofen blocks cardioprotection)","Methotrexate (↑ toxicity — displaces from protein binding)","Probenecid (aspirin blocks uricosuric effect)","Corticosteroids (↑ GI bleeding)"],
    monitoring:"Bleeding signs. Renal function if long-term. Platelet function not routinely monitored.",
    halfLife:"~15–20 min (aspirin); salicylate 2–3h (low dose), 15–30h (high dose)", pb:"80–90%", renalExc:"80–100% (salicylate metabolites)", ba:"80–100% PO", vd:"0.1–0.2 L/kg",
  },
  {
    id:"ibuprofen", name:"Ibuprofen", brand:"Advil, Motrin, Caldolor", category:"analgesic",
    drugClass:"NSAID (Propionic Acid Derivative)", highAlert:false, pregnancy:"C (D 3rd trimester)", color:"#fb923c",
    mechanism:"Non-selective COX-1/COX-2 inhibitor. Reduces prostaglandin synthesis → anti-inflammatory, analgesic, antipyretic. Reversible platelet inhibition (unlike aspirin).",
    indications:"Pain (mild-moderate), fever, inflammation, OA/RA, dysmenorrhea, headache.",
    dosing:[
      {indication:"Pain / Fever",dose:"200–400mg PO q4–6h PRN; max 1200mg/day OTC; 3200mg/day Rx",route:"PO",duration:"Shortest effective duration",notes:"Take with food. Max OTC dose 1200mg/day."},
      {indication:"Anti-inflammatory (RA/OA)",dose:"400–800mg PO TID–QID",route:"PO",duration:"Ongoing with monitoring",notes:"Use lowest effective dose."},
    ],
    renal:[
      {tier:"eGFR ≥60",dose:"Standard with monitoring",note:""},
      {tier:"eGFR 30–59",dose:"Use with caution; short-term only",note:"↑ AKI risk; avoid if volume-depleted"},
      {tier:"eGFR <30",dose:"Avoid",note:"AKI risk; worsens CKD"},
      {tier:"HD",dose:"Avoid",note:"Contraindicated in severe CKD"},
    ],
    hepatic:"Avoid in severe hepatic impairment. Metabolized by CYP2C9. Caution in cirrhosis — salt/fluid retention.",
    contraindications:["Active GI bleeding/peptic ulcer","Severe renal impairment (eGFR <30)","Last trimester pregnancy","CABG perioperative pain","Aspirin-exacerbated respiratory disease"],
    warnings:["CV risk — MI/stroke (dose and duration dependent)","GI toxicity — ulceration, bleeding, perforation","AKI in volume-depleted patients","HTN worsening","Fluid retention / edema","Premature closure of ductus arteriosus if used >20 weeks gestation"],
    interactions:["Aspirin (blocks cardioprotective effect)","Warfarin (↑ bleeding)","Lithium (↑ levels — toxicity)","ACEi/ARBs/diuretics (↑ AKI)","Methotrexate (↑ toxicity)","Corticosteroids (↑ GI risk)","SSRIs (↑ GI bleeding)"],
    monitoring:"BMP (renal function) with chronic use. BP. CBC for chronic use. GI symptoms.",
    halfLife:"1.8–2.5h", pb:"99%", renalExc:"~90% (metabolites)", ba:"80% PO", vd:"0.12–0.2 L/kg",
  },
  {
    id:"morphine", name:"Morphine", brand:"MS Contin, Morphabond, Kadian", category:"analgesic",
    drugClass:"Opioid Analgesic (Schedule II)", highAlert:true, pregnancy:"C", color:"#a78bfa",
    mechanism:"Full agonist at mu (primary), kappa, and delta opioid receptors in CNS and peripheral tissues. Decreases pain perception and emotional response to pain. Active metabolite M6G accumulates in renal impairment.",
    indications:"Moderate-severe pain, acute pulmonary edema (adjunct), dyspnea in palliative care.",
    dosing:[
      {indication:"Acute Severe Pain (IV)",dose:"2–4mg IV q3–4h PRN (opioid-naïve)",route:"IV",duration:"Reassess frequently",notes:"Titrate to effect. Use lowest effective dose. Monitor respiratory rate."},
      {indication:"Chronic Pain (oral ER)",dose:"Start 15–30mg PO q8–12h (ER)",route:"PO",duration:"Chronic; regular reassessment",notes:"Always prescribe IR for breakthrough (10–15% of total daily dose)."},
    ],
    renal:[
      {tier:"CrCl ≥60",dose:"Standard dose",note:""},
      {tier:"CrCl 30–59",dose:"Reduce dose 50%; extend interval",note:"M6G (active metabolite) accumulates"},
      {tier:"CrCl <30",dose:"Avoid if possible; if used, start at 25% dose",note:"Significant M6G accumulation → respiratory depression"},
      {tier:"HD",dose:"Avoid — prefer alternative opioid (hydromorphone/fentanyl)",note:"M6G not adequately removed by HD"},
    ],
    hepatic:"Significant first-pass effect. Reduce dose in hepatic impairment — reduced metabolism. Increase dosing interval.",
    contraindications:["Significant respiratory depression","Acute/severe bronchial asthma (without monitoring)","Paralytic ileus","Hypersensitivity to morphine","MAOIs within 14 days"],
    warnings:["Respiratory depression — FDA boxed warning (especially with CNS depressants)","Physical dependence and addiction potential","Constipation — prescribe bowel regimen prophylactically","QT prolongation (high doses)","Adrenal insufficiency with chronic use"],
    interactions:["Benzodiazepines/CNS depressants (respiratory depression — FDA black box)","MAOIs (serotonin syndrome, hypertensive crisis — contraindicated)","CYP3A4 inhibitors (↑ levels)","Naloxone (reversal agent)","Alcohol (↑ CNS depression)"],
    monitoring:"Respiratory rate, O2 sat, sedation score (POSS/RASS). Pain reassessment. Constipation. Signs of dependence.",
    halfLife:"2–4h (IR); M6G t½ >10h (active)", pb:"30–35%", renalExc:"~90% (metabolites)", ba:"~20–40% PO (first-pass)", vd:"1–6 L/kg",
  },
  {
    id:"fentanyl", name:"Fentanyl", brand:"Duragesic, Actiq, Sublimaze", category:"analgesic",
    drugClass:"Synthetic Opioid Analgesic (Schedule II)", highAlert:true, pregnancy:"C", color:"#c084fc",
    mechanism:"Highly selective mu-opioid receptor agonist. 100× more potent than morphine. Highly lipophilic — rapid CNS penetration. Minimal histamine release. Does NOT accumulate active metabolites in renal failure.",
    indications:"Acute/procedural pain, analgesia in ICU/intubated patients, chronic cancer pain (patch), PONV adjunct, opioid-tolerant patients.",
    dosing:[
      {indication:"Procedural / Acute (IV)",dose:"25–100 mcg IV q1–2h PRN (opioid-naïve)",route:"IV",duration:"Procedural/short-term",notes:"Onset 1–2 min IV. Titrate carefully. 1 mcg/kg commonly used."},
      {indication:"Chronic Cancer Pain (patch)",dose:"Start 12–25 mcg/hr patch (opioid-tolerant only)",route:"Transdermal",duration:"Change q72h",notes:"Patch for opioid-tolerant patients ONLY (≥60mg oral morphine/day). Onset 12–24h."},
    ],
    renal:[{tier:"All CrCl levels",dose:"No dose adjustment; preferred over morphine in renal impairment",note:"No active metabolite accumulation"}],
    hepatic:"Reduce dose in severe hepatic impairment — primarily CYP3A4 metabolism. Risk of accumulation.",
    contraindications:["Non-opioid-tolerant patients (patch only)","Transdermal: acute/postoperative pain","Significant respiratory depression","Elevated ICP (relative)","MAOIs within 14 days"],
    warnings:["Chest wall rigidity with rapid IV push (wooden chest syndrome)","Fentanyl analogues (illicit) extremely potent — naloxone may need multiple doses","Respiratory depression with CNS depressants","Hyperthermia increases patch absorption","QTc prolongation"],
    interactions:["Benzodiazepines (respiratory depression — black box)","CYP3A4 inhibitors (ketoconazole, ritonavir — ↑ levels)","MAOIs (serotonin syndrome)","CNS depressants (additive)","Serotonergic agents (serotonin syndrome — rare)"],
    monitoring:"Respiratory rate, O2 sat (continuous with IV). Sedation score. Pain reassessment. Patch site rotation.",
    halfLife:"2–4h (IV); 17–27h (patch accumulation)", pb:"80–85%", renalExc:"~75% metabolites", ba:"~92% transdermal (varies); ~0% PO", vd:"4–6 L/kg",
  },
  {
    id:"acetaminophen", name:"Acetaminophen", brand:"Tylenol, Ofirmev, Panadol", category:"analgesic",
    drugClass:"Analgesic / Antipyretic (Non-NSAID)", highAlert:false, pregnancy:"B", color:"#fbbf24",
    mechanism:"Mechanism not fully elucidated. Inhibits COX-3 centrally; modulates endocannabinoid system. Lacks peripheral anti-inflammatory action. Metabolized by CYP2E1/CYP3A4 to NAPQI (toxic) — detoxified by glutathione.",
    indications:"Mild-moderate pain, fever, first-line analgesic/antipyretic for patients intolerant to NSAIDs.",
    dosing:[
      {indication:"Pain / Fever (adult)",dose:"325–1000mg PO/PR q4–6h PRN; max 4g/day (3g in elderly/liver disease)",route:"PO/PR/IV",duration:"PRN; short-term preferred",notes:"Max 3g/day in hepatic impairment, chronic alcohol use, or elderly."},
      {indication:"IV Acetaminophen (Ofirmev)",dose:"1000mg IV q6h (weight ≥50kg); 12.5 mg/kg IV q4h (weight <50kg)",route:"IV",duration:"Short-term (≤5 days)",notes:"Infuse over 15 min. Consider IV only when oral/PR not feasible."},
    ],
    renal:[{tier:"All CrCl levels",dose:"Standard dose (short-term); extend interval in severe CKD",note:"Metabolites may accumulate in renal failure — use caution"}],
    hepatic:"Reduce to 2g/day max in hepatic impairment. AVOID in acute hepatic failure. Alcohol increases hepatotoxic NAPQI production.",
    contraindications:["Severe hepatic impairment (Child-Pugh C)","Acetaminophen hypersensitivity","Chronic alcohol use disorder (relative — use <2g/day)"],
    warnings:["Hepatotoxicity — most common cause of acute liver failure in US","Overdose: N-acetylcysteine is antidote (initiate if >150 mcg/mL at 4h post-ingestion)","Hidden in combination products — add up all sources (Vicodin, NyQuil, Percocet, etc.)","Warfarin: acetaminophen >2g/day can increase INR"],
    interactions:["Warfarin (↑ INR at doses >2g/day — use lowest dose)","Alcohol (↑ hepatotoxic NAPQI production)","CYP2E1 inducers (isoniazid — ↑ NAPQI)","Carbamazepine/phenytoin (↑ NAPQI via CYP induction)"],
    monitoring:"No routine monitoring for short-term use. LFTs if overdose concern or hepatic disease. Serum level if overdose (Rumack-Matthew nomogram).",
    halfLife:"1.5–3h", pb:"10–25%", renalExc:"3% unchanged; ~90% conjugate metabolites", ba:"~85–98% PO", vd:"0.9 L/kg",
  },
  {
    id:"levothyroxine", name:"Levothyroxine", brand:"Synthroid, Levoxyl, Tirosint", category:"other",
    drugClass:"Thyroid Hormone Replacement (T4)", highAlert:false, pregnancy:"A", color:"#34d399",
    mechanism:"Synthetic T4 (thyroxine). Converted peripherally to active T3. Regulates metabolic rate, growth, development, and multiple organ system functions. Negative feedback on TSH/TRH.",
    indications:"Hypothyroidism (primary/secondary/tertiary), TSH suppression in thyroid cancer, myxedema coma.",
    dosing:[
      {indication:"Hypothyroidism (adult <60, no cardiac disease)",dose:"1.6 mcg/kg/day PO (usually 25–200 mcg)",route:"PO",duration:"Lifelong",notes:"Take 30–60 min before breakfast; separate from calcium/iron by 4h. Titrate q4–6 weeks."},
      {indication:"Myxedema Coma",dose:"200–400 mcg IV loading, then 50–100 mcg IV daily",route:"IV",duration:"Until oral tolerated",notes:"Give stress-dose steroids first (adrenal insufficiency co-existing)."},
    ],
    renal:[{tier:"All CrCl levels",dose:"No adjustment",note:"Primarily hepatic metabolism"}],
    hepatic:"Use with caution in severe hepatic disease — reduced conversion T4→T3. Monitor TSH more frequently.",
    contraindications:["Untreated adrenal insufficiency (thyroid replacement may precipitate adrenal crisis)","Thyrotoxicosis (unless used for suppression under specialist)","Recent MI (relative) — caution initiating"],
    warnings:["Cardiac arrhythmias/angina — start low, titrate slowly in cardiac disease/elderly","Decreased bone density with over-replacement","Overreplacement: sweating, palpitations, weight loss, anxiety","Multiple absorption interactions","Pregnancy: dose often needs ↑ 20–30%"],
    interactions:["Calcium/iron/antacids (↓ absorption — separate by 4h)","Cholestyramine/colestipol (↓ absorption)","Warfarin (↑ sensitivity — may need warfarin dose ↓)","Phenytoin/carbamazepine (↑ levothyroxine metabolism)","PPIs (↓ absorption)"],
    monitoring:"TSH at 6–8 weeks after initiation or dose change; annually when stable. Free T4. HR, BP, symptoms.",
    halfLife:"6–7 days", pb:"99%", renalExc:"~20% (unchanged)", ba:"~40–80% PO (variable with food)", vd:"10–12 L",
  },
  {
    id:"prednisone", name:"Prednisone", brand:"Deltasone, Rayos", category:"other",
    drugClass:"Corticosteroid (Glucocorticoid)", highAlert:false, pregnancy:"C", color:"#f87171",
    mechanism:"Synthetic glucocorticoid. Binds GCR → nuclear translocation → anti-inflammatory gene transcription (reduces cytokines, PGE2, leukocyte migration). Mineralocorticoid activity ~0.8× hydrocortisone. Requires hepatic conversion to prednisolone (active).",
    indications:"Asthma/COPD exacerbation, autoimmune diseases (SLE, RA, IBD), allergic reactions, adrenal insufficiency, PCP prophylaxis, anti-inflammatory.",
    dosing:[
      {indication:"Asthma / COPD Exacerbation",dose:"40–60mg PO daily ×5–7 days",route:"PO",duration:"5–14 days",notes:"No taper needed for short courses <3 weeks."},
      {indication:"Autoimmune / Anti-inflammatory",dose:"0.5–1 mg/kg/day PO; taper over weeks-months",route:"PO",duration:"Taper schedule per disease",notes:"Long-term use requires adrenal suppression management."},
    ],
    renal:[{tier:"All CrCl levels",dose:"No adjustment",note:"Monitor for fluid retention, hypokalemia"}],
    hepatic:"Requires hepatic conversion to prednisolone. In severe hepatic disease, use prednisolone directly. Monitor for edema/ascites.",
    contraindications:["Active systemic fungal infection (without antifungal cover)","Live vaccines during immunosuppressive doses","Hypersensitivity to corticosteroids"],
    warnings:["HPA axis suppression — do NOT abruptly stop if >3 weeks use (Addisonian crisis risk)","Stress dosing needed for surgery, illness, trauma","Hyperglycemia — worsen DM; may unmask latent DM","Osteoporosis — supplement calcium/vit D; consider bisphosphonate if >3 months","Immunosuppression — increased infection risk (including TB reactivation)","Psychiatric effects (insomnia, euphoria, psychosis)","Cataracts, glaucoma with long-term use"],
    interactions:["NSAIDs (↑ GI bleeding)","Rifampin (↓ prednisone levels)","CYP3A4 inhibitors (↑ levels)","Live vaccines (contraindicated)","Antidiabetics (↑ glucose — adjust doses)","Warfarin (variable — monitor INR)"],
    monitoring:"Blood glucose. BP. Weight. K+. Bone density (DEXA if >3 months). HbA1c. Ophthalmology if chronic.",
    halfLife:"2–4h (prednisolone); biological t½ ~18–36h", pb:"70–90%", renalExc:"<20%", ba:"~82% PO", vd:"0.5–0.7 L/kg",
  },
  {
    id:"semaglutide", name:"Semaglutide", brand:"Ozempic (SQ), Rybelsus (PO), Wegovy (obesity)", category:"other",
    drugClass:"GLP-1 Receptor Agonist", highAlert:false, pregnancy:"X", color:"#38bdf8",
    mechanism:"Long-acting GLP-1 receptor agonist. Stimulates glucose-dependent insulin secretion, suppresses glucagon, slows gastric emptying, increases satiety. Significant CV and renal benefits demonstrated in trials (SUSTAIN, STEP).",
    indications:"Type 2 DM (with CV risk reduction), obesity/overweight (Wegovy), MACE reduction.",
    dosing:[
      {indication:"T2DM (Ozempic SQ)",dose:"Start 0.25mg SQ weekly ×4 weeks; ↑ to 0.5mg; max 2mg/week",route:"SQ",duration:"Ongoing",notes:"Inject in abdomen, thigh, or upper arm weekly. Can take any time of day."},
      {indication:"Obesity (Wegovy)",dose:"Start 0.25mg SQ weekly; escalate over 16 weeks to 2.4mg/week",route:"SQ",duration:"Ongoing",notes:"Used with diet/exercise for chronic weight management."},
    ],
    renal:[{tier:"All CrCl levels",dose:"No adjustment",note:"Renal protective effects observed in CREDENCE-type trials"}],
    hepatic:"Limited data in severe hepatic impairment. Use with caution. No specific adjustment.",
    contraindications:["Personal/family history of medullary thyroid carcinoma","Multiple Endocrine Neoplasia syndrome type 2","Pregnancy (fetal harm — stop ≥2 months before planned pregnancy)"],
    warnings:["Thyroid C-cell tumors in rodents (clinical significance unknown)","Pancreatitis — stop if suspected","GI side effects (nausea, vomiting, diarrhea) — titrate slowly","HOLD 1 week (daily) or 2 weeks (weekly) before surgery/endoscopy (aspiration risk — delayed gastric emptying)","Diabetic retinopathy complications","Acute kidney injury (GI fluid loss with nausea/vomiting)"],
    interactions:["Oral medications (delayed absorption — take critical meds 1h before semaglutide)","Insulin/sulfonylureas (↑ hypoglycemia risk)","Warfarin (monitor INR — delayed absorption may alter)"],
    monitoring:"HbA1c q3 months initially. Weight. BP. Renal function (if GI losses). Lipase if pancreatitis suspected. Ophthalmology for DM.",
    halfLife:"~1 week (SQ)", pb:"~99%", renalExc:"Minimal renal elimination", ba:"~89% SQ; ~1% PO (Rybelsus needs empty stomach)", vd:"12.5 L",
  },
  {
    id:"empagliflozin", name:"Empagliflozin", brand:"Jardiance", category:"other",
    drugClass:"SGLT2 Inhibitor", highAlert:false, pregnancy:"C (D 2nd/3rd trimester)", color:"#4ade80",
    mechanism:"Inhibits sodium-glucose cotransporter 2 (SGLT2) in proximal renal tubule → blocks ~90% renal glucose reabsorption → glycosuria + natriuresis + osmotic diuresis. Independent of insulin. Proven HF/CV/renal benefits (EMPA-REG OUTCOME, EMPEROR-Reduced).",
    indications:"T2DM (with MACE reduction), HFrEF/HFpEF (NYHA II–IV, EF ≤40%), CKD with diabetic nephropathy.",
    dosing:[
      {indication:"T2DM / CV Risk",dose:"10mg PO daily; may ↑ to 25mg for glycemic benefit",route:"PO",duration:"Ongoing",notes:"Take any time of day. Glucose benefit requires eGFR ≥45."},
      {indication:"Heart Failure (HFrEF)",dose:"10mg PO daily",route:"PO",duration:"Ongoing",notes:"Benefit persists even without T2DM. eGFR ≥20 needed."},
    ],
    renal:[
      {tier:"eGFR ≥45",dose:"Standard dose (10 or 25mg)",note:"Full glucose + CV benefit"},
      {tier:"eGFR 20–44",dose:"10mg only (CV/renal benefit, not glucose)",note:"Reduced glycemic efficacy but CV/HF benefit persists"},
      {tier:"eGFR <20",dose:"Avoid for T2DM; can use for HF (per 2023 guidelines)",note:"Controversial — specialist guidance"},
      {tier:"HD",dose:"Not recommended",note:"Mechanism depends on renal glucose filtration"},
    ],
    hepatic:"No specific adjustment for mild-moderate hepatic impairment. Limited data in severe (Child-Pugh C).",
    contraindications:["Type 1 DM (DKA risk)","eGFR <20 for glycemic use","History of SGLT2 inhibitor-related DKA","Recurrent UTIs/vaginal yeast infections (relative)"],
    warnings:["DKA — can occur at near-normal glucose (euglycemic DKA). HOLD ≥3–4 days before surgery/procedure","Fournier's gangrene (necrotizing fasciitis of genitoperineum) — rare but serious","Genital mycotic infections — more common in women","Volume depletion/hypotension in elderly/diuretic users","Lower limb amputation risk (canagliflozin > empagliflozin)"],
    interactions:["Insulin/sulfonylureas (↑ hypoglycemia)","Diuretics (additive volume depletion)","Lithium (volume depletion ↑ lithium levels)"],
    monitoring:"eGFR, electrolytes at baseline and periodically. HbA1c. BP (expect mild decrease). Weight. Signs of DKA.",
    halfLife:"~12.4h", pb:"86%", renalExc:"54%", ba:"~78% PO", vd:"73.8 L",
  },
  {
    id:"sertraline", name:"Sertraline", brand:"Zoloft", category:"psych",
    drugClass:"Selective Serotonin Reuptake Inhibitor (SSRI)", highAlert:false, pregnancy:"C", color:"#818cf8",
    mechanism:"Potent and selective inhibitor of neuronal serotonin reuptake with minimal effects on NE or dopamine. No significant anticholinergic, antihistaminic, or alpha-adrenergic activity. Onset of therapeutic effect 2–4 weeks.",
    indications:"Major depressive disorder, PTSD, panic disorder, OCD, social anxiety, PMDD.",
    dosing:[
      {indication:"MDD / Anxiety Disorders",dose:"Start 25–50mg PO daily; usual effective 50–200mg; max 200mg/day",route:"PO",duration:"At least 6–12 months for MDD; longer for recurrent",notes:"Titrate q1–2 weeks. Take morning or evening consistently."},
    ],
    renal:[{tier:"All CrCl levels",dose:"No adjustment",note:"Primarily hepatic metabolism"}],
    hepatic:"Reduce dose 50% or use alternate-day dosing in hepatic impairment. Child-Pugh B/C — use lowest effective dose.",
    contraindications:["MAOIs — contraindicated (washout 14 days between); linezolid; methylene blue","Pimozide (QT prolongation)","Hypersensitivity to sertraline"],
    warnings:["Suicidality — FDA black box warning for children/young adults (monitor closely)","Serotonin syndrome with serotonergic agents","Hyponatremia (SIADH) — especially in elderly","Sexual dysfunction (25–50%)","Nausea, diarrhea (common GI side effects)","Discontinuation syndrome — taper slowly","Antiplatelet effect — ↑ GI bleeding with NSAIDs"],
    interactions:["MAOIs (serotonin syndrome — contraindicated)","Linezolid / methylene blue (serotonin syndrome)","NSAIDs/aspirin (↑ GI bleeding)","Warfarin (modest ↑ INR)","Triptans (serotonin syndrome risk)","Tramadol (↑ serotonin syndrome, lower seizure threshold)"],
    monitoring:"Mood/depressive symptoms. Suicidality (esp. first 1–4 weeks). Sodium in elderly. Weight. Sexual function.",
    halfLife:"26h (desmethylsertraline t½ 60–100h)", pb:"98%", renalExc:"<0.2%", ba:"~44% PO", vd:"20 L/kg",
  },
  {
    id:"quetiapine", name:"Quetiapine", brand:"Seroquel, Seroquel XR", category:"psych",
    drugClass:"Atypical Antipsychotic (2nd Generation)", highAlert:false, pregnancy:"C", color:"#a78bfa",
    mechanism:"Blocks dopamine D2 and serotonin 5-HT2A receptors. Also antihistamine (H1) and alpha-1 blockade → sedation, weight gain, orthostasis. Active metabolite norquetiapine has NRI activity (antidepressant).",
    indications:"Schizophrenia, bipolar mania/depression, MDD adjunct, agitation/sleep (off-label at low doses).",
    dosing:[
      {indication:"Schizophrenia",dose:"Start 25–50mg BID; titrate to 150–750mg/day",route:"PO",duration:"Ongoing",notes:"Avoid abrupt discontinuation."},
      {indication:"Bipolar / Insomnia (off-label low-dose)",dose:"25–100mg PO QHS",route:"PO",duration:"As needed; reassess regularly",notes:"At 25–100mg primarily antihistamine effect (sedation). No antipsychotic dosing needed for sleep."},
    ],
    renal:[{tier:"All CrCl levels",dose:"No adjustment needed",note:"Primarily hepatic metabolism"}],
    hepatic:"Reduce dose in hepatic impairment. Start 25mg and increase slowly. Active metabolite also formed hepatically.",
    contraindications:["Known hypersensitivity","Use with potent CYP3A4 inhibitors (relative)","Concurrent use near dementia in elderly (black box mortality warning)"],
    warnings:["Elderly with dementia-related psychosis — ↑ mortality (FDA black box)","Metabolic syndrome: weight gain, hyperglycemia, dyslipidemia — monitor","QTc prolongation (dose-dependent)","Orthostatic hypotension — especially at initiation","Tardive dyskinesia (lower risk than typicals)","NMS (rare)","Cataracts — periodic ophthalmologic monitoring"],
    interactions:["CYP3A4 inhibitors (ketoconazole, ritonavir — ↑ quetiapine levels significantly)","Rifampin (↓ levels ↓ 5× — increase dose)","QT-prolonging drugs","Antihypertensives (additive hypotension)","CNS depressants (additive sedation)"],
    monitoring:"Metabolic panel (glucose, lipids, weight, waist circumference) at baseline and q3–6 months. ECG if QT concern. CBC. Ophthalmology q2 years.",
    halfLife:"~6–7h", pb:"83%", renalExc:"~73% (metabolites)", ba:"~9% PO (extensive first-pass)", vd:"10 L/kg",
  },
  {
    id:"piperacillin_tazo", name:"Piperacillin-Tazobactam", brand:"Zosyn", category:"abx",
    drugClass:"Extended-Spectrum Penicillin + Beta-lactamase Inhibitor", highAlert:false, pregnancy:"B", color:"#34d399",
    mechanism:"Piperacillin inhibits bacterial cell wall synthesis (PBP binding). Tazobactam irreversibly inhibits beta-lactamases (including ESBL, AmpC), broadening spectrum. Time-dependent killing — extended infusion preferred.",
    indications:"Hospital-acquired pneumonia, complicated intra-abdominal/UTI/SSTI, febrile neutropenia, polymicrobial infections.",
    dosing:[
      {indication:"Serious Infections (nosocomial)",dose:"3.375g IV q6h (standard) or 4.5g IV q6h",route:"IV",duration:"7–14 days depending on source",notes:"Extended infusion (3.375g IV q8h over 4h) preferred for MICs up to 16 mcg/mL (PK/PD optimized)."},
      {indication:"Febrile Neutropenia",dose:"4.5g IV q6h",route:"IV",duration:"Until afebrile + ANC recovery",notes:"High suspicion for Pseudomonas — maintain high dosing."},
    ],
    renal:[
      {tier:"CrCl >40",dose:"3.375g q6h or 4.5g q8h",note:""},
      {tier:"CrCl 20–40",dose:"2.25g q6h",note:"Reduce dose; monitor closely"},
      {tier:"CrCl <20",dose:"2.25g q8h",note:"Significant dose reduction"},
      {tier:"HD",dose:"2.25g q12h + 0.75g post-HD",note:"Supplement post-dialysis"},
    ],
    hepatic:"No hepatic adjustment. Primarily renal elimination.",
    contraindications:["Penicillin or beta-lactam allergy (use with caution — cross-reactivity ~2%)","Hypersensitivity to piperacillin-tazobactam"],
    warnings:["CDIFF risk with broad-spectrum use","Drug-induced immune neutropenia with prolonged use","DRESS (rare)","↑ nephrotoxicity with vancomycin (PipeVan association — controversial)","Seizures at high doses in renal impairment"],
    interactions:["Vancomycin (↑ AKI — PIPC/Vanc combination studied)","Methotrexate (↑ MTX toxicity)","Anticoagulants (↑ bleeding risk)","Probenecid (↑ piperacillin levels)"],
    monitoring:"CBC (neutropenia with prolonged use). BMP. Signs of CDIFF. LFTs. Cultures/sensitivities.",
    halfLife:"0.7–1.2h (both components)", pb:"30% pip / 23% tazo", renalExc:"~68%", ba:"~0% PO", vd:"0.24 L/kg",
  },
  {
    id:"ceftriaxone", name:"Ceftriaxone", brand:"Rocephin", category:"abx",
    drugClass:"3rd-Generation Cephalosporin", highAlert:false, pregnancy:"B", color:"#86efac",
    mechanism:"Bactericidal. Binds penicillin-binding proteins (PBPs) → inhibits cell wall cross-linking. Broad gram-positive and gram-negative coverage including many ESBL-negative Enterobacteriaceae. Long half-life allows once-daily dosing.",
    indications:"CAP, meningitis (empiric), gonorrhea, Lyme disease, pelvic inflammatory disease, gram-negative bacteremia, sepsis.",
    dosing:[
      {indication:"CAP / Moderate Infections",dose:"1g IV/IM daily",route:"IV/IM",duration:"5–14 days",notes:"For CAP pair with azithromycin or doxycycline."},
      {indication:"Meningitis",dose:"2g IV q12h",route:"IV",duration:"10–21 days depending on organism",notes:"Add vancomycin empirically for pneumococcus."},
      {indication:"Gonorrhea (uncomplicated)",dose:"500mg IM × 1 dose",route:"IM",duration:"Single dose",notes:"Add doxycycline if chlamydia not excluded."},
    ],
    renal:[{tier:"All CrCl levels",dose:"No adjustment for eGFR >10",note:"Biliary + renal dual elimination — renal impairment alone not dose-limiting"}],
    hepatic:"Caution in combined severe hepatic AND renal impairment — biliary elimination reduced.",
    contraindications:["Known allergy to cephalosporins (or penicillin — 2% cross-reactivity)","Neonates with hyperbilirubinemia (displaces bilirubin)","Concurrent calcium IV in neonates (precipitate formation)"],
    warnings:["Biliary pseudolithiasis (sludge) with high doses/prolonged use","CDIFF risk","Hemolytic anemia (rare)","Intravenous incompatibility — do NOT mix with calcium in same IV line","Pain at IM injection site (dilute with 1% lidocaine for IM)"],
    interactions:["Calcium (IV incompatibility in neonates)","Aminoglycosides (nephrotoxicity if co-administered)","Warfarin (↑ INR via gut flora alteration)"],
    monitoring:"CBC. BMP. LFTs if prolonged. Cultures/sensitivities. Signs of CDIFF.",
    halfLife:"5.8–8.7h", pb:"83–96%", renalExc:"~33–67%", ba:"~0% PO; 100% IM/IV", vd:"0.12–0.14 L/kg",
  },
  {
    id:"levofloxacin", name:"Levofloxacin", brand:"Levaquin", category:"abx",
    drugClass:"Fluoroquinolone Antibiotic", highAlert:false, pregnancy:"C", color:"#fb7185",
    mechanism:"Inhibits DNA gyrase (topoisomerase II) and topoisomerase IV → prevents DNA supercoiling/replication → bactericidal. Concentration-dependent killing. Excellent oral bioavailability (oral = IV efficacy).",
    indications:"CAP (step-down), HAP, UTI, SSTI, sinusitis, anthrax (post-exposure), atypical pneumonia, exacerbations of COPD.",
    dosing:[
      {indication:"CAP / Pneumonia",dose:"750mg PO/IV daily ×5 days",route:"PO/IV",duration:"5–7 days",notes:"Oral bioavailability ~99% — switch to PO when tolerating."},
      {indication:"UTI (uncomplicated)",dose:"250mg PO daily ×3 days",route:"PO",duration:"3 days",notes:"For complicated UTI: 750mg daily ×5 days."},
    ],
    renal:[
      {tier:"CrCl ≥50",dose:"Standard dose",note:""},
      {tier:"CrCl 20–49",dose:"750mg loading, then 500mg daily",note:""},
      {tier:"CrCl 10–19",dose:"750mg loading, then 250mg daily",note:""},
      {tier:"HD/CAPD",dose:"750mg loading, then 500mg q48h",note:"Supplement after HD"},
    ],
    hepatic:"No dose adjustment — primarily renal elimination.",
    contraindications:["Previous tendinopathy with FQ","History of FQ-associated CNS effects","Myasthenia gravis (worsens)","QTc >500ms","Hypersensitivity to fluoroquinolones"],
    warnings:["Tendinopathy/tendon rupture — risk ↑ in elderly, with corticosteroids","Peripheral neuropathy — may be irreversible","CNS toxicity: seizures, confusion (especially in elderly)","QT prolongation","Aortic aneurysm/dissection risk (FDA warning)","C. diff","Photosensitivity"],
    interactions:["Antacids/iron/zinc (↓ absorption — separate by 2h)","QT-prolonging drugs (additive)","NSAIDs (↑ CNS toxicity/seizures)","Warfarin (↑ INR)","Antidiabetics (glucose dysregulation)"],
    monitoring:"Signs of tendinopathy. ECG if QT concern. Glucose in DM. Renal function. C. diff symptoms.",
    halfLife:"6–8h", pb:"24–38%", renalExc:"~87%", ba:"~99% PO", vd:"1.27 L/kg",
  },
  {
    id:"metronidazole", name:"Metronidazole", brand:"Flagyl", category:"abx",
    drugClass:"Nitroimidazole Antibiotic / Antiprotozoal", highAlert:false, pregnancy:"B (avoid 1st trimester)", color:"#a3e635",
    mechanism:"Prodrug reduced intracellularly by ferredoxin → produces reactive intermediates → DNA strand breaks → bactericidal/protozoacidal. Active only in anaerobic/microaerophilic organisms. Excellent CNS/tissue penetration.",
    indications:"C. difficile colitis (oral), intra-abdominal infections (anaerobes), bacterial vaginosis, Trichomonas, H. pylori (triple therapy), dental abscesses, brain abscess.",
    dosing:[
      {indication:"C. diff (non-severe, 1st episode)",dose:"500mg PO TID ×10–14 days (2nd line — vancomycin preferred per IDSA)",route:"PO",duration:"10–14 days",notes:"Note: vancomycin 125mg QID preferred per 2021 IDSA guidelines."},
      {indication:"Intra-abdominal / Anaerobic Coverage",dose:"500mg IV/PO q8h",route:"IV/PO",duration:"4–7 days (usually combined with gram-neg coverage)",notes:"Typically combined with cefazolin or fluoroquinolone."},
      {indication:"Bacterial Vaginosis",dose:"500mg PO BID ×7 days",route:"PO",duration:"7 days",notes:"Alt: 2g single dose PO."},
    ],
    renal:[{tier:"All CrCl levels",dose:"No adjustment for acute use",note:"Metabolites may accumulate with HD; supplement post-HD if needed"}],
    hepatic:"Reduce dose 50% in severe hepatic impairment (Child-Pugh C) — primarily hepatic metabolism.",
    contraindications:["First trimester pregnancy (especially high doses)","Disulfiram use within 2 weeks","Hypersensitivity to nitroimidazoles"],
    warnings:["Disulfiram-like reaction with alcohol — avoid alcohol during and 48h after","Metallic taste (common)","Peripheral neuropathy with prolonged/high-dose use","CNS toxicity (seizures, encephalopathy) at high doses","Increases warfarin effect significantly","Carcinogenicity in rodents at high doses (not demonstrated in humans)"],
    interactions:["Warfarin (↑ INR significantly — reduce warfarin dose)","Alcohol (disulfiram reaction)","Disulfiram (psychosis)","Phenytoin (↑ phenytoin levels)","Lithium (↑ toxicity — increased levels)","Cyclosporine (↑ levels)"],
    monitoring:"Neurological symptoms (prolonged use). INR if on warfarin. LFTs.",
    halfLife:"6–8h (metabolites 5–8h)", pb:"<20%", renalExc:"~60–80%", ba:"~100% PO", vd:"0.25–0.85 L/kg",
  },
  {
    id:"pantoprazole", name:"Pantoprazole", brand:"Protonix", category:"gi",
    drugClass:"Proton Pump Inhibitor (PPI)", highAlert:false, pregnancy:"B", color:"#60a5fa",
    mechanism:"Irreversibly inhibits H+/K+-ATPase (proton pump) in gastric parietal cells → profound, sustained acid suppression. Requires activation in acidic environment (prodrug). Inhibits both fasting and meal-stimulated acid secretion.",
    indications:"GERD, peptic ulcer disease, H. pylori eradication (triple therapy), Zollinger-Ellison syndrome, GI bleeding prophylaxis (ICU), NSAID-induced ulcer prevention.",
    dosing:[
      {indication:"GERD / PUD",dose:"40mg PO daily (30–60 min before meal)",route:"PO",duration:"4–8 weeks; ongoing if refractory",notes:"Take 30–60 min before breakfast. Long-term use increases risks."},
      {indication:"GI Bleed (ICU / Upper GI)",dose:"80mg IV bolus, then 8mg/hr infusion ×72h (post-endoscopy)",route:"IV",duration:"72h IV; then transition to PO",notes:"Post-endoscopic hemostasis for high-risk peptic ulcer."},
    ],
    renal:[{tier:"All CrCl levels",dose:"No adjustment",note:"Primarily hepatic metabolism (CYP2C19/3A4)"}],
    hepatic:"No adjustment for mild-moderate. Severe hepatic impairment — max 20mg/day (reduced clearance).",
    contraindications:["Hypersensitivity to PPIs (substituted benzimidazoles)","Rilpivirine-containing regimens (↓ rilpivirine absorption)"],
    warnings:["Hypomagnesemia with long-term use (>1 year) — monitor Mg2+","C. diff risk — acid suppression promotes C. diff growth","Bone fractures (hip, spine) with chronic use","Vitamin B12 deficiency with long-term use","CKD progression association (observational)","Rebound acid hypersecretion on discontinuation"],
    interactions:["Clopidogrel (CYP2C19 competition — may ↓ clopidogrel activation; use alternative PPI)","Methotrexate (↑ toxicity — impair renal excretion)","Iron/calcium/levothyroxine (↓ absorption — separate by ≥2h)","Atazanavir (↓ absorption — avoid)","Rifampin (↓ PPI levels)"],
    monitoring:"Mg2+ after >1 year use. Vitamin B12 annually. Bone density if chronic use + risk factors.",
    halfLife:"~1h (irreversible binding prolongs effect)", pb:"98%", renalExc:"~71% (inactive metabolites)", ba:"77% PO", vd:"11–23.6 L",
  },
  {
    id:"amlodipine", name:"Amlodipine", brand:"Norvasc", category:"cardiac",
    drugClass:"Dihydropyridine Calcium Channel Blocker", highAlert:false, pregnancy:"C", color:"#f59e0b",
    mechanism:"Selectively blocks L-type calcium channels in vascular smooth muscle and myocardium. Primarily vascular smooth muscle → vasodilation (low myocardial depression). Long half-life → gradual BP lowering without reflex tachycardia.",
    indications:"Hypertension, chronic stable angina, vasospastic angina (Prinzmetal).",
    dosing:[
      {indication:"Hypertension / Angina",dose:"5mg PO daily; may ↑ to 10mg after 7–14 days",route:"PO",duration:"Ongoing",notes:"Most well-tolerated CCB. Peripheral edema common. Take any time of day."},
    ],
    renal:[{tier:"All CrCl levels",dose:"No adjustment",note:"Primarily hepatic metabolism (CYP3A4)"}],
    hepatic:"Start 2.5mg in severe hepatic impairment. Titrate slowly — prolonged half-life. Monitor for hypotension/edema.",
    contraindications:["Cardiogenic shock","Severe aortic stenosis (relative)","Hypersensitivity to dihydropyridines"],
    warnings:["Peripheral edema — dose-dependent, more common than other CCBs","Reflex tachycardia minimal (long t½)","May worsen heart failure in some patients (use with caution in HFrEF)","Grapefruit juice ↑ levels via CYP3A4 inhibition"],
    interactions:["CYP3A4 inhibitors (ketoconazole, diltiazem, grapefruit — ↑ levels)","Simvastatin (↑ statin levels — cap simvastatin at 20mg)","Beta-blockers (additive HR/BP reduction — generally safe)","Cyclosporine (↑ amlodipine levels)"],
    monitoring:"BP, HR. Peripheral edema. Renal function (reflex RAAS activation rare).",
    halfLife:"30–50h", pb:"97%", renalExc:"<10%", ba:"~64–90% PO", vd:"21 L/kg",
  },
  {
    id:"spironolactone", name:"Spironolactone", brand:"Aldactone, CaroSpir", category:"cardiac",
    drugClass:"Aldosterone Antagonist / Potassium-Sparing Diuretic", highAlert:false, pregnancy:"D", color:"#c084fc",
    mechanism:"Competitive antagonist of aldosterone at mineralocorticoid receptors in distal tubule/collecting duct. Reduces sodium and water retention, promotes potassium retention. Anti-fibrotic cardiac effects. Also anti-androgen.",
    indications:"HFrEF (NYHA II–IV, EF ≤35%), primary hyperaldosteronism, resistant HTN, edema (cirrhosis), acne/hirsutism (off-label), hypokalemia prevention.",
    dosing:[
      {indication:"HFrEF (NYHA II-IV)",dose:"12.5–25mg PO daily; max 50mg/day",route:"PO",duration:"Ongoing",notes:"Start only if K+ ≤5.0 and eGFR >30. Monitor K+ closely."},
      {indication:"Resistant HTN / Edema",dose:"12.5–100mg PO daily",route:"PO",duration:"Ongoing",notes:"Higher doses for primary hyperaldosteronism."},
    ],
    renal:[
      {tier:"eGFR ≥30",dose:"Use with caution; start at 12.5–25mg",note:"Monitor K+ q1–2 weeks initially"},
      {tier:"eGFR <30",dose:"Avoid — hyperkalemia risk very high",note:"Consider eplerenone with closer monitoring"},
      {tier:"HD",dose:"Avoid",note:""},
    ],
    hepatic:"Use with caution in cirrhosis — reduce dose. Monitor for encephalopathy from azotemia.",
    contraindications:["Hyperkalemia (K+ >5.5)","Addison's disease","eGFR <30 (relative)","Concurrent potassium supplements (relative)","Pregnancy (anti-androgenic effects on fetus)"],
    warnings:["Hyperkalemia — especially with ACEi/ARBs, K+ supplements, renal impairment (K+ monitoring essential)","Gynecomastia in men (~10%) — switch to eplerenone if problematic","Menstrual irregularities in women","Mild metabolic acidosis","Breast pain"],
    interactions:["ACEi/ARBs (↑ hyperkalemia — monitor K+)","NSAIDs (↓ efficacy, ↑ hyperkalemia)","Digoxin (spironolactone decreases renal clearance of digoxin — monitor)","K+ supplements (hyperkalemia)","Lithium (↑ lithium toxicity via Na+ depletion)"],
    monitoring:"K+ and SCr at baseline, 1 week, 1 month, then q3–6 months. BP. Weight/edema.",
    halfLife:"1.4h (canrenone active metabolite 10–35h)", pb:"91%", renalExc:"~25–60%", ba:"~73% PO (with food)", vd:"Variable",
  },
  {
    id:"clopidogrel", name:"Clopidogrel", brand:"Plavix", category:"anticoag",
    drugClass:"P2Y12 ADP Receptor Inhibitor (Antiplatelet)", highAlert:true, pregnancy:"B", color:"#f87171",
    mechanism:"Prodrug requiring CYP2C19 activation → active metabolite irreversibly binds P2Y12 receptor on platelets → inhibits ADP-induced platelet aggregation. Platelet effect lasts lifetime of platelet (~7–10 days).",
    indications:"ACS (NSTEMI/UA/STEMI), post-PCI, ischemic stroke/TIA, PAD. Dual antiplatelet therapy (DAPT) with aspirin.",
    dosing:[
      {indication:"ACS / Post-PCI (DAPT)",dose:"Loading: 300–600mg PO × 1; Maintenance: 75mg PO daily",route:"PO",duration:"≥12 months post-ACS; ≥1 month post-BMS; 6–12 months post-DES",notes:"Always combine with aspirin for DAPT."},
      {indication:"Ischemic Stroke / TIA",dose:"75mg PO daily (or 300mg loading)",route:"PO",duration:"Indefinite for secondary prevention",notes:"Consider short-term DAPT (clopidogrel + aspirin ×21d) for high-risk TIA/minor stroke."},
    ],
    renal:[{tier:"All CrCl levels",dose:"No adjustment",note:"Primarily hepatic; metabolites excreted renally"}],
    hepatic:"Use with caution in moderate hepatic impairment (reduced CYP2C19 activation). Avoid severe — increased bleeding risk.",
    contraindications:["Active pathological bleeding (peptic ulcer, ICH)","Hypersensitivity to clopidogrel or thienopyridines"],
    warnings:["CYP2C19 poor metabolizers (~30% population) — reduced activation → treatment failure","PPI interaction (especially omeprazole/esomeprazole) — use pantoprazole instead","Thrombotic thrombocytopenic purpura (TTP) — rare","HOLD 5–7 days before elective surgery/procedures","Discontinuation → rebound thrombosis — do NOT abruptly stop"],
    interactions:["Omeprazole/esomeprazole (↓ activation via CYP2C19 competition)","Aspirin (pharmacodynamic synergy — DAPT)","NSAIDs (↑ bleeding)","Warfarin (↑ bleeding)","Atorvastatin (minor CYP3A4 competition)"],
    monitoring:"Platelet function testing if concerned about response. CBC. Bleeding signs. Stent placement compliance.",
    halfLife:"~6h (active metabolite)", pb:"94–98%", renalExc:"50%", ba:"~50% PO (first-pass)", vd:"Variable",
  },
  {
    id:"insulin_glargine", name:"Insulin Glargine", brand:"Lantus, Basaglar, Toujeo", category:"other",
    drugClass:"Long-Acting Basal Insulin Analog", highAlert:true, pregnancy:"C", color:"#818cf8",
    mechanism:"Recombinant insulin analog with 2 arginine residues added and glycine substitution. Forms micro-precipitates at SQ injection site → slow, peakless absorption. Activates insulin receptor for ~20–24h (Lantus/Basaglar) or ~36h (Toujeo). Does NOT accumulate predictably — always SQ.",
    indications:"Basal insulin coverage in T1DM and T2DM. Oncology hyperglycemia management.",
    dosing:[
      {indication:"T2DM (Initiation)",dose:"10 units SQ QHS (or 0.1–0.2 units/kg/day)",route:"SQ",duration:"Ongoing — titrate weekly",notes:"Titrate by 2 units every 3 days to fasting BG target 80–130 mg/dL."},
      {indication:"T1DM (Basal Component)",dose:"~50% of total daily dose as glargine",route:"SQ",duration:"Ongoing",notes:"Same time each day. Do NOT mix with other insulins."},
    ],
    renal:[
      {tier:"eGFR ≥30",dose:"Standard dose with close monitoring",note:"Reduced gluconeogenesis → hypoglycemia risk"},
      {tier:"eGFR <30",dose:"Reduce dose; increased hypoglycemia risk",note:"Start at 50% of usual dose; monitor closely"},
      {tier:"HD",dose:"Significant dose reduction required",note:"HD patients: very sensitive to insulin — start low"},
    ],
    hepatic:"Reduce dose in hepatic impairment — impaired gluconeogenesis increases hypoglycemia risk.",
    contraindications:["Hypoglycemia (active episode)","Hypersensitivity to insulin glargine or excipients","Do NOT dilute or mix with other insulins"],
    warnings:["Hypoglycemia — most common and serious side effect (do NOT mix up insulin types)","Weight gain","Injection site lipodystrophy — rotate sites","Hypokalemia (insulin drives K+ intracellularly)","Toujeo has different concentration (300 units/mL) — do NOT substitute unit for unit with Lantus"],
    interactions:["Beta-blockers (mask tachycardia from hypoglycemia; may prolong hypoglycemia)","Corticosteroids (↑ BG — need higher doses)","ACEi (may ↑ insulin sensitivity)","SGLT2 inhibitors (euglycemic DKA risk in T1DM)","Alcohol (↑ hypoglycemia — unpredictable)"],
    monitoring:"Fasting BG daily; HbA1c q3 months. Serum K+ if concern. Hypoglycemia episodes. Weight.",
    halfLife:"12–24h (SQ depot kinetics)", pb:"Binds insulin receptor (not plasma proteins)", renalExc:"Renal clearance of metabolites", ba:"~100% SQ", vd:"Variable (SQ depot)",
  },
  // ── BATCH 3 ──────────────────────────────────────────────────────────────────
  {
    id:"enalapril", name:"Enalapril", brand:"Vasotec", category:"cardiac",
    drugClass:"ACE Inhibitor", highAlert:false, pregnancy:"D", color:"#22c55e",
    mechanism:"Prodrug converted to enalaprilat by hepatic esterases. Inhibits ACE → reduces angiotensin II → vasodilation, reduced aldosterone. Similar mechanism to lisinopril but requires hepatic conversion.",
    indications:"Hypertension, HFrEF, asymptomatic LV dysfunction post-MI.",
    dosing:[
      {indication:"Hypertension",dose:"5mg PO BID; range 10–40mg/day in 1–2 doses",route:"PO",duration:"Ongoing",notes:""},
      {indication:"HFrEF",dose:"Start 2.5mg BID; titrate to 10mg BID target",route:"PO",duration:"Ongoing",notes:"Start low in volume-depleted patients."},
    ],
    renal:[
      {tier:"CrCl ≥30",dose:"Standard dose",note:""},
      {tier:"CrCl <30",dose:"Start 2.5mg daily; max 40mg",note:"Reduce starting dose"},
    ],
    hepatic:"Requires hepatic conversion to active enalaprilat — reduced efficacy in severe liver disease. Monitor BP.",
    contraindications:["ACE inhibitor-associated angioedema","Bilateral renal artery stenosis","Pregnancy (2nd/3rd trimester)","Hyperkalemia","Concurrent aliskiren in diabetics"],
    warnings:["Angioedema (life-threatening)","Dry cough (~15%)","Hyperkalemia with K-sparing agents","AKI in volume-depleted patients","First-dose hypotension"],
    interactions:["NSAIDs (↑ AKI, ↓ antihypertensive effect)","K-sparing diuretics (hyperkalemia)","Lithium (↑ levels)","ARBs (dual blockade — avoid)"],
    monitoring:"BMP at 1 week, 1 month after initiation/dose change. BP. Cough.",
    halfLife:"11h (enalaprilat)", pb:"50–60%", renalExc:"~60% (enalaprilat)", ba:"55–75% PO", vd:"~1.7 L/kg",
  },
  {
    id:"losartan", name:"Losartan", brand:"Cozaar", category:"cardiac",
    drugClass:"Angiotensin II Receptor Blocker (ARB)", highAlert:false, pregnancy:"D", color:"#4ade80",
    mechanism:"Selective AT1 receptor blocker. Blocks angiotensin II-mediated vasoconstriction and aldosterone release. Does NOT inhibit bradykinin degradation → minimal cough compared to ACEi. Active metabolite EXP3174 is more potent and longer-acting.",
    indications:"Hypertension, diabetic nephropathy, HFrEF (ACEi-intolerant), LV hypertrophy reduction, stroke prevention in HTN with LVH.",
    dosing:[
      {indication:"Hypertension",dose:"50mg PO daily; range 25–100mg/day",route:"PO",duration:"Ongoing",notes:"May need BID dosing at higher doses."},
      {indication:"Diabetic Nephropathy",dose:"50mg PO daily; max 100mg",route:"PO",duration:"Ongoing",notes:"Shown to slow CKD progression in T2DM (RENAAL trial)."},
    ],
    renal:[
      {tier:"CrCl ≥30",dose:"Standard dose",note:""},
      {tier:"CrCl <30",dose:"No dose adjustment required",note:"Monitor K+ and creatinine closely"},
    ],
    hepatic:"Start 25mg daily in hepatic impairment — reduced clearance of both losartan and EXP3174.",
    contraindications:["Bilateral renal artery stenosis","Pregnancy (2nd/3rd trimester)","Concurrent aliskiren in diabetes/CKD","Hypersensitivity"],
    warnings:["Hyperkalemia (especially with K+ supplements, CKD)","AKI in volume-depleted patients","Avoid ACEi + ARB dual blockade","Less cough than ACEi but same angioedema risk (rare)"],
    interactions:["NSAIDs (↑ AKI, ↓ antihypertensive effect)","K-sparing diuretics/K+ supplements (hyperkalemia)","Lithium (↑ levels)","ACEi (dual blockade — avoid)","Fluconazole (↑ EXP3174 via CYP2C9 inhibition)"],
    monitoring:"BMP at 1 week, 1 month. BP. Urine protein (nephropathy).",
    halfLife:"2h (losartan); 6–9h (EXP3174)", pb:"99%", renalExc:"~35%", ba:"~33% PO", vd:"34 L",
  },
  {
    id:"carvedilol", name:"Carvedilol", brand:"Coreg, Coreg CR", category:"cardiac",
    drugClass:"Non-selective Beta-Blocker + Alpha-1 Blocker", highAlert:false, pregnancy:"C", color:"#38bdf8",
    mechanism:"Non-selective β1/β2 and α1 blocker. Alpha-1 blockade → vasodilation (less reflex tachycardia than pure beta-blockers). Antioxidant properties. Preferred in HFrEF for reduced mortality (COPERNICUS, MERIT-HF).",
    indications:"HFrEF (NYHA II–IV), hypertension, angina, LV dysfunction post-MI.",
    dosing:[
      {indication:"HFrEF",dose:"Start 3.125mg PO BID ×2 weeks; double q2 weeks to max 25mg BID (<85kg) or 50mg BID (>85kg)",route:"PO",duration:"Ongoing",notes:"Take with food (↓ orthostasis). Must be euvolemic before initiating."},
      {indication:"Hypertension",dose:"6.25mg PO BID; max 25mg BID",route:"PO",duration:"Ongoing",notes:""},
    ],
    renal:[{tier:"All CrCl levels",dose:"No adjustment",note:"Primarily hepatic metabolism"}],
    hepatic:"Contraindicated in severe hepatic impairment (Child-Pugh C) — primary hepatic elimination. Caution in moderate.",
    contraindications:["Decompensated HF requiring inotropes","Bronchospastic lung disease (asthma)","2nd/3rd-degree AV block without pacemaker","Sick sinus syndrome","Severe bradycardia"],
    warnings:["Never abruptly discontinue — rebound HTN, angina, MI","Masks hypoglycemia symptoms","Orthostatic hypotension (alpha-1 blockade)","May worsen bronchospasm (non-selective β2 blockade)","Worsening HF on initiation — assess euvolemia"],
    interactions:["Amiodarone/diltiazem (↑ bradycardia/AV block)","Clonidine (rebound HTN)","Insulin (hypoglycemia masking)","CYP2D6 inhibitors (fluoxetine — ↑ carvedilol levels)"],
    monitoring:"HR, BP, respiratory status. Weight in HF. BG in diabetics.",
    halfLife:"7–10h", pb:"98%", renalExc:"<2%", ba:"~25–35% PO (first-pass)", vd:"115 L",
  },
  {
    id:"nitroglycerin", name:"Nitroglycerin", brand:"Nitrostat, Nitro-Bid, Nitropress", category:"cardiac",
    drugClass:"Organic Nitrate / Vasodilator", highAlert:true, pregnancy:"C", color:"#fb923c",
    mechanism:"Produces nitric oxide (NO) → activates guanylate cyclase → ↑ cGMP → vascular smooth muscle relaxation. Predominantly venodilation at low doses (↓ preload); arterial dilation at high doses. Reduces myocardial O2 demand.",
    indications:"Acute angina (SL), ACS chest pain, acute pulmonary edema (IV), hypertensive emergency (IV), chronic stable angina prophylaxis (patch/long-acting).",
    dosing:[
      {indication:"Acute Angina (SL)",dose:"0.3–0.6mg SL q5 min × up to 3 doses; if no relief after 3 doses → call 911",route:"SL",duration:"PRN acute episodes",notes:"Onset 1–3 min. Protect from light/heat. Replace SL tabs q6 months."},
      {indication:"ACS / Pulmonary Edema (IV)",dose:"5–10 mcg/min IV; ↑ by 5–10 mcg/min q3–5 min to effect; max 200 mcg/min",route:"IV",duration:"24–48h IV, then transition",notes:"Use glass bottles/special non-PVC tubing (adsorbs to PVC)."},
    ],
    renal:[{tier:"All CrCl levels",dose:"No adjustment",note:""}],
    hepatic:"Primarily hepatic metabolism. Use with caution in severe hepatic disease.",
    contraindications:["PDE-5 inhibitors (sildenafil, tadalafil, vardenafil) within 24–48h — severe hypotension","Severe hypotension (SBP <90 mmHg)","Right ventricular infarction (preload-dependent)","Raised ICP / cerebral hemorrhage","Hypertrophic obstructive cardiomyopathy (HOCM)"],
    warnings:["Headache — most common side effect (vasodilation)","Tolerance with continuous use (12h nitrate-free period needed)","Methemoglobinemia with high doses","Hypotension — especially with volume depletion","SL tablet loss of potency if not stored correctly"],
    interactions:["PDE-5 inhibitors (CONTRAINDICATED — severe hypotension)","Antihypertensives (additive hypotension)","Alcohol (↑ hypotension)","Heparin (IV NTG may ↑ heparin requirements)"],
    monitoring:"BP continuously (IV). HR. Headache resolution. Ischemia symptoms.",
    halfLife:"1–4 min (IV)", pb:"60%", renalExc:"~1%", ba:"38% SL; ~1% PO (first-pass)", vd:"3 L/kg",
  },
  {
    id:"diltiazem", name:"Diltiazem", brand:"Cardizem, Dilacor, Tiazac", category:"cardiac",
    drugClass:"Non-Dihydropyridine Calcium Channel Blocker", highAlert:false, pregnancy:"C", color:"#fb7185",
    mechanism:"Blocks L-type Ca2+ channels in heart and vascular smooth muscle. Slows AV nodal conduction and HR (like verapamil but less potent negative inotrope). Reduces myocardial O2 demand. Also vasodilates coronary/peripheral arteries.",
    indications:"AF/flutter rate control, SVT (IV), stable angina, vasospastic angina, hypertension.",
    dosing:[
      {indication:"AF Rate Control (IV)",dose:"0.25 mg/kg IV over 2 min; if inadequate after 15 min: 0.35 mg/kg; then infusion 5–15 mg/hr",route:"IV",duration:"Short-term; transition to oral",notes:"Monitor BP and HR closely."},
      {indication:"Hypertension / Angina (oral)",dose:"IR: 30–120mg PO TID–QID; XR: 120–480mg PO daily",route:"PO",duration:"Ongoing",notes:"Extended-release preferred for HTN."},
    ],
    renal:[{tier:"All CrCl levels",dose:"No adjustment; use with caution in severe CKD",note:""}],
    hepatic:"Significant first-pass effect. Reduce dose in hepatic impairment — primarily CYP3A4.",
    contraindications:["Sick sinus syndrome / high-degree AV block without pacemaker","Severe hypotension","Acute MI with pulmonary congestion","WPW with AF (↑ accessory pathway conduction)","IV diltiazem + IV beta-blockers — contraindicated (severe bradycardia/asystole)"],
    warnings:["Bradycardia and AV block","Negative inotrope — worsen HFrEF at high doses","CYP3A4 major inhibitor → multiple drug interactions","Gingival hyperplasia with chronic use"],
    interactions:["Beta-blockers (↑ bradycardia/AV block — caution IV + IV)","Digoxin (↑ levels — reduce digoxin dose)","Statins (↑ statin levels — myopathy risk)","Cyclosporine (↑ levels)","CYP3A4 substrates (many interactions)"],
    monitoring:"HR, BP, ECG (PR interval). LFTs with long-term use. Drug interactions.",
    halfLife:"3–4.5h (IR); 6–9h (XR)", pb:"70–80%", renalExc:"~35%", ba:"~40% PO (first-pass)", vd:"3–13 L/kg",
  },
  {
    id:"rosuvastatin", name:"Rosuvastatin", brand:"Crestor", category:"cardiac",
    drugClass:"HMG-CoA Reductase Inhibitor (Statin)", highAlert:false, pregnancy:"X", color:"#7dd3fc",
    mechanism:"Competitive inhibitor of HMG-CoA reductase. Most potent LDL-lowering statin (reduces LDL up to 65% at max dose). Minimal CYP3A4 metabolism (unlike atorvastatin) — fewer CYP-based drug interactions. Also raises HDL.",
    indications:"Hypercholesterolemia, ASCVD prevention (primary/secondary), hypertriglyceridemia, familial hypercholesterolemia.",
    dosing:[
      {indication:"Primary/Secondary Prevention",dose:"10–40mg PO daily",route:"PO",duration:"Ongoing",notes:"Start 5mg in Asian patients (higher bioavailability). Max 40mg; 20mg if CrCl <30."},
      {indication:"High-Intensity (ASCVD)",dose:"20–40mg PO daily",route:"PO",duration:"Ongoing",notes:"High-intensity statin preferred for established CVD or high-risk."},
    ],
    renal:[
      {tier:"CrCl ≥30",dose:"Standard dose",note:""},
      {tier:"CrCl <30",dose:"Max 20mg/day",note:"Reduced renal elimination — increased exposure"},
    ],
    hepatic:"Contraindicated in active liver disease or LFT ≥3× ULN. No adjustment mild.",
    contraindications:["Active hepatic disease","Pregnancy/breastfeeding","Concurrent cyclosporine (max 5mg rosuvastatin)"],
    warnings:["Myopathy/rhabdomyolysis — lower CYP3A4 interaction risk than atorvastatin but still possible with fibrates","New-onset T2DM","LFT elevation","Proteinuria at high doses (40mg) — renal monitoring recommended"],
    interactions:["Cyclosporine (↑ levels — cap at 5mg)","Gemfibrozil (↑ rhabdomyolysis — avoid)","Warfarin (mild ↑ INR)","Antacids (↓ absorption — separate 2h)","Ritonavir (↑ levels)"],
    monitoring:"Lipids at 4–12 weeks, then annually. LFTs at baseline. CK if myalgia. HbA1c. Proteinuria if ≥40mg.",
    halfLife:"19h", pb:"88%", renalExc:"~28%", ba:"~20% PO (variable by race)", vd:"134 L",
  },
  {
    id:"albuterol", name:"Albuterol", brand:"ProAir, Ventolin, Proventil", category:"other",
    drugClass:"Short-Acting Beta-2 Agonist (SABA)", highAlert:false, pregnancy:"C", color:"#34d399",
    mechanism:"Selective β2-adrenergic receptor agonist → bronchial smooth muscle relaxation → bronchodilation. Also inhibits mast cell mediator release, stimulates mucociliary clearance. Short-acting (4–6h). Some β1 activity at high doses.",
    indications:"Acute bronchospasm (asthma/COPD), exercise-induced bronchospasm, hyperkalemia (IV/nebulized), PICU bronchiolitis.",
    dosing:[
      {indication:"Acute Bronchospasm (inhaler)",dose:"2 puffs (90 mcg/puff) q4–6h PRN; acute: 2–8 puffs q20 min ×3 doses",route:"INH",duration:"PRN",notes:"Use spacer for optimal delivery. 15 min before exercise for EIB."},
      {indication:"Acute Asthma / COPD (nebulizer)",dose:"2.5mg in 3mL NS nebulized q20 min ×3, then q1–4h",route:"NEB",duration:"Acute phase",notes:"Continuous neb in severe attacks."},
      {indication:"Hyperkalemia",dose:"10–20mg nebulized over 15 min (adjunct)",route:"NEB",duration:"Single dose (additive to calcium/bicarb)",notes:"Drives K+ intracellularly (temporary ~0.5–1 mEq/L decrease)."},
    ],
    renal:[{tier:"All CrCl levels",dose:"No adjustment",note:""}],
    hepatic:"No significant hepatic adjustment needed.",
    contraindications:["Hypersensitivity to albuterol or any component","Not first-line for chronic persistent asthma (LABA preferred for maintenance)"],
    warnings:["Tachycardia, palpitations — more at high doses","Hypokalemia with frequent dosing","Paradoxical bronchospasm — rare","Tremor (β2 stimulation of skeletal muscle)","Overuse (>2 days/week) = uncontrolled asthma → escalate therapy"],
    interactions:["Beta-blockers (antagonize bronchodilation — avoid in asthma)","Digoxin (↓ levels slightly)","MAOIs/TCAs (↑ CV effects)","Loop diuretics (additive hypokalemia)"],
    monitoring:"Peak flow or spirometry. HR. K+ if frequent dosing. Inhaler technique assessment.",
    halfLife:"3.8–5h", pb:"~0%", renalExc:"~69% (urine)", ba:"~5–10% inhaled (lung deposition)", vd:"2.2 L/kg",
  },
  {
    id:"tiotropium", name:"Tiotropium", brand:"Spiriva Handihaler/Respimat", category:"other",
    drugClass:"Long-Acting Muscarinic Antagonist (LAMA)", highAlert:false, pregnancy:"C", color:"#a3e635",
    mechanism:"Selective M3 muscarinic receptor antagonist in airway smooth muscle → prolonged bronchodilation (24h). Reduces mucus secretion. Blocks acetylcholine-induced bronchoconstriction. GOLD guideline preferred first-line maintenance in COPD.",
    indications:"COPD maintenance (first-line), asthma adjunct (Respimat formulation).",
    dosing:[
      {indication:"COPD Maintenance",dose:"Handihaler: 18 mcg inhaled daily; Respimat: 5 mcg (2 puffs 2.5 mcg each) inhaled daily",route:"INH",duration:"Ongoing",notes:"Inhale only — do NOT swallow capsules. Open capsule only in Handihaler."},
    ],
    renal:[
      {tier:"CrCl >50",dose:"Standard dose",note:""},
      {tier:"CrCl ≤50",dose:"Use with caution — monitor for anticholinergic effects",note:"Elimination reduced; limited dose adjustment guidance"},
    ],
    hepatic:"No adjustment — primarily renal elimination.",
    contraindications:["Hypersensitivity to tiotropium, atropine, or ipratropium","Narrow-angle glaucoma (avoid inhaler in eyes)"],
    warnings:["Paradoxical bronchospasm","Dry mouth (most common)","Urinary retention — caution in BPH","Constipation","Tachycardia (minor)","Blurred vision if inhaler misdirected toward eyes — irrigate immediately"],
    interactions:["Other anticholinergics (additive effects — avoid concurrent ipratropium)","Bladder drugs (anticholinergic additive effects)"],
    monitoring:"Spirometry (FEV1). Dyspnea/exercise tolerance. Dry mouth. Urinary symptoms in men.",
    halfLife:"5–6 days (terminal)", pb:"72%", renalExc:"~74%", ba:"~19% inhaled", vd:"32 L/kg",
  },
  {
    id:"phenytoin", name:"Phenytoin / Fosphenytoin", brand:"Dilantin (phenytoin), Cerebyx (fosphenytoin)", category:"psych",
    drugClass:"Antiepileptic (Hydantoin)", highAlert:true, pregnancy:"D", color:"#f472b6",
    mechanism:"Blocks voltage-gated sodium channels in neuronal membranes → stabilizes firing threshold → prevents seizure propagation. Zero-order kinetics at therapeutic levels → small dose changes cause large level changes. Narrow therapeutic index.",
    indications:"Seizure disorder (tonic-clonic, complex partial), status epilepticus (IV), trigeminal neuralgia (off-label).",
    dosing:[
      {indication:"Status Epilepticus (IV)",dose:"Fosphenytoin: 20 mg PE/kg IV at max 150 mg PE/min; Phenytoin: 20 mg/kg IV at max 50 mg/min",route:"IV",duration:"Loading dose; follow with maintenance",notes:"Fosphenytoin preferred (water-soluble, faster rate). Monitor ECG/BP during infusion."},
      {indication:"Maintenance (oral)",dose:"300–400mg/day PO divided TID or QD (extended-release)",route:"PO",duration:"Ongoing — level-guided",notes:"Capitalize on Dilantin ER once-daily dosing. Target level 10–20 mcg/mL (total) or 1–2.5 mcg/mL (free)."},
    ],
    renal:[
      {tier:"CrCl <30",dose:"Monitor free phenytoin levels (protein binding altered)",note:"Total levels unreliable in CKD — use free levels"},
    ],
    hepatic:"Primarily hepatic (CYP2C9/2C19). Reduce dose and monitor free levels in hepatic impairment.",
    contraindications:["Sinus bradycardia / SA block / AV block","Adams-Stokes syndrome","History of phenytoin hypersensitivity","Concurrent delavirdine"],
    warnings:["Zero-order kinetics — small dose changes = large level changes (saturable metabolism)","Purple glove syndrome (IV phenytoin extravasation — use fosphenytoin)","Cardiac arrhythmias / hypotension with rapid IV infusion","Gingival hyperplasia (long-term)","Hirsutism, coarsening of facial features","Osteoporosis with chronic use","DRESS/Stevens-Johnson syndrome (HLA-B*1502 in Asian patients)","Many drug interactions (enzyme inducer)"],
    interactions:["Warfarin (complex — initially ↑ then ↓ INR)","Carbamazepine/valproate (mutual interactions)","CYP2C9/3A4 substrates (↑ metabolism — many)","Amiodarone (↑ phenytoin levels)","Calcium/antacids/tube feeds (↓ absorption — separate 2h)"],
    monitoring:"Phenytoin levels (total + free). CBC (folate deficiency). LFTs. Bone density. Neurological exam. Gingival exam.",
    halfLife:"7–42h (dose-dependent, saturable)", pb:"90% (may be reduced in CKD/hypoalbuminemia)", renalExc:"<5%", ba:"~100% PO (slow absorption)", vd:"0.5–0.8 L/kg",
  },
  {
    id:"levetiracetam", name:"Levetiracetam", brand:"Keppra, Spritam", category:"psych",
    drugClass:"Antiepileptic (SV2A modulator)", highAlert:false, pregnancy:"C", color:"#c084fc",
    mechanism:"Binds synaptic vesicle protein SV2A → modulates neurotransmitter release. Unique mechanism unrelated to Na+/GABA channels. Broad-spectrum antiepileptic. Minimal drug interactions (not CYP-metabolized). Linear pharmacokinetics.",
    indications:"Focal seizures, generalized tonic-clonic seizures, myoclonic seizures, status epilepticus (IV), seizure prophylaxis (neurosurgery).",
    dosing:[
      {indication:"Focal / Generalized Seizures",dose:"500mg PO/IV BID; titrate by 500mg q2 weeks; max 3000mg/day",route:"PO/IV",duration:"Ongoing",notes:"IV and PO doses are interchangeable (1:1). Well tolerated — few interactions."},
      {indication:"Status Epilepticus (IV)",dose:"60 mg/kg IV (max 4500mg) over 10 min",route:"IV",duration:"Loading dose",notes:"Increasingly used as 2nd-line agent after benzodiazepines."},
    ],
    renal:[
      {tier:"CrCl >80",dose:"500–1500mg q12h",note:""},
      {tier:"CrCl 50–80",dose:"500–1000mg q12h",note:""},
      {tier:"CrCl 30–49",dose:"250–750mg q12h",note:""},
      {tier:"CrCl <30",dose:"250–500mg q12h",note:""},
      {tier:"HD",dose:"500–1000mg q24h + 250–500mg post-HD supplement",note:"HD removes significant amount"},
    ],
    hepatic:"No adjustment for hepatic impairment — primarily renally eliminated.",
    contraindications:["Hypersensitivity to levetiracetam"],
    warnings:["Behavioral side effects: irritability, aggression, depression (10–15%) — 'Keppra rage'","Somnolence, dizziness (common initially)","Rare: serious skin reactions (SJS/TEN — less common than phenytoin/carbamazepine)","Monitor for suicidality (class effect for AEDs)"],
    interactions:["Minimal CYP interactions — major advantage","Probenecid (↑ levetiracetam levels by blocking renal excretion)"],
    monitoring:"Seizure frequency/type. Renal function (eGFR). Mood/behavior assessment. CBC if concerns.",
    halfLife:"6–8h", pb:"<10%", renalExc:"~66%", ba:"~100% PO", vd:"0.5–0.7 L/kg",
  },
  {
    id:"valproate", name:"Valproate / Valproic Acid", brand:"Depakote (ER/DR), Depakene, Depacon (IV)", category:"psych",
    drugClass:"Antiepileptic / Mood Stabilizer", highAlert:true, pregnancy:"X (D for epilepsy)", color:"#818cf8",
    mechanism:"Multiple mechanisms: enhances GABA, blocks voltage-gated sodium/calcium channels, inhibits histone deacetylase (HDAC). Broad-spectrum AED and mood stabilizer. Extensively protein-bound — interaction-prone.",
    indications:"Epilepsy (all types), bipolar disorder (acute mania/maintenance), migraine prophylaxis.",
    dosing:[
      {indication:"Epilepsy / Bipolar (oral)",dose:"Start 250mg PO TID (DR) or 500mg PO daily (ER); titrate to 1000–2000mg/day; target level 50–100 mcg/mL",route:"PO",duration:"Ongoing",notes:"DR=twice daily, ER=once daily. Draw trough level."},
      {indication:"Status Epilepticus (IV)",dose:"15–45 mg/kg IV at 3–6 mg/kg/min; then 1–4 mg/kg/hr infusion",route:"IV",duration:"Loading; transition to oral",notes:""},
    ],
    renal:[{tier:"All CrCl levels",dose:"No adjustment; monitor free levels (altered protein binding in CKD)",note:""}],
    hepatic:"Avoid in hepatic disease — hepatotoxic. LFT elevation common. Fatal hepatic failure reported (esp. <2 years old). Regular LFT monitoring essential.",
    contraindications:["Hepatic disease / significant hepatic dysfunction","Urea cycle disorders","Pregnancy (major teratogen — neural tube defects, cognitive impairment)","Mitochondrial disorders (esp. POLG mutations)"],
    warnings:["⚠ Teratogenicity — neural tube defects (spina bifida ~1–2%), PCOS, cognitive effects in exposed children","Hepatotoxicity — potentially fatal; monitor LFTs","Pancreatitis (rare but serious)","Hyperammonemia (even with normal LFTs) — check NH3 in encephalopathy","Thrombocytopenia — dose-dependent","DRESS/SJS (rare)","Weight gain, hair loss"],
    interactions:["Carbamazepine (↓ valproate, ↑ carbamazepine-epoxide toxicity)","Phenytoin (complex — mutual displacement)","Lamotrigine (↑ lamotrigine levels 2× — reduce lamotrigine dose)","Aspirin (↑ free valproate — displaces from albumin)","Meropenem (↓ valproate levels ↓50% — avoid combination)"],
    monitoring:"Trough valproate level (target 50–100 mcg/mL; manic 85–100). LFTs. CBC (platelets). NH3 if encephalopathy. Weight.",
    halfLife:"9–19h (DR); variable", pb:"80–95%", renalExc:"~3%", ba:"~100% PO", vd:"0.1–0.5 L/kg",
  },
  {
    id:"haloperidol", name:"Haloperidol", brand:"Haldol", category:"psych",
    drugClass:"Typical Antipsychotic (Butyrophenone, 1st Generation)", highAlert:false, pregnancy:"C", color:"#e879f9",
    mechanism:"Potent D2 receptor blocker in mesolimbic/mesocortical pathways. Also blocks D1, alpha-1, H1 (weak). High D2 affinity → higher extrapyramidal side effect (EPS) risk than atypicals. IV haloperidol used for agitation (off-label).",
    indications:"Acute agitation (IV/IM), schizophrenia, delirium (ICU), Tourette syndrome, nausea/vomiting (off-label), Huntington's disease.",
    dosing:[
      {indication:"Acute Agitation / ICU Delirium",dose:"0.5–2mg IV/IM q2–4h PRN (elderly: 0.25–0.5mg)",route:"IV/IM",duration:"Short-term; reassess daily",notes:"IV use is off-label; associated with QTc prolongation. Monitor ECG."},
      {indication:"Schizophrenia (oral)",dose:"0.5–5mg PO BID–TID; max 100mg/day",route:"PO",duration:"Ongoing",notes:"Decanoate depot: 10–15× daily PO dose IM monthly."},
    ],
    renal:[{tier:"All CrCl levels",dose:"No adjustment; reduce dose in severe CKD (sensitivity)",note:""}],
    hepatic:"Reduce dose in hepatic impairment. Primarily hepatic metabolism. Monitor for toxicity.",
    contraindications:["Parkinson's disease (worsens)","Lewy body dementia (risk of severe EPS/neuroleptic sensitivity)","Severe CNS depression","QTc >500ms","Hypersensitivity"],
    warnings:["EPS: akathisia, dystonia, pseudoparkinsonism, tardive dyskinesia (long-term)","NMS — rare but life-threatening (fever, rigidity, autonomic instability, altered consciousness)","QTc prolongation — especially IV route","Elderly with dementia → ↑ mortality (FDA black box)","Anticholinergic effects (mild)"],
    interactions:["QT-prolonging drugs (additive)","CNS depressants (additive sedation)","Lithium (rare NMS-like reaction)","CYP3A4/CYP2D6 inhibitors (↑ haloperidol levels)","Carbamazepine (↓ haloperidol levels)"],
    monitoring:"ECG (QTc with IV use). EPS assessment (AIMS). Metabolic panel (less concern than atypicals). Mental status.",
    halfLife:"12–36h (oral); 3 weeks (decanoate)", pb:"92%", renalExc:"~40%", ba:"~60–70% PO (first-pass)", vd:"9–21 L/kg",
  },
  {
    id:"naloxone", name:"Naloxone", brand:"Narcan, Kloxxado, Zimhi", category:"analgesic",
    drugClass:"Opioid Antagonist", highAlert:false, pregnancy:"C", color:"#f97316",
    mechanism:"Competitive antagonist at mu, kappa, and delta opioid receptors. Reverses opioid-induced respiratory depression, sedation, and miosis. Shorter half-life than most opioids — repeat dosing or infusion may be required.",
    indications:"Opioid overdose reversal (IV/IM/IN/SQ), opioid-induced respiratory depression, postoperative opioid reversal, opioid-induced pruritus.",
    dosing:[
      {indication:"Opioid Overdose (IV)",dose:"0.4–2mg IV/IM/IN q2–3 min PRN; repeat until RR >12 or responsive",route:"IV/IM/IN",duration:"Repeat doses; infusion if long-acting opioid",notes:"If no response after 10mg total, reconsider diagnosis. IN admin: 4mg in each nostril (Narcan nasal)."},
      {indication:"IV Infusion (long-acting opioid OD)",dose:"2/3 of effective reversal dose per hour",route:"IV infusion",duration:"Until opioid effect resolves",notes:"Duration of fentanyl/methadone >> duration of naloxone."},
    ],
    renal:[{tier:"All CrCl levels",dose:"No adjustment",note:""}],
    hepatic:"No adjustment.",
    contraindications:["Known hypersensitivity to naloxone","Use with extreme caution in opioid-dependent patients (precipitates acute withdrawal)"],
    warnings:["Acute opioid withdrawal — agitation, seizures, hypertension, vomiting, pulmonary edema","Renarcotization — naloxone wears off before opioid (repeat doses / infusion needed)","Pulmonary edema (rare, mechanism unclear)","Does NOT reverse buprenorphine effectively at standard doses"],
    interactions:["Opioid analgesics (antagonizes effect)","Buprenorphine (partial reversal — may need higher doses)"],
    monitoring:"Respiratory rate, O2 sat. Mental status. Re-sedation (watch for renarcotization ≥1h post-reversal). Withdrawal signs.",
    halfLife:"30–120 min", pb:"45%", renalExc:"~70%", ba:"~0% PO; ~100% IM/IV", vd:"2.6 L/kg",
  },
  {
    id:"tramadol", name:"Tramadol", brand:"Ultram, ConZip", category:"analgesic",
    drugClass:"Centrally Acting Analgesic (Weak Opioid + SNRI, Schedule IV)", highAlert:false, pregnancy:"C", color:"#fbbf24",
    mechanism:"Dual mechanism: weak mu-opioid receptor agonist AND inhibits norepinephrine/serotonin reuptake. Active metabolite O-desmethyltramadol (M1) is more potent opioid agonist (CYP2D6-dependent). Atypical opioid with lower abuse potential but still Schedule IV.",
    indications:"Moderate to moderately-severe pain (acute and chronic), neuropathic pain.",
    dosing:[
      {indication:"Moderate Pain (IR)",dose:"50–100mg PO q4–6h PRN; max 400mg/day (300mg if >75y)",route:"PO",duration:"Short-term preferred",notes:"Start low in elderly (50mg q6h). Use CR for chronic pain."},
    ],
    renal:[
      {tier:"CrCl ≥30",dose:"Standard dose",note:""},
      {tier:"CrCl <30",dose:"50mg q12h; max 200mg/day",note:"Extended interval; avoid ER formulations"},
      {tier:"HD",dose:"50mg q12h",note:"Partially removed by HD"},
    ],
    hepatic:"Severe hepatic impairment: 50mg q12h. Avoid ER formulation. Reduced metabolism.",
    contraindications:["MAOIs within 14 days","Concurrent or recent serotonergic drugs (serotonin syndrome risk)","Seizure disorder (↓ seizure threshold)","Children <12 (respiratory depression)","Codeine/tramadol in CYP2D6 ultra-rapid metabolizers"],
    warnings:["Seizures — dose-dependent, especially with concurrent SSRIs, TCAs, bupropion","Serotonin syndrome — with SSRIs, SNRIs, MAOIs, triptans","Respiratory depression at high doses or CYP2D6 ultrarapid metabolizers","Physical dependence despite Schedule IV status","CYP2D6 variability — ultrarapid metabolizers have excessive M1 conversion"],
    interactions:["MAOIs (CONTRAINDICATED — serotonin crisis)","SSRIs/SNRIs (↑ serotonin syndrome + ↓ tramadol activation via CYP2D6)","TCAs (↑ serotonin, ↓ seizure threshold)","CNS depressants (additive)","Carbamazepine (↓ tramadol levels — CYP induction)"],
    monitoring:"Pain response. Respiratory status. Seizure history. Serotonin toxicity signs. Renal function.",
    halfLife:"5–7h (M1: 9h)", pb:"20%", renalExc:"~90%", ba:"~75% PO (IR)", vd:"2.6–2.9 L/kg",
  },
  {
    id:"dexamethasone", name:"Dexamethasone", brand:"Decadron, DexPak", category:"other",
    drugClass:"Corticosteroid (High-Potency Glucocorticoid)", highAlert:false, pregnancy:"C", color:"#f87171",
    mechanism:"Potent synthetic glucocorticoid (~25× more potent than hydrocortisone). Minimal mineralocorticoid activity. Binds GCR → suppresses inflammation, immune response. Penetrates CNS well (brain edema reduction). Long half-life → once-daily dosing.",
    indications:"Cerebral edema, croup (airway edema), PONV, severe asthma/COPD exacerbation, spinal cord compression, adrenal insufficiency, COVID-19 (RECOVERY trial), CAP adjunct, meningitis, multiple myeloma.",
    dosing:[
      {indication:"Cerebral Edema",dose:"10mg IV loading, then 4mg IV q6h",route:"IV",duration:"Until definitive treatment; taper when able",notes:""},
      {indication:"Croup",dose:"0.6 mg/kg PO/IM (max 10–16mg) × 1 dose",route:"PO/IM",duration:"Single dose",notes:"Single dose highly effective for moderate-severe croup."},
      {indication:"COVID-19 / Severe Illness",dose:"6mg PO/IV daily ×10 days",route:"PO/IV",duration:"10 days",notes:"RECOVERY trial: mortality benefit in O2-requiring patients."},
    ],
    renal:[{tier:"All CrCl levels",dose:"No adjustment",note:""}],
    hepatic:"Use with caution in severe hepatic disease. Minimal mineralocorticoid activity (unlike prednisone) may be advantageous.",
    contraindications:["Systemic fungal infections (without antifungal)","Live vaccines during immunosuppressive doses","Hypersensitivity"],
    warnings:["Immunosuppression","Hyperglycemia","HPA axis suppression with prolonged use","Avascular necrosis (long-term)","GI bleeding (combined with NSAIDs)","Psychiatric effects","Delayed wound healing"],
    interactions:["NSAIDs (↑ GI bleeding)","Live vaccines (contraindicated)","CYP3A4 inducers (rifampin — ↓ levels)","Antidiabetics (↑ glucose)","Warfarin (variable effect)"],
    monitoring:"Blood glucose. BP. Signs of infection. HPA function if prolonged.",
    halfLife:"1.8–3.5h (plasma); biological t½ 36–54h", pb:"77%", renalExc:"~65%", ba:"~78% PO", vd:"2 L/kg",
  },
  {
    id:"cyclosporine", name:"Cyclosporine", brand:"Sandimmune, Neoral, Gengraf", category:"other",
    drugClass:"Calcineurin Inhibitor (Immunosuppressant)", highAlert:true, pregnancy:"C", color:"#a78bfa",
    mechanism:"Binds cyclophilin → inhibits calcineurin → blocks IL-2 transcription → prevents T-cell activation. Sandimmune (oil-based) vs Neoral/Gengraf (microemulsion — better bioavailability, not interchangeable). Narrow therapeutic index.",
    indications:"Solid organ transplant rejection prevention (kidney/liver/heart), rheumatoid arthritis, psoriasis, nephrotic syndrome.",
    dosing:[
      {indication:"Transplant Maintenance",dose:"3–5 mg/kg/day PO divided BID (Neoral/Gengraf)",route:"PO",duration:"Ongoing — trough-guided",notes:"Target trough by organ type (kidney: 100–200 ng/mL). Neoral ≠ Sandimmune (different PK — NOT interchangeable)."},
    ],
    renal:[{tier:"All CrCl levels",dose:"No dose adjustment, but cyclosporine itself is nephrotoxic — monitor SCr",note:"Reduce dose if SCr rises >25% above baseline"}],
    hepatic:"Significant hepatic metabolism (CYP3A4). Dose adjust in severe hepatic impairment. Monitor levels closely.",
    contraindications:["Uncontrolled hypertension","Abnormal renal function (transplant)","Malignancy (except skin CA in psoriasis — relative)","Concurrent PUVA or methotrexate without specialist oversight"],
    warnings:["Nephrotoxicity (acute + chronic) — dose-dependent","Hypertension — occurs in >50%","Neurotoxicity (tremor, headache, seizures)","Hyperlipidemia","Hirsutism, gingival hyperplasia","Lymphoma/malignancy with prolonged immunosuppression","Multiple serious drug interactions (CYP3A4 substrate and P-gp substrate)"],
    interactions:["CYP3A4 inhibitors (ketoconazole, diltiazem, verapamil, grapefruit — ↑ toxic levels)","CYP3A4 inducers (rifampin, carbamazepine — ↓ levels → rejection)","Nephrotoxic agents (vancomycin, aminoglycosides, NSAIDs — additive nephrotoxicity)","Statins (↑ myopathy — cap statin doses)","Potassium-sparing agents (hyperkalemia)"],
    monitoring:"Trough levels q1–2 weeks (transplant), then monthly. SCr, BUN, K+, LFTs, CBC, BP, lipids. Skin exam.",
    halfLife:"5–18h (dose-dependent)", pb:"90%", renalExc:"<1%", ba:"20–50% PO (Sandimmune); 30–60% (Neoral)", vd:"3–5 L/kg",
  },
  {
    id:"allopurinol", name:"Allopurinol", brand:"Zyloprim, Aloprim", category:"other",
    drugClass:"Xanthine Oxidase Inhibitor", highAlert:false, pregnancy:"C", color:"#fbbf24",
    mechanism:"Inhibits xanthine oxidase → reduces conversion of xanthine to uric acid → lowers serum urate. Also reduces oxidative stress. Prophylactic — does NOT treat acute gout attacks. Allopurinol → oxypurinol (active metabolite, renally cleared).",
    indications:"Chronic gout prevention (not acute attacks), hyperuricemia (chemo tumor lysis syndrome), recurrent calcium oxalate nephrolithiasis.",
    dosing:[
      {indication:"Chronic Gout Prevention",dose:"Start 100mg PO daily; titrate by 100mg q2–4 weeks; target SUA <6 mg/dL; usual dose 200–600mg/day",route:"PO",duration:"Ongoing",notes:"Do NOT start during acute attack (worsens/prolongs). Start with colchicine/NSAID prophylaxis ×6 months."},
      {indication:"Tumor Lysis Syndrome (prophylaxis)",dose:"300–800mg/day PO in divided doses starting 1–2 days before chemo",route:"PO",duration:"3–7 days",notes:""},
    ],
    renal:[
      {tier:"CrCl ≥90",dose:"300mg/day (start)",note:"Titrate to SUA target"},
      {tier:"CrCl 60–89",dose:"200mg/day",note:""},
      {tier:"CrCl 30–59",dose:"100mg/day",note:"Oxypurinol accumulates"},
      {tier:"CrCl <30",dose:"50–100mg/day or q48–72h",note:"Significant oxypurinol accumulation → DRESS risk"},
      {tier:"HD",dose:"100mg post-HD 3× weekly",note:""},
    ],
    hepatic:"No specific adjustment; monitor for toxicity.",
    contraindications:["Acute gout attack (do not start)","HLA-B*5801 positive patients (Han Chinese, Thai, Korean — very high DRESS/SJS risk — screen first)"],
    warnings:["DRESS syndrome — potentially fatal (fever, rash, internal organ involvement)","Start low and titrate — abrupt high doses → acute gout flare","Acute gout flares common when starting (prophylax with colchicine)","Monitor for azathioprine/6-MP toxicity (critical interaction)"],
    interactions:["Azathioprine/6-mercaptopurine (CRITICAL — allopurinol blocks their metabolism → life-threatening toxicity; reduce AZA/6-MP by 75%)","Warfarin (↑ INR)","Ampicillin/amoxicillin (↑ rash risk — avoid in gout)","Theophylline (↑ levels)","Ciclosporin (↑ levels)"],
    monitoring:"Serum uric acid q2–4 weeks until target (<6 mg/dL), then q6 months. Renal function. CBC. LFTs. Rash.",
    halfLife:"1–2h (allopurinol); 15–30h (oxypurinol)", pb:"0–5%", renalExc:"~70% (oxypurinol)", ba:"~80–90% PO", vd:"0.6 L/kg",
  },
  {
    id:"colchicine", name:"Colchicine", brand:"Colcrys, Gloperba, Lodoco", category:"other",
    drugClass:"Anti-inflammatory (Tubulin Inhibitor)", highAlert:true, pregnancy:"C", color:"#fb923c",
    mechanism:"Binds tubulin → prevents microtubule polymerization → inhibits neutrophil migration, chemotaxis, and inflammatory cascade. Also blocks NLRP3 inflammasome (involved in gout, pericarditis). Does NOT lower uric acid. Narrow therapeutic index.",
    indications:"Acute gout treatment, gout flare prophylaxis (during urate-lowering initiation), familial Mediterranean fever (FMF), acute/recurrent pericarditis, ASCVD risk reduction (LoDoCo2 trial).",
    dosing:[
      {indication:"Acute Gout",dose:"1.2mg PO × 1, then 0.6mg 1h later (total 1.8mg); then 0.6mg BID for 1 week",route:"PO",duration:"1 week",notes:"Start within 36–48h of attack onset for best effect. Low-dose just as effective as high-dose with fewer GI effects."},
      {indication:"Gout Prophylaxis",dose:"0.6mg PO daily or BID",route:"PO",duration:"6 months after starting urate-lowering therapy",notes:""},
    ],
    renal:[
      {tier:"CrCl ≥60",dose:"Standard dose",note:""},
      {tier:"CrCl 30–59",dose:"Reduce frequency; max 0.6mg daily for prophylaxis",note:""},
      {tier:"CrCl <30",dose:"0.3mg daily; use with extreme caution",note:"Toxicity risk — myopathy, cytopenias"},
      {tier:"HD",dose:"0.3mg 2–3× weekly (not daily)",note:"Colchicine NOT removed by HD"},
    ],
    hepatic:"Avoid in severe hepatic impairment combined with renal impairment. Primarily biliary/fecal elimination.",
    contraindications:["Concurrent P-gp + strong CYP3A4 inhibitors (e.g., clarithromycin + cyclosporine) — life-threatening toxicity","Severe renal/hepatic impairment (combined)"],
    warnings:["Toxicity: GI (nausea, diarrhea, vomiting) — first sign of toxicity","Neuromuscular toxicity: myopathy, rhabdomyolysis (esp. with statins, cyclosporine, fibrates)","Bone marrow suppression at toxic doses","Life-threatening interaction with P-gp + strong CYP3A4 inhibitors","NARROW THERAPEUTIC INDEX"],
    interactions:["Clarithromycin/erythromycin (↑ levels significantly — reduce colchicine dose)","Cyclosporine (↑ levels — reduce dose)","Statins (↑ myopathy)","P-gp inhibitors (↑ colchicine toxicity)","CYP3A4 inhibitors (grapefruit, azole antifungals — ↑ levels)"],
    monitoring:"GI symptoms (toxicity sign). CBC. CK if myalgia. Renal function. Drug interactions.",
    halfLife:"27–31h", pb:"~39%", renalExc:"~40–65%", ba:"~45% PO", vd:"6–12 L/kg",
  },
  {
    id:"gabapentin", name:"Gabapentin", brand:"Neurontin, Gralise, Horizant", category:"psych",
    drugClass:"Gabapentinoid (Antiepileptic / Neuropathic Agent)", highAlert:false, pregnancy:"C", color:"#a3e635",
    mechanism:"Binds alpha-2-delta subunit of voltage-gated calcium channels → reduces Ca2+ influx → decreases excitatory neurotransmitter release (glutamate, substance P). No activity at GABA receptors despite name. Renal elimination — no hepatic metabolism, no drug interactions.",
    indications:"Postherpetic neuralgia, focal seizures (adjunct), restless legs syndrome (Horizant), fibromyalgia (off-label), neuropathic pain (DPN, central pain).",
    dosing:[
      {indication:"Neuropathic Pain",dose:"Start 300mg PO nightly; titrate to 300mg TID–1200mg TID; max 3600mg/day",route:"PO",duration:"Ongoing — reassess periodically",notes:"Titrate slowly to minimize sedation/dizziness."},
      {indication:"Seizures (adjunct)",dose:"300–600mg PO TID; max 3600mg/day",route:"PO",duration:"Ongoing",notes:""},
    ],
    renal:[
      {tier:"CrCl ≥60",dose:"Standard dose (300–1200mg TID)",note:""},
      {tier:"CrCl 30–59",dose:"200–700mg BID",note:"Reduce dose proportional to CrCl"},
      {tier:"CrCl 15–29",dose:"200–700mg daily",note:""},
      {tier:"CrCl <15",dose:"100–300mg daily",note:""},
      {tier:"HD",dose:"100–300mg post-HD after each session",note:"Supplement post-HD"},
    ],
    hepatic:"No adjustment — not hepatically metabolized.",
    contraindications:["Hypersensitivity to gabapentin","Acute-onset pancreatitis (rare)"],
    warnings:["CNS depression: somnolence, dizziness (common, especially initially)","Respiratory depression (especially with opioids, benzodiazepines — FDA warning added 2019)","Misuse/abuse potential (especially in opioid users) — some states added to controlled list","DRESS (rare)","Suicidality (class AED warning)","Ataxia, nystagmus","Abrupt discontinuation → withdrawal seizures","Weight gain, peripheral edema"],
    interactions:["Opioids/CNS depressants (↑ respiratory depression — FDA boxed warning)","Antacids (↓ absorption 20% — separate 2h)","Morphine (↑ gabapentin levels by 44%)"],
    monitoring:"Pain/seizure response. CNS side effects. Weight. Renal function. Signs of misuse.",
    halfLife:"5–7h", pb:"<3%", renalExc:"~100% unchanged", ba:"27–60% PO (dose-dependent; saturatable)", vd:"0.6–0.8 L/kg",
  },
  {
    id:"bupropion", name:"Bupropion", brand:"Wellbutrin, Zyban, Aplenzin", category:"psych",
    drugClass:"Antidepressant / Smoking Cessation (NDRI)", highAlert:false, pregnancy:"C", color:"#f472b6",
    mechanism:"Norepinephrine-dopamine reuptake inhibitor (NDRI). Weak nicotinic acetylcholine receptor antagonist (mechanism for smoking cessation). No serotonergic activity — minimal sexual side effects. No weight gain (often weight loss).",
    indications:"Major depressive disorder, seasonal affective disorder, smoking cessation (Zyban), ADHD (off-label), bipolar depression (with mood stabilizer).",
    dosing:[
      {indication:"MDD (SR)",dose:"Start 150mg PO daily ×3 days; then 150mg BID; max 400mg/day",route:"PO",duration:"At least 6 months for MDD",notes:"Avoid >150mg single dose — seizure risk. Allow ≥8h between SR doses."},
      {indication:"Smoking Cessation (Zyban)",dose:"150mg PO daily ×3 days; then 150mg BID for 7–12 weeks",route:"PO",duration:"7–12 weeks",notes:"Start 1–2 weeks before quit date."},
    ],
    renal:[{tier:"CrCl <30 / HD",dose:"Max 150mg q48h",note:"Active metabolites accumulate — seizure risk"}],
    hepatic:"Severe hepatic impairment: max 75mg daily (IR) or 100mg every other day (SR) or 150mg every other day (XL).",
    contraindications:["Seizure disorder or conditions that lower seizure threshold","Bulimia/anorexia (↑ seizure risk)","MAOIs within 14 days","Abrupt discontinuation of alcohol/benzodiazepines","Linezolid or methylene blue"],
    warnings:["Seizures — dose-dependent; max single dose 150mg (SR)","Neuropsychiatric adverse effects: anxiety, agitation, hallucinations, suicidal ideation","Hypertension (new or worsened)","QTc prolongation (modest)","Activating antidepressant — may worsen anxiety/insomnia initially","NOT to be used with MAOIs (hypertensive crisis)"],
    interactions:["MAOIs (CONTRAINDICATED — hypertensive crisis, serotonin syndrome)","CYP2D6 substrates (potent inhibitor — ↑ levels of TCAs, antipsychotics, metoprolol)","Linezolid/methylene blue (serotonin-like reaction)","Alcohol (↑ seizure risk)","Carbamazepine (↓ bupropion levels)"],
    monitoring:"BP. Mood/psychiatric symptoms. Seizure history. Smoking cessation (if applicable). Weight.",
    halfLife:"21h (XL formulation)", pb:"84%", renalExc:"~87%", ba:"~5–20% PO (first-pass)", vd:"20–47 L/kg",
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
  const navigate = useNavigate();
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

  // ── Fuzzy search engine ────────────────────────────────────────────────────
  function fuzzyScore(drug, q) {
    if (!q) return { match: true, score: 0, fields: [] };
    const ql = q.toLowerCase().trim();
    const tokens = ql.split(/\s+/).filter(Boolean);
    const fields = [
      { key: "name",        weight: 100, val: drug.name },
      { key: "brand",       weight: 80,  val: drug.brand },
      { key: "drugClass",   weight: 60,  val: drug.drugClass },
      { key: "indications", weight: 40,  val: drug.indications },
      { key: "mechanism",   weight: 20,  val: drug.mechanism },
      { key: "monitoring",  weight: 15,  val: drug.monitoring || "" },
      { key: "interactions",weight: 10,  val: (drug.interactions || []).join(" ") },
    ];

    let totalScore = 0;
    const matchedFields = [];

    for (const token of tokens) {
      let tokenMatched = false;
      for (const f of fields) {
        const vl = f.val.toLowerCase();
        if (vl.includes(token)) {
          // Exact word boundary bonus
          const wordBoundary = new RegExp(`\\b${token.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}`, 'i').test(f.val);
          const bonus = wordBoundary ? 2 : 1;
          const startBonus = vl.startsWith(token) ? 3 : 1;
          totalScore += f.weight * bonus * startBonus;
          if (!matchedFields.includes(f.key)) matchedFields.push(f.key);
          tokenMatched = true;
        }
      }
      if (!tokenMatched) {
        // Try substring fuzzy: all chars of token appear in order in name/brand
        const nameL = drug.name.toLowerCase();
        const brandL = drug.brand.toLowerCase();
        let ni = 0, bi = 0;
        for (const ch of token) { if (nameL.indexOf(ch, ni) !== -1) { ni = nameL.indexOf(ch, ni) + 1; } }
        for (const ch of token) { if (brandL.indexOf(ch, bi) !== -1) { bi = brandL.indexOf(ch, bi) + 1; } }
        if (ni >= token.length) { totalScore += 10; if (!matchedFields.includes("name")) matchedFields.push("name"); }
        else if (bi >= token.length) { totalScore += 8; if (!matchedFields.includes("brand")) matchedFields.push("brand"); }
        else return { match: false, score: 0, fields: [] }; // unmatched token → exclude
      }
    }
    return { match: totalScore > 0, score: totalScore, fields: matchedFields };
  }

  const filteredDrugs = (() => {
    const matchCat = d => activeCat === "all" || d.category === activeCat;
    if (!searchQ.trim()) return DRUG_DB.filter(matchCat);
    return DRUG_DB
      .map(d => ({ drug: d, ...fuzzyScore(d, searchQ) }))
      .filter(r => r.match && matchCat(r.drug))
      .sort((a, b) => b.score - a.score)
      .map(r => r.drug);
  })();

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