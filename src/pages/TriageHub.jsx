import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

// ── Font Injection ──────────────────────────────────────────────────
(() => {
  if (document.getElementById("triage-fonts")) return;
  const l = document.createElement("link"); l.id = "triage-fonts";
  l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "triage-css";
  s.textContent = `
    *{box-sizing:border-box;margin:0;padding:0;}
    ::-webkit-scrollbar{width:3px;height:3px;}
    ::-webkit-scrollbar-track{background:transparent;}
    ::-webkit-scrollbar-thumb{background:rgba(42,79,122,0.5);border-radius:2px;}
    @keyframes fadeSlide{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
    @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
    .fade-in{animation:fadeSlide .3s ease forwards;}
    .shimmer-text{
      background:linear-gradient(90deg,#e8f0fe 0%,#ffffff 35%,#ff6b6b 55%,#f5c842 75%,#e8f0fe 100%);
      background-size:250% auto;
      -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
      animation:shimmer 5s linear infinite;
    }
    .triage-card:hover{transform:translateY(-2px);transition:transform .2s ease;}
  `;
  document.head.appendChild(s);
})();

const T = {
  bg:"#050f1e", panel:"#081628", card:"#0b1e36", up:"#0e2544",
  b:"rgba(26,53,85,0.8)", bhi:"rgba(42,79,122,0.9)",
  txt:"#e8f0fe", txt2:"#8aaccc", txt3:"#4a6a8a", txt4:"#2e4a6a",
  red:"#ff4444", orange:"#ff9f43", yellow:"#f5c842", green:"#3dffa0",
  blue:"#3b9eff", purple:"#9b6dff", teal:"#00e5c0", coral:"#ff6b6b",
  cyan:"#00d4ff",
};

const glass = { backdropFilter:"blur(24px) saturate(200%)", WebkitBackdropFilter:"blur(24px) saturate(200%)", background:"rgba(8,22,40,0.75)", border:"1px solid rgba(42,79,122,0.35)", borderRadius:16 };

// ── ESI Data ────────────────────────────────────────────────────────
const ESI_LEVELS = [
  {
    level:1, label:"Immediate", color:"#ff2020", textColor:"#fff",
    desc:"Requires immediate life-saving intervention",
    timeToMD:"Now — physician at bedside",
    resources:"Unlimited",
    vitals:"Any critical vital sign",
    examples:["Cardiac arrest / PEA / VF","Respiratory arrest / apnea","Severe respiratory distress / intubation needed","Unresponsive / GCS < 8","Hemodynamic instability (SBP < 80)","Active major hemorrhage","Anaphylactic shock"],
    criteria:"Life-threatening condition requiring immediate MD intervention",
    disposition:"Resuscitation bay / immediate intervention",
  },
  {
    level:2, label:"Emergent", color:"#ff6b00", textColor:"#fff",
    desc:"High-risk situation or altered mental status / severe pain",
    timeToMD:"< 15 minutes",
    resources:"Unlimited",
    vitals:"Concerning vitals (e.g., HR > 150, SBP < 90, SpO₂ < 90%)",
    examples:["Chest pain — possible ACS","Stroke symptoms (FAST positive)","Severe sepsis (T > 38.5 + 2 SIRS)","Active suicidal ideation with plan","Altered mental status (new)","GI bleed with hemodynamic changes","Ectopic pregnancy / ruptured ovarian cyst","Pediatric high-risk fever (< 28 days, < 3 months)"],
    criteria:"High-risk situation OR confused/lethargic/disoriented OR severe pain/distress",
    disposition:"Rapid assessment room — immediate MD eval",
  },
  {
    level:3, label:"Urgent", color:"#f5c842", textColor:"#050f1e",
    desc:"Multiple resources required but stable vitals",
    timeToMD:"< 30 minutes",
    resources:"≥ 2 resources anticipated",
    vitals:"Normal or mildly abnormal",
    examples:["Moderate abdominal pain","Head injury — minor","Lacerations requiring closure","Asthma — moderate (SpO₂ > 92%)","UTI with fever (> 3 months)","Back pain with neurological symptoms","Fracture — stable, not high-risk","Diabetic with high glucose, alert"],
    criteria:"Stable vitals + requires ≥ 2 resources (labs, imaging, IV fluids, consult, etc.)",
    disposition:"ED main — standard workup",
  },
  {
    level:4, label:"Less Urgent", color:"#3b9eff", textColor:"#fff",
    desc:"One resource required",
    timeToMD:"< 60 minutes",
    resources:"1 resource",
    vitals:"Normal",
    examples:["Simple laceration (< 2 cm, clean)","Earache / otitis media","Sore throat without stridor","Sprained ankle (mild)","UTI symptoms — no fever","Constipation","Minor allergic reaction (skin only)"],
    criteria:"Stable vitals + requires exactly 1 resource (e.g., one lab, one X-ray)",
    disposition:"Fast track / urgent care area",
  },
  {
    level:5, label:"Non-Urgent", color:"#3dffa0", textColor:"#050f1e",
    desc:"No resources needed — exam and/or prescription only",
    timeToMD:"< 120 minutes",
    resources:"None",
    vitals:"Normal",
    examples:["Medication refill","Suture removal","Cold / congestion — mild","Minor rash — stable","Immunization request","TB test read","Prescription lost"],
    criteria:"Stable vitals + no resources anticipated beyond H&P and/or Rx",
    disposition:"Fast track / redirect to PCP / urgent care",
  },
];

// ── START Triage ────────────────────────────────────────────────────
const START_STEPS = [
  {
    step:1, label:"Can the patient walk?",
    yes:{ color:"#3dffa0", tag:"MINOR (GREEN)", next:null, action:"Tag green — redirect to separate area. Monitor but not immediate priority." },
    no:{ color:null, tag:null, next:2, action:"Proceed to Step 2" },
  },
  {
    step:2, label:"Is the patient breathing?",
    yes:{ color:null, tag:null, next:3, action:"Proceed to Step 3 — assess respiratory rate" },
    no:{
      color:null, tag:null, next:"maneuver",
      action:"Open airway (head-tilt/chin-lift or jaw thrust). If breathing resumes → IMMEDIATE (RED). If still no breathing → EXPECTANT (BLACK)."
    },
  },
  {
    step:3, label:"Respiratory Rate?",
    options:[
      { label:"< 10 or > 30 bpm", color:"#ff2020", tag:"IMMEDIATE (RED)", action:"Tag RED — immediate life-threatening" },
      { label:"10–30 bpm", color:null, tag:null, next:4, action:"Proceed to Step 4 — assess perfusion" },
    ]
  },
  {
    step:4, label:"Radial Pulse / Capillary Refill?",
    options:[
      { label:"No radial pulse OR CRT > 2 sec", color:"#ff2020", tag:"IMMEDIATE (RED)", action:"Tag RED + control hemorrhage if visible" },
      { label:"Radial pulse present AND CRT ≤ 2 sec", color:null, tag:null, next:5, action:"Proceed to Step 5 — mental status" },
    ]
  },
  {
    step:5, label:"Can the patient follow simple commands?",
    yes:{ color:"#f5c842", tag:"DELAYED (YELLOW)", action:"Tag YELLOW — delayed treatment, stable" },
    no:{ color:"#ff2020", tag:"IMMEDIATE (RED)", action:"Tag RED — unresponsive or cannot follow commands" },
  },
];

const START_TAGS = [
  { color:"#3dffa0", label:"MINOR",     textColor:"#050f1e", desc:"Walking wounded — can ambulate", examples:["Minor lacerations","Sprains","Contusions"] },
  { color:"#f5c842", label:"DELAYED",   textColor:"#050f1e", desc:"Serious but stable — delayed tx OK", examples:["Stable fractures","Burns < 20% BSA","Responsive + radial pulse present"] },
  { color:"#ff2020", label:"IMMEDIATE", textColor:"#fff",    desc:"Life-threatening — treat immediately", examples:["Airway compromise","RR < 10 or > 30","No radial pulse","Cannot follow commands"] },
  { color:"#222",    label:"EXPECTANT", textColor:"#888",    desc:"Unsurvivable given current resources", examples:["Apneic after airway opened","Burns > 60% BSA with trauma","Devastating head injury"] },
];

// ── SALT Triage ─────────────────────────────────────────────────────
const SALT_STEPS = [
  { id:"sort", title:"S — Sort", icon:"📋", color:T.teal, desc:"Global sorting of all patients simultaneously. Assess who can walk, who is waving/purposefully moving, and who is still/obvious life threat." },
  { id:"assess", title:"A — Assess", icon:"🔍", color:T.blue, desc:"Individual assessment in priority order: (1) Still/obvious life threat → (2) Waving/purposeful movement → (3) Walking wounded" },
  { id:"lifesaving", title:"L — Lifesaving Interventions", icon:"🩺", color:T.coral, desc:"Perform only immediate lifesaving interventions before tagging: hemorrhage control · open airway · decompress tension PTX · antidote administration · auto-injectors" },
  { id:"treatment", title:"T — Treatment/Transport", icon:"🚑", color:T.orange, desc:"Tag and initiate treatment or transport based on assessment. Assign to appropriate treatment area or transport vehicle based on tag color." },
];

const SALT_TAGS = [
  { color:"#3dffa0", label:"MINIMAL",   textColor:"#050f1e", desc:"Minor injuries, can self-care. Low-priority queue." },
  { color:"#f5c842", label:"DELAYED",   textColor:"#050f1e", desc:"Serious injuries not immediately life-threatening. Can wait." },
  { color:"#ff2020", label:"IMMEDIATE", textColor:"#fff",    desc:"Life-threatening but salvageable. Priority 1 treatment." },
  { color:"#555",    label:"EXPECTANT", textColor:"#999",    desc:"Unlikely to survive given available resources. Comfort care." },
  { color:"#222",    label:"DEAD",      textColor:"#666",    desc:"No respirations after airway repositioning." },
];

// ── Vital Sign Danger Thresholds ────────────────────────────────────
const VITAL_THRESHOLDS = [
  {
    vital:"Heart Rate (HR)", icon:"❤️", unit:"bpm",
    rows:[
      { label:"Sinus Brady",    range:"< 50",   level:"critical", color:T.coral,  action:"12-lead ECG, symptom assessment, atropine if symptomatic" },
      { label:"Normal",         range:"60–100", level:"normal",   color:T.green,  action:"" },
      { label:"Tachycardia",    range:"> 100",  level:"moderate", color:T.yellow, action:"Assess cause: pain, fever, dehydration, PE, dysrhythmia" },
      { label:"Severe Brady",   range:"< 40",   level:"emergent", color:T.red,    action:"Transcutaneous pacing, IV atropine 0.5 mg, cardiology stat" },
      { label:"SVT / Rapid AF", range:"> 150",  level:"emergent", color:T.red,    action:"12-lead, vagal maneuvers, adenosine, cardioversion if unstable" },
    ]
  },
  {
    vital:"Blood Pressure (SBP)", icon:"🩸", unit:"mmHg",
    rows:[
      { label:"Hypotension",   range:"< 90",    level:"emergent", color:T.red,    action:"IV access ×2, fluid bolus, assess for sepsis/hemorrhage/cardiogenic" },
      { label:"Low-Normal",    range:"90–119",  level:"moderate", color:T.yellow, action:"Monitor closely, assess symptoms, trend" },
      { label:"Normal",        range:"120–139", level:"normal",   color:T.green,  action:"" },
      { label:"Stage 1 HTN",   range:"140–159", level:"moderate", color:T.yellow, action:"Asymptomatic: recheck, treat pain/anxiety first. Symptomatic: workup" },
      { label:"Stage 2 HTN",   range:"160–179", level:"high",     color:T.orange, action:"Assess for hypertensive urgency vs emergency (end-organ damage?)" },
      { label:"HTN Emergency", range:"≥ 180",   level:"emergent", color:T.red,    action:"End-organ damage assessment: ECG, CXR, troponin, BMP, CT head if AMS" },
    ]
  },
  {
    vital:"Respiratory Rate (RR)", icon:"🫁", unit:"breaths/min",
    rows:[
      { label:"Bradypnea",     range:"< 10",  level:"emergent", color:T.red,    action:"Stimulate patient, assess opioid toxicity, prepare for intubation" },
      { label:"Normal",        range:"12–20", level:"normal",   color:T.green,  action:"" },
      { label:"Tachypnea",     range:"21–29", level:"moderate", color:T.yellow, action:"Assess cause: pain, anxiety, PE, pneumonia, metabolic acidosis" },
      { label:"Severe Tachypnea",range:"≥ 30",level:"emergent", color:T.red,    action:"High-flow O₂, ABG, CXR, prepare for possible intubation" },
    ]
  },
  {
    vital:"SpO₂", icon:"💧", unit:"%",
    rows:[
      { label:"Critical Hypoxia",  range:"< 88",  level:"emergent", color:T.red,    action:"BVM immediately, high-flow O₂, urgent intubation preparation" },
      { label:"Hypoxia",           range:"88–93", level:"high",     color:T.orange, action:"Supplemental O₂ via NRB, investigate cause, ABG" },
      { label:"Low-Normal (COPD)", range:"94–95", level:"moderate", color:T.yellow, action:"O₂ if symptomatic, target 88–92% in COPD patients" },
      { label:"Normal",            range:"96–100",level:"normal",   color:T.green,  action:"" },
    ]
  },
  {
    vital:"Temperature", icon:"🌡️", unit:"°F",
    rows:[
      { label:"Hypothermia Sev.",  range:"< 95",     level:"emergent", color:T.red,    action:"Active rewarming, cardiac monitoring (Osborn J-waves), warm IVF" },
      { label:"Hypothermia Mild.", range:"95–96.8",  level:"high",     color:T.orange, action:"Passive rewarming, warm blankets, monitor for arrhythmia" },
      { label:"Normal",            range:"97–99.5",  level:"normal",   color:T.green,  action:"" },
      { label:"Low-Grade Fever",   range:"99.6–100.9",level:"moderate",color:T.yellow, action:"Assess source, comfort measures" },
      { label:"Fever",             range:"101–103.9",level:"high",     color:T.orange, action:"Source evaluation, antipyretics, blood cultures if sepsis concern" },
      { label:"High Fever",        range:"≥ 104",    level:"emergent", color:T.red,    action:"Rapid cooling, sepsis workup, LP if meningism, acetaminophen IV" },
    ]
  },
  {
    vital:"GCS / Mental Status", icon:"🧠", unit:"points",
    rows:[
      { label:"Severe Impairment", range:"3–8",   level:"emergent", color:T.red,    action:"Airway protection, RSI preparation, emergent neurology/neurosurgery" },
      { label:"Moderate Impairment",range:"9–12",  level:"high",     color:T.orange, action:"Close monitoring, head CT, toxicology screen, glucose check" },
      { label:"Mild Impairment",   range:"13–14",  level:"moderate", color:T.yellow, action:"Thorough neuro exam, glucose, CT if indicated, serial assessments" },
      { label:"Normal",            range:"15",     level:"normal",   color:T.green,  action:"" },
    ]
  },
];

// ── Chief Complaint Quick Sort ─────────────────────────────────────
const CC_SORT = [
  { cc:"Chest Pain",       esi:2, flag:"🚨", color:T.coral,  flags:["Rule out ACS","ST changes = ESI 1","Diaphoresis = ESI 1","Hemodynamic instability = ESI 1"], workup:"12-lead ECG within 10 min · Troponin · CXR · IV access" },
  { cc:"Shortness of Breath",esi:2,flag:"🚨",color:T.coral,  flags:["SpO₂ < 90% = ESI 1","Silent chest = ESI 1","Stridor = ESI 1/2","Accessory muscle use = ESI 2"], workup:"SpO₂, RR, POCUS · CXR · ABG if severe · BNP/D-dimer per presentation" },
  { cc:"Altered Mental Status",esi:2,flag:"🚨",color:T.coral, flags:["GCS < 8 = ESI 1","Focal deficit = ESI 2","New onset = ESI 2","Any sign of herniation = ESI 1"], workup:"Glucose stat · CT head · BMP · Tox screen · Blood cultures if fever" },
  { cc:"Stroke Symptoms",  esi:2, flag:"🚨", color:T.coral,  flags:["Last known well time critical","NIHSS > 6 = severe","tPA window ≤ 4.5h","Activate stroke alert"], workup:"CT head w/o contrast STAT · CTA head/neck · Glucose · CBC · INR · Activate code stroke" },
  { cc:"Seizure",          esi:2, flag:"⚠️", color:T.orange, flags:["Active seizure = ESI 1","Post-ictal alone = ESI 2","New-onset = ESI 2","Febrile child = ESI 2–3"], workup:"Glucose · BMP · Tox screen · EEG if persistent · CT head if new-onset adult" },
  { cc:"Abdominal Pain",   esi:3, flag:"⚠️", color:T.orange, flags:["Hypotension + abd pain = ESI 1 (AAA)","Rigid abdomen = ESI 2","Known AAA = ESI 1","Peritoneal signs = ESI 2"], workup:"BMP · CBC · Lipase · UA · β-hCG (females) · CT abd/pelvis per presentation" },
  { cc:"Trauma / MVC",     esi:1, flag:"🚨", color:T.coral,  flags:["Activate trauma team per protocol","Any unstable vitals = ESI 1","High-mechanism = ESI 1–2","Loss of consciousness = ESI 2"], workup:"Primary survey ABCDE · Trauma activation · FAST · CXR · Pelvis XR · CT per mechanism" },
  { cc:"Fever Adult",      esi:3, flag:"📋", color:T.blue,   flags:["Immunocompromised = ESI 2","T > 104°F = ESI 2","Signs of sepsis = ESI 2","Elderly altered = ESI 2"], workup:"CBC · CMP · UA/culture · Blood cultures × 2 · CXR if respiratory sx · Lactate if sepsis concern" },
  { cc:"Headache",         esi:3, flag:"⚠️", color:T.orange, flags:["Thunderclap = ESI 1–2","Worst headache of life = ESI 2","Fever + stiff neck = ESI 2","Focal neuro = ESI 2"], workup:"BP check · Neuro exam · CT head if subarachnoid concern · LP if CT negative with high suspicion" },
  { cc:"Back Pain",        esi:4, flag:"📋", color:T.blue,   flags:["Cauda equina sx = ESI 2","Saddle anesthesia = ESI 2","Bowel/bladder retention = ESI 2","AAA concern = ESI 1"], workup:"Neuro exam · Straight-leg raise · MRI if cauda equina concern · CT/US if vascular concern" },
  { cc:"Laceration",       esi:4, flag:"📋", color:T.blue,   flags:["Active arterial bleeding = ESI 1–2","Neurovascular compromise = ESI 2","Tendon/bone visible = ESI 2–3","Face/cosmetic area = ESI 3–4"], workup:"Wound assessment · Neurovascular exam distal · XR if bone injury suspected · Tetanus status" },
  { cc:"Psychiatric",      esi:2, flag:"⚠️", color:T.orange, flags:["Active suicidal intent + plan = ESI 2","Homicidal ideation = ESI 2","Psychosis with danger = ESI 2","Altered = ESI 1–2"], workup:"Safety assessment · Glucose · Tox screen · Medical clearance CBC/BMP · Mental status exam" },
];

// ── Tabs ─────────────────────────────────────────────────────────────
const TABS = [
  { id:"esi",      label:"ESI Levels",     icon:"🏷️" },
  { id:"start",    label:"START Triage",   icon:"🔴" },
  { id:"salt",     label:"SALT Triage",    icon:"🌊" },
  { id:"vitals",   label:"Danger Vitals",  icon:"📊" },
  { id:"ccsort",   label:"Chief Complaint",icon:"🔍" },
];

// ── Components ──────────────────────────────────────────────────────
function ESICard({ esi, expanded, onToggle }) {
  return (
    <div className="triage-card fade-in" onClick={onToggle} style={{
      borderRadius:14, border:`2px solid ${expanded ? esi.color : esi.color+"44"}`,
      background:expanded ? `linear-gradient(135deg,${esi.color}18,rgba(8,22,40,0.9))` : "rgba(8,22,40,0.7)",
      cursor:"pointer", transition:"all .2s", overflow:"hidden",
    }}>
      <div style={{display:"flex",alignItems:"center",gap:14,padding:"16px 20px"}}>
        <div style={{
          width:52, height:52, borderRadius:12, flexShrink:0,
          background:esi.color, display:"flex", alignItems:"center", justifyContent:"center",
          boxShadow:`0 0 ${expanded?"20px":"8px"} ${esi.color}60`,
        }}>
          <span style={{fontFamily:"JetBrains Mono",fontSize:22,fontWeight:700,color:esi.textColor}}>{esi.level}</span>
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:3}}>
            <span style={{fontFamily:"JetBrains Mono",fontSize:13,fontWeight:700,color:esi.color}}>ESI {esi.level} — {esi.label}</span>
            <span style={{fontFamily:"JetBrains Mono",fontSize:9,color:esi.color,background:`${esi.color}22`,padding:"2px 7px",borderRadius:4,border:`1px solid ${esi.color}44`}}>{esi.resources}</span>
          </div>
          <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,marginBottom:2}}>{esi.desc}</div>
          <div style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.txt3}}>MD Time: {esi.timeToMD}</div>
        </div>
        <span style={{color:T.txt4,fontSize:14}}>{expanded?"▲":"▼"}</span>
      </div>
      {expanded && (
        <div className="fade-in" style={{padding:"0 20px 18px",borderTop:"1px solid rgba(42,79,122,0.3)"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,paddingTop:14}}>
            <div>
              <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Clinical Examples</div>
              {esi.examples.map((ex,i) => (
                <div key={i} style={{display:"flex",gap:8,marginBottom:5,alignItems:"flex-start"}}>
                  <span style={{color:esi.color,fontFamily:"JetBrains Mono",fontSize:11,minWidth:10}}>▸</span>
                  <span style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.5}}>{ex}</span>
                </div>
              ))}
            </div>
            <div>
              <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Criteria</div>
              <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt,lineHeight:1.6,marginBottom:12}}>{esi.criteria}</div>
              <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Disposition</div>
              <div style={{fontFamily:"DM Sans",fontSize:12,color:esi.color,fontWeight:600}}>{esi.disposition}</div>
              {esi.vitals && (
                <>
                  <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:1,marginBottom:6,marginTop:10}}>Vital Sign Concern</div>
                  <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2}}>{esi.vitals}</div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function VitalRow({ row }) {
  const levelColors = { emergent:T.red, high:T.orange, moderate:T.yellow, normal:T.green };
  const c = levelColors[row.level] || T.txt3;
  return (
    <div style={{display:"grid",gridTemplateColumns:"120px 100px 80px 1fr",gap:10,alignItems:"center",padding:"8px 12px",background:"rgba(8,22,40,0.5)",borderRadius:9,border:`1px solid ${row.level==="emergent"?c+"44":"rgba(42,79,122,0.2)"}`,marginBottom:5,animation:row.level==="emergent"?"pulse 2s ease-in-out infinite":undefined}}>
      <span style={{fontFamily:"DM Sans",fontWeight:600,fontSize:12,color:row.level==="normal"?T.txt3:T.txt}}>{row.label}</span>
      <span style={{fontFamily:"JetBrains Mono",fontSize:12,fontWeight:700,color:c}}>{row.range}</span>
      <span style={{fontFamily:"JetBrains Mono",fontSize:9,fontWeight:700,color:c,background:`${c}18`,padding:"2px 7px",borderRadius:4,textTransform:"uppercase",textAlign:"center"}}>{row.level}</span>
      <span style={{fontFamily:"DM Sans",fontSize:11,color:T.txt3,lineHeight:1.4}}>{row.action}</span>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────
export default function TriageHub() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("esi");
  const [esiExpanded, setEsiExpanded] = useState(null);
  const [startStep, setStartStep] = useState(null);
  const [vitalExpanded, setVitalExpanded] = useState(null);
  const [ccSearch, setCcSearch] = useState("");

  const filteredCC = useMemo(() =>
    CC_SORT.filter(c => c.cc.toLowerCase().includes(ccSearch.toLowerCase())),
    [ccSearch]
  );

  return (
    <div style={{fontFamily:"DM Sans", background:T.bg, minHeight:"100vh", position:"relative", overflow:"hidden"}}>
      {/* Ambient BG */}
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0}}>
        <div style={{position:"absolute",top:"-15%",left:"-10%",width:"50%",height:"50%",background:"radial-gradient(circle,rgba(255,107,107,0.12) 0%,transparent 70%)"}}/>
        <div style={{position:"absolute",bottom:"-10%",right:"-5%",width:"45%",height:"45%",background:"radial-gradient(circle,rgba(59,158,255,0.1) 0%,transparent 70%)"}}/>
      </div>

      <div style={{position:"relative",zIndex:1,maxWidth:1280,margin:"0 auto",padding:"0 16px"}}>

        {/* Header */}
        <div style={{padding:"22px 0 14px"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
            <button onClick={()=>navigate("/hub")} style={{fontFamily:"DM Sans",fontSize:12,fontWeight:600,padding:"6px 14px",borderRadius:10,border:"1px solid rgba(255,107,107,0.4)",background:"rgba(255,107,107,0.1)",color:T.coral,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>← Hub</button>
            <div style={{backdropFilter:"blur(40px)",WebkitBackdropFilter:"blur(40px)",background:"rgba(5,15,30,0.85)",border:"1px solid rgba(26,53,85,0.6)",borderRadius:10,padding:"5px 12px",display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.teal,letterSpacing:3}}>NOTRYA</span>
              <span style={{color:T.txt4,fontFamily:"JetBrains Mono",fontSize:10}}>/</span>
              <span style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.txt3,letterSpacing:2}}>TRIAGE</span>
            </div>
            <div style={{height:1,flex:1,background:"linear-gradient(90deg,rgba(42,79,122,0.6),transparent)"}}/>
          </div>
          <h1 className="shimmer-text" style={{fontFamily:"Playfair Display",fontSize:"clamp(28px,5vw,48px)",fontWeight:900,letterSpacing:-1,lineHeight:1.1}}>
            Triage Hub
          </h1>
          <p style={{fontFamily:"DM Sans",fontSize:13,color:T.txt3,marginTop:5,letterSpacing:.3}}>ESI · START · SALT · Danger Vitals · Chief Complaint Sorting</p>
        </div>

        {/* Stat Banner */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:10,marginBottom:18}}>
          {[
            {label:"ESI 1 Goal",  value:"Immediate",    sub:"Physician at bedside NOW", color:T.red   },
            {label:"ESI 2 Goal",  value:"< 15 min",     sub:"Physician within 15 min",  color:T.orange},
            {label:"Door-to-ECG", value:"≤ 10 min",     sub:"Chest pain protocol",      color:T.coral },
            {label:"Door-to-ABX", value:"< 60 min",     sub:"Sepsis bundle target",     color:T.teal  },
            {label:"Stroke Alert",value:"< 25 min",     sub:"CT to needle (tPA)",        color:T.yellow},
          ].map((b,i)=>(
            <div key={i} style={{...glass,padding:"12px 16px",borderLeft:`3px solid ${b.color}`,background:`linear-gradient(135deg,${b.color}12,rgba(8,22,40,0.8))`}}>
              <div style={{fontFamily:"JetBrains Mono",fontSize:18,fontWeight:700,color:b.color}}>{b.value}</div>
              <div style={{fontFamily:"DM Sans",fontWeight:600,color:T.txt,fontSize:11,margin:"2px 0"}}>{b.label}</div>
              <div style={{fontFamily:"DM Sans",fontSize:10,color:T.txt3}}>{b.sub}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{...glass,padding:"8px",display:"flex",gap:5,marginBottom:16,flexWrap:"wrap"}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:"1 1 auto",fontFamily:"DM Sans",fontWeight:600,fontSize:12,padding:"9px 8px",borderRadius:10,border:`1px solid ${tab===t.id?"rgba(255,107,107,0.5)":"transparent"}`,background:tab===t.id?"linear-gradient(135deg,rgba(255,107,107,0.2),rgba(255,107,107,0.08))":"transparent",color:tab===t.id?T.coral:T.txt3,cursor:"pointer",textAlign:"center",transition:"all .15s",whiteSpace:"nowrap"}}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ── ESI LEVELS ─────────────────────────────────────────────── */}
        {tab === "esi" && (
          <div className="fade-in">
            <div style={{fontFamily:"JetBrains Mono",fontSize:11,color:T.teal,textTransform:"uppercase",letterSpacing:2,marginBottom:14}}>
              Emergency Severity Index (ESI) — 5-Level Triage System
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {ESI_LEVELS.map(esi=>(
                <ESICard key={esi.level} esi={esi}
                  expanded={esiExpanded===esi.level}
                  onToggle={()=>setEsiExpanded(p=>p===esi.level?null:esi.level)}/>
              ))}
            </div>
            <div style={{marginTop:16,padding:"12px 16px",background:"rgba(59,158,255,0.08)",border:"1px solid rgba(59,158,255,0.25)",borderRadius:10,fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.7}}>
              📚 ESI v4 (AHRQ 2012): Validated 5-level triage system. Prediction accuracy for resource use and admission validated across multiple ED settings. Pediatric ESI: apply Pediatric Assessment Triangle (PAT) — Appearance, Work of Breathing, Circulation to skin — for primary assessment before ESI assignment.
            </div>
          </div>
        )}

        {/* ── START TRIAGE ───────────────────────────────────────────── */}
        {tab === "start" && (
          <div className="fade-in">
            <div style={{fontFamily:"JetBrains Mono",fontSize:11,color:T.teal,textTransform:"uppercase",letterSpacing:2,marginBottom:14}}>
              START Triage — Simple Triage And Rapid Treatment (Mass Casualty)
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:18}}>
              {START_TAGS.map((tag,i)=>(
                <div key={i} style={{...glass,padding:"14px 16px",borderLeft:`4px solid ${tag.color}`,background:`linear-gradient(135deg,${tag.color}15,rgba(8,22,40,0.85))`}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                    <div style={{width:32,height:32,borderRadius:8,background:tag.color,display:"flex",alignItems:"center",justifyContent:"center"}}/>
                    <span style={{fontFamily:"JetBrains Mono",fontSize:13,fontWeight:700,color:tag.color}}>{tag.label}</span>
                  </div>
                  <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,marginBottom:7,lineHeight:1.5}}>{tag.desc}</div>
                  {tag.examples.map((ex,j)=>(
                    <div key={j} style={{display:"flex",gap:6,marginBottom:3}}>
                      <span style={{color:tag.color,fontSize:10}}>▸</span>
                      <span style={{fontFamily:"DM Sans",fontSize:11,color:T.txt3}}>{ex}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.txt4,textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>START Algorithm — Step by Step</div>
            {START_STEPS.map((step,i)=>(
              <div key={i} style={{...glass,padding:"14px 18px",marginBottom:10}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                  <div style={{width:28,height:28,borderRadius:"50%",background:"rgba(59,158,255,0.2)",border:"1px solid rgba(59,158,255,0.4)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <span style={{fontFamily:"JetBrains Mono",fontSize:12,fontWeight:700,color:T.blue}}>{step.step}</span>
                  </div>
                  <span style={{fontFamily:"DM Sans",fontWeight:700,fontSize:14,color:T.txt}}>{step.label}</span>
                </div>
                {step.options ? (
                  <div style={{display:"flex",flexDirection:"column",gap:7,paddingLeft:38}}>
                    {step.options.map((opt,j)=>(
                      <div key={j} style={{padding:"9px 12px",borderRadius:9,background:opt.color?`${opt.color}18`:"rgba(14,37,68,0.6)",border:`1px solid ${opt.color?opt.color+"44":"rgba(42,79,122,0.3)"}`}}>
                        <div style={{fontFamily:"JetBrains Mono",fontSize:11,fontWeight:700,color:opt.color||T.txt2,marginBottom:4}}>{opt.label}</div>
                        {opt.tag && <div style={{fontFamily:"DM Sans",fontSize:12,color:opt.color,fontWeight:600,marginBottom:3}}>→ TAG: {opt.tag}</div>}
                        <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt3}}>{opt.action}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,paddingLeft:38}}>
                    {[{lbl:"YES",data:step.yes},{lbl:"NO",data:step.no}].map(({lbl,data})=>(
                      <div key={lbl} style={{padding:"9px 12px",borderRadius:9,background:data.color?`${data.color}18`:"rgba(14,37,68,0.6)",border:`1px solid ${data.color?data.color+"44":"rgba(42,79,122,0.3)"}`}}>
                        <div style={{fontFamily:"JetBrains Mono",fontSize:11,fontWeight:700,color:data.color||T.teal,marginBottom:4}}>{lbl}</div>
                        {data.tag && <div style={{fontFamily:"DM Sans",fontSize:12,color:data.color,fontWeight:600,marginBottom:3}}>→ TAG: {data.tag}</div>}
                        <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt3,lineHeight:1.5}}>{data.action}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── SALT TRIAGE ────────────────────────────────────────────── */}
        {tab === "salt" && (
          <div className="fade-in">
            <div style={{fontFamily:"JetBrains Mono",fontSize:11,color:T.teal,textTransform:"uppercase",letterSpacing:2,marginBottom:14}}>
              SALT Triage — Sort, Assess, Lifesaving Interventions, Treatment/Transport
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:18}}>
              {SALT_STEPS.map((step,i)=>(
                <div key={i} style={{...glass,padding:"18px 20px",borderLeft:`4px solid ${step.color}`,background:`linear-gradient(135deg,${step.color}12,rgba(8,22,40,0.85))`}}>
                  <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
                    <span style={{fontSize:24}}>{step.icon}</span>
                    <span style={{fontFamily:"Playfair Display",fontSize:18,fontWeight:700,color:step.color}}>{step.title}</span>
                  </div>
                  <p style={{fontFamily:"DM Sans",fontSize:13,color:T.txt2,lineHeight:1.7}}>{step.desc}</p>
                </div>
              ))}
            </div>

            <div style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.txt4,textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>SALT Tag Categories</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:10}}>
              {SALT_TAGS.map((tag,i)=>(
                <div key={i} style={{...glass,padding:"14px 16px",borderTop:`4px solid ${tag.color}`}}>
                  <div style={{width:"100%",height:8,borderRadius:4,background:tag.color,marginBottom:10,boxShadow:`0 0 10px ${tag.color}60`}}/>
                  <div style={{fontFamily:"JetBrains Mono",fontSize:13,fontWeight:700,color:tag.color,marginBottom:6}}>{tag.label}</div>
                  <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.5}}>{tag.desc}</div>
                </div>
              ))}
            </div>

            <div style={{marginTop:16,padding:"12px 16px",background:"rgba(0,229,192,0.08)",border:"1px solid rgba(0,229,192,0.25)",borderRadius:10,fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.7}}>
              🌊 <strong style={{color:T.teal}}>SALT vs START:</strong> SALT (CHEMM / DHHS) is the US national standard for MCI triage. Key difference: SALT includes a global sorting step first and specifies 5 categories (including Dead) vs START's 4. SALT also explicitly outlines lifesaving interventions before tagging.
            </div>
          </div>
        )}

        {/* ── DANGER VITALS ──────────────────────────────────────────── */}
        {tab === "vitals" && (
          <div className="fade-in">
            <div style={{fontFamily:"JetBrains Mono",fontSize:11,color:T.teal,textTransform:"uppercase",letterSpacing:2,marginBottom:14}}>
              Danger Vital Sign Thresholds — Action Triggers
            </div>
            {VITAL_THRESHOLDS.map((vg,i)=>(
              <div key={i} style={{...glass,padding:"16px 18px",marginBottom:14}}>
                <div onClick={()=>setVitalExpanded(p=>p===i?null:i)} style={{display:"flex",alignItems:"center",gap:10,marginBottom:vitalExpanded===i?12:0,cursor:"pointer"}}>
                  <span style={{fontSize:20}}>{vg.icon}</span>
                  <span style={{fontFamily:"DM Sans",fontWeight:700,fontSize:15,color:T.txt,flex:1}}>{vg.vital}</span>
                  <span style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.txt4}}>{vg.unit}</span>
                  <span style={{color:T.txt4,fontSize:13,marginLeft:8}}>{vitalExpanded===i?"▲":"▼"}</span>
                </div>
                {(vitalExpanded===i) && (
                  <div className="fade-in">
                    <div style={{display:"grid",gridTemplateColumns:"120px 100px 80px 1fr",gap:10,padding:"6px 12px",marginBottom:4}}>
                      {["Category","Range","Level","Action"].map((h,hi)=>(
                        <span key={hi} style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:1}}>{h}</span>
                      ))}
                    </div>
                    {vg.rows.map((row,j)=><VitalRow key={j} row={row}/>)}
                  </div>
                )}
                {vitalExpanded!==i && (
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:8}}>
                    {vg.rows.filter(r=>r.level==="emergent").map((r,j)=>(
                      <span key={j} style={{fontFamily:"JetBrains Mono",fontSize:9,background:"rgba(255,68,68,0.15)",border:"1px solid rgba(255,68,68,0.35)",color:T.red,padding:"2px 8px",borderRadius:4}}>{r.range} = EMERGENT</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── CHIEF COMPLAINT SORT ───────────────────────────────────── */}
        {tab === "ccsort" && (
          <div className="fade-in">
            <div style={{fontFamily:"JetBrains Mono",fontSize:11,color:T.teal,textTransform:"uppercase",letterSpacing:2,marginBottom:14}}>
              Chief Complaint Quick Sort — ESI Guidance &amp; Workup
            </div>
            <input
              type="text" value={ccSearch} onChange={e=>setCcSearch(e.target.value)}
              placeholder="Search chief complaint…"
              style={{width:"100%",background:"rgba(14,37,68,0.8)",border:"1px solid rgba(42,79,122,0.5)",borderRadius:10,padding:"10px 16px",color:T.txt,fontFamily:"DM Sans",fontSize:14,outline:"none",marginBottom:14,transition:"border-color .2s"}}
              onFocus={e=>e.target.style.borderColor="rgba(59,158,255,0.5)"}
              onBlur={e=>e.target.style.borderColor="rgba(42,79,122,0.5)"}
            />
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {filteredCC.map((item,i)=>{
                const esiData = ESI_LEVELS.find(e=>e.level===item.esi);
                return (
                  <div key={i} style={{...glass,padding:"16px 18px",borderLeft:`3px solid ${item.color}`}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,flexWrap:"wrap"}}>
                      <span style={{fontSize:18}}>{item.flag}</span>
                      <span style={{fontFamily:"DM Sans",fontWeight:700,fontSize:15,color:T.txt,flex:1}}>{item.cc}</span>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <div style={{width:28,height:28,borderRadius:7,background:esiData?.color||T.txt4,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 8px ${esiData?.color||T.txt4}60`}}>
                          <span style={{fontFamily:"JetBrains Mono",fontSize:12,fontWeight:700,color:esiData?.textColor||T.txt}}>{item.esi}</span>
                        </div>
                        <span style={{fontFamily:"JetBrains Mono",fontSize:10,color:esiData?.color||T.txt3}}>ESI {item.esi} · {esiData?.label}</span>
                      </div>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                      <div>
                        <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Escalation Flags</div>
                        {item.flags.map((f,j)=>(
                          <div key={j} style={{display:"flex",gap:6,marginBottom:4}}>
                            <span style={{color:T.coral,fontSize:10,minWidth:8}}>▸</span>
                            <span style={{fontFamily:"DM Sans",fontSize:11,color:T.txt2,lineHeight:1.4}}>{f}</span>
                          </div>
                        ))}
                      </div>
                      <div>
                        <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Immediate Workup</div>
                        <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt2,lineHeight:1.7}}>{item.workup}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredCC.length === 0 && (
                <div style={{textAlign:"center",padding:32,fontFamily:"DM Sans",fontSize:13,color:T.txt4}}>No chief complaints matching "{ccSearch}"</div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{textAlign:"center",paddingBottom:24,paddingTop:16}}>
          <span style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.txt4,letterSpacing:2}}>NOTRYA TRIAGE HUB · ESI v4 AHRQ · START / SALT MCI PROTOCOLS · ALL TRIAGE IS A CLINICAL DECISION — VERIFY AGAINST INSTITUTIONAL PROTOCOL</span>
        </div>
      </div>
    </div>
  );
}