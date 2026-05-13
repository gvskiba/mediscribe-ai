// QuickNoteScaffolds.jsx
// HPI scaffold templates extracted from QuickNote.jsx

// ─── HPI SCAFFOLDS — full clinical templates ──────────────────────────────────
const HPI_SCAFFOLDS = {
  "chest pain":
`Onset: [sudden/gradual], starting [today/X hours ago], [at rest/with exertion/during: ___].
Character: [pressure/squeezing/sharp/burning/tightness/aching/tearing/dull].
Location: [substernal/left chest/right chest/epigastric/diffuse].
Radiation: [to left arm/right arm/jaw/neck/back/interscapular/none].
Severity: [X/10] at onset, currently [X/10]. Progression: [worsening/improving/unchanged].
Timing: [constant/intermittent — episodes last X min]. Total duration: [X hours].
Pleuritic component: [yes — worse with deep breath/cough/no].
Positional: [worse supine/better leaning forward/no change].
Reproducible with palpation: [yes/no].
Aggravating: [exertion/deep inspiration/position/swallowing/none].
Relieving: [rest/nitroglycerin — partial/full/antacids/position/none].
Associated: [dyspnea/diaphoresis/nausea/vomiting/palpitations/near-syncope/syncope/fever/cough/hemoptysis/leg swelling].
Self-treatment before arrival: [aspirin/nitroglycerin/antacids/none].
Prior similar episodes: [yes — frequency, prior diagnosis/no].
Cardiac history: [CAD/prior MI — date/PCI/CABG/CHF — EF ___/arrhythmia/none].
Cardiac risk factors: [HTN/DM/hyperlipidemia/smoker — ___ppd/family hx premature CAD/obesity].
Prior cardiac workup: [stress test — date, result/echo — date, EF ___/cath — date, findings/none].
Current cardiac medications: [aspirin/beta-blocker/statin/nitrates/anticoagulant/none].`,

  "shortness of breath":
`Onset: [sudden/gradual], starting [today/X hours ago], [at rest/with exertion/awakened from sleep].
Severity: [X/10]. Exertional threshold: [at rest/minimal exertion/moderate/heavy exertion only].
Progression: [worsening/improving/unchanged]. Duration: [X hours].
Timing: [constant/intermittent/paroxysmal nocturnal dyspnea — X episodes/week].
Orthopnea: [yes — ___ pillows/no]. Leg edema: [yes — bilateral/unilateral, ___ lbs weight gain over ___ days/no].
Aggravating: [exertion/lying flat/allergen/cold air/none].
Relieving: [sitting upright/leaning forward/inhaler/O2/none].
Pleuritic component: [yes/no].
Associated: [cough — productive/dry/hemoptysis/wheezing/stridor/chest pain/fever/chills/leg pain/palpitations/diaphoresis].
Recent sick contact or travel: [yes/no].
Prior similar episodes: [yes — hospitalizations, prior intubation/no].
Respiratory history: [asthma — last attack, last oral steroid/COPD — FEV1, home O2/CHF — EF ___/prior PE/prior DVT/none].
Current inhalers: [rescue — frequency this week/maintenance inhaler/diuretic/none].
Compliance: [yes/no — reason].`,

  "abdominal pain":
`Onset: [sudden/gradual], starting [today/X hours ago/X days ago].
Character: [crampy/sharp/stabbing/dull/aching/colicky/burning/pressure].
Location: [RUQ/RLQ/LUQ/LLQ/epigastric/periumbilical/diffuse].
Migration: [periumbilical → RLQ/no migration].
Radiation: [to back/right shoulder/groin/none].
Severity: [X/10] at onset, currently [X/10]. Progression: [worsening/improving/unchanged].
Timing: [constant/intermittent — colicky waves]. Duration: [X hours/days].
Aggravating: [eating/movement/palpation/position/none].
Relieving: [fasting/antacids/bowel movement/fetal position/none].
Associated: [nausea/vomiting — X episodes, bilious/bloody/feculent/diarrhea — X stools/day, blood/constipation/fever/anorexia/weight loss/dysuria/hematuria/vaginal discharge/vaginal bleeding].
Last oral intake: [___ hours ago]. Last BM: [today/X days ago, consistency].
LMP: [date/N/A — male]. Pregnancy test: [ordered/negative/not indicated].
Prior similar episodes: [yes — prior diagnosis, workup/no].
Surgical history: [cholecystectomy/appendectomy/bowel surgery — type, date/none].
GI history: [PUD/GERD/IBD/bowel obstruction/gallstones/pancreatitis/none].
GYN history (if applicable): [PID/endometriosis/ovarian cysts/STI/none].
Current medications: [NSAIDs/steroids/antibiotics/opioids/none].`,

  "headache":
`Onset: [sudden — thunderclap, maximal at onset/gradual — built over ___ min/hours], starting [today/X hours ago].
Character: [throbbing/pulsating/pressure/band-like/stabbing/constant ache].
Location: [bilateral/unilateral — left/right/frontal/temporal/occipital/retro-orbital/hemicranial].
Severity: [X/10]. Worst headache of life: [yes/no].
Progression: [maximal at onset/built gradually/improving/worsening]. Duration: [X hours].
Timing: [constant/intermittent — ___ episodes/week, each lasting ___ hours].
Aggravating: [light — photophobia/sound — phonophobia/movement/bending/Valsalva/cough/exertion].
Relieving: [dark quiet room/sleep/analgesics — partial/full relief/none].
Aura: [yes — visual scotoma/fortification spectra/sensory changes/speech difficulty, onset ___ min before/no].
Associated: [nausea/vomiting/neck stiffness/fever/photophobia/phonophobia/vision changes/diplopia/focal weakness/numbness/speech difficulty/confusion/ear pain/sinus pressure].
Trauma: [yes — mechanism, LOC/no].
Prior similar headaches: [yes — frequency, diagnosis, preventive therapy/no].
Headache history: [migraine/tension-type/cluster/chronic daily/none established].
Triggers: [menstrual/stress/sleep deprivation/alcohol/food/weather/none identified].
Current medications: [triptans — effective/preventive/OTC analgesics — frequency/OCPs/anticoagulants/none].
Red flags: [first or worst HA/thunderclap/fever + meningismus/new focal deficit/age >50 new onset/immunocompromised/none].`,

  "back pain":
`Onset: [sudden/gradual], starting [today/X days ago].
Precipitant: [lifting — ___lbs/twisting/trauma — mechanism/spontaneous/none].
Character: [sharp/dull/aching/burning/electric/stabbing].
Location: [cervical/thoracic/lumbar/sacral/paraspinal/midline].
Radiation: [into buttocks/left leg to knee/left leg to foot/right leg to knee/right leg to foot/bilateral/groin/none].
Dermatomal: [L4 — medial foot/L5 — dorsal foot/S1 — lateral foot/non-dermatomal/none].
Severity: [X/10] at onset, currently [X/10]. Progression: [worsening/improving/unchanged].
Timing: [constant/worse with movement/worse at rest/worse at night].
Aggravating: [flexion/extension/rotation/cough/Valsalva/sitting/standing/walking — ___ feet/lying flat].
Relieving: [rest/fetal position/ice/heat/analgesics/none].
Neurological: [weakness — distribution/numbness/tingling — distribution/none].
Bowel/Bladder: [normal/urinary retention/urinary incontinence/fecal incontinence/new constipation].
Saddle anesthesia: [yes/no].
Associated: [fever/chills/night sweats/weight loss/abdominal pain/flank pain/rash].
Prior episodes: [yes — prior imaging — MRI/CT findings, treatments/no].
Spinal history: [prior surgery — type, date/disc herniation/stenosis/spondylolisthesis/none].
Cancer history: [yes — type, treatment/no]. IVDU: [yes/no]. Immunocompromised: [yes/no].
Red flags: [fever/weight loss/cancer hx/bowel-bladder dysfunction/saddle anesthesia/none].`,

  "dizziness":
`Character: [true vertigo — room/self spinning/presyncope — lightheaded, nearly fainted/disequilibrium — unsteady/non-specific].
Onset: [sudden/gradual]. Episode duration: [seconds/minutes/hours/constant since onset].
Triggers: [specific head position — which/turning in bed/standing/exertion/none — spontaneous].
Dix-Hallpike: [positive right/positive left/negative/not tested].
Aggravating: [head movement/standing/walking/none].
Relieving: [lying still/eyes closed/specific position/none].
Nystagmus: [horizontal/vertical/torsional/none observed].
Associated: [nausea/vomiting/diaphoresis/hearing loss — unilateral/bilateral/tinnitus/ear fullness/diplopia/dysarthria/dysphagia/ataxia/focal weakness/headache/palpitations].
Recent URI or viral illness: [yes — ___ days ago/no].
Falls: [yes — injuries/no].
Prior episodes: [yes — prior diagnosis, prior Epley/no].
Hearing history: [baseline hearing loss/prior ear surgery/BPPV/vestibular neuritis/Meniere's/none].
Cardiac history: [arrhythmia/CAD/none].
Medications: [antihypertensives/aminoglycosides/loop diuretics/aspirin — dose/none].
Red flags: [new headache/diplopia/dysarthria/dysphagia/facial droop/limb ataxia/none].`,

  "syncope":
`Prodrome: [no warning — sudden/lightheadedness/diaphoresis/nausea/palpitations/chest pain/vision dimming — ___ seconds].
Trigger: [prolonged standing/heat/Valsalva/cough/micturition/defecation/emotional stress/pain/exertion/none].
LOC duration: [___ seconds/minutes]. Witnessed: [yes/no]. Injuries: [head strike/laceration/none].
Bystander-reported: [shaking/jerking — duration ___ sec, tonic-clonic vs. brief myoclonic/eye deviation/pallor/cyanosis/limp/rigid].
Recovery: [immediate — alert within seconds/prolonged confusion — ___ min/post-event headache/fatigue].
Incontinence: [urinary/fecal/none]. Tongue biting: [yes — lateral/tip/no].
Postictal confusion: [yes — ___ min/none].
Prior similar episodes: [yes — frequency, workup — EKG/Holter/echo/tilt-table, diagnosis/no].
Cardiac history: [arrhythmia/structural heart disease — HCM/prior ICD/pacemaker/CAD/none].
Family history: [sudden cardiac death/arrhythmia/HCM/LQTS/none].
Medications: [antihypertensives/antiarrhythmics/QT-prolonging agents/diuretics/insulin/nitrates/none].
Red flags: [exertional syncope/syncope with chest pain or palpitations/family hx sudden death/structural heart disease/none].`,

  "palpitations":
`Onset: [sudden/gradual], starting [today/X hours ago]. Currently: [ongoing/resolved ___ min/hours ago].
Duration: [___ seconds/minutes/hours/still present].
Character: [rapid/racing/irregular — skipped beats/pounding/fluttering/flip-flopping].
Rate perception: [very fast >150 bpm/moderately fast/normal rate but irregular].
Pattern: [abrupt on/abrupt off/gradual on/gradual off].
Triggers: [exertion/caffeine/alcohol/stress/position/none — spontaneous].
Termination: [spontaneous/Valsalva/carotid massage/adenosine/still ongoing].
Associated: [lightheadedness/near-syncope/syncope/chest pain/dyspnea/diaphoresis/fatigue].
Prior episodes: [yes — frequency, duration, workup — EKG during episode/Holter/event monitor, diagnosis, prior ablation/cardioversion/no].
Cardiac history: [arrhythmia — type/WPW/SVT/AF/flutter/prior ablation/structural heart disease/none].
Thyroid history: [hyperthyroidism/known thyroid disease/none].
Stimulant/substance use: [caffeine — cups/day/energy drinks/cocaine/amphetamines/albuterol/decongestants/none].
Medications: [antiarrhythmics/beta-blocker/CCB/thyroid meds/QT-prolonging agents/none].
Family history: [arrhythmia/sudden cardiac death/HCM/LQTS/none].
Red flags: [exertional/syncope with palpitations/structural heart disease/family hx sudden death/none].`,

  "altered mental status":
`Onset: [acute — minutes to hours/subacute — days/insidious — weeks]. Last known baseline: [date/time].
First noticed by: [family/staff/EMS/patient] at [time/today/yesterday].
Baseline: [normal/mild cognitive impairment/moderate dementia/severe dementia].
Character: [confusion/agitation/aggression/lethargy/obtundation/stupor/behavioral change].
Progression: [worsening/fluctuating — waxing and waning/improving].
Associated: [fever/headache — thunderclap/neck stiffness/photophobia/vomiting/focal weakness/speech difficulty/vision changes/seizure-like activity — witnessed/fall or trauma/urinary incontinence — new/rash/jaundice].
Exposures: [alcohol — quantity, last drink/illicit substances/new or changed medications — name, dose, start date/toxin].
Recent illness: [URI/UTI symptoms/pneumonia/recent procedure or hospitalization/skin infection/dental].
Medical history: [diabetes — recent hypoglycemia, insulin changes/epilepsy — last seizure/liver disease — hepatic encephalopathy episodes/renal failure — dialysis/thyroid disease/Parkinson's/psychiatric history/none].
Functional baseline: [independent/ADL-dependent/nursing home resident/lives alone].
Last medications taken: [today/unknown]. Medication access: [locked/unlocked].
Red flags: [fever + meningismus/sudden onset/focal neuro deficit/immunocompromised/none].`,

  "fever":
`Temperature: [___°F], measured [orally/rectally/tympanically]. Onset: [today/X days ago].
Maximum temperature at home: [___°F]. Fever pattern: [continuous/intermittent/none at home].
Rigors: [yes — shaking chills/no]. Night sweats: [drenching/mild/none].
Localizing symptoms:
  Respiratory: [cough — dry/productive, color ___, hemoptysis/dyspnea/pleuritic chest pain/sore throat/ear pain/rhinorrhea/sinus pressure].
  GI: [nausea/vomiting/diarrhea — watery/bloody, ___ stools/day/abdominal pain — location/anorexia].
  GU: [dysuria/frequency/urgency/hematuria/flank pain/vaginal discharge/pelvic pain].
  Neurologic: [headache — thunderclap/neck stiffness/photophobia/confusion/focal weakness].
  Skin/MSK: [rash — description, distribution/joint swelling — which joints/wound/cellulitis — location].
  Other: [weight loss — ___ lbs over ___ weeks/lymphadenopathy].
Sick contacts: [yes — URI/GI illness/known exposure/no].
Recent travel: [yes — location, duration, malaria prophylaxis/no]. Animal exposure: [yes/no].
Immunocompromised: [yes — HIV CD4 ___, viral load ___/chemotherapy/steroids/biologics/transplant/splenectomy/no].
Recent procedures or hospitalizations: [yes — type, date/no].
Current antibiotics: [yes — drug, dose, start date, indication/no].
Vaccination status: [influenza/pneumococcal/COVID/meningococcal — up to date/unknown/unvaccinated].
PMH: [recurrent infections/prior bacteremia or endocarditis/IVDU/indwelling hardware — joint, cardiac device, PICC, vascular graft/none].`,

  "nausea":
`Onset: [today/X hours ago/X days ago].
Vomiting: [yes — ___ episodes, bilious/bloody — coffee grounds/feculent/projectile/no].
Last PO: [___ hours ago]. Tolerating liquids: [yes/no].
Diarrhea: [yes — ___ stools/day, watery/bloody/no]. Constipation: [last BM ___ days ago/no].
Timing: [continuous/episodic — triggered by eating — within ___ min/positional/early morning].
Aggravating: [eating/motion/position/medications/none].
Relieving: [vomiting — temporary/fasting/position/nothing].
Associated: [fever/chills/headache/dizziness/diaphoresis/dysphagia/hematemesis/melena/hematochezia/abdominal distension/jaundice/dark urine/weight loss].
Precipitant: [food — last meal ___ hours ago, what eaten/shared meal with sick contacts/new medications — name, start date/alcohol/motion/pregnancy — LMP/no clear precipitant].
Pregnancy status: [pregnant — LMP, gestational age/tested negative/not applicable].
Prior episodes: [yes — prior diagnosis, prior workup/no].
GI history: [gastroparesis/PUD/GERD/bowel obstruction/prior abdominal surgery/IBD/pancreatitis/biliary disease/none].
Medications: [opioids/chemotherapy/metformin/antibiotics/new medications recently started/none].
Last BM: [today/X days ago, consistency].`,
};

const HPI_ALIASES = {
  "sob":"shortness of breath","dyspnea":"shortness of breath",
  "difficulty breathing":"shortness of breath","cp":"chest pain",
  "chest pressure":"chest pain","chest tightness":"chest pain",
  "abd pain":"abdominal pain","stomach pain":"abdominal pain",
  "belly pain":"abdominal pain","ha":"headache","migraine":"headache",
  "lbp":"back pain","low back pain":"back pain","low back":"back pain",
  "dizzy":"dizziness","vertigo":"dizziness","lightheadedness":"dizziness",
  "passed out":"syncope","fainted":"syncope","loc":"syncope",
  "loss of consciousness":"syncope","palp":"palpitations",
  "heart racing":"palpitations","racing heart":"palpitations",
  "ams":"altered mental status","confusion":"altered mental status",
  "altered":"altered mental status","n/v":"nausea",
  "nausea and vomiting":"nausea","vomiting":"nausea","n/v/d":"nausea",
  "temp":"fever","high fever":"fever","febrile":"fever",
};


export { HPI_SCAFFOLDS, HPI_ALIASES, getScaffold };