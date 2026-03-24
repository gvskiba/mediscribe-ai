import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

/* ══════════════════════════════════════
   DESIGN TOKENS
══════════════════════════════════════ */
const T = {
  bg:'#050f1e',panel:'#081628',card:'#0b1e36',up:'#0e2544',
  border:'#1a3555',borderHi:'#2a4f7a',
  blue:'#3b9eff',cyan:'#00d4ff',teal:'#00e5c0',gold:'#f5c842',
  purple:'#9b6dff',coral:'#ff6b6b',green:'#3dffa0',orange:'#ff9f43',
  txt:'#e8f0fe',txt2:'#8aaccc',txt3:'#4a6a8a',txt4:'#2e4a6a',
};

/* ══════════════════════════════════════
   PROCEDURE DATA
══════════════════════════════════════ */
const LIDO=['Lidocaine 1% plain','Lidocaine 1% w/ epi','Lidocaine 2% plain','Lidocaine 2% w/ epi','Bupivacaine 0.25%','Bupivacaine 0.5%'];
const NVpre=['Sensation intact','Motor intact','Cap refill <2s','Pulses present'];
const NVpost=['Sensation intact','Motor function intact','Pulses intact','Cap refill <2 sec'];

const fi=(id,lbl,req,ph)=>({id,label:lbl,type:'input',required:!!req,placeholder:ph||''});
const fs=(id,lbl,opts,req)=>({id,label:lbl,type:'select',options:opts,required:!!req});
const fc=(id,lbl,opts,defs)=>({id,label:lbl,type:'chips',options:opts,defaults:defs||[]});
const fa=(id,lbl,ph)=>({id,label:lbl,type:'textarea',placeholder:ph||''});
const sec=(icon,title,fields,warning)=>({icon,title,fields,warning:warning||null});

const P={
lac:{key:'lac',name:'Laceration Repair',icon:'🩹',subtitle:'Wound closure',risk:'low',category:'wound',tips:'Epi contraindications digits/ears/nose; billing: simple <2.5cm vs complex',sections:[
  sec('📍','Wound Details',[fi('location','Location',1,'Right forehead'),fi('length','Length',1,'3.5 cm'),fs('depth','Depth',['Superficial','Deep dermis','Subcutaneous','Fascia','Muscle']),fs('wtype','Wound Type',['Linear','Stellate','Avulsion','Degloving','Puncture']),fs('contam','Contamination',['Clean','Mild','Heavy','Bite','Soil/debris']),fc('wchar','Characteristics',['Well-approximated','Jagged/irregular','Active bleeding','Minimal bleeding','FB noted','Tendon visible','Bone visible'])]),
  sec('💉','Anesthesia & Prep',[fs('anes','Anesthetic',[...LIDO,'LET gel','Diphenhydramine'],1),fi('anes_amt','Amount (mL)',0,'5 mL'),fs('anes_tech','Technique',['Local infiltration','Field block','Digital block','Regional','Topical']),fc('prep','Preparation',['NS irrigation','Betadine','Chlorhexidine','FB removed','Explored','Hair removal'],['NS irrigation'])]),
  sec('🧵','Closure',[fs('closure','Method',['Simple interrupted','Running','Horizontal mattress','Vertical mattress','Deep + interrupted','Staples','Dermabond','Steri-strips'],1),fs('sut_mat','Material',['N/A','3-0 Nylon','4-0 Nylon','5-0 Nylon','6-0 Nylon','3-0 Vicryl','3-0 Chromic']),fi('sut_n','# Sutures',0,'6'),fs('dressing','Dressing',['Dry sterile','Bacitracin + gauze','Petrolatum','Tegaderm','None (face)'])]),
  sec('✅','Aftercare',[fs('tet','Tetanus',['Up to date','Tdap given','TIG given','Tdap + TIG','Declined'],1),fs('abx','Antibiotics',['None','Cephalexin 500mg QID x 5d','Amox-clav 875mg BID x 5d','Clindamycin 300mg QID x 5d']),fs('fu','Follow-Up',['Face: 5d','Scalp: 7-10d','Trunk: 7-10d','Extremities: 10-14d','Joint: 14d']),fc('nvpost','Post NV',NVpost,NVpost),fa('addl','Notes','Tolerated well…')])]},

iand:{key:'iand',name:'I&D / Abscess',icon:'💉',subtitle:'Incision & drainage',risk:'low',category:'wound',tips:'MRSA coverage; packing type; admission criteria',sections:[
  sec('📍','Abscess',[fi('location','Location',1,'Left buttock'),fi('size','Size',1,'4x3x2 cm'),fs('skin','Overlying',['Erythematous fluctuant','Indurated','Pointing','Cellulitis'])]),
  sec('💉','Procedure',[fs('anes','Anesthetic',['Lido 1%','Lido 1% w/epi','Lido 2%','Proc sedation','None'],1),fs('incision','Incision',['Linear #11','Linear #15','Cruciate','Loop']),fc('drain','Drainage',['Purulent','Serosanguineous','Malodorous','Loculations broken','Irrigated']),fs('packing','Packing',['Iodoform 1/4"','Iodoform 1/2"','Plain gauze','Not packed','Loop']),fs('cx','Cultures',['Wound culture','Not sent','Blood cultures','MRSA swab'])]),
  sec('✅','Disposition',[fs('abx','Antibiotics',['None','TMP-SMX DS BID x 7d','Doxy 100mg BID x 7d','Clinda 300mg TID x 7d','Cephalexin 500mg QID x 7d'],1),fs('fu','Follow-Up',['48h wound check','48-72h repack','PCP 3-5d','Wound clinic','Admit']),fa('addl','Notes')])]},

fb:{key:'fb',name:'Foreign Body Removal',icon:'🔍',subtitle:'Soft tissue FB',risk:'low',category:'wound',tips:'Wood/glass radiolucent — use US; post-removal imaging',sections:[sec('🔍','FB Details',[fi('location','Location',1,'R index finger'),fs('fbtype','Type',['Wood','Glass','Metal','Fishhook','Thorn','Gravel','Needle'],1),fs('imaging','Imaging',['XR — seen','XR — negative','US — identified','None — visible']),fs('anes','Anesthetic',LIDO.slice(0,2).concat(['Digital block','Regional']),1),fs('result','Removed?',['Yes intact','Fragmented','Partial — referral','Unable']),fa('addl','Notes')])]},

wc:{key:'wc',name:'Wound Irrigation',icon:'🧴',subtitle:'Wound care & irrigation',risk:'low',category:'wound',tips:'High-pressure irrigation; delayed closure for contaminated',sections:[sec('🧴','Wound',[fi('location','Location',1,'R lower extremity'),fi('size','Size',0,'6x4 cm'),fs('wtype','Type',['Abrasion','Avulsion','Crush','Infected','Burn','Ulcer','Dehiscence'],1),fs('contam','Contamination',['Minimal','Moderate','Heavy','Fecal']),fc('irrig','Irrigation',['High-pressure NS','Wound scrub','Debridement','FB removed'],['High-pressure NS']),fa('addl','Notes')])]},

nail:{key:'nail',name:'Nail Trephination',icon:'🔨',subtitle:'Subungual hematoma',risk:'low',category:'wound',tips:'No block needed if >50%; check XR for tuft fracture',sections:[sec('🔨','Procedure',[fi('digit','Digit',1,'R thumb'),fs('method','Method',['Electrocautery','18G needle','Heated paper clip'],1),fs('hema','Hematoma Size',['<25%','25-50%','>50%']),fs('xr','X-ray',['No fracture','Tuft fx — splint','Not obtained']),fa('addl','Notes')])]},

intub:{key:'intub',name:'Intubation / RSI',icon:'🌬️',subtitle:'Rapid sequence intubation',risk:'high',category:'airway',tips:'Succ contraindications; capnography mandatory; backup airway; 6mL/kg IBW',sections:[
  sec('🌬️','Indication',[fc('ind','Indication',['Hypoxic resp failure','Hypercapnic','Airway protect — AMS','GCS ≤8','Impending failure','Obstruction']),fs('preox','Pre-O₂',['15L NRB x 3min','BVM + PEEP','HFNC 60L','BiPAP','Crash']),fi('prespo2','SpO₂ Prior',0,'94%')],'⚠️ High-risk. Document all attempts and backup plans.'),
  sec('💊','RSI Meds',[fs('ind_agent','Induction',['Ketamine 1.5-2 mg/kg','Propofol 1.5-2 mg/kg','Etomidate 0.3 mg/kg'],1),fi('ind_dose','Dose',0,'Ketamine 200mg'),fs('par','Paralytic',['Succ 1.5 mg/kg','Roc 1.2 mg/kg','Vec 0.1 mg/kg'],1),fi('par_dose','Dose',0,'Succ 150mg')]),
  sec('🔭','Laryngoscopy',[fs('dev','Device',['DL Mac 3','DL Mac 4','DL Miller 2','VL GlideScope','VL C-MAC','FOB','LMA'],1),fs('att','Attempts',['1st success','2 success','3 success','Failed'],1),fs('ett','ETT',['6.0','6.5','7.0','7.5','8.0'],1),fi('ettd','Depth',0,'23 cm'),fc('conf','Confirmation',['Waveform capnography ✓','Bilateral breath sounds ✓','Bilateral chest rise ✓','SpO₂ maintained','CXR ordered'],['Waveform capnography ✓','Bilateral breath sounds ✓','Bilateral chest rise ✓','SpO₂ maintained','CXR ordered'])]),
  sec('⚙️','Post-Intubation',[fs('vm','Vent',['AC/VC','AC/PC','SIMV']),fi('tv','TV',0,'500 mL'),fi('vset','Rate/PEEP/FiO₂',0,'RR14 PEEP5 100%'),fc('comp','Complications',['No complications','Transient hypoxia','Esophageal (corrected)','R mainstem (fixed)'],['No complications']),fa('addl','Notes')])]},

cryo:{key:'cryo',name:'Cricothyrotomy',icon:'🔪',subtitle:'Surgical airway',risk:'high',category:'airway',tips:'Last resort; 6.0-6.5 ETT; CXR + bronchoscopy post',sections:[sec('🔪','Procedure',[fs('ind','Indication',['Cannot intubate','Failed intubation ≥2','Facial trauma','Severe angioedema'],1),fs('method','Technique',['Landmark palpation','US guided','Scalpel classic','Needle/cannula'],1),fi('prespo2','SpO₂ Prior',0,'78%'),fs('tube','Tube',['6.0 ETT','6.5 ETT','Trach tube']),fc('post','Post',['CXR ordered','Bronch scheduled','ICU notified','Trach planned 24h']),fa('addl','Notes')],'⚠️ Emergency surgical airway.')]},

sed:{key:'sed',name:'Procedural Sedation',icon:'💤',subtitle:'Conscious sedation',risk:'mod',category:'airway',tips:'Ketamine preferred in ED; capnography for deep; discharge criteria',sections:[
  sec('💤','Pre-Sedation',[fi('ind','Indication',1,'Shoulder reduction'),fs('asa','ASA',['I — healthy','II — mild systemic','III — severe','IV']),fs('npo','NPO',['Emergency — N/A','NPO >8h','NPO >6h','Not NPO — risk discussed'])]),
  sec('💊','Medications',[fs('agent','Agent',['Ketamine 1-1.5 IV','Ketamine 4 IM','Propofol 1 IV','Midaz + Fent','Etomidate 0.1-0.15'],1),fi('dose','Dose',0,'Ketamine 100mg'),fs('slvl','Level',['Minimal','Moderate','Deep','Dissociative']),fi('dur','Duration',0,'15 min')]),
  sec('✅','Recovery',[fc('rec','Recovery',['Returned to baseline','SpO₂ on RA','No adverse events'],['Returned to baseline','SpO₂ on RA','No adverse events']),fa('addl','Outcome')])]},

cl:{key:'cl',name:'Central Line',icon:'🩺',subtitle:'CVC insertion',risk:'high',category:'vascular',tips:'US guidance standard; CXR required; full barrier',sections:[
  sec('🩺','Indication',[fc('ind','Indication',['No PIV','Hemodynamic monitoring','Vasopressors','Rapid volume','TV pacing','Caustic meds']),fs('site','Site',['R IJ','L IJ','R subclavian','L subclavian','R femoral','L femoral'],1),fs('cath','Catheter',['Triple lumen','Double lumen','Single lumen','Cordis','Shiley'])]),
  sec('🔊','Technique',[fs('us','US Guidance',['Real-time','US localization','Landmark'],1),fs('att','Attempts',['1 success','2 success','3 success','Failed'],1),fi('depth','Depth cm',0,'15'),fc('lum','Lumens',['All ports flush','Sutured','Sterile dressing'],['All ports flush','Sutured','Sterile dressing'])],'⚠️ Document US, attempts, CXR.'),
  sec('✅','Confirmation',[fc('conf','Position',['CXR SVC/RA junction','No PTX on CXR','Venous blood confirmed'],['CXR SVC/RA junction','No PTX on CXR','Venous blood confirmed']),fc('comp','Complications',['No complications','Arterial puncture','PTX','Hematoma'],['No complications']),fa('addl','Notes')])]},

piv:{key:'piv',name:'Peripheral IV',icon:'💉',subtitle:'PIV insertion',risk:'low',category:'vascular',tips:'Two large-bore for resuscitation',sections:[sec('💉','IV',[fs('ind','Indication',['IV access','Resuscitation','Blood draw'],1),fs('gauge','Gauge',['18G','20G','22G'],1),fs('site','Site',['Antecubital','Forearm','Hand','Lower ext'],1),fc('conf','Confirmation',['Blood return','Fluid flows','No swelling','Secured'],['Blood return','Fluid flows','No swelling','Secured'])])]},

io:{key:'io',name:'Intraosseous Access',icon:'🦴',subtitle:'IO vascular access',risk:'high',category:'vascular',tips:'Last resort; marrow aspirate first; compartment syndrome risk',sections:[sec('💉','IO',[fs('ind','Indication',['Cardiac arrest — no IV','Severe shock','Pediatric','Burns'],1),fs('site','Site',['Proximal humerus','Proximal tibia','Distal tibia','Distal femur'],1),fi('att','Attempts',0,'1 success'),fc('conf','Confirmation',['Needle firm','Marrow aspirate','Free flow','No extravasation'],['Needle firm','Marrow aspirate','Free flow','No extravasation']),fa('addl','Notes')],'⚠️ High-risk — document failed PIV.')]},

art:{key:'art',name:'Arterial Line',icon:'🩸',subtitle:'A-line hemodynamics',risk:'mod',category:'vascular',tips:'Allen test before radial; waveform mandatory',sections:[sec('🩸','A-Line',[fs('ind','Indication',['Continuous BP','Frequent ABGs','Vasopressors','Hemodynamic instability'],1),fs('site','Site',['Radial','Femoral','Axillary'],1),fs('allen','Allen Test',['Positive','Negative','Not done']),fi('size','Catheter',0,'20G'),fc('tech','Technique',['US guidance','Landmark','Waveform confirmed'])])]},

ct:{key:'ct',name:'Chest Tube',icon:'🫁',subtitle:'Tube thoracostomy',risk:'high',category:'thoracic',tips:'Safe triangle 4th/5th ICS AAL; CXR mandatory',sections:[sec('🫁','Details',[fs('ind','Indication',['PTX simple','PTX tension','Hemothorax','Hemopneumothorax','Empyema','Effusion'],1),fs('side','Side',['Right','Left'],1),fs('fr','Size',['28 Fr','32 Fr','36 Fr','40 Fr','14 pigtail']),fs('site','Site',['4th/5th ICS AAL','2nd ICS MCL','Posterior']),fi('drain','Output',0,'400 mL'),fs('suct','Suction',['-20 cmH₂O','Water seal','Heimlich']),fc('conf','Confirmation',['CXR confirmed','Lung expanded','Sutured','Occlusive dressing'],['CXR confirmed','Lung expanded','Sutured','Occlusive dressing']),fa('addl','Notes')],'⚠️ High complication risk.')]},

thorac:{key:'thorac',name:'Thoracentesis',icon:'💧',subtitle:'Pleural fluid aspiration',risk:'mod',category:'thoracic',tips:'US guided; re-expansion edema if >1.5L; send fluid studies',sections:[sec('💧','Thoracentesis',[fs('ind','Indication',['Diagnostic','Therapeutic','Both'],1),fs('side','Side',['Right','Left'],1),fs('us','US Guidance',['Real-time','US marked','Landmark'],1),fi('vol','Volume Removed',0,'1200 mL'),fs('app','Appearance',['Clear yellow','Turbid','Bloody','Milky'],1),fc('labs','Studies',['Cell count','Protein/LDH/glucose','Culture/gram','pH','Cytology','Triglycerides'],['Cell count','Protein/LDH/glucose','Culture/gram']),fa('addl','Notes')])]},

pericardio:{key:'pericardio',name:'Pericardiocentesis',icon:'❤️',subtitle:'Pericardial drainage',risk:'high',category:'thoracic',tips:'US mandatory; subxiphoid; monitor for PEA/VT; surgery standby',sections:[sec('❤️','Pericardiocentesis',[fs('ind','Indication',['Tamponade','Large effusion','Diagnostic'],1),fs('approach','Approach',['Subxiphoid US','Apical US','CT guided']),fi('vol','Volume',0,'250 mL'),fs('app','Appearance',['Serous','Bloody','Purulent']),fs('drain','Drain',['Pigtail catheter','No drain','Surgical window planned']),fa('addl','Notes')],'⚠️ High-risk — surgery standby.')]},

sp_proc:{key:'sp_proc',name:'Splint Application',icon:'🦴',subtitle:'Orthopedic immobilization',risk:'low',category:'ortho',tips:'Pre AND post NV exams required',sections:[
  sec('🦴','Injury',[fi('dx','Diagnosis',1,'Distal radius fx'),fs('ext','Extremity',['R upper','L upper','R lower','L lower'],1),fc('nvpre','Pre NV',NVpre,NVpre)]),
  sec('🩹','Splint',[fs('spltype','Type',['Post long arm','Short arm volar','Ulnar gutter','Radial gutter','Thumb spica','Sugar-tong','Post ankle','Stirrup','Knee immobilizer'],1),fi('pos','Position',1,'Wrist 20° ext')]),
  sec('✅','Post',[fc('nvpost2','Post NV',['Sensation intact','Motor intact','Cap refill <2s','Pulses intact','No increased pain'],['Sensation intact','Motor intact','Cap refill <2s','Pulses intact']),fa('addl','Notes')])]},

red:{key:'red',name:'Fracture/Dislocation Reduction',icon:'🔧',subtitle:'Orthopedic reduction',risk:'mod',category:'ortho',tips:'Pre AND post NV mandatory; pre/post XR; ortho for failed',sections:[sec('🔧','Reduction',[fi('dx','Diagnosis',1,'R anterior shoulder dislocation'),fi('mech','Mechanism',0,'FOOSH'),fc('nvpre','Pre NV',['Sensation intact','Motor intact','Pulses present','Axillary nerve checked'],['Sensation intact','Motor intact','Pulses present']),fs('prexr','Pre-XR',['Dislocation confirmed','Dislocation + fx','Angulated fx','XR deferred'],1),fs('analg','Analgesia',['IA lidocaine','IV morphine + midaz','IV fentanyl + midaz','Ketamine sedation','Propofol','No sedation'],1),fs('tech','Technique',['Cunningham','FARES','Stimson','External rotation','Traction-countertraction','Milch','Allis','Longitudinal traction'],1),fs('att','Attempts',['1 success','2 success','3 failed — ortho']),fc('post','Post-Reduction',['Post-XR reduced','Sensation post','Motor post','Pulses post','Splint/sling applied']),fa('addl','Notes')])]},

cv:{key:'cv',name:'Cardioversion',icon:'⚡',subtitle:'Synchronized cardioversion',risk:'high',category:'cardiac',tips:'SYNC mode; anticoag if AFib >48h; energy: AFib 120-200J, flutter 50-100J',sections:[sec('⚡','Cardioversion',[fs('ind','Rhythm',['AFib unstable','AFib elective','A-flutter','SVT refractory','VT with pulse','VT unstable'],1),fs('dur','Duration',['<48h','≥48h — anticoag','Emergent']),fi('previt','Pre Vitals',0,'BP 82/54 HR 148'),fs('sed','Sedation',['Midaz + Fent','Etomidate','Propofol','Ketamine','None — life threat']),fi('j1','Shock 1 (J)',1,'120J biphasic'),fs('r1','Result',['Sinus restored','No change','Partial']),fi('j2','Shock 2',0,'200J'),fs('postrhythm','Post Rhythm',['NSR','Sinus brady','Junctional','Persistent AFib','VF — defib'],1),fi('postvit','Post Vitals',0,'BP 118/72 HR 78'),fa('addl','Notes')],'⚠️ Confirm SYNC mode before every shock.')]},

lp:{key:'lp',name:'Lumbar Puncture',icon:'🔬',subtitle:'Spinal tap',risk:'mod',category:'procedure',tips:'CT before LP; CSF interpretation; 4 tubes; HSV PCR',sections:[
  sec('🔬','Indication',[fc('ind','Indication',['R/O SAH','R/O meningitis','CNS infection','Therapeutic','Demyelinating']),fs('ct','Pre-LP CT',['CT safe','CT normal','Not required','Contraindicated'],1)]),
  sec('🩺','Procedure',[fs('pos','Position',['Lateral decubitus','Seated']),fs('lvl','Level',['L3-L4','L4-L5','L2-L3'],1),fs('att','Attempts',['1 success','2 success','3 success','Failed'],1),fi('op','Opening Pressure',1,'18 cmH₂O'),fs('csf','CSF',['Clear','Xanthochromic','Bloody clearing','Uniformly bloody','Turbid'],1)]),
  sec('🧪','CSF Studies',[fc('tubes','Tubes',['Tube 1 Cell count','Tube 2 Protein/glucose','Tube 3 Culture/gram','Tube 4 Repeat cell','HSV PCR','Crypto','VDRL'],['Tube 1 Cell count','Tube 2 Protein/glucose','Tube 3 Culture/gram','Tube 4 Repeat cell']),fa('addl','Notes')])]},

fast:{key:'fast',name:'FAST Exam',icon:'🔊',subtitle:'Trauma sonography',risk:'low',category:'procedure',tips:'All views documented; action for positive; sensitivity ~80%',sections:[sec('🔊','FAST',[fs('ind','Indication',['Blunt trauma','Penetrating','Hypotension','Rib fx','eFAST'],1),fi('ctx','Context',0,'MVC restrained'),fs('ruq','RUQ',['Neg','Pos','Indet'],1),fs('luq','LUQ',['Neg','Pos','Indet'],1),fs('pelv','Pelvic',['Neg','Pos','Indet'],1),fs('card','Cardiac',['Neg','Pos effusion','Indet'],1),fs('result','Overall',['NEGATIVE','POSITIVE','INDETERMINATE'],1),fa('addl','Notes')])]},

par:{key:'par',name:'Paracentesis',icon:'💧',subtitle:'Abdominal paracentesis',risk:'mod',category:'procedure',tips:'SBP if PMN >250; albumin if >5L; US reduces complications',sections:[sec('💧','Paracentesis',[fs('ind','Indication',['Diagnostic — R/O SBP','Therapeutic','Both'],1),fs('site','Site',['LLQ US-guided','RLQ','Midline infraumbilical']),fs('us','US Used',['Real-time','US pocket ID','Landmark'],1),fi('vol','Volume',0,'4.5 L'),fs('app','Appearance',['Clear yellow','Turbid','Bloody','Milky'],1),fc('labs','Studies',['Cell count + diff','Protein/albumin/LDH','Gram stain + culture','Glucose/amylase','Cytology'],['Cell count + diff','Protein/albumin/LDH','Gram stain + culture']),fa('addl','Notes')])]},

arth:{key:'arth',name:'Arthrocentesis',icon:'🦵',subtitle:'Joint aspiration',risk:'mod',category:'procedure',tips:'WBC >50k = septic; crystal analysis important',sections:[sec('🦵','Arthrocentesis',[fs('joint','Joint',['R knee','L knee','R ankle','L ankle','R wrist','L wrist','R elbow','L elbow','R shoulder','L shoulder'],1),fs('ind','Indication',['R/O septic','Gout/pseudogout','Diagnostic','Therapeutic','Hemarthrosis'],1),fi('vol','Volume',0,'35 mL'),fs('app','Appearance',['Clear/straw','Yellow turbid','Purulent','Bloody','Chalky white'],1),fc('labs','Studies',['Cell count + diff','Crystal analysis','Gram stain + culture','Glucose/protein'],['Cell count + diff','Crystal analysis','Gram stain + culture']),fs('ster','Steroid',['None — septic not excluded','Methylpred 40mg','Triamcinolone 40mg','Betamethasone 6mg']),fa('addl','Notes')])]},

foley:{key:'foley',name:'Foley Catheter',icon:'🚽',subtitle:'Urinary catheter',risk:'low',category:'procedure',tips:'Aseptic; check hematuria; daily removal assessment',sections:[sec('🚽','Placement',[fs('ind','Indication',['Retention','Sepsis I/Os','Hemodynamic','Burns'],1),fs('size','Size',['16 Fr','18 Fr','20 Fr','22 Fr'],1),fc('tech','Technique',['Sterile field','Betadine/CHG','No resistance','Urine return'],['Sterile field','Betadine/CHG','No resistance','Urine return']),fi('urine','Output',0,'400 mL'),fs('color','Color',['Clear','Cloudy','Tea-colored','Hematuria'],1),fa('addl','Notes')])]},

ngt:{key:'ngt',name:'Nasogastric Tube',icon:'🧴',subtitle:'NGT insertion',risk:'low',category:'procedure',tips:'16-18 Fr; pH <6 confirms; CXR if doubt',sections:[sec('🧴','NGT',[fs('ind','Indication',['Gastric decompression','Aspiration risk','Medication admin','Enteral feeding'],1),fs('size','Size',['14 Fr','16 Fr','18 Fr']),fi('depth','Depth cm',0,'50'),fs('conf','Confirmation',['Gastric aspirate','pH <6','CXR confirmed','Auscultation — air'],1),fa('addl','Notes')])]},

epi:{key:'epi',name:'Epistaxis / Nasal Packing',icon:'👃',subtitle:'Anterior/posterior packing',risk:'low',category:'ent',tips:'Anterior Rhino Rocket first; posterior = Foley if fails; ENT for posterior',sections:[sec('👃','Epistaxis',[fs('side','Side',['Right','Left','Bilateral'],1),fs('type','Type',['Anterior','Posterior','Unable to determine']),fs('initial','Initial',['Direct pressure 15 min','Afrin spray','Silver nitrate cautery','Surgicel/gelfoam']),fs('packing','Packing',['Rhino Rocket','Merocel sponge','Rapid Rhino','Posterior Foley balloon','Posterior pack — ENT','None — cautery sufficient'],1),fs('fu','Follow-Up',['ENT 24-48h','ENT emergent','PCP 3-5d','Return if rebleed']),fa('addl','Notes')])]},

cantho:{key:'cantho',name:'Lateral Canthotomy',icon:'👁️',subtitle:'Orbital decompression',risk:'high',category:'ent',tips:'IOP >40 or clinical signs; time-critical — do not wait for ophth',sections:[sec('👁️','Canthotomy',[fs('side','Eye',['Right','Left'],1),fs('ind','Indication',['Retrobulbar hemorrhage','IOP >40','Proptosis + vision loss','APD'],1),fi('iop_pre','IOP Pre',0,'52 mmHg'),fs('anes','Anesthetic',['Lido 1% w/epi','None — emergent']),fi('iop_post','IOP Post',0,'18 mmHg'),fc('exam','Post Exam',['Vision assessed','IOP remeasured','Pupil reactivity','Ophthalmology called']),fa('addl','Notes')],'⚠️ Time-critical — do not delay.')]},

dental:{key:'dental',name:'Dental Nerve Block',icon:'🦷',subtitle:'IAN / infraorbital block',risk:'low',category:'ent',tips:'Aspirate before injecting; IAN for lower molars; infraorbital for upper',sections:[sec('🦷','Block',[fs('block','Block Type',['Inferior alveolar (IAN)','Long buccal','Mental/incisive','Infraorbital','Post superior alveolar','Ant superior alveolar'],1),fs('side','Side',['Right','Left','Bilateral'],1),fs('anes','Anesthetic',['Lido 2% w/epi','Lido 2% plain','Bupivacaine 0.5%'],1),fi('vol','Volume',0,'1.8 mL'),fs('indication','For',['Dental abscess','Fracture stabilization','Oral laceration','Avulsed tooth']),fa('addl','Notes')])]},

digblk:{key:'digblk',name:'Digital Nerve Block',icon:'💉',subtitle:'Finger/toe block',risk:'low',category:'nerve',tips:'Ring block at base; no epi; onset 3-5 min',sections:[sec('💉','Block',[fi('digit','Digit',1,'R ring finger'),fs('anes','Anesthetic',['Lido 1% plain','Lido 2% plain','Bupivacaine 0.25%'],1),fi('vol','Volume',0,'2 mL each side'),fs('tech','Technique',['Ring block — web space','Transthecal','Metacarpal block']),fc('conf','Confirmation',['Sensation diminished','No blanching','Adequate anesthesia']),fa('addl','Notes')])]},

femblk:{key:'femblk',name:'Femoral Nerve Block',icon:'🦵',subtitle:'US-guided femoral block',risk:'low',category:'nerve',tips:'US mandatory; identify nerve lateral to artery; aspirate before inject',sections:[sec('🦵','Block',[fs('side','Side',['Right','Left'],1),fs('ind','Indication',['Hip fracture','Femur fracture','Anterior thigh lac','Pre-reduction'],1),fs('anes','Anesthetic',['Bupivacaine 0.25% 20mL','Bupivacaine 0.5% 15mL','Ropivacaine 0.5% 20mL'],1),fc('conf','Confirmation',['Spread on US','Motor block','Sensory block confirmed']),fa('addl','Notes')])]},

fascblk:{key:'fascblk',name:'Fascia Iliaca Block',icon:'🦴',subtitle:'FICB for hip/femur',risk:'low',category:'nerve',tips:'Infrainguinal preferred; 30-40mL; reliable for hip fx',sections:[sec('🦴','FICB',[fs('side','Side',['Right','Left'],1),fs('approach','Approach',['Infrainguinal US','Suprainguinal US','Landmark 2-pop'],1),fs('anes','Anesthetic',['Bupivacaine 0.25% 30mL','Bupivacaine 0.25% 40mL','Ropivacaine 0.2% 40mL'],1),fi('vol','Volume',0,'30 mL'),fc('conf','Confirmation',['Fascial pop (landmark)','Spread deep to fascia on US','Onset 15-20 min']),fa('addl','Notes')])]},

paraph:{key:'paraph',name:'Paraphimosis Reduction',icon:'🔵',subtitle:'Manual reduction',risk:'mod',category:'gu',tips:'Ice + compression first; dorsal slit if fails; urology for recurrent',sections:[sec('🔵','Reduction',[fs('method','Method',['Ice + manual compression','Osmotic sugar wrap','Puncture technique','Dorsal slit'],1),fs('anes','Analgesia',['Dorsal penile block','Topical EMLA','Ring block','None']),fs('result','Result',['Successfully reduced','Partially — urology','Failed — dorsal slit','Failed — urology emergent'],1),fc('post','Post',['Foreskin reduced','Circulation restored','No necrosis','Urology consulted']),fa('addl','Notes')])]},

detors:{key:'detors',name:'Testicular Detorsion',icon:'🔵',subtitle:'Manual detorsion',risk:'high',category:'gu',tips:'Open book — lateral rotation; US Doppler pre/post; OR for failed; salvage drops after 6h',sections:[sec('🔵','Detorsion',[fs('side','Side',['Right','Left'],1),fi('duration','Symptom Duration',0,'4 hours'),fs('us_pre','Pre US Doppler',['Absent flow','Decreased flow','Hyperemia — epididymitis','Not obtained']),fs('tech','Technique',['Open book — medial to lateral','Opposite direction','Bilateral attempt'],1),fs('result','Result',['Pain relief + flow restored','Partial improvement','No improvement — OR','Unable to assess']),fs('us_post','Post US',['Flow restored','Equivocal','No change — OR']),fc('disp','Disposition',['Urology — OR orchiopexy','Observation + repeat US','Emergent OR']),fa('addl','Notes')],'⚠️ Time-critical — salvage drops after 6h.')]},

burn:{key:'burn',name:'Burn Assessment',icon:'🔥',subtitle:'Burn evaluation & care',risk:'mod',category:'trauma',tips:'Rule of 9s; Parkland 4mL/kg/%BSA; escharotomy for circumferential',sections:[sec('🔥','Burn',[fi('mech','Mechanism',1,'Grease splash'),fs('degree','Degree',['Superficial (1st)','Partial superficial (2nd)','Partial deep (2nd)','Full thickness (3rd)','4th degree'],1),fi('bsa','TBSA %',1,'12%'),fi('locations','Locations',0,'R forearm, R hand, anterior chest'),fc('mgmt','Management',['IV access','Parkland calculated','Wound cleaned','Silvadene applied','Non-adherent dressing','Tetanus updated','Pain managed'],['IV access','Wound cleaned']),fs('dispo','Disposition',['Outpatient','Burn center','Admit — IV fluids','Admit — OR debridement']),fa('addl','Notes')])]},

dth:{key:'dth',name:'Death Pronouncement',icon:'📋',subtitle:'Clinical death note',risk:'low',category:'trauma',tips:'Time; exam; all notifications; ME for unwitnessed/trauma',sections:[
  sec('🕐','Circumstances',[fi('time','Date & Time',1,''),fs('circ','Circumstances',['Arrest — resuscitated','Arrest — DNR','Expected — comfort','Traumatic','Natural death'],1),fc('res','Resuscitation',['Full','Terminated ACLS','DNR — not initiated','Comfort measures'])]),
  sec('🔬','Exam',[fc('exam','Findings',['Pupils fixed/dilated','No resp effort','Asystole','No pulse','No pain response','Corneal reflex absent','Rigor mortis','Lividity'],['Pupils fixed/dilated','No resp effort','Asystole','No pulse','No pain response','Corneal reflex absent'])]),
  sec('👥','Notifications',[fc('fam','Family',['Present','Notified phone','Social work','Chaplain','Unable to reach']),fc('notif','Required',['Attending notified','ME/Coroner','ME declined','OPO','Death cert']),fa('addl','Notes')])]},
};

const DEFAULT_CATEGORIES = [
  {id:'wound',name:'Wound & Soft Tissue',icon:'🩹',color:'#3b9eff',procs:['lac','iand','fb','wc','nail']},
  {id:'airway',name:'Airway',icon:'🌬️',color:'#ff6b6b',procs:['intub','cryo','sed']},
  {id:'vascular',name:'Vascular Access',icon:'💉',color:'#9b6dff',procs:['cl','piv','io','art']},
  {id:'thoracic',name:'Thoracic',icon:'🫁',color:'#ff9f43',procs:['ct','thorac','pericardio']},
  {id:'ortho',name:'Orthopedic',icon:'🦴',color:'#00e5c0',procs:['sp_proc','red']},
  {id:'cardiac',name:'Cardiac',icon:'❤️',color:'#e05555',procs:['cv']},
  {id:'procedure',name:'Procedures',icon:'🩺',color:'#00d4ff',procs:['lp','fast','par','arth','foley','ngt']},
  {id:'ent',name:'ENT & Eye',icon:'👃',color:'#f5c842',procs:['epi','cantho','dental']},
  {id:'nerve',name:'Nerve Blocks',icon:'🦵',color:'#3dffa0',procs:['digblk','femblk','fascblk']},
  {id:'gu',name:'Genitourinary',icon:'🔵',color:'#00b4d8',procs:['paraph','detors']},
  {id:'trauma',name:'Trauma & Critical',icon:'⚡',color:'#ff6b6b',procs:['burn','dth']},
];

const CAT_COLORS=['#3b9eff','#00e5c0','#ff6b6b','#ff9f43','#f5c842','#9b6dff','#00d4ff','#3dffa0','#e05555','#00b4d8'];
const CAT_ICONS=['🩹','🌬️','💉','🫁','🦴','🩺','⚡','📋','👁️','🦷','🦵','❤️','🔥','🔵','💧','👃','🔪','💤'];
const RISK_COLOR={high:T.coral,mod:T.orange,low:T.teal};
const RISK_BG={high:'rgba(255,107,107,.12)',mod:'rgba(255,159,67,.12)',low:'rgba(0,229,192,.08)'};
const RISK_BD={high:'rgba(255,107,107,.3)',mod:'rgba(255,159,67,.3)',low:'rgba(0,229,192,.2)'};
const RISK_LABEL={high:'HIGH RISK',mod:'MOD RISK',low:''};

/* ══════════════════════════════════════
   CSS
══════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap');
.edpn-wrap *,.edpn-wrap *::before,.edpn-wrap *::after{box-sizing:border-box}
.edpn-wrap{font-family:'DM Sans',sans-serif;font-size:14px;color:${T.txt};display:flex;flex-direction:column;gap:14px;padding:14px}
.edpn-wrap ::-webkit-scrollbar{width:4px}.edpn-wrap ::-webkit-scrollbar-thumb{background:${T.border};border-radius:2px}
.edpn-cmd-bar{position:relative;display:flex;align-items:center;gap:8px;background:${T.up};border:1px solid ${T.border};border-radius:8px;padding:7px 12px}
.edpn-cmd-bar:focus-within{border-color:${T.blue};box-shadow:0 0 0 2px rgba(59,158,255,.08)}
.edpn-cmd-input{flex:1;background:none;border:none;color:${T.txt};font-size:13px;font-family:'DM Sans',sans-serif;outline:none}
.edpn-cmd-input::placeholder{color:${T.txt4}}
.edpn-cmd-results{position:absolute;top:calc(100% + 4px);left:0;right:0;background:${T.panel};border:1px solid ${T.border};border-radius:8px;max-height:280px;overflow-y:auto;z-index:50;box-shadow:0 12px 40px rgba(0,0,0,.4)}
.edpn-cmd-result{display:flex;align-items:center;gap:8px;padding:7px 12px;cursor:pointer;border-bottom:1px solid rgba(26,53,85,.3);font-size:12px}
.edpn-cmd-result:last-child{border-bottom:none}.edpn-cmd-result:hover{background:${T.up}}
.edpn-cat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:12px}
.edpn-cat-tile{position:relative;border-radius:14px;cursor:pointer;border:1.5px solid ${T.border};overflow:hidden;transition:all .25s;display:flex;flex-direction:column;align-items:center;padding:18px 8px 12px;gap:6px;background:${T.card}}
.edpn-cat-tile:hover{border-color:${T.borderHi};transform:translateY(-3px);box-shadow:0 8px 28px rgba(0,0,0,.3)}
.edpn-cat-tile.edpn-active-cat{border-color:${T.blue};box-shadow:0 0 0 1px ${T.blue}}
.edpn-glow{position:absolute;top:-25px;left:50%;transform:translateX(-50%);width:80px;height:50px;border-radius:50%;filter:blur(25px);opacity:.25;pointer-events:none;transition:opacity .3s}
.edpn-cat-tile:hover .edpn-glow{opacity:.45}
.edpn-ct-logo{width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;z-index:1;font-size:24px;transition:transform .2s}
.edpn-cat-tile:hover .edpn-ct-logo{transform:scale(1.08)}
.edpn-ct-name{font-size:11px;font-weight:600;color:${T.txt};text-align:center;line-height:1.3;z-index:1}
.edpn-ct-count{font-family:'JetBrains Mono',monospace;font-size:9px;color:${T.txt3};background:${T.up};border:1px solid ${T.border};border-radius:10px;padding:1px 6px;z-index:1}
.edpn-proc-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:8px;margin-top:10px}
.edpn-proc-item{background:${T.card};border:1px solid ${T.border};border-radius:8px;padding:8px 10px;cursor:pointer;transition:all .2s;display:flex;align-items:center;gap:8px}
.edpn-proc-item:hover{border-color:${T.borderHi};background:${T.up}}
.edpn-star-btn{width:26px;height:26px;border-radius:6px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:14px;flex-shrink:0;color:${T.txt4};background:transparent;border:1px solid transparent;transition:all .2s;user-select:none}
.edpn-star-btn:hover{background:rgba(245,200,66,.08);border-color:rgba(245,200,66,.2);color:${T.gold}}
.edpn-star-btn.edpn-fav{color:${T.gold};text-shadow:0 0 8px rgba(245,200,66,.5)}
.edpn-fav-bar{background:${T.card};border:1px solid ${T.border};border-radius:10px;padding:8px 14px;display:flex;align-items:center;gap:8px;overflow-x:auto}
.edpn-fav-chip{display:flex;align-items:center;gap:5px;padding:5px 10px;border-radius:7px;cursor:pointer;background:${T.up};border:1px solid ${T.border};transition:all .2s;white-space:nowrap;flex-shrink:0;font-size:12px}
.edpn-fav-chip:hover{border-color:${T.borderHi}}
.edpn-bc{display:flex;align-items:center;gap:5px;font-size:11px;color:${T.txt3}}
.edpn-bc-link{cursor:pointer;color:${T.txt2}}.edpn-bc-link:hover{color:${T.blue}}
.edpn-bc-cur{color:${T.txt};font-weight:500}
.edpn-form-section{background:${T.panel};border:1px solid ${T.border};border-radius:10px;overflow:hidden;margin-bottom:10px}
.edpn-form-hdr{padding:9px 14px;background:${T.up};border-bottom:1px solid ${T.border};display:flex;align-items:center;gap:7px}
.edpn-form-hdr-title{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:600;color:${T.txt};letter-spacing:.05em;text-transform:uppercase}
.edpn-form-body{padding:12px 14px;display:flex;flex-direction:column;gap:10px}
.edpn-field{display:flex;flex-direction:column;gap:3px}
.edpn-field-label{font-size:9px;color:${T.txt3};text-transform:uppercase;letter-spacing:.06em;font-weight:500;font-family:'JetBrains Mono',monospace}
.edpn-input,.edpn-textarea,.edpn-select{background:${T.up};border:1px solid ${T.border};border-radius:6px;padding:7px 10px;color:${T.txt};font-family:'DM Sans',sans-serif;font-size:13px;outline:none;width:100%;transition:border-color .15s}
.edpn-input:focus,.edpn-textarea:focus,.edpn-select:focus{border-color:${T.blue}}
.edpn-input::placeholder,.edpn-textarea::placeholder{color:${T.txt4}}
.edpn-textarea{resize:vertical;min-height:60px;line-height:1.5}
.edpn-select option{background:${T.card}}
.edpn-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.edpn-grid-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}
.edpn-chip{display:inline-flex;align-items:center;gap:3px;padding:3px 9px;border-radius:18px;font-size:11px;cursor:pointer;border:1px solid ${T.border};background:${T.up};color:${T.txt2};transition:all .15s;user-select:none}
.edpn-chip:hover{border-color:${T.borderHi};color:${T.txt}}
.edpn-chip.edpn-chip-sel{background:rgba(59,158,255,.15);border-color:${T.blue};color:${T.blue}}
.edpn-chips-wrap{display:flex;flex-wrap:wrap;gap:5px}
.edpn-tip-warn{padding:8px 12px;border-radius:7px;font-size:11px;line-height:1.5;display:flex;align-items:flex-start;gap:6px;background:rgba(255,107,107,.07);border:1px solid rgba(255,107,107,.25);color:${T.coral}}
.edpn-tip-info{padding:8px 12px;border-radius:7px;font-size:11px;line-height:1.5;display:flex;align-items:flex-start;gap:6px;background:rgba(59,158,255,.06);border:1px solid rgba(59,158,255,.2);color:${T.txt2}}
.edpn-tip-gold{padding:8px 12px;border-radius:7px;font-size:11px;line-height:1.5;display:flex;align-items:flex-start;gap:6px;background:rgba(245,200,66,.06);border:1px solid rgba(245,200,66,.2);color:${T.gold}}
.edpn-note-output{background:${T.card};border:1px solid ${T.border};border-radius:10px;overflow:hidden}
.edpn-note-hdr{padding:8px 14px;background:${T.up};border-bottom:1px solid ${T.border};display:flex;align-items:center;gap:8px}
.edpn-note-body{padding:18px 22px;font-family:'JetBrains Mono',monospace;font-size:12px;line-height:1.8;color:${T.txt};white-space:pre-wrap;min-height:260px;outline:none}
.edpn-btn{background:${T.up};border:1px solid ${T.border};border-radius:6px;padding:5px 12px;font-size:11px;color:${T.txt2};cursor:pointer;display:inline-flex;align-items:center;gap:4px;white-space:nowrap;transition:all .15s;font-family:'DM Sans',sans-serif}
.edpn-btn:hover{border-color:${T.borderHi};color:${T.txt}}
.edpn-btn:disabled{opacity:.35;pointer-events:none}
.edpn-btn-primary{background:${T.teal};color:${T.bg};border:none;border-radius:6px;padding:5px 14px;font-size:11px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:4px;white-space:nowrap;font-family:'DM Sans',sans-serif}
.edpn-btn-primary:hover{filter:brightness(1.15)}
.edpn-btn-blue{background:${T.blue};color:white;border:none;border-radius:6px;padding:5px 14px;font-size:11px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:4px;white-space:nowrap;font-family:'DM Sans',sans-serif}
.edpn-badge-teal{background:rgba(0,229,192,.12);color:${T.teal};border:1px solid rgba(0,229,192,.3);font-family:'JetBrains Mono',monospace;font-size:10px;padding:2px 8px;border-radius:18px;font-weight:600}
/* AI Overlay */
.edpn-ai-fab{position:fixed;bottom:72px;right:22px;z-index:500;width:52px;height:52px;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,${T.teal},#00b4d8);box-shadow:0 4px 20px rgba(0,229,192,.35);transition:all .3s;font-size:22px;color:${T.bg};font-weight:700}
.edpn-ai-fab.edpn-ai-open{background:linear-gradient(135deg,${T.coral},#e05555)}
.edpn-ai-overlay{position:fixed;bottom:136px;right:22px;width:340px;max-height:480px;z-index:499;background:${T.panel};border:1px solid ${T.border};border-radius:16px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.5);transition:all .3s;opacity:0;transform:translateY(16px) scale(.96);pointer-events:none}
.edpn-ai-overlay.edpn-ai-open{opacity:1;transform:translateY(0) scale(1);pointer-events:auto}
.edpn-ai-msgs{flex:1;overflow-y:auto;padding:10px 12px;display:flex;flex-direction:column;gap:6px;min-height:180px;max-height:320px}
.edpn-ai-msg{padding:8px 10px;border-radius:8px;font-size:12px;line-height:1.55}
.edpn-ai-msg.sys{background:${T.up};color:${T.txt3};border:1px solid ${T.border};align-self:center;font-size:11px;text-align:center}
.edpn-ai-msg.user{background:rgba(59,158,255,.12);border:1px solid rgba(59,158,255,.25);color:${T.txt};align-self:flex-end;border-radius:8px 8px 2px 8px;max-width:90%}
.edpn-ai-msg.bot{background:rgba(0,229,192,.07);border:1px solid rgba(0,229,192,.18);color:${T.txt};align-self:flex-start;border-radius:8px 8px 8px 2px;max-width:90%}
.edpn-ai-loader{display:flex;gap:4px;padding:8px;align-self:flex-start}
.edpn-ai-loader span{width:6px;height:6px;border-radius:50%;background:${T.teal};animation:edpnBnc 1.2s ease-in-out infinite}
.edpn-ai-loader span:nth-child(2){animation-delay:.2s}.edpn-ai-loader span:nth-child(3){animation-delay:.4s}
@keyframes edpnBnc{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-6px);opacity:1}}
.edpn-ai-input-wrap{padding:8px 10px;border-top:1px solid ${T.border};display:flex;gap:5px}
.edpn-ai-input{flex:1;background:${T.up};border:1px solid ${T.border};border-radius:8px;padding:7px 10px;color:${T.txt};font-size:12px;outline:none;resize:none;font-family:'DM Sans',sans-serif}
.edpn-ai-input:focus{border-color:${T.teal}}
.edpn-ai-send{width:34px;height:34px;background:${T.teal};color:${T.bg};border:none;border-radius:8px;font-size:16px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0}
/* Toast */
.edpn-toast{position:fixed;bottom:64px;left:50%;transform:translateX(-50%);background:${T.teal};color:${T.bg};padding:8px 16px;border-radius:7px;font-size:11px;font-weight:700;z-index:700;pointer-events:none;font-family:'DM Sans',sans-serif;transition:opacity .3s}
/* Modal */
.edpn-modal-overlay{position:fixed;inset:0;background:rgba(5,15,30,.85);z-index:600;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)}
.edpn-modal-box{background:${T.panel};border:1px solid ${T.border};border-radius:14px;width:460px;max-height:75vh;overflow-y:auto;box-shadow:0 24px 80px rgba(0,0,0,.5)}
.edpn-modal-hdr{padding:14px 18px 10px;border-bottom:1px solid ${T.border};display:flex;align-items:center;gap:8px}
.edpn-modal-body{padding:14px 18px;display:flex;flex-direction:column;gap:10px}
.edpn-color-row{display:flex;gap:5px;flex-wrap:wrap}
.edpn-color-swatch{width:26px;height:26px;border-radius:6px;cursor:pointer;border:2px solid transparent;transition:all .15s}
.edpn-color-swatch:hover{transform:scale(1.1)}.edpn-color-swatch.sel{border-color:${T.txt}}
.edpn-icon-row{display:flex;gap:4px;flex-wrap:wrap}
.edpn-icon-opt{width:34px;height:34px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:18px;cursor:pointer;border:1px solid ${T.border};background:${T.up};transition:all .15s}
.edpn-icon-opt:hover{border-color:${T.borderHi}}.edpn-icon-opt.sel{border-color:${T.blue};background:rgba(59,158,255,.12)}
`;

/* ══════════════════════════════════════
   FIELD RENDERER COMPONENT
══════════════════════════════════════ */
function FieldRenderer({ field, value, onChange }) {
  if (field.type === 'input') {
    return (
      <div className="edpn-field">
        <label className="edpn-field-label">{field.label}{field.required && <span style={{color:T.coral}}> *</span>}</label>
        <input className="edpn-input" placeholder={field.placeholder} value={value || ''} onChange={e => onChange(e.target.value)} />
      </div>
    );
  }
  if (field.type === 'textarea') {
    return (
      <div className="edpn-field">
        <label className="edpn-field-label">{field.label}</label>
        <textarea className="edpn-textarea" placeholder={field.placeholder} value={value || ''} onChange={e => onChange(e.target.value)} />
      </div>
    );
  }
  if (field.type === 'select') {
    return (
      <div className="edpn-field">
        <label className="edpn-field-label">{field.label}{field.required && <span style={{color:T.coral}}> *</span>}</label>
        <select className="edpn-select" value={value || ''} onChange={e => onChange(e.target.value)}>
          <option value="">Select…</option>
          {(field.options || []).map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    );
  }
  if (field.type === 'chips') {
    const sel = Array.isArray(value) ? value : (field.defaults || []);
    return (
      <div className="edpn-field">
        <label className="edpn-field-label">{field.label}</label>
        <div className="edpn-chips-wrap">
          {(field.options || []).map(o => {
            const active = sel.includes(o);
            return (
              <div key={o} className={`edpn-chip${active ? ' edpn-chip-sel' : ''}`}
                onClick={() => onChange(active ? sel.filter(x => x !== o) : [...sel, o])}>
                {o}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
}

/* ══════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════ */
export default function EDProcedureNotes({ embedded = false, patientName = '', patientAllergies = '', physicianName = '' }) {
  const [categories, setCategories] = useState(() => {
    try { const s = localStorage.getItem('notrya_cats4'); return s ? JSON.parse(s) : DEFAULT_CATEGORIES; } catch { return DEFAULT_CATEGORIES; }
  });
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('notrya_favs4') || '[]'); } catch { return []; }
  });
  const [activeCat, setActiveCat] = useState(null);
  const [selectedProc, setSelectedProc] = useState(null);
  const [view, setView] = useState('select'); // 'select' | 'document' | 'note'
  const [formData, setFormData] = useState({});
  const [ctx, setCtx] = useState({ physician: physicianName || '', date: new Date().toISOString().slice(0,10), allergies: patientAllergies || '' });
  const [noteText, setNoteText] = useState('');
  const [generating, setGenerating] = useState(false);
  const [search, setSearch] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState([{ role: 'sys', text: 'Notrya AI ready.' }]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [modal, setModal] = useState(null); // null | {type, data}
  const [modalCatColor, setModalCatColor] = useState(CAT_COLORS[0]);
  const [modalCatIcon, setModalCatIcon] = useState(CAT_ICONS[0]);
  const aiMsgsRef = useRef(null);
  const searchRef = useRef(null);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  }, []);

  const saveCats = useCallback((cats) => {
    try { localStorage.setItem('notrya_cats4', JSON.stringify(cats)); } catch {}
  }, []);

  const saveFavs = useCallback((favs) => {
    try { localStorage.setItem('notrya_favs4', JSON.stringify(favs)); } catch {}
  }, []);

  const toggleFav = useCallback((key) => {
    setFavorites(prev => {
      const next = prev.includes(key) ? prev.filter(x => x !== key) : [...prev, key];
      saveFavs(next);
      return next;
    });
  }, [saveFavs]);

  useEffect(() => { if (aiMsgsRef.current) aiMsgsRef.current.scrollTop = aiMsgsRef.current.scrollHeight; }, [aiMessages, aiLoading]);

  // Close search on outside click
  useEffect(() => {
    const handler = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearchResults(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const searchResults = search.trim()
    ? Object.values(P).filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.subtitle.toLowerCase().includes(search.toLowerCase()))
    : [];

  const currentCat = categories.find(c => c.id === activeCat);
  const proc = selectedProc ? P[selectedProc] : null;

  const updateField = (id, val) => setFormData(prev => ({ ...prev, [id]: val }));

  const generateNote = async () => {
    if (!proc) return;
    setGenerating(true);
    const lines = [
      'PROCEDURE NOTE',
      '═══════════════════════════════════════',
      `Patient: ${patientName || 'New Patient'} | ${new Date().toLocaleDateString()}`,
      `Attending: ${ctx.physician || '[Physician]'} | Allergies: ${ctx.allergies || 'NKDA'}`,
      '',
      `PROCEDURE: ${proc.name.toUpperCase()}`,
      '───────────────────────────────────────',
      '',
    ];
    proc.sections.forEach(s => {
      lines.push(s.title.toUpperCase());
      s.fields.forEach(f => {
        const v = formData[f.id];
        if (v) {
          if (Array.isArray(v) && v.length) lines.push(`${f.label}: ${v.join(', ')}`);
          else if (typeof v === 'string' && v.trim()) lines.push(`${f.label}: ${v}`);
        }
      });
      lines.push('');
    });
    lines.push('COMPLICATIONS: None noted.', '', 'Patient tolerated procedure well.', '', '───────────────────────────────────────', `Signed: ${ctx.physician || '[Physician]'}`, `Date/Time: ${new Date().toLocaleString()}`);
    setNoteText(lines.join('\n'));
    setView('note');
    setGenerating(false);
  };

  const sendAI = async () => {
    const q = aiInput.trim();
    if (!q || aiLoading) return;
    setAiInput('');
    setAiMessages(prev => [...prev, { role: 'user', text: q }]);
    setAiLoading(true);
    try {
      const procCtx = proc ? `Current procedure: ${proc.name}. ` : '';
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Notrya AI, an ED clinical assistant. Be concise and practical. ${procCtx}${q}`,
      });
      setAiMessages(prev => [...prev, { role: 'bot', text: typeof res === 'string' ? res : JSON.stringify(res) }]);
    } catch {
      setAiMessages(prev => [...prev, { role: 'sys', text: '⚠ Error connecting to AI.' }]);
    }
    setAiLoading(false);
  };

  const openCat = (id) => {
    setActiveCat(id);
  };

  const goHome = () => { setActiveCat(null); setSelectedProc(null); setView('select'); };

  const selectProc = (key) => {
    setSelectedProc(key);
    setFormData({});
    setNoteText('');
    // initialize chip defaults
    const pData = P[key];
    const defaults = {};
    pData.sections.forEach(s => s.fields.forEach(f => { if (f.type === 'chips' && f.defaults?.length) defaults[f.id] = f.defaults; }));
    setFormData(defaults);
    setView('document');
  };

  // Category CRUD
  const createCat = (name, color, icon) => {
    const newCat = { id: 'c_' + Date.now(), name, icon, color, procs: [] };
    const next = [...categories, newCat];
    setCategories(next); saveCats(next);
    setModal(null); showToast('Created: ' + name);
  };
  const updateCat = (id, name) => {
    const next = categories.map(c => c.id === id ? { ...c, name } : c);
    setCategories(next); saveCats(next); setModal(null);
    if (activeCat === id) openCat(id);
  };
  const deleteCat = (id) => {
    const next = categories.filter(c => c.id !== id);
    setCategories(next); saveCats(next); setModal(null); goHome();
  };
  const addProcToCat = (catId, procKey) => {
    const next = categories.map(c => c.id === catId ? { ...c, procs: [...c.procs, procKey] } : c);
    setCategories(next); saveCats(next); showToast(P[procKey].name + ' added');
  };

  /* ── BREADCRUMB ── */
  const Breadcrumb = () => (
    <div className="edpn-bc">
      <span className="edpn-bc-link" onClick={goHome}>Categories</span>
      {activeCat && currentCat && <>
        <span style={{color:T.txt4}}>›</span>
        <span className={`edpn-bc-link${!selectedProc ? ' edpn-bc-cur' : ''}`} onClick={() => { setSelectedProc(null); setView('select'); }}>{currentCat.name}</span>
      </>}
      {proc && <><span style={{color:T.txt4}}>›</span><span className="edpn-bc-cur">{proc.name}</span></>}
    </div>
  );

  /* ── MODALS ── */
  const NewCatModal = () => {
    const [name, setName] = useState('');
    const [color, setColor] = useState(CAT_COLORS[0]);
    const [icon, setIcon] = useState(CAT_ICONS[0]);
    return (
      <div className="edpn-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
        <div className="edpn-modal-box">
          <div className="edpn-modal-hdr">
            <span>📁</span>
            <span style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:600}}>New Category</span>
            <button className="edpn-btn" style={{marginLeft:'auto'}} onClick={() => setModal(null)}>✕</button>
          </div>
          <div className="edpn-modal-body">
            <div className="edpn-field"><label className="edpn-field-label">Name</label><input className="edpn-input" placeholder="e.g., Cardiac" value={name} onChange={e => setName(e.target.value)} /></div>
            <div className="edpn-field"><label className="edpn-field-label">Color</label><div className="edpn-color-row">{CAT_COLORS.map(c => <div key={c} className={`edpn-color-swatch${color===c?' sel':''}`} style={{background:c}} onClick={() => setColor(c)} />)}</div></div>
            <div className="edpn-field"><label className="edpn-field-label">Icon</label><div className="edpn-icon-row">{CAT_ICONS.map(ic => <div key={ic} className={`edpn-icon-opt${icon===ic?' sel':''}`} onClick={() => setIcon(ic)}>{ic}</div>)}</div></div>
            <div style={{display:'flex',justifyContent:'flex-end',gap:6}}>
              <button className="edpn-btn" onClick={() => setModal(null)}>Cancel</button>
              <button className="edpn-btn-primary" onClick={() => name.trim() && createCat(name.trim(), color, icon)}>✦ Create</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const EditCatModal = ({ cat }) => {
    const [name, setName] = useState(cat.name);
    return (
      <div className="edpn-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
        <div className="edpn-modal-box">
          <div className="edpn-modal-hdr">
            <span>✏️</span>
            <span style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:600}}>Edit: {cat.name}</span>
            <button className="edpn-btn" style={{marginLeft:'auto'}} onClick={() => setModal(null)}>✕</button>
          </div>
          <div className="edpn-modal-body">
            <div className="edpn-field"><label className="edpn-field-label">Name</label><input className="edpn-input" value={name} onChange={e => setName(e.target.value)} /></div>
            <div style={{display:'flex',justifyContent:'flex-end',gap:6}}>
              <button className="edpn-btn" style={{color:T.coral,borderColor:'rgba(255,107,107,.3)'}} onClick={() => deleteCat(cat.id)}>🗑️ Delete</button>
              <button className="edpn-btn" onClick={() => setModal(null)}>Cancel</button>
              <button className="edpn-btn-primary" onClick={() => updateCat(cat.id, name.trim() || cat.name)}>💾 Save</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const AddProcModal = ({ cat }) => {
    const avail = Object.keys(P).filter(k => !cat.procs.includes(k));
    const [added, setAdded] = useState([]);
    return (
      <div className="edpn-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
        <div className="edpn-modal-box">
          <div className="edpn-modal-hdr">
            <span>➕</span>
            <span style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:600}}>Add to {cat.name}</span>
            <button className="edpn-btn" style={{marginLeft:'auto'}} onClick={() => setModal(null)}>✕</button>
          </div>
          <div className="edpn-modal-body">
            {avail.length === 0 ? <div style={{textAlign:'center',padding:20,color:T.txt3}}>All procedures assigned.</div> :
              avail.map(k => (
                <div key={k} onClick={() => { if (!added.includes(k)) { addProcToCat(cat.id, k); setAdded(prev => [...prev, k]); } }}
                  style={{display:'flex',alignItems:'center',gap:8,padding:'7px 10px',background:T.card,border:`1px solid ${T.border}`,borderRadius:7,cursor:'pointer',opacity:added.includes(k)?0.4:1,pointerEvents:added.includes(k)?'none':'auto'}}>
                  <span style={{fontSize:18}}>{P[k].icon}</span>
                  <div style={{flex:1,fontSize:12,color:T.txt}}>{P[k].name}</div>
                  <span style={{color:T.teal}}>+</span>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="edpn-wrap" style={{background: embedded ? 'transparent' : T.bg, minHeight: embedded ? 'unset' : '100vh'}}>

        {/* Header */}
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <span style={{fontSize:18}}>✂️</span>
          <div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:600}}>ED Procedure Notes</div>
            <div style={{fontSize:11,color:T.txt3}}>Select a category, then document your procedure</div>
          </div>
          <div style={{marginLeft:'auto',display:'flex',gap:6}}>
            <button className="edpn-btn" onClick={() => setModal({type:'newcat'})}>+ Category</button>
          </div>
        </div>

        {/* Search */}
        <div className="edpn-cmd-bar" ref={searchRef}>
          <span style={{fontSize:13,color:T.txt3}}>🔍</span>
          <input className="edpn-cmd-input" placeholder={`Search ${Object.keys(P).length} procedures… ⌘K`}
            value={search} onChange={e => { setSearch(e.target.value); setShowSearchResults(true); }}
            onFocus={() => search && setShowSearchResults(true)} />
          {showSearchResults && searchResults.length > 0 && (
            <div className="edpn-cmd-results">
              {searchResults.slice(0, 7).map(p => (
                <div key={p.key} className="edpn-cmd-result" onClick={() => { selectProc(p.key); setSearch(''); setShowSearchResults(false); }}>
                  <span style={{fontSize:16,width:24,textAlign:'center'}}>{p.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{color:T.txt,fontWeight:500,fontSize:12}}>{p.name}</div>
                    <div style={{fontSize:10,color:T.txt3}}>{p.subtitle}</div>
                  </div>
                  <div className={`edpn-star-btn${favorites.includes(p.key)?' edpn-fav':''}`}
                    onClick={e => { e.stopPropagation(); toggleFav(p.key); }}>
                    {favorites.includes(p.key) ? '★' : '☆'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Favorites bar */}
        {favorites.length > 0 && (
          <div className="edpn-fav-bar">
            <span style={{fontSize:14,flexShrink:0}}>⭐</span>
            <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.gold,textTransform:'uppercase',letterSpacing:'.08em',fontWeight:600,flexShrink:0}}>Favorites</span>
            <div style={{width:1,height:18,background:T.border,flexShrink:0,margin:'0 3px'}} />
            {favorites.filter(k => P[k]).map(k => (
              <div key={k} className="edpn-fav-chip" onClick={() => selectProc(k)}>
                <span style={{fontSize:13}}>{P[k].icon}</span>
                <span style={{color:T.txt,fontWeight:500}}>{P[k].name}</span>
                <span style={{color:T.gold,cursor:'pointer',fontSize:11}} onClick={e => { e.stopPropagation(); toggleFav(k); }}>★</span>
              </div>
            ))}
          </div>
        )}

        {/* Breadcrumb */}
        <Breadcrumb />

        {/* ── SELECT VIEW ── */}
        {view === 'select' && !activeCat && (
          <div className="edpn-cat-grid">
            {categories.map(cat => (
              <div key={cat.id} className="edpn-cat-tile" onClick={() => openCat(cat.id)}>
                <div className="edpn-glow" style={{background:cat.color}} />
                <div className="edpn-ct-logo" style={{background:`${cat.color}18`,border:`1px solid ${cat.color}40`}}>{cat.icon}</div>
                <div className="edpn-ct-name">{cat.name}</div>
                <div className="edpn-ct-count">{cat.procs.length}</div>
              </div>
            ))}
            <div className="edpn-cat-tile" style={{borderStyle:'dashed',borderColor:T.txt4,background:'transparent'}} onClick={() => setModal({type:'newcat'})}>
              <div className="edpn-ct-logo" style={{background:'rgba(59,158,255,.08)',border:`1px dashed ${T.txt4}`,fontSize:20,color:T.txt4}}>+</div>
              <div className="edpn-ct-name" style={{color:T.txt3}}>New Category</div>
            </div>
          </div>
        )}

        {/* ── CATEGORY PROCS ── */}
        {view === 'select' && activeCat && currentCat && (
          <div>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
              <span style={{fontSize:24}}>{currentCat.icon}</span>
              <div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:600}}>{currentCat.name}</div>
                <div style={{fontSize:10,color:T.txt3}}>{currentCat.procs.length} procedure{currentCat.procs.length !== 1 ? 's' : ''}</div>
              </div>
              <button className="edpn-btn" style={{marginLeft:'auto'}} onClick={() => setModal({type:'addproc',cat:currentCat})}>+ Add</button>
              <button className="edpn-btn" onClick={() => setModal({type:'editcat',cat:currentCat})}>✏️</button>
            </div>
            {currentCat.procs.length === 0
              ? <div style={{textAlign:'center',padding:28,color:T.txt3,border:`1px dashed ${T.border}`,borderRadius:8}}>Empty — add procedures above.</div>
              : <div className="edpn-proc-list">
                  {currentCat.procs.filter(k => P[k]).map(k => {
                    const p = P[k]; const rl = RISK_LABEL[p.risk]; const fv = favorites.includes(k);
                    return (
                      <div key={k} className="edpn-proc-item" onClick={() => selectProc(k)}>
                        <span style={{fontSize:18,flexShrink:0}}>{p.icon}</span>
                        <div style={{flex:1}}>
                          <div style={{fontSize:12,fontWeight:500,color:T.txt}}>{p.name}</div>
                          <div style={{fontSize:9,color:T.txt3,marginTop:1}}>{p.subtitle}</div>
                        </div>
                        {rl && <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,fontWeight:700,padding:'2px 5px',borderRadius:4,background:RISK_BG[p.risk],color:RISK_COLOR[p.risk],border:`1px solid ${RISK_BD[p.risk]}`,flexShrink:0}}>{rl}</span>}
                        <div className={`edpn-star-btn${fv?' edpn-fav':''}`} onClick={e => { e.stopPropagation(); toggleFav(k); }}>{fv?'★':'☆'}</div>
                      </div>
                    );
                  })}
                </div>
            }
          </div>
        )}

        {/* ── DOCUMENT VIEW ── */}
        {view === 'document' && proc && (
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {/* Proc title + back */}
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <span style={{fontSize:22}}>{proc.icon}</span>
              <div style={{flex:1}}>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:600,display:'flex',alignItems:'center',gap:8}}>
                  {proc.name}
                  <div className={`edpn-star-btn${favorites.includes(selectedProc)?' edpn-fav':''}`} onClick={() => toggleFav(selectedProc)}>{favorites.includes(selectedProc)?'★':'☆'}</div>
                </div>
                <div style={{fontSize:12,color:T.txt3}}>{proc.subtitle}</div>
              </div>
              <button className="edpn-btn" onClick={() => { setSelectedProc(null); setView('select'); }}>← Back</button>
            </div>

            {/* Physician/Encounter */}
            <div className="edpn-form-section">
              <div className="edpn-form-hdr">
                <span>👤</span>
                <span className="edpn-form-hdr-title">Physician & Encounter</span>
                <span className="edpn-badge-teal" style={{marginLeft:'auto'}}>{proc.icon} {proc.name}</span>
              </div>
              <div className="edpn-form-body">
                <div className="edpn-grid-3">
                  <div className="edpn-field">
                    <label className="edpn-field-label">Physician</label>
                    <input className="edpn-input" placeholder="Dr. Smith, MD" value={ctx.physician} onChange={e => setCtx(p => ({...p,physician:e.target.value}))} />
                  </div>
                  <div className="edpn-field">
                    <label className="edpn-field-label">Date</label>
                    <input className="edpn-input" type="date" value={ctx.date} onChange={e => setCtx(p => ({...p,date:e.target.value}))} style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,colorScheme:'dark'}} />
                  </div>
                  <div className="edpn-field">
                    <label className="edpn-field-label">Allergies</label>
                    <input className="edpn-input" placeholder="NKDA" value={ctx.allergies} onChange={e => setCtx(p => ({...p,allergies:e.target.value}))} />
                  </div>
                </div>
              </div>
            </div>

            {/* Dynamic sections */}
            {proc.sections.map((s, si) => (
              <div key={si} className="edpn-form-section">
                <div className="edpn-form-hdr">
                  <span style={{fontSize:13}}>{s.icon}</span>
                  <span className="edpn-form-hdr-title">{s.title}</span>
                </div>
                <div className="edpn-form-body">
                  {s.warning && <div className="edpn-tip-warn"><span>⚠️</span><span>{s.warning}</span></div>}
                  <div className="edpn-grid-2" style={{gap:10}}>
                    {s.fields.map(f => (
                      <div key={f.id} style={f.type === 'chips' || f.type === 'textarea' ? {gridColumn:'1/-1'} : {}}>
                        <FieldRenderer field={f} value={formData[f.id]} onChange={val => updateField(f.id, val)} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {/* Tips */}
            {proc.tips && (
              <div className="edpn-tip-gold">
                <span>⚠</span>
                <div>
                  <strong style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,letterSpacing:'.1em',display:'block',marginBottom:2}}>KEY REMINDERS</strong>
                  {proc.tips}
                </div>
              </div>
            )}

            <button className="edpn-btn-primary" onClick={generateNote} disabled={generating} style={{padding:'9px 22px',fontSize:13,fontWeight:700,alignSelf:'flex-start'}}>
              {generating ? '⏳ Generating…' : '✦ Generate Note'}
            </button>
          </div>
        )}

        {/* ── NOTE VIEW ── */}
        {view === 'note' && (
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            {!noteText ? (
              <div style={{textAlign:'center',padding:48,color:T.txt3}}>
                <div style={{fontSize:36,opacity:.3,marginBottom:10}}>📄</div>
                <div style={{fontSize:13,color:T.txt2}}>No note yet</div>
                <button className="edpn-btn-blue" onClick={() => setView('document')} style={{marginTop:12}}>← Fill Form</button>
              </div>
            ) : (
              <>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:600}}>Generated Note</span>
                  <span className="edpn-badge-teal" style={{marginLeft:'auto'}}>Ready</span>
                  <button className="edpn-btn" onClick={generateNote}>↺ Regen</button>
                  <button className="edpn-btn-primary" onClick={() => { navigator.clipboard.writeText(noteText).then(() => showToast('Copied!')).catch(() => showToast('Failed')); }}>📋 Copy</button>
                  <button className="edpn-btn" onClick={() => setView('document')}>← Edit</button>
                </div>
                <div className="edpn-note-output">
                  <div className="edpn-note-hdr">
                    <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.txt3}}>{proc?.icon} {proc?.name} — {ctx.date}</span>
                    <span style={{marginLeft:'auto',fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.txt4}}>~{noteText.split(/\s+/).length} words</span>
                  </div>
                  <div className="edpn-note-body" contentEditable suppressContentEditableWarning onInput={e => setNoteText(e.currentTarget.innerText)}>{noteText}</div>
                </div>
                <div className="edpn-tip-info"><span>✏️</span><span>Editable. Verify all details before signing.</span></div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && <div className="edpn-toast">{toast}</div>}

      {/* AI Overlay */}
      <div className={`edpn-ai-overlay${aiOpen?' edpn-ai-open':''}`}>
        <div style={{padding:'10px 12px',borderBottom:`1px solid ${T.border}`,display:'flex',alignItems:'center',gap:8}}>
          <div style={{width:7,height:7,borderRadius:'50%',background:T.teal}} />
          <span style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:600}}>Notrya AI</span>
          <span style={{marginLeft:'auto',fontFamily:"'JetBrains Mono',monospace",fontSize:9,background:T.up,border:`1px solid ${T.border}`,borderRadius:20,padding:'2px 7px',color:T.txt3}}>gpt</span>
          <button onClick={() => setAiOpen(false)} style={{width:24,height:24,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:5,border:`1px solid ${T.border}`,background:T.up,color:T.txt3,cursor:'pointer',fontSize:12}}>─</button>
        </div>
        <div className="edpn-ai-msgs" ref={aiMsgsRef}>
          {aiMessages.map((m, i) => (
            <div key={i} className={`edpn-ai-msg ${m.role}`} dangerouslySetInnerHTML={{__html: m.text.replace(/\n/g,'<br>').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')}} />
          ))}
          {aiLoading && <div className="edpn-ai-loader"><span/><span/><span/></div>}
        </div>
        <div className="edpn-ai-input-wrap">
          <textarea className="edpn-ai-input" rows={1} placeholder="Ask anything…" value={aiInput} onChange={e => setAiInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAI(); } }} />
          <button className="edpn-ai-send" onClick={sendAI}>↑</button>
        </div>
      </div>
      <button className={`edpn-ai-fab${aiOpen?' edpn-ai-open':''}`} onClick={() => setAiOpen(o => !o)}>
        {aiOpen ? '✕' : '✦'}
      </button>

      {/* Modals */}
      {modal?.type === 'newcat' && <NewCatModal />}
      {modal?.type === 'editcat' && <EditCatModal cat={modal.cat} />}
      {modal?.type === 'addproc' && <AddProcModal cat={modal.cat} />}
    </>
  );
}