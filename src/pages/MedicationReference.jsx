import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

const T = {
  bg:'#050f1e',panel:'#081628',card:'#0b1e36',up:'#0e2544',
  border:'#1a3555',borderHi:'#2a4f7a',
  blue:'#3b9eff',teal:'#00e5c0',gold:'#f5c842',coral:'#ff6b6b',
  orange:'#ff9f43',txt:'#e8f0fe',txt2:'#8aaccc',txt3:'#4a6a8a',txt4:'#2e4a6a',
};

/* ═══════════════════ DRUGS DB ═══════════════════ */
const DRUGS_DB = {
  chestPain: {
    label:'🫀 Chest Pain / ACS', drugs:[
      {name:'Aspirin 325 mg PO',dose:'325 mg PO',class:'Antiplatelet',onset:'15-30 min',notes:'Give immediately. Chew, do not swallow whole. Avoid if true ASA allergy or active GI bleed.'},
      {name:'Nitroglycerin 0.4 mg SL',dose:'0.4 mg SL q5min x3',class:'Vasodilator',onset:'1-3 min',notes:'Hold if SBP <90, RV infarction suspected, or recent PDE5 inhibitor use (sildenafil, tadalafil).'},
      {name:'Heparin UFH',dose:'60 U/kg bolus (max 4000U), 12 U/kg/hr drip IV',class:'Anticoagulant',onset:'Immediate',notes:'Adjust for weight. Monitor aPTT. Avoid with recent surgery or bleeding risk. Used in STEMI/NSTEMI.'},
      {name:'Morphine 2-4 mg IV',dose:'2-4 mg IV q5-15min PRN',class:'Opioid Analgesic',onset:'5-10 min',notes:'Use cautiously — associated with worse outcomes in NSTEMI in some studies. Consider fentanyl alternative.'},
      {name:'Ticagrelor 180 mg loading PO',dose:'180 mg loading, then 90 mg BID',class:'P2Y12 Inhibitor',onset:'30 min',notes:'Preferred over clopidogrel. Avoid with prior intracranial hemorrhage. Note: Do NOT use if fibrinolytic given.'},
      {name:'Clopidogrel 600 mg loading PO',dose:'600 mg loading, then 75 mg daily',class:'P2Y12 Inhibitor',onset:'2-6 hrs',notes:'Use if ticagrelor unavailable or contraindicated. CYP2C19 poor metabolizers have reduced efficacy.'},
      {name:'Metoprolol IV',dose:'5 mg IV q5min x3, then 25-50 mg PO q6h',class:'Beta-Blocker',onset:'5 min IV',notes:'Avoid in decompensated HF, cardiogenic shock, PR >0.24s, 2nd/3rd degree block, severe reactive airway.'},
    ]
  },
  anaphylaxis: {
    label:'⚠️ Anaphylaxis', drugs:[
      {name:'Epinephrine 1:1000 IM',dose:'0.3-0.5 mg IM (anterolateral thigh)',class:'Sympathomimetic',onset:'3-5 min',notes:'FIRST-LINE. Repeat q5-15min. Do NOT delay for antihistamines. Autoinjectors preferred in pre-hospital.'},
      {name:'Diphenhydramine 25-50 mg IV/IM',dose:'25-50 mg IV/IM q4-6h',class:'Antihistamine',onset:'15-30 min',notes:'Adjunct only. Does NOT reverse anaphylaxis. Treats urticaria/pruritus. Causes sedation.'},
      {name:'Famotidine 20 mg IV',dose:'20 mg IV over 2 min',class:'H2 Blocker',onset:'15-30 min',notes:'H2 antagonist adjunct to diphenhydramine. Mild additional benefit for skin/GI symptoms.'},
      {name:'Methylprednisolone 125 mg IV',dose:'125 mg IV once',class:'Corticosteroid',onset:'4-6 hrs',notes:'Prevents biphasic reaction (onset 4-12h delayed). Not effective acutely. Give early regardless.'},
      {name:'Albuterol 2.5 mg nebulized',dose:'2.5 mg neb PRN for bronchospasm',class:'Beta-2 Agonist',onset:'5-15 min',notes:'For bronchospasm component of anaphylaxis. Adjunct to epinephrine, not a replacement.'},
      {name:'Normal Saline 1-2 L bolus IV',dose:'1-2 L IV bolus',class:'Crystalloid',onset:'Immediate',notes:'Aggressive fluid resuscitation for distributive shock. Consider laying patient supine. May need vasopressors.'},
    ]
  },
  respiratory: {
    label:'🫁 Respiratory / Asthma / COPD', drugs:[
      {name:'Albuterol 2.5 mg neb',dose:'2.5 mg neb q20min x3, then q1-4h',class:'Beta-2 Agonist',onset:'5-15 min',notes:'First-line bronchodilator. Continuous nebulization for severe asthma. Monitor K+ — can cause hypokalemia.'},
      {name:'Ipratropium 0.5 mg neb',dose:'0.5 mg neb q20min x3',class:'Anticholinergic',onset:'15-30 min',notes:'Additive effect with albuterol. Most benefit in first 24h of COPD exacerbation. Less effective in asthma alone.'},
      {name:'Prednisone 40-60 mg PO',dose:'40-60 mg PO daily x5-7 days',class:'Corticosteroid',onset:'4-6 hrs',notes:'Oral equivalent to IV methylprednisolone. Use for moderate exacerbations. Start ASAP.'},
      {name:'Methylprednisolone 125 mg IV',dose:'125 mg IV, then 40-80 mg q6-8h',class:'Corticosteroid',onset:'4-6 hrs',notes:'Use for severe/intubated patients. Taper for courses >5 days. No superiority over oral if gut works.'},
      {name:'Magnesium Sulfate 2 g IV',dose:'2 g IV over 20 min',class:'Bronchodilator',onset:'15-20 min',notes:'For severe/life-threatening asthma not responding to standard therapy. Inhibits calcium-mediated bronchoconstriction.'},
      {name:'BiPAP',dose:'IPAP 10-15 cmH₂O, EPAP 4-5 cmH₂O',class:'Ventilatory Support',onset:'Immediate',notes:'First-line non-invasive ventilation for COPD exacerbation. Reduces intubation rate. Contraindicated if unable to protect airway.'},
      {name:'Epinephrine 1:1000 IM/SQ',dose:'0.3-0.5 mg IM/SQ q20min x3',class:'Sympathomimetic',onset:'3-5 min',notes:'For anaphylaxis-related bronchospasm or severe refractory asthma. Use with caution in elderly/cardiac history.'},
    ]
  },
  seizure: {
    label:'🧠 Seizures / Status Epilepticus', drugs:[
      {name:'Lorazepam 4 mg IV',dose:'4 mg IV over 2 min',class:'Benzodiazepine',onset:'1-3 min',notes:'First-line IV benzo. Repeat in 5-10 min if seizure continues. Watch for respiratory depression. Have bag-valve mask ready.'},
      {name:'Midazolam 10 mg IM',dose:'10 mg IM (>40 kg), 5 mg IM (13-40 kg)',class:'Benzodiazepine',onset:'3-5 min IM',notes:'Preferred when no IV access. RAMPART trial: non-inferior to IV lorazepam. Fastest buccal/nasal onset.'},
      {name:'Diazepam 10 mg PR',dose:'0.2-0.5 mg/kg PR (max 20 mg)',class:'Benzodiazepine',onset:'5-10 min',notes:'Rectal route for home use or when no IV/IM access. Use Diastat gel. Absorption variable.'},
      {name:'Levetiracetam IV',dose:'60 mg/kg IV over 10 min (max 4500 mg)',class:'Anticonvulsant',onset:'15-30 min',notes:'Second-line after benzodiazepines. Fewer drug interactions. No hepatic enzyme induction. Safe in pregnancy.'},
      {name:'Fosphenytoin IV',dose:'20 mg PE/kg IV at max 150 mg PE/min',class:'Anticonvulsant',onset:'10-20 min',notes:'Use fosphenytoin (not phenytoin) IV. Monitor for hypotension and cardiac arrhythmias. Check levels.'},
      {name:'Phenobarbital 20 mg/kg IV',dose:'20 mg/kg IV at 60 mg/min',class:'Barbiturate',onset:'15-30 min',notes:'Third-line agent. High risk of respiratory depression — intubation likely needed. Excellent seizure suppression.'},
    ]
  },
  pain: {
    label:'💊 Pain Management', drugs:[
      {name:'Acetaminophen 1000 mg IV/PO',dose:'1000 mg IV/PO q6h (max 4 g/day)',class:'Analgesic',onset:'15-30 min',notes:'Safest first-line non-opioid. Reduce to 500-650 mg in hepatic impairment. IV offers no benefit over PO if functional gut.'},
      {name:'Ibuprofen 400-800 mg PO',dose:'400-800 mg PO q6-8h with food',class:'NSAID',onset:'30-60 min',notes:'Avoid in renal insufficiency, GI bleed, >65 yo, or cardiovascular disease. Max 3.2 g/day.'},
      {name:'Ketorolac 15-30 mg IV',dose:'15-30 mg IV/IM, max 5 days total',class:'NSAID',onset:'10-15 min',notes:'Most evidence for renal colic and musculoskeletal pain. Do not exceed 5 days total NSAID therapy. Avoid if CrCl <30.'},
      {name:'Morphine 4-6 mg IV',dose:'0.1 mg/kg IV (typical 4-6 mg) q3-4h',class:'Opioid',onset:'5-10 min',notes:'Weight-based dosing preferred. Titrate to effect. Caution in renal failure (active metabolite). Histamine release.'},
      {name:'Fentanyl 50-100 mcg IV',dose:'1-1.5 mcg/kg IV (typical 50-100 mcg)',class:'Opioid',onset:'2-3 min',notes:'Preferred in hemodynamic instability or renal failure. Rapid onset/offset. Intranasal 2 mcg/kg for no-IV access.'},
      {name:'Ketamine subdissociative',dose:'0.3 mg/kg IV (typical 20-30 mg) over 10 min',class:'NMDA Antagonist',onset:'1-2 min',notes:'Emerging role in ED pain. Preserves airway and hemodynamics. May cause dysphoria — infuse slowly. Good for procedural pain.'},
      {name:'Lidocaine 1% local',dose:'Max 4.5 mg/kg (7 mg/kg with epi)',class:'Local Anesthetic',onset:'2-5 min',notes:'For local infiltration. Do not exceed max dose. Epinephrine contraindicated in digits, nose, ears, and penis.'},
    ]
  },
  acls: {
    label:'⚡ Cardiac Arrest / ACLS', drugs:[
      {name:'Epinephrine 1 mg IV',dose:'1 mg IV/IO q3-5min (1:10,000)',class:'Sympathomimetic',onset:'Immediate',notes:'Standard dose. Increases coronary and cerebral perfusion pressure. No survival benefit beyond ROSC when given late.'},
      {name:'Amiodarone IV',dose:'300 mg IV bolus, then 150 mg; or 5 mg/kg',class:'Antiarrhythmic',onset:'Immediate',notes:'For shock-refractory VF/pVT. Can cause hypotension. Use peripheral IV or IO. Preferred over lidocaine in cardiac arrest.'},
      {name:'Lidocaine IV',dose:'1-1.5 mg/kg IV, repeat 0.5-0.75 mg/kg q5-10min',class:'Antiarrhythmic',onset:'1-2 min',notes:'Alternative to amiodarone for VF/pVT. Max 3 mg/kg total. May be preferred if amiodarone unavailable.'},
      {name:'Atropine 1 mg IV',dose:'1 mg IV q3-5min (max 3 mg)',class:'Anticholinergic',onset:'1-2 min',notes:'For symptomatic bradycardia. NOT recommended in asystole or PEA (removed from AHA 2010 ACLS for arrest). Use for symptomatic sinus bradycardia.'},
      {name:'Calcium Chloride 10% 1g IV',dose:'1 g (10 mL of 10%) IV slow push',class:'Electrolyte',onset:'1-3 min',notes:'For hyperkalemia, hypocalcemia, CCB overdose, hypermagnesemia. NOT in sodium bicarb line (precipitates). 3x the calcium of calcium gluconate.'},
      {name:'Sodium Bicarbonate 1 mEq/kg IV',dose:'1 mEq/kg IV',class:'Buffer',onset:'Immediate',notes:'For hyperkalemia, TCA overdose, severe metabolic acidosis. Use AFTER adequate ventilation established. Flush line before/after.'},
    ]
  },
  stroke: {
    label:'🧠 Stroke / CVA', drugs:[
      {name:'Alteplase (tPA)',dose:'0.9 mg/kg IV (max 90 mg); 10% bolus, 90% over 60 min',class:'Thrombolytic',onset:'Immediate',notes:'Within 3-4.5h of ischemic stroke onset. Absolute contraindications: hemorrhage on CT, BP >185/110 after treatment, prior ICH, recent major surgery.'},
      {name:'Tenecteplase',dose:'0.25 mg/kg IV single bolus (max 25 mg)',class:'Thrombolytic',onset:'Immediate',notes:'Emerging alternative to tPA — single bolus, fibrin-specific. Non-inferior in multiple trials. Simpler administration. Same contraindications as alteplase.'},
      {name:'Labetalol IV',dose:'10-20 mg IV q10-20min (max 300 mg)',class:'Beta-Blocker',onset:'5-10 min',notes:'For BP management in stroke. Target BP <185/110 before tPA. Avoid in heart block, decompensated HF, reactive airway.'},
      {name:'Nicardipine drip',dose:'5 mg/hr IV, titrate by 2.5 mg/hr q5-15min (max 15 mg/hr)',class:'CCB',onset:'5-15 min',notes:'Preferred continuous antihypertensive for stroke. Precise titration. Requires ICU monitoring. Avoid in heart failure.'},
      {name:'Aspirin 325 mg PO/PR',dose:'325 mg PO/PR after tPA exclusion',class:'Antiplatelet',onset:'15-30 min',notes:'Give within 24-48h of ischemic stroke if tPA not given. DELAY 24h if tPA administered. Do NOT give for hemorrhagic stroke.'},
    ]
  },
  sepsis: {
    label:'🦠 Sepsis / Septic Shock', drugs:[
      {name:'Normal Saline 30 mL/kg',dose:'30 mL/kg IV bolus over 1-3h',class:'Crystalloid',onset:'Immediate',notes:'Hour-1 bundle requirement. May give in 500 mL increments with reassessment. Reassess after each bolus for fluid overload.'},
      {name:"Lactated Ringer's",dose:'30 mL/kg IV bolus',class:'Balanced Crystalloid',onset:'Immediate',notes:'Preferred over NS for large volume resuscitation (lower hyperchloremic acidosis risk). SMART trial: superior outcomes vs NS in critically ill.'},
      {name:'Norepinephrine',dose:'0.1-0.5 mcg/kg/min IV drip (titrate to MAP ≥65)',class:'Vasopressor',onset:'Immediate',notes:'First-line vasopressor for septic shock. Requires central line for prolonged use. Start peripherally while CVC placed.'},
      {name:'Vasopressin',dose:'0.03-0.04 units/min IV (fixed dose)',class:'Vasopressor',onset:'Immediate',notes:'Second vasopressor — add to norepinephrine when doses escalating. Fixed dose, not weight-based. Can spare norepinephrine dose.'},
      {name:'Vancomycin',dose:'25-30 mg/kg IV (AUC-guided dosing)',class:'Antibiotic',onset:'1-2 hrs',notes:'For MRSA coverage. Infuse over 1-2h to reduce Red Man syndrome. Monitor levels. AUC/MIC goal 400-600 mg·h/L.'},
      {name:'Piperacillin-Tazobactam 4.5g',dose:'4.5 g IV q6h (extended infusion 4h preferred)',class:'Antibiotic',onset:'30-60 min',notes:'Broad gram-negative + anaerobic coverage. Extended infusion preferred for PK/PD optimization. Adjust for renal function.'},
      {name:'Meropenem 1 g IV',dose:'1 g IV q8h',class:'Antibiotic',onset:'30-60 min',notes:'For high-risk infections, ESBL/MDR organisms, or Pseudomonas aeruginosa. De-escalate when cultures finalized.'},
      {name:'Hydrocortisone 100 mg IV',dose:'100 mg IV q8h (or 50 mg q6h)',class:'Corticosteroid',onset:'1-2 hrs',notes:'For refractory septic shock — when MAP requires high vasopressor doses. SSC 2021: add fludrocortisone 50 mcg daily (optional).'},
    ]
  },
  overdose: {
    label:'☠️ Overdose / Toxicology', drugs:[
      {name:'Naloxone IV/IN',dose:'0.4-2 mg IV/IM/IN; titrate to respirations',class:'Opioid Antagonist',onset:'1-2 min IV',notes:'Titrate carefully — precipitates acute withdrawal. IN dose 2 mg. Repeated dosing for long-acting opioids. Duration 30-90 min (shorter than most opioids — redose!).'},
      {name:'Activated Charcoal',dose:'1 g/kg PO (max 50 g)',class:'Adsorbent',onset:'15-30 min',notes:'Give within 1-2h of ingestion. Avoid if aspiration risk, ileus, or bowel obstruction. Most effective for salicylates, carbamazepine, phenobarbital.'},
      {name:'N-Acetylcysteine (NAC)',dose:'150 mg/kg IV over 1h → 50 mg/kg over 4h → 100 mg/kg over 16h',class:'Antidote',onset:'30-60 min',notes:'APAP antidote. Best within 8h of ingestion, but give up to 24h (or longer if ALT elevated). Monitor LFTs, INR. Oral protocol alternative.'},
      {name:'Flumazenil',dose:'0.2 mg IV q1min (max 3 mg)',class:'Benzo Antagonist',onset:'1-2 min',notes:'CAUTION: Use only in pure benzodiazepine OD — seizures if TCA or mixed OD. Duration <1h — re-sedation likely. Avoid if benzo-dependent.'},
      {name:'Sodium Bicarbonate (TCA OD)',dose:'1-2 mEq/kg IV bolus',class:'Buffer',onset:'1-5 min',notes:'For TCA-induced wide-complex dysrhythmia or hypotension. Target serum pH 7.45-7.55. Continuous infusion 150 mEq/L in D5W.'},
      {name:'Intralipid 20%',dose:'1.5 mL/kg IV bolus, then 0.25 mL/kg/min x60 min',class:'Lipid Emulsion',onset:'Immediate',notes:'For lipophilic drug toxicity: bupivacaine, verapamil, propranolol, amitriptyline. "Lipid sink" mechanism. May repeat bolus x2.'},
    ]
  },
  psychiatric: {
    label:'🧘 Psychiatric / Agitation', drugs:[
      {name:'Haloperidol 5-10 mg IM',dose:'5-10 mg IM',class:'Antipsychotic',onset:'15-30 min',notes:'Classic agent for ED agitation. Risk of QTc prolongation and EPS (akathisia, dystonia). Check ECG for QTc. Give Benadryl if EPS risk.'},
      {name:'Olanzapine 10 mg IM',dose:'10 mg IM',class:'Atypical Antipsychotic',onset:'15-30 min',notes:'Do NOT give IV olanzapine with benzodiazepine (respiratory depression risk). Oral form available. Good for meth-associated agitation.'},
      {name:'Midazolam 5 mg IM',dose:'5 mg IM',class:'Benzodiazepine',onset:'5-10 min IM',notes:'Fastest IM onset for agitation. Monitor for respiratory depression. DMAA trial: non-inferior to Haldol+Versed combination.'},
      {name:'Lorazepam 2 mg IV/IM',dose:'2 mg IV/IM q30min PRN',class:'Benzodiazepine',onset:'5-15 min',notes:'Good for alcohol withdrawal agitation. Avoid in opiate intoxication without airway monitoring. Monitor respiratory rate.'},
      {name:'Droperidol 2.5-5 mg IM',dose:'2.5-5 mg IM',class:'Butyrophenone',onset:'5-10 min',notes:'Rapid onset, highly effective. FDA black-box QTc warning — obtain baseline ECG if possible. Often preferred in ETOH-related agitation.'},
      {name:'Ketamine 4-5 mg/kg IM',dose:'4-5 mg/kg IM for extreme agitation',class:'NMDA Antagonist',onset:'3-5 min IM',notes:'For severely agitated patients where safety is immediate concern. Dissociative dose. Airway usually maintained. Monitor closely — have airway equipment.'},
    ]
  },
};

const PEDS_DRUGS = [
  {name:'Acetaminophen',mgPerKg:15,maxMg:1000,route:'PO/PR',freq:'q4-6h',solutions:[{label:'Infant Drops 80mg/0.8mL',concMgPerMl:100,unit:'mL'},{label:"Children's Liquid 160mg/5mL",concMgPerMl:32,unit:'mL'},{label:'Jr Strength Tab 160mg',concMgPerMl:160,unit:'tab',isTab:true}],notes:'Safe first-line analgesic/antipyretic. Max 75 mg/kg/day, not to exceed 4 g/day.'},
  {name:'Ibuprofen',mgPerKg:10,maxMg:400,route:'PO',freq:'q6-8h',solutions:[{label:'Infant Drops 50mg/1.25mL',concMgPerMl:40,unit:'mL'},{label:"Children's Liquid 100mg/5mL",concMgPerMl:20,unit:'mL'},{label:'Jr Strength Tab 100mg',concMgPerMl:100,unit:'tab',isTab:true}],notes:'Anti-inflammatory, analgesic, antipyretic. Avoid <6 months, renal impairment.'},
  {name:'Amoxicillin',mgPerKg:45,maxMg:1000,route:'PO',freq:'q12h',solutions:[{label:'125mg/5mL',concMgPerMl:25,unit:'mL'},{label:'250mg/5mL',concMgPerMl:50,unit:'mL'},{label:'400mg/5mL',concMgPerMl:80,unit:'mL'}],notes:'For otitis media, strep pharyngitis, mild pneumonia. High-dose regimen for AOM.'},
  {name:'Ondansetron (Zofran)',mgPerKg:0.15,maxMg:4,route:'IV/PO/ODT',freq:'q6-8h',solutions:[{label:'ODT 4mg',concMgPerMl:4,unit:'tab',isTab:true},{label:'Oral Solution 4mg/5mL',concMgPerMl:0.8,unit:'mL'},{label:'IV 2mg/mL',concMgPerMl:2,unit:'mL'}],notes:'Excellent antiemetic. Safe in children. ODT for outpatient use. Do not use if prolonged QT.'},
  {name:'Dexamethasone',mgPerKg:0.6,maxMg:16,route:'PO/IV/IM',freq:'Once daily x1-2d',solutions:[{label:'Oral Solution 1mg/mL',concMgPerMl:1,unit:'mL'},{label:'Elixir 0.5mg/5mL',concMgPerMl:0.1,unit:'mL'},{label:'IV 4mg/mL',concMgPerMl:4,unit:'mL'}],notes:'For croup (single dose PO), asthma exacerbation. Superior to prednisolone compliance.'},
  {name:'Prednisolone',mgPerKg:1,maxMg:60,route:'PO',freq:'Once daily x3-5d',solutions:[{label:'Prelone 15mg/5mL',concMgPerMl:3,unit:'mL'},{label:'Orapred 15mg/5mL',concMgPerMl:3,unit:'mL'},{label:'Pediapred 5mg/5mL',concMgPerMl:1,unit:'mL'}],notes:'Asthma, croup, allergic reactions. Liquid form well-tolerated in younger children.'},
  {name:'Epinephrine (Anaphylaxis IM)',mgPerKg:0.01,maxMg:0.3,route:'IM',freq:'q5-15min PRN',solutions:[{label:'1:1000 1mg/mL',concMgPerMl:1,unit:'mL'},{label:'EpiPen Jr 0.15mg (15-30kg)',concMgPerMl:0.15,unit:'dose',isDose:true},{label:'EpiPen 0.3mg (>30kg)',concMgPerMl:0.3,unit:'dose',isDose:true}],notes:'FIRST-LINE anaphylaxis. Anterolateral thigh. Do not delay. Repeat every 5-15 minutes.'},
  {name:'Albuterol (Neb)',mgPerKg:0.15,maxMg:5,route:'Neb',freq:'q20min x3 then q1-4h',solutions:[{label:'0.5% 5mg/mL',concMgPerMl:5,unit:'mL'},{label:'Unit dose 2.5mg/3mL',concMgPerMl:0.83,unit:'mL'},{label:'Unit dose 1.25mg/3mL',concMgPerMl:0.42,unit:'mL'}],notes:'Bronchodilator for asthma/wheeze. Continuous for severe. Min dose 1.25 mg for any weight.'},
  {name:'Ceftriaxone',mgPerKg:50,maxMg:2000,route:'IV/IM',freq:'q24h',solutions:[{label:'IV reconstituted 100mg/mL',concMgPerMl:100,unit:'mL'},{label:'IM reconstituted 250mg/mL',concMgPerMl:250,unit:'mL'}],notes:'Broad-spectrum cephalosporin. PNA, UTI, meningitis, Lyme disease. Caution: neonatal jaundice.'},
  {name:'Midazolam (Seizure)',mgPerKg:0.2,maxMg:10,route:'IN/IM/IV',freq:'May repeat x1 in 5 min',solutions:[{label:'5mg/mL IM/IN',concMgPerMl:5,unit:'mL'},{label:'1mg/mL IV',concMgPerMl:1,unit:'mL'},{label:'Nasal spray 50mg/mL',concMgPerMl:50,unit:'mL'}],notes:'Preferred IM/IN route for acute seizures without IV. Nasal mucosal atomization device preferred for IN.'},
  {name:'Lorazepam (Seizure)',mgPerKg:0.1,maxMg:4,route:'IV',freq:'May repeat x1 in 5-10 min',solutions:[{label:'2mg/mL IV',concMgPerMl:2,unit:'mL'},{label:'4mg/mL IV',concMgPerMl:4,unit:'mL'}],notes:'First-line IV benzodiazepine for status epilepticus. Monitor airway closely. Prepare for intubation.'},
  {name:'Diphenhydramine',mgPerKg:1.25,maxMg:50,route:'PO/IV/IM',freq:'q6h',solutions:[{label:'Elixir 12.5mg/5mL',concMgPerMl:2.5,unit:'mL'},{label:'Chewable Tab 12.5mg',concMgPerMl:12.5,unit:'tab',isTab:true},{label:'IV/IM 50mg/mL',concMgPerMl:50,unit:'mL'}],notes:'Antihistamine for allergic reactions. Sedating — caution when driving. Avoid <2 years old.'},
];

const SEPSIS_BUNDLE = [
  {id:'lactate',label:'Measure lactate level',critical:true},
  {id:'cultures',label:'Obtain blood cultures before antibiotics',critical:true},
  {id:'antibiotics',label:'Administer broad-spectrum antibiotics',critical:true},
  {id:'fluids',label:'Administer 30 mL/kg crystalloid for hypotension or lactate ≥4',critical:true},
  {id:'vasopressors',label:'Apply vasopressors if hypotensive during/after fluids to maintain MAP ≥65',critical:false},
];
const REASSESS_BUNDLE = [
  {id:'volume',label:'Reassess volume status and tissue perfusion',critical:true},
  {id:'lactate2',label:'Re-measure lactate if initial lactate elevated',critical:false},
  {id:'sofa',label:'Assess for organ dysfunction (SOFA score)',critical:false},
];

const QUICK_QUERIES = ['SVT','Migraine','DKA','Hyperkalemia','PE / Pulmonary Embolism','Croup','RSI Intubation'];

/* ═══════════════════ CSS ═══════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=JetBrains+Mono:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap');
.mr-wrap *,.mr-wrap *::before,.mr-wrap *::after{box-sizing:border-box}
.mr-wrap{font-family:'DM Sans',sans-serif;font-size:14px;color:${T.txt};min-height:100vh;background:${T.bg};position:relative}
.mr-scanline{position:fixed;inset:0;background:repeating-linear-gradient(to bottom,transparent 0px,transparent 3px,rgba(0,229,192,0.012) 3px,rgba(0,229,192,0.012) 4px);pointer-events:none;z-index:0}
.mr-toolbar{position:sticky;top:0;z-index:100;background:${T.panel};border-bottom:1px solid ${T.border};padding:10px 24px;display:flex;align-items:center;gap:12px;backdrop-filter:blur(10px)}
.mr-toolbar-title{font-family:'Playfair Display',serif;font-size:18px;font-weight:700;color:${T.txt}}
.mr-toolbar-sub{font-size:11px;color:${T.txt3};font-family:'JetBrains Mono',monospace;letter-spacing:.05em}
.mr-v3badge{display:flex;align-items:center;gap:5px;background:rgba(0,229,192,.08);border:1px solid rgba(0,229,192,.25);border-radius:20px;padding:3px 10px;font-family:'JetBrains Mono',monospace;font-size:10px;color:${T.teal};margin-left:auto}
.mr-aipulse{width:7px;height:7px;border-radius:50%;background:${T.teal};animation:mrpulse 2s ease-in-out infinite;flex-shrink:0}
.mr-aipulse.coral{background:${T.coral};animation:mrpulsecoral 2s ease-in-out infinite}
@keyframes mrpulse{0%,100%{box-shadow:0 0 0 0 rgba(0,229,192,.4)}50%{box-shadow:0 0 0 6px rgba(0,229,192,0)}}
@keyframes mrpulsecoral{0%,100%{box-shadow:0 0 0 0 rgba(255,107,107,.4)}50%{box-shadow:0 0 0 6px rgba(255,107,107,0)}}
.mr-tabs{position:sticky;top:53px;z-index:99;background:${T.panel};border-bottom:1px solid ${T.border};padding:0 24px;display:flex;gap:0;backdrop-filter:blur(10px)}
.mr-tab{padding:12px 20px;font-size:12px;font-weight:600;cursor:pointer;border-bottom:2px solid transparent;color:${T.txt3};transition:all .2s;white-space:nowrap;font-family:'DM Sans',sans-serif}
.mr-tab:hover{color:${T.txt2}}
.mr-tab.active{color:${T.teal};border-bottom-color:${T.teal}}
.mr-body{position:relative;z-index:1;max-width:1100px;margin:0 auto;padding:24px 24px 60px}
.mr-search{background:${T.up};border:1px solid ${T.border};border-radius:10px;padding:10px 14px;color:${T.txt};font-family:'DM Sans',sans-serif;font-size:14px;outline:none;width:100%;transition:border-color .15s}
.mr-search:focus{border-color:${T.borderHi}}
.mr-search::placeholder{color:${T.txt4}}
.mr-cat-btns{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px}
.mr-cat-btn{padding:5px 12px;border-radius:20px;font-size:11px;cursor:pointer;border:1px solid ${T.border};background:${T.up};color:${T.txt2};transition:all .15s;font-family:'DM Sans',sans-serif;white-space:nowrap}
.mr-cat-btn:hover{border-color:${T.borderHi};color:${T.txt}}
.mr-cat-btn.active{background:rgba(59,158,255,.12);border-color:${T.blue};color:${T.blue}}
.mr-drug-list{display:flex;flex-direction:column;gap:6px;margin-top:14px}
.mr-drug-row{background:${T.card};border:1px solid ${T.border};border-radius:10px;overflow:hidden;cursor:pointer;transition:border-color .15s}
.mr-drug-row:hover{border-color:${T.borderHi}}
.mr-drug-row.expanded{border-color:rgba(0,229,192,.35)}
.mr-drug-hdr{padding:10px 14px;display:flex;align-items:center;gap:10px}
.mr-drug-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;transition:all .2s}
.mr-drug-dot.dim{background:${T.txt4}}
.mr-drug-dot.lit{background:${T.teal};box-shadow:0 0 6px rgba(0,229,192,.5)}
.mr-drug-name{font-weight:600;font-size:13px;color:${T.txt};flex:1}
.mr-drug-dose{font-family:'JetBrains Mono',monospace;font-size:11px;color:${T.teal};margin-top:1px}
.mr-badge{padding:2px 8px;border-radius:20px;font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:700;white-space:nowrap}
.mr-badge.teal{background:rgba(0,229,192,.1);color:${T.teal};border:1px solid rgba(0,229,192,.25)}
.mr-badge.gold{background:rgba(245,200,66,.1);color:${T.gold};border:1px solid rgba(245,200,66,.25)}
.mr-badge.blue{background:rgba(59,158,255,.1);color:${T.blue};border:1px solid rgba(59,158,255,.25)}
.mr-badge.coral{background:rgba(255,107,107,.12);color:${T.coral};border:1px solid rgba(255,107,107,.3)}
.mr-badge.orange{background:rgba(255,159,67,.1);color:${T.orange};border:1px solid rgba(255,159,67,.25)}
.mr-drug-expand{padding:10px 14px 14px 32px;border-top:1px solid ${T.border}}
.mr-drug-notes{background:${T.up};border-left:3px solid rgba(0,229,192,.4);border-radius:0 6px 6px 0;padding:10px 12px;font-size:12px;color:${T.txt2};line-height:1.65;margin-top:8px}
.mr-input{background:${T.up};border:1px solid ${T.border};border-radius:8px;padding:9px 12px;color:${T.txt};font-family:'DM Sans',sans-serif;font-size:14px;outline:none;transition:border-color .15s}
.mr-input:focus{border-color:${T.borderHi}}
.mr-input::placeholder{color:${T.txt4}}
.mr-card{background:${T.card};border:1px solid ${T.border};border-radius:12px;padding:18px}
.mr-card.teal-glow{box-shadow:0 0 20px rgba(0,229,192,.06)}
.mr-card.coral-border{border-color:rgba(255,107,107,.3);background:rgba(255,107,107,.04)}
.mr-peds-drug{background:${T.card};border:1px solid ${T.border};border-radius:10px;padding:14px;margin-bottom:8px}
.mr-dose-result{background:rgba(0,229,192,.06);border:1px solid rgba(0,229,192,.2);border-radius:8px;padding:10px 14px;margin-top:8px}
.mr-dose-result.capped{background:rgba(245,200,66,.06);border-color:rgba(245,200,66,.3)}
.mr-dose-val{font-family:'JetBrains Mono',monospace;font-size:22px;font-weight:800;color:${T.teal}}
.mr-dose-val.capped{color:${T.gold}}
.mr-select{background:${T.up};border:1px solid ${T.border};border-radius:6px;padding:7px 10px;color:${T.txt};font-size:12px;outline:none;width:100%;margin-top:8px;font-family:'DM Sans',sans-serif}
.mr-select option{background:${T.card}}
.mr-vol-result{background:rgba(59,158,255,.08);border:1px solid rgba(59,158,255,.25);border-radius:6px;padding:8px 12px;margin-top:6px;font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:700;color:${T.blue}}
.mr-ai-input-wrap{display:flex;gap:8px;margin-top:10px}
.mr-ai-btn{background:rgba(0,229,192,.1);border:1px solid rgba(0,229,192,.3);border-radius:8px;padding:9px 18px;color:${T.teal};font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;transition:all .15s;letter-spacing:.04em}
.mr-ai-btn:hover{background:rgba(0,229,192,.18);border-color:${T.teal}}
.mr-ai-btn:disabled{opacity:.4;pointer-events:none}
.mr-ai-btn.coral{background:rgba(255,107,107,.1);border-color:rgba(255,107,107,.3);color:${T.coral}}
.mr-ai-btn.coral:hover{background:rgba(255,107,107,.18);border-color:${T.coral}}
.mr-quick-btns{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
.mr-quick-btn{padding:4px 12px;border-radius:16px;font-size:11px;cursor:pointer;border:1px solid ${T.border};background:${T.up};color:${T.txt2};transition:all .15s;font-family:'DM Sans',sans-serif}
.mr-quick-btn:hover{border-color:${T.borderHi};color:${T.txt}}
.mr-loader{display:flex;gap:6px;align-items:center;padding:16px 0}
.mr-loader-dot{width:8px;height:8px;border-radius:50%;background:${T.teal};animation:mrdotpulse 1.4s ease-in-out infinite}
.mr-loader-dot.coral{background:${T.coral}}
@keyframes mrdotpulse{0%,80%,100%{transform:scale(0.6);opacity:.3}40%{transform:scale(1);opacity:1}}
.mr-ai-response{margin-top:16px;display:flex;flex-direction:column;gap:6px}
.mr-ai-line{font-size:13px;color:${T.txt2};line-height:1.7}
.mr-ai-line.h1,.mr-ai-line.h2,.mr-ai-line.h3{font-family:'Playfair Display',serif;color:${T.teal};font-weight:600}
.mr-ai-line.h1{font-size:17px;margin-top:8px}.mr-ai-line.h2{font-size:15px;margin-top:6px}.mr-ai-line.h3{font-size:13px;margin-top:4px}
.mr-ai-line.bullet{padding-left:16px}
.mr-ai-line.warn{background:rgba(255,107,107,.07);border-left:3px solid rgba(255,107,107,.5);border-radius:0 6px 6px 0;padding:6px 10px;color:${T.coral};margin:4px 0}
.mr-disclaimer{background:rgba(255,107,107,.06);border:1px solid rgba(255,107,107,.2);border-radius:8px;padding:10px 14px;font-size:11px;color:${T.coral};margin-top:14px;line-height:1.6}
.mr-checklist-item{display:flex;align-items:flex-start;gap:10px;padding:10px 14px;border-radius:8px;cursor:pointer;transition:all .15s;margin-bottom:5px}
.mr-checklist-item.critical{background:rgba(255,107,107,.07);border:1px solid rgba(255,107,107,.2)}
.mr-checklist-item.normal{background:${T.card};border:1px solid ${T.border}}
.mr-checklist-item.checked{opacity:.6}
.mr-check-icon{width:22px;height:22px;border-radius:5px;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;margin-top:1px}
.mr-check-icon.crit{background:rgba(255,107,107,.15);color:${T.coral}}
.mr-check-icon.norm{background:${T.up};color:${T.txt3}}
.mr-check-icon.done{background:rgba(0,229,192,.15);color:${T.teal}}
.mr-footer{border-top:1px solid ${T.border};padding:20px 0 0;text-align:center;display:flex;flex-direction:column;gap:4px;margin-top:40px}
.mr-back-btn{background:${T.up};border:1px solid ${T.border};border-radius:6px;padding:5px 12px;color:${T.txt2};cursor:pointer;font-size:12px;font-family:'DM Sans',sans-serif;display:flex;align-items:center;gap:4px;transition:all .15s}
.mr-back-btn:hover{border-color:${T.borderHi};color:${T.txt}}
.mr-sepsis-fluid{background:rgba(255,107,107,.06);border:1px solid rgba(255,107,107,.3);border-radius:10px;padding:16px;margin-top:10px}
.mr-sepsis-fluid-val{font-family:'JetBrains Mono',monospace;font-size:30px;font-weight:800;color:${T.coral}}
`;

/* ═══════════════════ MARKDOWN RENDERER ═══════════════════ */
function renderAIResponse(text) {
  return text.split('\n').map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={i} style={{height:4}} />;
    if (trimmed.startsWith('### ')) return <div key={i} className="mr-ai-line h3">{trimmed.slice(4)}</div>;
    if (trimmed.startsWith('## ')) return <div key={i} className="mr-ai-line h2">{trimmed.slice(3)}</div>;
    if (trimmed.startsWith('# ')) return <div key={i} className="mr-ai-line h1">{trimmed.slice(2)}</div>;
    const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ');
    const isWarn = /critical|warning|⚠/i.test(trimmed);
    const content = isBullet ? '› ' + trimmed.slice(2) : trimmed;
    const bold = content.replace(/\*\*(.*?)\*\*/g, '$1');
    const parts = content.split(/\*\*(.*?)\*\*/g);
    const rendered = parts.map((p, j) => j % 2 === 1 ? <strong key={j} style={{color:T.txt,fontWeight:700}}>{p}</strong> : p);
    return (
      <div key={i} className={`mr-ai-line${isBullet?' bullet':''}${isWarn?' warn':''}`}>
        {rendered}
      </div>
    );
  });
}

function LoadingDots({ coral }) {
  return (
    <div>
      <div className="mr-loader">
        {[0,1,2,3,4].map(i => (
          <div key={i} className={`mr-loader-dot${coral?' coral':''}`} style={{animationDelay:`${i*0.14}s`}} />
        ))}
        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:coral?T.coral:T.teal,letterSpacing:'.08em',marginLeft:8}}>
          {coral ? 'SEPSIS ENGINE · SSC 2021 × DRUGS_DB' : 'PROCESSING · DRUGS_DB × GUIDELINES ENGINE'}
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════ MAIN PAGE ═══════════════════ */
export default function MedicationReference() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('drugs');
  const [selectedCat, setSelectedCat] = useState('chestPain');
  const [drugSearch, setDrugSearch] = useState('');
  const [expandedDrug, setExpandedDrug] = useState(null);
  const [pedsWeight, setPedsWeight] = useState('');
  const [pedsSearch, setPedsSearch] = useState('');
  const [selectedSolutions, setSelectedSolutions] = useState({});
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [sepsisWeight, setSepsisWeight] = useState('');
  const [sepsisQuery, setSepsisQuery] = useState('');
  const [sepsisAiResponse, setSepsisAiResponse] = useState(null);
  const [sepsisLoading, setSepsisLoading] = useState(false);
  const [sepsisChecked, setSepsisChecked] = useState({});
  const [reassessChecked, setReassessChecked] = useState({});

  /* ─── Drug Search ─── */
  const allDrugs = Object.entries(DRUGS_DB).flatMap(([catKey, cat]) =>
    cat.drugs.map(d => ({ ...d, catKey, catLabel: cat.label }))
  );
  const searchActive = drugSearch.trim().length > 0;
  const filteredDrugs = searchActive
    ? allDrugs.filter(d =>
        d.name.toLowerCase().includes(drugSearch.toLowerCase()) ||
        d.class.toLowerCase().includes(drugSearch.toLowerCase()) ||
        (d.notes || '').toLowerCase().includes(drugSearch.toLowerCase()) ||
        d.catLabel.toLowerCase().includes(drugSearch.toLowerCase())
      )
    : DRUGS_DB[selectedCat]?.drugs || [];

  /* ─── AI Search ─── */
  const runAI = async () => {
    if (!aiQuery.trim() || aiLoading) return;
    setAiLoading(true);
    setAiResponse(null);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an emergency medicine clinical decision support AI. Provide evidence-based medication recommendations for this ED presentation.

ED Complaint: ${aiQuery}

Provide first-line and second-line options with doses, routes, contraindications, and guideline references (ACEP, AHA, SSC 2021). Use ## headers, bullet points with -, and **bold** for drug names. Include a CRITICAL SAFETY note if relevant. End with: "Clinical judgment should always prevail."`,
      });
      setAiResponse(typeof res === 'string' ? res : JSON.stringify(res));
    } catch {
      setAiResponse('⚠ AI Engine offline. Using local Drugs_DB fallback. Refer to the ED Drug Reference tab for medication guidance.');
    }
    setAiLoading(false);
  };

  /* ─── Sepsis AI ─── */
  const wt = parseFloat(sepsisWeight) || 0;
  const bolus = Math.round(wt * 30);
  const runSepsisAI = async () => {
    if (!sepsisQuery.trim() || sepsisLoading || !wt) return;
    setSepsisLoading(true);
    setSepsisAiResponse(null);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a Sepsis Protocol AI engine following Surviving Sepsis Campaign 2021 guidelines.

Patient Weight: ${wt} kg
Calculated Fluid Bolus: ${bolus} mL
Suspected Source: ${sepsisQuery}

Provide a complete sepsis protocol recommendation including Hour-1 Bundle, antibiotic selection based on suspected source, vasopressor guidance, and lactate monitoring. Use ## headers, bullet points with -, and **bold** for drug names. Include CRITICAL SAFETY warnings. End with: "Clinical judgment should always prevail."`,
      });
      setSepsisAiResponse(typeof res === 'string' ? res : JSON.stringify(res));
    } catch {
      setSepsisAiResponse(`⚠ AI Engine offline.\n## Manual Protocol\n- **Fluid Bolus:** ${bolus} mL (30 mL/kg × ${wt} kg)\n- **Vancomycin:** ${Math.round(wt*25)}-${Math.round(wt*30)} mg IV\n- **Pip-Tazo:** 4.5 g IV q6h\n- **Vasopressor:** Norepinephrine if MAP <65\n- Remeasure lactate in 2-4 hours`);
    }
    setSepsisLoading(false);
  };

  /* ─── Peds helpers ─── */
  const pedsWt = parseFloat(pedsWeight) || 0;
  const ageCategory = pedsWt < 4 ? 'Neonate (<4 kg)' : pedsWt < 10 ? 'Infant (4-10 kg)' : pedsWt < 20 ? 'Toddler (10-20 kg)' : pedsWt < 30 ? 'Child (20-30 kg)' : pedsWt < 50 ? 'School Age (30-50 kg)' : 'Adolescent (>50 kg)';
  const bsa = pedsWt > 0 ? (Math.sqrt(pedsWt * 170) / 60).toFixed(2) : null;
  const filteredPedsDrugs = pedsSearch.trim()
    ? PEDS_DRUGS.filter(d => d.name.toLowerCase().includes(pedsSearch.toLowerCase()) || d.route.toLowerCase().includes(pedsSearch.toLowerCase()) || d.notes.toLowerCase().includes(pedsSearch.toLowerCase()))
    : PEDS_DRUGS;

  function calcPedsDose(drug) {
    if (!pedsWt) return null;
    const raw = pedsWt * drug.mgPerKg;
    const final = Math.min(raw, drug.maxMg);
    return { raw, final, capped: raw > drug.maxMg };
  }
  function calcVolume(drug, solIdx) {
    const dose = calcPedsDose(drug);
    if (!dose) return null;
    const sol = drug.solutions[solIdx];
    if (!sol) return null;
    if (sol.isDose) return { val: (dose.final / sol.concMgPerMl).toFixed(1), unit: 'dose(s)' };
    if (sol.isTab) return { val: (dose.final / sol.concMgPerMl).toFixed(1), unit: 'tab(s)' };
    return { val: (dose.final / sol.concMgPerMl).toFixed(2), unit: 'mL' };
  }

  const toggleCheck = (id, setState) => setState(prev => ({ ...prev, [id]: !prev[id] }));

  /* ─── Render ─── */
  return (
    <>
      <style>{CSS}</style>
      <div className="mr-wrap">
        <div className="mr-scanline" />

        {/* Toolbar */}
        <div className="mr-toolbar">
          <button className="mr-back-btn" onClick={() => navigate(-1)}>← Back</button>
          <div>
            <div className="mr-toolbar-title">Notrya AI</div>
            <div className="mr-toolbar-sub">ED MEDICATION REFERENCE</div>
          </div>
          <div className="mr-v3badge">
            <div className="mr-aipulse" />
            V3 · DRUGS_DB ENGINE
          </div>
        </div>

        {/* Tabs */}
        <div className="mr-tabs">
          {[['drugs','💊 ED Drug Ref'],['peds','👶 Peds Dosing'],['ai','🤖 AI Search'],['sepsis','🦠 Sepsis Protocol']].map(([id,label]) => (
            <div key={id} className={`mr-tab${tab===id?' active':''}`} onClick={() => setTab(id)}>{label}</div>
          ))}
        </div>

        <div className="mr-body">

          {/* ═══ TAB 1: ED DRUG REF ═══ */}
          {tab === 'drugs' && (
            <div>
              <input className="mr-search" placeholder="Search drugs, classes, or complaints..." value={drugSearch} onChange={e => setDrugSearch(e.target.value)} />

              {!searchActive && (
                <div className="mr-cat-btns">
                  {Object.entries(DRUGS_DB).map(([key, cat]) => (
                    <button key={key} className={`mr-cat-btn${selectedCat===key?' active':''}`} onClick={() => setSelectedCat(key)}>
                      {cat.label}
                    </button>
                  ))}
                </div>
              )}

              {searchActive && (
                <div style={{marginTop:8,fontSize:11,color:T.txt3,fontFamily:"'JetBrains Mono',monospace"}}>
                  {filteredDrugs.length} results across all categories
                </div>
              )}

              <div className="mr-drug-list">
                {filteredDrugs.map((drug, i) => {
                  const key = (searchActive ? drug.catKey : selectedCat) + '_' + i;
                  const isExp = expandedDrug === key;
                  return (
                    <div key={key} className={`mr-drug-row${isExp?' expanded':''}`} onClick={() => setExpandedDrug(isExp ? null : key)}>
                      <div className="mr-drug-hdr">
                        <div className={`mr-drug-dot${isExp?' lit':' dim'}`} />
                        <div style={{flex:1}}>
                          <div className="mr-drug-name">{drug.name}</div>
                          <div className="mr-drug-dose">{drug.dose}</div>
                          {searchActive && <div style={{fontSize:10,color:T.txt4,marginTop:2}}>{drug.catLabel}</div>}
                        </div>
                        <span className="mr-badge teal">{drug.route || 'IV/PO'}</span>
                        <span className="mr-badge gold" style={{marginLeft:4}}>{drug.onset}</span>
                      </div>
                      {isExp && (
                        <div className="mr-drug-expand">
                          <span className="mr-badge blue">{drug.class}</span>
                          <div className="mr-drug-notes">{drug.notes}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {filteredDrugs.length === 0 && (
                  <div style={{textAlign:'center',padding:32,color:T.txt3}}>No drugs found for "{drugSearch}"</div>
                )}
              </div>
            </div>
          )}

          {/* ═══ TAB 2: PEDS DOSING ═══ */}
          {tab === 'peds' && (
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              <div className="mr-card teal-glow">
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:600,marginBottom:12}}>👶 Pediatric Dose Calculator</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                  <div>
                    <div style={{fontSize:10,color:T.txt3,fontFamily:"'JetBrains Mono',monospace",textTransform:'uppercase',letterSpacing:'.06em',marginBottom:5}}>Patient Weight (kg)</div>
                    <input className="mr-input" style={{width:'100%'}} type="number" placeholder="Enter weight in kg" value={pedsWeight} onChange={e => setPedsWeight(e.target.value)} />
                  </div>
                  {pedsWt > 0 && (
                    <div style={{display:'flex',flexDirection:'column',gap:5}}>
                      <div style={{padding:'7px 12px',background:T.up,border:`1px solid ${T.border}`,borderRadius:7}}>
                        <div style={{fontSize:9,color:T.txt3,fontFamily:"'JetBrains Mono',monospace",letterSpacing:'.06em'}}>AGE CATEGORY</div>
                        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,fontWeight:700,color:T.blue,marginTop:2}}>{ageCategory}</div>
                      </div>
                      <div style={{padding:'7px 12px',background:T.up,border:`1px solid ${T.border}`,borderRadius:7}}>
                        <div style={{fontSize:9,color:T.txt3,fontFamily:"'JetBrains Mono',monospace",letterSpacing:'.06em'}}>BSA (m²)</div>
                        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,fontWeight:700,color:T.teal,marginTop:2}}>{bsa} m²</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <input className="mr-search" placeholder="Search pediatric drugs..." value={pedsSearch} onChange={e => setPedsSearch(e.target.value)} />

              {filteredPedsDrugs.map((drug, di) => {
                const dose = calcPedsDose(drug);
                const solIdx = selectedSolutions[di] !== undefined ? selectedSolutions[di] : 0;
                const vol = calcVolume(drug, solIdx);
                return (
                  <div key={di} className="mr-peds-drug">
                    <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:10,flexWrap:'wrap'}}>
                      <div>
                        <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:600}}>{drug.name}</div>
                        <div style={{fontSize:11,color:T.txt3,marginTop:2}}>{drug.notes}</div>
                      </div>
                      <div style={{display:'flex',gap:5,flexShrink:0}}>
                        <span className="mr-badge teal">{drug.route}</span>
                        <span className="mr-badge gold">{drug.freq}</span>
                      </div>
                    </div>
                    <div style={{marginTop:8,fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:T.txt3}}>
                      {drug.mgPerKg} mg/kg — max {drug.maxMg} mg
                    </div>
                    {dose ? (
                      <div className={`mr-dose-result${dose.capped?' capped':''}`}>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <div className={`mr-dose-val${dose.capped?' capped':''}`}>{dose.final.toFixed(1)} mg</div>
                          {dose.capped && <span className="mr-badge orange">MAX CAPPED</span>}
                        </div>
                        <div style={{fontSize:10,color:T.txt3,fontFamily:"'JetBrains Mono',monospace",marginTop:3}}>
                          {drug.mgPerKg} mg/kg × {pedsWt} kg = {dose.raw.toFixed(1)} mg{dose.capped ? ` → capped at ${drug.maxMg} mg` : ''}
                        </div>
                      </div>
                    ) : (
                      <div style={{fontSize:11,color:T.txt4,marginTop:6,fontFamily:"'JetBrains Mono',monospace"}}>Enter weight to calculate dose</div>
                    )}
                    <select className="mr-select" value={solIdx} onChange={e => setSelectedSolutions(prev => ({ ...prev, [di]: parseInt(e.target.value) }))}>
                      {drug.solutions.map((sol, si) => <option key={si} value={si}>{sol.label}</option>)}
                    </select>
                    {vol && dose && (
                      <div className="mr-vol-result">
                        Volume: {vol.val} {vol.unit}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ═══ TAB 3: AI SEARCH ═══ */}
          {tab === 'ai' && (
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              <div className="mr-card teal-glow">
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                  <div className="mr-aipulse" />
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:600}}>AI Clinical Decision Support</div>
                </div>
                <div style={{fontSize:12,color:T.txt3,marginBottom:12}}>Enter an ED complaint or clinical scenario to receive evidence-based medication recommendations sourced from ACEP, AHA, and SSC 2021 guidelines.</div>
                <div className="mr-ai-input-wrap">
                  <input
                    className="mr-input"
                    style={{flex:1}}
                    placeholder="e.g., Acute STEMI, Status epilepticus, Anaphylaxis..."
                    value={aiQuery}
                    onChange={e => setAiQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && runAI()}
                  />
                  <button className="mr-ai-btn" onClick={runAI} disabled={!aiQuery.trim() || aiLoading}>⌘ Analyze</button>
                </div>
                <div className="mr-quick-btns">
                  {QUICK_QUERIES.map(q => (
                    <button key={q} className="mr-quick-btn" onClick={() => { setAiQuery(q); }}>{q}</button>
                  ))}
                </div>
              </div>

              {aiLoading && <LoadingDots />}

              {aiResponse && !aiLoading && (
                <div className="mr-card">
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.txt4,letterSpacing:'.1em',marginBottom:10}}>AI RESPONSE · {aiQuery.toUpperCase()}</div>
                  <div className="mr-ai-response">{renderAIResponse(aiResponse)}</div>
                  <div className="mr-disclaimer">⚠ AI-generated recommendations. Clinical judgment should always prevail. Verify all doses and contraindications. Not a substitute for clinical decision-making.</div>
                </div>
              )}
            </div>
          )}

          {/* ═══ TAB 4: SEPSIS PROTOCOL ═══ */}
          {tab === 'sepsis' && (
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              {/* Banner */}
              <div className="mr-card coral-border">
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <span style={{fontSize:26}}>🦠</span>
                  <div>
                    <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:T.coral}}>Sepsis Protocol Engine</div>
                    <div style={{fontSize:10,fontFamily:"'JetBrains Mono',monospace",color:T.txt3,letterSpacing:'.07em'}}>SURVIVING SEPSIS CAMPAIGN 2021 · HOUR-1 BUNDLE</div>
                  </div>
                </div>
              </div>

              {/* Weight */}
              <div className="mr-card">
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:600,marginBottom:10}}>Patient Weight & Fluid Calculation</div>
                <input className="mr-input" style={{width:200}} type="number" placeholder="Weight (kg)" value={sepsisWeight} onChange={e => setSepsisWeight(e.target.value)} />
                {wt > 0 && (
                  <div className="mr-sepsis-fluid">
                    <div style={{fontSize:9,color:T.coral,fontFamily:"'JetBrains Mono',monospace",letterSpacing:'.08em',marginBottom:4}}>IV FLUID BOLUS</div>
                    <div className="mr-sepsis-fluid-val">{bolus} mL</div>
                    <div style={{fontSize:11,color:T.txt3,marginTop:4}}>30 mL/kg × {wt} kg · Within first 3 hours · Reassess after each bolus</div>
                  </div>
                )}
              </div>

              {/* Hour-1 Bundle */}
              <div className="mr-card">
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:600,marginBottom:12}}>Hour-1 Bundle Checklist</div>
                {SEPSIS_BUNDLE.map(item => (
                  <div key={item.id} className={`mr-checklist-item${item.critical?' critical':' normal'}${sepsisChecked[item.id]?' checked':''}`}
                    onClick={() => toggleCheck(item.id, setSepsisChecked)}>
                    <div className={`mr-check-icon${sepsisChecked[item.id]?' done':item.critical?' crit':' norm'}`}>
                      {sepsisChecked[item.id] ? '✓' : item.critical ? '!' : '○'}
                    </div>
                    <div style={{fontSize:13,color:sepsisChecked[item.id]?T.txt3:T.txt,textDecoration:sepsisChecked[item.id]?'line-through':'none',flex:1}}>{item.label}</div>
                  </div>
                ))}
              </div>

              {/* Sepsis Meds */}
              {wt > 0 && (
                <div className="mr-card">
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:600,marginBottom:12}}>Weight-Based Sepsis Medications</div>
                  {[
                    {name:'Vancomycin',dose:`${Math.round(wt*25)}-${Math.round(wt*30)} mg`,route:'IV',note:'Infuse over 1-2h · AUC-guided dosing'},
                    {name:'Norepinephrine',dose:'0.1-0.5 mcg/kg/min',route:'IV drip',note:'First-line vasopressor · Central line preferred'},
                    {name:'Hydrocortisone',dose:'100 mg (fixed)',route:'IV q8h',note:'If refractory shock'},
                    {name:'Piperacillin-Tazobactam',dose:'4.5 g (fixed)',route:'IV q6h',note:'Extended infusion 4h preferred'},
                  ].map((med, i) => (
                    <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 12px',background:T.up,border:`1px solid ${T.border}`,borderRadius:8,marginBottom:6}}>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:600,fontSize:13}}>{med.name}</div>
                        <div style={{fontSize:10,color:T.txt3,marginTop:2}}>{med.note}</div>
                      </div>
                      <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,fontWeight:700,color:T.coral}}>{med.dose}</span>
                      <span className="mr-badge teal">{med.route}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Sepsis AI */}
              <div className="mr-card">
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                  <div className="mr-aipulse coral" />
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:600,color:T.coral}}>AI Sepsis Protocol Advisor</div>
                </div>
                <div style={{fontSize:12,color:T.txt3,marginBottom:10}}>Enter suspected source for tailored antibiotic selection and SSC 2021 protocol guidance.</div>
                <div className="mr-ai-input-wrap">
                  <input
                    className="mr-input"
                    style={{flex:1}}
                    placeholder="e.g., Urinary source, elderly male..."
                    value={sepsisQuery}
                    onChange={e => setSepsisQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && runSepsisAI()}
                  />
                  <button className="mr-ai-btn coral" onClick={runSepsisAI} disabled={!sepsisQuery.trim() || sepsisLoading || !wt}>
                    ⌘ Generate Protocol
                  </button>
                </div>
                {!wt && <div style={{fontSize:11,color:T.txt4,marginTop:6}}>Enter patient weight above to enable AI protocol generation.</div>}
              </div>

              {sepsisLoading && <LoadingDots coral />}

              {sepsisAiResponse && !sepsisLoading && (
                <div className="mr-card">
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.txt4,letterSpacing:'.1em',marginBottom:10}}>SEPSIS PROTOCOL · SSC 2021</div>
                  <div className="mr-ai-response">{renderAIResponse(sepsisAiResponse)}</div>
                  <div className="mr-disclaimer">⚠ AI-generated protocol. Clinical judgment should always prevail. Follow institutional sepsis protocols. Verify all calculations.</div>
                </div>
              )}

              {/* Reassessment */}
              <div className="mr-card">
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:600,marginBottom:12}}>Reassessment Checklist</div>
                {REASSESS_BUNDLE.map(item => (
                  <div key={item.id} className={`mr-checklist-item${item.critical?' critical':' normal'}${reassessChecked[item.id]?' checked':''}`}
                    onClick={() => toggleCheck(item.id, setReassessChecked)}>
                    <div className={`mr-check-icon${reassessChecked[item.id]?' done':item.critical?' crit':' norm'}`}>
                      {reassessChecked[item.id] ? '✓' : item.critical ? '!' : '○'}
                    </div>
                    <div style={{fontSize:13,color:reassessChecked[item.id]?T.txt3:T.txt,textDecoration:reassessChecked[item.id]?'line-through':'none',flex:1}}>{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mr-footer">
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.txt4,letterSpacing:'3px'}}>NOTRYA AI V3 · BASE 44 · DRUGS_DB ENGINE</div>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.txt4,letterSpacing:'2px',opacity:.6}}>FOR CLINICAL DECISION SUPPORT ONLY · NOT A SUBSTITUTE FOR CLINICAL JUDGMENT</div>
          </div>
        </div>
      </div>
    </>
  );
}