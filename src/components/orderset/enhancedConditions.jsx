// Enhanced condition library for OrderSetBuilder
export const ENHANCED_CONDITIONS = [
  // Cardiovascular
  { id: 'chf_exacerbation', name: 'CHF Exacerbation', category: 'Cardiovascular', icd10: 'I50.9', tags: ['URGENT'], description: 'Acute Decompensated Heart Failure' },
  { id: 'acute_mi', name: 'Acute Myocardial Infarction (STEMI)', category: 'Cardiovascular', icd10: 'I21.3' },
  { id: 'nstemi', name: 'Non-ST Elevation MI (NSTEMI)', category: 'Cardiovascular', icd10: 'I21.4' },
  { id: 'unstable_angina', name: 'Unstable Angina', category: 'Cardiovascular', icd10: 'I20.0' },
  { id: 'acute_chf', name: 'Acute Congestive Heart Failure', category: 'Cardiovascular', icd10: 'I50.9' },
  { id: 'afib_rvr', name: 'Atrial Fibrillation with RVR', category: 'Cardiovascular', icd10: 'I48.91' },
  { id: 'hypertensive_emergency', name: 'Hypertensive Emergency', category: 'Cardiovascular', icd10: 'I16.9' },
  { id: 'pulmonary_edema', name: 'Acute Pulmonary Edema', category: 'Cardiovascular', icd10: 'J81.0' },
  { id: 'vte_dvt', name: 'Deep Vein Thrombosis', category: 'Cardiovascular', icd10: 'I82.40' },
  { id: 'pe', name: 'Pulmonary Embolism', category: 'Cardiovascular', icd10: 'I26.99' },
  { id: 'aortic_dissection', name: 'Aortic Dissection', category: 'Cardiovascular', icd10: 'I71.00' },

  // Respiratory
  { id: 'copd_exacerbation', name: 'COPD Exacerbation', category: 'Respiratory', icd10: 'J44.1' },
  { id: 'asthma_exacerbation', name: 'Acute Asthma Exacerbation', category: 'Respiratory', icd10: 'J45.901' },
  { id: 'pneumonia_cap', name: 'Community-Acquired Pneumonia', category: 'Respiratory', icd10: 'J18.9' },
  { id: 'pneumonia_hap', name: 'Hospital-Acquired Pneumonia', category: 'Respiratory', icd10: 'J18.9' },
  { id: 'acute_respiratory_failure', name: 'Acute Respiratory Failure', category: 'Respiratory', icd10: 'J96.00' },
  { id: 'pneumothorax', name: 'Pneumothorax', category: 'Respiratory', icd10: 'J93.9' },
  { id: 'pleural_effusion', name: 'Pleural Effusion', category: 'Respiratory', icd10: 'J94.8' },

  // Critical Care
  { id: 'sepsis_septic_shock', name: 'Sepsis / Septic Shock', category: 'Critical Care', icd10: 'A41.9', tags: ['STAT'], description: 'Acute Life-Threatening Infection' },
  
  // Infectious Disease
  { id: 'sepsis', name: 'Sepsis', category: 'Infectious Disease', icd10: 'A41.9' },
  { id: 'severe_sepsis', name: 'Severe Sepsis', category: 'Infectious Disease', icd10: 'R65.20' },
  { id: 'septic_shock', name: 'Septic Shock', category: 'Infectious Disease', icd10: 'R65.21' },
  { id: 'uti', name: 'Urinary Tract Infection', category: 'Infectious Disease', icd10: 'N39.0' },
  { id: 'pyelonephritis', name: 'Acute Pyelonephritis', category: 'Infectious Disease', icd10: 'N10' },
  { id: 'cellulitis', name: 'Cellulitis', category: 'Infectious Disease', icd10: 'L03.90' },
  { id: 'meningitis', name: 'Bacterial Meningitis', category: 'Infectious Disease', icd10: 'G00.9' },
  { id: 'endocarditis', name: 'Infective Endocarditis', category: 'Infectious Disease', icd10: 'I33.0' },
  { id: 'c_diff', name: 'Clostridioides difficile Infection', category: 'Infectious Disease', icd10: 'A04.7' },

  // Neurological
  { id: 'acute_ischemic_stroke', name: 'Acute Ischemic Stroke', category: 'Neurological', icd10: 'I63.9', tags: ['STAT'], description: 'Acute Stroke With Potential tPA Protocol' },
  { id: 'acute_stroke', name: 'Acute Ischemic Stroke', category: 'Neurological', icd10: 'I63.9' },
  { id: 'ich', name: 'Intracerebral Hemorrhage', category: 'Neurological', icd10: 'I61.9' },
  { id: 'sah', name: 'Subarachnoid Hemorrhage', category: 'Neurological', icd10: 'I60.9' },
  { id: 'seizure', name: 'Seizure Disorder', category: 'Neurological', icd10: 'R56.9' },
  { id: 'status_epilepticus', name: 'Status Epilepticus', category: 'Neurological', icd10: 'G41.901' },
  { id: 'altered_mental_status', name: 'Altered Mental Status', category: 'Neurological', icd10: 'R41.82' },
  { id: 'encephalopathy', name: 'Metabolic Encephalopathy', category: 'Neurological', icd10: 'G93.41' },
  { id: 'gbs', name: 'Guillain-Barré Syndrome', category: 'Neurological', icd10: 'G61.0' },

  // Gastrointestinal
  { id: 'gi_bleed_upper', name: 'Upper GI Bleeding', category: 'Gastrointestinal', icd10: 'K92.2' },
  { id: 'gi_bleed_lower', name: 'Lower GI Bleeding', category: 'Gastrointestinal', icd10: 'K92.2' },
  { id: 'acute_pancreatitis', name: 'Acute Pancreatitis', category: 'Gastrointestinal', icd10: 'K85.90' },
  { id: 'cholecystitis', name: 'Acute Cholecystitis', category: 'Gastrointestinal', icd10: 'K81.0' },
  { id: 'bowel_obstruction', name: 'Small Bowel Obstruction', category: 'Gastrointestinal', icd10: 'K56.60' },
  { id: 'appendicitis', name: 'Acute Appendicitis', category: 'Gastrointestinal', icd10: 'K35.80' },
  { id: 'diverticulitis', name: 'Acute Diverticulitis', category: 'Gastrointestinal', icd10: 'K57.92' },
  { id: 'hepatic_encephalopathy', name: 'Hepatic Encephalopathy', category: 'Gastrointestinal', icd10: 'K72.90' },
  { id: 'cirrhosis', name: 'Cirrhosis with Ascites', category: 'Gastrointestinal', icd10: 'K74.60' },

  // Renal/Metabolic
  { id: 'aki', name: 'Acute Kidney Injury', category: 'Renal', icd10: 'N17.9' },
  { id: 'hyperkalemia', name: 'Hyperkalemia', category: 'Renal', icd10: 'E87.5' },
  { id: 'hyponatremia', name: 'Hyponatremia', category: 'Renal', icd10: 'E87.1' },
  { id: 'metabolic_acidosis', name: 'Metabolic Acidosis', category: 'Renal', icd10: 'E87.2' },
  { id: 'dka', name: 'Diabetic Ketoacidosis (DKA)', category: 'Endocrinology', icd10: 'E10.10', tags: ['URGENT'], description: 'Acute DKA — ADA Protocol' },
  { id: 'hhs', name: 'Hyperosmolar Hyperglycemic State', category: 'Endocrine', icd10: 'E11.01' },
  { id: 'hypoglycemia', name: 'Severe Hypoglycemia', category: 'Endocrine', icd10: 'E16.2' },
  { id: 'thyroid_storm', name: 'Thyroid Storm', category: 'Endocrine', icd10: 'E05.91' },
  { id: 'myxedema_coma', name: 'Myxedema Coma', category: 'Endocrine', icd10: 'E03.5' },
  { id: 'adrenal_crisis', name: 'Adrenal Crisis', category: 'Endocrine', icd10: 'E27.2' },

  // Hematologic/Oncologic
  { id: 'anemia_severe', name: 'Severe Anemia', category: 'Hematologic', icd10: 'D64.9' },
  { id: 'thrombocytopenia', name: 'Thrombocytopenia', category: 'Hematologic', icd10: 'D69.6' },
  { id: 'dic', name: 'Disseminated Intravascular Coagulation', category: 'Hematologic', icd10: 'D65' },
  { id: 'ttp', name: 'Thrombotic Thrombocytopenic Purpura', category: 'Hematologic', icd10: 'M31.1' },
  { id: 'sickle_cell_crisis', name: 'Sickle Cell Crisis', category: 'Hematologic', icd10: 'D57.00' },
  { id: 'neutropenic_fever', name: 'Febrile Neutropenia', category: 'Oncologic', icd10: 'D70.9' },
  { id: 'tumor_lysis', name: 'Tumor Lysis Syndrome', category: 'Oncologic', icd10: 'E88.3' },
  { id: 'svc_syndrome', name: 'Superior Vena Cava Syndrome', category: 'Oncologic', icd10: 'I87.1' },

  // Trauma/Orthopedic
  { id: 'polytrauma', name: 'Polytrauma', category: 'Trauma', icd10: 'T07' },
  { id: 'head_injury', name: 'Traumatic Brain Injury', category: 'Trauma', icd10: 'S06.9' },
  { id: 'spinal_cord_injury', name: 'Spinal Cord Injury', category: 'Trauma', icd10: 'S14.109A' },
  { id: 'rib_fractures', name: 'Multiple Rib Fractures', category: 'Trauma', icd10: 'S22.4' },
  { id: 'pelvic_fracture', name: 'Pelvic Fracture', category: 'Trauma', icd10: 'S32.9' },
  { id: 'compartment_syndrome', name: 'Compartment Syndrome', category: 'Orthopedic', icd10: 'T79.A0' },

  // Obstetric
  { id: 'preeclampsia_severe', name: 'Severe Preeclampsia', category: 'Obstetric', icd10: 'O14.1' },
  { id: 'eclampsia', name: 'Eclampsia', category: 'Obstetric', icd10: 'O15.0' },
  { id: 'hellp', name: 'HELLP Syndrome', category: 'Obstetric', icd10: 'O14.2' },
  { id: 'postpartum_hemorrhage', name: 'Postpartum Hemorrhage', category: 'Obstetric', icd10: 'O72.1' },

  // Toxicology
  { id: 'opioid_overdose', name: 'Opioid Overdose', category: 'Toxicology', icd10: 'T40.2X1A' },
  { id: 'acetaminophen_overdose', name: 'Acetaminophen Toxicity', category: 'Toxicology', icd10: 'T39.1X1A' },
  { id: 'salicylate_toxicity', name: 'Salicylate Toxicity', category: 'Toxicology', icd10: 'T39.0X1A' },
  { id: 'alcohol_withdrawal', name: 'Alcohol Withdrawal', category: 'Toxicology', icd10: 'F10.239' },
  { id: 'serotonin_syndrome', name: 'Serotonin Syndrome', category: 'Toxicology', icd10: 'G25.79' },

  // Other Critical Conditions
  { id: 'anaphylaxis', name: 'Anaphylaxis', category: 'Immunologic', icd10: 'T78.2XXA' },
  { id: 'angioedema', name: 'Angioedema', category: 'Immunologic', icd10: 'T78.3XXA' },
  { id: 'rhabdomyolysis', name: 'Rhabdomyolysis', category: 'Metabolic', icd10: 'M62.82' },
  { id: 'hypothermia', name: 'Severe Hypothermia', category: 'Environmental', icd10: 'T68' },
  { id: 'heat_stroke', name: 'Heat Stroke', category: 'Environmental', icd10: 'T67.0' },
];

export const CONDITION_CATEGORIES = [
  'All Conditions',
  'Cardiology',
  'Critical Care',
  'Cardiovascular',
  'Respiratory',
  'Infectious Disease',
  'Neurological',
  'Gastrointestinal',
  'Renal',
  'Endocrine',
  'Endocrinology',
  'Hematologic',
  'Oncologic',
  'Trauma',
  'Orthopedic',
  'Obstetric',
  'Toxicology',
  'Immunologic',
  'Metabolic',
  'Environmental'
];