import { useState } from "react";
import { useNavigate } from "react-router-dom";

// ── Font + CSS Injection ──────────────────────────────────────────────────────
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
    .fade-in{animation:fadeSlide .22s ease forwards;}
    .shimmer-text{background:linear-gradient(90deg,#e8f0fe 0%,#fff 30%,#00d4ff 52%,#00e5c0 72%,#e8f0fe 100%);background-size:250% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 5s linear infinite;}
    .pocus-card{transition:border-color .15s,box-shadow .15s,transform .12s;}
    textarea{font-family:'DM Sans',sans-serif;}
  `;
  document.head.appendChild(s);
})();

// ── Design Tokens ─────────────────────────────────────────────────────────────
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

// ── FAST Window Data ──────────────────────────────────────────────────────────
const FAST_WINDOWS = [
  { id:"ruq", label:"RUQ — Morrison's Pouch", icon:"🔶", color:T.teal, svgType:"ruq",
    imgNormal:"https://media.base44.com/images/public/69876015478a19e360c5e3ea/33349f75f_generated_image.png",
    imgAbn:"https://media.base44.com/images/public/69876015478a19e360c5e3ea/8aa8f00cb_generated_image.png",
    probe:"Curvilinear 3–5 MHz · marker cephalad · R midaxillary 8th–11th ICS · 18 cm",
    normal:["Echogenic fat line at hepatorenal interface","No anechoic stripe between liver and right kidney","No sub-diaphragmatic fluid above hepatic dome"],
    abnormal:["Anechoic stripe at hepatorenal interface = hemoperitoneum","Sub-diaphragmatic blood above right hepatic lobe","Fresh clot may be isoechoic — scan posterior liver edge carefully"],
    pearl:"Most dependent space when supine. As little as 250 mL detectable. First view to acquire in hypotensive trauma." },
  { id:"luq", label:"LUQ — Splenorenal Recess", icon:"🔷", color:T.blue, svgType:"luq",
    imgNormal:"https://media.base44.com/images/public/69876015478a19e360c5e3ea/4174646f3_generated_image.png",
    imgAbn:"https://media.base44.com/images/public/69876015478a19e360c5e3ea/afa29ce83_generated_image.png",
    probe:"Curvilinear · L posterior axillary line · aim more posteriorly than RUQ · 18 cm",
    normal:["Echogenic fat line at splenorenal interface","No fluid between spleen and left kidney","Diaphragm clearly visible above spleen"],
    abnormal:["Anechoic stripe at splenorenal interface","Sub-diaphragmatic fluid above spleen (often first finding)","Fan probe more posterior if view inadequate"],
    pearl:"Hardest FAST view — more bowel gas. Aim posterior. Sub-diaphragmatic fluid appears before splenorenal fluid." },
  { id:"pelvis", label:"Pelvic — Pouch of Douglas", icon:"🔻", color:T.yellow, svgType:"pelvis",
    imgNormal:"https://media.base44.com/images/public/69876015478a19e360c5e3ea/5207e22dd_generated_image.png",
    imgAbn:"https://media.base44.com/images/public/69876015478a19e360c5e3ea/ff9df6712_generated_image.png",
    probe:"Curvilinear · suprapubic transverse then sagittal · full bladder required as window",
    normal:["Full bladder as anechoic acoustic window (anterior)","Uterus or prostate posterior to bladder","No fluid posterior or superior to bladder"],
    abnormal:["Anechoic fluid posterior to uterus (♀) or bladder dome (♂)","Bowel loops floating freely on fluid","Fluid superior to bladder dome = large volume"],
    pearl:"Most sensitive window with full bladder. FAST-positive + unstable = OR directly, not CT scanner." },
  { id:"subcostal", label:"Subxiphoid — Cardiac", icon:"❤️", color:T.coral, svgType:"subcostal",
    imgNormal:"https://media.base44.com/images/public/69876015478a19e360c5e3ea/bd8227609_generated_image.png",
    imgAbn:"https://media.base44.com/images/public/69876015478a19e360c5e3ea/1d1a0592d_generated_image.png",
    probe:"Curvilinear · press firmly subxiphoid · angle toward left shoulder · use liver as window · 20 cm",
    normal:["Bright echogenic pericardial line around heart","RV anterior (closest to probe), LV posterior and larger","No anechoic space outside pericardial line"],
    abnormal:["Anechoic stripe outside pericardium = pericardial effusion","RV diastolic collapse = tamponade physiology","Swinging heart motion with large effusion"],
    pearl:"eFAST adds bilateral apical lung scans (PTX) to these 4 windows. Cardiac view detects tamponade in penetrating trauma." },
];

// ── Lung POCUS Data ───────────────────────────────────────────────────────────
const LUNG_PATTERNS = [
  { id:"alines", label:"A-Lines", sub:"Normal Aerated Lung", icon:"〰", color:T.teal, svgType:"alines",
    badge:"NORMAL", badgeColor:T.green,
    headline:"Horizontal reverberation artifacts equidistant below pleural line",
    findings:["Bright horizontal lines parallel to and below pleural line","Equally spaced (= skin-to-pleural-line distance)","Fade progressively with depth","Present in BOTH normal lung AND pneumothorax — sliding distinguishes them"],
    context_normal:"A-lines + lung sliding = normal aerated lung (PTX ruled out at that zone)",
    context_abnormal:"A-lines + NO lung sliding = PTX until proven otherwise",
    key:"Lung sliding is the critical differentiator. Absence = PTX. Presence = normal or obstructive disease.",
    pearl:"Lung sliding appears as shimmering movement at the pleural line synchronous with respiration. Use linear probe for best resolution." },
  { id:"blines", label:"B-Lines", sub:"Interstitial Syndrome", icon:"☁", color:T.blue, svgType:"blines",
    badge:"PATHOLOGICAL", badgeColor:T.red,
    headline:"Vertical comet-tail artifacts from pleural line to bottom of screen",
    findings:["Arise from pleural line and extend to screen bottom without fading","Obliterate A-lines where they pass","Move synchronously with lung sliding (confirms pleural origin)","3 or more per field = pathological B-pattern"],
    context_normal:"0–2 isolated B-lines per zone may be normal (esp. lateral/basal)",
    context_abnormal:"Bilateral anterior B-lines (3 or more per zone) = interstitial syndrome: edema or ARDS",
    key:"Bilateral diffuse = interstitial syndrome. Unilateral = contusion, pneumonia, atelectasis.",
    pearl:"Count per zone: 0–2 normal, 3–5 moderate, >5 confluent (white lung) = severe pulmonary edema." },
  { id:"ptx", label:"Pneumothorax", sub:"Absent Sliding + Lung Point", icon:"💨", color:T.orange, svgType:"ptx",
    badge:"CRITICAL", badgeColor:T.red,
    headline:"Absent lung sliding + A-lines + lung point = pneumothorax",
    findings:["Absent lung sliding at pleural line (most sensitive sign)","A-lines present without movement","Lung point = transition between PTX zone and normal lung — 100% specific","Barcode/stratosphere sign on M-mode (flat lines below pleural line)","No B-lines, absent lung pulse"],
    context_normal:"Seashore sign on M-mode: granular texture below pleural line = normal",
    context_abnormal:"Barcode/stratosphere sign on M-mode: flat parallel lines below pleura = PTX",
    key:"Lung point is pathognomonic for PTX. No lung point = tension PTX (fully collapsed).",
    pearl:"Scan anterior 2nd ICS MCL supine. Lung point location predicts PTX size — more lateral = larger PTX." },
  { id:"effusion", label:"Pleural Effusion", sub:"Costophrenic Angle", icon:"💧", color:T.cyan, svgType:"effusion",
    badge:"FREE FLUID", badgeColor:T.cyan,
    headline:"Anechoic (or complex) fluid above diaphragm in costophrenic recess",
    findings:["Anechoic space above diaphragm, below chest wall","Compressive atelectasis at lung base (jellyfish sign)","Spine sign: vertebral bodies visible above diaphragm (normally obscured by aerated lung)","Fluid shifts with position if simple transudate"],
    context_normal:"Small echogenic fat pad — static, no atelectasis, no spine sign",
    context_abnormal:"Echogenic or septated fluid = exudate, hemothorax, or empyema",
    key:"Anechoic = transudate likely. Echogenic/septated = exudate, hemothorax, or empyema.",
    pearl:"Spine sign distinguishes pleural effusion from ascites. Posterior axillary line provides best window." },
];

// ── Cardiac POCUS Data ────────────────────────────────────────────────────────
const CARDIAC_VIEWS = [
  { id:"plax", label:"Parasternal Long Axis", short:"PLAX", icon:"📐", color:T.cyan, svgType:"plax",
    position:"3rd–4th ICS left parasternal · marker to right shoulder (2 o'clock position)",
    keyFindings:["LVEF qualitative: hyperdynamic >70%, normal 55–70%, reduced 30–55%, severely reduced <30%","Pericardial effusion: posterior to LV and anterior to descending aorta = pericardial (not pleural)","D-sign (IVS flattening) = RV pressure or volume overload","Aortic root dilation (normal <3.8 cm) · mitral valve structure and motion"],
    pearls:["Effusion anterior to descending thoracic aorta = pericardial. Posterior = pleural effusion.","Hyperdynamic EF: IVS/PW nearly touch in systole. Severely reduced: almost no wall motion.","SAM (systolic anterior motion of MV leaflet) = HOCM — caution with vasopressors."] },
  { id:"psax", label:"Parasternal Short Axis", short:"PSAX", icon:"⭕", color:T.purple, svgType:"psax",
    position:"Rotate PLAX 90° clockwise · marker to left shoulder (10 o'clock) · image at papillary level",
    keyFindings:["LV must be circular — D-shape = IVS flattening from RV dilation","LV:RV ratio ~2:1 at mid-papillary level (normal)","Regional wall motion abnormalities (RWMA) per AHA 17-segment model","Aortic valve level: Mercedes-Benz sign = normal trileaflet (3 equal leaflets)"],
    pearls:["D-sign diastolic = volume overload (massive PE). D-sign systolic = pressure overload.","Papillary muscle level: best view for inferior, anterior, and lateral wall motion assessment.","Severe RV dilation causes complete D-shape — LV appears like crescent, not circle."] },
  { id:"a4c", label:"Apical 4-Chamber", short:"A4C", icon:"♦", color:T.coral, svgType:"a4c",
    position:"Cardiac apex (PMI) · marker to patient's left · probe angled superiorly toward base",
    keyFindings:["RV:LV diameter ratio >0.9 = RV dilation (PE, cor pulmonale, RV infarct)","McConnell's sign: akinetic RV mid free wall + preserved RV apex = 94% specific for acute PE","Circumferential pericardial effusion quantification and tamponade assessment","LA enlargement (>4 cm = chronic LV diastolic or valvular disease)"],
    pearls:["McConnell's sign + RV:LV >1.0 + hemodynamic instability = massive PE until proven otherwise.","RV infarct: RV dilation without McConnell's, often with inferior RWMA in adjacent LV wall.","Apical thrombus: rounded filling defect at LV apex — requires low EF and clinical context."] },
  { id:"ivc", label:"IVC — Volume Status", short:"IVC", icon:"〜", color:T.green, svgType:"ivc",
    position:"Subxiphoid sagittal · IVC-RA junction · measure diameter 2 cm from RA",
    keyFindings:["Normal IVC <2.1 cm with >50% collapse on sniff = RAP 0–5 mmHg","Collapsibility Index (CI) = (max – min)/max × 100","CI >50% (spontaneous breathing) = low RAP → volume responsive","IVC >2.1 cm + CI <50% = elevated RAP ≥10 mmHg"],
    pearls:["Ventilated patients: CI >18% with fixed tidal volume may indicate volume responsiveness.","Small collapsing IVC does not exclude hypovolemia — integrate with clinical context.","Plethoric non-collapsing IVC: RV failure, tamponade, massive PE, severe TR."] },
  { id:"tamponade", label:"Tamponade / Effusion", short:"TAMP", icon:"⚠", color:T.red, svgType:"subcostal",
    position:"Subxiphoid primary · confirm with PLAX and A4C · all views for quantification",
    keyFindings:["Effusion grading: trivial <5 mm, small 5–10 mm, moderate 10–20 mm, large >20 mm","RV diastolic collapse = first sign of elevated pericardial pressure (most sensitive)","RA systolic collapse >1/3 cardiac cycle = tamponade physiology","IVC plethora (>2.1 cm, non-collapsing) supports elevated pericardial pressure"],
    pearls:["Tamponade = clinical + echo diagnosis. Shock + effusion + RV collapse = pericardiocentesis.","Rapid accumulation (e.g., stab wound) causes tamponade with even a small effusion.","Post-op cardiac: loculated effusion may cause focal tamponade without circumferential fluid.","Effusion anterior to descending aorta in PLAX = pericardial (not pleural)."] },
];

// ── RUSH Protocol — 5 Windows ─────────────────────────────────────────────────
const RUSH_WINDOWS = [
  { id:"pump", letter:"P", label:"Pump", sublabel:"Cardiac Function", icon:"❤️", color:T.red,
    probe:"Phased array cardiac probe", position:"Subxiphoid or parasternal",
    views:["Subxiphoid 4-chamber (SX4C) — first in arrest, doesn't interrupt CPR","Parasternal long axis (PLAX)","Parasternal short axis (PSAX @ papillary level)","Apical 4-chamber (A4C)"],
    findings:[
      { label:"Hyperdynamic LV", appearance:"Walls nearly touching ('kissing'), small cavity, vigorous contraction", interpretation:"Distributive / septic shock — high CO, low SVR", urgency:"moderate", color:T.orange },
      { label:"Severely Reduced EF", appearance:"Barely moving walls, dilated LV, mitral valve opens poorly", interpretation:"Cardiogenic shock — pump failure", urgency:"high", color:T.red },
      { label:"Pericardial Effusion", appearance:"Anechoic (black) rim encircling heart", interpretation:"Possible tamponade — correlate with RV diastolic collapse", urgency:"high", color:T.purple },
      { label:"Diastolic RV Collapse", appearance:"RV free wall buckles inward in diastole on 2D", interpretation:"CARDIAC TAMPONADE — pathognomonic finding", urgency:"critical", color:T.red },
      { label:"RV Dilation + McConnell Sign", appearance:"RV:LV > 0.9, free wall hypokinesis with preserved apex", interpretation:"Massive PE — McConnell sign highly specific (94%)", urgency:"critical", color:T.coral },
      { label:"Segmental Wall Motion Abnormality", appearance:"Regional hypokinesis/akinesis in coronary territory", interpretation:"Acute MI — STEMI equivalent", urgency:"critical", color:T.yellow },
    ],
    pearl:"In cardiac arrest: subxiphoid first — pulse check 10 sec max. Total cardiac standstill = PEA, poor prognosis. Pericardial vs pleural effusion: pericardial stays anterior to descending aorta." },
  { id:"ivc", letter:"T", label:"Tank", sublabel:"IVC / Volume Status", icon:"💧", color:T.blue,
    probe:"Curvilinear or phased array", position:"Subcostal, hepatic vein junction",
    views:["Subcostal long-axis IVC (measure 2 cm from RA junction)","IVC short-axis (confirmatory)","Hepatic vein Doppler for phasicity"],
    findings:[
      { label:"IVC < 2.1 cm + > 50% Collapse", appearance:"Flat, thin IVC that collapses completely with sniff/inspiration", interpretation:"CVP 0–5 mmHg → volume responsive — give fluids", urgency:"normal", color:T.green },
      { label:"IVC 2.1–2.5 cm + 25–50% Collapse", appearance:"Moderate IVC, partial inspiratory collapse", interpretation:"CVP 5–10 mmHg → indeterminate — dynamic measures needed", urgency:"moderate", color:T.yellow },
      { label:"IVC > 2.5 cm + < 25% Collapse", appearance:"Plethoric, non-collapsing IVC — no respiratory variation", interpretation:"CVP ≥ 15 → volume overloaded, RHF, tamponade, or tension PTX", urgency:"high", color:T.red },
    ],
    pearl:"IVC collapsibility predicts fluid responsiveness in spontaneously breathing patients. In ventilated patients: distensibility index (>12% with tidal volume) is preferred. IVC alone is insufficient — always combine with clinical context." },
  { id:"aorta", letter:"Pi", label:"Pipes", sublabel:"Aorta + DVT", icon:"🔴", color:T.orange,
    probe:"Curvilinear (aorta) / Linear (DVT)", position:"Epigastric + bilateral groin/popliteal",
    views:["Epigastric long-axis (aorta)","Epigastric transverse (aorta + SMA)","Femoral vein compression (bilateral)","Popliteal vein compression (bilateral)"],
    findings:[
      { label:"AAA > 3 cm (> 5.5 cm = rupture risk)", appearance:"Dilated aorta outer-to-outer > 3 cm; retroperitoneal hematoma = rupture", interpretation:"Abdominal aortic aneurysm — rupture is surgical emergency", urgency:"critical", color:T.red },
      { label:"Intimal Flap in Aortic Lumen", appearance:"Linear echogenic mobile structure within aortic lumen", interpretation:"Aortic dissection — confirm with CT", urgency:"critical", color:T.purple },
      { label:"Non-Compressible Femoral/Popliteal Vein", appearance:"Vein does not flatten completely with gentle probe compression", interpretation:"DVT → source of PE; normal vein fully collapses", urgency:"high", color:T.coral },
    ],
    pearl:"Measure aorta outer-to-outer in transverse view. Compress femoral vein at the sapheno-femoral junction and popliteal fossa. Normal vein collapses completely — incompressibility = DVT until proven otherwise." },
  { id:"peritoneal", letter:"Pe", label:"Peritoneal", sublabel:"Free Fluid (FAST)", icon:"🩸", color:T.yellow,
    probe:"Curvilinear", position:"RUQ, LUQ, pelvic, subxiphoid",
    views:["RUQ Morrison's pouch (hepatorenal)","LUQ splenorenal recess","Pelvic — posterior to bladder (Pouch of Douglas)","Subxiphoid — pericardial space (eFAST)"],
    findings:[
      { label:"Free Fluid in Morrison's Pouch", appearance:"Anechoic stripe between liver and right kidney", interpretation:"Hemoperitoneum — most commonly from liver laceration in trauma", urgency:"critical", color:T.red },
      { label:"LUQ Splenorenal Free Fluid", appearance:"Anechoic fluid in splenorenal recess or perisplenic", interpretation:"Splenic laceration / free blood — LUQ often more sensitive than RUQ", urgency:"critical", color:T.red },
      { label:"Pelvic Free Fluid", appearance:"Anechoic crescent posterior to bladder in the cul-de-sac", interpretation:"Most sensitive location for small volumes — gravity-dependent pooling", urgency:"high", color:T.orange },
      { label:"Pericardial Effusion (eFAST)", appearance:"Anechoic ring anterior to pericardium in subxiphoid view", interpretation:"Traumatic hemopericardium — tamponade pending", urgency:"critical", color:T.purple },
    ],
    pearl:"Positive FAST in hemodynamically unstable trauma → operative abdomen. Do NOT send unstable patients to CT. Negative FAST does not exclude injury — 20–30% of solid organ injuries have no free fluid initially." },
  { id:"lung_rush", letter:"A", label:"Air", sublabel:"Lung / Pleural", icon:"💨", color:T.teal,
    probe:"Linear (PTX) or curvilinear (B-lines/effusion)", position:"Anterior and lateral chest wall",
    views:["Anterior 2nd ICS MCL bilateral (PTX detection)","Lower anterior zones (B-line pattern)","Lateral posterior zones (pleural effusion)","Lung-liver interface (diaphragm level)"],
    findings:[
      { label:"Lung Sliding Present", appearance:"Shimmering movement at pleural line — 'seashore sign' on M-mode", interpretation:"PTX EXCLUDED at this probe location (sensitivity 99%)", urgency:"normal", color:T.green },
      { label:"Absent Lung Sliding + Barcode Sign", appearance:"No shimmer at pleural line — stratosphere (barcode) on M-mode", interpretation:"Pneumothorax at probe location until proven otherwise", urgency:"critical", color:T.red },
      { label:"Lung Point", appearance:"Transition between sliding and non-sliding at PTX margin — pathognomonic", interpretation:"100% specific for pneumothorax — confirms diagnosis", urgency:"critical", color:T.red },
      { label:"B-Lines (≥ 3 per field)", appearance:"Vertical hyperechoic 'laser-like' lines from pleural surface to bottom of screen", interpretation:"Pulmonary interstitial edema — cardiogenic pulmonary edema or ARDS", urgency:"high", color:T.orange },
      { label:"Anechoic Pleural Collection", appearance:"Black space above diaphragm; compressible lung floating within fluid", interpretation:"Pleural effusion — hemothorax (trauma) or medical cause", urgency:"moderate", color:T.blue },
    ],
    pearl:"Do NOT delay needle decompression for suspected tension PTX based on ultrasound! If clinical diagnosis is clear, treat first. Lung sliding alone rules out PTX with 99% sensitivity — rapid bilateral check takes < 60 seconds." },
];

// ── BLUE Protocol ─────────────────────────────────────────────────────────────
const BLUE_PROFILES = [
  { label:"A-Profile (bilateral A-lines, sliding present)", color:T.green,
    diagnosis:"Pulmonary embolism or asthma/COPD (if DVT positive → PE likely)",
    pattern:"Bilateral A-lines + lung sliding present → normal lung parenchyma",
    nextStep:"Evaluate for PE: DVT screening, D-dimer, CT-PA if stable. Or consider COPD/asthma if wheezing present.",
    ddx:["Massive PE","Asthma exacerbation","COPD exacerbation","Pneumothorax (A-profile + absent sliding)"] },
  { label:"B-Profile (bilateral B-lines anteriorly)", color:T.orange,
    diagnosis:"Cardiogenic pulmonary edema (sensitivity 97%, specificity 95%)",
    pattern:"≥ 3 B-lines per zone in 2+ bilateral anterior zones",
    nextStep:"Diuresis, nitroglycerin, CPAP/BiPAP. Echo to assess LV function and filling pressures.",
    ddx:["Acute decompensated heart failure","ARDS (B + absence of normal areas)","Acute interstitial pneumonia"] },
  { label:"B'-Profile (B-lines with absent lung sliding)", color:T.purple,
    diagnosis:"Pneumonia (B-lines without sliding = consolidation with air bronchograms)",
    pattern:"B-lines + absent or reduced lung sliding + possible consolidation",
    nextStep:"Antibiotics, further characterization with CT if needed. Check for pleural effusion (parapneumonic).",
    ddx:["Community-acquired pneumonia","Hospital-acquired pneumonia","Pulmonary contusion"] },
  { label:"A'-Profile (A-lines + absent lung sliding)", color:T.red,
    diagnosis:"Pneumothorax — confirm with lung point",
    pattern:"A-lines WITHOUT lung sliding — look for lung point to confirm",
    nextStep:"If hemodynamically unstable → needle decompression. If stable → chest tube or aspiration.",
    ddx:["Tension pneumothorax","Simple pneumothorax","Main-stem intubation (unilateral)"] },
  { label:"C-Profile (anterior consolidation)", color:T.yellow,
    diagnosis:"Consolidation (pneumonia, atelectasis, or lung contusion)",
    pattern:"Tissue-like pattern anteriorly — 'hepatization' of lung (looks like liver)",
    nextStep:"Differentiate pneumonia (air bronchograms) from atelectasis (fluid bronchograms) from contusion.",
    ddx:["Pneumonia","Lung contusion","Lobar atelectasis","Lung tumor (rare)"] },
  { label:"PLAPS (postero-lateral alveolar/pleural syndrome)", color:T.teal,
    diagnosis:"Pleural effusion ± consolidation in posterior-lateral zones",
    pattern:"Posterior probe position: anechoic fluid above diaphragm with floating lung",
    nextStep:"Quantify effusion (depth × width at mid-exhalation), therapeutic thoracentesis if > 1 cm depth.",
    ddx:["Pleural effusion (transudative or exudative)","Hemothorax","Empyema","Mesothelioma"] },
];

// ── eFAST Sequence ────────────────────────────────────────────────────────────
const EFAST_STEPS = [
  { step:1, region:"Subxiphoid", goal:"Pericardial effusion / cardiac activity", probe:"Curvilinear or phased array", findingPositive:"Anechoic fluid anterior to heart — tamponade if RV collapse present", findingNegative:"No fluid stripe, normal cardiac motion" },
  { step:2, region:"RUQ (Morrison's Pouch)", goal:"Hepatorenal free fluid", probe:"Curvilinear", findingPositive:"Anechoic stripe between liver and right kidney — ANY amount is significant in trauma", findingNegative:"Liver and kidney margins directly touching" },
  { step:3, region:"LUQ (Splenorenal)", goal:"Splenorenal / subdiaphragmatic free fluid", probe:"Curvilinear", findingPositive:"Anechoic fluid adjacent to spleen or between spleen and diaphragm", findingNegative:"Spleen and kidney directly adjacent — no fluid stripe" },
  { step:4, region:"Pelvis (Suprapubic)", goal:"Pelvic free fluid (Pouch of Douglas / rectovesical)", probe:"Curvilinear", findingPositive:"Anechoic fluid posterior/superior to bladder — most dependent zone", findingNegative:"Bladder uniformly bordered by tissue — no anechoic collections" },
  { step:5, region:"Right Anterior Chest (2nd ICS MCL)", goal:"Right pneumothorax", probe:"Linear high-frequency", findingPositive:"Absent lung sliding ± barcode sign on M-mode", findingNegative:"Seashore sign on M-mode — lung sliding present" },
  { step:6, region:"Left Anterior Chest (2nd ICS MCL)", goal:"Left pneumothorax", probe:"Linear high-frequency", findingPositive:"Absent lung sliding ± barcode sign on M-mode", findingNegative:"Seashore sign on M-mode — lung sliding present" },
];
const EFAST_PEARLS = [
  "A positive eFAST in hemodynamically unstable trauma = operative abdomen — do NOT CT scan first.",
  "A negative eFAST does not exclude injury — solid organ injuries may not have free fluid initially.",
  "Sensitivity of FAST for hemoperitoneum is ~85–96% but drops in small injuries or retroperitoneal bleeding.",
  "In pediatric trauma: even small amounts of free fluid (1–2 mm) are significant — lower threshold.",
  "Pericardial vs pleural effusion: pericardial fluid stays anterior to the descending thoracic aorta.",
  "Check all 6 windows — a negative RUQ does not exclude LUQ or pelvic injury.",
];

// ── Annotated Findings Library ────────────────────────────────────────────────
const ANNOTATED_FINDINGS = [
  { id:"pericardial_effusion", title:"Pericardial Effusion", protocol:"RUSH / eFAST", probe:"Phased array — subxiphoid or PLAX", color:T.purple, urgency:"critical", svgType:"subcostal", svgComponent:"cardiac",
    description:"Anechoic (black) fluid surrounding the heart within the pericardial sac.",
    key_features:["Anechoic (echo-free / black) rim encircling the myocardium","Best seen in PLAX view — posterior to LV and anterior to posterior pericardium","Circumferential is more concerning than focal","Diastolic RV free wall collapse = tamponade physiology","Electrical alternans on ECG: QRS axis alternates with each beat","IVC plethoric (non-collapsing) in tamponade"],
    pitfalls:["Pericardial fat pad: echogenic, anterior — does NOT move with heart","Pleural effusion: extends posterior to the descending thoracic aorta (PLAX view)","Epicardial fat: echogenic band directly on myocardium — not anechoic"],
    grading:[{grade:"Small",size:"< 1 cm at end-diastole in PLAX",significance:"Usually benign — monitor"},{grade:"Moderate",size:"1–2 cm",significance:"May be hemodynamically significant"},{grade:"Large",size:"> 2 cm",significance:"High tamponade risk — assess RV collapse"}] },
  { id:"sliding_lung", title:"Lung Sliding (Present vs. Absent)", protocol:"RUSH / BLUE / eFAST", probe:"Linear 7–14 MHz — anterior chest 2nd ICS MCL", color:T.teal, urgency:"normal", svgType:"ptx", svgComponent:"lung",
    description:"Lung sliding = normal visceral-parietal pleural movement with respiration. ABSENCE = pneumothorax until proven otherwise.",
    key_features:["NORMAL: Shimmering 'ants marching' at pleural line with each breath","ABSENT: Stationary horizontal echoes (A-lines) — no movement","M-mode NORMAL: 'Seashore sign' — granular below pleural line, horizontal above","M-mode ABSENT: 'Barcode sign' / 'stratosphere sign' — all horizontal lines","Lung point: transition between sliding and non-sliding — 100% specific for PTX","A-lines present in BOTH normal and PTX — do not use A-lines alone to diagnose PTX"],
    pitfalls:["Mainstem intubation: absent sliding on left side only — check tube position","Pleurodesis or pleural adhesions: absent sliding without PTX","Cardiac motion can mimic lung sliding — evaluate with M-mode","In patients holding breath, normal sliding disappears temporarily"],
    grading:[{grade:"Present",size:"Normal respiratory phasicity",significance:"PTX excluded at this location"},{grade:"Absent (no lung point)",size:"No sliding at one location",significance:"PTX likely — perform bilateral comparison"},{grade:"Lung Point Present",size:"Transition point identified",significance:"100% specific for PTX — diagnostic"}] },
  { id:"free_fluid", title:"Intraperitoneal Free Fluid", protocol:"eFAST / RUSH Peritoneal", probe:"Curvilinear 2–5 MHz — RUQ, LUQ, pelvic", color:T.orange, urgency:"critical", svgType:"ruq", svgShowAbn:true, svgComponent:"fast",
    description:"Anechoic fluid accumulating in dependent peritoneal spaces — in trauma, blood until proven otherwise.",
    key_features:["RUQ: Anechoic stripe between right lobe of liver and right kidney (Morrison's pouch)","LUQ: Fluid between spleen and left kidney or adjacent to spleen superiorly","Pelvis: Posterior to full bladder — most sensitive location for small volumes","Fluid conforms to organ contours — tracks dependent spaces","Hemoperitoneum may contain internal echoes or clot (hyperechoic foci)","ANY free fluid in RUQ in trauma is significant — quantify depth"],
    pitfalls:["Perinephric fat: echogenic, does NOT layer with gravity changes","Ascites vs. hemoperitoneum: ascites is anechoic and chronic; acute hemoperitoneum may have clot","Full bladder: may mimic pelvic free fluid — scan bladder in long and short axis"],
    grading:[{grade:"Trace",size:"< 1 cm stripe in Morrison's pouch",significance:"Still significant in trauma — may represent > 300 mL"},{grade:"Moderate",size:"1–3 cm",significance:"Significant hemoperitoneum — likely > 500 mL"},{grade:"Large",size:"> 3 cm or multiple spaces",significance:"Massive hemoperitoneum — immediate surgical consult"}] },
  { id:"b_lines", title:"B-Lines (Comet Tails)", protocol:"BLUE Protocol", probe:"Curvilinear or phased array — anterior chest zones", color:T.blue, urgency:"high", svgType:"blines", svgComponent:"lung",
    description:"Vertical hyperechoic reverberation artifacts arising from the pleural line — indicate interstitial lung water.",
    key_features:["Arise from pleural line and extend to bottom of screen without fading","MOVE WITH LUNG SLIDING — distinguishes from other artifacts","≥ 3 B-lines per intercostal space = pathological (B-profile)","Bilateral anterior B-lines = cardiogenic pulmonary edema until proven otherwise","Unilateral B-lines = pneumonia, contusion, or localized edema","Responds to diuresis — useful for real-time treatment monitoring"],
    pitfalls:["1–2 B-lines per zone may be normal, especially at lung bases","B-lines without lung sliding (B'-profile) = pneumonia, not CHF","Pulmonary fibrosis: irregular pleural line + B-lines in specific zones","CT-pattern correlation: B-lines correspond to ground-glass opacities / Kerley B lines"],
    grading:[{grade:"0–2 B-lines per zone",size:"Normal / physiologic",significance:"No interstitial edema"},{grade:"3–5 B-lines per zone",size:"Moderate interstitial syndrome",significance:"CHF, early ARDS, pneumonia"},{grade:"> 5 B-lines or confluent",size:"Severe interstitial syndrome ('white lung')",significance:"Severe pulmonary edema / ARDS"}] },
  { id:"ivc_assessment", title:"IVC Volume Assessment", protocol:"RUSH Tank Window", probe:"Curvilinear or phased array — subcostal long-axis", color:T.cyan, urgency:"moderate", svgType:"ivc", svgComponent:"cardiac",
    description:"IVC diameter and collapsibility predicts central venous pressure and fluid responsiveness.",
    key_features:["Measure IVC 2 cm from right atrium junction (hepatic veins enter here)","Measure at end-expiration in spontaneously breathing patients","Collapsibility index = (max diameter − min diameter) / max diameter × 100","Normal IVC: 1.5–2.5 cm with respiratory variation","Sniff test: patient sniffs briefly — normal = > 50% collapse","In ventilated patients: distensibility index > 12% with tidal volume = fluid responsive"],
    pitfalls:["Measuring too far from RA junction underestimates diameter","Confusing hepatic vein with IVC in transverse view","IVC size alone is a poor predictor in isolation — combine with clinical assessment","Tricuspid regurgitation: dilated IVC even in euvolemic patients"],
    grading:[{grade:"Small (< 2.1 cm) + > 50% collapse",size:"CVP 0–5 mmHg",significance:"Volume responsive — give fluids"},{grade:"Moderate (2.1–2.5 cm) + 25–50% collapse",size:"CVP 5–10 mmHg",significance:"Indeterminate — use dynamic measures"},{grade:"Large (> 2.5 cm) + < 25% collapse",size:"CVP ≥ 15 mmHg",significance:"Volume overloaded — tamponade, RHF, or tension PTX"}] },
  { id:"rv_dilation", title:"RV Dilation + McConnell Sign", protocol:"RUSH Pump Window", probe:"Phased array — apical 4-chamber, PLAX, PSAX", color:T.purple, urgency:"critical", svgType:"a4c", svgComponent:"cardiac",
    description:"Acute RV pressure overload from massive PE causes RV dilation and a characteristic wall motion pattern.",
    key_features:["RV:LV ratio > 0.9 in A4C view = significant RV dilation","McConnell Sign: RV free wall akinesis WITH preserved or hyperkinetic apex","Specificity of McConnell for PE: 94% — most specific echocardiographic finding","D-sign (PSAX): interventricular septum flattens or bows into LV ('D-shaped LV')","Tricuspid regurgitation jet: estimate RVSP via CW Doppler (TR + CVP)","Clot-in-transit: rare — highly mobile echogenic mass in RA/RV"],
    pitfalls:["RV dilation is not specific for PE — can occur in RV MI, acute cor pulmonale from any cause","McConnell sign: may also be seen in RV infarction — check ECG for inferior/posterior ST changes","Chronic PE: RV hypertrophy (>5 mm free wall) suggests chronic process, not acute"],
    grading:[{grade:"Mild RV Dilation",size:"RV:LV 0.6–0.9",significance:"Possible PE or increased RV afterload"},{grade:"Severe RV Dilation + McConnell",size:"RV:LV > 0.9 + pattern",significance:"Massive PE until proven otherwise — consider thrombolytics"},{grade:"D-sign (PSAX)",size:"Flattened/reversed IVS",significance:"RV pressure overload — PE, severe pulmonary hypertension"}] },
];

// ── POCUS Documentation Template ─────────────────────────────────────────────
const DOC_SECTIONS = [
  { id:"indication", label:"Indication", placeholder:"Reason for POCUS (e.g., undifferentiated shock, trauma evaluation, acute dyspnea, dyspnea + hypotension, pre-procedure guidance)" },
  { id:"protocol", label:"Protocol", placeholder:"Protocol used (e.g., RUSH, eFAST, BLUE, targeted cardiac, single-window)" },
  { id:"probe", label:"Probe / Frequency", placeholder:"Probe type and frequency (e.g., phased array cardiac probe 2–5 MHz, curvilinear 3–5 MHz, linear 10–14 MHz)" },
  { id:"operator", label:"Operator / Certification", placeholder:"Provider performing exam + POCUS credentialing level (e.g., EM attending, ABEM POCUS certified)" },
  { id:"cardiac", label:"Cardiac (Pump)", rows:6, placeholder:"Views obtained: subxiphoid 4-chamber, PLAX, PSAX, A4C\n\nFindings:\n- LV function: [ ] Hyperdynamic [ ] Normal [ ] Mildly reduced [ ] Severely reduced\n- Estimated EF: ___\n- Pericardial effusion: [ ] Absent [ ] Trace [ ] Small [ ] Moderate [ ] Large\n- RV size: [ ] Normal [ ] Mildly dilated [ ] Severely dilated\n- McConnell sign: [ ] Present [ ] Absent\n- Wall motion: [ ] Normal [ ] RWMA (territory: ___)" },
  { id:"ivc", label:"IVC / Volume (Tank)", placeholder:"IVC diameter (expiration): ___ cm\nIVC collapsibility: ___% \nEstimated CVP: [ ] Low (< 5) [ ] Normal (5–10) [ ] Elevated (> 10)\nFluid responsiveness: [ ] Likely responsive [ ] Indeterminate [ ] Not responsive" },
  { id:"aorta", label:"Aorta / DVT (Pipes)", placeholder:"Abdominal aorta: Diameter ___ cm\nAAA: [ ] None [ ] Present — size ___ cm\nBilateral femoral vein compression: [ ] Compressible (normal) [ ] Non-compressible RIGHT [ ] Non-compressible LEFT\nPopliteal vein: [ ] Compressible [ ] Non-compressible R [ ] Non-compressible L" },
  { id:"fast", label:"Peritoneal / FAST", placeholder:"[ ] Subxiphoid: [ ] No effusion [ ] Pericardial effusion ___\n[ ] RUQ Morrison's pouch: [ ] Negative [ ] Free fluid ___\n[ ] LUQ splenorenal: [ ] Negative [ ] Free fluid ___\n[ ] Pelvis: [ ] Negative [ ] Free fluid ___ cm depth\nOverall FAST: [ ] NEGATIVE [ ] POSITIVE (location: ___)" },
  { id:"lung", label:"Lung / Pleural (Air)", placeholder:"Right anterior (2nd ICS MCL): [ ] Sliding present [ ] Absent — lung point: [ ] Present [ ] Not identified\nLeft anterior (2nd ICS MCL): [ ] Sliding present [ ] Absent — lung point: [ ] Present [ ] Not identified\nB-lines: [ ] Absent [ ] Unilateral [ ] Bilateral (B-profile = pulmonary edema)\nPleural effusion: [ ] None [ ] Right ___ cm depth [ ] Left ___ cm depth" },
  { id:"limitations", label:"Technical Limitations", placeholder:"Document any factors limiting image quality (e.g., patient habitus, subcutaneous air, recent surgery, dressings, uncooperative patient, poor acoustic windows)" },
  { id:"interpretation", label:"Interpretation / Impression", rows:6, placeholder:"Primary findings and clinical interpretation:\n1.\n2.\n3.\n\nCorrelation with clinical presentation: [ ] Concordant [ ] Discordant (explain)\nFinal assessment:\n[ ] RUSH — most likely shock type: ___\n[ ] eFAST — positive/negative for each zone\n[ ] BLUE — profile: ___ → most likely diagnosis: ___" },
  { id:"plan", label:"Clinical Impact / Plan", rows:6, placeholder:"How POCUS findings changed management:\n- [ ] Confirmed working diagnosis\n- [ ] Changed diagnosis to ___\n- [ ] Guided fluid resuscitation decision\n- [ ] Expedited operative intervention\n\nActions taken based on POCUS:\n1.\n2." },
];
const DOC_QUICKFILL = [
  { label:"Normal RUSH", text:"No pericardial effusion. LV hyperdynamic. IVC < 2.1 cm with > 50% collapse. No free peritoneal fluid. Bilateral lung sliding present. RUSH impression: distributive physiology." },
  { label:"Tamponade", text:"Moderate-to-large circumferential pericardial effusion. Diastolic RV free wall collapse present. IVC plethoric, non-collapsing. Electrical alternans noted on concurrent ECG." },
  { label:"Cardiogenic Shock", text:"Severely reduced LV EF (estimated 15–20%). Dilated LV with globally impaired wall motion. No pericardial effusion. Plethoric IVC > 2.5 cm. Bilateral diffuse B-lines (pulmonary edema pattern)." },
  { label:"Tension PTX", text:"Absent lung sliding bilaterally (right > left). No lung point identified in initial scan. Tracheal deviation clinically evident. Plethoric IVC. Needle decompression performed." },
  { label:"Positive FAST (Trauma)", text:"Anechoic free fluid in Morrison's pouch (right hepatorenal space) measuring approximately 1.5 cm depth. LUQ and pelvis negative. Subxiphoid: no pericardial effusion. Bilateral lung sliding present." },
  { label:"Massive PE", text:"RV:LV ratio > 0.9 on A4C view. McConnell sign present (RV free wall akinesis with preserved apex). D-shaped LV on PSAX. IVC plethoric. Bilateral lung sliding present. CTPA confirmed massive PE." },
];

// ── Video Learning Library ────────────────────────────────────────────────────
const VIDEO_LIBRARY = [
  {
    category: "RUSH Protocol",
    color: T.coral,
    icon: "🚨",
    videos: [
      { title: "RUSH Exam — Complete Walkthrough", channel: "5 Minute Sono", duration: "11 min", tags:["RUSH","Shock","IVC"], url: "https://www.youtube.com/watch?v=L5s3QvRkiO8", thumb: "https://img.youtube.com/vi/L5s3QvRkiO8/mqdefault.jpg", description: "Full RUSH protocol step-by-step with pump, tank, pipes, peritoneal, and air windows demonstrated in real cases." },
      { title: "IVC Collapsibility & Volume Status", channel: "CoreUltrasound", duration: "8 min", tags:["IVC","Preload","Volume"], url: "https://www.youtube.com/watch?v=J8SFPYH1HJ4", thumb: "https://img.youtube.com/vi/J8SFPYH1HJ4/mqdefault.jpg", description: "Dynamic IVC assessment: collapsibility index, sniff test, and clinical correlation in spontaneously breathing patients." },
      { title: "Cardiogenic vs Distributive Shock — POCUS", channel: "EM Docs", duration: "14 min", tags:["Cardiogenic","Sepsis","Shock"], url: "https://www.youtube.com/watch?v=OuEFq4JZQRQ", thumb: "https://img.youtube.com/vi/OuEFq4JZQRQ/mqdefault.jpg", description: "Using cardiac POCUS to differentiate shock types: hyperdynamic vs severely depressed LV, pericardial effusion, and tamponade." },
      { title: "Pericardial Effusion & Tamponade", channel: "ACEP eLearning", duration: "9 min", tags:["Tamponade","Cardiac","Effusion"], url: "https://www.youtube.com/watch?v=xhECbKXB3tg", thumb: "https://img.youtube.com/vi/xhECbKXB3tg/mqdefault.jpg", description: "Identifying pericardial effusion, RV diastolic collapse, and differentiating from pleural effusion in the PLAX view." },
    ]
  },
  {
    category: "BLUE Protocol",
    color: T.blue,
    icon: "💨",
    videos: [
      { title: "BLUE Protocol — Lichtenstein Lecture", channel: "SMACC Conference", duration: "17 min", tags:["BLUE","Lung","Dyspnea"], url: "https://www.youtube.com/watch?v=R6ZTBm93Xqo", thumb: "https://img.youtube.com/vi/R6ZTBm93Xqo/mqdefault.jpg", description: "Dr. Daniel Lichtenstein explains the original BLUE protocol for acute respiratory failure — A, B, B', A', C, and PLAPS profiles." },
      { title: "Lung Sliding — Normal vs Absent", channel: "CoreUltrasound", duration: "6 min", tags:["Lung Sliding","PTX","Pleura"], url: "https://www.youtube.com/watch?v=JhMoAPvQHQ8", thumb: "https://img.youtube.com/vi/JhMoAPvQHQ8/mqdefault.jpg", description: "How to identify lung sliding at the pleural line, use M-mode (seashore vs barcode sign), and locate the lung point for PTX confirmation." },
      { title: "B-Lines — Interstitial Edema", channel: "SonoSite Education", duration: "7 min", tags:["B-Lines","CHF","ARDS"], url: "https://www.youtube.com/watch?v=rDctq3oIvK4", thumb: "https://img.youtube.com/vi/rDctq3oIvK4/mqdefault.jpg", description: "Recognizing B-lines (comet tails), counting per zone, bilateral vs unilateral patterns, and differentiating CHF from pneumonia." },
      { title: "Pleural Effusion — POCUS Identification", channel: "5 Minute Sono", duration: "8 min", tags:["Effusion","Pleural","Spine Sign"], url: "https://www.youtube.com/watch?v=fZy0RWr6PkY", thumb: "https://img.youtube.com/vi/fZy0RWr6PkY/mqdefault.jpg", description: "Posterior lung windows, spine sign, anechoic vs complex fluid, and quantifying effusion depth for thoracentesis planning." },
    ]
  },
  {
    category: "eFAST Protocol",
    color: T.yellow,
    icon: "🩺",
    videos: [
      { title: "eFAST Exam — Step by Step (Trauma)", channel: "Trauma Bay POCUS", duration: "12 min", tags:["eFAST","Trauma","Free Fluid"], url: "https://www.youtube.com/watch?v=2n6Xg-1Qfxw", thumb: "https://img.youtube.com/vi/2n6Xg-1Qfxw/mqdefault.jpg", description: "Complete 6-zone eFAST examination in trauma: RUQ, LUQ, pelvis, subxiphoid, and bilateral chest lung windows for pneumothorax." },
      { title: "Morrison's Pouch — Free Fluid RUQ", channel: "CoreUltrasound", duration: "5 min", tags:["RUQ","Morrison's","Hemoperitoneum"], url: "https://www.youtube.com/watch?v=PgjDjC_ZiHs", thumb: "https://img.youtube.com/vi/PgjDjC_ZiHs/mqdefault.jpg", description: "Identifying the hepatorenal interface, recognizing anechoic free fluid in Morrison's pouch, and pitfalls including isoechoic fresh clot." },
      { title: "Pelvic FAST — Pouch of Douglas", channel: "EM Ultrasound", duration: "6 min", tags:["Pelvis","FAST","Free Fluid"], url: "https://www.youtube.com/watch?v=TbKPFGSakdA", thumb: "https://img.youtube.com/vi/TbKPFGSakdA/mqdefault.jpg", description: "Suprapubic views in trauma: using the full bladder as acoustic window, identifying posterior fluid, and male vs female pelvic anatomy." },
      { title: "Pneumothorax — Lung Point & Barcode Sign", channel: "ACEP eLearning", duration: "9 min", tags:["PTX","Lung Point","M-mode"], url: "https://www.youtube.com/watch?v=F-pJA-2mLHo", thumb: "https://img.youtube.com/vi/F-pJA-2mLHo/mqdefault.jpg", description: "Diagnosing PTX with ultrasound: absent sliding, barcode sign on M-mode, lung point identification, and when to treat without waiting for imaging." },
    ]
  },
  {
    category: "Cardiac Views",
    color: T.cyan,
    icon: "❤️",
    videos: [
      { title: "Parasternal Long Axis (PLAX)", channel: "SonoSite Education", duration: "7 min", tags:["PLAX","Cardiac","LV"], url: "https://www.youtube.com/watch?v=KBqf8IuhR0k", thumb: "https://img.youtube.com/vi/KBqf8IuhR0k/mqdefault.jpg", description: "PLAX view acquisition, anatomy identification (LV, RV, LA, MV, AV), and qualitative EF assessment in the emergency setting." },
      { title: "Apical 4-Chamber & RV Dilation (PE)", channel: "CoreUltrasound", duration: "10 min", tags:["A4C","PE","McConnell"], url: "https://www.youtube.com/watch?v=YnJ7iCDMH9U", thumb: "https://img.youtube.com/vi/YnJ7iCDMH9U/mqdefault.jpg", description: "A4C view for RV:LV ratio, McConnell sign in massive PE, and differentiating RV dilation from RV infarction using echo patterns." },
    ]
  },
];

const TABS = [
  {id:"fast",    label:"FAST Exam",      icon:"🔍"},
  {id:"lung",    label:"Lung POCUS",     icon:"🫁"},
  {id:"cardiac", label:"Cardiac",        icon:"❤️"},
  {id:"rush",    label:"RUSH",           icon:"🚨"},
  {id:"blue",    label:"BLUE",           icon:"💨"},
  {id:"efast",   label:"eFAST",          icon:"🩺"},
  {id:"ref",     label:"Reference",      icon:"🖼️"},
  {id:"video",   label:"Video Learning",  icon:"🎬"},
  {id:"note",    label:"POCUS Note",     icon:"📋"},
];

// ── Primitives ────────────────────────────────────────────────────────────────
function AmbientBg() {
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0}}>
      <div style={{position:"absolute",top:"-15%",left:"-10%",width:"55%",height:"55%",background:"radial-gradient(circle,rgba(0,212,255,0.08) 0%,transparent 70%)"}}/>
      <div style={{position:"absolute",bottom:"-10%",right:"-5%",width:"50%",height:"50%",background:"radial-gradient(circle,rgba(0,229,192,0.07) 0%,transparent 70%)"}}/>
      <div style={{position:"absolute",top:"40%",left:"30%",width:"35%",height:"35%",background:"radial-gradient(circle,rgba(59,158,255,0.05) 0%,transparent 70%)"}}/>
    </div>
  );
}
function BulletRow({ text, color }) {
  return (
    <div style={{display:"flex",gap:7,alignItems:"flex-start",marginBottom:4}}>
      <span style={{color:color||T.teal,fontSize:8,marginTop:2,flexShrink:0}}>▸</span>
      <span style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.5}}>{text}</span>
    </div>
  );
}
function Badge({ label, color }) {
  return (
    <span style={{fontFamily:"JetBrains Mono",fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:20,background:`${color}18`,border:`1px solid ${color}44`,color,textTransform:"uppercase",letterSpacing:1,whiteSpace:"nowrap"}}>
      {label}
    </span>
  );
}
function UrgencyBadge({ urgency }) {
  const map = {critical:{color:T.red,label:"CRITICAL"},high:{color:T.coral,label:"HIGH"},moderate:{color:T.yellow,label:"MOD"},normal:{color:T.green,label:"NORMAL"}};
  const m = map[urgency]||map.normal;
  return <Badge label={m.label} color={m.color}/>;
}

// ── FAST SVG Schematics ───────────────────────────────────────────────────────
function FastSvg({ type, showAbn }) {
  const sv = {borderRadius:8,width:"100%",display:"block"};
  const ab = showAbn;
  if (type==="ruq") return (
    <svg viewBox="0 0 180 110" style={sv}>
      <rect width="180" height="110" fill="#04080f" rx="7"/>
      <text x="6" y="10" fill="#1e3a5a" fontSize="7" fontFamily="monospace">CURV 3.5MHz 18cm</text>
      <path d="M10 20 Q90 14 172 20" stroke="#2a4060" strokeWidth="1" fill="none"/>
      <ellipse cx="64" cy="62" rx="52" ry="38" fill="#3a5272" opacity="0.75"/>
      <ellipse cx="140" cy="65" rx="26" ry="33" fill="#1a2d45"/>
      <ellipse cx="140" cy="65" rx="17" ry="22" fill="#080e18"/>
      <line x1="100" y1="26" x2="107" y2="99" stroke="#c8ddf0" strokeWidth="2.5" opacity="0.9"/>
      {ab&&<path d="M 98 28 Q104 62 100 99 Q110 62 114 28 Z" fill="#001428" stroke="#00d4ff" strokeWidth="1.2" opacity="0.9"/>}
      {ab&&<text x="89" y="56" fill="#00d4ff" fontSize="7" fontFamily="monospace">FLUID</text>}
      <text x="26" y="55" fill="#6a8aaa" fontSize="8" fontFamily="monospace">LIVER</text>
      <text x="122" y="46" fill="#6a8aaa" fontSize="8" fontFamily="monospace">KID</text>
      <text x="6" y="107" fill={ab?"#ff4444":"#00e5c0"} fontSize="7" fontFamily="monospace">{ab?"ABNORMAL — HEMOPERITONEUM":"NORMAL — NO FREE FLUID"}</text>
    </svg>
  );
  if (type==="luq") return (
    <svg viewBox="0 0 180 110" style={sv}>
      <rect width="180" height="110" fill="#04080f" rx="7"/>
      <text x="6" y="10" fill="#1e3a5a" fontSize="7" fontFamily="monospace">CURV 3.5MHz 18cm</text>
      <ellipse cx="52" cy="63" rx="42" ry="38" fill="#4a3870" opacity="0.72"/>
      <ellipse cx="140" cy="65" rx="26" ry="33" fill="#1a2d45"/>
      <ellipse cx="140" cy="65" rx="17" ry="22" fill="#080e18"/>
      <line x1="88" y1="26" x2="95" y2="99" stroke="#c8ddf0" strokeWidth="2.5" opacity="0.9"/>
      {ab&&<path d="M 86 28 Q92 62 88 99 Q98 62 102 28 Z" fill="#001428" stroke="#00d4ff" strokeWidth="1.2" opacity="0.9"/>}
      {ab&&<text x="77" y="56" fill="#00d4ff" fontSize="7" fontFamily="monospace">FLUID</text>}
      <text x="18" y="56" fill="#6a8aaa" fontSize="8" fontFamily="monospace">SPLEEN</text>
      <text x="122" y="46" fill="#6a8aaa" fontSize="8" fontFamily="monospace">KID</text>
      <text x="6" y="107" fill={ab?"#ff4444":"#3b9eff"} fontSize="7" fontFamily="monospace">{ab?"ABNORMAL — SPLENORENAL FLUID":"NORMAL — NO FREE FLUID"}</text>
    </svg>
  );
  if (type==="pelvis") return (
    <svg viewBox="0 0 180 110" style={sv}>
      <rect width="180" height="110" fill="#04080f" rx="7"/>
      <text x="6" y="10" fill="#1e3a5a" fontSize="7" fontFamily="monospace">CURV 3.5MHz 15cm</text>
      <rect x="38" y="26" width="104" height="54" rx="9" fill="#0a1e3a" stroke="#3b9eff" strokeWidth="1.2" opacity="0.9"/>
      <text x="64" y="56" fill="#3b9eff" fontSize="8" fontFamily="monospace">BLADDER</text>
      {!ab&&<ellipse cx="90" cy="96" rx="32" ry="10" fill="#2a3e5a" opacity="0.8"/>}
      {!ab&&<text x="68" y="98" fill="#5a7a9a" fontSize="7" fontFamily="monospace">UTERUS</text>}
      {ab&&<path d="M 42 82 Q90 78 138 82 L138 100 Q90 104 42 100 Z" fill="#001428" stroke="#00d4ff" strokeWidth="1.2" opacity="0.9"/>}
      {ab&&<text x="62" y="94" fill="#00d4ff" fontSize="7" fontFamily="monospace">FREE FLUID</text>}
      <text x="6" y="107" fill={ab?"#ff4444":"#f5c842"} fontSize="7" fontFamily="monospace">{ab?"ABNORMAL — PELVIC FREE FLUID":"NORMAL — NO POSTERIOR FLUID"}</text>
    </svg>
  );
  if (type==="subcostal") return (
    <svg viewBox="0 0 180 110" style={sv}>
      <rect width="180" height="110" fill="#04080f" rx="7"/>
      <text x="6" y="10" fill="#1e3a5a" fontSize="7" fontFamily="monospace">CURV 3.5MHz 20cm</text>
      <ellipse cx="90" cy="64" rx="72" ry="44" fill="#0e1c30" opacity="0.6"/>
      {ab&&<ellipse cx="90" cy="64" rx="62" ry="36" fill="#001630" stroke="#00d4ff" strokeWidth="1.8" opacity="0.7"/>}
      {ab&&<text x="118" y="34" fill="#00d4ff" fontSize="7" fontFamily="monospace">EFFUSION</text>}
      <ellipse cx="78" cy="67" rx="30" ry="26" fill="#2a4060" opacity="0.9"/>
      <ellipse cx="112" cy="59" rx="14" ry="18" fill="#1a3050" opacity="0.9"/>
      <text x="64" y="69" fill="#6a8aaa" fontSize="8" fontFamily="monospace">LV</text>
      <text x="106" y="57" fill="#4a6a8a" fontSize="8" fontFamily="monospace">RV</text>
      <line x1="30" y1="26" x2="152" y2="24" stroke="#c8ddf0" strokeWidth="2" opacity="0.8"/>
      <text x="6" y="107" fill={ab?"#ff4444":"#ff6b6b"} fontSize="7" fontFamily="monospace">{ab?"ABNORMAL — PERICARDIAL EFFUSION":"NORMAL — NO PERICARDIAL FLUID"}</text>
    </svg>
  );
  return null;
}

// ── Lung SVG Schematics ───────────────────────────────────────────────────────
function LungSvg({ type }) {
  const sv = {borderRadius:8,width:"100%",display:"block"};
  if (type==="alines") return (
    <svg viewBox="0 0 180 110" style={sv}>
      <rect width="180" height="110" fill="#04080f" rx="7"/>
      <text x="6" y="10" fill="#1e3a5a" fontSize="7" fontFamily="monospace">LINEAR 7.5MHz — ANTERIOR</text>
      <path d="M8 20 Q90 16 174 20" stroke="#3a5a7a" strokeWidth="1" fill="none"/>
      <line x1="8" y1="32" x2="174" y2="32" stroke="#d0e8ff" strokeWidth="3" opacity="0.95"/>
      <text x="124" y="29" fill="#00e5c0" fontSize="7" fontFamily="monospace">PLEURAL LINE</text>
      <line x1="8" y1="50" x2="174" y2="50" stroke="#7a9aba" strokeWidth="1.8" opacity="0.75"/>
      <text x="148" y="47" fill="#4a6a8a" fontSize="7" fontFamily="monospace">A1</text>
      <line x1="8" y1="68" x2="174" y2="68" stroke="#4a6a8a" strokeWidth="1.2" opacity="0.55"/>
      <text x="148" y="65" fill="#2e4a6a" fontSize="7" fontFamily="monospace">A2</text>
      <line x1="8" y1="86" x2="174" y2="86" stroke="#2e4060" strokeWidth="0.8" opacity="0.35"/>
      <text x="148" y="83" fill="#1e2e4a" fontSize="7" fontFamily="monospace">A3</text>
      <text x="6" y="107" fill="#00e5c0" fontSize="7" fontFamily="monospace">A-LINE PATTERN — NORMAL / RULE OUT PTX</text>
    </svg>
  );
  if (type==="blines") return (
    <svg viewBox="0 0 180 110" style={sv}>
      <rect width="180" height="110" fill="#04080f" rx="7"/>
      <text x="6" y="10" fill="#1e3a5a" fontSize="7" fontFamily="monospace">PHASED 2MHz — LUNG ZONES</text>
      <line x1="8" y1="32" x2="174" y2="32" stroke="#d0e8ff" strokeWidth="2.5" opacity="0.95"/>
      <text x="124" y="29" fill="#3b9eff" fontSize="7" fontFamily="monospace">PLEURAL LINE</text>
      {[28,64,100,142].map(x => (
        <g key={x}>
          <line x1={x} y1="32" x2={x-5} y2="106" stroke="#e0f0ff" strokeWidth="2.8" opacity="0.85"/>
          <line x1={x} y1="32" x2={x-5} y2="106" stroke="#ffffff" strokeWidth="0.6" opacity="0.4"/>
        </g>
      ))}
      <text x="6" y="107" fill="#3b9eff" fontSize="7" fontFamily="monospace">B-LINES — INTERSTITIAL EDEMA / ARDS</text>
    </svg>
  );
  if (type==="ptx") return (
    <svg viewBox="0 0 180 110" style={sv}>
      <rect width="180" height="110" fill="#04080f" rx="7"/>
      <text x="6" y="10" fill="#1e3a5a" fontSize="7" fontFamily="monospace">M-MODE — PNEUMOTHORAX EVAL</text>
      {[18,22,26].map((y,i) => <path key={i} d={`M6 ${y} Q50 ${y+i*1.5} 174 ${y}`} stroke="#4a6a8a" strokeWidth="0.8" fill="none"/>)}
      <line x1="6" y1="42" x2="174" y2="42" stroke="#ff9f43" strokeWidth="2.5" opacity="0.9"/>
      <text x="116" y="40" fill="#ff9f43" fontSize="7" fontFamily="monospace">PLEURAL LINE</text>
      {[52,59,66,73,80,87,94,101].map(y => <line key={y} x1="6" y1={y} x2="174" y2={y} stroke="#3a5272" strokeWidth="1" opacity="0.8"/>)}
      <text x="10" y="66" fill="#ff9f43" fontSize="8" fontFamily="monospace">BARCODE SIGN</text>
      <text x="6" y="107" fill="#ff9f43" fontSize="7" fontFamily="monospace">ABSENT LUNG SLIDING — PNEUMOTHORAX</text>
    </svg>
  );
  if (type==="effusion") return (
    <svg viewBox="0 0 180 110" style={sv}>
      <rect width="180" height="110" fill="#04080f" rx="7"/>
      <text x="6" y="10" fill="#1e3a5a" fontSize="7" fontFamily="monospace">CURV 3.5MHz — POSTERIOR</text>
      <line x1="8" y1="30" x2="174" y2="30" stroke="#8aaccc" strokeWidth="1" opacity="0.5"/>
      <path d="M10 32 Q90 26 172 32 L172 72 Q90 76 10 72 Z" fill="#021020" stroke="#00d4ff" strokeWidth="1.5" opacity="0.9"/>
      <text x="62" y="56" fill="#00d4ff" fontSize="9" fontFamily="monospace">EFFUSION</text>
      <path d="M10 74 Q90 80 172 74 L174 102 L8 102 Z" fill="#2a3e58" opacity="0.75"/>
      <text x="52" y="94" fill="#6a8aaa" fontSize="8" fontFamily="monospace">DIAPHRAGM</text>
      <text x="6" y="107" fill="#00d4ff" fontSize="7" fontFamily="monospace">PLEURAL EFFUSION — SPINE SIGN</text>
    </svg>
  );
  return null;
}

// ── Cardiac SVG Schematics ────────────────────────────────────────────────────
function CardiacSvg({ type }) {
  const sv = {borderRadius:8,width:"100%",display:"block"};
  if (type==="plax") return (
    <svg viewBox="0 0 180 110" style={sv}>
      <rect width="180" height="110" fill="#04080f" rx="7"/>
      <text x="6" y="10" fill="#1e3a5a" fontSize="7" fontFamily="monospace">PHASED ARRAY 2MHz</text>
      <polygon points="90,16 10,105 170,105" fill="#0a1520" opacity="0.8"/>
      <rect x="20" y="24" width="144" height="20" rx="3" fill="#1a3050" stroke="#2a4060" strokeWidth="0.8"/>
      <text x="68" y="37" fill="#3a5272" fontSize="7" fontFamily="monospace">RV</text>
      <path d="M20 44 Q70 44 90 72 Q110 100 155 100 L155 44 Z" fill="#2a4060" opacity="0.85"/>
      <text x="52" y="72" fill="#6a8aaa" fontSize="8" fontFamily="monospace">LV</text>
      <path d="M130 50 Q155 50 160 72 L160 100 L135 100 Z" fill="#1e3552" opacity="0.8"/>
      <text x="134" y="76" fill="#4a6a8a" fontSize="7" fontFamily="monospace">LA</text>
      <line x1="90" y1="44" x2="130" y2="44" stroke="#c8ddf0" strokeWidth="1.5" opacity="0.7"/>
      <text x="96" y="40" fill="#8aaccc" fontSize="7" fontFamily="monospace">MV</text>
      <text x="6" y="107" fill="#00d4ff" fontSize="7" fontFamily="monospace">PARASTERNAL LONG AXIS (PLAX)</text>
    </svg>
  );
  if (type==="psax") return (
    <svg viewBox="0 0 180 110" style={sv}>
      <rect width="180" height="110" fill="#04080f" rx="7"/>
      <text x="6" y="10" fill="#1e3a5a" fontSize="7" fontFamily="monospace">PHASED ARRAY 2MHz</text>
      <circle cx="96" cy="62" r="44" fill="#2a4060" opacity="0.85"/>
      <circle cx="96" cy="62" r="34" fill="#0a1520"/>
      <circle cx="80" cy="72" r="7" fill="#3a5272"/>
      <circle cx="112" cy="72" r="7" fill="#3a5272"/>
      <path d="M30 38 Q34 62 30 86 Q18 62 30 38 Z" fill="#1a3050" stroke="#2a4060" strokeWidth="1"/>
      <text x="82" y="64" fill="#6a8aaa" fontSize="8" fontFamily="monospace">LV</text>
      <text x="14" y="65" fill="#3a5272" fontSize="7" fontFamily="monospace">RV</text>
      <text x="6" y="107" fill="#9b6dff" fontSize="7" fontFamily="monospace">SHORT AXIS — PAPILLARY LEVEL</text>
    </svg>
  );
  if (type==="a4c") return (
    <svg viewBox="0 0 180 110" style={sv}>
      <rect width="180" height="110" fill="#04080f" rx="7"/>
      <text x="6" y="10" fill="#1e3a5a" fontSize="7" fontFamily="monospace">PHASED ARRAY 2MHz</text>
      <polygon points="90,14 10,105 170,105" fill="#0a1520" opacity="0.5"/>
      <line x1="90" y1="14" x2="90" y2="104" stroke="#2a4060" strokeWidth="0.8" opacity="0.6"/>
      <ellipse cx="60" cy="72" rx="28" ry="32" fill="#2a4060" opacity="0.85"/>
      <ellipse cx="122" cy="68" rx="20" ry="26" fill="#1a3050" opacity="0.85"/>
      <ellipse cx="60" cy="35" rx="24" ry="16" fill="#1e3a52" opacity="0.75"/>
      <ellipse cx="122" cy="33" rx="18" ry="14" fill="#162840" opacity="0.75"/>
      <text x="48" y="74" fill="#6a8aaa" fontSize="8" fontFamily="monospace">LV</text>
      <text x="112" y="70" fill="#4a5a7a" fontSize="8" fontFamily="monospace">RV</text>
      <text x="48" y="35" fill="#3a5a7a" fontSize="7" fontFamily="monospace">LA</text>
      <text x="112" y="31" fill="#2a4a62" fontSize="7" fontFamily="monospace">RA</text>
      <text x="6" y="107" fill="#ff6b6b" fontSize="7" fontFamily="monospace">APICAL 4-CHAMBER (A4C)</text>
    </svg>
  );
  if (type==="ivc") return (
    <svg viewBox="0 0 180 110" style={sv}>
      <rect width="180" height="110" fill="#04080f" rx="7"/>
      <text x="6" y="10" fill="#1e3a5a" fontSize="7" fontFamily="monospace">CURV 3.5MHz — SAGITTAL</text>
      <path d="M10 22 Q90 16 172 22" stroke="#2a4060" strokeWidth="1" fill="none"/>
      <rect x="134" y="36" width="34" height="50" rx="4" fill="#1a3050" stroke="#3b9eff" strokeWidth="1.2" opacity="0.8"/>
      <text x="136" y="63" fill="#3b9eff" fontSize="7" fontFamily="monospace">RA</text>
      <path d="M42 42 L134 42 L134 80 L42 80 Q36 61 42 42 Z" fill="#0a1e36" stroke="#3b9eff" strokeWidth="1.2" opacity="0.85"/>
      <text x="72" y="64" fill="#3b9eff" fontSize="9" fontFamily="monospace">IVC</text>
      <line x1="56" y1="46" x2="56" y2="76" stroke="#f5c842" strokeWidth="1.2" strokeDasharray="3,2"/>
      <text x="36" y="90" fill="#f5c842" fontSize="7" fontFamily="monospace">2 cm from RA</text>
      <text x="6" y="107" fill="#3dffa0" fontSize="7" fontFamily="monospace">IVC — VOLUME / PRELOAD ASSESSMENT</text>
    </svg>
  );
  if (type==="subcostal") return (
    <svg viewBox="0 0 180 110" style={sv}>
      <rect width="180" height="110" fill="#04080f" rx="7"/>
      <text x="6" y="10" fill="#1e3a5a" fontSize="7" fontFamily="monospace">CURV 3.5MHz — SUBXIPHOID</text>
      <ellipse cx="90" cy="62" rx="72" ry="44" fill="#0a1828" opacity="0.7"/>
      <ellipse cx="90" cy="62" rx="60" ry="34" fill="#001428" stroke="#ff4444" strokeWidth="2" strokeDasharray="4,3" opacity="0.7"/>
      <text x="118" y="32" fill="#ff4444" fontSize="7" fontFamily="monospace">EFFUSION</text>
      <ellipse cx="78" cy="65" rx="30" ry="26" fill="#2a4060" opacity="0.9"/>
      <ellipse cx="112" cy="56" rx="14" ry="18" fill="#1a3050" opacity="0.9"/>
      <text x="64" y="67" fill="#6a8aaa" fontSize="8" fontFamily="monospace">LV</text>
      <text x="106" y="55" fill="#4a6a8a" fontSize="8" fontFamily="monospace">RV</text>
      <text x="6" y="107" fill="#ff4444" fontSize="7" fontFamily="monospace">PERICARDIAL EFFUSION — TAMPONADE</text>
    </svg>
  );
  return null;
}

// ── Card Components ───────────────────────────────────────────────────────────
function FastCard({ win }) {
  const [expanded, setExpanded] = useState(false);
  const [showAbn, setShowAbn] = useState(false);
  return (
    <div style={{...glass,overflow:"hidden",borderTop:`3px solid ${win.color}`,marginBottom:0}}>
      <div style={{padding:"12px 14px 10px"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
          <span style={{fontSize:14}}>{win.icon}</span>
          <div style={{flex:1}}>
            <div style={{fontFamily:"Playfair Display",fontWeight:700,fontSize:13,color:win.color}}>{win.label}</div>
            <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,marginTop:1}}>{win.probe}</div>
          </div>
        </div>
        {(showAbn && win.imgAbn) || win.imgNormal ? (
          <img
            src={showAbn ? win.imgAbn : win.imgNormal}
            alt={`${win.label} ${showAbn ? "abnormal" : "normal"}`}
            style={{width:"100%",borderRadius:8,border:`1px solid ${showAbn ? T.red : win.color}33`,display:"block"}}
          />
        ) : (
          <FastSvg type={win.svgType} showAbn={showAbn}/>
        )}
        <div style={{display:"flex",gap:6,marginTop:8,alignItems:"center"}}>
          <button onClick={()=>setShowAbn(!showAbn)} style={{fontFamily:"JetBrains Mono",fontSize:9,fontWeight:700,padding:"4px 10px",borderRadius:8,border:`1px solid ${showAbn?T.red+"55":T.green+"55"}`,background:showAbn?`${T.red}14`:`${T.green}14`,color:showAbn?T.red:T.green,cursor:"pointer"}}>
            {showAbn?"● ABNORMAL":"● NORMAL"}
          </button>
          <button onClick={()=>setExpanded(!expanded)} style={{fontFamily:"DM Sans",fontSize:11,fontWeight:600,padding:"4px 10px",borderRadius:8,border:"1px solid rgba(42,79,122,0.4)",background:"transparent",color:T.txt3,cursor:"pointer",marginLeft:"auto"}}>
            {expanded?"▲ less":"▼ details"}
          </button>
        </div>
      </div>
      {expanded && (
        <div className="fade-in" style={{padding:"0 14px 14px",borderTop:"1px solid rgba(42,79,122,0.2)"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:10}}>
            <div style={{padding:"8px 10px",background:`${T.green}0d`,border:`1px solid ${T.green}22`,borderRadius:8}}>
              <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.green,fontWeight:700,letterSpacing:1,marginBottom:5}}>NORMAL</div>
              {win.normal.map((t,i)=><BulletRow key={i} text={t} color={T.green}/>)}
            </div>
            <div style={{padding:"8px 10px",background:`${T.red}0d`,border:`1px solid ${T.red}22`,borderRadius:8}}>
              <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.red,fontWeight:700,letterSpacing:1,marginBottom:5}}>ABNORMAL</div>
              {win.abnormal.map((t,i)=><BulletRow key={i} text={t} color={T.red}/>)}
            </div>
          </div>
          <div style={{marginTop:8,padding:"8px 10px",background:`${win.color}0a`,border:`1px solid ${win.color}22`,borderRadius:8}}>
            <span style={{fontFamily:"JetBrains Mono",fontSize:8,color:win.color,fontWeight:700,letterSpacing:1}}>PEARL </span>
            <span style={{fontFamily:"DM Sans",fontSize:11,color:T.txt2,lineHeight:1.5}}>{win.pearl}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function LungCard({ pat }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{...glass,overflow:"hidden",borderTop:`3px solid ${pat.color}`,marginBottom:0}}>
      <div style={{padding:"12px 14px 10px"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
          <span style={{fontSize:14}}>{pat.icon}</span>
          <div style={{flex:1}}>
            <div style={{fontFamily:"Playfair Display",fontWeight:700,fontSize:13,color:pat.color}}>{pat.label}</div>
            <div style={{fontFamily:"DM Sans",fontSize:10,color:T.txt4}}>{pat.sub}</div>
          </div>
          <Badge label={pat.badge} color={pat.badgeColor}/>
        </div>
        <LungSvg type={pat.svgType}/>
        <div style={{marginTop:8,fontFamily:"DM Sans",fontSize:11,color:T.txt2,lineHeight:1.5,fontStyle:"italic"}}>{pat.headline}</div>
        <button onClick={()=>setExpanded(!expanded)} style={{marginTop:8,fontFamily:"DM Sans",fontSize:11,fontWeight:600,padding:"4px 10px",borderRadius:8,border:"1px solid rgba(42,79,122,0.4)",background:"transparent",color:T.txt3,cursor:"pointer"}}>
          {expanded?"▲ less":"▼ details"}
        </button>
      </div>
      {expanded && (
        <div className="fade-in" style={{padding:"0 14px 14px",borderTop:"1px solid rgba(42,79,122,0.2)"}}>
          <div style={{marginTop:8}}>{pat.findings.map((t,i)=><BulletRow key={i} text={t} color={pat.color}/>)}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}>
            <div style={{padding:"7px 10px",background:`${T.green}0d`,border:`1px solid ${T.green}22`,borderRadius:8}}>
              <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.green,fontWeight:700,letterSpacing:1,marginBottom:4}}>NORMAL CONTEXT</div>
              <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt2,lineHeight:1.4}}>{pat.context_normal}</div>
            </div>
            <div style={{padding:"7px 10px",background:`${T.red}0d`,border:`1px solid ${T.red}22`,borderRadius:8}}>
              <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.red,fontWeight:700,letterSpacing:1,marginBottom:4}}>PATHOLOGICAL</div>
              <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt2,lineHeight:1.4}}>{pat.context_abnormal}</div>
            </div>
          </div>
          <div style={{marginTop:6,padding:"7px 10px",background:`${T.yellow}0a`,border:`1px solid ${T.yellow}22`,borderRadius:8}}>
            <span style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.yellow,fontWeight:700,letterSpacing:1}}>PEARL </span>
            <span style={{fontFamily:"DM Sans",fontSize:11,color:T.txt2,lineHeight:1.5}}>{pat.pearl}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function CardiacCard({ view }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{...glass,overflow:"hidden",borderTop:`3px solid ${view.color}`,marginBottom:0}}>
      <div style={{padding:"12px 14px 10px"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
          <span style={{fontSize:14}}>{view.icon}</span>
          <div style={{flex:1}}>
            <div style={{fontFamily:"Playfair Display",fontWeight:700,fontSize:13,color:view.color}}>{view.label}</div>
            <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,marginTop:1}}>{view.position}</div>
          </div>
          <span style={{fontFamily:"JetBrains Mono",fontSize:11,fontWeight:700,color:view.color,padding:"3px 8px",borderRadius:6,background:`${view.color}14`,border:`1px solid ${view.color}33`}}>{view.short}</span>
        </div>
        <CardiacSvg type={view.svgType}/>
        <button onClick={()=>setExpanded(!expanded)} style={{marginTop:8,fontFamily:"DM Sans",fontSize:11,fontWeight:600,padding:"4px 10px",borderRadius:8,border:"1px solid rgba(42,79,122,0.4)",background:"transparent",color:T.txt3,cursor:"pointer"}}>
          {expanded?"▲ less":"▼ details"}
        </button>
      </div>
      {expanded && (
        <div className="fade-in" style={{padding:"0 14px 14px",borderTop:"1px solid rgba(42,79,122,0.2)"}}>
          <div style={{marginTop:8}}>
            <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:view.color,fontWeight:700,letterSpacing:1,marginBottom:6}}>KEY FINDINGS</div>
            {view.keyFindings.map((t,i)=><BulletRow key={i} text={t} color={view.color}/>)}
          </div>
          <div style={{marginTop:8,padding:"8px 10px",background:`${T.yellow}0a`,border:`1px solid ${T.yellow}22`,borderRadius:8}}>
            <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.yellow,fontWeight:700,letterSpacing:1,marginBottom:5}}>PEARLS</div>
            {view.pearls.map((t,i)=><BulletRow key={i} text={t} color={T.yellow}/>)}
          </div>
        </div>
      )}
    </div>
  );
}

// ── RUSH Window Detail ────────────────────────────────────────────────────────
function RushWindowDetail({ win }) {
  return (
    <div className="fade-in" key={win.id}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <div>
          <div style={{...glass,padding:"16px 18px",marginBottom:12,borderTop:`3px solid ${win.color}`,background:`linear-gradient(135deg,${win.color}08,rgba(8,22,40,0.88))`}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
              <span style={{fontSize:22}}>{win.icon}</span>
              <div>
                <h3 style={{fontFamily:"Playfair Display",fontSize:17,fontWeight:700,color:win.color,margin:0}}>{win.label} — {win.sublabel}</h3>
                <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,marginTop:2}}>Probe: {win.probe} · {win.position}</div>
              </div>
            </div>
            <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:1.5,marginBottom:6}}>Views to Obtain</div>
            {win.views.map((v,i)=><BulletRow key={i} text={v} color={win.color}/>)}
          </div>
          <div style={{...glass,padding:"12px 16px",borderLeft:`3px solid ${T.yellow}`}}>
            <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.yellow,textTransform:"uppercase",letterSpacing:1.5,marginBottom:6}}>💎 Pearl</div>
            <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt,lineHeight:1.7}}>{win.pearl}</div>
          </div>
        </div>
        <div style={{...glass,padding:"16px 18px"}}>
          <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:1.5,marginBottom:12}}>Findings & Interpretation</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {win.findings.map((f,i)=>(
              <div key={i} style={{padding:"11px 13px",background:`${f.color}08`,border:`1px solid ${f.color}22`,borderRadius:10}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:5,gap:8}}>
                  <div style={{fontFamily:"DM Sans",fontWeight:700,fontSize:12,color:f.color}}>{f.label}</div>
                  <UrgencyBadge urgency={f.urgency}/>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  <div>
                    <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.txt4,textTransform:"uppercase",marginBottom:3}}>What You See</div>
                    <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt2,lineHeight:1.5}}>{f.appearance}</div>
                  </div>
                  <div>
                    <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:f.color,textTransform:"uppercase",marginBottom:3}}>Interpretation</div>
                    <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt,lineHeight:1.5,fontWeight:500}}>{f.interpretation}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function POCUSHub() {
  const navigate = useNavigate();
  const [tab,         setTab]         = useState("fast");
  const [rushWin,     setRushWin]     = useState("pump");
  const [blueIdx,     setBlueIdx]     = useState(0);
  const [efastStep,   setEfastStep]   = useState(null);
  const [findingId,   setFindingId]   = useState("pericardial_effusion");
  const [docValues,   setDocValues]   = useState({});
  const [copied,      setCopied]      = useState(false);

  const setDoc = (id, val) => setDocValues(prev => ({...prev, [id]:val}));

  const generateNote = () => {
    const lines = DOC_SECTIONS.filter(s=>docValues[s.id]).map(s=>`${s.label.toUpperCase()}:\n${docValues[s.id]}\n`);
    return `POINT-OF-CARE ULTRASOUND (POCUS) NOTE\nDate: ${new Date().toLocaleDateString()}\n\n${lines.join("\n")}`;
  };
  const copyNote = () => {
    navigator.clipboard.writeText(generateNote()).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2500);});
  };

  const activeRushWin = RUSH_WINDOWS.find(w=>w.id===rushWin);
  const activeFinding = ANNOTATED_FINDINGS.find(f=>f.id===findingId);

  return (
    <div style={{fontFamily:"DM Sans, sans-serif",background:T.bg,minHeight:"100vh",position:"relative",overflow:"hidden",color:T.txt}}>
      <AmbientBg/>
      <div style={{position:"relative",zIndex:1,maxWidth:1440,margin:"0 auto",padding:"0 16px"}}>

        {/* Header */}
        <div style={{padding:"18px 0 14px"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
            <div style={{backdropFilter:"blur(40px)",WebkitBackdropFilter:"blur(40px)",background:"rgba(5,15,30,0.9)",border:"1px solid rgba(42,79,122,0.6)",borderRadius:10,padding:"5px 12px",display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.cyan,letterSpacing:3}}>NOTRYA</span>
              <span style={{color:T.txt4,fontFamily:"JetBrains Mono",fontSize:10}}>/</span>
              <span style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.txt3,letterSpacing:2}}>POCUS HUB</span>
            </div>
            <div style={{height:1,flex:1,background:"linear-gradient(90deg,rgba(42,79,122,0.6),transparent)"}} />
            <button onClick={()=>navigate("/hub")} style={{padding:"5px 14px",borderRadius:8,background:"rgba(14,37,68,0.6)",border:"1px solid rgba(42,79,122,0.4)",color:T.txt2,fontFamily:"DM Sans",fontSize:12,fontWeight:600,cursor:"pointer",flexShrink:0}}>← Hub</button>
          </div>
          <h1 className="shimmer-text" style={{fontFamily:"Playfair Display",fontSize:"clamp(26px,4vw,42px)",fontWeight:900,letterSpacing:-1,lineHeight:1.1}}>POCUS Hub</h1>
          <p style={{fontFamily:"DM Sans",fontSize:12,color:T.txt3,marginTop:4}}>RUSH · BLUE · eFAST · FAST / Lung / Cardiac Reference · Image Library · Documentation Template</p>
        </div>

        {/* Stat Banner */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10,marginBottom:16}}>
          {[
            {label:"RUSH",          value:"5 Windows",  sub:"Pump·Tank·Pipes·Peri·Air",    color:T.coral},
            {label:"BLUE Protocol", value:"6 Profiles", sub:"Acute dyspnea diagnosis",      color:T.blue},
            {label:"eFAST",         value:"6 Zones",    sub:"Trauma hemostatic assessment", color:T.yellow},
            {label:"Lung Zones",    value:"8",          sub:"Bilateral 4-zone protocol",    color:T.teal},
            {label:"Lung Point",    value:"100%",       sub:"Specificity for PTX",          color:T.orange},
            {label:"IVC Cutoff",    value:"2.1 cm",     sub:">50% collapse = low RAP",      color:T.cyan},
            {label:"Findings DB",   value:"6 Entities", sub:"Annotated reference guide",    color:T.purple},
            {label:"POCUS Note",    value:"12 Fields",  sub:"Chart-ready documentation",    color:T.green},
          ].map((b,i)=>(
            <div key={i} style={{...glass,padding:"9px 13px",borderLeft:`3px solid ${b.color}`,background:`linear-gradient(135deg,${b.color}12,rgba(8,22,40,0.8))`,borderRadius:10}}>
              <div style={{fontFamily:"JetBrains Mono",fontSize:14,fontWeight:700,color:b.color,lineHeight:1}}>{b.value}</div>
              <div style={{fontFamily:"DM Sans",fontWeight:600,color:T.txt,fontSize:10,margin:"3px 0"}}>{b.label}</div>
              <div style={{fontFamily:"DM Sans",fontSize:9,color:T.txt4,lineHeight:1.3}}>{b.sub}</div>
            </div>
          ))}
        </div>

        {/* Tab Bar */}
        <div style={{...glass,padding:"6px",display:"flex",gap:4,marginBottom:16,flexWrap:"wrap"}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{flex:"1 1 auto",fontFamily:"DM Sans",fontWeight:600,fontSize:11,padding:"8px 6px",borderRadius:10,
                border:`1px solid ${tab===t.id?"rgba(0,212,255,0.5)":"transparent"}`,
                background:tab===t.id?"linear-gradient(135deg,rgba(0,212,255,0.18),rgba(0,212,255,0.07))":"transparent",
                color:tab===t.id?T.cyan:T.txt3,cursor:"pointer",textAlign:"center",transition:"all .15s",whiteSpace:"nowrap"}}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ── FAST Tab ── */}
        {tab==="fast" && (
          <div className="fade-in">
            <div style={{padding:"10px 14px",background:"rgba(0,229,192,0.06)",border:"1px solid rgba(0,229,192,0.2)",borderRadius:10,marginBottom:14,fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.7}}>
              📡 <strong style={{color:T.teal}}>eFAST Protocol:</strong> Extended FAST adds bilateral apical lung views (PTX) to the standard 4 windows. Toggle each window between <strong style={{color:T.green}}>NORMAL</strong> and <strong style={{color:T.red}}>ABNORMAL</strong> to see the sonographic difference. Sensitivity ~86% for hemoperitoneum; specificity ~98% in blunt abdominal trauma.
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:12}}>
              {FAST_WINDOWS.map(w=><FastCard key={w.id} win={w}/>)}
            </div>
          </div>
        )}

        {/* ── Lung Tab ── */}
        {tab==="lung" && (
          <div className="fade-in">
            <div style={{padding:"10px 14px",background:"rgba(59,158,255,0.06)",border:"1px solid rgba(59,158,255,0.2)",borderRadius:10,marginBottom:14,fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.7}}>
              🫁 <strong style={{color:T.blue}}>BLUE Protocol:</strong> Bilateral anterior scans with phased array or curvilinear at upper and lower anterior zones. Normal = A-lines + sliding. Edema = bilateral B-lines. PTX = absent sliding + A-lines + lung point. 8-zone protocol: 4 per side.
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:12}}>
              {LUNG_PATTERNS.map(p=><LungCard key={p.id} pat={p}/>)}
            </div>
          </div>
        )}

        {/* ── Cardiac Tab ── */}
        {tab==="cardiac" && (
          <div className="fade-in">
            <div style={{padding:"10px 14px",background:"rgba(0,212,255,0.06)",border:"1px solid rgba(0,212,255,0.2)",borderRadius:10,marginBottom:14,fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.7}}>
              ❤️ <strong style={{color:T.cyan}}>Goal-Directed Echo:</strong> Four core questions — Is the heart pumping? Is there tamponade? Is the RV dilated? Is the IVC collapsing? Phased array 2–4 MHz for parasternal/apical views; curvilinear acceptable for subxiphoid.
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:12}}>
              {CARDIAC_VIEWS.map(v=><CardiacCard key={v.id} view={v}/>)}
            </div>
          </div>
        )}

        {/* ── RUSH Tab ── */}
        {tab==="rush" && (
          <div className="fade-in">
            <div style={{...glass,padding:"12px 16px",marginBottom:14,borderLeft:`4px solid ${T.coral}`,background:"linear-gradient(135deg,rgba(255,107,107,0.07),rgba(8,22,40,0.88))"}}>
              <div style={{fontFamily:"Playfair Display",fontSize:18,fontWeight:700,color:T.coral}}>RUSH Exam</div>
              <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt3,marginTop:2}}>Rapid Ultrasound in SHock · Undifferentiated shock · Hypotension · Altered perfusion · Time: 2–5 minutes</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8,marginBottom:14}}>
              {RUSH_WINDOWS.map(w=>(
                <button key={w.id} onClick={()=>setRushWin(w.id)}
                  style={{...glass,padding:"12px 8px",border:`2px solid ${rushWin===w.id?w.color+"88":"rgba(42,79,122,0.35)"}`,
                    background:rushWin===w.id?`linear-gradient(135deg,${w.color}18,rgba(8,22,40,0.88))`:"rgba(8,22,40,0.78)",
                    cursor:"pointer",borderRadius:12,textAlign:"center",transition:"all .15s"}}>
                  <div style={{fontSize:20,marginBottom:4}}>{w.icon}</div>
                  <div style={{fontFamily:"JetBrains Mono",fontWeight:700,fontSize:13,color:rushWin===w.id?w.color:T.txt}}>{w.letter}</div>
                  <div style={{fontFamily:"DM Sans",fontSize:10,color:T.txt4,marginTop:2}}>{w.label}</div>
                  <div style={{fontFamily:"DM Sans",fontSize:10,color:T.txt4}}>{w.sublabel}</div>
                </button>
              ))}
            </div>
            {activeRushWin && <RushWindowDetail win={activeRushWin}/>}
          </div>
        )}

        {/* ── BLUE Tab ── */}
        {tab==="blue" && (
          <div className="fade-in">
            <div style={{...glass,padding:"12px 16px",marginBottom:14,borderLeft:`4px solid ${T.blue}`}}>
              <div style={{fontFamily:"Playfair Display",fontSize:18,fontWeight:700,color:T.blue}}>BLUE Protocol</div>
              <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt3,marginTop:2}}>Bedside Lung Ultrasound in Emergency · Acute dyspnea · Respiratory failure · Hypoxia of unknown etiology · Time: 3–5 minutes</div>
            </div>
            {/* Algorithm strip */}
            <div style={{...glass,padding:"14px 18px",marginBottom:14}}>
              <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:2,marginBottom:10}}>BLUE Protocol Decision Algorithm</div>
              <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:4}}>
                {[
                  {step:"A-Profile\n(sliding present)",color:T.green,arrow:"→ DVT?"},
                  {step:"DVT positive",color:T.orange,arrow:"→ PE"},
                  {step:"DVT negative",color:T.green,arrow:"→ COPD/Asthma"},
                  {step:"B-Profile\n(bilateral B-lines)",color:T.orange,arrow:"→ CHF"},
                  {step:"A' Profile\n(no sliding)",color:T.red,arrow:"→ PTX"},
                  {step:"PLAPS\n(posterior)",color:T.teal,arrow:"→ Pneumonia/Effusion"},
                ].map((s,i,arr)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",flexShrink:0}}>
                    <div style={{textAlign:"center",padding:"8px 10px",background:`${s.color}12`,border:`1px solid ${s.color}33`,borderRadius:8,minWidth:110}}>
                      <div style={{fontFamily:"DM Sans",fontWeight:700,fontSize:11,color:s.color,whiteSpace:"pre-line"}}>{s.step}</div>
                    </div>
                    {i<arr.length-1&&<div style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.txt4,margin:"0 4px",whiteSpace:"nowrap"}}>{s.arrow}</div>}
                  </div>
                ))}
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:14}}>
              {BLUE_PROFILES.map((p,i)=>(
                <button key={i} onClick={()=>setBlueIdx(i)}
                  style={{...glass,padding:"10px 12px",border:`2px solid ${blueIdx===i?p.color+"88":"rgba(42,79,122,0.35)"}`,
                    background:blueIdx===i?`${p.color}15`:"rgba(8,22,40,0.78)",cursor:"pointer",borderRadius:10,textAlign:"left",transition:"all .15s"}}>
                  <div style={{fontFamily:"DM Sans",fontWeight:700,fontSize:11,color:blueIdx===i?p.color:T.txt2}}>{p.label}</div>
                  <div style={{fontFamily:"DM Sans",fontSize:10,color:T.txt4,marginTop:3}}>{p.diagnosis.split("(")[0].trim()}</div>
                </button>
              ))}
            </div>
            {(()=>{
              const p = BLUE_PROFILES[blueIdx];
              return (
                <div className="fade-in" key={blueIdx} style={{...glass,padding:"18px 20px",borderTop:`3px solid ${p.color}`,background:`linear-gradient(135deg,${p.color}08,rgba(8,22,40,0.88))`}}>
                  <h3 style={{fontFamily:"Playfair Display",fontSize:20,fontWeight:700,color:p.color,margin:"0 0 10px 0"}}>{p.label}</h3>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:12}}>
                    <div style={{padding:"12px 14px",background:`${p.color}08`,border:`1px solid ${p.color}22`,borderRadius:10}}>
                      <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:p.color,textTransform:"uppercase",letterSpacing:1.5,marginBottom:6}}>Pattern</div>
                      <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt,lineHeight:1.6}}>{p.pattern}</div>
                    </div>
                    <div style={{padding:"12px 14px",background:"rgba(14,37,68,0.6)",border:"1px solid rgba(42,79,122,0.3)",borderRadius:10}}>
                      <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.yellow,textTransform:"uppercase",letterSpacing:1.5,marginBottom:6}}>Diagnosis</div>
                      <div style={{fontFamily:"DM Sans",fontSize:12,color:T.yellow,fontWeight:600,lineHeight:1.6}}>{p.diagnosis}</div>
                    </div>
                    <div style={{padding:"12px 14px",background:"rgba(14,37,68,0.6)",border:"1px solid rgba(42,79,122,0.3)",borderRadius:10}}>
                      <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.teal,textTransform:"uppercase",letterSpacing:1.5,marginBottom:6}}>Next Step</div>
                      <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.6}}>{p.nextStep}</div>
                    </div>
                  </div>
                  <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:1.5,marginBottom:6}}>Differential Diagnoses</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    {p.ddx.map((d,i)=>(
                      <span key={i} style={{padding:"4px 10px",borderRadius:20,background:`${p.color}15`,border:`1px solid ${p.color}33`,fontFamily:"DM Sans",fontSize:11,color:p.color}}>{d}</span>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ── eFAST Tab ── */}
        {tab==="efast" && (
          <div className="fade-in">
            <div style={{...glass,padding:"12px 16px",marginBottom:14,borderLeft:`4px solid ${T.yellow}`}}>
              <div style={{fontFamily:"Playfair Display",fontSize:18,fontWeight:700,color:T.yellow}}>eFAST — Extended FAST</div>
              <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt3,marginTop:2}}>Extended Focused Assessment with Sonography in Trauma · Trauma · Multi-system injury · Hemodynamic instability post-injury · Time: 2–3 minutes</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:14}}>
              {EFAST_STEPS.map((s,i)=>(
                <button key={i} onClick={()=>setEfastStep(efastStep===i?null:i)}
                  style={{...glass,padding:"12px 14px",border:`2px solid ${efastStep===i?T.yellow+"88":"rgba(42,79,122,0.35)"}`,
                    background:efastStep===i?"rgba(245,200,66,0.1)":"rgba(8,22,40,0.78)",cursor:"pointer",borderRadius:12,textAlign:"left",transition:"all .15s"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                    <div style={{width:24,height:24,borderRadius:"50%",background:"rgba(245,200,66,0.15)",border:"1px solid rgba(245,200,66,0.35)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <span style={{fontFamily:"JetBrains Mono",fontSize:10,fontWeight:700,color:T.yellow}}>{s.step}</span>
                    </div>
                    <div style={{fontFamily:"DM Sans",fontWeight:700,fontSize:12,color:efastStep===i?T.yellow:T.txt}}>{s.region}</div>
                  </div>
                  <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt3}}>{s.goal}</div>
                  <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,marginTop:4}}>Probe: {s.probe}</div>
                </button>
              ))}
            </div>
            {efastStep!==null && (()=>{
              const s = EFAST_STEPS[efastStep];
              return (
                <div className="fade-in" style={{...glass,padding:"16px 20px",marginBottom:14,borderTop:`3px solid ${T.yellow}`}}>
                  <div style={{fontFamily:"Playfair Display",fontSize:18,fontWeight:700,color:T.yellow,marginBottom:12}}>Step {s.step}: {s.region}</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                    <div style={{padding:"12px 14px",background:"rgba(61,255,160,0.07)",border:"1px solid rgba(61,255,160,0.2)",borderRadius:10}}>
                      <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.green,textTransform:"uppercase",letterSpacing:1.5,marginBottom:6}}>Negative (Normal)</div>
                      <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt,lineHeight:1.6}}>{s.findingNegative}</div>
                    </div>
                    <div style={{padding:"12px 14px",background:"rgba(255,107,107,0.08)",border:"1px solid rgba(255,107,107,0.25)",borderRadius:10}}>
                      <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.red,textTransform:"uppercase",letterSpacing:1.5,marginBottom:6}}>Positive (Abnormal)</div>
                      <div style={{fontFamily:"DM Sans",fontSize:12,color:T.coral,lineHeight:1.6,fontWeight:500}}>{s.findingPositive}</div>
                    </div>
                  </div>
                </div>
              );
            })()}
            <div style={{...glass,padding:"16px 18px"}}>
              <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.yellow,textTransform:"uppercase",letterSpacing:2,marginBottom:12}}>💎 eFAST Clinical Pearls</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {EFAST_PEARLS.map((p,i)=>(
                  <div key={i} style={{display:"flex",gap:8,padding:"9px 12px",background:"rgba(14,37,68,0.5)",border:"1px solid rgba(42,79,122,0.25)",borderRadius:9}}>
                    <span style={{color:T.yellow,flexShrink:0}}>▸</span>
                    <span style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.5}}>{p}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Reference Tab ── */}
        {tab==="ref" && (
          <div className="fade-in">
            <div style={{display:"grid",gridTemplateColumns:"200px 1fr",gap:14,alignItems:"start"}}>
              <div style={{...glass,padding:"12px",display:"flex",flexDirection:"column",gap:5}}>
                <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:2,marginBottom:4}}>Findings Library</div>
                {ANNOTATED_FINDINGS.map(f=>(
                  <button key={f.id} onClick={()=>setFindingId(f.id)}
                    style={{padding:"10px 12px",borderRadius:9,border:`1px solid ${findingId===f.id?f.color+"55":"transparent"}`,
                      background:findingId===f.id?`${f.color}12`:"transparent",cursor:"pointer",textAlign:"left",transition:"all .15s"}}>
                    <div style={{fontFamily:"DM Sans",fontWeight:700,fontSize:12,color:findingId===f.id?f.color:T.txt2}}>{f.title}</div>
                    <div style={{fontFamily:"DM Sans",fontSize:10,color:T.txt4,marginTop:2}}>{f.protocol}</div>
                  </button>
                ))}
              </div>
              {activeFinding && (
                <div className="fade-in" key={activeFinding.id} style={{display:"flex",flexDirection:"column",gap:12}}>
                  <div style={{...glass,padding:"16px 20px",borderTop:`4px solid ${activeFinding.color}`,background:`linear-gradient(135deg,${activeFinding.color}08,rgba(8,22,40,0.88))`}}>
                    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10,marginBottom:8}}>
                      <div>
                        <h2 style={{fontFamily:"Playfair Display",fontSize:22,fontWeight:700,color:activeFinding.color,margin:0}}>{activeFinding.title}</h2>
                        <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,marginTop:3}}>Protocol: {activeFinding.protocol} · Probe: {activeFinding.probe}</div>
                      </div>
                      <UrgencyBadge urgency={activeFinding.urgency}/>
                    </div>
                    <div style={{fontFamily:"DM Sans",fontSize:13,color:T.txt2,lineHeight:1.7}}>{activeFinding.description}</div>
                  </div>
                  {/* Live SVG schematic */}
                  <div style={{...glass,padding:"14px 18px",background:"rgba(5,15,30,0.9)"}}>
                    <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:2,marginBottom:10}}>Sonographic Schematic</div>
                    <div style={{maxWidth:300}}>
                      {activeFinding.svgComponent==="fast" && <FastSvg type={activeFinding.svgType} showAbn={activeFinding.svgShowAbn||false}/>}
                      {activeFinding.svgComponent==="lung" && <LungSvg type={activeFinding.svgType}/>}
                      {activeFinding.svgComponent==="cardiac" && <CardiacSvg type={activeFinding.svgType}/>}
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                    <div style={{...glass,padding:"14px 16px",borderLeft:`3px solid ${activeFinding.color}`}}>
                      <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:activeFinding.color,textTransform:"uppercase",letterSpacing:1.5,marginBottom:10}}>Key Features</div>
                      {activeFinding.key_features.map((f,i)=><BulletRow key={i} text={f} color={activeFinding.color}/>)}
                    </div>
                    <div style={{...glass,padding:"14px 16px",borderLeft:`3px solid ${T.orange}`}}>
                      <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.orange,textTransform:"uppercase",letterSpacing:1.5,marginBottom:10}}>⚠ Pitfalls</div>
                      {activeFinding.pitfalls.map((p,i)=><BulletRow key={i} text={p} color={T.orange}/>)}
                    </div>
                  </div>
                  <div style={{...glass,padding:"14px 18px"}}>
                    <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:2,marginBottom:10}}>Severity / Grading</div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:10}}>
                      {activeFinding.grading.map((g,i)=>{
                        const cols=[T.green,T.yellow,T.red]; const c=cols[i]||T.txt3;
                        return (
                          <div key={i} style={{padding:"10px 12px",background:`${c}08`,border:`1px solid ${c}22`,borderRadius:10}}>
                            <div style={{fontFamily:"DM Sans",fontWeight:700,fontSize:12,color:c,marginBottom:3}}>{g.grade}</div>
                            <div style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.txt3,marginBottom:5}}>{g.size}</div>
                            <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt2,lineHeight:1.5}}>{g.significance}</div>
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

        {/* ── POCUS Note Tab ── */}
        {tab==="note" && (
          <div className="fade-in">
            <div style={{...glass,padding:"12px 16px",marginBottom:14,borderLeft:`4px solid ${T.purple}`}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
                <div>
                  <div style={{fontFamily:"Playfair Display",fontSize:18,fontWeight:700,color:T.purple}}>POCUS Documentation Template</div>
                  <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt3,marginTop:2}}>Chart-ready POCUS note — complete relevant sections and copy to chart</div>
                </div>
                <button onClick={copyNote} style={{padding:"9px 20px",borderRadius:10,background:copied?`linear-gradient(135deg,${T.green},#27ae60)`:`linear-gradient(135deg,${T.purple},#7c3aed)`,border:"none",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"DM Sans",display:"flex",alignItems:"center",gap:8}}>
                  {copied?"✓ Copied!":"📋 Copy Full Note"}
                </button>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
              {DOC_SECTIONS.map(s=>(
                <div key={s.id} style={{...glass,padding:"14px 16px",borderTop:"2px solid rgba(155,109,255,0.3)"}}>
                  <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.purple,textTransform:"uppercase",letterSpacing:1.5,marginBottom:8}}>{s.label}</div>
                  <textarea
                    value={docValues[s.id]||""}
                    onChange={e=>setDoc(s.id,e.target.value)}
                    placeholder={s.placeholder}
                    rows={s.rows||4}
                    style={{width:"100%",background:"rgba(14,37,68,0.6)",border:"1px solid rgba(42,79,122,0.35)",borderRadius:9,padding:"10px 12px",color:T.txt,fontSize:12,lineHeight:1.7,resize:"vertical"}}
                    onFocus={e=>e.target.style.borderColor="rgba(155,109,255,0.5)"}
                    onBlur={e=>e.target.style.borderColor="rgba(42,79,122,0.35)"}
                  />
                </div>
              ))}
            </div>
            <div style={{...glass,padding:"14px 18px"}}>
              <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.teal,textTransform:"uppercase",letterSpacing:2,marginBottom:10}}>Quick Fill — Common Findings</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:10}}>
                {DOC_QUICKFILL.map((item,i)=>(
                  <div key={i} style={{padding:"10px 12px",background:"rgba(14,37,68,0.5)",border:"1px solid rgba(42,79,122,0.25)",borderRadius:9}}>
                    <div style={{fontFamily:"DM Sans",fontWeight:700,fontSize:11,color:T.teal,marginBottom:4}}>{item.label}</div>
                    <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt3,lineHeight:1.5,marginBottom:8}}>{item.text.substring(0,85)}…</div>
                    <button onClick={()=>setDoc("interpretation",(docValues["interpretation"]?docValues["interpretation"]+"\n\n":"")+item.text)}
                      style={{padding:"4px 10px",borderRadius:7,background:"rgba(0,229,192,0.1)",border:"1px solid rgba(0,229,192,0.25)",color:T.teal,fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"DM Sans"}}>
                      + Append to Interpretation
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Video Learning Tab ── */}
        {tab==="video" && (
          <div className="fade-in">
            <div style={{padding:"10px 14px",background:"rgba(155,109,255,0.06)",border:"1px solid rgba(155,109,255,0.2)",borderRadius:10,marginBottom:16,fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.7}}>
              🎬 <strong style={{color:T.purple}}>Video Learning Library:</strong> Curated high-yield POCUS education videos for RUSH, BLUE, and eFAST protocols. Click any card to open the video on YouTube. Focus on dynamic findings — IVC respiratory variation, lung sliding movement, and real-time fluid identification.
            </div>
            {VIDEO_LIBRARY.map((section, si) => (
              <div key={si} style={{marginBottom:24}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                  <div style={{height:1,width:24,background:`${section.color}55`,borderRadius:1}}/>
                  <span style={{fontSize:16}}>{section.icon}</span>
                  <span style={{fontFamily:"Playfair Display",fontSize:18,fontWeight:700,color:section.color}}>{section.category}</span>
                  <div style={{flex:1,height:1,background:`linear-gradient(90deg,${section.color}33,transparent)`}}/>
                  <span style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4}}>{section.videos.length} videos</span>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12}}>
                  {section.videos.map((vid, vi) => (
                    <a key={vi} href={vid.url} target="_blank" rel="noopener noreferrer" style={{textDecoration:"none"}}>
                      <div style={{...glass,overflow:"hidden",borderTop:`3px solid ${section.color}`,cursor:"pointer",transition:"all .2s",display:"flex",flexDirection:"column"}}
                        onMouseEnter={e=>e.currentTarget.style.transform="translateY(-3px)"}
                        onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>
                        <div style={{position:"relative",overflow:"hidden"}}>
                          <img src={vid.thumb} alt={vid.title} style={{width:"100%",display:"block",aspectRatio:"16/9",objectFit:"cover",background:"#04080f"}}
                            onError={e=>{ e.target.style.display="none"; }}/>
                          <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(5,15,30,0.85) 0%,transparent 60%)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                            <div style={{width:44,height:44,borderRadius:"50%",background:"rgba(255,255,255,0.15)",border:`2px solid ${section.color}`,backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>▶</div>
                          </div>
                          <div style={{position:"absolute",bottom:6,right:8,fontFamily:"JetBrains Mono",fontSize:9,fontWeight:700,color:"#fff",background:"rgba(0,0,0,0.7)",padding:"2px 6px",borderRadius:4}}>{vid.duration}</div>
                        </div>
                        <div style={{padding:"12px 14px 14px",flex:1,display:"flex",flexDirection:"column",gap:6}}>
                          <div style={{fontFamily:"Playfair Display",fontWeight:700,fontSize:13,color:T.txt,lineHeight:1.3}}>{vid.title}</div>
                          <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:section.color}}>{vid.channel}</div>
                          <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt3,lineHeight:1.5,flex:1}}>{vid.description}</div>
                          <div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:4}}>
                            {vid.tags.map((tag,ti)=>(
                              <span key={ti} style={{fontFamily:"JetBrains Mono",fontSize:9,padding:"2px 7px",borderRadius:20,background:`${section.color}14`,border:`1px solid ${section.color}33`,color:section.color}}>{tag}</span>
                            ))}
                          </div>
                          <div style={{marginTop:6,display:"flex",alignItems:"center",gap:6,fontFamily:"DM Sans",fontSize:11,fontWeight:600,color:section.color}}>
                            <span>Watch on YouTube</span>
                            <span style={{fontSize:13}}>↗</span>
                          </div>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            ))}
            <div style={{...glass,padding:"14px 18px",borderLeft:`3px solid ${T.purple}`}}>
              <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.purple,textTransform:"uppercase",letterSpacing:2,marginBottom:10}}>💡 Learning Tips</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:8}}>
                {[
                  {tip:"Watch IVC respiratory variation in real-time — the collapse you see is more informative than a still image.",icon:"💧"},
                  {tip:"Lung sliding appears as a shimmering 'ants marching' at the pleural line — impossible to fully appreciate from a schematic alone.",icon:"🫁"},
                  {tip:"Practice the M-mode seashore vs barcode sign until you can identify them instantly — it's a reflex skill in acute PTX.",icon:"📊"},
                  {tip:"RUSH exam should take < 3 minutes — watch experts to calibrate your time expectations and probe movements between windows.",icon:"⏱"},
                ].map((item,i)=>(
                  <div key={i} style={{display:"flex",gap:10,padding:"9px 12px",background:"rgba(14,37,68,0.5)",border:"1px solid rgba(42,79,122,0.25)",borderRadius:9}}>
                    <span style={{fontSize:16,flexShrink:0}}>{item.icon}</span>
                    <span style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.5}}>{item.tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{textAlign:"center",paddingBottom:24,paddingTop:14}}>
          <span style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,letterSpacing:1.5}}>
            NOTRYA POCUS HUB · RUSH (WEINGART 2012) · BLUE PROTOCOL (LICHTENSTEIN 2008) · eFAST (ATLS 11TH ED) · VERIFY ALL FINDINGS WITH CLINICAL CONTEXT
          </span>
        </div>
      </div>
    </div>
  );
}