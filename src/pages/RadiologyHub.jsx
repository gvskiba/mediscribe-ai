import { useState } from "react";
import { useNavigate } from "react-router-dom";

(() => {
  if (document.getElementById("rad-fonts")) return;
  const l = document.createElement("link"); l.id = "rad-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "rad-css";
  s.textContent = `
    @keyframes fadeSlide{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
    .rad-fade{animation:fadeSlide .22s ease forwards;}
    .rad-shimmer{background:linear-gradient(90deg,#e8f0fe 0%,#fff 30%,#00d4ff 52%,#9b6dff 72%,#e8f0fe 100%);background-size:250% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 5s linear infinite;}
    ::-webkit-scrollbar{width:3px;} ::-webkit-scrollbar-thumb{background:rgba(42,79,122,0.5);border-radius:2px;}
  `;
  document.head.appendChild(s);
})();

const T = {
  bg:"#050f1e", txt:"#e8f0fe", txt2:"#8aaccc", txt3:"#4a6a8a", txt4:"#2e4a6a",
  red:"#ff4444", coral:"#ff6b6b", orange:"#ff9f43", yellow:"#f5c842",
  green:"#3dffa0", teal:"#00e5c0", blue:"#3b9eff", purple:"#9b6dff", cyan:"#00d4ff",
};
const glass = {
  backdropFilter:"blur(24px) saturate(200%)",
  WebkitBackdropFilter:"blur(24px) saturate(200%)",
  background:"rgba(8,22,40,0.78)",
  border:"1px solid rgba(42,79,122,0.35)",
  borderRadius:14,
};

// ─── CXR DATA ─────────────────────────────────────────────────────────────────
const CXR_SYSTEMATIC = [
  {
    step:1, zone:"A — Airway", icon:"🫁", color:T.cyan,
    look:["Trachea midline — deviation away from PTX, toward atelectasis/collapse","Carina angle <70° (wider suggests LA enlargement)","Endotracheal tube tip: 3–5 cm above carina (check on every intubated CXR)","Subglottic narrowing — steeple sign in croup vs thumbprint sign in epiglottitis"],
    dontMiss:["Tracheal deviation in tension PTX (late sign)","Mainstem intubation — ETT too deep (right main > left main)","Tracheal mass causing airway narrowing"],
  },
  {
    step:2, zone:"B — Bones & Soft Tissue", icon:"🦴", color:T.blue,
    look:["Ribs: count posterior ribs systematically — look for fractures (axillary more common)","Clavicles: AC joint disruption, fractures","Scapulae: fracture = high-energy trauma","Soft tissues: subcutaneous emphysema (streaky lucency)","Spine: vertebral body height, alignment"],
    dontMiss:["Rib fractures 1–3 = major vessel injury until proven otherwise","Scapular fracture = high-energy mechanism, associated injuries common","Subcutaneous emphysema without visible PTX — may still be present"],
  },
  {
    step:3, zone:"C — Cardiac", icon:"🫀", color:T.coral,
    look:["Cardiothoracic ratio: normal <50% on PA (PA film only — AP overestimates)","Right heart border: right atrium","Left heart border: aortic knuckle → PA → LA appendage → LV","Cardiomegaly: globular silhouette suggests pericardial effusion","Aortic knob: widened >8 cm suggests aortopathy"],
    dontMiss:["Globular heart = pericardial effusion (effusion must be >250 mL to be visible on CXR)","Aortic knuckle calcification in aneurysm","Boot-shaped heart = RVH (TOF in peds)","Water-bottle heart + clear lungs = pericardial effusion (not cardiogenic pulmonary edema)"],
  },
  {
    step:4, zone:"D — Diaphragm", icon:"📐", color:T.orange,
    look:["Right hemidiaphragm: normally higher than left by 1.5–2.5 cm","Loss of right hemidiaphragm silhouette = right lower lobe pathology (RLL pneumonia, effusion)","Left hemidiaphragm: gastric bubble should be visible below","Free air under diaphragm — upright or lateral decubitus film","Hemidiaphragm elevation: phrenic nerve palsy, subphrenic process, splinting"],
    dontMiss:["Free air under diaphragm = bowel perforation until proven otherwise (may be subtle — thin crescent)","Diaphragmatic rupture post-trauma: bowel loops in chest","Elevated left hemidiaphragm without gastric bubble = phrenic nerve palsy or mass"],
  },
  {
    step:5, zone:"E — Edges (Pleura)", icon:"🔲", color:T.yellow,
    look:["Costophrenic angles: blunted = effusion (needs ~200 mL on PA, ~75 mL on lateral)","Pleural line: lucent stripe without lung markings = pneumothorax","Fissures: major oblique, minor horizontal (right only)","Pleural thickening vs effusion vs mass"],
    dontMiss:["Small PTX may be visible only at apices — look at lung apex bilaterally","Loculated effusion — may look like mass","Tension PTX: mediastinal shift AWAY from affected side","Mesothelioma: unilateral pleural thickening + effusion"],
  },
  {
    step:6, zone:"F — Fields (Lung Parenchyma)", icon:"🫧", color:T.purple,
    look:["Divide each lung into thirds: upper, middle, lower zones","Air bronchograms = consolidation (fluid in alveoli with patent bronchi)","Silhouette sign: loss of border = pathology in adjacent segment","Interstitial markings: Kerley B lines (horizontal lines at lung base = interstitial edema)","Ground glass opacity vs consolidation vs nodule vs mass","Hyperinflation: >6 posterior ribs above diaphragm, flat diaphragms = COPD/asthma"],
    dontMiss:["RUL consolidation in elderly = TB until proven otherwise","Perihilar bat-wing pattern = pulmonary edema","Unilateral effusion + mediastinal shift TOWARD = atelectasis; AWAY = large effusion/PTX","Silhouette sign: RML consolidation obscures right heart border; LLL obscures left hemidiaphragm"],
  },
];

const CXR_PATTERNS = [
  {
    pattern:"Lobar Consolidation", color:T.orange, urgency:"HIGH",
    appearance:"Homogeneous opacity in one lobe with air bronchograms, non-moveable",
    causes:["Community-acquired pneumonia (S. pneumoniae — most common lobar pattern)","Aspiration pneumonia (RLL in upright, RUL/posterior segments in supine)","Lung abscess (cavitation within consolidation)","Pulmonary infarction (wedge-shaped peripheral opacity — Hampton's hump)"],
    ddx:"Consolidation without air bronchograms: obstructive collapse (endobronchial lesion or mucus plug)",
    pearl:"Air bronchograms within opacity = alveolar process (consolidation). No air bronchograms + lobe volume loss = collapse (obstruction).",
  },
  {
    pattern:"Bilateral Perihilar Haze (Bat-Wing)", color:T.blue, urgency:"CRITICAL",
    appearance:"Bilateral symmetric central opacity spreading from hila, sparing periphery, with Kerley B lines",
    causes:["Cardiogenic pulmonary edema (most common)","ARDS — but tends to be more peripheral/diffuse","Uremic pulmonary edema","Alveolar proteinosis (chronic, bilateral, geographic opacity)"],
    ddx:"Cardiogenic (CTR >0.5, pleural effusions, Kerley B) vs ARDS (normal CTR, no effusions, more bilateral uniform)",
    pearl:"Kerley B lines = horizontal lines at lung bases <2cm long touching pleural surface = interstitial edema (PCWP >18). Kerley A lines = longer, fan toward hila.",
  },
  {
    pattern:"Pneumothorax", color:T.red, urgency:"CRITICAL",
    appearance:"Visible pleural line (thin white line) with absence of lung markings peripheral to it",
    causes:["Spontaneous (tall thin males, Marfan syndrome)","Traumatic (rib fractures, penetrating trauma)","Iatrogenic (central line, thoracentesis, PPV)","Secondary: emphysema, PCP, CF, TB"],
    ddx:"Skin fold artifact: extends beyond chest wall, no sharp white pleural line. Bullae: curved opacity, no pleural line.",
    pearl:"Tension PTX: mediastinal shift AWAY from PTX, depression of ipsilateral hemidiaphragm — TREAT CLINICALLY, do not wait for CXR.",
  },
  {
    pattern:"Pleural Effusion", color:T.cyan, urgency:"MODERATE",
    appearance:"Blunting of costophrenic angle (>200mL PA) with meniscus sign; homogeneous opacity layering dependently",
    causes:["Transudative: CHF, cirrhosis, hypoalbuminemia, Meigs","Exudative: parapneumonic, malignancy, PE, TB, pancreatitis","Hemothorax: trauma, aortic rupture, malignancy","Chylothorax: thoracic duct trauma, malignancy"],
    ddx:"Light's criteria: exudate if protein >0.5 (pleural/serum), LDH >0.6, or LDH >2/3 upper limit normal",
    pearl:"Massive unilateral effusion: if mediastinum shifts TOWARD effusion = atelectasis pulling it; if AWAY = effusion pushing it (or trapped lung).",
  },
  {
    pattern:"Diffuse Bilateral Infiltrates", color:T.purple, urgency:"CRITICAL",
    appearance:"Bilateral diffuse opacities — can be interstitial, alveolar, or mixed pattern",
    causes:["ARDS (PaO2/FiO2 <300, bilateral opacities, non-cardiogenic)","Bilateral pneumonia (COVID, PCP, influenza)","Pulmonary hemorrhage (diffuse alveolar hemorrhage)","Pulmonary edema — cardiogenic or non-cardiogenic"],
    ddx:"ARDS vs cardiogenic edema: CTR normal, no Kerley B, no effusions, ABG not improving with diuresis = ARDS",
    pearl:"PCP pneumonia: bilateral perihilar ground glass in immunocompromised (HIV, transplant) — may have pneumatoceles (thin-walled air cysts).",
  },
  {
    pattern:"Hilar Enlargement", color:T.yellow, urgency:"HIGH",
    appearance:"Unilateral or bilateral enlarged hila — vascular vs nodal vs mass",
    causes:["Bilateral symmetric: sarcoidosis (classic potato nodes), pulmonary HTN","Bilateral asymmetric: lymphoma, metastatic nodes","Unilateral: primary lung malignancy, TB, atypical pneumonia","Vascular: pulmonary artery dilation from PAH, post-stenotic dilation"],
    ddx:"Vascular vs nodal: vascular enlargement is pulsatile on fluoroscopy, tapers; nodal is lobulated, non-pulsatile",
    pearl:"Bilateral hilar lymphadenopathy (BHL) + clear lungs in young adult = sarcoidosis until proven otherwise. Add erythema nodosum = Löfgren syndrome.",
  },
  {
    pattern:"Pulmonary Nodule / Mass", color:T.orange, urgency:"HIGH",
    appearance:"Nodule <3 cm, mass ≥3 cm. Well-defined vs poorly-defined, calcified vs non-calcified",
    causes:["Benign: granuloma (TB, histoplasma — central/dense calcification), hamartoma (popcorn calc)","Malignant: primary lung cancer (spiculated, ill-defined), metastasis (multiple, bilateral, lower lobes)","Carcinoid: central, well-defined","Round pneumonia (peds)"],
    ddx:"Fleischner Society guidelines: size + patient risk factors determine follow-up CT timing (solid nodule <6mm low risk: no routine follow-up)",
    pearl:"Spiculated margin = malignancy until proven otherwise. Popcorn calcification = hamartoma (benign). Central calcification = old granuloma (benign).",
  },
  {
    pattern:"Mediastinal Widening", color:T.red, urgency:"CRITICAL",
    appearance:"Mediastinum >8 cm on PA CXR; loss of aortic knuckle definition; irregular mediastinal border",
    causes:["Traumatic aortic injury (most common in blunt deceleration)","Aortic aneurysm or dissection","Anterior: 4 T's — Thymoma, Teratoma/GCT, Thyroid, Terrible lymphoma","Middle: lymphadenopathy, esophageal pathology","Posterior: neurogenic tumors, vertebral pathology"],
    ddx:"AP film overestimates mediastinal width — repeat PA if possible. CT chest angiography for aortic pathology.",
    pearl:"In blunt trauma: widened mediastinum on CXR → CT angiography of chest immediately. First rib fracture = high-energy injury, great vessel injury risk.",
  },
];

// ─── CT HEAD DATA ─────────────────────────────────────────────────────────────
const CTH_SYSTEMATIC = [
  { step:1, zone:"Bone Windows", icon:"🦴", color:T.yellow,
    look:["Skull base: temporal bone fractures — look at petrous ridge, clivus","Calvarium: linear vs stellate vs depressed fractures","Facial bones: zygoma, orbital walls, Le Fort patterns","Air-fluid levels in sinuses (acute sinusitis, basilar skull fracture)","Pneumocephalus: air within skull = open injury until proven otherwise"],
    dontMiss:["Posterior fossa fractures extending to foramen magnum","Orbital blow-out fracture (inferior rectus entrapment = surgical emergency)","Temporal bone fracture through petrous = ossicular chain disruption"],
  },
  { step:2, zone:"Epidural Space", icon:"🔴", color:T.red,
    look:["Biconvex (lens-shaped) hyperdense collection = epidural hematoma (EDH)","Typically temporal location (middle meningeal artery)","Does NOT cross sutures (unlike SDH)","Lucid interval: loss of consciousness → clear → deterioration = classic EDH story","Active arterial bleeding: heterogeneous density, swirl sign"],
    dontMiss:["Temporal EDH with herniation: blown pupil = neurosurgical emergency","Posterior fossa EDH: sentinel headache, rapid deterioration","Bilateral EDH post-trauma"],
  },
  { step:3, zone:"Subdural Space", icon:"🟠", color:T.orange,
    look:["Crescent-shaped hyperdense collection = acute SDH","Crosses suture lines (unlike EDH)","Bilateral SDH in elderly = falls, anticoagulation","Isodense SDH (subacute 1–3 weeks): may be difficult to see — look for midline shift and sulcal effacement","Chronic SDH: hypodense, may have mixed density (re-bleeding)"],
    dontMiss:["Isodense bilateral SDH: midline may appear normal but cortex is displaced medially","Non-accidental trauma in children: interhemispheric SDH = shaken baby until proven otherwise","Rapidly expanding SDH: 'swirl sign' = active arterial bleeding"],
  },
  { step:4, zone:"Subarachnoid Space", icon:"🟡", color:T.yellow,
    look:["Hyperdensity in sulci, fissures, cisterns = subarachnoid hemorrhage (SAH)","Basal cisterns first: suprasellar, interpeduncular, ambient","'Thunderclap headache' — worst headache of life: CT first, then LP if CT negative","Fisher grade predicts vasospasm risk","Traumatic SAH: typically along convexities (vs aneurysmal: basal cisterns)"],
    dontMiss:["Aneurysmal SAH: middle cerebral artery bifurcation, anterior communicating artery (most common)","Perimesencephalic SAH: benign pattern, around midbrain — better prognosis","CT-negative SAH: 5–10% missed — LP at 6h, look for xanthochromia"],
  },
  { step:5, zone:"Brain Parenchyma", icon:"🧠", color:T.purple,
    look:["Gray-white differentiation: loss = early ischemic change","Hyperdense lesion: acute blood, calcification, tumor, or hyperdense MCA sign","Hypodense lesion: edema, infarct (becomes hypodense after 6–12h), old blood","ASPECTS score: 10 regions of MCA territory — score <6 = poor outcome with thrombolysis","Sulcal effacement and gyral swelling = cerebral edema"],
    dontMiss:["Dense MCA sign = thrombus in M1 segment — consider thrombectomy workup","Hyperdense basilar artery = basilar artery occlusion (devastating if missed)","Early ischemic changes: loss of insular ribbon, blurring of basal ganglia, sulcal effacement"],
  },
  { step:6, zone:"Ventricles & Midline", icon:"⬜", color:T.teal,
    look:["Midline shift: measure at septum pellucidum — >5 mm significant, >10 mm often surgical","Hydrocephalus: dilatation of ventricles relative to sulci — temporal horns >2 mm = hydrocephalus","Trapped fourth ventricle: posterior fossa mass","Intraventricular hemorrhage (IVH): hyperdensity in ventricles","Sulcal effacement: global vs focal edema"],
    dontMiss:["Transtentorial herniation: effacement of suprasellar cistern, uncal herniation","Upward cerebellar herniation: posterior fossa hypertension","Fourth ventricle shift = brainstem compression"],
  },
];

const CTH_PATTERNS = [
  {
    pattern:"Acute Ischemic Stroke — Early CT Signs", color:T.yellow, urgency:"CRITICAL",
    appearance:"Subtle hypodensity, loss of gray-white differentiation, sulcal effacement in vascular territory",
    findings:["Dense MCA sign (hyperdense artery, visible in first hours)","Loss of insular ribbon (earliest cortical sign)","Obscuration of lenticular nucleus (basal ganglia)","Sulcal effacement in affected territory","ASPECTS score: 10 minus number of affected regions"],
    pearl:"CT is INSENSITIVE for acute ischemia in first 6h (only 60% sensitive). Diffusion-weighted MRI is gold standard. Normal CT does NOT rule out stroke.",
    action:"RAPID protocol: door-to-CT <25 min, door-to-needle <60 min for tPA. CTA head/neck for large vessel occlusion (LVO) screening.",
  },
  {
    pattern:"Intracerebral Hemorrhage (ICH)", color:T.red, urgency:"CRITICAL",
    appearance:"Hyperdense intraparenchymal collection with surrounding edema, possible IVH or mass effect",
    findings:["Deep location (basal ganglia, thalamus) = hypertensive ICH most likely","Lobar location = amyloid angiopathy (elderly), tumor, AVM, coagulopathy","Spot sign on CTA = active extravasation (expansion risk >30%)","Hematoma volume: ABC/2 method (AxBxC/2 in mL)","IVH: poor prognosis, obstructive hydrocephalus risk"],
    pearl:"Hematoma expansion occurs in 30% within 24h — most in first 3h. BP target SBP <140 (INTERACT2). Spot sign on CTA predicts expansion.",
    action:"Reverse anticoagulation immediately. Neurosurgery consult for: cerebellar hemorrhage >3 cm, surgical accessible lobar ICH with deterioration, obstructive hydrocephalus.",
  },
  {
    pattern:"Subarachnoid Hemorrhage", color:T.orange, urgency:"CRITICAL",
    appearance:"Hyperdensity in basal cisterns, sylvian fissures, sulci — starfish pattern from ruptured aneurysm",
    findings:["Sensitivity: CT within 6h = 98%, drops to 85–90% by 24h","Aneurysmal SAH: perimesencephalic and basal cisterns most affected","IVH and hydrocephalus complicate 20–30%","Diffuse SAH with thick clot: high vasospasm risk (Fisher grade 3)","CT angiography identifies aneurysm in 90% of cases"],
    pearl:"Worst headache of life + normal CT → LP at 6h (xanthochromia) or CT angiography. 5–10% of SAH missed on CT. Re-rupture risk 20% in 24h — urgent angiography and intervention.",
    action:"Nimodipine 60 mg q4h (vasospasm prevention). Avoid hypotension. Neurosurgery + interventional neuroradiology STAT. Repeat CTA if initial negative.",
  },
  {
    pattern:"Epidural Hematoma (EDH)", color:T.red, urgency:"CRITICAL",
    appearance:"Biconvex hyperdense lens-shaped collection, typically temporal, does not cross suture lines",
    findings:["Middle meningeal artery injury (temporal bone fracture)","Does NOT cross suture lines (periosteum attached at sutures)","Lucid interval in 30% — DO NOT BE REASSURED","Active bleeding: heterogeneous 'swirl' sign","Herniation: uncal herniation, CN III palsy, blown pupil"],
    pearl:"Classic triad: head trauma + lucid interval + deterioration. Surgical threshold: >30 mL, thickness >15 mm, midline shift >5 mm. Even small temporal EDH can be fatal — neurosurgery consult for ALL EDH.",
    action:"Emergent neurosurgical evacuation. Do NOT delay for any reason if herniation signs present. Hyperventilate to PCO2 35 mmHg as temporizing measure.",
  },
  {
    pattern:"Acute Subdural Hematoma", color:T.orange, urgency:"CRITICAL",
    appearance:"Crescent-shaped hyperdense collection along cerebral convexity crossing suture lines",
    findings:["Crosses suture lines (unlike EDH)","Associated with severe brain injury (bridging vein rupture)","Midline shift often disproportionate to hematoma size (underlying brain injury)","Iso- or hypo-dense = subacute/chronic (1–3 weeks)","Bilateral SDH: elderly falls, anticoagulation, non-accidental trauma in infants"],
    pearl:"Acute SDH mortality 50–90% with herniation. Surgical threshold: thickness >10 mm OR midline shift >5 mm. Chronic SDH in elderly: may be bilateral, isodense — check midline closely.",
    action:"Neurosurgery consult. Acute SDH with herniation: craniotomy/craniectomy. Coagulopathy reversal critical.",
  },
  {
    pattern:"Cerebral Edema / Herniation", color:T.purple, urgency:"CRITICAL",
    appearance:"Diffuse sulcal effacement, loss of gray-white differentiation, cisternal compression",
    findings:["Global edema: effaced sulci, small ventricles, loss of basal cisterns","Uncal herniation: medial temporal lobe through tentorium → ipsilateral CN III palsy","Subfalcine herniation: cingulate gyrus under falx → ACA compression","Downward tonsillar herniation: through foramen magnum → brainstem compression = death","'Black cerebellum' on CT: reversal sign in severe anoxia (poor prognosis)"],
    pearl:"Loss of basal cisterns (suprasellar, perimesencephalic) = impending herniation — treat immediately. Osmotherapy: mannitol 1g/kg IV or 3% NaCl 250 mL bolus.",
    action:"ICP management: HOB 30°, hyperventilation PCO2 35 mmHg temporizing, mannitol or hypertonic saline, neurosurgery consult for decompressive craniectomy.",
  },
];

// ─── CT ABDOMEN DATA ──────────────────────────────────────────────────────────
const CTA_SYSTEMATIC = [
  { step:1, zone:"Bowel Gas Pattern (if plain film)", icon:"🌀", color:T.teal,
    look:["Normal gas in stomach, small bowel, colon","Small bowel >3 cm diameter = dilated","Colon >6 cm (cecum >9 cm) = dilated","Haustra (large bowel) vs valvulae conniventes (small bowel) differentiation","Free air: under diaphragm on upright, adjacent to liver on lateral decubitus"],
    dontMiss:["Sigmoid volvulus: coffee bean sign / bent inner tube","Cecal volvulus: kidney bean in LUQ","Sentinel loop: localized ileus adjacent to inflammatory process"],
  },
  { step:2, zone:"Liver", icon:"🟫", color:T.orange,
    look:["Hepatomegaly: >15 cm craniocaudal","Density: hypodense lesions (cyst, metastasis, abscess), hyperdense (hemangioma on portal phase)","Arterial phase: HCC enhances early, washes out on portal phase","Biliary ducts: intrahepatic bile ducts should not be visible","Pneumobilia: air in biliary tree = fistula, sphincterotomy, infection"],
    dontMiss:["Small HCC in cirrhotic liver: arterial enhancement with washout = LI-RADS 5","Liver abscess: fever + RUQ + thick-walled hypodense lesion with surrounding edema","Biliary dilation without stone = suspect distal obstruction (mass) until proven otherwise"],
  },
  { step:3, zone:"Gallbladder & Biliary", icon:"💛", color:T.yellow,
    look:["Gallstones: hyperdense (calcified) or hypodense relative to bile","Pericholecystic fluid + GB wall >3 mm + Murphy's sign = cholecystitis","Common bile duct: normal <7 mm (add 1 mm per decade over 60 post-cholecystectomy)","Choledocholithiasis: hyperdense stone in CBD","Pneumobilia: air in biliary tree (infection or post-procedure)"],
    dontMiss:["Emphysematous cholecystitis: air in GB wall = gas-forming organisms, diabetics — surgical emergency","Gallbladder perforation: pericholecystic collection, discontinuous wall","Mirizzi syndrome: stone in cystic duct compressing CBD"],
  },
  { step:4, zone:"Pancreas", icon:"🟣", color:T.purple,
    look:["Pancreatic head enlarges with Whipple procedure / mass","Pancreatic duct: normal <3 mm — dilation suggests obstruction","Peripancreatic stranding = pancreatitis","Necrosis: no enhancement after contrast — necrotizing pancreatitis","Walled-off necrosis (WON) vs pseudocyst (4 weeks+ after pancreatitis)"],
    dontMiss:["Pancreatic adenocarcinoma: hypodense head mass + dilated duct + dilated CBD (double duct sign)","Vascular involvement: abutment vs encasement of SMV/SMA = resectability","Acute necrotizing pancreatitis: CT severity index guides management"],
  },
  { step:5, zone:"Spleen", icon:"🔴", color:T.red,
    look:["Splenomegaly: >13 cm craniocaudal","Splenic lacerations: graded I–V (AAST scale)","Focal lesions: cyst (water density), hemangioma, lymphoma, metastasis","Perisplenic hematoma: sentinel clot sign adjacent to laceration","Splenic artery pseudoaneurysm: round enhancing focus adjacent to injury"],
    dontMiss:["Splenic laceration with active extravasation = splenic artery embolization or splenectomy","Grade IV–V: hilar devascularization, shattered spleen — operative management","Delayed splenic rupture: up to 2 weeks after initial injury"],
  },
  { step:6, zone:"Kidneys & Ureters", icon:"🫘", color:T.blue,
    look:["Nephrolithiasis: hyperdense calculi in collecting system (most visible without contrast)","Hydronephrosis: dilated pelvis and calyces","Renal masses: Bosniak classification for cysts; solid enhancement = malignancy until proven otherwise","Perinephric fat stranding = pyelonephritis or trauma","Renal laceration grading I–V (AAST)"],
    dontMiss:["Obstructing ureteral stone: dilated ureter down to stone level — check UVJ","Renal infarction: wedge-shaped cortical defect without enhancement","Collecting system injury: contrast extravasation on delayed phase"],
  },
  { step:7, zone:"Aorta & Vessels", icon:"🔴", color:T.red,
    look:["Aortic diameter: normal infrarenal <3 cm (AAA ≥3 cm, aneurysmal ≥5.5 cm)","Intimal flap = dissection — true vs false lumen","Active hemorrhage: hyperdense blush on arterial phase","Mesenteric ischemia: portal venous gas, pneumatosis, bowel wall thickening + non-enhancement","Venous thrombosis: filling defect in portal, mesenteric, or renal veins"],
    dontMiss:["Aortic transection: periaortic hematoma + mediastinal widening post-trauma","Mesenteric ischemia: bowel wall non-enhancement = ischemia until proven otherwise — mortality >50%","Portal venous gas = bowel ischemia or infection — often surgical emergency"],
  },
  { step:8, zone:"Bowel & Mesentery", icon:"🌀", color:T.teal,
    look:["Bowel wall thickness: normal <3 mm small bowel, <5 mm large bowel","Transition point in obstruction: follow collapsed to dilated bowel","Closed-loop obstruction: C-shaped or U-shaped dilated segment — high strangulation risk","Mesenteric fat stranding: adjacent to bowel = inflammation or ischemia","Free fluid: location and density (blood vs simple fluid vs contrast)"],
    dontMiss:["Closed-loop SBO with whirl sign = mesenteric twisting — urgent surgery","Free perforation: free air + free fluid without bowel dilation = perforation until proven otherwise","Cecal/appendiceal tumor causing obstruction — don't anchor on 'SBO' only"],
  },
];

const CTA_PATTERNS = [
  {
    pattern:"Appendicitis", color:T.orange, urgency:"HIGH",
    appearance:"Dilated appendix >6 mm, wall thickening, periappendiceal fat stranding, possible appendicolith",
    findings:["Appendix diameter >6 mm with wall thickening and enhancement","Periappendiceal fat stranding (almost always present with inflammation)","Appendicolith (fecalith): hyperdense structure at appendix base — higher perforation risk","Periappendiceal fluid or abscess","Loss of normal appendix on all images = perforated"],
    pearl:"Alvarado score guides pre-imaging probability. CT has 94–98% sensitivity. Perforated appendicitis: phlegmon or abscess — may manage non-operatively initially with interval appendectomy.",
    action:"Surgical consult. Non-perforated: appendectomy (laparoscopic). Perforated with abscess >3 cm: IR drainage + antibiotics ± interval appendectomy.",
  },
  {
    pattern:"Small Bowel Obstruction (SBO)", color:T.yellow, urgency:"HIGH",
    appearance:"Dilated small bowel >2.5–3 cm with decompressed distal bowel; transition point identified",
    findings:["Transition point: abrupt change from dilated to collapsed bowel","Most common cause: adhesions (history of prior surgery)","Closed-loop: C-shaped or U-shaped dilated segment, whirl sign of mesentery = strangulation risk","Ischemia signs: bowel wall thickening, non-enhancement, mesenteric edema, free fluid","Hernia: look at inguinal regions, umbilicus, and prior incision sites"],
    pearl:"Complete SBO with no gas in colon = urgent surgery. Closed-loop = emergent. Partial SBO (gas past transition) = trial of conservative management. CT transition point identifies cause in 80%.",
    action:"NGT decompression. Closed-loop or strangulation: emergent OR. Complete SBO without resolution in 48h: operative. Identify and treat underlying cause.",
  },
  {
    pattern:"Acute Pancreatitis / Necrotizing", color:T.red, urgency:"HIGH",
    appearance:"Peripancreatic fat stranding, pancreatic enlargement; necrosis = lack of enhancement",
    findings:["Pancreatic necrosis: >30% non-enhancement on contrast-enhanced CT","CT Severity Index (CTSI): 0–10 scale combining necrosis + Balthazar grade","Balthazar grade A–E: A=normal, B=focal enlargement, C=peripancreatic fat changes, D=single fluid collection, E=two+ fluid collections","Pseudocyst: >4 weeks, well-defined wall, liquid density","Walled-off necrosis: >4 weeks, mixed solid/liquid"],
    pearl:"CT not needed on admission if clinical diagnosis is clear and mild. Repeat CT at 72–96h if clinical deterioration. Infected necrosis: gas within necrosis or clinical sepsis despite antibiotics → percutaneous drainage or necrosectomy.",
    action:"Aggressive early IVF resuscitation (LR preferred). No antibiotics prophylactically. Infected necrosis: carbapenem + IR or surgical drainage. ERCP if biliary pancreatitis with cholangitis.",
  },
  {
    pattern:"Diverticulitis", color:T.teal, urgency:"MODERATE",
    appearance:"Sigmoid wall thickening with pericolonic fat stranding and diverticula; may have abscess or free air",
    findings:["Pericolonic fat stranding adjacent to sigmoid colon with diverticula","Abscess: rim-enhancing fluid collection (Hinchey II)","Free perforation: free air + free fluid without contained abscess (Hinchey III/IV) = surgical emergency","Modified Hinchey classification: I (phlegmon/abscess) → IV (feculent peritonitis)","Colovesical fistula: air in bladder without instrumentation"],
    pearl:"Uncomplicated (Hinchey I): outpatient antibiotics if no immunosuppression, tolerating PO, no high fever. Hinchey IIa (distant abscess): IV antibiotics ± IR drainage. Hinchey III/IV: emergent surgery.",
    action:"Hinchey I–II: antibiotics (cipro + flagyl or amox-clav). Hinchey IIb (>4 cm abscess): IR drainage. Hinchey III/IV: emergent OR (Hartmann's procedure or primary anastomosis with diversion).",
  },
  {
    pattern:"Abdominal Aortic Aneurysm / Rupture", color:T.red, urgency:"CRITICAL",
    appearance:"Infrarenal aortic dilation ≥3 cm; rupture: periaortic hematoma, retroperitoneal hemorrhage",
    findings:["AAA diameter: incidental finding <5.5 cm = surveillance; ≥5.5 cm (or rapidly expanding) = repair","Symptomatic AAA: pain + pulsatile mass + hypotension = ruptured until proven otherwise","Retroperitoneal hematoma: hyperdense periaortic collection obliterating fat planes","Active extravasation: contrast blush adjacent to aortic wall","Contained rupture: periaortic hematoma without free hemorrhage — can deteriorate suddenly"],
    pearl:"Ruptured AAA: CT only if hemodynamically STABLE. Unstable patient goes directly to OR. 'Crescent sign' (hyperdense blood within thrombus) = impending rupture. EVAR preferred for anatomically suitable patients.",
    action:"Type and crossmatch, massive transfusion protocol. Vascular surgery STAT. Hemodynamically unstable: OR without CT. Stable: CT to assess anatomy for EVAR vs open repair.",
  },
  {
    pattern:"Mesenteric Ischemia", color:T.red, urgency:"CRITICAL",
    appearance:"Bowel wall thickening + pneumatosis + portal venous gas ± non-enhancing bowel wall",
    findings:["Arterial occlusion (SMA): lack of arterial flow on CTA, bowel wall non-enhancement","Pneumatosis intestinalis: air within bowel wall — ominous sign of ischemia/necrosis","Portal venous gas: air in portal veins — highly specific for bowel necrosis","Non-occlusive mesenteric ischemia: bowel ischemia without vascular occlusion (low flow states)","Venous thrombosis: filling defect in SMV — can cause venous ischemia"],
    pearl:"Clinical presentation often out of proportion to exam — sudden severe periumbilical pain, minimal tenderness early ('pain out of proportion'). Lactic acidosis is a late sign. CT angiography: gold standard.",
    action:"Emergent vascular surgery + general surgery consult. Arterial SMA occlusion: catheter-directed thrombolysis vs surgical embolectomy. Bowel necrosis/perforation: emergent laparotomy.",
  },
  {
    pattern:"Retroperitoneal / Solid Organ Trauma", color:T.coral, urgency:"CRITICAL",
    appearance:"Perinephric/perihepatic/perisplenic hematoma; laceration; active extravasation (contrast blush)",
    findings:["Liver laceration: linear hypodense defects; active bleeding = hyperdense blush on arterial phase","Spleen laceration: AAST grade I–V; grade III+ often requires intervention","Kidney laceration: perinephric hematoma; collecting system injury (delayed contrast extravasation)","Retroperitoneal hematoma: zone I (central) = vascular injury; zone II (perinephric) = renal; zone III (pelvic) = pelvic fracture"],
    pearl:"Active extravasation on CTA = arterial injury requiring embolization or surgery. Solid organ injuries grade I–II: non-operative management in stable patients. Hemodynamic instability = OR directly.",
    action:"Hemodynamically stable: non-operative management with serial exams. Active arterial extravasation: IR angioembolization. Hemodynamically unstable: FAST + OR. Pelvic ring fracture: pelvic binder + angioembolization.",
  },
];

const TABS = [
  { id:"cxr",   label:"Chest X-Ray",   icon:"🫁", color:T.blue },
  { id:"cth",   label:"CT Head",       icon:"🧠", color:T.purple },
  { id:"cta",   label:"CT Abdomen",    icon:"🫃", color:T.teal },
];

function AmbientBg() {
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0}}>
      <div style={{position:"absolute",top:"-15%",left:"-10%",width:"55%",height:"55%",background:"radial-gradient(circle,rgba(0,212,255,0.08) 0%,transparent 70%)"}}/>
      <div style={{position:"absolute",bottom:"-10%",right:"-5%",width:"50%",height:"50%",background:"radial-gradient(circle,rgba(155,109,255,0.07) 0%,transparent 70%)"}}/>
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

function SystematicStep({ step }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{...glass,overflow:"hidden",marginBottom:8,borderTop:`3px solid ${step.color}`,border:`1px solid ${open?step.color+"55":"rgba(42,79,122,0.35)"}`}}>
      <div onClick={()=>setOpen(o=>!o)}
        style={{padding:"12px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:10,
          background:`linear-gradient(135deg,${step.color}08,rgba(8,22,40,0.9))`}}>
        <div style={{width:26,height:26,borderRadius:"50%",background:`${step.color}18`,border:`1px solid ${step.color}44`,
          display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"JetBrains Mono",fontSize:11,fontWeight:700,color:step.color,flexShrink:0}}>
          {step.step}
        </div>
        <span style={{fontSize:16}}>{step.icon}</span>
        <div style={{flex:1}}>
          <div style={{fontFamily:"Playfair Display",fontWeight:700,fontSize:14,color:step.color}}>{step.zone}</div>
        </div>
        <span style={{color:T.txt4,fontSize:12}}>{open?"▲":"▼"}</span>
      </div>
      {open && (
        <div className="rad-fade" style={{padding:"0 16px 14px",borderTop:"1px solid rgba(42,79,122,0.2)"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:12}}>
            <div>
              <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:step.color,textTransform:"uppercase",letterSpacing:1.5,marginBottom:7,fontWeight:700}}>What to Look For</div>
              {step.look.map((l,i)=><BulletRow key={i} text={l} color={step.color}/>)}
            </div>
            <div>
              <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.red,textTransform:"uppercase",letterSpacing:1.5,marginBottom:7,fontWeight:700}}>🚫 Don&apos;t Miss</div>
              {step.dontMiss.map((d,i)=><BulletRow key={i} text={d} color={T.red}/>)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PatternCard({ p }) {
  const [open, setOpen] = useState(false);
  const urgencyColor = p.urgency === "CRITICAL" ? T.red : p.urgency === "HIGH" ? T.orange : T.yellow;
  return (
    <div style={{...glass,overflow:"hidden",marginBottom:8,borderTop:`3px solid ${p.color}`,
      border:`1px solid ${open?p.color+"55":"rgba(42,79,122,0.35)"}`}}>
      <div onClick={()=>setOpen(o=>!o)}
        style={{padding:"13px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:12,
          background:`linear-gradient(135deg,${p.color}08,rgba(8,22,40,0.9))`}}>
        <div style={{flex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
            <div style={{fontFamily:"Playfair Display",fontWeight:700,fontSize:15,color:p.color}}>{p.pattern}</div>
            <span style={{fontFamily:"JetBrains Mono",fontSize:9,fontWeight:700,padding:"1px 7px",borderRadius:20,
              background:`${urgencyColor}18`,border:`1px solid ${urgencyColor}44`,color:urgencyColor}}>{p.urgency}</span>
          </div>
          <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt4,lineHeight:1.4}}>{p.appearance}</div>
        </div>
        <span style={{color:T.txt4,fontSize:12}}>{open?"▲":"▼"}</span>
      </div>
      {open && (
        <div className="rad-fade" style={{padding:"0 16px 16px",borderTop:"1px solid rgba(42,79,122,0.2)"}}>
          <div style={{marginTop:12,marginBottom:10}}>
            <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:p.color,textTransform:"uppercase",letterSpacing:1.5,marginBottom:7,fontWeight:700}}>Key Findings</div>
            {(p.findings||p.causes||[]).map((f,i)=><BulletRow key={i} text={f} color={p.color}/>)}
          </div>
          {p.ddx && (
            <div style={{padding:"8px 12px",background:"rgba(14,37,68,0.7)",border:"1px solid rgba(42,79,122,0.3)",borderRadius:9,marginBottom:10}}>
              <span style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.cyan,fontWeight:700,textTransform:"uppercase",letterSpacing:1.5}}>DDx: </span>
              <span style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2}}>{p.ddx}</span>
            </div>
          )}
          <div style={{display:"grid",gridTemplateColumns:p.action?"1fr 1fr":"1fr",gap:10}}>
            <div style={{padding:"9px 12px",background:`${p.color}0d`,border:`1px solid ${p.color}28`,borderRadius:9}}>
              <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:p.color,textTransform:"uppercase",letterSpacing:1.5,marginBottom:4,fontWeight:700}}>💎 Pearl</div>
              <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.6}}>{p.pearl}</div>
            </div>
            {p.action && (
              <div style={{padding:"9px 12px",background:`${T.teal}0d`,border:`1px solid ${T.teal}28`,borderRadius:9}}>
                <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.teal,textTransform:"uppercase",letterSpacing:1.5,marginBottom:4,fontWeight:700}}>✅ Action</div>
                <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.6}}>{p.action}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function RadiologyHub() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("cxr");
  const [view, setView] = useState("systematic"); // "systematic" | "patterns"

  const systematic = tab === "cxr" ? CXR_SYSTEMATIC : tab === "cth" ? CTH_SYSTEMATIC : CTA_SYSTEMATIC;
  const patterns   = tab === "cxr" ? CXR_PATTERNS   : tab === "cth" ? CTH_PATTERNS   : CTA_PATTERNS;
  const activeTab  = TABS.find(t => t.id === tab);

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
              <span style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.txt3,letterSpacing:2}}>RADIOLOGY HUB</span>
            </div>
            <div style={{height:1,flex:1,background:`linear-gradient(90deg,${T.cyan}55,transparent)`}}/>
            <button onClick={()=>navigate("/hub")} style={{padding:"5px 14px",borderRadius:8,background:"rgba(14,37,68,0.6)",border:"1px solid rgba(42,79,122,0.4)",color:T.txt2,fontFamily:"DM Sans",fontSize:12,fontWeight:600,cursor:"pointer",flexShrink:0}}>← Hub</button>
          </div>
          <h1 className="rad-shimmer" style={{fontFamily:"Playfair Display",fontSize:"clamp(26px,4vw,42px)",fontWeight:900,letterSpacing:-1,lineHeight:1.1}}>Radiology Interpretation Hub</h1>
          <p style={{fontFamily:"DM Sans",fontSize:12,color:T.txt3,marginTop:4}}>CXR · CT Head · CT Abdomen/Pelvis — Systematic approach · Classic patterns · Don't-miss diagnoses</p>
        </div>

        {/* Stat Banner */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10,marginBottom:16}}>
          {[
            {label:"CXR Patterns",   value:"8",          sub:"Systematic A–F approach", color:T.blue},
            {label:"CT Head",        value:"6 Patterns",  sub:"Stroke · Bleed · Herniation", color:T.purple},
            {label:"CT Abdomen",     value:"7 Patterns",  sub:"Bowel · Solid organs · Vascular", color:T.teal},
            {label:"Don't Miss Dx",  value:"30+",         sub:"Critical diagnoses per modality", color:T.red},
            {label:"View",           value:"Systematic",  sub:"Step-by-step + patterns", color:T.orange},
            {label:"Evidence-Based", value:"ACR / AAST",  sub:"Grading scales included", color:T.yellow},
          ].map((b,i)=>(
            <div key={i} style={{...glass,padding:"9px 13px",borderLeft:`3px solid ${b.color}`,background:`linear-gradient(135deg,${b.color}12,rgba(8,22,40,0.8))`,borderRadius:10}}>
              <div style={{fontFamily:"JetBrains Mono",fontSize:14,fontWeight:700,color:b.color,lineHeight:1}}>{b.value}</div>
              <div style={{fontFamily:"DM Sans",fontWeight:600,color:T.txt,fontSize:10,margin:"3px 0"}}>{b.label}</div>
              <div style={{fontFamily:"DM Sans",fontSize:9,color:T.txt4}}>{b.sub}</div>
            </div>
          ))}
        </div>

        {/* Modality Tabs */}
        <div style={{...glass,padding:"6px",display:"flex",gap:4,marginBottom:12}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{flex:"1 1 auto",fontFamily:"DM Sans",fontWeight:600,fontSize:12,padding:"10px 6px",
                borderRadius:10,border:`1px solid ${tab===t.id?t.color+"88":"transparent"}`,
                background:tab===t.id?`linear-gradient(135deg,${t.color}18,${t.color}07)`:"transparent",
                color:tab===t.id?t.color:T.txt3,cursor:"pointer",textAlign:"center",transition:"all .15s"}}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* View Toggle */}
        <div style={{display:"flex",gap:8,marginBottom:16}}>
          {["systematic","patterns"].map(v=>(
            <button key={v} onClick={()=>setView(v)}
              style={{padding:"8px 20px",borderRadius:20,fontFamily:"DM Sans",fontWeight:600,fontSize:12,cursor:"pointer",transition:"all .15s",
                background:view===v?`${activeTab.color}18`:"rgba(8,22,40,0.8)",
                border:`1px solid ${view===v?activeTab.color+"66":"rgba(42,79,122,0.4)"}`,
                color:view===v?activeTab.color:T.txt4}}>
              {v === "systematic" ? "🔍 Systematic Approach" : "🎯 Classic Patterns"}
            </button>
          ))}
          <span style={{marginLeft:"auto",fontFamily:"JetBrains Mono",fontSize:10,color:T.txt4,alignSelf:"center"}}>
            {view === "systematic" ? `${systematic.length} zones` : `${patterns.length} patterns`}
          </span>
        </div>

        {/* Content */}
        <div className="rad-fade" key={tab+view}>
          {view === "systematic" ? (
            <div>
              <div style={{padding:"10px 14px",background:`${activeTab.color}08`,border:`1px solid ${activeTab.color}22`,borderRadius:10,marginBottom:14,fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.7}}>
                🔍 <strong style={{color:activeTab.color}}>Systematic Approach:</strong> Work through every zone on every study — anchoring bias kills. Click each zone to expand findings and don't-miss diagnoses.
              </div>
              {systematic.map((s,i)=><SystematicStep key={i} step={s}/>)}
            </div>
          ) : (
            <div>
              <div style={{padding:"10px 14px",background:`${activeTab.color}08`,border:`1px solid ${activeTab.color}22`,borderRadius:10,marginBottom:14,fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.7}}>
                🎯 <strong style={{color:activeTab.color}}>Classic Patterns:</strong> High-yield pattern recognition — appearance, key findings, pearls, and immediate actions. Click any pattern to expand.
              </div>
              {patterns.map((p,i)=><PatternCard key={i} p={p}/>)}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{textAlign:"center",paddingBottom:24,paddingTop:14}}>
          <span style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,letterSpacing:1.5}}>
            NOTRYA RADIOLOGY HUB · ACR GUIDELINES · AAST TRAUMA GRADING · FOR EDUCATIONAL USE — ALWAYS CORRELATE CLINICALLY
          </span>
        </div>
      </div>
    </div>
  );
}