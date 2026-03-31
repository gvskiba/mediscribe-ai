import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import ClinicalContextPanel from "@/components/knowledgebase/ClinicalContextPanel";

// ─── EXISTING DATA ────────────────────────────────────────────────────────────

const SEARCH_INDEX = [
  {type:'drug',name:'Epinephrine (Adrenalin)',desc:'Vasopressor / anaphylaxis / cardiac arrest',url:'https://reference.medscape.com/drug/adrenalin-epinephrine-342432'},
  {type:'drug',name:'Metoprolol (Lopressor)',desc:'Beta-blocker — AF, HTN, HF',url:'https://reference.medscape.com/drug/lopressor-toprol-xl-metoprolol-342453'},
  {type:'drug',name:'Vancomycin',desc:'Glycopeptide antibiotic — MRSA, gram-positive infections',url:'https://reference.medscape.com/drug/vancocin-vancomycin-342587'},
  {type:'drug',name:'Heparin (UFH)',desc:'Anticoagulant — ACS, VTE, DVT',url:'https://www.drugs.com/heparin.html'},
  {type:'drug',name:'Morphine Sulfate',desc:'Opioid analgesic — acute pain, ACS, dyspnoea',url:'https://www.drugs.com/morphine.html'},
  {type:'drug',name:'Salbutamol / Albuterol',desc:'β₂ agonist — asthma, COPD exacerbation',url:'https://www.drugs.com/albuterol.html'},
  {type:'drug',name:'Insulin (Regular)',desc:'Antidiabetic — DKA, hyperglycemia, hyperkalemia',url:'https://www.drugs.com/insulin.html'},
  {type:'drug',name:'Amoxicillin / Augmentin',desc:'Penicillin antibiotic — CAP, UTI, sinusitis',url:'https://www.drugs.com/amoxicillin.html'},
  {type:'drug',name:'Warfarin (Coumadin)',desc:'Vitamin K antagonist — AF, DVT, PE, mechanical valves',url:'https://www.drugs.com/warfarin.html'},
  {type:'drug',name:'Aspirin',desc:'Antiplatelet / NSAID — ACS, stroke prevention, pain',url:'https://www.drugs.com/aspirin.html'},
  {type:'drug',name:'Atorvastatin (Lipitor)',desc:'Statin — hyperlipidaemia, CV risk reduction',url:'https://www.drugs.com/atorvastatin.html'},
  {type:'drug',name:'Lisinopril',desc:'ACE inhibitor — HTN, HF, post-MI, diabetic nephropathy',url:'https://www.drugs.com/lisinopril.html'},
  {type:'drug',name:'Furosemide (Lasix)',desc:'Loop diuretic — acute pulmonary oedema, HF, oedema',url:'https://www.drugs.com/furosemide.html'},
  {type:'drug',name:'Ceftriaxone',desc:'3rd-gen cephalosporin — meningitis, sepsis, CAP',url:'https://www.drugs.com/ceftriaxone.html'},
  {type:'drug',name:'Piperacillin/Tazobactam (Tazocin)',desc:'Broad-spectrum antibiotic — severe sepsis, nosocomial infection',url:'https://www.drugs.com/piperacillin-tazobactam.html'},
  {type:'drug',name:'Lorazepam (Ativan)',desc:'Benzodiazepine — status epilepticus, agitation, sedation',url:'https://www.drugs.com/lorazepam.html'},
  {type:'drug',name:'Norepinephrine (Levophed)',desc:'Vasopressor — septic shock, vasodilatory shock',url:'https://www.drugs.com/norepinephrine.html'},
  {type:'drug',name:'Propofol',desc:'Sedative-hypnotic — ICU sedation, procedural sedation',url:'https://www.drugs.com/propofol.html'},
  {type:'drug',name:'Naloxone (Narcan)',desc:'Opioid antagonist — opioid overdose reversal',url:'https://www.drugs.com/naloxone.html'},
  {type:'drug',name:'Alteplase (tPA)',desc:'Thrombolytic — acute ischemic stroke, massive PE, STEMI',url:'https://www.drugs.com/alteplase.html'},
  {type:'disease',name:'Acute Coronary Syndrome (ACS)',desc:'STEMI, NSTEMI, unstable angina',url:'https://www.uptodate.com/contents/search?search=acute+coronary+syndrome'},
  {type:'disease',name:'Sepsis and Septic Shock',desc:'Systemic infection with organ dysfunction',url:'https://www.uptodate.com/contents/search?search=sepsis'},
  {type:'disease',name:'Pneumonia (CAP)',desc:'Community-acquired pneumonia — bacterial, atypical, viral',url:'https://www.uptodate.com/contents/search?search=community+acquired+pneumonia'},
  {type:'disease',name:'COPD Exacerbation',desc:'Acute worsening of chronic obstructive pulmonary disease',url:'https://www.uptodate.com/contents/search?search=COPD+exacerbation'},
  {type:'disease',name:'Atrial Fibrillation',desc:'Irregular heart rhythm — AF rate and rhythm control',url:'https://www.uptodate.com/contents/search?search=atrial+fibrillation'},
  {type:'disease',name:'DVT / Pulmonary Embolism',desc:'Deep vein thrombosis and venous thromboembolism',url:'https://www.uptodate.com/contents/search?search=pulmonary+embolism'},
  {type:'disease',name:'Diabetic Ketoacidosis (DKA)',desc:'Life-threatening complication of diabetes',url:'https://www.uptodate.com/contents/search?search=diabetic+ketoacidosis'},
  {type:'disease',name:'Acute Ischemic Stroke',desc:'Thrombotic or embolic cerebral infarction',url:'https://www.uptodate.com/contents/search?search=acute+ischemic+stroke'},
  {type:'disease',name:'Heart Failure',desc:'HFrEF, HFmrEF, HFpEF — acute and chronic management',url:'https://www.uptodate.com/contents/search?search=heart+failure'},
  {type:'disease',name:'Asthma Exacerbation',desc:'Acute bronchospasm and airflow obstruction',url:'https://www.uptodate.com/contents/search?search=asthma+exacerbation'},
  {type:'guide',name:'2022 AHA/ACC Chest Pain Guideline',desc:'Evaluation and diagnosis of acute chest pain',url:'https://www.ahajournals.org/doi/10.1161/CIR.0000000000001106'},
  {type:'guide',name:'Surviving Sepsis Campaign 2021',desc:'International guidelines for sepsis management',url:'https://www.idsociety.org/practice-guideline/sepsis/'},
  {type:'guide',name:'2024 GOLD COPD Report',desc:'COPD diagnosis, management and prevention',url:'https://goldcopd.org/2024-gold-report/'},
  {type:'guide',name:'2024 ADA Standards of Diabetes Care',desc:'Annual diabetes management standards',url:'https://diabetesjournals.org/care/issue/47/Supplement_1'},
  {type:'guide',name:'2020 AHA CPR / ACLS Guidelines',desc:'Resuscitation and emergency cardiovascular care',url:'https://www.ahajournals.org/doi/10.1161/CIR.0000000000001122'},
  {type:'ed',name:'LITFL — Life in the Fast Lane',desc:'ECG library, toxicology, critical care compendium',url:'https://litfl.com'},
  {type:'ed',name:'EMCrit — Critical Care EM',desc:'Resuscitation, airway, critical care expertise',url:'https://emcrit.org'},
  {type:'ed',name:'ACEP Clinical Policies',desc:'Evidence-based ED clinical policy library',url:'https://www.acep.org/clinical---practice-management/clinical-policies/'},
];

const DISEASES = [
  {name:'Acute Coronary Syndrome (ACS)',aka:'STEMI, NSTEMI, Unstable Angina',letter:'A',guide:'ACC/AHA',guideUrl:'https://www.ahajournals.org/doi/10.1161/CIR.0000000000001063'},
  {name:'Acute Kidney Injury (AKI)',aka:'ARF, Renal Failure',letter:'A',guide:'KDIGO',guideUrl:'https://kdigo.org/guidelines/acute-kidney-injury/'},
  {name:'Acute Liver Failure',aka:'Fulminant Hepatic Failure',letter:'A',guide:'AASLD',guideUrl:'https://www.aasld.org/practice-guidelines'},
  {name:'Acute Pancreatitis',aka:'Pancreatic inflammation',letter:'A',guide:'ACG',guideUrl:'https://gi.org/guidelines/'},
  {name:'Aortic Dissection',aka:'Type A/B dissection',letter:'A',guide:'ACC/AHA',guideUrl:'https://www.ahajournals.org/doi/10.1161/CIR.0000000000000106'},
  {name:'Asthma',aka:'Reactive airways disease',letter:'A',guide:'GINA 2024',guideUrl:'https://ginasthma.org/2024-gina-report/'},
  {name:'Atrial Fibrillation',aka:'AF, A-fib',letter:'A',guide:'ACC/AHA 2023',guideUrl:'https://www.ahajournals.org/doi/10.1161/CIR.0000000000001123'},
  {name:'Bacterial Meningitis',aka:'Meningococcal, pneumococcal',letter:'B',guide:'IDSA',guideUrl:'https://www.idsociety.org/practice-guideline/bacterial-meningitis/'},
  {name:"Bell's Palsy",aka:'Facial nerve palsy',letter:'B',guide:'AAO-HNS',guideUrl:'https://www.entnet.org/quality-practice/clinical-practice-guidelines/'},
  {name:'Bradycardia',aka:'Sinus bradycardia, heart block',letter:'B',guide:'AHA/ACLS',guideUrl:'https://www.ahajournals.org/doi/10.1161/CIR.0000000000001122'},
  {name:'Cardiac Arrest',aka:'VF, PEA, Asystole',letter:'C',guide:'AHA ACLS 2020',guideUrl:'https://www.ahajournals.org/doi/10.1161/CIR.0000000000001122'},
  {name:'Cellulitis',aka:'Skin and soft tissue infection',letter:'C',guide:'IDSA SSTI',guideUrl:'https://www.idsociety.org/practice-guideline/skin-and-soft-tissue-infections/'},
  {name:'Chronic Kidney Disease (CKD)',aka:'CRF, Renal insufficiency',letter:'C',guide:'KDIGO',guideUrl:'https://kdigo.org/guidelines/ckd-evaluation-and-management/'},
  {name:'COPD',aka:'Emphysema, chronic bronchitis',letter:'C',guide:'GOLD 2024',guideUrl:'https://goldcopd.org/2024-gold-report/'},
  {name:'COVID-19',aka:'SARS-CoV-2, Coronavirus',letter:'C',guide:'NIH COVID',guideUrl:'https://www.covid19treatmentguidelines.nih.gov/'},
  {name:'Deep Vein Thrombosis (DVT)',aka:'VTE, Blood clot',letter:'D',guide:'ACCP/ASH',guideUrl:'https://www.hematology.org/education/clinicians/guidelines-and-quality-care/clinical-practice-guidelines/venous-thromboembolism-guidelines'},
  {name:'Diabetic Ketoacidosis (DKA)',aka:'DKA, Metabolic acidosis',letter:'D',guide:'ADA 2024',guideUrl:'https://diabetesjournals.org/care/issue/47/Supplement_1'},
  {name:'Diverticulitis',aka:'Diverticular disease',letter:'D',guide:'ACG',guideUrl:'https://gi.org/guidelines/'},
  {name:'Eclampsia / Pre-eclampsia',aka:'HELLP syndrome',letter:'E',guide:'ACOG',guideUrl:'https://www.acog.org/clinical/clinical-guidance/practice-bulletin/articles/2019/01/gestational-hypertension-and-preeclampsia'},
  {name:'Ectopic Pregnancy',aka:'Tubal pregnancy',letter:'E',guide:'ACOG',guideUrl:'https://www.acog.org/clinical/clinical-guidance/practice-bulletin'},
  {name:'Endocarditis',aka:'Infective endocarditis, IE',letter:'E',guide:'AHA/ACC',guideUrl:'https://www.ahajournals.org/doi/10.1161/CIR.0000000000000549'},
  {name:'Epiglottitis',aka:'Supraglottitis',letter:'E',guide:'IDSA/ACEP',guideUrl:'https://www.acep.org/clinical---practice-management/clinical-policies/'},
  {name:'GI Bleeding (Upper)',aka:'Haematemesis, peptic ulcer bleed',letter:'G',guide:'ACG',guideUrl:'https://gi.org/guidelines/'},
  {name:'GI Bleeding (Lower)',aka:'LGIB, haematochezia',letter:'G',guide:'ACG',guideUrl:'https://gi.org/guidelines/'},
  {name:'Heart Failure (HF)',aka:'CHF, HFrEF, HFpEF',letter:'H',guide:'AHA/ACC/HFSA 2022',guideUrl:'https://www.ahajournals.org/doi/10.1161/CIR.0000000000001063'},
  {name:'Hypertensive Emergency',aka:'Hypertensive crisis, malignant HTN',letter:'H',guide:'ACC/AHA',guideUrl:'https://www.ahajournals.org/doi/10.1161/HYP.0000000000000065'},
  {name:'Hypoglycemia',aka:'Low blood sugar, insulin reaction',letter:'H',guide:'ADA 2024',guideUrl:'https://diabetesjournals.org/care/issue/47/Supplement_1'},
  {name:'Influenza',aka:'Flu, H1N1, H3N2',letter:'I',guide:'IDSA',guideUrl:'https://www.idsociety.org/practice-guideline/influenza/'},
  {name:'Pneumonia (CAP)',aka:'Community-acquired pneumonia',letter:'P',guide:'IDSA/ATS 2019',guideUrl:'https://www.idsociety.org/practice-guideline/community-acquired-pneumonia-cap-in-adults/'},
  {name:'Pneumothorax',aka:'Collapsed lung, PTX',letter:'P',guide:'BTS',guideUrl:'https://www.brit-thoracic.org.uk/quality-improvement/guidelines/'},
  {name:'Pulmonary Embolism (PE)',aka:'VTE, DVT-PE',letter:'P',guide:'ESC/ACCP',guideUrl:'https://www.escardio.org/Guidelines/Clinical-Practice-Guidelines'},
  {name:'Sepsis / Septic Shock',aka:'SIRS, bacteremia, severe sepsis',letter:'S',guide:'Surviving Sepsis 2021',guideUrl:'https://www.idsociety.org/practice-guideline/sepsis/'},
  {name:'Status Epilepticus',aka:'SE, prolonged seizure',letter:'S',guide:'AAN/NCS',guideUrl:'https://www.aan.com/Guidelines/'},
  {name:'Stroke (Ischemic)',aka:'CVA, cerebral infarct, TIA',letter:'S',guide:'ASA/AHA',guideUrl:'https://www.ahajournals.org/doi/10.1161/STR.0000000000000375'},
  {name:'Thyroid Storm',aka:'Thyrotoxic crisis',letter:'T',guide:'ATA/JCEM',guideUrl:'https://www.thyroid.org/professionals/ata-professional-guidelines/'},
  {name:'Type 1 Diabetes',aka:'T1DM, IDDM',letter:'T',guide:'ADA 2024',guideUrl:'https://diabetesjournals.org/care/issue/47/Supplement_1'},
  {name:'Type 2 Diabetes',aka:'T2DM, NIDDM',letter:'T',guide:'ADA 2024',guideUrl:'https://diabetesjournals.org/care/issue/47/Supplement_1'},
  {name:'UTI / Pyelonephritis',aka:'Urinary tract infection, kidney infection',letter:'U',guide:'IDSA 2022',guideUrl:'https://www.idsociety.org/practice-guideline/urinary-tract-infection-uti/'},
];

const DRUGS_QR = [
  {name:'Epinephrine',generic:'Adrenalin',cat:'em cardiac',cls:'Vasopressor',fields:[{label:'Cardiac Arrest',val:'1mg IV q3-5min'},{label:'Anaphylaxis',val:'0.3mg IM lateral thigh'},{label:'Infusion',val:'0.1–1 mcg/kg/min'}],links:[{label:'Medscape',url:'https://reference.medscape.com/drug/adrenalin-epinephrine-342432'},{label:'Drugs.com',url:'https://www.drugs.com/epinephrine.html'},{label:'DailyMed',url:'https://dailymed.nlm.nih.gov/dailymed/search.cfm?query=epinephrine'}]},
  {name:'Metoprolol',generic:'Lopressor / Toprol XL',cat:'cardiac',cls:'β-Blocker',fields:[{label:'IV (AF/AFl)',val:'2.5–5mg IV q5min (max 15mg)'},{label:'PO (HTN)',val:'25–100mg BID'},{label:'PO (HF)',val:'12.5–200mg QD (XL)'}],links:[{label:'Medscape',url:'https://reference.medscape.com/drug/lopressor-toprol-xl-metoprolol-342453'},{label:'Drugs.com',url:'https://www.drugs.com/metoprolol.html'},{label:'DailyMed',url:'https://dailymed.nlm.nih.gov/dailymed/search.cfm?query=metoprolol'}]},
  {name:'Amoxicillin',generic:'Amoxil / Augmentin',cat:'abx',cls:'Penicillin',fields:[{label:'Standard',val:'500mg TID or 875mg BID'},{label:'Pediatric',val:'40–90 mg/kg/day'},{label:'Renal Adj',val:'CrCl <30: q24h'}],links:[{label:'Medscape',url:'https://reference.medscape.com/drug/amoxil-amoxicillin-342488'},{label:'Drugs.com',url:'https://www.drugs.com/amoxicillin.html'},{label:'DailyMed',url:'https://dailymed.nlm.nih.gov/dailymed/search.cfm?query=amoxicillin'}]},
  {name:'Heparin (UFH)',generic:'Unfractionated',cat:'anticoag',cls:'Anticoagulant',fields:[{label:'ACS Bolus',val:'60 U/kg IV (max 4000 U)'},{label:'ACS Infusion',val:'12 U/kg/hr (max 1000 U/hr)'},{label:'Target aPTT',val:'60–100 sec'}],links:[{label:'Medscape',url:'https://reference.medscape.com/drug/heparin-lock-heparin-342486'},{label:'Drugs.com',url:'https://www.drugs.com/heparin.html'},{label:'DailyMed',url:'https://dailymed.nlm.nih.gov/dailymed/search.cfm?query=heparin'}]},
  {name:'Morphine',generic:'MS Contin / Duramorph',cat:'analgesic em',cls:'Opioid Analgesic',fields:[{label:'IV Acute Pain',val:'2–4mg IV q4h PRN'},{label:'PO',val:'15–30mg q4h'},{label:'Reversal',val:'Naloxone 0.4mg IV'}],links:[{label:'Medscape',url:'https://reference.medscape.com/drug/ms-contin-kadian-morphine-343219'},{label:'Drugs.com',url:'https://www.drugs.com/morphine.html'},{label:'DailyMed',url:'https://dailymed.nlm.nih.gov/dailymed/search.cfm?query=morphine'}]},
  {name:'Vancomycin',generic:'Vancocin',cat:'abx em',cls:'Glycopeptide',fields:[{label:'Dosing',val:'15–20 mg/kg IV q8-12h'},{label:'MRSA Target',val:'AUC 400–600 mg·h/L'},{label:'Max Single',val:'3g per dose'}],links:[{label:'Medscape',url:'https://reference.medscape.com/drug/vancocin-vancomycin-342587'},{label:'Drugs.com',url:'https://www.drugs.com/vancomycin.html'},{label:'DailyMed',url:'https://dailymed.nlm.nih.gov/dailymed/search.cfm?query=vancomycin'}]},
  {name:'Insulin (Regular)',generic:'Humulin R / Novolin R',cat:'endo em',cls:'Antidiabetic',fields:[{label:'DKA Bolus',val:'0.1 U/kg IV bolus'},{label:'DKA Infusion',val:'0.1 U/kg/hr IV'},{label:'Hyperkalemia',val:'10 U IV + 50mL D50W'}],links:[{label:'Medscape',url:'https://reference.medscape.com/drug/humulin-r-novolin-r-insulin-regular-342465'},{label:'Drugs.com',url:'https://www.drugs.com/insulin.html'},{label:'DailyMed',url:'https://dailymed.nlm.nih.gov/dailymed/search.cfm?query=insulin+regular'}]},
  {name:'Salbutamol / Albuterol',generic:'Ventolin / ProAir',cat:'resp em',cls:'β₂ Agonist',fields:[{label:'Nebulised',val:'2.5–5mg q20min × 3'},{label:'MDI',val:'4–8 puffs (100mcg/puff)'},{label:'Continuous',val:'10–15mg/hr neb'}],links:[{label:'Medscape',url:'https://reference.medscape.com/drug/proair-ventolin-hfa-albuterol-342484'},{label:'Drugs.com',url:'https://www.drugs.com/albuterol.html'},{label:'DailyMed',url:'https://dailymed.nlm.nih.gov/dailymed/search.cfm?query=albuterol'}]},
];

// ─── NEW: RICH DETAIL + LANDMARK STUDIES ─────────────────────────────────────

const STUDIES_DB = {
  "ProCESS":        {title:"ProCESS Trial",journal:"NEJM",year:2014,finding:"Protocol-based sepsis resuscitation not superior to usual care — standard care is adequate"},
  "SMART":          {title:"SMART Trial",journal:"NEJM",year:2018,finding:"Balanced crystalloids vs. saline: lower MAKE30 composite endpoint in ICU patients"},
  "ADRENAL":        {title:"ADRENAL Trial",journal:"NEJM",year:2018,finding:"Hydrocortisone in septic shock: faster vasopressor weaning but no mortality benefit"},
  "PARADIGM-HF":    {title:"PARADIGM-HF Trial",journal:"NEJM",year:2014,finding:"Sacubitril/valsartan reduced CV death by 20% vs. enalapril in HFrEF"},
  "DAPA-HF":        {title:"DAPA-HF Trial",journal:"NEJM",year:2019,finding:"Dapagliflozin reduced worsening HF or CV death by 26% in HFrEF"},
  "EMPEROR":        {title:"EMPEROR-Reduced",journal:"NEJM",year:2020,finding:"Empagliflozin reduced HF hospitalization + CV death by 25% in HFrEF"},
  "EAST-AFNET4":    {title:"EAST-AFNET 4",journal:"NEJM",year:2020,finding:"Early rhythm control reduced CV outcomes by 21% vs. rate control in AF"},
  "PLATO":          {title:"PLATO Trial",journal:"NEJM",year:2009,finding:"Ticagrelor reduced CV death/MI/stroke by 16% vs. clopidogrel in ACS"},
  "COMPLETE":       {title:"COMPLETE Trial",journal:"NEJM",year:2019,finding:"Complete revascularization reduced CV death/MI by 26% vs. culprit-only in STEMI"},
  "NINDS-tPA":      {title:"NINDS tPA Stroke Trial",journal:"NEJM",year:1995,finding:"IV tPA within 3h: 30% more patients with minimal/no disability at 3 months"},
  "DAWN":           {title:"DAWN Trial",journal:"NEJM",year:2018,finding:"Thrombectomy 6–24h: 49% vs 13% functional independence"},
  "SYGMA-1":        {title:"SYGMA 1 Trial",journal:"NEJM",year:2018,finding:"As-needed budesonide/formoterol non-inferior to daily ICS in mild asthma"},
  "IMPACT":         {title:"IMPACT Trial",journal:"NEJM",year:2018,finding:"ICS/LABA/LAMA triple therapy reduced exacerbations by 15% vs. ICS/LABA in COPD"},
  "EXTEND":         {title:"EXTEND CDI Trial",journal:"Lancet Infect Dis",year:2021,finding:"Fidaxomicin extended dosing reduced CDI recurrences vs. standard vancomycin"},
  "ACCORD":         {title:"ACCORD Trial",journal:"NEJM",year:2008,finding:"Intensive glucose control (<6% A1c) increased mortality vs. standard control"},
  "SPRINT":         {title:"SPRINT Trial",journal:"NEJM",year:2015,finding:"SBP target <120 mmHg reduced CV events and mortality vs. <140 in non-diabetic HTN"},
  "STOP-BANG":      {title:"CPR Outcomes Registry",journal:"Circulation",year:2020,finding:"High-quality CPR (rate 100-120, depth ≥2in) independently predicts ROSC"},
};

// Keyed by title fragment for fuzzy matching against GUIDELINES_DATA titles
const RICH_DETAIL = {
  "Surviving Sepsis": {
    synopsis:"International consensus guidelines covering the Hour-1 bundle, fluid resuscitation strategy, vasopressor selection, antibiotic stewardship, and adjunctive therapies for sepsis and septic shock.",
    keyPoints:[
      "Antibiotics within 1h for septic shock; within 3h for sepsis without shock",
      "Balanced crystalloids (LR/PlasmaLyte) preferred over 0.9% normal saline",
      "Norepinephrine first-line vasopressor; add vasopressin (not epinephrine) second-line",
      "Lactate ≥4 mmol/L defines septic shock equivalent — aggressive resuscitation",
      "Hydrocortisone 200mg/day for vasopressor-refractory septic shock",
      "Procalcitonin-guided antibiotic de-escalation and discontinuation",
    ],
    recs:[
      {cls:"Strong / High",text:"Administer IV antibiotics within 1h of septic shock recognition"},
      {cls:"Strong / Moderate",text:"Use balanced crystalloids over normal saline as IV fluid"},
      {cls:"Strong / Moderate",text:"Norepinephrine first-line vasopressor; target MAP ≥65 mmHg"},
      {cls:"Weak / Moderate",text:"Hydrocortisone 200mg/day for vasopressor-refractory shock"},
    ],
    studies:["ProCESS","SMART","ADRENAL"],
  },
  "Heart Failure": {
    synopsis:"Comprehensive update to heart failure management establishing 4-pillar GDMT for HFrEF, new SGLT2 inhibitor Class I indication, and updated HF staging/phenotyping including new HFmrEF category.",
    keyPoints:[
      "4-pillar GDMT for HFrEF: ACEi/ARB/ARNi + beta-blocker + MRA + SGLT2 inhibitor",
      "SGLT2 inhibitors (dapagliflozin, empagliflozin) Class I LOE A for HFrEF",
      "ARNi (sacubitril/valsartan) preferred over ACEi in stable symptomatic HFrEF",
      "New HFmrEF (EF 41–49%) — consider same GDMT as HFrEF",
      "ICD for EF ≤35% on optimal GDMT × ≥3 months (NYHA class II–III)",
      "Loop diuretics for symptom relief; no mortality benefit",
    ],
    recs:[
      {cls:"Class I / LOE A",text:"SGLT2 inhibitors reduce HF hospitalization and CV death in HFrEF"},
      {cls:"Class I / LOE A",text:"Beta-blockers (carvedilol, bisoprolol, metoprolol succinate) reduce mortality"},
      {cls:"Class I / LOE B-R",text:"ARNi preferred over ACEi in stable symptomatic HFrEF"},
      {cls:"Class I / LOE A",text:"MRAs reduce mortality and HF hospitalization"},
    ],
    studies:["PARADIGM-HF","DAPA-HF","EMPEROR"],
  },
  "Atrial Fibrillation": {
    synopsis:"Landmark AF management update incorporating EAST-AFNET4 early rhythm control evidence, updated anticoagulation guidance, and expanded catheter ablation indications as first-line therapy.",
    keyPoints:[
      "CHA₂DS₂-VASc ≥2 (men) / ≥3 (women): anticoagulate; DOACs preferred over warfarin",
      "Early rhythm control (within 12 months of AF diagnosis) reduces CV outcomes",
      "Rate control target: resting HR <80 bpm (symptomatic) or <110 bpm (others)",
      "Catheter ablation: Class I or reasonable first-line for symptomatic paroxysmal AF",
      "Lifestyle modification (weight loss, exercise) reduces AF burden and recurrence",
      "Integrated multidisciplinary care pathway improves outcomes",
    ],
    recs:[
      {cls:"Class I / LOE A",text:"DOACs preferred over warfarin for non-valvular AF anticoagulation"},
      {cls:"Class I / LOE B-R",text:"Early rhythm control strategy to reduce cardiovascular events"},
      {cls:"Class IIa / LOE B-NR",text:"Catheter ablation as first-line for symptomatic paroxysmal AF"},
    ],
    studies:["EAST-AFNET4"],
  },
  "STEMI": {
    synopsis:"Updated STEMI management with door-to-balloon time goals, complete revascularization evidence, and optimized antiplatelet/anticoagulation strategies for primary PCI.",
    keyPoints:[
      "Primary PCI preferred; door-to-balloon time goal ≤90 min (system goal ≤60 min)",
      "If PCI not available within 120 min: thrombolytics within 30 min",
      "DAPT: aspirin 325mg + ticagrelor or prasugrel (preferred over clopidogrel) × 12 months",
      "Complete revascularization of non-culprit lesions during index hospitalization (Class IIa)",
      "High-intensity statin before or at discharge",
    ],
    recs:[
      {cls:"Class I / LOE A",text:"Primary PCI with door-to-balloon ≤90 min; system goal ≤60 min"},
      {cls:"Class I / LOE A",text:"Aspirin + ticagrelor or prasugrel for 12 months post-STEMI"},
      {cls:"Class IIa / LOE B-R",text:"Complete revascularization of non-culprit lesions at index PCI"},
    ],
    studies:["PLATO","COMPLETE"],
  },
  "Community-Acquired Pneumonia": {
    synopsis:"IDSA/ATS consensus for adult CAP establishing PSI/CURB-65 site-of-care decisions, empiric antibiotic selection by severity and risk factors, and treatment duration guidance.",
    keyPoints:[
      "PSI or CURB-65 guides inpatient vs outpatient; CURB-65 ≥2 → consider admission",
      "Outpatient (no comorbidities): amoxicillin OR doxycycline",
      "Inpatient non-ICU: beta-lactam + macrolide OR respiratory fluoroquinolone",
      "ICU CAP: beta-lactam + azithromycin OR beta-lactam + respiratory fluoroquinolone",
      "5-day course adequate if improving (meets clinical stability criteria)",
      "Blood cultures before antibiotics but do NOT delay treatment",
    ],
    recs:[
      {cls:"Strong / LOE I",text:"Use PSI or CURB-65 for site-of-care and severity decision"},
      {cls:"Strong / LOE I",text:"Beta-lactam + macrolide or respiratory FQ for non-ICU inpatient CAP"},
      {cls:"Moderate / LOE II",text:"5-day course adequate for non-severe CAP responding to treatment"},
    ],
    studies:[],
  },
  "COPD": {
    synopsis:"Annual GOLD update with simplified ABE classification, updated inhaler selection algorithm prioritizing LAMA monotherapy, and evidence-based exacerbation management protocols.",
    keyPoints:[
      "Diagnosis requires post-bronchodilator FEV1/FVC <0.70 by spirometry",
      "Use symptom burden + exacerbation history (not spirometry alone) to guide pharmacotherapy",
      "LAMA monotherapy first-line for dyspnea without frequent exacerbations",
      "LAMA + LABA for ongoing dyspnea on monotherapy",
      "Add ICS only for eosinophils ≥300/μL or frequent exacerbations on LABA/LAMA",
      "Acute exacerbation: SABA + systemic steroids 40mg × 5 days + antibiotics if purulent",
    ],
    recs:[
      {cls:"Evidence A",text:"LAMA reduces exacerbations more than LABA or LABA/ICS in group B/E"},
      {cls:"Evidence A",text:"ICS/LABA/LAMA triple therapy reduces exacerbations vs. dual therapy"},
      {cls:"Evidence A",text:"5-day systemic corticosteroid course reduces AECOPD treatment failure"},
    ],
    studies:["IMPACT"],
  },
  "GINA": {
    synopsis:"Major GINA update replacing SABA-only reliever therapy with ICS-containing regimens at all steps, supported by SYGMA trial evidence, and expanding biologic therapy guidance.",
    keyPoints:[
      "SABA-only reliever no longer recommended — replace with ICS/formoterol at all steps",
      "As-needed low-dose ICS/formoterol is preferred reliever (reduces exacerbations vs SABA)",
      "Step 1–2: As-needed ICS/formoterol (MART regimen)",
      "Step 3–4: Regular ICS/LABA + as-needed ICS/formoterol",
      "Biologics (dupilumab, mepolizumab, omalizumab) for severe uncontrolled T2-high asthma",
    ],
    recs:[
      {cls:"Evidence A",text:"As-needed ICS/formoterol reduces exacerbations vs SABA in mild asthma"},
      {cls:"Evidence A",text:"Biologics target T2-high endotypes for add-on therapy in severe asthma"},
    ],
    studies:["SYGMA-1"],
  },
  "Ischemic Stroke": {
    synopsis:"Updated AIS guidelines expanding IV alteplase eligibility, establishing tenecteplase equivalence, and extending mechanical thrombectomy window to 24h with favorable imaging.",
    keyPoints:[
      "IV alteplase within 3h (Class I) and 3–4.5h (Class I for most patients) of symptom onset",
      "Tenecteplase 0.25mg/kg (max 25mg): non-inferior to alteplase; single-bolus advantage",
      "Mechanical thrombectomy for LVO up to 24h with favorable imaging (DAWN/DEFUSE-3)",
      "Expanded thrombectomy: ASPECTS ≥3, larger cores now eligible (ESCAPE-NEXT criteria)",
      "Pre-tPA BP: treat if >185/110; post-tPA: maintain <180/105 for 24h",
    ],
    recs:[
      {cls:"Class I / LOE A",text:"IV alteplase within 3h for eligible patients"},
      {cls:"Class I / LOE A",text:"Mechanical thrombectomy for LVO within 6h + favorable clinical/imaging"},
      {cls:"Class I / LOE B-R",text:"Extend thrombectomy to 24h using DAWN or DEFUSE-3 criteria"},
    ],
    studies:["NINDS-tPA","DAWN"],
  },
  "Diabetes": {
    synopsis:"Annual ADA update emphasizing individualized care, GLP-1 and SGLT2 inhibitor cardiovascular/renal benefits beyond glucose lowering, and continuous glucose monitoring integration.",
    keyPoints:[
      "A1c target individualized: <7% for most; <8% for frail/high hypoglycemia risk",
      "GLP-1 agonists (semaglutide, liraglutide) first-line add-on for ASCVD or weight loss",
      "SGLT2 inhibitors first-line for HFrEF or CKD regardless of glucose control",
      "Screen for diabetic kidney disease: annual UACR + eGFR",
      "Continuous glucose monitoring recommended for all T1DM and many T2DM on insulin",
    ],
    recs:[
      {cls:"Grade A",text:"GLP-1 agonists for ASCVD risk reduction in T2DM with established CVD"},
      {cls:"Grade A",text:"SGLT2 inhibitors for cardiorenal protection in T2DM with HF or CKD"},
      {cls:"Grade B",text:"A1c <7% for most non-pregnant adults with T2DM"},
    ],
    studies:["ACCORD"],
  },
  "CPR": {
    synopsis:"Comprehensive update to BLS/ACLS algorithms, post-cardiac arrest care, ROSC management, and integrated resuscitation science from the 2020 evidence review.",
    keyPoints:[
      "High-quality CPR: rate 100–120/min, depth ≥2 inches, full chest recoil, minimize interruptions",
      "Epinephrine 1mg IV/IO q3–5 min for non-shockable rhythms (PEA/asystole): give early",
      "For shockable rhythms (VF/pVT): defibrillate first, then CPR, then epinephrine after 2nd shock",
      "Post-ROSC: targeted temperature management 32–36°C for comatose survivors",
      "Bilaterally absent pupillary responses and absent N20 SSEP predict poor neurologic outcome",
      "ECPR (extracorporeal CPR) for refractory cardiac arrest in appropriate candidates",
    ],
    recs:[
      {cls:"Class I",text:"Immediate defibrillation for shockable rhythms; minimize pre-shock pause"},
      {cls:"Class I",text:"Epinephrine 1mg IV/IO q3-5 min during cardiac arrest"},
      {cls:"Class IIa",text:"Targeted temperature management (32–36°C) for post-cardiac arrest care"},
    ],
    studies:["STOP-BANG"],
  },
  "Clostridioides": {
    synopsis:"Updated CDI guidelines establishing fidaxomicin as preferred initial therapy, bezlotoxumab for recurrence prevention, and FMT as highly effective treatment for recurrent disease.",
    keyPoints:[
      "Non-severe initial CDI: fidaxomicin 200mg BID × 10 days preferred over oral vancomycin",
      "Severe CDI (WBC >15k or Cr >1.5): oral vancomycin 125mg QID × 10 days",
      "Fulminant CDI: vancomycin 500mg QID oral/NG + metronidazole 500mg IV q8h",
      "Bezlotoxumab adjunct for patients at high recurrence risk",
      "FMT for recurrent CDI (≥2 episodes): cure rate >90%",
    ],
    recs:[
      {cls:"Strong / High",text:"Fidaxomicin for non-severe, non-fulminant initial CDI"},
      {cls:"Strong / Moderate",text:"FMT for recurrent CDI ≥2 episodes after standard antibiotics"},
      {cls:"Conditional / Moderate",text:"Bezlotoxumab for high recurrence risk patients"},
    ],
    studies:["EXTEND"],
  },
};

function getRichDetail(guide) {
  const title = guide.title.toLowerCase();
  const entry = Object.entries(RICH_DETAIL).find(([k]) => title.includes(k.toLowerCase()));
  return entry ? entry[1] : null;
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,300;1,400&display=swap');

.kb2-root {
  --bg-deep:#050f1e;--bg-panel:#081628;--bg-card:#0b1e36;--bg-elevated:#0e2544;
  --border:#1a3555;--border-bright:#2a4f7a;
  --accent-blue:#3b9eff;--accent-cyan:#00d4ff;--accent-teal:#00e5c0;
  --accent-gold:#f5c842;--accent-purple:#9b6dff;--accent-coral:#ff6b6b;--accent-green:#3dffa0;
  --text-primary:#e8f0fe;--text-secondary:#8aaccc;--text-muted:#4a6a8a;--text-dim:#2e4a6a;
  background:var(--bg-deep);color:var(--text-primary);
  font-family:'DM Sans',sans-serif;font-size:13px;
  display:flex;flex-direction:column;height:100vh;overflow:hidden;
}
.kb2-root * { box-sizing:border-box; }
.kb2-root a { color:inherit; text-decoration:none; }
.kb2-topnav {height:44px;background:#040c18;border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 16px;gap:12px;flex-shrink:0;margin-left:72px}
.kb2-topnav-brand{display:flex;align-items:center;gap:8px;flex-shrink:0}
.kb2-topnav-logo{font-family:'Playfair Display',serif;font-size:16px;font-weight:700;color:var(--text-primary)}
.kb2-topnav-sep{width:1px;height:18px;background:var(--border-bright)}
.kb2-topnav-subtitle{font-size:11px;color:var(--text-muted);font-style:italic}
.kb2-topnav-spacer{flex:1}
.kb2-topnav-btns{display:flex;align-items:center;gap:6px}
.kb2-topnav-btn{display:flex;align-items:center;gap:5px;padding:5px 12px;border-radius:6px;font-size:11px;font-weight:500;cursor:pointer;border:1px solid var(--border);background:transparent;color:var(--text-muted);transition:all .15s;font-family:'DM Sans',sans-serif;text-decoration:none}
.kb2-topnav-btn:hover{border-color:var(--border-bright);color:var(--text-primary);background:var(--bg-card)}
.kb2-topnav-btn.active{border-color:var(--accent-blue);background:#0a2040;color:var(--accent-blue)}
.kb2-topnav-avatar{width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,#3b9eff,#9b6dff);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;flex-shrink:0;cursor:pointer;border:1px solid var(--border-bright)}
.kb2-vitals {height:40px;background:#060f1c;border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 12px;gap:6px;overflow-x:auto;flex-shrink:0;margin-left:72px}
.kb2-vitals::-webkit-scrollbar{display:none}
.kb2-vit-item {display:flex;align-items:center;gap:6px;background:var(--bg-card);border:1px solid var(--border);border-radius:5px;padding:3px 9px;flex-shrink:0;font-family:'JetBrains Mono',monospace}
.kb2-vit-label{font-size:9px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px}
.kb2-vit-val{font-size:12px;font-weight:600;color:var(--text-primary)}
.kb2-vit-val.abn{color:var(--accent-coral);animation:glow-red2 2s infinite}
@keyframes glow-red2{0%,100%{text-shadow:0 0 4px rgba(255,107,107,.4)}50%{text-shadow:0 0 10px rgba(255,107,107,.9)}}
.kb2-vit-sep{width:1px;height:20px;background:var(--border);flex-shrink:0}
.kb2-patient-chip {display:flex;align-items:center;gap:8px;background:#0a1e35;border:1px solid var(--border-bright);border-radius:5px;padding:3px 10px;font-size:11px;flex-shrink:0}
.kb2-patient-name{font-family:'Playfair Display',serif;font-size:12px;color:var(--text-primary)}
.kb2-patient-mrn{font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--text-muted)}
.kb2-layout{display:flex;flex:1;overflow:hidden;margin-left:72px}
.kb2-sidebar {width:220px;flex-shrink:0;background:#060e1c;border-right:1px solid var(--border);overflow-y:auto;padding:14px 0}
.kb2-sidebar::-webkit-scrollbar{width:4px}
.kb2-sidebar::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px}
.kb2-sb-heading{font-size:9px;text-transform:uppercase;letter-spacing:1.2px;color:var(--text-dim);padding:6px 14px 4px}
.kb2-sb-item {display:flex;align-items:center;justify-content:space-between;padding:7px 14px;cursor:pointer;transition:background .15s;border-left:2px solid transparent;font-size:12px;color:var(--text-secondary)}
.kb2-sb-item:hover{background:var(--bg-card);color:var(--text-primary)}
.kb2-sb-item.active{background:#0a2040;border-left-color:var(--accent-blue);color:var(--accent-blue);font-weight:500}
.kb2-sb-icon{font-size:14px;margin-right:8px}
.kb2-sb-label{flex:1}
.kb2-badge{font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:600;padding:1px 5px;border-radius:10px;background:var(--bg-elevated);color:var(--text-muted);flex-shrink:0}
.kb2-badge.blue{background:#0d2545;color:var(--accent-blue)}
.kb2-badge.cyan{background:#052535;color:var(--accent-cyan)}
.kb2-badge.purple{background:#1a0d35;color:var(--accent-purple)}
.kb2-badge.red{background:#2e0d0d;color:var(--accent-coral)}
.kb2-badge.green{background:#0d2e20;color:var(--accent-green)}
.kb2-main{flex:1;overflow-y:auto;padding:20px 22px 120px;min-width:0}
.kb2-section-title{font-family:'Playfair Display',serif;font-size:17px;font-weight:600;color:var(--text-primary);margin-bottom:4px}
.kb2-section-sub{font-size:11px;color:var(--text-muted);margin-bottom:16px}
.kb2-cards-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px;margin-bottom:24px}
.kb2-card{background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:14px 16px;transition:all .2s;cursor:pointer;display:block}
.kb2-card:hover{border-color:var(--border-bright);background:var(--bg-elevated);transform:translateY(-2px);box-shadow:0 6px 24px rgba(0,0,0,.4)}
.kb2-card-header{display:flex;align-items:center;gap:10px;margin-bottom:8px}
.kb2-card-icon{width:36px;height:36px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
.kb2-card-title{font-size:13px;font-weight:600;color:var(--text-primary);line-height:1.3}
.kb2-card-abbr{font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--text-muted);margin-top:1px}
.kb2-card-desc{font-size:11px;color:var(--text-secondary);line-height:1.5;margin-bottom:10px}
.kb2-card-link{display:flex;align-items:center;gap:5px;font-size:11px;color:var(--accent-blue);font-weight:500}
.kb2-card-link:hover{color:var(--accent-cyan)}
.kb2-search-hero {background:linear-gradient(135deg,#081628 0%,#0a1e38 50%,#060f1e 100%);border:1px solid var(--border-bright);border-radius:12px;padding:24px 28px 20px;margin-bottom:22px;position:relative;overflow:hidden}
.kb2-search-hero::before{content:'';position:absolute;top:-60px;right:-60px;width:200px;height:200px;background:radial-gradient(circle,rgba(59,158,255,.08) 0%,transparent 70%);pointer-events:none}
.kb2-search-hero-title{font-family:'Playfair Display',serif;font-size:22px;font-weight:700;color:var(--text-primary);margin-bottom:4px}
.kb2-search-hero-sub{font-size:12px;color:var(--text-muted);margin-bottom:16px}
.kb2-search-bar-wrap{display:flex;gap:8px;margin-bottom:12px}
.kb2-search-input-wrap{flex:1;position:relative}
.kb2-search-icon{position:absolute;left:12px;top:50%;transform:translateY(-50%);font-size:15px;color:var(--text-muted);pointer-events:none}
.kb2-search-input{width:100%;height:42px;background:#0b1e36;border:1.5px solid var(--border-bright);border-radius:8px;padding:0 14px 0 38px;color:var(--text-primary);font-size:13px;font-family:'DM Sans',sans-serif;outline:none;transition:border-color .2s,box-shadow .2s}
.kb2-search-input:focus{border-color:var(--accent-blue);box-shadow:0 0 0 3px rgba(59,158,255,.12)}
.kb2-search-input::placeholder{color:var(--text-dim)}
.kb2-search-btn{height:42px;padding:0 20px;background:var(--accent-blue);border:none;border-radius:8px;color:#fff;font-size:13px;font-weight:600;cursor:pointer;transition:all .2s;white-space:nowrap;font-family:'DM Sans',sans-serif}
.kb2-search-btn:hover{background:#5aadff;transform:translateY(-1px)}
.kb2-filter-chips{display:flex;gap:6px;flex-wrap:wrap}
.kb2-filter-chip{padding:4px 10px;border-radius:20px;font-size:11px;border:1px solid var(--border);background:transparent;color:var(--text-muted);cursor:pointer;transition:all .15s;font-family:'DM Sans',sans-serif}
.kb2-filter-chip:hover{border-color:var(--accent-blue);color:var(--accent-blue)}
.kb2-filter-chip.active{background:#0a2040;border-color:var(--accent-blue);color:var(--accent-blue)}
.kb2-search-results{margin-top:14px}
.kb2-result-item{display:flex;align-items:flex-start;gap:12px;padding:11px 14px;background:var(--bg-card);border:1px solid var(--border);border-radius:8px;margin-bottom:6px;cursor:pointer;transition:all .15s;text-decoration:none}
.kb2-result-item:hover{border-color:var(--border-bright);background:var(--bg-elevated);transform:translateX(2px)}
.kb2-result-icon{font-size:18px;flex-shrink:0;margin-top:1px}
.kb2-result-name{font-size:13px;font-weight:600;color:var(--text-primary);margin-bottom:2px}
.kb2-result-desc{font-size:11px;color:var(--text-muted)}
.kb2-result-tag{font-size:9px;padding:1px 6px;border-radius:3px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;margin-top:4px;display:inline-block}
.tag-drug2{background:#1a3040;color:#00d4ff}
.tag-disease2{background:#1a1a40;color:#9b6dff}
.tag-guide2{background:#1a2840;color:#3b9eff}
.tag-ed2{background:#401a1a;color:#ff6b6b}
.kb2-drug-search-wrap{background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:16px 18px;margin-bottom:20px}
.kb2-drug-search-row{display:flex;gap:8px;margin-bottom:10px}
.kb2-drug-input{flex:1;height:38px;background:#0b1e36;border:1.5px solid var(--border);border-radius:8px;padding:0 14px;color:var(--text-primary);font-size:13px;font-family:'DM Sans',sans-serif;outline:none;transition:border-color .2s}
.kb2-drug-input:focus{border-color:var(--accent-cyan)}
.kb2-drug-input::placeholder{color:var(--text-dim)}
.kb2-drug-btn{height:38px;padding:0 16px;background:#052535;border:1px solid var(--accent-cyan);border-radius:8px;color:var(--accent-cyan);font-size:12px;font-weight:600;cursor:pointer;transition:all .2s;font-family:'DM Sans',sans-serif}
.kb2-drug-btn:hover{background:#0a3f55}
.kb2-drug-cat-row{display:flex;gap:6px;flex-wrap:wrap}
.kb2-drug-cat{padding:4px 10px;border-radius:20px;font-size:10px;border:1px solid var(--border);background:transparent;color:var(--text-muted);cursor:pointer;transition:all .15s;font-family:'DM Sans',sans-serif}
.kb2-drug-cat:hover{border-color:var(--accent-cyan);color:var(--accent-cyan)}
.kb2-drug-cat.active{background:#052535;border-color:var(--accent-cyan);color:var(--accent-cyan)}
.kb2-drug-qr{background:var(--bg-card);border:1px solid var(--border);border-left:3px solid var(--accent-cyan);border-radius:8px;padding:12px 14px;margin-bottom:8px;cursor:pointer;transition:all .15s}
.kb2-drug-qr:hover{background:var(--bg-elevated);border-left-color:var(--accent-teal)}
.kb2-drug-qr-top{display:flex;align-items:center;gap:8px;margin-bottom:6px}
.kb2-drug-qr-name{font-size:13px;font-weight:600;color:var(--text-primary)}
.kb2-drug-qr-generic{font-size:11px;color:var(--text-muted);font-style:italic}
.kb2-drug-qr-class{margin-left:auto;font-size:9px;padding:2px 7px;border-radius:3px;background:#1a3040;color:#00d4ff;font-weight:600;text-transform:uppercase}
.kb2-drug-qr-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;font-size:11px}
.kb2-drug-qr-field label{display:block;font-size:9px;color:var(--text-dim);text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px}
.kb2-drug-qr-field span{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--text-secondary)}
.kb2-drug-qr-links{display:flex;gap:8px;margin-top:8px}
.kb2-dql{font-size:10px;color:var(--accent-blue);text-decoration:none;background:var(--bg-elevated);border:1px solid var(--border);padding:2px 8px;border-radius:4px;transition:color .15s}
.kb2-dql:hover{color:var(--accent-cyan);border-color:var(--accent-cyan)}
.kb2-guide-cat-header{display:flex;align-items:center;gap:10px;padding:10px 0 8px;border-bottom:1px solid var(--border);margin-bottom:12px}
.kb2-guide-cat-icon{font-size:20px}
.kb2-guide-cat-title{font-family:'Playfair Display',serif;font-size:15px;font-weight:600;color:var(--text-primary)}
.kb2-guide-cat-count{font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--text-muted);background:var(--bg-elevated);padding:2px 7px;border-radius:10px}
.kb2-guide-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px;margin-bottom:24px}
.kb2-guide-card{background:var(--bg-card);border:1px solid var(--border);border-radius:8px;padding:12px 14px;display:block;transition:all .2s;cursor:pointer}
.kb2-guide-card:hover{border-color:var(--accent-blue);background:var(--bg-elevated);transform:translateY(-1px)}
.kb2-guide-card.selected{border-color:var(--accent-blue);background:#0a2040}
.kb2-guide-org{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:var(--accent-gold);font-family:'JetBrains Mono',monospace}
.kb2-guide-title{font-size:12px;font-weight:600;color:var(--text-primary);margin-bottom:3px;line-height:1.4}
.kb2-guide-desc{font-size:10px;color:var(--text-muted);line-height:1.5;margin-bottom:6px}
.kb2-guide-footer{display:flex;align-items:center;gap:6px}
.kb2-guide-year{font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--text-dim)}
.kb2-guide-pill{font-size:9px;padding:1px 6px;border-radius:3px;font-weight:600;text-transform:uppercase}
.kb2-guide-ext{margin-left:auto;font-size:10px;color:var(--accent-blue);display:flex;align-items:center;gap:3px}
.kb2-alpha-nav{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:14px}
.kb2-alpha-btn{width:26px;height:26px;display:flex;align-items:center;justify-content:center;background:var(--bg-card);border:1px solid var(--border);border-radius:5px;font-size:11px;font-weight:600;color:var(--text-muted);cursor:pointer;transition:all .15s;font-family:'JetBrains Mono',monospace}
.kb2-alpha-btn:hover{border-color:var(--accent-purple);color:var(--accent-purple)}
.kb2-alpha-btn.active{background:#1a0d35;border-color:var(--accent-purple);color:var(--accent-purple)}
.kb2-disease-group{margin-bottom:22px}
.kb2-disease-letter{font-family:'JetBrains Mono',monospace;font-size:22px;font-weight:600;color:var(--accent-purple);margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid var(--border)}
.kb2-disease-list{display:flex;flex-direction:column;gap:4px}
.kb2-disease-item{display:flex;align-items:stretch;background:var(--bg-card);border:1px solid var(--border);border-radius:8px;overflow:hidden;transition:all .15s}
.kb2-disease-item:hover{border-color:var(--border-bright)}
.kb2-disease-body{flex:1;padding:9px 12px}
.kb2-disease-name{font-size:12px;font-weight:600;color:var(--text-primary);margin-bottom:2px}
.kb2-disease-aka{font-size:10px;color:var(--text-muted);font-style:italic}
.kb2-disease-links{display:flex;border-left:1px solid var(--border)}
.kb2-dis-link{display:flex;align-items:center;justify-content:center;padding:0 10px;font-size:10px;font-weight:600;text-decoration:none;cursor:pointer;transition:background .15s;border-right:1px solid var(--border);min-width:50px;flex-direction:column;gap:2px}
.kb2-dis-link:last-child{border-right:none}
.kb2-dis-link .dl-label{font-size:8px;text-transform:uppercase;letter-spacing:.3px}
.kb2-dis-link.uptodate{color:var(--accent-blue)}
.kb2-dis-link.uptodate:hover{background:#0a2040}
.kb2-dis-link.guide{color:var(--accent-gold)}
.kb2-dis-link.guide:hover{background:#2e2010}
.kb2-dis-link.pubmed{color:#3dffa0}
.kb2-dis-link.pubmed:hover{background:#0d2e20}
.kb2-ed-hero{background:linear-gradient(135deg,#1a0505 0%,#2e0d0d 50%,#200505 100%);border:1px solid rgba(255,107,107,.2);border-radius:12px;padding:16px 20px;margin-bottom:20px;display:flex;align-items:center;gap:16px}
.kb2-ed-hero-icon{font-size:36px}
.kb2-ed-hero-title{font-family:'Playfair Display',serif;font-size:17px;font-weight:700;color:var(--text-primary)}
.kb2-ed-hero-sub{font-size:11px;color:#cc7a7a;margin-top:2px}
.kb2-ed-stats{margin-left:auto;display:flex;gap:14px}
.kb2-ed-stat{text-align:center}
.kb2-ed-stat-val{font-family:'JetBrains Mono',monospace;font-size:20px;font-weight:600;color:var(--accent-coral);display:block}
.kb2-ed-stat-lbl{font-size:9px;color:var(--text-muted);text-transform:uppercase}
.kb2-ed-card{background:var(--bg-card);border:1px solid var(--border);border-left:3px solid var(--accent-coral);border-radius:8px;padding:12px 14px;margin-bottom:8px;transition:all .15s;text-decoration:none;display:block}
.kb2-ed-card:hover{background:var(--bg-elevated);border-left-color:var(--accent-gold);transform:translateX(2px)}
.kb2-ed-card-top{display:flex;align-items:center;gap:8px;margin-bottom:5px}
.kb2-ed-card-icon{font-size:16px}
.kb2-ed-card-name{font-size:13px;font-weight:600;color:var(--text-primary);flex:1}
.kb2-ed-card-type{font-size:9px;padding:2px 6px;border-radius:3px;font-weight:600;text-transform:uppercase;background:#401a1a;color:#ff6b6b}
.kb2-ed-card-desc{font-size:11px;color:var(--text-secondary);line-height:1.4;margin-bottom:6px}
.kb2-ed-card-tags{display:flex;gap:5px;flex-wrap:wrap}
.kb2-ed-card-tag{font-size:9px;padding:1px 6px;border-radius:3px;background:var(--bg-elevated);color:var(--text-muted);font-weight:500}
.kb2-ai-panel{width:280px;flex-shrink:0;background:#060e1c;border-left:1px solid var(--border);display:flex;flex-direction:column;overflow:hidden}
.kb2-ai-header{padding:12px 14px 10px;border-bottom:1px solid var(--border);background:#040d1a;flex-shrink:0}
.kb2-ai-header-row{display:flex;align-items:center;gap:8px;margin-bottom:8px}
.kb2-ai-dot{width:8px;height:8px;border-radius:50%;background:var(--accent-teal);animation:pulse-dot2 2s infinite;flex-shrink:0}
@keyframes pulse-dot2{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(0,229,192,.4)}50%{opacity:.8;box-shadow:0 0 0 4px rgba(0,229,192,0)}}
.kb2-ai-title{font-size:12px;font-weight:600;color:var(--text-primary)}
.kb2-ai-model{margin-left:auto;font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--text-dim);background:var(--bg-elevated);padding:2px 6px;border-radius:3px}
.kb2-ai-quick-btns{display:flex;flex-wrap:wrap;gap:5px}
.kb2-ai-qbtn{padding:4px 9px;font-size:10px;background:var(--bg-elevated);border:1px solid var(--border);border-radius:5px;color:var(--text-muted);cursor:pointer;transition:all .15s;font-family:'DM Sans',sans-serif}
.kb2-ai-qbtn:hover{border-color:var(--accent-teal);color:var(--accent-teal)}
.kb2-ai-chat{flex:1;padding:12px 14px;overflow-y:auto}
.kb2-ai-chat::-webkit-scrollbar{width:3px}
.kb2-ai-chat::-webkit-scrollbar-thumb{background:var(--border)}
.kb2-ai-msg{padding:10px 12px;border-radius:8px;margin-bottom:10px;font-size:12px;line-height:1.6;animation:fadeUp2 .3s ease}
@keyframes fadeUp2{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
.kb2-ai-msg.system{background:var(--bg-elevated);border:1px solid var(--border);color:var(--text-secondary)}
.kb2-ai-msg.user{background:#0a2040;border:1px solid rgba(59,158,255,.2);color:var(--text-primary);text-align:right}
.kb2-ai-msg.assistant{background:#062020;border:1px solid rgba(0,229,192,.15);color:var(--text-secondary)}
.kb2-ai-msg.loading{display:flex;gap:4px;align-items:center;background:var(--bg-elevated);border:1px solid var(--border);padding:12px}
.kb2-typing-dot{width:6px;height:6px;border-radius:50%;background:var(--accent-teal);animation:bounce2 1.2s infinite}
.kb2-typing-dot:nth-child(2){animation-delay:.2s}
.kb2-typing-dot:nth-child(3){animation-delay:.4s}
@keyframes bounce2{0%,80%,100%{transform:scale(0.6);opacity:.5}40%{transform:scale(1);opacity:1}}
.kb2-ai-label{font-size:9px;text-transform:uppercase;letter-spacing:.6px;color:var(--accent-teal);margin-bottom:5px;font-weight:600}
.kb2-ai-input-wrap{padding:10px 14px;border-top:1px solid var(--border);flex-shrink:0}
.kb2-ai-input-row{display:flex;gap:6px}
.kb2-ai-input{flex:1;height:36px;background:var(--bg-elevated);border:1px solid var(--border);border-radius:8px;padding:0 10px;color:var(--text-primary);font-size:12px;font-family:'DM Sans',sans-serif;outline:none;transition:border-color .2s}
.kb2-ai-input:focus{border-color:var(--accent-teal)}
.kb2-ai-input::placeholder{color:var(--text-dim)}
.kb2-ai-send-btn{width:36px;height:36px;background:#062020;border:1px solid rgba(0,229,192,.3);border-radius:8px;color:var(--accent-teal);font-size:16px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s}
.kb2-ai-send-btn:hover{background:#0a3030;border-color:var(--accent-teal)}
.kb2-bottom-nav{background:#040d1a;border-top:1px solid var(--border);flex-shrink:0;margin-left:72px}
.kb2-bnav-row{display:flex;gap:2px;padding:6px 12px;border-bottom:1px solid var(--border);flex-wrap:wrap}
.kb2-bnav-row:last-child{border-bottom:none}
.kb2-bnav-tab{padding:5px 14px;border-radius:6px;border:none;background:transparent;color:var(--text-muted);font-size:11px;font-family:'DM Sans',sans-serif;cursor:pointer;transition:all .15s;white-space:nowrap}
.kb2-bnav-tab:hover{background:var(--bg-card);color:var(--text-secondary)}
.kb2-bnav-tab.active{background:#0a2040;color:var(--accent-blue);font-weight:600}
.kb2-bnav-tab.active-cyan{background:#052535;color:var(--accent-cyan);font-weight:600}
.kb2-bnav-tab.active-purple{background:#1a0d35;color:var(--accent-purple);font-weight:600}
.kb2-bnav-tab.active-coral{background:#2e0d0d;color:var(--accent-coral);font-weight:600}
mark{background:rgba(59,158,255,.25);color:#00d4ff;border-radius:2px;padding:0 2px}
.kb2-no-results{text-align:center;padding:40px 20px;color:var(--text-muted);font-size:13px}
.kb2-no-results-icon{font-size:36px;margin-bottom:8px}

/* ── NEW: Detail Panel Styles ── */
.gl-detail-panel{animation:gl-slide-in .25s ease forwards}
@keyframes gl-slide-in{from{opacity:0;transform:translateX(14px)}to{opacity:1;transform:translateX(0)}}
.gl-tab-btn{transition:all .15s;cursor:pointer;border:none;background:transparent;font-family:'DM Sans',sans-serif}
.gl-tab-btn:hover{color:var(--text-primary)!important}
`;

function highlight(text, q) {
  if (!q) return text;
  const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(re, '<mark>$1</mark>');
}

// ─── EXISTING SUB-COMPONENTS ──────────────────────────────────────────────────

function TopNavBar({ user, tab, setTab }) {
  const initials = user?.full_name ? user.full_name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() : 'DR';
  return (
    <div className="kb2-topnav">
      <div className="kb2-topnav-brand">
        <span className="kb2-topnav-logo">Notrya</span>
        <div className="kb2-topnav-sep"/>
        <span className="kb2-topnav-subtitle">Medical Knowledge Base</span>
      </div>
      <div className="kb2-topnav-spacer"/>
      <div className="kb2-topnav-btns">
        <button className={`kb2-topnav-btn${['search','drugs','guidelines','diseases','ed'].includes(tab)?' active':''}`} onClick={()=>setTab('search')}>🏥 Knowledge Base</button>
        <a className="kb2-topnav-btn" href="/NoteEditorTabs" target="_blank" rel="noopener noreferrer">📝 Clinical Notes</a>
        <a className="kb2-topnav-btn" href="/Dashboard" target="_blank" rel="noopener noreferrer">📊 Dashboard</a>
      </div>
      <div className="kb2-topnav-avatar">{initials}</div>
    </div>
  );
}

function VitalsBar({ user }) {
  return (
    <div className="kb2-vitals">
      <div className="kb2-patient-chip">
        <div>
          <div className="kb2-patient-name">{user?.full_name || 'Clinician'}</div>
          <div className="kb2-patient-mrn">{user?.email || 'Knowledge Base Mode'}</div>
        </div>
      </div>
      <div className="kb2-vit-sep"/>
      {[['BP','118/76'],['HR','72'],['RR','16'],['SpO₂','98%'],['GCS','15']].map(([l,v])=>(
        <div key={l} className="kb2-vit-item"><div className="kb2-vit-label">{l}</div><div className="kb2-vit-val">{v}</div></div>
      ))}
      <div className="kb2-vit-item"><div className="kb2-vit-label">Temp</div><div className="kb2-vit-val abn">38.6°C</div></div>
      <div className="kb2-vit-sep"/>
      <div className="kb2-vit-item"><div className="kb2-vit-label">Mode</div><div className="kb2-vit-val" style={{color:'var(--accent-teal)'}}>Knowledge Base</div></div>
    </div>
  );
}

function SearchTab() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const filters = ['all','drug','disease','guide','ed'];
  const typeIcon = {drug:'💊',disease:'🩺',guide:'📋',ed:'🚨'};
  const tagClass = {drug:'tag-drug2',disease:'tag-disease2',guide:'tag-guide2',ed:'tag-ed2'};
  const typeLabel = {drug:'Drug',disease:'Disease',guide:'Guideline',ed:'ED Resource'};
  const results = query.trim() ? SEARCH_INDEX.filter(item => {
    const matchType = filter === 'all' || item.type === filter;
    const q = query.toLowerCase();
    return matchType && (item.name.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q));
  }) : [];
  const QUICK_ACCESS = [
    {icon:'📖',title:'UpToDate',abbr:'WOLTERS KLUWER',desc:'Evidence-based clinical decision support with synthesised recommendations for thousands of medical topics.',url:'https://www.uptodate.com',bg:'#0a2040',link:'Open UpToDate'},
    {icon:'🔬',title:'DynaMed',abbr:'EBSCO HEALTH',desc:'Point-of-care clinical reference tool with systematic evidence summaries and graded recommendations.',url:'https://www.dynamed.com',bg:'#052535',link:'Open DynaMed'},
    {icon:'📚',title:'PubMed / MEDLINE',abbr:'NLM / NIH',desc:'Comprehensive biomedical literature database with millions of indexed citations and abstracts.',url:'https://pubmed.ncbi.nlm.nih.gov',bg:'#0d2520',link:'Search PubMed'},
    {icon:'🧮',title:'MDCalc',abbr:'CLINICAL DECISION TOOLS',desc:'500+ validated medical calculators, scores, and decision trees across all specialties.',url:'https://www.mdcalc.com',bg:'#1a0d35',link:'Open MDCalc'},
    {icon:'🌐',title:'Medscape Reference',abbr:'WEBMD HEALTH',desc:'Drug monographs, disease references, and clinical procedures with peer-reviewed content.',url:'https://reference.medscape.com',bg:'#1a1a05',link:'Open Medscape'},
    {icon:'🏆',title:'Cochrane Library',abbr:'COCHRANE COLLABORATION',desc:'Gold standard systematic reviews and meta-analyses. The highest level of evidence in clinical medicine.',url:'https://www.cochranelibrary.com',bg:'#1a0505',link:'Search Reviews'},
  ];
  return (
    <div>
      <div className="kb2-search-hero">
        <div className="kb2-search-hero-title">🔍 Medical Knowledge Search</div>
        <div className="kb2-search-hero-sub">Search across drugs, diseases, clinical guidelines, and ED resources simultaneously</div>
        <div className="kb2-search-bar-wrap">
          <div className="kb2-search-input-wrap">
            <span className="kb2-search-icon">🔍</span>
            <input className="kb2-search-input" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search: sepsis, metoprolol, ACS guidelines, pneumonia..."/>
          </div>
          <button className="kb2-search-btn">Search</button>
        </div>
        <div className="kb2-filter-chips">
          {filters.map(f=>(<button key={f} className={`kb2-filter-chip${filter===f?' active':''}`} onClick={()=>setFilter(f)}>{f==='all'?'All':typeIcon[f]+' '+f.charAt(0).toUpperCase()+f.slice(1)+'s'}</button>))}
        </div>
        {query.trim() && (
          <div className="kb2-search-results">
            {results.length === 0 ? (
              <div className="kb2-no-results"><div className="kb2-no-results-icon">🔍</div>No results for "{query}"</div>
            ) : results.slice(0,12).map((r,i)=>(
              <a key={i} className="kb2-result-item" href={r.url} target="_blank" rel="noopener noreferrer">
                <div className="kb2-result-icon">{typeIcon[r.type]}</div>
                <div>
                  <div className="kb2-result-name" dangerouslySetInnerHTML={{__html:highlight(r.name,query)}}/>
                  <div className="kb2-result-desc" dangerouslySetInnerHTML={{__html:highlight(r.desc,query)}}/>
                  <span className={`kb2-result-tag ${tagClass[r.type]}`}>{typeLabel[r.type]}</span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
      <div className="kb2-section-title">Quick Access Resources</div>
      <div className="kb2-section-sub">Direct links to the most-used clinical references</div>
      <div className="kb2-cards-grid">
        {QUICK_ACCESS.map((c,i)=>(
          <a key={i} className="kb2-card" href={c.url} target="_blank" rel="noopener noreferrer">
            <div className="kb2-card-header"><div className="kb2-card-icon" style={{background:c.bg}}>{c.icon}</div><div><div className="kb2-card-title">{c.title}</div><div className="kb2-card-abbr">{c.abbr}</div></div></div>
            <div className="kb2-card-desc">{c.desc}</div>
            <div className="kb2-card-link">{c.link} ↗</div>
          </a>
        ))}
      </div>
    </div>
  );
}

function DrugsTab() {
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('all');
  const cats = ['all','cardiac','abx','analgesic','anticoag','neuro','resp','endo','em'];
  const filtered = DRUGS_QR.filter(d => {
    const matchCat = cat === 'all' || d.cat.includes(cat);
    const q = search.toLowerCase();
    return matchCat && (!q || d.name.toLowerCase().includes(q) || d.cls.toLowerCase().includes(q));
  });
  const DB_LINKS = [
    {icon:'💊',title:'Drugs.com',abbr:'LARGEST DRUG DATABASE',desc:'Consumer and professional drug information, interactions, side effects, and dosage guides.',url:'https://www.drugs.com',bg:'#052535',link:'Search Drugs.com'},
    {icon:'📱',title:'Epocrates',abbr:'athenahealth',desc:'Point-of-care drug reference with real-time drug interactions, dosing calculators, and clinical tools.',url:'https://www.epocrates.com',bg:'#0a2040',link:'Open Epocrates'},
    {icon:'🏥',title:'Micromedex',abbr:'IBM / MERATIVE',desc:'Evidence-based drug, disease, and toxicology information trusted by pharmacists and clinicians worldwide.',url:'https://www.micromedexsolutions.com',bg:'#1a1a05',link:'Open Micromedex'},
    {icon:'🇺🇸',title:'FDA Drug Database',abbr:'FDA / CDER',desc:'Official FDA approved drug information, labels, NDA/ANDA approvals, and safety communications.',url:'https://www.accessdata.fda.gov/scripts/cder/daf/',bg:'#0d1520',link:'Search FDA Drugs'},
    {icon:'📄',title:'DailyMed',abbr:'NLM / NIH',desc:'Official FDA labels (package inserts) with prescribing information as submitted to and approved by the FDA.',url:'https://dailymed.nlm.nih.gov',bg:'#0d2520',link:'Search DailyMed'},
    {icon:'⚠️',title:'CredibleMeds / AZCERT',abbr:'QT DRUG SAFETY',desc:'Comprehensive QT drug risk classifications and drug-induced arrhythmia risk database for clinical use.',url:'https://www.crediblemeds.org',bg:'#1a0505',link:'Check QT Risk'},
  ];
  return (
    <div>
      <div className="kb2-section-title">💊 Drug Information</div>
      <div className="kb2-section-sub">Search drug databases, view pharmacology, dosing, interactions, and safety data</div>
      <div className="kb2-drug-search-wrap">
        <div className="kb2-drug-search-row">
          <input className="kb2-drug-input" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by generic name, brand name, or drug class..."/>
          <button className="kb2-drug-btn">Search Drugs</button>
        </div>
        <div className="kb2-drug-cat-row">
          {cats.map(c=>(<button key={c} className={`kb2-drug-cat${cat===c?' active':''}`} onClick={()=>setCat(c)}>{c==='all'?'All Classes':c.charAt(0).toUpperCase()+c.slice(1)}</button>))}
        </div>
      </div>
      <div className="kb2-section-title" style={{fontSize:14,marginBottom:8}}>Drug Reference Databases</div>
      <div className="kb2-cards-grid" style={{marginBottom:20}}>
        {DB_LINKS.map((c,i)=>(
          <a key={i} className="kb2-card" href={c.url} target="_blank" rel="noopener noreferrer">
            <div className="kb2-card-header"><div className="kb2-card-icon" style={{background:c.bg}}>{c.icon}</div><div><div className="kb2-card-title">{c.title}</div><div className="kb2-card-abbr">{c.abbr}</div></div></div>
            <div className="kb2-card-desc">{c.desc}</div>
            <div className="kb2-card-link">{c.link} ↗</div>
          </a>
        ))}
      </div>
      <div className="kb2-section-title" style={{fontSize:14,marginBottom:4}}>⚡ Emergency Drug Quick Reference</div>
      <div className="kb2-section-sub">Common ED/ICU medications</div>
      {filtered.map((d,i)=>(
        <div key={i} className="kb2-drug-qr">
          <div className="kb2-drug-qr-top">
            <span className="kb2-drug-qr-name">{d.name}</span>
            <span className="kb2-drug-qr-generic">({d.generic})</span>
            <span className="kb2-drug-qr-class">{d.cls}</span>
          </div>
          <div className="kb2-drug-qr-grid">
            {d.fields.map((f,j)=>(<div key={j} className="kb2-drug-qr-field"><label>{f.label}</label><span>{f.val}</span></div>))}
          </div>
          <div className="kb2-drug-qr-links">
            {d.links.map((l,j)=>(<a key={j} className="kb2-dql" href={l.url} target="_blank" rel="noopener noreferrer">{l.label}</a>))}
          </div>
        </div>
      ))}
      {filtered.length===0 && <div className="kb2-no-results"><div className="kb2-no-results-icon">💊</div>No drugs match your search</div>}
    </div>
  );
}

// ─── NEW: GUIDELINE DETAIL COMPONENTS ────────────────────────────────────────

function GuidelineAIPanel({ guide, rich }) {
  const [mode, setMode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  const generate = async (m) => {
    setMode(m); setLoading(true); setSummary(null); setError(null);
    const contextLines = rich
      ? `Key Points:\n${rich.keyPoints.join('\n')}\nRecommendations:\n${rich.recs.map(r=>`${r.cls}: ${r.text}`).join('\n')}`
      : `Description: ${guide.desc}`;
    const prompt = m === 'clinician'
      ? `You are a senior clinician. Summarize this clinical guideline in 6 concise bullet points for clinical use. Use precise medical language. Lead each bullet with an appropriate emoji (🔴 critical, 🟡 moderate, 🟢 supportive). No markdown formatting.\n\nGuideline: "${guide.title}" (${guide.org}, ${guide.year})\n${contextLines}`
      : `You are a patient educator. Explain this medical guideline in plain, jargon-free language a patient can understand. Write 5 short sentences. Start by explaining what the guideline is about, then what it means for patients.\n\nGuideline: "${guide.title}" (${guide.org}, ${guide.year})\n${contextLines}`;
    try {
      const res = await base44.integrations.Core.InvokeLLM({ prompt, add_context_from_internet: false });
      setSummary(typeof res === 'string' ? res : JSON.stringify(res));
    } catch(e) {
      setError('Summary generation failed — please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{display:'flex',flexDirection:'column',gap:10}}>
      <div style={{display:'flex',gap:8}}>
        {[['clinician','🩺 Clinician Summary'],['patient','👤 Patient Explanation']].map(([m,label])=>(
          <button key={m} className="gl-tab-btn" onClick={()=>generate(m)}
            style={{flex:1,padding:'9px',borderRadius:9,border:`1px solid ${!loading&&summary&&mode===m?'rgba(0,229,192,.5)':'var(--border-bright)'}`,background:!loading&&summary&&mode===m?'rgba(0,229,192,.08)':'var(--bg-elevated)',color:loading&&mode===m?'var(--accent-purple)':!loading&&summary&&mode===m?'var(--accent-teal)':'var(--text-secondary)',fontWeight:600,fontSize:12,display:'flex',alignItems:'center',justifyContent:'center',gap:6,transition:'all .2s'}}>
            {loading&&mode===m?<><div style={{width:11,height:11,border:'2px solid var(--accent-purple)',borderTopColor:'transparent',borderRadius:'50%',animation:'bounce2 1s linear infinite'}}/> Generating…</>:label}
          </button>
        ))}
      </div>
      {!summary&&!loading&&(
        <div style={{padding:'24px',textAlign:'center',color:'var(--text-muted)',border:'1px dashed var(--border)',borderRadius:10,fontSize:12}}>
          <div style={{fontSize:28,marginBottom:8}}>🤖</div>
          <div>Select a mode above — AI will generate a tailored summary using the guideline content</div>
          <div style={{fontSize:10,color:'var(--text-dim)',marginTop:6}}>Powered by base44 AI · {guide.org} {guide.year}</div>
        </div>
      )}
      {error&&<div style={{padding:'10px 14px',background:'rgba(255,107,107,.1)',border:'1px solid rgba(255,107,107,.3)',borderRadius:8,color:'var(--accent-coral)',fontSize:12}}>{error}</div>}
      {summary&&(
        <div style={{background:mode==='patient'?'rgba(0,229,192,.05)':'rgba(155,109,255,.06)',border:`1px solid ${mode==='patient'?'rgba(0,229,192,.25)':'rgba(155,109,255,.3)'}`,borderRadius:10,padding:'14px 16px',animation:'fadeUp2 .3s ease'}}>
          <div style={{fontSize:9,fontWeight:700,letterSpacing:'.8px',textTransform:'uppercase',color:mode==='patient'?'var(--accent-teal)':'var(--accent-purple)',marginBottom:8}}>
            {mode==='patient'?'👤 PATIENT-FRIENDLY EXPLANATION':'🩺 CLINICIAN SUMMARY'} · AI Generated
          </div>
          <div style={{fontSize:12.5,color:'var(--text-secondary)',lineHeight:1.85,whiteSpace:'pre-line'}}>{summary}</div>
          <div style={{marginTop:10,fontSize:10,color:'var(--text-dim)',fontStyle:'italic'}}>⚠ AI-generated for reference only — always verify against the full published guideline.</div>
        </div>
      )}
    </div>
  );
}

function GuidelineDetailPanel({ guide, onClose }) {
  const [tab, setTab] = useState('overview');
  const rich = getRichDetail(guide);
  const tabs = rich
    ? [{id:'overview',icon:'📋',label:'Overview'},{id:'recs',icon:'🎯',label:'Key Recs'},{id:'studies',icon:'🔬',label:'Evidence'},{id:'ai',icon:'🤖',label:'AI Summary'}]
    : [{id:'overview',icon:'📋',label:'Overview'},{id:'ai',icon:'🤖',label:'AI Summary'},{id:'links',icon:'🔗',label:'Links & Resources'}];

  return (
    <div className="gl-detail-panel" style={{display:'flex',flexDirection:'column',height:'100%',gap:10}}>
      {/* Header */}
      <div style={{background:`linear-gradient(135deg,rgba(59,158,255,.1),rgba(8,22,40,.9))`,border:'1px solid rgba(59,158,255,.25)',borderRadius:10,padding:'14px 16px',position:'relative',overflow:'hidden',flexShrink:0}}>
        <div style={{position:'absolute',top:-14,right:-8,fontSize:60,opacity:.05}}>📋</div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:10}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:'flex',gap:6,marginBottom:5,flexWrap:'wrap',alignItems:'center'}}>
              <span style={{fontSize:9,fontWeight:700,color:'var(--accent-gold)',fontFamily:'JetBrains Mono,monospace',textTransform:'uppercase',letterSpacing:'.6px'}}>{guide.org}</span>
              <span style={{fontSize:9,color:'var(--text-dim)',fontFamily:'JetBrains Mono,monospace',background:'var(--bg-elevated)',padding:'1px 6px',borderRadius:3}}>{guide.year}</span>
              {rich && <span style={{fontSize:9,padding:'1px 6px',borderRadius:10,background:'rgba(0,229,192,.12)',border:'1px solid rgba(0,229,192,.3)',color:'var(--accent-teal)',fontWeight:600}}>✦ Rich Detail</span>}
            </div>
            <div style={{fontFamily:'Playfair Display,serif',fontSize:14,fontWeight:600,color:'var(--text-primary)',lineHeight:1.4}}>{guide.title}</div>
          </div>
          <button onClick={onClose} style={{background:'rgba(255,107,107,.1)',border:'1px solid rgba(255,107,107,.3)',color:'var(--accent-coral)',padding:'3px 9px',borderRadius:6,cursor:'pointer',fontSize:11,fontWeight:600,fontFamily:'DM Sans,sans-serif',flexShrink:0}}>✕</button>
        </div>
        <div style={{display:'flex',gap:4,marginTop:8,flexWrap:'wrap'}}>
          <span style={guide.pillStyle||{background:'#0a2040',color:'var(--accent-blue)',fontSize:9,padding:'1px 7px',borderRadius:3,fontWeight:600,textTransform:'uppercase'}} className="kb2-guide-pill">{guide.pill}</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:4,background:'var(--bg-elevated)',borderRadius:8,padding:'4px',flexShrink:0}}>
        {tabs.map(t=>(
          <button key={t.id} className="gl-tab-btn" onClick={()=>setTab(t.id)}
            style={{flex:1,padding:'6px',borderRadius:6,border:`1px solid ${tab===t.id?'rgba(59,158,255,.5)':'transparent'}`,background:tab===t.id?'#0a2040':'transparent',color:tab===t.id?'var(--accent-blue)':'var(--text-muted)',fontSize:11,fontWeight:tab===t.id?600:400,textAlign:'center'}}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{flex:1,overflowY:'auto',display:'flex',flexDirection:'column',gap:10}}>

        {tab==='overview' && (
          <div style={{animation:'fadeUp2 .25s ease',display:'flex',flexDirection:'column',gap:10}}>
            <div style={{padding:'13px 15px',background:'rgba(59,158,255,.06)',border:'1px solid rgba(59,158,255,.2)',borderRadius:9}}>
              <div style={{fontSize:9,fontWeight:700,color:'var(--accent-blue)',textTransform:'uppercase',letterSpacing:1.5,marginBottom:7}}>SYNOPSIS</div>
              <div style={{fontSize:13,color:'var(--text-primary)',lineHeight:1.8}}>{rich?.synopsis || guide.desc}</div>
            </div>
            {rich?.keyPoints && <>
              <div style={{fontSize:9,fontWeight:700,color:'var(--accent-teal)',textTransform:'uppercase',letterSpacing:1.5}}>KEY POINTS</div>
              {rich.keyPoints.map((pt,i)=>(
                <div key={i} style={{display:'flex',gap:10,padding:'9px 12px',background:'var(--bg-elevated)',border:'1px solid var(--border)',borderRadius:8}}>
                  <span style={{fontFamily:'JetBrains Mono,monospace',fontSize:9,fontWeight:700,color:'var(--accent-gold)',flexShrink:0,marginTop:2}}>{String(i+1).padStart(2,'0')}</span>
                  <span style={{fontSize:12.5,color:'var(--text-secondary)',lineHeight:1.65}}>{pt}</span>
                </div>
              ))}
            </>}
            <a href={guide.url} target="_blank" rel="noopener noreferrer" style={{display:'flex',gap:8,padding:'10px 13px',background:'rgba(0,212,255,.05)',border:'1px solid rgba(0,212,255,.15)',borderRadius:8,alignItems:'center',textDecoration:'none'}}>
              <span style={{color:'var(--accent-cyan)',fontSize:14}}>🔗</span>
              <div>
                <div style={{fontSize:11,fontWeight:600,color:'var(--accent-cyan)'}}>Open Full Guideline — {guide.org}</div>
                <div style={{fontSize:9,color:'var(--text-dim)',fontFamily:'JetBrains Mono,monospace',marginTop:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:320}}>{guide.url}</div>
              </div>
              <span style={{marginLeft:'auto',fontSize:11,color:'var(--accent-cyan)'}}>↗</span>
            </a>
          </div>
        )}

        {tab==='recs' && rich?.recs && (
          <div style={{animation:'fadeUp2 .25s ease',display:'flex',flexDirection:'column',gap:8}}>
            <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:2}}>Formal recommendations from <strong style={{color:'var(--text-primary)'}}>{guide.org}</strong>:</div>
            {rich.recs.map((r,i)=>{
              const isHigh = /Class I |^A$|Strong|Grade A/i.test(r.cls);
              const isMid  = /IIa|^B|Conditional|Moderate/i.test(r.cls);
              const c = isHigh?'var(--accent-green)':isMid?'var(--accent-gold)':'var(--accent-blue)';
              return (
                <div key={i} style={{padding:'12px 15px',borderRadius:10,background:isHigh?'rgba(61,255,160,.06)':isMid?'rgba(245,200,66,.06)':'rgba(59,158,255,.06)',border:`1px solid ${isHigh?'rgba(61,255,160,.2)':isMid?'rgba(245,200,66,.2)':'rgba(59,158,255,.2)'}`}}>
                  <div style={{fontSize:9,fontWeight:700,color:c,textTransform:'uppercase',letterSpacing:1,marginBottom:6,display:'flex',alignItems:'center',gap:6}}>
                    <span style={{padding:'1px 7px',borderRadius:10,background:`${c}18`,border:`1px solid ${c}44`}}>{r.cls}</span>
                  </div>
                  <div style={{fontSize:13,color:'var(--text-primary)',lineHeight:1.65,fontWeight:500}}>{r.text}</div>
                </div>
              );
            })}
          </div>
        )}

        {tab==='studies' && rich?.studies && (
          <div style={{animation:'fadeUp2 .25s ease',display:'flex',flexDirection:'column',gap:8}}>
            <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:2}}>Landmark evidence supporting this guideline:</div>
            {rich.studies.length === 0 && (
              <div style={{padding:'20px',textAlign:'center',color:'var(--text-muted)',fontSize:12,border:'1px dashed var(--border)',borderRadius:8}}>No linked studies — search PubMed for supporting evidence</div>
            )}
            {rich.studies.map(sid=>{
              const st = STUDIES_DB[sid];
              if (!st) return <div key={sid} style={{padding:'8px 12px',background:'var(--bg-elevated)',border:'1px solid var(--border)',borderRadius:7,fontSize:11,color:'var(--text-muted)',fontStyle:'italic'}}>{sid}</div>;
              return (
                <div key={sid} style={{background:'rgba(61,255,160,.04)',border:'1px solid rgba(61,255,160,.18)',borderRadius:10,padding:'12px 14px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6,gap:8}}>
                    <div style={{fontFamily:'Playfair Display,serif',fontStyle:'italic',fontSize:13,fontWeight:700,color:'var(--text-primary)',flex:1}}>{st.title}</div>
                    <span style={{fontSize:9,color:'var(--accent-green)',background:'rgba(61,255,160,.12)',padding:'2px 7px',borderRadius:4,fontFamily:'JetBrains Mono,monospace',flexShrink:0}}>{st.journal} {st.year}</span>
                  </div>
                  <div style={{display:'flex',gap:6,alignItems:'flex-start'}}>
                    <span style={{color:'var(--accent-green)',fontSize:12,flexShrink:0,marginTop:1}}>▸</span>
                    <div style={{fontSize:12,color:'var(--text-secondary)',lineHeight:1.65}}>{st.finding}</div>
                  </div>
                </div>
              );
            })}
            <a href={`https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(guide.title.split(':')[0])}`} target="_blank" rel="noopener noreferrer"
              style={{display:'flex',alignItems:'center',gap:6,padding:'8px 12px',background:'rgba(61,255,160,.06)',border:'1px solid rgba(61,255,160,.2)',borderRadius:8,fontSize:11,fontWeight:600,color:'var(--accent-green)',textDecoration:'none'}}>
              📚 Search PubMed for more evidence ↗
            </a>
          </div>
        )}

        {tab==='ai' && <GuidelineAIPanel guide={guide} rich={rich}/>}

        {tab==='links' && (
          <div style={{animation:'fadeUp2 .25s ease',display:'flex',flexDirection:'column',gap:8}}>
            <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:2}}>External resources for this guideline:</div>
            {[
              {label:`Open Full Guideline — ${guide.org}`,desc:'Official source document',url:guide.url,color:'var(--accent-blue)'},
              {label:'Search UpToDate',desc:`${guide.title.split(':')[0]} — evidence-based review`,url:`https://www.uptodate.com/contents/search?search=${encodeURIComponent(guide.title.split(':')[0])}`,color:'var(--accent-cyan)'},
              {label:'Search PubMed',desc:'Supporting literature and landmark trials',url:`https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(guide.title.split(':')[0])}`,color:'var(--accent-green)'},
              {label:'Search MDCalc',desc:'Related clinical calculators and scoring tools',url:`https://www.mdcalc.com/search#?terms=${encodeURIComponent(guide.title.split(' ').slice(0,3).join(' '))}`,color:'var(--accent-purple)'},
            ].map((l,i)=>(
              <a key={i} href={l.url} target="_blank" rel="noopener noreferrer"
                style={{display:'flex',gap:10,padding:'11px 14px',background:'var(--bg-elevated)',border:`1px solid ${l.color}22`,borderRadius:8,textDecoration:'none',transition:'border-color .15s'}}>
                <span style={{color:l.color,fontSize:14,marginTop:1}}>🔗</span>
                <div>
                  <div style={{fontSize:12,fontWeight:600,color:l.color,marginBottom:2}}>{l.label}</div>
                  <div style={{fontSize:10,color:'var(--text-muted)'}}>{l.desc}</div>
                </div>
                <span style={{marginLeft:'auto',color:l.color,alignSelf:'center'}}>↗</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── GUIDELINES DATA ─────────────────────────────────────────────────────────

const GUIDELINES_DATA = {
  Cardiology: {
    icon:'❤️', orgs:'ACC • AHA • ESC • HRS',
    items: [
      {org:'ACC / AHA',title:'2022 AHA/ACC Guideline for Chest Pain Evaluation and Diagnosis',desc:'Comprehensive framework for evaluating acute and chronic chest pain presentations, including high-sensitivity troponin pathways.',year:'2022',pill:'Class I Rec',pillStyle:{background:'#0a2040',color:'#3b9eff'},url:'https://www.ahajournals.org/doi/10.1161/CIR.0000000000001106'},
      {org:'AHA / ACC / HRS',title:'2023 ACC/AHA/ACEP Guideline: Management of Atrial Fibrillation',desc:'Updated AF management including rhythm vs rate control, anticoagulation decisions, and ablation indications.',year:'2023',pill:'Updated',pillStyle:{background:'#0a2040',color:'#3b9eff'},url:'https://www.ahajournals.org/doi/10.1161/CIR.0000000000001123'},
      {org:'ACC / AHA',title:'2022 AHA/ACC Guideline for Coronary Artery Disease',desc:'Evidence-based recommendations for stable and unstable CAD, revascularisation, and secondary prevention.',year:'2023',pill:'Focused Update',pillStyle:{background:'#0a2040',color:'#3b9eff'},url:'https://www.ahajournals.org/doi/10.1161/CIR.0000000000001063'},
      {org:'AHA / ACC / HFSA',title:'2022 AHA/ACC/HFSA Guideline for Heart Failure',desc:'Comprehensive HF management covering HFrEF, HFmrEF, HFpEF, device therapy, and hospitalisation management.',year:'2022',pill:'New',pillStyle:{background:'#052535',color:'#00d4ff'},url:'https://www.ahajournals.org/doi/10.1161/CIR.0000000000001172'},
      {org:'ACC / AHA',title:'2022 AHA/ACC/HFSA Guideline for STEMI Management',desc:'Primary PCI, door-to-balloon times, antithrombotic therapy, complete revascularisation, and secondary prevention.',year:'2022',pill:'Updated',pillStyle:{background:'#0a2040',color:'#3b9eff'},url:'https://www.ahajournals.org/doi/10.1161/CIR.0000000000001115'},
      {org:'ESC',title:'ESC Clinical Practice Guidelines Hub',desc:'European Society of Cardiology guidelines library covering ACS, HF, arrhythmia, prevention, and more.',year:'2024',pill:'Active',pillStyle:{background:'#0d2520',color:'#3dffa0'},url:'https://www.escardio.org/Guidelines/Clinical-Practice-Guidelines'},
      {org:'ACC / AHA',title:'2017 ACC/AHA Guideline for High Blood Pressure',desc:'Hypertension definition, classification (≥130/80 mmHg), and treatment thresholds with cardiovascular risk stratification.',year:'2017',pill:'Current',pillStyle:{background:'#0a2040',color:'#3b9eff'},url:'https://www.ahajournals.org/doi/10.1161/HYP.0000000000000065'},
    ]
  },
  'Infectious Diseases': {
    icon:'🦠', orgs:'IDSA • SCCM • WHO • CDC',
    items: [
      {org:'SCCM / ESICM',title:'Surviving Sepsis Campaign: International Guidelines',desc:'Hour-1 bundle, vasopressor selection, source control, antimicrobial stewardship for sepsis and septic shock.',year:'2021',pill:'Critical Care',pillStyle:{background:'#1a0505',color:'#ff6b6b'},url:'https://www.idsociety.org/practice-guideline/sepsis/'},
      {org:'IDSA / ATS',title:'IDSA/ATS Community-Acquired Pneumonia Guidelines',desc:'CAP diagnosis, severity assessment (PSI/CURB-65), empiric antibiotic selection, and outpatient vs inpatient criteria.',year:'2019',pill:'Updated',pillStyle:{background:'#0a2040',color:'#3b9eff'},url:'https://www.idsociety.org/practice-guideline/community-acquired-pneumonia-cap-in-adults/'},
      {org:'IDSA',title:'IDSA Urinary Tract Infection Guidelines',desc:'Uncomplicated UTI, pyelonephritis, catheter-associated UTI, and recurrent UTI diagnosis and treatment.',year:'2022',pill:'Updated',pillStyle:{background:'#0d2520',color:'#3dffa0'},url:'https://www.idsociety.org/practice-guideline/urinary-tract-infection-uti/'},
      {org:'IDSA',title:'IDSA Skin and Soft Tissue Infections Guidelines',desc:'Cellulitis, abscess, necrotising fasciitis — classification, diagnosis, empiric treatment, and MRSA management.',year:'2014',pill:'Current',pillStyle:{background:'#0a2040',color:'#3b9eff'},url:'https://www.idsociety.org/practice-guideline/skin-and-soft-tissue-infections/'},
      {org:'CDC / IDSA',title:'Clostridioides difficile Infection Guidelines',desc:'C. diff diagnosis, severity classification, fidaxomicin vs vancomycin vs metronidazole, and fecal microbiota transplantation.',year:'2021',pill:'Updated',pillStyle:{background:'#0d2520',color:'#3dffa0'},url:'https://www.idsociety.org/practice-guideline/clostridium-difficile/'},
      {org:'IDSA / ATS',title:'Hospital-Acquired & Ventilator-Associated Pneumonia',desc:'HAP/VAP diagnosis, de-escalation strategies, anti-MRSA and anti-pseudomonal coverage decisions.',year:'2016',pill:'Current',pillStyle:{background:'#0a2040',color:'#3b9eff'},url:'https://www.idsociety.org/practice-guideline/hospital-acquired-pneumonia-ventilator-associated-pneumonia/'},
    ]
  },
  Pulmonology: {
    icon:'🫁', orgs:'GOLD • GINA • ATS • BTS • ERS',
    items: [
      {org:'GOLD',title:'2024 GOLD Report: COPD Diagnosis, Management & Prevention',desc:'Updated spirometric criteria, ABCD groups replaced by GOLD A-E, inhaler selection algorithm, and exacerbation management.',year:'2024',pill:'Latest',pillStyle:{background:'#052535',color:'#00d4ff'},url:'https://goldcopd.org/2024-gold-report/'},
      {org:'GINA',title:'2024 GINA Global Strategy for Asthma Management',desc:'Step-up/step-down therapy, LABA+ICS combinations, biologics for severe asthma, and acute exacerbation protocols.',year:'2024',pill:'Latest',pillStyle:{background:'#052535',color:'#00d4ff'},url:'https://ginasthma.org/2024-gina-report/'},
      {org:'ATS / ERS / ESICM',title:'Berlin Definition & ARDS Management Guidelines',desc:'ARDS diagnosis, lung protective ventilation (6 mL/kg IBW), prone positioning, PEEP strategies, and neuromuscular blockade.',year:'2017',pill:'Critical Care',pillStyle:{background:'#1a0505',color:'#ff6b6b'},url:'https://www.thoracic.org/statements/pages/mtpi/icu-guidelines.php'},
      {org:'ACCP / ERS',title:'VTE and Pulmonary Embolism Diagnosis & Management',desc:'PE risk stratification (PESI), anticoagulation selection, thrombolysis indications, and duration of treatment.',year:'2021',pill:'Updated',pillStyle:{background:'#052535',color:'#00d4ff'},url:'https://www.chestnet.org/Guidelines-and-Resources/Guidelines-and-Consensus-Statements/Antithrombotic-Therapy'},
    ]
  },
  Endocrinology: {
    icon:'🧬', orgs:'ADA • AACE • ENDOCRINE SOCIETY',
    items: [
      {org:'ADA',title:'2024 ADA Standards of Medical Care in Diabetes',desc:'Classification, diagnosis, glucose targets, pharmacotherapy selection, cardiovascular risk reduction, and technology use in T1D/T2D.',year:'2024',pill:'Annual Update',pillStyle:{background:'#052535',color:'#00d4ff'},url:'https://diabetesjournals.org/care/issue/47/Supplement_1'},
      {org:'AACE / ACE',title:'2022 AACE Clinical Practice Guideline: Obesity',desc:'Comprehensive obesity management including lifestyle, pharmacotherapy (GLP-1 agonists), and bariatric surgery criteria.',year:'2022',pill:'New',pillStyle:{background:'#052535',color:'#00d4ff'},url:'https://www.aace.com/disease-state-resources/metabolic/clinical-practice-guidelines'},
      {org:'ATA',title:'American Thyroid Association Hypothyroidism Guidelines',desc:'Diagnosis, TSH targets, levothyroxine dosing, subclinical hypothyroidism management, and special populations.',year:'2014',pill:'Reference',pillStyle:{background:'#0a2040',color:'#3b9eff'},url:'https://www.thyroid.org/professionals/ata-professional-guidelines/'},
    ]
  },
  'Emergency Medicine': {
    icon:'🚨', orgs:'ACEP • ACEM • ERC • AHA',
    items: [
      {org:'ACEP',title:'ACEP Clinical Policies & Practice Guidelines',desc:'All ACEP evidence-based clinical policies covering ED presentations, procedures, and management decisions.',year:'2024',pill:'Hub',pillStyle:{background:'#052535',color:'#00d4ff'},url:'https://www.acep.org/clinical---practice-management/clinical-policies/'},
      {org:'AHA / ERC',title:'2020 AHA Guidelines for CPR and Emergency Cardiovascular Care',desc:'BLS/ACLS/PALS algorithms, post-cardiac arrest care, ROSC management, and therapeutic hypothermia.',year:'2020',pill:'Critical',pillStyle:{background:'#1a0505',color:'#ff6b6b'},url:'https://www.ahajournals.org/doi/10.1161/CIR.0000000000001122'},
      {org:'ACEP / ASA',title:'Acute Ischemic Stroke: tPA / Thrombolysis Guidelines',desc:'Inclusion/exclusion criteria for IV alteplase, time windows, BP management, and mechanical thrombectomy referral.',year:'2023',pill:'Time-Critical',pillStyle:{background:'#1a0505',color:'#ff6b6b'},url:'https://www.acep.org/globalassets/new-pdfs/clinical-policies/stroke.pdf'},
    ]
  },
  Neurology: {
    icon:'🧠', orgs:'AAN • ASA • ESO • AES',
    items: [
      {org:'AAN',title:'AAN Clinical Practice Guidelines Library',desc:'Comprehensive collection of neurology guidelines including epilepsy, MS, migraine, dementia, and neurocritical care.',year:'2024',pill:'Hub',pillStyle:{background:'#0a2040',color:'#3b9eff'},url:'https://www.aan.com/Guidelines/'},
      {org:'ASA / AHA',title:'2021 ASA/AHA Guideline for Stroke Prevention',desc:'Secondary stroke prevention including antiplatelet therapy, anticoagulation for AF, BP control, and lipid management.',year:'2021',pill:'Updated',pillStyle:{background:'#0a2040',color:'#3b9eff'},url:'https://www.ahajournals.org/doi/10.1161/STR.0000000000000375'},
      {org:'AAN / AES',title:'Status Epilepticus Treatment Guideline',desc:'Benzodiazepine first-line dosing, second-line AED selection (levetiracetam, fosphenytoin, valproate), and refractory SE management.',year:'2016',pill:'Current',pillStyle:{background:'#0a2040',color:'#3b9eff'},url:'https://www.aan.com/Guidelines/'},
      {org:'AAN / AHS',title:'Migraine Acute & Preventive Treatment Guidelines',desc:'Triptans, CGRP antagonists (gepants), preventive therapy (topiramate, propranolol, anti-CGRP mAbs), and refractory migraine.',year:'2021',pill:'Updated',pillStyle:{background:'#0a2040',color:'#3b9eff'},url:'https://www.aan.com/Guidelines/'},
    ]
  },
  Gastroenterology: {
    icon:'🫀', orgs:'ACG • AGA • ASGE • EASL',
    items: [
      {org:'ACG',title:'ACG Clinical Guideline: Upper GI Bleeding',desc:'Risk stratification (Glasgow-Blatchford), endoscopy timing, PPI dosing, variceal vs non-variceal bleed management.',year:'2021',pill:'Updated',pillStyle:{background:'#052535',color:'#00d4ff'},url:'https://gi.org/guidelines/'},
      {org:'AASLD',title:'AASLD Cirrhosis Practice Guidance',desc:'Variceal screening, SBP prophylaxis, hepatic encephalopathy management, HRS diagnosis, and liver transplant referral.',year:'2021',pill:'Updated',pillStyle:{background:'#052535',color:'#00d4ff'},url:'https://www.aasld.org/practice-guidelines'},
      {org:'ACG',title:'ACG Guideline: Crohn Disease & Ulcerative Colitis',desc:'Induction and maintenance therapy, biologic selection (anti-TNF, vedolizumab, ustekinumab), and surgery criteria.',year:'2023',pill:'Updated',pillStyle:{background:'#052535',color:'#00d4ff'},url:'https://gi.org/guidelines/'},
    ]
  },
  Nephrology: {
    icon:'🫘', orgs:'KDIGO • ASN • ERA-EDTA',
    items: [
      {org:'KDIGO',title:'KDIGO 2022 AKI Clinical Practice Guideline',desc:'AKI definition and staging (KDIGO), fluid management, RRT initiation criteria, contrast nephropathy prevention.',year:'2022',pill:'Updated',pillStyle:{background:'#052535',color:'#00d4ff'},url:'https://kdigo.org/guidelines/acute-kidney-injury/'},
      {org:'KDIGO',title:'KDIGO 2024 CKD Clinical Practice Guideline',desc:'GFR classification, albuminuria staging, CKD progression slowing (RAAS inhibition, SGLT2i), cardiovascular risk management.',year:'2024',pill:'Latest',pillStyle:{background:'#052535',color:'#00d4ff'},url:'https://kdigo.org/guidelines/ckd-evaluation-and-management/'},
    ]
  },
  Oncology: {
    icon:'🎗️', orgs:'ASCO • NCCN • ESMO • ASTRO',
    items: [
      {org:'NCCN',title:'NCCN Clinical Practice Guidelines in Oncology',desc:'Comprehensive evidence-based cancer guidelines across 60+ tumor types, treatment algorithms, and supportive care.',year:'2024',pill:'Hub',pillStyle:{background:'#052535',color:'#00d4ff'},url:'https://www.nccn.org/guidelines/category_1'},
      {org:'ESMO',title:'ESMO Febrile Neutropenia Guidelines',desc:'Risk stratification (MASCC score), oral vs IV antibiotics, G-CSF indications, and antifungal prophylaxis.',year:'2021',pill:'Updated',pillStyle:{background:'#0a2040',color:'#3b9eff'},url:'https://www.esmo.org/guidelines'},
      {org:'ASCO',title:'ASCO Guideline: VTE Prophylaxis in Cancer',desc:'Apixaban and rivaroxaban for outpatient VTE prevention, LMWH in hospitalized patients, and treatment of cancer-associated thrombosis.',year:'2023',pill:'Updated',pillStyle:{background:'#052535',color:'#00d4ff'},url:'https://www.asco.org/research-guidelines/quality-guidelines/guidelines'},
    ]
  },
  Rheumatology: {
    icon:'🦴', orgs:'ACR • EULAR • BSR',
    items: [
      {org:'ACR',title:'2021 ACR Guideline for Rheumatoid Arthritis Treatment',desc:'Treat-to-target strategy, csDMARD initiation, biologic and JAK inhibitor sequencing, and monitoring for toxicity.',year:'2021',pill:'Updated',pillStyle:{background:'#052535',color:'#00d4ff'},url:'https://www.rheumatology.org/Practice-Quality/Clinical-Support/Clinical-Practice-Guidelines'},
      {org:'ACR',title:'2020 ACR Guideline for Gout Management',desc:'Urate-lowering therapy initiation, allopurinol dosing, febuxostat, acute flare prophylaxis, and dietary recommendations.',year:'2020',pill:'Updated',pillStyle:{background:'#0a2040',color:'#3b9eff'},url:'https://www.rheumatology.org/Practice-Quality/Clinical-Support/Clinical-Practice-Guidelines'},
    ]
  },
  Psychiatry: {
    icon:'🧩', orgs:'APA • NICE • CANMAT • WFSBP',
    items: [
      {org:'APA',title:'APA Practice Guideline: Major Depressive Disorder',desc:'Antidepressant selection, augmentation strategies, ECT/TMS indications, psychotherapy, and treatment-resistant depression.',year:'2023',pill:'Updated',pillStyle:{background:'#052535',color:'#00d4ff'},url:'https://www.psychiatry.org/psychiatrists/practice/clinical-practice-guidelines'},
      {org:'SAMHSA',title:'SAMHSA Opioid Use Disorder Treatment Guidelines',desc:'Buprenorphine/naloxone initiation, methadone program criteria, naltrexone extended-release, and harm reduction principles.',year:'2023',pill:'Updated',pillStyle:{background:'#052535',color:'#00d4ff'},url:'https://www.samhsa.gov/medication-assisted-treatment'},
    ]
  },
  Surgery: {
    icon:'🔪', orgs:'EAST • ACS • SSI • SAGES',
    items: [
      {org:'ACS / SAGES',title:'ACS/SAGES Acute Appendicitis Guidelines',desc:'CT vs US vs MRI diagnosis, laparoscopic vs open appendectomy, antibiotics-first for uncomplicated appendicitis.',year:'2020',pill:'Updated',pillStyle:{background:'#0a2040',color:'#3b9eff'},url:'https://www.facs.org/quality-programs/trauma/quality/clinical-resources'},
      {org:'EAST',title:'EAST Trauma Practice Management Guidelines',desc:'Hemorrhage control, damage control surgery, TBI management, splenic and liver injury grading, and REBOA.',year:'2023',pill:'Updated',pillStyle:{background:'#1a0505',color:'#ff6b6b'},url:'https://www.east.org/practice-management-guidelines'},
    ]
  },
  Pediatrics: {
    icon:'👶', orgs:'AAP • PALS • CHOP • RCPCH',
    items: [
      {org:'AAP',title:'AAP Guideline: Febrile Infant Evaluation',desc:'Rochester criteria, Step-by-Step algorithm for febrile infants <60 days, blood/urine/LP workup, and empiric antibiotics.',year:'2021',pill:'Updated',pillStyle:{background:'#052535',color:'#00d4ff'},url:'https://www.aap.org/en/patient-care/febrile-infant/'},
      {org:'AAP / PALS',title:'Pediatric Advanced Life Support 2020',desc:'Pediatric BLS/ACLS, fluid resuscitation in septic shock, IO access, vasopressor dosing, and post-resuscitation care.',year:'2020',pill:'Critical',pillStyle:{background:'#1a0505',color:'#ff6b6b'},url:'https://www.ahajournals.org/doi/10.1161/CIR.0000000000001039'},
    ]
  },
};

const SYSTEM_TABS = [
  {id:'all',label:'All Systems',icon:'🏥'},
  {id:'Cardiology',label:'Cardiology',icon:'❤️'},
  {id:'Infectious Diseases',label:'Infectious Diseases',icon:'🦠'},
  {id:'Pulmonology',label:'Pulmonology',icon:'🫁'},
  {id:'Endocrinology',label:'Endocrinology',icon:'🧬'},
  {id:'Emergency Medicine',label:'Emergency Medicine',icon:'🚨'},
  {id:'Neurology',label:'Neurology',icon:'🧠'},
  {id:'Gastroenterology',label:'Gastroenterology',icon:'🫀'},
  {id:'Nephrology',label:'Nephrology',icon:'🫘'},
  {id:'Oncology',label:'Oncology',icon:'🎗️'},
  {id:'Rheumatology',label:'Rheumatology',icon:'🦴'},
  {id:'Psychiatry',label:'Psychiatry',icon:'🧩'},
  {id:'Surgery',label:'Surgery',icon:'🔪'},
  {id:'Pediatrics',label:'Pediatrics',icon:'👶'},
];

// ─── ENHANCED GUIDELINES TAB ─────────────────────────────────────────────────

function GuidelinesTab() {
  const [activeSystem, setActiveSystem] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const handleSystemChange = (id) => { setActiveSystem(id); setSelected(null); };
  const handleSearch = (val) => { setSearch(val); setSelected(null); };

  const allItems = Object.values(GUIDELINES_DATA).flatMap(d => d.items);
  const totalCount = allItems.length;

  const visibleSystems = activeSystem === 'all'
    ? Object.entries(GUIDELINES_DATA)
    : Object.entries(GUIDELINES_DATA).filter(([cat]) => cat === activeSystem);

  const filteredSystems = visibleSystems.map(([cat, data]) => {
    const q = search.toLowerCase();
    if (!q) return [cat, data];
    const filteredItems = data.items.filter(g =>
      g.title.toLowerCase().includes(q) || g.desc.toLowerCase().includes(q) || g.org.toLowerCase().includes(q)
    );
    return [cat, {...data, items:filteredItems}];
  }).filter(([,data]) => data.items.length > 0);

  const richCount = allItems.filter(g => getRichDetail(g)).length;

  return (
    <div style={{display:'flex',gap:0,height:'calc(100vh - 120px)',overflow:'hidden'}}>

      {/* ── Left: Browse Panel ── */}
      <div style={{flex: selected ? '0 0 44%' : '1', display:'flex',flexDirection:'column',gap:12,overflow:'hidden',paddingRight: selected ? 14 : 0, borderRight: selected ? '1px solid var(--border)' : 'none'}}>

        {/* Header */}
        <div>
          <div className="kb2-section-title">📋 Clinical Guidelines</div>
          <div className="kb2-section-sub">
            {totalCount} guidelines across {Object.keys(GUIDELINES_DATA).length} specialties
            <span style={{marginLeft:8,fontSize:10,color:'var(--accent-teal)',fontFamily:'JetBrains Mono,monospace',background:'rgba(0,229,192,.08)',padding:'1px 7px',borderRadius:10,border:'1px solid rgba(0,229,192,.2)'}}>✦ {richCount} with rich detail</span>
          </div>
        </div>

        {/* Search */}
        <div className="kb2-drug-search-wrap" style={{padding:'10px 14px',marginBottom:0}}>
          <div className="kb2-drug-search-row" style={{marginBottom:0}}>
            <input className="kb2-drug-input" value={search} onChange={e=>handleSearch(e.target.value)} placeholder="Search guidelines: sepsis, COPD, diabetes, stroke..."/>
            {search && <button className="kb2-drug-btn" onClick={()=>handleSearch('')} style={{whiteSpace:'nowrap'}}>Clear</button>}
          </div>
        </div>

        {/* System tabs */}
        <div style={{display:'flex',gap:5,overflowX:'auto',paddingBottom:4,scrollbarWidth:'none',flexShrink:0}}>
          {SYSTEM_TABS.map(t=>(
            <button key={t.id} onClick={()=>handleSystemChange(t.id)}
              style={{flexShrink:0,display:'flex',alignItems:'center',gap:4,padding:'5px 12px',borderRadius:20,fontSize:11,fontWeight:activeSystem===t.id?600:400,cursor:'pointer',border:activeSystem===t.id?'1px solid var(--accent-blue)':'1px solid var(--border)',background:activeSystem===t.id?'#0a2040':'var(--bg-card)',color:activeSystem===t.id?'var(--accent-blue)':'var(--text-muted)',transition:'all .15s',fontFamily:'DM Sans,sans-serif'}}>
              <span>{t.icon}</span><span>{selected ? t.icon : t.label}</span>
              {t.id!=='all' && GUIDELINES_DATA[t.id] && (
                <span style={{fontSize:9,fontFamily:'JetBrains Mono,monospace',padding:'1px 4px',borderRadius:8,background:activeSystem===t.id?'#1a3555':'var(--bg-elevated)',color:activeSystem===t.id?'var(--accent-blue)':'var(--text-dim)'}}>
                  {GUIDELINES_DATA[t.id].items.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Guidelines list */}
        <div style={{flex:1,overflowY:'auto'}}>
          {filteredSystems.length === 0 && (
            <div className="kb2-no-results"><div className="kb2-no-results-icon">📋</div>No guidelines match "{search}"</div>
          )}
          {filteredSystems.map(([cat, data]) => (
            <div key={cat}>
              <div className="kb2-guide-cat-header">
                <span className="kb2-guide-cat-icon">{data.icon}</span>
                <span className="kb2-guide-cat-title">{cat}</span>
                <span className="kb2-guide-cat-count">{data.orgs}</span>
                <span style={{marginLeft:'auto',fontSize:10,color:'var(--text-muted)',fontFamily:'JetBrains Mono,monospace'}}>{data.items.length} guides</span>
              </div>
              <div className={selected ? '' : 'kb2-guide-grid'} style={selected ? {display:'flex',flexDirection:'column',gap:6,marginBottom:18} : {}}>
                {data.items.map((g,i) => {
                  const hasRich = !!getRichDetail(g);
                  return (
                    <div key={i} className={`kb2-guide-card${selected?.title===g.title?' selected':''}`} onClick={()=>setSelected(g)}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:3}}>
                        <div className="kb2-guide-org">{g.org}</div>
                        {hasRich && <span style={{fontSize:8,color:'var(--accent-teal)',background:'rgba(0,229,192,.08)',padding:'1px 5px',borderRadius:8,border:'1px solid rgba(0,229,192,.2)',fontFamily:'JetBrains Mono,monospace'}}>✦ RICH</span>}
                      </div>
                      <div className="kb2-guide-title">{g.title}</div>
                      {!selected && <div className="kb2-guide-desc">{g.desc}</div>}
                      <div className="kb2-guide-footer">
                        <span className="kb2-guide-year">{g.year}</span>
                        <span className="kb2-guide-pill" style={g.pillStyle}>{g.pill}</span>
                        <span className="kb2-guide-ext">{selected?.title===g.title?'◀':'▶'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right: Detail Panel ── */}
      {selected && (
        <div style={{flex:1,minWidth:0,paddingLeft:14,overflowY:'auto',display:'flex',flexDirection:'column'}}>
          <GuidelineDetailPanel guide={selected} onClose={()=>setSelected(null)}/>
        </div>
      )}

      {/* Empty state hint when nothing selected */}
      {!selected && filteredSystems.length > 0 && (
        <div style={{position:'absolute',bottom:80,right:24,background:'var(--bg-elevated)',border:'1px solid var(--border)',borderRadius:8,padding:'8px 14px',fontSize:11,color:'var(--text-muted)',pointerEvents:'none',zIndex:10}}>
          Click any guideline to open the detail panel ▶
        </div>
      )}
    </div>
  );
}

// ─── EXISTING: DISEASE ITEM + DISEASES TAB ───────────────────────────────────

function formatSummaryAsText(s) {
  if (!s) return '';
  const lines = [];
  lines.push(`${s.condition} — Clinical Summary (${s.guideline})\n`);
  lines.push('DIAGNOSIS CRITERIA');
  s.diagnosis.forEach(item => lines.push(`  • ${item}`));
  lines.push('\nFIRST-LINE TREATMENT');
  s.treatment.forEach(item => lines.push(`  • ${item}`));
  lines.push('\nCLINICAL PEARLS');
  s.pearls.forEach(item => lines.push(`  • ${item}`));
  return lines.join('\n');
}

function DiseaseItem({ d }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [addedToNote, setAddedToNote] = useState(false);

  const fetchSummary = async (e) => {
    e.stopPropagation();
    if (summary) { setExpanded(v => !v); return; }
    setLoading(true); setExpanded(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a clinical knowledge assistant. Return a structured JSON summary for clinicians about: "${d.name}" (also known as: ${d.aka}). Guideline: ${d.guide}.\n\nReturn ONLY valid JSON (no markdown fences), with this exact schema:\n{\n  "condition": "Full condition name",\n  "guideline": "Guideline reference",\n  "diagnosis": ["criterion 1", "criterion 2", "criterion 3"],\n  "treatment": ["treatment 1", "treatment 2", "treatment 3"],\n  "pearls": ["pearl 1", "pearl 2"]\n}\n\nBe concise and clinical. No markdown, no asterisks, no bold formatting in values.`,
        add_context_from_internet: false,
        response_json_schema: {
          type: 'object',
          properties: {
            condition: { type: 'string' },
            guideline: { type: 'string' },
            diagnosis: { type: 'array', items: { type: 'string' } },
            treatment: { type: 'array', items: { type: 'string' } },
            pearls: { type: 'array', items: { type: 'string' } },
          }
        }
      });
      setSummary(res);
    } catch { setSummary({ error: true }); }
    setLoading(false);
  };

  const addToMDM = async () => {
    if (!summary || summary.error) return;
    const text = formatSummaryAsText(summary);
    try {
      const notes = await base44.entities.ClinicalNote.filter({ status: 'draft' }, '-updated_date', 1);
      if (notes.length === 0) { alert('No draft notes found. Please open a note first.'); return; }
      const note = notes[0];
      const existing = note.mdm || '';
      const separator = existing ? '\n\n---\n' : '';
      await base44.entities.ClinicalNote.update(note.id, { mdm: existing + separator + text });
      setAddedToNote(true);
      setTimeout(() => setAddedToNote(false), 3000);
    } catch { alert('Failed to add to note. Please try again.'); }
  };

  return (
    <div className="kb2-disease-item" style={{flexDirection:'column'}}>
      <div style={{display:'flex',alignItems:'stretch'}}>
        <div className="kb2-disease-body" style={{flex:1}}>
          <div className="kb2-disease-name">{d.name}</div>
          {d.aka && <div className="kb2-disease-aka">{d.aka}</div>}
        </div>
        <div style={{display:'flex',alignItems:'center',padding:'0 10px',gap:6,borderLeft:'1px solid var(--border)'}}>
          <button onClick={fetchSummary} style={{padding:'4px 10px',fontSize:10,fontWeight:600,cursor:'pointer',background:expanded?'#1a0d35':'var(--bg-elevated)',border:`1px solid ${expanded?'var(--accent-purple)':'var(--border)'}`,borderRadius:5,color:expanded?'var(--accent-purple)':'var(--text-muted)',transition:'all .15s',fontFamily:'DM Sans,sans-serif',whiteSpace:'nowrap',display:'flex',alignItems:'center',gap:4}}>
            {loading?'⏳':' ✨'} {loading?'Loading...':expanded?'Hide AI':'AI Summary'}
          </button>
        </div>
        <div className="kb2-disease-links">
          <a className="kb2-dis-link uptodate" href={`https://www.uptodate.com/contents/search?search=${encodeURIComponent(d.name)}`} target="_blank" rel="noopener noreferrer">📖<span className="dl-label">UpToDate</span></a>
          {d.guideUrl && <a className="kb2-dis-link guide" href={d.guideUrl} target="_blank" rel="noopener noreferrer">📋<span className="dl-label">{d.guide}</span></a>}
          <a className="kb2-dis-link pubmed" href={`https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(d.name)}`} target="_blank" rel="noopener noreferrer">📚<span className="dl-label">PubMed</span></a>
        </div>
      </div>
      {expanded && (
        <div style={{padding:'14px 16px',borderTop:'1px solid var(--border)',background:'#07122a',fontFamily:'DM Sans,sans-serif'}}>
          {loading ? (
            <div style={{display:'flex',gap:6,alignItems:'center'}}>
              <div className="kb2-typing-dot"/><div className="kb2-typing-dot"/><div className="kb2-typing-dot"/>
              <span style={{color:'var(--text-muted)',marginLeft:4,fontSize:11}}>Generating clinical summary...</span>
            </div>
          ) : summary?.error ? (
            <div style={{fontSize:11,color:'var(--accent-coral)'}}>Unable to load summary. Please try again.</div>
          ) : summary ? (
            <div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <div className="kb2-ai-dot"/>
                  <span style={{fontSize:10,fontWeight:700,letterSpacing:'.6px',textTransform:'uppercase',color:'var(--accent-teal)'}}>AI Clinical Summary</span>
                  <span style={{fontSize:9,color:'var(--text-dim)',fontFamily:'JetBrains Mono,monospace',background:'var(--bg-elevated)',padding:'1px 6px',borderRadius:3}}>{summary.guideline}</span>
                </div>
                <button onClick={addToMDM} style={{padding:'5px 12px',fontSize:10,fontWeight:600,cursor:'pointer',background:addedToNote?'#0d2e20':'#0a1e35',border:`1px solid ${addedToNote?'var(--accent-green)':'rgba(59,158,255,0.4)'}`,borderRadius:5,color:addedToNote?'var(--accent-green)':'var(--accent-blue)',transition:'all .2s',fontFamily:'DM Sans,sans-serif',display:'flex',alignItems:'center',gap:5}}>
                  {addedToNote?'✓ Added to Note':'+ Add to MDM'}
                </button>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
                {[{label:'Diagnosis Criteria',items:summary.diagnosis,color:'#3b9eff',bg:'#0a1e35'},{label:'First-line Treatment',items:summary.treatment,color:'#00e5c0',bg:'#062020'},{label:'Clinical Pearls',items:summary.pearls,color:'#f5c842',bg:'#1e1505'}].map(section=>(
                  <div key={section.label} style={{background:section.bg,border:`1px solid ${section.color}22`,borderRadius:8,padding:'10px 12px'}}>
                    <div style={{fontSize:9,fontWeight:700,letterSpacing:'.8px',textTransform:'uppercase',color:section.color,marginBottom:8}}>{section.label}</div>
                    {section.items?.map((item,i)=>(
                      <div key={i} style={{display:'flex',gap:6,marginBottom:5,fontSize:11,color:'var(--text-secondary)',lineHeight:1.5}}>
                        <span style={{color:section.color,flexShrink:0,marginTop:1}}>›</span><span>{item}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function DiseasesTab() {
  const [search, setSearch] = useState('');
  const [alpha, setAlpha] = useState('all');
  const letters = [...new Set(DISEASES.map(d => d.letter))].sort();
  const filtered = DISEASES.filter(d => {
    const matchAlpha = alpha === 'all' || d.letter === alpha;
    const q = search.toLowerCase();
    return matchAlpha && (!q || d.name.toLowerCase().includes(q) || (d.aka||'').toLowerCase().includes(q));
  });
  const grouped = letters.reduce((acc, l) => {
    const items = filtered.filter(d => d.letter === l);
    if (items.length) acc[l] = items;
    return acc;
  }, {});
  return (
    <div>
      <div className="kb2-section-title">🩺 Diseases &amp; Conditions</div>
      <div className="kb2-section-sub">Alphabetical index — click ✨ AI Summary for instant clinical overview, or open in UpToDate, guidelines, and PubMed</div>
      <div className="kb2-drug-search-wrap" style={{borderColor:'rgba(155,109,255,0.3)'}}>
        <div className="kb2-drug-search-row">
          <input className="kb2-drug-input" style={{borderColor:'var(--accent-purple)'}} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search conditions: pneumonia, STEMI, sepsis, DVT..."/>
          <button className="kb2-drug-btn" style={{borderColor:'var(--accent-purple)',color:'var(--accent-purple)',background:'#1a0d35'}}>Search</button>
        </div>
      </div>
      <div className="kb2-alpha-nav">
        <button className={`kb2-alpha-btn${alpha==='all'?' active':''}`} onClick={()=>setAlpha('all')}>All</button>
        {letters.map(l=>(<button key={l} className={`kb2-alpha-btn${alpha===l?' active':''}`} onClick={()=>setAlpha(l)}>{l}</button>))}
      </div>
      {Object.entries(grouped).map(([letter, items])=>(
        <div key={letter} className="kb2-disease-group">
          <div className="kb2-disease-letter">{letter}</div>
          <div className="kb2-disease-list">{items.map((d,i)=>(<DiseaseItem key={i} d={d}/>))}</div>
        </div>
      ))}
      {Object.keys(grouped).length===0 && <div className="kb2-no-results"><div className="kb2-no-results-icon">🩺</div>No conditions match "{search}"</div>}
    </div>
  );
}

function EDTab() {
  const FOAM = [
    {icon:'🏄',name:'Life in the Fast Lane (LITFL)',type:'FOAM',desc:'Comprehensive ECG library, toxicology database, critical care compendium, and procedure guides.',url:'https://litfl.com',tags:['ECG Library','Toxicology','Critical Care','Procedures']},
    {icon:'⚡',name:'EMCrit',type:'FOAM',desc:"Scott Weingart's critical care and emergency medicine resource. Expert reviews, podcasts, and IBCC.",url:'https://emcrit.org',tags:['Critical Care','Resuscitation','Airway','Podcast']},
    {icon:'🧪',name:'REBEL EM',type:'FOAM',desc:'Evidence-based emergency medicine. Critical appraisal of landmark trials and systematic reviews.',url:'https://www.rebelem.com',tags:['Evidence-Based','Trial Reviews','Critical Appraisal']},
    {icon:'🎓',name:'ALiEM (Academic Life in Emergency Medicine)',type:'Education',desc:'EM education platform with clinical pearls, teaching cases, AIR series, and resources for residents.',url:'https://www.aliem.com',tags:['Education','Residency','Clinical Pearls']},
    {icon:'🎙️',name:'EM:RAP',type:'CME',desc:'Monthly audio/video CME program covering high-yield EM topics, reviewed by EM faculty.',url:'https://www.emrap.org',tags:['CME','Podcast','Board Prep']},
    {icon:'📗',name:"Tintinalli's Emergency Medicine",type:'Reference',desc:'The definitive emergency medicine textbook. 9th edition.',url:'https://www.tintinalliem.com',tags:['Textbook','Comprehensive','9th Ed.']},
  ];
  const ECG = [
    {icon:'📊',name:'LITFL ECG Library',type:'ECG',desc:'The most comprehensive free ECG library with thousands of annotated 12-lead examples.',url:'https://litfl.com/ecg-library/',tags:['STEMI','Arrhythmias','Blocks','Patterns'],typeStyle:{background:'#2e2010',color:'#f5c842'},borderColor:'#f5c842'},
    {icon:'💛',name:'ECG Library (ecglibrary.com)',type:'ECG',desc:'Classic ECG reference with systematic interpretation guides and common pathological patterns.',url:'https://www.ecglibrary.com',tags:['Systematic Review','Normal Variants'],typeStyle:{background:'#2e2010',color:'#f5c842'},borderColor:'#f5c842'},
  ];
  const TOXICOLOGY = [
    {icon:'🧪',name:'TOXBASE (UK National Poisons Information Service)',type:'Toxicology',desc:'Primary clinical toxicology database of NPIS. Treatment protocols for overdose and poisoning.',url:'https://www.toxbase.org',tags:['Overdose','Antidotes','UK'],typeStyle:{background:'#1a0d35',color:'#9b6dff'},borderColor:'#9b6dff'},
    {icon:'☎️',name:'Poison Control Center (1-800-222-1222 US)',type:'Toxicology',desc:'24/7 US poison control network with direct line to toxicologists for clinical guidance.',url:'https://www.poison.org',tags:['US','24/7','Phone Consult'],typeStyle:{background:'#1a0d35',color:'#9b6dff'},borderColor:'#9b6dff'},
  ];
  const renderCard = (r) => (
    <a key={r.name} className="kb2-ed-card" href={r.url} target="_blank" rel="noopener noreferrer" style={r.borderColor?{borderLeftColor:r.borderColor}:{}}>
      <div className="kb2-ed-card-top"><span className="kb2-ed-card-icon">{r.icon}</span><span className="kb2-ed-card-name">{r.name}</span><span className="kb2-ed-card-type" style={r.typeStyle||{}}>{r.type}</span></div>
      <div className="kb2-ed-card-desc">{r.desc}</div>
      <div className="kb2-ed-card-tags">{r.tags.map(t=><span key={t} className="kb2-ed-card-tag">{t}</span>)}</div>
    </a>
  );
  return (
    <div>
      <div className="kb2-ed-hero">
        <div className="kb2-ed-hero-icon">🚨</div>
        <div><div className="kb2-ed-hero-title">Emergency Department Resources</div><div className="kb2-ed-hero-sub">Critical references, FOAM resources, and ED-specific clinical tools</div></div>
        <div className="kb2-ed-stats"><div className="kb2-ed-stat"><span className="kb2-ed-stat-val">24</span><span className="kb2-ed-stat-lbl">Resources</span></div><div className="kb2-ed-stat"><span className="kb2-ed-stat-val">6</span><span className="kb2-ed-stat-lbl">Categories</span></div></div>
      </div>
      <div className="kb2-section-title" style={{fontSize:14}}>📋 Major ED Guidelines</div>
      <div className="kb2-guide-grid" style={{marginBottom:20}}>
        {[
          {org:'ACEP',title:'ACEP Clinical Policies — Full Library',desc:'All ACEP clinical policies: chest pain, headache, syncope, altered mental status, pediatric fever, and more.',year:'2024',url:'https://www.acep.org/clinical---practice-management/clinical-policies/'},
          {org:'ACEM',title:'ACEM Clinical Guidelines & Position Statements',desc:'Australasian College for Emergency Medicine guidelines including triage, procedural sedation, and ED operations.',year:'2024',url:'https://acem.org.au'},
          {org:'RCEM',title:'RCEM Professional Standards & Clinical Guidelines',desc:'Royal College of Emergency Medicine (UK) standards, guidelines, and clinical audit toolkits.',year:'2024',url:'https://www.rcem.ac.uk'},
        ].map((g,i)=>(
          <a key={i} className="kb2-guide-card" href={g.url} target="_blank" rel="noopener noreferrer">
            <div className="kb2-guide-org">{g.org}</div>
            <div className="kb2-guide-title">{g.title}</div>
            <div className="kb2-guide-desc">{g.desc}</div>
            <div className="kb2-guide-footer"><span className="kb2-guide-year">{g.year}</span><span className="kb2-guide-pill" style={{background:'#401a1a',color:'#ff6b6b'}}>ED Specific</span><span className="kb2-guide-ext">↗</span></div>
          </a>
        ))}
      </div>
      <div className="kb2-section-title" style={{fontSize:14}}>🌊 Free Open-Access Medical Education (FOAM)</div>
      <div className="kb2-section-sub" style={{marginBottom:12}}>High-quality, peer-reviewed free emergency medicine resources</div>
      {FOAM.map(r=>renderCard(r))}
      <div className="kb2-section-title" style={{fontSize:14,marginTop:20}}>📈 ECG Resources</div>
      <div className="kb2-section-sub" style={{marginBottom:12}}>12-lead interpretation, pattern libraries, and clinical decision tools</div>
      {ECG.map(r=>renderCard(r))}
      <div className="kb2-section-title" style={{fontSize:14,marginTop:20}}>☠️ Toxicology</div>
      <div style={{marginBottom:12}}/>
      {TOXICOLOGY.map(r=>renderCard(r))}
    </div>
  );
}

function AIPanel() {
  const [messages, setMessages] = useState([{role:'system',content:'Welcome to the Notrya Knowledge Base. Ask me about clinical guidelines, drug information, disease management, or any medical question. I have web search access for the latest evidence.'}]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatRef = useRef(null);
  const QUICK = ['Summarize sepsis management guidelines','Latest ACS STEMI guidelines','2024 GOLD COPD grading','ACLS arrest algorithm steps','ADA 2024 key changes','tPA indications in acute stroke'];
  const sendMessage = async (q) => {
    const text = q || input.trim();
    if (!text || loading) return;
    setInput('');
    setMessages(prev => [...prev, {role:'user', content:text}]);
    setLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({ prompt:`You are Notrya AI, a clinical knowledge assistant. Answer concisely and clinically. Question: ${text}`, add_context_from_internet:true });
      setMessages(prev => [...prev, {role:'assistant', content:typeof res==='string'?res:JSON.stringify(res)}]);
    } catch {
      setMessages(prev => [...prev, {role:'assistant', content:'⚠ Unable to reach AI service. Please try again.'}]);
    }
    setLoading(false);
  };
  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, [messages, loading]);
  return (
    <aside className="kb2-ai-panel">
      <div className="kb2-ai-header">
        <div className="kb2-ai-header-row"><div className="kb2-ai-dot"/><div className="kb2-ai-title">Notrya AI Assistant</div><div className="kb2-ai-model">claude-sonnet-4</div></div>
        <div className="kb2-ai-quick-btns">{QUICK.map((q,i)=><button key={i} className="kb2-ai-qbtn" onClick={()=>sendMessage(q)}>{q}</button>)}</div>
      </div>
      <div className="kb2-ai-chat" ref={chatRef}>
        {messages.map((m,i)=>(
          <div key={i} className={`kb2-ai-msg ${m.role}`}>
            {m.role==='assistant'&&<div className="kb2-ai-label">AI</div>}
            {m.content}
          </div>
        ))}
        {loading && <div className="kb2-ai-msg loading"><div className="kb2-typing-dot"/><div className="kb2-typing-dot"/><div className="kb2-typing-dot"/></div>}
      </div>
      <div className="kb2-ai-input-wrap">
        <div className="kb2-ai-input-row">
          <input className="kb2-ai-input" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendMessage()} placeholder="Ask about guidelines, drugs, conditions..."/>
          <button className="kb2-ai-send-btn" onClick={()=>sendMessage()}>↑</button>
        </div>
      </div>
    </aside>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

const TABS = [
  {id:'search', label:'🔍 Knowledge Search', activeCls:'active'},
  {id:'drugs', label:'💊 Drug Info', activeCls:'active-cyan'},
  {id:'guidelines', label:'📋 Guidelines', activeCls:'active'},
  {id:'diseases', label:'🩺 Diseases', activeCls:'active-purple'},
  {id:'ed', label:'🚨 ED Resources', activeCls:'active-coral'},
];

const SIDEBAR_NAV = [
  {id:'search', icon:'🔍', label:'Global Search', badge:null},
  {id:'drugs', icon:'💊', label:'Drug Information', badge:{cls:'cyan', text:'450+'}},
  {id:'guidelines', icon:'📋', label:'Clinical Guidelines', badge:{cls:'blue', text:'75+'}},
  {id:'diseases', icon:'🩺', label:'Diseases & Conditions', badge:{cls:'purple', text:'120+'}},
  {id:'ed', icon:'🚨', label:'ED Resources', badge:{cls:'red', text:'24'}},
];

const QUICK_LINKS = [
  {label:'MDCalc', icon:'🧮', url:'https://www.mdcalc.com'},
  {label:'PubMed', icon:'📚', url:'https://pubmed.ncbi.nlm.nih.gov'},
  {label:'UpToDate', icon:'📖', url:'https://www.uptodate.com'},
  {label:'Medscape Ref', icon:'🌐', url:'https://reference.medscape.com'},
  {label:'Drugs.com', icon:'💉', url:'https://www.drugs.com'},
];

const CALC_LINKS = [
  {label:'Wells Score DVT', icon:'🩸', url:'https://www.mdcalc.com/calc/1718/wells-criteria-dvt'},
  {label:'CHA₂DS₂-VASc', icon:'❤️', url:'https://www.mdcalc.com/calc/1786/cha2ds2-vasc-score-atrial-fibrillation-stroke-risk'},
  {label:'SOFA Score', icon:'🔴', url:'https://www.mdcalc.com/calc/115/sofa-score-sepsis-related-organ-failure-assessment'},
  {label:'GCS Calculator', icon:'🧠', url:'https://www.mdcalc.com/calc/29/glasgow-coma-scale-score-gcs'},
];

export default function KnowledgeBaseV2() {
  const [tab, setTab] = useState('search');
  const [user, setUser] = useState(null);
  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  return (
    <div className="kb2-root">
      <style>{CSS}</style>
      <TopNavBar user={user} tab={tab} setTab={setTab} />
      <VitalsBar user={user} />
      <div className="kb2-layout">
        <aside className="kb2-sidebar">
          <div>
            <div className="kb2-sb-heading">Knowledge Base</div>
            {SIDEBAR_NAV.map(item=>(
              <div key={item.id} className={`kb2-sb-item${tab===item.id?' active':''}`} onClick={()=>setTab(item.id)}>
                <span className="kb2-sb-icon">{item.icon}</span>
                <span className="kb2-sb-label">{item.label}</span>
                {item.badge && <span className={`kb2-badge ${item.badge.cls}`}>{item.badge.text}</span>}
              </div>
            ))}
          </div>
          <div style={{marginTop:12}}>
            <div className="kb2-sb-heading">Quick Access</div>
            {QUICK_LINKS.map(l=>(<div key={l.label} className="kb2-sb-item" onClick={()=>window.open(l.url,'_blank')}><span className="kb2-sb-icon">{l.icon}</span><span className="kb2-sb-label">{l.label}</span></div>))}
          </div>
          <div style={{marginTop:12}}>
            <div className="kb2-sb-heading">Calculators</div>
            {CALC_LINKS.map(l=>(<div key={l.label} className="kb2-sb-item" onClick={()=>window.open(l.url,'_blank')}><span className="kb2-sb-icon">{l.icon}</span><span className="kb2-sb-label">{l.label}</span></div>))}
          </div>
        </aside>
        <main className="kb2-main">
          {tab==='search' && <SearchTab/>}
          {tab==='drugs' && <DrugsTab/>}
          {tab==='guidelines' && <GuidelinesTab/>}
          {tab==='diseases' && <DiseasesTab/>}
          {tab==='ed' && <EDTab/>}
        </main>
        <ClinicalContextPanel />
      </div>
      <nav className="kb2-bottom-nav">
        <div className="kb2-bnav-row">
          {TABS.map(t=>(<button key={t.id} className={`kb2-bnav-tab${tab===t.id?' '+t.activeCls:''}`} onClick={()=>setTab(t.id)}>{t.label}</button>))}
        </div>
        <div className="kb2-bnav-row">
          {[['🧮 MDCalc','https://www.mdcalc.com'],['📚 PubMed','https://pubmed.ncbi.nlm.nih.gov'],['📖 UpToDate','https://www.uptodate.com'],['🏆 Cochrane','https://www.cochranelibrary.com'],['🌐 Medscape','https://reference.medscape.com'],['🏄 LITFL','https://litfl.com'],['⚡ EMCrit','https://emcrit.org']].map(([label,url])=>(
            <button key={label} className="kb2-bnav-tab" onClick={()=>window.open(url,'_blank')}>{label}</button>
          ))}
        </div>
      </nav>
    </div>
  );
}