import { useState } from "react";
import { base44 } from "@/api/base44Client";

const InvokeLLM = (params) => base44.integrations.Core.InvokeLLM(params);

(() => {
  if (document.getElementById("abx-css")) return;
  const l = document.createElement("link"); l.id = "abx-f"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "abx-css";
  s.textContent = `
    *{box-sizing:border-box;}
    @keyframes abxIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
    @keyframes abxSpin{to{transform:rotate(360deg)}}
    .abx-in{animation:abxIn .22s ease both;}
    .abx-hov:hover{background:rgba(255,255,255,.07)!important;}
    ::-webkit-scrollbar{width:3px;height:3px;}
    ::-webkit-scrollbar-thumb{background:rgba(61,255,160,.2);border-radius:2px;}
    input::placeholder,textarea::placeholder{color:rgba(221,230,240,.2);}
    input:focus,textarea:focus{border-color:rgba(61,255,160,.5)!important;outline:none;}
    select option{background:#0d1b2e;}
  `;
  document.head.appendChild(s);
})();

const T = {
  bg:"#07111f",navy:"#0d1b2e",
  card:"rgba(255,255,255,0.04)",bdr:"rgba(255,255,255,0.08)",
  green:"#3dffa0",gD:"rgba(61,255,160,0.1)",gB:"rgba(61,255,160,0.22)",
  teal:"#00b4d8",tD:"rgba(0,180,216,0.12)",
  gold:"#f0a500",gldD:"rgba(240,165,0,0.12)",
  coral:"#ff6060",cD:"rgba(255,96,96,0.12)",
  purple:"#9b6dff",pD:"rgba(155,109,255,0.12)",
  orange:"#ff9f43",oD:"rgba(255,159,67,0.12)",
  txt:"#dde6f0",mut:"rgba(221,230,240,0.55)",dim:"rgba(221,230,240,0.28)",
};
const gl = (x={}) => ({backdropFilter:"blur(14px)",background:T.card,border:`1px solid ${T.bdr}`,borderRadius:12,...x});
const ib = (x={}) => ({width:"100%",background:"rgba(13,27,46,.8)",border:`1px solid ${T.bdr}`,borderRadius:9,padding:"9px 13px",color:T.txt,fontFamily:"DM Sans,sans-serif",fontSize:13,transition:"border-color .15s",...x});
const ab = (c=T.green,x={}) => ({padding:"8px 18px",borderRadius:9,cursor:"pointer",border:`1px solid ${c}55`,background:`${c}18`,color:c,fontFamily:"DM Sans,sans-serif",fontSize:13,fontWeight:700,transition:"all .16s",...x});
const tg = (c,x={}) => ({borderRadius:6,padding:"3px 9px",fontSize:10,fontWeight:700,background:`${c}18`,border:`1px solid ${c}30`,color:c,...x});
const Sp = () => <span style={{display:"inline-block",width:13,height:13,border:"2px solid rgba(61,255,160,.2)",borderTopColor:T.green,borderRadius:"50%",animation:"abxSpin .7s linear infinite"}} />;

const SYNDROMES = [
  { id:"cap", label:"CAP", full:"Community-Acquired Pneumonia", icon:"🫁",
    first:"Ceftriaxone 1-2g IV q24h + Azithromycin 500mg IV/PO daily\n(OR Respiratory fluoroquinolone: Levofloxacin 750mg IV/PO daily)",
    pcn:"Levofloxacin 750mg IV/PO daily (monotherapy for outpatient; IV for inpatient)\nOR Moxifloxacin 400mg PO daily",
    mrsa:false, mrsa_agent:"",
    duration:"5-7 days (non-ICU); 7-10 days (ICU or bacteremic)",
    deesc:"Step down to oral once afebrile ×48h, tolerating PO, O2 improving. De-escalate to narrowest agent once cultures available.",
    renal:"No adjustment for ceftriaxone. Levofloxacin: CrCl <20 requires dose reduction.",
    notes:"IDSA/ATS 2019 guidelines. ICU CAP + Pseudomonas risk: add pip-tazo or cefepime. ICU + MRSA risk (prior MRSA, necrotizing): add vancomycin." },

  { id:"hap", label:"HAP/VAP", full:"Hospital-Acquired / Ventilator-Associated Pneumonia", icon:"🏥",
    first:"Pip-Tazo 4.5g IV q6h (double-cover Pseudomonas if high risk)\nOR Cefepime 2g IV q8h + Vancomycin 15-20 mg/kg IV q8-12h (if MRSA risk)",
    pcn:"Aztreonam 2g IV q8h (if true PCN allergy — beta-lactam allergy)\n+ Vancomycin 15-20 mg/kg IV q8-12h for MRSA coverage",
    mrsa:true, mrsa_agent:"Vancomycin 15-20 mg/kg IV q8-12h (target AUC/MIC 400-600)\nOR Linezolid 600mg IV/PO q12h (if VRE or renal concern)",
    duration:"7 days (most cases); may extend to 14 days for Pseudomonas/Acinetobacter or poor response",
    deesc:"De-escalate at 48-72h once cultures finalized. If MRSA nasal swab negative, discontinue MRSA coverage.",
    renal:"Reduce vancomycin per CrCl; reduce pip-tazo per eGFR. Cefepime: reduce in eGFR <30 (encephalopathy risk).",
    notes:"Clinical Pulmonary Infection Score (CPIS) to guide therapy. Procalcitonin-guided de-escalation supported by PRORATA trial." },

  { id:"uti_simple", label:"Uncomplicated UTI", full:"Uncomplicated Urinary Tract Infection", icon:"💧",
    first:"Nitrofurantoin 100mg ER PO BID × 5 days (preferred)\nOR TMP-SMX DS 1 tab PO BID × 3 days (if local resistance <20%)\nOR Fosfomycin 3g PO × 1 dose",
    pcn:"All first-line options above are non-beta-lactam; no adjustment needed for PCN allergy",
    mrsa:false, mrsa_agent:"",
    duration:"3-5 days (TMP-SMX/fluoroquinolone); 5 days (nitrofurantoin); single dose (fosfomycin)",
    deesc:"Urine culture at 48h; narrow to susceptibilities. Fluoroquinolones not first-line per IDSA 2010 (resistance, collateral damage).",
    renal:"Nitrofurantoin AVOID if CrCl <30 (ineffective, potential toxicity). TMP-SMX AVOID if CrCl <15.",
    notes:"Pyuria/dysuria without fever in non-pregnant women. Do not treat asymptomatic bacteriuria (except pre-urologic procedure, pregnancy)." },

  { id:"uti_comp", label:"Complicated UTI/Pyelo", full:"Complicated UTI / Pyelonephritis", icon:"🔬",
    first:"Ceftriaxone 1-2g IV q24h (initial empiric)\nOR Ciprofloxacin 500mg PO BID (if outpatient + susceptibility confirmed)\nOR Levofloxacin 750mg PO/IV daily",
    pcn:"Aztreonam 1-2g IV q8h (true PCN allergy)\nOR Gentamicin 5-7 mg/kg IV q24h (with renal monitoring)",
    mrsa:false, mrsa_agent:"",
    duration:"Pyelonephritis: 7-14 days. Complicated UTI: 10-14 days. Step down to oral once improving.",
    deesc:"Blood and urine cultures required. De-escalate at 48-72h to oral agent matching susceptibility. FQ resistance now >20% in many regions — verify local antibiogram.",
    renal:"Ciprofloxacin: reduce if CrCl <30. Ceftriaxone: no adjustment. Gentamicin: monitor closely in renal impairment.",
    notes:"Obtain blood cultures for pyelonephritis. ESBL-producing organisms increasing — consider ertapenem empirically if prior ESBL or recent hospitalization." },

  { id:"sepsis", label:"Sepsis", full:"Sepsis — Unknown Source", icon:"🚨",
    first:"Pip-Tazo 4.5g IV q6h (broad-spectrum first-line)\nOR Cefepime 2g IV q8h + Metronidazole 500mg IV q8h (if abdominal source)\nAdd Vancomycin 15-20 mg/kg IV if MRSA risk or hemodynamically unstable",
    pcn:"Aztreonam 2g IV q8h (Gram-negative coverage)\n+ Vancomycin 15-20 mg/kg IV (MRSA/Gram-positive coverage)\n+ Metronidazole 500mg IV q8h (anaerobic coverage if abdominal source)",
    mrsa:true, mrsa_agent:"Vancomycin 15-20 mg/kg IV q8-12h (target AUC/MIC 400-600)\nLinezolid 600mg IV q12h if renal clearance severely impaired",
    duration:"Minimum 7-10 days; source-guided — bacteremia typically 14 days",
    deesc:"MANDATORY de-escalation at 48-72h using culture results. SSC guidelines: reassess daily. PCT-guided protocols shorten duration by 2-3 days.",
    renal:"Adjust pip-tazo, vancomycin, cefepime per CrCl. Reassess q24-48h in AKI.",
    notes:"Hour-1 Bundle: blood cultures x2, lactate, broad-spectrum ABX, 30 mL/kg IVF bolus if hypotension/lactate >4. Source control critical." },

  { id:"iab", label:"Intra-abdominal", full:"Intra-abdominal Infection", icon:"🫃",
    first:"Pip-Tazo 4.5g IV q6h (covers Gram-negatives + anaerobes)\nOR Cefepime 2g IV q8h + Metronidazole 500mg IV q8h\nOR Ertapenem 1g IV q24h (mild-moderate community-acquired)",
    pcn:"Aztreonam 2g IV q8h + Metronidazole 500mg IV q8h\nOR Ciprofloxacin 400mg IV q12h + Metronidazole 500mg IV q8h (if eGFR adequate)",
    mrsa:false, mrsa_agent:"",
    duration:"4 days after source control (STOP-IT trial). Without source control: 5-7 days.",
    deesc:"Obtain intraoperative cultures. De-escalate to oral once improving, tolerating PO, WBC trending down.",
    renal:"Ertapenem: reduce if CrCl <30 (500mg q24h). Metronidazole: no renal adjustment (reduce in severe hepatic).",
    notes:"STOP-IT RCT: 4-day course non-inferior to longer courses when source controlled. MRSA rarely relevant unless nosocomial." },

  { id:"ssti_np", label:"SSTI (Non-purulent)", full:"Skin/Soft Tissue — Non-purulent Cellulitis", icon:"🩹",
    first:"Cephalexin 500mg PO QID (mild, outpatient)\nOR Cefazolin 2g IV q8h (moderate-severe, inpatient)\nOR Ceftriaxone 1g IV q24h (inpatient alternative)",
    pcn:"Clindamycin 300-450mg PO TID (if susceptible; check local inducible resistance)\nOR Doxycycline 100mg PO BID (limited Streptococcus coverage — add for confirmed GABHS)",
    mrsa:false, mrsa_agent:"",
    duration:"5 days (outpatient mild); 7-14 days (inpatient/severe). Extend if slow response.",
    deesc:"Mark borders with pen at presentation. Blood cultures low yield in non-purulent — not routinely recommended.",
    renal:"No adjustment for cephalexin/ceftriaxone at standard doses. Clindamycin: no renal adjustment.",
    notes:"Non-purulent cellulitis is primarily Streptococcal — MRSA coverage not needed empirically. Ensure adequate lower extremity elevation and edema management." },

  { id:"ssti_p", label:"SSTI (Purulent/MRSA)", full:"Skin/Soft Tissue — Purulent / MRSA", icon:"⚠️",
    first:"Abscess <2cm: I&D alone (no antibiotics required per NEJM 2017)\nAbscess >=2cm + cellulitis: TMP-SMX DS 1-2 tabs PO BID x 5-7 days\nOR Doxycycline 100mg PO BID x 5-7 days",
    pcn:"All first-line options are non-beta-lactam — no adjustment needed for PCN allergy",
    mrsa:true, mrsa_agent:"TMP-SMX DS 1-2 tabs PO BID (CA-MRSA first-line outpatient)\nClindamycin 300-450mg PO TID (if local susceptibility >80%)\nVancomycin 15-20 mg/kg IV q8-12h (severe, hospitalized, SIRS)",
    duration:"5-7 days antibiotics after I&D (if indicated). Oral step-down as soon as clinically appropriate.",
    deesc:"Wound cultures to guide therapy. MRSA active surveillance for recurring infections.",
    renal:"TMP-SMX: avoid if CrCl <15. Vancomycin: adjust per CrCl + AUC monitoring.",
    notes:"SABER trial: I&D alone non-inferior for abscesses <2cm. Loop drainage for large abscesses. Check for necrotizing fasciitis (pain out of proportion, crepitus, gas on imaging — surgical emergency)." },

  { id:"mening", label:"Meningitis", full:"Bacterial Meningitis", icon:"🧠",
    first:"Ceftriaxone 2g IV q12h + Dexamethasone 0.15 mg/kg IV q6h x 4 days (start before or with first ABX)\nAdd Ampicillin 2g IV q4h if Listeria risk (age >50, immunocompromised, alcohol use)",
    pcn:"Vancomycin 15-20 mg/kg IV q8-12h + Rifampin 600mg IV/PO daily (if PCN-allergic with CSF Pen-R pneumo)\nOR Meropenem 2g IV q8h (if beta-lactam allergy: broad cross-reactivity concern)",
    mrsa:false, mrsa_agent:"Vancomycin 15-20 mg/kg IV q8-12h if Staph aureus meningitis suspected (post-neurosurgery)",
    duration:"Pneumococcal: 10-14 days. Meningococcal: 7 days. Listeria: 21 days. Gram-negative: 21 days.",
    deesc:"Repeat LP at 48h if not improving. Narrow based on CSF culture. Dexamethasone only proven to reduce sequelae in pneumococcal (adult) — stop if not pneumococcus.",
    renal:"Ceftriaxone: no adjustment. Vancomycin: adjust per CrCl. Ampicillin: reduce frequency if severe renal impairment.",
    notes:"LP before CT if no focal neuro deficits, not immunocompromised, no papilledema. Blood cultures before LP if CT required. Do not delay antibiotics for imaging." },

  { id:"neutro", label:"Neutropenic Fever", full:"Neutropenic Fever / Febrile Neutropenia", icon:"🔴",
    first:"Cefepime 2g IV q8h (monotherapy — high-risk patients)\nOR Pip-Tazo 4.5g IV q6h (monotherapy alternative)\nOR Meropenem 1-2g IV q8h (if prior ESBL, recent hospitalization, or unstable)",
    pcn:"Aztreonam 2g IV q8h + Vancomycin 15-20 mg/kg IV q8-12h (if beta-lactam allergy)\nOR Ciprofloxacin 400mg IV q8h + Clindamycin 900mg IV q8h (less preferred — narrow spectrum)",
    mrsa:true, mrsa_agent:"Add Vancomycin if: catheter-related infection suspected, mucositis, skin infection, hemodynamic instability, or gram-positive bacteremia on culture",
    duration:"Until ANC >500 cells/mm3 (minimum 7 days), afebrile x48h, and cultures negative",
    deesc:"Risk stratify with MASCC score. Low risk (MASCC >=21): oral ciprofloxacin + amoxicillin-clavulanate for step-down if stable.",
    renal:"Cefepime: reduce dose if CrCl <30 (encephalopathy risk). Pip-tazo: reduce if eGFR <20.",
    notes:"IDSA 2010 febrile neutropenia guidelines. G-CSF not routinely indicated but consider if prolonged neutropenia expected. Antifungal prophylaxis (fluconazole) for high-risk; add empirically if fever persists >4-7 days on antibiotics." },

  { id:"dfi", label:"Diabetic Foot", full:"Diabetic Foot Infection", icon:"🦶",
    first:"Mild (superficial, localized): TMP-SMX DS + Cephalexin (MRSA + Strep coverage)\nModerate (deep tissue): Amoxicillin-clavulanate 875/125mg PO BID (no MRSA risk)\nSevere/limb-threatening: Pip-Tazo 4.5g IV q6h + Vancomycin (MRSA coverage)",
    pcn:"Mild: TMP-SMX DS + Clindamycin (if local clindamycin susceptibility >80%)\nSevere: Aztreonam 2g IV q8h + Vancomycin 15-20 mg/kg IV q8-12h + Metronidazole",
    mrsa:true, mrsa_agent:"TMP-SMX DS PO BID (mild-moderate outpatient)\nVancomycin IV (moderate-severe inpatient)",
    duration:"Mild: 5-7 days. Moderate: 2-4 weeks. Osteomyelitis: 6 weeks (or 2-5 days post-amputation).",
    deesc:"Deep wound cultures (not surface swabs) guide therapy. MRI for osteomyelitis — bone involvement dictates duration. Surgical consultation for necrosis, abscess, or gas.",
    renal:"TMP-SMX: avoid CrCl <15. Vancomycin: adjust per CrCl.",
    notes:"IDSA 2012 DFI guidelines. Probe-to-bone test (sensitivity ~60%, specificity ~91% for osteomyelitis). Vascular surgery referral if ABI <0.9. ESR/CRP useful for monitoring response." },
];

const TABS = ["Empiric Guide","Culture De-escalation"];

export default function AntibioticStewardshipHub() {
  const [tab,setTab] = useState(0);
  const [syn,setSyn] = useState("cap");
  const [pcnAllergy,setPcnAllergy] = useState(false);
  const [renalImp,setRenalImp] = useState(false);
  const [crcl,setCrcl] = useState("");
  const [org,setOrg] = useState("");
  const [sensitivities,setSensitivities] = useState("");
  const [site,setSite] = useState("");
  const [deescRes,setDeescRes] = useState(null);
  const [deescLoad,setDeescLoad] = useState(false);

  const selected = SYNDROMES.find(s=>s.id===syn)||SYNDROMES[0];

  const handleDeesc = async () => {
    if(!org.trim()||deescLoad) return;
    setDeescLoad(true);
    try {
      const r = await InvokeLLM({
        prompt:`You are an infectious disease pharmacist. Provide antibiotic de-escalation guidance for:
Organism: ${org}
Susceptibilities / Sensitivities: ${sensitivities||"Not specified"}
Infection site: ${site||"Not specified"}
Renal function: ${crcl?`CrCl ${crcl} mL/min`:"Not specified"}

Recommend: 1) Narrowest appropriate agent, 2) Dose and duration, 3) Rationale for choice, 4) Any resistance concerns.`,
        response_json_schema:{type:"object",properties:{
          recommended_agent:{type:"string"},
          dose_and_duration:{type:"string"},
          rationale:{type:"string"},
          resistance_concerns:{type:"string"},
          monitoring:{type:"string"}},
          required:["recommended_agent","dose_and_duration","rationale","resistance_concerns","monitoring"]},
      });
      setDeescRes(r);
    } catch { setDeescRes({_err:true}); }
    setDeescLoad(false);
  };

  const regimen = pcnAllergy ? selected.pcn : selected.first;

  return (
    <div style={{background:T.bg,minHeight:"100vh",padding:"20px 18px 60px",fontFamily:"DM Sans,sans-serif",color:T.txt}}>
      <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:22}}>
        <div style={{width:44,height:44,borderRadius:11,background:T.gD,border:`1px solid ${T.gB}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>🦠</div>
        <div>
          <h1 style={{margin:0,fontFamily:"Playfair Display,serif",fontSize:22,color:T.green,letterSpacing:"-0.5px",lineHeight:1}}>Antibiotic Stewardship Hub</h1>
          <p style={{margin:"3px 0 0",fontSize:12,color:T.mut}}>Empiric regimens · PCN-allergy alternatives · AI culture de-escalation · {SYNDROMES.length} syndromes</p>
        </div>
      </div>

      <div style={{...gl({padding:"10px 16px",marginBottom:16,display:"flex",gap:12,alignItems:"center",flexWrap:"wrap"})}}>
        <span style={{fontSize:9,color:T.dim,fontFamily:"JetBrains Mono,monospace",letterSpacing:1.5,textTransform:"uppercase",fontWeight:700}}>Patient Filters</span>
        <button onClick={()=>setPcnAllergy(p=>!p)} style={{padding:"5px 13px",borderRadius:7,cursor:"pointer",border:`1px solid ${pcnAllergy?T.coral+"55":T.bdr}`,background:pcnAllergy?T.cD:"transparent",color:pcnAllergy?T.coral:T.mut,fontSize:12,fontWeight:700,fontFamily:"DM Sans,sans-serif"}}>
          {pcnAllergy?"✓ PCN Allergy":"+ PCN Allergy"}
        </button>
        <button onClick={()=>setRenalImp(p=>!p)} style={{padding:"5px 13px",borderRadius:7,cursor:"pointer",border:`1px solid ${renalImp?T.gold+"55":T.bdr}`,background:renalImp?T.gldD:"transparent",color:renalImp?T.gold:T.mut,fontSize:12,fontWeight:700,fontFamily:"DM Sans,sans-serif"}}>
          {renalImp?"✓ Renal Impairment":"+ Renal Impairment"}
        </button>
        {renalImp&&(
          <div style={{position:"relative"}}>
            <input type="number" value={crcl} onChange={e=>setCrcl(e.target.value)} placeholder="CrCl" style={{...ib({width:100,padding:"5px 28px 5px 10px",fontSize:12})}} />
            <span style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",fontSize:9,color:T.dim,pointerEvents:"none"}}>mL/min</span>
          </div>
        )}
      </div>

      <div style={{display:"flex",gap:5,marginBottom:20,background:T.card,borderRadius:9,padding:4,border:`1px solid ${T.bdr}`,width:"fit-content"}}>
        {TABS.map((t,i)=>(
          <button key={t} onClick={()=>setTab(i)} style={{padding:"7px 20px",borderRadius:7,border:"none",cursor:"pointer",fontFamily:"DM Sans,sans-serif",fontSize:13,fontWeight:700,background:tab===i?T.green:"transparent",color:tab===i?"#060e1a":T.mut,transition:"all .16s"}}>{t}</button>
        ))}
      </div>

      {tab===0&&(
        <div className="abx-in" style={{display:"grid",gridTemplateColumns:"220px 1fr",gap:16,alignItems:"start"}}>
          <div style={{...gl({padding:"8px",overflow:"auto",maxHeight:580})}}>
            {SYNDROMES.map(s=>(
              <button key={s.id} onClick={()=>setSyn(s.id)} className="abx-hov" style={{display:"flex",alignItems:"center",gap:8,width:"100%",textAlign:"left",padding:"9px 11px",borderRadius:9,border:`1px solid ${syn===s.id?T.green+"55":T.bdr}`,background:syn===s.id?T.gD:T.card,cursor:"pointer",marginBottom:5,transition:"all .15s"}}>
                <span style={{fontSize:16,flexShrink:0}}>{s.icon}</span>
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:syn===s.id?T.green:T.txt}}>{s.label}</div>
                  <div style={{fontSize:10,color:T.mut,lineHeight:1.3}}>{s.full}</div>
                </div>
              </button>
            ))}
          </div>

          <div>
            <div style={{...gl({padding:"16px 20px",marginBottom:12})}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
                <span style={{fontSize:24}}>{selected.icon}</span>
                <h2 style={{margin:0,fontFamily:"Playfair Display,serif",fontSize:20,color:T.green,lineHeight:1.1}}>{selected.full}</h2>
              </div>
              <div style={{display:"flex",gap:6,marginTop:8}}>
                {pcnAllergy&&<span style={{...tg(T.coral),fontSize:10}}>PCN Allergy Regimen</span>}
                {selected.mrsa&&<span style={{...tg(T.orange),fontSize:10}}>⚠ MRSA Consideration</span>}
              </div>
            </div>

            <div style={{...gl({padding:"14px 18px",marginBottom:10,borderLeft:`4px solid ${pcnAllergy?T.coral:T.green}`})}}>
              <div style={{fontSize:9,color:pcnAllergy?T.coral:T.green,fontFamily:"JetBrains Mono,monospace",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>
                {pcnAllergy?"PCN-Allergy Alternative":"Empiric Regimen"}
              </div>
              <pre style={{margin:0,fontFamily:"DM Sans,sans-serif",fontSize:13,color:T.txt,lineHeight:1.75,whiteSpace:"pre-wrap"}}>{regimen}</pre>
            </div>

            {selected.mrsa&&selected.mrsa_agent&&(
              <div style={{...gl({padding:"12px 16px",marginBottom:10,borderLeft:`3px solid ${T.orange}`})}}>
                <div style={{fontSize:9,color:T.orange,fontFamily:"JetBrains Mono,monospace",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:6}}>MRSA Coverage</div>
                <pre style={{margin:0,fontFamily:"DM Sans,sans-serif",fontSize:12,color:T.mut,lineHeight:1.65,whiteSpace:"pre-wrap"}}>{selected.mrsa_agent}</pre>
              </div>
            )}

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
              <div style={{...gl({padding:"11px 14px",borderLeft:`3px solid ${T.teal}`})}}>
                <div style={{fontSize:9,color:T.teal,fontFamily:"JetBrains Mono,monospace",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:5}}>Duration</div>
                <div style={{fontSize:12,color:T.txt,lineHeight:1.55}}>{selected.duration}</div>
              </div>
              <div style={{...gl({padding:"11px 14px",borderLeft:`3px solid ${T.purple}`})}}>
                <div style={{fontSize:9,color:T.purple,fontFamily:"JetBrains Mono,monospace",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:5}}>De-escalation</div>
                <div style={{fontSize:12,color:T.txt,lineHeight:1.55}}>{selected.deesc}</div>
              </div>
            </div>

            {renalImp&&(
              <div style={{...gl({padding:"11px 14px",marginBottom:10,borderLeft:`3px solid ${T.gold}`})}}>
                <div style={{fontSize:9,color:T.gold,fontFamily:"JetBrains Mono,monospace",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:5}}>Renal Dosing Considerations</div>
                <div style={{fontSize:12,color:T.txt,lineHeight:1.55}}>{selected.renal}</div>
              </div>
            )}

            <div style={{...gl({padding:"11px 14px",borderLeft:`3px solid ${T.dim}`})}}>
              <div style={{fontSize:9,color:T.dim,fontFamily:"JetBrains Mono,monospace",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:5}}>Clinical Notes</div>
              <div style={{fontSize:12,color:T.mut,lineHeight:1.65}}>{selected.notes}</div>
            </div>
          </div>
        </div>
      )}

      {tab===1&&(
        <div className="abx-in" style={{maxWidth:600}}>
          <div style={{...gl({padding:"12px 16px",marginBottom:16,borderLeft:`3px solid ${T.green}`})}}>
            <div style={{fontSize:12,color:T.mut}}>Enter organism and susceptibility results — AI will recommend the narrowest appropriate de-escalation agent based on culture data and patient context.</div>
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:14}}>
            <div>
              <div style={{fontSize:8,color:T.dim,fontFamily:"JetBrains Mono,monospace",letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>Organism Identified</div>
              <input value={org} onChange={e=>setOrg(e.target.value)} placeholder="e.g. Klebsiella pneumoniae, MRSA, E. coli" style={{...ib()}} />
            </div>
            <div>
              <div style={{fontSize:8,color:T.dim,fontFamily:"JetBrains Mono,monospace",letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>Susceptibilities / MIC Data</div>
              <textarea value={sensitivities} onChange={e=>setSensitivities(e.target.value)} rows={4}
                placeholder={"Sensitive: ceftriaxone, ciprofloxacin, TMP-SMX\nResistant: ampicillin, nitrofurantoin"}
                style={{...ib({resize:"vertical",lineHeight:1.6})}} />
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div>
                <div style={{fontSize:8,color:T.dim,fontFamily:"JetBrains Mono,monospace",letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>Infection Site</div>
                <input value={site} onChange={e=>setSite(e.target.value)} placeholder="e.g. Bloodstream, UTI, Pneumonia" style={{...ib()}} />
              </div>
              <div>
                <div style={{fontSize:8,color:T.dim,fontFamily:"JetBrains Mono,monospace",letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>CrCl (optional)</div>
                <div style={{position:"relative"}}>
                  <input type="number" value={crcl} onChange={e=>setCrcl(e.target.value)} placeholder="—" style={{...ib({paddingRight:40})}} />
                  <span style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",fontSize:9,color:T.dim,pointerEvents:"none"}}>mL/min</span>
                </div>
              </div>
            </div>
          </div>

          <button onClick={handleDeesc} disabled={!org.trim()||deescLoad} style={{...ab(T.green,{display:"flex",alignItems:"center",gap:8,marginBottom:16,opacity:(!org.trim()||deescLoad)?0.4:1})}}>
            {deescLoad?<><Sp/>Analyzing cultures...</>:"🎯 Generate De-escalation Recommendation"}
          </button>

          {deescRes&&!deescRes._err&&(
            <div className="abx-in">
              {[["Recommended Agent",deescRes.recommended_agent,T.green],
                ["Dose & Duration",deescRes.dose_and_duration,T.teal],
                ["Rationale",deescRes.rationale,T.gold],
                ["Resistance Concerns",deescRes.resistance_concerns,T.coral],
                ["Monitoring",deescRes.monitoring,T.purple]].map(([l,v,c])=>v&&(
                <div key={l} style={{...gl({padding:"12px 16px",marginBottom:8,borderLeft:`3px solid ${c}55`})}}>
                  <div style={{fontSize:9,color:c,fontFamily:"JetBrains Mono,monospace",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:5}}>{l}</div>
                  <div style={{fontSize:13,color:T.txt,lineHeight:1.65}}>{v}</div>
                </div>
              ))}
              <div style={{fontSize:10,color:T.dim,marginTop:4}}>AI-generated · Verify against final susceptibilities · Consult Infectious Disease when appropriate</div>
            </div>
          )}
          {deescRes?._err&&<div style={{fontSize:12,color:T.coral,marginTop:8}}>AI unavailable. Consult clinical pharmacist or ID service.</div>}
        </div>
      )}

      <div style={{marginTop:40,textAlign:"center"}}>
        <span style={{fontFamily:"JetBrains Mono,monospace",fontSize:9,color:T.dim,letterSpacing:1.5}}>NOTRYA · ANTIBIOTIC STEWARDSHIP HUB · VERIFY AGAINST LOCAL ANTIBIOGRAM · CONSULT ID FOR COMPLEX CASES</span>
      </div>
    </div>
  );
}