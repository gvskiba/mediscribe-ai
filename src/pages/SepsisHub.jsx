import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import QuickOrderPanel, { useQuickOrder, QuickOrderButton } from './QuickOrderPanel';


const SepsisEntity    = base44.entities.SepsisBundle;
const HandoffEntity   = base44.entities.HandoffEntry;

// ── Fonts & CSS ───────────────────────────────────────────────────────────────
(() => {
  if (document.getElementById("sep-hub-css")) return;
  const l = document.createElement("link"); l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "sep-hub-css";
  s.textContent = `*{box-sizing:border-box;}
    @keyframes sIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
    @keyframes sSpin{to{transform:rotate(360deg)}}
    .sep-in{animation:sIn .18s ease both;}
    input::placeholder,textarea::placeholder{color:rgba(221,230,240,.18);}
    input:focus,textarea:focus,select:focus{border-color:rgba(0,229,192,.5)!important;outline:none;}
    select option{background:#07111f;}
    ::-webkit-scrollbar{width:3px;}
    ::-webkit-scrollbar-thumb{background:rgba(0,229,192,.2);border-radius:2px;}`;
  document.head.appendChild(s);
})();

// ── Tokens ────────────────────────────────────────────────────────────────────
const T = {
  bg:"#07111f", card:"rgba(255,255,255,0.04)", bdr:"rgba(255,255,255,0.08)",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6060", blue:"#3b9eff",
  orange:"#ff9f43", purple:"#9b6dff", green:"#3dffa0", red:"#ff4444",
  txt:"#dde6f0", mut:"rgba(221,230,240,0.55)", dim:"rgba(221,230,240,0.28)",
  mono:"'JetBrains Mono',monospace", sans:"'DM Sans',sans-serif", serif:"'Playfair Display',serif",
};

// ── Style Helpers ─────────────────────────────────────────────────────────────
const gl   = (x={}) => ({backdropFilter:"blur(14px)",background:T.card,border:`1px solid ${T.bdr}`,borderRadius:12,...x});
const tg   = (c,x={}) => ({borderRadius:6,padding:"3px 9px",fontSize:10,fontWeight:700,background:`${c}18`,border:`1px solid ${c}30`,color:c,...x});
const aBox = (c,mb=10) => ({background:`${c}12`,border:`1px solid ${c}40`,borderRadius:10,padding:"9px 13px",marginBottom:mb});
const btn  = (c,x={}) => ({padding:"7px 16px",borderRadius:9,cursor:"pointer",border:`1px solid ${c}55`,background:`${c}18`,color:c,fontFamily:T.sans,fontSize:12,fontWeight:600,transition:"all .15s",...x});
const chip = (c,on) => ({padding:"6px 13px",borderRadius:8,border:`1.5px solid ${on?c:T.bdr}`,background:on?`${c}20`:T.card,color:on?c:T.mut,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:T.sans,transition:"all .15s"});
const sL   = (c=T.teal) => ({fontSize:9,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:c,margin:"15px 0 9px",display:"flex",alignItems:"center",gap:8});
const nb   = (c=T.teal) => ({width:26,height:26,borderRadius:"50%",background:`${c}22`,border:`1.5px solid ${c}55`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:c,flexShrink:0});

// ── Antibiotic Source Data ────────────────────────────────────────────────────
const SOURCES = [
  {id:"empiric", label:"Unknown / Empiric", icon:"❓", color:"#3b9eff",
   orgs:"Gram-positive, Gram-negative, anaerobes — source unknown",
   regimens:[
     {name:"Standard Empiric", tier:"first",
      first:"Pip-tazo 4.5g IV q6–8h (extended infusion preferred)",
      alt:"+ Vancomycin 25–30 mg/kg IV load if any MRSA risk factor present",
      note:"MRSA risk: prior MRSA, healthcare contact, IVDU, skin/soft tissue source",
      deesc:"Narrow at 48–72h. Remove vancomycin if MRSA cultures negative."},
     {name:"Severe PCN Allergy", tier:"allergy",
      first:"Aztreonam 2g IV q8h + Vancomycin 25–30 mg/kg IV + Metronidazole 500mg IV q8h",
      alt:null,
      note:"Aztreonam: Gram-neg only. Vancomycin: Gram-pos. Metronidazole: anaerobes.",
      deesc:"Narrow early — triple therapy carries significant toxicity burden."},
   ],
   deesc:["Antibiotic timeout at 48–72h — narrow or stop","Remove vancomycin if MRSA cultures negative","Culture-negative at 72h + clinically improving → consider stopping"]},

  {id:"cap", label:"Pneumonia (CAP)", icon:"🫁", color:"#3b9eff",
   orgs:"S. pneumoniae, H. influenzae, Mycoplasma, Legionella",
   regimens:[
     {name:"Inpatient Non-ICU", tier:"first",
      first:"Ceftriaxone 2g IV q24h + Azithromycin 500mg IV/PO q24h",
      alt:"Levofloxacin 750mg IV/PO q24h — PCN allergy or macrolide contraindicated",
      note:"Legionella urine antigen if severe — 70–90% sensitivity for serogroup 1",
      deesc:"5 days if good response. Oral step-down when afebrile × 24h."},
     {name:"Severe CAP — ICU", tier:"first",
      first:"Ceftriaxone 2g IV q24h + Azithromycin 500mg IV (or Levofloxacin 750mg IV)",
      alt:"+ Vancomycin if: cavitary/necrotizing pneumonia, recent influenza, IVDU",
      note:"5–7 days duration. Narrow based on Legionella and pneumococcal antigen results.",
      deesc:"Shorten to 5 days on rapid clinical response. Narrow on antigen/culture data."},
   ],
   deesc:["Afebrile × 48h + WBC trending down","Tolerating oral + SpO₂ stable ≤ 2L NC","Antigen testing guides narrowing","5-day course standard for good responders"]},

  {id:"hap", label:"Pneumonia (HAP/VAP)", icon:"🏥", color:"#9b6dff",
   orgs:"Pseudomonas, Klebsiella (ESBL), Acinetobacter, MRSA — MDR organisms likely",
   regimens:[
     {name:"HAP — No MDR Risk Factors", tier:"first",
      first:"Pip-tazo 4.5g IV q6h (ext. infusion) OR Cefepime 2g IV q8h",
      alt:"+ Vancomycin if MRSA risk: prior MRSA, NARES+, IV vancomycin in past 90 days",
      note:"MDR risk: IV abx in 90 days, structural lung disease, known MDR colonization",
      deesc:"7 days for HAP. De-escalate on cultures at 48–72h. NARES negative → stop vancomycin."},
     {name:"VAP / High MDR Risk", tier:"first",
      first:"Vancomycin AUC-guided OR Linezolid 600mg IV q12h + Cefepime 2g q8h OR Pip-tazo 4.5g q6h",
      alt:"Linezolid preferred for MRSA pneumonia — superior lung penetration vs. vancomycin",
      note:"Dual Pseudomonal coverage only if prior Pseudomonas + severely ill — not routine",
      deesc:"De-escalate to one anti-pseudomonal at 48–72h per cultures. 7-day course."},
   ],
   deesc:["MRSA NARES negative at 48h → stop MRSA coverage","7-day course equivalent to longer for most","Serial procalcitonin decline >80% supports stopping"]},

  {id:"uti", label:"Urosepsis / UTI", icon:"🫘", color:"#00e5c0",
   orgs:"E. coli, Klebsiella, Proteus, Enterococcus, Pseudomonas (catheter-associated)",
   regimens:[
     {name:"Community-Onset", tier:"first",
      first:"Ceftriaxone 2g IV q24h",
      alt:"Avoid FQ empirically — 30–40% community resistance. Confirm susceptibility before use.",
      note:"Remove or replace Foley catheter if CAUTI — significantly reduces bacterial burden",
      deesc:"Narrow to oral per cultures. 7 days bacteremic, 5 days uncomplicated pyelo."},
     {name:"ESBL Risk / Healthcare-Associated", tier:"first",
      first:"Ertapenem 1g IV q24h (low Pseudo risk) OR Meropenem 1g IV q8h (Pseudo risk)",
      alt:"PCN allergy: Aztreonam 2g IV q8h (Gram-neg) OR Ciprofloxacin if susceptibility confirmed",
      note:"ESBL risk: prior ESBL, recent hospitalization, FQ/cephalosporin exposure in 90 days",
      deesc:"Oral step-down: TMP-SMX or nitrofurantoin (lower UTI only) per susceptibilities."},
   ],
   deesc:["Cultures + sensitivities at 48–72h → narrow","Afebrile + stable → transition to oral","Remove or replace Foley if CAUTI","7d bacteremic, 5d uncomplicated pyelo, 14d complicated"]},

  {id:"ssti", label:"Skin & Soft Tissue", icon:"🩹", color:"#ff9f43",
   orgs:"Group A Strep, S. aureus (MRSA in abscesses), mixed flora (NF)",
   regimens:[
     {name:"Non-Purulent Cellulitis", tier:"first",
      first:"Cefazolin 2g IV q8h OR Ceftriaxone 2g IV q24h",
      alt:"MRSA coverage NOT routine for non-purulent — Streptococcus is primary etiology",
      note:"Add vancomycin only if systemic illness, failure to improve at 48h, or MRSA risk",
      deesc:"Oral step-down: cephalexin or dicloxacillin. Duration 5–7 days."},
     {name:"Necrotizing Fasciitis", tier:"critical",
      first:"Vancomycin 25–30 mg/kg IV + Pip-tazo 4.5g IV q6h + Clindamycin 900mg IV q8h",
      alt:"Clindamycin: anti-toxin effect — inhibits exotoxin production in streptococcal NF",
      note:"⚠ SURGICAL EMERGENCY — immediate OR. Antibiotics adjunctive. LRINEC ≥ 6 = high risk. Do NOT delay OR for imaging.",
      deesc:"Continue broad coverage until surgical source control. Narrow per OR cultures."},
   ],
   deesc:["Erythema margins stable or receding","Oral step-down when afebrile + tolerating intake","5–7d non-purulent, 5d purulent post-I&D","I&D is primary treatment for abscess"]},

  {id:"iai", label:"Intra-abdominal", icon:"🫀", color:"#ff6060",
   orgs:"E. coli, Klebsiella, Enterococcus, Bacteroides fragilis, anaerobes",
   regimens:[
     {name:"Community-Acquired (Mild–Moderate)", tier:"first",
      first:"Ceftriaxone 2g IV q24h + Metronidazole 500mg IV q8h",
      alt:"Severe PCN allergy: Aztreonam 2g IV q8h + Metronidazole 500mg IV q8h",
      note:"Metronidazole mandatory — cephalosporin monotherapy lacks anaerobic coverage",
      deesc:"4 days after adequate source control (Sawyer 2015). Oral: amox-clav or Cipro + Metro."},
     {name:"Healthcare-Associated / Severe / Cholangitis", tier:"first",
      first:"Pip-tazo 4.5g IV q6h (extended infusion) OR Meropenem 1g IV q8h (ESBL risk)",
      alt:"Cholangitis: Pip-tazo preferred — covers Enterococcus, Gram-neg, and anaerobes",
      note:"High severity: APACHE ≥ 15, diffuse peritonitis, delay to source control > 24h",
      deesc:"4–7 days after source control. Biliary: ERCP or PTC decompression is primary intervention."},
   ],
   deesc:["Source control first (surgery, drainage, ERCP)","4 days after adequate source control — Sawyer 2015","Oral step-down: amox-clav or Cipro + Metro"]},

  {id:"meningitis", label:"Meningitis", icon:"🧠", color:"#9b6dff",
   orgs:"S. pneumoniae, N. meningitidis, Listeria (>50y or immunocomp.), GBS",
   critical:"DO NOT DELAY antibiotics. Give BEFORE CT if LP is delayed. Time to antibiotics is the single most important outcome determinant.",
   regimens:[
     {name:"Adult Empiric", tier:"first",
      first:"Ceftriaxone 2g IV q12h + Vancomycin 25–30 mg/kg IV + Ampicillin 2g IV q4h (if >50 or immunocomp.)",
      alt:"Dexamethasone 0.15 mg/kg IV q6h × 4 days — give BEFORE or WITH first antibiotic dose",
      note:"⚠ Dexamethasone must precede first abx — reduces mortality and neurologic sequelae for S. pneumo",
      deesc:"Narrow per CSF cultures. Duration: S. pneumo 10–14d, N. meningitidis 7d, Listeria 21d."},
     {name:"Severe PCN Allergy", tier:"allergy",
      first:"Meropenem 2g IV q8h + Vancomycin 25–30 mg/kg IV + Dexamethasone 0.15 mg/kg IV q6h × 4 days",
      alt:"Meropenem: no PCN cross-reactivity — reliable CNS penetration",
      note:"Give dexamethasone with or before first antibiotic dose",
      deesc:"Narrow to targeted agent once CSF cultures and sensitivities are finalized."},
   ],
   deesc:["CSF Gram stain positive → narrow immediately","CSF cultures final → definitive narrowing","7d N. meningitidis, 10–14d S. pneumo, 21d Listeria"]},

  {id:"endo", label:"Endocarditis", icon:"❤️", color:"#ff4444",
   orgs:"S. aureus (MRSA), Viridans strep, Enterococcus, HACEK, CoNS (prosthetic valve)",
   critical:"Blood cultures × 3 BEFORE antibiotics if hemodynamically stable. ID + Cardiology consultation mandatory for all cases.",
   regimens:[
     {name:"Native Valve (Empiric)", tier:"first",
      first:"Vancomycin 25–30 mg/kg IV load (AUC-guided, target AUC/MIC 400–600) + Ceftriaxone 2g IV q24h",
      alt:"MSSA confirmed → switch to Nafcillin or Oxacillin — superior efficacy to vancomycin for MSSA IE",
      note:"Obtain ≥ 3 blood culture sets at separate sites BEFORE starting if hemodynamically stable",
      deesc:"Narrow per blood cultures. Duration: 4–6 weeks NVE, 6 weeks PVE."},
     {name:"Prosthetic Valve", tier:"first",
      first:"Vancomycin AUC-guided + Gentamicin 1 mg/kg IV q8h + Rifampin 300mg PO/IV q8h",
      alt:"Start rifampin after bacteremia clears — risk of resistance if started while bacteremic",
      note:"⚠ Very high mortality. Urgent cardiac surgery consultation. ID co-management mandatory.",
      deesc:"6 weeks minimum. ID mandatory throughout entire course."},
   ],
   deesc:["≥ 3 blood cultures BEFORE antibiotics if stable","MSSA: switch to nafcillin/oxacillin — superior to vancomycin","ID + cardiology co-management mandatory","4–6 weeks NVE, 6 weeks PVE minimum"]},

  {id:"neutropenic", label:"Neutropenic Fever", icon:"🩸", color:"#f5c842",
   orgs:"Gram-neg rods (Pseudomonas), S. aureus, CoNS, Candida — ANC < 500",
   regimens:[
     {name:"High-Risk Febrile Neutropenia (MASCC < 21)", tier:"first",
      first:"Cefepime 2g IV q8h OR Pip-tazo 4.5g IV q6h OR Meropenem 1g IV q8h (ESBL risk)",
      alt:"+ Vancomycin if: hemodynamic instability, MRSA colonization, catheter/skin source, mucositis",
      note:"Do NOT use ceftriaxone — inadequate Pseudomonas coverage. Admission mandatory for high-risk.",
      deesc:"Continue until ANC ≥500 × 2 days AND afebrile × 48h. Remove vancomycin if cultures negative at 48–72h."},
     {name:"Persistent Fever Day 4–7 — Add Antifungal", tier:"first",
      first:"Micafungin 100mg IV q24h OR Liposomal Amphotericin B 3 mg/kg IV q24h (mold risk)",
      alt:"Micafungin preferred — fewer drug interactions vs. azoles",
      note:"Empiric antifungal after 4–7 days of antibacterial therapy without source or defervescence",
      deesc:"Continue through neutrophil recovery. Stop if galactomannan negative and no fungal evidence."},
   ],
   deesc:["ANC ≥500 × 2 consecutive days","Afebrile × 48h","Remove vancomycin if cultures negative at 48–72h","Persistent fever >4 days → add empiric antifungal"]},
];

// ── Bundle Tracker Data ───────────────────────────────────────────────────────
const BUNDLE_ITEMS = [
  {id:"cultures", label:"Blood Cultures", icon:"🩸", desc:"≥2 sets before antibiotics · Don't delay Abx >45 min", target:60},
  {id:"lactate",  label:"Lactate",        icon:"🔬", desc:"Venous OK · Repeat at 2h/4h/6h if > 2 mmol/L",        target:60},
  {id:"abx",      label:"Antibiotics",    icon:"💊", desc:"Broad-spectrum IV — ≤1h shock, ≤3h possible sepsis",   target:60},
  {id:"fluids",   label:"IV Crystalloid", icon:"💧", desc:"30 mL/kg LR or Plasma-Lyte · Reassess after 1st liter", target:180},
];

const ABX_OPTS = [
  "Pip-Tazo 4.5g IV q6h","Pip-Tazo 4.5g + Vancomycin","Cefepime 2g IV q8h",
  "Cefepime 2g + Vancomycin","Meropenem 1g IV q8h","Meropenem + Vancomycin",
  "Ceftriaxone 2g IV","Ceftriaxone 2g + Azithromycin 500mg","Other (see notes)",
];

// ── Vasopressor Data ──────────────────────────────────────────────────────────
const PRESSOR_STEPS = [
  {step:1,drug:"NOREPINEPHRINE",dose:"0.05 – 0.5 mcg/kg/min",color:"#ff6060",bg:"rgba(255,96,96,0.10)",
   trigger:"1st line — MAP < 65 despite adequate fluids",titrate:"Titrate to MAP ≥ 65 mmHg",
   qopSeed:{medication:"Norepinephrine",dose:"0.05-0.5 mcg/kg/min",route:"IV infusion",frequency:"continuous",indication:"Septic shock — vasopressor support"}},
  {step:2,drug:"+ VASOPRESSIN",dose:"0.03 – 0.04 U/min (fixed dose)",color:"#f5c842",bg:"rgba(245,200,66,0.10)",
   trigger:"Add if NE > 0.25 mcg/kg/min",titrate:"Recheck MAP 15 – 30 min before adding step 3",
   qopSeed:{medication:"Vasopressin",dose:"0.03 units/min fixed",route:"IV infusion",frequency:"continuous",indication:"Septic shock — adjunct vasopressor"}},
  {step:3,drug:"+ EPINEPHRINE",dose:"0.01 – 0.5 mcg/kg/min",color:"#ff9f43",bg:"rgba(255,159,67,0.10)",
   trigger:"Add if MAP falling on dual-agent therapy",titrate:"Alt: Angiotensin II 20 – 200 ng/kg/min",
   qopSeed:{medication:"Epinephrine",dose:"0.01-0.5 mcg/kg/min",route:"IV infusion",frequency:"continuous",indication:"Septic shock — refractory vasopressor"}},
];

// ── Tracker Utilities ─────────────────────────────────────────────────────────
const toHHMM  = d => d ? `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}` : "";
const nowHHMM = () => toHHMM(new Date());
const diffMin = (a,b) => (!a||!b) ? null : Math.round((b-a)/60000);
const fmtMin  = n => n===null ? "—" : n<60 ? `${n}m` : `${Math.floor(n/60)}h ${n%60}m`;
const Spin    = () => <span style={{display:"inline-block",width:11,height:11,border:"2px solid rgba(0,229,192,.15)",borderTopColor:"#00e5c0",borderRadius:"50%",animation:"sSpin .7s linear infinite"}}/>;

// ── Component ─────────────────────────────────────────────────────────────────
export default function SepsisHub({allergies=[],medications=[],pmhSelected=[],vitals={},cc=""}) {
  const navigate = useNavigate();
  const { activeOrder, openOrder, closeOrder } = useQuickOrder();

  // Tab & shared UI
  const [tab,      setTab]     = useState(0);
  const [lactate,  setLactate] = useState(null);
  const [vasStep,  setVasStep] = useState(1);

  // ABX tab
  const [src,      setSrc]     = useState(null);
  const [openRegs, setOpenRegs]= useState({});

  // Bundle Tracker
  const [recogTime, setRecogTime]= useState(nowHHMM());
  const [recogSet,  setRecogSet] = useState(false);
  const [stamps,    setStamps]   = useState({});
  const [lactateVal,setLactateVal]= useState("");
  const [mapVal,    setMapVal]   = useState("");
  const [fluidVol,  setFluidVol] = useState("");
  const [abxSel,    setAbxSel]   = useState("");
  const [vasoReq,   setVasoReq]  = useState(false);
  const [vasoSel,   setVasoSel]  = useState("");
  const [vasoTime,  setVasoTime] = useState(null);
  const [repeatLac, setRepeatLac]= useState(null);
  const [disposition,setDispo]   = useState("");
  const [provider,  setProvider] = useState("");
  const [tNotes,    setTNotes]   = useState("");
  const [saving,        setSaving]       = useState(false);
  const [saved,         setSaved]        = useState(false);
  const [savingHandoff, setSavingHandoff]= useState(false);
  const [savedHandoff,  setSavedHandoff] = useState(false);
  const [toast,         setToast]        = useState(null);
  const [now,       setNow]      = useState(new Date());
  const timerRef = useRef(null);

  // 15-second clock tick for elapsed time display
  useEffect(() => {
    timerRef.current = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(timerRef.current);
  }, []);

  const TABS = ["Hour-1 Bundle","Antibiotics","Bundle Tracker","POCUS","Vasopressors"];

  // PCN allergy auto-detection from encounter allergies prop
  const penAllergy = useMemo(() => {
    const all = (allergies||[]).map(a => (typeof a==="string"?a:a.name||"").toLowerCase());
    return all.some(a =>
      a.includes("penicillin")||a.includes("amoxicillin")||
      a.includes("ampicillin")||a.includes("piperacillin")||a.includes("augmentin")
    );
  }, [allergies]);

  const selSrc = SOURCES.find(s => s.id===src);

  // Recognition time as a Date object
  const recogDate_ = useMemo(() => {
    if (!recogSet) return null;
    const [h,m] = recogTime.split(":").map(Number);
    const d = new Date(); d.setHours(h,m,0,0); return d;
  }, [recogSet, recogTime]);

  const shockCriteria = parseFloat(lactateVal)>=4 || (!!mapVal && parseFloat(mapVal)<65);

  // SEP-1 compliance calculation — recomputes when stamps, clock, or shock status changes
  const compliance = useMemo(() => {
    if (!recogDate_) return null;
    const shock = parseFloat(lactateVal)>=4 || (!!mapVal && parseFloat(mapVal)<65);
    const results = BUNDLE_ITEMS.map(el => {
      const t = stamps[el.id];
      if (!t) return {id:el.id, status:"missing", mins:null};
      const mins = diffMin(recogDate_, t);
      return {id:el.id, status:mins<=(shock?60:el.target)?"on_time":"late", mins};
    });
    return {results, compliant:results.every(r => r.status==="on_time")};
  }, [stamps, recogDate_, lactateVal, mapVal]);

  // Select source: auto-expand critical-tier regimens on entry
  const selectSrc = id => {
    if (src===id) { setSrc(null); setOpenRegs({}); return; }
    setSrc(id);
    const s = SOURCES.find(x => x.id===id);
    const init = {};
    if (s) s.regimens.forEach((r,i) => { if (r.tier==="critical") init[`${id}-${i}`]=true; });
    setOpenRegs(init);
  };

  const toggleReg  = key => setOpenRegs(p => ({...p,[key]:!p[key]}));
  const stampEl    = id  => { if (!recogSet) return; setStamps(p => ({...p,[id]:new Date()})); };
  const unstampEl  = id  => setStamps(p => ({...p,[id]:null}));
  const showToast  = (msg,c=T.green) => { setToast({msg,c}); setTimeout(()=>setToast(null),3000); };

  const handleSave = async () => {
    if (!recogDate_) return;
    setSaving(true);
    try {
      await SepsisEntity.create({
        encounter_date:     new Date().toISOString().slice(0,10),
        recognition_time:   recogTime,
        cultures_time:      stamps.cultures  ? toHHMM(stamps.cultures)  : null,
        cultures_minutes:   diffMin(recogDate_, stamps.cultures),
        lactate_time:       stamps.lactate   ? toHHMM(stamps.lactate)   : null,
        lactate_minutes:    diffMin(recogDate_, stamps.lactate),
        lactate_value:      lactateVal ? parseFloat(lactateVal) : null,
        antibiotics_time:   stamps.abx    ? toHHMM(stamps.abx)    : null,
        antibiotics_minutes:diffMin(recogDate_, stamps.abx),
        antibiotic_selected:abxSel,
        fluids_time:        stamps.fluids ? toHHMM(stamps.fluids) : null,
        fluids_minutes:     diffMin(recogDate_, stamps.fluids),
        fluids_volume_ml:   fluidVol ? parseFloat(fluidVol) : null,
        map_on_arrival:     mapVal   ? parseFloat(mapVal)   : null,
        vasopressor_required:vasoReq,
        vasopressor_agent:  vasoSel,
        vasopressor_time:   vasoTime   ? toHHMM(vasoTime)   : null,
        lactate_repeat_time:repeatLac  ? toHHMM(repeatLac)  : null,
        septic_shock:       shockCriteria,
        sep1_compliant:     compliance?.compliant || false,
        disposition,
        provider_name:      provider,
        compliance_notes:   tNotes,
      });
      setSaved(true);
      showToast("✓ Bundle saved to quality log");
    } catch(e) { showToast("Save failed — "+e.message, T.coral); }
    setSaving(false);
  };

  const buildIPASS = () => {
    const shock = shockCriteria ? "SEPTIC SHOCK" : "Sepsis";
    const lacStr = lactateVal ? `Lactate ${lactateVal} mmol/L` : "Lactate pending";
    const mapStr = mapVal ? `MAP ${mapVal} mmHg` : "MAP not recorded";
    const abxStr = abxSel || "Antibiotics given (see chart)";
    const bundleSummary = BUNDLE_ITEMS.map(el => {
      const t = stamps[el.id];
      const mins = t && recogDate_ ? diffMin(recogDate_, t) : null;
      return `  • ${el.label}: ${t ? toHHMM(t) + (mins !== null ? ` (${fmtMin(mins)})` : "") : "Pending"}`;
    }).join("\n");
    const sep1Status = compliance ? (compliance.compliant ? "SEP-1 COMPLIANT" : "SEP-1 INCOMPLETE") : "SEP-1 tracking not started";
    const vasoStr = vasoReq ? `Vasopressor: ${vasoSel || "required"} initiated ${vasoTime ? toHHMM(vasoTime) : "time pending"}` : "No vasopressor required";
    const dispoStr = disposition ? `Disposition: ${disposition}` : "Disposition: Pending";

    return [
      `I — ILLNESS SEVERITY: ${shock} | ${lacStr} | ${mapStr}`,
      `P — PATIENT SUMMARY: Sepsis patient managed per SSC Hour-1 Bundle. ${abxStr}.`,
      `A — ACTION LIST (Bundle Elements):\n${bundleSummary}`,
      `S — SITUATION AWARENESS: ${sep1Status}. ${vasoStr}. ${dispoStr}.`,
      `S — SYNTHESIS BY RECEIVER: [To be completed by receiving provider]`,
      tNotes ? `\nCompliance Notes: ${tNotes}` : "",
      provider ? `\nProvider: ${provider}` : "",
    ].filter(Boolean).join("\n\n");
  };

  const handleSaveHandoff = async () => {
    setSavingHandoff(true);
    try {
      await HandoffEntity.create({
        ipass:         buildIPASS(),
        worry:         shockCriteria,
        worry_reason:  shockCriteria ? "Septic shock — hemodynamically unstable" : "",
        pending_items: BUNDLE_ITEMS
          .filter(el => !stamps[el.id])
          .map(el => el.label)
          .join(", ") || "All bundle elements complete",
      });
      setSavedHandoff(true);
      showToast("✓ Saved to Handoff", T.teal);
    } catch(e) { showToast("Handoff save failed — " + e.message, T.coral); }
    setSavingHandoff(false);
  };

  const lacMeta = {
    low: {label:"< 2 mmol/L",   color:T.green, action:"Monitor · No immediate resuscitation required"},
    mid: {label:"2 – 4 mmol/L", color:T.gold,  action:"Resuscitate · Repeat lactate q2h · Target ≥ 10% ↓ at 2h"},
    high:{label:"≥ 4 mmol/L",   color:T.coral, action:"30 mL/kg IVF aggressively · Target ≥ 10% ↓ at 2h · High mortality risk"},
  };

  // ── TAB 0 — Hour-1 Bundle ──────────────────────────────────────────────────
  const Tab0 = (
    <div>
      <div style={aBox(T.coral,14)}>
        <span style={{fontSize:12,fontWeight:700,color:T.coral}}>⏱ Time-Critical </span>
        <span style={{fontSize:11.5,color:T.mut}}>Abx ≤ 1h if SHOCK or DEFINITE sepsis · ≤ 3h if POSSIBLE sepsis · Initiate all elements in parallel</span>
      </div>

      <div style={sL()}><span style={tg(T.teal)}>TAKE 3</span> What you measure</div>

      <div style={{...gl({padding:"12px 14px",marginBottom:8}),display:"flex",gap:11,alignItems:"flex-start"}}>
        <div style={nb()}>1</div>
        <div>
          <div style={{fontSize:13,fontWeight:700,marginBottom:3}}>Blood Cultures</div>
          <div style={{fontSize:11.5,color:T.mut,lineHeight:1.55}}>× 2 sets (aerobic + anaerobic) · Draw <em>before</em> antibiotics<br/><span style={{color:T.coral}}>Don't delay Abx &gt; 45 min waiting for cultures</span></div>
        </div>
      </div>

      <div style={{...gl({padding:"12px 14px",marginBottom:8})}}>
        <div style={{display:"flex",gap:11,alignItems:"flex-start",marginBottom:9}}>
          <div style={nb()}>2</div>
          <div><div style={{fontSize:13,fontWeight:700,marginBottom:3}}>Lactate</div><div style={{fontSize:11.5,color:T.mut}}>Venous OK · Repeat at 2h / 4h / 6h if &gt; 2 mmol/L</div></div>
        </div>
        <div style={{display:"flex",gap:6}}>
          {[{k:"low",l:"< 2",c:T.green},{k:"mid",l:"2 – 4",c:T.gold},{k:"high",l:"≥ 4",c:T.coral}].map(({k,l,c})=>(
            <button key={k} style={{...chip(c,lactate===k),flex:1}} onClick={()=>setLactate(lactate===k?null:k)}>{l}</button>
          ))}
        </div>
        {lactate && (
          <div style={{...aBox(lacMeta[lactate].color,0),marginTop:9}}>
            <div style={{fontSize:11.5,fontWeight:700,color:lacMeta[lactate].color}}>{lacMeta[lactate].label}</div>
            <div style={{fontSize:11.5,color:T.mut,marginTop:2}}>{lacMeta[lactate].action}</div>
          </div>
        )}
      </div>

      <div style={{...gl({padding:"12px 14px",marginBottom:16}),display:"flex",gap:11,alignItems:"flex-start"}}>
        <div style={nb()}>3</div>
        <div><div style={{fontSize:13,fontWeight:700,marginBottom:3}}>Urine Output</div><div style={{fontSize:11.5,color:T.mut}}>Monitor q1h · Target <span style={{fontFamily:T.mono,color:T.teal}}>≥ 0.5 mL/kg/h</span> · Consider Foley if not already placed</div></div>
      </div>

      <div style={sL()}><span style={tg(T.gold)}>GIVE 3</span> What you administer</div>

      <div style={{...gl({padding:"12px 14px",marginBottom:8}),display:"flex",gap:11,alignItems:"flex-start"}}>
        <div style={nb(T.blue)}>4</div>
        <div><div style={{fontSize:13,fontWeight:700,marginBottom:3}}>Oxygen</div><div style={{fontSize:11.5,color:T.mut,lineHeight:1.55}}>Target SpO₂ <span style={{fontFamily:T.mono,color:T.blue}}>≥ 94%</span><br/><span style={{color:T.gold}}>88 – 92% if COPD or hypercapnic respiratory failure</span></div></div>
      </div>

      <div style={{...gl({padding:"12px 14px",marginBottom:8}),display:"flex",gap:11,alignItems:"flex-start"}}>
        <div style={nb(T.blue)}>5</div>
        <div><div style={{fontSize:13,fontWeight:700,marginBottom:3}}>IV Crystalloid</div><div style={{fontSize:11.5,color:T.mut,lineHeight:1.55}}>Balanced solution: LR or Plasma-Lyte preferred<br/><span style={{fontFamily:T.mono,color:T.blue}}>30 mL/kg</span> over 3h · Reassess after 1st liter<br/><span style={{color:T.gold}}>Stop if B-lines on POCUS or signs of fluid overload</span></div></div>
      </div>

      <div style={{...gl({padding:"12px 14px",marginBottom:16}),display:"flex",gap:11,alignItems:"flex-start"}}>
        <div style={nb(T.blue)}>6</div>
        <div style={{flex:1}}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:3}}>IV Antibiotics</div>
          <div style={{fontSize:11.5,color:T.mut,lineHeight:1.55,marginBottom:10}}><span style={{color:T.coral,fontWeight:600}}>≤ 1h</span> if SHOCK · <span style={{color:T.gold,fontWeight:600}}>≤ 3h</span> if possible sepsis<br/>Severe PCN allergy → aztreonam + vancomycin</div>
          <button style={btn(T.teal)} onClick={()=>setTab(1)}>Source-Specific ABX →</button>
        </div>
      </div>

      <div style={sL()}><span style={tg(T.purple)}>ADJUNCTS</span></div>
      {[
        {n:7,c:T.purple,title:"POCUS",         sub:"Fluid responsiveness · Cardiac / IVC / Lung",        go:()=>setTab(3),label:"Open →"},
        {n:8,c:T.gold,  title:"Source Control", sub:"CT / US ASAP · Surgery or IR for abscess, perf, NF\n4 Ps: Phlegm · Pee · Pus · PICC",go:null,label:null},
        {n:9,c:T.coral, title:"IF SHOCK",       sub:"MAP < 65 despite fluids → start vasopressor ladder", go:()=>setTab(4),label:"Ladder →",urgent:true},
      ].map(({n,c,title,sub,go,label,urgent})=>(
        <div key={n} style={{...gl({padding:"12px 14px",marginBottom:8,...(urgent?{background:"rgba(255,96,96,0.06)",border:`1px solid rgba(255,96,96,0.22)`}:{})})}}>
          <div style={{display:"flex",gap:11,alignItems:"flex-start"}}>
            <div style={nb(c)}>{n}</div>
            <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,marginBottom:3}}>{title}</div><div style={{fontSize:11.5,color:T.mut,whiteSpace:"pre-line",lineHeight:1.55}}>{sub}</div></div>
            {go && <button style={btn(c,{padding:"5px 12px",fontSize:11,flexShrink:0})} onClick={go}>{label}</button>}
          </div>
        </div>
      ))}
    </div>
  );

  // ── TAB 1 — Antibiotics ────────────────────────────────────────────────────
  const Tab1 = (
    <div>
      {penAllergy && (
        <div style={aBox(T.coral,10)}>
          <span style={{fontWeight:700,color:T.coral}}>⛔ PCN Allergy Detected </span>
          <span style={{fontSize:11,color:T.mut}}>Allergy-tier regimens highlighted below. Verify severity — rash vs. anaphylaxis determines cephalosporin safety (&lt;2% cross-reactivity for non-anaphylaxis).</span>
        </div>
      )}
      <div style={aBox(T.gold,12)}>
        <span style={{fontWeight:700,color:T.gold}}>Timing: </span>
        <span style={{fontSize:11.5,color:T.mut}}>SHOCK / Definite → <span style={{color:T.coral,fontWeight:600}}>≤ 1h</span>{" · "}Possible → <span style={{color:T.green,fontWeight:600}}>≤ 3h</span>{" · "}De-escalate at 48–72h antibiotic timeout</span>
      </div>

      <div style={sL()}>Select Infection Source</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>
        {SOURCES.map(s=>(
          <button key={s.id} onClick={()=>selectSrc(s.id)}
            style={{display:"flex",alignItems:"center",gap:5,padding:"6px 13px",borderRadius:20,border:`1px solid ${src===s.id?s.color+"77":s.color+"33"}`,background:src===s.id?`${s.color}18`:`${s.color}08`,color:src===s.id?s.color:T.mut,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:T.sans,transition:"all .12s"}}>
            <span>{s.icon}</span><span>{s.label}</span>
          </button>
        ))}
      </div>

      {!selSrc ? (
        <div style={{...gl({padding:"40px 20px",textAlign:"center"})}}>
          <div style={{fontSize:32,marginBottom:8}}>💊</div>
          <div style={{color:T.mut,fontSize:13}}>Select an infection source above to view empiric regimens</div>
        </div>
      ) : (
        <div className="sep-in">
          <div style={{...gl({padding:"12px 14px",marginBottom:10,border:`1px solid ${selSrc.color}35`})}}>
            <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:4}}>
              <span style={{fontSize:18}}>{selSrc.icon}</span>
              <span style={{fontFamily:T.serif,fontWeight:700,fontSize:15,color:selSrc.color}}>{selSrc.label}</span>
            </div>
            <div style={{fontSize:11,color:T.dim,lineHeight:1.5}}>{selSrc.orgs}</div>
            {selSrc.critical && <div style={{...aBox(T.red,0),marginTop:8}}><span style={{fontSize:11.5,fontWeight:700,color:T.red}}>⚡ {selSrc.critical}</span></div>}
          </div>

          <div style={sL()}>Treatment Regimens</div>
          {selSrc.regimens.map((reg,i)=>{
            const key  = `${selSrc.id}-${i}`;
            const open = !!openRegs[key];
            const isCrit = reg.tier==="critical";
            const isAll  = reg.tier==="allergy";
            const bc = isCrit?T.red:isAll?T.orange:selSrc.color;
            return (
              <div key={key} style={{marginBottom:7,borderRadius:10,overflow:"hidden",border:`1px solid ${open?bc+"55":T.bdr}`,borderLeft:`3px solid ${bc}`}}>
                <button onClick={()=>toggleReg(key)}
                  style={{display:"flex",alignItems:"center",gap:9,width:"100%",padding:"10px 13px",cursor:"pointer",textAlign:"left",background:`linear-gradient(135deg,${bc}09,rgba(7,17,31,0.9))`}}>
                  <div style={{flex:1,display:"flex",alignItems:"center",gap:7,flexWrap:"wrap"}}>
                    <span style={{fontFamily:T.serif,fontWeight:700,fontSize:13,color:bc}}>{reg.name}</span>
                    {isCrit && <span style={tg(T.red,{fontSize:9})}>CRITICAL</span>}
                    {isAll  && <span style={tg(T.orange,{fontSize:9})}>PCN ALLERGY</span>}
                    {penAllergy && !isAll && <span style={tg(T.gold,{fontSize:8})}>⚠ CHECK ALLERGY</span>}
                  </div>
                  <span style={{fontFamily:T.mono,fontSize:9,color:open?bc:T.dim,flexShrink:0}}>{open?"▲":"▼"}</span>
                </button>
                {open && (
                  <div style={{padding:"11px 13px",borderTop:`1px solid ${T.bdr}`}}>
                    <div style={{fontSize:9,fontWeight:700,color:T.dim,letterSpacing:"0.09em",textTransform:"uppercase",marginBottom:5}}>First-Line</div>
                    <div style={{fontFamily:T.mono,fontSize:12,color:bc,lineHeight:1.7,marginBottom:10}}>{reg.first}</div>
                    {reg.alt && (<>
                      <div style={{height:1,background:T.bdr,margin:"8px 0"}}/>
                      <div style={{fontSize:9,fontWeight:700,color:T.dim,letterSpacing:"0.09em",textTransform:"uppercase",marginBottom:5}}>Alternative / Note</div>
                      <div style={{fontFamily:T.mono,fontSize:11.5,color:T.gold,lineHeight:1.7,marginBottom:reg.note?10:8}}>{reg.alt}</div>
                    </>)}
                    {reg.note && <div style={{...aBox(T.coral,8)}}><span style={{fontSize:11.5,color:T.coral}}>{reg.note}</span></div>}
                    <div style={{padding:"6px 9px",borderRadius:7,background:"rgba(0,229,192,0.07)",border:"1px solid rgba(0,229,192,0.2)"}}>
                      <span style={{fontFamily:T.mono,fontSize:8,color:T.teal,letterSpacing:1,textTransform:"uppercase"}}>De-escalation: </span>
                      <span style={{fontSize:10.5,color:T.mut}}>{reg.deesc}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <div style={{...gl({padding:"12px 14px",marginTop:4})}}>
            <div style={sL(T.green)}>De-escalation Triggers</div>
            {selSrc.deesc.map((d,i)=>(
              <div key={i} style={{display:"flex",gap:7,alignItems:"flex-start",marginBottom:i<selSrc.deesc.length-1?5:0}}>
                <span style={{color:T.green,fontSize:8,marginTop:3,flexShrink:0}}>▸</span>
                <span style={{fontSize:11.5,color:T.mut,lineHeight:1.5}}>{d}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // ── TAB 2 — Bundle Tracker ─────────────────────────────────────────────────
  const Tab2 = (
    <div>
      {/* Header + live SEP-1 badge */}
      <div style={{display:"flex",gap:10,justifyContent:"space-between",alignItems:"flex-start",marginBottom:14,flexWrap:"wrap"}}>
        <div>
          <div style={{fontSize:13,fontWeight:700,color:T.txt,marginBottom:2}}>CMS SEP-1 Real-Time Tracker</div>
          <div style={{fontSize:11,color:T.mut}}>Mark elements as completed · Compliance calculates automatically · Saves to quality log</div>
        </div>
        {recogSet && compliance && (
          <div style={{...gl({padding:"8px 13px",border:`1px solid ${compliance.compliant?T.green+"50":T.coral+"50"}`,background:compliance.compliant?"rgba(61,255,160,0.07)":"rgba(255,96,96,0.07)"})}}>
            <div style={{fontSize:9.5,fontWeight:700,color:compliance.compliant?T.green:T.coral,fontFamily:T.mono,letterSpacing:1.5,textTransform:"uppercase"}}>SEP-1 {compliance.compliant?"COMPLIANT":"NOT YET"}</div>
            <div style={{fontSize:10,color:T.mut,marginTop:2}}>{compliance.results.filter(r=>r.status==="on_time").length}/4 elements on time</div>
          </div>
        )}
      </div>

      {/* T=0 Recognition time */}
      <div style={{...gl({padding:"13px 15px",marginBottom:13,borderLeft:`3px solid ${recogSet?T.coral:T.dim}`})}}>
        <div style={{fontSize:9,fontWeight:700,color:recogSet?T.coral:T.dim,fontFamily:T.mono,letterSpacing:1.5,textTransform:"uppercase",marginBottom:9,display:"flex",alignItems:"center",gap:9,flexWrap:"wrap"}}>
          T=0 — Sepsis Recognition Time
          {shockCriteria && <span style={tg(T.coral)}>⚠ SEPTIC SHOCK — all elements 60 min</span>}
        </div>
        <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
          <input type="time" value={recogTime} onChange={e=>setRecogTime(e.target.value)}
            style={{background:"rgba(13,27,46,.8)",border:`1px solid ${recogSet?T.coral+"55":T.bdr}`,borderRadius:8,padding:"8px 12px",color:T.txt,fontFamily:T.mono,fontSize:15,fontWeight:700}}/>
          {!recogSet
            ? <button style={btn(T.coral,{padding:"9px 20px",fontSize:13})} onClick={()=>setRecogSet(true)}>🚨 Start Bundle Clock</button>
            : <div style={{display:"flex",gap:10,alignItems:"center"}}>
                <span style={{fontFamily:T.mono,fontSize:12,color:T.coral}}>{fmtMin(diffMin(recogDate_,now))} elapsed</span>
                <button style={btn(T.dim,{padding:"5px 11px",fontSize:11})} onClick={()=>setRecogSet(false)}>Reset</button>
              </div>
          }
          <div style={{position:"relative"}}>
            <input type="number" value={mapVal} onChange={e=>setMapVal(e.target.value)} placeholder="MAP"
              style={{background:"rgba(13,27,46,.8)",border:`1px solid ${mapVal&&parseFloat(mapVal)<65?T.coral+"55":T.bdr}`,borderRadius:8,padding:"7px 36px 7px 10px",color:T.txt,fontFamily:T.mono,fontSize:13,width:100}}/>
            <span style={{position:"absolute",right:7,top:"50%",transform:"translateY(-50%)",fontSize:8,color:T.dim,pointerEvents:"none"}}>mmHg</span>
          </div>
          {mapVal && parseFloat(mapVal)<65 && <span style={tg(T.coral,{fontSize:10})}>MAP &lt;65</span>}
        </div>
      </div>

      {/* 4 bundle element cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:10,marginBottom:12}}>
        {BUNDLE_ITEMS.map(el => {
          const done    = !!stamps[el.id];
          const elapsed = done ? diffMin(recogDate_,stamps[el.id]) : recogDate_ ? diffMin(recogDate_,now) : null;
          const limit   = shockCriteria?60:el.target;
          const status  = !recogSet?"idle":done?(elapsed<=limit?"ok":"late"):elapsed!==null&&elapsed>limit?"over":"pending";
          const sc = {idle:{c:T.dim,l:"—"},pending:{c:T.teal,l:"Pending"},ok:{c:T.green,l:"✓ On time"},late:{c:T.gold,l:"⚠ Late"},over:{c:T.coral,l:"Overdue"}}[status];
          return (
            <div key={el.id} style={{...gl({padding:"12px 13px",borderLeft:`3px solid ${sc.c}`,background:`${sc.c}08`})}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                <div style={{display:"flex",alignItems:"center",gap:7}}><span style={{fontSize:18}}>{el.icon}</span><span style={{fontSize:12,fontWeight:700}}>{el.label}</span></div>
                <span style={tg(sc.c,{fontSize:9})}>{sc.l}</span>
              </div>
              <div style={{fontSize:10.5,color:T.dim,lineHeight:1.4,marginBottom:8}}>{el.desc}</div>
              {!done
                ? <button onClick={()=>stampEl(el.id)} disabled={!recogSet}
                    style={btn(sc.c,{padding:"5px 0",fontSize:11,width:"100%",textAlign:"center",opacity:!recogSet?.5:1})}>
                    Mark Done — {nowHHMM()}
                  </button>
                : <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div><span style={{fontFamily:T.mono,fontSize:13,fontWeight:700,color:sc.c}}>{toHHMM(stamps[el.id])}</span><span style={{fontSize:10,color:T.mut,marginLeft:7}}>{fmtMin(elapsed)}</span></div>
                    <button onClick={()=>unstampEl(el.id)} style={btn(T.dim,{padding:"3px 8px",fontSize:10})}>Undo</button>
                  </div>
              }
              {el.id==="abx"&&done&&(
                <select value={abxSel} onChange={e=>setAbxSel(e.target.value)}
                  style={{marginTop:8,background:"rgba(13,27,46,.8)",border:`1px solid ${T.bdr}`,borderRadius:7,padding:"6px 10px",color:T.txt,fontFamily:T.sans,fontSize:11,width:"100%",cursor:"pointer"}}>
                  <option value="">Select regimen...</option>
                  {ABX_OPTS.map(o=><option key={o} value={o}>{o}</option>)}
                </select>
              )}
              {el.id==="lactate"&&done&&(
                <div style={{marginTop:8}}>
                  <div style={{position:"relative"}}>
                    <input type="number" value={lactateVal} onChange={e=>setLactateVal(e.target.value)} placeholder="Lactate value"
                      style={{background:"rgba(13,27,46,.8)",border:`1px solid ${T.bdr}`,borderRadius:7,padding:"6px 44px 6px 10px",color:T.txt,fontFamily:T.mono,fontSize:12,width:"100%"}}/>
                    <span style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",fontSize:8,color:T.dim,pointerEvents:"none"}}>mmol/L</span>
                  </div>
                  {parseFloat(lactateVal)>=2&&parseFloat(lactateVal)<4&&(
                    <div style={{display:"flex",alignItems:"center",gap:8,marginTop:6}}>
                      <span style={{fontSize:10,color:T.gold}}>Repeat within 2h</span>
                      {!repeatLac
                        ? <button onClick={()=>setRepeatLac(new Date())} style={btn(T.gold,{padding:"3px 9px",fontSize:10})}>Mark Drawn</button>
                        : <span style={{fontFamily:T.mono,fontSize:10,color:T.gold}}>{toHHMM(repeatLac)} ✓</span>
                      }
                    </div>
                  )}
                  {parseFloat(lactateVal)>=4&&<div style={{marginTop:5}}><span style={tg(T.coral,{fontSize:9})}>⚠ Shock criteria — all targets 60 min</span></div>}
                </div>
              )}
              {el.id==="fluids"&&done&&(
                <div style={{marginTop:8,position:"relative"}}>
                  <input type="number" value={fluidVol} onChange={e=>setFluidVol(e.target.value)} placeholder="Volume given"
                    style={{background:"rgba(13,27,46,.8)",border:`1px solid ${T.bdr}`,borderRadius:7,padding:"6px 30px 6px 10px",color:T.txt,fontFamily:T.mono,fontSize:12,width:"100%"}}/>
                  <span style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",fontSize:8,color:T.dim,pointerEvents:"none"}}>mL</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Vasopressor row — appears when shock or fluids stamped */}
      {(shockCriteria||stamps.fluids)&&(
        <div style={{...gl({padding:"12px 14px",marginBottom:12,borderLeft:`3px solid ${vasoReq?T.orange:T.dim}`})}}>
          <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",marginBottom:vasoReq?10:0}}>
            <span style={{fontSize:12,fontWeight:700}}>💊 Vasopressor Required?</span>
            <button onClick={()=>setVasoReq(p=>!p)} style={btn(vasoReq?T.orange:T.dim,{padding:"4px 12px",fontSize:11})}>{vasoReq?"✓ Yes — Required":"No / Not yet"}</button>
            {vasoReq&&!vasoTime&&<button onClick={()=>setVasoTime(new Date())} style={btn(T.orange,{padding:"4px 12px",fontSize:11})}>Mark Initiated — {nowHHMM()}</button>}
            {vasoTime&&<span style={{fontFamily:T.mono,fontSize:11,color:T.orange}}>{toHHMM(vasoTime)} ✓</span>}
          </div>
          {vasoReq&&(
            <select value={vasoSel} onChange={e=>setVasoSel(e.target.value)}
              style={{background:"rgba(13,27,46,.8)",border:`1px solid ${T.bdr}`,borderRadius:7,padding:"6px 10px",color:T.txt,fontFamily:T.sans,fontSize:11,width:"100%",cursor:"pointer"}}>
              <option value="">Select vasopressor...</option>
              {["Norepinephrine 0.01–0.5 mcg/kg/min","Vasopressin 0.03 U/min (add-on)","Epinephrine 0.05–0.5 mcg/kg/min","Other (see notes)"].map(o=><option key={o} value={o}>{o}</option>)}
            </select>
          )}
        </div>
      )}

      {/* Compliance summary grid */}
      {recogSet&&compliance&&(
        <div style={{...gl({padding:"12px 14px",marginBottom:12})}}>
          <div style={sL()}>Bundle Compliance</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:7,marginBottom:10}}>
            {compliance.results.map(r=>{
              const el = BUNDLE_ITEMS.find(b=>b.id===r.id);
              const c  = r.status==="on_time"?T.green:r.status==="late"?T.gold:T.coral;
              return (
                <div key={r.id} style={{background:`${c}10`,borderRadius:8,padding:"9px 8px",border:`1px solid ${c}30`,textAlign:"center"}}>
                  <div style={{fontSize:15,marginBottom:3}}>{el?.icon}</div>
                  <div style={{fontSize:9,color:T.mut,marginBottom:3}}>{el?.label}</div>
                  <div style={{fontFamily:T.mono,fontSize:12,fontWeight:700,color:c}}>{r.status==="missing"?"—":fmtMin(r.mins)}</div>
                  <div style={{fontSize:8,color:c,marginTop:2}}>{r.status==="missing"?"Pending":r.status==="on_time"?"On time":"Late"}</div>
                </div>
              );
            })}
          </div>
          <div style={{padding:"8px 12px",borderRadius:8,background:compliance.compliant?"rgba(61,255,160,0.08)":"rgba(255,96,96,0.08)",border:`1px solid ${compliance.compliant?T.green+"40":T.coral+"30"}`}}>
            <div style={{fontSize:12,fontWeight:700,color:compliance.compliant?T.green:T.coral}}>{compliance.compliant?"✓ SEP-1 Bundle Compliant":"⚠ SEP-1 Incomplete — Element(s) Overdue or Late"}</div>
            <div style={{fontSize:10,color:T.mut,marginTop:2}}>{shockCriteria?"Septic shock — all elements within 60 min":"Possible sepsis — fluids within 3h, other elements within 60 min"}</div>
          </div>
        </div>
      )}

      {/* Quality log save */}
      <div style={{...gl({padding:"12px 14px"})}}>
        <div style={sL(T.teal)}>Save to Quality Log</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:9}}>
          <div>
            <div style={{fontSize:8,color:T.dim,fontFamily:T.mono,letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>Provider</div>
            <input value={provider} onChange={e=>setProvider(e.target.value)} placeholder="Treating provider"
              style={{background:"rgba(13,27,46,.8)",border:`1px solid ${T.bdr}`,borderRadius:7,padding:"7px 10px",color:T.txt,fontFamily:T.sans,fontSize:12,width:"100%"}}/>
          </div>
          <div>
            <div style={{fontSize:8,color:T.dim,fontFamily:T.mono,letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>Disposition</div>
            <select value={disposition} onChange={e=>setDispo(e.target.value)}
              style={{background:"rgba(13,27,46,.8)",border:`1px solid ${T.bdr}`,borderRadius:7,padding:"7px 10px",color:T.txt,fontFamily:T.sans,fontSize:12,width:"100%",cursor:"pointer"}}>
              <option value="">Select...</option>
              {["MICU","SICU","Step-down","Telemetry floor","General floor","Transfer","Expired in ED"].map(d=><option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div style={{gridColumn:"1/-1"}}>
            <div style={{fontSize:8,color:T.dim,fontFamily:T.mono,letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>Compliance Notes</div>
            <textarea value={tNotes} onChange={e=>setTNotes(e.target.value)} rows={2}
              placeholder="Reason for any late or missing elements..."
              style={{background:"rgba(13,27,46,.8)",border:`1px solid ${T.bdr}`,borderRadius:7,padding:"7px 10px",color:T.txt,fontFamily:T.sans,fontSize:12,width:"100%",resize:"vertical",lineHeight:1.6}}/>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving||!recogSet||saved}
          style={{...btn(T.teal,{display:"flex",alignItems:"center",gap:8,fontSize:13,padding:"9px 22px",opacity:(!recogSet||saving||saved)?.4:1})}}>
          {saving?<><Spin/> Saving...</>:saved?"✓ Saved to Log":"💾 Save Bundle to Quality Log"}
        </button>
        {saved&&<div style={{fontSize:11,color:T.green,marginTop:7}}>Encounter saved. Start a new encounter to reset.</div>}
      </div>

      {/* Quick action — Save to Handoff */}
      <div style={{...gl({padding:"12px 14px",marginTop:10,border:`1px solid ${T.teal}25`})}}>
        <div style={sL(T.teal)}>Quick Action — Handoff</div>
        <div style={{fontSize:11,color:T.mut,marginBottom:10,lineHeight:1.5}}>
          Generates an I-PASS summary from the current bundle state and saves it directly to the Handoff data store for sign-out.
        </div>
        <button onClick={handleSaveHandoff} disabled={savingHandoff||savedHandoff}
          style={{...btn(T.teal,{display:"flex",alignItems:"center",gap:8,fontSize:12,padding:"8px 20px",opacity:(savingHandoff||savedHandoff)?.5:1})}}>
          {savingHandoff ? <><Spin/> Saving Handoff...</> : savedHandoff ? "✓ Saved to Handoff" : "📋 Save to Handoff"}
        </button>
        {savedHandoff && <div style={{fontSize:11,color:T.teal,marginTop:7}}>I-PASS summary saved to Handoff entry.</div>}
      </div>
    </div>
  );

  // ── TAB 3 — POCUS ─────────────────────────────────────────────────────────
  const Tab3 = (
    <div>
      {[
        {label:"CARDIAC",color:T.teal,findings:[
          {f:"Hyperdynamic + small LV",            a:"Give fluid",                       c:T.green},
          {f:"Poor EF / depressed function",       a:"Consider Dobutamine",              c:T.gold},
          {f:"RV dilated · D-sign on parasternal", a:"? PE / RV failure — Hold fluid",  c:T.coral},
        ]},
        {label:"IVC",color:T.blue,findings:[
          {f:"< 1 cm or > 50% collapse on sniff",  a:"Fluid responsive",                 c:T.green},
          {f:"> 2 cm or < 50% collapse",           a:"Non-responsive — Stop / Reassess", c:T.coral},
        ]},
        {label:"LUNG ULTRASOUND",color:T.purple,findings:[
          {f:"A-lines (dry lungs)",                a:"Can tolerate more fluid",           c:T.green},
          {f:"B-lines (wet / pulmonary edema)",    a:"Stop fluids / Consider diuresis",   c:T.coral},
        ]},
      ].map(({label,color,findings})=>(
        <div key={label}>
          <div style={sL(color)}><span style={tg(color)}>{label}</span></div>
          {findings.map(({f,a,c})=>(
            <div key={f} style={{...gl({padding:"11px 14px",marginBottom:7}),display:"flex",justifyContent:"space-between",alignItems:"center",gap:12}}>
              <div style={{fontSize:12,color:T.mut,flex:1,lineHeight:1.4}}>{f}</div>
              <div style={tg(c,{whiteSpace:"nowrap"})}>→ {a}</div>
            </div>
          ))}
        </div>
      ))}
      <div style={sL()}>Reassessment — After 1st Liter / 30 Min</div>
      <div style={{display:"grid",gap:9}}>
        <div style={{...gl({padding:"12px 14px",background:"rgba(61,255,160,0.06)",border:"1px solid rgba(61,255,160,0.25)"})}}>
          <div style={{fontSize:9.5,fontWeight:700,color:T.green,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:9}}>✓ Targets — All Required</div>
          {["MAP ≥ 65 mmHg on fluids alone","Lactate improving ≥ 10% at 2h","UO ≥ 0.5 mL/kg/h · CRT < 3s · Intact mentation"].map((t,i)=>(
            <div key={i} style={{fontSize:11.5,color:T.mut,marginBottom:i<2?5:0,display:"flex",gap:8}}><span style={{color:T.green}}>●</span>{t}</div>
          ))}
        </div>
        <div style={{...gl({padding:"12px 14px",background:"rgba(255,96,96,0.06)",border:"1px solid rgba(255,96,96,0.25)"})}}>
          <div style={{fontSize:9.5,fontWeight:700,color:T.coral,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:9}}>⚠ Triggers → Refractory Protocol</div>
          {["MAP < 65 despite 30 mL/kg IVF","Lactate not falling ≥ 10% at 2h (or rising)","Vasopressor-dependent"].map((t,i)=>(
            <div key={i} style={{fontSize:11.5,color:T.mut,marginBottom:i<2?5:0,display:"flex",gap:8,alignItems:"center"}}>
              <span style={{color:T.coral}}>●</span>{t}
              {i===2 && <button style={btn(T.coral,{fontSize:10,padding:"3px 9px",marginLeft:"auto"})} onClick={()=>setTab(4)}>Ladder →</button>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── TAB 4 — Vasopressors ──────────────────────────────────────────────────
  const Tab4 = (
    <div>
      <div style={aBox(T.coral,14)}>
        <div style={{fontSize:12,fontWeight:700,color:T.coral,marginBottom:2}}>REFRACTORY SEPTIC SHOCK</div>
        <div style={{fontSize:11.5,color:T.mut}}>MAP &lt; 65 despite adequate IVF resuscitation · Tap each step to mark active</div>
      </div>
      <div style={sL()}>Vasopressor Ladder</div>
      {PRESSOR_STEPS.map(({step,drug,dose,color,bg,trigger,titrate,qopSeed})=>(
        <div key={step}
          style={{...gl({padding:"13px 15px",marginBottom:9,border:`1.5px solid ${vasStep>=step?color+"66":T.bdr}`,background:vasStep>=step?bg:T.card,cursor:"pointer",transition:"all .2s"})}}
          onClick={()=>setVasStep(step)}>
          <div style={{display:"flex",gap:12,alignItems:"center"}}>
            <div style={{width:32,height:32,borderRadius:"50%",background:vasStep>=step?`${color}28`:T.card,border:`2.5px solid ${vasStep>=step?color:T.bdr}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:vasStep>=step?color:T.dim,flexShrink:0,transition:"all .2s"}}>{step}</div>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{fontFamily:T.mono,fontSize:13,fontWeight:700,color:vasStep>=step?color:T.mut,letterSpacing:"0.05em",transition:"color .2s"}}>{drug}</div>
                {vasStep>=step && qopSeed && <QuickOrderButton seed={qopSeed} onOpen={openOrder} size='sm' />}
              </div>
              <div style={{fontFamily:T.mono,fontSize:12,color:vasStep>=step?T.txt:T.dim,marginTop:2,transition:"color .2s"}}>{dose}</div>
            </div>
            {vasStep<step && <span style={{fontSize:10,color:T.dim}}>tap to activate</span>}
          </div>
          {vasStep>=step && (
            <div style={{marginTop:10,paddingLeft:44}}>
              <div style={{fontSize:11.5,color:T.mut,marginBottom:3}}><span style={{color,fontWeight:600}}>Trigger: </span>{trigger}</div>
              <div style={{fontSize:11.5,color:T.dim}}>{titrate}</div>
            </div>
          )}
        </div>
      ))}
      <div style={sL()}>Add-On Agents</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:14}}>
        <div style={{...gl({padding:"12px 14px",background:"rgba(245,200,66,0.07)",border:"1px solid rgba(245,200,66,0.3)"})}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
            <div style={{fontFamily:T.mono,fontSize:11,fontWeight:700,color:T.gold}}>HYDROCORTISONE</div>
            <QuickOrderButton seed={{medication:"Hydrocortisone",dose:"50mg IV",route:"IV",frequency:"q6h",indication:"Septic shock — relative adrenal insufficiency"}} onOpen={openOrder} size='sm' />
          </div>
          <div style={{fontFamily:T.mono,fontSize:13,color:T.txt,marginBottom:6}}>50 mg IV q 6h</div>
          <div style={{fontSize:11,color:T.mut,lineHeight:1.5}}>If ≥ 2 pressors &gt; 4h · Relative adrenal insufficiency</div>
        </div>
        <div style={{...gl({padding:"12px 14px",background:"rgba(59,158,255,0.07)",border:"1px solid rgba(59,158,255,0.3)"})}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
            <div style={{fontFamily:T.mono,fontSize:11,fontWeight:700,color:T.blue}}>DOBUTAMINE</div>
            <QuickOrderButton seed={{medication:"Dobutamine",dose:"2-20 mcg/kg/min",route:"IV infusion",frequency:"continuous",indication:"Septic shock with poor EF / cardiogenic component"}} onOpen={openOrder} size='sm' />
          </div>
          <div style={{fontFamily:T.mono,fontSize:13,color:T.txt,marginBottom:6}}>2 – 20 mcg/kg/min</div>
          <div style={{fontSize:11,color:T.mut,lineHeight:1.5}}>Cardiogenic shock · Poor EF on POCUS</div>
        </div>
      </div>
      <div style={{...gl({padding:"12px 14px"})}}>
        <div style={{fontSize:10,fontWeight:700,color:T.mut,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:9}}>Clinical Pearls</div>
        {[
          "Central access: CVC + arterial line · Peripheral pressors safe while awaiting",
          "Source control ≤ 6h if emergent (perf, NF, abscess) · ≤ 12h elective",
          "Not responding? Consider: adrenal crisis · PE / tamponade · cardiogenic MI · anaphylaxis · undrained source",
        ].map((n,i)=>(
          <div key={i} style={{fontSize:11.5,color:T.mut,paddingLeft:10,borderLeft:`2px solid ${T.bdr}`,lineHeight:1.55,marginBottom:i<2?8:0}}>{n}</div>
        ))}
      </div>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{display:"flex",minHeight:"100vh",background:T.bg,fontFamily:T.sans,color:T.txt}}>
      <div style={{flex:1,overflow:"auto",display:"flex",flexDirection:"column",minWidth:0,paddingBottom:80}}>

        {toast && (
          <div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:"rgba(7,17,31,.97)",border:`1px solid ${toast.c}40`,borderRadius:10,padding:"9px 18px",fontSize:12,fontWeight:700,color:toast.c,zIndex:200,pointerEvents:"none",boxShadow:"0 4px 24px rgba(0,0,0,.5)"}}>
            {toast.msg}
          </div>
        )}

        <div style={{display:"flex",gap:4,padding:"14px 18px 0",overflowX:"auto",scrollbarWidth:"none"}}>
          {TABS.map((t,i)=>(
            <button key={t} onClick={()=>setTab(i)}
              style={{padding:"7px 14px",borderRadius:9,border:`1.5px solid ${tab===i?T.teal:T.bdr}`,background:tab===i?"rgba(0,229,192,0.12)":T.card,color:tab===i?T.teal:T.mut,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:T.sans,whiteSpace:"nowrap",transition:"all .15s",backdropFilter:"blur(8px)"}}>
              {t}
            </button>
          ))}
        </div>

        <div style={{padding:"16px 18px"}}>
          {tab===0 && Tab0}
          {tab===1 && Tab1}
          {tab===2 && Tab2}
          {tab===3 && Tab3}
          {tab===4 && Tab4}
        </div>

        <div style={{textAlign:"center",padding:"8px 0 4px"}}>
          <span style={{fontFamily:T.mono,fontSize:8,color:T.dim,letterSpacing:1.5}}>
            NOTRYA SEPSIS HUB · SSC 2021 · IDSA / ATS / SHEA · SURVIVING SEPSIS CAMPAIGN · CLINICAL JUDGMENT REQUIRED
          </span>
        </div>
      </div>
      {activeOrder && (
        <QuickOrderPanel orderSeed={activeOrder} patientContext={{}} hubName='SepsisHub' onClose={closeOrder} C='dark' />
      )}
    </div>
  );
}