import { useState, useRef, useCallback, useMemo } from "react";
import { base44 } from "@/api/base44Client";
const InvokeLLM = (params) => base44.integrations.Core.InvokeLLM(params);

// ── CSS ───────────────────────────────────────────────────────────────────────
(() => {
  if (document.getElementById("uph-css")) return;
  const l = document.createElement("link"); l.id = "uph-f"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "uph-css";
  s.textContent = `
    *{box-sizing:border-box;}
    @keyframes uIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
    @keyframes uSpin{to{transform:rotate(360deg)}}
    @keyframes uPulse{0%,100%{opacity:.35}50%{opacity:1}}
    .u-in{animation:uIn .22s ease both;}
    .u-pulse{animation:uPulse 1.5s ease-in-out infinite;}
    .u-hov:hover{background:rgba(255,255,255,.07)!important;border-color:rgba(0,180,216,.38)!important;}
    ::-webkit-scrollbar{width:3px;height:3px;}
    ::-webkit-scrollbar-thumb{background:rgba(0,180,216,.25);border-radius:2px;}
    input::placeholder,textarea::placeholder{color:rgba(221,230,240,.2);}
    input:focus,textarea:focus{border-color:rgba(0,180,216,.6)!important;outline:none;}
    select option{background:#0d1b2e;}
  `;
  document.head.appendChild(s);
})();

// ── Tokens ────────────────────────────────────────────────────────────────────
const T = {
  bg:"#07111f", navy:"#0d1b2e",
  card:"rgba(255,255,255,0.04)", bdr:"rgba(255,255,255,0.08)",
  teal:"#00b4d8", tD:"rgba(0,180,216,0.12)", tB:"rgba(0,180,216,0.25)",
  gold:"#f0a500", gD:"rgba(240,165,0,0.12)",
  coral:"#ff6060", cD:"rgba(255,96,96,0.12)",
  green:"#4ade80", grnD:"rgba(74,222,128,0.1)",
  purple:"#9b6dff", pD:"rgba(155,109,255,0.12)",
  orange:"#ff9f43", oD:"rgba(255,159,67,0.12)",
  txt:"#dde6f0", mut:"rgba(221,230,240,0.55)", dim:"rgba(221,230,240,0.28)",
};

// ── Style helpers ─────────────────────────────────────────────────────────────
const gl = (x={}) => ({backdropFilter:"blur(14px)",background:T.card,border:`1px solid ${T.bdr}`,borderRadius:12,...x});
const ib = (x={}) => ({width:"100%",background:"rgba(13,27,46,.8)",border:`1px solid ${T.bdr}`,borderRadius:9,padding:"9px 13px",color:T.txt,fontFamily:"DM Sans,sans-serif",fontSize:13,transition:"border-color .15s",...x});
const ab = (c=T.teal,x={}) => ({padding:"8px 18px",borderRadius:9,cursor:"pointer",border:`1px solid ${c}55`,background:`${c}18`,color:c,fontFamily:"DM Sans,sans-serif",fontSize:13,fontWeight:700,transition:"all .16s",...x});
const tg = (c,x={}) => ({borderRadius:6,padding:"3px 9px",fontSize:11,fontWeight:700,background:`${c}18`,border:`1px solid ${c}30`,color:c,...x});
const Sp = () => <span style={{display:"inline-block",width:13,height:13,border:"2px solid rgba(0,180,216,.2)",borderTopColor:T.teal,borderRadius:"50%",animation:"uSpin .7s linear infinite"}} />;

// ── Unified Drug Database ─────────────────────────────────────────────────────
// tiers:[label, dose, "ok"|"caution"|"avoid"]
// wt:{ind,route,dpkg,lo,hi,max,conc,unit:"mg"|"mcg",note} — null if N/A
// drip:{lo,hi,unit,concs:[[label,concVal]],note} — null if not a drip
const DB = [
  {id:"vanc",name:"Vancomycin",gen:"vancomycin",cat:"antibiotic",controlled:false,
   tiers:[["eGFR >60","15-20 mg/kg IV q8-12h","ok"],["eGFR 30-60","15-20 mg/kg q24h","caution"],
          ["eGFR <30","PK dosing required","caution"],["Dialysis","15-25 mg/kg post-HD","caution"]],
   wt:{ind:"Serious Infection",route:"IV",dpkg:15,lo:15,hi:20,max:3000,conc:5,unit:"mg",
       note:"Target AUC/MIC 400-600. Infuse 60-90 min/gram."},
   drip:null,sigs:["15-20 mg/kg IV q8-12h (normal renal function)"],
   interactions:["Nephrotoxins — additive AKI","Loop diuretics — ototoxicity"],
   ci:["Vancomycin hypersensitivity"],peds:"15 mg/kg IV q6h; monitor levels",
   hepatic:"No significant adjustment",monitoring:"AUC/MIC 400-600; SCr q48h"},

  {id:"piptz",name:"Pip-Tazo 4.5g",gen:"piperacillin-tazobactam",cat:"antibiotic",controlled:false,
   tiers:[["eGFR >40","4.5g IV q6h","ok"],["eGFR 20-40","3.375g IV q6h","caution"],
          ["eGFR <20","2.25g IV q6h","caution"],["Dialysis","2.25g q12h + 0.75g post-HD","caution"]],
   wt:null,drip:null,sigs:["4.5g IV q6h","4.5g IV q8h extended infusion"],
   interactions:["Methotrexate — reduced clearance","Aminoglycosides — separate infusions"],
   ci:["Penicillin allergy"],peds:"100 mg/kg q8h (pip component)",
   hepatic:"No adjustment",monitoring:"Seizure/neurotoxicity in renal failure"},

  {id:"ceftx",name:"Ceftriaxone",gen:"ceftriaxone",cat:"antibiotic",controlled:false,
   tiers:[["Any eGFR","1-2g IV/IM q12-24h — no renal adjustment","ok"]],
   wt:null,drip:null,sigs:["1g IV/IM q24h","2g IV q12h (meningitis/severe)"],
   interactions:["IV Calcium — precipitation in neonates"],
   ci:["Cephalosporin allergy","Neonatal hyperbilirubinemia"],
   peds:"50-100 mg/kg/day divided q12-24h",hepatic:"No adjustment",
   monitoring:"Biliary sludging with prolonged use"},

  {id:"fent",name:"Fentanyl",gen:"fentanyl",cat:"analgesic",controlled:true,schedule:"II",
   tiers:[["Any eGFR","Full dose — preferred opioid in renal failure","ok"]],
   wt:{ind:"Acute Pain / RSI Premed",route:"IV",dpkg:1,lo:0.5,hi:2,max:200,conc:0.05,unit:"mcg",
       note:"Onset 1-3 min. Safe in renal/hepatic failure. No active renal metabolites."},
   drip:null,sigs:["25-100 mcg IV q1-2h PRN","1-2 mcg/kg IV (weight-based)"],
   interactions:["CNS depressants — respiratory depression","MAOIs — contraindicated"],
   ci:["Significant respiratory depression"],peds:"1-2 mcg/kg IV; 1.5 mcg/kg IN via MAD",
   hepatic:"Reduce dose in severe hepatic failure",monitoring:"Respiratory status; chest wall rigidity risk"},

  {id:"morph",name:"Morphine",gen:"morphine",cat:"analgesic",controlled:true,schedule:"II",
   tiers:[["eGFR >60","0.1 mg/kg IV q2-4h","ok"],["eGFR 30-60","Reduce 25-50%; extend interval","caution"],
          ["eGFR <30","AVOID — use fentanyl instead","avoid"],["Dialysis","Avoid — M6G accumulates","avoid"]],
   wt:{ind:"Acute Pain",route:"IV",dpkg:0.1,lo:0.05,hi:0.15,max:10,conc:1,unit:"mg",
       note:"Active metabolite M6G accumulates in renal failure. Titrate 2-4 mg increments."},
   drip:null,sigs:["2-4 mg IV q2-4h PRN","0.1 mg/kg IV (weight-based)"],
   interactions:["CNS depressants — respiratory depression","Benzodiazepines — FDA black box"],
   ci:["Severe renal impairment","Respiratory depression"],peds:"0.1 mg/kg IV q2-4h (max 4 mg)",
   hepatic:"Reduce dose 50% in severe hepatic disease",monitoring:"Respiratory status; sedation scale"},

  {id:"ketam",name:"Ketamine",gen:"ketamine",cat:"rsi",controlled:true,schedule:"III",
   tiers:[["Any eGFR","Full dose — no renal adjustment","ok"]],
   wt:{ind:"RSI Induction",route:"IV",dpkg:1.5,lo:1.0,hi:2.0,max:200,conc:10,unit:"mg",
       note:"Preferred in hemodynamic instability. Sub-dissociative analgesia: 0.1-0.5 mg/kg."},
   drip:null,sigs:["1-2 mg/kg IV (RSI)","0.3 mg/kg IV (sub-dissociative)","4 mg/kg IM (no IV)"],
   interactions:["Thyroid hormones — hypertension/tachycardia"],
   ci:["Uncontrolled hypertension","Active psychosis (relative)"],peds:"1-2 mg/kg IV; 4 mg/kg IM",
   hepatic:"Reduce dose in severe hepatic failure",monitoring:"BP, HR; emergence reactions"},

  {id:"keto",name:"Ketorolac",gen:"ketorolac",cat:"analgesic",controlled:false,
   tiers:[["eGFR >60","15-30 mg IV q6h (max 5 days)","ok"],
          ["eGFR 30-60","15 mg IV q6h; short course only","caution"],
          ["eGFR <30","AVOID — nephrotoxic NSAID","avoid"],["Dialysis","Contraindicated","avoid"]],
   wt:null,drip:null,sigs:["15-30 mg IV q6h","10 mg PO q4-6h"],
   interactions:["ACE/ARBs — AKI risk","Anticoagulants — GI bleeding","Other NSAIDs — avoid"],
   ci:["Active GI bleed","CrCl <30","NSAID allergy","Age >75: avoid or reduce"],
   peds:"0.5 mg/kg IV (max 30 mg)",hepatic:"Use with caution; reduce dose",
   monitoring:"SCr, GI symptoms; max 5-day combined course"},

  {id:"midaz",name:"Midazolam",gen:"midazolam",cat:"sedation",controlled:true,schedule:"IV",
   tiers:[["eGFR >60","1-2.5 mg IV slow push","ok"],["eGFR 30-60","Start 1 mg; titrate","caution"],
          ["eGFR <30","0.5-1 mg; prolonged effect expected","caution"]],
   wt:{ind:"Procedural Sedation",route:"IV",dpkg:0.05,lo:0.025,hi:0.1,max:5,conc:1,unit:"mg",
       note:"Titrate slowly. Active metabolite accumulates in renal failure. Reversal: flumazenil."},
   drip:null,sigs:["1-2.5 mg IV PRN","0.07 mg/kg IM","0.2 mg/kg IN via MAD"],
   interactions:["Opioids — respiratory depression (FDA black box)","CNS depressants — additive"],
   ci:["Acute narrow-angle glaucoma"],peds:"0.1 mg/kg IV (max 5 mg); 0.5 mg/kg PO/IN",
   hepatic:"Reduce dose in hepatic disease",monitoring:"Respiratory status; flumazenil available"},

  {id:"prop",name:"Propofol",gen:"propofol",cat:"sedation",controlled:false,
   tiers:[["Any eGFR","Full dose — no renal adjustment","ok"]],
   wt:{ind:"Procedural Sedation",route:"IV",dpkg:1.0,lo:0.5,hi:1.5,max:150,conc:10,unit:"mg",
       note:"Monitor BP closely — significant hypotension. Titrate in 0.5 mg/kg increments."},
   drip:null,sigs:["0.5-1.5 mg/kg IV (procedural)","10-50 mcg/kg/min infusion (ICU)"],
   interactions:["CNS depressants — additive hypotension"],
   ci:["Egg/soy allergy (relative)","PRIS risk with prolonged high-dose infusion"],
   peds:"1-2 mg/kg IV for procedural sedation ≥3 yr",
   hepatic:"No significant adjustment",monitoring:"PRIS with prolonged infusion"},

  {id:"etom",name:"Etomidate",gen:"etomidate",cat:"rsi",controlled:false,
   tiers:[["Any eGFR","Full dose — no renal adjustment","ok"]],
   wt:{ind:"RSI Induction",route:"IV",dpkg:0.3,lo:0.2,hi:0.4,max:60,conc:2,unit:"mg",
       note:"Hemodynamically neutral. Inhibits cortisol synthesis — single dose acceptable."},
   drip:null,sigs:["0.3 mg/kg IV (RSI)"],
   interactions:["No significant interactions"],
   ci:["Adrenal insufficiency (relative)"],peds:"0.3 mg/kg IV",
   hepatic:"No adjustment",monitoring:"Adrenal suppression with repeat dosing"},

  {id:"succ",name:"Succinylcholine",gen:"succinylcholine",cat:"rsi",controlled:false,
   tiers:[["Any eGFR","Full dose — no renal adjustment","ok"]],
   wt:{ind:"RSI Paralysis",route:"IV",dpkg:1.5,lo:1.0,hi:2.0,max:200,conc:20,unit:"mg",
       note:"Gold standard RSI. Use 2 mg/kg in children <25 kg. Onset 45-60 sec, duration 8-12 min."},
   drip:null,sigs:["1.5 mg/kg IV (RSI)","4 mg/kg IM (no IV access)"],
   interactions:["Aminoglycosides — prolonged block","Cholinesterase inhibitors — prolonged block"],
   ci:["Hyperkalemia","Burns/crush/denervation >48h","Myopathies","Malignant hyperthermia hx"],
   peds:"2 mg/kg IV (<25 kg); 4 mg/kg IM",hepatic:"No adjustment",
   monitoring:"Check K+ in at-risk patients; ensure succinylcholine is not expired"},

  {id:"roc",name:"Rocuronium",gen:"rocuronium",cat:"rsi",controlled:false,
   tiers:[["Any eGFR","Full dose — no renal adjustment","ok"]],
   wt:{ind:"RSI Paralysis",route:"IV",dpkg:1.2,lo:0.9,hi:1.6,max:200,conc:10,unit:"mg",
       note:"Preferred when succinylcholine CI. Onset 60-90 sec. Reversal: sugammadex 16 mg/kg."},
   drip:null,sigs:["1.2 mg/kg IV (RSI)","0.6 mg/kg IV (facilitated intubation)"],
   interactions:["Aminoglycosides — potentiated block"],
   ci:[],peds:"1.2 mg/kg IV (RSI)",
   hepatic:"Mild prolongation in hepatic failure",monitoring:"Ensure sugammadex 200 mg vials available"},

  {id:"norep",name:"Norepinephrine",gen:"norepinephrine",cat:"pressor",controlled:false,
   tiers:[["Any eGFR","Full dose — no renal adjustment","ok"]],
   wt:null,
   drip:{lo:0.01,hi:3.0,unit:"mcg/kg/min",
         concs:[["4mg/250mL (16 mcg/mL)",16],["8mg/250mL (32 mcg/mL)",32]],
         note:"First-line vasopressor for septic shock. Titrate to MAP ≥65 mmHg."},
   sigs:["0.01-3 mcg/kg/min IV infusion"],
   interactions:["MAOIs — severe hypertension"],
   ci:["Uncorrected hypovolemia"],peds:"0.01-2 mcg/kg/min IV",
   hepatic:"No adjustment",monitoring:"MAP q5-15 min; central line preferred"},

  {id:"epi",name:"Epinephrine",gen:"epinephrine",cat:"cardiac",controlled:false,
   tiers:[["Any eGFR","Full dose — no renal adjustment","ok"]],
   wt:null,
   drip:{lo:0.01,hi:1.0,unit:"mcg/kg/min",
         concs:[["1mg/250mL (4 mcg/mL)",4],["2mg/250mL (8 mcg/mL)",8]],
         note:"Anaphylaxis/arrest/cardiogenic shock. Arrhythmogenic at high doses."},
   sigs:["0.3-0.5 mg IM (anaphylaxis)","1 mg IV q3-5 min (ACLS)","0.01-1 mcg/kg/min (drip)"],
   interactions:["Beta-blockers — antagonism","MAOIs — severe hypertension"],
   ci:["None absolute in emergency"],peds:"0.01 mg/kg IM (anaphylaxis); 0.01 mg/kg IV (ACLS)",
   hepatic:"No adjustment",monitoring:"Continuous ECG; BP q5 min"},

  {id:"amio",name:"Amiodarone",gen:"amiodarone",cat:"cardiac",controlled:false,
   tiers:[["Any eGFR","Full dose — minimal renal clearance","ok"]],
   wt:null,
   drip:{lo:0.5,hi:1.0,unit:"mg/min",
         concs:[["900mg/500mL (1.8 mg/mL)",1.8]],
         note:"1 mg/min x6h then 0.5 mg/min x18h after loading. Dedicated line."},
   sigs:["300 mg IV rapid (V-Fib)","150 mg IV over 10 min (stable VT/AFib)","200-400 mg PO daily (maintenance)"],
   interactions:["Warfarin — markedly increases INR","Digoxin — increased levels","QTc agents — additive"],
   ci:["Sinus node dysfunction without pacemaker"],peds:"5 mg/kg IV over 30-60 min (PALS)",
   hepatic:"Use with caution — hepatotoxic",monitoring:"QTc, TFTs, PFTs, LFTs with long-term use"},

  {id:"nalox",name:"Naloxone",gen:"naloxone",cat:"reversal",controlled:false,
   tiers:[["Any eGFR","Full dose — no renal adjustment","ok"]],
   wt:{ind:"Opioid Reversal",route:"IV",dpkg:0.01,lo:0.4,hi:2.0,max:10,conc:0.4,unit:"mg",
       note:"Titrate to respiratory effort — not full reversal. May repeat q2-3 min. Duration 30-90 min."},
   drip:null,sigs:["0.4-2 mg IV/IM/IN q2-3 min PRN","0.01 mg/kg IV (titrated reversal)","4 mg IN (community)"],
   interactions:["Opioids — precipitates acute withdrawal"],
   ci:[],peds:"0.01 mg/kg IV (max 0.4 mg); repeat PRN",
   hepatic:"No significant adjustment",monitoring:"Resedation after short-acting naloxone — observe 2-4h"},

  {id:"enox",name:"Enoxaparin",gen:"enoxaparin",cat:"anticoagulant",controlled:false,
   tiers:[["CrCl >30","1 mg/kg SQ q12h (Tx); 40 mg SQ daily (prophylaxis)","ok"],
          ["CrCl <30","1 mg/kg SQ q24h — Anti-Xa monitoring required","caution"],
          ["Dialysis","UFH preferred","avoid"]],
   wt:{ind:"VTE Treatment",route:"SQ",dpkg:1,lo:1,hi:1,max:180,conc:100,unit:"mg",
       note:"Anti-Xa monitoring if CrCl <30. Peak 4h post-dose target 0.6-1.0 IU/mL."},
   drip:null,sigs:["1 mg/kg SQ q12h (treatment)","40 mg SQ daily (prophylaxis)","0.5 mg/kg SQ q12h (ACS)"],
   interactions:["Anticoagulants — additive bleeding","NSAIDs — GI bleed risk"],
   ci:["CrCl <30 for treatment dosing","Active major bleeding"],
   peds:"0.5 mg/kg SQ q12h (treatment); 1.5 mg/kg SQ q24h <2 mo",
   hepatic:"Use with caution",monitoring:"Anti-Xa if CrCl <30 or extreme weight"},

  {id:"levety",name:"Levetiracetam",gen:"levetiracetam",cat:"neuro",controlled:false,
   tiers:[["eGFR >80","500-1500 mg IV/PO q12h","ok"],["eGFR 50-80","500-1000 mg q12h","ok"],
          ["eGFR 30-50","250-750 mg q12h","caution"],["eGFR <30","250-500 mg q12h","caution"],
          ["Dialysis","250-500 mg q12h + supplement 250-500 mg post-HD","caution"]],
   wt:null,drip:null,sigs:["500-1500 mg IV/PO q12h","2000-4500 mg IV load (status epilepticus)"],
   interactions:["CNS depressants — additive sedation"],
   ci:[],peds:"20-30 mg/kg IV load (status); 10-20 mg/kg/day q12h maintenance",
   hepatic:"No significant adjustment",monitoring:"Behavioral side effects; renal dose adjustment critical"},

  {id:"apap",name:"Acetaminophen",gen:"acetaminophen",cat:"analgesic",controlled:false,
   tiers:[["Any eGFR","650-1000 mg PO/IV q6-8h — no renal adjustment","ok"]],
   wt:null,drip:null,sigs:["1000 mg IV/PO q6-8h (adults)","15 mg/kg IV (patients <50 kg)","650 mg PO q6h (elderly)"],
   interactions:["Warfarin — slightly increased INR (large doses)","Hepatotoxins — liver failure risk"],
   ci:["Severe hepatic impairment"],peds:"15 mg/kg PO/IV q4-6h (max 75 mg/kg/day)",
   hepatic:"Reduce max to 2g/day in hepatic disease",monitoring:"Max 4g/day adults; hepatotoxicity in OD"},

  {id:"aden",name:"Adenosine",gen:"adenosine",cat:"cardiac",controlled:false,
   tiers:[["Any eGFR","Full dose — no renal adjustment","ok"]],
   wt:null,drip:null,sigs:["6 mg IV rapid push (SVT — 1st dose)","12 mg IV rapid push x2 if no response"],
   interactions:["Dipyridamole — potentiates (reduce dose to 3 mg)","Theophylline/caffeine — antagonizes","Carbamazepine — prolonged AV block"],
   ci:["2nd/3rd degree AV block without pacemaker","Sick sinus syndrome","Asthma (relative)"],
   peds:"0.1 mg/kg IV (max 6 mg); 0.2 mg/kg if no response",
   hepatic:"No adjustment",monitoring:"Continuous ECG; warn patient of transient chest tightness"},
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const calcCrCl = ({age,wt,scr,sex}) => {
  if (!age||!wt||!scr||parseFloat(scr)<=0) return null;
  const b=((140-parseFloat(age))*parseFloat(wt))/(72*parseFloat(scr));
  return sex==="F"?b*0.85:b;
};
const calcIBW = (ht,sex) => {
  if (!ht) return null;
  const i=(parseFloat(ht)/2.54)-60;
  return (sex==="M"?50:45.5)+2.3*Math.max(0,i);
};
const getActiveTier = (drug,crcl) => {
  if (!crcl||!drug.tiers.length) return drug.tiers[0]||null;
  for (const t of drug.tiers) {
    const l=t[0], nums=(l.match(/[\d.]+/g)||[]).map(Number);
    if (l.includes("Any")) return t;
    if (l.includes(">")&&nums[0]&&crcl>nums[0]) return t;
    if (l.includes("<")&&nums[0]&&crcl<nums[0]) return t;
    if (nums.length===2){const lo=Math.min(...nums),hi=Math.max(...nums);if(crcl>=lo&&crcl<=hi) return t;}
  }
  return drug.tiers[drug.tiers.length-1];
};
const findDB = n => { const q=n.toLowerCase(); return DB.find(d=>d.name.toLowerCase().includes(q)||d.gen.toLowerCase().includes(q))||null; };
const FLAG = {ok:{c:T.green,l:"Normal Dose"},caution:{c:T.gold,l:"Adjust Dose"},avoid:{c:T.coral,l:"AVOID"}};
const ISMP = new Set(["vanc","morph","fent","midaz","succ","roc","enox","amio","prop","ketam","epi","norep"]);

// ── APIs ──────────────────────────────────────────────────────────────────────
const searchFDA = async q => {
  const e=encodeURIComponent(q);
  for (const u of [`https://api.fda.gov/drug/label.json?search=openfda.generic_name:"${e}"&limit=6`,
                    `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${e}"&limit=6`]) {
    try{const r=await fetch(u);if(r.ok){const d=await r.json();if(d.results?.length) return d.results;}}catch{}
  }
  return [];
};
const getRxCUI = async n => {
  try{const r=await fetch(`https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${encodeURIComponent(n)}&search=1`);const d=await r.json();return d.idGroup?.rxnormId?.[0]||null;}catch{return null;}
};
const getIxs = async rxcuis => {
  try{const r=await fetch(`https://rxnav.nlm.nih.gov/REST/interaction/list.json?rxcuis=${rxcuis.join("+")}`);const d=await r.json();return d.fullInteractionTypeGroup||[];}catch{return [];}
};
const fdaName = d=>d?.openfda?.brand_name?.[0]||d?.openfda?.generic_name?.[0]||d?.openfda?.substance_name?.[0]||"Unknown";
const fdaGen  = d=>d?.openfda?.generic_name?.[0]||d?.openfda?.substance_name?.[0]||"";
const trunc   = (s="",n=320)=>s.length>n?s.slice(0,n)+"...":s;

// ── Patient Banner ────────────────────────────────────────────────────────────
function PatientBanner({pt,setPt,crcl,ibw}) {
  const f=(k,v)=>setPt(p=>({...p,[k]:v}));
  const crclColor=!crcl?T.dim:crcl>=60?T.green:crcl>=30?T.gold:T.coral;
  return (
    <div style={{...gl({borderRadius:10,padding:"12px 16px",marginBottom:14})}}>
      <div style={{fontSize:9,fontFamily:"JetBrains Mono,monospace",color:T.teal,letterSpacing:2,textTransform:"uppercase",marginBottom:10,fontWeight:700}}>Patient Parameters</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"flex-end"}}>
        {[["Age","age","yr",50],["Weight","wt","kg",70],["Height","ht","cm",80],["SCr","scr","mg/dL",68]].map(([l,k,u,w])=>(
          <div key={k}>
            <div style={{fontSize:8,fontFamily:"JetBrains Mono,monospace",color:T.dim,letterSpacing:1,textTransform:"uppercase",marginBottom:3}}>{l}</div>
            <div style={{position:"relative"}}>
              <input type="number" value={pt[k]} onChange={e=>f(k,e.target.value)} placeholder="—"
                style={{...ib({width:w,padding:"6px 28px 6px 9px",fontSize:12,fontFamily:"JetBrains Mono,monospace",fontWeight:600})}} />
              <span style={{position:"absolute",right:7,top:"50%",transform:"translateY(-50%)",fontSize:8,color:T.dim,pointerEvents:"none"}}>{u}</span>
            </div>
          </div>
        ))}
        <div>
          <div style={{fontSize:8,fontFamily:"JetBrains Mono,monospace",color:T.dim,letterSpacing:1,textTransform:"uppercase",marginBottom:3}}>Sex</div>
          <div style={{display:"flex",gap:3}}>
            {["M","F"].map(s=>(
              <button key={s} onClick={()=>f("sex",s)} style={{padding:"6px 14px",borderRadius:7,cursor:"pointer",border:`1px solid ${pt.sex===s?T.teal+"66":T.bdr}`,background:pt.sex===s?T.tD:"transparent",color:pt.sex===s?T.teal:T.mut,fontFamily:"JetBrains Mono,monospace",fontWeight:700,fontSize:12}}>{s}</button>
            ))}
          </div>
        </div>
        <button onClick={()=>f("dialysis",!pt.dialysis)} style={{padding:"6px 12px",borderRadius:7,cursor:"pointer",border:`1px solid ${pt.dialysis?T.purple+"55":T.bdr}`,background:pt.dialysis?T.pD:"transparent",color:pt.dialysis?T.purple:T.mut,fontSize:11,fontWeight:700,fontFamily:"JetBrains Mono,monospace"}}>
          {pt.dialysis?"✓ DIALYSIS":"+ Dialysis"}
        </button>
        {crcl!==null&&(
          <div style={{padding:"6px 12px",borderRadius:20,border:`1px solid ${crclColor}30`,background:`${crclColor}0d`,display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontFamily:"JetBrains Mono,monospace",fontWeight:700,fontSize:14,color:crclColor}}>{Math.round(crcl)}</span>
            <span style={{fontSize:10,color:T.dim}}>mL/min CrCl</span>
          </div>
        )}
        {ibw!==null&&(
          <div style={{padding:"6px 12px",borderRadius:20,border:`1px solid ${T.teal}20`,background:T.tD}}>
            <span style={{fontFamily:"JetBrains Mono,monospace",fontSize:12,fontWeight:700,color:T.teal}}>{Math.round(ibw)}</span>
            <span style={{fontSize:10,color:T.dim,marginLeft:4}}>kg IBW</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tab 1: Rx Lookup ──────────────────────────────────────────────────────────
function RxLookupTab({pt,crcl,onAddToIx}) {
  const [q,setQ]=useState(""); const [res,setRes]=useState([]); const [busy,setBusy]=useState(false);
  const [sel,setSel]=useState(null); const [dbDrug,setDbDrug]=useState(null);
  const [aiSum,setAiSum]=useState(null); const [aiLoad,setAiLoad]=useState(false);
  const [pedWt,setPedWt]=useState(""); const [pedRes,setPedRes]=useState(null); const [pedLoad,setPedLoad]=useState(false);
  const [exp,setExp]=useState({}); const [ixToast,setIxToast]=useState(false);
  const deb=useRef(null); const ixRef=useRef(null);

  const doSearch=useCallback(v=>{
    setQ(v);
    if(deb.current) clearTimeout(deb.current);
    if(!v.trim()||v.length<2){setRes([]);return;}
    deb.current=setTimeout(async()=>{setBusy(true);const r=await searchFDA(v);setRes(r);setBusy(false);},400);
  },[]);

  const pick=d=>{
    setSel(d);setAiSum(null);setPedRes(null);setPedWt("");setExp({});setRes([]);setQ(fdaName(d));
    setDbDrug(findDB(fdaGen(d)||fdaName(d)));
  };

  const handleAI=async()=>{
    if(!sel||aiLoad) return;
    setAiLoad(true);
    try {
      const r=await InvokeLLM({
        prompt:`You are a clinical ED pharmacist. Provide an emergency medicine drug summary for: ${fdaName(sel)} (${fdaGen(sel)}).
FDA indications: ${trunc(sel.indications_and_usage?.[0]||"",400)}
FDA dosage: ${trunc(sel.dosage_and_administration?.[0]||"",400)}
FDA warnings: ${trunc(sel.warnings?.[0]||sel.boxed_warning?.[0]||"",300)}`,
        response_json_schema:{type:"object",properties:{
          ed_indication:{type:"string"},typical_ed_dose:{type:"string"},route:{type:"string"},
          onset_duration:{type:"string"},critical_warnings:{type:"array",items:{type:"string"}},
          clinical_pearls:{type:"array",items:{type:"string"}}},
          required:["ed_indication","typical_ed_dose","route","onset_duration","critical_warnings","clinical_pearls"]},
      });
      setAiSum(r);
    } catch{setAiSum({_err:true});}
    setAiLoad(false);
  };

  const handlePed=async()=>{
    if(!sel||!pedWt||pedLoad) return;
    setPedLoad(true);
    try {
      const r=await InvokeLLM({
        prompt:`Pediatric ED dosing for ${fdaName(sel)} (${fdaGen(sel)}) at weight ${pedWt} kg. Provide all relevant ED indications with weight-based calculated doses, max dose caps, routes, and age restrictions.`,
        response_json_schema:{type:"object",properties:{
          weight_kg:{type:"number"},
          doses:{type:"array",items:{type:"object",properties:{
            indication:{type:"string"},dose_per_kg:{type:"string"},calculated_dose:{type:"string"},
            max_dose:{type:"string"},route:{type:"string"},frequency:{type:"string"}},
            required:["indication","dose_per_kg","calculated_dose","max_dose","route","frequency"]}},
          age_restrictions:{type:"string"},safety_note:{type:"string"}},
          required:["weight_kg","doses","age_restrictions","safety_note"]},
      });
      setPedRes(r);
    } catch{setPedRes({_err:true});}
    setPedLoad(false);
  };

  const addToIx=async()=>{
    if(!sel) return;
    onAddToIx({name:fdaName(sel),generic:fdaGen(sel)});
    if(ixRef.current) clearTimeout(ixRef.current);
    setIxToast(true); ixRef.current=setTimeout(()=>setIxToast(false),2000);
  };

  const activeTier=dbDrug?getActiveTier(dbDrug,crcl):null;
  const flagCfg=activeTier?FLAG[activeTier[2]]||FLAG.ok:null;

  const LABEL_SECS=[
    {k:"boxed_warning",l:"Boxed Warning",c:T.coral},{k:"indications_and_usage",l:"Indications & Usage",c:T.teal},
    {k:"dosage_and_administration",l:"Dosage & Administration",c:T.gold},
    {k:"contraindications",l:"Contraindications",c:T.coral},{k:"warnings",l:"Warnings",c:T.coral},
    {k:"adverse_reactions",l:"Adverse Reactions",c:T.gold},{k:"drug_interactions",l:"Drug Interactions (FDA Label)",c:T.teal},
  ];

  return (
    <div className="u-in">
      <div style={{position:"relative",maxWidth:520,marginBottom:14}}>
        <span style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",fontSize:15,color:T.teal,pointerEvents:"none"}}>🔍</span>
        <input value={q} onChange={e=>doSearch(e.target.value)} onKeyDown={e=>e.key==="Escape"&&(setQ(""),setRes([]),setSel(null))}
          placeholder="Drug name, generic, or ingredient..." style={{...ib({paddingLeft:42})}} />
        {busy&&<span style={{position:"absolute",right:13,top:"50%",transform:"translateY(-50%)",fontSize:11,color:T.dim}}>Searching...</span>}
      </div>

      {res.length>0&&(
        <div style={{...gl({maxWidth:520,marginBottom:16,overflow:"hidden"})}}>
          {res.map((d,i)=>(
            <div key={i} className="u-hov" onClick={()=>pick(d)} style={{padding:"10px 15px",cursor:"pointer",borderBottom:i<res.length-1?`1px solid ${T.bdr}`:"none"}}>
              <div style={{fontWeight:700,fontSize:13,color:T.txt}}>{fdaName(d)}</div>
              <div style={{fontSize:11,color:T.mut}}>{fdaGen(d)} · {d.openfda?.manufacturer_name?.[0]||""}</div>
            </div>
          ))}
        </div>
      )}

      {sel&&(
        <div className="u-in">
          {/* Header */}
          <div style={{...gl({padding:"16px 20px",marginBottom:12}),display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10}}>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:6}}>
                <h2 style={{margin:0,fontFamily:"Playfair Display,serif",fontSize:20,color:T.teal,lineHeight:1.1}}>{fdaName(sel)}</h2>
                {flagCfg&&<span style={{...tg(flagCfg.c),fontSize:10}}>{flagCfg.l}</span>}
                {dbDrug?.controlled&&<span style={{...tg(T.coral),fontSize:10}}>Sch {dbDrug.schedule}</span>}
                {ISMP.has(dbDrug?.id)&&<span style={{borderRadius:6,padding:"3px 9px",fontSize:10,fontWeight:700,background:"rgba(255,96,96,0.22)",border:`1px solid ${T.coral}55`,color:T.coral}}>⚠ ISMP High-Alert</span>}
              </div>
              {fdaGen(sel)&&<div style={{fontSize:12,color:T.mut,fontStyle:"italic",marginBottom:8}}>{fdaGen(sel)}</div>}
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {sel.openfda?.route?.map((r,i)=><span key={i} style={{...tg(T.gold),fontSize:10}}>{r}</span>)}
                {sel.openfda?.product_type?.[0]&&<span style={{...tg(T.mut),fontSize:10,color:T.mut}}>{sel.openfda.product_type[0]}</span>}
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end"}}>
              <button onClick={()=>{setSel(null);setQ("");setDbDrug(null);setAiSum(null);}} style={{...ab(T.coral,{padding:"6px 12px",fontSize:11})}}>✕ Close</button>
              <button onClick={addToIx} style={{...ab(T.teal,{padding:"6px 12px",fontSize:11})}}>➕ Add to Interactions</button>
              {ixToast&&<span className="u-in" style={{fontSize:10,color:T.green,fontWeight:700}}>✓ Added</span>}
            </div>
          </div>

          {/* Patient-specific renal dose */}
          {dbDrug&&activeTier&&(
            <div style={{...gl({padding:"12px 16px",marginBottom:12,borderLeft:`3px solid ${flagCfg.c}`})}}>
              <div style={{fontSize:9,color:flagCfg.c,fontFamily:"JetBrains Mono,monospace",letterSpacing:1.5,fontWeight:700,textTransform:"uppercase",marginBottom:6}}>
                {crcl?`Patient Renal Dose — ${activeTier[0]}`:"Renal Dosing Tiers"}
              </div>
              {crcl?(
                <div style={{fontSize:15,fontWeight:700,color:flagCfg.c,fontFamily:"JetBrains Mono,monospace"}}>{activeTier[1]}</div>
              ):(
                <div style={{display:"flex",flexDirection:"column",gap:4}}>
                  {dbDrug.tiers.map((t,i)=>{const fc=FLAG[t[2]]||FLAG.ok;return(
                    <div key={i} style={{display:"flex",gap:10,padding:"4px 8px",borderRadius:6,background:`${fc.c}0d`}}>
                      <span style={{fontSize:10,color:fc.c,fontFamily:"JetBrains Mono,monospace",minWidth:90}}>{t[0]}</span>
                      <span style={{fontSize:12,color:T.txt}}>{t[1]}</span>
                    </div>
                  );})}
                </div>
              )}
              {dbDrug.monitoring&&<div style={{fontSize:11,color:T.mut,marginTop:8,paddingTop:8,borderTop:`1px solid ${T.bdr}`}}>📋 {dbDrug.monitoring}</div>}
            </div>
          )}

          {/* Weight-based dose */}
          {dbDrug?.wt&&pt.wt&&(
            <div style={{...gl({padding:"12px 16px",marginBottom:12,borderLeft:`3px solid ${T.teal}`})}}>
              <div style={{fontSize:9,color:T.teal,fontFamily:"JetBrains Mono,monospace",letterSpacing:1.5,fontWeight:700,textTransform:"uppercase",marginBottom:6}}>Weight-Based Dose ({pt.wt} kg)</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                {[["Dose/kg",`${dbDrug.wt.dpkg} ${dbDrug.wt.unit}/kg`,T.mut],
                  ["Calculated",`${(parseFloat(pt.wt)*dbDrug.wt.dpkg).toFixed(1)} ${dbDrug.wt.unit}`,T.teal],
                  ["Max",`${dbDrug.wt.max} ${dbDrug.wt.unit}`,T.coral]].map(([l,v,c])=>(
                  <div key={l} style={{background:T.card,borderRadius:8,padding:"8px 10px"}}>
                    <div style={{fontSize:9,color:T.dim,marginBottom:3}}>{l}</div>
                    <div style={{fontSize:14,fontWeight:700,color:c,fontFamily:"JetBrains Mono,monospace"}}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{fontSize:11,color:T.mut,marginTop:8}}>{dbDrug.wt.note}</div>
            </div>
          )}

          {/* AI Summary */}
          {!aiSum?(
            <button onClick={handleAI} disabled={aiLoad} style={{...ab(T.teal,{marginBottom:12,display:"flex",alignItems:"center",gap:8,opacity:aiLoad?.6:1})}}>
              {aiLoad?<><Sp/> Generating ED Summary...</>:"⚡ Generate AI ED Summary"}
            </button>
          ):(
            !aiSum._err&&(
              <div className="u-in" style={{...gl({padding:"16px 18px",marginBottom:12,border:`1px solid ${T.teal}35`})}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
                  <span style={{fontSize:12,fontWeight:700,color:T.teal}}>⚡ AI ED Summary</span>
                  <span style={{fontSize:10,color:T.dim}}>AI-generated · Verify clinically</span>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
                  {[["Indication",aiSum.ed_indication,T.tD],["Typical ED Dose",aiSum.typical_ed_dose,T.gD],
                    ["Route",aiSum.route,T.card],["Onset / Duration",aiSum.onset_duration,T.card]].map(([l,v,bg])=>(
                    <div key={l} style={{background:bg,borderRadius:8,padding:"10px 12px",border:`1px solid ${T.bdr}`}}>
                      <div style={{fontSize:9,color:T.dim,marginBottom:3,textTransform:"uppercase",letterSpacing:1}}>{l}</div>
                      <div style={{fontSize:12,color:T.txt,fontWeight:600}}>{v}</div>
                    </div>
                  ))}
                </div>
                {aiSum.critical_warnings?.length>0&&(
                  <div style={{marginBottom:8}}>
                    <div style={{fontSize:9,color:T.coral,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>⚠ Critical Warnings</div>
                    {aiSum.critical_warnings.map((w,i)=><div key={i} style={{background:T.cD,borderRadius:6,padding:"6px 10px",marginBottom:4,fontSize:12,color:T.txt,borderLeft:`3px solid ${T.coral}`}}>{w}</div>)}
                  </div>
                )}
                {aiSum.clinical_pearls?.length>0&&(
                  <div>
                    <div style={{fontSize:9,color:T.gold,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>★ Clinical Pearls</div>
                    {aiSum.clinical_pearls.map((p,i)=><div key={i} style={{background:T.gD,borderRadius:6,padding:"6px 10px",marginBottom:4,fontSize:12,color:T.txt,borderLeft:`3px solid ${T.gold}`}}>{p}</div>)}
                  </div>
                )}
              </div>
            )
          )}

          {/* Ped Calc */}
          <div style={{...gl({marginBottom:12,overflow:"hidden"}),border:`1px solid ${T.bdr}`}}>
            <button onClick={()=>setExp(p=>({...p,ped:!p.ped}))} style={{width:"100%",background:"none",border:"none",padding:"11px 16px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:12,fontWeight:700,color:T.gold}}>👶 Pediatric Dose Calculator</span>
              <span style={{color:T.dim,fontSize:12}}>{exp.ped?"▲":"▼"}</span>
            </button>
            {exp.ped&&(
              <div style={{padding:"0 16px 14px",borderTop:`1px solid ${T.bdr}`}}>
                <div style={{display:"flex",gap:8,alignItems:"center",marginTop:12,flexWrap:"wrap"}}>
                  <input type="number" value={pedWt} onChange={e=>{setPedWt(e.target.value);setPedRes(null);}}
                    onKeyDown={e=>e.key==="Enter"&&handlePed()} placeholder="Weight (kg)"
                    style={{...ib({width:140})}} />
                  <button onClick={handlePed} disabled={!pedWt||pedLoad} style={{...ab(T.gold,{display:"flex",alignItems:"center",gap:7,opacity:(!pedWt||pedLoad)?.4:1})}}>
                    {pedLoad?<><Sp/>Calculating...</>:"Calculate"}
                  </button>
                </div>
                {pedRes&&!pedRes._err&&(
                  <div className="u-in" style={{marginTop:12}}>
                    {pedRes.age_restrictions&&<div style={{background:T.cD,borderRadius:7,padding:"7px 12px",marginBottom:8,fontSize:11,color:T.coral,borderLeft:`3px solid ${T.coral}`}}>⚠ {pedRes.age_restrictions}</div>}
                    {pedRes.doses?.map((d,i)=>(
                      <div key={i} style={{background:T.gD,borderRadius:9,padding:"11px 14px",marginBottom:8,border:`1px solid ${T.gold}25`}}>
                        <div style={{fontSize:9,color:T.gold,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:7}}>{d.indication}</div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                          {[["Dose/kg",d.dose_per_kg,T.mut],["Calculated",d.calculated_dose,T.gold],["Max",d.max_dose,T.coral]].map(([l,v,c])=>(
                            <div key={l}><div style={{fontSize:8,color:T.dim,marginBottom:2}}>{l}</div><div style={{fontSize:13,fontWeight:700,color:c,fontFamily:"JetBrains Mono,monospace"}}>{v}</div></div>
                          ))}
                        </div>
                        <div style={{display:"flex",gap:6,marginTop:7}}><span style={{...tg(T.mut),fontSize:10}}>{d.route}</span><span style={{...tg(T.mut),fontSize:10}}>{d.frequency}</span></div>
                      </div>
                    ))}
                    {pedRes.safety_note&&<div style={{fontSize:10,color:T.dim,lineHeight:1.6}}>{pedRes.safety_note}</div>}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* FDA Label Sections */}
          {LABEL_SECS.map(({k,l,c})=>{
            const txt=sel[k]?.[0]; if(!txt) return null;
            const long=txt.length>320;
            return(
              <div key={k} style={{...gl({padding:"12px 16px",marginBottom:8,borderLeft:`3px solid ${c}45`})}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                  <span style={{fontSize:9,fontWeight:700,color:c,textTransform:"uppercase",letterSpacing:1}}>{l}</span>
                  {long&&<button onClick={()=>setExp(p=>({...p,[k]:!p[k]}))} style={{background:"none",border:"none",color:T.teal,fontSize:10,cursor:"pointer"}}>
                    {exp[k]?"▲ Less":"▼ More"}
                  </button>}
                </div>
                <p style={{margin:0,fontSize:12,color:T.mut,lineHeight:1.6}}>{exp[k]?txt:trunc(txt)}</p>
              </div>
            );
          })}
        </div>
      )}

      {!sel&&!res.length&&!busy&&(
        <div style={{textAlign:"center",padding:"60px 20px",color:T.dim}}>
          <div style={{fontSize:40,marginBottom:12}}>⚗</div>
          <div style={{fontSize:14,color:T.mut,marginBottom:5}}>Search any medication by brand name, generic, or ingredient</div>
          <div style={{fontSize:11}}>FDA label · AI ED summary · Renal dosing · Pediatric calc</div>
        </div>
      )}
    </div>
  );
}

// ── Tab 2: Weight & Drip ──────────────────────────────────────────────────────
function WeightDripTab({pt}) {
  const [mode,setMode]=useState("wt"); // "wt" | "drip" | "rsi" | "cp"
  const [selDrug,setSelDrug]=useState(null);
  const [localWt,setLocalWt]=useState("");
  const [dripDose,setDripDose]=useState("");
  const [dripConc,setDripConc]=useState(0);
  const [rsiInd,setRsiInd]=useState("etom");
  const [rsiPar,setRsiPar]=useState("succ");
  const [cpBili,setCpBili]=useState(""); const [cpAlb,setCpAlb]=useState("");
  const [cpPT,setCpPT]=useState(""); const [cpAsc,setCpAsc]=useState("none");
  const [cpEnc,setCpEnc]=useState("none");

  const wt=parseFloat(pt.wt||localWt)||0;
  const wtDrugs=DB.filter(d=>d.wt!==null);
  const dripDrugs=DB.filter(d=>d.drip!==null);
  const rsiInductions=DB.filter(d=>["etom","ketam","prop"].includes(d.id));
  const rsiParalytics=DB.filter(d=>["succ","roc"].includes(d.id));

  const calcDose=(drug)=>{
    if(!drug?.wt||!wt) return null;
    const d=drug.wt;
    const calc=d.dpkg?wt*d.dpkg:d.lo;
    const capped=Math.min(calc,d.max);
    const vol=d.conc>0?capped/d.conc:null;
    return {calc:calc.toFixed(1),capped:capped.toFixed(1),vol:vol?vol.toFixed(1):null,unit:d.unit,conc:d.conc,route:d.route,note:d.note};
  };

  const calcDrip=()=>{
    if(!selDrug?.drip||!wt||!dripDose) return null;
    const d=selDrug.drip;
    const conc=selDrug.drip.concs[dripConc]?.[1]||selDrug.drip.concs[0][1];
    const dose=parseFloat(dripDose);
    if(d.unit.includes("mcg/kg")) { const mlhr=(dose*wt*60)/conc; return {rate:mlhr.toFixed(1),unit:"mL/hr",detail:`${dose} mcg/kg/min × ${wt} kg ÷ ${conc} mcg/mL × 60`}; }
    if(d.unit.includes("mg/min")) { const mlhr=(dose*60)/conc; return {rate:mlhr.toFixed(1),unit:"mL/hr",detail:`${dose} mg/min ÷ ${conc} mg/mL × 60`}; }
    const mlhr=(dose*60)/conc;
    return {rate:mlhr.toFixed(1),unit:"mL/hr",detail:`${dose} ${d.unit} ÷ ${conc} × 60`};
  };

  const dripResult=useMemo(calcDrip,[selDrug,wt,dripDose,dripConc]);

  const DoseResult=({drug})=>{
    const r=calcDose(drug);
    if(!r) return <div style={{fontSize:11,color:T.dim,padding:"10px 0"}}>Enter patient weight above to calculate</div>;
    return(
      <div style={{...gl({padding:"14px 16px",marginTop:8,border:`1px solid ${T.teal}35`})}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:8}}>
          {[[`${drug.wt.dpkg||drug.wt.lo} ${r.unit}/kg`,"Dose/kg",T.mut],
            [`${r.capped} ${r.unit}`,"Calculated",T.teal],
            [r.vol?`${r.vol} mL`:"—","Volume",T.gold]].map(([v,l,c])=>(
            <div key={l} style={{background:T.card,borderRadius:8,padding:"8px 10px",border:`1px solid ${T.bdr}`}}>
              <div style={{fontSize:8,color:T.dim,marginBottom:2}}>{l}</div>
              <div style={{fontSize:16,fontWeight:700,color:c,fontFamily:"JetBrains Mono,monospace"}}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{fontSize:11,color:T.mut,lineHeight:1.5}}>{r.note}</div>
        {drug.wt.conc>0&&<div style={{fontSize:9,color:T.dim,marginTop:4}}>Conc: {drug.wt.conc} {r.unit}/mL · Route: {r.route}</div>}
      </div>
    );
  };

  return(
    <div className="u-in">
      {!pt.wt&&(
        <div style={{...gl({padding:"10px 14px",marginBottom:14,borderLeft:`3px solid ${T.gold}`})}}>
          <span style={{fontSize:12,color:T.gold}}>⚠ Enter patient weight in the banner above for auto-calculations, or:</span>
          <div style={{display:"flex",gap:8,alignItems:"center",marginTop:8}}>
            <input type="number" value={localWt} onChange={e=>setLocalWt(e.target.value)} placeholder="Quick weight (kg)"
              style={{...ib({width:160})}} />
          </div>
        </div>
      )}

      {/* Mode tabs */}
      <div style={{display:"flex",gap:5,marginBottom:18,background:T.card,borderRadius:9,padding:4,border:`1px solid ${T.bdr}`,width:"fit-content"}}>
        {[["wt","⚖ Weight Dosing"],["drip","💧 Drip Calculator"],["rsi","🫁 RSI Kit"],["cp","🫀 Child-Pugh"]].map(([m,l])=>(
          <button key={m} onClick={()=>{setMode(m);setSelDrug(null);}} style={{padding:"6px 16px",borderRadius:7,border:"none",cursor:"pointer",fontFamily:"DM Sans,sans-serif",fontSize:12,fontWeight:700,background:mode===m?T.teal:"transparent",color:mode===m?"#060e1a":T.mut,transition:"all .16s"}}>{l}</button>
        ))}
      </div>

      {/* Weight Dosing */}
      {mode==="wt"&&(
        <div style={{display:"grid",gridTemplateColumns:"200px 1fr",gap:14,minHeight:300}}>
          <div style={{...gl({padding:"8px",overflow:"auto",maxHeight:500})}}>
            {["rsi","sedation","analgesic","antibiotic","cardiac","reversal","anticoagulant"].map(cat=>{
              const drugs=wtDrugs.filter(d=>d.cat===cat);
              if(!drugs.length) return null;
              const catLabel={rsi:"RSI",sedation:"Sedation",analgesic:"Analgesia",antibiotic:"Antibiotics",cardiac:"Cardiac",reversal:"Reversal",anticoagulant:"Anticoagulation"}[cat]||cat;
              return(
                <div key={cat} style={{marginBottom:8}}>
                  <div style={{fontSize:8,color:T.dim,fontFamily:"JetBrains Mono,monospace",letterSpacing:1.5,textTransform:"uppercase",padding:"2px 6px",marginBottom:3}}>{catLabel}</div>
                  {drugs.map(d=>(
                    <button key={d.id} onClick={()=>setSelDrug(d)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%",textAlign:"left",padding:"7px 10px",borderRadius:7,border:`1px solid ${selDrug?.id===d.id?T.teal+"55":T.bdr}`,background:selDrug?.id===d.id?T.tD:T.card,color:T.txt,fontSize:12,fontFamily:"DM Sans,sans-serif",cursor:"pointer",marginBottom:3}}>
                      <span>{d.name}</span>
                      {ISMP.has(d.id)&&<span style={{fontSize:8,color:T.coral,fontWeight:700,flexShrink:0}}>⚠</span>}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
          <div>
            {selDrug?(
              <div className="u-in">
                <h3 style={{margin:"0 0 4px",fontFamily:"Playfair Display,serif",fontSize:18,color:T.teal}}>{selDrug.name}</h3>
                <div style={{fontSize:11,color:T.mut,marginBottom:10}}>{selDrug.wt?.ind} · {selDrug.wt?.route} · {selDrug.wt?.dpkg} {selDrug.wt?.unit}/kg</div>
                <DoseResult drug={selDrug}/>
                {selDrug.ci.length>0&&(
                  <div style={{...gl({padding:"10px 14px",marginTop:10,borderLeft:`3px solid ${T.coral}`})}}>
                    <div style={{fontSize:9,color:T.coral,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>Contraindications</div>
                    {selDrug.ci.map((c,i)=><div key={i} style={{fontSize:11,color:T.mut,marginBottom:2}}>• {c}</div>)}
                  </div>
                )}
                {selDrug.interactions.length>0&&(
                  <div style={{...gl({padding:"10px 14px",marginTop:8,borderLeft:`3px solid ${T.gold}`})}}>
                    <div style={{fontSize:9,color:T.gold,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>Key Interactions</div>
                    {selDrug.interactions.map((x,i)=><div key={i} style={{fontSize:11,color:T.mut,marginBottom:2}}>• {x}</div>)}
                  </div>
                )}
              </div>
            ):<div style={{textAlign:"center",padding:"60px 20px",color:T.dim}}>
              <div style={{fontSize:32,marginBottom:10}}>⚖</div>
              <div style={{fontSize:13,color:T.mut}}>Select a drug from the list</div>
            </div>}
          </div>
        </div>
      )}

      {/* Drip Calculator */}
      {mode==="drip"&&(
        <div style={{maxWidth:500}}>
          <div style={{marginBottom:14}}>
            <div style={{fontSize:9,color:T.dim,fontFamily:"JetBrains Mono,monospace",letterSpacing:1.5,textTransform:"uppercase",marginBottom:7}}>Select Drip Drug</div>
            <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
              {dripDrugs.map(d=>(
                <button key={d.id} onClick={()=>{setSelDrug(d);setDripDose(String(d.drip.lo));setDripConc(0);}} style={{...ab(selDrug?.id===d.id?T.teal:T.mut,{padding:"6px 14px",fontSize:12,fontWeight:selDrug?.id===d.id?700:500})}}>
                  {d.name}
                </button>
              ))}
            </div>
          </div>
          {selDrug?.drip&&(
            <div className="u-in">
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                <div>
                  <div style={{fontSize:9,color:T.dim,fontFamily:"JetBrains Mono,monospace",letterSpacing:1,textTransform:"uppercase",marginBottom:5}}>Dose ({selDrug.drip.unit})</div>
                  <input type="number" value={dripDose} onChange={e=>setDripDose(e.target.value)}
                    placeholder={`${selDrug.drip.lo}–${selDrug.drip.hi}`} style={{...ib()}} />
                  <div style={{fontSize:9,color:T.dim,marginTop:3}}>Range: {selDrug.drip.lo}–{selDrug.drip.hi} {selDrug.drip.unit}</div>
                </div>
                <div>
                  <div style={{fontSize:9,color:T.dim,fontFamily:"JetBrains Mono,monospace",letterSpacing:1,textTransform:"uppercase",marginBottom:5}}>Concentration</div>
                  <select value={dripConc} onChange={e=>setDripConc(parseInt(e.target.value))} style={{...ib({cursor:"pointer"})}}>
                    {selDrug.drip.concs.map(([l],i)=><option key={i} value={i}>{l}</option>)}
                  </select>
                </div>
              </div>
              {dripResult&&(
                <div style={{...gl({padding:"18px",textAlign:"center",border:`2px solid ${T.orange}40`,marginBottom:12})}}>
                  <div style={{fontSize:9,color:T.dim,fontFamily:"JetBrains Mono,monospace",letterSpacing:1.5,textTransform:"uppercase",marginBottom:6}}>Infusion Rate</div>
                  <div style={{fontFamily:"JetBrains Mono,monospace",fontWeight:700,fontSize:40,color:T.orange,lineHeight:1}}>{dripResult.rate}</div>
                  <div style={{fontSize:14,color:T.mut,marginTop:4}}>{dripResult.unit}</div>
                  <div style={{fontSize:9,color:T.dim,marginTop:6}}>{dripResult.detail}</div>
                </div>
              )}
              <div style={{fontSize:11,color:T.mut,lineHeight:1.6}}>{selDrug.drip.note}</div>
            </div>
          )}
          {!selDrug&&<div style={{textAlign:"center",padding:"40px 20px",color:T.dim,fontSize:13}}>Select a drip drug above to calculate infusion rate</div>}
        </div>
      )}

      {/* RSI Kit */}
      {mode==="rsi"&&(
        <div style={{maxWidth:600}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:16}}>
            <div>
              <div style={{fontSize:9,color:T.dim,fontFamily:"JetBrains Mono,monospace",letterSpacing:1.5,textTransform:"uppercase",marginBottom:7}}>Induction Agent</div>
              <div style={{display:"flex",flexDirection:"column",gap:5}}>
                {rsiInductions.map(d=>(
                  <button key={d.id} onClick={()=>setRsiInd(d.id)} style={{...ab(rsiInd===d.id?T.coral:T.mut,{textAlign:"left",padding:"8px 12px",fontSize:12})}}>
                    <div style={{fontWeight:700}}>{d.name}</div>
                    <div style={{fontSize:10,fontWeight:400,opacity:.8}}>{d.wt?.dpkg} mg/kg IV</div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{fontSize:9,color:T.dim,fontFamily:"JetBrains Mono,monospace",letterSpacing:1.5,textTransform:"uppercase",marginBottom:7}}>Paralytic Agent</div>
              <div style={{display:"flex",flexDirection:"column",gap:5}}>
                {rsiParalytics.map(d=>(
                  <button key={d.id} onClick={()=>setRsiPar(d.id)} style={{...ab(rsiPar===d.id?T.purple:T.mut,{textAlign:"left",padding:"8px 12px",fontSize:12})}}>
                    <div style={{fontWeight:700}}>{d.name}</div>
                    <div style={{fontSize:10,fontWeight:400,opacity:.8}}>{d.wt?.dpkg} mg/kg IV</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {[DB.find(d=>d.id===rsiInd),DB.find(d=>d.id===rsiPar)].filter(Boolean).map(drug=>{
              const r=calcDose(drug);
              const col=drug.cat==="rsi"&&["succ","roc"].includes(drug.id)?T.purple:T.coral;
              return(
                <div key={drug.id} style={{...gl({padding:"14px 16px",borderLeft:`3px solid ${col}`})}}>
                  <div style={{fontSize:9,color:col,fontFamily:"JetBrains Mono,monospace",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>{["succ","roc"].includes(drug.id)?"PARALYTIC":"INDUCTION"}</div>
                  <div style={{fontFamily:"Playfair Display,serif",fontSize:16,color:T.txt,marginBottom:6}}>{drug.name}</div>
                  {r?(
                    <>
                      <div style={{fontFamily:"JetBrains Mono,monospace",fontSize:28,fontWeight:700,color:col,lineHeight:1}}>{r.capped} <span style={{fontSize:14}}>{r.unit}</span></div>
                      {r.vol&&<div style={{fontSize:13,color:T.teal,fontFamily:"JetBrains Mono,monospace",marginTop:2}}>{r.vol} mL ({drug.wt?.conc} {r.unit}/mL)</div>}
                    </>
                  ):<div style={{fontSize:11,color:T.dim}}>Enter weight</div>}
                  <div style={{fontSize:10,color:T.mut,marginTop:6,lineHeight:1.5}}>{drug.wt?.note}</div>
                </div>
              );
            })}
          </div>
          {!wt&&<div style={{fontSize:11,color:T.gold,marginTop:10}}>⚠ Enter patient weight to calculate doses</div>}
        </div>
      )}

      {/* Child-Pugh Hepatic Scoring */}
      {mode==="cp"&&(()=>{
        const cpScore=()=>{
          if(!cpBili||!cpAlb||!cpPT) return null;
          let s=0;
          s+=parseFloat(cpBili)<2?1:parseFloat(cpBili)<=3?2:3;
          s+=parseFloat(cpAlb)>3.5?1:parseFloat(cpAlb)>=2.8?2:3;
          s+=parseFloat(cpPT)<4?1:parseFloat(cpPT)<=6?2:3;
          s+=cpAsc==="none"?1:cpAsc==="mild"?2:3;
          s+=cpEnc==="none"?1:cpEnc==="grade12"?2:3;
          return {score:s,cls:s<=6?"A":s<=9?"B":"C"};
        };
        const cp=cpScore();
        const clsColor=cp?{A:T.green,B:T.gold,C:T.coral}[cp.cls]:T.teal;
        const clsNote=cp?{A:"Mild hepatic impairment — standard dosing for most agents",B:"Moderate — reduce dose 25-50% for hepatically metabolized drugs (morphine, midazolam, metronidazole, azithromycin)",C:"Severe — avoid valproate, azithromycin, metronidazole; major reductions required; prefer renally cleared agents"}[cp.cls]:"";
        return(
          <div style={{maxWidth:520}}>
            <p style={{fontSize:12,color:T.mut,margin:"0 0 16px"}}>Calculate hepatic function to guide dosing of hepatically metabolized drugs.</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
              {[["Bilirubin","cpBili",cpBili,setCpBili,"mg/dL"],["Albumin","cpAlb",cpAlb,setCpAlb,"g/dL"],["PT Excess","cpPT",cpPT,setCpPT,"sec"]].map(([l,k,v,set,u])=>(
                <div key={k}>
                  <div style={{fontSize:8,color:T.dim,fontFamily:"JetBrains Mono,monospace",letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>{l}</div>
                  <div style={{position:"relative"}}>
                    <input type="number" value={v} onChange={e=>set(e.target.value)} placeholder="—"
                      style={{...ib({paddingRight:30})}} />
                    <span style={{position:"absolute",right:9,top:"50%",transform:"translateY(-50%)",fontSize:9,color:T.dim}}>{u}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
              {[["Ascites",cpAsc,setCpAsc,[["none","None"],["mild","Mild"],["severe","Tense"]]],
                ["Encephalopathy",cpEnc,setCpEnc,[["none","None"],["grade12","Grade 1-2"],["grade34","Grade 3-4"]]]].map(([l,v,set,opts])=>(
                <div key={l}>
                  <div style={{fontSize:8,color:T.dim,fontFamily:"JetBrains Mono,monospace",letterSpacing:1,textTransform:"uppercase",marginBottom:5}}>{l}</div>
                  <div style={{display:"flex",gap:4}}>
                    {opts.map(([k,ol])=>(
                      <button key={k} onClick={()=>set(k)} style={{flex:1,fontSize:10,fontWeight:600,padding:"6px 4px",borderRadius:7,cursor:"pointer",border:`1px solid ${v===k?T.orange+"55":T.bdr}`,background:v===k?T.oD:"transparent",color:v===k?T.orange:T.mut,fontFamily:"DM Sans,sans-serif"}}>{ol}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {cp?(
              <div className="u-in" style={{...gl({padding:"16px 18px",border:`1px solid ${clsColor}40`,borderLeft:`4px solid ${clsColor}`})}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <div>
                    <div style={{fontSize:9,color:clsColor,fontFamily:"JetBrains Mono,monospace",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:3}}>Child-Pugh Class</div>
                    <div style={{fontSize:12,color:T.mut,lineHeight:1.55,maxWidth:320}}>{clsNote}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontFamily:"JetBrains Mono,monospace",fontWeight:700,fontSize:44,color:clsColor,lineHeight:1}}>{cp.cls}</div>
                    <div style={{fontSize:12,color:T.dim}}>Score: {cp.score}/15</div>
                  </div>
                </div>
                <div style={{borderTop:`1px solid ${T.bdr}`,paddingTop:10}}>
                  <div style={{fontSize:9,color:T.dim,fontFamily:"JetBrains Mono,monospace",letterSpacing:1.5,textTransform:"uppercase",marginBottom:6}}>Scoring Breakdown</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:5}}>
                    {[["Bili",cpBili<2?1:cpBili<=3?2:3],["Alb",cpAlb>3.5?1:cpAlb>=2.8?2:3],["PT",cpPT<4?1:cpPT<=6?2:3],
                      ["Ascites",cpAsc==="none"?1:cpAsc==="mild"?2:3],["Enceph",cpEnc==="none"?1:cpEnc==="grade12"?2:3]].map(([l,pts])=>(
                      <div key={l} style={{background:T.card,borderRadius:7,padding:"6px 4px",textAlign:"center",border:`1px solid ${T.bdr}`}}>
                        <div style={{fontSize:8,color:T.dim,marginBottom:2}}>{l}</div>
                        <div style={{fontFamily:"JetBrains Mono,monospace",fontSize:16,fontWeight:700,color:pts===1?T.green:pts===2?T.gold:T.coral}}>{pts}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ):(
              <div style={{textAlign:"center",padding:"30px 20px",color:T.dim}}>
                <div style={{fontSize:28,marginBottom:8}}>🫀</div>
                <div style={{fontSize:13,color:T.mut}}>Enter bilirubin, albumin, and PT to calculate</div>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}

// ── Tab 3: Interaction Checker ────────────────────────────────────────────────
function InteractionTab({ixDrugs,setIxDrugs}) {
  const [q,setQ]=useState(""); const [res,setRes]=useState([]); const [busy,setBusy]=useState(false);
  const [ixRes,setIxRes]=useState(null); const [ixLoad,setIxLoad]=useState(false);
  const deb=useRef(null);

  const doSearch=useCallback(v=>{
    setQ(v);
    if(deb.current) clearTimeout(deb.current);
    if(!v.trim()||v.length<2){setRes([]);return;}
    deb.current=setTimeout(async()=>{setBusy(true);const r=await searchFDA(v);setRes(r.slice(0,5));setBusy(false);},400);
  },[]);

  const addDrug=async d=>{
    const n=fdaName(d), g=fdaGen(d);
    if(ixDrugs.find(x=>x.name===n)||ixDrugs.length>=6) return;
    setIxDrugs(p=>[...p,{name:n,generic:g,rxcui:null,resolving:true}]);
    setQ(""); setRes([]); setIxRes(null);
    const rxcui=await getRxCUI(g||n);
    setIxDrugs(p=>p.map(x=>x.name===n?{...x,rxcui,resolving:false}:x));
  };

  const check=async()=>{
    const valid=ixDrugs.filter(d=>d.rxcui);
    if(valid.length<2) return;
    setIxLoad(true);
    setIxRes(await getIxs(valid.map(d=>d.rxcui)));
    setIxLoad(false);
  };

  return(
    <div className="u-in" style={{maxWidth:680}}>
      <p style={{fontSize:12,color:T.mut,margin:"0 0 14px"}}>Add up to 6 medications to check drug-drug interactions via NIH NLM RxNav.</p>
      <div style={{position:"relative",maxWidth:480,marginBottom:12}}>
        <span style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",fontSize:14,color:ixDrugs.length>=6?T.dim:T.teal,pointerEvents:"none"}}>➕</span>
        <input value={q} onChange={e=>doSearch(e.target.value)} disabled={ixDrugs.length>=6}
          placeholder={ixDrugs.length>=6?"Maximum 6 reached":"Search medication to add..."}
          style={{...ib({paddingLeft:42,opacity:ixDrugs.length>=6?.4:1})}} />
        {busy&&<span style={{position:"absolute",right:13,top:"50%",transform:"translateY(-50%)",fontSize:11,color:T.dim}}>...</span>}
      </div>

      {res.length>0&&(
        <div style={{...gl({maxWidth:480,marginBottom:14,overflow:"hidden"})}}>
          {res.map((d,i)=>(
            <div key={i} className="u-hov" onClick={()=>addDrug(d)} style={{padding:"9px 14px",cursor:"pointer",borderBottom:i<res.length-1?`1px solid ${T.bdr}`:"none",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><div style={{fontSize:12,fontWeight:700,color:T.txt}}>{fdaName(d)}</div><div style={{fontSize:10,color:T.mut}}>{fdaGen(d)}</div></div>
              <span style={{color:T.teal,fontSize:18}}>+</span>
            </div>
          ))}
        </div>
      )}

      {ixDrugs.length>0&&(
        <div style={{marginBottom:16}}>
          <div style={{fontSize:9,color:T.mut,fontFamily:"JetBrains Mono,monospace",letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>{ixDrugs.length} Medication{ixDrugs.length!==1?"s":""} Added</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:14}}>
            {ixDrugs.map((d,i)=>(
              <div key={i} style={{background:T.tD,border:`1px solid ${T.tB}`,borderRadius:8,padding:"7px 12px",display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:12,color:T.teal,fontWeight:700}}>{d.name}</span>
                {d.resolving&&<span style={{fontSize:10,color:T.dim}}>resolving...</span>}
                {!d.resolving&&d.rxcui&&<span style={{fontSize:9,color:T.dim,fontFamily:"JetBrains Mono,monospace"}}>RxCUI {d.rxcui}</span>}
                {!d.resolving&&!d.rxcui&&<span style={{fontSize:10,color:T.coral}}>No RxCUI</span>}
                <button onClick={()=>{setIxDrugs(p=>p.filter(x=>x.name!==d.name));setIxRes(null);}} style={{background:"none",border:"none",color:T.coral,cursor:"pointer",fontSize:14,padding:0,lineHeight:1}}>✕</button>
              </div>
            ))}
          </div>
          <button onClick={check} disabled={ixLoad||ixDrugs.filter(d=>d.rxcui).length<2||ixDrugs.some(d=>d.resolving)}
            style={{...ab(T.teal,{display:"flex",alignItems:"center",gap:8,opacity:(ixDrugs.filter(d=>d.rxcui).length<2||ixLoad)?.4:1})}}>
            {ixLoad?<><Sp/>Checking...</>:"🔬 Check Interactions"}
          </button>
        </div>
      )}

      {ixRes!==null&&!ixLoad&&(
        <div className="u-in">
          {ixRes.length===0?(
            <div style={{...gl({padding:"24px",textAlign:"center"})}}>
              <div style={{fontSize:28,marginBottom:8}}>✅</div>
              <div style={{fontWeight:700,fontSize:15,color:T.green,marginBottom:4}}>No Known Interactions Found</div>
              <div style={{fontSize:11,color:T.mut}}>Based on NLM RxNav data. Always verify with clinical pharmacist.</div>
            </div>
          ):(
            <>
              <div style={{fontSize:10,color:T.coral,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>⚠ Interactions Detected</div>
              {ixRes.flatMap((g,gi)=>(g.fullInteractionType||[]).flatMap((t,ti)=>(t.interactionPair||[]).map((pair,pi)=>{
                const a=pair.interactionConcept?.[0]?.minConceptItem?.name||"";
                const b=pair.interactionConcept?.[1]?.minConceptItem?.name||"";
                const sev=pair.severity||"";
                const sc=sev==="high"?T.coral:sev==="moderate"?T.gold:T.mut;
                return(
                  <div key={`${gi}${ti}${pi}`} style={{...gl({padding:"12px 16px",marginBottom:8,borderLeft:`3px solid ${sc}55`})}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:7,flexWrap:"wrap",gap:6}}>
                      <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                        <span style={{...tg(T.coral),fontSize:11}}>{a}</span>
                        <span style={{color:T.dim,fontSize:11}}>×</span>
                        <span style={{...tg(T.coral),fontSize:11}}>{b}</span>
                      </div>
                      {sev&&<span style={{...tg(sc),fontSize:10,textTransform:"uppercase"}}>{sev}</span>}
                    </div>
                    <p style={{margin:"0 0 5px",fontSize:12,color:T.mut,lineHeight:1.6}}>{trunc(pair.description,380)}</p>
                    <div style={{fontSize:9,color:T.dim}}>Source: {g.sourceName}</div>
                  </div>
                );
              })))}
              <div style={{fontSize:10,color:T.dim,marginTop:6}}>Data from NIH NLM RxNav. Confirm with clinical pharmacist.</div>
            </>
          )}
        </div>
      )}
      {!ixDrugs.length&&<div style={{textAlign:"center",padding:"50px 20px",color:T.dim}}><div style={{fontSize:36,marginBottom:10}}>🔬</div><div style={{fontSize:13,color:T.mut}}>Add two or more medications to check interactions</div></div>}
    </div>
  );
}

// ── Tab 4: Rx Builder ─────────────────────────────────────────────────────────
const PHARMACIES=[
  {id:"cvs",name:"CVS Pharmacy #3847",chain:"CVS",addr:"1420 Oak Ave",phone:"(217) 555-0142",epcs:true,open24h:true,hours:"Open 24 hours"},
  {id:"wag",name:"Walgreens #0291",chain:"WAG",addr:"832 Main St",phone:"(217) 555-0291",epcs:true,open24h:false,hours:"Open until 10pm"},
  {id:"hosp",name:"Hospital Outpatient Pharmacy",chain:"HOSP",addr:"501 N First St",phone:"(217) 555-5000",epcs:true,open24h:true,hours:"Open 24 hours"},
  {id:"amz",name:"Amazon Pharmacy",chain:"AMAZON",addr:"Delivery to patient",phone:"1-855-745-5725",epcs:true,open24h:true,hours:"24/7 delivery"},
  {id:"wal",name:"Walmart Pharmacy #4421",chain:"WAL",addr:"2200 Commerce Blvd",phone:"(217) 555-4421",epcs:false,open24h:false,hours:"Open until 9pm"},
];
function RxBuilderTab({pt,crcl}) {
  const [rx,setRx]=useState({drug:"",dose:"",route:"PO",freq:"",qty:"",refills:"0",indication:"",ptName:"",dob:"",allergy:""});
  const [pharmacy,setPharmacy]=useState(null);
  const [copied,setCopied]=useState(false);
  const f=(k,v)=>setRx(p=>({...p,[k]:v}));

  const renalSig=useMemo(()=>{
    if(!rx.drug||!crcl) return null;
    const d=findDB(rx.drug);
    if(!d) return null;
    const tier=getActiveTier(d,crcl);
    if(!tier||tier[2]==="ok") return null;
    return {drug:d.name,dose:tier[1],flag:tier[2],label:tier[0]};
  },[rx.drug,crcl]);

  const preview=rx.drug?[
    `Patient: ${rx.ptName||"[Name]"} | DOB: ${rx.dob||"[DOB]"}`,
    `Allergies: ${rx.allergy||pt.allergy||"NKDA"}`,
    ``,
    `Rx: ${rx.drug} ${rx.dose}`,
    `Route: ${rx.route}`,
    `Sig: ${rx.freq}`,
    `Dispense: ${rx.qty||"#"} | Refills: ${rx.refills}`,
    `Indication: ${rx.indication||"—"}`,
    ``,
    pharmacy?`Pharmacy: ${pharmacy.name}\n${pharmacy.addr}\n${pharmacy.phone}${pharmacy.epcs?" [EPCS Capable]":""}`:""
  ].filter(l=>l!==undefined).join("\n"):"";

  const copy=()=>{
    if(!preview) return;
    navigator.clipboard?.writeText(preview).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);});
  };

  return(
    <div className="u-in" style={{display:"grid",gridTemplateColumns:"1fr 320px",gap:16,alignItems:"start"}}>
      <div>
        <div style={{...gl({padding:"14px 16px",marginBottom:14})}}>
          <div style={{fontSize:9,color:T.teal,fontFamily:"JetBrains Mono,monospace",letterSpacing:2,textTransform:"uppercase",marginBottom:10,fontWeight:700}}>Prescription Details</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
            {[["Drug Name","drug","text",true],["Dose","dose","text",false],["Quantity","qty","text",false],["Refills","refills","number",false]].map(([l,k,t,full])=>(
              <div key={k} style={full?{gridColumn:"1/-1"}:{}}>
                <div style={{fontSize:8,color:T.dim,fontFamily:"JetBrains Mono,monospace",letterSpacing:1,textTransform:"uppercase",marginBottom:3}}>{l}</div>
                <input type={t} value={rx[k]} onChange={e=>f(k,e.target.value)} style={{...ib()}} />
              </div>
            ))}
          </div>
          <div style={{marginBottom:8}}>
            <div style={{fontSize:8,color:T.dim,fontFamily:"JetBrains Mono,monospace",letterSpacing:1,textTransform:"uppercase",marginBottom:3}}>Route</div>
            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
              {["PO","IV","IM","SQ","IN","SL","TOP"].map(r=>(
                <button key={r} onClick={()=>f("route",r)} style={{...ab(rx.route===r?T.teal:T.mut,{padding:"5px 12px",fontSize:11,fontWeight:rx.route===r?700:500})}}>
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div style={{marginBottom:8}}>
            <div style={{fontSize:8,color:T.dim,fontFamily:"JetBrains Mono,monospace",letterSpacing:1,textTransform:"uppercase",marginBottom:3}}>Sig (Instructions)</div>
            <input value={rx.freq} onChange={e=>f("freq",e.target.value)} placeholder="e.g. Take 1 tablet twice daily with food" style={{...ib()}} />
            {renalSig&&(
              <div style={{marginTop:6,background:renalSig.flag==="avoid"?T.cD:T.gD,borderRadius:7,padding:"7px 11px",display:"flex",justifyContent:"space-between",alignItems:"center",border:`1px solid ${renalSig.flag==="avoid"?T.coral:T.gold}30`}}>
                <div>
                  <span style={{fontSize:9,fontWeight:700,color:renalSig.flag==="avoid"?T.coral:T.gold,textTransform:"uppercase",letterSpacing:1}}>⚠ Renal Adjustment ({renalSig.label}): </span>
                  <span style={{fontSize:11,color:T.txt}}>{renalSig.dose}</span>
                </div>
                <button onClick={()=>f("freq",renalSig.dose)} style={{...ab(renalSig.flag==="avoid"?T.coral:T.gold,{padding:"3px 10px",fontSize:10})}}>Apply</button>
              </div>
            )}
          </div>
          <div>
            <div style={{fontSize:8,color:T.dim,fontFamily:"JetBrains Mono,monospace",letterSpacing:1,textTransform:"uppercase",marginBottom:3}}>Indication</div>
            <input value={rx.indication} onChange={e=>f("indication",e.target.value)} placeholder="Clinical indication" style={{...ib()}} />
          </div>
        </div>

        <div style={{...gl({padding:"14px 16px",marginBottom:14})}}>
          <div style={{fontSize:9,color:T.gold,fontFamily:"JetBrains Mono,monospace",letterSpacing:2,textTransform:"uppercase",marginBottom:10,fontWeight:700}}>Patient Info</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {[["Patient Name","ptName"],["Date of Birth","dob"],["Allergies","allergy"]].map(([l,k])=>(
              <div key={k} style={k==="allergy"?{gridColumn:"1/-1"}:{}}>
                <div style={{fontSize:8,color:T.dim,fontFamily:"JetBrains Mono,monospace",letterSpacing:1,textTransform:"uppercase",marginBottom:3}}>{l}</div>
                <input value={rx[k]} onChange={e=>f(k,e.target.value)} placeholder={k==="allergy"?"NKDA":""} style={{...ib()}} />
              </div>
            ))}
          </div>
        </div>

        <div style={{...gl({padding:"14px 16px"})}}>
          <div style={{fontSize:9,color:T.purple,fontFamily:"JetBrains Mono,monospace",letterSpacing:2,textTransform:"uppercase",marginBottom:10,fontWeight:700}}>Select Pharmacy</div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {PHARMACIES.map(p=>(
              <div key={p.id} className="u-hov" onClick={()=>setPharmacy(p)} style={{...gl({padding:"10px 14px",cursor:"pointer",border:`1px solid ${pharmacy?.id===p.id?T.teal+"55":T.bdr}`,background:pharmacy?.id===p.id?T.tD:T.card})}} >
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontSize:12,fontWeight:700,color:T.txt}}>{p.name}</div>
                    <div style={{fontSize:10,color:T.mut}}>{p.addr} · {p.hours}</div>
                  </div>
                  <div style={{display:"flex",gap:5}}>
                    {p.epcs&&<span style={{...tg(T.teal),fontSize:9}}>⚡ EPCS</span>}
                    {p.open24h&&<span style={{...tg(T.green),fontSize:9}}>24h</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{position:"sticky",top:14}}>
        <div style={{fontSize:9,color:T.dim,fontFamily:"JetBrains Mono,monospace",letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>Prescription Preview</div>
        <div style={{...gl({padding:"14px 16px",marginBottom:10,border:`1px solid ${T.teal}30`})}}>
          {preview?(
            <pre style={{margin:0,fontFamily:"JetBrains Mono,monospace",fontSize:11,color:T.txt,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{preview}</pre>
          ):(
            <div style={{fontSize:11,color:T.dim,textAlign:"center",padding:"20px 0"}}>Fill in drug details to preview</div>
          )}
        </div>
        <button onClick={copy} disabled={!preview} style={{...ab(T.teal,{width:"100%",justifyContent:"center",display:"flex",opacity:!preview?.4:1})}}>
          {copied?"✓ Copied to Clipboard":"📋 Copy Prescription"}
        </button>
        {pharmacy?.epcs&&<button style={{...ab(T.purple,{width:"100%",marginTop:8,display:"flex",justifyContent:"center"})}}>⚡ e-Prescribe via EPCS</button>}
      </div>
    </div>
  );
}

// ── Tab 5: AI Pharmacist ──────────────────────────────────────────────────────
function AIPharmacistTab({pt,crcl,ibw}) {
  const [q,setQ]=useState(""); const [resp,setResp]=useState(null); const [busy,setBusy]=useState(false);
  const QUICK=["Safest opioid for this patient?","Which antibiotics should I avoid?","Can I use enoxaparin?","Vancomycin dosing strategy?","Anticoagulation for new AF?","Contrast nephropathy concern?","RSI drug selection for this patient?"];

  const ask=async()=>{
    if(!q.trim()||busy) return;
    setBusy(true); setResp(null);
    try {
      const ctx=[pt.age?`Age: ${pt.age}yr`:"",pt.wt?`Weight: ${pt.wt}kg`:"",pt.ht?`Height: ${pt.ht}cm`:"",
        pt.scr?`SCr: ${pt.scr} mg/dL`:"",crcl?`CrCl: ${Math.round(crcl)} mL/min`:"",
        ibw?`IBW: ${Math.round(ibw)}kg`:"",pt.dialysis?"On dialysis":""].filter(Boolean).join(", ");
      const r=await InvokeLLM({
        prompt:`You are a clinical ED pharmacist expert. Patient context: ${ctx||"No parameters entered"}.\n\nQuestion: ${q}\n\nRespond with: 1) Direct recommendation, 2) Key dosing details, 3) Primary safety concern. Clinical language, max 160 words.`,
        response_json_schema:{type:"object",properties:{recommendation:{type:"string"},dosing_details:{type:"string"},safety_concern:{type:"string"},confidence:{type:"string",enum:["High","Moderate","Low"]}},required:["recommendation","dosing_details","safety_concern","confidence"]},
      });
      setResp(r);
    } catch{setResp({_err:true});}
    setBusy(false);
  };

  return(
    <div className="u-in" style={{maxWidth:580}}>
      <div style={{...gl({padding:"10px 14px",marginBottom:14,borderLeft:`3px solid ${T.purple}`})}}>
        <div style={{fontSize:12,color:T.mut}}>Patient parameters from the banner above are automatically included in every consult. Ask about specific drugs, interactions, or dosing strategies.</div>
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:12}}>
        {QUICK.map(q2=>(
          <button key={q2} onClick={()=>setQ(q2)} style={{...ab(T.purple,{padding:"4px 10px",fontSize:11,fontWeight:500})}}>
            {q2}
          </button>
        ))}
      </div>
      <textarea value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&e.metaKey&&ask()}
        placeholder="Ask about dosing, interactions, renal/hepatic adjustments, drug selection..." rows={3}
        style={{...ib({resize:"vertical",lineHeight:1.6,marginBottom:10})}} />
      <button onClick={ask} disabled={!q.trim()||busy} style={{...ab(T.purple,{width:"100%",display:"flex",justifyContent:"center",alignItems:"center",gap:8,opacity:(!q.trim()||busy)?.4:1})}}>
        {busy?<><Sp/>Consulting...</>:"Ask AI Pharmacist"}
      </button>
      {resp&&!resp._err&&(
        <div className="u-in" style={{marginTop:14,display:"flex",flexDirection:"column",gap:8}}>
          {[["Recommendation",resp.recommendation,T.teal],["Dosing Details",resp.dosing_details,T.gold],["Safety Concern",resp.safety_concern,T.coral]].map(([l,v,c])=>v&&(
            <div key={l} style={{...gl({padding:"12px 15px",borderLeft:`3px solid ${c}55`})}}>
              <div style={{fontSize:9,color:c,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>{l}</div>
              <div style={{fontSize:13,color:T.txt,lineHeight:1.65}}>{v}</div>
            </div>
          ))}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:10,color:T.dim}}>AI-generated · Verify against clinical resources · Not a substitute for pharmacist consult</span>
            <span style={{...tg(resp.confidence==="High"?T.green:resp.confidence==="Moderate"?T.gold:T.coral),fontSize:10}}>{resp.confidence} Confidence</span>
          </div>
        </div>
      )}
      {resp?._err&&<div style={{fontSize:12,color:T.coral,marginTop:10}}>AI consult unavailable. Please consult clinical pharmacist directly.</div>}
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────
export default function UnifiedPharmacologyHub() {
  const [pt,setPt]=useState({age:"",wt:"",ht:"",scr:"",sex:"M",dialysis:false});
  const [tab,setTab]=useState("rx");
  const [ixDrugs,setIxDrugs]=useState([]);

  const crcl=useMemo(()=>calcCrCl({age:pt.age,wt:pt.wt,scr:pt.scr,sex:pt.sex}),[pt.age,pt.wt,pt.scr,pt.sex]);
  const ibw=useMemo(()=>calcIBW(pt.ht,pt.sex),[pt.ht,pt.sex]);

  const addToIx=useCallback(async({name,generic})=>{
    if(ixDrugs.find(d=>d.name===name)||ixDrugs.length>=6) return;
    setIxDrugs(p=>[...p,{name,generic,rxcui:null,resolving:true}]);
    const rxcui=await getRxCUI(generic||name);
    setIxDrugs(p=>p.map(d=>d.name===name?{...d,rxcui,resolving:false}:d));
  },[ixDrugs]);

  const TABS=[
    {id:"rx",    icon:"⚗",  label:"Rx Lookup"},
    {id:"wt",    icon:"⚖",  label:"Weight / Drip"},
    {id:"ix",    icon:"🔬", label:"Interactions",badge:ixDrugs.length>0?ixDrugs.length:null},
    {id:"build", icon:"📋", label:"Rx Builder"},
    {id:"ai",    icon:"🤖", label:"AI Pharmacist"},
  ];

  return(
    <div style={{background:T.bg,minHeight:"100vh",padding:"20px 18px 60px",fontFamily:"DM Sans,sans-serif",color:T.txt}}>

      {/* Header */}
      <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:22}}>
        <div style={{width:44,height:44,borderRadius:11,background:T.tD,border:`1px solid ${T.tB}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>⚗</div>
        <div>
          <h1 style={{margin:0,fontFamily:"Playfair Display,serif",fontSize:22,color:T.teal,letterSpacing:"-0.5px",lineHeight:1}}>Unified PharmacologyHub</h1>
          <p style={{margin:"3px 0 0",fontSize:12,color:T.mut}}>Rx Lookup · Weight Dosing · Interactions · Rx Builder · AI Pharmacist · {DB.length} drugs</p>
        </div>
      </div>

      {/* Patient Banner */}
      <PatientBanner pt={pt} setPt={setPt} crcl={crcl} ibw={ibw}/>

      {/* Tab navigation */}
      <div style={{display:"flex",gap:4,marginBottom:22,background:T.card,borderRadius:10,padding:4,border:`1px solid ${T.bdr}`,overflowX:"auto"}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 16px",borderRadius:8,border:"none",cursor:"pointer",fontFamily:"DM Sans,sans-serif",fontSize:13,fontWeight:700,whiteSpace:"nowrap",transition:"all .16s",background:tab===t.id?T.teal:"transparent",color:tab===t.id?"#060e1a":T.mut,flexShrink:0,position:"relative"}}>
            <span>{t.icon}</span><span>{t.label}</span>
            {t.badge&&<span style={{background:T.coral,color:"#fff",borderRadius:10,padding:"0 5px",fontSize:9,fontWeight:700,minWidth:16,textAlign:"center"}}>{t.badge}</span>}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab==="rx"  &&<RxLookupTab   pt={pt} crcl={crcl} onAddToIx={addToIx}/>}
      {tab==="wt"  &&<WeightDripTab pt={pt}/>}
      {tab==="ix"  &&<InteractionTab ixDrugs={ixDrugs} setIxDrugs={setIxDrugs}/>}
      {tab==="build"&&<RxBuilderTab pt={pt} crcl={crcl}/>}
      {tab==="ai"  &&<AIPharmacistTab pt={pt} crcl={crcl} ibw={ibw}/>}

      <div style={{marginTop:40,textAlign:"center"}}>
        <span style={{fontFamily:"JetBrains Mono,monospace",fontSize:9,color:T.dim,letterSpacing:1.5}}>
          NOTRYA · UNIFIED PHARMACOLOGY HUB · CLINICAL DECISION SUPPORT ONLY · VERIFY WITH PHARMACIST
        </span>
      </div>
    </div>
  );
}