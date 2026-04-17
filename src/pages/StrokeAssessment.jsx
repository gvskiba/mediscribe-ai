import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AcuteStrokeTab from "@/components/stroke/AcuteStrokeTab";

// ─── Theme ─────────────────────────────────────────────────────────────────
const T = {
  bg:'#030b18',
  panel:'rgba(8,24,48,0.55)',
  card:'rgba(4,14,32,0.6)',
  up:'rgba(20,55,100,0.3)',
  border:'rgba(255,255,255,0.08)',
  borderHi:'rgba(255,255,255,0.16)',
  blue:'#3b9eff',teal:'#00e5c0',gold:'#f5c842',
  coral:'#ff6b6b',orange:'#ff9f43',purple:'#b06aff',green:'#4ade80',
  txt:'#e8f0fe',txt2:'#8aaccc',txt3:'#4a6a8a',txt4:'#2e4a6a',
};

// ─── Existing NIHSS Data ────────────────────────────────────────────────────
const NIHSS_ITEMS = [
  {id:"1a",num:"1a",label:"Level of Consciousness",short:"LOC",maxScore:3,instructions:"Observe level of alertness. Score 3 only if patient makes no movement in response to stimulation.",options:[{score:0,label:"Alert",description:"Keenly responsive; minor stimulation not required"},{score:1,label:"Not alert",description:"Arousable by minor stimulation — obeys, answers, or responds"},{score:2,label:"Obtunded",description:"Requires repeated stimulation or painful stimuli to attend"},{score:3,label:"Unresponsive",description:"Reflex motor or autonomic effects only, or totally unresponsive"}]},
  {id:"1b",num:"1b",label:"LOC Questions",short:"LOC-Q",maxScore:2,instructions:"Ask: (1) 'What month is it?' (2) 'How old are you?' Score initial answer only.",stimulus:["What month is it?","How old are you?"],options:[{score:0,label:"Both correct",description:"Answers both correctly"},{score:1,label:"One correct",description:"Answers one correctly, OR cannot speak (intubated, dysarthric)"},{score:2,label:"Neither correct",description:"Aphasia or stupor — does not answer either correctly"}]},
  {id:"1c",num:"1c",label:"LOC Commands",short:"LOC-C",maxScore:2,instructions:"Ask to: (1) 'Open and close your eyes' (2) 'Grip and release your hand.' Score actual attempt only.",stimulus:["Open and close your eyes","Grip and release your hand (non-paretic side)"],options:[{score:0,label:"Obeys both",description:"Performs both tasks correctly"},{score:1,label:"Obeys one",description:"Performs one task correctly"},{score:2,label:"Obeys neither",description:"Does not perform either task"}]},
  {id:"2",num:"2",label:"Best Gaze",short:"Gaze",maxScore:2,instructions:"Test horizontal eye movements only. Use voluntary or oculocephalic maneuver.",options:[{score:0,label:"Normal",description:"Normal horizontal gaze"},{score:1,label:"Partial palsy",description:"Gaze abnormal in one or both eyes, but not forced deviation"},{score:2,label:"Forced deviation",description:"Forced deviation or total gaze paresis not overcome by oculocephalic maneuver"}]},
  {id:"3",num:"3",label:"Visual Fields",short:"Visual",maxScore:3,instructions:"Test visual fields using finger counting or visual threat. Score if asymmetric.",options:[{score:0,label:"No loss",description:"No visual loss"},{score:1,label:"Partial hemianopia",description:"Partial hemianopia"},{score:2,label:"Complete hemianopia",description:"Complete hemianopia"},{score:3,label:"Bilateral / blind",description:"Bilateral hemianopia including cortical blindness"}]},
  {id:"4",num:"4",label:"Facial Palsy",short:"Face",maxScore:3,instructions:"Ask to show teeth or raise eyebrows and close eyes. Score symmetry of facial movement.",options:[{score:0,label:"Normal",description:"Normal symmetrical movements"},{score:1,label:"Minor",description:"Minor paralysis — flattened NLF, asymmetry on smiling"},{score:2,label:"Partial",description:"Partial paralysis — near-total paralysis of lower face"},{score:3,label:"Complete",description:"Complete paralysis of one or both sides — no movement upper & lower face"}]},
  {id:"5a",num:"5a",label:"Motor Arm — Left",short:"L-Arm",maxScore:4,allowUntestable:true,instructions:"Extend arm 90° (seated) or 45° (supine). Count 10 seconds.",options:[{score:0,label:"No drift",description:"Arm holds 90°/45° for full 10 seconds"},{score:1,label:"Drift",description:"Arm holds < 10 sec but does not hit bed"},{score:2,label:"Some effort",description:"Some effort against gravity but arm drifts to bed within 10 sec"},{score:3,label:"No effort",description:"No effort against gravity — arm falls immediately"},{score:4,label:"No movement",description:"No movement at all"},{score:"UN",label:"Untestable",description:"Amputation or joint fusion — explain in notes"}]},
  {id:"5b",num:"5b",label:"Motor Arm — Right",short:"R-Arm",maxScore:4,allowUntestable:true,instructions:"Extend arm 90° (seated) or 45° (supine). Count 10 seconds.",options:[{score:0,label:"No drift",description:"Arm holds 90°/45° for full 10 seconds"},{score:1,label:"Drift",description:"Arm holds < 10 sec but does not hit bed"},{score:2,label:"Some effort",description:"Some effort against gravity but arm drifts to bed within 10 sec"},{score:3,label:"No effort",description:"No effort against gravity — arm falls immediately"},{score:4,label:"No movement",description:"No movement at all"},{score:"UN",label:"Untestable",description:"Amputation or joint fusion — explain in notes"}]},
  {id:"6a",num:"6a",label:"Motor Leg — Left",short:"L-Leg",maxScore:4,allowUntestable:true,instructions:"Elevate leg 30° (supine). Count 5 seconds.",options:[{score:0,label:"No drift",description:"Leg holds 30° for full 5 seconds"},{score:1,label:"Drift",description:"Leg falls by end of 5 sec but does not touch bed"},{score:2,label:"Some effort",description:"Leg falls to bed within 5 sec but has some effort against gravity"},{score:3,label:"No effort",description:"No effort against gravity — leg falls immediately to bed"},{score:4,label:"No movement",description:"No movement"},{score:"UN",label:"Untestable",description:"Amputation or joint fusion"}]},
  {id:"6b",num:"6b",label:"Motor Leg — Right",short:"R-Leg",maxScore:4,allowUntestable:true,instructions:"Elevate leg 30° (supine). Count 5 seconds.",options:[{score:0,label:"No drift",description:"Leg holds 30° for full 5 seconds"},{score:1,label:"Drift",description:"Leg falls by end of 5 sec but does not touch bed"},{score:2,label:"Some effort",description:"Leg falls to bed within 5 sec but has some effort against gravity"},{score:3,label:"No effort",description:"No effort against gravity — leg falls immediately to bed"},{score:4,label:"No movement",description:"No movement"},{score:"UN",label:"Untestable",description:"Amputation or joint fusion"}]},
  {id:"7",num:"7",label:"Limb Ataxia",short:"Ataxia",maxScore:2,allowUntestable:true,instructions:"Finger-nose-finger and heel-shin tests. Score only if clearly out of proportion to weakness.",options:[{score:0,label:"Absent",description:"No ataxia"},{score:1,label:"One limb",description:"Ataxia present in one limb"},{score:2,label:"Two limbs",description:"Ataxia present in two limbs"},{score:"UN",label:"Untestable",description:"Paralyzed or amputated"}]},
  {id:"8",num:"8",label:"Sensory",short:"Sensory",maxScore:2,instructions:"Test pinprick on face, arm, trunk, and leg. Test both sides. Score only stroke-related loss.",options:[{score:0,label:"Normal",description:"No sensory loss"},{score:1,label:"Mild–moderate loss",description:"Patient feels pinprick less sharp; aware of being touched"},{score:2,label:"Severe–total loss",description:"Patient is not aware of being touched in face, arm, and leg"}]},
  {id:"9",num:"9",label:"Best Language",short:"Language",maxScore:3,instructions:"Show Cookie Theft picture. Ask patient to describe. Then show reading sentences.",options:[{score:0,label:"No aphasia",description:"Normal; no aphasia"},{score:1,label:"Mild–moderate",description:"Some obvious loss of fluency without significant limitation on ideas expressed"},{score:2,label:"Severe aphasia",description:"All communication through fragmentary expression; great need for inference"},{score:3,label:"Mute / Global",description:"No usable speech or auditory comprehension"}]},
  {id:"10",num:"10",label:"Dysarthria",short:"Speech",maxScore:2,allowUntestable:true,instructions:"Read the word list to patient. Score based on clarity of articulation.",wordList:["MAMA","TIP-TOP","FIFTY-FIFTY","THANKS","HUCKLEBERRY","BASEBALL PLAYER","CATERPILLAR"],options:[{score:0,label:"Normal",description:"Normal articulation"},{score:1,label:"Mild–moderate",description:"Slurred but can be understood with some difficulty"},{score:2,label:"Severe / mute",description:"Speech so slurred it is unintelligible — or patient is mute/anarthric"},{score:"UN",label:"Untestable",description:"Intubated or other physical barrier"}]},
  {id:"11",num:"11",label:"Extinction / Inattention",short:"Neglect",maxScore:2,instructions:"Simultaneously touch both hands. Show fingers in both visual fields.",options:[{score:0,label:"No abnormality",description:"No abnormality"},{score:1,label:"Inattention",description:"Visual, tactile, auditory, or spatial inattention in one sensory modality"},{score:2,label:"Profound hemi-neglect",description:"Profound hemi-inattention > 1 modality; does not recognize own hand"}]},
];

const SEVERITY_BANDS = [
  {min:0,max:0,label:"No Stroke",color:"#00e5c0",bg:"rgba(0,229,192,0.1)"},
  {min:1,max:4,label:"Minor Stroke",color:"#44d7a8",bg:"rgba(68,215,168,0.1)"},
  {min:5,max:15,label:"Moderate Stroke",color:"#f5c842",bg:"rgba(245,200,66,0.1)"},
  {min:16,max:20,label:"Moderate-Severe",color:"#ff9f43",bg:"rgba(255,159,67,0.1)"},
  {min:21,max:42,label:"Severe Stroke",color:"#ff6b6b",bg:"rgba(255,107,107,0.1)"},
];

const READING_SENTENCES = ["You know how.","Down to earth.","I got home from work.","Near the table in the dining room.","They heard him speak on the radio last night."];

const WORKUP_STEPS = [
  {phase:"0–10 min",color:"#ff6b6b",icon:"🚨",title:"Immediate Stabilization",isImaging:false,items:["ABCs — airway, O2 ≥94%","IV access × 2, cardiac monitor, pulse oximetry","Fingerstick glucose","12-lead ECG","Vital signs, weight","Activate stroke alert","Notify neurology on call"]},
  {phase:"0–25 min",color:"#ff9f43",icon:"🧪",title:"Laboratory Studies",isImaging:false,items:["CBC with differential","BMP/CMP","PT/INR, aPTT","Type & Screen","Troponin, BNP","Lipid panel","Urine pregnancy test (if applicable)","HbA1c"]},
  {phase:"0–25 min",color:"#3b9eff",icon:"🧠",title:"Neuroimaging — Tier 1",isImaging:true,items:["CT Head without contrast — STAT","CTA head & neck (if LVO suspected, NIHSS ≥6)","CT Perfusion (if >3–4.5h or wake-up stroke)","Door-to-CT ≤25 min (AHA Class I)","CT interpretation ≤45 min"]},
  {phase:"25–60 min",color:"#00e5c0",icon:"📋",title:"Clinical Assessment",isImaging:false,items:["Complete NIHSS (document time)","PMH: HTN, DM, AF, prior stroke/TIA","Medication reconciliation","Last known well time (LKW)","Blood pressure both arms","Neurological exam documentation"]},
  {phase:"60–120 min",color:"#b06aff",icon:"🔬",title:"Advanced Imaging — Tier 2",isImaging:true,items:["MRI Brain with DWI/ADC — gold standard","MRI/MRA head & neck","Door-to-needle ≤60 min for tPA","Echocardiogram (TTE/TEE)","Carotid ultrasound (anterior circulation)","EEG if seizure suspected"]},
  {phase:"Inpatient",color:"#8aaccc",icon:"🏥",title:"Monitoring & Ongoing Workup",isImaging:false,items:["Continuous cardiac telemetry ≥24h","Serial NIHSS q4–8h","Swallowing assessment before PO","Repeat CT/MRI at 24–48h","Hypercoagulable panel (young/cryptogenic)","Early PT/OT/SLP consultation"]},
];

const TPA_INCLUSIONS = ["Ischemic stroke causing measurable neurological deficit","Age ≥18 years","Onset within 3 hours (up to 4.5h in select patients)","No contraindications present"];
const TPA_EXCLUSIONS = ["Head CT showing intracranial hemorrhage","Active internal bleeding (excluding menses)","Recent intracranial/spinal surgery or serious head trauma (<3 months)","Intracranial neoplasm, AVM, or aneurysm (symptomatic)","Bleeding diathesis: platelet count <100,000/mm³","Heparin use within 48h with elevated aPTT","Current anticoagulant use with INR >1.7 or PT >15s","Blood glucose <50 mg/dL or >400 mg/dL","Significant hypertension: SBP >185 or DBP >110 mmHg after treatment attempt","Active infective endocarditis","Aortic arch dissection"];
const TPA_RELATIVE = ["Age >80 years","NIHSS score >25","History of both stroke AND diabetes mellitus","Oral anticoagulant use (any dose)","Imaging evidence of ischemic injury >1/3 MCA territory"];

const BP_TABLE = [
  {scenario:"Eligible for IV alteplase — before infusion",target:"SBP <185, DBP <110",agent:"Labetalol 10–20 mg IV; Nicardipine 5 mg/h IV"},
  {scenario:"During and 24h after IV alteplase",target:"SBP <180, DBP <105",agent:"Labetalol 10 mg IV q10 min; Nicardipine 5–15 mg/h"},
  {scenario:"Not receiving thrombolytics — permissive HTN",target:"Allow ≤220/120",agent:"Treat only if >220/120 or cardiac/renal emergency"},
  {scenario:"Hemorrhagic conversion or ICH",target:"SBP 130–150",agent:"Nicardipine drip preferred; avoid vasodilators"},
  {scenario:"Hypotension (SBP <90)",target:"Correct immediately",agent:"Isotonic saline bolus; vasopressors if refractory"},
];

const SECONDARY_PREVENTION = [
  {type:"Non-cardioembolic (atherothrombotic/lacunar)",text:"Aspirin 81–325 mg/day OR Clopidogrel 75 mg/day. DAPT × 21 days if NIHSS ≤3 (POINT/CHANCE). High-intensity statin (Atorvastatin 40–80 mg)."},
  {type:"Cardioembolic (AF, valvular)",text:"DOAC preferred (Apixaban 5 mg BID, Rivaroxaban 20 mg qDay, Dabigatran 150 mg BID). Start within 14 days. Warfarin (INR 2–3) for valvular disease."},
  {type:"Large artery atherosclerosis / carotid stenosis",text:"Antiplatelet + statin. CEA if ipsilateral stenosis 70–99% within 2 weeks."},
  {type:"Cryptogenic / PFO",text:"PFO closure if age <60 with high-risk features (CLOSE/REDUCE). Antiplatelet first-line."},
  {type:"BP management long-term",text:"Target <130/80 mmHg. Start antihypertensives 24–48h post-stroke. ACEi/ARB preferred (PROGRESS trial)."},
];

const STANDARD_ORDERS = ["Aspirin load 325 mg PO/PR (if no hemorrhage, no tPA)","Heparin drip (if cardioembolic — per neuro guidance)","Statin therapy initiated (Atorvastatin 40–80 mg)","Strict NPO — dysphagia screen before any PO","Head of bed at 0–30° for first 24h","Continuous telemetry ≥24h","Blood glucose target 140–180 mg/dL; avoid hypoglycemia","Foley catheter PRN — do not restrict fluids","DVT prophylaxis (mechanical — compression stockings)","PT/OT/SLP consult — early mobilization","Repeat NIHSS in 24h and at discharge"];

const NEURO_RECS = ["Proceed with IV tPA per protocol","Do NOT give tPA — exclusion criteria present","Activate interventional / IR for mechanical thrombectomy","Admit to Stroke / Neuro ICU","Admit to Step-down with continuous monitoring","MRI brain with DWI — STAT","CTA head and neck — STAT","Heparin protocol — cardioembolic etiology","Aspirin + Clopidogrel DAPT × 21 days","Hold antihypertensives — permissive hypertension","Strict blood pressure control SBP <180","Speech-language pathology evaluation — dysphagia screen","Neurology to follow twice daily","Hypercoagulable workup ordered","Cardiology / Echo consult ordered"];

const CONSULT_TIMES = [
  {label:"Time Consult Placed",color:"#f5c842",type:"time"},
  {label:"Time Neuro Arrived",color:"#00e5c0",type:"time"},
  {label:"Time tPA Decision",color:"#ff9f43",type:"time"},
  {label:"Time tPA Administered",color:"#ff6b6b",type:"time"},
  {label:"CT Time (minutes)",color:"#3b9eff",type:"number"},
  {label:"Door-to-Needle (min)",color:"#b06aff",type:"number"},
];

const DISPOSITION_OPTIONS = ["Stroke Unit ICU","Neuro Step-Down","General Floor","Transfer to Stroke Center","Discharge (TIA protocol)"];
const PED_WORKUP = ["Hemoglobin electrophoresis (sickle cell)","Echocardiogram (cardiac source) — higher yield than adults","Hypercoagulable panel (mandatory in pediatrics)","MRA > CTA (avoid radiation when possible)","Conventional angiography if vasculitis/arteriopathy suspected","Genetic/metabolic workup (MELAS, Fabry, homocysteine)","Inflammatory markers (ESR, CRP, ANA, ANCA)","Lumbar puncture if CNS infection suspected"];
const PED_ETIOLOGIES = ["🫀 Congenital heart disease / CHD repair (most common)","🩸 Sickle cell disease (10–25% lifetime stroke risk)","🧬 Prothrombotic conditions (Factor V Leiden, Protein C/S deficiency)","🦠 Meningitis / encephalitis (infection-related)","🩺 Arteriopathy: TCA, moyamoya, CSVT","🤕 Arterial dissection (trauma, neck manipulation)","💊 Oral contraceptives (adolescent females)","🧪 Metabolic: MELAS, homocystinuria, Fabry disease","🫁 Paradoxical embolism through PFO/ASD"];
const PED_TREATMENT = [
  {title:"Acute ischemic (SCD)",text:"Exchange transfusion to HbS <30%; IV hydration; O2; avoid hypotension"},
  {title:"Acute ischemic (non-SCD, ≥2y)",text:"Aspirin 3–5 mg/kg/day (max 100 mg). tPA not routinely recommended <18y; case-by-case with neurology. Mechanical thrombectomy — no RCT data."},
  {title:"CSVT",text:"LMWH or UFH; transition to warfarin/DOAC. Treatment even with hemorrhagic infarct (AHA Class IIa)."},
  {title:"Arterial dissection",text:"Antiplatelet or anticoagulation (6 months); aspirin preferred in children"},
  {title:"Neonatal stroke",text:"Supportive care; antiseizure meds if seizures; anticoagulation if cardiac source or thrombophilia"},
  {title:"Secondary prevention",text:"Aspirin 3–5 mg/kg/day (max 100 mg); address underlying etiology; SCD → chronic transfusion/hydroxyurea"},
];
const SERIAL_SLOTS = ["Arrival / Triage","Post-CT (30 min)","Pre-tPA","1h post-tPA","24h NIHSS","Discharge NIHSS"];

// ─── Acute Stroke Clocks / VAN / Windows / MT ───────────────────────────────
const EXCL_3H_ACUTE = [
  {id:"ich",       label:"Intracranial hemorrhage on CT"},
  {id:"stroke3mo", label:"Stroke or serious head trauma within 3 months"},
  {id:"surgery",   label:"Intracranial/intraspinal surgery within 3 months"},
  {id:"prev_ich",  label:"History of prior intracranial hemorrhage"},
  {id:"bleeding",  label:"Active internal bleeding (excluding menses)"},
  {id:"aorta",     label:"Suspected aortic dissection"},
  {id:"bp",        label:"BP >185/110 mmHg persistently despite treatment"},
  {id:"plt",       label:"Platelet count <100,000 / mm³"},
  {id:"heparin",   label:"Heparin within 48h with elevated aPTT"},
  {id:"anticoag",  label:"Anticoagulants with INR >1.7 or PT >15s"},
  {id:"noac",      label:"Direct thrombin or Xa inhibitors within 48h"},
  {id:"glucose",   label:"Blood glucose <50 mg/dL"},
  {id:"multilobar",label:"CT: multilobar infarction (>1/3 MCA territory)"},
];
const EXCL_4H_ACUTE = [
  {id:"nihss25",   label:"NIHSS score >25"},
  {id:"age80",     label:"Age >80 years"},
  {id:"dm_stroke", label:"History of BOTH prior stroke AND diabetes mellitus"},
  {id:"oral_ac",   label:"Current oral anticoagulants (regardless of INR)"},
];
const ASPECTS_ACUTE = [
  {id:"C",  label:"C",  desc:"Caudate"},
  {id:"P",  label:"P",  desc:"Putamen"},
  {id:"IC", label:"IC", desc:"Internal Capsule"},
  {id:"I",  label:"I",  desc:"Insula"},
  {id:"M1", label:"M1", desc:"Ant MCA cortex"},
  {id:"M2", label:"M2", desc:"MCA lat to insula"},
  {id:"M3", label:"M3", desc:"Post MCA cortex"},
  {id:"M4", label:"M4", desc:"Ant MCA sup"},
  {id:"M5", label:"M5", desc:"Lat MCA sup"},
  {id:"M6", label:"M6", desc:"Post MCA sup"},
];

function fmtElapsed(ms) {
  if (!ms || ms < 0) return null;
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2,"0")}m`;
  return `${m}m ${String(ss).padStart(2,"0")}s`;
}
function clockCol(elapsed, targetMs) {
  if (!elapsed || !targetMs) return T.txt4;
  const p = elapsed / targetMs;
  if (p >= 1)    return T.coral;
  if (p >= 0.75) return T.gold;
  return T.teal;
}

// ─── TIA Data ───────────────────────────────────────────────────────────────
const ABCD2_ITEMS = [
  {id:'age',label:'Age',options:[{score:0,label:'< 60 years'},{score:1,label:'≥ 60 years'}]},
  {id:'bp',label:'Blood Pressure at Presentation',options:[{score:0,label:'Normal (SBP <140 and DBP <90)'},{score:1,label:'Elevated (SBP ≥140 or DBP ≥90)'}]},
  {id:'clinical',label:'Clinical Features',options:[{score:0,label:'Other symptoms (no weakness or speech Δ)'},{score:1,label:'Speech disturbance without weakness'},{score:2,label:'Unilateral weakness (highest risk)'}]},
  {id:'duration',label:'Duration of Symptoms',options:[{score:0,label:'< 10 minutes'},{score:1,label:'10 – 59 minutes'},{score:2,label:'≥ 60 minutes'}]},
  {id:'diabetes',label:'Diabetes History',options:[{score:0,label:'No diabetes'},{score:1,label:'Diabetes present'}]},
];

const TIA_WORKUP_LIST = [
  "CT Head without contrast — rule out hemorrhage / early infarct","MRI Brain with DWI — gold standard for acute ischemia detection",
  "MRA or CTA head and neck","12-lead ECG — rule out AF/flutter, prolonged QT",
  "Continuous cardiac monitoring ≥ 24h (telemetry preferred)","CBC, BMP, fasting lipids, HbA1c",
  "PT/INR, aPTT","Echocardiogram (TTE ± TEE if cardioembolic workup needed)",
  "Carotid duplex ultrasound (anterior circulation TIA)","Hypercoagulable panel (if cryptogenic, age < 55)",
];

const TIA_TREATMENT_LIST = [
  {title:"Antiplatelet Therapy (Non-cardioembolic)",text:"Aspirin 325 mg loading dose → 81 mg/day. DAPT (Aspirin + Clopidogrel) for 21 days if high-risk TIA (ABCD2 ≥4, NIHSS ≤3, onset <24h) — POINT/CHANCE trials. Avoid DAPT if high hemorrhage risk."},
  {title:"Anticoagulation (AF / Cardioembolic detected)",text:"DOAC preferred: Apixaban 5 mg BID, Rivaroxaban 20 mg/day, Dabigatran 150 mg BID. Start within 14 days of TIA. Warfarin (INR 2–3) for valvular AF or prosthetic valves."},
  {title:"Statin Therapy",text:"High-intensity statin regardless of baseline LDL. Atorvastatin 40–80 mg. Target LDL <70 mg/dL. SPARCL trial evidence supports statin use in TIA/stroke."},
  {title:"Blood Pressure Control",text:"Target <130/80 mmHg long-term. Do not aggressively lower in first 24–48h. Preferred agents: ACE inhibitor + thiazide diuretic (PROGRESS trial)."},
  {title:"Carotid Revascularization",text:"CEA if ipsilateral symptomatic stenosis 70–99% — within 2 weeks (Class I). CAS alternative if surgical risk high. Stenosis 50–69% — case-by-case decision."},
  {title:"Glucose Management",text:"Target glucose 140–180 mg/dL acutely. Initiate diabetes management (HbA1c goal <7%). Avoid hypoglycemia (associated with worse outcomes)."},
];

const TIA_FOLLOWUP_LIST = [
  "Neurology clinic within 24–48h (high-risk TIA: ABCD2 ≥4)",
  "Repeat MRI at 24–72h if initial DWI negative",
  "Loop recorder / extended cardiac monitoring if AF not found on telemetry",
  "Carotid endarterectomy (CEA) — refer urgently if stenosis ≥70%",
  "Driving restrictions: varies by state (typically 1–4 weeks, consult neurology)",
  "Patient education: FAST symptoms, 911 activation, medication adherence",
  "Risk factor modification: HTN, DM, dyslipidemia, smoking cessation, weight loss",
  "Follow-up labs: fasting lipids, HbA1c, INR (if warfarin)",
  "Avoid anticoagulant bridging unless high thrombotic risk",
];

// ─── Seizure Data ───────────────────────────────────────────────────────────
const SEIZURE_CLASSIFICATION = [
  {type:"Focal Onset",color:"#3b9eff",subtypes:["Focal aware (simple partial)","Focal impaired awareness (complex partial)","Focal to bilateral tonic-clonic"],notes:"Starts in one hemisphere. Aura common. Postictal confusion usual."},
  {type:"Generalized Onset",color:"#b06aff",subtypes:["Tonic-clonic (grand mal)","Absence (petit mal)","Myoclonic","Atonic (drop attacks)","Tonic","Clonic"],notes:"Both hemispheres from onset. No aura. Loss of consciousness typical."},
  {type:"Unknown Onset",color:"#8aaccc",subtypes:["Tonic-clonic","Epileptic spasms"],notes:"Onset not observed or unclear. Classify after further workup."},
  {type:"Status Epilepticus",color:"#ff6b6b",subtypes:["Convulsive (GCSE) — >5 min","Non-convulsive (NCSE) — AMS + EEG patterns","Refractory SE — failure of 2 AEDs","Super-refractory SE — failure of anesthetic agents"],notes:"MEDICAL EMERGENCY. GCSE >30 min = permanent neuronal injury risk."},
];

const SEIZURE_WORKUP_LIST = [
  "Fingerstick glucose — STAT (rule out hypoglycemia first)","ABCs — airway positioning, supplemental O2","Vital signs including temperature","Serum glucose, BMP, CMP","Serum sodium, calcium, magnesium",
  "CBC with differential","Antiepileptic drug (AED) levels (if patient on AEDs)","Toxicology screen — urine and serum",
  "Pregnancy test (women of childbearing age)","CT Head without contrast — STAT (first seizure, trauma, focal, or immunocompromised)",
  "MRI Brain with and without contrast — preferred for new seizure workup","Lumbar puncture (if fever, meningismus, immunocompromised, or altered)",
  "EEG — as soon as possible; continuous EEG if AMS persists after seizure","ECG — rule out arrhythmia, long QT (seizure mimicker)",
];

const STATUS_PROTOCOL = [
  {time:"0–5 min",color:"#3b9eff",title:"First-line: Benzodiazepines",items:["Lorazepam (Ativan) 0.1 mg/kg IV (max 4 mg) — PREFERRED","Diazepam 0.15 mg/kg IV (max 10 mg) — alternative","Midazolam 10 mg IM — if no IV access (INTRAMUSCULAR)","May repeat benzodiazepine ONCE after 5 min if seizure continues"]},
  {time:"5–20 min",color:"#f5c842",title:"Second-line: Anti-epileptic Drugs",items:["Levetiracetam (Keppra) 60 mg/kg IV (max 4,500 mg) — increasingly preferred","Fosphenytoin 20 PE/kg IV (max rate 150 PE/min) — monitor ECG/BP","Valproate 40 mg/kg IV (max 3,000 mg) — avoid in hepatic disease/pregnancy","All three have Class IIa evidence — choose based on clinical context"]},
  {time:"20–40 min",color:"#ff9f43",title:"Third-line: Repeat or Additional AED",items:["Repeat second-line agent (different drug class from initial)","Lacosamide 400 mg IV load — option if prior agents failed","Phenobarbital 20 mg/kg IV (max rate 60 mg/min) — classic alternative","Anesthesia consultation — prepare for intubation / ICU transfer"]},
  {time:">40 min",color:"#ff6b6b",title:"Refractory Status — ICU Required",items:["Propofol: 1–2 mg/kg IV bolus → 20–200 mcg/kg/min infusion (PREFERRED)","Midazolam drip: 0.2 mg/kg load → 0.1–2 mg/kg/h infusion","Pentobarbital: 5–15 mg/kg load → 0.5–5 mg/kg/h (LAST RESORT)","CONTINUOUS EEG monitoring required — goal: burst suppression","Target: seizure freedom or burst suppression pattern on EEG"]},
];

const SEIZURE_FOLLOWUP_LIST = [
  "Neurology follow-up within 1–2 weeks (first unprovoked seizure)",
  "Outpatient EEG if not done inpatient (ambulatory 24–72h preferred)",
  "MRI Brain with/without contrast if not completed in hospital",
  "Driving restriction: state-dependent, typically 3–12 months seizure-free — inform patient and document",
  "Initiate AED if ≥2 unprovoked seizures OR single seizure with high recurrence risk (epileptiform EEG, structural lesion)",
  "Seizure precautions: no swimming alone, no bathing alone, avoid heights, kitchen safety",
  "Women of childbearing age: counsel on AED teratogenicity; avoid valproate if possible",
  "Medication adherence counseling — missed doses are the #1 cause of breakthrough seizures",
  "Sleep hygiene, alcohol avoidance, stress reduction",
];

// ─── AMS Data ───────────────────────────────────────────────────────────────
const AMS_DIFFERENTIAL = [
  {letter:"A",color:"#ff6b6b",label:"Alcohol / Toxins / Drugs",items:["Alcohol intoxication or withdrawal (DTs at 48–72h)","Illicit drugs: opioids, stimulants, hallucinogens","Medication toxicity: benzodiazepines, anticholinergics, opioids","Carbon monoxide poisoning (co-oximetry, not pulse ox)"]},
  {letter:"E",color:"#ff9f43",label:"Epilepsy / Electrolytes",items:["Post-ictal state (Todd's paralysis possible)","Non-convulsive status epilepticus (NCSE) — requires EEG","Hypo/hypernatremia (Na <120 or >160 symptomatic)","Hypocalcemia, hypomagnesemia, hypophosphatemia"]},
  {letter:"I",color:"#f5c842",label:"Insulin / Metabolic",items:["Hypoglycemia — most common reversible cause (STAT glucose)","Diabetic ketoacidosis (DKA)","Hyperosmolar hyperglycemic state (HHS)","Hepatic encephalopathy, uremic encephalopathy"]},
  {letter:"O",color:"#4ade80",label:"Oxygen / Opioids",items:["Hypoxia (respiratory failure, PE, ARDS, CO poisoning)","Hypercarbia — COPD exacerbation, hypoventilation","Opioid overdose — Naloxone responsive (0.4–2 mg IV/IM/IN)","Hypoperfusion / shock — reduced cerebral perfusion"]},
  {letter:"U",color:"#3b9eff",label:"Uremia / Underdosed",items:["Uremic encephalopathy (BUN/Cr elevation)","Addisonian crisis / thyroid storm / myxedema coma","Vitamin deficiencies: B12, thiamine (Wernicke's), folate","Hypothyroidism — check TSH, free T4 in unexplained AMS"]},
  {letter:"T",color:"#00e5c0",label:"Trauma / Temperature",items:["Intracranial hemorrhage, subdural hematoma (may be chronic)","Traumatic brain injury — check for occult trauma","Hyperthermia / heat stroke (core temp >40°C)","Hypothermia — core temp affects consciousness at <32°C"]},
  {letter:"I",color:"#b06aff",label:"Infection / Inflammation",items:["Bacterial meningitis — LP emergently (if no CT contraindication)","HSV encephalitis — acyclovir empirically if suspected","Septic encephalopathy — most common ICU cause of AMS","Autoimmune encephalitis: NMDA-R, LGI1, CASPR2 antibodies"]},
  {letter:"P",color:"#ff6b6b",label:"Psychiatric / Psychosis",items:["Acute psychosis — rule out organic cause first","Serotonin syndrome: tachycardia, clonus, diaphoresis, hyperthermia","Neuroleptic malignant syndrome (NMS): rigidity, fever, high CPK","Catatonia: exam for waxy flexibility, posturing, mutism"]},
  {letter:"S",color:"#f5c842",label:"Structural / Stroke",items:["Ischemic or hemorrhagic stroke — CT Head STAT","Hypertensive encephalopathy (severe HTN + papilledema)","Posterior Reversible Encephalopathy Syndrome (PRES) — MRI","Brain tumor / mass effect — headache, focal findings, herniation"]},
];

const AMS_WORKUP_LIST = [
  "Fingerstick glucose — STAT (first step always)","Vital signs including core temperature and O2 saturation","ABCs — assess and protect airway if GCS ≤8",
  "CT Head without contrast — STAT (rule out hemorrhage, mass, herniation)","BMP / CMP (Na, K, Ca, Mg, glucose, BUN, Cr)","CBC with differential",
  "Ammonia level (hepatic encephalopathy)","Thyroid function: TSH, free T4","LFTs — liver function",
  "Lactate, lactic acid (sepsis/hypoperfusion)","Toxicology screen: urine + serum","Blood cultures × 2 (if fever or sepsis suspected)",
  "Urinalysis + urine culture","Chest X-ray","12-lead ECG",
  "Lumbar puncture (if meningitis/encephalitis suspected — after CT)","EEG (NCSE suspected, unexplained AMS persisting after CT/MRI)","MRI Brain with/without contrast (after CT, no clear etiology)",
  "B12, folate, thiamine levels","Cortisol level (Addison's if hypotension + hyponatremia)","ABG (if respiratory compromise or CO exposure suspected)",
];

const AMS_TREATMENT_LIST = [
  {title:"Thiamine BEFORE Glucose",text:"Thiamine 100 mg IV in ALL malnourished, alcoholic, or elderly patients — BEFORE giving dextrose. Prevents Wernicke's encephalopathy. Then D50W 25 g IV if hypoglycemic (fingerstick <60 mg/dL)."},
  {title:"Naloxone (Opioid Reversal)",text:"Suspect opioids: 0.4–2 mg IV/IM/IN. Repeat every 2–3 min (max 10 mg). Onset: 2–5 min IV. For sustained reversal: infusion at 2/3 of effective dose per hour. Titrate to respiratory adequacy — not full awakening."},
  {title:"Hypoglycemia",text:"D50W 25 g (50 mL of 50% dextrose) IV push. If no IV access: Glucagon 1 mg IM. Recheck glucose in 15 min. Continue D10 infusion to prevent recurrence. Treat underlying cause."},
  {title:"Hypertensive Encephalopathy / PRES",text:"Reduce MAP by no more than 25% in first hour. IV Nicardipine or Labetalol preferred. Over-aggressive reduction risks ischemic stroke. Obtain MRI to confirm PRES (T2/FLAIR white matter changes)."},
  {title:"Empiric HSV Encephalitis",text:"Acyclovir 10 mg/kg IV q8h (renally adjusted) pending HSV-1 PCR from CSF. Do not wait for LP if clinical suspicion high (fever + AMS + temporal lobe signal on MRI). Continue until PCR returns negative."},
  {title:"Serotonin Syndrome",text:"Discontinue ALL serotonergic agents. Cyproheptadine 12 mg PO/NG load → 2 mg q2h PRN. Benzodiazepines for agitation and clonus. ICU admission for severe cases (hyperthermia >41°C, cardiovascular instability)."},
  {title:"Alcohol Withdrawal / Delirium Tremens",text:"Lorazepam 1–4 mg IV/IM q5–15 min titrated to CIWA score. CIWA ≥8: medicate. CIWA ≥15: ICU consideration. Thiamine 500 mg IV TID (Pabrinex) × 3 days. Monitor for seizures and autonomic instability."},
  {title:"Autoimmune Encephalitis (Suspected)",text:"NMDA-R and other antibody panel (serum + CSF). MRI — FLAIR hippocampal changes. Empiric IVIG 2 g/kg over 5 days or methylprednisolone 1 g/day × 5 days if high suspicion. Refer neurology urgently."},
];

const AMS_FOLLOWUP_LIST = [
  "Repeat neurological exam and GCS q2–4h while AMS persists",
  "Serial EEG monitoring if NCSE not definitively excluded",
  "Neurology follow-up if structural, epileptic, or unexplained etiology",
  "Psychiatry consult once organic etiology excluded (psychosis, catatonia)",
  "Social work / addiction medicine if alcohol or substance-related",
  "Formal capacity assessment once mental status clears",
  "Comprehensive medication reconciliation — identify offending agents",
  "Cognitive baseline testing prior to discharge (MoCA or MMSE)",
  "Outpatient neurocognitive follow-up if baseline not recovered at discharge",
];

// ─── Helpers ────────────────────────────────────────────────────────────────
const nowTime = () => { const d=new Date(); return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; };
const scoreColor = (score, maxScore) => { if(score==="UN") return T.txt2; if(score===null||score===undefined) return T.txt3; if(score===0) return T.teal; const r=score/maxScore; if(r<=0.25) return "#44d7a8"; if(r<=0.5) return T.gold; if(r<=0.75) return T.orange; return T.coral; };
const getSeverity = (total) => SEVERITY_BANDS.find(b=>total>=b.min&&total<=b.max)||SEVERITY_BANDS[SEVERITY_BANDS.length-1];
const cardBorder = (score, maxScore) => { if(score===null||score===undefined) return T.border; if(score==="UN") return T.txt3; if(score===0) return T.teal; if(score<=maxScore/2) return T.gold; return T.coral; };
const INPUT_STYLE = {background:'rgba(4,14,32,0.7)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,padding:'7px 11px',color:T.txt,fontFamily:"'JetBrains Mono',monospace",fontSize:12,outline:'none',width:'100%'};

// ─── CSS ────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:wght@600;700&family=JetBrains+Mono:wght@400;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

.sa-bg{
  min-height:100vh;
  background:#030b18;
  background-image:
    radial-gradient(ellipse 80% 60% at 20% 10%, rgba(59,158,255,0.07) 0%, transparent 60%),
    radial-gradient(ellipse 60% 50% at 80% 90%, rgba(176,106,255,0.06) 0%, transparent 55%),
    radial-gradient(ellipse 50% 40% at 60% 40%, rgba(0,229,192,0.04) 0%, transparent 50%);
  position:relative;
}
.sa-bg::before{
  content:'';position:fixed;inset:0;
  background:radial-gradient(ellipse 120% 80% at 50% -20%, rgba(59,158,255,0.04) 0%, transparent 60%);
  pointer-events:none;z-index:0;
}

.sa-wrap{
  color:${T.txt};font-family:'DM Sans',sans-serif;font-size:14px;
  position:relative;z-index:1;
  max-width:1400px;margin:0 auto;padding:24px 20px;padding-top:80px;
}

/* Glass card */
.sa-card{
  background:rgba(8,24,48,0.55);
  border:1px solid rgba(255,255,255,0.07);
  border-radius:16px;padding:20px;margin-bottom:14px;
  backdrop-filter:blur(20px) saturate(160%);
  -webkit-backdrop-filter:blur(20px) saturate(160%);
  box-shadow:0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05);
  transition:border-color .2s;
}
.sa-card:hover{border-color:rgba(255,255,255,0.11)}

/* Glass panel (slightly lighter) */
.sa-panel-glass{
  background:rgba(10,28,56,0.6);
  border:1px solid rgba(255,255,255,0.08);
  border-radius:14px;padding:16px;margin-bottom:12px;
  backdrop-filter:blur(24px) saturate(160%);
  -webkit-backdrop-filter:blur(24px) saturate(160%);
  box-shadow:0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04);
}

/* Tabs */
.sa-tabs{
  display:flex;gap:6px;margin-bottom:24px;padding-bottom:14px;
  border-bottom:1px solid rgba(255,255,255,0.06);
  overflow-x:auto;scrollbar-width:none;
}
.sa-tabs::-webkit-scrollbar{display:none}
.sa-tab{
  padding:9px 18px;border-radius:10px;cursor:pointer;
  border:1px solid rgba(255,255,255,0.07);
  font-size:12px;font-weight:600;transition:all .18s;white-space:nowrap;
  background:rgba(8,24,48,0.4);color:${T.txt2};
  backdrop-filter:blur(12px);letter-spacing:.01em;
}
.sa-tab:hover{
  border-color:rgba(255,255,255,0.15);color:${T.txt};
  background:rgba(20,50,100,0.4);
}
.sa-tab.on{
  background:rgba(59,158,255,0.14);
  border-color:rgba(59,158,255,0.4);
  color:${T.blue};
  box-shadow:0 0 20px rgba(59,158,255,0.12);
}
.sa-tab.on-teal{background:rgba(0,229,192,0.12);border-color:rgba(0,229,192,0.35);color:${T.teal};box-shadow:0 0 20px rgba(0,229,192,0.1);}
.sa-tab.on-purple{background:rgba(176,106,255,0.12);border-color:rgba(176,106,255,0.35);color:${T.purple};box-shadow:0 0 20px rgba(176,106,255,0.1);}
.sa-tab.on-coral{background:rgba(255,107,107,0.12);border-color:rgba(255,107,107,0.35);color:${T.coral};box-shadow:0 0 20px rgba(255,107,107,0.1);}

/* Sub tabs */
.sub-tabs{display:flex;gap:4px;margin-bottom:16px;flex-wrap:wrap}
.sub-tab{
  padding:6px 14px;border-radius:8px;cursor:pointer;font-size:12px;font-weight:600;
  border:1px solid rgba(255,255,255,0.07);background:rgba(8,24,48,0.4);
  color:${T.txt3};transition:all .15s;backdrop-filter:blur(8px);
}
.sub-tab:hover{border-color:rgba(255,255,255,0.14);color:${T.txt2}}
.sub-tab.on{background:rgba(0,229,192,0.1);border-color:rgba(0,229,192,0.3);color:${T.teal}}

/* Item card */
.item-card{
  border-radius:12px;padding:16px;margin-bottom:10px;
  background:rgba(4,14,32,0.6);
  backdrop-filter:blur(16px);
  -webkit-backdrop-filter:blur(16px);
  transition:border-color .2s;
}

/* Inputs */
.sa-input{
  background:rgba(4,14,32,0.7);border:1px solid rgba(255,255,255,0.09);
  border-radius:8px;padding:8px 12px;color:${T.txt};
  font-family:'DM Sans',sans-serif;font-size:13px;outline:none;
  transition:border-color .15s;width:100%;
  backdrop-filter:blur(8px);
}
.sa-input:focus{border-color:rgba(59,158,255,0.5);box-shadow:0 0 0 3px rgba(59,158,255,0.08)}

.sa-textarea{
  background:rgba(4,14,32,0.7);border:1px solid rgba(255,255,255,0.09);
  border-radius:10px;padding:12px;color:${T.txt};font-size:13px;
  resize:vertical;min-height:80px;outline:none;width:100%;
  font-family:'DM Sans',sans-serif;transition:border-color .15s;
  backdrop-filter:blur(8px);
}
.sa-textarea:focus{border-color:rgba(59,158,255,0.5)}

.sa-label{font-size:10px;color:${T.txt4};text-transform:uppercase;letter-spacing:.06em;font-weight:700;margin-bottom:5px}

/* Now button */
.sa-now{
  background:rgba(20,55,100,0.5);border:1px solid rgba(255,255,255,0.1);
  border-radius:6px;padding:3px 9px;font-size:10px;color:${T.txt2};
  cursor:pointer;white-space:nowrap;font-weight:700;font-family:'DM Sans',sans-serif;
  backdrop-filter:blur(8px);transition:all .12s;
}
.sa-now:hover{border-color:rgba(255,255,255,0.2);color:${T.txt}}

/* Checkboxes */
.sa-chk{
  display:flex;align-items:flex-start;gap:8px;padding:8px 10px;border-radius:8px;
  cursor:pointer;transition:all .12s;border:1px solid transparent;
}
.sa-chk:hover{background:rgba(20,55,100,0.35);border-color:rgba(255,255,255,0.08)}
.sa-chk.on{background:rgba(0,229,192,0.07);border-color:rgba(0,229,192,0.2)}
.sa-chk-box{
  width:16px;height:16px;border-radius:4px;border:1.5px solid rgba(255,255,255,0.15);
  flex-shrink:0;margin-top:1px;display:flex;align-items:center;justify-content:center;transition:all .15s;
}
.sa-chk.on .sa-chk-box{background:${T.teal};border-color:${T.teal}}

.sa-chk-exc{
  display:flex;align-items:flex-start;gap:8px;padding:8px 10px;border-radius:8px;
  cursor:pointer;transition:all .12s;border:1px solid transparent;
}
.sa-chk-exc:hover{background:rgba(255,107,107,0.05);border-color:rgba(255,107,107,0.15)}
.sa-chk-exc.on{background:rgba(255,107,107,0.08);border-color:rgba(255,107,107,0.25)}
.sa-chk-exc.on .sa-chk-box{background:${T.coral};border-color:${T.coral}}
.sa-chk-exc.on .sa-chk-label{text-decoration:line-through;color:${T.txt4}}

/* Accordion */
.acc-item{border:1px solid rgba(255,255,255,0.07);border-radius:10px;margin-bottom:6px;overflow:hidden;backdrop-filter:blur(8px)}
.acc-hdr{padding:11px 16px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;font-weight:600;font-size:13px;transition:background .15s;background:rgba(8,24,48,0.4)}
.acc-hdr:hover{background:rgba(20,55,100,0.4)}
.acc-body{padding:12px 16px;font-size:12px;color:${T.txt2};line-height:1.75;border-top:1px solid rgba(255,255,255,0.06);background:rgba(4,14,32,0.5)}

/* Misc */
.sa-sec-title{font-family:'Playfair Display',serif;font-size:15px;font-weight:700;color:${T.txt};margin-bottom:14px}
.sa-prog{height:5px;background:rgba(255,255,255,0.06);border-radius:3px;overflow:hidden}
.sa-prog-fill{height:100%;border-radius:3px;transition:width .35s ease}
.nihss-pill{
  display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:12px;
  font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:700;
  background:rgba(20,55,100,0.4);border:1px solid rgba(255,255,255,0.08);white-space:nowrap;
}
.opt-row{
  display:flex;align-items:flex-start;gap:10px;padding:9px 12px;border-radius:8px;
  cursor:pointer;border:1px solid transparent;transition:all .15s;margin-bottom:4px;
}
.opt-row:hover{background:rgba(20,55,100,0.35);border-color:rgba(255,255,255,0.1)}
.opt-row.sel{border-color:var(--opt-color)!important;background:rgba(var(--opt-rgb),.1)}
.opt-score{font-family:'JetBrains Mono',monospace;font-size:14px;font-weight:700;width:26px;flex-shrink:0;text-align:center}
.opt-lbl{font-weight:600;font-size:13px;color:${T.txt};margin-bottom:1px}
.opt-desc{font-size:11px;color:${T.txt3}}
.stim-box{
  background:rgba(59,158,255,0.07);border:1px solid rgba(59,158,255,0.18);
  border-radius:8px;padding:10px 14px;margin:8px 0;
}
.word-box{
  background:rgba(245,200,66,0.05);border:1px solid rgba(245,200,66,0.18);
  border-radius:8px;padding:10px 12px;margin:8px 0;display:flex;flex-wrap:wrap;gap:8px;
}
.badge{display:inline-block;padding:2px 9px;border-radius:20px;font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:700;letter-spacing:.4px}
.dot-nav{width:10px;height:10px;border-radius:50%;cursor:pointer;transition:all .2s;flex-shrink:0}
.disp-pill{
  padding:8px 16px;border-radius:20px;cursor:pointer;font-size:12px;font-weight:600;
  border:1px solid rgba(255,255,255,0.08);background:rgba(20,55,100,0.3);
  color:${T.txt2};transition:all .15s;white-space:nowrap;backdrop-filter:blur(8px);
}
.disp-pill:hover{border-color:rgba(255,255,255,0.16);color:${T.txt}}
.disp-pill.sel{background:rgba(0,229,192,0.1);border-color:rgba(0,229,192,0.4);color:${T.teal}}

/* Back button */
.back-btn{
  margin-bottom:16px;
  background:rgba(8,24,48,0.6);
  border:1px solid rgba(59,158,255,0.25);
  border-radius:10px;padding:8px 18px;color:${T.txt2};font-size:12px;
  cursor:pointer;font-family:'DM Sans',sans-serif;
  backdrop-filter:blur(16px);
  display:inline-flex;align-items:center;gap:6px;
  transition:all .2s;font-weight:600;
}
.back-btn:hover{border-color:rgba(59,158,255,0.6);color:${T.blue};background:rgba(59,158,255,0.08);box-shadow:0 0 20px rgba(59,158,255,0.12)}

/* Status protocol step */
.se-step{
  border-radius:12px;padding:14px 16px;margin-bottom:10px;
  backdrop-filter:blur(12px);
  border-left:3px solid;
}

/* ABCD2 option */
.abcd-opt{
  display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:8px;
  cursor:pointer;border:1px solid transparent;transition:all .15s;margin-bottom:4px;
}
.abcd-opt:hover{background:rgba(20,55,100,0.35);border-color:rgba(255,255,255,0.1)}
.abcd-opt.sel{background:rgba(0,229,192,0.1);border-color:rgba(0,229,192,0.3)}

/* AMS letter card */
.ams-card{
  border-radius:12px;padding:14px;margin-bottom:8px;
  border:1px solid rgba(255,255,255,0.07);
  background:rgba(4,14,32,0.55);
  backdrop-filter:blur(12px);
  transition:border-color .2s;
}
.ams-card:hover{border-color:rgba(255,255,255,0.12)}

/* Scroll */
.sa-scroll::-webkit-scrollbar{width:4px}
.sa-scroll::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:2px}

@media(max-width:900px){.sa-2col{grid-template-columns:1fr!important}.sa-3col{grid-template-columns:1fr!important}}
@media(max-width:600px){.sa-tab{padding:7px 12px;font-size:11px}}
`;

// ─── Sub-components ─────────────────────────────────────────────────────────
const CookieTheftSVG = () => (
  <img src="https://media.base44.com/images/public/69876015478a19e360c5e3ea/7b4c45838_image.png" alt="Cookie Theft Picture" style={{width:'100%',borderRadius:10,border:'1px solid rgba(255,255,255,0.08)'}}/>
);

const NIHSSCard = React.memo(({ item, score, time, onScore, onTime, nowFn }) => {
  const border = cardBorder(score, item.maxScore);
  const glowColor = score===0?T.teal:score!==null&&score!==undefined?(score<=item.maxScore/2?T.gold:T.coral):null;
  return (
    <div className="item-card" style={{border:`1.5px solid ${border}`,boxShadow:glowColor&&score!==null?`0 0 0 1px ${glowColor}22, 0 4px 16px rgba(0,0,0,0.4)`:'0 4px 16px rgba(0,0,0,0.4)'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.txt3,background:'rgba(20,55,100,0.5)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:5,padding:'2px 7px'}}>{item.num}</span>
          <span style={{fontWeight:700,fontSize:14,color:T.txt}}>{item.label}</span>
        </div>
        {(score!==null&&score!==undefined)&&(
          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:16,fontWeight:800,color:scoreColor(score,item.maxScore),background:`${scoreColor(score,item.maxScore)}1a`,border:`1px solid ${scoreColor(score,item.maxScore)}44`,borderRadius:7,padding:'2px 10px'}}>{score}</span>
        )}
      </div>
      <div style={{fontSize:11,color:T.txt3,fontStyle:'italic',marginBottom:8,lineHeight:1.55}}>{item.instructions}</div>
      {item.stimulus&&(<div className="stim-box">{item.stimulus.map((s,i)=><div key={i} style={{fontSize:12,color:T.blue,marginBottom:2}}><span style={{color:T.txt3,marginRight:6}}>{i+1}.</span>"{s}"</div>)}</div>)}
      {item.wordList&&(<div className="word-box">{item.wordList.map((w,i)=><span key={i} style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:700,color:T.gold,background:'rgba(20,55,100,0.5)',borderRadius:5,padding:'2px 9px'}}>{w}</span>)}</div>)}
      <div style={{marginBottom:8}}>
        {item.options.map(opt=>{
          const isSel=score===opt.score;
          const sc=scoreColor(opt.score,item.maxScore);
          const hexToRgb=(h)=>{const r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16);return `${r},${g},${b}`;};
          return (
            <div key={opt.score} className={`opt-row${isSel?' sel':''}`} style={isSel?{'--opt-color':sc,'--opt-rgb':sc.startsWith('#')?hexToRgb(sc):'59,158,255'}:{}} onClick={()=>onScore(isSel?null:opt.score)}>
              <span className="opt-score" style={{color:isSel?sc:T.txt3}}>{opt.score}</span>
              <div><div className="opt-lbl" style={{color:isSel?sc:T.txt}}>{opt.label}</div><div className="opt-desc">{opt.description}</div></div>
            </div>
          );
        })}
      </div>
      <div style={{display:'flex',alignItems:'center',gap:6,marginTop:4}}>
        <span style={{fontSize:10,color:T.txt4}}>Time:</span>
        <input type="time" value={time||''} onChange={e=>onTime(e.target.value)} style={{...INPUT_STYLE,width:110,fontSize:11,padding:'4px 8px'}}/>
        <button className="sa-now" onClick={()=>onTime(nowFn())}>Now</button>
      </div>
    </div>
  );
});

// ─── Main Component ─────────────────────────────────────────────────────────
export default function StrokeAssessment() {
  const navigate = useNavigate();
  const [patMode,setPatMode] = useState('adult');
  const [activeTab,setActiveTab] = useState('stroke');
  const [strokeSubTab,setStrokeSubTab] = useState('acute');

  // Acute clocks state
  const [tick,        setTick]        = useState(0);
  const [doorTime,    setDoorTime]    = useState(null);
  const [lkwClock,    setLkwClock]    = useState(null);
  const [acuteWeight, setAcuteWeight] = useState("");
  const [acuteExcl3h, setAcuteExcl3h] = useState({});
  const [acuteExcl4h, setAcuteExcl4h] = useState({});
  const [vanScreen,   setVanScreen]   = useState({v:false,a:false,n:false});
  const [acuteAspects,setAcuteAspects] = useState({});

  useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(iv);
  }, []);

  // NIHSS state
  const [scores,setScores] = useState({});
  const [times,setTimes] = useState({});
  const [lkw,setLkw] = useState('');
  const [alertTime,setAlertTime] = useState('');
  const [nihssMode,setNihssMode] = useState('all');
  const [rapidIdx,setRapidIdx] = useState(0);
  const [serialNihss,setSerialNihss] = useState(SERIAL_SLOTS.map(()=>({time:'',score:''})));

  // Workup
  const [workupChecked,setWorkupChecked] = useState({});
  const [workupTimes,setWorkupTimes] = useState({});
  const [pedWorkup,setPedWorkup] = useState({});

  // Treatment
  const [tpaInc,setTpaInc] = useState({});
  const [tpaExc,setTpaExc] = useState({});
  const [sbp,setSbp] = useState('');
  const [dbp,setDbp] = useState('');
  const [ordersChecked,setOrdersChecked] = useState({});
  const [secPrevOpen,setSecPrevOpen] = useState({});

  // Consult
  const [neuRecs,setNeuRecs] = useState({});
  const [neuNote,setNeuNote] = useState('');
  const [consultVals,setConsultVals] = useState({});
  const [disposition,setDisposition] = useState('');
  const [nextSteps,setNextSteps] = useState('');
  const [pending,setPending] = useState('');
  const [neurologist,setNeurologist] = useState('');
  const [attending,setAttending] = useState('');
  const [actType,setActType] = useState('');
  const [followup,setFollowup] = useState({next:'',h24:'',mri:'',clinic:''});

  // Calculators
  const [gcs,setGcs] = useState({eye:null,verbal:null,motor:null});
  const [aspects,setAspects] = useState({});
  const [tpaWeight,setTpaWeight] = useState('');
  const [tpaWeightUnit,setTpaWeightUnit] = useState('kg');

  // TIA state
  const [tiaSubTab,setTiaSubTab] = useState('abcd2');
  const [abcd2,setAbcd2] = useState({});
  const [tiaWorkup,setTiaWorkup] = useState({});
  const [tiaTreatOpen,setTiaTreatOpen] = useState({});
  const [tiaFollowup,setTiaFollowup] = useState({});

  // Seizure state
  const [szSubTab,setSzSubTab] = useState('workup');
  const [szWorkup,setSzWorkup] = useState({});
  const [szFollowup,setSzFollowup] = useState({});

  // AMS state
  const [amsSubTab,setAmsSubTab] = useState('differential');
  const [amsWorkup,setAmsWorkup] = useState({});
  const [amsTreatOpen,setAmsTreatOpen] = useState({});
  const [amsFollowup,setAmsFollowup] = useState({});

  // Computed
  const nihssTotal = useMemo(()=>NIHSS_ITEMS.reduce((sum,item)=>{const s=scores[item.id];return sum+(typeof s==='number'?s:0);},0),[scores]);
  const nihssComplete = useMemo(()=>NIHSS_ITEMS.filter(it=>scores[it.id]!==undefined&&scores[it.id]!==null).length,[scores]);
  const severity = useMemo(()=>getSeverity(nihssTotal),[nihssTotal]);
  const pct = nihssComplete/NIHSS_ITEMS.length*100;

  const abcd2Total = useMemo(()=>Object.values(abcd2).reduce((s,v)=>s+(v||0),0),[abcd2]);
  const abcd2Risk = abcd2Total<=3?{label:'Low Risk',color:T.teal,pct:'~1% 2-day stroke risk'}:abcd2Total<=5?{label:'Moderate Risk',color:T.gold,pct:'~4% 2-day stroke risk'}:{label:'High Risk',color:T.coral,pct:'~8% 2-day stroke risk'};

  const tpaEligible = TPA_INCLUSIONS.every((_,i)=>tpaInc[i]) && !TPA_EXCLUSIONS.some((_,i)=>tpaExc[i]);
  const bpHigh = parseInt(sbp)>185 || parseInt(dbp)>110;
  const totalWorkup = WORKUP_STEPS.reduce((a,s)=>a+s.items.length,0);
  const doneWorkup = Object.values(workupChecked).filter(Boolean).length;

  // Handlers
  const handleScore = useCallback((itemId, score) => {
    setScores(p=>({...p,[itemId]:score}));
    if(score!==null&&!times[itemId]) setTimes(p=>({...p,[itemId]:nowTime()}));
  },[times]);
  const handleTime = useCallback((itemId, val) => setTimes(p=>({...p,[itemId]:val})),[]);

  const autoAdvance = useRef(null);
  const handleRapidScore = useCallback((itemId, score) => {
    handleScore(itemId,score);
    if(score!==null&&rapidIdx<NIHSS_ITEMS.length-1){
      clearTimeout(autoAdvance.current);
      autoAdvance.current=setTimeout(()=>setRapidIdx(i=>Math.min(i+1,NIHSS_ITEMS.length-1)),380);
    }
  },[handleScore,rapidIdx]);

  // Tab configs
  const TABS = [
    {id:'stroke',  label:'🧠 Stroke',      cls:'on'},
    {id:'tia',     label:'⚠️ TIA',          cls:'on-teal'},
    {id:'seizure', label:'⚡ Seizure',       cls:'on-purple'},
    {id:'ams',     label:'🌀 AMS',           cls:'on-coral'},
    {id:'calc',    label:'🧮 Calculators',   cls:'on'},
    {id:'consult', label:'📋 Consult',       cls:'on'},
  ];

  return (
    <div className="sa-bg">
      <style>{CSS}</style>
      <div className="sa-wrap">

        {/* ── PAGE HEADER ── */}
        <div style={{marginBottom:24}}>
          <button className="back-btn" onClick={()=>navigate('/hub')}>
            <span style={{fontSize:14}}>←</span> Back to Hub
          </button>
          <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:14,flexWrap:'wrap'}}>
            <div style={{width:52,height:52,borderRadius:14,background:'linear-gradient(135deg,rgba(59,158,255,0.8),rgba(176,106,255,0.8))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,flexShrink:0,boxShadow:'0 4px 20px rgba(59,158,255,0.3)',border:'1px solid rgba(255,255,255,0.15)'}}>🧠</div>
            <div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:700,color:T.txt,letterSpacing:'-.01em'}}>Neurological Emergency Suite</div>
              <div style={{fontSize:11,color:T.txt3,marginTop:3}}>NIHSS · TIA · Seizure · AMS · AHA/ASA 2019–2023 Guidelines · <span style={{color:T.teal,fontWeight:600}}>{patMode==='adult'?'Adult Mode':'Pediatric Mode'}</span></div>
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
            {[['adult','👤 Adult',T.blue],['ped','🧒 Pediatric',T.purple]].map(([mode,lbl,col])=>(
              <button key={mode} onClick={()=>setPatMode(mode)} style={{padding:'7px 16px',borderRadius:10,border:`1px solid ${patMode===mode?col+'66':T.border}`,background:patMode===mode?`${col}18`:'rgba(20,55,100,0.25)',color:patMode===mode?col:T.txt2,fontWeight:700,fontSize:12,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",backdropFilter:'blur(12px)',transition:'all .18s'}}>{lbl}</button>
            ))}
            {[['LKW',lkw,setLkw,T.gold],['Alert',alertTime,setAlertTime,T.coral]].map(([lbl,val,setter,col])=>(
              <div key={lbl} style={{display:'flex',alignItems:'center',gap:6,background:'rgba(4,14,32,0.6)',border:'1px solid rgba(255,255,255,0.09)',borderRadius:20,padding:'6px 14px',backdropFilter:'blur(12px)'}}>
                <span style={{fontSize:10,color:T.txt3}}>{lbl}</span>
                <input type="time" value={val} onChange={e=>setter(e.target.value)} style={{background:'transparent',border:'none',outline:'none',color:col,fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:700}}/>
              </div>
            ))}
          </div>
          {patMode==='ped'&&(
            <div style={{marginTop:12,padding:'10px 16px',background:'rgba(176,106,255,0.08)',border:'1px solid rgba(176,106,255,0.25)',borderRadius:10,fontSize:12,color:T.purple,backdropFilter:'blur(12px)'}}>
              ⚠️ <strong>Pediatric Mode:</strong> tPA is NOT FDA-approved for patients &lt;18 years. All treatment decisions require pediatric neurology consultation.
            </div>
          )}
        </div>

        {/* ── TABS ── */}
        <div className="sa-tabs">
          {TABS.map(({id,label,cls})=>(
            <button key={id} className={`sa-tab${activeTab===id?' '+cls:''}`} onClick={()=>setActiveTab(id)}>{label}</button>
          ))}
        </div>

        {/* ════════════ TAB: STROKE ════════════ */}
        {activeTab==='stroke'&&(
          <div>
            {/* Stroke sub-tabs */}
            <div className="sub-tabs" style={{marginBottom:20}}>
              {[['acute','⏱ Acute'],['nihss','⚡ NIHSS Scale'],['workup','🔬 Workup'],['treatment','💊 Treatment']].map(([id,lbl])=>(
                <button key={id} className={`sub-tab${strokeSubTab===id?' on':''}`} onClick={()=>setStrokeSubTab(id)}>{lbl}</button>
              ))}
            </div>

            {/* ── Stroke / Acute ── */}
            {strokeSubTab==='acute'&&(
              <AcuteStrokeTab
                tick={tick}
                doorTime={doorTime}     setDoorTime={setDoorTime}
                lkwClock={lkwClock}     setLkwClock={setLkwClock}
                acuteWeight={acuteWeight} setAcuteWeight={setAcuteWeight}
                acuteExcl3h={acuteExcl3h} setAcuteExcl3h={setAcuteExcl3h}
                acuteExcl4h={acuteExcl4h} setAcuteExcl4h={setAcuteExcl4h}
                vanScreen={vanScreen}   setVanScreen={setVanScreen}
                acuteAspects={acuteAspects} setAcuteAspects={setAcuteAspects}
                nihssTotal={nihssTotal}
                EXCL_3H_ACUTE={EXCL_3H_ACUTE}
                EXCL_4H_ACUTE={EXCL_4H_ACUTE}
                ASPECTS_ACUTE={ASPECTS_ACUTE}
              />
            )}

            {/* ── Stroke / NIHSS ── */}
            {strokeSubTab==='nihss'&&(
              <div>
            {/* Score Bar */}
            <div className="sa-panel-glass" style={{marginBottom:18}}>
              <div style={{display:'flex',alignItems:'center',gap:18,marginBottom:12,flexWrap:'wrap'}}>
                <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:56,fontWeight:800,color:severity.color,lineHeight:1,textShadow:`0 0 30px ${severity.color}55`}}>{nihssTotal}</div>
                <div>
                  <div style={{display:'inline-block',background:severity.bg,border:`1px solid ${severity.color}44`,borderRadius:20,padding:'4px 16px',fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:700,color:severity.color,marginBottom:6}}>{severity.label}</div>
                  <div style={{fontSize:11,color:T.txt3}}>{nihssComplete}/15 items · {Math.round(pct)}% complete</div>
                </div>
              </div>
              <div style={{display:'flex',flexWrap:'wrap',gap:4,marginBottom:10}}>
                {NIHSS_ITEMS.map(item=>{const s=scores[item.id];const c=scoreColor(s,item.maxScore);return(<span key={item.id} className="nihss-pill" style={{borderColor:(s!==null&&s!==undefined)?c:T.border,color:(s!==null&&s!==undefined)?c:T.txt4}}>{item.num} {s!==null&&s!==undefined?s:'—'}</span>);})}
              </div>
              <div className="sa-prog"><div className="sa-prog-fill" style={{width:`${pct}%`,background:severity.color}}/></div>
            </div>

            {/* Mode Toggle */}
            <div style={{display:'flex',gap:6,marginBottom:16}}>
              {[['all','📋 All Items'],['rapid','⚡ Rapid Entry']].map(([id,lbl])=>(
                <button key={id} onClick={()=>setNihssMode(id)} style={{padding:'8px 18px',borderRadius:10,border:`1px solid ${nihssMode===id?T.blue+'66':T.border}`,background:nihssMode===id?'rgba(59,158,255,0.14)':'rgba(20,55,100,0.25)',color:nihssMode===id?T.blue:T.txt2,fontWeight:700,fontSize:12,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",backdropFilter:'blur(12px)',transition:'all .15s'}}>{lbl}</button>
              ))}
            </div>

            {nihssMode==='all'&&(
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}} className="sa-2col">
                {NIHSS_ITEMS.map(item=>(<NIHSSCard key={item.id} item={item} score={scores[item.id]??null} time={times[item.id]||''} onScore={s=>handleScore(item.id,s)} onTime={v=>handleTime(item.id,v)} nowFn={nowTime}/>))}
              </div>
            )}

            {nihssMode==='rapid'&&(
              <div>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12,flexWrap:'wrap'}}>
                  <span style={{fontSize:12,color:T.txt2}}>Item {rapidIdx+1} of {NIHSS_ITEMS.length}</span>
                  <div style={{flex:1,minWidth:200}}><div className="sa-prog"><div className="sa-prog-fill" style={{width:`${(rapidIdx+1)/NIHSS_ITEMS.length*100}%`,background:T.blue}}/></div></div>
                  <div style={{display:'flex',gap:4}}>{NIHSS_ITEMS.map((item,i)=>{const s=scores[item.id];const c=i===rapidIdx?T.blue:(s!==null&&s!==undefined?scoreColor(s,item.maxScore):T.txt4);return<div key={item.id} className="dot-nav" style={{background:c,transform:i===rapidIdx?'scale(1.35)':'scale(1)',border:i===rapidIdx?`2px solid ${T.blue}`:'2px solid transparent'}} onClick={()=>setRapidIdx(i)} title={item.label}/>;})}
                  </div>
                </div>
                <NIHSSCard item={NIHSS_ITEMS[rapidIdx]} score={scores[NIHSS_ITEMS[rapidIdx].id]??null} time={times[NIHSS_ITEMS[rapidIdx].id]||''} onScore={s=>handleRapidScore(NIHSS_ITEMS[rapidIdx].id,s)} onTime={v=>handleTime(NIHSS_ITEMS[rapidIdx].id,v)} nowFn={nowTime}/>
                <div style={{display:'flex',gap:8,marginTop:8}}>
                  <button onClick={()=>setRapidIdx(i=>Math.max(0,i-1))} disabled={rapidIdx===0} style={{flex:1,padding:'10px',borderRadius:10,border:'1px solid rgba(255,255,255,0.1)',background:'rgba(20,55,100,0.3)',color:T.txt2,fontWeight:700,cursor:'pointer',fontSize:12,fontFamily:"'DM Sans',sans-serif",opacity:rapidIdx===0?.4:1,backdropFilter:'blur(8px)'}}>← Prev</button>
                  <button onClick={()=>setRapidIdx(i=>Math.min(NIHSS_ITEMS.length-1,i+1))} disabled={rapidIdx===NIHSS_ITEMS.length-1} style={{flex:1,padding:'10px',borderRadius:10,border:'1px solid rgba(255,255,255,0.1)',background:'rgba(20,55,100,0.3)',color:T.txt2,fontWeight:700,cursor:'pointer',fontSize:12,fontFamily:"'DM Sans',sans-serif",opacity:rapidIdx===NIHSS_ITEMS.length-1?.4:1,backdropFilter:'blur(8px)'}}>Next →</button>
                </div>
              </div>
            )}

            {/* Stimulus Materials */}
            <div style={{marginTop:20,display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}} className="sa-2col">
              <div className="sa-card">
                <div className="sa-sec-title">🖼 Cookie Theft Picture (Item 9)</div>
                <CookieTheftSVG/>
                <div style={{marginTop:8,fontStyle:'italic',fontSize:12,color:T.txt3,textAlign:'center'}}>"Tell me everything you see going on in this picture."</div>
              </div>
              <div>
                <div className="sa-card" style={{marginBottom:12}}>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:13,fontWeight:700,color:T.txt,marginBottom:10}}>📝 Reading Sentences (Item 9)</div>
                  <div style={{background:'rgba(245,200,66,0.05)',border:'1px solid rgba(245,200,66,0.15)',borderRadius:10,padding:'12px 16px'}}>
                    {READING_SENTENCES.map((s,i)=><div key={i} style={{fontFamily:"'Playfair Display',serif",fontSize:13,color:T.txt2,padding:'5px 0',borderBottom:i<READING_SENTENCES.length-1?'1px solid rgba(255,255,255,0.06)':''}}>{s}</div>)}
                  </div>
                </div>
                <div className="sa-card">
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:13,fontWeight:700,color:T.txt,marginBottom:10}}>🗣 Dysarthria Words (Item 10)</div>
                  <div style={{background:'rgba(245,200,66,0.05)',border:'1px solid rgba(245,200,66,0.15)',borderRadius:10,padding:'10px 12px',display:'flex',flexWrap:'wrap',gap:8}}>
                    {["MAMA","TIP-TOP","FIFTY-FIFTY","THANKS","HUCKLEBERRY","BASEBALL PLAYER","CATERPILLAR"].map(w=><span key={w} style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:800,color:T.gold,background:'rgba(20,55,100,0.5)',borderRadius:6,padding:'4px 10px'}}>{w}</span>)}
                  </div>
                </div>
              </div>
            </div>

            {/* Serial NIHSS */}
            <div className="sa-card" style={{marginTop:14}}>
              <div className="sa-sec-title">📊 Serial NIHSS Tracking</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}} className="sa-2col">
                {SERIAL_SLOTS.map((slot,i)=>(
                  <div key={i} style={{background:'rgba(20,55,100,0.25)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:10,padding:'10px 12px'}}>
                    <div style={{fontSize:10,color:T.txt3,marginBottom:6,fontWeight:700}}>{slot}</div>
                    <div style={{display:'flex',gap:6}}>
                      <input type="time" value={serialNihss[i].time} onChange={e=>{const n=[...serialNihss];n[i]={...n[i],time:e.target.value};setSerialNihss(n);}} style={{...INPUT_STYLE,flex:1,padding:'5px 7px'}}/>
                      <input type="number" min="0" max="42" placeholder="Score" value={serialNihss[i].score} onChange={e=>{const n=[...serialNihss];n[i]={...n[i],score:e.target.value};setSerialNihss(n);}} style={{...INPUT_STYLE,width:60,padding:'5px 7px'}}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            </div>
            )}

            {/* ── Stroke / Workup ── */}
            {strokeSubTab==='workup'&&(
            <div>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16,padding:'10px 16px',background:'rgba(8,24,48,0.55)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:12,backdropFilter:'blur(20px)'}}>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:T.teal,fontWeight:700}}>✅ {doneWorkup} / {totalWorkup} completed</span>
              <div style={{flex:1}}><div className="sa-prog"><div className="sa-prog-fill" style={{width:`${doneWorkup/totalWorkup*100}%`,background:T.teal}}/></div></div>
            </div>
            {WORKUP_STEPS.map((step,si)=>{
              const isLast=si===WORKUP_STEPS.length-1;
              return (
                <div key={si} style={{position:'relative',marginBottom:12}}>
                  {!isLast&&<div style={{position:'absolute',left:5,top:30,bottom:-12,width:2,background:`linear-gradient(${step.color},${WORKUP_STEPS[si+1].color})`}}/>}
                  <div style={{position:'relative',paddingLeft:26}}>
                    <div style={{position:'absolute',left:0,top:6,width:12,height:12,borderRadius:'50%',background:step.color,boxShadow:`0 0 10px ${step.color}77`}}/>
                    <div className="sa-card" style={{margin:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10,flexWrap:'wrap'}}>
                        <span style={{fontSize:18}}>{step.icon}</span>
                        <span style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,color:T.txt}}>{step.title}</span>
                        <span className="badge" style={{background:`${step.color}1a`,border:`1px solid ${step.color}44`,color:step.color}}>⏱ {step.phase}</span>
                      </div>
                      {step.isImaging&&<div style={{padding:'7px 12px',background:'rgba(59,158,255,0.07)',border:'1px solid rgba(59,158,255,0.18)',borderRadius:8,fontSize:11,color:T.blue,marginBottom:10}}>📸 Imaging Protocol — pre-notify radiology. STAT reads required.</div>}
                      {step.items.map((item,ii)=>{
                        const k=`${si}-${ii}`;const ck=workupChecked[k];
                        return (
                          <div key={ii} className={`sa-chk${ck?' on':''}`} onClick={()=>setWorkupChecked(p=>({...p,[k]:!p[k]}))}>
                            <div className="sa-chk-box">{ck&&<span style={{color:'#030b18',fontSize:10,fontWeight:900}}>✓</span>}</div>
                            <span style={{fontSize:12,color:ck?T.teal:T.txt2,flex:1}}>{item}</span>
                            {ck&&<div style={{display:'flex',alignItems:'center',gap:4,marginLeft:8,flexShrink:0}} onClick={e=>e.stopPropagation()}><input type="time" value={workupTimes[k]||''} onChange={e=>setWorkupTimes(p=>({...p,[k]:e.target.value}))} style={{...INPUT_STYLE,width:100,padding:'3px 6px',fontSize:10}}/><button className="sa-now" style={{padding:'2px 6px',fontSize:9}} onClick={()=>setWorkupTimes(p=>({...p,[k]:nowTime()}))}>Now</button></div>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
            {patMode==='ped'&&(
              <div style={{marginTop:20,background:'rgba(176,106,255,0.07)',border:'1px solid rgba(176,106,255,0.25)',borderRadius:14,padding:18,backdropFilter:'blur(16px)'}}>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,color:T.purple,marginBottom:12}}>🧒 Pediatric Additional Workup</div>
                {PED_WORKUP.map((item,i)=>(<div key={i} className={`sa-chk${pedWorkup[i]?' on':''}`} onClick={()=>setPedWorkup(p=>({...p,[i]:!p[i]}))}>
                  <div className="sa-chk-box">{pedWorkup[i]&&<span style={{color:'#030b18',fontSize:10,fontWeight:900}}>✓</span>}</div>
                  <span style={{fontSize:12,color:pedWorkup[i]?T.teal:T.txt2}}>{item}</span>
                </div>))}
                <div style={{marginTop:16}}>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:13,fontWeight:700,color:T.purple,marginBottom:8}}>Pediatric Etiologies</div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}} className="sa-2col">
                    {PED_ETIOLOGIES.map((e,i)=><div key={i} style={{background:'rgba(176,106,255,0.06)',border:'1px solid rgba(176,106,255,0.15)',borderRadius:8,padding:'7px 12px',fontSize:12,color:T.txt2}}>{e}</div>)}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

            {/* ── Stroke / Treatment ── */}
            {strokeSubTab==='treatment'&&(
          <div>
            {patMode==='ped'?(
              <div>
                <div style={{padding:'10px 16px',background:'rgba(255,107,107,0.08)',border:'1px solid rgba(255,107,107,0.25)',borderRadius:10,marginBottom:16,fontSize:12,color:T.coral}}>⚠️ <strong>tPA is NOT FDA-approved for patients under 18 years.</strong> All treatment decisions require pediatric neurology.</div>
                {PED_TREATMENT.map((item,i)=><div key={i} className="sa-card"><div style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,color:T.purple,marginBottom:6}}>{item.title}</div><div style={{fontSize:13,color:T.txt2,lineHeight:1.7}}>{item.text}</div></div>)}
              </div>
            ):(
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,alignItems:'start'}} className="sa-2col">
                <div>
                  <div className="sa-card">
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12,flexWrap:'wrap',gap:8}}>
                      <div className="sa-sec-title" style={{margin:0}}>💊 IV Alteplase (tPA) Eligibility</div>
                      <span style={{padding:'3px 14px',borderRadius:20,fontSize:10,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",background:tpaEligible?'rgba(0,229,192,0.12)':'rgba(138,172,204,0.08)',border:`1px solid ${tpaEligible?'rgba(0,229,192,0.35)':'rgba(138,172,204,0.2)'}`,color:tpaEligible?T.teal:T.txt3}}>{tpaEligible?'✓ ELIGIBLE':'Review criteria'}</span>
                    </div>
                    {nihssComplete>0&&<div style={{padding:'6px 12px',background:'rgba(20,55,100,0.35)',borderRadius:8,marginBottom:10,display:'flex',alignItems:'center',gap:8}}><span style={{fontSize:11,color:T.txt3}}>Current NIHSS:</span><span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:16,fontWeight:800,color:severity.color}}>{nihssTotal}</span>{nihssTotal>25&&<span style={{fontSize:10,color:T.coral,background:'rgba(255,107,107,0.1)',border:'1px solid rgba(255,107,107,0.25)',borderRadius:5,padding:'1px 7px'}}>⚠ &gt;25 — relative CI</span>}</div>}
                    <div style={{fontSize:11,color:T.txt3,marginBottom:6,textTransform:'uppercase',letterSpacing:'0.06em',fontWeight:700}}>Inclusions (all required)</div>
                    {TPA_INCLUSIONS.map((inc,i)=>(<div key={i} className={`sa-chk${tpaInc[i]?' on':''}`} onClick={()=>setTpaInc(p=>({...p,[i]:!p[i]}))}><div className="sa-chk-box">{tpaInc[i]&&<span style={{color:'#030b18',fontSize:10,fontWeight:900}}>✓</span>}</div><span style={{fontSize:12,color:tpaInc[i]?T.teal:T.txt2}}>{inc}</span></div>))}
                    <div style={{fontSize:11,color:T.coral,marginTop:12,marginBottom:6,textTransform:'uppercase',letterSpacing:'0.06em',fontWeight:700}}>Exclusions (any = contraindicated)</div>
                    {TPA_EXCLUSIONS.map((exc,i)=>(<div key={i} className={`sa-chk-exc${tpaExc[i]?' on':''}`} onClick={()=>setTpaExc(p=>({...p,[i]:!p[i]}))}><div className="sa-chk-box">{tpaExc[i]&&<span style={{color:'white',fontSize:10,fontWeight:900}}>✕</span>}</div><span className="sa-chk-label" style={{fontSize:12,color:tpaExc[i]?T.txt4:T.txt2}}>{exc}</span></div>))}
                    <div style={{fontSize:11,color:T.orange,marginTop:12,marginBottom:6,textTransform:'uppercase',letterSpacing:'0.06em',fontWeight:700}}>Relative CI (3–4.5h window)</div>
                    {TPA_RELATIVE.map((r,i)=><div key={i} style={{display:'flex',gap:8,padding:'5px 10px',fontSize:12,color:T.txt3}}><span style={{color:T.orange}}>⚠</span><span>{r}</span></div>)}
                    <div style={{marginTop:12,padding:'10px 14px',background:'rgba(0,229,192,0.06)',border:'1px solid rgba(0,229,192,0.2)',borderRadius:10}}>
                      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.teal,fontWeight:700,marginBottom:4}}>ALTEPLASE DOSING</div>
                      <div style={{fontSize:12,color:T.txt2,lineHeight:1.65}}>0.9 mg/kg IV (max 90 mg). 10% bolus over 1 min → 90% over 60 min. Hold anticoagulants/antiplatelets 24h post.</div>
                    </div>
                    <div style={{marginTop:10,padding:'10px 14px',background:'rgba(59,158,255,0.07)',border:'1px solid rgba(59,158,255,0.3)',borderRadius:10}}>
                      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.blue,fontWeight:700,marginBottom:4}}>TNK (TENECTEPLASE) — ACEP 2024 LEVEL B</div>
                      <div style={{fontSize:12,color:T.txt2,lineHeight:1.65,marginBottom:6}}>Tenecteplase 0.25 mg/kg IV bolus (max 25 mg) — single bolus, no infusion required.</div>
                      <div style={{fontSize:11,color:T.txt3,lineHeight:1.6,marginBottom:4}}>• Single IV push vs alteplase 10% bolus + 60-min infusion — operationally simpler</div>
                      <div style={{fontSize:11,color:T.txt3,lineHeight:1.6,marginBottom:4}}>• Higher fibrin specificity, non-inferior to alteplase (EXTEND-IA TNKv2, NOR-TEST 2)</div>
                      <div style={{fontSize:11,color:T.txt3,lineHeight:1.6,marginBottom:4}}>• Preferred by many centers when IV thrombolysis indicated with confirmed LVO</div>
                      <div style={{fontSize:11,color:T.coral,lineHeight:1.6}}>⚠ Dose: 0.25 mg/kg — NOT 0.4 mg/kg (higher dose showed worse outcomes in trials)</div>
                    </div>
                  </div>
                  <div className="sa-card">
                    <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,color:T.blue,marginBottom:6}}>🔧 Mechanical Thrombectomy</div>
                    <div style={{padding:'7px 10px',background:'rgba(59,158,255,0.07)',border:'1px solid rgba(59,158,255,0.25)',borderRadius:8,marginBottom:10,fontSize:11,color:T.blue,lineHeight:1.55}}>
                      <strong>ACEP 2024 / SWIFT-DIRECT / DIRECT-SAFE:</strong> For confirmed LVO eligible for both IV tPA and thrombectomy — proceed to angiography suite SIMULTANEOUSLY with tPA. Do NOT wait for tPA response before activating thrombectomy team.
                    </div>
                    <div style={{fontSize:11,color:T.txt3,marginBottom:8}}>Class I, LOE A — AHA 2018</div>
                    {[["NIHSS","≥6 (or any if proven LVO)"],["Vessel","ICA or M1/M2 MCA, basilar artery"],["Time Window","≤24h from LKW (DAWN/DEFUSE-3)"],["Pre-stroke mRS","0–1 (functionally independent)"],["ASPECTS","≥6 on CT or CT perfusion mismatch"]].map(([k,v])=>(<div key={k} style={{display:'flex',justifyContent:'space-between',padding:'7px 12px',background:'rgba(20,55,100,0.3)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:8,marginBottom:5,gap:8}}><span style={{fontSize:11,color:T.txt3}}>{k}</span><span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:T.blue,fontWeight:600}}>{v}</span></div>))}
                  </div>
                </div>
                <div>
                  <div className="sa-card">
                    <div className="sa-sec-title">🩺 Blood Pressure Management</div>
                    <div style={{display:'flex',gap:10,marginBottom:14,flexWrap:'wrap'}}>
                      {[['SBP',sbp,setSbp,parseInt(sbp)>185],[' DBP',dbp,setDbp,parseInt(dbp)>110]].map(([lbl,val,setter,high])=>(<div key={lbl} style={{display:'flex',alignItems:'center',gap:6,background:'rgba(4,14,32,0.7)',border:`1px solid ${high?T.coral:'rgba(255,255,255,0.09)'}`,borderRadius:10,padding:'7px 14px',backdropFilter:'blur(8px)'}}><span style={{fontSize:10,color:T.txt3}}>{lbl}</span><input type="number" value={val} onChange={e=>setter(e.target.value)} placeholder="0" style={{background:'transparent',border:'none',outline:'none',fontFamily:"'JetBrains Mono',monospace",fontSize:22,fontWeight:700,color:high?T.coral:T.teal,width:65}}/><span style={{fontSize:10,color:T.txt3}}>mmHg</span></div>))}
                      {bpHigh&&<span style={{fontSize:11,color:T.coral,fontWeight:700,alignSelf:'center'}}>⚠ Above threshold</span>}
                    </div>
                    <div style={{overflowX:'auto'}}>
                      <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                        <thead><tr>{['Scenario','Target','Agent'].map(h=><th key={h} style={{textAlign:'left',padding:'6px 8px',color:T.txt3,borderBottom:'1px solid rgba(255,255,255,0.07)',fontWeight:700,textTransform:'uppercase',fontSize:9,letterSpacing:'0.06em'}}>{h}</th>)}</tr></thead>
                        <tbody>{BP_TABLE.map((r,i)=><tr key={i} style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}><td style={{padding:'7px 8px',color:T.txt2,lineHeight:1.45}}>{r.scenario}</td><td style={{padding:'7px 8px',color:T.teal,fontFamily:"'JetBrains Mono',monospace",fontWeight:600,whiteSpace:'nowrap'}}>{r.target}</td><td style={{padding:'7px 8px',color:T.txt3,lineHeight:1.45}}>{r.agent}</td></tr>)}</tbody>
                      </table>
                    </div>
                  </div>
                  <div className="sa-card">
                    <div className="sa-sec-title">🛡 Secondary Prevention</div>
                    {SECONDARY_PREVENTION.map((item,i)=>(<div key={i} className="acc-item"><div className="acc-hdr" onClick={()=>setSecPrevOpen(p=>({...p,[i]:!p[i]}))}><span>{item.type}</span><span style={{color:T.txt3}}>{secPrevOpen[i]?'▲':'▼'}</span></div>{secPrevOpen[i]&&<div className="acc-body">{item.text}</div>}</div>))}
                  </div>
                  <div className="sa-card">
                    <div className="sa-sec-title">📋 Standard Stroke Orders</div>
                    {STANDARD_ORDERS.map((o,i)=>(<div key={i} className={`sa-chk${ordersChecked[i]?' on':''}`} onClick={()=>setOrdersChecked(p=>({...p,[i]:!p[i]}))}><div className="sa-chk-box">{ordersChecked[i]&&<span style={{color:'#030b18',fontSize:10,fontWeight:900}}>✓</span>}</div><span style={{fontSize:12,color:ordersChecked[i]?T.teal:T.txt2}}>{o}</span></div>))}
                  </div>
                </div>
              </div>
            )}
          </div>
            )}

          </div>
        )}

        {/* ════════════ TAB: CONSULT ════════════ */}
        {activeTab==='consult'&&(
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,alignItems:'start'}} className="sa-2col">
            <div>
              <div className="sa-card">
                <div className="sa-sec-title">⏱ Consultation Times</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                  {CONSULT_TIMES.map((ct,i)=>(<div key={i}><div style={{fontSize:10,color:ct.color,fontWeight:700,marginBottom:4,textTransform:'uppercase',letterSpacing:'0.05em'}}>{ct.label}</div><div style={{display:'flex',gap:4}}><input type={ct.type} value={consultVals[i]||''} onChange={e=>setConsultVals(p=>({...p,[i]:e.target.value}))} style={{...INPUT_STYLE,flex:1,fontSize:11,padding:'5px 8px',borderColor:`${ct.color}33`,color:ct.color}}/>{ct.type==='time'&&<button className="sa-now" onClick={()=>setConsultVals(p=>({...p,[i]:nowTime()}))}>Now</button>}</div></div>))}
                </div>
              </div>
              <div className="sa-card">
                <div className="sa-sec-title">👥 Consulting Providers</div>
                {[['Neurologist',neurologist,setNeurologist],['Attending Physician',attending,setAttending],['Activation Type',actType,setActType]].map(([lbl,val,setter])=>(<div key={lbl} style={{marginBottom:10}}><div className="sa-label">{lbl}</div><input className="sa-input" value={val} onChange={e=>setter(e.target.value)} placeholder={lbl}/></div>))}
              </div>
              <div className="sa-card">
                <div className="sa-sec-title">📅 Follow-up Schedule</div>
                {[['Next NIHSS Assessment','next'],['24h NIHSS','h24'],['MRI Follow-up','mri'],['Clinic Follow-up','clinic']].map(([lbl,key])=>(<div key={key} style={{marginBottom:10}}><div className="sa-label">{lbl}</div><input className="sa-input" value={followup[key]} onChange={e=>setFollowup(p=>({...p,[key]:e.target.value}))} placeholder={lbl}/></div>))}
              </div>
            </div>
            <div>
              <div className="sa-card">
                <div className="sa-sec-title">✅ Quick Recommendations</div>
                {NEURO_RECS.map((rec,i)=>(<div key={i} className={`sa-chk${neuRecs[i]?' on':''}`} onClick={()=>setNeuRecs(p=>({...p,[i]:!p[i]}))}><div className="sa-chk-box">{neuRecs[i]&&<span style={{color:'#030b18',fontSize:10,fontWeight:900}}>✓</span>}</div><span style={{fontSize:12,color:neuRecs[i]?T.teal:T.txt2}}>{rec}</span></div>))}
              </div>
              <div className="sa-card">
                <div className="sa-sec-title">📝 Neuro Recommendations</div>
                <textarea className="sa-textarea" value={neuNote} onChange={e=>setNeuNote(e.target.value)} placeholder="Free-text neurology recommendations..."/>
              </div>
              <div className="sa-card">
                <div className="sa-sec-title">🏥 Disposition</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:14}}>{DISPOSITION_OPTIONS.map(d=><button key={d} className={`disp-pill${disposition===d?' sel':''}`} onClick={()=>setDisposition(d)}>{d}</button>)}</div>
                <div className="sa-label" style={{marginBottom:4}}>Next Steps / Orders</div>
                <textarea className="sa-textarea" value={nextSteps} onChange={e=>setNextSteps(e.target.value)} placeholder="Orders, next steps..."/>
                <div className="sa-label" style={{marginTop:10,marginBottom:4}}>Outstanding / Pending Items</div>
                <textarea className="sa-textarea" value={pending} onChange={e=>setPending(e.target.value)} placeholder="Pending labs, consults, imaging..."/>
              </div>
              <div style={{background:'rgba(0,229,192,0.06)',border:'1px solid rgba(0,229,192,0.2)',borderRadius:14,padding:18,backdropFilter:'blur(16px)'}}>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,color:T.teal,marginBottom:12}}>📋 Case Summary</div>
                {[['NIHSS Score',`${nihssTotal} — ${severity.label}`],['LKW',lkw||'—'],['Alert / Arrival',alertTime||'—'],['tPA Status',tpaEligible?'✓ Eligible':(Object.values(tpaExc).some(Boolean)?'❌ Exclusion present':'Not reviewed')],['Disposition',disposition||'—']].map(([k,v])=>(<div key={k} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid rgba(0,229,192,0.1)'}}><span style={{fontSize:11,color:T.txt3}}>{k}</span><span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:T.teal,fontWeight:600,maxWidth:'60%',textAlign:'right'}}>{v}</span></div>))}
              </div>
            </div>
          </div>
        )}

        {/* ════════════ TAB: CALCULATORS ════════════ */}
        {activeTab==='calc'&&(()=>{
          const GCS_ITEMS=[{key:'eye',label:'Eye Opening',max:4,options:[{score:1,label:'None',desc:'No eye opening'},{score:2,label:'To pain',desc:'Opens to painful stimulus'},{score:3,label:'To voice',desc:'Opens to verbal command'},{score:4,label:'Spontaneous',desc:'Eyes open spontaneously'}]},{key:'verbal',label:'Verbal Response',max:5,options:[{score:1,label:'None',desc:'No verbal response'},{score:2,label:'Sounds',desc:'Incomprehensible sounds'},{score:3,label:'Words',desc:'Inappropriate words'},{score:4,label:'Confused',desc:'Confused conversation'},{score:5,label:'Oriented',desc:'Oriented and converses normally'}]},{key:'motor',label:'Motor Response',max:6,options:[{score:1,label:'None',desc:'No motor response'},{score:2,label:'Extension',desc:'Abnormal extension (decerebrate)'},{score:3,label:'Flexion',desc:'Abnormal flexion (decorticate)'},{score:4,label:'Withdrawal',desc:'Withdraws from pain'},{score:5,label:'Localizes',desc:'Localizes painful stimulus'},{score:6,label:'Obeys',desc:'Obeys commands'}]}];
          const ASPECTS_REGIONS=[{id:'c',label:'Caudate'},{id:'p',label:'Putamen'},{id:'ic',label:'Internal Capsule'},{id:'ic2',label:'Insular Ribbon'},{id:'m1',label:'M1 — Ant MCA'},{id:'m2',label:'M2 — Lat MCA'},{id:'m3',label:'M3 — Post MCA'},{id:'m4',label:'M4 — Ant sup MCA'},{id:'m5',label:'M5 — Lat sup MCA'},{id:'m6',label:'M6 — Post sup MCA'}];
          const gcsTotal=(gcs.eye||0)+(gcs.verbal||0)+(gcs.motor||0);
          const gcsSev=gcsTotal>=13?{label:'Mild',color:T.teal}:gcsTotal>=9?{label:'Moderate',color:T.gold}:{label:'Severe',color:T.coral};
          const aspectsScore=10-Object.values(aspects).filter(Boolean).length;
          const aspectsColor=aspectsScore>=8?T.teal:aspectsScore>=6?T.gold:T.coral;
          const weightKg=tpaWeight?parseFloat(tpaWeight)*(tpaWeightUnit==='lbs'?0.453592:1):null;
          const tpaTotalDose=weightKg?Math.min(weightKg*0.9,90):null;
          const tpaBolus=tpaTotalDose?+(tpaTotalDose*0.1).toFixed(1):null;
          const tpaInfusion=tpaTotalDose?+(tpaTotalDose*0.9).toFixed(1):null;
          const bpOk=!(parseInt(sbp)>185||parseInt(dbp)>110);
          return (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16,alignItems:'start'}} className="sa-3col">
              <div className="sa-card">
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12,flexWrap:'wrap',gap:8}}>
                  <div className="sa-sec-title" style={{margin:0}}>👁 Glasgow Coma Scale</div>
                  {gcsTotal>0&&<div style={{display:'flex',alignItems:'center',gap:8}}><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:32,fontWeight:800,color:gcsSev.color,lineHeight:1}}>{gcsTotal}<span style={{fontSize:14,fontWeight:400,color:T.txt3}}>/15</span></div><span style={{padding:'3px 10px',borderRadius:20,fontSize:10,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",background:`${gcsSev.color}18`,border:`1px solid ${gcsSev.color}44`,color:gcsSev.color}}>{gcsSev.label}</span></div>}
                </div>
                {GCS_ITEMS.map(item=>(<div key={item.key} style={{marginBottom:12}}><div style={{fontSize:11,color:T.txt3,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:5}}>{item.label}</div><div style={{display:'grid',gridTemplateColumns:`repeat(${item.max},1fr)`,gap:4}}>{item.options.map(opt=>{const sel=gcs[item.key]===opt.score;return(<div key={opt.score} onClick={()=>setGcs(p=>({...p,[item.key]:sel?null:opt.score}))} title={`${opt.label}: ${opt.desc}`} style={{background:sel?`${gcsSev.color}20`:'rgba(20,55,100,0.3)',border:`1px solid ${sel?gcsSev.color:'rgba(255,255,255,0.08)'}`,borderRadius:8,padding:'6px 4px',cursor:'pointer',textAlign:'center',transition:'all .15s'}}><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:16,fontWeight:800,color:sel?gcsSev.color:T.txt3}}>{opt.score}</div><div style={{fontSize:9,color:sel?gcsSev.color:T.txt4,marginTop:2,lineHeight:1.2}}>{opt.label}</div></div>);})}</div></div>))}
                {gcsTotal>0&&<div style={{marginTop:8,padding:'8px 12px',background:'rgba(20,55,100,0.3)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:8,fontSize:11,color:T.txt2,fontFamily:"'JetBrains Mono',monospace"}}>E{gcs.eye||'?'} + V{gcs.verbal||'?'} + M{gcs.motor||'?'} = <strong style={{color:gcsSev.color}}>{gcsTotal}</strong></div>}
              </div>
              <div className="sa-card">
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12,flexWrap:'wrap',gap:8}}>
                  <div className="sa-sec-title" style={{margin:0}}>🧠 ASPECTS Score</div>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:32,fontWeight:800,color:aspectsColor,lineHeight:1}}>{aspectsScore}<span style={{fontSize:14,fontWeight:400,color:T.txt3}}>/10</span></div>
                </div>
                <div style={{fontSize:11,color:T.txt3,marginBottom:10,lineHeight:1.55}}>Check regions with early ischemic changes (each −1). Score ≥6 supports thrombectomy.</div>
                {ASPECTS_REGIONS.map(r=>{const ck=aspects[r.id];return(<div key={r.id} className={`sa-chk-exc${ck?' on':''}`} onClick={()=>setAspects(p=>({...p,[r.id]:!p[r.id]}))}><div className="sa-chk-box">{ck&&<span style={{color:'white',fontSize:10,fontWeight:900}}>✕</span>}</div><span style={{fontSize:12,color:ck?T.coral:T.txt2}}>{r.label}</span>{ck&&<span style={{marginLeft:'auto',fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.coral}}>−1</span>}</div>);})}
                <div style={{marginTop:10,padding:'8px 12px',background:aspectsScore>=6?'rgba(0,229,192,0.07)':'rgba(255,107,107,0.07)',border:`1px solid ${aspectsScore>=6?'rgba(0,229,192,0.22)':'rgba(255,107,107,0.22)'}`,borderRadius:8,fontSize:11,color:aspectsScore>=6?T.teal:T.coral,fontWeight:600}}>{aspectsScore>=8?'✓ Favorable — supports intervention':aspectsScore>=6?'⚠ Borderline — discuss with neuro':'✕ Low score — poor thrombectomy candidate'}</div>
              </div>
              <div className="sa-card">
                <div className="sa-sec-title">💊 tPA Dose Calculator</div>
                <div style={{marginBottom:14}}>
                  <div className="sa-label">Patient Weight</div>
                  <div style={{display:'flex',gap:6}}>
                    <input type="number" min="0" step="0.1" value={tpaWeight} onChange={e=>setTpaWeight(e.target.value)} placeholder="Enter weight" style={{...INPUT_STYLE,flex:1}}/>
                    <div style={{display:'flex',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,overflow:'hidden'}}>
                      {['kg','lbs'].map(u=><button key={u} onClick={()=>setTpaWeightUnit(u)} style={{padding:'7px 10px',background:tpaWeightUnit===u?T.blue:'rgba(20,55,100,0.4)',color:tpaWeightUnit===u?'#030b18':T.txt2,border:'none',fontWeight:700,fontSize:11,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",transition:'all .15s'}}>{u}</button>)}
                    </div>
                  </div>
                  {weightKg&&tpaWeightUnit==='lbs'&&<div style={{fontSize:10,color:T.txt3,marginTop:4,fontFamily:"'JetBrains Mono',monospace"}}>= {weightKg.toFixed(1)} kg</div>}
                </div>
                {tpaTotalDose?(
                  <div>
                    {weightKg>100&&<div style={{padding:'6px 10px',background:'rgba(245,200,66,0.08)',border:'1px solid rgba(245,200,66,0.2)',borderRadius:8,fontSize:11,color:T.gold,marginBottom:10}}>⚠ Weight &gt;100 kg — capped at 90 mg</div>}
                    {[['Total Dose',`${tpaTotalDose.toFixed(1)} mg`,T.teal],['10% Bolus (1 min)',`${tpaBolus} mg`,T.blue],['90% Infusion (60 min)',`${tpaInfusion} mg`,T.purple]].map(([lbl,val,col])=>(<div key={lbl} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 14px',background:'rgba(20,55,100,0.3)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:10,marginBottom:6}}><span style={{fontSize:12,color:T.txt2}}>{lbl}</span><span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:20,fontWeight:800,color:col}}>{val}</span></div>))}
                    {!bpOk&&sbp&&<div style={{marginTop:8,padding:'8px 12px',background:'rgba(255,107,107,0.08)',border:'1px solid rgba(255,107,107,0.25)',borderRadius:8,fontSize:11,color:T.coral,fontWeight:600}}>⚠ BP ({sbp}/{dbp}) exceeds pre-tPA threshold. Treat to &lt;185/110 first.</div>}
                    {bpOk&&sbp&&<div style={{marginTop:8,padding:'8px 12px',background:'rgba(0,229,192,0.06)',border:'1px solid rgba(0,229,192,0.2)',borderRadius:8,fontSize:11,color:T.teal}}>✓ BP ({sbp}/{dbp}) within pre-tPA target</div>}
                  </div>
                ):(
                  <div style={{textAlign:'center',padding:'24px',color:T.txt4}}><div style={{fontSize:28,marginBottom:8}}>⚖️</div><div style={{fontSize:12}}>Enter patient weight above</div></div>
                )}
              </div>
            </div>
          );
        })()}

        {/* ════════════ TAB: TIA ════════════ */}
        {activeTab==='tia'&&(
          <div>
            <div style={{marginBottom:18,padding:'12px 18px',background:'rgba(0,229,192,0.06)',border:'1px solid rgba(0,229,192,0.2)',borderRadius:12,backdropFilter:'blur(16px)'}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,color:T.teal,marginBottom:4}}>Transient Ischemic Attack</div>
              <div style={{fontSize:12,color:T.txt2,lineHeight:1.65}}>A TIA is a transient episode of neurological dysfunction caused by focal brain, spinal cord, or retinal ischemia, <strong style={{color:T.txt}}>without acute infarction</strong>. Median duration &lt;14 minutes. Up to 10% of TIA patients have a stroke within 90 days — highest risk in first 48h.</div>
            </div>
            <div className="sub-tabs">
              {[['abcd2','🎯 ABCD² Score'],['workup','🔬 Workup'],['treatment','💊 Treatment'],['followup','📅 Follow-up']].map(([id,lbl])=><button key={id} className={`sub-tab${tiaSubTab===id?' on':''}`} onClick={()=>setTiaSubTab(id)}>{lbl}</button>)}
            </div>

            {tiaSubTab==='abcd2'&&(
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,alignItems:'start'}} className="sa-2col">
                <div>
                  {ABCD2_ITEMS.map(item=>(<div key={item.id} className="sa-card" style={{marginBottom:10}}>
                    <div style={{fontWeight:700,fontSize:13,color:T.txt,marginBottom:10}}>{item.label}</div>
                    {item.options.map(opt=>{
                      const sel=abcd2[item.id]===opt.score;
                      return(<div key={opt.score} className={`abcd-opt${sel?' sel':''}`} onClick={()=>setAbcd2(p=>({...p,[item.id]:sel?undefined:opt.score}))}>
                        <div style={{width:28,height:28,borderRadius:8,background:sel?'rgba(0,229,192,0.15)':'rgba(20,55,100,0.4)',border:`1px solid ${sel?'rgba(0,229,192,0.4)':'rgba(255,255,255,0.1)'}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                          <span style={{fontFamily:"'JetBrains Mono',monospace",fontWeight:800,fontSize:13,color:sel?T.teal:T.txt3}}>+{opt.score}</span>
                        </div>
                        <span style={{fontSize:12,color:sel?T.txt:T.txt2}}>{opt.label}</span>
                      </div>);
                    })}
                  </div>))}
                </div>
                <div>
                  <div className="sa-card">
                    <div style={{textAlign:'center',marginBottom:16}}>
                      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:64,fontWeight:800,color:abcd2Risk.color,lineHeight:1,textShadow:`0 0 40px ${abcd2Risk.color}55`}}>{abcd2Total}</div>
                      <div style={{fontSize:11,color:T.txt3,marginTop:2}}>out of 7</div>
                      <div style={{display:'inline-block',marginTop:10,padding:'5px 18px',borderRadius:20,background:`${abcd2Risk.color}18`,border:`1px solid ${abcd2Risk.color}44`,fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:700,color:abcd2Risk.color}}>{abcd2Risk.label}</div>
                      <div style={{fontSize:12,color:T.txt2,marginTop:8}}>{abcd2Risk.pct}</div>
                    </div>
                    <div style={{marginTop:4}}>
                      {[{range:'0 – 3',label:'Low Risk',color:T.teal,pct:'~1% 2-day stroke risk',rec:'Can consider outpatient workup if reliable follow-up'},{range:'4 – 5',label:'Moderate Risk',color:T.gold,pct:'~4% 2-day stroke risk',rec:'Admit or urgent observation unit (≤24h) recommended'},{range:'6 – 7',label:'High Risk',color:T.coral,pct:'~8% 2-day stroke risk',rec:'Admit for inpatient workup and monitoring'}].map((b,i)=><div key={i} style={{display:'flex',gap:10,padding:'10px 12px',background:'rgba(20,55,100,0.25)',border:`1px solid ${abcd2Risk.color===b.color?b.color+'44':'rgba(255,255,255,0.06)'}`,borderRadius:10,marginBottom:6}}>
                        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,fontWeight:700,color:b.color,flexShrink:0,width:40}}>{b.range}</span>
                        <div><div style={{fontSize:12,fontWeight:600,color:b.color,marginBottom:2}}>{b.label} — {b.pct}</div><div style={{fontSize:11,color:T.txt3}}>{b.rec}</div></div>
                      </div>)}
                    </div>
                    <div style={{marginTop:14,padding:'10px 14px',background:'rgba(0,229,192,0.05)',border:'1px solid rgba(0,229,192,0.15)',borderRadius:10,fontSize:11,color:T.txt2,lineHeight:1.65}}>
                      ⚠️ ABCD² score alone should not determine disposition. AF, MRI DWI positivity, or carotid stenosis mandates admission regardless of score.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tiaSubTab==='workup'&&(
              <div className="sa-card">
                <div className="sa-sec-title">🔬 TIA Workup Checklist</div>
                {TIA_WORKUP_LIST.map((item,i)=><div key={i} className={`sa-chk${tiaWorkup[i]?' on':''}`} onClick={()=>setTiaWorkup(p=>({...p,[i]:!p[i]}))}><div className="sa-chk-box">{tiaWorkup[i]&&<span style={{color:'#030b18',fontSize:10,fontWeight:900}}>✓</span>}</div><span style={{fontSize:12,color:tiaWorkup[i]?T.teal:T.txt2}}>{item}</span></div>)}
              </div>
            )}

            {tiaSubTab==='treatment'&&(
              <div>
                {TIA_TREATMENT_LIST.map((item,i)=><div key={i} className="acc-item"><div className="acc-hdr" onClick={()=>setTiaTreatOpen(p=>({...p,[i]:!p[i]}))} style={{color:T.txt}}><span>{item.title}</span><span style={{color:T.txt3}}>{tiaTreatOpen[i]?'▲':'▼'}</span></div>{tiaTreatOpen[i]&&<div className="acc-body">{item.text}</div>}</div>)}
                <div style={{marginTop:12,padding:'12px 16px',background:'rgba(59,158,255,0.06)',border:'1px solid rgba(59,158,255,0.18)',borderRadius:12,fontSize:12,color:T.txt2,lineHeight:1.7}}>
                  📌 <strong style={{color:T.blue}}>Key Decision Point:</strong> Cardioembolic vs non-cardioembolic etiology drives antiplatelet vs anticoagulant choice. Telemetry and echocardiogram findings are critical before finalizing treatment.
                </div>
              </div>
            )}

            {tiaSubTab==='followup'&&(
              <div className="sa-card">
                <div className="sa-sec-title">📅 TIA Follow-up & Disposition</div>
                {TIA_FOLLOWUP_LIST.map((item,i)=><div key={i} className={`sa-chk${tiaFollowup[i]?' on':''}`} onClick={()=>setTiaFollowup(p=>({...p,[i]:!p[i]}))}><div className="sa-chk-box">{tiaFollowup[i]&&<span style={{color:'#030b18',fontSize:10,fontWeight:900}}>✓</span>}</div><span style={{fontSize:12,color:tiaFollowup[i]?T.teal:T.txt2}}>{item}</span></div>)}
              </div>
            )}
          </div>
        )}

        {/* ════════════ TAB: SEIZURE ════════════ */}
        {activeTab==='seizure'&&(
          <div>
            <div style={{marginBottom:18,padding:'12px 18px',background:'rgba(176,106,255,0.06)',border:'1px solid rgba(176,106,255,0.2)',borderRadius:12,backdropFilter:'blur(16px)'}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,color:T.purple,marginBottom:4}}>Seizure & Status Epilepticus</div>
              <div style={{fontSize:12,color:T.txt2,lineHeight:1.65}}>Status epilepticus (SE) is defined as a seizure lasting <strong style={{color:T.txt}}>&gt;5 minutes</strong> or recurrent seizures without return to baseline. Convulsive SE &gt;30 min carries significant risk of permanent neuronal injury. <strong style={{color:T.coral}}>Time-critical emergency.</strong></div>
            </div>
            <div className="sub-tabs">
              {[['classification','📊 Classification'],['workup','🔬 Workup'],['protocol','🚨 Status Protocol'],['followup','📅 Follow-up']].map(([id,lbl])=><button key={id} className={`sub-tab${szSubTab===id?' on':''}`} onClick={()=>setSzSubTab(id)}>{lbl}</button>)}
            </div>

            {szSubTab==='classification'&&(
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}} className="sa-2col">
                {SEIZURE_CLASSIFICATION.map((cls,i)=><div key={i} className="sa-card" style={{borderLeft:`3px solid ${cls.color}`}}>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,color:cls.color,marginBottom:6}}>{cls.type}</div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:5,marginBottom:10}}>
                    {cls.subtypes.map((s,j)=><span key={j} style={{fontSize:11,padding:'3px 9px',borderRadius:20,background:`${cls.color}14`,border:`1px solid ${cls.color}33`,color:cls.color}}>{s}</span>)}
                  </div>
                  <div style={{fontSize:12,color:T.txt3,lineHeight:1.6}}>{cls.notes}</div>
                </div>)}
              </div>
            )}

            {szSubTab==='workup'&&(
              <div className="sa-card">
                <div className="sa-sec-title">🔬 Seizure Workup Checklist</div>
                <div style={{marginBottom:14,padding:'10px 14px',background:'rgba(255,107,107,0.07)',border:'1px solid rgba(255,107,107,0.2)',borderRadius:10,fontSize:12,color:T.coral}}>
                  🩸 <strong>First step always:</strong> Fingerstick glucose — hypoglycemia is the most common reversible cause of seizure-like activity.
                </div>
                {SEIZURE_WORKUP_LIST.map((item,i)=><div key={i} className={`sa-chk${szWorkup[i]?' on':''}`} onClick={()=>setSzWorkup(p=>({...p,[i]:!p[i]}))}><div className="sa-chk-box">{szWorkup[i]&&<span style={{color:'#030b18',fontSize:10,fontWeight:900}}>✓</span>}</div><span style={{fontSize:12,color:szWorkup[i]?T.teal:T.txt2}}>{item}</span></div>)}
              </div>
            )}

            {szSubTab==='protocol'&&(
              <div>
                <div style={{marginBottom:14,padding:'12px 16px',background:'rgba(255,107,107,0.08)',border:'1px solid rgba(255,107,107,0.25)',borderRadius:12,fontSize:12,color:T.coral,lineHeight:1.65}}>
                  🚨 <strong>Status Epilepticus Protocol</strong> — Begin timing from seizure onset. Each phase assumes prior phase has been attempted. Do NOT delay second-line if first-line fails.
                </div>
                {STATUS_PROTOCOL.map((step,i)=><div key={i} className="se-step" style={{background:`${step.color}09`,borderLeftColor:step.color,borderLeft:`3px solid ${step.color}`}}>
                  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10,flexWrap:'wrap'}}>
                    <span className="badge" style={{background:`${step.color}1a`,border:`1px solid ${step.color}44`,color:step.color}}>⏱ {step.time}</span>
                    <span style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,color:step.color}}>{step.title}</span>
                  </div>
                  {step.items.map((item,j)=><div key={j} style={{display:'flex',gap:8,padding:'5px 0',borderBottom:j<step.items.length-1?'1px solid rgba(255,255,255,0.04)':''}}>
                    <span style={{color:step.color,flexShrink:0,marginTop:1}}>▸</span>
                    <span style={{fontSize:12,color:T.txt2,lineHeight:1.55}}>{item}</span>
                  </div>)}
                </div>)}
                <div style={{padding:'12px 16px',background:'rgba(176,106,255,0.06)',border:'1px solid rgba(176,106,255,0.2)',borderRadius:12,fontSize:12,color:T.txt2,lineHeight:1.7}}>
                  📡 <strong style={{color:T.purple}}>Continuous EEG monitoring</strong> is required once anesthetic agents are started. Goal: electrographic seizure cessation or burst-suppression pattern. ICU placement mandatory for refractory SE.
                </div>
              </div>
            )}

            {szSubTab==='followup'&&(
              <div className="sa-card">
                <div className="sa-sec-title">📅 Seizure Follow-up & Counseling</div>
                {SEIZURE_FOLLOWUP_LIST.map((item,i)=><div key={i} className={`sa-chk${szFollowup[i]?' on':''}`} onClick={()=>setSzFollowup(p=>({...p,[i]:!p[i]}))}><div className="sa-chk-box">{szFollowup[i]&&<span style={{color:'#030b18',fontSize:10,fontWeight:900}}>✓</span>}</div><span style={{fontSize:12,color:szFollowup[i]?T.teal:T.txt2}}>{item}</span></div>)}
              </div>
            )}
          </div>
        )}

        {/* ════════════ TAB: AMS ════════════ */}
        {activeTab==='ams'&&(
          <div>
            <div style={{marginBottom:18,padding:'12px 18px',background:'rgba(255,107,107,0.06)',border:'1px solid rgba(255,107,107,0.2)',borderRadius:12,backdropFilter:'blur(16px)'}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,color:T.coral,marginBottom:4}}>Altered Mental Status</div>
              <div style={{fontSize:12,color:T.txt2,lineHeight:1.65}}>AMS encompasses a spectrum from mild confusion to deep coma. Approach systematically using the <strong style={{color:T.txt}}>AEIOU-TIPS</strong> mnemonic. Always rule out life-threatening reversible causes first — hypoglycemia, opioid overdose, and hypoxia can be rapidly fatal if missed.</div>
            </div>
            <div className="sub-tabs">
              {[['differential','🔤 AEIOU-TIPS'],['workup','🔬 Workup'],['treatment','💊 Treatment'],['followup','📅 Follow-up']].map(([id,lbl])=><button key={id} className={`sub-tab${amsSubTab===id?' on':''}`} onClick={()=>setAmsSubTab(id)}>{lbl}</button>)}
            </div>

            {amsSubTab==='differential'&&(
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}} className="sa-2col">
                {AMS_DIFFERENTIAL.map((cat,i)=><div key={i} className="ams-card" style={{borderTop:`2px solid ${cat.color}`}}>
                  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
                    <div style={{width:34,height:34,borderRadius:10,background:`${cat.color}18`,border:`1px solid ${cat.color}33`,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'JetBrains Mono',monospace",fontSize:18,fontWeight:900,color:cat.color,flexShrink:0}}>{cat.letter}</div>
                    <div style={{fontWeight:700,fontSize:13,color:T.txt}}>{cat.label}</div>
                  </div>
                  {cat.items.map((item,j)=><div key={j} style={{display:'flex',gap:7,padding:'4px 0',borderBottom:j<cat.items.length-1?'1px solid rgba(255,255,255,0.04)':''}}>
                    <span style={{color:cat.color,flexShrink:0,fontSize:11}}>•</span>
                    <span style={{fontSize:12,color:T.txt2,lineHeight:1.5}}>{item}</span>
                  </div>)}
                </div>)}
              </div>
            )}

            {amsSubTab==='workup'&&(
              <div className="sa-card">
                <div className="sa-sec-title">🔬 AMS Workup Checklist</div>
                <div style={{marginBottom:14,padding:'10px 14px',background:'rgba(255,107,107,0.07)',border:'1px solid rgba(255,107,107,0.2)',borderRadius:10,fontSize:12,color:T.coral}}>
                  🚨 <strong>Priority sequence:</strong> Glucose → Vitals/O2 → CT Head → BMP → Toxicology → LP (if indicated)
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 20px'}} className="sa-2col">
                  {AMS_WORKUP_LIST.map((item,i)=><div key={i} className={`sa-chk${amsWorkup[i]?' on':''}`} onClick={()=>setAmsWorkup(p=>({...p,[i]:!p[i]}))}><div className="sa-chk-box">{amsWorkup[i]&&<span style={{color:'#030b18',fontSize:10,fontWeight:900}}>✓</span>}</div><span style={{fontSize:12,color:amsWorkup[i]?T.teal:T.txt2}}>{item}</span></div>)}
                </div>
              </div>
            )}

            {amsSubTab==='treatment'&&(
              <div>
                <div style={{marginBottom:14,padding:'10px 14px',background:'rgba(245,200,66,0.07)',border:'1px solid rgba(245,200,66,0.2)',borderRadius:10,fontSize:12,color:T.gold}}>
                  ⭐ <strong>Empiric coma cocktail:</strong> Thiamine 100 mg IV → Glucose check → Naloxone (if opioid suspected). In elderly/malnourished: thiamine BEFORE glucose always.
                </div>
                {AMS_TREATMENT_LIST.map((item,i)=><div key={i} className="acc-item"><div className="acc-hdr" onClick={()=>setAmsTreatOpen(p=>({...p,[i]:!p[i]}))} style={{color:T.txt}}><span>{item.title}</span><span style={{color:T.txt3}}>{amsTreatOpen[i]?'▲':'▼'}</span></div>{amsTreatOpen[i]&&<div className="acc-body">{item.text}</div>}</div>)}
              </div>
            )}

            {amsSubTab==='followup'&&(
              <div className="sa-card">
                <div className="sa-sec-title">📅 AMS Follow-up & Monitoring</div>
                {AMS_FOLLOWUP_LIST.map((item,i)=><div key={i} className={`sa-chk${amsFollowup[i]?' on':''}`} onClick={()=>setAmsFollowup(p=>({...p,[i]:!p[i]}))}><div className="sa-chk-box">{amsFollowup[i]&&<span style={{color:'#030b18',fontSize:10,fontWeight:900}}>✓</span>}</div><span style={{fontSize:12,color:amsFollowup[i]?T.teal:T.txt2}}>{item}</span></div>)}
              </div>
            )}
          </div>
        )}

        {/* ── FOOTER ── */}
        <div style={{marginTop:32,padding:'14px 18px',background:'rgba(8,24,48,0.55)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:12,fontSize:10,color:T.txt3,lineHeight:1.8,backdropFilter:'blur(20px)'}}>
          ⚕️ <strong style={{color:T.txt4}}>Clinical Decision Support — Not a Substitute for Clinical Judgment.</strong>&nbsp;
          Reflects AHA/ASA Acute Ischemic Stroke guidelines (2019, updated 2022–2023), Epilepsy Foundation Status Epilepticus guidelines (2022), and institutional AMS workup standards.
          All treatment decisions must be verified by the attending physician. NIHSS must be performed by trained, certified examiners. Pediatric decisions require pediatric neurology consultation.
        </div>
      </div>
    </div>
  );
}