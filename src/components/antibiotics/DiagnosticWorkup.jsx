import React, { useState } from "react";

const T = {
  navy:"#050f1e", panel:"#0d2240", edge:"#162d4f",
  border:"#1e3a5f", muted:"#2a4d72", dim:"#4a7299", text:"#c8ddf0",
  bright:"#e8f4ff", teal:"#00d4bc", teal2:"#00a896", amber:"#f5a623",
  red:"#ff5c6c", green:"#2ecc71", purple:"#9b6dff", blue:"#4a90d9",
};

// ── Per-infection diagnostic & differential data ──────────────────────────
const WORKUP = {
  cap: {
    diagnostics: [
      { test:"Chest X-Ray (PA & Lateral)", priority:"urgent", rationale:"Confirm infiltrate, rule out pleural effusion, lung abscess. Baseline for follow-up." },
      { test:"CBC with differential", priority:"routine", rationale:"Leukocytosis supports bacterial etiology. Leukopenia in severe/overwhelming infection." },
      { test:"BMP / CMP", priority:"routine", rationale:"BUN/Cr for PSI/CURB-65 scoring. Electrolytes, LFTs for drug selection." },
      { test:"Blood cultures ×2 sets", priority:"inpatient", rationale:"Yield ~10–16% for bacteremia in CAP. Required before antibiotics in inpatient setting." },
      { test:"Sputum Gram stain & culture", priority:"inpatient", rationale:"Yield low (40–60%) but can confirm organism and guide de-escalation." },
      { test:"Legionella urinary antigen", priority:"severe", rationale:"Rapid (1h), sensitive for L. pneumophila serogroup 1. Test all moderate-severe CAP." },
      { test:"Pneumococcal urinary antigen", priority:"inpatient", rationale:"Sensitivity ~70%, specificity ~97%. Persists days after antibiotics. Test all inpatient CAP." },
      { test:"Procalcitonin", priority:"routine", rationale:"≥0.25 ng/mL supports bacterial etiology. Useful for antibiotic duration guidance." },
      { test:"Respiratory viral panel (PCR)", priority:"routine", rationale:"Influenza/RSV/SARS-CoV-2 co-infection common — affects treatment and isolation." },
      { test:"HIV test (if not known)", priority:"consider", rationale:"PCP pneumonia if HIV+ and CD4 <200. High clinical impact if positive." },
    ],
    differentials: [
      { dx:"Community-Acquired Pneumonia (bacterial)", confidence:85, icd:"J18.9", notes:"S. pneumoniae most common. CURB-65/PSI to risk-stratify." },
      { dx:"Atypical Pneumonia (Mycoplasma/Legionella)", confidence:60, icd:"J22", notes:"Subacute onset, dry cough, headache. Legionella: GI symptoms, hyponatremia." },
      { dx:"Viral Pneumonia (influenza/COVID)", confidence:50, icd:"J11.1", notes:"Test for influenza if fever + respiratory in season. Diffuse bilateral infiltrates." },
      { dx:"Pulmonary Embolism", confidence:30, icd:"I26.99", notes:"Pleuritic chest pain, tachycardia. Wedge-shaped infarct on CT. D-dimer if low-moderate pre-test probability." },
      { dx:"CHF Exacerbation", confidence:25, icd:"I50.9", notes:"Bilateral infiltrates, orthopnea, elevated BNP, central/perihilar pattern." },
      { dx:"Lung Abscess / Necrotizing Pneumonia", confidence:15, icd:"J85.1", notes:"Cavity on CXR, foul-smelling sputum, predisposing factor (aspiration, MRSA)." },
    ],
    patientModifiers: {
      renalImpairment: "Avoid aminoglycosides. Adjust ciprofloxacin/levofloxacin. Consider increased pneumonia severity scoring.",
      pcnAllergy: "Use respiratory fluoroquinolone monotherapy (levofloxacin/moxifloxacin). Azithromycin if mild outpatient.",
      fqAllergy: "Use beta-lactam + azithromycin combination. Doxycycline as alternative atypical coverage.",
      highMRSA: "Consider MRSA nares PCR. Add vancomycin/linezolid if: post-influenza, necrotic infiltrates, prior MRSA.",
    },
    scores: [
      { name:"CURB-65", description:"Confusion, BUN >20, RR ≥30, SBP <90/DBP <60, Age ≥65. Score 0–1: outpatient; 2: inpatient; ≥3: ICU consider." },
      { name:"PSI / PORT Score", description:"More granular 20-variable score. Class I–II: outpatient; III: observation; IV–V: inpatient/ICU." },
    ],
  },
  hap: {
    diagnostics: [
      { test:"Chest X-Ray / CT Chest", priority:"urgent", rationale:"New or progressive infiltrate in hospitalized patient. CT better characterizes empyema, abscess." },
      { test:"BAL or mini-BAL / Tracheal aspirate", priority:"urgent", rationale:"Quantitative cultures: BAL ≥10⁴ CFU/mL or TA ≥10⁵ CFU/mL diagnostic. Obtain BEFORE changing antibiotics." },
      { test:"Blood cultures ×2", priority:"urgent", rationale:"Bacteremia in ~15–18% of VAP. Positive blood culture with same organism confirms VAP." },
      { test:"CBC, BMP, LFTs", priority:"routine", rationale:"WBC trend, organ function for drug dosing, inflammatory markers." },
      { test:"CPIS Score (Clinical Pulmonary Infection Score)", priority:"routine", rationale:"≥6 supports pneumonia diagnosis. Useful for treatment decision and de-escalation." },
      { test:"Procalcitonin", priority:"routine", rationale:"Useful for duration guidance. Serial procalcitonin can support early discontinuation." },
      { test:"MRSA nares PCR", priority:"inpatient", rationale:"Negative PCR: 96% NPV to rule out MRSA VAP — can safely withhold vancomycin." },
      { test:"Galactomannan / β-D-Glucan", priority:"consider", rationale:"If immunocompromised or clinical concern for Aspergillus (prolonged steroids, hematologic malignancy)." },
    ],
    differentials: [
      { dx:"Hospital-Acquired Pneumonia", confidence:80, icd:"J18.0", notes:"New infiltrate + fever + purulent secretions after ≥48h hospitalization." },
      { dx:"Ventilator-Associated Pneumonia", confidence:75, icd:"J95.851", notes:"Intubated >48h. CPIS score guides diagnosis. MDR organisms more likely." },
      { dx:"Pulmonary Edema / Fluid Overload", confidence:40, icd:"J81", notes:"Bilateral infiltrates, worsening oxygenation without fever or purulent secretions." },
      { dx:"ARDS (non-infectious)", confidence:35, icd:"J80", notes:"Bilateral infiltrates, P/F <300, not fully explained by heart failure. Underlying trigger?" },
      { dx:"Aspiration Pneumonitis vs. Pneumonia", confidence:30, icd:"J68.0", notes:"Witnessed aspiration + CXR infiltrate. Chemical pneumonitis resolves 24–48h without antibiotics." },
      { dx:"Drug Reaction / Eosinophilic Pneumonia", confidence:10, icd:"J68.2", notes:"Peripheral eosinophilia, new drug exposure, BAL eosinophils." },
    ],
    patientModifiers: {
      renalImpairment: "Avoid nephrotoxic combinations (vanco + piperacillin in AKI). Adjust all renally-cleared antibiotics. Consider inhaled colistin if systemic toxicity a concern.",
      pcnAllergy: "Avoid piperacillin-tazobactam. Use aztreonam + metronidazole for Pseudomonas coverage, or a carbapenem (if no carbapenem allergy).",
      highMRSA: "Add vancomycin or linezolid empirically. MRSA nares PCR negative = high NPV to guide discontinuation at 48-72h.",
    },
    scores: [
      { name:"CPIS Score", description:"6 variables: temp, WBC, secretions, oxygenation, CXR, culture. ≥6 = VAP likely." },
      { name:"SOFA Score", description:"Assess multi-organ dysfunction. High SOFA = higher mortality risk; use broad empiric coverage." },
    ],
  },
  "uti-uncomp": {
    diagnostics: [
      { test:"Urinalysis with reflex urine culture", priority:"routine", rationale:"Pyuria (≥10 WBC/hpf) and bacteriuria. Culture required only if treating complicated UTI." },
      { test:"Urine pregnancy test (women of childbearing age)", priority:"urgent", rationale:"Pregnancy changes antibiotic selection (avoid fluoroquinolones, TMP-SMX in 1st/3rd trimester)." },
      { test:"Blood cultures", priority:"consider", rationale:"NOT indicated for uncomplicated cystitis. Reserve for pyelonephritis or sepsis presentation." },
    ],
    differentials: [
      { dx:"Uncomplicated Cystitis", confidence:90, icd:"N30.0", notes:"Dysuria, frequency, urgency without systemic signs. UA: pyuria + bacteriuria." },
      { dx:"Urethritis (STI)", confidence:40, icd:"N34.1", notes:"Young sexually active patient. Test for GC/Chlamydia. UA may be negative." },
      { dx:"Vaginitis / Vulvovaginal Candidiasis", confidence:30, icd:"B37.3", notes:"Vaginal discharge, external dysuria. UA often normal." },
      { dx:"Interstitial Cystitis", confidence:20, icd:"N30.1", notes:"Chronic, recurrent symptoms without bacteriuria. History of negative cultures." },
      { dx:"Pyelonephritis (ascending)", confidence:15, icd:"N10", notes:"CVA tenderness, fever >38°C, nausea/vomiting — escalate management." },
    ],
    patientModifiers: {
      renalImpairment: "AVOID nitrofurantoin if CrCl <30 (ineffective + toxic). AVOID TMP-SMX if CrCl <15. Ciprofloxacin dose reduction if CrCl <50.",
      pcnAllergy: "No PCN-based agents used for uncomplicated UTI. Nitrofurantoin, TMP-SMX, or fosfomycin are all safe alternatives.",
    },
    scores: [
      { name:"Bladder Symptom Score", description:"Dysuria + frequency + urgency = clinical diagnosis. Culture not routinely required in otherwise healthy, non-pregnant women." },
    ],
  },
  "uti-comp": {
    diagnostics: [
      { test:"Urine culture (midstream clean catch or catheter)", priority:"urgent", rationale:"ALWAYS obtain before antibiotics for pyelonephritis. De-escalation depends on susceptibility." },
      { test:"Blood cultures ×2 sets", priority:"urgent", rationale:"Required for fever, rigors, sepsis presentation, or immunocompromised. Bacteremia in ~20% of pyelonephritis." },
      { test:"CBC, BMP", priority:"urgent", rationale:"WBC, creatinine for severity assessment, antibiotic dosing, sepsis evaluation." },
      { test:"Renal ultrasound", priority:"inpatient", rationale:"Rule out hydronephrosis, obstruction, perinephric abscess — requires urgent drainage if present." },
      { test:"CT Abdomen/Pelvis (without contrast)", priority:"severe", rationale:"Better characterizes abscess, emphysematous pyelonephritis. CT if no improvement at 48–72h." },
      { test:"UA with reflex culture", priority:"urgent", rationale:"Pyuria and bacteriuria. Gram stain can guide empiric coverage (GNR vs. GPC)." },
    ],
    differentials: [
      { dx:"Pyelonephritis", confidence:85, icd:"N10", notes:"CVA tenderness, fever, UA with pyuria/bacteriuria. E. coli 80% of cases." },
      { dx:"Perinephric Abscess", confidence:25, icd:"N15.1", notes:"Failed antibiotic response at 48–72h. CT shows fluid collection. Requires drainage." },
      { dx:"Renal Calculus with Obstruction/Infection", confidence:30, icd:"N20.1", notes:"Flank pain, colicky, hematuria. Obstructed infected stone = urological emergency." },
      { dx:"Appendicitis (right-sided)", confidence:20, icd:"K37", notes:"RLQ pain, UA may show mild pyuria from proximity. CT to differentiate." },
      { dx:"Sepsis of Unknown Source", confidence:15, icd:"A41.9", notes:"Urine source most common in women. Blood cultures + imaging to identify source." },
    ],
    patientModifiers: {
      renalImpairment: "Adjust ceftriaxone not needed. Avoid ciprofloxacin if CrCl <30 (reduced urinary concentration). If carbapenem used, adjust meropenem/ertapenem dose.",
      pcnAllergy: "Avoid ampicillin-sulbactam. Use ceftriaxone (safe with most PCN allergies) or ciprofloxacin.",
      highESBL: "Consider ertapenem empirically if ESBL risk (prior ESBL, healthcare-associated, travel from high-prevalence region). De-escalate when susceptibility known.",
    },
    scores: [
      { name:"SOFA / qSOFA", description:"If fever + altered mental status + tachycardia: screen for sepsis. qSOFA ≥2 = sepsis concern." },
    ],
  },
  "ssti-non": {
    diagnostics: [
      { test:"Mark cellulitis borders with pen", priority:"urgent", rationale:"Document at presentation to objectively track progression or regression." },
      { test:"CBC, CMP", priority:"inpatient", rationale:"WBC for severity, CRP for baseline. Elevated CK raises concern for necrotizing fasciitis." },
      { test:"Blood cultures ×2", priority:"inpatient", rationale:"Low yield (~2%) in uncomplicated cellulitis. Obtain if fever, sepsis, or immunocompromised." },
      { test:"Wound culture (if open wound or drainage)", priority:"routine", rationale:"Swab of open area. Do NOT swab intact cellulitis — unreliable." },
      { test:"MRI soft tissue (STAT)", priority:"severe", rationale:"If necrotizing fasciitis suspected: finger test, pain out of proportion, crepitus, skin necrosis. MRI/CT if stable enough." },
      { test:"Duplex ultrasound (lower extremity)", priority:"routine", rationale:"Rule out DVT — can mimic cellulitis. 30% of lower extremity cellulitis misdiagnoses are DVT." },
      { test:"CRP / ESR", priority:"inpatient", rationale:"Useful for baseline and monitoring treatment response at 48–72h." },
    ],
    differentials: [
      { dx:"Streptococcal Cellulitis", confidence:80, icd:"L03.90", notes:"Poorly demarcated spreading erythema, non-purulent. Group A Strep most common." },
      { dx:"DVT (Deep Vein Thrombosis)", confidence:35, icd:"I82.409", notes:"Lower extremity warmth, erythema, swelling. Duplex ultrasound to differentiate." },
      { dx:"Contact Dermatitis / Inflammatory", confidence:25, icd:"L25.9", notes:"Bilateral involvement, history of exposure, responds to steroids." },
      { dx:"Necrotizing Fasciitis", confidence:15, icd:"M72.6", notes:"Pain out of proportion, skin bullae, crepitus, elevated CK/lactate. SURGICAL EMERGENCY." },
      { dx:"Stasis Dermatitis / Venous Insufficiency", confidence:20, icd:"I87.2", notes:"Chronic bilateral, bronze hyperpigmentation, varicosities. Not infectious." },
      { dx:"Erysipelas", confidence:40, icd:"A46", notes:"Sharply demarcated, raised, erythematous plaque. Typically face or lower extremity. Streptococcal." },
    ],
    patientModifiers: {
      pcnAllergy: "Use clindamycin or TMP-SMX. Check D-zone test for inducible clindamycin resistance.",
      renalImpairment: "Adjust cefazolin (mild impairment). Clindamycin requires no adjustment — preferred if renal-friendly agent needed.",
    },
    scores: [
      { name:"LRINEC Score", description:"Lab Risk Indicator for Necrotizing Fasciitis. CRP, WBC, Hgb, Na, Cr, glucose. ≥6 = moderate risk; ≥8 = high risk NF — immediate surgery." },
    ],
  },
  "ssti-pur": {
    diagnostics: [
      { test:"I&D + wound culture + Gram stain", priority:"urgent", rationale:"DEFINITIVE treatment. Culture the wound contents — high yield for MRSA in purulent SSTI." },
      { test:"Blood cultures ×2", priority:"inpatient", rationale:"Obtain if fever, systemic signs, failed outpatient therapy, or extensive infection." },
      { test:"CBC, CMP", priority:"inpatient", rationale:"WBC, CRP, CK for systemic involvement. Elevated CK → concern for myonecrosis." },
      { test:"MRSA nasal swab PCR", priority:"inpatient", rationale:"If positive, increases probability of MRSA infection. If negative, has high NPV." },
      { test:"Ultrasound (soft tissue)", priority:"urgent", rationale:"Identifies occult abscess requiring I&D. Look for fluid collection, posterior acoustic enhancement." },
      { test:"Echocardiogram (TTE/TEE)", priority:"consider", rationale:"If S. aureus bacteremia confirmed — rule out endocarditis. Required per IDSA guidelines." },
    ],
    differentials: [
      { dx:"CA-MRSA Abscess / Furuncle", confidence:75, icd:"L02.91", notes:"Purulent, fluctuant, painful nodule. CA-MRSA in >50% of U.S. purulent SSTIs." },
      { dx:"MSSA Abscess", confidence:50, icd:"L02.91", notes:"Clinically indistinguishable from MRSA. Culture determines treatment de-escalation." },
      { dx:"Pilonidal Cyst (if sacral)", confidence:30, icd:"L05.91", notes:"Midline sacral location, hair-containing. Surgical excision required for cure." },
      { dx:"Hidradenitis Suppurativa", confidence:20, icd:"L73.2", notes:"Axillae, groin, submammary. Recurrent, tunneling. Dermatology referral." },
      { dx:"Bartholin Gland Abscess", confidence:15, icd:"N75.1", notes:"Labia majora posterior, 5 o'clock position. Word catheter or marsupialization." },
    ],
    patientModifiers: {
      pcnAllergy: "No PCN agents used for MRSA SSTI. TMP-SMX or doxycycline are safe alternatives with no cross-reactivity.",
      renalImpairment: "Reduce TMP-SMX dose if CrCl <30. Doxycycline requires no adjustment. Vancomycin dose/interval adjustment critical in renal impairment.",
      highMRSA: "Empiric MRSA coverage (TMP-SMX or doxycycline PO; vancomycin IV) strongly indicated given >50% prevalence.",
    },
    scores: [],
  },
  meningitis: {
    diagnostics: [
      { test:"CT Head WITHOUT contrast (if indicated)", priority:"urgent", rationale:"Required BEFORE LP only if: papilledema, focal neuro deficit, immunocompromised, altered consciousness, new-onset seizure." },
      { test:"Lumbar Puncture (LP) — STAT", priority:"urgent", rationale:"CRITICAL: Opening pressure, cell count + diff, protein, glucose, Gram stain, bacterial culture, HSV PCR, cryptococcal antigen (HIV+)." },
      { test:"Blood cultures ×2 sets — BEFORE ANTIBIOTICS", priority:"urgent", rationale:"Positive in 50–90% bacterial meningitis. Do NOT delay >10 min. If LP delayed, draw cultures and start antibiotics immediately." },
      { test:"CBC with differential", priority:"urgent", rationale:"WBC, neutrophilia. Thrombocytopenia in meningococcemia." },
      { test:"BMP / CMP", priority:"urgent", rationale:"Electrolytes (SIADH common), glucose for CSF interpretation, creatinine for drug dosing." },
      { test:"Coagulation (PT/PTT/INR/fibrinogen)", priority:"urgent", rationale:"DIC in fulminant meningococcemia. Required before LP if concern for coagulopathy." },
      { test:"Meningococcal PCR (serum/CSF)", priority:"urgent", rationale:"Remain positive even after antibiotics. Test all suspected N. meningitidis." },
      { test:"Lyme serology (if geographic risk)", priority:"consider", rationale:"Lyme meningitis: lymphocytic pleocytosis, slower onset, less toxic-appearing." },
    ],
    differentials: [
      { dx:"Bacterial Meningitis", confidence:80, icd:"G00.9", notes:"Fever + headache + stiff neck + photophobia. CSF: turbid, high WBC (PMN), high protein, low glucose." },
      { dx:"Viral (Aseptic) Meningitis", confidence:60, icd:"A87.9", notes:"CSF: lymphocytic pleocytosis, normal/mildly elevated protein, normal glucose. Enterovirus most common." },
      { dx:"Herpes Encephalitis (HSV-1)", confidence:30, icd:"B00.4", notes:"Temporal lobe involvement on MRI, CSF RBCs, fever + behavioral change. Empiric acyclovir." },
      { dx:"Subarachnoid Hemorrhage", confidence:25, icd:"I60.9", notes:"Thunderclap headache, xanthochromia on LP. CT first — non-contrast." },
      { dx:"Cryptococcal Meningitis (HIV+)", confidence:20, icd:"B45.1", notes:"Subacute, elevated opening pressure, India ink positive, cryptococcal antigen positive." },
      { dx:"TB Meningitis", confidence:15, icd:"A17.0", notes:"Subacute/chronic, lymphocytic CSF, AFB smear (low sensitivity), PCR, adenosine deaminase." },
    ],
    patientModifiers: {
      renalImpairment: "Adjust vancomycin (AUC-guided). Ceftriaxone requires no adjustment (hepatically cleared). Ampicillin dose reduction if CrCl <30.",
      pcnAllergy: "Use meropenem instead of ampicillin + ceftriaxone. Aztreonam does NOT cover Listeria — maintain ampicillin if Listeria risk despite PCN allergy (desensitization).",
    },
    scores: [
      { name:"Jolt Accentuation", description:"Worsening headache with horizontal head movement: sensitivity 97% for meningitis, specificity 60%." },
      { name:"CSF Interpretation", description:"Bacterial: WBC >1000 PMN, glucose <45 (or <0.4 serum:CSF ratio), protein >200. Viral: lymphocytes, normal glucose." },
    ],
  },
  sepsis: {
    diagnostics: [
      { test:"Blood cultures ×2 sets (aerobic + anaerobic)", priority:"urgent", rationale:"Draw BEFORE antibiotics when possible. Should not delay antibiotics >45 min." },
      { test:"Lactate level (serum)", priority:"urgent", rationale:"≥2 mmol/L = sepsis-related organ dysfunction. ≥4 = septic shock. Guides resuscitation." },
      { test:"CBC, BMP, LFTs, Coags", priority:"urgent", rationale:"Multi-organ dysfunction screening. Thrombocytopenia, elevated Cr, coagulopathy all impact management." },
      { test:"Urinalysis + urine culture", priority:"urgent", rationale:"Urinary source is most common for community-onset sepsis, especially in women." },
      { test:"Chest X-Ray (portable)", priority:"urgent", rationale:"Rule out pneumonia as pulmonary source." },
      { test:"CT Abdomen/Pelvis (contrast)", priority:"inpatient", rationale:"If abdominal source suspected — appendicitis, diverticulitis, bowel perforation, abscess." },
      { test:"Procalcitonin", priority:"routine", rationale:"Serial PCT guides duration. PCT-guided therapy reduces antibiotic exposure without harm." },
      { test:"Echocardiogram", priority:"consider", rationale:"If S. aureus bacteremia, IVDU, prosthetic valve, persistent fever despite antibiotics." },
      { test:"Point-of-care ultrasound (POCUS)", priority:"severe", rationale:"Assess cardiac function, IVC collapsibility, pericardial effusion, pleural effusion, free fluid." },
    ],
    differentials: [
      { dx:"Sepsis — Urinary Source", confidence:60, icd:"A41.9", notes:"Most common source in women. UA + UCx. Renal US if no response." },
      { dx:"Sepsis — Pulmonary Source", confidence:50, icd:"A41.9", notes:"New infiltrate, productive cough, pleuritis. CXR/CT chest." },
      { dx:"Sepsis — Intra-abdominal", confidence:40, icd:"A41.9", notes:"Abdominal pain, nausea. CT with contrast. Source control critical." },
      { dx:"Sepsis — Skin/Soft Tissue", confidence:30, icd:"A41.9", notes:"Look for wound, abscess, cellulitis. Necrotizing fasciitis if elevated CK + pain out of proportion." },
      { dx:"Sepsis — Unknown Source", confidence:20, icd:"A41.9", notes:"After standard workup negative. Consider endocarditis, discitis, prosthetic device." },
      { dx:"Non-infectious SIRS (SIRS without infection)", confidence:20, icd:"R65.10", notes:"Pancreatitis, PE, adrenal insufficiency, drug reaction. Procalcitonin low supports non-infectious etiology." },
    ],
    patientModifiers: {
      renalImpairment: "Avoid nephrotoxic drugs (aminoglycosides, IV contrast). Adjust vancomycin/piperacillin/meropenem doses urgently. Vancomycin AUC monitoring essential.",
      pcnAllergy: "Substitute piperacillin-tazobactam → aztreonam + metronidazole for GNR/anaerobic coverage. Add vancomycin for MRSA.",
      highMRSA: "Add vancomycin empirically if: IVDU, skin source, healthcare-associated, prior MRSA colonization, failed outpatient antibiotics.",
    },
    scores: [
      { name:"qSOFA", description:"RR ≥22, GCS <15, SBP ≤100. ≥2 = high risk of poor outcomes. Screen at bedside." },
      { name:"SOFA Score", description:"6-organ score. Increase of ≥2 = organ dysfunction = sepsis definition (Sepsis-3)." },
      { name:"NEWS2 / MEWS", description:"Vital sign-based early warning system. High score prompts ICU/senior review." },
    ],
  },
  iai: {
    diagnostics: [
      { test:"CT Abdomen/Pelvis with IV contrast", priority:"urgent", rationale:"Defines extent of infection, source (appendix, colon, gallbladder), free air/fluid, abscess." },
      { test:"Blood cultures ×2", priority:"urgent", rationale:"Bacteremia in 15–20% of severe IAI. Required before antibiotics if time permits." },
      { test:"CBC, CMP, LFTs, Lipase", priority:"urgent", rationale:"WBC, creatinine, LFTs for source differentiation (biliary vs. bowel). Lipase for pancreatitis." },
      { test:"Lactate", priority:"urgent", rationale:"Elevated lactate indicates bowel ischemia or sepsis — escalate management urgently." },
      { test:"Coagulation panel", priority:"inpatient", rationale:"Before any procedural intervention (CT-guided drainage, surgical washout)." },
      { test:"Intraoperative/drainage cultures", priority:"inpatient", rationale:"Gold standard. Send for aerobic, anaerobic, and fungal cultures if immunocompromised." },
    ],
    differentials: [
      { dx:"Acute Appendicitis", confidence:70, icd:"K37", notes:"RLQ pain, fever, WBC elevation. Alvarado/MANTRELS score. CT if clinical uncertainty." },
      { dx:"Diverticulitis (sigmoid)", confidence:60, icd:"K57.32", notes:"LLQ pain, fever, WBC. CT: pericolonic fat stranding. Uncomplicated: PO antibiotics or no antibiotics." },
      { dx:"Perforated Viscus", confidence:30, icd:"K63.1", notes:"Free air under diaphragm, peritoneal signs. Surgical emergency — immediate OR." },
      { dx:"Cholecystitis / Cholangitis", confidence:40, icd:"K81.0", notes:"RUQ pain, Murphy's sign, elevated LFTs/bilirubin (cholangitis). Biliary US." },
      { dx:"Pelvic Inflammatory Disease (women)", confidence:30, icd:"N70.91", notes:"Cervical motion tenderness, adnexal tenderness. Test for GC/Chlamydia. Pelvic US." },
      { dx:"Mesenteric Ischemia", confidence:15, icd:"K55.9", notes:"Pain out of proportion to exam, elevated lactate, risk factors (Afib, atherosclerosis). CT angio." },
    ],
    patientModifiers: {
      renalImpairment: "Avoid ertapenem if CrCl <30 (dose reduce). Ciprofloxacin dose reduction. Avoid metronidazole accumulation in severe hepatic failure.",
      pcnAllergy: "Avoid piperacillin-tazobactam. Use ciprofloxacin + metronidazole or aztreonam + metronidazole.",
      highESBL: "Use ertapenem or meropenem if ESBL risk from healthcare-associated or recurrent IAI.",
    },
    scores: [
      { name:"Alvarado Score (Appendicitis)", description:"Migration of pain to RLQ, anorexia, nausea, RLQ tenderness, rebound, fever, WBC>10k, shifted left. ≥7 = high probability appendicitis." },
    ],
  },
  osteo: {
    diagnostics: [
      { test:"MRI with and without contrast (bone/joint)", priority:"urgent", rationale:"Most sensitive (80–90%) and specific (70–80%) for osteomyelitis. Shows extent, abscess, involvement." },
      { test:"Bone biopsy + culture (CT-guided or surgical)", priority:"urgent", rationale:"GOLD STANDARD. Obtain before antibiotics if hemodynamically stable. Guides targeted therapy." },
      { test:"Blood cultures ×2", priority:"urgent", rationale:"Positive in ~50% of hematogenous osteomyelitis — most common in S. aureus cases." },
      { test:"ESR, CRP, WBC", priority:"routine", rationale:"CRP most sensitive for monitoring treatment response. ESR lags 1–2 weeks." },
      { test:"Plain X-Ray (bone/joint)", priority:"routine", rationale:"Insensitive early (changes appear 10–21 days). Useful for chronic disease, gas, fracture." },
      { test:"Echocardiogram (TTE/TEE)", priority:"consider", rationale:"Required if S. aureus bacteremia confirmed — endocarditis co-exists in up to 20%." },
      { test:"Bone scan (Tc-99m)", priority:"consider", rationale:"Sensitive but non-specific. Use when MRI contraindicated (pacemaker, implants)." },
      { test:"Joint aspiration (septic arthritis)", priority:"urgent", rationale:"Cell count >50,000 WBC + PMN predominance = septic arthritis. Culture before antibiotics." },
    ],
    differentials: [
      { dx:"Hematogenous Osteomyelitis", confidence:75, icd:"M86.9", notes:"Sudden onset, S. aureus most common. Vertebral: IV drug use, older adults, healthcare contact." },
      { dx:"Contiguous/Post-surgical Osteomyelitis", confidence:60, icd:"M86.1", notes:"Following surgery, trauma, or diabetic foot. Polymicrobial organisms common." },
      { dx:"Septic Arthritis", confidence:50, icd:"M00.9", notes:"Joint effusion, WBC >50k, PMN >75%. Surgical emergency — joint irrigation within 6h." },
      { dx:"Gout / Pseudogout", confidence:35, icd:"M10.9", notes:"Crystal-induced arthritis. Joint aspiration: urate or CPPD crystals. Elevated uric acid." },
      { dx:"Malignancy (bone tumor / metastasis)", confidence:20, icd:"C41.9", notes:"Night pain, systemic symptoms, weight loss. MRI with contrast + biopsy." },
    ],
    patientModifiers: {
      renalImpairment: "Vancomycin dose/AUC monitoring critical. Avoid high-dose TMP-SMX if CrCl <30. Rifampin no adjustment needed but hepatotoxicity monitoring required.",
      pcnAllergy: "Replace nafcillin/oxacillin with cefazolin (if tolerable) or vancomycin for MSSA. Daptomycin is alternative for bone/joint infections.",
    },
    scores: [],
  },
  dfi: {
    diagnostics: [
      { test:"Probe-to-Bone Test", priority:"urgent", rationale:"Positive test (sensitivity ~89%): concern for osteomyelitis. Obtain MRI if positive or high clinical suspicion." },
      { test:"MRI foot/ankle with contrast", priority:"inpatient", rationale:"Best imaging for osteomyelitis in DFI. Sensitivity 90%, specificity 83%. Evaluate bone marrow edema." },
      { test:"Wound culture (deep tissue or bone biopsy)", priority:"urgent", rationale:"Surface swabs unreliable. Punch biopsy or bone biopsy for accurate identification. Do not swab ulcer surface." },
      { test:"Blood cultures ×2", priority:"inpatient", rationale:"Required for fever, sepsis, or limb-threatening infection." },
      { test:"ABI (Ankle-Brachial Index)", priority:"urgent", rationale:"ABI <0.9 = peripheral arterial disease. Vascular surgery consult if ischemia present — antibiotics alone fail." },
      { test:"CBC, CMP, HbA1c, ESR/CRP", priority:"routine", rationale:"WBC for systemic involvement. HbA1c for glycemic control. ESR/CRP for osteomyelitis monitoring." },
      { test:"X-Ray foot (3 views)", priority:"routine", rationale:"Gas in soft tissue, bony changes. Lower sensitivity than MRI but fast, cheap, identifies Charcot changes." },
    ],
    differentials: [
      { dx:"Diabetic Foot Infection — Soft Tissue", confidence:80, icd:"E11.621", notes:"Cellulitis/abscess without bone involvement. Probe-to-bone negative. SSTI management." },
      { dx:"Diabetic Foot Osteomyelitis", confidence:50, icd:"E11.621", notes:"Probe-to-bone positive. MRI confirmatory. Long-course antibiotics or surgical debridement." },
      { dx:"Charcot Neuroarthropathy", confidence:35, icd:"M14.672", notes:"Hot, swollen foot in diabetic WITHOUT infection. ESR/CRP less elevated. MRI: subchondral changes." },
      { dx:"Ischemic Ulcer (PAD)", confidence:30, icd:"E11.52", notes:"ABI <0.9, absent pulses, necrotic ulcer margins, no granulation. Vascular surgery urgent." },
      { dx:"Necrotizing Fasciitis", confidence:15, icd:"M72.6", notes:"Rapidly spreading, skin crepitus, bullae, pain out of proportion. Surgical emergency." },
    ],
    patientModifiers: {
      renalImpairment: "Adjust vancomycin (AUC-guided). Avoid high-dose TMP-SMX. Ertapenem requires dose reduction if CrCl <30.",
      highMRSA: "Add vancomycin/TMP-SMX/linezolid for MRSA coverage if prior MRSA, severe infection, or poor initial response.",
    },
    scores: [
      { name:"PEDIS Classification", description:"Perfusion, Extent, Depth, Infection, Sensation. Grade 1–4 infection. Grade 3–4 = inpatient IV antibiotics." },
    ],
  },
  "febrile-neutro": {
    diagnostics: [
      { test:"Blood cultures ×2 (peripheral + each lumen of CVC)", priority:"urgent", rationale:"Must be drawn BEFORE antibiotics. Bacteremia in ~10–25% of febrile neutropenia. Include all catheter lumens." },
      { test:"CBC with differential", priority:"urgent", rationale:"Confirm ANC <500. ANC <100 = high risk. Repeat every 2–3 days to guide discontinuation." },
      { test:"BMP, LFTs, CRP/ESR", priority:"urgent", rationale:"Organ function for drug dosing. LFTs for hepatotoxic drug selection. CRP for inflammatory marker baseline." },
      { test:"Chest X-Ray (portable)", priority:"urgent", rationale:"Rule out pneumonia. Repeat CT chest if persistent fever — fungal pneumonia (Aspergillus) may be occult." },
      { test:"Urinalysis + urine culture", priority:"urgent", rationale:"Common source especially with urinary catheter. UA may be falsely negative with severe neutropenia." },
      { test:"Procalcitonin", priority:"routine", rationale:"PCT >0.5 supports bacteremia. Serial PCT can guide de-escalation." },
      { test:"CT Chest/Abdomen/Pelvis", priority:"severe", rationale:"For high-risk or persistent fever: identify occult infection (liver abscess, bowel source, fungal pneumonia)." },
      { test:"β-D-Glucan / Galactomannan", priority:"severe", rationale:"If fever persists >4 days or prolonged neutropenia anticipated. Sensitive for Aspergillus/Candida." },
      { test:"Throat/nasal swabs for respiratory viruses", priority:"consider", rationale:"RSV/influenza/parainfluenza — important in hematologic malignancy." },
    ],
    differentials: [
      { dx:"Bacteremia / Gram-negative Sepsis", confidence:70, icd:"A49.9", notes:"E. coli, Klebsiella most common GNR. P. aeruginosa: high mortality if untreated." },
      { dx:"Gram-positive Bacteremia (CoNS/S. aureus)", confidence:60, icd:"A49.9", notes:"CVC-related CoNS most common gram-positive. S. aureus requires 14-day IV minimum." },
      { dx:"Invasive Fungal Infection (Candida/Aspergillus)", confidence:30, icd:"B44.1", notes:"Prolonged neutropenia >7 days, prior antibiotics, mucosal disruption. β-D-glucan + CT chest." },
      { dx:"Drug Fever", confidence:25, icd:"R50.2", notes:"Fever in context of recent drug exposure, without other source. Diagnosis of exclusion." },
      { dx:"Viral (CMV/HSV/VZV reactivation)", confidence:20, icd:"B27.90", notes:"Post-transplant. CMV antigenemia/PCR. Fever + transaminitis + cytopenias." },
    ],
    patientModifiers: {
      renalImpairment: "Adjust cefepime (dose-dependent neurotoxicity in renal failure — reduce dose). Vancomycin AUC-guided. Avoid aminoglycosides.",
      pcnAllergy: "Avoid pip/tazo and beta-lactams. Use aztreonam + amikacin or ciprofloxacin. Carbapenem if broader coverage needed.",
      highMRSA: "Add vancomycin if hemodynamic instability, gram-positive in preliminary blood culture, severe mucositis, skin source.",
    },
    scores: [
      { name:"MASCC Score", description:"Multinational Association for Supportive Care in Cancer. ≥21 = low risk (consider oral/outpatient). <21 = high risk → IV inpatient." },
      { name:"CISNE Score", description:"Alternative risk stratification for early discharge in febrile neutropenia. Validated in solid tumors." },
    ],
  },
};

const PRIORITY_CONFIG = {
  urgent:    { color:"#ff5c6c", bg:"rgba(255,92,108,.1)",  border:"rgba(255,92,108,.25)",  label:"Urgent" },
  inpatient: { color:"#4a90d9", bg:"rgba(74,144,217,.1)",  border:"rgba(74,144,217,.25)",  label:"Inpatient" },
  severe:    { color:"#9b6dff", bg:"rgba(155,109,255,.1)", border:"rgba(155,109,255,.25)", label:"Severe/ICU" },
  routine:   { color:"#00d4bc", bg:"rgba(0,212,188,.08)",  border:"rgba(0,212,188,.2)",    label:"Routine" },
  consider:  { color:"#4a7299", bg:"rgba(74,114,153,.08)", border:"rgba(74,114,153,.2)",   label:"Consider" },
};

function ConfidenceBar({ confidence }) {
  const color = confidence >= 70 ? T.teal : confidence >= 40 ? T.amber : T.muted;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      <div style={{ flex:1, height:4, borderRadius:2, background:T.edge, overflow:"hidden" }}>
        <div style={{ height:"100%", borderRadius:2, background:color, width:`${confidence}%`, transition:"width 1s ease" }} />
      </div>
      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700, color, minWidth:28 }}>{confidence}%</span>
    </div>
  );
}

export default function DiagnosticWorkup({ infectionId, allergies, crcl, mrsaRate, esblRate }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("dx");

  const data = WORKUP[infectionId];
  if (!data) return null;

  // Patient-specific modifier messages
  const modifiers = [];
  if (data.patientModifiers) {
    const m = data.patientModifiers;
    if (crcl !== null && crcl < 60 && m.renalImpairment) modifiers.push({ color: T.amber, icon:"🫘", label:"Renal Impairment", body: m.renalImpairment });
    if (allergies?.has("pcn") && m.pcnAllergy) modifiers.push({ color: T.red, icon:"⚠️", label:"PCN Allergy", body: m.pcnAllergy });
    if (allergies?.has("fq") && m.fqAllergy) modifiers.push({ color: T.red, icon:"⚠️", label:"FQ Allergy", body: m.fqAllergy });
    if (mrsaRate >= 30 && m.highMRSA) modifiers.push({ color: T.red, icon:"🦠", label:`High MRSA Rate (${mrsaRate}%)`, body: m.highMRSA });
    if (esblRate >= 20 && m.highESBL) modifiers.push({ color: T.amber, icon:"🔬", label:`High ESBL Rate (${esblRate}%)`, body: m.highESBL });
  }

  const totalAlerts = modifiers.length;

  return (
    <div style={{ background:"rgba(155,109,255,.04)", border:"1px solid rgba(155,109,255,.2)", borderRadius:13, overflow:"hidden", marginBottom:18 }}>
      {/* Collapsible Header */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"12px 16px", background:"none", border:"none", cursor:"pointer", textAlign:"left" }}
      >
        <div style={{ width:28, height:28, borderRadius:7, background:"rgba(155,109,255,.15)", border:"1px solid rgba(155,109,255,.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 }}>🔬</div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13, fontWeight:700, color:T.purple }}>Diagnostic Workup & Differential Diagnoses</div>
          <div style={{ fontSize:11, color:T.dim, marginTop:1 }}>
            {data.diagnostics.length} tests · {data.differentials.length} differentials
            {totalAlerts > 0 && <span style={{ marginLeft:8, background:"rgba(255,92,108,.15)", border:"1px solid rgba(255,92,108,.3)", borderRadius:10, padding:"1px 7px", fontSize:10, fontWeight:700, color:T.red }}>{totalAlerts} patient-specific alert{totalAlerts!==1?"s":""}</span>}
          </div>
        </div>
        <span style={{ fontSize:12, color:T.purple, fontWeight:700 }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div style={{ borderTop:"1px solid rgba(155,109,255,.15)" }}>
          {/* Patient-specific modifier alerts */}
          {modifiers.length > 0 && (
            <div style={{ padding:"10px 16px 0", display:"flex", flexDirection:"column", gap:6 }}>
              {modifiers.map((mod, i) => (
                <div key={i} style={{ display:"flex", gap:8, padding:"9px 12px", borderRadius:8, background:`${mod.color}12`, border:`1px solid ${mod.color}33`, fontSize:11.5, color:T.text, lineHeight:1.6 }}>
                  <span style={{ flexShrink:0, fontSize:14 }}>{mod.icon}</span>
                  <div><strong style={{ color:mod.color }}>{mod.label}: </strong>{mod.body}</div>
                </div>
              ))}
            </div>
          )}

          {/* Tabs */}
          <div style={{ display:"flex", borderBottom:`1px solid rgba(155,109,255,.15)`, margin:"10px 0 0" }}>
            {[["dx","🧪 Diagnostic Tests"],["diff","🩺 Differentials"],["scores","📊 Clinical Scores"]].map(([id,label]) => (
              <button key={id} onClick={() => setTab(id)}
                style={{ flex:1, padding:"9px 8px", fontSize:11.5, fontWeight:700, cursor:"pointer", border:"none", background:tab===id?"rgba(155,109,255,.08)":"transparent", color:tab===id?T.purple:T.dim, borderBottom:`2px solid ${tab===id?T.purple:"transparent"}`, fontFamily:"'DM Sans',sans-serif" }}>
                {label}
              </button>
            ))}
          </div>

          {/* Diagnostic Tests Tab */}
          {tab === "dx" && (
            <div style={{ padding:"12px 16px", display:"flex", flexDirection:"column", gap:8 }}>
              {data.diagnostics.map((d, i) => {
                const p = PRIORITY_CONFIG[d.priority] || PRIORITY_CONFIG.routine;
                return (
                  <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"10px 12px", borderRadius:9, background:T.panel, border:`1px solid ${T.border}` }}>
                    <span style={{ fontSize:9, fontWeight:800, textTransform:"uppercase", letterSpacing:".07em", padding:"3px 8px", borderRadius:6, flexShrink:0, marginTop:1, background:p.bg, color:p.color, border:`1px solid ${p.border}` }}>{p.label}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:12.5, color:T.bright }}>{d.test}</div>
                      <div style={{ fontSize:11, color:T.dim, lineHeight:1.55, marginTop:2 }}>{d.rationale}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Differentials Tab */}
          {tab === "diff" && (
            <div style={{ padding:"12px 16px", display:"flex", flexDirection:"column", gap:8 }}>
              {data.differentials
                .sort((a, b) => b.confidence - a.confidence)
                .map((d, i) => (
                  <div key={i} style={{ padding:"10px 12px", borderRadius:9, background:T.panel, border:`1px solid ${T.border}` }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, padding:"2px 7px", borderRadius:5, background:"rgba(22,45,79,.8)", color:T.muted }}>{d.icd}</span>
                      <span style={{ fontWeight:700, fontSize:13, color:T.bright, flex:1 }}>{d.dx}</span>
                      {i === 0 && <span style={{ fontSize:9, fontWeight:800, textTransform:"uppercase", padding:"2px 8px", borderRadius:8, background:"rgba(0,212,188,.1)", color:T.teal, border:"1px solid rgba(0,212,188,.25)" }}>MOST LIKELY</span>}
                    </div>
                    <ConfidenceBar confidence={d.confidence} />
                    <div style={{ fontSize:11, color:T.dim, lineHeight:1.55, marginTop:5 }}>{d.notes}</div>
                  </div>
                ))}
              <div style={{ fontSize:10, color:T.muted, textAlign:"center", padding:"4px 0" }}>Confidence bars are relative clinical likelihoods, not absolute probabilities. Adjust based on clinical context.</div>
            </div>
          )}

          {/* Clinical Scores Tab */}
          {tab === "scores" && (
            <div style={{ padding:"12px 16px", display:"flex", flexDirection:"column", gap:8 }}>
              {data.scores.length === 0 ? (
                <div style={{ padding:"20px 0", textAlign:"center", color:T.muted, fontSize:12 }}>No specific scoring tools for this infection.</div>
              ) : (
                data.scores.map((s, i) => (
                  <div key={i} style={{ padding:"12px 14px", borderRadius:9, background:T.panel, border:`1px solid ${T.border}` }}>
                    <div style={{ fontWeight:700, fontSize:13, color:T.bright, marginBottom:5 }}>{s.name}</div>
                    <div style={{ fontSize:11.5, color:T.text, lineHeight:1.6 }}>{s.description}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}