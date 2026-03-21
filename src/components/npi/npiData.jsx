export const CC_LIST = [
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

export const ROS_SYSTEMS = [
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

export const PE_SYSTEMS = [
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

export const PMH_SYSTEMS = [
  { id:'cardio', icon:'❤️', name:'Cardiovascular', conditions:['Hypertension','Coronary Artery Disease','Previous MI','Heart Failure','Atrial Fibrillation','Peripheral Vascular Disease','DVT / PE','Cardiomyopathy','Valvular Heart Disease','Aortic Stenosis','Aortic Aneurysm','Pacemaker / ICD'] },
  { id:'resp', icon:'🫁', name:'Respiratory', conditions:['Asthma','COPD','Obstructive Sleep Apnoea','Pulmonary Fibrosis','Pulmonary Hypertension','Previous PE','Bronchiectasis','Lung Cancer','Tuberculosis'] },
  { id:'neuro', icon:'🧠', name:'Neurological', conditions:["Previous Stroke / TIA","Epilepsy","Migraine","Dementia","Parkinson's Disease","Multiple Sclerosis","Peripheral Neuropathy","Spinal Cord Injury","Brain Tumour","Myasthenia Gravis"] },
  { id:'endo', icon:'⚗️', name:'Endocrine / Metabolic', conditions:["Type 2 Diabetes","Type 1 Diabetes","Hypothyroidism","Hyperthyroidism","Cushing's Syndrome","Addison's Disease","Hyperlipidaemia","Obesity","Gout","Metabolic Syndrome"] },
  { id:'gi', icon:'🫃', name:'Gastrointestinal', conditions:['Reflux / GORD','Peptic Ulcer Disease','Inflammatory Bowel Disease',"Crohn's Disease","Ulcerative Colitis","Chronic Liver Disease","Cirrhosis","Hepatitis B","Hepatitis C","Pancreatitis","Colorectal Cancer","Coeliac Disease"] },
  { id:'renal', icon:'🫗', name:'Renal / Urological', conditions:['CKD','Dialysis','Renal Transplant','Recurrent UTIs','Nephrolithiasis','Prostate Disease','Bladder Cancer','Polycystic Kidney Disease'] },
  { id:'msk', icon:'🦴', name:'Musculoskeletal', conditions:['Osteoarthritis','Rheumatoid Arthritis','Osteoporosis','Gout','Ankylosing Spondylitis','Systemic Lupus Erythematosus','Psoriatic Arthritis','Fibromyalgia','Previous Fracture'] },
  { id:'psych', icon:'🧘', name:'Psychiatric', conditions:['Depression','Anxiety','Bipolar Disorder','Schizophrenia','PTSD','ADHD','Eating Disorder','Substance Use Disorder','Alcohol Use Disorder','Insomnia'] },
  { id:'haem', icon:'🩸', name:'Haematologic / Oncologic', conditions:['Anaemia','Iron Deficiency','Sickle Cell Disease','Thalassaemia','Haemophilia','Leukaemia','Lymphoma','Myeloma','Previous Cancer','HIV/AIDS','Immunodeficiency'] },
  { id:'other', icon:'🏥', name:'Other', conditions:['Arthritis','Chronic Pain','Thyroid Cancer','Skin Cancer','Allergic Rhinitis','Eczema / Atopic Dermatitis','Psoriasis','Chronic Kidney Disease','Previous Surgery (other)','Transplant'] },
];

export const VITAL_DEFS = [
  {id:'bp',icon:'🫀',label:'Blood Pressure',unit:'mmHg',ph:'120/80',lo:null,hi:null,isText:true},
  {id:'hr',icon:'💓',label:'Heart Rate',unit:'bpm',ph:'60–100',lo:50,hi:100},
  {id:'rr',icon:'🌬️',label:'Resp Rate',unit:'breaths/min',ph:'12–20',lo:12,hi:20},
  {id:'spo2',icon:'🫧',label:'SpO₂',unit:'%',ph:'94–100',lo:94,hi:null},
  {id:'temp',icon:'🌡️',label:'Temperature',unit:'°C',ph:'36.5–37.5',lo:36.0,hi:37.8},
  {id:'gcs',icon:'🧠',label:'GCS',unit:'/15',ph:'15',lo:14,hi:null},
];

export const TABS = ['chart','demo','cc','vit','meds','ros','pe','mdm','discharge','autocoder'];