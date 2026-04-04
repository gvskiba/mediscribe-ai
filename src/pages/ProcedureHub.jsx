import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";

(() => {
  if (document.getElementById("proc-fonts")) return;
  const l = document.createElement("link"); l.id = "proc-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "proc-css";
  s.textContent = `
    *{box-sizing:border-box;margin:0;padding:0;}
    ::-webkit-scrollbar{width:3px;height:3px;}
    ::-webkit-scrollbar-track{background:transparent;}
    ::-webkit-scrollbar-thumb{background:rgba(42,79,122,0.5);border-radius:2px;}
    @keyframes fadeSlide{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
    @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
    .fade-in{animation:fadeSlide .22s ease forwards;}
    .p-spin{animation:spin 1s linear infinite;display:inline-block;}
    .shimmer-text{background:linear-gradient(90deg,#e8f0fe 0%,#fff 30%,#ff9f43 52%,#3b9eff 72%,#e8f0fe 100%);background-size:250% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 5s linear infinite;}
  `;
  document.head.appendChild(s);
})();

const T = {
  bg:"#050f1e", panel:"#081628", card:"#0b1e36",
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

// ── Procedure Data ────────────────────────────────────────────────
const PROCS = [
  {
    id:"cvc_ij", name:"Central Line — Internal Jugular", icon:"🩹", color:T.teal, cat:"vascular",
    time:"15–25 min", diff:"Moderate",
    setup:["Sterile gown, gloves, mask, cap — full barrier precautions mandatory","CVC kit (triple lumen or introducer), 10mL syringe, lidocaine 1%","US machine + sterile sleeve + gel — always use ultrasound guidance","Flush all lumens with NS before insertion; verify wire and dilator present","Prep chlorhexidine, large sterile drape, suture (2-0 silk), dressing kit","Patient: supine, 15–20° Trendelenburg, head rotated contralateral 30–45°"],
    steps:["US survey: identify IJ (compressible, no pulsations) lateral to carotid artery","Prep and drape: full sterile field, chlorhexidine × 2 passes, allow to dry","Local anesthesia: 1% lidocaine subcutaneous and along needle track","Finder needle (21g) under real-time US in-plane visualization — confirm IJ","Advance introducer needle at 45°, bevel up, with continuous gentle aspiration","Dark, non-pulsatile blood = venous — attach syringe to confirm free flow","Wire insertion: advance wire through needle under US, never force — confirm no ectopy on monitor","Dilate track over wire (1–2× dilation), maintain wire control at all times","Thread catheter over wire to appropriate depth (right: 13–15cm, left: 15–17cm)","Remove wire, confirm blood return from all lumens, flush and cap","CXR immediately post-procedure: confirm tip in distal SVC, no PTX"],
    complications:["Arterial puncture: bright red pulsatile blood — remove, hold pressure 10+ min, emergent vascular if expanding hematoma","Pneumothorax: sudden dyspnea post-procedure — CXR, needle decompression if tension, chest tube","Air embolism: Trendelenburg + left lateral decubitus — 100% O2, aspiration via CVC","Arrhythmia: wire too deep into RV — withdraw wire, arrhythmia resolves; persistent VT = ACLS","Catheter malposition: confirmed on CXR — reposition over wire if still in place"],
    monitoring:["CXR within 1h of insertion — tip at caval-atrial junction, no pneumothorax, no hematoma","Daily inspection of insertion site — erythema, drainage, crepitus","Change dressing q7d with chlorhexidine impregnated patch if no contamination","Line necessity reassessed daily — remove as soon as no longer indicated (CLABSI risk)"],
    pearl:"Never advance a CVC over a wire you cannot feel. If you lose wire control, the procedure stops. US guidance reduces arterial cannulation by 80% — always image. For left-sided IJ: tip depth 15–17cm to avoid looping in contralateral brachiocephalic.",
  },
  {
    id:"cvc_sc", name:"Central Line — Subclavian", icon:"🩹", color:T.cyan, cat:"vascular",
    time:"15–25 min", diff:"Moderate–Advanced",
    setup:["Full barrier precautions, CVC kit, US if available (landmark-guided more common here)","Position: supine, small roll between scapulae (opens clavicular space), ipsilateral arm at side","Trendelenburg 15° to engorge vein, head turned slightly contralateral","Chlorhexidine prep, full sterile drape, 1% lidocaine, 10mL syringe"],
    steps:["Landmark: needle entry at junction of medial and middle third of clavicle, 1cm inferior","Advance needle toward sternal notch, hugging inferior clavicular cortex","Bevel directed caudally — advance with gentle aspiration, never force","Dark non-pulsatile blood confirms venous entry — detach syringe, thumb over needle hub","Wire: advance 15–20cm, monitor for ectopy — withdraw if VT/PVCs develop","Dilate, thread catheter 14–16cm right side, 16–18cm left side","Confirm all lumens, CXR post-procedure"],
    complications:["Pneumothorax (highest risk site): any respiratory change post-procedure — CXR mandatory","Subclavian artery puncture: cannot compress — hematoma, hemothorax risk; angiography if expanding","Thoracic duct injury (left side): chylous drainage — TPN hold, CT surgery consult","Subclavian stenosis: long-term complication — avoid this site in dialysis patients"],
    monitoring:["CXR within 30 min of insertion — PTX window is early","Monitor breath sounds bilaterally immediately post-procedure","Avoid subclavian for dialysis-intent patients — preserves vessel for future fistula"],
    pearl:"Subclavian has the LOWEST infection rate of the three CVC sites and highest patient comfort — preferred for long-term central access. Highest PTX risk — always have a CXR before removing from the procedure suite. Avoid in coagulopathy (non-compressible site).",
  },
  {
    id:"cvc_fem", name:"Central Line — Femoral", icon:"🩹", color:T.blue, cat:"vascular",
    time:"10–20 min", diff:"Easiest",
    setup:["Full barrier precautions, CVC kit, US machine and sterile sleeve","Patient supine with slight leg abduction and external rotation","No Trendelenburg needed — venous pressure adequate in femoral","Prep widely: groin to mid-thigh, medial aspect"],
    steps:["US: identify femoral vein (medial to artery, compressible, augments with Valsalva)","Landmark fallback: NAVEL mnemonic — Nerve Artery Vein Empty Lymphatics medial-to-lateral","Needle entry 2–3cm below inguinal ligament, 45° angle, medial to femoral pulse","Advance with gentle aspiration until dark non-pulsatile blood returns","Wire, dilate, thread CVC — standard Seldinger technique","Confirm all lumens, suture securely (high-motion site), occlusive dressing"],
    complications:["Femoral artery puncture: compressible — manual pressure 10–15 min; pseudoaneurysm if not held","DVT: highest DVT risk of all CVC sites — remove as soon as alternative available","Infection: highest CLABSI rate — femoral should be replaced within 72h","Retroperitoneal hematoma: rare if above inguinal ligament entry — CT abdomen if expanding"],
    monitoring:["Daily reassessment for removal — femoral lines should not stay >72h if avoidable","Monitor distal pulses and limb perfusion after insertion","DVT surveillance in patients with prolonged femoral access"],
    pearl:"Femoral is the fastest, easiest, most accessible CVC site and ideal in cardiac arrest (compressors don't interfere). But it has the highest infection and DVT rates — it is a bridge line. Plan replacement to IJ or SC within 72h in any patient expected to survive.",
  },
  {
    id:"aline", name:"Arterial Line — Radial", icon:"❤️", color:T.red, cat:"vascular",
    time:"5–15 min", diff:"Easy–Moderate",
    setup:["20g angiocath (preferred) or arterial line kit, transducer/tubing pre-flushed","Wrist slightly dorsiflexed over a rolled towel — immobilize firmly","Chlorhexidine prep, sterile gloves (full barrier not mandatory for radial)","1% lidocaine 0.5mL intradermal — enough for anesthesia, not enough to obscure pulse","US machine if available — increases first-pass success significantly"],
    steps:["Palpate or US-locate radial pulse — 1–2cm proximal to wrist crease","Modified Allen test: optional, sensitivity limited but document if performed","Insert 20g angiocath at 30–45° bevel up, advance slowly until flash seen","Lower angle to 10–15° after flash, advance catheter off needle 2–3mm","Remove stylet — blood return confirms arterial position; connect transducer tubing","If no flow: pull back slowly with catheter slightly — may have passed through both walls","Secure with suture or adhesive anchor; cover with transparent dressing","Zero transducer at phlebostatic axis (right atrial level, 4th ICS, MAL)"],
    complications:["Arterial spasm/occlusion: hand ischemia, absent pulse, pallor — remove line, warm compress, papaverine","Hematoma: direct pressure 5 min; significant hematoma compresses radial nerve","Thrombosis with distal ischemia: emergent removal, vascular surgery consult","Accidental IV medication injection: catastrophic limb ischemia — clearly label all arterial lines"],
    monitoring:["Continuous waveform — dampened waveform indicates clot at tip, kinking, or air in circuit","Zero and level transducer each shift and after patient position changes","Distal perfusion check (color, temperature, cap refill) q2h","CLEARLY label tubing: 'ARTERIAL — DO NOT INJECT'"],
    pearl:"A dampened arterial waveform is either a clot at the tip, air in the circuit, or the transducer needs leveling. Fast flush test: square wave with clean oscillations = optimal system. Always label the line in red. Iatrogenic intra-arterial injection of medications is catastrophic and preventable.",
  },
  {
    id:"lp", name:"Lumbar Puncture", icon:"🔬", color:T.purple, cat:"neurological",
    time:"20–40 min", diff:"Moderate",
    setup:["LP tray with 20g or 22g spinal needle (3.5 inch for most adults)","4 collection tubes, manometer with 3-way stopcock, lidocaine 1%","Position: lateral decubitus fetal position (preferred) OR seated-leaning-forward","Fluoroscopy or US guidance if prior failed attempts or obesity","Pre-procedure: platelet count >50k, INR <1.5, no signs of elevated ICP (papilledema, focal deficits, AMS without explanation)"],
    steps:["Identify L3-L4 or L4-L5 interspace (iliac crest = L4 spinous process)","Midline approach: palpate spinous processes, target interspinous space","Chlorhexidine prep, sterile drape, local anesthesia to dermis and deeper","Introduce spinal needle bevel UP and parallel to longitudinal dural fibers (reduces PDPH)","Advance through skin → supraspinous lig → interspinous lig → ligamentum flavum → dura","'Pop' or 'give' sensation as dura is pierced — remove stylet, check for CSF flow","Attach manometer — opening pressure with patient relaxed (normal 8–20 cmH2O)","Collect: tube 1 (cell count), tube 2 (protein/glucose), tube 3 (culture), tube 4 (cell count)","Replace stylet before withdrawing needle — reduces PDPH incidence","Post-procedure: supine 1–4h (evidence weak but standard practice)"],
    complications:["PDPH (post-dural puncture headache): 10–40% — positional, frontal/occipital, nausea; caffeine, hydration, epidural blood patch if persistent >48h","Traumatic tap: blood-tinged CSF — tube 1 vs 4 (traumatic clears; SAH stays xanthochromic); xanthochromia centrifuge test if doubt","Herniation: rare if no pre-procedure imaging red flags; if signs develop — mannitol, hyperventilate, neurosurgery","Infection: meningitis risk from LP itself is <0.1%; use strict aseptic technique"],
    monitoring:["CSF appearance: clear (normal), cloudy (cells), xanthochromic yellow (blood pigments = SAH or traumatic old)","Tube 4 cell count: 0–5 WBC normal; >5 = pleocytosis; traumatic tap: subtract 1 WBC per 700 RBC","Opening pressure documented with patient relaxed — Valsalva or held breath falsely elevates","Headache post-procedure: assess position-dependence (PDPH) vs persistent (infection, re-bleed)"],
    pearl:"Traumatic LP: compare tube 1 and tube 4. True SAH — xanthochromia persists, RBC count doesn't clear. Always send tube 4 for cell count. If you're questioning SAH vs traumatic tap and the clinical story is compelling — LP does not rule out SAH with certainty. MRI FLAIR is more sensitive than CT for late SAH.",
  },
  {
    id:"thorac", name:"Thoracentesis", icon:"🫁", color:T.blue, cat:"thoracic",
    time:"20–40 min", diff:"Moderate",
    setup:["Thoracentesis kit or 14g angiocath + 3-way stopcock + 60mL syringe","US machine (mandatory for ED thoracentesis — reduces PTX by 90%)","Collection containers: tubes for chemistry, cell count, culture, cytology, pH","Patient: seated leaning forward over bedside table (upright preferred) OR lateral decubitus for intubated","Coag check: INR >2 consider FFP; platelets <25k consider transfusion first"],
    steps:["US: identify largest fluid pocket, mark skin entry site in real-time or immediately after scanning","Confirm: no liver, spleen, or lung in needle path; diaphragm position varies with respiration — scan both phases","Target: 1 rib-space below superior border of fluid collection, over superior margin of rib (avoids NVB)","Prep chlorhexidine, sterile drape, local anesthesia — infiltrate generously down to parietal pleura","Insert needle perpendicular to skin with constant aspiration — fluid confirms pleural entry","Advance catheter off needle (angiocath technique), remove needle, attach 3-way stopcock and tubing","Withdraw fluid: up to 1.5L safe; >1.5L re-expansion pulmonary edema risk (controversial, monitor symptoms)","Send: LDH, protein, glucose, pH, cell count + differential, culture, cytology if malignancy suspected"],
    complications:["Pneumothorax: post-procedure dyspnea — CXR; needle decompression if tension, chest tube if large","Re-expansion pulmonary edema: cough, frothy sputum during large volume drainage — stop, O2, diuresis","Hemothorax: intercostal artery injury — chest tube, CT surgery if expanding","Vasovagal: bradycardia + hypotension during procedure — supine, atropine 0.5mg if severe","Empyema seeding: rare with sterile technique; do not perform through infected skin"],
    monitoring:["Post-procedure CXR: PTX, residual effusion, lung re-expansion","O2 saturation during large-volume drainage","Fluid appearance: serous (transudaTE), cloudy (exudate/infection), milky (chylothorax), bloody (malignancy/trauma)","Light's criteria: exudate if LDH >200, fluid/serum LDH >0.6, fluid/serum protein >0.5"],
    pearl:"The needle goes over the top of the rib, not underneath — the intercostal neurovascular bundle runs under the inferior margin. US guidance is non-negotiable in emergency medicine — it halves pneumothorax risk. Always ask: 'Why is this effusion here?' Unexplained exudative effusion in a smoker = CT chest + cytology.",
  },
  {
    id:"para", name:"Paracentesis", icon:"🟤", color:T.orange, cat:"abdominal",
    time:"15–30 min", diff:"Easy–Moderate",
    setup:["Paracentesis kit or 15g paracentesis needle, vacuum bottles (3–4 for large volume)","US machine: identify fluid pocket, avoid bowel/vessels/adhesion sites","14g angiocath + 3-way stopcock + 60mL syringe for diagnostic tap","Preferred site: left lower quadrant (LLQ) — avoids inferior epigastric vessels","Coag: paracentesis is safe even with cirrhotic coagulopathy — FFP/platelets rarely needed"],
    steps:["US: confirm ascites, identify needle path clear of bowel loops and bladder","Mark site: LLQ 3–4cm medial and superior to ASIS (avoids inferior epigastric)","Prep chlorhexidine, sterile field, local anesthesia including peritoneum (sharp pain at this layer)","Z-track technique: skin traction before needle insertion reduces post-procedure leak","Insert 15g paracentesis needle or 14g angiocath perpendicular until dark yellow fluid","Advance catheter off needle (if angiocath), connect tubing to vacuum bottles","Drain 4–6L therapeutic; >5L: give albumin 6–8g per liter removed to prevent post-tap circulatory dysfunction","Diagnostic: 60mL minimum; send for cell count, albumin, total protein, culture (inoculate blood culture bottles at bedside)"],
    complications:["Bowel perforation: rare; if turbid brown fluid — culture, surgery consult, antibiotics","Bleeding: abdominal wall hematoma — US guidance reduces risk; avoid inferior epigastric artery","Post-tap circulatory dysfunction: hypotension 6–12h post large-volume tap — albumin prevents","Persistent leak from puncture site: Z-track technique prevents; figure-8 suture at skin if needed","SBP unmasked: infected ascites — PMN >250 cells/µL = SBP; start cefotaxime empirically"],
    monitoring:["Fluid appearance: yellow/straw (uncomplicated), cloudy (infection), milky (chylous), bloody (malignancy/trauma)","Cell count with differential: PMN >250 = SBP regardless of total cell count","SAAG (serum-ascites albumin gradient): ≥1.1 = portal hypertension, <1.1 = non-portal cause","Monitor BP and HR 4h post large-volume tap — watch for paracentesis-induced circulatory dysfunction"],
    pearl:"Inoculate culture bottles at the bedside — sensitivity increases from 40% to 80% for SBP diagnosis. Never miss SBP: any patient with ascites and fever, abdominal pain, or AMS gets a paracentesis before antibiotics, not after. Coagulopathy is NOT a contraindication — cirrhotic coag is balanced, not just anticoagulated.",
  },
  {
    id:"pericardio", name:"Pericardiocentesis", icon:"❤️‍🔥", color:T.red, cat:"thoracic",
    time:"10–20 min", diff:"Advanced",
    setup:["Pericardiocentesis kit or 16–18g spinal/angiocath needle, 60mL syringe","US machine (must): subxiphoid or apical window showing largest fluid collection","ECG monitor attached — ST elevation during needle advancement = epicardial contact","Resuscitation equipment immediately at bedside — arrest risk is real","Code status confirmed; consent if time permits; cardiac surgery awareness if available"],
    steps:["Position: HOB 30–45° (fluid shifts anteriorly and inferiorly)","US guided approach (preferred): choose window with largest anterior/inferior fluid collection","Subxiphoid approach (landmark): 45° angle aimed toward left shoulder, 1cm below xiphoid-costal junction","Insert needle slowly under real-time US visualization — always in-plane","Advance through skin, subcutaneous tissue, toward pericardial space","Agitated saline (bubbles): inject 3–5mL — confirms pericardial position on US","Seldinger technique: wire through needle, dilate, place drainage catheter over wire","Aspirate: clinical improvement (rising BP, improving pulsus) confirms therapeutic drainage","Leave drain in place; pigtail preferred over simple needle for ongoing drainage"],
    complications:["Ventricular puncture: blood aspirates but is bright red and may clot (vs non-clotting pericardial blood) — withdraw immediately","Coronary artery laceration: rare but catastrophic — sudden hemodynamic deterioration despite drainage, emergent OR","Pneumothorax: needle passes through pleura — CXR post-procedure","Arrhythmia: ST changes or VT during needle advancement = epicardial contact — withdraw and redirect"],
    monitoring:["Continuous ECG: ST elevation or PVCs = stop advancing","Serial bedside echo: confirm fluid reduction, look for re-accumulation","Drain output hourly: >200mL/h suggests ongoing bleeding — cardiac surgery consult","Pulsus paradoxus resolution: >10mmHg drop in SBP with inspiration should normalize post-drainage"],
    pearl:"Emergent pericardiocentesis for cardiac tamponade (Beck's triad, pulsus >20mmHg, shock) should not wait for formal echo. A positive bedside POCUS showing effusion + RV diastolic collapse = drain it. Keep the catheter in — tamponade from malignancy and uremia reaccumulates. US guidance turns this from a 50% complication rate to <5%.",
  },
  {
    id:"chesttube", name:"Chest Tube Thoracostomy", icon:"🫧", color:T.coral, cat:"thoracic",
    time:"15–30 min", diff:"Moderate–Advanced",
    setup:["Thoracostomy tray: 28–36Fr tube (hemothorax), 14–20Fr pigtail (air/effusion)","Connecting drainage system (Pleur-evac) primed with water, suction tubing","1% lidocaine 10–20mL, large-bore syringe, scalpel #10 blade, Kelly clamps × 2","Suture: 0-silk for tube anchoring, 2-0 nylon for purse-string or U-stitch","Position: lateral decubitus or supine, arm above head, 4th–5th ICS anterior axillary line"],
    steps:["Site: 4th–5th ICS, anterior axillary line (safe triangle: pectoralis anterior, lat dorsi posterior, above nipple line)","US: confirm fluid or air, mark safe entry point clear of liver/spleen","Prep chlorhexidine, full sterile field, local anesthesia generous — periosteum is painful","1–2cm transverse incision over superior margin of rib (above 5th rib)","Blunt dissection through chest wall layers using Kelly clamp — spread, not cut","Puncture parietal pleura with clamp tip — gush of air or fluid confirms entry","Finger sweep: insert index finger into pleural space — confirm no lung, no adhesions","Guide tube with clamp or by finger: aim posteriorly/basally for fluid, apically for air","Advance tube until all holes are within pleural space (no subcutaneous holes)","Anchor with 0-silk, connect to drainage system, confirm swinging with respiration"],
    complications:["Intraparenchymal placement: tube goes into lung — resistance, no drainage, CXR confirms; IR consultation","Diaphragmatic placement: abdominal organs aspirated — immediate removal, surgical consult","Suboptimal position: tube kinked in fissure — CXR, may need repositioning","Empyema (late): infection around tube — remove at 72h if no longer draining","Re-expansion pulmonary edema: rapid drainage of large chronic effusion — clamp at 1–1.5L"],
    monitoring:["CXR post-insertion: tube position, all side-holes inside chest, lung expansion","Drainage: output, character (serous, bloody, purulent), rate per hour","Air leak: continuous bubbling in water-seal = air leak — confirm tube not dislodged","Swinging with respiration: loss of swing = blocked tube or lung fully expanded","Suction: apply 20cmH2O wall suction for hemothorax/pneumothorax"],
    pearl:"Blunt dissection with finger sweep before tube insertion is the technique that prevents organ injury — the finger sweep is not optional. Size matters: 28–36Fr for hemothorax (clots block smaller tubes), 14–20Fr pigtail acceptable for simple effusion or PTX without blood. Always confirm tube position before leaving the patient.",
  },
  {
    id:"cric", name:"Cricothyrotomy — Surgical (SFB)", icon:"✂️", color:T.red, cat:"airway",
    time:"<3 min (scalpel-finger-bougie)", diff:"Advanced / Emergency",
    setup:["CRIC kit or scalpel (#10 or #20 blade), bougie, 6.0 cuffed ETT or 6.0 tracheostomy tube","10mL syringe for cuff inflation, tape or holder, suction immediately available","Position: neck hyperextended — roll under shoulders, head back","Assign airway assistant: hold neck stable, suction operator, someone watching SpO2","MUST have kit AT BEDSIDE for EVERY RSI — know where it is before you pick up the laryngoscope"],
    steps:["Identify cricothyroid membrane (CTM): inferior to thyroid cartilage, superior to cricoid","Stabilize larynx with non-dominant hand — 'laryngeal handshake': thumb and middle finger on thyroid cartilage","Vertical stab incision 3–4cm through skin and subcutaneous tissue over CTM","Horizontal stab incision through CTM itself — DO NOT go too deep (posterior tracheal wall)","Insert dominant index finger into trachea — feel for lumen, confirms position, stabilizes structure","Bougie: advance through CTM incision alongside finger, angled caudally, feel tracheal rings","Railroad 6.0 ETT over bougie into trachea — advance until cuff just past CTM","Inflate cuff, confirm placement (capnography, bilateral breath sounds), secure tube","Remove bougie, bag-valve, connect to ventilator"],
    complications:["False passage (most common): no capnography waveform — confirm tracheal position with finger or scope before bagging","Esophageal insertion: subcutaneous emphysema, no ETCO2 — remove and retry with better visualization","Bleeding: deep laryngeal vessels — maintain pressure, suction, once airway secured address hemostasis","Subcutaneous emphysema: tube cuff not seated or air leak — verify tube position and cuff inflation"],
    monitoring:["Waveform capnography confirmation is mandatory — SpO2 alone insufficient","Secure the tube aggressively: cricothyrotomy tubes can dislodge easily with patient movement","Lateral CXR or direct visualization to confirm ETT depth","ENT/head-neck surgery for formal tracheostomy conversion within 24–72h"],
    pearl:"SFB (Scalpel-Finger-Bougie) is the fastest and most reliable surgical airway technique. The finger into the trachea is everything — it confirms lumen, stabilizes the airway, and guides the bougie. Needle cric (14g angiocath) is a temporizing bridge only — it buys minutes, not an airway. Practice this on a model quarterly.",
  },
  {
    id:"cardio", name:"Cardioversion / Transcutaneous Pacing", icon:"⚡", color:T.yellow, cat:"cardiac",
    time:"5–15 min", diff:"Easy–Moderate",
    setup:["Defibrillator with pacing capability (Zoll, Lifepak), multi-function pads applied","Anterior-posterior pad placement preferred for cardioversion (AP) — anterior-lateral acceptable","IV access confirmed, O2 and suction at bedside, resuscitation medications drawn","Sedation for cardioversion: midazolam 1–2mg IV + fentanyl 25–50mcg IV (propofol 0.5mg/kg if trained)","Pacing: no sedation for emergency situations — titrate sedation as hemodynamics allow"],
    steps:["CARDIOVERSION: Confirm SYNC mode — verify sync markers on R-wave peaks on monitor","Announce 'charging' then 'all clear' — visually sweep everyone away from bed and equipment","Apply firm pad pressure if paddles; multifunction pads apply before powering on","Energy: AFib 120–200J; AFL/SVT 50–100J; stable VT 100–200J — escalate if no conversion","Discharge — if unsuccessful, increase energy by 50–100J and repeat","POST-SHOCK: Continue monitoring — confirm rhythm, document time and energy used","PACING: Set rate 60–80 bpm, mA at 0, increase output until electrical capture (wide QRS + T-wave after each spike)","Confirm MECHANICAL capture: palpate femoral or carotid — not just electrical on monitor","Sedation for pacing: midazolam + fentanyl or ketamine — pacing threshold is painful","Typical capture threshold: 40–80mA — maintain output 10mA above capture threshold"],
    complications:["Induced VF from unsynchronized shock: immediate defibrillation at 200J","Skin burns: multifunction pads are superior to paddles for energy delivery","Transient bradycardia or asystole: usually seconds — if prolonged, consider pacing","Failed capture (pacing): increase mA, reposition pads to AP, check pad contact"],
    monitoring:["Continuous ECG post-cardioversion: assess new rhythm, PR/QRS/QTc, conduction changes","BP immediately post-cardioversion: sedative hypotension is common — fluids and observation","Pacing: reassess capture threshold every 15–30 min — threshold rises with time and myocardial ischemia","Anticoagulation status: cardioversion of AFib >48h duration requires adequate anticoag or TEE clearance"],
    pearl:"SYNC mode for cardioversion — failure to synchronize risks shocking on the T-wave and inducing VF. Verify sync markers on every R-wave before discharge. For pacing: electrical capture without mechanical capture is common — ALWAYS palpate a pulse. Pacing is painful — do not withhold sedation unless the patient is unconscious.",
  },
  {
    id:"io", name:"Intraosseous Access", icon:"🦴", color:T.green, cat:"vascular",
    time:"<2 min", diff:"Easy",
    setup:["IO device: EZ-IO drill (preferred) with 15g needle (adult), 25g (pediatric <3kg)","IO flush: 10mL NS with lidocaine 2% (40mg) for conscious patients — IO injection is painful","Preferred sites: proximal tibia (2cm below tibial tuberosity), proximal humerus, distal tibia","Tape or armboard to secure limb, gloves, chlorhexidine swab","Use IO within 24h — bridge to IV access"],
    steps:["Site selection: proximal tibia preferred — 2cm distal to tibial tuberosity on flat medial surface","Avoid: fracture distal to site, previous IO at same site within 48h, overlying infection","Prep skin with chlorhexidine, position limb stable on flat surface","EZ-IO: remove needle cap, place driver perpendicular to bone, apply firm pressure and trigger","Advance until you feel decreased resistance ('pop') as cortex is entered — do not overpenetrate","Remove drill, hold hub stable, unscrew and remove stylet — set aside safely","Attach syringe: aspirate marrow (confirms placement); if no aspirate but hub solid — flush and confirm","Flush: lidocaine 40mg slow IO push, wait 60 seconds, then NS flush to confirm free flow","Connect IV tubing and secure hub — tape, IO-specific securing device, or wrap dressing"],
    complications:["Extravasation: most common — solution infusing into soft tissue; remove and choose different site","Osteomyelitis: 0.6% — use aseptic technique, remove within 24h","Cortical fracture: excessive force or overpenetration; never use fractured extremity"],
    monitoring:["Confirm patency with flush every 4h if prolonged use","Remove within 24h — bridge to definitive IV access as soon as established","IO can deliver all emergency medications, blood products, and fluids at comparable rates to large-bore IV"],
    pearl:"Every medication given IV can be given IO — same dose, same speed of action. In cardiac arrest, IO is faster than central line and provides equivalent drug delivery. All three sites (tibia, humerus, sternum) are reliable. The humerus site has faster circulation time for resuscitation medications. IO access in <90 seconds is achievable with practice.",
  },
  {
    id:"fast", name:"FAST Exam", icon:"📡", color:T.purple, cat:"ultrasound",
    time:"2–5 min", diff:"Easy–Moderate",
    setup:["Bedside ultrasound with curvilinear probe (3.5–5 MHz) or phased array","Preset: abdominal preset or cardiac preset for cardiac view","Patient: supine; do not delay FAST for positioning in hemodynamically unstable patient","Gel applied to probe and skin; minimal pressure — you are looking, not compressing"],
    steps:["RUQ (Morison's pouch): probe at right posterior axillary line, 10th–11th rib, marker toward head","Fan through hepatorenal interface — any anechoic (black) stripe = blood in Morison's pouch","Move probe superiorly to visualize hepatodiaphragmatic interface — look for pleural blood superior to diaphragm","LUQ (splenorenal): probe posterior axillary line, 10th–11th rib left side — harder to image due to gas","Visualize splenorenal and perisplenic space; move superior for pleural blood","Pelvis: probe superior to pubic symphysis longitudinal and transverse — any free fluid posterior to bladder","Retrovesical (male) or rectouterine pouch of Douglas (female) — highest yield pelvic window","Cardiac (subxiphoid or parasternal): look for pericardial effusion (black stripe around heart)","Subxiphoid window: probe flat under xiphoid aimed toward left shoulder — liver as acoustic window","Parasternal long if subxiphoid fails: parasternal left, 4th ICS, assess effusion and cardiac activity","E-FAST: bilateral anterior thorax mid-clavicular line 2nd–3rd ICS — lung sliding confirms pleura (lung point = PTX boundary)"],
    complications:["False negative: small amounts of blood (<250mL) may not be detected — clinical correlation always required","Operator-dependent: bowel gas, obesity, subcutaneous air limit views","Incidental findings: do not chase incidental findings in a trauma — complete the FAST protocol first"],
    monitoring:["Serial FAST in hemodynamically unstable patient — every 5–15 min if initially negative","Positive FAST + hemodynamic instability = OR (not CT) in penetrating trauma","Negative FAST does NOT exclude injury — sensitivity 73–88% for intraperitoneal hemorrhage","Document: positive/negative/indeterminate for each window"],
    pearl:"FAST is a yes/no test for free fluid — it is not CT. A positive FAST in an unstable patient means the OR, not the scanner. A negative FAST in a stable patient still needs CT for complete evaluation. The cardiac window (pericardial effusion) is the highest-yield FAST finding for immediate intervention.",
  },
  {
    id:"sedation", name:"Procedural Sedation", icon:"💤", color:T.rose, cat:"sedation",
    time:"20–60 min (including recovery)", diff:"Moderate",
    setup:["Pre-sedation: NPO status assessed (2h clear, 4h breast milk, 6h solids — but emergencies override)","Airway assessment: Mallampati class, neck ROM, mouth opening, obesity","Monitoring: continuous SpO2, waveform ETCO2, cardiac monitor, BP q5 min","Crash cart accessible; BVM, ETT, suction, reversal agents (flumazenil, naloxone) at bedside","IV access confirmed; supplemental O2 applied (NC 4L/min as minimum baseline)"],
    steps:["Document: indication, ASA class, NPO status, airway assessment, informed consent","Pre-oxygenation: NRB mask 3–5 min for apneic oxygenation reserve (especially obese)","Drug selection based on procedural needs and patient factors (see Pearl)","Titrate to effect: use incremental dosing — do not administer full calculated dose at once","Target: Ramsay 3 (responds to commands) to 4 (brisk response to glabella tap)","Procedure begins when adequate sedation achieved — minimize painful stimulus under light sedation","Airway management during sedation: jaw thrust, chin lift, OPA/NPA if obstruction","Jaw thrust is often sufficient — avoid intubation if possible with repositioning","Documentation q5 min: sedation level, vital signs, SpO2, ETCO2"],
    complications:["Airway obstruction: jaw thrust + head position; OPA/NPA if persists — rarely requires intubation","Apnea: BVM ventilation; if prolonged — reversal agent (flumazenil for BZD, naloxone for opioid)","Hypotension: most common with propofol — fluid bolus, reduce dose, ketamine as alternative","Laryngospasm: positive pressure via BVM with PEEP, succinylcholine 0.5mg/kg IV if complete obstruction","Vomiting/aspiration: lateral position, suction — verify SpO2, CXR if significant aspiration concern"],
    monitoring:["Continuous waveform ETCO2 mandatory: blunted/absent waveform precedes SpO2 desaturation by 60–90 sec","Recovery: minimum 30 min post-sedation monitoring in ED; confirm return to baseline","Discharge criteria: ALDRETE score ≥9, tolerating PO, stable vitals, responsible adult escort","Document: drugs, doses, times, level of sedation, adverse events, recovery time"],
    pearl:"Drug selection: Ketamine (1–2mg/kg IV) = dissociative, maintains airway reflexes, bronchodilates — best for combative patients and procedures requiring analgesia. Propofol (0.5–1.5mg/kg) = rapid onset/offset, smooth induction — avoid in hypotension. Fentanyl+midazolam = adjunct-only, not stand-alone sedation. Dexmedetomidine = sedation without respiratory depression — ideal for procedures requiring patient cooperation.",
  },
];

const CATS = [
  {id:"all",          label:"All 14",        color:T.teal  },
  {id:"vascular",     label:"Vascular",      color:T.red   },
  {id:"thoracic",     label:"Thoracic",      color:T.blue  },
  {id:"abdominal",    label:"Abdominal",     color:T.orange},
  {id:"neurological", label:"Neurological",  color:T.purple},
  {id:"airway",       label:"Airway",        color:T.coral },
  {id:"cardiac",      label:"Cardiac",       color:T.yellow},
  {id:"ultrasound",   label:"Ultrasound",    color:T.purple},
  {id:"sedation",     label:"Sedation",      color:T.rose  },
];

const DETAIL_TABS = ["setup","steps","complications","monitoring"];
const DETAIL_COLORS = {setup:T.teal,steps:T.blue,complications:T.red,monitoring:T.green};
const DETAIL_ICONS  = {setup:"🔧",steps:"📋",complications:"⚠️",monitoring:"📊"};

// ── Primitives ────────────────────────────────────────────────────
function AmbientBg() {
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0}}>
      <div style={{position:"absolute",top:"-15%",left:"-10%",width:"55%",height:"55%",background:"radial-gradient(circle,rgba(255,159,67,0.07) 0%,transparent 70%)"}}/>
      <div style={{position:"absolute",bottom:"-10%",right:"-5%",width:"50%",height:"50%",background:"radial-gradient(circle,rgba(59,158,255,0.07) 0%,transparent 70%)"}}/>
      <div style={{position:"absolute",top:"40%",left:"30%",width:"35%",height:"35%",background:"radial-gradient(circle,rgba(155,109,255,0.05) 0%,transparent 70%)"}}/>
    </div>
  );
}

function BulletRow({ text, color, small }) {
  return (
    <div style={{display:"flex",gap:7,alignItems:"flex-start",marginBottom:small?3:5}}>
      <span style={{color:color||T.teal,fontSize:small?7:8,marginTop:small?3:2,flexShrink:0}}>▸</span>
      <span style={{fontFamily:"DM Sans",fontSize:small?11:12,color:T.txt2,lineHeight:1.5}}>{text}</span>
    </div>
  );
}

function ProcCard({ proc, expanded, onToggle }) {
  const [detailTab, setDetailTab] = useState("setup");
  const items = proc[detailTab] || [];
  return (
    <div style={{...glass,overflow:"hidden",marginBottom:10,
      border:`1px solid ${expanded?proc.color+"55":"rgba(42,79,122,0.35)"}`,
      borderTop:`3px solid ${proc.color}`,transition:"border-color .15s"}}>
      <div onClick={onToggle}
        style={{padding:"12px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:12,
          background:`linear-gradient(135deg,${proc.color}09,rgba(8,22,40,0.93))`}}>
        <span style={{fontSize:22,flexShrink:0}}>{proc.icon}</span>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontFamily:"Playfair Display",fontWeight:700,fontSize:15,color:proc.color}}>
            {proc.name}
          </div>
          <div style={{display:"flex",gap:8,marginTop:3,flexWrap:"wrap"}}>
            <span style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4}}>⏱ {proc.time}</span>
            <span style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4}}>📊 {proc.diff}</span>
          </div>
        </div>
        <span style={{color:T.txt4,fontSize:12}}>{expanded?"▲":"▼"}</span>
      </div>
      {expanded && (
        <div className="fade-in" style={{borderTop:"1px solid rgba(42,79,122,0.25)",padding:"12px 14px 14px"}}>
          {/* Detail tabs */}
          <div style={{display:"flex",gap:5,marginBottom:12,flexWrap:"wrap"}}>
            {DETAIL_TABS.map(dt => (
              <button key={dt} onClick={e=>{e.stopPropagation();setDetailTab(dt);}}
                style={{fontFamily:"JetBrains Mono",fontSize:9,fontWeight:700,padding:"4px 11px",
                  borderRadius:20,cursor:"pointer",textTransform:"uppercase",letterSpacing:1,
                  border:`1px solid ${detailTab===dt?DETAIL_COLORS[dt]+"88":DETAIL_COLORS[dt]+"30"}`,
                  background:detailTab===dt?`${DETAIL_COLORS[dt]}20`:"transparent",
                  color:detailTab===dt?DETAIL_COLORS[dt]:T.txt4,transition:"all .12s"}}>
                {DETAIL_ICONS[dt]} {dt}
              </button>
            ))}
          </div>
          {/* Content */}
          <div className="fade-in" key={detailTab}
            style={{padding:"10px 12px",background:`${DETAIL_COLORS[detailTab]}09`,
              border:`1px solid ${DETAIL_COLORS[detailTab]}25`,borderRadius:10,marginBottom:10}}>
            {items.map((item,i) => (
              <div key={i} style={{display:"flex",gap:9,alignItems:"flex-start",marginBottom:6}}>
                {detailTab==="steps" && (
                  <span style={{fontFamily:"JetBrains Mono",fontSize:10,fontWeight:700,
                    color:DETAIL_COLORS[detailTab],flexShrink:0,minWidth:20,paddingTop:1}}>{i+1}.</span>
                )}
                {detailTab!=="steps" && (
                  <span style={{color:DETAIL_COLORS[detailTab],fontSize:8,marginTop:3,flexShrink:0}}>▸</span>
                )}
                <span style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.55}}>{item}</span>
              </div>
            ))}
          </div>
          {/* Pearl */}
          <div style={{padding:"8px 12px",background:`${T.yellow}08`,
            border:`1px solid ${T.yellow}28`,borderRadius:8}}>
            <span style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.yellow,
              letterSpacing:1,textTransform:"uppercase"}}>💎 Pearl: </span>
            <span style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.6}}>{proc.pearl}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────
export default function ProcedureHub() {
  const navigate = useNavigate();
  const [tab, setTab]       = useState("procedures");
  const [cat, setCat]       = useState("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(null);

  const [coachProc, setCoachProc]   = useState("cvc_ij");
  const [cxContext, setCxContext]   = useState("");
  const [coaching, setCoaching]     = useState(false);
  const [coachResult, setCoachResult] = useState(null);
  const [coachErr, setCoachErr]     = useState(null);
  const [coachSection, setCoachSection] = useState("setup");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return PROCS.filter(p =>
      (cat==="all"||p.cat===cat) &&
      (!q || p.name.toLowerCase().includes(q))
    );
  }, [cat, search]);

  const runCoach = useCallback(async () => {
    if (!coachProc) return;
    setCoaching(true); setCoachErr(null); setCoachResult(null);
    const proc = PROCS.find(p=>p.id===coachProc);
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-6", max_tokens:1600,
          system:`You are a real-time procedural coach for emergency medicine providers. Generate a personalized, step-by-step procedural guidance document tailored to the specific patient context provided. Respond ONLY in valid JSON (no markdown fences):
{
  "ready": "one sentence: is the patient ready for this procedure?",
  "patientSpecific": ["specific consideration for this patient 1", "consideration 2", "consideration 3"],
  "setup": ["patient-specific equipment item 1", "item 2 — include any modifications for this patient's anatomy or condition"],
  "steps": [{"step": "numbered action", "tip": "real-time tip for this patient specifically"}],
  "watchFor": ["complication most likely given THIS patient's profile", "second complication to watch for"],
  "bailout": "specific bail-out plan if the procedure cannot be completed given this patient's anatomy or condition",
  "postProcedure": ["immediate post-procedure action 1", "monitoring specific to this patient"]
}`,
          messages:[{role:"user", content:`Procedure: ${proc?.name}\n\nPatient Context: ${cxContext||"No context provided — give general guidance for an average adult ED patient"}`}]
        })
      });
      const data = await resp.json();
      if (data.error) throw new Error(data.error.message);
      const raw = data.content?.find(b=>b.type==="text")?.text||"{}";
      setCoachResult(JSON.parse(raw.replace(/```json|```/g,"").trim()));
      setCoachSection("setup");
    } catch(e) {
      setCoachErr("Error: "+(e.message||"Check API connectivity"));
    } finally { setCoaching(false); }
  }, [coachProc, cxContext]);

  const COACH_SECTIONS = [
    {id:"setup",        label:"Setup",         color:T.teal  },
    {id:"steps",        label:"Live Steps",    color:T.blue  },
    {id:"watchFor",     label:"Watch For",     color:T.red   },
    {id:"postProcedure",label:"Post-Procedure",color:T.green },
  ];

  const MAIN_TABS = [
    {id:"procedures", label:"Procedures",       icon:"🔧"},
    {id:"coach",      label:"AI Procedure Coach",icon:"🤖"},
  ];

  return (
    <div style={{fontFamily:"DM Sans, sans-serif",background:T.bg,minHeight:"100vh",
      position:"relative",overflow:"hidden",color:T.txt}}>
      <AmbientBg/>
      <div style={{position:"relative",zIndex:1,maxWidth:1200,margin:"0 auto",padding:"0 16px"}}>

        {/* Header */}
        <div style={{padding:"18px 0 14px"}}>
          <button onClick={() => navigate("/hub")}
            style={{marginBottom:10,display:"inline-flex",alignItems:"center",gap:7,
              fontFamily:"DM Sans",fontSize:12,fontWeight:600,
              background:"rgba(14,37,68,0.7)",border:"1px solid rgba(42,79,122,0.5)",
              borderRadius:8,padding:"5px 14px",color:"#4a6a8a",cursor:"pointer",transition:"all .15s"}}
            onMouseEnter={e=>{e.currentTarget.style.color="#8aaccc";e.currentTarget.style.borderColor="rgba(255,159,67,0.4)";}}
            onMouseLeave={e=>{e.currentTarget.style.color="#4a6a8a";e.currentTarget.style.borderColor="rgba(42,79,122,0.5)";}}
          >
            ← Back to Hub
          </button>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
            <div style={{backdropFilter:"blur(40px)",WebkitBackdropFilter:"blur(40px)",
              background:"rgba(5,15,30,0.9)",border:"1px solid rgba(42,79,122,0.6)",
              borderRadius:10,padding:"5px 12px",display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.orange,letterSpacing:3}}>NOTRYA</span>
              <span style={{color:T.txt4,fontFamily:"JetBrains Mono",fontSize:10}}>/</span>
              <span style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.txt3,letterSpacing:2}}>PROCEDURES</span>
            </div>
            <div style={{height:1,flex:1,background:"linear-gradient(90deg,rgba(255,159,67,0.5),transparent)"}}/>
          </div>
          <h1 className="shimmer-text"
            style={{fontFamily:"Playfair Display",fontSize:"clamp(24px,4vw,40px)",fontWeight:900,letterSpacing:-1,lineHeight:1.1}}>
            ProcedureHub
          </h1>
          <p style={{fontFamily:"DM Sans",fontSize:12,color:T.txt3,marginTop:4}}>
            14 Procedures · Setup · Step-by-Step · Complication Recognition · Post-Procedure · AI Coach
          </p>
        </div>

        {/* Stat banner */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10,marginBottom:16}}>
          {[
            {label:"Procedures",        value:"14",    sub:"ED critical procedures",    color:T.orange},
            {label:"Setup Checklists",  value:"14",    sub:"Equipment & positioning",   color:T.teal  },
            {label:"Numbered Steps",    value:"130+",  sub:"Technique guidance",        color:T.blue  },
            {label:"Complication Alerts",value:"60+", sub:"Recognition & response",    color:T.red   },
            {label:"Post-Proc Protocols",value:"14",  sub:"Monitoring after each",     color:T.green },
            {label:"AI Coach",          value:"Live",  sub:"Patient-specific guidance", color:T.purple},
          ].map((b,i) => (
            <div key={i} style={{...glass,padding:"9px 13px",borderLeft:`3px solid ${b.color}`,
              background:`linear-gradient(135deg,${b.color}12,rgba(8,22,40,0.8))`,borderRadius:10}}>
              <div style={{fontFamily:"JetBrains Mono",fontSize:14,fontWeight:700,color:b.color,lineHeight:1}}>{b.value}</div>
              <div style={{fontFamily:"DM Sans",fontWeight:600,color:T.txt,fontSize:10,margin:"3px 0"}}>{b.label}</div>
              <div style={{fontFamily:"DM Sans",fontSize:9,color:T.txt4}}>{b.sub}</div>
            </div>
          ))}
        </div>

        {/* Main tabs */}
        <div style={{...glass,padding:"6px",display:"flex",gap:5,marginBottom:16}}>
          {MAIN_TABS.map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{flex:"1 1 auto",fontFamily:"DM Sans",fontWeight:600,fontSize:12,padding:"9px 8px",
                borderRadius:10,
                border:`1px solid ${tab===t.id?"rgba(255,159,67,0.5)":"transparent"}`,
                background:tab===t.id?"linear-gradient(135deg,rgba(255,159,67,0.18),rgba(255,159,67,0.07))":"transparent",
                color:tab===t.id?T.orange:T.txt3,
                cursor:"pointer",textAlign:"center",transition:"all .15s"}}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ═══ PROCEDURES TAB ═══ */}
        {tab==="procedures" && (
          <div className="fade-in">
            {/* Filter row */}
            <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center",marginBottom:12}}>
              <div style={{display:"flex",gap:5,flex:1,flexWrap:"wrap"}}>
                {CATS.map(c => (
                  <button key={c.id} onClick={()=>setCat(c.id)}
                    style={{fontFamily:"JetBrains Mono",fontSize:9,fontWeight:700,padding:"4px 12px",
                      borderRadius:20,cursor:"pointer",textTransform:"uppercase",letterSpacing:1,
                      border:`1px solid ${cat===c.id?c.color+"88":c.color+"33"}`,
                      background:cat===c.id?`${c.color}20`:`${c.color}08`,
                      color:cat===c.id?c.color:T.txt3,transition:"all .15s"}}>
                    {c.label}
                  </button>
                ))}
              </div>
              <input type="text" value={search} onChange={e=>setSearch(e.target.value)}
                placeholder="Search procedures..."
                style={{background:"rgba(14,37,68,0.8)",
                  border:`1px solid ${search?"rgba(255,159,67,0.4)":"rgba(42,79,122,0.35)"}`,
                  borderRadius:20,padding:"5px 14px",outline:"none",
                  fontFamily:"DM Sans",fontSize:12,color:T.txt,width:170}}/>
            </div>
            <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,
              letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>
              {filtered.length} procedure{filtered.length!==1?"s":""} — tap to expand setup, steps, complications, monitoring
            </div>
            {filtered.map(proc => (
              <ProcCard key={proc.id} proc={proc}
                expanded={expanded===proc.id}
                onToggle={()=>setExpanded(p=>p===proc.id?null:proc.id)}/>
            ))}
            {filtered.length===0 && (
              <div style={{...glass,padding:"32px",textAlign:"center"}}>
                <div style={{fontSize:28,marginBottom:8}}>🔍</div>
                <div style={{fontFamily:"DM Sans",fontSize:13,color:T.txt3}}>
                  No procedures match &ldquo;{search}&rdquo;
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ AI COACH TAB ═══ */}
        {tab==="coach" && (
          <div className="fade-in">
            <div style={{padding:"10px 14px",background:"rgba(155,109,255,0.07)",
              border:"1px solid rgba(155,109,255,0.2)",borderRadius:10,marginBottom:14,
              fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.7}}>
              🤖 <strong style={{color:T.purple}}>AI Procedure Coach:</strong> Select your procedure and describe
              the patient. AI generates real-time, patient-specific guidance — setup modifications, step-by-step
              with live tips, anticipated complications for this patient&apos;s profile, and a bail-out plan.
            </div>

            <div style={{...glass,padding:"14px 16px",marginBottom:12}}>
              {/* Procedure selector */}
              <div style={{marginBottom:12}}>
                <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,
                  letterSpacing:1.5,textTransform:"uppercase",marginBottom:7}}>Procedure</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                  {PROCS.map(p => (
                    <button key={p.id} onClick={()=>{setCoachProc(p.id);setCoachResult(null);}}
                      style={{fontFamily:"DM Sans",fontSize:11,fontWeight:600,
                        padding:"4px 11px",borderRadius:20,cursor:"pointer",transition:"all .12s",
                        border:`1px solid ${coachProc===p.id?p.color+"88":p.color+"28"}`,
                        background:coachProc===p.id?`${p.color}20`:`${p.color}06`,
                        color:coachProc===p.id?p.color:T.txt4,whiteSpace:"nowrap"}}>
                      {p.icon} {p.name.length>22?p.name.split("—")[0].trim().split(" ").slice(0,3).join(" ")+"…":p.name}
                    </button>
                  ))}
                </div>
              </div>
              {/* Context */}
              <div style={{marginBottom:10}}>
                <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,
                  letterSpacing:1.5,textTransform:"uppercase",marginBottom:6}}>Patient Context</div>
                <textarea value={cxContext} onChange={e=>setCxContext(e.target.value)}
                  placeholder={"Describe anatomy, comorbidities, and clinical context.\n\nExample: '340lb male, BMI 52, septic shock, two failed peripheral IVs, coagulopathy INR 2.1, platelets 48k, on BiPAP, uncooperative. Need central access urgently.'"}
                  rows={4}
                  style={{width:"100%",background:"rgba(14,37,68,0.7)",
                    border:`1px solid ${cxContext?"rgba(155,109,255,0.45)":"rgba(42,79,122,0.3)"}`,
                    borderRadius:8,padding:"10px 12px",outline:"none",resize:"vertical",
                    fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.65}}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontFamily:"DM Sans",fontSize:11,color:T.txt4}}>
                  Procedure: <strong style={{color:PROCS.find(p=>p.id===coachProc)?.color}}>
                    {PROCS.find(p=>p.id===coachProc)?.name}
                  </strong>
                </span>
                <button onClick={runCoach} disabled={coaching}
                  style={{fontFamily:"DM Sans",fontWeight:700,fontSize:12,padding:"8px 22px",
                    borderRadius:10,cursor:coaching?"not-allowed":"pointer",
                    border:`1px solid rgba(155,109,255,0.5)`,
                    background:"linear-gradient(135deg,rgba(155,109,255,0.22),rgba(155,109,255,0.08))",
                    color:T.purple,transition:"all .15s"}}>
                  {coaching?<><span className="p-spin">⚙</span> Generating...</>:"🤖 Coach Me"}
                </button>
              </div>
            </div>

            {/* Error */}
            {coachErr && (
              <div style={{padding:"10px 14px",background:"rgba(255,68,68,0.1)",
                border:"1px solid rgba(255,68,68,0.3)",borderRadius:10,marginBottom:12,
                fontFamily:"DM Sans",fontSize:12,color:T.coral}}>{coachErr}</div>
            )}

            {/* Loading */}
            {coaching && (
              <div style={{...glass,padding:"36px",textAlign:"center"}}>
                <span className="p-spin" style={{fontSize:34,display:"block",marginBottom:10}}>⚙</span>
                <div style={{fontFamily:"DM Sans",fontSize:13,color:T.txt2}}>
                  Building your {PROCS.find(p=>p.id===coachProc)?.name} guidance...
                </div>
              </div>
            )}

            {/* Results */}
            {coachResult && !coaching && (
              <div className="fade-in">
                {/* Ready assessment */}
                {coachResult.ready && (
                  <div style={{...glass,padding:"11px 14px",marginBottom:10,
                    border:"1px solid rgba(0,229,192,0.3)",
                    background:"linear-gradient(135deg,rgba(0,229,192,0.07),rgba(8,22,40,0.93))"}}>
                    <span style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.teal,
                      letterSpacing:1.5,textTransform:"uppercase"}}>Readiness: </span>
                    <span style={{fontFamily:"DM Sans",fontSize:13,color:T.txt,fontWeight:600}}>{coachResult.ready}</span>
                  </div>
                )}

                {/* Patient-specific considerations */}
                {coachResult.patientSpecific?.length>0 && (
                  <div style={{...glass,padding:"11px 14px",marginBottom:10,
                    border:"1px solid rgba(255,159,67,0.28)"}}>
                    <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.orange,
                      letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>⚡ Patient-Specific Considerations</div>
                    {coachResult.patientSpecific.map((c,i) => (
                      <BulletRow key={i} text={c} color={T.orange}/>
                    ))}
                  </div>
                )}

                {/* Section tabs */}
                <div style={{display:"flex",gap:5,marginBottom:10,flexWrap:"wrap"}}>
                  {COACH_SECTIONS.map(cs => (
                    <button key={cs.id} onClick={()=>setCoachSection(cs.id)}
                      style={{fontFamily:"JetBrains Mono",fontSize:9,fontWeight:700,padding:"5px 14px",
                        borderRadius:20,cursor:"pointer",textTransform:"uppercase",letterSpacing:1,
                        border:`1px solid ${coachSection===cs.id?cs.color+"88":cs.color+"30"}`,
                        background:coachSection===cs.id?`${cs.color}20`:`${cs.color}06`,
                        color:coachSection===cs.id?cs.color:T.txt3,transition:"all .12s"}}>
                      {cs.label}
                    </button>
                  ))}
                </div>

                {/* Dynamic section content */}
                <div className="fade-in" key={coachSection}
                  style={{...glass,padding:"14px 16px",marginBottom:10,
                    border:`1px solid ${COACH_SECTIONS.find(s=>s.id===coachSection)?.color}28`}}>
                  {coachSection==="steps" ? (
                    coachResult.steps?.map((s,i) => (
                      <div key={i} style={{marginBottom:10,padding:"8px 11px",
                        background:"rgba(42,79,122,0.1)",borderRadius:8}}>
                        <div style={{display:"flex",gap:8,alignItems:"baseline",marginBottom:4}}>
                          <span style={{fontFamily:"JetBrains Mono",fontSize:11,fontWeight:700,
                            color:T.blue,flexShrink:0}}>{i+1}.</span>
                          <span style={{fontFamily:"DM Sans",fontSize:12,fontWeight:700,color:T.txt}}>{s.step}</span>
                        </div>
                        {s.tip && (
                          <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt3,
                            paddingLeft:19,lineHeight:1.5}}>
                            💡 {s.tip}
                          </div>
                        )}
                      </div>
                    ))
                  ) : coachSection==="watchFor" ? (
                    <div>
                      {coachResult.watchFor?.map((w,i) => (
                        <BulletRow key={i} text={w} color={T.red}/>
                      ))}
                      {coachResult.bailout && (
                        <div style={{marginTop:12,padding:"9px 12px",
                          background:"rgba(255,68,68,0.08)",border:"1px solid rgba(255,68,68,0.2)",borderRadius:8}}>
                          <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.red,
                            letterSpacing:1.5,textTransform:"uppercase",marginBottom:5}}>Bail-Out Plan</div>
                          <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.6}}>
                            {coachResult.bailout}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    (coachResult[coachSection]||[]).map((item,i) => (
                      <BulletRow key={i} text={item}
                        color={COACH_SECTIONS.find(s=>s.id===coachSection)?.color}/>
                    ))
                  )}
                </div>

                <div style={{textAlign:"center",marginBottom:16}}>
                  <button onClick={runCoach}
                    style={{fontFamily:"DM Sans",fontWeight:600,fontSize:12,padding:"7px 20px",
                      borderRadius:10,cursor:"pointer",border:"1px solid rgba(42,79,122,0.4)",
                      background:"transparent",color:T.txt3}}>
                    ↺ Update Context and Re-coach
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{textAlign:"center",paddingBottom:24,paddingTop:14}}>
          <span style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,letterSpacing:1.5}}>
            NOTRYA PROCEDUREHUB · ATLS · ACEP · SCCM GUIDELINES · VERIFY ALL STEPS WITH INSTITUTIONAL PROTOCOLS · AI FOR EDUCATIONAL SUPPORT ONLY
          </span>
        </div>
      </div>
    </div>
  );
}