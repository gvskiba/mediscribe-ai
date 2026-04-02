import { useState } from "react";
import { base44 } from "@/api/base44Client";

// ── Design tokens ──────────────────────────────────────────────────
const T = {
  bg: "#050f1e", panel: "#081628", card: "#0b1e36", up: "#0e2544",
  b: "rgba(26,53,85,0.8)", bhi: "rgba(42,79,122,0.9)",
  txt: "#e8f0fe", txt2: "#8aaccc", txt3: "#4a6a8a", txt4: "#2e4a6a",
  teal: "#00e5c0", gold: "#f5c842", coral: "#ff6b6b", blue: "#3b9eff",
  orange: "#ff9f43", purple: "#9b6dff", green: "#3dffa0", cyan: "#00d4ff",
};

// ── Lab reference data ─────────────────────────────────────────────
const LAB_PANELS = [
  {
    id: "cbc",
    label: "CBC",
    icon: "🩸",
    color: T.coral,
    tests: [
      { name: "WBC", unit: "×10³/µL", low: 4.5, high: 11.0, critical_low: 2.0, critical_high: 30.0, notes: "Leukocytosis >11 suggests infection/inflammation; >30 may indicate leukemia. Leukopenia <4.5 raises infection or bone marrow suppression concern." },
      { name: "Hemoglobin", unit: "g/dL", low: 12.0, high: 17.5, critical_low: 7.0, critical_high: 20.0, notes: "Critical low <7 g/dL typically requires transfusion. Consider iron studies, B12/folate, reticulocyte count in anemia workup." },
      { name: "Hematocrit", unit: "%", low: 36, high: 52, critical_low: 21, critical_high: 60, notes: "Parallels hemoglobin findings. Hemoconcentration (>60%) seen in polycythemia or severe dehydration." },
      { name: "Platelets", unit: "×10³/µL", low: 150, high: 400, critical_low: 50, critical_high: 1000, notes: "Thrombocytopenia <50 increases bleeding risk; <20 critical. Consider HIT, ITP, TTP/HUS. Thrombocytosis >400 may be reactive or myeloproliferative." },
      { name: "MCV", unit: "fL", low: 80, high: 100, critical_low: null, critical_high: null, notes: "Microcytic (<80): iron deficiency, thalassemia. Normocytic (80-100): chronic disease, acute blood loss. Macrocytic (>100): B12/folate deficiency, liver disease, hypothyroidism." },
      { name: "Neutrophils", unit: "%", low: 50, high: 70, critical_low: null, critical_high: null, notes: "ANC <500 (severe neutropenia) = febrile neutropenia protocol. Bands >10% suggest left shift / severe infection." },
    ],
  },
  {
    id: "bmp",
    label: "BMP/CMP",
    icon: "⚗️",
    color: T.blue,
    tests: [
      { name: "Sodium", unit: "mEq/L", low: 136, high: 145, critical_low: 120, critical_high: 160, notes: "Hyponatremia: check serum osmolality, urine Na, urine osm. Hypernatremia typically free water deficit. Correct Na no faster than 8-10 mEq/L/day (risk of ODS)." },
      { name: "Potassium", unit: "mEq/L", low: 3.5, high: 5.0, critical_low: 2.5, critical_high: 6.5, notes: "K <2.5 or >6.5 = cardiac arrhythmia risk. Get ECG. IV replacement for K <3.0. Pseudohyperkalemia: hemolysis, thrombocytosis, leukocytosis." },
      { name: "Bicarbonate", unit: "mEq/L", low: 22, high: 29, critical_low: 10, critical_high: null, notes: "Low bicarb: metabolic acidosis (MUDPILES mnemonic). High bicarb: metabolic alkalosis (contraction, vomiting, diuretics). Use with pH to characterize acid-base." },
      { name: "BUN", unit: "mg/dL", low: 7, high: 20, critical_low: null, critical_high: 100, notes: "BUN:Cr ratio >20:1 suggests prerenal azotemia or GI bleed. Isolated BUN elevation: high protein intake, GI bleed, catabolic state." },
      { name: "Creatinine", unit: "mg/dL", low: 0.6, high: 1.2, critical_low: null, critical_high: 10.0, notes: "Acute rise ≥0.3 mg/dL or ≥50% = AKI (KDIGO). Stage I: 1.5–1.9× baseline. Stage II: 2–2.9×. Stage III: ≥3× or ≥4.0 mg/dL." },
      { name: "Glucose", unit: "mg/dL", low: 70, high: 100, critical_low: 40, critical_high: 500, notes: "Critical hypoglycemia (<40): IV dextrose 50% 1 amp. DKA: glucose typically 250–600. HHS: often >600 with profound dehydration." },
      { name: "Calcium", unit: "mg/dL", low: 8.5, high: 10.5, critical_low: 7.0, critical_high: 13.0, notes: "Correct for albumin: Ca(corrected) = Ca + 0.8×(4 – albumin). Symptomatic hypocalcemia: perioral numbness, Chvostek/Trousseau. Hypercalcemia >13: hydration + bisphosphonates." },
      { name: "Magnesium", unit: "mg/dL", low: 1.7, high: 2.4, critical_low: 1.0, critical_high: null, notes: "Often co-depleted with K. Hypomagnesemia: arrhythmias, seizures, refractory hypokalemia. IV repletion for Mg <1.2 or symptomatic." },
      { name: "Phosphorus", unit: "mg/dL", low: 2.5, high: 4.5, critical_low: 1.0, critical_high: null, notes: "Critical hypophosphatemia (<1.0): respiratory failure, hemolysis, rhabdomyolysis. High in renal failure, hypoparathyroidism." },
      { name: "ALT", unit: "U/L", low: 7, high: 56, critical_low: null, critical_high: null, notes: "ALT >3× ULN = significant hepatocellular injury. ALT/AST ratio <1 in alcoholic hepatitis; >1 in viral/toxic. Extreme elevation (>1000): ischemic, toxic, or viral hepatitis." },
      { name: "AST", unit: "U/L", low: 10, high: 40, critical_low: null, critical_high: null, notes: "Less liver-specific than ALT (also cardiac, muscle). AST/ALT >2:1 with elevated GGT suggests alcoholic liver disease." },
    ],
  },
  {
    id: "coags",
    label: "Coagulation",
    icon: "🧬",
    color: T.purple,
    tests: [
      { name: "PT/INR", unit: "", low: 0.8, high: 1.2, critical_low: null, critical_high: 5.0, notes: "INR >1.5 before procedures increases bleeding risk. Warfarin reversal: Vit K ± FFP ± 4F-PCC. INR >5: hold warfarin, consider reversal. Liver disease elevates INR." },
      { name: "aPTT", unit: "sec", low: 25, high: 35, critical_low: null, critical_high: 100, notes: "Prolonged aPTT: heparin therapy, factor deficiencies (VIII, IX, XI), lupus anticoagulant. aPTT >100 on heparin: hold infusion, check anti-Xa." },
      { name: "Fibrinogen", unit: "mg/dL", low: 200, high: 400, critical_low: 100, critical_high: null, notes: "Low in DIC, liver failure, thrombolysis. Critical <100: high risk of bleeding. Cryoprecipitate repletes fibrinogen. D-dimer elevated in DIC, PE, DVT, sepsis." },
      { name: "D-Dimer", unit: "µg/mL FEU", low: 0, high: 0.5, critical_low: null, critical_high: null, notes: "High sensitivity, low specificity. Negative D-dimer rules out PE/DVT in low-intermediate pretest probability (Wells ≤4). Age-adjusted cutoff: age × 0.01 µg/mL if age >50." },
    ],
  },
  {
    id: "cardiac",
    label: "Cardiac",
    icon: "🫀",
    color: T.coral,
    tests: [
      { name: "Troponin I (hs)", unit: "ng/L", low: 0, high: 19, critical_low: null, critical_high: null, notes: "0/1h or 0/2h rule-out algorithms: delta Tn <3–5 ng/L over 1h effectively rules out NSTEMI. Any elevation requires serial testing. Cause non-ACS Tn rise: PE, myocarditis, sepsis, renal failure." },
      { name: "BNP", unit: "pg/mL", low: 0, high: 100, critical_low: null, critical_high: null, notes: "BNP <100 makes acute HF unlikely. >400 strongly suggests decompensated HF. Intermediate 100–400: consider other causes. NT-proBNP cutoffs differ by age." },
      { name: "CK-MB", unit: "ng/mL", low: 0, high: 5.0, critical_low: null, critical_high: null, notes: "Peaks at 12–24h post-MI. Returns to normal in 48–72h (useful for detecting reinfarction). Largely replaced by hs-Troponin for ACS diagnosis." },
      { name: "Myoglobin", unit: "ng/mL", low: 0, high: 90, critical_low: null, critical_high: null, notes: "Rises within 1-3h (earliest cardiac marker). Non-specific (skeletal + cardiac muscle). Elevated in rhabdomyolysis. Serial negative values have high NPV for AMI within 4-6h." },
    ],
  },
  {
    id: "abg",
    label: "ABG / VBG",
    icon: "💨",
    color: T.teal,
    tests: [
      { name: "pH", unit: "", low: 7.35, high: 7.45, critical_low: 7.2, critical_high: 7.6, notes: "Acidosis <7.35: respiratory (↑pCO2) or metabolic (↓HCO3). Alkalosis >7.45: resp (↓pCO2) or metabolic (↑HCO3). Check compensation. pH <7.1 = severe acidemia → ventilatory support." },
      { name: "pCO2", unit: "mmHg", low: 35, high: 45, critical_low: 20, critical_high: 70, notes: "Hypercapnia >45: hypoventilation, COPD, sedation. Compensation for metabolic alkalosis. pCO2 <35: hyperventilation, compensation for metabolic acidosis. Predict expected pCO2: 1.5×HCO3 + 8 ± 2 (Winter's)." },
      { name: "pO2", unit: "mmHg", low: 80, high: 100, critical_low: 55, critical_high: null, notes: "Mild hypoxemia 60-79; Moderate 40-59; Severe <40. P/F ratio = PaO2/FiO2. ARDS: P/F <300 mild, <200 moderate, <100 severe." },
      { name: "HCO3", unit: "mEq/L", low: 22, high: 26, critical_low: 10, critical_high: null, notes: "Calculated from pH and pCO2. Matches serum bicarb within 2 mEq/L. Primary metabolic alkalosis (>26) or acidosis (<22). Check anion gap if low HCO3." },
      { name: "Lactate", unit: "mmol/L", low: 0, high: 2.0, critical_low: null, critical_high: 4.0, notes: ">2: hyperlactatemia. >4: lactic acidosis — sepsis, ischemia, liver failure, medications (metformin, linezolid). Serial lactate clearance (>10%/2h) predicts improved sepsis outcomes." },
      { name: "SpO2/SaO2", unit: "%", low: 95, high: 100, critical_low: 88, critical_high: null, notes: "Pulse ox unreliable in: carboxyhemoglobin (CO poisoning), methemoglobinemia, severe peripheral vasoconstriction. ABG-measured SaO2 preferred in these states." },
    ],
  },
  {
    id: "micro",
    label: "Microbiology",
    icon: "🦠",
    color: T.green,
    tests: [
      { name: "Procalcitonin", unit: "ng/mL", low: 0, high: 0.1, critical_low: null, critical_high: null, notes: "<0.1: bacterial infection unlikely. 0.1–0.5: low probability. 0.5–2: possible bacterial. >2: likely bacterial sepsis. >10: severe bacterial sepsis/septic shock. Viral infections generally do not elevate PCT." },
      { name: "CRP", unit: "mg/L", low: 0, high: 10, critical_low: null, critical_high: null, notes: "Non-specific inflammation marker. Rises 6-12h, peaks at 48h. >100 mg/L: suggests significant bacterial infection or severe inflammation. Useful for tracking treatment response." },
      { name: "ESR", unit: "mm/hr", low: 0, high: 20, critical_low: null, critical_high: null, notes: "Slow, non-specific. Elevated in infection, inflammation, malignancy, autoimmune disease. Very high (>100): consider multiple myeloma, TB, endocarditis, giant cell arteritis." },
      { name: "Blood Culture", unit: "", low: null, high: null, critical_low: null, critical_high: null, notes: "Draw 2 sets (aerobic + anaerobic) before antibiotics. Time-to-positivity <12h suggests high-grade bacteremia (S. aureus, GNR). Contamination: CoNS in 1/2 bottles usually. Sensitivity ↑ with volume (8-10 mL/bottle)." },
    ],
  },
  {
    id: "renal",
    label: "Urinalysis / Renal",
    icon: "🫘",
    color: T.gold,
    tests: [
      { name: "Urine Na", unit: "mEq/L", low: null, high: null, critical_low: null, critical_high: null, notes: "FeNa = (urine Na × serum Cr) / (serum Na × urine Cr) × 100. FeNa <1%: prerenal AKI. >2%: intrinsic renal/ATN. FeNa unreliable on diuretics — use FeUrea instead (<35% prerenal)." },
      { name: "Urine Protein", unit: "mg/dL", low: 0, high: 14, critical_low: null, critical_high: null, notes: "Spot urine protein:creatinine ratio >0.3 = significant proteinuria. >3.5 = nephrotic range. 24h urine gold standard. Microalbuminuria (30-300 mg/day): early diabetic nephropathy." },
      { name: "Urine Osmolality", unit: "mOsm/kg", low: 50, high: 1200, critical_low: null, critical_high: null, notes: "In hyponatremia: <100 suggests primary polydipsia. >100 indicates impaired water excretion (SIADH, hypothyroidism, adrenal insufficiency). SIADH: urine osm >serum osm." },
    ],
  },
];

// ── Imaging findings data ──────────────────────────────────────────
const IMAGING_DATA = [
  {
    id: "cxr",
    label: "Chest X-Ray",
    icon: "🫁",
    color: T.blue,
    findings: [
      { pattern: "Bilateral Infiltrates", ddx: ["ARDS", "Pulmonary edema", "Bilateral pneumonia", "Diffuse alveolar hemorrhage"], keys: ["Distribution (central=cardiac, peripheral=ARDS)", "Kerley B lines (cardiogenic)", "Air bronchograms (consolidation)", "Septal lines"] },
      { pattern: "Unilateral Opacity", ddx: ["Pneumonia", "Atelectasis", "Pleural effusion", "Lung mass", "Hemothorax"], keys: ["Air bronchograms (pneumonia)", "Volume loss (atelectasis)", "Meniscus sign (effusion)", "Tracheal deviation"] },
      { pattern: "Pneumothorax", ddx: ["Spontaneous PTX", "Tension PTX", "Traumatic PTX"], keys: ["Absent lung markings peripheral", "Visceral pleural line", "Tracheal deviation (tension)", "Deep sulcus sign (supine)"] },
      { pattern: "Cardiomegaly", ddx: ["Cardiomyopathy", "Pericardial effusion", "CHF", "Valvular disease"], keys: ["Cardiothoracic ratio >0.5 on PA", "Pulmonary vascular congestion", "Cephalization of vessels", "Vascular pedicle width"] },
      { pattern: "Pleural Effusion", ddx: ["CHF", "Parapneumonic / empyema", "Malignancy", "PE", "Hypoalbuminemia"], keys: ["Meniscus sign", "Blunting of costophrenic angle", "Bilateral = transudative (Light's)", "Unilateral = exudative until proven otherwise"] },
      { pattern: "Pulmonary Edema", ddx: ["Cardiogenic (CHF)", "Non-cardiogenic (ARDS)", "Flash pulmonary edema"], keys: ["Bat-wing / butterfly pattern (cardiogenic)", "Kerley B lines", "Increased vascular pedicle >70mm", "BNP / Echo to differentiate"] },
      { pattern: "Mediastinal Widening", ddx: ["Aortic dissection", "Mediastinal hematoma", "Lymphadenopathy", "Aortic aneurysm"], keys: [">8 cm at aortic knob", "Loss of aortic knob", "Tracheal deviation right", "CT angiography urgently if suspected dissection"] },
      { pattern: "Hyperinflation", ddx: ["COPD / Emphysema", "Asthma (acute)", "Air trapping"], keys: [">6 anterior ribs / >10 posterior ribs", "Flattened diaphragms", "Increased AP diameter", "Barrel chest appearance"] },
    ],
  },
  {
    id: "ct-head",
    label: "CT Head",
    icon: "🧠",
    color: T.purple,
    findings: [
      { pattern: "Hyperdense lesion (acute)", ddx: ["Intracerebral hemorrhage", "Acute SAH (sulcal)", "Calcification (chronic)", "Hyperacute ischemic stroke"], keys: ["ICH: heterogeneous, mass effect", "SAH: filling cisterns/sulci", "Age of blood (hyper→iso→hypo over weeks)", "Spot sign = active bleeding"] },
      { pattern: "Hypodense lesion", ddx: ["Ischemic stroke (>6h)", "Tumor / metastasis", "Abscess", "Demyelination (MS)"], keys: ["Vascular territory (stroke)", "Ring enhancement (abscess/tumor)", "DWI MRI > CT for early ischemia", "ASPECTS score for MCA strokes"] },
      { pattern: "Subarachnoid Blood", ddx: ["Ruptured aneurysm (80%)", "AVM", "Traumatic SAH", "Non-aneurysmal perimesencephalic"], keys: ["Hyperdense blood in cisterns/sulci", "Fisher grade predicts vasospasm risk", "CTA if non-traumatic SAH", "Thunderclap headache = LP if CT negative <6h"] },
      { pattern: "Midline Shift", ddx: ["Large hematoma (EDH/SDH/ICH)", "Cerebral edema", "Large infarct (MCA)"], keys: [">5mm shift = neurosurgical emergency", "Compare to contralateral side", "Subfalcine herniation", "Dilated ipsilateral ventricle = obstructive hydrocephalus"] },
      { pattern: "Hydrocephalus", ddx: ["Obstructive (mass/blood)", "Communicating (meningitis, SAH)", "Normal pressure hydrocephalus"], keys: ["Temporal horn dilation (early)", "Periventricular lucency = transependymal edema", "4th ventricle visible = communicating", "Evans index >0.3"] },
      { pattern: "No Acute Finding", ddx: [], keys: ["Does not exclude early ischemia (<6h)", "Does not exclude SAH (sensitivity 98% <6h, drops over time)", "Clinical correlation essential", "MRI-DWI for suspected posterior circulation stroke"] },
    ],
  },
  {
    id: "ct-chest",
    label: "CT Chest",
    icon: "🫁",
    color: T.teal,
    findings: [
      { pattern: "Pulmonary Embolism", ddx: ["Acute PE (central/segmental/subsegmental)", "Saddle PE"], keys: ["Filling defect in PA (hypodense)", "Hampton hump (peripheral wedge infarct)", "Westermark sign (CXR)", "RV:LV ratio >1 = right heart strain"] },
      { pattern: "Ground Glass Opacities", ddx: ["COVID-19 / viral pneumonia", "Atypical pneumonia", "Early pulmonary edema", "Hypersensitivity pneumonitis", "PCP"], keys: ["Bilateral, peripheral, posterior GGOs = COVID pattern", "Crazy paving (GGO + interlobular thickening)", "Consolidation + GGO = organizing pneumonia", "Traction bronchiectasis = fibrosis"] },
      { pattern: "Consolidation", ddx: ["Bacterial pneumonia", "Aspiration", "Infarction (PE)", "Lymphoma / organizing pneumonia"], keys: ["Lobar = typical bacterial", "Dependent distribution = aspiration", "Air bronchograms", "RLL = aspiration in supine patients"] },
      { pattern: "Aortic Dissection", ddx: ["Type A (ascending)", "Type B (descending)", "Intramural hematoma"], keys: ["Intimal flap creating true/false lumen", "True lumen: smaller, calcification on outer wall", "Type A: emergent surgical repair", "Type B: medical (BP/HR control) unless complications"] },
      { pattern: "Pulmonary Nodule", ddx: ["Benign granuloma", "Primary lung cancer", "Metastasis", "Carcinoid"], keys: ["Fleischner Society guidelines for follow-up", "<6mm low-risk: no routine follow-up", "Spiculated margins, upper lobe, >30mm = higher risk", "PET scan for >8mm solid nodules"] },
    ],
  },
  {
    id: "ct-abdomen",
    label: "CT Abdomen/Pelvis",
    icon: "🫄",
    color: T.orange,
    findings: [
      { pattern: "Free Air (Pneumoperitoneum)", ddx: ["Perforated viscus (peptic ulcer, diverticulitis)", "Post-surgical", "Boerhaave syndrome"], keys: ["Subdiaphragmatic free air on CXR", "Best seen under right hemidiaphragm", "Perforation = surgical emergency", "Post-op free air resolves in 3-7 days"] },
      { pattern: "Small Bowel Obstruction", ddx: ["Adhesions (most common)", "Hernia (incarcerated)", "Volvulus", "Intussusception", "Malignancy"], keys: ["Dilated SB >2.5 cm with decompressed colon", "Transition point", "Closed loop = volvulus (C or U shape)", "Pneumatosis intestinalis = ischemia"] },
      { pattern: "Appendicitis", ddx: ["Acute appendicitis", "Mesenteric lymphadenitis", "Meckel diverticulitis"], keys: ["Dilated appendix >6mm", "Periappendiceal fat stranding", "Appendicolith", "Perforation: phlegmon/abscess, extraluminal air/stool"] },
      { pattern: "Diverticulitis", ddx: ["Uncomplicated diverticulitis", "Complicated (abscess/perforation)", "Perforated colon cancer"], keys: ["Sigmoid most common", "Pericolic fat stranding", "Hinchey classification (I-IV)", "Free perforation (IV) = emergent surgery"] },
      { pattern: "Aortic Aneurysm / AAA", ddx: ["Stable AAA", "Ruptured AAA (retroperitoneal hematoma)", "Contained rupture"], keys: [">5.5cm = repair threshold", "Retroperitoneal hematoma = rupture", "Periaortic stranding = impending rupture", "Endovascular vs open repair"] },
      { pattern: "Liver / Biliary", ddx: ["Cholecystitis (pericholecystic fluid, wall thickening)", "Choledocholithiasis", "Biliary obstruction", "Liver abscess", "Hepatic mass"], keys: ["CBD >6mm (post-cholecystectomy >8mm)", "Gallbladder wall >3mm", "Pericholecystic fluid", "Murphy sign on US more sensitive than CT"] },
    ],
  },
  {
    id: "echo",
    label: "Echocardiography",
    icon: "🫀",
    color: T.coral,
    findings: [
      { pattern: "Reduced EF (<40%)", ddx: ["Systolic heart failure / Cardiomyopathy", "Post-MI dysfunction", "Septic cardiomyopathy", "Stress cardiomyopathy (Takotsubo)"], keys: ["EF <40% = reduced (HFrEF)", "Wall motion abnormalities = ischemic", "Apical ballooning = Takotsubo", "Global hypokinesis = non-ischemic CM"] },
      { pattern: "Pericardial Effusion", ddx: ["Viral pericarditis", "Malignancy", "Uremia", "Post-MI (Dressler)", "Hypothyroidism", "Aortic dissection"], keys: ["Small <1cm, Moderate 1-2cm, Large >2cm", "Diastolic RV collapse = tamponade physiology", "Swinging heart on echo", "Pulsus paradoxus >10mmHg (clinical)"] },
      { pattern: "RV Dysfunction / Dilation", ddx: ["Massive PE", "Cor pulmonale", "ARDS", "RV infarct"], keys: ["RV:LV ratio >1 in AP4C view", "McConnell sign (apical sparing) = PE specific", "D-sign (interventricular septum shift)", "TAPSE <16mm = significant RV dysfunction"] },
      { pattern: "Valvular Abnormality", ddx: ["Aortic stenosis", "Mitral regurgitation", "Aortic regurgitation", "Infective endocarditis"], keys: ["AS: peak gradient >40 / AVA <1cm² = severe", "Vegetations: irregular, oscillating", "TEE more sensitive for endocarditis than TTE", "Eccentric jet = valvular vs functional MR"] },
    ],
  },
  {
    id: "us-pocus",
    label: "POCUS / Ultrasound",
    icon: "🔊",
    color: T.green,
    findings: [
      { pattern: "FAST Exam – Positive", ddx: ["Hemoperitoneum", "Hemopericardium", "Hemothorax", "Pneumothorax"], keys: ["Morison's pouch (hepatorenal)", "Splenorenal space", "Pericardial window", "Lung sliding (absent = PTX)"] },
      { pattern: "Lung Ultrasound Findings", ddx: ["A-lines (normal)", "B-lines >3/zone (pulmonary edema)", "Lung consolidation (hepatization)", "Pleural effusion"], keys: ["A-lines: normal aeration or PTX", ">3 B-lines bilateral = cardiogenic or ARDS", "Tissue-like echogenicity = consolidation", "Anechoic collection with shifting = effusion"] },
      { pattern: "DVT", ddx: ["Acute DVT", "Chronic DVT", "Baker's cyst (popliteal)", "Lymphadenopathy"], keys: ["Non-compressibility gold standard", "Echogenic thrombus (acute = hypoechoic)", "Color Doppler augmentation loss", "Whole-leg compression US vs proximal-only"] },
      { pattern: "Gallbladder / Biliary US", ddx: ["Acute cholecystitis", "Cholelithiasis", "Biliary sludge", "Gallbladder polyp"], keys: ["Gallbladder wall >3mm", "Pericholecystic fluid", "Sonographic Murphy sign", "CBD >6mm (or >8mm post-cholecystectomy)"] },
      { pattern: "Abdominal Aorta", ddx: ["AAA (>3cm)", "Aortic dissection", "Normal aorta"], keys: ["Normal aorta <3cm outer-to-outer", ">5.5cm = surgical repair threshold", "Retroperitoneal hematoma = rupture", "Always visualize entire aorta to bifurcation"] },
    ],
  },
];

// ── Tab labels ─────────────────────────────────────────────────────
const TABS = [
  { id: "labs", label: "Lab Reference", icon: "🧪" },
  { id: "imaging", label: "Imaging Patterns", icon: "🖼️" },
  { id: "interpreter", label: "AI Interpreter", icon: "🤖" },
];

// ── Value Indicator ─────────────────────────────────────────────────
function ValIndicator({ value, test }) {
  if (!value || value === "") return null;
  const v = parseFloat(value);
  if (isNaN(v)) return null;
  let status = "normal", color = T.teal, label = "Normal";
  if (test.critical_low !== null && v <= test.critical_low) { status = "critical_low"; color = T.coral; label = "⚠️ CRITICAL LOW"; }
  else if (test.critical_high !== null && v >= test.critical_high) { status = "critical_high"; color = T.coral; label = "⚠️ CRITICAL HIGH"; }
  else if (test.low !== null && v < test.low) { status = "low"; color = T.gold; label = "↓ Low"; }
  else if (test.high !== null && v > test.high) { status = "high"; color = T.orange; label = "↑ High"; }
  return (
    <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: `${color}18`, border: `1px solid ${color}55`, color, fontFamily: "monospace" }}>{label}</span>
  );
}

// ── Labs Tab ───────────────────────────────────────────────────────
function LabsTab() {
  const [activePanel, setActivePanel] = useState("cbc");
  const [values, setValues] = useState({});
  const [expandedTest, setExpandedTest] = useState(null);

  const panel = LAB_PANELS.find(p => p.id === activePanel);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 16, height: "100%" }}>
      {/* Panel selector */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {LAB_PANELS.map(p => (
          <button key={p.id} onClick={() => setActivePanel(p.id)} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10,
            border: `1px solid ${activePanel === p.id ? p.color : T.b}`,
            background: activePanel === p.id ? `${p.color}12` : T.card,
            color: activePanel === p.id ? p.color : T.txt2,
            fontSize: 13, fontWeight: activePanel === p.id ? 700 : 400,
            cursor: "pointer", textAlign: "left", fontFamily: "inherit", transition: "all .15s",
          }}>
            <span style={{ fontSize: 18 }}>{p.icon}</span>
            {p.label}
          </button>
        ))}
      </div>

      {/* Test list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 22 }}>{panel.icon}</span>
          <div style={{ fontSize: 18, fontWeight: 700, color: panel.color, fontFamily: "'Playfair Display',serif" }}>{panel.label}</div>
          <span style={{ fontSize: 10, color: T.txt3 }}>{panel.tests.length} tests</span>
        </div>
        {panel.tests.map(test => {
          const val = values[`${activePanel}_${test.name}`] || "";
          const isExpanded = expandedTest === `${activePanel}_${test.name}`;
          return (
            <div key={test.name} style={{ background: T.card, border: `1px solid ${isExpanded ? panel.color + "55" : T.b}`, borderRadius: 12, overflow: "hidden", transition: "border-color .15s" }}>
              <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
                onClick={() => setExpandedTest(isExpanded ? null : `${activePanel}_${test.name}`)}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: T.txt }}>{test.name}</span>
                    <span style={{ fontSize: 10, color: T.txt4, fontFamily: "monospace" }}>{test.unit}</span>
                    {test.low !== null && <span style={{ fontSize: 10, color: T.txt3 }}>{test.low}–{test.high}</span>}
                    <ValIndicator value={val} test={test} />
                  </div>
                  {test.critical_low !== null || test.critical_high !== null ? (
                    <div style={{ fontSize: 9, color: T.coral, marginTop: 2 }}>
                      Critical: {test.critical_low !== null ? `<${test.critical_low}` : ""}{test.critical_low !== null && test.critical_high !== null ? " / " : ""}{test.critical_high !== null ? `>${test.critical_high}` : ""}
                    </div>
                  ) : null}
                </div>
                <input
                  value={val}
                  onClick={e => e.stopPropagation()}
                  onChange={e => setValues(v => ({ ...v, [`${activePanel}_${test.name}`]: e.target.value }))}
                  placeholder="Enter value"
                  style={{ width: 110, padding: "6px 10px", borderRadius: 8, background: T.up, border: `1px solid ${T.b}`, color: T.txt, fontSize: 12, fontFamily: "monospace" }}
                />
                <span style={{ color: T.txt3, fontSize: 14 }}>{isExpanded ? "▲" : "▼"}</span>
              </div>
              {isExpanded && (
                <div style={{ padding: "0 16px 14px", borderTop: `1px solid ${T.b}` }}>
                  <p style={{ fontSize: 12, color: T.txt2, lineHeight: 1.7, paddingTop: 12 }}>{test.notes}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Imaging Tab ────────────────────────────────────────────────────
function ImagingTab() {
  const [activeStudy, setActiveStudy] = useState("cxr");
  const [expandedFinding, setExpandedFinding] = useState(null);
  const [search, setSearch] = useState("");

  const study = IMAGING_DATA.find(s => s.id === activeStudy);
  const filtered = study.findings.filter(f =>
    !search || f.pattern.toLowerCase().includes(search.toLowerCase()) ||
    f.ddx.some(d => d.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 16, height: "100%" }}>
      {/* Study selector */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {IMAGING_DATA.map(s => (
          <button key={s.id} onClick={() => { setActiveStudy(s.id); setExpandedFinding(null); }} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10,
            border: `1px solid ${activeStudy === s.id ? s.color : T.b}`,
            background: activeStudy === s.id ? `${s.color}12` : T.card,
            color: activeStudy === s.id ? s.color : T.txt2,
            fontSize: 13, fontWeight: activeStudy === s.id ? 700 : 400,
            cursor: "pointer", textAlign: "left", fontFamily: "inherit", transition: "all .15s",
          }}>
            <span style={{ fontSize: 18 }}>{s.icon}</span>
            {s.label}
          </button>
        ))}
      </div>

      {/* Findings */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <span style={{ fontSize: 22 }}>{study.icon}</span>
          <div style={{ fontSize: 18, fontWeight: 700, color: study.color, fontFamily: "'Playfair Display',serif" }}>{study.label}</div>
          <div style={{ position: "relative", marginLeft: "auto" }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: T.txt4 }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search findings…"
              style={{ padding: "6px 10px 6px 28px", borderRadius: 8, background: T.card, border: `1px solid ${T.b}`, color: T.txt, fontSize: 12, width: 200, fontFamily: "inherit" }} />
          </div>
        </div>

        {filtered.map((finding, i) => {
          const isExp = expandedFinding === i;
          return (
            <div key={i} style={{ background: T.card, border: `1px solid ${isExp ? study.color + "55" : T.b}`, borderRadius: 12, overflow: "hidden", transition: "border-color .15s" }}>
              <div style={{ padding: "13px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
                onClick={() => setExpandedFinding(isExp ? null : i)}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.txt, marginBottom: 4 }}>{finding.pattern}</div>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    {finding.ddx.slice(0, 3).map((d, j) => (
                      <span key={j} style={{ fontSize: 10, padding: "1px 7px", borderRadius: 20, background: `${study.color}10`, border: `1px solid ${study.color}30`, color: study.color }}>{d}</span>
                    ))}
                    {finding.ddx.length > 3 && <span style={{ fontSize: 10, color: T.txt4 }}>+{finding.ddx.length - 3} more</span>}
                  </div>
                </div>
                <span style={{ color: T.txt3, fontSize: 14 }}>{isExp ? "▲" : "▼"}</span>
              </div>
              {isExp && (
                <div style={{ padding: "0 16px 14px", borderTop: `1px solid ${T.b}` }}>
                  <div style={{ paddingTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: T.txt3, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 8 }}>Differential Diagnosis</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {finding.ddx.map((d, j) => (
                          <div key={j} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: T.txt2 }}>
                            <div style={{ width: 5, height: 5, borderRadius: "50%", background: study.color, flexShrink: 0 }} />
                            {d}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: T.txt3, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 8 }}>Key Findings / Pearls</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {finding.keys.map((k, j) => (
                          <div key={j} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12, color: T.txt2, lineHeight: 1.5 }}>
                            <div style={{ width: 5, height: 5, borderRadius: "50%", background: T.gold, flexShrink: 0, marginTop: 5 }} />
                            {k}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && <div style={{ textAlign: "center", padding: "40px 0", color: T.txt4, fontSize: 13 }}>No findings match your search.</div>}
      </div>
    </div>
  );
}

// ── AI Interpreter Tab ─────────────────────────────────────────────
function AIInterpreterTab() {
  const [labText, setLabText] = useState("");
  const [imagingText, setImagingText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const interpret = async () => {
    if (!labText.trim() && !imagingText.trim()) return;
    setLoading(true);
    setResult(null);
    const prompt = `You are an emergency medicine physician interpreting clinical results. Analyze the following and provide a structured clinical interpretation.

Lab Values:
${labText || "None provided"}

Imaging Findings:
${imagingText || "None provided"}

Provide a structured response with:
1. **Critical Alerts** - Any critical values requiring immediate action
2. **Key Abnormalities** - Significant findings organized by system
3. **Clinical Interpretation** - What the pattern suggests clinically
4. **Suggested Next Steps** - Prioritized recommendations (further workup, management, consults)
5. **Differential Diagnoses** - Top 3-5 diagnoses supported by the findings

Be concise and clinically actionable. Use bold for critical findings.`;

    try {
      const res = await base44.integrations.Core.InvokeLLM({ prompt });
      setResult(res);
    } catch {
      setResult("Error: Could not reach AI service. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, height: "100%" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ background: T.card, borderRadius: 12, padding: 16, border: `1px solid ${T.b}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.teal, marginBottom: 8, textTransform: "uppercase", letterSpacing: ".07em" }}>🧪 Lab Values</div>
          <textarea value={labText} onChange={e => setLabText(e.target.value)}
            placeholder={"Paste or type lab results here...\ne.g.\nWBC 14.2\nHgb 8.1\nCreatinine 2.4\nLactate 3.8\nTroponin 0.9\nINR 1.8"}
            rows={10} style={{ width: "100%", background: T.up, border: `1px solid ${T.b}`, borderRadius: 8, padding: "10px 12px", color: T.txt, fontSize: 12, fontFamily: "monospace", resize: "vertical", lineHeight: 1.7 }} />
        </div>
        <div style={{ background: T.card, borderRadius: 12, padding: 16, border: `1px solid ${T.b}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.blue, marginBottom: 8, textTransform: "uppercase", letterSpacing: ".07em" }}>🖼️ Imaging Findings</div>
          <textarea value={imagingText} onChange={e => setImagingText(e.target.value)}
            placeholder={"Paste or type imaging findings here...\ne.g.\nCXR: bilateral infiltrates, no pneumothorax\nCT Head: no acute intracranial process\nCT Chest: saddle PE, RV:LV ratio 1.3"}
            rows={6} style={{ width: "100%", background: T.up, border: `1px solid ${T.b}`, borderRadius: 8, padding: "10px 12px", color: T.txt, fontSize: 12, fontFamily: "monospace", resize: "vertical", lineHeight: 1.7 }} />
        </div>
        <button onClick={interpret} disabled={loading || (!labText.trim() && !imagingText.trim())} style={{
          padding: "12px", borderRadius: 10, border: "none", cursor: loading ? "not-allowed" : "pointer",
          background: loading ? T.up : `linear-gradient(135deg,${T.teal},${T.blue})`,
          color: loading ? T.txt3 : "#050f1e", fontWeight: 700, fontSize: 14, fontFamily: "inherit", transition: "all .2s",
        }}>
          {loading ? "🤖 Interpreting…" : "🤖 Interpret with AI →"}
        </button>
      </div>

      <div style={{ background: T.card, borderRadius: 12, padding: 16, border: `1px solid ${T.b}`, overflowY: "auto" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.purple, marginBottom: 12, textTransform: "uppercase", letterSpacing: ".07em" }}>🤖 AI Clinical Interpretation</div>
        {!result && !loading && (
          <div style={{ textAlign: "center", padding: "40px 0", color: T.txt4 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🧬</div>
            <div style={{ fontSize: 13, color: T.txt3 }}>Enter lab values and/or imaging findings,<br />then click Interpret.</div>
          </div>
        )}
        {loading && (
          <div style={{ textAlign: "center", padding: "40px 0", color: T.txt3 }}>
            <div style={{ fontSize: 36, marginBottom: 12, animation: "spin 1s linear infinite", display: "inline-block" }}>⚙️</div>
            <div style={{ fontSize: 13 }}>Analyzing results…</div>
          </div>
        )}
        {result && (
          <div style={{ fontSize: 12.5, color: T.txt2, lineHeight: 1.75, whiteSpace: "pre-wrap" }}>
            {result.split(/\*\*(.*?)\*\*/g).map((part, i) =>
              i % 2 === 1
                ? <strong key={i} style={{ color: T.txt, fontWeight: 700 }}>{part}</strong>
                : <span key={i}>{part}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────
export default function LabsImaging() {
  const [activeTab, setActiveTab] = useState("labs");

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.txt, fontFamily: "'DM Sans',sans-serif", padding: "80px 24px 32px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        input,textarea,button { outline: none; }
        textarea { outline: none; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(0,212,255,0.12)", border: "1px solid rgba(0,212,255,0.35)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>🧪</div>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: T.txt, fontFamily: "'Playfair Display',serif", lineHeight: 1, margin: 0 }}>Labs & Imaging Interpreter</h1>
            <p style={{ fontSize: 12, color: T.txt3, margin: "4px 0 0" }}>Critical value reference · Imaging pattern recognition · AI-powered interpretation</p>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            {["CBC", "ABG", "Troponin", "CT PE", "CXR"].map(tag => (
              <span key={tag} style={{ fontSize: 10, padding: "3px 10px", borderRadius: 20, background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.3)", color: T.cyan, fontFamily: "monospace", fontWeight: 700 }}>{tag}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: `1px solid ${T.b}`, paddingBottom: 12 }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            display: "flex", alignItems: "center", gap: 8, padding: "8px 18px", borderRadius: 9,
            border: `1px solid ${activeTab === tab.id ? T.cyan : "transparent"}`,
            background: activeTab === tab.id ? "rgba(0,212,255,0.1)" : "transparent",
            color: activeTab === tab.id ? T.cyan : T.txt3,
            fontSize: 13, fontWeight: activeTab === tab.id ? 700 : 400,
            cursor: "pointer", fontFamily: "inherit", transition: "all .15s",
          }}>
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ height: "calc(100vh - 260px)" }}>
        {activeTab === "labs" && <LabsTab />}
        {activeTab === "imaging" && <ImagingTab />}
        {activeTab === "interpreter" && <AIInterpreterTab />}
      </div>
    </div>
  );
}