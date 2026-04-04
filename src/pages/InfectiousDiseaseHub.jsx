import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";

(() => {
  if (document.getElementById("id-fonts")) return;
  const l = document.createElement("link"); l.id = "id-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "id-css";
  s.textContent = `
    *{box-sizing:border-box;margin:0;padding:0;}
    ::-webkit-scrollbar{width:3px;height:3px;}
    ::-webkit-scrollbar-track{background:transparent;}
    ::-webkit-scrollbar-thumb{background:rgba(42,79,122,0.5);border-radius:2px;}
    @keyframes idFadeSlide{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    @keyframes idShimmer{0%{background-position:-200% center}100%{background-position:200% center}}
    @keyframes idSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
    .id-fade{animation:idFadeSlide .22s ease forwards;}
    .id-spin{animation:idSpin 1s linear infinite;display:inline-block;}
    .id-shimmer{background:linear-gradient(90deg,#e8f0fe 0%,#fff 30%,#3dffa0 52%,#00e5c0 72%,#e8f0fe 100%);background-size:250% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:idShimmer 5s linear infinite;}
  `;
  document.head.appendChild(s);
})();

const T = {
  bg:"#050f1e", panel:"#081628", card:"#0b1e36",
  txt:"#e8f0fe", txt2:"#8aaccc", txt3:"#4a6a8a", txt4:"#2e4a6a",
  red:"#ff4444", coral:"#ff6b6b", orange:"#ff9f43",
  yellow:"#f5c842", green:"#3dffa0", teal:"#00e5c0",
  blue:"#3b9eff", purple:"#9b6dff", cyan:"#00d4ff", rose:"#f472b6",
};
const glass = {
  backdropFilter:"blur(24px) saturate(200%)",
  WebkitBackdropFilter:"blur(24px) saturate(200%)",
  background:"rgba(8,22,40,0.78)",
  border:"1px solid rgba(42,79,122,0.35)",
  borderRadius:14,
};

// ── Data ──────────────────────────────────────────────────────────
const CATS = [
  {id:"all",      label:"All",            color:T.teal  },
  {id:"abx",      label:"Antibiotics",    color:T.green },
  {id:"syndrome", label:"Syndromes",      color:T.blue  },
  {id:"resistant", label:"Resistant Orgs",color:T.red   },
  {id:"hiv",      label:"HIV/Opportunistic",color:T.purple},
  {id:"tropical", label:"Travel/Tropical",color:T.orange},
  {id:"ppe",      label:"Isolation/PPE",  color:T.yellow},
];

const SYNDROMES = [
  // ── ANTIBIOTICS ──────────────────────────────────────────────────
  {
    id:"abx_overview", name:"Antibiotic Stewardship Principles", icon:"💊", color:T.green, cat:"abx",
    hook:"Right drug, right dose, right duration — de-escalate as soon as possible",
    sections:[
      {label:"Core Stewardship Principles", col:T.teal, items:[
        "Blood cultures × 2 before antibiotics when possible — do NOT delay antibiotics for cultures in septic shock",
        "Narrow spectrum = fewer side effects, less resistance selection, less C. diff — always de-escalate",
        "Duration matters: most infections do NOT require 14 days — see syndrome-specific recommendations",
        "Re-evaluate at 48–72 h: culture results back, clinical trajectory clear — adjust or stop accordingly",
        "Biomarkers: procalcitonin-guided therapy reduces duration by 1.5–2 days in respiratory infections",
      ]},
      {label:"Penicillin Allergy Assessment", col:T.yellow, items:[
        "90% of reported penicillin allergics can safely receive penicillins — true IgE allergy: <1%",
        "Cross-reactivity with cephalosporins: ~1–2% (structural similarity of R1 side chain — not 'penicillin class')",
        "Low-risk history (rash >10y ago, GI side effects, family report): proceed with cephalosporin directly",
        "Moderate risk (urticaria, pruritis): skin test or graded challenge under observation",
        "High risk (anaphylaxis, angioedema): allergy consult; use aztreonam (no cross-reactivity) or carbapenems cautiously",
        "NEVER withhold first-line antibiotics for sepsis based on remote/vague penicillin allergy history",
      ]},
      {label:"Key Antibiotic Classes", col:T.blue, items:[
        "β-Lactams: penicillins → aminopenicillins → anti-staph → anti-pseudomonal; spectrum widens down the list",
        "Cephalosporins 1st–5th gen: 1st = skin/gram-pos; 3rd = CSF-penetrating; 4th/5th = MRSA/pseudomonal coverage",
        "Carbapenems (ERTAPENEM has NO Pseudomonas coverage — critical distinction in ED)",
        "Fluoroquinolones: avoid empirically for UTI in areas with >20% resistance; reserve for atypical PNA, bone/joint",
        "Vancomycin: oral = C. diff only (not absorbed); IV = MRSA/serious gram-positive infections",
        "Metronidazole: anaerobes, C. diff (oral preferred for C. diff), BV, Trichomonas",
      ]},
      {label:"Duration Evidence (Days)", col:T.green, items:[
        "Uncomplicated UTI (women): 3–5 days trimethoprim-sulfamethoxazole or 3 days FQ or 5 days nitrofurantoin",
        "CAP outpatient: 5 days (amoxicillin ± azithromycin); inpatient non-severe: 5 days; severe/ICU: 7 days",
        "Uncomplicated skin/soft tissue (cellulitis): 5 days — extend only if not improving",
        "Bacteremia (gram-negative, no source): 7 days; Staph aureus bacteremia: minimum 14 days (TEE to exclude endocarditis)",
        "Endocarditis: 4–6 weeks depending on valve type and organism — never less",
        "Osteomyelitis: 6 weeks IV/highly bioavailable oral after source control",
      ]},
    ],
    pearl:"The most common antibiotic error in the ED is starting vancomycin for every fever. MRSA risk factors matter: recent hospitalization, IV drug use, hemodialysis, prior MRSA. De-escalate at 48h if cultures negative and clinical picture allows.",
  },
  {
    id:"abx_gram_pos", name:"Gram-Positive Coverage Guide", icon:"🔵", color:T.blue, cat:"abx",
    hook:"Know which beta-lactam covers MRSA — most don't",
    sections:[
      {label:"MRSA Coverage", col:T.red, items:[
        "Vancomycin IV: first-line systemic MRSA — target AUC24/MIC 400–600 (pharmacy-guided)",
        "Daptomycin: MRSA bacteremia and endocarditis (NOT for pulmonary MRSA — inactivated by surfactant)",
        "Linezolid: MRSA pneumonia, skin infections — excellent oral bioavailability (~100%), serotonin syndrome risk",
        "Ceftaroline (5th gen cephalosporin): MRSA coverage — CAP, SSTI — can add to vancomycin for bacteremia",
        "TMP-SMX (Bactrim): oral MRSA (SSTI, outpatient) — renally dosed; check resistance locally",
        "Doxycycline: alternative oral agent for MSSA/MRSA SSTI; does NOT reliably treat bacteremia",
      ]},
      {label:"MSSA (Methicillin-Sensitive S. aureus)", col:T.blue, items:[
        "Nafcillin or oxacillin: IV first-line for MSSA bacteremia and endocarditis — superior to vancomycin",
        "Cefazolin: equivalent to nafcillin for MSSA bacteremia, better tolerated — preferred by most ID specialists",
        "Dicloxacillin or cephalexin: oral MSSA skin infections",
        "Do NOT use vancomycin for known MSSA — inferior outcomes, unnecessary broad coverage",
      ]},
      {label:"Streptococcal Coverage", col:T.teal, items:[
        "Group A Strep (S. pyogenes): penicillin is first-line — never resistant; amoxicillin = oral equivalent",
        "Necrotizing fasciitis (GAS): penicillin G + clindamycin (clindamycin inhibits toxin production)",
        "Strep pneumoniae (PNA/meningitis): amoxicillin-clavulanate for mild PNA; ceftriaxone for pneumococcal meningitis",
        "Enterococcus faecalis: ampicillin first-line; synergy with gentamicin for endocarditis",
        "Enterococcus faecium: VRE → daptomycin or linezolid; NOT ampicillin-susceptible",
      ]},
      {label:"C. diff (Clostridioides difficile)", col:T.yellow, items:[
        "Non-severe (WBC < 15k, Cr < 1.5): oral vancomycin 125mg QID × 10 days OR fidaxomicin 200mg BID × 10d",
        "Severe (WBC ≥ 15k or Cr ≥ 1.5): oral vancomycin 125mg QID × 10 days",
        "Fulminant (ileus, shock, megacolon): oral vanc + IV metronidazole; surgical consult",
        "Recurrent C. diff: fidaxomicin preferred; consider bezlotoxumab; fecal microbiota transplant for ≥ 2 recurrences",
        "NEVER treat asymptomatic C. diff toxin positive test — carrier state only, treatment increases recurrence",
      ]},
    ],
    pearl:"If MSSA is confirmed on culture, switch from vancomycin to cefazolin or nafcillin immediately. Vancomycin is inferior for MSSA and maintaining it 'because it's working' leads to worse outcomes. De-escalation is not optional — it's better medicine.",
  },
  {
    id:"abx_gram_neg", name:"Gram-Negative Coverage Guide", icon:"🔴", color:T.coral, cat:"abx",
    hook:"Know your local antibiogram — resistance rates vary dramatically by institution and geography",
    sections:[
      {label:"Empiric Gram-Negative Coverage", col:T.teal, items:[
        "Uncomplicated UTI (non-hospitalized): nitrofurantoin, TMP-SMX, or fosfomycin — check local resistance (<20%)",
        "Complicated UTI/pyelonephritis: ceftriaxone IV or cefpodoxime oral; FQ if susceptible and oral route available",
        "CAP gram-negatives: ceftriaxone + azithromycin OR respiratory FQ (levofloxacin/moxifloxacin) monotherapy",
        "Intra-abdominal: piperacillin-tazobactam or ceftriaxone + metronidazole; carbapenems for severe/ESBL risk",
        "Febrile neutropenia: cefepime or piperacillin-tazobactam; carbapenem if recent resistant organism or hemodynamically unstable",
      ]},
      {label:"Pseudomonas aeruginosa Coverage", col:T.red, items:[
        "Anti-pseudomonal β-lactams: pip-tazo, cefepime, ceftazidime, ceftolozane-tazobactam, aztreonam",
        "Carbapenems: imipenem, meropenem, doripenem — NOT ertapenem (no Pseudomonas coverage)",
        "FQ: ciprofloxacin (most potent oral anti-pseudomonal) — resistance increasing significantly",
        "Aminoglycosides: gentamicin, tobramycin, amikacin — use for synergy or resistant cases",
        "Ceftazidime-avibactam: PDR and MDR Pseudomonas — ID consult mandatory",
        "Double coverage debate: no survival benefit in most studies — monotherapy adequate if susceptible",
      ]},
      {label:"ESBL-Producing Enterobacteriaceae", col:T.orange, items:[
        "ESBL = Extended-Spectrum β-Lactamase — confers resistance to most cephalosporins and penicillins",
        "Risk factors: prior antibiotics (especially cephalosporins), healthcare exposure, travel to endemic regions, urinary catheters",
        "Carbapenem-sparing: ceftolozane-tazobactam, temocillin (Europe), or fosfomycin for uncomplicated UTI",
        "Treatment of choice: meropenem or ertapenem (ertapenem adequate for urinary/GI source, NOT for Pseudomonas)",
        "Cefepime: NOT reliable for ESBL despite susceptible MIC — inoculum effect; avoid for serious infections",
      ]},
      {label:"Carbapenem-Resistant Organisms (CRO)", col:T.purple, items:[
        "CRE (Carbapenem-Resistant Enterobacteriaceae): ceftazidime-avibactam, meropenem-vaborbactam, imipenem-cilastatin-relebactam",
        "CRAB (CR Acinetobacter): colistin, polymyxin B, ampicillin-sulbactam at high dose, tigecycline — all suboptimal",
        "CRPA (CR Pseudomonas): ceftolozane-tazobactam, ceftazidime-avibactam (for MBL: aztreonam-avibactam)",
        "All CRO: Infectious Disease consult is mandatory — these are complex treatment decisions",
        "Isolation: Contact Precautions + dedicated equipment; notify infection control immediately",
      ]},
    ],
    pearl:"Pip-tazo (Zosyn) does NOT reliably cover ESBL-producers despite in vitro susceptibility — the inoculum effect at infection sites overcomes the MIC. For bacteremia or severe infection with suspected ESBL: use carbapenem empirically, then de-escalate when susceptibilities return.",
  },
  // ── SYNDROMES ────────────────────────────────────────────────────
  {
    id:"uti", name:"Urinary Tract Infections", icon:"🫘", color:T.blue, cat:"syndrome",
    hook:"UA alone does NOT diagnose UTI — it must correlate with symptoms",
    sections:[
      {label:"Classification", col:T.teal, items:[
        "Uncomplicated (cystitis): dysuria, frequency, urgency — premenopausal non-pregnant women; no structural abnormality",
        "Complicated UTI: men, pregnancy, diabetes, immunocompromise, structural/functional abnormality, hospital-acquired",
        "Pyelonephritis: fever, CVA tenderness, systemic features — treat as complicated regardless of patient sex",
        "Catheter-associated UTI (CAUTI): pyuria alone does NOT indicate CAUTI — must have symptoms; remove catheter first",
        "Asymptomatic bacteriuria: treat ONLY in pregnancy and pre-urologic procedure — otherwise avoid (causes resistance)",
      ]},
      {label:"Treatment — Uncomplicated Cystitis", col:T.blue, items:[
        "TMP-SMX DS 160/800 mg BID × 3 days — if local E. coli resistance < 20%",
        "Nitrofurantoin 100 mg ER daily × 5 days — use only for cystitis (not pyelonephritis — does not achieve tissue levels)",
        "Fosfomycin 3g powder × single dose — lower efficacy but useful for MDR organisms",
        "FQ (ciprofloxacin/levofloxacin): effective but reserve — increasing resistance, risk of C. diff and tendinopathy",
        "Amoxicillin-clavulanate: inferior efficacy compared to above agents — use only when others contraindicated",
      ]},
      {label:"Treatment — Pyelonephritis", col:T.orange, items:[
        "Outpatient mild-moderate: oral FQ × 5–7 days (if susceptible) OR TMP-SMX × 14 days",
        "Inpatient: IV ceftriaxone 1–2g daily; transition to oral when afebrile and tolerating PO × total 7–10 days",
        "ESBL risk (recent hospitalization, prior resistant organism): carbapenem initially, then de-escalate",
        "Blood cultures: obtain in all pyelonephritis requiring admission",
        "Imaging: CT abdomen-pelvis if no improvement at 48–72h, obstruction suspected, or immunocompromised",
      ]},
      {label:"Urosepsis", col:T.red, items:[
        "Most common cause of sepsis in community-acquired infections — early recognition critical",
        "Empiric: ceftriaxone 2g IV q24h + clinical evaluation for ESBL risk factors",
        "Obstruction + infection (struvite stone, pyonephrosis): emergency drainage — antibiotics alone insufficient for source control",
        "Blood cultures and urine culture before antibiotics — these cultures drive days of directed therapy",
        "Duration: 7 days IV/oral if bacteremia; 14 days if slow clinical response or bacteremia persists",
      ]},
    ],
    pearl:"Asymptomatic bacteriuria causes more harm than good when treated in most populations — it selects for resistant organisms and provides no clinical benefit. The only exceptions are pregnancy (treat all) and before urologic procedures. Pyuria in a catheterized patient is expected — it is not UTI without symptoms.",
  },
  {
    id:"pneumonia", name:"Pneumonia (CAP / HAP / VAP)", icon:"🫁", color:T.cyan, cat:"syndrome",
    hook:"Severity drives treatment location: CURB-65 or PSI/PORT for outpatient vs inpatient vs ICU decision",
    sections:[
      {label:"CAP Outpatient (Low Severity)", col:T.teal, items:[
        "Healthy adult, no comorbidities: amoxicillin 1g TID × 5 days OR doxycycline 100mg BID × 5 days",
        "Comorbidities (COPD, DM, heart disease, immunocompromise): amox-clav + azithromycin OR respiratory FQ monotherapy",
        "Atypical coverage (Mycoplasma, Chlamydophila, Legionella): azithromycin or doxycycline provides coverage",
        "Legionella urinary antigen: obtain in all severe CAP, ICU admission, or outbreak context",
        "Influenza testing: obtain in-season — oseltamivir reduces duration and prevents secondary complications",
      ]},
      {label:"CAP Inpatient (Non-ICU)", col:T.blue, items:[
        "Standard: ceftriaxone 1–2g IV daily + azithromycin 500mg IV/PO daily",
        "Alternative (penicillin allergy, FQ preferred): respiratory FQ (levofloxacin 750mg or moxifloxacin 400mg)",
        "Duration: 5 days if good clinical response (afebrile × 48h, improving oxygenation, tolerating PO)",
        "Steroids (dexamethasone 6mg × 5 days): benefit in severe CAP requiring O2; COVID pneumonia",
        "Procalcitonin: baseline then q48h — values falling toward normal support early discontinuation",
      ]},
      {label:"Severe CAP / ICU", col:T.red, items:[
        "Beta-lactam + macrolide OR beta-lactam + respiratory FQ (do NOT use FQ monotherapy for ICU-level CAP)",
        "Pseudomonas risk (structural lung disease, bronchiectasis, prior Pseudomonas): anti-pseudomonal beta-lactam",
        "MRSA risk (post-influenza, necrotizing PNA, cavitation, IV drug use): add vancomycin or linezolid",
        "Vasopressors or intubation: cover Pseudomonas and MRSA empirically until cultures return",
        "Duration severe: 7 days; Pseudomonas PNA: 14 days minimum",
      ]},
      {label:"HAP / VAP", col:T.purple, items:[
        "HAP (onset ≥ 48h in hospital, not intubated): cover gram-negatives including Pseudomonas and MRSA if risk factors",
        "VAP (on ventilator ≥ 48h): piperacillin-tazobactam OR cefepime + vancomycin (add aminoglycoside if severe)",
        "Cultures: BAL or deep tracheal aspirate before antibiotics — drives de-escalation",
        "MRSA risk for HAP: prior MRSA colonization, IV antibiotics within 90 days, septic shock, ARDS",
        "Duration VAP: 7 days (8-day non-inferior to 15-day in major trials) — de-escalate at 3–5 days if cultures allow",
      ]},
    ],
    pearl:"The 'atypical' antibiotics (azithromycin, doxycycline) cover Legionella and Mycoplasma — which standard ceftriaxone alone does not. That's why CAP standard of care is dual therapy. Monotherapy with a respiratory FQ covers both typical and atypical — acceptable alternative when macrolide is contraindicated or concerning for QTc.",
  },
  {
    id:"meningitis", name:"Meningitis / Encephalitis", icon:"🧠", color:T.purple, cat:"syndrome",
    hook:"Do NOT delay antibiotics for CT or LP — start empiric therapy within 30 minutes of presentation",
    sections:[
      {label:"Empiric Treatment", col:T.red, items:[
        "Bacterial meningitis: ceftriaxone 2g IV q12h + vancomycin 25–30 mg/kg IV (MRSA/resistant pneumococcus)",
        "Add ampicillin 2g IV q4h if: age > 50, immunocompromised, alcoholism, pregnancy — covers Listeria",
        "Dexamethasone 0.15 mg/kg IV q6h × 4 days: START before or with first antibiotic dose — reduces mortality and hearing loss (Strep pneumoniae)",
        "HSV encephalitis: acyclovir 10 mg/kg IV q8h (renally adjusted) — start empirically if encephalitis suspected until PCR results",
        "Cryptococcal meningitis (HIV/immunocompromised): liposomal amphotericin B + flucytosine × 2 weeks induction",
      ]},
      {label:"CSF Interpretation", col:T.teal, items:[
        "Bacterial: WBC > 1000 (PMN predominance), protein > 100, glucose < 40 (or CSF/serum < 0.3), opening pressure elevated",
        "Viral: WBC 10–1000 (lymphocyte predominance), protein mildly elevated, glucose NORMAL",
        "TB/fungal: lymphocytic pleocytosis, protein very high, glucose very low, opening pressure high",
        "Xanthochromia (yellow CSF): subarachnoid hemorrhage — develops 2–4h after bleed; test tube 4 cell count for comparison",
        "Opening pressure: normal 10–20 cmH2O; > 25 suspicious for ICP elevation",
      ]},
      {label:"When CT Before LP?", col:T.orange, items:[
        "CT head BEFORE LP if: focal neurological deficit, papilledema, GCS < 13, new seizure, immunocompromised state",
        "If CT required: DO NOT WAIT — give antibiotics immediately (before CT and before LP)",
        "CT normal: does NOT exclude herniation risk (small subdural, diffuse cerebral edema not always visible)",
        "Blood cultures: draw 2 sets before antibiotics — positive in 50–80% of bacterial meningitis",
        "Negative CT + stable patient: LP can proceed with standard technique",
      ]},
      {label:"Key Organisms by Context", col:T.purple, items:[
        "Neonates: GBS, E. coli, Listeria — ampicillin + gentamicin or cefotaxime",
        "Young adults: N. meningitidis (meningococcus) — penicillin if susceptible; close contacts need prophylaxis (rifampin/ciprofloxacin)",
        "Elderly/immunocompromised: S. pneumoniae, Listeria, gram-negatives — add ampicillin",
        "Post-neurosurgical: Staph aureus, gram-negatives, Acinetobacter — vancomycin + cefepime or meropenem",
        "HIV (CD4 < 100): Cryptococcus, CMV, Toxoplasma — CrAg, PCR panel, MRI brain essential",
      ]},
    ],
    pearl:"Antibiotics do NOT significantly affect CSF cultures for the first 4–6 hours after administration. If CT or LP will be delayed, give antibiotics NOW. A sterilized CSF is always preferable to a delayed diagnosis and a preventable death. Time to antibiotics in bacterial meningitis is strongly associated with survival.",
  },
  {
    id:"skin_soft_tissue", name:"Skin & Soft Tissue Infections", icon:"🩹", color:T.orange, cat:"syndrome",
    hook:"Purulence = more likely S. aureus (possibly MRSA); non-purulent cellulitis = Strep predominates",
    sections:[
      {label:"Non-Purulent Cellulitis", col:T.teal, items:[
        "Organism: Group A Strep (S. pyogenes) in most cases — MRSA coverage usually NOT required",
        "Mild: cephalexin 500mg QID × 5 days OR dicloxacillin (if MSSA); amoxicillin is inferior",
        "Moderate (systemic symptoms, failure of oral therapy): IV cefazolin 2g q8h",
        "Mark borders with skin marker: document rate of progression — spreading past mark = treatment failure",
        "Differential: stasis dermatitis, lipodermatosclerosis, gout — both legs 'cellulitis' is rarely bilateral bacterial cellulitis",
      ]},
      {label:"Purulent SSTI (Furuncle / Carbuncle / Abscess)", col:T.orange, items:[
        "I&D is the primary treatment — antibiotics alone have limited efficacy for abscess without drainage",
        "Adjunctive antibiotics post-I&D: TMP-SMX DS BID × 5–7 days reduces recurrence and treatment failure",
        "Clindamycin: alternative to TMP-SMX for MRSA SSTI — check local inducible clindamycin resistance (D-zone test)",
        "Doxycycline: alternative option for MRSA SSTI oral therapy",
        "Recurrent abscess (≥ 3 episodes): decolonization protocol — mupirocin nasal + chlorhexidine wash × 5 days",
      ]},
      {label:"Necrotizing Fasciitis", col:T.red, items:[
        "Type I (polymicrobial): mixed aerobic/anaerobic — pip-tazo + vancomycin + clindamycin",
        "Type II (monomicrobial): Group A Strep — penicillin G + clindamycin (clindamycin inhibits toxin production at ribosomal level)",
        "Diagnosis: clinical — hard wood-like induration, pain disproportionate to exam, skin necrosis, gas on imaging",
        "LRINEC score: laboratory risk indicator — not sufficiently sensitive/specific to rule out; clinical suspicion overrides",
        "Treatment: SURGICAL EMERGENCY — debridement within 6–12h; every hour delay increases mortality 9%",
        "Hyperbaric O2: adjunctive benefit possible — do NOT delay surgery for HBO",
      ]},
      {label:"Diabetic Foot Infections", col:T.purple, items:[
        "Classify: non-limb-threatening (mild, no systemic findings) vs limb-threatening (deep tissue, bone involvement, systemic)",
        "Mild: oral amoxicillin-clavulanate or clindamycin — covers Strep, Staph, some anaerobes",
        "Moderate–severe: IV pip-tazo or amp-sulbactam; add vancomycin if prior MRSA or exposure risk",
        "Osteomyelitis: MRI is gold standard; probe-to-bone test (sensitivity 89%) — treat × 6 weeks minimum",
        "Vascular assessment: ABI before culture-guided antibiotics — revascularization improves outcomes dramatically",
        "Ampicillin-sulbactam (Unasyn) limitation: increasing E. coli resistance — verify local susceptibility rates",
      ]},
    ],
    pearl:"Non-purulent bilateral 'cellulitis' is almost never bilateral cellulitis. Bilateral lower extremity erythema in a patient with heart failure and edema is almost always dermatitis or venous stasis — antibiotics will not help and may harm. Classic cellulitis: unilateral, acute onset, tenderness, warmth, advancing erythema without central fluctuance.",
  },
  {
    id:"bacteremia", name:"Bacteremia & Endocarditis", icon:"❤️", color:T.red, cat:"syndrome",
    hook:"S. aureus bacteremia: TEE mandatory, 14-day minimum, ID consult required — no exceptions",
    sections:[
      {label:"Blood Culture Interpretation", col:T.teal, items:[
        "True bacteremia: same organism × 2 bottles from separate sites (especially for CoNS — 1 bottle = contaminant)",
        "S. aureus: ANY positive blood culture is true bacteremia — treat aggressively, repeat cultures q24–48h to confirm clearance",
        "Strep/Enterococcus: single positive is significant — source investigation and echocardiography",
        "CoNS (coagulase-negative Staph): ≥ 2 bottles same species/sensitivity = likely real; 1 bottle = likely contamination",
        "Follow-up cultures: mandatory for Staph aureus, Strep, Candida — must confirm clearance before shortening therapy",
      ]},
      {label:"S. aureus Bacteremia (SAB) Protocol", col:T.red, items:[
        "ID consult: all SAB — improves outcomes (lower mortality, fewer complications, shorter LOS)",
        "TEE: all patients capable of tolerating it — higher sensitivity for endocarditis (TTE alone misses 30–40%)",
        "Duration: uncomplicated SAB (no endocarditis, no metastatic focus, IVDU cleared at 72h) = 14 days minimum",
        "Complicated SAB (endocarditis, osteomyelitis, retained hardware) = 4–6 weeks",
        "MSSA: cefazolin or nafcillin — superior to vancomycin; switch from vancomycin as soon as MSSA confirmed",
        "Source control: remove all removable foreign bodies (IVs, lines, pacemaker wires if infected) before counting days",
      ]},
      {label:"Endocarditis Empiric Treatment", col:T.purple, items:[
        "Native valve (community-acquired, no IVDU): ampicillin-sulbactam + gentamicin OR ceftriaxone",
        "IVDU or healthcare exposure: vancomycin + gentamicin ± cefepime (Pseudomonas coverage)",
        "Prosthetic valve: vancomycin + rifampin + gentamicin (rifampin added after 3–5 days, not on day 1)",
        "Duke Criteria: definite (2 major or 1 major + 3 minor or 5 minor); possible (1 major + 1 minor or 3 minor)",
        "Surgical indications: heart failure, persistent bacteremia > 7d, large mobile vegetation > 10mm with emboli, perivalvular extension",
      ]},
      {label:"Central Line–Associated Bloodstream Infection (CLABSI)", col:T.orange, items:[
        "Remove the line: always required for S. aureus, Candida, non-tunnel CLABSI without compelling reason to retain",
        "Gram-positive (CoNS): vancomycin; tunneled catheter — can attempt salvage with antibiotics through line",
        "Gram-negative: target-directed therapy; Pseudomonas requires anti-pseudomonal agent based on susceptibilities",
        "Candida CLABSI: remove line + fluconazole (if susceptible) or micafungin/caspofungin; ophthalmology consult",
        "Duration: 14 days from first negative blood culture for most CLABSI; 4–6 weeks if endocarditis or osteomyelitis",
      ]},
    ],
    pearl:"Never attribute S. aureus bacteremia to a peripheral IV or 'contamination.' Even one bottle of S. aureus is real bacteremia that requires full investigation. The mortality of S. aureus endocarditis is 20–30% even with appropriate treatment — and 60–80% if missed or undertreated.",
  },
  {
    id:"intraabdominal", name:"Intra-Abdominal Infections", icon:"🟤", color:T.orange, cat:"syndrome",
    hook:"Source control is the priority — antibiotics are adjunctive to drainage and/or surgery",
    sections:[
      {label:"Community-Acquired IAI (Mild–Moderate)", col:T.teal, items:[
        "Coverage needed: gram-negative enteric rods (E. coli, Klebsiella) + anaerobes (Bacteroides fragilis)",
        "Mild-moderate (perforated appendicitis, diverticulitis): ceftriaxone + metronidazole OR amoxicillin-clavulanate",
        "Alternative: ertapenem monotherapy (covers ESBL risk patients without Pseudomonas exposure)",
        "Fluconazole: add only for perforated gastric/duodenal ulcer or immunocompromised — Candida coverage",
        "Duration: 4 days after source control (Solomkin IDSA 2010 data — NOT 7–10 days routinely)",
      ]},
      {label:"Severe / Healthcare-Associated IAI", col:T.red, items:[
        "Pseudomonas and ESBL risk: pip-tazo OR meropenem (if prior ESBL or carbapenem-resistant exposure)",
        "MRSA coverage (post-operative, prior MRSA): add vancomycin",
        "Tertiary peritonitis (recurrent after 2 surgeries): Candida, Enterococcus, coagulase-negative Staph — multidrug-resistant organisms",
        "Biliary source: cover gram-negatives + Enterococcus — pip-tazo or ampicillin + ceftriaxone + metronidazole",
        "Liver abscess (E. coli or Klebsiella): drainage + ceftriaxone; Entamoeba histolytica = metronidazole (no drainage)",
      ]},
      {label:"Spontaneous Bacterial Peritonitis (SBP)", col:T.orange, items:[
        "Diagnosis: ascitic PMN ≥ 250/mm³ regardless of total cell count — start antibiotics immediately",
        "Treatment: cefotaxime 2g IV q8h × 5 days OR ceftriaxone 2g IV daily × 5 days",
        "Inoculate blood culture bottles at bedside from ascitic fluid: increases sensitivity from 40% to 80%",
        "Albumin 1.5 g/kg at diagnosis + 1g/kg on day 3: reduces hepatorenal syndrome and mortality significantly",
        "Prophylaxis after first episode: norfloxacin 400mg daily or TMP-SMX DS 5x/week indefinitely until transplant",
        "Norfloxacin prophylaxis for GI bleeding + cirrhosis: reduces SBP incidence — start at admission",
      ]},
    ],
    pearl:"Source control for IAI (drainage of abscess, repair of perforation) is the primary treatment — antibiotics cannot sterilize undrained pus. For perforated appendicitis or diverticulitis with adequate source control: 4 days of antibiotics is as effective as 7–10 days. Extended duration without source control is not a substitute for drainage.",
  },
  // ── RESISTANT ORGANISMS ──────────────────────────────────────────
  {
    id:"mrsa_deep", name:"MRSA — Deep Tissue & Complex Infections", icon:"🦠", color:T.red, cat:"resistant",
    hook:"Vancomycin AUC/MIC monitoring, not trough monitoring, is the current standard of care",
    sections:[
      {label:"Vancomycin Monitoring (2020 ASHP/IDSA/SIDP)", col:T.red, items:[
        "AUC24/MIC target: 400–600 for serious MRSA infections (bacteremia, pneumonia, endocarditis, osteomyelitis)",
        "Loading dose: 25–30 mg/kg IV (based on actual body weight) — essential for rapid target attainment",
        "Maintenance: 15–20 mg/kg q8–12h (renal function dependent) — pharmacy AUC calculation preferred",
        "Avoid trough-only monitoring: trough 15–20 does NOT reliably achieve AUC target and drives nephrotoxicity",
        "Nephrotoxicity: 7–35% incidence; compounded by concurrent piperacillin-tazobactam (avoid combination if possible)",
      ]},
      {label:"Vancomycin Alternatives", col:T.orange, items:[
        "Daptomycin: bacteremia and right-sided endocarditis (NOT pneumonia); dose 6–10 mg/kg daily for serious infections",
        "Linezolid: pneumonia (superior tissue penetration vs vancomycin); skin infections; oral bioavailability ~100%",
        "Ceftaroline: 5th-generation cephalosporin — MRSA activity; used as adjunct in refractory bacteremia",
        "Oritavancin / Dalbavancin: long-acting lipoglycopeptides — single dose (oritavancin) or weekly (dalbavancin) for SSTI",
        "Tedizolid: oral/IV MRSA SSTI — once daily; fewer drug interactions than linezolid",
      ]},
      {label:"MRSA Colonization vs Infection", col:T.teal, items:[
        "Nares swab: positive = colonized (20–30% of healthcare workers, 50–80% of IVDU, dialysis patients)",
        "Colonization does NOT require treatment — treat only when causing clinical infection",
        "Decolonization: indicated for recurrent SSTI or pre-operatively in high-risk colonized patients",
        "Protocol: mupirocin 2% ointment bilateral nares BID × 5 days + chlorhexidine wash daily × 5 days",
        "Contact precautions: required for all MRSA-colonized and infected inpatients — gown and gloves",
      ]},
      {label:"MRSA in Special Populations", col:T.purple, items:[
        "IVDU + MRSA bacteremia: always assume endocarditis until proven otherwise — TEE required",
        "Hematogenous osteomyelitis: 4–6 weeks IV/highly bioavailable oral; MRI for extent mapping",
        "MRSA meningitis: vancomycin targeting AUC + rifampin (CSF penetration enhancement) OR TMP-SMX",
        "MRSA PVL-positive (Panton-Valentine leukocidin): aggressive necrotizing PNA/SSTI — clindamycin inhibits toxin",
        "MRSA in pregnancy: limited safety data; linezolid crosses placenta — ID consult strongly recommended",
      ]},
    ],
    pearl:"Vancomycin + pip-tazo is a nephrotoxic combination — the combination causes AKI at 3× the rate of either agent alone. If you need both MRSA and anti-pseudomonal gram-negative coverage, consider ceftaroline + cefepime or meropenem as alternatives to pip-tazo.",
  },
  {
    id:"esbl_cre", name:"ESBL / CRE / CRAB", icon:"🔬", color:T.red, cat:"resistant",
    hook:"Contact precautions + ID consult + facility notification — these are reportable in most jurisdictions",
    sections:[
      {label:"ESBL Recognition and Treatment", col:T.orange, items:[
        "ESBL phenotype: resistant to most penicillins and cephalosporins, variably susceptible to pip-tazo",
        "Most common: E. coli, Klebsiella pneumoniae, Proteus mirabilis",
        "Risk factors: prior antibiotic use (especially FQ and cephalosporins), healthcare exposure, travel to Asia/Middle East, urinary catheters",
        "Treatment: carbapenems first-line for serious infection (bacteremia, pneumonia); ertapenem = oral ESBL",
        "Carbapenem-sparing: fosfomycin or nitrofurantoin for uncomplicated UTI; ceftolozane-tazobactam for pyelonephritis",
        "Pip-tazo: NOT reliable for ESBL bacteremia despite in vitro susceptibility — inoculum effect, clinical failures documented",
      ]},
      {label:"CRE — Carbapenem-Resistant Enterobacteriaceae", col:T.red, items:[
        "Mechanisms: KPC (most common in US), NDM, OXA-48, VIM, IMP — mechanism determines treatment options",
        "KPC producers: ceftazidime-avibactam (most effective), meropenem-vaborbactam, imipenem-cilastatin-relebactam",
        "NDM and MBL producers: ceftazidime-avibactam + aztreonam combination; aztreonam-avibactam (emerging)",
        "OXA-48: ceftazidime-avibactam; avoid carbapenems which are the substrate for OXA-48",
        "Mortality: KPC bacteremia untreated or inadequately treated: 40–50% — ID consult is not optional",
        "Report to infection control: all CRE must be reported; contact precautions + dedicated equipment mandatory",
      ]},
      {label:"CRAB — Carbapenem-Resistant Acinetobacter", col:T.purple, items:[
        "Typically healthcare-associated: ICU, burn units, war wound infections",
        "Limited options: colistin (polymyxin E), polymyxin B, high-dose ampicillin-sulbactam, tigecycline",
        "Combination therapy preferred (double or triple) — no single agent reliably effective",
        "Colistin nephrotoxicity: significant — monitor CrCl every 48h; dose on CrCl",
        "Tigecycline: inferior serum levels (distributes to tissues) — NOT for bacteremia or urinary infections",
        "Cefiderocol: novel siderophore cephalosporin — activity against CRAB, CRE, CRPA — ID consult required",
      ]},
      {label:"VRE — Vancomycin-Resistant Enterococcus", col:T.yellow, items:[
        "E. faecium most common VRE — ampicillin resistant; E. faecalis VRE less common and ampicillin often susceptible",
        "Treatment VRE faecium: daptomycin (8–10 mg/kg for serious infections), linezolid, quinupristin-dalfopristin",
        "Endocarditis with VRE: daptomycin high dose + ampicillin (synergy even for ampicillin-resistant strains)",
        "UTI with VRE faecium: nitrofurantoin or fosfomycin if susceptible — ID consult for systemic VRE",
        "Contact precautions: required for all VRE patients; cohort VRE patients when possible",
      ]},
    ],
    pearl:"The biggest mistake with resistant organisms is delaying appropriate therapy while awaiting 'confirmatory cultures.' If a patient has risk factors for ESBL, CRE, or CRAB and is deteriorating, escalate empirically — it is safer to de-escalate than to undertreat. Every hour of inappropriate antibiotic therapy in resistant gram-negative bacteremia independently increases mortality.",
  },
  // ── HIV / OPPORTUNISTIC ──────────────────────────────────────────
  {
    id:"hiv_emergency", name:"HIV — Emergency Presentations", icon:"🔴", color:T.purple, cat:"hiv",
    hook:"CD4 count is the gatekeeper — all opportunistic infection risk stratifies against CD4 level",
    sections:[
      {label:"CD4-Stratified Risk", col:T.purple, items:[
        "CD4 > 500: similar risk to HIV-negative population — standard community-acquired infections dominate",
        "CD4 200–500: herpes zoster, bacterial infections more frequent, Kaposi's sarcoma, cervical dysplasia",
        "CD4 100–200: Pneumocystis jirovecii pneumonia (PCP) — highest risk zone; also Cryptococcus possible",
        "CD4 < 100: Toxoplasma encephalitis, Cryptococcal meningitis, CMV retinitis/colitis, MAC",
        "CD4 < 50: disseminated MAC (Mycobacterium avium complex), CMV, advanced KS, PML (JC virus)",
        "Any CD4 + viral load > 100k: high replication = high risk of OI even with 'normal' CD4 count",
      ]},
      {label:"PCP (Pneumocystis jirovecii Pneumonia)", col:T.blue, items:[
        "Presentation: subacute dyspnea, dry cough, fever, hypoxia; CXR bilateral interstitial infiltrates (or normal early)",
        "LDH: elevated (non-specific but correlated with disease severity)",
        "Diagnosis: bronchoscopy with BAL + PCP PCR or DFA stain (most sensitive); induced sputum less sensitive",
        "Treatment: TMP-SMX (high dose) 15–20 mg/kg/day of TMP component IV or oral × 21 days",
        "Steroids: prednisone 40 mg BID × 5d → 40 mg daily × 5d → 20 mg daily × 11d — if PaO2 < 70 or A-a gradient > 35",
        "Prophylaxis: TMP-SMX DS daily when CD4 < 200; dapsone or atovaquone if TMP-SMX intolerance",
      ]},
      {label:"Cryptococcal Meningitis", col:T.teal, items:[
        "Presentation: subacute headache, meningismus may be ABSENT, fever, AMS — CD4 almost always < 100",
        "Diagnosis: CrAg serum (sensitivity > 95%); CSF India ink, CrAg, culture; opening pressure often very high (> 25)",
        "Induction: liposomal amphotericin B 3–4 mg/kg IV daily + flucytosine 25 mg/kg QID × 14 days",
        "Consolidation: fluconazole 400 mg daily × 8 weeks; Maintenance: fluconazole 200 mg daily lifelong (until CD4 > 100 × 3 months on ART)",
        "ICP management: therapeutic LP daily if opening pressure > 25 cmH2O; lumbar drain if daily LP needed > 1 week",
        "ART: delay 4–6 weeks after antifungal initiation — starting ART too early causes IRIS paradoxical worsening",
      ]},
      {label:"Toxoplasma Encephalitis", col:T.coral, items:[
        "Presentation: focal neurological deficits, headache, fever, seizures — CD4 < 100 in virtually all cases",
        "MRI: multiple ring-enhancing lesions, basal ganglia preference, surrounding edema",
        "Empiric treatment if positive Toxoplasma IgG + compatible MRI: pyrimethamine + sulfadiazine + leucovorin",
        "Alternative: pyrimethamine + clindamycin + leucovorin (sulfa allergy)",
        "Response at 10–14 days: expect improvement on MRI — if no response, biopsy to exclude CNS lymphoma",
        "Prophylaxis: TMP-SMX DS daily (also covers PCP and Toxoplasma — preferred dual prophylaxis agent)",
      ]},
    ],
    pearl:"In an HIV patient with CD4 < 200 and acute dyspnea, assume PCP until proven otherwise — empiric TMP-SMX should start immediately. Waiting for bronchoscopy while the patient deteriorates on O2 is not the appropriate approach. Steroids are life-saving in moderate-severe PCP (PaO2 < 70) — do NOT withhold.",
  },
  // ── TRAVEL / TROPICAL ────────────────────────────────────────────
  {
    id:"malaria", name:"Malaria", icon:"🦟", color:T.green, cat:"tropical",
    hook:"Any fever + travel to endemic area = malaria until proven otherwise — test immediately",
    sections:[
      {label:"Diagnosis", col:T.teal, items:[
        "Thick and thin blood smear × 3 (q12–24h): gold standard — sensitivity improves with serial testing",
        "Rapid diagnostic test (RDT): antigen-based, fast, detects P. falciparum HRP2 — false negative in low parasitemia",
        "PCR: most sensitive, differentiates species — available at reference labs, takes 24–48h",
        "Species differentiation matters: P. falciparum = potentially lethal, requires urgent treatment; P. vivax/ovale = less severe but relapses",
        "Parasitemia: >5% = severe malaria regardless of clinical appearance — treat as complicated",
      ]},
      {label:"Uncomplicated P. falciparum Treatment", col:T.green, items:[
        "Artemether-lumefantrine (Coartem): 4 tablets BID × 3 days — first-line in most settings",
        "Atovaquone-proguanil (Malarone): 4 adult tablets daily × 3 days — alternative first-line",
        "Quinine + doxycycline: quinine 650 mg TID × 3-7 days + doxycycline 100 mg BID × 7 days — if artemisinin derivatives unavailable",
        "Chloroquine: resistant everywhere P. falciparum is prevalent except limited areas (Haiti, Central America west of Panama Canal)",
        "Primaquine: NOT for falciparum treatment — used for radical cure of P. vivax/ovale relapse prevention only",
      ]},
      {label:"Severe / Complicated Malaria", col:T.red, items:[
        "Criteria: impaired consciousness, seizures, severe anemia (Hgb < 7), respiratory distress, hyperparasitemia > 5%, hypoglycemia, AKI, jaundice, shock",
        "IV artesunate: first-line treatment for severe malaria — superior to quinine (CDC provides for compassionate use in US)",
        "IV quinidine gluconate: alternative if artesunate unavailable — cardiac monitoring required (QTc prolongation, hypoglycemia)",
        "Doxycycline 100 mg BID × 7 days: add after IV artesunate or quinidine when patient can take oral",
        "ICU care: frequent glucose monitoring (hypoglycemia), fluid balance (avoid pulmonary edema), cerebral malaria supportive care",
        "Exchange transfusion: controversial, not recommended by WHO — no proven benefit in severe malaria",
      ]},
      {label:"Non-falciparum Malaria", col:T.orange, items:[
        "P. vivax/ovale: chloroquine (if chloroquine-sensitive region) + primaquine for radical cure (G6PD screen first)",
        "P. malariae: chloroquine — no primaquine needed (no liver stage/no relapses)",
        "G6PD deficiency: primaquine causes hemolysis — screen before administration; weekly low-dose primaquine alternative",
        "Chloroquine-resistant P. vivax (Papua New Guinea, Indonesia, parts of South America): use artemisinin combination therapy",
      ]},
    ],
    pearl:"Thick blood smear sensitivity is 75–90% on a single test — a negative smear does NOT rule out malaria in a febrile traveler. Order 3 smears 12–24h apart. PCR should be sent simultaneously if clinical suspicion is high. A missed malaria can kill within 24–48 hours of presentation.",
  },
  {
    id:"traveler_diarrhea", name:"Traveler's Diarrhea & Enteric Infections", icon:"🌍", color:T.orange, cat:"tropical",
    hook:"Most traveler's diarrhea is self-limited — antibiotics only when symptoms are severe or systemic",
    sections:[
      {label:"Classification & Empiric Approach", col:T.teal, items:[
        "Mild (no blood, no fever, tolerable): loperamide + bismuth subsalicylate + hydration — no antibiotics",
        "Moderate (disabling symptoms, not blood): single-dose azithromycin 500–1000 mg OR single-dose rifaximin 600 mg",
        "Severe (high fever, bloody stool, dehydration, systemic): azithromycin 500 mg daily × 3 days",
        "Avoid FQ empirically: increasing FQ resistance in E. coli (especially Asia) — azithromycin is now preferred",
        "Rifaximin: non-absorbed antibiotic — effective for non-invasive E. coli diarrhea, not for Campylobacter or invasive pathogens",
      ]},
      {label:"Specific Pathogens", col:T.orange, items:[
        "Salmonella (non-typhi): most self-limited; antibiotics for severe disease, bacteremia, immunocompromised, age < 6 months",
        "Salmonella typhi (typhoid): azithromycin (mild), ceftriaxone IV (severe, resistant); fluoroquinolone resistance widespread",
        "Campylobacter: azithromycin 500 mg daily × 3 days (FQ resistance up to 90% in some Southeast Asian isolates)",
        "Shigella: azithromycin × 3 days; avoid antibiotics in Shiga-toxin-producing E. coli (STEC) — HUS risk may increase",
        "Cryptosporidium: nitazoxanide 500 mg BID × 3 days (immunocompetent); prolonged course for HIV patients",
        "Giardia: metronidazole 250 mg TID × 5 days OR tinidazole 2g single dose",
      ]},
      {label:"Typhoid (Enteric) Fever", col:T.red, items:[
        "Presentation: insidious fever, rose spots, hepatosplenomegaly, relative bradycardia ('Faget sign'), constipation more than diarrhea",
        "Complications: intestinal perforation, peritonitis (week 2–3), encephalopathy, hepatitis",
        "Diagnosis: blood cultures (50–60% sensitive); stool and urine cultures; bone marrow culture most sensitive",
        "Treatment mild: azithromycin 1g day 1, then 500 mg daily × 6 days (preferred for resistance)",
        "Treatment severe: ceftriaxone 2g IV daily × 7–14 days",
        "Dexamethasone 3 mg/kg × 1 then 1 mg/kg q6h × 48h: for severe enteric fever with altered consciousness or shock",
      ]},
    ],
    pearl:"In febrile returning travelers, the diagnostic triage is: malaria first (potentially lethal, time-sensitive), typhoid second (can be afebrile early), dengue third (classic fever pattern, thrombocytopenia, rash). The four most commonly missed diagnoses in returning travelers: malaria, typhoid, dengue, and rickettsial disease.",
  },
  // ── ISOLATION / PPE ──────────────────────────────────────────────
  {
    id:"isolation", name:"Isolation Precautions & PPE", icon:"🥼", color:T.yellow, cat:"ppe",
    hook:"Precautions are based on TRANSMISSION ROUTE — not diagnosis",
    sections:[
      {label:"Standard Precautions (All Patients)", col:T.teal, items:[
        "Hand hygiene: BEFORE and AFTER all patient contact — soap/water for C. diff (alcohol gel is NOT sporicidal)",
        "Gloves: for contact with blood, body fluids, mucous membranes, non-intact skin",
        "Gown: if clothing may contact patient or contaminated surfaces",
        "Eye protection/mask: if splash or spray of blood/body fluids is possible",
        "Respiratory hygiene: masks on patients with respiratory symptoms in waiting areas",
        "Safe sharps: no recapping — dispose in puncture-resistant containers immediately",
      ]},
      {label:"Contact Precautions", col:T.orange, items:[
        "Indications: MRSA, VRE, CRE, ESBL, Clostridioides difficile, scabies, wound infections with resistant organisms",
        "Requirements: gown + gloves on entry to patient room; dedicate equipment (stethoscope, BP cuff)",
        "Room: private preferred; cohort patients with same organism if private unavailable",
        "C. diff specific: soap and water (NOT alcohol gel) — spores resist alcohol; chlorine-based cleaning agents",
        "Duration: active infection/colonization until clearance is documented or discharge",
      ]},
      {label:"Droplet Precautions", col:T.blue, items:[
        "Indications: influenza, COVID-19 (+ airborne for aerosol-generating procedures), RSV, pertussis, meningococcal disease, mumps, rubella",
        "Droplet size: > 5 microns — travels ≤ 3 feet; settles rapidly (vs airborne that stays suspended)",
        "Requirements: surgical mask (for provider entering room or within 3 feet); private room preferred",
        "Meningococcal: contact precautions until 24h of effective antibiotics; prophylaxis for exposed contacts",
        "Patient transport: surgical mask on patient during transport",
      ]},
      {label:"Airborne Precautions", col:T.red, items:[
        "Indications: tuberculosis, measles, varicella, disseminated zoster, COVID-19 (AGP), SARS, MERS, monkeypox (if skin lesions)",
        "Requirements: N95 respirator (fit-tested) for provider; negative pressure room (12 air changes/hour)",
        "N95 vs surgical mask: N95 filters 95% of particles ≥ 0.3 microns; surgical mask is NOT equivalent for airborne",
        "TB precautions: maintain until 3 negative AFB smears on 3 consecutive days and clinical improvement on therapy",
        "AGP (aerosol-generating procedures): intubation, bronchoscopy, suction, CPAP/BiPAP, nebulizers — always airborne precautions",
      ]},
      {label:"Special Situations", col:T.purple, items:[
        "Ebola / VHF: full PPE (double gloves, impermeable gown, face shield, N95, leg covers, shoe covers) — ID and facility protocol mandatory",
        "Neutropenic patients: protective (reverse) isolation — HEPA filtered room, no fresh flowers/plants, cooked foods only",
        "Immunocompetent visitor with active URI: mask required; delay non-essential visits during respiratory illness season",
        "Monkeypox: contact + droplet precautions for respiratory lesions; airborne for rash with vesicles in oral/facial area",
        "Hand hygiene audit: 40–50% baseline compliance in most hospitals — highest-yield infection control intervention",
      ]},
    ],
    pearl:"Alcohol gel does NOT kill C. diff spores — this is not a preference, it's a fact. For C. diff rooms, soap and water is mandatory. Posting 'contact precautions' on a door means nothing if hand hygiene compliance drops inside the room. The most impactful infection control intervention remains thorough hand washing.",
  },
];

const MAIN_TABS = [
  {id:"syndromes", label:"ID Reference", icon:"🦠"},
  {id:"coach",     label:"AI ID Coach",  icon:"🤖"},
];

// ── Primitives ────────────────────────────────────────────────────
function AmbientBg() {
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0}}>
      <div style={{position:"absolute",top:"-15%",left:"-10%",width:"55%",height:"55%",background:"radial-gradient(circle,rgba(61,255,160,0.07) 0%,transparent 70%)"}}/>
      <div style={{position:"absolute",bottom:"-10%",right:"-5%",width:"50%",height:"50%",background:"radial-gradient(circle,rgba(0,229,192,0.07) 0%,transparent 70%)"}}/>
      <div style={{position:"absolute",top:"40%",left:"30%",width:"35%",height:"35%",background:"radial-gradient(circle,rgba(59,158,255,0.04) 0%,transparent 70%)"}}/>
    </div>
  );
}

function BulletRow({ text, color }) {
  return (
    <div style={{display:"flex",gap:7,alignItems:"flex-start",marginBottom:4}}>
      <span style={{color:color||T.teal,fontSize:8,marginTop:2,flexShrink:0}}>▸</span>
      <span style={{fontFamily:"DM Sans",fontSize:11,color:T.txt2,lineHeight:1.5}}>{text}</span>
    </div>
  );
}

function SyndromeCard({ syn, expanded, onToggle }) {
  return (
    <div style={{...glass,overflow:"hidden",cursor:"pointer",marginBottom:10,
      border:`1px solid ${expanded?syn.color+"55":"rgba(42,79,122,0.35)"}`,
      borderTop:`3px solid ${syn.color}`,transition:"border-color .15s"}}>
      <div onClick={onToggle}
        style={{padding:"13px 16px",display:"flex",alignItems:"center",gap:12,
          background:`linear-gradient(135deg,${syn.color}09,rgba(8,22,40,0.93))`}}>
        <span style={{fontSize:22,flexShrink:0}}>{syn.icon}</span>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontFamily:"Playfair Display",fontWeight:700,fontSize:15,color:syn.color}}>
            {syn.name}
          </div>
          <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt4,marginTop:2}}>{syn.hook}</div>
        </div>
        <span style={{color:T.txt4,fontSize:12,flexShrink:0}}>{expanded?"▲":"▼"}</span>
      </div>
      {expanded && (
        <div className="id-fade" style={{borderTop:"1px solid rgba(42,79,122,0.28)",padding:"14px 16px"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:10}}>
            {syn.sections.map((sec,i) => (
              <div key={i} style={{padding:"9px 12px",background:`${sec.col}0a`,
                border:`1px solid ${sec.col}25`,borderRadius:9}}>
                <div style={{fontFamily:"JetBrains Mono",fontSize:9,fontWeight:700,color:sec.col,
                  letterSpacing:1.5,textTransform:"uppercase",marginBottom:7}}>{sec.label}</div>
                {sec.items.map((item,j) => <BulletRow key={j} text={item} color={sec.col}/>)}
              </div>
            ))}
          </div>
          <div style={{padding:"9px 12px",background:`${T.yellow}09`,
            border:`1px solid ${T.yellow}28`,borderRadius:8}}>
            <span style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.yellow,
              letterSpacing:1,textTransform:"uppercase"}}>💎 Pearl: </span>
            <span style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.65}}>{syn.pearl}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────
export default function InfectiousDiseaseHub() {
  const navigate = useNavigate();
  const [tab, setTab]       = useState("syndromes");
  const [cat, setCat]       = useState("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(null);

  const [coachSyn,   setCoachSyn]   = useState(SYNDROMES[0].id);
  const [scenario,   setScenario]   = useState("");
  const [coaching,   setCoaching]   = useState(false);
  const [coachResult,setCoachResult]= useState(null);
  const [coachErr,   setCoachErr]   = useState(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return SYNDROMES.filter(s =>
      (cat==="all" || s.cat===cat) &&
      (!q || s.name.toLowerCase().includes(q) || s.hook.toLowerCase().includes(q))
    );
  }, [cat, search]);

  const runCoach = useCallback(async () => {
    if (!scenario.trim()) return;
    setCoaching(true); setCoachErr(null); setCoachResult(null);
    const syn = SYNDROMES.find(s=>s.id===coachSyn);
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-6", max_tokens:1500,
          system:`You are an Infectious Disease specialist attending physician providing real-time clinical guidance to an emergency medicine provider. Generate tailored, actionable advice for the specific clinical scenario provided related to ${syn?.name}. Respond ONLY in valid JSON (no markdown fences):
{
  "assessment": "One sentence clinical impression of this scenario",
  "immediateActions": ["action 1 — specific to THIS patient", "action 2", "action 3"],
  "empiricRegimen": "Specific antibiotic/antifungal/antiviral regimen with doses for THIS patient — account for any organ dysfunction or allergies mentioned",
  "diagnostics": ["specific test 1 for this scenario", "specific test 2", "test 3"],
  "watchFor": ["complication most likely in THIS patient", "second complication to anticipate", "third watch point"],
  "duration": "Expected treatment duration and when/how to de-escalate",
  "idConsult": "Yes or No and why — does this patient need ID consult and urgency",
  "pearl": "One clinical pearl specific to this exact scenario"
}`,
          messages:[{role:"user", content:`Topic: ${syn?.name}\n\nClinical Scenario: ${scenario}`}]
        })
      });
      const data = await resp.json();
      if (data.error) throw new Error(data.error.message);
      const raw = data.content?.find(b=>b.type==="text")?.text||"{}";
      setCoachResult(JSON.parse(raw.replace(/```json|```/g,"").trim()));
    } catch(e) {
      setCoachErr("Error: " + (e.message||"Check API connectivity"));
    } finally { setCoaching(false); }
  }, [scenario, coachSyn]);

  return (
    <div style={{fontFamily:"DM Sans, sans-serif",background:T.bg,minHeight:"100vh",
      position:"relative",overflow:"hidden",color:T.txt}}>
      <AmbientBg/>
      <div style={{position:"relative",zIndex:1,maxWidth:1200,margin:"0 auto",padding:"0 16px"}}>

        {/* Header */}
        <div style={{padding:"18px 0 14px"}}>
          <button onClick={() => navigate("/hub")}
            style={{marginBottom:10,display:"inline-flex",alignItems:"center",gap:7,
              fontFamily:"DM Sans",fontSize:12,fontWeight:600,
              background:"rgba(14,37,68,0.7)",border:"1px solid rgba(42,79,122,0.5)",
              borderRadius:8,padding:"5px 14px",color:T.txt3,cursor:"pointer",transition:"all .15s"}}
            onMouseEnter={e=>{e.currentTarget.style.color=T.txt2;e.currentTarget.style.borderColor="rgba(61,255,160,0.4)";}}
            onMouseLeave={e=>{e.currentTarget.style.color=T.txt3;e.currentTarget.style.borderColor="rgba(42,79,122,0.5)";}}>
            ← Back to Hub
          </button>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
            <div style={{backdropFilter:"blur(40px)",WebkitBackdropFilter:"blur(40px)",
              background:"rgba(5,15,30,0.9)",border:"1px solid rgba(42,79,122,0.6)",
              borderRadius:10,padding:"5px 12px",display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.green,letterSpacing:3}}>NOTRYA</span>
              <span style={{color:T.txt4,fontFamily:"JetBrains Mono",fontSize:10}}>/</span>
              <span style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.txt3,letterSpacing:2}}>INFECTIOUS DISEASE</span>
            </div>
            <div style={{height:1,flex:1,background:"linear-gradient(90deg,rgba(61,255,160,0.5),transparent)"}}/>
          </div>
          <h1 className="id-shimmer"
            style={{fontFamily:"Playfair Display",fontSize:"clamp(24px,4vw,40px)",fontWeight:900,letterSpacing:-1,lineHeight:1.1}}>
            Infectious Disease Hub
          </h1>
          <p style={{fontFamily:"DM Sans",fontSize:12,color:T.txt3,marginTop:4}}>
            Antibiotics · Syndromes · Resistant Organisms · HIV/Opportunistic · Travel Medicine · Isolation · AI ID Coach
          </p>
        </div>

        {/* Stat banner */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10,marginBottom:16}}>
          {[
            {label:"Topics",             value:`${SYNDROMES.length}`,   sub:"Syndromes & drug guides",  color:T.green },
            {label:"Antibiotic Guides",  value:"3",    sub:"Stewardship, Gram+/−",     color:T.teal  },
            {label:"Resistance Guides",  value:"2",    sub:"MRSA, ESBL/CRE/VRE",       color:T.red   },
            {label:"HIV/OI Protocols",   value:"1",    sub:"CD4-stratified guidance",   color:T.purple},
            {label:"Travel Medicine",    value:"2",    sub:"Malaria, enteric fever",     color:T.orange},
            {label:"AI ID Coach",        value:"Live", sub:"Patient-specific advice",   color:T.blue  },
          ].map((b,i) => (
            <div key={i} style={{...glass,padding:"9px 13px",borderLeft:`3px solid ${b.color}`,
              background:`linear-gradient(135deg,${b.color}12,rgba(8,22,40,0.8))`,borderRadius:10}}>
              <div style={{fontFamily:"JetBrains Mono",fontSize:14,fontWeight:700,color:b.color,lineHeight:1}}>{b.value}</div>
              <div style={{fontFamily:"DM Sans",fontWeight:600,color:T.txt,fontSize:10,margin:"3px 0"}}>{b.label}</div>
              <div style={{fontFamily:"DM Sans",fontSize:9,color:T.txt4}}>{b.sub}</div>
            </div>
          ))}
        </div>

        {/* Main tabs */}
        <div style={{...glass,padding:"6px",display:"flex",gap:5,marginBottom:16}}>
          {MAIN_TABS.map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{flex:"1 1 auto",fontFamily:"DM Sans",fontWeight:600,fontSize:12,padding:"9px 8px",
                borderRadius:10,
                border:`1px solid ${tab===t.id?"rgba(61,255,160,0.5)":"transparent"}`,
                background:tab===t.id?"linear-gradient(135deg,rgba(61,255,160,0.18),rgba(61,255,160,0.07))":"transparent",
                color:tab===t.id?T.green:T.txt3,
                cursor:"pointer",textAlign:"center",transition:"all .15s"}}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ═══ SYNDROMES TAB ═══ */}
        {tab==="syndromes" && (
          <div className="id-fade">
            {/* Category filter + search */}
            <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
              <div style={{display:"flex",gap:5,flexWrap:"wrap",flex:1}}>
                {CATS.map(c => (
                  <button key={c.id} onClick={()=>setCat(c.id)}
                    style={{fontFamily:"JetBrains Mono",fontSize:9,fontWeight:700,padding:"4px 12px",
                      borderRadius:20,cursor:"pointer",textTransform:"uppercase",letterSpacing:1,
                      border:`1px solid ${cat===c.id?c.color+"88":c.color+"33"}`,
                      background:cat===c.id?`${c.color}20`:`${c.color}08`,
                      color:cat===c.id?c.color:T.txt3,transition:"all .15s"}}>
                    {c.label}
                  </button>
                ))}
              </div>
              <input type="text" value={search} onChange={e=>setSearch(e.target.value)}
                placeholder="Search topics..."
                style={{background:"rgba(14,37,68,0.8)",border:`1px solid ${search?"rgba(61,255,160,0.5)":"rgba(42,79,122,0.35)"}`,
                  borderRadius:20,padding:"5px 14px",outline:"none",
                  fontFamily:"DM Sans",fontSize:12,color:T.txt,width:180}}/>
            </div>
            <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,
              letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>
              {filtered.length} topic{filtered.length!==1?"s":""} — tap to expand
            </div>
            {filtered.map(syn => (
              <SyndromeCard key={syn.id} syn={syn}
                expanded={expanded===syn.id}
                onToggle={()=>setExpanded(p=>p===syn.id?null:syn.id)}/>
            ))}
            {filtered.length===0 && (
              <div style={{...glass,padding:"32px",textAlign:"center"}}>
                <div style={{fontSize:28,marginBottom:8}}>🔍</div>
                <div style={{fontFamily:"DM Sans",fontSize:13,color:T.txt3}}>No topics match &ldquo;{search}&rdquo;</div>
              </div>
            )}
          </div>
        )}

        {/* ═══ AI COACH TAB ═══ */}
        {tab==="coach" && (
          <div className="id-fade">
            <div style={{padding:"10px 14px",background:"rgba(61,255,160,0.07)",
              border:"1px solid rgba(61,255,160,0.2)",borderRadius:10,marginBottom:14,
              fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.7}}>
              🤖 <strong style={{color:T.green}}>AI ID Coach:</strong> Select a topic, describe your patient, and get
              real-time ID specialist–level guidance — empiric regimen with doses, diagnostics, complications to
              anticipate, and whether an ID consult is needed for this specific case.
            </div>

            <div style={{...glass,padding:"14px 16px",marginBottom:12}}>
              {/* Topic selector */}
              <div style={{marginBottom:12}}>
                <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,
                  letterSpacing:1.5,textTransform:"uppercase",marginBottom:6}}>Topic</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                  {SYNDROMES.map(s => (
                    <button key={s.id} onClick={()=>{setCoachSyn(s.id);setCoachResult(null);}}
                      style={{fontFamily:"DM Sans",fontSize:10,fontWeight:600,
                        padding:"3px 10px",borderRadius:20,cursor:"pointer",transition:"all .12s",
                        border:`1px solid ${coachSyn===s.id?s.color+"88":s.color+"30"}`,
                        background:coachSyn===s.id?`${s.color}20`:`${s.color}06`,
                        color:coachSyn===s.id?s.color:T.txt4,whiteSpace:"nowrap"}}>
                      {s.icon} {s.name.length>28?s.name.slice(0,26)+"…":s.name}
                    </button>
                  ))}
                </div>
              </div>
              {/* Scenario */}
              <div style={{marginBottom:10}}>
                <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,
                  letterSpacing:1.5,textTransform:"uppercase",marginBottom:6}}>Clinical Scenario</div>
                <textarea value={scenario} onChange={e=>setScenario(e.target.value)}
                  placeholder={"Describe the patient in detail — organism if known, allergies, organ function, prior antibiotics, clinical trajectory.\n\nExample: '68yo male, CKD stage 3 (CrCl 28), penicillin allergy (anaphylaxis), presented with 3 days of dysuria and flank pain, T 39.2°C, WBC 18, creatinine 2.1 (baseline 1.6). UA: >50 WBC, many gram-negative rods. No recent hospitalizations. Started ceftriaxone — urine culture growing E. coli, sensitivities pending.'"}
                  rows={5}
                  style={{width:"100%",background:"rgba(14,37,68,0.7)",
                    border:`1px solid ${scenario?"rgba(61,255,160,0.45)":"rgba(42,79,122,0.3)"}`,
                    borderRadius:8,padding:"10px 12px",outline:"none",resize:"vertical",
                    fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.65}}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontFamily:"DM Sans",fontSize:11,color:T.txt4}}>
                  Topic: <strong style={{color:SYNDROMES.find(s=>s.id===coachSyn)?.color}}>
                    {SYNDROMES.find(s=>s.id===coachSyn)?.name}
                  </strong>
                </span>
                <button onClick={runCoach} disabled={coaching||!scenario.trim()}
                  style={{fontFamily:"DM Sans",fontWeight:700,fontSize:12,padding:"8px 22px",
                    borderRadius:10,cursor:coaching||!scenario.trim()?"not-allowed":"pointer",
                    border:`1px solid ${!scenario.trim()?"rgba(42,79,122,0.3)":"rgba(61,255,160,0.5)"}`,
                    background:!scenario.trim()?"rgba(42,79,122,0.15)":"linear-gradient(135deg,rgba(61,255,160,0.22),rgba(61,255,160,0.08))",
                    color:!scenario.trim()?T.txt4:T.green,transition:"all .15s"}}>
                  {coaching?<><span className="id-spin">⚙</span> Consulting...</>:"🦠 Get ID Guidance"}
                </button>
              </div>
            </div>

            {coachErr && (
              <div style={{padding:"10px 14px",background:"rgba(255,68,68,0.1)",
                border:"1px solid rgba(255,68,68,0.3)",borderRadius:10,marginBottom:12,
                fontFamily:"DM Sans",fontSize:12,color:T.coral}}>{coachErr}</div>
            )}

            {coaching && (
              <div style={{...glass,padding:"32px",textAlign:"center"}}>
                <span className="id-spin" style={{fontSize:32,display:"block",marginBottom:10}}>⚙</span>
                <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2}}>
                  Consulting ID specialist for {SYNDROMES.find(s=>s.id===coachSyn)?.name}...
                </div>
              </div>
            )}

            {coachResult && !coaching && (
              <div className="id-fade">
                {/* Assessment */}
                {coachResult.assessment && (
                  <div style={{...glass,padding:"11px 14px",marginBottom:10,
                    border:"1px solid rgba(61,255,160,0.3)",
                    background:"linear-gradient(135deg,rgba(61,255,160,0.07),rgba(8,22,40,0.93))"}}>
                    <span style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.green,
                      letterSpacing:1.5,textTransform:"uppercase"}}>🩺 Clinical Assessment: </span>
                    <span style={{fontFamily:"DM Sans",fontSize:13,color:T.txt,fontWeight:600}}>{coachResult.assessment}</span>
                  </div>
                )}

                {/* Empiric Regimen */}
                {coachResult.empiricRegimen && (
                  <div style={{...glass,padding:"12px 14px",marginBottom:10,
                    border:"1px solid rgba(0,229,192,0.3)",
                    background:"linear-gradient(135deg,rgba(0,229,192,0.07),rgba(8,22,40,0.93))"}}>
                    <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.teal,
                      letterSpacing:2,textTransform:"uppercase",marginBottom:7}}>💊 Empiric Regimen</div>
                    <div style={{fontFamily:"DM Sans",fontSize:13,color:T.txt,lineHeight:1.65,fontStyle:"italic"}}>
                      {coachResult.empiricRegimen}
                    </div>
                  </div>
                )}

                {/* 3-column grid */}
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:10,marginBottom:10}}>
                  {coachResult.immediateActions?.length>0 && (
                    <div style={{...glass,padding:"12px 14px",border:"1px solid rgba(255,159,67,0.25)"}}>
                      <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.orange,
                        letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>⚡ Immediate Actions</div>
                      {coachResult.immediateActions.map((a,i)=>(
                        <div key={i} style={{display:"flex",gap:8,alignItems:"flex-start",marginBottom:5}}>
                          <span style={{fontFamily:"JetBrains Mono",fontSize:10,fontWeight:700,
                            color:T.orange,flexShrink:0,minWidth:16}}>{i+1}.</span>
                          <span style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.5}}>{a}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {coachResult.diagnostics?.length>0 && (
                    <div style={{...glass,padding:"12px 14px",border:"1px solid rgba(59,158,255,0.25)"}}>
                      <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.blue,
                        letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>🔬 Diagnostics</div>
                      {coachResult.diagnostics.map((d,i)=>(
                        <div key={i} style={{display:"flex",gap:7,alignItems:"flex-start",marginBottom:5}}>
                          <span style={{color:T.blue,fontSize:8,marginTop:3,flexShrink:0}}>▸</span>
                          <span style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.5}}>{d}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {coachResult.watchFor?.length>0 && (
                    <div style={{...glass,padding:"12px 14px",border:"1px solid rgba(255,68,68,0.25)"}}>
                      <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.red,
                        letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>⚠️ Watch For</div>
                      {coachResult.watchFor.map((w,i)=>(
                        <div key={i} style={{display:"flex",gap:7,alignItems:"flex-start",marginBottom:5}}>
                          <span style={{color:T.red,fontSize:8,marginTop:3,flexShrink:0}}>▸</span>
                          <span style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.5}}>{w}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Duration + ID Consult */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                  {coachResult.duration && (
                    <div style={{...glass,padding:"11px 14px",border:"1px solid rgba(61,255,160,0.25)"}}>
                      <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.green,
                        letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>📅 Duration & De-escalation</div>
                      <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.6}}>{coachResult.duration}</div>
                    </div>
                  )}
                  {coachResult.idConsult && (
                    <div style={{...glass,padding:"11px 14px",border:"1px solid rgba(155,109,255,0.25)"}}>
                      <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.purple,
                        letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>📡 ID Consult</div>
                      <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.6}}>{coachResult.idConsult}</div>
                    </div>
                  )}
                </div>

                {/* Pearl */}
                {coachResult.pearl && (
                  <div style={{padding:"9px 13px",background:`${T.yellow}09`,
                    border:`1px solid ${T.yellow}28`,borderRadius:10,marginBottom:14}}>
                    <span style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.yellow,
                      letterSpacing:1,textTransform:"uppercase"}}>💎 Pearl: </span>
                    <span style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2}}>{coachResult.pearl}</span>
                  </div>
                )}

                <div style={{textAlign:"center",marginBottom:16}}>
                  <button onClick={runCoach}
                    style={{fontFamily:"DM Sans",fontWeight:600,fontSize:12,padding:"7px 20px",
                      borderRadius:10,cursor:"pointer",border:"1px solid rgba(42,79,122,0.4)",
                      background:"transparent",color:T.txt3}}>
                    ↺ Update Scenario and Re-consult
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{textAlign:"center",paddingBottom:24,paddingTop:14}}>
          <span style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,letterSpacing:1.5}}>
            NOTRYA ID HUB · IDSA · ASHP · CDC · WHO GUIDELINES · AI FOR EDUCATIONAL SUPPORT ONLY · VERIFY WITH LOCAL ANTIBIOGRAM AND INSTITUTIONAL PROTOCOLS
          </span>
        </div>
      </div>
    </div>
  );
}