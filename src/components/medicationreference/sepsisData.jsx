export const SEPSIS = {
  criteria: [
    { id: "sirs", label: "SIRS Criteria", badge: "≥2 Required", color: "#f59e0b", params: [{ name: "Temperature", value: ">38.3°C or <36°C" }, { name: "Heart Rate", value: ">90 bpm" }, { name: "Respiratory Rate", value: ">20/min or PaCO₂ <32" }, { name: "WBC", value: ">12k or <4k or >10% bands" }] },
    { id: "sepsis3", label: "Sepsis-3", badge: "SOFA ≥2", color: "#ef4444", desc: "Life-threatening organ dysfunction from dysregulated host response to infection", params: [{ name: "SOFA Score", value: "≥2 from baseline" }, { name: "qSOFA (screening)", value: "RR≥22 + AMS + SBP≤100" }, { name: "Lactate", value: "Obtain for all suspected sepsis" }] },
    { id: "shock", label: "Septic Shock", badge: "MAP<65 + Lactate>2", color: "#b91c1c", desc: "Vasopressor requirement for MAP≥65 AND lactate >2 mmol/L despite fluid resuscitation", params: [{ name: "MAP", value: "<65 mmHg despite resuscitation" }, { name: "Lactate", value: ">2 mmol/L (>4 = high risk)" }, { name: "Vasopressor", value: "Required after adequate crystalloid" }, { name: "Mortality", value: ">40% in-hospital" }] },
    { id: "phoenix", label: "PHOENIX Peds 2024", badge: "Score≥2 + Infection", color: "#8b5cf6", desc: "PHOENIX Score ≥2 with suspected/confirmed infection (JAMA 2024, Schlapbach et al.)", params: [{ name: "Respiratory", value: "SpO₂/FiO₂ <292=1pt; <220 on support=2pts" }, { name: "Cardiovascular", value: "Vasoactive, lactate ≥5, pH <7.15" }, { name: "Coagulation", value: "INR≥1.3, D-dimer≥2, Plt<100k" }, { name: "Neurological", value: "GCS≤10 or AVPU P/U" }] },
  ],
  bundle: [
    { step: 1, action: "Measure lactate level", detail: "Repeat at 2 hr if >2 mmol/L; target ≥10% clearance", priority: "high" },
    { step: 2, action: "Blood cultures ×2 before antibiotics", detail: "Do NOT delay antibiotics >45 min waiting for cultures", priority: "high" },
    { step: 3, action: "Broad-spectrum antibiotics", detail: "Within 1 hour of sepsis/septic shock recognition", priority: "critical" },
    { step: 4, action: "30 mL/kg crystalloid (LR preferred)", detail: "For septic shock or lactate ≥4 mmol/L; reassess after each 500 mL bolus (PLR, PPV)", priority: "critical" },
    { step: 5, action: "Vasopressors if MAP <65 mmHg", detail: "Norepinephrine 1st line; initiate during/after fluids if hypotension persists", priority: "critical" },
  ],
  fluids: {
    adult: {
      initial: "30 mL/kg LR or NS IV wide open",
      preferred: "Lactated Ringer's — SMART/SALT-ED: reduced AKI and 30-day mortality vs NS",
      vasopressor: "MAP <65 despite 30 mL/kg → initiate norepinephrine",
      caution: "Avoid fluid overload; reassess after each bolus; early vasopressors if poor response",
      list: [
        { name: "Lactated Ringer's (LR)", dose: "30 mL/kg", rate: "Wide open × 1 hr then reassess", note: "1st-line; SMART trial preferred" },
        { name: "Normal Saline (0.9% NS)", dose: "30 mL/kg", rate: "Wide open × 1 hr", note: "Risk hyperchloremic acidosis large volumes" },
        { name: "Albumin 5%", dose: "200–300 mL bolus", rate: "30–60 min", note: "Adjunct if crystalloid >4 L (ALBIOS trial)" },
      ],
    },
    pediatric: {
      initial: "10–20 mL/kg over 5–20 min; reassess after each",
      max: "40–60 mL/kg first hour (individualize)",
      caution: "FEAST trial: aggressive bolus ↑ mortality — reassess frequently",
      mapTargets: [
        { age: "0–1 month", sbp: 60, map: 40 }, { age: "1–12 months", sbp: 70, map: 50 }, { age: "1–5 years", sbp: 80, map: 55 },
        { age: "6–12 years", sbp: 90, map: 60 }, { age: ">12 years", sbp: 100, map: 65 },
      ],
    },
  },
  antibiotics: {
    empiric: [
      { severity: "Moderate Sepsis — Community-Acquired", dot: "#f59e0b", primary: "Ceftriaxone 2 g IV q24h", addition: "+ Azithromycin 500 mg IV if pneumonia suspected", notes: "Add metronidazole for abdominal source; add vancomycin if MRSA risk" },
      { severity: "Severe Sepsis / Septic Shock", dot: "#ef4444", primary: "Piperacillin-Tazobactam 4.5 g IV q6–8h (extended infusion preferred)", addition: "+ Vancomycin 25–30 mg/kg IV load if MRSA risk", notes: "Add antifungal if immunocompromised; de-escalate at 48–72 hr with cultures" },
      { severity: "High ESBL Risk / HAP / Recent Antibiotics", dot: "#b91c1c", primary: "Meropenem 1–2 g IV q8h (extended infusion 3 hr preferred)", addition: "+ Vancomycin if MRSA risk", notes: "Reserve carbapenem for true ESBL/MDR; stewardship consultation; reassess 48–72 hr" },
      { severity: "Pseudomonas / Carbapenem-Resistant Risk", dot: "#7c3aed", primary: "Ceftazidime-Avibactam 2.5 g IV q8h (extended 3 hr infusion)", addition: "+ Colistin or Polymyxin B if pan-resistant; consult ID", notes: "For CRE or CRAB; Imipenem-Cilastatin-Relebactam as alternative; ID consult mandatory" },
      { severity: "Healthcare-Associated (HAP/VAP)", dot: "#0891b2", primary: "Cefepime 2 g IV q8h OR Pip-Tazo 4.5 g IV q6h", addition: "+ Vancomycin OR Linezolid 600 mg IV q12h (MRSA coverage)", notes: "Add antipseudomonal if ICU or structural lung disease; de-escalate at 48–72 hr" },
      { severity: "Immunocompromised / Febrile Neutropenia — High Risk", dot: "#059669", primary: "Meropenem 2 g IV q8h (extended infusion)", addition: "+ Micafungin 100 mg IV q24h if fungal risk; + Vancomycin if catheter suspected", notes: "ANC <500; MASCC risk score ≥21 = low risk; initiate within 60 min of triage" },
    ],
    sources: [
      { id: "pulm", source: "Pneumonia (CAP)", icon: "🫁", primary: "Ceftriaxone 1–2 g IV + Azithromycin 500 mg IV", alt: "Levofloxacin 750 mg IV (PCN allergy or atypical)", duration: "5–7 d (CAP); 7–14 d (HCAP)" },
      { id: "pulm", source: "Pneumonia (HAP/VAP)", icon: "🫁", primary: "Cefepime 2 g IV q8h + Vancomycin 15–20 mg/kg q8–12h", alt: "Meropenem + Vancomycin if MDR risk", duration: "7–14 d; de-escalate based on BAL/cultures" },
      { id: "gu", source: "Urosepsis / Pyelonephritis", icon: "🫘", primary: "Ceftriaxone 1–2 g IV q24h", alt: "Pip-Tazo if healthcare-associated or recent UTI", duration: "7–14 days" },
      { id: "gu", source: "Complicated UTI / CAUTI", icon: "🫘", primary: "Cefepime 2 g IV q8h OR Pip-Tazo 4.5 g IV q6h", alt: "Ertapenem 1 g IV q24h if ESBL risk", duration: "7–10 days; 14 d if bacteremia" },
      { id: "gi", source: "Intra-abdominal", icon: "🫃", primary: "Pip-Tazo 4.5 g IV q6h + urgent surgical/IR source control", alt: "Meropenem + Metronidazole (PCN allergy or HAI)", duration: "4–7 d if adequate source control" },
      { id: "gi", source: "Spontaneous Bacterial Peritonitis (SBP)", icon: "🫃", primary: "Cefotaxime 2 g IV q8h OR Ceftriaxone 1–2 g IV q24h", alt: "Pip-Tazo 4.5 g IV q6h if hospital-acquired", duration: "5–7 days; Albumin 1.5 g/kg day 1, 1 g/kg day 3" },
      { id: "ssti", source: "SSTI / Necrotizing Fasciitis", icon: "🩹", primary: "Vancomycin 25–30 mg/kg + Pip-Tazo 4.5 g IV q6h (NF)", alt: "Daptomycin 6–10 mg/kg IV (confirmed MRSA)", duration: "NF: URGENT debridement within hours; until clinically improved" },
      { id: "ssti", source: "Cellulitis / Non-purulent SSTI", icon: "🩹", primary: "Cefazolin 2 g IV q8h OR Ceftriaxone 1 g IV q24h", alt: "Vancomycin if MRSA risk or failure of β-lactam", duration: "5–14 days; oral step-down when improving" },
      { id: "neuro", source: "Bacterial Meningitis", icon: "🧠", primary: "Ceftriaxone 2 g IV q12h + Vancomycin 15 mg/kg q8–12h + Dex 0.15 mg/kg q6h × 4d", alt: "+ Ampicillin 2 g IV q4h if Listeria risk (>50 yr, immunocompromised, pregnancy)", duration: "7–21 days depending on organism" },
      { id: "neuro", source: "Brain Abscess / CNS Infection", icon: "🧠", primary: "Ceftriaxone 2 g IV q12h + Metronidazole 500 mg IV q8h", alt: "+ Vancomycin if post-neurosurgery or hematogenous spread", duration: "6–8 weeks; neurosurgery consultation" },
      { id: "cardio", source: "Infective Endocarditis — Empiric", icon: "❤️", primary: "Vancomycin 25–30 mg/kg IV load + Ceftriaxone 2 g IV q24h", alt: "Daptomycin 8–10 mg/kg IV q24h (right-sided or IVDU)", duration: "4–6 weeks; cardiology + ID consultation mandatory" },
      { id: "cardio", source: "Bacteremia / Line Sepsis", icon: "❤️", primary: "Vancomycin 25–30 mg/kg IV (MRSA coverage) + remove/replace source", alt: "Daptomycin 6–10 mg/kg IV if VRE or Vanc failure", duration: "14 d uncomplicated; 4–6 wk if endocarditis/metastatic" },
      { id: "hem", source: "Febrile Neutropenia", icon: "🩸", primary: "Pip-Tazo 4.5 g IV q6h OR Cefepime 2 g IV q8h", alt: "Meropenem if high-risk Pseudomonas; + Vancomycin if catheter-related", duration: "Until ANC >500 and afebrile ≥48 hr" },
      { id: "bone", source: "Septic Arthritis / Osteomyelitis", icon: "🦴", primary: "Vancomycin 25–30 mg/kg IV + Ceftriaxone 2 g IV q24h", alt: "Daptomycin 6–8 mg/kg IV (MRSA); oral step-down if susceptible", duration: "Joint: 2–4 wk; Bone: 4–6 wk minimum" },
    ],
    pediatric: [
      { age: "Neonate (<1 mo)", primary: "Ampicillin 50 mg/kg IV q8h + Gentamicin 4–5 mg/kg IV q24h", mod: "+ Cefotaxime if meningitis; avoid ceftriaxone in neonates", notes: "GBS, E. coli, Listeria; add Acyclovir 20 mg/kg q8h if HSV suspected" },
      { age: "1–3 months", primary: "Ampicillin 50 mg/kg IV q6h + Cefotaxime 50 mg/kg IV q6h", mod: "Ceftriaxone acceptable if >28 days without hyperbilirubinemia", notes: "Consider viral; Acyclovir if encephalitis suspected" },
      { age: "3 mo – 5 years", primary: "Ceftriaxone 50–100 mg/kg IV q24h", mod: "Meningitis: + Vancomycin 15 mg/kg q6h + Dex 0.15 mg/kg q6h × 4d", notes: "Dexamethasone reduces hearing loss; Vancomycin for PCN-resistant S. pneumoniae" },
      { age: ">5 years", primary: "Ceftriaxone 50–100 mg/kg IV q24h (max 2 g)", mod: "Septic shock: + Pip-Tazo 100 mg/kg q8h + Vancomycin 15 mg/kg q6h", notes: "Cultures before antibiotics without delaying >1 hr" },
    ],
  },
};