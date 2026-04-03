import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// ── Font + CSS Injection ─────────────────────────────────────────
(() => {
  if (document.getElementById("pocus-fonts")) return;
  const l = document.createElement("link"); l.id = "pocus-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "pocus-css";
  s.textContent = `
    *{box-sizing:border-box;margin:0;padding:0;}
    ::-webkit-scrollbar{width:3px;height:3px;}
    ::-webkit-scrollbar-track{background:transparent;}
    ::-webkit-scrollbar-thumb{background:rgba(42,79,122,0.5);border-radius:2px;}
    @keyframes fadeSlide{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
    @keyframes scanline{0%{transform:translateY(-100%)}100%{transform:translateY(100vh)}}
    @keyframes ultrasoundPulse{0%,100%{opacity:.4;transform:scale(1)}50%{opacity:1;transform:scale(1.04)}}
    .fade-in{animation:fadeSlide .22s ease forwards;}
    .shimmer-text{background:linear-gradient(90deg,#e8f0fe 0%,#fff 28%,#00d4ff 50%,#00e5c0 68%,#e8f0fe 100%);background-size:250% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 5s linear infinite;}
    .pocus-card{transition:border-color .15s,box-shadow .15s,transform .12s;}
    .pocus-card:hover{transform:translateY(-2px);}
    .finding-row:hover{background:rgba(22,45,79,0.4)!important;cursor:pointer;}
    textarea{font-family:'DM Sans',sans-serif;}
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

// ── Protocol Data ──────────────────────────────────────────────────
const PROTOCOLS = {
  rush: {
    id: "rush", label: "RUSH Exam", icon: "🚨", color: T.coral,
    subtitle: "Rapid Ultrasound in SHock — 5-window hemodynamic assessment",
    indication: "Undifferentiated shock · Hypotension · Altered perfusion",
    time: "2–5 minutes",
    windows: [
      {
        id: "pump", letter: "P", label: "Pump", sublabel: "Cardiac Function", icon: "❤️", color: T.red,
        probe: "Phased array cardiac probe", position: "Subxiphoid or parasternal",
        views: ["Subxiphoid 4-chamber (SX4C) — first in arrest, doesn't interrupt CPR", "Parasternal long axis (PLAX)", "Parasternal short axis (PSAX @ papillary level)", "Apical 4-chamber (A4C)"],
        findings: [
          { label: "Hyperdynamic LV", appearance: "Walls nearly touching ('kissing'), small cavity, vigorous contraction", interpretation: "Distributive / septic shock — high CO, low SVR", urgency: "moderate", color: T.orange },
          { label: "Severely Reduced EF", appearance: "Barely moving walls, dilated LV, mitral valve opens poorly", interpretation: "Cardiogenic shock — pump failure", urgency: "high", color: T.red },
          { label: "Pericardial Effusion", appearance: "Anechoic (black) rim encircling heart", interpretation: "Possible tamponade — correlate with RV diastolic collapse", urgency: "high", color: T.purple },
          { label: "Diastolic RV Collapse", appearance: "RV free wall buckles inward in diastole on 2D", interpretation: "CARDIAC TAMPONADE — pathognomonic finding", urgency: "critical", color: T.red },
          { label: "RV Dilation + McConnell Sign", appearance: "RV:LV > 0.9, free wall hypokinesis with preserved apex", interpretation: "Massive PE — McConnell sign highly specific (94%)", urgency: "critical", color: T.coral },
          { label: "Segmental Wall Motion Abnormality", appearance: "Regional hypokinesis/akinesis in coronary territory", interpretation: "Acute MI — STEMI equivalent", urgency: "critical", color: T.yellow },
        ],
        pearl: "In cardiac arrest: subxiphoid first — pulse check 10 sec max. Total cardiac standstill = PEA, poor prognosis. Pericardial vs pleural effusion: pericardial stays anterior to descending aorta.",
      },
      {
        id: "ivc", letter: "T", label: "Tank", sublabel: "IVC / Volume Status", icon: "💧", color: T.blue,
        probe: "Curvilinear or phased array", position: "Subcostal, hepatic vein junction",
        views: ["Subcostal long-axis IVC (measure 2 cm from RA junction)", "IVC short-axis (confirmatory)", "Hepatic vein Doppler for phasicity"],
        findings: [
          { label: "IVC < 2.1 cm + > 50% Collapse", appearance: "Flat, thin IVC that collapses completely with sniff/inspiration", interpretation: "CVP 0–5 mmHg → volume responsive — give fluids", urgency: "normal", color: T.green },
          { label: "IVC 2.1–2.5 cm + 25–50% Collapse", appearance: "Moderate IVC, partial inspiratory collapse", interpretation: "CVP 5–10 mmHg → indeterminate — dynamic measures needed", urgency: "moderate", color: T.yellow },
          { label: "IVC > 2.5 cm + < 25% Collapse", appearance: "Plethoric, non-collapsing IVC — no respiratory variation", interpretation: "CVP ≥ 15 → volume overloaded, RHF, tamponade, or tension PTX", urgency: "high", color: T.red },
        ],
        pearl: "IVC collapsibility predicts fluid responsiveness in spontaneously breathing patients. In ventilated patients: distensibility index (>12% with tidal volume) is preferred. IVC alone is insufficient — always combine with clinical context.",
      },
      {
        id: "aorta", letter: "Pi", label: "Pipes", sublabel: "Aorta + DVT", icon: "🔴", color: T.orange,
        probe: "Curvilinear (aorta) / Linear (DVT)", position: "Epigastric + bilateral groin/popliteal",
        views: ["Epigastric long-axis (aorta)", "Epigastric transverse (aorta + SMA)", "Femoral vein compression (bilateral)", "Popliteal vein compression (bilateral)"],
        findings: [
          { label: "AAA > 3 cm (> 5.5 cm = rupture risk)", appearance: "Dilated aorta outer-to-outer > 3 cm; retroperitoneal hematoma = rupture", interpretation: "Abdominal aortic aneurysm — rupture is surgical emergency", urgency: "critical", color: T.red },
          { label: "Intimal Flap in Aortic Lumen", appearance: "Linear echogenic mobile structure within aortic lumen", interpretation: "Aortic dissection — confirm with CT", urgency: "critical", color: T.purple },
          { label: "Non-Compressible Femoral/Popliteal Vein", appearance: "Vein does not flatten completely with gentle probe compression", interpretation: "DVT → source of PE; normal vein fully collapses", urgency: "high", color: T.coral },
        ],
        pearl: "Measure aorta outer-to-outer in transverse view. Compress femoral vein at the sapheno-femoral junction and popliteal fossa. Normal vein collapses completely — incompressibility = DVT until proven otherwise.",
      },
      {
        id: "peritoneal", letter: "Pe", label: "Peritoneal", sublabel: "Free Fluid (FAST)", icon: "🩸", color: T.yellow,
        probe: "Curvilinear", position: "RUQ, LUQ, pelvic, subxiphoid",
        views: ["RUQ Morrison's pouch (hepatorenal)", "LUQ splenorenal recess", "Pelvic — posterior to bladder (Pouch of Douglas)", "Subxiphoid — pericardial space (eFAST)"],
        findings: [
          { label: "Free Fluid in Morrison's Pouch", appearance: "Anechoic stripe between liver and right kidney", interpretation: "Hemoperitoneum — most commonly from liver laceration in trauma", urgency: "critical", color: T.red },
          { label: "LUQ Splenorenal Free Fluid", appearance: "Anechoic fluid in splenorenal recess or perisplenic", interpretation: "Splenic laceration / free blood — LUQ often more sensitive than RUQ", urgency: "critical", color: T.red },
          { label: "Pelvic Free Fluid", appearance: "Anechoic crescent posterior to bladder in the cul-de-sac", interpretation: "Most sensitive location for small volumes — gravity-dependent pooling", urgency: "high", color: T.orange },
          { label: "Pericardial Effusion (eFAST)", appearance: "Anechoic ring anterior to pericardium in subxiphoid view", interpretation: "Traumatic hemopericardium — tamponade pending", urgency: "critical", color: T.purple },
        ],
        pearl: "Positive FAST in hemodynamically unstable trauma → operative abdomen. Do NOT send unstable patients to CT. Negative FAST does not exclude injury — 20–30% of solid organ injuries have no free fluid initially.",
      },
      {
        id: "lung", letter: "A", label: "Air", sublabel: "Lung / Pleural", icon: "💨", color: T.teal,
        probe: "Linear (PTX) or curvilinear (B-lines/effusion)", position: "Anterior and lateral chest wall",
        views: ["Anterior 2nd ICS MCL bilateral (PTX detection)", "Lower anterior zones (B-line pattern)", "Lateral posterior zones (pleural effusion)", "Lung-liver interface (diaphragm level)"],
        findings: [
          { label: "Lung Sliding Present", appearance: "Shimmering movement at pleural line — 'seashore sign' on M-mode", interpretation: "PTX EXCLUDED at this probe location (sensitivity 99%)", urgency: "normal", color: T.green },
          { label: "Absent Lung Sliding + Barcode Sign", appearance: "No shimmer at pleural line — stratosphere (barcode) on M-mode", interpretation: "Pneumothorax at probe location until proven otherwise", urgency: "critical", color: T.red },
          { label: "Lung Point", appearance: "Transition between sliding and non-sliding at PTX margin — pathognomonic", interpretation: "100% specific for pneumothorax — confirms diagnosis", urgency: "critical", color: T.red },
          { label: "B-Lines (≥ 3 per field)", appearance: "Vertical hyperechoic 'laser-like' lines from pleural surface to bottom of screen", interpretation: "Pulmonary interstitial edema — cardiogenic pulmonary edema or ARDS", urgency: "high", color: T.orange },
          { label: "Anechoic Pleural Collection", appearance: "Black space above diaphragm; compressible lung floating within fluid", interpretation: "Pleural effusion — hemothorax (trauma) or medical cause", urgency: "moderate", color: T.blue },
        ],
        pearl: "Do NOT delay needle decompression for suspected tension PTX based on ultrasound! If clinical diagnosis is clear, treat first. Lung sliding alone rules out PTX with 99% sensitivity — rapid bilateral check takes < 60 seconds.",
      },
    ],
  },
  blue: {
    id: "blue", label: "BLUE Protocol", icon: "🫁", color: T.blue,
    subtitle: "Bedside Lung Ultrasound in Emergency — acute dyspnea diagnosis",
    indication: "Acute dyspnea · Respiratory failure · Hypoxia of unknown etiology",
    time: "3–5 minutes",
    profiles: [
      {
        label: "A-Profile (bilateral A-lines, normal lung sliding)", color: T.green,
        diagnosis: "Pulmonary embolism or asthma/COPD (if DVT positive → PE likely)",
        pattern: "Bilateral A-lines + lung sliding present → normal lung parenchyma",
        nextStep: "Evaluate for PE: DVT screening, D-dimer, CT-PA if stable. Or consider COPD/asthma if wheezing present.",
        ddx: ["Massive PE", "Asthma exacerbation", "COPD exacerbation", "Pneumothorax (A-profile + absent sliding)"],
      },
      {
        label: "B-Profile (bilateral B-lines anteriorly)", color: T.orange,
        diagnosis: "Cardiogenic pulmonary edema (sensitivity 97%, specificity 95%)",
        pattern: "≥ 3 B-lines per zone in 2+ bilateral anterior zones",
        nextStep: "Diuresis, nitroglycerin, CPAP/BiPAP. Echo to assess LV function and filling pressures.",
        ddx: ["Acute decompensated heart failure", "ARDS (B + absence of normal areas)", "Acute interstitial pneumonia"],
      },
      {
        label: "B'-Profile (B-lines with absent lung sliding)", color: T.purple,
        diagnosis: "Pneumonia (B-lines without sliding = consolidation with air bronchograms)",
        pattern: "B-lines + absent or reduced lung sliding + possible consolidation",
        nextStep: "Antibiotics, further characterization with CT if needed. Check for pleural effusion (parapneumonic).",
        ddx: ["Community-acquired pneumonia", "Hospital-acquired pneumonia", "Pulmonary contusion"],
      },
      {
        label: "A'-Profile (A-lines + absent lung sliding)", color: T.red,
        diagnosis: "Pneumothorax — confirm with lung point",
        pattern: "A-lines WITHOUT lung sliding — look for lung point to confirm",
        nextStep: "If hemodynamically unstable → needle decompression. If stable → chest tube or aspiration.",
        ddx: ["Tension pneumothorax", "Simple pneumothorax", "Main-stem intubation (unilateral)"],
      },
      {
        label: "C-Profile (anterior consolidation)", color: T.yellow,
        diagnosis: "Consolidation (pneumonia, atelectasis, or lung contusion)",
        pattern: "Tissue-like pattern anteriorly — 'hepatization' of lung (looks like liver)",
        nextStep: "Differentiate pneumonia (air bronchograms) from atelectasis (fluid bronchograms) from contusion.",
        ddx: ["Pneumonia", "Lung contusion", "Lobar atelectasis", "Lung tumor (rare)"],
      },
      {
        label: "PLAPS (postero-lateral alveolar/pleural syndrome)", color: T.teal,
        diagnosis: "Pleural effusion ± consolidation in posterior-lateral zones",
        pattern: "Posterior probe position: anechoic fluid above diaphragm with floating lung",
        nextStep: "Quantify effusion (depth × width at mid-exhalation), therapeutic thoracentesis if > 1 cm depth.",
        ddx: ["Pleural effusion (transudative or exudative)", "Hemothorax", "Empyema", "Mesothelioma"],
      },
    ],
  },
  efast: {
    id: "efast", label: "eFAST", icon: "🩺", color: T.yellow,
    subtitle: "Extended Focused Assessment with Sonography in Trauma",
    indication: "Trauma · Multi-system injury · Hemodynamic instability post-injury",
    time: "2–3 minutes",
    sequence: [
      { step: 1, region: "Subxiphoid", goal: "Pericardial effusion / cardiac activity", probe: "Curvilinear or phased array", findingPositive: "Anechoic fluid anterior to heart — tamponade if RV collapse present", findingNegative: "No fluid stripe, normal cardiac motion" },
      { step: 2, region: "RUQ (Morrison's Pouch)", goal: "Hepatorenal free fluid", probe: "Curvilinear", findingPositive: "Anechoic stripe between liver and right kidney — ANY amount is significant in trauma", findingNegative: "Liver and kidney margins directly touching" },
      { step: 3, region: "LUQ (Splenorenal)", goal: "Splenorenal / subdiaphragmatic free fluid", probe: "Curvilinear", findingPositive: "Anechoic fluid adjacent to spleen or between spleen and diaphragm", findingNegative: "Spleen and kidney directly adjacent — no fluid stripe" },
      { step: 4, region: "Pelvis (Suprapubic)", goal: "Pelvic free fluid (Pouch of Douglas / rectovesical)", probe: "Curvilinear", findingPositive: "Anechoic fluid posterior/superior to bladder — most dependent zone", findingNegative: "Bladder uniformly bordered by tissue — no anechoic collections" },
      { step: 5, region: "Right Anterior Chest (2nd ICS MCL)", goal: "Right pneumothorax", probe: "Linear high-frequency", findingPositive: "Absent lung sliding ± barcode sign on M-mode", findingNegative: "Seashore sign on M-mode — lung sliding present" },
      { step: 6, region: "Left Anterior Chest (2nd ICS MCL)", goal: "Left pneumothorax", probe: "Linear high-frequency", findingPositive: "Absent lung sliding ± barcode sign on M-mode", findingNegative: "Seashore sign on M-mode — lung sliding present" },
    ],
    pearls: [
      "A positive eFAST in hemodynamically unstable trauma = operative abdomen — do NOT CT scan first.",
      "A negative eFAST does not exclude injury — solid organ injuries may not have free fluid initially.",
      "Sensitivity of FAST for hemoperitoneum is ~85–96% but drops in small injuries or retroperitoneal bleeding.",
      "In pediatric trauma: even small amounts of free fluid (1–2 mm) are significant — lower threshold.",
      "Pericardial vs pleural effusion: pericardial fluid stays anterior to the descending thoracic aorta.",
      "Check all 6 windows — a negative RUQ does not exclude LUQ or pelvic injury.",
    ],
  },
};

// ── Finding Image Representations (SVG-based) ─────────────────────
const ANNOTATED_FINDINGS = [
  {
    id: "pericardial_effusion",
    title: "Pericardial Effusion",
    protocol: "RUSH / eFAST",
    probe: "Phased array — subxiphoid or PLAX",
    color: T.purple,
    urgency: "critical",
    description: "Anechoic (black) fluid surrounding the heart within the pericardial sac.",
    key_features: [
      "Anechoic (echo-free / black) rim encircling the myocardium",
      "Best seen in PLAX view — posterior to LV and anterior to posterior pericardium",
      "Circumferential is more concerning than focal",
      "Diastolic RV free wall collapse = tamponade physiology",
      "Electrical alternans on ECG: QRS axis alternates with each beat",
      "IVC plethoric (non-collapsing) in tamponade",
    ],
    pitfalls: [
      "Pericardial fat pad: echogenic, anterior — does NOT move with heart",
      "Pleural effusion: extends posterior to the descending thoracic aorta (PLAX view)",
      "Epicardial fat: echogenic band directly on myocardium — not anechoic",
    ],
    grading: [
      { grade: "Small", size: "< 1 cm at end-diastole in PLAX", significance: "Usually benign — monitor" },
      { grade: "Moderate", size: "1–2 cm", significance: "May be hemodynamically significant" },
      { grade: "Large", size: "> 2 cm", significance: "High tamponade risk — assess RV collapse" },
    ],
    svg_description: "In the PLAX view: anechoic black stripe posterior to LV between myocardium and pericardium. In subxiphoid: 360° black halo around heart chambers.",
  },
  {
    id: "sliding_lung",
    title: "Lung Sliding (Present vs. Absent)",
    protocol: "RUSH / BLUE / eFAST",
    probe: "Linear 7–14 MHz — anterior chest 2nd ICS MCL",
    color: T.teal,
    urgency: "normal",
    description: "Lung sliding = normal visceral-parietal pleural movement with respiration. ABSENCE = pneumothorax until proven otherwise.",
    key_features: [
      "NORMAL: Shimmering 'ants marching' at pleural line with each breath",
      "ABSENT: Stationary horizontal echoes (A-lines) — no movement",
      "M-mode NORMAL: 'Seashore sign' — granular below pleural line, horizontal above",
      "M-mode ABSENT: 'Barcode sign' / 'stratosphere sign' — all horizontal lines",
      "Lung point: transition between sliding and non-sliding — 100% specific for PTX",
      "A-lines present in BOTH normal and PTX — do not use A-lines alone to diagnose PTX",
    ],
    pitfalls: [
      "Mainstem intubation: absent sliding on left side only — check tube position",
      "Pleurodesis or pleural adhesions: absent sliding without PTX",
      "Cardiac motion can mimic lung sliding — evaluate with M-mode",
      "In patients holding breath, normal sliding disappears temporarily",
    ],
    grading: [
      { grade: "Present", size: "Normal respiratory phasicity", significance: "PTX excluded at this location" },
      { grade: "Absent (no lung point)", size: "No sliding at one location", significance: "PTX likely — perform bilateral comparison" },
      { grade: "Lung Point Present", size: "Transition point identified", significance: "100% specific for PTX — diagnostic" },
    ],
    svg_description: "Linear probe on anterior chest. Hyperechoic pleural line at ~2 cm depth. Above = ribs casting acoustic shadows ('bat sign'). Below = lung parenchyma. Sliding = shimmering at pleural interface.",
  },
  {
    id: "free_fluid",
    title: "Intraperitoneal Free Fluid",
    protocol: "eFAST / RUSH Peritoneal",
    probe: "Curvilinear 2–5 MHz — RUQ, LUQ, pelvic",
    color: T.orange,
    urgency: "critical",
    description: "Anechoic fluid accumulating in dependent peritoneal spaces — in trauma, blood until proven otherwise.",
    key_features: [
      "RUQ: Anechoic stripe between right lobe of liver and right kidney (Morrison's pouch)",
      "LUQ: Fluid between spleen and left kidney or adjacent to spleen superiorly",
      "Pelvis: Posterior to full bladder — most sensitive location for small volumes",
      "Fluid conforms to organ contours — tracks dependent spaces",
      "Hemoperitoneum may contain internal echoes or clot (hyperechoic foci)",
      "ANY free fluid in RUQ in trauma is significant — quantify depth",
    ],
    pitfalls: [
      "Perinephric fat: echogenic, does NOT layer with gravity changes",
      "Ascites vs. hemoperitoneum: ascites is anechoic and chronic; acute hemoperitoneum may have clot",
      "Full bladder: may mimic pelvic free fluid — scan bladder in long and short axis",
      "Post-partum uterus: may appear as fluid — correlate clinically",
    ],
    grading: [
      { grade: "Trace", size: "< 1 cm stripe in Morrison's pouch", significance: "Still significant in trauma — may represent > 300 mL" },
      { grade: "Moderate", size: "1–3 cm", significance: "Significant hemoperitoneum — likely > 500 mL" },
      { grade: "Large", size: "> 3 cm or multiple spaces", significance: "Massive hemoperitoneum — immediate surgical consult" },
    ],
    svg_description: "RUQ view: liver (grey) with kidney (grey) below. Normal = direct contact. Positive = anechoic (black) stripe between them in Morrison's pouch.",
  },
  {
    id: "b_lines",
    title: "B-Lines (Comet Tails)",
    protocol: "BLUE Protocol",
    probe: "Curvilinear or phased array — anterior chest zones",
    color: T.blue,
    urgency: "high",
    description: "Vertical hyperechoic reverberation artifacts arising from the pleural line — indicate interstitial lung water.",
    key_features: [
      "Arise from pleural line and extend to bottom of screen without fading",
      "MOVE WITH LUNG SLIDING — distinguishes from other artifacts",
      "≥ 3 B-lines per intercostal space = pathological (B-profile)",
      "Bilateral anterior B-lines = cardiogenic pulmonary edema until proven otherwise",
      "Unilateral B-lines = pneumonia, contusion, or localized edema",
      "Responds to diuresis — useful for real-time treatment monitoring",
    ],
    pitfalls: [
      "1–2 B-lines per zone may be normal, especially at lung bases",
      "B-lines without lung sliding (B'-profile) = pneumonia, not CHF",
      "Pulmonary fibrosis: irregular pleural line + B-lines in specific zones",
      "CT-pattern correlation: B-lines correspond to ground-glass opacities / Kerley B lines",
    ],
    grading: [
      { grade: "0–2 B-lines per zone", size: "Normal / physiologic", significance: "No interstitial edema" },
      { grade: "3–5 B-lines per zone", size: "Moderate interstitial syndrome", significance: "CHF, early ARDS, pneumonia" },
      { grade: "> 5 B-lines or confluent", size: "Severe interstitial syndrome ('white lung')", significance: "Severe pulmonary edema / ARDS" },
    ],
    svg_description: "Phased array on anterior chest. Hyperechoic pleural line. Vertical hyperechoic 'laser beams' from pleural line extending to bottom — these are B-lines.",
  },
  {
    id: "ivc_assessment",
    title: "IVC Volume Assessment",
    protocol: "RUSH Tank Window",
    probe: "Curvilinear or phased array — subcostal long-axis",
    color: T.cyan,
    urgency: "moderate",
    description: "IVC diameter and collapsibility predicts central venous pressure and fluid responsiveness.",
    key_features: [
      "Measure IVC 2 cm from right atrium junction (hepatic veins enter here)",
      "Measure at end-expiration in spontaneously breathing patients",
      "Collapsibility index = (max diameter − min diameter) / max diameter × 100",
      "Normal IVC: 1.5–2.5 cm with respiratory variation",
      "Sniff test: patient sniffs briefly — normal = > 50% collapse",
      "In ventilated patients: distensibility index > 12% with tidal volume = fluid responsive",
    ],
    pitfalls: [
      "Measuring too far from RA junction underestimates diameter",
      "Confusing hepatic vein with IVC in transverse view",
      "IVC size alone is a poor predictor in isolation — combine with clinical assessment",
      "Tricuspid regurgitation: dilated IVC even in euvolemic patients",
    ],
    grading: [
      { grade: "Small (< 2.1 cm) + > 50% collapse", size: "CVP 0–5 mmHg", significance: "Volume responsive — give fluids" },
      { grade: "Moderate (2.1–2.5 cm) + 25–50% collapse", size: "CVP 5–10 mmHg", significance: "Indeterminate — use dynamic measures" },
      { grade: "Large (> 2.5 cm) + < 25% collapse", size: "CVP ≥ 15 mmHg", significance: "Volume overloaded — tamponade, RHF, or tension PTX" },
    ],
    svg_description: "Subcostal long-axis: liver (grey) on left, IVC coursing through liver to RA on right. Measure maximal diameter in expiration at 2 cm from RA junction.",
  },
  {
    id: "rv_dilation",
    title: "RV Dilation + McConnell Sign",
    protocol: "RUSH Pump Window",
    probe: "Phased array — apical 4-chamber, PLAX, PSAX",
    color: T.purple,
    urgency: "critical",
    description: "Acute RV pressure overload from massive PE causes RV dilation and a characteristic wall motion pattern.",
    key_features: [
      "RV:LV ratio > 0.9 in A4C view = significant RV dilation",
      "McConnell Sign: RV free wall akinesis WITH preserved or hyperkinetic apex",
      "Specificity of McConnell for PE: 94% — most specific echocardiographic finding",
      "D-sign (PSAX): interventricular septum flattens or bows into LV ('D-shaped LV')",
      "Tricuspid regurgitation jet: estimate RVSP via CW Doppler (TR + CVP)",
      "Clot-in-transit: rare — highly mobile echogenic mass in RA/RV",
    ],
    pitfalls: [
      "RV dilation is not specific for PE — can occur in RV MI, acute cor pulmonale from any cause",
      "McConnell sign: may also be seen in RV infarction — check ECG for inferior/posterior ST changes",
      "Chronic PE: RV hypertrophy (>5 mm free wall) suggests chronic process, not acute",
      "Apical 4-chamber foreshortening can underestimate RV size",
    ],
    grading: [
      { grade: "Mild RV Dilation", size: "RV:LV 0.6–0.9", significance: "Possible PE or increased RV afterload" },
      { grade: "Severe RV Dilation + McConnell", size: "RV:LV > 0.9 + pattern", significance: "Massive PE until proven otherwise — consider thrombolytics" },
      { grade: "D-sign (PSAX)", size: "Flattened/reversed IVS", significance: "RV pressure overload — PE, severe pulmonary hypertension" },
    ],
    svg_description: "Apical 4-chamber: RV (right side) larger than LV (left side). RV:LV > 0.9. McConnell: RV free wall flat, apex preserved/hyperdynamic.",
  },
];

// ── Documentation Template ────────────────────────────────────────
const DOC_TEMPLATE = {
  sections: [
    { id: "indication", label: "Indication", placeholder: "Reason for POCUS (e.g., undifferentiated shock, trauma evaluation, acute dyspnea, dyspnea + hypotension, pre-procedure guidance)" },
    { id: "protocol", label: "Protocol", placeholder: "Protocol used (e.g., RUSH, eFAST, BLUE, targeted cardiac, single-window)" },
    { id: "probe", label: "Probe / Frequency", placeholder: "Probe type and frequency (e.g., phased array cardiac probe 2–5 MHz, curvilinear 3–5 MHz, linear 10–14 MHz)" },
    { id: "operator", label: "Operator / Certification", placeholder: "Provider performing exam + POCUS credentialing level (e.g., EM attending, ABEM POCUS certified)" },
    { id: "cardiac", label: "Cardiac (Pump)", placeholder: "Views obtained: subxiphoid 4-chamber, PLAX, PSAX, A4C\n\nFindings:\n- LV function: [ ] Hyperdynamic [ ] Normal [ ] Mildly reduced [ ] Severely reduced\n- Estimated EF: ___\n- Pericardial effusion: [ ] Absent [ ] Trace [ ] Small [ ] Moderate [ ] Large\n- RV size: [ ] Normal [ ] Mildly dilated [ ] Severely dilated\n- McConnell sign: [ ] Present [ ] Absent\n- Wall motion: [ ] Normal [ ] RWMA (territory: ___)" },
    { id: "ivc", label: "IVC / Volume (Tank)", placeholder: "IVC diameter (expiration): ___ cm\nIVC collapsibility: ___% \nEstimated CVP: [ ] Low (< 5) [ ] Normal (5–10) [ ] Elevated (> 10)\nFluid responsiveness assessment: [ ] Likely responsive [ ] Indeterminate [ ] Not responsive" },
    { id: "aorta", label: "Aorta / DVT (Pipes)", placeholder: "Abdominal aorta: Diameter ___ cm at infrarenal level\nAAA: [ ] None [ ] Present — size ___ cm\nBilateral femoral vein compression: [ ] Compressible (normal) [ ] Non-compressible RIGHT [ ] Non-compressible LEFT\nPopliteal vein (if performed): [ ] Compressible [ ] Non-compressible R [ ] Non-compressible L" },
    { id: "peritoneal", label: "Peritoneal / FAST", placeholder: "[ ] Subxiphoid: [ ] No effusion [ ] Pericardial effusion ___\n[ ] RUQ Morrison's pouch: [ ] Negative [ ] Free fluid ___\n[ ] LUQ splenorenal: [ ] Negative [ ] Free fluid ___\n[ ] Pelvis: [ ] Negative [ ] Free fluid ___ cm depth\nOverall FAST: [ ] NEGATIVE [ ] POSITIVE (location: ___)" },
    { id: "lung", label: "Lung / Pleural (Air)", placeholder: "Right anterior (2nd ICS MCL): [ ] Sliding present [ ] Absent — lung point: [ ] Present [ ] Not identified\nLeft anterior (2nd ICS MCL): [ ] Sliding present [ ] Absent — lung point: [ ] Present [ ] Not identified\nB-lines: [ ] Absent [ ] Unilateral (___) [ ] Bilateral (B-profile = pulmonary edema)\nPleural effusion: [ ] None [ ] Right ___ cm depth [ ] Left ___ cm depth\nConsolidation: [ ] None [ ] Present (location: ___)" },
    { id: "limitations", label: "Technical Limitations", placeholder: "Document any factors limiting image quality (e.g., patient habitus, subcutaneous air, recent surgery, dressings, uncooperative patient, poor acoustic windows)" },
    { id: "interpretation", label: "Interpretation / Impression", placeholder: "Primary findings and clinical interpretation:\n1.\n2.\n3.\n\nCorrelation with clinical presentation: [ ] Concordant [ ] Discordant (explain)\nFinal assessment: [ ] RUSH — most likely shock type: ___\n[ ] eFAST — positive/negative for each zone\n[ ] BLUE — profile: ___ → most likely diagnosis: ___" },
    { id: "plan", label: "Clinical Impact / Plan", placeholder: "How POCUS findings changed management:\n- [ ] Confirmed working diagnosis\n- [ ] Changed diagnosis to ___\n- [ ] Guided fluid resuscitation decision\n- [ ] Expedited operative intervention\n- [ ] Changed vasopressor selection\n- [ ] Guided procedural planning\n\nActions taken based on POCUS:\n1.\n2." },
  ],
};

// ── Helpers ────────────────────────────────────────────────────────
function BulletRow({ text, color }) {
  return (
    <div style={{ display:"flex", gap:7, alignItems:"flex-start", marginBottom:5 }}>
      <span style={{ color:color||T.teal, fontSize:8, marginTop:3, flexShrink:0 }}>▸</span>
      <span style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt2, lineHeight:1.5 }}>{text}</span>
    </div>
  );
}

function UrgencyBadge({ urgency }) {
  const map = { critical:{color:T.red,label:"CRITICAL"}, high:{color:T.coral,label:"HIGH"}, moderate:{color:T.yellow,label:"MOD"}, normal:{color:T.green,label:"NORMAL"} };
  const m = map[urgency] || map.normal;
  return (
    <span style={{ fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700, padding:"2px 7px", borderRadius:4, background:`${m.color}18`, border:`1px solid ${m.color}44`, color:m.color, textTransform:"uppercase", letterSpacing:0.8 }}>
      {m.label}
    </span>
  );
}

// ── Main Component ─────────────────────────────────────────────────
export default function POCUSHub() {
  const navigate = useNavigate();
  const [tab,           setTab]          = useState("rush");
  const [rushWindow,    setRushWindow]   = useState("pump");
  const [blueProfile,   setBlueProfile]  = useState(0);
  const [efastStep,     setEfastStep]    = useState(null);
  const [findingId,     setFindingId]    = useState("pericardial_effusion");
  const [docValues,     setDocValues]    = useState({});
  const [copied,        setCopied]       = useState(false);

  const setDoc = useCallback((id, val) => {
    setDocValues(prev => ({ ...prev, [id]: val }));
  }, []);

  const generateNote = () => {
    const lines = DOC_TEMPLATE.sections
      .filter(s => docValues[s.id])
      .map(s => `${s.label.toUpperCase()}:\n${docValues[s.id]}\n`);
    return `POINT-OF-CARE ULTRASOUND (POCUS) NOTE\nDate: ${new Date().toLocaleDateString()}\n\n${lines.join("\n")}`;
  };

  const copyNote = () => {
    navigator.clipboard.writeText(generateNote()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const activeProto = PROTOCOLS[tab === "rush" ? "rush" : tab === "blue" ? "blue" : tab === "efast" ? "efast" : null];
  const activeRushWindow = activeProto?.windows?.find(w => w.id === rushWindow);
  const activeFinding = ANNOTATED_FINDINGS.find(f => f.id === findingId);

  return (
    <div style={{ fontFamily:"DM Sans, sans-serif", background:T.bg, minHeight:"100vh", position:"relative", overflow:"hidden", color:T.txt }}>
      {/* Ambient */}
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0 }}>
        <div style={{ position:"absolute", top:"-12%", left:"-8%", width:"50%", height:"50%", background:"radial-gradient(circle,rgba(0,212,255,0.08) 0%,transparent 70%)" }}/>
        <div style={{ position:"absolute", bottom:"-10%", right:"-5%", width:"46%", height:"46%", background:"radial-gradient(circle,rgba(0,229,192,0.06) 0%,transparent 70%)" }}/>
      </div>

      <div style={{ position:"relative", zIndex:1, maxWidth:1440, margin:"0 auto", padding:"0 20px" }}>

        {/* Header */}
        <div style={{ padding:"18px 0 14px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
            <div style={{ backdropFilter:"blur(40px)", WebkitBackdropFilter:"blur(40px)", background:"rgba(5,15,30,0.9)", border:"1px solid rgba(42,79,122,0.6)", borderRadius:10, padding:"5px 12px", display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontFamily:"JetBrains Mono", fontSize:10, color:T.teal, letterSpacing:3 }}>NOTRYA</span>
              <span style={{ color:T.txt4, fontFamily:"JetBrains Mono", fontSize:10 }}>/</span>
              <span style={{ fontFamily:"JetBrains Mono", fontSize:10, color:T.txt3, letterSpacing:2 }}>POCUS HUB</span>
            </div>
            <div style={{ height:1, flex:1, background:"linear-gradient(90deg,rgba(42,79,122,0.6),transparent)" }}/>
            <button onClick={() => navigate("/hub")} style={{ padding:"5px 14px", borderRadius:8, background:"rgba(14,37,68,0.6)", border:"1px solid rgba(42,79,122,0.4)", color:T.txt2, fontFamily:"DM Sans", fontSize:12, fontWeight:600, cursor:"pointer" }}>
              ← Hub
            </button>
          </div>
          <h1 className="shimmer-text" style={{ fontFamily:"Playfair Display", fontSize:"clamp(24px,4vw,40px)", fontWeight:900, letterSpacing:-1, lineHeight:1.1 }}>POCUS Hub</h1>
          <p style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt3, marginTop:4 }}>
            RUSH · BLUE · eFAST protocols · Annotated image reference guides · POCUS documentation template
          </p>
        </div>

        {/* Stat banner */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:10, marginBottom:16 }}>
          {[
            { label:"RUSH Exam",    value:"5 Windows",  sub:"Pump·Tank·Pipes·Peri·Air", color:T.coral  },
            { label:"BLUE Protocol",value:"6 Profiles", sub:"Acute dyspnea dx algorithm", color:T.blue  },
            { label:"eFAST",        value:"6 Zones",    sub:"Trauma hemostatic assessment", color:T.yellow },
            { label:"Findings DB",  value:"6 Entities", sub:"Annotated reference guide", color:T.teal   },
            { label:"Doc Template", value:"12 Fields",  sub:"Chart-ready POCUS note", color:T.purple  },
          ].map((b,i) => (
            <div key={i} style={{ ...glass, padding:"9px 13px", borderLeft:`3px solid ${b.color}`, background:`linear-gradient(135deg,${b.color}12,rgba(8,22,40,0.8))`, borderRadius:10 }}>
              <div style={{ fontFamily:"JetBrains Mono", fontSize:16, fontWeight:700, color:b.color, lineHeight:1 }}>{b.value}</div>
              <div style={{ fontFamily:"DM Sans", fontWeight:600, color:T.txt, fontSize:10, margin:"3px 0" }}>{b.label}</div>
              <div style={{ fontFamily:"DM Sans", fontSize:10, color:T.txt4 }}>{b.sub}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ ...glass, padding:"6px", display:"flex", gap:5, marginBottom:16, flexWrap:"wrap" }}>
          {[
            { id:"rush",     label:"RUSH Exam",        icon:"🚨" },
            { id:"blue",     label:"BLUE Protocol",    icon:"🫁" },
            { id:"efast",    label:"eFAST",            icon:"🩺" },
            { id:"findings", label:"Image Reference",  icon:"🖼️" },
            { id:"doc",      label:"POCUS Note",       icon:"📋" },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ flex:"1 1 auto", fontFamily:"DM Sans", fontWeight:600, fontSize:12, padding:"9px 8px", borderRadius:10,
                border:`1px solid ${tab===t.id?"rgba(0,212,255,0.5)":"transparent"}`,
                background:tab===t.id?"linear-gradient(135deg,rgba(0,212,255,0.12),rgba(8,22,40,0.9))":"transparent",
                color:tab===t.id?T.cyan:T.txt3, cursor:"pointer", textAlign:"center", transition:"all .15s", whiteSpace:"nowrap" }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ══ RUSH ══════════════════════════════════════════════ */}
        {tab === "rush" && (
          <div className="fade-in">
            <div style={{ ...glass, padding:"12px 16px", marginBottom:14, borderLeft:`4px solid ${T.coral}`, background:"linear-gradient(135deg,rgba(255,107,107,0.07),rgba(8,22,40,0.88))" }}>
              <div style={{ display:"flex", gap:14, flexWrap:"wrap", alignItems:"center" }}>
                <div>
                  <div style={{ fontFamily:"Playfair Display", fontSize:18, fontWeight:700, color:T.coral }}>RUSH Exam</div>
                  <div style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt3, marginTop:2 }}>Rapid Ultrasound in SHock · {PROTOCOLS.rush.indication}</div>
                </div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginLeft:"auto" }}>
                  {[{ label:"Time", val:"2–5 min" },{ label:"Indication", val:"Undifferentiated shock" }].map((s,i) => (
                    <div key={i} style={{ padding:"5px 12px", background:"rgba(14,37,68,0.6)", border:"1px solid rgba(42,79,122,0.3)", borderRadius:8, fontFamily:"DM Sans", fontSize:11, color:T.txt3 }}>
                      <span style={{ color:T.txt4 }}>{s.label}: </span><span style={{ color:T.txt, fontWeight:600 }}>{s.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Window tabs */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:8, marginBottom:14 }}>
              {PROTOCOLS.rush.windows.map(w => (
                <button key={w.id} onClick={() => setRushWindow(w.id)}
                  style={{ ...glass, padding:"12px 8px", border:`2px solid ${rushWindow===w.id?w.color+"88":"rgba(42,79,122,0.35)"}`,
                    background:rushWindow===w.id?`linear-gradient(135deg,${w.color}18,rgba(8,22,40,0.88))`:"rgba(8,22,40,0.78)",
                    cursor:"pointer", borderRadius:12, textAlign:"center", transition:"all .15s" }}>
                  <div style={{ fontSize:20, marginBottom:4 }}>{w.icon}</div>
                  <div style={{ fontFamily:"JetBrains Mono", fontWeight:700, fontSize:13, color:rushWindow===w.id?w.color:T.txt }}>{w.letter}</div>
                  <div style={{ fontFamily:"DM Sans", fontSize:10, color:T.txt4, marginTop:2 }}>{w.label}</div>
                  <div style={{ fontFamily:"DM Sans", fontSize:10, color:T.txt4 }}>{w.sublabel}</div>
                </button>
              ))}
            </div>

            {activeRushWindow && (
              <div className="fade-in" key={activeRushWindow.id}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                  <div>
                    <div style={{ ...glass, padding:"16px 18px", marginBottom:12, borderTop:`3px solid ${activeRushWindow.color}`, background:`linear-gradient(135deg,${activeRushWindow.color}08,rgba(8,22,40,0.88))` }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                        <span style={{ fontSize:22 }}>{activeRushWindow.icon}</span>
                        <div>
                          <h3 style={{ fontFamily:"Playfair Display", fontSize:18, fontWeight:700, color:activeRushWindow.color, margin:0 }}>{activeRushWindow.label} — {activeRushWindow.sublabel}</h3>
                          <div style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.txt4, marginTop:2 }}>Probe: {activeRushWindow.probe} · Position: {activeRushWindow.position}</div>
                        </div>
                      </div>
                      <div style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.txt4, textTransform:"uppercase", letterSpacing:1.5, marginBottom:6 }}>Views to Obtain</div>
                      {activeRushWindow.views.map((v,i) => <BulletRow key={i} text={v} color={activeRushWindow.color}/>)}
                    </div>
                    <div style={{ ...glass, padding:"12px 16px", borderLeft:`3px solid ${T.yellow}` }}>
                      <div style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.yellow, textTransform:"uppercase", letterSpacing:1.5, marginBottom:6 }}>💎 Pearl</div>
                      <div style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt, lineHeight:1.7 }}>{activeRushWindow.pearl}</div>
                    </div>
                  </div>

                  <div style={{ ...glass, padding:"16px 18px" }}>
                    <div style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.txt4, textTransform:"uppercase", letterSpacing:1.5, marginBottom:12 }}>Findings & Interpretation</div>
                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      {activeRushWindow.findings.map((f,i) => (
                        <div key={i} className="finding-row" style={{ padding:"11px 13px", background:`${f.color}08`, border:`1px solid ${f.color}22`, borderRadius:10 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:5, gap:8 }}>
                            <div style={{ fontFamily:"DM Sans", fontWeight:700, fontSize:12, color:f.color }}>{f.label}</div>
                            <UrgencyBadge urgency={f.urgency}/>
                          </div>
                          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                            <div>
                              <div style={{ fontFamily:"JetBrains Mono", fontSize:8, color:T.txt4, textTransform:"uppercase", marginBottom:3 }}>What You See</div>
                              <div style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt2, lineHeight:1.5 }}>{f.appearance}</div>
                            </div>
                            <div>
                              <div style={{ fontFamily:"JetBrains Mono", fontSize:8, color:f.color, textTransform:"uppercase", marginBottom:3 }}>Interpretation</div>
                              <div style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt, lineHeight:1.5, fontWeight:500 }}>{f.interpretation}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ BLUE ══════════════════════════════════════════════ */}
        {tab === "blue" && (
          <div className="fade-in">
            <div style={{ ...glass, padding:"12px 16px", marginBottom:14, borderLeft:`4px solid ${T.blue}` }}>
              <div style={{ fontFamily:"Playfair Display", fontSize:18, fontWeight:700, color:T.blue }}>BLUE Protocol</div>
              <div style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt3, marginTop:2 }}>Bedside Lung Ultrasound in Emergency · {PROTOCOLS.blue.indication} · Time: {PROTOCOLS.blue.time}</div>
            </div>

            {/* Algorithm overview */}
            <div style={{ ...glass, padding:"14px 18px", marginBottom:14, background:"rgba(8,22,40,0.88)" }}>
              <div style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.txt4, textTransform:"uppercase", letterSpacing:2, marginBottom:10 }}>BLUE Protocol Decision Algorithm</div>
              <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:6 }}>
                {[
                  { step:"A-Profile\n(sliding present)", color:T.green, arrow:"→ DVT?" },
                  { step:"DVT positive", color:T.orange, arrow:"→ PE" },
                  { step:"DVT negative", color:T.green, arrow:"→ COPD/Asthma" },
                  { step:"B-Profile\n(bilateral B-lines)", color:T.orange, arrow:"→ CHF" },
                  { step:"A' Profile\n(no sliding)", color:T.red, arrow:"→ PTX" },
                  { step:"PLAPS\n(posterior effusion)", color:T.teal, arrow:"→ Pneumonia/Effusion" },
                ].map((s,i,arr) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", flexShrink:0 }}>
                    <div style={{ textAlign:"center", padding:"8px 10px", background:`${s.color}12`, border:`1px solid ${s.color}33`, borderRadius:8, minWidth:110 }}>
                      <div style={{ fontFamily:"DM Sans", fontWeight:700, fontSize:11, color:s.color, whiteSpace:"pre-line" }}>{s.step}</div>
                    </div>
                    {i < arr.length-1 && <div style={{ fontFamily:"JetBrains Mono", fontSize:10, color:T.txt4, margin:"0 4px", whiteSpace:"nowrap" }}>{s.arrow}</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* Profile selector */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:14 }}>
              {PROTOCOLS.blue.profiles.map((p,i) => (
                <button key={i} onClick={() => setBlueProfile(i)}
                  style={{ ...glass, padding:"10px 12px", border:`2px solid ${blueProfile===i?p.color+"88":"rgba(42,79,122,0.35)"}`,
                    background:blueProfile===i?`${p.color}15`:"rgba(8,22,40,0.78)",
                    cursor:"pointer", borderRadius:10, textAlign:"left", transition:"all .15s" }}>
                  <div style={{ fontFamily:"DM Sans", fontWeight:700, fontSize:11, color:blueProfile===i?p.color:T.txt2 }}>{p.label}</div>
                  <div style={{ fontFamily:"DM Sans", fontSize:10, color:T.txt4, marginTop:3 }}>{p.diagnosis.split("(")[0].trim()}</div>
                </button>
              ))}
            </div>

            {(() => {
              const p = PROTOCOLS.blue.profiles[blueProfile];
              return (
                <div className="fade-in" key={blueProfile} style={{ ...glass, padding:"18px 20px", borderTop:`3px solid ${p.color}`, background:`linear-gradient(135deg,${p.color}08,rgba(8,22,40,0.88))` }}>
                  <h3 style={{ fontFamily:"Playfair Display", fontSize:20, fontWeight:700, color:p.color, margin:"0 0 6px 0" }}>{p.label}</h3>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
                    <div style={{ padding:"12px 14px", background:`${p.color}08`, border:`1px solid ${p.color}22`, borderRadius:10 }}>
                      <div style={{ fontFamily:"JetBrains Mono", fontSize:9, color:p.color, textTransform:"uppercase", letterSpacing:1.5, marginBottom:6 }}>Pattern</div>
                      <div style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt, lineHeight:1.6 }}>{p.pattern}</div>
                    </div>
                    <div style={{ padding:"12px 14px", background:"rgba(14,37,68,0.6)", border:"1px solid rgba(42,79,122,0.3)", borderRadius:10 }}>
                      <div style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.yellow, textTransform:"uppercase", letterSpacing:1.5, marginBottom:6 }}>Diagnosis</div>
                      <div style={{ fontFamily:"DM Sans", fontSize:12, color:T.yellow, fontWeight:600, lineHeight:1.6 }}>{p.diagnosis}</div>
                    </div>
                    <div style={{ padding:"12px 14px", background:"rgba(14,37,68,0.6)", border:"1px solid rgba(42,79,122,0.3)", borderRadius:10 }}>
                      <div style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.teal, textTransform:"uppercase", letterSpacing:1.5, marginBottom:6 }}>Next Step</div>
                      <div style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt2, lineHeight:1.6 }}>{p.nextStep}</div>
                    </div>
                  </div>
                  <div style={{ marginTop:12 }}>
                    <div style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.txt4, textTransform:"uppercase", letterSpacing:1.5, marginBottom:6 }}>Differential Diagnoses</div>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                      {p.ddx.map((d,i) => (
                        <span key={i} style={{ padding:"4px 10px", borderRadius:20, background:`${p.color}15`, border:`1px solid ${p.color}33`, fontFamily:"DM Sans", fontSize:11, color:p.color }}>{d}</span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ══ eFAST ══════════════════════════════════════════════ */}
        {tab === "efast" && (
          <div className="fade-in">
            <div style={{ ...glass, padding:"12px 16px", marginBottom:14, borderLeft:`4px solid ${T.yellow}` }}>
              <div style={{ fontFamily:"Playfair Display", fontSize:18, fontWeight:700, color:T.yellow }}>eFAST — Extended FAST</div>
              <div style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt3, marginTop:2 }}>Extended Focused Assessment with Sonography in Trauma · {PROTOCOLS.efast.indication} · Time: {PROTOCOLS.efast.time}</div>
            </div>

            {/* Steps */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:14 }}>
              {PROTOCOLS.efast.sequence.map((s,i) => (
                <button key={i} onClick={() => setEfastStep(efastStep === i ? null : i)}
                  style={{ ...glass, padding:"12px 14px", border:`2px solid ${efastStep===i?T.yellow+"88":"rgba(42,79,122,0.35)"}`,
                    background:efastStep===i?`rgba(245,200,66,0.1)`:"rgba(8,22,40,0.78)",
                    cursor:"pointer", borderRadius:12, textAlign:"left", transition:"all .15s" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                    <div style={{ width:24, height:24, borderRadius:"50%", background:`rgba(245,200,66,0.15)`, border:`1px solid rgba(245,200,66,0.35)`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <span style={{ fontFamily:"JetBrains Mono", fontSize:10, fontWeight:700, color:T.yellow }}>{s.step}</span>
                    </div>
                    <div style={{ fontFamily:"DM Sans", fontWeight:700, fontSize:12, color:efastStep===i?T.yellow:T.txt }}>{s.region}</div>
                  </div>
                  <div style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt3 }}>{s.goal}</div>
                  <div style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.txt4, marginTop:4 }}>Probe: {s.probe}</div>
                </button>
              ))}
            </div>

            {efastStep !== null && (() => {
              const s = PROTOCOLS.efast.sequence[efastStep];
              return (
                <div className="fade-in" style={{ ...glass, padding:"16px 20px", marginBottom:14, borderTop:`3px solid ${T.yellow}` }}>
                  <div style={{ fontFamily:"Playfair Display", fontSize:18, fontWeight:700, color:T.yellow, marginBottom:12 }}>
                    Step {s.step}: {s.region}
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                    <div style={{ padding:"12px 14px", background:"rgba(61,255,160,0.07)", border:"1px solid rgba(61,255,160,0.2)", borderRadius:10 }}>
                      <div style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.green, textTransform:"uppercase", letterSpacing:1.5, marginBottom:6 }}>Negative (Normal)</div>
                      <div style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt, lineHeight:1.6 }}>{s.findingNegative}</div>
                    </div>
                    <div style={{ padding:"12px 14px", background:"rgba(255,107,107,0.08)", border:"1px solid rgba(255,107,107,0.25)", borderRadius:10 }}>
                      <div style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.red, textTransform:"uppercase", letterSpacing:1.5, marginBottom:6 }}>Positive (Abnormal)</div>
                      <div style={{ fontFamily:"DM Sans", fontSize:12, color:T.coral, lineHeight:1.6, fontWeight:500 }}>{s.findingPositive}</div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Pearls */}
            <div style={{ ...glass, padding:"16px 18px" }}>
              <div style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.yellow, textTransform:"uppercase", letterSpacing:2, marginBottom:12 }}>💎 eFAST Clinical Pearls</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                {PROTOCOLS.efast.pearls.map((p,i) => (
                  <div key={i} style={{ display:"flex", gap:8, padding:"9px 12px", background:"rgba(14,37,68,0.5)", border:"1px solid rgba(42,79,122,0.25)", borderRadius:9 }}>
                    <span style={{ color:T.yellow, flexShrink:0 }}>▸</span>
                    <span style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt2, lineHeight:1.5 }}>{p}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ IMAGE REFERENCE ══════════════════════════════════ */}
        {tab === "findings" && (
          <div className="fade-in">
            <div style={{ display:"grid", gridTemplateColumns:"220px 1fr", gap:14, alignItems:"start" }}>
              {/* Sidebar */}
              <div style={{ ...glass, padding:"12px", display:"flex", flexDirection:"column", gap:6 }}>
                <div style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.txt4, textTransform:"uppercase", letterSpacing:2, marginBottom:4 }}>Findings Library</div>
                {ANNOTATED_FINDINGS.map(f => (
                  <button key={f.id} onClick={() => setFindingId(f.id)}
                    style={{ padding:"10px 12px", borderRadius:9, border:`1px solid ${findingId===f.id?f.color+"55":"transparent"}`,
                      background:findingId===f.id?`${f.color}12`:"transparent",
                      cursor:"pointer", textAlign:"left", transition:"all .15s" }}>
                    <div style={{ fontFamily:"DM Sans", fontWeight:700, fontSize:12, color:findingId===f.id?f.color:T.txt2 }}>{f.title}</div>
                    <div style={{ fontFamily:"DM Sans", fontSize:10, color:T.txt4, marginTop:2 }}>{f.protocol}</div>
                  </button>
                ))}
              </div>

              {/* Detail */}
              {activeFinding && (
                <div className="fade-in" key={activeFinding.id} style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  {/* Header */}
                  <div style={{ ...glass, padding:"16px 20px", borderTop:`4px solid ${activeFinding.color}`, background:`linear-gradient(135deg,${activeFinding.color}08,rgba(8,22,40,0.88))` }}>
                    <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:10, marginBottom:8 }}>
                      <div>
                        <h2 style={{ fontFamily:"Playfair Display", fontSize:22, fontWeight:700, color:activeFinding.color, margin:0 }}>{activeFinding.title}</h2>
                        <div style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.txt4, marginTop:3 }}>Protocol: {activeFinding.protocol} · Probe: {activeFinding.probe}</div>
                      </div>
                      <UrgencyBadge urgency={activeFinding.urgency}/>
                    </div>
                    <div style={{ fontFamily:"DM Sans", fontSize:13, color:T.txt2, lineHeight:1.7 }}>{activeFinding.description}</div>
                  </div>

                  {/* Schematic visualizer */}
                  <div style={{ ...glass, padding:"16px 20px", background:"rgba(5,15,30,0.9)" }}>
                    <div style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.txt4, textTransform:"uppercase", letterSpacing:2, marginBottom:10 }}>Schematic Representation</div>
                    <div style={{ background:"#000", borderRadius:12, padding:"16px", border:`1px solid ${activeFinding.color}33`, minHeight:160, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:8, position:"relative", overflow:"hidden" }}>
                      {/* Scanline effect */}
                      <div style={{ position:"absolute", inset:0, background:"repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,255,0,0.03) 3px, rgba(0,255,0,0.03) 4px)", pointerEvents:"none" }}/>
                      <div style={{ fontFamily:"JetBrains Mono", fontSize:10, color:`${activeFinding.color}aa`, textAlign:"center", lineHeight:1.8, zIndex:1, maxWidth:480 }}>
                        {activeFinding.svg_description}
                      </div>
                      <div style={{ padding:"6px 14px", background:`${activeFinding.color}15`, border:`1px solid ${activeFinding.color}44`, borderRadius:20, fontFamily:"JetBrains Mono", fontSize:9, color:activeFinding.color, zIndex:1 }}>
                        {activeFinding.probe}
                      </div>
                    </div>
                    <div style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt4, marginTop:8, fontStyle:"italic" }}>
                      Note: Schematic text description — correlate with your institution's ultrasound training resources for image-based learning.
                    </div>
                  </div>

                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                    {/* Key features */}
                    <div style={{ ...glass, padding:"14px 16px", borderLeft:`3px solid ${activeFinding.color}` }}>
                      <div style={{ fontFamily:"JetBrains Mono", fontSize:9, color:activeFinding.color, textTransform:"uppercase", letterSpacing:1.5, marginBottom:10 }}>Key Features</div>
                      {activeFinding.key_features.map((f,i) => <BulletRow key={i} text={f} color={activeFinding.color}/>)}
                    </div>

                    {/* Pitfalls */}
                    <div style={{ ...glass, padding:"14px 16px", borderLeft:`3px solid ${T.orange}` }}>
                      <div style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.orange, textTransform:"uppercase", letterSpacing:1.5, marginBottom:10 }}>⚠ Pitfalls</div>
                      {activeFinding.pitfalls.map((p,i) => <BulletRow key={i} text={p} color={T.orange}/>)}
                    </div>
                  </div>

                  {/* Grading */}
                  <div style={{ ...glass, padding:"14px 18px" }}>
                    <div style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.txt4, textTransform:"uppercase", letterSpacing:2, marginBottom:10 }}>Severity / Grading</div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:10 }}>
                      {activeFinding.grading.map((g,i) => {
                        const cols = [T.green, T.yellow, T.red];
                        const c = cols[i] || T.txt3;
                        return (
                          <div key={i} style={{ padding:"10px 12px", background:`${c}08`, border:`1px solid ${c}22`, borderRadius:10 }}>
                            <div style={{ fontFamily:"DM Sans", fontWeight:700, fontSize:12, color:c, marginBottom:3 }}>{g.grade}</div>
                            <div style={{ fontFamily:"JetBrains Mono", fontSize:10, color:T.txt3, marginBottom:5 }}>{g.size}</div>
                            <div style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt2, lineHeight:1.5 }}>{g.significance}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ DOCUMENTATION TEMPLATE ══════════════════════════ */}
        {tab === "doc" && (
          <div className="fade-in">
            <div style={{ ...glass, padding:"12px 16px", marginBottom:14, borderLeft:`4px solid ${T.purple}` }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
                <div>
                  <div style={{ fontFamily:"Playfair Display", fontSize:18, fontWeight:700, color:T.purple }}>POCUS Documentation Template</div>
                  <div style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt3, marginTop:2 }}>Chart-ready POCUS note — complete relevant sections and copy to chart</div>
                </div>
                <button onClick={copyNote}
                  style={{ padding:"9px 20px", borderRadius:10, background:copied?`linear-gradient(135deg,${T.green},#27ae60)`:`linear-gradient(135deg,${T.purple},#7c3aed)`, border:"none", color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"DM Sans", display:"flex", alignItems:"center", gap:8 }}>
                  {copied ? "✓ Copied!" : "📋 Copy Full Note"}
                </button>
              </div>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              {DOC_TEMPLATE.sections.map(s => (
                <div key={s.id} style={{ ...glass, padding:"14px 16px", borderTop:`2px solid rgba(155,109,255,0.3)` }}>
                  <div style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.purple, textTransform:"uppercase", letterSpacing:1.5, marginBottom:8 }}>{s.label}</div>
                  <textarea
                    value={docValues[s.id] || ""}
                    onChange={e => setDoc(s.id, e.target.value)}
                    placeholder={s.placeholder}
                    rows={s.id === "cardiac" || s.id === "interpretation" || s.id === "plan" ? 6 : 4}
                    style={{ width:"100%", background:"rgba(14,37,68,0.6)", border:"1px solid rgba(42,79,122,0.35)", borderRadius:9, padding:"10px 12px", color:T.txt, fontSize:12, lineHeight:1.7, resize:"vertical", outline:"none", transition:"border-color .15s" }}
                    onFocus={e => e.target.style.borderColor = "rgba(155,109,255,0.5)"}
                    onBlur={e => e.target.style.borderColor = "rgba(42,79,122,0.35)"}
                  />
                </div>
              ))}
            </div>

            {/* Quick fill guide */}
            <div style={{ ...glass, padding:"14px 18px", marginTop:14 }}>
              <div style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.teal, textTransform:"uppercase", letterSpacing:2, marginBottom:10 }}>Quick Fill Reference — Common Findings</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:10 }}>
                {[
                  { label:"Normal RUSH", text:"No pericardial effusion. LV hyperdynamic. IVC < 2.1 cm with > 50% collapse. No free peritoneal fluid. Bilateral lung sliding present. RUSH impression: distributive physiology." },
                  { label:"Tamponade", text:"Moderate-to-large circumferential pericardial effusion. Diastolic RV free wall collapse present. IVC plethoric, non-collapsing. Electrical alternans noted on concurrent ECG." },
                  { label:"Cardiogenic Shock", text:"Severely reduced LV EF (estimated 15–20%). Dilated LV with globally impaired wall motion. No pericardial effusion. Plethoric IVC > 2.5 cm. Bilateral diffuse B-lines (pulmonary edema pattern)." },
                  { label:"Tension PTX", text:"Absent lung sliding bilaterally (right > left). No lung point identified in initial scan. Tracheal deviation clinically evident. RUSH: tank shows plethoric IVC. Needle decompression performed." },
                  { label:"Positive FAST (Trauma)", text:"Anechoic free fluid in Morrison's pouch (right hepatorenal space) measuring approximately 1.5 cm depth. LUQ and pelvis negative. Subxiphoid: no pericardial effusion. Bilateral lung sliding present." },
                  { label:"Massive PE", text:"RV:LV ratio > 0.9 on A4C view. McConnell sign present (RV free wall akinesis with preserved apex). D-shaped LV on PSAX. IVC plethoric. Bilateral lung sliding present. CTPA confirmed massive PE." },
                ].map((item,i) => (
                  <div key={i} style={{ padding:"10px 12px", background:"rgba(14,37,68,0.5)", border:"1px solid rgba(42,79,122,0.25)", borderRadius:9 }}>
                    <div style={{ fontFamily:"DM Sans", fontWeight:700, fontSize:11, color:T.teal, marginBottom:4 }}>{item.label}</div>
                    <div style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt3, lineHeight:1.5, marginBottom:8 }}>{item.text.substring(0, 80)}…</div>
                    <button onClick={() => {
                      const field = item.label.toLowerCase().includes("normal") ? "interpretation" : "interpretation";
                      setDoc("interpretation", (docValues["interpretation"] ? docValues["interpretation"] + "\n\n" : "") + item.text);
                    }} style={{ padding:"4px 10px", borderRadius:7, background:"rgba(0,229,192,0.1)", border:"1px solid rgba(0,229,192,0.25)", color:T.teal, fontSize:10, fontWeight:600, cursor:"pointer", fontFamily:"DM Sans" }}>
                      + Append to Interpretation
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign:"center", paddingBottom:24, paddingTop:14 }}>
          <span style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.txt4, letterSpacing:1.5 }}>
            NOTRYA POCUS HUB · RUSH PROTOCOL (WEINGART 2012) · BLUE PROTOCOL (LICHTENSTEIN 2008) · eFAST (ATLS 11TH ED) · VERIFY ALL FINDINGS WITH CLINICAL CONTEXT
          </span>
        </div>
      </div>
    </div>
  );
}