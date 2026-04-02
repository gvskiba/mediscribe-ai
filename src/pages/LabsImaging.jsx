import { useState, useCallback, useRef } from "react";

// ── Font injection (idempotent) ────────────────────────────────
(() => {
  if (document.getElementById("notrya-li-fonts")) return;
  const l = document.createElement("link");
  l.id = "notrya-li-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap";
  document.head.appendChild(l);
})();

// ── Design tokens ──────────────────────────────────────────────
const T = {
  bg:"#04080f", glass:"rgba(255,255,255,0.06)", glassD:"rgba(255,255,255,0.025)",
  border:"rgba(255,255,255,0.08)", borderHi:"rgba(255,255,255,0.16)",
  shine:"inset 0 1px 0 rgba(255,255,255,0.11)",
  txt:"#f0f4ff", txt2:"#a5b8d8", txt3:"#5a7490", txt4:"#2e4060",
  teal:"#2dd4bf", gold:"#fbbf24", coral:"#f87171",
  blue:"#60a5fa", purple:"#a78bfa", green:"#34d399", orange:"#fb923c",
};
const AC = "#a78bfa";

// ── Glass helpers ──────────────────────────────────────────────
const Gx = {
  panel:(a)=>({ background:a?`linear-gradient(135deg,${a}0a,rgba(255,255,255,0.05))`:T.glass, backdropFilter:"blur(32px) saturate(160%)", WebkitBackdropFilter:"blur(32px) saturate(160%)", border:`1px solid ${a?a+"28":T.border}`, borderRadius:18, boxShadow:`0 8px 32px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.12)${a?`,0 0 30px ${a}12`:""}`, position:"relative", overflow:"hidden" }),
  row:(a)=>({ background:a?`${a}08`:T.glassD, border:`1px solid ${a?a+"25":T.border}`, borderRadius:11, boxShadow:T.shine }),
  inp:()=>({ background:"rgba(255,255,255,0.05)", border:`1px solid ${T.border}`, borderRadius:12, boxShadow:T.shine, color:T.txt, fontFamily:"'DM Sans',sans-serif", fontSize:13, outline:"none", transition:"border-color .2s,box-shadow .2s" }),
  btn:(a,f)=>({ background:f?`linear-gradient(135deg,${a}cc,${a}88)`:"rgba(255,255,255,0.06)", border:`1px solid ${f?a+"60":T.borderHi}`, borderRadius:10, boxShadow:f?`0 4px 18px ${a}30,inset 0 1px 0 rgba(255,255,255,0.25)`:T.shine, color:f?"#fff":T.txt2, fontFamily:"'DM Sans',sans-serif", fontWeight:600, cursor:"pointer", transition:"all .2s" }),
};

const uColor = (u) => ({emergent:T.coral,critical:T.coral,critical_low:T.coral,critical_high:T.coral,high:T.orange,moderate:T.gold,elevated:T.orange,low:T.green,normal:T.green})[u?.toLowerCase?.()] || T.txt3;
const readImg = (file) => new Promise((res,rej) => { const r=new FileReader(); r.onload=()=>res({base64:r.result.split(",")[1],mime:file.type}); r.onerror=()=>rej(new Error("Read failed")); r.readAsDataURL(file); });

// ── Lab reference database (enriched with new labs from reference data) ──
const LABS_REF = [
  // BMP / CMP
  {n:"Sodium",       u:"mEq/L",  norm:"136–145",   cL:120,  cH:160,   cat:"BMP"},
  {n:"Potassium",    u:"mEq/L",  norm:"3.5–5.0",   cL:2.5,  cH:6.5,   cat:"BMP"},
  {n:"Chloride",     u:"mEq/L",  norm:"98–106",    cL:null, cH:120,   cat:"BMP"},
  {n:"Bicarbonate",  u:"mEq/L",  norm:"22–28",     cL:10,   cH:40,    cat:"BMP"},
  {n:"BUN",          u:"mg/dL",  norm:"7–25",      cL:null, cH:100,   cat:"BMP"},
  {n:"Creatinine",   u:"mg/dL",  norm:"0.6–1.2",   cL:null, cH:10,    cat:"BMP"},
  {n:"Glucose",      u:"mg/dL",  norm:"70–99",     cL:40,   cH:500,   cat:"BMP"},
  {n:"Calcium",      u:"mg/dL",  norm:"8.5–10.5",  cL:6.5,  cH:13,    cat:"BMP"},
  {n:"Magnesium",    u:"mEq/L",  norm:"1.5–2.5",   cL:1.0,  cH:5.0,   cat:"BMP"},
  {n:"Phosphorus",   u:"mg/dL",  norm:"2.5–4.5",   cL:1.0,  cH:9.0,   cat:"BMP"},
  // LFTs
  {n:"ALT",          u:"U/L",    norm:"7–56",      cL:null, cH:1000,  cat:"LFT"},
  {n:"AST",          u:"U/L",    norm:"10–40",     cL:null, cH:1000,  cat:"LFT"},
  {n:"Alk Phos",     u:"U/L",    norm:"44–147",    cL:null, cH:null,  cat:"LFT"},
  {n:"Total Bili",   u:"mg/dL",  norm:"0.1–1.2",   cL:null, cH:15,    cat:"LFT"},
  {n:"Albumin",      u:"g/dL",   norm:"3.5–5.0",   cL:2.0,  cH:null,  cat:"LFT"},
  // CBC
  {n:"WBC",          u:"k/µL",   norm:"4.5–11.0",  cL:2.0,  cH:30.0,  cat:"CBC"},
  {n:"Hemoglobin",   u:"g/dL",   norm:"12.0–17.5", cL:7.0,  cH:20.0,  cat:"CBC"},
  {n:"Hematocrit",   u:"%",      norm:"36–52",     cL:21,   cH:60,    cat:"CBC"},
  {n:"Platelets",    u:"k/µL",   norm:"150–400",   cL:20,   cH:1000,  cat:"CBC"},
  {n:"MCV",          u:"fL",     norm:"80–100",    cL:null, cH:null,  cat:"CBC"},
  {n:"Neutrophils",  u:"%",      norm:"50–70",     cL:null, cH:null,  cat:"CBC"},
  // Coagulation
  {n:"PT",           u:"sec",    norm:"11–13.5",   cL:null, cH:35,    cat:"Coags"},
  {n:"INR",          u:"",       norm:"0.8–1.1",   cL:null, cH:5.0,   cat:"Coags"},
  {n:"PTT",          u:"sec",    norm:"25–35",     cL:null, cH:100,   cat:"Coags"},
  {n:"Fibrinogen",   u:"mg/dL",  norm:"200–400",   cL:100,  cH:null,  cat:"Coags"},
  {n:"D-Dimer",      u:"µg/mL",  norm:"<0.5",      cL:null, cH:null,  cat:"Coags"},
  // Cardiac
  {n:"Troponin I",   u:"ng/mL",  norm:"<0.04",     cL:null, cH:null,  cat:"Cardiac"},
  {n:"Troponin T",   u:"ng/mL",  norm:"<0.01",     cL:null, cH:null,  cat:"Cardiac"},
  {n:"BNP",          u:"pg/mL",  norm:"<100",      cL:null, cH:null,  cat:"Cardiac"},
  {n:"proBNP",       u:"pg/mL",  norm:"<300",      cL:null, cH:null,  cat:"Cardiac"},
  {n:"CK-MB",        u:"ng/mL",  norm:"<5",        cL:null, cH:null,  cat:"Cardiac"},
  {n:"Myoglobin",    u:"ng/mL",  norm:"<90",       cL:null, cH:null,  cat:"Cardiac"},
  // Other
  {n:"Lactate",      u:"mmol/L", norm:"0.5–2.0",   cL:null, cH:4.0,   cat:"Other"},
  {n:"Lipase",       u:"U/L",    norm:"13–60",     cL:null, cH:null,  cat:"Other"},
  {n:"Procalcitonin",u:"ng/mL",  norm:"<0.1",      cL:null, cH:null,  cat:"Other"},
  {n:"CRP",          u:"mg/L",   norm:"<10",       cL:null, cH:null,  cat:"Other"},
  {n:"ESR",          u:"mm/hr",  norm:"<20",       cL:null, cH:null,  cat:"Other"},
  {n:"TSH",          u:"mIU/L",  norm:"0.4–4.0",   cL:null, cH:null,  cat:"Other"},
  {n:"HbA1c",        u:"%",      norm:"<5.7",      cL:null, cH:null,  cat:"Other"},
  // Renal
  {n:"Urine Na",     u:"mEq/L",  norm:"20–100",    cL:null, cH:null,  cat:"Renal"},
  {n:"Urine Protein",u:"mg/dL",  norm:"<14",       cL:null, cH:null,  cat:"Renal"},
  {n:"Urine Osm",    u:"mOsm/kg",norm:"50–1200",   cL:null, cH:null,  cat:"Renal"},
  // ABG
  {n:"pH",           u:"",       norm:"7.35–7.45", cL:7.20, cH:7.60,  cat:"ABG"},
  {n:"pO2",          u:"mmHg",   norm:"75–100",    cL:50,   cH:null,  cat:"ABG"},
  {n:"pCO2",         u:"mmHg",   norm:"35–45",     cL:20,   cH:70,    cat:"ABG"},
  {n:"HCO3",         u:"mEq/L",  norm:"22–26",     cL:10,   cH:40,    cat:"ABG"},
  {n:"SpO2",         u:"%",      norm:"95–100",    cL:88,   cH:null,  cat:"ABG"},
];

// ── Lab clinical notes (per-lab interpretation + correction guidance) ──
const LAB_NOTES = {
  "Sodium":       "Hyponatremia: check serum osmolality, urine Na, urine osm. Hypernatremia = free water deficit. Correct Na no faster than 8–10 mEq/L/day to avoid osmotic demyelination syndrome (ODS).",
  "Potassium":    "K <2.5 or >6.5 = cardiac arrhythmia risk — get ECG. IV replacement for K <3.0. Refractory hypokalemia: always check and replace Mg. Pseudohyperkalemia: hemolysis, thrombocytosis.",
  "Chloride":     "Low Cl with metabolic alkalosis: vomiting, NG suction, loop diuretics. Hyperchloremia = non-anion-gap metabolic acidosis (normal saline over-resuscitation).",
  "Bicarbonate":  "Low bicarb = metabolic acidosis: calculate anion gap (Na – Cl – HCO3; normal 8–12). High bicarb = metabolic alkalosis: vomiting, diuretics, contraction alkalosis. Correlate with pH.",
  "BUN":          "BUN:Cr ratio >20:1 = prerenal azotemia or GI bleed. Isolated BUN elevation: high protein intake, GI bleed, catabolic state. Trend creatinine for AKI staging.",
  "Creatinine":   "Acute rise ≥0.3 mg/dL or ≥50% = AKI (KDIGO). Stage I: 1.5–1.9×; Stage II: 2–2.9×; Stage III: ≥3× or ≥4.0 mg/dL. Initiate AKI workup (FeNa, UA, renal US).",
  "Glucose":      "Critical hypoglycemia <40: IV D50W 1 amp or glucagon 1 mg IM. DKA: glucose 250–600, pH <7.3, AG >12, ketones. HHS: glucose often >600, minimal ketosis, profound dehydration.",
  "Calcium":      "Corrected Ca = Ca + 0.8 × (4 – albumin). Symptomatic hypocalcemia: perioral numbness, Chvostek/Trousseau, prolonged QTc → IV calcium gluconate. Hypercalcemia >13: IV fluids + furosemide + bisphosphonates.",
  "Magnesium":    "Often co-depleted with K. Hypomagnesemia: arrhythmias, seizures, refractory hypokalemia. IV Mg 2g over 15 min for symptomatic or Mg <1.2. Check in all ACS, arrhythmias, seizures.",
  "Phosphorus":   "Critical hypophosphatemia <1.0: respiratory muscle failure, hemolysis, rhabdomyolysis, cardiac dysfunction. Seen in refeeding syndrome, DKA treatment, alcoholism. Aggressive IV repletion required.",
  "ALT":          "ALT >3× ULN = significant hepatocellular injury. ALT/AST <1 = alcoholic; >1 = viral/toxic. Extreme >1000: ischemic hepatitis (shock liver), acetaminophen toxicity, acute viral hepatitis.",
  "AST":          "Less liver-specific than ALT — elevated in cardiac/skeletal muscle injury. AST/ALT >2:1 with elevated GGT strongly suggests alcoholic liver disease.",
  "Alk Phos":     "Elevated in cholestatic disease, bone disease, pregnancy. If elevated, check GGT to distinguish liver vs bone. Very high: biliary obstruction, Paget's disease, bone metastases.",
  "Total Bili":   "Elevated total bili: hemolysis (indirect dominant) vs hepatocellular/cholestatic (direct dominant). Total bili >2 = visible jaundice. Fractionated bili + LFTs determine etiology.",
  "Albumin":      "Marker of nutrition and hepatic synthetic function. Low albumin: nephrotic syndrome, liver failure, malnutrition, acute inflammation. Affects corrected calcium interpretation and drug binding.",
  "WBC":          "Leukocytosis >11k: infection, inflammation, stress, steroids. WBC >30k: consider leukemia — get peripheral smear. Leukopenia <4.5k: bone marrow suppression, viral infection, overwhelming sepsis.",
  "Hemoglobin":   "Critical low <7 g/dL typically requires transfusion. Anemia workup: reticulocyte count, iron studies (Fe/TIBC/ferritin), B12/folate, peripheral smear, LDH.",
  "Hematocrit":   "Parallels hemoglobin (Hct ≈ Hgb × 3). Hct <21% = critical transfusion threshold. Polycythemia (>60%): vera, secondary (hypoxia, EPO-producing tumor), or dehydration.",
  "Platelets":    "Thrombocytopenia <50k: bleeding risk with procedures. <20k: spontaneous bleeding — consider transfusion. Work up: HIT (heparin), ITP, TTP (ADAMTS13 deficiency), DIC, splenic sequestration.",
  "MCV":          "Microcytic (<80): iron deficiency (most common), thalassemia, anemia of chronic disease. Normocytic (80–100): acute hemorrhage, hemolysis, CKD. Macrocytic (>100): B12/folate, liver disease, hypothyroidism, medications.",
  "Neutrophils":  "ANC = WBC × neutrophil% / 100. ANC <500 = severe neutropenia → febrile neutropenia protocol (empiric broad-spectrum antibiotics). Bands >10% = left shift / bacterial infection. Hypersegmentation = B12/folate deficiency.",
  "PT":           "Prolonged PT: factor VII deficiency, warfarin effect, liver disease, vitamin K deficiency, DIC. PT >1.5× before procedures = increased bleeding risk. Part of DIC panel.",
  "INR":          "Warfarin reversal: Vit K 2.5–5mg PO (non-urgent) or IV; FFP 15–30 mL/kg; 4F-PCC (preferred for urgent reversal). INR >5: hold warfarin, consider reversal. Not reliable in DOAC therapy.",
  "PTT":          "Prolonged aPTT: heparin therapy, hemophilia A/B (factors VIII/IX), lupus anticoagulant, DIC. aPTT >100 on heparin: hold infusion, check anti-Xa. Mixing study: factor deficiency vs inhibitor.",
  "Fibrinogen":   "Consumed in DIC along with platelets. Low in liver failure, thrombolysis. Critical <100: high hemorrhage risk. Replace with cryoprecipitate (each unit raises Fbg ~25 mg/dL in 70kg adult).",
  "D-Dimer":      "High sensitivity (95%), low specificity. Negative D-dimer rules out PE/DVT at low-intermediate pretest probability (Wells ≤4). Age-adjusted cutoff: age × 0.01 µg/mL for >50 years. Elevated in pregnancy, cancer, sepsis, surgery.",
  "Troponin I":   "hs-Troponin: 0/1h or 0/2h delta algorithms (delta <3–5 ng/L) rule out NSTEMI. Any elevation requires serial testing. Non-ACS causes: PE, myocarditis, sepsis, renal failure, Takotsubo — always correlate clinically.",
  "Troponin T":   "Serial testing required — single value insufficient for NSTEMI rule-out. Peak Tn-T at 12–24h post-MI. Chronically elevated in CKD (check baseline). Same non-ACS causes as Troponin I.",
  "BNP":          "BNP <100 pg/mL makes acute HF unlikely (high NPV). >400 strongly suggests decompensated HF. 100–400: intermediate. BNP falls with diuresis — useful for monitoring treatment response.",
  "proBNP":       "NT-proBNP age-adjusted cutoffs: <300 rules out HF. Diagnostic: <50yo >450, 50–75yo >900, >75yo >1800 pg/mL = acute HF likely. Elevated in renal failure; less affected by BMI than BNP.",
  "CK-MB":        "Peaks at 12–24h post-MI; returns to normal 48–72h (useful for detecting reinfarction when troponin remains elevated). Elevated in rhabdomyolysis. Largely replaced by hs-troponin for primary ACS diagnosis.",
  "Myoglobin":    "Earliest cardiac marker (rises within 1–3h). Non-specific — elevated in any skeletal or cardiac muscle injury. Serial negatives have high NPV for AMI within 4–6h. Markedly elevated in rhabdomyolysis: check CK, renal function, urine myoglobin.",
  "Lactate":      "Lactate >2 mmol/L: hyperlactatemia. >4: lactic acidosis — sepsis (Type A), ischemia, liver failure, medications (metformin, linezolid, cyanide). Serial lactate clearance >10%/2h predicts improved sepsis outcomes. Mandatory in sepsis protocol.",
  "Lipase":       ">3× ULN (≈180 U/L) = acute pancreatitis diagnostic criterion. Severity: APACHE II, Ranson's criteria (day 0 + 2), CT severity index (Balthazar). More specific than amylase for pancreatic injury.",
  "Procalcitonin":"<0.1: bacterial infection unlikely. 0.5–2: possible bacterial. >2: likely bacterial sepsis. >10: severe sepsis/septic shock. Viral infections generally do not elevate PCT. Guides antibiotic stewardship (de-escalation).",
  "CRP":          "Non-specific inflammation marker. Rises at 6–12h, peaks 48h after stimulus. >100 mg/L: significant bacterial infection or severe inflammation. Less specific than PCT for bacterial infection. Useful for tracking treatment response.",
  "ESR":          "Slow, non-specific. Elevated in infection, malignancy, autoimmune disease. Very high >100 mm/hr: consider multiple myeloma, TB, endocarditis, giant cell arteritis. Useful in rheumatologic conditions.",
  "TSH":          "Screening test for thyroid disease. Low TSH: hyperthyroidism or pituitary suppression — check free T4. High TSH: hypothyroidism — check free T4. Normal TSH effectively rules out primary thyroid disease.",
  "HbA1c":        "<5.7% normal; 5.7–6.4% prediabetes; ≥6.5% diabetes. Reflects 3-month average glucose. Falsely low: hemolytic anemia, recent transfusion. Falsely high: iron deficiency, renal failure, hemoglobin variants.",
  "Urine Na":     "FeNa = (urine Na × serum Cr) / (serum Na × urine Cr) × 100. FeNa <1% = prerenal AKI. >2% = intrinsic renal/ATN. Unreliable on diuretics — use FeUrea instead (<35% = prerenal). Low urine Na in SIADH.",
  "Urine Protein":"Spot urine protein:creatinine ratio >0.3 = significant proteinuria. >3.5 = nephrotic range. 24h urine gold standard. Microalbuminuria (30–300 mg/day) = early diabetic nephropathy. Dipstick 1+ ≈ 30 mg/dL.",
  "Urine Osm":    "In hyponatremia: <100 mOsm/kg = primary polydipsia or low solute intake. >100 = impaired water excretion (SIADH, hypothyroidism, adrenal insufficiency). SIADH: urine osm >serum osm with hyponatremia.",
  "pH":           "Acidosis <7.35: respiratory (↑pCO2) or metabolic (↓HCO3). Alkalosis >7.45: resp (↓pCO2) or metabolic (↑HCO3). pH <7.1 = severe acidemia → consider intubation. Always check compensation (Winter's formula for metabolic acidosis).",
  "pO2":          "Mild hypoxemia 60–79; moderate 40–59; severe <40 mmHg. P/F ratio = PaO2/FiO2: ARDS mild <300, moderate <200, severe <100. Evaluate with SpO2 trend and clinical work of breathing.",
  "pCO2":         "Hypercapnia >45: hypoventilation, COPD, sedation. Predict expected pCO2 in metabolic acidosis: Winter's = 1.5×HCO3 + 8 ± 2. Delta pCO2 from expected indicates a superimposed respiratory disorder.",
  "HCO3":         "Matches serum bicarb ± 2 mEq/L. Primary metabolic alkalosis (>26) or acidosis (<22). If acidosis, calculate anion gap: Na – (Cl + HCO3). Delta-delta ratio for mixed AG + non-AG acidosis.",
  "SpO2":         "SpO2 <88% critical (especially in COPD — target 88–92%). Unreliable in CO poisoning, methemoglobinemia, severe peripheral vasoconstriction, dark nail polish. Correlate with ABG when in doubt.",
};

// ── Imaging pattern reference (organized by modality) ─────────────
const IMG_DATA = [
  { id:"cxr",  label:"CXR",           icon:"🫁", color:T.blue,   patterns:[
    {p:"Lobar Consolidation",       u:"high",     ddx:["Bacterial PNA","Pulmonary infarct","Lobar atelectasis"],                                     keys:["Air bronchograms = alveolar filling","Volume preserved (≠ collapse)","Check for associated effusion","Compare with prior CXR"]},
    {p:"Bilateral Infiltrates",     u:"critical", ddx:["ARDS","Cardiogenic pulmonary edema","Bilateral PNA","Diffuse alveolar hemorrhage"],          keys:["Central = cardiogenic; peripheral = ARDS","Kerley B lines = cardiogenic","Air bronchograms = consolidation/ARDS","BNP + Echo to differentiate"]},
    {p:"Cardiogenic Pulmonary Edema",u:"critical",ddx:["CHF exacerbation","Flash pulmonary edema","Hypertensive emergency"],                         keys:["Bat-wing/butterfly perihilar pattern","Kerley B lines (septal thickening)","Increased vascular pedicle >70mm","Cephalization of pulmonary vessels"]},
    {p:"Pneumothorax",              u:"emergent", ddx:["Spontaneous PTX","Tension PTX","Traumatic PTX"],                                             keys:["Visceral pleural line + absent lung markings lateral","Deep sulcus sign (supine CXR)","Tracheal deviation = tension (clinical dx)","Check apices bilaterally on erect CXR"]},
    {p:"Tension Pneumothorax",      u:"emergent", ddx:["Clinical diagnosis — immediate needle decompression"],                                        keys:["Complete ipsilateral lung collapse","Contralateral mediastinal shift","Ipsilateral diaphragm depression","DO NOT wait for CXR if hemodynamically unstable"]},
    {p:"Pleural Effusion",          u:"moderate", ddx:["CHF","Parapneumonic/empyema","Malignancy","PE","Hypoalbuminemia"],                           keys:["Blunting of costophrenic angle (>200mL)","Meniscus sign","Bilateral = transudative (Light's criteria)","Unilateral = exudative until proven otherwise"]},
    {p:"Mediastinal Widening",      u:"emergent", ddx:["Aortic dissection","Mediastinal hematoma","Lymphadenopathy","Aortic aneurysm"],              keys:[">8 cm at aortic knob","Loss of aortic knob contour","Tracheal deviation to the right","CTA emergently if dissection suspected"]},
    {p:"Hyperinflation",            u:"moderate", ddx:["COPD/Emphysema","Asthma (acute)","Air trapping"],                                            keys:["≥6 anterior or ≥10 posterior ribs visible","Flattened diaphragms","Increased AP diameter / barrel chest","Bullae, attenuated vascular markings"]},
    {p:"Interstitial Pattern",      u:"moderate", ddx:["ILD/UIP","Lymphangitic carcinomatosis","Viral PNA","Sarcoidosis"],                           keys:["Reticular/nodular opacities","Kerley B lines = septal thickening","Honeycombing = advanced fibrosis","HRCT required for characterization"]},
  ]},
  { id:"cth",  label:"CT Head",        icon:"🧠", color:T.purple, patterns:[
    {p:"Hyperdense Lesion (Acute)",  u:"emergent", ddx:["Intracerebral hemorrhage","Subarachnoid hemorrhage","Hyperacute ischemic stroke"],         keys:["ICH: heterogeneous, mass effect, edema","SAH: hyperdense blood filling cisterns/sulci","Spot sign on CTA = active bleeding","Age of blood: hyper→iso→hypo over weeks"]},
    {p:"Subarachnoid Hemorrhage",   u:"emergent", ddx:["Ruptured aneurysm (80%)","AVM","Traumatic SAH","Perimesencephalic (non-aneurysmal)"],      keys:["Fisher grade predicts vasospasm risk","CTA emergently if non-traumatic SAH","LP if CT neg with high suspicion (<6h)","Thunderclap headache = SAH until proven otherwise"]},
    {p:"Hypodense Lesion",          u:"high",     ddx:["Ischemic stroke (>6h)","Tumor/metastasis","Abscess","Demyelination"],                      keys:["Vascular territory = ischemic stroke","Ring enhancement = abscess or tumor","DWI-MRI superior to CT for early ischemia (<6h)","ASPECTS score for anterior circulation MCA strokes"]},
    {p:"Midline Shift",             u:"emergent", ddx:["Large hematoma (EDH/SDH/ICH)","Cerebral edema","Malignant MCA infarct"],                   keys:[">5mm shift = neurosurgical emergency","Subfalcine herniation","Uncal herniation: ipsilateral dilated pupil","Non-contrast CT adequate for emergent assessment"]},
    {p:"Hydrocephalus",             u:"high",     ddx:["Obstructive (mass/blood)","Communicating (meningitis, SAH)","Normal pressure hydrocephalus"],keys:["Temporal horn dilation = early sign","Periventricular lucency = transependymal CSF seepage","Evans index >0.3 = ventriculomegaly","Urgently consult neurosurgery for obstructive hydrocephalus"]},
    {p:"EDH / SDH",                 u:"emergent", ddx:["Epidural hematoma (lens-shaped)","Subdural hematoma (crescent)","Contusion"],              keys:["EDH: biconvex/lens, does not cross sutures","SDH: crescent-shaped, crosses sutures","EDH: lucid interval then rapid deterioration","Neurosurgery consult for all expanding/symptomatic hematomas"]},
  ]},
  { id:"ctc",  label:"CT Chest",       icon:"🫁", color:T.teal,   patterns:[
    {p:"Pulmonary Embolism",        u:"emergent", ddx:["Central/saddle PE","Segmental PE","Subsegmental PE"],                                       keys:["Filling defect in pulmonary artery (hypodense)","Hampton hump = peripheral wedge infarct","RV:LV ratio >1 = right heart strain","Westermark sign (CXR): hyperlucency distal to occlusion"]},
    {p:"Ground Glass Opacities",    u:"high",     ddx:["COVID-19/viral PNA","Atypical PNA","Early pulmonary edema","Hypersensitivity pneumonitis","PCP"],keys:["Bilateral peripheral posterior GGOs = COVID-19 pattern","Crazy paving (GGO + interlobular thickening)","Consolidation + GGO = organizing pneumonia","Traction bronchiectasis = fibrotic/irreversible changes"]},
    {p:"Consolidation",             u:"high",     ddx:["Bacterial PNA","Aspiration","PE infarction","Lymphoma/organizing PNA"],                    keys:["Lobar = typical bacterial PNA","Dependent distribution = aspiration (RLL in supine)","Air bronchograms","Cavitation = necrotizing PNA, TB, abscess"]},
    {p:"Aortic Dissection",         u:"emergent", ddx:["Type A (ascending) — emergent surgery","Type B (descending) — medical ± endovascular"],   keys:["Intimal flap creating true/false lumen","True lumen: smaller, calcification on outer wall","Type A: any ascending aorta involvement → emergent OR","Type B: IV beta-blocker (target SBP 100–120, HR <60)"]},
    {p:"Pulmonary Nodule",          u:"moderate", ddx:["Benign granuloma","Primary lung cancer","Metastasis","Carcinoid"],                         keys:["Fleischner Society guidelines for follow-up","<6mm low-risk: no routine follow-up","Spiculated margins, upper lobe, >3cm = high malignancy risk","PET scan for solid nodules >8mm"]},
    {p:"Pneumomediastinum",         u:"high",     ddx:["Boerhaave syndrome","Tracheobronchial tear","Alveolar rupture (high-pressure ventilation)"],keys:["Air outlining mediastinal structures and fascial planes","Subcutaneous emphysema","Hamman's sign (crunching on auscultation)","Boerhaave (esophageal rupture) = surgical emergency"]},
  ]},
  { id:"cta",  label:"CT Abdomen",     icon:"🫄", color:T.orange, patterns:[
    {p:"Free Air (Pneumoperitoneum)",u:"emergent", ddx:["Perforated peptic ulcer","Perforated diverticulitis","Boerhaave syndrome","Post-surgical"],keys:["Subdiaphragmatic free air on upright CXR","Best seen under right hemidiaphragm on CT","Perforation = surgical emergency unless post-op","Post-op free air resolves in 3–7 days"]},
    {p:"Small Bowel Obstruction",   u:"high",     ddx:["Adhesions (most common)","Incarcerated hernia","Volvulus","Intussusception"],              keys:["Dilated SB >2.5 cm with decompressed colon","Identify transition point on CT","Closed loop = C/U shape = volvulus","Pneumatosis intestinalis = bowel ischemia (surgical emergency)"]},
    {p:"Appendicitis",              u:"high",     ddx:["Acute appendicitis","Mesenteric lymphadenitis","Meckel diverticulitis","Ovarian pathology"],keys:["Dilated appendix >6mm with wall enhancement","Periappendiceal fat stranding","Appendicolith = increased perforation risk","Perforation: phlegmon/abscess, extraluminal air/stool"]},
    {p:"Diverticulitis",            u:"high",     ddx:["Uncomplicated diverticulitis","Complicated (abscess/perforation)","Perforated colon CA"],  keys:["Sigmoid colon most common (95%)","Pericolic fat stranding","Hinchey classification I–IV","Free perforation (Hinchey IV) = emergent surgery"]},
    {p:"AAA / Rupture",             u:"emergent", ddx:["Stable AAA","Ruptured AAA","Contained rupture","Aortoenteric fistula"],                   keys:[">5.5cm = surgical repair threshold","Retroperitoneal hematoma = rupture","Periaortic stranding = impending rupture","Do NOT delay OR for hemodynamically unstable patients"]},
    {p:"Acute Cholecystitis",       u:"high",     ddx:["Acute cholecystitis","Choledocholithiasis","Cholangitis","Biliary obstruction"],           keys:["GB wall thickening >3mm + pericholecystic fluid","Sonographic Murphy sign (US > CT)","CBD >6mm (>8mm post-cholecystectomy) = obstruction","Cholangitis (Charcot's triad): fever + jaundice + RUQ pain → urgent ERCP"]},
  ]},
  { id:"echo", label:"Echocardiography",icon:"🫀", color:T.coral,  patterns:[
    {p:"Reduced EF (<40%)",         u:"high",     ddx:["HFrEF/Cardiomyopathy","Post-MI dysfunction","Septic cardiomyopathy","Takotsubo"],          keys:["EF <40% = systolic dysfunction (HFrEF)","Wall motion abnormalities = ischemic pattern","Apical ballooning + basal hyperkinesis = Takotsubo","Global hypokinesis = non-ischemic cardiomyopathy"]},
    {p:"Pericardial Effusion",      u:"high",     ddx:["Viral pericarditis","Malignancy","Uremia","Post-MI (Dressler)","Aortic dissection"],       keys:["Small <1cm, Moderate 1–2cm, Large >2cm","Diastolic RV collapse = tamponade physiology","Swinging heart = large effusion","Pulsus paradoxus >10 mmHg = clinical tamponade sign"]},
    {p:"RV Dysfunction / Dilation", u:"emergent", ddx:["Massive/submassive PE","Cor pulmonale","ARDS","RV infarct"],                              keys:["RV:LV ratio >1 in AP4C view","McConnell sign: apical sparing + free wall akinesis = PE-specific","D-sign: septal flattening/bowing toward LV","TAPSE <16mm = significant RV dysfunction"]},
    {p:"Cardiac Tamponade",         u:"emergent", ddx:["Pericardial effusion + tamponade","Hemorrhagic pericarditis","Aortic dissection into pericardium"],keys:["Diastolic RV/RA collapse (early sign)","IVC plethora: >2.1cm, <50% sniff collapse","Mitral inflow variation >25% / tricuspid >40%","Emergent pericardiocentesis / pericardial window"]},
    {p:"Valvular Abnormality",      u:"high",     ddx:["Severe AS","Acute MR","Acute AR","Infective endocarditis"],                               keys:["AS: peak gradient >40 / mean >20 / AVA <1 cm² = severe","Vegetations: irregular, oscillating, attached to leaflet","TEE sensitivity 95% vs TTE 60% for endocarditis","Eccentric jet = structural MR; central = functional/ischemic MR"]},
  ]},
  { id:"pocus",label:"POCUS / US",    icon:"🔊", color:T.green,  patterns:[
    {p:"FAST Exam — Positive",      u:"emergent", ddx:["Hemoperitoneum","Hemopericardium","Hemothorax","Intraabdominal injury"],                   keys:["Morison's pouch (hepatorenal space)","Splenorenal / perisplenic space","Pericardial window (subxiphoid view)","Suprapubic view: pelvic free fluid"]},
    {p:"Lung US — Pulmonary Edema", u:"high",     ddx:["Cardiogenic pulmonary edema","ARDS","Interstitial PNA"],                                   keys:[">3 B-lines per zone bilateral = wet lungs","Bilateral B-lines = cardiogenic or ARDS","A-lines = normal aeration","Compare cardiac function on echo to differentiate"]},
    {p:"Lung US — Pneumothorax",    u:"emergent", ddx:["Spontaneous PTX","Tension PTX","Post-procedural PTX"],                                     keys:["Absent lung sliding (M-mode: barcode/stratosphere sign)","Loss of B-lines at that zone","Lung point = pathognomonic for PTX","Bilateral absent sliding: severe COPD, right main-stem intubation"]},
    {p:"DVT (Compression US)",      u:"high",     ddx:["Acute DVT","Chronic DVT","Baker's cyst","Lymphadenopathy"],                               keys:["Non-compressibility = gold standard","Echogenic thrombus (acute = hypoechoic)","Loss of augmentation on color Doppler","Proximal DVT (femoral/popliteal) most clinically significant"]},
    {p:"Abdominal Aorta US",        u:"emergent", ddx:["AAA >3cm","Ruptured AAA","Iliac aneurysm","Normal aorta"],                               keys:["Normal aorta <3cm outer-to-outer",">5.5cm = surgical repair threshold","Retroperitoneal hematoma = rupture (poor US sensitivity)","Visualize entire aorta to iliac bifurcation"]},
    {p:"Gallbladder / Biliary US",  u:"high",     ddx:["Acute cholecystitis","Cholelithiasis","Biliary sludge","Acalculous cholecystitis"],        keys:["Sonographic Murphy sign (most specific)","Gallbladder wall >3mm","Pericholecystic fluid","CBD >6mm or >8mm post-cholecystectomy = biliary obstruction"]},
  ]},
];

// ── EKG pattern reference ──────────────────────────────────────
const EKG_PATTERNS = [
  {n:"Anterior STEMI",     u:"emergent", icon:"🚨", c:"STE ≥1mm V1–V4; or new LBBB with Sgarbossa criteria",            t:"LAD",           a:"Immediate cath lab activation — target D2B <90 min"},
  {n:"Inferior STEMI",     u:"emergent", icon:"🚨", c:"STE ≥1mm II, III, aVF; check right-sided leads (V3R/V4R)",       t:"RCA (80%) / LCx",a:"Cath lab; if RV infarct: avoid nitrates, volume-dependent"},
  {n:"Lateral STEMI",      u:"emergent", icon:"🚨", c:"STE ≥1mm I, aVL, V5–V6",                                         t:"LCx",           a:"Cath lab activation"},
  {n:"Posterior STEMI",    u:"emergent", icon:"🚨", c:"ST depression V1–V3, tall R V1–V2, upright T; confirm V7–V9",    t:"RCA / LCx",     a:"Posterior leads V7–V9; STE ≥0.5mm = STEMI equivalent → cath"},
  {n:"Wellens Syndrome",   u:"high",     icon:"⚠️", c:"Biphasic T (Type A) or deep symmetric inv (Type B) V2–V3, ± minimal STE",t:"Proximal LAD", a:"DO NOT stress test — high-risk proximal LAD lesion; urgent cath referral"},
  {n:"De Winter T Waves",  u:"emergent", icon:"🚨", c:"Upsloping ST dep ≥1mm at J-point V1–V6 with tall peaked T waves, no STE",t:"Proximal LAD",a:"STEMI equivalent — activate cath lab immediately"},
  {n:"New LBBB",           u:"emergent", icon:"🚨", c:"QRS >120ms, broad notched R in I/aVL/V5–V6, QS in V1; apply Sgarbossa criteria",t:"Septal/Anterior",a:"If Sgarbossa+ or high clinical suspicion → cath; concordant STE ≥1mm diagnostic"},
  {n:"Complete AV Block",  u:"emergent", icon:"🚨", c:"P-waves march independently, slow ventricular escape (<50 bpm), wide QRS if infranodal",t:"AV node/His-Purkinje",a:"Transcutaneous pacing → transvenous pacing; atropine only for nodal blocks"},
  {n:"Ventricular Tach",   u:"emergent", icon:"🚨", c:"Wide complex tachycardia >100 bpm, AV dissociation, fusion/capture beats, concordant precordial leads",t:"Ventricular myocardium",a:"Stable: amiodarone 150mg IV; Unstable: synchronized cardioversion 100–200J"},
  {n:"Atrial Fibrillation",u:"moderate", icon:"〰️", c:"Irregularly irregular rhythm, absent P waves, variable ventricular rate",t:"Atria",         a:"Rate control (BB/CCB) or rhythm control; CHADS-VASc score; cardioversion if <48h or anticoagulated"},
  {n:"WPW / Delta Waves",  u:"high",     icon:"⚠️", c:"Short PR <120ms, slurred delta wave (QRS upstroke), widened QRS, secondary ST/T",t:"Accessory pathway",a:"If AF: NEVER AV nodal blockers (adenosine, verapamil, digoxin) — use procainamide/ibutilide"},
  {n:"QTc Prolongation",   u:"high",     icon:"⚠️", c:"QTc >500ms (Bazett formula); risk of polymorphic VT (Torsades de Pointes)",t:"Repolarization",a:"Review QT-prolonging meds, correct K/Mg; if TdP: IV Mg 2g, isoproterenol, pacing"},
  {n:"Brugada Pattern",    u:"high",     icon:"⚠️", c:"Type 1: coved STE ≥2mm V1–V2 with T-wave inversion; provoked by fever or NaChannel blockers",t:"RVOT/Na channels",a:"Cardiology consult; ICD placement discussion; avoid class IA/IC/III antiarrhythmics"},
];

// ════════════════════════════════════════════════════════════
//  SHARED COMPONENTS
// ════════════════════════════════════════════════════════════
function AmbientBg() {
  return (
    <div style={{position:"fixed",inset:0,overflow:"hidden",pointerEvents:"none",zIndex:0}}>
      <div style={{position:"absolute",top:"-8%",left:"10%",width:700,height:700,borderRadius:"50%",background:"radial-gradient(circle,rgba(96,165,250,0.14) 0%,transparent 65%)",animation:"orb0 13s ease-in-out infinite"}}/>
      <div style={{position:"absolute",top:"30%",right:"-5%",width:600,height:600,borderRadius:"50%",background:"radial-gradient(circle,rgba(167,139,250,0.12) 0%,transparent 65%)",animation:"orb1 16s ease-in-out infinite"}}/>
      <div style={{position:"absolute",bottom:"-5%",left:"20%",width:520,height:520,borderRadius:"50%",background:"radial-gradient(circle,rgba(45,212,191,0.10) 0%,transparent 65%)",animation:"orb2 12s ease-in-out infinite"}}/>
      <div style={{position:"absolute",top:"55%",left:"45%",width:450,height:450,borderRadius:"50%",background:"radial-gradient(circle,rgba(251,191,36,0.08) 0%,transparent 65%)",animation:"orb0 15s ease-in-out infinite reverse"}}/>
      <style>{`
        @keyframes orb0{0%,100%{transform:scale(1) translate(0,0)}50%{transform:scale(1.14) translate(2%,3%)}}
        @keyframes orb1{0%,100%{transform:scale(1.08) translate(0,0)}50%{transform:scale(0.9) translate(-3%,2%)}}
        @keyframes orb2{0%,100%{transform:scale(0.95) translate(0,0)}50%{transform:scale(1.1) translate(2%,-2%)}}
        @keyframes liIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes pulse{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(248,113,113,.5)}50%{opacity:.7;box-shadow:0 0 0 6px rgba(248,113,113,0)}}
        @keyframes pulseTeal{0%,100%{opacity:1}50%{opacity:.5}}
        *{box-sizing:border-box} input::placeholder,textarea::placeholder{color:rgba(255,255,255,0.2)}
        button{outline:none} select option{background:#0d1829;color:#e0eaff}
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:4px}
        ::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,0.18)}
      `}</style>
    </div>
  );
}

function GPanel({children, style={}, accent=null}) {
  return (
    <div style={{...Gx.panel(accent),...style}}>
      <div style={{position:"absolute",top:0,left:"8%",right:"8%",height:1,background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.16),transparent)",pointerEvents:"none"}}/>
      {children}
    </div>
  );
}

function Chip({label, color}) {
  const c = color||AC;
  return <span style={{fontSize:9,fontFamily:"'JetBrains Mono',monospace",fontWeight:700,padding:"2px 8px",borderRadius:20,background:`${c}18`,border:`1px solid ${c}35`,color:c,whiteSpace:"nowrap",boxShadow:`0 0 8px ${c}18`}}>{label}</span>;
}

function SecHdr({icon, title, sub, badge, accent=T.purple}) {
  return (
    <div style={{marginBottom:18,paddingBottom:14,borderBottom:`1px solid ${T.border}`}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:sub?5:0}}>
        <div style={{width:34,height:34,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,background:`${accent}16`,border:`1px solid ${accent}30`,boxShadow:`0 0 14px ${accent}22`,flexShrink:0}}>{icon}</div>
        <div style={{flex:1,fontSize:16,fontWeight:700,color:T.txt,fontFamily:"'Playfair Display',serif"}}>{title}</div>
        <Chip label={badge||"AI-Powered"} color={accent}/>
      </div>
      {sub&&<p style={{fontSize:11,color:T.txt3,margin:"0 0 0 44px",lineHeight:1.55}}>{sub}</p>}
    </div>
  );
}

// Module-level primitives (must be outside component to prevent focus loss)
function GInput({value, onChange, placeholder, onKeyDown, accent, style:s={}}) {
  return <input value={value} onChange={onChange} onKeyDown={onKeyDown} placeholder={placeholder}
    style={{...Gx.inp(),padding:"10px 14px",width:"100%",...s}}
    onFocus={e=>{e.target.style.borderColor=`${accent||AC}55`;e.target.style.boxShadow=`0 0 0 3px ${accent||AC}12,inset 0 1px 0 rgba(255,255,255,0.12)`;}}
    onBlur={e=>{e.target.style.borderColor=T.border;e.target.style.boxShadow=T.shine;}}/>;
}

function GSelect({value, onChange, options, style:s={}}) {
  return <select value={value} onChange={e=>onChange(e.target.value)}
    style={{...Gx.inp(),padding:"10px 14px",cursor:"pointer",background:"rgba(255,255,255,0.05)",...s}}>
    {options.map(o=>{const v=typeof o==="string"?o:o.v; const l=typeof o==="string"?o:o.l; return <option key={v} value={v}>{l}</option>;})}
  </select>;
}

function GPill({label, active, accent, onClick}) {
  return <button onClick={onClick} style={{padding:"6px 15px",borderRadius:24,fontSize:12,fontWeight:active?600:400,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",transition:"all .2s",background:active?`${accent}18`:"rgba(255,255,255,0.04)",border:`1px solid ${active?accent+"45":"rgba(255,255,255,0.09)"}`,color:active?accent:T.txt3,boxShadow:active?`0 0 16px ${accent}22,${T.shine}`:T.shine}}>{label}</button>;
}

function UrgencyBadge({u}) {
  const c = uColor(u);
  const isEmergent = u==="emergent"||u==="critical"||u==="critical_low"||u==="critical_high";
  return <span style={{fontSize:9,fontFamily:"'JetBrains Mono',monospace",fontWeight:700,padding:"2px 9px",borderRadius:20,background:`${c}18`,border:`1px solid ${c}40`,color:c,whiteSpace:"nowrap",animation:isEmergent?"pulse 1.8s ease-in-out infinite":undefined}}>{(u||"").toUpperCase().replace("_"," ")}</span>;
}

// ════════════════════════════════════════════════════════════
//  MODULE-LEVEL PATIENT CONTEXT STRIP
//  Must live outside LabsInterpreter — used as <CtxStrip/>,
//  so defining it inside the component would cause React to
//  unmount/remount it on every render and lose input focus.
// ════════════════════════════════════════════════════════════
function CtxStrip({ ctx, onChange }) {
  return (
    <GPanel style={{padding:"12px 18px",marginBottom:16}} accent={T.blue}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:14,flexShrink:0}}>👤</span>
        <GInput value={ctx} onChange={onChange} accent={T.blue}
          placeholder="Patient context: age, sex, chief complaint, PMH, medications (used in all AI analyses)…"
          style={{flex:1,padding:"8px 14px",fontSize:12}}/>
      </div>
    </GPanel>
  );
}

// ════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ════════════════════════════════════════════════════════════
export default function LabsInterpreter() {
  const [nav, setNav]           = useState("labs");
  const [toasts, setToasts]     = useState([]);
  const [ctx, setCtx]           = useState("");         // patient context

  // ── Labs state ──
  const [labs, setLabs]         = useState([]);
  const [labName, setLabName]   = useState("");
  const [labVal, setLabVal]     = useState("");
  const [labUnit, setLabUnit]   = useState("");
  const [labCatFilter, setLabCatFilter] = useState("All"); // category filter for dropdown
  const [labResult, setLabResult] = useState(null);
  const [labBusy, setLabBusy]   = useState(false);

  // ── Imaging state ──
  const [imgMode, setImgMode]   = useState("text");     // "text" | "image"
  const [imgText, setImgText]   = useState("");
  const [imgData, setImgData]   = useState(null);
  const [imgPreview, setImgPreview] = useState(null);
  const [imgResult, setImgResult] = useState(null);
  const [imgBusy, setImgBusy]   = useState(false);

  // ── EKG state ──
  const [ekgMode, setEkgMode]   = useState("text");
  const [ekgText, setEkgText]   = useState("");
  const [ekgData, setEkgData]   = useState(null);
  const [ekgPreview, setEkgPreview] = useState(null);
  const [ekgResult, setEkgResult] = useState(null);
  const [ekgBusy, setEkgBusy]   = useState(false);

  // ── Summary state ──
  const [sumResult, setSumResult] = useState(null);
  const [sumBusy, setSumBusy]   = useState(false);

  // ── Critical ref filter ──
  const [critCat, setCritCat]   = useState("All");
  const [critExpanded, setCritExpanded] = useState(null); // which lab row's notes are open
  // ── Imaging pattern reference state ──
  const [imgMod, setImgMod]     = useState("cxr");        // selected modality tab
  const [imgPatExp, setImgPatExp] = useState(null);       // expanded pattern key

  const imgRef = useRef(); const ekgRef = useRef();

  // ── Toast ──────────────────────────────────────────────────
  const toast = useCallback((msg,type="info") => {
    const id = Date.now()+Math.random();
    setToasts(p=>[...p,{id,msg,type}]);
    setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)),3600);
  },[]);

  // ── Lab helpers ────────────────────────────────────────────
  const labStatus = (name,val) => {
    const ref = LABS_REF.find(r=>r.n===name); if(!ref||!val) return "unknown";
    const v = parseFloat(val); if(isNaN(v)) return "unknown";
    if(ref.cL!==null&&v<=ref.cL) return "critical_low";
    if(ref.cH!==null&&v>=ref.cH) return "critical_high";
    return "entered";
  };

  const onLabNameChange = (name) => {
    setLabName(name);
    const ref = LABS_REF.find(r=>r.n===name);
    if(ref) setLabUnit(ref.u);
    else if(!name.trim()) setLabUnit(""); // clear unit when name is erased
  };

  const addLab = () => {
    if(!labName.trim()||!labVal.trim()) return;
    const ref = LABS_REF.find(r=>r.n===labName);
    setLabs(p=>[...p,{id:Date.now(),name:labName,value:labVal,unit:labUnit||ref?.u||"",status:labStatus(labName,labVal)}]);
    setLabVal(""); setLabName(""); setLabUnit("");
  };

  // ── AI: Analyze Labs ───────────────────────────────────────
  const analyzeLabs = async () => {
    if(!labs.length||labBusy) return;
    setLabBusy(true); setLabResult(null);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:3000,
          system:`You are a board-certified emergency medicine physician and critical care specialist. Analyze each laboratory value in detail. Return ONLY a valid JSON array, no markdown, no preamble.
Each object format: {"name":"Sodium","value":"128","unit":"mEq/L","status":"critical_low","clinicalMeaning":"Detailed explanation of what this value means pathophysiologically and in context","correctionStrategy":"Specific, actionable evidence-based correction with doses, rates, monitoring parameters","urgency":"critical/high/moderate/low/normal","keyActions":["Specific action 1","Specific action 2","Monitoring step"]}
Status options: normal, low, high, critical_low, critical_high, elevated`,
          messages:[{role:"user",content:`Patient Context: ${ctx||"Adult patient — no additional context provided"}\n\nLaboratory Values:\n${labs.map(l=>`${l.name}: ${l.value} ${l.unit}`).join("\n")}\n\nProvide comprehensive per-lab clinical analysis.`}]})
      });
      const data = await res.json();
      const raw = (data.content?.[0]?.text||"[]").replace(/```json|```/g,"").trim();
      setLabResult(JSON.parse(raw));
      toast("Lab analysis complete","success");
    } catch(e) { toast("Lab analysis failed — check connection","error"); }
    finally { setLabBusy(false); }
  };

  // ── AI: Analyze Imaging ────────────────────────────────────
  const analyzeImaging = async () => {
    const hasInput = imgMode==="text" ? imgText.trim().length>0 : imgData!==null;
    if(!hasInput||imgBusy) return;
    setImgBusy(true); setImgResult(null);
    try {
      const fmt = `Return ONLY valid JSON: {"modality":"CXR/CT/MRI/Other","keyFindings":[{"finding":"...","significance":"...","urgency":"emergent/high/moderate/low"}],"clinicalCorrelation":"...","differential":["..."],"recommendedWorkup":["..."],"impression":"One clear sentence summarizing the study"}`;
      const userContent = imgData
        ? [{type:"image",source:{type:"base64",media_type:imgData.mime,data:imgData.base64}},{type:"text",text:`Analyze this medical imaging study in detail. Patient context: ${ctx||"Adult patient"}. ${fmt}`}]
        : `Imaging Report/Findings:\n${imgText}\n\nPatient Context: ${ctx||"Adult patient"}\n\nAnalyze these imaging findings. ${fmt}`;
      const res = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:2000,
          system:"You are a board-certified radiologist and emergency medicine physician. Provide detailed, clinically actionable imaging analysis. Return ONLY valid JSON, no markdown.",
          messages:[{role:"user",content:userContent}]})
      });
      const data = await res.json();
      const raw = (data.content?.[0]?.text||"{}").replace(/```json|```/g,"").trim();
      setImgResult(JSON.parse(raw));
      toast("Imaging analysis complete","success");
    } catch(e) { toast("Imaging analysis failed","error"); }
    finally { setImgBusy(false); }
  };

  // ── AI: Analyze EKG ───────────────────────────────────────
  const analyzeEkg = async () => {
    const hasInput = ekgMode==="text" ? ekgText.trim().length>0 : ekgData!==null;
    if(!hasInput||ekgBusy) return;
    setEkgBusy(true); setEkgResult(null);
    try {
      const fmt = `Return ONLY valid JSON: {"rate":"...","rhythm":"...","axis":"...","intervals":{"PR":"...","QRS":"...","QTc":"..."},"stChanges":"...","tWaves":"...","interpretation":"...","clinicalSignificance":"...","immediateAction":"...","differential":["..."],"urgency":"emergent/high/moderate/low"}`;
      const userContent = ekgData
        ? [{type:"image",source:{type:"base64",media_type:ekgData.mime,data:ekgData.base64}},{type:"text",text:`Interpret this ECG/EKG tracing in detail. Patient context: ${ctx||"Adult patient"}. ${fmt}`}]
        : `EKG Findings/Description:\n${ekgText}\n\nPatient Context: ${ctx||"Adult patient"}\n\nInterpret these EKG findings. ${fmt}`;
      const res = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:2000,
          system:"You are a board-certified cardiologist and emergency medicine physician. Provide definitive, actionable EKG interpretation. Return ONLY valid JSON, no markdown.",
          messages:[{role:"user",content:userContent}]})
      });
      const data = await res.json();
      const raw = (data.content?.[0]?.text||"{}").replace(/```json|```/g,"").trim();
      setEkgResult(JSON.parse(raw));
      toast("EKG interpretation complete","success");
    } catch(e) { toast("EKG analysis failed","error"); }
    finally { setEkgBusy(false); }
  };

  // ── AI: Generate Summary ───────────────────────────────────
  const generateSummary = async () => {
    if(sumBusy) return;
    if(!labs.length&&!labResult&&!imgResult&&!ekgResult&&!imgText&&!ekgText) { toast("Enter labs, imaging, or EKG data first","warn"); return; }
    setSumBusy(true); setSumResult(null);
    try {
      const labStr  = labResult  ? JSON.stringify(labResult)  : labs.length ? labs.map(l=>`${l.name}: ${l.value} ${l.unit}`).join(", ") : "None entered";
      const imgStr  = imgResult  ? JSON.stringify(imgResult)  : imgText ? imgText : "None entered";
      const ekgStr  = ekgResult  ? JSON.stringify(ekgResult)  : ekgText ? ekgText : "None entered";
      const res = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:3500,
          system:`You are a senior emergency medicine attending synthesizing a complete clinical picture from available data. Be specific, evidence-based, and action-oriented. Return ONLY valid JSON, no markdown.
Format: {"clinicalSummary":"2–3 sentence narrative summary","prioritizedFindings":[{"finding":"...","urgency":"emergent/high/moderate/low","action":"Specific immediate action"}],"leadingDiagnosis":"Most likely diagnosis","differential":["Dx 2","Dx 3","Dx 4"],"immediateNextSteps":["Specific ordered action 1","Action 2","Action 3"],"disposition":"Admit ICU / Admit floor / Observation / Discharge with follow-up / Transfer","consultations":["Specialty: reason"],"followUpLabs":["Lab: timing and reason"],"safetyNets":["Return precaution 1","Warning 2"]}`,
          messages:[{role:"user",content:`Patient Context: ${ctx||"Adult patient — no additional context provided"}\n\nLaboratory Data:\n${labStr}\n\nImaging Data:\n${imgStr}\n\nEKG Data:\n${ekgStr}\n\nGenerate a comprehensive clinical assessment with prioritized next steps.`}]})
      });
      const data = await res.json();
      const raw = (data.content?.[0]?.text||"{}").replace(/```json|```/g,"").trim();
      setSumResult(JSON.parse(raw));
      toast("Clinical summary generated","success");
    } catch(e) { toast("Summary generation failed","error"); }
    finally { setSumBusy(false); }
  };

  // ── Image upload handlers ──────────────────────────────────
  const handleImgUpload = async (e) => {
    const file = e.target.files?.[0]; if(!file) return;
    if(imgPreview) URL.revokeObjectURL(imgPreview);
    const d = await readImg(file);
    setImgData(d); setImgPreview(URL.createObjectURL(file));
    e.target.value = "";   // reset so same file can be re-selected after removal
    toast("Image loaded — ready to analyze","success");
  };
  const handleEkgUpload = async (e) => {
    const file = e.target.files?.[0]; if(!file) return;
    if(ekgPreview) URL.revokeObjectURL(ekgPreview);
    const d = await readImg(file);
    setEkgData(d); setEkgPreview(URL.createObjectURL(file));
    e.target.value = "";   // reset so same file can be re-selected after removal
    toast("EKG loaded — ready to interpret","success");
  };

  // ════════════════════════════════════════════════════════════
  //  SECTION RENDERERS
  // ════════════════════════════════════════════════════════════

  // ── Labs Section ───────────────────────────────────────────
  const renderLabs = () => (
    <div style={{display:"flex",flexDirection:"column",gap:14,animation:"liIn .35s ease"}}>
      <CtxStrip ctx={ctx} onChange={e=>setCtx(e.target.value)}/>
      <GPanel style={{padding:"22px 24px"}} accent={T.teal}>
        <div style={{position:"absolute",top:0,left:0,right:0,height:2,borderRadius:"18px 18px 0 0",background:`linear-gradient(90deg,transparent,${T.teal}80,transparent)`,backgroundSize:"200% 100%",animation:"shimmer 2.5s linear infinite"}}/>
        <SecHdr icon="🔬" title="Lab Value Entry" badge="ENTER LABS" accent={T.teal}
          sub="Select or type a lab name, enter the value, and add to your panel — critical values are auto-flagged"/>
        <div style={{display:"flex",gap:10,marginBottom:12,flexWrap:"wrap"}}>
          <GSelect value={labName} onChange={onLabNameChange} style={{flex:"1 1 180px"}}
            options={[{v:"",l:"— Select lab —"},...LABS_REF.filter(r=>labCatFilter==="All"||r.cat===labCatFilter).map(r=>({v:r.n,l:`${r.n} (${r.cat})`}))]}/>
          <GInput value={labName} onChange={e=>onLabNameChange(e.target.value)} accent={T.teal}
            style={{flex:"1 1 140px"}} placeholder="Or type custom lab name"/>
          <GInput value={labVal} onChange={e=>setLabVal(e.target.value)} accent={T.teal}
            onKeyDown={e=>e.key==="Enter"&&addLab()} placeholder="Value"
            style={{flex:"0 0 90px"}}/>
          <GInput value={labUnit} onChange={e=>setLabUnit(e.target.value)} accent={T.teal}
            placeholder="Unit" style={{flex:"0 0 80px"}}/>
          <button onClick={addLab} disabled={!labName.trim()||!labVal.trim()}
            style={{...Gx.btn(T.teal,true),padding:"10px 18px",fontSize:12,flexShrink:0,opacity:(!labName.trim()||!labVal.trim())?0.4:1}}>
            + Add Lab
          </button>
        </div>

        {/* Category filter buttons — click to narrow dropdown, click again to clear */}
        <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:labs.length?14:8}}>
          <button onClick={()=>setLabCatFilter("All")}
            style={{...Gx.btn(T.teal,labCatFilter==="All"),padding:"5px 13px",fontSize:11,color:labCatFilter==="All"?"#fff":T.teal,border:`1px solid ${T.teal}30`}}>
            All
          </button>
          {["BMP","CBC","Coags","LFT","Cardiac","Other","Renal","ABG"].map(cat=>(
            <button key={cat} onClick={()=>setLabCatFilter(p=>p===cat?"All":cat)}
              style={{...Gx.btn(T.teal,labCatFilter===cat),padding:"5px 13px",fontSize:11,color:labCatFilter===cat?"#fff":T.teal,border:`1px solid ${T.teal}30`}}>
              {cat}
            </button>
          ))}
        </div>

        {/* Lab list */}
        {labs.length>0 && (
          <div style={{marginBottom:14}}>
            {labs.map(lab=>{
              const isCrit = lab.status==="critical_low"||lab.status==="critical_high";
              const c = isCrit?T.coral:T.txt2;
              return (
                <div key={lab.id} style={{...Gx.row(isCrit?T.coral:null),display:"flex",alignItems:"center",gap:10,padding:"9px 13px",marginBottom:5}}>
                  <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:700,color:c,minWidth:130,flexShrink:0,textShadow:isCrit?`0 0 10px ${T.coral}50`:"none"}}>{lab.name}</span>
                  <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:14,fontWeight:700,color:c,minWidth:60}}>{lab.value}</span>
                  <span style={{fontSize:11,color:T.txt3,minWidth:50}}>{lab.unit}</span>
                  {isCrit&&<UrgencyBadge u={lab.status}/>}
                  {(() => { const ref=LABS_REF.find(r=>r.n===lab.name); return ref?<span style={{fontSize:10,color:T.txt4,fontFamily:"'JetBrains Mono',monospace"}}>ref: {ref.norm}</span>:null; })()}
                  <div style={{flex:1}}/>
                  <button onClick={()=>setLabs(p=>p.filter(l=>l.id!==lab.id))}
                    style={{...Gx.btn(T.coral,false),padding:"3px 10px",fontSize:11,color:T.coral,border:`1px solid ${T.coral}30`}}>✕</button>
                </div>
              );
            })}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:10}}>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.txt4}}>{labs.length} lab{labs.length!==1?"s":""} entered</span>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>{setLabs([]);setLabResult(null);}} style={{...Gx.btn(T.coral,false),padding:"7px 14px",fontSize:11,color:T.coral}}>Clear All</button>
                <button onClick={analyzeLabs} disabled={labBusy||!labs.length}
                  style={{...Gx.btn(T.teal,true),padding:"9px 22px",fontSize:13,opacity:labBusy?0.6:1}}>
                  {labBusy?"⏳ Analyzing…":"🔬 Analyze Labs"}
                </button>
              </div>
            </div>
          </div>
        )}
        {!labs.length && <div style={{textAlign:"center",padding:"20px 0",color:T.txt4,fontSize:12,fontFamily:"'DM Sans',sans-serif"}}>No labs entered yet — add values above</div>}
      </GPanel>

      {/* AI Lab Results */}
      {labResult && Array.isArray(labResult) && (
        <GPanel style={{padding:"22px 24px",animation:"liIn .4s ease"}} accent={T.teal}>
          <SecHdr icon="🧠" title="AI Lab Analysis" badge="CLINICAL INTERPRETATION" accent={T.teal}
            sub="Detailed per-lab clinical significance and evidence-based correction strategies"/>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {labResult.map((item,i)=>{
              const uc = uColor(item.urgency);
              return (
                <div key={i} style={{...Gx.row(uc),padding:"16px 18px",borderLeft:`3px solid ${uc}60`,animation:`liIn .3s ease ${i*0.07}s both`}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                    <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:16,fontWeight:700,color:uc,textShadow:`0 0 12px ${uc}50`,minWidth:130}}>{item.name}</span>
                    <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:18,fontWeight:700,color:uc}}>{item.value}<span style={{fontSize:11,color:T.txt3,marginLeft:4}}>{item.unit}</span></span>
                    <UrgencyBadge u={item.urgency}/>
                    <div style={{flex:1}}/>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                    <div>
                      <div style={{fontSize:10,fontFamily:"'JetBrains Mono',monospace",color:T.txt3,letterSpacing:".08em",textTransform:"uppercase",marginBottom:5}}>Clinical Meaning</div>
                      <p style={{fontSize:12,color:T.txt2,margin:0,lineHeight:1.6}}>{item.clinicalMeaning}</p>
                    </div>
                    <div>
                      <div style={{fontSize:10,fontFamily:"'JetBrains Mono',monospace",color:T.teal,letterSpacing:".08em",textTransform:"uppercase",marginBottom:5}}>Correction Strategy</div>
                      <p style={{fontSize:12,color:T.txt2,margin:0,lineHeight:1.6}}>{item.correctionStrategy}</p>
                    </div>
                  </div>
                  {item.keyActions?.length>0&&(
                    <div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${T.border}`}}>
                      <div style={{fontSize:10,fontFamily:"'JetBrains Mono',monospace",color:T.gold,letterSpacing:".08em",textTransform:"uppercase",marginBottom:6}}>Key Actions</div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                        {item.keyActions.map((a,j)=><span key={j} style={{fontSize:11,color:T.txt2,background:`${T.gold}0a`,border:`1px solid ${T.gold}20`,borderRadius:7,padding:"3px 10px",lineHeight:1.4}}>▸ {a}</span>)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </GPanel>
      )}
    </div>
  );

  // ── Imaging Section ────────────────────────────────────────
  const renderImaging = () => (
    <div style={{display:"flex",flexDirection:"column",gap:14,animation:"liIn .35s ease"}}>
      <CtxStrip ctx={ctx} onChange={e=>setCtx(e.target.value)}/>
      <GPanel style={{padding:"22px 24px"}} accent={T.blue}>
        <div style={{position:"absolute",top:0,left:0,right:0,height:2,borderRadius:"18px 18px 0 0",background:`linear-gradient(90deg,transparent,${T.blue}80,transparent)`,backgroundSize:"200% 100%",animation:"shimmer 3s linear infinite"}}/>
        <SecHdr icon="🫁" title="Imaging Interpreter" badge="CXR · CT · MRI" accent={T.blue}
          sub="Upload an image for AI visual analysis, or paste a radiology report — AI identifies key findings and clinical significance"/>
        <div style={{display:"flex",gap:8,marginBottom:14}}>
          <GPill label="📝 Text Report" active={imgMode==="text"} accent={T.blue} onClick={()=>setImgMode("text")}/>
          <GPill label="📷 Upload Image" active={imgMode==="image"} accent={T.blue} onClick={()=>setImgMode("image")}/>
        </div>
        {imgMode==="text"?(
          <textarea value={imgText} onChange={e=>setImgText(e.target.value)} rows={6}
            placeholder="Paste radiology report, findings, or impression here — e.g. 'Chest X-ray shows bilateral lower lobe opacities with air bronchograms, no effusion, no pneumothorax, cardiomediastinal silhouette normal'…"
            style={{...Gx.inp(),width:"100%",padding:"13px 15px",lineHeight:1.65,resize:"vertical"}}
            onFocus={e=>{e.target.style.borderColor=`${T.blue}55`;e.target.style.boxShadow=`0 0 0 3px ${T.blue}12,inset 0 1px 0 rgba(255,255,255,0.12)`;}}
            onBlur={e=>{e.target.style.borderColor=T.border;e.target.style.boxShadow=T.shine;}}/>
        ):(
          <div>
            <input type="file" ref={imgRef} accept="image/*" onChange={handleImgUpload} style={{display:"none"}}/>
            <div onClick={()=>imgRef.current?.click()} style={{border:`2px dashed ${imgPreview?T.blue+"60":T.border}`,borderRadius:14,padding:"28px 20px",textAlign:"center",cursor:"pointer",transition:"all .2s",background:imgPreview?"rgba(96,165,250,0.05)":"transparent"}}
              onMouseEnter={e=>e.currentTarget.style.borderColor=T.blue+"50"}
              onMouseLeave={e=>e.currentTarget.style.borderColor=imgPreview?T.blue+"60":T.border}>
              {imgPreview?<img src={imgPreview} alt="Preview" style={{maxHeight:220,maxWidth:"100%",borderRadius:10,objectFit:"contain"}}/>
                :<><div style={{fontSize:32,marginBottom:8,opacity:.4}}>🫁</div><p style={{color:T.txt3,fontSize:13,margin:0}}>Click to upload CXR, CT, or MRI image</p><p style={{color:T.txt4,fontSize:11,marginTop:4}}>JPEG, PNG, WebP supported · AI will visually analyze the study</p></>}
            </div>
            {imgPreview&&<button onClick={()=>{URL.revokeObjectURL(imgPreview);setImgData(null);setImgPreview(null);}} style={{...Gx.btn(T.coral,false),padding:"5px 14px",fontSize:11,marginTop:8,color:T.coral}}>Remove Image</button>}
          </div>
        )}
        <div style={{display:"flex",justifyContent:"flex-end",marginTop:12}}>
          {(() => {
            const hasInput = imgMode==="text" ? imgText.trim().length>0 : imgData!==null;
            return (
              <button onClick={analyzeImaging} disabled={imgBusy||!hasInput}
                style={{...Gx.btn(T.blue,true),padding:"9px 24px",fontSize:13,opacity:imgBusy||!hasInput?0.5:1}}>
                {imgBusy?"⏳ Analyzing…":"🫁 Analyze Imaging"}
              </button>
            );
          })()}
        </div>
      </GPanel>

      {/* Imaging AI Results */}
      {imgResult&&(
        <GPanel style={{padding:"22px 24px",animation:"liIn .4s ease"}} accent={T.blue}>
          <SecHdr icon="🧠" title="Imaging Analysis" badge="AI INTERPRETATION" accent={T.blue}/>
          {imgResult.impression&&(
            <div style={{...Gx.row(T.blue),padding:"12px 16px",marginBottom:14,borderLeft:`3px solid ${T.blue}60`}}>
              <div style={{fontSize:10,fontFamily:"'JetBrains Mono',monospace",color:T.blue,letterSpacing:".08em",textTransform:"uppercase",marginBottom:4}}>Impression</div>
              <p style={{fontSize:13,color:T.txt,margin:0,fontFamily:"'Playfair Display',serif",fontStyle:"italic",lineHeight:1.6}}>{imgResult.impression}</p>
            </div>
          )}
          {imgResult.keyFindings?.length>0&&(
            <div style={{marginBottom:14}}>
              <div style={{fontSize:10,fontFamily:"'JetBrains Mono',monospace",color:T.txt3,letterSpacing:".08em",textTransform:"uppercase",marginBottom:8}}>Key Findings</div>
              {imgResult.keyFindings.map((f,i)=>{
                const uc=uColor(f.urgency);
                return <div key={i} style={{...Gx.row(uc),padding:"11px 14px",marginBottom:6,borderLeft:`2px solid ${uc}50`}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                    <span style={{fontSize:13,fontWeight:600,color:T.txt}}>{f.finding}</span>
                    <UrgencyBadge u={f.urgency}/>
                  </div>
                  <p style={{fontSize:12,color:T.txt2,margin:0,lineHeight:1.5}}>{f.significance}</p>
                </div>;
              })}
            </div>
          )}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            {imgResult.differential?.length>0&&(
              <div style={{...Gx.row(null),padding:"14px 16px"}}>
                <div style={{fontSize:10,fontFamily:"'JetBrains Mono',monospace",color:T.gold,letterSpacing:".08em",textTransform:"uppercase",marginBottom:8}}>Differential Diagnosis</div>
                {imgResult.differential.map((d,i)=><div key={i} style={{fontSize:12,color:T.txt2,marginBottom:4}}>▸ {d}</div>)}
              </div>
            )}
            {imgResult.recommendedWorkup?.length>0&&(
              <div style={{...Gx.row(null),padding:"14px 16px"}}>
                <div style={{fontSize:10,fontFamily:"'JetBrains Mono',monospace",color:T.teal,letterSpacing:".08em",textTransform:"uppercase",marginBottom:8}}>Recommended Workup</div>
                {imgResult.recommendedWorkup.map((w,i)=><div key={i} style={{fontSize:12,color:T.txt2,marginBottom:4}}>▸ {w}</div>)}
              </div>
            )}
          </div>
        </GPanel>
      )}

      {/* Multi-modality imaging pattern reference */}
      <GPanel style={{padding:"22px 24px"}}>
        <SecHdr icon="📋" title="Imaging Pattern Reference" badge="QUICK REF" accent={T.purple}
          sub="6 modalities · 40+ patterns — select modality, click any pattern to expand DDx and key findings"/>
        {/* Modality tabs */}
        <div style={{display:"flex",gap:6,marginBottom:18,flexWrap:"wrap"}}>
          {IMG_DATA.map(m=>(
            <GPill key={m.id} label={`${m.icon} ${m.label}`} active={imgMod===m.id} accent={m.color}
              onClick={()=>{setImgMod(m.id);setImgPatExp(null);}}/>
          ))}
        </div>
        {/* Patterns for selected modality */}
        {(()=>{
          const mod = IMG_DATA.find(m=>m.id===imgMod);
          if(!mod) return null;
          return (
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              {mod.patterns.map((p,i)=>{
                const uc = uColor(p.u);
                const expKey = `${imgMod}-${i}`;
                const isExp = imgPatExp===expKey;
                return (
                  <div key={i} style={{...Gx.row(uc),transition:"all .18s",cursor:"pointer",border:`1px solid ${isExp?uc+"35":T.border}`}}
                    onClick={()=>setImgPatExp(k=>k===expKey?null:expKey)}>
                    <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 13px"}}>
                      <span style={{fontSize:13,fontWeight:700,color:T.txt,flex:1}}>{p.p}</span>
                      <UrgencyBadge u={p.u}/>
                      <div style={{display:"flex",gap:5,flexWrap:"wrap",maxWidth:280}}>
                        {p.ddx.slice(0,2).map((d,j)=><Chip key={j} label={d} color={uc}/>)}
                        {p.ddx.length>2&&<Chip label={`+${p.ddx.length-2}`} color={T.txt4}/>}
                      </div>
                      <span style={{fontSize:11,color:T.txt4,marginLeft:4,flexShrink:0}}>{isExp?"▲":"▼"}</span>
                    </div>
                    {isExp&&(
                      <div style={{padding:"0 13px 14px",borderTop:`1px solid ${T.border}`,animation:"liIn .2s ease"}}>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,paddingTop:12}}>
                          <div>
                            <div style={{fontSize:9,fontFamily:"'JetBrains Mono',monospace",color:T.txt3,letterSpacing:".08em",textTransform:"uppercase",marginBottom:8}}>Differential Diagnosis</div>
                            {p.ddx.map((d,j)=>(
                              <div key={j} style={{display:"flex",alignItems:"center",gap:8,fontSize:12,color:T.txt2,marginBottom:5}}>
                                <div style={{width:4,height:4,borderRadius:"50%",background:uc,flexShrink:0}}/>
                                {d}
                              </div>
                            ))}
                          </div>
                          <div>
                            <div style={{fontSize:9,fontFamily:"'JetBrains Mono',monospace",color:T.gold,letterSpacing:".08em",textTransform:"uppercase",marginBottom:8}}>Key Findings / Pearls</div>
                            {p.keys.map((k,j)=>(
                              <div key={j} style={{display:"flex",alignItems:"flex-start",gap:8,fontSize:12,color:T.txt2,marginBottom:5,lineHeight:1.45}}>
                                <div style={{width:4,height:4,borderRadius:"50%",background:T.gold,flexShrink:0,marginTop:5}}/>
                                {k}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}
      </GPanel>
    </div>
  );

  // ── EKG Section ────────────────────────────────────────────
  const renderEkg = () => (
    <div style={{display:"flex",flexDirection:"column",gap:14,animation:"liIn .35s ease"}}>
      <CtxStrip ctx={ctx} onChange={e=>setCtx(e.target.value)}/>
      <GPanel style={{padding:"22px 24px"}} accent={T.coral}>
        <div style={{position:"absolute",top:0,left:0,right:0,height:2,borderRadius:"18px 18px 0 0",background:`linear-gradient(90deg,transparent,${T.coral}80,transparent)`,backgroundSize:"200% 100%",animation:"shimmer 2.8s linear infinite"}}/>
        <SecHdr icon="❤️" title="EKG / ECG Interpreter" badge="AI ANALYSIS" accent={T.coral}
          sub="Upload a tracing for AI visual interpretation, or describe findings in text — AI identifies rhythm, ischemic changes, and critical patterns"/>
        <div style={{display:"flex",gap:8,marginBottom:14}}>
          <GPill label="📝 Describe Findings" active={ekgMode==="text"} accent={T.coral} onClick={()=>setEkgMode("text")}/>
          <GPill label="📷 Upload Tracing" active={ekgMode==="image"} accent={T.coral} onClick={()=>setEkgMode("image")}/>
        </div>
        {ekgMode==="text"?(
          <textarea value={ekgText} onChange={e=>setEkgText(e.target.value)} rows={5}
            placeholder="Describe EKG findings — e.g. 'Sinus tachycardia at 110, ST elevation 2mm V1–V4 with reciprocal changes in II/III/aVF, new LBBB morphology, QTc 480ms, no prior for comparison'…"
            style={{...Gx.inp(),width:"100%",padding:"13px 15px",lineHeight:1.65,resize:"vertical"}}
            onFocus={e=>{e.target.style.borderColor=`${T.coral}55`;e.target.style.boxShadow=`0 0 0 3px ${T.coral}12,inset 0 1px 0 rgba(255,255,255,0.12)`;}}
            onBlur={e=>{e.target.style.borderColor=T.border;e.target.style.boxShadow=T.shine;}}/>
        ):(
          <div>
            <input type="file" ref={ekgRef} accept="image/*" onChange={handleEkgUpload} style={{display:"none"}}/>
            <div onClick={()=>ekgRef.current?.click()} style={{border:`2px dashed ${ekgPreview?T.coral+"60":T.border}`,borderRadius:14,padding:"28px 20px",textAlign:"center",cursor:"pointer",transition:"all .2s",background:ekgPreview?`${T.coral}06`:"transparent"}}
              onMouseEnter={e=>e.currentTarget.style.borderColor=T.coral+"50"}
              onMouseLeave={e=>e.currentTarget.style.borderColor=ekgPreview?T.coral+"60":T.border}>
              {ekgPreview?<img src={ekgPreview} alt="EKG" style={{maxHeight:220,maxWidth:"100%",borderRadius:10,objectFit:"contain"}}/>
                :<><div style={{fontSize:32,marginBottom:8,opacity:.4}}>📈</div><p style={{color:T.txt3,fontSize:13,margin:0}}>Click to upload EKG tracing</p><p style={{color:T.txt4,fontSize:11,marginTop:4}}>JPEG, PNG, WebP — AI will interpret rhythm, intervals, and ischemic changes</p></>}
            </div>
            {ekgPreview&&<button onClick={()=>{URL.revokeObjectURL(ekgPreview);setEkgData(null);setEkgPreview(null);}} style={{...Gx.btn(T.coral,false),padding:"5px 14px",fontSize:11,marginTop:8,color:T.coral}}>Remove</button>}
          </div>
        )}
        <div style={{display:"flex",justifyContent:"flex-end",marginTop:12}}>
          {(() => {
            const hasInput = ekgMode==="text" ? ekgText.trim().length>0 : ekgData!==null;
            return (
              <button onClick={analyzeEkg} disabled={ekgBusy||!hasInput}
                style={{...Gx.btn(T.coral,true),padding:"9px 24px",fontSize:13,opacity:ekgBusy||!hasInput?0.5:1}}>
                {ekgBusy?"⏳ Interpreting…":"❤️ Interpret EKG"}
              </button>
            );
          })()}
        </div>
      </GPanel>

      {/* EKG AI Results */}
      {ekgResult&&(
        <GPanel style={{padding:"22px 24px",animation:"liIn .4s ease"}} accent={T.coral}>
          <SecHdr icon="🧠" title="EKG Interpretation" badge="AI CARDIOLOGY" accent={T.coral}/>
          {/* Vitals row */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:14}}>
            {[{l:"Rate",v:ekgResult.rate},{l:"Rhythm",v:ekgResult.rhythm},{l:"Axis",v:ekgResult.axis},{l:"Urgency",v:ekgResult.urgency}].map((item,i)=>(
              <div key={i} style={{...Gx.row(null),padding:"11px 13px",textAlign:"center"}}>
                <div style={{fontSize:9,fontFamily:"'JetBrains Mono',monospace",color:T.txt3,letterSpacing:".08em",textTransform:"uppercase",marginBottom:5}}>{item.l}</div>
                <div style={{fontSize:13,fontWeight:700,color:i===3?uColor(item.v):T.txt,fontFamily:i===0?"'JetBrains Mono',monospace":"'DM Sans',sans-serif",lineHeight:1.2}}>{item.v||"—"}</div>
              </div>
            ))}
          </div>
          {/* Intervals */}
          {ekgResult.intervals&&(
            <div style={{display:"flex",gap:10,marginBottom:14}}>
              {Object.entries(ekgResult.intervals).map(([k,v])=>(
                <div key={k} style={{...Gx.row(k==="QTc"&&parseFloat(v)>500?T.coral:null),padding:"9px 14px",flex:1}}>
                  <div style={{fontSize:9,fontFamily:"'JetBrains Mono',monospace",color:T.txt3,letterSpacing:".08em",marginBottom:3}}>{k}</div>
                  <div style={{fontSize:14,fontWeight:700,color:k==="QTc"&&parseFloat(v)>500?T.coral:T.txt,fontFamily:"'JetBrains Mono',monospace"}}>{v||"—"}</div>
                </div>
              ))}
            </div>
          )}
          {/* ST Changes + T Waves (AI fields previously discarded) */}
          {(ekgResult.stChanges||ekgResult.tWaves)&&(
            <div style={{display:"flex",gap:10,marginBottom:14}}>
              {ekgResult.stChanges&&(
                <div style={{...Gx.row(uColor(ekgResult.urgency)),padding:"9px 14px",flex:1}}>
                  <div style={{fontSize:9,fontFamily:"'JetBrains Mono',monospace",color:T.txt3,letterSpacing:".08em",textTransform:"uppercase",marginBottom:4}}>ST Changes</div>
                  <div style={{fontSize:12,color:T.txt2,lineHeight:1.45}}>{ekgResult.stChanges}</div>
                </div>
              )}
              {ekgResult.tWaves&&(
                <div style={{...Gx.row(null),padding:"9px 14px",flex:1}}>
                  <div style={{fontSize:9,fontFamily:"'JetBrains Mono',monospace",color:T.txt3,letterSpacing:".08em",textTransform:"uppercase",marginBottom:4}}>T Waves</div>
                  <div style={{fontSize:12,color:T.txt2,lineHeight:1.45}}>{ekgResult.tWaves}</div>
                </div>
              )}
            </div>
          )}
          {/* Interpretation */}
          <div style={{...Gx.row(uColor(ekgResult.urgency)),padding:"14px 16px",marginBottom:12,borderLeft:`3px solid ${uColor(ekgResult.urgency)}60`}}>
            <div style={{fontSize:10,fontFamily:"'JetBrains Mono',monospace",color:uColor(ekgResult.urgency),letterSpacing:".08em",textTransform:"uppercase",marginBottom:6}}>Interpretation</div>
            <p style={{fontSize:13,color:T.txt,margin:"0 0 8px",fontWeight:600,lineHeight:1.5}}>{ekgResult.interpretation}</p>
            <p style={{fontSize:12,color:T.txt2,margin:0,lineHeight:1.6}}>{ekgResult.clinicalSignificance}</p>
          </div>
          {ekgResult.immediateAction&&(
            <div style={{...Gx.row(T.coral),padding:"12px 16px",marginBottom:14,borderLeft:`3px solid ${T.coral}70`,background:`${T.coral}0a`}}>
              <div style={{fontSize:10,fontFamily:"'JetBrains Mono',monospace",color:T.coral,letterSpacing:".08em",textTransform:"uppercase",marginBottom:4}}>Immediate Action</div>
              <p style={{fontSize:13,color:T.txt,margin:0,fontWeight:600,lineHeight:1.5}}>{ekgResult.immediateAction}</p>
            </div>
          )}
          {ekgResult.differential?.length>0&&(
            <div style={{...Gx.row(null),padding:"12px 16px"}}>
              <div style={{fontSize:10,fontFamily:"'JetBrains Mono',monospace",color:T.gold,letterSpacing:".08em",textTransform:"uppercase",marginBottom:7}}>Differential</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>{ekgResult.differential.map((d,i)=><Chip key={i} label={d} color={T.gold}/>)}</div>
            </div>
          )}
        </GPanel>
      )}

      {/* EKG Pattern Reference */}
      <GPanel style={{padding:"22px 24px"}}>
        <SecHdr icon="📋" title="EKG Pattern Reference" badge="QUICK REF" accent={T.purple}/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(310px,1fr))",gap:10}}>
          {EKG_PATTERNS.map((p,i)=>{
            const uc=uColor(p.u);
            return (
              <div key={i} style={{...Gx.row(uc),padding:"13px 15px",borderLeft:`3px solid ${uc}50`,transition:"all .2s",cursor:"default"}}
                onMouseEnter={e=>e.currentTarget.style.background=`${uc}0d`}
                onMouseLeave={e=>e.currentTarget.style.background=`${uc}08`}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:7}}>
                  <span style={{fontSize:16}}>{p.icon}</span>
                  <span style={{fontSize:13,fontWeight:700,color:T.txt,flex:1}}>{p.n}</span>
                  <UrgencyBadge u={p.u}/>
                </div>
                <p style={{fontSize:10,color:T.txt2,margin:"0 0 5px",lineHeight:1.5,fontFamily:"'JetBrains Mono',monospace"}}>{p.c}</p>
                <p style={{fontSize:10,color:T.txt3,margin:"0 0 5px",fontStyle:"italic"}}>Territory: {p.t}</p>
                <div style={{background:`${uc}0a`,border:`1px solid ${uc}20`,borderRadius:7,padding:"5px 9px",fontSize:10,color:uc,lineHeight:1.4}}>▶ {p.a}</div>
              </div>
            );
          })}
        </div>
      </GPanel>
    </div>
  );

  // ── Critical Values Reference ──────────────────────────────
  const renderCritical = () => {
    const cats = ["All",...new Set(LABS_REF.map(r=>r.cat))];
    const visible = critCat==="All" ? LABS_REF : LABS_REF.filter(r=>r.cat===critCat);
    const CAT_COLOR = {BMP:T.teal,CBC:T.blue,Coags:T.gold,LFT:T.orange,Cardiac:T.coral,Other:T.purple,Renal:T.gold,ABG:T.green};
    return (
      <div style={{animation:"liIn .35s ease"}}>
        <GPanel style={{padding:"22px 24px"}}>
          <SecHdr icon="⚠️" title="Critical Value Reference" badge="RAPID REFERENCE" accent={T.coral}
            sub="Click any row to expand clinical notes and correction guidance — critical thresholds require immediate STAT notification"/>
          <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:18}}>
            {cats.map(cat=><GPill key={cat} label={cat} active={critCat===cat} accent={T.coral} onClick={()=>{setCritCat(cat);setCritExpanded(null);}}/>)}
          </div>
          {/* Column headers + rows wrapped in scrollable container to prevent overflow clipping */}
          <div style={{overflowX:"auto"}}>
            <div style={{minWidth:570}}>
              <div style={{display:"grid",gridTemplateColumns:"150px 60px 90px 90px 90px 70px 20px",gap:0,padding:"6px 12px",marginBottom:4}}>
                {["Lab","Unit","Normal","Crit LOW","Crit HIGH","Category",""].map((h,hi)=>(
                  <span key={hi} style={{fontSize:9,fontFamily:"'JetBrains Mono',monospace",fontWeight:600,color:T.txt4,textTransform:"uppercase",letterSpacing:".06em"}}>{h}</span>
                ))}
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:3}}>
                {visible.map((r,i)=>{
                  const isExp = critExpanded===r.n;
                  const notes = LAB_NOTES[r.n];
                  const cc = CAT_COLOR[r.cat]||AC;
                  // Use full `border` shorthand consistently — avoid mixing border + borderColor
                  const rowStyle = {
                    ...Gx.row(isExp?cc:null),
                    border:`1px solid ${isExp?cc+"35":T.border}`,
                    transition:"all .18s",
                    cursor:notes?"pointer":"default",
                  };
                  return (
                    <div key={i} style={rowStyle}
                      onClick={()=>notes&&setCritExpanded(p=>p===r.n?null:r.n)}>
                      <div style={{display:"grid",gridTemplateColumns:"150px 60px 90px 90px 90px 70px 20px",alignItems:"center",gap:0,padding:"9px 12px"}}>
                        <span style={{fontWeight:600,color:isExp?cc:T.txt,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.n}</span>
                        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.txt3}}>{r.u}</span>
                        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:T.green}}>{r.norm}</span>
                        <span>{r.cL!=null?<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,fontWeight:700,color:T.coral,textShadow:`0 0 8px ${T.coral}40`}}>&lt;{r.cL}</span>:<span style={{fontSize:11,color:T.txt4}}>—</span>}</span>
                        <span>{r.cH!=null?<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,fontWeight:700,color:T.coral,textShadow:`0 0 8px ${T.coral}40`}}>&gt;{r.cH}</span>:<span style={{fontSize:11,color:T.txt4}}>—</span>}</span>
                        <span><Chip label={r.cat} color={cc}/></span>
                        <span style={{fontSize:10,color:T.txt4,textAlign:"right"}}>{notes?(isExp?"▲":"▼"):""}</span>
                      </div>
                      {isExp&&notes&&(
                        <div style={{padding:"0 14px 12px",borderTop:`1px solid ${T.border}`}}>
                          <p style={{fontSize:12,color:T.txt2,margin:"10px 0 0",lineHeight:1.7}}>{notes}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div style={{marginTop:14,fontSize:10,color:T.txt4,fontFamily:"'JetBrains Mono',monospace",padding:"10px 14px",background:T.glassD,borderRadius:9,border:`1px solid ${T.border}`,lineHeight:1.7}}>
            ⚠ Critical values require STAT provider notification and documentation per institutional policy · Values are general guidelines — adjust for patient age, comorbidities, and baseline
          </div>
        </GPanel>
      </div>
    );
  };

  // ── Summary Section ────────────────────────────────────────
  const renderSummary = () => (
    <div style={{display:"flex",flexDirection:"column",gap:14,animation:"liIn .35s ease"}}>
      <CtxStrip ctx={ctx} onChange={e=>setCtx(e.target.value)}/>
      <GPanel style={{padding:"22px 24px"}} accent={T.purple}>
        <div style={{position:"absolute",top:0,left:0,right:0,height:2,borderRadius:"18px 18px 0 0",background:`linear-gradient(90deg,transparent,${T.purple}80,transparent)`,backgroundSize:"200% 100%",animation:"shimmer 3s linear infinite"}}/>
        <SecHdr icon="📊" title="AI Clinical Summary" badge="SYNTHESIS" accent={T.purple}
          sub="AI synthesizes all labs, imaging, and EKG findings into a prioritized clinical assessment with next steps and disposition"/>
        {/* Data summary chips */}
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}}>
          <Chip label={`${labs.length} labs entered`} color={labs.length?T.teal:T.txt4}/>
          <Chip label={labResult?"Lab analysis ✓":"No lab analysis"} color={labResult?T.teal:T.txt4}/>
          <Chip label={imgResult?"Imaging analysis ✓":imgText?"Imaging text entered":"No imaging"} color={imgResult?T.blue:imgText?T.blue+"80":T.txt4}/>
          <Chip label={ekgResult?"EKG interpreted ✓":ekgText?"EKG text entered":"No EKG"} color={ekgResult?T.coral:ekgText?T.coral+"80":T.txt4}/>
        </div>
        <div style={{display:"flex",justifyContent:"center"}}>
          <button onClick={generateSummary} disabled={sumBusy}
            style={{...Gx.btn(T.purple,true),padding:"12px 32px",fontSize:14,opacity:sumBusy?0.6:1}}>
            {sumBusy?"⏳ Generating Summary…":"📊 Generate Clinical Summary"}
          </button>
        </div>
      </GPanel>

      {sumResult&&(
        <GPanel style={{padding:"24px 26px",animation:"liIn .4s ease"}} accent={T.purple}>
          {/* Clinical summary narrative */}
          {sumResult.clinicalSummary&&(
            <div style={{...Gx.row(T.purple),padding:"16px 18px",marginBottom:18,borderLeft:`3px solid ${T.purple}60`}}>
              <div style={{fontSize:10,fontFamily:"'JetBrains Mono',monospace",color:T.purple,letterSpacing:".08em",textTransform:"uppercase",marginBottom:7}}>Clinical Summary</div>
              <p style={{fontSize:14,color:T.txt,margin:0,fontFamily:"'Playfair Display',serif",lineHeight:1.65,fontStyle:"italic"}}>{sumResult.clinicalSummary}</p>
            </div>
          )}

          {/* Diagnoses row */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
            <div style={{...Gx.row(T.coral),padding:"14px 16px"}}>
              <div style={{fontSize:10,fontFamily:"'JetBrains Mono',monospace",color:T.coral,letterSpacing:".08em",textTransform:"uppercase",marginBottom:7}}>Leading Diagnosis</div>
              <p style={{fontSize:14,fontWeight:700,color:T.txt,margin:"0 0 8px",lineHeight:1.4}}>{sumResult.leadingDiagnosis||"—"}</p>
              {sumResult.disposition&&<Chip label={`Disposition: ${sumResult.disposition}`} color={T.gold}/>}
            </div>
            {sumResult.differential?.length>0&&(
              <div style={{...Gx.row(null),padding:"14px 16px"}}>
                <div style={{fontSize:10,fontFamily:"'JetBrains Mono',monospace",color:T.gold,letterSpacing:".08em",textTransform:"uppercase",marginBottom:7}}>Differential</div>
                {sumResult.differential.map((d,i)=><div key={i} style={{fontSize:12,color:T.txt2,marginBottom:4}}>▸ {d}</div>)}
              </div>
            )}
          </div>

          {/* Prioritized findings */}
          {sumResult.prioritizedFindings?.length>0&&(
            <div style={{marginBottom:14}}>
              <div style={{fontSize:10,fontFamily:"'JetBrains Mono',monospace",color:T.txt3,letterSpacing:".08em",textTransform:"uppercase",marginBottom:9}}>Prioritized Findings</div>
              {sumResult.prioritizedFindings.map((f,i)=>{
                const uc=uColor(f.urgency);
                return <div key={i} style={{...Gx.row(uc),padding:"11px 14px",marginBottom:6,borderLeft:`2px solid ${uc}60`,animation:`liIn .3s ease ${i*0.06}s both`}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                    <span style={{fontSize:12,fontWeight:700,color:T.txt,flex:1}}>{f.finding}</span>
                    <UrgencyBadge u={f.urgency}/>
                  </div>
                  <p style={{fontSize:12,color:uc,margin:0,fontWeight:500}}>▶ {f.action}</p>
                </div>;
              })}
            </div>
          )}

          {/* Actions grid */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:12,marginBottom:14}}>
            {[
              {k:"immediateNextSteps",label:"Immediate Next Steps",color:T.coral,icon:"⚡"},
              {k:"consultations",     label:"Consultations",       color:T.blue, icon:"👨‍⚕️"},
              {k:"followUpLabs",      label:"Follow-up Labs",      color:T.teal, icon:"🔬"},
              {k:"safetyNets",        label:"Safety Nets / Return Precautions",color:T.gold,icon:"🛡️"},
            ].map(({k,label,color,icon})=>sumResult[k]?.length>0&&(
              <div key={k} style={{...Gx.row(color),padding:"14px 15px"}}>
                <div style={{fontSize:10,fontFamily:"'JetBrains Mono',monospace",color,letterSpacing:".07em",textTransform:"uppercase",marginBottom:8}}>{icon} {label}</div>
                {sumResult[k].map((item,i)=><div key={i} style={{fontSize:12,color:T.txt2,marginBottom:5,lineHeight:1.45}}>▸ {item}</div>)}
              </div>
            ))}
          </div>

          <div style={{fontSize:10,color:T.txt4,fontFamily:"'JetBrains Mono',monospace",padding:"10px 14px",background:T.glassD,borderRadius:9,border:`1px solid ${T.border}`,lineHeight:1.7}}>
            ⚕ AI clinical decision support only — final clinical judgement rests with the treating physician · Not a substitute for clinical evaluation
          </div>
        </GPanel>
      )}
    </div>
  );

  // ── Navigation ─────────────────────────────────────────────
  const NAV = [
    {id:"labs",     icon:"🔬", label:"Lab Analyzer",  accent:T.teal},
    {id:"imaging",  icon:"🫁", label:"Imaging",       accent:T.blue},
    {id:"ekg",      icon:"❤️", label:"EKG",           accent:T.coral},
    {id:"critical", icon:"⚠️", label:"Critical Ref",  accent:T.orange},
    {id:"summary",  icon:"📊", label:"AI Summary",    accent:T.purple},
  ];
  const SECTIONS = {labs:renderLabs,imaging:renderImaging,ekg:renderEkg,critical:renderCritical,summary:renderSummary};
  const activeNav = NAV.find(n=>n.id===nav);

  // ════════════════════════════════════════════════════════════
  return (
    <div style={{display:"flex",minHeight:"100vh",background:`linear-gradient(135deg,#04080f 0%,#07101e 50%,#04080f 100%)`,fontFamily:"'DM Sans',sans-serif",position:"relative"}}>
      <AmbientBg/>

      {/* ── SIDEBAR ── */}
      <nav style={{width:224,minHeight:"100vh",position:"relative",zIndex:10,flexShrink:0,background:"rgba(255,255,255,0.04)",backdropFilter:"blur(40px) saturate(180%)",WebkitBackdropFilter:"blur(40px) saturate(180%)",borderRight:"1px solid rgba(255,255,255,0.09)",boxShadow:"4px 0 40px rgba(0,0,0,0.5),inset -1px 0 0 rgba(255,255,255,0.06)",display:"flex",flexDirection:"column",padding:"80px 14px 24px",gap:3}}>
        <div style={{position:"absolute",top:0,left:0,right:0,height:1,background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)",pointerEvents:"none"}}/>
        <div style={{marginBottom:28,paddingLeft:8}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
            <div style={{width:32,height:32,borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",background:`linear-gradient(135deg,${T.blue}40,${T.teal}20)`,border:`1px solid ${T.blue}30`,boxShadow:`0 0 16px ${T.blue}30`,fontSize:16}}>⚕️</div>
            <span style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:T.txt}}>Notrya</span>
          </div>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.blue,letterSpacing:".18em",textTransform:"uppercase",paddingLeft:42,textShadow:`0 0 12px ${T.blue}80`}}>Labs & Imaging</div>
        </div>

        {NAV.map(item=>{
          const active = nav===item.id;
          return (
            <button key={item.id} onClick={()=>setNav(item.id)}
              style={{display:"flex",alignItems:"center",gap:9,padding:"10px 12px",borderRadius:11,border:active?`1px solid ${item.accent}30`:"1px solid transparent",width:"100%",cursor:"pointer",textAlign:"left",fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:active?600:400,transition:"all .2s",position:"relative",background:active?`linear-gradient(135deg,${item.accent}18,${item.accent}08)`:"transparent",color:active?item.accent:T.txt3,boxShadow:active?`0 0 20px ${item.accent}14,inset 0 1px 0 rgba(255,255,255,0.07)`:"none"}}
              onMouseEnter={e=>{if(!active){e.currentTarget.style.background="rgba(255,255,255,0.05)";e.currentTarget.style.borderColor="rgba(255,255,255,0.08)";e.currentTarget.style.color=T.txt2;}}}
              onMouseLeave={e=>{if(!active){e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor="transparent";e.currentTarget.style.color=T.txt3;}}}>
              {active&&<div style={{position:"absolute",left:0,top:"50%",transform:"translateY(-50%)",width:2.5,height:20,background:item.accent,borderRadius:"0 3px 3px 0",boxShadow:`0 0 8px ${item.accent}`}}/>}
              <span style={{fontSize:15,flexShrink:0}}>{item.icon}</span>
              <span style={{flex:1}}>{item.label}</span>
            </button>
          );
        })}

        <div style={{flex:1}}/>
        <div style={{padding:"12px 14px",borderRadius:11,background:"rgba(255,255,255,0.04)",border:`1px solid rgba(255,255,255,0.08)`,boxShadow:`0 4px 20px rgba(0,0,0,0.3),inset 0 1px 0 rgba(255,255,255,0.07)`,marginBottom:6}}>
          <div style={{fontSize:9,fontFamily:"'JetBrains Mono',monospace",color:T.txt4,textTransform:"uppercase",letterSpacing:".12em",marginBottom:5}}>Data Entered</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {labs.length>0&&<Chip label={`${labs.length} labs`} color={T.teal}/>}
            {(imgText||imgData)&&<Chip label="Imaging" color={T.blue}/>}
            {(ekgText||ekgData)&&<Chip label="EKG" color={T.coral}/>}
            {!labs.length&&!imgText&&!imgData&&!ekgText&&!ekgData&&<span style={{fontSize:10,color:T.txt4,fontFamily:"'DM Sans',sans-serif"}}>None yet</span>}
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:7,padding:"8px 12px",borderRadius:9,background:"rgba(45,212,191,0.04)",border:"1px solid rgba(45,212,191,0.15)"}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:T.teal,animation:"pulseTeal 2s ease-in-out infinite"}}/>
          <span style={{fontSize:10,color:T.txt4,fontFamily:"'JetBrains Mono',monospace"}}>AI Ready</span>
        </div>
        <button onClick={()=>window.location.href='/hub'} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 12px",borderRadius:10,border:"1px solid rgba(42,79,122,0.4)",background:"rgba(14,37,68,0.5)",color:T.txt3,fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:600,cursor:"pointer",width:"100%",transition:"all .15s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(59,158,255,0.5)";e.currentTarget.style.color=T.txt2;}} onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(42,79,122,0.4)";e.currentTarget.style.color=T.txt3;}}>
          <span style={{fontSize:15}}>🏥</span>
          <span>Hub</span>
        </button>
      </nav>

      {/* ── MAIN ── */}
      <main style={{flex:1,padding:"80px 38px 52px",overflowY:"auto",position:"relative",zIndex:1}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:22}}>
          <div style={{height:1,width:24,background:`${activeNav?.accent||AC}60`,borderRadius:1,boxShadow:`0 0 6px ${activeNav?.accent||AC}`}}/>
          <span style={{fontSize:10,fontFamily:"'JetBrains Mono',monospace",color:activeNav?.accent||AC,textTransform:"uppercase",letterSpacing:".14em",fontWeight:700,textShadow:`0 0 14px ${activeNav?.accent||AC}80`}}>{activeNav?.label}</span>
          <div style={{flex:1,height:1,background:`linear-gradient(90deg,${activeNav?.accent||AC}30,transparent)`}}/>
          <span style={{fontSize:10,color:T.txt4,fontFamily:"'JetBrains Mono',monospace"}}>Notrya · Labs & Imaging</span>
        </div>
        {(SECTIONS[nav]||(() => null))()}
      </main>

      {/* ── TOASTS ── */}
      <div style={{position:"fixed",bottom:22,right:22,display:"flex",flexDirection:"column",gap:7,zIndex:200}}>
        {toasts.map(t=>{
          const c=t.type==="success"?T.green:t.type==="error"?T.coral:t.type==="warn"?T.gold:T.blue;
          return <div key={t.id} style={{padding:"10px 18px",borderRadius:12,background:"rgba(255,255,255,0.07)",backdropFilter:"blur(28px) saturate(160%)",WebkitBackdropFilter:"blur(28px) saturate(160%)",border:`1px solid ${c}30`,color:c,fontFamily:"'DM Sans',sans-serif",fontSize:13,boxShadow:`0 8px 32px rgba(0,0,0,0.6),0 0 16px ${c}20,inset 0 1px 0 rgba(255,255,255,0.15)`,animation:"liIn .25s ease",whiteSpace:"nowrap",textShadow:`0 0 10px ${c}60`}}>{t.msg}</div>;
        })}
      </div>
    </div>
  );
}