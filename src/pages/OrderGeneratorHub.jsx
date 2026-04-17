import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";

// ════════════════════════════════════════════════════════════
//  ORDER GENERATOR HUB — Glassmorphism clinical order builder
// ════════════════════════════════════════════════════════════

const T = {
  bg:"#050f1e", bgPanel:"#081628", bgCard:"#0b1e36", bgUp:"#0e2544",
  border:"#1a3555", borderHi:"#2a4f7a",
  blue:"#3b9eff", teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b",
  purple:"#9b6dff", orange:"#ff9f43", green:"#3dffa0",
  txt:"#e8f0fe", txt2:"#8aaccc", txt3:"#4a6a8a", txt4:"#2e4a6a",
};

// ── Order set catalog ────────────────────────────────────────────────────────
const ORDER_SETS = [
  {
    id:"chest-pain", icon:"🫀", label:"Chest Pain / ACS",
    color:T.coral, glow:"rgba(255,107,107,0.3)", glass:"rgba(255,107,107,0.06)", border:"rgba(255,107,107,0.25)",
    badge:"ACC/AHA 2025", tags:["Troponin","ECG","Antiplatelet"],
    orders:{
      labs:["hs-Troponin I/T (0h + 3h serial)","CBC with differential","BMP (electrolytes, creatinine, glucose)","PT/INR, aPTT","Lipid panel (fasting)","BNP or NT-proBNP"],
      imaging:["12-lead ECG STAT (within 10 min)","Portable CXR PA/Lateral","Bedside echo (if hemodynamically unstable)"],
      meds:["Aspirin 324 mg PO chewed STAT","Nitroglycerin SL 0.4 mg q5min × 3 (if SBP >90)","Morphine 2–4 mg IV PRN pain (NSTEMI: use cautiously)","Heparin 60 U/kg IV bolus (max 4,000 U) → 12 U/kg/h","O₂ if SpO₂ <94%"],
      nursing:["Continuous telemetry","IV access × 2 (18g or larger)","NPO except medications","Vital signs q15min until stable","Allergy confirmation"],
    }
  },
  {
    id:"sepsis", icon:"🦠", label:"Sepsis / Septic Shock",
    color:T.orange, glow:"rgba(255,159,67,0.3)", glass:"rgba(255,159,67,0.06)", border:"rgba(255,159,67,0.25)",
    badge:"Surviving Sepsis 2021", tags:["Cultures","Lactate","Antibiotics"],
    orders:{
      labs:["Blood cultures × 2 (peripheral + 1 site)","Lactate level (repeat in 2h if >2 mmol/L)","CBC with differential","BMP, LFTs, lipase","PT/INR, aPTT, fibrinogen","Procalcitonin","UA + urine culture","ABG or VBG"],
      imaging:["CXR portable","CT scan per suspected source (chest/abdomen/pelvis)"],
      meds:["NS 30 mL/kg IV bolus over 3 hours (max 3L, reassess)","Broad-spectrum antibiotics within 1 hour of recognition (per protocol)","Norepinephrine 0.01–3 mcg/kg/min IV (if MAP <65 after fluids)","Vasopressin 0.03 U/min IV (add-on for refractory shock)","Hydrocortisone 200 mg/day IV (if refractory shock)"],
      nursing:["Foley catheter — strict I&O q1h","Central venous access if vasopressors required","Arterial line for continuous BP monitoring","Continuous telemetry and pulse oximetry","Sepsis bundle documentation (CMS SEP-1)"],
    }
  },
  {
    id:"stroke", icon:"🧠", label:"Acute Stroke / TIA",
    color:T.purple, glow:"rgba(155,109,255,0.3)", glass:"rgba(155,109,255,0.06)", border:"rgba(155,109,255,0.25)",
    badge:"AHA/ASA 2023", tags:["CT Head","tPA","NIHSS"],
    orders:{
      labs:["CBC with differential","BMP (glucose STAT — hypoglycemia mimic)","PT/INR, aPTT","Type & Screen","hs-CRP","HbA1c","Lipid panel","Coagulation studies if on anticoagulation"],
      imaging:["CT Head without contrast STAT","CT Angiography head & neck (if LVO suspected)","MRI brain DWI/FLAIR (if CT negative, symptoms >6h)","CXR portable","12-lead ECG (afib detection)"],
      meds:["Alteplase (tPA) 0.9 mg/kg IV (max 90 mg) — eligibility checklist required","Aspirin 325 mg PO/PR (after 24h if tPA given, immediately if no tPA)","NIHSS q15min × 2h post-tPA, q1h × 22h","BP <185/110 before tPA; <180/105 after","Statin if LDL >70 or embolic stroke"],
      nursing:["Stroke team activation STAT","Continuous telemetry","NIH Stroke Scale q1–4h","NPO until formal swallow screen","Head of bed flat (or 30° post-tPA)","Dysphagia precautions"],
    }
  },
  {
    id:"dyspnea", icon:"🫁", label:"Dyspnea / Respiratory Distress",
    color:T.blue, glow:"rgba(59,158,255,0.3)", glass:"rgba(59,158,255,0.06)", border:"rgba(59,158,255,0.25)",
    badge:"GOLD/GINA 2024", tags:["BNP","CXR","Bronchodilator"],
    orders:{
      labs:["ABG or VBG","BNP or NT-proBNP","CBC","BMP","D-dimer (if PE suspected, low pre-test probability)","Pro-calcitonin (if infectious exacerbation)","Sputum culture (if COPD exacerbation)"],
      imaging:["CXR PA/Lateral STAT","CT Pulmonary Angiography (if Wells ≥2 or D-dimer elevated)","Bedside POCUS — lung, cardiac, IVC"],
      meds:["Albuterol 2.5 mg NEB q20min × 3 (asthma/COPD)","Ipratropium 0.5 mg NEB q6h (COPD)","Methylprednisolone 125 mg IV × 1 → prednisone taper","Furosemide 40–80 mg IV (if flash pulmonary edema)","CPAP/BiPAP (COPD/CHF exacerbation, SpO₂ <90%)","Heparin per PE protocol if confirmed"],
      nursing:["O₂ to maintain SpO₂ 92–96% (COPD: 88–92%)","Position HOB 45°","Continuous pulse ox and telemetry","Respiratory therapy consult","Peak flow pre/post bronchodilator (asthma)"],
    }
  },
  {
    id:"abdominal-pain", icon:"🫃", label:"Abdominal Pain",
    color:T.gold, glow:"rgba(245,200,66,0.3)", glass:"rgba(245,200,66,0.06)", border:"rgba(245,200,66,0.25)",
    badge:"ACR 2023", tags:["Lipase","CT Abdomen","UA"],
    orders:{
      labs:["CBC with differential","BMP (creatinine, electrolytes, glucose)","LFTs (AST, ALT, ALP, total bilirubin)","Lipase","PT/INR (if liver disease or anticoagulation)","Beta-hCG (all females of reproductive age)","UA + urine culture","Stool occult blood (if lower GI bleed suspected)"],
      imaging:["Upright CXR (free air under diaphragm)","CT Abdomen/Pelvis with IV contrast STAT","Pelvic US (if ectopic or ovarian pathology suspected)","RUQ ultrasound (if cholecystitis/biliary suspected)"],
      meds:["Morphine 2–4 mg IV or Hydromorphone 0.5–1 mg IV PRN pain","Ondansetron 4 mg IV PRN nausea","NS bolus 1–2L IV (if dehydrated/NPO)","Pantoprazole 40 mg IV (if GI bleed or ulcer suspected)","Ketorolac 15–30 mg IV (if renal colic, no contraindications)"],
      nursing:["NPO until surgical evaluation complete","IV access × 2","Serial abdominal exams q1–2h","Strict I&O","Surgical consult if peritoneal signs"],
    }
  },
  {
    id:"headache", icon:"🧠", label:"Headache / SAH Workup",
    color:"#a29bfe", glow:"rgba(162,155,254,0.3)", glass:"rgba(162,155,254,0.06)", border:"rgba(162,155,254,0.25)",
    badge:"AHA 2023", tags:["CT Head","LP","Ottawa Rule"],
    orders:{
      labs:["CBC","BMP","PT/INR","ESR, CRP (if GCA suspected, age >50)","Blood cultures (if fever + headache)","Toxicology screen (urine ± serum)"],
      imaging:["CT Head without contrast STAT (Ottawa SAH rule positive or thunderclap HA)","CT Angiography head (if SAH on CT or high suspicion)","MRI brain (if CT negative, symptoms >6h, posterior fossa concern)","CXR (if fever or infectious etiology)"],
      meds:["IV Ketorolac 30 mg or IV Metoclopramide 10 mg (migraine)","IV Valproate 500–1000 mg over 15 min (refractory migraine)","Diphenhydramine 25 mg IV (adjunct, reduce akathisia)","IV Magnesium 2g over 20 min (migraine, eclampsia)","Nimodipine 60 mg PO q4h × 21 days (SAH — start after neurosurgery)"],
      nursing:["Quiet, dark room environment","Continuous vital signs q1h (if SAH concern)","Neurology/neurosurgery consult STAT if SAH","Lumbar puncture setup if CT negative and clinical suspicion high","Fall precautions"],
    }
  },
  {
    id:"altered-ms", icon:"🌀", label:"Altered Mental Status",
    color:"#fd79a8", glow:"rgba(253,121,168,0.3)", glass:"rgba(253,121,168,0.06)", border:"rgba(253,121,168,0.25)",
    badge:"Delirium Protocol", tags:["Glucose","CT Head","Tox Screen"],
    orders:{
      labs:["Point-of-care glucose STAT","CBC with differential","BMP + ammonia","LFTs, lipase","Thyroid function (TSH)","Vitamin B12, folate","Toxicology screen (urine + serum EtOH)","Blood cultures × 2 (if fever)","Urinalysis + urine culture","ABG/VBG (if respiratory compromise)"],
      imaging:["CT Head without contrast STAT","CXR portable","12-lead ECG"],
      meds:["Thiamine 100 mg IV BEFORE dextrose (alcohol history or malnutrition)","D50W 25g IV (if glucose <60 mg/dL)","Naloxone 0.4 mg IV/IM (if opioid toxidrome)","Flumazenil 0.2 mg IV (benzodiazepine reversal — only if no seizure history)","Haloperidol 2–5 mg IM/IV (agitation — with monitoring)","Lorazepam 1–2 mg IV (alcohol withdrawal / CIWA >8)"],
      nursing:["1:1 observation — fall / elopement precautions","Soft restraints only if immediate safety risk (document reasoning)","Reorientation q1h — clock, calendar, familiar voices","Foley catheter if urinary retention suspected","Vital signs q30min"],
    }
  },
  {
    id:"trauma", icon:"🤕", label:"Major Trauma",
    color:T.coral, glow:"rgba(255,107,107,0.35)", glass:"rgba(255,107,107,0.07)", border:"rgba(255,107,107,0.3)",
    badge:"ATLS 2023", tags:["FAST","MTP","Trauma Alert"],
    orders:{
      labs:["Type & Cross STAT (6 units pRBC)","CBC","BMP","PT/INR, aPTT, fibrinogen, TEG/ROTEM","Lactate + ABG","Ethanol level + toxicology screen","Beta-hCG (females of reproductive age)","Urinalysis (hematuria)"],
      imaging:["CXR portable STAT","Pelvis X-ray portable STAT","FAST ultrasound (eFAST — include lungs)","CT Head/C-Spine/Chest/Abdomen/Pelvis with IV contrast (pan-scan if hemodynamically stable)"],
      meds:["Tranexamic Acid 1g IV over 10 min within 3h of injury (if hemorrhage)","Massive Transfusion Protocol (MTP): 1:1:1 pRBC:FFP:PLT","Cefazolin 2g IV (open fractures, penetrating trauma)","Tetanus prophylaxis (0.5 mL IM if not up to date)","TXA 1g IV in 8h (second dose if MTP activated)"],
      nursing:["Trauma team activation","Two large-bore IVs (16g or larger) or IO","Warm all IV fluids and blood products","Foley catheter (if no urethral injury)","NGT/OGT (if no basilar skull fracture)","Temperature management — warming blankets"],
    }
  },
];

const CATS = ["labs","imaging","meds","nursing"];
const CAT_LABELS = {labs:"🧪 Labs & Diagnostics", imaging:"🔬 Imaging", meds:"💊 Medications", nursing:"🩺 Nursing Orders"};
const CAT_COLORS = {labs:T.blue, imaging:T.purple, meds:T.coral, nursing:T.teal};

// ── AI generation prompt ─────────────────────────────────────────────────────
function buildPrompt({cc, age, sex, weight, allergies, pmh, vitals}) {
  return `You are an emergency medicine order generator. Create a comprehensive, evidence-based ED order set for:
Chief Complaint: ${cc || "unspecified"}
Patient: ${age || "unknown age"}y ${sex || ""}, weight: ${weight || "unknown"} kg
Allergies: ${allergies || "NKDA"}
PMH: ${pmh || "not documented"}
Vitals: ${vitals || "not provided"}

Return ONLY valid JSON with exactly these 4 keys:
{
  "labs": ["array of lab/diagnostic orders"],
  "imaging": ["array of imaging orders"],
  "meds": ["array of medication orders with doses/routes/frequencies"],
  "nursing": ["array of nursing orders and care instructions"]
}

Include 5–8 items per category. Be specific with doses, routes, and frequencies. Reference current guidelines (2023–2025). Do not include any text outside the JSON.`;
}

// ── Shared sub-components ────────────────────────────────────────────────────
function SectionDivider({label}) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:12,margin:"4px 0"}}>
      <div style={{height:1,flex:1,background:`linear-gradient(90deg,${T.borderHi},transparent)`}}/>
      <span style={{fontSize:9,fontFamily:"'JetBrains Mono',monospace",color:T.txt3,textTransform:"uppercase",letterSpacing:".12em",fontWeight:600}}>{label}</span>
      <div style={{height:1,flex:1,background:`linear-gradient(90deg,transparent,${T.borderHi})`}}/>
    </div>
  );
}

function OrderItem({text, checked, onToggle, color}) {
  return (
    <div onClick={onToggle} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"7px 10px",borderRadius:7,cursor:"pointer",background:checked?`${color}0D`:"rgba(14,37,68,.4)",border:`1px solid ${checked?color+"44":T.border}`,transition:"all .15s",backdropFilter:"blur(6px)"}}>
      <div style={{width:16,height:16,borderRadius:4,flexShrink:0,marginTop:1,border:`1.5px solid ${checked?color:T.border}`,background:checked?`${color}30`:"transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s"}}>
        {checked&&<span style={{color,fontSize:9,lineHeight:1,fontWeight:700}}>✓</span>}
      </div>
      <span style={{fontSize:12,color:checked?T.txt:T.txt2,lineHeight:1.5,textDecoration:checked?"line-through":"none",opacity:checked?.7:1}}>{text}</span>
    </div>
  );
}

function CatSection({cat, orders, checked, onToggle, onCheckAll, onUncheckAll}) {
  const col = CAT_COLORS[cat];
  const items = orders[cat] || [];
  const checkedCount = items.filter((_,i) => checked[`${cat}-${i}`]).length;
  return (
    <div style={{background:"rgba(8,22,40,.65)",border:`1px solid ${T.border}`,borderRadius:12,padding:"14px 16px",backdropFilter:"blur(16px)"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:14}}>{CAT_LABELS[cat].split(" ")[0]}</span>
          <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:700,color:T.txt}}>{CAT_LABELS[cat].slice(2)}</span>
          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:col,background:`${col}18`,border:`1px solid ${col}33`,borderRadius:20,padding:"1px 8px"}}>{checkedCount}/{items.length}</span>
        </div>
        <div style={{display:"flex",gap:5}}>
          <button onClick={onCheckAll} style={{padding:"3px 8px",borderRadius:5,border:`1px solid ${col}33`,background:`${col}10`,color:col,fontSize:10,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace"}}>All</button>
          <button onClick={onUncheckAll} style={{padding:"3px 8px",borderRadius:5,border:`1px solid ${T.border}`,background:"transparent",color:T.txt3,fontSize:10,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace"}}>None</button>
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:4}}>
        {items.map((item,i) => (
          <OrderItem key={i} text={item} checked={!!checked[`${cat}-${i}`]} onToggle={()=>onToggle(cat,i)} color={col}/>
        ))}
      </div>
    </div>
  );
}

// ── Order Set Card ────────────────────────────────────────────────────────────
function OrderSetCard({set, onClick, index}) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={()=>onClick(set)} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{position:"relative",borderRadius:16,padding:"18px 18px 16px",cursor:"pointer",overflow:"hidden",transition:"all .3s cubic-bezier(.34,1.56,.64,1)",transform:hov?"translateY(-4px) scale(1.02)":"translateY(0) scale(1)",animation:`card-in .55s ease both ${index*.07}s`,background:hov?set.glass.replace(".06",".18"):"rgba(8,22,40,.65)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",border:`1px solid ${hov?set.border:"rgba(26,53,85,.7)"}`,boxShadow:hov?`0 20px 40px rgba(0,0,0,.4), 0 0 30px ${set.glow}`:"0 4px 16px rgba(0,0,0,.3)"}}>
      <div style={{position:"absolute",top:-30,right:-30,width:120,height:120,borderRadius:"50%",background:`radial-gradient(circle, ${set.glow} 0%, transparent 70%)`,opacity:hov?1:0,transition:"opacity .3s",pointerEvents:"none"}}/>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:10}}>
        <div style={{width:44,height:44,borderRadius:12,background:set.glass.replace(".06",".24"),border:`1px solid ${set.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{set.icon}</div>
        <span style={{fontSize:9,fontFamily:"'JetBrains Mono',monospace",fontWeight:700,padding:"2px 8px",borderRadius:20,background:set.glass.replace(".06",".2"),border:`1px solid ${set.border}`,color:set.color,letterSpacing:".04em"}}>{set.badge}</span>
      </div>
      <div style={{fontSize:14,fontFamily:"'Playfair Display',serif",fontWeight:600,color:T.txt,lineHeight:1.3,marginBottom:8}}>{set.label}</div>
      <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
        {set.tags.map((t,i)=><span key={i} style={{fontSize:10,padding:"2px 7px",borderRadius:20,background:set.glass,border:`1px solid ${set.border.replace(".25",".15")}`,color:T.txt2}}>{t}</span>)}
      </div>
      <div style={{position:"absolute",bottom:14,right:14,opacity:hov?1:0,transition:"opacity .2s",fontSize:16,color:set.color}}>→</div>
    </div>
  );
}

// ── Print helper ─────────────────────────────────────────────────────────────
function buildPrintHtml(label, orders, checked) {
  const now = new Date().toLocaleString();
  let html = `<html><head><title>${label} Orders</title><style>body{font-family:Arial,sans-serif;padding:24px;font-size:13px}h2{margin-bottom:4px}p{color:#666;font-size:11px;margin-bottom:20px}h3{margin-top:16px;margin-bottom:6px;text-transform:uppercase;letter-spacing:.06em;font-size:11px;color:#333}li{margin-bottom:4px;color:#444}@media print{body{padding:0}}</style></head><body>`;
  html += `<h2>${label} — Order Set</h2><p>Generated: ${now} · Selected orders only</p>`;
  CATS.forEach(cat => {
    const items = (orders[cat]||[]).filter((_,i) => checked[`${cat}-${i}`]);
    if (!items.length) return;
    html += `<h3>${CAT_LABELS[cat]}</h3><ul>${items.map(it=>`<li>${it}</li>`).join("")}</ul>`;
  });
  html += `</body></html>`;
  return html;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function OrderGeneratorHub() {
  const navigate = useNavigate();
  const [view, setView] = useState("home"); // home | builder | ai
  const [activeSet, setActiveSet] = useState(null);
  const [checked, setChecked] = useState({});
  const [aiOrders, setAiOrders] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [copied, setCopied] = useState(false);

  // AI form fields
  const [cc, setCC] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("");
  const [weight, setWeight] = useState("");
  const [allergies, setAllergies] = useState("");
  const [pmh, setPmh] = useState("");
  const [vitals, setVitals] = useState("");

  const currentOrders = view === "ai" ? aiOrders : activeSet?.orders;

  const toggleItem = useCallback((cat, idx) => {
    setChecked(p => ({...p, [`${cat}-${idx}`]: !p[`${cat}-${idx}`]}));
  }, []);

  const checkAll = useCallback((cat, orders) => {
    setChecked(p => {
      const n = {...p};
      (orders[cat]||[]).forEach((_,i) => { n[`${cat}-${i}`] = true; });
      return n;
    });
  }, []);

  const uncheckAll = useCallback((cat) => {
    setChecked(p => {
      const n = {...p};
      Object.keys(n).forEach(k => { if(k.startsWith(cat+"-")) delete n[k]; });
      return n;
    });
  }, []);

  const selectAll = useCallback((orders) => {
    const n = {};
    CATS.forEach(cat => (orders[cat]||[]).forEach((_,i) => { n[`${cat}-${i}`] = true; }));
    setChecked(n);
  }, []);

  const openSet = useCallback((set) => {
    setActiveSet(set);
    setChecked({});
    setView("builder");
  }, []);

  const selectedCount = Object.values(checked).filter(Boolean).length;

  const copySelected = useCallback(() => {
    if (!currentOrders) return;
    const lines = [];
    CATS.forEach(cat => {
      const items = (currentOrders[cat]||[]).filter((_,i) => checked[`${cat}-${i}`]);
      if (items.length) {
        lines.push(`\n${CAT_LABELS[cat].toUpperCase()}`);
        items.forEach(it => lines.push(`  • ${it}`));
      }
    });
    if (!lines.length) return;
    const label = view === "ai" ? `AI Orders — ${cc}` : activeSet?.label;
    navigator.clipboard.writeText(`${label}\n${lines.join("\n")}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [checked, currentOrders, view, cc, activeSet]);

  const printSelected = useCallback(() => {
    if (!currentOrders) return;
    const label = view === "ai" ? `AI Orders — ${cc}` : activeSet?.label;
    const w = window.open("","_blank");
    w.document.write(buildPrintHtml(label, currentOrders, checked));
    w.document.close();
    w.print();
  }, [checked, currentOrders, view, cc, activeSet]);

  const generateAI = useCallback(async () => {
    if (!cc.trim()) { setAiError("Enter a chief complaint to generate orders."); return; }
    setAiLoading(true);
    setAiError("");
    setAiOrders(null);
    setChecked({});
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: buildPrompt({cc, age, sex, weight, allergies, pmh, vitals}),
        response_json_schema: {
          type:"object",
          properties: {
            labs:{type:"array",items:{type:"string"}},
            imaging:{type:"array",items:{type:"string"}},
            meds:{type:"array",items:{type:"string"}},
            nursing:{type:"array",items:{type:"string"}},
          }
        }
      });
      setAiOrders(result);
      setView("ai");
    } catch(e) {
      setAiError("AI generation failed — please try again.");
    } finally {
      setAiLoading(false);
    }
  }, [cc, age, sex, weight, allergies, pmh, vitals]);

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:"'DM Sans',sans-serif",padding:"0 0 40px"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap');
        @keyframes card-in{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-thumb{background:#1a3555;border-radius:3px}
      `}</style>

      {/* ── Top bar ── */}
      <div style={{position:"sticky",top:0,zIndex:100,background:"rgba(5,15,30,.95)",backdropFilter:"blur(20px)",borderBottom:`1px solid ${T.border}`,padding:"12px 24px",display:"flex",alignItems:"center",gap:14}}>
        <button onClick={()=>navigate("/hub")} style={{background:"rgba(26,53,85,.6)",border:`1px solid ${T.borderHi}`,borderRadius:8,padding:"5px 12px",color:T.txt3,fontSize:11,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",whiteSpace:"nowrap"}}>← Hub</button>
        <div style={{width:1,height:20,background:T.border}}/>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:32,height:32,borderRadius:9,background:"rgba(59,158,255,.15)",border:`1px solid rgba(59,158,255,.3)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>📋</div>
          <div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,color:T.txt}}>Order Generator Hub</div>
            <div style={{fontSize:10,color:T.txt3}}>Evidence-based order sets · AI-powered custom generation</div>
          </div>
        </div>
        <div style={{marginLeft:"auto",display:"flex",gap:8,alignItems:"center"}}>
          {(view==="builder"||view==="ai")&&selectedCount>0&&(
            <>
              <button onClick={copySelected} style={{padding:"5px 12px",borderRadius:7,border:`1px solid ${copied?T.teal+"55":T.border}`,background:copied?"rgba(0,229,192,.1)":"rgba(14,37,68,.5)",color:copied?T.teal:T.txt3,fontSize:11,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",transition:"all .2s"}}>
                {copied?"✓ Copied!":"📋 Copy"}
              </button>
              <button onClick={printSelected} style={{padding:"5px 12px",borderRadius:7,border:`1px solid ${T.border}`,background:"rgba(14,37,68,.5)",color:T.txt3,fontSize:11,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace"}}>🖨 Print</button>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.teal,background:"rgba(0,229,192,.1)",border:"1px solid rgba(0,229,192,.3)",borderRadius:20,padding:"2px 9px"}}>{selectedCount} selected</span>
            </>
          )}
          {(view==="builder"||view==="ai")&&(
            <button onClick={()=>{setView("home");setActiveSet(null);setAiOrders(null);setChecked({});}} style={{padding:"5px 12px",borderRadius:7,border:`1px solid ${T.border}`,background:"rgba(14,37,68,.5)",color:T.txt3,fontSize:11,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>← All Sets</button>
          )}
        </div>
      </div>

      <div style={{maxWidth:1100,margin:"0 auto",padding:"24px 24px 0"}}>

        {/* ── HOME view ── */}
        {view==="home"&&(
          <>
            {/* Hero */}
            <div style={{borderRadius:20,padding:"24px 28px 20px",background:"rgba(5,15,30,.78)",backdropFilter:"blur(24px)",border:`1px solid rgba(59,158,255,.18)`,marginBottom:20,position:"relative",overflow:"hidden",animation:"card-in .5s ease both"}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:2,borderRadius:"20px 20px 0 0",background:"linear-gradient(90deg,#3b9eff,#00e5c0,#9b6dff,#ff6b6b)"}}/>
              <div style={{display:"flex",alignItems:"flex-start",gap:16,position:"relative"}}>
                <div style={{width:52,height:52,borderRadius:14,background:"linear-gradient(135deg,rgba(59,158,255,.2),rgba(155,109,255,.15))",border:"1px solid rgba(59,158,255,.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>📋</div>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6,flexWrap:"wrap"}}>
                    <span style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:700,color:T.txt}}>Order Generator Hub</span>
                    <span style={{fontSize:9,fontFamily:"'JetBrains Mono',monospace",fontWeight:700,padding:"3px 10px",borderRadius:20,background:"rgba(0,229,192,.1)",color:T.teal,border:"1px solid rgba(0,229,192,.3)",letterSpacing:".06em"}}>NOTRYA TOOLS</span>
                  </div>
                  <p style={{fontSize:13,color:T.txt2,margin:0,lineHeight:1.6,maxWidth:560}}>Guideline-integrated order sets for common ED presentations — or use AI to generate a custom set from patient-specific data.</p>
                </div>
                <div style={{borderRadius:12,padding:"10px 14px",background:"rgba(8,22,40,.85)",border:`1px solid ${T.border}`,textAlign:"center",flexShrink:0}}>
                  <div style={{fontSize:9,color:T.txt3,textTransform:"uppercase",letterSpacing:".07em",marginBottom:4}}>Sets</div>
                  <div style={{fontSize:26,fontWeight:700,color:T.blue,fontFamily:"'JetBrains Mono',monospace",lineHeight:1}}>{ORDER_SETS.length}</div>
                  <div style={{fontSize:9,color:T.txt3,marginTop:2}}>available</div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:20}}>
              {[{icon:"📋",label:"Order Sets",value:"8 Protocols",c:T.blue},{icon:"🤖",label:"AI Generator",value:"Custom Sets",c:T.teal},{icon:"💊",label:"Medications",value:"60+ Orders",c:T.gold},{icon:"✅",label:"Checkboxes",value:"Track & Copy",c:T.purple}].map((s,i)=>(
                <div key={i} style={{borderRadius:12,padding:"12px 14px",background:"rgba(8,22,40,.72)",border:`1px solid ${T.border}`,backdropFilter:"blur(12px)",display:"flex",alignItems:"center",gap:10,animation:`card-in .55s ease both ${.25+i*.07}s`}}>
                  <span style={{fontSize:18,flexShrink:0}}>{s.icon}</span>
                  <div>
                    <div style={{fontSize:9,color:T.txt3,textTransform:"uppercase",letterSpacing:".06em",marginBottom:2}}>{s.label}</div>
                    <div style={{fontSize:11,fontWeight:700,color:s.c,fontFamily:"'JetBrains Mono',monospace"}}>{s.value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* AI Generator Panel */}
            <div style={{borderRadius:16,padding:"18px 20px",background:"rgba(8,22,40,.72)",border:`1px solid rgba(0,229,192,.22)`,marginBottom:24,backdropFilter:"blur(16px)",animation:"card-in .55s ease both .2s"}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
                <div style={{width:36,height:36,borderRadius:10,background:"rgba(0,229,192,.12)",border:"1px solid rgba(0,229,192,.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🤖</div>
                <div>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,color:T.txt}}>AI Custom Order Generator</div>
                  <div style={{fontSize:11,color:T.txt3}}>Enter patient details for a tailored, AI-generated order set</div>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",gap:10,marginBottom:10}}>
                {[{label:"Chief Complaint *",val:cc,set:setCC,ph:"e.g., chest pain, sepsis…"},{label:"Age",val:age,set:setAge,ph:"years"},{label:"Sex",val:sex,set:setSex,ph:"M/F/Other"},{label:"Weight (kg)",val:weight,set:setWeight,ph:"kg"}].map((f,i)=>(
                  <div key={i}>
                    <div style={{fontSize:9,color:T.txt3,textTransform:"uppercase",letterSpacing:".06em",fontWeight:700,marginBottom:4}}>{f.label}</div>
                    <input value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.ph} style={{width:"100%",background:"rgba(14,37,68,.5)",border:`1px solid ${f.val?T.teal:T.border}`,borderRadius:7,padding:"7px 10px",color:T.txt,fontFamily:"'DM Sans',sans-serif",fontSize:12,outline:"none",backdropFilter:"blur(8px)"}}/>
                  </div>
                ))}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:14}}>
                {[{label:"Allergies",val:allergies,set:setAllergies,ph:"e.g., Penicillin"},{label:"Past Medical History",val:pmh,set:setPmh,ph:"HTN, DM, CAD…"},{label:"Vital Signs",val:vitals,set:setVitals,ph:"BP 140/90  HR 98  T 38.2…"}].map((f,i)=>(
                  <div key={i}>
                    <div style={{fontSize:9,color:T.txt3,textTransform:"uppercase",letterSpacing:".06em",fontWeight:700,marginBottom:4}}>{f.label}</div>
                    <input value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.ph} style={{width:"100%",background:"rgba(14,37,68,.5)",border:`1px solid ${T.border}`,borderRadius:7,padding:"7px 10px",color:T.txt,fontFamily:"'DM Sans',sans-serif",fontSize:12,outline:"none",backdropFilter:"blur(8px)"}}/>
                  </div>
                ))}
              </div>
              {aiError&&<div style={{marginBottom:10,padding:"7px 12px",borderRadius:7,background:"rgba(255,107,107,.08)",border:"1px solid rgba(255,107,107,.3)",fontSize:11,color:T.coral}}>{aiError}</div>}
              <button onClick={generateAI} disabled={aiLoading} style={{padding:"10px 24px",borderRadius:9,border:"none",background:aiLoading?"rgba(0,229,192,.15)":"linear-gradient(135deg,#00e5c0,#00b4d8)",color:aiLoading?T.teal:"#050f1e",fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:700,cursor:aiLoading?"not-allowed":"pointer",display:"flex",alignItems:"center",gap:8,transition:"all .2s"}}>
                {aiLoading?<><span style={{width:14,height:14,border:`2px solid ${T.teal}`,borderTopColor:"transparent",borderRadius:"50%",animation:"spin 1s linear infinite",display:"inline-block"}}/> Generating…</>:<>🤖 Generate AI Orders</>}
              </button>
            </div>

            <SectionDivider label="Pre-built Order Sets"/>
            <div style={{marginTop:16,display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:14}}>
              {ORDER_SETS.map((set,i) => <OrderSetCard key={set.id} set={set} onClick={openSet} index={i}/>)}
            </div>

            {/* Evidence footer */}
            <div style={{marginTop:24,borderRadius:12,padding:"12px 18px",background:"rgba(5,15,30,.65)",border:`1px solid ${T.border}`,backdropFilter:"blur(12px)",display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
              <span style={{fontSize:10,color:T.blue,fontFamily:"'JetBrains Mono',monospace",fontWeight:700,flexShrink:0}}>⚕ EVIDENCE BASE</span>
              {["2025 ACC/AHA/ACEP ACS Guideline","Surviving Sepsis 2021","AHA/ASA Stroke 2023","GOLD COPD 2024","ATLS 10th Edition"].map((ref,i)=>(
                <span key={i} style={{fontSize:10,color:T.txt3}}>{i>0&&<span style={{marginRight:8,color:T.txt4}}>·</span>}{ref}</span>
              ))}
            </div>
          </>
        )}

        {/* ── BUILDER / AI view ── */}
        {(view==="builder"||view==="ai")&&currentOrders&&(
          <>
            {/* Header */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12,background:"rgba(8,22,40,.72)",border:`1px solid ${view==="ai"?"rgba(0,229,192,.3)":activeSet?.border}`,borderRadius:14,padding:"14px 18px",borderLeft:`3px solid ${view==="ai"?T.teal:activeSet?.color}`,backdropFilter:"blur(20px)",marginBottom:14,animation:"card-in .4s ease both"}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <span style={{fontSize:26}}>{view==="ai"?"🤖":activeSet?.icon}</span>
                <div>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:T.txt}}>{view==="ai"?`AI Orders — ${cc}`:activeSet?.label}</div>
                  <div style={{fontSize:11,color:T.txt3,marginTop:2}}>{view==="ai"?"AI-generated · Review before signing":"Pre-built · Guideline-integrated"}</div>
                </div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>selectAll(currentOrders)} style={{padding:"6px 14px",borderRadius:8,border:`1px solid ${T.teal}55`,background:"rgba(0,229,192,.08)",color:T.teal,fontSize:11,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace"}}>Select All</button>
                <button onClick={()=>setChecked({})} style={{padding:"6px 14px",borderRadius:8,border:`1px solid ${T.border}`,background:"rgba(14,37,68,.5)",color:T.txt3,fontSize:11,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace"}}>Clear All</button>
              </div>
            </div>

            {view==="ai"&&<div style={{padding:"8px 14px",borderRadius:8,background:"rgba(245,200,66,.07)",border:"1px solid rgba(245,200,66,.25)",fontSize:11,color:T.gold,marginBottom:14,lineHeight:1.6}}>⚠️ AI-generated orders — always verify doses, routes, and patient allergies before signing. Not a substitute for clinical judgment.</div>}

            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              {CATS.map(cat => (
                <CatSection key={cat} cat={cat} orders={currentOrders} checked={checked}
                  onToggle={toggleItem}
                  onCheckAll={()=>checkAll(cat, currentOrders)}
                  onUncheckAll={()=>uncheckAll(cat)}
                />
              ))}
            </div>

            {selectedCount>0&&(
              <div style={{marginTop:16,padding:"12px 18px",borderRadius:12,background:"rgba(0,229,192,.07)",border:"1px solid rgba(0,229,192,.25)",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
                <span style={{fontSize:13,color:T.teal,fontFamily:"'JetBrains Mono',monospace",fontWeight:700}}>{selectedCount} orders selected</span>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={copySelected} style={{padding:"7px 18px",borderRadius:8,border:`1px solid rgba(0,229,192,.4)`,background:"rgba(0,229,192,.12)",color:T.teal,fontSize:12,cursor:"pointer",fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>{copied?"✓ Copied!":"📋 Copy Selected"}</button>
                  <button onClick={printSelected} style={{padding:"7px 18px",borderRadius:8,border:`1px solid ${T.border}`,background:"rgba(14,37,68,.5)",color:T.txt2,fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>🖨 Print Selected</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}