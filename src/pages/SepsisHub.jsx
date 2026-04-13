import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";

/* ═══ TOKENS ═══════════════════════════════════════════════════════ */
const T = {
  bg:"#050f1e",panel:"#081628",card:"#0b1e36",up:"#0e2544",
  b:"rgba(26,53,85,0.8)",bhi:"rgba(42,79,122,0.9)",
  txt:"#e8f0fe",txt2:"#8aaccc",txt3:"#4a6a8a",txt4:"#2e4a6a",
  coral:"#ff6b6b",gold:"#f5c842",teal:"#00e5c0",blue:"#3b9eff",
  orange:"#ff9f43",purple:"#9b6dff",green:"#3dffa0",cyan:"#00d4ff",
};

/* ═══ CONDITIONS DATA ══════════════════════════════════════════════ */
const CONDITIONS = [
  { id:"screening", icon:"🔬", title:"Sepsis-3 Screening", sub:"qSOFA · SIRS · SOFA · Hour-1 Bundle", cat:"Screening", color:"#f5c842", gl:"rgba(245,200,66,0.07)", br:"rgba(245,200,66,0.28)" },
  { id:"shock",     icon:"⚡", title:"Septic Shock",       sub:"Vasopressors · MAP <65 · Lactate >2",  cat:"Screening", color:"#ff6b6b", gl:"rgba(255,107,107,0.07)", br:"rgba(255,107,107,0.28)" },
  { id:"uro",       icon:"💧", title:"Urosepsis",          sub:"UTI · Pyelonephritis · Obstruction",    cat:"Source",    color:"#3b9eff", gl:"rgba(59,158,255,0.07)",  br:"rgba(59,158,255,0.28)"  },
  { id:"pna",       icon:"🫁", title:"Pneumonia Sepsis",   sub:"CAP · HAP · VAP · Aspiration",          cat:"Source",    color:"#00d4ff", gl:"rgba(0,212,255,0.07)",   br:"rgba(0,212,255,0.28)"   },
  { id:"cns",       icon:"🧠", title:"CNS / Meningitis",   sub:"Bacterial Meningitis · Encephalitis",   cat:"Source",    color:"#9b6dff", gl:"rgba(155,109,255,0.07)", br:"rgba(155,109,255,0.28)" },
  { id:"abd",       icon:"🩻", title:"Intra-abdominal",    sub:"Peritonitis · Cholangitis · Perforation",cat:"Source",   color:"#ff9f43", gl:"rgba(255,159,67,0.07)",  br:"rgba(255,159,67,0.28)"  },
  { id:"ssti",      icon:"🔴", title:"SSTI Sepsis",        sub:"Cellulitis · NF · MRSA",                cat:"Source",    color:"#ff6b6b", gl:"rgba(255,107,107,0.07)", br:"rgba(255,107,107,0.28)" },
  { id:"neutro",    icon:"🩸", title:"Neutropenic Fever",  sub:"ANC <500 · MASCC Risk Score",           cat:"Special",   color:"#00e5c0", gl:"rgba(0,229,192,0.07)",   br:"rgba(0,229,192,0.28)"   },
  { id:"steward",   icon:"📊", title:"ABX Stewardship",    sub:"PCT · De-escalation · IV→PO · AI Rx",   cat:"Stewardship",color:"#3dffa0",gl:"rgba(61,255,160,0.07)",  br:"rgba(61,255,160,0.28)"  },
];

const CATS = ["Screening","Source","Special","Stewardship"];

/* ═══ ANTIBIOTIC DATA ═══════════════════════════════════════════════ */
const ABX = {
  uro:[
    { cat:"Community-Acquired (1st line)", drug:"Ceftriaxone", dose:"2g IV q24h",
      renal:"CrCl <10: 1g IV q24h\nHD: 1g after each session",
      ivpo:"Cephalexin 500mg PO q6h × 5–7d\nOR TMP-SMX DS 1 tab q12h (if local R <20%)\nOR Ciprofloxacin 500mg PO q12h (if FQ susceptible)",
      deesc:"Step down at 48–72h to targeted oral agent. Total: 5–7d (no bacteremia); 10–14d (bacteremia).", ref:"IDSA 2024" },
    { cat:"Healthcare / Complicated", drug:"Piperacillin-Tazobactam", dose:"4.5g IV q6h\nExtended: 3.375g over 4h q8h",
      renal:"CrCl 20–40: 2.25g IV q6h\nCrCl <20/HD: 2.25g IV q8h + 0.75g post-HD",
      ivpo:"Amoxicillin-Clavulanate 875/125mg PO q8h\nOR Ciprofloxacin 500mg PO q12h (if FQ susceptible)",
      deesc:"Step to ceftriaxone if GNR susceptible to 3rd-gen cephalosporins. Target 5–7d total.", ref:"IDSA 2024" },
    { cat:"ESBL-Suspected (moderate)", drug:"Ertapenem", dose:"1g IV q24h",
      renal:"CrCl 30–50: 500mg IV q24h\nCrCl <30/HD: 500mg IV q24h (give after HD)",
      ivpo:"No PO equivalent for pyelonephritis.\nFosfomycin 3g PO single dose (uncomplicated cystitis only)\nNitrofurantoin 100mg ER PO q12h × 5d (CrCl ≥45 only)",
      deesc:"Narrow to non-carbapenem if ESBL confirmed susceptible. ID consult for carbapenems >72h.", ref:"IDSA 2024" },
    { cat:"ESBL / Severe Septic Shock", drug:"Meropenem", dose:"1g IV q8h\n(2g q8h if Pseudomonas/KPC concern)",
      renal:"CrCl 26–50: 1g IV q12h\nCrCl 10–25: 500mg IV q12h\nHD: 500mg IV q24h (after HD)",
      ivpo:"Step down to ertapenem 1g IV q24h once susceptible and clinically improving",
      deesc:"De-escalate to narrowest IV agent ASAP; set stop date at initiation. ID consult mandatory.", ref:"Level A" },
    { cat:"Enterococcal Coverage (add-on)", drug:"Ampicillin", dose:"2g IV q4–6h",
      renal:"CrCl 10–30: 2g IV q8–12h\nHD: 2g after each session",
      ivpo:"Amoxicillin 500mg PO q8h (if E. faecalis susceptible)\nLinezolid 600mg PO q12h (VRE/ampicillin-resistant)",
      deesc:"Add only if Enterococcus risk (urologic procedure, prior ABX, immunocompromised). 5–7d (no bacteremia); 14d (bacteremia).", ref:"IDSA 2024" },
  ],
  pna:[
    { cat:"CAP — Ward", drug:"Ceftriaxone + Azithromycin", dose:"Ceftriaxone 1–2g IV q24h\n+ Azithromycin 500mg IV/PO q24h",
      renal:"Ceftriaxone: biliary elimination — no renal adjustment\nAzithromycin: no adjustment",
      ivpo:"Amoxicillin 1g PO q8h + Azithromycin 250–500mg PO q24h\nOR Levofloxacin 750mg PO q24h",
      deesc:"Total 5 days (ATS/IDSA 2019). Switch when: afebrile ×24h, HR <100, RR <24, tolerating PO.", ref:"ATS/IDSA 2019" },
    { cat:"CAP — Severe / ICU", drug:"Ceftriaxone 2g + Levofloxacin", dose:"Ceftriaxone 2g IV q24h\n+ Levofloxacin 750mg IV q24h",
      renal:"Levofloxacin: CrCl 20–49: 750mg q48h\nCrCl 10–19/HD: 500mg × 1, then 250mg q24h",
      ivpo:"Switch to oral when: afebrile ×24h, HR <100, RR <24, O₂ sat >93% on ≤2L. 5–7d total.",
      deesc:"Add MRSA only if risk factors or MRSA nasal screen positive (NPV >96%). Pseudomonas risk: use antipseudomonal beta-lactam.", ref:"ATS/IDSA 2019" },
    { cat:"MRSA CAP (add-on)", drug:"Vancomycin OR Linezolid", dose:"Vancomycin: 25–30mg/kg IV load, AUC-guided (target 400–600)\nOR Linezolid 600mg IV/PO q12h",
      renal:"Vancomycin: AUC/MIC TDM — pharmacy-directed Bayesian dosing\nLinezolid: no adjustment (hepatic)",
      ivpo:"Linezolid 600mg PO q12h — 100% bioavailability (preferred IV→PO for MRSA)",
      deesc:"DC if MRSA nasal screen negative at 48–72h. If confirmed: 7–14d total.", ref:"Level A" },
    { cat:"HAP — No High-Risk Features", drug:"Piperacillin-Tazobactam", dose:"4.5g IV q6h\nOR extended: 3.375g over 4h q8h",
      renal:"CrCl 20–40: 2.25g IV q6h\nCrCl <20/HD: 2.25g IV q8h + 0.75g post-HD",
      ivpo:"No reliable PO equivalent for HAP — continue IV until clinical stability criteria met",
      deesc:"Duration: 7 days (ATS/IDSA 2016). Alternative: cefepime 2g IV q8h.", ref:"ATS/IDSA 2016" },
    { cat:"HAP/VAP — MRSA + Pseudomonas Risk", drug:"PipTazo + Vancomycin", dose:"PipTazo 4.5g IV q6h\n+ Vancomycin 25–30mg/kg IV load (AUC-guided)",
      renal:"PipTazo + Vancomycin: as above for each agent",
      ivpo:"Linezolid 600mg PO q12h if MRSA confirmed + tolerating PO",
      deesc:"MRSA: DC if nasal screen negative. GNR: narrow based on culture. VAP: 7d; 8d if Pseudomonas.", ref:"ATS/IDSA 2016" },
    { cat:"Influenza Co-Infection (add)", drug:"Oseltamivir (Tamiflu)", dose:"75mg PO q12h × 5 days",
      renal:"CrCl 10–30: 30mg PO q24h\nHD: 30mg after each session",
      ivpo:"Already oral — complete 5-day course",
      deesc:"Start regardless of symptom duration if hospitalized. Complete full 5-day course.", ref:"IDSA 2019" },
  ],
  cns:[
    { cat:"Empiric — Community-Acquired Adult", drug:"Ceftriaxone + Vancomycin + Dexamethasone", dose:"Ceftriaxone 2g IV q12h\n+ Vancomycin 25–30mg/kg load (AUC-guided)\n+ Dexamethasone 0.15mg/kg IV q6h × 4 days",
      renal:"Ceftriaxone: no adjustment\nVancomycin: AUC-guided TDM\nDexamethasone: no adjustment",
      ivpo:"No oral equivalent for bacterial meningitis — full IV course.\nPneumococcal: 10–14d; Meningococcal: 5–7d",
      deesc:"If S. pneumoniae susceptible (MIC <0.12): DC vancomycin, continue ceftriaxone alone.\nIf N. meningitidis: DC vanco, consider step to ampicillin if susceptible.", ref:"IDSA 2017" },
    { cat:"Add: Listeria Risk (Age >50, Immunocompromised)", drug:"+ Ampicillin", dose:"Ampicillin 2g IV q4h",
      renal:"CrCl 10–30: 2g IV q6h\nHD: 2g after each session",
      ivpo:"Amoxicillin 1000mg PO q6–8h (confirmed Listeria + tolerating PO)\nTMP-SMX 5mg/kg IV q6h (penicillin allergy)",
      deesc:"DC if CSF/blood cultures negative at 48h. If Listeria confirmed: 21d (immunocompetent); 4–6 wks (immunocompromised). DC ceftriaxone — cephalosporins INACTIVE vs Listeria.", ref:"IDSA 2017" },
    { cat:"HSV Encephalitis (empiric until PCR)", drug:"Acyclovir", dose:"10mg/kg IV q8h (ideal body weight)",
      renal:"CrCl 25–50: 10mg/kg IV q12h\nCrCl 10–24: 10mg/kg IV q24h\nHD: 5mg/kg after each session",
      ivpo:"Valacyclovir 1000mg PO TID × 14–21d (after IV course)\nOR Acyclovir 800mg PO 5×/day",
      deesc:"DC if HSV PCR (CSF) negative at 72h + non-encephalitic picture. If confirmed: 14d (immunocompetent); 21d (immunocompromised).", ref:"IDSA 2008 upd." },
  ],
  abd:[
    { cat:"Community-Acquired, Mild-Mod", drug:"Piperacillin-Tazobactam", dose:"4.5g IV q6h\nOR extended: 3.375g over 4h q8h",
      renal:"CrCl 20–40: 2.25g IV q6h\nCrCl <20/HD: 2.25g IV q8h + 0.75g post-HD",
      ivpo:"Amoxicillin-Clavulanate 875/125mg PO q8h\nOR Cipro 500mg PO q12h + Metronidazole 500mg PO q8h",
      deesc:"4 days post-source control for mild-mod cIAI (IDSA 2024). Narrow at 48–72h.", ref:"IDSA 2024" },
    { cat:"Severe / Healthcare-Associated", drug:"Meropenem", dose:"1g IV q8h (2g q8h for MDR risk)",
      renal:"CrCl 26–50: 1g IV q12h\nCrCl 10–25: 500mg IV q12h\nHD: 500mg IV q24h (post-HD)",
      ivpo:"Step down to IV pip-tazo or PO amox-clav once cultures available",
      deesc:"De-escalate ASAP once cultures known. 4d total post-source control. ID consult for carbapenems >72h.", ref:"IDSA 2024" },
    { cat:"Biliary Sepsis (Cholangitis)", drug:"Ceftriaxone + Metronidazole", dose:"Ceftriaxone 2g IV q24h\n+ Metronidazole 500mg IV q8h",
      renal:"Ceftriaxone: biliary — no renal adjustment\nMetronidazole: CrCl <10: 500mg IV q12h",
      ivpo:"Cipro 500mg PO q12h + Metronidazole 500mg PO q8h\nOR Amox-Clav 875/125mg PO q8h",
      deesc:"Source control (ERCP/cholecystectomy) is definitive. 5–7d post-source control. PipTazo 4.5g q6h is equivalent monotherapy option.", ref:"Tokyo 2018" },
    { cat:"Candida IAI (Surgical ICU)", drug:"Micafungin OR Fluconazole", dose:"Micafungin 100mg IV q24h\nOR Fluconazole 800mg IV load → 400mg IV q24h",
      renal:"Micafungin: no adjustment\nFluconazole: CrCl <50: reduce dose 50%",
      ivpo:"Fluconazole 400mg PO q24h (excellent bioavailability)\nOR Voriconazole 200mg PO q12h (azole-resistant)",
      deesc:"Echinocandin preferred for ICU. Step to fluconazole after 5–7d if pan-susceptible C. albicans. Duration: 2 wks post-source control.", ref:"IDSA Candida 2016" },
  ],
  ssti:[
    { cat:"Non-Purulent Cellulitis", drug:"Cephalexin OR Cefazolin", dose:"Cephalexin 500mg PO q6h (mild)\nCefazolin 1–2g IV q8h (systemic signs)",
      renal:"Cephalexin: CrCl 10–30: 500mg q8–12h\nCefazolin: CrCl <35: 1g IV q12h; HD: 1–2g after session",
      ivpo:"Cephalexin 500mg PO q6h when afebrile ×24h, improving erythema, tolerating PO.\nTotal: 5–7 days",
      deesc:"Non-purulent cellulitis = overwhelmingly streptococcal. Do NOT add TMP-SMX without culture evidence of MRSA.", ref:"IDSA 2014" },
    { cat:"Purulent SSTI / CA-MRSA", drug:"TMP-SMX DS OR Doxycycline", dose:"TMP-SMX DS 1–2 tabs PO q12h × 5–7d\nOR Doxycycline 100mg PO q12h × 5–7d",
      renal:"TMP-SMX: CrCl <30: AVOID (hyperkalemia risk)\nDoxycycline: no adjustment (hepatic)",
      ivpo:"Already oral. IV equivalent: TMP-SMX 5mg/kg (TMP component) IV q12h",
      deesc:"CA-MRSA usually susceptible to TMP-SMX, doxycycline, clindamycin. I&D is primary treatment for abscesses. Duration: 5d post-I&D; 5–7d cellulitis.", ref:"IDSA 2014" },
    { cat:"Severe MRSA / Bacteremia", drug:"Vancomycin", dose:"25–30mg/kg IV load, then AUC-guided (target AUC/MIC 400–600)",
      renal:"AUC/MIC TDM mandatory — pharmacy-directed Bayesian dosing. Increase interval for CrCl <30.",
      ivpo:"Linezolid 600mg PO q12h — 100% bioavailability (preferred switch)\nOR TMP-SMX 2 DS tabs PO q12h (if susceptible)",
      deesc:"Duration: 5–7d SSTI; 14d bacteremia; 4–6 wks deep tissue. Daptomycin 6–10mg/kg IV q24h is IV alternative (do NOT use for pulmonary MRSA).", ref:"IDSA 2011" },
    { cat:"Necrotizing Fasciitis (Polymicrobial Type I)", drug:"PipTazo + Vancomycin + Clindamycin", dose:"PipTazo 4.5g IV q6h\n+ Vancomycin AUC-guided\n+ Clindamycin 900mg IV q8h (toxin suppression)",
      renal:"PipTazo + Vancomycin: as above\nClindamycin: no adjustment",
      ivpo:"SURGICAL EMERGENCY — not applicable in acute phase. Minimum 7–14d IV post-debridement.",
      deesc:"Culture-directed after OR specimen. Clindamycin × 7–14d for toxin suppression regardless of MIC. IVIG 1–2g/kg may be considered for GAS TSS.", ref:"IDSA 2014" },
    { cat:"Necrotizing Fasciitis (GAS Type II)", drug:"Penicillin G + Clindamycin", dose:"Penicillin G 4MU IV q4h\n+ Clindamycin 900mg IV q8h",
      renal:"Penicillin G: CrCl <30: reduce daily dose 50%\nClindamycin: no adjustment",
      ivpo:"Amoxicillin 1g PO q8h + Clindamycin 300mg PO q6h (after stabilization) × 14d total",
      deesc:"Once GAS confirmed penicillin-susceptible → DC empiric vancomycin. Clindamycin essential for toxin inhibition (Eagle effect).", ref:"IDSA 2014" },
  ],
  neutro:[
    { cat:"Low Risk (MASCC ≥21) — Oral", drug:"Ciprofloxacin + Amox-Clavulanate", dose:"Cipro 500mg PO q12h\n+ Amox-Clav 875/125mg PO q8h",
      renal:"Cipro: CrCl <30: 250–500mg PO q24h\nAmox-Clav: CrCl 10–30: 875/125mg PO q12h",
      ivpo:"Already oral — continue until ANC >500 × 2 days AND afebrile ×24h",
      deesc:"Alternative: Levofloxacin 750mg PO q24h (do NOT use if on FQ prophylaxis).", ref:"IDSA/ASCO 2018" },
    { cat:"High Risk — IV Antipseudomonal", drug:"Cefepime (preferred) OR PipTazo", dose:"Cefepime 2g IV q8h\nOR PipTazo 4.5g IV q6h",
      renal:"Cefepime: CrCl 30–60: 2g IV q12h; CrCl 11–29: 2g IV q24h; HD: 1g after session\nPipTazo: as above",
      ivpo:"Transition to oral when: ANC >200 and recovering, afebrile ×48h, hemodynamically stable",
      deesc:"Continue until ANC >500 if no source. Duration: 7d OR until ANC recovery (whichever later). Narrow at 48–72h if organism identified. Cefepime preferred — less neurotoxicity risk in CKD vs pip-tazo.", ref:"IDSA/ASCO 2018" },
    { cat:"Add MRSA (if indicated)", drug:"Vancomycin", dose:"25–30mg/kg IV load, AUC-guided",
      renal:"AUC/MIC TDM — pharmacy-directed",
      ivpo:"Linezolid 600mg PO q12h (confirmed MRSA + tolerating PO)",
      deesc:"DISCONTINUE at 48–72h if no MRSA on cultures, no catheter infection, hemodynamically stable. Do NOT continue empirically >72h without indication.", ref:"IDSA/ASCO 2018" },
    { cat:"Antifungal Escalation (Fever >96h)", drug:"Micafungin OR Caspofungin", dose:"Micafungin 100mg IV q24h\nOR Caspofungin 70mg load → 50mg IV q24h",
      renal:"Echinocandins: no renal adjustment (hepatic metabolism)",
      ivpo:"Fluconazole 400mg PO q24h (C. albicans)\nVoriconazole 200mg PO q12h (Aspergillus — first-line)",
      deesc:"Continue until ANC >500 and afebrile. Aspergillus: escalate to voriconazole. Duration: ≥2 wks for confirmed invasive fungal.", ref:"IDSA/ASCO 2018" },
  ],
  shock:[
    { cat:"First-Line Vasopressor", drug:"Norepinephrine", dose:"0.01–3 mcg/kg/min IV\nTitrate to MAP ≥65 mmHg",
      renal:"No adjustment. Preferred over dopamine.",
      ivpo:"N/A — ICU agent. Peripheral NE acceptable ≤24h (forearm preferred).",
      deesc:"Wean 0.02–0.05 mcg/kg/min q30–60min. Add vasopressin if NE >0.25 mcg/kg/min.", ref:"SSC 2021" },
    { cat:"Second-Line Vasopressor", drug:"Vasopressin", dose:"0.03 units/min IV (FIXED — do not titrate)",
      renal:"No adjustment. Fixed dose.",
      ivpo:"N/A",
      deesc:"Wean norepinephrine first; DC vasopressin last.", ref:"Level A" },
    { cat:"Corticosteroids (refractory)", drug:"Hydrocortisone", dose:"200 mg/day IV continuous\nOR 50mg IV q6h",
      renal:"No adjustment.",
      ivpo:"Not routinely converted to oral.",
      deesc:"Indicated: NE >0.25 mcg/kg/min × >4h despite adequate resuscitation. DC when vasopressors no longer needed.", ref:"SSC 2021" },
    { cat:"Inotrope (cardiogenic component)", drug:"Dobutamine", dose:"2–20 mcg/kg/min IV — titrate to CO response",
      renal:"No adjustment.",
      ivpo:"N/A",
      deesc:"Consider for sepsis-induced cardiomyopathy (reduced EF on echo) with evidence of hypoperfusion despite adequate MAP. Wean as ScvO₂ normalizes.", ref:"SSC 2021" },
  ],
};

/* ═══ CLINICAL OVERVIEW DATA ════════════════════════════════════════ */
const OVERVIEW = {
  screening:{
    def:"Sepsis-3 (Singer et al. JAMA 2016): Life-threatening organ dysfunction caused by dysregulated host response to infection. Operationally defined as SOFA score increase ≥2 from baseline + suspected infection. qSOFA is a rapid bedside screening tool (non-ICU). SIRS criteria (≥2) are retained for sensitivity but lack specificity for organ dysfunction.",
    bullets:[
      "SOFA ≥2 + suspected infection = SEPSIS (replaces prior 2-SIRS definition)",
      "qSOFA ≥2: high mortality risk → initiate full sepsis workup",
      "Septic Shock = Sepsis + vasopressor (MAP ≥65) + lactate >2 mmol/L despite ≥30 mL/kg fluid",
      "Hour-1 Bundle (SSC 2021): Lactate, blood cultures ×2, broad ABX, 30 mL/kg crystalloid if hypotension/lactate ≥4",
    ],
  },
  shock:{
    def:"Septic Shock (Sepsis-3): Subset of sepsis with profound circulatory and cellular metabolic abnormalities with substantially higher mortality (>40%). Defined as sepsis AND vasopressor requirement for MAP ≥65 AND lactate >2 mmol/L despite adequate fluid resuscitation (≥30 mL/kg). Distinguish from cardiogenic/obstructive shock with RUSH echo.",
    bullets:[
      "MAP <65 persisting after ≥30 mL/kg crystalloid → vasopressor required",
      "Lactate >2 mmol/L despite resuscitation = cellular dysoxia",
      "RUSH exam: cardiac EF, IVC collapsibility (fluid responsiveness), rule out tamponade/PE",
      "Obtain arterial line + central access when hemodynamically feasible",
    ],
  },
  uro:{ def:"Urosepsis: Sepsis from urinary tract source. Includes severe pyelonephritis, complicated UTI, obstructive uropathy (stone, BPH, malignancy), CAUTI. E. coli (70%), Klebsiella, Proteus, Enterococcus, Pseudomonas (nosocomial). ESBL-producing organisms 10–30% community-acquired in USA.", bullets:["Identify obstruction immediately — hydronephrosis on POCUS = urgent urology consult for PCN/stenting","CAUTI: remove/replace catheter as source control","Bacteremia in 20–30% → extends duration to 10–14 days","FQ resistance in E. coli >20% in most US regions — do NOT use FQ empirically without local antibiogram"] },
  pna:{ def:"Pneumonia-source sepsis: CAP (<48h of admission), HAP (≥48h, non-ventilated), VAP (≥48h post-intubation). CURB-65 ≥3 or PSI Class IV–V = ICU consideration. ATS/IDSA major criteria (MV, septic shock) = automatic ICU. Always send Legionella + pneumococcal UAg for ICU CAP.", bullets:["CURB-65: Confusion, BUN>19, RR≥30, BP<90/60, Age≥65 (1pt each) — score 0–1: outpt; 2: inpt; 3+: ICU","Legionella + Pneumococcal urinary antigens mandatory for ICU CAP","HAP/VAP: risk-stratify for MRSA and Pseudomonas before empiric coverage","Influenza positive → add oseltamivir regardless of symptom duration"] },
  cns:{ def:"Bacterial meningitis sepsis. Adults: S. pneumoniae (most common), N. meningitidis (young adults), Listeria (>50yo, immunocompromised, pregnant). Classic triad (fever+neck stiffness+AMS) in only 44%. ANTIBIOTICS FIRST — do not delay >30 min for CT or LP. Dexamethasone BEFORE or WITH first antibiotic dose.", bullets:["Do NOT delay antibiotics for CT head or LP if clinical suspicion high","Dexamethasone 0.15mg/kg IV q6h × 4 days — give BEFORE or WITH first antibiotic dose","CT before LP ONLY if: focal neuro deficit, papilledema, immunocompromised, new seizure, GCS <10","Listeria intrinsically resistant to all cephalosporins — add ampicillin if Listeria risk"] },
  abd:{ def:"Intra-abdominal sepsis: secondary peritonitis, complicated intra-abdominal infection (cIAI), biliary sepsis. Source control (drainage, debridement, surgical repair) is definitive treatment — target within 6–12 hours of diagnosis. Antibiotics are adjunctive. Delay in source control is major independent predictor of mortality.", bullets:["Source control within 6–12h = #1 priority; each hour of delay increases mortality","Tokyo 2018 Grade III cholangitis: organ dysfunction = urgent ERCP/PTC within 24h","IDSA 2024: 4 days post-source control for most cIAI (shorter than prior guidelines)","Candida IAI: echinocandin empirically for ICU patients with recurrent perforation/immunosuppression"] },
  ssti:{ def:"SSTI sepsis: from non-purulent cellulitis (streptococcal) to necrotizing fasciitis (surgical emergency). Type I NF: polymicrobial (GN/GP/anaerobes). Type II NF: Group A Streptococcus (most virulent). NF cannot be treated with antibiotics alone — emergent OR within 6 hours.", bullets:["NF: pain out of proportion, rapid spread, crepitus, skin necrosis → OR within 6h","LRINEC score ≥6: CRP>150(4), WBC>15(1), Hgb<13.5(1), Na<135(2), Cr>1.6(2), Glu>180(1)","Non-purulent cellulitis = streptococcal; do NOT add MRSA coverage empirically without risk factors","MRSA nasal screen NPV >96% — negative screen = strong support to DC vancomycin"] },
  neutro:{ def:"Febrile Neutropenia: Temp ≥38.3°C (once) OR ≥38°C × ≥1h, with ANC <500 or <1000 and declining. MASCC score ≥21 = low risk (oral ABX, early discharge possible); <21 = high risk (IV ABX, inpatient). Gram-negative bacteremia highest mortality; Gram-positives now more common due to mucosal breakdown and CVC use.", bullets:["MASCC ≥21 (low risk): no hypotension, no COPD, solid tumor/no prior fungal, outpatient onset, no dehydration, age <60","ANC recovery (>500 × 2 days) guides antibiotic discontinuation — not clinical improvement alone","Cefepime preferred over pip-tazo in CKD (less neurotoxicity risk)","Antifungal escalation: persistent fever >72–96h despite ABX with no bacterial source identified"] },
  steward:{ def:"Antibiotic Stewardship in Sepsis: IDSA/SHEA Core Elements (2023): timely empiric ABX (≤1h), blood cultures before antibiotics, mandatory 48–72h reassessment, de-escalation based on cultures, biomarker-guided duration (PCT), IV-to-PO conversion, and local resistance monitoring. Poor stewardship → C. difficile, MDR selection, drug toxicity.", bullets:["48–72h Antibiotic Time-Out: indication, organism, appropriateness, de-escalation opportunity, stop date","PCT <0.25 μg/L → strong recommendation to stop antibiotics (PRORATA trial)","AUC/MIC-guided vancomycin (ASHP/SIDP/IDSA 2020) — trough monitoring is OBSOLETE","Set antibiotic stop date at TIME OF INITIATION (Day 1 protocol)"] },
};

/* ═══ qSOFA CALCULATOR ══════════════════════════════════════════════ */
function QSOFACalc() {
  const [c, setC] = useState({rr:false,ams:false,sbp:false});
  const score = Object.values(c).filter(Boolean).length;
  const toggle = k => setC(p=>({...p,[k]:!p[k]}));
  const riskColor = score>=2 ? T.coral : score===1 ? T.gold : T.teal;
  const riskLabel = score>=2 ? "HIGH RISK" : score===1 ? "ELEVATED" : "LOW RISK";
  const items = [
    {k:"rr",  label:"Respiratory Rate ≥22 /min", icon:"🫁"},
    {k:"ams", label:"Altered Mentation (GCS <15)", icon:"🧠"},
    {k:"sbp", label:"Systolic BP ≤100 mmHg",     icon:"❤️"},
  ];
  return (
    <div style={{background:"rgba(245,200,66,0.05)",border:"1px solid rgba(245,200,66,0.22)",borderRadius:12,padding:"14px 16px",marginBottom:12}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
        <span>📊</span>
        <span style={{fontSize:12,fontWeight:700,color:T.txt}}>qSOFA Score Calculator</span>
        <span style={{fontSize:9,color:T.txt4,marginLeft:"auto",fontFamily:"monospace"}}>≥2 = HIGH RISK</span>
      </div>
      {items.map(it=>(
        <div key={it.k} onClick={()=>toggle(it.k)} style={{display:"flex",alignItems:"center",gap:10,background:c[it.k]?"rgba(245,200,66,0.13)":"rgba(14,37,68,0.5)",border:`1px solid ${c[it.k]?"rgba(245,200,66,0.5)":T.b}`,borderRadius:8,padding:"9px 12px",marginBottom:6,cursor:"pointer",transition:"all .18s"}}>
          <div style={{width:22,height:22,borderRadius:6,flexShrink:0,background:c[it.k]?"rgba(245,200,66,0.25)":"rgba(26,53,85,0.5)",border:`1px solid ${c[it.k]?"rgba(245,200,66,0.7)":T.b}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:c[it.k]?T.gold:T.txt3,fontWeight:700}}>
            {c[it.k]?"✓":it.icon}
          </div>
          <span style={{fontSize:12,color:c[it.k]?T.gold:T.txt2,fontWeight:c[it.k]?600:400}}>{it.label}</span>
          <span style={{marginLeft:"auto",fontSize:12,fontWeight:700,color:c[it.k]?T.gold:T.txt4,fontFamily:"monospace"}}>+1</span>
        </div>
      ))}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"rgba(14,37,68,0.7)",border:`1px solid ${riskColor}35`,borderRadius:10,padding:"10px 14px",marginTop:10}}>
        <div>
          <div style={{fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:".07em",marginBottom:3}}>qSOFA Score</div>
          <div style={{fontSize:26,fontWeight:700,color:riskColor,fontFamily:"monospace",lineHeight:1}}>{score}<span style={{fontSize:13}}> / 3</span></div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:11,fontWeight:700,color:riskColor,background:`${riskColor}18`,border:`1px solid ${riskColor}40`,borderRadius:6,padding:"4px 10px",marginBottom:4}}>{riskLabel}</div>
          <div style={{fontSize:10,color:T.txt3}}>{score>=2?"Full sepsis workup · ICU evaluation":score===1?"Close monitoring required":"Continue assessment"}</div>
        </div>
      </div>
    </div>
  );
}

/* ═══ SIRS CALCULATOR ═══════════════════════════════════════════════ */
function SIRSCalc() {
  const [c, setC] = useState({temp:false,hr:false,rr:false,wbc:false});
  const score = Object.values(c).filter(Boolean).length;
  const toggle = k => setC(p=>({...p,[k]:!p[k]}));
  const sirs = score >= 2;
  const items = [
    {k:"temp",label:"Temp >38°C or <36°C",                    icon:"🌡️"},
    {k:"hr",  label:"Heart Rate >90 bpm",                     icon:"❤️"},
    {k:"rr",  label:"RR >20/min or PaCO₂ <32 mmHg",           icon:"🫁"},
    {k:"wbc", label:"WBC >12k or <4k or >10% bands",          icon:"🔬"},
  ];
  return (
    <div style={{background:"rgba(59,158,255,0.05)",border:"1px solid rgba(59,158,255,0.22)",borderRadius:12,padding:"14px 16px",marginBottom:12}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
        <span>🩺</span>
        <span style={{fontSize:12,fontWeight:700,color:T.txt}}>SIRS Criteria Calculator</span>
        <span style={{fontSize:9,color:T.txt4,marginLeft:"auto",fontFamily:"monospace"}}>≥2 = SIRS PRESENT</span>
      </div>
      {items.map(it=>(
        <div key={it.k} onClick={()=>toggle(it.k)} style={{display:"flex",alignItems:"center",gap:10,background:c[it.k]?"rgba(59,158,255,0.11)":"rgba(14,37,68,0.5)",border:`1px solid ${c[it.k]?"rgba(59,158,255,0.45)":T.b}`,borderRadius:8,padding:"9px 12px",marginBottom:6,cursor:"pointer",transition:"all .18s"}}>
          <div style={{width:22,height:22,borderRadius:6,flexShrink:0,background:c[it.k]?"rgba(59,158,255,0.22)":"rgba(26,53,85,0.5)",border:`1px solid ${c[it.k]?"rgba(59,158,255,0.6)":T.b}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:c[it.k]?T.blue:T.txt3,fontWeight:700}}>
            {c[it.k]?"✓":it.icon}
          </div>
          <span style={{fontSize:12,color:c[it.k]?T.blue:T.txt2,fontWeight:c[it.k]?600:400}}>{it.label}</span>
        </div>
      ))}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"rgba(14,37,68,0.7)",border:`1px solid ${sirs?"rgba(59,158,255,0.45)":T.b}`,borderRadius:10,padding:"10px 14px",marginTop:10}}>
        <div>
          <div style={{fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:".07em",marginBottom:3}}>Criteria Met</div>
          <div style={{fontSize:26,fontWeight:700,color:sirs?T.blue:T.txt3,fontFamily:"monospace",lineHeight:1}}>{score}<span style={{fontSize:13}}> / 4</span></div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:11,fontWeight:700,color:sirs?T.blue:T.txt3,background:sirs?"rgba(59,158,255,0.12)":"rgba(26,53,85,0.3)",border:`1px solid ${sirs?"rgba(59,158,255,0.35)":T.b}`,borderRadius:6,padding:"4px 10px",marginBottom:4}}>{sirs?"SIRS PRESENT":"NO SIRS"}</div>
          <div style={{fontSize:10,color:T.txt3}}>{sirs?"Assess for infection source + organ dysfunction":"Continue monitoring"}</div>
        </div>
      </div>
    </div>
  );
}

/* ═══ FLUID BOLUS CALCULATOR ════════════════════════════════════════ */
function FluidBolus() {
  const [wt, setWt] = useState("");
  const [unit, setUnit] = useState("kg");
  const wKg = unit==="lb" ? parseFloat(wt)*0.453592 : parseFloat(wt);
  const bolus = !isNaN(wKg) && wKg>0 ? Math.round(wKg*30) : null;
  return (
    <div style={{background:"rgba(0,212,255,0.05)",border:"1px solid rgba(0,212,255,0.22)",borderRadius:12,padding:"14px 16px"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
        <span>💧</span>
        <span style={{fontSize:12,fontWeight:700,color:T.txt}}>Fluid Bolus Calculator</span>
        <span style={{fontSize:9,fontFamily:"monospace",color:T.cyan,marginLeft:"auto",background:"rgba(0,212,255,0.1)",border:"1px solid rgba(0,212,255,0.3)",padding:"2px 7px",borderRadius:20}}>30 mL/kg SSC</span>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:10}}>
        <input type="number" placeholder="Patient weight…" value={wt} onChange={e=>setWt(e.target.value)}
          style={{flex:1,background:"rgba(14,37,68,0.7)",border:"1px solid rgba(0,212,255,0.3)",borderRadius:8,padding:"8px 12px",color:T.txt,fontFamily:"monospace",fontSize:13,outline:"none"}} />
        <div style={{display:"flex",borderRadius:8,overflow:"hidden",border:`1px solid ${T.b}`,flexShrink:0}}>
          {["kg","lb"].map(u=>(
            <button key={u} onClick={()=>setUnit(u)} style={{padding:"8px 14px",cursor:"pointer",border:"none",background:unit===u?"rgba(0,212,255,0.2)":"rgba(14,37,68,0.5)",color:unit===u?T.cyan:T.txt3,fontSize:11,fontWeight:700,fontFamily:"sans-serif",transition:"all .2s"}}>{u}</button>
          ))}
        </div>
      </div>
      {bolus ? (
        <div style={{background:"rgba(0,212,255,0.1)",border:"1px solid rgba(0,212,255,0.3)",borderRadius:10,padding:"12px 16px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
            <div>
              <div style={{fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:".07em",marginBottom:4}}>Total Fluid Bolus (30 mL/kg)</div>
              <div style={{fontSize:28,fontWeight:700,color:T.cyan,fontFamily:"monospace",lineHeight:1}}>{bolus.toLocaleString()} <span style={{fontSize:14}}>mL</span></div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:9,color:T.txt4,letterSpacing:".07em",marginBottom:4}}>IN BAGS</div>
              <div style={{fontSize:14,fontWeight:700,color:T.blue,fontFamily:"monospace"}}>{Math.ceil(bolus/500)} × 500 mL</div>
              <div style={{fontSize:11,color:T.txt3}}>or {Math.ceil(bolus/1000)} × 1L bag{Math.ceil(bolus/1000)>1?"s":""}</div>
            </div>
          </div>
          <div style={{fontSize:10,color:T.txt3,borderTop:`1px solid rgba(0,212,255,0.15)`,paddingTop:8,marginTop:4}}>
            {unit==="lb"?`${parseFloat(wt)} lb → ${wKg.toFixed(1)} kg · `:`${wKg} kg · `}
            Give over <strong style={{color:T.txt2}}>15–30 min</strong> (septic shock) or <strong style={{color:T.txt2}}>30–60 min</strong> (sepsis, no shock)
          </div>
        </div>
      ) : (
        <div style={{fontSize:11,color:T.txt4,textAlign:"center",padding:"12px 0"}}>Enter patient weight above</div>
      )}
      <div style={{fontSize:9,color:T.txt4,marginTop:8,fontFamily:"monospace",lineHeight:1.7}}>
        ⚠ SSC 2021: Prefer balanced crystalloids (Lactated Ringer's &gt; Normal Saline). Reassess after bolus — use dynamic fluid responsiveness (PLR, PPV, IVC collapsibility) to guide further administration.
      </div>
    </div>
  );
}

/* ═══ AI RESISTANCE LOOKUP ══════════════════════════════════════════ */
function ResistanceAI() {
  const [loc, setLoc] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState(null);

  const lookup = async () => {
    if (!loc.trim()) return;
    setLoading(true); setErr(null); setResult(null);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Provide antimicrobial resistance rates for sepsis management at or near: ${loc}. Return ONLY a valid JSON object — no markdown, no preamble: {"location":"name","note":"one-sentence data source","updated":"year range","rates":[{"organism":"E. coli","antibiotic":"Fluoroquinolones","resistance":"25–35%","trend":"rising","impact":"Avoid FQ empirically for urosepsis"},{"organism":"E. coli","antibiotic":"3rd-gen Cephalosporins (ESBL)","resistance":"12–20%","trend":"stable","impact":"ESBL risk stratification required"},{"organism":"Klebsiella pneumoniae","antibiotic":"Carbapenems (CRE)","resistance":"2–5%","trend":"rising","impact":"CRE screen for prior healthcare exposure"},{"organism":"S. aureus","antibiotic":"Methicillin (MRSA)","resistance":"30–40%","trend":"decreasing","impact":"MRSA nasal screen before vancomycin"},{"organism":"S. pneumoniae","antibiotic":"Penicillin (non-susceptible)","resistance":"25–30%","trend":"stable","impact":"Add vancomycin for empiric meningitis"},{"organism":"Pseudomonas aeruginosa","antibiotic":"Piperacillin-Tazobactam","resistance":"15–25%","trend":"stable","impact":"Extended infusion may improve PTA"},{"organism":"Enterococcus spp.","antibiotic":"Vancomycin (VRE)","resistance":"10–20%","trend":"rising","impact":"VRE risk for nosocomial/abdominal sepsis"},{"organism":"Acinetobacter spp.","antibiotic":"Carbapenems","resistance":"40–60%","trend":"rising","impact":"MDR-Ab — ID consult mandatory"}]}`,
        response_json_schema: {
          type: "object",
          properties: {
            location: { type: "string" },
            note: { type: "string" },
            updated: { type: "string" },
            rates: { type: "array", items: { type: "object", properties: { organism:{type:"string"}, antibiotic:{type:"string"}, resistance:{type:"string"}, trend:{type:"string"}, impact:{type:"string"} } } }
          }
        }
      });
      setResult(result);
    } catch(e) { setErr("Unable to retrieve data. Check connection and try again."); }
    setLoading(false);
  };

  const trendIcon = t => t==="rising"?"↑":t==="decreasing"?"↓":"→";
  const trendColor = t => t==="rising"?T.coral:t==="decreasing"?T.teal:T.gold;
  const resColor = r => { const n=parseFloat(r); return n>30?T.coral:n>15?T.gold:T.teal; };

  return (
    <div style={{background:"rgba(61,255,160,0.04)",border:"1px solid rgba(61,255,160,0.2)",borderRadius:14,padding:"16px"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
        <span style={{fontSize:16}}>🌐</span>
        <div>
          <div style={{fontSize:13,fontWeight:700,color:T.txt}}>AI Local Resistance Lookup</div>
          <div style={{fontSize:10,color:T.txt3}}>Enter hospital name or city — AI estimates local antimicrobial resistance rates for your region</div>
        </div>
        <span style={{fontSize:9,fontFamily:"monospace",fontWeight:700,padding:"2px 8px",borderRadius:20,background:"rgba(61,255,160,0.12)",border:"1px solid rgba(61,255,160,0.35)",color:T.green,marginLeft:"auto",flexShrink:0}}>AI-POWERED</span>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        <input type="text" placeholder="e.g. Mayo Clinic Rochester  ·  New York City  ·  Chicago IL…" value={loc} onChange={e=>setLoc(e.target.value)} onKeyDown={e=>e.key==="Enter"&&lookup()}
          style={{flex:1,background:"rgba(14,37,68,0.7)",border:"1px solid rgba(61,255,160,0.25)",borderRadius:9,padding:"9px 14px",color:T.txt,fontFamily:"sans-serif",fontSize:12,outline:"none"}} />
        <button onClick={lookup} disabled={loading||!loc.trim()}
          style={{padding:"9px 18px",borderRadius:9,border:"none",cursor:loading||!loc.trim()?"not-allowed":"pointer",background:loading||!loc.trim()?"rgba(61,255,160,0.1)":"rgba(61,255,160,0.8)",color:loading||!loc.trim()?T.txt4:T.bg,fontSize:12,fontWeight:700,fontFamily:"sans-serif",transition:"all .2s",flexShrink:0}}>
          {loading?"Fetching…":"Look Up"}
        </button>
      </div>
      {err && <div style={{fontSize:11,color:T.coral,padding:"10px 14px",background:"rgba(255,107,107,0.08)",borderRadius:8,border:"1px solid rgba(255,107,107,0.2)"}}>⚠ {err}</div>}
      {loading && <div style={{textAlign:"center",padding:"24px 0",color:T.txt3,fontSize:12}}>Querying resistance data for <strong style={{color:T.txt}}>{loc}</strong>…</div>}
      {result && (
        <div>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,padding:"8px 12px",background:"rgba(61,255,160,0.07)",borderRadius:8,border:"1px solid rgba(61,255,160,0.2)"}}>
            <span>📍</span>
            <div>
              <div style={{fontSize:11,fontWeight:700,color:T.green}}>{result.location}</div>
              <div style={{fontSize:10,color:T.txt3}}>{result.note} · {result.updated}</div>
            </div>
            <span style={{marginLeft:"auto",fontSize:9,color:T.txt4,fontFamily:"monospace"}}>ESTIMATED · VERIFY WITH LOCAL ANTIBIOGRAM</span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 90px 70px",gap:6,padding:"5px 10px",fontSize:9,fontWeight:700,color:T.txt4,textTransform:"uppercase",letterSpacing:".07em"}}>
            <div>Organism</div><div>Antibiotic</div><div>Resistance</div><div>Trend</div>
          </div>
          {result.rates.map((r,i)=>(
            <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 1fr 90px 70px",gap:6,background:i%2===0?"rgba(14,37,68,0.5)":"rgba(8,22,40,0.4)",border:`1px solid ${T.b}`,borderRadius:8,padding:"9px 10px",marginBottom:4,alignItems:"center"}}>
              <div style={{fontSize:11,fontWeight:600,color:T.txt}}>{r.organism}</div>
              <div style={{fontSize:11,color:T.txt2}}>{r.antibiotic}</div>
              <div style={{fontSize:13,fontWeight:700,color:resColor(r.resistance),fontFamily:"monospace"}}>{r.resistance}</div>
              <div style={{fontSize:11,fontWeight:700,color:trendColor(r.trend),display:"flex",alignItems:"center",gap:3}}>
                <span style={{fontSize:14}}>{trendIcon(r.trend)}</span>
                <span style={{fontSize:9,color:T.txt4,textTransform:"capitalize"}}>{r.trend}</span>
              </div>
              <div style={{gridColumn:"1/-1",fontSize:10,color:T.txt3,borderTop:`1px solid ${T.b}`,paddingTop:4,marginTop:2}}>⚠ {r.impact}</div>
            </div>
          ))}
          <div style={{fontSize:9,color:T.txt4,marginTop:8,fontFamily:"monospace",lineHeight:1.6}}>AI-estimated data — always verify with your institutional antibiogram. Not a substitute for local surveillance data.</div>
        </div>
      )}
    </div>
  );
}

/* ═══ ENHANCED DRUG ROW ════════════════════════════════════════════ */
function DrugRow({ rx }) {
  const [open, setOpen] = useState(null);
  const panels = [
    {k:"renal",  icon:"🫘", label:"Renal Dosing",  color:T.blue},
    {k:"ivpo",   icon:"💊", label:"IV → PO Switch", color:T.teal},
    {k:"deesc",  icon:"📉", label:"De-escalation",  color:T.green},
  ];
  const refStyle = (ref) => {
    if (!ref) return {};
    const isLevelA = ref.includes("Level A") || ref.includes("SSC") || ref.includes("ATS");
    const isLevelB = ref.includes("Level B");
    return isLevelA ? {bg:"rgba(0,229,192,0.1)",border:"1px solid rgba(0,229,192,0.4)",color:T.teal}
         : isLevelB ? {bg:"rgba(59,158,255,0.1)",border:"1px solid rgba(59,158,255,0.4)",color:T.blue}
         : {bg:"rgba(155,109,255,0.1)",border:"1px solid rgba(155,109,255,0.3)",color:T.purple};
  };
  const rs = refStyle(rx.ref);
  return (
    <div style={{background:"rgba(14,37,68,0.45)",border:`1px solid ${T.b}`,borderRadius:10,marginBottom:8,overflow:"hidden"}}>
      <div style={{padding:"11px 14px"}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8,marginBottom:4}}>
          <div>
            <div style={{fontSize:12,fontWeight:700,color:T.txt}}>{rx.drug}</div>
            {rx.cat && <div style={{fontSize:10,color:T.txt3,marginTop:1}}>{rx.cat}</div>}
          </div>
          {rx.ref && <span style={{fontSize:9,fontFamily:"monospace",fontWeight:700,padding:"2px 7px",borderRadius:20,flexShrink:0,background:rs.bg,border:rs.border,color:rs.color}}>{rx.ref}</span>}
        </div>
        <div style={{fontSize:12,color:T.txt2,fontFamily:"monospace",lineHeight:1.6,whiteSpace:"pre-wrap"}}>{rx.dose}</div>
      </div>
      <div style={{display:"flex",borderTop:`1px solid ${T.b}`,background:"rgba(5,15,30,0.4)"}}>
        {panels.filter(p=>rx[p.k]).map((p,i,arr)=>(
          <button key={p.k} onClick={()=>setOpen(open===p.k?null:p.k)} style={{flex:1,padding:"6px 4px",border:"none",borderRight:i<arr.length-1?`1px solid ${T.b}`:`none`,background:open===p.k?`${p.color}12`:"transparent",color:open===p.k?p.color:T.txt4,fontSize:10,fontWeight:open===p.k?700:500,cursor:"pointer",transition:"all .18s",fontFamily:"sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
            <span>{p.icon}</span>{p.label}
          </button>
        ))}
      </div>
      {open && rx[open] && (
        <div style={{padding:"10px 14px",background:`${panels.find(p=>p.k===open)?.color}08`,borderTop:`1px solid ${panels.find(p=>p.k===open)?.color}25`,fontSize:11,color:T.txt2,lineHeight:1.65,whiteSpace:"pre-wrap"}}>
          <span style={{color:panels.find(p=>p.k===open)?.color,fontWeight:700,marginRight:6}}>{panels.find(p=>p.k===open)?.icon}</span>{rx[open]}
        </div>
      )}
    </div>
  );
}

/* ═══ WORKUP ITEM ═══════════════════════════════════════════════════ */
const WORKUP = {
  screening:[
    {icon:"🩸",label:"Blood Cultures × 2 sets",detail:"Aerobic + anaerobic from 2 separate venipuncture sites before antibiotics. Do NOT delay ABX >45 min. Positive in 30–40% of sepsis."},
    {icon:"🧪",label:"Serum Lactate",detail:"Lactate ≥4 mmol/L = high-risk → immediate resuscitation. Lactate 2–4 = intermediate. Repeat at 2h; target >10% clearance."},
    {icon:"📊",label:"CBC with Differential",detail:"WBC/bands (SIRS criterion), platelets (SOFA coag: <100k = 2pts, <50k = 3pts)."},
    {icon:"🫀",label:"BMP / CMP",detail:"Creatinine (SOFA renal), bilirubin (SOFA hepatic), glucose. Creatinine rise ≥0.5 from baseline scores SOFA."},
    {icon:"💉",label:"Coagulation — PT/INR",detail:"INR >1.5 = SOFA coagulation 2pts. Check fibrinogen + d-dimer if DIC suspected."},
    {icon:"🫁",label:"ABG / VBG",detail:"pH, PaCO₂, HCO₃, lactate. PaO₂/FiO₂ ratio for SOFA respiratory score."},
    {icon:"🔬",label:"Procalcitonin (PCT)",detail:"Baseline for stewardship. PCT <0.25 μg/L → consider stopping ABX. PCT >10 strongly supports bacterial sepsis."},
    {icon:"📸",label:"CXR + Source Imaging",detail:"CXR for pneumonia. Consider CT CAP for occult source (abscess, perforation, cholangitis)."},
    {icon:"💧",label:"Urinalysis + Urine Culture",detail:"UA + culture before antibiotics. Catheter specimen if unable to void."},
    {icon:"🧫",label:"Source-Specific Cultures",detail:"Sputum/BAL (respiratory), wound/deep tissue (SSTI), intraop cultures (surgical), LP (CNS). Send before ABX."},
  ],
  shock:[
    {icon:"🫀",label:"RUSH / FATE Echo",detail:"Cardiac EF, wall motion. IVC collapsibility (>50% = fluid responsive). Rule out tamponade, tension PTX, massive PE (McConnell sign)."},
    {icon:"💉",label:"Central Venous Access",detail:"Preferred for vasopressors. Peripheral NE acceptable ≤24h (forearm preferred)."},
    {icon:"🩸",label:"Arterial Line",detail:"Continuous BP monitoring mandatory once vasopressors running. Radial preferred."},
    {icon:"📊",label:"Serial Lactate (q2h)",detail:"Target >10% clearance per 2h. Failure to clear with adequate MAP suggests pump failure."},
    {icon:"🫁",label:"ScvO₂",detail:"Target ≥70%. Low ScvO₂ with adequate MAP = low cardiac output or severe anemia."},
  ],
  uro:[
    {icon:"💧",label:"Urinalysis + Urine Culture (pre-ABX)",detail:"Mid-stream clean catch or catheter specimen. Culture BEFORE antibiotics."},
    {icon:"🩻",label:"Renal/Bladder POCUS",detail:"Rule out hydronephrosis (obstruction). If obstruction → urgent urology consult for PCN/stent."},
    {icon:"🩸",label:"Blood Cultures × 2",detail:"Bacteremia in 20–30% of urosepsis. Extends treatment to 10–14d if positive."},
    {icon:"📊",label:"BMP — Renal Function",detail:"Baseline creatinine for CrCl calculation and antibiotic dosing."},
    {icon:"📸",label:"CT A/P with IV Contrast",detail:"If US non-diagnostic: perinephric abscess, stone, gas-forming infection."},
  ],
  pna:[
    {icon:"📸",label:"CXR / CT Chest",detail:"CXR for infiltrate, effusion, cavitation. CT for complex cases or when CXR non-diagnostic."},
    {icon:"🧫",label:"Sputum Culture + Gram Stain",detail:"Before ABX. Good quality: >25 PMNs, <10 squamous cells/LPF."},
    {icon:"🩸",label:"Blood Cultures × 2",detail:"Positive in ~10% CAP; higher in ICU. Mandatory for ICU-admitted."},
    {icon:"🔬",label:"Legionella + Pneumococcal UAg",detail:"Mandatory for ICU CAP. Legionella UAg >99% specific for L. pneumophila sg1."},
    {icon:"🧪",label:"Respiratory Viral Panel",detail:"Influenza A/B + RSV. Positive → add oseltamivir. Guides isolation precautions."},
    {icon:"📊",label:"CURB-65",detail:"Confusion(1), BUN>19(1), RR≥30(1), BP<90/60(1), Age≥65(1). Score 0–1: outpt; 2: inpt; 3+: ICU."},
  ],
  cns:[
    {icon:"🧫",label:"CSF Analysis (LP)",detail:"Opening pressure, cell count, glucose, protein, Gram stain, culture, PCR. Bacterial: WBC>100 PMN, glucose<45, protein>100."},
    {icon:"🩸",label:"Blood Cultures × 2 (BEFORE ABX)",detail:"Positive in 50–80% of bacterial meningitis — critical if LP delayed."},
    {icon:"📸",label:"CT Head (non-contrast)",detail:"ONLY if: focal deficit, papilledema, immunocompromised, new seizure, GCS <10."},
    {icon:"💉",label:"HSV PCR (CSF)",detail:"Mandatory if encephalitic features. Add acyclovir empirically until result returns."},
    {icon:"🔬",label:"Meningococcal/Pneumococcal PCR",detail:"Remains positive 24–48h after ABX started — essential if ABX given before LP."},
  ],
  abd:[
    {icon:"📸",label:"CT A/P (IV Contrast)",detail:"Gold standard. Non-contrast only if contrast contraindicated. Required for abscess/vascular assessment."},
    {icon:"🩻",label:"RUQ Ultrasound (biliary source)",detail:"96% sensitivity for cholecystitis. Quick, bedside, no radiation. Follow with CT if inconclusive."},
    {icon:"🩸",label:"Blood Cultures × 2",detail:"Bacteremia in 30–40% of biliary sepsis. Draw before antibiotics."},
    {icon:"🧫",label:"Intraoperative/Drain Cultures",detail:"Aerobic, anaerobic, AND fungal from all surgical specimens. Critical for de-escalation."},
    {icon:"📊",label:"LFTs, Bilirubin, Lipase, Lactate",detail:"Biliary: bilirubin, ALP, GGT. Pancreatitis: lipase >3× ULN. Bowel ischemia: lactate elevation."},
  ],
  ssti:[
    {icon:"📸",label:"CT Soft Tissue (IV Contrast)",detail:"NF: gas in soft tissue, fascial plane fluid, non-enhancement. Do NOT delay OR for CT if NF clinically clear."},
    {icon:"🩸",label:"Blood Cultures × 2",detail:"Bacteremia 2–4% cellulitis; 25–30% streptococcal TSS."},
    {icon:"🧫",label:"Deep Tissue / Intraop Cultures",detail:"Superficial swabs unreliable. Deep tissue from I&D cavity or intraoperative specimen preferred."},
    {icon:"📊",label:"LRINEC Score",detail:"CRP>150(4), WBC>15(1), Hgb<13.5(1), Na<135(2), Cr>1.6(2), Glu>180(1). ≥6 = high NF risk."},
    {icon:"🩺",label:"Finger Test (bedside NF)",detail:"Digital dissection at 1 cm incision: no resistance + grey fascia = NF confirmed. Proceed to OR immediately."},
  ],
  neutro:[
    {icon:"🩸",label:"Blood Cultures × 2 + CVC Lumens",detail:"Peripheral × 2 + each CVC lumen. Differential time-to-positivity >2h = CVC source."},
    {icon:"📊",label:"CBC with Differential (Daily)",detail:"Track ANC nadir and recovery. ANC >500 × 2 consecutive days = neutropenia resolved."},
    {icon:"🧫",label:"Urine + All Site Cultures",detail:"Urine culture even without pyuria. Neutropenic patients may not mount pyuria."},
    {icon:"📸",label:"CT Chest (HRCT)",detail:"Preferred over CXR — CXR misses 50% of infiltrates. Halo sign = early invasive aspergillosis."},
    {icon:"🔬",label:"Galactomannan + Beta-D-Glucan",detail:"Galactomannan: 80% sensitivity for invasive aspergillosis in hematologic malignancy. BDG: sensitive but non-specific."},
  ],
  steward:[
    {icon:"🔬",label:"Procalcitonin Algorithm",detail:"Baseline at admission. Repeat at 48h, 72h, Day 5. PCT <0.25 μg/L = strong recommendation to stop ABX. PCT decline >80% from peak = consider stopping."},
    {icon:"🧫",label:"Culture Review (48–72h Time-Out)",detail:"Organism identified? Is empiric coverage appropriate? Can we narrow? Can we stop? Document decision in chart."},
    {icon:"📊",label:"Local Antibiogram (AI-Assisted)",detail:"Annual institutional antibiogram review. Know local E. coli FQ resistance, MRSA prevalence, ESBL rates, Pseudomonas pip-tazo susceptibility."},
    {icon:"💊",label:"Vancomycin AUC Monitoring",detail:"Target AUC/MIC 400–600 mg·h/L (2020 ASHP/SIDP/IDSA). Bayesian software preferred. Trough-only monitoring is OBSOLETE — 3× higher AKI risk."},
    {icon:"🩺",label:"IV-to-PO Criteria",detail:"Afebrile ×24h, HR <100, RR <24, O₂ sat >90%, tolerating PO, no bacteremia, no complex infection."},
    {icon:"📋",label:"Stop Date (Day 1 Protocol)",detail:"Document planned stop date at TIME OF INITIATION. Prospective audit with feedback = gold standard stewardship activity."},
  ],
};

const FOLLOWUP = {
  screening:["Reassess lactate at 2h — target >10% clearance. Serial until <2 mmol/L × 2 consecutive measurements.","Blood culture results at 48–72h — mandatory de-escalation review based on organism + sensitivities","Procalcitonin trending: declining to <0.25 μg/L → strong recommendation to stop antibiotics","Daily SOFA score — improvement indicates appropriate response; guides ICU discharge readiness","Source control adequacy at 6–12h: drain abscess, remove infected catheter, treat obstruction","ABX duration: 5–7 days for most sepsis; guided by PCT + clinical response + culture results"],
  shock:["ICU admission: arterial line monitoring, Foley (target UO ≥0.5 mL/kg/h)","Serial lactate until <2 mmol/L × 2 consecutive measurements","Vasopressor wean: document MAP targets and wean criteria in orders","ABX de-escalation at 48–72h: culture-directed narrowing mandatory","Daily SBT + SAT if mechanically ventilated (SSC VAP bundle)"],
  uro:["Cultures at 48–72h — document de-escalation review","Repeat blood cultures at 48–72h if bacteremia confirmed (clearance)","Duration: 5–7d (no bacteremia); 10–14d (bacteremia)","Urology consult if obstruction, abscess, or anatomic abnormality","Remove/replace urinary catheter as source control"],
  pna:["IV-to-PO criteria: afebrile ×24h, HR <100, RR <24, O₂ ≥90% on ≤2L, tolerating PO","Duration: CAP 5d; severe CAP 5–7d; HAP 7d; VAP ≤7d","MRSA nasal screen at 48h — negative = strong support to DC vancomycin/linezolid","Pneumococcal + influenza vaccination on discharge","Follow-up CXR at 6–8 weeks for smokers or age >40 (malignancy screen)"],
  cns:["Neurology + ID consultation within 24h","Dexamethasone: strictly 4-day course — no benefit beyond 4 days","Meningococcal contacts: rifampin 600mg PO q12h × 2d OR cipro 500mg PO single dose → NOTIFY PUBLIC HEALTH","Hearing test on discharge — sensorineural hearing loss in 10% of S. pneumoniae meningitis survivors","Duration: Pneumococcal 10–14d; Meningococcal 5–7d; Listeria 21d; HSV 14–21d"],
  abd:["Source control at 6–12h — is drainage/surgery adequate? Any residual collection?","Culture-directed de-escalation at 48–72h — document stewardship review","Duration: 4d post-source control (mild-mod cIAI); 5–7d biliary sepsis","Biliary: ERCP timing per Tokyo Grade — Grade III: emergent within 12–24h","ID consult for MDR organisms, persistent Candida, VRE, treatment failure"],
  ssti:["NF: surgical re-look at 24–48h","MRSA bacteremia: repeat cultures at 48–72h; TTE/TEE if bacteremia >3 days","Duration: 5–7d cellulitis; 5d post-I&D abscess; 14d bacteremia; 7–14d NF","Discharge oral ABX based on culture susceptibility","Follow-up within 48–72h for moderate SSTI on oral ABX"],
  neutro:["Daily CBC: ANC recovery (>500 × 2 days = neutropenia resolved)","ABX may stop: ANC >500, afebrile ≥48h, stable — not based on clinical improvement alone","Bacteremia: full course (GP 14d; GN 10–14d; Candida ≥14d post last positive culture)","CVC removal: if fungemia, non-salvageable tunnel infection, hemodynamically unstable","G-CSF consideration: prolonged neutropenia >7d with non-responding infection"],
  steward:["Document stop date at ABX initiation — include in orders","48–72h mandatory review: document organism, appropriateness, de-escalation plan, stop date","PCT <0.25 μg/L → strong recommendation to discontinue","Annual antibiogram update with Microbiology + Pharmacy","C. difficile rate monitoring: institutional proxy for stewardship quality; target <10 CDI/10k patient-days","Monthly ABX use report (DDD or DOT/1000 patient-days) for benchmarking against NHSN"],
};

const REFS = {
  screening:"Singer et al. Sepsis-3. JAMA 2016; Evans et al. SSC Guidelines 2021; Levy et al. Hour-1 Bundle, CCM 2018",
  shock:"Singer et al. Sepsis-3. JAMA 2016; SSC Guidelines 2021; Lamontagne et al. ADRENAL Trial NEJM 2018",
  uro:"IDSA/ESCMID UTI Guidelines 2024; EAU Urological Infections 2024; SSC 2021",
  pna:"Metlay et al. ATS/IDSA CAP 2019; Kalil et al. ATS/IDSA HAP/VAP 2016; IDSA Influenza 2019",
  cns:"Tunkel et al. IDSA Bacterial Meningitis. CID 2017; van de Beek et al. NEJM 2012",
  abd:"Mazuski et al. IDSA/SIS cIAI 2024; Tokyo Guidelines 2018; Pappas et al. IDSA Candida 2016",
  ssti:"Stevens et al. IDSA SSTI 2014; Liu et al. IDSA S. aureus 2011",
  neutro:"Freifeld et al. IDSA Febrile Neutropenia 2011 (rev. 2018); ASCO 2018",
  steward:"IDSA/SHEA Hospital Stewardship Programs 2023; ASHP/SIDP/IDSA Vancomycin 2020; PRORATA Trial Lancet 2010",
};

/* ═══ CONDITION DETAIL PAGE ══════════════════════════════════════════ */
function ConditionPage({ cond, onBack }) {
  const [tab, setTab] = useState("overview");
  const [checked, setChecked] = useState({});
  const ov = OVERVIEW[cond.id] || {};
  const abx = ABX[cond.id] || [];
  const wu = WORKUP[cond.id] || [];
  const fu = FOLLOWUP[cond.id] || [];
  const isSource = ["uro","pna","cns","abd","ssti","neutro","steward"].includes(cond.id);

  const tabs = [
    {id:"overview",  label:"Overview",  icon:"📋"},
    {id:"workup",    label:"Workup",    icon:"✅"},
    {id:"treatment", label:"Treatment", icon:"💊"},
    {id:"followup",  label:"Follow-up", icon:"📅"},
    ...(isSource ? [{id:"resistance",label:"Local Rx",icon:"🌐"}] : []),
  ];

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      {/* Back + header */}
      <div style={{padding:"14px 20px 0",flexShrink:0}}>
        <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:6,background:"rgba(14,37,68,0.5)",border:`1px solid ${T.b}`,borderRadius:7,padding:"5px 12px",color:T.txt3,fontSize:11,cursor:"pointer",fontFamily:"sans-serif",marginBottom:12}}>
          ← Back
        </button>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
          <div style={{width:44,height:44,borderRadius:12,background:cond.gl,border:`1px solid ${cond.br}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{cond.icon}</div>
          <div>
            <div style={{fontSize:16,fontWeight:700,color:T.txt,fontFamily:"'Playfair Display',serif"}}>{cond.title}</div>
            <div style={{fontSize:11,color:T.txt3}}>{cond.sub}</div>
          </div>
          <span style={{marginLeft:"auto",fontSize:9,fontFamily:"monospace",padding:"2px 8px",borderRadius:20,background:cond.gl,border:`1px solid ${cond.br}`,color:cond.color,fontWeight:700}}>{cond.cat.toUpperCase()}</span>
        </div>
        {/* Tab bar */}
        <div style={{display:"flex",gap:4,borderBottom:`1px solid ${T.b}`,paddingBottom:0}}>
          {tabs.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"6px 14px",border:"none",borderBottom:tab===t.id?`2px solid ${cond.color}`:"2px solid transparent",background:"transparent",color:tab===t.id?T.txt:T.txt3,fontSize:11,fontWeight:tab===t.id?700:400,cursor:"pointer",fontFamily:"sans-serif",display:"flex",alignItems:"center",gap:5,transition:"all .18s",marginBottom:-1}}>
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div style={{flex:1,overflowY:"auto",padding:"16px 20px 24px"}}>

        {tab==="overview" && (
          <div>
            {/* Definition */}
            <div style={{background:"rgba(14,37,68,0.5)",border:`1px solid ${cond.br}`,borderLeft:`3px solid ${cond.color}`,borderRadius:8,padding:"12px 14px",marginBottom:14,fontSize:12,color:T.txt2,lineHeight:1.7}}>{ov.def}</div>
            {/* Key criteria */}
            {ov.bullets?.map((b,i)=>(
              <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"7px 0",borderBottom:i<ov.bullets.length-1?`1px solid rgba(26,53,85,0.4)`:"none"}}>
                <div style={{width:16,height:16,borderRadius:4,background:cond.gl,border:`1px solid ${cond.br}`,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:cond.color,marginTop:1}}>▪</div>
                <div style={{fontSize:12,color:T.txt2,lineHeight:1.55}}>{b}</div>
              </div>
            ))}
            {/* Calculators for screening page */}
            {cond.id==="screening" && (
              <div style={{marginTop:16}}>
                <div style={{fontSize:11,fontWeight:700,color:T.txt3,textTransform:"uppercase",letterSpacing:".07em",marginBottom:10}}>Interactive Scoring Tools</div>
                <QSOFACalc />
                <SIRSCalc />
                <FluidBolus />
              </div>
            )}
            {/* Fluid bolus for shock */}
            {cond.id==="shock" && (
              <div style={{marginTop:16}}>
                <div style={{fontSize:11,fontWeight:700,color:T.txt3,textTransform:"uppercase",letterSpacing:".07em",marginBottom:10}}>Resuscitation Calculator</div>
                <FluidBolus />
              </div>
            )}
          </div>
        )}

        {tab==="workup" && (
          <div>
            {wu.map((item,i)=>(
              <div key={i} onClick={()=>setChecked(p=>({...p,[i]:!p[i]}))} style={{display:"flex",gap:12,alignItems:"flex-start",background:checked[i]?"rgba(0,229,192,0.07)":"rgba(14,37,68,0.4)",border:`1px solid ${checked[i]?"rgba(0,229,192,0.3)":T.b}`,borderRadius:9,padding:"11px 14px",marginBottom:8,cursor:"pointer",transition:"all .18s"}}>
                <div style={{width:32,height:32,borderRadius:8,background:checked[i]?"rgba(0,229,192,0.15)":"rgba(14,37,68,0.6)",border:`1px solid ${checked[i]?"rgba(0,229,192,0.5)":T.b}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{checked[i]?"✓":item.icon}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,fontWeight:600,color:checked[i]?T.teal:T.txt,marginBottom:3}}>{item.label}</div>
                  <div style={{fontSize:11,color:T.txt3,lineHeight:1.55}}>{item.detail}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab==="treatment" && (
          <div>
            {cond.id==="screening" && (
              <div style={{marginBottom:14}}>
                <div style={{fontSize:11,fontWeight:700,color:T.txt3,textTransform:"uppercase",letterSpacing:".07em",marginBottom:8}}>Hour-1 Bundle Resuscitation</div>
                <FluidBolus />
                <div style={{height:12}} />
              </div>
            )}
            {abx.length>0 ? (
              <>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
                  {["Renal Dosing","IV → PO Switch","De-escalation"].map(l=>(
                    <span key={l} style={{fontSize:9,padding:"3px 9px",borderRadius:20,background:"rgba(14,37,68,0.6)",border:`1px solid ${T.b}`,color:T.txt3,fontFamily:"monospace"}}>
                      {l==="Renal Dosing"?"🫘":l==="IV → PO Switch"?"💊":"📉"} Tap drug rows to expand {l}
                    </span>
                  ))}
                </div>
                {abx.map((rx,i)=><DrugRow key={i} rx={rx} />)}
              </>
            ) : (
              <div style={{fontSize:12,color:T.txt3,textAlign:"center",padding:"32px 0"}}>See Screening/Shock tabs for vasopressor & supportive care protocols</div>
            )}
          </div>
        )}

        {tab==="followup" && (
          <div>
            {fu.map((item,i)=>(
              <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"9px 12px",background:"rgba(14,37,68,0.4)",border:`1px solid ${T.b}`,borderRadius:8,marginBottom:6}}>
                <div style={{width:22,height:22,borderRadius:6,background:"rgba(0,229,192,0.1)",border:"1px solid rgba(0,229,192,0.25)",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:T.teal,fontWeight:700,marginTop:1}}>{i+1}</div>
                <div style={{fontSize:12,color:T.txt2,lineHeight:1.6}}>{item}</div>
              </div>
            ))}
            {REFS[cond.id] && (
              <div style={{marginTop:14,padding:"10px 14px",background:"rgba(155,109,255,0.06)",border:"1px solid rgba(155,109,255,0.2)",borderRadius:8,fontSize:10,color:T.txt3,lineHeight:1.65}}>
                <span style={{color:T.purple,fontWeight:700,marginRight:6}}>📚</span>{REFS[cond.id]}
              </div>
            )}
          </div>
        )}

        {tab==="resistance" && (
          <div>
            <div style={{fontSize:12,color:T.txt2,lineHeight:1.7,marginBottom:14,padding:"10px 14px",background:"rgba(14,37,68,0.5)",border:`1px solid ${T.b}`,borderRadius:8}}>
              Enter your hospital name or city to get AI-estimated local antimicrobial resistance rates. Use this data alongside your institutional antibiogram to guide empiric antibiotic selection and de-escalation decisions for <strong style={{color:cond.color}}>{cond.title}</strong>.
            </div>
            <ResistanceAI />
          </div>
        )}

        {tab==="overview" && cond.id==="steward" && (
          <div style={{marginTop:14}}>
            <div style={{fontSize:11,fontWeight:700,color:T.txt3,textTransform:"uppercase",letterSpacing:".07em",marginBottom:10}}>High-Bioavailability IV → PO Agents (&gt;90% Oral Bioavailability)</div>
            {[
              {drug:"Ciprofloxacin",  po:"500–750mg PO q12h",    color:T.blue},
              {drug:"Levofloxacin",   po:"750mg PO q24h",         color:T.blue},
              {drug:"Linezolid",      po:"600mg PO q12h",         color:T.teal},
              {drug:"Metronidazole",  po:"500mg PO q8h",          color:T.teal},
              {drug:"Azithromycin",   po:"500mg PO q24h",         color:T.cyan},
              {drug:"Doxycycline",    po:"100mg PO q12h",         color:T.cyan},
              {drug:"Fluconazole",    po:"400mg PO q24h",         color:T.orange},
              {drug:"Voriconazole",   po:"200mg PO q12h",         color:T.orange},
              {drug:"TMP-SMX DS",     po:"1–2 tabs PO q12h",      color:T.green},
              {drug:"Clindamycin",    po:"300–450mg PO q8h",      color:T.green},
            ].map((a,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 12px",background:"rgba(14,37,68,0.45)",border:`1px solid ${T.b}`,borderRadius:7,marginBottom:5}}>
                <span style={{fontSize:12,fontWeight:700,color:a.color,minWidth:130}}>{a.drug}</span>
                <span style={{fontSize:11,color:T.txt2,fontFamily:"monospace"}}>{a.po}</span>
                <span style={{marginLeft:"auto",fontSize:9,color:T.txt4,fontFamily:"monospace"}}>≥90% bioavail.</span>
              </div>
            ))}
            <div style={{marginTop:14,fontSize:11,color:T.txt3,padding:"10px 14px",background:"rgba(61,255,160,0.05)",border:"1px solid rgba(61,255,160,0.18)",borderRadius:8,lineHeight:1.7}}>
              <strong style={{color:T.green}}>Duration Targets:</strong> Sepsis 5–7d · CAP 5d · Urosepsis (no bacteremia) 5–7d · Bacteremia 14d · Endocarditis 4–6 wks · Meningitis 7–14d · NF 7–14d post-debridement · Neutropenic fever: until ANC &gt;500
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

/* ═══ TIME TARGETS BANNER ═══════════════════════════════════════════ */
function TimeBanner() {
  const targets = [
    {icon:"⏱",label:"Antibiotics",target:"≤1 hour",   color:T.coral},
    {icon:"🩸",label:"Blood Cultures",target:"Before ABX",color:T.gold},
    {icon:"💧",label:"Fluid (30 mL/kg)",target:"Immediate", color:T.blue},
    {icon:"🔬",label:"Lactate Reassess",target:"≤2 hours",  color:T.teal},
  ];
  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:16}}>
      {targets.map((t,i)=>(
        <div key={i} style={{background:"rgba(14,37,68,0.5)",border:`1px solid ${t.color}30`,borderRadius:10,padding:"10px 12px",textAlign:"center"}}>
          <div style={{fontSize:18,marginBottom:4}}>{t.icon}</div>
          <div style={{fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:".06em",marginBottom:2}}>{t.label}</div>
          <div style={{fontSize:13,fontWeight:700,color:t.color,fontFamily:"monospace"}}>{t.target}</div>
        </div>
      ))}
    </div>
  );
}

/* ═══ MAIN HUB ══════════════════════════════════════════════════════ */
export default function SepsisHub() {
  const navigate = useNavigate();
  const [activeCat, setActiveCat] = useState("All");
  const [selected, setSelected] = useState(null);

  const filtered = activeCat==="All" ? CONDITIONS : CONDITIONS.filter(c=>c.cat===activeCat);
  const catCounts = CATS.reduce((a,c)=>({...a,[c]:CONDITIONS.filter(x=>x.cat===c).length}),{});

  if (selected) {
    const cond = CONDITIONS.find(c=>c.id===selected);
    if (!cond) { return null; }
    return (
      <div style={{height:"100vh",background:T.bg,color:T.txt,fontFamily:"'DM Sans',sans-serif",display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <ConditionPage cond={cond} onBack={()=>setSelected(null)} />
      </div>
    );
  }

  return (
    <div style={{height:"100vh",background:T.bg,color:T.txt,fontFamily:"'DM Sans',sans-serif",display:"flex",flexDirection:"column",overflow:"hidden"}}>
      {/* Global styles */}
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(26,53,85,0.9);border-radius:2px}
        input,button,select{font-family:inherit}
      `}</style>

      {/* Header */}
      <div style={{background:T.panel,borderBottom:`1px solid ${T.b}`,padding:"14px 20px",flexShrink:0}}>
        <div style={{marginBottom:10}}>
          <button onClick={()=>navigate("/hub")} style={{display:"flex",alignItems:"center",gap:6,background:"rgba(8,22,40,0.8)",border:"1px solid rgba(245,200,66,0.3)",borderRadius:9,padding:"6px 14px",color:T.gold,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"sans-serif",transition:"all .2s"}}
            onMouseEnter={e=>{e.currentTarget.style.background="rgba(245,200,66,0.1)";e.currentTarget.style.transform="translateX(-2px)";}}
            onMouseLeave={e=>{e.currentTarget.style.background="rgba(8,22,40,0.8)";e.currentTarget.style.transform="translateX(0)";}}>
            ← Back to Hub
          </button>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
          <div style={{width:40,height:40,borderRadius:11,background:"rgba(245,200,66,0.12)",border:"1px solid rgba(245,200,66,0.35)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>🦠</div>
          <div>
            <div style={{fontSize:18,fontWeight:700,color:T.txt,fontFamily:"'Playfair Display',serif",lineHeight:1.2}}>Sepsis Hub</div>
            <div style={{fontSize:10,color:T.txt3}}>Sepsis-3 · qSOFA · SIRS · Hour-1 Bundle · Antibiotic Stewardship · AI Local Resistance</div>
          </div>
          <div style={{marginLeft:"auto",display:"flex",gap:6,flexShrink:0}}>
            <span style={{fontSize:9,fontFamily:"monospace",fontWeight:700,padding:"3px 9px",borderRadius:20,background:"rgba(0,229,192,0.1)",border:"1px solid rgba(0,229,192,0.3)",color:T.teal}}>SSC 2021</span>
            <span style={{fontSize:9,fontFamily:"monospace",fontWeight:700,padding:"3px 9px",borderRadius:20,background:"rgba(155,109,255,0.1)",border:"1px solid rgba(155,109,255,0.3)",color:T.purple}}>IDSA 2024</span>
            <span style={{fontSize:9,fontFamily:"monospace",fontWeight:700,padding:"3px 9px",borderRadius:20,background:"rgba(59,158,255,0.1)",border:"1px solid rgba(59,158,255,0.3)",color:T.blue}}>Sepsis-3</span>
          </div>
        </div>
        {/* Category filter */}
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {["All",...CATS].map(c=>(
            <button key={c} onClick={()=>setActiveCat(c)} style={{padding:"5px 13px",borderRadius:20,border:`1px solid ${activeCat===c?"rgba(59,158,255,0.45)":T.b}`,background:activeCat===c?"rgba(59,158,255,0.12)":"transparent",color:activeCat===c?T.blue:T.txt3,fontSize:11,fontWeight:activeCat===c?700:400,cursor:"pointer",transition:"all .18s",fontFamily:"sans-serif",display:"flex",alignItems:"center",gap:5}}>
              {c} {c!=="All" && <span style={{fontSize:9,fontFamily:"monospace",color:activeCat===c?T.blue:T.txt4}}>({catCounts[c]})</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{flex:1,overflowY:"auto",padding:"16px 20px 24px"}}>
        <TimeBanner />

        {/* Condition grid */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12}}>
          {filtered.map(c=>(
            <div key={c.id} onClick={()=>setSelected(c.id)} style={{background:c.gl,border:`1px solid ${c.br}`,borderRadius:12,padding:"14px 16px",cursor:"pointer",transition:"all .2s",position:"relative",overflow:"hidden"}} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=`0 8px 24px ${c.color}20`}} onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none"}}>
              <div style={{position:"absolute",top:-20,right:-20,width:80,height:80,borderRadius:"50%",background:c.gl,opacity:.5}} />
              <div style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:10}}>
                <div style={{width:40,height:40,borderRadius:10,background:c.gl,border:`1px solid ${c.br}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{c.icon}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700,color:T.txt}}>{c.title}</div>
                  <div style={{fontSize:10,color:T.txt3,marginTop:1}}>{c.sub}</div>
                </div>
                <span style={{fontSize:9,fontFamily:"monospace",padding:"2px 7px",borderRadius:20,background:c.gl,border:`1px solid ${c.br}`,color:c.color,fontWeight:700,flexShrink:0}}>{c.cat}</span>
              </div>

              <div style={{display:"flex",gap:8,marginTop:10,fontSize:9,color:T.txt3}}>
                {ABX[c.id]?.length>0 && <span style={{padding:"2px 7px",borderRadius:20,background:"rgba(0,229,192,0.08)",border:"1px solid rgba(0,229,192,0.2)",color:T.teal}}>💊 {ABX[c.id].length} ABX tiers</span>}
                {WORKUP[c.id]?.length>0 && <span style={{padding:"2px 7px",borderRadius:20,background:"rgba(59,158,255,0.08)",border:"1px solid rgba(59,158,255,0.2)",color:T.blue}}>✅ {WORKUP[c.id].length} workup items</span>}
                {["uro","pna","cns","abd","ssti","neutro","steward"].includes(c.id) && <span style={{padding:"2px 7px",borderRadius:20,background:"rgba(61,255,160,0.08)",border:"1px solid rgba(61,255,160,0.2)",color:T.green}}>🌐 AI Local Rx</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Evidence footer */}
        <div style={{marginTop:20,padding:"12px 16px",background:"rgba(14,37,68,0.4)",border:`1px solid ${T.b}`,borderRadius:10,display:"flex",gap:16,flexWrap:"wrap",alignItems:"center"}}>
          <span style={{fontSize:9,fontWeight:700,color:T.txt4,textTransform:"uppercase",letterSpacing:".07em",flexShrink:0}}>Evidence Base</span>
          {["Singer et al. Sepsis-3 JAMA 2016","Evans et al. SSC Guidelines 2021","IDSA 2024","ATS/IDSA CAP 2019","Tokyo Guidelines 2018","IDSA/SHEA ABS 2023"].map(e=>(
            <span key={e} style={{fontSize:9,color:T.txt4,fontFamily:"monospace"}}>{e}</span>
          ))}
        </div>
      </div>
    </div>
  );
}