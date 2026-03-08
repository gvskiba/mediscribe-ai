import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import DosageCalculator from "../components/antibiotics/DosageCalculator";
import DiagnosticWorkup from "../components/antibiotics/DiagnosticWorkup";
import AntibiogramManager from "../components/antibiotics/AntibiogramManager";

const T = {
  navy:"#050f1e", slate:"#0b1d35", panel:"#0d2240", edge:"#162d4f",
  border:"#1e3a5f", muted:"#2a4d72", dim:"#4a7299", text:"#c8ddf0",
  bright:"#e8f4ff", teal:"#00d4bc", teal2:"#00a896", amber:"#f5a623",
  red:"#ff5c6c", green:"#2ecc71", purple:"#9b6dff", blue:"#4a90d9", rose:"#f472b6",
};

// ─── INFECTION DATA ───────────────────────────────────────────────────────────
const INFECTIONS = {
  cap: {
    name: "Community-Acquired Pneumonia (CAP)",
    sub: "Streptococcus pneumoniae, Mycoplasma, Haemophilus influenzae, Legionella",
    regimens: {
      outpatient: [
        { tier:"first", title:"Mild CAP — Outpatient (no comorbidities)", duration:"5 days",
          drugs:[{label:"Option A",name:"Amoxicillin",dose:"1g PO TID",note:"Preferred for typical bacterial CAP"},{connector:"OR"},{label:"Option B",name:"Doxycycline",dose:"100mg PO BID",note:"Covers atypicals; use if Mycoplasma suspected"}]},
        { tier:"alt", title:"Outpatient with Comorbidities", duration:"5 days",
          drugs:[{label:"Option A",name:"Amoxicillin-clavulanate",dose:"875/125mg PO BID",note:"+ Azithromycin 500mg PO day 1, then 250mg PO days 2–5"},{connector:"OR"},{label:"Option B",name:"Levofloxacin",dose:"750mg PO q24h",note:"Monotherapy if unable to tolerate beta-lactam + macrolide"}]},
      ],
      inpatient: [
        { tier:"first", title:"Non-Severe Inpatient CAP", duration:"5 days",
          drugs:[{label:"Beta-lactam",name:"Ceftriaxone",dose:"1–2g IV q24h",note:"Backbone of inpatient CAP therapy"},{connector:"PLUS"},{label:"Atypical",name:"Azithromycin",dose:"500mg IV/PO q24h",note:"Add for atypical coverage (Legionella, Mycoplasma)"}]},
        { tier:"alt", title:"PCN Allergy Alternative", duration:"5 days",
          drugs:[{label:"Monotherapy",name:"Levofloxacin",dose:"750mg IV/PO q24h",note:"Avoid if FQ allergy or high local FQ-R pneumococcus rates"}]},
      ],
      icu: [
        { tier:"severe", title:"Severe CAP / ICU", duration:"7 days",
          drugs:[{label:"Beta-lactam",name:"Ceftriaxone",dose:"2g IV q24h",note:"Or ampicillin-sulbactam 3g IV q6h"},{connector:"PLUS"},{label:"Atypical",name:"Azithromycin",dose:"500mg IV q24h",note:"Or levofloxacin 750mg IV q24h if azithromycin contraindicated"}]},
        { tier:"note", title:"MRSA CAP — Consider if Risk Factors Present", duration:"Per clinical response",
          drugs:[{label:"Add",name:"Vancomycin",dose:"25–30 mg/kg/day IV divided q8–12h",note:"Target AUC/MIC 400–600. Risk: post-influenza, necrotic infiltrates, prior MRSA"},{connector:"OR"},{label:"Add",name:"Linezolid",dose:"600mg IV/PO q12h",note:"Alternative to vancomycin; better lung penetration"}]},
      ],
    },
    alerts:["Consider Legionella and Pneumococcal urinary antigens in severe CAP","MRSA nares PCR negative has high NPV to rule out MRSA CAP","Procalcitonin ≥0.25 supports bacterial etiology"],
  },
  hap: {
    name:"Hospital-Acquired / Ventilator-Associated Pneumonia",
    sub:"Gram-negative rods, MRSA, Pseudomonas aeruginosa",
    regimens:{
      outpatient:[],
      inpatient:[
        { tier:"first", title:"HAP — No MDR Risk Factors", duration:"7 days",
          drugs:[{label:"Option A",name:"Piperacillin-tazobactam",dose:"4.5g IV q6h",note:"Extended infusion (4h) preferred for Pseudomonas coverage"},{connector:"OR"},{label:"Option B",name:"Cefepime",dose:"2g IV q8h",note:"Alternative for anti-pseudomonal coverage"}]},
        { tier:"alt", title:"Add MRSA Coverage If: ICU, prior MRSA, nasal swab+", duration:"7 days",
          drugs:[{label:"Add",name:"Vancomycin",dose:"25–30 mg/kg/day IV",note:"AUC-guided dosing target 400–600. Or linezolid 600mg q12h"}]},
      ],
      icu:[
        { tier:"severe", title:"VAP / Severe HAP with MDR Risk", duration:"7 days",
          drugs:[{label:"Anti-Pseudo",name:"Piperacillin-tazobactam",dose:"4.5g IV q6h EI",note:"Extended infusion over 4 hours. Consider carbapenem if high local pip/tazo resistance"},{connector:"OR"},{label:"If high pip-R",name:"Meropenem",dose:"2g IV q8h",note:"For MDR Pseudomonas risk or ESBL risk"},{connector:"PLUS"},{label:"MRSA cover",name:"Vancomycin or Linezolid",dose:"Vanco: weight-based IV / Linezolid: 600mg q12h",note:"Linezolid preferred if nephrotoxicity concern"}]},
      ],
    },
    alerts:["7 days is as effective as 14 days for most HAP/VAP","De-escalate at 72h based on culture and sensitivity results","MRSA nares PCR negative: consider discontinuing MRSA coverage at 48–72h"],
  },
  "uti-uncomp": {
    name:"Uncomplicated UTI (Cystitis)",
    sub:"E. coli, Klebsiella, Proteus. Female, non-pregnant, no structural abnormality",
    regimens:{
      outpatient:[
        { tier:"first", title:"First-Line — Uncomplicated Cystitis", duration:"5 days",
          drugs:[{label:"Option A",name:"Nitrofurantoin",dose:"100mg ER PO BID × 5 days",note:"Avoid if CrCl <30 mL/min or pyelonephritis suspected"},{connector:"OR"},{label:"Option B",name:"TMP-SMX",dose:"1 DS tab PO BID × 3 days",note:"Use only if local E. coli resistance rate <20%"},{connector:"OR"},{label:"Option C",name:"Fosfomycin",dose:"3g PO × 1 dose",note:"Single dose; reserve for MDR organisms"}]},
        { tier:"alt", title:"Alternative (use only if above not feasible)", duration:"3–7 days",
          drugs:[{label:"FQ",name:"Ciprofloxacin",dose:"250mg PO BID × 3 days",note:"⚠ Reserve fluoroquinolones for when no alternatives exist"}]},
      ],
      inpatient:[
        { tier:"first", title:"Inpatient — Uncomplicated (unusual)", duration:"5 days",
          drugs:[{label:"Preferred",name:"TMP-SMX",dose:"1 DS tab PO BID",note:"If susceptible on culture. Transition IV to PO as soon as possible"}]},
      ],
      icu:[],
    },
    alerts:["⚠ Fluoroquinolones NOT recommended first-line for uncomplicated cystitis","Check local antibiogram — if FQ-resistant E. coli >20%, avoid empiric FQ","Urine culture not required for uncomplicated cystitis in otherwise healthy women"],
  },
  "uti-comp": {
    name:"Complicated UTI / Pyelonephritis",
    sub:"E. coli (80%), Klebsiella, Proteus, Enterococcus, Pseudomonas (catheter-associated)",
    regimens:{
      outpatient:[
        { tier:"first", title:"Outpatient Pyelonephritis (mild-moderate)", duration:"7 days",
          drugs:[{label:"Preferred",name:"TMP-SMX",dose:"1 DS tab PO BID × 7 days",note:"If local resistance <20% and susceptibility confirmed"},{connector:"OR"},{label:"FQ if needed",name:"Ciprofloxacin",dose:"500mg PO BID × 7 days",note:"Use if TMP-SMX not appropriate and no FQ allergy"}]},
      ],
      inpatient:[
        { tier:"first", title:"Inpatient Pyelonephritis / Complicated UTI", duration:"7–14 days",
          drugs:[{label:"Option A",name:"Ceftriaxone",dose:"1–2g IV q24h",note:"Preferred when no ESBL or Pseudomonas risk. De-escalate to PO at 72h"},{connector:"OR"},{label:"Option B",name:"Ciprofloxacin",dose:"400mg IV q12h",note:"If PCN/cephalosporin allergy and no FQ allergy"}]},
        { tier:"alt", title:"ESBL Risk (prior ESBL, healthcare-associated, travel)", duration:"10–14 days",
          drugs:[{label:"Carbapenem",name:"Ertapenem",dose:"1g IV q24h",note:"Preferred for ESBL UTI. Meropenem for Pseudomonas risk or severe illness"}]},
      ],
      icu:[
        { tier:"severe", title:"Urosepsis / Severe Complicated UTI", duration:"14 days",
          drugs:[{label:"Broad",name:"Piperacillin-tazobactam",dose:"4.5g IV q6h",note:"If Pseudomonas risk (catheter, prior MDR, structural abnormality)"},{connector:"OR"},{label:"MDR risk",name:"Meropenem",dose:"1g IV q8h",note:"De-escalate immediately when cultures available"}]},
      ],
    },
    alerts:["Always obtain urine culture before starting antibiotics for pyelonephritis","Blood cultures in febrile patients, sepsis presentation, or immunocompromised","De-escalate to narrow-spectrum oral agent at 48–72h if clinically improved"],
  },
  "ssti-non": {
    name:"Non-purulent Skin & Soft Tissue (Cellulitis / Erysipelas)",
    sub:"Beta-hemolytic Streptococcus (Groups A, B, C, G), S. aureus",
    regimens:{
      outpatient:[
        { tier:"first", title:"Mild — Outpatient Cellulitis", duration:"5 days (extend to 10–14 if slow response)",
          drugs:[{label:"Preferred",name:"Cephalexin",dose:"500mg PO QID",note:"First-line for streptococcal cellulitis"},{connector:"OR"},{label:"PCN allergy",name:"Clindamycin",dose:"300–450mg PO TID",note:"Check local D-zone test / inducible clindamycin resistance rates"}]},
      ],
      inpatient:[
        { tier:"first", title:"Moderate-Severe — Inpatient (spreading, systemic signs)", duration:"5–10 days IV then PO step-down",
          drugs:[{label:"IV",name:"Cefazolin",dose:"1–2g IV q8h",note:"Step down to cephalexin PO when afebrile and improving"},{connector:"OR"},{label:"PCN/Ceph allergy",name:"Clindamycin",dose:"600mg IV q8h → 300–450mg PO TID",note:"IV to PO as soon as tolerating oral medications"}]},
      ],
      icu:[
        { tier:"severe", title:"Rapidly Spreading / Necrotizing Fasciitis Concern", duration:"Minimum 10–14 days",
          drugs:[{label:"Empiric",name:"Piperacillin-tazobactam",dose:"4.5g IV q6h",note:"Broad empiric coverage pending surgical exploration"},{connector:"PLUS"},{label:"Toxin suppression",name:"Clindamycin",dose:"900mg IV q8h",note:"Inhibits toxin production — critical for Group A Strep necrotizing fasciitis"},{connector:"PLUS"},{label:"MRSA",name:"Vancomycin",dose:"25–30 mg/kg/day IV",note:"Add if MRSA suspected. Surgical debridement is definitive treatment"}]},
      ],
    },
    alerts:["Mark the borders of cellulitis with a skin marker at presentation to track progression","Elevation of affected extremity is important adjunct therapy","No evidence that adding MRSA coverage improves outcomes in non-purulent cellulitis"],
  },
  "ssti-pur": {
    name:"Purulent SSTI (Abscess / Furuncle)",
    sub:"Staphylococcus aureus (including CA-MRSA in 50–75% of purulent SSTIs)",
    regimens:{
      outpatient:[
        { tier:"first", title:"Mild — Simple Abscess (Outpatient)", duration:"5 days (if antibiotics given)",
          drugs:[{label:"Primary Tx",name:"Incision & Drainage (I&D)",dose:"Definitive treatment — antibiotics may not be needed",note:"I&D alone is sufficient for small (<2cm), uncomplicated abscesses"},{connector:"IF ANTIBIOTICS INDICATED"},{label:"MRSA coverage",name:"TMP-SMX",dose:"1–2 DS tabs PO BID × 5 days",note:"Preferred for CA-MRSA coverage"},{connector:"OR"},{label:"Alternative",name:"Doxycycline",dose:"100mg PO BID × 5 days",note:"Good CA-MRSA activity; avoid in pregnancy"}]},
      ],
      inpatient:[
        { tier:"first", title:"Moderate — Inpatient Purulent SSTI", duration:"7–10 days",
          drugs:[{label:"MRSA IV",name:"Vancomycin",dose:"25–30 mg/kg/day IV divided q8–12h",note:"Standard for MRSA coverage. AUC-guided dosing"},{connector:"OR"},{label:"If MSSA on culture",name:"Nafcillin / Oxacillin",dose:"2g IV q4h",note:"Superior to vancomycin for MSSA. De-escalate from vanco when MSSA confirmed"}]},
      ],
      icu:[
        { tier:"severe", title:"Severe MRSA SSTI / Bacteremia", duration:"14+ days",
          drugs:[{label:"MRSA",name:"Vancomycin",dose:"25–30 mg/kg/day IV, AUC-guided",note:"Daptomycin 6mg/kg IV q24h is alternative if vancomycin intolerant"}]},
      ],
    },
    alerts:["I&D is the cornerstone of treatment for purulent SSTI — antibiotics are adjunctive","CA-MRSA prevalence is high (>50% in most U.S. regions) — always cover MRSA empirically for purulent SSTI","Blood cultures for fever, systemic signs, failed outpatient therapy"],
  },
  meningitis: {
    name:"Bacterial Meningitis (Adult)",
    sub:"S. pneumoniae, N. meningitidis, Listeria (age >50, immunocompromised)",
    regimens:{
      outpatient:[],
      inpatient:[
        { tier:"severe", title:"Empiric — Adult Bacterial Meningitis (START IMMEDIATELY)", duration:"10–14 days (pneumococcal) / 7 days (meningococcal)",
          drugs:[{label:"⚡ Steroids FIRST",name:"Dexamethasone",dose:"0.15 mg/kg IV q6h × 4 days",note:"Give BEFORE or WITH first antibiotic dose"},{connector:"PLUS"},{label:"Beta-lactam",name:"Ceftriaxone",dose:"2g IV q12h",note:"Covers S. pneumoniae and N. meningitidis"},{connector:"PLUS"},{label:"Listeria cover",name:"Ampicillin",dose:"2g IV q4h",note:"Add if age >50, immunocompromised, alcoholism"},{connector:"PLUS"},{label:"Empiric",name:"Vancomycin",dose:"25–30 mg/kg/day IV divided q8–12h",note:"Add for PCN-resistant pneumococcus until sensitivities available"}]},
        { tier:"alt", title:"PCN Allergy — Cephalosporin Cross-Reactivity Concern", duration:"Same duration",
          drugs:[{label:"Empiric",name:"Meropenem",dose:"2g IV q8h",note:"If serious PCN allergy and cephalosporins contraindicated"},{connector:"PLUS"},{label:"Gram+ cover",name:"Vancomycin",dose:"25–30 mg/kg/day IV",note:"Do not use vancomycin alone — inadequate CNS penetration as monotherapy"}]},
      ],
      icu:[],
    },
    alerts:["⚡ TIME IS CRITICAL — antibiotics within 30 minutes of presentation. Do NOT delay for CT/LP","Dexamethasone must be given BEFORE or WITH first antibiotic dose for maximum benefit","LP: opening pressure, cell count, protein, glucose, Gram stain, culture, PCR panel"],
  },
  sepsis: {
    name:"Sepsis / Septic Shock — Unknown Source",
    sub:"Empiric broad-spectrum pending source identification and cultures",
    regimens:{
      outpatient:[],
      inpatient:[
        { tier:"first", title:"Sepsis Without Shock (Inpatient)", duration:"De-escalate at 48–72h; target 7 days",
          drugs:[{label:"Option A",name:"Piperacillin-tazobactam",dose:"4.5g IV q6h extended infusion",note:"Broad gram-negative and anaerobe coverage. Reassess at 72h"},{connector:"OR"},{label:"Option B",name:"Ceftriaxone",dose:"2g IV q24h",note:"Add metronidazole 500mg q8h if abdominal source suspected"}]},
      ],
      icu:[
        { tier:"severe", title:"⚡ Septic Shock — Broad Empiric Coverage", duration:"De-escalate ASAP; max 7–10 days",
          drugs:[{label:"Anti-GNR",name:"Piperacillin-tazobactam",dose:"4.5g IV q6h EI (over 4h)",note:"Or meropenem 1g IV q8h if MDR risk, recent hospitalization, immunocompromised"},{connector:"PLUS"},{label:"MRSA",name:"Vancomycin",dose:"25–30 mg/kg/day IV AUC-guided",note:"Add if MRSA risk: prior MRSA, skin/wound source, nosocomial, hemodialysis, IVDU"},{connector:"CONSIDER"},{label:"Anaerobes",name:"Metronidazole",dose:"500mg IV q8h",note:"If intra-abdominal or pelvic source possible and pip/tazo not used"}]},
        { tier:"note", title:"Source Control is Paramount", duration:"N/A",
          drugs:[{label:"Action",name:"Identify and control source",dose:"Within 6–12 hours of sepsis recognition",note:"Drain abscesses, remove infected catheters/devices, debride necrotic tissue. Blood, urine, sputum cultures × 2 sets BEFORE antibiotics when possible"}]},
      ],
    },
    alerts:["⚡ Hour-1 Bundle: Blood cultures → antibiotics within 1 hour of septic shock recognition","Procalcitonin-guided therapy reduces duration of antibiotic treatment","Mandatory de-escalation rounds at 48–72h based on cultures and clinical trajectory"],
  },
  iai: {
    name:"Intra-abdominal Infection (IAI)",
    sub:"E. coli, Klebsiella, Enterococcus, Bacteroides fragilis, Streptococcus",
    regimens:{
      outpatient:[
        { tier:"first", title:"Mild-Moderate Outpatient", duration:"4–7 days",
          drugs:[{label:"Oral combo",name:"Amoxicillin-clavulanate",dose:"875/125mg PO BID",note:"+ Metronidazole 500mg PO TID if additional anaerobic coverage needed"},{connector:"OR"},{label:"FQ + Metro",name:"Ciprofloxacin",dose:"500mg PO BID",note:"+ Metronidazole 500mg PO TID. Covers gram-negatives and anaerobes"}]},
      ],
      inpatient:[
        { tier:"first", title:"Inpatient — Mild-to-Moderate IAI", duration:"4–7 days (after source control)",
          drugs:[{label:"Preferred",name:"Ceftriaxone",dose:"2g IV q24h",note:"+ Metronidazole 500mg IV q8h. Effective, narrow-ish spectrum"},{connector:"OR"},{label:"Monotherapy",name:"Ertapenem",dose:"1g IV q24h",note:"For mild-moderate IAI with ESBL risk. Once-daily dosing advantage"}]},
        { tier:"alt", title:"High-Risk / Healthcare-Associated IAI", duration:"4–7 days (after source control)",
          drugs:[{label:"Broad",name:"Piperacillin-tazobactam",dose:"4.5g IV q6h",note:"Add vancomycin if Enterococcus risk (healthcare-associated, prior antibiotic exposure)"}]},
      ],
      icu:[
        { tier:"severe", title:"Severe IAI / Septic Shock", duration:"4–7 days after source control",
          drugs:[{label:"Carbapenem",name:"Meropenem",dose:"1g IV q8h",note:"ESBL risk, prior antibiotics, MDR history, or failure to respond to pip/tazo"},{connector:"PLUS"},{label:"Candida risk",name:"Consider Fluconazole",dose:"400mg IV q24h",note:"If postoperative peritonitis, recent antifungal exposure, or Candida isolated"}]},
      ],
    },
    alerts:["SOURCE CONTROL is the most important intervention — antibiotics are adjunctive","Duration: 4 days is non-inferior to longer courses after adequate source control (STOP-IT trial)","Do not cover Enterococcus empirically for community-acquired IAI"],
  },
  osteo: {
    name:"Osteomyelitis / Septic Arthritis",
    sub:"S. aureus (most common), Streptococcus, gram-negative rods (IV drug use, healthcare-associated)",
    regimens:{
      outpatient:[
        { tier:"alt", title:"Outpatient / Oral Step-Down After IV (Culture-Guided)", duration:"4–6 weeks total",
          drugs:[{label:"MSSA",name:"Cephalexin or Clindamycin",dose:"Cephalexin 500mg PO QID / Clindamycin 300–450mg PO TID",note:"Step-down after initial IV phase (2+ weeks)"},{connector:"MRSA"},{label:"MRSA oral",name:"TMP-SMX",dose:"2 DS tabs PO BID",note:"+ Rifampin 600mg PO daily if biofilm (implant)"}]},
      ],
      inpatient:[
        { tier:"first", title:"Empiric (IV — Pending Cultures)", duration:"4–6 weeks total",
          drugs:[{label:"Empiric",name:"Vancomycin",dose:"25–30 mg/kg/day IV AUC-guided",note:"Covers MRSA. Always obtain bone/blood cultures before starting"},{connector:"PLUS if GNR risk"},{label:"GNR",name:"Ceftriaxone",dose:"2g IV q24h",note:"IV drug use, healthcare-associated, urinary source. Or cefepime if Pseudomonas risk"}]},
        { tier:"alt", title:"MSSA Confirmed on Culture", duration:"4–6 weeks",
          drugs:[{label:"MSSA definitive",name:"Nafcillin / Oxacillin",dose:"2g IV q4h",note:"Superior to vancomycin for MSSA. De-escalate as soon as MSSA confirmed. Or cefazolin 2g IV q8h"}]},
      ],
      icu:[],
    },
    alerts:["Bone biopsy/culture is essential before starting antibiotics when possible","Surgical debridement of necrotic tissue and hardware removal significantly improves outcomes","IDSA recommends against rifampin use without a companion drug due to rapid resistance emergence"],
  },
  dfi: {
    name:"Diabetic Foot Infection (DFI)",
    sub:"Mild: S. aureus, Streptococcus. Moderate/Severe: polymicrobial, Pseudomonas, anaerobes",
    regimens:{
      outpatient:[
        { tier:"first", title:"Mild DFI — Outpatient", duration:"5–7 days",
          drugs:[{label:"MSSA/Strep",name:"Cephalexin",dose:"500mg PO QID",note:"Non-purulent, no MRSA risk"},{connector:"If MRSA risk"},{label:"MRSA oral",name:"TMP-SMX",dose:"1–2 DS tabs PO BID",note:"Prior MRSA, failed prior therapy, macerated wound"}]},
      ],
      inpatient:[
        { tier:"first", title:"Moderate DFI — Inpatient", duration:"2–4 weeks",
          drugs:[{label:"Polymicrobial",name:"Ampicillin-sulbactam",dose:"3g IV q6h",note:"Covers gram-positive, gram-negative, and anaerobes"},{connector:"MRSA risk — add"},{label:"MRSA",name:"Vancomycin",dose:"25–30 mg/kg/day IV",note:"Prior MRSA, severe infection, systemic signs"}]},
        { tier:"severe", title:"Severe DFI — Limb/Life-Threatening", duration:"4–6 weeks (bone involvement)",
          drugs:[{label:"Broad",name:"Piperacillin-tazobactam",dose:"4.5g IV q6h",note:"Pseudomonas risk: chronic wound, warm/humid climate, hydro/pool exposure"},{connector:"PLUS MRSA"},{label:"MRSA",name:"Vancomycin",dose:"25–30 mg/kg/day IV AUC-guided",note:"Concurrent osteomyelitis evaluation: probe-to-bone test, MRI"}]},
      ],
      icu:[],
    },
    alerts:["Vascular assessment is critical — ischemic DFI does not respond to antibiotics alone","Probe-to-bone test: positive (sensitivity ~89%) suggests osteomyelitis — get MRI","Pseudomonas coverage is NOT needed empirically unless specific risk factors present"],
  },
  "febrile-neutro": {
    name:"Febrile Neutropenia",
    sub:"ANC <500 (or <1000 and falling), fever ≥38.3°C single or ≥38.0°C ×1h sustained",
    regimens:{
      outpatient:[
        { tier:"first", title:"Low-Risk Febrile Neutropenia (MASCC ≥21) — Oral Option", duration:"7 days minimum or until ANC >500",
          drugs:[{label:"Oral empiric",name:"Ciprofloxacin",dose:"500–750mg PO BID",note:"+ Amoxicillin-clavulanate 875/125mg PO BID for gram-positive coverage. Only if MASCC score ≥21 AND close follow-up guaranteed"}]},
      ],
      inpatient:[
        { tier:"first", title:"Standard Risk — Inpatient IV", duration:"Until ANC >500 × 2 days; minimum 7 days",
          drugs:[{label:"Monotherapy",name:"Cefepime",dose:"2g IV q8h",note:"First-line monotherapy. Or piperacillin-tazobactam 4.5g IV q6h"},{connector:"OR"},{label:"Alternative",name:"Meropenem",dose:"1g IV q8h",note:"If prior MDR colonization, high-risk features"}]},
        { tier:"alt", title:"Add Vancomycin IF: hemodynamic instability, gram+ in blood culture, severe mucositis", duration:"Discontinue at 48h if blood cultures negative",
          drugs:[{label:"Gram-positive",name:"Vancomycin",dose:"25–30 mg/kg/day IV AUC-guided",note:"Do NOT add vancomycin empirically to all febrile neutropenia"}]},
      ],
      icu:[
        { tier:"severe", title:"High-Risk / Septic Shock with Neutropenia", duration:"10–14 days minimum",
          drugs:[{label:"Broad empiric",name:"Meropenem",dose:"2g IV q8h",note:"Broadest coverage including Pseudomonas, ESBL"},{connector:"PLUS"},{label:"MRSA",name:"Vancomycin",dose:"25–30 mg/kg/day IV",note:"Add from outset in septic shock"},{connector:"CONSIDER"},{label:"Fungal",name:"Micafungin or Caspofungin",dose:"Micafungin 100mg IV q24h",note:"If fever persists >4 days on antibacterials, prolonged neutropenia anticipated >7 days"}]},
      ],
    },
    alerts:["⚡ Start IV antibiotics within 1 HOUR of triage for febrile neutropenia","MASCC score <21 = high risk → inpatient IV therapy regardless","Blood cultures × 2 sets (peripheral + each lumen of central line) before antibiotics"],
  },
};

const IVPO_DATA = [
  {iv:"Ciprofloxacin 400mg IV",po:"Ciprofloxacin 500-750mg PO",ba:"~70-80%",ivDose:"400mg IV",poDose:"500mg PO",equivalent:"Yes — 400mg IV ≈ 500mg PO",timing:"Switch when: afebrile, stable, tolerating PO",criteria:"Hemodynamically stable, afebrile ≥24h, able to take and absorb PO. NOT for CNS infections, endocarditis.",special:"One of the best IV-to-PO candidates due to high bioavailability"},
  {iv:"Levofloxacin 750mg IV",po:"Levofloxacin 750mg PO",ba:"~99%",ivDose:"750mg IV",poDose:"750mg PO",equivalent:"Direct 1:1 switch",timing:"Can switch same dose, same frequency",criteria:"Near-perfect bioavailability — switch as soon as patient tolerating PO.",special:"Virtually 100% bioavailable — ideal IV-to-PO switch"},
  {iv:"Metronidazole 500mg IV",po:"Metronidazole 500mg PO",ba:"~100%",ivDose:"500mg IV",poDose:"500mg PO",equivalent:"Direct 1:1 switch",timing:"Switch as soon as tolerating PO",criteria:"Excellent bioavailability. No dose adjustment needed.",special:"C. diff: oral preferred over IV"},
  {iv:"Fluconazole 400mg IV",po:"Fluconazole 400mg PO",ba:"~90%",ivDose:"400mg IV",poDose:"400mg PO",equivalent:"Direct 1:1 switch",timing:"Switch when tolerating PO",criteria:"Excellent oral bioavailability. Oral is significantly less expensive.",special:"Significant cost savings with PO switch"},
  {iv:"Linezolid 600mg IV",po:"Linezolid 600mg PO",ba:"~100%",ivDose:"600mg IV",poDose:"600mg PO",equivalent:"Direct 1:1 switch",timing:"Switch as soon as tolerating PO",criteria:"100% bioavailability. Switch early — significant cost savings. Monitor for serotonin syndrome.",special:"Very expensive IV formulation — always prioritize PO switch"},
  {iv:"TMP-SMX IV",po:"TMP-SMX 1-2 DS tabs PO BID",ba:"~90-100%",ivDose:"5mg/kg IV q6-8h (TMP)",poDose:"1-2 DS tabs PO BID",equivalent:"Yes — equivalent exposure",timing:"Switch when tolerating PO",criteria:"High bioavailability. Switch to PO for MRSA SSTI, UTI, PCP. Avoid if CrCl <15.",special:"Excellent MRSA skin/soft tissue PO option"},
  {iv:"Clindamycin 600-900mg IV",po:"Clindamycin 300-450mg PO",ba:"~90%",ivDose:"900mg IV q8h",poDose:"450mg PO TID",equivalent:"Approximately equivalent",timing:"Switch when afebrile, improving",criteria:"Good bioavailability. Step down for SSTI, bone/joint, anaerobic infections.",special:"Good SSTI and bone/joint step-down agent"},
  {iv:"Azithromycin 500mg IV",po:"Azithromycin 500mg PO",ba:"~37-50%",ivDose:"500mg IV",poDose:"500mg PO",equivalent:"Not direct — higher IV tissue concentrations",timing:"Switch after 2 days IV for CAP if improving",criteria:"Lower oral bioavailability but high tissue distribution compensates.",special:"CAP: 2 days IV then PO step-down is standard"},
  {iv:"Doxycycline IV",po:"Doxycycline 100mg PO",ba:"~93%",ivDose:"100mg IV q12h",poDose:"100mg PO BID",equivalent:"Direct 1:1 switch",timing:"Switch at earliest opportunity",criteria:"Excellent bioavailability. Use PO whenever possible — IV rarely needed.",special:"IV doxycycline is rarely necessary given high oral BA"},
];

const DEESC_STEPS = [
  {step:1,title:"Obtain Cultures Before Starting Antibiotics",timeline:"Time 0",body:"Blood cultures ×2 sets, urine culture, sputum/BAL culture, wound culture, CSF as appropriate. Culture results are the foundation of de-escalation.",list:["Blood cultures: ideally before first antibiotic dose","Do NOT delay treatment for cultures in sepsis/shock","Label cultures with date, time, and collection site","If treating empirically, document rationale for culture omission"]},
  {step:2,title:"Reassess at 48–72 Hours",timeline:"48–72h",body:"This is the critical de-escalation window. Review cultures, sensitivities, and clinical trajectory. A significant proportion of empiric broad-spectrum antibiotics can be de-escalated at this point.",list:["Is the patient improving clinically?","Are cultures growing an organism?","Is the identified organism susceptible to a narrower agent?","Can the total duration be defined at this point?","Can MRSA coverage (vancomycin) be stopped if cultures are negative and MRSA nares PCR is negative?"]},
  {step:3,title:"Narrow Based on Culture Results",timeline:"72h–Day 5",body:"Target therapy to the identified organism(s) using the narrowest effective agent.",list:["MSSA identified → stop vancomycin, start nafcillin/cefazolin","Susceptible E. coli UTI → step down from carbapenem to ceftriaxone or ciprofloxacin","PCN-susceptible Strep pneumo → step from broad CAP regimen to amoxicillin alone","Discontinue agents covering organisms not found in cultures","Remove anaerobic coverage if source does not require it"]},
  {step:4,title:"IV-to-Oral Conversion",timeline:"When clinically stable",body:"Switch to oral therapy as soon as the patient is hemodynamically stable, tolerating oral intake, and an oral equivalent exists with adequate bioavailability.",list:["Criteria: afebrile ≥24h, stable vitals, WBC improving, GI absorption intact","Fluoroquinolones, metronidazole, fluconazole, linezolid, TMP-SMX: switch at first opportunity","See IV-to-PO tab for specific conversion guidance","Exceptions: endocarditis, CNS infection, bacteremia requiring extended IV, malabsorption"]},
  {step:5,title:"Define and Enforce Total Duration",timeline:"Day 1 to discharge",body:"Prolonged antibiotic courses do not improve outcomes for most infections and increase adverse events (C. diff, resistance, renal toxicity, drug interactions).",list:["CAP: 5 days (non-severe), 7 days (severe)","UTI uncomplicated: 3–5 days / complicated: 7–14 days","Skin/soft tissue: 5–7 days (mild-moderate)","Sepsis (source controlled): 7 days","IAI: 4 days after source control (STOP-IT trial)","Bacteremia: 14 days minimum (S. aureus: 28 days IV)","Stop antibiotics when afebrile ×48h, WBC normalizing, clinically improving"]},
  {step:6,title:"Document Stewardship in the Record",timeline:"All transitions",body:"Every antibiotic order should document: indication, duration, cultures obtained, and planned stop date.",list:["Order set: 'Indication: CAP, Duration: 5 days, Stop date: [date], Cultures obtained: yes/no'","Review antibiotic list at every daily reassessment","Discharge prescription: only prescribe amount needed to complete course","Communicate reason for antibiotic choice and planned duration in discharge summary"]},
];

const INFECTION_LIST = [
  {section:"Respiratory",items:[{id:"cap",icon:"🫁",name:"CAP",sub:"Community-acquired pneumonia"},{id:"hap",icon:"🏥",name:"HAP / VAP",sub:"Hospital/ventilator-acquired"}]},
  {section:"Urinary Tract",items:[{id:"uti-uncomp",icon:"💧",name:"UTI — Uncomplicated",sub:"Cystitis, outpatient"},{id:"uti-comp",icon:"🔴",name:"UTI — Complicated",sub:"Pyelonephritis, catheter-assoc."}]},
  {section:"Skin & Soft Tissue",items:[{id:"ssti-non",icon:"🩹",name:"SSTI — Non-purulent",sub:"Cellulitis, erysipelas"},{id:"ssti-pur",icon:"🔷",name:"SSTI — Purulent",sub:"Abscess, furuncle, MRSA risk"}]},
  {section:"CNS",items:[{id:"meningitis",icon:"🧠",name:"Bacterial Meningitis",sub:"Adult empiric therapy"}]},
  {section:"Systemic",items:[{id:"sepsis",icon:"⚡",name:"Sepsis / Septic Shock",sub:"Unknown source, broad coverage"}]},
  {section:"Abdominal & Bone",items:[{id:"iai",icon:"🫃",name:"Intra-abdominal",sub:"Appendicitis, peritonitis"},{id:"osteo",icon:"🦴",name:"Osteomyelitis",sub:"Bone & joint infection"},{id:"dfi",icon:"🦶",name:"Diabetic Foot Infection",sub:"Mild, moderate, severe"}]},
  {section:"Oncology",items:[{id:"febrile-neutro",icon:"🩸",name:"Febrile Neutropenia",sub:"ANC <500, fever ≥38.3°C"}]},
];

const ALLERGY_LIST = ["PCN","Cephalosporin","Sulfa","Fluoroquinolone","Metronidazole","Vancomycin","Azithromycin","Carbapenem"];
const ALLERGY_KEYS = ["pcn","ceph","sulfa","fq","metro","vanco","azithro","carbapenem"];

function calcCrClValue(age,wt,scr,sex) {
  if(!age||!wt||!scr) return null;
  let v=((140-age)*wt)/(72*scr);
  if(sex==="F") v*=0.85;
  return Math.round(v);
}

function CrClTier({val}) {
  if(val===null) return null;
  if(val>=60) return <span style={{display:"inline-block",padding:"2px 8px",borderRadius:10,fontSize:10,fontWeight:700,background:"rgba(46,204,113,.15)",color:T.green}}>Normal</span>;
  if(val>=30) return <span style={{display:"inline-block",padding:"2px 8px",borderRadius:10,fontSize:10,fontWeight:700,background:"rgba(245,166,35,.15)",color:T.amber}}>Mild Impairment</span>;
  if(val>=15) return <span style={{display:"inline-block",padding:"2px 8px",borderRadius:10,fontSize:10,fontWeight:700,background:"rgba(255,92,108,.15)",color:T.red}}>Moderate Impairment</span>;
  return <span style={{display:"inline-block",padding:"2px 8px",borderRadius:10,fontSize:10,fontWeight:700,background:"rgba(155,109,255,.2)",color:T.purple}}>Severe Impairment</span>;
}

function TierBadge({tier}) {
  const styles = {
    first:{bg:"rgba(0,212,188,.15)",color:T.teal,border:"1px solid rgba(0,212,188,.3)",label:"1st Line"},
    alt:{bg:"rgba(245,166,35,.1)",color:T.amber,border:"1px solid rgba(245,166,35,.3)",label:"Alternative"},
    severe:{bg:"rgba(255,92,108,.12)",color:T.red,border:"1px solid rgba(255,92,108,.3)",label:"Severe / ICU"},
    note:{bg:"rgba(74,144,217,.1)",color:T.blue,border:"1px solid rgba(74,144,217,.3)",label:"Note"},
  };
  const s=styles[tier]||styles.note;
  return <span style={{fontSize:"9.5px",fontWeight:800,textTransform:"uppercase",letterSpacing:".08em",padding:"3px 9px",borderRadius:10,background:s.bg,color:s.color,border:s.border,flexShrink:0}}>{s.label}</span>;
}

function AlertBox({type, icon, title, body}) {
  const colors={amber:{bg:"rgba(245,166,35,.08)",border:"1px solid rgba(245,166,35,.25)",color:T.amber},red:{bg:"rgba(255,92,108,.08)",border:"1px solid rgba(255,92,108,.25)",color:T.red},blue:{bg:"rgba(74,144,217,.08)",border:"1px solid rgba(74,144,217,.25)",color:T.blue},green:{bg:"rgba(46,204,113,.08)",border:"1px solid rgba(46,204,113,.25)",color:T.green}};
  const s=colors[type]||colors.blue;
  return (
    <div style={{padding:"11px 14px",borderRadius:9,fontSize:12,lineHeight:1.6,display:"flex",gap:10,marginBottom:14,background:s.bg,border:s.border,color:s.color}}>
      <span style={{fontSize:16,flexShrink:0,marginTop:1}}>{icon}</span>
      <div><strong style={{display:"block",fontWeight:700,marginBottom:2}}>{title}</strong>{body}</div>
    </div>
  );
}

function ReналTable({crcl}) {
  const colIdx = crcl===null?-1 : crcl>=60?1 : crcl>=30?2 : crcl>=15?3 : 4;
  const highlight=(idx)=>colIdx===idx?{background:"rgba(0,212,188,.08)"}:{};
  const tableStyle={width:"100%",borderCollapse:"collapse",fontSize:12};
  const th={padding:"9px 12px",textAlign:"left",fontSize:10,fontWeight:800,textTransform:"uppercase",letterSpacing:".07em",color:T.dim,background:"rgba(22,45,79,.5)",borderBottom:`1px solid ${T.border}`};
  const td={padding:"9px 12px",borderBottom:`1px solid rgba(30,58,95,.4)`,color:T.text,fontSize:12,verticalAlign:"top"};
  const drug={...td,fontWeight:700,color:T.bright,fontSize:"12.5px"};
  const dn=(s)=>({...td,fontFamily:"'JetBrains Mono',monospace",fontSize:"11.5px",color:T.green,...highlight(s)});
  const dr=(s)=>({...td,fontFamily:"'JetBrains Mono',monospace",fontSize:"11.5px",color:T.amber,...highlight(s)});
  const da=(s)=>({...td,fontFamily:"'JetBrains Mono',monospace",fontSize:"11.5px",color:T.red,fontWeight:700,...highlight(s)});
  const heads=["Drug","Normal (≥60)","Mild (30–59)","Moderate (15–29)","Severe (<15) / HD"];

  const sections = [
    {label:"Beta-Lactams", rows:[
      ["Ampicillin-sulbactam","3g q6h IV","3g q6h IV","3g q8h IV","3g q12h IV","n","n","r","r"],
      ["Piperacillin-tazobactam","4.5g q6h IV","4.5g q6h IV","2.25g q6h IV","2.25g q8h IV","n","n","r","r"],
      ["Meropenem","1g q8h IV","1g q8h IV","500mg q8h IV","500mg q12h IV","n","n","r","r"],
      ["Ertapenem","1g q24h IV","1g q24h IV","500mg q24h IV","500mg q24h IV","n","n","r","r"],
      ["Cefazolin","1–2g q8h IV","1–2g q8h IV","1g q12h IV","500mg q12h IV","n","n","r","r"],
      ["Ceftriaxone","1–2g q24h IV","1–2g q24h IV","No adjustment","No adjustment","n","n","n","n"],
      ["Cefepime","2g q8–12h IV","2g q12h IV","1g q12h IV","500mg q24h IV","n","r","r","r"],
      ["Ceftazidime","2g q8h IV","2g q12h IV","2g q24h IV","1g q48h IV","n","r","r","r"],
    ]},
    {label:"Glycopeptides & Oxazolidinones", rows:[
      ["Vancomycin","15–20 mg/kg q8–12h","15–20 mg/kg q12–24h","15–20 mg/kg q24–48h","15–20 mg/kg post-HD","n","r","r","r"],
      ["Linezolid","600mg q12h IV/PO","No adjustment","No adjustment","No adjustment (metabolites accumulate)","n","n","n","n"],
      ["Daptomycin","6–10 mg/kg q24h IV","No adjustment","6–10 mg/kg q48h IV","6–10 mg/kg q48h IV","n","n","r","r"],
    ]},
    {label:"Fluoroquinolones", rows:[
      ["Ciprofloxacin","400mg q8–12h IV / 500–750mg q12h PO","400mg q12h IV / 500mg q12h PO","400mg q18–24h IV / 250–500mg q18h PO","250–500mg q24h PO","n","r","r","r"],
      ["Levofloxacin","750mg q24h IV/PO","750mg loading, then 500mg q24h","750mg loading, then 250mg q24h","500mg loading, then 250mg q48h","n","r","r","r"],
      ["Moxifloxacin","400mg q24h IV/PO","No adjustment","No adjustment","No adjustment","n","n","n","n"],
    ]},
    {label:"Other Antimicrobials", rows:[
      ["TMP-SMX","1 DS tab q12h PO / 5–10 mg/kg q6–8h IV","No adjustment","50% dose reduction or q24h","AVOID (CrCl <15)","n","n","r","a"],
      ["Metronidazole","500mg q8h IV/PO","No adjustment","No adjustment","No adjustment","n","n","n","n"],
      ["Nitrofurantoin","100mg ER q12h PO","Use with caution <45","AVOID (CrCl <30)","AVOID","n","r","a","a"],
      ["Azithromycin","500mg q24h IV/PO","No adjustment","No adjustment","No adjustment","n","n","n","n"],
      ["Clindamycin","600–900mg q8h IV / 300–450mg q6–8h PO","No adjustment","No adjustment","No adjustment","n","n","n","n"],
      ["Fluconazole","200–800mg q24h","No adjustment","50% dose reduction","50% dose, supplement after HD","n","n","r","r"],
    ]},
  ];

  return (
    <div>
      {sections.map(sec=>(
        <div key={sec.label}>
          <div style={{padding:"12px 0 6px",fontSize:10,fontWeight:800,textTransform:"uppercase",letterSpacing:".1em",color:T.muted}}>{sec.label}</div>
          <div style={{overflowX:"auto",marginBottom:18}}>
            <table style={tableStyle}>
              <thead><tr>{heads.map((h,i)=><th key={i} style={th}>{h}</th>)}</tr></thead>
              <tbody>
                {sec.rows.map((row,ri)=>{
                  const cells=row.slice(0,5);
                  const types=row.slice(5);
                  return (
                    <tr key={ri}>
                      <td style={drug}>{cells[0]}</td>
                      {[1,2,3,4].map(ci=>{
                        const t=types[ci-1]||"n";
                        const style=t==="a"?da(ci):t==="r"?dr(ci):dn(ci);
                        return <td key={ci} style={style}>{cells[ci]}</td>;
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmpiricPanel({selectedInfection, setting, allergies, mrsaRate, esblRate, onQuickLog, age, wt, crcl}) {
  if(!selectedInfection) return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:300,gap:14,opacity:.5,textAlign:"center"}}>
      <div style={{fontSize:48}}>🧬</div>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,color:T.dim}}>Select an infection type</div>
      <div style={{fontSize:12,color:T.muted}}>Choose from the left panel to see evidence-based empiric antibiotic recommendations</div>
    </div>
  );

  const inf=INFECTIONS[selectedInfection];
  const regimens=inf.regimens[setting]||(setting==="icu"?inf.regimens["inpatient"]:[]);
  const settingLabel=setting==="outpatient"?"🏠 Outpatient":setting==="icu"?"🚨 ICU/Severe":"🏥 Inpatient";
  const settingColor=setting==="outpatient"?T.green:setting==="icu"?T.red:T.blue;

  return (
    <div>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:700,color:T.bright,marginBottom:4}}>{inf.name}</div>
      <div style={{fontSize:12,color:T.dim,marginBottom:16,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
        {inf.sub}
        <span style={{display:"inline-flex",alignItems:"center",padding:"3px 9px",borderRadius:10,fontSize:"10.5px",fontWeight:700,border:"1px solid",color:settingColor,borderColor:settingColor+"55",background:settingColor+"15"}}>{settingLabel}</span>
      </div>

      <DiagnosticWorkup infectionId={selectedInfection} allergies={allergies} crcl={crcl} mrsaRate={mrsaRate} esblRate={esblRate} />
      <DosageCalculator infection={inf} setting={setting} age={age} wt={wt} crcl={crcl} />
      {mrsaRate>=30&&<AlertBox type="red" icon="⚠️" title={`High Local MRSA Rate (${mrsaRate}%)`} body="Always consider MRSA coverage for purulent/severe infections. MRSA nares PCR can help de-escalate."/>}
      {esblRate>=20&&<AlertBox type="amber" icon="🔬" title={`High ESBL Rate (${esblRate}%)`} body="Consider carbapenem for complicated UTI, IAI, or bloodstream infection from urinary/abdominal source."/>}
      {allergies.has("pcn")&&<AlertBox type="amber" icon="⚠️" title="PCN Allergy Documented" body="Cross-reactivity with cephalosporins is ~2%. Cephalosporins are generally safe unless history suggests anaphylaxis."/>}
      {allergies.has("fq")&&<AlertBox type="amber" icon="⚠️" title="Fluoroquinolone Allergy" body="Fluoroquinolone alternatives highlighted below."/>}

      {(!regimens||regimens.length===0)&&<AlertBox type="blue" icon="ℹ️" title="Setting Note" body="This infection is typically managed in a higher acuity setting. Switch to Inpatient or ICU for regimen guidance."/>}

      {(regimens||[]).map((reg,ri)=>(
        <div key={ri} style={{background:T.panel,border:`1px solid ${T.border}`,borderRadius:13,overflow:"hidden",marginBottom:14}}>
          <div style={{padding:"13px 16px",display:"flex",alignItems:"center",gap:10,borderBottom:`1px solid rgba(30,58,95,.5)`}}>
            <TierBadge tier={reg.tier}/>
            <span style={{fontWeight:700,fontSize:14,color:T.bright,flex:1}}>{reg.title}</span>
            <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:T.dim,background:"rgba(30,58,95,.6)",padding:"3px 8px",borderRadius:6}}>⏱ {reg.duration}</span>
          </div>
          <div style={{padding:"14px 16px",display:"flex",flexDirection:"column",gap:10}}>
            {reg.drugs.map((d,di)=>{
              if(d.connector) return <div key={di} style={{fontSize:11,fontWeight:700,color:T.muted,paddingLeft:70,margin:"-4px 0"}}>— {d.connector} —</div>;
              const isFQ=d.dose&&(d.dose.toLowerCase().includes("cipro")||d.dose.toLowerCase().includes("levo")||d.dose.toLowerCase().includes("moxi"));
              const isPCN=d.dose&&(d.dose.toLowerCase().includes("amox")||d.dose.toLowerCase().includes("ampicillin")||d.dose.toLowerCase().includes("nafcillin")||d.dose.toLowerCase().includes("oxacillin")||d.dose.toLowerCase().includes("piperacillin"));
              const faded=(isFQ&&allergies.has("fq"))||(isPCN&&allergies.has("pcn"));
              return (
                <div key={di} style={{display:"flex",alignItems:"flex-start",gap:10,opacity:faded?0.4:1,textDecoration:faded?"line-through":"none"}}>
                  <span style={{fontSize:10,fontWeight:800,textTransform:"uppercase",letterSpacing:".07em",color:T.dim,width:60,flexShrink:0,paddingTop:2}}>{d.label}</span>
                  <div>
                    <div style={{fontWeight:700,fontSize:13,color:T.bright}}>{d.name}</div>
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:T.teal,marginTop:2}}>{d.dose}</div>
                    {d.note&&<div style={{fontSize:11,color:T.dim,marginTop:2,lineHeight:1.5}}>{d.note}</div>}
                  </div>
                </div>
              );
            })}
            <div style={{marginTop:6}}>
              <button onClick={()=>onQuickLog(reg.title,selectedInfection)} style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:11,fontWeight:700,padding:"5px 11px",borderRadius:7,background:"rgba(0,212,188,.08)",border:"1px solid rgba(0,212,188,.25)",color:T.teal,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>＋ Log to Tracker</button>
            </div>
          </div>
        </div>
      ))}

      {inf.alerts&&inf.alerts.length>0&&(
        <div>
          <div style={{marginTop:8,marginBottom:4,fontSize:"9.5px",fontWeight:800,textTransform:"uppercase",letterSpacing:".08em",color:T.dim}}>Clinical Pearls</div>
          {inf.alerts.map((a,i)=><AlertBox key={i} type="blue" icon="💡" title="" body={a}/>)}
        </div>
      )}
    </div>
  );
}

function IVPOPanel() {
  return (
    <div>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:700,color:T.bright,marginBottom:4}}>IV-to-Oral Conversion</div>
      <div style={{fontSize:12,color:T.dim,marginBottom:18}}>Switch criteria: hemodynamically stable, tolerating PO, WBC normalizing, afebrile ≥24h, adequate bioavailability</div>
      <AlertBox type="green" icon="✅" title="When to switch:" body="Clinical improvement, GI absorption intact, no IV-only indication (endocarditis, CNS, bacteremia requiring IV penetration), oral bioavailability ≥50%"/>
      {IVPO_DATA.map((d,i)=>(
        <div key={i} style={{background:T.panel,border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden",marginBottom:12}}>
          <div style={{padding:"11px 16px",background:"rgba(22,45,79,.4)",borderBottom:`1px solid rgba(30,58,95,.5)`,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontWeight:700,fontSize:13,color:T.blue}}>{d.iv.split(" ")[0]}</span>
              <span style={{color:T.dim,fontSize:12}}>→</span>
              <span style={{fontWeight:700,fontSize:13,color:T.green}}>{d.po.split(" ")[0]}</span>
            </div>
            <span style={{fontSize:10,fontWeight:700,padding:"3px 9px",borderRadius:10,background:"rgba(155,109,255,.12)",border:"1px solid rgba(155,109,255,.3)",color:T.purple}}>Bioavailability: {d.ba}</span>
          </div>
          <div style={{padding:"12px 16px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,fontSize:12}}>
            {[["IV Dose",d.ivDose],["PO Equivalent",d.poDose],["Equivalent?",d.equivalent],["Timing",d.timing]].map(([label,val],j)=>(
              <div key={j} style={{display:"flex",flexDirection:"column",gap:3}}>
                <span style={{fontSize:"9.5px",fontWeight:800,textTransform:"uppercase",letterSpacing:".07em",color:T.dim}}>{label}</span>
                <span style={{fontFamily:j<=1?"'JetBrains Mono',monospace":"'DM Sans',sans-serif",fontSize:j<=1?12:11,color:T.bright,fontWeight:600}}>{val}</span>
              </div>
            ))}
          </div>
          <div style={{padding:"10px 16px",borderTop:`1px solid rgba(30,58,95,.4)`,fontSize:"11.5px",color:T.text,lineHeight:1.6}}>
            <span style={{fontWeight:700,color:T.green,marginRight:4}}>Switch criteria:</span>{d.criteria} <em style={{color:T.purple}}>{d.special}</em>
          </div>
        </div>
      ))}
    </div>
  );
}

function DeEscPanel() {
  return (
    <div>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:700,color:T.bright,marginBottom:4}}>De-escalation Framework</div>
      <div style={{fontSize:12,color:T.dim,marginBottom:18}}>Systematic approach to narrowing antibiotic spectrum based on culture results and clinical trajectory</div>
      <AlertBox type="blue" icon="ℹ️" title="Stewardship Principle:" body="The right antibiotic, at the right dose, for the shortest effective duration. De-escalation reduces C. diff risk, resistance selection pressure, adverse effects, and cost."/>
      {DEESC_STEPS.map((s,i)=>(
        <div key={i} style={{background:T.panel,border:`1px solid ${T.border}`,borderRadius:12,marginBottom:12,overflow:"hidden"}}>
          <div style={{padding:"12px 16px",background:"rgba(22,45,79,.4)",borderBottom:`1px solid rgba(30,58,95,.5)`,display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:26,height:26,borderRadius:"50%",background:"rgba(0,212,188,.15)",border:"1px solid rgba(0,212,188,.3)",color:T.teal,fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{s.step}</div>
            <div style={{fontWeight:700,fontSize:"13.5px",color:T.bright,flex:1}}>{s.title}</div>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"10.5px",color:T.dim}}>{s.timeline}</div>
          </div>
          <div style={{padding:"14px 16px",fontSize:"12.5px",color:T.text,lineHeight:1.7}}>
            <p style={{marginBottom:10}}>{s.body}</p>
            <ul style={{listStyle:"none",display:"flex",flexDirection:"column",gap:5}}>
              {s.list.map((item,j)=>(
                <li key={j} style={{display:"flex",alignItems:"flex-start",gap:8}}>
                  <span style={{color:T.teal,fontWeight:700,flexShrink:0,marginTop:1}}>→</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}

function TrackerPanel({log, onAdd, onDelete}) {
  const stats = {
    encounters: log.length,
    dot: log.reduce((s,e)=>s+(parseInt(e.duration)||0),0),
    po: log.length?Math.round((log.filter(e=>e.route==="PO").length/log.length)*100):0,
    broad: log.filter(e=>e.spectrum==="broad").length,
  };

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      <div style={{padding:"14px 16px 10px",fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,color:T.bright,borderBottom:`1px solid rgba(30,58,95,.5)`,background:"rgba(11,29,53,.5)",display:"flex",alignItems:"center",gap:8}}>
        <span>📋</span> Stewardship Log
      </div>
      <button onClick={onAdd} style={{margin:12,padding:10,background:"rgba(0,212,188,.08)",border:"1px dashed rgba(0,212,188,.3)",borderRadius:9,color:T.teal,fontFamily:"'DM Sans',sans-serif",fontSize:"12.5px",fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>
        ＋ Log New Antibiotic Use
      </button>

      <div style={{flex:1,overflowY:"auto"}}>
        {log.length===0?(
          <div style={{padding:"24px 16px",textAlign:"center",color:T.muted,fontSize:"12.5px",lineHeight:1.6}}>
            <div style={{fontSize:32,marginBottom:8,opacity:.4}}>📋</div>
            No antibiotic encounters logged yet.<br/>Click ＋ to track prescriptions for stewardship reporting.
          </div>
        ):(
          log.map(entry=>{
            const statusColors={active:{bg:"rgba(0,212,188,.1)",color:T.teal,border:"rgba(0,212,188,.25)"},completed:{bg:"rgba(46,204,113,.1)",color:T.green,border:"rgba(46,204,113,.25)"},deescalated:{bg:"rgba(155,109,255,.1)",color:T.purple,border:"rgba(155,109,255,.25)"}};
            const sc=statusColors[entry.status]||statusColors.active;
            return (
              <div key={entry.id} style={{background:T.panel,border:`1px solid ${T.border}`,borderRadius:11,margin:"0 12px 10px",overflow:"hidden"}}>
                <div style={{padding:"10px 12px",background:"rgba(22,45,79,.4)",borderBottom:`1px solid rgba(30,58,95,.4)`,display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.dim}}>{entry.encounter||"—"}</span>
                  <span style={{fontSize:10,color:T.dim,marginLeft:"auto"}}>{entry.date}</span>
                </div>
                <div style={{padding:"10px 12px",display:"flex",flexDirection:"column",gap:6}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:6}}>
                    <span style={{fontWeight:700,fontSize:12,color:T.bright}}>{entry.drug}</span>
                    <span style={{fontSize:10,fontWeight:700,padding:"2px 6px",borderRadius:5,background:entry.route==="IV"?"rgba(74,144,217,.15)":"rgba(46,204,113,.12)",color:entry.route==="IV"?T.blue:T.green}}>{entry.route}</span>
                  </div>
                  {entry.dose&&<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"10.5px",color:T.dim}}>{entry.dose}</span>}
                  {entry.indication&&<span style={{fontSize:"10.5px",color:T.dim}}>{entry.indication}</span>}
                  {entry.duration>0&&<span style={{fontSize:"10.5px",color:T.dim}}>{entry.duration} days planned</span>}
                </div>
                <div style={{padding:"8px 12px",borderTop:`1px solid rgba(30,58,95,.3)`,display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:10,background:sc.bg,color:sc.color,border:`1px solid ${sc.border}`}}>{entry.status}</span>
                  <button onClick={()=>onDelete(entry.id)} style={{marginLeft:"auto",background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:13,fontFamily:"'DM Sans',sans-serif"}}>🗑</button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {log.length>0&&(
        <div style={{padding:12,borderTop:`1px solid ${T.border}`}}>
          <div style={{fontSize:10,fontWeight:800,textTransform:"uppercase",letterSpacing:".08em",color:T.dim,marginBottom:8}}>Quick Stats</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
            {[["Encounters",stats.encounters,T.teal],["Total DOT",stats.dot,T.purple],["PO Rate",stats.po+"%",T.green],["Broad-spec",stats.broad,T.amber]].map(([label,val,color])=>(
              <div key={label} style={{background:T.panel,border:`1px solid ${T.border}`,borderRadius:8,padding:8,textAlign:"center"}}>
                <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:18,fontWeight:700,color}}>{val}</div>
                <div style={{fontSize:10,color:T.dim,marginTop:2}}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LogModal({onClose, onSave, prefillIndication}) {
  const [form,setForm]=useState({encounter:"",date:new Date().toISOString().slice(0,10),drug:"",route:"IV",dose:"",duration:"",indication:prefillIndication||"CAP",spectrum:"broad",status:"active",notes:""});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const drugs=["Amoxicillin-clavulanate","Ampicillin-sulbactam","Azithromycin","Cefazolin","Cefdinir","Cefepime","Ceftaroline","Ceftriaxone","Ciprofloxacin","Clindamycin","Daptomycin","Doxycycline","Ertapenem","Fluconazole","Levofloxacin","Linezolid","Meropenem","Metronidazole","Moxifloxacin","Nitrofurantoin","Piperacillin-tazobactam","TMP-SMX","Vancomycin"];
  const indications=["CAP","HAP/VAP","UTI - Uncomplicated","UTI - Complicated","SSTI - Non-purulent","SSTI - Purulent","Bacterial Meningitis","Sepsis/Septic Shock","Intra-abdominal","Osteomyelitis","Diabetic Foot Infection","Febrile Neutropenia","Prophylaxis","Other"];

  const inputStyle={background:"rgba(22,45,79,.8)",border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 12px",fontFamily:"'DM Sans',sans-serif",fontSize:"12.5px",color:T.bright,outline:"none",width:"100%",boxSizing:"border-box"};
  const labelStyle={fontSize:10,fontWeight:800,textTransform:"uppercase",letterSpacing:".07em",color:T.dim,display:"block",marginBottom:4};

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",backdropFilter:"blur(6px)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onClose}>
      <div style={{background:T.slate,border:`1px solid ${T.border}`,borderRadius:18,width:640,maxHeight:"85vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
        <div style={{padding:"20px 24px 16px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:22}}>💊</span>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700,color:T.bright,flex:1}}>Log Antibiotic Use</div>
          <button onClick={onClose} style={{background:"none",border:"none",color:T.dim,fontSize:20,cursor:"pointer"}}>✕</button>
        </div>
        <div style={{padding:"20px 24px",display:"flex",flexDirection:"column",gap:12}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div><label style={labelStyle}>Patient / Encounter ID</label><input style={inputStyle} value={form.encounter} onChange={e=>set("encounter",e.target.value)} placeholder="e.g. Room 4 or MRN"/></div>
            <div><label style={labelStyle}>Date Started</label><input type="date" style={inputStyle} value={form.date} onChange={e=>set("date",e.target.value)}/></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div><label style={labelStyle}>Antibiotic</label>
              <input list="drug-list-modal" style={inputStyle} value={form.drug} onChange={e=>set("drug",e.target.value)} placeholder="e.g. Ceftriaxone"/>
              <datalist id="drug-list-modal">{drugs.map(d=><option key={d}>{d}</option>)}</datalist>
            </div>
            <div><label style={labelStyle}>Route</label>
              <select style={{...inputStyle,cursor:"pointer"}} value={form.route} onChange={e=>set("route",e.target.value)}>
                <option value="IV">IV</option><option value="PO">PO</option><option value="IM">IM</option>
              </select>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div><label style={labelStyle}>Dose</label><input style={inputStyle} value={form.dose} onChange={e=>set("dose",e.target.value)} placeholder="e.g. 1g q8h"/></div>
            <div><label style={labelStyle}>Planned Duration (days)</label><input type="number" style={inputStyle} value={form.duration} onChange={e=>set("duration",e.target.value)} placeholder="7"/></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div><label style={labelStyle}>Indication</label>
              <select style={{...inputStyle,cursor:"pointer"}} value={form.indication} onChange={e=>set("indication",e.target.value)}>
                {indications.map(i=><option key={i}>{i}</option>)}
              </select>
            </div>
            <div><label style={labelStyle}>Spectrum</label>
              <select style={{...inputStyle,cursor:"pointer"}} value={form.spectrum} onChange={e=>set("spectrum",e.target.value)}>
                <option value="narrow">Narrow</option><option value="moderate">Moderate</option><option value="broad">Broad</option>
              </select>
            </div>
          </div>
          <div><label style={labelStyle}>Status</label>
            <select style={{...inputStyle,cursor:"pointer"}} value={form.status} onChange={e=>set("status",e.target.value)}>
              <option value="active">Active</option><option value="completed">Completed</option><option value="deescalated">De-escalated</option>
            </select>
          </div>
          <div><label style={labelStyle}>Notes</label><input style={inputStyle} value={form.notes} onChange={e=>set("notes",e.target.value)} placeholder="Culture results, rationale, allergies considered…"/></div>
        </div>
        <div style={{padding:"16px 24px",borderTop:`1px solid ${T.border}`,display:"flex",gap:10,justifyContent:"flex-end"}}>
          <button onClick={onClose} style={{padding:"9px 18px",borderRadius:8,fontFamily:"'DM Sans',sans-serif",fontSize:"12.5px",fontWeight:700,cursor:"pointer",background:"transparent",border:`1px solid ${T.border}`,color:T.text}}>Cancel</button>
          <button onClick={()=>form.drug.trim()&&onSave(form)} style={{padding:"9px 18px",borderRadius:8,fontFamily:"'DM Sans',sans-serif",fontSize:"12.5px",fontWeight:700,cursor:"pointer",background:"linear-gradient(135deg,#00d4bc,#00a896)",border:"none",color:"#fff"}}>💊 Log Entry</button>
        </div>
      </div>
    </div>
  );
}

function Toast({message,color,onDone}) {
  useEffect(()=>{ const t=setTimeout(onDone,2800); return()=>clearTimeout(t); },[onDone]);
  return (
    <div style={{background:T.panel,border:`1px solid ${T.border}`,borderLeft:`3px solid ${color||T.teal}`,borderRadius:10,padding:"11px 16px",fontSize:"12.5px",fontWeight:600,color:T.bright,boxShadow:"0 8px 24px rgba(0,0,0,.3)"}}>
      {message}
    </div>
  );
}

export default function AntibioticStewardship() {
  const navigate = useNavigate();
  const [selectedInfection, setSelectedInfection]=useState(null);
  const [setting, setSetting]=useState("inpatient");
  const [age, setAge]=useState("");
  const [wt, setWt]=useState("");
  const [scr, setScr]=useState("");
  const [sex, setSex]=useState("M");
  const [allergies, setAllergies]=useState(new Set());
  const [resist, setResist]=useState({mrsa:"30",esbl:"15",pseudo:"20",fqec:"25",spneu:"10"});
  const [activeTab, setActiveTab]=useState("empiric");
  const [log, setLog]=useState(()=>JSON.parse(localStorage.getItem("notrya-abx-log")||"[]"));
  const [showLogModal, setShowLogModal]=useState(false);
  const [prefillIndication, setPrefillIndication]=useState("");
  const [toasts, setToasts]=useState([]);

  const crcl=calcCrClValue(parseFloat(age),parseFloat(wt),parseFloat(scr),sex);

  const addToast=(msg,color)=>{ const id=Date.now(); setToasts(t=>[...t,{id,msg,color}]); };
  const removeToast=(id)=>setToasts(t=>t.filter(x=>x.id!==id));

  const toggleAllergy=(key)=>setAllergies(prev=>{ const n=new Set(prev); n.has(key)?n.delete(key):n.add(key); return n; });

  const saveLog=(form)=>{
    const entry={id:Date.now(),...form,duration:parseInt(form.duration)||0};
    const newLog=[entry,...log];
    setLog(newLog);
    localStorage.setItem("notrya-abx-log",JSON.stringify(newLog));
    setShowLogModal(false);
    addToast(`${form.drug} logged ✓`,T.teal);
  };

  const deleteLog=(id)=>{ const n=log.filter(e=>e.id!==id); setLog(n); localStorage.setItem("notrya-abx-log",JSON.stringify(n)); };

  const quickLog=(title,infId)=>{
    const indMap={"cap":"CAP","hap":"HAP/VAP","uti-uncomp":"UTI - Uncomplicated","uti-comp":"UTI - Complicated","ssti-non":"SSTI - Non-purulent","ssti-pur":"SSTI - Purulent","meningitis":"Bacterial Meningitis","sepsis":"Sepsis/Septic Shock","iai":"Intra-abdominal","osteo":"Osteomyelitis","dfi":"Diabetic Foot Infection","febrile-neutro":"Febrile Neutropenia"};
    setPrefillIndication(indMap[infId]||"Other");
    setShowLogModal(true);
  };

  const tabs=[{id:"empiric",label:"💊 Empiric Therapy"},{id:"renal",label:"🫘 Renal Dosing"},{id:"ivpo",label:"🔄 IV-to-PO"},{id:"deesc",label:"📉 De-escalation"}];

  return (
    <div style={{background:T.navy,minHeight:"100%",fontFamily:"'DM Sans',sans-serif",display:"flex",flexDirection:"column"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:transparent} ::-webkit-scrollbar-thumb{background:#2a4d72;border-radius:2px}
        select option{background:#0d2240;color:#c8ddf0}
      `}</style>

      {/* PAGE HEADER */}
      <div style={{padding:"18px 28px 14px",borderBottom:"1px solid rgba(30,58,95,.6)",background:"rgba(11,29,53,.4)",display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,flexWrap:"wrap"}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <button onClick={()=>navigate(createPageUrl('DrugsBugs'))} style={{padding:"8px 14px",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",background:"transparent",border:`1px solid ${T.border}`,color:T.dim,display:"flex",alignItems:"center",gap:6}}>← Back to Drugs & Bugs</button>
          <div style={{width:46,height:46,background:"rgba(46,204,113,.1)",border:"1px solid rgba(46,204,113,.25)",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>🧬</div>
          <div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:T.bright}}>Antibiotic Stewardship Guide</div>
            <div style={{fontSize:12,color:T.dim,marginTop:2}}>Empiric selection · Renal dosing · IV-to-PO conversion · De-escalation · Stewardship tracking</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
          <div style={{background:"rgba(46,204,113,.1)",border:"1px solid rgba(46,204,113,.25)",borderRadius:20,padding:"6px 14px",fontSize:"11.5px",fontWeight:700,color:T.green}}>🧬 Evidence-Based</div>
          <div style={{background:"rgba(74,144,217,.1)",border:"1px solid rgba(74,144,217,.25)",borderRadius:20,padding:"6px 14px",fontSize:"11.5px",fontWeight:700,color:T.blue}}>📊 {log.length} Logged</div>
          <button onClick={()=>setShowLogModal(true)} style={{padding:"9px 18px",borderRadius:8,fontFamily:"'DM Sans',sans-serif",fontSize:"12.5px",fontWeight:700,cursor:"pointer",background:"linear-gradient(135deg,#4a90d9,#2f6db5)",border:"none",color:"#fff",display:"inline-flex",alignItems:"center",gap:6}}>＋ Log Antibiotic</button>
        </div>
      </div>

      {/* MAIN 3-COLUMN LAYOUT */}
      <div style={{display:"grid",gridTemplateColumns:"300px 1fr 300px",flex:1,minHeight:0,height:"calc(100vh - 145px)"}}>

        {/* LEFT PANEL */}
        <div style={{borderRight:`1px solid ${T.border}`,overflowY:"auto",background:"rgba(11,29,53,.3)",display:"flex",flexDirection:"column"}}>
          <div style={{padding:"14px 16px 10px",fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,color:T.bright,borderBottom:"1px solid rgba(30,58,95,.5)",background:"rgba(11,29,53,.5)",display:"flex",alignItems:"center",gap:8,position:"sticky",top:0,zIndex:4}}>
            <span>🦠</span> Infection Type
          </div>

          {INFECTION_LIST.map(section=>(
            <div key={section.section}>
              <div style={{padding:"8px 16px 4px",fontSize:"9.5px",fontWeight:800,textTransform:"uppercase",letterSpacing:".1em",color:T.muted}}>{section.section}</div>
              <div style={{display:"flex",flexDirection:"column",gap:3,padding:"0 10px 6px"}}>
                {section.items.map(item=>(
                  <button key={item.id} onClick={()=>setSelectedInfection(item.id)}
                    style={{width:"100%",textAlign:"left",padding:"10px 12px",background:selectedInfection===item.id?"rgba(0,212,188,.08)":"transparent",border:`1px solid ${selectedInfection===item.id?"rgba(0,212,188,.35)":"rgba(30,58,95,.6)"}`,borderRadius:9,cursor:"pointer",display:"flex",alignItems:"center",gap:10,color:selectedInfection===item.id?T.teal:T.text,fontFamily:"'DM Sans',sans-serif",fontSize:"12.5px",fontWeight:500}}>
                    <span style={{fontSize:18,width:24,flexShrink:0,opacity:selectedInfection===item.id?1:.7}}>{item.icon}</span>
                    <div>
                      <div style={{fontWeight:600,fontSize:"12.5px",lineHeight:1.2}}>{item.name}</div>
                      <div style={{fontSize:10,color:T.dim,marginTop:1}}>{item.sub}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* PATIENT PARAMETERS */}
          <div style={{padding:"14px 16px 10px",fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,color:T.bright,borderTop:`1px solid rgba(30,58,95,.5)`,borderBottom:"1px solid rgba(30,58,95,.5)",background:"rgba(11,29,53,.5)",display:"flex",alignItems:"center",gap:8,marginTop:8}}>
            <span>👤</span> Patient Parameters
          </div>
          <div style={{padding:12}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
              {[[age,setAge,"Age (yrs)","number","—"],[wt,setWt,"Weight (kg)","number","—"]].map(([val,setVal,label,type,ph])=>(
                <div key={label}>
                  <span style={{display:"block",fontSize:"9.5px",fontWeight:700,textTransform:"uppercase",letterSpacing:".07em",color:T.dim,marginBottom:3}}>{label}</span>
                  <input type={type} value={val} onChange={e=>setVal(e.target.value)} placeholder={ph} style={{background:"rgba(22,45,79,.7)",border:`1px solid ${T.border}`,borderRadius:7,padding:"7px 10px",fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:500,color:T.bright,outline:"none",width:"100%",boxSizing:"border-box"}}/>
                </div>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
              <div>
                <span style={{display:"block",fontSize:"9.5px",fontWeight:700,textTransform:"uppercase",letterSpacing:".07em",color:T.dim,marginBottom:3}}>SCr (mg/dL)</span>
                <input type="number" step="0.1" value={scr} onChange={e=>setScr(e.target.value)} placeholder="—" style={{background:"rgba(22,45,79,.7)",border:`1px solid ${T.border}`,borderRadius:7,padding:"7px 10px",fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:500,color:T.bright,outline:"none",width:"100%",boxSizing:"border-box"}}/>
              </div>
              <div>
                <span style={{display:"block",fontSize:"9.5px",fontWeight:700,textTransform:"uppercase",letterSpacing:".07em",color:T.dim,marginBottom:3}}>Sex</span>
                <select value={sex} onChange={e=>setSex(e.target.value)} style={{background:"rgba(22,45,79,.7)",border:`1px solid ${T.border}`,borderRadius:7,padding:"7px 10px",fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:500,color:T.bright,outline:"none",width:"100%",cursor:"pointer"}}>
                  <option value="M">Male</option><option value="F">Female</option>
                </select>
              </div>
            </div>
            <div style={{marginBottom:8}}>
              <span style={{display:"block",fontSize:"9.5px",fontWeight:700,textTransform:"uppercase",letterSpacing:".07em",color:T.dim,marginBottom:3}}>Clinical Setting</span>
              <select value={setting} onChange={e=>setSetting(e.target.value)} style={{background:"rgba(22,45,79,.7)",border:`1px solid ${T.border}`,borderRadius:7,padding:"7px 10px",fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:500,color:T.bright,outline:"none",width:"100%",cursor:"pointer"}}>
                <option value="outpatient">Outpatient</option>
                <option value="inpatient">Inpatient (Floor)</option>
                <option value="icu">ICU / Severe</option>
              </select>
            </div>
            <div style={{background:"rgba(0,212,188,.07)",border:"1px solid rgba(0,212,188,.2)",borderRadius:9,padding:"10px 12px",marginTop:4}}>
              <div style={{fontSize:"9.5px",fontWeight:800,textTransform:"uppercase",letterSpacing:".08em",color:T.teal,marginBottom:4}}>CrCl — Cockcroft-Gault</div>
              <div>
                <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:20,fontWeight:700,color:T.teal}}>{crcl!==null?crcl:"—"}</span>
                <span style={{fontSize:11,color:T.dim}}> mL/min</span>
              </div>
              {crcl!==null&&<div style={{marginTop:4}}><CrClTier val={crcl}/></div>}
            </div>
          </div>

          {/* ALLERGIES */}
          <div style={{padding:"14px 16px 10px",fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,color:T.bright,borderTop:`1px solid rgba(30,58,95,.5)`,borderBottom:"1px solid rgba(30,58,95,.5)",background:"rgba(11,29,53,.5)",display:"flex",alignItems:"center",gap:8}}>
            <span>⚠️</span> Allergies
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:5,padding:12}}>
            {ALLERGY_LIST.map((label,i)=>{
              const key=ALLERGY_KEYS[i];
              const active=allergies.has(key);
              return (
                <button key={key} onClick={()=>toggleAllergy(key)} style={{padding:"5px 10px",borderRadius:20,border:`1px solid ${active?"rgba(255,92,108,.4)":T.border}`,background:active?"rgba(255,92,108,.15)":"transparent",fontSize:11,fontWeight:700,color:active?T.red:T.dim,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
                  {label}
                </button>
              );
            })}
          </div>

          {/* RESISTANCE */}
          <div style={{padding:"14px 16px 10px",fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,color:T.bright,borderTop:`1px solid rgba(30,58,95,.5)`,borderBottom:"1px solid rgba(30,58,95,.5)",background:"rgba(11,29,53,.5)",display:"flex",alignItems:"center",gap:8}}>
            <span>📊</span> Local Resistance Rates
          </div>
          <div style={{padding:12,display:"flex",flexDirection:"column",gap:8}}>
            <AntibiogramManager
              currentResist={resist}
              onApply={(mapped) => {
                setResist(r => ({ ...r, ...mapped }));
                addToast("Antibiogram applied to resistance rates ✓", T.teal);
              }}
            />
            {[["mrsa","MRSA prevalence",T.red],["esbl","ESBL E. coli / Klebsiella",T.amber],["pseudo","Pseudomonas pip/tazo-R",T.amber],["fqec","FQ-resistant E. coli",T.blue],["spneu","Pen-R S. pneumoniae",T.purple]].map(([key,label,color])=>(
              <div key={key} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,fontWeight:600,color:T.text}}>{label}</div>
                  <div style={{width:"100%",height:4,borderRadius:2,background:T.edge,overflow:"hidden",marginTop:2}}>
                    <div style={{height:"100%",borderRadius:2,background:color,width:Math.min(parseInt(resist[key])||0,100)+"%",transition:"width .3s"}}/>
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:4}}>
                  <input type="number" value={resist[key]} onChange={e=>setResist(r=>({...r,[key]:e.target.value}))} placeholder="—" min="0" max="100"
                    style={{width:50,textAlign:"center",background:"rgba(22,45,79,.7)",border:`1px solid ${T.border}`,borderRadius:6,padding:"5px 8px",fontFamily:"'JetBrains Mono',monospace",fontSize:12,fontWeight:700,color:T.bright,outline:"none"}}/>
                  <span style={{fontSize:10,color:T.dim}}>%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CENTER PANEL */}
        <div style={{overflowY:"auto",display:"flex",flexDirection:"column",background:"rgba(5,10,20,.4)"}}>
          <div style={{display:"flex",borderBottom:`1px solid ${T.border}`,background:"rgba(11,29,53,.7)",position:"sticky",top:0,zIndex:5}}>
            {tabs.map(t=>(
              <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{flex:1,padding:"13px 8px",fontSize:12,fontWeight:700,textAlign:"center",cursor:"pointer",border:"none",background:activeTab===t.id?"rgba(0,212,188,.05)":"transparent",color:activeTab===t.id?T.bright:T.dim,borderBottom:`2px solid ${activeTab===t.id?T.teal:"transparent"}`,letterSpacing:".02em",fontFamily:"'DM Sans',sans-serif"}}>
                {t.label}
              </button>
            ))}
          </div>
          <div style={{padding:20,flex:1}}>
            {activeTab==="empiric"&&<EmpiricPanel selectedInfection={selectedInfection} setting={setting} allergies={allergies} mrsaRate={parseInt(resist.mrsa)||30} esblRate={parseInt(resist.esbl)||15} onQuickLog={quickLog} age={age} wt={wt} crcl={crcl}/>}
            {activeTab==="renal"&&(
              <div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:700,color:T.bright,marginBottom:6}}>Renal Dose Adjustments</div>
                <div style={{fontSize:12,color:T.dim,marginBottom:16}}>
                  Based on Cockcroft-Gault CrCl.{" "}
                  {crcl!==null?<span style={{color:T.teal,fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}>CrCl {crcl} mL/min — column highlighted</span>:<span style={{color:T.dim}}>Enter patient parameters to highlight column</span>}
                </div>
                {crcl!==null&&crcl<30&&<AlertBox type={crcl<15?"red":"amber"} icon="⚠️" title={crcl<15?"Severe Renal Impairment / Dialysis":"Moderate Renal Impairment"} body={crcl<15?" Avoid nephrotoxic agents. Vanco and renally-cleared drugs require significant adjustment. Consult pharmacy.":`CrCl ${crcl} mL/min — Review all antibiotic doses. Avoid nitrofurantoin. Reduce cefepime, pip/tazo, carbapenem doses.`}/>}
                <ReналTable crcl={crcl}/>
              </div>
            )}
            {activeTab==="ivpo"&&<IVPOPanel/>}
            {activeTab==="deesc"&&<DeEscPanel/>}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={{borderLeft:`1px solid ${T.border}`,overflowY:"auto",background:"rgba(11,29,53,.3)",display:"flex",flexDirection:"column"}}>
          <TrackerPanel log={log} onAdd={()=>setShowLogModal(true)} onDelete={deleteLog}/>
        </div>
      </div>

      {/* LOG MODAL */}
      {showLogModal&&<LogModal onClose={()=>setShowLogModal(false)} onSave={saveLog} prefillIndication={prefillIndication}/>}

      {/* TOASTS */}
      <div style={{position:"fixed",bottom:24,right:24,zIndex:999,display:"flex",flexDirection:"column",gap:8,pointerEvents:"none"}}>
        {toasts.map(t=><Toast key={t.id} message={t.msg} color={t.color} onDone={()=>removeToast(t.id)}/>)}
      </div>
    </div>
  );
}