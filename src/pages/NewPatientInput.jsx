import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import MDMPanel from "@/components/mdm/MDMPanel";
import ClinicalTabBar from "@/components/shared/ClinicalTabBar";


// ─── DATA ──────────────────────────────────────────────────────────────────────

const CC_LIST = [
  {icon:'💔',label:'Chest Pain',systems:['cardiovascular','respiratory','musculoskeletal','constitutional']},
  {icon:'😮‍💨',label:'Shortness of Breath',systems:['respiratory','cardiovascular','constitutional','heme']},
  {icon:'🤕',label:'Headache',systems:['neuro','heent','cardiovascular','psychiatric']},
  {icon:'🤢',label:'Abdominal Pain',systems:['gi','gu','musculoskeletal','constitutional']},
  {icon:'🤮',label:'Nausea / Vomiting',systems:['gi','neuro','constitutional']},
  {icon:'🌡️',label:'Fever',systems:['constitutional','heent','respiratory','gi','gu','heme']},
  {icon:'😵',label:'Dizziness / Syncope',systems:['cardiovascular','neuro','constitutional','heent']},
  {icon:'🦵',label:'Leg Pain / Swelling',systems:['cardiovascular','musculoskeletal','integumentary','heme']},
  {icon:'🧠',label:'Altered Mental Status',systems:['neuro','psychiatric','constitutional','endocrine']},
  {icon:'💊',label:'Overdose / Intoxication',systems:['neuro','cardiovascular','respiratory','psychiatric','gi']},
  {icon:'🩸',label:'Bleeding',systems:['heme','gi','gu','integumentary','cardiovascular']},
  {icon:'😣',label:'Back Pain',systems:['musculoskeletal','neuro','gu','gi']},
  {icon:'😰',label:'Palpitations',systems:['cardiovascular','endocrine','psychiatric','constitutional']},
  {icon:'🏥',label:'Trauma / Injury',systems:['musculoskeletal','integumentary','neuro','cardiovascular']},
  {icon:'🔥',label:'Rash / Skin Change',systems:['integumentary','constitutional','heme','allergy']},
  {icon:'💧',label:'Urinary Symptoms',systems:['gu','constitutional','gi']},
  {icon:'🫀',label:'Weakness / Fatigue',systems:['neuro','constitutional','endocrine','cardiovascular']},
  {icon:'🤧',label:'Cough / URTI',systems:['respiratory','heent','constitutional']},
  {icon:'🧓',label:'Fall / Collapse',systems:['neuro','cardiovascular','musculoskeletal','constitutional']},
];

const ROS_SYSTEMS = [
  {id:'constitutional',icon:'🌡️',name:'Constitutional',syms:['Fever','Chills','Night sweats','Fatigue','Weight loss','Weight gain','Loss of appetite','Malaise']},
  {id:'heent',icon:'👁️',name:'HEENT',syms:['Headache','Vision changes','Blurred vision','Eye pain','Ear pain','Hearing loss','Nasal congestion','Sore throat','Rhinorrhoea','Tinnitus']},
  {id:'cardiovascular',icon:'❤️',name:'Cardiovascular',syms:['Chest pain','Palpitations','Syncope','Pre-syncope','Peripheral oedema','Orthopnoea','PND','Claudication']},
  {id:'respiratory',icon:'🫁',name:'Respiratory',syms:['Dyspnoea','Cough','Haemoptysis','Wheezing','Pleuritic pain','Sputum production','Stridor','Orthopnoea']},
  {id:'gi',icon:'🫃',name:'Gastrointestinal',syms:['Nausea','Vomiting','Diarrhoea','Constipation','Abdominal pain','Haematemesis','Melaena','Haematochezia','Dysphagia','Heartburn','Bloating']},
  {id:'gu',icon:'🫗',name:'Genitourinary',syms:['Dysuria','Frequency','Urgency','Haematuria','Incontinence','Discharge','Flank pain','Hesitancy','Nocturia']},
  {id:'musculoskeletal',icon:'🦴',name:'Musculoskeletal',syms:['Joint pain','Joint swelling','Stiffness','Myalgia','Back pain','Neck pain','Weakness','Limited ROM']},
  {id:'integumentary',icon:'🩹',name:'Integumentary',syms:['Rash','Pruritus','Jaundice','Skin lesion','Wound','Bruising','Pallor','Cyanosis','Hair loss']},
  {id:'neuro',icon:'🧠',name:'Neurological',syms:['Dizziness','Vertigo','Headache','Focal weakness','Numbness / paraesthesia','Tremor','Seizure','Confusion','Gait disturbance','Visual field loss','Dysarthria']},
  {id:'psychiatric',icon:'🧘',name:'Psychiatric',syms:['Anxiety','Depression','Insomnia','Mood changes','Hallucinations','Suicidal ideation','Cognitive changes']},
  {id:'endocrine',icon:'⚗️',name:'Endocrine',syms:['Polyuria','Polydipsia','Polyphagia','Heat intolerance','Cold intolerance','Excessive sweating']},
  {id:'heme',icon:'🩸',name:'Haematologic / Lymphatic',syms:['Bleeding tendency','Easy bruising','Lymphadenopathy','Recurrent infections','Anaemia symptoms']},
  {id:'allergy',icon:'🌿',name:'Allergic / Immunologic',syms:['Seasonal allergies','Urticaria','Angio-oedema','Drug reactions','Food allergies']},
  {id:'repro',icon:'👶',name:'Reproductive',syms:['Last menstrual period','Pregnancy status','Contraception','Dysmenorrhoea','Vaginal discharge']},
];

const PE_SYSTEMS = [
  {id:'general',icon:'🧍',name:'General Appearance',normal:'Alert and oriented ×4, NAD, well-appearing, well-nourished, no acute distress'},
  {id:'heent_pe',icon:'👁️',name:'HEENT',normal:'Normocephalic, atraumatic. PERRL, EOMI. TMs intact. Oropharynx clear. Moist mucous membranes.'},
  {id:'neck',icon:'🦒',name:'Neck',normal:'Supple, no lymphadenopathy, no JVD, no thyromegaly. Trachea midline. Full ROM.'},
  {id:'cardio_pe',icon:'❤️',name:'Cardiovascular',normal:'Regular rate and rhythm. S1, S2 normal. No murmurs, rubs or gallops. Peripheral pulses 2+ bilaterally. No peripheral oedema.'},
  {id:'resp_pe',icon:'🫁',name:'Respiratory / Chest',normal:'Clear to auscultation bilaterally. No wheezes, rales or rhonchi. Symmetric expansion. Resonant to percussion.'},
  {id:'abdomen',icon:'🫃',name:'Abdomen',normal:'Soft, non-tender, non-distended. Normoactive bowel sounds ×4 quadrants. No organomegaly. No guarding or rigidity.'},
  {id:'extremities',icon:'🦵',name:'Extremities',normal:'No clubbing, cyanosis or oedema. Warm and well-perfused. Cap refill <2s. No calf tenderness.'},
  {id:'neuro_pe',icon:'🧠',name:'Neurological',normal:'A&Ox4. CN II–XII grossly intact. Motor 5/5 all extremities. Sensation intact. Coordination normal. Reflexes 2+ symmetrically.'},
  {id:'skin_pe',icon:'🩹',name:'Skin / Integumentary',normal:'No rashes, lesions or jaundice. No pallor or cyanosis. Skin warm and dry.'},
  {id:'psych_pe',icon:'🧘',name:'Psychiatric / MSE',normal:'Appropriate mood and affect. Normal thought process. No SI/HI. Insight and judgment intact.'},
  {id:'msk_pe',icon:'🦴',name:'Musculoskeletal',normal:'Full ROM all major joints. No joint swelling or effusion. No bony tenderness. Normal muscle bulk and tone.'},
];

const PMH_SYSTEMS = [
  {
    id: 'cardio', icon: '❤️', name: 'Cardiovascular',
    conditions: ['Hypertension','Coronary Artery Disease','Previous MI','Heart Failure','Atrial Fibrillation','Peripheral Vascular Disease','DVT / PE','Cardiomyopathy','Valvular Heart Disease','Aortic Stenosis','Aortic Aneurysm','Pacemaker / ICD'],
  },
  {
    id: 'resp', icon: '🫁', name: 'Respiratory',
    conditions: ['Asthma','COPD','Obstructive Sleep Apnoea','Pulmonary Fibrosis','Pulmonary Hypertension','Previous PE','Bronchiectasis','Lung Cancer','Tuberculosis'],
  },
  {
    id: 'neuro', icon: '🧠', name: 'Neurological',
    conditions: ['Previous Stroke / TIA','Epilepsy','Migraine','Dementia','Parkinson\'s Disease','Multiple Sclerosis','Peripheral Neuropathy','Spinal Cord Injury','Brain Tumour','Myasthenia Gravis'],
  },
  {
    id: 'endo', icon: '⚗️', name: 'Endocrine / Metabolic',
    conditions: ['Type 2 Diabetes','Type 1 Diabetes','Hypothyroidism','Hyperthyroidism','Cushing\'s Syndrome','Addison\'s Disease','Hyperlipidaemia','Obesity','Gout','Metabolic Syndrome'],
  },
  {
    id: 'gi', icon: '🫃', name: 'Gastrointestinal',
    conditions: ['Reflux / GORD','Peptic Ulcer Disease','Inflammatory Bowel Disease','Crohn\'s Disease','Ulcerative Colitis','Chronic Liver Disease','Cirrhosis','Hepatitis B','Hepatitis C','Pancreatitis','Colorectal Cancer','Coeliac Disease'],
  },
  {
    id: 'renal', icon: '🫗', name: 'Renal / Urological',
    conditions: ['CKD','Dialysis','Renal Transplant','Recurrent UTIs','Nephrolithiasis','Prostate Disease','Bladder Cancer','Polycystic Kidney Disease'],
  },
  {
    id: 'msk', icon: '🦴', name: 'Musculoskeletal',
    conditions: ['Osteoarthritis','Rheumatoid Arthritis','Osteoporosis','Gout','Ankylosing Spondylitis','Systemic Lupus Erythematosus','Psoriatic Arthritis','Fibromyalgia','Previous Fracture'],
  },
  {
    id: 'psych', icon: '🧘', name: 'Psychiatric',
    conditions: ['Depression','Anxiety','Bipolar Disorder','Schizophrenia','PTSD','ADHD','Eating Disorder','Substance Use Disorder','Alcohol Use Disorder','Insomnia'],
  },
  {
    id: 'haem', icon: '🩸', name: 'Haematologic / Oncologic',
    conditions: ['Anaemia','Iron Deficiency','Sickle Cell Disease','Thalassaemia','Haemophilia','Leukaemia','Lymphoma','Myeloma','Previous Cancer','HIV/AIDS','Immunodeficiency'],
  },
  {
    id: 'other', icon: '🏥', name: 'Other',
    conditions: ['Arthritis','Chronic Pain','Thyroid Cancer','Skin Cancer','Allergic Rhinitis','Eczema / Atopic Dermatitis','Psoriasis','Chronic Kidney Disease','Previous Surgery (other)','Transplant'],
  },
];

const VITAL_DEFS = [
  {id:'bp',icon:'🫀',label:'Blood Pressure',unit:'mmHg',ph:'120/80',lo:null,hi:null,isText:true},
  {id:'hr',icon:'💓',label:'Heart Rate',unit:'bpm',ph:'60–100',lo:50,hi:100},
  {id:'rr',icon:'🌬️',label:'Resp Rate',unit:'breaths/min',ph:'12–20',lo:12,hi:20},
  {id:'spo2',icon:'🫧',label:'SpO₂',unit:'%',ph:'94–100',lo:94,hi:null},
  {id:'temp',icon:'🌡️',label:'Temperature',unit:'°C',ph:'36.5–37.5',lo:36.0,hi:37.8},
  {id:'gcs',icon:'🧠',label:'GCS',unit:'/15',ph:'15',lo:14,hi:null},
];

const TABS = ['demo','cc','vit','meds','ros','pe','sum','mdm'];

// ─── CSS ────────────────────────────────────────────────────────────────────────
const CSS = `
.npi-root {
  --bg:#050f1e;--bg-panel:#081628;--bg-card:#0b1e36;--bg-up:#0e2544;
  --border:#1a3555;--border-hi:#2a4f7a;
  --blue:#3b9eff;--cyan:#00d4ff;--teal:#00e5c0;--gold:#f5c842;
  --purple:#9b6dff;--coral:#ff6b6b;--green:#3dffa0;--orange:#ff9f43;
  --txt:#e8f0fe;--txt2:#8aaccc;--txt3:#4a6a8a;--txt4:#2e4a6a;
  background:var(--bg);color:var(--txt);
  font-family:'DM Sans',sans-serif;font-size:13px;
  display:flex;flex-direction:column;overflow:hidden;
  height:100vh;margin-left:72px;
}
.npi-root * { box-sizing:border-box; }
.npi-root input, .npi-root select, .npi-root textarea { font-family:'DM Sans',sans-serif; }

/* NAVBAR */
.npi-nav{height:44px;background:#040d1a;border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 16px;gap:10px;flex-shrink:0}
.npi-logo{font-family:'Playfair Display',serif;font-size:17px;font-weight:700;color:var(--txt)}
.npi-ndiv{width:1px;height:16px;background:var(--border)}
.npi-ntitle{font-size:12px;color:var(--txt2);font-style:italic;font-family:'DM Sans',sans-serif}
.npi-nav-right{margin-left:auto;display:flex;align-items:center;gap:7px}
.npi-nav-btn{height:30px;padding:0 13px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s;display:flex;align-items:center;gap:5px}
.npi-nav-btn.new{background:#0a2040;border:1px solid var(--blue);color:var(--blue)}
.npi-nav-btn.new:hover{background:#0e2a55}
.npi-nav-btn.kb{background:#0a2535;border:1px solid rgba(0,212,255,.3);color:var(--cyan)}
.npi-nav-btn.kb:hover{background:#0e3040}
.npi-save-btn{height:30px;padding:0 14px;background:var(--teal);border:none;border-radius:6px;color:#050f1e;font-size:12px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s;display:flex;align-items:center;gap:5px}
.npi-save-btn:hover{background:#00ffd0}
.npi-avatar{width:30px;height:30px;border-radius:50%;background:#0a2040;border:1.5px solid var(--border-hi);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:var(--blue);cursor:pointer;flex-shrink:0}

/* VITALS BAR */
.npi-vbar{height:36px;background:#060f1c;border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 12px;gap:6px;overflow-x:auto;flex-shrink:0}
.npi-vbar::-webkit-scrollbar{display:none}
.npi-vchip{display:flex;align-items:center;gap:5px;background:var(--bg-card);border:1px solid var(--border);border-radius:5px;padding:2px 8px;flex-shrink:0}
.npi-vl{font-size:9px;color:var(--txt3);text-transform:uppercase;letter-spacing:.5px;font-family:'JetBrains Mono',monospace}
.npi-vv{font-size:12px;font-weight:600;color:var(--txt);font-family:'JetBrains Mono',monospace}
.npi-vv.abn{color:var(--coral)}
.npi-vv.lo{color:var(--blue)}
.npi-vsep{width:1px;height:18px;background:var(--border);flex-shrink:0}
.npi-pt-chip{display:flex;align-items:center;gap:6px;background:#0a1e35;border:1px solid var(--border-hi);border-radius:5px;padding:2px 9px;flex-shrink:0}
.npi-pt-name{font-family:'Playfair Display',serif;font-size:11px;color:var(--txt)}
.npi-pt-mrn{font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--txt3)}
.npi-prog-wrap{flex:1;max-width:180px;margin-left:auto;margin-right:6px}
.npi-prog-label{font-size:9px;color:var(--txt3);margin-bottom:2px;display:flex;justify-content:space-between}
.npi-prog-track{height:4px;background:var(--bg-up);border-radius:2px;overflow:hidden}
.npi-prog-fill{height:100%;background:linear-gradient(90deg,var(--teal),var(--blue));border-radius:2px;transition:width .4s ease}

/* LAYOUT */
.npi-layout{display:flex;flex:1;overflow:hidden}

/* SIDEBAR */
.npi-sb{width:210px;flex-shrink:0;background:#060e1c;border-right:1px solid var(--border);overflow-y:auto;padding:10px 0}
.npi-sb::-webkit-scrollbar{width:3px}
.npi-sb::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px}
.npi-sb-head{font-size:9px;text-transform:uppercase;letter-spacing:1px;color:var(--txt4);padding:5px 12px 3px}
.npi-sb-item{display:flex;align-items:center;gap:7px;padding:7px 12px;cursor:pointer;transition:background .15s;border-left:2px solid transparent;font-size:12px;color:var(--txt2)}
.npi-sb-item:hover{background:var(--bg-card);color:var(--txt)}
.npi-sb-item.active{background:#0a2040;border-left-color:var(--blue);color:var(--blue);font-weight:500}
.npi-sb-badge{font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:600;padding:1px 5px;border-radius:10px;background:var(--bg-up);color:var(--txt3)}
.npi-sb-badge.ok{background:#062020;color:var(--teal)}
.npi-sb-badge.warn{background:#2e0d0d;color:var(--coral)}
.npi-sb-badge.info{background:#0a2040;color:var(--blue)}
.npi-pt-summary{margin:8px;background:var(--bg-card);border:1px solid var(--border);border-radius:8px;padding:9px 11px}
.npi-pts-name{font-family:'Playfair Display',serif;font-size:12px;font-weight:600;color:var(--txt);margin-bottom:2px}
.npi-pts-meta{font-size:10px;color:var(--txt2);margin-bottom:5px}
.npi-pts-cc-label{font-size:9px;color:var(--txt3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px}
.npi-pts-cc-val{font-size:11px;color:var(--orange);font-style:italic;margin-bottom:6px}
.npi-pts-step{display:flex;align-items:center;gap:5px;padding:2px 0}
.npi-step-dot{width:7px;height:7px;border-radius:50%;background:var(--bg-up);border:1.5px solid var(--border);flex-shrink:0;transition:all .3s}
.npi-step-dot.done{background:var(--teal);border-color:var(--teal)}
.npi-step-dot.partial{background:var(--orange);border-color:var(--orange)}
.npi-step-label{font-size:10px;color:var(--txt3)}

/* MAIN */
.npi-main{flex:1;overflow-y:auto;padding:16px 18px 100px;min-width:0}
.npi-main::-webkit-scrollbar{width:4px}
.npi-main::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px}

/* PANELS */
.npi-panel{display:none;animation:npi-fadeup .22s ease}
.npi-panel.active{display:block}
@keyframes npi-fadeup{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}

/* FORM ELEMENTS */
.npi-sec-title{font-family:'Playfair Display',serif;font-size:17px;font-weight:600;color:var(--txt);margin-bottom:3px}
.npi-sec-sub{font-size:11px;color:var(--txt3);margin-bottom:14px}
.npi-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px}
.npi-grid-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:14px}
.npi-grid-auto{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:12px;margin-bottom:14px}
.npi-field{display:flex;flex-direction:column;gap:3px}
.npi-label{font-size:10px;color:var(--txt3);text-transform:uppercase;letter-spacing:.5px;font-weight:600}
.npi-label .opt{color:var(--txt4);font-weight:400;text-transform:none;letter-spacing:0}
.npi-input{height:35px;background:var(--bg-card);border:1.5px solid var(--border);border-radius:8px;padding:0 10px;color:var(--txt);font-size:13px;outline:none;transition:all .2s;width:100%}
.npi-input:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(59,158,255,.1)}
.npi-input::placeholder{color:var(--txt4)}
.npi-select{height:35px;background:var(--bg-card);border:1.5px solid var(--border);border-radius:8px;padding:0 10px;color:var(--txt);font-size:13px;outline:none;cursor:pointer;width:100%;appearance:none;transition:border-color .2s}
.npi-select:focus{border-color:var(--blue)}
.npi-textarea{background:var(--bg-card);border:1.5px solid var(--border);border-radius:8px;padding:7px 10px;color:var(--txt);font-size:13px;outline:none;resize:vertical;width:100%;min-height:68px;transition:border-color .2s;line-height:1.5}
.npi-textarea:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(59,158,255,.1)}
.npi-textarea::placeholder{color:var(--txt4)}
.npi-hdiv{height:1px;background:var(--border);margin:16px 0}
.npi-hint{font-size:11px;color:var(--txt2);padding:6px 10px;background:var(--bg-card);border:1px solid var(--border);border-radius:5px;border-left:3px solid var(--blue);margin-bottom:12px}

/* PARSE BOX */
.npi-parse-box{background:linear-gradient(135deg,#081628 0%,#0a1e38 100%);border:1.5px solid var(--border-hi);border-radius:12px;padding:14px 16px;margin-bottom:18px;position:relative;overflow:hidden}
.npi-parse-title{font-size:12px;font-weight:600;color:var(--teal);margin-bottom:3px}
.npi-parse-sub{font-size:11px;color:var(--txt3);margin-bottom:8px}
.npi-parse-btn{margin-top:8px;height:32px;padding:0 14px;background:#052520;border:1.5px solid var(--teal);border-radius:7px;color:var(--teal);font-size:12px;font-weight:600;cursor:pointer;transition:all .2s;font-family:'DM Sans',sans-serif}
.npi-parse-btn:hover{background:#0a3530}
.npi-parse-btn:disabled{opacity:.5;cursor:wait}

/* CC GRID */
.npi-cc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:7px;margin-bottom:14px}
.npi-cc-btn{padding:8px 10px;background:var(--bg-card);border:1.5px solid var(--border);border-radius:8px;color:var(--txt2);font-size:11px;cursor:pointer;transition:all .18s;text-align:left;display:flex;flex-direction:column;gap:3px}
.npi-cc-btn:hover{border-color:var(--border-hi);color:var(--txt);background:var(--bg-up)}
.npi-cc-btn.selected{background:#0a2040;border-color:var(--blue);color:var(--blue)}
.npi-cc-icon{font-size:17px}
.npi-cc-label{font-size:11px;font-weight:500;line-height:1.2}

/* VITALS GRID */
.npi-vitals-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;margin-bottom:16px}
.npi-vit-field{background:var(--bg-card);border:1.5px solid var(--border);border-radius:8px;padding:10px 12px;transition:all .2s;position:relative}
.npi-vit-field:focus-within{border-color:var(--blue);box-shadow:0 0 0 3px rgba(59,158,255,.1)}
.npi-vit-field.abn-field{border-color:var(--coral)!important;box-shadow:0 0 0 3px rgba(255,107,107,.1)!important}
.npi-vit-field.lo-field{border-color:var(--blue)!important}
.npi-vit-icon{font-size:15px;margin-bottom:3px}
.npi-vit-label-txt{font-size:9px;color:var(--txt3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px}
.npi-vit-input{width:100%;background:transparent;border:none;outline:none;font-family:'JetBrains Mono',monospace;font-size:16px;font-weight:600;color:var(--txt)}
.npi-vit-input::placeholder{color:var(--txt4);font-size:13px;font-weight:400}
.npi-vit-unit{font-size:9px;color:var(--txt3);margin-top:2px}
.npi-vit-status{position:absolute;top:7px;right:7px;width:7px;height:7px;border-radius:50%;background:var(--border)}
.npi-vit-status.abn{background:var(--coral)}
.npi-vit-status.lo{background:var(--blue)}
.npi-vit-status.ok{background:var(--teal)}

/* MED TAGS */
.npi-med-tags{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:6px;min-height:34px;background:var(--bg-card);border:1.5px solid var(--border);border-radius:8px;padding:5px 9px;align-items:center;cursor:text;transition:border-color .2s}
.npi-med-tags:focus-within{border-color:var(--cyan)}
.npi-med-tag{display:flex;align-items:center;gap:4px;background:#052535;border:1px solid rgba(0,212,255,.25);border-radius:4px;padding:2px 7px;font-size:11px;color:var(--cyan);flex-shrink:0}
.npi-allergy-tag{background:#1a0808;border-color:rgba(255,107,107,.3);color:var(--coral)}
.npi-med-tag-x{cursor:pointer;color:var(--txt3);font-size:11px;transition:color .15s}
.npi-med-tag-x:hover{color:var(--coral)}
.npi-med-tag-input{border:none;outline:none;background:transparent;color:var(--txt);font-size:12px;min-width:80px;flex:1}
.npi-med-tag-input::placeholder{color:var(--txt4)}
.npi-med-hint{font-size:10px;color:var(--txt3);margin-bottom:10px}
.npi-quick-med{color:var(--cyan);cursor:pointer;margin-right:2px}
.npi-quick-med:hover{text-decoration:underline}

/* PMH SYSTEMS */
.npi-pmh-systems{display:flex;flex-direction:column;gap:6px;margin-bottom:12px}
.npi-pmh-sys{background:var(--bg-card);border:1.5px solid var(--border);border-radius:10px;overflow:hidden;transition:border-color .2s}
.npi-pmh-sys.has-sel{border-color:var(--blue)}
.npi-pmh-sys-hdr{display:flex;align-items:center;gap:8px;padding:8px 12px;cursor:pointer;user-select:none;transition:background .15s}
.npi-pmh-sys-hdr:hover{background:var(--bg-up)}
.npi-pmh-sys-ico{font-size:16px;flex-shrink:0}
.npi-pmh-sys-name{font-size:12px;font-weight:600;color:var(--txt);flex:1}
.npi-pmh-sys-count{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:600;padding:1px 7px;border-radius:10px;background:#0a2040;color:var(--blue);min-width:20px;text-align:center}
.npi-pmh-sys-count.zero{background:var(--bg-up);color:var(--txt4)}
.npi-pmh-sys-chevron{font-size:11px;color:var(--txt3);transition:transform .2s;flex-shrink:0}
.npi-pmh-sys-chevron.open{transform:rotate(90deg)}
.npi-pmh-sys-body{padding:8px 12px 10px;border-top:1px solid var(--border);display:none;flex-wrap:wrap;gap:5px}
.npi-pmh-sys-body.open{display:flex}
.npi-pmh-chip{padding:4px 10px;border-radius:5px;border:1.5px solid var(--border);background:transparent;color:var(--txt3);font-size:11px;cursor:pointer;transition:all .18s;user-select:none}
.npi-pmh-chip:hover{border-color:var(--border-hi);color:var(--txt2)}
.npi-pmh-chip.sel{background:#0a2040;border-color:var(--blue);color:var(--blue);font-weight:500}
.npi-pmh-chip.active-pmh{background:#062020;border-color:var(--teal);color:var(--teal)}

/* ROS */
.npi-ros-toolbar{display:flex;align-items:center;gap:7px;margin-bottom:12px;flex-wrap:wrap}
.npi-ros-tool-btn{padding:5px 12px;border-radius:5px;font-size:11px;cursor:pointer;transition:all .18s;font-family:'DM Sans',sans-serif;border:1.5px solid var(--border);background:transparent;color:var(--txt2)}
.npi-ros-tool-btn.teal{border-color:rgba(0,229,192,.4);color:var(--teal);background:#052520}
.npi-ros-tool-btn.red{border-color:rgba(255,107,107,.4);color:var(--coral);background:#1a0808}
.npi-ros-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px;margin-bottom:18px}
.npi-ros-card{background:var(--bg-card);border:1.5px solid var(--border);border-radius:12px;padding:12px 14px;transition:all .2s;cursor:pointer;user-select:none;position:relative;overflow:hidden}
.npi-ros-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:var(--bg-up);transition:background .2s}
.npi-ros-card.s1{border-color:rgba(0,229,192,.35);background:#051e18}
.npi-ros-card.s1::before{background:var(--teal)}
.npi-ros-card.s2{border-color:rgba(255,107,107,.35);background:#1a0808}
.npi-ros-card.s2::before{background:var(--coral)}
.npi-ros-card-header{display:flex;align-items:center;gap:7px;margin-bottom:7px}
.npi-ros-icon{font-size:16px}
.npi-ros-sys-name{font-size:12px;font-weight:600;color:var(--txt);flex:1}
.npi-ros-state-btns{display:flex;gap:3px}
.npi-rsb{width:24px;height:20px;border-radius:4px;border:1px solid var(--border);background:transparent;cursor:pointer;font-size:11px;transition:all .15s;display:flex;align-items:center;justify-content:center}
.npi-rsb.norm{border-color:rgba(0,229,192,.4);color:var(--teal)}
.npi-rsb.norm.active-btn{background:#062020;border-color:var(--teal)}
.npi-rsb.abn{border-color:rgba(255,107,107,.4);color:var(--coral)}
.npi-rsb.abn.active-btn{background:#1a0808;border-color:var(--coral)}
.npi-rsb.na{border-color:var(--border);color:var(--txt4)}
.npi-rsb.na.active-btn{background:var(--bg-up);color:var(--txt3)}
.npi-ros-norm-text{font-size:10px;color:var(--teal);margin-top:5px}
.npi-ros-symptoms{display:flex;flex-wrap:wrap;gap:4px;margin-top:7px}
.npi-ros-sym-chip{padding:2px 7px;border-radius:4px;font-size:10px;border:1px solid var(--border);color:var(--txt3);cursor:pointer;transition:all .15s}
.npi-ros-sym-chip:hover{border-color:var(--border-hi);color:var(--txt2)}
.npi-ros-sym-chip.sel-sym{background:#1a0808;border-color:var(--coral);color:var(--coral)}
.npi-ros-abn-wrap{margin-top:7px;display:none}
.npi-ros-abn-wrap.open{display:block}
.npi-ros-abn-input{width:100%;background:rgba(255,107,107,.06);border:1px solid rgba(255,107,107,.25);border-radius:5px;padding:5px 8px;color:var(--txt);font-size:11px;font-family:'DM Sans',sans-serif;outline:none;resize:none;min-height:48px;line-height:1.4}
.npi-ros-abn-input:focus{border-color:rgba(255,107,107,.5)}

/* PE */
.npi-pe-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px;margin-bottom:18px}
.npi-pe-card{background:var(--bg-card);border:1.5px solid var(--border);border-radius:12px;padding:12px 14px;transition:all .2s;position:relative;overflow:hidden}
.npi-pe-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:var(--bg-up);transition:background .2s}
.npi-pe-card.s1{border-color:rgba(0,229,192,.35);background:#051e18}
.npi-pe-card.s1::before{background:var(--teal)}
.npi-pe-card.s2{border-color:rgba(255,107,107,.35);background:#1a0808}
.npi-pe-card.s2::before{background:var(--coral)}
.npi-pe-card-header{display:flex;align-items:center;gap:7px;margin-bottom:7px}
.npi-pe-normal-preview{font-size:10px;color:rgba(0,229,192,.7);line-height:1.5;margin-top:2px;font-style:italic;display:none}
.npi-pe-card.s1 .npi-pe-normal-preview{display:block}
.npi-pe-findings-wrap{margin-top:7px;display:none}
.npi-pe-findings-wrap.open{display:block}
.npi-pe-findings{width:100%;background:rgba(255,107,107,.06);border:1px solid rgba(255,107,107,.25);border-radius:5px;padding:5px 8px;color:var(--txt);font-size:11px;font-family:'DM Sans',sans-serif;outline:none;resize:none;min-height:55px;line-height:1.5}
.npi-pe-findings:focus{border-color:rgba(255,107,107,.5)}

/* SUMMARY */
.npi-sum-block{background:var(--bg-card);border:1.5px solid var(--border);border-radius:12px;padding:13px 15px;margin-bottom:10px}
.npi-sum-block-title{font-family:'Playfair Display',serif;font-size:14px;font-weight:600;color:var(--txt);margin-bottom:7px;display:flex;align-items:center;gap:7px}
.npi-sum-table{width:100%;border-collapse:collapse}
.npi-sum-table td{padding:4px 0;font-size:12px;border-bottom:1px solid rgba(26,53,85,.5);vertical-align:top}
.npi-sum-table td:first-child{color:var(--txt3);width:38%;padding-right:10px;font-size:11px}
.npi-sum-table td:last-child{color:var(--txt)}
.npi-sum-table tr:last-child td{border-bottom:none}
.npi-ros-item{display:inline-flex;align-items:center;gap:3px;padding:2px 6px;border-radius:3px;font-size:10px;font-weight:600;margin:2px}
.npi-ros-item.norm{background:#062020;color:var(--teal)}
.npi-ros-item.abn{background:#1a0808;color:var(--coral)}
.npi-sum-btns{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}
.npi-sum-copy-btn{height:34px;padding:0 15px;background:var(--bg-up);border:1px solid var(--border);border-radius:8px;color:var(--txt2);font-size:12px;cursor:pointer;transition:all .2s;font-family:'DM Sans',sans-serif}
.npi-sum-copy-btn:hover{border-color:var(--teal);color:var(--teal)}
.npi-sum-generate-btn{height:34px;padding:0 16px;background:var(--teal);border:none;border-radius:8px;color:#050f1e;font-size:12px;font-weight:700;cursor:pointer;transition:all .2s;font-family:'DM Sans',sans-serif}
.npi-sum-generate-btn:hover{background:#00ffd0}
.npi-sum-studio-btn{height:34px;padding:0 16px;background:#0a2040;border:1px solid var(--blue);border-radius:8px;color:var(--blue);font-size:12px;font-weight:700;cursor:pointer;transition:all .2s;font-family:'DM Sans',sans-serif}
.npi-sum-studio-btn:hover{background:#0e2a55}

/* AI PANEL */
.npi-ai-panel{width:280px;flex-shrink:0;background:#060e1c;border-left:1px solid var(--border);display:flex;flex-direction:column;overflow:hidden}
.npi-ai-header{padding:11px 13px 9px;border-bottom:1px solid var(--border);background:#040d1a;flex-shrink:0}
.npi-ai-hrow{display:flex;align-items:center;gap:7px;margin-bottom:7px}
.npi-ai-dot{width:7px;height:7px;border-radius:50%;background:var(--teal);animation:npi-pulse 2s infinite}
@keyframes npi-pulse{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(0,229,192,.4)}50%{opacity:.8;box-shadow:0 0 0 4px rgba(0,229,192,0)}}
.npi-ai-title{font-size:12px;font-weight:600;color:var(--txt);flex:1}
.npi-ai-model{font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--txt4);background:var(--bg-up);padding:2px 6px;border-radius:3px}
.npi-ai-qbtns{display:flex;flex-wrap:wrap;gap:4px}
.npi-ai-qbtn{padding:3px 8px;font-size:10px;background:var(--bg-up);border:1px solid var(--border);border-radius:5px;color:var(--txt3);cursor:pointer;transition:all .15s;font-family:'DM Sans',sans-serif}
.npi-ai-qbtn:hover{border-color:var(--teal);color:var(--teal)}
.npi-ai-chat{flex:1;padding:11px 13px;overflow-y:auto}
.npi-ai-chat::-webkit-scrollbar{width:3px}
.npi-ai-chat::-webkit-scrollbar-thumb{background:var(--border)}
.npi-ai-msg{padding:8px 10px;border-radius:8px;margin-bottom:7px;font-size:11.5px;line-height:1.6}
.npi-ai-msg.sys{background:var(--bg-up);border:1px solid var(--border);color:var(--txt2)}
.npi-ai-msg.user{background:#0a2040;border:1px solid rgba(59,158,255,.2);color:var(--txt);text-align:right}
.npi-ai-msg.bot{background:#062020;border:1px solid rgba(0,229,192,.15);color:var(--txt2)}
.npi-ai-msg.loading{display:flex;gap:4px;align-items:center;background:var(--bg-up);border:1px solid var(--border);padding:11px}
.npi-ai-lbl{font-size:9px;text-transform:uppercase;letter-spacing:.6px;color:var(--teal);margin-bottom:3px;font-weight:600}
.npi-tdot{width:6px;height:6px;border-radius:50%;background:var(--teal);animation:npi-bounce 1.2s infinite}
.npi-tdot:nth-child(2){animation-delay:.2s}
.npi-tdot:nth-child(3){animation-delay:.4s}
@keyframes npi-bounce{0%,80%,100%{transform:scale(.6);opacity:.5}40%{transform:scale(1);opacity:1}}
.npi-ai-input-wrap{padding:9px 13px;border-top:1px solid var(--border);flex-shrink:0}
.npi-ai-row{display:flex;gap:6px}
.npi-ai-input{flex:1;height:33px;background:var(--bg-up);border:1px solid var(--border);border-radius:7px;padding:0 9px;color:var(--txt);font-size:12px;font-family:'DM Sans',sans-serif;outline:none;transition:border-color .2s}
.npi-ai-input:focus{border-color:var(--teal)}
.npi-ai-input::placeholder{color:var(--txt4)}
.npi-ai-send{width:33px;height:33px;background:#062020;border:1px solid rgba(0,229,192,.3);border-radius:7px;color:var(--teal);font-size:14px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s}
.npi-ai-send:hover{background:#0a3030}

/* BOTTOM NAV */
.npi-bnav{position:sticky;bottom:0;background:rgba(4,13,26,.96);backdrop-filter:blur(12px);border-top:1px solid var(--border);flex-shrink:0;z-index:50;padding:7px 16px 8px;display:flex;align-items:center;justify-content:center;gap:6px}
.npi-bnav-tabs{display:flex;align-items:center;gap:2px;background:#060f1e;border:1px solid var(--border);border-radius:12px;padding:3px;overflow-x:auto;max-width:100%}
.npi-bnav-tabs::-webkit-scrollbar{display:none}
.npi-btab{display:flex;align-items:center;gap:5px;padding:5px 11px;border-radius:9px;border:none;background:transparent;color:var(--txt3);font-size:11px;font-family:'DM Sans',sans-serif;cursor:pointer;transition:all .18s;white-space:nowrap;flex-shrink:0;font-weight:500}
.npi-btab:hover{background:var(--bg-up);color:var(--txt2)}
.npi-btab.active{background:linear-gradient(135deg,#0a2040,#0d2a52);color:var(--blue);font-weight:600;box-shadow:0 1px 6px rgba(59,158,255,.2)}
.npi-btab-icon{font-size:13px;line-height:1}
.npi-bnav-divider{width:1px;height:22px;background:var(--border);margin:0 3px;flex-shrink:0}
.npi-btab-er{color:var(--teal)!important}
.npi-btab-er:hover{background:rgba(0,229,192,.08)!important;color:var(--teal)!important}
.npi-btab-rx{color:var(--blue)!important}
.npi-btab-rx:hover{background:rgba(59,158,255,.08)!important}
.npi-bnav-nav{display:flex;align-items:center;gap:5px;margin-left:6px;flex-shrink:0}
.npi-bnav-back{height:28px;padding:0 12px;background:var(--bg-up);border:1px solid var(--border);border-radius:7px;color:var(--txt2);font-size:11px;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s}
.npi-bnav-back:hover{border-color:var(--border-hi);color:var(--txt)}
.npi-bnav-next{height:28px;padding:0 14px;background:var(--blue);border:none;border-radius:7px;color:#fff;font-size:11px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s}
.npi-bnav-next:hover{filter:brightness(1.15)}
`;

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function NewPatientInput() {
  const navigate = useNavigate();

  // Form state
  const [demo, setDemo] = useState({ firstName:'', lastName:'', age:'', dob:'', sex:'', mrn:'', nhs:'', insurance:'', address:'', city:'', phone:'', email:'', emerg:'', height:'', weight:'', interp:'', lang:'', notes:'', pronouns:'' });
  const [cc, setCC] = useState({ text:'', onset:'', duration:'', severity:'', quality:'', radiation:'', aggravate:'', relieve:'', assoc:'', hpi:'' });
  const [vitals, setVitals] = useState({});
  const [medications, setMedications] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [pmhSelected, setPmhSelected] = useState({});
  const [pmhExtra, setPmhExtra] = useState('');
  const [surgHx, setSurgHx] = useState('');
  const [famHx, setFamHx] = useState('');
  const [socHx, setSocHx] = useState('');
  const [rosState, setRosState] = useState({});
  const [rosSymptoms, setRosSymptoms] = useState({});
  const [rosNotes, setRosNotes] = useState({});
  const [peState, setPeState] = useState({});
  const [peFindings, setPeFindings] = useState({});
  const [selectedCC, setSelectedCC] = useState(-1);
  const [currentTab, setCurrentTab] = useState('demo');
  const [medInput, setMedInput] = useState('');
  const [allergyInput, setAllergyInput] = useState('');
  const [parseText, setParseText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [pmhExpanded, setPmhExpanded] = useState({ cardio: true, endo: true });
  const [avpu, setAvpu] = useState('');
  const [o2del, setO2del] = useState('');
  const [pain, setPain] = useState('');
  const [triage, setTriage] = useState('');

  // AI Chat
  const [aiMessages, setAiMessages] = useState([{ role:'sys', text:'Welcome. I\'ll assist as you build this patient record — suggesting red flags, relevant ROS items, exam findings, and differential diagnoses as you enter data.' }]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [convoHistory, setConvoHistory] = useState([]);
  const chatRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [aiMessages, aiLoading]);

  // ── Derived values ───────────────────────────────────────────────
  const patientName = [demo.firstName, demo.lastName].filter(Boolean).join(' ') || 'New Patient';
  const progress = (() => {
    let s = 0;
    if (demo.firstName || demo.age) s++;
    if (cc.text) s++;
    if (Object.values(vitals).some(v => v)) s++;
    if (medications.length > 0 || Object.values(pmhSelected).some(Boolean)) s++;
    if (Object.values(rosState).some(v => v > 0)) s++;
    if (Object.values(peState).some(v => v > 0)) s++;
    return Math.round((s / 6) * 100);
  })();

  // ── Vitals helpers ───────────────────────────────────────────────
  const getVitalStatus = (id) => {
    const def = VITAL_DEFS.find(v => v.id === id);
    if (!def) return '';
    const val = parseFloat(vitals[id]);
    if (isNaN(val)) return '';
    if (def.hi !== null && val > def.hi) return 'abn';
    if (def.lo !== null && val < def.lo) return 'lo';
    return 'ok';
  };

  // ── ROS helpers ─────────────────────────────────────────────────
  const setROS = (id, state) => {
    setRosState(prev => ({ ...prev, [id]: state }));
  };
  const cycleROS = (id) => {
    const cur = rosState[id] ?? 0;
    setROS(id, cur === 0 ? 1 : cur === 1 ? 2 : 0);
  };
  const toggleSym = (sysId, sym) => {
    setRosSymptoms(prev => {
      const arr = [...(prev[sysId] || [])];
      const i = arr.indexOf(sym);
      if (i === -1) arr.push(sym); else arr.splice(i, 1);
      return { ...prev, [sysId]: arr };
    });
  };
  const markAllROS = (state) => {
    const next = {};
    ROS_SYSTEMS.forEach(s => { next[s.id] = state; });
    setRosState(next);
  };

  // ── PE helpers ───────────────────────────────────────────────────
  const setPE = (id, state) => {
    setPeState(prev => ({ ...prev, [id]: state }));
    if (state === 1) {
      const def = PE_SYSTEMS.find(s => s.id === id);
      if (def) setPeFindings(prev => ({ ...prev, [id]: def.normal }));
    }
  };
  const markAllPE = (state) => {
    const next = {};
    PE_SYSTEMS.forEach(s => { next[s.id] = state; });
    setPeState(next);
    if (state === 1) {
      const findings = {};
      PE_SYSTEMS.forEach(s => { findings[s.id] = s.normal; });
      setPeFindings(findings);
    }
  };

  // ── PMH toggle ───────────────────────────────────────────────────
  const togglePMH = (name) => {
    setPmhSelected(prev => ({ ...prev, [name]: ((prev[name] || 0) + 1) % 3 }));
  };
  const togglePmhSystem = (id) => {
    setPmhExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };
  const getPmhSystemCount = (conditions) => conditions.filter(c => (pmhSelected[c] || 0) > 0).length;

  // ── Tab navigation ───────────────────────────────────────────────
  const showTab = (name) => setCurrentTab(name);
  const navNext = () => { const i = TABS.indexOf(currentTab); if (i < TABS.length - 1) setCurrentTab(TABS[i + 1]); };
  const navBack = () => { const i = TABS.indexOf(currentTab); if (i > 0) setCurrentTab(TABS[i - 1]); };

  // ── Meds ─────────────────────────────────────────────────────────
  const addMed = (name) => { if (name && !medications.includes(name)) setMedications(p => [...p, name]); };
  const removeMed = (i) => setMedications(p => p.filter((_, idx) => idx !== i));
  const handleMedKey = (e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); const v = medInput.replace(/,/g,'').trim(); if (v) { addMed(v); setMedInput(''); } } };
  const addAllergy = (name) => { if (name && !allergies.includes(name)) setAllergies(p => [...p, name]); };
  const removeAllergy = (i) => setAllergies(p => p.filter((_, idx) => idx !== i));
  const handleAllergyKey = (e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); const v = allergyInput.replace(/,/g,'').trim(); if (v) { addAllergy(v); setAllergyInput(''); } } };

  // ── Smart Parse ──────────────────────────────────────────────────
  const smartParse = async () => {
    if (!parseText.trim()) { toast.error('Please enter some text to parse.'); return; }
    setParsing(true);
    appendAiMsg('user', '📋 Smart Parse: ' + parseText.substring(0, 80) + '...');
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Extract structured patient data from the following text. Return ONLY valid JSON with these keys (empty string if not found):
{
  "firstName": "", "lastName": "", "age": "", "sex": "", "dob": "",
  "cc": "", "onset": "", "duration": "", "severity": "", "quality": "", "radiation": "", "aggravating": "", "relieving": "", "associated": "",
  "bp": "", "hr": "", "rr": "", "spo2": "", "temp": "", "gcs": "",
  "medications": [],
  "allergies": [],
  "pmh": [],
  "notes": ""
}
Text: ${parseText}`,
        response_json_schema: {
          type: 'object',
          properties: {
            firstName: {type:'string'}, lastName: {type:'string'}, age: {type:'string'}, sex: {type:'string'}, dob: {type:'string'},
            cc: {type:'string'}, onset: {type:'string'}, duration: {type:'string'}, severity: {type:'string'}, quality: {type:'string'},
            radiation: {type:'string'}, aggravating: {type:'string'}, relieving: {type:'string'}, associated: {type:'string'},
            bp: {type:'string'}, hr: {type:'string'}, rr: {type:'string'}, spo2: {type:'string'}, temp: {type:'string'}, gcs: {type:'string'},
            medications: {type:'array', items:{type:'string'}},
            allergies: {type:'array', items:{type:'string'}},
            pmh: {type:'array', items:{type:'string'}},
            notes: {type:'string'},
          }
        }
      });
      // Populate fields
      setDemo(prev => ({
        ...prev,
        firstName: result.firstName || prev.firstName,
        lastName: result.lastName || prev.lastName,
        age: result.age || prev.age,
        sex: result.sex || prev.sex,
        dob: result.dob || prev.dob,
      }));
      setCC(prev => ({
        ...prev,
        text: result.cc || prev.text,
        onset: result.onset || prev.onset,
        duration: result.duration || prev.duration,
        severity: result.severity || prev.severity,
        quality: result.quality || prev.quality,
        radiation: result.radiation || prev.radiation,
        aggravate: result.aggravating || prev.aggravate,
        relieve: result.relieving || prev.relieve,
        assoc: result.associated || prev.assoc,
      }));
      setVitals(prev => ({
        ...prev,
        bp: result.bp || prev.bp || '',
        hr: result.hr || prev.hr || '',
        rr: result.rr || prev.rr || '',
        spo2: result.spo2 || prev.spo2 || '',
        temp: result.temp || prev.temp || '',
        gcs: result.gcs || prev.gcs || '',
      }));
      (result.medications || []).forEach(m => { if (m) addMed(m); });
      (result.allergies || []).forEach(a => { if (a) addAllergy(a); });
      const allPmhConditions = PMH_SYSTEMS.flatMap(s => s.conditions);
      (result.pmh || []).forEach(c => {
        allPmhConditions.forEach(pc => {
          if (pc.toLowerCase().includes(c.toLowerCase().split(' ')[0])) {
            setPmhSelected(prev => ({ ...prev, [pc]: prev[pc] || 1 }));
            // Auto-expand the system containing this condition
            PMH_SYSTEMS.forEach(sys => {
              if (sys.conditions.includes(pc)) setPmhExpanded(prev => ({ ...prev, [sys.id]: true }));
            });
          }
        });
      });
      appendAiMsg('bot', '✅ Patient data extracted and populated into all fields. Review and adjust as needed.');
    } catch(e) {
      appendAiMsg('bot', '⚠️ Could not parse automatically. Please enter data manually.');
    }
    setParsing(false);
  };

  // ── AI Chat ──────────────────────────────────────────────────────
  const appendAiMsg = (role, text) => {
    setAiMessages(prev => [...prev, { role, text }]);
  };

  const buildContext = () => {
    let ctx = `Patient: ${patientName}, Age ${demo.age || '?'}, ${demo.sex || '?'}. `;
    ctx += `CC: ${cc.text || 'not entered'}. `;
    if (medications.length) ctx += `Meds: ${medications.join(', ')}. `;
    if (allergies.length) ctx += `Allergies: ${allergies.join(', ')}. `;
    const pmhList = Object.entries(pmhSelected).filter(([,v])=>v>0).map(([k])=>k);
    if (pmhList.length) ctx += `PMHx: ${pmhList.join(', ')}. `;
    const rosAbn = ROS_SYSTEMS.filter(s => rosState[s.id] === 2).map(s => s.name);
    if (rosAbn.length) ctx += `ROS abnormal: ${rosAbn.join(', ')}. `;
    const peAbn = PE_SYSTEMS.filter(s => peState[s.id] === 2).map(s => s.name);
    if (peAbn.length) ctx += `PE abnormal: ${peAbn.join(', ')}. `;
    if (vitals.hr) ctx += `HR ${vitals.hr}, SpO2 ${vitals.spo2}%, Temp ${vitals.temp}°C. `;
    return ctx;
  };

  const sendAI = async (q) => {
    const question = q || aiInput.trim();
    if (!question || aiLoading) return;
    setAiInput('');
    appendAiMsg('user', question);
    setAiLoading(true);
    const newHistory = [...convoHistory, { role: 'user', content: `[Patient context: ${buildContext()}]\nQuestion: ${question}` }];
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a clinical assistant in the Notrya patient input tool. Keep responses concise and actionable. Use brief bullet points. [Patient context: ${buildContext()}]\nQuestion: ${question}`,
      });
      const reply = typeof res === 'string' ? res : JSON.stringify(res);
      setConvoHistory([...newHistory, { role: 'assistant', content: reply }]);
      appendAiMsg('bot', reply);
    } catch(e) {
      appendAiMsg('bot', '⚠️ Unable to connect to AI service.');
    }
    setAiLoading(false);
  };

  const aiGenerateNote = async () => {
    appendAiMsg('user', 'Generate a full structured clinical note from this patient data');
    setAiLoading(true);
    try {
      const rosAbn = ROS_SYSTEMS.filter(s => rosState[s.id] === 2).map(s => `${s.name}: ABNORMAL${rosSymptoms[s.id]?.length ? ' — ' + rosSymptoms[s.id].join(', ') : ''}`).join('\n');
      const rosNorm = ROS_SYSTEMS.filter(s => rosState[s.id] === 1).map(s => s.name).join(', ');
      const peAbn = PE_SYSTEMS.filter(s => peState[s.id] === 2).map(s => `${s.name}: ${peFindings[s.id] || 'Abnormal'}`).join('\n');
      const peNorm = PE_SYSTEMS.filter(s => peState[s.id] === 1).map(s => s.name).join(', ');
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a professionally formatted clinical note for this patient. Use standard SOAP structure. Be concise and clinical.

${buildContext()}
ROS Positive: ${rosAbn || 'None'}
ROS Negative: ${rosNorm || 'None'}
Physical Exam Abnormal: ${peAbn || 'None'}
Physical Exam Normal: ${peNorm || 'None'}

Format with sections: Patient Details, Chief Complaint, HPI, Vitals, Review of Systems, Physical Examination, Initial Impression, and Plan.`,
      });
      appendAiMsg('bot', typeof res === 'string' ? res : JSON.stringify(res));
    } catch(e) {
      appendAiMsg('bot', '⚠️ Could not generate note.');
    }
    setAiLoading(false);
  };

  // ── Save → create ClinicalNote and navigate to Studio ───────────
  const savePatient = async () => {
    try {
      const pmhList = Object.entries(pmhSelected).filter(([,v])=>v>0).map(([k])=>k);
      const rosAbnSystems = ROS_SYSTEMS.filter(s => rosState[s.id] === 2);
      const rosNormSystems = ROS_SYSTEMS.filter(s => rosState[s.id] === 1);
      const peAbnSystems = PE_SYSTEMS.filter(s => peState[s.id] === 2);
      const peNormSystems = PE_SYSTEMS.filter(s => peState[s.id] === 1);

      let rosText = '';
      if (rosAbnSystems.length) rosText += 'POSITIVE:\n' + rosAbnSystems.map(s => `  ${s.name}${rosSymptoms[s.id]?.length ? ': ' + rosSymptoms[s.id].join(', ') : ''}`).join('\n');
      if (rosNormSystems.length) rosText += '\nNEGATIVE: ' + rosNormSystems.map(s => s.name).join(', ');

      let peText = '';
      if (peAbnSystems.length) peText += 'ABNORMAL:\n' + peAbnSystems.map(s => `  ${s.name}: ${peFindings[s.id] || 'Abnormal'}`).join('\n');
      if (peNormSystems.length) peText += '\nNORMAL: ' + peNormSystems.map(s => s.name).join(', ');

      const payload = {
        raw_note: parseText || `Patient ${patientName} presenting with ${cc.text || 'unspecified complaint'}`,
        patient_name: patientName,
        patient_id: demo.mrn || '',
        patient_age: demo.age || '',
        patient_gender: demo.sex?.toLowerCase() === 'male' ? 'male' : demo.sex?.toLowerCase() === 'female' ? 'female' : 'other',
        date_of_birth: demo.dob || '',
        chief_complaint: cc.text || '',
        history_of_present_illness: cc.hpi || [cc.onset && `Onset: ${cc.onset}`, cc.duration && `Duration: ${cc.duration}`, cc.quality && `Quality: ${cc.quality}`, cc.radiation && `Radiation: ${cc.radiation}`, cc.aggravate && `Aggravating: ${cc.aggravate}`, cc.relieve && `Relieving: ${cc.relieve}`, cc.assoc && `Associated: ${cc.assoc}`].filter(Boolean).join('. '),
        vital_signs: {
          blood_pressure: vitals.bp || '',
          heart_rate: vitals.hr ? { value: parseFloat(vitals.hr), unit: 'bpm' } : undefined,
          respiratory_rate: vitals.rr ? { value: parseFloat(vitals.rr), unit: 'breaths/min' } : undefined,
          oxygen_saturation: vitals.spo2 ? { value: parseFloat(vitals.spo2), unit: '%' } : undefined,
          temperature: vitals.temp ? { value: parseFloat(vitals.temp), unit: 'C' } : undefined,
        },
        medical_history: pmhList.join(', '),
        medications: medications,
        allergies: allergies,
        review_of_systems: rosText,
        physical_exam: peText,
        status: 'draft',
      };

      const created = await base44.entities.ClinicalNote.create(payload);
      toast.success('Patient saved — opening Clinical Note Studio');
      navigate(`/ClinicalNoteStudio?noteId=${created.id}`);
    } catch(e) {
      toast.error('Failed to save: ' + e.message);
    }
  };

  // ── Summary builder ──────────────────────────────────────────────
  const buildSummary = () => {
    const pmhList = Object.entries(pmhSelected).filter(([,v])=>v>0).map(([k])=>k);
    const rosNorm = ROS_SYSTEMS.filter(s => rosState[s.id] === 1);
    const rosAbn = ROS_SYSTEMS.filter(s => rosState[s.id] === 2);
    const peNorm = PE_SYSTEMS.filter(s => peState[s.id] === 1);
    const peAbn = PE_SYSTEMS.filter(s => peState[s.id] === 2);

    return (
      <div>
        <div className="npi-sum-block">
          <div className="npi-sum-block-title"><span>👤</span> Patient</div>
          <table className="npi-sum-table">
            <tbody>
              <tr><td>Name</td><td>{patientName}</td></tr>
              <tr><td>Age / Sex</td><td>{demo.age || '—'} · {demo.sex || '—'}</td></tr>
              <tr><td>DOB</td><td>{demo.dob || '—'}</td></tr>
              <tr><td>MRN</td><td style={{fontFamily:"'JetBrains Mono',monospace"}}>{demo.mrn || '—'}</td></tr>
            </tbody>
          </table>
        </div>
        <div className="npi-sum-block">
          <div className="npi-sum-block-title"><span>🗣️</span> Chief Complaint & HPI</div>
          <table className="npi-sum-table">
            <tbody>
              <tr><td>CC</td><td>{cc.text || '—'}</td></tr>
              {cc.onset && <tr><td>Onset</td><td>{cc.onset}</td></tr>}
              {cc.duration && <tr><td>Duration</td><td>{cc.duration}</td></tr>}
              {cc.severity && <tr><td>Severity</td><td>{cc.severity}/10</td></tr>}
              {cc.quality && <tr><td>Quality</td><td>{cc.quality}</td></tr>}
              {cc.hpi && <tr><td>HPI</td><td>{cc.hpi}</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="npi-sum-block">
          <div className="npi-sum-block-title"><span>📊</span> Vital Signs</div>
          <table className="npi-sum-table">
            <tbody>
              <tr><td>BP</td><td style={{fontFamily:"'JetBrains Mono',monospace"}}>{vitals.bp || '—'} mmHg</td></tr>
              <tr><td>HR</td><td style={{fontFamily:"'JetBrains Mono',monospace"}}>{vitals.hr || '—'} bpm</td></tr>
              <tr><td>SpO₂</td><td style={{fontFamily:"'JetBrains Mono',monospace"}}>{vitals.spo2 || '—'}%</td></tr>
              <tr><td>Temp</td><td style={{fontFamily:"'JetBrains Mono',monospace"}}>{vitals.temp || '—'}°C</td></tr>
              <tr><td>GCS</td><td style={{fontFamily:"'JetBrains Mono',monospace"}}>{vitals.gcs || '—'}/15</td></tr>
            </tbody>
          </table>
        </div>
        <div className="npi-sum-block">
          <div className="npi-sum-block-title"><span>💊</span> Medications & History</div>
          <table className="npi-sum-table">
            <tbody>
              <tr><td>Medications</td><td>{medications.length ? medications.join(', ') : '—'}</td></tr>
              <tr><td>Allergies</td><td style={{color: allergies.length ? 'var(--coral)' : 'inherit'}}>{allergies.length ? allergies.join(', ') : 'NKDA'}</td></tr>
              <tr><td>PMH</td><td>{pmhList.length ? pmhList.join(', ') : '—'}</td></tr>
              {surgHx && <tr><td>Surgical Hx</td><td>{surgHx}</td></tr>}
              {famHx && <tr><td>Family Hx</td><td>{famHx}</td></tr>}
              {socHx && <tr><td>Social Hx</td><td>{socHx}</td></tr>}
            </tbody>
          </table>
        </div>
        {(rosNorm.length > 0 || rosAbn.length > 0) && (
          <div className="npi-sum-block">
            <div className="npi-sum-block-title"><span>🔍</span> Review of Systems</div>
            {rosAbn.length > 0 && <div style={{marginBottom:8}}>
              <div style={{fontSize:10,color:'var(--coral)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:5}}>Positive Findings</div>
              {rosAbn.map(s => <div key={s.id} style={{marginBottom:5}}><span className="npi-ros-item abn">✗ {s.name}</span>{rosSymptoms[s.id]?.length ? ' — '+rosSymptoms[s.id].join(', ') : ''}</div>)}
            </div>}
            {rosNorm.length > 0 && <div>
              <div style={{fontSize:10,color:'var(--teal)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:5}}>Negative Systems</div>
              <div>{rosNorm.map(s => <span key={s.id} className="npi-ros-item norm">✓ {s.name}</span>)}</div>
            </div>}
          </div>
        )}
        {(peNorm.length > 0 || peAbn.length > 0) && (
          <div className="npi-sum-block">
            <div className="npi-sum-block-title"><span>🩺</span> Physical Examination</div>
            {peAbn.length > 0 && <div style={{marginBottom:8}}>
              <div style={{fontSize:10,color:'var(--coral)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:5}}>Abnormal Findings</div>
              {peAbn.map(s => <div key={s.id} style={{marginBottom:5}}><span className="npi-ros-item abn">✗ {s.name}</span> — <span style={{fontSize:11,color:'var(--txt2)'}}>{peFindings[s.id]}</span></div>)}
            </div>}
            {peNorm.length > 0 && <div>
              <div style={{fontSize:10,color:'var(--teal)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:5}}>Normal Systems</div>
              <div>{peNorm.map(s => <span key={s.id} className="npi-ros-item norm">✓ {s.name}</span>)}</div>
            </div>}
          </div>
        )}
        <div className="npi-sum-btns">
          <button className="npi-sum-studio-btn" onClick={savePatient}>📝 Save & Open in Studio →</button>
          <button className="npi-sum-generate-btn" onClick={aiGenerateNote}>✨ AI Generate Note</button>
          <button className="npi-sum-studio-btn" style={{borderColor:'var(--teal)',color:'var(--teal)',background:'rgba(0,229,192,.06)'}} onClick={() => navigate('/ERPlanBuilder')}>🩺 Open ER Plan Builder →</button>
        </div>
      </div>
    );
  };

  // ─── RENDER ──────────────────────────────────────────────────────
  return (
    <div className="npi-root">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap');`}</style>
      <style>{CSS}</style>

      {/* NAVBAR */}
      <nav className="npi-nav">
        <span className="npi-logo">Notrya</span>
        <div className="npi-ndiv"/>
        <span className="npi-ntitle">New Patient Input</span>
        <div className="npi-nav-right">
          <button className="npi-nav-btn new" onClick={() => { setDemo({firstName:'',lastName:'',age:'',dob:'',sex:'',mrn:'',nhs:'',insurance:'',address:'',city:'',phone:'',email:'',emerg:'',height:'',weight:'',interp:'',lang:'',notes:'',pronouns:''});setCC({text:'',onset:'',duration:'',severity:'',quality:'',radiation:'',aggravate:'',relieve:'',assoc:'',hpi:''});setVitals({});setMedications([]);setAllergies([]);setPmhSelected({});setRosState({});setRosSymptoms({});setRosNotes({});setPeState({});setPeFindings({});setSelectedCC(-1);setCurrentTab('demo');setParseText('');toast.success('New patient form cleared'); }}>＋ New Patient</button>
          <button className="npi-nav-btn kb" onClick={() => window.open('/KnowledgeBaseV2','_blank')}>📚 Knowledge Base</button>
          <button className="npi-save-btn" onClick={savePatient}>💾 Save Patient</button>
          <div className="npi-avatar">DR</div>
        </div>
      </nav>

      {/* VITALS BAR */}
      <div className="npi-vbar">
        <div className="npi-pt-chip">
          <div>
            <div className="npi-pt-name">{patientName}</div>
            <div className="npi-pt-mrn">MRN: {demo.mrn || '—'}</div>
          </div>
        </div>
        <div className="npi-vsep"/>
        {VITAL_DEFS.map(v => {
          const val = vitals[v.id] || '—';
          const status = getVitalStatus(v.id);
          return (
            <div key={v.id} className="npi-vchip">
              <div className="npi-vl">{v.label.split(' ')[0]}</div>
              <div className={`npi-vv${status === 'abn' ? ' abn' : status === 'lo' ? ' lo' : ''}`}>{val}{val !== '—' && v.unit === '%' ? '%' : ''}</div>
            </div>
          );
        })}
        <div className="npi-vsep"/>
        <div className="npi-vchip">
          <div className="npi-vl">CC</div>
          <div className="npi-vv" style={{color:'var(--orange)',maxWidth:130,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{cc.text || '—'}</div>
        </div>
        <div className="npi-prog-wrap">
          <div className="npi-prog-label"><span>Completion</span><span>{progress}%</span></div>
          <div className="npi-prog-track"><div className="npi-prog-fill" style={{width: progress + '%'}}/></div>
        </div>
      </div>

      {/* LAYOUT */}
      <div className="npi-layout">

        {/* SIDEBAR */}
        <aside className="npi-sb">
          <div className="npi-pt-summary">
            <div className="npi-pts-name">{patientName}</div>
            <div className="npi-pts-meta">Age {demo.age || '—'} · {demo.sex || '—'}</div>
            <div className="npi-pts-cc-label">Chief Complaint</div>
            <div className="npi-pts-cc-val">{cc.text || 'Not entered'}</div>
            {[
              {label:'Demographics', done: !!(demo.firstName || demo.age)},
              {label:'Chief Complaint', done: !!cc.text},
              {label:'Vitals', done: Object.values(vitals).some(v=>v)},
              {label:'Medications & PMH', done: medications.length>0 || Object.values(pmhSelected).some(v=>v>0)},
              {label:'Review of Systems', done: Object.values(rosState).some(v=>v>0)},
              {label:'Physical Exam', done: Object.values(peState).some(v=>v>0)},
            ].map(step => (
              <div key={step.label} className="npi-pts-step">
                <div className={`npi-step-dot${step.done ? ' done' : ''}`}/>
                <div className="npi-step-label">{step.label}</div>
              </div>
            ))}
          </div>

          <div className="npi-sb-head">Navigation</div>
          {[
            {id:'demo',icon:'👤',label:'Demographics'},
            {id:'cc',icon:'🗣️',label:'Chief Complaint'},
            {id:'vit',icon:'📊',label:'Vitals'},
            {id:'meds',icon:'💊',label:'Medications & PMH'},
            {id:'ros',icon:'🔍',label:'Review of Systems'},
            {id:'pe',icon:'🩺',label:'Physical Exam'},
            {id:'sum',icon:'📋',label:'Summary'},
            {id:'mdm',icon:'⚖️',label:'MDM'},
          ].map(item => (
            <div key={item.id} className={`npi-sb-item${currentTab === item.id ? ' active' : ''}`} onClick={() => showTab(item.id)}>
              <span>{item.icon}</span><span style={{flex:1}}>{item.label}</span>
            </div>
          ))}
          <div style={{height:1,background:'var(--border)',margin:'6px 0'}}/>
          <div className="npi-sb-item" style={{background:'rgba(0,229,192,.06)',border:'1px solid rgba(0,229,192,.25)',borderRadius:7,color:'var(--teal)',fontWeight:600}} onClick={() => navigate('/ERPlanBuilder')}>
            <span>🩺</span><span style={{flex:1}}>ER Plan Builder</span><span style={{fontSize:9,color:'var(--teal)',opacity:.7}}>→</span>
          </div>
        </aside>

        {/* MAIN */}
        <main className="npi-main">

          {/* ── DEMOGRAPHICS ── */}
          <div className={`npi-panel${currentTab === 'demo' ? ' active' : ''}`}>
            <div className="npi-sec-title">👤 Patient Demographics</div>
            <div className="npi-sec-sub">All fields optional — enter what is available</div>

            <div className="npi-parse-box">
              <div className="npi-parse-title">✨ Smart Parse — powered by AI</div>
              <div className="npi-parse-sub">Paste a referral note or type freeform — AI will extract patient data automatically</div>
              <textarea className="npi-textarea" value={parseText} onChange={e=>setParseText(e.target.value)} placeholder='e.g. "62yo male presenting with chest pain 2h, PMHx: HTN, T2DM. Meds: metoprolol 50mg. BP 158/94, HR 92"' style={{minHeight:60}}/>
              <button className="npi-parse-btn" onClick={smartParse} disabled={parsing}>{parsing ? '⏳ Parsing...' : '⚡ Auto-Extract Patient Data'}</button>
            </div>

            <div className="npi-grid-3">
              <div className="npi-field"><div className="npi-label">First Name <span className="opt">(optional)</span></div><input className="npi-input" value={demo.firstName} onChange={e=>setDemo(p=>({...p,firstName:e.target.value}))} placeholder="Given name"/></div>
              <div className="npi-field"><div className="npi-label">Last Name <span className="opt">(optional)</span></div><input className="npi-input" value={demo.lastName} onChange={e=>setDemo(p=>({...p,lastName:e.target.value}))} placeholder="Family name"/></div>
              <div className="npi-field"><div className="npi-label">Preferred Name <span className="opt">(optional)</span></div><input className="npi-input" placeholder="Goes by..."/></div>
            </div>
            <div className="npi-grid-auto">
              <div className="npi-field"><div className="npi-label">Date of Birth</div><input className="npi-input" type="date" value={demo.dob} onChange={e=>{setDemo(p=>({...p,dob:e.target.value}));if(e.target.value){const d=new Date(e.target.value),now=new Date();let a=now.getFullYear()-d.getFullYear();if(now<new Date(now.getFullYear(),d.getMonth(),d.getDate()))a--;setDemo(p=>({...p,dob:e.target.value,age:String(a)}));}}}/></div>
              <div className="npi-field"><div className="npi-label">Age</div><input className="npi-input" style={{fontFamily:"'JetBrains Mono',monospace"}} value={demo.age} onChange={e=>setDemo(p=>({...p,age:e.target.value}))} placeholder="yrs"/></div>
              <div className="npi-field"><div className="npi-label">Sex</div>
                <select className="npi-select" value={demo.sex} onChange={e=>setDemo(p=>({...p,sex:e.target.value}))}>
                  <option value="">— Select —</option>
                  <option>Male</option><option>Female</option><option>Non-binary</option><option>Prefer not to say</option>
                </select>
              </div>
              <div className="npi-field"><div className="npi-label">MRN / Patient ID</div><input className="npi-input" style={{fontFamily:"'JetBrains Mono',monospace"}} value={demo.mrn} onChange={e=>setDemo(p=>({...p,mrn:e.target.value}))} placeholder="00-000-000"/></div>
              <div className="npi-field"><div className="npi-label">Insurance / Payer</div><input className="npi-input" value={demo.insurance} onChange={e=>setDemo(p=>({...p,insurance:e.target.value}))} placeholder="e.g. Medicare"/></div>
            </div>
            <div className="npi-hdiv"/>
            <div className="npi-grid-3">
              <div className="npi-field"><div className="npi-label">Phone</div><input className="npi-input" style={{fontFamily:"'JetBrains Mono',monospace"}} value={demo.phone} onChange={e=>setDemo(p=>({...p,phone:e.target.value}))} placeholder="+1 (000) 000-0000"/></div>
              <div className="npi-field"><div className="npi-label">Email</div><input className="npi-input" type="email" value={demo.email} onChange={e=>setDemo(p=>({...p,email:e.target.value}))} placeholder="patient@email.com"/></div>
              <div className="npi-field"><div className="npi-label">Emergency Contact</div><input className="npi-input" value={demo.emerg} onChange={e=>setDemo(p=>({...p,emerg:e.target.value}))} placeholder="Name & relationship"/></div>
            </div>
            <div className="npi-grid-3">
              <div className="npi-field"><div className="npi-label">Height</div><input className="npi-input" style={{fontFamily:"'JetBrains Mono',monospace"}} value={demo.height} onChange={e=>setDemo(p=>({...p,height:e.target.value}))} placeholder="cm or ft/in"/></div>
              <div className="npi-field"><div className="npi-label">Weight</div><input className="npi-input" style={{fontFamily:"'JetBrains Mono',monospace"}} value={demo.weight} onChange={e=>setDemo(p=>({...p,weight:e.target.value}))} placeholder="kg or lbs"/></div>
              <div className="npi-field"><div className="npi-label">Language / Interpreter</div><input className="npi-input" value={demo.lang} onChange={e=>setDemo(p=>({...p,lang:e.target.value}))} placeholder="Language spoken"/></div>
            </div>
            <div className="npi-field"><div className="npi-label">Additional Notes <span className="opt">(optional)</span></div><textarea className="npi-textarea" value={demo.notes} onChange={e=>setDemo(p=>({...p,notes:e.target.value}))} placeholder="Any other relevant demographic information..."/></div>
          </div>

          {/* ── CHIEF COMPLAINT ── */}
          <div className={`npi-panel${currentTab === 'cc' ? ' active' : ''}`}>
            <div className="npi-sec-title">🗣️ Chief Complaint</div>
            <div className="npi-sec-sub">Tap a quick complaint or type directly</div>
            <div className="npi-hint">💡 Selecting a chief complaint will highlight the most relevant ROS systems on the Review of Systems tab</div>
            <div className="npi-field" style={{marginBottom:12}}>
              <div className="npi-label">Chief Complaint (free text)</div>
              <input className="npi-input" value={cc.text} onChange={e=>setCC(p=>({...p,text:e.target.value}))} placeholder='e.g. "Chest pain for 2 hours, radiating to left arm"'/>
            </div>
            <div className="npi-sec-sub" style={{marginBottom:7}}>Quick select — tap to auto-fill:</div>
            <div className="npi-cc-grid">
              {CC_LIST.map((c,i) => (
                <button key={i} className={`npi-cc-btn${selectedCC === i ? ' selected' : ''}`} onClick={() => {
                  setSelectedCC(i);
                  setCC(p=>({...p,text:c.label}));
                  toast.info(`ROS systems highlighted for "${c.label}"`);
                }}>
                  <span className="npi-cc-icon">{c.icon}</span>
                  <span className="npi-cc-label">{c.label}</span>
                </button>
              ))}
            </div>
            <div className="npi-hdiv"/>
            <div className="npi-grid-2">
              <div className="npi-field"><div className="npi-label">Onset</div>
                <select className="npi-select" value={cc.onset} onChange={e=>setCC(p=>({...p,onset:e.target.value}))}>
                  <option value="">— Select —</option>
                  {['Sudden','Gradual','Minutes ago','Hours ago','Days ago','Weeks ago','Months ago'].map(o=><option key={o}>{o}</option>)}
                </select>
              </div>
              <div className="npi-field"><div className="npi-label">Duration</div><input className="npi-input" value={cc.duration} onChange={e=>setCC(p=>({...p,duration:e.target.value}))} placeholder='e.g. "2 hours", "3 days"'/></div>
            </div>
            <div className="npi-grid-2">
              <div className="npi-field"><div className="npi-label">Severity (0–10)</div><input className="npi-input" style={{fontFamily:"'JetBrains Mono',monospace"}} type="number" min="0" max="10" value={cc.severity} onChange={e=>setCC(p=>({...p,severity:e.target.value}))} placeholder="0–10"/></div>
              <div className="npi-field"><div className="npi-label">Character / Quality</div><input className="npi-input" value={cc.quality} onChange={e=>setCC(p=>({...p,quality:e.target.value}))} placeholder='e.g. "crushing", "sharp", "burning"'/></div>
            </div>
            <div className="npi-grid-2">
              <div className="npi-field"><div className="npi-label">Radiation / Location</div><input className="npi-input" value={cc.radiation} onChange={e=>setCC(p=>({...p,radiation:e.target.value}))} placeholder='e.g. "left arm, jaw"'/></div>
              <div className="npi-field"><div className="npi-label">Aggravating Factors</div><input className="npi-input" value={cc.aggravate} onChange={e=>setCC(p=>({...p,aggravate:e.target.value}))} placeholder="What makes it worse?"/></div>
            </div>
            <div className="npi-grid-2">
              <div className="npi-field"><div className="npi-label">Relieving Factors</div><input className="npi-input" value={cc.relieve} onChange={e=>setCC(p=>({...p,relieve:e.target.value}))} placeholder="What makes it better?"/></div>
              <div className="npi-field"><div className="npi-label">Associated Symptoms</div><input className="npi-input" value={cc.assoc} onChange={e=>setCC(p=>({...p,assoc:e.target.value}))} placeholder="Other symptoms present"/></div>
            </div>
            <div className="npi-field"><div className="npi-label">HPI — History of Presenting Illness</div>
              <textarea className="npi-textarea" style={{minHeight:85}} value={cc.hpi} onChange={e=>setCC(p=>({...p,hpi:e.target.value}))} placeholder="Narrative history of presenting illness..."/>
            </div>
          </div>

          {/* ── VITALS ── */}
          <div className={`npi-panel${currentTab === 'vit' ? ' active' : ''}`}>
            <div className="npi-sec-title">📊 Vital Signs</div>
            <div className="npi-sec-sub">Enter available vitals — abnormal values flag automatically (red = high, blue = low)</div>
            <div className="npi-vitals-grid">
              {VITAL_DEFS.map(v => {
                const status = getVitalStatus(v.id);
                return (
                  <div key={v.id} className={`npi-vit-field${status === 'abn' ? ' abn-field' : status === 'lo' ? ' lo-field' : ''}`}>
                    <div className={`npi-vit-status${status ? ' ' + status : ''}`}/>
                    <div className="npi-vit-icon">{v.icon}</div>
                    <div className="npi-vit-label-txt">{v.label}</div>
                    <input
                      className="npi-vit-input"
                      type={v.isText ? 'text' : 'number'}
                      value={vitals[v.id] || ''}
                      onChange={e=>setVitals(p=>({...p,[v.id]:e.target.value}))}
                      placeholder={v.ph}
                    />
                    <div className="npi-vit-unit">{v.unit}</div>
                  </div>
                );
              })}
            </div>
            <div className="npi-hdiv"/>
            <div className="npi-grid-3">
              <div className="npi-field"><div className="npi-label">AVPU</div>
                <select className="npi-select" value={avpu} onChange={e=>setAvpu(e.target.value)}>
                  <option value="">—</option>
                  {['A — Alert','V — Voice','P — Pain','U — Unresponsive'].map(o=><option key={o}>{o}</option>)}
                </select>
              </div>
              <div className="npi-field"><div className="npi-label">Oxygen Delivery</div>
                <select className="npi-select" value={o2del} onChange={e=>setO2del(e.target.value)}>
                  <option value="">—</option>
                  {['Room air','Nasal cannula 2L','Nasal cannula 4L','Simple face mask','Non-rebreather mask 15L','High-flow nasal oxygen','BiPAP','Intubated / Ventilated'].map(o=><option key={o}>{o}</option>)}
                </select>
              </div>
              <div className="npi-field"><div className="npi-label">Pain Score (0–10)</div><input className="npi-input" style={{fontFamily:"'JetBrains Mono',monospace"}} type="number" min="0" max="10" value={pain} onChange={e=>setPain(e.target.value)} placeholder="0–10"/></div>
            </div>
            <div className="npi-field" style={{maxWidth:300}}>
              <div className="npi-label">Triage / Acuity</div>
              <select className="npi-select" value={triage} onChange={e=>setTriage(e.target.value)}>
                <option value="">— Select —</option>
                {['ESI 1 / ATS 1 — Immediate','ESI 2 / ATS 2 — Emergent','ESI 3 / ATS 3 — Urgent','ESI 4 / ATS 4 — Semi-Urgent','ESI 5 / ATS 5 — Non-Urgent'].map(o=><option key={o}>{o}</option>)}
              </select>
            </div>
          </div>

          {/* ── MEDICATIONS & PMH ── */}
          <div className={`npi-panel${currentTab === 'meds' ? ' active' : ''}`}>
            <div className="npi-sec-title">💊 Medications & Medical History</div>
            <div className="npi-sec-sub">All optional — add medications as tags, tap conditions to mark past medical history</div>

            <div style={{fontSize:12,fontWeight:600,color:'var(--txt)',marginBottom:6}}>💊 Current Medications</div>
            <div className="npi-hint">Type a medication name and press <strong>Enter</strong> or <strong>comma</strong> to add</div>
            <div className="npi-med-tags" onClick={() => document.getElementById('npi-med-input').focus()}>
              {medications.map((m,i) => (
                <div key={i} className="npi-med-tag">{m}<span className="npi-med-tag-x" onClick={()=>removeMed(i)}>×</span></div>
              ))}
              <input id="npi-med-input" className="npi-med-tag-input" value={medInput} onChange={e=>setMedInput(e.target.value)} onKeyDown={handleMedKey} placeholder="Type medication + Enter..."/>
            </div>
            <div className="npi-med-hint">
              Common: {['Metoprolol 50mg','Aspirin 81mg','Atorvastatin 40mg','Metformin 1g','Lisinopril 10mg','Amlodipine 5mg','Furosemide 40mg'].map(m=>(
                <span key={m} className="npi-quick-med" onClick={()=>addMed(m)}>{m.split(' ')[0]}</span>
              ))}
            </div>

            <div style={{fontSize:11,fontWeight:600,color:'var(--txt3)',margin:'12px 0 5px',textTransform:'uppercase',letterSpacing:'.5px'}}>Allergies & Adverse Reactions</div>
            <div className="npi-med-tags" style={{borderColor:'rgba(255,107,107,.3)'}} onClick={() => document.getElementById('npi-allergy-input').focus()}>
              {allergies.map((a,i) => (
                <div key={i} className="npi-med-tag npi-allergy-tag">{a}<span className="npi-med-tag-x" onClick={()=>removeAllergy(i)}>×</span></div>
              ))}
              <input id="npi-allergy-input" className="npi-med-tag-input" value={allergyInput} onChange={e=>setAllergyInput(e.target.value)} onKeyDown={handleAllergyKey} placeholder="Drug/substance + Enter..."/>
            </div>

            <div className="npi-hdiv"/>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:7}}>
              <span style={{fontSize:12,fontWeight:600,color:'var(--txt)'}}>🏥 Past Medical History</span>
              <span style={{fontSize:10,color:'var(--txt3)'}}>— organised by system</span>
              <div style={{marginLeft:'auto',display:'flex',gap:5}}>
                <button onClick={()=>setPmhExpanded(PMH_SYSTEMS.reduce((a,s)=>({...a,[s.id]:true}),{}))} style={{fontSize:10,padding:'2px 8px',borderRadius:4,border:'1px solid var(--border)',background:'transparent',color:'var(--txt3)',cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>Expand All</button>
                <button onClick={()=>setPmhExpanded({})} style={{fontSize:10,padding:'2px 8px',borderRadius:4,border:'1px solid var(--border)',background:'transparent',color:'var(--txt3)',cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>Collapse All</button>
              </div>
            </div>
            <div className="npi-hint">Tap a condition once to mark as <strong style={{color:'var(--blue)'}}>present</strong> · tap again to mark as <strong style={{color:'var(--teal)'}}>active/significant</strong> · tap again to clear</div>
            <div className="npi-pmh-systems">
              {PMH_SYSTEMS.map(sys => {
                const count = getPmhSystemCount(sys.conditions);
                const isOpen = pmhExpanded[sys.id] ?? false;
                return (
                  <div key={sys.id} className={`npi-pmh-sys${count > 0 ? ' has-sel' : ''}`}>
                    <div className="npi-pmh-sys-hdr" onClick={()=>togglePmhSystem(sys.id)}>
                      <span className="npi-pmh-sys-ico">{sys.icon}</span>
                      <span className="npi-pmh-sys-name">{sys.name}</span>
                      <span className={`npi-pmh-sys-count${count === 0 ? ' zero' : ''}`}>{count > 0 ? count : sys.conditions.length}</span>
                      <span className={`npi-pmh-sys-chevron${isOpen ? ' open' : ''}`}>▶</span>
                    </div>
                    <div className={`npi-pmh-sys-body${isOpen ? ' open' : ''}`}>
                      {sys.conditions.map(cond => {
                        const state = pmhSelected[cond] || 0;
                        return (
                          <div key={cond} className={`npi-pmh-chip${state > 0 ? ' sel' : ''}${state === 2 ? ' active-pmh' : ''}`} onClick={()=>togglePMH(cond)}>
                            {state === 2 ? '★ ' : state === 1 ? '✓ ' : ''}{cond}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="npi-field" style={{marginTop:8}}>
              <div className="npi-label">Additional Medical History <span className="opt">(free text)</span></div>
              <textarea className="npi-textarea" value={pmhExtra} onChange={e=>setPmhExtra(e.target.value)} placeholder="Other conditions, surgeries, significant history..."/>
            </div>
            <div className="npi-hdiv"/>
            <div className="npi-grid-3">
              <div className="npi-field"><div className="npi-label">Surgical History</div><textarea className="npi-textarea" style={{minHeight:55}} value={surgHx} onChange={e=>setSurgHx(e.target.value)} placeholder="Previous operations..."/></div>
              <div className="npi-field"><div className="npi-label">Family History</div><textarea className="npi-textarea" style={{minHeight:55}} value={famHx} onChange={e=>setFamHx(e.target.value)} placeholder="Relevant family history..."/></div>
              <div className="npi-field"><div className="npi-label">Social History</div><textarea className="npi-textarea" style={{minHeight:55}} value={socHx} onChange={e=>setSocHx(e.target.value)} placeholder="Smoking, alcohol, drugs, occupation..."/></div>
            </div>
          </div>

          {/* ── REVIEW OF SYSTEMS ── */}
          <div className={`npi-panel${currentTab === 'ros' ? ' active' : ''}`}>
            <div className="npi-sec-title">🔍 Review of Systems</div>
            <div className="npi-sec-sub">Tri-state toggle: click once = ✓ Normal · click again = ✗ Abnormal · click again = reset</div>
            <div className="npi-ros-toolbar">
              <button className="npi-ros-tool-btn teal" onClick={()=>markAllROS(1)}>✓ All Systems Normal</button>
              <button className="npi-ros-tool-btn red" onClick={()=>markAllROS(0)}>↺ Reset All</button>
            </div>
            <div className="npi-ros-grid">
              {ROS_SYSTEMS.map(s => {
                const state = rosState[s.id] ?? 0;
                const syms = rosSymptoms[s.id] || [];
                return (
                  <div key={s.id} className={`npi-ros-card${state === 1 ? ' s1' : state === 2 ? ' s2' : ''}`} onClick={()=>cycleROS(s.id)}>
                    <div className="npi-ros-card-header">
                      <span className="npi-ros-icon">{s.icon}</span>
                      <span className="npi-ros-sys-name">{s.name}</span>
                      <div className="npi-ros-state-btns" onClick={e=>e.stopPropagation()}>
                        <button className={`npi-rsb norm${state===1?' active-btn':''}`} onClick={e=>{e.stopPropagation();setROS(s.id,1)}} title="Normal">✓</button>
                        <button className={`npi-rsb abn${state===2?' active-btn':''}`} onClick={e=>{e.stopPropagation();setROS(s.id,2)}} title="Abnormal">✗</button>
                        <button className={`npi-rsb na${state===0?' active-btn':''}`} onClick={e=>{e.stopPropagation();setROS(s.id,0)}} title="Not assessed">—</button>
                      </div>
                    </div>
                    {state === 1 && <div className="npi-ros-norm-text">No abnormalities reported in this system</div>}
                    {state === 2 && (
                      <>
                        <div className="npi-ros-symptoms" onClick={e=>e.stopPropagation()}>
                          {s.syms.map(sym => (
                            <div key={sym} className={`npi-ros-sym-chip${syms.includes(sym)?' sel-sym':''}`} onClick={e=>{e.stopPropagation();toggleSym(s.id,sym)}}>{sym}</div>
                          ))}
                        </div>
                        <div className="npi-ros-abn-wrap open" onClick={e=>e.stopPropagation()}>
                          <textarea className="npi-ros-abn-input" value={rosNotes[s.id] || ''} onChange={e=>setRosNotes(p=>({...p,[s.id]:e.target.value}))} placeholder="Describe abnormal findings..." rows={2}/>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── PHYSICAL EXAM ── */}
          <div className={`npi-panel${currentTab === 'pe' ? ' active' : ''}`}>
            <div className="npi-sec-title">🩺 Physical Examination</div>
            <div className="npi-sec-sub">Tri-state toggle: click once = ✓ Normal · click again = ✗ Abnormal · click again = reset</div>
            <div className="npi-ros-toolbar">
              <button className="npi-ros-tool-btn teal" onClick={()=>markAllPE(1)}>✓ Normal Exam (All Systems)</button>
              <button className="npi-ros-tool-btn red" onClick={()=>markAllPE(0)}>↺ Reset Exam</button>
            </div>
            <div className="npi-pe-grid">
              {PE_SYSTEMS.map(s => {
                const state = peState[s.id] ?? 0;
                return (
                  <div key={s.id} className={`npi-pe-card${state === 1 ? ' s1' : state === 2 ? ' s2' : ''}`}>
                    <div className="npi-pe-card-header">
                      <span className="npi-ros-icon">{s.icon}</span>
                      <span className="npi-ros-sys-name">{s.name}</span>
                      <div className="npi-ros-state-btns">
                        <button className={`npi-rsb norm${state===1?' active-btn':''}`} onClick={()=>setPE(s.id,1)}>✓</button>
                        <button className={`npi-rsb abn${state===2?' active-btn':''}`} onClick={()=>setPE(s.id,2)}>✗</button>
                        <button className={`npi-rsb na${state===0?' active-btn':''}`} onClick={()=>setPE(s.id,0)}>—</button>
                      </div>
                    </div>
                    {state === 1 && <div className="npi-pe-normal-preview">{s.normal}</div>}
                    {state === 2 && (
                      <div className="npi-pe-findings-wrap open">
                        <textarea className="npi-pe-findings" value={peFindings[s.id] || s.normal} onChange={e=>setPeFindings(p=>({...p,[s.id]:e.target.value}))} rows={3}/>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── MDM ── */}
          {currentTab === 'mdm' && (
            <div style={{ display: 'flex', flex: 1, minHeight: 0, margin: '-16px -18px', height: 'calc(100vh - 200px)' }}>
              <MDMPanel
                patientName={patientName}
                chiefComplaint={cc.text}
                vitals={vitals}
              />
            </div>
          )}

          {/* ── SUMMARY ── */}
          <div className={`npi-panel${currentTab === 'sum' ? ' active' : ''}`}>
            <div className="npi-sec-title">📋 Patient Summary</div>
            <div className="npi-sec-sub">Review all entered information before saving to Clinical Note Studio</div>
            {buildSummary()}
          </div>

        </main>

        {/* AI PANEL — hidden on MDM tab since MDM has its own layout */}
        <aside className="npi-ai-panel" style={{display: currentTab === 'mdm' ? 'none' : 'flex'}}>
          <div className="npi-ai-header">
            <div className="npi-ai-hrow">
              <div className="npi-ai-dot"/>
              <div className="npi-ai-title">Notrya AI</div>
              <div className="npi-ai-model">GPT-4o</div>
            </div>
            <div className="npi-ai-qbtns">
              {[
                ['🚩 Red Flags','What are the red flags I should assess for this chief complaint?'],
                ['🩺 Exam Tips','Suggest a focused physical exam based on the current patient data'],
                ['🧬 Differentials','What are the likely differentials for this presentation?'],
                ['📋 Draft SBAR','Summarise what I have entered so far as a clinical handover'],
              ].map(([label, q]) => (
                <button key={label} className="npi-ai-qbtn" onClick={()=>sendAI(q)}>{label}</button>
              ))}
            </div>
          </div>
          <div className="npi-ai-chat" ref={chatRef}>
            {aiMessages.map((m, i) => (
              <div key={i} className={`npi-ai-msg ${m.role}`}>
                {m.role === 'bot' && <div className="npi-ai-lbl">Notrya AI</div>}
                {m.text}
              </div>
            ))}
            {aiLoading && (
              <div className="npi-ai-msg loading">
                <div className="npi-tdot"/><div className="npi-tdot"/><div className="npi-tdot"/>
              </div>
            )}
          </div>
          <div className="npi-ai-input-wrap">
            <div className="npi-ai-row">
              <input className="npi-ai-input" value={aiInput} onChange={e=>setAiInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendAI()} placeholder="Ask about this patient..."/>
              <button className="npi-ai-send" onClick={()=>sendAI()}>↑</button>
            </div>
          </div>
        </aside>

      </div>

      {/* BOTTOM NAV */}
      <div className="npi-bnav">
        <div className="npi-bnav-tabs">
          {[
            {id:'demo',icon:'👤',label:'Demographics'},
            {id:'cc',icon:'🗣️',label:'CC'},
            {id:'vit',icon:'📊',label:'Vitals'},
            {id:'meds',icon:'💊',label:'Meds & PMH'},
            {id:'ros',icon:'🔍',label:'ROS'},
            {id:'pe',icon:'🩺',label:'Exam'},
            {id:'sum',icon:'📋',label:'Summary'},
            {id:'mdm',icon:'⚖️',label:'MDM'},
          ].map(t => (
            <button key={t.id} className={`npi-btab${currentTab === t.id ? ' active' : ''}`} onClick={() => showTab(t.id)}>
              <span className="npi-btab-icon">{t.icon}</span>{t.label}
            </button>
          ))}
          <div className="npi-bnav-divider"/>
          <button className="npi-btab npi-btab-er" onClick={() => navigate('/ERPlanBuilder')}>
            <span className="npi-btab-icon">🩺</span>ER Plan
          </button>
          <button className="npi-btab npi-btab-rx" onClick={() => navigate('/ERx')}>
            <span className="npi-btab-icon">💊</span>eRx
          </button>
        </div>
        <div className="npi-bnav-nav">
          <button className="npi-bnav-back" onClick={navBack}>← Back</button>
          <button className="npi-bnav-next" onClick={navNext}>Next →</button>
        </div>
      </div>
    </div>
  );
}