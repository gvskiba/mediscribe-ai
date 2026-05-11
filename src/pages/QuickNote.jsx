// QuickNote.jsx  v11.4
// v11.4 adds:
//   - generateClinicalPlan: AI generates treatment plan + action items for MDM section
//   - generateLabRecs: AI guideline-based lab recommendations (chip selector)
//   - generateImagingRecs: AI guideline-based imaging recommendations (chip selector)
//   - All 11 HPI scaffolds expanded with full OPQRST, risk factors, red flags
//   - treatmentPlanBusy state + Generate Plan button in MDM result card

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { dispColor, StepProgress,
         DiagnosisCodingCard, InterventionsCard,
         DifferentialCard, ClinicalCalcsCard } from "./QuickNoteComponents";
import { injectQNStyles } from "./QuickNoteStyle.jsx";
import { PatientBanner, FatigueBanner, UndoToast, NhResumeBanner,
         VhImportBanner, VhAnalysisCard, AddendumBanner } from "./QuickNoteBanners";
import { KbHelpModal } from "./QuickNoteKbHelp";
import { Phase1Panel } from "./QuickNotePhase1Panel";
import { Phase2Panel } from "./QuickNotePhase2Panel";
import { ActionBar } from "./QuickNoteActionBar";
import { TimelineCard } from "./QuickNoteTimeline";
import { SepsisBanner } from "./QuickNoteSepsis";
import { ProcedureNoteModal } from "./QuickNoteProcedure";
import { PriorVisitsPanel } from "./QuickNoteExtras";
import { DEFAULT_EXPANSIONS } from "./QuickNoteVoice";
import { QuickNoteROSHelper } from "./QuickNoteROSHelper";
import { QuickNoteExamHelper } from "@/components/quicknote/QuickNoteExamHelper";
import { QuickNoteAbnormals } from "@/components/quicknote/QuickNoteAbnormals";
import QuickNoteHPIScaffold from "./QuickNoteHPIScaffold";
import QuickNotePatientQueue from "./QuickNotePatientQueue";
import QuickNoteMDMCard from "./QuickNoteMDMCard";
import QuickNoteDispositionCard from "./QuickNoteDispositionCard";
import QuickNoteProgressDashboard from "./QuickNoteProgressDashboard";
import {
  MDM_SCHEMA, DISP_SCHEMA,
  buildMDMPrompt, buildDispPrompt, buildMDMBlock,
  buildFullNote, buildPhase1Copy, buildPhase2Copy,
} from "./QuickNotePrompts";

injectQNStyles();

// ─── CRITICAL VALUE DETECTOR ──────────────────────────────────────────────────
function detectCriticalValues(labsText) {
  if (!labsText) return [];
  const flags = [];
  const rules = [
    { re:/K\+?\s*[:\-]?\s*([0-9.]+)/i,            label:"K+",          lo:3.0,  hi:6.0  },
    { re:/Na\+?\s*[:\-]?\s*([0-9.]+)/i,           label:"Na+",         lo:125,  hi:155  },
    { re:/glucose\s*[:\-]?\s*([0-9.]+)/i,         label:"Glucose",     lo:50,   hi:500  },
    { re:/lactate\s*[:\-]?\s*([0-9.]+)/i,         label:"Lactate",     lo:null, hi:4.0  },
    { re:/troponin[^0-9]*([0-9.]+)/i,             label:"Troponin",    lo:null, hi:0.04 },
    { re:/creatinine\s*[:\-]?\s*([0-9.]+)/i,      label:"Creatinine",  lo:null, hi:4.0  },
    { re:/ph\s*[:\-]?\s*([0-9.]+)/i,              label:"pH",          lo:7.2,  hi:7.6  },
    { re:/hgb\s*[:\-]?\s*([0-9.]+)/i,             label:"Hgb",         lo:7.0,  hi:null },
    { re:/inr\s*[:\-]?\s*([0-9.]+)/i,             label:"INR",         lo:null, hi:4.0  },
    { re:/wbc\s*[:\-]?\s*([0-9.]+)/i,             label:"WBC",         lo:null, hi:30   },
  ];
  rules.forEach(({ re, label, lo, hi }) => {
    const m = labsText.match(re);
    if (!m) return;
    const val = parseFloat(m[1]);
    if (isNaN(val)) return;
    if ((lo !== null && val < lo) || (hi !== null && val > hi))
      flags.push({ label, value: m[1] });
  });
  return flags;
}

// ─── OPQRST gap detection ─────────────────────────────────────────────────────
const OPQRST_REQUIRED = {
  "chest pain":           ["Onset","Character","Location","Radiation","Severity","Aggravating","Relieving","Associated"],
  "shortness of breath":  ["Onset","Severity","Timing","Aggravating","Relieving","Associated"],
  "abdominal pain":       ["Onset","Character","Location","Severity","Timing","Aggravating","Relieving","Associated"],
  "headache":             ["Onset","Character","Location","Severity","Timing","Aggravating","Relieving","Associated"],
  "back pain":            ["Onset","Character","Location","Radiation","Severity","Timing","Aggravating","Relieving","Associated"],
  "dizziness":            ["Onset","Character","Timing","Aggravating","Relieving","Associated"],
  "syncope":              ["Onset","Timing","Associated"],
  "palpitations":         ["Onset","Character","Timing","Aggravating","Relieving","Associated"],
  "altered mental status":["Onset","Character","Associated"],
  "fever":                ["Onset","Associated"],
  "nausea":               ["Onset","Timing","Aggravating","Relieving","Associated"],
};
const OPQRST_DEFAULT = ["Onset","Severity","Associated"];
function getExpectedOPQRST(ccText) {
  const lower = (ccText || "").toLowerCase();
  for (const [key, fields] of Object.entries(OPQRST_REQUIRED)) {
    if (lower.includes(key)) return fields;
  }
  return OPQRST_DEFAULT;
}

// ─── Slot serialization ───────────────────────────────────────────────────────
function serializeSlot(slotState, idx) {
  const { cc="",vitals="",hpi="",ros="",exam="",labs="",imaging="",ekg="",newVitals="",
    medsRaw="",allergiesRaw="",parsedMeds=[],parsedAllergies=[],
    mdmResult=null,dispResult=null,icdSelected=[],interventions=[],
    hpiSummary=null,hpiMode="original",encounterType="adult",
    patientName="",patientAge="" } = slotState;
  const blob = JSON.stringify({ vitals,ekg,newVitals,medsRaw,allergiesRaw,
    parsedMeds,parsedAllergies,mdmResult,dispResult,icdSelected,interventions,
    hpiSummary,hpiMode,encounterType,patientName,patientAge });
  return { source:"QN-SlotCache", status:"active",
    patient_identifier:`slot:${idx}`,
    encounter_date:new Date().toISOString().split("T")[0],
    cc,hpi_raw:hpi,ros_raw:ros,exam_raw:exam,labs_raw:labs,imaging_raw:imaging,
    full_note_text:vitals, working_diagnosis:mdmResult?.working_diagnosis||"",
    mdm_level:mdmResult?.mdm_level||"",mdm_narrative:mdmResult?.mdm_narrative||"",
    meds_raw:medsRaw,allergies_raw:allergiesRaw,raw_note:blob };
}

function deserializeSlot(record) {
  let blob = {};
  try { blob = JSON.parse(record.raw_note||"{}"); } catch {}
  return { cc:record.cc||"",hpi:record.hpi_raw||"",ros:record.ros_raw||"",
    exam:record.exam_raw||"",labs:record.labs_raw||"",imaging:record.imaging_raw||"",
    vitals:blob.vitals||record.full_note_text||"",ekg:blob.ekg||"",
    newVitals:blob.newVitals||"",medsRaw:blob.medsRaw||"",allergiesRaw:blob.allergiesRaw||"",
    parsedMeds:blob.parsedMeds||[],parsedAllergies:blob.parsedAllergies||[],
    mdmResult:blob.mdmResult||null,dispResult:blob.dispResult||null,
    icdSelected:blob.icdSelected||[],interventions:blob.interventions||[],
    hpiSummary:blob.hpiSummary||null,hpiMode:blob.hpiMode||"original",
    encounterType:blob.encounterType||"adult",patientName:blob.patientName||"",
    patientAge:blob.patientAge||"",p2Open:!!(blob.mdmResult),
    savedNoteId:null,lastActivity:Date.now() };
}

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

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function QuickNote({ embedded = false, demo, vitals: initVitals, cc: initCC }) {
  const [cc,     setCC]     = useState(initCC?.text || "");
  const [vitals, setVitals] = useState(() => {
    if (!initVitals) return "";
    return [
      initVitals.hr   ? `HR ${initVitals.hr}`      : null,
      initVitals.bp   ? `BP ${initVitals.bp}`      : null,
      initVitals.rr   ? `RR ${initVitals.rr}`      : null,
      initVitals.spo2 ? `SpO2 ${initVitals.spo2}%` : null,
      initVitals.temp ? `T ${initVitals.temp}`      : null,
    ].filter(Boolean).join("  ");
  });
  const [hpi,  setHpi]  = useState("");
  const [ros,  setRos]  = useState("");
  const [exam, setExam] = useState("");
  const [labs,      setLabs]      = useState("");
  const [imaging,   setImaging]   = useState("");
  const [ekg,       setEkg]       = useState("");
  const [newVitals, setNewVitals] = useState("");
  const [formatMode,    setFormatMode]    = useState("plain");
  const [pasteReady,    setPasteReady]    = useState("labeled");
  const [encounterType, setEncounterType] = useState("adult");
  const [isBounceback,   setIsBounceback]   = useState(false);
  const [bouncebackDate, setBouncebackDate] = useState("");
  const [consults, setConsults] = useState([]);

  const DEFAULT_EVENTS = [
    { id:"triage",       label:"Triage",                   time:"", notes:"" },
    { id:"physician",    label:"Physician Evaluation",      time:"", notes:"" },
    { id:"labs_ordered", label:"Labs Ordered",              time:"", notes:"" },
    { id:"labs_result",  label:"Labs Resulted",             time:"", notes:"" },
    { id:"img_ordered",  label:"Imaging Ordered",           time:"", notes:"" },
    { id:"img_result",   label:"Imaging Resulted",          time:"", notes:"" },
    { id:"recheck",      label:"Recheck Vitals / Reassess", time:"", notes:"" },
    { id:"disposition",  label:"Disposition Decision",      time:"", notes:"" },
  ];
  const [timestamps, setTimestamps] = useState(DEFAULT_EVENTS);

  const [ekgBusy,      setEkgBusy]      = useState(false);
  const [autoExamBusy, setAutoExamBusy] = useState(false);
  const [scaffoldOpen, setScaffoldOpen] = useState(false);

  const [workupRationale,     setWorkupRationale]     = useState(null);
  const [workupRationaleBusy, setWorkupRationaleBusy] = useState(false);
  const [copiedWorkup,        setCopiedWorkup]        = useState(false);
  const [autoRosBusy, setAutoRosBusy] = useState(false);

  const [patientPregnant,    setPatientPregnant]    = useState("Unknown");
  const [patientWeight,      setPatientWeight]      = useState("");
  const [showProcedureModal, setShowProcedureModal] = useState(false);
  const [priorVisits,        setPriorVisits]        = useState(null);
  const [priorVisitsLoading, setPriorVisitsLoading] = useState(false);
  const [signOutBusy,        setSignOutBusy]        = useState(false);
  const [signOutDone,        setSignOutDone]        = useState(false);
  const [showSDM,            setShowSDM]            = useState(false);
  const [showAttestation,    setShowAttestation]    = useState(false);
  const [showNursingHandoff, setShowNursingHandoff] = useState(false);
  const [rerunAddendumBusy,  setRerunAddendumBusy]  = useState(false);

  const [patientResponse, setPatientResponse] = useState("");
  const [mdmHistory,      setMdmHistory]      = useState([]);
  const [mdmInitialTs,    setMdmInitialTs]    = useState(null);
  const [showMdmHistory,  setShowMdmHistory]  = useState(false);
  const [treatmentPlan,   setTreatmentPlan]   = useState("");
  const [actionPlan,      setActionPlan]      = useState("");
  const [providerInfo,    setProviderInfo]    = useState({ name:"", credentials:"", facility:"" });

  // v11.4: Clinical plan + lab/imaging recs
  const [treatmentPlanBusy, setTreatmentPlanBusy] = useState(false);
  const [labRecs,            setLabRecs]           = useState(null);
  const [labRecsBusy,        setLabRecsBusy]       = useState(false);
  const [imagingRecs,        setImagingRecs]       = useState(null);
  const [imagingRecsBusy,    setImagingRecsBusy]   = useState(false);

  // Slots
  const EMPTY_SLOT = () => ({
    cc:"", vitals:"", hpi:"", ros:"", exam:"",
    labs:"", imaging:"", ekg:"", newVitals:"",
    medsRaw:"", allergiesRaw:"", parsedMeds:[], parsedAllergies:[],
    mdmResult:null, dispResult:null, icdSelected:[], icdSuggestions:[],
    interventions:[], hpiSummary:null, hpiMode:"original",
    encounterType:"adult", p2Open:false,
    patientName:"", patientAge:"", savedNoteId:null, lastActivity:Date.now(),
  });
  const [slots,      setSlots]      = useState(() => [EMPTY_SLOT(),EMPTY_SLOT(),EMPTY_SLOT(),EMPTY_SLOT()]);
  const [activeSlot, setActiveSlot] = useState(0);
  const slotRef      = useRef(activeSlot);
  const [undoData,   setUndoData]   = useState(null);
  const [undoTimer,  setUndoTimer]  = useState(null);
  const [showUndo,   setShowUndo]   = useState(false);
  const [draftId,    setDraftId]    = useState(null);
  const slotStateRef = useRef({});
  const [slotCacheIds,      setSlotCacheIds]      = useState([null,null,null,null]);
  const [slotSaveTimes,     setSlotSaveTimes]     = useState([null,null,null,null]);
  const [slotSaving,        setSlotSaving]        = useState(false);
  const [slotsRestored,     setSlotsRestored]     = useState(false);
  const [slotsRestoredCount,setSlotsRestoredCount]= useState(0);
  const slotsRef        = useRef(slots);
  const slotCacheIdsRef = useRef(slotCacheIds);
  const activeSlotRef   = useRef(activeSlot);
  const slotSavingRef   = useRef(false);
  useEffect(() => { slotsRef.current = slots; },             [slots]);
  useEffect(() => { slotCacheIdsRef.current = slotCacheIds; },[slotCacheIds]);
  useEffect(() => { activeSlotRef.current = activeSlot; },   [activeSlot]);

  const saveCurrentToSlot = useCallback((idx, state) => {
    setSlots(prev => { const next=[...prev]; next[idx]={...prev[idx],...state}; return next; });
  }, []);

  const switchToSlot = useCallback((idx) => {
    if (idx === activeSlot) return;
    saveCurrentToSlot(activeSlot, slotStateRef.current);
    setSlots(prev => {
      const slot = prev[idx] || EMPTY_SLOT();
      setCC(slot.cc||""); setVitals(slot.vitals||""); setHpi(slot.hpi||"");
      setRos(slot.ros||""); setExam(slot.exam||"");
      setLabs(slot.labs||""); setImaging(slot.imaging||"");
      setEkg(slot.ekg||""); setNewVitals(slot.newVitals||"");
      setMedsRaw(slot.medsRaw||""); setAllergiesRaw(slot.allergiesRaw||"");
      setParsedMeds(slot.parsedMeds||[]); setParsedAllergies(slot.parsedAllergies||[]);
      setMdmResult(slot.mdmResult||null); setDispResult(slot.dispResult||null);
      setIcdSelected(slot.icdSelected||[]); setIcdSuggestions([]);
      setInterventions(slot.interventions||[]);
      setHpiSummary(slot.hpiSummary||null); setHpiMode(slot.hpiMode||"original");
      setEncounterType(slot.encounterType||"adult"); setP2Open(slot.p2Open||false);
      setP1Error(null); setP2Error(null);
      setWorkupRationale(null); setConsults([]);
      setHpiGaps([]);
      setLabRecs(null); setImagingRecs(null);
      setTreatmentPlan(""); setActionPlan("");
      return prev;
    });
    setActiveSlot(idx); slotRef.current = idx;
  }, [activeSlot, saveCurrentToSlot]);

  const [mdmResult,  setMdmResult]  = useState(null);
  const [dispResult, setDispResult] = useState(null);
  const [p1Busy,     setP1Busy]     = useState(false);
  const [p2Busy,     setP2Busy]     = useState(false);
  const [p1Error,    setP1Error]    = useState(null);
  const [p2Error,    setP2Error]    = useState(null);
  const [copied,     setCopied]     = useState(false);
  const [p2Open,     setP2Open]     = useState(false);
  const [copiedMDM,           setCopiedMDM]           = useState(false);
  const [copiedDisch,         setCopiedDisch]         = useState(false);
  const [copiedMDMFull,       setCopiedMDMFull]       = useState(false);
  const [copiedMDMOnly,       setCopiedMDMOnly]       = useState(false);
  const [copiedDischargeOnly, setCopiedDischargeOnly] = useState(false);
  const [savedNote,           setSavedNote]           = useState(false);
  const [saving,              setSaving]              = useState(false);
  const [sentToNPI,           setSentToNPI]           = useState(false);
  const [sendingNPI,          setSendingNPI]          = useState(false);
  const [fatigueDismissed,    setFatigueDismissed]    = useState(false);
  const [vhImported,          setVhImported]          = useState(false);
  const [vhDismissed,         setVhDismissed]         = useState(false);
  const [vhAnalysis,          setVhAnalysis]          = useState(null);
  const [vhAnalysisDismissed, setVhAnalysisDismissed]= useState(false);
  const [nhResumed,           setNhResumed]           = useState(false);
  const [nhResumeDismissed,   setNhResumeDismissed]   = useState(false);
  const [showKbHelp,          setShowKbHelp]          = useState(false);
  const [addendumMode,        setAddendumMode]        = useState(false);
  const [addendumRef,         setAddendumRef]         = useState(null);
  const [medsRaw,         setMedsRaw]         = useState("");
  const [allergiesRaw,    setAllergiesRaw]    = useState("");
  const [parsedMeds,      setParsedMeds]      = useState([]);
  const [parsedAllergies, setParsedAllergies] = useState([]);
  const [medsParsing,     setMedsParsing]     = useState(false);
  const [medsError,       setMedsError]       = useState(null);
  const [quickDDx,          setQuickDDx]          = useState(null);
  const [quickDDxBusy,      setQuickDDxBusy]      = useState(false);
  const [quickDDxErr,       setQuickDDxErr]       = useState(null);
  const [quickDDxDismissed, setQuickDDxDismissed] = useState(false);
  const [hpiSummary,   setHpiSummary]   = useState(null);
  const [hpiSumBusy,   setHpiSumBusy]   = useState(false);
  const [hpiSumError,  setHpiSumError]  = useState(null);
  const [copiedHpiSum, setCopiedHpiSum] = useState(false);
  const [hpiMode,      setHpiMode]      = useState("original");
  const [hpiStructureBusy,  setHpiStructureBusy]  = useState(false);
  const [hpiStructureError, setHpiStructureError] = useState(null);
  const [hpiGaps, setHpiGaps] = useState([]);
  // v11.4: auto-extracted from HPI Structure for MedsAllergyZone import
  const [medsFromHpi,      setMedsFromHpi]      = useState([]);
  const [allergiesFromHpi, setAllergiesFromHpi]  = useState([]);
  const [icdSuggestions, setIcdSuggestions] = useState([]);
  const [icdSelected,    setIcdSelected]    = useState([]);
  const [icdSearching,   setIcdSearching]   = useState(false);
  const [icdError,       setIcdError]       = useState(null);
  const [interventions,  setInterventions]  = useState([]);
  const [intLoading,     setIntLoading]     = useState(false);
  const [intGenerated,   setIntGenerated]   = useState(false);
  const [copiedP1,     setCopiedP1]     = useState(false);
  const [copiedP2,     setCopiedP2]     = useState(false);
  const [copiedInputs, setCopiedInputs] = useState(false);

  const effectiveHpi = hpiMode === "summary" && hpiSummary ? hpiSummary : hpi;
  const phase1Ready  = Boolean(cc.trim() || hpi.trim() || exam.trim());
  const phase2Ready  = Boolean(mdmResult && (labs.trim() || imaging.trim() || newVitals.trim()));
  const hasAnyResult = Boolean(mdmResult || dispResult);
  const criticalFlags = useMemo(() => detectCriticalValues(labs), [labs]);

  const fieldRefs    = useRef([]);
  const setRef       = useCallback((idx) => (ref) => { fieldRefs.current[idx] = ref; }, []);
  const advanceFocus = useCallback((idx) => { fieldRefs.current[idx+1]?.current?.focus(); }, []);

  // ── MDM ────────────────────────────────────────────────────────────────────
  const runMDM = useCallback(async () => {
    if (!phase1Ready || p1Busy) return;
    setP1Busy(true); setP1Error(null); setMdmResult(null); setDispResult(null);
    setWorkupRationale(null); setLabRecs(null); setImagingRecs(null);
    try {
      const bouncebackCtx = isBounceback
        ? `\nBOUNCEBACK: Patient returning within 72h${bouncebackDate?` (prior visit: ${bouncebackDate})`:""}.`:"";
      const patientCtx = [
        patientPregnant==="Yes"?"PREGNANCY: PREGNANT — avoid teratogens, adjust radiation decisions.":"",
        patientPregnant==="Unknown"?"PREGNANCY STATUS: Unknown — consider ordering pregnancy test.":"",
        patientWeight?`PATIENT WEIGHT: ${patientWeight}kg — use for weight-based dosing.`:"",
      ].filter(Boolean).join("\n");
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: buildMDMPrompt(cc,vitals,hpi,ros,exam,vhAnalysis,parsedMeds,parsedAllergies,encounterType)
          + (bouncebackCtx ? "\n"+bouncebackCtx : "") + (patientCtx ? "\n"+patientCtx : ""),
        response_json_schema: MDM_SCHEMA,
      });
      setMdmResult(res); setP2Open(true);
      const ts = new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});
      setMdmInitialTs(ts);
      setMdmHistory([{ts,trigger:"Initial Impression",
        working_diagnosis:res.working_diagnosis||"",mdm_level:res.mdm_level||"",
        mdm_narrative:res.mdm_narrative||""}]);
      setIcdSuggestions([]); setIcdSelected([]); setIcdError(null);
      setInterventions([]); setIntGenerated(false); setQuickDDxDismissed(true);
    } catch(e) { setP1Error("MDM generation failed: "+(e.message||"Check API")); }
    finally { setP1Busy(false); }
  }, [cc,vitals,hpi,ros,exam,phase1Ready,p1Busy,vhAnalysis,parsedMeds,parsedAllergies,
      encounterType,isBounceback,bouncebackDate,patientPregnant,patientWeight]);

  // ── Disposition ────────────────────────────────────────────────────────────
  const runDisposition = useCallback(async () => {
    if (!mdmResult || p2Busy) return;
    setP2Busy(true); setP2Error(null); setDispResult(null);
    try {
      const consultCtx = consults.length
        ? "\nCONSULTS:\n"+consults.map(c=>`  ${c.service}${c.provider?" — Dr."+c.provider:""}${c.time?" at "+c.time:""}: ${c.recommendation}`).join("\n"):"";
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: buildDispPrompt(mdmResult,labs,imaging,newVitals,cc,hpi,vitals,ros,exam,parsedMeds,parsedAllergies,ekg,encounterType)
          + consultCtx
          + (patientResponse.trim()?`\n\nPATIENT RESPONSE TO TREATMENT:\n${patientResponse}`:""),
        response_json_schema: DISP_SCHEMA,
      });
      setDispResult(res); setIntGenerated(false); setIntLoading(false);
    } catch(e) { setP2Error("Disposition generation failed: "+(e.message||"Check API")); }
    finally { setP2Busy(false); }
  }, [mdmResult,labs,imaging,newVitals,cc,hpi,vitals,ros,exam,p2Busy,ekg,parsedMeds,parsedAllergies,consults,patientResponse]);

  // ── Workup Rationale ───────────────────────────────────────────────────────
  const runWorkupRationale = useCallback(async () => {
    if (!mdmResult||workupRationaleBusy) return;
    setWorkupRationaleBusy(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt:`Write a 2-3 sentence workup rationale paragraph for the chart. Working Dx: ${mdmResult.working_diagnosis}. Must-not-miss: ${mdmResult.differential?.filter(d=>d.must_not_miss).map(d=>d.diagnosis).join(", ")||"none"}. Workup: ${(mdmResult.recommended_actions||[]).join("; ")}. No headers/bullets. Return JSON: { "rationale_paragraph": "..." }`,
        response_json_schema:{type:"object",required:["rationale_paragraph"],properties:{rationale_paragraph:{type:"string"}}},
      });
      setWorkupRationale(res?.rationale_paragraph?.trim()||"");
    } catch(e) { console.error("Workup rationale failed:",e); }
    finally { setWorkupRationaleBusy(false); }
  }, [mdmResult,workupRationaleBusy]);

  // ── v11.4: Generate Clinical Plan (Treatment Plan + Action Items) ──────────
  const generateClinicalPlan = useCallback(async () => {
    if (!mdmResult||treatmentPlanBusy) return;
    setTreatmentPlanBusy(true);
    try {
      const schema = {
        type:"object", required:["treatment_plan","action_items"],
        properties:{
          treatment_plan:{ type:"string" },
          action_items:{ type:"array", items:{ type:"string" } },
        },
      };
      const medsCtx = parsedMeds.length
        ? "\nCurrent medications: "+parsedMeds.map(m=>`${m.name} ${m.dose} ${m.route} ${m.frequency}`).join(", "):"";
      const allergyCtx = parsedAllergies.length
        ? "\nAllergies: "+parsedAllergies.map(a=>`${a.allergen} (${a.reaction})`).join(", "):"";
      const weightCtx = patientWeight ? `\nWeight: ${patientWeight}kg` : "";
      const pregnancyCtx = patientPregnant==="Yes" ? "\nPATIENT IS PREGNANT — avoid teratogenic medications." : "";

      const res = await base44.integrations.Core.InvokeLLM({
        prompt:`You are a board-certified emergency physician generating an evidence-based clinical management plan.

WORKING DIAGNOSIS: ${mdmResult.working_diagnosis||""}
DIFFERENTIAL: ${mdmResult.differential?.map(d=>d.diagnosis).join(", ")||""}
MDM LEVEL: ${mdmResult.mdm_level||""}
CRITICAL ACTIONS: ${(mdmResult.critical_actions||[]).join("; ")||"none"}
RECOMMENDED ACTIONS: ${(mdmResult.recommended_actions||[]).join("; ")||""}
CC: ${cc}
VITALS: ${vitals}
ENCOUNTER TYPE: ${encounterType}
${medsCtx}${allergyCtx}${weightCtx}${pregnancyCtx}

Generate two things:
1. treatment_plan: A 2-4 sentence narrative of the evidence-based treatment plan for this ED presentation. Include specific medications with doses, routes, and frequencies where appropriate. Reference guidelines (ACEP, ACC/AHA, UpToDate) where applicable. Account for allergies and current medications.
2. action_items: Array of 5-10 specific, actionable, discrete orders/tasks for this encounter. Each should be a single actionable statement (e.g., "Aspirin 325mg PO now if no aspirin allergy", "IV access x2 large bore, NS 1L bolus", "12-lead EKG within 10 minutes of arrival", "Cardiology consult — STEMI alert if EKG confirms", "NPO in anticipation of possible intervention"). Include monitoring, nursing orders, and disposition-related items.

Return JSON only.`,
        response_json_schema: schema,
      });
      if (res?.treatment_plan?.trim()) setTreatmentPlan(res.treatment_plan.trim());
      if (res?.action_items?.length) {
        setActionPlan(res.action_items.map(item => `• ${item}`).join("\n"));
      }
    } catch(e) { console.error("Clinical plan generation failed:",e); }
    finally { setTreatmentPlanBusy(false); }
  }, [mdmResult,cc,vitals,encounterType,parsedMeds,parsedAllergies,patientWeight,patientPregnant,treatmentPlanBusy]);

  // ── v11.4: AI Lab Recommendations ─────────────────────────────────────────
  const generateLabRecs = useCallback(async () => {
    if (!mdmResult||labRecsBusy) return;
    setLabRecsBusy(true); setLabRecs(null);
    try {
      const schema = {
        type:"object", required:["immediate","urgent","consider"],
        properties:{
          immediate:{ type:"array", items:{ type:"object", required:["name","rationale","category"],
            properties:{ name:{type:"string"}, rationale:{type:"string"}, category:{type:"string"} }}},
          urgent:{ type:"array", items:{ type:"object", required:["name","rationale","category"],
            properties:{ name:{type:"string"}, rationale:{type:"string"}, category:{type:"string"} }}},
          consider:{ type:"array", items:{ type:"object", required:["name","rationale","category"],
            properties:{ name:{type:"string"}, rationale:{type:"string"}, category:{type:"string"} }}},
        },
      };
      const res = await base44.integrations.Core.InvokeLLM({
        prompt:`You are a board-certified emergency physician recommending evidence-based laboratory studies.

WORKING DIAGNOSIS: ${mdmResult.working_diagnosis||""}
DIFFERENTIAL: ${mdmResult.differential?.map(d=>d.diagnosis).join(", ")||""}
CC: ${cc}
VITALS: ${vitals}
MDM LEVEL: ${mdmResult.mdm_level||""}
ENCOUNTER TYPE: ${encounterType}

Recommend evidence-based labs categorized as:
- immediate: Must order now to guide resuscitation or time-sensitive treatment decisions
- urgent: Should order this visit to support diagnosis or safe disposition
- consider: May add clinical value based on exam findings or risk stratification

For each lab: name (specific — e.g., "Troponin I serial q3h x2", "BMP", "Lactate"), rationale (one concise sentence explaining clinical question it answers), category (cardiac/metabolic/hematologic/infectious/coagulation/renal/hepatic/pulmonary/toxicology/other).

Ground recommendations in ACEP clinical policies, ACC/AHA guidelines, UpToDate evidence. Return JSON only.`,
        response_json_schema: schema,
      });
      setLabRecs(res);
    } catch(e) { console.error("Lab recs failed:",e); }
    finally { setLabRecsBusy(false); }
  }, [mdmResult,cc,vitals,encounterType,labRecsBusy]);

  // ── v11.4: AI Imaging Recommendations ─────────────────────────────────────
  const generateImagingRecs = useCallback(async () => {
    if (!mdmResult||imagingRecsBusy) return;
    setImagingRecsBusy(true); setImagingRecs(null);
    try {
      const schema = {
        type:"object", required:["recommended","consider"],
        properties:{
          recommended:{ type:"array", items:{ type:"object", required:["modality","indication","guideline","priority"],
            properties:{ modality:{type:"string"}, indication:{type:"string"}, guideline:{type:"string"}, priority:{type:"string"} }}},
          consider:{ type:"array", items:{ type:"object", required:["modality","indication","guideline"],
            properties:{ modality:{type:"string"}, indication:{type:"string"}, guideline:{type:"string"} }}},
        },
      };
      const pregnancyWarning = patientPregnant==="Yes"
        ? "\nPATIENT IS PREGNANT — minimize radiation. Prefer ultrasound or MRI where clinically equivalent." : "";
      const res = await base44.integrations.Core.InvokeLLM({
        prompt:`You are a board-certified emergency physician recommending evidence-based imaging studies.

WORKING DIAGNOSIS: ${mdmResult.working_diagnosis||""}
DIFFERENTIAL: ${mdmResult.differential?.map(d=>d.diagnosis).join(", ")||""}
CC: ${cc}
VITALS: ${vitals}
MDM LEVEL: ${mdmResult.mdm_level||""}
ENCOUNTER TYPE: ${encounterType}
${pregnancyWarning}

Recommend imaging categorized as:
- recommended: Clearly indicated by guidelines for this presentation (e.g., CXR for dyspnea, CT Head for thunderclap headache)
- consider: May be indicated depending on exam findings, risk stratification, or clinical trajectory

For each study: modality (specific — e.g., "CT Chest with IV contrast", "Bedside POCUS — cardiac views"), indication (why — one sentence), guideline (e.g., "ACR Appropriateness Criteria", "ACEP Clinical Policy", "Ottawa Rules", "HEART Pathway"), priority (stat/urgent/routine).

Return JSON only.`,
        response_json_schema: schema,
      });
      setImagingRecs(res);
    } catch(e) { console.error("Imaging recs failed:",e); }
    finally { setImagingRecsBusy(false); }
  }, [mdmResult,cc,vitals,encounterType,patientPregnant,imagingRecsBusy]);

  // ── EKG ────────────────────────────────────────────────────────────────────
  const interpretEKG = useCallback(async (ekgText) => {
    if (!ekgText||ekgBusy) return;
    setEkgBusy(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt:`Write one-sentence EKG interpretation for ED chart. Include rate, rhythm, key intervals, significant findings, ST changes explicitly. EKG: ${ekgText}. Return JSON: { "interpretation": "..." }`,
        response_json_schema:{type:"object",required:["interpretation"],properties:{interpretation:{type:"string"}}},
      });
      if (res?.interpretation) setEkg(res.interpretation.trim());
    } catch(e) { console.error("EKG failed:",e); }
    finally { setEkgBusy(false); }
  }, [ekgBusy]);

  // ── Auto-ROS ───────────────────────────────────────────────────────────────
  const autoRosFromHpi = useCallback(async () => {
    if (!hpi.trim()||autoRosBusy) return;
    setAutoRosBusy(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt:`Extract ROS from nursing HPI — only explicitly mentioned symptoms as (+) or (-), organized by body system. HPI: ${hpi}. Return JSON: { "ros_text": "..." }`,
        response_json_schema:{type:"object",required:["ros_text"],properties:{ros_text:{type:"string"}}},
      });
      if (res?.ros_text?.trim()) setRos(res.ros_text.trim());
    } catch(e) { console.error("Auto-ROS failed:",e); }
    finally { setAutoRosBusy(false); }
  }, [hpi,autoRosBusy]);

  // ── Auto-PE ────────────────────────────────────────────────────────────────
  const autoExamFromCC = useCallback(async () => {
    if (!cc.trim()||autoExamBusy) return;
    setAutoExamBusy(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt:`Generate pertinent PE template for ED CC: "${cc}". Relevant systems only. Use bracket placeholders for findings. Return JSON: { "exam_text": "..." }`,
        response_json_schema:{type:"object",required:["exam_text"],properties:{exam_text:{type:"string"}}},
      });
      if (res?.exam_text?.trim()) setExam(res.exam_text.trim());
    } catch(e) { console.error("Auto-exam failed:",e); }
    finally { setAutoExamBusy(false); }
  }, [cc,autoExamBusy]);

  // ── Smart Structure HPI ────────────────────────────────────────────────────
  const structureHPI = useCallback(async () => {
    if (!hpi.trim()||hpiStructureBusy) return;
    setHpiStructureBusy(true); setHpiStructureError(null);
    setHpiSummary(null); setHpiGaps([]);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt:`Extract OPQRST from nursing triage note. CC: ${cc||"not specified"}. NOTE: ${hpi}.
Format as labeled fields, one per line. Omit lines not present. No inference. Use exact phrasing.
Also return:
- chief_complaint_extracted: chief complaint as short phrase
- fields_found: array of OPQRST field names populated
- meds_extracted: array of medications mentioned in the note — each { name, dose, route, frequency } — use exact values, omit fields not stated. Return empty array if none mentioned.
- allergies_extracted: array of allergies mentioned — each { allergen, reaction } — return empty array if none mentioned.
Return JSON: { "structured_hpi": "...", "chief_complaint_extracted": "...", "fields_found": ["..."], "meds_extracted": [], "allergies_extracted": [] }`,
        response_json_schema:{
          type:"object",
          required:["structured_hpi","chief_complaint_extracted","fields_found"],
          properties:{
            structured_hpi:{type:"string"},
            chief_complaint_extracted:{type:"string"},
            fields_found:{type:"array",items:{type:"string"}},
            meds_extracted:{type:"array",items:{
              type:"object",
              properties:{name:{type:"string"},dose:{type:"string"},route:{type:"string"},frequency:{type:"string"}},
            }},
            allergies_extracted:{type:"array",items:{
              type:"object",
              properties:{allergen:{type:"string"},reaction:{type:"string"}},
            }},
          },
        },
      });
      const text = res?.structured_hpi?.trim()||"";
      if (!text) throw new Error("Empty response");
      setHpiSummary(text); setHpiMode("summary");
      if (!cc.trim()&&res.chief_complaint_extracted?.trim()) setCC(res.chief_complaint_extracted.trim());
      const fieldsFound = (res.fields_found||[]).map(f=>f.toLowerCase());
      const expected    = getExpectedOPQRST(cc.trim()||res.chief_complaint_extracted||"");
      setHpiGaps(expected.filter(f=>!fieldsFound.includes(f.toLowerCase())));
      // v11.4: populate meds/allergies found in nursing note for MedsAllergyZone import nudge
      if (res.meds_extracted?.length)      setMedsFromHpi(res.meds_extracted);
      if (res.allergies_extracted?.length) setAllergiesFromHpi(res.allergies_extracted);
    } catch(e) { setHpiStructureError("HPI structure failed: "+(e.message||"Check API")); }
    finally { setHpiStructureBusy(false); }
  }, [hpi,cc,hpiStructureBusy]);

  // ── Structure → Prose chain ────────────────────────────────────────────────
  const summarizeFromStructure = useCallback(async () => {
    if (!hpiSummary?.trim()||hpiSumBusy) return;
    setHpiSumBusy(true); setHpiSumError(null);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt:`Convert this OPQRST outline to a physician HPI paragraph. No added details. Past tense, 3rd person, 3-5 sentences, no labels/headers. OPQRST: ${hpiSummary}. Return JSON: { "summary": "..." }`,
        response_json_schema:{type:"object",required:["summary"],properties:{summary:{type:"string"}}},
      });
      const text=res?.summary?.trim()||"";
      if (!text) throw new Error("Empty response");
      setHpiSummary(text); setHpiMode("summary"); setHpiGaps([]);
    } catch(e) { setHpiSumError("Narrative conversion failed: "+(e.message||"Check API")); }
    finally { setHpiSumBusy(false); }
  }, [hpiSummary,hpiSumBusy]);

  // ── Summarize HPI ──────────────────────────────────────────────────────────
  const summarizeHPI = useCallback(async () => {
    if (!hpi.trim()||hpiSumBusy) return;
    setHpiSumBusy(true); setHpiSumError(null); setHpiSummary(null);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt:`Rewrite nursing HPI as physician clinical paragraph. No added details. Past tense, 3rd person, 3-5 sentences, no headers/bullets. SOURCE HPI: ${hpi}. Return JSON: { "summary": "..." }`,
        response_json_schema:{type:"object",required:["summary"],properties:{summary:{type:"string"}}},
      });
      const text=res?.summary?.trim()||"";
      if (!text) throw new Error("Empty response");
      setHpiSummary(text);
    } catch(e) { setHpiSumError("HPI summary failed: "+(e.message||"Check API")); }
    finally { setHpiSumBusy(false); }
  }, [hpi,hpiSumBusy]);

  // ── Meds/Allergies ─────────────────────────────────────────────────────────
  const parseMedsAllergies = useCallback(async () => {
    if ((!medsRaw.trim()&&!allergiesRaw.trim())||medsParsing) return;
    setMedsParsing(true); setMedsError(null);
    try {
      const schema={type:"object",required:["medications","allergies"],properties:{
        medications:{type:"array",items:{type:"object",required:["name","dose","route","frequency"],
          properties:{name:{type:"string"},dose:{type:"string"},route:{type:"string"},frequency:{type:"string"}}}},
        allergies:{type:"array",items:{type:"object",required:["allergen","reaction"],
          properties:{allergen:{type:"string"},reaction:{type:"string"}}}},
      }};
      const res = await base44.integrations.Core.InvokeLLM({
        prompt:`Parse meds: ${medsRaw||"none"}. Allergies: ${allergiesRaw||"none"}. Generic name, dose, route (PO/IV/SQ/IM/TOP/INH/SL), frequency (Daily/BID/TID/QID/QHS/PRN). JSON only.`,
        response_json_schema:schema,
      });
      setParsedMeds(res?.medications||[]); setParsedAllergies(res?.allergies||[]);
    } catch(e) { setMedsError("Parse failed: "+(e.message||"try again")); }
    finally { setMedsParsing(false); }
  }, [medsRaw,allergiesRaw,medsParsing]);

  // ── Quick DDx ──────────────────────────────────────────────────────────────
  const runQuickDDx = useCallback(async () => {
    if (quickDDxBusy||(!cc.trim()&&!hpi.trim())) return;
    setQuickDDxBusy(true); setQuickDDxErr(null); setQuickDDxDismissed(false);
    try {
      const schema={type:"object",required:["differential"],properties:{differential:{type:"array",minItems:3,maxItems:5,
        items:{type:"object",required:["diagnosis","probability","supporting_evidence","against","must_not_miss"],
          properties:{diagnosis:{type:"string"},probability:{type:"string"},
            supporting_evidence:{type:"string"},against:{type:"string"},must_not_miss:{type:"boolean"}}}}}};
      const res = await base44.integrations.Core.InvokeLLM({
        prompt:`ED rapid differential. CC: ${cc||"?"} HPI: ${hpi||"?"} Vitals: ${vitals||"?"} ${ros?"ROS:"+ros:""} ${exam?"PE:"+exam:""}. 3-5 dx with probability, supporting_evidence, against, must_not_miss. JSON only.`,
        response_json_schema:schema,
      });
      if (!res?.differential?.length) throw new Error("Empty response");
      setQuickDDx(res.differential);
    } catch(e) { setQuickDDxErr("Quick DDx failed: "+(e.message||"try again")); }
    finally { setQuickDDxBusy(false); }
  }, [quickDDxBusy,cc,hpi,vitals,ros,exam]);

  // ── ICD-10 ─────────────────────────────────────────────────────────────────
  const searchICD10 = useCallback(async (diagnosisText) => {
    if (!diagnosisText||icdSearching) return;
    setIcdSearching(true); setIcdError(null); setIcdSuggestions([]);
    try {
      const schema={type:"object",required:["codes"],properties:{codes:{type:"array",minItems:1,maxItems:6,
        items:{type:"object",required:["code","description","type","specificity_note"],
          properties:{code:{type:"string"},description:{type:"string"},type:{type:"string"},specificity_note:{type:"string"}}}}}};
      const res = await base44.integrations.Core.InvokeLLM({
        prompt:`ICD-10-CM codes for "${diagnosisText}" in ED. 4-6 billable codes, primary→secondary. JSON only.`,
        response_json_schema:schema,
      });
      setIcdSuggestions(res?.codes||[]);
    } catch(e) { setIcdError("ICD-10 search failed: "+(e.message||"")); }
    finally { setIcdSearching(false); }
  }, [icdSearching]);

  // ── Interventions ──────────────────────────────────────────────────────────
  const generateInterventions = useCallback(async () => {
    if (intLoading||intGenerated) return;
    setIntLoading(true);
    try {
      const schema={type:"object",required:["interventions"],properties:{interventions:{type:"array",maxItems:12,
        items:{type:"object",required:["type","name","confirmed"],
          properties:{type:{type:"string"},name:{type:"string"},dose_route:{type:"string"},
            time_given:{type:"string"},response:{type:"string"},confirmed:{type:"boolean"}}}}}};
      const res = await base44.integrations.Core.InvokeLLM({
        prompt:`Pre-populate ED interventions list. CC: ${cc} Dx: ${mdmResult?.working_diagnosis} Disposition: ${dispResult?.disposition||"TBD"}. type: medication|procedure|iv_access|monitoring|imaging|lab|other. confirmed: true. JSON only.`,
        response_json_schema:schema,
      });
      setInterventions((res?.interventions||[]).map((item,i)=>({...item,id:`int-${i}-${Date.now()}`})));
      setIntGenerated(true);
    } catch(e) { console.error("Interventions failed:",e); }
    finally { setIntLoading(false); }
  }, [intLoading,intGenerated,cc,mdmResult,dispResult]);

  // ── Scaffold ───────────────────────────────────────────────────────────────
  const getScaffold = useCallback((ccText) => {
    if (!ccText?.trim()) return null;
    const lower = ccText.toLowerCase().trim();
    if (HPI_SCAFFOLDS[lower]) return { text:HPI_SCAFFOLDS[lower], cc:lower };
    if (HPI_ALIASES[lower]) return { text:HPI_SCAFFOLDS[HPI_ALIASES[lower]], cc:HPI_ALIASES[lower] };
    for (const [key] of Object.entries(HPI_SCAFFOLDS)) { if (lower.includes(key)) return { text:HPI_SCAFFOLDS[key], cc:key }; }
    for (const [alias,target] of Object.entries(HPI_ALIASES)) { if (lower.includes(alias)) return { text:HPI_SCAFFOLDS[target], cc:target }; }
    return null;
  }, []);

  const loadPriorVisits = useCallback(async () => {
    if (priorVisitsLoading) return;
    setPriorVisitsLoading(true);
    try {
      const filter = demo?.mrn?{patient_identifier:demo.mrn,sort:"-encounter_date",limit:5}:{sort:"-encounter_date",limit:5};
      const results = await base44.entities.ClinicalNote.list(filter).catch(()=>[]);
      setPriorVisits((results||[]).filter(r=>r.status==="finalized"&&r.source==="QuickNote").slice(0,3));
    } catch { setPriorVisits([]); }
    finally { setPriorVisitsLoading(false); }
  }, [priorVisitsLoading,demo]);

  const generateSignOut = useCallback(async () => {
    if (!mdmResult||signOutBusy) return;
    setSignOutBusy(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt:`SBAR sign-out for oncoming ED provider. Patient: ${[demo?.age,demo?.sex].filter(Boolean).join("yo ")||"Adult"}. CC: ${cc}. Working Dx: ${mdmResult.working_diagnosis||"TBD"} (${mdmResult.mdm_level||""}). Disposition: ${dispResult?.disposition||"Pending"}. 2-4 sentences, plain text, no headers. Return JSON: { "signout_text": "..." }`,
        response_json_schema:{type:"object",required:["signout_text"],properties:{signout_text:{type:"string"}}},
      });
      const text=res?.signout_text?.trim();
      if (text) {
        await base44.entities.ShiftSignOut.create({
          source:"QuickNote",patient_identifier:demo?.mrn||"",
          cc:cc||"",working_diagnosis:mdmResult.working_diagnosis||"",
          mdm_level:mdmResult.mdm_level||"",signout_text:text,
          status:"pending",created_date:new Date().toISOString(),
        }).catch(()=>null);
        setSignOutDone(true); setTimeout(()=>setSignOutDone(false),4000);
      }
    } catch(e) { console.error("Sign-out failed:",e); }
    finally { setSignOutBusy(false); }
  }, [mdmResult,dispResult,cc,demo,signOutBusy]);

  const runMDMAddendum = useCallback(async () => {
    if (!mdmResult||rerunAddendumBusy) return;
    setRerunAddendumBusy(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: buildMDMPrompt(cc,vitals,hpi,ros,exam,vhAnalysis,parsedMeds,parsedAllergies,encounterType)
          + `\n\nADDENDUM: Prev Dx: ${mdmResult.working_diagnosis} (${mdmResult.mdm_level}). Labs: ${labs||"pending"}. Imaging: ${imaging||"pending"}. EKG: ${ekg||"not done"}. Recheck vitals: ${newVitals||"not yet"}. Revise if warranted.`,
        response_json_schema: MDM_SCHEMA,
      });
      setMdmResult(res);
      const ts=new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});
      setMdmHistory(prev=>[...prev,{ts,trigger:"Interval Update",
        working_diagnosis:res.working_diagnosis||"",mdm_level:res.mdm_level||"",mdm_narrative:res.mdm_narrative||""}]);
    } catch(e) { console.error("Addendum failed:",e); }
    finally { setRerunAddendumBusy(false); }
  }, [mdmResult,cc,vitals,hpi,ros,exam,labs,imaging,ekg,newVitals,vhAnalysis,parsedMeds,parsedAllergies,encounterType,rerunAddendumBusy]);

  const smartExpansions = DEFAULT_EXPANSIONS;
  const stripLabels = (text) => pasteReady!=="prose" ? text : text.replace(/^[A-Z][A-Z /&]+:\s*/gm,"").trim();

  const copyNote = useCallback(() => {
    const text=buildFullNote({cc,vitals,hpi:effectiveHpi,ros,exam},mdmResult,{labs,imaging,newVitals},dispResult,{icdSelected,interventions,parsedMeds,parsedAllergies});
    navigator.clipboard.writeText(stripLabels(text)).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2500);});
  }, [cc,vitals,effectiveHpi,ros,exam,mdmResult,labs,imaging,newVitals,dispResult,icdSelected,interventions,parsedMeds,parsedAllergies,pasteReady]);

  const copyClinicalInputs = useCallback(() => {
    const sections=[
      {label:"CHIEF COMPLAINT",text:cc},
      {label:"TRIAGE VITALS",text:vitals},
      {label:hpiMode==="summary"&&hpiSummary?"HISTORY OF PRESENT ILLNESS (AI Summary)":"HISTORY OF PRESENT ILLNESS",text:effectiveHpi},
      {label:"REVIEW OF SYSTEMS",text:ros},
      {label:"PHYSICAL EXAM",text:exam},
    ].filter(s=>s.text?.trim());
    if (!sections.length) return;
    const block = pasteReady==="prose"?sections.map(s=>s.text.trim()).join("\n\n"):sections.map(s=>`${s.label}:\n${s.text.trim()}`).join("\n\n");
    navigator.clipboard.writeText(block).then(()=>{setCopiedInputs(true);setTimeout(()=>setCopiedInputs(false),2500);});
  }, [cc,vitals,effectiveHpi,ros,exam,hpiMode,hpiSummary,pasteReady]);

  const copyPhase1 = useCallback(() => {
    if (!mdmResult) return;
    const prov=window._notryaProvider||{};
    const text=buildPhase1Copy({cc,vitals,hpi:effectiveHpi,ros,exam},mdmResult,
      {parsedMeds,parsedAllergies,hpiSummary,hpiMode,workupRationale,
       providerName:prov.full_name||demo?.full_name||"",sigBlock:prov.sigBlock||"",
       demographics:{...(demo||{}),facility:prov.facility,location:prov.location}},formatMode);
    navigator.clipboard.writeText(stripLabels(text)).then(()=>{setCopiedP1(true);setTimeout(()=>setCopiedP1(false),3000);});
  }, [cc,vitals,effectiveHpi,ros,exam,mdmResult,parsedMeds,parsedAllergies,hpiSummary,hpiMode,workupRationale,demo,formatMode,pasteReady]);

  const copyPhase2 = useCallback(() => {
    if (!dispResult) return;
    const prov=window._notryaProvider||{};
    const consultBlock=consults.length?"\n\nCONSULTS:\n"+consults.map(c=>`  ${c.service}${c.provider?" — Dr."+c.provider:""}${c.time?" at "+c.time:""}: ${c.recommendation}`).join("\n"):"";
    const text=buildPhase2Copy({labs,imaging,ekg,newVitals},dispResult,
      {icdSelected,interventions,providerName:prov.full_name||demo?.full_name||"",sigBlock:prov.sigBlock||"",demographics:{...(demo||{}),facility:prov.facility}},formatMode)+consultBlock;
    navigator.clipboard.writeText(stripLabels(text)).then(()=>{setCopiedP2(true);setTimeout(()=>setCopiedP2(false),3000);});
  }, [labs,imaging,ekg,newVitals,dispResult,icdSelected,interventions,demo,formatMode,consults,pasteReady]);

  const copyMDMOnly = useCallback(() => {
    if (!mdmResult) return;
    navigator.clipboard.writeText(stripLabels(buildMDMBlock(mdmResult,{treatmentPlan,actionPlan}))).then(()=>{setCopiedMDMOnly(true);setTimeout(()=>setCopiedMDMOnly(false),2500);});
  }, [mdmResult,pasteReady,treatmentPlan,actionPlan]);

  const copyDischargeOnly = useCallback(() => {
    const di=dispResult?.discharge_instructions;
    if (!di) return;
    const patName=[demo?.firstName,demo?.lastName].filter(Boolean).join(" ");
    const dateStr=new Date().toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"});
    const lines=["DISCHARGE INSTRUCTIONS"];
    if (patName) lines.push(`Patient: ${patName}`);
    lines.push(`Date: ${dateStr}`,"","WHAT YOU WERE TREATED FOR:");
    lines.push(di.diagnosis_explanation||dispResult?.final_diagnosis||"See your physician.","");
    lines.push("HOW TO CARE FOR YOURSELF AT HOME:");
    const homeCare=[];
    if (di.home_care_instructions?.length) di.home_care_instructions.forEach(i=>homeCare.push(i));
    if (di.medications?.length) di.medications.forEach(m=>homeCare.push(`Take ${typeof m==="string"?m:m.medication||m} as prescribed.`));
    if (di.activity) homeCare.push(di.activity);
    if (di.diet) homeCare.push(di.diet);
    if (homeCare.length) homeCare.forEach(i=>lines.push(`• ${i}`));
    else lines.push("• Follow up with your doctor for specific home care instructions.");
    lines.push("");
    if (di.return_precautions?.length) {
      lines.push("RETURN TO THE EMERGENCY DEPARTMENT OR CALL 911 IF:");
      di.return_precautions.forEach((r,i)=>lines.push(`${i+1}. ${typeof r==="string"?r:r}`));
      lines.push("");
    }
    lines.push("FOLLOW-UP CARE:",di.followup||"Contact your primary care provider within 3-5 days.","");
    lines.push("Our goal in the emergency department is to identify and treat conditions that require immediate care.","","IMPORTANT REMINDER:","These instructions support your care but do not replace medical advice.");
    navigator.clipboard.writeText(lines.join("\n")).then(()=>{setCopiedDischargeOnly(true);setTimeout(()=>setCopiedDischargeOnly(false),2500);});
  }, [dispResult,demo]);
  const copyDischargeInstructions = copyDischargeOnly;

  // ── Slot persistence ───────────────────────────────────────────────────────
  const saveAllSlots = useCallback(async (force=false) => {
    if (slotSavingRef.current&&!force) return;
    slotSavingRef.current=true; setSlotSaving(true);
    const currentSlots=slotsRef.current;
    const currentActive=activeSlotRef.current;
    const currentCacheIds=[...slotCacheIdsRef.current];
    const newSaveTimes=[...slotSaveTimes];
    const allStates=currentSlots.map((slot,i)=>i===currentActive?{...slot,...slotStateRef.current}:slot);
    const newCacheIds=[...currentCacheIds];
    for (let i=0;i<4;i++) {
      const s=allStates[i];
      if (!s.cc&&!s.hpi&&!s.mdmResult&&!s.labs) continue;
      const payload=serializeSlot(s,i);
      try {
        if (newCacheIds[i]) { await base44.entities.ClinicalNote.update(newCacheIds[i],payload); }
        else { const rec=await base44.entities.ClinicalNote.create(payload); if (rec?.id) newCacheIds[i]=rec.id; }
        newSaveTimes[i]=Date.now();
      } catch(e) { console.error(`Slot ${i} save failed:`,e); }
    }
    setSlotCacheIds(newCacheIds); setSlotSaveTimes(newSaveTimes);
    slotSavingRef.current=false; setSlotSaving(false);
  }, [slotSaveTimes]);

  const clearSlotCache = useCallback((idx) => {
    const cacheId=slotCacheIdsRef.current[idx];
    if (cacheId) {
      base44.entities.ClinicalNote.update(cacheId,{status:"superseded"}).catch(()=>null);
      const newIds=[...slotCacheIdsRef.current]; newIds[idx]=null;
      setSlotCacheIds(newIds); slotCacheIdsRef.current=newIds;
    }
    setSlotSaveTimes(prev=>{const n=[...prev];n[idx]=null;return n;});
  }, []);

  const saveNote = useCallback(async () => {
    if (saving||!hasAnyResult) return;
    setSaving(true);
    try {
      const user=await base44.auth.me().catch(()=>null);
      const fullText=buildFullNote({cc,vitals,hpi,ros,exam},mdmResult,{labs,imaging,newVitals},dispResult,{icdSelected,interventions,parsedMeds,parsedAllergies});
      await base44.entities.ClinicalNote.create({
        source:"QuickNote",encounter_date:new Date().toISOString().split("T")[0],
        cc:cc||"",chief_complaint:cc||"",raw_note:fullText,full_note_text:fullText,
        working_diagnosis:mdmResult?.working_diagnosis||dispResult?.final_diagnosis||"",
        mdm_level:mdmResult?.mdm_level||"",mdm_narrative:mdmResult?.mdm_narrative||"",
        mdm:mdmResult?.mdm_narrative||"",disposition:dispResult?.disposition||"",
        provider_name:user?.full_name||user?.email||"",
        patient_identifier:demo?.mrn||"",status:"finalized",flag_reviewed:false,
        result_flags_json:dispResult?.result_flags?.length?JSON.stringify(dispResult.result_flags):"",
        icd_codes_json:icdSelected.length?JSON.stringify(icdSelected):"",
        meds_raw:medsRaw||"",allergies_raw:allergiesRaw||"",
        meds_json:parsedMeds.length?JSON.stringify(parsedMeds):"",
        allergies_json:parsedAllergies.length?JSON.stringify(parsedAllergies):"",
      });
      setSavedNote(true); setTimeout(()=>setSavedNote(false),3000);
      setSlots(prev=>{const next=[...prev];next[activeSlot]={...next[activeSlot],savedNoteId:"saved"};return next;});
      clearSlotCache(activeSlot);
      if (draftId) { base44.entities.ClinicalNote.update(draftId,{status:"superseded"}).catch(()=>null); setDraftId(null); }
    } catch(e) { console.error("Save failed:",e); }
    finally { setSaving(false); }
  }, [saving,hasAnyResult,cc,vitals,hpi,ros,exam,labs,imaging,newVitals,mdmResult,dispResult,demo,icdSelected,interventions,parsedMeds,parsedAllergies,medsRaw,allergiesRaw,draftId,activeSlot,clearSlotCache]);

  const sendToNPI = useCallback(async () => {
    if (sendingNPI) return;
    setSendingNPI(true);
    try {
      const prior=await base44.entities.ClinicalNote.list({sort:"-created_date",limit:5}).catch(()=>[]);
      await Promise.all((prior||[]).filter(r=>r.source==="QN-Handoff"&&r.status==="pending")
        .map(r=>base44.entities.ClinicalNote.update(r.id,{status:"superseded"}).catch(()=>null)));
      await base44.entities.ClinicalNote.create({
        source:"QN-Handoff",status:"pending",encounter_date:new Date().toISOString().split("T")[0],
        cc:cc||"",full_note_text:vitals||"",hpi_raw:hpi||"",ros_raw:ros||"",exam_raw:exam||"",
        labs_raw:labs||"",imaging_raw:imaging||"",working_diagnosis:mdmResult?.working_diagnosis||"",
        mdm_level:mdmResult?.mdm_level||"",mdm_narrative:mdmResult?.mdm_narrative||"",patient_identifier:demo?.mrn||"",
      });
      setSentToNPI(true);
      setTimeout(()=>{window.location.href="/NewPatientInput";},1200);
    } catch(e) { console.error("Send to NPI failed:",e); setSendingNPI(false); }
  }, [sendingNPI,cc,vitals,hpi,ros,exam,labs,imaging,mdmResult,demo]);

  const handleNewEncounter = useCallback(() => {
    const snap={cc,vitals,hpi,ros,exam,labs,imaging,ekg,newVitals,parsedMeds,parsedAllergies,mdmResult,dispResult};
    setUndoData(snap);
    [setCC,setVitals,setHpi,setRos,setExam,setLabs,setImaging,setEkg,setNewVitals].forEach(fn=>fn(""));
    setParsedMeds([]); setParsedAllergies([]);
    setMdmResult(null); setDispResult(null);
    setP1Error(null); setP2Error(null); setP2Open(false);
    setWorkupRationale(null); setConsults([]);
    setQuickDDxDismissed(false); setIsBounceback(false);
    setTreatmentPlan(""); setActionPlan("");
    setPatientResponse(""); setMdmHistory([]); setMdmInitialTs(null);
    setHpiGaps([]); setLabRecs(null); setImagingRecs(null);
    setMedsFromHpi([]); setAllergiesFromHpi([]);
    clearSlotCache(activeSlot);
    setShowUndo(true);
    const t=setTimeout(()=>{setShowUndo(false);setUndoData(null);},6000);
    setUndoTimer(t);
  }, [cc,vitals,hpi,ros,exam,labs,imaging,ekg,newVitals,parsedMeds,parsedAllergies,mdmResult,dispResult,activeSlot,clearSlotCache]);

  const handleUndo = useCallback(() => {
    if (undoData) {
      setCC(undoData.cc||""); setVitals(undoData.vitals||""); setHpi(undoData.hpi||"");
      setRos(undoData.ros||""); setExam(undoData.exam||"");
      setLabs(undoData.labs||""); setImaging(undoData.imaging||"");
      setEkg(undoData.ekg||""); setNewVitals(undoData.newVitals||"");
      setParsedMeds(undoData.parsedMeds||[]); setParsedAllergies(undoData.parsedAllergies||[]);
      setMdmResult(undoData.mdmResult||null); setDispResult(undoData.dispResult||null);
      if (undoData.mdmResult) setP2Open(true);
    }
    clearTimeout(undoTimer); setShowUndo(false); setUndoData(null);
  }, [undoData,undoTimer]);

  const makeKeyDown = useCallback((idx,isLast,onEnterSubmit)=>(e)=>{
    if (e.key==="Tab"&&!e.shiftKey) { e.preventDefault(); if (!isLast) advanceFocus(idx); }
    if ((e.metaKey||e.ctrlKey)&&e.key==="Enter") { e.preventDefault(); if (onEnterSubmit) onEnterSubmit(); }
  }, [advanceFocus]);

  useEffect(()=>{
    const fn=e=>{
      const tag=document.activeElement?.tagName?.toLowerCase();
      const inInput=tag==="textarea"||tag==="input";
      if ((e.ctrlKey||e.metaKey)&&e.key==="Enter") {
        e.preventDefault();
        if (p2Open&&parseInt(document.activeElement?.dataset?.phase||"1")===2) runDisposition(); else runMDM();
        return;
      }
      if (e.altKey&&!e.metaKey) {
        const jumpMap={h:2,r:3,e:4,l:5};
        const idx=jumpMap[e.key.toLowerCase()];
        if (idx!==undefined) { e.preventDefault(); fieldRefs.current[idx]?.current?.focus(); return; }
      }
      if ((e.ctrlKey||e.metaKey)&&!e.shiftKey&&["1","2","3","4"].includes(e.key)) {
        e.preventDefault(); switchToSlot(parseInt(e.key)-1); return;
      }
      if ((e.ctrlKey||e.metaKey)&&e.key==="s") { e.preventDefault(); saveAllSlots(true); return; }
      if (e.shiftKey&&e.key==="?"&&!e.ctrlKey&&!e.metaKey) { e.preventDefault(); setShowKbHelp(h=>!h); return; }
      if (e.shiftKey&&e.key==="1"&&!e.ctrlKey&&!e.metaKey&&mdmResult)  { e.preventDefault(); copyPhase1(); return; }
      if (e.shiftKey&&e.key==="2"&&!e.ctrlKey&&!e.metaKey&&dispResult) { e.preventDefault(); copyPhase2(); return; }
      if (e.shiftKey&&e.key==="3"&&!e.ctrlKey&&!e.metaKey&&mdmResult)  { e.preventDefault(); copyMDMOnly(); return; }
      if (e.shiftKey&&e.key==="4"&&!e.ctrlKey&&!e.metaKey&&dispResult) { e.preventDefault(); copyDischargeOnly(); return; }
      if (inInput) return;
      if ((e.key==="e"||e.key==="E")&&!e.ctrlKey&&!e.metaKey&&mdmResult) { e.preventDefault(); window.dispatchEvent(new CustomEvent("qn-edit-narrative")); return; }
      if ((e.key==="c"||e.key==="C")&&!e.ctrlKey&&!e.metaKey) {
        if (e.shiftKey) { e.preventDefault(); copyClinicalInputs(); return; }
        if (mdmResult||dispResult) { e.preventDefault(); copyNote(); }
      }
      if ((e.key==="p"||e.key==="P")&&!e.ctrlKey&&!e.metaKey) { e.preventDefault(); window.print(); }
    };
    window.addEventListener("keydown",fn);
    return ()=>window.removeEventListener("keydown",fn);
  },[p2Open,mdmResult,dispResult,runMDM,runDisposition,copyNote,copyClinicalInputs,copyPhase1,copyPhase2,copyMDMOnly,copyDischargeOnly,switchToSlot,saveAllSlots]);

  useEffect(()=>{ if (p2Open) setTimeout(()=>{fieldRefs.current[5]?.current?.focus();},80); },[p2Open]);

  useEffect(()=>{
    const saveDraft=async()=>{
      if (!cc.trim()&&!hpi.trim()) return;
      const payload={source:"QuickNote",status:"draft",encounter_date:new Date().toISOString().split("T")[0],
        cc:cc||"",hpi_raw:hpi||"",ros_raw:ros||"",exam_raw:exam||"",labs_raw:labs||"",imaging_raw:imaging||"",
        full_note_text:vitals||"",working_diagnosis:mdmResult?.working_diagnosis||"",
        mdm_level:mdmResult?.mdm_level||"",mdm_narrative:mdmResult?.mdm_narrative||"",
        meds_raw:medsRaw||"",allergies_raw:allergiesRaw||"",
        meds_json:parsedMeds.length?JSON.stringify(parsedMeds):"",
        allergies_json:parsedAllergies.length?JSON.stringify(parsedAllergies):""};
      try {
        if (draftId) await base44.entities.ClinicalNote.update(draftId,payload).catch(()=>null);
        else { const rec=await base44.entities.ClinicalNote.create(payload).catch(()=>null); if (rec?.id) setDraftId(rec.id); }
      } catch {}
    };
    const interval=setInterval(saveDraft,90000);
    return ()=>clearInterval(interval);
  },[cc,hpi,ros,exam,labs,imaging,vitals,mdmResult,draftId,medsRaw,allergiesRaw,parsedMeds,parsedAllergies]);

  // ── Meds/Allergies → draft sync (debounced, fires on parse completion) ─────
  useEffect(()=>{
    if (!draftId) return;
    if (!parsedMeds.length&&!parsedAllergies.length) return;
    const t=setTimeout(()=>{
      base44.entities.ClinicalNote.update(draftId,{
        meds_raw:medsRaw||"",allergies_raw:allergiesRaw||"",
        meds_json:parsedMeds.length?JSON.stringify(parsedMeds):"",
        allergies_json:parsedAllergies.length?JSON.stringify(parsedAllergies):"",
      }).catch(()=>null);
    },1500);
    return ()=>clearTimeout(t);
  },[parsedMeds,parsedAllergies,draftId,medsRaw,allergiesRaw]);

  useEffect(()=>{
    const interval=setInterval(()=>saveAllSlots(),60000);
    return ()=>clearInterval(interval);
  },[saveAllSlots]);

  useEffect(()=>{
    try {
      const params=new URLSearchParams(window.location.search);
      const v=params.get("vitals");
      if (v) { setVitals(decodeURIComponent(v)); setVhImported(true); window.history.replaceState({},"",window.location.pathname); }
    } catch {}
    base44.entities.UserPreferences.list({sort:"-created_date",limit:1}).then(results=>{
      const r=results?.[0];
      if (r) {
        if (r.provider_name&&!demo?.full_name) {
          window._notryaProvider={full_name:[r.provider_name,r.credentials].filter(Boolean).join(", "),
            firstName:r.provider_name,facility:r.facility||"",
            location:r.location||"Emergency Department",sigBlock:r.signature_block||""};
        }
        if (r.format_mode) setFormatMode(r.format_mode);
        if (r.default_encounter_type) setEncounterType(r.default_encounter_type);
        setProviderInfo({name:r.provider_name||"",credentials:r.credentials||"",facility:r.facility||""});
      }
    }).catch(()=>null);
    base44.entities.ClinicalNote.list({sort:"-created_date",limit:10}).then(results=>{
      const all=results||[];
      const vhRec=all.find(r=>r.source==="VH-Analysis"&&r.status==="pending");
      if (vhRec) {
        let flags=[]; try{flags=JSON.parse(vhRec.ros_raw||"[]");}catch{}
        setVhAnalysis({trend_narrative:vhRec.full_note_text||"",vitals_summary:vhRec.hpi_raw||"",clinical_flags:Array.isArray(flags)?flags:[]});
        base44.entities.ClinicalNote.update(vhRec.id,{status:"imported"}).catch(()=>null);
      }
      const nhRec=all.find(r=>r.source==="NH-Resume"&&r.status==="pending");
      if (nhRec) {
        if (nhRec.cc) setCC(nhRec.cc); if (nhRec.hpi_raw) setHpi(nhRec.hpi_raw);
        if (nhRec.ros_raw) setRos(nhRec.ros_raw); if (nhRec.exam_raw) setExam(nhRec.exam_raw);
        if (nhRec.labs_raw) setLabs(nhRec.labs_raw); if (nhRec.imaging_raw) setImaging(nhRec.imaging_raw);
        setNhResumed(true);
        base44.entities.ClinicalNote.update(nhRec.id,{status:"imported"}).catch(()=>null);
      }
      const addRec=all.find(r=>r.source==="NH-Addendum"&&r.status==="pending");
      if (addRec) {
        setAddendumRef({cc:addRec.cc||"",working_diagnosis:addRec.working_diagnosis||"",mdm_level:addRec.mdm_level||"",patient_identifier:addRec.patient_identifier||""});
        setAddendumMode(true); setP2Open(true);
        base44.entities.ClinicalNote.update(addRec.id,{status:"imported"}).catch(()=>null);
      }
    }).catch(()=>null);
    base44.entities.ClinicalNote.list({sort:"-created_date",limit:50}).then(results=>{
      const cacheRecords=(results||[]).filter(r=>r.source==="QN-SlotCache"&&r.status==="active");
      if (!cacheRecords.length) return;
      const slotMap={};const idMap={};
      cacheRecords.forEach(r=>{
        const match=(r.patient_identifier||"").match(/^slot:(\d)$/);
        if (!match) return;
        const idx=parseInt(match[1]);
        if (!slotMap[idx]) { slotMap[idx]=deserializeSlot(r); idMap[idx]=r.id; }
      });
      const restoredCount=Object.keys(slotMap).length;
      if (!restoredCount) return;
      setSlots(prev=>{
        const next=[...prev];
        Object.entries(slotMap).forEach(([idx,slotState])=>{ next[parseInt(idx)]={...EMPTY_SLOT(),...slotState}; });
        return next;
      });
      if (slotMap[0]) {
        const s=slotMap[0];
        if (s.cc) setCC(s.cc); if (s.hpi) setHpi(s.hpi); if (s.ros) setRos(s.ros);
        if (s.exam) setExam(s.exam); if (s.labs) setLabs(s.labs); if (s.imaging) setImaging(s.imaging);
        if (s.vitals) setVitals(s.vitals); if (s.ekg) setEkg(s.ekg); if (s.newVitals) setNewVitals(s.newVitals);
        if (s.medsRaw) setMedsRaw(s.medsRaw); if (s.allergiesRaw) setAllergiesRaw(s.allergiesRaw);
        if (s.parsedMeds?.length) setParsedMeds(s.parsedMeds);
        if (s.parsedAllergies?.length) setParsedAllergies(s.parsedAllergies);
        if (s.mdmResult) { setMdmResult(s.mdmResult); setP2Open(true); }
        if (s.dispResult) setDispResult(s.dispResult);
        if (s.icdSelected?.length) setIcdSelected(s.icdSelected);
        if (s.interventions?.length) setInterventions(s.interventions);
        if (s.hpiSummary) setHpiSummary(s.hpiSummary);
        if (s.hpiMode) setHpiMode(s.hpiMode);
        if (s.encounterType) setEncounterType(s.encounterType);
      }
      const newCacheIds=[null,null,null,null];
      Object.entries(idMap).forEach(([idx,id])=>{ newCacheIds[parseInt(idx)]=id; });
      setSlotCacheIds(newCacheIds); slotCacheIdsRef.current=newCacheIds;
      setSlotsRestoredCount(restoredCount); setSlotsRestored(true);
    }).catch(()=>null);
    base44.entities.ClinicalNote.list({sort:"-created_date",limit:5}).then(results=>{
      const draft=(results||[]).find(r=>r.status==="draft"&&r.source==="QuickNote");
      if (draft) { const age=Date.now()-new Date(draft.created_date||0).getTime(); if (age<8*3600000) setDraftId(draft.id); }
    }).catch(()=>null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  useEffect(()=>{
    slotStateRef.current={cc,vitals,hpi,ros,exam,labs,imaging,ekg,newVitals,
      medsRaw,allergiesRaw,parsedMeds,parsedAllergies,
      mdmResult,dispResult,icdSelected,interventions,
      hpiSummary,hpiMode,encounterType,p2Open,
      patientName:[demo?.firstName,demo?.lastName].filter(Boolean).join(" "),
      patientAge:demo?.age||"",lastActivity:Date.now()};
  });

  const isFatigueRisk = useMemo(()=>{ const h=new Date().getHours(); return h>=17||h<=7; },[]);

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div style={{fontFamily:"'DM Sans',sans-serif",
      background:embedded?"transparent":"var(--qn-bg)",
      minHeight:embedded?"auto":"100vh",color:"var(--qn-txt)"}}>
      <div style={{maxWidth:1100,margin:"0 auto",padding:embedded?"0":"0 16px 40px"}}>

        {!embedded&&(
          <div style={{padding:"18px 0 14px"}} className="no-print">
            <button onClick={()=>window.history.back()}
              style={{marginBottom:10,display:"inline-flex",alignItems:"center",gap:7,
                fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:600,
                background:"rgba(14,37,68,.7)",border:"1px solid rgba(42,79,122,.5)",
                borderRadius:8,padding:"5px 14px",color:"var(--qn-txt3)",cursor:"pointer"}}>
              ← Back
            </button>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
              <div style={{background:"rgba(5,15,30,.9)",border:"1px solid rgba(42,79,122,.6)",
                borderRadius:10,padding:"5px 12px",display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--qn-purple)",letterSpacing:3}}>NOTRYA</span>
                <span style={{color:"var(--qn-txt4)",fontFamily:"'JetBrains Mono',monospace",fontSize:10}}>/</span>
                <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--qn-txt3)",letterSpacing:2}}>QUICKNOTE</span>
              </div>
              <div style={{height:1,flex:1,background:"linear-gradient(90deg,rgba(0,229,192,.5),transparent)"}} />
            </div>
            <h1 className="qn-shim" style={{fontFamily:"'Playfair Display',serif",
              fontSize:"clamp(22px,4vw,38px)",fontWeight:900,letterSpacing:-.5,lineHeight:1.1,margin:"0 0 4px"}}>QuickNote</h1>
            <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"var(--qn-txt4)",margin:0}}>
              Paste · ⌘↵ MDM · ⌘↵ Disposition · Shift+1/2/3/4 copy · Ctrl+S save slots
            </p>
          </div>
        )}

        {embedded&&(
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}} className="no-print">
            <span style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:15,color:"var(--qn-teal)"}}>QuickNote</span>
            <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:"var(--qn-txt4)",
              letterSpacing:1.5,textTransform:"uppercase",background:"rgba(0,229,192,.1)",
              border:"1px solid rgba(0,229,192,.25)",borderRadius:4,padding:"2px 7px"}}>
              v11.4 · AI Plan · AI Labs · AI Imaging
            </span>
          </div>
        )}

        <PatientBanner demo={demo} />
        {isFatigueRisk&&!fatigueDismissed&&<FatigueBanner onDismiss={()=>setFatigueDismissed(true)} />}
        <StepProgress phase1Done={Boolean(mdmResult)} phase2Done={Boolean(dispResult)} p2Open={p2Open} />

        <QuickNoteProgressDashboard
          cc={cc} vitals={vitals} hpi={hpi} ros={ros} exam={exam}
          medsRaw={medsRaw} parsedMeds={parsedMeds} parsedAllergies={parsedAllergies} allergiesRaw={allergiesRaw}
          labs={labs} imaging={imaging} mdmResult={mdmResult} dispResult={dispResult}
        />

        {!embedded&&(
          <QuickNotePatientQueue
            slots={slots} activeSlot={activeSlot}
            slotCacheIds={slotCacheIds} slotSaveTimes={slotSaveTimes} slotSaving={slotSaving}
            switchToSlot={switchToSlot} saveAllSlots={saveAllSlots}
            setShowKbHelp={setShowKbHelp}
            slotsRestored={slotsRestored} slotsRestoredCount={slotsRestoredCount} setSlotsRestored={setSlotsRestored}
          />
        )}

        {showUndo&&<UndoToast onUndo={handleUndo} onDismiss={()=>{clearTimeout(undoTimer);setShowUndo(false);setUndoData(null);}} />}
        {nhResumed&&!nhResumeDismissed&&<NhResumeBanner onDismiss={()=>setNhResumeDismissed(true)} />}
        {vhImported&&!vhDismissed&&<VhImportBanner onDismiss={()=>setVhDismissed(true)} />}
        <VhAnalysisCard vhAnalysis={vhAnalysis&&!vhAnalysisDismissed?vhAnalysis:null} onDismiss={()=>setVhAnalysisDismissed(true)} />
        {addendumMode&&<AddendumBanner addendumRef={addendumRef} />}
        <PriorVisitsPanel visits={priorVisits} loading={priorVisitsLoading} onLoad={loadPriorVisits} />
        {(vitals.trim().length>10||labs.trim().length>5)&&<SepsisBanner vitalsText={vitals} labsText={labs} />}

        <Phase1Panel
          cc={cc} setCC={setCC} vitals={vitals} setVitals={setVitals}
          hpi={hpi} setHpi={setHpi} ros={ros} setRos={setRos} exam={exam} setExam={setExam}
          encounterType={encounterType} setEncounterType={setEncounterType}
          hpiMode={hpiMode} setHpiMode={setHpiMode} hpiSummary={hpiSummary} setHpiSummary={setHpiSummary}
          hpiSumBusy={hpiSumBusy} hpiSumError={hpiSumError} copiedHpiSum={copiedHpiSum} setCopiedHpiSum={setCopiedHpiSum}
          summarizeHPI={summarizeHPI}
          structureHPI={structureHPI} hpiStructureBusy={hpiStructureBusy} hpiStructureError={hpiStructureError}
          summarizeFromStructure={summarizeFromStructure} hpiGaps={hpiGaps}
          quickDDx={quickDDx} quickDDxBusy={quickDDxBusy} quickDDxErr={quickDDxErr}
          quickDDxDismissed={quickDDxDismissed} setQuickDDxDismissed={setQuickDDxDismissed} runQuickDDx={runQuickDDx}
          medsRaw={medsRaw} setMedsRaw={setMedsRaw} allergiesRaw={allergiesRaw} setAllergiesRaw={setAllergiesRaw}
          parsedMeds={parsedMeds} parsedAllergies={parsedAllergies}
          setParsedMeds={setParsedMeds} setParsedAllergies={setParsedAllergies}
          medsParsing={medsParsing} medsError={medsError} parseMedsAllergies={parseMedsAllergies}
          p1Busy={p1Busy} p1Error={p1Error} phase1Ready={phase1Ready} mdmResult={mdmResult}
          copiedInputs={copiedInputs} copyClinicalInputs={copyClinicalInputs}
          setRef={setRef} makeKeyDown={makeKeyDown} runMDM={runMDM}
          isBounceback={isBounceback} setIsBounceback={setIsBounceback}
          bouncebackDate={bouncebackDate} setBouncebackDate={setBouncebackDate}
          autoRosFromHpi={autoRosFromHpi} autoRosBusy={autoRosBusy}
          patientPregnant={patientPregnant} setPatientPregnant={setPatientPregnant}
          patientWeight={patientWeight} setPatientWeight={setPatientWeight}
          smartExpansions={smartExpansions}
          medsFromHpi={medsFromHpi}
          allergiesFromHpi={allergiesFromHpi}
        />

        <QuickNoteROSHelper ros={ros} />
        <QuickNoteExamHelper exam={exam} cc={cc} autoExamFromCC={autoExamFromCC} autoExamBusy={autoExamBusy} />

        {/* HPI Scaffold */}
        {cc.trim()&&(
          <QuickNoteHPIScaffold
            scaffold={getScaffold(cc)} hpi={hpi} setHpi={setHpi}
            open={scaffoldOpen} setOpen={setScaffoldOpen}
          />
        )}

        {/* MDM Result */}
        {mdmResult&&(
          <QuickNoteMDMCard
            mdmResult={mdmResult} setMdmResult={setMdmResult}
            isBounceback={isBounceback} mdmInitialTs={mdmInitialTs}
            copiedMDM={copiedMDM} setCopiedMDM={setCopiedMDM}
            copiedMDMFull={copiedMDMFull} setCopiedMDMFull={setCopiedMDMFull}
            workupRationale={workupRationale} setWorkupRationale={setWorkupRationale} workupRationaleBusy={workupRationaleBusy}
            runWorkupRationale={runWorkupRationale}
            copiedWorkup={copiedWorkup} setCopiedWorkup={setCopiedWorkup}
            treatmentPlan={treatmentPlan} setTreatmentPlan={setTreatmentPlan}
            actionPlan={actionPlan} setActionPlan={setActionPlan}
            treatmentPlanBusy={treatmentPlanBusy} generateClinicalPlan={generateClinicalPlan}
            mdmHistory={mdmHistory} showMdmHistory={showMdmHistory} setShowMdmHistory={setShowMdmHistory}
            rerunAddendumBusy={rerunAddendumBusy} runMDMAddendum={runMDMAddendum}
            setDispResult={setDispResult} setP2Open={setP2Open}
            setLabRecs={setLabRecs} setImagingRecs={setImagingRecs}
          />
        )}

        {p2Open&&(
          <Phase2Panel
            labs={labs} setLabs={setLabs} imaging={imaging} setImaging={setImaging}
            ekg={ekg} setEkg={setEkg} newVitals={newVitals} setNewVitals={setNewVitals}
            p2Busy={p2Busy} p1Busy={p1Busy} p2Error={p2Error}
            phase2Ready={phase2Ready} mdmResult={mdmResult} dispResult={dispResult}
            dispColor={dispColor} setRef={setRef} makeKeyDown={makeKeyDown}
            runDisposition={runDisposition} consults={consults} setConsults={setConsults}
            criticalFlags={criticalFlags} ekgBusy={ekgBusy} onEkgInterpret={interpretEKG}
            labRecs={labRecs} labRecsBusy={labRecsBusy} generateLabRecs={generateLabRecs}
            imagingRecs={imagingRecs} imagingRecsBusy={imagingRecsBusy} generateImagingRecs={generateImagingRecs}
          />
        )}

        {p2Open&&(labs||imaging||ekg)&&(
          <QuickNoteAbnormals labs={labs} imaging={imaging} ekg={ekg}
            onAddToMDM={text=>setMdmResult(prev=>({...prev,mdm_narrative:prev?.mdm_narrative?prev.mdm_narrative+"\n\n"+text:text}))} />
        )}

        {p2Open&&!dispResult&&(
          <div style={{marginBottom:10}}>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,fontWeight:700,
              color:"var(--qn-txt4)",letterSpacing:1,textTransform:"uppercase",marginBottom:5}}>
              Patient Response to Treatment
              <span style={{fontWeight:400,letterSpacing:.4,marginLeft:8,textTransform:"none"}}>— documented in MDM &amp; disposition rationale</span>
            </div>
            <textarea value={patientResponse} onChange={e=>setPatientResponse(e.target.value)}
              placeholder="e.g., 2L NS IV, morphine 4mg IV. Pain 8/10 → 3/10 at 60 min. BP normalized…"
              rows={3}
              style={{width:"100%",boxSizing:"border-box",resize:"vertical",
                padding:"9px 12px",borderRadius:8,background:"rgba(14,37,68,.5)",
                border:"1px solid rgba(42,79,122,.4)",color:"var(--qn-txt1)",
                fontFamily:"'DM Sans',sans-serif",fontSize:12,lineHeight:1.55,outline:"none"}}
              onFocus={e=>e.target.style.borderColor="rgba(0,229,192,.5)"}
              onBlur={e=>e.target.style.borderColor="rgba(42,79,122,.4)"} />
          </div>
        )}

        {dispResult&&(
          <QuickNoteDispositionCard
            dispResult={dispResult} setDispResult={setDispResult} mdmResult={mdmResult}
            copiedDisch={copiedDisch} setCopiedDisch={setCopiedDisch}
            copiedDischargeOnly={copiedDischargeOnly}
            copyDischargeOnly={copyDischargeOnly} copyDischargeInstructions={copyDischargeInstructions}
            showSDM={showSDM} setShowSDM={setShowSDM}
            showAttestation={showAttestation} setShowAttestation={setShowAttestation}
            showNursingHandoff={showNursingHandoff} setShowNursingHandoff={setShowNursingHandoff}
            signOutBusy={signOutBusy} signOutDone={signOutDone} generateSignOut={generateSignOut}
            providerInfo={providerInfo} demo={demo}
          />
        )}

        {mdmResult&&(
          <ClinicalCalcsCard cc={cc} workingDx={mdmResult?.working_diagnosis||""} labs={labs} imaging={imaging}
            onAddToMDM={text=>setMdmResult(prev=>({...prev,mdm_narrative:prev?.mdm_narrative?prev.mdm_narrative+"\n\n"+text:text}))} />
        )}

        {dispResult&&(
          <DiagnosisCodingCard
            finalDiagnosis={dispResult.final_diagnosis||mdmResult?.working_diagnosis||""}
            suggestions={icdSuggestions} selected={icdSelected}
            searching={icdSearching} error={icdError}
            onSearch={()=>searchICD10(dispResult.final_diagnosis||mdmResult?.working_diagnosis||cc)}
            onSelect={code=>setIcdSelected(prev=>prev.find(c=>c.code===code.code)?prev:[...prev,code])}
            onRemove={code=>setIcdSelected(prev=>prev.filter(c=>c.code!==code))}
          />
        )}

        {dispResult&&(
          <InterventionsCard items={interventions} loading={intLoading} generated={intGenerated}
            onGenerate={generateInterventions}
            onToggle={id=>setInterventions(prev=>prev.map(i=>i.id===id?{...i,confirmed:!i.confirmed}:i))}
            onUpdate={(id,field,value)=>setInterventions(prev=>prev.map(i=>i.id===id?{...i,[field]:value}:i))}
            onAdd={item=>setInterventions(prev=>[...prev,{...item,id:`int-manual-${Date.now()}`,confirmed:true}])}
            onRemove={id=>setInterventions(prev=>prev.filter(i=>i.id!==id))}
          />
        )}

        {phase1Ready&&<TimelineCard timestamps={timestamps} setTimestamps={setTimestamps} />}

        {hasAnyResult&&(
          <ActionBar
            mdmResult={mdmResult} dispResult={dispResult}
            copiedP1={copiedP1} copiedP2={copiedP2} copied={copied}
            copiedMDMOnly={copiedMDMOnly} copiedDischargeOnly={copiedDischargeOnly}
            savedNote={savedNote} saving={saving} sentToNPI={sentToNPI} sendingNPI={sendingNPI}
            formatMode={formatMode} setFormatMode={setFormatMode}
            pasteReady={pasteReady} setPasteReady={setPasteReady}
            copyPhase1={copyPhase1} copyPhase2={copyPhase2}
            copyMDMOnly={copyMDMOnly} copyDischargeOnly={copyDischargeOnly}
            copyNote={copyNote} saveNote={saveNote} sendToNPI={sendToNPI}
            onNewEncounter={handleNewEncounter}
            onProcedureNote={()=>setShowProcedureModal(true)}
          />
        )}

        {showKbHelp&&<KbHelpModal onClose={()=>setShowKbHelp(false)} />}
        {showProcedureModal&&<ProcedureNoteModal onInsert={()=>{}} onClose={()=>setShowProcedureModal(false)} />}

        {!embedded&&(
          <div style={{textAlign:"center",padding:"24px 0 8px",
            fontFamily:"'JetBrains Mono',monospace",fontSize:8,
            color:"var(--qn-txt4)",letterSpacing:1.5}} className="no-print">
            NOTRYA QUICKNOTE v11.4 · AMA/CMS 2023 E&M · ACEP CLINICAL POLICY ALIGNED ·
            AI OUTPUT REQUIRES PHYSICIAN REVIEW BEFORE CHARTING
          </div>
        )}
      </div>
    </div>
  );
}