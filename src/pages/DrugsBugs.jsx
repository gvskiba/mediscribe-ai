import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// ── Color tokens — identical to ClinicalNoteStudio ─────────────────
const C = {
  navy:"#050f1e", slate:"#0b1d35", panel:"#0d2240", edge:"#162d4f",
  border:"#1e3a5f", muted:"#2a4d72", dim:"#4a7299", text:"#c8ddf0",
  bright:"#e8f4ff", teal:"#00d4bc", amber:"#f5a623", red:"#ff5c6c",
  green:"#2ecc71", purple:"#9b6dff", blue:"#4a90d9", rose:"#f472b6", gold:"#f0c040",
};

// ── Sub-page route map — update slugs to match your Base44 pages ───
const PAGES = {
  DrugReference:        "DrugReference",
  AntibioticStewardship:"AntibioticStewardship",
  PediatricDosing:      "PediatricDosing",
};

// ── Quick-reference medication data (from MedicationReference JSON) ─
const QUICK_MEDS = [
  { id:"ketamine_pain",   cat:"analgesics",    name:"Ketamine",           line:"first",  dose:"0.1–0.3 mg/kg IV",    indication:"Sub-dissociative pain",   color:C.amber  },
  { id:"fentanyl",        cat:"analgesics",    name:"Fentanyl",           line:"first",  dose:"1–2 mcg/kg IV",        indication:"Moderate–severe pain",    color:C.amber  },
  { id:"adenosine",       cat:"cardiovascular",name:"Adenosine",          line:"first",  dose:"6 mg rapid IV push",   indication:"SVT termination",         color:C.red    },
  { id:"amiodarone",      cat:"cardiovascular",name:"Amiodarone",         line:"first",  dose:"300 mg IV push (VF)",  indication:"VF / pVT / Stable VT",    color:C.red    },
  { id:"norepinephrine",  cat:"cardiovascular",name:"Norepinephrine",     line:"first",  dose:"0.01–3 mcg/kg/min",    indication:"Septic shock vasopressor", color:C.red    },
  { id:"albuterol",       cat:"respiratory",   name:"Albuterol",          line:"first",  dose:"2.5 mg neb q20min×3",  indication:"Asthma / COPD / bronchospasm",color:C.blue},
  { id:"succinylcholine", cat:"respiratory",   name:"Succinylcholine",    line:"first",  dose:"1.5 mg/kg IV",         indication:"RSI — NMB",               color:C.blue   },
  { id:"rocuronium",      cat:"respiratory",   name:"Rocuronium",         line:"first",  dose:"1.2 mg/kg IV",         indication:"RSI — NMB (alt)",         color:C.blue   },
  { id:"vancomycin",      cat:"antimicrobials",name:"Vancomycin",         line:"first",  dose:"25–30 mg/kg IV load",  indication:"MRSA / Sepsis empiric",   color:C.green  },
  { id:"pip_tazo",        cat:"antimicrobials",name:"Pip-Tazo",           line:"first",  dose:"4.5 g IV q6–8h",       indication:"Sepsis / HAP / IAI",      color:C.green  },
  { id:"ceftriaxone",     cat:"antimicrobials",name:"Ceftriaxone",        line:"first",  dose:"1–2 g IV q24h",        indication:"CAP / Meningitis / UTI",  color:C.green  },
  { id:"lorazepam",       cat:"neuro",         name:"Lorazepam",          line:"first",  dose:"0.1 mg/kg IV (max 4mg)",indication:"Status epilepticus",     color:C.purple },
  { id:"levetiracetam",   cat:"neuro",         name:"Levetiracetam",      line:"first",  dose:"60 mg/kg IV (max 4500mg)",indication:"Seizure (post-benzo)", color:C.purple },
  { id:"naloxone",        cat:"neuro",         name:"Naloxone",           line:"first",  dose:"0.4–2 mg IV/IM/IN",    indication:"Opioid reversal",         color:C.purple },
  { id:"ondansetron",     cat:"gi_gu_ob",      name:"Ondansetron",        line:"first",  dose:"4–8 mg IV/PO q4–6h",   indication:"Nausea / vomiting",       color:C.gold   },
  { id:"mag_eclampsia",   cat:"gi_gu_ob",      name:"Magnesium (OB)",     line:"first",  dose:"4–6 g IV load, 1–2 g/hr",indication:"Eclampsia / Pre-E",    color:C.gold   },
];

const CATEGORIES = [
  { id:"all",           label:"All",             color:C.dim    },
  { id:"analgesics",    label:"Analgesics",       color:C.amber  },
  { id:"cardiovascular",label:"Cardiovascular",   color:C.red    },
  { id:"respiratory",   label:"Respiratory",      color:C.blue   },
  { id:"antimicrobials",label:"Antimicrobials",   color:C.green  },
  { id:"neuro",         label:"Neurological",     color:C.purple },
  { id:"gi_gu_ob",      label:"GI / GU / OB",    color:C.gold   },
];

// ── Sepsis hour-1 bundle quick reference ──────────────────────────
const HOUR1_BUNDLE = [
  { step:1, action:"Measure Lactate",         detail:"Re-check if initial > 2 mmol/L at 2 hr",          priority:"high"     },
  { step:2, action:"Blood Cultures × 2",      detail:"Before antibiotics — do NOT delay > 45 min",       priority:"high"     },
  { step:3, action:"Broad-Spectrum Abx",      detail:"Within 1 hr of recognition",                       priority:"critical" },
  { step:4, action:"30 mL/kg Crystalloid",    detail:"LR preferred (SMART trial); reassess q500 mL",     priority:"critical" },
  { step:5, action:"Vasopressors PRN",        detail:"MAP < 65 mmHg → Norepinephrine 0.01 mcg/kg/min",   priority:"high"     },
];

// ── Empiric antibiotic quick-picks ────────────────────────────────
const EMPIRIC_ABXS = [
  { id:"mod_community",  severity:"Moderate — Community",     regimen:"Ceftriaxone 2 g IV q24h",                             add:"+ Azithromycin 500 mg if PNA",   color:C.green  },
  { id:"severe_shock",   severity:"Severe / Septic Shock",    regimen:"Pip-Tazo 4.5 g IV q6–8h (extended 4 hr)",            add:"+ Vancomycin if MRSA risk",      color:C.amber  },
  { id:"esbl_hap",       severity:"ESBL / HAP / MDR Risk",    regimen:"Meropenem 1–2 g IV q8h (extended 3 hr)",             add:"+ Vancomycin for MRSA",          color:C.red    },
  { id:"cap_pna",        severity:"CAP — Pneumonia",          regimen:"Ceftriaxone 1–2 g IV q24h + Azithromycin 500 mg",    add:"Alt: Levofloxacin 750 mg",       color:C.blue   },
  { id:"uti_pyelo",      severity:"Urosepsis / Pyelonephritis",regimen:"Ceftriaxone 1–2 g IV q24h",                          add:"Pip-Tazo if healthcare-assoc",   color:C.teal   },
  { id:"meningitis",     severity:"Bacterial Meningitis",     regimen:"Ceftriaxone 2 g IV q12h + Vancomycin 15 mg/kg q8h", add:"+ Dexamethasone 0.15 mg/kg",     color:C.purple },
];

// ── Broselow zones ─────────────────────────────────────────────────
const BROSELOW = [
  { min:3,  max:5,  zone:"Grey",   hex:"#9ca3af" },
  { min:5,  max:7,  zone:"Pink",   hex:"#ec4899" },
  { min:7,  max:9,  zone:"Red",    hex:"#ef4444" },
  { min:9,  max:11, zone:"Purple", hex:"#8b5cf6" },
  { min:11, max:14, zone:"Yellow", hex:"#eab308" },
  { min:14, max:18, zone:"White",  hex:"#e5e7eb" },
  { min:18, max:23, zone:"Blue",   hex:"#3b82f6"  },
  { min:23, max:29, zone:"Orange", hex:"#f97316" },
  { min:29, max:36, zone:"Green",  hex:"#22c55e" },
  { min:36, max:null,zone:"Adult", hex:"#6b7280" },
];

// ── Shared card wrapper ────────────────────────────────────────────
function Card({title,badge,badgeColor=C.blue,icon,children,style={}}){
  return(
    <div style={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden",...style}}>
      <div style={{padding:"10px 16px",background:"rgba(0,0,0,.18)",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:8}}>
        {icon&&<span style={{fontSize:14}}>{icon}</span>}
        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,fontWeight:700,color:C.dim,letterSpacing:".1em",flex:1}}>{title}</span>
        {badge&&<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:7,background:`${badgeColor}18`,border:`1px solid ${badgeColor}44`,color:badgeColor}}>{badge}</span>}
      </div>
      <div style={{padding:"14px 16px"}}>{children}</div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────
export default function DrugsAndBugs(){
  const navigate = useNavigate();
  const [clock, setClock] = useState("");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [activeSection, setActiveSection] = useState("hub"); // hub | quickref | sepsis | abx | peds
  const [hoveredMed, setHoveredMed] = useState(null);
  const [weightKg, setWeightKg] = useState("");

  useEffect(()=>{
    const iv = setInterval(()=>setClock(new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:false})),1000);
    return()=>clearInterval(iv);
  },[]);

  const filteredMeds = QUICK_MEDS.filter(m=>{
    const matchCat = catFilter==="all" || m.cat===catFilter;
    const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.indication.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const broselowZone = weightKg ? BROSELOW.find(z=>+weightKg>=z.min&&(z.max===null||+weightKg<z.max)) : null;

  // ── Nav links ──────────────────────────────────────────────────
  const NAV_SECTIONS = [
    { id:"hub",      icon:"🧬", label:"Overview",           sub:"Hub dashboard"         },
    { id:"quickref", icon:"💊", label:"Quick Drug Ref",     sub:"Bedside lookup"        },
    { id:"sepsis",   icon:"🦠", label:"Sepsis Protocol",    sub:"Hour-1 bundle"         },
    { id:"abx",      icon:"🧫", label:"Empiric Antibiotics",sub:"Source-directed"       },
    { id:"peds",     icon:"👶", label:"Peds Quick Calc",    sub:"Broselow / dosing"     },
  ];

  // ── Three sub-page cards (hub) ─────────────────────────────────
  const SUB_PAGES = [
    {
      page: PAGES.DrugReference,
      icon:"💊", title:"Drug Reference",
      desc:"Complete ED medication formulary — dosing, contraindications, reversal agents, monitoring parameters, and pregnancy categories.",
      color:C.teal,
      stats:[{label:"Medications",value:"36+"},{label:"Categories",value:"6"},{label:"Guidelines",value:"ACEP"}],
      badge:"Full Reference",
    },
    {
      page: PAGES.AntibioticStewardship,
      icon:"🧫", title:"Antibiotic Stewardship",
      desc:"Sepsis empiric regimens, source-directed antibiotics, de-escalation protocols, and culture-guided therapy per SSC 2018.",
      color:C.green,
      stats:[{label:"Regimens",value:"7+"},{label:"Sources",value:"6"},{label:"Trial",value:"SMART"}],
      badge:"SSC 2018",
    },
    {
      page: PAGES.PediatricDosing,
      icon:"👶", title:"Pediatric Dosing",
      desc:"Weight-based dosing calculator with Broselow zones, PALS arrest dosing, ET tube sizing, and PHOENIX Sepsis Criteria 2024.",
      color:C.purple,
      stats:[{label:"Formulas",value:"5"},{label:"Zones",value:"9"},{label:"Criteria",value:"PHOENIX"}],
      badge:"PHOENIX 2024",
    },
  ];

  // ── Rendered content per section ──────────────────────────────
  const renderContent = () => {
    switch(activeSection){

      // ── HUB ────────────────────────────────────────────────────
      case "hub": return(
        <div style={{width:"100%",padding:"20px"}}>

          {/* Hero bar */}
          <div style={{background:"linear-gradient(135deg,rgba(0,212,188,.07),rgba(155,109,255,.04))",border:`1px solid rgba(0,212,188,.2)`,borderRadius:16,padding:"18px 22px",marginBottom:20,display:"flex",alignItems:"center",gap:16}}>
            <div style={{fontSize:36,lineHeight:1}}>🧬</div>
            <div style={{flex:1}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:C.bright,letterSpacing:"-.02em"}}>Drugs & Bugs</div>
              <div style={{fontSize:13,color:C.dim,marginTop:2}}>Emergency pharmacology reference · Antibiotic stewardship · Pediatric dosing</div>
            </div>
            <div style={{display:"flex",gap:8}}>
              {[{lbl:"Medications",val:"36+",c:C.teal},{lbl:"Abx Regimens",val:"13+",c:C.green},{lbl:"Guidelines",val:"8",c:C.purple}].map(s=>(
                <div key={s.lbl} style={{textAlign:"center",padding:"8px 16px",borderRadius:12,background:C.edge,border:`1px solid ${C.border}`}}>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:18,fontWeight:700,color:s.c}}>{s.val}</div>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:C.dim,marginTop:2}}>{s.lbl}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Three sub-page navigation cards */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:20}}>
            {SUB_PAGES.map(sp=>(
              <motion.div key={sp.page} whileHover={{y:-3,boxShadow:`0 12px 40px ${sp.color}18`}} transition={{duration:.15}} onClick={()=>navigate(createPageUrl(sp.page))} style={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:16,padding:"18px",cursor:"pointer",position:"relative",overflow:"hidden"}}>
                {/* Accent glow */}
                <div style={{position:"absolute",top:0,right:0,width:120,height:120,borderRadius:"50%",background:`radial-gradient(circle,${sp.color}12,transparent 70%)`,pointerEvents:"none"}} />
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                  <div style={{width:42,height:42,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,background:`${sp.color}14`,border:`1px solid ${sp.color}33`,flexShrink:0}}>{sp.icon}</div>
                  <div>
                    <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,color:C.bright}}>{sp.title}</div>
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:700,color:sp.color,letterSpacing:".1em"}}>{sp.badge}</div>
                  </div>
                </div>
                <div style={{fontSize:12,color:C.dim,lineHeight:1.7,marginBottom:14}}>{sp.desc}</div>
                <div style={{display:"flex",gap:8,marginBottom:14}}>
                  {sp.stats.map(s=>(
                    <div key={s.label} style={{flex:1,textAlign:"center",padding:"5px 4px",borderRadius:9,background:C.edge,border:`1px solid ${C.border}`}}>
                      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:14,fontWeight:700,color:sp.color}}>{s.value}</div>
                      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:C.muted}}>{s.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:sp.color,fontWeight:700}}>Open Module →</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bottom two panels: Sepsis snapshot + Quick-pick antibiotics */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <Card title="SEPSIS HOUR-1 BUNDLE" icon="🦠" badge="SSC 2018" badgeColor={C.red}>
              {HOUR1_BUNDLE.map((s,i)=>(
                <div key={i} style={{display:"flex",gap:10,padding:"8px 0",borderBottom:i<HOUR1_BUNDLE.length-1?`1px solid ${C.border}`:"none",alignItems:"flex-start"}}>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,fontWeight:700,width:18,height:18,borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",background:s.priority==="critical"?"rgba(255,92,108,.15)":"rgba(74,144,217,.1)",border:`1px solid ${s.priority==="critical"?"rgba(255,92,108,.35)":"rgba(74,144,217,.25)"}`,color:s.priority==="critical"?C.red:C.blue,marginTop:1}}>{s.step}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:600,color:C.bright}}>{s.action}</div>
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:C.dim,marginTop:2}}>{s.detail}</div>
                  </div>
                  {s.priority==="critical"&&<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,fontWeight:700,padding:"1px 6px",borderRadius:5,background:"rgba(255,92,108,.12)",border:"1px solid rgba(255,92,108,.3)",color:C.red,flexShrink:0,marginTop:1}}>CRITICAL</span>}
                </div>
              ))}
              <button onClick={()=>setActiveSection("sepsis")} style={{marginTop:10,width:"100%",padding:"8px",borderRadius:10,background:"rgba(255,92,108,.07)",border:"1px solid rgba(255,92,108,.28)",color:C.red,fontSize:12,fontWeight:600,cursor:"pointer"}}>View Full Protocol →</button>
            </Card>

            <Card title="EMPIRIC ANTIBIOTIC QUICK-PICK" icon="🧫" badge="Source-Directed" badgeColor={C.green}>
              {EMPIRIC_ABXS.slice(0,4).map((abx,i)=>(
                <div key={i} style={{padding:"8px 10px",borderRadius:10,background:C.edge,border:`1px solid ${C.border}`,marginBottom:6}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                    <div style={{width:5,height:5,borderRadius:"50%",background:abx.color,flexShrink:0}} />
                    <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:700,color:abx.color}}>{abx.severity}</span>
                  </div>
                  <div style={{fontSize:12,color:C.bright,fontWeight:500,marginBottom:2}}>{abx.regimen}</div>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:C.dim}}>{abx.add}</div>
                </div>
              ))}
              <button onClick={()=>navigate(createPageUrl(PAGES.AntibioticStewardship))} style={{marginTop:6,width:"100%",padding:"8px",borderRadius:10,background:"rgba(46,204,113,.07)",border:"1px solid rgba(46,204,113,.28)",color:C.green,fontSize:12,fontWeight:600,cursor:"pointer"}}>All Regimens in Stewardship →</button>
            </Card>
          </div>
        </div>
      );

      // ── QUICK DRUG REFERENCE ────────────────────────────────────
      case "quickref": return(
        <div style={{width:"100%",padding:"20px"}}>
          <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
            <div style={{position:"relative",flex:1,minWidth:200}}>
              <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",fontSize:13,pointerEvents:"none"}}>🔍</span>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search medications or indications..." style={{width:"100%",background:C.edge,border:`1px solid ${C.border}`,borderRadius:10,padding:"8px 10px 8px 32px",color:C.text,fontFamily:"'DM Sans',sans-serif",fontSize:13,outline:"none"}} />
            </div>
            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
              {CATEGORIES.map(c=>(
                <button key={c.id} onClick={()=>setCatFilter(c.id)} style={{padding:"5px 12px",borderRadius:8,fontSize:11,fontWeight:600,cursor:"pointer",border:"1px solid",borderColor:catFilter===c.id?c.color:C.border,background:catFilter===c.id?`${c.color}18`:"transparent",color:catFilter===c.id?c.color:C.dim,transition:"all .15s"}}>
                  {c.label}
                </button>
              ))}
            </div>
            <button onClick={()=>navigate(createPageUrl(PAGES.DrugReference))} style={{padding:"7px 14px",borderRadius:10,background:`linear-gradient(135deg,${C.teal},#00b8a5)`,border:"none",color:C.navy,fontSize:12,fontWeight:700,cursor:"pointer",flexShrink:0,whiteSpace:"nowrap"}}>Full Reference →</button>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))",gap:10}}>
            {filteredMeds.map(med=>(
              <motion.div key={med.id} layout initial={{opacity:0,scale:.97}} animate={{opacity:1,scale:1}} transition={{duration:.12}} onMouseEnter={()=>setHoveredMed(med.id)} onMouseLeave={()=>setHoveredMed(null)} style={{background:C.panel,border:`1px solid ${hoveredMed===med.id?med.color+"55":C.border}`,borderRadius:13,padding:"13px 14px",cursor:"pointer",transition:"border-color .15s",position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:0,right:0,width:80,height:80,borderRadius:"50%",background:`radial-gradient(circle,${med.color}0a,transparent 70%)`,pointerEvents:"none"}} />
                <div style={{display:"flex",alignItems:"flex-start",gap:8,marginBottom:8}}>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,color:C.bright}}>{med.name}</div>
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:med.color,fontWeight:700,marginTop:2,letterSpacing:".07em"}}>{med.indication}</div>
                  </div>
                  <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,fontWeight:700,padding:"2px 6px",borderRadius:6,background:`${med.color}15`,border:`1px solid ${med.color}35`,color:med.color,flexShrink:0,textTransform:"uppercase"}}>{med.cat.replace(/_/g," ")}</span>
                </div>
                <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:C.teal,fontWeight:600,marginBottom:4}}>{med.dose}</div>
                <div style={{display:"flex",gap:6,marginTop:8,justifyContent:"flex-end"}}>
                  <button onClick={()=>navigate(createPageUrl(PAGES.DrugReference))} style={{padding:"3px 10px",borderRadius:7,fontSize:10,fontWeight:600,cursor:"pointer",background:"transparent",border:`1px solid ${C.border}`,color:C.dim}}>Full Info</button>
                  {med.cat==="antimicrobials"&&<button onClick={()=>navigate(createPageUrl(PAGES.AntibioticStewardship))} style={{padding:"3px 10px",borderRadius:7,fontSize:10,fontWeight:600,cursor:"pointer",background:"rgba(46,204,113,.1)",border:"1px solid rgba(46,204,113,.28)",color:C.green}}>Stewardship</button>}
                </div>
              </motion.div>
            ))}
            {filteredMeds.length===0&&(
              <div style={{gridColumn:"1/-1",textAlign:"center",padding:"40px 20px",color:C.muted}}>
                <div style={{fontSize:28,marginBottom:8,opacity:.4}}>💊</div>
                <div style={{fontSize:13}}>No medications match your search.</div>
              </div>
            )}
          </div>
        </div>
      );

      // ── SEPSIS PROTOCOL ────────────────────────────────────────
      case "sepsis": return(
        <div style={{width:"100%",padding:"20px"}}>
          <div style={{display:"flex",gap:10,marginBottom:16,alignItems:"center"}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700,color:C.bright}}>Sepsis Protocol</div>
            <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:7,background:"rgba(255,92,108,.12)",border:"1px solid rgba(255,92,108,.3)",color:C.red}}>SSC 2018</span>
            <div style={{flex:1}} />
            <button onClick={()=>navigate(createPageUrl(PAGES.AntibioticStewardship))} style={{padding:"7px 14px",borderRadius:10,background:`linear-gradient(135deg,${C.green},#1db862)`,border:"none",color:C.navy,fontSize:12,fontWeight:700,cursor:"pointer"}}>Full Stewardship Module →</button>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
            <Card title="HOUR-1 BUNDLE" icon="⏱️" badge="ALL within 60 min" badgeColor={C.red}>
              {HOUR1_BUNDLE.map((s,i)=>(
                <div key={i} style={{display:"flex",gap:10,padding:"10px 0",borderBottom:i<HOUR1_BUNDLE.length-1?`1px solid ${C.border}`:"none",alignItems:"flex-start"}}>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:700,width:22,height:22,borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",background:s.priority==="critical"?"rgba(255,92,108,.15)":"rgba(74,144,217,.1)",border:`1px solid ${s.priority==="critical"?"rgba(255,92,108,.35)":"rgba(74,144,217,.25)"}`,color:s.priority==="critical"?C.red:C.blue,marginTop:1}}>{s.step}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:600,color:C.bright}}>{s.action}</div>
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:C.dim,marginTop:2,lineHeight:1.5}}>{s.detail}</div>
                  </div>
                  <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,fontWeight:700,padding:"2px 6px",borderRadius:5,background:s.priority==="critical"?"rgba(255,92,108,.12)":"rgba(74,144,217,.08)",border:`1px solid ${s.priority==="critical"?"rgba(255,92,108,.3)":"rgba(74,144,217,.22)"}`,color:s.priority==="critical"?C.red:C.blue,flexShrink:0,marginTop:1,textTransform:"uppercase"}}>{s.priority}</span>
                </div>
              ))}
            </Card>

            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <Card title="LACTATE TARGETS" icon="🔬" badgeColor={C.amber}>
                {[["Initial > 4 mmol/L","HIGH RISK — Initiate bundle immediately",C.red],["Initial 2–4 mmol/L","Re-check at 2 hr — target ≥10% clearance",C.amber],["Clearance < 10% at 2 hr","Reassess volume, vasopressors, source control",C.amber],["MAP Target","≥ 65 mmHg",C.teal]].map(([lbl,val,col],i)=>(
                  <div key={i} style={{display:"flex",gap:8,padding:"7px 0",borderBottom:i<3?`1px solid ${C.border}`:"none",alignItems:"center"}}>
                    <div style={{width:5,height:5,borderRadius:"50%",background:col,flexShrink:0}} />
                    <div style={{flex:1,fontSize:11,color:C.text}}>{lbl}</div>
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:col,fontWeight:600,textAlign:"right"}}>{val}</div>
                  </div>
                ))}
              </Card>

              <Card title="VASOPRESSOR GUIDE" icon="💉" badgeColor={C.purple}>
                {[{name:"Norepinephrine",note:"FIRST-LINE — 0.01–3 mcg/kg/min",c:C.teal},{name:"Vasopressin",note:"Add-on — 0.03 units/min (fixed)",c:C.blue},{name:"Epinephrine",note:"Cardiogenic shock adjunct",c:C.amber},{name:"Push-dose Epi",note:"10–20 mcg IV bolus q2–5 min",c:C.red}].map((v,i)=>(
                  <div key={i} style={{display:"flex",gap:8,padding:"7px 0",borderBottom:i<3?`1px solid ${C.border}`:"none",alignItems:"center"}}>
                    <div style={{width:5,height:5,borderRadius:"50%",background:v.c,flexShrink:0}} />
                    <div style={{flex:1}}>
                      <div style={{fontSize:12,fontWeight:600,color:C.bright}}>{v.name}</div>
                      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:C.dim}}>{v.note}</div>
                    </div>
                  </div>
                ))}
              </Card>
            </div>
          </div>

          <Card title="FLUID RESUSCITATION" icon="🩸" badge="SMART Trial" badgeColor={C.blue}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
              {[{name:"Lactated Ringer's",dose:"30 mL/kg IV (initial bolus)",note:"FIRST-LINE per SMART + SALT-ED trials; reduces AKI vs NS",c:C.teal},{name:"0.9% Normal Saline",dose:"30 mL/kg IV",note:"Use if LR unavailable; risk hyperchloremic acidosis with large volumes",c:C.blue},{name:"Albumin 5%",dose:"200–300 mL bolus over 30–60 min",note:"Adjunct when crystalloid > 4 L; not first-line (ALBIOS trial)",c:C.amber}].map((f,i)=>(
                <div key={i} style={{background:C.edge,border:`1px solid ${f.c}33`,borderRadius:12,padding:12}}>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:700,color:f.c,marginBottom:5,letterSpacing:".08em"}}>{f.name}</div>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:700,color:C.bright,marginBottom:5}}>{f.dose}</div>
                  <div style={{fontSize:11,color:C.dim,lineHeight:1.55}}>{f.note}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      );

      // ── EMPIRIC ANTIBIOTICS ────────────────────────────────────
      case "abx": return(
        <div style={{width:"100%",padding:"20px"}}>
          <div style={{display:"flex",gap:10,marginBottom:16,alignItems:"center"}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700,color:C.bright}}>Empiric Antibiotic Selection</div>
            <div style={{flex:1}} />
            <button onClick={()=>navigate(createPageUrl(PAGES.AntibioticStewardship))} style={{padding:"7px 14px",borderRadius:10,background:`linear-gradient(135deg,${C.green},#1db862)`,border:"none",color:C.navy,fontSize:12,fontWeight:700,cursor:"pointer"}}>Full Stewardship Module →</button>
          </div>

          <div style={{background:"rgba(245,166,35,.06)",border:"1px solid rgba(245,166,35,.3)",borderRadius:12,padding:"10px 14px",marginBottom:14,display:"flex",gap:10,alignItems:"flex-start"}}>
            <span>⏱️</span>
            <div>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,fontWeight:700,color:C.amber,marginBottom:2}}>TIMING RULE</div>
              <div style={{fontSize:12,color:C.text,lineHeight:1.6}}>Administer within <strong style={{color:C.amber}}>1 hour</strong> of sepsis/septic shock recognition. Do not delay > 3 hr for uncomplicated sepsis. Obtain ≥ 2 blood culture sets before antibiotics — <strong>do not delay antibiotics &gt; 45 min</strong> for cultures.</div>
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
            {EMPIRIC_ABXS.map(abx=>(
              <div key={abx.id} style={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:14,padding:"14px",position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:0,left:0,width:4,height:"100%",background:abx.color,borderRadius:"14px 0 0 14px"}} />
                <div style={{paddingLeft:10}}>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:700,color:abx.color,letterSpacing:".1em",marginBottom:6}}>{abx.severity}</div>
                  <div style={{fontSize:13,fontWeight:600,color:C.bright,marginBottom:4}}>{abx.regimen}</div>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:C.dim,marginBottom:10}}>{abx.add}</div>
                  <button onClick={()=>navigate(createPageUrl(PAGES.AntibioticStewardship))} style={{padding:"4px 10px",borderRadius:8,fontSize:10,fontWeight:600,cursor:"pointer",background:`${abx.color}12`,border:`1px solid ${abx.color}33`,color:abx.color}}>View protocol →</button>
                </div>
              </div>
            ))}
          </div>

          <Card title="DE-ESCALATION REMINDER" icon="📉" badge="Stewardship" badgeColor={C.teal}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
              {[{step:"48–72 hr",action:"Review culture & sensitivity results",color:C.teal},{step:"Culture-guided",action:"De-escalate to narrowest effective spectrum",color:C.green},{step:"Duration",action:"Source-dependent — reassess daily for D/C criteria",color:C.blue}].map((r,i)=>(
                <div key={i} style={{background:C.edge,borderRadius:11,padding:11,border:`1px solid ${r.color}28`}}>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:700,color:r.color,marginBottom:5}}>{r.step}</div>
                  <div style={{fontSize:12,color:C.text,lineHeight:1.55}}>{r.action}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      );

      // ── PEDS QUICK CALC ────────────────────────────────────────
      case "peds": return(
        <div style={{width:"100%",padding:"20px"}}>
          <div style={{display:"flex",gap:10,marginBottom:16,alignItems:"center"}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700,color:C.bright}}>Pediatric Quick Reference</div>
            <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:7,background:"rgba(155,109,255,.12)",border:"1px solid rgba(155,109,255,.3)",color:C.purple}}>PHOENIX 2024</span>
            <div style={{flex:1}} />
            <button onClick={()=>navigate(createPageUrl(PAGES.PediatricDosing))} style={{padding:"7px 14px",borderRadius:10,background:`linear-gradient(135deg,${C.purple},#7c3aed)`,border:"none",color:C.bright,fontSize:12,fontWeight:700,cursor:"pointer"}}>Full Peds Dosing Calculator →</button>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
            {/* Weight estimator */}
            <Card title="WEIGHT ESTIMATION" icon="⚖️" badge="Luscombe-Owens" badgeColor={C.purple}>
              <div style={{marginBottom:12}}>
                <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:C.dim,marginBottom:4}}>ENTER WEIGHT (kg) FOR BROSELOW ZONE</div>
                <input value={weightKg} onChange={e=>setWeightKg(e.target.value)} type="number" placeholder="e.g. 15" style={{width:"100%",background:C.edge,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 10px",color:C.bright,fontFamily:"'JetBrains Mono',monospace",fontSize:16,outline:"none"}} />
              </div>
              {broselowZone&&(
                <div style={{padding:"12px",borderRadius:12,background:`${broselowZone.hex}18`,border:`2px solid ${broselowZone.hex}55`,marginBottom:12,textAlign:"center"}}>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:broselowZone.hex,fontWeight:700,marginBottom:2}}>BROSELOW ZONE</div>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:broselowZone.hex}}>{broselowZone.zone}</div>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:C.dim,marginTop:2}}>{broselowZone.min}–{broselowZone.max||"36+"}  kg</div>
                </div>
              )}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                {[["Age 2–12","(Age × 3) + 7 kg"],["1–2 yrs","10 + ((age−1) × 2.5) kg"],["3–12 mo","6 + ((mo−3) × 0.5) kg"],["0–3 mo","3.5 + (mo × 0.9) kg"]].map(([age,formula],i)=>(
                  <div key={i} style={{background:C.edge,borderRadius:8,padding:"7px 9px",border:`1px solid ${C.border}`}}>
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:C.purple,fontWeight:700}}>{age}</div>
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:C.dim,marginTop:2}}>{formula}</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* PALS arrest dosing */}
            <Card title="PALS CARDIAC ARREST DOSING" icon="💗" badge="Weight-based" badgeColor={C.red}>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:C.dim,marginBottom:8}}>ENTER WEIGHT ABOVE FOR AUTO-CALC — ESTIMATED AT {weightKg||"—"} kg</div>
              {[{drug:"Epinephrine",dose:"0.01 mg/kg IV/IO",calc:weightKg?`= ${(+weightKg*0.01).toFixed(2)} mg`:"",note:"q3–5 min; max 1 mg",c:C.red},{drug:"Amiodarone",dose:"5 mg/kg IV/IO",calc:weightKg?`= ${(+weightKg*5).toFixed(0)} mg`:"",note:"VF/pVT; max 300 mg",c:C.amber},{drug:"Atropine",dose:"0.02 mg/kg IV/IO",calc:weightKg?`= ${(+weightKg*0.02).toFixed(2)} mg`:"",note:"Min 0.1 mg; max 0.5 mg",c:C.blue},{drug:"Adenosine",dose:"0.1 mg/kg rapid IV",calc:weightKg?`= ${(+weightKg*0.1).toFixed(1)} mg`:"",note:"SVT; max 6 mg first dose",c:C.purple},{drug:"Sodium Bicarb",dose:"1 mEq/kg IV/IO",calc:weightKg?`= ${(+weightKg*1).toFixed(0)} mEq`:"",note:"Dilute 1:1 in peds",c:C.teal}].map((d,i)=>(
                <div key={i} style={{display:"flex",gap:10,padding:"8px 0",borderBottom:i<4?`1px solid ${C.border}`:"none",alignItems:"center"}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:600,color:C.bright}}>{d.drug}</div>
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:C.dim}}>{d.note}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:d.c,fontWeight:700}}>{d.dose}</div>
                    {d.calc&&<div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:C.teal,marginTop:1}}>{d.calc}</div>}
                  </div>
                </div>
              ))}
            </Card>
          </div>

          <Card title="BROSELOW TAPE ZONES" icon="📏" badge="Color Reference" badgeColor={C.teal}>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {BROSELOW.map(z=>(
                <div key={z.zone} style={{flex:"1 0 80px",minWidth:80,padding:"8px 6px",borderRadius:10,background:`${z.hex}18`,border:`2px solid ${z.hex}55`,textAlign:"center",cursor:"pointer",transition:"all .15s",transform:broselowZone?.zone===z.zone?"scale(1.08)":"scale(1)"}}>
                  <div style={{width:16,height:16,borderRadius:"50%",background:z.hex,margin:"0 auto 5px"}} />
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,fontWeight:700,color:z.hex}}>{z.zone}</div>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:C.muted,marginTop:2}}>{z.min}–{z.max||"36+"}kg</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      );

      default: return null;
    }
  };

  // ── Render ─────────────────────────────────────────────────────
  return(
    <div style={{fontFamily:"'DM Sans',sans-serif",background:C.navy,color:C.text,minHeight:"100vh",display:"flex",flexDirection:"column"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;900&family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.25}}
        @keyframes spin{to{transform:rotate(360deg)}}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#1e3a5f;border-radius:2px}
        input,textarea{transition:border-color .15s}
        input:focus,textarea:focus{border-color:#4a7299 !important;outline:none}
        input::placeholder,textarea::placeholder{color:#2a4d72}
      `}</style>

      {/* ── In-page nav tabs ──────────────────────────────────── */}
      <div style={{display:"flex",gap:2,padding:"12px 20px",borderBottom:`1px solid ${C.border}`,overflowX:"auto",flexWrap:"wrap",width:"100%",boxSizing:"border-box"}}>
        {NAV_SECTIONS.map(sec=>{
          const isActive=activeSection===sec.id;
          return(
            <button key={sec.id} onClick={()=>setActiveSection(sec.id)} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:10,cursor:"pointer",background:isActive?"rgba(0,212,188,.12)":"transparent",border:`1px solid ${isActive?"rgba(0,212,188,.3)":C.border}`,transition:"all .15s",whiteSpace:"nowrap"}}>
              <span style={{fontSize:14}}>{sec.icon}</span>
              <span style={{fontSize:12,fontWeight:500,color:isActive?C.teal:C.text}}>{sec.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Main Content ───────────────────────────────────────── */}
      <div style={{overflowY:"auto",flex:1}}>
        <AnimatePresence mode="wait">
          <motion.div key={activeSection} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-4}} transition={{duration:.15}}>
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}