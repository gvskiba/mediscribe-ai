/**
 * RapidAssessmentHub.jsx — Notrya Clinical Platform
 * 10-minute workup templates by chief complaint
 */
import { useState, useMemo } from "react";

(() => {
  const ID = "notrya-rapid-fonts";
  if (document.getElementById(ID)) return;
  const l = document.createElement("link");
  l.id = ID; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;900&family=JetBrains+Mono:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
})();

const AC = "#06b6d4";
const T = {
  bg:"#04080f", glass:"rgba(255,255,255,0.06)", glassD:"rgba(255,255,255,0.025)",
  border:"rgba(255,255,255,0.08)", borderHi:"rgba(255,255,255,0.16)",
  shine:"inset 0 1px 0 rgba(255,255,255,0.11)",
  txt:"#f0f4ff", txt2:"#a5b8d8", txt3:"#5a7490", txt4:"#2e4060",
  teal:"#2dd4bf", gold:"#fbbf24", coral:"#f87171",
  blue:"#60a5fa", purple:"#a78bfa", green:"#34d399", orange:"#fb923c",
};

const Gx = {
  panel:(a)=>({background:a?`linear-gradient(135deg,${a}0a,rgba(255,255,255,0.05))`:T.glass,backdropFilter:"blur(32px) saturate(160%)",WebkitBackdropFilter:"blur(32px) saturate(160%)",border:`1px solid ${a?a+"28":T.border}`,borderRadius:18,boxShadow:`0 8px 32px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.12)${a?`,0 0 30px ${a}12`:""}`,position:"relative",overflow:"hidden"}),
  row:(a)=>({background:a?`${a}08`:T.glassD,border:`1px solid ${a?a+"25":T.border}`,borderRadius:11,boxShadow:T.shine}),
  btn:(a,f)=>({background:f?`linear-gradient(135deg,${a}cc,${a}88)`:"rgba(255,255,255,0.06)",border:`1px solid ${f?a+"60":T.borderHi}`,borderRadius:10,boxShadow:f?`0 4px 18px ${a}30,inset 0 1px 0 rgba(255,255,255,0.25)`:T.shine,color:f?"#fff":T.txt2,fontFamily:"'DM Sans',sans-serif",fontWeight:600,cursor:"pointer",transition:"all .2s"}),
  inp:()=>({background:"rgba(255,255,255,0.05)",border:`1px solid ${T.border}`,borderRadius:12,boxShadow:T.shine,color:T.txt,fontFamily:"'DM Sans',sans-serif",fontSize:13,outline:"none",transition:"border-color .2s"}),
};

// ── Workup Template Data ─────────────────────────────────────
const CATEGORIES = ["Cardiac","Neurological","Respiratory","Abdominal","Trauma","Infectious","Other"];

const TEMPLATES = [
  {
    id:"chest_pain", icon:"❤️", title:"Chest Pain", cat:"Cardiac", accent:"#f87171",
    esi:[1,2], badge:"ESI 1–2", critical:"STEMI / Aortic Dissection / PE",
    phases:[
      {
        phase:"0–2 min", label:"Immediate Actions", color:"#f87171",
        steps:[
          {action:"12-lead ECG", detail:"Interpret within 10 min of arrival. STEMI → cath lab activation immediately.", priority:"stat"},
          {action:"IV access × 2 + cardiac monitor", detail:"Large bore antecubital. Continuous O2 sat, BP, HR monitoring.", priority:"stat"},
          {action:"Vital signs + brief HPI", detail:"Onset, quality, radiation, severity (0-10), associated sx, prior cardiac hx.", priority:"stat"},
          {action:"Aspirin 325 mg PO", detail:"If no allergy and ACS suspected. Chew, don't swallow whole.", priority:"stat"},
        ]
      },
      {
        phase:"2–5 min", label:"Diagnostic Workup", color:"#fb923c",
        steps:[
          {action:"hs-Troponin (0h)", detail:"Serial at 1–2h. Delta >5 ng/L = significant rise. HEART score ≤3 + neg = low risk.", priority:"urgent"},
          {action:"CXR (portable if unstable)", detail:"Widened mediastinum → dissection. Pulmonary edema → CHF. PTX.", priority:"urgent"},
          {action:"BMP + CBC + coags + BNP", detail:"Renal function for contrast/anticoagulation dosing. BNP >400 = CHF.", priority:"urgent"},
          {action:"HEART Score calculation", detail:"History · ECG · Age · Risk factors · Troponin. ≤3 = low risk discharge pathway.", priority:"urgent"},
        ]
      },
      {
        phase:"5–10 min", label:"Risk Stratification & Plan", color:"#fbbf24",
        steps:[
          {action:"POCUS (subxiphoid + parasternal)", detail:"Pericardial effusion, RWMA, EF estimate. <2 min at bedside.", priority:"routine"},
          {action:"CTA chest if dissection suspected", detail:"D-dimer <500 = low risk for PE (if Wells ≤4). Tearing/ripping pain + HTN → CTA.", priority:"routine"},
          {action:"Classify: STEMI / NSTEMI / UA / Non-cardiac", detail:"STEMI → cath. NSTEMI/UA → admit. HEART ≤3 neg troponin → discharge pathway.", priority:"routine"},
          {action:"Anticoagulation decision", detail:"UFH for ACS. DOAC for PE. AVOID anticoagulation if dissection not excluded.", priority:"routine"},
        ]
      },
    ],
    pearls:["STEMI equivalent: de Winter T-waves, Wellens, posterior (V7–V9)","Cocaine-associated CP: AVOID beta-blockers — benzodiazepines first","Women, elderly, diabetics: atypical presentations — low threshold for workup","Right-sided leads (V3R/V4R) if inferior STEMI — rule out RV infarct"],
    dispositions:[{label:"STEMI / Unstable",action:"Cath lab activation",color:"#f87171"},{label:"NSTEMI / High HEART",action:"Admit cardiology",color:"#fb923c"},{label:"Low HEART + neg troponin",action:"Discharge + 72h cardiology f/u",color:"#34d399"}],
  },
  {
    id:"sob", icon:"🫁", title:"Shortness of Breath", cat:"Respiratory", accent:"#60a5fa",
    esi:[1,2,3], badge:"ESI 1–3", critical:"Tension PTX / Flash Pulmonary Edema / Status Asthmaticus",
    phases:[
      {
        phase:"0–2 min", label:"Immediate Actions", color:"#f87171",
        steps:[
          {action:"Airway + work of breathing assessment", detail:"Tripod position, accessory muscles, unable to speak full sentences = ESI 1–2.", priority:"stat"},
          {action:"SpO2 + supplemental O2", detail:"Target ≥94% (88–92% in COPD). NC → NRM → HFNC 40–60 L/min → BiPAP.", priority:"stat"},
          {action:"RR + auscultation", detail:"Wheeze = bronchospasm. Silent chest = near-fatal asthma. Crackles = pulmonary edema.", priority:"stat"},
          {action:"Albuterol 2.5 mg neb if wheeze", detail:"Add ipratropium 0.5 mg for COPD/severe asthma. Don't delay for labs.", priority:"stat"},
        ]
      },
      {
        phase:"2–5 min", label:"Diagnostic Workup", color:"#fb923c",
        steps:[
          {action:"Lung + cardiac POCUS", detail:"B-lines bilateral = pulmonary edema. Absent sliding = PTX. RWMA = ACS-related CHF.", priority:"urgent"},
          {action:"CXR", detail:"PTX, pulmonary edema, consolidation, effusion. Portable if O2-dependent.", priority:"urgent"},
          {action:"ABG/VBG + BNP + D-dimer", detail:"PaCO2 rising = respiratory failure. BNP >400 = CHF. D-dimer if Wells ≥2.", priority:"urgent"},
          {action:"12-lead ECG", detail:"RV strain (S1Q3T3, RBBB) → PE. ST changes → ACS. Arrhythmia.", priority:"urgent"},
        ]
      },
      {
        phase:"5–10 min", label:"Diagnosis & Treatment", color:"#fbbf24",
        steps:[
          {action:"Classify: CHF / PE / Pneumonia / Asthma / COPD", detail:"CXR + POCUS + BNP + clinical guides diagnosis. Treat empirically while awaiting results.", priority:"routine"},
          {action:"IV furosemide if CHF", detail:"0.5–1 mg/kg IV. BiPAP for flash pulmonary edema (CPAP 5–10, IPAP 10–15).", priority:"routine"},
          {action:"Steroids if asthma/COPD", detail:"Methylprednisolone 125 mg IV or prednisone 40 mg PO.", priority:"routine"},
          {action:"PE workup vs anticoagulation", detail:"CTA-PE if Wells ≥2 and D-dimer positive. Heparin if high probability while awaiting CT.", priority:"routine"},
        ]
      },
    ],
    pearls:["HFNC reduces intubation in hypoxic respiratory failure — use early","Silent chest in asthma = imminent respiratory arrest — RSI preparation","Anaphylaxis can present as SOB: check for urticaria, BP, recent exposure","ETCO2 waveform: flat = PTX/PE; shark fin = bronchospasm; normal = metabolic"],
    dispositions:[{label:"Severe hypoxia / intubation",action:"ICU",color:"#f87171"},{label:"Moderate SOB, O2 dependent",action:"Admit telemetry",color:"#fb923c"},{label:"Resolved, SpO2 >94% on RA",action:"Discharge with PCP f/u",color:"#34d399"}],
  },
  {
    id:"stroke", icon:"🧠", title:"Stroke / TIA", cat:"Neurological", accent:"#a78bfa",
    esi:[1,2], badge:"ESI 1–2", critical:"LVO / Hemorrhagic Stroke / Basilar Artery Occlusion",
    phases:[
      {
        phase:"0–2 min", label:"Immediate Actions", color:"#f87171",
        steps:[
          {action:"Activate stroke alert", detail:"Last Known Well (LKW) time — document EXACT time. Every minute counts.", priority:"stat"},
          {action:"NIHSS score", detail:"Rapid neurological assessment. NIHSS ≥6 = LVO likely → CTA head/neck.", priority:"stat"},
          {action:"Fingerstick glucose STAT", detail:"Hypoglycemia mimics stroke. Treat if <60 mg/dL before CT.", priority:"stat"},
          {action:"IV access + NPO", detail:"No IM or SC medications if tPA candidate. BP monitoring q5 min.", priority:"stat"},
        ]
      },
      {
        phase:"2–5 min", label:"Imaging", color:"#fb923c",
        steps:[
          {action:"CT head WITHOUT contrast", detail:"Exclude hemorrhage. ASPECTS score ≥6 = EVT candidate. Time door-to-CT <25 min.", priority:"urgent"},
          {action:"CTA head + neck (if LVO suspected)", detail:"NIHSS ≥6, sudden severe headache, or posterior circulation sx → get CTA.", priority:"urgent"},
          {action:"CBC + BMP + coags + INR", detail:"INR for anticoagulation decision. Platelets before tPA/EVT.", priority:"urgent"},
          {action:"BP management", detail:"tPA candidate: keep <185/110 before and 180/105 after. No tPA: permissive HTN ≤220/120.", priority:"urgent"},
        ]
      },
      {
        phase:"5–10 min", label:"Treatment Decision", color:"#fbbf24",
        steps:[
          {action:"tPA eligibility checklist", detail:"0–4.5h from LKW. No hemorrhage. BP <185/110. No contraindications. Dose: 0.9 mg/kg IV max 90 mg.", priority:"routine"},
          {action:"EVT eligibility (0–24h)", detail:"NIHSS ≥6 + LVO on CTA + ASPECTS ≥6. DAWN/DEFUSE criteria up to 24h.", priority:"routine"},
          {action:"Admit to stroke unit / neuro-ICU", detail:"Telemetry. Head of bed flat if no airway concerns. Aspirin 325 mg at 24h post-tPA.", priority:"routine"},
          {action:"Swallow screen before PO", detail:"Formal dysphagia screen. NPO until cleared. NG tube if needed.", priority:"routine"},
        ]
      },
    ],
    pearls:["Wake-up stroke: MRI DWI/FLAIR mismatch → may be tPA eligible","Basilar artery occlusion: vertical gaze palsy, locked-in syndrome → emergent EVT","Blood glucose >180 worsens outcomes — insulin infusion if needed","Telestroke: initiate early if no in-house neurology"],
    dispositions:[{label:"tPA given / EVT candidate",action:"Neuro-ICU / Stroke unit",color:"#f87171"},{label:"TIA (ABCD2 ≥4)",action:"Admit for rapid workup",color:"#fb923c"},{label:"TIA low risk (ABCD2 ≤3)",action:"Rapid TIA clinic 24–48h",color:"#34d399"}],
  },
  {
    id:"sepsis", icon:"🦠", title:"Sepsis / Septic Shock", cat:"Infectious", accent:"#fbbf24",
    esi:[1,2], badge:"ESI 1–2", critical:"Septic Shock / Meningitis / Necrotizing Fasciitis",
    phases:[
      {
        phase:"0–2 min", label:"Immediate Actions", color:"#f87171",
        steps:[
          {action:"IV access × 2 + fluid bolus", detail:"30 mL/kg LR or NS over 3h. Assess for fluid responsiveness with POCUS.", priority:"stat"},
          {action:"POC lactate", detail:"≥2 = sepsis. ≥4 = high-risk shock. Repeat at 2h — >10% clearance is goal.", priority:"stat"},
          {action:"Blood cultures × 2", detail:"Before antibiotics if possible — do NOT delay abx >45 min for cultures.", priority:"stat"},
          {action:"Sepsis screen: source identification", detail:"UA/culture, CXR, wound exam, skin for purpura/petechiae (meningococcemia).", priority:"stat"},
        ]
      },
      {
        phase:"2–5 min", label:"Diagnostic Workup", color:"#fb923c",
        steps:[
          {action:"CBC + BMP + LFTs + coags + procalcitonin", detail:"SOFA score: Cr, bili, platelets, PaO2/FiO2. Thrombocytopenia + DIC = severe.", priority:"urgent"},
          {action:"Broad-spectrum antibiotics", detail:"Pip-tazo 3.375g q8h + vancomycin (MRSA coverage). Source-direct at 48–72h.", priority:"urgent"},
          {action:"POCUS: IVC + cardiac", detail:"IVC <1cm collapsible = fluid responsive. RWMA = septic cardiomyopathy.", priority:"urgent"},
          {action:"Urinalysis + CXR", detail:"Most common sources: UTI, pneumonia, abdominal. CT abdomen if source unclear.", priority:"urgent"},
        ]
      },
      {
        phase:"5–10 min", label:"Resuscitation Endpoints", color:"#fbbf24",
        steps:[
          {action:"Reassess after initial IVF", detail:"Improved HR, BP, urine output, lactate clearance = adequate response.", priority:"routine"},
          {action:"Norepinephrine if MAP <65 despite IVF", detail:"0.1–0.3 mcg/kg/min. Add vasopressin 0.03 U/min for refractory shock.", priority:"routine"},
          {action:"Foley catheter + urine output monitoring", detail:"Target UO >0.5 mL/kg/hr. Insert after cultures obtained.", priority:"routine"},
          {action:"ICU consult + escalation", detail:"Septic shock → ICU. Meningitis + altered → LP (after CT if indicated) + dexamethasone.", priority:"routine"},
        ]
      },
    ],
    pearls:["Hour-1 bundle: lactate + BCx + IVF + abx + vasopressors prn","Hydrocortisone 200 mg/day for refractory vasopressor-dependent shock","Procalcitonin guides de-escalation — recheck at 48–72h","Meningococcemia: purpura + fever + meningism → immediate penicillin/ceftriaxone"],
    dispositions:[{label:"Septic shock / organ failure",action:"ICU admission",color:"#f87171"},{label:"Sepsis + lactate 2–4",action:"Stepdown / monitored bed",color:"#fb923c"},{label:"Source controlled, lactate <2",action:"Floor admission",color:"#34d399"}],
  },
  {
    id:"altered", icon:"🧩", title:"Altered Mental Status", cat:"Neurological", accent:"#f87171",
    esi:[1,2], badge:"ESI 1–2", critical:"Herniation / Status Epilepticus / Meningitis",
    phases:[
      {
        phase:"0–2 min", label:"Immediate Actions", color:"#f87171",
        steps:[
          {action:"Airway + GCS assessment", detail:"GCS ≤8 = airway protection. Head positioning, suction, jaw thrust prn.", priority:"stat"},
          {action:"Fingerstick glucose STAT", detail:"If <60 mg/dL: thiamine 100 mg IV → D50W 25g IV. Never skip thiamine in malnourished.", priority:"stat"},
          {action:"Naloxone if opioid OD suspected", detail:"0.4–2 mg IV/IM/IN. Titrate to RR ≥12. Infusion for long-acting opioids.", priority:"stat"},
          {action:"IV access + monitor + O2", detail:"Continuous pulse ox, EtCO2 waveform, BP every 5 min.", priority:"stat"},
        ]
      },
      {
        phase:"2–5 min", label:"Diagnostic Workup", color:"#fb923c",
        steps:[
          {action:"AEIOU-TIPS differential", detail:"Alcohol/Acidosis, Epilepsy, Insulin/glucose, Overdose/O2, Uremia/Trauma, Infection, Psychiatric/Poisoning, Structural/Stroke.", priority:"urgent"},
          {action:"BMP + LFTs + ammonia + TSH + CBC", detail:"Hyponatremia, uremia, hepatic encephalopathy, hypothyroidism.", priority:"urgent"},
          {action:"Tox screen + EtOH + APAP/ASA levels", detail:"Serum APAP/ASA in all intentional OD. UDS for opioids/benzos/stimulants.", priority:"urgent"},
          {action:"CT head without contrast", detail:"Any focal deficit, new onset, head trauma, or anticoagulated patient.", priority:"urgent"},
        ]
      },
      {
        phase:"5–10 min", label:"Targeted Treatment", color:"#fbbf24",
        steps:[
          {action:"LP if meningitis suspected", detail:"Fever + AMS + meningism → CT first if focal deficit. Ceftriaxone + dexamethasone BEFORE LP if delay.", priority:"routine"},
          {action:"EEG if non-convulsive status suspected", detail:"Persistent AMS after seizure or subtle motor jerking = NCSE until proven otherwise.", priority:"routine"},
          {action:"Treat hyponatremia if <120 mEq/L", detail:"3% NaCl 100 mL IV × 3 doses. Max correction 8–10 mEq/L per day. Neuro consult.", priority:"routine"},
          {action:"Psychiatry hold if acute psychiatric cause", detail:"After medical clearance. Document capacity assessment.", priority:"routine"},
        ]
      },
    ],
    pearls:["Wernicke's: thiamine BEFORE glucose in any malnourished/alcoholic patient","Hyperammonemia without LFT elevation: consider urea cycle disorder in young adults","Non-convulsive status epilepticus: 5% of ICU patients — EEG required to diagnose","Physostigmine for anticholinergic toxidrome: dry, flushed, delirium, tachycardia"],
    dispositions:[{label:"GCS ≤8 / herniation signs",action:"ICU / emergent neurosurgery",color:"#f87171"},{label:"Metabolic / toxic cause identified",action:"Admit for monitoring + treatment",color:"#fb923c"},{label:"Hypoglycemia corrected, GCS baseline",action:"Observe 4–6h, discharge if stable",color:"#34d399"}],
  },
  {
    id:"abd_pain", icon:"🫃", title:"Acute Abdominal Pain", cat:"Abdominal", accent:"#fbbf24",
    esi:[2,3], badge:"ESI 2–3", critical:"AAA Rupture / Ectopic Pregnancy / Mesenteric Ischemia",
    phases:[
      {
        phase:"0–2 min", label:"Immediate Actions", color:"#f87171",
        steps:[
          {action:"Vital signs + hemodynamic assessment", detail:"Hypotension + abdominal pain = AAA/ectopic/perforation until proven otherwise → ESI 1.", priority:"stat"},
          {action:"β-hCG STAT (all reproductive-age females)", detail:"Positive → POCUS for intrauterine vs ectopic. Ectopic with instability → OR emergently.", priority:"stat"},
          {action:"Peritoneal exam", detail:"Rigidity + guarding + rebound = peritonitis → surgical emergency. NPO immediately.", priority:"stat"},
          {action:"IV access + analgesia", detail:"Morphine 0.05–0.1 mg/kg + ketorolac 15–30 mg IV + ondansetron 4 mg. Analgesia does NOT mask diagnosis.", priority:"stat"},
        ]
      },
      {
        phase:"2–5 min", label:"Diagnostic Workup", color:"#fb923c",
        steps:[
          {action:"CBC + BMP + lipase + LFTs", detail:"WBC for infection/ischemia. Lipase >3× ULN = pancreatitis. LFTs for biliary.", priority:"urgent"},
          {action:"UA + urine culture", detail:"Hematuria → nephrolithiasis. Pyuria → UTI/pyelonephritis. Urine pregnancy if serum unavailable.", priority:"urgent"},
          {action:"Abdominal POCUS", detail:"AAA > 3cm (screen all >50yo with back/abd pain). Free fluid = hemorrhage or perforation.", priority:"urgent"},
          {action:"Lactate if ischemia suspected", detail:"Elderly + AF + severe abd pain + elevated lactate = mesenteric ischemia until proven otherwise.", priority:"urgent"},
        ]
      },
      {
        phase:"5–10 min", label:"Imaging & Disposition", color:"#fbbf24",
        steps:[
          {action:"CT abdomen/pelvis with IV contrast", detail:"Gold standard. Without contrast for urolithiasis. Oral contrast rarely needed emergently.", priority:"routine"},
          {action:"RUQ US if biliary suspected", detail:"Gallstones, CBD dilation, pericholecystic fluid, sonographic Murphy sign.", priority:"routine"},
          {action:"Surgical consult criteria", detail:"Peritoneal signs, free air, mesenteric ischemia, ectopic, appendicitis, obstruction.", priority:"routine"},
          {action:"Reassess after analgesia", detail:"Persistent pain after IV analgesia often indicates significant pathology. Document serial exams.", priority:"routine"},
        ]
      },
    ],
    pearls:["Elderly patients have attenuated peritoneal findings — low threshold for CT","Obturator/psoas signs: retrocecal appendicitis. Rovsing's sign: appendicitis","Mesenteric ischemia: pain out of proportion to exam — lactate is key","Ovarian torsion: sudden onset unilateral pain, nausea → urgent GYN consult"],
    dispositions:[{label:"Surgical emergency / unstable",action:"OR / IR suite",color:"#f87171"},{label:"Appendicitis / cholecystitis",action:"Admit surgery",color:"#fb923c"},{label:"Urolithiasis / benign cause",action:"Discharge with urology f/u",color:"#34d399"}],
  },
  {
    id:"headache", icon:"🤯", title:"Acute Headache", cat:"Neurological", accent:"#a78bfa",
    esi:[2,3], badge:"ESI 2–3", critical:"SAH / Meningitis / Hypertensive Emergency",
    phases:[
      {
        phase:"0–2 min", label:"Immediate Actions", color:"#f87171",
        steps:[
          {action:"Thunderclap headache screen", detail:"Maximal at onset (<1 min) = SAH until proven otherwise. CT head immediately.", priority:"stat"},
          {action:"BP measurement", detail:"SBP >180 + headache + neurological sx = hypertensive emergency. Do NOT lower BP rapidly.", priority:"stat"},
          {action:"Meningism assessment", detail:"Fever + stiff neck + photophobia = meningitis. Kernig's/Brudzinski's signs.", priority:"stat"},
          {action:"Neurological exam", detail:"Focal deficit → CT/CTA immediately. Cranial nerve palsies = CN III aneurysm.", priority:"stat"},
        ]
      },
      {
        phase:"2–5 min", label:"Diagnostic Workup", color:"#fb923c",
        steps:[
          {action:"CT head WITHOUT contrast", detail:"Sensitivity 98–100% for SAH within 6h of onset. After 6h sensitivity drops — need LP.", priority:"urgent"},
          {action:"LP if CT negative + high SAH suspicion", detail:"Xanthochromia (12h after onset) = SAH. RBC >1000 that doesn't clear = SAH.", priority:"urgent"},
          {action:"CTA head if aneurysm suspected", detail:"NIHSS + sudden-onset + CT negative → CTA or MRA. CN III palsy → CTA emergently.", priority:"urgent"},
          {action:"BMP + CBC + coags", detail:"Hyponatremia from SIADH in SAH. Coags for anticoagulation reversal if needed.", priority:"urgent"},
        ]
      },
      {
        phase:"5–10 min", label:"Treatment & Disposition", color:"#fbbf24",
        steps:[
          {action:"Nimodipine if SAH confirmed", detail:"60 mg PO q4h × 21d. Reduces vasospasm. BP management SBP 120–160.", priority:"routine"},
          {action:"Analgesia for primary headache", detail:"Ketorolac 30 mg IV + prochlorperazine 10 mg IV + diphenhydramine 25 mg IV (migraine cocktail).", priority:"routine"},
          {action:"Dexamethasone + antibiotics if meningitis", detail:"Dexamethasone 0.15 mg/kg IV + ceftriaxone 2g IV BEFORE LP if delay anticipated.", priority:"routine"},
          {action:"Neurosurgery / neurology consult", detail:"SAH → neurosurgery STAT. Meningitis → neurology + ID. Hypertensive emergency → nicardipine gtt.", priority:"routine"},
        ]
      },
    ],
    pearls:["Ottawa Subarachnoid Hemorrhage Rule: 100% sensitive for SAH in alert patients","Sentinel headache ('warning leak'): may precede major SAH by days — take seriously","Post-LP headache (positional) ≠ SAH — improves lying flat, worsens upright","Vertebral artery dissection: neck pain + ipsilateral Horner + contralateral sensory loss"],
    dispositions:[{label:"SAH / Meningitis / Hypertensive emergency",action:"ICU / Neurosurgery",color:"#f87171"},{label:"Thunderclap, workup pending",action:"Admit neurology",color:"#fb923c"},{label:"Primary migraine, resolved",action:"Discharge with headache f/u",color:"#34d399"}],
  },
  {
    id:"syncope", icon:"😵", title:"Syncope", cat:"Cardiac", accent:"#fb923c",
    esi:[2,3], badge:"ESI 2–3", critical:"VT / Complete Heart Block / Pulmonary Embolism",
    phases:[
      {
        phase:"0–2 min", label:"Immediate Actions", color:"#f87171",
        steps:[
          {action:"12-lead ECG immediately", detail:"QTc >500, Brugada, WPW, LBBB, sinus pauses, ischemic changes = high risk.", priority:"stat"},
          {action:"Orthostatic vitals", detail:"BP/HR supine, 1 min standing, 3 min standing. Drop >20 SBP or >10 DBP = orthostatic.", priority:"stat"},
          {action:"Canadian Syncope Risk Score", detail:"Score ≥0 = not low risk. Components: predisposition, trigger, heart disease, troponin, QRS.", priority:"stat"},
          {action:"Fingerstick glucose", detail:"Hypoglycemia is the most common reversible syncope mimic.", priority:"stat"},
        ]
      },
      {
        phase:"2–5 min", label:"Diagnostic Workup", color:"#fb923c",
        steps:[
          {action:"Troponin + BMP", detail:"Troponin elevation in syncope → ACS-related. Hyponatremia/hypoglycemia as cause.", priority:"urgent"},
          {action:"Cardiac monitor + telemetry", detail:"Continuous rhythm monitoring. Paroxysmal AF, sinus pauses, VT.", priority:"urgent"},
          {action:"D-dimer / CT-PE if exertional syncope", detail:"Syncope with exertion + tachycardia → consider PE, HOCM, aortic stenosis.", priority:"urgent"},
          {action:"HCT if anemia suspected", detail:"GI bleed causing syncope: melena, hematemesis, anemia on CBC.", priority:"urgent"},
        ]
      },
      {
        phase:"5–10 min", label:"Risk Stratification", color:"#fbbf24",
        steps:[
          {action:"Echocardiogram (urgent if structural)", detail:"HOCM, aortic stenosis, EF <35% — all high-risk structural causes of syncope.", priority:"routine"},
          {action:"SFSR / Canadian Syncope Score", detail:"SFSR: abnormal ECG, Hgb <90, SOB, SBP <90 = high risk → admission.", priority:"routine"},
          {action:"Neurology consult if seizure suspected", detail:"Post-ictal confusion, tongue biting, incontinence, prodrome-free = seizure.", priority:"routine"},
          {action:"Reassurance for vasovagal if criteria met", detail:"Classic prodrome (nausea/diaphoresis/warmth), trigger, young healthy patient.", priority:"routine"},
        ]
      },
    ],
    pearls:["Exertional syncope = cardiac until proven otherwise — HOCM, AS, arrhythmia","Brugada syndrome: type 1 pattern provoked by fever — repeat ECG if febrile","Carotid sinus hypersensitivity: elderly + turning head/shaving → carotid massage","Vasovagal recurrence: physical counterpressure maneuvers (leg crossing, hand gripping)"],
    dispositions:[{label:"Cardiac cause / high SFSR score",action:"Admit telemetry / cardiology",color:"#f87171"},{label:"Intermediate risk",action:"6h observation + serial ECG",color:"#fb923c"},{label:"Classic vasovagal, low risk",action:"Discharge with lifestyle counseling",color:"#34d399"}],
  },
  {
    id:"trauma", icon:"🤕", title:"Major Trauma", cat:"Trauma", accent:"#f87171",
    esi:[1,2], badge:"ESI 1–2", critical:"Hemorrhagic Shock / Tension PTX / Spinal Cord Injury",
    phases:[
      {
        phase:"0–2 min", label:"Primary Survey (ABCDE)", color:"#f87171",
        steps:[
          {action:"Airway + C-spine protection", detail:"Jaw thrust if unconscious. Video laryngoscopy RSI if GCS ≤8 or airway threatened.", priority:"stat"},
          {action:"Breathing: PTX / hemothorax", detail:"Tension PTX: absent breath sounds + hypotension + JVD → needle decompression 2nd ICS MCL.", priority:"stat"},
          {action:"Circulation: hemorrhage control", detail:"Direct pressure, tourniquet, pelvic binder. Two large-bore IVs. Activate MTP if criteria met.", priority:"stat"},
          {action:"Disability: GCS + pupils", detail:"GCS <8 = severe TBI. Unequal pupils → herniation → mannitol 1 g/kg or 3% NaCl.", priority:"stat"},
        ]
      },
      {
        phase:"2–5 min", label:"Adjuncts to Primary Survey", color:"#fb923c",
        steps:[
          {action:"FAST exam", detail:"Free fluid: Morison's pouch, splenorenal, pelvic, pericardial. Takes <2 min.", priority:"urgent"},
          {action:"Trauma labs: CBC + BMP + coags + lactate + T&S", detail:"MTP triggers: lactate >5, SBP <90, HR >120, Hgb <7, fibrinogen <150.", priority:"urgent"},
          {action:"CXR + pelvis XR", detail:"Pneumothorax, hemothorax, aortic injury, pelvic fracture (retroperitoneal bleed).", priority:"urgent"},
          {action:"TXA if <3h from injury", detail:"1g IV over 10 min → 1g IV over 8h. Reduces mortality in hemorrhagic shock.", priority:"urgent"},
        ]
      },
      {
        phase:"5–10 min", label:"Secondary Survey & Definitive Care", color:"#fbbf24",
        steps:[
          {action:"Head-to-toe secondary survey", detail:"Systematic exam: scalp, face, neck, chest, abdomen, pelvis, extremities, back/rectal.", priority:"routine"},
          {action:"CT pan-scan if stable", detail:"CT head/C-spine/chest/abd/pelvis. Identifies occult injuries. Only if hemodynamically stable.", priority:"routine"},
          {action:"Damage control vs definitive surgery", detail:"Unstable + positive FAST → OR emergently. Stable → CT then definitive plan.", priority:"routine"},
          {action:"Transfer to Level I/II if needed", detail:"Initiate early if resources insufficient. Don't delay for full workup if unstable.", priority:"routine"},
        ]
      },
    ],
    pearls:["Permissive hypotension SBP 80–90 until hemorrhage controlled (avoid in TBI)","Calcium 1g IV per 4U pRBC — massive transfusion depletes ionized calcium","Massive transfusion ratio 1:1:1 (pRBC:FFP:platelets) reduces coagulopathy","REBOA (Resuscitative Endovascular Balloon Occlusion of Aorta) — adjunct in selected centers"],
    dispositions:[{label:"Hemodynamically unstable",action:"OR immediately / Level I trauma",color:"#f87171"},{label:"Stable with significant injuries",action:"ICU / trauma surgery admission",color:"#fb923c"},{label:"Minor mechanism, normal workup",action:"Discharge with f/u",color:"#34d399"}],
  },
  {
    id:"anaphylaxis", icon:"💉", title:"Anaphylaxis / Allergic Reaction", cat:"Other", accent:"#34d399",
    esi:[1,2], badge:"ESI 1–2", critical:"Anaphylactic Shock / Angioedema with Airway Compromise",
    phases:[
      {
        phase:"0–2 min", label:"Immediate Actions", color:"#f87171",
        steps:[
          {action:"Epinephrine 0.3 mg IM (anterolateral thigh)", detail:"1:1000 concentration. Repeat q5–15 min if no improvement. Never delay for antihistamines.", priority:"stat"},
          {action:"Airway assessment", detail:"Stridor / uvular edema / hoarse voice → imminent airway loss → early intubation. Difficulty increases rapidly.", priority:"stat"},
          {action:"Position: supine + legs elevated", detail:"Prevents distributive shock. Sitting upright if respiratory compromise.", priority:"stat"},
          {action:"High-flow O2 + IV access", detail:"NRM 15 L/min. Large-bore IV. Remove inciting agent (IV contrast/medication infusion).", priority:"stat"},
        ]
      },
      {
        phase:"2–5 min", label:"Secondary Medications", color:"#fb923c",
        steps:[
          {action:"IV fluid bolus 1–2L NS", detail:"Anaphylactic distributive shock. Repeat as needed for hypotension.", priority:"urgent"},
          {action:"Diphenhydramine 25–50 mg IV", detail:"H1 blocker — adjunct only. Does NOT replace epinephrine. Give after epi.", priority:"urgent"},
          {action:"Ranitidine 50 mg IV (or famotidine 20 mg IV)", detail:"H2 blocker — additional antihistamine effect. Adjunct therapy.", priority:"urgent"},
          {action:"Methylprednisolone 125 mg IV", detail:"Prevents biphasic reaction (6–24h later). Slow onset — does NOT help acute phase.", priority:"urgent"},
        ]
      },
      {
        phase:"5–10 min", label:"Refractory Shock & Monitoring", color:"#fbbf24",
        steps:[
          {action:"Norepinephrine or dopamine if refractory", detail:"Epi-resistant shock (especially patients on beta-blockers). Glucagon 1–5 mg IV if BB.", priority:"routine"},
          {action:"Epinephrine infusion if repeated epi doses needed", detail:"0.1–1 mcg/kg/min IV. ICU monitoring required.", priority:"routine"},
          {action:"Biphasic reaction precautions", detail:"Observe 4–8h minimum. 24h if severe, recurrent, or prior biphasic reactions.", priority:"routine"},
          {action:"Discharge with epi auto-injector + allergy referral", detail:"EpiPen prescription. Medic-alert bracelet. Allergy/immunology referral.", priority:"routine"},
        ]
      },
    ],
    pearls:["Epinephrine is the ONLY first-line drug — do NOT use antihistamines alone","Beta-blocker patients may not respond to epinephrine — try glucagon 1–5 mg IV","Refractory anaphylaxis: methylene blue 1.5–2 mg/kg IV has been used","Kounis syndrome: anaphylaxis-induced coronary spasm — ECG for all severe cases"],
    dispositions:[{label:"Airway compromise / shock",action:"ICU",color:"#f87171"},{label:"Moderate reaction, epi given",action:"Observe 4–8h, consider admit",color:"#fb923c"},{label:"Mild, resolved, epi auto-injector given",action:"Discharge with epi Rx + allergy f/u",color:"#34d399"}],
  },
];

const PRIORITY_COLORS = { stat:"#f87171", urgent:"#fb923c", routine:"#34d399" };

// ── Primitives ───────────────────────────────────────────────
function AmbientBg() {
  return (
    <div style={{position:"fixed",inset:0,overflow:"hidden",pointerEvents:"none",zIndex:0}}>
      <div style={{position:"absolute",top:"-10%",left:"5%",width:700,height:700,borderRadius:"50%",background:`radial-gradient(circle,${AC}12 0%,transparent 65%)`,animation:"r0 14s ease-in-out infinite"}}/>
      <div style={{position:"absolute",top:"40%",right:"-8%",width:600,height:600,borderRadius:"50%",background:"radial-gradient(circle,rgba(167,139,250,0.09) 0%,transparent 65%)",animation:"r1 16s ease-in-out infinite"}}/>
      <div style={{position:"absolute",bottom:"-5%",left:"30%",width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(52,211,153,0.07) 0%,transparent 65%)",animation:"r2 12s ease-in-out infinite"}}/>
      <style>{`
        @keyframes r0{0%,100%{transform:scale(1) translate(0,0)}50%{transform:scale(1.12) translate(2%,3%)}}
        @keyframes r1{0%,100%{transform:scale(1.06)}50%{transform:scale(0.92) translate(-2%,2%)}}
        @keyframes r2{0%,100%{transform:scale(0.96)}50%{transform:scale(1.1) translate(2%,-2%)}}
        @keyframes raIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pDot{0%,100%{opacity:1}50%{opacity:.3}}
        *{box-sizing:border-box} input::placeholder{color:rgba(255,255,255,0.2)}
        button{outline:none} ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:4px}
      `}</style>
    </div>
  );
}

function GPanel({ children, style={}, accent=null }) {
  return (
    <div style={{...Gx.panel(accent),...style}}>
      <div style={{position:"absolute",top:0,left:"8%",right:"8%",height:1,background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.16),transparent)",pointerEvents:"none"}}/>
      {children}
    </div>
  );
}

function Chip({ label, color }) {
  const c = color||AC;
  return <span style={{fontSize:9,fontFamily:"'JetBrains Mono',monospace",fontWeight:700,padding:"2px 8px",borderRadius:20,background:`${c}18`,border:`1px solid ${c}35`,color:c,whiteSpace:"nowrap"}}>{label}</span>;
}

function GPill({ label, active, accent, onClick }) {
  const c = accent||AC;
  return <button onClick={onClick} style={{padding:"6px 15px",borderRadius:24,fontSize:12,fontWeight:active?600:400,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",transition:"all .2s",background:active?`${c}18`:"rgba(255,255,255,0.04)",border:`1px solid ${active?c+"45":"rgba(255,255,255,0.09)"}`,color:active?c:T.txt3}}>{label}</button>;
}

function GInput({ value, onChange, placeholder, accent }) {
  return <input value={value} onChange={onChange} placeholder={placeholder}
    style={{...Gx.inp(),padding:"10px 14px",width:"100%"}}
    onFocus={e=>{e.target.style.borderColor=`${accent||AC}55`;}}
    onBlur={e=>{e.target.style.borderColor=T.border;}}/>;
}

// ── Template Detail View ─────────────────────────────────────
function TemplateDetail({ tpl, onBack }) {
  const [phaseExpanded, setPhaseExpanded] = useState(null);

  const storageKey = `notrya_rapid_${tpl.id}_${new Date().toISOString().slice(0,10)}`;
  const [completed, setCompleted] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) || "{}"); } catch { return {}; }
  });

  const persistCompleted = (next) => {
    setCompleted(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
  };

  const toggleStep = (phaseIdx, stepIdx) => {
    const key = `${phaseIdx}-${stepIdx}`;
    const next = {...completed, [key]: !completed[key]};
    persistCompleted(next);
  };
  const phaseComplete = (phaseIdx) => tpl.phases[phaseIdx].steps.every((_,si)=>completed[`${phaseIdx}-${si}`]);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14,animation:"raIn .35s ease"}}>
      {/* Header */}
      <GPanel style={{padding:"20px 24px"}} accent={tpl.accent}>
        <div style={{position:"absolute",top:0,left:0,right:0,height:3,borderRadius:"18px 18px 0 0",background:`linear-gradient(90deg,transparent,${tpl.accent}80,transparent)`}}/>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <button onClick={onBack} style={{...Gx.btn(T.txt3,false),padding:"6px 14px",fontSize:12,flexShrink:0}}>← Back</button>
          <div style={{width:50,height:50,borderRadius:13,background:`${tpl.accent}20`,border:`1px solid ${tpl.accent}35`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{tpl.icon}</div>
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:3}}>
              <span style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:T.txt}}>{tpl.title}</span>
              <Chip label={tpl.badge} color={tpl.accent}/>
              <Chip label={tpl.cat} color={T.txt3}/>
            </div>
            <div style={{fontSize:11,color:T.coral,fontFamily:"'JetBrains Mono',monospace",fontWeight:600}}>⚠ Critical: {tpl.critical}</div>
          </div>
          <div style={{textAlign:"center",padding:"8px 16px",background:`${tpl.accent}12`,border:`1px solid ${tpl.accent}30`,borderRadius:12,flexShrink:0}}>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:22,fontWeight:700,color:tpl.accent}}>10</div>
            <div style={{fontSize:10,color:T.txt3}}>min workup</div>
          </div>
        </div>
      </GPanel>

      {/* Progress indicator */}
      <div style={{display:"flex",gap:4}}>
        {tpl.phases.map((ph,i)=>(
          <div key={i} style={{flex:1,height:4,borderRadius:4,background:phaseComplete(i)?tpl.accent:`${tpl.accent}25`,transition:"background .3s"}}/>
        ))}
      </div>

      {/* Phase Cards */}
      {tpl.phases.map((phase,phaseIdx)=>(
        <GPanel key={phaseIdx} style={{padding:"0"}} accent={phaseComplete(phaseIdx)?tpl.accent:null}>
          <div onClick={()=>setPhaseExpanded(p=>p===phaseIdx?null:phaseIdx)}
            style={{display:"flex",alignItems:"center",gap:12,padding:"16px 20px",cursor:"pointer"}}>
            <div style={{width:52,height:52,borderRadius:12,background:`${phase.color}20`,border:`1px solid ${phase.color}40`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:phase.color,fontWeight:700,lineHeight:1}}>PHASE</div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,color:phase.color,lineHeight:1}}>{phaseIdx+1}</div>
            </div>
            <div style={{flex:1}}>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:phase.color,fontWeight:700,letterSpacing:".08em"}}>{phase.phase}</div>
              <div style={{fontSize:14,fontWeight:700,color:T.txt}}>{phase.label}</div>
              <div style={{fontSize:11,color:T.txt3,marginTop:2}}>
                {phase.steps.filter((_,si)=>completed[`${phaseIdx}-${si}`]).length}/{phase.steps.length} steps complete
              </div>
            </div>
            {phaseComplete(phaseIdx)&&<span style={{fontSize:18}}>✅</span>}
            <span style={{color:T.txt4,fontSize:13}}>{phaseExpanded===phaseIdx?"▲":"▼"}</span>
          </div>
          {(phaseExpanded===phaseIdx||phaseExpanded===null)&&(
            <div style={{padding:"0 20px 16px",borderTop:`1px solid ${T.border}`}}>
              {phase.steps.map((step,stepIdx)=>{
                const key = `${phaseIdx}-${stepIdx}`;
                const done = !!completed[key];
                const pc = PRIORITY_COLORS[step.priority]||T.txt3;
                return (
                  <div key={stepIdx} onClick={()=>toggleStep(phaseIdx,stepIdx)}
                    style={{...Gx.row(done?tpl.accent:null),display:"flex",gap:10,padding:"12px 14px",marginBottom:6,cursor:"pointer",opacity:done?0.7:1,transition:"all .2s"}}
                    onMouseEnter={e=>e.currentTarget.style.background=`${tpl.accent}08`}
                    onMouseLeave={e=>e.currentTarget.style.background=done?`${tpl.accent}08`:T.glassD}>
                    <div style={{width:22,height:22,borderRadius:6,border:`2px solid ${done?tpl.accent:pc+"60"}`,background:done?tpl.accent:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1,transition:"all .2s"}}>
                      {done&&<span style={{fontSize:11,color:"#fff",fontWeight:700}}>✓</span>}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3,flexWrap:"wrap"}}>
                        <span style={{fontSize:13,fontWeight:700,color:done?T.txt3:T.txt,textDecoration:done?"line-through":"none"}}>{step.action}</span>
                        <span style={{fontSize:9,fontFamily:"'JetBrains Mono',monospace",fontWeight:700,padding:"1px 7px",borderRadius:20,background:`${pc}18`,border:`1px solid ${pc}35`,color:pc,textTransform:"uppercase"}}>{step.priority}</span>
                      </div>
                      <div style={{fontSize:11,color:T.txt3,lineHeight:1.5}}>{step.detail}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GPanel>
      ))}

      {/* Pearls */}
      <GPanel style={{padding:"18px 22px"}} accent={T.gold}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
          <span style={{fontSize:20}}>💎</span>
          <span style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,color:T.gold}}>Clinical Pearls</span>
        </div>
        {tpl.pearls.map((p,i)=>(
          <div key={i} style={{display:"flex",gap:8,marginBottom:6}}>
            <span style={{color:T.gold,fontSize:11,flexShrink:0,marginTop:1}}>▸</span>
            <span style={{fontSize:12,color:T.txt2,lineHeight:1.55}}>{p}</span>
          </div>
        ))}
      </GPanel>

      {/* Disposition */}
      <GPanel style={{padding:"18px 22px"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
          <span style={{fontSize:18}}>🚪</span>
          <span style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,color:T.teal}}>Disposition Pathways</span>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:7}}>
          {tpl.dispositions.map((d,i)=>(
            <div key={i} style={{...Gx.row(d.color),display:"flex",alignItems:"center",gap:12,padding:"11px 14px",borderLeft:`3px solid ${d.color}60`}}>
              <div style={{flex:1,fontSize:12,color:T.txt2}}>{d.label}</div>
              <div style={{fontSize:12,fontWeight:700,color:d.color,fontFamily:"'JetBrains Mono',monospace",flexShrink:0}}>→ {d.action}</div>
            </div>
          ))}
        </div>
      </GPanel>

      <div style={{fontSize:10,color:T.txt4,fontFamily:"'JetBrains Mono',monospace",padding:"10px 14px",background:T.glassD,borderRadius:9,border:`1px solid ${T.border}`}}>
        ⚕ Clinical decision support only — adapt to patient-specific context and institutional protocols
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────
export default function RapidAssessmentHub() {
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");

  const filtered = useMemo(()=>
    TEMPLATES.filter(t=>catFilter==="All"||t.cat===catFilter)
      .filter(t=>!search||t.title.toLowerCase().includes(search.toLowerCase())||t.critical.toLowerCase().includes(search.toLowerCase()))
  ,[search,catFilter]);

  if (selected) {
    const tpl = TEMPLATES.find(t=>t.id===selected);
    return (
      <div style={{display:"flex",minHeight:"100vh",background:`linear-gradient(135deg,#04080f 0%,#070f1e 100%)`,fontFamily:"'DM Sans',sans-serif",position:"relative"}}>
        <AmbientBg/>
        <main style={{flex:1,padding:"30px 38px 52px",overflowY:"auto",position:"relative",zIndex:1}}>
          <TemplateDetail tpl={tpl} onBack={()=>setSelected(null)}/>
        </main>
      </div>
    );
  }

  return (
    <div style={{display:"flex",minHeight:"100vh",background:`linear-gradient(135deg,#04080f 0%,#070f1e 100%)`,fontFamily:"'DM Sans',sans-serif",position:"relative"}}>
      <AmbientBg/>
      <main style={{flex:1,padding:"30px 38px 52px",overflowY:"auto",position:"relative",zIndex:1}}>

        {/* Header */}
        <div style={{marginBottom:28,animation:"raIn .4s ease"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
            <div style={{height:1,width:24,background:`${AC}60`,borderRadius:1}}/>
            <span style={{fontSize:10,fontFamily:"'JetBrains Mono',monospace",color:AC,textTransform:"uppercase",letterSpacing:".14em",fontWeight:700}}>Rapid Assessment Hub</span>
            <div style={{flex:1,height:1,background:`linear-gradient(90deg,${AC}30,transparent)`}}/>
            <Chip label={`${TEMPLATES.length} Templates`} color={AC}/>
          </div>
          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(26px,4vw,40px)",fontWeight:900,color:T.txt,margin:"0 0 6px",lineHeight:1.1}}>10-Minute Workup Templates</h1>
          <p style={{fontSize:13,color:T.txt3,margin:0}}>Structured, time-phased assessment guides for the most critical ED chief complaints</p>
        </div>

        {/* Search + Filter */}
        <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:20,flexWrap:"wrap",animation:"raIn .45s ease"}}>
          <GInput value={search} onChange={e=>setSearch(e.target.value)} accent={AC} placeholder={`Search ${TEMPLATES.length} templates…`}/>
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
            {["All",...CATEGORIES].map(cat=><GPill key={cat} label={cat} active={catFilter===cat} accent={AC} onClick={()=>setCatFilter(cat)}/>)}
          </div>
        </div>

        {/* Legend */}
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20,padding:"10px 16px",...Gx.row(null)}}>
          <span style={{fontSize:11,color:T.txt3,marginRight:4}}>Priority:</span>
          {[["STAT","#f87171"],["URGENT","#fb923c"],["ROUTINE","#34d399"]].map(([l,c])=>(
            <span key={l} style={{fontSize:10,fontFamily:"'JetBrains Mono',monospace",fontWeight:700,padding:"2px 8px",borderRadius:20,background:`${c}18`,border:`1px solid ${c}35`,color:c}}>{l}</span>
          ))}
          <span style={{fontSize:11,color:T.txt3,marginLeft:8}}>Click steps to track completion</span>
        </div>

        {/* Template Grid */}
        {filtered.length===0 ? (
          <GPanel style={{padding:"50px 40px",textAlign:"center"}}>
            <div style={{fontSize:36,marginBottom:10,opacity:.3}}>🔍</div>
            <p style={{fontFamily:"'Playfair Display',serif",fontSize:16,color:T.txt2,margin:0}}>No templates found</p>
          </GPanel>
        ) : (
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))",gap:14}}>
            {filtered.map((tpl,i)=>(
              <div key={tpl.id} onClick={()=>setSelected(tpl.id)}
                style={{...Gx.panel(null),padding:"22px",cursor:"pointer",animation:`raIn .5s ease ${i*0.05}s both`,transition:"transform .25s,box-shadow .25s,border .25s"}}
                onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-6px)";e.currentTarget.style.border=`1px solid ${tpl.accent}50`;e.currentTarget.style.boxShadow=`0 20px 48px rgba(0,0,0,0.55),0 0 32px ${tpl.accent}14`;}}
                onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.border=`1px solid ${T.border}`;e.currentTarget.style.boxShadow=`0 8px 32px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.12)`;}}>
                <div style={{position:"absolute",top:0,left:0,right:0,height:3,borderRadius:"18px 18px 0 0",background:`linear-gradient(90deg,${tpl.accent},transparent)`,opacity:.5}}/>
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:12}}>
                  <div style={{width:50,height:50,borderRadius:13,background:`${tpl.accent}20`,border:`1px solid ${tpl.accent}35`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>{tpl.icon}</div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:20,fontWeight:700,color:tpl.accent}}>10<span style={{fontSize:10,color:T.txt3}}> min</span></div>
                    <Chip label={tpl.badge} color={tpl.accent}/>
                  </div>
                </div>
                <div style={{fontSize:9,fontFamily:"'JetBrains Mono',monospace",color:tpl.accent,letterSpacing:".12em",textTransform:"uppercase",marginBottom:3}}>{tpl.cat}</div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:700,color:T.txt,marginBottom:6,lineHeight:1.3}}>{tpl.title}</div>
                <div style={{height:1,background:`linear-gradient(90deg,${tpl.accent}40,transparent)`,marginBottom:8}}/>
                <div style={{display:"flex",gap:4,marginBottom:6}}>
                  {tpl.phases.map((ph,pi)=>(
                    <div key={pi} style={{flex:1,fontSize:9,fontFamily:"'JetBrains Mono',monospace",color:ph.color,background:`${ph.color}12`,border:`1px solid ${ph.color}30`,borderRadius:6,padding:"3px 5px",textAlign:"center",lineHeight:1.3}}>
                      <div style={{fontWeight:700}}>{ph.phase}</div>
                      <div style={{opacity:.7}}>{ph.label.split(" ")[0]}</div>
                    </div>
                  ))}
                </div>
                <div style={{fontSize:10,color:T.coral,fontFamily:"'JetBrains Mono',monospace",fontWeight:600,marginTop:4}}>⚠ {tpl.critical}</div>
                <div style={{marginTop:8,fontSize:11,color:T.txt3,display:"flex",alignItems:"center",gap:4}}>
                  {tpl.phases.reduce((sum,ph)=>sum+ph.steps.length,0)} steps · {tpl.pearls.length} clinical pearls
                  <span style={{marginLeft:"auto",color:tpl.accent,fontWeight:600,fontSize:12}}>Open →</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}