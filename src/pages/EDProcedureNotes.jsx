import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";

/* ─── SVG LOGOS ─────────────────────────────────────────────────── */
const LP = {
  wound: '<path d="M14 6c-2 4-6 8-6 14s4 8 8 8 8-2 8-8-4-10-6-14z" fill="currentColor" opacity=".2"/><path d="M16 10v12M12 14h8M12 18h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  airway: '<circle cx="16" cy="10" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M16 14v10M12 20h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M10 8c-2-3 0-6 3-6M22 8c2-3 0-6-3-6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" opacity=".5"/>',
  vascular: '<path d="M16 4v24" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="16" cy="10" r="3" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="16" cy="22" r="3" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8 16h16" stroke="currentColor" stroke-width="1.2" stroke-dasharray="2 2"/>',
  thoracic: '<path d="M8 12c0-5 3-8 8-8s8 3 8 8v8c0 3-2 6-8 6s-8-3-8-6z" fill="currentColor" opacity=".15" stroke="currentColor" stroke-width="1.5"/><path d="M12 12h8M12 16h8M12 20h8" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity=".5"/>',
  ortho: '<path d="M10 4l2 10-2 10M22 4l-2 10 2 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="16" cy="14" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/>',
  procedure: '<rect x="8" y="6" width="16" height="20" rx="3" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M12 12h8M12 16h6M12 20h4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>',
  cardiac: '<path d="M16 28c-8-6-12-10-12-16a6 6 0 0112 0 6 6 0 0112 0c0 6-4 10-12 16z" fill="currentColor" opacity=".15" stroke="currentColor" stroke-width="1.3"/>',
  neuro: '<circle cx="16" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M12 10c1-2 3-3 4-3s3 1 4 3M10 14c2 2 5 3 6 3s4-1 6-3M16 19v6M12 25h8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>',
  ent: '<ellipse cx="16" cy="14" rx="5" ry="7" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="13" cy="12" r="1.5" fill="currentColor" opacity=".4"/><circle cx="19" cy="12" r="1.5" fill="currentColor" opacity=".4"/><path d="M13 17c1 1.5 2 2 3 2s2-.5 3-2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><path d="M16 21v5M13 26h6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>',
  eye: '<ellipse cx="16" cy="16" rx="10" ry="6" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="16" cy="16" r="3.5" fill="currentColor" opacity=".2" stroke="currentColor" stroke-width="1.2"/><circle cx="16" cy="16" r="1.5" fill="currentColor"/>',
  gu: '<circle cx="16" cy="13" r="6" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M16 19v7M12 22h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  nerve: '<path d="M16 4v8M16 12c-4 0-8 4-8 8M16 12c4 0 8 4 8 8M12 16c-2 2-4 6-4 8M20 16c2 2 4 6 4 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="16" cy="4" r="2" fill="currentColor" opacity=".3"/>',
  trauma: '<polygon points="16,4 20,12 28,14 22,20 24,28 16,24 8,28 10,20 4,14 12,12" fill="currentColor" opacity=".15" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>',
  custom: '<rect x="8" y="8" width="16" height="16" rx="4" fill="currentColor" opacity=".15" stroke="currentColor" stroke-width="1.5"/><path d="M13 16h6M16 13v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
};

function SvgLogo({ k, color, size = 32 }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} fill="none" style={{ color }} dangerouslySetInnerHTML={{ __html: LP[k] || LP.custom }} />
  );
}

/* ─── PROCEDURE DATA ─────────────────────────────────────────────── */
const LIDO = ['Lidocaine 1% plain','Lidocaine 1% w/ epi','Lidocaine 2% plain','Lidocaine 2% w/ epi','Bupivacaine 0.25%','Bupivacaine 0.5%'];
const NVpre = ['*Sensation intact','*Motor intact','*Cap refill <2s','*Pulses present'];
const NVpost = ['*Sensation intact','*Motor function intact','*Pulses intact','*Cap refill <2 sec'];

const P = {
  lac: { name:'Laceration Repair', ico:'🩹', sub:'Wound closure', risk:'low', tips:'Epi contraindications digits/ears/nose; billing: simple <2.5cm vs complex',
    secs:[
      { ic:'📍', t:'Wound Details', rows:[
        [{t:'i',id:'location',lbl:'Location',req:1,ph:'Right forehead'},{t:'i',id:'length',lbl:'Length',req:1,ph:'3.5 cm'}],
        [{t:'s',id:'depth',lbl:'Depth',o:['Superficial','Deep dermis','Subcutaneous','Fascia','Muscle']},{t:'s',id:'wtype',lbl:'Type',o:['Linear','Stellate','Avulsion','Degloving','Puncture']},{t:'s',id:'contam',lbl:'Contamination',o:['Clean','Mild','Heavy','Bite','Soil/debris']}],
        {t:'c',id:'wchar',lbl:'Characteristics',o:['Well-approximated','Jagged/irregular','Active bleeding','Minimal bleeding','FB noted','Tendon visible','Bone visible']},
      ]},
      { ic:'💉', t:'Anesthesia & Prep', rows:[
        [{t:'s',id:'anes',lbl:'Anesthetic',req:1,o:[...LIDO,'LET gel','Diphenhydramine']},{t:'i',id:'anes_amt',lbl:'Amount (mL)',ph:'5'},{t:'s',id:'anes_tech',lbl:'Technique',o:['Local infiltration','Field block','Digital block','Regional','Topical']}],
        {t:'c',id:'prep',lbl:'Preparation',o:['*NS irrigation','Betadine','Chlorhexidine','FB removed','Explored','Hair removal']},
      ]},
      { ic:'🧵', t:'Closure', rows:[
        [{t:'s',id:'closure',lbl:'Method',req:1,o:['Simple interrupted','Running','Horizontal mattress','Vertical mattress','Deep + interrupted','Staples','Dermabond','Steri-strips']},{t:'s',id:'sut_mat',lbl:'Material',o:['N/A','3-0 Nylon','4-0 Nylon','5-0 Nylon','6-0 Nylon','3-0 Vicryl','3-0 Chromic']}],
        [{t:'i',id:'sut_n',lbl:'# Sutures',ph:'6'},{t:'s',id:'dressing',lbl:'Dressing',o:['Dry sterile','Bacitracin + gauze','Petrolatum','Tegaderm','None (face)']}],
      ]},
      { ic:'✅', t:'Aftercare', rows:[
        [{t:'s',id:'tet',lbl:'Tetanus',req:1,o:['Up to date','Tdap given','TIG given','Tdap + TIG','Declined']},{t:'s',id:'abx',lbl:'Antibiotics',o:['None','Cephalexin 500mg QID x 5d','Amox-clav 875mg BID x 5d','Clindamycin 300mg QID x 5d']}],
        {t:'c',id:'nvpost',lbl:'Post NV',o:NVpost},
        {t:'a',id:'addl',lbl:'Notes',ph:'Tolerated well…'},
      ]},
    ],
  },
  iand: { name:'I&D / Abscess', ico:'💉', sub:'Incision & drainage', risk:'low', tips:'MRSA coverage; packing type; admission criteria',
    secs:[
      { ic:'📍', t:'Abscess', rows:[
        [{t:'i',id:'location',lbl:'Location',req:1,ph:'Left buttock'},{t:'i',id:'size',lbl:'Size',req:1,ph:'4x3x2 cm'}],
        [{t:'s',id:'skin',lbl:'Overlying Skin',o:['Erythematous fluctuant','Indurated','Pointing','Cellulitis']},{t:'s',id:'lymph',lbl:'Lymphangitis',o:['No','Yes']}],
      ]},
      { ic:'💉', t:'Procedure', rows:[
        [{t:'s',id:'anes',lbl:'Anesthetic',req:1,o:['Lido 1%','Lido 1% w/epi','Lido 2%','Proc sedation','None']},{t:'s',id:'incision',lbl:'Incision',o:['Linear #11','Linear #15','Cruciate','Loop drain']}],
        {t:'c',id:'drain',lbl:'Drainage',req:1,o:['Purulent','Serosanguineous','Malodorous','Loculations broken','Irrigated']},
        [{t:'s',id:'packing',lbl:'Packing',o:["Iodoform 1/4\"","Iodoform 1/2\"","Plain gauze","Not packed","Loop"]},{t:'s',id:'cx',lbl:'Cultures',o:['Wound culture','Not sent','Blood cultures','MRSA swab']}],
      ]},
      { ic:'✅', t:'Disposition', rows:[
        [{t:'s',id:'abx',lbl:'Antibiotics',req:1,o:['None','TMP-SMX DS BID x 7d','Doxy 100mg BID x 7d','Clinda 300mg TID x 7d','Cephalexin 500mg QID x 7d']},{t:'s',id:'fu',lbl:'Follow-Up',o:['48h wound check','48-72h repack','PCP 3-5d','Wound clinic','Admit']}],
        {t:'a',id:'addl',lbl:'Notes'},
      ]},
    ],
  },
  intub: { name:'Intubation / RSI', ico:'🌬️', sub:'Rapid sequence intubation', risk:'high', tips:'Succ contraindications; capnography mandatory; backup airway; 6mL/kg IBW',
    secs:[
      { ic:'🌬️', t:'Indication', rows:[
        {t:'tip',cls:'rd',txt:'⚠️ High-risk. Document all attempts and backup plans.'},
        {t:'c',id:'ind',lbl:'Indication',req:1,o:['Hypoxic resp failure','Hypercapnic','Airway protect — AMS','GCS ≤8','Impending failure','Obstruction']},
        [{t:'s',id:'preox',lbl:'Pre-O₂',o:['15L NRB x 3min','BVM + PEEP','HFNC 60L','BiPAP','Crash']},{t:'i',id:'prespo2',lbl:'SpO₂',ph:'94%'}],
      ]},
      { ic:'💊', t:'RSI Meds', rows:[
        [{t:'s',id:'ind_agent',lbl:'Induction',req:1,o:['Ketamine 1.5-2','Propofol 1.5-2','Etomidate 0.3']},{t:'i',id:'ind_dose',lbl:'Dose',ph:'Ketamine 200mg'}],
        [{t:'s',id:'par',lbl:'Paralytic',req:1,o:['Succ 1.5 mg/kg','Roc 1.2 mg/kg','Vec 0.1 mg/kg']},{t:'i',id:'par_dose',lbl:'Dose',ph:'Succ 150mg'}],
      ]},
      { ic:'🔭', t:'Laryngoscopy', rows:[
        [{t:'s',id:'dev',lbl:'Device',req:1,o:['DL Mac 3','DL Mac 4','DL Miller 2','VL GlideScope','VL C-MAC','FOB','LMA']},{t:'s',id:'att',lbl:'Attempts',req:1,o:['1st success','2 success','3 success','Failed']},{t:'s',id:'ett',lbl:'ETT',req:1,o:['6.0','6.5','7.0','7.5','8.0']}],
        {t:'c',id:'conf',lbl:'Confirmation',req:1,o:['*Waveform capnography ✓','*Bilateral breath sounds ✓','*Bilateral chest rise ✓','*SpO₂ maintained','CXR ordered']},
      ]},
      { ic:'⚙️', t:'Post-Intubation', rows:[
        [{t:'s',id:'vm',lbl:'Vent',o:['AC/VC','AC/PC','SIMV']},{t:'i',id:'tv',lbl:'TV',ph:'500 mL'},{t:'i',id:'vset',lbl:'Rate/PEEP/FiO₂',ph:'RR14 PEEP5 100%'}],
        {t:'c',id:'comp',lbl:'Complications',o:['*None','Transient hypoxia','Esophageal (corrected)','R mainstem (fixed)']},
        {t:'a',id:'addl',lbl:'Notes'},
      ]},
    ],
  },
  cryo: { name:'Cricothyrotomy', ico:'🔪', sub:'Emergency surgical airway', risk:'high', tips:'Last resort — failed intubation; 6.0-6.5 ETT; CXR + bronchoscopy post',
    secs:[{ ic:'🔪', t:'Procedure', rows:[
      {t:'tip',cls:'rd',txt:'⚠️ Emergency surgical airway — document failed intubation.'},
      [{t:'s',id:'ind',lbl:'Indication',req:1,o:['Cannot intubate/ventilate','Failed intubation ≥2','Facial trauma','Severe angioedema']},{t:'s',id:'method',lbl:'Technique',req:1,o:['Landmark palpation','US guided','Scalpel classic','Needle/cannula']}],
      [{t:'s',id:'tube',lbl:'Tube',o:['6.0 ETT','6.5 ETT','Trach tube']},{t:'s',id:'conf',lbl:'Confirmation',o:['Bilateral BS','Capnography +','Chest rise','Secured']}],
      {t:'c',id:'post',lbl:'Post',o:['*CXR ordered','*Bronch scheduled','*ICU notified','*Trach planned 24h']},
      {t:'a',id:'addl',lbl:'Notes'},
    ]}],
  },
  cl: { name:'Central Line', ico:'🩺', sub:'CVC insertion', risk:'high', tips:'US guidance standard; CXR required; full barrier',
    secs:[
      { ic:'🩺', t:'Indication', rows:[
        {t:'c',id:'ind',lbl:'Indication',req:1,o:['No PIV','Hemodynamic monitoring','Vasopressors','Rapid volume','TV pacing','Caustic meds']},
        [{t:'s',id:'site',lbl:'Site',req:1,o:['R IJ','L IJ','R subclavian','L subclavian','R femoral','L femoral']},{t:'s',id:'cath',lbl:'Catheter',o:['Triple lumen','Double lumen','Single lumen','Cordis','Shiley']}],
      ]},
      { ic:'🔊', t:'Technique', rows:[
        {t:'tip',cls:'rd',txt:'⚠️ Document US, attempts, CXR.'},
        [{t:'s',id:'us',lbl:'US',req:1,o:['Real-time','US localization','Landmark']},{t:'s',id:'att',lbl:'Attempts',req:1,o:['1 success','2 success','3 success','Failed']},{t:'i',id:'depth',lbl:'Depth cm',ph:'15'}],
        {t:'c',id:'lum',lbl:'Lumens',o:['*All flush','*Sutured','*Sterile dressing']},
      ]},
      { ic:'✅', t:'Confirmation', rows:[
        {t:'c',id:'conf',lbl:'Position',req:1,o:['*CXR SVC/RA','*No PTX','*Venous blood']},
        {t:'c',id:'comp',lbl:'Complications',o:['*None','Arterial puncture','PTX','Hematoma']},
        {t:'a',id:'addl',lbl:'Notes'},
      ]},
    ],
  },
  piv: { name:'Peripheral IV', ico:'💉', sub:'PIV insertion', risk:'low', tips:'Two large-bore for resuscitation',
    secs:[{ ic:'💉', t:'IV', rows:[
      [{t:'s',id:'ind',lbl:'Indication',req:1,o:['IV access','Resuscitation','Blood draw']},{t:'s',id:'gauge',lbl:'Gauge',req:1,o:['18G','20G','22G']},{t:'s',id:'site',lbl:'Site',req:1,o:['Antecubital','Forearm','Hand','Lower ext']}],
      {t:'c',id:'conf',lbl:'Confirmation',o:['*Blood return','*Fluid flows','*No swelling','*Secured']},
    ]}],
  },
  io: { name:'Intraosseous Access', ico:'🦴', sub:'IO vascular access', risk:'high', tips:'Last resort; marrow aspirate before fluids; compartment syndrome risk',
    secs:[{ ic:'💉', t:'IO', rows:[
      {t:'tip',cls:'rd',txt:'⚠️ High-risk — document failed PIV.'},
      [{t:'s',id:'ind',lbl:'Indication',req:1,o:['Cardiac arrest — no IV','Severe shock','Pediatric','Burns']},{t:'s',id:'site',lbl:'Site',req:1,o:['Proximal humerus','Proximal tibia','Distal tibia','Distal femur']},{t:'s',id:'att',lbl:'Attempts',o:['1 success','2 success','Failed']}],
      {t:'c',id:'conf',lbl:'Confirmation',o:['*Needle firm','*Marrow aspirate','*Free flow','*No extravasation']},
      {t:'a',id:'addl',lbl:'Notes'},
    ]}],
  },
  ct: { name:'Chest Tube', ico:'🫁', sub:'Tube thoracostomy', risk:'high', tips:'Safe triangle 4th/5th ICS AAL; CXR mandatory',
    secs:[{ ic:'🫁', t:'Details', rows:[
      {t:'tip',cls:'rd',txt:'⚠️ High complication risk.'},
      [{t:'s',id:'ind',lbl:'Indication',req:1,o:['PTX simple','PTX tension','Hemothorax','Hemopneumothorax','Empyema','Effusion']},{t:'s',id:'side',lbl:'Side',req:1,o:['Right','Left']}],
      [{t:'s',id:'fr',lbl:'Size',o:['28 Fr','32 Fr','36 Fr','40 Fr','14 pigtail']},{t:'s',id:'site',lbl:'Site',o:["4th/5th ICS AAL","2nd ICS MCL","Posterior"]}],
      [{t:'i',id:'drain',lbl:'Output',ph:'400 mL'},{t:'s',id:'suct',lbl:'Suction',o:['-20 cmH₂O','Water seal','Heimlich']}],
      {t:'c',id:'conf',lbl:'Confirmation',o:['*CXR confirmed','*Lung expanded','*Sutured','*Occlusive dressing']},
      {t:'a',id:'addl',lbl:'Notes'},
    ]}],
  },
  lp: { name:'Lumbar Puncture', ico:'🔬', sub:'Spinal tap', risk:'mod', tips:'CT before LP; CSF interpretation; 4 tubes; HSV PCR if encephalitis',
    secs:[
      { ic:'🔬', t:'Indication', rows:[
        [{t:'c',id:'ind',lbl:'Indication',req:1,o:['R/O SAH','R/O meningitis','CNS infection','Therapeutic','Demyelinating']},{t:'s',id:'ct',lbl:'Pre-LP CT',req:1,o:['CT safe','CT normal','Not required','Contraindicated']}],
      ]},
      { ic:'🩺', t:'Procedure', rows:[
        [{t:'s',id:'pos',lbl:'Position',o:['Lateral decubitus','Seated']},{t:'s',id:'lvl',lbl:'Level',req:1,o:['L3-L4','L4-L5','L2-L3']},{t:'s',id:'att',lbl:'Attempts',req:1,o:['1 success','2 success','3 success','Failed']}],
        [{t:'i',id:'op',lbl:'Opening Pressure',req:1,ph:'18 cmH₂O'},{t:'s',id:'csf',lbl:'CSF',req:1,o:['Clear','Xanthochromic','Bloody clearing','Uniformly bloody','Turbid']}],
      ]},
      { ic:'🧪', t:'CSF Studies', rows:[
        {t:'c',id:'tubes',lbl:'Tubes',o:['*Tube 1 Cell count','*Tube 2 Protein/glucose','*Tube 3 Culture/gram','*Tube 4 Repeat cell','HSV PCR','Crypto','VDRL']},
        {t:'a',id:'addl',lbl:'Notes'},
      ]},
    ],
  },
  fast: { name:'FAST Exam', ico:'🔊', sub:'Trauma sonography', risk:'low', tips:"All views documented; action for positive; sensitivity ~80%",
    secs:[{ ic:'🔊', t:'FAST', rows:[
      [{t:'s',id:'ind',lbl:'Indication',req:1,o:['Blunt trauma','Penetrating','Hypotension','Rib fx','eFAST']},{t:'i',id:'ctx',lbl:'Context',ph:'MVC restrained'}],
      [{t:'s',id:'ruq',lbl:'RUQ',req:1,o:['Neg','Pos','Indet']},{t:'s',id:'luq',lbl:'LUQ',req:1,o:['Neg','Pos','Indet']},{t:'s',id:'pelv',lbl:'Pelvic',req:1,o:['Neg','Pos','Indet']},{t:'s',id:'card',lbl:'Cardiac',req:1,o:['Neg','Pos effusion','Indet']}],
      {t:'s',id:'result',lbl:'Overall',req:1,o:['NEGATIVE','POSITIVE','INDETERMINATE']},
      {t:'a',id:'addl',lbl:'Notes'},
    ]}],
  },
  cv: { name:'Cardioversion', ico:'⚡', sub:'Synchronized electrical cardioversion', risk:'high', tips:'Confirm SYNC mode before every shock. AFib 120-200J, flutter 50-100J',
    secs:[{ ic:'⚡', t:'Cardioversion', rows:[
      {t:'tip',cls:'rd',txt:'⚠️ Confirm SYNC mode before every shock.'},
      [{t:'s',id:'ind',lbl:'Rhythm',req:1,o:['AFib — unstable','AFib — elective','A-flutter','SVT refractory','VT with pulse','VT unstable']},{t:'s',id:'dur',lbl:'Duration',o:['<48h','≥48h — anticoag discussed','Emergent']}],
      [{t:'s',id:'sed',lbl:'Sedation',o:['Midaz + Fent','Etomidate','Propofol','Ketamine','None — life threat']},{t:'i',id:'sed_dose',lbl:'Dose',ph:'Midaz 2mg IV'}],
      [{t:'i',id:'j1',lbl:'Shock 1 (J)',req:1,ph:'120J biphasic'},{t:'s',id:'r1',lbl:'Result',o:['Sinus restored','No change','Partial']},{t:'i',id:'j2',lbl:'Shock 2',ph:'200J'}],
      [{t:'s',id:'postrhythm',lbl:'Post Rhythm',req:1,o:['NSR','Sinus brady','Junctional','Persistent AFib','VF — defib']},{t:'i',id:'postvit',lbl:'Post Vitals',ph:'BP 118/72 HR 78'}],
      {t:'a',id:'addl',lbl:'Notes'},
    ]}],
  },
  par: { name:'Paracentesis', ico:'💧', sub:'Abdominal paracentesis', risk:'mod', tips:'SBP if PMN >250; albumin 6-8g/L if >5L removed; US reduces complications',
    secs:[{ ic:'💧', t:'Paracentesis', rows:[
      [{t:'s',id:'ind',lbl:'Indication',req:1,o:['Diagnostic — R/O SBP','Therapeutic','Both']},{t:'s',id:'site',lbl:'Site',o:['LLQ US-guided','RLQ','Midline infraumbilical']}],
      [{t:'s',id:'us',lbl:'US Used',req:1,o:['Real-time','US pocket ID','Landmark']},{t:'i',id:'vol',lbl:'Volume',ph:'4.5 L'},{t:'s',id:'app',lbl:'Appearance',req:1,o:['Clear yellow','Turbid/cloudy','Bloody','Milky']}],
      {t:'c',id:'labs',lbl:'Studies',o:['*Cell count + diff','*Protein/albumin/LDH','*Gram stain + culture','Glucose/amylase','Cytology']},
      {t:'s',id:'alb',lbl:'Albumin',o:['Not indicated','Albumin 25% given','NS used']},
      {t:'a',id:'addl',lbl:'Notes'},
    ]}],
  },
  foley: { name:'Foley Catheter', ico:'🚽', sub:'Urinary catheter', risk:'low', tips:'Aseptic; check hematuria; daily removal assessment',
    secs:[{ ic:'🚽', t:'Placement', rows:[
      [{t:'s',id:'ind',lbl:'Indication',req:1,o:['Retention','Sepsis I/Os','Hemodynamic','Burns']},{t:'s',id:'size',lbl:'Size',req:1,o:['16 Fr','18 Fr','20 Fr','22 Fr']}],
      {t:'c',id:'tech',lbl:'Technique',o:['*Sterile field','*Betadine/CHG','*No resistance','*Urine return']},
      {t:'s',id:'color',lbl:'Color',req:1,o:['Clear','Cloudy','Tea-colored','Hematuria']},
      {t:'a',id:'addl',lbl:'Notes'},
    ]}],
  },
  ngt: { name:'Nasogastric Tube', ico:'🧴', sub:'NGT insertion', risk:'low', tips:'16-18 Fr; pH <6 confirms; CXR if doubt; contraindicated basilar skull fx',
    secs:[{ ic:'🧴', t:'NGT', rows:[
      [{t:'s',id:'ind',lbl:'Indication',req:1,o:['Gastric decompression','Aspiration risk','Medication admin','Enteral feeding']},{t:'s',id:'size',lbl:'Size',o:['14 Fr','16 Fr','18 Fr']}],
      [{t:'i',id:'depth',lbl:'Depth (cm)',ph:'50'},{t:'s',id:'conf',lbl:'Confirmation',req:1,o:['*Gastric aspirate','*pH <6','*CXR confirmed','*Auscultation — air']}],
      {t:'a',id:'addl',lbl:'Notes'},
    ]}],
  },
  epi: { name:'Epistaxis / Nasal Packing', ico:'👃', sub:'Anterior/posterior nasal packing', risk:'low', tips:'Anterior Rhino Rocket first; posterior = Foley balloon if anterior fails',
    secs:[{ ic:'👃', t:'Epistaxis', rows:[
      [{t:'s',id:'side',lbl:'Side',req:1,o:['Right','Left','Bilateral']},{t:'s',id:'type',lbl:'Type',o:['Anterior','Posterior','Unable to determine']}],
      [{t:'s',id:'initial',lbl:'Initial Management',o:['Direct pressure 15 min','Afrin spray','Silver nitrate cautery','Surgicel/gelfoam']},{t:'s',id:'packing',lbl:'Packing',req:1,o:['Rhino Rocket — anterior','Merocel sponge','Rapid Rhino','Posterior Foley balloon','Posterior pack — ENT','None — cautery sufficient']}],
      {t:'s',id:'abx',lbl:'Antibiotics',o:['None','Amox-clav (if packed)','Cephalexin']},
      {t:'s',id:'fu',lbl:'Follow-Up',o:['ENT 24-48h','ENT emergent','PCP 3-5d','Return if rebleed']},
      {t:'a',id:'addl',lbl:'Notes'},
    ]}],
  },
  cantho: { name:'Lateral Canthotomy', ico:'👁️', sub:'Orbital compartment decompression', risk:'high', tips:'IOP >40 or clinical signs; time-critical — do not wait for ophth',
    secs:[{ ic:'👁️', t:'Canthotomy', rows:[
      {t:'tip',cls:'rd',txt:'⚠️ Time-critical procedure — do not delay for imaging or consult.'},
      [{t:'s',id:'side',lbl:'Eye',req:1,o:['Right','Left']},{t:'s',id:'ind',lbl:'Indication',req:1,o:['Retrobulbar hemorrhage — trauma','IOP >40 — orbital compartment','Proptosis + vision loss','Afferent pupillary defect']}],
      [{t:'i',id:'iop_pre',lbl:'IOP Pre',ph:'52 mmHg'},{t:'s',id:'anes',lbl:'Anesthetic',o:['Lido 1% w/ epi','None — emergent']},{t:'i',id:'iop_post',lbl:'IOP Post',ph:'18 mmHg'}],
      {t:'c',id:'exam',lbl:'Post Exam',o:['*Vision assessed','*IOP remeasured','*Pupil reactivity checked','*Ophthalmology called']},
      {t:'a',id:'addl',lbl:'Notes'},
    ]}],
  },
  sed: { name:'Procedural Sedation', ico:'💤', sub:'Conscious sedation', risk:'mod', tips:'Ketamine preferred in ED; capnography for deep; discharge criteria met',
    secs:[
      { ic:'💤', t:'Pre-Sedation', rows:[
        [{t:'i',id:'ind',lbl:'Indication',req:1,ph:'Shoulder reduction'},{t:'s',id:'asa',lbl:'ASA',o:['I — healthy','II — mild systemic','III — severe','IV — life-threatening']}],
        [{t:'s',id:'npo',lbl:'NPO',o:['Emergency — N/A','NPO >8h','NPO >6h','Not NPO — risk discussed']},{t:'s',id:'aw',lbl:'Airway',o:['No difficulty','Potentially difficult','VL at bedside']}],
      ]},
      { ic:'💊', t:'Medications', rows:[
        [{t:'s',id:'agent',lbl:'Agent',req:1,o:['Ketamine 1-1.5 mg/kg IV','Ketamine 4 mg/kg IM','Propofol 1 mg/kg IV','Midazolam + Fentanyl','Etomidate 0.1-0.15 mg/kg']},{t:'i',id:'dose',lbl:'Dose Given',ph:'Ketamine 100mg IV'}],
        [{t:'s',id:'slvl',lbl:'Level',o:['Minimal','Moderate','Deep','Dissociative']},{t:'i',id:'dur',lbl:'Duration',ph:'15 min'}],
      ]},
      { ic:'✅', t:'Recovery', rows:[
        {t:'c',id:'rec',lbl:'Recovery',o:['*Returned to baseline','*SpO₂ on RA','*No adverse events']},
        {t:'a',id:'addl',lbl:'Outcome',ph:'Reduction successful…'},
      ]},
    ],
  },
  arth: { name:'Arthrocentesis', ico:'🦵', sub:'Joint aspiration', risk:'mod', tips:'WBC >50k = septic (no steroid); urate = gout; CPPD = pseudogout',
    secs:[{ ic:'🦵', t:'Arthrocentesis', rows:[
      [{t:'s',id:'joint',lbl:'Joint',req:1,o:['R knee','L knee','R ankle','L ankle','R wrist','L wrist','R elbow','L elbow','R shoulder','L shoulder']},{t:'s',id:'ind',lbl:'Indication',req:1,o:['R/O septic','Gout/pseudogout','Diagnostic','Therapeutic','Hemarthrosis']}],
      [{t:'i',id:'vol',lbl:'Volume',ph:'35 mL'},{t:'s',id:'app',lbl:'Appearance',req:1,o:['Clear/straw','Yellow turbid','Purulent','Bloody','Chalky white']}],
      {t:'c',id:'labs',lbl:'Studies',o:['*Cell count + diff','*Crystal analysis','*Gram stain + culture','Glucose/protein']},
      {t:'s',id:'ster',lbl:'Steroid',o:['None — septic not excluded','Methylpred 40mg','Triamcinolone 40mg','Betamethasone 6mg']},
      {t:'a',id:'addl',lbl:'Notes'},
    ]}],
  },
  digblk: { name:'Digital Nerve Block', ico:'💉', sub:'Finger/toe digital block', risk:'low', tips:'Ring block at base; do NOT use epi; onset 3-5 min',
    secs:[{ ic:'💉', t:'Block', rows:[
      [{t:'i',id:'digit',lbl:'Digit',req:1,ph:'R ring finger'},{t:'s',id:'anes',lbl:'Anesthetic',req:1,o:['Lido 1% plain','Lido 2% plain','Bupivacaine 0.25%']},{t:'i',id:'vol',lbl:'Volume',ph:'2 mL each side'}],
      {t:'s',id:'tech',lbl:'Technique',o:['Ring block — web space','Transthecal','Metacarpal block']},
      {t:'c',id:'conf',lbl:'Confirmation',o:['*Sensation diminished','*No blanching','*Adequate anesthesia']},
      {t:'a',id:'addl',lbl:'Notes'},
    ]}],
  },
  burn: { name:'Burn Assessment & Care', ico:'🔥', sub:'Burn evaluation and wound care', risk:'mod', tips:"Rule of 9s for BSA; Parkland formula 4mL/kg/%BSA; escharotomy for circumferential",
    secs:[{ ic:'🔥', t:'Burn', rows:[
      [{t:'i',id:'mech',lbl:'Mechanism',req:1,ph:'Grease splash, house fire'},{t:'s',id:'degree',lbl:'Degree',req:1,o:['Superficial (1st)','Partial thickness — superficial (2nd)','Partial thickness — deep (2nd)','Full thickness (3rd)','4th degree']}],
      [{t:'i',id:'bsa',lbl:'TBSA %',req:1,ph:'12%'},{t:'i',id:'locations',lbl:'Locations',ph:'R forearm, R hand, anterior chest'}],
      {t:'c',id:'mgmt',lbl:'Management',o:['*IV access — fluid resuscitation','*Parkland formula calculated','*Wound cleaned/debrided','*Silvadene applied','*Non-adherent dressing','*Tetanus updated','*Pain management']},
      {t:'s',id:'dispo',lbl:'Disposition',o:['Outpatient — wound care','Burn center transfer','Admit — IV fluids','Admit — OR debridement']},
      {t:'a',id:'addl',lbl:'Notes'},
    ]}],
  },
  dth: { name:'Death Pronouncement', ico:'📋', sub:'Clinical death note', risk:'low', tips:'Time; exam; all notifications; ME for unwitnessed/trauma',
    secs:[
      { ic:'🕐', t:'Circumstances', rows:[
        [{t:'dt',id:'time',lbl:'Date & Time',req:1},{t:'s',id:'circ',lbl:'Circumstances',req:1,o:['Arrest — resuscitated','Arrest — DNR','Expected — comfort','Traumatic','Natural death']}],
        {t:'c',id:'res',lbl:'Resuscitation',o:['Full','Terminated ACLS','DNR — not initiated','Comfort measures']},
      ]},
      { ic:'🔬', t:'Exam', rows:[{t:'c',id:'exam',lbl:'Findings',req:1,o:["*Pupils fixed/dilated","*No resp effort","*Asystole","*No pulse","*No pain response","*Corneal reflex absent","Rigor mortis","Lividity"]}]},
      { ic:'👥', t:'Notifications', rows:[
        {t:'c',id:'fam',lbl:'Family',req:1,o:['Present','Notified phone','Social work','Chaplain','Unable to reach']},
        {t:'c',id:'notif',lbl:'Required',o:['Attending notified','ME/Coroner','ME declined','OPO','Death cert']},
        {t:'a',id:'addl',lbl:'Notes'},
      ]},
    ],
  },
};

/* ─── CATEGORIES ─────────────────────────────────────────────────── */
const DEFAULT_CATS = [
  { id:'wound',    name:'Wound & Soft Tissue', logo:'wound',    color:'#3b9eff', icon:'🩹', procs:['lac','iand'] },
  { id:'airway',   name:'Airway',              logo:'airway',   color:'#ff6b6b', icon:'🌬️', procs:['intub','cryo','sed'] },
  { id:'vascular', name:'Vascular Access',     logo:'vascular', color:'#9b6dff', icon:'💉', procs:['cl','piv','io'] },
  { id:'thoracic', name:'Thoracic',            logo:'thoracic', color:'#ff9f43', icon:'🫁', procs:['ct'] },
  { id:'cardiac',  name:'Cardiac',             logo:'cardiac',  color:'#e05555', icon:'❤️', procs:['cv'] },
  { id:'procedure',name:'Procedures',          logo:'procedure',color:'#00d4ff', icon:'🩺', procs:['lp','fast','par','arth','foley','ngt'] },
  { id:'ent',      name:'ENT & Eye',           logo:'ent',      color:'#f5c842', icon:'👃', procs:['epi','cantho'] },
  { id:'nerve',    name:'Nerve Blocks',        logo:'nerve',    color:'#3dffa0', icon:'🦵', procs:['digblk'] },
  { id:'trauma',   name:'Trauma & Critical',   logo:'trauma',   color:'#ff6b6b', icon:'⚡', procs:['burn','dth'] },
];

const CAT_COLORS = ['#3b9eff','#00e5c0','#ff6b6b','#ff9f43','#f5c842','#9b6dff','#00d4ff','#3dffa0','#e05555','#00b4d8'];
const CAT_ICONS  = ['🩹','🌬️','💉','🫁','🦴','🩺','⚡','📋','👁️','🦷','🦵','❤️','🧠','🔥','🔵','💧','👃','🔪'];

const RC  = { high:'#ff6b6b', mod:'#ff9f43', low:'#00e5c0' };
const RBG = { high:'rgba(255,107,107,.12)', mod:'rgba(255,159,67,.12)', low:'rgba(0,229,192,.08)' };
const RBD = { high:'rgba(255,107,107,.3)',  mod:'rgba(255,159,67,.3)',  low:'rgba(0,229,192,.2)' };
const RL  = { high:'HIGH RISK', mod:'MOD RISK', low:'' };

/* ─── CSS ─────────────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap');
.epn *,.epn *::before,.epn *::after{box-sizing:border-box;margin:0;padding:0}
.epn{font-family:'DM Sans',sans-serif;font-size:14px;background:#050f1e;color:#e8f0fe;height:100%;width:100%;display:flex;flex-direction:column;overflow:hidden;position:relative}
.epn-top{flex-shrink:0;background:#081628;border-bottom:1px solid #1a3555;z-index:100}
.epn-r1{height:44px;display:flex;align-items:center;padding:0 14px;gap:8px;border-bottom:1px solid rgba(26,53,85,.5)}
.epn-r2{height:44px;display:flex;align-items:center;padding:0 14px;gap:8px;overflow:hidden}
.epn-welcome{font-size:12px;color:#8aaccc;font-weight:500;white-space:nowrap}.epn-welcome strong{color:#e8f0fe}
.epn-vsep{width:1px;height:20px;background:#1a3555;flex-shrink:0}
.epn-stat{display:flex;align-items:center;gap:5px;background:#0e2544;border:1px solid #1a3555;border-radius:6px;padding:3px 10px}
.epn-stat-v{font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:600;color:#e8f0fe}.epn-stat-v.alert{color:#f5c842}
.epn-stat-l{font-size:9px;color:#4a6a8a;text-transform:uppercase;letter-spacing:.04em}
.epn-r1-right{margin-left:auto;display:flex;align-items:center;gap:6px}
.epn-clock{background:#0e2544;border:1px solid #1a3555;border-radius:6px;padding:3px 10px;font-family:'JetBrains Mono',monospace;font-size:11px;color:#8aaccc}
.epn-aion{display:flex;align-items:center;gap:4px;background:rgba(0,229,192,.08);border:1px solid rgba(0,229,192,.3);border-radius:6px;padding:3px 10px;font-size:11px;font-weight:600;color:#00e5c0}
.epn-aion-dot{width:6px;height:6px;border-radius:50%;background:#00e5c0;animation:epnaip 2s ease-in-out infinite}
@keyframes epnaip{0%,100%{box-shadow:0 0 0 0 rgba(0,229,192,.4)}50%{box-shadow:0 0 0 5px rgba(0,229,192,0)}}
.epn-newpt{background:#00e5c0;color:#050f1e;border:none;border-radius:6px;padding:4px 12px;font-size:11px;font-weight:700;cursor:pointer;white-space:nowrap;font-family:'DM Sans',sans-serif}
.epn-ptname{font-family:'Playfair Display',serif;font-size:14px;font-weight:600;color:#e8f0fe;white-space:nowrap}
.epn-ptmeta{font-size:11px;color:#4a6a8a;white-space:nowrap}
.epn-ptcc{font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:600;color:#ff9f43;white-space:nowrap}
.epn-vital{display:flex;align-items:center;gap:3px;font-family:'JetBrains Mono',monospace;font-size:10.5px;white-space:nowrap}
.epn-vital .vl{color:#2e4a6a;font-size:9px}.epn-vital .vv{color:#8aaccc}
.epn-vital .vv.abn{color:#ff6b6b;animation:epngr 2s ease-in-out infinite}
@keyframes epngr{0%,100%{text-shadow:0 0 4px rgba(255,107,107,.4)}50%{text-shadow:0 0 10px rgba(255,107,107,.9)}}
.epn-chtbadge{font-family:'JetBrains Mono',monospace;font-size:10px;background:#0e2544;border:1px solid #1a3555;border-radius:20px;padding:1px 8px;color:#00e5c0;white-space:nowrap}
.epn-sbadge{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:600;padding:2px 8px;border-radius:4px;white-space:nowrap}
.epn-sbadge-m{background:rgba(255,107,107,.15);color:#ff6b6b;border:1px solid rgba(255,107,107,.3)}
.epn-sbadge-r{background:rgba(0,229,192,.1);color:#00e5c0;border:1px solid rgba(0,229,192,.3)}
.epn-acts{margin-left:auto;display:flex;align-items:center;gap:5px}
.epn-body{display:flex;flex:1;overflow:hidden}
.epn-sb{width:210px;flex-shrink:0;background:#081628;border-right:1px solid #1a3555;overflow-y:auto;padding:10px 8px;display:flex;flex-direction:column;gap:1px}
.epn-sb::-webkit-scrollbar{width:4px}.epn-sb::-webkit-scrollbar-thumb{background:#1a3555;border-radius:2px}
.epn-sblbl{font-size:9px;color:#2e4a6a;text-transform:uppercase;letter-spacing:.08em;padding:10px 8px 4px;font-weight:600}
.epn-sblbl:first-child{padding-top:4px}
.epn-sbitem{display:flex;align-items:center;gap:7px;padding:6px 8px;border-radius:6px;cursor:pointer;transition:all .15s;border:1px solid transparent;font-size:12px;color:#8aaccc;user-select:none;text-decoration:none}
.epn-sbitem:hover{background:#0e2544;border-color:#1a3555;color:#e8f0fe}
.epn-sbitem.active{background:rgba(59,158,255,.1);border-color:rgba(59,158,255,.3);color:#3b9eff}
.epn-sbdot{width:6px;height:6px;border-radius:50%;margin-left:auto;flex-shrink:0}
.epn-sbdot.done{background:#00e5c0;box-shadow:0 0 5px rgba(0,229,192,.5)}
.epn-sbdot.partial{background:#ff9f43;box-shadow:0 0 5px rgba(255,159,67,.5)}
.epn-sbdot.empty{background:#1a3555}
.epn-sbdiv{height:1px;background:#1a3555;margin:6px 4px}
.epn-main{flex:1;overflow-y:auto;padding:18px 22px 30px;display:flex;flex-direction:column;gap:14px}
.epn-main::-webkit-scrollbar{width:5px}.epn-main::-webkit-scrollbar-thumb{background:#1a3555;border-radius:3px}
.epn-bot{flex-shrink:0;background:#081628;border-top:1px solid #1a3555;height:50px;display:flex;align-items:center;padding:0 16px;gap:8px}
.epn-step-dots{display:flex;align-items:center;gap:4px;margin:0 auto}
.epn-sdot{width:8px;height:8px;border-radius:50%;transition:all .2s;cursor:pointer;flex-shrink:0}
.epn-sdot.done{background:#00e5c0}.epn-sdot.current{background:#3b9eff;width:10px;height:10px}
.epn-sdot.partial{background:#ff9f43}.epn-sdot.empty{background:#4a6a8a}
.epn-btn{padding:5px 12px;border-radius:6px;font-size:12px;font-weight:500;cursor:pointer;transition:all .15s;border:1px solid #1a3555;background:#0e2544;color:#8aaccc;font-family:'DM Sans',sans-serif;display:inline-flex;align-items:center;gap:5px;white-space:nowrap}
.epn-btn:hover{border-color:#2a4f7a;color:#e8f0fe}.epn-btn:disabled{opacity:.35;pointer-events:none}
.epn-btn-p{background:#00e5c0;color:#050f1e;border:none;font-weight:700;padding:5px 14px;border-radius:6px;font-size:12px;cursor:pointer;display:inline-flex;align-items:center;gap:5px;white-space:nowrap;font-family:'DM Sans',sans-serif}
.epn-btn-p:hover{filter:brightness(1.15)}
.epn-btn-b{background:#3b9eff;color:white;border:none;font-weight:700;padding:5px 14px;border-radius:6px;font-size:12px;cursor:pointer;display:inline-flex;align-items:center;gap:5px;white-space:nowrap;font-family:'DM Sans',sans-serif}
.epn-btn-b:hover{filter:brightness(1.1)}
.epn-btn-coral{background:rgba(255,107,107,.15);color:#ff6b6b;border:1px solid rgba(255,107,107,.3);border-radius:6px;padding:5px 12px;font-size:12px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:5px;white-space:nowrap;font-family:'DM Sans',sans-serif}
.epn-page-title{font-family:'Playfair Display',serif;font-size:20px;font-weight:600;color:#e8f0fe}
.epn-page-sub{font-size:12px;color:#4a6a8a;margin-top:1px}
.epn-cmdbar{position:relative;display:flex;align-items:center;gap:8px;background:#0e2544;border:1px solid #1a3555;border-radius:10px;padding:8px 14px;transition:border-color .2s}
.epn-cmdbar:focus-within{border-color:#3b9eff;box-shadow:0 0 0 3px rgba(59,158,255,.08)}
.epn-cmdinput{flex:1;background:none;border:none;color:#e8f0fe;font-size:13px;font-family:'DM Sans',sans-serif;outline:none}
.epn-cmdinput::placeholder{color:#2e4a6a}
.epn-cmdhint{font-family:'JetBrains Mono',monospace;font-size:10px;color:#2e4a6a;background:#081628;border:1px solid #1a3555;border-radius:4px;padding:1px 6px}
.epn-cmdresults{position:absolute;top:calc(100% + 6px);left:0;right:0;background:#081628;border:1px solid #1a3555;border-radius:10px;max-height:300px;overflow-y:auto;z-index:50;box-shadow:0 12px 40px rgba(0,0,0,.4)}
.epn-cmdresults::-webkit-scrollbar{width:4px}.epn-cmdresults::-webkit-scrollbar-thumb{background:#1a3555;border-radius:2px}
.epn-cmdresult{display:flex;align-items:center;gap:10px;padding:8px 14px;cursor:pointer;border-bottom:1px solid rgba(26,53,85,.3)}
.epn-cmdresult:last-child{border-bottom:none}.epn-cmdresult:hover{background:#0e2544}
.epn-bc{display:flex;align-items:center;gap:6px;font-size:12px;color:#4a6a8a}
.epn-bclink{cursor:pointer;color:#8aaccc;transition:color .15s}.epn-bclink:hover{color:#3b9eff}
.epn-bcsep{color:#2e4a6a}.epn-bccur{color:#e8f0fe;font-weight:500}
.epn-favbar{background:#0b1e36;border:1px solid #1a3555;border-radius:12px;padding:10px 14px;display:flex;align-items:center;gap:8px;overflow-x:auto}
.epn-favbar::-webkit-scrollbar{height:3px}.epn-favbar::-webkit-scrollbar-thumb{background:#1a3555;border-radius:2px}
.epn-favchip{display:flex;align-items:center;gap:5px;padding:5px 10px;border-radius:8px;cursor:pointer;background:#0e2544;border:1px solid #1a3555;transition:all .2s;white-space:nowrap;flex-shrink:0}
.epn-favchip:hover{border-color:#2a4f7a}
.epn-catgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:14px}
.epn-cattile{position:relative;border-radius:14px;cursor:pointer;border:1.5px solid #1a3555;overflow:hidden;transition:all .25s;display:flex;flex-direction:column;align-items:center;padding:20px 10px 14px;gap:8px;background:#0b1e36}
.epn-cattile:hover{border-color:#2a4f7a;transform:translateY(-3px);box-shadow:0 8px 28px rgba(0,0,0,.3)}
.epn-cattile.active{border-color:#3b9eff;box-shadow:0 0 0 1px #3b9eff,0 8px 28px rgba(59,158,255,.15)}
.epn-cattile.add{border-style:dashed;border-color:#2e4a6a;background:transparent}
.epn-cattile.add:hover{border-color:#3b9eff;background:rgba(59,158,255,.04)}
.epn-ctglow{position:absolute;top:-30px;left:50%;transform:translateX(-50%);width:100px;height:60px;border-radius:50%;filter:blur(30px);opacity:.25;pointer-events:none;transition:opacity .3s}
.epn-cattile:hover .epn-ctglow{opacity:.45}
.epn-ctlogo{width:56px;height:56px;border-radius:14px;display:flex;align-items:center;justify-content:center;position:relative;z-index:1;transition:transform .2s}
.epn-cattile:hover .epn-ctlogo{transform:scale(1.08)}
.epn-ctname{font-size:12px;font-weight:600;color:#e8f0fe;text-align:center;line-height:1.3;z-index:1}
.epn-ctcount{font-family:'JetBrains Mono',monospace;font-size:9px;color:#4a6a8a;background:#0e2544;border:1px solid #1a3555;border-radius:10px;padding:1px 7px;z-index:1}
.epn-ctedit{position:absolute;top:6px;right:6px;width:22px;height:22px;border-radius:6px;display:none;align-items:center;justify-content:center;font-size:11px;background:#0e2544;border:1px solid #1a3555;color:#4a6a8a;cursor:pointer;z-index:2}
.epn-cattile:hover .epn-ctedit{display:flex}
.epn-proclist{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px;margin-top:10px}
.epn-procitem{background:#0b1e36;border:1px solid #1a3555;border-radius:10px;padding:10px 12px;cursor:pointer;transition:all .2s;display:flex;align-items:center;gap:10px}
.epn-procitem:hover{border-color:#2a4f7a;background:#0e2544}
.epn-procitem.sel{border-color:#3b9eff;box-shadow:0 0 0 1px #3b9eff}
.epn-starbtn{width:28px;height:28px;border-radius:6px;display:flex;align-items:center;justify-content:center;cursor:pointer;border:1px solid transparent;background:transparent;font-size:15px;transition:all .2s;flex-shrink:0;color:#2e4a6a}
.epn-starbtn:hover{background:rgba(245,200,66,.08);border-color:rgba(245,200,66,.2);color:#f5c842;transform:scale(1.15)}
.epn-starbtn.on{color:#f5c842;text-shadow:0 0 8px rgba(245,200,66,.5)}
@keyframes epnStarPop{0%{transform:scale(1)}50%{transform:scale(1.4)}100%{transform:scale(1)}}
.epn-starbtn.pop{animation:epnStarPop .3s ease}
.epn-fsec{background:#081628;border:1px solid #1a3555;border-radius:10px;overflow:hidden;animation:epnfu .3s ease both}
.epn-fsec-hdr{padding:10px 16px;background:#0e2544;border-bottom:1px solid #1a3555;display:flex;align-items:center;gap:8px}
.epn-fsec-body{padding:14px 16px;display:flex;flex-direction:column;gap:12px}
@keyframes epnfu{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.epn-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.epn-grid-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
.epn-grid-4{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.epn-field{display:flex;flex-direction:column;gap:3px}
.epn-flbl{font-size:9px;color:#4a6a8a;text-transform:uppercase;letter-spacing:.06em;font-weight:500;font-family:'JetBrains Mono',monospace}
.epn-flbl .req{color:#ff6b6b;font-size:8px}
.epn-finput{background:#0e2544;border:1px solid #1a3555;border-radius:6px;padding:7px 10px;color:#e8f0fe;font-family:'DM Sans',sans-serif;font-size:13px;outline:none;width:100%;transition:border-color .15s}
.epn-finput:focus{border-color:#3b9eff}.epn-finput::placeholder{color:#2e4a6a}
.epn-fta{background:#0e2544;border:1px solid #1a3555;border-radius:6px;padding:8px 10px;color:#e8f0fe;font-family:'DM Sans',sans-serif;font-size:13px;outline:none;resize:vertical;min-height:70px;width:100%;line-height:1.5}
.epn-fta:focus{border-color:#3b9eff}.epn-fta::placeholder{color:#2e4a6a}
.epn-fsel{background:#0e2544;border:1px solid #1a3555;border-radius:6px;padding:7px 10px;color:#e8f0fe;font-family:'DM Sans',sans-serif;font-size:13px;outline:none;cursor:pointer;width:100%}
.epn-fsel option{background:#0b1e36}.epn-fsel:focus{border-color:#3b9eff}
.epn-chip{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:12px;cursor:pointer;border:1px solid #1a3555;background:#0e2544;color:#8aaccc;transition:all .15s;user-select:none}
.epn-chip:hover{border-color:#2a4f7a;color:#e8f0fe}
.epn-chip.sel{background:rgba(59,158,255,.15);border-color:#3b9eff;color:#3b9eff}
.epn-tipbox{padding:10px 14px;border-radius:8px;font-size:12px;line-height:1.6;display:flex;align-items:flex-start;gap:8px}
.epn-tipbox.warn{background:rgba(255,107,107,.07);border:1px solid rgba(255,107,107,.25);color:#ff8c96}
.epn-tipbox.info{background:rgba(59,158,255,.06);border:1px solid rgba(59,158,255,.2);color:#8aaccc}
.epn-tipbox.gold{background:rgba(245,200,66,.06);border:1px solid rgba(245,200,66,.2);color:#f5c842}
.epn-noteout{background:#0b1e36;border:1px solid #1a3555;border-radius:10px;overflow:hidden}
.epn-noteout-hdr{padding:9px 16px;background:#0e2544;border-bottom:1px solid #1a3555;display:flex;align-items:center;gap:8px}
.epn-noteout-body{padding:22px 26px;font-family:'JetBrains Mono',monospace;font-size:13px;line-height:1.8;color:#e8f0fe;white-space:pre-wrap;min-height:300px;outline:none}
.epn-divider{height:1px;background:#1a3555;margin:4px 0}
.epn-modal-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(5,15,30,.85);z-index:600;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)}
.epn-modal-box{background:#081628;border:1px solid #1a3555;border-radius:16px;width:520px;max-height:80vh;overflow-y:auto;box-shadow:0 24px 80px rgba(0,0,0,.5);animation:epnfu .3s ease}
.epn-modal-hdr{padding:18px 22px 14px;border-bottom:1px solid #1a3555;display:flex;align-items:center;gap:10px}
.epn-modal-body{padding:18px 22px;display:flex;flex-direction:column;gap:14px}
.epn-color-row{display:flex;gap:8px;flex-wrap:wrap}
.epn-cswatch{width:32px;height:32px;border-radius:8px;cursor:pointer;border:2px solid transparent;transition:all .15s}
.epn-cswatch:hover{transform:scale(1.1)}.epn-cswatch.sel{border-color:#e8f0fe;box-shadow:0 0 0 2px #050f1e,0 0 0 4px #e8f0fe}
.epn-icon-row{display:flex;gap:6px;flex-wrap:wrap}
.epn-iopt{width:40px;height:40px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:20px;cursor:pointer;border:1px solid #1a3555;background:#0e2544;transition:all .15s}
.epn-iopt:hover{border-color:#2a4f7a}.epn-iopt.sel{border-color:#3b9eff;background:rgba(59,158,255,.12)}
.epn-ai-fab{position:fixed;bottom:72px;right:22px;z-index:500;width:52px;height:52px;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#00e5c0,#00b4d8);box-shadow:0 4px 20px rgba(0,229,192,.35);transition:all .3s;animation:epnfabr 3s ease-in-out infinite;font-size:22px;font-weight:700;color:#050f1e}
.epn-ai-fab:hover{transform:scale(1.1)}.epn-ai-fab.open{transform:rotate(45deg);background:linear-gradient(135deg,#ff6b6b,#e05555);animation:none}
@keyframes epnfabr{0%,100%{box-shadow:0 4px 20px rgba(0,229,192,.35),0 0 0 0 rgba(0,229,192,.25)}50%{box-shadow:0 4px 20px rgba(0,229,192,.35),0 0 0 10px rgba(0,229,192,0)}}
.epn-ai-overlay{position:fixed;bottom:136px;right:22px;width:360px;max-height:500px;z-index:499;background:#081628;border:1px solid #1a3555;border-radius:16px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.5);transition:all .3s}
.epn-ai-msgs{flex:1;overflow-y:auto;padding:12px 14px;display:flex;flex-direction:column;gap:8px;min-height:200px;max-height:350px}
.epn-ai-msgs::-webkit-scrollbar{width:3px}.epn-ai-msgs::-webkit-scrollbar-thumb{background:#1a3555;border-radius:2px}
.epn-ai-msg{padding:10px 12px;border-radius:10px;font-size:12px;line-height:1.6;max-width:92%}
.epn-ai-msg.sys{background:#0e2544;color:#4a6a8a;border:1px solid #1a3555;align-self:center;text-align:center;font-size:11px}
.epn-ai-msg.user{background:rgba(59,158,255,.12);border:1px solid rgba(59,158,255,.25);color:#e8f0fe;align-self:flex-end;border-radius:10px 10px 2px 10px}
.epn-ai-msg.bot{background:rgba(0,229,192,.07);border:1px solid rgba(0,229,192,.18);color:#e8f0fe;align-self:flex-start;border-radius:10px 10px 10px 2px}
.epn-ai-input-wrap{padding:10px 14px;border-top:1px solid #1a3555;display:flex;gap:6px;align-items:flex-end;flex-shrink:0}
.epn-ai-input{flex:1;background:#0e2544;border:1px solid #1a3555;border-radius:10px;padding:8px 12px;color:#e8f0fe;font-size:12px;outline:none;resize:none;min-height:38px;max-height:100px;font-family:'DM Sans',sans-serif;line-height:1.5}
.epn-ai-input:focus{border-color:#00e5c0}.epn-ai-input::placeholder{color:#2e4a6a}
.epn-ai-send{width:38px;height:38px;background:#00e5c0;color:#050f1e;border:none;border-radius:10px;font-size:16px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.epn-loader{display:flex;gap:5px;padding:10px;align-self:flex-start}
.epn-loader span{width:6px;height:6px;border-radius:50%;background:#00e5c0;animation:epnbnc 1.2s ease-in-out infinite}
.epn-loader span:nth-child(2){animation-delay:.2s}.epn-loader span:nth-child(3){animation-delay:.4s}
@keyframes epnbnc{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-6px);opacity:1}}
.epn-toast{position:fixed;bottom:64px;left:50%;transform:translateX(-50%);background:#00e5c0;color:#050f1e;padding:8px 18px;border-radius:8px;font-size:12px;font-weight:700;z-index:700;font-family:'DM Sans',sans-serif;transition:opacity .3s;pointer-events:none}
`;

/* ─── FIELD COMPONENT ─────────────────────────────────────────────── */
function FieldInput({ f, value, onChange }) {
  if (f.t === 'tip') {
    return <div className={`epn-tipbox ${f.cls === 'rd' ? 'warn' : 'info'}`}><span>{f.cls === 'rd' ? '⚠️' : '💡'}</span><span>{f.txt}</span></div>;
  }
  return (
    <div className="epn-field">
      <label className="epn-flbl" dangerouslySetInnerHTML={{ __html: f.lbl + (f.req ? ' <span class="req">*</span>' : '') }} />
      {f.t === 'i' && <input className="epn-finput" placeholder={f.ph || ''} value={value || ''} onChange={e => onChange(e.target.value)} />}
      {f.t === 'dt' && <input type="datetime-local" className="epn-finput" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, colorScheme: 'dark' }} value={value || ''} onChange={e => onChange(e.target.value)} />}
      {f.t === 'a' && <textarea className="epn-fta" placeholder={f.ph || ''} value={value || ''} onChange={e => onChange(e.target.value)} />}
      {f.t === 's' && (
        <select className="epn-fsel" value={value || ''} onChange={e => onChange(e.target.value)}>
          <option value="">Select…</option>
          {f.o.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      )}
      {f.t === 'c' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {f.o.map(o => {
            const lbl = o[0] === '*' ? o.slice(1) : o;
            const sel = Array.isArray(value) ? value.includes(lbl) : false;
            return (
              <div key={lbl} className={`epn-chip${sel ? ' sel' : ''}`} onClick={() => {
                const arr = Array.isArray(value) ? value : [];
                onChange(sel ? arr.filter(x => x !== lbl) : [...arr, lbl]);
              }}>{lbl}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FormRow({ row, formData, setFormData }) {
  if (!Array.isArray(row)) {
    return <FieldInput f={row} value={formData[row.id]} onChange={v => setFormData(p => ({ ...p, [row.id]: v }))} />;
  }
  const gridClass = `epn-grid-${Math.min(row.length, 4)}`;
  return (
    <div className={gridClass}>
      {row.map(f => <FieldInput key={f.id || f.txt} f={f} value={formData[f.id]} onChange={v => setFormData(p => ({ ...p, [f.id]: v }))} />)}
    </div>
  );
}

/* ─── MODAL ─────────────────────────────────────────────────────────── */
function Modal({ modal, onClose, categories, setCategories, activeCat, setActiveCat }) {
  const [mcColor, setMcColor] = useState(CAT_COLORS[0]);
  const [mcIcon, setMcIcon] = useState(CAT_ICONS[0]);
  const [mcLogo, setMcLogo] = useState('custom');
  const [mcName, setMcName] = useState('');

  useEffect(() => {
    if (modal?.type === 'editCat') {
      const cat = categories.find(c => c.id === modal.id);
      if (cat) { setMcColor(cat.color); setMcIcon(cat.icon); setMcLogo(cat.logo || 'custom'); setMcName(cat.name); }
    } else {
      setMcColor(CAT_COLORS[0]); setMcIcon(CAT_ICONS[0]); setMcLogo('custom'); setMcName('');
    }
  }, [modal]);

  if (!modal) return null;

  const saveCats = (cats) => {
    setCategories(cats);
    try { localStorage.setItem('notrya_cats3', JSON.stringify(cats)); } catch (e) {}
  };

  if (modal.type === 'newCat' || modal.type === 'editCat') {
    const isEdit = modal.type === 'editCat';
    return (
      <div className="epn-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="epn-modal-box">
          <div className="epn-modal-hdr">
            <span style={{ fontSize: 18 }}>{isEdit ? '✏️' : '📁'}</span>
            <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, fontWeight: 600 }}>{isEdit ? `Edit: ${mcName}` : 'New Category'}</span>
            <button className="epn-btn" style={{ marginLeft: 'auto' }} onClick={onClose}>✕</button>
          </div>
          <div className="epn-modal-body">
            <div className="epn-field"><label className="epn-flbl">Name</label><input className="epn-finput" value={mcName} onChange={e => setMcName(e.target.value)} placeholder="e.g., Cardiac" /></div>
            <div className="epn-field"><label className="epn-flbl">Color</label><div className="epn-color-row">{CAT_COLORS.map(c => <div key={c} className={`epn-cswatch${c === mcColor ? ' sel' : ''}`} style={{ background: c }} onClick={() => setMcColor(c)} />)}</div></div>
            <div className="epn-field"><label className="epn-flbl">Icon</label><div className="epn-icon-row">{CAT_ICONS.map(ic => <div key={ic} className={`epn-iopt${ic === mcIcon ? ' sel' : ''}`} onClick={() => setMcIcon(ic)}>{ic}</div>)}</div></div>
            <div className="epn-field"><label className="epn-flbl">Logo</label><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{Object.keys(LP).map(k => <div key={k} className={`epn-iopt${k === mcLogo ? ' sel' : ''}`} style={{ width: 48, height: 48 }} onClick={() => setMcLogo(k)}><SvgLogo k={k} color="#8aaccc" size={28} /></div>)}</div></div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
              {isEdit && <button className="epn-btn-coral" onClick={() => { saveCats(categories.filter(c => c.id !== modal.id)); if (activeCat === modal.id) setActiveCat(null); onClose(); }}>🗑️ Delete</button>}
              <button className="epn-btn" onClick={onClose}>Cancel</button>
              <button className="epn-btn-p" onClick={() => {
                if (!mcName.trim()) return;
                if (isEdit) {
                  saveCats(categories.map(c => c.id === modal.id ? { ...c, name: mcName, color: mcColor, icon: mcIcon, logo: mcLogo } : c));
                } else {
                  saveCats([...categories, { id: 'c_' + Date.now(), name: mcName, color: mcColor, icon: mcIcon, logo: mcLogo, procs: [] }]);
                }
                onClose();
              }}>💾 {isEdit ? 'Save' : 'Create'}</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (modal.type === 'addProc') {
    const cat = categories.find(c => c.id === modal.catId);
    const avail = Object.keys(P).filter(k => !cat?.procs.includes(k));
    return (
      <div className="epn-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="epn-modal-box">
          <div className="epn-modal-hdr">
            <span style={{ fontSize: 18 }}>➕</span>
            <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, fontWeight: 600 }}>Add to {cat?.name}</span>
            <button className="epn-btn" style={{ marginLeft: 'auto' }} onClick={onClose}>✕</button>
          </div>
          <div className="epn-modal-body">
            {avail.length ? avail.map(k => {
              const p = P[k];
              return (
                <div key={k} className="epn-procitem" onClick={() => {
                  saveCats(categories.map(c => c.id === modal.catId ? { ...c, procs: [...c.procs, k] } : c));
                  onClose();
                }}><span style={{ fontSize: 20 }}>{p.ico}</span><div><div style={{ fontSize: 13, fontWeight: 500, color: '#e8f0fe' }}>{p.name}</div><div style={{ fontSize: 10, color: '#4a6a8a' }}>{p.sub}</div></div><span style={{ marginLeft: 'auto', color: '#00e5c0' }}>+</span></div>
              );
            }) : <div style={{ textAlign: 'center', padding: 24, color: '#4a6a8a' }}>All procedures assigned.</div>}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

/* ─── MAIN COMPONENT ─────────────────────────────────────────────── */
export default function EDProcedureNotes({ embedded = false }) {
  const navigate = useNavigate();

  // Persist categories + favorites
  const [categories, setCategories] = useState(() => {
    try { const s = localStorage.getItem('notrya_cats3'); return s ? JSON.parse(s) : DEFAULT_CATS; } catch (e) { return DEFAULT_CATS; }
  });
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('notrya_favs3') || '[]'); } catch (e) { return []; }
  });

  const [view, setView] = useState('select'); // 'select' | 'document' | 'note'
  const [activeCat, setActiveCat] = useState(null);
  const [selectedProc, setSelectedProc] = useState(null);
  const [formData, setFormData] = useState({});
  const [physician, setPhysician] = useState('');
  const [encounterDate, setEncounterDate] = useState(new Date().toISOString().slice(0, 10));
  const [allergies, setAllergies] = useState('');
  const [generatedNote, setGeneratedNote] = useState('');
  const [generating, setGenerating] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState([{ role: 'sys', text: 'Notrya AI ready. Ask about procedures, billing, or clinical guidance.' }]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [cmdQuery, setCmdQuery] = useState('');
  const [showCmd, setShowCmd] = useState(false);
  const [modal, setModal] = useState(null);
  const [clock, setClock] = useState('');
  const [toast, setToast] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const aiMsgsRef = useRef(null);

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setClock(`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`);
    };
    tick();
    const t = setInterval(tick, 10000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (aiMsgsRef.current) aiMsgsRef.current.scrollTop = aiMsgsRef.current.scrollHeight;
  }, [aiMessages, aiLoading]);

  const showToast = useCallback((msg) => {
    setToast(msg); setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  }, []);

  const saveCats = (cats) => {
    setCategories(cats);
    try { localStorage.setItem('notrya_cats3', JSON.stringify(cats)); } catch (e) {}
  };

  const toggleFav = (k, e) => {
    if (e) { e.stopPropagation(); }
    const newFavs = favorites.includes(k) ? favorites.filter(x => x !== k) : [...favorites, k];
    setFavorites(newFavs);
    try { localStorage.setItem('notrya_favs3', JSON.stringify(newFavs)); } catch (e) {}
  };

  const selectProc = (k) => {
    setSelectedProc(k);
    setFormData({});
    setGeneratedNote('');
    setView('document');
  };

  const genNote = () => {
    if (!selectedProc) return;
    const proc = P[selectedProc];
    const ln = [
      'PROCEDURE NOTE',
      '═══════════════════════════════════════',
      'Patient: New Patient',
      'MRN: PT-4-471-8820 | 67 y/o M',
      `Date: ${encounterDate}`,
      `Attending: ${physician || '[Physician]'}`,
      `Allergies: ${allergies || 'NKDA'}`,
      '',
      `PROCEDURE: ${proc.name.toUpperCase()}`,
      '───────────────────────────────────────',
      '',
    ];
    proc.secs.forEach(s => {
      ln.push(s.t.toUpperCase());
      s.rows.forEach(row => {
        const fields = Array.isArray(row) ? row : [row];
        fields.forEach(f => {
          if (f.t === 'tip') return;
          const v = formData[f.id];
          if (v && f.lbl) ln.push(`${f.lbl}: ${Array.isArray(v) ? v.join(', ') : v}`);
        });
      });
      ln.push('');
    });
    ln.push('COMPLICATIONS: None noted.', '', 'Patient tolerated procedure well.', '', '───────────────────────────────────────', `Signed: ${physician || '[Physician]'}`, `Date/Time: ${new Date().toLocaleString()}`);
    setGeneratedNote(ln.join('\n'));
    setView('note');
  };

  const copyNote = () => {
    navigator.clipboard.writeText(generatedNote).then(() => showToast('Copied!')).catch(() => showToast('Failed'));
  };

  const sendAI = async () => {
    const q = aiInput.trim();
    if (!q || aiLoading) return;
    setAiInput('');
    setAiMessages(prev => [...prev, { role: 'user', text: q }]);
    setAiLoading(true);
    try {
      const ctx = selectedProc ? `Procedure: ${P[selectedProc]?.name}. ` : '';
      const res = await base44.integrations.Core.InvokeLLM({ prompt: `You are Notrya AI, a clinical procedure assistant. Be concise and actionable. ${ctx}Question: ${q}` });
      setAiMessages(prev => [...prev, { role: 'bot', text: typeof res === 'string' ? res : JSON.stringify(res) }]);
    } catch (e) {
      setAiMessages(prev => [...prev, { role: 'sys', text: '⚠ Unable to connect to AI.' }]);
    }
    setAiLoading(false);
  };

  const cmdResults = cmdQuery.trim()
    ? Object.keys(P).filter(k => P[k].name.toLowerCase().includes(cmdQuery.toLowerCase()) || P[k].sub.toLowerCase().includes(cmdQuery.toLowerCase())).slice(0, 8)
    : [];

  const SB_GROUPS = [
    { label: 'Intake', items: [
      { id: 'chart', icon: '📊', label: 'Patient Chart', dot: 'done', link: '/PatientChart' },
      { id: 'demo',  icon: '👤', label: 'Demographics',  dot: 'partial', link: '/NewPatientInput?tab=demo' },
      { id: 'cc',    icon: '💬', label: 'Chief Complaint',dot: 'done',   link: '/NewPatientInput?tab=cc' },
      { id: 'vit',   icon: '📈', label: 'Vitals',         dot: 'empty',  link: '/NewPatientInput?tab=vit' },
    ]},
    { label: 'Documentation', items: [
      { id: 'meds',  icon: '💊', label: 'Meds & PMH',         dot: 'partial', link: '/NewPatientInput?tab=meds' },
      { id: 'ros',   icon: '🔍', label: 'Review of Systems',  dot: 'empty',   link: '/NewPatientInput?tab=ros' },
      { id: 'pe',    icon: '🩺', label: 'Physical Exam',      dot: 'empty',   link: '/NewPatientInput?tab=pe' },
      { id: 'mdm',   icon: '⚖️', label: 'MDM',               dot: 'empty',   link: '/MedicalDecisionMaking' },
    ]},
    { label: 'Disposition', items: [
      { id: 'orders',   icon: '📋', label: 'Orders',      dot: 'empty', link: '/OrderSetBuilder' },
      { id: 'discharge',icon: '🚪', label: 'Discharge',   dot: 'empty', link: '/DischargePlanning' },
      { id: 'erplan',   icon: '🗺️', label: 'ER Plan',    dot: 'empty', link: '/ERPlanBuilder' },
    ]},
    { label: 'Tools', items: [
      { id: 'autocoder',  icon: '🤖', label: 'AutoCoder',  dot: 'empty', link: '/AutoCoder' },
      { id: 'erx',        icon: '💉', label: 'eRx',         dot: 'empty', link: '/ERx' },
      { id: 'procedures', icon: '✂️', label: 'Procedures',  dot: 'partial', link: '/EDProcedureNotes', active: true },
    ]},
  ];
  const allSteps = SB_GROUPS.flatMap(g => g.items);

  return (
    <>
      <style>{CSS}</style>

      {/* FAB + AI Overlay */}
      {aiOpen && (
        <div className="epn-ai-overlay">
          <div style={{ padding:'14px 16px 10px', borderBottom:'1px solid #1a3555', display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:'#00e5c0' }} />
            <span style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:600 }}>Notrya AI</span>
            <span style={{ marginLeft:'auto', fontFamily:"'JetBrains Mono',monospace", fontSize:9, background:'#0e2544', border:'1px solid #1a3555', borderRadius:20, padding:'2px 8px', color:'#4a6a8a' }}>claude</span>
            <button onClick={() => setAiOpen(false)} style={{ width:26, height:26, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:6, border:'1px solid #1a3555', background:'#0e2544', color:'#4a6a8a', cursor:'pointer', fontSize:14 }}>─</button>
          </div>
          <div className="epn-ai-msgs" ref={aiMsgsRef}>
            {aiMessages.map((m, i) => (
              <div key={i} className={`epn-ai-msg ${m.role}`} dangerouslySetInnerHTML={{ __html: m.text.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
            ))}
            {aiLoading && <div className="epn-loader"><span /><span /><span /></div>}
          </div>
          <div className="epn-ai-input-wrap">
            <textarea className="epn-ai-input" value={aiInput} onChange={e => setAiInput(e.target.value)} placeholder="Ask anything…" rows={1} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAI(); } }} />
            <button className="epn-ai-send" onClick={sendAI}>↑</button>
          </div>
        </div>
      )}
      <button className={`epn-ai-fab${aiOpen ? ' open' : ''}`} onClick={() => setAiOpen(!aiOpen)}>{aiOpen ? '✕' : '✦'}</button>

      {/* Toast */}
      {toastVisible && <div className="epn-toast">{toast}</div>}

      {/* Modal */}
      {modal && <Modal modal={modal} onClose={() => setModal(null)} categories={categories} setCategories={saveCats} activeCat={activeCat} setActiveCat={setActiveCat} />}

      <div className="epn" style={embedded ? { position:'relative', width:'100%', height:'100%' } : { position:'fixed', top:88, left:56, right:0, bottom:0 }}>

        {/* TOP BAR — only standalone */}
        {!embedded && (
          <div className="epn-top">
            <div className="epn-r1">
              <span className="epn-welcome">Welcome, <strong>Dr. Skiba</strong></span>
              <div className="epn-vsep" />
              <div className="epn-stat"><span className="epn-stat-v">8</span><span className="epn-stat-l">Active</span></div>
              <div className="epn-stat"><span className="epn-stat-v alert">14</span><span className="epn-stat-l">Pending</span></div>
              <div className="epn-stat"><span className="epn-stat-v">3</span><span className="epn-stat-l">Orders</span></div>
              <div className="epn-r1-right">
                <div className="epn-clock">{clock}</div>
                <div className="epn-aion"><div className="epn-aion-dot" /> AI ON</div>
                <button className="epn-newpt" onClick={() => navigate('/NewPatientInput')}>+ New Patient</button>
              </div>
            </div>
            <div className="epn-r2">
              <span className="epn-chtbadge">PT-4-471-8820</span>
              <span className="epn-ptname">New Patient</span>
              <span className="epn-ptmeta">67 y/o · Male</span>
              <span className="epn-ptcc">CC: Chest Pain</span>
              <div className="epn-vsep" />
              {[['BP','158/94',true],['HR','108',true],['RR','18',false],['SpO₂','93%',false],['T','37.1°C',false],['GCS','15',false]].map(([l,v,abn]) => (
                <div key={l} className="epn-vital"><span className="vl">{l}</span><span className={`vv${abn ? ' abn' : ''}`}>{v}</span></div>
              ))}
              <div className="epn-vsep" />
              <span className="epn-sbadge epn-sbadge-m">MONITORING</span>
              <span className="epn-sbadge epn-sbadge-r">Room 4B</span>
              <div className="epn-acts">
                <button className="epn-btn">📋 Orders</button>
                <button className="epn-btn">📝 SOAP</button>
                <button className="epn-btn-coral">🚪 Dispo</button>
                <button className="epn-btn-p">💾 Save</button>
              </div>
            </div>
          </div>
        )}

        <div className="epn-body">
          {/* SIDEBAR */}
          {!embedded && (
            <aside className="epn-sb">
              {SB_GROUPS.map((grp, gi) => (
                <div key={gi}>
                  {gi > 0 && <div className="epn-sbdiv" />}
                  <div className="epn-sblbl">{grp.label}</div>
                  {grp.items.map(item => (
                    <Link key={item.id} to={item.link} className={`epn-sbitem${item.active ? ' active' : ''}`}>
                      <span style={{ fontSize: 13, width: 18, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
                      <span style={{ flex: 1 }}>{item.label}</span>
                      <span className={`epn-sbdot ${item.dot}`} />
                    </Link>
                  ))}
                </div>
              ))}
            </aside>
          )}

          {/* MAIN CONTENT */}
          <main className="epn-main">
            {/* Header */}
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:20 }}>✂️</span>
              <div>
                <div className="epn-page-title">ED Procedure Notes</div>
                <div className="epn-page-sub">Select a category, then document your procedure</div>
              </div>
              <div style={{ marginLeft:'auto', display:'flex', gap:6 }}>
                <button className="epn-btn" onClick={() => setAiOpen(true)}>🤖 AI Help</button>
              </div>
            </div>

            {/* Search */}
            <div className="epn-cmdbar" onClick={e => e.stopPropagation()}>
              <span style={{ fontSize:14, color:'#4a6a8a' }}>🔍</span>
              <input className="epn-cmdinput" value={cmdQuery} onChange={e => { setCmdQuery(e.target.value); setShowCmd(true); }} onFocus={() => setShowCmd(true)} placeholder="Search procedures… ⌘K" />
              <span className="epn-cmdhint">⌘K</span>
              {showCmd && cmdResults.length > 0 && (
                <div className="epn-cmdresults">
                  {cmdResults.map(k => {
                    const p = P[k];
                    return (
                      <div key={k} className="epn-cmdresult" onClick={() => { selectProc(k); setCmdQuery(''); setShowCmd(false); }}>
                        <span style={{ fontSize:18, width:28, textAlign:'center' }}>{p.ico}</span>
                        <div><div style={{ fontSize:13, color:'#e8f0fe' }}>{p.name}</div><div style={{ fontSize:11, color:'#4a6a8a' }}>{p.sub}</div></div>
                        <div className={`epn-starbtn${favorites.includes(k) ? ' on' : ''}`} onClick={e => toggleFav(k, e)}>{favorites.includes(k) ? '★' : '☆'}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Breadcrumb */}
            <div className="epn-bc">
              <span className="epn-bclink" onClick={() => { setActiveCat(null); setView('select'); }}>Categories</span>
              {activeCat && <>
                <span className="epn-bcsep">›</span>
                <span className="epn-bccur">{categories.find(c => c.id === activeCat)?.name}</span>
              </>}
              {selectedProc && activeCat && <>
                <span className="epn-bcsep">›</span>
                <span className="epn-bccur">{P[selectedProc]?.name}</span>
              </>}
            </div>

            {/* Favorites */}
            {favorites.length > 0 && (
              <div className="epn-favbar">
                <span style={{ fontSize:16, flexShrink:0 }}>⭐</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:'#f5c842', textTransform:'uppercase', letterSpacing:'.08em', flexShrink:0, fontWeight:600 }}>Favorites</span>
                <div style={{ width:1, height:20, background:'#1a3555', flexShrink:0, margin:'0 4px' }} />
                {favorites.map(k => {
                  const p = P[k]; if (!p) return null;
                  return (
                    <div key={k} className="epn-favchip" onClick={() => selectProc(k)}>
                      <span style={{ fontSize:16 }}>{p.ico}</span>
                      <span style={{ fontSize:12, color:'#e8f0fe', fontWeight:500 }}>{p.name}</span>
                      <span style={{ fontSize:12, color:'#f5c842', cursor:'pointer' }} onClick={e => toggleFav(k, e)}>★</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* SELECT VIEW */}
            {view === 'select' && (
              <>
                <div className="epn-catgrid">
                  {categories.map(cat => (
                    <div key={cat.id} className={`epn-cattile${activeCat === cat.id ? ' active' : ''}`} onClick={() => setActiveCat(activeCat === cat.id ? null : cat.id)}>
                      <div className="epn-ctglow" style={{ background: cat.color }} />
                      <div className="epn-ctlogo" style={{ background: cat.color + '18', border: `1px solid ${cat.color}40` }}>
                        <SvgLogo k={cat.logo || 'custom'} color={cat.color} />
                      </div>
                      <div className="epn-ctname">{cat.name}</div>
                      <div className="epn-ctcount">{cat.procs.length}</div>
                      <div className="epn-ctedit" onClick={e => { e.stopPropagation(); setModal({ type:'editCat', id: cat.id }); }}>✏️</div>
                    </div>
                  ))}
                  <div className="epn-cattile add" onClick={() => setModal({ type:'newCat' })}>
                    <div className="epn-ctlogo" style={{ borderRadius:14, background:'rgba(59,158,255,.08)', border:'1px dashed #2e4a6a' }}>
                      <SvgLogo k="custom" color="#4a6a8a" />
                    </div>
                    <div className="epn-ctname" style={{ color:'#4a6a8a' }}>+ New Category</div>
                  </div>
                </div>

                {activeCat && (() => {
                  const cat = categories.find(c => c.id === activeCat);
                  if (!cat) return null;
                  return (
                    <div>
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                        <span style={{ fontSize:28 }}>{cat.icon}</span>
                        <div>
                          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:600 }}>{cat.name}</div>
                          <div style={{ fontSize:11, color:'#4a6a8a' }}>{cat.procs.length} procedure{cat.procs.length !== 1 ? 's' : ''}</div>
                        </div>
                        <button className="epn-btn" style={{ marginLeft:'auto' }} onClick={() => setModal({ type:'addProc', catId: activeCat })}>+ Add Procedure</button>
                        <button className="epn-btn" onClick={() => setModal({ type:'editCat', id: activeCat })}>✏️ Edit</button>
                      </div>
                      {!cat.procs.length ? (
                        <div style={{ textAlign:'center', padding:32, color:'#4a6a8a', border:'1px dashed #1a3555', borderRadius:10 }}>
                          <div style={{ fontSize:28, opacity:.3, marginBottom:8 }}>📂</div>
                          <div>No procedures yet</div>
                          <button className="epn-btn-b" style={{ marginTop:10 }} onClick={() => setModal({ type:'addProc', catId: activeCat })}>+ Add Procedure</button>
                        </div>
                      ) : (
                        <div className="epn-proclist">
                          {cat.procs.map(k => {
                            const p = P[k]; if (!p) return null;
                            const rl = RL[p.risk];
                            const fv = favorites.includes(k);
                            return (
                              <div key={k} className={`epn-procitem${selectedProc === k ? ' sel' : ''}`} onClick={() => selectProc(k)}>
                                <span style={{ fontSize:20 }}>{p.ico}</span>
                                <div>
                                  <div style={{ fontSize:12, fontWeight:500, color:'#e8f0fe', lineHeight:1.3 }}>{p.name}</div>
                                  <div style={{ fontSize:10, color:'#4a6a8a', marginTop:1 }}>{p.sub}</div>
                                </div>
                                {rl && <span style={{ marginLeft:'auto', fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700, padding:'2px 6px', borderRadius:4, background:RBG[p.risk], color:RC[p.risk], border:`1px solid ${RBD[p.risk]}`, flexShrink:0 }}>{rl}</span>}
                                <div className={`epn-starbtn${fv ? ' on' : ''}`} onClick={e => toggleFav(k, e)}>{fv ? '★' : '☆'}</div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </>
            )}

            {/* DOCUMENT VIEW */}
            {view === 'document' && (() => {
              const proc = selectedProc ? P[selectedProc] : null;
              return (
                <>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                    <div>
                      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:600 }}>{proc ? `${proc.ico} ${proc.name}` : 'Procedure Documentation'}</div>
                      <div style={{ fontSize:12, color:'#4a6a8a', marginTop:4 }}>{proc?.sub || 'Select a procedure first'}</div>
                    </div>
                    <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
                      <button className="epn-btn" onClick={() => setView('select')}>← Change</button>
                    </div>
                  </div>

                  {!proc ? (
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, padding:48, textAlign:'center', color:'#4a6a8a', border:'1px dashed #1a3555', borderRadius:10 }}>
                      <div style={{ fontSize:40, opacity:.3 }}>📝</div>
                      <div style={{ fontSize:14, color:'#8aaccc' }}>No procedure selected</div>
                      <button className="epn-btn-b" onClick={() => setView('select')}>← Select Procedure</button>
                    </div>
                  ) : (
                    <>
                      {/* Physician / Encounter */}
                      <div className="epn-fsec">
                        <div className="epn-fsec-hdr">
                          <span>👤</span>
                          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, fontWeight:600, color:'#e8f0fe', letterSpacing:'.05em', textTransform:'uppercase' }}>Physician & Encounter</span>
                          <span style={{ marginLeft:'auto', fontFamily:"'JetBrains Mono',monospace", fontSize:11, padding:'2px 9px', borderRadius:20, background:'rgba(0,229,192,.12)', color:'#00e5c0', border:'1px solid rgba(0,229,192,.3)', fontWeight:600 }}>{proc.ico} {proc.name}</span>
                        </div>
                        <div className="epn-fsec-body">
                          <div className="epn-grid-3">
                            <div className="epn-field"><label className="epn-flbl">Physician</label><input className="epn-finput" value={physician} onChange={e => setPhysician(e.target.value)} placeholder="Dr. Smith, MD" /></div>
                            <div className="epn-field"><label className="epn-flbl">Date</label><input type="date" className="epn-finput" style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, colorScheme:'dark' }} value={encounterDate} onChange={e => setEncounterDate(e.target.value)} /></div>
                            <div className="epn-field"><label className="epn-flbl">Allergies</label><input className="epn-finput" value={allergies} onChange={e => setAllergies(e.target.value)} placeholder="Penicillin" /></div>
                          </div>
                        </div>
                      </div>

                      {/* Procedure sections */}
                      {proc.secs.map((sec, si) => (
                        <div key={si} className="epn-fsec" style={{ animationDelay: `${si * 0.05}s` }}>
                          <div className="epn-fsec-hdr">
                            <span>{sec.ic}</span>
                            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, fontWeight:600, color:'#e8f0fe', letterSpacing:'.05em', textTransform:'uppercase' }}>{sec.t}</span>
                          </div>
                          <div className="epn-fsec-body">
                            {sec.rows.map((row, ri) => <FormRow key={ri} row={row} formData={formData} setFormData={setFormData} />)}
                          </div>
                        </div>
                      ))}

                      {/* Tips */}
                      <div className="epn-tipbox gold">
                        <span>⚠</span>
                        <div>
                          <strong style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, letterSpacing:'.1em', display:'block', marginBottom:4 }}>KEY REMINDERS</strong>
                          <span>{proc.tips}</span>
                        </div>
                      </div>

                      <button className="epn-btn-p" onClick={genNote} style={{ padding:'10px 24px', fontSize:13, fontWeight:700, alignSelf:'flex-start' }} disabled={generating}>
                        {generating ? '⏳ Generating…' : '✦ Generate Procedure Note'}
                      </button>
                    </>
                  )}
                </>
              );
            })()}

            {/* NOTE VIEW */}
            {view === 'note' && (
              <>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:600 }}>Generated Note</span>
                  <span style={{ marginLeft:'auto', fontFamily:"'JetBrains Mono',monospace", fontSize:11, padding:'2px 9px', borderRadius:20, background:'rgba(0,229,192,.12)', color:'#00e5c0', border:'1px solid rgba(0,229,192,.3)', fontWeight:600 }}>Ready</span>
                  <button className="epn-btn" onClick={genNote}>↺ Regen</button>
                  <button className="epn-btn-p" onClick={copyNote} disabled={!generatedNote}>📋 Copy</button>
                </div>

                {!generatedNote ? (
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, padding:48, textAlign:'center', color:'#4a6a8a', border:'1px dashed #1a3555', borderRadius:10 }}>
                    <div style={{ fontSize:40, opacity:.3 }}>📄</div>
                    <div style={{ fontSize:14, color:'#8aaccc' }}>No note generated yet</div>
                    <button className="epn-btn-b" onClick={() => setView('document')}>← Fill Form</button>
                  </div>
                ) : (
                  <>
                    <div className="epn-noteout">
                      <div className="epn-noteout-hdr">
                        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:'#4a6a8a' }}>
                          {selectedProc && P[selectedProc] ? `${P[selectedProc].ico} ${P[selectedProc].name}` : ''} — {encounterDate}
                        </span>
                        <span style={{ marginLeft:'auto', fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:'#2e4a6a' }}>~{generatedNote.split(/\s+/).length} words</span>
                      </div>
                      <div className="epn-noteout-body" contentEditable suppressContentEditableWarning>{generatedNote}</div>
                    </div>
                    <div className="epn-tipbox info"><span>✏️</span><span>Fully editable. Verify all details before signing.</span></div>
                  </>
                )}
              </>
            )}
          </main>
        </div>

        {/* BOTTOM BAR */}
        {!embedded && (
          <div className="epn-bot">
            <button className="epn-btn" onClick={() => {
              const views = ['select','document','note'];
              const i = views.indexOf(view);
              if (i > 0) setView(views[i - 1]);
            }}>← Back</button>
            <div className="epn-step-dots">
              {allSteps.map((s, i) => (
                <div key={i} className={`epn-sdot ${s.active ? 'current' : s.dot}`} title={s.label} />
              ))}
            </div>
            <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ fontSize:12, color:'#e8f0fe', fontWeight:500 }}>Procedures</span>
              <button className="epn-btn-p" style={{ padding:'6px 16px', fontSize:12, fontWeight:700 }} onClick={() => {
                const views = ['select','document','note'];
                const i = views.indexOf(view);
                if (i < views.length - 1) setView(views[i + 1]);
              }}>Next →</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}