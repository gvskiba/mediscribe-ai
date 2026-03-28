import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";

// ════════════════════════════════════════════════════════════
//  DESIGN TOKENS — Notrya dark theme
// ════════════════════════════════════════════════════════════
const T = {
  bg:"#050f1e", panel:"#081628", card:"#0b1e36", up:"#0e2544",
  border:"rgba(26,53,85,0.8)", borderHi:"rgba(42,79,122,0.9)",
  blue:"#3b9eff", teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b",
  purple:"#9b6dff", orange:"#ff9f43", pink:"#ff6b9d",
  txt:"#e8f0fe", txt2:"#8aaccc", txt3:"#4a6a8a", txt4:"#2e4a6a",
};

const OB = "#ff6b9d";

const EMERGENCIES = [
  { id:"preeclampsia", icon:"🩺", title:"Pre-eclampsia", subtitle:"With & without severe features", acog:"PB #222", incidence:"2–8% of pregnancies", mortality:"Leading cause of maternal death", color:"#ff6b6b", glass:"rgba(255,107,107,0.07)", border:"rgba(255,107,107,0.28)", accent:"#ff9999", category:"Hypertensive" },
  { id:"eclampsia", icon:"⚡", title:"Eclampsia", subtitle:"Seizure complicating pre-eclampsia", acog:"ACOG Algorithm 2023", incidence:"1–2% of pre-eclampsia", mortality:"High — act immediately", color:"#f5c842", glass:"rgba(245,200,66,0.07)", border:"rgba(245,200,66,0.28)", accent:"#f7d875", category:"Hypertensive" },
  { id:"hellp", icon:"🧬", title:"HELLP Syndrome", subtitle:"Haemolysis · Elevated LFTs · Low Platelets", acog:"PB #222", incidence:"0.5–0.9% of pregnancies", mortality:"Very high — deliver urgently", color:"#ff9f43", glass:"rgba(255,159,67,0.07)", border:"rgba(255,159,67,0.28)", accent:"#ffb76b", category:"Hypertensive" },
  { id:"pph", icon:"🩸", title:"Postpartum Haemorrhage", subtitle:"Blood loss ≥ 1,000 mL · Signs of hypovolaemia", acog:"PB #183", incidence:"1–5% of deliveries", mortality:"Leading cause of maternal mortality worldwide", color:"#ff6b6b", glass:"rgba(255,107,107,0.07)", border:"rgba(255,107,107,0.28)", accent:"#ff9999", category:"Haemorrhage" },
  { id:"abruption", icon:"🔴", title:"Placental Abruption", subtitle:"Premature placental separation", acog:"PB #222 / Clinical guidelines", incidence:"1% of pregnancies", mortality:"High fetal / maternal risk", color:"#ff6b6b", glass:"rgba(255,107,107,0.07)", border:"rgba(255,107,107,0.28)", accent:"#ff9999", category:"Haemorrhage" },
  { id:"afe", icon:"💨", title:"Amniotic Fluid Embolism", subtitle:"Sudden cardiovascular collapse · Coagulopathy", acog:"ACOG Clinical Guidance", incidence:"2–8 per 100,000 deliveries", mortality:"~20–60% — highest maternal mortality", color:"#9b6dff", glass:"rgba(155,109,255,0.07)", border:"rgba(155,109,255,0.28)", accent:"#b99bff", category:"Cardiovascular" },
  { id:"shoulder", icon:"🤲", title:"Shoulder Dystocia", subtitle:"Anterior shoulder impacted behind symphysis pubis", acog:"PB #178", incidence:"0.6–0.7% of vaginal deliveries", mortality:"Neonatal hypoxia / maternal trauma", color:"#3b9eff", glass:"rgba(59,158,255,0.07)", border:"rgba(59,158,255,0.28)", accent:"#6ab8ff", category:"Intrapartum" },
  { id:"cord_prolapse", icon:"🔀", title:"Umbilical Cord Prolapse", subtitle:"Cord descends ahead of presenting part", acog:"ACOG Clinical Guidance", incidence:"0.1–0.6% of deliveries", mortality:"Fetal hypoxia — surgical emergency", color:"#00e5c0", glass:"rgba(0,229,192,0.07)", border:"rgba(0,229,192,0.28)", accent:"#33eccc", category:"Intrapartum" },
  { id:"uterine_rupture", icon:"💥", title:"Uterine Rupture", subtitle:"Full-thickness uterine wall defect", acog:"ACOG Clinical Guidance", incidence:"1 in 1,500–2,000 deliveries", mortality:"Catastrophic — surgical emergency", color:"#ff6b6b", glass:"rgba(255,107,107,0.07)", border:"rgba(255,107,107,0.28)", accent:"#ff9999", category:"Intrapartum" },
  { id:"uterine_inversion", icon:"🔄", title:"Uterine Inversion", subtitle:"Uterine fundus inverts into cavity", acog:"ACOG Clinical Guidance", incidence:"1 in 2,500–6,000 deliveries", mortality:"Neurogenic + hypovolaemic shock", color:"#ff9f43", glass:"rgba(255,159,67,0.07)", border:"rgba(255,159,67,0.28)", accent:"#ffb76b", category:"Intrapartum" },
];

const CATEGORIES = ["All", "Hypertensive", "Haemorrhage", "Cardiovascular", "Intrapartum"];

const CLINICAL_DATA = {
  preeclampsia: {
    definition: "New-onset hypertension (SBP ≥ 140 or DBP ≥ 90 mmHg on two occasions ≥ 4 h apart) after 20 weeks gestation, with proteinuria OR severe features.",
    severeCriteria: [
      "SBP ≥ 160 or DBP ≥ 110 mmHg on two occasions ≥ 4 h apart",
      "Thrombocytopaenia (platelets < 100,000/µL)",
      "Renal insufficiency (creatinine > 1.1 mg/dL or doubling of baseline)",
      "Impaired hepatic function (transaminases ≥ 2× normal)",
      "Pulmonary oedema",
      "New-onset headache unresponsive to medication / visual disturbances",
    ],
    workup: [
      {icon:"🩸", label:"CBC with platelets", detail:"Every 6–12 h if severe features; q3d if no severe features. Platelets < 100K = HELLP concern."},
      {icon:"🧪", label:"CMP / LFTs / creatinine", detail:"AST/ALT, creatinine, uric acid, bilirubin. Repeat per clinical course."},
      {icon:"💛", label:"24-h urine protein OR spot PCR", detail:"Protein ≥ 300 mg/24h or PCR ≥ 0.3 mg/mg = significant proteinuria. Not required if severe features present."},
      {icon:"📊", label:"Continuous fetal monitoring (NST/BPP)", detail:"At least daily if pre-term. CTG if ≥ 34 weeks or clinical concern. Biophysical profile."},
      {icon:"📷", label:"Obstetric ultrasound", detail:"Fetal growth, amniotic fluid index (AFI), umbilical artery Dopplers if < 37 weeks."},
      {icon:"🫀", label:"Maternal vitals q4–6h", detail:"BP every 15 min if severe range HTN. O₂ sat monitoring. Daily weight / fluid balance."},
    ],
    treatment: [
      {cat:"Antihypertensive",drug:"Labetalol IV",dose:"Initial: 20 mg IV over 2 min → 40 mg → 80 mg q10 min (max 220 mg per episode)",note:"First-line acute severe HTN. Avoid if asthma or COPD.",ref:"ACOG Level A"},
      {cat:"Antihypertensive",drug:"Nifedipine PO (IR)",dose:"10 mg PO → repeat 10 mg after 20 min prn (max 30 mg per episode)",note:"Sublingual route NOT recommended. May cause reflex tachycardia.",ref:"ACOG Level A"},
      {cat:"Antihypertensive",drug:"Hydralazine IV",dose:"5–10 mg IV q20 min prn (max 20 mg total per episode)",note:"Acceptable alternative. Unpredictable response; use labetalol/nifedipine first.",ref:"ACOG Level B"},
      {cat:"Seizure Prophylaxis",drug:"Magnesium Sulphate",dose:"Loading: 4–6 g IV over 15–20 min → maintenance 1–2 g/h IV infusion",note:"Give in ALL pre-eclampsia with severe features. Monitor DTRs, UO, resp rate. Antidote: Ca gluconate 1 g IV.",ref:"ACOG Level A"},
      {cat:"Maintenance HTN",drug:"Labetalol PO",dose:"200–800 mg PO BID–TID",note:"For chronic outpatient BP control targeting SBP 120–160 / DBP 80–105.",ref:"ACOG Level A"},
      {cat:"Maintenance HTN",drug:"Nifedipine XL PO",dose:"30–90 mg PO daily",note:"Preferred maintenance agent. Safe in all trimesters.",ref:"ACOG Level A"},
      {cat:"Delivery",drug:"Timing — without severe features",dose:"Deliver at ≥ 37⁰/₇ weeks",note:"Earlier delivery if worsening or refractory despite treatment.",ref:"ACOG PB #222"},
      {cat:"Delivery",drug:"Timing — with severe features",dose:"Deliver at ≥ 34⁰/₇ weeks (earlier if unstable)",note:"Corticosteroids if 34–36⁶/₇ weeks for fetal lung maturity.",ref:"ACOG PB #222"},
    ],
    followup: [
      "BP monitoring daily × 2 weeks postpartum; then at 6-week visit",
      "Continue antihypertensive Rx postpartum if SBP ≥ 150 or DBP ≥ 100",
      "Low-dose aspirin 81 mg daily from 12–28 weeks in future pregnancies if ≥ 1 high-risk factor",
      "Counsel on ↑ lifetime risk of CVD, stroke, renal disease",
      "Screen for hypertension at all future visits",
      "Referral to maternal-fetal medicine (MFM) if recurrence or preterm PE",
    ],
    reference: "ACOG Practice Bulletin #222 (2020, interim update 2024) · ACOG Acute HTN Algorithm 2023",
  },
  eclampsia: {
    definition: "New-onset grand-mal seizures in a woman with pre-eclampsia. Can occur antepartum, intrapartum, or postpartum (up to 6 weeks post-delivery). No prior seizure disorder.",
    workup: [
      {icon:"⚡", label:"Immediate airway assessment", detail:"Position lateral decubitus. Protect airway. Call for help — activate maternal emergency team."},
      {icon:"🩺", label:"Vital signs & neuro exam", detail:"BP, O₂ sat, GCS, fetal heart rate — immediately. Duration and character of seizure."},
      {icon:"🩸", label:"Urgent labs", detail:"CBC, CMP, LFTs, coagulation panel (PT/INR/fibrinogen), Mg level if on MgSO₄."},
      {icon:"🔍", label:"Exclude other causes", detail:"CT head if atypical, neurological deficits persist > 1 h, or no pre-eclampsia features. Rule out CVA, thrombosis."},
      {icon:"📊", label:"Fetal monitoring", detail:"Continuous CTG immediately post-seizure. Expect transient bradycardia. Reassess for delivery."},
    ],
    treatment: [
      {cat:"Seizure Control",drug:"Magnesium Sulphate",dose:"4–6 g IV over 5–10 min (bolus) STAT → 2 g/h maintenance",note:"Drug of choice. MORE effective than phenytoin or diazepam for eclampsia. Do NOT delay.",ref:"ACOG Level A"},
      {cat:"Seizure Control",drug:"If seizing ON MgSO₄",dose:"2 g MgSO₄ IV additional bolus over 3–5 min OR Lorazepam 2 mg IV",note:"Check Mg level — may need to ↑ maintenance infusion. Add BZD if seizure persists.",ref:"ACOG Level B"},
      {cat:"Airway",drug:"O₂ supplementation",dose:"100% O₂ by face mask. Intubate if airway compromised or persistent seizure > 5 min.",note:"Protect from injury. Left lateral tilt if pregnant. Do not restrain.",ref:"ACOG Algorithm 2023"},
      {cat:"BP Control",drug:"Labetalol IV or Nifedipine PO",dose:"As per severe HTN protocol — target SBP < 160 / DBP < 110 within 60 min",note:"Treat all severe-range BP regardless of seizure status.",ref:"ACOG Level A"},
      {cat:"Delivery",drug:"Delivery — all eclampsia",dose:"Delivery after maternal stabilisation. Route depends on obstetric factors.",note:"Aim within 6–12 h of stabilisation. Do not delay delivery for eclampsia remote from term.",ref:"ACOG PB #222"},
    ],
    followup: [
      "Continue MgSO₄ for 24–48 h postpartum (risk of postpartum eclampsia peaks 24–48 h)",
      "Antihypertensive therapy as needed — see pre-eclampsia protocol",
      "Neurology referral if seizures atypical or neurological deficits persist",
      "Long-term CVD risk counselling — same as pre-eclampsia",
      "Low-dose aspirin in future pregnancies (see pre-eclampsia follow-up)",
    ],
    reference: "ACOG Eclampsia Algorithm 2023 · ACOG Practice Bulletin #222",
  },
  hellp: {
    definition: "Haemolysis (LDH > 600 IU/L, abnormal peripheral smear) + Elevated Liver Enzymes (AST/ALT ≥ 2× ULN) + Low Platelets (< 100,000/µL). A severe variant of pre-eclampsia — life-threatening.",
    workup: [
      {icon:"🧬", label:"CBC with peripheral smear", detail:"Thrombocytopaenia (< 100K), schistocytes, burr cells. Check every 6 h — rapid progression."},
      {icon:"🧪", label:"LFTs / LDH / bilirubin", detail:"AST/ALT ≥ 2× ULN; LDH > 600 IU/L; indirect bilirubin ↑. Hallmarks of haemolysis."},
      {icon:"🩸", label:"Coagulation panel", detail:"PT/INR, aPTT, fibrinogen. DIC occurs in up to 20% of HELLP — check urgently."},
      {icon:"📷", label:"RUQ ultrasound", detail:"Exclude hepatic haematoma / rupture if severe RUQ pain. Hepatic rupture is catastrophic."},
      {icon:"🫀", label:"Maternal haemodynamic assessment", detail:"BP every 15 min. UO (Foley catheter). Signs of DIC or hepatic rupture."},
      {icon:"📊", label:"Fetal surveillance", detail:"Continuous CTG. Biophysical profile. Delivery assessment."},
    ],
    treatment: [
      {cat:"Magnesium",drug:"MgSO₄",dose:"4–6 g IV load → 1–2 g/h maintenance",note:"MANDATORY for seizure prophylaxis even without eclampsia.",ref:"ACOG Level A"},
      {cat:"Antihypertensive",drug:"As per severe HTN protocol",dose:"Labetalol IV / Nifedipine PO — keep SBP < 160 / DBP < 110",note:"See pre-eclampsia treatment. Urgent BP control.",ref:"ACOG Level A"},
      {cat:"Blood Products",drug:"Platelet transfusion",dose:"Platelets < 50,000 before surgery / < 20,000 regardless",note:"Check DIC — FFP and cryoprecipitate if fibrinogen < 200. Cell salvage if major bleeding.",ref:"ACOG Level C"},
      {cat:"Corticosteroids",drug:"Betamethasone / Dexamethasone",dose:"Betamethasone 12 mg IM q24h × 2 doses (fetal lung maturity) if 24–34 weeks",note:"Dexamethasone IV NOT proven to improve maternal platelet count despite prior studies.",ref:"ACOG Level B"},
      {cat:"Delivery",drug:"Deliver ALL HELLP patients",dose:"≥ 34 weeks: deliver within 24 h. < 34 weeks: stabilise then deliver — no expectant management.",note:"Route: C-section preferred if platelet < 50K or rapid deterioration. Vaginal delivery if appropriate.",ref:"ACOG PB #222"},
    ],
    followup: [
      "Serial labs q6h until platelets trending upward (nadir usually 24–48 h postpartum)",
      "Watch for DIC, renal failure, pulmonary oedema, hepatic rupture for 72 h",
      "Recurrence risk: 3–5% future pregnancies; 20–25% if pre-eclampsia with severe features",
      "MFM referral for future pregnancy planning",
      "Lifelong CVD and autoimmune screening",
    ],
    reference: "ACOG Practice Bulletin #222 (interim update 2024)",
  },
  pph: {
    definition: "Cumulative blood loss ≥ 1,000 mL OR blood loss accompanied by signs/symptoms of hypovolaemia within 24 h of birth (ACOG PB #183). Leading preventable cause of maternal mortality.",
    causesThe4T: ["Tone — uterine atony (80% of PPH)", "Trauma — lacerations, uterine rupture", "Tissue — retained placenta / products of conception", "Thrombin — coagulopathy (DIC, inherited)"],
    workup: [
      {icon:"🩸", label:"Quantitative blood loss (QBL)", detail:"Weigh all blood-soaked materials. Visual estimation underestimates by 33–50%. QBL more accurate."},
      {icon:"🩺", label:"Bimanual uterine examination", detail:"Assess uterine tone. 'Boggy' uterus = atony. Empty bladder first. Remove intrauterine clots."},
      {icon:"🔍", label:"Inspect cervix / vagina / perineum", detail:"Speculum exam for lacerations. If bleeding despite firm uterus — look for genital tract trauma."},
      {icon:"🧪", label:"STAT labs", detail:"CBC, coagulation (PT/INR/fibrinogen), T&S, TEG/ROTEM if available. Recheck q30–60 min in severe PPH."},
      {icon:"🫀", label:"Two large-bore IVs + monitoring", detail:"Foley catheter for UO. Continuous vital signs. Activate massive transfusion protocol if > 1,500 mL loss."},
    ],
    treatment: [
      {cat:"Uterotonic — 1st Line",drug:"Oxytocin",dose:"10–40 units in 500–1,000 mL NS IV infusion OR 10 units IM",note:"Give immediately after delivery. Rapid IV bolus can cause hypotension — use dilute infusion.",ref:"ACOG Level A"},
      {cat:"Uterotonic — 2nd Line",drug:"Methylergonovine (Methergine)",dose:"0.2 mg IM q2–4h prn",note:"Contraindicated in hypertension, pre-eclampsia. DO NOT give IV push.",ref:"ACOG Level B"},
      {cat:"Uterotonic — 2nd Line",drug:"Carboprost (Hemabate)",dose:"250 mcg IM q15–90 min (max 8 doses)",note:"Contraindicated in asthma. Can cause bronchospasm, diarrhoea, fever.",ref:"ACOG Level B"},
      {cat:"Uterotonic — 2nd Line",drug:"Misoprostol",dose:"600–1,000 mcg PR / SL / PO",note:"If IV not available. Less effective than oxytocin but accessible.",ref:"ACOG Level B"},
      {cat:"Antifibrinolytic",drug:"Tranexamic Acid (TXA)",dose:"1 g IV over 10 min (1 mL/min). Repeat 1 g if bleeding continues after 30 min.",note:"Give within 3 h of birth. Reduces PPH mortality by ~30% (WOMAN Trial). ⚠ Do NOT give > 3 h after birth — no benefit.",ref:"ACOG Level B / WOMAN Trial"},
      {cat:"Mechanical",drug:"Uterine massage / bimanual compression",dose:"Bimanual uterine compression while uterotonics are administered",note:"Temporising measure — do not delay pharmacological treatment.",ref:"ACOG Level B"},
      {cat:"Mechanical",drug:"Uterine balloon tamponade",dose:"Bakri balloon / SOS / JADA device",note:"All obstetric facilities should have nonsurgical haemorrhage control devices available (ACOG 2022 update).",ref:"ACOG Clinical Practice Update"},
      {cat:"Transfusion",drug:"Massive Transfusion Protocol",dose:"1:1:1 ratio — pRBC : FFP : Platelets. Transfuse for clinical bleeding, Hgb < 7 g/dL, or haemodynamic instability.",note:"Activate MTP early. Do not wait for labs.",ref:"ACOG Level C"},
      {cat:"Surgical",drug:"Uterine compression sutures / ligation / hysterectomy",dose:"B-Lynch suture, uterine artery ligation, or peripartum hysterectomy if haemorrhage refractory to medical/mechanical Rx",note:"Do NOT delay surgery while waiting to correct coagulopathy — correct simultaneously.",ref:"ACOG Level C"},
    ],
    followup: [
      "Iron supplementation post-discharge: ferrous sulphate 325 mg TID × 3 months",
      "Haemoglobin check at 6-week visit",
      "Debrief with patient re: risk of recurrence (10–15% in future pregnancy)",
      "Haematology referral if coagulopathy identified",
      "Anaemia follow-up with PCP",
      "OB-specific PPH risk assessment documented for future deliveries",
    ],
    reference: "ACOG Practice Bulletin #183 (2017) · ACOG Clinical Practice Update: Nonsurgical Haemorrhage-Control Devices (2022) · WOMAN Trial 2017",
  },
  abruption: {
    definition: "Premature separation of a normally implanted placenta before delivery. Occurs in ~1% of pregnancies. Leading cause of antepartum haemorrhage — associated with high fetal and maternal mortality.",
    workup: [
      {icon:"🔴", label:"Clinical diagnosis — USS not diagnostic", detail:"USS sensitivity < 50% for abruption. Clinical diagnosis: vaginal bleeding, uterine tenderness, hypertonic contractions, fetal distress."},
      {icon:"📊", label:"Continuous fetal monitoring (CTG)", detail:"Non-reassuring FHR (late decelerations, bradycardia) = fetal compromise. Sinusoidal pattern = severe."},
      {icon:"🧪", label:"Haematological panel + coagulation", detail:"CBC, fibrinogen, PT/INR. Fibrinogen < 200 = high risk of DIC. Check Kleihauer-Betke if Rh-negative."},
      {icon:"🏥", label:"IV access × 2 + crossmatch", detail:"Anticipate massive haemorrhage. Two large-bore IVs. T&S minimum; consider T&C (4 units pRBC)."},
      {icon:"🩺", label:"Uterine assessment", detail:"Fundal height, uterine tenderness, rigidity, tetanic contractions ('woody uterus' = concealed abruption)."},
    ],
    treatment: [
      {cat:"Resuscitation",drug:"IV crystalloid resuscitation",dose:"Normal saline / LR bolus. Maintain MAP > 65. Foley for strict UO monitoring.",note:"Avoid aggressive fluid resuscitation in coagulopathy — use blood products.",ref:"ACOG Level C"},
      {cat:"Blood Products",drug:"Massive transfusion protocol",dose:"pRBC : FFP : Platelets 1:1:1 if DIC or haemodynamic instability",note:"Cryoprecipitate if fibrinogen < 200 mg/dL. Correct coagulopathy URGENTLY.",ref:"ACOG Level B"},
      {cat:"Fetal Lung Maturity",drug:"Betamethasone",dose:"12 mg IM q24h × 2 doses if 24–33⁶/₇ weeks and maternal/fetal status allows delay",note:"Do NOT delay delivery for corticosteroids if maternal or fetal instability.",ref:"ACOG Level A"},
      {cat:"Delivery",drug:"Delivery route & timing",dose:"Immediate delivery if: fetal distress, haemodynamic instability, or coagulopathy. Route by obstetric indications.",note:"Vaginal delivery possible if maternal/fetal status stable and vertex. C-section if fetal distress or rapid deterioration.",ref:"ACOG Level C"},
      {cat:"Rh Prophylaxis",drug:"Rho(D) immunoglobulin",dose:"300 mcg IM for Rh-negative patient. Kleihauer-Betke to determine if additional dose needed.",note:"",ref:"ACOG Level A"},
    ],
    followup: [
      "Recurrence risk: 5–15% — document in chart for next pregnancy",
      "Screen for thrombophilia (antiphospholipid syndrome, inherited thrombophilia) especially if severe/recurrent",
      "Low-dose aspirin from 12–28 weeks in future pregnancies",
      "MFM referral for subsequent pregnancy",
      "Grief counselling / mental health referral if fetal loss",
      "Perinatal pathology of placenta for all significant abruptions",
    ],
    reference: "ACOG Practice Bulletin #222 · ACOG Committee Opinion #764 (antenatal fetal surveillance)",
  },
  afe: {
    definition: "Amniotic fluid embolism (AFE): sudden cardiovascular collapse in peripartum period due to entry of amniotic fluid/fetal debris into maternal circulation — anaphylactoid-type reaction. Classic triad: hypotension + hypoxia + coagulopathy/DIC. Diagnosis of exclusion.",
    workup: [
      {icon:"💨", label:"Clinical recognition — triad", detail:"Sudden hypotension / cardiac arrest + acute hypoxia + coagulopathy. Occurs during labour, delivery, or within 30 min postpartum."},
      {icon:"🫀", label:"12-lead ECG + continuous monitoring", detail:"Right heart strain, S1Q3T3, tachyarrhythmias, PEA arrest. Echo if available (R heart dilation)."},
      {icon:"🧪", label:"STAT labs: DIC panel + ABG", detail:"Fibrinogen (typically very low), PT/INR, aPTT, CBC, ABG (hypoxaemia/acidosis), troponin, BNP."},
      {icon:"🔍", label:"Exclude differentials", detail:"PE, anaphylaxis, cardiac arrest (non-AFE), septic shock, local anaesthetic toxicity, placental abruption, peripartum cardiomyopathy."},
      {icon:"📷", label:"CXR + echo", detail:"CXR: pulmonary oedema. Bedside echo: RV dilation, poor LV function, McConnell sign."},
    ],
    treatment: [
      {cat:"Resuscitation",drug:"High-quality CPR if cardiac arrest",dose:"Standard ACLS. LUD or left lateral tilt if gravid uterus. Perimortem C-section by 5 min if no ROSC.",note:"Call maternal cardiac arrest team. See AHA Cardiac Arrest in Pregnancy algorithm.",ref:"AHA 2020 / ACLS"},
      {cat:"Airway",drug:"Intubation + 100% O₂",dose:"RSI with cricoid pressure. Target SpO₂ > 94%. PEEP 5–8 cmH₂O. Avoid hypoxaemia.",note:"Pregnant patients desaturate rapidly — pre-oxygenate well.",ref:"ACOG Clinical Guidance"},
      {cat:"Vasopressor",drug:"Noradrenaline / Vasopressin",dose:"Noradrenaline 0.01–1 mcg/kg/min. Vasopressin 0.03 units/min for refractory hypotension.",note:"Avoid vasopressors that cause uterine vasoconstriction if fetus not yet delivered.",ref:"ACOG / Critical Care"},
      {cat:"DIC Management",drug:"Blood products — 1:1:1 MTP",dose:"pRBC : FFP : Platelets 1:1:1. Cryoprecipitate for fibrinogen < 200. TXA 1 g IV — controversial but used in DIC.",note:"DIC is the most life-threatening feature. Correct aggressively and early.",ref:"ACOG Level C"},
      {cat:"Adjuncts",drug:"Ondansetron + atropine",dose:"Ondansetron 4–8 mg IV (anaphylactoid bronchoconstriction). Atropine 0.5–1 mg IV if bradycardia.",note:"No antidote exists — all management is supportive.",ref:"ACOG Clinical Guidance"},
      {cat:"Delivery",drug:"Emergency delivery",dose:"Immediate delivery if AFE and fetus not yet delivered. Perimortem C-section if cardiac arrest.",note:"Delivery may improve maternal haemodynamics even postpartum.",ref:"ACOG"},
    ],
    followup: [
      "ICU admission mandatory — organ support, haemodynamic monitoring 48–72 h",
      "Haematology and critical care follow-up",
      "PTSD screening — both patient and family (traumatic event)",
      "Report to AFE Foundation registry for epidemiological data",
      "Subsequent pregnancies: no clear recurrence data — MFM consultation essential",
      "Neonatal neurology follow-up for neonatal hypoxia",
    ],
    reference: "ACOG Clinical Guidance · AFE Foundation · AHA 2020 Maternal Resuscitation Algorithm",
  },
  shoulder: {
    definition: "Shoulder dystocia occurs when the fetal anterior shoulder becomes impacted behind the maternal symphysis pubis after delivery of the fetal head, requiring additional obstetric manoeuvres beyond routine axial traction. Obstetric emergency — fetal hypoxia risk.",
    workup: [
      {icon:"⏰", label:"Call for help immediately", detail:"OB, midwife, paediatrician/neonatologist, additional nursing. Note time of head delivery."},
      {icon:"🩺", label:"Confirm diagnosis", detail:"Failure of restitution. Turtling sign (head retracts). Resistance when gentle axial traction applied."},
      {icon:"👶", label:"Neonatal team standby", detail:"Neonatal resuscitation team on standby. Document time of delivery."},
    ],
    treatment: [
      {cat:"HELPERR Mnemonic",drug:"Call for H·E·L·P",dose:"H — Call for Help. E — Evaluate for Episiotomy (does not relieve bony obstruction — only for access).",note:"Systematic approach. All steps can be done in any order.",ref:"ACOG PB #178"},
      {cat:"1st Line",drug:"McRoberts Manoeuvre",dose:"Hyperflexion of maternal thighs onto abdomen. Two nurses apply. Most effective first step.",note:"Flattens lordosis, rotates symphysis superiorly. Relieves 42% of shoulder dystocias alone.",ref:"ACOG PB #178"},
      {cat:"1st Line",drug:"Suprapubic Pressure",dose:"Continuous or rocking suprapubic pressure by assistant (NOT fundal pressure) toward fetal face.",note:"Combined with McRoberts — resolves 54% of shoulder dystocia. NEVER apply fundal pressure.",ref:"ACOG PB #178"},
      {cat:"2nd Line",drug:"Rubin II / Screw manoeuvre",dose:"Apply pressure to posterior aspect of anterior shoulder to adduct and rotate to oblique diameter.",note:"Reduces shoulder-to-shoulder diameter. Combine with Woods screw.",ref:"ACOG PB #178"},
      {cat:"2nd Line",drug:"Delivery of posterior arm",dose:"Sweep posterior arm across fetal chest and deliver — most effective single manoeuvre after McRoberts.",note:"Risk of humeral fracture but safer than prolonged dystocia.",ref:"ACOG PB #178"},
      {cat:"2nd Line",drug:"All-fours position (Gaskin)",dose:"Position patient on hands and knees — may dislodge impacted shoulder by gravity.",note:"Effective, safe, rapid — consider early.",ref:"ACOG PB #178"},
      {cat:"Last Resort",drug:"Zavanelli / symphysiotomy",dose:"Cephalic replacement followed by C-section (Zavanelli) OR symphysiotomy in resource-limited settings.",note:"Last resort only. Significant maternal morbidity.",ref:"ACOG PB #178"},
    ],
    followup: [
      "Neonatal assessment: brachial plexus injury (Erb's palsy), clavicle/humeral fracture, HIE (hypoxic-ischaemic encephalopathy)",
      "Neonatal neurology referral if nerve injury suspected",
      "Maternal: assess for PPH (anticipate — occurs in up to 11%), 4th-degree laceration",
      "Document delivery note meticulously: all manoeuvres used, time of each, time of delivery",
      "Debrief with patient: risk factors, recurrence risk (10–17% in subsequent vaginal delivery)",
      "MFM consultation for birth plan in future pregnancies",
    ],
    reference: "ACOG Practice Bulletin #178 (Shoulder Dystocia, 2017)",
  },
  cord_prolapse: {
    definition: "Umbilical cord prolapse: umbilical cord descends below the presenting fetal part after rupture of membranes. Incidence 0.1–0.6%. Fetal emergency — cord compression → hypoxia. Requires immediate delivery.",
    workup: [
      {icon:"🔀", label:"Diagnosis — feel or visualise cord", detail:"Suspect with sudden profound fetal bradycardia after ROM. Vaginal exam essential. Cord may be visible at introitus."},
      {icon:"📊", label:"Immediate CTG", detail:"Document FHR. Prolonged deceleration / bradycardia. Time of diagnosis to delivery (goal < 30 min)."},
      {icon:"🏥", label:"Call emergency team", detail:"OB emergency — call surgeon, anaesthesiologist, neonatologist, OR team STAT."},
    ],
    treatment: [
      {cat:"Immediate",drug:"Manual cord elevation",dose:"Insert examining hand vaginally — elevate presenting part off cord manually. Maintain until delivery.",note:"Fill bladder with 500 mL NS via Foley to elevate presenting part if manual elevation difficult.",ref:"ACOG Clinical Guidance"},
      {cat:"Position",drug:"Knee-chest or Trendelenburg position",dose:"Steep Trendelenburg / knee-chest position to use gravity to reduce cord compression.",note:"Maintain manual pressure — do not remove hand until baby delivered.",ref:"ACOG Clinical Guidance"},
      {cat:"O₂",drug:"High-flow maternal oxygen",dose:"10–15 L/min via face mask",note:"Maximise fetal oxygen delivery.",ref:"ACOG Clinical Guidance"},
      {cat:"Tocolysis",drug:"Terbutaline (if time permits)",dose:"0.25 mg SC — uterine relaxation to reduce cord compression",note:"Only if immediate C-section not available. Do NOT delay delivery for tocolysis.",ref:"ACOG Level C"},
      {cat:"Delivery",drug:"Emergency Caesarean Section",dose:"Immediate C-section — goal cord-to-delivery < 30 min. General anaesthesia if no time for regional.",note:"Maintain manual elevation throughout transfer to OR. Operator hand must NOT be removed.",ref:"ACOG Level C"},
      {cat:"Exception",drug:"Vaginal delivery if imminent",dose:"If cervix fully dilated and delivery imminent — expedite vaginal delivery (forceps/vacuum if indicated).",note:"Only if delivery can be accomplished faster than C-section.",ref:"ACOG Clinical Guidance"},
    ],
    followup: [
      "Neonatal resuscitation team at delivery — anticipate asphyxia",
      "Neonatal neurology if cord-to-delivery > 30 min or severe decelerations",
      "Document decision-to-delivery interval",
      "Inform patient of recurrence risk — similar in future pregnancies if presentation recurs",
      "MFM referral for future birth planning if risk factors present",
    ],
    reference: "ACOG Clinical Practice Guidelines · RCOG Green-top Guideline #50 (Cord Prolapse)",
  },
  uterine_rupture: {
    definition: "Full-thickness disruption of the uterine wall. Risk greatly increased with prior uterine scar (VBAC). Catastrophic emergency — fetal extrusion, haemorrhage, maternal/fetal death without immediate surgery.",
    workup: [
      {icon:"💥", label:"Classic signs", detail:"Sudden cessation of contractions + fetal bradycardia + loss of fetal station + maternal haemodynamic collapse. Pain may change character."},
      {icon:"🩺", label:"Abdominal exam", detail:"Rigid or guarded abdomen. Fetal parts palpable outside uterus. Previous scar site tenderness."},
      {icon:"🏥", label:"Emergency team activation", detail:"STAT call to OB, anaesthesia, OR, blood bank, neonatology. Initiate MTP immediately."},
      {icon:"🧪", label:"Crossmatch / MTP", detail:"Type & crossmatch minimum 4 units pRBC. Activate massive transfusion protocol."},
    ],
    treatment: [
      {cat:"Resuscitation",drug:"IV access × 2 + fluids + MTP",dose:"Large bore IVs. Normal saline bolus. Activate MTP — 1:1:1 ratio.",note:"Simultaneous resuscitation and surgical preparation — do not delay OR.",ref:"ACOG Level C"},
      {cat:"Surgery",drug:"Emergency laparotomy",dose:"STAT — no delay. Uterine repair if feasible and patient stable. Hysterectomy if uncontrollable bleeding.",note:"Decision for repair vs hysterectomy at discretion of surgeon based on anatomy and stability.",ref:"ACOG Level C"},
      {cat:"Blood Products",drug:"Massive transfusion",dose:"pRBC : FFP : Platelets 1:1:1. Cryoprecipitate if fibrinogen < 200.",note:"Anticipate coagulopathy from massive blood loss.",ref:"ACOG Level B"},
    ],
    followup: [
      "ICU post-operatively — haemodynamic monitoring",
      "Counsel on future pregnancies: C-section delivery mandatory; recurrence risk significant",
      "Psychological support — traumatic delivery experience",
      "Pathology of uterus if hysterectomy performed",
      "MFM referral for any future pregnancy planning",
    ],
    reference: "ACOG Practice Bulletin (VBAC) · ACOG Clinical Guidance",
  },
  uterine_inversion: {
    definition: "Rare obstetric emergency where the uterine fundus collapses into and through the cervix (or beyond the introitus). Causes profound neurogenic and hypovolaemic shock. Must be recognised and managed immediately.",
    workup: [
      {icon:"🔄", label:"Diagnosis — inspect and palpate", detail:"Loss of palpable uterine fundus abdominally. Smooth mass in vagina or visible at introitus. Shock disproportionate to visible blood loss."},
      {icon:"🏥", label:"Do NOT attempt placental removal first", detail:"If placenta still attached — leave it. Remove only after uterus is replaced (reduces haemorrhage)."},
      {icon:"🩺", label:"Vitals + IV access", detail:"Maternal shock is common. Two large-bore IVs. Call for help — OB team + anaesthesia."},
    ],
    treatment: [
      {cat:"Uterine Relaxation",drug:"Terbutaline / GTN / Magnesium",dose:"Terbutaline 0.25 mg SC OR nitroglycerin 50–200 mcg IV push OR MgSO₄ 2–4 g IV to relax cervical ring",note:"Relaxation of uterus facilitates manual replacement. Give BEFORE attempting Johnson's manoeuvre.",ref:"ACOG Clinical Guidance"},
      {cat:"Manual Replacement",drug:"Johnson's Manoeuvre",dose:"Grasp uterine mass. Insert hand vaginally and push fundus above umbilicus through cervical ring.",note:"First-line. Do not remove placenta first. Apply steady upward pressure, not forceful.",ref:"ACOG Level C"},
      {cat:"Uterotonics",drug:"Oxytocin AFTER replacement",dose:"Start oxytocin infusion ONLY AFTER uterus is replaced to avoid trapping inversion.",note:"Do NOT give uterotonics before replacement — will trap the fundus.",ref:"ACOG Level C"},
      {cat:"Surgical",drug:"Huntington / Haultain procedure",dose:"Laparotomy if manual replacement fails: Huntington (upward traction on round ligaments) or Haultain (posterior incision).",note:"General anaesthesia facilitates uterine relaxation for laparotomy.",ref:"ACOG Level C"},
      {cat:"Resuscitation",drug:"IV fluids + atropine for cervical shock",dose:"Atropine 0.5–1 mg IV if vagal bradycardia / hypotension. IV crystalloid + blood products as needed.",note:"Vagal stimulation from uterine manipulation → bradycardia. Atropine effective.",ref:"ACOG Level C"},
    ],
    followup: [
      "Monitor for PPH after replacement — oxytocin infusion × 4–6 h",
      "Serial vitals for 24–48 h — reassess uterine tone",
      "Counselling: small recurrence risk in future pregnancies",
      "Document all details: time of diagnosis, manoeuvres, time of reduction",
      "MFM referral for future pregnancy",
    ],
    reference: "ACOG Clinical Practice Guidance · O&G Emergency Literature",
  },
};

function GlassBg() {
  return (
    <div style={{position:"fixed",inset:0,overflow:"hidden",pointerEvents:"none",zIndex:0}}>
      {[
        {x:"10%",y:"18%",r:300,c:"rgba(255,107,157,0.06)"},
        {x:"88%",y:"12%",r:250,c:"rgba(155,109,255,0.055)"},
        {x:"78%",y:"78%",r:320,c:"rgba(255,107,107,0.05)"},
        {x:"18%",y:"80%",r:220,c:"rgba(245,200,66,0.045)"},
        {x:"50%",y:"45%",r:380,c:"rgba(59,158,255,0.03)"},
      ].map((o,i)=>(
        <div key={i} style={{position:"absolute",left:o.x,top:o.y,width:o.r*2,height:o.r*2,borderRadius:"50%",background:`radial-gradient(circle,${o.c} 0%,transparent 68%)`,transform:"translate(-50%,-50%)",animation:`obo${i%3} ${8+i*1.3}s ease-in-out infinite`}}/>
      ))}
      <svg width="100%" height="100%" style={{position:"absolute",inset:0,opacity:0.038}}>
        <defs>
          <pattern id="obg" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0L0 0 0 40" fill="none" stroke="#ff6b9d" strokeWidth="0.5"/></pattern>
          <pattern id="obl" width="200" height="200" patternUnits="userSpaceOnUse"><path d="M200 0L0 0 0 200" fill="none" stroke="#ff6b9d" strokeWidth="1"/></pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#obg)"/>
        <rect width="100%" height="100%" fill="url(#obl)"/>
      </svg>
      <style>{`
        @keyframes obo0{0%,100%{transform:translate(-50%,-50%) scale(1)}50%{transform:translate(-50%,-50%) scale(1.14)}}
        @keyframes obo1{0%,100%{transform:translate(-50%,-50%) scale(1.08)}50%{transform:translate(-50%,-50%) scale(0.9)}}
        @keyframes obo2{0%,100%{transform:translate(-50%,-50%) scale(0.94)}50%{transform:translate(-50%,-50%) scale(1.1)}}
      `}</style>
    </div>
  );
}

function GlassBox({children,style={}}){
  return(
    <div style={{background:"rgba(8,22,40,0.68)",backdropFilter:"blur(22px)",WebkitBackdropFilter:"blur(22px)",border:"1px solid rgba(26,53,85,0.8)",borderRadius:16,boxShadow:"0 4px 20px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.025)",...style}}>
      {children}
    </div>
  );
}

function ClinicalBadge({text,color}){
  return(
    <span style={{fontSize:9,fontFamily:"'JetBrains Mono',monospace",fontWeight:700,padding:"2px 8px",borderRadius:20,background:`${color}18`,border:`1px solid ${color}40`,color,whiteSpace:"nowrap"}}>{text}</span>
  );
}

function TimeBanner({targets}){
  return(
    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
      {targets.map((t,i)=>(
        <div key={i} style={{flex:"1 1 160px",background:"rgba(8,22,40,0.7)",border:"1px solid rgba(26,53,85,0.8)",borderRadius:10,padding:"9px 13px",display:"flex",alignItems:"center",gap:9,backdropFilter:"blur(12px)"}}>
          <span style={{fontSize:18}}>{t.icon}</span>
          <div>
            <div style={{fontSize:10,color:T.txt3}}>{t.label}</div>
            <div style={{fontSize:13,fontWeight:700,color:t.color||OB,fontFamily:"'JetBrains Mono',monospace"}}>{t.target}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SectionHeader({icon,title,sub,accentColor=OB}){
  return(
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,paddingBottom:12,borderBottom:"1px solid rgba(26,53,85,0.7)"}}>
      <span style={{fontSize:18}}>{icon}</span>
      <div style={{flex:1}}>
        <div style={{fontSize:14,fontWeight:700,color:T.txt}}>{title}</div>
        {sub&&<div style={{fontSize:11,color:T.txt3,marginTop:1}}>{sub}</div>}
      </div>
      <span style={{fontSize:9,fontFamily:"'JetBrains Mono',monospace",fontWeight:700,padding:"3px 10px",borderRadius:20,background:`${accentColor}12`,border:`1px solid ${accentColor}30`,color:accentColor}}>ACOG-Based</span>
    </div>
  );
}

function WorkupItem({item,checked,onToggle}){
  return(
    <div onClick={onToggle} style={{display:"grid",gridTemplateColumns:"32px 1fr",gap:10,alignItems:"center",background:checked?"rgba(255,107,157,0.05)":"rgba(14,37,68,0.45)",border:`1px solid ${checked?"rgba(255,107,157,0.3)":"rgba(26,53,85,0.7)"}`,borderRadius:9,padding:"9px 12px",cursor:"pointer",transition:"all .2s",backdropFilter:"blur(8px)",marginBottom:6}}>
      <div style={{width:28,height:28,borderRadius:8,background:checked?"rgba(255,107,157,0.18)":"rgba(59,158,255,0.08)",border:`1px solid ${checked?"rgba(255,107,157,0.45)":"rgba(59,158,255,0.25)"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>
        {checked?"✓":item.icon}
      </div>
      <div>
        <div style={{fontSize:12,fontWeight:600,color:checked?"#ff6b9d":T.txt,textDecoration:checked?"line-through":"none"}}>{item.label}</div>
        <div style={{fontSize:11,color:T.txt3,marginTop:2,lineHeight:1.4}}>{item.detail}</div>
      </div>
    </div>
  );
}

function DrugRow({rx}){
  const refColors={"ACOG Level A":"rgba(0,229,192,0.9)","ACOG Level B":"rgba(59,158,255,0.9)","ACOG Level C":"rgba(245,200,66,0.9)"};
  const rc=Object.keys(refColors).find(k=>rx.ref?.startsWith(k));
  return(
    <div style={{background:"rgba(14,37,68,0.5)",border:"1px solid rgba(26,53,85,0.7)",borderRadius:9,padding:"9px 13px",marginBottom:5,backdropFilter:"blur(8px)"}}>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8,marginBottom:rx.note?4:0}}>
        <div>
          <span style={{fontSize:12,fontWeight:700,color:T.txt}}>{rx.drug}</span>
          {rx.cat&&<span style={{fontSize:10,marginLeft:8,color:T.txt3}}>{rx.cat}</span>}
        </div>
        {rc&&<span style={{fontSize:9,fontFamily:"'JetBrains Mono',monospace",fontWeight:700,padding:"2px 7px",borderRadius:20,background:`${refColors[rc]}15`,border:`1px solid ${refColors[rc]}35`,color:refColors[rc],whiteSpace:"nowrap",flexShrink:0}}>{rc}</span>}
      </div>
      <div style={{fontSize:12,color:T.txt2,fontFamily:"'JetBrains Mono',monospace",lineHeight:1.5,marginBottom:rx.note?4:0}}>{rx.dose}</div>
      {rx.note&&<div style={{fontSize:10,color:T.txt3,lineHeight:1.4}}>{rx.note}</div>}
    </div>
  );
}

function ConditionPage({emergency,onBack,contentMap}){
  const[activeTab,setActiveTab]=useState("overview");
  const[checked,setChecked]=useState({});
  const data=contentMap?.[emergency.id] || CLINICAL_DATA[emergency.id];
  const TABS=[{id:"overview",label:"Overview",icon:"📋"},{id:"workup",label:"Workup",icon:"✅"},{id:"treatment",label:"Treatment",icon:"💊"},{id:"followup",label:"Follow-up",icon:"📅"}];

  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <GlassBox style={{padding:"18px 22px",borderLeft:`3px solid ${emergency.color}`,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:0,left:0,right:0,height:2,borderRadius:"16px 16px 0 0",background:`linear-gradient(90deg,${emergency.color},transparent)`}}/>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <button onClick={onBack} style={{background:"rgba(26,53,85,0.6)",border:"1px solid rgba(42,79,122,0.6)",borderRadius:8,padding:"5px 11px",color:T.txt3,fontSize:11,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",backdropFilter:"blur(8px)",flexShrink:0}}>← Back</button>
          <div style={{width:52,height:52,borderRadius:14,background:emergency.glass.replace("0.07","0.28"),border:`1px solid ${emergency.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>
            {emergency.icon}
          </div>
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:4}}>
              <span style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:T.txt,lineHeight:1}}>{emergency.title}</span>
              <ClinicalBadge text={emergency.acog} color={emergency.color}/>
              <ClinicalBadge text={emergency.category} color={OB}/>
            </div>
            <div style={{fontSize:12,color:T.txt3}}>{emergency.subtitle}</div>
          </div>
          <div style={{textAlign:"center",background:"rgba(14,37,68,0.6)",borderRadius:10,padding:"8px 12px",border:"1px solid rgba(26,53,85,0.8)",flexShrink:0}}>
            <div style={{fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:".06em",marginBottom:2}}>Incidence</div>
            <div style={{fontSize:10,fontWeight:700,color:emergency.color,fontFamily:"'JetBrains Mono',monospace"}}>{emergency.incidence}</div>
          </div>
        </div>
      </GlassBox>

      <div style={{display:"flex",gap:4,background:"rgba(8,22,40,0.68)",border:"1px solid rgba(26,53,85,0.8)",borderRadius:12,padding:4,backdropFilter:"blur(14px)"}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setActiveTab(t.id)}
            style={{display:"flex",alignItems:"center",gap:6,padding:"8px 16px",borderRadius:9,fontSize:12,fontWeight:activeTab===t.id?700:500,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",whiteSpace:"nowrap",flexShrink:0,transition:"all .2s",background:activeTab===t.id?emergency.glass.replace("0.07","0.22"):"transparent",border:activeTab===t.id?`1px solid ${emergency.border}`:"1px solid transparent",color:activeTab===t.id?emergency.color:T.txt3}}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      <GlassBox style={{padding:"20px 22px"}}>
        {activeTab==="overview"&&(
          <div>
            <SectionHeader icon="📋" title="Clinical Overview" sub={`${emergency.title} — ACOG-based clinical summary`} accentColor={emergency.color}/>
            <div style={{background:emergency.glass.replace("0.07","0.12"),border:`1px solid ${emergency.border}`,borderRadius:10,padding:"13px 16px",marginBottom:16,backdropFilter:"blur(8px)"}}>
              <div style={{fontSize:10,fontFamily:"'JetBrains Mono',monospace",color:emergency.accent,textTransform:"uppercase",letterSpacing:".08em",marginBottom:6}}>Definition</div>
              <div style={{fontSize:13,color:T.txt2,lineHeight:1.65}}>{data.definition}</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
              <div style={{background:"rgba(14,37,68,0.5)",border:"1px solid rgba(26,53,85,0.7)",borderRadius:10,padding:"12px 14px",backdropFilter:"blur(8px)"}}>
                <div style={{fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:".07em",marginBottom:6}}>Incidence</div>
                <div style={{fontSize:14,fontWeight:700,color:emergency.color,fontFamily:"'JetBrains Mono',monospace"}}>{emergency.incidence}</div>
              </div>
              <div style={{background:"rgba(14,37,68,0.5)",border:"1px solid rgba(26,53,85,0.7)",borderRadius:10,padding:"12px 14px",backdropFilter:"blur(8px)"}}>
                <div style={{fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:".07em",marginBottom:6}}>Clinical Significance</div>
                <div style={{fontSize:12,fontWeight:700,color:T.coral,lineHeight:1.3}}>{emergency.mortality}</div>
              </div>
            </div>
            {data.severeCriteria&&(
              <div style={{marginBottom:16}}>
                <div style={{fontSize:11,fontWeight:700,color:T.coral,marginBottom:8}}>🚨 Severe Feature Criteria (any one = severe)</div>
                {data.severeCriteria.map((c,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"flex-start",gap:8,marginBottom:6,fontSize:12,color:T.txt2}}>
                    <span style={{color:T.coral,flexShrink:0,marginTop:1}}>▸</span>{c}
                  </div>
                ))}
              </div>
            )}
            {data.causesThe4T&&(
              <div style={{marginBottom:16}}>
                <div style={{fontSize:11,fontWeight:700,color:T.orange,marginBottom:8}}>⚡ The 4 T's of PPH</div>
                {data.causesThe4T.map((c,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"flex-start",gap:8,marginBottom:6,fontSize:12,color:T.txt2}}>
                    <span style={{color:T.orange,flexShrink:0,marginTop:1}}>{i+1}.</span>{c}
                  </div>
                ))}
              </div>
            )}
            <div style={{fontSize:10,color:T.txt4,fontFamily:"'JetBrains Mono',monospace",padding:"10px 13px",background:"rgba(14,37,68,0.4)",borderRadius:8,border:"1px solid rgba(26,53,85,0.6)",lineHeight:1.7}}>📚 {data.reference}</div>
          </div>
        )}

        {activeTab==="workup"&&(
          <div>
            <SectionHeader icon="✅" title="Workup Checklist" sub="Click to mark items complete · ACOG-based diagnostic approach" accentColor={emergency.color}/>
            {data.workup.map((item,i)=>(
              <WorkupItem key={i} item={item} checked={!!checked[`w${i}`]} onToggle={()=>setChecked(p=>({...p,[`w${i}`]:!p[`w${i}`]}))}/>
            ))}
          </div>
        )}

        {activeTab==="treatment"&&(
          <div>
            <SectionHeader icon="💊" title="Treatment Protocol" sub="ACOG evidence-based pharmacological & surgical management" accentColor={emergency.color}/>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>
              {[{l:"ACOG Level A",c:"rgba(0,229,192,0.9)",d:"Good and consistent scientific evidence"},{l:"ACOG Level B",c:"rgba(59,158,255,0.9)",d:"Limited or inconsistent scientific evidence"},{l:"ACOG Level C",c:"rgba(245,200,66,0.9)",d:"Primarily consensus and expert opinion"}].map((e,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:5,fontSize:10,color:e.c}}>
                  <span style={{width:10,height:10,borderRadius:2,background:`${e.c}20`,border:`1px solid ${e.c}40`}}/>
                  {e.l}: <span style={{color:T.txt3}}>{e.d}</span>
                </div>
              ))}
            </div>
            {data.treatment.map((rx,i)=><DrugRow key={i} rx={rx}/>)}
          </div>
        )}

        {activeTab==="followup"&&(
          <div>
            <SectionHeader icon="📅" title="Follow-up & Discharge Planning" sub="Post-acute care, counselling & future pregnancy guidance" accentColor={emergency.color}/>
            <div style={{display:"flex",flexDirection:"column",gap:7}}>
              {data.followup.map((f,i)=>(
                <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,background:"rgba(14,37,68,0.45)",border:"1px solid rgba(26,53,85,0.7)",borderRadius:9,padding:"10px 13px",backdropFilter:"blur(8px)"}}>
                  <div style={{width:26,height:26,borderRadius:7,background:emergency.glass.replace("0.07","0.22"),border:`1px solid ${emergency.border}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:12,color:emergency.color,fontWeight:700}}>{i+1}</div>
                  <div style={{fontSize:12,color:T.txt2,lineHeight:1.5}}>{f}</div>
                </div>
              ))}
            </div>
            <div style={{marginTop:16,fontSize:10,color:T.txt4,fontFamily:"'JetBrains Mono',monospace",padding:"10px 13px",background:"rgba(14,37,68,0.4)",borderRadius:8,border:"1px solid rgba(26,53,85,0.6)",lineHeight:1.7}}>
              ⚠ Clinical decision support only · Final clinical decisions rest with the treating physician<br/>
              📚 {data.reference}
            </div>
          </div>
        )}
      </GlassBox>
    </div>
  );
}

function EmergencyCard({em,onSelect,index}){
  const[hov,setHov]=useState(false);
  return(
    <div onClick={()=>onSelect(em)} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{position:"relative",borderRadius:18,padding:"20px 20px 16px",cursor:"pointer",overflow:"hidden",transition:"all 0.32s cubic-bezier(0.34,1.56,0.64,1)",transform:hov?"translateY(-6px) scale(1.022)":"translateY(0) scale(1)",animation:`ob-in 0.52s ease both ${index*0.055}s`,
        background:hov?`linear-gradient(135deg,${em.glass.replace("0.07","0.22")},${em.glass})`:"rgba(8,22,40,0.68)",
        backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",
        border:`1px solid ${hov?em.border:"rgba(26,53,85,0.75)"}`,
        boxShadow:hov?`0 20px 44px rgba(0,0,0,0.5),0 0 0 1px ${em.border},inset 0 1px 0 rgba(255,255,255,0.06),0 0 36px ${em.glass.replace("0.07","0.18")}`:"0 4px 18px rgba(0,0,0,0.38),inset 0 1px 0 rgba(255,255,255,0.025)"}}>
      <div style={{position:"absolute",top:-45,right:-45,width:160,height:160,borderRadius:"50%",background:`radial-gradient(circle,${em.glass.replace("0.07","0.24")} 0%,transparent 70%)`,opacity:hov?1:0,transition:"opacity 0.3s",pointerEvents:"none"}}/>
      <div style={{position:"absolute",top:0,left:0,right:0,height:2,borderRadius:"18px 18px 0 0",background:`linear-gradient(90deg,${em.color},transparent)`,opacity:hov?1:0.25,transition:"opacity 0.3s"}}/>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:12}}>
        <div style={{width:48,height:48,borderRadius:13,background:em.glass.replace("0.07","0.28"),border:`1px solid ${em.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0,boxShadow:hov?`0 0 20px ${em.glass.replace("0.07","0.28")}`:"none",transition:"box-shadow 0.3s"}}>
          {em.icon}
        </div>
        <span style={{fontSize:9,fontFamily:"'JetBrains Mono',monospace",fontWeight:700,padding:"2px 8px",borderRadius:20,background:em.glass.replace("0.07","0.2"),border:`1px solid ${em.border}`,color:em.color,letterSpacing:".05em",backdropFilter:"blur(6px)"}}>
          {em.acog}
        </span>
      </div>
      <div style={{fontSize:9,fontFamily:"'JetBrains Mono',monospace",fontWeight:700,color:em.accent,letterSpacing:".12em",textTransform:"uppercase",marginBottom:3,opacity:0.85}}>{em.category}</div>
      <div style={{fontSize:14,fontFamily:"'Playfair Display',serif",fontWeight:600,color:T.txt,lineHeight:1.25,marginBottom:4}}>{em.title}</div>
      <div style={{fontSize:11,color:T.txt3,lineHeight:1.4,marginBottom:12}}>{em.subtitle}</div>
      <div style={{height:1,background:`linear-gradient(90deg,${em.border},transparent)`,marginBottom:10}}/>
      <div style={{fontSize:10,color:T.txt3,lineHeight:1.4}}>{em.mortality}</div>
      <div style={{position:"absolute",bottom:14,right:14,width:26,height:26,borderRadius:"50%",background:em.glass.replace("0.07","0.18"),border:`1px solid ${em.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:em.color,opacity:hov?1:0,transform:hov?"scale(1) translateX(0)":"scale(0.6) translateX(-6px)",transition:"all 0.22s ease"}}>→</div>
    </div>
  );
}

export default function OBGYNHub() {
  const navigate = useNavigate();
  const[selected,setSelected]=useState(null);
  const[search,setSearch]=useState("");
  const[category,setCategory]=useState("All");
  const[contentMap,setContentMap]=useState({});

  useEffect(()=>{
    base44.entities.ProtocolContent.filter({ hub_id: "ob" })
      .then(records => {
        const map = {};
        records.forEach(r => { if (r.condition_id) map[r.condition_id] = r; });
        setContentMap(map);
      })
      .catch(()=>{});
  },[]);

  const filtered=EMERGENCIES
    .filter(e=>category==="All"||e.category===category)
    .filter(e=>!search||e.title.toLowerCase().includes(search.toLowerCase())||e.subtitle.toLowerCase().includes(search.toLowerCase())||e.category.toLowerCase().includes(search.toLowerCase()));

  if(selected) return(
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:"'DM Sans',sans-serif",position:"relative"}}>
      <GlassBg/>
      <div style={{position:"relative",zIndex:1,padding:"28px 36px 48px",maxWidth:1100,margin:"0 auto"}}>
        <ConditionPage emergency={selected} onBack={()=>setSelected(null)} contentMap={contentMap}/>
      </div>
    </div>
  );

  return(
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:"'DM Sans',sans-serif",position:"relative"}}>
      <GlassBg/>
      <div style={{position:"relative",zIndex:1,padding:"28px 36px 48px",maxWidth:1200,margin:"0 auto"}}>

        <div style={{marginBottom:12,animation:"ob-in 0.4s ease both"}}>
          <button onClick={()=>navigate("/hub")} style={{background:"rgba(8,22,40,0.8)",border:"1px solid rgba(42,79,122,0.6)",borderRadius:10,padding:"7px 16px",color:"#8aaccc",fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",backdropFilter:"blur(12px)",display:"inline-flex",alignItems:"center",gap:6,transition:"all .2s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(255,107,157,0.5)";e.currentTarget.style.color="#ff6b9d";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(42,79,122,0.6)";e.currentTarget.style.color="#8aaccc";}}
          >← Back to Hub</button>
        </div>
        <GlassBox style={{padding:"26px 30px 22px",marginBottom:18,position:"relative",overflow:"hidden",boxShadow:`0 8px 40px rgba(0,0,0,0.55), 0 0 30px rgba(255,107,157,0.1), inset 0 1px 0 rgba(255,255,255,0.04)`}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:2.5,borderRadius:"16px 16px 0 0",background:`linear-gradient(90deg,#ff6b9d,#ff6b6b,#ff9f43,#f5c842,#9b6dff,#ff6b9d)`}}/>
          <div style={{position:"absolute",inset:0,background:"linear-gradient(108deg,rgba(255,107,157,0.05) 0%,transparent 55%,rgba(155,109,255,0.04) 100%)",pointerEvents:"none"}}/>
          <div style={{display:"flex",alignItems:"flex-start",gap:20,position:"relative"}}>
            <div style={{width:64,height:64,borderRadius:18,background:"linear-gradient(135deg,rgba(255,107,157,0.22),rgba(155,109,255,0.15))",border:"1px solid rgba(255,107,157,0.35)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,flexShrink:0,boxShadow:"0 0 24px rgba(255,107,157,0.25)",animation:"hbo 2s ease-in-out infinite"}}>
              🤰
            </div>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6,flexWrap:"wrap"}}>
                <span style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:700,color:T.txt,letterSpacing:"-0.01em",lineHeight:1}}>OB/GYN Emergency Hub</span>
                <ClinicalBadge text="ACOG GUIDELINES" color={OB}/>
                <ClinicalBadge text={`${EMERGENCIES.length} EMERGENCIES`} color="#9b6dff"/>
              </div>
              <p style={{fontSize:13,color:T.txt2,margin:0,lineHeight:1.65,maxWidth:600}}>
                Evidence-based management of obstetric emergencies for the emergency physician. All protocols based on ACOG Practice Bulletins and Clinical Guidance — updated through 2024.
              </p>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,flexShrink:0}}>
              {[{v:"ACOG",l:"Guideline Source",c:OB},{v:"10",l:"Emergencies",c:"#9b6dff"},{v:"24/7",l:"Critical Tool",c:T.gold},{v:"2024",l:"Updated",c:T.teal}].map((s,i)=>(
                <div key={i} style={{textAlign:"center",background:"rgba(14,37,68,0.7)",borderRadius:10,padding:"8px 12px",border:"1px solid rgba(26,53,85,0.8)"}}>
                  <div style={{fontSize:14,fontWeight:700,color:[OB,"#9b6dff",T.gold,T.teal][i],fontFamily:"'JetBrains Mono',monospace",lineHeight:1}}>{s.v}</div>
                  <div style={{fontSize:9,color:T.txt4,marginTop:3,textTransform:"uppercase",letterSpacing:".06em"}}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </GlassBox>

        <div style={{background:"rgba(255,107,107,0.07)",border:"1px solid rgba(255,107,107,0.22)",borderRadius:12,padding:"10px 16px",marginBottom:16,display:"flex",alignItems:"center",gap:12,backdropFilter:"blur(12px)",animation:"ob-in 0.5s ease both 0.1s"}}>
          <div style={{width:8,height:8,borderRadius:"50%",background:T.coral,animation:"obp 1.5s ease-in-out infinite",flexShrink:0}}/>
          <span style={{fontSize:11,color:"#ff9999",fontFamily:"'JetBrains Mono',monospace",fontWeight:700,flexShrink:0}}>TIME-CRITICAL</span>
          <span style={{fontSize:11,color:T.txt2}}>Obstetric emergencies can be rapidly fatal for mother and fetus — early recognition and immediate multidisciplinary response are essential.</span>
        </div>

        <div style={{marginBottom:18,animation:"ob-in 0.5s ease both 0.12s"}}>
          <TimeBanner targets={[
            {icon:"🩺",label:"Severe HTN — treat within",target:"60 min",color:T.coral},
            {icon:"🩸",label:"PPH — TXA within",target:"3 h of birth",color:OB},
            {icon:"🔀",label:"Cord prolapse — deliver within",target:"30 min",color:T.teal},
            {icon:"💨",label:"AFE — perimortem C/S if no ROSC",target:"5 min",color:"#9b6dff"},
          ]}/>
        </div>

        <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:16,flexWrap:"wrap",animation:"ob-in 0.5s ease both 0.15s"}}>
          <div style={{position:"relative",flex:1,maxWidth:380}}>
            <span style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",fontSize:14,opacity:0.35}}>🔍</span>
            <input type="text" placeholder="Search emergencies…" value={search} onChange={e=>setSearch(e.target.value)}
              style={{width:"100%",background:"rgba(8,22,40,0.8)",border:"1px solid rgba(42,79,122,0.6)",borderRadius:11,padding:"10px 14px 10px 40px",color:T.txt,fontFamily:"'DM Sans',sans-serif",fontSize:13,outline:"none",backdropFilter:"blur(14px)"}}
              onFocus={e=>e.target.style.borderColor="rgba(255,107,157,0.5)"}
              onBlur={e=>e.target.style.borderColor="rgba(42,79,122,0.6)"}/>
          </div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {CATEGORIES.map(cat=>(
              <button key={cat} onClick={()=>setCategory(cat)}
                style={{padding:"8px 15px",borderRadius:24,fontSize:12,fontWeight:600,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",transition:"all .2s",background:category===cat?"rgba(255,107,157,0.15)":"rgba(8,22,40,0.75)",border:`1px solid ${category===cat?"rgba(255,107,157,0.45)":"rgba(42,79,122,0.5)"}`,color:category===cat?OB:T.txt3,backdropFilter:"blur(12px)",boxShadow:category===cat?"0 0 12px rgba(255,107,157,0.15)":"none"}}>
                {cat}
              </button>
            ))}
          </div>
          <span style={{fontSize:11,color:T.txt4,fontFamily:"'JetBrains Mono',monospace",marginLeft:"auto"}}>{filtered.length} condition{filtered.length!==1?"s":""}</span>
        </div>

        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
          <div style={{height:1,width:20,background:"rgba(255,107,157,0.5)",borderRadius:1}}/>
          <span style={{fontSize:10,fontFamily:"'JetBrains Mono',monospace",color:OB,textTransform:"uppercase",letterSpacing:".12em",fontWeight:700}}>Obstetric Emergencies</span>
          <div style={{flex:1,height:1,background:"linear-gradient(90deg,rgba(255,107,157,0.25),transparent)"}}/>
        </div>

        {filtered.length===0?(
          <div style={{textAlign:"center",padding:"60px 0",color:T.txt3}}>
            <div style={{fontSize:36,marginBottom:12}}>🔍</div>
            <div style={{fontSize:14,fontFamily:"'Playfair Display',serif"}}>No emergencies found</div>
            <div style={{fontSize:12,marginTop:6}}>Try a different search or category</div>
          </div>
        ):(
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:13}}>
            {filtered.map((em,i)=><EmergencyCard key={em.id} em={em} onSelect={setSelected} index={i}/>)}
          </div>
        )}

        <div style={{marginTop:28,borderRadius:12,padding:"12px 18px",background:"rgba(5,15,30,0.65)",border:"1px solid rgba(26,53,85,0.6)",backdropFilter:"blur(12px)",display:"flex",alignItems:"center",gap:14,flexWrap:"wrap",animation:"ob-in 0.5s ease both 0.55s"}}>
          <span style={{fontSize:10,color:OB,fontFamily:"'JetBrains Mono',monospace",fontWeight:700,flexShrink:0}}>⚕ EVIDENCE BASE</span>
          {["ACOG Practice Bulletins #183, #222","ACOG Eclampsia & Acute HTN Algorithms 2023","WOMAN Trial (TXA / PPH) 2017","ACOG PB #178 (Shoulder Dystocia)","FIGO PPH Recommendations 2022","AHA Maternal Resuscitation 2020"].map((ref,i)=>(
            <span key={i} style={{fontSize:10,color:T.txt3}}>{i>0&&<span style={{marginRight:10,color:T.txt4}}>·</span>}{ref}</span>
          ))}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes ob-in{from{opacity:0;transform:translateY(18px) scale(0.96)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes hbo{0%,100%{transform:scale(1)}40%{transform:scale(1.1)}70%{transform:scale(1)}}
        @keyframes obp{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(255,107,107,.4)}50%{opacity:.8;box-shadow:0 0 0 6px rgba(255,107,107,0)}}
        *{box-sizing:border-box;}
        input::placeholder{color:#2e4a6a;}
        button{outline:none;}
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#1a3555;border-radius:3px}
        ::-webkit-scrollbar-thumb:hover{background:#2a4f7a}
      `}</style>
    </div>
  );
}