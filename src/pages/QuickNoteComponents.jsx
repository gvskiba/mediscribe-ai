// QuickNoteComponents.jsx
// Extracted UI components for QuickNote.jsx
// Exported: dispColor, StepProgress, InputZone, MedsAllergyZone,
//           MDMResult, DispositionResult, DifferentialCard, QuickDDxCard,
//           ClinicalCalcsCard, DiagnosisCodingCard, InterventionsCard

import { useState, useEffect, useRef } from "react";
import { PLAN_CATEGORIES } from "@/pages/QuickNotePrompts";
import { TemplatePicker } from "./QuickNotePickers";
import { SmartFillBar } from "./QuickNoteSmartFill";
import { MedsAllergyZone } from "./QuickNoteMeds";
import { DifferentialCard, QuickDDxCard, MDMResult } from "./QuickNoteMDM";
import { ClinicalCalcsCard } from "./QuickNoteCalcs";
import { DiagnosisCodingCard, InterventionsCard, DispositionResult } from "./QuickNoteDisposition";

// ─── CC LIBRARY ───────────────────────────────────────────────────────────────
export const CC_LIBRARY = [
  { id:"chest_pain", label:"Chest Pain", category:"Cardiac", emoji:"🫀",
    hpi_template:(age,u)=>`A ${age}-${u}-old presents with chest pain that began [onset: suddenly / gradually] approximately [duration] ago. The pain is [quality: sharp / dull / pressure / burning / tearing], located [substernal / left-sided / right-sided], rated [X]/10, and [does/does not] radiate to [jaw / left arm / back]. Aggravated by [exertion / deep breath / position / eating / nothing] and relieved by [rest / nitroglycerin / antacids / nothing]. Associated: [nausea / diaphoresis / dyspnea / palpitations / none]. [No prior episodes / prior episodes].`,
    ros:`Constitutional: Denies fever, chills. Fatigue noted.\nCardiovascular: Positive for chest pain as described. Denies palpitations, orthopnea, PND, lower extremity edema.\nRespiratory: Denies shortness of breath, cough, hemoptysis.\nGI: Denies nausea, vomiting, abdominal pain.\nNeuro: Denies dizziness, syncope, or focal deficits.\nMSK: Denies chest wall pain or recent trauma.`,
    exam:`General: Alert and oriented x3, [comfortable / mildly uncomfortable / acutely distressed], [diaphoretic / not diaphoretic].\nCardiovascular: Regular rate and rhythm. S1 S2 normal. No murmurs, rubs, or gallops. Peripheral pulses 2+ bilaterally. No lower extremity edema.\nRespiratory: Clear to auscultation bilaterally. No wheezes or rales. Non-labored.\nAbdomen: Soft, non-tender. No epigastric tenderness.\nSkin: Warm, [diaphoretic / dry]. No cyanosis.` },
  { id:"palpitations", label:"Palpitations", category:"Cardiac", emoji:"🫀",
    hpi_template:(age,u)=>`A ${age}-${u}-old presents with palpitations described as [racing / fluttering / pounding / irregular] that began approximately [duration] ago. Onset was [sudden / gradual]. Episodes last [duration] and are [continuous / intermittent]. Associated: [lightheadedness / near-syncope / chest pain / dyspnea / none]. Triggers: [caffeine / exertion / stress / none].`,
    ros:`Constitutional: Denies fever.\nCardiovascular: Positive for palpitations. Denies chest pain, exertional dyspnea, or lower extremity edema.\nNeuro: Denies focal deficits.\nEndocrine: Denies heat intolerance or tremor.\nPsych: Denies anxiety or panic attacks.`,
    exam:`General: Alert and oriented x3, no acute distress.\nCardiovascular: [Regular / irregular] rate and rhythm. No murmurs. Peripheral pulses intact. No lower extremity edema.\nThyroid: No thyromegaly.\nNeuro: No tremor.` },
  { id:"syncope", label:"Syncope / Loss of Consciousness", category:"Cardiac", emoji:"🫀",
    hpi_template:(age,u)=>`A ${age}-${u}-old presents after [syncope / near-syncope] approximately [duration] ago. Episode lasted [duration]. Preceding symptoms: [lightheadedness / palpitations / chest pain / diaphoresis / none]. Position: [standing / sitting / during exertion / at rest]. [Witnessed / unwitnessed]. [No / tonic-clonic] movements. Return to baseline [immediate / gradual].`,
    ros:`Constitutional: Denies fever.\nCardiovascular: Positive for syncope. Denies prior similar episodes / has had prior episodes. Denies chest pain.\nNeuro: Denies focal weakness, seizure history, or headache.\nGI: Denies blood in stool or melena.`,
    exam:`General: Alert, oriented x3, [at baseline]. No acute distress.\nCardiovascular: [Regular / irregular]. No murmurs. Orthostatic vitals: [lying / sitting / standing BP and HR].\nNeuro: Alert and oriented x3. No focal deficits. Gait [stable / unsteady].` },
  { id:"sob", label:"Shortness of Breath / Dyspnea", category:"Respiratory", emoji:"🫁",
    hpi_template:(age,u)=>`A ${age}-${u}-old presents with shortness of breath that began [suddenly / gradually] approximately [duration] ago. Dyspnea is [at rest / with exertion / both], severity [X]/10. Associated: [cough / fever / chest pain / wheezing / hemoptysis / orthopnea / PND / edema / none]. [No prior episodes / history of asthma / COPD / CHF / PE]. Recent travel or immobilization: [yes / no].`,
    ros:`Constitutional: [Positive / negative] for fever.\nCardiovascular: Denies chest pain, palpitations, edema.\nRespiratory: Positive for dyspnea. [Cough: productive / nonproductive / absent]. [Wheezing: present / absent]. Denies hemoptysis.\nMSK: Denies calf pain or swelling.`,
    exam:`General: Alert, oriented x3. [Mild / moderate / severe] respiratory distress. Speaking in [full sentences / partial sentences / words only].\nRespiratory: [Clear / decreased at bases / diffuse wheezes / bilateral rales]. RR [X]. SpO2 [X]% on [room air / O2].\nCardiovascular: [Rate]. No murmurs. No JVD. No edema.\nSkin: [No cyanosis / cyanosis noted].` },
  { id:"cough", label:"Cough", category:"Respiratory", emoji:"🫁",
    hpi_template:(age,u)=>`A ${age}-${u}-old presents with cough that began approximately [duration] ago. [Productive / nonproductive] with [clear / yellow / green / blood-tinged] sputum. Associated: [fever / dyspnea / wheezing / chest pain / sore throat / rhinorrhea / night sweats / none]. [Sick contacts: yes / no]. [Smoker: yes — X pack-years / no].`,
    ros:`Constitutional: [Positive / negative] for fever, chills.\nHeent: [Positive / negative] for sore throat or nasal congestion.\nRespiratory: Positive for cough. [Wheezing: yes / no]. Denies hemoptysis.\nGI: Denies nausea.`,
    exam:`General: Alert, oriented x3, no acute distress.\nHeent: Oropharynx [clear / erythematous]. No cervical lymphadenopathy.\nRespiratory: [Clear / diffuse wheezes / rhonchi / rales]. Non-labored.\nCardiovascular: Regular rate and rhythm.` },
  { id:"headache", label:"Headache", category:"Neurological", emoji:"🧠",
    hpi_template:(age,u)=>`A ${age}-${u}-old presents with headache that began approximately [duration] ago. Onset was [sudden / thunderclap / gradual]. Location: [bifrontal / unilateral / occipital / holocephalic]. Quality: [throbbing / pressure / stabbing / constant]. Severity: [X]/10. [This is / is not] the worst headache of their life. Associated: [nausea / vomiting / photophobia / phonophobia / fever / neck stiffness / focal deficits / none]. [No prior headaches / prior headache disorder: migraine / tension]. [This is / is not] similar to prior episodes.`,
    ros:`Constitutional: [Positive / negative] for fever.\nHeent: Positive for headache. [Photophobia: yes / no]. [Phonophobia: yes / no].\nNeuro: Denies focal weakness, vision changes, diplopia, or altered consciousness.\nPsych: Denies significant stressors.`,
    exam:`General: Alert and oriented x3. [Comfortable / photophobic / in pain].\nHeent: Normocephalic. Pupils equal, round, reactive. Extraocular movements intact. No papilledema.\nNeck: [Supple, no meningismus / Nuchal rigidity present. Kernig / Brudzinski: positive / negative].\nNeuro: Alert and oriented x3. CNs II-XII intact. No focal deficits. Gait steady.` },
  { id:"stroke_tia", label:"Stroke / TIA / Focal Deficit", category:"Neurological", emoji:"🧠",
    hpi_template:(age,u)=>`A ${age}-${u}-old presents with acute onset focal neurological deficit. Last known well: [time]. Symptoms: [facial droop / arm weakness / speech difficulty / leg weakness / vision changes / ataxia]. [Ongoing / resolved — duration X minutes]. [No / yes] associated headache or vomiting.`,
    ros:`Constitutional: Denies fever.\nCardiovascular: [Positive / negative] for palpitations or atrial fibrillation.\nNeuro: Positive for focal deficit. Denies preceding migraine aura.`,
    exam:`General: Alert, oriented x[X].\nNIHSS: [X] — [LOC / gaze / visual / facial palsy / arm motor / leg motor / ataxia / sensory / language / dysarthria / extinction]\nNeuro: Motor [5/5 all / deficits]. Speech [normal / dysarthric / aphasic]. Gaze [conjugate / deviated]. Facial droop: [right / left / none]. Sensation [intact / decreased].` },
  { id:"seizure", label:"Seizure", category:"Neurological", emoji:"🧠",
    hpi_template:(age,u)=>`A ${age}-${u}-old presents after a [generalized tonic-clonic / focal / unknown type] seizure approximately [duration] ago lasting [X minutes]. [First / recurrent] seizure. [Known epilepsy on medications / no prior history]. Postictal state [present / resolved]. [Tongue laceration / urinary incontinence / head trauma: yes / no]. Precipitants: [medication non-compliance / sleep deprivation / EtOH / fever / unknown].`,
    ros:`Constitutional: [Positive / negative] for fever or recent illness.\nNeuro: Positive for seizure. [Prior seizure history: yes / no].\nCardiovascular: Denies palpitations or prior syncope.`,
    exam:`General: [Postictal — drowsy / at baseline].\nHeent: [Tongue laceration: yes / no]. Pupils equal and reactive.\nNeuro: [Postictal: confused / at baseline]. No focal motor deficits. [Todd's paralysis: suspected / not present].` },
  { id:"altered_ms", label:"Altered Mental Status", category:"Neurological", emoji:"🧠",
    hpi_template:(age,u)=>`A ${age}-${u}-old presents with altered mental status. Change from baseline began approximately [duration] ago per [patient / family / EMS]. Baseline: [alert and oriented x3]. Change characterized by [confusion / agitation / somnolence / unresponsiveness]. Possible precipitants: [medication change / infection / metabolic / trauma / ingestion / unknown]. Recent: [fever / fall / new meds / substance use / none].`,
    ros:`Constitutional: [Positive / negative] for fever.\nNeuro: Positive for AMS.\nGU: [Positive / negative] for dysuria (UTI screen).`,
    exam:`General: [Agitated / lethargic / obtunded / comatose]. Oriented to [person / place / time].\nHeent: Pupils [equal / unequal]. PERRL [yes / sluggish].\nNeuro: GCS [E:X V:X M:X = X]. [Focal deficits: yes / none].\nSkin: [Trauma / jaundice / rash / diaphoresis / needle marks].` },
  { id:"dizziness", label:"Dizziness / Vertigo", category:"Neurological", emoji:"🧠",
    hpi_template:(age,u)=>`A ${age}-${u}-old presents with [room-spinning vertigo / lightheadedness / disequilibrium] that began approximately [duration] ago. [Sudden / gradual] onset. [Constant / episodic]. [Positional component: yes — worse with head turning / no]. Associated: [nausea / vomiting / hearing loss / tinnitus / headache / diplopia / focal deficits / none].`,
    ros:`Constitutional: Denies fever.\nHeent: [Positive / negative] for hearing loss or tinnitus.\nNeuro: Denies focal weakness, diplopia, or swallowing difficulty.\nGI: [Positive / negative] for nausea and vomiting.`,
    exam:`General: Alert and oriented x3, [comfortable / nauseated].\nEye: HINTS — Head Impulse [normal / abnormal]. Nystagmus: [direction-fixed horizontal / direction-changing / vertical]. Skew: [absent / present].\nNeuro: Finger-nose-finger [intact / dysmetric]. Gait: [steady / ataxic]. Romberg [negative / positive].` },
  { id:"abdominal_pain", label:"Abdominal Pain", category:"Abdominal", emoji:"🩺",
    hpi_template:(age,u)=>`A ${age}-${u}-old presents with abdominal pain that began approximately [duration] ago. Location: [RUQ / LUQ / RLQ / LLQ / periumbilical / epigastric / diffuse]. Quality: [sharp / dull / crampy / colicky / constant / intermittent], [X]/10. Radiation: [right shoulder / back / groin / none]. Associated: [nausea / vomiting / diarrhea / constipation / fever / anorexia / blood in stool / none]. Last BM: [date/character].`,
    ros:`Constitutional: [Positive / negative] for fever, chills, anorexia.\nGI: Positive for abdominal pain. [Nausea / vomiting / diarrhea / constipation / rectal bleeding: present / absent].\nGU: [Dysuria / hematuria: yes / no]. For females: [LMP / vaginal discharge].\nCardiovascular: Denies chest pain.`,
    exam:`General: Alert, oriented x3. [Comfortable / in mild / moderate / severe distress]. [Lying still / writhing / guarding].\nAbdomen: [Soft / rigid / distended]. Bowel sounds [present / hypoactive / absent]. Tenderness: [location, guarding, rigidity]. Rebound: [present / absent]. Murphy's: [positive / negative]. McBurney's: [positive / negative]. No hernia.` },
  { id:"nausea_vomiting", label:"Nausea / Vomiting", category:"Abdominal", emoji:"🩺",
    hpi_template:(age,u)=>`A ${age}-${u}-old presents with nausea and vomiting x[X] episodes that began approximately [duration] ago. Emesis is [bilious / nonbilious / bloody]. [Abdominal pain: yes — location / no]. [Fever: present / absent]. [Diarrhea: present / absent]. [Sick contacts / dietary indiscretion / travel / new meds]. Last oral intake: [time].`,
    ros:`Constitutional: [Positive / negative] for fever.\nGI: Positive for nausea and vomiting. [Abdominal pain / diarrhea: present / absent].\nGU: [Dysuria: yes / no]. For females: [LMP and pregnancy status].`,
    exam:`General: Alert, oriented x3. Appears [well-hydrated / mildly dehydrated]. Mucous membranes [moist / dry].\nAbdomen: Soft, [diffusely tender / non-tender], non-distended. Bowel sounds [present / hyperactive].` },
  { id:"flank_pain", label:"Flank Pain / Renal Colic", category:"Genitourinary", emoji:"🫘",
    hpi_template:(age,u)=>`A ${age}-${u}-old presents with [right / left] flank pain that began [suddenly / gradually] approximately [duration] ago. Pain is [colicky / constant] and radiates to [groin / testicle / labia / none], rated [X]/10. Associated: [nausea / vomiting / hematuria / dysuria / fever / none]. [Prior kidney stones: yes — passed / required intervention / no].`,
    ros:`Constitutional: [Positive / negative] for fever or chills.\nGU: Positive for flank pain. [Hematuria: gross / microscopic / none]. [Dysuria: yes / no].\nGI: [Nausea / vomiting: yes / no].`,
    exam:`General: Alert, oriented x3. [Writhing / uncomfortable / well-appearing].\nFlank: [Right / left] CVA tenderness [present — severe / mild / absent].\nAbdomen: Soft, non-tender, non-distended. No rebound.` },
  { id:"back_pain", label:"Back Pain / Low Back Pain", category:"Musculoskeletal", emoji:"🦴",
    hpi_template:(age,u)=>`A ${age}-${u}-old presents with [low / mid / upper] back pain that began approximately [duration] ago. Onset: [acute / after trauma or lift / spontaneous]. Pain is [axial / radiates to right / left leg]. Severity: [X]/10. [Neurological symptoms: saddle anesthesia / bowel or bladder dysfunction / weakness / none]. [Fever: present / absent]. [Malignancy history: yes / no].`,
    ros:`Constitutional: [Positive / negative] for fever, unexplained weight loss, or night pain.\nNeuro: [Positive / negative] for lower extremity weakness, numbness, bowel / bladder dysfunction.\nGU: Denies dysuria or hematuria.`,
    exam:`Back: Paraspinal tenderness [present / absent]. ROM [limited / full]. [Stepoff: present / absent]. SLR [positive at X degrees / negative bilaterally].\nNeuro: Lower extremity strength [5/5 / decreased]. Sensation [intact / decreased]. Reflexes [symmetric / abnormal]. Perineal sensation [intact — if assessed].` },
  { id:"skin_infection", label:"Skin Infection / Cellulitis", category:"Skin / Infectious", emoji:"🦠",
    hpi_template:(age,u)=>`A ${age}-${u}-old presents with skin infection / cellulitis of the [location] that began approximately [duration] ago. Area has [erythema / warmth / swelling / fluctuance / purulent drainage / streaking]. [Fever: present / absent]. [Portal of entry: wound / bite / skin breakdown / none]. [Expanding border: yes / no]. [MRSA history / immunocompromised / diabetes: yes / no].`,
    ros:`Constitutional: [Positive / negative] for fever, chills, rigors.\nSkin: Positive for skin infection. [MRSA history: yes / no].`,
    exam:`Skin ([location]): Erythema [X cm x X cm] with [marked borders]. [Warmth: present]. [Swelling: present]. [Fluctuance: present — abscess / absent]. [Purulent drainage: present / absent]. [Streaking / lymphangitis: present / absent]. [Bullae / necrosis: present — URGENT / absent].\nLymph nodes: Regional lymphadenopathy [present / absent].` },
  { id:"fever", label:"Fever / Sepsis Concern", category:"Skin / Infectious", emoji:"🦠",
    hpi_template:(age,u)=>`A ${age}-${u}-old presents with fever of [temperature] that began approximately [duration] ago. Associated: [chills / rigors / diaphoresis / fatigue / myalgias]. Source: [respiratory / urinary / skin / GI / CNS / unknown]. [Immunocompromised: yes / no]. [Recent travel / sick contacts: yes / no]. [Recent procedures / hospitalizations: yes / no].`,
    ros:`Constitutional: Positive for fever. [Chills / night sweats: present / absent].\nAll systems: assess for source — [respiratory / GI / GU / skin / CNS symptoms: present / absent].`,
    exam:`General: Alert, oriented x[X]. [Ill-appearing / comfortable]. [Diaphoretic / not].\nAll systems assessed for source: [respiratory — breath sounds] [abdomen — tenderness] [skin — rash] [neuro — meningismus].` },
  { id:"suicidal_ideation", label:"Suicidal Ideation / Self-Harm", category:"Psychiatric", emoji:"🧠",
    hpi_template:(age,u)=>`A ${age}-${u}-old presents with [suicidal ideation / suicide attempt / self-harm]. [Passive ideation / active ideation with plan: describe]. [Attempt: yes — method / no]. Intent and plan: [describe]. Access to means: [yes / no]. Precipitating stressor: [describe]. Prior attempts: [yes — number / no]. Current psychiatric treatment: [describe]. Substance use: [yes / no].`,
    ros:`Psych: Positive for SI as described. [Depression / anxiety / psychosis: present / absent]. [Command hallucinations: yes / no].\nNeuro: Denies altered consciousness or focal deficits.`,
    exam:`General: Alert, oriented x3. [Cooperative / guarded]. Affect: [dysphoric / flat / euthymic].\nPsych: Thought process [linear / disorganized]. SI: [present — plan/intent / no current active SI]. Hallucinations: [present / none]. Insight: [intact / impaired].\nSkin: Self-harm marks [present — describe / absent].` },
  { id:"overdose", label:"Overdose / Toxic Ingestion", category:"Psychiatric", emoji:"🧠",
    hpi_template:(age,u)=>`A ${age}-${u}-old presents after [intentional / accidental] ingestion of [substance, amount, formulation] approximately [duration] ago. Co-ingestions: [yes / unknown / none]. [SI: yes / no]. [Emesis since ingestion: yes / no]. Poison Control notified: [yes — recommendations / no].`,
    ros:`Neuro: [Positive / negative] for sedation, agitation, or seizure.\nCardiovascular: [Positive / negative] for palpitations.\nRespiratory: [Positive / negative] for dyspnea.`,
    exam:`General: Alert and oriented x[X]. [Sedated / agitated / responsive].\nToxidrome: Pupils [size]. Skin [dry / diaphoretic / flushed]. HR [X]. BP [X]. RR [X]. [Opioid / stimulant / anticholinergic / cholinergic pattern: assessed].\nNeuro: GCS [X]. Reflexes [normal / hyperreflexia / hyporeflexia].` },
  { id:"peds_fever", label:"Pediatric Fever", category:"Pediatric", emoji:"👶",
    hpi_template:(age,u)=>`A ${age}-${u}-old presents with fever of [temperature] that began approximately [duration] ago. [Well / ill-appearing]. Immunizations [up to date / incomplete]. Associated: [rash / URI / ear pain / vomiting / diarrhea / poor feeding / decreased urine output / none]. [Sick contacts: yes / no]. [Antipyretics given: yes — agent, dose / no].`,
    ros:`Constitutional: Positive for fever. Activity [normal / decreased]. Feeding [normal / poor].\nAll systems: [HEENT / respiratory / GI / GU / skin symptoms: present / absent].`,
    exam:`General: [Well / ill-appearing]. Alert. [Irritable / consolable].\nHeent: Fontanelle [flat / bulging — URGENT]. TMs [normal / bulging / erythematous]. Oropharynx [clear / erythematous].\nRespiratory: [Clear / crackles / wheeze]. Work of breathing: [none / mild / moderate / severe]. SpO2 [X]%.\nSkin: Rash [present — petechial / macular / urticarial / absent].` },
  { id:"peds_respiratory", label:"Pediatric Respiratory Distress", category:"Pediatric", emoji:"👶",
    hpi_template:(age,u)=>`A ${age}-${u}-old presents with [shortness of breath / wheezing / stridor / cough] that began approximately [duration] ago. [Preceding fever / illness: yes / no]. [Asthma history: yes / no]. [Foreign body risk: yes / no]. [Barky cough / inspiratory stridor: present — croup concern / absent]. Prior hospitalizations: [yes / no].`,
    ros:`Constitutional: [Positive / negative] for fever.\nRespiratory: Positive for distress. [Stridor: yes / no]. [Wheezing: yes / no]. [Barky cough: yes / no].\nGI: [Drooling: yes — epiglottitis concern / no].`,
    exam:`General: [Well / mildly / moderately / severely ill]. Speaking in [full sentences / unable to speak].\nRespiratory: RR [X]. SpO2 [X]%. [Clear / diffuse wheezes / focal decreased / crackles]. Work of breathing: [none / mild — subcostal / moderate — intercostal / severe — supraclavicular, nasal flaring, grunting].\nHeent: [Stridor: present — inspiratory / absent]. [Drooling: present / absent].` },
  { id:"trauma", label:"Trauma / MVC / Fall", category:"Trauma", emoji:"🚑",
    hpi_template:(age,u)=>`A ${age}-${u}-old presents following [MVC / fall / assault / sports injury] approximately [duration] ago. Mechanism: [describe speed, restraint, height of fall, type of assault]. [LOC: yes — duration / no]. [Amnesia: yes / no]. Complaints: [head / neck / chest / abdomen / extremity]. [EMS treatment rendered]. [Tetanus: up to date / unknown].`,
    ros:`Constitutional: [Positive / negative] for LOC.\nHeent: [Headache / vision changes: yes / no].\nNeck: [Neck pain: yes — midline / paraspinal / no].\nRespiratory: [Chest pain / dyspnea: yes / no].\nGI: [Abdominal pain: yes / no].`,
    exam:`Primary Survey: Airway [patent]. Breathing SpO2 [X]%. Circulation HR [X] BP [X/X]. GCS [X]. [External injuries: describe].\nSecondary: Head [lacerations / hematoma / Battle's / raccoon eyes: present / absent]. Neck [midline tenderness: present / absent]. Chest [wall tenderness / breath sounds equal]. Abdomen [soft / tender / seatbelt sign]. Pelvis [stable]. Extremities [deformities: describe].` },
  { id:"head_injury", label:"Head Injury / Concussion", category:"Trauma", emoji:"🚑",
    hpi_template:(age,u)=>`A ${age}-${u}-old presents after head injury approximately [duration] ago. Mechanism: [fall / MVC / direct blow / sports]. [LOC: yes — duration / no]. [Amnesia: yes — retrograde / anterograde / no]. [Vomiting: yes — X episodes / no]. [Headache: present / absent — X/10]. [Focal neurological symptoms: yes / no]. [Anticoagulation: yes / no].`,
    ros:`Neuro: [Positive / negative] for headache, vision changes, focal deficits, LOC, amnesia.\nGI: [Vomiting: yes — X episodes / no].`,
    exam:`General: Alert and oriented x[X]. GCS [X].\nHeent: [Scalp laceration / hematoma: present / absent]. [Battle's sign / raccoon eyes / hemotympanum / CSF leak: present / absent].\nNeck: [Midline c-spine tenderness: present / absent — NEXUS criteria applied].\nNeuro: CNs II-XII intact. Motor [5/5 / deficits]. Coordination [intact]. Gait [stable / unsteady].` },
  { id:"eye_pain", label:"Eye Pain / Vision Change", category:"ENT / Eye", emoji:"👁️",
    hpi_template:(age,u)=>`A ${age}-${u}-old presents with [eye pain / vision change / redness] in the [right / left / bilateral] eye approximately [duration] ago. Mechanism: [chemical / trauma / foreign body / spontaneous / UV exposure / contact lens]. [VA: affected / not affected]. [Discharge: watery / purulent / none]. [Halos around lights: yes — glaucoma concern / no].`,
    ros:`Heent: Positive for eye complaint. [Headache: yes / no]. [Halos: yes / no]. [Photophobia: yes / no].`,
    exam:`VA: [Right X / Left X]. Pupils: [Equal / unequal]. RAPD: [present / absent]. EOMs: [full / limited]. Conjunctiva: [Clear / injected]. Cornea: [Clear / fluorescein: abrasion / dendritic / normal]. AC: [Deep and clear / hypopyon / hyphema]. IOP: [X mmHg if measured].` },
  { id:"sore_throat", label:"Sore Throat", category:"ENT / Eye", emoji:"🦷",
    hpi_template:(age,u)=>`A ${age}-${u}-old presents with sore throat that began approximately [duration] ago. [Fever: present / absent]. [Exudates: present / absent]. [Cervical adenopathy: present / absent]. [Drooling / difficulty swallowing: yes — assess peritonsillar abscess or epiglottitis / no]. [Trismus: yes / no]. Centor score: [X].`,
    ros:`Constitutional: [Positive / negative] for fever.\nHeent: Positive for sore throat. [Dysphagia: yes / no]. [Drooling: yes / no]. [Stridor: yes — emergency / no].`,
    exam:`Oropharynx: [Erythema / exudates / tonsillar enlargement: present / absent]. [Peritonsillar bulge: present — uvula deviated / absent]. [Trismus: present / absent].\nNeck: Anterior cervical LAD [present — tender / absent].` },
  { id:"leg_swelling_dvt", label:"Leg Swelling / DVT Concern", category:"Vascular", emoji:"🩸",
    hpi_template:(age,u)=>`A ${age}-${u}-old presents with [right / left] lower extremity swelling and pain approximately [duration] ago. Wells DVT score: [X]. Risk factors: [immobilization / travel / surgery / malignancy / prior DVT / OCP / pregnancy / none]. [Calf tenderness: present / absent]. [Dyspnea or chest pain: yes — PE concern / no].`,
    ros:`Respiratory: [Positive / negative] for dyspnea or pleuritic chest pain.\nMSK: Positive for lower extremity swelling and pain.\nSkin: [Erythema / warmth: present / absent].`,
    exam:`Extremity ([right / left] lower): Circumference [asymmetry >3 cm: present / absent]. Swelling [pitting / non-pitting / absent]. Erythema / warmth [present / absent]. Calf tenderness [present / absent]. DP pulse [2+ / diminished].` },
];

// ─── CC PICKER ────────────────────────────────────────────────────────────────
export function CCPicker({ isOpen, onClose, onSelect, patientAge, patientAgeUnit }) {
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  const searchRef = useRef(null);

  const filtered = query.trim().length === 0
    ? CC_LIBRARY
    : CC_LIBRARY.filter(cc => cc.label.toLowerCase().includes(query.toLowerCase()) || cc.category.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => { if (isOpen) { setQuery(""); setHighlighted(0); setTimeout(() => searchRef.current?.focus(), 50); } }, [isOpen]);
  useEffect(() => { setHighlighted(0); }, [query]);

  const handleSelect = (cc) => {
    const age = patientAge || 20;
    const ageUnit = patientAgeUnit || "year";
    onSelect(cc.label, cc.hpi_template(age, ageUnit), cc.ros, cc.exam);
    onClose();
  };

  const handleKey = (e) => {
    if (!isOpen) return;
    if (e.key === "Escape") { e.preventDefault(); onClose(); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlighted(h => Math.min(h+1, filtered.length-1)); return; }
    if (e.key === "ArrowUp") { e.preventDefault(); setHighlighted(h => Math.max(h-1, 0)); return; }
    if (e.key === "Enter" && filtered[highlighted]) { e.preventDefault(); handleSelect(filtered[highlighted]); }
  };

  if (!isOpen) return null;

  const grouped = {};
  filtered.forEach(cc => { if (!grouped[cc.category]) grouped[cc.category] = []; grouped[cc.category].push(cc); });

  const overlayStyle = { position:"fixed", inset:0, zIndex:9500, background:"rgba(3,8,16,0.82)", backdropFilter:"blur(4px)", display:"flex", alignItems:"flex-start", justifyContent:"center", paddingTop:"60px", paddingBottom:"20px", paddingLeft:"16px", paddingRight:"16px" };
  const boxStyle = { background:"#081628", border:"1px solid rgba(0,184,154,0.3)", borderRadius:12, width:560, maxWidth:"96vw", maxHeight:"calc(100vh - 100px)", display:"flex", flexDirection:"column", boxShadow:"0 24px 64px rgba(0,0,0,0.7)" };
  const itemStyle = (hl) => ({ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", borderRadius:7, cursor:"pointer", background:hl?"rgba(0,229,192,0.1)":"transparent", border:hl?"1px solid rgba(0,229,192,0.25)":"1px solid transparent", marginBottom:2, transition:"all 0.08s" });

  let gIdx = 0;

  return (
    <div style={overlayStyle} onClick={onClose} onKeyDown={handleKey} tabIndex={-1}>
      <div style={boxStyle} onClick={e => e.stopPropagation()}>
        <div style={{ padding:"14px 18px 10px", borderBottom:"1px solid rgba(0,184,154,0.12)", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
            <p style={{ fontFamily:"'Playfair Display',serif", fontSize:13, fontWeight:700, color:"#00e5c0", margin:0 }}>Chief Complaint</p>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"rgba(200,223,240,0.35)" }}>Ctrl+T</span>
              <button onClick={onClose} style={{ background:"none", border:"none", color:"rgba(200,223,240,0.4)", fontSize:16, cursor:"pointer" }}>✕</button>
            </div>
          </div>
          <div style={{ position:"relative" }}>
            <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"rgba(200,223,240,0.35)", fontSize:13, pointerEvents:"none" }}>⌕</span>
            <input ref={searchRef} style={{ width:"100%", boxSizing:"border-box", background:"rgba(11,30,54,0.7)", border:"1px solid rgba(0,184,154,0.25)", borderRadius:6, color:"#c8dff0", fontFamily:"'DM Sans',sans-serif", fontSize:13, padding:"8px 12px 8px 32px", outline:"none" }}
              value={query} onChange={e => setQuery(e.target.value)} onKeyDown={handleKey} placeholder="Search chief complaints..." />
          </div>
        </div>
        <div style={{ overflowY:"auto", flex:1, padding:"8px 8px" }}>
          {filtered.length === 0 ? (
            <div style={{ padding:"24px", textAlign:"center", fontSize:13, color:"rgba(200,223,240,0.35)", fontStyle:"italic" }}>No matching complaints found</div>
          ) : query.trim() ? (
            filtered.map((cc, i) => (
              <div key={cc.id} style={itemStyle(i===highlighted)} onClick={() => handleSelect(cc)} onMouseEnter={() => setHighlighted(i)}>
                <span style={{ fontSize:15, flexShrink:0 }}>{cc.emoji}</span>
                <span style={{ fontSize:13, fontWeight:i===highlighted?600:400, color:i===highlighted?"#00e5c0":"#c8dff0", flex:1 }}>{cc.label}</span>
                <span style={{ fontSize:10, fontFamily:"'JetBrains Mono',monospace", color:"rgba(200,223,240,0.3)" }}>{cc.category}</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"rgba(200,223,240,0.25)" }}>↵</span>
              </div>
            ))
          ) : (
            Object.entries(grouped).map(([cat, items]) => (
              <div key={cat}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700, color:"rgba(200,223,240,0.35)", letterSpacing:"0.09em", textTransform:"uppercase", padding:"8px 10px 4px" }}>{items[0]?.emoji} {cat}</div>
                {items.map(cc => { const mi = gIdx++; const hl = mi===highlighted; return (
                  <div key={cc.id} style={itemStyle(hl)} onClick={() => handleSelect(cc)} onMouseEnter={() => setHighlighted(mi)}>
                    <span style={{ fontSize:13, fontWeight:hl?600:400, color:hl?"#00e5c0":"#c8dff0", flex:1 }}>{cc.label}</span>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"rgba(200,223,240,0.25)" }}>↵</span>
                  </div>
                ); })}
              </div>
            ))
          )}
        </div>
        <div style={{ padding:"8px 14px", borderTop:"1px solid rgba(0,184,154,0.1)", flexShrink:0, display:"flex", gap:12, alignItems:"center" }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"rgba(200,223,240,0.3)" }}>↑↓ navigate · ↵ select · Esc close</span>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"rgba(0,229,192,0.5)", marginLeft:"auto" }}>{filtered.length} complaints</span>
        </div>
      </div>
    </div>
  );
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function mdmLevelColor(level) {
  if (!level) return "#6b9ec8";
  const l = level.toLowerCase();
  if (l.includes("high"))            return "#ff4444";
  if (l.includes("moderate"))        return "#ff9f43";
  if (l.includes("low"))             return "#f5c842";
  if (l.includes("straightforward")) return "#3dffa0";
  return "#3b9eff";
}

export function dispColor(disp) {
  if (!disp) return "#6b9ec8";
  const d = disp.toLowerCase();
  if (d.includes("icu"))        return "#ff4444";
  if (d.includes("admit"))      return "#ff6b6b";
  if (d.includes("obs"))        return "#ff9f43";
  if (d.includes("transfer"))   return "#9b6dff";
  if (d.includes("precaution")) return "#f5c842";
  return "#3dffa0";
}

function SectionLabel({ children, color, style: extraStyle }) {
  return (
    <div className="qn-section-lbl"
      style={{ ...(color ? { color } : {}), ...(extraStyle || {}) }}>
      {children}
    </div>
  );
}

// Safe string coercion — prevents React Error #31 when AI returns unexpected objects
function s(val) {
  if (val === null || val === undefined) return "";
  if (typeof val === "string") return val;
  if (typeof val === "number") return String(val);
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
}

// ─── STEP PROGRESS ────────────────────────────────────────────────────────────
export function StepProgress({ phase1Done, phase2Done, p2Open }) {
  const steps = [
    { n:1, label:"Initial Assessment", sub:"CC · Vitals · HPI · ROS · Exam", done:phase1Done },
    { n:2, label:"Workup & Disposition", sub:"Labs · Imaging · Recheck Vitals", done:phase2Done },
  ];
  return (
    <div style={{ display:"flex", alignItems:"center", gap:0, marginBottom:14,
      padding:"10px 14px", borderRadius:10,
      background:"rgba(8,22,40,.6)", border:"1px solid rgba(42,79,122,.3)" }}
      className="no-print">
      {steps.map((step, i) => {
        const isActive = step.n === 1 ? !phase1Done : p2Open;
        const color = step.done ? "var(--qn-green)" : isActive ? "var(--qn-teal)" : "var(--qn-txt4)";
        return (
          <div key={step.n} style={{ display:"flex", alignItems:"center", flex: i === 0 ? "0 0 auto" : 1 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:26, height:26, borderRadius:"50%", flexShrink:0,
                display:"flex", alignItems:"center", justifyContent:"center",
                background: step.done ? "rgba(61,255,160,.15)" : isActive ? "rgba(0,229,192,.12)" : "rgba(42,79,122,.2)",
                border:`1.5px solid ${step.done ? "rgba(61,255,160,.5)" : isActive ? "rgba(0,229,192,.4)" : "rgba(42,79,122,.4)"}`,
                fontFamily:"'JetBrains Mono',monospace", fontSize:11, fontWeight:700, color }}>
                {step.done ? "✓" : step.n}
              </div>
              <div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600,
                  fontSize:12, color, lineHeight:1.2 }}>{step.label}</div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                  color:"var(--qn-txt4)", letterSpacing:.5 }}>{step.sub}</div>
              </div>
            </div>
            {i === 0 && (
              <div style={{ flex:1, height:1.5, margin:"0 14px",
                background: phase1Done
                  ? "linear-gradient(90deg,rgba(61,255,160,.5),rgba(0,229,192,.3))"
                  : "rgba(42,79,122,.3)",
                borderRadius:1, minWidth:24 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── INPUT ZONE ───────────────────────────────────────────────────────────────
export function InputZone({ label, value, onChange, placeholder, rows, phase, ref: _ref, onRef, onKeyDown, copyable, templateType, smartfill, kbdHint, vitalsTrendLink }) {
  const inputRef = useRef();
  const [copiedField, setCopiedField] = useState(false);
  const [showPicker,  setShowPicker]  = useState(false);
  useEffect(() => { if (onRef) onRef(inputRef); }, [onRef]);
  const phaseClass = phase === 1 ? " active-phase" : phase === 2 ? " p2-active" : "";
  const handleCopy = () => {
    if (!value.trim()) return;
    navigator.clipboard.writeText(value.trim()).then(() => {
      setCopiedField(true);
      setTimeout(() => setCopiedField(false), 2000);
    });
  };
  const handleKeyDown = e => {
    if (templateType && e.ctrlKey && (e.key === "t" || e.key === "T") && !e.metaKey) {
      e.preventDefault(); setShowPicker(p => !p); return;
    }
    if (onKeyDown) onKeyDown(e);
  };
  return (
    <div style={{ position:"relative" }}>
      <div style={{ display:"flex", alignItems:"center", marginBottom:6 }}>
        <SectionLabel color={phase === 2 ? "var(--qn-blue)" : undefined}
          style={{ marginBottom:0, flex:1 }}>
          {label}
          {kbdHint && (
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:"rgba(107,158,200,.5)", background:"rgba(42,79,122,.2)",
              border:"1px solid rgba(42,79,122,.35)", borderRadius:4,
              padding:"1px 6px", marginLeft:7, letterSpacing:.5,
              verticalAlign:"middle" }}>
              {kbdHint}
            </span>
          )}
          {vitalsTrendLink && (
            <span onClick={vitalsTrendLink}
              style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:"var(--qn-teal)", background:"rgba(0,229,192,.08)",
                border:"1px solid rgba(0,229,192,.25)", borderRadius:4,
                padding:"1px 7px", marginLeft:7, letterSpacing:.5,
                cursor:"pointer", verticalAlign:"middle", transition:"all .15s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,229,192,.18)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,229,192,.08)"; }}>
              📈 VitalsHub
            </span>
          )}
        </SectionLabel>
        <div style={{ display:"flex", gap:5 }}>
          {templateType && (
            <button onClick={() => setShowPicker(p => !p)}
              style={{ padding:"1px 8px", borderRadius:5, cursor:"pointer",
                fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
                border:`1px solid ${showPicker ? "rgba(0,229,192,.5)" : "rgba(42,79,122,.4)"}`,
                background:showPicker ? "rgba(0,229,192,.1)" : "rgba(14,37,68,.5)",
                color:showPicker ? "var(--qn-teal)" : "var(--qn-txt4)",
                letterSpacing:.5, textTransform:"uppercase", transition:"all .15s" }}>
              {templateType === "cc" ? "Ctrl+T · CC" : "Ctrl+T · Template"}
            </button>
          )}
          {copyable && value.trim() && (
            <button onClick={handleCopy}
              style={{ padding:"1px 8px", borderRadius:5, cursor:"pointer",
                fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
                border:`1px solid ${copiedField ? "rgba(61,255,160,.5)" : "rgba(42,79,122,.4)"}`,
                background:copiedField ? "rgba(61,255,160,.08)" : "rgba(14,37,68,.5)",
                color:copiedField ? "var(--qn-green)" : "var(--qn-txt4)",
                letterSpacing:.5, textTransform:"uppercase", transition:"all .15s" }}>
              {copiedField ? "✓" : "Copy"}
            </button>
          )}
        </div>
      </div>
      {templateType === "cc" && (
        <CCPicker
          isOpen={showPicker}
          onClose={() => setShowPicker(false)}
          onSelect={(label, hpi, ros, exam) => { onChange(hpi); inputRef.current?.focus(); }}
          patientAge={null}
          patientAgeUnit="year"
        />
      )}
      {showPicker && templateType !== "cc" && (
        <TemplatePicker
          type={templateType}
          hasContent={Boolean(value.trim())}
          onInsert={text => { onChange(text); inputRef.current?.focus(); }}
          onClose={() => setShowPicker(false)}
        />
      )}
      {smartfill && <SmartFillBar value={value} onChange={onChange} />}
      <textarea
        ref={inputRef}
        className={`qn-ta${phaseClass}`}
        data-phase={phase || 1}
        rows={rows || 4}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}

// ─── CLINICAL PLAN SELECTOR ───────────────────────────────────────────────────
export function ClinicalPlanSelector({ selectedIds, onChange, onCopy, onClose, copied }) {
  const totalCount = PLAN_CATEGORIES.reduce((sum, cat) => sum + cat.items.length, 0);
  const selectedCount = selectedIds ? selectedIds.size : 0;

  const toggle = (id) => {
    const next = new Set(selectedIds || []);
    next.has(id) ? next.delete(id) : next.add(id);
    onChange(next);
  };

  const selectAll = () => {
    const next = new Set();
    PLAN_CATEGORIES.forEach(cat => cat.items.forEach(item => next.add(item.id)));
    onChange(next);
  };

  const selectNone = () => onChange(new Set());

  const toggleCategory = (cat) => {
    const allSelected = cat.items.every(item => selectedIds && selectedIds.has(item.id));
    const next = new Set(selectedIds || []);
    if (allSelected) {
      cat.items.forEach(item => next.delete(item.id));
    } else {
      cat.items.forEach(item => next.add(item.id));
    }
    onChange(next);
  };

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(3,8,16,0.8)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: "#081628", border: "1px solid rgba(0,184,154,0.25)", borderRadius: 12, width: 540, maxWidth: "96vw", maxHeight: "88vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }}
      >
        {/* Header */}
        <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid rgba(0,184,154,0.12)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 14, fontWeight: 700, color: "#00e5c0" }}>Clinical Plan</span>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(200,223,240,0.4)", fontSize: 18, lineHeight: 1, padding: 0 }}>✕</button>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: selectedCount > 0 ? "#00e5c0" : "rgba(200,223,240,0.3)" }}>
              {selectedCount} / {totalCount} items selected
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              {[["All", selectAll], ["None", selectNone]].map(([label, action]) => (
                <button key={label} onClick={action} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fontWeight: 700, textTransform: "uppercase", border: "1px solid rgba(0,184,154,0.25)", background: "transparent", color: "rgba(200,223,240,0.45)", borderRadius: 4, padding: "3px 10px", cursor: "pointer" }}>{label}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ overflowY: "auto", padding: "12px 20px", flex: 1 }}>
          {PLAN_CATEGORIES.map(cat => {
            const allSel = cat.items.every(item => selectedIds && selectedIds.has(item.id));
            const someSel = !allSel && cat.items.some(item => selectedIds && selectedIds.has(item.id));
            const catStatus = allSel ? { label: "✓ All", color: "#00e5c0" } : someSel ? { label: "partial", color: "rgba(200,223,240,0.3)" } : { label: "none", color: "rgba(200,223,240,0.2)" };
            return (
              <div key={cat.id} style={{ marginBottom: 14 }}>
                <div onClick={() => toggleCategory(cat)} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", marginBottom: 6 }}>
                  <span style={{ fontSize: 13 }}>{cat.icon}</span>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "rgba(200,223,240,0.5)", flex: 1 }}>{cat.label}</span>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: catStatus.color }}>{catStatus.label}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
                  {cat.items.map(item => {
                    const sel = selectedIds && selectedIds.has(item.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => toggle(item.id)}
                        style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 5, cursor: "pointer", transition: "all 0.1s", border: sel ? "1px solid rgba(0,229,192,0.35)" : "1px solid rgba(0,184,154,0.08)", background: sel ? "rgba(0,229,192,0.07)" : "rgba(11,30,54,0.3)" }}
                      >
                        <div style={{ width: 14, height: 14, borderRadius: 3, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", border: sel ? "1px solid #00e5c0" : "1px solid rgba(200,223,240,0.2)", background: sel ? "#00e5c0" : "transparent" }}>
                          {sel && <span style={{ color: "#081628", fontSize: 9, fontWeight: 700, lineHeight: 1 }}>✓</span>}
                        </div>
                        <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "11.5px", color: sel ? "#c8dff0" : "rgba(200,223,240,0.45)", lineHeight: 1.3 }}>{item.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 20px", borderTop: "1px solid rgba(0,184,154,0.12)", display: "flex", gap: 10, flexShrink: 0, alignItems: "center" }}>
          <button onClick={onClose} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 700, textTransform: "uppercase", border: "1px solid rgba(200,223,240,0.15)", background: "transparent", color: "rgba(200,223,240,0.4)", padding: "9px 18px", borderRadius: 6, cursor: "pointer" }}>
            Cancel
          </button>
          <button
            onClick={onCopy}
            disabled={selectedCount === 0}
            style={{ flex: 1, fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 700, textTransform: "uppercase", border: copied ? "1px solid rgba(0,229,192,0.8)" : "1px solid rgba(0,229,192,0.5)", background: copied ? "rgba(0,229,192,0.18)" : "rgba(0,229,192,0.1)", color: "#00e5c0", padding: "9px 18px", borderRadius: 6, cursor: selectedCount === 0 ? "not-allowed" : "pointer", opacity: selectedCount === 0 ? 0.4 : 1, transition: "all 0.15s" }}
          >
            {copied ? "✓ Copied to Clipboard" : `Copy Note (${selectedCount} plan items)`}
          </button>
          <button
            onClick={() => { onChange(null); onCopy(); }}
            style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: 700, textTransform: "uppercase", border: "1px solid rgba(0,184,154,0.2)", background: "transparent", color: "rgba(0,229,192,0.5)", padding: "9px 14px", borderRadius: 6, cursor: "pointer" }}
          >
            Skip Plan
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── RE-EXPORTS ───────────────────────────────────────────────────────────────
export { MedsAllergyZone };
export { DifferentialCard, QuickDDxCard, MDMResult, ClinicalCalcsCard };
export { DiagnosisCodingCard, InterventionsCard, DispositionResult };

// ─── HPI BUILDER ─────────────────────────────────────────────────────────────

function parseHPITemplate(template) {
  const segments = [];
  const regex = /\[([^\]]+)\]/g;
  let lastIndex = 0, match;
  while ((match = regex.exec(template)) !== null) {
    if (match.index > lastIndex) segments.push({ type:"text", value:template.slice(lastIndex, match.index) });
    const inner = match[1].trim();
    const labelMatch = inner.match(/^([^:]+):\s*(.+)$/);
    const content = labelMatch ? labelMatch[2] : inner;
    const label   = labelMatch ? labelMatch[1].trim() : null;
    if (content.includes(" / ")) {
      const options = content.split(" / ").map(o => o.trim());
      segments.push({ type:"choice", label, options, selected:null, custom:"" });
    } else {
      segments.push({ type:"input", label:label||content, value:"", placeholder:content });
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < template.length) segments.push({ type:"text", value:template.slice(lastIndex) });
  return segments;
}

function buildHPIOutput(segments) {
  return segments.map(seg => {
    if (seg.type === "text")   return seg.value;
    if (seg.type === "choice") {
      if (seg.selected === "__custom__") return seg.custom || "[" + (seg.label||"...") + "]";
      return seg.selected || "[" + (seg.label || seg.options?.join(" / ") || "...") + "]";
    }
    if (seg.type === "input") return seg.value || "[" + (seg.label||"...") + "]";
    return "";
  }).join("");
}

export function HPIBuilder({ template, onApply, onClose, ccLabel }) {
  const [segments, setSegments] = useState(() => parseHPITemplate(template || ""));
  const [showPreview, setShowPreview] = useState(false);
  const prevTemplate = useRef(template);

  useEffect(() => {
    if (template !== prevTemplate.current) {
      prevTemplate.current = template;
      setSegments(parseHPITemplate(template || ""));
    }
  }, [template]);

  const setChoice  = (i, v) => setSegments(p => p.map((s, idx) => idx===i ? { ...s, selected:v, custom:v==="__custom__"?s.custom:"" } : s));
  const setCustom  = (i, v) => setSegments(p => p.map((s, idx) => idx===i ? { ...s, custom:v } : s));
  const setInput   = (i, v) => setSegments(p => p.map((s, idx) => idx===i ? { ...s, value:v } : s));
  const clearChoice= (i)    => setSegments(p => p.map((s, idx) => idx===i ? { ...s, selected:null, custom:"" } : s));

  const output      = buildHPIOutput(segments);
  const choiceSegs  = segments.filter(s => s.type==="choice");
  const inputSegs   = segments.filter(s => s.type==="input");
  const totalFields = choiceSegs.length + inputSegs.length;
  const totalDone   = choiceSegs.filter(s => s.selected).length + inputSegs.filter(s => s.value.trim()).length;
  const allDone     = totalDone === totalFields;
  const pct         = totalFields > 0 ? Math.round((totalDone/totalFields)*100) : 100;

  const chip = (active) => ({ display:"inline-flex", alignItems:"center", padding:"2px 9px", borderRadius:12, cursor:"pointer", fontSize:12, fontWeight:active?600:400, fontFamily:"'DM Sans',sans-serif", border:active?"1px solid #00e5c0":"1px solid rgba(0,184,154,0.2)", background:active?"rgba(0,229,192,0.15)":"rgba(11,30,54,0.5)", color:active?"#00e5c0":"rgba(200,223,240,0.5)", transition:"all 0.1s", userSelect:"none" });

  return (
    <div style={{ position:"fixed", inset:0, zIndex:9400, background:"rgba(3,8,16,0.85)", backdropFilter:"blur(4px)", display:"flex", alignItems:"flex-start", justifyContent:"center", padding:"60px 16px 20px" }} onClick={onClose}>
      <div style={{ background:"#081628", border:"1px solid rgba(0,184,154,0.3)", borderRadius:12, width:620, maxWidth:"96vw", maxHeight:"calc(100vh - 100px)", display:"flex", flexDirection:"column", boxShadow:"0 24px 64px rgba(0,0,0,0.7)" }} onClick={e=>e.stopPropagation()}>

        <div style={{ padding:"14px 18px 12px", borderBottom:"1px solid rgba(0,184,154,0.12)", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
            <p style={{ fontFamily:"'Playfair Display',serif", fontSize:13, fontWeight:700, color:"#00e5c0", margin:0 }}>HPI Builder</p>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              {ccLabel && <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"#00b89a", border:"1px solid rgba(0,184,154,0.3)", borderRadius:3, padding:"1px 7px" }}>{ccLabel}</span>}
              <button onClick={onClose} style={{ background:"none", border:"none", color:"rgba(200,223,240,0.4)", fontSize:16, cursor:"pointer" }}>✕</button>
            </div>
          </div>
          <div style={{ height:3, background:"rgba(0,184,154,0.1)", borderRadius:2, overflow:"hidden" }}>
            <div style={{ height:"100%", width:pct+"%", background:allDone?"#00e5c0":"rgba(0,184,154,0.5)", transition:"width 0.3s", borderRadius:2 }} />
          </div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:allDone?"#00e5c0":"rgba(200,223,240,0.35)", letterSpacing:"0.06em", marginTop:4 }}>
            {totalFields > 0 ? totalDone+" of "+totalFields+" fields completed" : "Ready to apply"}
          </div>
        </div>

        <div style={{ overflowY:"auto", flex:1, padding:"14px 18px" }}>
          <div style={{ fontSize:13.5, color:"#c8dff0", lineHeight:2.4, fontFamily:"'DM Sans',sans-serif" }}>
            {segments.map((seg, i) => {
              if (seg.type==="text") return <span key={i}>{seg.value}</span>;
              if (seg.type==="choice") return (
                <span key={i} style={{ display:"inline-flex", flexWrap:"wrap", gap:4, verticalAlign:"middle", margin:"0 2px" }}>
                  {seg.label && <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"rgba(200,223,240,0.35)", marginRight:3, verticalAlign:"middle" }}>{seg.label}:</span>}
                  {seg.options.map(opt => <span key={opt} style={chip(seg.selected===opt)} onClick={()=>seg.selected===opt?clearChoice(i):setChoice(i,opt)}>{opt}</span>)}
                  <span style={chip(seg.selected==="__custom__")} onClick={()=>seg.selected==="__custom__"?clearChoice(i):setChoice(i,"__custom__")}>other...</span>
                  {seg.selected==="__custom__" && <input autoFocus value={seg.custom||""} onChange={e=>setCustom(i,e.target.value)} placeholder="type here..." style={{ display:"inline-block", background:"rgba(11,30,54,0.7)", border:"1px solid rgba(0,229,192,0.35)", borderRadius:4, color:"#c8dff0", fontFamily:"'DM Sans',sans-serif", fontSize:12, padding:"2px 7px", outline:"none", width:120, marginLeft:4, verticalAlign:"middle" }} onClick={e=>e.stopPropagation()} />}
                  {seg.selected && <span style={{ display:"inline-flex", alignItems:"center", padding:"2px 7px", borderRadius:12, cursor:"pointer", fontSize:10, fontFamily:"'JetBrains Mono',monospace", border:"1px solid rgba(255,77,79,0.25)", color:"rgba(255,77,79,0.4)", marginLeft:2 }} onClick={()=>clearChoice(i)}>✕</span>}
                </span>
              );
              if (seg.type==="input") return <input key={i} value={seg.value} onChange={e=>setInput(i,e.target.value)} placeholder={seg.label||"..."} style={{ display:"inline-block", background:"rgba(11,30,54,0.6)", border:"1px solid rgba(0,184,154,0.2)", borderRadius:4, color:"#c8dff0", fontFamily:"'DM Sans',sans-serif", fontSize:12, padding:"2px 8px", outline:"none", minWidth:80, maxWidth:160, verticalAlign:"middle", margin:"0 2px" }} />;
              return null;
            })}
          </div>
          {showPreview && (
            <div style={{ background:"rgba(11,30,54,0.6)", border:"1px solid rgba(0,184,154,0.15)", borderRadius:8, padding:"12px 14px", fontSize:13, color:"#c8dff0", lineHeight:1.7, marginTop:14, whiteSpace:"pre-wrap" }}>
              {output}
            </div>
          )}
        </div>

        <div style={{ padding:"12px 18px", borderTop:"1px solid rgba(0,184,154,0.12)", display:"flex", gap:8, alignItems:"center", flexShrink:0 }}>
          <button onClick={()=>setShowPreview(p=>!p)} style={{ padding:"7px 14px", borderRadius:6, cursor:"pointer", fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700, letterSpacing:"0.07em", textTransform:"uppercase", border:"1px solid rgba(0,184,154,0.25)", background:"transparent", color:"rgba(200,223,240,0.45)" }}>
            {showPreview?"Hide Preview":"Preview HPI"}
          </button>
          <button onClick={onClose} style={{ padding:"7px 14px", borderRadius:6, cursor:"pointer", fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700, letterSpacing:"0.07em", textTransform:"uppercase", border:"1px solid rgba(200,223,240,0.15)", background:"transparent", color:"rgba(200,223,240,0.4)" }}>Cancel</button>
          <button onClick={()=>{ onApply(output); onClose(); }} style={{ flex:1, padding:"9px 0", borderRadius:6, cursor:"pointer", fontFamily:"'JetBrains Mono',monospace", fontSize:11, fontWeight:700, letterSpacing:"0.07em", textTransform:"uppercase", border:"1px solid rgba(0,229,192,0.5)", background:"rgba(0,229,192,0.1)", color:"#00e5c0" }}>
            Apply to HPI
          </button>
        </div>
      </div>
    </div>
  );
}

export function InlineCopyBtn({ getValue, label = "Copy" }) {
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    const text = typeof getValue === "function" ? getValue() : getValue;
    if (!text?.trim()) return;
    try { await navigator.clipboard.writeText(text.trim()); }
    catch {
      const el = document.createElement("textarea");
      el.value = text.trim();
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handle} title={label} style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"3px 9px", borderRadius:4, cursor:"pointer", fontFamily:"'JetBrains Mono',monospace", fontSize:9.5, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase", border: copied ? "1px solid #00e5c0" : "1px solid rgba(0,184,154,0.2)", background: copied ? "rgba(0,229,192,0.1)" : "transparent", color: copied ? "#00e5c0" : "rgba(200,223,240,0.35)", transition:"all 0.15s", flexShrink:0, lineHeight:1 }}>
      {copied ? "✓" : "⎘"} {copied ? "Copied" : "Copy"}
    </button>
  );
}