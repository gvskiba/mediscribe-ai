import { useState, useCallback, useMemo } from "react";

// ── Font IIFE ─────────────────────────────────────────────────────────────────
(function f(){if(document.getElementById("ogh-f"))return;const l=document.createElement("link");l.id="ogh-f";l.rel="stylesheet";l.href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap";document.head.appendChild(l);})();

// ── T tokens ──────────────────────────────────────────────────────────────────
const T={bg:"#050f1e",bgP:"#081628",bgC:"#0b1e36",bgU:"#0e2544",b:"#1a3555",bH:"#2a4f7a",blue:"#3b9eff",teal:"#00e5c0",gold:"#f5c842",purple:"#9b6dff",coral:"#ff6b6b",orange:"#ff9f43",green:"#3dffa0",cyan:"#00d4ff",txt:"#e8f0fe",txt2:"#8aaccc",txt3:"#4a6a8a",txt4:"#2e4a6a"};

// ── Category meta ─────────────────────────────────────────────────────────────
const CATS={
  cardiac: {label:"Cardiac",     icon:"🫀", color:T.coral,  bg:"rgba(255,107,107,.1)",  br:"rgba(255,107,107,.3)"},
  rhythm:  {label:"Arrhythmia",  icon:"⚡", color:T.gold,   bg:"rgba(245,200,66,.08)",  br:"rgba(245,200,66,.3)"},
  pressors:{label:"Vasopressors",icon:"💉", color:T.orange, bg:"rgba(255,159,67,.08)",  br:"rgba(255,159,67,.3)"},
  abx:     {label:"Antibiotics", icon:"🦠", color:T.teal,   bg:"rgba(0,229,192,.08)",   br:"rgba(0,229,192,.3)"},
  sedation:{label:"RSI / Sedation",icon:"😴",color:T.purple,bg:"rgba(155,109,255,.1)",  br:"rgba(155,109,255,.3)"},
  pain:    {label:"Analgesia",   icon:"🩹", color:T.blue,   bg:"rgba(59,158,255,.1)",   br:"rgba(59,158,255,.3)"},
  support: {label:"Supportive",  icon:"⚕", color:T.green,  bg:"rgba(61,255,160,.08)",  br:"rgba(61,255,160,.3)"},
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const BAR="━".repeat(46);
const ts=()=>{const d=new Date();return`${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;};
const fmt=(n)=>Math.round(n).toLocaleString();
const pad=(s,n=12)=>s.padEnd(n," ");
function line(k,v){return`${pad(k+":")} ${v}`;}
function buildBlock(name,rows,note){
  const body=rows.map(([k,v])=>line(k,v)).join("\n");
  return`${BAR}\n${body}${note?`\n${BAR}\n⚠  ${note}`:""}\n${BAR}\n[Notrya Order Generator · ${ts()}]`;
}
async function copyText(t){try{await navigator.clipboard.writeText(t);return true;}catch{const e=document.createElement("textarea");e.value=t;document.body.appendChild(e);e.select();document.execCommand("copy");document.body.removeChild(e);return true;}}

// ── DRUG CATALOG ─────────────────────────────────────────────────────────────
const DRUGS=[
  // ── CARDIAC ────────────────────────────────────────────
  {id:"asa",name:"Aspirin",sub:"ASA 325 mg",cat:"cardiac",cor:"I",icon:"🔴",wtBased:false,scenarios:[
    {label:"ACS Loading Dose",build:()=>buildBlock("Aspirin",[["DRUG","Aspirin (ASA)"],["DOSE","325 mg — CHEW, do not swallow whole"],["ROUTE","Oral (PO)"],["FREQUENCY","Once STAT, then 81 mg daily"],["INDICATION","ACS — STEMI / NSTEMI / UA  [COR I-A  2025 ACC/AHA]"]],"Omit if confirmed aspirin allergy — substitute P2Y₁₂ monotherapy")}
  ]},
  {id:"tica",name:"Ticagrelor",sub:"Brilinta",cat:"cardiac",cor:"I",icon:"🔴",wtBased:false,scenarios:[
    {label:"ACS Load (preferred P2Y₁₂)",build:()=>buildBlock("Ticagrelor",[["DRUG","Ticagrelor (Brilinta)"],["DOSE","180 mg — loading dose"],["ROUTE","PO — swallow whole, do NOT crush"],["FREQUENCY","Once load, then 90 mg BID × 12 months"],["INDICATION","ACS — NSTEMI / STEMI  [COR I-B  2025 ACC/AHA]"]],"Hold if CABG planned within 5 days · Avoid in prior ICH or active bleed")}
  ]},
  {id:"clopi",name:"Clopidogrel",sub:"Plavix",cat:"cardiac",cor:"I",icon:"🔴",wtBased:false,scenarios:[
    {label:"ACS Load (alternative)",build:()=>buildBlock("Clopidogrel",[["DRUG","Clopidogrel (Plavix)"],["DOSE","600 mg — loading dose"],["ROUTE","PO"],["FREQUENCY","Once load, then 75 mg daily"],["INDICATION","ACS when ticagrelor/prasugrel contraindicated  [COR I-B]"]],"Check CYP2C19 metabolizer status — poor metabolizers have reduced efficacy")}
  ]},
  {id:"heparin",name:"Heparin",sub:"UFH — STEMI/PCI",cat:"cardiac",cor:"I",icon:"🩸",wtBased:true,scenarios:[
    {label:"STEMI / PCI",build:(wt)=>{const b=Math.min(fmt(wt*60),4000);const i=fmt(Math.round(wt*12));return buildBlock("Heparin UFH",[["DRUG","Heparin (Unfractionated UFH)"],["DOSE",`${b} units IV bolus  [60 u/kg × ${wt} kg, max 4,000 u]`],["ROUTE","Intravenous push over 3–5 min"],["THEN",`${i} units/hr IV infusion  [12 u/kg/hr × ${wt} kg]`],["INDICATION","STEMI — PCI anticoagulation  [COR I-C  2025]"]],"Monitor ACT during PCI · Target aPTT 50–70 sec post-procedure");}},
    {label:"NSTEMI / Medical Rx",build:(wt)=>{const b=fmt(Math.min(wt*60,5000));const i=fmt(Math.min(Math.round(wt*12),1000));return buildBlock("Heparin UFH",[["DRUG","Heparin (Unfractionated UFH)"],["DOSE",`${b} units IV bolus  [60 u/kg × ${wt} kg, max 5,000 u]`],["ROUTE","Intravenous push"],["THEN",`${i} units/hr IV infusion  [12 u/kg/hr × ${wt} kg, max 1,000 u/hr]`],["INDICATION","NSTEMI / ACS — anticoagulation  [COR I-B]"]],"Titrate per hospital heparin nomogram · Target aPTT 50–70 sec");}},
  ]},
  {id:"enox",name:"Enoxaparin",sub:"Lovenox",cat:"cardiac",cor:"I",icon:"🩸",wtBased:true,scenarios:[
    {label:"NSTEMI Treatment",build:(wt)=>{const d=fmt(wt*1);return buildBlock("Enoxaparin",[["DRUG","Enoxaparin (Lovenox)"],["DOSE",`${d} mg SQ  [1 mg/kg × ${wt} kg]`],["ROUTE","Subcutaneous"],["FREQUENCY","Every 12 hours"],["INDICATION","NSTEMI anticoagulation  [COR I-A  2025]"]],"Reduce to 1 mg/kg daily if CrCl < 30 · Avoid if CrCl < 15 or HD-dependent");}},
  ]},
  {id:"tnk",name:"Tenecteplase",sub:"TNKase",cat:"cardiac",cor:"I",icon:"💉",wtBased:true,scenarios:[
    {label:"STEMI Fibrinolysis",build:(wt)=>{const w=parseFloat(wt)||0;const d=w<60?30:w<70?35:w<80?40:w<90?45:50;const v=d/5;return buildBlock("Tenecteplase",[["DRUG","Tenecteplase (TNKase)"],["DOSE",`${d} mg IV bolus  [weight ${wt} kg — see dosing table]`],["VOLUME",`${v} mL from reconstituted vial (5 mg/mL)`],["ROUTE","Intravenous bolus over 5–10 seconds"],["INDICATION","STEMI — fibrinolysis when PCI unavailable or delay > 120 min  [COR I-A]"]],"ABSOLUTE CI: prior ICH, ischemic stroke < 3 mo, active bleeding, aortic dissection · Verify all contraindications before administration");}},
  ]},
  {id:"statin",name:"Atorvastatin",sub:"Lipitor 80 mg",cat:"cardiac",cor:"I",icon:"💊",wtBased:false,scenarios:[
    {label:"ACS High-Intensity Statin",build:()=>buildBlock("Atorvastatin",[["DRUG","Atorvastatin (Lipitor) — HIGH INTENSITY"],["DOSE","80 mg PO"],["ROUTE","Oral"],["FREQUENCY","Once nightly (initial dose STAT, then nightly)"],["INDICATION","ACS — plaque stabilization and LDL reduction  [COR I-A  2025]"]],"Do not use simvastatin/lovastatin with many ACS medications · Check interactions")}
  ]},
  {id:"metro_iv",name:"Metoprolol",sub:"Lopressor IV",cat:"cardiac",cor:"IIa",icon:"💊",wtBased:false,scenarios:[
    {label:"IV Rate Control / ACS",build:()=>buildBlock("Metoprolol Tartrate",[["DRUG","Metoprolol tartrate (Lopressor)"],["DOSE","5 mg IV slow push"],["ROUTE","Intravenous over 2–5 min"],["FREQUENCY","May repeat q5 min × 3 doses (max 15 mg total)"],["INDICATION","ACS beta-blockade OR rate control — hemodynamically stable  [COR IIa]"]],"CONTRAINDICATED: HR < 60, SBP < 100, active bronchospasm, 2nd/3rd degree AVB, decompensated HF")}
  ]},
  {id:"nitro_sl",name:"Nitroglycerin",sub:"NTG 0.4 mg SL",cat:"cardiac",cor:"I",icon:"💊",wtBased:false,scenarios:[
    {label:"ACS — Sublingual",build:()=>buildBlock("Nitroglycerin",[["DRUG","Nitroglycerin (NTG)"],["DOSE","0.4 mg SL tablet or spray"],["ROUTE","Sublingual"],["FREQUENCY","Repeat q5 min × 3 prn pain; if ongoing pain → IV drip"],["INDICATION","ACS — angina / ongoing chest pain  [COR I-B]"]],"CONTRAINDICATED: SBP < 90, phosphodiesterase inhibitor use within 24–48h, RV infarct (RV MI)")}
  ]},
  // ── RHYTHM ─────────────────────────────────────────────
  {id:"adenosine",name:"Adenosine",sub:"Adenocard",cat:"rhythm",cor:"I",icon:"⚡",wtBased:false,scenarios:[
    {label:"SVT Termination",build:()=>buildBlock("Adenosine",[["DRUG","Adenosine (Adenocard)"],["DOSE","6 mg IV RAPID push"],["ROUTE","Most proximal IV possible — antecubital or central"],["FLUSH","Follow IMMEDIATELY with 20 mL NS rapid flush"],["FREQUENCY","If no conversion in 1–2 min: 12 mg × 1; then 12 mg × 1"],["INDICATION","Stable SVT — diagnosis and termination  [COR I-B  2025 ACLS]"]],"WARN PATIENT: brief asystole, chest pressure, dyspnea — will resolve in < 30 sec · Never use for irregular or pre-excited AFib")}
  ]},
  {id:"diltia",name:"Diltiazem",sub:"Cardizem",cat:"rhythm",cor:"I",icon:"⚡",wtBased:true,scenarios:[
    {label:"AFib Rate Control",build:(wt)=>{const b=fmt(wt*0.25);const b2=fmt(wt*0.35);return buildBlock("Diltiazem",[["DRUG","Diltiazem (Cardizem)"],["DOSE",`${b} mg IV over 2 min  [0.25 mg/kg × ${wt} kg, max 25 mg]`],["ROUTE","Intravenous"],["REPEAT",`If inadequate: ${b2} mg IV in 15 min  [0.35 mg/kg × ${wt} kg, max 35 mg]`],["THEN","Infusion: 5–15 mg/hr titrated to HR < 110 bpm"],["INDICATION","AFib / Aflutter — rate control  [COR I-B]"]],"CONTRAINDICATED: EF < 40%, accessory pathway, WPW · Monitor BP closely — significant vasodilation");}},
  ]},
  {id:"amio_iv",name:"Amiodarone",sub:"Cordarone IV",cat:"rhythm",cor:"IIa",icon:"⚡",wtBased:false,scenarios:[
    {label:"VT / Refractory VF",build:()=>buildBlock("Amiodarone",[["DRUG","Amiodarone (Cordarone)"],["DOSE","150 mg IV over 10 min  (loading dose)"],["ROUTE","Intravenous — GLASS bottle or non-PVC tubing preferred"],["THEN","1 mg/min IV × 6 hours, then 0.5 mg/min × 18 hours"],["INDICATION","Stable VT, refractory VF/pVT  [COR IIa-B  ACLS 2025]"]],"Dilute in D5W · Monitor for QT prolongation, hypotension · Check thyroid/LFTs/PFTs for long-term use")},
    {label:"AFib Conversion",build:()=>buildBlock("Amiodarone",[["DRUG","Amiodarone (Cordarone)"],["DOSE","150 mg IV over 10 min"],["ROUTE","Intravenous"],["THEN","1 mg/min × 6 hr, then 0.5 mg/min × 18 hr (total 1 g/24h)"],["INDICATION","AFib chemical cardioversion — hemodynamically stable  [COR IIb]"]],"Less effective than ibutilide for acute conversion · QT monitoring required · Suboptimal for lone AFib")},
  ]},
  {id:"procain",name:"Procainamide",sub:"Pronestyl",cat:"rhythm",cor:"IIa",icon:"⚡",wtBased:true,scenarios:[
    {label:"Stable Monomorphic VT",build:(wt)=>{const max=fmt(Math.round(wt*17));return buildBlock("Procainamide",[["DRUG","Procainamide (Pronestyl)"],["DOSE",`20–50 mg/min IV until VT suppressed, hypotension, or QRS widens > 50%`],["MAX DOSE",`${max} mg total  [17 mg/kg × ${wt} kg]`],["ROUTE","Intravenous infusion"],["THEN","Maintenance: 1–4 mg/min IV infusion"],["INDICATION","Stable monomorphic VT  [COR IIa-B  ACLS 2025]"]],"AVOID if prolonged QT, HF, severe LV dysfunction · Stop if QRS widens > 50% or BP drops · Preferred over amiodarone for stable VT");}},
  ]},
  {id:"mag",name:"Magnesium",sub:"MgSO₄ IV",cat:"rhythm",cor:"IIb",icon:"⚡",wtBased:false,scenarios:[
    {label:"Torsades de Pointes",build:()=>buildBlock("Magnesium Sulfate",[["DRUG","Magnesium Sulfate (MgSO₄)"],["DOSE","2 g IV over 5–20 min  (cardiac arrest: over 1–2 min)"],["ROUTE","Intravenous"],["THEN","0.5–1 g/hr IV infusion for recurrence"],["INDICATION","Torsades de Pointes (TdP) — first-line  [COR IIb-C  ACLS 2025]"]],"Correct underlying hypokalemia simultaneously · Target Mg level 2.0–2.5 mEq/L · Monitor for loss of DTRs (toxicity)")}
  ]},
  {id:"atropine",name:"Atropine",sub:"IV bradycardia",cat:"rhythm",cor:"I",icon:"⚡",wtBased:false,scenarios:[
    {label:"Symptomatic Bradycardia",build:()=>buildBlock("Atropine",[["DRUG","Atropine Sulfate"],["DOSE","1 mg IV bolus"],["ROUTE","Intravenous push"],["FREQUENCY","Repeat q3–5 min, max 3 mg total (0.04 mg/kg)"],["INDICATION","Symptomatic bradycardia — first-line  [COR I-B  ACLS 2025]"]],"INEFFECTIVE for Mobitz II / complete heart block — proceed immediately to TCP · May paradoxically worsen bradycardia in transplanted hearts")}
  ]},
  // ── VASOPRESSORS ───────────────────────────────────────
  {id:"norepi",name:"Norepinephrine",sub:"Levophed — first-line sepsis",cat:"pressors",cor:"I",icon:"💉",wtBased:true,scenarios:[
    {label:"Septic Shock",build:(wt)=>`${BAR}\nDRUG:        Norepinephrine (Levophed)\nMIX:         4 mg in 250 mL D5W = 16 mcg/mL  OR  8 mg/250 mL = 32 mcg/mL\nSTART DOSE:  ${(wt*0.1).toFixed(1)} mcg/min  [0.1 mcg/kg/min × ${wt} kg]\nTITRATE:     Increase by 0.05–0.1 mcg/kg/min q5–10 min\nRANGE:       0.01–3 mcg/kg/min  (typical 0.1–0.5)\nROUTE:       Central line preferred (peripheral acceptable acutely)\nINDICATION:  Septic shock — first-line vasopressor  [COR I-B  SSC 2021]\n${BAR}\n⚠  Central line/arterial line ASAP · Target MAP ≥ 65 mmHg\n${BAR}\n[Notrya Order Generator · ${ts()}]`},
  ]},
  {id:"epi_inf",name:"Epinephrine",sub:"Infusion",cat:"pressors",cor:"IIa",icon:"💉",wtBased:true,scenarios:[
    {label:"Anaphylaxis — IM",build:()=>buildBlock("Epinephrine",[["DRUG","Epinephrine 1:1,000"],["DOSE","0.3 mg IM (0.3 mL of 1 mg/mL)"],["ROUTE","Intramuscular — anterolateral thigh"],["FREQUENCY","Repeat q5–15 min prn if no improvement"],["INDICATION","Anaphylaxis  [COR I-A  WAO 2020]"]],"Preferred over IV for anaphylaxis · Prepare IV drip if biphasic reaction · Epinephrine auto-injector = 0.3 mg IM")},
    {label:"Bradycardia — Infusion",build:(wt)=>`${BAR}\nDRUG:        Epinephrine Infusion\nMIX:         1 mg in 250 mL NS = 4 mcg/mL\nSTART DOSE:  2 mcg/min  (titrate 2–10 mcg/min)\nROUTE:       Central IV preferred\nINDICATION:  Refractory symptomatic bradycardia after atropine/TCP  [COR IIa-B]\n${BAR}\n[Notrya Order Generator · ${ts()}]`},
  ]},
  {id:"dopa",name:"Dopamine",sub:"Infusion",cat:"pressors",cor:"IIb",icon:"💉",wtBased:true,scenarios:[
    {label:"Cardiogenic Shock",build:(wt)=>`${BAR}\nDRUG:        Dopamine Hydrochloride\nMIX:         400 mg in 250 mL D5W = 1,600 mcg/mL\nSTART DOSE:  ${fmt(wt*5)} mcg/min  [5 mcg/kg/min × ${wt} kg]\nTITRATE:     5–20 mcg/kg/min to desired BP/HR response\nROUTE:       Central line preferred\nINDICATION:  Cardiogenic/distributive shock  [COR IIb]\n${BAR}\n⚠  Norepinephrine preferred in septic shock (less arrhythmia) · High doses (>10 mcg/kg/min) = alpha-dominant vasoconstriction\n${BAR}\n[Notrya Order Generator · ${ts()}]`},
  ]},
  // ── ANTIBIOTICS ────────────────────────────────────────
  {id:"vanc",name:"Vancomycin",sub:"Gram+ / MRSA",cat:"abx",cor:null,icon:"🦠",wtBased:true,scenarios:[
    {label:"Sepsis / SSTI / Pneumonia",build:(wt)=>{const d=fmt(Math.min(Math.round(wt*25),3000));return buildBlock("Vancomycin",[["DRUG","Vancomycin Hydrochloride"],["DOSE",`${d} mg IV  [25 mg/kg × ${wt} kg, max 3,000 mg loading dose]`],["RATE","Infuse over 1–2 hours (no faster than 10 mg/min)"],["FREQUENCY","Q8–12h (renal dosing — see pharmacy)"],["INDICATION","MRSA / gram-positive coverage — sepsis, SSTI, CAP, HAP"]],"Pharmacy AUC/MIC-guided dosing preferred · Draw trough before 4th dose · Reduce dose for CrCl < 50 · Redman syndrome: slow infusion rate");}},
  ]},
  {id:"piptz",name:"Pip-Tazo",sub:"Zosyn",cat:"abx",cor:null,icon:"🦠",wtBased:true,scenarios:[
    {label:"Broad Spectrum — Sepsis",build:(wt)=>buildBlock("Piperacillin-Tazobactam",[["DRUG","Piperacillin-Tazobactam (Zosyn)"],["DOSE","4.5 g IV  (4 g pip / 0.5 g tazo)"],["ROUTE","Intravenous over 30 min  (extended infusion: over 4 hr)"],["FREQUENCY","Q6–8h (Q6h for severe sepsis; adjust for CrCl)"],["INDICATION","Broad spectrum — sepsis, HAP, intra-abdominal, UTI, SSTI"]],"Reduce frequency for CrCl < 40 · Do NOT mix with aminoglycosides in same line · Extended 4-hr infusion increases PK/PD target attainment")},
  ]},
  {id:"cefep",name:"Cefepime",sub:"Maxipime",cat:"abx",cor:null,icon:"🦠",wtBased:false,scenarios:[
    {label:"Febrile Neutropenia / HAP",build:()=>buildBlock("Cefepime",[["DRUG","Cefepime (Maxipime)"],["DOSE","2 g IV"],["ROUTE","Intravenous over 30 min"],["FREQUENCY","Q8h for severe infection; Q12h for mild/moderate"],["INDICATION","Febrile neutropenia, HAP, gram-negative bacteremia, pseudomonal coverage"]],"Neurotoxicity (encephalopathy) reported especially with renal impairment — monitor · Reduce dose for CrCl < 60")},
  ]},
  {id:"ceftx",name:"Ceftriaxone",sub:"Rocephin",cat:"abx",cor:null,icon:"🦠",wtBased:false,scenarios:[
    {label:"CAP / UTI / Meningitis",build:()=>buildBlock("Ceftriaxone",[["DRUG","Ceftriaxone (Rocephin)"],["DOSE","1 g IV  (2 g for meningitis/severe sepsis)"],["ROUTE","Intravenous over 30 min  (IM for simple UTI/CAP)"],["FREQUENCY","Q12h (meningitis) or Daily (CAP, UTI, skin)"],["INDICATION","CAP, UTI, pyelonephritis, meningitis, lyme disease, gonorrhea"]],"AVOID with calcium-containing fluids (Ringer's) simultaneously in same line · Biliary sludge with prolonged use · Safe in renal impairment")},
  ]},
  {id:"azithro",name:"Azithromycin",sub:"Zithromax",cat:"abx",cor:null,icon:"🦠",wtBased:false,scenarios:[
    {label:"CAP Atypical Coverage",build:()=>buildBlock("Azithromycin",[["DRUG","Azithromycin (Zithromax)"],["DOSE","500 mg IV"],["ROUTE","Intravenous over 60 min  (PO equivalent if tolerating)"],["FREQUENCY","Daily"],["INDICATION","CAP atypical coverage (Legionella, Mycoplasma, Chlamydia)"]],"QTc prolongation risk — check baseline EKG · Combine with beta-lactam for hospitalized CAP  [IDSA/ATS guidance] · PO bioavailability ~38%")},
  ]},
  // ── RSI / SEDATION ─────────────────────────────────────
  {id:"etom",name:"Etomidate",sub:"Amidate — RSI",cat:"sedation",cor:null,icon:"😴",wtBased:true,scenarios:[
    {label:"RSI Induction",build:(wt)=>{const d=(wt*0.3).toFixed(1);return buildBlock("Etomidate",[["DRUG","Etomidate (Amidate)"],["DOSE",`${d} mg IV  [0.3 mg/kg × ${wt} kg]`],["ROUTE","Intravenous push over 30–60 sec"],["ONSET","30–60 seconds"],["INDICATION","RSI induction — hemodynamically unstable patients"]],"Single dose — adrenal suppression with repeated dosing · Does NOT provide analgesia — add fentanyl pre-treatment · Myoclonus common but benign");}},
  ]},
  {id:"ketamine",name:"Ketamine",sub:"Ketalar",cat:"sedation",cor:null,icon:"😴",wtBased:true,scenarios:[
    {label:"RSI Induction",build:(wt)=>{const d=(wt*2).toFixed(0);return buildBlock("Ketamine",[["DRUG","Ketamine (Ketalar)"],["DOSE",`${d} mg IV  [1.5–2 mg/kg × ${wt} kg]`],["ROUTE","Intravenous push over 30–60 sec"],["ONSET","30–60 seconds  (IM: 3–5 min at 4–6 mg/kg)"],["INDICATION","RSI induction — hemodynamically unstable, bronchospasm, trauma"]],"Preserves airway reflexes and BP · Emergence phenomena: pretreat with midazolam 0.03 mg/kg · RELATIVE CI: hypertensive emergency, elevated ICP (controversial)");}},
    {label:"Procedural Sedation",build:(wt)=>{const d=(wt*1.5).toFixed(0);return buildBlock("Ketamine",[["DRUG","Ketamine (Ketalar) — Dissociative"],["DOSE",`${d} mg IV  [1–1.5 mg/kg × ${wt} kg]  (IM: ${(wt*4).toFixed(0)} mg)`],["ROUTE","Intravenous push over 1–2 min"],["ONSET","1–2 min IV  (3–5 min IM)"],["DURATION","10–20 min IV"],["INDICATION","Procedural sedation — painful procedures, fracture reduction, I&D"]],"Pre-treat with glycopyrrolate 0.2 mg IV for sialorrhea · Have resuscitation equipment ready · Laryngospasm rare (<1%)");}},
  ]},
  {id:"succs",name:"Succinylcholine",sub:"Anectine — RSI",cat:"sedation",cor:null,icon:"😴",wtBased:true,scenarios:[
    {label:"RSI Paralytic",build:(wt)=>{const d=(wt*1.5).toFixed(0);return buildBlock("Succinylcholine",[["DRUG","Succinylcholine (Anectine)"],["DOSE",`${d} mg IV  [1.5 mg/kg × ${wt} kg]`],["ROUTE","Intravenous push"],["ONSET","45–60 seconds"],["DURATION","6–10 minutes"],["INDICATION","RSI — depolarizing paralytic for rapid sequence intubation"]],"ABSOLUTE CI: hyperkalemia, crush injury/burn > 24h, denervation injury, malignant hyperthermia risk · Check K+ if renal failure · Have sugammadex available for emergent reversal of rocuronium alternative");}},
  ]},
  {id:"roc",name:"Rocuronium",sub:"Zemuron — RSI",cat:"sedation",cor:null,icon:"😴",wtBased:true,scenarios:[
    {label:"RSI Paralytic",build:(wt)=>{const d=(wt*1.2).toFixed(0);const sug=(wt*16).toFixed(0);return buildBlock("Rocuronium",[["DRUG","Rocuronium Bromide (Zemuron)"],["DOSE",`${d} mg IV  [1.2 mg/kg × ${wt} kg]  (high-dose RSI)`],["ROUTE","Intravenous push"],["ONSET","45–60 seconds at high dose"],["DURATION","45–70 minutes"],["REVERSAL",`Sugammadex ${sug} mg IV  [16 mg/kg × ${wt} kg] for immediate reversal`],["INDICATION","RSI — non-depolarizing paralytic  (preferred if succinylcholine CI)"]],"Longer duration than succinylcholine — prolonged paralysis if difficult airway · Keep sugammadex at bedside");}},
  ]},
  {id:"midaz",name:"Midazolam",sub:"Versed — PSA/Sedation",cat:"sedation",cor:null,icon:"😴",wtBased:true,scenarios:[
    {label:"Procedural Sedation",build:(wt)=>{const d=(wt*0.05).toFixed(1);return buildBlock("Midazolam",[["DRUG","Midazolam (Versed)"],["DOSE",`${d} mg IV  [0.05 mg/kg × ${wt} kg]  — titrate to effect`],["ROUTE","Intravenous over 2 min  (IM/IN alternative)"],["FREQUENCY","May repeat 0.025 mg/kg q2–3 min prn, max 0.2 mg/kg total"],["INDICATION","Procedural sedation, anxiolysis, seizure (if lorazepam unavailable)"]],"REVERSAL: flumazenil 0.2 mg IV q1 min × 5 doses · Monitor for respiratory depression · Reduce dose 30% in elderly/hepatic impairment");}},
  ]},
  // ── ANALGESIA ──────────────────────────────────────────
  {id:"fent",name:"Fentanyl",sub:"Sublimaze — analgesia",cat:"pain",cor:null,icon:"🩹",wtBased:true,scenarios:[
    {label:"IV Pain Management",build:(wt)=>{const d=(wt*1).toFixed(0);return buildBlock("Fentanyl Citrate",[["DRUG","Fentanyl Citrate (Sublimaze)"],["DOSE",`${d} mcg IV  [1 mcg/kg × ${wt} kg]`],["ROUTE","Intravenous over 2–3 min"],["FREQUENCY","Titrate q5–10 min prn for pain NRS ≥ 7"],["INDICATION","Moderate–severe acute pain — hemodynamically unstable, renal failure"]],"REVERSAL: naloxone 0.4 mg IV · Preferred over morphine in hypotension/renal failure · Intranasal: 1.5 mcg/kg divided nares");}},
  ]},
  {id:"morph",name:"Morphine",sub:"MS Contin",cat:"pain",cor:null,icon:"🩹",wtBased:false,scenarios:[
    {label:"IV Pain Management",build:()=>buildBlock("Morphine Sulfate",[["DRUG","Morphine Sulfate"],["DOSE","2–4 mg IV  — titrate to effect"],["ROUTE","Intravenous over 2–5 min"],["FREQUENCY","Repeat q15–20 min prn pain NRS ≥ 7"],["INDICATION","Moderate–severe acute pain"]],"REVERSAL: naloxone 0.4 mg IV · AVOID in hypotension, renal failure (active metabolite accumulates) · Histamine release — may cause flushing/pruritus")},
  ]},
  {id:"ketor",name:"Ketorolac",sub:"Toradol",cat:"pain",cor:null,icon:"🩹",wtBased:false,scenarios:[
    {label:"IV / IM Non-opioid Analgesia",build:()=>buildBlock("Ketorolac",[["DRUG","Ketorolac (Toradol)"],["DOSE","15–30 mg IV  (30 mg IM)  — reduce to 15 mg if >65y or <50 kg"],["ROUTE","Intravenous over 2 min  OR  Intramuscular"],["FREQUENCY","Q6h prn, max 5 days total (IV + PO combined)"],["INDICATION","Moderate–severe acute pain — renal colic, MSK, headache"]],"AVOID: CrCl < 30, active GI bleed, aspirin-sensitive asthma, concurrent anticoagulation · NSAID ceiling effect — max dose not more effective")},
  ]},
  {id:"apap",name:"Acetaminophen",sub:"Tylenol / Ofirmev",cat:"pain",cor:null,icon:"🩹",wtBased:true,scenarios:[
    {label:"IV Analgesia / Antipyretic",build:(wt)=>{const d=wt<50?"650 mg":"1,000 mg";return buildBlock("Acetaminophen",[["DRUG","Acetaminophen (Ofirmev / IV Tylenol)"],["DOSE",`${d} IV  [${wt} kg — max 4 g/24h]`],["ROUTE","Intravenous over 15 min"],["FREQUENCY","Q6h scheduled or Q4–6h prn"],["INDICATION","Pain adjunct, antipyretic — safe in renal failure"]],"Max 2 g/24h in hepatic impairment or chronic ETOH · IV preferred over PO in acute setting for predictable levels · Multimodal pain strategy");}},
  ]},
  // ── SUPPORTIVE ─────────────────────────────────────────
  {id:"zofran",name:"Ondansetron",sub:"Zofran",cat:"support",cor:null,icon:"⚕",wtBased:false,scenarios:[
    {label:"Nausea / Vomiting",build:()=>buildBlock("Ondansetron",[["DRUG","Ondansetron (Zofran)"],["DOSE","4 mg IV  (or 8 mg for PONV/chemo-related)"],["ROUTE","Intravenous over 2–5 min  OR  ODT dissolved on tongue"],["FREQUENCY","Q4–6h prn nausea"],["INDICATION","Acute nausea and vomiting — ED, post-procedure, medication-induced"]],"QTc prolongation — avoid if QTc > 480 ms · Serotonin syndrome risk with concurrent serotonergic drugs · 4 mg usually sufficient for most ED presentations")},
  ]},
  {id:"lzp",name:"Lorazepam",sub:"Ativan",cat:"support",cor:null,icon:"⚕",wtBased:true,scenarios:[
    {label:"Seizure / Status Epilepticus",build:(wt)=>{const d=(Math.min(wt*0.1,4)).toFixed(1);return buildBlock("Lorazepam",[["DRUG","Lorazepam (Ativan)"],["DOSE",`${d} mg IV  [0.1 mg/kg × ${wt} kg, max 4 mg]`],["ROUTE","Intravenous over 2 min  (IM if no IV)"],["REPEAT","Repeat × 1 in 5–10 min if seizing"],["INDICATION","Status epilepticus — first-line benzodiazepine  [AES Guideline 2023]"]],"If no IV: use midazolam IM (10 mg for >40 kg) or diazepam rectal · Have airway management ready — respiratory depression risk");}},
  ]},
  {id:"labet",name:"Labetalol",sub:"IV hypertensive emergency",cat:"support",cor:null,icon:"⚕",wtBased:false,scenarios:[
    {label:"Hypertensive Emergency",build:()=>buildBlock("Labetalol",[["DRUG","Labetalol Hydrochloride"],["DOSE","20 mg IV bolus over 2 min"],["ROUTE","Intravenous"],["REPEAT","Double dose q10 min prn: 40 mg → 80 mg (max single 80 mg, cumulative 300 mg)"],["THEN","Infusion: 0.5–2 mg/min IV if repeated boluses needed"],["INDICATION","Hypertensive emergency — aortic dissection, SAH, eclampsia  [AHA/ACC 2024]"]],"AVOID: asthma/COPD, severe bradycardia, acute decompensated HF · Preferred in aortic dissection — controls HR and BP simultaneously")},
  ]},
  {id:"cacl",name:"Calcium Chloride",sub:"10% CaCl₂",cat:"support",cor:null,icon:"⚕",wtBased:false,scenarios:[
    {label:"Hyperkalemia / CCB OD / Cardiac Arrest",build:()=>buildBlock("Calcium Chloride",[["DRUG","Calcium Chloride 10%  (1 g = 13.6 mEq Ca²⁺)"],["DOSE","1 g (10 mL of 10%) IV slow push"],["ROUTE","Intravenous over 5–10 min  (cardiac arrest: over 1–2 min)"],["FREQUENCY","Repeat prn q5–10 min (hyperkalemia / CCB OD)"],["INDICATION","Hyperkalemia, CCB toxicity, HF, ionized hypocalcemia, cardiac arrest"]],"3× more elemental calcium than calcium gluconate (preferred in emergencies) · Central line preferred — vesicant, tissue necrosis if extravasates · Check ionized calcium level")},
  ]},
  {id:"bicarb",name:"Sodium Bicarb",sub:"NaHCO₃",cat:"support",cor:null,icon:"⚕",wtBased:true,scenarios:[
    {label:"Severe Acidosis / TCA / Hyperkalemia",build:(wt)=>{const d=fmt(wt*1);return buildBlock("Sodium Bicarbonate",[["DRUG","Sodium Bicarbonate (NaHCO₃)  8.4% = 1 mEq/mL"],["DOSE",`${d} mEq IV bolus  [1 mEq/kg × ${wt} kg]`],["ROUTE","Intravenous push"],["INDICATION","TCA overdose, severe metabolic acidosis, hyperkalemia, Na-channel blockade"]],"TCA OD: push until QRS narrows to < 100 ms, target pH 7.45–7.55 · Do NOT mix with calcium in same line · Risk of hypernatremia / alkalosis with large doses");}},
  ]},
  {id:"d50",name:"Dextrose 50%",sub:"D50W — hypoglycemia",cat:"support",cor:null,icon:"⚕",wtBased:false,scenarios:[
    {label:"Symptomatic Hypoglycemia",build:()=>buildBlock("Dextrose 50% (D50W)",[["DRUG","Dextrose 50% (D50W)"],["DOSE","25 g IV  (50 mL of D50W)"],["ROUTE","Intravenous — ensure large, patent IV (sclerosing agent)"],["FREQUENCY","Recheck BG in 15 min; repeat if < 70 mg/dL"],["INDICATION","Symptomatic hypoglycemia — altered mental status, seizure, BG < 60 mg/dL"]],"Check thiamine deficiency risk — give thiamine 100 mg IV BEFORE dextrose if malnourished/chronic ETOH · D10 at 250 mL/hr is gentler alternative in less urgent cases")},
  ]},
  {id:"nalox",name:"Naloxone",sub:"Narcan",cat:"support",cor:null,icon:"⚕",wtBased:true,scenarios:[
    {label:"Opioid Reversal",build:(wt)=>buildBlock("Naloxone",[["DRUG","Naloxone (Narcan)"],["DOSE","0.4–2 mg IV/IM/IN  (titrate to respiratory drive, not full reversal)"],["ROUTE","IV preferred; IN: 4 mg per nare  (2 mg/0.1 mL formulation)"],["FREQUENCY","Repeat q2–3 min prn; infusion: 2/3 of effective reversal dose per hour"],["INDICATION","Opioid-induced respiratory depression  (RR < 12, SpO₂ < 92%, unresponsive)"]],"Avoid full reversal in opioid-dependent patients — precipitates acute withdrawal, seizure, pulmonary edema · Duration 30–90 min — shorter than most opioids — WATCH FOR RENARCOTIZATION")},
  ]},
];

// ── SCENARIO QUICK-LAUNCH ─────────────────────────────────────────────────────
const SCENARIOS=[
  {label:"STEMI Bundle",icon:"🫀",color:T.coral,ids:[["asa","ACS Loading Dose"],["tica","ACS Load (preferred P2Y₁₂)"],["heparin","STEMI / PCI"],["statin","ACS High-Intensity Statin"],["metro_iv","IV Rate Control / ACS"]]},
  {label:"NSTEMI Bundle",icon:"🫀",color:T.orange,ids:[["asa","ACS Loading Dose"],["tica","ACS Load (preferred P2Y₁₂)"],["enox","NSTEMI Treatment"],["statin","ACS High-Intensity Statin"]]},
  {label:"Sepsis Bundle",icon:"💉",color:T.teal,ids:[["norepi","Septic Shock"],["vanc","Sepsis / SSTI / Pneumonia"],["piptz","Broad Spectrum — Sepsis"],["apap","IV Analgesia / Antipyretic"]]},
  {label:"RSI Bundle",icon:"😴",color:T.purple,ids:[["fent","IV Pain Management"],["ketamine","RSI Induction"],["succs","RSI Paralytic"]]},
  {label:"Rapid Afib Control",icon:"⚡",color:T.gold,ids:[["diltia","AFib Rate Control"],["metro_iv","IV Rate Control / ACS"]]},
  {label:"Anaphylaxis",icon:"⚠️",color:T.coral,ids:[["epi_inf","Anaphylaxis — IM"],["zofran","Nausea / Vomiting"],["lzp","Seizure / Status Epilepticus"]]},
];

// ── PRIMITIVES ────────────────────────────────────────────────────────────────
const G={
  glass:(e={})=>({background:"rgba(8,22,40,0.65)",border:`1px solid ${T.b}`,borderRadius:12,backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",...e}),
  mono:{fontFamily:"'JetBrains Mono',monospace"},
  serif:{fontFamily:"'Playfair Display',serif"},
  sans:{fontFamily:"'DM Sans',sans-serif"},
};

function Badge({text,color,bg,br}){return<span style={{fontSize:9,...G.mono,fontWeight:700,padding:"2px 7px",borderRadius:20,background:bg||"rgba(59,158,255,.1)",border:`1px solid ${br||"rgba(59,158,255,.3)"}`,color:color||T.blue,whiteSpace:"nowrap"}}>{text}</span>;}

function CopyBtn({text,label="Copy"}){
  const[st,setSt]=useState("idle");
  const go=useCallback(async()=>{await copyText(text);setSt("ok");setTimeout(()=>setSt("idle"),1800);},[text]);
  return<button onClick={go} style={{padding:"5px 12px",borderRadius:7,cursor:"pointer",border:`1px solid ${st==="ok"?"rgba(0,229,192,.5)":T.b}`,background:st==="ok"?"rgba(0,229,192,.12)":"rgba(14,37,68,.5)",color:st==="ok"?T.teal:T.txt2,...G.mono,fontSize:10,fontWeight:700,transition:"all .2s"}}>{st==="ok"?"✓ Copied":label}</button>;
}

function DrugCard({drug,wt,onAdd}){
  const[scIdx,setScIdx]=useState(0);
  const sc=drug.scenarios[scIdx];
  const cat=CATS[drug.cat];
  return(
    <div style={{...G.glass({borderRadius:10,padding:"12px 14px"}),borderTop:`2px solid ${cat.color}`}}>
      <div style={{display:"flex",alignItems:"flex-start",gap:8,marginBottom:8}}>
        <span style={{fontSize:18,lineHeight:1}}>{drug.icon}</span>
        <div style={{flex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
            <span style={{fontSize:13,fontWeight:700,color:T.txt,...G.serif}}>{drug.name}</span>
            {drug.sub&&<span style={{fontSize:10,color:T.txt3}}>{drug.sub}</span>}
            {drug.cor&&<Badge text={`COR ${drug.cor}`} color={drug.cor==="I"?T.teal:T.blue} bg={drug.cor==="I"?"rgba(0,229,192,.1)":"rgba(59,158,255,.1)"} br={drug.cor==="I"?"rgba(0,229,192,.3)":"rgba(59,158,255,.3)"}/>}
            {drug.wtBased&&<Badge text="Wt-Based" color={T.gold} bg="rgba(245,200,66,.1)" br="rgba(245,200,66,.3)"/>}
          </div>
        </div>
      </div>
      {drug.scenarios.length>1&&<div style={{display:"flex",gap:4,marginBottom:8,flexWrap:"wrap"}}>
        {drug.scenarios.map((s,i)=><button key={i} onClick={()=>setScIdx(i)} style={{padding:"3px 8px",borderRadius:5,cursor:"pointer",border:`1px solid ${scIdx===i?cat.br:T.b}`,background:scIdx===i?cat.bg:"transparent",color:scIdx===i?cat.color:T.txt3,...G.sans,fontSize:10}}>{s.label}</button>)}
      </div>}
      <div style={{display:"flex",gap:6,justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:10,color:T.txt3}}>{sc.label}</span>
        <div style={{display:"flex",gap:5}}>
          <CopyBtn text={sc.build(parseFloat(wt)||70)} label="Copy"/>
          <button onClick={()=>onAdd(drug,sc)} style={{padding:"5px 12px",borderRadius:7,cursor:"pointer",border:`1px solid ${cat.br}`,background:cat.bg,color:cat.color,...G.mono,fontSize:10,fontWeight:700}}>+ Pad</button>
        </div>
      </div>
    </div>
  );
}

function OrderItem({item,idx,onRemove}){
  return(
    <div style={{...G.glass({borderRadius:8,padding:"10px 12px"}),marginBottom:6}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
        <span style={{fontSize:11,fontWeight:700,color:T.txt,...G.serif}}>#{idx+1} · {item.drug.name} — {item.sc.label}</span>
        <div style={{display:"flex",gap:5}}>
          <CopyBtn text={item.text} label="Copy"/>
          <button onClick={()=>onRemove(idx)} style={{padding:"4px 8px",borderRadius:5,cursor:"pointer",border:`1px solid ${T.b}`,background:"transparent",color:T.txt3,...G.mono,fontSize:10}}>✕</button>
        </div>
      </div>
      <pre style={{fontSize:10,...G.mono,color:T.txt3,whiteSpace:"pre-wrap",wordBreak:"break-word",lineHeight:1.6,margin:0,padding:"8px 10px",background:"rgba(4,13,25,.6)",borderRadius:6,border:`1px solid ${T.b}`,overflow:"auto",maxHeight:180}}>{item.text}</pre>
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function OrderGeneratorHub(){
  const[wt,setWt]=useState("");
  const[catTab,setCatTab]=useState("all");
  const[search,setSearch]=useState("");
  const[orders,setOrders]=useState([]);
  const[copyAllSt,setCopyAllSt]=useState("idle");
  const[showPad,setShowPad]=useState(true);

  const filteredDrugs=useMemo(()=>{
    let list=DRUGS;
    if(catTab!=="all")list=list.filter(d=>d.cat===catTab);
    if(search.trim()){const q=search.trim().toLowerCase();list=list.filter(d=>d.name.toLowerCase().includes(q)||d.sub?.toLowerCase().includes(q)||d.cat.includes(q));}
    return list;
  },[catTab,search]);

  const addOrder=useCallback((drug,sc)=>{
    const w=parseFloat(wt)||70;
    const text=sc.build(w);
    setOrders(p=>[...p,{drug,sc,text,id:Date.now()}]);
    setShowPad(true);
  },[wt]);

  const removeOrder=useCallback(idx=>setOrders(p=>p.filter((_,i)=>i!==idx)),[]);

  const copyAll=useCallback(async()=>{
    if(!orders.length)return;
    const text=orders.map((o,i)=>`// ORDER ${i+1}: ${o.drug.name}\n${o.text}`).join("\n\n");
    await copyText(text);
    setCopyAllSt("ok");
    setTimeout(()=>setCopyAllSt("idle"),2000);
  },[orders]);

  const applyScenario=useCallback(sc=>{
    const w=parseFloat(wt)||70;
    const newOrders=sc.ids.map(([drugId,scLabel])=>{
      const drug=DRUGS.find(d=>d.id===drugId);
      if(!drug)return null;
      const scenario=drug.scenarios.find(s=>s.label===scLabel)||drug.scenarios[0];
      return{drug,sc:scenario,text:scenario.build(w),id:Date.now()+Math.random()};
    }).filter(Boolean);
    setOrders(p=>[...p,...newOrders]);
    setShowPad(true);
  },[wt]);

  return(
    <div style={{fontFamily:"'DM Sans',sans-serif",color:T.txt,minHeight:"100%",padding:"0 0 40px"}}>

      {/* ── Header ── */}
      <div style={{...G.glass({borderRadius:14,padding:"16px 20px",marginBottom:14,borderLeft:`3px solid ${T.coral}`}),boxShadow:`0 4px 24px rgba(0,0,0,0.4), 0 0 20px rgba(255,107,107,.08)`}}>
        <div style={{display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
          <div style={{width:44,height:44,borderRadius:12,background:"rgba(255,107,107,.12)",border:"1px solid rgba(255,107,107,.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>📋</div>
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap"}}>
              <span style={{...G.serif,fontSize:20,fontWeight:700,color:T.txt}}>Order Text Generator</span>
              <Badge text="CPOE BRIDGE" color={T.teal} bg="rgba(0,229,192,.08)" br="rgba(0,229,192,.28)"/>
              <Badge text="PASTE INTO EPIC / CERNER" color={T.gold} bg="rgba(245,200,66,.08)" br="rgba(245,200,66,.28)"/>
            </div>
            <div style={{fontSize:11,color:T.txt3}}>Generate structured order text · Copy and paste directly into your CPOE · All doses evidence-based</div>
          </div>
          {/* Weight input */}
          <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
            <span style={{fontSize:11,color:T.txt3,...G.mono}}>Wt (kg)</span>
            <input type="number" inputMode="decimal" value={wt} onChange={e=>setWt(e.target.value)} placeholder="e.g. 75"
              style={{width:72,background:"rgba(14,37,68,.7)",border:`1px solid ${wt?T.coral:T.b}`,borderRadius:7,padding:"7px 10px",color:T.txt,...G.mono,fontSize:14,fontWeight:700,outline:"none",textAlign:"center"}}/>
            {wt&&<span style={{fontSize:10,color:T.coral,...G.mono,fontWeight:700}}>{parseFloat(wt)||0} kg</span>}
          </div>
        </div>
        {!wt&&<div style={{marginTop:10,padding:"6px 12px",borderRadius:7,background:"rgba(245,200,66,.07)",border:"1px solid rgba(245,200,66,.2)",fontSize:11,color:T.gold}}>⚠ Enter patient weight above to enable weight-based dosing calculations</div>}
      </div>

      {/* ── Quick Scenarios ── */}
      <div style={{marginBottom:14}}>
        <div style={{fontSize:9,...G.mono,fontWeight:700,color:T.txt3,textTransform:"uppercase",letterSpacing:".1em",marginBottom:7}}>Quick Bundle Launch</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {SCENARIOS.map(sc=>(
            <button key={sc.label} onClick={()=>applyScenario(sc)}
              style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:20,cursor:"pointer",border:`1px solid ${sc.color}44`,background:`${sc.color}12`,color:sc.color,...G.sans,fontSize:11,fontWeight:600,transition:"all .15s"}}>
              <span>{sc.icon}</span>{sc.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr",gap:14}}>

        {/* ── Drug Catalog ── */}
        <div>
          {/* Category tabs + search */}
          <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap",alignItems:"center"}}>
            <div style={{display:"flex",gap:4,background:"rgba(8,22,40,.65)",border:`1px solid ${T.b}`,borderRadius:8,padding:3,backdropFilter:"blur(12px)",overflowX:"auto"}}>
              <button onClick={()=>setCatTab("all")} style={{padding:"5px 10px",borderRadius:6,cursor:"pointer",...G.sans,fontSize:11,fontWeight:catTab==="all"?700:500,background:catTab==="all"?"rgba(59,158,255,.15)":"transparent",border:catTab==="all"?`1px solid rgba(59,158,255,.4)`:"1px solid transparent",color:catTab==="all"?T.blue:T.txt3,whiteSpace:"nowrap"}}>All</button>
              {Object.entries(CATS).map(([k,c])=>(
                <button key={k} onClick={()=>setCatTab(k)} style={{padding:"5px 10px",borderRadius:6,cursor:"pointer",...G.sans,fontSize:11,fontWeight:catTab===k?700:500,background:catTab===k?c.bg:"transparent",border:catTab===k?`1px solid ${c.br}`:"1px solid transparent",color:catTab===k?c.color:T.txt3,whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:4}}>
                  <span>{c.icon}</span>{c.label}
                </button>
              ))}
            </div>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search drug…"
              style={{flex:"1 1 140px",background:"rgba(14,37,68,.5)",border:`1px solid ${T.b}`,borderRadius:7,padding:"6px 10px",color:T.txt,...G.sans,fontSize:12,outline:"none"}}/>
            {search&&<button onClick={()=>setSearch("")} style={{padding:"5px 8px",borderRadius:6,border:`1px solid ${T.b}`,background:"transparent",color:T.txt3,cursor:"pointer",fontSize:11}}>✕</button>}
          </div>

          {/* Drug grid */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(310px,1fr))",gap:8}}>
            {filteredDrugs.map(d=><DrugCard key={d.id} drug={d} wt={wt} onAdd={addOrder}/>)}
          </div>
          {filteredDrugs.length===0&&<div style={{textAlign:"center",padding:"40px 0",color:T.txt3,fontSize:13}}>No drugs match "{search}"</div>}
        </div>

        {/* ── Order Pad ── */}
        <div>
          <div style={{...G.glass({borderRadius:12,padding:"14px 16px"})}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:orders.length?12:0}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{...G.serif,fontSize:15,fontWeight:700,color:T.txt}}>Order Pad</span>
                {orders.length>0&&<span style={{fontSize:10,...G.mono,fontWeight:700,padding:"2px 7px",borderRadius:20,background:"rgba(255,107,107,.12)",border:"1px solid rgba(255,107,107,.3)",color:T.coral}}>{orders.length} order{orders.length!==1?"s":""}</span>}
              </div>
              <div style={{display:"flex",gap:5}}>
                {orders.length>0&&<>
                  <button onClick={copyAll} style={{padding:"5px 12px",borderRadius:7,cursor:"pointer",border:`1px solid ${copyAllSt==="ok"?"rgba(0,229,192,.5)":"rgba(59,158,255,.3)"}`,background:copyAllSt==="ok"?"rgba(0,229,192,.12)":"rgba(59,158,255,.1)",color:copyAllSt==="ok"?T.teal:T.blue,...G.mono,fontSize:10,fontWeight:700}}>{copyAllSt==="ok"?"✓ All Copied":"Copy All"}</button>
                  <button onClick={()=>setOrders([])} style={{padding:"5px 10px",borderRadius:7,cursor:"pointer",border:`1px solid ${T.b}`,background:"transparent",color:T.txt3,...G.mono,fontSize:10}}>Clear</button>
                </>}
              </div>
            </div>
            {orders.length===0
              ?<div style={{textAlign:"center",padding:"28px 0",color:T.txt4,fontSize:12}}>No orders yet · Click <strong style={{color:T.txt3}}>+ Pad</strong> on any drug or use a Bundle above</div>
              :<div>{orders.map((o,i)=><OrderItem key={o.id} item={o} idx={i} onRemove={removeOrder}/>)}</div>
            }
          </div>
        </div>
      </div>
    </div>
  );
}