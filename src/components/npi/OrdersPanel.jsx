import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

// ── Tier helpers ──────────────────────────────────────────────────────────────
const TC = { STAT:"var(--npi-coral)", URGENT:"var(--npi-orange)", ROUTINE:"var(--npi-txt4)" };
const TB = { STAT:"rgba(255,107,107,.12)", URGENT:"rgba(255,159,67,.12)", ROUTINE:"rgba(255,255,255,.05)" };
const TD = { STAT:"rgba(255,107,107,.28)", URGENT:"rgba(255,159,67,.28)", ROUTINE:"rgba(255,255,255,.10)" };
const TL = { STAT:"var(--npi-coral)", URGENT:"var(--npi-orange)", ROUTINE:"rgba(255,255,255,.15)" };

// ── Category icons ────────────────────────────────────────────────────────────
const CAT_ICON = { lab:"🧪", medication:"💊", iv:"💧", imaging:"🔬", procedure:"⚙️", consult:"👤", monitoring:"📡" };

function TierBadge({ tier }) {
  return (
    <span style={{ display:"inline-flex", padding:"1px 7px", borderRadius:20, fontSize:9, fontWeight:700, letterSpacing:.5, whiteSpace:"nowrap", background:TB[tier]||TB.ROUTINE, color:TC[tier]||TC.ROUTINE, border:`1px solid ${TD[tier]||TD.ROUTINE}` }}>
      {tier}
    </span>
  );
}

// ── Clinical data ─────────────────────────────────────────────────────────────
const LABS = {
  "Chemistries": [
    { name:"BMP",            detail:"Basic metabolic panel — Na, K, Cl, CO₂, BUN, Cr, glucose",             tier:"STAT"    },
    { name:"CMP",            detail:"Comprehensive metabolic panel — includes LFTs",                         tier:"URGENT"  },
    { name:"Lactic acid",    detail:"Venous lactate — sepsis/shock screening",                               tier:"STAT"    },
    { name:"LFTs",           detail:"AST, ALT, ALP, total bilirubin, albumin",                              tier:"URGENT"  },
    { name:"Lipase",         detail:"Serum lipase — pancreatitis workup",                                    tier:"URGENT"  },
    { name:"Magnesium",      detail:"Serum magnesium level",                                                 tier:"URGENT"  },
    { name:"Phosphorus",     detail:"Serum phosphorus level",                                                tier:"ROUTINE" },
  ],
  "Hematology": [
    { name:"CBC w/ diff",    detail:"Complete blood count with differential",                                tier:"STAT"    },
    { name:"Type & Screen",  detail:"ABO/Rh typing + antibody screen — before transfusion",                 tier:"URGENT"  },
    { name:"Type & Cross",   detail:"Full crossmatch — active or imminent transfusion",                     tier:"STAT"    },
    { name:"Coagulation",    detail:"PT, PTT, INR, fibrinogen",                                             tier:"URGENT"  },
    { name:"D-Dimer",        detail:"Quantitative — PE/DVT workup",                                         tier:"URGENT"  },
  ],
  "Cardiac / Critical": [
    { name:"Troponin (hsTnI)",  detail:"High-sensitivity, serial q3h (0h, 3h) or q1h protocol",            tier:"STAT"    },
    { name:"BNP",               detail:"B-type natriuretic peptide — HF, dyspnea",                         tier:"URGENT"  },
    { name:"NT-proBNP",         detail:"N-terminal proBNP — HF, dyspnea",                                  tier:"URGENT"  },
    { name:"ABG",               detail:"Arterial blood gas — pH, pO₂, pCO₂, HCO₃",                        tier:"STAT"    },
    { name:"VBG",               detail:"Venous blood gas — pH, pCO₂, HCO₃",                               tier:"URGENT"  },
    { name:"Blood cultures",    detail:"x2 sets peripheral — before antibiotics if possible",               tier:"STAT"    },
  ],
  "Urine / Tox": [
    { name:"UA w/ microscopy",  detail:"Urinalysis with microscopy and reflex culture",                     tier:"URGENT"  },
    { name:"Urine culture",     detail:"Mid-stream clean catch — do not spin first",                        tier:"URGENT"  },
    { name:"Urine drug screen", detail:"Qualitative immunoassay panel",                                     tier:"URGENT"  },
    { name:"Urine hCG",         detail:"Qualitative pregnancy test",                                        tier:"STAT"    },
    { name:"EtOH level",        detail:"Serum ethanol quantitative",                                        tier:"URGENT"  },
    { name:"Acetaminophen",     detail:"Serum level — toxicology, overdose workup",                         tier:"URGENT"  },
    { name:"Salicylate",        detail:"Serum salicylate level",                                            tier:"URGENT"  },
  ],
};

const MEDS = {
  "Pain / Sedation": [
    { name:"Ketorolac",             detail:"30mg IV x1 (15mg if >65, renal impairment, weight <50kg)",       tier:"URGENT"  },
    { name:"Morphine sulfate",      detail:"4mg IV q4h PRN moderate–severe pain",                            tier:"URGENT"  },
    { name:"Hydromorphone",         detail:"0.5–1mg IV q4h PRN severe pain",                                 tier:"URGENT"  },
    { name:"Fentanyl",              detail:"1 mcg/kg IV PRN procedural pain (titrate)",                      tier:"URGENT"  },
    { name:"Acetaminophen",         detail:"1g IV/PO q8h (max 3g/day — 2g if hepatic risk)",                tier:"URGENT"  },
    { name:"Ibuprofen",             detail:"600mg PO q8h with food",                                         tier:"ROUTINE" },
    { name:"Ketamine (sub-diss.)",  detail:"0.3 mg/kg IV over 15 min — adjunct analgesia",                  tier:"URGENT"  },
  ],
  "Antiemetics": [
    { name:"Ondansetron",           detail:"4mg IV/ODT q8h PRN nausea/vomiting",                            tier:"URGENT"  },
    { name:"Metoclopramide",        detail:"10mg IV q8h PRN (also useful for migraine)",                     tier:"URGENT"  },
    { name:"Prochlorperazine",      detail:"10mg IV/IM q6h PRN (Compazine — give diphenhydramine with IV)", tier:"URGENT"  },
    { name:"Promethazine",          detail:"12.5–25mg IV/IM q6h PRN (black box: avoid IV push)",            tier:"ROUTINE" },
    { name:"Droperidol",            detail:"1.25mg IV/IM q6h PRN — migraine, nausea (monitor QTc)",         tier:"URGENT"  },
  ],
  "Antibiotics": [
    { name:"Ceftriaxone",           detail:"1g IV q24h (2g for meningitis, CNS infection)",                  tier:"STAT"    },
    { name:"Azithromycin",          detail:"500mg IV/PO daily x5 days (CAP — atypical coverage)",           tier:"URGENT"  },
    { name:"Piperacillin-tazo",     detail:"3.375g IV q8h — broad gram-neg/anaerobic (adjust for renal)",   tier:"STAT"    },
    { name:"Vancomycin",            detail:"25 mg/kg IV load, then pharmacy dosing (MRSA, severe infections)",tier:"STAT"   },
    { name:"Metronidazole",         detail:"500mg IV q8h (anaerobic coverage, C. diff PO 500mg TID x10d)",  tier:"URGENT"  },
    { name:"Ciprofloxacin",         detail:"400mg IV q12h / 500mg PO q12h (GI, UTI — check local resistance)",tier:"URGENT"},
    { name:"Cefazolin",             detail:"2g IV q8h (skin/soft tissue, surgical prophylaxis)",             tier:"URGENT"  },
  ],
  "Cardiac / ACS": [
    { name:"Aspirin",               detail:"324–325mg PO — chew for suspected ACS",                         tier:"STAT"    },
    { name:"Nitroglycerin SL",      detail:"0.4mg SL q5min x3 PRN chest pain/hypertensive urgency",         tier:"STAT"    },
    { name:"Metoprolol tartrate",   detail:"5mg IV q5min x3 (rate control AF/flutter, ACS — avoid if HF)", tier:"URGENT"  },
    { name:"Amiodarone",            detail:"150mg IV over 10 min, then 1mg/min x6h (refractory AF/VT)",     tier:"STAT"    },
    { name:"Heparin unfractionated",detail:"80 units/kg IV bolus, then 18 units/kg/hr (ACS, PE — per protocol)",tier:"STAT"},
    { name:"tPA (Alteplase)",       detail:"0.9 mg/kg IV max 90mg (ischemic stroke — per protocol, consent)", tier:"STAT"  },
  ],
  "Respiratory": [
    { name:"Albuterol",             detail:"2.5mg/3mL neb q20 min x3, then q4h PRN (asthma/COPD)",          tier:"STAT"    },
    { name:"Ipratropium",           detail:"0.5mg/2.5mL neb q6h — combine with albuterol in acute exacerbation",tier:"URGENT"},
    { name:"Methylprednisolone",    detail:"125mg IV q6h (acute asthma, severe COPD exacerbation)",          tier:"URGENT"  },
    { name:"Heliox",                detail:"70:30 helium-oxygen — severe upper airway obstruction",          tier:"URGENT"  },
    { name:"Magnesium sulfate",     detail:"2g IV over 20 min (refractory asthma, pre-eclampsia)",           tier:"URGENT"  },
    { name:"Epinephrine 1:1000 IM", detail:"0.3–0.5mg IM lateral thigh — anaphylaxis (1st line)",           tier:"STAT"    },
  ],
};

const IV_STRAT = {
  "Crystalloids": [
    { name:"NS 1L bolus",      detail:"Normal saline 1L IV over 30–60 min",          tier:"STAT"    },
    { name:"LR 1L bolus",      detail:"Lactated Ringer's 1L IV over 30–60 min",      tier:"STAT"    },
    { name:"NS @ 125 mL/hr",   detail:"Normal saline maintenance at 125 mL/hr",      tier:"URGENT"  },
    { name:"LR @ 125 mL/hr",   detail:"Lactated Ringer's maintenance at 125 mL/hr",  tier:"URGENT"  },
    { name:"D5W @ 75 mL/hr",   detail:"5% dextrose in water at 75 mL/hr",            tier:"ROUTINE" },
    { name:"D5 1/2 NS",        detail:"Dextrose 5% in 0.45% NS at 100 mL/hr",        tier:"ROUTINE" },
  ],
  "Blood Products": [
    { name:"pRBC 1 unit",       detail:"Packed red blood cells 1 unit IV over 2–4 hrs (type & screen/cross first)", tier:"URGENT" },
    { name:"FFP 2 units",       detail:"Fresh frozen plasma — coagulopathy, warfarin reversal",                     tier:"URGENT" },
    { name:"Platelets 1 pool",  detail:"Platelet pool IV over 30–60 min (plt <50k w/ active bleed, <10k prophy)",   tier:"URGENT" },
    { name:"Cryoprecipitate",   detail:"10 units IV — fibrinogen <100 mg/dL or hypofibrinogenemia",                 tier:"URGENT" },
    { name:"4-factor PCC",      detail:"25–50 units/kg IV — warfarin reversal + life-threatening bleed",            tier:"STAT"   },
    { name:"TXA",               detail:"1g IV over 10 min — trauma within 3h, major hemorrhage",                    tier:"STAT"   },
  ],
  "Vasopressors / Inotropes": [
    { name:"Norepinephrine",    detail:"0.01–0.5 mcg/kg/min IV — septic shock 1st line vasopressor",                tier:"STAT"   },
    { name:"Epinephrine",       detail:"0.01–0.5 mcg/kg/min IV — cardiogenic shock, anaphylaxis, refractory sepsis",tier:"STAT"   },
    { name:"Vasopressin",       detail:"0.03–0.04 units/min IV — add-on to norepinephrine in septic shock",         tier:"STAT"   },
    { name:"Dopamine",          detail:"5–20 mcg/kg/min IV — cardiogenic/distributive, titratable",                 tier:"STAT"   },
    { name:"Dobutamine",        detail:"2–20 mcg/kg/min IV — cardiogenic shock with low CO",                        tier:"STAT"   },
    { name:"Phenylephrine",     detail:"100–180 mcg/min IV — neurogenic shock, pure vasopressor",                   tier:"URGENT" },
    { name:"Push-dose epi",     detail:"10–20 mcg IV bolus q2–5 min — peri-arrest, procedural hypotension",        tier:"STAT"   },
  ],
};

const IMAGING_ORDERS = [
  { name:"CXR PA/Lateral",      detail:"Chest x-ray PA and lateral views",                              tier:"URGENT",  category:"imaging" },
  { name:"CXR portable",         detail:"Portable chest x-ray — unstable patient",                      tier:"STAT",    category:"imaging" },
  { name:"CT head w/o contrast", detail:"Non-contrast CT — headache, AMS, trauma",                     tier:"STAT",    category:"imaging" },
  { name:"CT head w/ contrast",  detail:"With contrast — abscess, tumor, AVM",                         tier:"URGENT",  category:"imaging" },
  { name:"CT angio chest",       detail:"PE protocol — r/o pulmonary embolism",                        tier:"STAT",    category:"imaging" },
  { name:"CT chest/abd/pelvis",  detail:"With contrast — trauma, abdominal pain, sepsis source",       tier:"STAT",    category:"imaging" },
  { name:"CT abdomen/pelvis",    detail:"With contrast — abdominal pain, appendicitis, GI bleed",      tier:"URGENT",  category:"imaging" },
  { name:"CT angio abdomen",     detail:"Aorta protocol — r/o AAA, aortic dissection",                 tier:"STAT",    category:"imaging" },
  { name:"CT spine (C/T/L)",     detail:"Cervical/thoracic/lumbar — trauma, radiculopathy",            tier:"URGENT",  category:"imaging" },
  { name:"MRI brain",            detail:"With and without contrast — stroke, MS, encephalitis",        tier:"URGENT",  category:"imaging" },
  { name:"MRI spine",            detail:"Cervical/lumbar — cord compression, epidural abscess",        tier:"URGENT",  category:"imaging" },
  { name:"US FAST exam",         detail:"Bedside ultrasound — trauma, free fluid assessment",          tier:"STAT",    category:"imaging" },
  { name:"US abdomen",           detail:"Formal abdomen — RUQ, gallbladder, hepatic",                 tier:"URGENT",  category:"imaging" },
  { name:"US pelvis",            detail:"Transabdominal and transvaginal — pelvic pain, ectopic",      tier:"URGENT",  category:"imaging" },
  { name:"US vascular",          detail:"Lower extremity venous duplex — DVT evaluation",              tier:"URGENT",  category:"imaging" },
  { name:"Echo bedside",         detail:"POCUS cardiac — effusion, function, tamponade",               tier:"URGENT",  category:"imaging" },
];

const CONSULTS = [
  "Cardiology","Pulmonology","Gastroenterology","Nephrology","Neurology","Neurosurgery",
  "General Surgery","Vascular Surgery","Orthopedics","Urology","OB/GYN","Ophthalmology",
  "ENT","Plastics / Hand","Psychiatry","Social Work","Case Management","Pharmacy",
  "Infectious Disease","Hematology / Oncology","Endocrinology","Palliative Care",
];

const CATS = [
  { id:"all",     label:"All",        icon:"⊕" },
  { id:"labs",    label:"Labs",       icon:"🧪" },
  { id:"meds",    label:"Meds",       icon:"💊" },
  { id:"iv",      label:"IV Strategy",icon:"💧" },
  { id:"imaging", label:"Imaging",    icon:"🔬" },
  { id:"consult", label:"Consult",    icon:"👤" },
];

// ── OrdersPanel ───────────────────────────────────────────────────────────────
export default function OrdersPanel({ patientName, allergies, chiefComplaint, patientAge, patientSex }) {
  const [bundle,   setBundle]   = useState(null);
  const [checked,  setChecked]  = useState(new Set());
  const [queue,    setQueue]    = useState([]);
  const [signed,   setSigned]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [busySign, setBusySign] = useState(false);
  const [search,   setSearch]   = useState("");
  const [cat,      setCat]      = useState("all");

  useEffect(() => { if (chiefComplaint) generateBundle(); }, []); // eslint-disable-line

  const generateBundle = useCallback(async () => {
    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an emergency medicine clinical decision support AI.
Patient: ${patientName||"Unknown"}, age ${patientAge||"?"}, sex ${patientSex||"?"}.
Chief complaint: "${chiefComplaint||"not specified"}".
Allergies: ${allergies?.length ? allergies.join(", ") : "NKDA"}.
Generate an evidence-based ED order bundle. Return ONLY valid JSON:
{"diagnosis":"Brief working dx","confidence":85,"suppressed":["reason for omitted items"],
"orders":[{"id":"o1","name":"Order name","detail":"Brief dose/detail","tier":"STAT","category":"lab"}]}
tier: STAT|URGENT|ROUTINE. category: lab|medication|iv|imaging|procedure|consult|monitoring.
Include 8-12 orders covering labs, medications, imaging as appropriate. suppressed: explain any important omissions.`,
        response_json_schema: {
          type:"object",
          properties:{
            diagnosis:  {type:"string"}, confidence:{type:"number"},
            suppressed: {type:"array",items:{type:"string"}},
            orders:     {type:"array",items:{type:"object",properties:{
              id:{type:"string"},name:{type:"string"},detail:{type:"string"},tier:{type:"string"},category:{type:"string"}
            }}}
          }
        }
      });
      const parsed = typeof result === "object" ? result : JSON.parse(String(result).replace(/```json|```/g,"").trim());
      setBundle(parsed);
      setChecked(new Set((parsed.orders||[]).filter(o=>o.tier==="STAT").map(o=>o.id)));
    } catch { toast.error("Could not generate order bundle."); }
    finally { setLoading(false); }
  }, [chiefComplaint, patientAge, patientSex, allergies, patientName]);

  const toggleCheck = useCallback((id) =>
    setChecked(prev => { const n=new Set(prev); n.has(id)?n.delete(id):n.add(id); return n; }), []);

  const enqueue = useCallback((orders) => {
    const toAdd = orders.filter(o => !queue.find(q=>q.id===o.id));
    if (!toAdd.length) { toast.info("Already in queue."); return; }
    setQueue(prev=>[...prev,...toAdd]);
    setSigned(false);
    toast.success(`${toAdd.length} order${toAdd.length!==1?"s":""} added.`);
  }, [queue]);

  const addChecked = useCallback(() => {
    if (!bundle) return;
    enqueue(bundle.orders.filter(o=>checked.has(o.id)));
  }, [bundle, checked, enqueue]);

  const quickAdd = useCallback((name, detail, tier, category) => {
    const id = `qa-${name.replace(/\s/g,"-").toLowerCase()}`;
    enqueue([{id, name, detail, tier:tier||"URGENT", category:category||"lab"}]);
  }, [enqueue]);

  const signQueue = useCallback(() => {
    setBusySign(true);
    setTimeout(()=>{
      setSigned(true); setBusySign(false);
      toast.success(`${queue.length} order${queue.length!==1?"s":""} signed.`);
    }, 500);
  }, [queue.length]);

  const removeFromQueue = useCallback((id) => {
    setQueue(p=>p.filter(x=>x.id!==id));
  }, []);

  const statN    = queue.filter(o=>o.tier==="STAT").length;
  const urgentN  = queue.filter(o=>o.tier==="URGENT").length;
  const routineN = queue.filter(o=>o.tier==="ROUTINE").length;

  // ── Section renderers ─────────────────────────────────────────────────────
  function SectionLabel({ children }) {
    return <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:"var(--npi-txt4)",margin:"12px 0 6px"}}>{children}</div>;
  }

  function QuickChip({ name, detail, tier, category, color }) {
    return (
      <button onClick={()=>quickAdd(name,detail,tier,category)}
        style={{padding:"5px 11px",borderRadius:20,border:`1px solid rgba(255,255,255,.12)`,background:"rgba(255,255,255,.05)",color:color||"var(--npi-txt2)",fontFamily:"'DM Sans',sans-serif",fontWeight:500,fontSize:11.5,cursor:"pointer",textAlign:"left",transition:"all .12s",whiteSpace:"nowrap"}}
        className="ord-chip">
        {name}
      </button>
    );
  }

  function renderCategoryContent() {
    if (cat === "all") {
      const ALL_CHIPS = [
        {n:"CBC w/ diff",c:"lab"},{n:"BMP",c:"lab"},{n:"CMP",c:"lab"},{n:"Coagulation",c:"lab"},
        {n:"Troponin",c:"lab"},{n:"Lactate",c:"lab"},{n:"UA",c:"lab"},{n:"Blood cultures",c:"lab"},
        {n:"CXR",c:"imaging"},{n:"CT head",c:"imaging"},{n:"US FAST",c:"imaging"},
        {n:"Ondansetron 4mg IV",c:"medication"},{n:"Ketorolac 30mg IV",c:"medication"},
        {n:"NS 1L bolus",c:"iv"},{n:"LR 1L bolus",c:"iv"},
      ];
      const chips = search ? ALL_CHIPS.filter(c=>c.n.toLowerCase().includes(search.toLowerCase())) : ALL_CHIPS;
      return (
        <>
          <div>
            <SectionLabel>Quick search</SectionLabel>
            <div style={{display:"flex",alignItems:"center",gap:8,background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",borderRadius:9,padding:"8px 11px",marginBottom:8}}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="5.5" cy="5.5" r="4" stroke="rgba(255,255,255,.3)" strokeWidth="1.3"/><line x1="8.8" y1="8.8" x2="12" y2="12" stroke="rgba(255,255,255,.3)" strokeWidth="1.3" strokeLinecap="round"/></svg>
              <input value={search} onChange={e=>setSearch(e.target.value)}
                placeholder="Search labs, meds, imaging, procedures…"
                style={{background:"none",border:"none",outline:"none",color:"var(--npi-txt)",fontSize:12,flex:1,fontFamily:"'DM Sans',sans-serif"}}/>
              {search && <button onClick={()=>setSearch("")} style={{background:"none",border:"none",color:"var(--npi-txt4)",cursor:"pointer",fontSize:13}}>✕</button>}
            </div>
            <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
              {chips.map(c=>(
                <QuickChip key={c.n} name={c.n} detail="Quick add — specify detail as needed" tier="URGENT" category={c.c}/>
              ))}
              {search && !chips.length && (
                <button className="ord-chip" onClick={()=>{quickAdd(search,"Custom order","ROUTINE","procedure");setSearch("");}}>
                  + Add "{search}"
                </button>
              )}
            </div>
          </div>
        </>
      );
    }

    if (cat === "labs") {
      return Object.entries(LABS).map(([group, items]) => (
        <div key={group}>
          <SectionLabel>{group}</SectionLabel>
          <div style={{display:"flex",flexDirection:"column",gap:4}}>
            {items.map(item=>(
              <div key={item.name} className="ord-row" onClick={()=>quickAdd(item.name,item.detail,item.tier,"lab")}
                style={{cursor:"pointer",padding:"8px 10px",borderRadius:7,display:"flex",alignItems:"flex-start",gap:8,background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.07)",transition:"background .12s"}}>
                <span style={{fontSize:13,flexShrink:0,marginTop:1}}>🧪</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:600,color:"var(--npi-txt)"}}>{item.name}</div>
                  <div style={{fontSize:10,color:"var(--npi-txt4)",marginTop:1,lineHeight:1.4}}>{item.detail}</div>
                </div>
                <TierBadge tier={item.tier}/>
              </div>
            ))}
          </div>
        </div>
      ));
    }

    if (cat === "meds") {
      return Object.entries(MEDS).map(([group, items]) => (
        <div key={group}>
          <SectionLabel>{group}</SectionLabel>
          <div style={{display:"flex",flexDirection:"column",gap:4}}>
            {items.map(item=>(
              <div key={item.name} className="ord-row" onClick={()=>quickAdd(item.name,item.detail,item.tier,"medication")}
                style={{cursor:"pointer",padding:"8px 10px",borderRadius:7,display:"flex",alignItems:"flex-start",gap:8,background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.07)",transition:"background .12s"}}>
                <span style={{fontSize:13,flexShrink:0,marginTop:1}}>💊</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:600,color:"var(--npi-txt)"}}>{item.name}</div>
                  <div style={{fontSize:10,color:"var(--npi-txt4)",marginTop:1,lineHeight:1.4}}>{item.detail}</div>
                </div>
                <TierBadge tier={item.tier}/>
              </div>
            ))}
          </div>
        </div>
      ));
    }

    if (cat === "iv") {
      return Object.entries(IV_STRAT).map(([group, items]) => (
        <div key={group}>
          <SectionLabel>{group}</SectionLabel>
          <div style={{display:"flex",flexDirection:"column",gap:4}}>
            {items.map(item=>(
              <div key={item.name} className="ord-row" onClick={()=>quickAdd(item.name,item.detail,item.tier,"iv")}
                style={{cursor:"pointer",padding:"8px 10px",borderRadius:7,display:"flex",alignItems:"flex-start",gap:8,background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.07)",transition:"background .12s"}}>
                <span style={{fontSize:13,flexShrink:0,marginTop:1}}>💧</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:600,color:"var(--npi-txt)"}}>{item.name}</div>
                  <div style={{fontSize:10,color:"var(--npi-txt4)",marginTop:1,lineHeight:1.4}}>{item.detail}</div>
                </div>
                <TierBadge tier={item.tier}/>
              </div>
            ))}
          </div>
        </div>
      ));
    }

    if (cat === "imaging") {
      return (
        <div style={{display:"flex",flexDirection:"column",gap:4}}>
          {IMAGING_ORDERS.map(item=>(
            <div key={item.name} className="ord-row" onClick={()=>quickAdd(item.name,item.detail,item.tier,"imaging")}
              style={{cursor:"pointer",padding:"8px 10px",borderRadius:7,display:"flex",alignItems:"flex-start",gap:8,background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.07)",transition:"background .12s"}}>
              <span style={{fontSize:13,flexShrink:0,marginTop:1}}>🔬</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:600,color:"var(--npi-txt)"}}>{item.name}</div>
                <div style={{fontSize:10,color:"var(--npi-txt4)",marginTop:1,lineHeight:1.4}}>{item.detail}</div>
              </div>
              <TierBadge tier={item.tier}/>
            </div>
          ))}
        </div>
      );
    }

    if (cat === "consult") {
      return (
        <>
          <SectionLabel>Consult services</SectionLabel>
          <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
            {CONSULTS.map(svc=>(
              <button key={svc} className="ord-chip" onClick={()=>quickAdd(`${svc} consult`,`Consult ${svc} — indication to be specified`,"URGENT","consult")}>
                {svc}
              </button>
            ))}
          </div>
        </>
      );
    }

    return null;
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{display:"grid",gridTemplateColumns:"56% 44%",height:"100%",background:"var(--npi-bg)"}}>

      {/* LEFT ── Build orders */}
      <div style={{padding:"14px 16px",display:"flex",flexDirection:"column",gap:10,overflowY:"auto",borderRight:"1px solid var(--npi-bd)"}}>

        {/* AI Bundle */}
        <div style={{background:"rgba(0,229,192,.03)",border:"1px solid rgba(0,229,192,.22)",borderRadius:10,padding:14,flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,flexWrap:"wrap"}}>
            <span className="ord-ai-pill">✦ AI Bundle</span>
            {bundle && <span style={{fontSize:20,fontWeight:800,color:"var(--npi-teal)",fontFamily:"'JetBrains Mono',monospace"}}>{bundle.confidence}%</span>}
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:700,color:"var(--npi-txt)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                {loading?"Analyzing…":bundle?.diagnosis||chiefComplaint||"Enter a chief complaint"}
              </div>
            </div>
            <button onClick={addChecked} disabled={!bundle||loading||!checked.size} className="ord-btn-teal">
              + Add ({checked.size})
            </button>
          </div>

          {loading && (
            <div style={{display:"flex",alignItems:"center",gap:9,padding:"6px 0",color:"var(--npi-txt4)",fontSize:12,fontFamily:"'DM Sans',sans-serif"}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:"var(--npi-teal)",animation:"npi-ai-pulse 1.4s ease-in-out infinite"}}/>
              Generating order bundle…
            </div>
          )}
          {!loading && !bundle && (
            <div style={{padding:"6px 0",color:"var(--npi-txt4)",fontSize:12,fontFamily:"'DM Sans',sans-serif"}}>
              {chiefComplaint
                ? <button className="ord-btn-ghost" onClick={generateBundle}>✦ Generate bundle</button>
                : "Enter a chief complaint to generate an AI order bundle."}
            </div>
          )}

          {bundle && ["STAT","URGENT","ROUTINE"].map(tier=>{
            const orders = bundle.orders.filter(o=>o.tier===tier);
            if (!orders.length) return null;
            return (
              <div key={tier}>
                <div style={{display:"flex",alignItems:"center",gap:8,margin:"8px 0 4px"}}>
                  <span style={{fontSize:9,fontWeight:700,letterSpacing:1.5,color:TC[tier],fontFamily:"'JetBrains Mono',monospace"}}>{tier}</span>
                  <div style={{flex:1,height:1,background:"rgba(255,255,255,.07)"}}/>
                  <span style={{fontSize:9,color:TC[tier],opacity:.5,fontFamily:"'JetBrains Mono',monospace"}}>{orders.length}</span>
                </div>
                {orders.map(ord=>{
                  const on=checked.has(ord.id);
                  return (
                    <div key={ord.id} className="ord-row" onClick={()=>toggleCheck(ord.id)}>
                      <div className={`ord-chk${on?" on":""}`}>
                        {on && <span style={{color:"var(--npi-bg)",fontSize:9,fontWeight:700,lineHeight:1}}>✓</span>}
                      </div>
                      <span style={{fontSize:11,marginTop:1,flexShrink:0}}>{CAT_ICON[ord.category]||"📋"}</span>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:12,fontWeight:500,color:"var(--npi-txt)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ord.name}</div>
                        <div style={{fontSize:10,color:"var(--npi-txt4)",marginTop:1}}>{ord.detail}</div>
                      </div>
                      <TierBadge tier={ord.tier}/>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {bundle?.suppressed?.length > 0 && (
            <div style={{background:"rgba(245,200,66,.07)",border:"1px solid rgba(245,200,66,.18)",borderRadius:7,padding:"7px 10px",fontSize:10,color:"rgba(245,200,66,.82)",display:"flex",gap:6,alignItems:"flex-start",marginTop:8}}>
              <span style={{flexShrink:0}}>⚑</span>
              <span>{bundle.suppressed.join(" · ")}</span>
            </div>
          )}
        </div>

        {/* Category tabs */}
        <div style={{display:"flex",gap:2,borderBottom:"1px solid rgba(255,255,255,.08)",flexShrink:0,overflow:"auto"}}>
          {CATS.map(c=>{
            const active=c.id===cat;
            return (
              <button key={c.id} onClick={()=>setCat(c.id)}
                style={{padding:"7px 10px",background:"none",border:"none",borderBottom:`2px solid ${active?"var(--npi-teal)":"transparent"}`,marginBottom:-1,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:active?600:400,color:active?"var(--npi-teal)":"var(--npi-txt3)",whiteSpace:"nowrap",transition:"all .13s"}}>
                {c.icon} {c.label}
              </button>
            );
          })}
        </div>

        {/* Category content */}
        <div style={{flex:1}}>
          {renderCategoryContent()}
        </div>
      </div>

      {/* RIGHT ── Order queue */}
      <div style={{padding:"14px 16px",display:"flex",flexDirection:"column",gap:10,overflowY:"auto"}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:2}}>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:"var(--npi-txt)",fontFamily:"'Playfair Display',serif"}}>Order queue</div>
            <div style={{fontSize:11,color:"var(--npi-txt4)",marginTop:2,fontFamily:"'DM Sans',sans-serif"}}>
              {queue.length===0 ? "No orders yet"
                : signed ? `${queue.length} orders · all signed`
                : `${queue.length} order${queue.length!==1?"s":""} · pending signature`}
            </div>
          </div>
          {queue.length>0 && !signed && (
            <button className="ord-btn-teal" onClick={signQueue} disabled={busySign}>
              {busySign?"Signing…":`Sign all (${queue.length})`}
            </button>
          )}
        </div>

        {queue.length>0 && (
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7}}>
            {[{n:statN,l:"STAT",c:"var(--npi-coral)"},{n:urgentN,l:"Urgent",c:"var(--npi-orange)"},{n:routineN,l:"Routine",c:"var(--npi-txt4)"}].map(s=>(
              <div key={s.l} style={{background:"rgba(255,255,255,.04)",borderRadius:7,padding:"8px 10px",textAlign:"center"}}>
                <div style={{fontSize:18,fontWeight:700,color:s.c,fontFamily:"'JetBrains Mono',monospace"}}>{s.n}</div>
                <div style={{fontSize:10,color:"rgba(255,255,255,.35)",marginTop:1,fontFamily:"'DM Sans',sans-serif"}}>{s.l}</div>
              </div>
            ))}
          </div>
        )}

        {queue.length===0 && (
          <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8,color:"var(--npi-txt4)",textAlign:"center",padding:32}}>
            <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
              <rect x="5" y="9" width="28" height="4" rx="2" fill="rgba(122,160,192,.15)"/>
              <rect x="5" y="17" width="22" height="4" rx="2" fill="rgba(122,160,192,.15)"/>
              <rect x="5" y="25" width="26" height="4" rx="2" fill="rgba(122,160,192,.15)"/>
            </svg>
            <div style={{fontSize:12,fontFamily:"'DM Sans',sans-serif"}}>No orders in queue</div>
            <div style={{fontSize:10,fontFamily:"'DM Sans',sans-serif",maxWidth:200}}>Check items in the AI bundle or browse by category</div>
          </div>
        )}

        {queue.length>0 && (
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {queue.map(ord=>(
              <div key={ord.id} style={{padding:"10px 12px",background:signed?"rgba(0,229,192,.04)":"rgba(255,255,255,.03)",border:`1px solid ${signed?"rgba(0,229,192,.15)":"rgba(255,255,255,.07)"}`,borderLeft:`3px solid ${TL[ord.tier]||TL.ROUTINE}`,borderRadius:"0 9px 9px 0"}}>
                <div style={{display:"flex",alignItems:"center",gap:7}}>
                  <span style={{fontSize:12,flexShrink:0}}>{CAT_ICON[ord.category]||"📋"}</span>
                  <span style={{fontSize:12,fontWeight:600,color:"var(--npi-txt)",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ord.name}</span>
                  <TierBadge tier={ord.tier}/>
                  {!signed && (
                    <button onClick={()=>removeFromQueue(ord.id)} style={{background:"none",border:"none",color:"var(--npi-txt4)",cursor:"pointer",fontSize:12,padding:2,lineHeight:1,flexShrink:0}}>✕</button>
                  )}
                </div>
                <div style={{display:"flex",alignItems:"center",gap:5,marginTop:5}}>
                  <div style={{width:6,height:6,borderRadius:"50%",background:signed?"var(--npi-teal)":"var(--npi-orange)",flexShrink:0}}/>
                  <span style={{fontSize:10,color:signed?"rgba(0,229,192,.7)":"rgba(255,149,64,.7)",fontFamily:"'DM Sans',sans-serif"}}>
                    {signed?`Signed · ${ord.detail||"Active"}`:"Awaiting signature"}
                  </span>
                </div>
                {ord.detail && !signed && (
                  <div style={{fontSize:10,color:"var(--npi-txt4)",marginTop:3,marginLeft:18,lineHeight:1.4}}>{ord.detail}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {queue.length>0 && !signed && (
          <div style={{background:"rgba(0,229,192,.06)",border:"1px solid rgba(0,229,192,.2)",borderRadius:10,padding:14,textAlign:"center",marginTop:"auto"}}>
            <div style={{fontSize:11,color:"rgba(255,255,255,.45)",marginBottom:9,fontFamily:"'DM Sans',sans-serif"}}>
              {queue.length} order{queue.length!==1?"s":""} awaiting signature
            </div>
            <button onClick={signQueue} disabled={busySign}
              style={{width:"100%",background:"var(--npi-teal)",color:"var(--npi-bg)",border:"none",borderRadius:8,padding:9,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",opacity:busySign?.6:1}}>
              {busySign?"Signing…":"Sign orders"}
            </button>
          </div>
        )}

        {signed && (
          <div style={{background:"rgba(0,229,192,.06)",border:"1px solid rgba(0,229,192,.2)",borderRadius:10,padding:14,textAlign:"center",marginTop:"auto"}}>
            <div style={{fontSize:12,color:"var(--npi-teal)",fontWeight:700,fontFamily:"'DM Sans',sans-serif"}}>
              ✓ {queue.length} orders signed — all active
            </div>
          </div>
        )}
      </div>
    </div>
  );
}