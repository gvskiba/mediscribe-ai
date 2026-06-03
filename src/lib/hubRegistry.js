// Hub registry with routes and keywords for global search
export const HUBS = [
  { name: "🚨 Critical Protocols", route: "/CriticalProtocolsPage", keywords: ["critical", "protocols", "emergency", "urgent", "life-threatening"] },
  { name: "Anaphylaxis", route: "/AnaphylaxisHub", keywords: ["anaphylaxis", "allergic reaction", "epinephrine", "allergy"] },
  { name: "Hyperkalemia", route: "/HyperkalemiaHub", keywords: ["hyperkalemia", "potassium", "k+", "ecg changes"] },
  { name: "Status Epilepticus", route: "/StatusEpilepticusHub", keywords: ["status epilepticus", "seizure", "se", "refractory seizure"] },
  { name: "Airway RSI", route: "/AirwayRSIHub", keywords: ["airway", "rsi", "intubation", "rapid sequence"] },
  { name: "DKA", route: "/DKAHub", keywords: ["dka", "diabetic ketoacidosis", "ketoacidosis", "hyperglycemia"] },
  { name: "Massive PE", route: "/MassivePEHub", keywords: ["pe", "pulmonary embolism", "massive pe", "dvt"] },
  { name: "Hypertensive Emergency", route: "/HypertensiveEmergencyHub", keywords: ["hypertensive emergency", "hypertension", "stroke", "eclampsia"] },
  { name: "ADHF", route: "/ADHFHub", keywords: ["adhf", "acute decompensated heart failure", "heart failure", "chf"] },
  { name: "Meningitis", route: "/MeningitisHub", keywords: ["meningitis", "cns infection", "bacterial meningitis"] },
  { name: "Rhabdomyolysis", route: "/RhabdomyolysisHub", keywords: ["rhabdomyolysis", "rhabdo", "crush injury", "ck"] },
  { name: "Adrenal Crisis", route: "/AdrenalCrisisHub", keywords: ["adrenal crisis", "adrenal insufficiency", "addisonian"] },
  { name: "Thyroid Storm", route: "/ThyroidStormHub", keywords: ["thyroid storm", "hyperthyroidism", "thyroid"] },
  { name: "Acute Liver Failure", route: "/AcuteLiverFailureHub", keywords: ["acute liver failure", "alf", "fulminant hepatic"] },
  { name: "Acute Ischemic Stroke", route: "/AcuteIschemicStrokeHub", keywords: ["stroke", "ais", "cva", "tpa", "thrombectomy"] },
  { name: "SAH", route: "/SAHHub", keywords: ["sah", "subarachnoid hemorrhage", "aneurysm"] },
  { name: "Myasthenic Crisis", route: "/MyasthenicCrisisHub", keywords: ["myasthenic crisis", "myasthenia gravis", "mg"] },
  { name: "Cardiogenic Shock", route: "/CardiogenicShockHub", keywords: ["cardiogenic shock", "shock", "hypotension"] },
  { name: "Massive GI Bleed", route: "/MassiveGIBleedHub", keywords: ["gi bleed", "gastrointestinal bleed", "upper gi", "lower gi"] },
  { name: "MTP", route: "/MTPHub", keywords: ["mtp", "massive transfusion protocol", "trauma"] },
  { name: "Heat Stroke", route: "/HeatStrokeHub", keywords: ["heat stroke", "hyperthermia", "heatstroke"] },
  { name: "Hyponatremia", route: "/HyponatremiaHub", keywords: ["hyponatremia", "sodium", "na+", "siadh"] },
  { name: "Hypercalcemia", route: "/HypercalcemiaHub", keywords: ["hypercalcemia", "calcium", "ca2+"] },
  { name: "NMS", route: "/NMSHub", keywords: ["nms", "neuroleptic malignant syndrome"] },
  { name: "STEMI", route: "/STEMIHub", keywords: ["stemi", "st elevation", "mi", "myocardial infarction"] },
  { name: "Cardiac Tamponade", route: "/CardiacTamponadeHub", keywords: ["cardiac tamponade", "tamponade", "pericardial"] },
  { name: "Status Asthmaticus", route: "/StatusAsthmaticusHub", keywords: ["status asthmaticus", "asthma", "severe asthma"] },
  { name: "Tension Pneumothorax", route: "/TensionPneumothoraxHub", keywords: ["tension pneumothorax", "pneumothorax", "tpn"] },
  { name: "Alcohol Withdrawal", route: "/AlcoholWithdrawalHub", keywords: ["alcohol withdrawal", "withdrawal", "ciwa", "delirium tremens"] },
  { name: "Toxic Alcohol", route: "/ToxicAlcoholHub", keywords: ["toxic alcohol", "methanol", "ethylene glycol", "isopropanol"] },
  { name: "Sympathomimetic", route: "/SympathomimeticHub", keywords: ["sympathomimetic", "cocaine", "meth", "mdma", "stimulant"] },
  { name: "TTP", route: "/TTPHub", keywords: ["ttp", "thrombotic thrombocytopenic purpura"] },
  { name: "Anticoagulant Reversal", route: "/AnticoagulantReversalHub", keywords: ["anticoagulant reversal", "anticoagulation", "reversal"] },
  { name: "Sickle Cell", route: "/SickleCellHub", keywords: ["sickle cell", "scd", "vaso-occlusive"] },
  { name: "HELLP", route: "/HELLPHub", keywords: ["hellp", "preeclampsia", "eclampsia", "pregnancy"] },
  { name: "Postpartum Hemorrhage", route: "/PostPartumHemorrhageHub", keywords: ["postpartum hemorrhage", "pph", "obstetric bleed"] },
  { name: "Sepsis", route: "/SepsisHub", keywords: ["sepsis", "septic shock", "infection"] },
  { name: "EMTALA", route: "/EMTALAHub", keywords: ["emtala", "transfer", "mse", "medical screening"] },
  { name: "Cardiac Hub", route: "/cardiac-hub", keywords: ["cardiac", "cardiology", "heart"] },
  { name: "Trauma Hub", route: "/trauma-hub", keywords: ["trauma", "injury"] },
  { name: "OB/GYN Hub", route: "/OBGYNHub", keywords: ["obstetrics", "gynecology", "ob/gyn", "pregnancy"] },
  { name: "Airway Hub", route: "/AirwayHub", keywords: ["airway", "intubation"] },
  { name: "Toxicology Hub", route: "/ToxHub", keywords: ["toxicology", "tox", "poisoning"] },
  { name: "Lab Hub", route: "/LabHub", keywords: ["lab", "laboratory", "labs"] },
  { name: "ECG Hub", route: "/ECGHub", keywords: ["ecg", "ekg", "electrocardiogram"] },
  { name: "Shock Hub", route: "/ShockHub", keywords: ["shock", "hypotension"] },
  { name: "POCUS Hub", route: "/POCUSHub", keywords: ["pocus", "ultrasound"] },
  { name: "Procedure Hub", route: "/procedure-hub", keywords: ["procedure", "procedural"] },
  { name: "Order Dashboard", route: "/OrderDashboard", keywords: ["orders", "order dashboard", "clinical orders", "order management", "pending orders"] },
];

export function searchHubs(query) {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  return HUBS.filter(hub =>
    hub.name.toLowerCase().includes(q) ||
    hub.keywords.some(kw => kw.includes(q))
  ).sort((a, b) => {
    const aNameMatch = a.name.toLowerCase().indexOf(q);
    const bNameMatch = b.name.toLowerCase().indexOf(q);
    return aNameMatch - bNameMatch;
  });
}