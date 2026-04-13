import { useState, useEffect, useRef } from 'react';

// ── Font + CSS injection ───────────────────────────────────────────────────────
(() => {
  if (document.getElementById("kb-fonts")) return;
  const l = document.createElement("link");
  l.id = "kb-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style");
  s.id = "kb-css";
  s.textContent = `
    *{box-sizing:border-box;margin:0;padding:0}
    ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.07);border-radius:2px}
    button,input{font-family:'DM Sans',sans-serif;outline:none;cursor:pointer}
    a{text-decoration:none;color:inherit}
    @keyframes kb-pulse{0%,100%{opacity:1}50%{opacity:.35}}
    @keyframes kb-bounce{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}
    @keyframes kb-fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    @keyframes kb-spin{to{transform:rotate(360deg)}}
    @keyframes kb-glow{0%,100%{text-shadow:0 0 4px rgba(255,107,107,.4)}50%{text-shadow:0 0 10px rgba(255,107,107,.9)}}
    mark{background:rgba(59,158,255,0.22);color:#00d4ff;border-radius:2px;padding:0 2px}
    .kb-card{transition:all .2s cubic-bezier(.4,0,.2,1)}
    .kb-card:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(0,0,0,.4)}
    .kb-row:hover{background:rgba(59,158,255,0.05)!important}
    .kb-gl-card{transition:all .18s}
    .kb-gl-card:hover{transform:translateY(-1px)}
  `;
  document.head.appendChild(s);
})();

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:"#050f1e", panel:"#081628", card:"#0b1e36", up:"#0e2544",
  b:"rgba(26,53,85,0.7)", bhi:"rgba(42,79,122,0.9)",
  txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", blue:"#3b9eff",
  orange:"#ff9f43", purple:"#9b6dff", green:"#3dffa0", cyan:"#00d4ff",
};

// ── Data: Search index ────────────────────────────────────────────────────────
const SEARCH_INDEX = [
  {type:"drug",    name:"Epinephrine (Adrenalin)",     desc:"Vasopressor / anaphylaxis / cardiac arrest",          url:"https://reference.medscape.com/drug/adrenalin-epinephrine-342432"},
  {type:"drug",    name:"Metoprolol (Lopressor)",       desc:"Beta-blocker — AF, HTN, HF",                          url:"https://reference.medscape.com/drug/lopressor-toprol-xl-metoprolol-342453"},
  {type:"drug",    name:"Vancomycin",                   desc:"Glycopeptide antibiotic — MRSA, gram-positive",        url:"https://reference.medscape.com/drug/vancocin-vancomycin-342587"},
  {type:"drug",    name:"Norepinephrine (Levophed)",    desc:"Vasopressor — septic shock, vasodilatory shock",       url:"https://www.drugs.com/norepinephrine.html"},
  {type:"drug",    name:"Piperacillin/Tazobactam",      desc:"Broad-spectrum — severe sepsis, nosocomial infection", url:"https://www.drugs.com/piperacillin-tazobactam.html"},
  {type:"drug",    name:"Alteplase (tPA)",              desc:"Thrombolytic — acute ischemic stroke, massive PE",     url:"https://www.drugs.com/alteplase.html"},
  {type:"drug",    name:"Naloxone (Narcan)",            desc:"Opioid antagonist — opioid overdose reversal",         url:"https://www.drugs.com/naloxone.html"},
  {type:"drug",    name:"Furosemide (Lasix)",           desc:"Loop diuretic — acute pulmonary oedema, HF",           url:"https://www.drugs.com/furosemide.html"},
  {type:"drug",    name:"Salbutamol / Albuterol",       desc:"β₂ agonist — asthma, COPD exacerbation",              url:"https://www.drugs.com/albuterol.html"},
  {type:"drug",    name:"Insulin (Regular)",            desc:"Antidiabetic — DKA, hyperglycemia, hyperkalemia",      url:"https://www.drugs.com/insulin.html"},
  {type:"disease", name:"Acute Coronary Syndrome (ACS)",desc:"STEMI, NSTEMI, unstable angina",                       url:"https://www.uptodate.com/contents/search?search=acute+coronary+syndrome"},
  {type:"disease", name:"Sepsis and Septic Shock",      desc:"Systemic infection with organ dysfunction",             url:"https://www.uptodate.com/contents/search?search=sepsis"},
  {type:"disease", name:"Pneumonia (CAP)",              desc:"Community-acquired pneumonia",                          url:"https://www.uptodate.com/contents/search?search=community+acquired+pneumonia"},
  {type:"disease", name:"COPD Exacerbation",            desc:"Acute worsening of chronic obstructive pulmonary disease",url:"https://www.uptodate.com/contents/search?search=COPD+exacerbation"},
  {type:"disease", name:"Atrial Fibrillation",          desc:"Irregular heart rhythm — rate and rhythm control",      url:"https://www.uptodate.com/contents/search?search=atrial+fibrillation"},
  {type:"disease", name:"Diabetic Ketoacidosis (DKA)",  desc:"Life-threatening complication of diabetes",             url:"https://www.uptodate.com/contents/search?search=diabetic+ketoacidosis"},
  {type:"disease", name:"Acute Ischemic Stroke",        desc:"Thrombotic or embolic cerebral infarction",             url:"https://www.uptodate.com/contents/search?search=acute+ischemic+stroke"},
  {type:"disease", name:"Heart Failure",                desc:"HFrEF, HFmrEF, HFpEF — acute and chronic management",  url:"https://www.uptodate.com/contents/search?search=heart+failure"},
  {type:"guide",   name:"2022 AHA/ACC Chest Pain Guideline",     desc:"Evaluation and diagnosis of acute chest pain",        url:"https://www.ahajournals.org/doi/10.1161/CIR.0000000000001106"},
  {type:"guide",   name:"Surviving Sepsis Campaign 2021",        desc:"International guidelines for sepsis management",       url:"https://www.idsociety.org/practice-guideline/sepsis/"},
  {type:"guide",   name:"2024 GOLD COPD Report",                 desc:"COPD diagnosis, management and prevention",            url:"https://goldcopd.org/2024-gold-report/"},
  {type:"guide",   name:"2024 ADA Standards of Diabetes Care",   desc:"Annual diabetes management standards",                 url:"https://diabetesjournals.org/care/issue/47/Supplement_1"},
  {type:"guide",   name:"2020 AHA CPR / ACLS Guidelines",        desc:"Resuscitation and emergency cardiovascular care",       url:"https://www.ahajournals.org/doi/10.1161/CIR.0000000000001122"},
  {type:"ed",      name:"LITFL — Life in the Fast Lane",         desc:"ECG library, toxicology, critical care compendium",    url:"https://litfl.com"},
  {type:"ed",      name:"EMCrit — Critical Care EM",             desc:"Resuscitation, airway, critical care expertise",        url:"https://emcrit.org"},
];

// ── Data: Diseases ────────────────────────────────────────────────────────────
const DISEASES = [
  {name:"Acute Coronary Syndrome (ACS)",  aka:"STEMI, NSTEMI, Unstable Angina",      letter:"A", guide:"ACC/AHA",          guideUrl:"https://www.ahajournals.org/doi/10.1161/CIR.0000000000001063"},
  {name:"Acute Kidney Injury (AKI)",      aka:"ARF, Renal Failure",                  letter:"A", guide:"KDIGO",            guideUrl:"https://kdigo.org/guidelines/acute-kidney-injury/"},
  {name:"Aortic Dissection",              aka:"Type A/B dissection",                 letter:"A", guide:"ACC/AHA",          guideUrl:"https://www.ahajournals.org/doi/10.1161/CIR.0000000000000106"},
  {name:"Asthma",                         aka:"Reactive airways disease",            letter:"A", guide:"GINA 2024",        guideUrl:"https://ginasthma.org/2024-gina-report/"},
  {name:"Atrial Fibrillation",            aka:"AF, A-fib",                           letter:"A", guide:"ACC/AHA 2023",     guideUrl:"https://www.ahajournals.org/doi/10.1161/CIR.0000000000001123"},
  {name:"Bacterial Meningitis",           aka:"Meningococcal, pneumococcal",         letter:"B", guide:"IDSA",             guideUrl:"https://www.idsociety.org/practice-guideline/bacterial-meningitis/"},
  {name:"Bradycardia",                    aka:"Sinus bradycardia, heart block",      letter:"B", guide:"AHA/ACLS",         guideUrl:"https://www.ahajournals.org/doi/10.1161/CIR.0000000000001122"},
  {name:"Cardiac Arrest",                 aka:"VF, PEA, Asystole",                  letter:"C", guide:"AHA ACLS 2020",    guideUrl:"https://www.ahajournals.org/doi/10.1161/CIR.0000000000001122"},
  {name:"Cellulitis",                     aka:"Skin and soft tissue infection",      letter:"C", guide:"IDSA SSTI",        guideUrl:"https://www.idsociety.org/practice-guideline/skin-and-soft-tissue-infections/"},
  {name:"COPD",                           aka:"Emphysema, chronic bronchitis",       letter:"C", guide:"GOLD 2024",        guideUrl:"https://goldcopd.org/2024-gold-report/"},
  {name:"Deep Vein Thrombosis (DVT)",     aka:"VTE, Blood clot",                    letter:"D", guide:"ACCP/ASH",         guideUrl:"https://www.hematology.org/education/clinicians/guidelines-and-quality-care/clinical-practice-guidelines/venous-thromboembolism-guidelines"},
  {name:"Diabetic Ketoacidosis (DKA)",    aka:"DKA, Metabolic acidosis",            letter:"D", guide:"ADA 2024",         guideUrl:"https://diabetesjournals.org/care/issue/47/Supplement_1"},
  {name:"Ectopic Pregnancy",              aka:"Tubal pregnancy",                     letter:"E", guide:"ACOG",             guideUrl:"https://www.acog.org/clinical/clinical-guidance/practice-bulletin"},
  {name:"Endocarditis",                   aka:"Infective endocarditis, IE",          letter:"E", guide:"AHA/ACC",          guideUrl:"https://www.ahajournals.org/doi/10.1161/CIR.0000000000000549"},
  {name:"GI Bleeding (Upper)",            aka:"Haematemesis, peptic ulcer bleed",   letter:"G", guide:"ACG",              guideUrl:"https://gi.org/guidelines/"},
  {name:"Heart Failure (HF)",             aka:"CHF, HFrEF, HFpEF",                 letter:"H", guide:"AHA/ACC/HFSA 2022",guideUrl:"https://www.ahajournals.org/doi/10.1161/CIR.0000000000001063"},
  {name:"Hypertensive Emergency",         aka:"Hypertensive crisis, malignant HTN", letter:"H", guide:"ACC/AHA",          guideUrl:"https://www.ahajournals.org/doi/10.1161/HYP.0000000000000065"},
  {name:"Hypoglycemia",                   aka:"Low blood sugar, insulin reaction",  letter:"H", guide:"ADA 2024",         guideUrl:"https://diabetesjournals.org/care/issue/47/Supplement_1"},
  {name:"Pneumonia (CAP)",                aka:"Community-acquired pneumonia",        letter:"P", guide:"IDSA/ATS 2019",   guideUrl:"https://www.idsociety.org/practice-guideline/community-acquired-pneumonia-cap-in-adults/"},
  {name:"Pulmonary Embolism (PE)",        aka:"VTE, DVT-PE",                        letter:"P", guide:"ESC/ACCP",         guideUrl:"https://www.escardio.org/Guidelines/Clinical-Practice-Guidelines"},
  {name:"Sepsis / Septic Shock",          aka:"SIRS, bacteremia, severe sepsis",    letter:"S", guide:"Surviving Sepsis 2021",guideUrl:"https://www.idsociety.org/practice-guideline/sepsis/"},
  {name:"Status Epilepticus",             aka:"SE, prolonged seizure",              letter:"S", guide:"AAN/NCS",          guideUrl:"https://www.aan.com/Guidelines/"},
  {name:"Stroke (Ischemic)",              aka:"CVA, cerebral infarct, TIA",         letter:"S", guide:"ASA/AHA",          guideUrl:"https://www.ahajournals.org/doi/10.1161/STR.0000000000000375"},
  {name:"Type 2 Diabetes",               aka:"T2DM, NIDDM",                        letter:"T", guide:"ADA 2024",         guideUrl:"https://diabetesjournals.org/care/issue/47/Supplement_1"},
  {name:"UTI / Pyelonephritis",          aka:"Urinary tract infection, kidney infection",letter:"U",guide:"IDSA 2022", guideUrl:"https://www.idsociety.org/practice-guideline/urinary-tract-infection-uti/"},
];

// ── Data: Drug QR ─────────────────────────────────────────────────────────────
const DRUGS_QR = [
  {name:"Epinephrine",   generic:"Adrenalin",        cls:"Vasopressor",     fields:[{l:"Cardiac Arrest",v:"1mg IV q3-5min"},{l:"Anaphylaxis",v:"0.3mg IM lateral thigh"},{l:"Infusion",v:"0.1–1 mcg/kg/min"}],     links:[{l:"Medscape",u:"https://reference.medscape.com/drug/adrenalin-epinephrine-342432"},{l:"Drugs.com",u:"https://www.drugs.com/epinephrine.html"},{l:"DailyMed",u:"https://dailymed.nlm.nih.gov/dailymed/search.cfm?query=epinephrine"}]},
  {name:"Metoprolol",    generic:"Lopressor/Toprol XL",cls:"β-Blocker",    fields:[{l:"IV (AF/AFl)",v:"2.5–5mg IV q5min (max 15mg)"},{l:"PO (HTN)",v:"25–100mg BID"},{l:"PO (HF)",v:"12.5–200mg QD (XL)"}],     links:[{l:"Medscape",u:"https://reference.medscape.com/drug/lopressor-toprol-xl-metoprolol-342453"},{l:"Drugs.com",u:"https://www.drugs.com/metoprolol.html"},{l:"DailyMed",u:"https://dailymed.nlm.nih.gov/dailymed/search.cfm?query=metoprolol"}]},
  {name:"Vancomycin",    generic:"Vancocin",          cls:"Glycopeptide",   fields:[{l:"Dosing",v:"15–20 mg/kg IV q8-12h"},{l:"MRSA Target",v:"AUC 400–600 mg·h/L"},{l:"Max Single",v:"3g per dose"}],            links:[{l:"Medscape",u:"https://reference.medscape.com/drug/vancocin-vancomycin-342587"},{l:"Drugs.com",u:"https://www.drugs.com/vancomycin.html"},{l:"DailyMed",u:"https://dailymed.nlm.nih.gov/dailymed/search.cfm?query=vancomycin"}]},
  {name:"Heparin (UFH)", generic:"Unfractionated",    cls:"Anticoagulant",  fields:[{l:"ACS Bolus",v:"60 U/kg IV (max 4000 U)"},{l:"ACS Infusion",v:"12 U/kg/hr (max 1000 U/hr)"},{l:"Target aPTT",v:"60–100 sec"}],links:[{l:"Medscape",u:"https://reference.medscape.com/drug/heparin-lock-heparin-342486"},{l:"Drugs.com",u:"https://www.drugs.com/heparin.html"},{l:"DailyMed",u:"https://dailymed.nlm.nih.gov/dailymed/search.cfm?query=heparin"}]},
  {name:"Salbutamol",    generic:"Ventolin / ProAir", cls:"β₂ Agonist",    fields:[{l:"Nebulised",v:"2.5–5mg q20min × 3"},{l:"MDI",v:"4–8 puffs (100mcg/puff)"},{l:"Continuous",v:"10–15mg/hr neb"}],           links:[{l:"Medscape",u:"https://reference.medscape.com/drug/proair-ventolin-hfa-albuterol-342484"},{l:"Drugs.com",u:"https://www.drugs.com/albuterol.html"},{l:"DailyMed",u:"https://dailymed.nlm.nih.gov/dailymed/search.cfm?query=albuterol"}]},
  {name:"Insulin (Regular)",generic:"Humulin R",     cls:"Antidiabetic",   fields:[{l:"DKA Bolus",v:"0.1 U/kg IV bolus"},{l:"DKA Infusion",v:"0.1 U/kg/hr IV"},{l:"Hyperkalemia",v:"10 U IV + 50mL D50W"}],     links:[{l:"Medscape",u:"https://reference.medscape.com/drug/humulin-r-novolin-r-insulin-regular-342465"},{l:"Drugs.com",u:"https://www.drugs.com/insulin.html"},{l:"DailyMed",u:"https://dailymed.nlm.nih.gov/dailymed/search.cfm?query=insulin+regular"}]},
  {name:"Norepinephrine", generic:"Levophed",         cls:"Vasopressor",    fields:[{l:"Septic Shock",v:"0.01–3 mcg/kg/min"},{l:"Target MAP",v:"≥65 mmHg"},{l:"Titration",v:"Titrate q5-10min"}],               links:[{l:"Medscape",u:"https://reference.medscape.com/drug/levophed-norepinephrine-342484"},{l:"Drugs.com",u:"https://www.drugs.com/norepinephrine.html"},{l:"DailyMed",u:"https://dailymed.nlm.nih.gov/dailymed/search.cfm?query=norepinephrine"}]},
  {name:"Morphine",       generic:"MS Contin",        cls:"Opioid Analgesic",fields:[{l:"IV Acute Pain",v:"2–4mg IV q4h PRN"},{l:"PO",v:"15–30mg q4h"},{l:"Reversal",v:"Naloxone 0.4mg IV"}],                   links:[{l:"Medscape",u:"https://reference.medscape.com/drug/ms-contin-kadian-morphine-343219"},{l:"Drugs.com",u:"https://www.drugs.com/morphine.html"},{l:"DailyMed",u:"https://dailymed.nlm.nih.gov/dailymed/search.cfm?query=morphine"}]},
];

// ── Data: Landmark studies ────────────────────────────────────────────────────
const STUDIES_DB = {
  "ProCESS":     {title:"ProCESS Trial",      journal:"NEJM",           year:2014, finding:"Protocol-based sepsis resuscitation not superior to usual care — standard care is adequate"},
  "SMART":       {title:"SMART Trial",        journal:"NEJM",           year:2018, finding:"Balanced crystalloids vs. saline: lower MAKE30 composite endpoint in ICU patients"},
  "ADRENAL":     {title:"ADRENAL Trial",      journal:"NEJM",           year:2018, finding:"Hydrocortisone in septic shock: faster vasopressor weaning but no mortality benefit"},
  "PARADIGM-HF": {title:"PARADIGM-HF Trial",  journal:"NEJM",           year:2014, finding:"Sacubitril/valsartan reduced CV death by 20% vs. enalapril in HFrEF"},
  "DAPA-HF":     {title:"DAPA-HF Trial",      journal:"NEJM",           year:2019, finding:"Dapagliflozin reduced worsening HF or CV death by 26% in HFrEF"},
  "EMPEROR":     {title:"EMPEROR-Reduced",    journal:"NEJM",           year:2020, finding:"Empagliflozin reduced HF hospitalization + CV death by 25% in HFrEF"},
  "EAST-AFNET4": {title:"EAST-AFNET 4",       journal:"NEJM",           year:2020, finding:"Early rhythm control reduced CV outcomes by 21% vs. rate control in AF"},
  "PLATO":       {title:"PLATO Trial",        journal:"NEJM",           year:2009, finding:"Ticagrelor reduced CV death/MI/stroke by 16% vs. clopidogrel in ACS"},
  "COMPLETE":    {title:"COMPLETE Trial",     journal:"NEJM",           year:2019, finding:"Complete revascularization reduced CV death/MI by 26% vs. culprit-only in STEMI"},
  "NINDS-tPA":   {title:"NINDS tPA Stroke Trial",journal:"NEJM",        year:1995, finding:"IV tPA within 3h: 30% more patients with minimal/no disability at 3 months"},
  "DAWN":        {title:"DAWN Trial",         journal:"NEJM",           year:2018, finding:"Thrombectomy 6-24h: 49% vs 13% functional independence"},
  "SYGMA-1":     {title:"SYGMA 1 Trial",      journal:"NEJM",           year:2018, finding:"As-needed budesonide/formoterol non-inferior to daily ICS in mild asthma"},
  "IMPACT":      {title:"IMPACT Trial",       journal:"NEJM",           year:2018, finding:"ICS/LABA/LAMA triple therapy reduced exacerbations by 15% vs. ICS/LABA in COPD"},
  "ACCORD":      {title:"ACCORD Trial",       journal:"NEJM",           year:2008, finding:"Intensive glucose control (<6% A1c) increased mortality vs. standard control"},
  "SPRINT":      {title:"SPRINT Trial",       journal:"NEJM",           year:2015, finding:"SBP target <120 mmHg reduced CV events and mortality vs. <140 in non-diabetic HTN"},
};

// ── Data: Rich guideline detail ───────────────────────────────────────────────
const RICH_DETAIL = {
  "Surviving Sepsis": {
    synopsis:"International consensus covering the Hour-1 bundle, fluid resuscitation, vasopressor selection, antibiotic stewardship, and adjunctive therapies for sepsis and septic shock.",
    keyPoints:["Antibiotics within 1h for septic shock; within 3h for sepsis without shock","Balanced crystalloids (LR/PlasmaLyte) preferred over 0.9% normal saline","Norepinephrine first-line vasopressor; add vasopressin (not epinephrine) second-line","Lactate ≥4 mmol/L defines septic shock equivalent — aggressive resuscitation","Hydrocortisone 200mg/day for vasopressor-refractory septic shock","Procalcitonin-guided antibiotic de-escalation and discontinuation"],
    recs:[{cls:"Strong / High",text:"Administer IV antibiotics within 1h of septic shock recognition"},{cls:"Strong / Moderate",text:"Use balanced crystalloids over normal saline as IV fluid"},{cls:"Strong / Moderate",text:"Norepinephrine first-line vasopressor; target MAP ≥65 mmHg"},{cls:"Weak / Moderate",text:"Hydrocortisone 200mg/day for vasopressor-refractory shock"}],
    studies:["ProCESS","SMART","ADRENAL"],
  },
  "Heart Failure": {
    synopsis:"Comprehensive update establishing 4-pillar GDMT for HFrEF, new SGLT2 inhibitor Class I indication, and updated HF staging including new HFmrEF category.",
    keyPoints:["4-pillar GDMT for HFrEF: ACEi/ARB/ARNi + beta-blocker + MRA + SGLT2 inhibitor","SGLT2 inhibitors (dapagliflozin, empagliflozin) Class I LOE A for HFrEF","ARNi (sacubitril/valsartan) preferred over ACEi in stable symptomatic HFrEF","New HFmrEF (EF 41-49%) — consider same GDMT as HFrEF","ICD for EF ≤35% on optimal GDMT × ≥3 months (NYHA class II-III)","Loop diuretics for symptom relief; no mortality benefit"],
    recs:[{cls:"Class I / LOE A",text:"SGLT2 inhibitors reduce HF hospitalization and CV death in HFrEF"},{cls:"Class I / LOE A",text:"Beta-blockers (carvedilol, bisoprolol, metoprolol succinate) reduce mortality"},{cls:"Class I / LOE B-R",text:"ARNi preferred over ACEi in stable symptomatic HFrEF"},{cls:"Class I / LOE A",text:"MRAs reduce mortality and HF hospitalization"}],
    studies:["PARADIGM-HF","DAPA-HF","EMPEROR"],
  },
  "Atrial Fibrillation": {
    synopsis:"Landmark AF management update incorporating EAST-AFNET4 early rhythm control evidence, updated anticoagulation guidance, and expanded catheter ablation indications.",
    keyPoints:["CHA₂DS₂-VASc ≥2 (men) / ≥3 (women): anticoagulate; DOACs preferred over warfarin","Early rhythm control (within 12 months of AF diagnosis) reduces CV outcomes","Rate control target: resting HR <80 bpm (symptomatic) or <110 bpm (others)","Catheter ablation: Class I or reasonable first-line for symptomatic paroxysmal AF","Lifestyle modification (weight loss, exercise) reduces AF burden and recurrence"],
    recs:[{cls:"Class I / LOE A",text:"DOACs preferred over warfarin for non-valvular AF anticoagulation"},{cls:"Class I / LOE B-R",text:"Early rhythm control strategy to reduce cardiovascular events"},{cls:"Class IIa / LOE B-NR",text:"Catheter ablation as first-line for symptomatic paroxysmal AF"}],
    studies:["EAST-AFNET4"],
  },
  "STEMI": {
    synopsis:"Updated STEMI management with door-to-balloon time goals, complete revascularization evidence, and optimized antiplatelet/anticoagulation strategies for primary PCI.",
    keyPoints:["Primary PCI preferred; door-to-balloon time goal ≤90 min (system goal ≤60 min)","If PCI not available within 120 min: thrombolytics within 30 min","DAPT: aspirin 325mg + ticagrelor or prasugrel (preferred over clopidogrel) × 12 months","Complete revascularization of non-culprit lesions during index hospitalization (Class IIa)","High-intensity statin before or at discharge"],
    recs:[{cls:"Class I / LOE A",text:"Primary PCI with door-to-balloon ≤90 min; system goal ≤60 min"},{cls:"Class I / LOE A",text:"Aspirin + ticagrelor or prasugrel for 12 months post-STEMI"},{cls:"Class IIa / LOE B-R",text:"Complete revascularization of non-culprit lesions at index PCI"}],
    studies:["PLATO","COMPLETE"],
  },
  "Community-Acquired Pneumonia": {
    synopsis:"IDSA/ATS consensus for adult CAP establishing PSI/CURB-65 site-of-care decisions, empiric antibiotic selection, and treatment duration guidance.",
    keyPoints:["PSI or CURB-65 guides inpatient vs outpatient; CURB-65 ≥2 → consider admission","Outpatient (no comorbidities): amoxicillin OR doxycycline","Inpatient non-ICU: beta-lactam + macrolide OR respiratory fluoroquinolone","ICU CAP: beta-lactam + azithromycin OR beta-lactam + respiratory fluoroquinolone","5-day course adequate if improving (meets clinical stability criteria)","Blood cultures before antibiotics but do NOT delay treatment"],
    recs:[{cls:"Strong / LOE I",text:"Use PSI or CURB-65 for site-of-care and severity decision"},{cls:"Strong / LOE I",text:"Beta-lactam + macrolide or respiratory FQ for non-ICU inpatient CAP"},{cls:"Moderate / LOE II",text:"5-day course adequate for non-severe CAP responding to treatment"}],
    studies:[],
  },
  "COPD": {
    synopsis:"Annual GOLD update with simplified ABE classification, updated inhaler selection algorithm, and evidence-based exacerbation management protocols.",
    keyPoints:["Diagnosis requires post-bronchodilator FEV1/FVC <0.70 by spirometry","Use symptom burden + exacerbation history (not spirometry alone) to guide pharmacotherapy","LAMA monotherapy first-line for dyspnea without frequent exacerbations","LAMA + LABA for ongoing dyspnea on monotherapy","Add ICS only for eosinophils ≥300/μL or frequent exacerbations on LABA/LAMA","Acute exacerbation: SABA + systemic steroids 40mg × 5 days + antibiotics if purulent"],
    recs:[{cls:"Evidence A",text:"LAMA reduces exacerbations more than LABA or LABA/ICS in group B/E"},{cls:"Evidence A",text:"ICS/LABA/LAMA triple therapy reduces exacerbations vs. dual therapy"},{cls:"Evidence A",text:"5-day systemic corticosteroid course reduces AECOPD treatment failure"}],
    studies:["IMPACT"],
  },
  "Ischemic Stroke": {
    synopsis:"Updated AIS guidelines expanding IV alteplase eligibility, establishing tenecteplase equivalence, and extending mechanical thrombectomy window to 24h.",
    keyPoints:["IV alteplase within 3h (Class I) and 3-4.5h (Class I for most patients) of symptom onset","Tenecteplase 0.25mg/kg (max 25mg): non-inferior to alteplase; single-bolus advantage","Mechanical thrombectomy for LVO up to 24h with favorable imaging (DAWN/DEFUSE-3)","Pre-tPA BP: treat if >185/110; post-tPA: maintain <180/105 for 24h"],
    recs:[{cls:"Class I / LOE A",text:"IV alteplase within 3h for eligible patients"},{cls:"Class I / LOE A",text:"Mechanical thrombectomy for LVO within 6h + favorable clinical/imaging"},{cls:"Class I / LOE B-R",text:"Extend thrombectomy to 24h using DAWN or DEFUSE-3 criteria"}],
    studies:["NINDS-tPA","DAWN"],
  },
  "Diabetes": {
    synopsis:"Annual ADA update emphasizing individualized care, GLP-1 and SGLT2 inhibitor cardiovascular/renal benefits beyond glucose lowering, and CGM integration.",
    keyPoints:["A1c target individualized: <7% for most; <8% for frail/high hypoglycemia risk","GLP-1 agonists (semaglutide, liraglutide) first-line add-on for ASCVD or weight loss","SGLT2 inhibitors first-line for HFrEF or CKD regardless of glucose control","Screen for diabetic kidney disease: annual UACR + eGFR","Continuous glucose monitoring recommended for all T1DM and many T2DM on insulin"],
    recs:[{cls:"Grade A",text:"GLP-1 agonists for ASCVD risk reduction in T2DM with established CVD"},{cls:"Grade A",text:"SGLT2 inhibitors for cardiorenal protection in T2DM with HF or CKD"},{cls:"Grade B",text:"A1c <7% for most non-pregnant adults with T2DM"}],
    studies:["ACCORD"],
  },
};

// ── Data: Guidelines ──────────────────────────────────────────────────────────
const GUIDELINES_DATA = {
  Cardiology:            { icon:"❤️", orgs:"ACC • AHA • ESC • HRS", items:[
    {org:"ACC/AHA",       title:"2022 AHA/ACC Guideline for Chest Pain Evaluation",               desc:"Comprehensive chest pain evaluation including high-sensitivity troponin pathways.",  year:"2022", pill:"Class I",        url:"https://www.ahajournals.org/doi/10.1161/CIR.0000000000001106"},
    {org:"AHA/ACC/HRS",   title:"2023 ACC/AHA/ACEP Guideline: Atrial Fibrillation",               desc:"Updated AF management: rhythm vs rate control, anticoagulation, ablation indications.", year:"2023", pill:"Updated",       url:"https://www.ahajournals.org/doi/10.1161/CIR.0000000000001123"},
    {org:"AHA/ACC/HFSA",  title:"2022 AHA/ACC/HFSA Guideline for Heart Failure",                  desc:"HFrEF, HFmrEF, HFpEF management — 4-pillar GDMT, SGLT2i Class I, device therapy.", year:"2022", pill:"New",           url:"https://www.ahajournals.org/doi/10.1161/CIR.0000000000001172"},
    {org:"ACC/AHA",       title:"2022 AHA/ACC Guideline for STEMI Management",                    desc:"Primary PCI, door-to-balloon times, antithrombotic therapy, complete revascularization.", year:"2022", pill:"Updated",  url:"https://www.ahajournals.org/doi/10.1161/CIR.0000000000001115"},
    {org:"ACC/AHA",       title:"2017 ACC/AHA Guideline for High Blood Pressure",                  desc:"HTN definition ≥130/80 mmHg, treatment thresholds, and cardiovascular risk stratification.", year:"2017", pill:"Current", url:"https://www.ahajournals.org/doi/10.1161/HYP.0000000000000065"},
    {org:"ESC",           title:"ESC Clinical Practice Guidelines Hub",                           desc:"European guidelines library covering ACS, HF, arrhythmia, prevention, and more.",  year:"2024", pill:"Active",       url:"https://www.escardio.org/Guidelines/Clinical-Practice-Guidelines"},
  ]},
  "Infectious Diseases": { icon:"🦠", orgs:"IDSA • SCCM • WHO • CDC", items:[
    {org:"SCCM/ESICM",    title:"Surviving Sepsis Campaign: International Guidelines",            desc:"Hour-1 bundle, vasopressor selection, source control, antimicrobial stewardship.",  year:"2021", pill:"Critical Care",  url:"https://www.idsociety.org/practice-guideline/sepsis/"},
    {org:"IDSA/ATS",      title:"IDSA/ATS Community-Acquired Pneumonia Guidelines",              desc:"CAP severity assessment (PSI/CURB-65), empiric antibiotics, inpatient vs outpatient.",year:"2019", pill:"Updated",      url:"https://www.idsociety.org/practice-guideline/community-acquired-pneumonia-cap-in-adults/"},
    {org:"IDSA",          title:"IDSA Urinary Tract Infection Guidelines",                       desc:"Uncomplicated UTI, pyelonephritis, catheter-associated UTI, recurrent UTI.",         year:"2022", pill:"Updated",      url:"https://www.idsociety.org/practice-guideline/urinary-tract-infection-uti/"},
    {org:"IDSA",          title:"IDSA Skin and Soft Tissue Infections Guidelines",               desc:"Cellulitis, abscess, necrotising fasciitis — classification, empiric treatment, MRSA.",year:"2014",pill:"Current",     url:"https://www.idsociety.org/practice-guideline/skin-and-soft-tissue-infections/"},
    {org:"CDC/IDSA",      title:"Clostridioides difficile Infection Guidelines",                  desc:"C. diff severity classification, fidaxomicin vs vancomycin, fecal transplantation.", year:"2021", pill:"Updated",      url:"https://www.idsociety.org/practice-guideline/clostridium-difficile/"},
  ]},
  Pulmonology:           { icon:"🫁", orgs:"GOLD • GINA • ATS • BTS • ERS", items:[
    {org:"GOLD",          title:"2024 GOLD Report: COPD Diagnosis, Management & Prevention",     desc:"Updated spirometric criteria, GOLD A-E classification, inhaler selection algorithm.", year:"2024", pill:"Latest",       url:"https://goldcopd.org/2024-gold-report/"},
    {org:"GINA",          title:"2024 GINA Global Strategy for Asthma Management",               desc:"Step-up/step-down therapy, ICS/formoterol reliever, biologics for severe asthma.",   year:"2024", pill:"Latest",       url:"https://ginasthma.org/2024-gina-report/"},
    {org:"ATS/ERS/ESICM", title:"Berlin Definition & ARDS Management Guidelines",               desc:"ARDS diagnosis, lung protective ventilation, prone positioning, PEEP strategies.",    year:"2017", pill:"Critical Care", url:"https://www.thoracic.org/statements/"},
    {org:"ACCP/ERS",      title:"VTE and Pulmonary Embolism Diagnosis & Management",            desc:"PE risk stratification (PESI), anticoagulation, thrombolysis, treatment duration.",   year:"2021", pill:"Updated",      url:"https://www.chestnet.org/Guidelines-and-Resources/"},
  ]},
  Endocrinology:         { icon:"🧬", orgs:"ADA • AACE • ENDOCRINE SOCIETY", items:[
    {org:"ADA",           title:"2024 ADA Standards of Medical Care in Diabetes",                desc:"Classification, diagnosis, glucose targets, pharmacotherapy, cardiovascular risk reduction.", year:"2024", pill:"Annual Update", url:"https://diabetesjournals.org/care/issue/47/Supplement_1"},
    {org:"AACE/ACE",      title:"2022 AACE Clinical Practice Guideline: Obesity",               desc:"Lifestyle, pharmacotherapy (GLP-1 agonists), and bariatric surgery criteria.",        year:"2022", pill:"New",           url:"https://www.aace.com/disease-state-resources/metabolic/"},
    {org:"ATA",           title:"American Thyroid Association Hypothyroidism Guidelines",        desc:"Diagnosis, TSH targets, levothyroxine dosing, subclinical hypothyroidism.",            year:"2014", pill:"Reference",     url:"https://www.thyroid.org/professionals/ata-professional-guidelines/"},
  ]},
  "Emergency Medicine":  { icon:"🚨", orgs:"ACEP • ACEM • ERC • AHA", items:[
    {org:"ACEP",          title:"ACEP Clinical Policies & Practice Guidelines",                  desc:"All ACEP evidence-based clinical policies covering ED presentations and procedures.",  year:"2024", pill:"Hub",          url:"https://www.acep.org/clinical---practice-management/clinical-policies/"},
    {org:"AHA/ERC",       title:"2020 AHA Guidelines for CPR and Emergency Cardiovascular Care", desc:"BLS/ACLS/PALS algorithms, post-cardiac arrest care, ROSC management.",               year:"2020", pill:"Critical",     url:"https://www.ahajournals.org/doi/10.1161/CIR.0000000000001122"},
    {org:"ACEP/ASA",      title:"Acute Ischemic Stroke: tPA / Thrombolysis Guidelines",         desc:"Inclusion/exclusion criteria for IV alteplase, time windows, BP management.",          year:"2023", pill:"Time-Critical", url:"https://www.acep.org/globalassets/new-pdfs/clinical-policies/stroke.pdf"},
  ]},
  Neurology:             { icon:"🧠", orgs:"AAN • ASA • ESO • AES", items:[
    {org:"AAN",           title:"AAN Clinical Practice Guidelines Library",                      desc:"Neurology guidelines: epilepsy, MS, migraine, dementia, neurocritical care.",         year:"2024", pill:"Hub",          url:"https://www.aan.com/Guidelines/"},
    {org:"ASA/AHA",       title:"2021 ASA/AHA Guideline for Stroke Prevention",                 desc:"Secondary stroke prevention: antiplatelet therapy, anticoagulation, BP control.",      year:"2021", pill:"Updated",      url:"https://www.ahajournals.org/doi/10.1161/STR.0000000000000375"},
    {org:"AAN/AES",       title:"Status Epilepticus Treatment Guideline",                       desc:"Benzodiazepine first-line, second-line AED selection, refractory SE management.",      year:"2016", pill:"Current",      url:"https://www.aan.com/Guidelines/"},
  ]},
  Gastroenterology:      { icon:"🫃", orgs:"ACG • AGA • ASGE • EASL", items:[
    {org:"ACG",           title:"ACG Clinical Guideline: Upper GI Bleeding",                    desc:"Risk stratification (GBS), endoscopy timing, PPI dosing, variceal management.",        year:"2021", pill:"Updated",      url:"https://gi.org/guidelines/"},
    {org:"AASLD",         title:"AASLD Cirrhosis Practice Guidance",                            desc:"Variceal screening, SBP prophylaxis, hepatic encephalopathy, HRS, transplant.",        year:"2021", pill:"Updated",      url:"https://www.aasld.org/practice-guidelines"},
  ]},
  Nephrology:            { icon:"🫘", orgs:"KDIGO • ASN • ERA-EDTA", items:[
    {org:"KDIGO",         title:"KDIGO 2022 AKI Clinical Practice Guideline",                   desc:"AKI definition and staging, fluid management, RRT initiation, contrast prevention.",   year:"2022", pill:"Updated",      url:"https://kdigo.org/guidelines/acute-kidney-injury/"},
    {org:"KDIGO",         title:"KDIGO 2024 CKD Clinical Practice Guideline",                   desc:"GFR classification, CKD progression (RAAS inhibition, SGLT2i), cardiovascular risk.", year:"2024", pill:"Latest",       url:"https://kdigo.org/guidelines/ckd-evaluation-and-management/"},
  ]},
  Oncology:              { icon:"🎗️", orgs:"ASCO • NCCN • ESMO • ASTRO", items:[
    {org:"NCCN",          title:"NCCN Clinical Practice Guidelines in Oncology",                desc:"Evidence-based cancer guidelines across 60+ tumor types and treatment algorithms.",     year:"2024", pill:"Hub",          url:"https://www.nccn.org/guidelines/category_1"},
    {org:"ESMO",          title:"ESMO Febrile Neutropenia Guidelines",                          desc:"Risk stratification (MASCC), oral vs IV antibiotics, G-CSF, antifungal prophylaxis.",  year:"2021", pill:"Updated",      url:"https://www.esmo.org/guidelines"},
  ]},
  Rheumatology:          { icon:"🦴", orgs:"ACR • EULAR • BSR", items:[
    {org:"ACR",           title:"2021 ACR Guideline for Rheumatoid Arthritis Treatment",        desc:"Treat-to-target, csDMARD initiation, biologic and JAK inhibitor sequencing.",          year:"2021", pill:"Updated",      url:"https://www.rheumatology.org/Practice-Quality/Clinical-Support/"},
    {org:"ACR",           title:"2020 ACR Guideline for Gout Management",                       desc:"Urate-lowering therapy initiation, allopurinol dosing, acute flare prophylaxis.",      year:"2020", pill:"Updated",      url:"https://www.rheumatology.org/Practice-Quality/Clinical-Support/"},
  ]},
  Psychiatry:            { icon:"🧩", orgs:"APA • NICE • CANMAT • WFSBP", items:[
    {org:"APA",           title:"APA Practice Guideline: Major Depressive Disorder",            desc:"Antidepressant selection, augmentation, ECT/TMS, psychotherapy, TRD.",                 year:"2023", pill:"Updated",      url:"https://www.psychiatry.org/psychiatrists/practice/clinical-practice-guidelines"},
    {org:"SAMHSA",        title:"SAMHSA Opioid Use Disorder Treatment Guidelines",              desc:"Buprenorphine/naloxone initiation, methadone criteria, naltrexone, harm reduction.",    year:"2023", pill:"Updated",      url:"https://www.samhsa.gov/medication-assisted-treatment"},
  ]},
  Pediatrics:            { icon:"👶", orgs:"AAP • PALS • CHOP • RCPCH", items:[
    {org:"AAP",           title:"AAP Guideline: Febrile Infant Evaluation",                     desc:"Rochester criteria, Step-by-Step algorithm for febrile infants <60 days.",              year:"2021", pill:"Updated",      url:"https://www.aap.org/en/patient-care/febrile-infant/"},
    {org:"AAP/PALS",      title:"Pediatric Advanced Life Support 2020",                         desc:"Pediatric BLS/ACLS, fluid resuscitation in septic shock, IO access, vasopressors.",    year:"2020", pill:"Critical",     url:"https://www.ahajournals.org/doi/10.1161/CIR.0000000000001039"},
  ]},
};

const SYSTEM_TABS = [
  {id:"all",label:"All"},
  ...Object.keys(GUIDELINES_DATA).map(k => ({id:k, label:k})),
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function getRichDetail(guide) {
  const t = guide.title.toLowerCase();
  const entry = Object.entries(RICH_DETAIL).find(([k]) => t.includes(k.toLowerCase()));
  return entry ? entry[1] : null;
}
function highlight(text, q) {
  if (!q) return text;
  const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")})`, "gi");
  return text.replace(re, "<mark>$1</mark>");
}
function formatSummaryAsText(s) {
  if (!s || s.error) return "";
  const lines = [`${s.condition} — Clinical Summary (${s.guideline})\n`, "DIAGNOSIS CRITERIA"];
  s.diagnosis?.forEach(i => lines.push(`  • ${i}`));
  lines.push("\nFIRST-LINE TREATMENT");
  s.treatment?.forEach(i => lines.push(`  • ${i}`));
  lines.push("\nCLINICAL PEARLS");
  s.pearls?.forEach(i => lines.push(`  • ${i}`));
  return lines.join("\n");
}

// ── Shared primitives ─────────────────────────────────────────────────────────
function Spinner() {
  return <div style={{ width:14, height:14, border:`2px solid ${T.purple}`, borderTopColor:"transparent", borderRadius:"50%", animation:"kb-spin 0.8s linear infinite", display:"inline-block" }} />;
}

function SectionTitle({ children, sub }) {
  return (
    <div style={{ marginBottom:sub ? 6 : 14 }}>
      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:700, color:T.txt }}>{children}</div>
      {sub && <div style={{ fontSize:11, color:T.txt4, marginTop:3 }}>{sub}</div>}
    </div>
  );
}

function Tag({ text, color }) {
  return (
    <span style={{ fontSize:8, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, padding:"1px 7px", borderRadius:20, background:color + "14", border:`1px solid ${color}30`, color, letterSpacing:".04em" }}>
      {text}
    </span>
  );
}

// ── Search tab ────────────────────────────────────────────────────────────────
function SearchTab() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const filters = ["all","drug","disease","guide","ed"];
  const typeIcon = {drug:"💊", disease:"🩺", guide:"📋", ed:"🚨"};
  const typeColor = {drug:T.cyan, disease:T.purple, guide:T.blue, ed:T.coral};

  const results = query.trim() ? SEARCH_INDEX.filter(item => {
    const ok = filter === "all" || item.type === filter;
    const q = query.toLowerCase();
    return ok && (item.name.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q));
  }) : [];

  const QUICK = [
    {icon:"📖",title:"UpToDate",       desc:"Evidence-based clinical decision support",                     url:"https://www.uptodate.com"},
    {icon:"🔬",title:"DynaMed",        desc:"EBSCO point-of-care clinical reference",                       url:"https://www.dynamed.com"},
    {icon:"📚",title:"PubMed",         desc:"NLM comprehensive biomedical literature database",             url:"https://pubmed.ncbi.nlm.nih.gov"},
    {icon:"🧮",title:"MDCalc",         desc:"500+ validated medical calculators",                           url:"https://www.mdcalc.com"},
    {icon:"🌐",title:"Medscape Reference",desc:"Drug monographs, disease references",                       url:"https://reference.medscape.com"},
    {icon:"🏆",title:"Cochrane Library",desc:"Systematic reviews — highest level of evidence",              url:"https://www.cochranelibrary.com"},
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:22 }}>
      {/* Search panel */}
      <div style={{ background:`linear-gradient(135deg,${T.panel},rgba(8,22,40,0.9))`, border:`1px solid ${T.bhi}`, borderRadius:12, padding:"22px 24px" }}>
        <SectionTitle sub="Search across drugs, diseases, guidelines, and ED resources simultaneously">🔍 Medical Knowledge Search</SectionTitle>
        <div style={{ display:"flex", gap:8, marginBottom:10 }}>
          <div style={{ flex:1, position:"relative" }}>
            <span style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", color:T.txt4, fontSize:14, pointerEvents:"none" }}>🔍</span>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search: sepsis, metoprolol, ACS guidelines, pneumonia..."
              style={{ width:"100%", height:42, background:T.card, border:`1.5px solid ${T.bhi}`, borderRadius:8, padding:"0 14px 0 36px", color:T.txt, fontSize:13 }} />
          </div>
        </div>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {filters.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding:"4px 12px", borderRadius:20, fontSize:11, border:`1px solid ${filter===f ? T.blue : T.b}`, background:filter===f ? T.blue + "18" : "transparent", color:filter===f ? T.blue : T.txt4, transition:"all .14s" }}>
              {f === "all" ? "All" : typeIcon[f] + " " + f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        {query.trim() && (
          <div style={{ marginTop:14, display:"flex", flexDirection:"column", gap:6 }}>
            {results.length === 0 ? (
              <div style={{ textAlign:"center", padding:"28px", color:T.txt4, fontSize:13 }}>No results for "{query}"</div>
            ) : results.slice(0, 12).map((r, i) => (
              <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                style={{ display:"flex", alignItems:"flex-start", gap:11, padding:"10px 13px", background:T.card, border:`1px solid ${T.b}`, borderRadius:8, transition:"all .14s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = T.bhi; e.currentTarget.style.background = T.up; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = T.b; e.currentTarget.style.background = T.card; }}>
                <span style={{ fontSize:17, flexShrink:0, marginTop:1 }}>{typeIcon[r.type]}</span>
                <div>
                  <div style={{ fontSize:12, fontWeight:600, color:T.txt, marginBottom:2 }} dangerouslySetInnerHTML={{ __html:highlight(r.name, query) }} />
                  <div style={{ fontSize:11, color:T.txt4, marginBottom:4 }} dangerouslySetInnerHTML={{ __html:highlight(r.desc, query) }} />
                  <Tag text={r.type.charAt(0).toUpperCase() + r.type.slice(1)} color={typeColor[r.type]} />
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Quick access */}
      <div>
        <SectionTitle sub="Direct links to the most-used clinical references">Quick Access Resources</SectionTitle>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:11 }}>
          {QUICK.map((c, i) => (
            <a key={i} href={c.url} target="_blank" rel="noopener noreferrer" className="kb-card"
              style={{ display:"block", background:T.card, border:`1px solid ${T.b}`, borderRadius:11, padding:"14px 16px", cursor:"pointer" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                <div style={{ width:36, height:36, borderRadius:9, background:T.up, border:`1px solid ${T.bhi}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>{c.icon}</div>
                <div style={{ fontSize:13, fontWeight:700, color:T.txt, fontFamily:"'Playfair Display',serif" }}>{c.title}</div>
              </div>
              <div style={{ fontSize:11, color:T.txt3, lineHeight:1.55, marginBottom:8 }}>{c.desc}</div>
              <div style={{ fontSize:11, color:T.blue, fontWeight:600 }}>Open ↗</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Drugs tab ─────────────────────────────────────────────────────────────────
function DrugsTab() {
  const [search, setSearch] = useState("");
  const filtered = DRUGS_QR.filter(d => {
    const q = search.toLowerCase();
    return !q || d.name.toLowerCase().includes(q) || d.cls.toLowerCase().includes(q);
  });

  const DB_LINKS = [
    {icon:"💊",title:"Drugs.com",         desc:"Consumer and professional drug info, interactions, side effects, dosage",         url:"https://www.drugs.com"},
    {icon:"📱",title:"Epocrates",          desc:"Point-of-care drug reference with real-time interactions and dosing calculators", url:"https://www.epocrates.com"},
    {icon:"🏥",title:"Micromedex",         desc:"Evidence-based drug, disease, and toxicology information for clinicians",        url:"https://www.micromedexsolutions.com"},
    {icon:"🇺🇸",title:"FDA Drug Database",  desc:"Official FDA approved drug info, labels, NDA/ANDA approvals",                   url:"https://www.accessdata.fda.gov/scripts/cder/daf/"},
    {icon:"📄",title:"DailyMed",           desc:"Official FDA package inserts — prescribing information as submitted to FDA",     url:"https://dailymed.nlm.nih.gov"},
    {icon:"⚠️",title:"CredibleMeds/AZCERT",desc:"Comprehensive QT drug risk classifications and drug-induced arrhythmia risk",    url:"https://www.crediblemeds.org"},
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:22 }}>
      <SectionTitle sub="Search drug databases, view pharmacology, dosing, interactions, and safety data">💊 Drug Information</SectionTitle>

      {/* Search */}
      <div style={{ background:T.card, border:`1px solid ${T.b}`, borderRadius:11, padding:"14px 16px" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by generic name, brand name, or drug class..."
          style={{ width:"100%", height:38, background:T.up, border:`1.5px solid ${T.bhi}`, borderRadius:8, padding:"0 13px", color:T.txt, fontSize:13 }} />
      </div>

      {/* DB links */}
      <div>
        <div style={{ fontSize:13, fontWeight:600, color:T.txt2, marginBottom:10, fontFamily:"'Playfair Display',serif" }}>Drug Reference Databases</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(230px,1fr))", gap:10, marginBottom:20 }}>
          {DB_LINKS.map((c, i) => (
            <a key={i} href={c.url} target="_blank" rel="noopener noreferrer" className="kb-card"
              style={{ display:"block", background:T.card, border:`1px solid ${T.b}`, borderRadius:10, padding:"13px 15px", cursor:"pointer" }}>
              <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:7 }}>
                <div style={{ width:32, height:32, borderRadius:8, background:T.up, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>{c.icon}</div>
                <div style={{ fontSize:12, fontWeight:700, color:T.txt, fontFamily:"'Playfair Display',serif" }}>{c.title}</div>
              </div>
              <div style={{ fontSize:10.5, color:T.txt3, lineHeight:1.55, marginBottom:6 }}>{c.desc}</div>
              <div style={{ fontSize:10, color:T.cyan, fontWeight:600 }}>Open ↗</div>
            </a>
          ))}
        </div>
      </div>

      {/* QR cards */}
      <div>
        <div style={{ fontSize:13, fontWeight:600, color:T.txt2, marginBottom:10, fontFamily:"'Playfair Display',serif" }}>⚡ Emergency Drug Quick Reference</div>
        {filtered.map((d, i) => (
          <div key={i} style={{ background:T.card, border:`1px solid ${T.b}`, borderLeft:`3px solid ${T.cyan}`, borderRadius:8, padding:"12px 14px", marginBottom:8 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
              <span style={{ fontSize:13, fontWeight:700, color:T.txt }}>{d.name}</span>
              <span style={{ fontSize:11, color:T.txt4, fontStyle:"italic" }}>({d.generic})</span>
              <Tag text={d.cls} color={T.cyan} />
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:8 }}>
              {d.fields.map((f, j) => (
                <div key={j}>
                  <div style={{ fontSize:8, color:T.txt4, textTransform:"uppercase", letterSpacing:".5px", marginBottom:2, fontFamily:"'JetBrains Mono',monospace" }}>{f.l}</div>
                  <div style={{ fontSize:11, color:T.txt2, fontFamily:"'JetBrains Mono',monospace" }}>{f.v}</div>
                </div>
              ))}
            </div>
            <div style={{ display:"flex", gap:7 }}>
              {d.links.map((lk, j) => (
                <a key={j} href={lk.u} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize:10, color:T.blue, background:T.up, border:`1px solid ${T.b}`, padding:"2px 8px", borderRadius:4 }}>
                  {lk.l}
                </a>
              ))}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div style={{ textAlign:"center", padding:"28px", color:T.txt4, fontSize:13 }}>No drugs match "{search}"</div>}
      </div>
    </div>
  );
}

// ── Guideline AI panel ────────────────────────────────────────────────────────
function GuidelineAIPanel({ guide, rich }) {
  const [mode, setMode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  const generate = async (m) => {
    setMode(m); setLoading(true); setSummary(null); setError(null);
    const ctx = rich
      ? `Key Points:\n${rich.keyPoints.join("\n")}\nRecommendations:\n${rich.recs.map(r => `${r.cls}: ${r.text}`).join("\n")}`
      : `Description: ${guide.desc}`;
    const systemPrompt = m === "clinician"
      ? "You are a senior clinician. Summarize this guideline in 6 concise bullet points. Lead each with an emoji (🔴 critical, 🟡 moderate, 🟢 supportive). Use precise medical language."
      : "You are a patient educator. Explain this guideline in plain language in 5 short sentences a patient can understand. Start by explaining what the guideline is about.";
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514", max_tokens:700,
          system: systemPrompt,
          messages:[{ role:"user", content:`Guideline: "${guide.title}" (${guide.org}, ${guide.year})\n${ctx}` }],
        }),
      });
      const data = await res.json();
      setSummary(data.content?.[0]?.text || "Summary unavailable.");
    } catch { setError("Summary generation failed — please try again."); }
    finally { setLoading(false); }
  };

  const accent = mode === "patient" ? T.teal : T.purple;
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      <div style={{ display:"flex", gap:8 }}>
        {[["clinician","🩺 Clinician Summary"],["patient","👤 Patient Explanation"]].map(([m, label]) => (
          <button key={m} onClick={() => generate(m)}
            style={{ flex:1, padding:"9px", borderRadius:9, border:`1px solid ${!loading && summary && mode === m ? accent + "55" : T.bhi}`, background:!loading && summary && mode === m ? accent + "0a" : T.up, color:loading && mode === m ? T.purple : !loading && summary && mode === m ? accent : T.txt3, fontWeight:600, fontSize:12, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
            {loading && mode === m ? <><Spinner /> Generating…</> : label}
          </button>
        ))}
      </div>
      {!summary && !loading && (
        <div style={{ padding:"24px", textAlign:"center", color:T.txt4, border:`1px dashed ${T.b}`, borderRadius:10, fontSize:12 }}>
          <div style={{ fontSize:28, marginBottom:8 }}>🤖</div>
          <div>Select a mode above — AI will generate a tailored summary</div>
          <div style={{ fontSize:10, color:T.txt4, marginTop:5 }}>Powered by Claude · {guide.org} {guide.year}</div>
        </div>
      )}
      {error && <div style={{ padding:"10px 14px", background:`${T.coral}10`, border:`1px solid ${T.coral}35`, borderRadius:8, color:T.coral, fontSize:12 }}>{error}</div>}
      {summary && (
        <div style={{ background:mode === "patient" ? T.teal + "06" : T.purple + "06", border:`1px solid ${mode === "patient" ? T.teal + "25" : T.purple + "30"}`, borderRadius:10, padding:"14px 16px", animation:"kb-fadeUp .3s ease" }}>
          <div style={{ fontSize:9, fontWeight:700, letterSpacing:".8px", textTransform:"uppercase", color:mode === "patient" ? T.teal : T.purple, marginBottom:8 }}>
            {mode === "patient" ? "👤 PATIENT-FRIENDLY · AI Generated" : "🩺 CLINICIAN SUMMARY · AI Generated"}
          </div>
          <div style={{ fontSize:12.5, color:T.txt2, lineHeight:1.85, whiteSpace:"pre-line" }}>{summary}</div>
          <div style={{ marginTop:10, fontSize:10, color:T.txt4, fontStyle:"italic" }}>⚠ AI-generated — always verify against the full published guideline.</div>
        </div>
      )}
    </div>
  );
}

// ── Guideline detail panel ────────────────────────────────────────────────────
function GuidelineDetailPanel({ guide, onClose }) {
  const [tab, setTab] = useState("overview");
  const rich = getRichDetail(guide);
  const tabs = rich
    ? [{id:"overview",icon:"📋",label:"Overview"},{id:"recs",icon:"🎯",label:"Key Recs"},{id:"studies",icon:"🔬",label:"Evidence"},{id:"ai",icon:"🤖",label:"AI Summary"}]
    : [{id:"overview",icon:"📋",label:"Overview"},{id:"ai",icon:"🤖",label:"AI Summary"},{id:"links",icon:"🔗",label:"Links"}];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10, height:"100%", animation:"kb-fadeUp .2s ease" }}>
      {/* Header */}
      <div style={{ background:`linear-gradient(135deg,${T.blue}12,${T.panel})`, border:`1px solid ${T.blue}28`, borderRadius:10, padding:"13px 15px", flexShrink:0 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10 }}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:"flex", gap:6, marginBottom:5, flexWrap:"wrap", alignItems:"center" }}>
              <span style={{ fontSize:9, fontWeight:700, color:T.gold, fontFamily:"'JetBrains Mono',monospace", textTransform:"uppercase", letterSpacing:".6px" }}>{guide.org}</span>
              <Tag text={guide.year} color={T.txt4} />
              {rich && <Tag text="✦ Rich Detail" color={T.teal} />}
            </div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:13, fontWeight:700, color:T.txt, lineHeight:1.4 }}>{guide.title}</div>
          </div>
          <button onClick={onClose} style={{ background:`${T.coral}12`, border:`1px solid ${T.coral}30`, color:T.coral, padding:"3px 9px", borderRadius:6, fontSize:11, fontWeight:600, flexShrink:0 }}>✕</button>
        </div>
        <div style={{ marginTop:7 }}>
          <Tag text={guide.pill} color={T.blue} />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:3, background:T.up, borderRadius:8, padding:"3px", flexShrink:0 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flex:1, padding:"6px", borderRadius:6, border:`1px solid ${tab === t.id ? T.blue + "55" : "transparent"}`, background:tab === t.id ? T.card : "transparent", color:tab === t.id ? T.blue : T.txt4, fontSize:10.5, fontWeight:tab === t.id ? 600 : 400, transition:"all .14s" }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:10 }}>

        {tab === "overview" && (
          <div style={{ display:"flex", flexDirection:"column", gap:10, animation:"kb-fadeUp .2s ease" }}>
            <div style={{ padding:"12px 14px", background:T.blue + "08", border:`1px solid ${T.blue}20`, borderRadius:9 }}>
              <div style={{ fontSize:9, fontWeight:700, color:T.blue, textTransform:"uppercase", letterSpacing:1.5, marginBottom:6 }}>SYNOPSIS</div>
              <div style={{ fontSize:12.5, color:T.txt, lineHeight:1.8 }}>{rich?.synopsis || guide.desc}</div>
            </div>
            {rich?.keyPoints && (
              <>
                <div style={{ fontSize:9, fontWeight:700, color:T.teal, textTransform:"uppercase", letterSpacing:1.5 }}>KEY POINTS</div>
                {rich.keyPoints.map((pt, i) => (
                  <div key={i} style={{ display:"flex", gap:9, padding:"9px 12px", background:T.up, border:`1px solid ${T.b}`, borderRadius:8 }}>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700, color:T.gold, flexShrink:0, marginTop:2 }}>{String(i+1).padStart(2,"0")}</span>
                    <span style={{ fontSize:12, color:T.txt2, lineHeight:1.65 }}>{pt}</span>
                  </div>
                ))}
              </>
            )}
            <a href={guide.url} target="_blank" rel="noopener noreferrer"
              style={{ display:"flex", gap:8, padding:"10px 13px", background:T.cyan + "06", border:`1px solid ${T.cyan}18`, borderRadius:8, alignItems:"center" }}>
              <span style={{ color:T.cyan, fontSize:14 }}>🔗</span>
              <div>
                <div style={{ fontSize:11, fontWeight:600, color:T.cyan }}>Open Full Guideline — {guide.org}</div>
                <div style={{ fontSize:9, color:T.txt4, fontFamily:"'JetBrains Mono',monospace", marginTop:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:260 }}>{guide.url}</div>
              </div>
              <span style={{ marginLeft:"auto", color:T.cyan }}>↗</span>
            </a>
          </div>
        )}

        {tab === "recs" && rich?.recs && (
          <div style={{ display:"flex", flexDirection:"column", gap:8, animation:"kb-fadeUp .2s ease" }}>
            <div style={{ fontSize:11, color:T.txt4, marginBottom:2 }}>Formal recommendations from <strong style={{ color:T.txt }}>{guide.org}</strong>:</div>
            {rich.recs.map((r, i) => {
              const isHigh = /Class I |^A$|Strong|Grade A/i.test(r.cls);
              const isMid  = /IIa|^B|Conditional|Moderate/i.test(r.cls);
              const c = isHigh ? T.green : isMid ? T.gold : T.blue;
              return (
                <div key={i} style={{ padding:"12px 14px", borderRadius:10, background:c + "06", border:`1px solid ${c}22` }}>
                  <span style={{ fontSize:9, fontWeight:700, color:c, padding:"1px 7px", borderRadius:10, background:c + "16", border:`1px solid ${c}35`, display:"inline-block", marginBottom:7, textTransform:"uppercase", letterSpacing:".5px" }}>{r.cls}</span>
                  <div style={{ fontSize:13, color:T.txt, lineHeight:1.65, fontWeight:500 }}>{r.text}</div>
                </div>
              );
            })}
          </div>
        )}

        {tab === "studies" && rich?.studies && (
          <div style={{ display:"flex", flexDirection:"column", gap:8, animation:"kb-fadeUp .2s ease" }}>
            {rich.studies.length === 0 && (
              <div style={{ padding:"20px", textAlign:"center", color:T.txt4, fontSize:12, border:`1px dashed ${T.b}`, borderRadius:8 }}>No linked studies — search PubMed for supporting evidence</div>
            )}
            {rich.studies.map(sid => {
              const st = STUDIES_DB[sid];
              if (!st) return null;
              return (
                <div key={sid} style={{ background:T.green + "05", border:`1px solid ${T.green}20`, borderRadius:10, padding:"12px 14px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6, gap:8 }}>
                    <div style={{ fontFamily:"'Playfair Display',serif", fontStyle:"italic", fontSize:13, fontWeight:700, color:T.txt, flex:1 }}>{st.title}</div>
                    <Tag text={`${st.journal} ${st.year}`} color={T.green} />
                  </div>
                  <div style={{ display:"flex", gap:6 }}>
                    <span style={{ color:T.green, fontSize:12, flexShrink:0, marginTop:1 }}>▸</span>
                    <div style={{ fontSize:12, color:T.txt2, lineHeight:1.65 }}>{st.finding}</div>
                  </div>
                </div>
              );
            })}
            <a href={`https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(guide.title.split(":")[0])}`} target="_blank" rel="noopener noreferrer"
              style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 12px", background:T.green + "07", border:`1px solid ${T.green}22`, borderRadius:8, fontSize:11, fontWeight:600, color:T.green }}>
              📚 Search PubMed for more evidence ↗
            </a>
          </div>
        )}

        {tab === "ai" && <GuidelineAIPanel guide={guide} rich={rich} />}

        {tab === "links" && (
          <div style={{ display:"flex", flexDirection:"column", gap:7, animation:"kb-fadeUp .2s ease" }}>
            {[
              {label:`Open Full Guideline — ${guide.org}`,  url:guide.url, color:T.blue},
              {label:"Search UpToDate",                     url:`https://www.uptodate.com/contents/search?search=${encodeURIComponent(guide.title.split(":")[0])}`, color:T.cyan},
              {label:"Search PubMed",                       url:`https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(guide.title.split(":")[0])}`, color:T.green},
              {label:"Search MDCalc",                       url:`https://www.mdcalc.com/search#?terms=${encodeURIComponent(guide.title.split(" ").slice(0,3).join(" "))}`, color:T.purple},
            ].map((lk, i) => (
              <a key={i} href={lk.url} target="_blank" rel="noopener noreferrer"
                style={{ display:"flex", gap:9, padding:"10px 13px", background:T.up, border:`1px solid ${lk.color}20`, borderRadius:8, alignItems:"center" }}>
                <span style={{ color:lk.color, fontSize:14, marginTop:1 }}>🔗</span>
                <div style={{ fontSize:12, fontWeight:600, color:lk.color }}>{lk.label}</div>
                <span style={{ marginLeft:"auto", color:lk.color }}>↗</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Guidelines tab ────────────────────────────────────────────────────────────
function GuidelinesTab() {
  const [activeSystem, setActiveSystem] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const totalCount = Object.values(GUIDELINES_DATA).reduce((n, d) => n + d.items.length, 0);
  const richCount = Object.values(GUIDELINES_DATA).flatMap(d => d.items).filter(g => !!getRichDetail(g)).length;

  const visibleCategories = (activeSystem === "all" ? Object.entries(GUIDELINES_DATA) : Object.entries(GUIDELINES_DATA).filter(([k]) => k === activeSystem))
    .map(([cat, data]) => {
      const q = search.toLowerCase();
      const items = q ? data.items.filter(g => g.title.toLowerCase().includes(q) || g.desc.toLowerCase().includes(q) || g.org.toLowerCase().includes(q)) : data.items;
      return [cat, { ...data, items }];
    }).filter(([, d]) => d.items.length > 0);

  return (
    <div>
      <SectionTitle sub={`${totalCount} guidelines · ${richCount} with rich evidence detail`}>📋 Clinical Guidelines</SectionTitle>

      {/* Search */}
      <div style={{ marginBottom:12 }}>
        <input value={search} onChange={e => { setSearch(e.target.value); setSelected(null); }} placeholder="Search guidelines: sepsis, COPD, diabetes, stroke..."
          style={{ width:"100%", height:40, background:T.card, border:`1.5px solid ${T.bhi}`, borderRadius:8, padding:"0 14px", color:T.txt, fontSize:13, marginBottom:10 }} />
        <div style={{ display:"flex", gap:5, overflowX:"auto", paddingBottom:4, scrollbarWidth:"none" }}>
          {SYSTEM_TABS.slice(0, 9).map(t => (
            <button key={t.id} onClick={() => { setActiveSystem(t.id); setSelected(null); }}
              style={{ flexShrink:0, padding:"5px 12px", borderRadius:20, fontSize:11, fontWeight:activeSystem === t.id ? 600 : 400, border:`1px solid ${activeSystem === t.id ? T.blue : T.b}`, background:activeSystem === t.id ? T.blue + "16" : T.card, color:activeSystem === t.id ? T.blue : T.txt4, transition:"all .14s" }}>
              {t.id === "all" ? "All" : GUIDELINES_DATA[t.id]?.icon + " " + t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Split panel */}
      <div style={{ display:"flex", gap:16, minHeight:500 }}>
        {/* List */}
        <div style={{ flex: selected ? "0 0 44%" : 1, overflow:"hidden", display:"flex", flexDirection:"column", borderRight: selected ? `1px solid ${T.b}` : "none", paddingRight: selected ? 16 : 0 }}>
          <div style={{ flex:1, overflowY:"auto" }}>
            {visibleCategories.length === 0 && <div style={{ textAlign:"center", padding:"32px", color:T.txt4, fontSize:13 }}>No guidelines match "{search}"</div>}
            {visibleCategories.map(([cat, data]) => (
              <div key={cat} style={{ marginBottom:20 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 0", borderBottom:`1px solid ${T.b}`, marginBottom:10 }}>
                  <span style={{ fontSize:18 }}>{data.icon}</span>
                  <span style={{ fontFamily:"'Playfair Display',serif", fontSize:14, fontWeight:600, color:T.txt }}>{cat}</span>
                  <span style={{ fontSize:9, color:T.txt4, fontFamily:"'JetBrains Mono',monospace", background:T.up, padding:"1px 7px", borderRadius:10 }}>{data.items.length}</span>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                  {data.items.map((g, i) => {
                    const hasRich = !!getRichDetail(g);
                    const isSel = selected?.title === g.title;
                    return (
                      <div key={i} className="kb-gl-card" onClick={() => setSelected(g)}
                        style={{ background: isSel ? T.blue + "14" : T.card, border:`1px solid ${isSel ? T.blue + "55" : T.b}`, borderRadius:8, padding:"11px 13px", cursor:"pointer" }}>
                        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:3 }}>
                          <span style={{ fontSize:8, fontWeight:700, color:T.gold, fontFamily:"'JetBrains Mono',monospace", textTransform:"uppercase", letterSpacing:".5px" }}>{g.org}</span>
                          {hasRich && <Tag text="✦ RICH" color={T.teal} />}
                        </div>
                        <div style={{ fontSize:12, fontWeight:600, color:T.txt, lineHeight:1.35, marginBottom: selected ? 0 : 4 }}>{g.title}</div>
                        {!selected && <div style={{ fontSize:10.5, color:T.txt4, lineHeight:1.5, marginBottom:6 }}>{g.desc}</div>}
                        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                          <span style={{ fontSize:9, color:T.txt4, fontFamily:"'JetBrains Mono',monospace" }}>{g.year}</span>
                          <Tag text={g.pill} color={T.blue} />
                          <span style={{ marginLeft:"auto", fontSize:10, color: isSel ? T.blue : T.txt4 }}>{isSel ? "◀" : "▶"}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <div style={{ flex:1, minWidth:0, overflowY:"auto" }}>
            <GuidelineDetailPanel guide={selected} onClose={() => setSelected(null)} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Disease item ──────────────────────────────────────────────────────────────
function DiseaseItem({ d, showToast }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const fetchSummary = async (e) => {
    e.stopPropagation();
    if (summary) { setExpanded(v => !v); return; }
    setLoading(true); setExpanded(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514", max_tokens:600,
          system:"You are a clinical knowledge assistant. Return ONLY valid JSON (no markdown fences) with schema: {condition:string, guideline:string, diagnosis:string[], treatment:string[], pearls:string[]}. Be concise and clinical.",
          messages:[{ role:"user", content:`Clinical summary for: "${d.name}" (${d.aka}). Guideline: ${d.guide}.` }],
        }),
      });
      const data = await res.json();
      const raw = (data.content?.[0]?.text || "{}").replace(/```json|```/g, "").trim();
      setSummary(JSON.parse(raw));
    } catch { setSummary({ error:true }); }
    finally { setLoading(false); }
  };

  const handleCopy = async () => {
    if (!summary || summary.error) return;
    try {
      await navigator.clipboard.writeText(formatSummaryAsText(summary));
      showToast("Clinical summary copied to clipboard");
    } catch { showToast("Copy failed — please try manually", "error"); }
  };

  return (
    <div style={{ background:T.card, border:`1px solid ${T.b}`, borderRadius:8, overflow:"hidden", marginBottom:5 }}>
      <div style={{ display:"flex", alignItems:"stretch" }}>
        <div style={{ flex:1, padding:"9px 12px" }}>
          <div style={{ fontSize:12, fontWeight:600, color:T.txt, marginBottom:2 }}>{d.name}</div>
          {d.aka && <div style={{ fontSize:10, color:T.txt4, fontStyle:"italic" }}>{d.aka}</div>}
        </div>
        <div style={{ display:"flex", alignItems:"center", padding:"0 10px", gap:6, borderLeft:`1px solid ${T.b}` }}>
          <button onClick={fetchSummary}
            style={{ padding:"4px 10px", fontSize:10, fontWeight:600, background: expanded ? T.purple + "14" : T.up, border:`1px solid ${expanded ? T.purple : T.b}`, borderRadius:5, color: expanded ? T.purple : T.txt4, display:"flex", alignItems:"center", gap:4 }}>
            {loading ? <><Spinner />Loading…</> : expanded ? "Hide" : "✨ AI"}
          </button>
        </div>
        <div style={{ display:"flex", borderLeft:`1px solid ${T.b}` }}>
          {[{label:"📖",href:`https://www.uptodate.com/contents/search?search=${encodeURIComponent(d.name)}`,color:T.blue},
            {label:"📋",href:d.guideUrl,color:T.gold},
            {label:"📚",href:`https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(d.name)}`,color:T.green}
          ].filter(lk => lk.href).map((lk, j) => (
            <a key={j} href={lk.href} target="_blank" rel="noopener noreferrer"
              style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"0 10px", fontSize:13, color:lk.color, borderRight:`1px solid ${T.b}` }}
              title={j===0?"UpToDate":j===1?"Guideline":"PubMed"}>
              {lk.label}
            </a>
          ))}
        </div>
      </div>

      {expanded && (
        <div style={{ padding:"14px 15px", borderTop:`1px solid ${T.b}`, background:T.panel }}>
          {loading ? (
            <div style={{ display:"flex", gap:5, alignItems:"center" }}>
              <Spinner /><span style={{ color:T.txt4, fontSize:11, marginLeft:4 }}>Generating clinical summary…</span>
            </div>
          ) : summary?.error ? (
            <div style={{ fontSize:11, color:T.coral }}>Unable to load summary. Please try again.</div>
          ) : summary ? (
            <div style={{ animation:"kb-fadeUp .3s ease" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                  <div style={{ width:6, height:6, borderRadius:"50%", background:T.teal, animation:"kb-pulse 2s infinite" }} />
                  <span style={{ fontSize:9, fontWeight:700, letterSpacing:".6px", textTransform:"uppercase", color:T.teal }}>AI Clinical Summary</span>
                  <Tag text={summary.guideline} color={T.txt4} />
                </div>
                <button onClick={handleCopy}
                  style={{ padding:"4px 11px", fontSize:10, fontWeight:600, background:T.up, border:`1px solid ${T.blue}40`, borderRadius:5, color:T.blue }}>
                  📋 Copy
                </button>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
                {[{label:"Diagnosis Criteria",items:summary.diagnosis,c:T.blue,bg:T.blue+"08"},{label:"First-line Treatment",items:summary.treatment,c:T.teal,bg:T.teal+"07"},{label:"Clinical Pearls",items:summary.pearls,c:T.gold,bg:T.gold+"07"}].map(sec => (
                  <div key={sec.label} style={{ background:sec.bg, border:`1px solid ${sec.c}22`, borderRadius:8, padding:"10px 12px" }}>
                    <div style={{ fontSize:8, fontWeight:700, letterSpacing:".8px", textTransform:"uppercase", color:sec.c, marginBottom:7 }}>{sec.label}</div>
                    {sec.items?.map((item, i) => (
                      <div key={i} style={{ display:"flex", gap:5, marginBottom:5, fontSize:11, color:T.txt2, lineHeight:1.5 }}>
                        <span style={{ color:sec.c, flexShrink:0 }}>›</span><span>{item}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <div style={{ marginTop:10, fontSize:10, color:T.txt4, fontStyle:"italic" }}>⚠ AI-generated — always verify against the full published guideline.</div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

// ── Diseases tab ──────────────────────────────────────────────────────────────
function DiseasesTab({ showToast }) {
  const [search, setSearch] = useState("");
  const [alpha, setAlpha] = useState("all");
  const letters = [...new Set(DISEASES.map(d => d.letter))].sort();
  const filtered = DISEASES.filter(d => {
    const ok = alpha === "all" || d.letter === alpha;
    const q = search.toLowerCase();
    return ok && (!q || d.name.toLowerCase().includes(q) || (d.aka||"").toLowerCase().includes(q));
  });
  const grouped = letters.reduce((acc, l) => {
    const items = filtered.filter(d => d.letter === l);
    if (items.length) acc[l] = items;
    return acc;
  }, {});

  return (
    <div>
      <SectionTitle sub="Alphabetical index — tap ✨ AI for instant clinical overview, or open in UpToDate, guidelines, and PubMed">🩺 Diseases &amp; Conditions</SectionTitle>
      <div style={{ background:T.card, border:`1px solid ${T.b}`, borderRadius:10, padding:"12px 14px", marginBottom:14 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search conditions: pneumonia, STEMI, sepsis, DVT..."
          style={{ width:"100%", height:38, background:T.up, border:`1.5px solid ${T.bhi}`, borderRadius:7, padding:"0 12px", color:T.txt, fontSize:13 }} />
      </div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:14 }}>
        <button onClick={() => setAlpha("all")} style={{ width:28, height:28, display:"flex", alignItems:"center", justifyContent:"center", background: alpha === "all" ? T.purple + "18" : T.card, border:`1px solid ${alpha === "all" ? T.purple : T.b}`, borderRadius:5, fontSize:10, fontWeight:600, color: alpha === "all" ? T.purple : T.txt4, fontFamily:"'JetBrains Mono',monospace" }}>All</button>
        {letters.map(l => (
          <button key={l} onClick={() => setAlpha(l)} style={{ width:28, height:28, display:"flex", alignItems:"center", justifyContent:"center", background: alpha === l ? T.purple + "18" : T.card, border:`1px solid ${alpha === l ? T.purple : T.b}`, borderRadius:5, fontSize:11, fontWeight:600, color: alpha === l ? T.purple : T.txt4, fontFamily:"'JetBrains Mono',monospace" }}>{l}</button>
        ))}
      </div>
      {Object.entries(grouped).map(([letter, items]) => (
        <div key={letter} style={{ marginBottom:20 }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:20, fontWeight:600, color:T.purple, marginBottom:8, paddingBottom:4, borderBottom:`1px solid ${T.b}` }}>{letter}</div>
          {items.map((d, i) => <DiseaseItem key={i} d={d} showToast={showToast} />)}
        </div>
      ))}
      {Object.keys(grouped).length === 0 && <div style={{ textAlign:"center", padding:"32px", color:T.txt4, fontSize:13 }}>No conditions match "{search}"</div>}
    </div>
  );
}

// ── ED Resources tab ──────────────────────────────────────────────────────────
function EDTab() {
  const FOAM = [
    {icon:"🏄",name:"Life in the Fast Lane (LITFL)",  type:"FOAM",     desc:"ECG library, toxicology database, critical care compendium, and procedure guides.",       url:"https://litfl.com",         tags:["ECG Library","Toxicology","Critical Care"]},
    {icon:"⚡",name:"EMCrit",                          type:"FOAM",     desc:"Scott Weingart's critical care and emergency medicine resource. Expert reviews and IBCC.", url:"https://emcrit.org",         tags:["Critical Care","Resuscitation","Airway"]},
    {icon:"🧪",name:"REBEL EM",                        type:"FOAM",     desc:"Evidence-based emergency medicine. Critical appraisal of landmark trials.",               url:"https://www.rebelem.com",    tags:["Evidence-Based","Trial Reviews"]},
    {icon:"🎓",name:"ALiEM",                           type:"Education",desc:"EM education platform with clinical pearls, teaching cases, and AIR series.",              url:"https://www.aliem.com",      tags:["Education","Residency","Pearls"]},
    {icon:"🎙️",name:"EM:RAP",                          type:"CME",      desc:"Monthly audio/video CME covering high-yield EM topics.",                                   url:"https://www.emrap.org",      tags:["CME","Podcast","Board Prep"]},
    {icon:"📗",name:"Tintinalli's Emergency Medicine", type:"Reference",desc:"The definitive emergency medicine textbook — 9th edition.",                                 url:"https://www.tintinalliem.com",tags:["Textbook","9th Ed."]},
  ];
  const TOXICOLOGY = [
    {icon:"🧪",name:"TOXBASE",                         type:"Toxicology",desc:"UK National Poisons Information Service clinical toxicology database.",                    url:"https://www.toxbase.org",    tags:["Overdose","Antidotes","UK"]},
    {icon:"☎️",name:"Poison Control (1-800-222-1222)", type:"Toxicology",desc:"24/7 US poison control with direct access to toxicologists.",                              url:"https://www.poison.org",     tags:["US","24/7","Phone Consult"]},
  ];

  const renderCard = (r) => (
    <a key={r.name} href={r.url} target="_blank" rel="noopener noreferrer" className="kb-card"
      style={{ display:"block", background:T.card, border:`1px solid ${T.b}`, borderLeft:`3px solid ${r.type==="Toxicology"?T.purple:r.type==="FOAM"?T.coral:T.gold}`, borderRadius:8, padding:"12px 14px", marginBottom:8 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
        <span style={{ fontSize:16 }}>{r.icon}</span>
        <span style={{ fontSize:13, fontWeight:600, color:T.txt, flex:1 }}>{r.name}</span>
        <Tag text={r.type} color={r.type==="Toxicology"?T.purple:r.type==="FOAM"?T.coral:T.gold} />
      </div>
      <div style={{ fontSize:11, color:T.txt2, lineHeight:1.5, marginBottom:6 }}>{r.desc}</div>
      <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
        {r.tags.map(t => <Tag key={t} text={t} color={T.txt4} />)}
      </div>
    </a>
  );

  return (
    <div>
      <SectionTitle sub="Critical references, FOAM, and ED-specific clinical tools">🚨 Emergency Department Resources</SectionTitle>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
        <div>
          <div style={{ fontSize:13, fontWeight:600, color:T.txt2, marginBottom:10, fontFamily:"'Playfair Display',serif" }}>🌊 FOAM Resources</div>
          {FOAM.map(r => renderCard(r))}
        </div>
        <div>
          <div style={{ fontSize:13, fontWeight:600, color:T.txt2, marginBottom:10, fontFamily:"'Playfair Display',serif" }}>📋 ED Guidelines & Toxicology</div>
          {[
            {icon:"📋",name:"ACEP Clinical Policies",type:"Guidelines",desc:"All ACEP evidence-based clinical policies covering ED presentations and procedures.",url:"https://www.acep.org/clinical---practice-management/clinical-policies/",tags:["ACEP","Evidence-Based"]},
            {icon:"📋",name:"RCEM Professional Standards",type:"Guidelines",desc:"Royal College of Emergency Medicine standards, guidelines, and audit toolkits.",url:"https://www.rcem.ac.uk",tags:["UK","RCEM"]},
            {icon:"📊",name:"LITFL ECG Library",type:"ECG",desc:"The most comprehensive free ECG library with thousands of annotated 12-lead examples.",url:"https://litfl.com/ecg-library/",tags:["STEMI","Arrhythmias","12-Lead"]},
          ].map(r => renderCard(r))}
          <div style={{ fontSize:13, fontWeight:600, color:T.txt2, marginBottom:10, marginTop:16, fontFamily:"'Playfair Display',serif" }}>☠️ Toxicology</div>
          {TOXICOLOGY.map(r => renderCard(r))}
        </div>
      </div>
    </div>
  );
}

// ── AI Modal ──────────────────────────────────────────────────────────────────
function AIModal({ onClose }) {
  const [messages, setMessages] = useState([
    { role:"assistant", text:"Hello! I'm Notrya AI. Ask me about clinical guidelines, drug dosing, disease management, or any emergency medicine question." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  const send = async () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    const updated = [...messages, { role:"user", text:q }];
    setMessages(updated);
    setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514", max_tokens:800,
          system:"You are Notrya AI, an expert emergency medicine clinical decision support assistant. Answer concisely and clinically, referencing current guidelines (SSC 2021, IDSA 2024, DAS 2022, ACC/AHA, ADA 2024). Use bullet points. Always note clinical judgment supersedes protocol.",
          messages: updated.slice(-10).map(m => ({ role:m.role === "user" ? "user" : "assistant", content:m.text })),
        }),
      });
      const data = await res.json();
      setMessages(p => [...p, { role:"assistant", text:data.content?.[0]?.text || "I encountered an error." }]);
    } catch { setMessages(p => [...p, { role:"assistant", text:"Connection error. Please try again." }]); }
    finally { setLoading(false); }
  };

  const SUGGESTIONS = ["Summarize sepsis management guidelines","RSI induction for hypotensive patient","ARDSNet tidal volume for 170cm female","tPA indications in acute stroke","GOLD COPD inhaler selection"];

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(3,8,20,0.75)", zIndex:500, backdropFilter:"blur(6px)", display:"flex", alignItems:"flex-end", justifyContent:"flex-end", padding:24 }}>
      <div onClick={e => e.stopPropagation()} style={{ width:400, height:560, background:T.panel, border:`1px solid ${T.bhi}`, borderRadius:16, display:"flex", flexDirection:"column", overflow:"hidden", boxShadow:"0 32px 80px rgba(0,0,0,0.7)", animation:"kb-fadeUp .2s ease" }}>
        {/* Header */}
        <div style={{ padding:"12px 16px", borderBottom:`1px solid ${T.b}`, display:"flex", alignItems:"center", gap:9, flexShrink:0 }}>
          <div style={{ width:32, height:32, borderRadius:9, background:T.teal + "16", border:`1px solid ${T.teal}35`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:17 }}>🤖</div>
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:T.txt, fontFamily:"'Playfair Display',serif" }}>Notrya AI</div>
            <div style={{ display:"flex", alignItems:"center", gap:5 }}>
              <div style={{ width:5, height:5, borderRadius:"50%", background:T.teal, animation:"kb-pulse 2s infinite" }} />
              <span style={{ fontSize:8, color:T.teal, fontFamily:"'JetBrains Mono',monospace" }}>Clinical Assistant · Online</span>
            </div>
          </div>
          <button onClick={onClose} style={{ marginLeft:"auto", background:"transparent", border:"none", color:T.txt4, fontSize:18, lineHeight:1 }}>×</button>
        </div>

        {/* Messages */}
        <div style={{ flex:1, overflowY:"auto", padding:"12px 14px", display:"flex", flexDirection:"column", gap:9, minHeight:0 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display:"flex", gap:7, alignItems:"flex-start", flexDirection:m.role === "user" ? "row-reverse" : "row" }}>
              <div style={{ width:24, height:24, borderRadius:7, flexShrink:0, background: m.role === "user" ? T.blue + "20" : T.teal + "16", border:`1px solid ${m.role === "user" ? T.blue + "38" : T.teal + "30"}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12 }}>
                {m.role === "user" ? "👤" : "🤖"}
              </div>
              <div style={{ maxWidth:"80%", padding:"9px 12px", borderRadius:10, fontSize:11.5, lineHeight:1.65, background: m.role === "user" ? T.blue + "10" : T.up, border:`1px solid ${m.role === "user" ? T.blue + "25" : T.b}`, color:T.txt, whiteSpace:"pre-wrap", wordBreak:"break-word" }}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display:"flex", gap:7, alignItems:"center" }}>
              <div style={{ width:24, height:24, borderRadius:7, background:T.teal + "16", border:`1px solid ${T.teal}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12 }}>🤖</div>
              <div style={{ padding:"9px 12px", borderRadius:10, background:T.up, border:`1px solid ${T.b}`, display:"flex", gap:4, alignItems:"center" }}>
                {[0,1,2].map(i => <div key={i} style={{ width:5, height:5, borderRadius:"50%", background:T.teal, animation:`kb-bounce .9s ${i*.15}s infinite ease-in-out` }} />)}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions */}
        {messages.filter(m => m.role === "user").length === 0 && (
          <div style={{ padding:"0 12px 8px", display:"flex", flexDirection:"column", gap:3 }}>
            {SUGGESTIONS.map((s, i) => (
              <button key={i} onClick={() => setInput(s)} style={{ textAlign:"left", padding:"5px 9px", borderRadius:6, background:T.up, border:`1px solid ${T.b}`, color:T.txt4, fontSize:10, transition:"all .13s" }}
                onMouseEnter={e => { e.currentTarget.style.background = T.teal + "0a"; e.currentTarget.style.color = T.teal; e.currentTarget.style.borderColor = T.teal + "30"; }}
                onMouseLeave={e => { e.currentTarget.style.background = T.up; e.currentTarget.style.color = T.txt4; e.currentTarget.style.borderColor = T.b; }}>
                💬 {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div style={{ padding:"9px 12px 12px", borderTop:`1px solid ${T.b}`, flexShrink:0 }}>
          <div style={{ display:"flex", gap:7 }}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()} placeholder="Ask about protocols, dosing, guidelines…"
              style={{ flex:1, padding:"8px 12px", borderRadius:8, background:T.up, border:`1px solid ${T.b}`, color:T.txt, fontSize:11.5 }} />
            <button onClick={send} disabled={!input.trim() || loading}
              style={{ padding:"8px 14px", borderRadius:8, border:"none", background: input.trim() && !loading ? T.teal : T.up, color: input.trim() && !loading ? "#050f1e" : T.txt4, fontWeight:700, fontSize:12, transition:"all .15s" }}>
              →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
const TABS = [
  {id:"search",     icon:"🔍", label:"Search",     color:T.teal  },
  {id:"drugs",      icon:"💊", label:"Drugs",      color:T.cyan  },
  {id:"guidelines", icon:"📋", label:"Guidelines", color:T.blue  },
  {id:"diseases",   icon:"🩺", label:"Diseases",   color:T.purple},
  {id:"ed",         icon:"🚨", label:"ED",          color:T.coral },
];

export default function KnowledgeBaseV2() {
  const [tab, setTab]       = useState("search");
  const [aiOpen, setAiOpen] = useState(false);
  const [toast, setToast]   = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const activeColor = TABS.find(t => t.id === tab)?.color || T.teal;

  return (
    <div style={{ minHeight:"100vh", background:T.bg, color:T.txt, fontFamily:"'DM Sans',sans-serif" }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header style={{ background:"rgba(5,15,30,0.94)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", borderBottom:`1px solid ${T.b}`, padding:"0 28px", position:"sticky", top:0, zIndex:200 }}>
        <div style={{ maxWidth:1400, margin:"0 auto", height:52, display:"flex", alignItems:"center", gap:0 }}>
          {/* Brand */}
          <div style={{ display:"flex", alignItems:"center", gap:8, marginRight:24, flexShrink:0 }}>
            <div style={{ width:26, height:26, borderRadius:7, background:"linear-gradient(135deg,#3b9eff,#00e5c0)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, fontFamily:"'Playfair Display',serif", color:"#050f1e" }}>N</div>
            <span style={{ fontSize:13, fontWeight:700, color:T.txt3, fontFamily:"'Playfair Display',serif" }}>Knowledge Base</span>
          </div>

          {/* Tabs */}
          <div style={{ display:"flex", gap:1, flex:1 }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{ padding:"6px 14px", borderRadius:7, border:`1px solid ${tab === t.id ? t.color + "45" : "transparent"}`, background:tab === t.id ? t.color + "12" : "transparent", color:tab === t.id ? t.color : T.txt4, fontSize:11.5, fontWeight:tab === t.id ? 700 : 400, transition:"all .14s", display:"flex", alignItems:"center", gap:5 }}>
                <span>{t.icon}</span><span>{t.label}</span>
              </button>
            ))}
          </div>

          {/* Nav */}
          <button onClick={() => { window.location.href = "/PatientDashboard"; }}
            style={{ fontSize:10, color:T.txt4, background:"transparent", border:`1px solid ${T.b}`, borderRadius:6, padding:"4px 11px", marginLeft:12 }}
            onMouseEnter={e => { e.currentTarget.style.color = T.txt2; }}
            onMouseLeave={e => { e.currentTarget.style.color = T.txt4; }}>
            ← Hub
          </button>
        </div>

        {/* Active tab indicator */}
        <div style={{ height:2, background:`linear-gradient(90deg,transparent,${activeColor}60,transparent)`, marginTop:0 }} />
      </header>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth:1400, margin:"0 auto", padding:"24px 28px 80px" }}>
        {tab === "search"     && <SearchTab />}
        {tab === "drugs"      && <DrugsTab />}
        {tab === "guidelines" && <GuidelinesTab />}
        {tab === "diseases"   && <DiseasesTab showToast={showToast} />}
        {tab === "ed"         && <EDTab />}
      </div>

      {/* ── Floating AI button ─────────────────────────────────────────────── */}
      <button onClick={() => setAiOpen(true)}
        style={{ position:"fixed", bottom:24, right:24, zIndex:300, display:"flex", alignItems:"center", gap:8, padding:"10px 18px", borderRadius:50, background:`linear-gradient(135deg,${T.teal},${T.blue})`, border:"none", color:"#050f1e", fontWeight:700, fontSize:12, boxShadow:"0 6px 28px rgba(0,229,192,0.32)", transition:"all .2s" }}
        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 10px 36px rgba(0,229,192,0.45)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 6px 28px rgba(0,229,192,0.32)"; }}>
        🤖 Ask AI
      </button>

      {/* ── AI Modal ───────────────────────────────────────────────────────── */}
      {aiOpen && <AIModal onClose={() => setAiOpen(false)} />}

      {/* ── Toast ──────────────────────────────────────────────────────────── */}
      {toast && (
        <div style={{ position:"fixed", bottom:80, right:24, zIndex:600, background: toast.type === "error" ? T.coral : T.teal, color:"#050f1e", padding:"10px 16px", borderRadius:9, fontWeight:600, fontSize:12, boxShadow:"0 8px 32px rgba(0,0,0,0.4)", animation:"kb-fadeUp .2s ease" }}>
          {toast.type !== "error" ? "✓ " : "✕ "}{toast.msg}
        </div>
      )}

    </div>
  );
}