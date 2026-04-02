import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";

// ── Font Injection ────────────────────────────────────────────────────
(() => {
  if (document.getElementById("psych-fonts")) return;
  const l = document.createElement("link");
  l.id = "psych-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "psych-css";
  s.textContent = `
    *{box-sizing:border-box;margin:0;padding:0;}
    ::-webkit-scrollbar{width:3px;} ::-webkit-scrollbar-track{background:transparent;}
    ::-webkit-scrollbar-thumb{background:rgba(42,79,122,0.5);border-radius:2px;}
    @keyframes fadeSlide{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.6}}
    .fade-in{animation:fadeSlide .25s ease forwards;}
    .shimmer-text{background:linear-gradient(90deg,#e8f0fe 0%,#fff 30%,#9b6dff 52%,#00e5c0 72%,#e8f0fe 100%);background-size:250% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 5s linear infinite;}
    .risk-pulse{animation:pulse 1.6s ease-in-out infinite;}
  `;
  document.head.appendChild(s);
})();

const T = {
  bg:"#050f1e", panel:"#081628", card:"#0b1e36",
  b:"rgba(26,53,85,0.8)", bhi:"rgba(42,79,122,0.9)",
  txt:"#e8f0fe", txt2:"#8aaccc", txt3:"#4a6a8a", txt4:"#2e4a6a",
  red:"#ff4444", orange:"#ff9f43", yellow:"#f5c842", green:"#3dffa0",
  blue:"#3b9eff", purple:"#9b6dff", teal:"#00e5c0", coral:"#ff6b6b",
};
const glass = {backdropFilter:"blur(24px) saturate(200%)",WebkitBackdropFilter:"blur(24px) saturate(200%)",background:"rgba(8,22,40,0.75)",border:"1px solid rgba(42,79,122,0.35)",borderRadius:16};

// ── Agitation Escalation Data ─────────────────────────────────────────
const TIERS = [
  { tier:0, label:"Verbal De-escalation", color:T.teal, icon:"💬",
    when:"Always attempt first — for every patient, every time",
    tips:[
      "STAMP survey: Staff safety, Triggers, Anxiety level, Motives, Proxemics — assess safety before approaching",
      "Reduce stimulation: quiet room, dim lights, clear extra personnel, maintain safe distance (6 ft)",
      "Non-threatening posture: seated, open hands, eye-level, turned slightly (not face-on)",
      "Validate distress — 'I can see you are very upset. Help me understand what is happening for you.'",
      "Offer choices and control — 'Would you prefer water or juice? Would you like to sit or stand?'",
      "Set clear, calm limits — state what WILL happen, not what won't. One staff member speaks at a time.",
      "Avoid: commands, threats, sarcasm, challenging delusions directly, arguing or power struggles",
      "Document your de-escalation attempts, duration, and why they were insufficient if you proceed",
    ],
    drugs:[],
  },
  { tier:1, label:"Oral / Sublingual", color:T.green, icon:"💊",
    when:"Cooperative patient willing to accept medication",
    tips:[],
    drugs:[
      {name:"Olanzapine ODT", dose:"10 mg SL",  elder:"5 mg", onset:"15–30 min", ind:"Psychosis, mania, agitation", note:"ODT dissolves on tongue — ideal for reluctant patients. Highly effective and fast for an oral agent.", warn:"NEVER combine with IM benzodiazepines — respiratory arrest risk (FDA black box)"},
      {name:"Haloperidol",    dose:"5 mg PO",   elder:"2 mg", onset:"30–60 min", ind:"Psychosis, agitation", note:"First-generation antipsychotic. Slower onset than SL olanzapine. Can combine with lorazepam PO.", warn:"Avoid in Parkinson disease and Lewy body dementia — severe EPS and NMS risk"},
      {name:"Lorazepam",      dose:"1–2 mg PO", elder:"0.5 mg", onset:"30–60 min", ind:"Anxiety, agitation, substance withdrawal", note:"Preferred agent when withdrawal is suspected. Can combine with antipsychotic.", warn:"Respiratory depression risk — monitor in COPD, OSA, or polysubstance intoxication"},
      {name:"Diazepam",       dose:"5–10 mg PO",elder:"2.5 mg", onset:"30–60 min", ind:"Alcohol withdrawal, anxiety", note:"Longer half-life provides smoother coverage for alcohol withdrawal.", warn:"Accumulates in elderly and hepatic impairment — use lorazepam instead"},
    ],
  },
  { tier:2, label:"Intramuscular", color:T.yellow, icon:"💉",
    when:"Verbal + oral failed, refuses oral medication, moderate-severe agitation",
    tips:[],
    drugs:[
      {name:"Droperidol IM",       dose:"5 mg IM",      elder:"2.5 mg", onset:"5–10 min",  ind:"First-line IM in many EM settings — faster and more sedating than haloperidol", note:"FDA black box for QTc overstated at EM doses. Superior onset to haloperidol. Get ECG if dose > 2.5mg IV.", warn:"Monitor QTc — avoid if known QTc > 500ms"},
      {name:"Olanzapine IM",        dose:"10 mg IM",     elder:"5 mg",   onset:"15–30 min", ind:"Psychosis, mania", note:"Highly effective. Must be administered at a separate site from any injectable benzodiazepine.", warn:"ABSOLUTE CONTRAINDICATION: Do NOT combine olanzapine IM with any IM benzodiazepine — fatal cardiorespiratory arrest"},
      {name:"Haloperidol + Lorazepam", dose:"Haldol 5 mg + Ativan 2 mg IM", elder:"2.5 + 1 mg", onset:"15–30 min", ind:"General agitation, undifferentiated etiology", note:"Classic 'B52' adds diphenhydramine 50mg IM. Combination is safe and effective. Can give in same syringe.", warn:"Monitor respiratory status. Diphenhydramine adds anticholinergic burden"},
      {name:"Midazolam IM",          dose:"5 mg IM",      elder:"2.5 mg", onset:"5–10 min",  ind:"Fastest IM onset — preferred when rapid control is paramount", note:"Onset faster than any other IM option. Good for unknown etiology — covers withdrawal.", warn:"Respiratory depression — airway monitoring mandatory. Duration shorter than lorazepam (30–60 min)"},
      {name:"Ketamine IM",           dose:"4–5 mg/kg IM", elder:"Reduce 20%", onset:"3–5 min", ind:"Extreme agitation, PMDB, excited delirium syndrome (ExDS)", note:"Most reliable agent for ExDS. Preserves airway reflexes. Have RSI equipment at bedside.", warn:"Laryngospasm possible — bag-valve-mask ready. Avoid in known HTN emergency or aortic dissection. Increases secretions."},
    ],
  },
  { tier:3, label:"Intravenous", color:T.red, icon:"🩸",
    when:"IV access present; refractory to IM; hemodynamic compromise; pre-RSI",
    tips:[],
    drugs:[
      {name:"Droperidol IV",   dose:"2.5–5 mg IV", elder:"1.25 mg", onset:"5–10 min",  ind:"Agitation with IV access — preferred over haloperidol IV", note:"Slow IV push. ECG monitoring. More sedating than haloperidol.", warn:"QTc monitoring required"},
      {name:"Ketamine IV",     dose:"1–2 mg/kg IV",elder:"0.5–1 mg/kg", onset:"1–2 min", ind:"Rapid dissociative sedation, pre-RSI for agitated patient", note:"Dissociative at 1–1.5 mg/kg. Maintains spontaneous respirations. Ideal RSI bridge.", warn:"Laryngospasm — intubation equipment at bedside. Transient BP/ICP elevation"},
      {name:"Midazolam IV",    dose:"2–5 mg IV",   elder:"1–2 mg", onset:"2–5 min",  ind:"Rapid titrateable sedation", note:"Titrate slowly to effect. Short duration (30–60 min). Useful when precise titration needed.", warn:"Respiratory depression — airway monitoring mandatory. Paradoxical agitation in elderly"},
      {name:"Haloperidol IV",  dose:"5 mg IV",     elder:"2.5 mg", onset:"< 10 min", ind:"ICU delirium, less sedating option", note:"Slow push over 2 min. Less sedating than droperidol — useful for mild agitation requiring antipsychotic effect.", warn:"QTc prolongation. Avoid in Parkinson disease / Lewy body dementia"},
      {name:"Propofol IV",     dose:"0.5–1 mg/kg IV",elder:"Reduce",onset:"30–60 sec",ind:"Intubated patients only — ICU deep sedation", note:"Only for patients with protected airway. Provides deep, titratable sedation.", warn:"Apnea — intubated patients only. Propofol infusion syndrome in prolonged high-dose infusions"},
    ],
  },
];

const EXDS = {
  label:"Excited Delirium Syndrome (ExDS)",
  features:["Extreme agitation disproportionate to situation","Superhuman strength, imperviousness to pain","Hyperthermia (rectal temp > 40°C) — key mortality predictor","Diaphoresis, nakedness, bizarre behavior","Sudden cessation of struggle = pre-arrest event"],
  management:["Ketamine IM 4–5 mg/kg — fastest reliable sedation for ExDS","Aggressive active cooling — fans, ice packs, cool IV fluids","CK, BMP, troponin — rhabdomyolysis workup","ECG — hyperkalemia, QTc from heat","Anticipate need for airway — have RSI equipment at bedside"],
  warning:"ExDS is a medical emergency with mortality up to 10%. Hyperthermia drives death. Ketamine + cooling is the intervention — do not delay.",
};

// ── SI / HI Risk Assessment Data ─────────────────────────────────────
const SI_CATS = [
  { id:"ideation", label:"Ideation & Intent", color:T.red, isProtective:false, items:[
    {id:"passive_si", label:"Passive SI — wishes to be dead, does not want to wake up, passive thoughts", w:1},
    {id:"active_si",  label:"Active SI — specific thoughts of killing or harming oneself", w:2},
    {id:"plan",       label:"Has a specific plan — method, location, and/or timing identified", w:3},
    {id:"intent",     label:"States clear intent to carry out the plan", w:4},
    {id:"prep_behav", label:"Preparatory behavior — obtained means, wrote goodbye notes, gave away possessions", w:5},
  ]},
  { id:"hi", label:"Homicidal Ideation", color:T.red, isProtective:false, items:[
    {id:"passive_hi", label:"Passive HI — general thoughts of harming others without specific plan", w:2},
    {id:"active_hi",  label:"Active HI — specific intent to harm another person", w:4},
    {id:"hi_target",  label:"Identified target — specific named person with stated intent to harm", w:5},
  ]},
  { id:"static", label:"Static Risk Factors", color:T.orange, isProtective:false, items:[
    {id:"prior_attempt", label:"Prior suicide attempt — single strongest predictor of future attempt", w:3},
    {id:"psych_dx",      label:"Psychiatric diagnosis — MDD, bipolar, schizophrenia, BPD, PTSD", w:1},
    {id:"substance",     label:"Active substance use disorder — alcohol, opioids, stimulants", w:2},
    {id:"chronic_ill",   label:"Chronic pain, terminal illness, or recent serious medical diagnosis", w:1},
    {id:"fam_hx_si",     label:"Family history of suicide or suicide attempt", w:1},
  ]},
  { id:"dynamic", label:"Acute / Dynamic Risk", color:T.orange, isProtective:false, items:[
    {id:"access_means", label:"Access to lethal means — firearms in home, stockpiled medications", w:3},
    {id:"hopeless",     label:"Expressing hopelessness, helplessness, or feeling like a burden to others", w:2},
    {id:"recent_loss",  label:"Recent significant loss — relationship, employment, finances, bereavement", w:2},
    {id:"intox_now",    label:"Currently intoxicated — significantly increases impulsivity and lethality", w:2},
    {id:"recent_dc",    label:"Recent psychiatric inpatient discharge within 90 days", w:2},
  ]},
  { id:"protective", label:"Protective Factors", color:T.green, isProtective:true, items:[
    {id:"reasons_living", label:"Articulates clear reasons for living — children, family, faith, future goals", w:-2},
    {id:"social_support", label:"Strong social support — family, friends, stable housing", w:-1},
    {id:"engaged",        label:"Engaged with treatment — voluntary presentation, willing to safety plan", w:-2},
    {id:"no_means",       label:"No access to lethal means — no firearms, medications secured", w:-2},
    {id:"ambivalent",     label:"Expresses ambivalence — glad they came to ED, does not fully want to die", w:-1},
  ]},
];

// ── Medical Clearance Data ────────────────────────────────────────────
const MEDCLEAR_CATS = [
  { label:"History", color:T.blue, items:[
    "Chief complaint in patient's own words — document exact language",
    "Psychiatric history: diagnoses, prior hospitalizations, outpatient providers, medications",
    "Substance use history: type, frequency, last use, CAGE/AUDIT screen",
    "Medical history: chronic conditions, prior head trauma, surgeries",
    "Current medications (psychiatric and medical) and recent changes",
    "Allergies — relevant to sedation and psychiatric medications",
    "Safety history: prior attempts (method, medical severity), self-harm, violence",
  ]},
  { label:"Vital Signs", color:T.teal, note:"Must be normal or explained before psychiatric disposition", items:[
    "Blood pressure — hypertension may indicate withdrawal, stimulant use, or pain",
    "Heart rate — tachycardia: anxiety vs. withdrawal vs. stimulant vs. organic",
    "Temperature — fever requires medical workup; hypothermia with intoxication",
    "SpO2 ≥ 95% on room air (or at baseline for patient with known pulmonary disease)",
    "Respiratory rate — abnormal RR may indicate intoxication or organic pathology",
    "Blood glucose — hypoglycemia mimics AMS, agitation, and psychosis",
  ]},
  { label:"Physical Examination", color:T.teal, items:[
    "Full mental status exam: orientation, attention, memory, language, abstraction",
    "Neurological: cranial nerves, motor strength, reflexes, gait, cerebellar testing",
    "Head: scalp inspection for trauma, Battle sign (mastoid ecchymosis), raccoon eyes",
    "Neck: nuchal rigidity — meningismus screen; carotid bruits if embolic risk",
    "Skin: track marks, rash, jaundice, diaphoresis, signs of injury or abuse",
    "Abdomen: bowel sounds, tenderness, distension, hepatosplenomegaly",
  ]},
  { label:"Laboratory Workup", color:T.purple, note:"No universal 'psych clearance panel' — direct labs by clinical concern", items:[
    "Blood glucose — mandatory in all AMS and agitation presentations",
    "Blood alcohol level — acute intoxication delays psychiatric disposition",
    "Urine drug screen — informs clinical picture; positive UDS alone does not deny clearance",
    "BMP — electrolytes, renal function (especially elderly, altered, or overdose)",
    "Beta-hCG — all women of childbearing age without documented sterilization",
    "Salicylate + acetaminophen levels — all intentional ingestions, regardless of stated substance",
    "TSH + B12 — new psychiatric presentation, cognitive changes, or no labs in > 1 year",
    "CBC + LFTs — if infection suspected, alcohol use, or complex medication regimen",
    "Troponin + ECG — suspected TCA overdose, cardiac history, or suicidal ingestion",
  ]},
  { label:"Neuroimaging Indications", color:T.yellow, note:"CT head is NOT required for all psychiatric patients — clinical indication required", items:[
    "CT head WITHOUT contrast: head trauma (mechanism or signs), age > 50 with first psychiatric break",
    "CT head WITH contrast: focal neurological deficits, new-onset psychosis, suspected CNS mass",
    "LP consideration: fever + AMS + nuchal rigidity — bacterial meningitis until proven otherwise",
    "MRI brain: subacute onset, progressive symptoms, suspected autoimmune encephalitis",
  ]},
  { label:"Clearance Criteria", color:T.green, note:"Medical clearance = organic etiology reasonably excluded, not all labs normal", items:[
    "No acute medical illness identified that explains the psychiatric presentation",
    "Vital signs normal or at documented baseline for the patient",
    "BAL < 200 mg/dL (many institutions require < 80 mg/dL) — allow time to metabolize",
    "No evidence of delirium: acute onset, waxing/waning, inattention, disorganized thinking",
    "Cause of any AMS has been identified and addressed (or excluded)",
    "Patient cooperative enough for meaningful psychiatric interview",
  ]},
];

// ── Capacity Evaluation Data ──────────────────────────────────────────
const CAP_ELS = [
  { n:1, label:"Understanding", icon:"🧠", color:T.blue,
    desc:"Can the patient understand the information relevant to the decision?",
    method:"Provide information in plain language. Ask patient to repeat back in their own words.",
    questions:["Can you tell me what condition we found and why treatment is being recommended?","What risks did the doctor explain about this treatment?","What happens if you decide not to have the treatment?"],
    impaired:"Cognitive impairment, delirium, dementia, intellectual disability, acute psychosis, or severe intoxication may impair understanding.",
    note:"Understanding can be improved with better communication — simplify language, use visual aids, repeat with teach-back before concluding impairment.",
  },
  { n:2, label:"Appreciation", icon:"🪞", color:T.purple,
    desc:"Does the patient appreciate that the information applies to their own situation?",
    method:"Distinguish knowing facts from accepting their personal applicability. Watch for denial rooted in psychiatric illness.",
    questions:["Do you believe you have [diagnosis]?","What do you think will happen to YOUR health if you do not accept treatment?","Why do you think the doctors are recommending this for you?"],
    impaired:"Psychotic denial ('I am not sick, the doctors are lying'), anosognosia after brain injury, severe depression with distorted hopelessness.",
    note:"Appreciation is the most clinically nuanced element. A patient may state facts correctly but deny they apply — this is the impairment.",
  },
  { n:3, label:"Reasoning", icon:"⚖️", color:T.yellow,
    desc:"Can the patient engage in rational reasoning to compare alternatives?",
    method:"Ask the patient to walk through their decision-making process. Assess the process — not the conclusion.",
    questions:["How did you come to this decision?","What are your reasons for choosing [option]?","Have you thought about what might happen with each option?"],
    impaired:"Delusional reasoning ('I refuse because the hospital is poisoning me'), manic impulsivity, severe depression with cognitive distortion, substance intoxication.",
    note:"A patient has the RIGHT to make a decision others disagree with — the question is whether the reasoning process is intact, not whether the choice is wise.",
  },
  { n:4, label:"Communication of Choice", icon:"🗣️", color:T.teal,
    desc:"Can the patient consistently express a stable decision?",
    method:"Patient must be able to state their choice clearly. Assess stability across the interview.",
    questions:["What is your decision about [treatment/procedure]?","Is that your final decision?","A few minutes ago you said [X] — is that still what you want?"],
    impaired:"Delirium (fluctuating), severe psychosis, extreme anxiety, or intoxication may prevent consistent expression.",
    note:"Communication does not need to be verbal — patients with motor impairment can nod, use communication boards, or write. Communication of Choice is usually the easiest element to assess.",
  },
];

// ── Intoxication Syndromes ────────────────────────────────────────────
const INTOX = [
  { id:"etoh", label:"Alcohol Intoxication / Withdrawal", color:T.orange, icon:"🍺",
    presentation:"Intoxication: CNS depression, ataxia, disinhibition, dysarthria. Withdrawal: tremor, diaphoresis, tachycardia, hypertension, seizures, delirium tremens.",
    findings:["Withdrawal onset: 6–24h; DTs: 48–96h after last drink","CIWA-Ar ≥ 10: benzodiazepine treatment. CIWA ≥ 20: aggressive tx, ICU","Wernicke triad: AMS + ataxia + ophthalmoplegia — thiamine BEFORE any glucose","BAL of zero + tachycardia + diaphoresis = early withdrawal — treat"],
    management:"Intoxication: supportive, airway monitoring. Withdrawal: CIWA-guided diazepam or lorazepam. Thiamine 100–500mg IV. Magnesium replacement. Phenobarbital loading for benzodiazepine-refractory seizures.",
    pitfall:"Alcohol withdrawal is potentially fatal. A sober (BAL = 0) chronic drinker who is diaphoretic and tremulous is in withdrawal — do not wait for BAL to 'confirm.'",
  },
  { id:"stim", label:"Stimulant Intoxication (Cocaine / Meth)", color:T.red, icon:"⚡",
    presentation:"Agitation, paranoia, psychosis, hyperthermia, diaphoresis, hypertension, tachycardia, mydriasis. Excited delirium syndrome in extremis.",
    findings:["Sympathomimetic toxidrome: HTN + tachy + diaphoresis + hyperthermia + mydriasis","ExDS: extreme agitation + hyperthermia + superhuman strength = medical emergency","Cocaine: chest pain — coronary vasospasm, STEMI possible even in young patients","Meth: prolonged psychosis that may outlast intoxication by days to weeks"],
    management:"Benzodiazepines first-line for agitation. Ketamine IM for ExDS. Aggressive cooling for hyperthermia. Avoid beta-blockers in cocaine (unopposed alpha causes hypertensive crisis). Antipsychotics for persistent psychosis.",
    pitfall:"Do NOT give beta-blockers for cocaine-induced hypertension or tachycardia — unopposed alpha-adrenergic stimulation can cause severe HTN crisis. Use benzodiazepines or CCBs.",
  },
  { id:"opioid", label:"Opioid Intoxication / Withdrawal", color:T.purple, icon:"💊",
    presentation:"Intoxication: CNS depression, respiratory depression, miosis, bradypnea. Withdrawal: agitation, diaphoresis, piloerection, vomiting, diarrhea, myalgias — miserable but not fatal.",
    findings:["Classic triad: miosis + bradypnea + CNS depression = opioid until proven otherwise","Naloxone 0.4–2mg IV/IM/IN — titrate to adequate respirations, NOT full reversal","Fentanyl analogs: may require > 10mg naloxone total — infusion often needed","COWS scale for withdrawal severity — clonidine 0.1mg + symptomatic treatment"],
    management:"Naloxone for overdose — titrate to adequate respirations to avoid precipitating withdrawal. Repeat dosing or infusion for fentanyl. Clonidine + antiemetics + antidiarrheals for withdrawal. Buprenorphine initiation from ED is now standard of care.",
    pitfall:"Full rapid naloxone reversal precipitates acute opioid withdrawal — highly uncomfortable and causes the patient to leave AMA against medical advice. Titrate to adequate breathing, not full awakening.",
  },
  { id:"benzo", label:"Benzodiazepine Intoxication / Withdrawal", color:T.blue, icon:"🔵",
    presentation:"Intoxication: sedation, ataxia, dysarthria, respiratory depression (mainly in polysubstance). Withdrawal: anxiety, tremor, seizures, delirium — potentially fatal.",
    findings:["Benzo intoxication alone rarely fatal — resp depression primarily with co-ingestion","No practical reversal agent — flumazenil is contraindicated in dependent patients","Withdrawal timeline: short-acting (alprazolam, lorazepam): 24h; long-acting (diazepam): 3–5 days","Benzo withdrawal seizures: clinically identical to alcohol withdrawal seizures"],
    management:"Intoxication: supportive care, airway management, respiratory monitoring. Withdrawal: cross-taper with long-acting benzodiazepine (diazepam) or phenobarbital loading.",
    pitfall:"Flumazenil should almost never be used in the ED — can precipitate acute severe withdrawal seizures and status epilepticus in physically dependent patients. The risk almost always outweighs benefit.",
  },
  { id:"pcp", label:"PCP / Dissociative Intoxication", color:T.teal, icon:"🌀",
    presentation:"Dissociation, unpredictable violent behavior, nystagmus (horizontal AND vertical), analgesia, hypertension, muscle rigidity. May appear catatonic or extremely agitated.",
    findings:["Pathognomonic: horizontal + vertical nystagmus — highly specific for PCP","Analgesia: patient may not respond to pain — physical exam unreliable for injury","Extreme physical strength and agitation — high injury risk to patient and staff","Ketamine produces a similar toxidrome at subanesthetic doses"],
    management:"Quiet, calm, dark environment. Benzodiazepines for agitation (first-line). Haloperidol 5mg IM if psychosis prominent. Ketamine for extreme agitation. Avoid excessive physical restraint — positional asphyxia risk.",
    pitfall:"Verbal de-escalation worsens PCP agitation — additional stimulation increases paranoia. Environmental de-stimulation is more effective than any amount of conversation.",
  },
  { id:"mdma", label:"MDMA / Serotonin Syndrome", color:T.coral, icon:"💗",
    presentation:"Euphoria, tachycardia, hyperthermia, diaphoresis, bruxism (jaw clenching), mydriasis. Serotonin syndrome: hyperthermia + clonus + autonomic instability.",
    findings:["Hunter Criteria: clonus (spontaneous, inducible, or ocular) + any of: agitation, diaphoresis, tremor, hyperreflexia","Inducible ankle clonus = serotonin syndrome (key differentiator from NMS)","Hyperthermia > 41°C in serotonin syndrome = life-threatening — cooling is treatment","Dangerous combinations: MDMA + MAOIs, MDMA + SSRIs/SNRIs, linezolid"],
    management:"Benzodiazepines for agitation. Cyproheptadine 12mg PO (8–32mg/day) for mild-moderate serotonin syndrome. Aggressive cooling (fans, ice, cool IV fluids) for hyperthermia. Airway management for severe cases.",
    pitfall:"Serotonin syndrome vs NMS: SS onset in hours (NMS days); clonus present in SS, absent in NMS; SS responds to cyproheptadine while NMS requires dantrolene. Do not confuse — treatments differ.",
  },
  { id:"hallucinogens", label:"Classic Hallucinogens (LSD / Psilocybin)", color:T.yellow, icon:"🌈",
    presentation:"Visual/auditory/tactile hallucinations, perceptual distortions, time distortion, profound fear or mystical experience. Orientation usually preserved. Mydriasis. Mild tachycardia.",
    findings:["Classic hallucinogens cause minimal cardiovascular or respiratory toxicity","Bad trip: overwhelming anxiety/panic — differentiate from stimulant toxidrome","HPPD (hallucinogen persisting perception disorder): visual disturbances after cessation","NBOMe compounds (sold as LSD): far more dangerous — cardiovascular toxicity, seizures, fatal"],
    management:"Verbal de-escalation in quiet, calm setting — 'talk-down' approach. Reassure that effects are temporary. Benzodiazepines for extreme anxiety. Avoid antipsychotics unless psychosis persists after resolution.",
    pitfall:"NBOMe compounds (/25C-NBOMe, /25I-NBOMe) are synthetic phenethylamines sold as LSD blotter paper — they are NOT classic psychedelics. Can cause fatal cardiovascular toxicity. Standard reagent test strips cannot reliably distinguish.",
  },
  { id:"cannabis", label:"Cannabis / Cannabinoid Hyperemesis", color:T.green, icon:"🌿",
    presentation:"Anxiety, paranoia, tachycardia, acute psychosis (especially high-potency products). Synthetic cannabinoids (K2): severe agitation, psychosis, seizures, cardiovascular collapse.",
    findings:["Cannabinoid hyperemesis syndrome: cyclical vomiting + compulsive hot-water bathing in chronic heavy users","Standard UDS does NOT detect synthetic cannabinoids — specific panel required","Synthetic cannabinoids are full CB1/CB2 agonists — far more dangerous than natural cannabis","Acute cannabis psychosis: usually resolves within hours; prolonged psychosis in heavy users"],
    management:"Natural cannabis: supportive, benzodiazepines for severe anxiety. CHS: haloperidol 5mg IV (superior to antiemetics), topical capsaicin cream to abdomen. Synthetic cannabinoids: aggressive chemical sedation per stimulant protocol.",
    pitfall:"Compulsive hot-water bathing is pathognomonic for cannabinoid hyperemesis — patients often do not disclose heavy cannabis use. Ask directly. Haloperidol, not ondansetron, is the effective treatment.",
  },
  { id:"ghb", label:"GHB / GBL Intoxication / Withdrawal", color:T.blue, icon:"🌊",
    presentation:"Intoxication: rapid onset deep sedation, respiratory depression, coma — with sudden awakening. Withdrawal: nearly identical to alcohol withdrawal — potentially fatal.",
    findings:["GHB has steep dose-response: small dose difference between euphoria and coma","Characteristic: unconscious patient who suddenly wakens aggressive when aroused","Standard UDS does NOT detect GHB — short detection window (< 4–8h in urine)","GHB withdrawal: insomnia, agitation, psychosis, seizures — onset 2–12h after last dose"],
    management:"Intoxication: supportive care, airway management, aspiration precautions, monitoring until awakening. Withdrawal: benzodiazepines + supportive care; pentobarbital or phenobarbital for refractory cases. ICU for severe withdrawal.",
    pitfall:"GHB withdrawal is frequently not recognized — the drug is often not disclosed. Agitation + autonomic instability in party drug context = GHB or benzo withdrawal until proven otherwise.",
  },
];

const CIWA_THRESHOLDS = [
  {score:"< 8",  level:"Mild",         color:T.green,  action:"Monitoring, oral benzodiazepines PRN. May not require pharmacotherapy."},
  {score:"8–14", level:"Moderate",     color:T.yellow, action:"Symptom-triggered lorazepam 1–2mg IV/PO q1h PRN CIWA ≥ 8. Close monitoring."},
  {score:"15–19",level:"Severe",       color:T.orange, action:"Scheduled benzodiazepines: diazepam 10mg PO q6h with PRN dosing. Consider CIWA q1h."},
  {score:"≥ 20", level:"Very Severe",  color:T.red,    action:"Aggressive IV benzodiazepines. ICU monitoring. Consider phenobarbital if benzodiazepine-refractory."},
];

const TABS = [
  {id:"agitation",  label:"Agitation Protocol",  icon:"🔥"},
  {id:"risk",       label:"SI / HI Risk",         icon:"🔺"},
  {id:"medclear",   label:"Medical Clearance",    icon:"✅"},
  {id:"capacity",   label:"Capacity Eval",        icon:"⚖️"},
  {id:"intox",      label:"Intoxications",        icon:"🧪"},
];

// ── Module-Scope Primitives ───────────────────────────────────────────
function AmbientBg() {
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0}}>
      <div style={{position:"absolute",top:"-15%",left:"-10%",width:"55%",height:"55%",background:"radial-gradient(circle,rgba(155,109,255,0.08) 0%,transparent 70%)"}}/>
      <div style={{position:"absolute",bottom:"-10%",right:"-5%",width:"50%",height:"50%",background:"radial-gradient(circle,rgba(0,229,192,0.07) 0%,transparent 70%)"}}/>
      <div style={{position:"absolute",top:"40%",left:"30%",width:"35%",height:"35%",background:"radial-gradient(circle,rgba(59,158,255,0.05) 0%,transparent 70%)"}}/>
    </div>
  );
}

function DrugCard({ drug, color }) {
  return (
    <div style={{...glass,padding:"13px 15px",borderLeft:`3px solid ${color}`,background:`linear-gradient(135deg,${color}0a,rgba(8,22,40,0.7))`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,marginBottom:6}}>
        <div style={{fontFamily:"DM Sans",fontWeight:700,fontSize:13,color}}>
          {drug.name}
          {drug.elder && <span style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,marginLeft:8}}>elderly: {drug.elder}</span>}
        </div>
        <div style={{display:"flex",gap:6,flexShrink:0}}>
          <span style={{fontFamily:"JetBrains Mono",fontSize:10,fontWeight:700,color,background:`${color}18`,border:`1px solid ${color}44`,padding:"2px 8px",borderRadius:4}}>{drug.dose}</span>
          <span style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,background:"rgba(42,79,122,0.2)",padding:"2px 8px",borderRadius:4}}>{drug.onset}</span>
        </div>
      </div>
      <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt3,marginBottom:5,lineHeight:1.4}}>{drug.ind}</div>
      <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt2,lineHeight:1.5,marginBottom:drug.warn?6:0}}>{drug.note}</div>
      {drug.warn && (
        <div style={{display:"flex",gap:6,padding:"5px 8px",background:"rgba(255,68,68,0.08)",border:"1px solid rgba(255,68,68,0.2)",borderRadius:6}}>
          <span style={{color:T.red,fontSize:10,marginTop:1,flexShrink:0}}>⚠</span>
          <span style={{fontFamily:"DM Sans",fontSize:11,color:T.txt2,lineHeight:1.4,fontStyle:"italic"}}>{drug.warn}</span>
        </div>
      )}
    </div>
  );
}

function TierCard({ tier, expanded, onToggle }) {
  return (
    <div style={{...glass,overflow:"hidden",borderTop:`3px solid ${tier.color}`,border:`1px solid ${expanded?tier.color+"55":"rgba(42,79,122,0.35)"}`,borderTopColor:tier.color,marginBottom:12}}>
      <div onClick={onToggle} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",cursor:"pointer"}}>
        <div style={{width:30,height:30,borderRadius:"50%",background:`${tier.color}20`,border:`2px solid ${tier.color}55`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <span style={{fontFamily:"JetBrains Mono",fontWeight:700,fontSize:12,color:tier.color}}>{tier.tier}</span>
        </div>
        <span style={{fontSize:18}}>{tier.icon}</span>
        <div style={{flex:1}}>
          <div style={{fontFamily:"DM Sans",fontWeight:700,fontSize:14,color:tier.color}}>{tier.label}</div>
          <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt4,lineHeight:1.4}}>{tier.when}</div>
        </div>
        <span style={{color:T.txt4,fontSize:12,flexShrink:0}}>{expanded?"▲":"▼"}</span>
      </div>
      {expanded && (
        <div className="fade-in" style={{padding:"0 16px 16px",borderTop:"1px solid rgba(42,79,122,0.3)"}}>
          {tier.tips.length > 0 && (
            <div style={{padding:"12px 14px",background:`${tier.color}08`,border:`1px solid ${tier.color}22`,borderRadius:10,marginTop:12,marginBottom:14}}>
              {tier.tips.map((tip,i) => (
                <div key={i} style={{display:"flex",gap:8,marginBottom:5}}>
                  <span style={{color:tier.color,fontSize:9,marginTop:2,flexShrink:0}}>▸</span>
                  <span style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.5}}>{tip}</span>
                </div>
              ))}
            </div>
          )}
          {tier.drugs.length > 0 && (
            <div style={{display:"flex",flexDirection:"column",gap:10,marginTop:tier.tips.length>0?0:12}}>
              {tier.drugs.map((drug,i) => <DrugCard key={i} drug={drug} color={tier.color}/>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RiskToggle({ item, checked, color, onToggle }) {
  return (
    <div onClick={()=>onToggle(item.id)} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"7px 10px",borderRadius:8,cursor:"pointer",background:checked?`${color}15`:"rgba(14,37,68,0.3)",border:`1px solid ${checked?color+"44":"rgba(42,79,122,0.2)"}`,marginBottom:5,transition:"all .12s"}}>
      <div style={{width:16,height:16,borderRadius:4,border:`2px solid ${checked?color:T.txt4}`,background:checked?color:"transparent",flexShrink:0,marginTop:1,display:"flex",alignItems:"center",justifyContent:"center"}}>
        {checked && <span style={{color:"#000",fontSize:10,fontWeight:900,lineHeight:1}}>✓</span>}
      </div>
      <span style={{fontFamily:"DM Sans",fontSize:11,color:checked?T.txt:T.txt3,lineHeight:1.5}}>{item.label}</span>
    </div>
  );
}

function ClearCat({ cat }) {
  return (
    <div style={{...glass,padding:"14px 16px",borderLeft:`3px solid ${cat.color}`}}>
      <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:cat.color,textTransform:"uppercase",letterSpacing:1.5,marginBottom:cat.note?4:10}}>{cat.label}</div>
      {cat.note && <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt4,marginBottom:8,fontStyle:"italic"}}>{cat.note}</div>}
      {cat.items.map((item,i) => (
        <div key={i} style={{display:"flex",gap:8,marginBottom:5}}>
          <div style={{width:14,height:14,borderRadius:3,border:`1.5px solid ${cat.color}55`,background:`${cat.color}15`,flexShrink:0,marginTop:2}}/>
          <span style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.5}}>{item}</span>
        </div>
      ))}
    </div>
  );
}

function CapCard({ el, expanded, onToggle }) {
  return (
    <div onClick={onToggle} style={{...glass,cursor:"pointer",overflow:"hidden",borderLeft:`4px solid ${el.color}`,marginBottom:12}}>
      <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px"}}>
        <div style={{width:32,height:32,borderRadius:"50%",background:`${el.color}20`,border:`1.5px solid ${el.color}55`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <span style={{fontFamily:"JetBrains Mono",fontSize:12,fontWeight:700,color:el.color}}>{el.n}</span>
        </div>
        <span style={{fontSize:18}}>{el.icon}</span>
        <div style={{flex:1}}>
          <div style={{fontFamily:"DM Sans",fontWeight:700,fontSize:14,color:el.color}}>{el.label}</div>
          <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt4,lineHeight:1.4}}>{el.desc}</div>
        </div>
        <span style={{color:T.txt4,fontSize:12}}>{expanded?"▲":"▼"}</span>
      </div>
      {expanded && (
        <div className="fade-in" style={{padding:"0 16px 16px",borderTop:"1px solid rgba(42,79,122,0.3)"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginTop:14}}>
            <div>
              <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:1,marginBottom:7}}>How to Assess</div>
              {el.method.split(". ").filter(Boolean).map((m,i) => (
                <div key={i} style={{display:"flex",gap:7,marginBottom:5}}>
                  <span style={{color:el.color,fontSize:9,marginTop:2,flexShrink:0}}>▸</span>
                  <span style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.5}}>{m}</span>
                </div>
              ))}
              <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:1,marginTop:12,marginBottom:7}}>Questions to Ask</div>
              {el.questions.map((q,i) => (
                <div key={i} style={{fontFamily:"DM Sans",fontSize:11,color:T.teal,background:"rgba(0,229,192,0.06)",border:"1px solid rgba(0,229,192,0.15)",borderRadius:6,padding:"5px 9px",marginBottom:5,lineHeight:1.5,fontStyle:"italic"}}>{q}</div>
              ))}
            </div>
            <div>
              <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:1,marginBottom:7}}>When This Element is Impaired</div>
              <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.6,marginBottom:12}}>{el.impaired}</div>
              <div style={{padding:"10px 12px",background:`${el.color}0a`,border:`1px solid ${el.color}22`,borderRadius:8}}>
                <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:el.color,textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>Clinical Note</div>
                <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.5}}>{el.note}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function IntoxCard({ syn, expanded, onToggle }) {
  return (
    <div onClick={onToggle} style={{...glass,cursor:"pointer",overflow:"hidden",borderTop:`3px solid ${syn.color}`,border:`1px solid ${expanded?syn.color+"55":"rgba(42,79,122,0.35)"}`,borderTopColor:syn.color,marginBottom:10}}>
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px"}}>
        <span style={{fontSize:18,flexShrink:0}}>{syn.icon}</span>
        <div style={{flex:1}}>
          <div style={{fontFamily:"DM Sans",fontWeight:700,fontSize:13,color:syn.color}}>{syn.label}</div>
          <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt4,lineHeight:1.4}}>{syn.presentation}</div>
        </div>
        <span style={{color:T.txt4,fontSize:12}}>{expanded?"▲":"▼"}</span>
      </div>
      {expanded && (
        <div className="fade-in" style={{padding:"0 14px 14px",borderTop:"1px solid rgba(42,79,122,0.3)"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:12}}>
            <div>
              <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:1,marginBottom:7}}>Key Findings</div>
              {syn.findings.map((f,i) => (
                <div key={i} style={{display:"flex",gap:7,marginBottom:5}}>
                  <span style={{color:syn.color,fontSize:9,marginTop:2,flexShrink:0}}>▸</span>
                  <span style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.5}}>{f}</span>
                </div>
              ))}
            </div>
            <div>
              <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:1,marginBottom:7}}>Management</div>
              <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt,lineHeight:1.6,marginBottom:10}}>{syn.management}</div>
              <div style={{display:"flex",gap:6,padding:"7px 10px",background:"rgba(255,159,67,0.07)",border:"1px solid rgba(255,159,67,0.2)",borderRadius:7}}>
                <span style={{color:T.orange,fontSize:10,marginTop:1,flexShrink:0}}>⚠</span>
                <span style={{fontFamily:"DM Sans",fontSize:11,color:T.txt2,lineHeight:1.4,fontStyle:"italic"}}>{syn.pitfall}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────
export default function PsychHub() {
  const navigate = useNavigate();
  const [tab, setTab]           = useState("agitation");
  const [tierExp, setTierExp]   = useState(0);
  const [riskItems, setRiskItems] = useState(new Set());
  const [capExp, setCapExp]     = useState(null);
  const [intoxExp, setIntoxExp] = useState(null);

  const toggleTier  = useCallback(t => setTierExp(p => p === t ? null : t), []);
  const toggleCap   = useCallback(n => setCapExp(p => p === n ? null : n), []);
  const toggleIntox = useCallback(id => setIntoxExp(p => p === id ? null : id), []);

  const toggleRisk = useCallback(id => {
    setRiskItems(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const riskResult = useMemo(() => {
    const has = id => riskItems.has(id);
    if (has("prep_behav") || has("hi_target") || (has("active_si") && has("plan") && has("intent"))) {
      return { level:"Imminent", color:T.red,
        disp:"Emergency psychiatric hold — 1:1 monitoring, remove all means, notify psychiatry STAT",
        note: has("hi_target") ? "TARASOFF DUTY TO WARN — Notify identified potential victim and law enforcement" : "Remove all items from room that could be used for self-harm. Safety hold pending psychiatric evaluation.",
      };
    }
    const staticRisk = ["prior_attempt","psych_dx","substance","chronic_ill","fam_hx_si"].filter(has).length;
    if (has("active_si") && (staticRisk >= 2 || has("access_means") || has("hopeless"))) {
      return { level:"High", color:T.orange,
        disp:"Psychiatric hold or voluntary admission pending evaluation",
        note:"Urgent psychiatry consult. Remove means. Continuous monitoring. NPO if procedure/intubation risk.",
      };
    }
    if (has("active_si") || has("active_hi") || (has("passive_si") && staticRisk >= 1 && has("hopeless"))) {
      return { level:"Moderate", color:T.yellow,
        disp:"Psychiatric evaluation required — inpatient vs intensive outpatient based on full assessment",
        note:"Safety plan discussion. Contact outpatient provider. Consider voluntary admission.",
      };
    }
    const protective = ["reasons_living","social_support","engaged","no_means","ambivalent"].filter(has).length;
    if (has("passive_si") && protective >= 2) {
      return { level:"Low", color:T.green,
        disp:"Outpatient follow-up with documented safety plan may be appropriate",
        note:"Document safety plan and follow-up within 24–48h. Contact outpatient psychiatric provider.",
      };
    }
    return null;
  }, [riskItems]);

  return (
    <div style={{fontFamily:"DM Sans",background:T.bg,minHeight:"100vh",position:"relative",overflow:"hidden"}}>
      <AmbientBg/>
      <div style={{position:"relative",zIndex:1,maxWidth:1440,margin:"0 auto",padding:"0 16px"}}>

        {/* Header */}
        <div style={{padding:"18px 0 14px"}}>
          <button onClick={()=>navigate("/hub")} style={{display:"inline-flex",alignItems:"center",gap:6,marginBottom:12,padding:"6px 14px",borderRadius:8,border:"1px solid rgba(155,109,255,0.35)",background:"rgba(14,37,68,0.6)",color:T.txt3,fontFamily:"DM Sans",fontSize:12,fontWeight:600,cursor:"pointer",transition:"all .15s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(155,109,255,0.6)";e.currentTarget.style.color=T.txt;}} onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(155,109,255,0.35)";e.currentTarget.style.color=T.txt3;}}>← Back to Hub</button>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
            <div style={{backdropFilter:"blur(40px)",WebkitBackdropFilter:"blur(40px)",background:"rgba(5,15,30,0.85)",border:"1px solid rgba(26,53,85,0.6)",borderRadius:10,padding:"5px 12px",display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.teal,letterSpacing:3}}>NOTRYA</span>
              <span style={{color:T.txt4,fontFamily:"JetBrains Mono",fontSize:10}}>/</span>
              <span style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.txt3,letterSpacing:2}}>PSYCH HUB</span>
            </div>
            <div style={{height:1,flex:1,background:"linear-gradient(90deg,rgba(42,79,122,0.6),transparent)"}}/>
          </div>
          <h1 className="shimmer-text" style={{fontFamily:"Playfair Display",fontSize:"clamp(24px,4vw,40px)",fontWeight:900,letterSpacing:-1,lineHeight:1.1}}>Psych Hub</h1>
          <p style={{fontFamily:"DM Sans",fontSize:12,color:T.txt3,marginTop:4}}>Agitation protocols · SI/HI risk stratification · Medical clearance · Capacity evaluation · Intoxication syndromes</p>
        </div>

        {/* Stat Banner */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:10,marginBottom:16}}>
          {[
            {label:"Verbal First",    value:"Every Time",  sub:"Regardless of etiology",      color:T.teal  },
            {label:"Olanzapine+Benzo",value:"Never IM",    sub:"Fatal cardiorespiratory combo", color:T.red   },
            {label:"ExDS Mortality",  value:"Up to 10%",   sub:"Ketamine + cooling first",      color:T.orange},
            {label:"Capacity Eval",   value:"4 Elements",  sub:"Decision-specific, not global", color:T.purple},
            {label:"ETOH Withdrawal", value:"Fatal",       sub:"Treat CIWA ≥ 10 aggressively",  color:T.yellow},
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
            <button key={t.id} onClick={()=>{setTab(t.id);setCapExp(null);setIntoxExp(null);}} style={{flex:"1 1 auto",fontFamily:"DM Sans",fontWeight:600,fontSize:12,padding:"9px 8px",borderRadius:10,border:`1px solid ${tab===t.id?"rgba(155,109,255,0.5)":"transparent"}`,background:tab===t.id?"linear-gradient(135deg,rgba(155,109,255,0.18),rgba(155,109,255,0.07))":"transparent",color:tab===t.id?T.purple:T.txt3,cursor:"pointer",textAlign:"center",transition:"all .15s",whiteSpace:"nowrap"}}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ── AGITATION ─────────────────────────────────────────────── */}
        {tab === "agitation" && (
          <div className="fade-in">
            <div style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.teal,textTransform:"uppercase",letterSpacing:2,marginBottom:6}}>
              Agitation Escalation Ladder — Verbal → Oral → IM → IV
            </div>
            <div style={{padding:"10px 14px",background:"rgba(0,229,192,0.07)",border:"1px solid rgba(0,229,192,0.2)",borderRadius:10,marginBottom:16,fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.7}}>
              📌 <strong style={{color:T.teal}}>Core principle:</strong> The goal of chemical sedation is a calm, cooperative patient — not a sedated one. Use the minimum effective dose at each tier before escalating. Document all attempts at verbal de-escalation.
            </div>
            {TIERS.map(tier => (
              <TierCard key={tier.tier} tier={tier} expanded={tierExp===tier.tier} onToggle={()=>toggleTier(tier.tier)}/>
            ))}
            <div style={{...glass,padding:"16px 18px",marginTop:4,border:"1px solid rgba(255,68,68,0.3)",background:"rgba(255,68,68,0.05)"}}>
              <div style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.red,textTransform:"uppercase",letterSpacing:1.5,marginBottom:10}}>🚨 Excited Delirium Syndrome (ExDS) — Medical Emergency</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                <div>
                  <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Recognition</div>
                  {EXDS.features.map((f,i) => (
                    <div key={i} style={{display:"flex",gap:7,marginBottom:4}}>
                      <span style={{color:T.red,fontSize:9,marginTop:2}}>▸</span>
                      <span style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.5}}>{f}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Immediate Management</div>
                  {EXDS.management.map((m,i) => (
                    <div key={i} style={{display:"flex",gap:7,marginBottom:4}}>
                      <span style={{color:T.orange,fontSize:9,marginTop:2}}>▸</span>
                      <span style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.5}}>{m}</span>
                    </div>
                  ))}
                  <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt,fontStyle:"italic",marginTop:8,lineHeight:1.5,padding:"7px 10px",background:"rgba(255,68,68,0.08)",borderRadius:6}}>{EXDS.warning}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── SI / HI RISK ───────────────────────────────────────────── */}
        {tab === "risk" && (
          <div className="fade-in">
            <div style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.red,textTransform:"uppercase",letterSpacing:2,marginBottom:6}}>
              SI / HI Structured Risk Assessment — Interactive · Columbia-Based
            </div>
            <div style={{padding:"10px 14px",background:"rgba(255,68,68,0.07)",border:"1px solid rgba(255,68,68,0.2)",borderRadius:10,marginBottom:14,fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.7}}>
              ⚠ <strong style={{color:T.red}}>Risk assessment is a clinical judgment — not an algorithm.</strong> This tool supports structured evaluation. The absence of checked items does not mean no risk. All patients with suicidal ideation require a complete clinical interview.
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              {/* Left — checkboxes */}
              <div>
                {SI_CATS.map(cat => (
                  <div key={cat.id} style={{marginBottom:14}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                      <span style={{fontFamily:"JetBrains Mono",fontSize:9,color:cat.color,textTransform:"uppercase",letterSpacing:1.5}}>{cat.label}</span>
                      {cat.isProtective && <span style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.green,background:"rgba(61,255,160,0.1)",border:"1px solid rgba(61,255,160,0.2)",padding:"1px 6px",borderRadius:3}}>reduces risk</span>}
                    </div>
                    {cat.items.map(item => (
                      <RiskToggle key={item.id} item={item} checked={riskItems.has(item.id)} color={cat.color} onToggle={toggleRisk}/>
                    ))}
                  </div>
                ))}
                <button onClick={()=>setRiskItems(new Set())} style={{width:"100%",fontFamily:"DM Sans",fontWeight:600,fontSize:11,color:T.txt4,background:"rgba(42,79,122,0.15)",border:"1px solid rgba(42,79,122,0.3)",borderRadius:8,padding:"8px",cursor:"pointer",marginTop:6}}>
                  Clear All Selections
                </button>
              </div>
              {/* Right — results */}
              <div style={{position:"sticky",top:16,alignSelf:"start"}}>
                {!riskResult && riskItems.size === 0 && (
                  <div style={{...glass,padding:"24px",textAlign:"center"}}>
                    <div style={{fontSize:32,marginBottom:10}}>🔺</div>
                    <div style={{fontFamily:"DM Sans",fontWeight:600,fontSize:14,color:T.txt,marginBottom:8}}>Risk Stratification</div>
                    <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt4,lineHeight:1.6}}>Select risk factors and protective factors on the left to generate a structured risk assessment.</div>
                  </div>
                )}
                {riskItems.size > 0 && !riskResult && (
                  <div style={{...glass,padding:"20px",border:"1px solid rgba(61,255,160,0.3)"}}>
                    <div style={{fontFamily:"JetBrains Mono",fontSize:14,fontWeight:700,color:T.green,marginBottom:8}}>LOW RISK</div>
                    <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.6,marginBottom:10}}>Based on selected factors: protective factors predominate and no active suicidal ideation or plan identified.</div>
                    <div style={{padding:"10px 12px",background:"rgba(61,255,160,0.07)",border:"1px solid rgba(61,255,160,0.2)",borderRadius:8}}>
                      <div style={{fontFamily:"DM Sans",fontWeight:600,fontSize:12,color:T.green,marginBottom:4}}>Disposition Consideration</div>
                      <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.5}}>Outpatient follow-up with safety plan may be appropriate. Document rationale thoroughly.</div>
                    </div>
                  </div>
                )}
                {riskResult && (
                  <div className="fade-in" style={{...glass,padding:"20px",border:`1px solid ${riskResult.color}55`,background:`${riskResult.color}0a`}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                      <div className={riskResult.level==="Imminent"?"risk-pulse":""} style={{width:12,height:12,borderRadius:"50%",background:riskResult.color,flexShrink:0}}/>
                      <div style={{fontFamily:"JetBrains Mono",fontSize:18,fontWeight:700,color:riskResult.color}}>{riskResult.level.toUpperCase()} RISK</div>
                    </div>
                    <div style={{fontFamily:"DM Sans",fontWeight:600,fontSize:13,color:T.txt,marginBottom:5}}>Disposition</div>
                    <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.6,marginBottom:12}}>{riskResult.disp}</div>
                    {riskResult.note && (
                      <div style={{padding:"10px 12px",background:`${riskResult.color}12`,border:`1px solid ${riskResult.color}33`,borderRadius:8}}>
                        <div style={{fontFamily:"DM Sans",fontSize:12,color:riskResult.color,lineHeight:1.6,fontWeight:600}}>{riskResult.note}</div>
                      </div>
                    )}
                  </div>
                )}
                <div style={{...glass,padding:"16px",marginTop:12}}>
                  <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:1.5,marginBottom:10}}>C-SSRS Questions to Ask</div>
                  {[
                    {q:"Have you wished you were dead or wished you could go to sleep and not wake up?", level:"Passive"},
                    {q:"Have you had any thoughts of killing yourself?", level:"Active"},
                    {q:"Have you been thinking about how you might do this?", level:"Plan"},
                    {q:"Have you had any intention of acting on these thoughts?", level:"Intent"},
                    {q:"Have you done anything, started to do anything, or prepared to do anything to end your life?", level:"Behavior"},
                  ].map((item,i) => (
                    <div key={i} style={{marginBottom:8,padding:"8px 10px",background:"rgba(14,37,68,0.4)",borderRadius:7,border:"1px solid rgba(42,79,122,0.2)"}}>
                      <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.red,textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>{item.level}</div>
                      <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt2,lineHeight:1.5,fontStyle:"italic"}}>{item.q}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── MEDICAL CLEARANCE ─────────────────────────────────────── */}
        {tab === "medclear" && (
          <div className="fade-in">
            <div style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.blue,textTransform:"uppercase",letterSpacing:2,marginBottom:6}}>
              Medical Clearance Checklist
            </div>
            <div style={{padding:"10px 14px",background:"rgba(59,158,255,0.07)",border:"1px solid rgba(59,158,255,0.2)",borderRadius:10,marginBottom:16,fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.7}}>
              🏥 <strong style={{color:T.blue}}>Core principle:</strong> Medical clearance means organic etiology has been reasonably excluded — not that all labs are normal. There is no evidence-based universal "psych clearance panel." Direct testing to the clinical presentation.
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(400px,1fr))",gap:12}}>
              {MEDCLEAR_CATS.map((cat,i) => <ClearCat key={i} cat={cat}/>)}
            </div>
            <div style={{...glass,padding:"16px 18px",marginTop:12}}>
              <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.yellow,textTransform:"uppercase",letterSpacing:1.5,marginBottom:10}}>⚠ Do Not Miss Organic Causes of Psychiatric Presentations</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                {[
                  {cause:"Hypoglycemia",       mimics:"Agitation, psychosis, AMS",       test:"Blood glucose"},
                  {cause:"Thiamine deficiency",mimics:"Confusion, ataxia, ophthalmoplegia",test:"Treat empirically if alcohol use"},
                  {cause:"Hyponatremia",       mimics:"Confusion, seizure, coma",         test:"Serum Na+"},
                  {cause:"Hyperthyroidism",    mimics:"Anxiety, mania, agitation",        test:"TSH, free T4"},
                  {cause:"Hypothyroidism",     mimics:"Depression, psychosis, cognitive",  test:"TSH"},
                  {cause:"UTI (elderly)",      mimics:"Acute delirium, AMS",              test:"UA + culture"},
                  {cause:"Autoimmune encephalitis",mimics:"Psychosis, catatonia, seizure", test:"CSF NMDAR antibodies"},
                  {cause:"Subdural hematoma",  mimics:"Personality change, cognitive decline",test:"CT head"},
                  {cause:"CNS infection",      mimics:"AMS, psychosis, behavior change",  test:"LP (fever + stiff neck)"},
                ].map((r,i) => (
                  <div key={i} style={{padding:"8px 10px",background:"rgba(14,37,68,0.5)",border:"1px solid rgba(42,79,122,0.2)",borderRadius:8}}>
                    <div style={{fontFamily:"DM Sans",fontWeight:700,fontSize:11,color:T.yellow,marginBottom:3}}>{r.cause}</div>
                    <div style={{fontFamily:"DM Sans",fontSize:10,color:T.txt4,marginBottom:2}}>Mimics: {r.mimics}</div>
                    <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.teal}}>→ {r.test}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── CAPACITY ──────────────────────────────────────────────── */}
        {tab === "capacity" && (
          <div className="fade-in">
            <div style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.purple,textTransform:"uppercase",letterSpacing:2,marginBottom:6}}>
              Capacity Evaluation — URAT Framework
            </div>
            <div style={{padding:"10px 14px",background:"rgba(155,109,255,0.07)",border:"1px solid rgba(155,109,255,0.2)",borderRadius:10,marginBottom:14,fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.7}}>
              ⚖️ <strong style={{color:T.purple}}>Capacity is decision-specific, not global.</strong> A patient may lack capacity for one decision but retain it for another. Capacity is a clinical determination made by the treating physician — competency is a legal determination made by a court. Emergency treatment exception applies when patient lacks capacity, treatment is urgent, and a surrogate is unavailable.
            </div>
            {CAP_ELS.map(el => (
              <CapCard key={el.n} el={el} expanded={capExp===el.n} onToggle={()=>toggleCap(el.n)}/>
            ))}
            <div style={{...glass,padding:"16px 18px",marginTop:4}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                <div>
                  <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:1.5,marginBottom:10}}>Key Legal / Ethical Distinctions</div>
                  {[
                    {term:"Capacity",      def:"Clinical determination by treating physician — can change over time"},
                    {term:"Competency",    def:"Legal determination by court — rarely relevant in acute ED setting"},
                    {term:"Emergency Exception",def:"When life-threatening and capacity absent, emergent treatment may proceed without consent"},
                    {term:"Assent",        def:"Patient agrees with treatment but does not have full capacity — document"},
                    {term:"Surrogate",     def:"Hierarchy: healthcare proxy → spouse → adult child → parent → sibling"},
                  ].map((r,i) => (
                    <div key={i} style={{display:"flex",gap:10,marginBottom:7,padding:"6px 9px",background:"rgba(14,37,68,0.4)",borderRadius:7}}>
                      <span style={{fontFamily:"JetBrains Mono",fontSize:10,fontWeight:700,color:T.purple,flexShrink:0,minWidth:130}}>{r.term}</span>
                      <span style={{fontFamily:"DM Sans",fontSize:11,color:T.txt2,lineHeight:1.5}}>{r.def}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:1.5,marginBottom:10}}>Documentation Template</div>
                  <div style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.teal,background:"rgba(4,10,22,0.7)",border:"1px solid rgba(42,79,122,0.4)",borderRadius:10,padding:"14px 16px",lineHeight:2}}>
                   {`Patient was informed of: [diagnosis/condition].\n\nProposed treatment: [intervention].\n\nAlternatives discussed: [alternatives].\n\nRisks of refusal: [consequences].\n\nPatient demonstrates:\n• Understanding: [yes/no — evidence]\n• Appreciation: [yes/no — evidence]\n• Reasoning: [yes/no — evidence]\n• Communication: [yes/no — evidence]\n\nConclusion: Patient [has/lacks] decision-making capacity for this specific decision.`}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── INTOXICATIONS ─────────────────────────────────────────── */}
        {tab === "intox" && (
          <div className="fade-in">
            <div style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.orange,textTransform:"uppercase",letterSpacing:2,marginBottom:6}}>
              Intoxication Syndromes — 9 Common Presentations
            </div>
            <div style={{padding:"10px 14px",background:"rgba(255,159,67,0.07)",border:"1px solid rgba(255,159,67,0.2)",borderRadius:10,marginBottom:14,fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.7}}>
              🧪 <strong style={{color:T.orange}}>Polysubstance use is the norm, not the exception.</strong> Multiple toxidromes may overlap. A positive UDS identifies a substance but does not confirm it as the sole cause of the clinical picture. Always evaluate for concurrent medical pathology.
            </div>
            {INTOX.map(syn => (
              <IntoxCard key={syn.id} syn={syn} expanded={intoxExp===syn.id} onToggle={()=>toggleIntox(syn.id)}/>
            ))}
            <div style={{...glass,padding:"16px 20px",marginTop:10}}>
              <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.orange,textTransform:"uppercase",letterSpacing:1.5,marginBottom:12}}>CIWA-Ar Scoring Reference — Alcohol Withdrawal Assessment</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:10}}>
                {CIWA_THRESHOLDS.map((row,i) => (
                  <div key={i} style={{padding:"10px 14px",background:`${row.color}0a`,border:`1px solid ${row.color}33`,borderRadius:10}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                      <span style={{fontFamily:"JetBrains Mono",fontSize:13,fontWeight:700,color:row.color}}>{row.score}</span>
                      <span style={{fontFamily:"DM Sans",fontWeight:700,fontSize:12,color:row.color}}>{row.level}</span>
                    </div>
                    <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt2,lineHeight:1.5}}>{row.action}</div>
                  </div>
                ))}
              </div>
              <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt4,marginTop:10,lineHeight:1.5}}>
                CIWA-Ar assesses: nausea/vomiting, tremor, paroxysmal sweats, anxiety, agitation, tactile/auditory/visual disturbances, headache, orientation. Maximum score = 67.
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{textAlign:"center",paddingBottom:24,paddingTop:14}}>
          <span style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,letterSpacing:1.5}}>
            NOTRYA PSYCH HUB · CLINICAL REFERENCE ONLY — RISK ASSESSMENT DOES NOT REPLACE CLINICAL JUDGMENT · ALWAYS COMPLETE FORMAL PSYCHIATRIC EVALUATION
          </span>
        </div>
      </div>
    </div>
  );
}