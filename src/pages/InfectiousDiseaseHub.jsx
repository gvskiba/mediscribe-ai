import { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NotryaPatientBar from "@/components/HubHeader/NotryaPatientBar";

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
  backdropsFilter:"blur(24px) saturate(200%)",
  WebkitBackdropFilter:"blur(24px) saturate(200%)",
  background:"rgba(8,22,40,0.78)",
  border:"1px solid rgba(42,79,122,0.35)",
  borderRadius:14,
};

const SYNDROMES = [
  {id:"abx_overview", name:"Antibiotic Stewardship Principles", icon:"🎯", color:T.green, cat:"abx",
    hook:"Right drug, right dose, right duration — de-escalate as soon as possible",
    sections:[
      {label:"Core Stewardship Principles", col:T.teal, items:[
        "Blood cultures ≥ 2 before antibiotics when possible – do NOT delay antibiotics for cultures in septic shock",
        "Narrow spectrum = fewer side effects, less resistance selection, less C. diff – always de-escalate",
        "Duration matters: most infections do NOT require 14 days – see syndrome-specific recommendations",
        "Re-evaluate at 48–72s h: culture results back, clinical trajectory clear – adjust or stop accordingly",
        "Biomarkers: procalcitonin-guided therapy reduces duration by 1.5–3 days in respiratory infections",
      ]},
      {label:"Penicillin Allergy Assessment", col:T.yellow, items:[
        "90% of reported penicillin allergics can safely receive penicillins – true IgE allergy: <1%",
        "Cross-reactivity with cephalosporins: ~1–3% (structural similarity of R1 side chain – not 'penicillin class')",
        "Low-risk history (rash >10y ago, GI side effects, family report): proceed with cephalosporin directly",
        "Moderate risk (urticaria, pruritis): skin test or graded challenge under observation",
        "High risk (anaphylaxis, angioedema): allergy consult; use aztreonam (no cross-reactivity) or carbapenems cautiously",
        "NEVER withhold first-line antibiotics for sepsis based on remote/vague penicillin allergy history",
      ]},
      {label:"Key Antibiotic Classes", col:T.blue, items:[
        "β-Lactams: penicillins → aminopenicillins → anti-staph → anti-pseudomonal; spectrum widens down the list",
        "Cephalosporins 1st–5th gen: 1st = skin/gram-pos; 3rd = CSF-penetrating; 4th/5th = MRSA/pseudomonal coverage",
        "Carbapenems (ERTAPENEM has NO Pseudomonas coverage – critical distinction in ED)",
        "Fluoroquinolones: avoid empirically for UTI in areas with >20% resistance; reserve for atypical PNA, bone/joint",
        "Vancomycin: oral = C. diff only (not absorbed); IV = MRSA/serious gram-positive infections",
        "Metronidazole: anaerobes, C. diff (oral preferred for C. diff), BV, Trichomonas",
      ]},
      {label:"Duration Evidence (Days)", col:T.green, items:[
        "Uncomplicated UTI (women): 3–5 days trimethoprim-sulfamethoxazole or 3 days FQ or 5 days nitrofurantoin",
        "CAP outpatient: 5 days (amoxicillin-clavulanate); inpatient non-severe: 5 days; severe/ICU: 7 days",
        "Uncomplicated skin/soft tissue (cellulitis): 5 days – extend only if not improving",
        "Bacteremia (gram-negative, no source): 7 days; Staph aureus bacteremia: minimum 14 days (TEE to exclude endocarditis)",
        "Endocarditis: 4–6 weeks depending on valve type and organism – never less",
        "Osteomyelitis: 6 weeks IV/highly bioavailable oral after source control",
      ]},
    ],
    pearl:"The most common antibiotic error in the ED is starting vancomycin for every fever. MRSA risk factors matter: recent hospitalization, IV drug use, hemodyalysis, prior MRSA. De-escalation is not optional – it's better medicine.",
  },
  {id:"uti", name:"Urinary Tract Infections", icon:"🚽", color:T.blue, cat:"syndrome",
    hook:"UA alone does NOT diagnose UTI – it must correlate with symptoms",
    sections:[
      {label:"Classification", col:T.teal, items:[
        "Uncomplicated (cystitis): dysuria, frequency, urgency, urge incontinence – premenopausal non-pregnant women; no structural abnormality",
        "Complicated UTI: men, pregnancy, diabetes, immunocompromise, structural/functional abnormality, hospital-acquired",
        "Pyelonephritis: fever, CVA tenderness, systemic features – treat as complicated regardless of patient sex",
        "Catheter-associated UTI (CAUTI): pyuria alone does NOT indicate CAUTI – must have symptoms; remove catheter first",
        "Asymptomatic bacteriuria: treat ONLY in pregnancy and pre-urologic procedure – otherwise avoid (causes resistance)",
      ]},
      {label:"Treatment – Uncomplicated Cystitis", col:T.blue, items:[
        "TMP-SMX DS 160/800 mg BID × 3 days – if local E. coli resistance <20%",
        "Nitrofurantoin 100 mg ER daily × 5 days – use only for cystitis (not pyelonephritis – does not achieve tissue levels)",
        "Fosfomycin 3g powder × single dose – lower efficacy but useful for MDR organisms",
        "FQ (ciprofloxacin/levofloxacin): effective but reserve – increasing resistance, risk of C. diff and tendinopathy",
        "Amoxicillin-clavulanate: inferior efficacy compared to above agents – use only when others contraindicated",
      ]},
      {label:"Treatment – Pyelonephritis", col:T.orange, items:[
        "Outpatient mild-moderate: oral FQ × 7 days (if susceptible) OR TMP-SMX × 14 days",
        "Inpatient: IV ceftriaxone 1–2g daily; transition to oral when afebrile and tolerating PO × total 7–10 days",
        "ESBL risk (recent hospitalization, prior resistant organism): carbapenems initially, then de-escalate",
        "Blood cultures and urine culture before antibiotics – these cultures drive de-escalation",
        "Imaging: CT abdomen-pelvis if no improvement at 48–72h, obstruction suspected, or immunocompromised",
      ]},
      {label:"Urosepsis", col:T.red, items:[
        "Most common cause of sepsis in community-acquired infections – early recognition critical",
        "Empiric: ceftriaxone 2g IV q24h + clinical evaluation for ESBL risk factors",
        "Obstruction + infection (stuvite stone, pyelonephritis) = surgical emergency – drainage before antibiotics adequate for source control",
        "Blood cultures and urine culture before antibiotics – these cultures drive de-escalation and days of directed therapy",
        "Duration: 7 days IV/oral if bacteremia; 14 days if slow clinical response or bacteremia persists",
      ]},
    ],
    pearl:"Asymptomatic bacteriuria causes more harm than good when treated in most populations – it selects for resistant organisms and provides no clinical benefit. The only exceptions are pregnancy (treat all) and before urologic procedures (treat all).",
  },
  {id:"pneumonia", name:"Pneumonia (CAP / HAP / VAP)", icon:"🫁", color:T.cyan, cat:"syndrome",
    hook:"Severity drives treatment location: CURB-65 or PSI/PORT for outpatient vs inpatient vs ICU decision",
    sections:[
      {label:"CAP Outpatient (Low Severity)", col:T.teal, items:[
        "Healthy adult, no comorbidities: amoxicillin 1g TID × 5 days OR doxycycline 100mg BID × 5 days",
        "Comorbidities (COPD, DM, heart disease, immunocompromise): amox-clav + azithromycin OR respiratory FQ monotherapy",
        "Atypical coverage (Mycoplasma, Chlamydophila, Legionella): azithromycin or doxycycline provides coverage",
        "Legionella urinary antigen: obtain in all severe CAP, ICU admission, or outbreak context",
        "Influenza testing: obtain in-season – oseltamivir reduces duration and prevents secondary complications",
      ]},
      {label:"CAP Inpatient (Non-ICU)", col:T.blue, items:[
        "Standard: ceftriaxone 1–2g IV daily + azithromycin 500mg IV/PO daily",
        "Alternative (penicillin allergy, FQ preferred): respiratory FQ (levofloxacin 750mg or moxifloxacin 400mg)",
        "Duration: 5 days if good clinical response (afebrile ≥48h, improving oxygenation, tolerating PO)",
        "Steroids (dexamethasone 6mg × 5 days): benefit in severe CAP requiring O2; COVID pneumonia",
        "Procalcitonin: baseline then q48h – values falling toward normal support early discontinuation",
      ]},
      {label:"Severe CAP / ICU", col:T.red, items:[
        "Beta-lactam + macrolide OR beta-lactam + respiratory FQ (do NOT use FQ monotherapy for ICU-level CAP)",
        "Pseudomonas risk (structural lung disease, bronchiectasis, prior Pseudomonas): anti-pseudomonal beta-lactam",
        "MRSA risk (post-influenza, necrotizing PNA, cavity, IV drug use): add vancomycin or linezolid",
        "Vasopressors or intubation: cover Pseudomonas and MRSA empirically until cultures return",
        "Duration severe: 7 days; Pseudomonas PNA: 14 days minimum",
      ]},
      {label:"HAP / VAP", col:T.purple, items:[
        "HAP (onset ≥48h in hospital, no intubation): cover gram-negatives including Pseudomonas and MRSA if risk factors",
        "VAP (on ventilator ≥48h): pipercillin-tazobactam OR cefepime + vancomycin (add aminoglycoside if severe)",
        "Cultures: BAL or deep tracheal aspirate before antibiotics – drive de-escalation",
        "MRSA risk for HAP: prior MRSA colonization, IV antibiotics within 90 days, septic shock, ARDS",
        "Duration VAP: 7 days (8-day non-inferior to 15-day in major trials) – de-escalate at 3–5 days if cultures allow",
      ]},
    ],
    pearl:"The 'atypical' antibiotics (azithromycin, doxycycline) cover Legionella and Mycoplasma – which standard ceftriaxone alone does not. That's why CAP standard of care is dual therapy. Monotherapy with a respiratory FQ covers both typical and atypical – acceptable alternative when macrolide is contraindicated or concerning for QTc.",
  },
  {id:"meningitis", name:"Meningitis / Encephalitis", icon:"🧠", color:T.purple, cat:"syndrome",
    hook:"Do NOT delay antibiotics for CT or LP – start empiric therapy within 30 minutes of presentation",
    sections:[
      {label:"Empiric Treatment", col:T.red, items:[
        "Bacterial meningitis: ceftriaxone 2g IV q12h + vancomycin 25–33 mg/kg IV (MRSA/resistant pneumococcus)",
        "Add ampicillin 2g IV q4h if: age >50, immunocompromised, alcoholism, pregnancy – covers Listeria",
        "Dexamethasone 0.15 mg/kg IV q6h × 4 days: START before or with first antibiotic dose – reduces mortality and hearing loss (Strep pneumoniae)",
        "HSV encephalitis: acyclovir 10 mg/kg IV q8h (renally adjusted) – start empirically if encephalitis suspected until PCR results",
        "Cryptococcal meningitis (HI HIV/immunocompromised): liposomal amphotericin B + fluconazole × 2 weeks induction",
      ]},
      {label:"CSF Interpretation", col:T.teal, items:[
        "Bacterial: WBC >1000 (PMN predominance), protein >100, glucose <40 (or CSF/serum <0.3), opening pressure elevated",
        "Viral: WBC 10–1000 (lymphocyte predominance), protein mildly elevated, glucose NORMAL",
        "TB/fungal: lymphocytic pleocytosis, protein very high, glucose very low, opening pressure high",
        "Xanthochromia (yellow CSF): subarachnoid hemorrhage – develops 2–4h after bleed; test tube 4 cell count for comparison",
        "Opening pressure: normal 15–20 cmH2O; >25 suspicious for ICP elevation or herniaton risk",
      ]},
      {label:"When CT Before LP?", col:T.orange, items:[
        "CT head BEFORE LP if: focal neurological deficit, papilledema, GCS <13, new seizure, immunocompromised state",
        "If CT required: DO NOT WAIT – give antibiotics immediately (before CT and before LP)",
        "CT normal: does NOT exclude herniation risk (small subdural, diffuse cerebral edema not always visible)",
        "Blood cultures: draw 2 sets before antibiotics – positive in 50–80% of bacterial meningitis",
        "Negative CT + stable patient: LP can proceed with standard technique",
      ]},
      {label:"Key Organisms by Context", col:T.purple, items:[
        "Neonates: GBS, E. coli, Listeria – ampicillin + gentamicin or cefotaxime",
        "Young adults: N. meningitidis (meningococcus) – penicillin if susceptible; close contacts need prophylaxis (rifampin/ciprofloxacin)",
        "Elderly/immunocompromised: S. pneumoniae, Listeria, gram-negatives – add ampicillin",
        "Post-neurosurgical: Staph aureus, gram-negatives, Acinetobacter – vancomycin + cefepime or meropenem",
        "HIV (CD4 <100): Cryptococcus, CMV, Toxoplasma – CrAg, PCR panel, MRI brain essential",
      ]},
    ],
    pearl:"Antibiotics do NOT significantly affect CSF culture results for the first 5–6 hours after administration. If CT or LP will be delayed, give antibiotics NOW. A sterilized CSF is always preferable to a delayed diagnosis and a preventable death. Time to antibiotics in bacterial meningitis is strongly associated with survival.",
  },
  {id:"skin_soft_tissue", name:"Skin & Soft Tissue Infections", icon:"🩹", color:T.orange, cat:"syndrome",
    hook:"Purulence = more likely Staph aureus (possibly MRSA); non-purulent cellulitis = Streptococcus predominates",
    sections:[
      {label:"Non-Purulent Cellulitis", col:T.teal, items:[
        "Organism: Group A Strep (S. pyogenes) in most cases – MRSA coverage usually NOT required",
        "Mild: cephalexin 500mg QID × 5 days OR dicloxacillin (if MRSA not suspected); amoxicillin is inferior",
        "Moderate (systemic symptoms, failure of oral therapy): IV cefazolin 2g q8h",
        "Mark borders with skin marker: document rate of progression – spreading past mark = treatment failure",
        "Differential: stasis dermatitis, lipodematosclerosis, gout – both legs 'cellulitis' is rarely bilateral bacterial cellulitis",
      ]},
      {label:"Purulent SSTI (Furuncle / Carbuncle / Abscess)", col:T.orange, items:[
        "Organization: Group A Strep (polymicrobial) vs monomicrobic Staph aureus – I&D is the primary treatment",
        "I&D is paramount – antibiotics alone have limited efficacy for abscess without drainage",
        "Adjunctive antibiotics post-I&D: TMP-SMX DS BID × 5–7 days reduces recurrence and treatment failure",
        "Clindamycin: alternative to TMP-SMX for MRSA SSTI – check local inducible clindamycin resistance (D-zone test)",
        "Doxycycline: alternative option for MRSA SSTI oral therapy",
        "Recurrent abscess (≥3 episodes): decolonization protocol – mupirocin nasal + chlorhexidine wash × 5 days",
      ]},
      {label:"Necrotizing Fasciitis", col:T.red, items:[
        "Type I (polymicrobial): mixed aerobic/anaerobic – pipercillin-tazobactam + vancomycin + clindamycin",
        "Type II (monomicrobic): Group A Strep – penicillin G + clindamycin (clindamycin inhibits toxin production at ribosomal level)",
        "Diagnosis: clinical – hard wood-like induration, pain disproportionate to exam, skin necrosis, gas on imaging",
        "LRINEC score: laboratory risk indicator – not sufficiently sensitive/specific to rule out; clinical suspicion overrides",
        "Treatment: SURGICAL EMERGENCY – debridement within 6–12h; every hour delay increases mortality 9%",
        "Hyperbaric O2: adjunctive benefit possible – do NOT delay surgery for HBO",
      ]},
      {label:"Diabetic Foot Infections", col:T.purple, items:[
        "Classify: non-limb-threatening (mild, no systemic findings) vs limb-threatening (deep tissue, bone involvement, systemic)",
        "Mild: cephalexin 500mg QID OR clindamycin – covers Strep, Staph, some anaerobes",
        "Moderate–severe: IV pip-tazo or amp-sulbactam; add vancomycin if prior MRSA or exposure risk",
        "Osteomyelitis: MRI is gold standard; probe-to-bone test (sensitivity 89%) – treat × 6 weeks minimum",
        "Vascular assessment: ABI before culture-guided antibiotics – revascularization improves outcomes dramatically",
        "Ampicillin-sulbactam (Unasyn) limitation: increasing E. coli resistance – verify local susceptibility rates",
      ]},
    ],
    pearl:"Non-purulent bilateral lower extremity 'cellulitis' in a patient with heart failure and edema is almost never bilateral cellulitis. Bilateral lower extremity erythema is dermatis, venous stasis, or lipodematosclerosis – antibiotics will not help and may harm. Cellulitis is unilateral, acute, with advancing erythema that marks and spreads beyond marks.",
  },
  {id:"bacteremia", name:"Bacteremia & Endocarditis", icon:"♥️", color:T.red, cat:"syndrome",
    hook:"S. aureus bacteremia: TEE mandatory, 14-day minimum, ID consult required – no exceptions",
    sections:[
      {label:"Blood Culture Interpretation", col:T.teal, items:[
        "True bacteremia: same organism ≥2 bottles from separate sites (especially for CoNS – 1 bottle = likely contaminant)",
        "S. aureus: ANY positive blood culture is true bacteremia – treat aggressively, repeat cultures q24–48h to confirm clearance",
        "Streptococcus/Enterococcus: single positive is significant – source investigation and echocardiography",
        "CoNS (coagulase-negative Staph): ≥2 bottles same species/sensitivities = likely real; 1 bottle = likely contaminant",
        "Follow-up cultures: mandatory for Staph aureus, Streptococcus, Candida – must confirm clearance before shortening therapy",
      ]},
      {label:"S. aureus Bacteremia (SAB) Protocol", col:T.red, items:[
        "ID consult: all SAB – improves outcomes (lower mortality, fewer complications, shorter LOS)",
        "TEE: all patients capable of tolerating it – higher sensitivity for endocarditis (TEE alone misses 30–40%)",
        "Duration: uncomplicated SAB (no endocarditis, no metastatic focus, IVDU cleared at 72h) = 14 days minimum",
        "Complicated SAB (endocarditis, osteomyelitis, retained hardware) = 4–6 weeks",
        "MRSA: cefazolin or nafcillin – superior to vancomycin; switch from vancomycin as soon as MRSA confirmed",
        "Source control: remove all removable foreign bodies (IVs, lines, pacer wires if infected)",
      ]},
      {label:"Endocarditis Empiric Treatment", col:T.purple, items:[
        "Native valve (community-acquired, no IVDU): ampicillin-sulbactam + gentamicin OR ceftriaxone",
        "IVDU or healthcare exposure: vancomycin + gentamicin ± cefepime (Pseudomonas coverage)",
        "Prosthetic valve: vancomycin + rifampin + gentamicin (rifampin added after 3–5 days, not on day 1)",
        "Duration: 4–6 weeks depending on valve type, organism, valve position (aortic vs mitral)",
        "Surgical indications: heart failure, persistent bacteremia >7d, large mobile vegetation >10mm with emboli, perivalvular extension",
      ]},
      {label:"CLABSI (Central Line-Associated Bloodstream Infection)", col:T.orange, items:[
        "Remove the line: always required for S. aureus, Candida, non-tunnel CLABSI without compelling reason to retain",
        "Gram-positive (CoNS): vancomycin; tunneled catheter – can attempt salvage with antibiotics through line",
        "Gram-negative: target-directed therapy; Pseudomonas requires anti-pseudomonal agent based on susceptibilities",
        "Candida CLABSI: remove line + fluconazole (if susceptible) or micafungin/caspofungin; ophthalmology consult",
        "Duration: 14 days from first negative blood culture for most CLABSI; ≥4–6 weeks if endocarditis or osteomyelitis",
      ]},
    ],
    pearl:"Never attribute S. aureus bacteremia to 'contamination' or 'just a contaminant.' Even one bottle of S. aureus is real bacteremia that requires investigation, treatment, and repeat cultures to confirm clearance before shortening therapy. The mortality of S. aureus endocarditis is 20–30% even with appropriate treatment – and 60–80% if missed or undertreated.",
  },
  {id:"intraabdominal", name:"Intra-Abdominal Infections", icon:"🫀", color:T.orange, cat:"syndrome",
    hook:"Source control is the priority – antibiotics are adjunctive to drainage and/or surgery",
    sections:[
      {label:"Community-Acquired IAI (Mild–Moderate)", col:T.teal, items:[
        "Coverage needed: gram-negative enteric rods (E. coli, Klebsiella) + anaerobes (Bacteroides fragilis)",
        "Mild-moderate (perforated appendicitis, diverticulitis): ceftriaxone + metronidazole OR amoxicillin-clavulanate",
        "Alternative: ertapenem monotherapy (covers ESBLrisk patients without Pseudomonas exposure)",
        "Fluconazole: add only for perforated gastric/duodenal ulcer or immunocompromised – Candida coverage",
        "Duration: 4 days after source control (Solomkin IDSA 2010 data – NOT 7–10 days routinely)",
      ]},
      {label:"Severe / Healthcare-Associated IAI", col:T.red, items:[
        "Pseudomonas and ESBL risk: pipercillin-tazobactam OR meropenem (if prior ESBL or carbapenem-resistant exposure)",
        "MRSA coverage (post-operative, prior MRSA): add vancomycin",
        "Tertiary peritonitis (recurrent after 2 surgeries): Candida, Enterococcus, coagulase-negative Staph – multidrug-resistant organisms",
        "Biliary source: cover gram-negatives + Enterococcus – pip-tazo or amp-sulbactam + ceftriaxone + metronidazole",
        "Liver abscess (E. coli or Klebsiella): drainage + ceftriaxone; Entamoeba histolytica = metronidazole (no drainage)",
      ]},
      {label:"Spontaneous Bacterial Peritonitis (SBP)", col:T.orange, items:[
        "Diagnosis: ascitic PMN >250/mmз regardless of total cell count – start antibiotics immediately",
        "Empiric: cefotaxime 2g IV q8h × 5 days OR ceftriaxone 2g IV daily × 5 days",
        "Blood culture: inoculate ascitic fluid at bedside from paracentesis – drives de-escalation",
        "Albumin 1.5 g/kg at diagnosis + 1g/kg on day 3: reduces hepatorenal syndrome and mortality significantly",
        "Prophylaxis: norfloxacin 400mg daily or TMP-SMX for recurrent SBP, GI bleeding + cirrhosis, ascites + albumin <1.5",
      ]},
      {label:"SIRS Criteria & Severity", col:T.purple, items:[
        "PMN >250 (from paracentesis), elevated serum creatinine, elevated bilirubin, low albumin: risk factors for treatment failure",
        "Standard therapy: cefotaxime (superior to ceftriaxone in multiple trials) × 5 days minimal",
        "Culture-directed therapy: fluoroquinolone or aztreonam monotherapy only if organism susceptible and PMN<250",
        "Repeat paracentesis: obtain if clinical deterioration or recurrent features during treatment",
        "Survival improving: albumin + appropriate antibiotics + prophylaxis + liver transplant evaluation",
      ]},
    ],
    pearl:"Source control for intra-abdominal infection (drainage of abscess, repair of perforation) is the primary treatment – antibiotics cannot sterilize undrained pus. For perforated appendicitis or diverticulitis with adequate source control: 4 days of antibiotics is as effective as 7–10 days. Extended duration without source control is not a substitute for drainage.",
  },
  {id:"malaria", name:"Malaria", icon:"🦟", color:T.green, cat:"tropical",
    hook:"Any fever + travel to endemic area = malaria until proven otherwise – test immediately",
    sections:[
      {label:"Diagnosis", col:T.teal, items:[
        "Thick and thin blood smear × 3 (q12–24h): gold standard – sensitivity improves with serial testing",
        "Rapid diagnostic test (RDT): antigen-based, fast, detects P. falciparum HRP2 – false negative in low parasitemia",
        "PCR: most sensitive, differentiates species – available at reference labs, takes 24–48h",
        "Species differentiation matters: P. falciparum = potentially lethal, requires urgent treatment; P. vivax/ovale = relapse risk (need primaquine)",
        "Parasitemia: >5% = severe malaria regardless of clinical appearance – treat as complicated",
      ]},
      {label:"Uncomplicated P. falciparum Treatment", col:T.green, items:[
        "Artemether-lumefantrine (Coartem): 4 tablets BID × 3 days – first-line in most settings",
        "Atovaquone-proguanil (Malarone): 4 adult tablets daily × 3 days – alternative first-line",
        "Quinine + doxycycline: quinine 650 mg TID × 3–7 days + doxycycline 100 mg BID × 7 days – if artemisinin derivatives unavailable",
        "Chloroquine: resistant everywhere P. falciparum is prevalent except limited areas (Haiti, Central America west of Panama Canal)",
        "Primaquine: NOT for falciparum treatment – used for radical cure of P. vivax/ovale relapse prevention only",
      ]},
      {label:"Severe / Complicated Malaria", col:T.red, items:[
        "IV artesunate: first-line treatment for severe malaria – superior to quinine (CDC provides for compassionate use in US)",
        "IV quinine gluconate: alternative if artesunate unavailable – cardiac monitoring required (QTc prolongation, hypoglycemia)",
        "Doxycycline 100 mg BID × 7 days: add after IV artesunate or quinine when patient can take oral",
        "ICU care: frequent glucose monitoring (hypoglycemia), fluid balance (avoid pulmonary edema), cerebral malaria supportive care",
        "Exchange transfusion: controversial, not recommended by WHO – no proven survival benefit in most studies",
      ]},
      {label:"Non-falciparum Malaria", col:T.orange, items:[
        "P. vivax/ovale: chloroquine (if chloroquine-sensitive region) + primaquine for radical cure (G6PD screen first)",
        "P. malariae: chloroquine – no primaquine needed (no liver stage/relapse)",
        "P. knowlesi: artemisinin combination therapy or acuate artemether (not chloroquine) – emerging, can be severe",
        "Primaquine: NOT for falciparum treatment – used for vivax/ovale relapse prevention only; G6PD deficiency causes hemolysis",
        "Chloroquine-resistant P. vivax: use artemisinin combination therapy; primaquine still needed for relapse prevention",
      ]},
    ],
    pearl:"Thick blood smear sensitivity is 75–90% on a single test – a negative smear does NOT rule out malaria in a febrile traveler. Order 3 smears 12–24h apart. PCR should be sent simultaneously if clinical suspicion is high. Any delay in treating presumed P. falciparum malaria significantly increases mortality and risk of sequelae like cerebral malaria and acute kidney injury.",
  },
  {id:"cdiff", name:"C. difficile Infection", icon:"🦠", color:T.red, cat:"syndrome",
    hook:"Antibiotic exposure + diarrhea = C. diff until proven otherwise – some patients have NO diarrhea (fulminant disease)",
    sections:[
      {label:"Classification & Diagnosis", col:T.teal, items:[
        "Non-severe CDI: <3 watery stools/day, WBC ≤15, Cr ≤1.5× baseline – vancomycin or fidaxomicin",
        "Severe CDI: ≥3 stools/day OR WBC >15 OR Cr >1.5× baseline – fidaxomicin preferred (lower recurrence), vancomycin alternative",
        "Fulminant CDI: toxic megacolon, sepsis, shock, Cr >2× baseline – IV metronidazole + oral vancomycin SIMULTANEOUSLY (IV alone is ineffective)",
        "Testing: PCR for C. difficile (most sensitive) OR EIA; DO NOT test non-diarrheic patients; repeat testing not recommended after treatment",
        "Antiperistaltic agents: AVOID completely – increase toxic megacolon and fulminant disease risk dramatically",
      ]},
      {label:"Treatment & Recurrence", col:T.blue, items:[
        "Fidaxomicin 200mg BID × 10 days: first-line (lowest recurrence ~15% vs 25% vancomycin) – expensive, use in severe/recurrent",
        "Vancomycin 125mg QID × 10 days (oral only!): alternative – NOT IV (IV does not reach colon)",
        "Metronidazole: only for mild CDI where others unavailable – inferior, avoid in severe",
        "Recurrent CDI: fidaxomicin × 10 days, then fidaxomicin 200mg daily × 6 weeks (tapered pulse)",
        "Fecal microbiota transplantation: >85% success for ≥3 recurrences – salvage therapy when medical therapy fails",
      ]},
      {label:"Fulminant CDI Management", col:T.red, items:[
        "IV metronidazole 500mg TID/QID + oral vancomycin 125mg QID (MUST use both) + consider bezlotoxumab",
        "Toxic megacolon: immediate surgical consultation – subtotal colectomy is definitive (mortality 50%+ untreated)",
        "Bezlotoxumab: monoclonal antibody to toxin B → reduces recurrence 38%, consider in recurrent/severe CDI",
        "Avoid antibiotics that promote C. difficile: clindamycin, cephalosporins, fluoroquinolones, ampicillin increase risk",
        "Contact precautions: universal masking + glove use for all CDI patients; hand hygiene with soap/water (alcohol doesn't kill spores)",
      ]},
    ],
    pearl:"Fulminant C. difficile can present WITHOUT diarrhea – watch for sepsis, elevated lactate, Cr >2× baseline. IV metronidazole MUST be paired with oral vancomycin. Antiperistaltic agents are absolutely contraindicated – they increase toxic megacolon risk >4-fold.",
  },
  {id:"fungal", name:"Fungal Infections (ED Recognition)", icon:"🍄", color:T.purple, cat:"syndrome",
    hook:"Candida, Aspergillus, Cryptococcus – recognize risk factors and early warning signs in ED",
    sections:[
      {label:"Candida Bloodstream Infection", col:T.teal, items:[
        "Risk factors: central line, TPN, chemotherapy, broad-spectrum antibiotics, ICU stay, recent surgery, esophageal candidiasis",
        "Presentation: fever (often no localizing signs), sometimes sepsis/shock – retinitis in 20–50% (ophthalmology consult mandatory)",
        "Diagnosis: blood cultures (40–60% positive), ophthalmology exam, ECG/echocardiography if endocarditis suspected",
        "Treatment: fluconazole 800mg daily IV/PO × 14 days (if susceptible) OR micafungin/caspofungin for non-susceptible strains",
        "Source control: REMOVE central line immediately – line salvage fails; line removal is non-negotiable for bloodstream infection",
      ]},
      {label:"Aspergillosis (Invasive & PCP)", col:T.orange, items:[
        "Aspergillus risk: CD4 <50, prolonged chemotherapy, hematologic malignancy, organ transplant, prolonged broad-spectrum antibiotics",
        "Presentation: fever, cough, hemoptysis, pleuritic pain; CXR: halo sign (ground-glass around nodule) is classic but late",
        "Diagnosis: galactomannan antigen (serum/BAL), fungal culture, CT chest for nodules; ~70% sensitivity in disseminated disease",
        "Treatment: voriconazole 6mg/kg IV q12h day 1, then 4mg/kg q12h (or liposomal amphotericin B if voriconazole resistance)",
        "Mortality: 40–90% depending on CD4, source (lung vs disseminated) – early recognition + antifungal essential",
      ]},
      {label:"Cryptococcal Meningitis", col:T.blue, items:[
        "Risk: HIV CD4 <100 (most common), transplant recipients, advanced malignancy on immunosuppression",
        "CSF findings: lymphocytic pleocytosis (may be minimal at CD4 <50), low–normal glucose, high protein, India ink often negative",
        "Diagnosis: serum + CSF cryptococcal antigen (>95% sensitive for meningitis); screen all new HIV diagnoses with serum CrAg",
        "Treatment: liposomal amphotericin B 5mg/kg daily + flucytosine 100mg/kg/day × 2 weeks, then fluconazole 400mg daily × 8 weeks",
        "Adjunctive steroids: ONLY if elevated ICP (>25 cmH2O); role controversial – fluconazole is standard maintenance after induction",
      ]},
    ],
    pearl:"Cryptococcal antigen screening should be done in ALL newly diagnosed HIV with CD4 <100 – asymptomatic CrAg+ patients benefit from fluconazole prophylaxis (prevents meningitis). Early recognition of invasive fungal infections in immunocompromised is critical – 30–90% mortality depending on source & CD4.",
  },
  {id:"sti", name:"STI Essentials (Gonorrhea, Chlamydia, Syphilis)", icon:"🔗", color:T.rose, cat:"syndrome",
    hook:"NAAT is gold standard for gonorrhea/chlamydia. Empiric dual therapy mandatory. Syphilis requires benzathine penicillin G.",
    sections:[
      {label:"Gonorrhea & Chlamydia (Urethritis)", col:T.teal, items:[
        "Diagnosis: nucleic acid amplification test (NAAT) on urine or urethral/cervical swab – sensitivity >95%, culture NOT recommended",
        "Empiric treatment: ceftriaxone 500mg IM × 1 dose + azithromycin 1g PO (or doxycycline 100mg BID × 7 days if non-pregnant)",
        "Cephalosporin-resistant gonorrhea: not yet widespread but emerging – test-of-cure at 3–5 days if symptoms persist",
        "Partner notification: state-dependent; expedited partner therapy (EPT) allows patient to deliver medicine to partner in many states",
        "Pregnancy: ceftriaxone 500mg IM + amoxicillin 500mg TID × 7 days (avoid doxycycline/quinolones in pregnancy)",
      ]},
      {label:"Syphilis (Primary & Secondary)", col:T.orange, items:[
        "Primary: painless ulcer (chancre), induration, regional lymphadenopathy – highly infectious; diagnosis: RPR/VDRL + FTA-ABS/TP-PA",
        "Secondary: maculopapular rash (including palms/soles), fever, lymphadenopathy, hepatomegaly – all infectious",
        "Treatment: benzathine penicillin G 2.4MU IM × 1 dose (curative for early syphilis) – penicillin-allergic: doxycycline 100mg BID × 28 days OR ceftriaxone",
        "Partner evaluation: partners within 3 months of primary/secondary should be treated empirically; long-term partners need serology",
        "U/S & neuro: syphilis can cause tertiary neurosyphilis (tabes dorsalis, paresis) – RPR/VDRL + CSF VDRL if neurologic symptoms",
      ]},
      {label:"Pelvic Inflammatory Disease (PID)", col:T.red, items:[
        "Diagnosis: clinical (pelvic pain + cervical motion tenderness OR uterine/adnexal tenderness) – culture/NAAT NOT required",
        "Empiric: ceftriaxone 500mg IM + doxycycline 100mg BID × 14 days ± metronidazole (if anaerobic coverage needed)",
        "Severe PID: fever >38.3°C, peritoneal signs, sepsis → IV ceftriaxone + IV doxycycline; consider hospitalization",
        "IUD: do NOT remove during treatment – removal increases failure; treat with antibiotics per protocol",
        "Follow-up: improvement expected 48–72h; if not improving, consider imaging (ultrasound/MRI) for tubo-ovarian abscess",
      ]},
    ],
    pearl:"Empiric treatment of BOTH gonorrhea AND chlamydia is standard – never treat one without the other. Benzathine penicillin G is still the gold standard for syphilis (not obsolete). U=U (undetectable = untransmittable) applies to syphilis diagnosis/treatment discussions as well – early detection and treatment cure syphilis completely.",
  },
  {id:"sepsis", name:"Sepsis & Septic Shock Protocol", icon:"⚡", color:T.red, cat:"syndrome",
    hook:"Septic shock mortality increases 7–8% per hour of delayed antibiotics. Time = organ. qSOFA ≥2 = high mortality risk.",
    sections:[
      {label:"Recognition & qSOFA/SIRS", col:T.teal, items:[
        "qSOFA (any ≥2 = high mortality): altered mental status, SBP ≤100, RR ≥22",
        "SIRS (≥2 = infection suspected): fever/hypothermia, HR >90, RR >20 OR pCO2 <32, WBC >12 or <4 or >10% bands",
        "Sepsis (2016 definition): SIRS + suspected/confirmed infection; septic shock = sepsis + hypotension requiring vasopressors OR lactate >4 mmol/L",
        "Lactate: elevated lactate (>2) indicates tissue hypoperfusion even if BP normal – prognostic marker, lactate clearance <10% @ 6h = worse outcome",
        "Source identification: blood cultures ×2 BEFORE antibiotics, UA/culture, imaging, wound exam – delays but essential for de-escalation",
      ]},
      {label:"SEP-1 Bundle (Hour 0–1)", col:T.orange, items:[
        "Lactate measurement, blood cultures ×2, broad-spectrum IV antibiotics within 60 min (120 min if non-shock sepsis)",
        "Empiric: ceftriaxone 2g IV + metronidazole 500mg IV + MRSA/Pseudomonas coverage if risk factors present",
        "IV fluid: 30mL/kg crystalloid bolus for lactate >4 OR SBP <90 (reassess after each 500mL; goal MAP ≥65)",
        "Vasopressors: norepinephrine first-line (goal MAP ≥65); add vasopressin 0.04U/min if already on norepi + hydrocortisone if refractory shock",
        "Re-lactate at 3–6h: persistent lactate = ongoing hypoperfusion → reassess fluids/vasopressors/sources",
      ]},
      {label:"De-escalation & Duration", col:T.blue, items:[
        "Early source control (<24h): drain abscess, remove catheter, débride necrotic tissue, surgical consult if indicated",
        "Cultures back at 48–72h: narrow to organism-specific based on susceptibilities; don't over-treat",
        "Duration: 7–10 days for most bacterial sepsis (adjust for fungal, endocarditis, osteomyelitis – longer)",
        "Vancomycin dosing: 25–33 mg/kg IV q8–12h (renally adjusted); pseudomonal coverage if risk factors",
        "SOFA score: tracks progression/deterioration; declining = favorable trajectory, rising = need for escalation",
      ]},
    ],
    pearl:"Early recognition & antibiotics within 60min of septic shock diagnosis is the strongest modifiable predictor of survival. Lactate-guided resuscitation superior to CVP-guided alone. Don't over-fluid – reassess after each bolus & pivot to vasopressors if hypotension persists. Source control IS antibiotics (drainage/surgical management essential).",
  },
  {id:"tb_emergency", name:"Tuberculosis (Emergency Recognition)", icon:"🫁", color:T.orange, cat:"syndrome",
    hook:"TB can present as pneumonia, meningitis, sepsis, or pericarditis – isolation essential if suspected. Smear-positive = highly infectious",
    sections:[
      {label:"Pulmonary TB & Isolation", col:T.teal, items:[
        "Presentation: chronic cough (>2 weeks, blood-tinged sputum), night sweats, weight loss, fever, fatigue; CXR: cavitary lesions (upper lobes)",
        "AFB sputum smear: gold standard rapid test (Ziehl-Neelsen stain) – smear-positive = highly infectious; may need 3 specimens",
        "GeneXpert MTB/RIF: rapid molecular test (gold standard, >95% sensitivity) with rifampicin resistance detection simultaneously",
        "Negative pressure room mandatory: if smear-positive or suspected TB; continue until 2 weeks effective therapy + clinical improvement",
        "Atypical presentations: HIV+ patients show lower lobe infiltrates, minimal cavitation, normal CXR early – high clinical suspicion needed",
      ]},
      {label:"TB Meningitis & Disseminated", col:T.blue, items:[
        "TB meningitis: fever + headache + neck stiffness; CSF: lymphocytic, high protein, low glucose (<45% of serum)",
        "AFB of CSF: low sensitivity (10–20%) – clinical diagnosis often made without culture confirmation; EMPIRIC therapy often started",
        "TB pericarditis: chest pain + pericardial rub; pericardial fluid lymphocytic, high LDH; may be hemorrhagic",
        "Early diagnosis: TB can mimic pneumonia, meningitis, pericarditis – maintain high suspicion (travel history, endemic areas, contact exposure)",
        "Empiric treatment: RIPE (rifampicin, isoniazid, pyrazinamide, ethambutol) × 2 months, then RH × 4 months – do NOT wait for culture",
      ]},
      {label:"Drug-Resistant TB (MDR-TB / XDR-TB)", col:T.red, items:[
        "MDR-TB: resistant to isoniazid + rifampicin – requires longer therapy (20 months) + fluoroquinolone + injectable (streptomycin/amikacin)",
        "XDR-TB: MDR + fluoroquinolone + injectable resistance – newer agents (bedaquiline, linezolid, delamanid) required; worse outcomes",
        "Risk factors: prior TB treatment, prior FQ use, HIV+ (higher progression), immunocompromised status",
        "Diagnosis: Xpert MTB/RIF detects rifampicin resistance; liquid culture + DST for complete panel",
        "Infection control: MDR-TB requires same isolation as drug-susceptible TB; longer infectious period if delayed diagnosis",
      ]},
    ],
    pearl:"TB can present as pneumonia, meningitis, pericarditis, or other sites – high suspicion essential. Smear-positive patients are highly infectious & require immediate isolation. Never wait for cultures to initiate therapy if clinical suspicion is high. Negative pressure room isolation is non-negotiable. U.S. TB incidence rising in certain populations.",
  },
];

const CATS = [
  {id:"all", label:"All", color:T.teal},
  {id:"abx", label:"Antibiotics", color:T.green},
  {id:"syndrome", label:"Syndromes", color:T.blue},
  {id:"tropical", label:"Travel/Tropical", color:T.orange},
];

const MAIN_TABS = [
  {id:"reference", label:"ID Reference", icon:"📋"},
  {id:"coach", label:"AI ID Coach", icon:"🧠"},
];

function AmbientBg() {
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0}}>
      <div style={{position:"absolute",top:"-15%",left:"-10%",width:"55%",height:"55%",background:"radial-gradient(circle,rgba(61,255,160,0.07) 0%,transparent 70%)"}}/>
      <div style={{position:"absolute",bottom:"-10%",right:"-5%",width:"50%",height:"50%",background:"radial-gradient(circle,rgba(0,229,192,0.07) 0%,transparent 70%)"}}/>
      <div style={{position:"absolute",top:"40%",left:"30%",width:"35%",height:"35%",background:"radial-gradient(circle,rgba(59,158,255,0.04) 0%,transparent 70%)"}}/>
    </div>
  );
}

function ListItem({syn, selected, onClick}) {
  return (
    <button onClick={onClick}
      style={{
        width:"100%",textAlign:"left",padding:"12px 14px",border:"none",
        background:selected?`${syn.color}18`:`transparent`,
        borderLeft:`4px solid ${selected?syn.color:syn.color+"30"}`,
        borderBottom:`1px solid rgba(42,79,122,0.15)`,
        cursor:"pointer",transition:"all .12s",
        color:selected?T.txt:T.txt3,fontFamily:"DM Sans",fontSize:12,fontWeight:600,
        position:"relative",overflow:"hidden",
      }}
      onMouseEnter={e=>{
        if(!selected) {
          e.currentTarget.style.background=`${syn.color}0a`;
          e.currentTarget.style.borderLeftColor=`${syn.color}70`;
        }
      }}
      onMouseLeave={e=>{
        if(!selected) {
          e.currentTarget.style.background="transparent";
          e.currentTarget.style.borderLeftColor=`${syn.color}30`;
        }
      }}
    >
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
        <span style={{fontSize:18}}>{syn.icon}</span>
        <div style={{flex:1}}>
          <div style={{fontSize:11,fontWeight:700,color:selected?syn.color:T.txt2,letterSpacing:0.5,textTransform:"uppercase",lineHeight:1.2}}>{syn.name.split("(")[0].trim()}</div>
        </div>
      </div>
      <div style={{fontSize:10,color:T.txt4,lineHeight:1.35,paddingLeft:26,maxHeight:selected?50:32,overflow:"hidden",whiteSpace:"normal"}}>{syn.hook.substring(0,60)}...</div>
    </button>
  );
}

function CoachSection({filtered, selectedTopic}) {
  const [scenario, setScenario] = useState("");
  const [coaching, setCoaching] = useState(false);
  const [coachResult, setCoachResult] = useState(null);
  const [coachErr, setCoachErr] = useState(null);

  const runCoach = useCallback(async () => {
    if (!scenario.trim()) return;
    setCoaching(true);
    setCoachErr(null);
    setCoachResult(null);
    const syn = SYNDROMES.find(s => s.id === selectedTopic);
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1500,
          system:`You are an Infectious Disease specialist attending physician providing real-time clinical guidance to an emergency medicine provider. Generate tailored, actionable advice for the specific clinical scenario provided related to ${syn?.name}. Respond ONLY in valid JSON (no markdown fences):
{
  "assessment": "One sentence clinical impression of this scenario",
  "immediateActions": ["action 1 specific to THIS patient", "action 2", "action 3"],
  "empiricRegimen": "Specific antibiotic/antifungal/antiviral regimen with doses for THIS patient – account for any organ dysfunction or allergies mentioned",
  "diagnostics": ["specific test 1 for this scenario", "specific test 2", "test 3"],
  "watchFor": ["complication most likely in THIS patient", "secondary complication to anticipate", "third watch point"],
  "duration": "Expected treatment duration and when/how to de-escalate",
  "idConsult": "Yes or No and why – does this patient need ID consult and urgency",
  "pearl": "One clinical pearl specific to this exact scenario"
}`,
          messages:[{role:"user",content:`Topic: ${syn?.name}\n\nClinical Scenario: ${scenario}`}]
        })
      });
      const data = await resp.json();
      if (data.error) throw new Error(data.error.message);
      const raw = data.content?.find(b => b.type === "text")?.text || "{}";
      setCoachResult(JSON.parse(raw.replace(/```json|```/g,"").trim()));
    } catch(e) {
      setCoachErr("Error: " + (e.message || "Check API connectivity"));
    } finally {
      setCoaching(false);
    }
  }, [scenario, selectedTopic]);

  return (
    <div className="id-fade">
      <div style={{...glass,padding:"14px 16px",marginBottom:12}}>
        <div style={{display:"flex",gap:8,alignItems:"flex-start"}}>
          <span style={{fontSize:20,flexShrink:0}}>🧠</span>
          <div style={{flex:1}}>
            <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.6}}>
              <strong style={{color:T.green}}>AI ID Coach:</strong> Select a topic, describe your patient, and get real-time specialist-level guidance – empiric regimen with doses, diagnostics, complications to watch for, and whether an ID consult is needed.
            </div>
          </div>
        </div>
      </div>

      <div style={{...glass,padding:"14px 16px",marginBottom:12,borderRadius:10}}>
        <div style={{marginBottom:12}}>
          <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,letterSpacing:1.5,textTransform:"uppercase",marginBottom:6}}>Selected Topic</div>
          <div style={{fontFamily:"DM Sans",fontSize:13,fontWeight:600,color:SYNDROMES.find(s=>s.id===selectedTopic)?.color||T.teal}}>
            {SYNDROMES.find(s=>s.id===selectedTopic)?.icon} {SYNDROMES.find(s=>s.id===selectedTopic)?.name}
          </div>
        </div>
        <div style={{marginBottom:10}}>
          <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,letterSpacing:1.5,textTransform:"uppercase",marginBottom:6}}>Clinical Scenario</div>
          <textarea value={scenario} onChange={e=>setScenario(e.target.value)}
            placeholder="Describe the patient in detail – age, comorbidities, organ dysfunction, allergies, prior antibiotics, clinical trajectory, lab/culture results if available.&#10;&#10;Example: '68yo male, CKD stage 3 (CrCl 28), penicillin allergy (anaphylaxis), presented with 3 days of dysuria and flank pain, T 39.2°C, WBC 18, creatinine 2.1 (baseline 1.6). UA: >50 WBC, many gram-negative rods. No recent hospitalizations. Started ceftriaxone – urine culture growing E. coli, sensitivities pending.'"
            rows={5}
            style={{width:"100%",background:"rgba(14,37,68,0.7)",border:`1px solid ${scenario?"rgba(61,255,160,0.45)":"rgba(42,79,122,0.35)"}`,
              borderRadius:8,padding:"10px 12px",outline:"none",fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.65,resize:"vertical",transition:"all .15s"}}
          />
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontFamily:"DM Sans",fontSize:11,color:T.txt4}}>
            Topic: <strong style={{color:SYNDROMES.find(s=>s.id===selectedTopic)?.color||T.teal}}>
              {SYNDROMES.find(s=>s.id===selectedTopic)?.name}
            </strong>
          </span>
          <button onClick={runCoach} disabled={coaching||!scenario.trim()}
            style={{fontFamily:"DM Sans",fontWeight:700,fontSize:12,padding:"8px 22px",borderRadius:10,
              cursor:coaching||!scenario.trim()?"not-allowed":"pointer",
              border:`1px solid ${!scenario.trim()?"rgba(42,79,122,0.3)":"rgba(61,255,160,0.5)"}`,
              background:!scenario.trim()?"rgba(42,79,122,0.15)":"linear-gradient(135deg,rgba(61,255,160,0.22),rgba(61,255,160,0.08))",
              color:!scenario.trim()?T.txt4:T.green,transition:"all .15s"}}
          >
            {coaching?<><span className="id-spin">⟳</span> Consulting...</>:"🔮 Get ID Guidance"}
          </button>
        </div>
      </div>

      {coachErr && (
        <div style={{padding:"10px 14px",background:"rgba(255,68,68,0.1)",border:"1px solid rgba(255,68,68,0.3)",borderRadius:10,marginBottom:12,fontFamily:"DM Sans",fontSize:12,color:T.coral}}>
          {coachErr}
        </div>
      )}

      {coaching && (
        <div style={{...glass,padding:"32px",textAlign:"center",borderRadius:10,marginBottom:12}}>
          <span className="id-spin" style={{fontSize:32,display:"block",marginBottom:10}}>⟳</span>
          <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2}}>
            Consulting ID specialist for {SYNDROMES.find(s=>s.id===selectedTopic)?.name}...
          </div>
        </div>
      )}

      {coachResult && !coaching && (
        <div className="id-fade" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {coachResult.assessment && (
            <div style={{...glass,padding:"11px 14px",borderLeft:`3px solid ${T.cyan}`,borderRadius:10}}>
              <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.cyan,letterSpacing:2,textTransform:"uppercase",marginBottom:6,fontWeight:700}}>Assessment</div>
              <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.6}}>{coachResult.assessment}</div>
            </div>
          )}
          {coachResult.idConsult && (
            <div style={{...glass,padding:"11px 14px",borderLeft:`3px solid ${coachResult.idConsult.toLowerCase().includes("yes")?T.green:T.txt4}`,borderRadius:10}}>
              <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:coachResult.idConsult.toLowerCase().includes("yes")?T.green:T.txt4,letterSpacing:2,textTransform:"uppercase",marginBottom:6,fontWeight:700}}>ID Consult</div>
              <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.6}}>{coachResult.idConsult}</div>
            </div>
          )}
          {coachResult.immediateActions?.length>0 && (
            <div style={{gridColumn:"1 / -1",...glass,padding:"11px 14px",borderLeft:`3px solid ${T.orange}`,borderRadius:10}}>
              <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.orange,letterSpacing:2,textTransform:"uppercase",marginBottom:6,fontWeight:700}}>⚡ Immediate Actions</div>
              {coachResult.immediateActions.map((a,i)=>(
                <div key={i} style={{display:"flex",gap:7,alignItems:"flex-start",marginBottom:i<coachResult.immediateActions.length-1?8:0}}>
                  <span style={{color:T.orange,fontSize:10,marginTop:2,flexShrink:0}}>{i+1}.</span>
                  <span style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.5}}>{a}</span>
                </div>
              ))}
            </div>
          )}
          {coachResult.empiricRegimen && (
            <div style={{gridColumn:"1 / -1",...glass,padding:"11px 14px",borderLeft:`3px solid ${T.blue}`,borderRadius:10}}>
              <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.blue,letterSpacing:2,textTransform:"uppercase",marginBottom:6,fontWeight:700}}>💊 Empiric Regimen</div>
              <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.6}}>{coachResult.empiricRegimen}</div>
            </div>
          )}
          {coachResult.diagnostics?.length>0 && (
            <div style={{gridColumn:"1 / -1",...glass,padding:"11px 14px",borderLeft:`3px solid ${T.cyan}`,borderRadius:10}}>
              <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.cyan,letterSpacing:2,textTransform:"uppercase",marginBottom:6,fontWeight:700}}>🧪 Diagnostics</div>
              {coachResult.diagnostics.map((d,i)=>(
                <div key={i} style={{display:"flex",gap:7,alignItems:"flex-start",marginBottom:i<coachResult.diagnostics.length-1?8:0}}>
                  <span style={{color:T.cyan,fontSize:10,marginTop:2,flexShrink:0}}>◆</span>
                  <span style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.5}}>{d}</span>
                </div>
              ))}
            </div>
          )}
          {coachResult.watchFor?.length>0 && (
            <div style={{gridColumn:"1 / -1",...glass,padding:"11px 14px",borderLeft:`3px solid ${T.red}`,borderRadius:10}}>
              <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.red,letterSpacing:2,textTransform:"uppercase",marginBottom:6,fontWeight:700}}>⚠️ Watch For</div>
              {coachResult.watchFor.map((w,i)=>(
                <div key={i} style={{display:"flex",gap:7,alignItems:"flex-start",marginBottom:i<coachResult.watchFor.length-1?8:0}}>
                  <span style={{color:T.red,fontSize:10,marginTop:2,flexShrink:0}}>▲</span>
                  <span style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.5}}>{w}</span>
                </div>
              ))}
            </div>
          )}
          {coachResult.duration && (
            <div style={{...glass,padding:"11px 14px",borderLeft:`3px solid ${T.green}`,borderRadius:10}}>
              <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.green,letterSpacing:2,textTransform:"uppercase",marginBottom:6,fontWeight:700}}>⏱️ Duration</div>
              <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.6}}>{coachResult.duration}</div>
            </div>
          )}
          {coachResult.pearl && (
            <div style={{gridColumn:"1 / -1",padding:"9px 13px",background:`${T.yellow}09`,border:`1px solid ${T.yellow}28`,borderRadius:8}}>
              <span style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.yellow,letterSpacing:1,textTransform:"uppercase"}}>💡 Pearl: </span>
              <span style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2}}>{coachResult.pearl}</span>
            </div>
          )}
          <button onClick={()=>setCoachResult(null)} style={{gridColumn:"1 / -1",fontFamily:"DM Sans",fontSize:12,padding:"8px",background:"transparent",border:`1px solid rgba(42,79,122,0.3)`,borderRadius:8,color:T.txt4,cursor:"pointer",transition:"all .15s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(61,255,160,0.3)";e.currentTarget.style.color=T.txt3;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(42,79,122,0.3)";e.currentTarget.style.color=T.txt4;}}>
            ← New Scenario
          </button>
        </div>
      )}
    </div>
  );
}

export default function InfectiousDiseaseHub() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("reference");
  const [cat, setCat] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(SYNDROMES[0].id);
  
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return SYNDROMES.filter(s =>
      (cat==="all" || s.cat===cat) &&
      (!q || s.name.toLowerCase().includes(q) || s.hook.toLowerCase().includes(q))
    );
  }, [cat, search]);

  const current = SYNDROMES.find(s => s.id === selected) || SYNDROMES[0];
  const currentIndex = filtered.findIndex(s => s.id === selected);

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (tab !== "reference") return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextIdx = Math.min(currentIndex + 1, filtered.length - 1);
      setSelected(filtered[nextIdx].id);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prevIdx = Math.max(currentIndex - 1, 0);
      setSelected(filtered[prevIdx].id);
    } else if (e.key === "Escape") {
      e.preventDefault();
      document.querySelector("input[placeholder*='Search']")?.focus();
    }
  }, [currentIndex, filtered, tab]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div style={{fontFamily:"DM Sans, sans-serif",background:T.bg,minHeight:"100vh",position:"relative",overflow:"hidden",color:T.txt}} onKeyDown={handleKeyDown}>
      <AmbientBg/>
      <NotryaPatientBar />
      <div style={{position:"relative",zIndex:1,maxWidth:1600,margin:"0 auto",padding:"0 16px"}}>

        {/* Header */}
        <div style={{padding:"18px 0 14px"}}>
          <button onClick={()=>navigate("/hub")}
            style={{marginBottom:10,display:"inline-flex",alignItems:"center",gap:7,fontFamily:"DM Sans",fontSize:12,fontWeight:600,
              background:"rgba(14,37,68,0.7)",border:"1px solid rgba(42,79,122,0.5)",borderRadius:8,padding:"5px 14px",
              color:T.txt3,cursor:"pointer",transition:"all .15s"}}
            onMouseEnter={e=>{e.currentTarget.style.color=T.txt2;e.currentTarget.style.borderColor="rgba(61,255,160,0.4)";}}
            onMouseLeave={e=>{e.currentTarget.style.color=T.txt3;e.currentTarget.style.borderColor="rgba(42,79,122,0.5)";}}
          >
            ← Back to Hub
          </button>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
            <div style={{backdropFilter:"blur(40px)",WebkitBackdropFilter:"blur(40px)",
              background:"rgba(5,15,30,0.9)",border:"1px solid rgba(42,79,122,0.6)",borderRadius:10,
              padding:"5px 12px",display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.green,letterSpacing:3}}>NOTRYA</span>
              <span style={{color:T.txt4,fontFamily:"JetBrains Mono",fontSize:10}}>/</span>
              <span style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.txt3,letterSpacing:2}}>INFECTIOUS DISEASE</span>
            </div>
          </div>
          <h1 style={{fontFamily:"Playfair Display",fontSize:"clamp(24px,4vw,40px)",fontWeight:900,letterSpacing:-1,lineHeight:1.1}}>
            Infectious Disease Hub
          </h1>
          <p style={{fontFamily:"DM Sans",fontSize:12,color:T.txt3,marginTop:4}}>
            Antibiotics · Syndromes · Resistant Organisms · HIV/Opportunistic · Travel Medicine · Isolation · AI ID Coach
          </p>
        </div>

        {/* Main tabs */}
        <div style={{display:"flex",gap:5,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
          {MAIN_TABS.map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{flex:"1 1 auto",fontFamily:"DM Sans",fontWeight:600,fontSize:12,padding:"9px 8px",borderRadius:10,
                border:`1px solid ${tab===t.id?"rgba(61,255,160,0.5)":"transparent"}`,
                background:tab===t.id?"linear-gradient(135deg,rgba(61,255,160,0.18),rgba(61,255,160,0.07))":"transparent",
                color:tab===t.id?T.green:T.txt3,cursor:"pointer",textAlign:"center",transition:"all .15s"}}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Reference tab */}
        {tab==="reference" && (
          <div style={{display:"grid",gridTemplateColumns:"320px 1fr",gap:14,marginBottom:16,minHeight:"calc(100vh - 280px)"}}>
            
            {/* Sidebar */}
            <div style={{...glass,padding:"12px 0",borderRadius:10,height:"fit-content",maxHeight:"calc(100vh - 300px)",overflow:"auto",backdropFilter:"blur(32px)",WebkitBackdropFilter:"blur(32px)",background:"rgba(8,22,40,0.85)"}}>
              <div style={{padding:"12px 12px 14px",borderBottom:"1px solid rgba(42,79,122,0.25)"}}>
                <input type="text" value={search} onChange={e=>setSearch(e.target.value)}
                  placeholder="Search topics..."
                  style={{width:"100%",background:"rgba(14,37,68,0.9)",border:`1px solid ${search?"rgba(61,255,160,0.45)":"rgba(42,79,122,0.4)"}`,borderRadius:8,
                    padding:"7px 12px",outline:"none",fontFamily:"DM Sans",fontSize:11,color:T.txt,
                    transition:"all .12s",boxShadow:search?"0 0 12px rgba(61,255,160,0.08)":""}}
                  onFocus={e=>{e.currentTarget.style.borderColor="rgba(61,255,160,0.45)";e.currentTarget.style.boxShadow="0 0 12px rgba(61,255,160,0.08)";}}
                  onBlur={e=>{if(!search){e.currentTarget.style.borderColor="rgba(42,79,122,0.4)";e.currentTarget.style.boxShadow="";}}}
                />
              </div>
              <div style={{display:"flex",gap:4,flexWrap:"wrap",padding:"10px 10px",borderBottom:"1px solid rgba(42,79,122,0.15)"}}>
                {CATS.map(c => (
                  <button key={c.id} onClick={()=>setCat(c.id)}
                    style={{fontFamily:"JetBrains Mono",fontSize:9,fontWeight:700,padding:"4px 10px",borderRadius:18,
                      cursor:"pointer",textTransform:"uppercase",letterSpacing:0.8,border:`1px solid ${cat===c.id?c.color+99:c.color+33}`,
                      background:cat===c.id?`${c.color}22`:`${c.color}0a`,color:cat===c.id?c.color:T.txt4,transition:"all .12s"}}
                    onMouseEnter={e=>{if(cat!==c.id){e.currentTarget.style.background=`${c.color}15`;e.currentTarget.style.borderColor=`${c.color}55`;}}}
                    onMouseLeave={e=>{if(cat!==c.id){e.currentTarget.style.background=`${c.color}0a`;e.currentTarget.style.borderColor=`${c.color}33`;}}}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.txt4,letterSpacing:2,textTransform:"uppercase",padding:"10px 14px",borderBottom:"1px solid rgba(42,79,122,0.15)"}}>
                {filtered.length} topic{filtered.length!==1?"s":""}  •  <span style={{color:T.green,fontSize:8}}>↑↓</span>
              </div>
              {filtered.map(syn => (
                <ListItem key={syn.id} syn={syn} selected={selected===syn.id} onClick={()=>setSelected(syn.id)}/>
              ))}
              {filtered.length===0 && (
                <div style={{padding:"32px 14px",textAlign:"center"}}>
                  <div style={{fontSize:24,marginBottom:6}}>🔍</div>
                  <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt3,lineHeight:1.5}}>No topics match &ldquo;{search}&rdquo;</div>
                </div>
              )}
            </div>

            {/* Main content */}
            <div className="id-fade" style={{...glass,padding:"16px",borderRadius:10,overflowY:"auto",maxHeight:"calc(100vh - 300px)"}}>
              <div style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:14,paddingBottom:12,borderBottom:`1px solid rgba(42,79,122,0.25)`}}>
                <span style={{fontSize:32,flexShrink:0}}>{current.icon}</span>
                <div style={{flex:1}}>
                  <h2 style={{fontFamily:"Playfair Display",fontSize:26,fontWeight:700,color:current.color,lineHeight:1.1,marginBottom:6}}>{current.name}</h2>
                  <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt4,lineHeight:1.5}}>📌 {current.hook}</div>
                </div>
              </div>

              {current.sections.map((sec,si) => (
                <div key={si} style={{marginBottom:12,padding:"11px 14px",background:`${sec.col}09`,border:`1px solid ${sec.col}22`,borderRadius:10}}>
                  <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:sec.col,letterSpacing:2,textTransform:"uppercase",marginBottom:8,fontWeight:700}}>
                    {sec.label}
                  </div>
                  {sec.items.map((item,ii) => (
                    <div key={ii} style={{display:"flex",gap:7,alignItems:"flex-start",marginBottom:8}}>
                      <span style={{color:sec.col,fontSize:8,marginTop:3,flexShrink:0}}>▪</span>
                      <span style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.5}}>{item}</span>
                    </div>
                  ))}
                </div>
              ))}

              <div style={{padding:"9px 13px",background:`${T.yellow}09`,border:`1px solid ${T.yellow}25`,borderRadius:8,marginTop:14}}>
                <span style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.yellow,letterSpacing:1,textTransform:"uppercase"}}>💡 Pearl: </span>
                <span style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2}}>{current.pearl}</span>
              </div>
            </div>
          </div>
        )}

        {/* Coach tab placeholder */}
        {tab==="coach" && (
          <CoachSection filtered={filtered} selectedTopic={selected}/>
        )}

        {/* Footer */}
        <div style={{textAlign:"center",paddingBottom:24,paddingTop:14}}>
          <span style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,letterSpacing:1.5,textTransform:"uppercase"}}>
            NOTRYA ID HUB · IDSA · ASH P · CDC · WHO GUIDELINES · AI FOR EDUCATIONAL SUPPORT ONLY · VERIFY WITH LOCAL ANTIBIOGRAM AND INSTITUTIONAL PROTOCOLS
          </span>
        </div>
      </div>
    </div>
  );
}