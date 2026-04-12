import { useState, useMemo, useCallback, useRef, useEffect } from "react";

// ── Font + CSS Injection ───────────────────────────────────────────
(() => {
  if (document.getElementById("erx-fonts")) return;
  const l = document.createElement("link"); l.id = "erx-fonts";
  l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "erx-css";
  s.textContent = `
    @keyframes erx-in    { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
    @keyframes erx-chip  { from{opacity:0;transform:scale(.9)} to{opacity:1;transform:scale(1)} }
    @keyframes erx-pulse { 0%,100%{opacity:.6} 50%{opacity:1} }
    @keyframes erx-spin  { to{transform:rotate(360deg)} }
    @keyframes erx-shimmer{ 0%{background-position:-200% center}100%{background-position:200% center} }
    @keyframes erx-slide { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
    .erx-in    { animation: erx-in .3s ease forwards; }
    .erx-chip  { animation: erx-chip .18s cubic-bezier(.34,1.56,.64,1) forwards; }
    .erx-slide { animation: erx-slide .25s ease forwards; }
    .erx-hover { transition: all .16s ease; }
    .erx-hover:hover { transform: translateY(-1px); }
    .erx-shimmer {
      background: linear-gradient(90deg,#e8f0fe 0%,#fff 30%,#3b9eff 55%,#00e5c0 75%,#e8f0fe 100%);
      background-size:250% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;
      background-clip:text;animation:erx-shimmer 5s linear infinite;
    }
    ::-webkit-scrollbar{width:3px;height:3px;}
    ::-webkit-scrollbar-track{background:transparent;}
    ::-webkit-scrollbar-thumb{background:rgba(42,77,114,0.5);border-radius:2px;}
    select option{background:#0e2340;color:#c8ddf0;}
    .drug-row{transition:background .13s,border-color .13s;cursor:pointer;}
    .drug-row:hover{background:rgba(22,45,79,0.55)!important;}
    .rx-pill{transition:all .15s ease;}
    .rx-pill:hover{opacity:.85;}
    input::-webkit-outer-spin-button,input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0;}
  `;
  document.head.appendChild(s);
})();

// ── Tokens ─────────────────────────────────────────────────────────
const T = {
  bg:"#050f1e",panel:"#081628",card:"#0b1e36",up:"#0e2544",
  b:"rgba(26,53,85,0.8)",bhi:"rgba(42,79,122,0.9)",
  txt:"#e8f0fe",txt2:"#8aaccc",txt3:"#4a6a8a",txt4:"#2e4a6a",
  coral:"#ff6b6b",gold:"#f5c842",teal:"#00e5c0",blue:"#3b9eff",
  orange:"#ff9f43",purple:"#9b6dff",green:"#3dffa0",cyan:"#00d4ff",
  rose:"#f472b6",
};

const glass  = (x={}) => ({backdropFilter:"blur(24px) saturate(200%)",WebkitBackdropFilter:"blur(24px) saturate(200%)",background:"rgba(8,22,40,0.78)",border:"1px solid rgba(26,53,85,0.5)",borderRadius:14,...x});
const deep   = (x={}) => ({backdropFilter:"blur(40px) saturate(220%)",WebkitBackdropFilter:"blur(40px) saturate(220%)",background:"rgba(5,15,30,0.9)",border:"1px solid rgba(26,53,85,0.7)",...x});
const inp    = (focus) => ({width:"100%",background:"rgba(14,37,68,0.8)",border:`1px solid ${focus?"rgba(59,158,255,0.6)":"rgba(26,53,85,0.55)"}`,borderRadius:9,padding:"9px 13px",color:T.txt,fontFamily:"DM Sans",fontSize:13,outline:"none",boxSizing:"border-box",transition:"border-color .15s"});

// ── Drug Database ──────────────────────────────────────────────────
const DRUGS = [
  // Antibiotics
  {id:"amox",name:"Amoxicillin",brand:"Amoxil",cls:"Antibiotic",sub:"Penicillin",sch:null,controlled:false,
    forms:["Capsule 250mg","Capsule 500mg","Tablet 875mg","Suspension 125mg/5mL","Suspension 250mg/5mL"],
    sigs:["500mg PO TID × 7–10 days","875mg PO BID × 7–10 days","500mg PO BID × 5–7 days"],
    renal:"CrCl 10–30: q12h; CrCl <10: q24h; HD: dose after HD",
    hepatic:"No adjustment for mild-mod",
    peds:"25–45 mg/kg/day ÷ BID–TID; max 90 mg/kg/day (AOM)",
    interactions:["Warfarin — increased INR","Methotrexate — increased toxicity","Allopurinol — rash risk"],
    allergyFlags:["Penicillin allergy — CONTRAINDICATED","Cephalosporin cross-reactivity (~1%)"],
    maxDose:"3g/day adults",cost:"$",formulary:"Tier 1",note:"First-line for community sinusitis, AOM, mild CAP"},
  {id:"augmentin",name:"Amoxicillin-Clavulanate",brand:"Augmentin",cls:"Antibiotic",sub:"Penicillin + β-Lactamase Inhibitor",sch:null,controlled:false,
    forms:["Tablet 875/125mg","Tablet 500/125mg","ES-600 suspension","XR 2000/125mg"],
    sigs:["875/125mg PO BID × 5–7 days","500/125mg PO TID × 7–10 days"],
    renal:"CrCl <30: avoid 875mg tabs — use 500mg q12h; HD: supplemental dose post-HD",
    hepatic:"Use with caution in hepatic disease — risk of hepatotoxicity (rare)",
    peds:"45mg/kg/day (amox component) ÷ BID × 10 days for AOM",
    interactions:["Warfarin — bleeding risk","Methotrexate — toxicity","Allopurinol — rash"],
    allergyFlags:["Penicillin allergy — CONTRAINDICATED"],
    maxDose:"2g amox component/day",cost:"$$",formulary:"Tier 2",note:"Beta-lactamase coverage; preferred for bite wounds, sinusitis ≥10 days"},
  {id:"azithro",name:"Azithromycin",brand:"Zithromax / Z-Pak",cls:"Antibiotic",sub:"Macrolide",sch:null,controlled:false,
    forms:["Tablet 250mg","Tablet 500mg","Z-Pak (6-pack)","Suspension 100mg/5mL","Suspension 200mg/5mL","IV 500mg"],
    sigs:["Z-Pak: 500mg day 1, then 250mg days 2–5","500mg PO daily × 3 days (sinusitis/CAP)","500mg PO/IV daily × 5 days (CAP)"],
    renal:"No dose adjustment required",
    hepatic:"Avoid in severe hepatic disease (hepatically metabolized)",
    peds:"10mg/kg day 1 (max 500mg), then 5mg/kg days 2–5 (max 250mg)",
    interactions:["QTc-prolonging agents — additive risk","Warfarin — increased INR","Antacids — separate by 2h"],
    allergyFlags:["Macrolide allergy — avoid","Clarithromycin allergy — potential cross-reactivity"],
    maxDose:"2g/course standard courses",cost:"$",formulary:"Tier 1",note:"High macrolide resistance in Streptococcus pneumoniae in many regions — verify local antibiogram"},
  {id:"doxy",name:"Doxycycline",brand:"Vibramycin",cls:"Antibiotic",sub:"Tetracycline",sch:null,controlled:false,
    forms:["Capsule 100mg","Tablet 100mg","Tablet 50mg","IV 100mg"],
    sigs:["100mg PO BID × 7 days (CAP, LYME, skin)","100mg PO BID × 14 days (Lyme disease)","100mg PO BID × 10 days (sinusitis)"],
    renal:"No dose adjustment — not renally cleared (preferred in AKI)",
    hepatic:"Reduce dose in severe hepatic disease",
    peds:"≥8 yr: 2.2mg/kg BID (max 100mg/dose); AVOID < 8 yr — tooth staining",
    interactions:["Antacids/Ca/Mg/Fe — separate by 2–4h (decreased absorption)","Warfarin — increased INR","Isotretinoin — pseudotumor cerebri"],
    allergyFlags:["Tetracycline class allergy"],
    maxDose:"200mg/day",cost:"$",formulary:"Tier 1",note:"Preferred in renal failure; take with full glass of water; avoid lying down ×30 min (esophagitis)"},
  {id:"tmpsmx",name:"Trimethoprim-Sulfamethoxazole",brand:"Bactrim DS",cls:"Antibiotic",sub:"Sulfonamide",sch:null,controlled:false,
    forms:["DS Tablet (800/160mg)","SS Tablet (400/80mg)","Suspension 40/8mg/mL"],
    sigs:["1 DS tab PO BID × 3 days (uncomplicated UTI)","1 DS tab PO BID × 5–7 days (CA-MRSA)","2 DS tabs PO BID × 14 days (PCP)"],
    renal:"CrCl 15–30: reduce dose 50%; CrCl <15: AVOID (hyperkalemia, crystalluria risk)",
    hepatic:"Use with caution — hepatically metabolized",
    peds:"8–12mg/kg/day (TMP component) ÷ BID; avoid neonates < 2 mo",
    interactions:["Warfarin — markedly increased INR (MAJOR)","ACE/ARB — severe hyperkalemia","Methotrexate — toxicity","Phenytoin — elevated levels"],
    allergyFlags:["Sulfa allergy — CONTRAINDICATED","G6PD deficiency — hemolytic anemia risk"],
    maxDose:"2 DS tabs BID",cost:"$",formulary:"Tier 1",note:"AVOID in CrCl <15; check local MRSA susceptibility rates; can falsely elevate creatinine (blocks tubular secretion)"},
  {id:"cipro",name:"Ciprofloxacin",brand:"Cipro",cls:"Antibiotic",sub:"Fluoroquinolone",sch:null,controlled:false,
    forms:["Tablet 250mg","Tablet 500mg","Tablet 750mg","IV 200mg","IV 400mg","Extended-Release 500mg"],
    sigs:["500mg PO BID × 3–5 days (uncomplicated UTI)","500mg PO BID × 5–7 days (pyelonephritis)","750mg PO BID × 7 days (complicated UTI/pyelonephritis)"],
    renal:"CrCl 30–50: max 500mg BID; CrCl <30: 250–500mg q18–24h; HD: 250–500mg q24h (after HD)",
    hepatic:"Reduce in severe hepatic failure",
    peds:"AVOID < 18 yr (cartilage toxicity) — exception: UTI, anthrax, cystic fibrosis (pulm)",
    interactions:["Antacids/Fe/Ca — separate by 2h","Warfarin — major bleeding risk","NSAIDs — seizure risk","Tizanidine — CONTRAINDICATED","QTc agents — additive"],
    allergyFlags:["Fluoroquinolone allergy","Tendon rupture risk — especially ≥ 60 yr, corticosteroid use, renal disease"],
    maxDose:"750mg BID (oral); 400mg q8h (IV)",cost:"$",formulary:"Tier 1",note:"FDA black box: tendon rupture, peripheral neuropathy, CNS effects, aortic dissection. Use only when alternatives inadequate. High E. coli resistance (>20% many US regions)"},
  // Analgesics
  {id:"tramadol",name:"Tramadol",brand:"Ultram",cls:"Analgesic",sub:"Opioid-like (SNRI mechanism)",sch:"IV",controlled:true,
    forms:["Tablet 50mg","Extended-Release 100mg/200mg/300mg"],
    sigs:["50–100mg PO q4–6h PRN (max 400mg/day)","50mg PO q6h PRN (elderly/renal — max 200mg/day)"],
    renal:"CrCl <30: max 200mg/day, q12h interval; avoid ER formulation",
    hepatic:"Severe: max 50mg q12h",
    peds:"NOT recommended < 12 yr; AVOID in adenotonsillectomy patients (ultra-rapid CYP2D6 metabolizers — fatality risk)",
    interactions:["SSRIs/SNRIs — serotonin syndrome MAJOR","MAOIs — CONTRAINDICATED","TCAs — seizures + serotonin syndrome","Opioids — additive CNS/respiratory depression","CYP2D6 inhibitors — increased effect"],
    allergyFlags:["Opioid allergy — cross-reactivity possible","Seizure disorder — lowers seizure threshold"],
    maxDose:"400mg/day; 200mg/day in elderly/renal disease",cost:"$",formulary:"Tier 2",sch:"IV",note:"Schedule IV; lower abuse potential than traditional opioids but NOT opioid-free; serotonin syndrome risk is clinically significant"},
  {id:"oxycodone",name:"Oxycodone",brand:"OxyContin / Percocet",cls:"Analgesic",sub:"Opioid — Mu agonist",sch:"II",controlled:true,
    forms:["Tablet 5mg","Tablet 10mg","Tablet 15mg","Tablet 20mg","ER 10mg","ER 20mg","Oxycodone/APAP 5/325mg"],
    sigs:["5–10mg PO q4–6h PRN severe pain","5mg PO q6h PRN (opioid-naive)","Percocet 1–2 tabs PO q4–6h PRN (max APAP 4g/day)"],
    renal:"Reduce initial dose 33–50% in CrCl <60; avoid if CrCl <30 (active metabolite accumulation)",
    hepatic:"Reduce dose 50%; titrate carefully",
    peds:"0.05–0.1mg/kg PO q4–6h (max 5mg/dose) — specialist guidance required",
    interactions:["CNS depressants — respiratory depression (MAJOR)","Benzodiazepines — FDA black box: fatal respiratory depression","MAOIs — AVOID","CYP3A4 inhibitors — increased oxycodone levels","Naltrexone — precipitates withdrawal"],
    allergyFlags:["Opioid allergy","Respiratory depression — contraindicated","History of opioid use disorder — discuss risks"],
    maxDose:"Start low; no ceiling for cancer pain — titrate to effect",cost:"$$",formulary:"Prior Auth",sch:"II",note:"⚠ SCHEDULE II — PDMP check required; FDA REMS; check morphine milligram equivalents; prescribe naloxone co-prescription for high-dose opioid therapy"},
  {id:"ketorolac",name:"Ketorolac",brand:"Toradol",cls:"Analgesic",sub:"NSAID",sch:null,controlled:false,
    forms:["Tablet 10mg","IM/IV 15mg/mL","IM/IV 30mg/mL","Nasal spray 15.75mg/spray"],
    sigs:["15–30mg IM/IV q6h PRN (max 5 days)","10mg PO q4–6h PRN (max 40mg/day PO — not for IM-to-PO transition)"],
    renal:"CrCl <50: reduce dose 50%; AVOID if CrCl <30 or acute kidney injury",
    hepatic:"Use with caution; reduce dose",
    peds:"0.4–1mg/kg IM (max 30mg/dose); IV: 0.2–0.5mg/kg q6h; AVOID < 2 yr",
    interactions:["ACE inhibitors — hyperkalemia + AKI","Other NSAIDs — avoid combination","Anticoagulants — GI bleeding risk","Lithium — elevated levels","Diuretics — reduced efficacy"],
    allergyFlags:["NSAID/ASA allergy — cross-reactivity","PUD/GI bleed — relative contraindication","CKD — significant risk"],
    maxDose:"120mg/day parenteral; 40mg/day oral; max 5 days total (parenteral + oral combined)",cost:"$",formulary:"Tier 1",note:"Maximum 5-day total course (parenteral + oral); NSAID with potency approaching parenteral opioids; high GI/renal risk with prolonged use"},
  // Cardiovascular
  {id:"lisinopril",name:"Lisinopril",brand:"Prinivil / Zestril",cls:"Cardiovascular",sub:"ACE Inhibitor",sch:null,controlled:false,
    forms:["Tablet 2.5mg","Tablet 5mg","Tablet 10mg","Tablet 20mg","Tablet 40mg","Solution 1mg/mL"],
    sigs:["2.5–5mg PO daily (HTN start)","10–40mg PO daily (HTN maintenance)","2.5–5mg PO daily (HFrEF start — titrate to 20–40mg)","5mg PO daily within 24h of STEMI"],
    renal:"CrCl 10–30: start 2.5mg; CrCl <10/HD: start 2.5mg with careful monitoring",
    hepatic:"No adjustment — not hepatically metabolized",
    peds:"0.07mg/kg once daily (max 5mg/dose) for HTN ≥6 yr",
    interactions:["NSAIDs — reduced efficacy + AKI","Potassium supplements/sparing diuretics — hyperkalemia","Aliskiren — AVOID in DM/CKD","ARBs — avoid combination (dual RAAS)","Lithium — elevated levels"],
    allergyFlags:["ACE inhibitor allergy","Angioedema history — CONTRAINDICATED","Pregnancy (2nd/3rd trimester) — CONTRAINDICATED (fetal toxicity)","Hereditary angioedema"],
    maxDose:"80mg/day",cost:"$",formulary:"Tier 1",note:"Monitor K+ and Cr within 1–2 weeks of initiation; dry cough in 5–20% (switch to ARB); hold if Cr rises >30% from baseline"},
  {id:"metop_succ",name:"Metoprolol Succinate",brand:"Toprol-XL",cls:"Cardiovascular",sub:"Beta-Blocker (β1-selective)",sch:null,controlled:false,
    forms:["Tablet ER 25mg","Tablet ER 50mg","Tablet ER 100mg","Tablet ER 200mg"],
    sigs:["25–50mg PO daily (HTN start)","100–200mg PO daily (HTN maintenance)","12.5–25mg PO daily (HFrEF — titrate slowly)"],
    renal:"No adjustment required",
    hepatic:"Reduce dose in significant hepatic disease (extensive first-pass)",
    peds:"1mg/kg/day ÷ daily–BID (max 200mg/day) — specialist guidance",
    interactions:["Verapamil/Diltiazem — bradycardia/AV block MAJOR","Clonidine — rebound HTN if BB stopped first","CYP2D6 inhibitors (fluoxetine) — markedly elevated levels","Insulin/hypoglycemics — masks hypoglycemia symptoms"],
    allergyFlags:["Beta-blocker allergy","Acute decompensated HF — avoid initiation","2°/3° AV block without pacemaker — CONTRAINDICATED","Severe asthma — use with caution (β1-selective but not β1-exclusive at high doses)"],
    maxDose:"400mg/day",cost:"$",formulary:"Tier 1",note:"Succinate (ER) is preferred over tartrate for HFrEF (mortality benefit); do NOT abruptly discontinue — taper over 1–2 weeks; metoprolol tartrate tabs are IR and different product"},
  {id:"atorva",name:"Atorvastatin",brand:"Lipitor",cls:"Cardiovascular",sub:"HMG-CoA Reductase Inhibitor (Statin)",sch:null,controlled:false,
    forms:["Tablet 10mg","Tablet 20mg","Tablet 40mg","Tablet 80mg"],
    sigs:["10–20mg PO nightly (low-intensity)","40mg PO nightly (moderate-intensity — standard)","80mg PO nightly (high-intensity — post-ACS, DM with ASCVD)"],
    renal:"No dose adjustment (hepatically metabolized)",
    hepatic:"CONTRAINDICATED in active liver disease or unexplained LFT elevations",
    peds:"10–17 yr with familial hypercholesterolemia: 10mg daily — specialist",
    interactions:["Clarithromycin/Erythromycin — increased statin + myopathy risk (CYP3A4)","Cyclosporine — AVOID combination","HIV protease inhibitors — dose limit atorvastatin to 20mg","Niacin (high dose) — myopathy risk","Gemfibrozil — myopathy risk"],
    allergyFlags:["Statin allergy/myopathy history","Active liver disease — CONTRAINDICATED","Unexplained LFT elevation — CONTRAINDICATED","Pregnancy — CONTRAINDICATED"],
    maxDose:"80mg/day",cost:"$",formulary:"Tier 1",note:"Take at any time of day (unlike simvastatin — evening preferred); most potent generic statin; check baseline CK + LFTs; myalgia in 5–10%"},
  // Respiratory
  {id:"albuterol",name:"Albuterol",brand:"ProAir / Ventolin / Proventil",cls:"Respiratory",sub:"SABA — Short-Acting Beta-2 Agonist",sch:null,controlled:false,
    forms:["MDI 90mcg/actuation","Nebulization solution 2.5mg/3mL","Nebulization solution 0.083% (2.5mg/3mL)","Syrup 2mg/5mL","Tablet 2mg","Tablet 4mg"],
    sigs:["1–2 puffs MDI q4–6h PRN (acute bronchospasm)","2–4 puffs MDI q20 min × 3 PRN (acute asthma)","2.5mg neb q20 min × 3 doses PRN (acute asthma — ED)"],
    renal:"No dose adjustment",
    hepatic:"No dose adjustment",
    peds:"MDI: 1–2 puffs q4–6h PRN; Neb: 0.15mg/kg (min 2.5mg) q20min × 3 (acute)",
    interactions:["Non-selective beta-blockers — antagonism","MAOIs/TCAs — increased pressor response","Digoxin — possible decreased levels","Loop diuretics — hypokalemia potentiation"],
    allergyFlags:["Albuterol/levalbuterol allergy"],
    maxDose:"No strict ceiling in acute severe asthma — continuous neb possible",cost:"$$",formulary:"Tier 1",note:"Use spacer/valved holding chamber with MDI; tachycardia and hypokalemia common at high doses; levalbuterol (Xopenex) has no proven clinical advantage"},
  {id:"pred_resp",name:"Prednisone",brand:"Deltasone",cls:"Respiratory / Anti-inflammatory",sub:"Systemic Corticosteroid",sch:null,controlled:false,
    forms:["Tablet 1mg","Tablet 2.5mg","Tablet 5mg","Tablet 10mg","Tablet 20mg","Tablet 50mg","Solution 1mg/mL","Solution 5mg/mL"],
    sigs:["40mg PO daily × 5 days (COPD exacerbation — REDUCE Trial)","40–60mg PO daily × 5 days (asthma exacerbation — no taper if < 7 days)","1mg/kg PO daily (max 60mg) × 3–5 days (pediatric asthma)","0.6mg/kg PO × 1 dose (croup — Bjornson 2004)"],
    renal:"No dose adjustment",
    hepatic:"Use prednisolone instead of prednisone in severe hepatic disease (impaired conversion)",
    peds:"Asthma: 1mg/kg/day (max 60mg) × 3–5 days; Croup: 0.6mg/kg × 1 dose (max 16mg)",
    interactions:["Fluoroquinolones — tendon rupture risk","NSAIDs — GI ulcer risk (additive)","Antidiabetics — hyperglycemia","CYP3A4 inducers (rifampin) — reduced effect","Live vaccines — AVOID"],
    allergyFlags:["Corticosteroid allergy","DM — significant hyperglycemia","Active infections — relative CI"],
    maxDose:"Context-dependent; immunosuppression doses up to 2mg/kg/day",cost:"$",formulary:"Tier 1",note:"Dexamethasone 0.6mg/kg (max 16mg) × 2 days non-inferior for asthma (better adherence). No taper needed for courses < 7 days. Monitor glucose in diabetics."},
  // Psychiatric
  {id:"sertraline",name:"Sertraline",brand:"Zoloft",cls:"Psychiatric",sub:"SSRI",sch:null,controlled:false,
    forms:["Tablet 25mg","Tablet 50mg","Tablet 100mg","Solution 20mg/mL"],
    sigs:["25mg PO daily × 1 week, then 50mg PO daily (MDD)","50mg PO daily (panic disorder — start 25mg if anxious)","50–200mg PO daily (maintenance)"],
    renal:"No dose adjustment required",
    hepatic:"Reduce dose 50% or extend interval in significant hepatic disease",
    peds:"OCD ≥ 6 yr: 25mg daily (start 12.5mg if anxious); MDD ≥ 6 yr off-label",
    interactions:["MAOIs — CONTRAINDICATED; fatal serotonin syndrome (14-day washout)","Linezolid — serotonin syndrome","Tramadol — serotonin syndrome","Warfarin — increased bleeding","Tamoxifen — reduced efficacy (CYP2D6 inhibition)","Triptans — serotonin syndrome (monitor)"],
    allergyFlags:["SSRI class allergy","Hyponatremia history — SIADH risk"],
    maxDose:"200mg/day",cost:"$",formulary:"Tier 1",note:"4–6 weeks for therapeutic effect; taper over ≥ 4 weeks when discontinuing to avoid discontinuation syndrome; weight-neutral compared to other SSRIs; preferred in cardiac patients"},
  {id:"lorazepam",name:"Lorazepam",brand:"Ativan",cls:"Psychiatric",sub:"Benzodiazepine",sch:"IV",controlled:true,
    forms:["Tablet 0.5mg","Tablet 1mg","Tablet 2mg","Solution 2mg/mL","Injection 2mg/mL","Injection 4mg/mL"],
    sigs:["0.5–1mg PO BID–TID PRN anxiety","1–2mg IV/IM q4–6h PRN (acute agitation — hospital)","4mg IV q10–15 min × 2 (status epilepticus — FIRST LINE)"],
    renal:"No dose adjustment (hepatically metabolized)",
    hepatic:"Reduce dose; glucuronidation largely preserved unlike other BZDs",
    peds:"0.05–0.1mg/kg IV/IM (max 4mg/dose) for status epilepticus; 0.025–0.05mg/kg PO for anxiety",
    interactions:["CNS depressants — respiratory depression","Opioids — FDA black box: fatal respiratory depression","Valproic acid — increased lorazepam levels","Clozapine — respiratory arrest (avoid IV combination)"],
    allergyFlags:["Benzodiazepine allergy","Respiratory depression — absolute CI","History of BZD dependence — risk counseling"],
    maxDose:"10mg/day (outpatient anxiety); higher doses in acute seizures/agitation (monitor respiration)",cost:"$",formulary:"Tier 2",sch:"IV",note:"Schedule IV; no active metabolites (preferred in hepatic disease vs diazepam); sublingual route effective; falls risk in elderly (Beers Criteria)"},
  // GI
  {id:"pantoprazole",name:"Pantoprazole",brand:"Protonix",cls:"GI",sub:"Proton Pump Inhibitor",sch:null,controlled:false,
    forms:["Tablet 20mg","Tablet 40mg","IV 40mg","Granules 40mg (enteric coated — NG use)"],
    sigs:["40mg PO daily before breakfast (GERD/peptic ulcer)","40mg PO BID × 14 days (H. pylori — part of triple therapy)","40mg IV q12h (upper GI bleed — post-endoscopy high-dose)","40mg PO daily × 4–8 weeks (erosive esophagitis)"],
    renal:"No dose adjustment",
    hepatic:"Max 40mg/day in severe hepatic disease",
    peds:"≥5 yr: 20mg PO daily (15–39kg); 40mg PO daily (≥40kg) — GERD",
    interactions:["Methotrexate — increased toxicity","Clopidogrel — reduced efficacy (less than omeprazole)","Posaconazole/itraconazole — reduced antifungal absorption","Atazanavir — reduced absorption (AVOID PPI combination)","Mycophenolate — reduced levels"],
    allergyFlags:["PPI class allergy (rare)","Hypomagnesemia — monitor with long-term use"],
    maxDose:"80mg/day (standard); 160mg/day high-dose GI bleed protocol",cost:"$",formulary:"Tier 1",note:"Take 30–60 min before first meal for maximum efficacy; C. diff risk with long-term use; reassess need at ≥ 8 weeks; preferred over omeprazole with clopidogrel (less CYP2C19 inhibition)"},
  {id:"ondansetron",name:"Ondansetron",brand:"Zofran",cls:"GI",sub:"5-HT3 Antagonist (Antiemetic)",sch:null,controlled:false,
    forms:["Tablet 4mg","Tablet 8mg","ODT 4mg","ODT 8mg","Solution 4mg/5mL","IV 2mg/mL"],
    sigs:["4mg PO/ODT/IV q8h PRN nausea","8mg PO/ODT/IV q8h × 1–2 days (CINV)","0.15mg/kg IV q4h × 3 doses (CINV — weight-based)"],
    renal:"No dose adjustment",
    hepatic:"Severe hepatic disease: max 8mg/day",
    peds:"≥4 yr: 0.15mg/kg IV (max 4mg) or 4mg ODT q8h PRN",
    interactions:["QTc-prolonging agents — additive (significant with high IV doses)","Apomorphine — severe hypotension (CONTRAINDICATED)","Tramadol — serotonin syndrome","SSRIs — serotonin syndrome (rare)"],
    allergyFlags:["5-HT3 antagonist allergy","Congenital long QT — monitor ECG"],
    maxDose:"24–32mg/day",cost:"$",formulary:"Tier 1",note:"ODT formulation does not require water — ideal for vomiting patients; do NOT give 32mg IV single dose (QTc risk — FDA warning removed this dosing); IV > PO for peak effect; constipation common with repeated dosing"},
  // Endocrine
  {id:"metformin",name:"Metformin",brand:"Glucophage",cls:"Endocrine",sub:"Biguanide",sch:null,controlled:false,
    forms:["Tablet 500mg","Tablet 850mg","Tablet 1000mg","ER Tablet 500mg","ER Tablet 750mg","ER Tablet 1000mg","Solution 500mg/5mL"],
    sigs:["500mg PO BID with meals (start — reduce GI side effects)","500mg PO TID with meals","1000mg PO BID with meals (standard maintenance)","1500–2000mg/day ÷ BID–TID (therapeutic range)"],
    renal:"CrCl 30–45: continue with caution (no new starts); CrCl <30: CONTRAINDICATED (lactic acidosis); eGFR < 45 restart: contraindicated for new starts",
    hepatic:"AVOID — impaired lactate clearance, lactic acidosis risk",
    peds:"10–17 yr: 500mg PO BID, titrate to 2000mg/day (FDA approved for Type 2 DM)",
    interactions:["IV contrast — hold 48h post-contrast in at-risk patients (eGFR <60)","Alcohol — increased lactic acidosis risk","Cimetidine — increased metformin levels","Carbonic anhydrase inhibitors — lactic acidosis"],
    allergyFlags:["Metformin allergy (rare)","eGFR <30 — CONTRAINDICATED","IV contrast — hold per protocol","Hepatic disease — AVOID"],
    maxDose:"2550mg/day (standard max); ER formulation preferred for GI tolerability",cost:"$",formulary:"Tier 1",note:"Take with meals to minimize GI effects; hold day of and 48h after IV contrast if eGFR <60; B12 deficiency with long-term use — monitor annually; weight-neutral to modest weight loss"},
  // Neuro
  {id:"sumatriptan",name:"Sumatriptan",brand:"Imitrex",cls:"Neurology",sub:"Triptan (5-HT1B/1D Agonist)",sch:null,controlled:false,
    forms:["Tablet 25mg","Tablet 50mg","Tablet 100mg","Nasal spray 5mg","Nasal spray 20mg","SC injection 4mg","SC injection 6mg"],
    sigs:["50–100mg PO at headache onset; may repeat × 1 in 2h (max 200mg/day)","20mg intranasal at onset; may repeat × 1 in 2h","6mg SC at onset; may repeat × 1 in 1h (max 12mg/day)"],
    renal:"No dose adjustment",
    hepatic:"Avoid in severe hepatic disease; max 50mg oral dose (mild-mod)",
    peds:"≥ 12 yr: nasal spray 5–20mg (adolescent migraine); oral data limited",
    interactions:["MAOIs — CONTRAINDICATED (14-day washout)","Ergotamines — vasoconstriction AVOID (24h separation)","SSRIs/SNRIs — serotonin syndrome (weak interaction — monitor)","Linezolid — serotonin syndrome","St. John's Wort — serotonin syndrome"],
    allergyFlags:["Triptan allergy","Coronary artery disease — CONTRAINDICATED","Uncontrolled HTN — CONTRAINDICATED","Hemiplegic/basilar migraine — CONTRAINDICATED","Stroke history — CONTRAINDICATED"],
    maxDose:"200mg/day (oral); 12mg/day (SC); 40mg/day (nasal)",cost:"$$",formulary:"Tier 2",note:"Treat at migraine onset — most effective early; SC route fastest onset; do NOT use > 10 days/month (medication overuse headache); verify no cardiovascular risk before prescribing"},
];

// ── Drug Interaction Matrix ─────────────────────────────────────────
const INTERACTIONS = {
  "warfarin-amox":    {severity:"moderate",msg:"Amoxicillin may increase INR — monitor closely; gut flora disruption reduces Vitamin K synthesis"},
  "warfarin-azithro": {severity:"major",   msg:"Azithromycin significantly increases warfarin effect — INR monitoring within 3–5 days"},
  "warfarin-cipro":   {severity:"major",   msg:"Ciprofloxacin markedly increases INR — monitor INR within 48–72h of starting/stopping"},
  "warfarin-doxy":    {severity:"moderate",msg:"Doxycycline may increase anticoagulant effect — monitor INR"},
  "warfarin-tmpsmx":  {severity:"major",   msg:"TMP-SMX substantially increases INR (CYP2C9 inhibition) — consider dose reduction or alternative antibiotic"},
  "warfarin-sertraline":{severity:"moderate",msg:"SSRI + warfarin: additive bleeding risk (platelet inhibition) — monitor INR"},
  "sertraline-tramadol":{severity:"major",  msg:"Serotonin syndrome risk — tremor, agitation, hyperthermia; avoid combination"},
  "sertraline-lorazepam":{severity:"minor", msg:"Additive CNS depression — caution with sedation"},
  "cipro-nsaid":      {severity:"major",   msg:"Fluoroquinolone + NSAID = significantly increased seizure risk — avoid or use with extreme caution"},
  "oxycodone-lorazepam":{severity:"critical",msg:"FDA Black Box: opioid + benzodiazepine = risk of profound sedation, respiratory depression, coma, death"},
  "metformin-contrast":{severity:"moderate",msg:"IV contrast may precipitate contrast nephropathy and metformin-associated lactic acidosis — hold metformin before/after"},
  "metoprolol-verapamil":{severity:"major", msg:"Combined bradycardia and AV block risk — avoid concurrent use; if needed, monitor closely"},
  "lisinopril-nsaid": {severity:"major",   msg:"NSAIDs blunt ACE inhibitor antihypertensive effect and increase AKI risk — avoid chronic concurrent use"},
};

// ── Allergy Cross-Reference ─────────────────────────────────────────
const ALLERGY_CLASSES = {
  penicillin:   ["amox","augmentin"],
  cephalosporin:["amox","augmentin"],
  sulfonamide:  ["tmpsmx"],
  fluoroquinolone:["cipro"],
  macrolide:    ["azithro"],
  tetracycline: ["doxy"],
  nsaid:        ["ketorolac"],
  opioid:       ["oxycodone","tramadol"],
  benzodiazepine:["lorazepam"],
  statin:       ["atorva"],
  ssri:         ["sertraline"],
  ppi:          ["pantoprazole"],
  "beta-blocker":["metop_succ"],
  "ace-inhibitor":["lisinopril"],
};

// ── Common Condition Templates ─────────────────────────────────────
const CONDITION_SETS = [
  {id:"urti",     icon:"🤧", label:"Upper Respiratory",  color:T.blue,
    drugs:["amox","augmentin","azithro","doxy"],
    note:"Choose based on severity, local resistance, and beta-lactam tolerance"},
  {id:"uti",      icon:"💧", label:"UTI — Uncomplicated", color:T.teal,
    drugs:["tmpsmx","cipro","doxy"],
    note:"TMP-SMX first-line if local resistance < 20%; ciprofloxacin reserve"},
  {id:"pain_acute",icon:"💊", label:"Acute Pain",          color:T.coral,
    drugs:["ketorolac","tramadol","oxycodone"],
    note:"Step-up approach; check PDMP; co-prescribe naloxone with opioids"},
  {id:"cardiac",  icon:"❤️", label:"Cardiac",              color:T.rose,
    drugs:["lisinopril","metop_succ","atorva"],
    note:"Standard cardiac trio: ACEi + BB + statin; check drug interactions"},
  {id:"asthma",   icon:"🫁", label:"Asthma / COPD",        color:T.purple,
    drugs:["albuterol","pred_resp"],
    note:"Albuterol rescue + oral steroids for acute exacerbation"},
  {id:"gi",       icon:"🫃", label:"GI / Nausea",          color:T.orange,
    drugs:["pantoprazole","ondansetron"],
    note:"PPI for acid suppression; ondansetron for nausea management"},
  {id:"psychiatric",icon:"🧠",label:"Psychiatric",          color:T.gold,
    drugs:["sertraline","lorazepam"],
    note:"SSRI + BZD for acute anxiety — taper BZD as SSRI takes effect (4–6 wks)"},
  {id:"dm",       icon:"🩸", label:"Type 2 Diabetes",       color:T.green,
    drugs:["metformin"],
    note:"First-line pharmacotherapy — start with lifestyle, add metformin"},
  {id:"migraine", icon:"⚡", label:"Migraine",              color:T.cyan,
    drugs:["sumatriptan"],
    note:"Treat at onset; verify no cardiovascular contraindications"},
];

// ── Schedule Colors ────────────────────────────────────────────────
const schedCol = s => ({ "II":T.coral, "III":T.orange, "IV":T.gold, "V":T.green })[s] || null;

// ── Formulary Colors ───────────────────────────────────────────────
const formCol = f => ({
  "Tier 1":T.green, "Tier 2":T.teal, "Tier 3":T.gold,
  "Prior Auth":T.coral, "Non-Covered":T.txt4,
})[f] || T.txt3;

// ── Sig Builder Options ────────────────────────────────────────────
const ROUTES   = ["PO","Sublingual","Buccal","IM","IV","IV Push","IV Piggyback","SC","Transdermal","Topical","Inhaled","Nebulized","Intranasal","Rectal","Ophthalmic","Otic","Vaginal","NG tube"];
const FREQS    = ["Once daily","BID","TID","QID","Q4–6h PRN","Q6h PRN","Q8h PRN","Q12h PRN","At bedtime (QHS)","Q4h","Q6h","Q8h","Q12h","Weekly","BID with meals","TID with meals","QID with meals","Before breakfast","Once — single dose"];
const DURATIONS= ["1 day","2 days","3 days","5 days","7 days","10 days","14 days","21 days","30 days","90 days","Until gone","Ongoing / Chronic","As directed","Until follow-up"];
const DISPENSE = ["#10","#14","#20","#21","#28","#30","#42","#60","#90","#100","#120","1 bottle","2 bottles","3 bottles","1 inhaler","2 inhalers","Custom"];

// ══════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ══════════════════════════════════════════════════════════════════

function Badge({ label, color, bg, border }) {
  return (
    <span style={{ fontFamily:"JetBrains Mono",fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:20,background:bg||`${color}18`,border:`1px solid ${border||color+"44"}`,color,whiteSpace:"nowrap",textTransform:"uppercase",letterSpacing:1 }}>
      {label}
    </span>
  );
}

function ScheduleBadge({ sch }) {
  if (!sch) return null;
  const c = schedCol(sch);
  return <Badge label={`CII ${sch}`} color={c} />;
}

function InputField({ label, children, required }) {
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:4 }}>
      <label style={{ fontFamily:"DM Sans",fontSize:10,fontWeight:600,color:T.txt3,textTransform:"uppercase",letterSpacing:".06em" }}>
        {label}{required && <span style={{color:T.coral}}> *</span>}
      </label>
      {children}
    </div>
  );
}

function Select({ value, onChange, options, placeholder }) {
  return (
    <select value={value} onChange={e=>onChange(e.target.value)}
      style={{ ...inp(false),cursor:"pointer" }}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o=><option key={o} value={o}>{o}</option>)}
    </select>
  );
}

// ── Drug Search Panel ──────────────────────────────────────────────
function DrugSearchPanel({ onSelect, selected, favorites, onToggleFav, patientAllergies, activeRx }) {
  const [query, setQuery] = useState("");
  const [cls, setCls] = useState("All");
  const [view, setView] = useState("search"); // search | condition | favorites

  const classes = ["All",...[...new Set(DRUGS.map(d=>d.cls))]];

  const filtered = useMemo(() => {
    if (view === "favorites") return DRUGS.filter(d=>favorites.includes(d.id));
    const q = query.toLowerCase().trim();
    return DRUGS.filter(d => {
      const matchCls = cls === "All" || d.cls === cls;
      const matchQ   = !q || d.name.toLowerCase().includes(q) || d.brand.toLowerCase().includes(q) || d.sub.toLowerCase().includes(q) || d.cls.toLowerCase().includes(q);
      return matchCls && matchQ;
    });
  },[query, cls, view, favorites]);

  const allergyAlert = (drug) => {
    for (const [allergyClass, drugIds] of Object.entries(ALLERGY_CLASSES)) {
      if (drugIds.includes(drug.id) && patientAllergies.some(a => a.toLowerCase().includes(allergyClass.toLowerCase()))) {
        return true;
      }
    }
    return false;
  };

  const interactionAlert = (drug) => {
    return activeRx.some(rxId => {
      const key1 = `${rxId}-${drug.id}`;
      const key2 = `${drug.id}-${rxId}`;
      return INTERACTIONS[key1] || INTERACTIONS[key2];
    });
  };

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:10,height:"100%" }}>
      {/* View Toggle */}
      <div style={{ ...glass({borderRadius:10,padding:"6px"}),display:"flex",gap:4 }}>
        {[["search","🔍 Search"],["condition","🏥 By Condition"],["favorites","⭐ Favorites"]].map(([v,l])=>(
          <button key={v} onClick={()=>setView(v)}
            style={{ flex:1,padding:"6px 8px",borderRadius:7,border:`1px solid ${view===v?"rgba(59,158,255,0.5)":"transparent"}`,background:view===v?"rgba(59,158,255,0.12)":"transparent",color:view===v?T.blue:T.txt3,fontFamily:"DM Sans",fontWeight:600,fontSize:11,cursor:"pointer",transition:"all .15s",whiteSpace:"nowrap" }}>
            {l}
          </button>
        ))}
      </div>

      {view === "condition" ? (
        <div style={{ overflowY:"auto",flex:1,display:"flex",flexDirection:"column",gap:8 }}>
          {CONDITION_SETS.map(cs => (
            <div key={cs.id} style={{ ...glass({borderRadius:12,background:`linear-gradient(135deg,${cs.color}10,rgba(8,22,40,0.8))`}),padding:"12px 14px" }}>
              <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:8 }}>
                <span style={{ fontSize:16 }}>{cs.icon}</span>
                <span style={{ fontFamily:"Playfair Display",fontWeight:700,fontSize:13,color:T.txt }}>{cs.label}</span>
              </div>
              <div style={{ fontFamily:"DM Sans",fontSize:10.5,color:T.txt3,marginBottom:8,lineHeight:1.5 }}>{cs.note}</div>
              <div style={{ display:"flex",flexWrap:"wrap",gap:5 }}>
                {cs.drugs.map(did => {
                  const d = DRUGS.find(x=>x.id===did);
                  if (!d) return null;
                  const isActive = selected?.id === d.id;
                  const hasAllergy = allergyAlert(d);
                  return (
                    <button key={did} onClick={()=>onSelect(d)}
                      style={{ padding:"5px 11px",borderRadius:8,background:isActive?`${cs.color}22`:hasAllergy?"rgba(255,107,107,0.1)":"rgba(14,37,68,0.8)",border:`1px solid ${isActive?cs.color+"66":hasAllergy?"rgba(255,107,107,0.5)":"rgba(42,77,114,0.4)"}`,color:isActive?cs.color:hasAllergy?T.coral:T.txt2,fontFamily:"DM Sans",fontWeight:600,fontSize:11.5,cursor:"pointer" }}>
                      {hasAllergy?"⚠ ":""}{d.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Search Input */}
          {view === "search" && (
            <>
              <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search drug name, brand, or class…"
                style={{ ...inp(!!query) }} autoFocus />
              <div style={{ display:"flex",gap:4,flexWrap:"wrap" }}>
                {classes.map(c=>(
                  <button key={c} onClick={()=>setCls(c)}
                    style={{ padding:"4px 10px",borderRadius:20,border:`1px solid ${cls===c?"rgba(59,158,255,0.5)":"rgba(42,77,114,0.35)"}`,background:cls===c?"rgba(59,158,255,0.12)":"transparent",color:cls===c?T.blue:T.txt4,fontFamily:"DM Sans",fontWeight:600,fontSize:10.5,cursor:"pointer",whiteSpace:"nowrap" }}>
                    {c}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Drug List */}
          <div style={{ ...glass({borderRadius:12}),overflow:"hidden",flex:1,overflowY:"auto" }}>
            {filtered.length === 0 && (
              <div style={{ padding:"32px 16px",textAlign:"center",color:T.txt4,fontFamily:"DM Sans",fontSize:13 }}>
                {view==="favorites" ? "No favorites yet — click ★ on any drug" : "No drugs match your search"}
              </div>
            )}
            {filtered.map((d,i) => {
              const isSelected = selected?.id === d.id;
              const hasAllergy = allergyAlert(d);
              const hasInteraction = interactionAlert(d);
              const sc = schedCol(d.sch);
              return (
                <div key={d.id} className="drug-row" onClick={()=>onSelect(d)}
                  style={{ padding:"10px 14px",borderBottom:"1px solid rgba(26,53,85,0.25)",background:isSelected?`linear-gradient(90deg,${T.blue}18,rgba(14,37,68,0.6))`:"transparent",borderLeft:`3px solid ${isSelected?T.blue:"transparent"}`,position:"relative" }}>
                  {(hasAllergy||hasInteraction) && (
                    <div style={{ position:"absolute",top:8,right:12,display:"flex",gap:4 }}>
                      {hasAllergy && <span style={{ fontFamily:"JetBrains Mono",fontSize:9,color:T.coral,background:"rgba(255,107,107,0.15)",padding:"1px 5px",borderRadius:4 }}>⚠ ALLERGY</span>}
                      {hasInteraction && <span style={{ fontFamily:"JetBrains Mono",fontSize:9,color:T.orange,background:"rgba(255,159,67,0.15)",padding:"1px 5px",borderRadius:4 }}>DDI</span>}
                    </div>
                  )}
                  <div style={{ display:"flex",alignItems:"flex-start",gap:8,paddingRight:hasAllergy||hasInteraction?80:0 }}>
                    <button onClick={e=>{e.stopPropagation();onToggleFav(d.id)}}
                      style={{ background:"transparent",border:"none",color:favorites.includes(d.id)?T.gold:T.txt4,cursor:"pointer",fontSize:14,flexShrink:0,padding:"0 2px",lineHeight:1 }}>
                      {favorites.includes(d.id)?"★":"☆"}
                    </button>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",marginBottom:2 }}>
                        <span style={{ fontFamily:"DM Sans",fontWeight:700,fontSize:13,color:isSelected?T.blue:T.txt }}>{d.name}</span>
                        {d.controlled && <Badge label={`Sch ${d.sch}`} color={sc} />}
                        <span style={{ fontFamily:"DM Sans",fontSize:10.5,color:T.txt3 }}>{d.brand}</span>
                      </div>
                      <div style={{ display:"flex",gap:6,flexWrap:"wrap",alignItems:"center" }}>
                        <span style={{ fontFamily:"DM Sans",fontSize:11,color:T.txt3 }}>{d.sub}</span>
                        <span style={{ fontFamily:"JetBrains Mono",fontSize:9,color:formCol(d.formulary),background:`${formCol(d.formulary)}15`,padding:"1px 6px",borderRadius:3 }}>{d.formulary}</span>
                        <span style={{ fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4 }}>{d.cost}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── Drug Detail + Sig Builder ──────────────────────────────────────
function RxBuilder({ drug, onSign, onCancel, patientWeight, patientAllergies, activeRx }) {
  const [form, setForm] = useState({
    form: drug.forms[0] || "",
    sig: drug.sigs[0] || "",
    customSig: false,
    customSigText: "",
    route: "PO",
    freq: "BID",
    dur: "7 days",
    dispense: "#20",
    refills: "0",
    daw: false,
    reason: "",
    pharmacy: "Patient's preferred pharmacy on file",
    notes: "",
    pdmpChecked: drug.controlled,
  });
  const set = k => v => setForm(p=>({...p,[k]:v}));

  const [activeTab, setActiveTab] = useState("dosing");
  const allergyFlag = useMemo(()=>{
    for (const [cls, ids] of Object.entries(ALLERGY_CLASSES)) {
      if (ids.includes(drug.id) && patientAllergies.some(a=>a.toLowerCase().includes(cls))) return `${cls} allergy documented — verify tolerance before prescribing`;
    }
    return null;
  },[drug,patientAllergies]);

  const interactions = useMemo(()=>
    activeRx.map(rxId=>{
      const key1=`${rxId}-${drug.id}`,key2=`${drug.id}-${rxId}`;
      return INTERACTIONS[key1]||INTERACTIONS[key2]||null;
    }).filter(Boolean)
  ,[drug,activeRx]);

  const pdsCalc = patientWeight ? (
    drug.peds.match(/(\d+\.?\d*)\s*mg\/kg/)
      ? `${patientWeight} kg × ${drug.peds.match(/(\d+\.?\d*)\s*mg\/kg/)[1]}mg/kg = ${(patientWeight*parseFloat(drug.peds.match(/(\d+\.?\d*)\s*mg\/kg/)[1])).toFixed(0)}mg`
      : null
  ) : null;

  const tabs = [
    {id:"dosing",  icon:"💊", label:"Dosing"},
    {id:"sig",     icon:"✍",  label:"SIG Builder"},
    {id:"safety",  icon:"🔒", label:"Safety"},
    {id:"renal",   icon:"🫘", label:"Renal/Hepatic"},
  ];

  const canSign = form.form && (form.customSig ? form.customSigText.trim() : form.sig) && (!drug.controlled || form.pdmpChecked);

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:10,height:"100%" }}>
      {/* Drug header */}
      <div style={{ ...glass({borderRadius:14,background:`linear-gradient(135deg,rgba(59,158,255,0.12),rgba(8,22,40,0.88))`}),padding:"16px 20px",position:"relative",overflow:"hidden" }}>
        <div style={{ position:"absolute",top:-20,right:-10,fontSize:80,opacity:.05 }}>💊</div>
        <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10,flexWrap:"wrap" }}>
          <div>
            <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap" }}>
              <h2 style={{ fontFamily:"Playfair Display",fontSize:20,fontWeight:700,color:T.txt,margin:0 }}>{drug.name}</h2>
              {drug.controlled && <Badge label={`Schedule ${drug.sch}`} color={schedCol(drug.sch)} />}
              <Badge label={drug.formulary} color={formCol(drug.formulary)} />
              <Badge label={drug.cost} color={T.txt3} />
            </div>
            <div style={{ fontFamily:"DM Sans",fontSize:12,color:T.txt2 }}>{drug.brand} · {drug.sub} · {drug.cls}</div>
            <div style={{ fontFamily:"DM Sans",fontSize:12,color:T.txt3,marginTop:2,fontStyle:"italic" }}>{drug.note}</div>
          </div>
          <button onClick={onCancel} style={{ padding:"4px 10px",borderRadius:7,background:"rgba(255,107,107,0.1)",border:"1px solid rgba(255,107,107,0.3)",color:T.coral,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"DM Sans",flexShrink:0 }}>✕ Clear</button>
        </div>
        {allergyFlag && (
          <div style={{ marginTop:10,padding:"8px 12px",background:"rgba(255,107,107,0.12)",border:"1px solid rgba(255,107,107,0.4)",borderRadius:8,fontFamily:"DM Sans",fontSize:12,color:T.coral,fontWeight:600 }}>
            ⚠ ALLERGY ALERT: {allergyFlag}
          </div>
        )}
        {interactions.map((ix,i)=>(
          <div key={i} style={{ marginTop:6,padding:"8px 12px",background:ix.severity==="critical"?"rgba(255,107,107,0.15)":"rgba(255,159,67,0.12)",border:`1px solid ${ix.severity==="critical"?"rgba(255,107,107,0.5)":"rgba(255,159,67,0.4)"}`,borderRadius:8,fontFamily:"DM Sans",fontSize:12,color:ix.severity==="critical"?T.coral:T.orange,fontWeight:600 }}>
            {ix.severity==="critical"?"🚨 CRITICAL DDI:":ix.severity==="major"?"⚠ MAJOR DDI:":"DDI:"} {ix.msg}
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div style={{ ...glass({borderRadius:10,padding:"5px"}),display:"flex",gap:4 }}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setActiveTab(t.id)}
            style={{ flex:1,padding:"7px 6px",borderRadius:7,border:`1px solid ${activeTab===t.id?"rgba(59,158,255,0.5)":"transparent"}`,background:activeTab===t.id?"rgba(59,158,255,0.12)":"transparent",color:activeTab===t.id?T.blue:T.txt3,fontFamily:"DM Sans",fontWeight:600,fontSize:11,cursor:"pointer",textAlign:"center",transition:"all .15s" }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ ...glass({borderRadius:14}),padding:"16px 18px",flex:1,overflowY:"auto" }}>

        {activeTab === "dosing" && (
          <div className="erx-in" style={{ display:"flex",flexDirection:"column",gap:14 }}>
            <InputField label="Formulation / Strength" required>
              <Select value={form.form} onChange={set("form")} options={drug.forms} />
            </InputField>

            <InputField label="Standard SIG (select or build custom)">
              <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
                {drug.sigs.map((sig,i)=>(
                  <button key={i} onClick={()=>{ set("sig")(sig); set("customSig")(false); }}
                    style={{ padding:"9px 14px",borderRadius:9,textAlign:"left",background:form.sig===sig&&!form.customSig?"rgba(59,158,255,0.14)":"rgba(14,37,68,0.7)",border:`1px solid ${form.sig===sig&&!form.customSig?"rgba(59,158,255,0.5)":"rgba(42,77,114,0.35)"}`,color:form.sig===sig&&!form.customSig?T.blue:T.txt2,fontFamily:"DM Sans",fontSize:12.5,cursor:"pointer",transition:"all .15s" }}>
                    {form.sig===sig&&!form.customSig && <span style={{ marginRight:6 }}>✓</span>}{sig}
                  </button>
                ))}
                <button onClick={()=>set("customSig")(true)}
                  style={{ padding:"9px 14px",borderRadius:9,textAlign:"left",background:form.customSig?"rgba(245,200,66,0.12)":"rgba(14,37,68,0.5)",border:`1px solid ${form.customSig?"rgba(245,200,66,0.4)":"rgba(42,77,114,0.3)"}`,color:form.customSig?T.gold:T.txt3,fontFamily:"DM Sans",fontSize:12,cursor:"pointer" }}>
                  {form.customSig && "✓ "}✏ Custom SIG…
                </button>
              </div>
            </InputField>

            {form.customSig && (
              <InputField label="Custom SIG">
                <input value={form.customSigText} onChange={e=>set("customSigText")(e.target.value)}
                  placeholder="e.g., Take 2 capsules by mouth twice daily with meals × 10 days"
                  style={inp(true)} />
              </InputField>
            )}

            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
              <InputField label="Dispense Quantity">
                <Select value={form.dispense} onChange={set("dispense")} options={DISPENSE} />
              </InputField>
              <InputField label="Refills">
                <Select value={form.refills} onChange={set("refills")} options={["0","1","2","3","4","5","11 (12-mo supply)"]} />
              </InputField>
            </div>

            <InputField label="Indication / Reason for Prescribing">
              <input value={form.reason} onChange={e=>set("reason")(e.target.value)}
                placeholder="e.g., Community-acquired pneumonia, strep pharyngitis"
                style={inp(!!form.reason)} />
            </InputField>

            <div style={{ display:"flex",alignItems:"center",gap:10 }}>
              <button onClick={()=>set("daw")(!form.daw)}
                style={{ display:"flex",alignItems:"center",gap:8,background:"transparent",border:"none",cursor:"pointer",padding:0 }}>
                <div style={{ width:40,height:22,borderRadius:11,background:form.daw?`${T.blue}55`:"rgba(26,53,85,0.6)",border:`1px solid ${form.daw?T.blue:"rgba(42,77,114,0.4)"}`,position:"relative",transition:"all .2s",flexShrink:0 }}>
                  <div style={{ position:"absolute",top:2,left:form.daw?20:2,width:16,height:16,borderRadius:"50%",background:form.daw?T.blue:T.txt4,transition:"left .2s" }} />
                </div>
                <span style={{ fontFamily:"DM Sans",fontSize:12.5,color:form.daw?T.blue:T.txt3,fontWeight:600 }}>DAW — Dispense As Written (brand medically necessary)</span>
              </button>
            </div>

            {pdsCalc && (
              <div style={{ padding:"10px 14px",background:"rgba(59,158,255,0.08)",border:"1px solid rgba(59,158,255,0.25)",borderRadius:10 }}>
                <div style={{ fontFamily:"JetBrains Mono",fontSize:9,color:T.blue,textTransform:"uppercase",letterSpacing:1,marginBottom:4 }}>WEIGHT-BASED DOSE CALCULATOR</div>
                <div style={{ fontFamily:"JetBrains Mono",fontSize:13,fontWeight:700,color:T.blue }}>{pdsCalc}</div>
                <div style={{ fontFamily:"DM Sans",fontSize:11,color:T.txt3,marginTop:3 }}>{drug.peds}</div>
              </div>
            )}

            {drug.controlled && (
              <div style={{ padding:"12px 14px",background:"rgba(255,107,107,0.08)",border:`1px solid ${form.pdmpChecked?"rgba(61,255,160,0.35)":"rgba(255,107,107,0.4)"}`,borderRadius:10 }}>
                <div style={{ fontFamily:"JetBrains Mono",fontSize:9,color:form.pdmpChecked?T.green:T.coral,textTransform:"uppercase",letterSpacing:1,marginBottom:8 }}>⚠ CONTROLLED SUBSTANCE — Schedule {drug.sch}</div>
                <button onClick={()=>set("pdmpChecked")(!form.pdmpChecked)}
                  style={{ display:"flex",alignItems:"center",gap:8,background:"transparent",border:"none",cursor:"pointer",padding:0 }}>
                  <div style={{ width:40,height:22,borderRadius:11,background:form.pdmpChecked?`${T.green}55`:"rgba(255,107,107,0.2)",border:`1px solid ${form.pdmpChecked?T.green:T.coral}`,position:"relative",transition:"all .2s",flexShrink:0 }}>
                    <div style={{ position:"absolute",top:2,left:form.pdmpChecked?20:2,width:16,height:16,borderRadius:"50%",background:form.pdmpChecked?T.green:T.coral,transition:"left .2s" }} />
                  </div>
                  <span style={{ fontFamily:"DM Sans",fontSize:12.5,color:form.pdmpChecked?T.green:T.coral,fontWeight:700 }}>{form.pdmpChecked?"✓ PDMP reviewed — no contraindications":"⬜ I confirm PDMP has been reviewed for this patient"}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "sig" && (
          <div className="erx-in" style={{ display:"flex",flexDirection:"column",gap:14 }}>
            <div style={{ fontFamily:"DM Sans",fontSize:12,color:T.txt3,padding:"8px 12px",background:"rgba(59,158,255,0.06)",borderRadius:8 }}>
              Build a structured SIG — this will override the standard SIG selection
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
              <InputField label="Route">
                <Select value={form.route} onChange={set("route")} options={ROUTES} />
              </InputField>
              <InputField label="Frequency">
                <Select value={form.freq} onChange={set("freq")} options={FREQS} />
              </InputField>
              <InputField label="Duration">
                <Select value={form.dur} onChange={set("dur")} options={DURATIONS} />
              </InputField>
              <InputField label="Dispense">
                <Select value={form.dispense} onChange={set("dispense")} options={DISPENSE} />
              </InputField>
            </div>
            <InputField label="SIG Preview (editable)">
              <div style={{ padding:"12px 14px",background:"rgba(0,229,192,0.06)",border:"1px solid rgba(0,229,192,0.25)",borderRadius:10,fontFamily:"DM Sans",fontSize:13,color:T.txt,lineHeight:1.7 }}>
                {form.form} — Take {form.route} {form.freq} × {form.dur}. Dispense: {form.dispense}. Refills: {form.refills}.
              </div>
            </InputField>
            <InputField label="Additional Notes for Pharmacist">
              <textarea value={form.notes} onChange={e=>set("notes")(e.target.value)} rows={3}
                placeholder="e.g., Patient has difficulty swallowing — liquid formulation preferred; auto-refill; patient education on administration"
                style={{ ...inp(!!form.notes),resize:"vertical",lineHeight:1.6 }} />
            </InputField>
          </div>
        )}

        {activeTab === "safety" && (
          <div className="erx-in" style={{ display:"flex",flexDirection:"column",gap:12 }}>
            <div style={{ fontFamily:"JetBrains Mono",fontSize:9,color:T.coral,textTransform:"uppercase",letterSpacing:2,marginBottom:2 }}>DRUG INTERACTIONS</div>
            {drug.interactions.map((ix,i)=>(
              <div key={i} style={{ padding:"9px 12px",background:"rgba(255,159,67,0.07)",border:"1px solid rgba(255,159,67,0.2)",borderRadius:8,fontFamily:"DM Sans",fontSize:12.5,color:T.txt2,lineHeight:1.5 }}>
                <span style={{ color:T.orange }}>⟷ </span>{ix}
              </div>
            ))}
            <div style={{ fontFamily:"JetBrains Mono",fontSize:9,color:T.coral,textTransform:"uppercase",letterSpacing:2,marginTop:8,marginBottom:2 }}>ALLERGY & CONTRAINDICATIONS</div>
            {drug.allergyFlags.map((af,i)=>(
              <div key={i} style={{ padding:"9px 12px",background:"rgba(255,107,107,0.07)",border:"1px solid rgba(255,107,107,0.2)",borderRadius:8,fontFamily:"DM Sans",fontSize:12.5,color:T.txt2,lineHeight:1.5 }}>
                <span style={{ color:T.coral }}>⚠ </span>{af}
              </div>
            ))}
            <div style={{ padding:"10px 14px",background:"rgba(5,15,30,0.6)",border:"1px solid rgba(26,53,85,0.4)",borderRadius:10 }}>
              <div style={{ fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:2,marginBottom:6 }}>MAX DOSE</div>
              <div style={{ fontFamily:"JetBrains Mono",fontSize:13,fontWeight:700,color:T.teal }}>{drug.maxDose}</div>
            </div>
          </div>
        )}

        {activeTab === "renal" && (
          <div className="erx-in" style={{ display:"flex",flexDirection:"column",gap:12 }}>
            {[
              {label:"Renal Dosing",val:drug.renal,color:T.blue,icon:"🫘"},
              {label:"Hepatic Dosing",val:drug.hepatic,color:T.orange,icon:"🫀"},
              {label:"Pediatric Dosing",val:drug.peds,color:T.teal,icon:"👶"},
            ].map(item=>(
              <div key={item.label} style={{ padding:"13px 16px",background:`${item.color}08`,border:`1px solid ${item.color}25`,borderRadius:12 }}>
                <div style={{ fontFamily:"JetBrains Mono",fontSize:9,color:item.color,textTransform:"uppercase",letterSpacing:2,marginBottom:6 }}>{item.icon} {item.label}</div>
                <div style={{ fontFamily:"DM Sans",fontSize:13,color:T.txt,lineHeight:1.7 }}>{item.val}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sign Rx Button */}
      <div style={{ display:"flex",gap:8 }}>
        <button onClick={onCancel} style={{ padding:"11px 16px",borderRadius:10,background:"transparent",border:"1px solid rgba(26,53,85,0.5)",color:T.txt3,fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"DM Sans" }}>
          Cancel
        </button>
        <button onClick={()=>canSign&&onSign({...drug,rx:form})} disabled={!canSign}
          style={{ flex:1,padding:"11px 16px",borderRadius:10,background:canSign?`linear-gradient(135deg,${T.teal},#00b4d8)`:"rgba(26,53,85,0.4)",border:"none",color:canSign?"#050f1e":T.txt4,fontWeight:700,fontSize:14,cursor:canSign?"pointer":"not-allowed",fontFamily:"DM Sans",transition:"all .2s",display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}>
          {!canSign && drug.controlled && !form.pdmpChecked ? "⚠ PDMP Check Required to Sign" : "✍ Sign & Transmit Prescription"}
        </button>
      </div>
    </div>
  );
}

// ── Signed Rx Queue ────────────────────────────────────────────────
function SignedRxQueue({ prescriptions, onRevoke, accentColor }) {
  if (prescriptions.length === 0) return (
    <div style={{ ...glass({borderRadius:14}),padding:"32px 20px",textAlign:"center",color:T.txt4 }}>
      <div style={{ fontSize:36,marginBottom:8 }}>📋</div>
      <div style={{ fontFamily:"DM Sans",fontSize:13 }}>No prescriptions signed yet</div>
      <div style={{ fontFamily:"DM Sans",fontSize:11,color:T.txt4,marginTop:4 }}>Select a drug → complete SIG → sign to add here</div>
    </div>
  );

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
      {prescriptions.map((p,i)=>{
        const sc = schedCol(p.sch);
        return (
          <div key={i} className="erx-slide erx-in" style={{ ...glass({borderRadius:12,background:"rgba(0,229,192,0.06)",borderColor:"rgba(0,229,192,0.25)"}),padding:"12px 16px" }}>
            <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap" }}>
              <span style={{ fontFamily:"DM Sans",fontWeight:700,fontSize:13,color:T.txt }}>{p.name}</span>
              {p.controlled && <Badge label={`Sch ${p.sch}`} color={sc}/>}
              <span style={{ fontFamily:"DM Sans",fontSize:11,color:T.txt3 }}>{p.rx.form}</span>
              <span style={{ marginLeft:"auto",fontFamily:"JetBrains Mono",fontSize:9,color:T.teal,background:"rgba(0,229,192,0.12)",padding:"2px 7px",borderRadius:4 }}>✓ SIGNED</span>
              <button onClick={()=>onRevoke(i)} style={{ background:"transparent",border:"none",color:T.coral,cursor:"pointer",fontSize:12,padding:"0 2px" }}>✕</button>
            </div>
            <div style={{ fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.6 }}>
              <span style={{ color:T.txt3 }}>SIG: </span>{p.rx.customSig ? p.rx.customSigText : p.rx.sig}
            </div>
            <div style={{ display:"flex",gap:12,marginTop:6,flexWrap:"wrap" }}>
              {[`Qty: ${p.rx.dispense}`,`Refills: ${p.rx.refills}`,p.rx.daw?"DAW":null,p.rx.reason?`For: ${p.rx.reason}`:null].filter(Boolean).map((t,j)=>(
                <span key={j} style={{ fontFamily:"DM Sans",fontSize:11,color:T.txt3 }}>{t}</span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════
const SECTIONS = [
  {id:"prescribe",icon:"💊",label:"Prescribe",      sub:"Search & write Rx",      color:T.teal  },
  {id:"signed",   icon:"✅",label:"Signed Rx",       sub:"Current prescription pad",color:T.green },
  {id:"history",  icon:"📋",label:"Rx History",      sub:"Prior prescriptions",     color:T.blue  },
  {id:"pdmp",     icon:"🔍",label:"PDMP / CDS",      sub:"Controlled substance check",color:T.coral},
  {id:"allergy",  icon:"⚠️",label:"Allergies",        sub:"Drug allergy management",  color:T.gold  },
  {id:"interact", icon:"⟷",label:"Interactions",     sub:"Active Rx interaction check",color:T.orange},
];

export default function ERxHub({ medications = [], allergies = [] }) {
  const [activeSection, setActiveSection] = useState("prescribe");
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [signedRx, setSignedRx] = useState([]);
  const [favorites, setFavorites] = useState(["amox","albuterol","ondansetron","metformin"]);
  const [patientWeight, setPatientWeight] = useState("");
  const [patientAllergies, setPatientAllergies] = useState(() =>
    allergies.length ? allergies : ["penicillin"]
  );
  const [newAllergy, setNewAllergy] = useState("");
  const [showSuccess, setShowSuccess] = useState(null);
  // AI DDI state
  const [ddiAiBusy, setDdiAiBusy]   = useState(false);
  const [ddiAiResult, setDdiAiResult] = useState(null);

  const sec = SECTIONS.find(s=>s.id===activeSection);
  const activeRxIds = signedRx.map(p=>p.id);

  const handleSign = useCallback((rxData) => {
    setSignedRx(p=>[...p,rxData]);
    setShowSuccess(rxData.name);
    setTimeout(()=>setShowSuccess(null),3000);
    setSelectedDrug(null);
    setActiveSection("signed");
  },[]);

  const handleRevoke = useCallback((i)=>{
    setSignedRx(p=>p.filter((_,j)=>j!==i));
  },[]);

  const handleToggleFav = useCallback((id)=>{
    setFavorites(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);
  },[]);

  // All-pairs interaction check — Rx-to-Rx + Rx-to-home-meds
  const allInteractions = useMemo(()=>{
    const found = [];
    // Rx-to-Rx hardcoded pairs
    for (let i=0;i<signedRx.length;i++) {
      for (let j=i+1;j<signedRx.length;j++) {
        const k1=`${signedRx[i].id}-${signedRx[j].id}`;
        const k2=`${signedRx[j].id}-${signedRx[i].id}`;
        const ix = INTERACTIONS[k1]||INTERACTIONS[k2];
        if (ix) found.push({drug1:signedRx[i].name,drug2:signedRx[j].name,...ix});
      }
    }
    // Rx-to-home-medications via drug.interactions[] string array
    signedRx.forEach(rx=>{
      const drug = DRUGS.find(d=>d.id===rx.id);
      if (!drug?.interactions) return;
      drug.interactions.forEach(ixStr=>{
        const homeMed = medications.find(m=>
          ixStr.toLowerCase().includes(m.toLowerCase().split(" ")[0])
        );
        if (homeMed && !found.some(f=>
          (f.drug1===rx.name&&f.drug2===homeMed)||(f.drug1===homeMed&&f.drug2===rx.name)
        )) {
          found.push({drug1:rx.name,drug2:homeMed,severity:"moderate",msg:ixStr,source:"home-med"});
        }
      });
    });
    return found;
  },[signedRx, medications]);

  // AI DDI — fires whenever signed Rx changes; catches interactions beyond the hardcoded map
  useEffect(()=>{
    if (signedRx.length===0){ setDdiAiResult(null); return; }
    const allMeds=[...signedRx.map(r=>r.name),...medications];
    if (allMeds.length<2) return;
    setDdiAiBusy(true);
    fetch("https://api.anthropic.com/v1/messages",{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        model:"claude-sonnet-4-20250514",max_tokens:600,
        system:`You are a clinical pharmacist. Check the medication list for drug-drug interactions. Return ONLY a valid JSON array, no markdown. Each item: {"drug1":"...","drug2":"...","severity":"critical|major|moderate|minor","msg":"brief clinical impact and recommended action"}. Return [] if none found.`,
        messages:[{role:"user",content:`Medication list:\n${allMeds.join("\n")}`}]
      })
    })
    .then(r=>r.json())
    .then(d=>{
      const raw=(d.content?.[0]?.text||"[]").replace(/```json|```/g,"").trim();
      const parsed=JSON.parse(raw);
      // Suppress results already covered by hardcoded map
      const novel=parsed.filter(ai=>!allInteractions.some(h=>
        h.drug1.toLowerCase().includes(ai.drug1.toLowerCase())||
        h.drug2.toLowerCase().includes(ai.drug1.toLowerCase())
      ));
      setDdiAiResult(novel.length?novel:null);
    })
    .catch(()=>setDdiAiResult(null))
    .finally(()=>setDdiAiBusy(false));
  },[signedRx]); // eslint-disable-line

  return (
    <div style={{ background:T.bg,minHeight:"100vh",fontFamily:"DM Sans,sans-serif",display:"flex",flexDirection:"column",position:"relative",overflow:"hidden" }}>

      {/* Ambient glow */}
      <div style={{ position:"fixed",inset:0,pointerEvents:"none",zIndex:0 }}>
        <div style={{ position:"absolute",top:"-15%",left:"-5%",width:"55%",height:"55%",background:`radial-gradient(circle,${sec.color}15 0%,transparent 70%)`,transition:"background 1.2s ease" }}/>
        <div style={{ position:"absolute",bottom:"-20%",right:"0",width:"45%",height:"45%",background:"radial-gradient(circle,rgba(0,229,192,0.07) 0%,transparent 70%)"}}/>
      </div>

      {/* Header */}
      <div style={{ ...deep({borderRadius:0}),padding:"12px 24px",flexShrink:0,zIndex:10,position:"relative",borderBottom:"1px solid rgba(26,53,85,0.6)" }}>
        <div style={{ display:"flex",alignItems:"center",gap:12,flexWrap:"wrap" }}>
          <div style={{ ...deep({borderRadius:9}),padding:"4px 12px",display:"flex",gap:8,alignItems:"center" }}>
            <span style={{ fontFamily:"JetBrains Mono",fontSize:10,color:T.teal,letterSpacing:3 }}>NOTRYA</span>
            <span style={{ color:T.txt3,fontFamily:"JetBrains Mono",fontSize:10 }}>/</span>
            <span style={{ fontFamily:"JetBrains Mono",fontSize:10,color:T.txt3,letterSpacing:2 }}>eRx</span>
          </div>
          <div style={{ height:1,flex:1,background:"linear-gradient(90deg,rgba(42,77,114,0.5),transparent)" }}/>
          <h1 className="erx-shimmer" style={{ fontFamily:"Playfair Display",fontSize:"clamp(18px,2.5vw,28px)",fontWeight:900,letterSpacing:-.5 }}>Electronic Prescribing</h1>
          <div style={{ height:1,width:24,background:"linear-gradient(90deg,transparent,rgba(42,77,114,0.5))" }}/>

          {/* Patient context */}
          <div style={{ display:"flex",gap:8,alignItems:"center",flexWrap:"wrap" }}>
            <div style={{ ...deep({borderRadius:8}),padding:"4px 10px",display:"flex",alignItems:"center",gap:6 }}>
              <span style={{ fontSize:12 }}>⚖️</span>
              <input placeholder="Wt (kg)" value={patientWeight} onChange={e=>setPatientWeight(e.target.value)}
                type="number" min="0" max="300"
                style={{ background:"transparent",border:"none",outline:"none",color:T.txt,fontFamily:"JetBrains Mono",fontSize:12,width:50 }}/>
              <span style={{ fontFamily:"JetBrains Mono",fontSize:10,color:T.txt3 }}>kg</span>
            </div>
            <div style={{ display:"flex",alignItems:"center",gap:6,padding:"4px 10px",borderRadius:8,background:`${T.coral}15`,border:`1px solid ${T.coral}30` }}>
              <span style={{ fontSize:12 }}>⚠️</span>
              <span style={{ fontFamily:"DM Sans",fontSize:11,fontWeight:600,color:T.coral }}>Allergies: {patientAllergies.length ? patientAllergies.join(", ") : "NKDA"}</span>
            </div>
            {signedRx.length > 0 && (
              <div style={{ padding:"4px 10px",borderRadius:8,background:"rgba(61,255,160,0.12)",border:"1px solid rgba(61,255,160,0.3)" }}>
                <span style={{ fontFamily:"JetBrains Mono",fontSize:11,fontWeight:700,color:T.green }}>{signedRx.length} Rx Signed</span>
              </div>
            )}
            {allInteractions.length > 0 && (
              <div style={{ padding:"4px 10px",borderRadius:8,background:"rgba(255,159,67,0.12)",border:"1px solid rgba(255,159,67,0.4)",cursor:"pointer" }} onClick={()=>setActiveSection("interact")}>
                <span style={{ fontFamily:"JetBrains Mono",fontSize:11,fontWeight:700,color:T.orange }}>⟷ {allInteractions.length} DDI</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Success toast */}
      {showSuccess && (
        <div style={{ position:"fixed",top:70,right:24,zIndex:999,...glass({borderRadius:12,background:"rgba(0,229,192,0.15)",borderColor:"rgba(0,229,192,0.4)"}),padding:"12px 20px",fontFamily:"DM Sans",fontSize:13,fontWeight:600,color:T.teal,animation:"erx-in .3s ease" }}>
          ✓ {showSuccess} — Prescription signed and queued for transmission
        </div>
      )}

      {/* Body */}
      <div style={{ display:"flex",flex:1,minHeight:0,position:"relative",zIndex:1,overflow:"hidden" }}>

        {/* Sidebar */}
        <div style={{ ...deep({borderRadius:0,borderRight:"1px solid rgba(26,53,85,0.6)"}),width:200,flexShrink:0,padding:"12px 8px",display:"flex",flexDirection:"column",gap:3 }}>
          <div style={{ fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:3,padding:"4px 8px 10px" }}>NAVIGATION</div>
          {SECTIONS.map(s=>{
            const isActive = s.id===activeSection;
            const badge = s.id==="signed"?signedRx.length:s.id==="interact"?allInteractions.length:null;
            return (
              <div key={s.id} className="erx-hover" onClick={()=>setActiveSection(s.id)}
                style={{ padding:"10px 12px",borderRadius:10,background:isActive?`linear-gradient(135deg,${s.color}22,rgba(14,37,68,0.6))`:"transparent",border:`1px solid ${isActive?s.color+"55":"transparent"}`,position:"relative",cursor:"pointer",transition:"background .18s,border .18s" }}>
                {isActive && <div style={{ position:"absolute",left:0,top:"15%",height:"70%",width:2.5,background:s.color,borderRadius:2,boxShadow:`0 0 8px ${s.color}` }}/>}
                <div style={{ display:"flex",alignItems:"center",gap:7 }}>
                  <span style={{ fontSize:15 }}>{s.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:"DM Sans",fontWeight:700,fontSize:12,color:isActive?T.txt:T.txt2 }}>{s.label}</div>
                    <div style={{ fontFamily:"DM Sans",fontSize:10,color:T.txt4,marginTop:0.5 }}>{s.sub}</div>
                  </div>
                  {badge>0 && <span style={{ fontFamily:"JetBrains Mono",fontSize:9,fontWeight:700,color:s.color,background:`${s.color}22`,padding:"1px 6px",borderRadius:10 }}>{badge}</span>}
                </div>
              </div>
            );
          })}

          {/* Sidebar quick stats */}
          <div style={{ flex:1 }}/>
          <div style={{ ...deep({borderRadius:10}),padding:"10px 12px",marginTop:8 }}>
            <div style={{ fontFamily:"JetBrains Mono",fontSize:8,color:T.txt4,textTransform:"uppercase",letterSpacing:1,marginBottom:8 }}>DRUG DATABASE</div>
            {[{l:"Total Drugs",v:DRUGS.length},{l:"Controlled",v:DRUGS.filter(d=>d.controlled).length},{l:"Favorites",v:favorites.length}].map((r,i)=>(
              <div key={i} style={{ display:"flex",justifyContent:"space-between",padding:"3px 0",borderBottom:i<2?"1px solid rgba(26,53,85,0.3)":"none" }}>
                <span style={{ fontFamily:"DM Sans",fontSize:10,color:T.txt3 }}>{r.l}</span>
                <span style={{ fontFamily:"JetBrains Mono",fontSize:10,fontWeight:700,color:T.teal }}>{r.v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div style={{ flex:1,minWidth:0,display:"flex",flexDirection:"column",overflow:"hidden" }}>
          {/* Section header */}
          <div style={{ ...glass({borderRadius:0,background:`linear-gradient(135deg,${sec.color}12,rgba(8,22,40,0.9))`,borderColor:sec.color+"33",borderLeft:"none",borderRight:"none",borderTop:"none"}),padding:"12px 24px",flexShrink:0,overflow:"hidden",position:"relative" }}>
            <div style={{ position:"absolute",top:-20,right:-10,fontSize:90,opacity:.05 }}>{sec.icon}</div>
            <div style={{ display:"flex",alignItems:"center",gap:12 }}>
              <span style={{ fontSize:24 }}>{sec.icon}</span>
              <div>
                <h2 style={{ fontFamily:"Playfair Display",fontWeight:700,fontSize:"clamp(15px,2vw,20px)",color:T.txt,margin:0 }}>{sec.label}</h2>
                <div style={{ fontFamily:"DM Sans",fontSize:11,color:T.txt3,marginTop:1 }}>{sec.sub}</div>
              </div>
            </div>
          </div>

          {/* Panel content */}
          <div key={activeSection} className="erx-in" style={{ flex:1,minHeight:0,overflowY:"auto",padding:"16px 20px" }}>

            {/* ── PRESCRIBE ── */}
            {activeSection==="prescribe" && (
              <div style={{ display:"flex",gap:14,height:"100%",minHeight:600 }}>
                {/* Drug search column */}
                <div style={{ flex:"0 0 320px",display:"flex",flexDirection:"column",gap:10 }}>
                  <DrugSearchPanel
                    onSelect={setSelectedDrug}
                    selected={selectedDrug}
                    favorites={favorites}
                    onToggleFav={handleToggleFav}
                    patientAllergies={patientAllergies}
                    activeRx={activeRxIds}
                  />
                </div>
                {/* Rx Builder column */}
                <div style={{ flex:1,minWidth:0 }}>
                  {selectedDrug ? (
                    <RxBuilder
                      drug={selectedDrug}
                      onSign={handleSign}
                      onCancel={()=>setSelectedDrug(null)}
                      patientWeight={parseFloat(patientWeight)||null}
                      patientAllergies={patientAllergies}
                      activeRx={activeRxIds}
                    />
                  ) : (
                    <div style={{ ...glass({borderRadius:14}),height:"100%",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,color:T.txt4 }}>
                      <span style={{ fontSize:48 }}>💊</span>
                      <div style={{ fontFamily:"Playfair Display",fontSize:18,color:T.txt2 }}>Select a drug to begin prescribing</div>
                      <div style={{ fontFamily:"DM Sans",fontSize:12,color:T.txt4,textAlign:"center",maxWidth:300 }}>
                        Search by drug name or brand, browse by clinical condition, or pick from your favorites
                      </div>
                      {/* Compact quick-select */}
                      <div style={{ display:"flex",flexWrap:"wrap",gap:6,marginTop:8,justifyContent:"center",maxWidth:400 }}>
                        {DRUGS.filter(d=>favorites.includes(d.id)).slice(0,6).map(d=>(
                          <button key={d.id} onClick={()=>setSelectedDrug(d)}
                            style={{ padding:"6px 14px",borderRadius:20,background:"rgba(0,229,192,0.08)",border:"1px solid rgba(0,229,192,0.25)",color:T.teal,fontFamily:"DM Sans",fontWeight:600,fontSize:12,cursor:"pointer" }}>
                            ⭐ {d.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── SIGNED RX ── */}
            {activeSection==="signed" && (
              <div>
                <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:14 }}>
                  <span style={{ fontFamily:"DM Sans",fontSize:13,color:T.txt2,flex:1 }}>{signedRx.length} prescription{signedRx.length!==1?"s":""} ready for transmission</span>
                  {signedRx.length > 0 && (
                    <button onClick={()=>{ setShowSuccess("Prescriptions transmitted to pharmacy system."); setTimeout(()=>setShowSuccess(null),3000); }}
                      style={{ padding:"9px 20px",borderRadius:10,background:`linear-gradient(135deg,${T.green},#27ae60)`,border:"none",color:"#050f1e",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"DM Sans" }}>
                      📤 Transmit All to Pharmacy
                    </button>
                  )}
                </div>
                <SignedRxQueue prescriptions={signedRx} onRevoke={handleRevoke} accentColor={T.green} />
              </div>
            )}

            {/* ── RX HISTORY ── */}
            {activeSection==="history" && (
              <div>
                <div style={{ ...glass({borderRadius:12,background:"rgba(59,158,255,0.05)",borderColor:"rgba(59,158,255,0.2)"}),padding:"12px 16px",marginBottom:14,fontFamily:"DM Sans",fontSize:12.5,color:T.txt2 }}>
                  📋 Prescription history is populated from the patient's EHR record. Connect Notrya to your EHR for full medication history integration.
                </div>
                {[
                  {name:"Metformin 1000mg",sig:"PO BID with meals",date:"2025-11-12",refills:"3 remaining",status:"Active"},
                  {name:"Lisinopril 10mg",sig:"PO daily",date:"2025-10-01",refills:"5 remaining",status:"Active"},
                  {name:"Atorvastatin 40mg",sig:"PO nightly",date:"2025-10-01",refills:"5 remaining",status:"Active"},
                  {name:"Amoxicillin 500mg",sig:"PO TID × 10 days",date:"2025-09-15",refills:"0",status:"Completed"},
                  {name:"Ondansetron 4mg ODT",sig:"Q8h PRN nausea",date:"2025-08-22",refills:"0",status:"Completed"},
                ].map((rx,i)=>(
                  <div key={i} style={{ ...glass({borderRadius:10}),padding:"12px 16px",marginBottom:8,display:"flex",alignItems:"center",gap:12,flexWrap:"wrap" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontFamily:"DM Sans",fontWeight:700,fontSize:13,color:T.txt,marginBottom:2 }}>{rx.name}</div>
                      <div style={{ fontFamily:"DM Sans",fontSize:11.5,color:T.txt2 }}>{rx.sig} · Refills: {rx.refills}</div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontFamily:"JetBrains Mono",fontSize:10,color:rx.status==="Active"?T.green:T.txt3 }}>{rx.status}</div>
                      <div style={{ fontFamily:"DM Sans",fontSize:11,color:T.txt4 }}>{rx.date}</div>
                    </div>
                    {rx.status==="Active" && (
                      <button onClick={()=>{ const d=DRUGS.find(x=>rx.name.toLowerCase().includes(x.name.toLowerCase())); if(d){setSelectedDrug(d);setActiveSection("prescribe");} }}
                        style={{ padding:"5px 12px",borderRadius:7,background:"rgba(0,229,192,0.1)",border:"1px solid rgba(0,229,192,0.25)",color:T.teal,fontFamily:"DM Sans",fontWeight:600,fontSize:11,cursor:"pointer" }}>
                        Renew
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ── PDMP ── */}
            {activeSection==="pdmp" && (
              <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
                <div style={{ ...glass({borderRadius:12,background:"rgba(255,107,107,0.07)",borderColor:"rgba(255,107,107,0.3)"}),padding:"16px 18px" }}>
                  <div style={{ fontFamily:"JetBrains Mono",fontSize:10,color:T.coral,textTransform:"uppercase",letterSpacing:2,marginBottom:8 }}>⚠ PRESCRIPTION DRUG MONITORING PROGRAM (PDMP)</div>
                  <div style={{ fontFamily:"DM Sans",fontSize:13,color:T.txt2,lineHeight:1.7 }}>
                    PDMP review is <strong style={{color:T.txt}}>mandatory before prescribing any controlled substance (Schedule II–V)</strong>. eRx Hub enforces acknowledgment of PDMP review within the prescription workflow for all controlled substances.
                  </div>
                </div>
                <div style={{ ...glass({borderRadius:12}),padding:"16px 18px" }}>
                  <div style={{ fontFamily:"JetBrains Mono",fontSize:9,color:T.teal,textTransform:"uppercase",letterSpacing:2,marginBottom:12 }}>CDC CLINICAL DECISION SUPPORT — OPIOID PRESCRIBING</div>
                  {[
                    {title:"Prescribe lowest effective dose",desc:"Start with immediate-release opioids; avoid prescribing long-acting/ER opioids for acute pain"},
                    {title:"Use evidence-based thresholds",desc:"≥ 50 MME/day increases overdose risk; ≥ 90 MME/day markedly increases risk — use caution and document rationale"},
                    {title:"Co-prescribe naloxone",desc:"Prescribe naloxone for patients on ≥ 50 MME/day or concurrent BZD + opioid — document in chart"},
                    {title:"Short duration for acute pain",desc:"3–7 days for most acute pain syndromes; ≤ 3 days for many post-procedure situations"},
                    {title:"Avoid concurrent BZD + opioid",desc:"FDA Black Box: benzodiazepine + opioid combination dramatically increases fatal overdose risk"},
                    {title:"Offer or arrange treatment if SUD",desc:"Evidence-based treatments: buprenorphine, methadone, naltrexone — warm handoff"},
                  ].map((item,i)=>(
                    <div key={i} style={{ display:"flex",gap:10,padding:"10px 12px",background:"rgba(14,37,68,0.5)",border:"1px solid rgba(26,53,85,0.35)",borderRadius:9,marginBottom:6 }}>
                      <span style={{ color:T.teal,fontSize:12,marginTop:2,flexShrink:0 }}>▸</span>
                      <div>
                        <div style={{ fontFamily:"DM Sans",fontWeight:600,fontSize:13,color:T.txt,marginBottom:2 }}>{item.title}</div>
                        <div style={{ fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.55 }}>{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ ...glass({borderRadius:12}),padding:"14px 16px" }}>
                  <div style={{ fontFamily:"JetBrains Mono",fontSize:9,color:T.purple,textTransform:"uppercase",letterSpacing:2,marginBottom:10 }}>CONTROLLED SUBSTANCE SCHEDULE REFERENCE</div>
                  {[
                    {sch:"II",ex:"Oxycodone, Hydrocodone, Morphine, Fentanyl, Methylphenidate, Amphetamine",rule:"No refills; written Rx or e-prescribe with DEA approval; 30-day supply"},
                    {sch:"III",ex:"Buprenorphine (OBOT), Codeine combinations, Ketamine",rule:"Up to 5 refills in 6 months; e-prescribe permitted"},
                    {sch:"IV",ex:"Benzodiazepines, Tramadol, Zolpidem, Carisoprodol",rule:"Up to 5 refills in 6 months; e-prescribe permitted"},
                    {sch:"V",ex:"Pregabalin, Cough preparations with <200mg codeine/100mL",rule:"Some OTC; prescription varies by state"},
                  ].map((item,i)=>(
                    <div key={i} style={{ padding:"10px 12px",background:"rgba(14,37,68,0.45)",border:`1px solid ${schedCol(item.sch)}33`,borderRadius:9,marginBottom:6 }}>
                      <div style={{ display:"flex",gap:8,alignItems:"center",marginBottom:4 }}>
                        <Badge label={`Schedule ${item.sch}`} color={schedCol(item.sch)}/>
                        <span style={{ fontFamily:"DM Sans",fontSize:11,color:T.txt3 }}>{item.rule}</span>
                      </div>
                      <div style={{ fontFamily:"DM Sans",fontSize:11.5,color:T.txt2,fontStyle:"italic" }}>{item.ex}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── ALLERGIES ── */}
            {activeSection==="allergy" && (
              <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
                <div style={{ ...glass({borderRadius:12}),padding:"16px 18px" }}>
                  <div style={{ fontFamily:"JetBrains Mono",fontSize:9,color:T.gold,textTransform:"uppercase",letterSpacing:2,marginBottom:12 }}>DOCUMENTED DRUG ALLERGIES</div>
                  {patientAllergies.length === 0 ? (
                    <div style={{ fontFamily:"DM Sans",fontSize:13,color:T.txt3,fontStyle:"italic" }}>NKDA — No Known Drug Allergies</div>
                  ) : (
                    <div style={{ display:"flex",flexWrap:"wrap",gap:6,marginBottom:12 }}>
                      {patientAllergies.map((a,i)=>(
                        <div key={i} style={{ display:"flex",alignItems:"center",gap:6,padding:"6px 12px",borderRadius:20,background:"rgba(255,107,107,0.12)",border:"1px solid rgba(255,107,107,0.35)" }}>
                          <span style={{ fontFamily:"DM Sans",fontWeight:600,fontSize:13,color:T.coral }}>⚠ {a}</span>
                          <button onClick={()=>setPatientAllergies(p=>p.filter((_,j)=>j!==i))} style={{ background:"transparent",border:"none",color:T.txt4,cursor:"pointer",fontSize:11 }}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ display:"flex",gap:8 }}>
                    <input value={newAllergy} onChange={e=>setNewAllergy(e.target.value)}
                      placeholder="Add allergy (e.g., penicillin, sulfonamide, nsaid)…"
                      onKeyDown={e=>{ if(e.key==="Enter"&&newAllergy.trim()){ setPatientAllergies(p=>[...p,newAllergy.trim().toLowerCase()]); setNewAllergy(""); }}}
                      style={{ ...inp(!!newAllergy),flex:1 }} />
                    <button onClick={()=>{ if(newAllergy.trim()){ setPatientAllergies(p=>[...p,newAllergy.trim().toLowerCase()]); setNewAllergy(""); }}}
                      style={{ padding:"9px 18px",borderRadius:9,background:`${T.coral}22`,border:`1px solid ${T.coral}44`,color:T.coral,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"DM Sans",whiteSpace:"nowrap" }}>
                      + Add
                    </button>
                  </div>
                </div>

                <div style={{ ...glass({borderRadius:12}),padding:"16px 18px" }}>
                  <div style={{ fontFamily:"JetBrains Mono",fontSize:9,color:T.orange,textTransform:"uppercase",letterSpacing:2,marginBottom:12 }}>CROSS-REACTIVITY REFERENCE</div>
                  {[
                    {allergy:"Penicillin",crossReactive:"Cephalosporins (~1–2% cross-reactivity — skin test if needed); Carbapenems (~1%); Aztreonam (only with ceftazidime R1 side chain)"},
                    {allergy:"Sulfonamide (antibiotic)",crossReactive:"Non-antibiotic sulfonamides (furosemide, thiazides, sulfonylureas) — NO class cross-reactivity (different mechanisms)"},
                    {allergy:"NSAID / Aspirin",crossReactive:"All COX-1 inhibiting NSAIDs (aspirin-exacerbated respiratory disease); selective COX-2 inhibitors (celecoxib) may be tolerated"},
                    {allergy:"Fluoroquinolone",crossReactive:"Class-wide cross-reactivity likely — avoid all fluoroquinolones"},
                    {allergy:"Cephalosporin",crossReactive:"Other cephalosporins (similar R1 side chain > class-wide risk); penicillins (< 1–2% true cross-reactivity)"},
                  ].map((item,i)=>(
                    <div key={i} style={{ padding:"10px 14px",background:"rgba(14,37,68,0.5)",border:"1px solid rgba(255,159,67,0.15)",borderRadius:9,marginBottom:8 }}>
                      <div style={{ fontFamily:"DM Sans",fontWeight:700,fontSize:13,color:T.orange,marginBottom:4 }}>{item.allergy} Allergy</div>
                      <div style={{ fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.6 }}>{item.crossReactive}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── INTERACTIONS ── */}
            {activeSection==="interact" && (
              <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
                {/* AI DDI status strip */}
                {ddiAiBusy && (
                  <div style={{ ...glass({borderRadius:10,background:"rgba(167,139,250,0.06)",borderColor:"rgba(167,139,250,0.25)"}),padding:"10px 16px",fontFamily:"DM Sans",fontSize:12,color:"#a78bfa",display:"flex",alignItems:"center",gap:8 }}>
                    <span style={{ animation:"pulse 1.5s ease-in-out infinite" }}>⏳</span> AI scanning full medication list for additional interactions…
                  </div>
                )}
                {allInteractions.length === 0 && !ddiAiResult ? (
                  <div style={{ ...glass({borderRadius:14}),padding:"40px",textAlign:"center",color:T.txt4 }}>
                    <div style={{ fontSize:40,marginBottom:10 }}>✅</div>
                    <div style={{ fontFamily:"DM Sans",fontSize:14,color:T.txt2 }}>No drug-drug interactions detected in current prescription pad</div>
                    <div style={{ fontFamily:"DM Sans",fontSize:11,color:T.txt4,marginTop:6 }}>Add prescriptions in the Prescribe tab to check interactions</div>
                  </div>
                ) : (
                  <>
                    {allInteractions.length > 0 && (
                      <div style={{ ...glass({borderRadius:10,background:"rgba(255,107,107,0.06)",borderColor:"rgba(255,107,107,0.25)"}),padding:"12px 16px",fontFamily:"DM Sans",fontSize:12.5,color:T.coral,fontWeight:600 }}>
                        ⚠ {allInteractions.length} Drug-Drug Interaction{allInteractions.length>1?"s":""} Detected — Review Before Transmitting
                      </div>
                    )}
                    {allInteractions.map((ix,i)=>{
                      const c = {critical:T.coral,major:T.orange,moderate:T.gold,minor:T.txt3}[ix.severity]||T.txt3;
                      return (
                        <div key={i} style={{ ...glass({borderRadius:12,background:`${c}08`,borderColor:`${c}33`}),padding:"16px 18px" }}>
                          <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:8 }}>
                            <Badge label={ix.severity.toUpperCase()} color={c}/>
                            <span style={{ fontFamily:"DM Sans",fontWeight:700,fontSize:13,color:T.txt }}>{ix.drug1} + {ix.drug2}</span>
                            {ix.source==="home-med" && <Badge label="HOME MED" color={T.purple}/>}
                          </div>
                          <div style={{ fontFamily:"DM Sans",fontSize:13,color:T.txt2,lineHeight:1.7 }}>{ix.msg}</div>
                        </div>
                      );
                    })}
                    {/* AI-detected interactions beyond hardcoded map */}
                    {ddiAiResult?.length > 0 && (
                      <>
                        <div style={{ ...glass({borderRadius:10,background:"rgba(167,139,250,0.06)",borderColor:"rgba(167,139,250,0.25)"}),padding:"12px 16px",fontFamily:"DM Sans",fontSize:12.5,color:"#a78bfa",fontWeight:600 }}>
                          🤖 {ddiAiResult.length} Additional Interaction{ddiAiResult.length>1?"s":""} Flagged by AI — Review
                        </div>
                        {ddiAiResult.map((ix,i)=>{
                          const c = {critical:T.coral,major:T.orange,moderate:T.gold,minor:T.txt3}[ix.severity]||T.txt3;
                          return (
                            <div key={"ai-"+i} style={{ ...glass({borderRadius:12,background:`${c}08`,borderColor:`${c}33`}),padding:"16px 18px" }}>
                              <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:8 }}>
                                <Badge label={ix.severity.toUpperCase()} color={c}/>
                                <span style={{ fontFamily:"DM Sans",fontWeight:700,fontSize:13,color:T.txt }}>{ix.drug1} + {ix.drug2}</span>
                                <Badge label="AI" color="#a78bfa"/>
                              </div>
                              <div style={{ fontFamily:"DM Sans",fontSize:13,color:T.txt2,lineHeight:1.7 }}>{ix.msg}</div>
                            </div>
                          );
                        })}
                      </>
                    )}
                  </>
                )}
                <div style={{ ...glass({borderRadius:12}),padding:"16px 18px" }}>
                  <div style={{ fontFamily:"JetBrains Mono",fontSize:9,color:T.txt3,textTransform:"uppercase",letterSpacing:2,marginBottom:10 }}>ALL ACTIVE PRESCRIPTIONS — THIS SESSION</div>
                  {signedRx.length === 0 ? (
                    <div style={{ fontFamily:"DM Sans",fontSize:12,color:T.txt4,fontStyle:"italic" }}>No prescriptions signed yet</div>
                  ) : (
                    <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
                      {signedRx.map((p,i)=>(
                        <div key={i} style={{ padding:"5px 12px",borderRadius:20,background:"rgba(59,158,255,0.1)",border:"1px solid rgba(59,158,255,0.25)",fontFamily:"DM Sans",fontWeight:600,fontSize:12,color:T.blue }}>
                          {p.name} {p.rx.form}
                        </div>
                      ))}
                    </div>
                  )}
                  {medications.length > 0 && (
                    <div style={{ marginTop:10,paddingTop:10,borderTop:"1px solid rgba(26,53,85,0.4)" }}>
                      <div style={{ fontFamily:"JetBrains Mono",fontSize:9,color:T.purple,textTransform:"uppercase",letterSpacing:2,marginBottom:6 }}>HOME MEDICATIONS — DDI CHECKED</div>
                      <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
                        {medications.map((m,i)=>(
                          <div key={i} style={{ padding:"4px 10px",borderRadius:20,background:"rgba(167,139,250,0.08)",border:"1px solid rgba(167,139,250,0.2)",fontFamily:"DM Sans",fontSize:11,color:"#a78bfa" }}>{m}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign:"center",padding:"6px",borderTop:"1px solid rgba(26,53,85,0.3)",position:"relative",zIndex:2 }}>
        <span style={{ fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,letterSpacing:2 }}>
          NOTRYA eRx · {DRUGS.length} DRUGS · PDMP ENFORCED · DDI CHECKING · FOR CLINICAL USE — VERIFY ALL PRESCRIPTIONS
        </span>
      </div>
    </div>
  );
}