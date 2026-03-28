import React, { useState, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";

const T = {
  bg:'#050f1e',panel:'#081628',card:'#0b1e36',up:'#0e2544',
  border:'#1a3555',borderHi:'#2a4f7a',
  blue:'#3b9eff',teal:'#00e5c0',gold:'#f5c842',
  coral:'#ff6b6b',orange:'#ff9f43',purple:'#b06aff',
  txt:'#e8f0fe',txt2:'#8aaccc',txt3:'#4a6a8a',txt4:'#2e4a6a',
};

const NIHSS_ITEMS = [
  {id:"1a",num:"1a",label:"Level of Consciousness",short:"LOC",maxScore:3,
   instructions:"Observe level of alertness. Score 3 only if patient makes no movement in response to stimulation.",
   options:[{score:0,label:"Alert",description:"Keenly responsive; minor stimulation not required"},{score:1,label:"Not alert",description:"Arousable by minor stimulation — obeys, answers, or responds"},{score:2,label:"Obtunded",description:"Requires repeated stimulation or painful stimuli to attend"},{score:3,label:"Unresponsive",description:"Reflex motor or autonomic effects only, or totally unresponsive"}]},
  {id:"1b",num:"1b",label:"LOC Questions",short:"LOC-Q",maxScore:2,
   instructions:"Ask: (1) 'What month is it?' (2) 'How old are you?' Score initial answer only.",
   stimulus:["What month is it?","How old are you?"],
   options:[{score:0,label:"Both correct",description:"Answers both correctly"},{score:1,label:"One correct",description:"Answers one correctly, OR cannot speak (intubated, dysarthric)"},{score:2,label:"Neither correct",description:"Aphasia or stupor — does not answer either correctly"}]},
  {id:"1c",num:"1c",label:"LOC Commands",short:"LOC-C",maxScore:2,
   instructions:"Ask to: (1) 'Open and close your eyes' (2) 'Grip and release your hand.' Score actual attempt only.",
   stimulus:["Open and close your eyes","Grip and release your hand (non-paretic side)"],
   options:[{score:0,label:"Obeys both",description:"Performs both tasks correctly"},{score:1,label:"Obeys one",description:"Performs one task correctly"},{score:2,label:"Obeys neither",description:"Does not perform either task"}]},
  {id:"2",num:"2",label:"Best Gaze",short:"Gaze",maxScore:2,
   instructions:"Test horizontal eye movements only. Use voluntary or oculocephalic maneuver.",
   options:[{score:0,label:"Normal",description:"Normal horizontal gaze"},{score:1,label:"Partial palsy",description:"Gaze abnormal in one or both eyes, but not forced deviation"},{score:2,label:"Forced deviation",description:"Forced deviation or total gaze paresis not overcome by oculocephalic maneuver"}]},
  {id:"3",num:"3",label:"Visual Fields",short:"Visual",maxScore:3,
   instructions:"Test visual fields using finger counting or visual threat. Score if asymmetric.",
   options:[{score:0,label:"No loss",description:"No visual loss"},{score:1,label:"Partial hemianopia",description:"Partial hemianopia"},{score:2,label:"Complete hemianopia",description:"Complete hemianopia"},{score:3,label:"Bilateral / blind",description:"Bilateral hemianopia including cortical blindness"}]},
  {id:"4",num:"4",label:"Facial Palsy",short:"Face",maxScore:3,
   instructions:"Ask to show teeth or raise eyebrows and close eyes. Score symmetry of facial movement.",
   options:[{score:0,label:"Normal",description:"Normal symmetrical movements"},{score:1,label:"Minor",description:"Minor paralysis — flattened NLF, asymmetry on smiling"},{score:2,label:"Partial",description:"Partial paralysis — near-total paralysis of lower face"},{score:3,label:"Complete",description:"Complete paralysis of one or both sides — no movement upper & lower face"}]},
  {id:"5a",num:"5a",label:"Motor Arm — Left",short:"L-Arm",maxScore:4,allowUntestable:true,
   instructions:"Extend arm 90° (seated) or 45° (supine). Count 10 seconds. Score best effort.",
   options:[{score:0,label:"No drift",description:"Arm holds 90°/45° for full 10 seconds"},{score:1,label:"Drift",description:"Arm holds < 10 sec but does not hit bed"},{score:2,label:"Some effort",description:"Some effort against gravity but arm drifts to bed within 10 sec"},{score:3,label:"No effort",description:"No effort against gravity — arm falls immediately"},{score:4,label:"No movement",description:"No movement at all"},{score:"UN",label:"Untestable",description:"Amputation or joint fusion — explain in notes"}]},
  {id:"5b",num:"5b",label:"Motor Arm — Right",short:"R-Arm",maxScore:4,allowUntestable:true,
   instructions:"Extend arm 90° (seated) or 45° (supine). Count 10 seconds.",
   options:[{score:0,label:"No drift",description:"Arm holds 90°/45° for full 10 seconds"},{score:1,label:"Drift",description:"Arm holds < 10 sec but does not hit bed"},{score:2,label:"Some effort",description:"Some effort against gravity but arm drifts to bed within 10 sec"},{score:3,label:"No effort",description:"No effort against gravity — arm falls immediately"},{score:4,label:"No movement",description:"No movement at all"},{score:"UN",label:"Untestable",description:"Amputation or joint fusion — explain in notes"}]},
  {id:"6a",num:"6a",label:"Motor Leg — Left",short:"L-Leg",maxScore:4,allowUntestable:true,
   instructions:"Elevate leg 30° (supine). Count 5 seconds.",
   options:[{score:0,label:"No drift",description:"Leg holds 30° for full 5 seconds"},{score:1,label:"Drift",description:"Leg falls by end of 5 sec but does not touch bed"},{score:2,label:"Some effort",description:"Leg falls to bed within 5 sec but has some effort against gravity"},{score:3,label:"No effort",description:"No effort against gravity — leg falls immediately to bed"},{score:4,label:"No movement",description:"No movement"},{score:"UN",label:"Untestable",description:"Amputation or joint fusion"}]},
  {id:"6b",num:"6b",label:"Motor Leg — Right",short:"R-Leg",maxScore:4,allowUntestable:true,
   instructions:"Elevate leg 30° (supine). Count 5 seconds.",
   options:[{score:0,label:"No drift",description:"Leg holds 30° for full 5 seconds"},{score:1,label:"Drift",description:"Leg falls by end of 5 sec but does not touch bed"},{score:2,label:"Some effort",description:"Leg falls to bed within 5 sec but has some effort against gravity"},{score:3,label:"No effort",description:"No effort against gravity — leg falls immediately to bed"},{score:4,label:"No movement",description:"No movement"},{score:"UN",label:"Untestable",description:"Amputation or joint fusion"}]},
  {id:"7",num:"7",label:"Limb Ataxia",short:"Ataxia",maxScore:2,allowUntestable:true,
   instructions:"Finger-nose-finger and heel-shin tests. Score only if clearly out of proportion to weakness.",
   options:[{score:0,label:"Absent",description:"No ataxia"},{score:1,label:"One limb",description:"Ataxia present in one limb"},{score:2,label:"Two limbs",description:"Ataxia present in two limbs"},{score:"UN",label:"Untestable",description:"Paralyzed or amputated"}]},
  {id:"8",num:"8",label:"Sensory",short:"Sensory",maxScore:2,
   instructions:"Test pinprick on face, arm, trunk, and leg. Test both sides. Score only stroke-related loss.",
   options:[{score:0,label:"Normal",description:"No sensory loss"},{score:1,label:"Mild–moderate loss",description:"Patient feels pinprick less sharp; aware of being touched"},{score:2,label:"Severe–total loss",description:"Patient is not aware of being touched in face, arm, and leg"}]},
  {id:"9",num:"9",label:"Best Language",short:"Language",maxScore:3,
   instructions:"Show Cookie Theft picture. Ask patient to describe. Then show reading sentences.",
   options:[{score:0,label:"No aphasia",description:"Normal; no aphasia"},{score:1,label:"Mild–moderate",description:"Some obvious loss of fluency without significant limitation on ideas expressed"},{score:2,label:"Severe aphasia",description:"All communication through fragmentary expression; great need for inference"},{score:3,label:"Mute / Global",description:"No usable speech or auditory comprehension"}]},
  {id:"10",num:"10",label:"Dysarthria",short:"Speech",maxScore:2,allowUntestable:true,
   instructions:"Read the word list to patient. Score based on clarity of articulation.",
   wordList:["MAMA","TIP-TOP","FIFTY-FIFTY","THANKS","HUCKLEBERRY","BASEBALL PLAYER","CATERPILLAR"],
   options:[{score:0,label:"Normal",description:"Normal articulation"},{score:1,label:"Mild–moderate",description:"Slurred but can be understood with some difficulty"},{score:2,label:"Severe / mute",description:"Speech so slurred it is unintelligible — or patient is mute/anarthric"},{score:"UN",label:"Untestable",description:"Intubated or other physical barrier"}]},
  {id:"11",num:"11",label:"Extinction / Inattention",short:"Neglect",maxScore:2,
   instructions:"Simultaneously touch both hands. Show fingers in both visual fields.",
   options:[{score:0,label:"No abnormality",description:"No abnormality"},{score:1,label:"Inattention",description:"Visual, tactile, auditory, or spatial inattention in one sensory modality"},{score:2,label:"Profound hemi-neglect",description:"Profound hemi-inattention > 1 modality; does not recognize own hand"}]},
];

const SEVERITY_BANDS = [
  {min:0,max:0,label:"No Stroke",color:"#00e5c0",bg:"rgba(0,229,192,0.1)"},
  {min:1,max:4,label:"Minor Stroke",color:"#44d7a8",bg:"rgba(68,215,168,0.1)"},
  {min:5,max:15,label:"Moderate Stroke",color:"#f5c842",bg:"rgba(245,200,66,0.1)"},
  {min:16,max:20,label:"Moderate-Severe",color:"#ff9f43",bg:"rgba(255,159,67,0.1)"},
  {min:21,max:42,label:"Severe Stroke",color:"#ff6b6b",bg:"rgba(255,107,107,0.1)"},
];

const READING_SENTENCES = [
  "You know how.","Down to earth.","I got home from work.",
  "Near the table in the dining room.","They heard him speak on the radio last night.",
];

const WORKUP_STEPS = [
  {phase:"0–10 min",color:"#ff6b6b",icon:"🚨",title:"Immediate Stabilization",isImaging:false,
   items:["ABCs — airway, O2 ≥94%","IV access × 2, cardiac monitor, pulse oximetry","Fingerstick glucose","12-lead ECG","Vital signs, weight","Activate stroke alert","Notify neurology on call"]},
  {phase:"0–25 min",color:"#ff9f43",icon:"🧪",title:"Laboratory Studies",isImaging:false,
   items:["CBC with differential","BMP/CMP","PT/INR, aPTT","Type & Screen","Troponin, BNP","Lipid panel","Urine pregnancy test (if applicable)","HbA1c"]},
  {phase:"0–25 min",color:"#3b9eff",icon:"🧠",title:"Neuroimaging — Tier 1",isImaging:true,
   items:["CT Head without contrast — STAT","CTA head & neck (if LVO suspected, NIHSS ≥6)","CT Perfusion (if >3–4.5h or wake-up stroke)","Door-to-CT ≤25 min (AHA Class I)","CT interpretation ≤45 min"]},
  {phase:"25–60 min",color:"#00e5c0",icon:"📋",title:"Clinical Assessment",isImaging:false,
   items:["Complete NIHSS (document time)","PMH: HTN, DM, AF, prior stroke/TIA","Medication reconciliation","Last known well time (LKW)","Blood pressure both arms","Neurological exam documentation"]},
  {phase:"60–120 min",color:"#b06aff",icon:"🔬",title:"Advanced Imaging — Tier 2",isImaging:true,
   items:["MRI Brain with DWI/ADC — gold standard","MRI/MRA head & neck","Door-to-needle ≤60 min for tPA","Echocardiogram (TTE/TEE)","Carotid ultrasound (anterior circulation)","EEG if seizure suspected"]},
  {phase:"Inpatient",color:"#8aaccc",icon:"🏥",title:"Monitoring & Ongoing Workup",isImaging:false,
   items:["Continuous cardiac telemetry ≥24h","Serial NIHSS q4–8h","Swallowing assessment before PO","Repeat CT/MRI at 24–48h","Hypercoagulable panel (young/cryptogenic)","Early PT/OT/SLP consultation"]},
];

const TPA_INCLUSIONS = [
  "Ischemic stroke causing measurable neurological deficit",
  "Age ≥18 years",
  "Onset within 3 hours (up to 4.5h in select patients)",
  "No contraindications present",
];
const TPA_EXCLUSIONS = [
  "Head CT showing intracranial hemorrhage",
  "Active internal bleeding (excluding menses)",
  "Recent intracranial/spinal surgery or serious head trauma (<3 months)",
  "Intracranial neoplasm, AVM, or aneurysm (symptomatic)",
  "Bleeding diathesis: platelet count <100,000/mm³",
  "Heparin use within 48h with elevated aPTT",
  "Current anticoagulant use with INR >1.7 or PT >15s",
  "Blood glucose <50 mg/dL or >400 mg/dL",
  "Significant hypertension: SBP >185 or DBP >110 mmHg after treatment attempt",
  "Active infective endocarditis",
  "Aortic arch dissection",
];
const TPA_RELATIVE = [
  "Age >80 years","NIHSS score >25","History of both stroke AND diabetes mellitus",
  "Oral anticoagulant use (any dose)","Imaging evidence of ischemic injury >1/3 MCA territory",
];

const BP_TABLE = [
  {scenario:"Eligible for IV alteplase — before infusion",target:"SBP <185, DBP <110 mmHg",agent:"Labetalol 10–20 mg IV push; or Nicardipine 5 mg/h IV"},
  {scenario:"During and 24h after IV alteplase",target:"SBP <180, DBP <105 mmHg",agent:"Labetalol 10 mg IV q10 min (max 300 mg); Nicardipine 5–15 mg/h; Clevidipine 2–4 mg/h"},
  {scenario:"Not receiving thrombolytics — permissive HTN",target:"Allow up to 220/120 mmHg",agent:"Treat only if SBP >220 or DBP >120; or cardiac/renal emergency"},
  {scenario:"Hemorrhagic conversion or ICH",target:"SBP 130–150 mmHg",agent:"Nicardipine drip preferred; avoid vasodilators"},
  {scenario:"Hypotension (SBP <90)",target:"Correct immediately",agent:"Isotonic saline bolus; vasopressors if refractory; treat cause"},
];

const SECONDARY_PREVENTION = [
  {type:"Non-cardioembolic (atherothrombotic/lacunar)",text:"Aspirin 81–325 mg/day OR Clopidogrel 75 mg/day. DAPT × 21 days if NIHSS ≤3 (POINT/CHANCE). High-intensity statin (Atorvastatin 40–80 mg)."},
  {type:"Cardioembolic (AF, valvular)",text:"DOAC preferred (Apixaban 5 mg BID, Rivaroxaban 20 mg qDay, Dabigatran 150 mg BID). Start within 14 days. Warfarin (INR 2–3) for valvular disease."},
  {type:"Large artery atherosclerosis / carotid stenosis",text:"Antiplatelet + statin. CEA if ipsilateral stenosis 70–99% within 2 weeks."},
  {type:"Cryptogenic / PFO",text:"PFO closure if age <60 with high-risk features (CLOSE/REDUCE). Antiplatelet first-line."},
  {type:"BP management long-term",text:"Target <130/80 mmHg. Start antihypertensives 24–48h post-stroke. ACEi/ARB preferred (PROGRESS trial)."},
];

const STANDARD_ORDERS = [
  "Aspirin load 325 mg PO/PR (if no hemorrhage, no tPA)",
  "Heparin drip (if cardioembolic — per neuro guidance)",
  "Statin therapy initiated (Atorvastatin 40–80 mg)",
  "Strict NPO — dysphagia screen before any PO",
  "Head of bed at 0–30° for first 24h",
  "Continuous telemetry ≥24h",
  "Blood glucose target 140–180 mg/dL; avoid hypoglycemia",
  "Foley catheter PRN — do not restrict fluids",
  "DVT prophylaxis (mechanical — compression stockings)",
  "PT/OT/SLP consult — early mobilization",
  "Repeat NIHSS in 24h and at discharge",
];

const NEURO_RECS = [
  "Proceed with IV tPA per protocol",
  "Do NOT give tPA — exclusion criteria present",
  "Activate interventional / IR for mechanical thrombectomy",
  "Admit to Stroke / Neuro ICU",
  "Admit to Step-down with continuous monitoring",
  "MRI brain with DWI — STAT",
  "CTA head and neck — STAT",
  "Heparin protocol — cardioembolic etiology",
  "Aspirin + Clopidogrel DAPT × 21 days",
  "Hold antihypertensives — permissive hypertension",
  "Strict blood pressure control SBP <180",
  "Speech-language pathology evaluation — dysphagia screen",
  "Neurology to follow twice daily",
  "Hypercoagulable workup ordered",
  "Cardiology / Echo consult ordered",
];

const CONSULT_TIMES = [
  {label:"Time Consult Placed",color:"#f5c842",type:"time"},
  {label:"Time Neuro Arrived",color:"#00e5c0",type:"time"},
  {label:"Time tPA Decision",color:"#ff9f43",type:"time"},
  {label:"Time tPA Administered",color:"#ff6b6b",type:"time"},
  {label:"CT Time (minutes)",color:"#3b9eff",type:"number"},
  {label:"Door-to-Needle (min)",color:"#b06aff",type:"number"},
];

const DISPOSITION_OPTIONS = [
  "Stroke Unit ICU","Neuro Step-Down","General Floor","Transfer to Stroke Center","Discharge (TIA protocol)",
];

const PED_WORKUP = [
  "Hemoglobin electrophoresis (sickle cell)","Echocardiogram (cardiac source) — higher yield than adults",
  "Hypercoagulable panel (mandatory in pediatrics)","MRA > CTA (avoid radiation when possible)",
  "Conventional angiography if vasculitis/arteriopathy suspected","Genetic/metabolic workup (MELAS, Fabry, homocysteine)",
  "Inflammatory markers (ESR, CRP, ANA, ANCA)","Lumbar puncture if CNS infection suspected",
];

const PED_ETIOLOGIES = [
  "🫀 Congenital heart disease / CHD repair (most common)",
  "🩸 Sickle cell disease (10–25% lifetime stroke risk)",
  "🧬 Prothrombotic conditions (Factor V Leiden, Protein C/S deficiency)",
  "🦠 Meningitis / encephalitis (infection-related)",
  "🩺 Arteriopathy: TCA, moyamoya, CSVT",
  "🤕 Arterial dissection (trauma, neck manipulation)",
  "💊 Oral contraceptives (adolescent females)",
  "🧪 Metabolic: MELAS, homocystinuria, Fabry disease",
  "🫁 Paradoxical embolism through PFO/ASD",
];

const PED_TREATMENT = [
  {title:"Acute ischemic (SCD)",text:"Exchange transfusion to HbS <30%; IV hydration; O2; avoid hypotension"},
  {title:"Acute ischemic (non-SCD, ≥2y)",text:"Aspirin 3–5 mg/kg/day (max 100 mg). tPA not routinely recommended <18y; case-by-case with neurology. Mechanical thrombectomy — no RCT data."},
  {title:"CSVT",text:"LMWH or UFH; transition to warfarin/DOAC. Treatment even with hemorrhagic infarct (AHA Class IIa)."},
  {title:"Arterial dissection",text:"Antiplatelet or anticoagulation (6 months); aspirin preferred in children"},
  {title:"Neonatal stroke",text:"Supportive care; antiseizure meds if seizures; anticoagulation if cardiac source or thrombophilia"},
  {title:"Secondary prevention",text:"Aspirin 3–5 mg/kg/day (max 100 mg); address underlying etiology; SCD → chronic transfusion/hydroxyurea"},
];

const SERIAL_SLOTS = ["Arrival / Triage","Post-CT (30 min)","Pre-tPA","1h post-tPA","24h NIHSS","Discharge NIHSS"];

// Helpers
const nowTime = () => { const d=new Date(); return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; };

const scoreColor = (score, maxScore) => {
  if (score === "UN") return T.txt2;
  if (score === null || score === undefined) return T.txt3;
  if (score === 0) return T.teal;
  const r = score / maxScore;
  if (r <= 0.25) return "#44d7a8";
  if (r <= 0.5) return T.gold;
  if (r <= 0.75) return T.orange;
  return T.coral;
};

const getSeverity = (total) => SEVERITY_BANDS.find(b => total >= b.min && total <= b.max) || SEVERITY_BANDS[SEVERITY_BANDS.length - 1];

const cardBorder = (score, maxScore) => {
  if (score === null || score === undefined) return T.border;
  if (score === "UN") return T.txt3;
  if (score === 0) return T.teal;
  if (score <= maxScore / 2) return T.gold;
  return T.coral;
};

const INPUT_STYLE = {background:T.card,border:`1px solid ${T.border}`,borderRadius:6,padding:'6px 10px',color:T.txt,fontFamily:"'JetBrains Mono',monospace",fontSize:12,outline:'none',width:'100%'};

const CSS = `
*,*::before,*::after{box-sizing:border-box}
.sa-wrap{color:${T.txt};font-family:'DM Sans',sans-serif;font-size:14px}
.sa-tabs{display:flex;gap:4px;margin-bottom:20px;padding-bottom:12px;border-bottom:1px solid ${T.border}}
.sa-tab{padding:8px 18px;border-radius:8px;cursor:pointer;border:1px solid ${T.border};font-size:13px;font-weight:600;transition:all .15s;white-space:nowrap;background:${T.panel};color:${T.txt2}}
.sa-tab:hover{border-color:${T.borderHi};color:${T.txt}}
.sa-tab.on{background:rgba(59,158,255,.12);border-color:rgba(59,158,255,.4);color:${T.blue}}
.sa-card{background:${T.panel};border:1px solid ${T.border};border-radius:12px;padding:16px;margin-bottom:12px}
.sa-sec-title{font-family:'Playfair Display',serif;font-size:15px;font-weight:700;color:${T.txt};margin-bottom:12px}
.sa-label{font-size:10px;color:${T.txt4};text-transform:uppercase;letter-spacing:.06em;font-weight:600;margin-bottom:4px}
.sa-input{background:${T.card};border:1px solid ${T.border};border-radius:6px;padding:7px 10px;color:${T.txt};font-family:'DM Sans',sans-serif;font-size:13px;outline:none;transition:border-color .15s;width:100%}
.sa-input:focus{border-color:${T.blue}}
.sa-textarea{background:${T.card};border:1px solid ${T.border};border-radius:8px;padding:10px 12px;color:${T.txt};font-size:13px;resize:vertical;min-height:80px;outline:none;width:100%;font-family:'DM Sans',sans-serif}
.sa-textarea:focus{border-color:${T.blue}}
.sa-now{background:${T.up};border:1px solid ${T.border};border-radius:5px;padding:3px 8px;font-size:10px;color:${T.txt2};cursor:pointer;white-space:nowrap;font-weight:600;font-family:'DM Sans',sans-serif}
.sa-now:hover{border-color:${T.borderHi};color:${T.txt}}
.sa-chk{display:flex;align-items:flex-start;gap:8px;padding:7px 10px;border-radius:6px;cursor:pointer;transition:all .12s;border:1px solid transparent}
.sa-chk:hover{background:${T.up};border-color:${T.border}}
.sa-chk.on{background:rgba(0,229,192,.07);border-color:rgba(0,229,192,.25)}
.sa-chk-box{width:16px;height:16px;border-radius:4px;border:1.5px solid ${T.border};flex-shrink:0;margin-top:1px;display:flex;align-items:center;justify-content:center;transition:all .15s}
.sa-chk.on .sa-chk-box{background:${T.teal};border-color:${T.teal}}
.sa-chk-exc{display:flex;align-items:flex-start;gap:8px;padding:7px 10px;border-radius:6px;cursor:pointer;transition:all .12s;border:1px solid transparent}
.sa-chk-exc:hover{background:rgba(255,107,107,.05);border-color:rgba(255,107,107,.15)}
.sa-chk-exc.on{background:rgba(255,107,107,.08);border-color:rgba(255,107,107,.3)}
.sa-chk-exc.on .sa-chk-box{background:${T.coral};border-color:${T.coral}}
.sa-chk-exc.on .sa-chk-label{text-decoration:line-through;color:${T.txt3}}
.sa-scroll::-webkit-scrollbar{width:4px}
.sa-scroll::-webkit-scrollbar-thumb{background:${T.border};border-radius:2px}
.sa-prog{height:6px;background:${T.up};border-radius:3px;overflow:hidden}
.sa-prog-fill{height:100%;border-radius:3px;transition:width .3s ease}
.nihss-pill{display:inline-flex;align-items:center;gap:3px;padding:2px 7px;border-radius:12px;font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:700;background:${T.up};border:1px solid ${T.border};white-space:nowrap}
.item-card{border-radius:10px;padding:14px;margin-bottom:8px;transition:border-color .2s;background:${T.card}}
.opt-row{display:flex;align-items:flex-start;gap:10px;padding:8px 10px;border-radius:7px;cursor:pointer;border:1px solid transparent;transition:all .15s;margin-bottom:3px}
.opt-row:hover{background:${T.up};border-color:${T.border}}
.opt-row.sel{border-color:var(--opt-color)!important;background:rgba(var(--opt-rgb),.1)}
.opt-score{font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:700;width:26px;flex-shrink:0;text-align:center}
.opt-lbl{font-weight:600;font-size:13px;color:${T.txt};margin-bottom:1px}
.opt-desc{font-size:11px;color:${T.txt3}}
.stim-box{background:rgba(59,158,255,.06);border:1px solid rgba(59,158,255,.2);border-radius:7px;padding:10px 12px;margin:8px 0}
.word-box{background:rgba(245,200,66,.05);border:1px solid rgba(245,200,66,.2);border-radius:7px;padding:10px 12px;margin:8px 0;display:flex;flex-wrap:wrap;gap:8px}
.tl-line{position:relative;padding-left:22px}
.tl-dot{position:absolute;left:0;top:4px;width:12px;height:12px;border-radius:50%;flex-shrink:0}
.tl-connector{position:absolute;left:5px;top:18px;bottom:-12px;width:2px}
.badge{display:inline-block;padding:2px 8px;border-radius:20px;font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:700;letter-spacing:.4px}
.dot-nav{width:10px;height:10px;border-radius:50%;cursor:pointer;transition:all .2s;flex-shrink:0}
.acc-item{border:1px solid ${T.border};border-radius:8px;margin-bottom:6px;overflow:hidden}
.acc-hdr{padding:10px 14px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;font-weight:600;font-size:13px;transition:background .15s}
.acc-hdr:hover{background:${T.up}}
.acc-body{padding:10px 14px;font-size:12px;color:${T.txt2};line-height:1.7;border-top:1px solid ${T.border};background:${T.card}}
.disp-pill{padding:7px 14px;border-radius:20px;cursor:pointer;font-size:12px;font-weight:600;border:1px solid ${T.border};background:${T.up};color:${T.txt2};transition:all .15s;white-space:nowrap}
.disp-pill:hover{border-color:${T.borderHi};color:${T.txt}}
.disp-pill.sel{background:rgba(0,229,192,.1);border-color:rgba(0,229,192,.5);color:${T.teal}}
@media(max-width:900px){.sa-2col{grid-template-columns:1fr!important}}
`;

const CookieTheftSVG = () => (
  <img
    src="https://media.base44.com/images/public/69876015478a19e360c5e3ea/7b4c45838_image.png"
    alt="Cookie Theft Picture"
    style={{width:'100%',borderRadius:8,border:`1px solid ${T.border}`}}
  />
);

// NIHSS Item Card
const NIHSSCard = React.memo(({ item, score, time, onScore, onTime, nowFn }) => {
  const border = cardBorder(score, item.maxScore);
  const glowColor = score === 0 ? T.teal : score !== null && score !== undefined ? (score <= item.maxScore/2 ? T.gold : T.coral) : null;
  return (
    <div className="item-card" style={{border:`1.5px solid ${border}`,boxShadow:glowColor&&score!==null?`0 0 0 1px ${glowColor}22`:'none'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.txt3,background:T.up,border:`1px solid ${T.border}`,borderRadius:4,padding:'1px 6px'}}>{item.num}</span>
          <span style={{fontWeight:700,fontSize:14,color:T.txt}}>{item.label}</span>
        </div>
        {(score !== null && score !== undefined) && (
          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:16,fontWeight:800,color:scoreColor(score,item.maxScore),background:`${scoreColor(score,item.maxScore)}18`,border:`1px solid ${scoreColor(score,item.maxScore)}44`,borderRadius:6,padding:'2px 10px'}}>{score}</span>
        )}
      </div>
      <div style={{fontSize:11,color:T.txt3,fontStyle:'italic',marginBottom:8,lineHeight:1.5}}>{item.instructions}</div>
      {item.stimulus && (
        <div className="stim-box">
          {item.stimulus.map((s,i)=>(
            <div key={i} style={{fontSize:12,color:T.blue,marginBottom:2}}><span style={{color:T.txt3,marginRight:6}}>{i+1}.</span>"{s}"</div>
          ))}
        </div>
      )}
      {item.wordList && (
        <div className="word-box">
          {item.wordList.map((w,i)=>(
            <span key={i} style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:700,color:T.gold,background:T.up,borderRadius:4,padding:'2px 8px'}}>{w}</span>
          ))}
        </div>
      )}
      <div style={{marginBottom:8}}>
        {item.options.map(opt=>{
          const isSel = score === opt.score;
          const sc = scoreColor(opt.score, item.maxScore);
          const hexToRgb = (h) => { const r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16); return `${r},${g},${b}`; };
          return (
            <div key={opt.score}
              className={`opt-row${isSel?' sel':''}`}
              style={isSel?{'--opt-color':sc,'--opt-rgb':sc.startsWith('#')?hexToRgb(sc):'59,158,255'}:{}}
              onClick={()=>onScore(isSel?null:opt.score)}
            >
              <span className="opt-score" style={{color:isSel?sc:T.txt3}}>{opt.score}</span>
              <div>
                <div className="opt-lbl" style={{color:isSel?sc:T.txt}}>{opt.label}</div>
                <div className="opt-desc">{opt.description}</div>
              </div>
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

export default function StrokeAssessment() {
  const navigate = useNavigate();
  const [patMode,setPatMode] = useState('adult');
  const [activeTab,setActiveTab] = useState('nihss');
  const [scores,setScores] = useState({});
  const [times,setTimes] = useState({});
  const [lkw,setLkw] = useState('');
  const [alertTime,setAlertTime] = useState('');
  const [nihssMode,setNihssMode] = useState('all'); // 'all' | 'rapid'
  const [rapidIdx,setRapidIdx] = useState(0);
  const [workupChecked,setWorkupChecked] = useState({});
  const [workupTimes,setWorkupTimes] = useState({});
  const [tpaInc,setTpaInc] = useState({});
  const [tpaExc,setTpaExc] = useState({});
  const [sbp,setSbp] = useState('');
  const [dbp,setDbp] = useState('');
  const [ordersChecked,setOrdersChecked] = useState({});
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
  const [serialNihss,setSerialNihss] = useState(SERIAL_SLOTS.map(()=>({time:'',score:''})));
  const [secPrevOpen,setSecPrevOpen] = useState({});
  const [pedWorkup,setPedWorkup] = useState({});
  // Clinical Calculators
  const [gcs,setGcs] = useState({eye:null,verbal:null,motor:null});
  const [aspects,setAspects] = useState({});
  const [tpaWeight,setTpaWeight] = useState('');
  const [tpaWeightUnit,setTpaWeightUnit] = useState('kg');

  const nihssTotal = useMemo(()=>{
    return NIHSS_ITEMS.reduce((sum,item)=>{
      const s=scores[item.id];
      return sum+(typeof s==='number'?s:0);
    },0);
  },[scores]);

  const nihssComplete = useMemo(()=>NIHSS_ITEMS.filter(it=>scores[it.id]!==undefined&&scores[it.id]!==null).length,[scores]);
  const severity = useMemo(()=>getSeverity(nihssTotal),[nihssTotal]);

  const handleScore = useCallback((itemId, score) => {
    setScores(p=>({...p,[itemId]:score}));
    if (score !== null && !times[itemId]) setTimes(p=>({...p,[itemId]:nowTime()}));
  },[times]);

  const handleTime = useCallback((itemId, val) => setTimes(p=>({...p,[itemId]:val})),[]);

  const autoAdvance = useRef(null);
  const handleRapidScore = useCallback((itemId, score) => {
    handleScore(itemId, score);
    if (score !== null && rapidIdx < NIHSS_ITEMS.length - 1) {
      clearTimeout(autoAdvance.current);
      autoAdvance.current = setTimeout(()=>setRapidIdx(i=>Math.min(i+1,NIHSS_ITEMS.length-1)),380);
    }
  },[handleScore, rapidIdx]);

  const tpaEligible = TPA_INCLUSIONS.every((_,i)=>tpaInc[i]) && !TPA_EXCLUSIONS.some((_,i)=>tpaExc[i]);
  const bpHigh = parseInt(sbp)>185 || parseInt(dbp)>110;
  const totalWorkup = WORKUP_STEPS.reduce((a,s)=>a+s.items.length,0);
  const doneWorkup = Object.values(workupChecked).filter(Boolean).length;

  const pct = nihssComplete/NIHSS_ITEMS.length*100;

  return (
    <>
      <style>{CSS}</style>
      <div className="sa-wrap">

        {/* PAGE HEADER */}
        <div style={{marginBottom:20}}>
          <button onClick={()=>navigate('/hub')} style={{marginBottom:12,background:'rgba(8,22,40,0.8)',border:'1px solid rgba(42,79,122,0.6)',borderRadius:10,padding:'7px 16px',color:'#8aaccc',fontSize:12,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",backdropFilter:'blur(12px)',display:'inline-flex',alignItems:'center',gap:6,transition:'all .2s'}} onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(59,158,255,0.5)';e.currentTarget.style.color='#3b9eff';}} onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(42,79,122,0.6)';e.currentTarget.style.color='#8aaccc';}}>← Back to Hub</button>
          <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:12,flexWrap:'wrap'}}>
            <div style={{width:44,height:44,borderRadius:12,background:`linear-gradient(135deg,${T.blue},${T.purple})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0,boxShadow:`0 4px 14px rgba(59,158,255,0.25)`}}>🧠</div>
            <div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:T.txt}}>Acute Stroke Assessment</div>
              <div style={{fontSize:11,color:T.txt3}}>NIH Stroke Scale · AHA/ASA 2019 Guidelines · <span style={{color:T.teal,fontWeight:600}}>{patMode==='adult'?'Adult Mode':'Pediatric Mode'}</span></div>
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
            <button onClick={()=>setPatMode('adult')} style={{padding:'7px 16px',borderRadius:8,border:`1px solid ${patMode==='adult'?T.blue:T.border}`,background:patMode==='adult'?`rgba(59,158,255,.15)`:T.up,color:patMode==='adult'?T.blue:T.txt2,fontWeight:700,fontSize:12,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>👤 Adult</button>
            <button onClick={()=>setPatMode('ped')} style={{padding:'7px 16px',borderRadius:8,border:`1px solid ${patMode==='ped'?T.purple:T.border}`,background:patMode==='ped'?`rgba(176,106,255,.15)`:T.up,color:patMode==='ped'?T.purple:T.txt2,fontWeight:700,fontSize:12,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>🧒 Pediatric</button>
            <div style={{display:'flex',alignItems:'center',gap:6,background:T.card,border:`1px solid ${T.border}`,borderRadius:20,padding:'5px 12px'}}>
              <span style={{fontSize:10,color:T.txt3}}>LKW</span>
              <input type="time" value={lkw} onChange={e=>setLkw(e.target.value)} style={{background:'transparent',border:'none',outline:'none',color:T.gold,fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:700}}/>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:6,background:T.card,border:`1px solid ${T.border}`,borderRadius:20,padding:'5px 12px'}}>
              <span style={{fontSize:10,color:T.txt3}}>Alert</span>
              <input type="time" value={alertTime} onChange={e=>setAlertTime(e.target.value)} style={{background:'transparent',border:'none',outline:'none',color:T.coral,fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:700}}/>
            </div>
          </div>
          {patMode==='ped' && (
            <div style={{marginTop:12,padding:'10px 16px',background:'rgba(176,106,255,.08)',border:`1px solid rgba(176,106,255,.3)`,borderRadius:8,fontSize:12,color:T.purple}}>
              ⚠️ <strong>Pediatric Mode:</strong> tPA is NOT FDA-approved for patients &lt;18 years. All treatment decisions require pediatric neurology consultation. Dosing and protocols differ from adults.
            </div>
          )}
        </div>

        {/* TABS */}
        <div className="sa-tabs" style={{overflowX:'auto'}}>
          {[['nihss','⚡ NIHSS Scale'],['workup','🔬 Workup'],['treatment','💊 Treatment'],['consult','🧠 Neuro Consult'],['calc','🧮 Calculators']].map(([id,lbl])=>(
            <button key={id} className={`sa-tab${activeTab===id?' on':''}`} onClick={()=>setActiveTab(id)}>{lbl}</button>
          ))}
        </div>

        {/* ── TAB 1: NIHSS ── */}
        {activeTab==='nihss' && (
          <div>
            {/* Score Summary Bar */}
            <div style={{background:T.panel,border:`1px solid ${T.border}`,borderRadius:12,padding:'16px 20px',marginBottom:16}}>
              <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:12,flexWrap:'wrap'}}>
                <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:52,fontWeight:800,color:severity.color,lineHeight:1,textShadow:`0 0 24px ${severity.color}44`}}>{nihssTotal}</div>
                <div>
                  <div style={{display:'inline-block',background:severity.bg,border:`1px solid ${severity.color}44`,borderRadius:20,padding:'4px 14px',fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:700,color:severity.color,marginBottom:6}}>{severity.label}</div>
                  <div style={{fontSize:11,color:T.txt3}}>{nihssComplete}/15 items · {Math.round(pct)}% complete</div>
                </div>
              </div>
              <div style={{display:'flex',flexWrap:'wrap',gap:4,marginBottom:10}}>
                {NIHSS_ITEMS.map(item=>{
                  const s=scores[item.id];
                  const c=scoreColor(s,item.maxScore);
                  return (
                    <span key={item.id} className="nihss-pill" style={{borderColor:(s!==null&&s!==undefined)?c:T.border,color:(s!==null&&s!==undefined)?c:T.txt4}}>
                      {item.num} {s!==null&&s!==undefined?s:'—'}
                    </span>
                  );
                })}
              </div>
              <div className="sa-prog"><div className="sa-prog-fill" style={{width:`${pct}%`,background:severity.color}}/></div>
            </div>

            {/* Mode Toggle */}
            <div style={{display:'flex',gap:6,marginBottom:16}}>
              {[['all','📋 All Items'],['rapid','⚡ Rapid Entry']].map(([id,lbl])=>(
                <button key={id} onClick={()=>setNihssMode(id)} style={{padding:'7px 16px',borderRadius:8,border:`1px solid ${nihssMode===id?T.blue:T.border}`,background:nihssMode===id?`rgba(59,158,255,.12)`:T.up,color:nihssMode===id?T.blue:T.txt2,fontWeight:700,fontSize:12,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>{lbl}</button>
              ))}
            </div>

            {nihssMode==='all' && (
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}} className="sa-2col">
                {NIHSS_ITEMS.map(item=>(
                  <NIHSSCard key={item.id} item={item} score={scores[item.id]??null} time={times[item.id]||''} onScore={s=>handleScore(item.id,s)} onTime={v=>handleTime(item.id,v)} nowFn={nowTime}/>
                ))}
              </div>
            )}

            {nihssMode==='rapid' && (
              <div>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12,flexWrap:'wrap'}}>
                  <span style={{fontSize:12,color:T.txt2}}>Item {rapidIdx+1} of {NIHSS_ITEMS.length}</span>
                  <div style={{flex:1,minWidth:200}}><div className="sa-prog"><div className="sa-prog-fill" style={{width:`${(rapidIdx+1)/NIHSS_ITEMS.length*100}%`,background:T.blue}}/></div></div>
                  <div style={{display:'flex',gap:4}}>
                    {NIHSS_ITEMS.map((item,i)=>{
                      const s=scores[item.id];
                      const c=i===rapidIdx?T.blue:(s!==null&&s!==undefined?scoreColor(s,item.maxScore):T.txt4);
                      return <div key={item.id} className="dot-nav" style={{background:c,transform:i===rapidIdx?'scale(1.3)':'scale(1)',border:i===rapidIdx?`2px solid ${T.blue}`:'2px solid transparent'}} onClick={()=>setRapidIdx(i)} title={item.label}/>;
                    })}
                  </div>
                </div>
                <NIHSSCard item={NIHSS_ITEMS[rapidIdx]} score={scores[NIHSS_ITEMS[rapidIdx].id]??null} time={times[NIHSS_ITEMS[rapidIdx].id]||''} onScore={s=>handleRapidScore(NIHSS_ITEMS[rapidIdx].id,s)} onTime={v=>handleTime(NIHSS_ITEMS[rapidIdx].id,v)} nowFn={nowTime}/>
                <div style={{display:'flex',gap:8,marginTop:8}}>
                  <button onClick={()=>setRapidIdx(i=>Math.max(0,i-1))} disabled={rapidIdx===0} style={{flex:1,padding:'9px',borderRadius:8,border:`1px solid ${T.border}`,background:T.up,color:T.txt2,fontWeight:700,cursor:'pointer',fontSize:12,fontFamily:"'DM Sans',sans-serif",opacity:rapidIdx===0?.4:1}}>← Prev</button>
                  <button onClick={()=>setRapidIdx(i=>Math.min(NIHSS_ITEMS.length-1,i+1))} disabled={rapidIdx===NIHSS_ITEMS.length-1} style={{flex:1,padding:'9px',borderRadius:8,border:`1px solid ${T.border}`,background:T.up,color:T.txt2,fontWeight:700,cursor:'pointer',fontSize:12,fontFamily:"'DM Sans',sans-serif",opacity:rapidIdx===NIHSS_ITEMS.length-1?.4:1}}>Next →</button>
                </div>
              </div>
            )}

            {/* Stimulus Materials */}
            <div style={{marginTop:20}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}} className="sa-2col">
                <div className="sa-card">
                  <div className="sa-sec-title">🖼 Cookie Theft Picture (Item 9)</div>
                  <CookieTheftSVG />
                  <div style={{marginTop:8,fontStyle:'italic',fontSize:12,color:T.txt3,textAlign:'center'}}>"Tell me everything you see going on in this picture."</div>
                </div>
                <div>
                  <div className="sa-card" style={{marginBottom:12}}>
                    <div style={{fontFamily:"'Playfair Display',serif",fontSize:13,fontWeight:700,color:T.txt,marginBottom:8}}>📝 Reading Sentences (Item 9)</div>
                    <div style={{background:'rgba(245,230,180,.06)',border:'1px solid rgba(245,200,66,.15)',borderRadius:8,padding:'10px 14px'}}>
                      {READING_SENTENCES.map((s,i)=>(
                        <div key={i} style={{fontFamily:"'Playfair Display',serif",fontSize:13,color:T.txt2,padding:'4px 0',borderBottom:i<READING_SENTENCES.length-1?`1px solid ${T.border}`:'none'}}>{s}</div>
                      ))}
                    </div>
                  </div>
                  <div className="sa-card">
                    <div style={{fontFamily:"'Playfair Display',serif",fontSize:13,fontWeight:700,color:T.txt,marginBottom:8}}>🗣 Dysarthria Words (Item 10)</div>
                    <div style={{background:'rgba(245,230,180,.06)',border:'1px solid rgba(245,200,66,.15)',borderRadius:8,padding:'10px 12px',display:'flex',flexWrap:'wrap',gap:8}}>
                      {["MAMA","TIP-TOP","FIFTY-FIFTY","THANKS","HUCKLEBERRY","BASEBALL PLAYER","CATERPILLAR"].map(w=>(
                        <span key={w} style={{fontFamily:"'JetBrains Mono',monospace",fontSize:14,fontWeight:800,color:T.gold,background:T.up,borderRadius:5,padding:'4px 10px'}}>{w}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Serial NIHSS */}
            <div className="sa-card" style={{marginTop:14}}>
              <div className="sa-sec-title">📊 Serial NIHSS Tracking</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}} className="sa-2col">
                {SERIAL_SLOTS.map((slot,i)=>(
                  <div key={i} style={{background:T.up,border:`1px solid ${T.border}`,borderRadius:8,padding:'10px 12px'}}>
                    <div style={{fontSize:10,color:T.txt3,marginBottom:6,fontWeight:600}}>{slot}</div>
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

        {/* ── TAB 2: WORKUP ── */}
        {activeTab==='workup' && (
          <div>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16,padding:'8px 14px',background:T.panel,border:`1px solid ${T.border}`,borderRadius:8}}>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:T.teal,fontWeight:700}}>✅ {doneWorkup} / {totalWorkup} completed</span>
              <div style={{flex:1}}><div className="sa-prog"><div className="sa-prog-fill" style={{width:`${doneWorkup/totalWorkup*100}%`,background:T.teal}}/></div></div>
            </div>
            {WORKUP_STEPS.map((step,si)=>{
              const isLast=si===WORKUP_STEPS.length-1;
              return (
                <div key={si} style={{position:'relative',marginBottom:12}}>
                  {!isLast && <div style={{position:'absolute',left:5,top:30,bottom:-12,width:2,background:`linear-gradient(${step.color},${WORKUP_STEPS[si+1].color})`}}/>}
                  <div style={{position:'relative',paddingLeft:26}}>
                    <div style={{position:'absolute',left:0,top:6,width:12,height:12,borderRadius:'50%',background:step.color,boxShadow:`0 0 8px ${step.color}66`}}/>
                    <div style={{background:T.panel,border:`1px solid ${T.border}`,borderRadius:10,padding:'12px 14px'}}>
                      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10,flexWrap:'wrap'}}>
                        <span style={{fontSize:18}}>{step.icon}</span>
                        <span style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,color:T.txt}}>{step.title}</span>
                        <span className="badge" style={{background:`${step.color}1a`,border:`1px solid ${step.color}44`,color:step.color}}>⏱ {step.phase}</span>
                      </div>
                      {step.isImaging && (
                        <div style={{padding:'7px 12px',background:'rgba(59,158,255,.07)',border:'1px solid rgba(59,158,255,.2)',borderRadius:6,fontSize:11,color:T.blue,marginBottom:10}}>
                          📸 Imaging Protocol — pre-notify radiology. STAT reads required.
                        </div>
                      )}
                      {step.items.map((item,ii)=>{
                        const k=`${si}-${ii}`;
                        const ck=workupChecked[k];
                        return (
                          <div key={ii}>
                            <div className={`sa-chk${ck?' on':''}`} onClick={()=>setWorkupChecked(p=>({...p,[k]:!p[k]}))}>
                              <div className="sa-chk-box">{ck&&<span style={{color:'#050f1e',fontSize:10,fontWeight:900}}>✓</span>}</div>
                              <span style={{fontSize:12,color:ck?T.teal:T.txt2,flex:1}}>{item}</span>
                              {ck && (
                                <div style={{display:'flex',alignItems:'center',gap:4,marginLeft:8,flexShrink:0}} onClick={e=>e.stopPropagation()}>
                                  <input type="time" value={workupTimes[k]||''} onChange={e=>setWorkupTimes(p=>({...p,[k]:e.target.value}))} style={{...INPUT_STYLE,width:100,padding:'3px 6px',fontSize:10}}/>
                                  <button className="sa-now" style={{padding:'2px 6px',fontSize:9}} onClick={()=>setWorkupTimes(p=>({...p,[k]:nowTime()}))}>Now</button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}

            {patMode==='ped' && (
              <div style={{marginTop:20}}>
                <div style={{background:'rgba(176,106,255,.07)',border:'1px solid rgba(176,106,255,.3)',borderRadius:12,padding:'16px'}}>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,color:T.purple,marginBottom:12}}>🧒 Pediatric Additional Workup</div>
                  {PED_WORKUP.map((item,i)=>(
                    <div key={i} className={`sa-chk${pedWorkup[i]?' on':''}`} onClick={()=>setPedWorkup(p=>({...p,[i]:!p[i]}))}>
                      <div className="sa-chk-box">{pedWorkup[i]&&<span style={{color:'#050f1e',fontSize:10,fontWeight:900}}>✓</span>}</div>
                      <span style={{fontSize:12,color:pedWorkup[i]?T.teal:T.txt2}}>{item}</span>
                    </div>
                  ))}
                  <div style={{marginTop:16}}>
                    <div style={{fontFamily:"'Playfair Display',serif",fontSize:13,fontWeight:700,color:T.purple,marginBottom:8}}>Pediatric Etiologies</div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}} className="sa-2col">
                      {PED_ETIOLOGIES.map((e,i)=>(
                        <div key={i} style={{background:`rgba(176,106,255,.06)`,border:`1px solid rgba(176,106,255,.15)`,borderRadius:6,padding:'6px 10px',fontSize:12,color:T.txt2}}>{e}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: TREATMENT ── */}
        {activeTab==='treatment' && (
          <div>
            {patMode==='ped' ? (
              <div>
                <div style={{padding:'10px 16px',background:'rgba(255,107,107,.08)',border:`1px solid rgba(255,107,107,.3)`,borderRadius:8,marginBottom:16,fontSize:12,color:T.coral}}>
                  ⚠️ <strong>tPA (alteplase) is NOT FDA-approved for patients under 18 years.</strong> Use is case-by-case with pediatric neurology consultation only. Standard adult stroke protocols do not apply.
                </div>
                {PED_TREATMENT.map((item,i)=>(
                  <div key={i} className="sa-card" style={{marginBottom:10}}>
                    <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,color:T.purple,marginBottom:6}}>{item.title}</div>
                    <div style={{fontSize:13,color:T.txt2,lineHeight:1.7}}>{item.text}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,alignItems:'start'}} className="sa-2col">
                {/* Left */}
                <div>
                  {/* tPA */}
                  <div className="sa-card">
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
                      <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,color:T.txt}}>💊 IV Alteplase (tPA) Eligibility</div>
                      <span style={{padding:'3px 12px',borderRadius:20,fontSize:10,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",background:tpaEligible?'rgba(0,229,192,.15)':'rgba(138,172,204,.1)',border:`1px solid ${tpaEligible?'rgba(0,229,192,.4)':'rgba(138,172,204,.3)'}`,color:tpaEligible?T.teal:T.txt3}}>
                        {tpaEligible?'✓ ELIGIBLE':'Review criteria'}
                      </span>
                    </div>
                    {nihssComplete>0 && (
                      <div style={{padding:'6px 12px',background:T.up,borderRadius:6,marginBottom:10,display:'flex',alignItems:'center',gap:8}}>
                        <span style={{fontSize:11,color:T.txt3}}>Current NIHSS:</span>
                        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:16,fontWeight:800,color:severity.color}}>{nihssTotal}</span>
                        {nihssTotal>25 && <span style={{fontSize:10,color:T.coral,background:'rgba(255,107,107,.1)',border:'1px solid rgba(255,107,107,.3)',borderRadius:4,padding:'1px 6px'}}>⚠ >25 — relative CI</span>}
                      </div>
                    )}
                    <div style={{fontSize:11,color:T.txt3,marginBottom:6,textTransform:'uppercase',letterSpacing:'0.06em',fontWeight:600}}>Inclusions (all required)</div>
                    {TPA_INCLUSIONS.map((inc,i)=>(
                      <div key={i} className={`sa-chk${tpaInc[i]?' on':''}`} onClick={()=>setTpaInc(p=>({...p,[i]:!p[i]}))}>
                        <div className="sa-chk-box">{tpaInc[i]&&<span style={{color:'#050f1e',fontSize:10,fontWeight:900}}>✓</span>}</div>
                        <span style={{fontSize:12,color:tpaInc[i]?T.teal:T.txt2}}>{inc}</span>
                      </div>
                    ))}
                    <div style={{fontSize:11,color:T.coral,marginTop:12,marginBottom:6,textTransform:'uppercase',letterSpacing:'0.06em',fontWeight:600}}>Exclusions (any = contraindicated)</div>
                    {TPA_EXCLUSIONS.map((exc,i)=>(
                      <div key={i} className={`sa-chk-exc${tpaExc[i]?' on':''}`} onClick={()=>setTpaExc(p=>({...p,[i]:!p[i]}))}>
                        <div className="sa-chk-box">{tpaExc[i]&&<span style={{color:'white',fontSize:10,fontWeight:900}}>✕</span>}</div>
                        <span className="sa-chk-label" style={{fontSize:12,color:tpaExc[i]?T.txt3:T.txt2}}>{exc}</span>
                      </div>
                    ))}
                    <div style={{fontSize:11,color:T.orange,marginTop:12,marginBottom:6,textTransform:'uppercase',letterSpacing:'0.06em',fontWeight:600}}>Relative CI (3–4.5h window)</div>
                    {TPA_RELATIVE.map((r,i)=>(
                      <div key={i} style={{display:'flex',alignItems:'flex-start',gap:8,padding:'5px 10px',fontSize:12,color:T.txt3}}>
                        <span style={{color:T.orange,flexShrink:0}}>⚠</span><span>{r}</span>
                      </div>
                    ))}
                    <div style={{marginTop:12,padding:'10px 14px',background:'rgba(0,229,192,.07)',border:'1px solid rgba(0,229,192,.25)',borderRadius:8}}>
                      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.teal,fontWeight:700,marginBottom:4}}>ALTEPLASE DOSING</div>
                      <div style={{fontSize:12,color:T.txt2,lineHeight:1.6}}>0.9 mg/kg IV (max 90 mg). 10% bolus over 1 min → 90% over 60 min. Hold anticoagulants/antiplatelets 24h post.</div>
                    </div>
                  </div>
                  {/* Thrombectomy */}
                  <div className="sa-card">
                    <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,color:T.blue,marginBottom:12}}>🔧 Mechanical Thrombectomy</div>
                    <div style={{fontSize:11,color:T.txt3,marginBottom:8}}>Class I, LOE A — AHA 2018</div>
                    {[["NIHSS","≥6 (or any if proven LVO)"],["Vessel","ICA or M1/M2 MCA, basilar artery"],["Time Window","≤24h from LKW (DAWN/DEFUSE-3)"],["Pre-stroke mRS","0–1 (functionally independent)"],["ASPECTS","≥6 on CT or CT perfusion mismatch"],["Age","No absolute age limit per guidelines"]].map(([k,v])=>(
                      <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'6px 10px',background:T.up,border:`1px solid ${T.border}`,borderRadius:6,marginBottom:4,gap:8}}>
                        <span style={{fontSize:11,color:T.txt3}}>{k}</span>
                        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:T.blue,fontWeight:600,textAlign:'right'}}>{v}</span>
                      </div>
                    ))}
                    <div style={{marginTop:10,padding:'8px 12px',background:'rgba(59,158,255,.06)',border:'1px solid rgba(59,158,255,.15)',borderRadius:8,fontSize:11,color:T.txt2,lineHeight:1.6}}>
                      MT should not be delayed for IV tPA response. Concurrent IV tPA + MT is appropriate if both indicated.
                    </div>
                  </div>
                </div>
                {/* Right */}
                <div>
                  {/* BP */}
                  <div className="sa-card">
                    <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,color:T.txt,marginBottom:12}}>🩺 Blood Pressure Management</div>
                    <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:14,flexWrap:'wrap'}}>
                      {[['SBP',sbp,setSbp,parseInt(sbp)>185],[' DBP',dbp,setDbp,parseInt(dbp)>110]].map(([lbl,val,setter,high])=>(
                        <div key={lbl} style={{display:'flex',alignItems:'center',gap:6,background:T.card,border:`1px solid ${high?T.coral:T.border}`,borderRadius:8,padding:'6px 12px'}}>
                          <span style={{fontSize:10,color:T.txt3}}>{lbl}</span>
                          <input type="number" value={val} onChange={e=>setter(e.target.value)} placeholder="0" style={{background:'transparent',border:'none',outline:'none',fontFamily:"'JetBrains Mono',monospace",fontSize:20,fontWeight:700,color:high?T.coral:T.teal,width:60}}/>
                          <span style={{fontSize:10,color:T.txt3}}>mmHg</span>
                        </div>
                      ))}
                      {bpHigh && <span style={{fontSize:11,color:T.coral,fontWeight:600}}>⚠ Above threshold</span>}
                    </div>
                    <div style={{overflowX:'auto'}}>
                      <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                        <thead><tr>{['Scenario','Target','Agent'].map(h=><th key={h} style={{textAlign:'left',padding:'6px 8px',color:T.txt3,borderBottom:`1px solid ${T.border}`,fontWeight:600,textTransform:'uppercase',fontSize:9,letterSpacing:'0.06em'}}>{h}</th>)}</tr></thead>
                        <tbody>{BP_TABLE.map((r,i)=>(
                          <tr key={i} style={{borderBottom:`1px solid ${T.border}`}}>
                            <td style={{padding:'7px 8px',color:T.txt2,lineHeight:1.4}}>{r.scenario}</td>
                            <td style={{padding:'7px 8px',color:T.teal,fontFamily:"'JetBrains Mono',monospace",fontWeight:600,whiteSpace:'nowrap'}}>{r.target}</td>
                            <td style={{padding:'7px 8px',color:T.txt3,lineHeight:1.4}}>{r.agent}</td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                  </div>
                  {/* Secondary Prevention */}
                  <div className="sa-card">
                    <div className="sa-sec-title">🛡 Secondary Prevention</div>
                    {SECONDARY_PREVENTION.map((item,i)=>(
                      <div key={i} className="acc-item">
                        <div className="acc-hdr" onClick={()=>setSecPrevOpen(p=>({...p,[i]:!p[i]}))}>
                          <span>{item.type}</span><span style={{color:T.txt3}}>{secPrevOpen[i]?'▲':'▼'}</span>
                        </div>
                        {secPrevOpen[i] && <div className="acc-body">{item.text}</div>}
                      </div>
                    ))}
                  </div>
                  {/* Orders */}
                  <div className="sa-card">
                    <div className="sa-sec-title">📋 Standard Stroke Orders</div>
                    {STANDARD_ORDERS.map((o,i)=>(
                      <div key={i} className={`sa-chk${ordersChecked[i]?' on':''}`} onClick={()=>setOrdersChecked(p=>({...p,[i]:!p[i]}))}>
                        <div className="sa-chk-box">{ordersChecked[i]&&<span style={{color:'#050f1e',fontSize:10,fontWeight:900}}>✓</span>}</div>
                        <span style={{fontSize:12,color:ordersChecked[i]?T.teal:T.txt2}}>{o}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 4: NEURO CONSULT ── */}
        {activeTab==='consult' && (
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,alignItems:'start'}} className="sa-2col">
            {/* Left */}
            <div>
              <div className="sa-card">
                <div className="sa-sec-title">⏱ Consultation Times</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                  {CONSULT_TIMES.map((ct,i)=>(
                    <div key={i}>
                      <div style={{fontSize:10,color:ct.color,fontWeight:600,marginBottom:4,textTransform:'uppercase',letterSpacing:'0.05em'}}>{ct.label}</div>
                      <div style={{display:'flex',gap:4}}>
                        <input type={ct.type} value={consultVals[i]||''} onChange={e=>setConsultVals(p=>({...p,[i]:e.target.value}))} style={{...INPUT_STYLE,flex:1,fontSize:11,padding:'5px 8px',borderColor:`${ct.color}44`,color:ct.color}}/>
                        {ct.type==='time' && <button className="sa-now" onClick={()=>setConsultVals(p=>({...p,[i]:nowTime()}))}>Now</button>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="sa-card">
                <div className="sa-sec-title">👥 Consulting Providers</div>
                {[['Neurologist',neurologist,setNeurologist],['Attending Physician',attending,setAttending],['Activation Type',actType,setActType]].map(([lbl,val,setter])=>(
                  <div key={lbl} style={{marginBottom:10}}>
                    <div className="sa-label">{lbl}</div>
                    <input className="sa-input" value={val} onChange={e=>setter(e.target.value)} placeholder={lbl}/>
                  </div>
                ))}
              </div>
              <div className="sa-card">
                <div className="sa-sec-title">📅 Follow-up Schedule</div>
                {[['Next NIHSS Assessment','next'],['24h NIHSS','h24'],['MRI Follow-up','mri'],['Clinic Follow-up','clinic']].map(([lbl,key])=>(
                  <div key={key} style={{marginBottom:10}}>
                    <div className="sa-label">{lbl}</div>
                    <input className="sa-input" value={followup[key]} onChange={e=>setFollowup(p=>({...p,[key]:e.target.value}))} placeholder={lbl}/>
                  </div>
                ))}
              </div>
            </div>
            {/* Right */}
            <div>
              <div className="sa-card">
                <div className="sa-sec-title">✅ Quick Recommendations</div>
                {NEURO_RECS.map((rec,i)=>(
                  <div key={i} className={`sa-chk${neuRecs[i]?' on':''}`} onClick={()=>setNeuRecs(p=>({...p,[i]:!p[i]}))}>
                    <div className="sa-chk-box">{neuRecs[i]&&<span style={{color:'#050f1e',fontSize:10,fontWeight:900}}>✓</span>}</div>
                    <span style={{fontSize:12,color:neuRecs[i]?T.teal:T.txt2}}>{rec}</span>
                  </div>
                ))}
              </div>
              <div className="sa-card">
                <div className="sa-sec-title">📝 Neuro Recommendations</div>
                <textarea className="sa-textarea" value={neuNote} onChange={e=>setNeuNote(e.target.value)} placeholder="Free-text neurology recommendations..."/>
              </div>
              <div className="sa-card">
                <div className="sa-sec-title">🏥 Disposition</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:14}}>
                  {DISPOSITION_OPTIONS.map(d=>(
                    <button key={d} className={`disp-pill${disposition===d?' sel':''}`} onClick={()=>setDisposition(d)}>{d}</button>
                  ))}
                </div>
                <div className="sa-label" style={{marginBottom:4}}>Next Steps / Orders</div>
                <textarea className="sa-textarea" value={nextSteps} onChange={e=>setNextSteps(e.target.value)} placeholder="Orders, next steps..."/>
                <div className="sa-label" style={{marginTop:10,marginBottom:4}}>Outstanding / Pending Items</div>
                <textarea className="sa-textarea" value={pending} onChange={e=>setPending(e.target.value)} placeholder="Pending labs, consults, imaging..."/>
              </div>
              {/* Case Summary */}
              <div style={{background:'rgba(0,229,192,.06)',border:'1px solid rgba(0,229,192,.25)',borderRadius:12,padding:'16px'}}>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,color:T.teal,marginBottom:10}}>📋 Case Summary</div>
                {[
                  ['NIHSS Score',`${nihssTotal} — ${severity.label}`],
                  ['LKW',lkw||'—'],
                  ['Alert / Arrival',alertTime||'—'],
                  ['tPA Status',tpaEligible?'✓ Eligible per criteria':(Object.values(tpaExc).some(Boolean)?'❌ Exclusion present':'Criteria not reviewed')],
                  ['Disposition',disposition||'—'],
                ].map(([k,v])=>(
                  <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:`1px solid rgba(0,229,192,.12)`}}>
                    <span style={{fontSize:11,color:T.txt3}}>{k}</span>
                    <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:T.teal,fontWeight:600,textAlign:'right',maxWidth:'60%'}}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 5: CLINICAL CALCULATORS ── */}
        {activeTab==='calc' && (() => {
          const GCS_ITEMS = [
            {key:'eye',label:'Eye Opening',max:4,options:[
              {score:1,label:'None',desc:'No eye opening'},
              {score:2,label:'To pain',desc:'Opens to painful stimulus'},
              {score:3,label:'To voice',desc:'Opens to verbal command'},
              {score:4,label:'Spontaneous',desc:'Eyes open spontaneously'},
            ]},
            {key:'verbal',label:'Verbal Response',max:5,options:[
              {score:1,label:'None',desc:'No verbal response'},
              {score:2,label:'Sounds',desc:'Incomprehensible sounds'},
              {score:3,label:'Words',desc:'Inappropriate words'},
              {score:4,label:'Confused',desc:'Confused conversation'},
              {score:5,label:'Oriented',desc:'Oriented and converses normally'},
            ]},
            {key:'motor',label:'Motor Response',max:6,options:[
              {score:1,label:'None',desc:'No motor response'},
              {score:2,label:'Extension',desc:'Abnormal extension (decerebrate)'},
              {score:3,label:'Flexion',desc:'Abnormal flexion (decorticate)'},
              {score:4,label:'Withdrawal',desc:'Withdraws from pain'},
              {score:5,label:'Localizes',desc:'Localizes painful stimulus'},
              {score:6,label:'Obeys',desc:'Obeys commands'},
            ]},
          ];
          const ASPECTS_REGIONS = [
            {id:'c',label:'Caudate'},
            {id:'p',label:'Putamen'},
            {id:'ic',label:'Internal Capsule'},
            {id:'ic2',label:'Insular Ribbon'},
            {id:'m1',label:'M1 — Ant MCA'},
            {id:'m2',label:'M2 — Lat MCA'},
            {id:'m3',label:'M3 — Post MCA'},
            {id:'m4',label:'M4 — Ant sup MCA'},
            {id:'m5',label:'M5 — Lat sup MCA'},
            {id:'m6',label:'M6 — Post sup MCA'},
          ];
          const gcsTotal = (gcs.eye||0)+(gcs.verbal||0)+(gcs.motor||0);
          const gcsSeverity = gcsTotal>=13?{label:'Mild',color:T.teal}:gcsTotal>=9?{label:'Moderate',color:T.gold}:{label:'Severe',color:T.coral};
          const aspectsScore = 10 - Object.values(aspects).filter(Boolean).length;
          const aspectsColor = aspectsScore>=8?T.teal:aspectsScore>=6?T.gold:T.coral;
          const weightKg = tpaWeight ? parseFloat(tpaWeight)*(tpaWeightUnit==='lbs'?0.453592:1) : null;
          const tpaTotalDose = weightKg ? Math.min(weightKg*0.9, 90) : null;
          const tpaBolus = tpaTotalDose ? +(tpaTotalDose*0.1).toFixed(1) : null;
          const tpaInfusion = tpaTotalDose ? +(tpaTotalDose*0.9).toFixed(1) : null;
          const bpOk = !(parseInt(sbp)>185 || parseInt(dbp)>110);
          return (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16,alignItems:'start'}} className="sa-2col">
              {/* GCS */}
              <div className="sa-card">
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12,flexWrap:'wrap',gap:8}}>
                  <div className="sa-sec-title" style={{margin:0}}>👁 Glasgow Coma Scale</div>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    {gcsTotal>0 && <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:32,fontWeight:800,color:gcsSeverity.color,lineHeight:1}}>{gcsTotal}<span style={{fontSize:14,fontWeight:400,color:T.txt3}}>/15</span></div>}
                    {gcsTotal>0 && <span style={{padding:'3px 10px',borderRadius:20,fontSize:10,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",background:`${gcsSeverity.color}18`,border:`1px solid ${gcsSeverity.color}44`,color:gcsSeverity.color}}>{gcsSeverity.label}</span>}
                  </div>
                </div>
                {GCS_ITEMS.map(item=>(
                  <div key={item.key} style={{marginBottom:12}}>
                    <div style={{fontSize:11,color:T.txt3,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:5}}>{item.label}</div>
                    <div style={{display:'grid',gridTemplateColumns:`repeat(${item.max},1fr)`,gap:4}}>
                      {item.options.map(opt=>{
                        const sel=gcs[item.key]===opt.score;
                        return (
                          <div key={opt.score} onClick={()=>setGcs(p=>({...p,[item.key]:sel?null:opt.score}))}
                            title={`${opt.label}: ${opt.desc}`}
                            style={{background:sel?`${gcsSeverity.color}20`:T.up,border:`1px solid ${sel?gcsSeverity.color:T.border}`,borderRadius:6,padding:'6px 4px',cursor:'pointer',textAlign:'center',transition:'all .15s'}}>
                            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:16,fontWeight:800,color:sel?gcsSeverity.color:T.txt3}}>{opt.score}</div>
                            <div style={{fontSize:9,color:sel?gcsSeverity.color:T.txt4,marginTop:2,lineHeight:1.2}}>{opt.label}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {gcsTotal>0 && (
                  <div style={{marginTop:8,padding:'8px 12px',background:T.up,border:`1px solid ${T.border}`,borderRadius:8,fontSize:11,color:T.txt2,fontFamily:"'JetBrains Mono',monospace"}}>
                    E{gcs.eye||'?'} + V{gcs.verbal||'?'} + M{gcs.motor||'?'} = <strong style={{color:gcsSeverity.color}}>{gcsTotal}</strong>
                  </div>
                )}
              </div>

              {/* ASPECTS */}
              <div className="sa-card">
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12,flexWrap:'wrap',gap:8}}>
                  <div className="sa-sec-title" style={{margin:0}}>🧠 ASPECTS Score</div>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:32,fontWeight:800,color:aspectsColor,lineHeight:1}}>{aspectsScore}<span style={{fontSize:14,fontWeight:400,color:T.txt3}}>/10</span></div>
                </div>
                <div style={{fontSize:11,color:T.txt3,marginBottom:10,lineHeight:1.5}}>Check all regions with <strong style={{color:T.coral}}>early ischemic changes</strong> (each reduces score by 1). Score ≥6 generally supports thrombectomy.</div>
                {ASPECTS_REGIONS.map(r=>{
                  const ck=aspects[r.id];
                  return (
                    <div key={r.id} className={`sa-chk-exc${ck?' on':''}`} onClick={()=>setAspects(p=>({...p,[r.id]:!p[r.id]}))}>
                      <div className="sa-chk-box">{ck&&<span style={{color:'white',fontSize:10,fontWeight:900}}>✕</span>}</div>
                      <span style={{fontSize:12,color:ck?T.coral:T.txt2}}>{r.label}</span>
                      {ck && <span style={{marginLeft:'auto',fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.coral}}>−1</span>}
                    </div>
                  );
                })}
                <div style={{marginTop:10,padding:'8px 12px',background:aspectsScore>=6?'rgba(0,229,192,.07)':'rgba(255,107,107,.07)',border:`1px solid ${aspectsScore>=6?'rgba(0,229,192,.25)':'rgba(255,107,107,.25)'}`,borderRadius:8,fontSize:11,color:aspectsScore>=6?T.teal:T.coral,fontWeight:600}}>
                  {aspectsScore>=8?'✓ Favorable — supports intervention':aspectsScore>=6?'⚠ Borderline — discuss with neuro':'✕ Low score — poor thrombectomy candidate'}
                </div>
              </div>

              {/* tPA Dose Calculator */}
              <div className="sa-card">
                <div className="sa-sec-title">💊 tPA Dose Calculator</div>
                <div style={{fontSize:11,color:T.txt3,marginBottom:12,lineHeight:1.5}}>Alteplase 0.9 mg/kg (max 90 mg). Enter patient weight to calculate doses.</div>
                <div style={{marginBottom:14}}>
                  <div className="sa-label">Patient Weight</div>
                  <div style={{display:'flex',gap:6}}>
                    <input type="number" min="0" step="0.1" value={tpaWeight} onChange={e=>setTpaWeight(e.target.value)} placeholder="Enter weight" style={{...INPUT_STYLE,flex:1}}/>
                    <div style={{display:'flex',border:`1px solid ${T.border}`,borderRadius:6,overflow:'hidden'}}>
                      {['kg','lbs'].map(u=>(
                        <button key={u} onClick={()=>setTpaWeightUnit(u)} style={{padding:'7px 10px',background:tpaWeightUnit===u?T.blue:T.up,color:tpaWeightUnit===u?'#050f1e':T.txt2,border:'none',fontWeight:700,fontSize:11,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>{u}</button>
                      ))}
                    </div>
                  </div>
                  {weightKg && tpaWeightUnit==='lbs' && <div style={{fontSize:10,color:T.txt3,marginTop:4,fontFamily:"'JetBrains Mono',monospace"}}>= {weightKg.toFixed(1)} kg</div>}
                </div>
                {tpaTotalDose ? (
                  <div>
                    {weightKg>100 && <div style={{padding:'6px 10px',background:'rgba(245,200,66,.08)',border:'1px solid rgba(245,200,66,.25)',borderRadius:6,fontSize:11,color:T.gold,marginBottom:10}}>⚠ Weight &gt;100 kg — dose capped at 90 mg</div>}
                    {[['Total Dose',`${tpaTotalDose.toFixed(1)} mg`,T.teal],['10% Bolus (1 min)',`${tpaBolus} mg`,T.blue],['90% Infusion (60 min)',`${tpaInfusion} mg`,T.purple]].map(([lbl,val,col])=>(
                      <div key={lbl} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 14px',background:T.up,border:`1px solid ${T.border}`,borderRadius:8,marginBottom:6}}>
                        <span style={{fontSize:12,color:T.txt2}}>{lbl}</span>
                        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:20,fontWeight:800,color:col}}>{val}</span>
                      </div>
                    ))}
                    <div style={{marginTop:10,padding:'8px 12px',background:'rgba(0,229,192,.06)',border:'1px solid rgba(0,229,192,.2)',borderRadius:8,fontSize:11,color:T.teal,lineHeight:1.6}}>
                      Hold anticoagulants &amp; antiplatelets 24h post-infusion. BP target &lt;180/105 during and 24h after.
                    </div>
                    {!bpOk && sbp && <div style={{marginTop:8,padding:'8px 12px',background:'rgba(255,107,107,.08)',border:'1px solid rgba(255,107,107,.3)',borderRadius:8,fontSize:11,color:T.coral,fontWeight:600}}>⚠ Current BP ({sbp}/{dbp}) exceeds pre-tPA threshold. Treat to &lt;185/110 before administering.</div>}
                    {bpOk && sbp && <div style={{marginTop:8,padding:'8px 12px',background:'rgba(0,229,192,.06)',border:'1px solid rgba(0,229,192,.2)',borderRadius:8,fontSize:11,color:T.teal}}>✓ BP ({sbp}/{dbp}) within pre-tPA target range</div>}
                  </div>
                ) : (
                  <div style={{textAlign:'center',padding:'24px',color:T.txt4}}>
                    <div style={{fontSize:28,marginBottom:8}}>⚖️</div>
                    <div style={{fontSize:12}}>Enter patient weight above</div>
                  </div>
                )}
                <div style={{marginTop:14,padding:'8px 12px',background:T.up,border:`1px solid ${T.border}`,borderRadius:8}}>
                  <div style={{fontSize:10,color:T.txt3,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:6}}>Formula Reference</div>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:T.txt2,lineHeight:1.8}}>
                    Total = 0.9 mg/kg (max 90 mg)<br/>
                    Bolus = Total × 10% over 1 min<br/>
                    Infusion = Total × 90% over 60 min
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* FOOTER */}
        <div style={{marginTop:28,padding:'12px 16px',background:T.panel,border:`1px solid ${T.border}`,borderRadius:8,fontSize:10,color:T.txt3,lineHeight:1.7}}>
          ⚕️ <strong style={{color:T.txt4}}>Clinical Decision Support — Not a Substitute for Clinical Judgment.</strong><br/>
          Reflects NIHSS criteria and AHA/ASA 2019 Acute Ischemic Stroke guidelines (updated 2022–2023). All treatment decisions must be verified by the attending physician. NIHSS must be performed by trained, certified examiners. Pediatric decisions require pediatric neurology consultation.
        </div>
      </div>
    </>
  );
}