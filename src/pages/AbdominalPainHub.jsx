// AbdominalPainHub.jsx — Bedside Clinical Decision Tool
// Flow: Abdomen Map → Zone Differentials → Dx Workup + Treatment
// Constraints: no react-router, no localStorage, no form, no alert,
//   straight quotes, single import, typeof document guard, border before borderTop

import { useState, useCallback } from "react";

(() => {
  if (typeof document === "undefined") return;
  if (document.getElementById("abd-fonts")) return;
  const l = document.createElement("link");
  l.id = "abd-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "abd-css";
  s.textContent = `
    @keyframes abd-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
    .abd-in{animation:abd-in .18s ease forwards}
    .zone-btn:hover{filter:brightness(1.18);transform:scale(1.03)}
    .zone-btn{transition:all .15s ease;cursor:pointer}
    .dx-row:hover{background:rgba(26,53,85,0.7)!important}
    .dx-row{transition:background .12s}
  `;
  document.head.appendChild(s);
})();

const T = {
  bg:"#050f1e", panel:"#0b1d35",
  txt:"#e8f0fe", txt2:"#8aaccc", txt3:"#4a6a8a", txt4:"#2e4a6a",
  border:"rgba(26,53,85,0.8)",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", blue:"#4a90d9",
  orange:"#ff9f43", purple:"#9b6dff", green:"#3dffa0", red:"#ff5c6c",
};

const URGENCY = {
  critical:{ label:"CRITICAL", color:"#ff5c6c" },
  urgent:  { label:"URGENT",   color:"#ff9f43" },
  moderate:{ label:"MODERATE", color:"#f5c842" },
};

// ── Clinical data keyed by zone ──────────────────────────────────────────────
const ZONES = {
  RUQ:{
    label:"Right Upper Quadrant", shortLabel:"RUQ", color:T.teal,
    organs:"Liver · Gallbladder · Duodenum · Hepatic flexure",
    diagnoses:[
      { name:"Acute Cholecystitis", urgency:"urgent",
        pearl:"Murphy sign: inspiratory arrest on RUQ palpation. Absent in gangrenous cholecystitis — do not be falsely reassured.",
        labs:["CBC — leukocytosis (WBC >10k in 85%)","CMP + LFTs: bili, ALP, GGT, AST/ALT","Lipase — exclude pancreatitis","Blood cultures × 2 if febrile or septic appearing","UA — exclude RLL pneumonia/pyelonephritis"],
        imaging:[{mod:"RUQ Ultrasound (FIRST)",note:"Gallstones, wall thickening >4mm, pericholecystic fluid, sonographic Murphy sign. Sens 88%, Spec 80%"},{mod:"HIDA Scan",note:"If US equivocal — EF <35% = cholecystitis. Best for acalculous. Acalculous in ICU patients"},{mod:"CT Abdomen/Pelvis w/IV contrast",note:"If US non-diagnostic, complicated cholecystitis, or abscess suspected"}],
        treatment:["NPO + IV access + IVF resuscitation","Analgesia: ketorolac 30mg IV + hydromorphone 0.5-1mg IV prn","Antibiotics if complicated/septic: piperacillin-tazobactam 4.5g IV q8h OR ceftriaxone 2g IV + metronidazole 500mg IV","Surgical consult — laparoscopic cholecystectomy within 72h (superior to delayed)","Mild uncomplicated: antibiotics optional — surgery is curative","Percutaneous cholecystostomy tube if high surgical risk"],
        guideline:"Tokyo Guidelines 2018 · ACEP Clinical Policy" },
      { name:"Ascending Cholangitis", urgency:"critical",
        pearl:"Charcot triad (fever + jaundice + RUQ pain) 50-70% sensitive. Reynolds pentad adds hypotension + AMS = Grade III septic emergency.",
        labs:["CBC — leukocytosis","CMP + LFTs: elevated bili, ALP, GGT (obstruction pattern)","Blood cultures × 2 BEFORE antibiotics","Coagulation panel (INR) — ERCP risk assessment","Lactate if septic signs present"],
        imaging:[{mod:"RUQ Ultrasound",note:"CBD dilation >8mm (>10mm post-chole), gallstones, intrahepatic ductal dilation — sensitivity 55% for CBD stones"},{mod:"CT Abdomen/Pelvis (IV contrast)",note:"Pneumobilia, liver abscesses, periductal inflammation, perforation"},{mod:"MRCP (non-urgent delineation)",note:"Gold standard for CBD stones without radiation — use if ERCP not immediately needed"},{mod:"ERCP (therapeutic/definitive)",note:"Within 24h Grade II, emergent for Grade III — biliary decompression is treatment"}],
        treatment:["IV fluids — aggressive resuscitation if septic","Empiric antibiotics STAT: piperacillin-tazobactam 4.5g IV q8h OR meropenem 1g IV q8h (severe)","Add vancomycin if MRSA risk or immunocompromised","GI/surgery consult for urgent ERCP","Grade III (Reynolds pentad, organ dysfunction): ICU admission","Correct coagulopathy (FFP if INR >1.5) prior to ERCP"],
        guideline:"Tokyo Guidelines 2018 · ASGE 2019" },
      { name:"Hepatitis (Viral / Alcoholic)", urgency:"moderate",
        pearl:"AST:ALT >2:1 in alcoholic hepatitis. Viral: transaminases >1000 + jaundice + constitutional sx. Check INR — reflects synthetic function.",
        labs:["LFTs: AST, ALT, bili, ALP, GGT, albumin, total protein","Hepatitis panel: HBsAg, anti-HBc IgM, anti-HAV IgM, anti-HCV, HCV RNA","PT/INR (synthetic function — critical prognostic marker)","CBC, CMP, BMP","EtOH level + GGT if alcoholic hepatitis suspected","Ammonia if AMS"],
        imaging:[{mod:"RUQ Ultrasound",note:"Exclude biliary obstruction, assess hepatomegaly, splenomegaly, portal hypertension, ascites"},{mod:"CT Abdomen (IV contrast)",note:"If diagnosis unclear or abscess/HCC/malignancy suspected on US"}],
        treatment:["Supportive: IVF, antiemetics, nutrition","Alcoholic hepatitis: thiamine 100mg IV, folate 1mg IV, multivitamin, glucose management","Severe AH (MELD >20, Maddrey DF >32): prednisolone 40mg PO/day × 28 days — GI consult","Viral hepatitis: GI/hepatology referral, avoid all hepatotoxic drugs (APAP <2g/d, NSAIDs, statins)","Acute liver failure (INR >1.5 + AMS): hepatology/transplant evaluation"],
        guideline:"AASLD Practice Guidelines · ACG 2022" },
      { name:"Perforated Peptic Ulcer", urgency:"critical",
        pearl:"Sudden-onset severe epigastric/RUQ pain → diffuse rigidity. NSAID/steroid use or H. pylori history. Board-like abdomen = perforation until proven otherwise.",
        labs:["CBC, CMP, coagulation panel","Type and screen/crossmatch","Lactate — perforation rapidly leads to sepsis","Blood cultures × 2 if septic"],
        imaging:[{mod:"Upright CXR (IMMEDIATE)",note:"Free air under diaphragm in 70-80% of perforations — get this first"},{mod:"CT Abdomen/Pelvis (PO + IV contrast)",note:"Confirms perforation site, localizes pathology, identifies complications. Sensitivity 98%"},{mod:"Bedside POCUS",note:"Free fluid in Morrison pouch/RUQ — rapid screen while CT is organized"}],
        treatment:["NPO + NG tube to low intermittent suction","Large-bore IV × 2, aggressive IVF resuscitation","Broad-spectrum antibiotics: piperacillin-tazobactam 4.5g IV q8h","IV PPI: pantoprazole 80mg bolus → 8mg/hr infusion","Emergent surgical consult — laparoscopic omental patch ± open repair","ICU admission if hemodynamically unstable"],
        guideline:"ACEP Clinical Policy · EAST Practice Guidelines" },
      { name:"RLL Pneumonia", urgency:"moderate",
        pearl:"Pleuritic RUQ/right chest pain + fever + cough. Diaphragmatic irritation mimics acute abdomen. Minimal involuntary guarding on exam clue.",
        labs:["CBC (leukocytosis)","CMP","Blood cultures × 2 if admitted","Procalcitonin","COVID/flu/strep per protocol","Sputum culture if productive cough"],
        imaging:[{mod:"CXR PA + Lateral (FIRST)",note:"Right lower lobe infiltrate/consolidation — often missed on AP alone. Lateral essential"},{mod:"CT Chest",note:"CXR equivocal, empyema suspected, or worsening despite treatment"},{mod:"RUQ Ultrasound",note:"If biliary pathology cannot be excluded by history/exam"}],
        treatment:["CAP outpatient: amoxicillin-clavulanate + azithromycin OR levofloxacin 750mg daily × 5 days","CAP inpatient: ceftriaxone 1-2g IV q24h + azithromycin 500mg IV/PO daily","Severe CAP/ICU: ceftriaxone + azithromycin + vancomycin or pip-tazo","Supplemental O2, IVF, antipyretics"],
        guideline:"IDSA/ATS CAP Guidelines 2019" },
    ]},
  EPIG:{
    label:"Epigastric", shortLabel:"Epig.", color:T.coral,
    organs:"Stomach · Duodenum · Pancreas head · Distal esophagus",
    diagnoses:[
      { name:"Acute Pancreatitis", urgency:"urgent",
        pearl:"Epigastric pain radiating to back, worse supine, better leaning forward. Lipase >3× ULN diagnostic. Most common: gallstones (#1) and alcohol (#2).",
        labs:["Lipase (>3× ULN diagnostic — amylase less specific)","CBC, CMP (BUN, creatinine, calcium)","LFTs — elevated bili/ALP suggests gallstone pancreatitis","Triglycerides","BISAP components: BUN >25, GCS, age >60, SIRS, pleural effusion"],
        imaging:[{mod:"RUQ Ultrasound (all patients)",note:"Evaluate gallstones as etiology — changes management. Pancreas often obscured by bowel gas"},{mod:"CT Abdomen/Pelvis (IV contrast)",note:"NOT routine initially. Indicated at 48-72h if worsening, diagnosis unclear, or necrosis suspected. CTSI severity index"},{mod:"MRCP",note:"Preferred for biliary evaluation, choledocholithiasis, pancreas divisum — avoids radiation"}],
        treatment:["Aggressive IVF: Lactated Ringer preferred over NS — 250-500 mL/hr, target UO >0.5 mL/kg/hr","Analgesia: hydromorphone 0.5-1mg IV q3-4h (morphine acceptable — no evidence to avoid)","Mild pancreatitis: advance diet as tolerated — no benefit to prolonged NPO","Moderate-severe: early enteral nutrition via NG/NJ within 24-48h (TPN only if EN truly impossible)","ERCP within 24h if concurrent cholangitis","BISAP ≥3 or Ranson ≥3: step-down/ICU, aggressive monitoring"],
        guideline:"ACG Pancreatitis Guidelines 2013 · AGA 2020" },
      { name:"ACS / STEMI", urgency:"critical",
        pearl:"Epigastric pain is inferior STEMI until proven otherwise. ST elevation in II, III, aVF = inferior MI. Diaphoresis + nausea + epigastric pain = ECG in 90 seconds.",
        labs:["ECG STAT (within 10 min — do not delay for labs)","High-sensitivity troponin I or T — serial at 0h/3h or 0h/1h","CBC, CMP, coagulation panel","BNP or NT-proBNP if HF suspected"],
        imaging:[{mod:"12-Lead ECG (FIRST — within 10 min)",note:"Inferior: ST elevation II, III, aVF. Check V7-V9 for posterior MI. Repeat q15-30min if initial negative with ongoing sx"},{mod:"Upright CXR",note:"Pulmonary edema, cardiomegaly, mediastinal widening"},{mod:"Bedside Echo (POCUS)",note:"Wall motion abnormalities, EF estimation, pericardial effusion"}],
        treatment:["STEMI: cath lab activation — door-to-balloon <90 min","Aspirin 324mg PO chewed + P2Y12 inhibitor: ticagrelor 180mg or clopidogrel 600mg","Anticoagulation: heparin 60 U/kg IV bolus (max 4000U) → 12 U/kg/hr","NTG 0.4mg SL q5min × 3 if SBP >90 (contraindicated: RV infarct, hypotension, PDE5i in 24-48h)","NSTEMI: cardiology consult, TIMI/GRACE risk score, early invasive if high-risk","O2 only if SpO2 <90%"],
        guideline:"ACC/AHA 2025 ACS Guideline · ACEP" },
      { name:"Aortic Dissection", urgency:"critical",
        pearl:"Sudden-onset tearing/ripping chest or back pain. BP differential >20mmHg arms. Pain that migrates = dissection until proven otherwise. May present as epigastric.",
        labs:["D-dimer (<500 ng/mL + low pre-test probability virtually excludes","CBC, CMP, coagulation panel","Type and crossmatch 6 units pRBC","Troponin (exclude MI)","BMP — renal malperfusion from SMA/renal artery involvement"],
        imaging:[{mod:"CT Angiography Chest/Abd/Pelvis (DEFINITIVE)",note:"Sensitivity 98-100%. Identifies intimal flap, entry tear, extent, branch involvement — order STAT"},{mod:"Upright CXR",note:"Widened mediastinum (>8cm) in 60% of Type A. Normal CXR does NOT exclude dissection"},{mod:"Bedside Echo (POCUS)",note:"Aortic root dilation, intimal flap in aortic root, pericardial effusion/tamponade for Type A"}],
        treatment:["Type A (ascending aorta): emergent cardiothoracic surgery — OR within 30-60 min","Type B (descending): blood pressure control target SBP 100-120 mmHg","IV beta-blocker FIRST to reduce dP/dt: esmolol or labetalol IV","Then vasodilator if SBP still elevated: nicardipine or nitroprusside IV","Large-bore IV × 2, type and crossmatch 6+ units","Avoid thrombolytics and anticoagulation in Type A"],
        guideline:"AHA/ACC 2022 Aortic Disease Guideline" },
      { name:"Peptic Ulcer Disease", urgency:"moderate",
        pearl:"Burning epigastric pain: duodenal ulcer relieved by food, gastric worsened by food. NSAID, steroid, or H. pylori risk factors. Check for GI bleeding.",
        labs:["H. pylori stool antigen or urea breath test (most accurate non-invasive)","CBC — anemia if bleeding","CMP + LFTs","Glasgow-Blatchford score if upper GI bleeding present"],
        imaging:[{mod:"Upright CXR (if perforation suspected)",note:"Free air under diaphragm — do first if rigid abdomen"},{mod:"CT Abdomen (if perforation suspected)",note:"Confirms perforation, peritoneal air, associated complications"},{mod:"EGD (non-urgent)",note:"Definitive diagnosis, H. pylori biopsy, and hemostasis if bleeding — inpatient or urgent outpatient"}],
        treatment:["PPI: omeprazole 40mg PO BID or pantoprazole 40mg IV (if NPO/bleeding)","H. pylori eradication: clarithromycin-based triple therapy × 14 days OR bismuth quadruple","Discontinue NSAIDs; if must continue — COX-2 inhibitor + PPI","Uncomplicated: discharge with PPI + H. pylori treatment + GI follow-up","GI bleed: Glasgow-Blatchford, IV PPI infusion, GI consult, endoscopy within 24h"],
        guideline:"ACG H. pylori Guidelines 2017 · ACEP" },
      { name:"Boerhaave Syndrome", urgency:"critical",
        pearl:"Mackler triad: forceful vomiting + severe chest/epigastric pain + subcutaneous emphysema. Mortality >50% if >24h delay to treatment. Highest morbidity of all GI perforations.",
        labs:["CBC, CMP, coagulation panel","Blood cultures × 2","Type and crossmatch","Lactate"],
        imaging:[{mod:"Upright CXR (FIRST)",note:"Mediastinal air, left-sided pleural effusion, pneumothorax — may be normal early"},{mod:"CT Chest/Abdomen (water-soluble oral contrast)",note:"Most sensitive — confirms perforation site, mediastinal contamination extent"},{mod:"Gastrografin swallow",note:"Localizes perforation — 90% sensitive; use if CT delayed"}],
        treatment:["NPO — do NOT blindly pass NG tube","Broad-spectrum antibiotics: piperacillin-tazobactam 4.5g IV q8h + fluconazole","Aggressive IVF resuscitation + vasopressors if septic","Emergent thoracic surgery consult","Primary repair within 24h = best outcomes","Delayed >24h: esophageal exclusion vs esophagectomy per contamination"],
        guideline:"EAST Practice Management Guidelines" },
    ]},
  LUQ:{
    label:"Left Upper Quadrant", shortLabel:"LUQ", color:T.blue,
    organs:"Spleen · Stomach · Pancreas tail · Splenic flexure",
    diagnoses:[
      { name:"Splenic Rupture", urgency:"critical",
        pearl:"Kehr sign: referred left shoulder tip pain from subdiaphragmatic blood. Trauma or spontaneous (mono, heme malignancy). Normal FAST does NOT exclude splenic injury.",
        labs:["CBC — serial q6h (Hgb may be normal initially with acute hemorrhage)","Type and crossmatch STAT","CMP, coagulation panel, lactate","Monospot / EBV IgM if atraumatic + young patient"],
        imaging:[{mod:"Bedside POCUS/FAST (FIRST in unstable)",note:"Free fluid in splenorenal space/LUQ — immediate OR if positive + unstable. Do not delay for CT"},{mod:"CT Abdomen/Pelvis (IV contrast)",note:"AAST Grade I-V laceration, active extravasation (blush), hemoperitoneum extent — stable patients only"}],
        treatment:["Unstable + FAST positive: emergent OR — splenectomy","Grade I-II stable: non-operative management (NOM) in ICU, serial CBCs q6h, bed rest","Grade III-IV stable: angioembolization (IR consult) ± NOM","Grade V or active vascular injury: splenectomy","Massive transfusion protocol if needed: pRBC:FFP:platelets 1:1:1","Post-splenectomy: pneumococcal, meningococcal, Hib vaccines"],
        guideline:"EAST Splenic Injury Guidelines · AAST Grading" },
      { name:"Splenic Infarct", urgency:"urgent",
        pearl:"Sudden LUQ pain in patient with AF, hypercoagulable state, or hematologic malignancy. Can occur with COVID-19. Fever suggests infected infarct/abscess.",
        labs:["CBC with differential (heme malignancy screen)","CMP","Coagulation + hypercoagulable panel if unprovoked","Blood cultures × 2 if febrile","Monospot if young patient"],
        imaging:[{mod:"CT Abdomen/Pelvis (IV contrast)",note:"Wedge-shaped peripheral hypodensity — confirmatory. Rim enhancement = abscess"},{mod:"Doppler US",note:"Reduced/absent splenic flow — less sensitive than CT but radiation-free initial screen"}],
        treatment:["Analgesia: NSAIDs or opioids","Anticoagulation if embolic source (AF): heparin bridge to warfarin or DOAC","Hematology consult if malignancy suspected","Most infarcts resolve conservatively","Splenectomy/percutaneous drainage only if abscess develops"],
        guideline:"ACG · AHA AF Guidelines" },
      { name:"LLL Pneumonia", urgency:"moderate",
        pearl:"Left lower lobe pneumonia often presents as LUQ pain via diaphragmatic irritation. Minimal involuntary guarding, pleuritic component on deep inspiration are clues.",
        labs:["CBC, CMP","Blood cultures × 2 if admitted","Procalcitonin","Respiratory pathogen panel"],
        imaging:[{mod:"CXR PA + Lateral (FIRST)",note:"Left lower lobe infiltrate — lateral view essential, posterior infiltrates easily missed on AP"},{mod:"CT Chest",note:"CXR equivocal, empyema, or failure to respond to treatment"}],
        treatment:["CAP outpatient: amoxicillin-clavulanate + azithromycin OR levofloxacin 750mg × 5 days","CAP inpatient: ceftriaxone 1-2g IV q24h + azithromycin 500mg IV daily","Supportive: O2 titration, IVF, antipyretics, pain control"],
        guideline:"IDSA/ATS CAP Guidelines 2019" },
      { name:"Gastric Volvulus", urgency:"critical",
        pearl:"Borchardt triad: retching without vomiting + severe epigastric/LUQ pain + inability to pass NG tube. Rare but high mortality if not recognized.",
        labs:["CBC, CMP (metabolic alkalosis from obstruction)","Lactate — ischemia","ABG","Type and crossmatch"],
        imaging:[{mod:"AXR Upright + Supine",note:"Double air-fluid level upper abdomen, organoaxial rotation of stomach"},{mod:"CT Abdomen/Pelvis (IV contrast)",note:"Confirms type (organoaxial vs mesenteroaxial), ischemia, perforation — definitive"},{mod:"UGI water-soluble contrast",note:"If CT unavailable — confirms obstruction level"}],
        treatment:["NG tube decompression (may fail if complete obstruction)","IVF resuscitation, NPO","Emergent GI + surgery consult","Endoscopic detorsion if no ischemia (first-line if available)","Surgical detorsion ± gastropexy if endoscopy fails or ischemia present"],
        guideline:"ACG · SAGES Guidelines" },
    ]},
  RLQ:{
    label:"Right Lower Quadrant", shortLabel:"RLQ", color:T.orange,
    organs:"Appendix · Cecum · Terminal ileum · Right ovary/tube",
    diagnoses:[
      { name:"Acute Appendicitis", urgency:"urgent",
        pearl:"Alvarado ≥7 = surgical consult without delay. Periumbilical pain migrating to McBurney point + anorexia + fever. Psoas, obturator, and Rovsing signs support diagnosis.",
        labs:["CBC — WBC >10k in 80%, shift in 90%","CRP >10 mg/L (better specificity than WBC alone)","UA — sterile pyuria in 30% (don't use to exclude)","Beta-hCG in ALL women of reproductive age","Lipase if epigastric component present"],
        imaging:[{mod:"US Abdomen (first-line: pediatrics/pregnancy)",note:"Non-compressible appendix >6mm = diagnostic. Sens 75%, Spec 95%. Operator dependent"},{mod:"CT Abdomen/Pelvis (IV contrast)",note:"Standard adult imaging. Appendix >6mm + fat stranding. Sens 94%, Spec 95%"},{mod:"MRI Abdomen",note:"Pregnancy — no radiation. Comparable sensitivity/specificity to CT"}],
        treatment:["NPO + IV access + IVF","Analgesia EARLY — does NOT mask examination findings","Antibiotics (pre-op or non-operative): ceftriaxone 2g IV + metronidazole 500mg IV","Surgical consult — laparoscopic appendectomy standard of care","Uncomplicated: shared decision on antibiotics-only vs surgery (APPAC trial — ~30% require surgery in 5 years)","Perforated/gangrenous: emergent OR, broad-spectrum coverage"],
        guideline:"ACEP Clinical Policy · ACS NSQIP · EAST Guidelines" },
      { name:"Ovarian Torsion", urgency:"critical",
        pearl:"Sudden severe colicky lower abdominal/RLQ pain in reproductive-age female. Nausea/vomiting nearly universal. Normal Doppler does NOT exclude torsion — clinical suspicion drives decision.",
        labs:["Beta-hCG (exclude ectopic)","CBC, CMP","UA (exclude pyelonephritis)","Type and screen"],
        imaging:[{mod:"Transvaginal US + Doppler (FIRST)",note:"Enlarged ovary >5cm. Doppler flow may be present in up to 60% of torsion — CANNOT be used to exclude"},{mod:"CT Abdomen/Pelvis",note:"Adnexal mass, whirlpool sign of twisted pedicle if US equivocal"},{mod:"MRI Pelvis",note:"Best soft tissue resolution when diagnosis remains uncertain after CT"}],
        treatment:["OB/GYN consult IMMEDIATELY — ovarian viability is time-dependent","Analgesia: opioids + antiemetics IV","NPO — anticipate surgical intervention","Definitive: diagnostic laparoscopy + detorsion ± cystectomy","Viable-appearing ovary should be preserved even if discolored at surgery","Oophoropexy considered for recurrent or contralateral risk"],
        guideline:"ACOG Practice Bulletin · ACEP" },
      { name:"Ectopic Pregnancy", urgency:"critical",
        pearl:"Any reproductive-age woman with abdominal pain = quantitative beta-hCG until ectopic excluded. hCG >1500-2000 without IUP on TVUS = presumed ectopic.",
        labs:["Quantitative beta-hCG STAT","Type and screen/crossmatch","CBC, CMP","Rh blood type (RhoGAM)"],
        imaging:[{mod:"Transvaginal US (FIRST)",note:"IUP confirmed by gestational sac + yolk sac. No IUP + hCG >2000 = ectopic until proven otherwise. Adnexal mass, free fluid in Douglas pouch"},{mod:"Transabdominal US / POCUS",note:"Free fluid Morrison pouch and pelvis — ruptured ectopic assessment"},{mod:"Serial hCG (48h)",note:"Normal: 66% rise. Ectopic or abnormal IUP: <53% rise. Do NOT delay treatment in unstable patient"}],
        treatment:["Ruptured/unstable: emergent OR — salpingectomy","Stable + unruptured: OB/GYN consult for methotrexate vs surgical management","Methotrexate criteria: hCG <5000, no cardiac activity, tube <3.5cm, no significant free fluid","RhoGAM 300mcg IM if Rh-negative","IV × 2 + crossmatch if any hemodynamic concern — do NOT wait for serial hCG if unstable"],
        guideline:"ACOG Practice Bulletin 193 · ACEP" },
      { name:"Incarcerated Hernia", urgency:"urgent",
        pearl:"Irreducible groin/umbilical bulge + colicky pain + nausea. Femoral hernias (more common in females) have higher incarceration rate. Absent bowel sounds in strangulation.",
        labs:["CBC, CMP — metabolic acidosis if strangulated","Lactate — ischemia marker","Type and screen"],
        imaging:[{mod:"CT Abdomen/Pelvis (IV contrast)",note:"Confirms hernia contents, strangulation (absent contrast enhancement of bowel), associated SBO"},{mod:"US (groin/umbilical)",note:"Bedside evaluation + Doppler for blood flow to hernia contents"}],
        treatment:["Manual reduction (taxis) if no strangulation: analgesia + Trendelenburg position","IV sedation/analgesia to relax abdominal wall muscles","Surgical consult if: cannot reduce, signs of strangulation, recurrent","Emergency OR if strangulated (absent flow, peritonitis, systemic toxicity)","Bowel resection if ischemic contents identified at surgery"],
        guideline:"ACEP · ACS Guidelines" },
      { name:"Crohn's Disease (Flare)", urgency:"moderate",
        pearl:"RLQ pain + chronic diarrhea (may be bloody) + weight loss in young patient. Perianal fistula/fissure/abscess = pathognomonic for Crohn's disease.",
        labs:["CBC (anemia, leukocytosis)","CMP — albumin reflects nutritional/disease severity","CRP, ESR","Stool cultures + C. diff PCR (exclude infection before treating as flare)","Fecal calprotectin if available","B12, folate, iron studies"],
        imaging:[{mod:"CT Abdomen/Pelvis (IV + PO contrast)",note:"Wall thickening, mesenteric fat stranding, fistulas, abscess, stenosis — initial ED evaluation"},{mod:"MRI Enterography",note:"Preferred for ongoing monitoring — no radiation. Best for fistula/perianal disease"},{mod:"US Abdomen",note:"Bowel wall thickening — radiation-free screen in pediatric patients"}],
        treatment:["Mild flare: mesalamine or budesonide, GI outpatient follow-up","Moderate-severe: methylprednisolone 40-60mg IV daily, GI consult","Abscess: percutaneous CT-guided drainage + metronidazole + ciprofloxacin","Correct electrolytes, anemia, nutritional deficiencies","Surgical consult if obstruction, free perforation, or medically refractory"],
        guideline:"ACG Crohn's Guidelines 2018 · ECCO" },
    ]},
  PERI:{
    label:"Periumbilical / Central", shortLabel:"Central", color:T.purple,
    organs:"Small bowel · Abdominal aorta · Mesentery",
    diagnoses:[
      { name:"Mesenteric Ischemia", urgency:"critical",
        pearl:"Pain OUT OF PROPORTION to physical exam. Classic: AF or low-flow state patient. Lactate elevation is LATE — do NOT use to rule out early disease. High index of suspicion required.",
        labs:["Lactate (elevated late — poor early sensitivity; normal does NOT exclude)","CBC, CMP","Coagulation panel + D-dimer (sensitive but not specific)","ABG — metabolic acidosis is LATE finding","Type and crossmatch"],
        imaging:[{mod:"CT Angiography Abdomen/Pelvis (DEFINITIVE)",note:"Arterial + venous phase: SMA occlusion/thrombosis, mesenteric venous thrombosis, bowel wall thickening, pneumatosis intestinalis"},{mod:"Bedside POCUS",note:"Limited but may show free fluid, dilated loops — adjunct only"},{mod:"Plain AXR",note:"Thumbprinting (submucosal edema), pneumatosis — LATE findings, low sensitivity"}],
        treatment:["NPO + IV access + aggressive IVF resuscitation","Heparin UFH 80 U/kg bolus → 18 U/kg/hr for arterial or venous thrombosis","Emergent vascular surgery + IR consult — time-critical","Endovascular: catheter-directed thrombolysis or SMA embolectomy for acute occlusion","Surgery: exploratory laparotomy if peritonitis or failed endovascular","Vasopressors: norepinephrine preferred (avoid vasopressin/phenylephrine — worsen ischemia)","Broad-spectrum antibiotics if necrosis suspected: pip-tazo 4.5g IV q8h"],
        guideline:"ACEP · AHA/ACC · SVS Mesenteric Ischemia Guidelines" },
      { name:"Small Bowel Obstruction", urgency:"urgent",
        pearl:"Colicky periumbilical pain + distension + vomiting + obstipation. Prior abdominal surgery = adhesions (#1 cause). High-pitched tinkling bowel sounds early, absent late.",
        labs:["CBC (leukocytosis if strangulated)","CMP — electrolyte derangement (hypokalemia, hyponatremia)","Lactate — elevated in strangulation","Type and screen"],
        imaging:[{mod:"AXR Upright + Supine",note:"Dilated loops >3cm, air-fluid levels, step-ladder pattern, paucity of colonic gas"},{mod:"CT Abdomen/Pelvis (IV + PO contrast)",note:"Gold standard — transition point, closed-loop, strangulation signs: mesenteric edema, portal venous gas, pneumatosis"}],
        treatment:["NPO + NG tube to low intermittent suction","IV fluid resuscitation + electrolyte correction","Surgical consult for all SBO","Partial adhesive SBO: trial of non-operative management 24-48h","Gastrografin challenge: therapeutic and diagnostic in adhesive SBO (50mL PO — if no passage 24h → OR)","Urgent surgery: complete obstruction, closed-loop, strangulation, perforation"],
        guideline:"EAST SBO Guidelines · ACS" },
      { name:"Ruptured AAA", urgency:"critical",
        pearl:"Classic triad: hypotension + back/flank pain + pulsatile abdominal mass. Only 30% present with full triad. Bedside POCUS identifies aortic aneurysm in <2 minutes.",
        labs:["Type and crossmatch 6+ units pRBC — STAT","CBC, CMP, coagulation panel","Lactate","ABG"],
        imaging:[{mod:"Bedside POCUS (FIRST in unstable)",note:"Aorta >3cm = aneurysm. Free fluid = rupture. Do NOT delay OR for CT if hemodynamically unstable"},{mod:"CT Angiography Abdomen/Pelvis",note:"Stable patients: defines anatomy for EVAR vs open repair, confirms rupture and extent"}],
        treatment:["Ruptured + unstable: activate OR + vascular surgery IMMEDIATELY","Permissive hypotension: target SBP 70-90 mmHg until surgical control — aggressive fluids worsen hemorrhage","Massive transfusion protocol: pRBC:FFP:platelets 1:1:1","EVAR preferred over open repair if anatomy suitable","Avoid anticoagulation unless absolute indication"],
        guideline:"SVS AAA Guidelines 2018 · ACEP" },
      { name:"Early Appendicitis", urgency:"urgent",
        pearl:"Visceral pain begins periumbilical before migrating to RLQ over 12-24h. Anorexia and low-grade fever often precede localization. Score with Alvarado and re-examine in 2-4h.",
        labs:["CBC (WBC may be normal early)","CRP (more sensitive early than WBC)","UA","Beta-hCG (females of reproductive age)"],
        imaging:[{mod:"US Abdomen (especially pediatric/female)",note:"May be normal early — non-compressible appendix >6mm diagnostic if seen"},{mod:"CT Abdomen/Pelvis (IV contrast)",note:"Standard if US non-diagnostic or adult male — fat stranding may be subtle early"},{mod:"Serial Exam q2-4h",note:"Pain migration + rising inflammatory markers = increasing Alvarado score — reassess"}],
        treatment:["Serial abdominal exams + serial labs every 2-4h","Analgesia early — does not mask diagnosis","Surgical consult based on Alvarado score + imaging + clinical trajectory","NPO if Alvarado ≥5 or surgical candidate","Antibiotics: ceftriaxone + metronidazole if peritonitis developing"],
        guideline:"ACEP · ACS NSQIP" },
    ]},
  LLQ:{
    label:"Left Lower Quadrant", shortLabel:"LLQ", color:T.gold,
    organs:"Sigmoid colon · Descending colon · Left ovary/tube",
    diagnoses:[
      { name:"Acute Diverticulitis", urgency:"urgent",
        pearl:"LLQ pain + fever + leukocytosis in patient >40y. Uncomplicated: no abscess/perforation/fistula. Complicated Hinchey III/IV = emergent surgery.",
        labs:["CBC (leukocytosis)","CMP","CRP","UA — pneumaturia/fecaluria = colovesical fistula","Blood cultures × 2 if septic"],
        imaging:[{mod:"CT Abdomen/Pelvis (IV + PO contrast)",note:"Gold standard — diverticula, pericolic fat stranding, wall thickening, abscess, fistula, free air. Sensitivity 97%"},{mod:"US Abdomen",note:"Pregnancy or radiation concern — sensitivity 84%, less reliable for complications"}],
        treatment:["Uncomplicated (Hinchey I): outpatient — ciprofloxacin 500mg BID + metronidazole 500mg TID × 7-10d OR amoxicillin-clavulanate","Admission criteria: intractable pain, high fever, immunocompromised, unable to tolerate PO","Inpatient: piperacillin-tazobactam 4.5g IV q8h OR ceftriaxone + metronidazole","Hinchey II abscess >4cm: CT-guided percutaneous drainage + antibiotics","Hinchey III/IV (free perforation): emergent surgery — Hartmann procedure","Follow-up colonoscopy 6-8 weeks post-resolution to exclude malignancy"],
        guideline:"ACG Diverticulitis Guidelines 2021 · ASCRS · ACEP" },
      { name:"Sigmoid Volvulus", urgency:"urgent",
        pearl:"Older male, nursing home resident, chronic constipation. Massive abdominal distension + obstipation. Coffee-bean sign on AXR pointing toward RUQ.",
        labs:["CBC, CMP (electrolyte derangement)","Lactate (if ischemia suspected)","Type and screen"],
        imaging:[{mod:"AXR Upright + Supine (FIRST)",note:"Massively dilated sigmoid — coffee bean or omega loop pointing to RUQ. Present 60-75%"},{mod:"CT Abdomen/Pelvis",note:"Whirlpool sign of mesenteric twist, transition point — confirms diagnosis and rules out ischemia"}],
        treatment:["No peritonitis/ischemia: rigid or flexible sigmoidoscopy + rectal tube decompression (85-95% success)","Surgical consult for all volvulus — 60% recurrence without definitive repair","Elective sigmoid colectomy after decompression (definitive)","Emergent laparotomy if: failed endoscopy, peritonitis, perforation, ischemia"],
        guideline:"ACEP · ASCRS Colon Volvulus Guidelines" },
      { name:"Ischemic Colitis", urgency:"urgent",
        pearl:"Crampy LLQ pain + hematochezia in older patient post-hypotensive episode, aortic surgery, or vasopressor use. Splenic flexure and sigmoid watershed zones most vulnerable.",
        labs:["CBC (anemia, leukocytosis)","CMP + LFTs","Lactate (transmural ischemia = elevated)","CRP, ESR","Coagulation panel","Blood cultures if septic"],
        imaging:[{mod:"CT Abdomen/Pelvis (IV contrast)",note:"Segmental colonic wall thickening, fat stranding, submucosal edema. Pneumatosis = transmural ischemia"},{mod:"AXR",note:"Thumbprinting (submucosal edema) — non-specific supportive finding"},{mod:"Colonoscopy",note:"Definitive — within 48h when stable. Pale/cyanotic mucosa, hemorrhage, skip lesions at watershed zones"}],
        treatment:["NPO + IVF resuscitation + bowel rest","Broad-spectrum antibiotics: ciprofloxacin + metronidazole (reduces bacterial translocation)","Discontinue vasoconstrictive medications if possible","Surgical consult for all cases","Mild-moderate: resolves with supportive care in 24-48h in majority","Surgery if: peritonitis, perforation, full-thickness ischemia, clinical deterioration"],
        guideline:"ACG Ischemic Colitis Guidelines 2015 · ACEP" },
      { name:"IBD / Ulcerative Colitis Flare", urgency:"moderate",
        pearl:"Rectal bleeding + diarrhea + LLQ cramping in known UC. Toxic megacolon: colon >6cm on AXR + systemic toxicity = DO NOT scope — surgical emergency.",
        labs:["CBC (anemia, leukocytosis)","CMP — hypoalbuminemia = severe disease","CRP, ESR","Stool cultures + C. diff PCR (exclude before treating as IBD flare)","Fecal calprotectin"],
        imaging:[{mod:"AXR Upright (FIRST in acute)",note:"Colon diameter — toxic megacolon if transverse colon >6cm. Mucosal islands, haustra loss"},{mod:"CT Abdomen/Pelvis",note:"Wall thickening extent, complications (perforation, abscess). Avoid colonoscopy if toxic megacolon"}],
        treatment:["Mild-moderate outpatient: mesalamine (5-ASA) enemas or PO per GI protocol","Moderate-severe inpatient: methylprednisolone 40-60mg IV daily × 3-5 days","IV cyclosporine or infliximab if IV steroids fail (IBD team decision)","Toxic megacolon: NPO, NG tube, IV steroids, GI + surgery co-management (subtotal colectomy if no improvement 48-72h)","C. diff co-infection: vancomycin 125mg PO QID × 10 days (do NOT use metronidazole)"],
        guideline:"ACG UC Guidelines 2019 · ECCO · AGA" },
    ]},
  SUPRA:{
    label:"Suprapubic / Pelvic", shortLabel:"Supra.", color:"#3dffa0",
    organs:"Bladder · Uterus · Rectum · Prostate",
    diagnoses:[
      { name:"Pelvic Inflammatory Disease", urgency:"urgent",
        pearl:"Sexually active female + lower abdominal pain + cervical motion tenderness + adnexal tenderness. Chandelier sign = CMT. Normal US does NOT exclude PID.",
        labs:["GC/Chlamydia NAAT (cervical or vaginal swab — most sensitive)","Wet prep (BV, trichomonas)","Beta-hCG (exclude ectopic)","CBC (leukocytosis in severe PID / TOA)","UA","Blood cultures × 2 if TOA or septic"],
        imaging:[{mod:"Transvaginal US (FIRST)",note:"TOA: thick-walled complex adnexal mass. Normal US does NOT exclude PID — clinical diagnosis"},{mod:"CT Pelvis (IV contrast)",note:"TOA >3cm, multiloculated fluid, free pelvic fluid — guides drainage planning"},{mod:"MRI Pelvis",note:"Best soft tissue resolution for TOA characterization if CT equivocal"}],
        treatment:["Outpatient (mild-moderate): ceftriaxone 500mg IM × 1 + doxycycline 100mg PO BID × 14d + metronidazole 500mg BID × 14d","Inpatient: cefoxitin 2g IV q6h + doxycycline 100mg PO/IV q12h","Alt inpatient: clindamycin 900mg IV q8h + gentamicin 5mg/kg IV q24h","TOA >3cm: CT-guided or laparoscopic drainage","Admission: TOA, surgical emergency cannot exclude, severe illness, pregnancy, failed outpatient","Treat partner(s) for STI"],
        guideline:"CDC STI Treatment Guidelines 2021 · ACOG" },
      { name:"UTI / Pyelonephritis", urgency:"moderate",
        pearl:"Suprapubic pain + dysuria + frequency = cystitis. Add CVA tenderness + fever + rigors = pyelonephritis. Urosepsis: pyelonephritis + hemodynamic instability.",
        labs:["UA with microscopy (pyuria, bacteriuria, nitrites, leukocyte esterase)","Urine culture + sensitivity (before antibiotics)","CBC — leukocytosis in pyelonephritis","CMP — BUN/Cr baseline","Blood cultures × 2 if septic/toxic appearing"],
        imaging:[{mod:"CT Abdomen/Pelvis without contrast (FIRST for stones)",note:"Urolithiasis, emphysematous pyelonephritis, perinephric abscess, hydronephrosis — if complicated or urosepsis"},{mod:"US Kidneys/Bladder",note:"Hydronephrosis, renal abscess, bladder pathology — preferred in pregnancy"}],
        treatment:["Uncomplicated cystitis (female): nitrofurantoin 100mg ER BID × 5d OR TMP-SMX DS BID × 3d","Cystitis (male): treat as complicated — ciprofloxacin 500mg BID × 7d","Outpatient pyelonephritis: ciprofloxacin 500mg BID × 7d OR levofloxacin 750mg daily × 5d","Inpatient pyelonephritis: ceftriaxone 1-2g IV q24h","Urosepsis: piperacillin-tazobactam 4.5g IV q8h ± aminoglycoside","Emphysematous pyelonephritis: emergent urology + percutaneous drainage"],
        guideline:"IDSA UTI Guidelines · ACEP · AUA" },
      { name:"Ruptured Ovarian Cyst", urgency:"moderate",
        pearl:"Sudden pelvic pain in reproductive-age female, often mid-cycle. Hemorrhagic cysts most symptomatic. Must exclude ectopic and ovarian torsion.",
        labs:["Beta-hCG (exclude ectopic)","CBC (Hgb if hemorrhagic)","Type and screen","UA"],
        imaging:[{mod:"Transvaginal US + Doppler (FIRST)",note:"Complex adnexal mass, free echogenic pelvic fluid (blood), assess ovarian blood flow for torsion"},{mod:"CT Pelvis (IV contrast)",note:"If US equivocal, hemodynamic concern, or torsion/ectopic cannot be excluded"}],
        treatment:["Stable + minimal fluid: analgesia (NSAIDs first-line) + observation 4-6h","NSAIDs: ibuprofen 400-600mg PO q6h + ondansetron 4mg","Opioid analgesia if severe: hydromorphone 0.5mg IV","Significant hemoperitoneum + unstable: OB/GYN consult, IV × 2, type and crossmatch","Surgery (laparoscopy): hemodynamically unstable, ongoing hemorrhage, suspected malignancy","Functional cysts: typically self-resolving in 4-8 weeks"],
        guideline:"ACOG Practice Bulletin · ACEP" },
      { name:"Acute Urinary Retention", urgency:"urgent",
        pearl:"Inability to void + suprapubic fullness/pain. BPH #1 cause in males. Palpable bladder above pubis. Bedside US confirms: volume >400mL = retention.",
        labs:["UA + culture","BMP — BUN/Cr (post-obstructive nephropathy)","CBC","PSA (males, if appropriate)"],
        imaging:[{mod:"Bedside Bladder US (FIRST — rapid)",note:"Volume >300-400mL confirms retention — immediate, non-invasive"},{mod:"Renal US",note:"Hydronephrosis from chronic retention or upstream obstruction"},{mod:"CT Abdomen/Pelvis (IV contrast)",note:"If urolithiasis or malignancy suspected as precipitant"}],
        treatment:["Urethral catheterization (14-16Fr Foley) — immediate decompression","Suprapubic catheter if urethral catheterization fails — urology consult","Post-obstructive diuresis: monitor UO, replace 50% of output hourly if >200 mL/hr","BPH: tamsulosin 0.4mg PO daily (facilitates void trial in 24-48h)","Urology referral: recurrent retention, elevated Cr, hydronephrosis on imaging"],
        guideline:"AUA BPH Guidelines 2021 · ACEP" },
    ]},
  DIFF:{
    label:"Diffuse / Generalized", shortLabel:"Diffuse", color:T.coral,
    organs:"Whole abdomen · Systemic causes",
    diagnoses:[
      { name:"Peritonitis / Perforated Viscus", urgency:"critical",
        pearl:"Rigid board-like abdomen with involuntary guarding = peritonitis until proven otherwise. Any significant abdominal tenderness + hemodynamic instability = emergent surgical evaluation.",
        labs:["CBC (leukocytosis)","CMP + LFTs","Lactate (septic source)","Blood cultures × 2","Coagulation panel","Type and crossmatch"],
        imaging:[{mod:"Upright CXR (FIRST — rapid)",note:"Free air under diaphragm in 70% of GI perforations"},{mod:"CT Abdomen/Pelvis (PO + IV contrast)",note:"Pneumoperitoneum, extraluminal air, free fluid, abscess, perforation site"},{mod:"Bedside POCUS",note:"Free fluid, pneumoperitoneum detection if CT delayed"}],
        treatment:["NPO + NG tube to suction","Large-bore IV × 2, aggressive IVF resuscitation","Broad-spectrum antibiotics STAT: piperacillin-tazobactam 4.5g IV q8h","Emergent surgical consult — OR within 1-2h","Vasopressors (norepinephrine) if septic shock","ICU admission"],
        guideline:"EAST · ACEP · WSES Guidelines" },
      { name:"DKA with Abdominal Pain", urgency:"urgent",
        pearl:"Up to 50% of DKA presents with diffuse abdominal pain (pseudo-abdomen from acidosis). Pain resolves with DKA treatment. Persistent pain after correction = surgical pathology.",
        labs:["POC glucose STAT","BMP — anion gap, bicarb, Cr (elevated K+ initially despite total body deficit)","Beta-hydroxybutyrate OR urine ketones","VBG/ABG — pH, pCO2","CBC, LFTs, lipase","Beta-hCG if female"],
        imaging:[{mod:"CT Abdomen (ONLY if pain persists after DKA correction)",note:"Pancreatitis, SMA syndrome, or true surgical abdomen — not indicated initially"},{mod:"AXR",note:"Initial screen for free air or obstruction if surgical pathology suspected"}],
        treatment:["IVF: NS 1L bolus → 500 mL/hr × 2h, then 1/2NS + 20mEq KCl/L","Insulin: 0.1 U/kg/hr regular insulin infusion (hold until K+ ≥3.5)","Potassium: K+ <3.5 = hold insulin, aggressive replacement first","Add D5 when glucose <200 mg/dL","Bicarb: only if pH <6.9 (20-40mEq IV over 2h)","Monitor glucose, K+, AG, pH q1-2h","Endocrinology/medicine consult"],
        guideline:"ADA DKA Management Guidelines 2022 · ACEP" },
      { name:"Bowel Obstruction (LBO)", urgency:"urgent",
        pearl:"Large bowel: distension > vomiting (contrast to SBO). Colon cancer #1 adult cause. Cecal diameter >12cm = impending perforation — emergent decompression.",
        labs:["CBC, CMP (electrolytes)","Lactate (ischemia)","CEA if malignancy suspected","Type and screen"],
        imaging:[{mod:"AXR Upright + Supine (FIRST)",note:"Dilated colon >6cm with haustral markings, cecal diameter most critical"},{mod:"CT Abdomen/Pelvis (IV + rectal contrast)",note:"Transition point, etiology (tumor, volvulus, hernia), ischemia, perforation"}],
        treatment:["NPO + NG tube + IV access + IVF","Surgical consult for all LBO","Ogilvie syndrome (pseudo-obstruction): neostigmine 2mg IV (have atropine ready), colonoscopic decompression","Cecal >12cm or peritonitis: emergent surgery","Malignant obstruction: colonic stent (bridge to surgery) or diverting colostomy"],
        guideline:"ACEP · ASCRS · EAST" },
      { name:"Gastroenteritis / Food Poisoning", urgency:"moderate",
        pearl:"Diffuse crampy pain + N/V/D. Group exposure suggests food poisoning. Diarrhea >7 days, bloody stool, or immunocompromised = culture and full workup.",
        labs:["BMP (electrolytes, BUN/Cr — dehydration severity)","CBC","Stool cultures + ova/parasites if prolonged/bloody","C. diff PCR if antibiotic exposure or healthcare contact"],
        imaging:[{mod:"CT Abdomen/Pelvis",note:"Only if severe localized pain or surgical pathology suspected — NOT routine"},{mod:"AXR",note:"Only if obstruction or toxic megacolon suspected"}],
        treatment:["Oral rehydration: primary treatment if tolerating PO","IV: NS or LR 1-2L bolus if dehydrated","Antiemetics: ondansetron 4-8mg IV/ODT, prochlorperazine 10mg IV","Antidiarrheal: loperamide 4mg PO (avoid if bloody diarrhea or suspected C. diff)","Most viral: no antibiotics needed","Bacterial severe/immunocompromised: ciprofloxacin 500mg BID × 3-5 days","C. diff: vancomycin 125mg PO QID × 10 days"],
        guideline:"IDSA Enteric Infection Guidelines · ACEP" },
    ]},
};

// ── Shared UI components ─────────────────────────────────────────────────────
function Pill({ text, color }) {
  return (
    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
      letterSpacing:1.5, fontWeight:700,
      padding:"2px 7px", borderRadius:4,
      background:`${color}20`, color,
      border:`1px solid ${color}44` }}>
      {text}
    </span>
  );
}

function SectionBox({ title, color, children }) {
  return (
    <div style={{ marginBottom:10, borderRadius:10,
      background:`${color}07`,
      border:`1px solid ${color}25`,
      borderLeft:`3px solid ${color}` }}>
      <div style={{ padding:"7px 12px",
        borderBottom:`1px solid ${color}18`,
        fontFamily:"'JetBrains Mono',monospace",
        fontSize:8, color, letterSpacing:1.8, textTransform:"uppercase" }}>
        {title}
      </div>
      <div style={{ padding:"10px 12px" }}>{children}</div>
    </div>
  );
}

function BulletRow({ text, color }) {
  return (
    <div style={{ display:"flex", gap:8, alignItems:"flex-start", marginBottom:6 }}>
      <span style={{ color:color||T.teal, fontSize:8, marginTop:4, flexShrink:0 }}>▸</span>
      <span style={{ fontFamily:"'DM Sans',sans-serif",
        fontSize:12, color:T.txt2, lineHeight:1.6 }}>{text}</span>
    </div>
  );
}

function BackBar({ label, onClick }) {
  return (
    <button onClick={onClick}
      style={{ display:"flex", alignItems:"center", gap:8,
        width:"100%", padding:"9px 14px", marginBottom:14,
        border:"1px solid rgba(26,53,85,0.6)",
        borderRadius:9, cursor:"pointer",
        background:"rgba(8,20,38,0.7)",
        fontFamily:"'DM Sans',sans-serif", fontSize:12,
        fontWeight:600, color:T.txt3 }}>
      <span style={{ fontSize:14, color:T.teal }}>←</span>
      {label}
    </button>
  );
}

// ── View 1: Interactive Abdomen Map ──────────────────────────────────────────
const ZONE_LAYOUT = [
  { key:"RUQ",  row:0, col:0 },
  { key:"EPIG", row:0, col:1 },
  { key:"LUQ",  row:0, col:2 },
  { key:"RLQ",  row:1, col:0 },
  { key:"PERI", row:1, col:1 },
  { key:"LLQ",  row:1, col:2 },
  { key:"SUPRA",row:2, col:1 },
  { key:"DIFF", row:3, col:0, span:3 },
];

function AbdomenMap({ onZoneSelect }) {
  const [hovered, setHovered] = useState(null);

  return (
    <div className="abd-in">
      {/* Header */}
      <div style={{ textAlign:"center", marginBottom:18 }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:8,
          padding:"4px 14px", borderRadius:20, marginBottom:10,
          background:"rgba(8,20,38,0.8)",
          border:"1px solid rgba(26,53,85,0.6)" }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace",
            fontSize:9, color:T.teal, letterSpacing:3 }}>NOTRYA</span>
          <span style={{ color:T.txt4, fontSize:9 }}>/</span>
          <span style={{ fontFamily:"'JetBrains Mono',monospace",
            fontSize:9, color:T.txt3, letterSpacing:2 }}>ABD PAIN</span>
        </div>
        <h1 style={{ fontFamily:"'Playfair Display',serif",
          fontWeight:900, fontSize:"clamp(22px,4vw,34px)",
          color:T.txt, letterSpacing:-0.5, margin:"0 0 6px" }}>
          Abdominal Pain Hub
        </h1>
        <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
          color:T.txt4, margin:0 }}>
          Tap the zone of pain → differential diagnosis → workup + treatment
        </p>
      </div>

      {/* Body diagram */}
      <div style={{ maxWidth:480, margin:"0 auto" }}>
        {/* SVG torso outline */}
        <svg viewBox="0 0 300 60" style={{ width:"100%", marginBottom:-2 }}>
          <path d="M90,58 Q90,10 100,4 Q130,-2 150,2 Q170,-2 200,4 Q210,10 210,58"
            fill="rgba(8,20,38,0.6)" stroke="rgba(26,53,85,0.5)" strokeWidth="1"/>
          {/* Rib cage lines */}
          <path d="M105,20 Q125,14 150,16 Q175,14 195,20" fill="none" stroke="rgba(42,79,122,0.35)" strokeWidth="0.8"/>
          <path d="M102,32 Q125,25 150,27 Q175,25 198,32" fill="none" stroke="rgba(42,79,122,0.25)" strokeWidth="0.8"/>
        </svg>

        {/* Zone grid */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:5 }}>
          {ZONE_LAYOUT.filter(z => z.row < 2).map(z => {
            const zone = ZONES[z.key];
            const isHov = hovered === z.key;
            return (
              <button key={z.key}
                className="zone-btn"
                onClick={() => onZoneSelect(z.key)}
                onMouseEnter={() => setHovered(z.key)}
                onMouseLeave={() => setHovered(null)}
                style={{ padding:"14px 8px", borderRadius:10, border:"none",
                  background:isHov ? `${zone.color}22` : "rgba(8,20,38,0.75)",
                  border:`1px solid ${isHov ? zone.color+"60" : "rgba(26,53,85,0.6)"}`,
                  textAlign:"center", minHeight:88 }}>
                <div style={{ fontSize:20, marginBottom:5 }}>
                  {z.key==="RUQ"?"🫀":z.key==="EPIG"?"⚡":z.key==="LUQ"?"🫁":
                   z.key==="RLQ"?"🔴":z.key==="PERI"?"⭕":"🟡"}
                </div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:10, fontWeight:700, color:zone.color,
                  marginBottom:3 }}>{zone.shortLabel}</div>
                <div style={{ fontFamily:"'DM Sans',sans-serif",
                  fontSize:9.5, color:T.txt4, lineHeight:1.4 }}>
                  {zone.organs.split(" · ").slice(0,2).join(" · ")}
                </div>
              </button>
            );
          })}
        </div>

        {/* Supra row */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 2fr 1fr", gap:5, marginTop:5 }}>
          <div style={{ background:"rgba(5,15,30,0.4)", borderRadius:10,
            border:"1px solid rgba(26,53,85,0.3)" }}/>
          {(() => {
            const zone = ZONES.SUPRA;
            const isHov = hovered === "SUPRA";
            return (
              <button className="zone-btn"
                onClick={() => onZoneSelect("SUPRA")}
                onMouseEnter={() => setHovered("SUPRA")}
                onMouseLeave={() => setHovered(null)}
                style={{ padding:"12px 8px", borderRadius:10, border:"none",
                  background:isHov ? `${zone.color}22` : "rgba(8,20,38,0.75)",
                  border:`1px solid ${isHov ? zone.color+"60" : "rgba(26,53,85,0.6)"}`,
                  textAlign:"center" }}>
                <div style={{ fontSize:18, marginBottom:4 }}>💚</div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:10, fontWeight:700, color:zone.color,
                  marginBottom:2 }}>{zone.shortLabel}</div>
                <div style={{ fontFamily:"'DM Sans',sans-serif",
                  fontSize:9.5, color:T.txt4 }}>Bladder · Uterus</div>
              </button>
            );
          })()}
          <div style={{ background:"rgba(5,15,30,0.4)", borderRadius:10,
            border:"1px solid rgba(26,53,85,0.3)" }}/>
        </div>

        {/* SVG pelvic outline */}
        <svg viewBox="0 0 300 40" style={{ width:"100%", marginTop:-2 }}>
          <path d="M90,0 Q95,30 130,38 Q150,42 170,38 Q205,30 210,0"
            fill="rgba(8,20,38,0.6)" stroke="rgba(26,53,85,0.4)" strokeWidth="1"/>
        </svg>

        {/* Diffuse button */}
        {(() => {
          const zone = ZONES.DIFF;
          const isHov = hovered === "DIFF";
          return (
            <button className="zone-btn"
              onClick={() => onZoneSelect("DIFF")}
              onMouseEnter={() => setHovered("DIFF")}
              onMouseLeave={() => setHovered(null)}
              style={{ width:"100%", marginTop:8, padding:"12px",
                borderRadius:10, border:"none", textAlign:"center",
                background:isHov ? `${zone.color}18` : "rgba(8,20,38,0.7)",
                border:`1px solid ${isHov ? zone.color+"55" : "rgba(255,107,107,0.25)"}` }}>
              <div style={{ display:"flex", alignItems:"center",
                justifyContent:"center", gap:10 }}>
                <span style={{ fontSize:18 }}>⚠️</span>
                <div>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace",
                    fontSize:10, fontWeight:700, color:zone.color,
                    marginBottom:2 }}>DIFFUSE / GENERALIZED</div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif",
                    fontSize:10, color:T.txt4 }}>Peritonitis · DKA · Mesenteric Ischemia · Obstruction · Gastroenteritis</div>
                </div>
              </div>
            </button>
          );
        })()}
      </div>

      {/* Legend */}
      <div style={{ display:"flex", justifyContent:"center", gap:16,
        marginTop:20, flexWrap:"wrap" }}>
        {Object.entries(URGENCY).map(([k, u]) => (
          <div key={k} style={{ display:"flex", alignItems:"center", gap:5 }}>
            <div style={{ width:8, height:8, borderRadius:2,
              background:u.color }}/>
            <span style={{ fontFamily:"'DM Sans',sans-serif",
              fontSize:10, color:T.txt4 }}>{u.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── View 2: Zone Differential List ───────────────────────────────────────────
function ZoneView({ zoneKey, onBack, onSelect }) {
  const zone = ZONES[zoneKey];

  return (
    <div className="abd-in">
      <BackBar label="← Back to Abdomen Map" onClick={onBack} />

      <div style={{ marginBottom:16 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
          <div style={{ width:4, height:32, borderRadius:2,
            background:zone.color }}/>
          <div>
            <h2 style={{ fontFamily:"'Playfair Display',serif",
              fontWeight:900, fontSize:22, color:zone.color, margin:0 }}>
              {zone.label}
            </h2>
            <div style={{ fontFamily:"'JetBrains Mono',monospace",
              fontSize:9, color:T.txt4, letterSpacing:1, marginTop:2 }}>
              {zone.organs}
            </div>
          </div>
        </div>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
          color:T.txt3 }}>
          {zone.diagnoses.length} diagnoses · Tap a diagnosis for workup + treatment
        </div>
      </div>

      {zone.diagnoses.map((dx, i) => {
        const urg = URGENCY[dx.urgency];
        return (
          <button key={i}
            className="dx-row"
            onClick={() => onSelect(i)}
            style={{ display:"block", width:"100%", padding:"12px 14px",
              borderRadius:10, marginBottom:7, cursor:"pointer",
              textAlign:"left", border:"none",
              background:"rgba(8,20,38,0.7)",
              border:`1px solid rgba(26,53,85,0.7)`,
              borderLeft:`4px solid ${urg.color}` }}>
            <div style={{ display:"flex", alignItems:"flex-start",
              justifyContent:"space-between", gap:8, marginBottom:6 }}>
              <span style={{ fontFamily:"'Playfair Display',serif",
                fontWeight:700, fontSize:15, color:T.txt }}>
                {dx.name}
              </span>
              <Pill text={urg.label} color={urg.color} />
            </div>
            <div style={{ fontFamily:"'DM Sans',sans-serif",
              fontSize:11, color:T.txt3, lineHeight:1.55 }}>
              {dx.pearl}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ── View 3: Diagnosis Detail (Workup + Treatment) ────────────────────────────
function DxView({ zoneKey, dxIndex, onBack }) {
  const zone = ZONES[zoneKey];
  const dx = zone.diagnoses[dxIndex];
  const urg = URGENCY[dx.urgency];
  const [activeTab, setActiveTab] = useState("labs");

  const tabs = [
    { id:"labs",      label:"Labs",    icon:"🧪", count:dx.labs.length },
    { id:"imaging",   label:"Imaging", icon:"🔬", count:dx.imaging.length },
    { id:"treatment", label:"Treat",   icon:"💊", count:dx.treatment.length },
  ];

  return (
    <div className="abd-in">
      <BackBar label={`← ${zone.label} Differentials`} onClick={onBack} />

      {/* Dx header */}
      <div style={{ padding:"14px", marginBottom:12, borderRadius:12,
        background:`${urg.color}08`,
        border:`1px solid ${urg.color}30`,
        borderLeft:`4px solid ${urg.color}` }}>
        <div style={{ display:"flex", alignItems:"center",
          justifyContent:"space-between", marginBottom:8 }}>
          <Pill text={urg.label} color={urg.color} />
          <span style={{ fontFamily:"'JetBrains Mono',monospace",
            fontSize:8, color:T.txt4, letterSpacing:1 }}>
            {dx.guideline}
          </span>
        </div>
        <h2 style={{ fontFamily:"'Playfair Display',serif",
          fontWeight:900, fontSize:20, color:T.txt, margin:"0 0 8px" }}>
          {dx.name}
        </h2>
        <div style={{ fontFamily:"'DM Sans',sans-serif",
          fontSize:11.5, color:T.txt2, lineHeight:1.6,
          padding:"8px 10px", borderRadius:8,
          background:"rgba(8,20,38,0.5)",
          border:"1px solid rgba(26,53,85,0.5)" }}>
          <span style={{ color:T.teal, fontWeight:700 }}>Pearl: </span>
          {dx.pearl}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display:"flex", gap:5, marginBottom:12,
        padding:"5px", borderRadius:10,
        background:"rgba(8,20,38,0.8)",
        border:"1px solid rgba(26,53,85,0.5)" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{ flex:1, padding:"8px 4px", borderRadius:8,
              cursor:"pointer", border:"none",
              fontFamily:"'DM Sans',sans-serif",
              fontWeight:600, fontSize:12, transition:"all .12s",
              background:activeTab===t.id
                ? `${zone.color}18`
                : "transparent",
              border:`1px solid ${activeTab===t.id ? zone.color+"55" : "transparent"}`,
              color:activeTab===t.id ? zone.color : T.txt4 }}>
            <div>{t.icon} {t.label}</div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace",
              fontSize:9, marginTop:2,
              color:activeTab===t.id ? zone.color : T.txt4 }}>
              {t.count} items
            </div>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "labs" && (
        <SectionBox title="Laboratory Workup" color={T.purple}>
          {dx.labs.map((l, i) => <BulletRow key={i} text={l} color={T.purple} />)}
        </SectionBox>
      )}

      {activeTab === "imaging" && (
        <SectionBox title="Imaging — Ordered by Priority" color={T.blue}>
          {dx.imaging.map((img, i) => (
            <div key={i} style={{ padding:"9px 11px", borderRadius:8,
              marginBottom:7,
              background:i===0 ? "rgba(74,144,217,0.1)" : "rgba(8,20,38,0.5)",
              border:`1px solid ${i===0 ? T.blue+"44" : "rgba(26,53,85,0.5)"}` }}>
              <div style={{ display:"flex", alignItems:"center",
                gap:8, marginBottom:4 }}>
                {i===0 && (
                  <span style={{ fontFamily:"'JetBrains Mono',monospace",
                    fontSize:8, padding:"2px 6px", borderRadius:3,
                    background:`${T.teal}20`, color:T.teal,
                    letterSpacing:1 }}>FIRST</span>
                )}
                <span style={{ fontFamily:"'DM Sans',sans-serif",
                  fontWeight:700, fontSize:12, color:T.blue }}>
                  {img.mod}
                </span>
              </div>
              <div style={{ fontFamily:"'DM Sans',sans-serif",
                fontSize:11, color:T.txt3, lineHeight:1.55 }}>
                {img.note}
              </div>
            </div>
          ))}
        </SectionBox>
      )}

      {activeTab === "treatment" && (
        <SectionBox title="ED Treatment Protocol" color={T.coral}>
          {dx.treatment.map((t, i) => (
            <div key={i} style={{ display:"flex", gap:10,
              alignItems:"flex-start", marginBottom:7,
              padding:"7px 10px", borderRadius:8,
              background:"rgba(8,20,38,0.5)",
              border:"1px solid rgba(26,53,85,0.4)" }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace",
                fontSize:10, fontWeight:700, color:T.coral,
                flexShrink:0, minWidth:18 }}>{i+1}.</span>
              <span style={{ fontFamily:"'DM Sans',sans-serif",
                fontSize:12, color:T.txt2, lineHeight:1.6 }}>{t}</span>
            </div>
          ))}
        </SectionBox>
      )}

      {/* Guideline footer */}
      <div style={{ textAlign:"center", padding:"12px 0",
        fontFamily:"'JetBrains Mono',monospace",
        fontSize:8, color:T.txt4, letterSpacing:1.2 }}>
        {dx.guideline} · CLINICAL DECISION SUPPORT ONLY
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function AbdominalPainHub({ embedded = false, onBack }) {
  const [view,     setView]     = useState("map");
  const [selZone,  setSelZone]  = useState(null);
  const [selDx,    setSelDx]    = useState(null);

  const handleBack = useCallback(() => {
    if (onBack) onBack();
    else window.history.back();
  }, [onBack]);

  const selectZone = useCallback(k => {
    setSelZone(k);
    setView("zone");
  }, []);

  const selectDx = useCallback(i => {
    setSelDx(i);
    setView("dx");
  }, []);

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif",
      background:embedded ? "transparent" : T.bg,
      minHeight:embedded ? "auto" : "100vh",
      color:T.txt }}>
      <div style={{ maxWidth:640, margin:"0 auto",
        padding:embedded ? "0" : "16px 14px 40px" }}>

        {!embedded && view === "map" && (
          <button onClick={handleBack}
            style={{ marginBottom:12, display:"inline-flex",
              alignItems:"center", gap:6,
              fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600,
              padding:"5px 13px", borderRadius:8, cursor:"pointer",
              background:"rgba(8,20,38,0.8)",
              border:"1px solid rgba(26,53,85,0.5)",
              color:T.txt3 }}>
            ← Back to Hub
          </button>
        )}

        {view === "map" && (
          <AbdomenMap onZoneSelect={selectZone} />
        )}
        {view === "zone" && selZone && (
          <ZoneView
            zoneKey={selZone}
            onBack={() => setView("map")}
            onSelect={selectDx}
          />
        )}
        {view === "dx" && selZone && selDx !== null && (
          <DxView
            zoneKey={selZone}
            dxIndex={selDx}
            onBack={() => setView("zone")}
          />
        )}
      </div>
    </div>
  );
}