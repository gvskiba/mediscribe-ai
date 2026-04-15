// SepsisAbxHub.jsx
// Sepsis Antibiotic Stewardship — standalone + embeddable in SepsisHub.
// Source-specific antibiotic selection for ED sepsis management.
//
// Sources covered:
//   CAP · HAP/VAP · Urosepsis / UTI · Skin & Soft Tissue (SSTI)
//   Intra-abdominal · Meningitis · Endocarditis · Neutropenic Fever
//   Unknown Source / Empiric
//
// Features:
//   - Source selector → regimen cards
//   - Penicillin allergy auto-detection from encounter
//   - Resistance flag badges (MRSA, ESBL, Pseudomonas, VRE)
//   - De-escalation trigger checklist
//   - Surviving Sepsis Campaign 1-hour bundle tracker
//
// Props (embedded): demo, medications, allergies, pmhSelected, vitals, cc
// Constraints: no form, no localStorage, no router import, straight quotes only,
//   single react import, border before borderTop/etc.

import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// ── Font injection ─────────────────────────────────────────────────────────────
(() => {
  if (document.getElementById("abx-fonts")) return;
  const l = document.createElement("link");
  l.id = "abx-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "abx-css";
  s.textContent = `
    @keyframes abx-fade{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
    .abx-fade{animation:abx-fade .18s ease forwards;}
    @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
    .shimmer-text{background:linear-gradient(90deg,#e8f0fe 0%,#fff 30%,#9b6dff 52%,#00e5c0 72%,#e8f0fe 100%);
    background-size:250% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;
    background-clip:text;animation:shimmer 5s linear infinite;}
  `;
  document.head.appendChild(s);
})();

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:"#050f1e", panel:"#081628",
  txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", blue:"#3b9eff",
  orange:"#ff9f43", purple:"#9b6dff", green:"#3dffa0", red:"#ff4444",
};

// ── Resistance flags ──────────────────────────────────────────────────────────
const RESISTANCE_FLAGS = {
  mrsa:   { label:"MRSA Risk",        color:T.red,    abbr:"MRSA"  },
  esbl:   { label:"ESBL Risk",        color:T.orange, abbr:"ESBL"  },
  pseudo: { label:"Pseudomonas Risk", color:T.purple, abbr:"Pseudo"},
  vre:    { label:"VRE Risk",         color:T.coral,  abbr:"VRE"   },
  ana:    { label:"Anaerobe Coverage",color:T.gold,   abbr:"Anaerobe"},
  fungal: { label:"Fungal Coverage",  color:T.gold,   abbr:"Fungal"},
};

// ── Antibiotic source data ────────────────────────────────────────────────────
const SOURCES = [
  // ── UNKNOWN / EMPIRIC ──────────────────────────────────────────────────────
  {
    id:"empiric",
    label:"Unknown / Empiric",
    icon:"❓",
    color:T.blue,
    desc:"Source not identified — broad-spectrum empiric coverage",
    organisms:"Gram-positive, Gram-negative, anaerobes — source unknown",
    resistanceFlags:["mrsa","esbl","pseudo","ana"],
    regimens:[
      {
        name:"Standard Empiric (no MRSA risk)",
        tier:"first",
        drugs:[
          { name:"Piperacillin-tazobactam", dose:"4.5 g IV q6–8h", route:"IV",
            note:"Extended-infusion 4.5 g over 4h q8h preferred for PK/PD optimization in sepsis" },
        ],
        notes:"Suitable for community-onset sepsis without MRSA risk factors.",
        deescalation:"Narrow once source identified and sensitivities available — typically 48–72h.",
      },
      {
        name:"+ MRSA Coverage (MRSA risk factors present)",
        tier:"first",
        drugs:[
          { name:"Vancomycin", dose:"25–30 mg/kg IV loading dose, then AUC-guided dosing", route:"IV",
            note:"Target AUC/MIC 400–600. Monitor troughs or AUC. Adjust for renal function." },
          { name:"+ Piperacillin-tazobactam", dose:"4.5 g IV q6–8h", route:"IV",
            note:"Extended infusion preferred" },
        ],
        notes:"Add vancomycin for: prior MRSA, healthcare-associated infection, skin/soft tissue source, IVDU.",
        deescalation:"Discontinue vancomycin at 48–72h if cultures negative for MRSA.",
      },
      {
        name:"PCN Allergy — Non-severe",
        tier:"allergy",
        drugs:[
          { name:"Ceftriaxone", dose:"2 g IV q24h", route:"IV", note:"<2% cross-reactivity with PCN allergy" },
          { name:"Metronidazole", dose:"500 mg IV q8h", route:"IV", note:"For anaerobic coverage" },
        ],
        notes:"Non-severe PCN allergy (rash): cephalosporins are safe — <2% cross-reactivity.",
        deescalation:"Narrow at 48–72h based on cultures.",
      },
      {
        name:"PCN Allergy — Severe (anaphylaxis)",
        tier:"allergy",
        drugs:[
          { name:"Aztreonam", dose:"2 g IV q8h", route:"IV", note:"Gram-negative only — no PCN cross-reactivity" },
          { name:"Vancomycin", dose:"25–30 mg/kg load then AUC-guided", route:"IV", note:"Gram-positive coverage" },
          { name:"Metronidazole", dose:"500 mg IV q8h", route:"IV", note:"Anaerobic coverage" },
        ],
        notes:"True anaphylaxis to PCN: avoid all beta-lactams. Aztreonam + vancomycin + metronidazole provides broad-spectrum coverage.",
        deescalation:"Narrowing essential — triple therapy has significant toxicity burden.",
      },
    ],
    mrsa_risk_factors:[
      "Prior MRSA infection or colonization",
      "Recent hospitalization (>48h) or healthcare contact",
      "Residence in long-term care facility",
      "IV drug use (IVDU)",
      "Chronic wounds, pressure ulcers",
      "Skin and soft tissue source",
    ],
    deescalation_triggers:[
      "Source identified and sensitivities available at 48–72h",
      "Negative MRSA screens — discontinue vancomycin",
      "Clinical improvement: fever trend, WBC trend, hemodynamic stabilization",
      "Cultures final and negative at 48–72h — consider stopping antibiotics",
    ],
  },

  // ── CAP ────────────────────────────────────────────────────────────────────
  {
    id:"cap",
    label:"Pneumonia (CAP)",
    icon:"🫁",
    color:T.blue,
    desc:"Community-acquired pneumonia — outpatient or ED presentation",
    organisms:"Streptococcus pneumoniae, Haemophilus influenzae, Mycoplasma, Legionella, Moraxella",
    resistanceFlags:[],
    regimens:[
      {
        name:"Mild CAP — No comorbidities",
        tier:"first",
        drugs:[
          { name:"Amoxicillin", dose:"1 g PO TID × 5 days", route:"PO",
            note:"For outpatient mild CAP per ATS/IDSA 2019" },
          { name:"OR Doxycycline", dose:"100 mg PO BID × 5 days", route:"PO",
            note:"Alternative — covers atypicals" },
        ],
        notes:"CURB-65 0–1: outpatient treatment appropriate. No fluoroquinolone unless comorbidities.",
        deescalation:"5-day course. Step down from IV to PO when tolerating oral, afebrile × 24h.",
      },
      {
        name:"Moderate CAP — Inpatient (non-ICU)",
        tier:"first",
        drugs:[
          { name:"Ceftriaxone", dose:"1–2 g IV q24h", route:"IV",
            note:"Beta-lactam coverage for S. pneumoniae, H. flu" },
          { name:"+ Azithromycin", dose:"500 mg IV/PO q24h", route:"IV/PO",
            note:"Atypical coverage — Mycoplasma, Legionella, Chlamydophila" },
        ],
        notes:"Beta-lactam + macrolide combination preferred. Duration: 5 days if good response.",
        deescalation:"Transition to oral amoxicillin + doxycycline or azithromycin when clinically improved.",
      },
      {
        name:"Severe CAP — ICU",
        tier:"first",
        drugs:[
          { name:"Ceftriaxone", dose:"2 g IV q24h", route:"IV",
            note:"Or ampicillin-sulbactam 3 g IV q6h" },
          { name:"+ Azithromycin", dose:"500 mg IV q24h", route:"IV",
            note:"Or levofloxacin 750 mg IV q24h if macrolide contraindicated" },
        ],
        notes:"Add MRSA coverage (vancomycin) if: cavitary/necrotizing pneumonia, recent influenza, post-obstructive, IVDU.",
        deescalation:"5–7 days if good clinical response. Legionella and pneumococcal urine antigen to guide narrowing.",
      },
      {
        name:"Legionella / Atypical",
        tier:"first",
        drugs:[
          { name:"Levofloxacin", dose:"750 mg IV/PO q24h × 5–14 days", route:"IV/PO",
            note:"First-line for Legionella pneumophila. 7–14 days for Legionella." },
          { name:"OR Azithromycin", dose:"500 mg IV q24h", route:"IV",
            note:"Alternative — well tolerated, preferred in QTc concerns" },
        ],
        notes:"Legionella urine antigen: 70–90% sensitivity for serogroup 1. Positive → treat empirically, also order cultures.",
        deescalation:"Complete 5–7 day course. Shorten if rapid clinical response.",
      },
      {
        name:"PCN Allergy",
        tier:"allergy",
        drugs:[
          { name:"Respiratory fluoroquinolone", dose:"Levofloxacin 750 mg IV/PO q24h OR Moxifloxacin 400 mg PO q24h", route:"IV/PO",
            note:"Covers pneumococcus, atypicals, H. flu — monotherapy for inpatient non-ICU" },
        ],
        notes:"Fluoroquinolone monotherapy is effective for CAP requiring hospitalization in PCN-allergic patients.",
        deescalation:"5 days. Avoid in TB-endemic areas without ruling out TB first.",
      },
    ],
    deescalation_triggers:[
      "Afebrile × 48h (T <38°C)",
      "WBC trending toward normal",
      "Able to tolerate oral intake",
      "SpO2 stable on ≤2L NC",
      "Legionella / pneumococcal urine antigen result available",
      "Sputum / BAL cultures: narrow to susceptibilities",
    ],
  },

  // ── HAP/VAP ────────────────────────────────────────────────────────────────
  {
    id:"hap",
    label:"Pneumonia (HAP/VAP)",
    icon:"🏥",
    color:T.purple,
    desc:"Hospital-acquired or ventilator-associated pneumonia",
    organisms:"Pseudomonas, Klebsiella (ESBL), Acinetobacter, MRSA — drug-resistant organisms likely",
    resistanceFlags:["mrsa","esbl","pseudo"],
    regimens:[
      {
        name:"HAP — No MDR Risk Factors",
        tier:"first",
        drugs:[
          { name:"Piperacillin-tazobactam", dose:"4.5 g IV q6h (extended infusion)", route:"IV",
            note:"Extended infusion over 4h q8h preferred for PK/PD optimization" },
          { name:"OR Cefepime", dose:"2 g IV q8h", route:"IV",
            note:"Alternative — good Pseudomonas coverage, ESBL not covered" },
        ],
        notes:"MDR risk factors: prior IV antibiotics in 90 days, structural lung disease, known colonization.",
        deescalation:"7 days for HAP. De-escalate based on cultures at 48–72h.",
      },
      {
        name:"HAP + MRSA Risk",
        tier:"first",
        drugs:[
          { name:"Vancomycin", dose:"25–30 mg/kg IV load, then AUC-guided", route:"IV",
            note:"AUC/MIC target 400–600" },
          { name:"+ Piperacillin-tazobactam OR Cefepime", dose:"4.5 g q6h OR 2 g q8h", route:"IV",
            note:"Anti-pseudomonal beta-lactam" },
        ],
        notes:"MRSA risk: prior MRSA, IV vancomycin within 90 days, MRSA NARES positive.",
        deescalation:"Discontinue vancomycin at 48–72h if MRSA NARES negative and cultures negative.",
      },
      {
        name:"VAP / High MDR Risk",
        tier:"first",
        drugs:[
          { name:"Vancomycin OR Linezolid", dose:"Vancomycin AUC-guided OR Linezolid 600 mg IV q12h", route:"IV",
            note:"Linezolid preferred for MRSA pneumonia — superior lung penetration" },
          { name:"+ Cefepime OR Piperacillin-tazobactam", dose:"Anti-pseudomonal agent", route:"IV",
            note:"Two anti-pseudomonal agents if prior Pseudomonas or structural lung disease" },
          { name:"± Ciprofloxacin", dose:"400 mg IV q8h", route:"IV",
            note:"Second anti-pseudomonal agent — only if risk factors for resistant Pseudomonas" },
        ],
        notes:"Double Pseudomonal coverage only if risk factors present — not routine. Reassess at 48–72h.",
        deescalation:"De-escalate to one anti-pseudomonal based on cultures. 7–8 day courses equivalent to longer for most.",
      },
    ],
    deescalation_triggers:[
      "MRSA NARES negative at 48h — discontinue MRSA coverage",
      "Cultures: narrow to susceptibilities",
      "Clinical stability: improving P/F ratio, decreasing FiO2",
      "7-day course — equivalent to longer for non-immunocompromised",
      "Serial procalcitonin: decline >80% supports stopping antibiotics",
    ],
  },

  // ── UROSEPSIS ─────────────────────────────────────────────────────────────
  {
    id:"uti",
    label:"Urosepsis / UTI",
    icon:"🫘",
    color:T.teal,
    desc:"Urinary source sepsis — community and healthcare-associated",
    organisms:"E. coli (most common), Klebsiella, Proteus, Enterococcus, Pseudomonas (catheter-associated)",
    resistanceFlags:["esbl"],
    regimens:[
      {
        name:"Community-Onset Urosepsis",
        tier:"first",
        drugs:[
          { name:"Ceftriaxone", dose:"2 g IV q24h", route:"IV",
            note:"First-line for community-acquired urosepsis. Narrow when cultures available." },
        ],
        notes:"Fluoroquinolone resistance is common (30–40% in many communities) — avoid empirically unless confirmed susceptibility.",
        deescalation:"Narrow to oral agent based on cultures. Total duration: 7 days for pyelonephritis, 14 days if bacteremic.",
      },
      {
        name:"ESBL Risk / Healthcare-Associated",
        tier:"first",
        drugs:[
          { name:"Ertapenem", dose:"1 g IV q24h", route:"IV",
            note:"Preferred for ESBL risk — not active vs. Pseudomonas (appropriate if low Pseudo risk)" },
          { name:"OR Meropenem", dose:"1 g IV q8h", route:"IV",
            note:"If Pseudomonas risk: use meropenem or imipenem" },
        ],
        notes:"ESBL risk factors: prior ESBL UTI, recent hospitalization, fluoroquinolone/cephalosporin exposure in 90 days, healthcare-associated.",
        deescalation:"Step down to oral ertapenem alternative or PO TMP-SMX/nitrofurantoin if susceptible at 48h.",
      },
      {
        name:"Catheter-Associated (CAUTI)",
        tier:"first",
        drugs:[
          { name:"Piperacillin-tazobactam", dose:"4.5 g IV q6–8h (extended infusion)", route:"IV",
            note:"Pseudomonas coverage for catheter-associated infection" },
          { name:"OR Cefepime", dose:"2 g IV q8h", route:"IV",
            note:"Alternative anti-pseudomonal" },
        ],
        notes:"Remove or replace Foley catheter — reduces bacterial burden and improves outcomes. Duration: 7 days if rapid response, 10–14 days if delayed.",
        deescalation:"Narrow based on urine/blood cultures. Remove catheter.",
      },
      {
        name:"PCN Allergy",
        tier:"allergy",
        drugs:[
          { name:"Aztreonam", dose:"2 g IV q8h", route:"IV",
            note:"Gram-negative coverage only — covers ESBL if used at appropriate dose. No PCN cross-reactivity." },
          { name:"OR Ciprofloxacin", dose:"400 mg IV q8h (if susceptibility known)", route:"IV",
            note:"Only if local susceptibility data supports — high resistance rates empirically." },
        ],
        notes:"Aztreonam covers Gram-negative organisms without PCN cross-reactivity. Confirm susceptibility before fluoroquinolone use.",
        deescalation:"Narrow at 48–72h. Oral step-down: TMP-SMX, nitrofurantoin (lower UTI only), fosfomycin.",
      },
    ],
    deescalation_triggers:[
      "Urine and blood culture sensitivities available at 48–72h",
      "Afebrile, hemodynamically stable",
      "Tolerating oral intake — transition to oral agent",
      "Total duration: 7 days bacteremic UTI, 14 days complicated pyelonephritis",
      "Remove or replace Foley catheter if CAUTI",
    ],
  },

  // ── SSTI ──────────────────────────────────────────────────────────────────
  {
    id:"ssti",
    label:"Skin & Soft Tissue (SSTI)",
    icon:"🩹",
    color:T.orange,
    desc:"Cellulitis, abscess, necrotizing fasciitis — sepsis from skin source",
    organisms:"Group A Strep, S. aureus (MRSA in abscesses), mixed flora (necrotizing)",
    resistanceFlags:["mrsa"],
    regimens:[
      {
        name:"Non-Purulent Cellulitis",
        tier:"first",
        drugs:[
          { name:"Cefazolin", dose:"2 g IV q8h", route:"IV",
            note:"Beta-hemolytic Strep most common etiology — MRSA coverage not needed" },
          { name:"OR Ceftriaxone", dose:"2 g IV q24h", route:"IV",
            note:"Once-daily dosing for stable outpatient-like patients" },
        ],
        notes:"Non-purulent cellulitis is driven by Strep, not MRSA. Routine MRSA coverage is NOT indicated unless risk factors present.",
        deescalation:"Transition to oral cephalexin or dicloxacillin. Duration: 5–7 days, extend if slow response.",
      },
      {
        name:"Purulent / Abscess (I&D done)",
        tier:"first",
        drugs:[
          { name:"TMP-SMX DS", dose:"1–2 tablets PO BID", route:"PO",
            note:"Superior to beta-lactam monotherapy for purulent SSTI per NEJM 2017" },
          { name:"OR Doxycycline", dose:"100 mg PO BID", route:"PO",
            note:"Alternative if TMP-SMX allergy" },
        ],
        notes:"I&D is primary treatment for abscess. Antibiotics reduce treatment failure and recurrence when added post-I&D.",
        deescalation:"5-day course post-I&D. Review wound at 48–72h.",
      },
      {
        name:"SSTI + Sepsis / MRSA Risk",
        tier:"first",
        drugs:[
          { name:"Vancomycin", dose:"25–30 mg/kg IV loading dose, AUC-guided", route:"IV",
            note:"MRSA coverage for purulent SSTI with systemic illness" },
          { name:"+ Piperacillin-tazobactam", dose:"4.5 g IV q6–8h", route:"IV",
            note:"Add if necrotizing or mixed infection suspected" },
        ],
        notes:"Septic presentation of SSTI warrants MRSA coverage. Consider necrotizing fasciitis — surgical emergency.",
        deescalation:"Narrow to MSSA coverage (oxacillin/cefazolin) if MRSA cultures negative. Oral step-down at 48–72h if improving.",
      },
      {
        name:"Necrotizing Fasciitis",
        tier:"critical",
        drugs:[
          { name:"Vancomycin", dose:"25–30 mg/kg IV load", route:"IV",
            note:"MRSA coverage" },
          { name:"+ Piperacillin-tazobactam", dose:"4.5 g IV q6h", route:"IV",
            note:"Broad Gram-negative and anaerobic coverage" },
          { name:"+ Clindamycin", dose:"900 mg IV q8h", route:"IV",
            note:"Anti-toxin effect — inhibits exotoxin production in streptococcal NF" },
        ],
        notes:"SURGICAL EMERGENCY — antibiotics are adjunctive. Immediate surgical debridement is the primary intervention. LRINEC score ≥6 = high risk. Do not delay OR for imaging.",
        deescalation:"Continue broad coverage until source controlled surgically. Narrow based on intraoperative cultures.",
      },
    ],
    deescalation_triggers:[
      "Culture susceptibilities available at 48–72h",
      "Erythema margins stable or receding",
      "Afebrile, hemodynamically stable",
      "Oral step-down when tolerating intake",
      "Duration: 5–7 days non-purulent, 5 days purulent post-I&D",
    ],
  },

  // ── INTRA-ABDOMINAL ───────────────────────────────────────────────────────
  {
    id:"iai",
    label:"Intra-abdominal",
    icon:"🫀",
    color:T.coral,
    desc:"Peritonitis, cholangitis, cholecystitis, diverticulitis, appendicitis — abdominal sepsis",
    organisms:"E. coli, Klebsiella, Enterococcus, Bacteroides fragilis, other anaerobes",
    resistanceFlags:["esbl","ana"],
    regimens:[
      {
        name:"Community-Acquired Intra-abdominal (Mild–Moderate)",
        tier:"first",
        drugs:[
          { name:"Ceftriaxone", dose:"2 g IV q24h", route:"IV",
            note:"Gram-negative coverage" },
          { name:"+ Metronidazole", dose:"500 mg IV q8h", route:"IV",
            note:"Anaerobic coverage — essential for intra-abdominal infection" },
        ],
        notes:"Most common regimen for community IAI. Avoid cephalosporin monotherapy — anaerobic coverage is mandatory.",
        deescalation:"Duration driven by source control: 4 days if source controlled adequately.",
      },
      {
        name:"Healthcare-Associated / High Severity",
        tier:"first",
        drugs:[
          { name:"Piperacillin-tazobactam", dose:"4.5 g IV q6h (extended infusion)", route:"IV",
            note:"Broad Gram-negative + anaerobe coverage in one agent" },
          { name:"OR Meropenem", dose:"1 g IV q8h", route:"IV",
            note:"If ESBL risk or prior treatment failure" },
        ],
        notes:"High severity: APACHE II ≥15, diffuse peritonitis, delay in source control >24h, malnutrition.",
        deescalation:"Duration: 4–7 days after source control. Longer if incomplete source control.",
      },
      {
        name:"Cholangitis / Biliary Sepsis",
        tier:"first",
        drugs:[
          { name:"Piperacillin-tazobactam", dose:"4.5 g IV q6h", route:"IV",
            note:"First-line for biliary sepsis — covers Enterococcus, Gram-negatives, anaerobes" },
          { name:"OR Ampicillin-sulbactam", dose:"3 g IV q6h", route:"IV",
            note:"Alternative — good Enterococcus coverage" },
        ],
        notes:"Source control: biliary decompression (ERCP or PTC) is essential. Antibiotics bridge to intervention.",
        deescalation:"5–7 days. Oral step-down to amoxicillin-clavulanate or ciprofloxacin + metronidazole.",
      },
      {
        name:"PCN Allergy",
        tier:"allergy",
        drugs:[
          { name:"Ceftriaxone", dose:"2 g IV q24h", route:"IV",
            note:"<2% cross-reactivity with PCN allergy" },
          { name:"+ Metronidazole", dose:"500 mg IV q8h", route:"IV",
            note:"Anaerobic coverage — essential" },
          { name:"OR Aztreonam + Metronidazole", dose:"2 g IV q8h + 500 mg q8h", route:"IV",
            note:"For true PCN anaphylaxis — aztreonam has no PCN cross-reactivity" },
        ],
        notes:"Non-severe PCN allergy: ceftriaxone + metronidazole is safe and effective. Anaphylaxis: aztreonam + metronidazole.",
        deescalation:"Duration based on source control adequacy.",
      },
    ],
    deescalation_triggers:[
      "Source control achieved (surgery, drainage, ERCP)",
      "4-day duration after adequate source control — equivalent to longer per IDSA",
      "Afebrile, tolerating oral, WBC trending down",
      "Cultures: narrow to susceptibilities",
      "Oral step-down: amoxicillin-clavulanate or ciprofloxacin + metronidazole",
    ],
  },

  // ── MENINGITIS ────────────────────────────────────────────────────────────
  {
    id:"meningitis",
    label:"Meningitis",
    icon:"🧠",
    color:T.purple,
    desc:"Bacterial meningitis — empiric treatment before LP results",
    organisms:"S. pneumoniae, N. meningitidis, Listeria (elderly, immunocompromised), GBS (neonates)",
    resistanceFlags:[],
    regimens:[
      {
        name:"Adult Bacterial Meningitis (Empiric)",
        tier:"first",
        drugs:[
          { name:"Ceftriaxone", dose:"2 g IV q12h", route:"IV",
            note:"Covers Strep pneumo, Neisseria meningitidis — must give before CT if LP delayed" },
          { name:"+ Vancomycin", dose:"25–30 mg/kg IV load, then AUC-guided", route:"IV",
            note:"Ceftriaxone-resistant pneumococcus — give empirically until sensitivities known" },
          { name:"+ Ampicillin", dose:"2 g IV q4h", route:"IV",
            note:"Add for age >50 or immunocompromised — covers Listeria monocytogenes" },
          { name:"+ Dexamethasone", dose:"0.15 mg/kg IV q6h × 4 days", route:"IV",
            note:"Give before or with first antibiotic dose — reduces mortality and neurologic sequelae for Strep pneumo" },
        ],
        notes:"DO NOT delay antibiotics for CT or LP. If CT needed first, give antibiotics immediately — before CT. Dexamethasone with first dose of antibiotics or immediately before.",
        deescalation:"Narrow based on CSF Gram stain, cultures, sensitivities. Duration: 10–14 days for Strep pneumo, 7 days Neisseria, 21 days Listeria.",
      },
      {
        name:"PCN Allergy (Meningitis)",
        tier:"allergy",
        drugs:[
          { name:"Meropenem", dose:"2 g IV q8h", route:"IV",
            note:"Reliable CNS penetration. Covers Strep pneumo, Listeria, Gram-negatives." },
          { name:"+ Vancomycin", dose:"25–30 mg/kg IV load", route:"IV",
            note:"Resistant pneumococcus coverage" },
          { name:"+ Dexamethasone", dose:"0.15 mg/kg IV q6h × 4 days", route:"IV",
            note:"Give with first antibiotic dose" },
        ],
        notes:"Meropenem is safe in PCN allergy (no cross-reactivity) and provides excellent CNS penetration. Chloramphenicol is an older alternative rarely used.",
        deescalation:"Narrow based on CSF cultures and sensitivities.",
      },
    ],
    deescalation_triggers:[
      "CSF Gram stain positive: narrow to targeted agent",
      "CSF cultures and sensitivities final: definitive narrowing",
      "Negative cultures at 48–72h: reassess clinical picture",
      "Duration: organism-specific (7 days Neisseria, 10–14 days pneumo, 21 days Listeria)",
    ],
    critical:"DO NOT DELAY ANTIBIOTICS. Give empiric antibiotics BEFORE CT if LP is delayed. Time to antibiotics is the single most important outcome determinant in bacterial meningitis.",
  },

  // ── ENDOCARDITIS ─────────────────────────────────────────────────────────
  {
    id:"endo",
    label:"Endocarditis",
    icon:"❤️",
    color:T.red,
    desc:"Native or prosthetic valve endocarditis — empiric treatment in ED",
    organisms:"S. aureus (MRSA), Viridans strep, Enterococcus, HACEK organisms, CoNS (prosthetic)",
    resistanceFlags:["mrsa","vre"],
    regimens:[
      {
        name:"Native Valve Endocarditis (Empiric)",
        tier:"first",
        drugs:[
          { name:"Vancomycin", dose:"25–30 mg/kg IV loading dose, then AUC-guided", route:"IV",
            note:"Covers MRSA, MSSA, and most Streptococcus species" },
          { name:"+ Ceftriaxone", dose:"2 g IV q24h", route:"IV",
            note:"HACEK organism and Gram-negative coverage. Synergistic with vancomycin for streptococcal IE." },
        ],
        notes:"Obtain ≥3 sets of blood cultures (separate sites, separate times) BEFORE starting antibiotics if hemodynamically stable.",
        deescalation:"Narrow based on blood cultures. If MSSA: switch to nafcillin or oxacillin (superior to vancomycin for MSSA IE). Duration: 4–6 weeks.",
      },
      {
        name:"IVDU-Associated / MRSA Risk",
        tier:"first",
        drugs:[
          { name:"Vancomycin", dose:"25–30 mg/kg IV load, AUC-guided (target AUC/MIC 400–600)", route:"IV",
            note:"Mainstay for MRSA and IVDU-associated IE. Cardiology/ID consult essential." },
        ],
        notes:"Right-sided IE more common in IVDU — tricuspid involvement. Left-sided IE carries higher mortality.",
        deescalation:"Narrow based on blood cultures. ID and cardiology co-management mandatory for IE.",
      },
      {
        name:"Prosthetic Valve Endocarditis",
        tier:"first",
        drugs:[
          { name:"Vancomycin", dose:"25–30 mg/kg IV load, AUC-guided", route:"IV",
            note:"CoNS and MRSA coverage — most common prosthetic valve pathogens" },
          { name:"+ Gentamicin", dose:"1 mg/kg IV q8h (or 3 mg/kg q24h)", route:"IV",
            note:"Synergy — ID consultation for gentamicin use and monitoring" },
          { name:"+ Rifampin", dose:"300 mg PO/IV q8h", route:"PO/IV",
            note:"Biofilm penetration for prosthetic valve. ID consultation required." },
        ],
        notes:"Prosthetic valve IE has very high mortality. Urgent cardiac surgery consultation. ID mandatory. Do not start rifampin until bacteremia cleared (risk of resistance).",
        deescalation:"ID co-management required. Duration 6 weeks minimum for prosthetic valve IE.",
      },
    ],
    deescalation_triggers:[
      "Blood cultures ≥3 sets positive: narrow to targeted agent based on organism",
      "MSSA identified: switch vancomycin to nafcillin/oxacillin — superior efficacy",
      "ID consultation: mandatory for all IE",
      "Duration: 4–6 weeks NVE, 6 weeks PVE",
    ],
    critical:"Obtain blood cultures × 3 before antibiotics if hemodynamically stable. ID and cardiology consultation are mandatory for all endocarditis.",
  },

  // ── NEUTROPENIC FEVER ─────────────────────────────────────────────────────
  {
    id:"neutropenic",
    label:"Neutropenic Fever",
    icon:"🩸",
    color:T.gold,
    desc:"Fever in neutropenic patient — ANC <500 or <1000 with expected decline",
    organisms:"Gram-negative rods (esp. Pseudomonas), S. aureus, coagulase-negative Staph, Candida",
    resistanceFlags:["mrsa","esbl","pseudo","fungal"],
    regimens:[
      {
        name:"Low-Risk Neutropenic Fever (MASCC ≥21)",
        tier:"first",
        drugs:[
          { name:"Ciprofloxacin", dose:"500 mg PO BID", route:"PO",
            note:"Oral fluoroquinolone — outpatient management if MASCC low-risk criteria met" },
          { name:"+ Amoxicillin-clavulanate", dose:"875/125 mg PO BID", route:"PO",
            note:"Add for expanded coverage if not on fluoroquinolone prophylaxis" },
        ],
        notes:"MASCC ≥21 = low risk. Outpatient management acceptable if: solid tumor, no IV catheter, not on inpatient admission, symptoms controlled.",
        deescalation:"Continue until ANC ≥500 × 2 consecutive days and afebrile × 48h.",
      },
      {
        name:"High-Risk Neutropenic Fever (MASCC <21)",
        tier:"first",
        drugs:[
          { name:"Cefepime", dose:"2 g IV q8h", route:"IV",
            note:"Anti-pseudomonal beta-lactam — first-line for febrile neutropenia" },
          { name:"OR Piperacillin-tazobactam", dose:"4.5 g IV q6h", route:"IV",
            note:"Alternative — broader anaerobic coverage" },
          { name:"OR Meropenem", dose:"1 g IV q8h", route:"IV",
            note:"If ESBL risk or prior resistant organism" },
        ],
        notes:"MASCC <21 = high risk. Admission mandatory. Do not use ceftriaxone — inadequate Pseudomonas coverage.",
        deescalation:"Continue until: ANC ≥500 × 2 days AND afebrile × 48h AND cultures negative OR positive and completing appropriate course.",
      },
      {
        name:"Neutropenic Fever + MRSA Risk",
        tier:"first",
        drugs:[
          { name:"Cefepime OR Meropenem", dose:"As above", route:"IV",
            note:"Anti-pseudomonal beta-lactam backbone" },
          { name:"+ Vancomycin", dose:"25–30 mg/kg IV load, AUC-guided", route:"IV",
            note:"Add for: hemodynamic instability, MRSA colonization, skin/catheter infection, mucositis" },
        ],
        notes:"Do not add vancomycin routinely — only with specific indications. Remove if cultures negative at 48–72h.",
        deescalation:"Discontinue vancomycin at 72h if cultures negative and no clinical indication for MRSA coverage.",
      },
      {
        name:"Persistent Fever Day 4–7 (Add Antifungal)",
        tier:"first",
        drugs:[
          { name:"Micafungin", dose:"100 mg IV q24h", route:"IV",
            note:"Echinocandin — preferred for Candida spp. Less drug interactions than azoles." },
          { name:"OR Liposomal Amphotericin B", dose:"3 mg/kg IV q24h", route:"IV",
            note:"Broader mold coverage including Aspergillus — if high mold risk (prolonged neutropenia)" },
        ],
        notes:"Empiric antifungal therapy for persistently febrile neutropenic patients after 4–7 days of antibacterial therapy.",
        deescalation:"Continue antifungal through neutrophil recovery. Stop if galactomannan negative and no clinical evidence of fungal infection.",
      },
    ],
    deescalation_triggers:[
      "ANC recovery: ≥500 cells/mm3 × 2 consecutive days",
      "Afebrile × 48h",
      "Negative cultures at 48–72h: remove vancomycin",
      "Source identified: narrow to targeted therapy",
      "Persistently febrile >4 days: add empiric antifungal",
    ],
  },
];

// ── Surviving Sepsis 1-hour bundle ────────────────────────────────────────────
const SSC_BUNDLE = [
  { id:"lactate",   text:"Lactate measured — repeat if >2 mmol/L",            urgent:true  },
  { id:"cultures",  text:"Blood cultures (×2 sets) obtained BEFORE antibiotics", urgent:true  },
  { id:"abx",       text:"Broad-spectrum antibiotics administered",             urgent:true  },
  { id:"fluids",    text:"30 mL/kg crystalloid bolus started for hypoperfusion", urgent:true  },
  { id:"vaso",      text:"Vasopressors started if MAP <65 after fluids (norepinephrine first-line)", urgent:false },
];

// ── Resistance risk factor checker ────────────────────────────────────────────
const RESISTANCE_FACTORS = {
  mrsa:[
    "Prior MRSA infection or colonization within 1 year",
    "Hospitalization >48h or ICU admission in past 90 days",
    "Residence in nursing home or long-term care",
    "IV drug use (IVDU)",
    "Chronic indwelling catheters or IV lines",
    "Recurrent skin infections / chronic wounds",
  ],
  esbl:[
    "Prior ESBL-producing organism",
    "Recent travel to high-prevalence area (South/Southeast Asia, India)",
    "Fluoroquinolone or cephalosporin use within 90 days",
    "Recent hospitalization or healthcare facility exposure",
    "Recurrent UTIs requiring antibiotics",
    "Solid organ transplant on immunosuppression",
  ],
  pseudo:[
    "Structural lung disease (bronchiectasis, CF)",
    "Chronic corticosteroid use",
    "Prior Pseudomonas infection",
    "Recent broad-spectrum antibiotic exposure",
    "Neutropenia",
    "Hospital-acquired or healthcare-associated infection",
  ],
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function Bullet({ text, color }) {
  return (
    <div style={{ display:"flex", gap:6, alignItems:"flex-start", marginBottom:3 }}>
      <span style={{ color:color||T.teal, fontSize:7, marginTop:3, flexShrink:0 }}>▸</span>
      <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
        color:T.txt3, lineHeight:1.55 }}>{text}</span>
    </div>
  );
}

function Section({ title, icon, accent, open, onToggle, badge, children }) {
  const ac = accent || T.teal;
  return (
    <div style={{ marginBottom:8 }}>
      <button onClick={onToggle}
        style={{ display:"flex", alignItems:"center", gap:8, width:"100%",
          padding:"9px 13px",
          background:open
            ? `linear-gradient(135deg,${ac}12,rgba(8,22,40,0.92))`
            : "rgba(8,22,40,0.65)",
          border:`1px solid ${open ? ac+"55" : "rgba(26,53,85,0.4)"}`,
          borderRadius:open ? "10px 10px 0 0" : 10,
          cursor:"pointer", textAlign:"left", transition:"all .15s" }}>
        <span style={{ fontSize:15 }}>{icon}</span>
        <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
          fontSize:13, color:open ? ac : T.txt3, flex:1 }}>{title}</span>
        {badge && (
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            fontWeight:700, padding:"2px 8px", borderRadius:4,
            background:`${badge.color}18`, border:`1px solid ${badge.color}40`,
            color:badge.color, letterSpacing:1,
            textTransform:"uppercase" }}>{badge.text}</span>
        )}
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color:open ? ac : T.txt4, letterSpacing:1, marginLeft:6 }}>
          {open?"▲":"▼"}
        </span>
      </button>
      {open && (
        <div style={{ padding:"12px 13px",
          background:"rgba(8,22,40,0.65)",
          border:`1px solid ${ac}33`, borderTop:"none",
          borderRadius:"0 0 10px 10px" }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ── Regimen card ──────────────────────────────────────────────────────────────
function RegimenCard({ reg, source, penAllergy }) {
  const [open, setOpen] = useState(reg.tier === "critical");
  const isCritical = reg.tier === "critical";
  const isAllergy  = reg.tier === "allergy";
  const borderColor = isCritical ? T.red : isAllergy ? T.coral : source.color;

  return (
    <div style={{ marginBottom:6, borderRadius:9, overflow:"hidden",
      border:`1px solid ${open ? borderColor+"55" : "rgba(26,53,85,0.4)"}`,
      borderLeft:`3px solid ${borderColor}` }}>
      <button onClick={() => setOpen(p => !p)}
        style={{ display:"flex", alignItems:"center", gap:9, width:"100%",
          padding:"9px 12px", cursor:"pointer", textAlign:"left",
          background:`linear-gradient(135deg,${borderColor}09,rgba(8,22,40,0.9))` }}>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:7 }}>
            <span style={{ fontFamily:"'Playfair Display',serif",
              fontWeight:700, fontSize:13, color:borderColor }}>
              {reg.name}
            </span>
            {isCritical && (
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
                color:T.red, letterSpacing:1, textTransform:"uppercase",
                background:"rgba(255,68,68,0.15)",
                border:"1px solid rgba(255,68,68,0.35)",
                borderRadius:4, padding:"1px 6px" }}>CRITICAL</span>
            )}
            {isAllergy && (
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
                color:T.coral, letterSpacing:1, textTransform:"uppercase",
                background:"rgba(255,107,107,0.12)",
                border:"1px solid rgba(255,107,107,0.3)",
                borderRadius:4, padding:"1px 6px" }}>PCN ALLERGY</span>
            )}
            {penAllergy && !isAllergy && (
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
                color:T.gold, letterSpacing:1,
                background:"rgba(245,200,66,0.1)",
                border:"1px solid rgba(245,200,66,0.3)",
                borderRadius:4, padding:"1px 6px" }}>⚠ PCN ALLERGY</span>
            )}
          </div>
        </div>
        <span style={{ fontSize:9, color:T.txt4 }}>{open?"▲":"▼"}</span>
      </button>

      {open && (
        <div style={{ padding:"10px 12px",
          borderTop:"1px solid rgba(26,53,85,0.3)" }}>
          {/* Drug list */}
          <div style={{ marginBottom:8 }}>
            {reg.drugs.map((d, i) => (
              <div key={i} style={{ display:"flex", alignItems:"flex-start",
                gap:10, padding:"7px 10px", borderRadius:7, marginBottom:4,
                background:`${borderColor}0a`,
                border:`1px solid ${borderColor}22` }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"baseline",
                    gap:7, flexWrap:"wrap" }}>
                    <span style={{ fontFamily:"'Playfair Display',serif",
                      fontWeight:700, fontSize:12, color:borderColor }}>
                      {d.name}
                    </span>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace",
                      fontSize:8, color:T.txt4 }}>{d.route}</span>
                  </div>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace",
                    fontSize:11, fontWeight:700,
                    color:T.txt2, marginTop:2 }}>{d.dose}</div>
                  {d.note && (
                    <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9,
                      color:T.txt4, marginTop:2, lineHeight:1.5 }}>{d.note}</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Notes */}
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
            color:T.txt4, lineHeight:1.6, marginBottom:6 }}>{reg.notes}</div>

          {/* De-escalation note */}
          <div style={{ padding:"6px 9px", borderRadius:6,
            background:"rgba(0,229,192,0.07)",
            border:"1px solid rgba(0,229,192,0.25)" }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:T.teal, letterSpacing:1, textTransform:"uppercase" }}>
              De-escalation: </span>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
              color:T.txt3 }}>{reg.deescalation}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────
export default function SepsisAbxHub({
  embedded = false,
  demo, medications, allergies, pmhSelected,
}) {
  const navigate = useNavigate();

  const [selectedSource, setSelectedSource] = useState(null);
  const [sBundle,    setSBundle]    = useState(true);
  const [sAbx,       setSAbx]       = useState(true);
  const [sDeescal,   setSDeescal]   = useState(false);
  const [sResistance,setSResistance]= useState(false);
  const [bundleCheck,setBundleCheck]= useState({});
  const [resistDetail,setResistDetail]=useState(null);

  // Penicillin allergy detection
  const penAllergy = useMemo(() => {
    const all = (allergies || []).map(a =>
      (typeof a === "string" ? a : a.name || "").toLowerCase()
    );
    return all.some(a =>
      a.includes("penicillin") || a.includes("amoxicillin") ||
      a.includes("ampicillin") || a.includes("augmentin") ||
      a.includes("piperacillin")
    );
  }, [allergies]);

  const source = SOURCES.find(s => s.id === selectedSource);
  const bundleDone = Object.values(bundleCheck).filter(Boolean).length;

  const toggleBundle = useCallback((id) =>
    setBundleCheck(p => ({ ...p, [id]:!p[id] })), []);

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif",
      background:embedded ? "transparent" : T.bg,
      minHeight:embedded ? "auto" : "100vh",
      color:T.txt }}>

      <div style={{ maxWidth:1100, margin:"0 auto",
        padding:embedded ? "0" : "0 16px" }}>

        {/* ── Header ──────────────────────────────────────────────────────── */}
        {!embedded && (
          <div style={{ padding:"18px 0 14px" }}>
            <button onClick={() => navigate("/hub")}
              style={{ marginBottom:10, display:"inline-flex",
                alignItems:"center", gap:7,
                fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600,
                background:"rgba(14,37,68,0.7)",
                border:"1px solid rgba(42,79,122,0.5)",
                borderRadius:8, padding:"5px 14px",
                color:T.txt3, cursor:"pointer" }}>
              ← Back to Hub
            </button>
            <div style={{ display:"flex", alignItems:"center",
              gap:10, marginBottom:8 }}>
              <div style={{ background:"rgba(5,15,30,0.9)",
                border:"1px solid rgba(42,79,122,0.6)",
                borderRadius:10, padding:"5px 12px",
                display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:10, color:T.purple, letterSpacing:3 }}>NOTRYA</span>
                <span style={{ color:T.txt4, fontFamily:"'JetBrains Mono',monospace",
                  fontSize:10 }}>/</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:10, color:T.txt3, letterSpacing:2 }}>SEPSIS ABX</span>
              </div>
              <div style={{ height:1, flex:1,
                background:"linear-gradient(90deg,rgba(0,229,192,0.5),transparent)" }} />
            </div>
            <h1 className="shimmer-text"
              style={{ fontFamily:"'Playfair Display',serif",
                fontSize:"clamp(22px,4vw,38px)", fontWeight:900,
                letterSpacing:-0.5, lineHeight:1.1 }}>
              Sepsis Antibiotic Stewardship
            </h1>
            <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
              color:T.txt4, marginTop:4 }}>
              Source-Specific Regimens · Penicillin Allergy Alternatives · De-escalation Triggers · SSC 1-Hour Bundle
            </p>
          </div>
        )}

        {embedded && (
          <div style={{ display:"flex", alignItems:"center",
            gap:8, marginBottom:12 }}>
            <span style={{ fontFamily:"'Playfair Display',serif",
              fontWeight:700, fontSize:15, color:T.teal }}>
              Sepsis Antibiotic Stewardship
            </span>
          </div>
        )}

        {/* Penicillin allergy banner */}
        {penAllergy && (
          <div style={{ padding:"8px 12px", borderRadius:9, marginBottom:10,
            background:"rgba(255,107,107,0.08)",
            border:"1px solid rgba(255,107,107,0.35)" }}>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
              color:T.coral, lineHeight:1.6 }}>
              <strong>⛔ Penicillin allergy detected</strong> — PCN allergy alternative
              regimens are highlighted. Verify allergy severity: rash vs. anaphylaxis
              changes cross-reactivity risk with cephalosporins (&lt;2% for non-anaphylaxis).
            </div>
          </div>
        )}

        {/* ── 1. SSC 1-Hour Bundle ─────────────────────────────────────────── */}
        <Section title="Surviving Sepsis Campaign — 1-Hour Bundle" icon="⏱️"
          accent={T.red} open={sBundle} onToggle={() => setSBundle(p => !p)}
          badge={{ text:`${bundleDone}/${SSC_BUNDLE.length}`,
            color:bundleDone===SSC_BUNDLE.length ? T.green : T.red }}>
          <div style={{ padding:"7px 10px", borderRadius:7, marginBottom:9,
            background:"rgba(255,68,68,0.07)",
            border:"1px solid rgba(255,68,68,0.25)",
            fontFamily:"'DM Sans',sans-serif", fontSize:11,
            color:T.txt3, lineHeight:1.6 }}>
            All five bundle elements should be initiated within <strong>1 hour</strong> of
            sepsis recognition. Compliance with the full bundle is associated with
            significantly reduced mortality.
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
            {SSC_BUNDLE.map(item => {
              const checked = Boolean(bundleCheck[item.id]);
              return (
                <button key={item.id}
                  onClick={() => toggleBundle(item.id)}
                  style={{ display:"flex", alignItems:"flex-start", gap:8,
                    padding:"8px 10px", borderRadius:8, cursor:"pointer",
                    textAlign:"left", transition:"all .12s",
                    border:`1px solid ${checked
                      ? "rgba(61,255,160,0.35)"
                      : item.urgent ? "rgba(255,68,68,0.25)" : "rgba(26,53,85,0.35)"}`,
                    background:checked
                      ? "rgba(61,255,160,0.06)"
                      : item.urgent ? "rgba(255,68,68,0.04)" : "rgba(8,22,40,0.45)" }}>
                  <div style={{ width:16, height:16, borderRadius:4, flexShrink:0,
                    marginTop:1,
                    border:`2px solid ${checked ? T.green : item.urgent ? T.coral : "rgba(42,79,122,0.5)"}`,
                    background:checked ? T.green : "transparent",
                    display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {checked && <span style={{ color:T.bg, fontSize:8, fontWeight:900 }}>✓</span>}
                  </div>
                  <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11.5,
                    color:checked ? T.txt4 : T.txt,
                    textDecoration:checked ? "line-through" : "none" }}>
                    {item.text}
                  </span>
                </button>
              );
            })}
          </div>
          {bundleDone === SSC_BUNDLE.length && (
            <div style={{ marginTop:8, padding:"7px 11px", borderRadius:7,
              background:"rgba(61,255,160,0.08)",
              border:"1px solid rgba(61,255,160,0.3)",
              fontFamily:"'DM Sans',sans-serif", fontSize:11,
              color:T.green, textAlign:"center" }}>
              ✓ 1-hour bundle complete
            </div>
          )}
        </Section>

        {/* ── 2. Source Selector + Regimens ────────────────────────────────── */}
        <Section title="Source-Specific Antibiotic Selection" icon="💊"
          accent={T.teal} open={sAbx} onToggle={() => setSAbx(p => !p)}>

          {/* Source pill grid */}
          <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:12 }}>
            {SOURCES.map(s => (
              <button key={s.id}
                onClick={() => setSelectedSource(p => p===s.id ? null : s.id)}
                style={{ display:"flex", alignItems:"center", gap:6,
                  fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
                  padding:"6px 14px", borderRadius:20, cursor:"pointer",
                  transition:"all .12s",
                  border:`1px solid ${selectedSource===s.id ? s.color+"77" : s.color+"33"}`,
                  background:selectedSource===s.id ? `${s.color}18` : `${s.color}08`,
                  color:selectedSource===s.id ? s.color : T.txt4 }}>
                <span>{s.icon}</span>
                <span>{s.label}</span>
                {s.resistanceFlags.length > 0 && (
                  <div style={{ display:"flex", gap:2 }}>
                    {s.resistanceFlags.map(f => (
                      <span key={f} style={{ fontFamily:"'JetBrains Mono',monospace",
                        fontSize:6, fontWeight:700,
                        color:RESISTANCE_FLAGS[f]?.color || T.gold,
                        letterSpacing:0.5 }}>
                        {RESISTANCE_FLAGS[f]?.abbr}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Source detail panel */}
          {source && (
            <div className="abx-fade">
              {/* Source header */}
              <div style={{ padding:"10px 13px", borderRadius:9, marginBottom:10,
                background:`${source.color}09`,
                border:`1px solid ${source.color}30` }}>
                <div style={{ display:"flex", alignItems:"center",
                  gap:8, marginBottom:4 }}>
                  <span style={{ fontSize:18 }}>{source.icon}</span>
                  <span style={{ fontFamily:"'Playfair Display',serif",
                    fontWeight:700, fontSize:15, color:source.color }}>
                    {source.label}
                  </span>
                  {source.resistanceFlags.map(f => (
                    <span key={f} style={{ fontFamily:"'JetBrains Mono',monospace",
                      fontSize:8, fontWeight:700,
                      padding:"1px 7px", borderRadius:4,
                      background:`${RESISTANCE_FLAGS[f].color}14`,
                      border:`1px solid ${RESISTANCE_FLAGS[f].color}35`,
                      color:RESISTANCE_FLAGS[f].color,
                      letterSpacing:0.5 }}>
                      {RESISTANCE_FLAGS[f].label}
                    </span>
                  ))}
                </div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                  color:T.txt4 }}>{source.organisms}</div>

                {/* Critical alert */}
                {source.critical && (
                  <div style={{ marginTop:7, padding:"6px 9px", borderRadius:6,
                    background:"rgba(255,68,68,0.1)",
                    border:"1px solid rgba(255,68,68,0.35)",
                    fontFamily:"'DM Sans',sans-serif", fontSize:11,
                    color:T.coral, fontWeight:600, lineHeight:1.5 }}>
                    ⚡ {source.critical}
                  </div>
                )}
              </div>

              {/* Regimens */}
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:T.txt4, letterSpacing:1.5, textTransform:"uppercase",
                marginBottom:7 }}>
                Treatment Regimens — tap to expand
              </div>
              {source.regimens
                .filter(r => !penAllergy || r.tier === "allergy" ||
                  !source.regimens.some(x => x.tier==="allergy"))
                .map((reg, i) => (
                  <RegimenCard key={i} reg={reg} source={source}
                    penAllergy={penAllergy} />
                ))}

              {/* MRSA risk factors */}
              {source.mrsa_risk_factors && (
                <div style={{ marginTop:8, padding:"8px 11px", borderRadius:8,
                  background:"rgba(255,68,68,0.06)",
                  border:"1px solid rgba(255,68,68,0.2)" }}>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                    color:T.red, letterSpacing:1.5, textTransform:"uppercase",
                    marginBottom:6 }}>MRSA Risk Factors — add vancomycin if any present</div>
                  {source.mrsa_risk_factors.map((f, i) => (
                    <Bullet key={i} text={f} color={T.red} />
                  ))}
                </div>
              )}
            </div>
          )}

          {!source && (
            <div style={{ padding:"20px", textAlign:"center",
              fontFamily:"'DM Sans',sans-serif", fontSize:12,
              color:T.txt4 }}>
              Select an infection source above to see regimens
            </div>
          )}
        </Section>

        {/* ── 3. De-escalation Guide ───────────────────────────────────────── */}
        <Section title="De-escalation Principles" icon="↓" accent={T.green}
          open={sDeescal} onToggle={() => setSDeescal(p => !p)}>

          {source && (
            <div style={{ padding:"9px 12px", borderRadius:8, marginBottom:10,
              background:`${source.color}08`,
              border:`1px solid ${source.color}28` }}>
              <div style={{ fontFamily:"'Playfair Display',serif",
                fontWeight:700, fontSize:13, color:source.color, marginBottom:6 }}>
                {source.icon} {source.label} — De-escalation Triggers
              </div>
              {source.deescalation_triggers.map((t, i) => (
                <Bullet key={i} text={t} color={T.green} />
              ))}
            </div>
          )}

          {/* Universal de-escalation principles */}
          {[
            {
              title:"Time to De-escalation",
              color:T.teal,
              items:[
                "Review antibiotic appropriateness at 48–72h — the 'antibiotic timeout'",
                "Most empiric regimens should be narrowed or stopped by day 3",
                "Prolonged broad-spectrum therapy drives C. difficile, resistance, and cost",
                "Culture-negative sepsis: consider stopping antibiotics at 72h if improving",
              ],
            },
            {
              title:"Procalcitonin-Guided Stewardship",
              color:T.blue,
              items:[
                "Serial procalcitonin (PCT) can guide antibiotic duration",
                "PCT decline ≥80% from peak suggests resolution — consider stopping",
                "PCT <0.25 mcg/L: low probability of bacterial infection",
                "Best validated for CAP and ICU sepsis — less evidence for other sources",
              ],
            },
            {
              title:"Oral Step-Down Opportunities",
              color:T.purple,
              items:[
                "IV-to-PO switch when: afebrile ×24–48h, hemodynamically stable, tolerating oral",
                "Many organisms (Strep, MSSA, E. coli) have excellent oral bioavailability",
                "Fluoroquinolones: nearly 100% oral bioavailability — IV is rarely necessary",
                "TMP-SMX, doxycycline, amoxicillin-clavulanate: high oral bioavailability agents",
              ],
            },
            {
              title:"Duration Targets (Evidence-Based)",
              color:T.gold,
              items:[
                "CAP: 5 days if good response",
                "Urosepsis: 7 days bacteremic, 5 days uncomplicated pyelonephritis",
                "Intra-abdominal: 4 days after source control (Sawyer trial)",
                "SSTI: 5–7 days non-purulent, 5 days purulent post-I&D",
                "HAP/VAP: 7 days (equivalent to 8–15 days in trials)",
                "Bacteremia (Gram-negative): 7–14 days based on source and organism",
                "MRSA bacteremia: 14 days minimum; 4–6 weeks if endocarditis/metastatic",
              ],
            },
          ].map((sec, i) => (
            <div key={i} style={{ padding:"9px 12px", borderRadius:8,
              marginBottom:7,
              background:`${sec.color}08`,
              border:`1px solid ${sec.color}25`,
              borderLeft:`3px solid ${sec.color}` }}>
              <div style={{ fontFamily:"'Playfair Display',serif",
                fontWeight:700, fontSize:13, color:sec.color, marginBottom:6 }}>
                {sec.title}
              </div>
              {sec.items.map((item, j) => (
                <Bullet key={j} text={item} color={sec.color} />
              ))}
            </div>
          ))}
        </Section>

        {/* ── 4. Resistance Risk Checker ───────────────────────────────────── */}
        <Section title="Resistance Risk Factor Assessment" icon="🔬"
          accent={T.orange} open={sResistance}
          onToggle={() => setSResistance(p => !p)}>

          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
            {Object.entries(RESISTANCE_FLAGS).slice(0, 3).map(([key, flag]) => (
              <button key={key}
                onClick={() => setResistDetail(p => p===key ? null : key)}
                style={{ display:"flex", alignItems:"center", gap:6,
                  fontFamily:"'DM Sans',sans-serif", fontWeight:600,
                  fontSize:11, padding:"5px 13px", borderRadius:20,
                  cursor:"pointer", transition:"all .12s",
                  border:`1px solid ${resistDetail===key ? flag.color+"77" : flag.color+"33"}`,
                  background:resistDetail===key ? `${flag.color}18` : `${flag.color}08`,
                  color:resistDetail===key ? flag.color : T.txt4 }}>
                {flag.label}
              </button>
            ))}
          </div>

          {resistDetail && RESISTANCE_FACTORS[resistDetail] && (
            <div style={{ padding:"10px 12px", borderRadius:9,
              background:`${RESISTANCE_FLAGS[resistDetail].color}09`,
              border:`1px solid ${RESISTANCE_FLAGS[resistDetail].color}30`,
              marginBottom:8 }}>
              <div style={{ fontFamily:"'Playfair Display',serif",
                fontWeight:700, fontSize:13,
                color:RESISTANCE_FLAGS[resistDetail].color,
                marginBottom:7 }}>
                {RESISTANCE_FLAGS[resistDetail].label} — Risk Factors
              </div>
              {RESISTANCE_FACTORS[resistDetail].map((f, i) => (
                <Bullet key={i} text={f}
                  color={RESISTANCE_FLAGS[resistDetail].color} />
              ))}
              <div style={{ marginTop:7, padding:"6px 9px", borderRadius:6,
                background:"rgba(0,229,192,0.07)",
                border:"1px solid rgba(0,229,192,0.2)",
                fontFamily:"'DM Sans',sans-serif", fontSize:10,
                color:T.teal }}>
                {resistDetail === "mrsa" && "If ≥1 risk factor: add vancomycin to empiric regimen. Remove at 48–72h if cultures negative."}
                {resistDetail === "esbl" && "If ≥1 risk factor: use carbapenem (ertapenem for UTI, meropenem for other sources). Avoid cephalosporins and piperacillin-tazobactam."}
                {resistDetail === "pseudo" && "If ≥1 risk factor: ensure anti-pseudomonal coverage. Consider two anti-pseudomonal agents only if prior Pseudomonas + severely ill."}
              </div>
            </div>
          )}
        </Section>

        {!embedded && (
          <div style={{ textAlign:"center", padding:"24px 0 16px",
            fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, letterSpacing:1.5 }}>
            NOTRYA SEPSIS ABX · IDSA / ATS / SHEA / ASHP GUIDELINES · SURVIVING SEPSIS CAMPAIGN 2021 · LOCAL RESISTANCE PATTERNS MAY VARY
          </div>
        )}
      </div>
    </div>
  );
}