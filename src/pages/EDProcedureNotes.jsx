import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

// ─── Anesthetic + Shared Options ────────────────────────────────────────────
const LIDO = ['Lidocaine 1% plain','Lidocaine 1% with epinephrine','Lidocaine 2% plain','Lidocaine 2% with epinephrine','Bupivacaine 0.25%','Bupivacaine 0.5%'];
const ABXO = ['None indicated','Cephalexin 500mg QID x 5d','Amoxicillin-clavulanate 875mg BID x 5d','Clindamycin 300mg QID x 5d','TMP-SMX DS BID x 5d'];
const TET  = ['Up to date — none given','Tdap administered','TIG administered','Tdap + TIG given','Unknown — Tdap given','Declined'];
const NVpost = ['*Sensation intact','*Motor function intact','*Pulses intact','*Cap refill <2 sec'];
const NVpre  = ['*Sensation intact','*Motor intact','*Cap refill <2s','*Pulses present'];

// ─── Procedure Definitions ───────────────────────────────────────────────────
const P = {
  lac: { name:'Laceration Repair', ico:'🩹', sub:'Complete wound closure documentation', tips:'Missing fields, epi contraindications near digits/ears/nose, allergy conflicts with antibiotics, billing complexity (simple <2.5cm vs complex)',
    secs:[
      {ic:'📍',t:'Wound Details',rows:[
        [{t:'i',id:'location',lbl:'Location',req:1,ph:'e.g., Right forehead, 2 cm above eyebrow'},{t:'i',id:'length',lbl:'Length',req:1,ph:'e.g., 3.5 cm'}],
        [{t:'s',id:'depth',lbl:'Depth',o:['Superficial (epidermis/dermis)','Deep dermis','Subcutaneous tissue','Fascia involvement','Muscle involvement']},{t:'s',id:'wtype',lbl:'Wound Type',o:['Linear','Stellate','Avulsion','Degloving','Puncture']},{t:'s',id:'contam',lbl:'Contamination',o:['Clean','Mildly contaminated','Heavily contaminated','Bite wound','Soil/debris']}],
        {t:'c',id:'wchar',lbl:'Characteristics',o:['Well-approximated edges','Jagged/irregular edges','Active bleeding','Minimal bleeding','Foreign body noted','Tendon visible','Bone visible']}
      ]},
      {ic:'💉',t:'Anesthesia & Preparation',rows:[
        [{t:'s',id:'anes',lbl:'Anesthetic',req:1,o:[...LIDO,'LET gel','Diphenhydramine intradermal']},{t:'i',id:'anes_amt',lbl:'Amount (mL)',ph:'e.g., 5 mL'},{t:'s',id:'anes_tech',lbl:'Technique',o:['Local infiltration','Field block','Digital nerve block','Regional nerve block','Topical only']}],
        {t:'c',id:'prep',lbl:'Preparation',o:['*NS irrigation','Betadine prep','Chlorhexidine prep','FB removed','Explored — no deep injury','Hair removal']}
      ]},
      {ic:'🧵',t:'Closure',rows:[
        [{t:'s',id:'closure',lbl:'Closure Method',req:1,o:['Simple interrupted sutures','Simple running sutures','Horizontal mattress sutures','Vertical mattress sutures','Deep absorbable + simple interrupted','Staples','Dermabond','Steri-strips','Combination']},{t:'s',id:'sut_mat',lbl:'Suture Material',o:['N/A','3-0 Nylon','4-0 Nylon','5-0 Nylon','6-0 Nylon','3-0 Prolene','4-0 Prolene','3-0 Vicryl (deep)','4-0 Vicryl (deep)','3-0 Chromic gut']}],
        [{t:'i',id:'sut_n',lbl:'# Sutures/Staples',ph:'e.g., 6'},{t:'s',id:'hemo',lbl:'Hemostasis',o:['Yes — direct pressure','Yes — electrocautery','Yes — silver nitrate','Yes — suture ligation']},{t:'s',id:'dressing',lbl:'Dressing',o:['Dry sterile dressing','Bacitracin + non-stick + gauze','Petrolatum gauze','Tegaderm','No dressing (face)']}]
      ]},
      {ic:'✅',t:'Aftercare & Disposition',rows:[
        [{t:'s',id:'tet',lbl:'Tetanus Status',req:1,o:TET},{t:'s',id:'abx',lbl:'Antibiotics',o:ABXO}],
        {t:'s',id:'fu',lbl:'Follow-Up',o:['Face: 5 days','Scalp: 7–10 days','Trunk: 7–10 days','Extremities: 10–14 days','Over joint: 14 days','Wound clinic 3–5 days']},
        {t:'c',id:'nvpost',lbl:'Post-Procedure NV Status',o:NVpost},
        {t:'a',id:'addl',lbl:'Additional Notes',ph:'Patient tolerated procedure well. Return precautions discussed…'}
      ]}
    ]
  },
  iand: { name:'I&D / Abscess Drainage', ico:'💉', sub:'Incision and drainage procedure note', tips:'Missing fields, MRSA coverage and allergy conflicts, packing type/length, admission criteria (facial/febrile/immunocompromised), culture recommendation',
    secs:[
      {ic:'📍',t:'Abscess Details',rows:[
        [{t:'i',id:'location',lbl:'Location',req:1,ph:'e.g., Left buttock, right axilla'},{t:'i',id:'size',lbl:'Size',req:1,ph:'e.g., 4 cm x 3 cm x 2 cm'}],
        [{t:'s',id:'skin',lbl:'Skin Overlying',o:['Erythematous, warm, fluctuant','Erythematous, indurated','Pointing/ready to drain','Cellulitis surrounding']},{t:'s',id:'lymph',lbl:'Lymphangitis',o:['Not present','Present — streaking noted']}]
      ]},
      {ic:'💉',t:'Procedure',rows:[
        [{t:'s',id:'anes',lbl:'Anesthetic',req:1,o:['Lidocaine 1% plain','Lidocaine 1% w/ epi','Lidocaine 2% plain','Procedural sedation','None — too superficial']},{t:'i',id:'anes_amt',lbl:'Amount (mL)',ph:'e.g., 10 mL'},{t:'s',id:'incision',lbl:'Incision Type',o:['Linear stab — #11 blade','Linear — #15 blade','Cruciate incision','Loop drainage']}],
        {t:'c',id:'drain',lbl:'Drainage Characteristics',req:1,o:['Purulent drainage expressed','Serosanguineous','Malodorous','Loculations broken','Cavity irrigated']},
        [{t:'s',id:'packing',lbl:'Wound Packing',o:['Iodoform gauze 1/4-inch','Iodoform gauze 1/2-inch','Plain gauze','Not packed — too small','Loop drainage placed']},{t:'s',id:'cx',lbl:'Cultures',o:['Wound culture sent','Not sent — routine abscess','Blood cultures sent','MRSA swab sent']}]
      ]},
      {ic:'✅',t:'Antibiotics & Disposition',rows:[
        [{t:'s',id:'abx',lbl:'Antibiotics',req:1,o:['None — uncomplicated, drained','TMP-SMX DS BID x 7d','Doxycycline 100mg BID x 7d','Clindamycin 300mg TID x 7d','Cephalexin 500mg QID x 7d','IV antibiotics — admitted']},{t:'s',id:'fu',lbl:'Follow-Up',o:['Return 48h — wound check/packing removal','Return 48–72h for repack','Primary care 3–5 days','Wound clinic','Admission']}],
        {t:'a',id:'addl',lbl:'Notes',ph:'Patient tolerated procedure well. No complications…'}
      ]}
    ]
  },
  fb: { name:'Foreign Body Removal', ico:'🔍', sub:'Soft tissue foreign body removal note', tips:'Missing fields, allergy conflicts, wood/glass/plant radiolucent on X-ray (US preferred), post-removal imaging, NV exam post-removal for hand/finger',
    secs:[{ic:'🔍',t:'Foreign Body Details',rows:[
      [{t:'i',id:'location',lbl:'Location',req:1,ph:'e.g., Right index finger pad, 1 cm distal to DIP'},{t:'s',id:'fbtype',lbl:'FB Type',req:1,o:['Wood splinter','Glass shard','Metal fragment','Fishhook','Thorn / plant material','Gravel / road debris','Needle fragment','Plastic','Bullet fragment']}],
      [{t:'s',id:'imaging',lbl:'Pre-Removal Imaging',o:['X-ray — radiopaque FB visualized','X-ray — negative (radiolucent FB suspected)','Bedside ultrasound — FB identified','No imaging — visible/palpable FB']},{t:'s',id:'anes',lbl:'Anesthetic',req:1,o:['Lidocaine 1% plain','Lidocaine 1% w/ epi','Digital nerve block','Regional nerve block']}],
      {t:'s',id:'result',lbl:'FB Successfully Removed',o:['Yes — intact and in entirety','Yes — fragmented, appears complete','Partially removed — residual suspected','Unable — surgery/IR referral']},
      {t:'c',id:'post',lbl:'Post-Removal',o:['*Wound irrigated','*Post-imaging — no residual','*Sensation intact distal to site']},
      {t:'a',id:'addl',lbl:'Notes'}
    ]}]
  },
  wc: { name:'Wound Irrigation & Care', ico:'🧴', sub:'Wound irrigation and management note', tips:'Missing fields, allergy conflicts, high-pressure irrigation volume, open vs delayed primary closure for contaminated wounds',
    secs:[{ic:'🧴',t:'Wound Details',rows:[
      [{t:'i',id:'location',lbl:'Location',req:1,ph:'e.g., Right lower extremity, anterior tibial surface'},{t:'i',id:'size',lbl:'Size',ph:'e.g., 6 cm x 4 cm'}],
      [{t:'s',id:'wtype',lbl:'Wound Type',req:1,o:['Abrasion','Avulsion / degloving','Crush injury','Infected wound','Burn (partial thickness)','Ulceration','Wound dehiscence']},{t:'s',id:'contam',lbl:'Contamination',o:['Minimal — clean','Moderate','Heavy — soil/organic','Fecal contamination']}],
      {t:'c',id:'irrig',lbl:'Irrigation',o:['*High-pressure NS irrigation','Wound scrub','Devitalized tissue debrided','FB removed']},
      [{t:'s',id:'dressing',lbl:'Dressing',o:['Bacitracin + non-adherent + gauze','Silver sulfadiazine + non-adherent','Moist saline gauze','Hydrocolloid (DuoDerm)','Negative pressure wound therapy (VAC)']},{t:'s',id:'abx',lbl:'Antibiotics',o:['None','Cephalexin 500mg QID x 5d','Clindamycin 300mg TID x 5d','TMP-SMX DS BID x 5d']}],
      {t:'a',id:'addl',lbl:'Notes'}
    ]}]
  },
  sp: { name:'Splint Application', ico:'🦴', sub:'Orthopedic immobilization documentation', tips:'Missing fields, appropriate immobilization position for injury, both pre AND post NV exams required, splint type matching injury/location, return precautions',
    secs:[
      {ic:'🦴',t:'Injury & Indication',rows:[
        [{t:'i',id:'dx',lbl:'Diagnosis / Indication',req:1,ph:'e.g., Distal radius fracture, non-displaced'},{t:'s',id:'ext',lbl:'Extremity',req:1,o:['Right upper extremity','Left upper extremity','Right lower extremity','Left lower extremity']}],
        {t:'c',id:'nvpre',lbl:'Pre-Procedure NV Exam',req:1,o:NVpre}
      ]},
      {ic:'🩹',t:'Splint Details',rows:[
        [{t:'s',id:'spltype',lbl:'Splint Type',req:1,o:[{g:'Upper Extremity',o:['Posterior long arm splint','Short arm (volar) splint','Ulnar gutter splint','Radial gutter splint','Thumb spica splint','Sugar-tong (forearm)','Coaptation (humerus)','Aluminum finger splint']},{g:'Lower Extremity',o:['Posterior ankle/short leg splint','Stirrup (U-slab) ankle splint','Posterior long leg splint','Knee immobilizer','Buddy taping','Hard-soled shoe']}]},{t:'i',id:'pos',lbl:'Position of Immobilization',req:1,ph:'e.g., Wrist in 20° extension, MCP at 70° flexion'}],
        [{t:'s',id:'pad',lbl:'Padding',o:['Webril cotton','Soft foam','Stockinette + Webril']},{t:'s',id:'mat',lbl:'Material',o:['Plaster (10-layer)','Plaster (8-layer)','Fiberglass','Pre-formed fiberglass']},{t:'s',id:'wrap',lbl:'Overwrap',o:['ACE wrap','CoFlex','Elastic + tape']}]
      ]},
      {ic:'✅',t:'Post-Application & Disposition',rows:[
        {t:'c',id:'nvpost2',lbl:'Post-Application NV Exam',req:1,o:['*Sensation intact post-splint','*Motor intact post-splint','*Cap refill <2s post-splint','*Pulses intact post-splint','*No increased pain/numbness']},
        [{t:'s',id:'wb',lbl:'Weight-Bearing',o:['N/A (upper extremity)','Non-weight bearing','Touch-down weight bearing','Weight bearing as tolerated','Full weight bearing']},{t:'s',id:'fu',lbl:'Follow-Up',o:['Orthopedics 3–5 days','Orthopedics 7–10 days','Primary care 5–7 days','Hand surgery referral']}],
        {t:'c',id:'rp',lbl:'Return Precautions',o:['*Increasing pain/swelling','*Numbness/tingling','*Splint too tight/loose','*Skin breakdown','*Color changes']},
        {t:'a',id:'addl',lbl:'Notes',ph:'X-rays reviewed. Orthopedics notified…'}
      ]}
    ]
  },
  red: { name:'Fracture / Dislocation Reduction', ico:'🔧', sub:'Orthopedic reduction procedure note', tips:'Missing fields, both pre AND post-reduction NV exams mandatory, pre and post X-rays, technique appropriate for injury, orthopedics notification for fracture-dislocation or failed reduction',
    secs:[{ic:'🔧',t:'Injury & Procedure',rows:[
      [{t:'i',id:'dx',lbl:'Diagnosis',req:1,ph:'e.g., Right anterior shoulder dislocation'},{t:'i',id:'mech',lbl:'Mechanism',ph:'e.g., Fall on outstretched hand'}],
      {t:'c',id:'nvpre',lbl:'Pre-Reduction NV Exam',req:1,o:['*Sensation intact','*Motor intact','*Pulses present','Axillary nerve checked (shoulder)']},
      [{t:'s',id:'prexr',lbl:'Pre-Reduction X-ray',req:1,o:['Confirmed dislocation, no fracture','Confirmed dislocation + fracture','Fracture — angulated, needs reduction','Emergency — X-ray deferred']},{t:'s',id:'analg',lbl:'Analgesia/Sedation',req:1,o:['Intra-articular lidocaine block','IV morphine + midazolam','IV fentanyl + midazolam','IV ketamine (proc sedation)','IV propofol (proc sedation)','Nitrous oxide','No sedation required']}],
      [{t:'s',id:'tech',lbl:'Reduction Technique',req:1,o:[{g:'Shoulder',o:['Cunningham','FARES','Stimson','External rotation (Kocher)','Traction-countertraction','Milch']},{g:'Hip',o:['Allis technique','Stimson gravity']},{g:'Ankle/Wrist/Elbow',o:['Longitudinal traction with manipulation']},{g:'Digits',o:['Longitudinal traction — digit']}]},{t:'s',id:'att',lbl:'Attempts',o:['1 attempt — successful','2 attempts — successful','3 attempts — failed, ortho called']}],
      {t:'c',id:'post',lbl:'Post-Reduction',o:['*Post-reduction X-ray — reduced','*Sensation intact post','*Motor intact post','*Pulses intact post','*Splint/sling applied']},
      {t:'a',id:'addl',lbl:'Notes'}
    ]}]
  },
  intub: { name:'Intubation / RSI', ico:'🌬️', sub:'Rapid sequence intubation and airway management', tips:'Missing fields, succinylcholine contraindications (hyperkalemia/burns/crush/denervation), waveform capnography is medicolegal standard for confirmation, backup airway plan if multiple attempts, vent settings (6 mL/kg IBW lung-protective)',
    secs:[
      {ic:'🌬️',t:'Indication & Pre-Procedure',rows:[
        {t:'tip',cls:'rd',txt:'⚠️ High-risk procedure. Document all attempts, backup airway plans, and post-intubation management.'},
        {t:'c',id:'ind',lbl:'Indication',req:1,o:['Hypoxic respiratory failure','Hypercapnic respiratory failure','Airway protection — AMS','Airway protection — GCS ≤8','Impending failure','Airway obstruction','Hemodynamic instability']},
        [{t:'s',id:'preox',lbl:'Pre-Oxygenation',o:['15L NRB x 3 min','BVM with PEEP valve','HFNC 60 L/min','BiPAP pre-oxygenation','No pre-oxygenation (crash)']},{t:'i',id:'prespo2',lbl:'SpO₂ Prior to Attempt',ph:'e.g., 94%'}],
        {t:'c',id:'daa',lbl:'Difficult Airway Assessment',o:['*No predicted difficulty','Limited mouth opening','Mallampati III-IV','C-spine immobility','Facial trauma/burns','Obesity/short neck']}
      ]},
      {ic:'💊',t:'RSI Medications',rows:[
        [{t:'s',id:'ind_agent',lbl:'Induction Agent',req:1,o:['Ketamine 1.5–2 mg/kg IV','Propofol 1.5–2 mg/kg IV','Etomidate 0.3 mg/kg IV','Midazolam 0.3 mg/kg IV']},{t:'i',id:'ind_dose',lbl:'Induction Dose Given',ph:'e.g., Ketamine 200mg IV'}],
        [{t:'s',id:'par',lbl:'Paralytic Agent',req:1,o:['Succinylcholine 1.5 mg/kg IV','Rocuronium 1.2 mg/kg IV (RSI)','Rocuronium 0.6 mg/kg IV','Vecuronium 0.1 mg/kg IV']},{t:'i',id:'par_dose',lbl:'Paralytic Dose Given',ph:'e.g., Succinylcholine 150mg IV'}]
      ]},
      {ic:'🔭',t:'Laryngoscopy & Intubation',rows:[
        [{t:'s',id:'dev',lbl:'Device',req:1,o:['Direct laryngoscopy — Mac 3','Direct laryngoscopy — Mac 4','Direct laryngoscopy — Miller 2','Video laryngoscopy — GlideScope','Video laryngoscopy — C-MAC','Fiberoptic bronchoscope','LMA (bridging)']},{t:'s',id:'cl',lbl:'Cormack-Lehane',o:['Grade I — full cords','Grade II — partial cords','Grade III — epiglottis only','Grade IV — no glottic structures']},{t:'s',id:'att',lbl:'Attempts',req:1,o:['1st attempt successful','2 attempts — successful','3 attempts — successful','Failed — surgical airway']}],
        [{t:'s',id:'ett',lbl:'ETT Size',req:1,o:['6.0 cuffed','6.5 cuffed','7.0 cuffed','7.5 cuffed','8.0 cuffed']},{t:'i',id:'ettd',lbl:'ETT Depth (cm at teeth)',ph:'e.g., 23 cm'},{t:'s',id:'stylet',lbl:'Stylet',o:['Yes','No','Bougie used']}],
        {t:'c',id:'conf',lbl:'Confirmation',req:1,o:['*Waveform capnography ✓','*Bilateral breath sounds ✓','*Bilateral chest rise ✓','*SpO₂ maintained','CXR ordered']}
      ]},
      {ic:'⚙️',t:'Post-Intubation Management',rows:[
        [{t:'s',id:'vm',lbl:'Vent Mode',o:['Volume control (AC/VC)','Pressure control (AC/PC)','SIMV']},{t:'i',id:'tv',lbl:'Tidal Volume',ph:'e.g., 500 mL (6 mL/kg IBW)'},{t:'i',id:'vset',lbl:'Rate / PEEP / FiO₂',ph:'e.g., RR 14, PEEP 5, FiO₂ 100%'}],
        {t:'c',id:'comp',lbl:'Complications',o:['*No complications','Transient hypoxia','Esophageal intubation (corrected)','Dental trauma','Right mainstem (repositioned)']},
        {t:'a',id:'addl',lbl:'Notes',ph:'Attending present during procedure…'}
      ]}
    ]
  },
  sed: { name:'Procedural Sedation', ico:'💤', sub:'Conscious sedation / procedural sedation documentation', tips:'Missing fields, appropriate agent (ketamine preferred in ED), capnography and two-physician model for deep sedation, patient met recovery/discharge criteria',
    secs:[
      {ic:'💤',t:'Pre-Sedation Assessment',rows:[
        [{t:'i',id:'ind',lbl:'Indication / Procedure',req:1,ph:'e.g., Shoulder dislocation reduction'},{t:'s',id:'asa',lbl:'ASA Classification',o:['ASA I — healthy','ASA II — mild systemic disease','ASA III — severe systemic disease','ASA IV — severe, life-threatening']}],
        [{t:'s',id:'npo',lbl:'NPO Status',o:['Emergency — not applicable','NPO >8h — solids','NPO >6h — light meal','Not NPO — discussed risk/benefit']},{t:'s',id:'aw',lbl:'Airway Assessment',o:['No predicted difficulty','Potentially difficult — precautions taken','Video laryngoscopy at bedside']}],
        {t:'c',id:'cons',lbl:'Consent',o:['*Risks/benefits discussed','*Consent obtained','Emergency — consent waived']}
      ]},
      {ic:'🔵',t:'Monitoring',rows:[
        {t:'c',id:'mon',lbl:'Monitoring Throughout',req:1,o:['*Cardiac monitor','*Pulse oximetry','*Capnography (EtCO₂)','*BP q5min','*IV access','*Supplemental O₂']},
        {t:'c',id:'pers',lbl:'Personnel Present',o:['*Procedure physician','*Sedation physician','*RN monitoring']}
      ]},
      {ic:'💊',t:'Medications Administered',rows:[
        [{t:'s',id:'agent',lbl:'Agent',req:1,o:['Ketamine 1–1.5 mg/kg IV','Ketamine 4 mg/kg IM','Propofol 1 mg/kg IV','Midazolam + Fentanyl','Fentanyl 1–2 mcg/kg IV','Etomidate 0.1–0.15 mg/kg IV']},{t:'i',id:'dose',lbl:'Dose / Route Given',ph:'e.g., Ketamine 100mg IV'}],
        [{t:'s',id:'slvl',lbl:'Sedation Level',o:['Minimal (anxiolysis)','Moderate (conscious sedation)','Deep sedation','Dissociative (ketamine)']},{t:'i',id:'dur',lbl:'Duration',ph:'e.g., 15 minutes'}]
      ]},
      {ic:'✅',t:'Recovery & Disposition',rows:[
        {t:'c',id:'rec',lbl:'Recovery',o:['*Returned to baseline','*SpO₂ on room air','*No adverse events']},
        {t:'a',id:'addl',lbl:'Procedure / Outcome',ph:'Reduction successful. Post-procedure X-ray confirms reduction…'}
      ]}
    ]
  },
  lp: { name:'Lumbar Puncture', ico:'🔬', sub:'Lumbar puncture / spinal tap procedure note', tips:'Missing fields, CT head criteria before LP, CSF interpretation (xanthochromia=SAH, turbid=meningitis, opening pressure), minimum 4 tubes with HSV PCR if encephalitis',
    secs:[
      {ic:'🔬',t:'Indication & Consent',rows:[
        [{t:'c',id:'ind',lbl:'Indication',req:1,o:['Rule out subarachnoid hemorrhage','Rule out meningitis/encephalitis','CNS infection evaluation','Therapeutic (IIH)','Demyelinating disease workup']},{t:'s',id:'ct',lbl:'Pre-LP CT Head',req:1,o:['CT obtained — no contraindications','CT obtained — normal, LP safe','CT not required (GCS 15, no focal deficits)','CT contraindicated — LP proceeded']}],
        {t:'c',id:'cons',lbl:'Consent',o:['*Risks/benefits discussed','*Consent obtained','Emergency — waived']}
      ]},
      {ic:'🩺',t:'Procedure Details',rows:[
        [{t:'s',id:'pos',lbl:'Position',o:['Lateral decubitus — fetal','Seated — leaning forward']},{t:'s',id:'lvl',lbl:'Level',req:1,o:['L3-L4 interspace','L4-L5 interspace','L2-L3 interspace']},{t:'s',id:'ndl',lbl:'Needle',o:['20G Quincke (cutting)','22G Quincke','22G Sprotte (atraumatic)','24G Sprotte (atraumatic)']}],
        [{t:'s',id:'att',lbl:'Attempts',req:1,o:['1 attempt — successful','2 attempts — successful','3 attempts — successful','Failed — US guidance used','Failed — IR referral']},{t:'s',id:'guid',lbl:'Guidance',o:['Landmark technique','Ultrasound guidance','Fluoroscopy guidance']}],
        [{t:'i',id:'op',lbl:'Opening Pressure',req:1,ph:'e.g., 18 cmH₂O'},{t:'s',id:'csf',lbl:'CSF Appearance',req:1,o:['Clear and colorless','Xanthochromic (yellow-tinged)','Bloody — clearing with successive tubes','Uniformly bloody — all four tubes','Turbid / cloudy']}]
      ]},
      {ic:'🧪',t:'CSF Studies & Post-Procedure',rows:[
        {t:'c',id:'tubes',lbl:'Tubes Collected',o:['*Tube 1 — Cell count + diff','*Tube 2 — Protein/glucose','*Tube 3 — Culture/gram stain','*Tube 4 — Repeat cell count','HSV PCR','Crypto antigen','VDRL']},
        {t:'c',id:'comp',lbl:'Complications',o:['*No complications','Traumatic tap — RBCs noted','Post-LP headache anticipated']},
        {t:'a',id:'addl',lbl:'Notes',ph:'Procedure performed under sterile technique. Patient tolerated well…'}
      ]}
    ]
  },
  cl: { name:'Central Line Placement', ico:'🩺', sub:'Central venous catheter insertion note', tips:'Missing fields, US guidance standard of care for IJ/subclavian, CXR required for tip position and no pneumothorax, full barrier sterile precautions',
    secs:[
      {ic:'🩺',t:'Indication & Site',rows:[
        {t:'c',id:'ind',lbl:'Indication',req:1,o:['No peripheral access','Hemodynamic monitoring','Vasopressor administration','Rapid volume resuscitation','Transvenous pacing','Caustic medications']},
        [{t:'s',id:'site',lbl:'Site',req:1,o:['Right internal jugular (R IJ)','Left internal jugular (L IJ)','Right subclavian','Left subclavian','Right femoral','Left femoral']},{t:'s',id:'cath',lbl:'Catheter Type',o:['Triple lumen CVC','Double lumen CVC','Single lumen CVC','Introducer sheath (Cordis)','Dialysis catheter (Shiley)']}]
      ]},
      {ic:'🔊',t:'Technique & Insertion',rows:[
        {t:'tip',cls:'rd',txt:'⚠️ High-risk. Document US guidance, attempts, confirmation, and post-placement CXR.'},
        [{t:'s',id:'us',lbl:'Ultrasound Guidance',req:1,o:['Real-time US guidance throughout','US for localization, landmark insertion','Landmark technique only']},{t:'s',id:'pat',lbl:'Venous Patency by US',o:['Yes — compressible, no thrombus','Not assessed']}],
        [{t:'s',id:'att',lbl:'Attempts',req:1,o:['1 attempt — successful','2 attempts — successful','3 attempts — successful','Failed — alternate site']},{t:'s',id:'wire',lbl:'Wire Pass',o:['Guidewire passed without resistance','Resistance — repositioned, passed']},{t:'i',id:'depth',lbl:'Catheter Depth (cm)',ph:'e.g., 15 cm at skin'}],
        {t:'c',id:'lum',lbl:'All Lumens Patent',o:['*All ports flush/aspirate','*Secured with suture','*Sterile dressing applied']}
      ]},
      {ic:'✅',t:'Confirmation & Complications',rows:[
        {t:'c',id:'conf',lbl:'Position Confirmation',req:1,o:['*CXR — tip at SVC/RA junction','*No pneumothorax on CXR','*Venous blood confirmed']},
        {t:'c',id:'comp',lbl:'Complications',o:['*No complications','Arterial puncture — recognized/managed','Pneumothorax — chest tube placed','Hematoma at insertion site']},
        {t:'a',id:'addl',lbl:'Notes',ph:'Sterile technique maintained. Patient tolerated well…'}
      ]}
    ]
  },
  ct: { name:'Chest Tube', ico:'🫁', sub:'Tube thoracostomy procedure note', tips:'Missing fields, safe triangle (4th/5th ICS anterior axillary line), needle decompression before chest tube for tension PTX, CXR with lung re-expansion mandatory',
    secs:[{ic:'🫁',t:'Indication & Details',rows:[
      {t:'tip',cls:'rd',txt:'⚠️ High complication risk. Document all landmarks, confirmation, and drainage clearly.'},
      [{t:'s',id:'ind',lbl:'Indication',req:1,o:['Pneumothorax — simple','Pneumothorax — tension (needle decompressed first)','Hemothorax','Hemopneumothorax','Empyema','Pleural effusion — symptomatic']},{t:'s',id:'side',lbl:'Side',req:1,o:['Right','Left']}],
      [{t:'s',id:'fr',lbl:'Tube Size (Fr)',o:['28 Fr','32 Fr','36 Fr','40 Fr','14 Fr pigtail']},{t:'s',id:'site',lbl:'Insertion Site',o:['4th/5th ICS anterior axillary line (triangle of safety)','2nd ICS midclavicular (emergent PTX)','Posterior approach']},{t:'s',id:'anes',lbl:'Anesthetic',o:['Lidocaine 1% w/ epi — local','Lidocaine 2% — liberal infiltration','Procedural sedation (see separate note)']}],
      [{t:'i',id:'drain',lbl:'Drainage Output',ph:'e.g., 400 mL serosanguineous; air rush immediately'},{t:'s',id:'suct',lbl:'Suction',o:['-20 cmH₂O water-seal suction','Water seal only','Heimlich valve']}],
      {t:'c',id:'conf',lbl:'Confirmation',o:['*CXR — position confirmed','*Lung re-expanded on CXR','*Secured with suture','*Occlusive dressing']},
      {t:'a',id:'addl',lbl:'Notes',ph:'Tube in pleural space, draining well. Respiratory status improved…'}
    ]}]
  },
  cv: { name:'Cardioversion', ico:'⚡', sub:'Synchronized electrical cardioversion note', tips:'Missing fields, synchronized cardioversion mode documented, anticoagulation management if AFib >48h or unknown onset, energy (AFib 120-200J biphasic, VT 100J, flutter 50-100J)',
    secs:[
      {ic:'⚡',t:'Indication & Pre-Procedure',rows:[
        [{t:'s',id:'ind',lbl:'Indication / Rhythm',req:1,o:['AFib — unstable (hemodynamic compromise)','AFib — stable, rate uncontrolled, elective','Atrial flutter','SVT — refractory to Adenosine','VT — with pulse','VT — unstable']},{t:'s',id:'dur',lbl:'Duration of Dysrhythmia',o:['<48 hours — no anticoagulation required','>48h or unknown — anticoagulation discussed','Hemodynamic instability — emergent']}],
        {t:'i',id:'previt',lbl:'Pre-Procedure Vitals',ph:'e.g., BP 82/54, HR 148, SpO₂ 91%'}
      ]},
      {ic:'💊',t:'Sedation & Procedure',rows:[
        [{t:'s',id:'sed',lbl:'Sedation',o:['Midazolam 2mg IV + Fentanyl 50mcg IV','Etomidate 0.2 mg/kg IV','Propofol 1 mg/kg IV','Ketamine 0.5–1 mg/kg IV','None — immediate life threat']},{t:'i',id:'sed_dose',lbl:'Sedation Dose Given',ph:'e.g., Midazolam 2mg IV'}],
        [{t:'i',id:'j1',lbl:'Shock 1 — Joules',req:1,ph:'e.g., 100J biphasic'},{t:'s',id:'r1',lbl:'Result',o:['Sinus rhythm restored','No change','Partially effective']},{t:'i',id:'j2',lbl:'Shock 2 (if needed)',ph:'e.g., 200J'}],
        [{t:'s',id:'postrhythm',lbl:'Post-Cardioversion Rhythm',req:1,o:['Normal sinus rhythm','Sinus bradycardia','Junctional rhythm — transient','Persistent AFib','VF — defibrillated immediately']},{t:'i',id:'postvit',lbl:'Post-Cardioversion Vitals',ph:'e.g., BP 118/72, HR 78, SpO₂ 98%'}],
        {t:'a',id:'addl',lbl:'Notes',ph:'Patient tolerated well. Skin burns not noted at pad sites…'}
      ]}
    ]
  },
  par: { name:'Paracentesis', ico:'💧', sub:'Abdominal paracentesis procedure note', tips:'Missing fields, SBP if PMN >250 cells/mm³ (empiric antibiotics), albumin 6-8g/L for >5L removal, US guidance reduces complications',
    secs:[{ic:'💧',t:'Indication & Details',rows:[
      [{t:'s',id:'ind',lbl:'Indication',req:1,o:['Diagnostic — rule out SBP','Therapeutic — symptomatic relief','Both diagnostic and therapeutic']},{t:'s',id:'site',lbl:'Site',o:['LLQ (lateral to rectus, US-guided)','RLQ','Midline infraumbilical (landmark)']}],
      {t:'s',id:'us',lbl:'Ultrasound Used',req:1,o:['Real-time US guidance throughout','US for pocket ID, landmark insertion','Landmark technique only']},
      [{t:'i',id:'vol',lbl:'Volume Removed',ph:'e.g., 4.5 L'},{t:'s',id:'app',lbl:'Fluid Appearance',req:1,o:['Clear yellow (transudative)','Turbid / cloudy (exudative/SBP)','Bloody (hemoperitoneum)','Milky (chylous ascites)']}],
      {t:'c',id:'labs',lbl:'Studies Sent',o:['*Cell count + diff','*Protein, albumin, LDH','*Gram stain + culture','Glucose, amylase','Cytology']},
      {t:'s',id:'alb',lbl:'Albumin Replacement',o:['Not indicated — diagnostic / <5L','Albumin 25% given — 6–8g/L removed','Normal saline used']},
      {t:'c',id:'comp',lbl:'Complications',o:['*No complications','Bloody tap','Persistent leak']},
      {t:'a',id:'addl',lbl:'Notes',ph:'Patient tolerated well…'}
    ]}]
  },
  arth: { name:'Arthrocentesis', ico:'🦵', sub:'Joint aspiration procedure note', tips:'Missing fields, WBC >50k = septic (no steroid until cultures), urate crystals negatively birefringent (gout) vs rhomboid positively birefringent (pseudogout)',
    secs:[{ic:'🦵',t:'Joint & Indication',rows:[
      [{t:'s',id:'joint',lbl:'Joint',req:1,o:['Right knee','Left knee','Right ankle','Left ankle','Right wrist','Left wrist','Right elbow','Left elbow','Right shoulder','Left shoulder']},{t:'s',id:'ind',lbl:'Indication',req:1,o:['Rule out septic arthritis','Gout / pseudogout evaluation','Diagnostic — undiagnosed effusion','Therapeutic — pain relief','Hemarthrosis evaluation']}],
      [{t:'i',id:'vol',lbl:'Volume Aspirated',ph:'e.g., 35 mL'},{t:'s',id:'app',lbl:'Fluid Appearance',req:1,o:['Clear / straw-colored (normal)','Yellow, slightly turbid (inflammatory)','Opaque / purulent (septic vs crystals)','Bloody (hemarthrosis)','Chalky white (tophaceous gout)']}],
      {t:'c',id:'labs',lbl:'Studies Sent',o:['*Cell count + diff','*Crystal analysis (polarized microscopy)','*Gram stain + culture','Glucose, protein']},
      {t:'s',id:'ster',lbl:'Steroid Injection',o:['None — septic arthritis not yet excluded','Methylprednisolone acetate 40mg injected','Triamcinolone 40mg injected','Betamethasone 6mg injected']},
      {t:'a',id:'addl',lbl:'Notes',ph:'Needle entered joint with ease…'}
    ]}]
  },
  fast: { name:'FAST Exam', ico:'🔊', sub:'Focused assessment with sonography in trauma', tips:'All 4 (or 6 eFAST) views documented, action for positive FAST (surgery/CT/OR), FAST sensitivity ~80% (negative FAST does not exclude solid organ injury)',
    secs:[{ic:'🔊',t:'FAST Exam Documentation',rows:[
      [{t:'s',id:'ind',lbl:'Indication',req:1,o:['Blunt abdominal trauma','Penetrating abdominal trauma','Hypotension — unknown cause','Rib fractures / chest trauma','Extended FAST (eFAST)']},{t:'i',id:'ctx',lbl:'Clinical Context',ph:'e.g., MVC, restrained driver, hypotensive on arrival'}],
      [{t:'s',id:'ruq',lbl:"RUQ (Morison's Pouch)",req:1,o:['Negative — no free fluid','Positive — free fluid present','Indeterminate — limited view']},{t:'s',id:'luq',lbl:'LUQ (Splenorenal)',req:1,o:['Negative — no free fluid','Positive — free fluid present','Indeterminate — limited view']}],
      [{t:'s',id:'pelv',lbl:'Pelvic (Pouch of Douglas)',req:1,o:['Negative — no free fluid','Positive — free fluid present','Indeterminate']},{t:'s',id:'card',lbl:'Subxiphoid (Cardiac)',req:1,o:['Negative — no pericardial effusion','Positive — pericardial effusion','Indeterminate']}],
      [{t:'s',id:'rlung',lbl:'Right Pleural (eFAST)',o:['Not assessed','Negative — lung sliding present','Positive — absent lung sliding (PTX)','Right pleural effusion']},{t:'s',id:'llung',lbl:'Left Pleural (eFAST)',o:['Not assessed','Negative — lung sliding present','Positive — absent lung sliding (PTX)','Left pleural effusion']}],
      {t:'s',id:'result',lbl:'Overall FAST Result',req:1,o:['NEGATIVE FAST — no free fluid or pericardial effusion','POSITIVE FAST — free fluid identified','INDETERMINATE — cannot exclude injury']},
      {t:'s',id:'disp',lbl:'Clinical Disposition',o:['CT abdomen/pelvis with contrast ordered','Emergent surgery — positive FAST + hemodynamic instability','Serial abdominal exams — negative FAST, stable','Repeat FAST in 30 minutes','Pericardiocentesis — cardiac tamponade']},
      {t:'a',id:'addl',lbl:'Notes'}
    ]}]
  },
  dth: { name:'Death Pronouncement', ico:'📋', sub:'Pronouncement of death — clinical note', tips:'Time, exam findings, all notifications; ME/coroner required for unwitnessed/trauma/unclear cause/<24h admission; OPO must be notified in most deaths',
    secs:[
      {ic:'🕐',t:'Time & Circumstances',rows:[
        {t:'tip',cls:'am',txt:'📋 This note documents pronouncement of death. Include time, clinical findings, family notification, and required administrative notifications.'},
        [{t:'dt',id:'time',lbl:'Date & Time of Pronouncement',req:1},{t:'s',id:'circ',lbl:'Circumstances',req:1,o:['Cardiac arrest — resuscitation attempted','Cardiac arrest — DNR/DNI, not attempted','Cardiac arrest — prehospital ROSC, subsequent death','Expected death — terminal illness / comfort care','Traumatic arrest','Apparent natural death']}],
        {t:'c',id:'res',lbl:'Resuscitative Efforts',o:['Full resuscitation attempted','Terminated per ACLS protocol','DNR on file — not initiated','Comfort measures only']},
        {t:'i',id:'rdur',lbl:'Resuscitation Duration (if attempted)',ph:'e.g., 35 minutes ACLS, 10 cycles CPR'}
      ]},
      {ic:'🔬',t:'Clinical Examination Findings',rows:[
        {t:'c',id:'exam',lbl:'Examination at Pronouncement',req:1,o:['*Pupils fixed and dilated bilaterally','*No spontaneous respiratory effort','*Asystole confirmed on monitor','*No pulse (carotid + femoral)','*No response to painful stimulus','*Corneal reflex absent','Rigor mortis present','Dependent lividity present']},
        {t:'s',id:'rhythm',lbl:'Rhythm at Time of Death',o:['Asystole','PEA — flat line','Ventricular fibrillation — refractory','Pulseless VT — refractory']}
      ]},
      {ic:'👥',t:'Notifications & Administrative',rows:[
        {t:'c',id:'fam',lbl:'Family Notification',req:1,o:['Family present at time of death','Family notified by phone','Social work notified','Chaplain notified','Family unable to be reached']},
        {t:'c',id:'notif',lbl:'Required Notifications',o:['Attending physician notified','ME/Coroner notified','ME declined jurisdiction','OPO notified','Death certificate initiated']},
        [{t:'i',id:'cod',lbl:'Primary Cause of Death',ph:'e.g., Cardiac arrest due to acute MI'},{t:'i',id:'contrib',lbl:'Contributing Conditions',ph:'e.g., CAD, HTN, DM2'}],
        {t:'a',id:'addl',lbl:'Notes',ph:'All resuscitative efforts exhausted. Family expressed understanding…'}
      ]}
    ]
  },
  cryo: { name:'Cricothyrotomy', ico:'🌬️', sub:'Emergency surgical airway procedure', tips:'Last resort — failed intubation/obstruction, not routine; landmark vs palpation technique, TT tube size (6.0-6.5), CXR + bronchoscopy post-placement mandatory',
    secs:[
      {ic:'🌬️',t:'Indication & Pre-Procedure',rows:[
        {t:'tip',cls:'rd',txt:'⚠️ Emergency surgical airway. Document failed intubation attempts, obstruction type, and backup plans exhausted.'},
        [{t:'s',id:'ind',lbl:'Indication',req:1,o:['Airway obstruction — cannot intubate','Failed intubation ≥2 attempts','Facial trauma / massive edema','Epiglottitis refractory to medical management','Severe angioedema','Post-operative airway loss']},{t:'s',id:'method',lbl:'Technique',req:1,o:['Landmark palpation — cricothyroid membrane identified','Ultrasound guidance','Scalpel incision — classic','Needle/cannula approach']}],
        {t:'i',id:'prespo2',lbl:'SpO₂ Prior to Attempt',ph:'e.g., 78%'},
        {t:'c',id:'prep',lbl:'Preparation',o:['*Surgeon present / on call','*Operating room alerted','*Tracheostomy kit available','*Blood products ordered']}
      ]},
      {ic:'🔪',t:'Procedure Details',rows:[
        [{t:'i',id:'location',lbl:'Incision Location',ph:'Cricothyroid membrane'},{t:'i',id:'size',lbl:'Incision Size',ph:'e.g., 10-15mm'}],
        [{t:'s',id:'blade',lbl:'Blade/Scalpel',o:['#11 blade — needle approach','#15 blade — surgical approach','Scalpel for open technique']},{t:'s',id:'tube',lbl:'Airway Tube Size',o:['6.0 endotracheal tube','6.5 endotracheal tube','Tracheostomy tube (later conversion)']},{t:'s',id:'conf',lbl:'Confirmation',o:['Bilateral breath sounds ✓','Capnography positive ✓','Chest rise bilaterally','Tube secured + taped']}]
      ]},
      {ic:'✅',t:'Post-Procedure',rows:[
        {t:'c',id:'post',lbl:'Post-Cricothyrotomy',o:['*CXR ordered — tip position','*Bronchoscopy scheduled','*Anesthesia / ICU notified','*Tracheostomy planned within 24h']},
        {t:'c',id:'comp',lbl:'Complications',o:['*No complications','Subglottic stenosis risk','Laryngeal injury','Tracheal stenosis']},
        {t:'a',id:'addl',lbl:'Notes',ph:'Airway secured in extremis. Tracheostomy consultation ongoing…'}
      ]}
    ]
  },
  npa: { name:'Nasopharyngeal Airway', ico:'👃', sub:'Nasopharyngeal airway (NPA) insertion', tips:'Size appropriate for patient (typically 6-8 French), tube obstruction post-insertion, avoid if basilar skull fracture/massive epistaxis, lubricated insertion technique',
    secs:[{ic:'👃',t:'Airway Details & Insertion',rows:[
      [{t:'s',id:'ind',lbl:'Indication',req:1,o:['Nasopharyngeal airway — awake patient','Anterior airway obstruction relief','Failed oral airway tolerance']},{t:'s',id:'size',lbl:'Tube Size (Fr)',req:1,o:['6 Fr — small/child','7 Fr — medium','8 Fr — large adult']}],
      [{t:'s',id:'side',lbl:'Naris Selected',o:['Right naris','Left naris','Alternated']}],
      [{t:'i',id:'depth',lbl:'Insertion Depth (cm)',ph:'Length from naris to angle of jaw'}],
      {t:'c',id:'tech',lbl:'Technique',o:['*Lubricated with viscous lidocaine','*Gentle advancement — no force','*Bevel oriented posteriorly','*Patent after insertion']}
    ]}]
  },
  opa: { name:'Oropharyngeal Airway', ico:'👄', sub:'Oropharyngeal airway (OPA) insertion', tips:'Correct sizing (tooth to angle of jaw), head-tilt/chin-lift position, avoid tongue trauma, patient must be unconscious/deeply sedated',
    secs:[{ic:'👄',t:'Airway Details & Sizing',rows:[
      [{t:'s',id:'ind',lbl:'Indication',req:1,o:['Unconscious patient — airway support','Apnea management','Post-sedation airway patent']},{t:'s',id:'size',lbl:'Size',req:1,o:['Small — child','Medium — average adult','Large — tall/large adult']}],
      [{t:'i',id:'depth',lbl:'Insertion Depth (measured)',ph:'Angle of jaw to corner of mouth'},{t:'s',id:'tech',lbl:'Insertion Technique',req:1,o:['Tongue depressor down — direct insertion','Upside-down 180° rotation — classic method']}],
      {t:'c',id:'check',lbl:'Confirmation',o:['*No gag reflex triggered','*Airway patent — air flows','*Tongue not occluded','*Bilateral breath sounds']}
    ]}]
  },
  io: { name:'Intraosseous (IO) Access', ico:'💉', sub:'Intraosseous vascular access for resuscitation', tips:'Last resort for access — proximal humerus or proximal tibia standard, marrow aspiration before fluids, compartment syndrome risk if extravasation, labs/blood culture not reliable',
    secs:[
      {ic:'💉',t:'Indication & Site Selection',rows:[
        {t:'tip',cls:'rd',txt:'⚠️ High-risk. Document failed peripheral access, patient age/anatomy, and post-placement confirmation.'},
        [{t:'s',id:'ind',lbl:'Indication',req:1,o:['Cardiac arrest — no IV access','Severe shock — failed peripheral access','Pediatric resuscitation','Burns — extensive access difficulty']},{t:'s',id:'site',lbl:'Site',req:1,o:['Proximal humerus — anterolateral','Proximal tibia — medial (preferred peds)','Distal tibia — alternative','Distal femur — alternative']}],
        {t:'i',id:'att',lbl:'Attempts',ph:'e.g., 1 attempt successful'}
      ]},
      {ic:'🔧',t:'Procedure Details',rows:[
        [{t:'s',id:'needle',lbl:'Needle Gauge',o:['15G — adult','18G — adult','20G — pediatric','25G — neonate']},{t:'s',id:'ang',lbl:'Angle of Insertion',ph:'90° perpendicular to bone surface'},{t:'s',id:'asp',lbl:'Marrow Aspiration',o:['Aspirate before fluids — confirm placement','Blood return achieved','No aspirate — still patent']}],
        {t:'c',id:'conf',lbl:'Confirmation',o:['*Needle firm in bone','*Marrow aspirate obtained','*Free flow of fluid','*No extravasation']}
      ]},
      {ic:'✅',t:'Post-Placement',rows:[
        {t:'s',id:'secure',lbl:'Securing',o:['Gauze + tape around needle','Keyed connector secured']},
        {t:'c',id:'comp',lbl:'Complications & Follow-Up',o:['*No compartment syndrome','Osteomyelitis risk','Fracture risk in osteoporosis']},
        {t:'a',id:'addl',lbl:'Notes',ph:'IO access secured for medication/fluid administration…'}
      ]}
    ]
  },
  art: { name:'Arterial Line Placement', ico:'🩸', sub:'Radial or femoral arterial line for hemodynamics', tips:'Radial preferred (collateral circulation via ulnar), Allen test before radial, femoral for resuscitation, waveform analysis mandatory, infection risk if >48h',
    secs:[{ic:'🩸',t:'Indication & Site Selection',rows:[
      [{t:'s',id:'ind',lbl:'Indication',req:1,o:['Continuous BP monitoring','Frequent lab draws / ABGs','Vasopressor infusion','Hemodynamic instability — need trending']},{t:'s',id:'site',lbl:'Site',req:1,o:['Radial artery','Femoral artery','Axillary artery (alternative)']}],
      [{t:'s',id:'allen',lbl:'Allen Test (if radial)',o:['Positive — ulnar collateral patent','Negative — do not use radial','Not performed']},{t:'i',id:'size',lbl:'Catheter Size',ph:'e.g., 20G or 18G'}],
      {t:'c',id:'us',lbl:'Technique',o:['*Ultrasound guidance','*Landmark palpation','*Waveform-assisted (Doppler)']}
    ]}]
  },
  piv: { name:'Peripheral IV Access', ico:'💉', sub:'Peripheral intravenous line insertion', tips:'Two large-bore IVs standard for resuscitation, arm veins preferred (antecubital > wrist > hand), avoid lower extremities in abdominal trauma, assess for infiltration',
    secs:[{ic:'💉',t:'IV Details & Placement',rows:[
      [{t:'s',id:'ind',lbl:'Indication',req:1,o:['IV access — medications/fluids','Resuscitation access','Blood draw access']},{t:'s',id:'gauge',lbl:'Gauge',req:1,o:['18G — large bore / resuscitation','20G — standard','22G — peds / difficult access']}],
      [{t:'s',id:'site',lbl:'Site',req:1,o:['Antecubital fossa — preferred','Wrist / forearm vein','Hand — last resort','Lower extremity — avoid if abdominal trauma']},{t:'i',id:'att',lbl:'Attempts',ph:'e.g., 1 attempt successful'}],
      {t:'c',id:'conf',lbl:'Confirmation',o:['*Blood return on needle pull-back','*Fluid infuses without resistance','*No swelling around site','*Secured with securement device']}
    ]}]
  },
  ngt: { name:'Nasogastric Tube', ico:'🧴', sub:'Nasogastric tube (NGT) insertion for decompression/feeds', tips:'Size 16-18 Fr standard, pH <6 confirms gastric placement, CXR if any doubt, tube obstruction/ileus common, contraindicated in basilar skull fracture',
    secs:[{ic:'🧴',t:'Indication & Tube Selection',rows:[
      [{t:'s',id:'ind',lbl:'Indication',req:1,o:['Gastric decompression — ileus','Aspiration risk — NPO patient','Medication administration','Enteral feeding — long-term']},{t:'s',id:'size',lbl:'Tube Size (Fr)',o:['14 Fr — small / pediatric','16 Fr — standard adult','18 Fr — large adult / suction']}],
      [{t:'s',id:'side',lbl:'Naris Selected',o:['Right naris','Left naris','Route: oral (if nasal contraindicated)']}]
    ]},
    {ic:'✅',t:'Placement & Confirmation',rows:[
      [{t:'i',id:'depth',lbl:'Insertion Depth (cm)',ph:'e.g., 50cm at naris'},{t:'s',id:'conf',lbl:'Confirmation',req:1,o:['*Gastric aspirate obtained','*pH <6 on aspirate','*CXR — tube position confirmed','*Auscultation — air in stomach']}],
      {t:'c',id:'comp',lbl:'Complications',o:['*No complications','Right mainstem (rare)','Sinusitis risk']},
      {t:'a',id:'addl',lbl:'Notes',ph:'Tube secured at naris. Gastrointestinal function being assessed…'}
    ]}]
  },
  foley: { name:'Foley Catheter', ico:'🚽', sub:'Indwelling urinary catheter placement', tips:'18-22 Fr standard, aseptic technique mandatory, check for hematuria post-placement, monitor for UTI/urosepsis, daily assessment for removal',
    secs:[{ic:'🚽',t:'Indication & Catheter Selection',rows:[
      [{t:'s',id:'ind',lbl:'Indication',req:1,o:['Acute urinary retention','Sepsis — accurate I/Os','Hemodynamically unstable — UOP monitor','Burn / severe injury — fluid balance']},{t:'s',id:'size',lbl:'Catheter Size (Fr)',req:1,o:['16 Fr','18 Fr — standard','20 Fr','22 Fr — latex allergy patients']}],
      {t:'s',id:'allergy',lbl:'Latex Allergy Status',o:['No allergy — standard catheter','Latex allergy — silicone catheter','Unknown — latex-free precautions']}
    ]},
    {ic:'✅',t:'Placement & Confirmation',rows:[
      [{t:'c',id:'tech',lbl:'Technique',o:['*Sterile field maintained','*Betadine / chlorhexidine prep','*Straight shot — no resistance','*Urine return in bag']},{t:'i',id:'urine',lbl:'Urine Output at Insertion',ph:'e.g., 400 mL clear yellow'}],
      {t:'s',id:'color',lbl:'Urine Color/Character',req:1,o:['Clear / pale yellow','Cloudy','Tea-colored (hemoglobinuria)','Bloody / gross hematuria']},
      {t:'c',id:'comp',lbl:'Complications',o:['*No urethral trauma','*No hematuria','Inability to pass (retention/obstruction)','Bladder perforation']},
      {t:'a',id:'addl',lbl:'Notes',ph:'Foley secured. Hourly UOP monitoring begun…'}
    ]}]
  },
  resh: { name:'Resuscitative Hysterotomy', ico:'👶', sub:'Perimortem cesarean delivery for maternal resuscitation', tips:'Performed at ~4-5 min maternal cardiac arrest; left uterine displacement inadequate; increase CO if no return of spontaneous circulation; consider fetal prognosis post-delivery',
    secs:[{ic:'👶',t:'Indication & Procedure',rows:[
      {t:'tip',cls:'rd',txt:'⚠️ Emergency obstetric procedure. Document arrest time, hysterotomy indication, and fetal viability assessment.'},
      [{t:'i',id:'gest',lbl:'Gestational Age',ph:'e.g., 32 weeks'},{t:'s',id:'ind',lbl:'Indication for Hysterotomy',req:1,o:['Maternal cardiac arrest >4 minutes unresponsive to ACLS','Severe uterine compression impeding CPR','Suspected placental abruption / obstetric emergency']}],
      [{t:'i',id:'arrest_t',lbl:'Time of Maternal Arrest',ph:'HH:MM'},{t:'i',id:'hyst_t',lbl:'Time of Hysterotomy',ph:'HH:MM (interval)'},{t:'s',id:'outcome',lbl:'Maternal Response',o:['ROSC — return of spontaneous circulation','No ROSC — ongoing resuscitation','Died during hysterotomy']}]
    ]},
    {ic:'🍼',t:'Fetal Outcome',rows:[
      [{t:'s',id:'fetal_out',lbl:'Fetal Status Post-Delivery',o:['Live birth — resuscitation initiated','Meconium staining — suctioning','Stillbirth','Unable to assess']}],
      {t:'c',id:'comp',lbl:'Maternal Complications',o:['*No massive hemorrhage','Uterine atony — oxytocin','Placental abruption noted','Amniotic fluid embolism suspected']}
    ]}]
  },
  fin: { name:'Finger Thoracostomy', ico:'⚡', sub:'Finger-directed thoracostomy for hemothorax/pneumothorax', tips:'Emergency procedure for unstable patients; finger thoracostomy bridges to chest tube; confirm placement — blood/air return; post-placement CXR required',
    secs:[{ic:'⚡',t:'Indication & Procedure',rows:[
      {t:'tip',cls:'rd',txt:'⚠️ Emergency trauma procedure. Document shock state, bilateral breath sounds, and clinical response.'},
      [{t:'s',id:'ind',lbl:'Indication',req:1,o:['Massive hemothorax — hypotension','Tension pneumothorax unresponsive to needle decompression','Simultaneous hemopneumothorax']},{t:'s',id:'side',lbl:'Side',req:1,o:['Right','Left','Bilateral']}],
      [{t:'s',id:'site',lbl:'Insertion Site',o:['4th/5th ICS anterior axillary line','5th ICS midaxillary line']},{t:'i',id:'outcome',lbl:'Fluid/Air Return',ph:'e.g., 500 mL blood; immediate air leak'},{t:'s',id:'resp',lbl:'Hemodynamic Response',o:['BP improved immediately','HR normalized','Breath sounds returned (pneumothorax)','No improvement — ongoing resuscitation']}]
    ]},
    {ic:'✅',t:'Post-Procedure',rows:[
      {t:'c',id:'post',lbl:'Management',o:['*Chest tube placement scheduled','*Cross-matched blood ordered','*CXR ordered','*ICU admission']}
    ]}]
  },
  esch: { name:'Escharotomy', ico:'🔥', sub:'Surgical incision through eschar for burn management', tips:'Circumferential burns — threat to limb perfusion; escharotomy within first 24h of burn; bloodless field (consider exsanguination); assess limb perfusion before/after',
    secs:[{ic:'🔥',t:'Indication & Assessment',rows:[
      [{t:'s',id:'ind',lbl:'Indication',req:1,o:['Circumferential deep burn — limb perfusion at risk','Circumferential thoracic burn — respiratory compromise','High-voltage electrical burn — compartment syndrome risk']},{t:'s',id:'side',lbl:'Extremity Affected',o:['Right upper extremity','Left upper extremity','Right lower extremity','Left lower extremity','Chest / abdomen']}],
      {t:'c',id:'pre',lbl:'Pre-Escharotomy Assessment',o:['*Pulse present distal to eschar','*Capillary refill delayed / absent','*Pain / paresthesias documented','*Temperature gradient loss']}
    ]},
    {ic:'🔪',t:'Procedure & Outcome',rows:[
      [{t:'s',id:'method',lbl:'Method',o:['Electrocautery / scalpel incision','Laser (if available)']},{t:'i',id:'length',lbl:'Incision Length',ph:'Full length of circumferential burn'},{t:'s',id:'depth',lbl:'Depth',o:['Through eschar only — fat layer visible','Full thickness burn — limited bleeding']}],
      {t:'c',id:'post',lbl:'Post-Escharotomy Assessment',o:['*Distal pulses restored / improved','*Capillary refill normalized','*Pain / paresthesia improved','*Limb perfusion adequate']}
    ]}]
  },
};

const PROCEDURE_GROUPS = [
  { label:'Wound & Soft Tissue', icon:'🩹', keys:['lac','iand','fb','wc'] },
  { label:'Orthopedic', icon:'🦴', keys:['sp','red'] },
  { label:'Airway Management', icon:'🌬️', keys:['intub','sed','cryo','npa','opa'] },
  { label:'Vascular Access', icon:'💉', keys:['piv','art','io'] },
  { label:'Thoracic', icon:'🫁', keys:['cl','ct','fin'] },
  { label:'Procedures', icon:'🩺', keys:['lp','cv','par','arth','ngt','foley'] },
  { label:'Trauma & Critical', icon:'⚡', keys:['fast','resh','esch'] },
  { label:'Special Notes', icon:'📋', keys:['dth'] },
];

const TABS = ['select','document','note'];

// ─── Form Builder ─────────────────────────────────────────────────────────
function FormField({ f, formData, setFormData }) {
  const update = (val) => setFormData(p => ({ ...p, [f.id]: val }));

  if (f.t === 'tip') return (
    <div style={{ padding:'10px 14px', borderRadius:8, marginBottom:4, background: f.cls==='rd'?'rgba(255,71,87,.07)':'rgba(245,166,35,.07)', border:`1px solid ${f.cls==='rd'?'rgba(255,71,87,.3)':'rgba(245,166,35,.3)'}`, fontSize:12, color: f.cls==='rd'?'#ff8c96':'#f5c87a', lineHeight:1.6 }}>
      {f.txt}
    </div>
  );

  const fieldStyle = { width:'100%', background:'#0d2035', border:'1px solid #1e4060', borderRadius:7, color:'#e4eef8', fontFamily:"'Outfit',sans-serif", fontSize:13, padding:'10px 13px', outline:'none', transition:'.2s' };

  const label = (
    <div style={{ fontSize:11, fontWeight:600, color:'#4a7a9b', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6, display:'flex', alignItems:'center', gap:4 }}>
      {f.lbl}{f.req && <span style={{ color:'#ff4757', fontSize:10 }}>*</span>}
    </div>
  );

  if (f.t === 'i') return <div style={{ display:'flex', flexDirection:'column' }}>{label}<input style={fieldStyle} value={formData[f.id]||''} onChange={e=>update(e.target.value)} placeholder={f.ph||''} /></div>;
  if (f.t === 'dt') return <div style={{ display:'flex', flexDirection:'column' }}>{label}<input type="datetime-local" style={fieldStyle} value={formData[f.id]||''} onChange={e=>update(e.target.value)} /></div>;
  if (f.t === 'a') return <div style={{ display:'flex', flexDirection:'column' }}>{label}<textarea style={{ ...fieldStyle, resize:'vertical', minHeight:80, lineHeight:1.6 }} value={formData[f.id]||''} onChange={e=>update(e.target.value)} placeholder={f.ph||''} /></div>;

  if (f.t === 's') {
    const opts = f.o.flatMap(o => typeof o === 'object' ? o.o.map(x => ({ g: o.g, v: x })) : [{ g: null, v: o }]);
    return (
      <div style={{ display:'flex', flexDirection:'column' }}>
        {label}
        <select style={{ ...fieldStyle, cursor:'pointer' }} value={formData[f.id]||''} onChange={e=>update(e.target.value)}>
          <option value="">Select…</option>
          {opts.map((o, i) => <option key={i} value={o.v}>{o.g ? `[${o.g}] ` : ''}{o.v}</option>)}
        </select>
      </div>
    );
  }

  if (f.t === 'c') {
    const options = f.o.map(o => ({ checked: o[0]==='*', lbl: o[0]==='*'?o.slice(1):o }));
    const selected = formData[f.id] || options.filter(o=>o.checked).map(o=>o.lbl);
    const toggle = (lbl) => {
      const arr = Array.isArray(selected) ? selected : [];
      const next = arr.includes(lbl) ? arr.filter(x=>x!==lbl) : [...arr, lbl];
      update(next);
    };
    return (
      <div>
        {label}
        <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
          {options.map(o => {
            const on = Array.isArray(selected) ? selected.includes(o.lbl) : false;
            return (
              <div key={o.lbl} onClick={()=>toggle(o.lbl)} style={{ padding:'5px 11px', borderRadius:20, cursor:'pointer', fontSize:12, border:`1px solid ${on?'#0096d6':'#1e4060'}`, background:on?'rgba(0,150,214,.12)':'transparent', color:on?'#00c6ff':'#8aacc6', transition:'.15s', userSelect:'none' }}>
                {o.lbl}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
}

function FormRow({ row, formData, setFormData }) {
  if (!Array.isArray(row)) return <FormField f={row} formData={formData} setFormData={setFormData} />;
  return (
    <div style={{ display:'grid', gridTemplateColumns:`repeat(${row.length},1fr)`, gap:14 }}>
      {row.map((f,i) => <FormField key={i} f={f} formData={formData} setFormData={setFormData} />)}
    </div>
  );
}

function ProcedureForm({ proc, formData, setFormData }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {proc.secs.map((sec, si) => (
        <div key={si} style={{ background:'#0a1929', border:'1px solid #1a3550', borderRadius:10, overflow:'hidden' }}>
          <div style={{ padding:'11px 18px', background:'#0d2035', borderBottom:'1px solid #1a3550', display:'flex', alignItems:'center', gap:8 }}>
            <span>{sec.ic}</span>
            <span style={{ fontSize:11, fontWeight:600, color:'#e4eef8', letterSpacing:'.06em', textTransform:'uppercase' }}>{sec.t}</span>
          </div>
          <div style={{ padding:'18px', display:'flex', flexDirection:'column', gap:14 }}>
            {sec.rows.map((row, ri) => <FormRow key={ri} row={row} formData={formData} setFormData={setFormData} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────
export default function EDProcedureNotes() {
  const [tab, setTab] = useState('select');
  const [selProc, setSelProc] = useState(null);
  const [formData, setFormData] = useState({});
  const [generatedNote, setGeneratedNote] = useState('');
  const [generating, setGenerating] = useState(false);
  const [aiMsg, setAiMsg] = useState(null);
  const [aiPct, setAiPct] = useState(0);
  const [aiReviewing, setAiReviewing] = useState(false);
  const [toast, setToast] = useState('');
  const [clock, setClock] = useState('');
  const [saving, setSaving] = useState(false);
  const aiTimer = useRef(null);
  const aiReqId = useRef(0);
  const autoSaveTimer = useRef(null);

  // Load clinical notes for patient context
  const { data: notes = [] } = useQuery({
    queryKey: ['clinicalNotes'],
    queryFn: () => base44.entities.ClinicalNote.list('-updated_date', 20),
  });

  const [selectedNoteId, setSelectedNoteId] = useState('');
  const [ptCtx, setPtCtx] = useState({ patientName:'', mrn:'', dob:'', age:'', allergies:'', encounterDate: new Date().toISOString().slice(0,10), physicianName:'' });

  useEffect(() => {
    const iv = setInterval(() => setClock(new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:false})), 1000);
    return () => clearInterval(iv);
  }, []);

  const loadFromNote = (noteId) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    setSelectedNoteId(noteId);
    setPtCtx({
      patientName: note.patient_name || '',
      mrn: note.patient_id || '',
      dob: note.date_of_birth || '',
      age: note.patient_age || '',
      allergies: (note.allergies || []).join(', '),
      encounterDate: note.date_of_visit || new Date().toISOString().slice(0,10),
      physicianName: '',
    });
  };

  const selectProc = (key) => {
    setSelProc(key);
    setFormData({});
    setGeneratedNote('');
    triggerAI(key, {});
  };

  const triggerAI = async (procKey, fd) => {
    const proc = P[procKey];
    if (!proc) return;
    const reqId = ++aiReqId.current;
    setAiReviewing(true);
    setAiMsg(null);
    setAiPct(0);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert ED physician AI. Review this ${proc.name} procedure note form data and provide concise clinical guidance.

Patient: ${ptCtx.patientName || 'Unknown'} | Allergies: ${ptCtx.allergies || 'None documented'}
Key things to check: ${proc.tips}
Form data: ${JSON.stringify(fd)}

Return JSON: {"guidance": "HTML string with <b>SECTION:</b> headers. Use <span class=\\"ok\\">✓</span> for complete items, <span class=\\"warn\\">⚠</span> for warnings, <span class=\\"miss\\">✗</span> for missing required items. Under 180 words.", "completeness": 0 to 100}`,
        response_json_schema: { type:'object', properties:{ guidance:{type:'string'}, completeness:{type:'number'} } }
      });
      if (reqId !== aiReqId.current) return;
      setAiMsg(result.guidance || 'Review complete.');
      setAiPct(result.completeness || 0);
    } catch (e) {
      if (reqId !== aiReqId.current) return;
      setAiMsg('<span class="miss">⚠ AI connection error — check form manually.</span>');
    } finally {
      if (reqId === aiReqId.current) setAiReviewing(false);
    }
  };

  const debounceAI = () => {
    clearTimeout(aiTimer.current);
    aiTimer.current = setTimeout(() => { if (selProc) triggerAI(selProc, formData); }, 1800);
  };

  useEffect(() => { return () => clearTimeout(aiTimer.current); }, []);

  const generateNote = async () => {
    if (!selProc) return;
    const proc = P[selProc];
    setGenerating(true);
    setTab('note');
    setGeneratedNote('Generating procedure note…');
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        model: 'claude_sonnet_4_6',
        prompt: `You are an expert ED physician generating a formal, ready-to-sign procedure note.

PATIENT: ${ptCtx.patientName || '[Patient Name]'}
DOB: ${ptCtx.dob || '[DOB]'} | MRN: ${ptCtx.mrn || '[MRN]'} | AGE: ${ptCtx.age || '[Age]'}
ALLERGIES: ${ptCtx.allergies || 'None documented'}
DATE: ${ptCtx.encounterDate || new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}
ATTENDING: ${ptCtx.physicianName || '[Physician Name, MD]'}
PROCEDURE: ${proc.name}

FORM DATA:
${JSON.stringify(formData, null, 2)}

Write a formal procedure note using ALL CAPS section headers. Third-person past tense. Professional prose paragraphs — no bullets. Include all documented details. Do not invent information not in the form data. End with a signature line.`
      });
      setGeneratedNote(typeof result === 'string' ? result : JSON.stringify(result));
    } catch (e) {
      setGeneratedNote('Error generating note. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const copyNote = async () => {
    try {
      await navigator.clipboard.writeText(generatedNote);
      showToast('Note copied to clipboard!');
    } catch { showToast('Copy failed — select text manually'); }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const saveProcedureNote = async (autoSave = false) => {
    if (!selProc || !generatedNote) return;
    setSaving(true);
    try {
      const logData = {
        patient_name: ptCtx.patientName || '',
        patient_id: ptCtx.mrn || '',
        procedure_name: proc.name,
        indication: formData.ind || '',
        date_performed: new Date().toISOString(),
        operator: ptCtx.physicianName || '',
        technique: formData.tech || generatedNote.slice(0, 500),
        findings: formData.find || '',
        complications: formData.comp || '',
        outcome: formData.outcome || 'successful',
        post_procedure_plan: formData.plan || '',
        status: 'completed',
        documentation_files: []
      };
      await base44.entities.ProcedureLog.create(logData);
      showToast(autoSave ? 'Auto-saved' : 'Procedure logged successfully');
    } catch (e) {
      showToast('Save failed — please try again');
      console.error('Save error:', e);
    } finally {
      setSaving(false);
    }
  };

  const debouncedAutoSave = () => {
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      if (generatedNote && selProc) saveProcedureNote(true);
    }, 30000);
  };

  useEffect(() => {
    if (generatedNote) debouncedAutoSave();
    return () => clearTimeout(autoSaveTimer.current);
  }, [generatedNote]);

  const proc = selProc ? P[selProc] : null;
  const pctColor = aiPct >= 80 ? '#00e5a0' : aiPct >= 50 ? '#f5a623' : '#ff4757';

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=JetBrains+Mono:wght@400;500&family=Outfit:wght@400;500;600&family=Lora:wght@400;600&display=swap');
    .epn-root { position:fixed; top:48px; left:72px; right:0; bottom:0; background:#050f1e; color:#e4eef8; font-family:'Outfit',sans-serif; font-size:14px; display:flex; flex-direction:column; overflow:hidden; z-index:10; }
    .epn-root input, .epn-root select, .epn-root textarea { transition: border-color .15s; }
    .epn-root input:focus, .epn-root select:focus, .epn-root textarea:focus { border-color:#0096d6 !important; box-shadow:0 0 0 2px rgba(0,150,214,.12); outline:none; }
    .epn-root input::placeholder, .epn-root textarea::placeholder { color:#2a4d72; }
    .epn-root select option { background:#0a1929; }
    .epn-root ::-webkit-scrollbar { width:4px; }
    .epn-root ::-webkit-scrollbar-thumb { background:#1e4060; border-radius:2px; }
    .epn-pc { background:#0a1929; border:1px solid #1e4060; border-radius:12px; padding:15px 13px; cursor:pointer; transition:.2s; display:flex; flex-direction:column; gap:7px; position:relative; overflow:hidden; }
    .epn-pc:hover { border-color:#0096d6; transform:translateY(-2px); box-shadow:0 6px 20px rgba(0,150,214,.15); }
    .epn-pc.sel { border-color:#00c6ff; background:rgba(0,198,255,.07); box-shadow:0 0 0 1px #00c6ff; }
    .epn-sb-item { display:flex; align-items:center; gap:9px; padding:8px 14px; cursor:pointer; border-left:2px solid transparent; transition:.15s; color:#8aacc6; font-size:13px; }
    .epn-sb-item:hover { background:#0d2035; color:#e4eef8; }
    .epn-sb-item.active { background:#0d2035; color:#00c6ff; border-left-color:#00c6ff; }
    .epn-bt { padding:0 14px; height:38px; display:flex; align-items:center; gap:6px; cursor:pointer; border-bottom:2px solid transparent; color:#4a7a9b; font-size:12px; font-weight:500; transition:.15s; background:transparent; border-top:none; border-left:none; border-right:none; white-space:nowrap; }
    .epn-bt:hover { color:#8aacc6; }
    .epn-bt.active { color:#00c6ff; border-bottom-color:#00c6ff; }
    .epn-btn { padding:6px 14px; border-radius:6px; font-size:12px; font-weight:500; cursor:pointer; transition:.15s; border:1px solid #1e4060; background:transparent; color:#8aacc6; font-family:'Outfit',sans-serif; }
    .epn-btn:hover { background:#0d2035; color:#e4eef8; }
    .epn-btn.p { background:#0096d6; color:#fff; border-color:#0096d6; }
    .epn-btn.p:hover { background:#00c6ff; border-color:#00c6ff; }
    .epn-btn.s { background:rgba(0,229,160,.12); color:#00e5a0; border-color:#00b880; }
    .epn-btn:disabled { opacity:.35; pointer-events:none; }
    .aim b { color:#00c6ff; }
    .aim .ok { color:#00e5a0; }
    .aim .warn { color:#f5a623; }
    .aim .miss { color:#ff4757; }
    @keyframes epn-blink { 0%,80%,100%{opacity:.2} 40%{opacity:1} }
    .epn-dots span { display:inline-block; width:5px; height:5px; border-radius:50%; background:#00c6ff; margin:0 2px; animation:epn-blink 1.2s infinite; }
    .epn-dots span:nth-child(2) { animation-delay:.2s; }
    .epn-dots span:nth-child(3) { animation-delay:.4s; }
  `;

  return (
    <>
      <style>{CSS}</style>
      <div className="epn-root">

        {/* Navbar */}
        <nav style={{ flexShrink:0, height:50, background:'#0a1929', borderBottom:'1px solid #1a3550', display:'flex', alignItems:'center', padding:'0 16px', gap:12, zIndex:200 }}>
          <span style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, background:'linear-gradient(135deg,#00c6ff,#00e5a0)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Notrya</span>
          <div style={{ width:1, height:24, background:'#1e4060' }} />
          <span style={{ fontFamily:"'Playfair Display',serif", fontSize:15, color:'#8aacc6' }}>ED Procedure Notes</span>
          <div style={{ flex:1 }} />
          {/* Note picker */}
          <select style={{ background:'#0d2035', border:'1px solid #1e4060', borderRadius:7, color:'#8aacc6', fontSize:11, padding:'4px 10px', outline:'none', cursor:'pointer', fontFamily:"'Outfit',sans-serif", maxWidth:240 }} value={selectedNoteId} onChange={e=>loadFromNote(e.target.value)}>
            <option value="">Load patient from note…</option>
            {notes.map(n => <option key={n.id} value={n.id}>{n.patient_name||'Unknown'} — {n.date_of_visit||n.created_date?.slice(0,10)||''}</option>)}
          </select>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, padding:'3px 10px', borderRadius:20, border:'1px solid #1e4060', color:'#4a7a9b', background:'#0d2035' }}>{ptCtx.encounterDate}</span>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, padding:'3px 10px', borderRadius:20, border:'1px solid #00b880', color:'#00e5a0' }}>● AI Ready</span>
          <Link to="/Home" style={{ padding:'5px 12px', border:'1px solid #1e4060', borderRadius:6, background:'transparent', color:'#8aacc6', cursor:'pointer', fontSize:12, textDecoration:'none', display:'flex', alignItems:'center', gap:5 }}>← Home</Link>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:'#4a7a9b' }}>{clock}</span>
        </nav>

        {/* Vitals bar */}
        <div style={{ flexShrink:0, height:38, background:'#0d2035', borderBottom:'1px solid #1a3550', display:'flex', alignItems:'center', padding:'0 16px 0 calc(220px + 16px)', gap:20, fontFamily:"'JetBrains Mono',monospace", fontSize:11, overflow:'hidden' }}>
          {ptCtx.patientName ? (
            <>
              <span style={{ fontFamily:"'Playfair Display',serif", fontSize:13, color:'#e4eef8' }}>{ptCtx.patientName}</span>
              <span style={{ color:'#1e4060' }}>|</span>
              <span style={{ color:'#4a7a9b' }}>MRN</span><span style={{ color:'#e4eef8' }}>{ptCtx.mrn||'—'}</span>
              <span style={{ color:'#1e4060' }}>|</span>
              <span style={{ color:'#4a7a9b' }}>AGE</span><span style={{ color:'#e4eef8' }}>{ptCtx.age||'—'}</span>
              {ptCtx.allergies && <><span style={{ color:'#1e4060' }}>|</span><span style={{ color:'#4a7a9b' }}>Allergies</span><span style={{ color:'#ff8c96' }}>{ptCtx.allergies}</span></>}
              {proc && <><span style={{ color:'#1e4060' }}>|</span><span style={{ color:'#4a7a9b' }}>Procedure</span><span style={{ color:'#00c6ff' }}>{proc.ico} {proc.name}</span></>}
            </>
          ) : (
            <span style={{ color:'#4a7a9b' }}>No patient loaded — select a clinical note above or choose a procedure to begin</span>
          )}
        </div>

        {/* Body */}
        <div style={{ display:'flex', flex:1, overflow:'hidden' }}>

          {/* Sidebar */}
          <aside style={{ width:220, flexShrink:0, background:'#0a1929', borderRight:'1px solid #1a3550', overflowY:'auto', padding:'10px 0', display:'flex', flexDirection:'column', gap:1 }}>
            <div style={{ padding:'5px 14px 3px', fontSize:10, fontWeight:600, color:'#4a7a9b', letterSpacing:'.1em', textTransform:'uppercase' }}>Workflow</div>
            {[['select','📁','Select'],['document','📝','Document'],['note','📄','Note']].map(([t,ic,lbl]) => (
              <div key={t} className={`epn-sb-item${tab===t?' active':''}`} onClick={()=>setTab(t)}>
                <span style={{ fontSize:14, width:18, textAlign:'center' }}>{ic}</span>{lbl}
              </div>
            ))}
            <div style={{ padding:'10px 14px 3px', fontSize:10, fontWeight:600, color:'#4a7a9b', letterSpacing:'.1em', textTransform:'uppercase', marginTop:8 }}>Quick Select</div>
            {['lac','iand','intub','cryo','piv','io','cl','ct','lp','ngt','foley','fast'].map(k => (
              <div key={k} className={`epn-sb-item${selProc===k?' active':''}`} onClick={()=>{selectProc(k);setTab('document');}}>
                <span style={{ fontSize:14, width:18, textAlign:'center' }}>{P[k].ico}</span>{P[k].name}
              </div>
            ))}
            <div style={{ padding:'10px 14px 3px', fontSize:10, fontWeight:600, color:'#4a7a9b', letterSpacing:'.1em', textTransform:'uppercase', marginTop:8 }}>Patient</div>
            <div className="epn-sb-item">
              <span style={{ fontSize:14, width:18, textAlign:'center' }}>💊</span>
              Allergies
              {ptCtx.allergies && <span style={{ marginLeft:'auto', fontFamily:"'JetBrains Mono',monospace", fontSize:10, padding:'1px 6px', borderRadius:10, background:'rgba(255,71,87,.15)', color:'#ff4757', border:'1px solid rgba(255,71,87,.35)' }}>!</span>}
            </div>
            <div className="epn-sb-item"><span style={{ fontSize:14, width:18, textAlign:'center' }}>🏥</span><Link to="/AutoCoder" style={{ color:'inherit', textDecoration:'none' }}>ICD-10 Coder</Link></div>
            <div className="epn-sb-item"><span style={{ fontSize:14, width:18, textAlign:'center' }}>🩺</span><Link to="/ClinicalNoteStudio" style={{ color:'inherit', textDecoration:'none' }}>Note Studio</Link></div>
          </aside>

          {/* Main */}
          <main style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column' }}>

            {/* SELECT TAB */}
            {tab === 'select' && (
              <div style={{ flex:1, overflowY:'auto', padding:'28px 32px', display:'flex', flexDirection:'column', gap:24 }}>
                {/* Header */}
                <div>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:700, color:'#e4eef8', marginBottom:4 }}>Select Procedure</div>
                  <div style={{ fontSize:13, color:'#4a7a9b' }}>Choose procedure — form fields populate automatically</div>
                </div>

                {/* AI Info Box */}
                <div style={{ background:'rgba(0,198,255,.06)', border:'1px solid rgba(0,198,255,.25)', borderRadius:10, padding:'12px 15px', fontSize:12, color:'#8aacc6', display:'flex', alignItems:'flex-start', gap:10 }}>
                  <span style={{ fontSize:14, flexShrink:0 }}>💡</span>
                  <span>AI guidance activates on selection. Templates aligned with billing and medicolegal standards.</span>
                </div>

                {/* Procedure Groups */}
                {PROCEDURE_GROUPS.map(grp => (
                  <div key={grp.label}>
                    {/* Group Header */}
                    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'0 0 16px 0', borderBottom:'1px solid #1a3550', marginBottom:14 }}>
                      <span style={{ fontSize:20 }}>{grp.icon}</span>
                      <span style={{ fontSize:13, fontWeight:700, color:'#e4eef8', letterSpacing:'.05em', textTransform:'uppercase' }}>{grp.label}</span>
                    </div>
                    
                    {/* Procedure Cards */}
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:14 }}>
                      {grp.keys.map(k => {
                        const p = P[k];
                        const isHigh = ['intub','cl','ct','cv'].includes(k);
                        const isMod = ['red','sed','lp','par'].includes(k);
                        return (
                          <div
                            key={k}
                            onClick={()=>{selectProc(k);setTab('document');}}
                            style={{
                              background:'#0a1929',
                              border: selProc===k ? '1.5px solid #00c6ff' : '1px solid #1a3550',
                              borderRadius:12,
                              padding:'18px 16px',
                              cursor:'pointer',
                              transition:'.2s',
                              position:'relative',
                              overflow:'hidden',
                              boxShadow: selProc===k ? '0 0 0 1px #00c6ff, 0 8px 24px rgba(0,150,214,.15)' : 'none',
                              transform: selProc===k ? 'translateY(-2px)' : 'none',
                            }}
                            onMouseEnter={e => {
                              if (selProc!==k) {
                                e.currentTarget.style.borderColor = '#1e4060';
                                e.currentTarget.style.background = '#0d2035';
                              }
                            }}
                            onMouseLeave={e => {
                              if (selProc!==k) {
                                e.currentTarget.style.borderColor = '#1a3550';
                                e.currentTarget.style.background = '#0a1929';
                              }
                            }}
                          >
                            <div style={{ fontSize:32, marginBottom:10 }}>{p.ico}</div>
                            <div style={{ fontSize:14, fontWeight:700, color:'#e4eef8', lineHeight:1.3, marginBottom:6 }}>{p.name}</div>
                            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:'#4a7a9b', letterSpacing:'.05em' }}>{p.sub.split(' ').slice(0,3).join(' ').toUpperCase()}</div>
                            {isHigh && <div style={{ position:'absolute', top:12, right:12, fontSize:8, fontFamily:"'JetBrains Mono',monospace", padding:'3px 8px', borderRadius:5, background:'rgba(255,71,87,.2)', color:'#ff8c96', border:'1px solid rgba(255,71,87,.4)', fontWeight:700, letterSpacing:'.08em' }}>HIGH RISK</div>}
                            {isMod && <div style={{ position:'absolute', top:12, right:12, fontSize:8, fontFamily:"'JetBrains Mono',monospace", padding:'3px 8px', borderRadius:5, background:'rgba(245,166,35,.2)', color:'#f5b755', border:'1px solid rgba(245,166,35,.4)', fontWeight:700, letterSpacing:'.08em' }}>MOD RISK</div>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* DOCUMENT TAB */}
            {tab === 'document' && (
              <div style={{ flex:1, overflowY:'auto', padding:'24px', display:'flex', flexDirection:'column', gap:20 }}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                  <div>
                    <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:600, color:'#e4eef8' }}>{proc ? `${proc.ico} ${proc.name}` : 'Procedure Documentation'}</div>
                    <div style={{ fontSize:12, color:'#4a7a9b', marginTop:4 }}>{proc?.sub || 'Select a procedure first'}</div>
                  </div>
                  <div style={{ flex:1 }} />
                  <button className="epn-btn" onClick={()=>setTab('select')}>← Change</button>
                </div>

                {!proc ? (
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, padding:48, textAlign:'center', color:'#4a7a9b', border:'1px dashed #1a3550', borderRadius:10 }}>
                    <div style={{ fontSize:40, opacity:.3 }}>📝</div>
                    <div style={{ fontSize:14, fontWeight:500, color:'#8aacc6' }}>No procedure selected</div>
                    <div style={{ fontSize:12 }}>Go back and select a procedure first.</div>
                    <button className="epn-btn p" onClick={()=>setTab('select')}>← Select Procedure</button>
                  </div>
                ) : (
                  <>
                    {/* Patient context row */}
                    <div style={{ background:'#0a1929', border:'1px solid #1a3550', borderRadius:10, overflow:'hidden' }}>
                      <div style={{ padding:'10px 18px', background:'#0d2035', borderBottom:'1px solid #1a3550', fontSize:11, fontWeight:600, color:'#e4eef8', letterSpacing:'.06em', textTransform:'uppercase' }}>👤 Physician & Encounter</div>
                      <div style={{ padding:'14px 18px', display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
                        {[['Physician / Attending', 'physicianName', 'e.g., Dr. Jane Smith, MD'],['Encounter Date','encounterDate',''],['Additional Allergies','allergies','e.g., Penicillin — rash']].map(([lbl,key,ph]) => (
                          <div key={key} style={{ display:'flex', flexDirection:'column', gap:6 }}>
                            <div style={{ fontSize:11, fontWeight:600, color:'#4a7a9b', textTransform:'uppercase', letterSpacing:'.06em' }}>{lbl}</div>
                            <input style={{ background:'#0d2035', border:'1px solid #1e4060', borderRadius:7, color:'#e4eef8', fontFamily:"'Outfit',sans-serif", fontSize:13, padding:'9px 12px', outline:'none' }} value={ptCtx[key]||''} onChange={e=>setPtCtx(p=>({...p,[key]:e.target.value}))} placeholder={ph} />
                          </div>
                        ))}
                      </div>
                    </div>
                    <ProcedureForm proc={proc} formData={formData} setFormData={(fn) => { setFormData(fn); debounceAI(); }} />
                    <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                      <button className="epn-btn p" onClick={generateNote} disabled={generating} style={{ padding:'10px 24px', fontSize:14, fontWeight:600, display:'flex', alignItems:'center', gap:8 }}>
                        {generating ? '⏳ Generating…' : '✦ Generate Procedure Note'}
                      </button>
                      {generating && <span style={{ fontSize:12, color:'#4a7a9b' }}>AI is crafting your note…</span>}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* NOTE TAB */}
            {tab === 'note' && (
              <div style={{ flex:1, overflowY:'auto', padding:'24px', display:'flex', flexDirection:'column', gap:20 }}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                  <div>
                    <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:600, color:'#e4eef8' }}>Generated Note</div>
                    <div style={{ fontSize:12, color:'#4a7a9b', marginTop:4 }}>Review, edit, and copy to EHR</div>
                  </div>
                  <div style={{ flex:1 }} />
                  <div style={{ display:'flex', gap:8 }}>
                    <button className="epn-btn" onClick={generateNote} disabled={generating}>↺ Regenerate</button>
                    <button className="epn-btn s" onClick={copyNote} disabled={!generatedNote || generating}>Copy to Clipboard</button>
                    <button className="epn-btn s" onClick={() => saveProcedureNote(false)} disabled={!generatedNote || saving} style={{ display:'flex', alignItems:'center', gap:6 }}>
                      {saving ? '⏳ Saving…' : '💾 Save'}
                    </button>
                  </div>
                </div>

                {!generatedNote || generatedNote === 'Generating procedure note…' ? (
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, padding:48, textAlign:'center', color:'#4a7a9b', border:'1px dashed #1a3550', borderRadius:10, flex:1 }}>
                    {generating ? (
                      <>
                        <div className="epn-dots"><span /><span /><span /></div>
                        <div style={{ fontSize:13, color:'#8aacc6' }}>AI is generating your procedure note…</div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize:40, opacity:.3 }}>📄</div>
                        <div style={{ fontSize:14, fontWeight:500, color:'#8aacc6' }}>No note yet</div>
                        <div style={{ fontSize:12 }}>Complete the form and click Generate Note.</div>
                        <button className="epn-btn p" onClick={()=>setTab('document')}>← Fill Form</button>
                      </>
                    )}
                  </div>
                ) : (
                  <>
                    <div style={{ background:'#0a1929', border:'1px solid #1a3550', borderRadius:10, overflow:'hidden' }}>
                      <div style={{ padding:'9px 16px', background:'#0d2035', borderBottom:'1px solid #1a3550', display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:'#4a7a9b' }}>{proc?.ico} {proc?.name} — {ptCtx.patientName||'Patient'} — {ptCtx.encounterDate}</span>
                        <div style={{ flex:1 }} />
                        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:'#4a7a9b' }}>~{generatedNote.split(' ').length} words</span>
                      </div>
                      <div contentEditable suppressContentEditableWarning style={{ padding:'28px 32px', fontFamily:"'Lora',Georgia,serif", fontSize:14, lineHeight:1.85, color:'#e4eef8', whiteSpace:'pre-wrap', minHeight:300, outline:'none', background:'#0a1929' }}>
                        {generatedNote}
                      </div>
                    </div>
                    <div style={{ background:'rgba(0,198,255,.05)', border:'1px solid rgba(0,198,255,.2)', borderRadius:8, padding:'10px 14px', fontSize:12, color:'#8aacc6', display:'flex', alignItems:'flex-start', gap:8 }}>
                      <span>✏️</span><span>Fully editable. Auto-saves every 30 seconds. Verify all details against clinical findings before signing.</span>
                    </div>
                  </>
                )}
              </div>
            )}
          </main>

          {/* AI Panel */}
          <aside style={{ width:295, flexShrink:0, background:'#0a1929', borderLeft:'1px solid #1a3550', display:'flex', flexDirection:'column', overflow:'hidden' }}>
            <div style={{ padding:'12px 14px', borderBottom:'1px solid #1a3550', display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
              <div style={{ width:7, height:7, borderRadius:'50%', background:'#00e5a0', boxShadow:'0 0 8px #00e5a0', animation:'none' }} />
              <span style={{ fontSize:12, fontWeight:600, color:'#e4eef8', letterSpacing:'.04em', flex:1 }}>AI DOCUMENTATION ASSISTANT</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:'#4a7a9b' }}>claude</span>
            </div>
            <div style={{ flex:1, overflowY:'auto', padding:'14px', display:'flex', flexDirection:'column', gap:10 }}>
              {!selProc ? (
                <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10, color:'#4a7a9b', textAlign:'center', padding:20 }}>
                  <div style={{ fontSize:36, opacity:.3 }}>🏥</div>
                  <div style={{ fontSize:12, lineHeight:1.7 }}>Select a procedure to activate AI guidance.<br/><br/>I'll flag missing elements, check allergy conflicts, and help produce a billing-ready note.</div>
                </div>
              ) : (
                <>
                  {/* Completeness bar */}
                  <div style={{ background:'#102840', borderRadius:8, padding:'10px 12px', border:'1px solid #1e4060' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                      <span style={{ fontSize:10, fontWeight:700, color:'#4a7a9b', textTransform:'uppercase', letterSpacing:'.07em' }}>Note Completeness</span>
                      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:13, fontWeight:700, color:pctColor }}>{aiPct}%</span>
                    </div>
                    <div style={{ height:4, background:'#050f1e', borderRadius:3, overflow:'hidden' }}>
                      <div style={{ height:'100%', background:`linear-gradient(90deg,#0096d6,#00e5a0)`, borderRadius:3, width:`${aiPct}%`, transition:'width .5s ease' }} />
                    </div>
                  </div>

                  {aiReviewing && (
                    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:'#0d2035', border:'1px solid #1a3550', borderRadius:10, fontSize:12, color:'#4a7a9b' }}>
                      <div className="epn-dots"><span /><span /><span /></div>
                      <span>Reviewing form…</span>
                    </div>
                  )}

                  {aiMsg && (
                    <div className="aim" style={{ background:'#0d2035', border:'1px solid #1a3550', borderRadius:10, padding:'12px', fontSize:12, color:'#8aacc6', lineHeight:1.7 }}>
                      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700, color:'#4a7a9b', letterSpacing:'.1em', marginBottom:6 }}>AI REVIEW</div>
                      <div dangerouslySetInnerHTML={{ __html: aiMsg }} />
                    </div>
                  )}

                  {proc && (
                    <div style={{ background:'rgba(245,166,35,.06)', border:'1px solid rgba(245,166,35,.22)', borderRadius:10, padding:12 }}>
                      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700, color:'#f5a623', letterSpacing:'.1em', marginBottom:6 }}>⚠ KEY REMINDERS</div>
                      <div style={{ fontSize:11, color:'#8aacc6', lineHeight:1.7 }}>{proc.tips}</div>
                    </div>
                  )}
                </>
              )}
            </div>
          </aside>
        </div>

        {/* Bottom nav */}
        <div style={{ flexShrink:0, background:'#0a1929', borderTop:'1px solid #1a3550', height:76, display:'flex', flexDirection:'column', zIndex:200 }}>
          <div style={{ display:'flex', alignItems:'center', padding:'0 16px', borderBottom:'1px solid #1a3550', height:38, gap:2 }}>
            {[['select','📁 Select'],['document','📝 Document'],['note','📄 Note']].map(([t,lbl]) => (
              <button key={t} className={`epn-bt${tab===t?' active':''}`} onClick={()=>setTab(t)}>
                {lbl}
                {t==='note' && generatedNote && !generating && <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, padding:'1px 5px', borderRadius:8, background:'rgba(0,229,160,.15)', color:'#00e5a0', marginLeft:4 }}>✓</span>}
              </button>
            ))}
            <div style={{ flex:1 }} />
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:'#4a7a9b' }}>Step {TABS.indexOf(tab)+1} of 3</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', padding:'0 16px', height:38, gap:8 }}>
            <button className="epn-btn" onClick={()=>{const i=TABS.indexOf(tab);if(i>0)setTab(TABS[i-1]);}} disabled={tab==='select'}>← Back</button>
            <div style={{ flex:1 }} />
            {tab==='document' && selProc && (
              <button className="epn-btn p" onClick={generateNote} disabled={generating}>✦ Generate Note</button>
            )}
            <button className="epn-btn p" onClick={()=>{const i=TABS.indexOf(tab);if(i<2)setTab(TABS[i+1]);}} disabled={tab==='note'}>Next →</button>
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div style={{ position:'fixed', bottom:90, right:20, background:'#00b880', color:'#fff', padding:'8px 16px', borderRadius:6, fontSize:12, fontWeight:600, zIndex:300 }}>{toast}</div>
        )}
      </div>
    </>
  );
}