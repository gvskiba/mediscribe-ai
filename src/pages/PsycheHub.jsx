import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

(() => {
  if (document.getElementById("psyche-fonts")) return;
  const l = document.createElement("link");
  l.id = "psyche-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "psyche-css";
  s.textContent = `
    *{box-sizing:border-box;}
    ::-webkit-scrollbar{width:3px;} ::-webkit-scrollbar-track{background:transparent;}
    ::-webkit-scrollbar-thumb{background:rgba(107,99,255,0.4);border-radius:2px;}
    @keyframes fadeSlide{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    .psyche-fade{animation:fadeSlide .25s ease forwards;}
    .psyche-card:hover{transform:translateY(-1px);transition:transform .15s ease;}
  `;
  document.head.appendChild(s);
})();

const T = {
  bg:"#050f1e", panel:"#081628", card:"#0b1e36",
  b:"rgba(26,53,85,0.8)", bhi:"rgba(107,99,255,0.5)",
  txt:"#e8f0fe", txt2:"#8aaccc", txt3:"#4a6a8a", txt4:"#2e4a6a",
  purple:"#9b6dff", blue:"#3b9eff", teal:"#00e5c0",
  red:"#ff4444", orange:"#ff9f43", yellow:"#f5c842",
  green:"#3dffa0", coral:"#ff6b6b", pink:"#f472b6",
};
const glass = {
  backdropFilter:"blur(24px) saturate(180%)",
  WebkitBackdropFilter:"blur(24px) saturate(180%)",
  background:"rgba(8,22,40,0.78)",
  border:"1px solid rgba(107,99,255,0.25)",
  borderRadius:16,
};

// ── Clinical Data ──────────────────────────────────────────────────────────

const PROTOCOLS = [
  {
    id:"agitation",
    icon:"⚡",
    label:"Acute Agitation",
    category:"emergency",
    color:T.red,
    severity:"critical",
    subtitle:"Excited Delirium · Violence Risk · Behavioral Emergency",
    overview:"Acute agitation is a psychiatric emergency requiring rapid risk assessment and de-escalation. Verbal de-escalation is always first-line. Pharmacologic intervention is indicated when there is imminent danger to patient or staff.",
    assessment:[
      "Establish safety — position yourself near exit, do not block patient's exit",
      "STAMP: Staring, Tone, Anxiety, Mumbling, Pacing — precursors to violence",
      "Rule out organic cause: glucose, O2 sat, vitals, tox screen",
      "BEST: Brief, Empathic, Simple, Truthful communication",
      "Offer oral medications before parenteral",
    ],
    medications:[
      {drug:"Olanzapine (Zyprexa)", dose:"5–10 mg IM", note:"First-line for agitation. Avoid with benzodiazepines IM (respiratory depression risk).", level:"Level A"},
      {drug:"Haloperidol (Haldol)", dose:"5 mg IM ± lorazepam 2 mg IM", note:"Classic combo (B52: Haldol 5 + Ativan 2). Monitor QTc.", level:"Level A"},
      {drug:"Ziprasidone (Geodon)", dose:"10–20 mg IM", note:"Moderate efficacy; check QTc prior.", level:"Level B"},
      {drug:"Droperidol", dose:"5–10 mg IM/IV", note:"Rapid onset (10–15 min). QTc monitoring required. Highly effective.", level:"Level A"},
      {drug:"Ketamine", dose:"1–2 mg/kg IM or 0.5–1 mg/kg IV", note:"Reserved for extreme agitation (excited delirium). Rapid dissociation. Monitor airway.", level:"Level B"},
      {drug:"Lorazepam (Ativan)", dose:"1–2 mg IM/IV", note:"Preferred for EtOH/benzo withdrawal agitation. Avoid in COPD/elderly without monitoring.", level:"Level A"},
    ],
    redflags:[
      "Hyperthermia + agitation + tachycardia = excited delirium / NMS / serotonin syndrome",
      "Sudden calm after extreme agitation = exhaustion, not resolution — monitor closely",
      "Hypoxia in restrained patient — positional asphyxia risk",
    ],
    pearl:"Never use IM olanzapine and IM benzodiazepine together — risk of fatal respiratory depression. If benzos needed, switch to haloperidol IM.",
  },
  {
    id:"suicidal",
    icon:"🆘",
    label:"Suicidal Ideation & Risk Assessment",
    category:"emergency",
    color:T.orange,
    severity:"critical",
    subtitle:"SI · SA · Risk Stratification · Safety Planning",
    overview:"Suicide risk assessment is a core emergency medicine competency. Use a validated framework. All patients with suicidal ideation require structured assessment, documentation, and disposition planning.",
    assessment:[
      "C-SSRS: Columbia Suicide Severity Rating Scale — 5 ideation levels + behavior",
      "SAD PERSONS: Sex, Age, Depression, Previous attempt, EtOH/drugs, Rational thinking, Social support, Organized plan, No spouse, Sickness",
      "Assess: ideation (passive vs active), plan (specific vs vague), intent, means, lethality, timeline",
      "Protective factors: social support, religious beliefs, children at home, future orientation, engaged in treatment",
      "HIGH RISK: specific plan + lethal means + intent + previous attempt + substance use + hopelessness",
    ],
    medications:[
      {drug:"Benzodiazepine (acute)", dose:"Lorazepam 1–2 mg PO/IM", note:"For severe anxiety or agitation accompanying SI. Short-term only.", level:"Level B"},
      {drug:"Lithium (outpatient)", dose:"Therapeutic level 0.8–1.0 mEq/L", note:"Only medication with FDA indication for suicide risk reduction in bipolar disorder.", level:"Level A"},
      {drug:"Clozapine (outpatient)", dose:"Per psychiatry protocol", note:"Reduces suicidal behavior in schizophrenia/schizoaffective disorder.", level:"Level A"},
    ],
    redflags:[
      "Recent discharge from inpatient psych within 90 days — highest-risk window",
      "Intoxication at time of assessment — reassess when sober before disposition",
      "Access to firearms — lethal means counseling mandatory",
      "History of previous attempt — strongest predictor of future attempt",
    ],
    pearl:"Passive SI ('I wish I were dead') with no plan and strong protective factors = low risk. Active SI + specific plan + lethal means available + hopelessness = imminent high risk — involuntary hold.",
  },
  {
    id:"psychosis",
    icon:"🌀",
    label:"Acute Psychosis",
    category:"psychiatric",
    color:T.purple,
    severity:"urgent",
    subtitle:"First-Break · Exacerbation · Organic vs Functional",
    overview:"Acute psychosis requires systematic evaluation to exclude organic (medical) causes before attributing to a primary psychiatric disorder. First-break psychosis in particular demands thorough workup.",
    assessment:[
      "ALWAYS rule out organic: glucose, BMP, LFTs, TSH, RPR, HIV, B12, folate, UA",
      "CT head (new-onset psychosis without prior psychiatric history)",
      "Urine drug screen: cocaine, amphetamines, PCP, cannabis (>25% cannabis-induced psychosis)",
      "Positive symptoms: hallucinations, delusions, disorganized speech/behavior",
      "Negative symptoms: flat affect, alogia, avolition, anhedonia (harder to treat)",
      "Timeline: < 1 month = brief psychotic disorder; 1–6 months = schizophreniform; > 6 months = schizophrenia",
    ],
    medications:[
      {drug:"Olanzapine (Zyprexa)", dose:"5–10 mg PO/IM q6–12h", note:"Broad-spectrum. Monitor metabolic syndrome (weight, glucose, lipids).", level:"Level A"},
      {drug:"Risperidone (Risperdal)", dose:"1–4 mg PO BID", note:"Good for negative symptoms. Can cause EPS at higher doses.", level:"Level A"},
      {drug:"Haloperidol (Haldol)", dose:"2–5 mg PO/IM q4–8h", note:"Classic. High EPS risk — consider benztropine 1–2 mg prophylaxis.", level:"Level A"},
      {drug:"Quetiapine (Seroquel)", dose:"25–100 mg PO q12h", note:"Better tolerated. Use in elderly/Parkinson's. Sedating.", level:"Level A"},
      {drug:"Aripiprazole (Abilify)", dose:"9.75 mg IM or 10–30 mg PO", note:"Partial D2 agonist — lower metabolic risk, less sedating.", level:"Level B"},
    ],
    redflags:[
      "Hyperthermia + rigidity + autonomic instability + psychosis = NMS — stop antipsychotic immediately",
      "New-onset psychosis > 40 years old — rule out neurosyphilis, autoimmune encephalitis (anti-NMDAR)",
      "Auditory hallucinations commanding self-harm or harm to others — imminent risk",
    ],
    pearl:"Anti-NMDA receptor encephalitis (autoimmune) mimics schizophrenia perfectly — young woman, psychiatric symptoms, seizures, autonomic instability, CSF pleocytosis. Order anti-NMDAR antibodies in any first-break psychosis without clear etiology.",
  },
  {
    id:"nms",
    icon:"🔥",
    label:"Neuroleptic Malignant Syndrome (NMS)",
    category:"emergency",
    color:T.red,
    severity:"critical",
    subtitle:"Antipsychotic Emergency · Hyperthermia · Rigidity",
    overview:"NMS is a life-threatening idiosyncratic reaction to dopamine-blocking agents. Mortality 10–20% if untreated. STOP the offending agent immediately.",
    assessment:[
      "Classic tetrad: Fever (38.5–42°C) + Rigidity (lead-pipe) + AMS + Autonomic instability (HR, BP lability, diaphoresis)",
      "Onset: usually 24–72h after starting or increasing antipsychotic (can be up to 30 days)",
      "Labs: markedly elevated CK (> 1000, often > 10,000), leukocytosis, elevated LFTs",
      "Distinguish from serotonin syndrome: NMS = slower onset (days), lead-pipe rigidity; SS = rapid (hours), hyperreflexia + clonus",
      "DSM criteria: exposure to dopamine antagonist + hyperthermia + rigidity + ≥2 of: diaphoresis, dysphagia, tremor, incontinence, AMS, mutism, tachycardia, labile BP",
    ],
    medications:[
      {drug:"STOP antipsychotic NOW", dose:"Immediate discontinuation", note:"First and most critical intervention.", level:"Level A"},
      {drug:"Dantrolene", dose:"1–2.5 mg/kg IV q6h (max 10 mg/kg/day)", note:"Muscle relaxant — first-line pharmacologic. Also for malignant hyperthermia.", level:"Level A"},
      {drug:"Bromocriptine", dose:"2.5–10 mg PO/NG TID", note:"Dopamine agonist — treats underlying mechanism. Continue for 10 days post-resolution.", level:"Level B"},
      {drug:"Lorazepam", dose:"1–2 mg IV q4–6h", note:"For rigidity and autonomic instability. Useful adjunct.", level:"Level B"},
      {drug:"Active cooling", dose:"External: ice packs + cooling blankets", note:"Target temp < 38.5°C. Avoid antipyretics (not effective — not a fever from pyrogens).", level:"Level A"},
    ],
    redflags:[
      "CK > 5000 → rhabdomyolysis → IV fluids 250–500 mL/hr, target UOP > 200 mL/hr",
      "Respiratory failure from rigidity — early intubation if needed",
      "Restarting antipsychotic within 2 weeks = high relapse risk",
    ],
    pearl:"NMS and Malignant Hyperthermia share the same pharmacologic treatment (dantrolene). NMS = dopaminergic trigger (antipsychotics). MH = volatile anesthetic/succinylcholine trigger. Both = ICU, dantrolene, aggressive cooling.",
  },
  {
    id:"serotonin",
    icon:"⚠️",
    label:"Serotonin Syndrome",
    category:"emergency",
    color:T.orange,
    severity:"critical",
    subtitle:"Serotonergic Toxicity · Hyperthermia · Hyperreflexia",
    overview:"Serotonin syndrome results from excess serotonergic activity — typically from drug combinations. Hunter Criteria is the most sensitive diagnostic tool. Mild cases resolve with discontinuation; severe cases require cyproheptadine and ICU care.",
    assessment:[
      "Hunter Criteria (most sensitive): Serotonergic drug + ONE of: spontaneous clonus, inducible clonus + agitation/diaphoresis, ocular clonus + agitation/diaphoresis, tremor + hyperreflexia, hypertonia + T > 38°C + ocular/inducible clonus",
      "Classic triad: AMS + autonomic instability + neuromuscular abnormalities (clonus, hyperreflexia)",
      "Clonus is pathognomonic: ankle, ocular — check actively",
      "Common triggers: SSRI + TCA, SSRI + MAOi, linezolid + SSRI, tramadol + SSRI, fentanyl + MAOi, methylene blue + SSRI",
      "Onset rapid: within hours of drug addition or dose increase (distinguishes from NMS)",
    ],
    medications:[
      {drug:"STOP offending agent(s)", dose:"Immediate discontinuation", note:"Most critical first step.", level:"Level A"},
      {drug:"Cyproheptadine", dose:"12 mg PO loading dose, then 2 mg q2h (max 32 mg/day)", note:"Serotonin antagonist — specific antidote. Crush and give via NG if needed.", level:"Level B"},
      {drug:"Benzodiazepines", dose:"Lorazepam 2–4 mg IV", note:"For agitation, hyperthermia, seizures. Reduce muscle activity to decrease hyperthermia.", level:"Level A"},
      {drug:"Active cooling", dose:"Cooling blankets, ice packs, cool IV fluids", note:"Hyperthermia from muscle activity — treat aggressively.", level:"Level A"},
      {drug:"Chlorpromazine", dose:"50–100 mg IM (for refractory cases)", note:"Has antiserotonergic properties. Use with caution — can worsen autonomic instability.", level:"Level C"},
    ],
    redflags:[
      "Temp > 41°C = severe toxicity → intubation + paralysis (vecuronium, NOT succinylcholine if rhabdo risk)",
      "Avoid succinylcholine in suspected hyperkalemia from rhabdomyolysis",
      "MAOi combinations are the most dangerous — 24h serotonergic load",
    ],
    pearl:"NMS vs Serotonin Syndrome: NMS = slow onset (days), bradykinesia, lead-pipe rigidity; SS = rapid onset (hours), hyperkinesia, clonus. Both need the offending drug stopped but the treatment differs — dantrolene (NMS), cyproheptadine (SS).",
  },
  {
    id:"lithium",
    icon:"🧪",
    label:"Lithium Toxicity",
    category:"toxicology",
    color:T.yellow,
    severity:"urgent",
    subtitle:"Acute · Chronic · SILENT Syndrome",
    overview:"Lithium has a narrow therapeutic window (0.6–1.2 mEq/L). Toxicity can be acute (overdose), chronic (accumulation), or acute-on-chronic. Chronic toxicity is more dangerous at the same serum level due to CNS distribution.",
    assessment:[
      "Therapeutic level: 0.6–1.2 mEq/L (maintenance); 0.8–1.0 mEq/L (bipolar acute)",
      "Mild toxicity (1.5–2.0): nausea, tremor, polyuria, mild cognitive slowing",
      "Moderate (2.0–2.5): coarse tremor, confusion, ataxia, dysarthria",
      "Severe (> 2.5): seizures, coma, arrhythmias, permanent neurological damage",
      "SILENT Syndrome: persistent neurological deficits despite normalized serum levels (cerebellar syndrome, cognitive impairment)",
      "ECG: T-wave flattening/inversions, bradycardia, Brugada-like pattern in severe toxicity",
    ],
    medications:[
      {drug:"IV 0.9% NaCl", dose:"250–500 mL/hr (maintain good urine output)", note:"Volume repletes sodium — drives lithium excretion. Most important intervention.", level:"Level A"},
      {drug:"Hemodialysis", dose:"Emergent if level > 4.0 or > 2.5 with severe symptoms", note:"Definitively removes lithium. Goal: level < 1.0 post-dialysis.", level:"Level A"},
      {drug:"Hold diuretics, NSAIDs, ACEi/ARBs", dose:"Drug cessation", note:"These drugs reduce lithium clearance — critically important.", level:"Level A"},
    ],
    redflags:[
      "Chronic toxicity can cause permanent cerebellar syndrome at seemingly moderate levels",
      "Nephrogenic DI: chronic lithium → polyuria, polydipsia — can cause severe dehydration → toxicity",
      "Sodium depletion (low Na diet, sweating, diarrhea) → acute lithium toxicity in stable patients",
    ],
    pearl:"Lithium is the only psychiatric drug that requires dialysis for toxicity. The threshold is NOT just the serum level — a patient with a level of 2.0 who is confused, ataxic, and has renal impairment needs dialysis now.",
  },
  {
    id:"bipolar",
    icon:"🔄",
    label:"Bipolar Disorder — Acute Episodes",
    category:"psychiatric",
    color:T.blue,
    severity:"urgent",
    subtitle:"Mania · Mixed · Depressive Episodes",
    overview:"Bipolar disorder in the ED presents most commonly as acute mania or mixed states. Accurate diagnosis prevents inappropriate SSRI monotherapy, which can precipitate rapid cycling or mixed states.",
    assessment:[
      "Mania criteria: ≥ 1 week (or any duration if hospitalized) of elevated/expansive/irritable mood + ↑ goal-directed activity + ≥ 3 of: grandiosity, decreased sleep need, pressured speech, flight of ideas, distractibility, psychomotor agitation, risky behavior",
      "Bipolar I: full manic episode (may have psychosis, hospitalization required)",
      "Bipolar II: hypomanic (< 1 week, less severe) + depressive episodes (NO full mania)",
      "Cyclothymia: subthreshold fluctuations ≥ 2 years",
      "NEVER give SSRI monotherapy in bipolar depression — can precipitate mania/mixed state/rapid cycling",
    ],
    medications:[
      {drug:"Olanzapine (Zyprexa)", dose:"5–20 mg PO/IM daily", note:"FDA approved for acute mania and bipolar depression. First-line for acute manic episode.", level:"Level A"},
      {drug:"Lithium", dose:"900–1800 mg/day in divided doses (level-guided)", note:"Gold standard mood stabilizer. Reduces suicide risk. Requires monitoring.", level:"Level A"},
      {drug:"Valproate (Depakote)", dose:"Loading: 20 mg/kg IV or PO; Maintenance 1000–3000 mg/day", note:"Rapidly effective for acute mania. Check LFTs, CBC, ammonia. Teratogenic.", level:"Level A"},
      {drug:"Aripiprazole (Abilify)", dose:"15–30 mg PO daily", note:"Acute mania — FDA approved. Lower metabolic risk than olanzapine.", level:"Level A"},
      {drug:"Quetiapine (Seroquel)", dose:"300–800 mg/day", note:"Approved for both mania and bipolar depression. Sedating — useful acutely.", level:"Level A"},
    ],
    redflags:[
      "Bipolar depression treated with SSRI alone = risk of switch to mania or rapid cycling",
      "Valproate + lamotrigine: inhibits lamotrigine metabolism → toxic levels → Stevens-Johnson syndrome",
      "First-episode mania > 40 years old: rule out neurological cause (frontal lobe tumor, CNS lupus, HIV)",
    ],
    pearl:"The most dangerous error in bipolar disorder is prescribing an SSRI for depressive symptoms without a mood stabilizer. Always ask: 'Has this patient ever had a manic or hypomanic episode?' before initiating antidepressant therapy.",
  },
  {
    id:"withdrawal_psych",
    icon:"💊",
    label:"Psychiatric Medication Discontinuation",
    category:"toxicology",
    color:T.teal,
    severity:"moderate",
    subtitle:"SSRI/SNRI · Antipsychotic · Benzodiazepine",
    overview:"Abrupt discontinuation of psychiatric medications causes clinically significant syndromes. Recognition prevents misdiagnosis and inappropriate treatment.",
    assessment:[
      "SSRI/SNRI Discontinuation Syndrome: FINISH — Flu-like, Insomnia, Nausea, Imbalance, Sensory disturbance (electric shocks), Hyperarousal. Onset 1–3 days after stopping.",
      "Paroxetine (Paxil) highest risk; fluoxetine lowest risk (long half-life self-tapering)",
      "Antipsychotic withdrawal: rebound psychosis, insomnia, nausea, anxiety (distinguish from relapse)",
      "Benzodiazepine withdrawal: anxiety, insomnia, tremor, seizures (life-threatening in chronic use). CIWA-Ar scale.",
      "Clonidine withdrawal: severe rebound hypertension — can be life-threatening",
    ],
    medications:[
      {drug:"SSRI discontinuation", dose:"Restart original SSRI then taper slowly", note:"Fluoxetine bridge: switch to fluoxetine 20 mg for 1 week then taper — long half-life smooths withdrawal.", level:"Level A"},
      {drug:"Benzo withdrawal (mild–moderate)", dose:"Long-acting benzo (diazepam, chlordiazepoxide) taper per CIWA-Ar", note:"CIWA-Ar score guides dosing. Score > 10: PRN lorazepam. Score > 15: aggressive treatment.", level:"Level A"},
      {drug:"Benzo withdrawal (severe)", dose:"Diazepam 5–10 mg IV q5–10 min titrated to sedation", note:"Phenobarbital for refractory benzo withdrawal seizures. High-dose benzo may be needed.", level:"Level A"},
    ],
    redflags:[
      "Benzo withdrawal seizures can occur up to 7–10 days after last dose (especially with long-acting benzos)",
      "SSRI discontinuation syndrome ≠ relapse — reassess symptom timeline",
      "Antipsychotic withdrawal = rebound dopamine supersensitivity — may present as psychosis",
    ],
    pearl:"Phenobarbital is emerging as the preferred agent for severe alcohol and benzo withdrawal — weight-based dosing, long half-life, no ceiling effect, and less addiction potential than benzodiazepines.",
  },
];

const SCREENING = [
  {
    id:"phq9",
    label:"PHQ-9 (Depression)",
    color:T.blue,
    description:"Patient Health Questionnaire — 9-item depression screening and severity scale. Validated for major depressive disorder in primary care and ED settings.",
    scoring:[
      {range:"0–4",  label:"Minimal/None",  color:T.green,  action:"Psychoeducation; reassess in 1 month"},
      {range:"5–9",  label:"Mild",          color:T.teal,   action:"Watchful waiting; reassess in 2–4 weeks"},
      {range:"10–14",label:"Moderate",      color:T.yellow, action:"Treatment plan — therapy, consider pharmacotherapy"},
      {range:"15–19",label:"Mod-Severe",    color:T.orange, action:"Antidepressant + therapy; close follow-up"},
      {range:"≥ 20", label:"Severe",        color:T.red,    action:"Immediate treatment; consider inpatient"},
    ],
    pearl:"Item 9 (suicidal ideation) must always be reviewed regardless of total score. A single '1' on item 9 triggers full suicide risk assessment.",
  },
  {
    id:"gad7",
    label:"GAD-7 (Anxiety)",
    color:T.purple,
    description:"Generalized Anxiety Disorder 7-item scale. Also screens for panic disorder, social anxiety, and PTSD.",
    scoring:[
      {range:"0–4",  label:"Minimal",  color:T.green,  action:"Reassurance; lifestyle modifications"},
      {range:"5–9",  label:"Mild",     color:T.teal,   action:"Psychoeducation; consider brief CBT"},
      {range:"10–14",label:"Moderate", color:T.yellow, action:"Further evaluation + treatment plan"},
      {range:"≥ 15", label:"Severe",   color:T.red,    action:"Active treatment — pharmacotherapy + therapy"},
    ],
    pearl:"GAD-7 ≥ 10 has 89% sensitivity and 82% specificity for GAD. Also useful for panic disorder (≥ 8) and PTSD (≥ 10).",
  },
  {
    id:"audit",
    label:"AUDIT (Alcohol Use)",
    color:T.orange,
    description:"Alcohol Use Disorders Identification Test — 10-item WHO-validated screening tool for hazardous and harmful alcohol use.",
    scoring:[
      {range:"0–7",   label:"Low Risk",       color:T.green,  action:"No intervention indicated"},
      {range:"8–15",  label:"Hazardous Use",  color:T.yellow, action:"Simple brief advice (SBA)"},
      {range:"16–19", label:"Harmful Use",    color:T.orange, action:"Brief counseling + monitoring"},
      {range:"≥ 20",  label:"Dependent",      color:T.red,    action:"Referral for diagnostic evaluation and treatment"},
    ],
    pearl:"AUDIT-C (first 3 questions) is a rapid 3-item version useful for busy clinical environments. Score ≥ 3 (women) or ≥ 4 (men) is positive.",
  },
  {
    id:"mmse",
    label:"MMSE / MoCA (Cognition)",
    color:T.teal,
    description:"Mini-Mental State Exam and Montreal Cognitive Assessment for rapid cognitive screening. MoCA is more sensitive for mild cognitive impairment.",
    scoring:[
      {range:"≥ 26/30",label:"Normal (MoCA)",      color:T.green,  action:"No cognitive impairment likely"},
      {range:"18–25",   label:"Mild CI",            color:T.yellow, action:"Neuropsychological testing; neurology referral"},
      {range:"10–17",   label:"Moderate Dementia",  color:T.orange, action:"Safety assessment; support services"},
      {range:"< 10",    label:"Severe Dementia",    color:T.red,    action:"Supervised care; assess capacity"},
    ],
    pearl:"MoCA is preferred over MMSE for detecting mild cognitive impairment (MCI). MMSE misses ~30% of MCI cases that MoCA detects.",
  },
];

const TABS = [
  {id:"protocols", label:"Clinical Protocols", icon:"🧠"},
  {id:"screening", label:"Screening Tools",    icon:"📋"},
  {id:"pearls",    label:"Key Pearls",         icon:"💎"},
];

const PEARLS = [
  {color:T.red,    text:"Excited delirium: hyperthermia + agitation + tachycardia after restraint = emergency. Positional restraint → positional asphyxia. Keep patient upright or lateral."},
  {color:T.orange, text:"Never use IM olanzapine + IM benzodiazepine simultaneously — combination can cause fatal respiratory arrest. Use haloperidol if a benzo is also planned."},
  {color:T.purple, text:"Anti-NMDA receptor encephalitis mimics schizophrenia in young women — psychiatric symptoms + seizures + autonomic instability + CSF pleocytosis. Order antibodies in first-break psychosis."},
  {color:T.yellow, text:"NMS vs Serotonin Syndrome: NMS = days onset, lead-pipe rigidity, bradykinesia. SS = hours onset, clonus, hyperreflexia. Both = stop offending drug. NMS → dantrolene; SS → cyproheptadine."},
  {color:T.blue,   text:"SSRI monotherapy for 'depression' in undiagnosed bipolar disorder can precipitate mania, mixed states, or rapid cycling. Always screen for prior hypomanic/manic episodes before starting antidepressants."},
  {color:T.teal,   text:"Lithium toxicity: chronic toxicity is more neurotoxic than acute at the same serum level. SILENT syndrome = permanent cerebellar damage. Hemodialysis threshold: level > 4.0 or > 2.5 with severe symptoms."},
  {color:T.green,  text:"PHQ-9 item 9 (suicidal ideation): any positive response requires full structured suicide risk assessment regardless of total PHQ-9 score."},
  {color:T.coral,  text:"Benzodiazepine withdrawal seizures can occur up to 7–10 days after last dose. Always ask about benzo use in any patient presenting with new-onset seizures."},
  {color:T.pink,   text:"Valproate is teratogenic (neural tube defects). Always check pregnancy status before prescribing. Requires reliable contraception in women of childbearing age."},
  {color:T.orange, text:"Clozapine is the only antipsychotic proven effective for treatment-resistant schizophrenia, but requires weekly CBC monitoring (agranulocytosis risk ~1%). Do not stop abruptly — rebound psychosis."},
];

// ── UI Primitives ─────────────────────────────────────────────────────────

function AmbientBg() {
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0}}>
      <div style={{position:"absolute",top:"-10%",left:"-5%",width:"50%",height:"50%",background:"radial-gradient(circle,rgba(155,109,255,0.08) 0%,transparent 70%)"}}/>
      <div style={{position:"absolute",bottom:"-10%",right:"-5%",width:"45%",height:"45%",background:"radial-gradient(circle,rgba(59,158,255,0.06) 0%,transparent 70%)"}}/>
      <div style={{position:"absolute",top:"50%",left:"40%",width:"30%",height:"30%",background:"radial-gradient(circle,rgba(244,114,182,0.04) 0%,transparent 70%)"}}/>
    </div>
  );
}

function RiskBadge({ level }) {
  const c = level === "critical" ? T.red : level === "urgent" ? T.orange : level === "moderate" ? T.yellow : T.green;
  return (
    <span style={{fontFamily:"JetBrains Mono",fontSize:9,fontWeight:700,color:c,background:`${c}20`,border:`1px solid ${c}44`,padding:"2px 8px",borderRadius:4,textTransform:"uppercase",letterSpacing:1,flexShrink:0}}>
      {level}
    </span>
  );
}

function BulletRow({ text, color }) {
  return (
    <div style={{display:"flex",gap:7,alignItems:"flex-start",marginBottom:5}}>
      <span style={{color:color||T.teal,fontSize:9,marginTop:3,flexShrink:0}}>▸</span>
      <span style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.5}}>{text}</span>
    </div>
  );
}

function ProtocolCard({ protocol, expanded, onToggle }) {
  return (
    <div className="psyche-card" onClick={onToggle}
      style={{...glass,cursor:"pointer",overflow:"hidden",borderTop:`3px solid ${protocol.color}`,
        border:`1px solid ${expanded ? protocol.color+"55" : "rgba(107,99,255,0.25)"}`,
        borderTopColor:protocol.color,transition:"border-color .15s"}}>
      <div style={{padding:"16px 18px"}}>
        <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
          <span style={{fontSize:26,flexShrink:0}}>{protocol.icon}</span>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:3}}>
              <span style={{fontFamily:"DM Sans",fontWeight:700,fontSize:15,color:protocol.color}}>{protocol.label}</span>
              <RiskBadge level={protocol.severity}/>
            </div>
            <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,marginBottom:5}}>{protocol.subtitle}</div>
            <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.5}}>{protocol.overview}</div>
          </div>
          <span style={{color:T.txt4,fontSize:14,flexShrink:0}}>{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {expanded && (
        <div className="psyche-fade" style={{borderTop:"1px solid rgba(107,99,255,0.2)",padding:"16px 18px 20px"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
            {/* Assessment */}
            <div>
              <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Assessment Steps</div>
              {protocol.assessment.map((a,i) => <BulletRow key={i} text={a} color={protocol.color}/>)}
            </div>

            {/* Medications */}
            <div>
              <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Pharmacotherapy</div>
              {protocol.medications.map((med,i) => (
                <div key={i} style={{padding:"9px 11px",borderRadius:8,background:"rgba(14,37,68,0.5)",border:"1px solid rgba(42,79,122,0.3)",marginBottom:6,borderLeft:`2px solid ${protocol.color}40`}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:3}}>
                    <span style={{fontFamily:"DM Sans",fontWeight:700,fontSize:12,color:T.txt}}>{med.drug}</span>
                    <span style={{fontFamily:"JetBrains Mono",fontSize:9,color:med.level==="Level A"?T.teal:med.level==="Level B"?T.blue:T.txt4,background:med.level==="Level A"?"rgba(0,229,192,0.1)":"rgba(59,158,255,0.1)",border:`1px solid ${med.level==="Level A"?"rgba(0,229,192,0.3)":"rgba(59,158,255,0.3)"}`,padding:"1px 6px",borderRadius:4}}>{med.level}</span>
                  </div>
                  <div style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.yellow,marginBottom:3}}>{med.dose}</div>
                  <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt3,lineHeight:1.4}}>{med.note}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Red Flags */}
          <div style={{marginTop:14}}>
            <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.red,textTransform:"uppercase",letterSpacing:1,marginBottom:7}}>🚨 Red Flags</div>
            {protocol.redflags.map((rf,i) => (
              <div key={i} style={{display:"flex",gap:8,alignItems:"flex-start",marginBottom:5,padding:"7px 10px",background:"rgba(255,68,68,0.07)",border:"1px solid rgba(255,68,68,0.15)",borderRadius:7}}>
                <span style={{color:T.red,fontSize:9,marginTop:2,flexShrink:0}}>⚠</span>
                <span style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.4}}>{rf}</span>
              </div>
            ))}
          </div>

          {/* Pearl */}
          <div style={{marginTop:12,padding:"12px 14px",background:`linear-gradient(135deg,${protocol.color}12,rgba(8,22,40,0.8))`,border:`1px solid ${protocol.color}30`,borderRadius:10}}>
            <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:protocol.color,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>💎 Clinical Pearl</div>
            <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt,lineHeight:1.65,fontStyle:"italic"}}>{protocol.pearl}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function ScreeningCard({ tool, expanded, onToggle }) {
  return (
    <div className="psyche-card" onClick={onToggle}
      style={{...glass,cursor:"pointer",overflow:"hidden",borderLeft:`3px solid ${tool.color}`,transition:"border-color .15s"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 18px"}}>
        <div style={{flex:1}}>
          <div style={{fontFamily:"DM Sans",fontWeight:700,fontSize:14,color:tool.color,marginBottom:3}}>{tool.label}</div>
          <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt3,lineHeight:1.4}}>{tool.description}</div>
        </div>
        <span style={{color:T.txt4,fontSize:14,flexShrink:0}}>{expanded ? "▲" : "▼"}</span>
      </div>
      {expanded && (
        <div className="psyche-fade" style={{borderTop:"1px solid rgba(107,99,255,0.2)",padding:"14px 18px 16px"}}>
          <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Scoring Guide</div>
          {tool.scoring.map((s,i) => (
            <div key={i} style={{display:"grid",gridTemplateColumns:"80px 120px 1fr",gap:10,padding:"7px 0",borderBottom:"1px solid rgba(42,79,122,0.15)"}}>
              <span style={{fontFamily:"JetBrains Mono",fontSize:10,fontWeight:700,color:s.color}}>{s.range}</span>
              <span style={{fontFamily:"DM Sans",fontWeight:600,fontSize:11,color:s.color}}>{s.label}</span>
              <span style={{fontFamily:"DM Sans",fontSize:11,color:T.txt3,lineHeight:1.3}}>{s.action}</span>
            </div>
          ))}
          <div style={{marginTop:12,padding:"10px 12px",background:`${tool.color}10`,border:`1px solid ${tool.color}30`,borderRadius:8}}>
            <span style={{fontFamily:"JetBrains Mono",fontSize:9,color:tool.color,marginRight:6}}>💎</span>
            <span style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,fontStyle:"italic"}}>{tool.pearl}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function PsycheHub() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("protocols");
  const [expanded, setExpanded] = useState(null);
  const toggle = useCallback(id => setExpanded(p => p === id ? null : id), []);

  return (
    <div style={{fontFamily:"DM Sans",background:T.bg,minHeight:"100vh",position:"relative",overflow:"hidden"}}>
      <AmbientBg/>
      <div style={{position:"relative",zIndex:1,maxWidth:1440,margin:"0 auto",padding:"0 20px"}}>

        {/* Header */}
        <div style={{padding:"18px 0 14px"}}>
          <button onClick={() => navigate("/hub")}
            style={{display:"inline-flex",alignItems:"center",gap:6,marginBottom:14,padding:"6px 14px",borderRadius:8,border:"1px solid rgba(107,99,255,0.35)",background:"rgba(14,37,68,0.6)",color:T.txt3,fontFamily:"DM Sans",fontSize:12,fontWeight:600,cursor:"pointer",transition:"all .15s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(155,109,255,0.6)";e.currentTarget.style.color=T.txt;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(107,99,255,0.35)";e.currentTarget.style.color=T.txt3;}}>
            ← Back to Hub
          </button>

          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
            <div style={{backdropFilter:"blur(40px)",WebkitBackdropFilter:"blur(40px)",background:"rgba(5,15,30,0.85)",border:"1px solid rgba(107,99,255,0.3)",borderRadius:10,padding:"5px 12px",display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.purple,letterSpacing:3}}>NOTRYA</span>
              <span style={{color:T.txt4,fontFamily:"JetBrains Mono",fontSize:10}}>/</span>
              <span style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.txt3,letterSpacing:2}}>PSYCHE HUB</span>
            </div>
            <div style={{height:1,flex:1,background:"linear-gradient(90deg,rgba(107,99,255,0.5),transparent)"}}/>
            <span style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,letterSpacing:1}}>{PROTOCOLS.length} PROTOCOLS</span>
          </div>

          <h1 style={{fontFamily:"Playfair Display",fontSize:"clamp(26px,4vw,42px)",fontWeight:900,letterSpacing:-1,lineHeight:1.1,background:"linear-gradient(135deg,#e8f0fe,#9b6dff,#f472b6)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>
            Psychiatry Hub
          </h1>
          <p style={{fontFamily:"DM Sans",fontSize:12,color:T.txt3,marginTop:4}}>
            Psychiatric emergencies · Pharmacology · Screening tools · Key clinical pearls
          </p>
        </div>

        {/* Stat Banner */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(155px,1fr))",gap:10,marginBottom:16}}>
          {[
            {label:"Agitation",  value:"De-escalate",sub:"Verbal first-line",     color:T.red   },
            {label:"NMS tx",     value:"Dantrolene", sub:"Stop antipsychotic",     color:T.orange},
            {label:"SS tx",      value:"Cypro 12mg", sub:"Cyproheptadine loading", color:T.yellow},
            {label:"Li toxicity",value:"Dialysis",   sub:"Level > 4.0 or severe", color:T.teal  },
            {label:"WCT + psych",value:"VT First",   sub:"Rule out cardiac QTc",  color:T.purple},
          ].map((b,i) => (
            <div key={i} style={{...glass,padding:"10px 14px",borderLeft:`3px solid ${b.color}`,background:`linear-gradient(135deg,${b.color}12,rgba(8,22,40,0.8))`}}>
              <div style={{fontFamily:"JetBrains Mono",fontSize:14,fontWeight:700,color:b.color}}>{b.value}</div>
              <div style={{fontFamily:"DM Sans",fontWeight:600,color:T.txt,fontSize:10,margin:"2px 0"}}>{b.label}</div>
              <div style={{fontFamily:"DM Sans",fontSize:10,color:T.txt4}}>{b.sub}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{...glass,padding:"7px",display:"flex",gap:5,marginBottom:16,flexWrap:"wrap"}}>
          {TABS.map(t => (
            <button key={t.id} onClick={()=>{setTab(t.id);setExpanded(null);}}
              style={{flex:"1 1 auto",fontFamily:"DM Sans",fontWeight:600,fontSize:12,padding:"9px 8px",borderRadius:10,cursor:"pointer",whiteSpace:"nowrap",transition:"all .15s",
                border:`1px solid ${tab===t.id?"rgba(155,109,255,0.5)":"transparent"}`,
                background:tab===t.id?"rgba(155,109,255,0.15)":"transparent",
                color:tab===t.id?T.purple:T.txt3}}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* PROTOCOLS TAB */}
        {tab === "protocols" && (
          <div className="psyche-fade">
            <div style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.purple,textTransform:"uppercase",letterSpacing:2,marginBottom:14}}>
              Clinical Protocols — Click any card to expand
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {PROTOCOLS.map(p => (
                <ProtocolCard key={p.id} protocol={p} expanded={expanded===p.id} onToggle={()=>toggle(p.id)}/>
              ))}
            </div>
          </div>
        )}

        {/* SCREENING TAB */}
        {tab === "screening" && (
          <div className="psyche-fade">
            <div style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.purple,textTransform:"uppercase",letterSpacing:2,marginBottom:6}}>
              Validated Screening Tools
            </div>
            <div style={{padding:"10px 14px",background:"rgba(155,109,255,0.07)",border:"1px solid rgba(155,109,255,0.2)",borderRadius:10,marginBottom:16,fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.7}}>
              🧠 Screening tools are not diagnostic — they quantify symptom severity and guide treatment decisions. Always interpret in full clinical context. PHQ-9 item 9 always triggers suicide risk assessment regardless of total score.
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {SCREENING.map(tool => (
                <ScreeningCard key={tool.id} tool={tool} expanded={expanded===tool.id} onToggle={()=>toggle(tool.id)}/>
              ))}
            </div>
          </div>
        )}

        {/* PEARLS TAB */}
        {tab === "pearls" && (
          <div className="psyche-fade">
            <div style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.purple,textTransform:"uppercase",letterSpacing:2,marginBottom:14}}>
              Key Clinical Pearls — High-yield psychiatry for emergency medicine
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(400px,1fr))",gap:12}}>
              {PEARLS.map((pearl,i) => (
                <div key={i} style={{...glass,padding:"16px 18px",borderLeft:`3px solid ${pearl.color}`,background:`linear-gradient(135deg,${pearl.color}08,rgba(8,22,40,0.8))`}}>
                  <div style={{display:"flex",gap:10}}>
                    <span style={{color:pearl.color,fontSize:14,flexShrink:0,marginTop:2}}>💎</span>
                    <span style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.65}}>{pearl.text}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{textAlign:"center",paddingBottom:24,paddingTop:16}}>
          <span style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,letterSpacing:1.5}}>
            NOTRYA PSYCHE HUB · CLINICAL REFERENCE ONLY — NOT A SUBSTITUTE FOR FORMAL PSYCHIATRIC EVALUATION · ALWAYS INVOLVE PSYCHIATRY FOR COMPLEX CASES
          </span>
        </div>
      </div>
    </div>
  );
}