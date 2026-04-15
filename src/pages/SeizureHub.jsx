// SeizureHub.jsx
// Seizure & Status Epilepticus Management Hub — standalone + embeddable.
//
// Clinical basis:
//   ACEP Clinical Policy: Management of Adult Patients Presenting to the ED
//   With Seizures. Approved April 17, 2024. Ann Emerg Med. 2024;84(1):e1-e12.
//   Level A: Fosphenytoin, levetiracetam, or valproate are equivalent second-line
//   agents for refractory seizures after benzodiazepines.
//
// Sections:
//   1. SE Protocol — real-time stepped management with timer
//   2. Benzodiazepine First-Line Dosing Calculator
//   3. Second-Line Agent Selection (ACEP 2024 Level A)
//   4. Seizure Type Classification / Differential
//   5. Special Scenarios (INH / alcohol / eclampsia / PNES)
//   6. Post-Ictal Checklist & Workup
//
// Props (embedded): demo, vitals, medications, allergies, pmhSelected
// Constraints: no form, no localStorage, no router import, straight quotes only,
//   single react import, border before borderTop/etc.,
//   no async (no AI call needed — reference module)

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// ── Font injection ─────────────────────────────────────────────────────────────
(() => {
  if (document.getElementById("sz-fonts")) return;
  const l = document.createElement("link");
  l.id = "sz-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "sz-css";
  s.textContent = `
    @keyframes sz-fade{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
    .sz-fade{animation:sz-fade .18s ease forwards;}
    @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
    .shimmer-text{background:linear-gradient(90deg,#e8f0fe 0%,#fff 30%,#ff4444 50%,#ff9f43 72%,#e8f0fe 100%);
    background-size:250% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;
    background-clip:text;animation:shimmer 4s linear infinite;}
    @keyframes pulse-red{0%,100%{box-shadow:0 0 0 0 rgba(255,68,68,0.5)}70%{box-shadow:0 0 0 10px rgba(255,68,68,0)}}
    .pulse-red{animation:pulse-red 1.4s ease-out infinite;}
  `;
  document.head.appendChild(s);
})();

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:"#050f1e", panel:"#081628",
  txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", blue:"#3b9eff",
  orange:"#ff9f43", purple:"#9b6dff", green:"#3dffa0", red:"#ff4444",
};

// ── SE Protocol steps ─────────────────────────────────────────────────────────
const SE_STEPS = [
  {
    id:"s0",
    time:"0 min",
    timeRange:[0, 5],
    label:"Immediate / Stabilization",
    color:T.coral,
    actions:[
      "ABCs — airway positioning, suction, supplemental O2",
      "IV or IO access × 2 — draw blood with first stick",
      "POC glucose immediately — treat hypoglycemia before anything else",
      "Cardiac monitor, pulse ox, continuous EEG if available",
      "Labs: BMP, CBC, Mg, Ca, AED levels, tox screen, LFTs, PT/INR, UA",
      "Brief history: prior seizures, AEDs, medications, alcohol, drugs, trauma",
    ],
    drugs:null,
  },
  {
    id:"s1",
    time:"0–5 min",
    timeRange:[0, 5],
    label:"First-Line — Benzodiazepines",
    color:T.orange,
    urgent:true,
    actions:[
      "Give a benzodiazepine — do not delay for IV access",
      "IM midazolam preferred if no IV (faster than IV lorazepam in trials)",
      "IV lorazepam preferred if IV access available",
      "Repeat dose once if seizure persists at 5 minutes",
    ],
    drugs:[
      { name:"Midazolam IM", dose:"10 mg IM (5 mg if <40 kg)", route:"IM",
        note:"RAMPART trial: IM midazolam superior to IV lorazepam pre-hospital. Onset 3–5 min.", preferred:true },
      { name:"Lorazepam IV", dose:"0.1 mg/kg IV (max 4 mg/dose)", route:"IV",
        note:"May repeat in 5 min. Max 8 mg total. Onset 2–3 min.", preferred:true },
      { name:"Diazepam IV", dose:"0.15 mg/kg IV (max 10 mg/dose)", route:"IV",
        note:"May repeat in 5 min. Alternative if lorazepam unavailable." },
      { name:"Diazepam PR", dose:"0.2 mg/kg rectal (max 20 mg)", route:"PR",
        note:"Rectal diastat — use when no IV and IM unavailable." },
      { name:"Midazolam IN", dose:"5 mg per nostril (10 mg total via MAD)", route:"Intranasal",
        note:"Onset 3–5 min. Alternative to IM when IV unavailable." },
    ],
  },
  {
    id:"s2",
    time:"5–20 min",
    timeRange:[5, 20],
    label:"Second-Line — ACEP 2024 Level A",
    color:T.red,
    urgent:true,
    policy:"ACEP 2024 Level A: Fosphenytoin, levetiracetam, or valproate may be used with similar efficacy. No agent is superior — choose based on clinical context.",
    actions:[
      "Choose one second-line agent — all three are Level A equivalent",
      "Give while considering underlying etiology (see Special Scenarios)",
      "If seizing >5 min after first BZD → do not wait, give second-line now",
      "Prepare for intubation if seizure persists after second-line",
    ],
    drugs:[
      { name:"Levetiracetam IV", dose:"60 mg/kg IV (max 4500 mg)", route:"IV infusion",
        note:"Infuse over 10 min. Well-tolerated, minimal drug interactions. No hepatic concerns. Preferred in liver disease, coagulopathy.", preferred:true },
      { name:"Fosphenytoin IV", dose:"20 mg PE/kg IV (max 1500 mg PE)", route:"IV infusion",
        note:"Infuse at max 150 mg PE/min. Monitor BP and ECG during infusion. Convert dose in PE units.", preferred:false },
      { name:"Valproate IV", dose:"40 mg/kg IV (max 3000 mg)", route:"IV infusion",
        note:"Infuse over 10 min. Avoid in pregnancy (teratogenic), liver disease, mitochondrial disease, pancreatitis.", preferred:false },
      { name:"Phenobarbital IV", dose:"20 mg/kg IV at ≤50–100 mg/min", route:"IV infusion",
        note:"Alternative if above unavailable. High sedation and respiratory depression risk — have airway ready.", preferred:false },
    ],
  },
  {
    id:"s3",
    time:">20–40 min",
    timeRange:[20, 40],
    label:"Refractory SE — Third-Line",
    color:T.purple,
    urgent:true,
    actions:[
      "Refractory SE defined: seizures persist despite adequate BZD + one second-line agent",
      "Intubation and continuous infusion required at this stage",
      "Urgent EEG monitoring essential — non-convulsive SE frequent post-intubation",
      "Neurology emergent consultation if not already involved",
      "Consider structural etiology — emergent MRI or CT if not done",
    ],
    drugs:[
      { name:"Propofol infusion", dose:"1–2 mg/kg IV bolus → 20–200 mcg/kg/min", route:"IV continuous infusion",
        note:"Titrate to burst suppression on EEG. Monitor for propofol infusion syndrome (>48h, high doses).", preferred:true },
      { name:"Midazolam infusion", dose:"0.2 mg/kg IV bolus → 0.05–2 mg/kg/hr", route:"IV continuous infusion",
        note:"Titrate to EEG burst suppression. Accumulates with prolonged use.", preferred:true },
      { name:"Ketamine infusion", dose:"1–4.5 mg/kg/hr IV continuous", route:"IV continuous infusion",
        note:"Emerging evidence. NMDA antagonist — mechanism different from BZDs. May rescue BZD-refractory SE." },
      { name:"Pentobarbital", dose:"5–15 mg/kg load at ≤50 mg/min → 0.5–5 mg/kg/hr", route:"IV continuous infusion",
        note:"Deep barbiturate coma. Significant hemodynamic instability. ICU mandatory." },
    ],
  },
  {
    id:"s4",
    time:">60 min",
    timeRange:[60, 999],
    label:"Super-Refractory SE",
    color:T.txt4,
    actions:[
      "Super-refractory SE: persists >24h or recurs on reduction of anesthesia",
      "Continued EEG monitoring mandatory",
      "Consider: pyridoxine 100 mg IV (INH exposure / B6 deficiency), thiamine 100 mg IV",
      "Autoimmune encephalitis workup: CSF, anti-NMDAR, anti-LGI1, anti-CASPR2 antibodies",
      "Ketogenic diet, immunotherapy (IVIG, steroids), ECT reported in case series",
      "Neurocritical care / epilepsy unit transfer",
    ],
    drugs:null,
  },
];

// ── Benzodiazepine weight-based dose calculator ────────────────────────────────
const BZD_DRUGS = [
  { id:"midazolam_im", name:"Midazolam IM",  factor:0.2,  maxMg:10,  unit:"mg",    route:"IM",  preferred:true, note:"RAMPART preferred route — no IV required" },
  { id:"lorazepam_iv", name:"Lorazepam IV",  factor:0.1,  maxMg:4,   unit:"mg",    route:"IV",  preferred:true, note:"Repeat once in 5 min if needed (max 8 mg total)" },
  { id:"diazepam_iv",  name:"Diazepam IV",   factor:0.15, maxMg:10,  unit:"mg",    route:"IV",  preferred:false, note:"Onset 1–3 min. Long half-life — repeated dosing accumulates." },
  { id:"diazepam_pr",  name:"Diazepam PR",   factor:0.2,  maxMg:20,  unit:"mg",    route:"PR",  preferred:false, note:"Rectal route when IV unavailable" },
];

// ── Second-line agent selector ────────────────────────────────────────────────
const SECOND_LINE = [
  {
    id:"lev",
    name:"Levetiracetam",
    brand:"Keppra",
    dose:"60 mg/kg IV",
    maxDose:4500,
    rateMax:"Infuse over 10 min",
    color:T.teal,
    strength:"Level A (ACEP 2024)",
    pros:[
      "No hepatic metabolism — safe in liver disease",
      "No significant drug interactions",
      "No cardiac monitoring required during infusion",
      "No protein binding concerns",
    ],
    cons:[
      "Behavioral side effects (agitation, psychosis) at high doses",
      "Adjust dose for renal impairment (GFR-based)",
    ],
    avoid:"No absolute contraindications",
    preferredWhen:"Liver disease, coagulopathy, cardiac conduction abnormalities, no IV access for monitoring",
  },
  {
    id:"fos",
    name:"Fosphenytoin",
    brand:"Cerebyx",
    dose:"20 mg PE/kg IV",
    maxDose:1500,
    rateMax:"Max 150 mg PE/min (≈10–15 min infusion)",
    color:T.orange,
    strength:"Level A (ACEP 2024)",
    pros:[
      "Decades of clinical experience",
      "Preferred in structural epilepsy",
      "Oral phenytoin continuation possible",
    ],
    cons:[
      "BP drop and cardiac arrhythmias during infusion — ECG monitoring required",
      "Dose expressed in PE units — potential for dosing error",
      "Tissue necrosis if extravasates (less than phenytoin but still risk)",
      "Purple glove syndrome rare",
    ],
    avoid:"Sinus bradycardia, SA block, 2nd/3rd degree AV block, Stokes-Adams syndrome",
    preferredWhen:"Prior phenytoin use, structural epilepsy, no liver disease",
  },
  {
    id:"vpa",
    name:"Valproate",
    brand:"Depacon",
    dose:"40 mg/kg IV",
    maxDose:3000,
    rateMax:"Infuse over 10 min",
    color:T.purple,
    strength:"Level A (ACEP 2024)",
    pros:[
      "Broad-spectrum — effective for multiple seizure types",
      "No cardiac monitoring required",
      "Rapid infusion (10 min) possible",
    ],
    cons:[
      "Hepatotoxicity — avoid in liver disease",
      "Pancreatitis risk",
      "Multiple drug interactions (carbapenem, aspirin, warfarin)",
      "Weight-based dosing can result in high volume",
    ],
    avoid:"Pregnancy (teratogenic — Category X for NTDs), liver disease, mitochondrial disorders, pancreatitis",
    preferredWhen:"No liver disease, not pregnant, broad-spectrum coverage needed",
  },
];

// ── Seizure type classification ───────────────────────────────────────────────
const SEIZURE_TYPES = [
  {
    type:"Generalized Tonic-Clonic (GTCS)",
    color:T.red, icon:"⚡",
    features:["Bilateral tonic stiffening → clonic jerking","Loss of consciousness","Post-ictal confusion, fatigue","May have tongue bite (lateral), urinary incontinence"],
    etiologies:["Idiopathic / genetic epilepsy","Provoked: metabolic, toxic, structural","New-onset GTCS in adult: workup for structural cause"],
    eeg:"Generalized spike-wave during ictal, post-ictal slowing",
    pearl:"New-onset GTCS in adult >25yr requires urgent structural workup (CT/MRI, LP). Lateral tongue bite has 100% specificity for tonic-clonic seizure.",
  },
  {
    type:"Focal with Impaired Awareness",
    color:T.orange, icon:"💭",
    features:["Focal onset — staring, automatisms (lip smacking, hand wringing)","Impaired consciousness during event","Post-ictal confusion","Duration typically 1–3 minutes"],
    etiologies:["Temporal lobe epilepsy (most common)","Structural lesion — MRI essential","Hippocampal sclerosis, tumor, vascular malformation"],
    eeg:"Focal temporal or frontotemporal activity",
    pearl:"Often misdiagnosed as TIA or psychiatric event. Automatisms and post-ictal confusion distinguish from syncope. MRI is superior to CT for focal epilepsy workup.",
  },
  {
    type:"Absence Seizure",
    color:T.blue, icon:"😶",
    features:["Brief (3–30 sec) staring episodes","No post-ictal period","May have subtle eyelid fluttering or oral automatisms","Multiple times per day"],
    etiologies:["Childhood absence epilepsy","Juvenile absence epilepsy","Can persist into adulthood"],
    eeg:"3 Hz generalized spike-wave — pathognomonic",
    pearl:"Absence status can present as prolonged confusion in adults — often missed. Hyperventilation in the office can provoke an absence seizure for diagnostic purposes.",
  },
  {
    type:"Myoclonic Seizure",
    color:T.purple, icon:"🫨",
    features:["Brief, sudden involuntary muscle jerks","Usually bilateral","Typically in AM shortly after waking","Often preserved consciousness"],
    etiologies:["Juvenile myoclonic epilepsy (JME) — most common","Progressive myoclonic epilepsies","Metabolic: uremia, anoxia, drugs"],
    eeg:"Generalized polyspike-wave",
    pearl:"JME is exquisitely sensitive to sleep deprivation, alcohol, and photic stimulation. Valproate is first-line (avoid in women of childbearing age). Often misdiagnosed for years.",
  },
  {
    type:"Non-Epileptic Seizure (PNES)",
    color:T.gold, icon:"🎭",
    features:["Prolonged duration (>2 min) without treatment response","Asynchronous movements, pelvic thrusting","Eyes closed during event (eyes open in epileptic seizure)","Preserved consciousness with bilateral limb shaking","No post-ictal confusion, normal CK and lactate post-event"],
    etiologies:["Psychological / conversion disorder","History of trauma or abuse common","Comorbid epilepsy in ~30%"],
    eeg:"Normal during event — diagnostic",
    pearl:"Absence of lactate elevation or CK rise after prolonged event suggests PNES. Do not give repeated benzodiazepines — escalate to intubation only if truly not responsive. Video-EEG is gold standard for diagnosis.",
  },
  {
    type:"Focal to Bilateral Tonic-Clonic",
    color:T.coral, icon:"🔀",
    features:["Starts focal → spreads to bilateral convulsion","Head/eye deviation often seen at onset","Unilateral tonic posturing before generalization","Post-ictal Todd's paralysis possible"],
    etiologies:["Structural epilepsy — tumor, stroke, malformation","Cortical dysplasia","Secondary generalization from any focal lesion"],
    eeg:"Focal onset with secondary generalization",
    pearl:"Todd's paralysis (focal weakness post-ictal) can mimic stroke. Duration 15 min–24h. Normal CT or MRI does not rule out early ischemic stroke — DWI MRI needed if TIA/stroke suspected.",
  },
];

// ── Special scenarios ─────────────────────────────────────────────────────────
const SPECIAL_SCENARIOS = [
  {
    id:"inh",
    label:"INH / Isoniazid Toxicity",
    icon:"💊", color:T.red,
    alert:"BZDs alone will FAIL — pyridoxine is the specific antidote and must be given simultaneously",
    presentation:"Refractory status epilepticus in patient on TB therapy or after INH overdose. Classic triad: seizures + lactic acidosis + altered mental status.",
    treatment:[
      "Pyridoxine (Vitamin B6): 1 mg IV per 1 mg INH ingested",
      "If dose unknown: pyridoxine 5 g IV (70 mg/kg in children)",
      "Give simultaneously with benzodiazepines — not after BZD failure",
      "Benzodiazepines for seizure control while pyridoxine loading",
    ],
    note:"INH inhibits pyridoxal phosphate → depletes GABA → seizures cannot be controlled without replacing pyridoxine. Phenytoin is ineffective for INH seizures.",
  },
  {
    id:"alcohol",
    label:"Alcohol Withdrawal Seizures",
    icon:"🍺", color:T.orange,
    alert:"CIWA-Ar: treat withdrawal aggressively. Benzodiazepines are first-line and superior to antiepileptics.",
    presentation:"Typically 6–48h after last drink. Generalized tonic-clonic, often single. Risk of Wernicke's encephalopathy.",
    treatment:[
      "Thiamine 100 mg IV before any glucose (Wernicke's prevention)",
      "Lorazepam 2–4 mg IV or IM — titrate to CIWA-Ar",
      "Phenobarbital for severe or BZD-refractory withdrawal seizures",
      "MgSO4 2 g IV if hypomagnesemia present",
      "Do NOT use phenytoin — ineffective for alcohol withdrawal seizures",
    ],
    note:"AEDs (phenytoin, levetiracetam, valproate) are not effective for alcohol withdrawal seizures. Benzodiazepines treat the underlying GABA dysregulation.",
  },
  {
    id:"eclampsia",
    label:"Eclampsia",
    icon:"🤰", color:T.purple,
    alert:"Magnesium sulfate is the drug of choice — NOT phenytoin",
    presentation:"Seizures in pregnancy or up to 6 weeks postpartum. Associated with hypertension, proteinuria, edema. Can occur without prior pre-eclampsia.",
    treatment:[
      "Magnesium sulfate: 4–6 g IV load over 15–20 min → 1–2 g/hr maintenance",
      "Treat hypertension: labetalol 20 mg IV or hydralazine 5–10 mg IV (target <160/110)",
      "Urgent OB consultation — delivery is definitive treatment",
      "Benzodiazepines for breakthrough seizures on Mg",
      "Monitor Mg toxicity: deep tendon reflexes, respiratory rate (have calcium gluconate at bedside)",
    ],
    note:"Mg toxicity: loss of DTRs at ~7 mEq/L, respiratory depression ~10 mEq/L. Antidote: calcium gluconate 1g IV. Phenytoin inferior to magnesium for eclampsia prevention and treatment.",
  },
  {
    id:"newonset",
    label:"First Unprovoked Seizure",
    icon:"🆕", color:T.blue,
    alert:"Not all first seizures require AED — but all require urgent workup",
    presentation:"First-ever seizure in adult. Requires structural and metabolic evaluation. Risk of recurrence drives AED decision.",
    treatment:[
      "Non-contrast CT head — urgent to exclude hemorrhage, mass, abscess",
      "BMP, glucose, CBC, tox screen, AED levels (if known epileptic)",
      "LP if: fever, immunocompromised, anticoagulated, no CT available",
      "EEG within 24h if available",
      "MRI brain (outpatient if no structural CT finding) — superior to CT for epilepsy",
    ],
    note:"10-year recurrence risk after single unprovoked seizure: 40–50%. Immediate AED initiation reduces early recurrence but does not change long-term prognosis. Shared decision-making with neurology.",
  },
  {
    id:"pnes",
    label:"PNES / Non-Epileptic",
    icon:"🎭", color:T.gold,
    alert:"Avoid escalating benzodiazepines — recognizing PNES prevents iatrogenic harm",
    presentation:"Prolonged event unresponsive to treatment. Eyes closed. Asynchronous movements. Normal lactate and CK post-event.",
    treatment:[
      "Do not give repeated benzodiazepines once PNES suspected",
      "Calm, firm, consistent communication",
      "Video-EEG monitoring if available — gold standard",
      "Avoid intubation unless clear physiologic compromise",
      "Psychiatric evaluation — trauma history, conversion disorder",
    ],
    note:"~30% of patients with PNES have comorbid epilepsy. Do not dismiss the patient — PNES causes significant disability and requires active treatment. Psychological therapy (CBT) has evidence.",
  },
  {
    id:"febrile",
    label:"Febrile Seizure",
    icon:"🌡️", color:T.teal,
    alert:"Most febrile seizures are benign and self-limited — treat the fever, look for serious infection",
    presentation:"Age 6 months–5 years, fever-associated, generalized, <15 min (simple). Complex: focal, >15 min, or recurrent within 24h.",
    treatment:[
      "Rectal diazepam or buccal/IN midazolam for ongoing seizure",
      "Identify and treat source of fever — LP if <12 months or meningeal signs",
      "Antipyretics for comfort — do not prevent recurrence",
      "EEG and neuroimaging not routinely indicated for simple febrile seizure",
      "Parental education: 30% recurrence risk, 2–4% risk of developing epilepsy",
    ],
    note:"Simple febrile seizures do not cause brain damage. Lumbar puncture: mandatory in <12 months, consider 12–18 months. No AED treatment recommended for simple febrile seizures.",
  },
];

// ── Post-ictal checklist ──────────────────────────────────────────────────────
const POST_ICTAL = [
  { id:"glucose",    text:"POC glucose checked and normalized" },
  { id:"abcs",       text:"Airway maintained — patient protecting airway" },
  { id:"vitals",     text:"Vital signs stable — BP, HR, SpO2 documented" },
  { id:"ekg",        text:"12-lead EKG obtained — QTc, conduction abnormality" },
  { id:"neuroexam",  text:"Neurological exam documented — focal deficits, Todd's paralysis" },
  { id:"labs",       text:"Labs drawn: BMP, Mg, Ca, CBC, AED levels, tox screen" },
  { id:"imaging",    text:"CT head ordered if: first seizure, focal deficit, anticoagulated, trauma, age >40" },
  { id:"aed_levels", text:"AED levels checked if known epileptic — sub-therapeutic is most common cause of breakthrough" },
  { id:"etiology",   text:"Precipitant identified or being investigated: sleep deprivation, medication change, fever, drugs" },
  { id:"neuro",      text:"Neurology notified or follow-up arranged — outpatient within 1 week for established epilepsy" },
  { id:"driving",    text:"Driving restriction counseled — state-specific (typically 3–12 months seizure-free)" },
  { id:"disposition",text:"Disposition determined: discharge, observation, or admission based on etiology and risk" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

function Bullet({ text, color }) {
  return (
    <div style={{ display:"flex", gap:6, alignItems:"flex-start", marginBottom:3 }}>
      <span style={{ color:color||T.teal, fontSize:7, marginTop:3, flexShrink:0 }}>▸</span>
      <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
        color:T.txt3, lineHeight:1.55 }}>{text}</span>
    </div>
  );
}

function Section({ title, icon, accent, open, onToggle, badge, children }) {
  const ac = accent || T.red;
  return (
    <div style={{ marginBottom:8 }}>
      <button onClick={onToggle}
        style={{ display:"flex", alignItems:"center", gap:8, width:"100%",
          padding:"9px 13px",
          background:open
            ? `linear-gradient(135deg,${ac}12,rgba(8,22,40,0.92))`
            : "rgba(8,22,40,0.65)",
          border:`1px solid ${open ? ac+"55" : "rgba(26,53,85,0.4)"}`,
          borderRadius:open ? "10px 10px 0 0" : 10,
          cursor:"pointer", textAlign:"left", transition:"all .15s" }}>
        <span style={{ fontSize:15 }}>{icon}</span>
        <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
          fontSize:13, color:open ? ac : T.txt3, flex:1 }}>{title}</span>
        {badge && (
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            fontWeight:700, padding:"2px 8px", borderRadius:4,
            background:`${badge.color}18`, border:`1px solid ${badge.color}40`,
            color:badge.color, letterSpacing:1,
            textTransform:"uppercase" }}>{badge.text}</span>
        )}
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color:open ? ac : T.txt4, letterSpacing:1, marginLeft:6 }}>
          {open?"▲":"▼"}
        </span>
      </button>
      {open && (
        <div style={{ padding:"12px 13px",
          background:"rgba(8,22,40,0.65)",
          border:`1px solid ${ac}33`, borderTop:"none",
          borderRadius:"0 0 10px 10px" }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ── SE Timer ──────────────────────────────────────────────────────────────────
function SETimer({ weightKg }) {
  const [running,   setRunning]   = useState(false);
  const [elapsed,   setElapsed]   = useState(0);
  const [stepsDone, setStepsDone] = useState({});
  const intRef = useRef(null);

  useEffect(() => {
    if (running) {
      intRef.current = setInterval(() => setElapsed(p => p + 1), 1000);
    } else {
      clearInterval(intRef.current);
    }
    return () => clearInterval(intRef.current);
  }, [running]);

  const elapsedMin = Math.floor(elapsed / 60);
  const activeStep = [...SE_STEPS].reverse().find(s => elapsedMin >= s.timeRange[0]) || SE_STEPS[0];

  const toggleStep = useCallback((id, actionIdx) => {
    const key = `${id}_${actionIdx}`;
    setStepsDone(p => ({ ...p, [key]:!p[key] }));
  }, []);

  return (
    <div>
      {/* Timer controls */}
      <div style={{ display:"flex", alignItems:"center", gap:10,
        padding:"10px 13px", borderRadius:10, marginBottom:10,
        background: running ? "rgba(255,68,68,0.09)" : "rgba(8,22,40,0.7)",
        border:`1px solid ${running ? "rgba(255,68,68,0.45)" : "rgba(26,53,85,0.4)"}` }}>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace",
            fontSize:36, fontWeight:700,
            color:elapsedMin >= 20 ? T.red : elapsedMin >= 5 ? T.orange : T.teal,
            lineHeight:1 }}>
            {fmt(elapsed)}
          </div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
            color:T.txt4, letterSpacing:1, marginTop:2 }}>
            {elapsedMin < 5  ? "FIRST-LINE WINDOW"
            : elapsedMin < 20 ? "SECOND-LINE WINDOW"
            : elapsedMin < 40 ? "REFRACTORY SE — INTUBATE"
            : "SUPER-REFRACTORY SE"}
          </div>
        </div>
        <div style={{ display:"flex", gap:6 }}>
          <button onClick={() => setRunning(p => !p)}
            className={running ? "pulse-red" : ""}
            style={{ padding:"7px 18px", borderRadius:8, cursor:"pointer",
              fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:12,
              transition:"all .15s",
              border:`1px solid ${running ? T.red+"77" : T.green+"66"}`,
              background:running ? "rgba(255,68,68,0.15)" : "rgba(61,255,160,0.12)",
              color:running ? T.red : T.green }}>
            {running ? "⏸ Pause" : elapsed > 0 ? "▶ Resume" : "▶ Start Timer"}
          </button>
          <button onClick={() => { setRunning(false); setElapsed(0); setStepsDone({}); }}
            style={{ padding:"7px 12px", borderRadius:8, cursor:"pointer",
              fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              letterSpacing:1, textTransform:"uppercase",
              border:"1px solid rgba(42,79,122,0.4)",
              background:"transparent", color:T.txt4 }}>
            Reset
          </button>
        </div>

        {/* Weight for dosing */}
        <div style={{ textAlign:"right" }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
            color:T.txt4, letterSpacing:1, textTransform:"uppercase",
            marginBottom:2 }}>Weight</div>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:14,
            fontWeight:700, color:weightKg ? T.teal : T.txt4 }}>
            {weightKg || "—"} kg
          </span>
        </div>
      </div>

      {/* Active step highlight */}
      <div style={{ padding:"9px 12px", borderRadius:9, marginBottom:10,
        background:`${activeStep.color}0c`,
        border:`2px solid ${activeStep.color}55`,
        borderLeft:`5px solid ${activeStep.color}` }}>
        <div style={{ display:"flex", alignItems:"center",
          gap:8, marginBottom:5 }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
            color:activeStep.color, fontWeight:700, letterSpacing:1 }}>
            {activeStep.time}
          </span>
          <span style={{ fontFamily:"'Playfair Display',serif",
            fontWeight:700, fontSize:14, color:activeStep.color }}>
            {activeStep.label}
          </span>
          {activeStep.urgent && (
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:T.red, letterSpacing:1, textTransform:"uppercase",
              background:"rgba(255,68,68,0.12)",
              border:"1px solid rgba(255,68,68,0.35)",
              borderRadius:4, padding:"1px 7px" }}>URGENT</span>
          )}
        </div>

        {activeStep.policy && (
          <div style={{ padding:"6px 9px", borderRadius:6, marginBottom:7,
            background:"rgba(0,229,192,0.08)",
            border:"1px solid rgba(0,229,192,0.3)",
            fontFamily:"'DM Sans',sans-serif", fontSize:10,
            color:T.teal, lineHeight:1.5 }}>
            📋 {activeStep.policy}
          </div>
        )}

        {activeStep.actions.map((action, i) => {
          const key   = `${activeStep.id}_${i}`;
          const done  = Boolean(stepsDone[key]);
          return (
            <button key={i} onClick={() => toggleStep(activeStep.id, i)}
              style={{ display:"flex", alignItems:"flex-start", gap:7,
                width:"100%", padding:"5px 7px", borderRadius:6,
                cursor:"pointer", textAlign:"left",
                marginBottom:3, transition:"all .12s",
                border:`1px solid ${done ? T.green+"44" : "rgba(26,53,85,0.3)"}`,
                background:done ? "rgba(61,255,160,0.06)" : "transparent" }}>
              <div style={{ width:15, height:15, borderRadius:3, flexShrink:0,
                marginTop:1,
                border:`2px solid ${done ? T.green : "rgba(42,79,122,0.5)"}`,
                background:done ? T.green : "transparent",
                display:"flex", alignItems:"center", justifyContent:"center" }}>
                {done && <span style={{ color:T.bg, fontSize:8, fontWeight:900 }}>✓</span>}
              </div>
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                color:done ? T.txt4 : T.txt2,
                textDecoration:done ? "line-through" : "none" }}>
                {action}
              </span>
            </button>
          );
        })}

        {/* Drug doses for active step */}
        {activeStep.drugs?.length > 0 && (
          <div style={{ marginTop:8, borderTop:"1px solid rgba(26,53,85,0.3)",
            paddingTop:8 }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:T.txt4, letterSpacing:1.5, textTransform:"uppercase",
              marginBottom:6 }}>Drug Options</div>
            {activeStep.drugs.filter(d => d.preferred).map((d, i) => {
              const wt    = parseFloat(weightKg) || 0;
              const dStep = activeStep.id === "s1"
                ? BZD_DRUGS.find(b => b.name === d.name)
                : activeStep.id === "s2"
                ? SECOND_LINE.find(b => b.name.split(" ")[0] === d.name.split(" ")[0])
                : null;
              return (
                <div key={i} style={{ padding:"6px 9px", borderRadius:7,
                  marginBottom:5,
                  background:`${activeStep.color}0a`,
                  border:`1px solid ${activeStep.color}25` }}>
                  <div style={{ display:"flex", alignItems:"baseline",
                    gap:8, marginBottom:2 }}>
                    <span style={{ fontFamily:"'Playfair Display',serif",
                      fontWeight:700, fontSize:12, color:activeStep.color }}>
                      {d.name}
                    </span>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace",
                      fontSize:8, color:T.txt4 }}>{d.route}</span>
                    {d.preferred && (
                      <span style={{ fontFamily:"'JetBrains Mono',monospace",
                        fontSize:7, color:T.teal, letterSpacing:1,
                        background:"rgba(0,229,192,0.1)",
                        border:"1px solid rgba(0,229,192,0.3)",
                        borderRadius:3, padding:"1px 5px" }}>PREFERRED</span>
                    )}
                  </div>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace",
                    fontSize:13, fontWeight:700,
                    color:activeStep.color, marginBottom:2 }}>
                    {d.dose}
                    {wt > 0 && dStep?.factor && ` → ${Math.min(dStep.factor * wt, dStep.maxMg).toFixed(1)} mg`}
                  </div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9,
                    color:T.txt4 }}>{d.note}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Step timeline */}
      <div style={{ display:"flex", gap:4, marginBottom:4 }}>
        {SE_STEPS.map(step => {
          const active = step.id === activeStep.id;
          const past   = step.timeRange[1] <= elapsedMin && !active;
          return (
            <div key={step.id} style={{ flex:1, textAlign:"center",
              padding:"5px 4px", borderRadius:6,
              background:active ? `${step.color}15` : past ? "rgba(61,255,160,0.05)" : "rgba(8,22,40,0.5)",
              border:`1px solid ${active ? step.color+"55" : past ? T.green+"33" : "rgba(26,53,85,0.3)"}` }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
                color:active ? step.color : past ? T.green : T.txt4,
                letterSpacing:0.5, fontWeight:active ? 700 : 400 }}>
                {step.time}
              </div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:8,
                color:active ? step.color : T.txt4,
                marginTop:1, lineHeight:1.3 }}>
                {step.label.split(" — ")[0]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────
export default function SeizureHub({
  embedded = false,
  demo, vitals, medications, allergies, pmhSelected,
}) {
  const navigate = useNavigate();

  const [sProto,    setSProto]    = useState(true);
  const [sBZD,      setSBZD]      = useState(false);
  const [s2ndLine,  setS2ndLine]  = useState(false);
  const [sTypes,    setSTypes]    = useState(false);
  const [sSpecial,  setSSpecial]  = useState(false);
  const [sPostIctal,setSPostIctal]= useState(false);

  const [weightKg,     setWeightKg]     = useState(vitals?.weight || demo?.weight || "");
  const [selected2nd,  setSelected2nd]  = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedSpec, setSelectedSpec] = useState(null);
  const [postChecked,  setPostChecked]  = useState({});

  const postDone = Object.values(postChecked).filter(Boolean).length;

  // BZD calc
  const bzdCalc = useMemo(() => {
    const w = parseFloat(weightKg) || 0;
    return BZD_DRUGS.map(d => ({
      ...d,
      calcDose: w > 0 ? Math.min(d.factor * w, d.maxMg) : null,
    }));
  }, [weightKg]);

  // Second-line dose calc
  const secondCalc = useMemo(() => {
    const w = parseFloat(weightKg) || 0;
    return SECOND_LINE.map(d => {
      const factors = { lev:60, fos:20, vpa:40 };
      const raw = w > 0 ? factors[d.id] * w : 0;
      return { ...d, calcDose:raw > 0 ? Math.min(raw, d.maxDose) : null };
    });
  }, [weightKg]);

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif",
      background:embedded ? "transparent" : T.bg,
      minHeight:embedded ? "auto" : "100vh",
      color:T.txt }}>

      <div style={{ maxWidth:1100, margin:"0 auto",
        padding:embedded ? "0" : "0 16px" }}>

        {/* ── Header ──────────────────────────────────────────────────────── */}
        {!embedded && (
          <div style={{ padding:"18px 0 14px" }}>
            <button onClick={() => navigate("/hub")}
              style={{ marginBottom:10, display:"inline-flex",
                alignItems:"center", gap:7,
                fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600,
                background:"rgba(14,37,68,0.7)",
                border:"1px solid rgba(42,79,122,0.5)",
                borderRadius:8, padding:"5px 14px",
                color:T.txt3, cursor:"pointer" }}>
              ← Back to Hub
            </button>
            <div style={{ display:"flex", alignItems:"center",
              gap:10, marginBottom:8 }}>
              <div style={{ background:"rgba(5,15,30,0.9)",
                border:"1px solid rgba(42,79,122,0.6)",
                borderRadius:10, padding:"5px 12px",
                display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:10, color:T.purple, letterSpacing:3 }}>NOTRYA</span>
                <span style={{ color:T.txt4, fontFamily:"'JetBrains Mono',monospace",
                  fontSize:10 }}>/</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:10, color:T.txt3, letterSpacing:2 }}>SEIZURE</span>
              </div>
              <div style={{ height:1, flex:1,
                background:"linear-gradient(90deg,rgba(255,68,68,0.5),transparent)" }} />
            </div>
            <h1 className="shimmer-text"
              style={{ fontFamily:"'Playfair Display',serif",
                fontSize:"clamp(22px,4vw,38px)", fontWeight:900,
                letterSpacing:-0.5, lineHeight:1.1 }}>
              Seizure & Status Epilepticus Hub
            </h1>
            <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
              color:T.txt4, marginTop:4 }}>
              SE Protocol · BZD Dosing · ACEP 2024 Level A Second-Line · Seizure Classification · Special Scenarios · Post-Ictal Checklist
            </p>
          </div>
        )}

        {embedded && (
          <div style={{ display:"flex", alignItems:"center",
            gap:8, marginBottom:12 }}>
            <span style={{ fontFamily:"'Playfair Display',serif",
              fontWeight:700, fontSize:15, color:T.red }}>
              Seizure / SE Protocol
            </span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:T.txt4, letterSpacing:1.5, textTransform:"uppercase",
              background:"rgba(255,68,68,0.1)",
              border:"1px solid rgba(255,68,68,0.25)",
              borderRadius:4, padding:"2px 7px" }}>
              ACEP 2024
            </span>
          </div>
        )}

        {/* ACEP 2024 policy banner */}
        <div style={{ padding:"8px 12px", borderRadius:9, marginBottom:10,
          background:"rgba(0,229,192,0.07)",
          border:"1px solid rgba(0,229,192,0.3)" }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.teal, letterSpacing:1.5, textTransform:"uppercase" }}>
            ACEP 2024 Level A: </span>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
            color:T.txt2 }}>
            Fosphenytoin, levetiracetam, and valproate have similar efficacy as
            second-line agents for seizures refractory to benzodiazepines.
            Choose based on clinical context — no agent is superior.
          </span>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, marginLeft:8 }}>
            Ann Emerg Med. 2024;84(1):e1–e12
          </span>
        </div>

        {/* Weight input — shared across all sections */}
        <div style={{ display:"flex", alignItems:"center", gap:8,
          padding:"7px 12px", borderRadius:8, marginBottom:10,
          background:"rgba(8,22,40,0.65)",
          border:`1px solid ${weightKg ? T.teal+"44" : "rgba(26,53,85,0.4)"}` }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
            color:T.txt4, letterSpacing:1 }}>PATIENT WEIGHT</span>
          <input type="number" value={weightKg}
            onChange={e => setWeightKg(e.target.value)}
            placeholder="kg"
            style={{ width:68, padding:"4px 8px",
              background:"rgba(14,37,68,0.75)",
              border:`1px solid ${weightKg ? T.teal+"55" : "rgba(42,79,122,0.4)"}`,
              borderRadius:6, outline:"none",
              fontFamily:"'JetBrains Mono',monospace", fontSize:15,
              fontWeight:700, color:T.teal }} />
          <span style={{ fontFamily:"'JetBrains Mono',monospace",
            fontSize:9, color:T.txt4 }}>kg</span>
          {!weightKg && (
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
              color:T.txt4 }}>
              Enter weight for weight-based dose calculations
            </span>
          )}
        </div>

        {/* ── 1. SE Protocol + Timer ───────────────────────────────────────── */}
        <Section title="Status Epilepticus Protocol" icon="⏱️" accent={T.red}
          open={sProto} onToggle={() => setSProto(p => !p)}
          badge={{ text:"Live Timer", color:T.red }}>
          <SETimer weightKg={weightKg} />

          {/* Full step list */}
          <div style={{ marginTop:10,
            fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, letterSpacing:1.5, textTransform:"uppercase",
            marginBottom:8 }}>Full SE Protocol Reference</div>
          {SE_STEPS.map(step => (
            <div key={step.id} style={{ marginBottom:6, padding:"8px 11px",
              borderRadius:8,
              background:`${step.color}07`,
              border:`1px solid ${step.color}25`,
              borderLeft:`3px solid ${step.color}` }}>
              <div style={{ display:"flex", alignItems:"center",
                gap:8, marginBottom:5 }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:9, fontWeight:700, color:step.color }}>
                  {step.time}
                </span>
                <span style={{ fontFamily:"'Playfair Display',serif",
                  fontWeight:700, fontSize:13, color:step.color }}>
                  {step.label}
                </span>
              </div>
              {step.policy && (
                <div style={{ padding:"5px 8px", borderRadius:6, marginBottom:5,
                  background:"rgba(0,229,192,0.07)",
                  border:"1px solid rgba(0,229,192,0.25)",
                  fontFamily:"'DM Sans',sans-serif", fontSize:10,
                  color:T.teal }}>📋 {step.policy}</div>
              )}
              {step.actions.map((a, i) => (
                <Bullet key={i} text={a} color={step.color} />
              ))}
              {step.drugs?.map((d, i) => (
                <div key={i} style={{ marginTop:4, padding:"5px 8px",
                  borderRadius:6, marginBottom:3,
                  background:`${step.color}0a`,
                  border:`1px solid ${step.color}20` }}>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace",
                    fontSize:10, fontWeight:700, color:step.color }}>
                    {d.name}
                  </span>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace",
                    fontSize:9, color:T.txt4, marginLeft:8 }}>
                    {d.dose}
                  </span>
                  {d.preferred && (
                    <span style={{ fontFamily:"'JetBrains Mono',monospace",
                      fontSize:7, color:T.teal, marginLeft:8,
                      letterSpacing:1 }}>PREFERRED</span>
                  )}
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9,
                    color:T.txt4, marginTop:2 }}>{d.note}</div>
                </div>
              ))}
            </div>
          ))}
        </Section>

        {/* ── 2. BZD Dosing Calculator ─────────────────────────────────────── */}
        <Section title="Benzodiazepine First-Line Dosing" icon="💉" accent={T.orange}
          open={sBZD} onToggle={() => setSBZD(p => !p)}>
          <div style={{ display:"grid",
            gridTemplateColumns:"repeat(auto-fill,minmax(230px,1fr))",
            gap:8 }}>
            {bzdCalc.map(d => (
              <div key={d.id} style={{ padding:"10px 12px", borderRadius:9,
                background:"rgba(14,37,68,0.55)",
                border:`1px solid ${d.preferred ? T.orange+"55" : "rgba(26,53,85,0.35)"}`,
                borderTop:`3px solid ${d.preferred ? T.orange : "rgba(26,53,85,0.5)"}` }}>
                <div style={{ display:"flex", alignItems:"center",
                  gap:7, marginBottom:4 }}>
                  <span style={{ fontFamily:"'Playfair Display',serif",
                    fontWeight:700, fontSize:13,
                    color:d.preferred ? T.orange : T.txt3 }}>
                    {d.name}
                  </span>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace",
                    fontSize:8, color:T.txt4 }}>{d.route}</span>
                  {d.preferred && (
                    <span style={{ fontFamily:"'JetBrains Mono',monospace",
                      fontSize:7, color:T.teal, letterSpacing:1,
                      background:"rgba(0,229,192,0.1)",
                      border:"1px solid rgba(0,229,192,0.3)",
                      borderRadius:3, padding:"1px 5px" }}>PREFERRED</span>
                  )}
                </div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:9, color:T.txt4, marginBottom:4 }}>
                  {d.factor} mg/kg (max {d.maxMg} mg)
                </div>
                {d.calcDose !== null && (
                  <div style={{ fontFamily:"'JetBrains Mono',monospace",
                    fontSize:22, fontWeight:700,
                    color:T.orange, lineHeight:1, marginBottom:4 }}>
                    {d.calcDose.toFixed(1)} mg
                  </div>
                )}
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9,
                  color:T.txt4, lineHeight:1.5 }}>{d.note}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── 3. Second-Line Selector ──────────────────────────────────────── */}
        <Section title="Second-Line Agent Selection — ACEP 2024 Level A" icon="⚖️" accent={T.teal}
          open={s2ndLine} onToggle={() => setS2ndLine(p => !p)}
          badge={{ text:"All 3 Equivalent", color:T.teal }}>

          <div style={{ padding:"8px 11px", borderRadius:8, marginBottom:10,
            background:"rgba(0,229,192,0.07)",
            border:"1px solid rgba(0,229,192,0.28)" }}>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
              color:T.txt2, lineHeight:1.65 }}>
              <strong style={{ color:T.teal }}>ACEP 2024 Level A:</strong> Fosphenytoin,
              levetiracetam, and valproate have similar efficacy. Selection should be based
              on clinical context, contraindications, and available monitoring.
              Levetiracetam is often preferred in ED settings due to its safety profile
              and lack of cardiac monitoring requirement.
            </div>
          </div>

          <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:10 }}>
            {secondCalc.map(d => (
              <button key={d.id}
                onClick={() => setSelected2nd(p => p===d.id ? null : d.id)}
                style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600,
                  fontSize:12, padding:"6px 16px", borderRadius:9,
                  cursor:"pointer", transition:"all .15s",
                  border:`1px solid ${selected2nd===d.id ? d.color+"77" : d.color+"33"}`,
                  background:selected2nd===d.id ? `${d.color}18` : `${d.color}08`,
                  color:selected2nd===d.id ? d.color : T.txt4 }}>
                {d.name}
                {d.calcDose && (
                  <span style={{ fontFamily:"'JetBrains Mono',monospace",
                    fontSize:9, marginLeft:8,
                    color:selected2nd===d.id ? d.color : T.txt4 }}>
                    {d.calcDose.toFixed(0)} mg
                  </span>
                )}
              </button>
            ))}
          </div>

          {selected2nd && (() => {
            const d = secondCalc.find(x => x.id === selected2nd);
            if (!d) return null;
            return (
              <div style={{ padding:"11px 13px", borderRadius:9,
                background:`${d.color}09`,
                border:`1px solid ${d.color}33`,
                borderLeft:`4px solid ${d.color}` }}>
                <div style={{ display:"flex", alignItems:"center",
                  gap:8, marginBottom:8, flexWrap:"wrap" }}>
                  <span style={{ fontFamily:"'Playfair Display',serif",
                    fontWeight:700, fontSize:15, color:d.color }}>
                    {d.name}
                  </span>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace",
                    fontSize:8, color:T.txt4 }}>{d.brand}</span>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace",
                    fontSize:8, color:d.color, letterSpacing:1,
                    background:`${d.color}15`, border:`1px solid ${d.color}35`,
                    borderRadius:4, padding:"1px 8px" }}>
                    {d.strength}
                  </span>
                </div>

                <div style={{ display:"grid",
                  gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
                  {[
                    { label:"Dose", val:d.calcDose
                        ? `${d.calcDose.toFixed(0)} mg (${d.dose})`
                        : d.dose, color:d.color },
                    { label:"Rate", val:d.rateMax, color:T.blue },
                    { label:"Avoid If", val:d.avoid, color:T.coral },
                    { label:"Prefer When", val:d.preferredWhen, color:T.teal },
                  ].map(f => (
                    <div key={f.label} style={{ padding:"7px 9px", borderRadius:7,
                      background:`${f.color}09`,
                      border:`1px solid ${f.color}22` }}>
                      <div style={{ fontFamily:"'JetBrains Mono',monospace",
                        fontSize:8, color:f.color, letterSpacing:1,
                        textTransform:"uppercase", marginBottom:3 }}>
                        {f.label}
                      </div>
                      <div style={{ fontFamily:"'DM Sans',sans-serif",
                        fontSize:11, color:T.txt2 }}>{f.val}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display:"grid",
                  gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  <div style={{ padding:"7px 9px", borderRadius:7,
                    background:"rgba(61,255,160,0.06)",
                    border:"1px solid rgba(61,255,160,0.2)" }}>
                    <div style={{ fontFamily:"'JetBrains Mono',monospace",
                      fontSize:8, color:T.green, letterSpacing:1,
                      textTransform:"uppercase", marginBottom:4 }}>Advantages</div>
                    {d.pros.map((p, i) => (
                      <Bullet key={i} text={p} color={T.green} />
                    ))}
                  </div>
                  <div style={{ padding:"7px 9px", borderRadius:7,
                    background:"rgba(255,107,107,0.06)",
                    border:"1px solid rgba(255,107,107,0.2)" }}>
                    <div style={{ fontFamily:"'JetBrains Mono',monospace",
                      fontSize:8, color:T.coral, letterSpacing:1,
                      textTransform:"uppercase", marginBottom:4 }}>Considerations</div>
                    {d.cons.map((c, i) => (
                      <Bullet key={i} text={c} color={T.coral} />
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </Section>

        {/* ── 4. Seizure Type Classification ──────────────────────────────── */}
        <Section title="Seizure Type Classification" icon="🔍" accent={T.purple}
          open={sTypes} onToggle={() => setSTypes(p => !p)}>
          <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:10 }}>
            {SEIZURE_TYPES.map(t => (
              <button key={t.type}
                onClick={() => setSelectedType(p => p===t.type ? null : t.type)}
                style={{ display:"flex", alignItems:"center", gap:6,
                  fontFamily:"'DM Sans',sans-serif", fontWeight:600,
                  fontSize:11, padding:"5px 12px", borderRadius:20,
                  cursor:"pointer", transition:"all .12s",
                  border:`1px solid ${selectedType===t.type ? t.color+"77" : t.color+"33"}`,
                  background:selectedType===t.type ? `${t.color}18` : `${t.color}08`,
                  color:selectedType===t.type ? t.color : T.txt4 }}>
                <span>{t.icon}</span>{t.type.split(" ")[0]}
              </button>
            ))}
          </div>
          {selectedType && (() => {
            const t = SEIZURE_TYPES.find(x => x.type === selectedType);
            if (!t) return null;
            return (
              <div style={{ padding:"11px 13px", borderRadius:9,
                background:`${t.color}08`,
                border:`1px solid ${t.color}30`,
                borderTop:`3px solid ${t.color}` }}>
                <div style={{ display:"flex", alignItems:"center",
                  gap:8, marginBottom:8 }}>
                  <span style={{ fontSize:20 }}>{t.icon}</span>
                  <span style={{ fontFamily:"'Playfair Display',serif",
                    fontWeight:700, fontSize:15, color:t.color }}>
                    {t.type}
                  </span>
                </div>
                <div style={{ display:"grid",
                  gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:8 }}>
                  {[
                    { label:"Clinical Features", items:t.features, color:t.color },
                    { label:"Etiologies",         items:t.etiologies, color:T.orange },
                    { label:"EEG",                items:[t.eeg], color:T.blue },
                  ].map(sec => (
                    <div key={sec.label} style={{ padding:"7px 9px", borderRadius:8,
                      background:`${sec.color}09`,
                      border:`1px solid ${sec.color}22` }}>
                      <div style={{ fontFamily:"'JetBrains Mono',monospace",
                        fontSize:8, color:sec.color, letterSpacing:1.3,
                        textTransform:"uppercase", marginBottom:5 }}>
                        {sec.label}
                      </div>
                      {sec.items.map((item, i) => (
                        <Bullet key={i} text={item} color={sec.color} />
                      ))}
                    </div>
                  ))}
                </div>
                <div style={{ padding:"7px 10px", borderRadius:7,
                  background:"rgba(155,109,255,0.07)",
                  border:"1px solid rgba(155,109,255,0.25)" }}>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace",
                    fontSize:8, color:T.purple, letterSpacing:1,
                    textTransform:"uppercase" }}>💎 Pearl: </span>
                  <span style={{ fontFamily:"'DM Sans',sans-serif",
                    fontSize:11, color:T.txt2 }}>{t.pearl}</span>
                </div>
              </div>
            );
          })()}
        </Section>

        {/* ── 5. Special Scenarios ─────────────────────────────────────────── */}
        <Section title="Special Scenarios" icon="⚠️" accent={T.gold}
          open={sSpecial} onToggle={() => setSSpecial(p => !p)}>
          <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:10 }}>
            {SPECIAL_SCENARIOS.map(sc => (
              <button key={sc.id}
                onClick={() => setSelectedSpec(p => p===sc.id ? null : sc.id)}
                style={{ display:"flex", alignItems:"center", gap:6,
                  fontFamily:"'DM Sans',sans-serif", fontWeight:600,
                  fontSize:11, padding:"5px 12px", borderRadius:20,
                  cursor:"pointer", transition:"all .12s",
                  border:`1px solid ${selectedSpec===sc.id ? sc.color+"77" : sc.color+"33"}`,
                  background:selectedSpec===sc.id ? `${sc.color}18` : `${sc.color}08`,
                  color:selectedSpec===sc.id ? sc.color : T.txt4 }}>
                <span>{sc.icon}</span>{sc.label}
              </button>
            ))}
          </div>
          {selectedSpec && (() => {
            const sc = SPECIAL_SCENARIOS.find(x => x.id === selectedSpec);
            if (!sc) return null;
            return (
              <div style={{ padding:"11px 13px", borderRadius:9,
                background:`${sc.color}08`,
                border:`1px solid ${sc.color}30`,
                borderLeft:`4px solid ${sc.color}` }}>
                <div style={{ padding:"7px 10px", borderRadius:7,
                  background:`${sc.color}0f`,
                  border:`1px solid ${sc.color}33`,
                  marginBottom:8 }}>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace",
                    fontSize:8, color:sc.color, letterSpacing:1,
                    textTransform:"uppercase" }}>⚡ Alert: </span>
                  <span style={{ fontFamily:"'DM Sans',sans-serif",
                    fontSize:11, color:sc.color, fontWeight:600 }}>
                    {sc.alert}
                  </span>
                </div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                  color:T.txt3, lineHeight:1.6, marginBottom:8 }}>
                  {sc.presentation}
                </div>
                <div style={{ marginBottom:8 }}>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                    color:T.txt4, letterSpacing:1.5, textTransform:"uppercase",
                    marginBottom:6 }}>Treatment</div>
                  {sc.treatment.map((t, i) => (
                    <Bullet key={i} text={t} color={sc.color} />
                  ))}
                </div>
                <div style={{ padding:"7px 10px", borderRadius:7,
                  background:"rgba(155,109,255,0.07)",
                  border:"1px solid rgba(155,109,255,0.25)" }}>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace",
                    fontSize:8, color:T.purple, letterSpacing:1,
                    textTransform:"uppercase" }}>💎 Note: </span>
                  <span style={{ fontFamily:"'DM Sans',sans-serif",
                    fontSize:11, color:T.txt2 }}>{sc.note}</span>
                </div>
              </div>
            );
          })()}
        </Section>

        {/* ── 6. Post-Ictal Checklist ──────────────────────────────────────── */}
        <Section title="Post-Ictal Management Checklist" icon="✅" accent={T.green}
          open={sPostIctal} onToggle={() => setSPostIctal(p => !p)}
          badge={{ text:`${postDone}/${POST_ICTAL.length}`, color:postDone === POST_ICTAL.length ? T.green : T.txt4 }}>
          <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
            {POST_ICTAL.map(item => {
              const checked = Boolean(postChecked[item.id]);
              return (
                <button key={item.id}
                  onClick={() => setPostChecked(p => ({ ...p, [item.id]:!p[item.id] }))}
                  style={{ display:"flex", alignItems:"flex-start", gap:8,
                    padding:"8px 10px", borderRadius:8, cursor:"pointer",
                    textAlign:"left", transition:"all .12s",
                    border:`1px solid ${checked ? "rgba(61,255,160,0.35)" : "rgba(26,53,85,0.35)"}`,
                    background:checked ? "rgba(61,255,160,0.06)" : "rgba(8,22,40,0.45)" }}>
                  <div style={{ width:16, height:16, borderRadius:4, flexShrink:0,
                    marginTop:1,
                    border:`2px solid ${checked ? T.green : "rgba(42,79,122,0.5)"}`,
                    background:checked ? T.green : "transparent",
                    display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {checked && <span style={{ color:T.bg, fontSize:8, fontWeight:900 }}>✓</span>}
                  </div>
                  <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11.5,
                    color:checked ? T.txt4 : T.txt,
                    textDecoration:checked ? "line-through" : "none" }}>
                    {item.text}
                  </span>
                </button>
              );
            })}
          </div>
          {postDone === POST_ICTAL.length && (
            <div style={{ marginTop:10, padding:"8px 12px", borderRadius:8,
              background:"rgba(61,255,160,0.08)",
              border:"1px solid rgba(61,255,160,0.3)",
              fontFamily:"'DM Sans',sans-serif", fontSize:11,
              color:T.green, textAlign:"center" }}>
              ✓ Post-ictal checklist complete
            </div>
          )}
        </Section>

        {!embedded && (
          <div style={{ textAlign:"center", padding:"24px 0 16px",
            fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, letterSpacing:1.5 }}>
            NOTRYA SEIZURE HUB · ACEP CLINICAL POLICY 2024 · AES STATUS EPILEPTICUS GUIDELINE 2016 · VERIFY WITH LOCAL PROTOCOLS
          </div>
        )}
      </div>
    </div>
  );
}