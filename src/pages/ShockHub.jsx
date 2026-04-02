import { useState, useCallback, useMemo } from "react";

// ── Font + CSS Injection ─────────────────────────────────────────
(() => {
  if (document.getElementById("shock-fonts")) return;
  const l = document.createElement("link"); l.id = "shock-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "shock-css";
  s.textContent = `
    *{box-sizing:border-box;margin:0;padding:0;}
    ::-webkit-scrollbar{width:3px;height:3px;}
    ::-webkit-scrollbar-track{background:transparent;}
    ::-webkit-scrollbar-thumb{background:rgba(42,79,122,0.5);border-radius:2px;}
    @keyframes fadeSlide{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
    @keyframes barFill{from{width:0}to{width:var(--w)}}
    .fade-in{animation:fadeSlide .22s ease forwards;}
    .shimmer-text{background:linear-gradient(90deg,#e8f0fe 0%,#fff 28%,#ff9f43 50%,#ff6b6b 68%,#e8f0fe 100%);background-size:250% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 5s linear infinite;}
    .crit-pulse{animation:pulse 1.5s ease-in-out infinite;}
    .shock-card{transition:border-color .15s,transform .12s;}
    .shock-card:hover{transform:translateY(-1px);}
    .rush-tab:hover{background:rgba(0,229,192,0.07)!important;}
    .pressor-row:hover{background:rgba(22,45,79,0.5)!important;cursor:pointer;}
    input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;}
  `;
  document.head.appendChild(s);
})();

// ── Design Tokens ─────────────────────────────────────────────────
const T = {
  bg:"#050f1e", panel:"#081628", card:"#0b1e36", up:"#0e2544",
  b:"rgba(26,53,85,0.8)", bhi:"rgba(42,79,122,0.9)",
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

// ── Shock Type Data ───────────────────────────────────────────────
const SHOCK_TYPES = [
  { id:"distributive", label:"Distributive", icon:"🔥", color:T.coral,
    subtypes:["Septic (most common)","Anaphylactic","Neurogenic / Spinal","Hepatic failure","Toxic shock"],
    hemo:{ co:"↑↑ (hyperdynamic early) / ↓ (late)", svr:"↓↓ Low", cvp:"↓ or normal", pcwp:"↓ or normal", svo2:"↑ (maldistribution)", hr:"↑↑ Tachycardia", skin:"Warm + flushed (early) → cold + mottled (late)" },
    mechanism:"Massive systemic vasodilation → relative hypovolemia + maldistribution of blood flow despite normal or elevated cardiac output. Tissue cannot use O₂ (mitochondrial dysfunction in late sepsis).",
    redflags:["Fever > 38.3°C or < 36°C + hypotension","Urticarial rash + bronchospasm + hypotension (anaphylaxis)","Bradycardia + hypotension after spinal injury (neurogenic)","Skin warm despite MAP < 65"],
    firstSteps:["Volume resuscitation: 30 mL/kg crystalloid (sepsis)","Norepinephrine 0.1–0.2 mcg/kg/min — start immediately for MAP < 65","Blood cultures × 2 before antibiotics (do not delay antibiotics > 1h)","Epinephrine 0.3–0.5 mg IM for anaphylaxis → IV infusion if refractory","Target: MAP ≥ 65, lactate < 2 mmol/L, UO > 0.5 mL/kg/hr"],
    vasopressor:"Norepinephrine → Vasopressin → Epinephrine",
  },
  { id:"cardiogenic", label:"Cardiogenic", icon:"💔", color:T.red,
    subtypes:["Acute MI (most common — LMCA, proximal LAD)","Acute decompensated HF","Myocarditis / cardiomyopathy","Dysrhythmia (VT, VF, bradycardia)","Acute valvular dysfunction (MR, AR)"],
    hemo:{ co:"↓↓ Low", svr:"↑↑ High (compensatory)", cvp:"↑ High", pcwp:"↑↑ > 18 mmHg (wet lung)", svo2:"↓ High O₂ extraction", hr:"↑ Tachycardia (usually)", skin:"Cold, clammy, mottled, pale" },
    mechanism:"Primary pump failure → ↓CO → ↓MAP → compensatory vasoconstriction (↑SVR) + fluid retention (↑CVP) → pulmonary congestion. Spiral: ↓CO → ↑LV filling pressure → pulmonary edema → ↓O₂ → myocardial ischemia.",
    redflags:["SBP < 90 + pulmonary edema (wet + cold = cardiogenic shock)","New S3 gallop, pulmonary rales, JVD","Acute ECG changes (STEMI, LBBB) + hypotension","Echo: EF < 30%, dilated LV, regional wall motion abnormalities"],
    firstSteps:["Emergent revascularization (PCI) for STEMI — door-to-balloon < 90 min","Norepinephrine to maintain MAP ≥ 65 (avoids pure vasoconstriction that worsens CO)","Dobutamine 2.5–10 mcg/kg/min for inotropy — add to norepinephrine","Avoid aggressive fluids — already preload-independent, will worsen pulmonary edema","Consider IABP, Impella, ECMO for refractory cardiogenic shock"],
    vasopressor:"Norepinephrine + Dobutamine (dual agent), Milrinone for RV failure",
  },
  { id:"obstructive", label:"Obstructive", icon:"🚧", color:T.purple,
    subtypes:["Tension pneumothorax (most acute)","Cardiac tamponade (Beck's triad)","Massive pulmonary embolism","Severe auto-PEEP (ventilated patient)"],
    hemo:{ co:"↓↓ Low", svr:"↑↑ High", cvp:"↑↑ High (distended neck veins)", pcwp:"Varies by site of obstruction", svo2:"↓", hr:"↑↑ Compensatory", skin:"Cool, mottled — may have JVD" },
    mechanism:"Mechanical obstruction to cardiac filling or outflow → ↓CO. NOT a volume or pump problem — removing the obstruction is the treatment. Vasopressors are temporizing only.",
    redflags:["JVD + hypotension + absent unilateral breath sounds (tension PTX)","Beck's triad: hypotension + JVD + muffled heart sounds (tamponade)","Pulsus paradoxus > 10 mmHg (tamponade)","S1Q3T3 / RV strain on ECG + hypotension (massive PE)","Electrical alternans on ECG (tamponade)"],
    firstSteps:["Tension PTX → immediate needle decompression 2nd ICS MCL → finger thoracostomy","Cardiac tamponade → pericardiocentesis (ultrasound-guided preferred)","Massive PE → IV tPA 100mg/2h (50mg bolus if arrest) or catheter-directed","Vasopressors temporize only — norepinephrine while preparing definitive treatment","RUSH exam: pericardial effusion + diastolic RV collapse + plethoric IVC → tamponade"],
    vasopressor:"Norepinephrine (bridge only) — TREAT THE OBSTRUCTION",
  },
  { id:"hypovolemic", label:"Hypovolemic", icon:"🩸", color:T.orange,
    subtypes:["Hemorrhagic (trauma, GI bleed, AAA rupture, ectopic)","Plasma loss (burns, pancreatitis)","GI losses (severe vomiting, diarrhea)","Renal losses (DKA, DI, diuretics)","Third-spacing (bowel obstruction, sepsis)"],
    hemo:{ co:"↓↓ Low", svr:"↑↑ High (compensatory)", cvp:"↓↓ Low", pcwp:"↓↓ Low", svo2:"↓", hr:"↑↑ Compensatory tachycardia", skin:"Cold, clammy, pale — flat neck veins" },
    mechanism:"Intravascular volume depletion → ↓preload → ↓CO. Compensatory tachycardia and vasoconstriction temporarily maintain MAP. When compensation fails: decompensated shock.",
    redflags:["Trauma + hypotension + tachycardia = hemorrhagic shock until proven otherwise","Positive FAST (free fluid in abdomen/pelvis) = operative abdomen","Shock index > 1.0 (HR/SBP > 1) = significant hemorrhage","Class III–IV hemorrhage: > 30% blood loss — immediate massive transfusion activation"],
    firstSteps:["Massive hemorrhage: activate MTP (1:1:1 pRBC:FFP:Platelets), minimize crystalloid","Permissive hypotension in penetrating trauma: target MAP 50–65 until hemorrhage controlled","Non-hemorrhagic: 30 mL/kg crystalloid bolus, reassess after each liter","Identify source: FAST, CXR, DRE, NG aspirate — treat the source","Tranexamic acid 1g IV over 10 min (hemorrhagic shock, give within 3 hours of injury)"],
    vasopressor:"Volume FIRST — vasopressors as bridge if MAP critical. Norepinephrine if needed.",
  },
];

// ── Vasopressor Data ──────────────────────────────────────────────
const PRESSORS = [
  { id:"norepi", name:"Norepinephrine", brand:"Levophed", tier:1, color:T.red,
    class:"Catecholamine", receptors:"α1 >>> β1",
    startDose:"0.01–0.1 mcg/kg/min", rangeDose:"0.01–3 mcg/kg/min",
    titrate:"↑ 0.05 mcg/kg/min q5–15 min", maxDose:"No hard ceiling — clinical response guides",
    calcStart:w=>w*0.05, calcMax:w=>w*3,
    conc:"4–8 mg/250 mL NS (16–32 mcg/mL)", preferredFor:"Septic, distributive, any vasodilatory shock",
    effects:{ map:"↑↑↑", hr:"0 / ↓ reflex", co:"↑ mild (β1)", svr:"↑↑↑", contractility:"↑ mild" },
    indications:["Septic shock — SSC 2021 first-line vasopressor","All forms of distributive shock","Cardiogenic shock with vasoplegia","Bridge while treating obstructive shock"],
    cautions:["Extravasation → tissue necrosis — central line strongly preferred","Peripheral IV > 18g acceptable short-term in emergencies with frequent monitoring","High doses cause splanchnic and limb ischemia — monitor distal perfusion","Sinus tachycardia may persist despite MAP restoration (catecholamine effect)"],
    pearl:"First-line for distributive shock. At doses > 0.25 mcg/kg/min, consider adding vasopressin (steroid-sparing, norepinephrine-sparing). At doses > 0.5 mcg/kg/min = high-dose shock — consider ECMO discussion.",
    badge:"1ST LINE", badgeColor:T.red },
  { id:"vasopressin", name:"Vasopressin", brand:"Pitressin", tier:2, color:T.purple,
    class:"Non-catecholamine (AVP agonist)", receptors:"V1 (vasoconstriction) + V2 (antidiuresis)",
    startDose:"0.03 units/min fixed (not weight-based)", rangeDose:"0.01–0.04 units/min",
    titrate:"NOT titrated — fixed dose adjunct", maxDose:"0.04 units/min (higher doses = intestinal / cardiac ischemia)",
    calcStart:_=>"0.03 units/min", calcMax:_=>"0.04 units/min",
    conc:"20 units/100 mL (0.2 units/mL)", preferredFor:"Adjunct to norepinephrine in septic shock",
    effects:{ map:"↑↑", hr:"↓ mild reflex", co:"0 / ↓ mild", svr:"↑↑", contractility:"0" },
    indications:["Second-line adjunct to norepinephrine (not titrated)","Vasopressin-deficient states (relative deficiency in late septic shock)","Norepinephrine-sparing — add at 0.03 units/min to reduce NE requirements","Catecholamine-refractory shock"],
    cautions:["FIXED dose — NOT titrated above 0.04 units/min","Mesenteric / digital / hepatic ischemia at high doses","Does NOT provide inotropy — do not use as sole vasopressor in cardiogenic shock","Hyponatremia risk (V2 receptor antidiuretic effect)"],
    pearl:"Add at 0.03 units/min when norepinephrine > 0.25 mcg/kg/min. Fixed dose, not titrated. Reduces catecholamine requirements and may improve renal blood flow at low doses. VANISH trial: vasopressin-first non-inferior to NE for 28-day mortality in septic shock.",
    badge:"2ND LINE ADJUNCT", badgeColor:T.purple },
  { id:"epi", name:"Epinephrine", brand:"Adrenaline", tier:3, color:T.coral,
    class:"Catecholamine", receptors:"α1, α2, β1, β2 (all receptors)",
    startDose:"0.01–0.1 mcg/kg/min", rangeDose:"0.01–1 mcg/kg/min",
    titrate:"↑ 0.05 mcg/kg/min q5 min (rapid titration in anaphylaxis)", maxDose:"No defined maximum",
    calcStart:w=>w*0.05, calcMax:w=>w*1,
    conc:"4 mg/250 mL (16 mcg/mL)", preferredFor:"Refractory septic shock, anaphylaxis, cardiogenic shock with low CO",
    effects:{ map:"↑↑↑", hr:"↑↑ Tachycardia", co:"↑↑ (β1)", svr:"↑↑ (α1)", contractility:"↑↑" },
    indications:["Anaphylaxis — IM 0.3–0.5 mg first-line, then IV infusion if refractory","Third-line vasopressor for refractory septic shock (after NE + vasopressin)","Cardiogenic shock requiring both vasoconstriction AND inotropy","Cardiac arrest (ACLS)","Refractory bradycardia"],
    cautions:["Significant tachycardia — worsens myocardial oxygen demand","Increased lactate production (β2 effect on muscles) — confounds lactate-guided therapy","Lactic acidosis from epinephrine ≠ hypoperfusion — distinguish clinically","High arrhythmia risk"],
    pearl:"Dual α + β effects make it the most potent resuscitative vasopressor. Epinephrine-driven hyperlactatemia is common and does NOT necessarily represent worsening perfusion. Distinguish from sepsis-induced lactic acidosis by clinical context.",
    badge:"3RD LINE / ANAPHYLAXIS", badgeColor:T.coral },
  { id:"dopamine", name:"Dopamine", brand:"Intropin", tier:4, color:T.yellow,
    class:"Catecholamine (precursor)", receptors:"D1/D2 (low), β1 (mid), α1 (high)",
    startDose:"2–5 mcg/kg/min (β-dominant)", rangeDose:"2–20 mcg/kg/min",
    titrate:"Dose-dependent receptor profile", maxDose:"20 mcg/kg/min",
    calcStart:w=>w*5, calcMax:w=>w*20,
    conc:"200 mg/250 mL (800 mcg/mL)", preferredFor:"Bradycardia + hypotension (historical); now rarely first-line",
    effects:{ map:"↑↑", hr:"↑↑ (more arrhythmias than NE)", co:"↑ (β1 mid-dose)", svr:"↑ (high dose)", contractility:"↑ moderate" },
    indications:["Bradycardia with hemodynamic compromise when atropine insufficient (off-label)","Symptomatic bradycardia before transvenous pacing","Historical septic shock first-line — NOW REPLACED by norepinephrine"],
    cautions:["More arrhythmias than norepinephrine (De Backer NEJM 2010 — NE superior for 28-day mortality)","No longer first-line for septic shock","Dopaminergic 'renal-dose' (1–3 mcg/kg/min) does NOT protect kidneys — ABANDONED","Avoid in ischemic heart disease if possible"],
    pearl:"NEJM 2010 (De Backer): dopamine vs norepinephrine in shock — norepinephrine had significantly fewer arrhythmias and lower 28-day mortality in cardiogenic shock subgroup. Norepinephrine is now preferred over dopamine for virtually all indications.",
    badge:"LARGELY REPLACED BY NE", badgeColor:T.yellow },
  { id:"phenylephrine", name:"Phenylephrine", brand:"Neo-Synephrine", tier:4, color:T.blue,
    class:"Catecholamine (selective)", receptors:"Pure α1 agonist",
    startDose:"0.5–2 mcg/kg/min", rangeDose:"0.5–6 mcg/kg/min",
    titrate:"↑ 0.5–1 mcg/kg/min q5–15 min", maxDose:"6 mcg/kg/min",
    calcStart:w=>w*1, calcMax:w=>w*6,
    conc:"100 mg/250 mL (400 mcg/mL)", preferredFor:"Neurogenic/spinal shock, WPW + AF with hypotension",
    effects:{ map:"↑↑", hr:"↓ reflex bradycardia", co:"↓ (no inotropy)", svr:"↑↑↑", contractility:"0" },
    indications:["Neurogenic (spinal) shock — bradycardia + hypotension, no inotropy needed","SVT with hypotension (reflex bradycardia terminates some SVT)","WPW + AF — avoids AV-nodal blockers","Intraoperative hypotension (anesthesia)","As alternative when tachycardia with norepinephrine is poorly tolerated"],
    cautions:["REDUCES cardiac output — avoid in cardiogenic shock","Reflex bradycardia may be problematic in compensatory tachycardia","Does NOT improve inotropy — CO falls with pure α1 constriction if heart is failing","Peripheral ischemia at high doses"],
    pearl:"The only pure α1 vasopressor. Useful when tachycardia is the problem (WPW + AF, where AV nodal blockers are contraindicated). Avoid in any state where CO is already compromised.",
    badge:"PURE α1 — NO INOTROPY", badgeColor:T.blue },
  { id:"dobutamine", name:"Dobutamine", brand:"Dobutrex", tier:2, color:T.teal,
    class:"Catecholamine (inotrope)", receptors:"β1 >>> β2",
    startDose:"2.5–5 mcg/kg/min", rangeDose:"2.5–20 mcg/kg/min",
    titrate:"↑ 2.5 mcg/kg/min q10 min, guided by CO/ScvO₂", maxDose:"20 mcg/kg/min",
    calcStart:w=>w*5, calcMax:w=>w*20,
    conc:"250 mg/250 mL (1 mg/mL = 1000 mcg/mL)", preferredFor:"Cardiogenic shock — add to norepinephrine for inotropy",
    effects:{ map:"↑ mild / 0", hr:"↑ tachycardia (limit)", co:"↑↑↑", svr:"↓ mild (β2)", contractility:"↑↑↑" },
    indications:["Cardiogenic shock — inotropic support (add to vasopressor)","Acute decompensated HF with low output and high filling pressures","Stress testing (pharmacologic dobutamine stress echo)","Bridge to definitive intervention (PCI, LVAD, transplant)"],
    cautions:["Tachycardia limits use — HR > 120 may worsen ischemia","Hypotension (peripheral vasodilation via β2) — always combine with norepinephrine","Arrhythmogenic — VT/AF risk","Increases myocardial O₂ demand — avoid in ischemia when possible"],
    pearl:"NEVER use dobutamine alone in cardiogenic shock — it will drop MAP via β2 vasodilation. Always combine with norepinephrine to maintain MAP ≥ 65 while improving CO.",
    badge:"INOTROPE — CARDIOGENIC", badgeColor:T.teal },
  { id:"milrinone", name:"Milrinone", brand:"Primacor", tier:3, color:T.cyan,
    class:"PDE3 Inhibitor (non-catecholamine)", receptors:"Phosphodiesterase-3 inhibition → ↑cAMP",
    startDose:"0.125 mcg/kg/min (no loading dose in shock)", rangeDose:"0.125–0.75 mcg/kg/min",
    titrate:"Increase slowly — prolonged half-life limits rapid titration", maxDose:"0.75 mcg/kg/min",
    calcStart:w=>w*0.125, calcMax:w=>w*0.75,
    conc:"20 mg/100 mL (200 mcg/mL)", preferredFor:"RV failure, cardiogenic shock on beta-blockers",
    effects:{ map:"↓ mild (vasodilation)", hr:"↑ mild", co:"↑↑ (inotropy + vasodilation)", svr:"↓↓", contractility:"↑↑" },
    indications:["RV failure — preferred over dobutamine (reduces pulmonary vascular resistance)","Cardiogenic shock in patients on chronic beta-blockers (catecholamine resistance)","Post-cardiac surgery low-output syndrome","Pulmonary hypertension with RV failure"],
    cautions:["PROLONGED HALF-LIFE (~4 hours) — cannot titrate off rapidly, persists in renal failure","Hypotension from vasodilation — often requires norepinephrine co-administration","Renal failure dramatically prolongs elimination","Avoid loading dose in hypotensive patients"],
    pearl:"Milrinone is the preferred inotrope for RV failure because it reduces pulmonary vascular resistance (unlike dobutamine). Critical limitation: 4-hour half-life means you cannot rapidly reverse hypotension. AVOID loading dose in shock.",
    badge:"RV FAILURE PREFERRED", badgeColor:T.cyan },
];

// ── RUSH Exam Windows ─────────────────────────────────────────────
const RUSH_WINDOWS = [
  { id:"pump", letter:"P", label:"Pump — Cardiac Function", icon:"❤️", color:T.red,
    probe:"Phased array (cardiac)", views:["Subxiphoid 4-chamber (first view in arrest)","Parasternal long axis (PLAX)","Parasternal short axis (PSAX — mid-papillary level)","Apical 4-chamber"],
    findings:[
      { label:"Hyperdynamic LV (EF > 70%)", interpret:"Distributive / septic shock — high output, low resistance", finding:"Walls touching with each contraction (kissing walls), small cavity", color:T.orange },
      { label:"Severely Reduced EF (< 30%)", interpret:"Cardiogenic shock — pump failure", finding:"Barely moving walls, dilated LV, mitral valve opens poorly", color:T.red },
      { label:"Pericardial Effusion", interpret:"Consider tamponade physiology", finding:"Anechoic (black) rim around heart — circumferential > focal", color:T.purple },
      { label:"Diastolic RV Collapse", interpret:"Tamponade — pathognomonic finding", finding:"RV free wall collapses inward during diastole on 2D", color:T.red },
      { label:"RV Dilation + McConnell Sign", interpret:"Massive PE — preserved RV apex with free wall hypokinesis", finding:"RV:LV ratio > 0.9, D-septum on PSAX, McConnell pattern", color:T.coral },
      { label:"Segmental Wall Motion Abnormality", interpret:"AMI — territory-based wall motion loss", finding:"Regional hypokinesis/akinesis in coronary territory", color:T.yellow },
    ],
    pearl:"In cardiac arrest: subxiphoid view first — rapid, doesn't interrupt CPR. Pulse check = 10 seconds, no longer. Absence of cardiac motion = very poor prognosis.",
  },
  { id:"tank", letter:"T", label:"Tank — Volume Status (IVC)", icon:"💧", color:T.blue,
    probe:"Curvilinear or phased array", views:["Subcostal long-axis IVC (hepatic vein junction)","IVC short-axis (confirmatory)","Inferior hepatic vein Doppler flow"],
    findings:[
      { label:"IVC < 2.1 cm + > 50% Collapse", interpret:"CVP 0–5 mmHg → volume responsive", finding:"Small, flat IVC that collapses fully with inspiration", color:T.green },
      { label:"IVC 2.1–2.5 cm + 25–50% Collapse", interpret:"CVP 5–10 mmHg → indeterminate", finding:"Moderate IVC, partial inspiratory collapse", color:T.yellow },
      { label:"IVC > 2.5 cm + < 25% Collapse", interpret:"CVP 15–20 mmHg → volume overloaded or obstructive", finding:"Plethoric IVC, no respiratory variation — RHF, tamponade, tension PTX", color:T.red },
    ],
    pearl:"IVC collapsibility predicts fluid responsiveness in spontaneously breathing patients. In mechanically ventilated patients: distensibility index (>12% increase with insufflation = responsive). IVC alone is insufficient — use in combination with clinical assessment.",
  },
  { id:"pipes", letter:"Pi", label:"Pipes — Aorta + DVT", icon:"🔴", color:T.orange,
    probe:"Curvilinear (aorta) / Linear (DVT)", views:["Epigastric longitudinal (aorta)","Epigastric transverse (aorta + SMA origin)","Femoral vein compression (bilateral groin)","Popliteal vein compression (bilateral)"],
    findings:[
      { label:"Aortic Diameter > 3 cm", interpret:"Abdominal aortic aneurysm — rupture if > 5.5 cm or rapid expansion", finding:"Measured outer wall to outer wall, transverse > longitudinal view", color:T.red },
      { label:"Retroperitoneal Hematoma (AAA rupture)", interpret:"Anechoic/hypoechoic halo around aorta — operative emergency", finding:"Loss of posterior wall visualization, perivascular fluid, free retroperitoneal fluid", color:T.red },
      { label:"Intimal Flap", interpret:"Aortic dissection — echogenic linear structure in lumen", finding:"Linear mobile density in aortic lumen on long-axis view", color:T.purple },
      { label:"Non-Compressible Femoral / Popliteal Vein", interpret:"DVT → source of PE", finding:"Vein does not collapse with gentle probe compression — normal vein flattens completely", color:T.coral },
    ],
    pearl:"Compress the common femoral vein at the junction with the profunda femoris, and the popliteal vein in the popliteal fossa. 2-point compression has sensitivity ~95% for proximal DVT. A positive DVT + RV strain on echo = very high probability massive PE.",
  },
  { id:"peritoneal", letter:"Pe", label:"Peritoneal — Free Fluid (FAST)", icon:"🩸", color:T.yellow,
    probe:"Curvilinear", views:["RUQ — Morrison's pouch (hepatorenal)","LUQ — splenorenal recess","Pelvic — Pouch of Douglas (posterior to bladder)","Paracardiac — pericardial space (extended FAST)"],
    findings:[
      { label:"Anechoic Collection in Morrison's Pouch", interpret:"Hemoperitoneum (trauma) or free fluid — significant finding", finding:"Black stripe between liver and kidney in hepatorenal space", color:T.red },
      { label:"Splenorenal Free Fluid", interpret:"Splenic laceration or free blood — LUQ often more sensitive than RUQ in trauma", finding:"Anechoic fluid in splenorenal recess or perisplenic", color:T.red },
      { label:"Pelvic Free Fluid", interpret:"Most sensitive for small amounts of free fluid (gravity-dependent)", finding:"Anechoic crescent posterior and superior to bladder in pelvis", color:T.orange },
      { label:"Pericardial Effusion (eFAST)", interpret:"Traumatic hemopericardium — tamponade pending", finding:"Anechoic stripe between heart and hyperechoic pericardium in subxiphoid view", color:T.purple },
    ],
    pearl:"A positive FAST in hemodynamically unstable trauma → operative abdomen. In stable patients, CT is preferred for characterization. Negative FAST does not exclude injury — 20–30% of solid organ injuries have no free fluid initially.",
  },
  { id:"pleural", label:"Air (Lung / Pleural)", letter:"A", icon:"💨", color:T.teal,
    probe:"Linear (PTX) or curvilinear (B-lines)", views:["Anterior chest — 2nd ICS MCL bilateral (PTX detection)","Lateral chest — dependent zones (effusion)","Lower anterior zones (B-line pattern for pulmonary edema)"],
    findings:[
      { label:"Lung Sliding Present", interpret:"Pneumothorax EXCLUDED at this location (sensitivity 99%)", finding:"Shimmering movement at pleural line with respiration — seashore sign on M-mode", color:T.green },
      { label:"Absent Lung Sliding + Barcode Sign", interpret:"Pneumothorax at probe location", finding:"No shimmer at pleural line, stratosphere (barcode) pattern on M-mode", color:T.red },
      { label:"Lung Point", interpret:"Pathognomonic for pneumothorax — 100% specific", finding:"Transition point between sliding and non-sliding lung at PTX margin", color:T.red },
      { label:"B-Lines (≥ 3 per field)", interpret:"Pulmonary interstitial edema — cardiogenic pulmonary edema or ARDS", finding:"Vertical hyperechoic laser-like lines from pleural surface to bottom of screen (comet tails)", color:T.orange },
      { label:"Anechoic Pleural Collection (effusion)", interpret:"Pleural effusion — hemothorax (trauma) or transudative/exudative", finding:"Anechoic space above diaphragm, compressible lung floating in fluid", color:T.blue },
    ],
    pearl:"Lung sliding detection is the fastest diagnosis in POCUS: absent sliding = PTX until proven otherwise. Do not delay needle decompression for ultrasound if clinical signs of tension PTX are present.",
  },
];

// ── Hemodynamic Targets ────────────────────────────────────────────
const MAP_TARGETS = [
  {condition:"Septic shock (SSC 2021)",      target:"MAP ≥ 65 mmHg",         note:"Higher targets (MAP 80) do not improve outcomes — SEPSISPAM trial",              color:T.coral},
  {condition:"TBI / Elevated ICP",           target:"MAP ≥ 80 mmHg, CPP > 60",note:"CPP = MAP − ICP. Avoid hypotension — each drop below 70 worsens outcomes",       color:T.purple},
  {condition:"Hemorrhagic shock (controlled)",target:"MAP ≥ 65 mmHg",         note:"After hemorrhage controlled — standard resuscitation targets apply",               color:T.orange},
  {condition:"Hemorrhagic (uncontrolled)",   target:"MAP 50–65 mmHg",         note:"Permissive hypotension — CRASH-2: avoid coagulopathy from dilutional resuscitation",color:T.red},
  {condition:"Aortic dissection",            target:"MAP 60–70, SBP < 120",   note:"Minimize aortic wall stress — beta-blocker + vasodilator, not vasopressors",       color:T.purple},
  {condition:"Cardiogenic shock",            target:"MAP ≥ 65 mmHg",          note:"Avoid excessive MAP that increases myocardial O₂ demand in ischemia",              color:T.red},
  {condition:"Post-cardiac arrest (ROSC)",   target:"MAP ≥ 65–80 mmHg",       note:"Avoid hypotension — NACAR: MAP 80 may improve neurological outcomes",             color:T.teal},
  {condition:"Anaphylactic shock",           target:"MAP ≥ 65 mmHg",          note:"Epinephrine IM + volume — vasopressors if refractory after epinephrine",           color:T.yellow},
];

const RESUS_PROTOCOLS = {
  distributive: {
    title:"Septic Shock — Hour-1 Bundle (SSC 2021)",
    color:T.coral,
    steps:[
      {t:"0–20 min", label:"Immediate", items:["Obtain blood cultures × 2 (aerobic + anaerobic) before antibiotics — < 1 hour window","Lactate measurement — if > 2 mmol/L, consider ICU admission","IV access: large-bore × 2 peripheral or central line (CVC for ongoing vasopressors)","ECG, urinalysis, CBC, BMP, LFTs, coagulation, procalcitonin","RUSH exam: IVC + cardiac function — baseline volume assessment"]},
      {t:"20–60 min", label:"Resuscitation", items:["30 mL/kg IV crystalloid (balanced: LR preferred over NS — SMART trial)","Give boluses (500 mL each) with reassessment — not fixed 30 mL/kg all at once","Broad-spectrum antibiotics within 1 hour — do not delay for cultures beyond 45 min","Norepinephrine: start 0.1 mcg/kg/min if MAP < 65 despite initial fluids (can run peripherally short-term)","Source control: surgical consult if abscess, perforated viscus, infected hardware"]},
      {t:"1–6 hrs", label:"Optimization", items:["Reassess lactate at 2 hours — target ≥ 10% clearance","Target: MAP ≥ 65, UO > 0.5 mL/kg/hr, lactate trending down","Add vasopressin 0.03 units/min if NE > 0.25 mcg/kg/min","Hydrocortisone 200 mg/day (50 mg q6h) if catecholamine-refractory (APROCCHSS)","Avoid excessive fluids after initial resus — de-escalate, reassess with dynamic measures"]},
    ]},
  cardiogenic: {
    title:"Cardiogenic Shock — Sequential Escalation",
    color:T.red,
    steps:[
      {t:"0–20 min", label:"Identify & Stabilize", items:["12-lead ECG: STEMI = emergent cath lab activation (D2B < 90 min)","Bedside echo: EF estimation, pericardial effusion, RWMA, valvular cause","Avoid fluid unless patient has elevated RV pressure and is not wet","Supplemental O₂ / CPAP / intubation if respiratory failure"]},
      {t:"20–60 min", label:"Vasopressor + Inotrope", items:["Norepinephrine 0.1–0.2 mcg/kg/min — MAP target ≥ 65","Dobutamine 2.5–5 mcg/kg/min — add for inotropy, titrate to ScvO₂ > 70%","Milrinone preferred over dobutamine for RV failure (reduces PVR)","Avoid excess vasopressors alone — increases afterload on failing LV","Avoid aggressive fluids — patient already has elevated filling pressures"]},
      {t:"1+ hrs", label:"Mechanical Support", items:["IABP (intra-aortic balloon pump): 1:1 counterpulsation — reduces afterload, augments diastolic pressure","Impella CP/5.5: micro-axial pump — up to 5.5 L/min CO support","ECMO (VA-ECMO): circuit provides both CO and oxygenation — maximal support","Escalate: IABP → Impella → VA-ECMO based on response and institutional capability","Shock Team activation: cardiac surgery, cath lab, critical care in parallel"]},
    ]},
  obstructive: {
    title:"Obstructive Shock — Treat the Obstruction",
    color:T.purple,
    steps:[
      {t:"Immediate", label:"Identify Cause by RUSH", items:["Tension PTX: absent lung sliding + hemodynamic collapse → needle decompress NOW (2nd ICS MCL, 14g), confirm with finger thoracostomy","Cardiac tamponade: pericardial effusion + diastolic RV collapse + plethoric IVC → pericardiocentesis (US-guided, subxiphoid approach)","Massive PE: RV dilation + McConnell + DVT evidence → systemic tPA 50mg IV bolus or 100mg/2h","Vasopressors temporize ONLY — remove the obstruction"]},
      {t:"Temporizing", label:"Bridge While Preparing", items:["Norepinephrine 0.1–0.5 mcg/kg/min for MAP support","Fluid challenge CAUTIOUS — tamponade can worsen with fluid (overdistends RV)","AVOID positive pressure ventilation in tension PTX (increases intrathoracic pressure → worsens hemodynamics)","For massive PE: anticoagulate with heparin 80 units/kg bolus + 18 units/kg/hr — unless giving tPA immediately"]},
    ]},
  hypovolemic: {
    title:"Hemorrhagic Shock — Damage Control Resuscitation",
    color:T.orange,
    steps:[
      {t:"0–5 min", label:"Stop the Bleeding", items:["Direct pressure, tourniquet (extremity), wound packing (junctional)","Activate massive transfusion protocol (MTP) if HR > 120 + SBP < 90 + mechanism","FAST exam: positive → operative abdomen → OR immediately","Do NOT delay surgery for further resuscitation — hemorrhage control is the treatment"]},
      {t:"5–60 min", label:"Damage Control Resus", items:["1:1:1 ratio: pRBC:FFP:Platelets (PROPPR trial — superior to crystalloid resus)","Minimize crystalloid — each liter of NS increases acidosis and coagulopathy","Tranexamic acid 1g IV over 10 min → 1g over 8h (give within 3 hours of injury — CRASH-2)","Permissive hypotension: MAP 50–65 in penetrating trauma until source control","Calcium gluconate 1g with every 2u pRBC (citrated blood chelates Ca²⁺ → hypocalcemia)","Warm blood products — hypothermia worsens coagulopathy (temperature > 35°C target)"]},
    ]},
};

const TABS = [
  {id:"profiles",   label:"Shock Profiles",    icon:"📊"},
  {id:"pressors",   label:"Vasopressor Ladder", icon:"💉"},
  {id:"targets",    label:"Hemodynamic Targets",icon:"🎯"},
  {id:"rush",       label:"RUSH Exam",          icon:"🔬"},
  {id:"resus",      label:"Resuscitation",      icon:"⚡"},
];

// ── Module-Scope Primitives ───────────────────────────────────────
function AmbientBg() {
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0}}>
      <div style={{position:"absolute",top:"-12%",left:"-8%",width:"52%",height:"52%",background:"radial-gradient(circle,rgba(255,107,107,0.09) 0%,transparent 70%)"}}/>
      <div style={{position:"absolute",bottom:"-10%",right:"-5%",width:"46%",height:"46%",background:"radial-gradient(circle,rgba(59,158,255,0.07) 0%,transparent 70%)"}}/>
      <div style={{position:"absolute",top:"40%",left:"30%",width:"32%",height:"32%",background:"radial-gradient(circle,rgba(155,109,255,0.05) 0%,transparent 70%)"}}/>
    </div>
  );
}

function Arrow({ val, color }) {
  return <span style={{fontFamily:"JetBrains Mono",fontSize:14,fontWeight:700,color:color||T.txt2}}>{val}</span>;
}

function BulletRow({ text, color, small }) {
  return (
    <div style={{display:"flex",gap:7,alignItems:"flex-start",marginBottom:4}}>
      <span style={{color:color||T.teal,fontSize:small?7:8,marginTop:small?3:2,flexShrink:0}}>▸</span>
      <span style={{fontFamily:"DM Sans",fontSize:small?11:12,color:T.txt2,lineHeight:1.5}}>{text}</span>
    </div>
  );
}

function HemoStat({ label, value, color }) {
  return (
    <div style={{padding:"7px 10px",background:`${color}10`,border:`1px solid ${color}30`,borderRadius:8,textAlign:"center"}}>
      <div style={{fontFamily:"JetBrains Mono",fontSize:7,color:T.txt4,textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>{label}</div>
      <div style={{fontFamily:"JetBrains Mono",fontSize:14,fontWeight:700,color}}>{value}</div>
    </div>
  );
}

function PressureGauge({ val, max, color, label }) {
  const pct = Math.min(Math.round((val/max)*100), 100);
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
        <span style={{fontFamily:"DM Sans",fontSize:10,color:T.txt3}}>{label}</span>
        <span style={{fontFamily:"JetBrains Mono",fontSize:11,fontWeight:700,color}}>{val}</span>
      </div>
      <div style={{background:"rgba(42,79,122,0.3)",borderRadius:4,height:8,overflow:"hidden"}}>
        <div style={{width:`${pct}%`,height:"100%",background:`linear-gradient(90deg,${color}88,${color})`,borderRadius:4,transition:"width .3s"}}/>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────
export default function ShockHub() {
  const [tab,         setTab]         = useState("profiles");
  const [expanded,    setExpanded]    = useState(null);
  const [shockType,   setShockType]   = useState("distributive");
  const [rushWindow,  setRushWindow]  = useState("pump");
  const [weight,      setWeight]      = useState("");
  const [sbp,         setSbp]         = useState("");
  const [dbp,         setDbp]         = useState("");
  const [hr,          setHr]          = useState("");
  const [resusType,   setResusType]   = useState("distributive");

  const toggle = useCallback(id => setExpanded(p => p === id ? null : id), []);
  const wt = parseFloat(weight) || 0;

  const map = useMemo(() => {
    const s = parseFloat(sbp), d = parseFloat(dbp);
    if (!s || !d) return null;
    return Math.round(d + (s - d) / 3);
  }, [sbp, dbp]);

  const shockIndex = useMemo(() => {
    const h = parseFloat(hr), s = parseFloat(sbp);
    if (!h || !s) return null;
    return (h / s).toFixed(2);
  }, [hr, sbp]);

  const si_risk = useMemo(() => {
    if (!shockIndex) return null;
    const si = parseFloat(shockIndex);
    if (si < 0.7) return {label:"Normal",color:T.green};
    if (si < 1.0) return {label:"Mild Shock",color:T.yellow};
    if (si < 1.5) return {label:"Moderate Shock",color:T.orange};
    return {label:"Severe Shock",color:T.red};
  }, [shockIndex]);

  const map_color = map ? (map < 50 ? T.red : map < 65 ? T.orange : map < 80 ? T.yellow : T.green) : T.txt4;

  const activeShock = SHOCK_TYPES.find(s => s.id === shockType);
  const activeRush  = RUSH_WINDOWS.find(w => w.id === rushWindow);
  const activeResus = RESUS_PROTOCOLS[resusType];

  return (
    <div style={{fontFamily:"DM Sans, sans-serif",background:T.bg,minHeight:"100vh",position:"relative",overflow:"hidden",color:T.txt}}>
      <AmbientBg/>
      <div style={{position:"relative",zIndex:1,maxWidth:1440,margin:"0 auto",padding:"0 16px"}}>

        {/* Header */}
        <div style={{padding:"18px 0 14px"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
            <div style={{backdropFilter:"blur(40px)",WebkitBackdropFilter:"blur(40px)",background:"rgba(5,15,30,0.9)",border:"1px solid rgba(42,79,122,0.6)",borderRadius:10,padding:"5px 12px",display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.teal,letterSpacing:3}}>NOTRYA</span>
              <span style={{color:T.txt4,fontFamily:"JetBrains Mono",fontSize:10}}>/</span>
              <span style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.txt3,letterSpacing:2}}>SHOCK HUB</span>
            </div>
            <div style={{height:1,flex:1,background:"linear-gradient(90deg,rgba(42,79,122,0.6),transparent)"}}/>
          </div>
          <h1 className="shimmer-text" style={{fontFamily:"Playfair Display",fontSize:"clamp(24px,4vw,40px)",fontWeight:900,letterSpacing:-1,lineHeight:1.1}}>Shock Hub</h1>
          <p style={{fontFamily:"DM Sans",fontSize:12,color:T.txt3,marginTop:4}}>
            Hemodynamic profiles · Vasopressor ladder with dosing · MAP/CVP targets · RUSH exam framework · Resuscitation protocols
          </p>
        </div>

        {/* Stat Banner */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(148px,1fr))",gap:10,marginBottom:16}}>
          {[
            {label:"MAP Target",    value:"≥ 65 mmHg",  sub:"Septic shock (SSC 2021)",   color:T.coral },
            {label:"NE First-Line", value:"All Distributive",sub:"0.01–3 mcg/kg/min",    color:T.red   },
            {label:"Lactate Goal",  value:"< 2 mmol/L", sub:"Within 6h of presentation",color:T.green },
            {label:"RUSH Exam",     value:"5 Windows",  sub:"Pump·Tank·Pipes·Peri·Air",  color:T.teal  },
            {label:"Shock Index",   value:"> 1.0",      sub:"Significant shock",          color:T.orange},
            {label:"MTP Ratio",     value:"1:1:1",      sub:"pRBC:FFP:Platelets",         color:T.yellow},
          ].map((b,i) => (
            <div key={i} style={{...glass,padding:"9px 13px",borderLeft:`3px solid ${b.color}`,background:`linear-gradient(135deg,${b.color}12,rgba(8,22,40,0.8))`,borderRadius:10}}>
              <div style={{fontFamily:"JetBrains Mono",fontSize:14,fontWeight:700,color:b.color,lineHeight:1}}>{b.value}</div>
              <div style={{fontFamily:"DM Sans",fontWeight:600,color:T.txt,fontSize:10,margin:"3px 0"}}>{b.label}</div>
              <div style={{fontFamily:"DM Sans",fontSize:10,color:T.txt4}}>{b.sub}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{...glass,padding:"6px",display:"flex",gap:5,marginBottom:16,flexWrap:"wrap"}}>
          {TABS.map(t => (
            <button key={t.id} onClick={()=>{setTab(t.id);setExpanded(null);}}
              style={{flex:"1 1 auto",fontFamily:"DM Sans",fontWeight:600,fontSize:12,padding:"9px 8px",borderRadius:10,border:`1px solid ${tab===t.id?"rgba(255,107,107,0.5)":"transparent"}`,background:tab===t.id?"linear-gradient(135deg,rgba(255,107,107,0.18),rgba(255,107,107,0.07))":"transparent",color:tab===t.id?T.coral:T.txt3,cursor:"pointer",textAlign:"center",transition:"all .15s",whiteSpace:"nowrap"}}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ══ SHOCK PROFILES ══════════════════════════════════ */}
        {tab === "profiles" && (
          <div className="fade-in">
            {/* Type selector */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:16}}>
              {SHOCK_TYPES.map(s => (
                <button key={s.id} onClick={()=>setShockType(s.id)}
                  style={{...glass,padding:"12px 10px",border:`2px solid ${shockType===s.id?s.color+"88":"rgba(42,79,122,0.35)"}`,background:shockType===s.id?`linear-gradient(135deg,${s.color}18,rgba(8,22,40,0.9))`:"rgba(8,22,40,0.78)",cursor:"pointer",borderRadius:12,transition:"all .15s"}}>
                  <div style={{fontSize:20,marginBottom:4}}>{s.icon}</div>
                  <div style={{fontFamily:"Playfair Display",fontWeight:700,fontSize:13,color:shockType===s.id?s.color:T.txt}}>{s.label}</div>
                </button>
              ))}
            </div>

            {activeShock && (
              <div className="fade-in" key={activeShock.id}>
                {/* Hemodynamic fingerprint */}
                <div style={{...glass,padding:"16px 20px",marginBottom:14,borderTop:`4px solid ${activeShock.color}`,background:`linear-gradient(135deg,${activeShock.color}08,rgba(8,22,40,0.88))`}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                    <span style={{fontSize:24}}>{activeShock.icon}</span>
                    <div>
                      <h2 style={{fontFamily:"Playfair Display",fontSize:22,fontWeight:700,color:activeShock.color,margin:0}}>{activeShock.label} Shock</h2>
                      <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt3,marginTop:2}}>{activeShock.subtypes.join(" · ")}</div>
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:8,marginBottom:14}}>
                    {[
                      {label:"Cardiac Output",     val:activeShock.hemo.co,    color:activeShock.color},
                      {label:"SVR",                val:activeShock.hemo.svr,   color:activeShock.color},
                      {label:"CVP",                val:activeShock.hemo.cvp,   color:activeShock.color},
                      {label:"PCWP",               val:activeShock.hemo.pcwp,  color:activeShock.color},
                      {label:"SvO₂/ScvO₂",         val:activeShock.hemo.svo2,  color:activeShock.color},
                      {label:"Heart Rate",          val:activeShock.hemo.hr,    color:activeShock.color},
                    ].map((p,i) => <HemoStat key={i} label={p.label} value={p.val} color={p.color}/>)}
                  </div>
                  <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.txt4,textTransform:"uppercase",letterSpacing:1.5,marginBottom:4}}>Skin / Physical</div>
                  <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,marginBottom:12,fontStyle:"italic"}}>{activeShock.hemo.skin}</div>
                  <div style={{padding:"10px 14px",background:"rgba(14,37,68,0.6)",border:"1px solid rgba(42,79,122,0.3)",borderRadius:10}}>
                    <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.txt4,textTransform:"uppercase",letterSpacing:1.5,marginBottom:5}}>Mechanism</div>
                    <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt,lineHeight:1.7}}>{activeShock.mechanism}</div>
                  </div>
                </div>

                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                  <div>
                    <div style={{...glass,padding:"14px 16px",marginBottom:12,borderLeft:`3px solid ${T.red}`}}>
                      <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.red,textTransform:"uppercase",letterSpacing:1.5,marginBottom:10}}>🚩 Red Flags</div>
                      {activeShock.redflags.map((f,i) => <BulletRow key={i} text={f} color={T.red}/>)}
                    </div>
                    <div style={{...glass,padding:"14px 16px",borderLeft:`3px solid ${T.yellow}`}}>
                      <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.yellow,textTransform:"uppercase",letterSpacing:1.5,marginBottom:6}}>Vasopressor Strategy</div>
                      <div style={{fontFamily:"DM Sans",fontWeight:600,fontSize:12,color:T.yellow,marginBottom:10}}>{activeShock.vasopressor}</div>
                      {/* Quick hemodynamic comparison table */}
                      <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:1.5,marginBottom:8,marginTop:10}}>All Shock Types — Quick Compare</div>
                      <div style={{overflowX:"auto"}}>
                        <table style={{width:"100%",borderCollapse:"collapse",fontFamily:"DM Sans",fontSize:11}}>
                          <thead>
                            <tr>{["Type","CO","SVR","CVP"].map(h=><th key={h} style={{padding:"4px 8px",color:T.txt4,fontWeight:600,textAlign:"left",borderBottom:"1px solid rgba(42,79,122,0.3)",fontFamily:"JetBrains Mono",fontSize:9,textTransform:"uppercase"}}>{h}</th>)}</tr>
                          </thead>
                          <tbody>
                            {SHOCK_TYPES.map(s=>(
                              <tr key={s.id} style={{background:s.id===shockType?`${s.color}12`:"transparent"}}>
                                <td style={{padding:"4px 8px",color:s.color,fontWeight:600}}>{s.label}</td>
                                <td style={{padding:"4px 8px",color:T.txt2}}>{s.hemo.co.split(" ")[0]}</td>
                                <td style={{padding:"4px 8px",color:T.txt2}}>{s.hemo.svr.split(" ")[0]}</td>
                                <td style={{padding:"4px 8px",color:T.txt2}}>{s.hemo.cvp.split(" ")[0]}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                  <div style={{...glass,padding:"14px 16px",borderLeft:`3px solid ${activeShock.color}`}}>
                    <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:activeShock.color,textTransform:"uppercase",letterSpacing:1.5,marginBottom:10}}>⚡ First Steps</div>
                    {activeShock.firstSteps.map((step,i) => (
                      <div key={i} style={{display:"flex",gap:8,padding:"8px 10px",background:"rgba(14,37,68,0.5)",border:`1px solid ${activeShock.color}22`,borderRadius:8,marginBottom:6}}>
                        <div style={{width:20,height:20,borderRadius:"50%",background:`${activeShock.color}20`,border:`1px solid ${activeShock.color}44`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>
                          <span style={{fontFamily:"JetBrains Mono",fontSize:9,fontWeight:700,color:activeShock.color}}>{i+1}</span>
                        </div>
                        <span style={{fontFamily:"DM Sans",fontSize:12,color:T.txt,lineHeight:1.5}}>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ VASOPRESSOR LADDER ════════════════════════════════ */}
        {tab === "pressors" && (
          <div className="fade-in">
            <div style={{...glass,padding:"14px 18px",marginBottom:14,borderLeft:`4px solid ${T.red}`}}>
              <div style={{display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
                <div style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.teal,textTransform:"uppercase",letterSpacing:2}}>Patient Weight</div>
                <div style={{display:"flex",alignItems:"center",gap:8,background:"rgba(14,37,68,0.8)",border:`2px solid ${wt>0?"rgba(0,229,192,0.5)":"rgba(42,79,122,0.4)"}`,borderRadius:10,padding:"7px 14px"}}>
                  <input type="number" min="1" max="300" value={weight} onChange={e=>setWeight(e.target.value)} placeholder="e.g. 80"
                    style={{background:"transparent",border:"none",outline:"none",color:T.txt,fontFamily:"JetBrains Mono",fontSize:22,fontWeight:700,width:70}}/>
                  <span style={{fontFamily:"JetBrains Mono",fontSize:12,color:wt>0?T.teal:T.txt4,fontWeight:700}}>kg</span>
                </div>
                {wt>0 && (
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    {[
                      {name:"NE start",  val:`${(wt*0.05).toFixed(1)} mcg/min`,  color:T.red},
                      {name:"Vaso fixed",val:"0.03 units/min",                   color:T.purple},
                      {name:"Epi start", val:`${(wt*0.05).toFixed(1)} mcg/min`,  color:T.coral},
                      {name:"Dobut start",val:`${Math.round(wt*5)} mcg/min`,     color:T.teal},
                    ].map((d,i) => (
                      <div key={i} style={{padding:"4px 12px",background:`${d.color}15`,border:`1px solid ${d.color}44`,borderRadius:20,display:"flex",gap:6}}>
                        <span style={{fontFamily:"DM Sans",fontSize:10,color:T.txt3}}>{d.name}:</span>
                        <span style={{fontFamily:"JetBrains Mono",fontSize:11,fontWeight:700,color:d.color}}>{d.val}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Escalation visual */}
            <div style={{...glass,padding:"14px 18px",marginBottom:14,background:"rgba(8,22,40,0.9)"}}>
              <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:2,marginBottom:10}}>Septic Shock Vasopressor Escalation Pathway</div>
              <div style={{display:"flex",alignItems:"center",gap:0,overflowX:"auto",paddingBottom:6}}>
                {[
                  {label:"Norepinephrine",sub:"0.01→3 mcg/kg/min",color:T.red,  note:"Start"},
                  {label:"+ Vasopressin",  sub:"0.03 units/min fixed",color:T.purple,note:"NE > 0.25"},
                  {label:"+ Hydrocortisone",sub:"200 mg/day IV",color:T.orange, note:"Refractory"},
                  {label:"+ Epinephrine", sub:"0.01→1 mcg/kg/min",color:T.coral,note:"Catecholamine-resistant"},
                  {label:"ECMO",          sub:"VA-ECMO",            color:T.yellow,note:"Maximal therapy"},
                ].map((step,i,arr) => (
                  <div key={i} style={{display:"flex",alignItems:"center",flexShrink:0}}>
                    <div style={{textAlign:"center",padding:"10px 14px",background:`${step.color}15`,border:`1px solid ${step.color}44`,borderRadius:10,minWidth:130}}>
                      <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:step.color,textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>{step.note}</div>
                      <div style={{fontFamily:"DM Sans",fontWeight:700,fontSize:12,color:step.color}}>{step.label}</div>
                      <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt3,marginTop:2}}>{step.sub}</div>
                    </div>
                    {i < arr.length-1 && <div style={{width:20,height:2,background:`linear-gradient(90deg,${step.color},${arr[i+1].color})`,flexShrink:0}}/>}
                  </div>
                ))}
              </div>
            </div>

            {/* Drug cards */}
            {["1st Line","2nd Line Adjunct","3rd Line / Anaphylaxis","Largely Replaced By Ne","Pure α1 — No Inotropy","Inotrope — Cardiogenic","Rv Failure Preferred"].map(tier => {
              const drugs = PRESSORS.filter(p => p.badge.toUpperCase() === tier.toUpperCase());
              if (!drugs.length) return null;
              return null; // handled below
            })}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(400px,1fr))",gap:12}}>
              {PRESSORS.map(drug => {
                const isOpen = expanded === drug.id;
                const calcedStart = typeof drug.calcStart === "function" && wt > 0 ? drug.calcStart(wt) : null;
                const calcedMax   = typeof drug.calcMax   === "function" && wt > 0 ? drug.calcMax(wt)   : null;
                return (
                  <div key={drug.id} className="shock-card" onClick={()=>toggle(drug.id)}
                    style={{...glass,overflow:"hidden",borderTop:`3px solid ${drug.color}`,border:`1px solid ${isOpen?drug.color+"55":"rgba(42,79,122,0.35)"}`,borderTopColor:drug.color,cursor:"pointer"}}>
                    <div style={{padding:"12px 14px"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,marginBottom:8}}>
                        <div style={{flex:1}}>
                          <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap",marginBottom:3}}>
                            <span style={{fontFamily:"Playfair Display",fontSize:15,fontWeight:700,color:drug.color}}>{drug.name}</span>
                            <span style={{fontFamily:"JetBrains Mono",fontSize:8,fontWeight:700,color:drug.badgeColor,background:`${drug.badgeColor}18`,border:`1px solid ${drug.badgeColor}44`,padding:"1px 6px",borderRadius:4,textTransform:"uppercase",letterSpacing:0.8}}>{drug.badge}</span>
                          </div>
                          <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4}}>{drug.class} · {drug.receptors}</div>
                        </div>
                        <span style={{color:T.txt4,fontSize:12}}>{isOpen?"▲":"▼"}</span>
                      </div>
                      {wt > 0 && calcedStart !== null ? (
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
                          <div style={{padding:"7px 10px",background:`${drug.color}12`,border:`1px solid ${drug.color}33`,borderRadius:8,textAlign:"center"}}>
                            <div style={{fontFamily:"JetBrains Mono",fontSize:7,color:T.txt4,textTransform:"uppercase",marginBottom:3}}>Starting</div>
                            <div style={{fontFamily:"JetBrains Mono",fontWeight:700,fontSize:12,color:drug.color}}>
                              {typeof calcedStart === "string" ? calcedStart : `${calcedStart.toFixed(1)} mcg/min`}
                            </div>
                          </div>
                          <div style={{padding:"7px 10px",background:"rgba(14,37,68,0.6)",border:"1px solid rgba(42,79,122,0.3)",borderRadius:8,textAlign:"center"}}>
                            <div style={{fontFamily:"JetBrains Mono",fontSize:7,color:T.txt4,textTransform:"uppercase",marginBottom:3}}>Max (clinical)</div>
                            <div style={{fontFamily:"JetBrains Mono",fontWeight:700,fontSize:12,color:T.txt2}}>
                              {typeof calcedMax === "string" ? calcedMax : `${calcedMax.toFixed(0)} mcg/min`}
                            </div>
                          </div>
                          <div style={{padding:"7px 10px",background:"rgba(14,37,68,0.6)",border:"1px solid rgba(42,79,122,0.3)",borderRadius:8,textAlign:"center"}}>
                            <div style={{fontFamily:"JetBrains Mono",fontSize:7,color:T.txt4,textTransform:"uppercase",marginBottom:3}}>Conc</div>
                            <div style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.txt3,lineHeight:1.3}}>{drug.conc}</div>
                          </div>
                        </div>
                      ) : (
                        <div style={{padding:"7px",background:"rgba(14,37,68,0.4)",border:"1px solid rgba(42,79,122,0.2)",borderRadius:8,fontFamily:"DM Sans",fontSize:11,color:T.txt4,textAlign:"center"}}>
                          {drug.startDose} → {drug.rangeDose}
                        </div>
                      )}
                    </div>
                    {isOpen && (
                      <div className="fade-in" style={{borderTop:"1px solid rgba(42,79,122,0.3)",padding:"12px 14px 14px"}}>
                        {/* Effects grid */}
                        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6,marginBottom:12}}>
                          {Object.entries(drug.effects).map(([k,v]) => (
                            <div key={k} style={{textAlign:"center",padding:"5px 6px",background:"rgba(14,37,68,0.6)",borderRadius:7,border:"1px solid rgba(42,79,122,0.2)"}}>
                              <div style={{fontFamily:"JetBrains Mono",fontSize:7,color:T.txt4,textTransform:"uppercase",marginBottom:2}}>{k}</div>
                              <div style={{fontFamily:"JetBrains Mono",fontSize:12,fontWeight:700,color:v.includes("↑")?T.green:v.includes("↓")?T.coral:T.txt3}}>{v}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:10}}>
                          <div>
                            <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.txt4,textTransform:"uppercase",letterSpacing:1.5,marginBottom:7}}>Indications</div>
                            {drug.indications.map((item,i) => <BulletRow key={i} text={item} color={drug.color}/>)}
                          </div>
                          <div>
                            <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.coral,textTransform:"uppercase",letterSpacing:1.5,marginBottom:7}}>Cautions</div>
                            {drug.cautions.map((item,i) => <BulletRow key={i} text={item} color={T.coral}/>)}
                          </div>
                        </div>
                        <div style={{padding:"9px 12px",background:`${drug.color}08`,border:`1px solid ${drug.color}22`,borderRadius:8,display:"flex",gap:8}}>
                          <span style={{flexShrink:0,marginTop:1}}>💎</span>
                          <span style={{fontFamily:"DM Sans",fontSize:12,color:T.txt,lineHeight:1.6,fontStyle:"italic"}}>{drug.pearl}</span>
                        </div>
                        <div style={{marginTop:8,padding:"7px 12px",background:"rgba(14,37,68,0.6)",border:"1px solid rgba(42,79,122,0.3)",borderRadius:7}}>
                          <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt3}}>
                            <span style={{color:T.txt4}}>Titrate: </span>{drug.titrate} · <span style={{color:T.txt4}}>Max: </span>{drug.maxDose}
                          </div>
                          <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt3,marginTop:2}}>
                            <span style={{color:T.txt4}}>Preferred for: </span>{drug.preferredFor}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══ HEMODYNAMIC TARGETS ═══════════════════════════════ */}
        {tab === "targets" && (
          <div className="fade-in">
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,alignItems:"start"}}>
              {/* Left: calculators */}
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                {/* MAP calculator */}
                <div style={{...glass,padding:"18px 20px",borderLeft:`4px solid ${T.teal}`}}>
                  <div style={{fontFamily:"Playfair Display",fontSize:18,fontWeight:700,color:T.txt,marginBottom:16}}>MAP Calculator</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
                    {[["Systolic BP",sbp,setSbp,"e.g. 90"],["Diastolic BP",dbp,setDbp,"e.g. 60"]].map(([label,val,setter,ph]) => (
                      <div key={label}>
                        <div style={{fontFamily:"DM Sans",fontSize:10,fontWeight:600,color:T.txt3,textTransform:"uppercase",letterSpacing:".06em",marginBottom:5}}>{label}</div>
                        <div style={{display:"flex",alignItems:"center",gap:6,background:"rgba(14,37,68,0.8)",border:`1.5px solid ${val?"rgba(0,229,192,0.4)":"rgba(42,79,122,0.4)"}`,borderRadius:9,padding:"8px 12px"}}>
                          <input type="number" min="0" max="300" value={val} onChange={e=>setter(e.target.value)} placeholder={ph}
                            style={{background:"transparent",border:"none",outline:"none",color:T.txt,fontFamily:"JetBrains Mono",fontSize:18,fontWeight:700,width:"100%"}}/>
                          <span style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.txt4}}>mmHg</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {map && (
                    <div className="fade-in" style={{padding:"16px 20px",background:`${map_color}12`,border:`2px solid ${map_color}44`,borderRadius:12,textAlign:"center",marginBottom:10}}>
                      <div style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.txt4,textTransform:"uppercase",letterSpacing:2,marginBottom:6}}>Mean Arterial Pressure</div>
                      <div style={{fontFamily:"JetBrains Mono",fontSize:48,fontWeight:900,color:map_color,lineHeight:1}}>{map}</div>
                      <div style={{fontFamily:"DM Sans",fontSize:11,color:map_color,marginTop:4}}>mmHg — {map<50?"CRITICALLY LOW — immediate vasopressor":map<65?"Below target (< 65 mmHg)":map<80?"Adequate":"Target achieved"}</div>
                    </div>
                  )}
                  <div style={{background:"rgba(14,37,68,0.5)",borderRadius:9,padding:"10px 12px"}}>
                    <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:1.5,marginBottom:4}}>Formula</div>
                    <div style={{fontFamily:"JetBrains Mono",fontSize:12,color:T.txt2}}>MAP = DBP + (SBP − DBP) ÷ 3</div>
                    <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt4,marginTop:3}}>Reflects diastolic predominance (2:1 diastole:systole at normal HR)</div>
                  </div>
                </div>

                {/* Shock index */}
                <div style={{...glass,padding:"18px 20px",borderLeft:`4px solid ${T.orange}`}}>
                  <div style={{fontFamily:"Playfair Display",fontSize:18,fontWeight:700,color:T.txt,marginBottom:12}}>Shock Index</div>
                  <div style={{marginBottom:10}}>
                    <div style={{fontFamily:"DM Sans",fontSize:10,fontWeight:600,color:T.txt3,textTransform:"uppercase",letterSpacing:".06em",marginBottom:5}}>Heart Rate (bpm)</div>
                    <div style={{display:"flex",alignItems:"center",gap:6,background:"rgba(14,37,68,0.8)",border:`1.5px solid ${hr?"rgba(255,159,67,0.4)":"rgba(42,79,122,0.4)"}`,borderRadius:9,padding:"8px 12px"}}>
                      <input type="number" min="0" max="300" value={hr} onChange={e=>setHr(e.target.value)} placeholder="e.g. 120"
                        style={{background:"transparent",border:"none",outline:"none",color:T.txt,fontFamily:"JetBrains Mono",fontSize:18,fontWeight:700,width:"100%"}}/>
                    </div>
                  </div>
                  {shockIndex && si_risk && (
                    <div className="fade-in" style={{padding:"14px 18px",background:`${si_risk.color}10`,border:`2px solid ${si_risk.color}44`,borderRadius:12,marginBottom:10}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <div>
                          <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:2,marginBottom:4}}>Shock Index (HR ÷ SBP)</div>
                          <div style={{fontFamily:"JetBrains Mono",fontSize:40,fontWeight:900,color:si_risk.color,lineHeight:1}}>{shockIndex}</div>
                        </div>
                        <div style={{padding:"8px 16px",background:`${si_risk.color}20`,border:`1px solid ${si_risk.color}55`,borderRadius:9,textAlign:"center"}}>
                          <div style={{fontFamily:"DM Sans",fontWeight:700,fontSize:14,color:si_risk.color}}>{si_risk.label}</div>
                        </div>
                      </div>
                    </div>
                  )}
                  {[{range:"< 0.7",label:"Normal",color:T.green},{range:"0.7–1.0",label:"Mild Shock",color:T.yellow},{range:"1.0–1.5",label:"Significant Shock",color:T.orange},{range:"> 1.5",label:"Severe Shock",color:T.red}].map((r,i) => (
                    <div key={i} style={{display:"flex",gap:10,padding:"5px 0",borderBottom:i<3?"1px solid rgba(42,79,122,0.2)":"none"}}>
                      <span style={{fontFamily:"JetBrains Mono",fontSize:11,fontWeight:700,color:r.color,minWidth:60}}>{r.range}</span>
                      <span style={{fontFamily:"DM Sans",fontSize:12,color:r.color}}>{r.label}</span>
                    </div>
                  ))}
                </div>

                {/* Lactate & ScvO2 targets */}
                <div style={{...glass,padding:"16px 18px",borderLeft:`3px solid ${T.green}`}}>
                  <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.green,textTransform:"uppercase",letterSpacing:2,marginBottom:12}}>Endpoints of Resuscitation</div>
                  {[
                    {label:"Lactate",    target:"< 2 mmol/L",    sub:"Within 6h; ≥ 10% clearance per 2h is acceptable endpoint",  color:T.green  },
                    {label:"ScvO₂",      target:"≥ 70%",         sub:"Superior vena cava O₂ saturation — high extraction = underperfusion",color:T.teal   },
                    {label:"Urine Output",target:"≥ 0.5 mL/kg/hr",sub:"Hourly UO is a real-time perfusion endpoint",               color:T.blue   },
                    {label:"Base Deficit",target:"< −2 mEq/L",   sub:"Normalizing base deficit indicates adequate resuscitation",   color:T.yellow },
                    {label:"SBE (sepsis)",target:"> −6",          sub:"Base excess < −6 = severe shock",                            color:T.orange },
                    {label:"Capillary Refill",target:"< 2 seconds",sub:"Peripheral perfusion — useful titration endpoint (ANDROMEDA-SHOCK trial)",color:T.teal},
                  ].map((item,i) => (
                    <div key={i} style={{display:"flex",gap:10,padding:"7px 0",borderBottom:i<5?"1px solid rgba(42,79,122,0.2)":"none"}}>
                      <div style={{minWidth:90,flexShrink:0}}>
                        <div style={{fontFamily:"DM Sans",fontWeight:700,fontSize:12,color:item.color}}>{item.label}</div>
                        <div style={{fontFamily:"JetBrains Mono",fontSize:11,fontWeight:700,color:item.color}}>{item.target}</div>
                      </div>
                      <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt3,lineHeight:1.5}}>{item.sub}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: MAP targets by condition */}
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                <div style={{...glass,padding:"18px 20px"}}>
                  <div style={{fontFamily:"Playfair Display",fontSize:18,fontWeight:700,color:T.txt,marginBottom:14}}>MAP Targets by Condition</div>
                  {MAP_TARGETS.map((item,i) => (
                    <div key={i} style={{padding:"10px 14px",background:`${item.color}08`,border:`1px solid ${item.color}22`,borderRadius:10,marginBottom:8}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,marginBottom:4}}>
                        <div style={{fontFamily:"DM Sans",fontWeight:700,fontSize:12,color:item.color}}>{item.condition}</div>
                        <div style={{fontFamily:"JetBrains Mono",fontSize:11,fontWeight:700,color:item.color,flexShrink:0}}>{item.target}</div>
                      </div>
                      <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt3,lineHeight:1.5}}>{item.note}</div>
                    </div>
                  ))}
                </div>

                {/* CVP interpretation */}
                <div style={{...glass,padding:"16px 18px"}}>
                  <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:2,marginBottom:12}}>CVP Interpretation</div>
                  {[
                    {range:"< 4 mmHg",  label:"Low CVP",  sub:"Hypovolemia likely — consider fluid challenge",                                                                     color:T.yellow,bar:15},
                    {range:"4–8 mmHg",  label:"Normal",   sub:"Adequate preload — response to fluid unpredictable",                                                                color:T.green, bar:35},
                    {range:"8–12 mmHg", label:"Elevated", sub:"Acceptable in mechanically ventilated patients",                                                                    color:T.teal,  bar:55},
                    {range:"12–20 mmHg",label:"High CVP", sub:"Volume overload, RV failure, tamponade, constrictive pericarditis",                                                color:T.orange,bar:75},
                    {range:"> 20 mmHg", label:"Very High", sub:"Critical — tamponade, severe RV failure, massive tricuspid regurgitation",                                         color:T.red,   bar:95},
                  ].map((r,i) => (
                    <div key={i} style={{marginBottom:10}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                        <div><span style={{fontFamily:"JetBrains Mono",fontSize:11,fontWeight:700,color:r.color}}>{r.range}</span> <span style={{fontFamily:"DM Sans",fontSize:11,color:r.color,marginLeft:6}}>{r.label}</span></div>
                      </div>
                      <div style={{background:"rgba(42,79,122,0.25)",borderRadius:4,height:6,overflow:"hidden",marginBottom:4}}>
                        <div style={{width:`${r.bar}%`,height:"100%",background:`linear-gradient(90deg,${r.color}66,${r.color})`,borderRadius:4}}/>
                      </div>
                      <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt3,lineHeight:1.4}}>{r.sub}</div>
                    </div>
                  ))}
                  <div style={{padding:"9px 12px",background:"rgba(255,159,67,0.07)",border:"1px solid rgba(255,159,67,0.2)",borderRadius:8,marginTop:8}}>
                    <div style={{fontFamily:"DM Sans",fontSize:11,color:T.orange,lineHeight:1.6}}>⚠ CVP is a poor predictor of fluid responsiveness in isolation. Dynamic measures (passive leg raise, pulse pressure variation, IVC collapsibility) are superior for predicting volume responsiveness.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ RUSH EXAM ══════════════════════════════════════════ */}
        {tab === "rush" && (
          <div className="fade-in">
            <div style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.teal,textTransform:"uppercase",letterSpacing:2,marginBottom:6}}>
              RUSH Exam — Rapid Ultrasound in SHock
            </div>
            <div style={{padding:"10px 14px",background:"rgba(0,229,192,0.06)",border:"1px solid rgba(0,229,192,0.2)",borderRadius:10,marginBottom:14,fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.7}}>
              🔬 <strong style={{color:T.teal}}>Perform RUSH before or concurrent with resuscitation.</strong> A focused 2-minute RUSH exam can differentiate all four shock categories. Protocol: Pump (heart) → Tank (IVC) → Pipes (aorta/DVT) → Peritoneal (FAST) → Air (lung/pleural).
            </div>

            {/* Window tabs */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6,marginBottom:14}}>
              {RUSH_WINDOWS.map(w => (
                <button key={w.id} className="rush-tab" onClick={()=>setRushWindow(w.id)}
                  style={{...glass,padding:"10px 8px",border:`2px solid ${rushWindow===w.id?w.color+"88":"rgba(42,79,122,0.35)"}`,background:rushWindow===w.id?`linear-gradient(135deg,${w.color}18,rgba(8,22,40,0.88))`:"rgba(8,22,40,0.78)",cursor:"pointer",borderRadius:12,textAlign:"center",transition:"all .15s"}}>
                  <div style={{fontSize:18,marginBottom:3}}>{w.icon}</div>
                  <div style={{fontFamily:"JetBrains Mono",fontWeight:700,fontSize:11,color:rushWindow===w.id?w.color:T.txt}}>{w.letter}</div>
                  <div style={{fontFamily:"DM Sans",fontSize:10,color:T.txt4,marginTop:1,lineHeight:1.3}}>{w.label.split("—")[0].trim()}</div>
                </button>
              ))}
            </div>

            {activeRush && (
              <div className="fade-in" key={activeRush.id}>
                <div style={{...glass,padding:"16px 20px",marginBottom:14,borderTop:`4px solid ${activeRush.color}`,background:`linear-gradient(135deg,${activeRush.color}08,rgba(8,22,40,0.88))`}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                    <span style={{fontSize:26}}>{activeRush.icon}</span>
                    <div>
                      <h3 style={{fontFamily:"Playfair Display",fontSize:20,fontWeight:700,color:activeRush.color,margin:0}}>{activeRush.label}</h3>
                      <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,marginTop:2}}>Probe: {activeRush.probe}</div>
                    </div>
                  </div>
                  <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:1.5,marginBottom:6}}>Views to Obtain</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
                    {activeRush.views.map((view,i) => (
                      <span key={i} style={{fontFamily:"DM Sans",fontSize:11,color:T.txt2,background:"rgba(14,37,68,0.6)",border:"1px solid rgba(42,79,122,0.3)",padding:"3px 10px",borderRadius:20}}>{view}</span>
                    ))}
                  </div>
                  <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:1.5,marginBottom:10}}>Findings & Interpretation</div>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {activeRush.findings.map((finding,i) => (
                      <div key={i} style={{padding:"12px 14px",background:`${finding.color}08`,border:`1px solid ${finding.color}25`,borderRadius:10}}>
                        <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
                          <div style={{width:8,height:8,borderRadius:"50%",background:finding.color,flexShrink:0,marginTop:4}}/>
                          <div style={{flex:1}}>
                            <div style={{fontFamily:"DM Sans",fontWeight:700,fontSize:13,color:finding.color,marginBottom:3}}>{finding.label}</div>
                            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                              <div>
                                <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.txt4,textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>What You See</div>
                                <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.5}}>{finding.finding}</div>
                              </div>
                              <div>
                                <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:finding.color,textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>Clinical Interpretation</div>
                                <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt,lineHeight:1.5,fontWeight:500}}>{finding.interpret}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{...glass,padding:"12px 16px",borderLeft:`3px solid ${T.yellow}`}}>
                  <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.yellow,textTransform:"uppercase",letterSpacing:1.5,marginBottom:6}}>💎 Clinical Pearl</div>
                  <div style={{fontFamily:"DM Sans",fontSize:13,color:T.txt,lineHeight:1.7}}>{activeRush.pearl}</div>
                </div>

                {/* RUSH interpretation matrix */}
                <div style={{...glass,padding:"16px 18px",marginTop:14}}>
                  <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:2,marginBottom:12}}>RUSH Diagnostic Matrix — Expected Pattern by Shock Type</div>
                  <div style={{overflowX:"auto"}}>
                    <table style={{width:"100%",borderCollapse:"collapse",fontFamily:"DM Sans",fontSize:11,minWidth:600}}>
                      <thead>
                        <tr style={{borderBottom:"1px solid rgba(42,79,122,0.4)"}}>
                          {["Shock Type","Pump (EF)","IVC","FAST","Lung"].map(h=>(
                            <th key={h} style={{padding:"6px 12px",color:T.txt4,fontWeight:700,textAlign:"left",fontFamily:"JetBrains Mono",fontSize:9,textTransform:"uppercase"}}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          {type:"Distributive",color:T.coral,  pump:"Hyperdynamic ↑EF",  ivc:"Flat / collapsible",fast:"Negative",   lung:"Variable"},
                          {type:"Cardiogenic", color:T.red,    pump:"Reduced EF ↓",      ivc:"Plethoric (↑CVP)",  fast:"Negative",   lung:"Diffuse B-lines"},
                          {type:"Tamponade",   color:T.purple,pump:"Effusion + RV collapse",ivc:"Plethoric",      fast:"Pericardial fluid",lung:"Normal"},
                          {type:"PE (massive)",color:T.purple,pump:"RV dilation (McConnell)",ivc:"Plethoric",     fast:"Negative",   lung:"Normal or A-line"},
                          {type:"Tension PTX", color:T.purple,pump:"Underfilling LV",    ivc:"Plethoric (↑ITP)",  fast:"Negative",   lung:"No lung sliding"},
                          {type:"Hemorrhagic", color:T.orange,pump:"Hyperdynamic ↑EF",   ivc:"Flat / collapsible",fast:"POSITIVE ⚠",  lung:"Normal"},
                        ].map((row,i) => (
                          <tr key={i} style={{borderBottom:"1px solid rgba(42,79,122,0.2)",background:i%2===0?"rgba(14,37,68,0.15)":"transparent"}}
                            onMouseEnter={e=>e.currentTarget.style.background="rgba(42,79,122,0.15)"}
                            onMouseLeave={e=>e.currentTarget.style.background=i%2===0?"rgba(14,37,68,0.15)":"transparent"}>
                            <td style={{padding:"8px 12px",fontFamily:"DM Sans",fontWeight:700,color:row.color}}>{row.type}</td>
                            <td style={{padding:"8px 12px",color:T.txt2}}>{row.pump}</td>
                            <td style={{padding:"8px 12px",color:T.txt2}}>{row.ivc}</td>
                            <td style={{padding:"8px 12px",color:row.fast.includes("⚠")?T.red:T.txt2,fontWeight:row.fast.includes("⚠")?700:400}}>{row.fast}</td>
                            <td style={{padding:"8px 12px",color:T.txt2}}>{row.lung}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ RESUSCITATION PROTOCOLS ═══════════════════════════ */}
        {tab === "resus" && (
          <div className="fade-in">
            <div style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.orange,textTransform:"uppercase",letterSpacing:2,marginBottom:6}}>
              Resuscitation Protocols by Shock Etiology
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:14}}>
              {SHOCK_TYPES.map(s => (
                <button key={s.id} onClick={()=>setResusType(s.id)}
                  style={{...glass,padding:"10px 8px",border:`2px solid ${resusType===s.id?s.color+"88":"rgba(42,79,122,0.35)"}`,background:resusType===s.id?`${s.color}15`:"rgba(8,22,40,0.78)",cursor:"pointer",borderRadius:10,textAlign:"center",transition:"all .15s"}}>
                  <div style={{fontSize:16,marginBottom:3}}>{s.icon}</div>
                  <div style={{fontFamily:"DM Sans",fontWeight:700,fontSize:11,color:resusType===s.id?s.color:T.txt2}}>{s.label}</div>
                </button>
              ))}
            </div>

            {activeResus && (
              <div className="fade-in" key={resusType}>
                <div style={{...glass,padding:"14px 18px",marginBottom:14,borderLeft:`4px solid ${activeResus.color}`,background:`linear-gradient(135deg,${activeResus.color}08,rgba(8,22,40,0.88))`}}>
                  <div style={{fontFamily:"Playfair Display",fontSize:18,fontWeight:700,color:activeResus.color,marginBottom:12}}>{activeResus.title}</div>
                  <div style={{display:"flex",flexDirection:"column",gap:12}}>
                    {activeResus.steps.map((phase,i) => (
                      <div key={i} style={{display:"flex",gap:14}}>
                        <div style={{flexShrink:0,width:90,textAlign:"center"}}>
                          <div style={{padding:"6px 8px",background:`${activeResus.color}20`,border:`1px solid ${activeResus.color}44`,borderRadius:8}}>
                            <div style={{fontFamily:"JetBrains Mono",fontSize:9,fontWeight:700,color:activeResus.color}}>{phase.t}</div>
                          </div>
                          {i < activeResus.steps.length-1 && <div style={{width:2,height:20,background:`${activeResus.color}33`,margin:"4px auto"}}/>}
                        </div>
                        <div style={{flex:1,padding:"12px 14px",background:"rgba(14,37,68,0.5)",border:`1px solid ${activeResus.color}22`,borderRadius:10}}>
                          <div style={{fontFamily:"DM Sans",fontWeight:700,fontSize:13,color:activeResus.color,marginBottom:8}}>{phase.label}</div>
                          {phase.items.map((item,j) => (
                            <div key={j} style={{display:"flex",gap:8,marginBottom:6}}>
                              <div style={{width:18,height:18,borderRadius:4,background:`${activeResus.color}15`,border:`1px solid ${activeResus.color}33`,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",marginTop:1}}>
                                <span style={{fontFamily:"JetBrains Mono",fontSize:9,color:activeResus.color}}>{j+1}</span>
                              </div>
                              <span style={{fontFamily:"DM Sans",fontSize:12,color:T.txt,lineHeight:1.6}}>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Universal pearls */}
                <div style={{...glass,padding:"16px 18px"}}>
                  <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.yellow,textTransform:"uppercase",letterSpacing:2,marginBottom:12}}>💎 Universal Resuscitation Principles</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    {[
                      {head:"Reassess constantly",   body:"Shock is dynamic — response to treatment changes the diagnosis. Reassess after every intervention."},
                      {head:"Treat the cause",        body:"Vasopressors treat the manifestation, not the cause. Source control (surgery, drainage, antibiosis) is the treatment."},
                      {head:"Avoid fluid over-resuscitation",body:"After initial bolus, reassess with dynamic measures. Liberal fluids worsen outcomes in ARDS, cardiogenic shock, and burns."},
                      {head:"Early vasopressors",     body:"Do not delay vasopressors waiting for fluid response. In septic shock: start vasopressors early — do not give > 2L before starting NE."},
                      {head:"RUSH exam guides therapy",body:"Serial RUSH exams differentiate shock types and response to treatment. Echo IVC changes are faster than labs."},
                      {head:"Team communication",     body:"State your diagnosis, plan, and escalation threshold aloud. The team cannot respond to what they don't know."},
                    ].map((item,i) => (
                      <div key={i} style={{padding:"10px 14px",background:"rgba(14,37,68,0.5)",border:"1px solid rgba(42,79,122,0.25)",borderRadius:9}}>
                        <div style={{fontFamily:"DM Sans",fontWeight:700,fontSize:12,color:T.yellow,marginBottom:4}}>{item.head}</div>
                        <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt2,lineHeight:1.5}}>{item.body}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{textAlign:"center",paddingBottom:24,paddingTop:14}}>
          <span style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,letterSpacing:1.5}}>
            NOTRYA SHOCK HUB · SSC 2021 · PROPPR 2015 · VANISH 2016 · DE BACKER NEJM 2010 · SMART TRIAL · VERIFY ALL DOSING IN CLINICAL CONTEXT
          </span>
        </div>
      </div>
    </div>
  );
}