// ─────────────────────────────────────────────────────────────────────────────
// Notrya AI — CME & Learning Center
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef, useCallback } from "react";

// ── PALETTE ───────────────────────────────────────────────────────────────────
const G = {
  navy:"#050f1e", slate:"#0b1d35", panel:"#0d2240", edge:"#162d4f",
  border:"#1e3a5f", muted:"#2a4d72", dim:"#4a7299", text:"#c8ddf0",
  bright:"#e8f4ff", teal:"#00d4bc", amber:"#f5a623", red:"#ff5c6c",
  green:"#2ecc71", purple:"#9b6dff", blue:"#4a90d9", rose:"#f472b6",
  gold:"#fbbf24",
};

// ── CME MODULE DATABASE ───────────────────────────────────────────────────────
const CME_MODULES = [
  {
    id:"cme001", title:"Managing Septic Shock in the ED: Updated 2024 Surviving Sepsis Campaign",
    category:"Critical Care", credits:1.5, abem:true, moc:true,
    difficulty:"Advanced", format:"Case-Based", duration:45,
    expiry:"2025-12-31", featured:true, completed:false, progress:0,
    accreditor:"ACEP", creditType:"AMA PRA Category 1",
    description:"Evidence-based approach to sepsis recognition, fluid resuscitation strategies, vasopressor selection, and source control timing based on the 2024 SSC bundle updates.",
    learningObjectives:[
      "Apply the Hour-1 Bundle to early septic shock management",
      "Differentiate crystalloid strategies: balanced vs. normal saline",
      "Select appropriate vasopressors and adjuncts in refractory shock",
      "Identify indications and timing for source control interventions",
    ],
    caseSnippet:"A 68-year-old woman with T2DM presents with altered mental status, HR 118, BP 82/46, T 39.1°C, WBC 24k. Lactate returns at 4.2 mmol/L. Walk through resuscitation priorities, fluid strategy, and vasopressor choice.",
    references:["Surviving Sepsis Campaign 2024 Update (Critical Care Med)","SMART Trial: NEJM 2018","VASST Trial: NEJM 2008"],
    tags:["Sepsis","Vasopressors","Critical Care","ABEM"],
    color:"#ef4444",
  },
  {
    id:"cme002", title:"Acute MI Mimics: When the ECG Lies — LBBB, Brugada, and Early Repolarization",
    category:"Cardiology", credits:1.0, abem:true, moc:true,
    difficulty:"Intermediate", format:"Case-Based", duration:30,
    expiry:"2025-09-30", featured:true, completed:true, progress:100,
    accreditor:"ACEP", creditType:"AMA PRA Category 1",
    description:"Master the Sgarbossa criteria for STEMI equivalent in LBBB, distinguish Type 1 Brugada from benign patterns, and confidently identify early repolarization vs. acute MI.",
    learningObjectives:[
      "Apply Sgarbossa and modified Sgarbossa criteria in LBBB",
      "Identify Type 1 Brugada pattern and differentiation from RBBB",
      "Distinguish early repolarization from subtle anterior STEMI",
      "Determine appropriate cath lab activation thresholds",
    ],
    caseSnippet:"A 55-year-old male with known LBBB presents with 20 minutes of chest pressure. ECG shows concordant ST elevation in V4. Walk through STEMI equivalence criteria and appropriate management.",
    references:["Sgarbossa EB et al., NEJM 1996","Modified Sgarbossa: Smith SW, Ann EM 2012","Brugada Consensus Report 2022"],
    tags:["ECG","STEMI","LBBB","Brugada","Cardiology"],
    color:"#ef4444",
    completedDate:"2024-11-14",
    certId:"NOTRYA-2024-1102",
  },
  {
    id:"cme003", title:"Pediatric Fever Without a Source: Risk Stratification in the Post-PCV Era",
    category:"Pediatrics", credits:1.0, abem:true, moc:false,
    difficulty:"Intermediate", format:"Case-Based", duration:35,
    expiry:"2026-03-31", featured:false, completed:false, progress:60,
    accreditor:"AAP", creditType:"AMA PRA Category 1",
    description:"Updated algorithms for febrile infants 0–90 days post-universal PCV13/PCV15 vaccination. Philadelphia, Rochester, and Step-by-Step criteria compared.",
    learningObjectives:[
      "Apply current validated low-risk criteria for febrile neonates",
      "Distinguish management of 0–28 vs. 29–60 vs. 61–90 day age groups",
      "Understand impact of conjugate pneumococcal vaccines on bacteremia rates",
      "Navigate LP decisions using PECARN/AAP 2021 guidelines",
    ],
    caseSnippet:"A 6-week-old male presents with rectal temp 38.4°C and no focal source. Mom reports good feeding. WBC 14k, UA negative. Navigate risk stratification and LP/admission decision.",
    references:["AAP Clinical Practice Guideline Febrile Infants 2021","Step-by-Step Algorithm: Gomez B et al. Pediatrics 2016","PECARN Low-Risk Criteria 2019"],
    tags:["Pediatrics","Fever","Neonate","Risk Stratification"],
    color:"#4a90d9",
  },
  {
    id:"cme004", title:"Opioid-Induced Respiratory Depression: Naloxone Dosing, Routes, and Repeat Dosing",
    category:"Toxicology", credits:0.5, abem:true, moc:false,
    difficulty:"Foundational", format:"Interactive", duration:20,
    expiry:"2026-06-30", featured:false, completed:true, progress:100,
    accreditor:"ACMT", creditType:"AMA PRA Category 1",
    description:"Evidence-based naloxone dosing for fentanyl-era overdose, including high-dose and infusion strategies. Covers intranasal, IV, IM routes and resedation risk.",
    learningObjectives:[
      "Select appropriate naloxone dose for synthetic opioid overdose",
      "Initiate naloxone infusion for resedation-risk patients",
      "Counsel on take-home naloxone and harm reduction",
      "Recognize limitations of naloxone in polysubstance overdose",
    ],
    caseSnippet:"A 32-year-old unresponsive male, RR 4, pinpoint pupils. Bystanders report suspected fentanyl use. You receive him after 2mg IN naloxone with minimal response. What's next?",
    references:["SAMHSA Opioid Overdose Prevention Toolkit 2023","Naloxone Infusion for Fentanyl OD: ACMT Position 2023"],
    tags:["Toxicology","Opioids","Naloxone","Fentanyl"],
    color:"#a855f7",
    completedDate:"2025-01-08",
    certId:"NOTRYA-2025-0021",
  },
  {
    id:"cme005", title:"Point-of-Care Ultrasound: RUSH Protocol and Undifferentiated Shock",
    category:"Ultrasound", credits:2.0, abem:true, moc:true,
    difficulty:"Advanced", format:"Case-Based + Simulation", duration:60,
    expiry:"2025-11-30", featured:true, completed:false, progress:25,
    accreditor:"ACEP", creditType:"AMA PRA Category 1",
    description:"Systematic RUSH exam for undifferentiated hypotension. Covers cardiac tamponade, tension PTX, massive PE, severe hypovolemia, and aortic dissection patterns.",
    learningObjectives:[
      "Perform and interpret the RUSH protocol systematically",
      "Identify echocardiographic signs of tamponade and massive PE",
      "Recognize B-lines, lung sliding, and pneumothorax patterns",
      "Correlate POCUS findings with resuscitation decisions",
    ],
    caseSnippet:"A 44-year-old post-op day 2 CABG patient presents to your ED with BP 78/50, JVD, muffled heart sounds. Ultrasound probe is in your hand. Walk through RUSH exam findings and management.",
    references:["RUSH Protocol: Perera P et al. Emerg Med Clin 2010","EFAST Consensus: ACEP Policy 2023","Bedside Echo Protocols: FATE, FEEL, RUSH"],
    tags:["POCUS","Ultrasound","Shock","RUSH","Tamponade"],
    color:"#00d4bc",
  },
  {
    id:"cme006", title:"Hypertensive Emergencies: Organ-Specific Targets and Drug Selection",
    category:"Cardiology", credits:1.0, abem:true, moc:true,
    difficulty:"Intermediate", format:"Case-Based", duration:30,
    expiry:"2026-01-31", featured:false, completed:false, progress:0,
    accreditor:"ACEP", creditType:"AMA PRA Category 1",
    description:"Differentiate urgency vs. emergency. Master organ-specific BP targets and first-line agent selection for aortic dissection, hypertensive encephalopathy, eclampsia, and acute LVF.",
    learningObjectives:[
      "Distinguish hypertensive urgency from emergency by end-organ involvement",
      "Select drug of choice for each hypertensive emergency subtype",
      "Determine BP reduction targets and timeline by organ system",
      "Manage hypertensive emergency in pregnancy (eclampsia/HELLP)",
    ],
    caseSnippet:"A 58-year-old male with BP 220/130, tearing chest pain radiating to the back, and unequal pulses. CXR shows wide mediastinum. What is your BP target and first-line agent?",
    references:["AHA/ACC Hypertension Guidelines 2023","Aortic Dissection Management: IRAD Registry 2024","Eclampsia Management: ACOG 2024"],
    tags:["Hypertension","Cardiology","Aortic Dissection","Eclampsia"],
    color:"#f97316",
  },
  {
    id:"cme007", title:"Stroke Mimics and the 10-Minute Neurologic Exam",
    category:"Neurology", credits:1.0, abem:true, moc:false,
    difficulty:"Intermediate", format:"Case-Based", duration:35,
    expiry:"2026-04-30", featured:false, completed:false, progress:0,
    accreditor:"AAN", creditType:"AMA PRA Category 1",
    description:"Rapid differentiation of ischemic stroke from Todd's paralysis, hemiplegic migraine, hypoglycemia, and conversion disorder. Thrombolysis eligibility in 2024.",
    learningObjectives:[
      "Apply the NIHSS and identify posterior vs. anterior stroke patterns",
      "Distinguish stroke from common mimics using history and exam findings",
      "Evaluate tPA eligibility using the expanded 4.5-hour window criteria",
      "Identify large vessel occlusion patterns for thrombectomy referral",
    ],
    caseSnippet:"A 72-year-old female with sudden-onset right-sided weakness and aphasia, last known well 3.5 hours ago. CT head is negative. Walk through tPA eligibility and LVO screening.",
    references:["AHA/ASA Acute Ischemic Stroke Guidelines 2024","EXTEND-IA Trial: NEJM 2015","DAWN/DEFUSE-3 Thrombectomy Trials"],
    tags:["Neurology","Stroke","tPA","Thrombolysis","NIHSS"],
    color:"#9b6dff",
  },
  {
    id:"cme008", title:"Acute Kidney Injury in the ED: Workup, Staging, and Nephrotoxin Management",
    category:"Nephrology", credits:1.0, abem:false, moc:false,
    difficulty:"Intermediate", format:"Case-Based", duration:30,
    expiry:"2026-06-30", featured:false, completed:false, progress:0,
    accreditor:"ASN", creditType:"AMA PRA Category 1",
    description:"KDIGO AKI staging, prerenal vs. intrinsic vs. postrenal differentiation, contrast-associated nephropathy risk, and medication adjustments in the ED.",
    learningObjectives:[
      "Apply KDIGO criteria to stage AKI severity",
      "Differentiate prerenal, intrinsic, and postrenal AKI",
      "Identify and avoid nephrotoxin combinations in the ED",
      "Determine appropriate ED management and nephrology consultation thresholds",
    ],
    caseSnippet:"An elderly male on lisinopril, NSAIDs, and furosemide presents after 3 days of poor PO intake. SCr 3.2 (baseline 1.1). Urine Na 12 mEq/L, FENa 0.4%. Walk through AKI staging and management.",
    references:["KDIGO AKI Guidelines 2024","Contrast-Induced Nephropathy: PRESERVE Trial NEJM 2018"],
    tags:["Nephrology","AKI","Contrast","Nephrotoxins"],
    color:"#06b6d4",
  },
];

// ── STATE LICENSE DATA ─────────────────────────────────────────────────────────
const STATE_LICENSES = [
  { state:"California", abbr:"CA", licenseNum:"G-123456", renewalDate:"2027-07-31", cmeRequired:50, cmeCompleted:38, category1Required:25, category1Completed:22, cycle:"2 years", status:"active", specialReqs:["Pain Management 8hr","Ethics 2hr","End of Life 1hr"] },
  { state:"Texas", abbr:"TX", licenseNum:"L-789012", renewalDate:"2028-01-31", cmeRequired:48, cmeCompleted:38, category1Required:24, category1Completed:22, cycle:"2 years", status:"active", specialReqs:["Medical Ethics 2hr","Jurisprudence (one-time)"] },
  { state:"New York", abbr:"NY", licenseNum:"NY-345678", renewalDate:"2026-10-31", cmeRequired:36, cmeCompleted:38, category1Required:24, category1Completed:22, cycle:"2 years", status:"active", specialReqs:["Child Abuse 2hr","Infection Control 4hr","Opioid Prescribing 3hr"] },
];

// ── NEWS FEED CME ARTICLES ─────────────────────────────────────────────────────
const CME_NEWS = [
  { id:"n1", title:"Updated STEMI Equivalents: New Consensus on Occlusion-Based MI", source:"JACC", date:"2025-02-18", credits:0.5, category:"Cardiology", cmeEligible:true, doi:"10.1016/j.jacc.2025.01.042", summary:"Multi-society consensus redefines STEMI equivalents including de Winter, Wellens, and LBBB patterns with new ECG criteria for cath lab activation." },
  { id:"n2", title:"Early Goal-Directed Resuscitation in Hemorrhagic Shock: PROPPR-2 Results", source:"NEJM", date:"2025-01-30", credits:1.0, category:"Critical Care", cmeEligible:true, doi:"10.1056/NEJMoa2400123", summary:"Landmark RCT comparing 1:1:1 vs. 2:1:1 plasma:platelet:RBC ratios in massive transfusion. Primary endpoints and 30-day mortality outcomes." },
  { id:"n3", title:"Ketamine for Refractory Status Epilepticus: Phase III Trial Data", source:"Lancet Neurology", date:"2025-01-15", credits:0.5, category:"Neurology", cmeEligible:true, doi:"10.1016/S1474-4422(25)00012-3", summary:"Multicenter RCT demonstrating ketamine efficacy as third-line agent for established status epilepticus refractory to benzodiazepines and ASMs." },
  { id:"n4", title:"Biomarker-Guided Antibiotic Stewardship in the ED: PCT Meta-Analysis 2025", source:"JAMA Internal Medicine", date:"2025-01-05", credits:0.5, category:"Infectious Disease", cmeEligible:true, doi:"10.1001/jamainternmed.2025.0089", summary:"Updated meta-analysis of 28 RCTs (n=6,924) evaluating procalcitonin-guided antibiotic decisions in ED patients with respiratory symptoms." },
];

// ── ABEM MOC CATEGORIES ──────────────────────────────────────────────────────
const ABEM_MOC = {
  certExpiry:"2030-12-31",
  diplomate:"Jane Smith, MD, FACEP",
  certNum:"AB-2021-7843",
  currentCycle:"2024–2026",
  points:[
    { part:"Part I — Lifelong Learning & Self-Assessment (LLSA)", required:30, earned:18, type:"LLSA", color:G.teal },
    { part:"Part II — Quality Improvement", required:10, earned:10, type:"QI", color:G.green },
    { part:"Part III — Patient Safety", required:5, earned:5, type:"PS", color:G.blue },
    { part:"Part IV — Clinical Education", required:0, earned:4, type:"CE", color:G.purple },
  ],
  llsaArticles:[
    { title:"ACEP LLSA 2024: Sepsis Bundle Updates", year:2024, credits:5, completed:true, date:"2024-10-12" },
    { title:"ACEP LLSA 2024: Traumatic Brain Injury", year:2024, credits:5, completed:true, date:"2024-08-22" },
    { title:"ACEP LLSA 2025: Syncope Evaluation", year:2025, credits:5, completed:false, date:null },
    { title:"ACEP LLSA 2025: Pediatric Airway", year:2025, credits:5, completed:false, date:null },
  ],
};

// ── CREDIT SUMMARY ──────────────────────────────────────────────────────────
const CREDIT_SUMMARY = {
  totalEarned:23.5, totalRequired:50, cat1Earned:19, cat1Required:25,
  abemEarned:18, abemRequired:30, thisYear:14.5, lastYear:9.0,
  byCategory:[
    { cat:"Critical Care", credits:6.5, color:"#ef4444" },
    { cat:"Cardiology", credits:5.0, color:"#f97316" },
    { cat:"Toxicology", credits:2.0, color:"#a855f7" },
    { cat:"Pediatrics", credits:2.0, color:"#4a90d9" },
    { cat:"Ultrasound", credits:4.0, color:"#00d4bc" },
    { cat:"Neurology", credits:2.0, color:"#9b6dff" },
    { cat:"Other", credits:2.0, color:"#4a7299" },
  ],
};

// ── UTILITIES ────────────────────────────────────────────────────────────────
function daysUntil(dateStr) {
  return Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
}
function urgencyColor(days) {
  if (days <= 60) return G.red;
  if (days <= 180) return G.amber;
  return G.green;
}
function fmtDate(s) {
  return new Date(s).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" });
}

// ── COMPONENT ─────────────────────────────────────────────────────────────────
export default function CMELearningCenter() {
  const [activeTab, setActiveTab]       = useState("modules");
  const [selectedModule, setSelectedModule] = useState(null);
  const [catFilter, setCatFilter]       = useState("all");
  const [diffFilter, setDiffFilter]     = useState("all");
  const [searchQ, setSearchQ]           = useState("");
  const [completedModules, setCompletedModules] = useState(
    CME_MODULES.filter(m => m.completed).map(m => m.id)
  );
  const [progressMap, setProgressMap]   = useState(
    Object.fromEntries(CME_MODULES.map(m => [m.id, m.progress]))
  );
  const [activeModuleStep, setActiveModuleStep] = useState(0);
  const [quizAnswers, setQuizAnswers]   = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [toast, setToast]               = useState(null);
  const [certModal, setCertModal]       = useState(null);
  const [llsaModal, setLlsaModal]       = useState(false);
  const toastRef = useRef(null);

  const showToast = useCallback((msg, color = G.teal) => {
    if (toastRef.current) clearTimeout(toastRef.current);
    setToast({ msg, color });
    toastRef.current = setTimeout(() => setToast(null), 3400);
  }, []);

  function startModule(mod) {
    setSelectedModule(mod);
    setActiveModuleStep(0);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setActiveTab("learn");
  }

  function markComplete(modId) {
    setCompletedModules(prev => prev.includes(modId) ? prev : [...prev, modId]);
    setProgressMap(prev => ({ ...prev, [modId]: 100 }));
    showToast(`✓ CME credit recorded — ${CME_MODULES.find(m=>m.id===modId)?.credits} credits earned`, G.green);
  }

  function updateProgress(modId, pct) {
    setProgressMap(prev => ({ ...prev, [modId]: Math.max(prev[modId]||0, pct) }));
  }

  const filteredModules = CME_MODULES.filter(m => {
    const matchCat  = catFilter === "all" || m.category === catFilter;
    const matchDiff = diffFilter === "all" || m.difficulty === diffFilter;
    const q = searchQ.toLowerCase();
    const matchQ = !q || m.title.toLowerCase().includes(q) || m.category.toLowerCase().includes(q) || m.tags.some(t => t.toLowerCase().includes(q));
    return matchCat && matchDiff && matchQ;
  });

  const categories = [...new Set(CME_MODULES.map(m => m.category))];
  const totalEarned = completedModules.reduce((s, id) => s + (CME_MODULES.find(m=>m.id===id)?.credits||0), 0);
  const futureLicenseDays = STATE_LICENSES.map(l => daysUntil(l.renewalDate)).filter(d => d > 0);
  const nextRenewalDays = futureLicenseDays.length > 0 ? Math.min(...futureLicenseDays) : null;

  // ── STYLES ──────────────────────────────────────────────────────────────────
  const S = {
    card:(accent)=>({ background:G.panel, border:`1px solid ${G.border}`, borderRadius:13, overflow:"hidden", borderTop:`3px solid ${accent||G.border}` }),
    btn:(bg,col="#fff",brd="transparent")=>({ padding:"9px 18px", borderRadius:8, fontFamily:"inherit", fontSize:12.5, fontWeight:700, cursor:"pointer", display:"inline-flex", alignItems:"center", gap:6, border:`1px solid ${brd}`, background:bg, color:col, whiteSpace:"nowrap", transition:"all .15s" }),
    progressBar:(pct,color)=>({ height:6, borderRadius:3, background:`linear-gradient(90deg,${color||G.teal} ${pct}%,rgba(30,58,95,.5) ${pct}%)` }),
    tag:(color)=>({ fontSize:10.5, fontWeight:700, padding:"2px 8px", borderRadius:6, background:`${color}18`, border:`1px solid ${color}44`, color, display:"inline-block" }),
    sectionHeading:{ padding:"10px 16px 8px", fontFamily:"'Playfair Display',Georgia,serif", fontSize:13, fontWeight:700, color:G.bright, borderBottom:`1px solid rgba(30,58,95,.4)`, background:"rgba(11,29,53,.5)", display:"flex", alignItems:"center", gap:7 },
    pill:(active)=>({ fontSize:11, fontWeight:700, padding:"4px 11px", borderRadius:20, border:`1px solid ${active?G.teal:G.border}`, background:active?"rgba(0,212,188,.08)":"transparent", color:active?G.bright:G.dim, cursor:"pointer", fontFamily:"inherit" }),
    statBlock:{ background:G.panel, border:`1px solid ${G.border}`, borderRadius:11, padding:"14px 16px", textAlign:"center" },
    overlay:{ position:"fixed", inset:0, background:"rgba(0,0,0,.75)", backdropFilter:"blur(8px)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center" },
    modal:{ background:G.slate, border:`1px solid ${G.border}`, borderRadius:18, width:620, maxHeight:"90vh", overflowY:"auto" },
    modalHeader:{ padding:"18px 24px 14px", borderBottom:`1px solid ${G.border}`, display:"flex", alignItems:"center", gap:10 },
    modalFooter:{ padding:"14px 24px", borderTop:`1px solid ${G.border}`, display:"flex", gap:8, justifyContent:"flex-end" },
  };

  // ── MODULE CARD ──────────────────────────────────────────────────────────────
  function ModuleCard({ mod }) {
    const isCompleted = completedModules.includes(mod.id);
    const prog = progressMap[mod.id] || 0;
    const days = daysUntil(mod.expiry);
    const uc = urgencyColor(days);
    return (
      <div style={{ ...S.card(mod.color), cursor:"pointer", transition:"transform .12s, box-shadow .12s" }}
        onMouseEnter={e => { e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow=`0 8px 24px rgba(0,0,0,.3)`; }}
        onMouseLeave={e => { e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="none"; }}
        onClick={() => startModule(mod)}>
        <div style={{ padding:"16px 18px 12px" }}>
          <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:10 }}>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:6 }}>
                <span style={S.tag(mod.color)}>{mod.category}</span>
                <span style={S.tag(G.blue)}>{mod.format}</span>
                {mod.abem && <span style={S.tag(G.gold)}>ABEM MOC</span>}
                {mod.featured && <span style={S.tag(G.purple)}>⭐ Featured</span>}
              </div>
              <div style={{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:15, fontWeight:700, color:G.bright, lineHeight:1.35 }}>{mod.title}</div>
            </div>
            {isCompleted && (
              <div style={{ width:32, height:32, borderRadius:"50%", background:"rgba(46,204,113,.15)", border:`2px solid ${G.green}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>✓</div>
            )}
          </div>
          <div style={{ fontSize:12, color:G.dim, lineHeight:1.6, marginBottom:12 }}>{mod.description.slice(0, 110)}…</div>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:12 }}>
            {[[`⏱ ${mod.duration} min`, G.dim],[`🎓 ${mod.credits} cr`, G.teal],[`📊 ${mod.difficulty}`, G.blue]].map(([label, color]) => (
              <span key={label} style={{ fontSize:11, fontWeight:700, color, fontFamily:"'JetBrains Mono',monospace" }}>{label}</span>
            ))}
          </div>
          {!isCompleted && prog > 0 && (
            <div style={{ marginBottom:10 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                <span style={{ fontSize:10.5, color:G.dim, fontWeight:700 }}>Progress</span>
                <span style={{ fontSize:10.5, color:G.teal, fontFamily:"'JetBrains Mono',monospace", fontWeight:700 }}>{prog}%</span>
              </div>
              <div style={S.progressBar(prog, mod.color)}/>
            </div>
          )}
        </div>
        <div style={{ padding:"10px 18px", borderTop:`1px solid rgba(30,58,95,.4)`, display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(11,29,53,.4)" }}>
          <span style={{ fontSize:10.5, fontWeight:700, color:uc }}>Expires {fmtDate(mod.expiry)} · {days}d</span>
          <button style={{ ...S.btn(isCompleted?"rgba(46,204,113,.1)":"rgba(0,212,188,.1)", isCompleted?G.green:G.teal, isCompleted?"rgba(46,204,113,.3)":"rgba(0,212,188,.3)"), fontSize:11, padding:"5px 12px" }}>
            {isCompleted ? "✓ Completed" : prog > 0 ? "▶ Resume" : "▶ Start"}
          </button>
        </div>
      </div>
    );
  }

  // ── MODULE VIEWER ─────────────────────────────────────────────────────────
  function ModuleViewer() {
    if (!selectedModule) return (
      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:14, opacity:.55, padding:40, textAlign:"center" }}>
        <div style={{ fontSize:52 }}>🎓</div>
        <div style={{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:22, color:G.dim }}>Select a module to begin</div>
        <div style={{ fontSize:13, color:G.muted, maxWidth:320, lineHeight:1.7 }}>Browse CME modules in the Modules tab, then click Start or Resume to open the interactive learning viewer.</div>
      </div>
    );

    const mod = selectedModule;
    const isCompleted = completedModules.includes(mod.id);
    const steps = ["Overview","Clinical Case","Learning Objectives","Key Concepts","Post-Test","Certificate"];
    const prog = Math.round((activeModuleStep / (steps.length - 1)) * 100);

    const QUIZ = [
      { q:`In the case of ${mod.caseSnippet.split(".")[0]}, which is the MOST appropriate FIRST intervention?`, options:["IV access and fluid bolus","Diagnostic imaging","Immediate surgical consultation","Discharge with follow-up"], correct:0 },
      { q:"Which monitoring parameter is MOST critical in the first hour of management?", options:["Serial lactate every 2 hours","Continuous ECG monitoring","Hourly urine output","Serum electrolyte panel"], correct:2 },
      { q:"Which of the following is a CONTRAINDICATION to the primary intervention in this case?", options:["Age > 65","Allergy to common first-line agent","Concurrent beta-blocker use","Recent acetaminophen ingestion"], correct:1 },
    ];

    const quizScore = QUIZ.filter((q,i) => quizAnswers[i] === q.correct).length;
    const passingScore = Math.ceil(QUIZ.length * 0.7);

    return (
      <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
        {/* Module Header */}
        <div style={{ padding:"16px 24px 12px", borderBottom:`1px solid ${G.border}`, background:"rgba(11,29,53,.5)", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
            <button style={{ ...S.btn("transparent",G.dim,G.border), fontSize:11, padding:"4px 10px" }} onClick={() => { setSelectedModule(null); setActiveTab("modules"); }}>← Back</button>
            <div style={{ flex:1 }}/>
            {[`⏱ ${mod.duration} min`, `🎓 ${mod.credits} CME Credits`, `📊 ${mod.difficulty}`].map((l,i)=>(
              <span key={i} style={{ fontSize:11, fontWeight:700, color:G.dim, fontFamily:"'JetBrains Mono',monospace" }}>{l}</span>
            ))}
            {mod.abem && <span style={S.tag(G.gold)}>ABEM MOC</span>}
          </div>
          <div style={{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:18, fontWeight:700, color:G.bright, marginBottom:8 }}>{mod.title}</div>
          {/* Step progress */}
          <div style={{ display:"flex", gap:6, alignItems:"center" }}>
            {steps.map((step, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:6 }}>
                <div style={{ display:"flex", alignItems:"center", gap:5, cursor: i <= activeModuleStep ? "pointer" : "default" }}
                  onClick={() => i <= activeModuleStep && setActiveModuleStep(i)}>
                  <div style={{ width:22, height:22, borderRadius:"50%", background:i < activeModuleStep ? G.teal : i === activeModuleStep ? "rgba(0,212,188,.2)" : "rgba(30,58,95,.5)", border:`1px solid ${i <= activeModuleStep ? G.teal : G.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:800, color:i < activeModuleStep ? "#fff" : i === activeModuleStep ? G.teal : G.dim }}>
                    {i < activeModuleStep ? "✓" : i + 1}
                  </div>
                  <span style={{ fontSize:10, fontWeight:700, color:i === activeModuleStep ? G.bright : G.dim, display:i === activeModuleStep ? "inline" : "none" }}>{step}</span>
                </div>
                {i < steps.length - 1 && <div style={{ width:16, height:1, background:i < activeModuleStep ? G.teal : G.border }}/>}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div style={{ flex:1, overflowY:"auto", padding:24 }}>
          {activeModuleStep === 0 && (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <div style={{ ...S.card(mod.color), padding:"20px 22px" }}>
                <div style={{ fontSize:11, fontWeight:800, textTransform:"uppercase", letterSpacing:".07em", color:mod.color, marginBottom:8 }}>Module Overview</div>
                <div style={{ fontSize:14, color:G.text, lineHeight:1.8 }}>{mod.description}</div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:14 }}>
                  {mod.tags.map(t => <span key={t} style={S.tag(G.blue)}>{t}</span>)}
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
                {[["🏆 Credits",`${mod.credits} AMA Cat. 1`,G.teal],["⏱ Duration",`~${mod.duration} minutes`,G.blue],["📅 Expires",fmtDate(mod.expiry),urgencyColor(daysUntil(mod.expiry))],["🏛 Accreditor",mod.accreditor,G.purple],["📋 Format",mod.format,G.amber],["📊 Level",mod.difficulty,G.rose]].map(([label, val, color]) => (
                  <div key={label} style={{ background:"rgba(22,45,79,.5)", border:`1px solid ${G.border}`, borderRadius:9, padding:"12px 14px" }}>
                    <div style={{ fontSize:10, fontWeight:800, textTransform:"uppercase", letterSpacing:".07em", color:G.dim, marginBottom:5 }}>{label}</div>
                    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, color, fontWeight:600 }}>{val}</div>
                  </div>
                ))}
              </div>
              <div style={{ background:"rgba(155,109,255,.06)", border:`1px solid rgba(155,109,255,.2)`, borderRadius:11, padding:"16px 18px" }}>
                <div style={{ fontSize:11, fontWeight:800, textTransform:"uppercase", letterSpacing:".07em", color:G.purple, marginBottom:8 }}>📚 Key References</div>
                {mod.references.map((ref, i) => (
                  <div key={i} style={{ fontSize:12.5, color:G.text, marginBottom:5, display:"flex", gap:8 }}>
                    <span style={{ color:G.purple, flexShrink:0 }}>{i+1}.</span>{ref}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeModuleStep === 1 && (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <div style={{ background:"rgba(239,68,68,.06)", border:`1px solid rgba(239,68,68,.2)`, borderRadius:13, padding:"20px 22px" }}>
                <div style={{ fontSize:11, fontWeight:800, textTransform:"uppercase", letterSpacing:".07em", color:G.red, marginBottom:10 }}>🏥 Clinical Case Presentation</div>
                <div style={{ fontSize:14, color:G.bright, lineHeight:1.85, fontFamily:"'Playfair Display',Georgia,serif", fontStyle:"italic" }}>"{mod.caseSnippet}"</div>
              </div>
              <div style={{ background:"rgba(0,212,188,.06)", border:`1px solid rgba(0,212,188,.2)`, borderRadius:11, padding:"16px 18px" }}>
                <div style={{ fontSize:11, fontWeight:800, textTransform:"uppercase", letterSpacing:".07em", color:G.teal, marginBottom:8 }}>💭 Initial Considerations</div>
                <div style={{ fontSize:13, color:G.text, lineHeight:1.75 }}>
                  Consider the key diagnostic and management decisions required in this case. Think about:
                  <ul style={{ marginTop:8, paddingLeft:20, lineHeight:2 }}>
                    <li>What is your immediate priority?</li>
                    <li>Which diagnostic workup is essential vs. can wait?</li>
                    <li>What disposition is most appropriate?</li>
                    <li>Which consultant, if any, should you activate?</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeModuleStep === 2 && (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div style={{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:20, fontWeight:700, color:G.bright, marginBottom:4 }}>Learning Objectives</div>
              <div style={{ fontSize:13, color:G.dim, marginBottom:6 }}>Upon completing this module, you will be able to:</div>
              {mod.learningObjectives.map((obj, i) => (
                <div key={i} style={{ display:"flex", gap:12, background:"rgba(22,45,79,.5)", border:`1px solid ${G.border}`, borderRadius:10, padding:"14px 16px" }}>
                  <div style={{ width:28, height:28, borderRadius:"50%", background:`${mod.color}18`, border:`1px solid ${mod.color}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800, color:mod.color, flexShrink:0 }}>{i+1}</div>
                  <div style={{ fontSize:13, color:G.text, lineHeight:1.65 }}>{obj}</div>
                </div>
              ))}
            </div>
          )}

          {activeModuleStep === 3 && (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <div style={{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:20, fontWeight:700, color:G.bright }}>Key Clinical Concepts</div>
              {[
                { title:"Evidence-Based Approach", icon:"🔬", body:`This module synthesizes current evidence from landmark trials and society guidelines. Key recommendations are graded by strength of evidence. ${mod.references[0]} provides the primary evidence base.` },
                { title:"Clinical Pearls", icon:"💡", body:`Guidelines are starting points, not mandates. Clinical gestalt, patient-specific factors, and institutional resources must inform decision-making. Document your reasoning clearly when deviating from standard protocols.` },
                { title:"Pitfalls to Avoid", icon:"⚠️", body:`Common errors include anchoring bias on the initial presentation, failure to reassess after interventions, inadequate documentation of decision points, and delayed escalation when first-line treatments fail.` },
                { title:"Disposition Considerations", icon:"🏥", body:`Risk stratification tools guide admission vs. discharge decisions, but apply thoughtfully. Consider social support, access to follow-up care, and patient understanding of return precautions.` },
              ].map((item, i) => (
                <div key={i} style={{ background:"rgba(22,45,79,.4)", border:`1px solid ${G.border}`, borderRadius:11, padding:"16px 18px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                    <span style={{ fontSize:18 }}>{item.icon}</span>
                    <span style={{ fontWeight:800, fontSize:14, color:G.bright }}>{item.title}</span>
                  </div>
                  <div style={{ fontSize:13, color:G.text, lineHeight:1.75 }}>{item.body}</div>
                </div>
              ))}
            </div>
          )}

          {activeModuleStep === 4 && (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <div style={{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:20, fontWeight:700, color:G.bright }}>Post-Test — {QUIZ.length} Questions</div>
              <div style={{ fontSize:12.5, color:G.dim }}>Score 70% or higher ({passingScore}/{QUIZ.length}) to earn CME credit.</div>
              {QUIZ.map((q, qi) => (
                <div key={qi} style={{ background:"rgba(22,45,79,.5)", border:`1px solid ${G.border}`, borderRadius:11, padding:"16px 18px" }}>
                  <div style={{ fontWeight:700, fontSize:13.5, color:G.bright, marginBottom:12, lineHeight:1.6 }}>{qi+1}. {q.q}</div>
                  {q.options.map((opt, oi) => {
                    const selected = quizAnswers[qi] === oi;
                    const isCorrect = oi === q.correct;
                    let bg = "transparent"; let border = G.border; let col = G.text;
                    if (selected && !quizSubmitted) { bg = "rgba(74,144,217,.15)"; border = G.blue; col = G.bright; }
                    if (quizSubmitted && isCorrect) { bg = "rgba(46,204,113,.12)"; border = G.green; col = G.green; }
                    if (quizSubmitted && selected && !isCorrect) { bg = "rgba(255,92,108,.1)"; border = G.red; col = G.red; }
                    return (
                      <div key={oi} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:8, border:`1px solid ${border}`, background:bg, color:col, cursor:quizSubmitted?"default":"pointer", marginBottom:6, fontSize:13, transition:"all .12s" }}
                        onClick={() => !quizSubmitted && setQuizAnswers(prev => ({ ...prev, [qi]: oi }))}>
                        <div style={{ width:18, height:18, borderRadius:"50%", border:`2px solid ${selected || (quizSubmitted && isCorrect) ? col : G.dim}`, background:selected && !quizSubmitted ? G.blue : quizSubmitted && isCorrect ? G.green : quizSubmitted && selected ? G.red : "transparent", flexShrink:0 }}/>
                        {opt}
                        {quizSubmitted && isCorrect && <span style={{ marginLeft:"auto", fontWeight:800, color:G.green }}>✓ Correct</span>}
                        {quizSubmitted && selected && !isCorrect && <span style={{ marginLeft:"auto", fontWeight:800, color:G.red }}>✗ Incorrect</span>}
                      </div>
                    );
                  })}
                </div>
              ))}
              {!quizSubmitted ? (
                <button style={{ ...S.btn("linear-gradient(135deg,#9b6dff,#7c5cd6)"), justifyContent:"center", opacity:Object.keys(quizAnswers).length < QUIZ.length ? .5 : 1 }}
                  disabled={Object.keys(quizAnswers).length < QUIZ.length}
                  onClick={() => setQuizSubmitted(true)}>
                  Submit Answers ({Object.keys(quizAnswers).length}/{QUIZ.length} answered)
                </button>
              ) : (
                <div style={{ background: quizScore >= passingScore ? "rgba(46,204,113,.08)" : "rgba(255,92,108,.08)", border:`1px solid ${quizScore >= passingScore ? G.green : G.red}`, borderRadius:11, padding:"16px 18px", textAlign:"center" }}>
                  <div style={{ fontSize:22, fontWeight:800, color: quizScore >= passingScore ? G.green : G.red, fontFamily:"'JetBrains Mono',monospace", marginBottom:6 }}>{quizScore}/{QUIZ.length} — {Math.round(quizScore/QUIZ.length*100)}%</div>
                  <div style={{ fontSize:13, color:G.text }}>{quizScore >= passingScore ? `✓ Passing score! You've earned ${mod.credits} CME credits.` : `✗ Score below 70%. Review the material and retake.`}</div>
                  {quizScore < passingScore && (
                    <button style={{ ...S.btn("rgba(74,144,217,.1)",G.blue,"rgba(74,144,217,.3)"), marginTop:12 }} onClick={() => { setQuizAnswers({}); setQuizSubmitted(false); }}>Retake Quiz</button>
                  )}
                </div>
              )}
            </div>
          )}

          {activeModuleStep === 5 && (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:18, padding:"20px 0" }}>
              <div style={{ fontSize:60 }}>🏆</div>
              <div style={{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:26, fontWeight:700, color:G.bright, textAlign:"center" }}>CME Credit Earned</div>
              <div style={{ fontSize:14, color:G.dim, textAlign:"center", maxWidth:400, lineHeight:1.7 }}>You have successfully completed this CME module and earned <strong style={{ color:G.teal }}>{mod.credits} AMA PRA Category 1 Credit™</strong>.</div>
              <div style={{ background:G.panel, border:`1px solid ${G.border}`, borderRadius:16, padding:"24px 32px", textAlign:"center", maxWidth:480, width:"100%" }}>
                <div style={{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:18, color:G.bright, marginBottom:4, fontStyle:"italic" }}>Certificate of Completion</div>
                <div style={{ width:60, height:2, background:G.teal, margin:"8px auto 14px" }}/>
                <div style={{ fontSize:13, color:G.dim, marginBottom:6 }}>This certifies completion of</div>
                <div style={{ fontSize:15, fontWeight:700, color:G.bright, marginBottom:10, lineHeight:1.4 }}>{mod.title}</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:16 }}>
                  {[["Credits",`${mod.credits} Cat. 1`],["Accreditor",mod.accreditor],["Date",fmtDate(new Date().toISOString())],["Cert ID",`NOTRYA-${new Date().getFullYear()}-${Math.floor(Math.random()*9000+1000)}`]].map(([l,v])=>(
                    <div key={l} style={{ background:"rgba(22,45,79,.5)", borderRadius:8, padding:"8px 10px" }}>
                      <div style={{ fontSize:9, fontWeight:800, textTransform:"uppercase", letterSpacing:".07em", color:G.dim, marginBottom:3 }}>{l}</div>
                      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:G.teal, fontWeight:700 }}>{v}</div>
                    </div>
                  ))}
                </div>
                <button style={{ ...S.btn("linear-gradient(135deg,#00d4bc,#00a896)"), width:"100%", justifyContent:"center" }}
                  onClick={() => { markComplete(mod.id); showToast("Certificate saved to your transcript","#2ecc71"); }}>
                  📥 Save to Transcript
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Step Nav Footer */}
        <div style={{ padding:"12px 24px", borderTop:`1px solid ${G.border}`, background:"rgba(11,29,53,.5)", display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
          <button style={{ ...S.btn("transparent",G.dim,G.border), opacity:activeModuleStep===0?.4:1 }} disabled={activeModuleStep===0} onClick={() => setActiveModuleStep(s => s-1)}>← Previous</button>
          <div style={{ flex:1, display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ flex:1, height:4, borderRadius:2, background:G.border }}>
              <div style={{ height:"100%", borderRadius:2, background:G.teal, width:`${prog}%`, transition:"width .3s" }}/>
            </div>
            <span style={{ fontSize:11, fontWeight:700, color:G.dim, fontFamily:"'JetBrains Mono',monospace", flexShrink:0 }}>{prog}%</span>
          </div>
          {activeModuleStep < steps.length - 1 ? (
            <button style={{ ...S.btn("linear-gradient(135deg,#00d4bc,#00a896)") }}
              onClick={() => { setActiveModuleStep(s => s+1); updateProgress(mod.id, Math.round(((activeModuleStep+1)/(steps.length-1))*100)); }}>
              Next: {steps[activeModuleStep+1]} →
            </button>
          ) : (
            <button style={{ ...S.btn("linear-gradient(135deg,#2ecc71,#25a55b)") }} onClick={() => { markComplete(mod.id); setActiveTab("tracker"); }}>
              ✓ Finish &amp; Record Credit
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── CME TRACKER VIEW ──────────────────────────────────────────────────────
  function TrackerView() {
    const total = totalEarned;
    const pct = Math.min(100, Math.round((total / CREDIT_SUMMARY.totalRequired)*100));
    return (
      <div style={{ padding:24, display:"flex", flexDirection:"column", gap:18 }}>
        <div style={{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:22, fontWeight:700, color:G.bright }}>CME Credit Tracker</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
          {[
            ["Total Earned",`${total.toFixed(1)}`,`/ ${CREDIT_SUMMARY.totalRequired} credits`,G.teal],
            ["Cat. 1 Credits",`${CREDIT_SUMMARY.cat1Earned}`,`/ ${CREDIT_SUMMARY.cat1Required} required`,G.blue],
            ["ABEM/MOC",`${CREDIT_SUMMARY.abemEarned}`,`/ ${CREDIT_SUMMARY.abemRequired} LLSA pts`,G.gold],
            ["This Year",`${CREDIT_SUMMARY.thisYear}`,"2025 YTD",G.green],
          ].map(([label, val, sub, color]) => (
            <div key={label} style={S.statBlock}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:28, fontWeight:700, color, lineHeight:1 }}>{val}</div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:G.dim, marginTop:3 }}>{sub}</div>
              <div style={{ fontSize:10, fontWeight:800, textTransform:"uppercase", letterSpacing:".07em", color:G.dim, marginTop:4 }}>{label}</div>
            </div>
          ))}
        </div>
        <div style={{ background:G.panel, border:`1px solid ${G.border}`, borderRadius:11, padding:"16px 18px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
            <span style={{ fontWeight:700, color:G.bright }}>2-Year Cycle Progress</span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:13, color:G.teal, fontWeight:700 }}>{pct}%</span>
          </div>
          <div style={{ height:12, borderRadius:6, background:"rgba(30,58,95,.6)", overflow:"hidden" }}>
            <div style={{ height:"100%", borderRadius:6, background:`linear-gradient(90deg,${G.teal},${G.blue})`, width:`${pct}%`, transition:"width .4s" }}/>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
            <span style={{ fontSize:11, color:G.dim }}>0 credits</span>
            <span style={{ fontSize:11, color:G.dim }}>{CREDIT_SUMMARY.totalRequired} required by renewal</span>
          </div>
        </div>
        <div style={{ background:G.panel, border:`1px solid ${G.border}`, borderRadius:11, padding:"16px 18px" }}>
          <div style={{ fontWeight:800, fontSize:12.5, color:G.bright, marginBottom:12 }}>Credits by Specialty Category</div>
          {CREDIT_SUMMARY.byCategory.map(c => (
            <div key={c.cat} style={{ marginBottom:10 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                <span style={{ fontSize:12.5, color:G.text }}>{c.cat}</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:c.color, fontWeight:700 }}>{c.credits} cr</span>
              </div>
              <div style={{ height:5, borderRadius:3, background:"rgba(30,58,95,.5)" }}>
                <div style={{ height:"100%", borderRadius:3, background:c.color, width:`${Math.min(100,(c.credits/8)*100)}%` }}/>
              </div>
            </div>
          ))}
        </div>
        <div style={{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:16, fontWeight:700, color:G.bright }}>Completed Modules</div>
        {CME_MODULES.filter(m => completedModules.includes(m.id)).map(mod => (
          <div key={mod.id} style={{ background:G.panel, border:`1px solid ${G.border}`, borderRadius:11, padding:"14px 16px", display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:36, height:36, borderRadius:"50%", background:"rgba(46,204,113,.12)", border:`2px solid ${G.green}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>✓</div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, fontSize:13, color:G.bright }}>{mod.title}</div>
              <div style={{ fontSize:11.5, color:G.dim, marginTop:2 }}>{mod.category} · {fmtDate(mod.completedDate||new Date().toISOString())} · {mod.accreditor}</div>
            </div>
            <div style={{ textAlign:"right", flexShrink:0 }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:16, fontWeight:700, color:G.teal }}>{mod.credits}</div>
              <div style={{ fontSize:10, color:G.dim }}>credits</div>
            </div>
            <button style={{ ...S.btn("rgba(0,212,188,.1)",G.teal,"rgba(0,212,188,.25)"), fontSize:11, padding:"5px 10px" }} onClick={() => setCertModal(mod)}>🏆 Cert</button>
          </div>
        ))}
        {completedModules.length === 0 && (
          <div style={{ textAlign:"center", color:G.muted, fontSize:13, padding:"24px 0" }}>No completed modules yet. Start a module to begin earning credits.</div>
        )}
      </div>
    );
  }

  // ── LICENSE TRACKER VIEW ──────────────────────────────────────────────────
  function LicenseView() {
    return (
      <div style={{ padding:24, display:"flex", flexDirection:"column", gap:18 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:22, fontWeight:700, color:G.bright }}>State License & Renewal Tracker</div>
          <button style={{ ...S.btn("linear-gradient(135deg,#4a90d9,#2f6db5)"), fontSize:12 }}>＋ Add License</button>
        </div>
        {STATE_LICENSES.map(lic => {
          const days = daysUntil(lic.renewalDate);
          const uc = urgencyColor(days);
          const pct = Math.round((lic.cmeCompleted / lic.cmeRequired)*100);
          const cat1Pct = Math.round((lic.category1Completed / lic.category1Required)*100);
          return (
            <div key={lic.state} style={{ ...S.card(uc) }}>
              <div style={{ padding:"16px 20px" }}>
                <div style={{ display:"flex", alignItems:"flex-start", gap:14, marginBottom:14 }}>
                  <div style={{ width:52, height:52, borderRadius:12, background:`${uc}18`, border:`2px solid ${uc}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:13, fontWeight:800, color:uc }}>{lic.abbr}</div>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:18, fontWeight:700, color:G.bright }}>{lic.state}</div>
                    <div style={{ fontSize:11.5, color:G.dim, marginTop:2 }}>License #{lic.licenseNum} · {lic.cycle} renewal cycle</div>
                    <div style={{ display:"flex", gap:8, marginTop:6, flexWrap:"wrap" }}>
                      <span style={S.tag(uc)}>Renews {fmtDate(lic.renewalDate)}</span>
                      <span style={{ ...S.tag(uc), fontFamily:"'JetBrains Mono',monospace" }}>{days}d remaining</span>
                      <span style={S.tag(G.green)}>✓ Active</span>
                    </div>
                  </div>
                  <div style={{ textAlign:"right", flexShrink:0 }}>
                    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:24, fontWeight:700, color:uc }}>{days}</div>
                    <div style={{ fontSize:10, color:G.dim }}>days until<br/>renewal</div>
                  </div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
                  {[["Total CME Required", lic.cmeCompleted, lic.cmeRequired, pct, G.teal],["Category 1 Required", lic.category1Completed, lic.category1Required, cat1Pct, G.blue]].map(([label, earned, req, p, color]) => (
                    <div key={label} style={{ background:"rgba(22,45,79,.5)", borderRadius:9, padding:"10px 12px" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                        <span style={{ fontSize:11, fontWeight:700, color:G.dim }}>{label}</span>
                        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, color, fontWeight:700 }}>{earned}/{req} cr</span>
                      </div>
                      <div style={{ height:5, borderRadius:3, background:"rgba(30,58,95,.6)" }}>
                        <div style={{ height:"100%", borderRadius:3, background:color, width:`${p}%` }}/>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ background:"rgba(245,166,35,.06)", border:"1px solid rgba(245,166,35,.2)", borderRadius:9, padding:"10px 12px" }}>
                  <div style={{ fontSize:10, fontWeight:800, textTransform:"uppercase", letterSpacing:".07em", color:G.amber, marginBottom:6 }}>⚠️ State-Specific Requirements</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                    {lic.specialReqs.map(req => <span key={req} style={S.tag(G.amber)}>{req}</span>)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ── ABEM MOC VIEW ─────────────────────────────────────────────────────────
  function MOCView() {
    const moc = ABEM_MOC;
    const totalPts = moc.points.reduce((s,p)=>s+p.earned,0);
    const reqPts = moc.points.reduce((s,p)=>s+p.required,0);
    return (
      <div style={{ padding:24, display:"flex", flexDirection:"column", gap:18 }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:16 }}>
          <div>
            <div style={{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:22, fontWeight:700, color:G.bright }}>ABEM Maintenance of Certification</div>
            <div style={{ fontSize:13, color:G.dim, marginTop:3 }}>American Board of Emergency Medicine · MOC Activity Documentation</div>
          </div>
          <button style={{ ...S.btn("linear-gradient(135deg,#fbbf24,#d97706)","#1a1000"), fontSize:12 }} onClick={()=>setLlsaModal(true)}>📋 LLSA Articles</button>
        </div>
        <div style={{ background:`linear-gradient(135deg,${G.panel} 0%,rgba(22,45,79,.8) 100%)`, border:`1px solid ${G.gold}44`, borderRadius:14, padding:"20px 22px", display:"flex", gap:18, alignItems:"center" }}>
          <div style={{ fontSize:44 }}>🏅</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:10, fontWeight:800, textTransform:"uppercase", letterSpacing:".1em", color:G.gold, marginBottom:4 }}>ABEM Diplomate</div>
            <div style={{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:20, fontWeight:700, color:G.bright }}>{moc.diplomate}</div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11.5, color:G.dim, marginTop:4 }}>Cert #{moc.certNum} · Cycle {moc.currentCycle} · Expires {fmtDate(moc.certExpiry)}</div>
          </div>
          <div style={{ textAlign:"right", flexShrink:0 }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:26, fontWeight:700, color:G.gold }}>{totalPts}/{reqPts}</div>
            <div style={{ fontSize:10, color:G.dim }}>points this cycle</div>
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          {moc.points.map(p => {
            const pct = p.required > 0 ? Math.min(100, Math.round((p.earned/p.required)*100)) : 100;
            const done = p.earned >= p.required;
            return (
              <div key={p.part} style={{ ...S.card(p.color), padding:"16px 18px" }}>
                <div style={{ display:"flex", alignItems:"flex-start", gap:8, marginBottom:10 }}>
                  <div style={{ flex:1, fontWeight:800, fontSize:12, color:G.bright, lineHeight:1.4 }}>{p.part}</div>
                  {done && <div style={{ background:"rgba(46,204,113,.15)", border:`1px solid ${G.green}`, borderRadius:20, padding:"2px 8px", fontSize:10, fontWeight:800, color:G.green, flexShrink:0 }}>✓ Done</div>}
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                  <span style={{ fontSize:11.5, color:G.dim }}>Progress</span>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:13, color:p.color, fontWeight:700 }}>{p.earned} / {p.required || "Bonus"} pts</span>
                </div>
                {p.required > 0 && (
                  <div style={{ height:6, borderRadius:3, background:"rgba(30,58,95,.6)" }}>
                    <div style={{ height:"100%", borderRadius:3, background:p.color, width:`${pct}%`, transition:"width .4s" }}/>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ background:G.panel, border:`1px solid ${G.border}`, borderRadius:11, overflow:"hidden" }}>
          <div style={S.sectionHeading}><span>📖</span><span>LLSA Article Progress</span></div>
          <div style={{ padding:"12px 16px" }}>
            {moc.llsaArticles.map((art, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:`1px solid rgba(30,58,95,.3)` }}>
                <div style={{ width:28, height:28, borderRadius:"50%", background:art.completed?"rgba(46,204,113,.12)":"rgba(30,58,95,.5)", border:`1px solid ${art.completed?G.green:G.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, flexShrink:0 }}>
                  {art.completed ? "✓" : "○"}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:art.completed?G.bright:G.dim }}>{art.title}</div>
                  <div style={{ fontSize:11, color:G.muted, marginTop:2 }}>{art.year} · {art.credits} pts{art.completed ? ` · Completed ${fmtDate(art.date)}` : ""}</div>
                </div>
                {!art.completed && (
                  <button style={{ ...S.btn("rgba(251,191,36,.1)",G.gold,"rgba(251,191,36,.3)"), fontSize:11, padding:"5px 11px" }}>Start →</button>
                )}
              </div>
            ))}
          </div>
        </div>
        <div style={{ background:"rgba(155,109,255,.06)", border:"1px solid rgba(155,109,255,.2)", borderRadius:11, padding:"16px 18px" }}>
          <div style={{ fontSize:11, fontWeight:800, textTransform:"uppercase", letterSpacing:".07em", color:G.purple, marginBottom:8 }}>📤 MOC Documentation Export</div>
          <div style={{ fontSize:12.5, color:G.text, lineHeight:1.7, marginBottom:12 }}>Export your completed CME activities to submit directly to ABEM's MOC portal. All completed modules with ABEM MOC designation are included automatically.</div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            <button style={{ ...S.btn("linear-gradient(135deg,#9b6dff,#7c5cd6)") }} onClick={()=>showToast("MOC transcript exported — ready for ABEM submission",G.purple)}>📥 Export MOC Transcript</button>
            <button style={{ ...S.btn("transparent",G.text,G.border) }} onClick={()=>showToast("Opening ABEM portal…",G.blue)}>🔗 ABEM Portal</button>
          </div>
        </div>
      </div>
    );
  }

  // ── NEWS FEED CME VIEW ─────────────────────────────────────────────────────
  function NewsView() {
    return (
      <div style={{ padding:24, display:"flex", flexDirection:"column", gap:18 }}>
        <div style={{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:22, fontWeight:700, color:G.bright }}>CME-Eligible Literature</div>
        <div style={{ fontSize:13, color:G.dim, marginTop:-10 }}>Articles from the Medical News Feed with available CME credit.</div>
        {CME_NEWS.map(article => (
          <div key={article.id} style={{ background:G.panel, border:`1px solid ${G.border}`, borderRadius:13, overflow:"hidden" }}>
            <div style={{ height:3, background:`linear-gradient(90deg,${G.purple},${G.teal})` }}/>
            <div style={{ padding:"16px 18px" }}>
              <div style={{ display:"flex", gap:10, marginBottom:8, flexWrap:"wrap" }}>
                <span style={S.tag(G.purple)}>{article.source}</span>
                <span style={S.tag(G.blue)}>{article.category}</span>
                <span style={S.tag(G.teal)}>🎓 {article.credits} CME Credit</span>
                <span style={{ fontSize:11, color:G.dim, fontFamily:"'JetBrains Mono',monospace" }}>{fmtDate(article.date)}</span>
              </div>
              <div style={{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:16, fontWeight:700, color:G.bright, marginBottom:8, lineHeight:1.4 }}>{article.title}</div>
              <div style={{ fontSize:13, color:G.dim, lineHeight:1.7, marginBottom:12 }}>{article.summary}</div>
              <div style={{ fontSize:11, fontFamily:"'JetBrains Mono',monospace", color:G.muted, marginBottom:12 }}>DOI: {article.doi}</div>
              <div style={{ display:"flex", gap:8 }}>
                <button style={{ ...S.btn("linear-gradient(135deg,#9b6dff,#7c5cd6)"), fontSize:12 }} onClick={()=>showToast(`Opening CME module for ${article.title.slice(0,30)}…`,G.purple)}>🎓 Claim {article.credits} Credits</button>
                <button style={{ ...S.btn("transparent",G.text,G.border), fontSize:12 }}>📄 Full Article</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── LEFT PANEL CONTENT ───────────────────────────────────────────────────────
  function LeftPanel() {
    if (activeTab === "modules") return (
      <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
        <div style={{ padding:12, borderBottom:`1px solid rgba(30,58,95,.5)` }}>
          <div style={{ position:"relative" }}>
            <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:G.dim }}>🔍</span>
            <input style={{ width:"100%", background:"rgba(22,45,79,.8)", border:`1px solid ${G.border}`, borderRadius:9, padding:"8px 11px 8px 32px", fontFamily:"inherit", fontSize:13, color:G.bright, outline:"none", boxSizing:"border-box" }} placeholder="Search modules…" value={searchQ} onChange={e=>setSearchQ(e.target.value)}/>
          </div>
        </div>
        <div style={{ padding:"8px 12px", borderBottom:`1px solid rgba(30,58,95,.4)` }}>
          <div style={{ fontSize:9.5, fontWeight:800, textTransform:"uppercase", letterSpacing:".08em", color:G.dim, marginBottom:6 }}>Category</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
            <button style={S.pill(catFilter==="all")} onClick={()=>setCatFilter("all")}>All</button>
            {categories.map(c => <button key={c} style={S.pill(catFilter===c)} onClick={()=>setCatFilter(c)}>{c}</button>)}
          </div>
        </div>
        <div style={{ padding:"8px 12px", borderBottom:`1px solid rgba(30,58,95,.4)` }}>
          <div style={{ fontSize:9.5, fontWeight:800, textTransform:"uppercase", letterSpacing:".08em", color:G.dim, marginBottom:6 }}>Difficulty</div>
          <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
            {["all","Foundational","Intermediate","Advanced"].map(d => <button key={d} style={S.pill(diffFilter===d)} onClick={()=>setDiffFilter(d)}>{d==="all"?"All":d}</button>)}
          </div>
        </div>
        <div style={{ padding:"10px 12px", flex:1 }}>
          <div style={{ fontSize:9.5, fontWeight:800, textTransform:"uppercase", letterSpacing:".08em", color:G.dim, marginBottom:8 }}>Quick Summary</div>
          {[
            [`${completedModules.length} completed`, G.green],
            [`${CME_MODULES.filter(m=>!completedModules.includes(m.id)&&(progressMap[m.id]||0)>0).length} in progress`, G.amber],
            [`${totalEarned.toFixed(1)} credits earned`, G.teal],
            [`${CME_MODULES.filter(m=>m.abem).length} ABEM-eligible`, G.gold],
          ].map(([label, color]) => (
            <div key={label} style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 0", borderBottom:`1px solid rgba(30,58,95,.25)` }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:color, flexShrink:0 }}/>
              <span style={{ fontSize:12.5, color:G.text, fontWeight:600 }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    );
    if (activeTab === "tracker") return (
      <div style={{ padding:12 }}>
        <div style={S.sectionHeading}>📊 Credit Breakdown</div>
        <div style={{ padding:8 }}>
          {CREDIT_SUMMARY.byCategory.map(c => (
            <div key={c.cat} style={{ marginBottom:10 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                <span style={{ fontSize:12, color:G.text }}>{c.cat}</span>
                <span style={{ fontSize:11, color:c.color, fontFamily:"'JetBrains Mono',monospace", fontWeight:700 }}>{c.credits}</span>
              </div>
              <div style={{ height:4, borderRadius:2, background:"rgba(30,58,95,.6)" }}>
                <div style={{ height:"100%", borderRadius:2, background:c.color, width:`${(c.credits/8)*100}%` }}/>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
    if (activeTab === "licenses") return (
      <div style={{ padding:12 }}>
        <div style={S.sectionHeading}>📅 Upcoming Renewals</div>
        <div style={{ padding:8 }}>
          {STATE_LICENSES.sort((a,b)=>daysUntil(a.renewalDate)-daysUntil(b.renewalDate)).map(lic => {
            const days = daysUntil(lic.renewalDate);
            const uc = urgencyColor(days);
            return (
              <div key={lic.state} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 0", borderBottom:`1px solid rgba(30,58,95,.25)` }}>
                <div style={{ width:36, height:36, borderRadius:8, background:`${uc}18`, border:`1px solid ${uc}44`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'JetBrains Mono',monospace", fontSize:11, fontWeight:800, color:uc, flexShrink:0 }}>{lic.abbr}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12.5, fontWeight:700, color:G.bright }}>{lic.state}</div>
                  <div style={{ fontSize:11, color:G.dim }}>{days}d · {fmtDate(lic.renewalDate)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
    if (activeTab === "moc") return (
      <div style={{ padding:12 }}>
        <div style={S.sectionHeading}>🏅 ABEM Summary</div>
        <div style={{ padding:8 }}>
          {ABEM_MOC.points.map(p => (
            <div key={p.type} style={{ marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                <span style={{ fontSize:11, color:G.text, fontWeight:700 }}>{p.type}</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:p.color }}>{p.earned}/{p.required||"+"}</span>
              </div>
              {p.required > 0 && (
                <div style={{ height:4, borderRadius:2, background:"rgba(30,58,95,.6)" }}>
                  <div style={{ height:"100%", borderRadius:2, background:p.color, width:`${Math.min(100,(p.earned/p.required)*100)}%` }}/>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
    return null;
  }

  const TABS = [
    { id:"modules", label:"📚 Modules" },
    { id:"tracker", label:"📊 Credit Tracker" },
    { id:"licenses", label:"📋 Licenses" },
    { id:"moc", label:"🏅 ABEM MOC" },
    { id:"news", label:"📰 CME News" },
  ];

  const showLeftPanel = activeTab !== "learn";

  return (
    <div style={{ fontFamily:"'DM Sans',system-ui,sans-serif", background:G.navy, minHeight:"100%", color:G.text, display:"flex", flexDirection:"column", position:"relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#2a4d72;border-radius:2px}
        @keyframes livePulse{0%,100%{box-shadow:0 0 0 0 rgba(46,204,113,.4)}50%{box-shadow:0 0 0 5px rgba(46,204,113,0)}}
      `}</style>
      <div style={{ position:"fixed", inset:0, background:`radial-gradient(ellipse 70% 50% at 8% 5%,rgba(0,168,150,.07),transparent 55%),radial-gradient(ellipse 55% 45% at 92% 92%,rgba(155,109,255,.05),transparent 50%)`, pointerEvents:"none", zIndex:0 }}/>

      {/* PAGE HEADER */}
      <div style={{ position:"relative", zIndex:1, padding:"14px 28px 10px", borderBottom:`1px solid rgba(30,58,95,.6)`, background:"rgba(11,29,53,.4)", display:"flex", alignItems:"center", justifyContent:"space-between", gap:16 }}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ width:46, height:46, background:"rgba(251,191,36,.1)", border:"1px solid rgba(251,191,36,.25)", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>🎓</div>
          <div>
            <div style={{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:22, fontWeight:700, color:G.bright }}>CME &amp; Learning Center</div>
            <div style={{ fontSize:12, color:G.dim, marginTop:2 }}>Case-Based Modules · Credit Tracking · License Renewal · ABEM MOC Documentation · CME-Eligible Literature</div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ background:G.panel, border:`1px solid ${G.border}`, borderRadius:10, padding:"8px 16px", textAlign:"center" }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:18, fontWeight:700, color:G.teal }}>{totalEarned.toFixed(1)}</div>
            <div style={{ fontSize:9.5, color:G.dim, fontWeight:700, textTransform:"uppercase", letterSpacing:".06em" }}>Credits Earned</div>
          </div>
          <div style={{ background:G.panel, border:`1px solid ${G.border}`, borderRadius:10, padding:"8px 16px", textAlign:"center" }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:18, fontWeight:700, color:nextRenewalDays ? urgencyColor(nextRenewalDays) : G.dim }}>{nextRenewalDays ? `${nextRenewalDays}d` : "—"}</div>
            <div style={{ fontSize:9.5, color:G.dim, fontWeight:700, textTransform:"uppercase", letterSpacing:".06em" }}>Next Renewal</div>
          </div>
          <button style={{ padding:"9px 18px", borderRadius:8, fontFamily:"inherit", fontSize:12, fontWeight:700, cursor:"pointer", display:"inline-flex", alignItems:"center", gap:6, background:"linear-gradient(135deg,#fbbf24,#d97706)", border:"none", color:"#1a1000" }} onClick={()=>setActiveTab("moc")}>🏅 ABEM MOC</button>
        </div>
      </div>

      {/* MAIN TABS */}
      <div style={{ position:"relative", zIndex:1, display:"flex", background:"rgba(11,29,53,.6)", borderBottom:`1px solid ${G.border}`, padding:"0 28px" }}>
        {TABS.map(t => (
          <button key={t.id}
            style={{ padding:"12px 18px", fontSize:12.5, fontWeight:700, cursor:"pointer", border:"none", background:"transparent", color:(activeTab===t.id||(t.id==="modules"&&activeTab==="learn"))?G.bright:G.dim, fontFamily:"inherit", borderBottom:`2px solid ${(activeTab===t.id||(t.id==="modules"&&activeTab==="learn"))?G.teal:"transparent"}`, transition:"all .15s" }}
            onClick={()=>setActiveTab(t.id)}>{t.label}
          </button>
        ))}
        {activeTab === "learn" && selectedModule && (
          <div style={{ marginLeft:"auto", alignSelf:"center", padding:"0 12px" }}>
            <span style={{ fontSize:11, fontWeight:700, color:G.teal, fontFamily:"'JetBrains Mono',monospace" }}>▶ Now: {selectedModule.title.slice(0,40)}…</span>
          </div>
        )}
      </div>

      {/* BODY */}
      <div style={{ position:"relative", zIndex:1, flex:1, display:"flex", overflow:"hidden", height:"calc(100vh - 200px)" }}>
        {showLeftPanel && (
          <div style={{ width:300, borderRight:`1px solid ${G.border}`, background:"rgba(11,29,53,.3)", display:"flex", flexDirection:"column", overflow:"auto", flexShrink:0 }}>
            <LeftPanel/>
          </div>
        )}
        <div style={{ flex:1, overflowY:"auto" }}>
          {activeTab === "learn" ? <ModuleViewer/> :
           activeTab === "tracker" ? <TrackerView/> :
           activeTab === "licenses" ? <LicenseView/> :
           activeTab === "moc" ? <MOCView/> :
           activeTab === "news" ? <NewsView/> : (
            <div style={{ padding:24 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
                <div style={{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:22, fontWeight:700, color:G.bright }}>CME Modules</div>
                <span style={{ fontSize:12, fontFamily:"'JetBrains Mono',monospace", color:G.dim }}>{filteredModules.length} modules</span>
              </div>
              {catFilter === "all" && !searchQ && (
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontSize:11, fontWeight:800, textTransform:"uppercase", letterSpacing:".07em", color:G.purple, marginBottom:10 }}>⭐ Featured This Month</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                    {filteredModules.filter(m=>m.featured).map(mod => <ModuleCard key={mod.id} mod={mod}/>)}
                  </div>
                </div>
              )}
              <div style={{ fontSize:11, fontWeight:800, textTransform:"uppercase", letterSpacing:".07em", color:G.dim, marginBottom:10 }}>
                {catFilter === "all" && !searchQ ? "All Modules" : `${filteredModules.length} results`}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                {(catFilter === "all" && !searchQ ? filteredModules.filter(m=>!m.featured) : filteredModules).map(mod => <ModuleCard key={mod.id} mod={mod}/>)}
              </div>
              {filteredModules.length === 0 && <div style={{ textAlign:"center", color:G.muted, fontSize:13, padding:"40px 0" }}>No modules match your filters.</div>}
            </div>
          )}
        </div>
      </div>

      {/* ACTION BAR */}
      <div style={{ position:"sticky", bottom:0, zIndex:10, height:60, background:"rgba(11,29,53,.97)", borderTop:`1px solid ${G.border}`, backdropFilter:"blur(16px)", padding:"0 28px", display:"flex", alignItems:"center", gap:12 }}>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11.5, color:G.dim }}>{CME_MODULES.length} modules · {totalEarned.toFixed(1)} credits earned · {completedModules.length} completed</span>
        <span style={{ fontSize:11, fontWeight:700, padding:"4px 12px", borderRadius:20, background:"rgba(251,191,36,.1)", border:"1px solid rgba(251,191,36,.25)", color:G.gold }}>🏅 ABEM Approved</span>
        <div style={{ flex:1 }}/>
        <button style={{ padding:"9px 18px", borderRadius:8, fontFamily:"inherit", fontSize:12, fontWeight:700, cursor:"pointer", display:"inline-flex", alignItems:"center", gap:6, background:"transparent", border:`1px solid ${G.border}`, color:G.text }} onClick={()=>setActiveTab("tracker")}>📊 View Transcript</button>
        <button style={{ padding:"9px 18px", borderRadius:8, fontFamily:"inherit", fontSize:12, fontWeight:700, cursor:"pointer", display:"inline-flex", alignItems:"center", gap:6, background:"linear-gradient(135deg,#9b6dff,#7c5cd6)", border:"none", color:"#fff" }} onClick={()=>showToast("MOC transcript exported for ABEM submission",G.purple)}>📥 Export MOC Report</button>
      </div>

      {/* CERTIFICATE MODAL */}
      {certModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.75)", backdropFilter:"blur(8px)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center" }} onClick={()=>setCertModal(null)}>
          <div style={{ background:G.slate, border:`1px solid ${G.border}`, borderRadius:18, width:620, maxHeight:"90vh", overflowY:"auto" }} onClick={e=>e.stopPropagation()}>
            <div style={{ padding:"18px 24px 14px", borderBottom:`1px solid ${G.border}`, display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:22 }}>🏆</span>
              <div style={{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:18, fontWeight:700, color:G.bright, flex:1 }}>Certificate of Completion</div>
              <button onClick={()=>setCertModal(null)} style={{ background:"none", border:"none", color:G.dim, fontSize:20, cursor:"pointer" }}>✕</button>
            </div>
            <div style={{ padding:"24px 28px", textAlign:"center" }}>
              <div style={{ fontSize:48, marginBottom:12 }}>🎓</div>
              <div style={{ fontSize:11, fontWeight:800, textTransform:"uppercase", letterSpacing:".12em", color:G.dim, marginBottom:6 }}>This certifies completion of</div>
              <div style={{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:18, fontWeight:700, color:G.bright, marginBottom:6, lineHeight:1.4 }}>{certModal.title}</div>
              <div style={{ width:60, height:2, background:G.teal, margin:"12px auto 18px" }}/>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:20 }}>
                {[["Credits",`${certModal.credits} AMA Cat. 1`,G.teal],["Accreditor",certModal.accreditor,G.blue],["Cert ID",certModal.certId||"NOTRYA-2024-0001",G.purple],["Date",fmtDate(certModal.completedDate||new Date().toISOString()),G.amber],["Difficulty",certModal.difficulty,G.rose],["Format",certModal.format,G.green]].map(([l,v,c])=>(
                  <div key={l} style={{ background:"rgba(22,45,79,.5)", borderRadius:9, padding:"10px 12px" }}>
                    <div style={{ fontSize:9, fontWeight:800, textTransform:"uppercase", letterSpacing:".07em", color:G.dim, marginBottom:3 }}>{l}</div>
                    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11.5, color:c, fontWeight:700 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding:"14px 24px", borderTop:`1px solid ${G.border}`, display:"flex", gap:8, justifyContent:"flex-end" }}>
              <button style={{ padding:"9px 18px", borderRadius:8, fontFamily:"inherit", fontSize:12.5, fontWeight:700, cursor:"pointer", background:"transparent", border:`1px solid ${G.border}`, color:G.text }} onClick={()=>setCertModal(null)}>Close</button>
              <button style={{ padding:"9px 18px", borderRadius:8, fontFamily:"inherit", fontSize:12.5, fontWeight:700, cursor:"pointer", background:"linear-gradient(135deg,#9b6dff,#7c5cd6)", border:"none", color:"#fff" }} onClick={()=>showToast("Submitted to ABEM MOC portal",G.purple)}>📤 Submit to ABEM</button>
              <button style={{ padding:"9px 18px", borderRadius:8, fontFamily:"inherit", fontSize:12.5, fontWeight:700, cursor:"pointer", background:"linear-gradient(135deg,#00d4bc,#00a896)", border:"none", color:"#fff" }} onClick={()=>{showToast("Certificate downloaded ✓",G.green);setCertModal(null);}}>📥 Download PDF</button>
            </div>
          </div>
        </div>
      )}

      {/* LLSA MODAL */}
      {llsaModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.75)", backdropFilter:"blur(8px)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center" }} onClick={()=>setLlsaModal(false)}>
          <div style={{ background:G.slate, border:`1px solid ${G.border}`, borderRadius:18, width:620, maxHeight:"90vh", overflowY:"auto" }} onClick={e=>e.stopPropagation()}>
            <div style={{ padding:"18px 24px 14px", borderBottom:`1px solid ${G.border}`, display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:22 }}>📖</span>
              <div style={{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:18, fontWeight:700, color:G.bright, flex:1 }}>LLSA Article Tracker</div>
              <button onClick={()=>setLlsaModal(false)} style={{ background:"none", border:"none", color:G.dim, fontSize:20, cursor:"pointer" }}>✕</button>
            </div>
            <div style={{ padding:"18px 22px" }}>
              <div style={{ fontSize:13, color:G.dim, marginBottom:16, lineHeight:1.7 }}>ACEP Lifelong Learning &amp; Self-Assessment articles must be read and tested annually as part of ABEM MOC Part I. 5 points per article, 30 points required per 3-year cycle.</div>
              {ABEM_MOC.llsaArticles.map((art,i)=>(
                <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 0", borderBottom:`1px solid rgba(30,58,95,.3)` }}>
                  <div style={{ width:32, height:32, borderRadius:"50%", background:art.completed?"rgba(46,204,113,.12)":"rgba(30,58,95,.5)", border:`1px solid ${art.completed?G.green:G.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 }}>
                    {art.completed ? "✓" : i+1}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:13, color:art.completed?G.bright:G.dim }}>{art.title}</div>
                    <div style={{ fontSize:11, color:G.muted, marginTop:2 }}>{art.year} · {art.credits} MOC Points{art.completed?` · ${fmtDate(art.date)}`:""}</div>
                  </div>
                  <button style={{ padding:"5px 12px", borderRadius:6, fontFamily:"inherit", fontSize:11, fontWeight:700, cursor:"pointer", background:art.completed?"rgba(46,204,113,.1)":"rgba(251,191,36,.1)", border:`1px solid ${art.completed?"rgba(46,204,113,.3)":"rgba(251,191,36,.3)"}`, color:art.completed?G.green:G.gold }}>
                    {art.completed?"✓ Done":"Start →"}
                  </button>
                </div>
              ))}
            </div>
            <div style={{ padding:"14px 24px", borderTop:`1px solid ${G.border}`, display:"flex", gap:8, justifyContent:"flex-end" }}>
              <button style={{ padding:"9px 18px", borderRadius:8, fontFamily:"inherit", fontSize:12.5, fontWeight:700, cursor:"pointer", background:"transparent", border:`1px solid ${G.border}`, color:G.text }} onClick={()=>setLlsaModal(false)}>Close</button>
              <button style={{ padding:"9px 18px", borderRadius:8, fontFamily:"inherit", fontSize:12.5, fontWeight:700, cursor:"pointer", background:"linear-gradient(135deg,#fbbf24,#d97706)", border:"none", color:"#1a1000" }} onClick={()=>{showToast("LLSA progress exported",G.gold);setLlsaModal(false);}}>📥 Export LLSA Report</button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div style={{ position:"fixed", bottom:80, right:24, zIndex:999 }}>
          <div style={{ background:G.panel, border:`1px solid ${G.border}`, borderLeft:`3px solid ${toast.color}`, borderRadius:10, padding:"11px 16px", fontSize:12.5, fontWeight:600, color:G.bright, boxShadow:"0 8px 24px rgba(0,0,0,.3)", minWidth:280 }}>{toast.msg}</div>
        </div>
      )}
    </div>
  );
}