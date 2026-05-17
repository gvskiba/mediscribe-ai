import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { InvokeLLM } from "@/integrations/Core";
import { DrugDosing } from "@/api/entities";
import NotryaHubHeader from "@/components/HubHeader/NotryaHubHeader";
import NotryaNav from "@/components/HubHeader/NotryaNav";
import NotryaPatientBar from "@/components/HubHeader/NotryaPatientBar";

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

// ── Entity → Internal Format ──────────────────────────────────────────────────
// Normalizes a DrugDosing entity record into the same shape the UI expects.
const normalizeEntityDrug = (r) => ({
  id:           r.drug_id,
  name:         r.name,
  gen:          r.generic_name,
  cat:          r.category,
  controlled:   r.controlled||false,
  schedule:     r.schedule||null,
  ismp:         r.ismp_high_alert||false,
  tiers:        (() => { try { return JSON.parse(r.renal_tiers_json||"[]"); } catch { return []; } })(),
  wt: r.weight_based ? {
    ind:  r.wt_indication, route: r.wt_route, dpkg: r.wt_dpkg,
    lo:   r.wt_lo,        hi:    r.wt_hi,    max:  r.wt_max,
    conc: r.wt_conc,      unit:  r.wt_unit,  note: r.wt_note,
  } : null,
  drip: r.is_drip ? {
    lo:    r.drip_lo,   hi:   r.drip_hi,   unit: r.drip_unit,
    concs: (() => { try { return JSON.parse(r.drip_concs_json||"[]"); } catch { return []; } })(),
    note:  r.drip_note,
  } : null,
  sigs:         (() => { try { return JSON.parse(r.standard_sigs_json||"[]"); } catch { return []; } })(),
  interactions: (() => { try { return JSON.parse(r.interactions_json||"[]"); } catch { return []; } })(),
  ci:           r.contraindications ? r.contraindications.split("|").filter(Boolean) : [],
  peds:         r.peds_dose||"",
  hepatic:      r.hepatic_note||"",
  monitoring:   r.monitoring||"",
  _source:      r.source||"static",
});

// ── AI-powered FDA→Entity extraction and writeback ────────────────────────────
// Called when a drug is looked up in Rx Lookup but NOT found in the entity DB.
// Extracts structured dosing from FDA label text, saves to entity, returns drug obj.
const extractAndSaveDrug = async (fdaDrug) => {
  const name = fdaDrug?.openfda?.brand_name?.[0]||fdaDrug?.openfda?.generic_name?.[0]||"";
  const gen  = fdaDrug?.openfda?.generic_name?.[0]||fdaDrug?.openfda?.substance_name?.[0]||"";
  if (!name) return null;
  try {
    const r = await InvokeLLM({
      prompt: `Extract structured dosing data for ${name} (${gen}) from this FDA label.
Indications: ${(fdaDrug.indications_and_usage?.[0]||"").slice(0,600)}
Dosage: ${(fdaDrug.dosage_and_administration?.[0]||"").slice(0,600)}
Warnings: ${(fdaDrug.warnings?.[0]||"").slice(0,400)}`,
      response_json_schema: {
        type:"object", properties:{
          category:{type:"string",enum:["antibiotic","analgesic","rsi","sedation","cardiac","reversal","anticoagulant","pressor","neuro","metabolic","other"]},
          standard_dose:{type:"string"}, weight_based:{type:"boolean"},
          wt_dpkg:{type:"number"}, wt_unit:{type:"string",enum:["mg","mcg"]},
          wt_max:{type:"number"}, wt_route:{type:"string"}, wt_note:{type:"string"},
          renal_tiers:{type:"array",items:{type:"array",items:{type:"string"}}},
          sigs:{type:"array",items:{type:"string"}},
          interactions:{type:"array",items:{type:"string"}},
          contraindications:{type:"string"}, peds_dose:{type:"string"},
          monitoring:{type:"string"}, ismp_high_alert:{type:"boolean"},
        },
        required:["category","standard_dose","weight_based"],
      },
    });
    const drugId = gen.toLowerCase().replace(/[^a-z0-9]/g,"").slice(0,12)||name.toLowerCase().replace(/[^a-z0-9]/g,"").slice(0,12);
    const record = {
      drug_id: drugId, name, generic_name: gen,
      category: r.category||"other", source: "ai_generated",
      last_verified: new Date().toISOString().slice(0,10),
      standard_dose: r.standard_dose||"", weight_based: !!r.weight_based,
      wt_dpkg: r.wt_dpkg||null, wt_unit: r.wt_unit||"mg",
      wt_max: r.wt_max||null, wt_route: r.wt_route||null,
      wt_note: r.wt_note||null,
      renal_tiers_json: JSON.stringify(r.renal_tiers||[]),
      standard_sigs_json: JSON.stringify(r.sigs||[]),
      interactions_json: JSON.stringify(r.interactions||[]),
      contraindications: r.contraindications||"",
      peds_dose: r.peds_dose||"", monitoring: r.monitoring||"",
      ismp_high_alert: !!r.ismp_high_alert,
      is_drip: false,
    };
    await DrugDosing.create(record);
    return normalizeEntityDrug(record);
  } catch { return null; }
};

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
const findDB = (n, entityDB) => {
  const q=n.toLowerCase();
  return entityDB.find(d=>d.name.toLowerCase().includes(q)||d.gen.toLowerCase().includes(q))||null;
};
const FLAG = {ok:{c:T.green,l:"Normal Dose"},caution:{c:T.gold,l:"Adjust Dose"},avoid:{c:T.coral,l:"AVOID"}};
// ISMP check uses entity flag when available, fallback set for known agents
const ISMP_FALLBACK = new Set(["vanc","morph","fent","midaz","succ","roc","enox","amio","prop","ketam","epi","norep"]);
const isISMP = (drug) => drug?.ismp || ISMP_FALLBACK.has(drug?.id);

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

// ── Allergy Cross-Check ───────────────────────────────────────────────────────
const CROSS_REACT = {
  penicillin: {drugs:["ceftx","cefep","ampsulb","nafcil","piptz"],label:"Penicillin-cephalosporin cross-reactivity ~1-2%",severity:"relative"},
  "beta-lactam": {drugs:["mero","erta","ceftx","cefep","ampsulb","nafcil","piptz"],label:"Beta-lactam class cross-reactivity",severity:"relative"},
};
const checkAllergy = (allergyStr, drug) => {
  if (!allergyStr||!drug) return [];
  const allergies = allergyStr.toLowerCase().split(/[,;]/).map(a=>a.trim()).filter(Boolean);
  const warnings = [];
  const ciList = (drug.ci||[]).map(c=>c.toLowerCase());
  for (const allergy of allergies) {
    for (const ci of ciList) {
      if (ci.includes(allergy)||(allergy.length>3&&ci.split(" ").some(w=>w.startsWith(allergy.slice(0,5))))) {
        warnings.push({allergy, ci, severity:"contraindicated", msg:`${drug.name}: ${ci}`});
      }
    }
    // Cross-reactivity checks
    for (const [key, cfg] of Object.entries(CROSS_REACT)) {
      if (allergy.includes(key) && cfg.drugs.includes(drug.id)) {
        if (!warnings.find(w=>w.msg?.includes(drug.name)&&w.severity==="cross-reactivity")) {
          warnings.push({allergy, ci:cfg.label, severity:"cross-reactivity", msg:`${drug.name}: ${cfg.label}`});
        }
      }
    }
  }
  return warnings;
};

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
        {/* Allergy field */}
        <div style={{flex:"1 1 200px",minWidth:180}}>
          <div style={{fontSize:8,fontFamily:"JetBrains Mono,monospace",color:T.coral,letterSpacing:1,textTransform:"uppercase",marginBottom:3}}>Allergies</div>
          <input value={pt.allergy||""} onChange={e=>f("allergy",e.target.value)}
            placeholder="e.g. Penicillin, Sulfa, NSAID"
            style={{...ib({fontSize:12,padding:"6px 10px",border:`1px solid ${pt.allergy?T.coral+"50":T.bdr}`})}} />
        </div>
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
        {pt.allergy&&<span style={{...tg(T.coral),fontSize:10,alignSelf:"flex-end",marginBottom:2}}>⚠ Allergy active</span>}
      </div>
    </div>
  );
}

// ── Tab 1: Rx Lookup ──────────────────────────────────────────────────────────
function RxLookupTab({pt,crcl,onAddToIx,entityDB,onNewDrug,onRecent}) {
  const [q,setQ]=useState(""); const [res,setRes]=useState([]); const [busy,setBusy]=useState(false);
  const [sel,setSel]=useState(null); const [dbDrug,setDbDrug]=useState(null);
  const [mono,setMono]=useState(null); const [monoLoad,setMonoLoad]=useState(false);
  const [monoOpen,setMonoOpen]=useState(false); const [activeInd,setActiveInd]=useState(0);
  const [snap,setSnap]=useState(null); const [snapLoad,setSnapLoad]=useState(false);
  const [snapCopied,setSnapCopied]=useState(false);
  const [pedWt,setPedWt]=useState(""); const [pedRes,setPedRes]=useState(null); const [pedLoad,setPedLoad]=useState(false);
  const [exp,setExp]=useState({}); const [ixToast,setIxToast]=useState(false);
  const [extracting,setExtracting]=useState(false);
  const [localRes,setLocalRes]=useState([]);
  const deb=useRef(null); const ixRef=useRef(null);

  const doSearch=useCallback(v=>{
    setQ(v);
    if(deb.current) clearTimeout(deb.current);
    if(!v.trim()||v.length<1){setRes([]);setLocalRes([]);return;}
    // Show entity DB matches immediately (no latency)
    const lq=v.toLowerCase();
    setLocalRes(entityDB.filter(d=>d.name.toLowerCase().includes(lq)||d.gen.toLowerCase().includes(lq)).slice(0,5));
    deb.current=setTimeout(async()=>{setBusy(true);const r=await searchFDA(v);setRes(r);setBusy(false);},250);
  },[entityDB]);

  const pick=async d=>{
    setSel(d);setMono(null);setSnap(null);setPedRes(null);setPedWt("");setExp({});setRes([]);setLocalRes([]);
    setQ(d.name||fdaName(d));setActiveInd(0);setMonoOpen(false);setSnapCopied(false);
    const found=d._entityOnly ? d : findDB(fdaGen(d)||fdaName(d),entityDB);
    setDbDrug(found);
    if(found) onRecent?.(found);
    if(d._entityOnly){
      // Entity-only pick: use entity data directly, fire AI calls with entity data as context
      const syntheticFda={openfda:{brand_name:[d.name],generic_name:[d.gen]},
        indications_and_usage:[d.sigs?.join(". ")||""],
        dosage_and_administration:[d.sigs?.join(". ")||""],
        warnings:[d.monitoring||""],boxed_warning:[]};
      triggerSnapshot(syntheticFda, found);
      triggerMonograph(syntheticFda, found);
      return;
    }
    triggerSnapshot(d, found);
    triggerMonograph(d, found);
    if(!found){
      setExtracting(true);
      const extracted=await extractAndSaveDrug(d);
      if(extracted){setDbDrug(extracted);onNewDrug(extracted);}
      setExtracting(false);
    }
  };

  const triggerSnapshot=async(fdaDrug, dbEntry)=>{
    setSnapLoad(true);
    try {
      const name=fdaName(fdaDrug); const gen=fdaGen(fdaDrug);
      const context=[
        `Drug: ${name} (${gen})`,
        fdaDrug.indications_and_usage?.[0]?`FDA Indications: ${trunc(fdaDrug.indications_and_usage[0],400)}`:"",
        fdaDrug.dosage_and_administration?.[0]?`FDA Dosing: ${trunc(fdaDrug.dosage_and_administration[0],400)}`:"",
        fdaDrug.warnings?.[0]?`Warnings: ${trunc(fdaDrug.warnings[0],250)}`:"",
        fdaDrug.boxed_warning?.[0]?`BOXED WARNING: ${trunc(fdaDrug.boxed_warning[0],200)}`:"",
        dbEntry?.peds?`Peds dose: ${dbEntry.peds}`:"",
        dbEntry?.monitoring?`Monitoring: ${dbEntry.monitoring}`:"",
      ].filter(Boolean).join("\n");

      const r=await InvokeLLM({
        prompt:`You are a senior emergency medicine pharmacist. Generate a concise ED bedside snapshot for ${name} (${gen}). Be direct, specific, and clinically actionable. ED context only.\n\n${context}\n\nFor duration_by_indication provide strings formatted as "Indication: duration" e.g. "CAP: 5-7 days". For top_interactions provide strings formatted as "Drug (SEVERITY) — effect" e.g. "Warfarin (MAJOR) — significant INR increase". Limit top_interactions to 2 entries maximum.`,
        response_json_schema:{
          type:"object",
          properties:{
            primary_ed_use:       {type:"string"},
            adult_dose:           {type:"string"},
            peds_dose:            {type:"string"},
            route:                {type:"string"},
            onset:                {type:"string"},
            critical_safety:      {type:"string"},
            duration_by_indication:{type:"array", items:{type:"string"}},
            top_interactions:     {type:"array", items:{type:"string"}},
            ehr_line:             {type:"string"},
          },
          required:["primary_ed_use","adult_dose","peds_dose","route","critical_safety","duration_by_indication","top_interactions","ehr_line"],
        },
      });
      setSnap(r);
    } catch(e) { setSnap({_err:true,msg:String(e)}); }
    setSnapLoad(false);
  };

  const triggerMonograph=async(fdaDrug, dbEntry)=>{
    setMonoLoad(true);
    try {
      const name=fdaName(fdaDrug); const gen=fdaGen(fdaDrug);
      const context=[
        `Drug: ${name} (${gen})`,
        fdaDrug.indications_and_usage?.[0]?`FDA Indications: ${trunc(fdaDrug.indications_and_usage[0],700)}`:"",
        fdaDrug.dosage_and_administration?.[0]?`FDA Dosing: ${trunc(fdaDrug.dosage_and_administration[0],700)}`:"",
        fdaDrug.contraindications?.[0]?`FDA Contraindications: ${trunc(fdaDrug.contraindications[0],400)}`:"",
        fdaDrug.warnings?.[0]?`FDA Warnings: ${trunc(fdaDrug.warnings[0],400)}`:"",
        fdaDrug.boxed_warning?.[0]?`BOXED WARNING: ${trunc(fdaDrug.boxed_warning[0],300)}`:"",
        fdaDrug.drug_interactions?.[0]?`FDA Drug Interactions: ${trunc(fdaDrug.drug_interactions[0],300)}`:"",
        dbEntry?.peds?`Known peds dose: ${dbEntry.peds}`:"",
        dbEntry?.monitoring?`Monitoring: ${dbEntry.monitoring}`:"",
        dbEntry?.hepatic?`Hepatic: ${dbEntry.hepatic}`:"",
      ].filter(Boolean).join("\n");

      const r=await InvokeLLM({
        prompt:`You are a clinical pharmacist generating a comprehensive drug monograph for an emergency department physician. Use all provided FDA label data and your clinical knowledge. Be specific, evidence-based, and clinically useful.\n\n${context}`,
        response_json_schema:{
          type:"object",
          properties:{
            drug_class:{type:"string"},
            mechanism:{type:"string"},
            summary:{type:"string"},
            indications:{
              type:"array",
              items:{
                type:"object",
                properties:{
                  name:{type:"string"},
                  adult_dose:{type:"string"},
                  adult_formulations:{type:"array",items:{type:"string"}},
                  peds_dose:{type:"string"},
                  peds_formulations:{type:"array",items:{type:"string"}},
                  peds_age_note:{type:"string"},
                  duration:{type:"string"},
                  route:{type:"string"},
                  notes:{type:"string"},
                },
                required:["name","adult_dose","duration","route"],
              },
            },
            contraindications:{
              type:"array",
              items:{
                type:"object",
                properties:{
                  item:{type:"string"},
                  severity:{type:"string",enum:["absolute","relative"]},
                  reason:{type:"string"},
                },
                required:["item","severity"],
              },
            },
            warnings:{type:"array",items:{type:"string"}},
            renal_adjustment:{type:"string"},
            hepatic_adjustment:{type:"string"},
            pregnancy_safety:{type:"string"},
            key_interactions:{type:"array",items:{type:"string"}},
            monitoring_parameters:{type:"array",items:{type:"string"}},
            clinical_pearls:{type:"array",items:{type:"string"}},
          },
          required:["drug_class","summary","indications","contraindications","warnings","clinical_pearls"],
        },
      });
      setMono(r);
    } catch{setMono({_err:true});}
    setMonoLoad(false);
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
  const allergyWarnings=useMemo(()=>checkAllergy(pt.allergy,dbDrug),[pt.allergy,dbDrug]);

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

      {/* Entity DB quick results — instant, no API */}
      {localRes.length>0&&!sel&&(
        <div style={{...gl({maxWidth:520,marginBottom:8,overflow:"hidden",border:`1px solid ${T.teal}30`})}}>
          <div style={{padding:"5px 12px",fontSize:8,color:T.teal,fontFamily:"JetBrains Mono,monospace",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",borderBottom:`1px solid ${T.bdr}`}}>⚡ Quick Match — Formulary</div>
          {localRes.map((d,i)=>(
            <div key={i} className="u-hov" onClick={()=>pick({...d,_entityOnly:true})} style={{padding:"9px 14px",cursor:"pointer",borderBottom:i<localRes.length-1?`1px solid ${T.bdr}`:"none",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontWeight:700,fontSize:13,color:T.teal}}>{d.name}</div>
                <div style={{fontSize:11,color:T.mut}}>{d.gen} · {d.cat}</div>
              </div>
              <div style={{display:"flex",gap:5}}>
                {d.ismp&&<span style={{fontSize:9,color:T.coral,fontWeight:700}}>⚠ ISMP</span>}
                <span style={{fontSize:9,color:T.teal}}>→</span>
              </div>
            </div>
          ))}
        </div>
      )}

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
                {isISMP(dbDrug)&&<span style={{borderRadius:6,padding:"3px 9px",fontSize:10,fontWeight:700,background:"rgba(255,96,96,0.22)",border:`1px solid ${T.coral}55`,color:T.coral}}>⚠ ISMP High-Alert</span>}
                {extracting&&<span style={{fontSize:10,color:T.gold}} className="u-pulse">Extracting dosing data...</span>}
                {dbDrug?._source==="ai_generated"&&<span style={{...tg(T.teal),fontSize:9}}>AI-extracted · verify</span>}
              </div>
              {fdaGen(sel)&&<div style={{fontSize:12,color:T.mut,fontStyle:"italic",marginBottom:8}}>{fdaGen(sel)}</div>}
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {sel.openfda?.route?.map((r,i)=><span key={i} style={{...tg(T.gold),fontSize:10}}>{r}</span>)}
                {sel.openfda?.product_type?.[0]&&<span style={{...tg(T.mut),fontSize:10,color:T.mut}}>{sel.openfda.product_type[0]}</span>}
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end"}}>
              <button onClick={()=>{setSel(null);setQ("");setDbDrug(null);setSnap(null);setMono(null);}} style={{...ab(T.coral,{padding:"6px 12px",fontSize:11})}}>✕ Close</button>
              <button onClick={addToIx} style={{...ab(T.teal,{padding:"6px 12px",fontSize:11})}}>➕ Add to Interactions</button>
              {ixToast&&<span className="u-in" style={{fontSize:10,color:T.green,fontWeight:700}}>✓ Added</span>}
            </div>
          </div>

          {/* Allergy warnings */}
          {allergyWarnings?.length>0&&(
            <div className="u-in" style={{...gl({padding:"12px 16px",marginBottom:12,border:`2px solid ${T.coral}55`,background:T.cD})}}>
              <div style={{fontSize:10,color:T.coral,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>⚠ Allergy Alert — Verify Before Prescribing</div>
              {allergyWarnings.map((w,i)=>(
                <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"6px 0",borderBottom:i<allergyWarnings.length-1?`1px solid ${T.bdr}`:"none"}}>
                  <span style={{...tg(w.severity==="contraindicated"?T.coral:T.gold),fontSize:9,flexShrink:0}}>{w.severity==="contraindicated"?"CONTRAINDICATED":"CROSS-REACTIVITY"}</span>
                  <span style={{fontSize:12,color:T.txt,lineHeight:1.5}}>{w.msg}</span>
                </div>
              ))}
            </div>
          )}

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

          {/* ── ED Snapshot ────────────────────────────────────────────────── */}
          <div style={{...gl({marginBottom:12,overflow:"hidden",border:`2px solid ${snapLoad?"rgba(0,180,216,.4)":snap&&!snap._err?T.teal+"55":T.bdr}`,background:snap&&!snap._err?"rgba(0,180,216,.04)":T.card})}}>
            {/* Snapshot header */}
            <div style={{padding:"11px 16px",display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:14}}>⚡</span>
              <span style={{fontSize:13,fontWeight:700,color:T.teal}}>ED Snapshot</span>
              {snapLoad&&(
                <div style={{display:"flex",alignItems:"center",gap:7}}>
                  <Sp/>
                  <span className="u-pulse" style={{fontSize:11,color:T.teal}}>Generating bedside summary...</span>
                </div>
              )}
              {snap&&!snap._err&&!snapLoad&&<span style={{...tg(T.green),fontSize:9}}>Ready</span>}
              {snap?._err&&<span style={{...tg(T.coral),fontSize:9}}>Failed</span>}
            </div>

            {snap&&!snap._err&&!snapLoad&&(
              <div className="u-in" style={{borderTop:`1px solid ${T.bdr}`,padding:"14px 18px"}}>

                {/* Primary use — full-width top */}
                <div style={{fontSize:13,fontWeight:700,color:T.txt,marginBottom:14,lineHeight:1.5,padding:"10px 14px",borderRadius:9,background:T.tD,border:`1px solid ${T.tB}`}}>
                  {snap.primary_ed_use}
                </div>

                {/* Dose cards — adult | peds | route | onset */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8,marginBottom:12}}>
                  {[
                    ["Adult Dose", snap.adult_dose, T.teal],
                    ["Peds Dose",  snap.peds_dose,  T.gold],
                    ["Route",      snap.route,      T.mut ],
                    ["Onset",      snap.onset||"—", T.dim ],
                  ].map(([l,v,c])=>(
                    <div key={l} style={{background:T.card,borderRadius:9,padding:"10px 12px",border:`1px solid ${T.bdr}`}}>
                      <div style={{fontSize:8,color:T.dim,fontFamily:"JetBrains Mono,monospace",letterSpacing:1,textTransform:"uppercase",marginBottom:5}}>{l}</div>
                      <div style={{fontSize:12,fontWeight:700,color:c,fontFamily:"JetBrains Mono,monospace",lineHeight:1.4}}>{v}</div>
                    </div>
                  ))}
                </div>

                {/* Critical safety — always red, always visible */}
                {snap.critical_safety&&(
                  <div style={{background:T.cD,borderRadius:9,padding:"10px 14px",marginBottom:12,border:`1px solid ${T.coral}40`,display:"flex",gap:10,alignItems:"flex-start"}}>
                    <span style={{fontSize:16,flexShrink:0}}>⚠</span>
                    <div>
                      <div style={{fontSize:9,color:T.coral,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Critical Safety</div>
                      <div style={{fontSize:13,color:T.txt,fontWeight:600,lineHeight:1.5}}>{snap.critical_safety}</div>
                    </div>
                  </div>
                )}

                {/* Duration table + top interactions — side by side */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
                  {/* Duration */}
                  {snap.duration_by_indication?.length>0&&(
                    <div style={{...gl({padding:"11px 14px"})}}>
                      <div style={{fontSize:9,color:T.purple,fontFamily:"JetBrains Mono,monospace",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>Duration by Indication</div>
                      {snap.duration_by_indication.map((row,i)=>{
                        const parts=row.split(":"); const ind=parts[0]||row; const dur=parts.slice(1).join(":").trim();
                        return(
                          <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",padding:"4px 0",borderBottom:i<snap.duration_by_indication.length-1?`1px solid ${T.bdr}`:"none",gap:8}}>
                            <span style={{fontSize:11,color:T.mut,flex:1,lineHeight:1.4}}>{ind}</span>
                            {dur&&<span style={{fontFamily:"JetBrains Mono,monospace",fontSize:11,fontWeight:700,color:T.purple,flexShrink:0}}>{dur}</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Top interactions */}
                  {snap.top_interactions?.length>0&&(
                    <div style={{...gl({padding:"11px 14px"})}}>
                      <div style={{fontSize:9,color:T.gold,fontFamily:"JetBrains Mono,monospace",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>Key Interactions</div>
                      {snap.top_interactions.map((ix,i)=>{
                        const isMajor=ix.toLowerCase().includes("major")||ix.toLowerCase().includes("critical");
                        const ixc=isMajor?T.coral:T.gold;
                        return(
                          <div key={i} style={{padding:"5px 0",borderBottom:i<snap.top_interactions.length-1?`1px solid ${T.bdr}`:"none"}}>
                            <div style={{fontSize:11,color:T.mut,lineHeight:1.5}}><span style={{color:ixc,fontWeight:700}}>→ </span>{ix}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Copy for EHR button */}
                {snap.ehr_line&&(
                  <div style={{display:"flex",gap:10,alignItems:"center",padding:"10px 14px",borderRadius:9,background:"rgba(0,0,0,.2)",border:`1px solid ${T.bdr}`,flexWrap:"wrap"}}>
                    <span style={{fontSize:11,color:T.mut,flex:1,fontFamily:"JetBrains Mono,monospace",lineHeight:1.5}}>{snap.ehr_line}</span>
                    <button
                      onClick={()=>{
                        navigator.clipboard?.writeText(snap.ehr_line).then(()=>{
                          setSnapCopied(true);
                          setTimeout(()=>setSnapCopied(false),2000);
                        });
                      }}
                      style={{...ab(snapCopied?T.green:T.teal,{padding:"5px 14px",fontSize:11,flexShrink:0})}}>
                      {snapCopied?"✓ Copied":"📋 Copy for EHR"}
                    </button>
                  </div>
                )}

                {/* Link to full monograph */}
                <button onClick={()=>setMonoOpen(p=>!p)} style={{marginTop:12,background:"none",border:"none",color:T.teal,fontSize:11,cursor:"pointer",padding:0,fontFamily:"DM Sans,sans-serif",display:"flex",alignItems:"center",gap:5}}>
                  {monoOpen?"▲ Collapse full monograph":"▼ View full clinical monograph"}
                </button>
              </div>
            )}

            {snap?._err&&(
              <div style={{padding:"12px 16px",borderTop:`1px solid ${T.bdr}`}}>
                <span style={{fontSize:12,color:T.coral}}>Snapshot unavailable — schema error or timeout.</span>
                <button onClick={()=>triggerSnapshot(sel,dbDrug)} style={{...ab(T.teal,{marginLeft:10,padding:"4px 12px",fontSize:11})}}>Retry</button>
              </div>
            )}
          </div>

          {/* ── Clinical Monograph ─────────────────────────────────────────── */}
          <div style={{...gl({marginBottom:12,overflow:"hidden",border:`1px solid ${monoLoad?T.teal+"40":mono&&!mono._err?T.teal+"30":T.bdr}`})}}>
            {/* Monograph header */}
            <button onClick={()=>setMonoOpen(p=>!p)} style={{width:"100%",background:"none",border:"none",padding:"12px 16px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:14}}>📋</span>
                <span style={{fontSize:13,fontWeight:700,color:T.teal}}>Clinical Monograph</span>
                {monoLoad&&<span className="u-pulse" style={{fontSize:11,color:T.teal}}>Generating...</span>}
                {mono&&!mono._err&&!monoLoad&&<span style={{...tg(T.green),fontSize:9}}>Complete</span>}
                {mono&&!mono._err&&mono.indications?.length>0&&<span style={{...tg(T.teal),fontSize:9}}>{mono.indications.length} indication{mono.indications.length!==1?"s":""}</span>}
              </div>
              <span style={{color:T.dim,fontSize:12}}>{monoOpen?"▲":"▼"}</span>
            </button>

            {monoOpen&&(
              <div style={{borderTop:`1px solid ${T.bdr}`,padding:"16px 18px"}}>

                {monoLoad&&(
                  <div style={{textAlign:"center",padding:"30px 20px"}}>
                    <div style={{display:"flex",justifyContent:"center",marginBottom:12}}><Sp/></div>
                    <div style={{fontSize:12,color:T.mut}}>Analyzing FDA label, dosing data, and clinical references...</div>
                  </div>
                )}

                {mono?._err&&(
                  <div style={{fontSize:12,color:T.coral,padding:"10px 0"}}>
                    Monograph generation failed.
                    <button onClick={()=>triggerMonograph(sel,dbDrug)} style={{...ab(T.teal,{marginLeft:10,padding:"4px 12px",fontSize:11})}}>Retry</button>
                  </div>
                )}

                {mono&&!mono._err&&!monoLoad&&(
                  <div className="u-in">

                    {/* Drug class + mechanism + summary */}
                    <div style={{...gl({padding:"12px 14px",marginBottom:14,background:T.tD,border:`1px solid ${T.tB}`})}}>
                      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8}}>
                        {mono.drug_class&&<span style={{...tg(T.teal),fontSize:10}}>{mono.drug_class}</span>}
                        {mono.pregnancy_safety&&<span style={{...tg(T.gold),fontSize:10}}>Pregnancy: {mono.pregnancy_safety}</span>}
                      </div>
                      {mono.mechanism&&<div style={{fontSize:11,color:T.mut,marginBottom:6,lineHeight:1.55}}><strong style={{color:T.dim}}>Mechanism: </strong>{mono.mechanism}</div>}
                      {mono.summary&&<div style={{fontSize:12,color:T.txt,lineHeight:1.6}}>{mono.summary}</div>}
                    </div>

                    {/* Indications — tab strip + detail */}
                    {mono.indications?.length>0&&(
                      <div style={{marginBottom:14}}>
                        <div style={{fontSize:9,color:T.teal,fontFamily:"JetBrains Mono,monospace",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:10}}>Indications & Dosing</div>

                        {/* Indication tabs */}
                        <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:12}}>
                          {mono.indications.map((ind,i)=>(
                            <button key={i} onClick={()=>setActiveInd(i)} style={{padding:"5px 13px",borderRadius:7,cursor:"pointer",border:`1px solid ${activeInd===i?T.teal+"55":T.bdr}`,background:activeInd===i?T.tD:"transparent",color:activeInd===i?T.teal:T.mut,fontSize:11,fontWeight:activeInd===i?700:500,fontFamily:"DM Sans,sans-serif",transition:"all .14s"}}>
                              {ind.name}
                            </button>
                          ))}
                        </div>

                        {/* Active indication detail */}
                        {(()=>{
                          const ind=mono.indications[activeInd];
                          if(!ind) return null;
                          return(
                            <div className="u-in" style={{...gl({padding:"14px 16px",border:`1px solid ${T.teal}25`})}}>
                              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>

                                {/* Adult dosing */}
                                <div style={{background:T.tD,borderRadius:9,padding:"12px 14px",border:`1px solid ${T.tB}`}}>
                                  <div style={{fontSize:9,color:T.teal,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Adult Dosing</div>
                                  <div style={{fontSize:14,fontWeight:700,color:T.txt,fontFamily:"JetBrains Mono,monospace",marginBottom:6,lineHeight:1.4}}>{ind.adult_dose}</div>
                                  {ind.route&&<div style={{fontSize:11,color:T.mut,marginBottom:6}}>Route: <strong style={{color:T.txt}}>{ind.route}</strong></div>}
                                  {ind.adult_formulations?.length>0&&(
                                    <div>
                                      <div style={{fontSize:9,color:T.dim,marginBottom:4}}>Available Formulations</div>
                                      {ind.adult_formulations.map((f,i)=>(
                                        <div key={i} style={{fontSize:10,color:T.mut,padding:"2px 0"}}>{f}</div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Peds dosing */}
                                <div style={{background:T.gD,borderRadius:9,padding:"12px 14px",border:`1px solid ${T.gold}25`}}>
                                  <div style={{fontSize:9,color:T.gold,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Pediatric Dosing</div>
                                  {ind.peds_dose?(
                                    <>
                                      <div style={{fontSize:13,fontWeight:700,color:T.txt,fontFamily:"JetBrains Mono,monospace",marginBottom:6,lineHeight:1.4}}>{ind.peds_dose}</div>
                                      {ind.peds_age_note&&<div style={{fontSize:10,color:T.coral,marginBottom:6}}>{ind.peds_age_note}</div>}
                                      {ind.peds_formulations?.length>0&&(
                                        <div>
                                          <div style={{fontSize:9,color:T.dim,marginBottom:4}}>Available Formulations</div>
                                          {ind.peds_formulations.map((f,i)=>(
                                            <div key={i} style={{fontSize:10,color:T.mut,padding:"2px 0"}}>{f}</div>
                                          ))}
                                        </div>
                                      )}
                                    </>
                                  ):(
                                    <div style={{fontSize:11,color:T.dim,fontStyle:"italic"}}>See peds dosing calculator below or consult pediatric pharmacist</div>
                                  )}
                                </div>
                              </div>

                              {/* Duration */}
                              {ind.duration&&(
                                <div style={{background:T.pD,borderRadius:8,padding:"10px 12px",marginBottom:10,border:`1px solid ${T.purple}25`}}>
                                  <div style={{fontSize:9,color:T.purple,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Recommended Duration</div>
                                  <div style={{fontSize:13,color:T.txt,fontWeight:600}}>{ind.duration}</div>
                                </div>
                              )}

                              {/* Indication notes */}
                              {ind.notes&&(
                                <div style={{fontSize:11,color:T.mut,lineHeight:1.6,padding:"8px 10px",borderRadius:7,border:`1px solid ${T.bdr}`,background:T.card}}>
                                  {ind.notes}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* Contraindications */}
                    {mono.contraindications?.length>0&&(
                      <div style={{marginBottom:14}}>
                        <div style={{fontSize:9,color:T.coral,fontFamily:"JetBrains Mono,monospace",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>Contraindications</div>
                        <div style={{display:"flex",flexDirection:"column",gap:5}}>
                          {mono.contraindications.map((ci,i)=>(
                            <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"8px 12px",borderRadius:8,background:ci.severity==="absolute"?T.cD:"rgba(240,165,0,.07)",border:`1px solid ${ci.severity==="absolute"?T.coral+"30":T.gold+"30"}`}}>
                              <span style={{...tg(ci.severity==="absolute"?T.coral:T.gold),fontSize:9,flexShrink:0,marginTop:1}}>{ci.severity==="absolute"?"ABSOLUTE":"RELATIVE"}</span>
                              <div>
                                <div style={{fontSize:12,fontWeight:700,color:T.txt}}>{ci.item}</div>
                                {ci.reason&&<div style={{fontSize:11,color:T.mut,marginTop:2}}>{ci.reason}</div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Warnings */}
                    {mono.warnings?.length>0&&(
                      <div style={{marginBottom:14}}>
                        <div style={{fontSize:9,color:T.coral,fontFamily:"JetBrains Mono,monospace",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>Warnings</div>
                        {mono.warnings.map((w,i)=>(
                          <div key={i} style={{fontSize:12,color:T.mut,padding:"5px 10px",borderLeft:`3px solid ${T.coral}55`,marginBottom:4,lineHeight:1.55}}>{w}</div>
                        ))}
                      </div>
                    )}

                    {/* 3-col: Renal / Hepatic / Interactions */}
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                      {mono.renal_adjustment&&(
                        <div style={{...gl({padding:"11px 14px",borderLeft:`3px solid ${T.gold}`})}}>
                          <div style={{fontSize:9,color:T.gold,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>Renal Adjustment</div>
                          <div style={{fontSize:11,color:T.txt,lineHeight:1.6}}>{mono.renal_adjustment}</div>
                        </div>
                      )}
                      {mono.hepatic_adjustment&&(
                        <div style={{...gl({padding:"11px 14px",borderLeft:`3px solid ${T.orange}`})}}>
                          <div style={{fontSize:9,color:T.orange,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>Hepatic Adjustment</div>
                          <div style={{fontSize:11,color:T.txt,lineHeight:1.6}}>{mono.hepatic_adjustment}</div>
                        </div>
                      )}
                    </div>

                    {/* Key interactions */}
                    {mono.key_interactions?.length>0&&(
                      <div style={{marginBottom:14}}>
                        <div style={{fontSize:9,color:T.gold,fontFamily:"JetBrains Mono,monospace",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>Key Drug Interactions</div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
                          {mono.key_interactions.map((x,i)=>(
                            <div key={i} style={{fontSize:11,color:T.mut,padding:"5px 9px",borderRadius:6,background:T.gD,borderLeft:`2px solid ${T.gold}55`,lineHeight:1.5}}>{x}</div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Monitoring parameters */}
                    {mono.monitoring_parameters?.length>0&&(
                      <div style={{marginBottom:14}}>
                        <div style={{fontSize:9,color:T.purple,fontFamily:"JetBrains Mono,monospace",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>Monitoring Parameters</div>
                        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                          {mono.monitoring_parameters.map((m,i)=>(
                            <span key={i} style={{...tg(T.purple),fontSize:10}}>{m}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Clinical pearls */}
                    {mono.clinical_pearls?.length>0&&(
                      <div>
                        <div style={{fontSize:9,color:T.teal,fontFamily:"JetBrains Mono,monospace",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>★ Clinical Pearls</div>
                        {mono.clinical_pearls.map((p,i)=>(
                          <div key={i} style={{fontSize:12,color:T.txt,padding:"7px 12px",borderRadius:7,background:T.tD,borderLeft:`3px solid ${T.teal}`,marginBottom:6,lineHeight:1.6}}>{p}</div>
                        ))}
                      </div>
                    )}

                    <div style={{fontSize:9,color:T.dim,marginTop:10}}>AI-synthesized from FDA label + clinical references · Always verify against current prescribing information</div>
                  </div>
                )}
              </div>
            )}
          </div>

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
function WeightDripTab({pt,entityDB}) {
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
  const wtDrugs=entityDB.filter(d=>d.wt!==null);
  const dripDrugs=entityDB.filter(d=>d.drip!==null);
  const rsiInductions=entityDB.filter(d=>["etom","ketam","prop"].includes(d.id));
  const rsiParalytics=entityDB.filter(d=>["succ","roc"].includes(d.id));

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
            {[...new Set(wtDrugs.map(d=>d.cat))].sort().map(cat=>{
              const drugs=wtDrugs.filter(d=>d.cat===cat);
              if(!drugs.length) return null;
              const catLabel={rsi:"RSI",sedation:"Sedation",analgesic:"Analgesia",antibiotic:"Antibiotics",cardiac:"Cardiac",reversal:"Reversal",anticoagulant:"Anticoagulation",pressor:"Pressors",neuro:"Neuro",metabolic:"Metabolic",other:"Other"}[cat]||cat;
              return(
                <div key={cat} style={{marginBottom:8}}>
                  <div style={{fontSize:8,color:T.dim,fontFamily:"JetBrains Mono,monospace",letterSpacing:1.5,textTransform:"uppercase",padding:"2px 6px",marginBottom:3}}>{catLabel}</div>
                  {drugs.map(d=>(
                    <button key={d.id} onClick={()=>setSelDrug(d)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%",textAlign:"left",padding:"7px 10px",borderRadius:7,border:`1px solid ${selDrug?.id===d.id?T.teal+"55":T.bdr}`,background:selDrug?.id===d.id?T.tD:T.card,color:T.txt,fontSize:12,fontFamily:"DM Sans,sans-serif",cursor:"pointer",marginBottom:3}}>
                      <span>{d.name}</span>
                      {isISMP(d)&&<span style={{fontSize:8,color:T.coral,fontWeight:700,flexShrink:0}}>⚠</span>}
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
            {[entityDB.find(d=>d.id===rsiInd),entityDB.find(d=>d.id===rsiPar)].filter(Boolean).map(drug=>{
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
    if(!v.trim()||v.length<1){setRes([]);return;}
    deb.current=setTimeout(async()=>{setBusy(true);const r=await searchFDA(v);setRes(r.slice(0,5));setBusy(false);},250);
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
function RxBuilderTab({pt,crcl,entityDB}) {
  const [rx,setRx]=useState({drug:"",dose:"",route:"PO",freq:"",qty:"",refills:"0",indication:"",ptName:"",dob:"",allergy:""});
  const [pharmacy,setPharmacy]=useState(null);
  const [copied,setCopied]=useState(false);
  const f=(k,v)=>setRx(p=>({...p,[k]:v}));

  const renalSig=useMemo(()=>{
    if(!rx.drug||!crcl) return null;
    const d=findDB(rx.drug,entityDB);
    if(!d) return null;
    const tier=getActiveTier(d,crcl);
    if(!tier||tier[2]==="ok") return null;
    return {drug:d.name,dose:tier[1],flag:tier[2],label:tier[0]};
  },[rx.drug,crcl,entityDB]);

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
        ibw?`IBW: ${Math.round(ibw)}kg`:"",pt.dialysis?"On dialysis":"",
        pt.allergy?`Allergies: ${pt.allergy}`:""].filter(Boolean).join(", ");
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

// ── Tab 6: Scenario Protocols ─────────────────────────────────────────────────
const SCENARIOS=[
  {id:"sepsis",   label:"Septic Shock",           icon:"🚨",color:"#ff6060",drugs:["Pip-Tazo 4.5g","Vancomycin","Norepinephrine"],tags:["Hour-1 bundle","Blood cultures x2","30 mL/kg IVF"]},
  {id:"anaph",    label:"Anaphylaxis",             icon:"⚠️",color:"#ff9f43",drugs:["Epinephrine","Diphenhydramine","Methylprednisolone"],tags:["Epi IM first-line","0.3 mg IM anterolateral thigh","Repeat q5-15 min"]},
  {id:"status",   label:"Status Epilepticus",      icon:"🧠",color:"#9b6dff",drugs:["Lorazepam","Levetiracetam","Phenytoin"],tags:["4 mg IV x2 lorazepam","Keppra load 2000-4500 mg","Recheck glucose"]},
  {id:"dka",      label:"DKA",                     icon:"⚗️",color:"#f0a500",drugs:["Insulin Regular","Potassium","Normal Saline"],tags:["Hold insulin if K+ <3.5","Fluid resuscitation first","q1h glucose monitoring"]},
  {id:"htn",      label:"Hypertensive Emergency",  icon:"💢",color:"#ff6060",drugs:["Labetalol","Nicardipine","Hydralazine"],tags:["Reduce MAP 20-25% over 1h","Avoid rapid correction","Check for end-organ damage"]},
  {id:"afib",     label:"AFib with RVR",           icon:"🫀",color:"#00b4d8",drugs:["Diltiazem","Metoprolol IV","Amiodarone"],tags:["Rate control target HR <100","Check CHADS2-VASc","Heparin if >48h or unknown onset"]},
  {id:"chf",      label:"Acute Pulmonary Edema",   icon:"🫁",color:"#3b9eff",drugs:["Furosemide","Nitroglycerin","Morphine"],tags:["Furosemide IV 1-2x PO dose","Nitro if SBP >100","CPAP/BiPAP early"]},
  {id:"rsi",      label:"RSI / Airway Emergency",  icon:"🫁",color:"#ff6060",drugs:["Etomidate","Ketamine","Succinylcholine","Rocuronium"],tags:["Pre-oxygenate x3 min","SALAD technique","BVM backup ready"]},
  {id:"opo",      label:"Opioid Overdose",         icon:"💊",color:"#4ade80",drugs:["Naloxone"],tags:["0.4 mg IV/IN titrated","Avoid full reversal","Observe 2-4h post-naloxone"]},
  {id:"tca",      label:"TCA / Na-Channel Toxicity",icon:"⚡",color:"#f0a500",drugs:["Sodium Bicarbonate","Norepinephrine"],tags:["NaHCO3 1-2 mEq/kg IV bolus","Titrate to QRS <120 ms","Avoid physostigmine"]},
  {id:"asthma",   label:"Severe Asthma",           icon:"🌬️",color:"#00b4d8",drugs:["Albuterol","Magnesium Sulfate","Dexamethasone"],tags:["Continuous neb albuterol","MgSO4 2g IV over 20 min","Consider HeliOx","Early intubation is high-risk"]},
  {id:"ppe",      label:"PE (Massive)",             icon:"🩺",color:"#ff6060",drugs:["Alteplase","Unfractionated Heparin"],tags:["tPA 100 mg over 2h","Heparin as bridge if PCI planned","Systolic BP <90 = massive"]},
];

function ScenarioTab({pt,crcl,entityDB}) {
  const [sel,setSel]=useState(null);
  const [proto,setProto]=useState(null);
  const [load,setLoad]=useState(false);
  const [copied,setCopied]=useState(false);

  const run=async(scenario)=>{
    setSel(scenario); setProto(null); setLoad(true);
    const wt=pt.wt||"unknown";
    const crclStr=crcl?`CrCl ${Math.round(crcl)} mL/min`:"renal function unknown";
    const allergy=pt.allergy?`Known allergies: ${pt.allergy}`:"No known allergies";
    const localDrugs=scenario.drugs.map(name=>{
      const d=entityDB.find(x=>x.name.toLowerCase().includes(name.toLowerCase()));
      return d?`${d.name}: ${d.sigs?.[0]||d.monitoring||"see monograph"}`:`${name}: see formulary`;
    }).join("\n");
    try {
      const r=await InvokeLLM({
        prompt:`You are a senior ED clinical pharmacist. Generate an ED management protocol for: ${scenario.label}.
Patient: weight ${wt} kg, ${crclStr}, ${allergy}.
Available drugs and sigs from formulary:\n${localDrugs}
Provide a structured ED protocol — step-by-step, with specific doses, timing, and escalation triggers. Be concise and clinically actionable. Max 200 words.`,
        response_json_schema:{type:"object",properties:{
          first_line:{type:"string"},
          second_line:{type:"string"},
          monitoring:{type:"string"},
          escalation:{type:"string"},
          key_pitfalls:{type:"array",items:{type:"string"}},
        },required:["first_line","second_line","monitoring","escalation","key_pitfalls"]},
      });
      setProto(r);
    } catch { setProto({_err:true}); }
    setLoad(false);
  };

  const copyProto=()=>{
    if(!proto||!sel) return;
    const txt=[`=== ${sel.label} — ED Protocol ===`,
      `FIRST LINE: ${proto.first_line}`,`SECOND LINE: ${proto.second_line}`,
      `MONITORING: ${proto.monitoring}`,`ESCALATION: ${proto.escalation}`,
      `PITFALLS: ${proto.key_pitfalls?.join("; ")}`].join("\n\n");
    navigator.clipboard?.writeText(txt).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);});
  };

  return(
    <div className="u-in" style={{display:"grid",gridTemplateColumns:"220px 1fr",gap:14,alignItems:"start"}}>
      {/* Scenario list */}
      <div style={{...gl({padding:"8px",overflow:"auto",maxHeight:560})}}>
        {SCENARIOS.map(s=>(
          <button key={s.id} onClick={()=>run(s)} style={{display:"flex",alignItems:"center",gap:9,width:"100%",textAlign:"left",padding:"9px 11px",borderRadius:9,border:`1px solid ${sel?.id===s.id?s.color+"55":T.bdr}`,background:sel?.id===s.id?`${s.color}12`:T.card,cursor:"pointer",marginBottom:5,transition:"all .15s"}}>
            <span style={{fontSize:18,flexShrink:0}}>{s.icon}</span>
            <div>
              <div style={{fontSize:12,fontWeight:700,color:sel?.id===s.id?s.color:T.txt}}>{s.label}</div>
              <div style={{fontSize:9,color:T.dim,marginTop:1}}>{s.drugs.slice(0,2).join(", ")}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Protocol panel */}
      <div>
        {!sel&&(
          <div style={{textAlign:"center",padding:"60px 20px",color:T.dim}}>
            <div style={{fontSize:36,marginBottom:12}}>🚨</div>
            <div style={{fontSize:14,color:T.mut,marginBottom:5}}>Select a clinical scenario</div>
            <div style={{fontSize:11}}>AI-generated ED protocol with patient-specific context</div>
          </div>
        )}
        {sel&&(
          <div className="u-in">
            <div style={{...gl({padding:"14px 18px",marginBottom:12,borderLeft:`4px solid ${sel.color}`,background:`${sel.color}08`})}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10,marginBottom:10}}>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:6}}>
                    <span style={{fontSize:22}}>{sel.icon}</span>
                    <h3 style={{margin:0,fontFamily:"Playfair Display,serif",fontSize:18,color:sel.color,lineHeight:1.1}}>{sel.label}</h3>
                  </div>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                    {sel.tags.map((t,i)=><span key={i} style={{borderRadius:6,padding:"2px 8px",fontSize:10,background:`${sel.color}15`,border:`1px solid ${sel.color}30`,color:sel.color}}>{t}</span>)}
                  </div>
                </div>
                {proto&&!proto._err&&(
                  <button onClick={copyProto} style={{...ab(sel.color,{padding:"5px 12px",fontSize:11})}}>
                    {copied?"✓ Copied":"📋 Copy Protocol"}
                  </button>
                )}
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {sel.drugs.map((d,i)=>{
                  const dbD=entityDB.find(x=>x.name.toLowerCase().includes(d.toLowerCase()));
                  return <span key={i} style={{borderRadius:6,padding:"3px 10px",fontSize:11,fontWeight:700,background:T.tD,border:`1px solid ${T.tB}`,color:T.teal}}>{d}{dbD?"":" *"}</span>;
                })}
              </div>
            </div>

            {load&&(
              <div style={{...gl({padding:"24px",textAlign:"center"})}}>
                <Sp/>
                <div style={{fontSize:12,color:T.mut,marginTop:10}} className="u-pulse">Generating {sel.label} protocol...</div>
              </div>
            )}

            {proto&&!proto._err&&!load&&(
              <div className="u-in">
                {[["First Line",proto.first_line,sel.color],["Second Line / Escalation",proto.second_line,T.gold],
                  ["Monitoring",proto.monitoring,T.teal],["Escalation Triggers",proto.escalation,T.coral]].map(([l,v,c])=>v&&(
                  <div key={l} style={{...gl({padding:"12px 16px",marginBottom:10,borderLeft:`3px solid ${c}55`})}}>
                    <div style={{fontSize:9,color:c,fontFamily:"JetBrains Mono,monospace",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:6}}>{l}</div>
                    <div style={{fontSize:13,color:T.txt,lineHeight:1.65}}>{v}</div>
                  </div>
                ))}
                {proto.key_pitfalls?.length>0&&(
                  <div style={{...gl({padding:"12px 16px",borderLeft:`3px solid ${T.gold}`})}}>
                    <div style={{fontSize:9,color:T.gold,fontFamily:"JetBrains Mono,monospace",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>⚠ Key Pitfalls</div>
                    {proto.key_pitfalls.map((p,i)=><div key={i} style={{fontSize:12,color:T.mut,padding:"3px 0",lineHeight:1.55}}>• {p}</div>)}
                  </div>
                )}
                <div style={{fontSize:9,color:T.dim,marginTop:8}}>AI-generated with patient context · Verify against current ED protocols</div>
              </div>
            )}
            {proto?._err&&<div style={{fontSize:12,color:T.coral,marginTop:8}}>Protocol generation failed. Retry or consult clinical resources.</div>}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tab 7: Recent / Favorites ─────────────────────────────────────────────────
function RecentTab({recent,favorites,onPick,onFav,onUnfav}) {
  return(
    <div className="u-in" style={{maxWidth:600}}>
      {favorites.length>0&&(
        <div style={{marginBottom:20}}>
          <div style={{fontSize:9,color:T.gold,fontFamily:"JetBrains Mono,monospace",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:10}}>★ Pinned Favorites</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {favorites.map((d,i)=>(
              <div key={i} style={{...gl({padding:"9px 14px",display:"flex",alignItems:"center",gap:10})}}>
                <button onClick={()=>onPick(d)} style={{background:"none",border:"none",cursor:"pointer",textAlign:"left",padding:0}}>
                  <div style={{fontSize:13,fontWeight:700,color:T.teal}}>{d.name}</div>
                  <div style={{fontSize:10,color:T.mut}}>{d.gen}</div>
                </button>
                <button onClick={()=>onUnfav(d)} style={{background:"none",border:"none",color:T.dim,cursor:"pointer",fontSize:14,padding:0,lineHeight:1}}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}
      <div>
        <div style={{fontSize:9,color:T.teal,fontFamily:"JetBrains Mono,monospace",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:10}}>🕐 Recent Lookups</div>
        {recent.length===0?(
          <div style={{textAlign:"center",padding:"40px 20px",color:T.dim,fontSize:12}}>No recent lookups yet — search a drug in Rx Lookup to populate history</div>
        ):(
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {recent.map((d,i)=>(
              <div key={i} className="u-hov" style={{...gl({padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"})}}>
                <button onClick={()=>onPick(d)} style={{background:"none",border:"none",cursor:"pointer",textAlign:"left",flex:1,padding:0}}>
                  <div style={{fontSize:13,fontWeight:700,color:T.txt}}>{d.name}</div>
                  <div style={{fontSize:10,color:T.mut}}>{d.gen} · {d.cat}</div>
                </button>
                <button onClick={()=>onFav(d)} title="Pin to favorites"
                  style={{background:"none",border:"none",color:favorites.find(f=>f.name===d.name)?T.gold:T.dim,cursor:"pointer",fontSize:16,padding:"0 4px"}}>★</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
export default function UnifiedPharmacologyHub() {
  const [pt,setPt]=useState({age:"",wt:"",ht:"",scr:"",sex:"M",dialysis:false,allergy:""});
  const [tab,setTab]=useState("rx");
  const [ixDrugs,setIxDrugs]=useState([]);
  const [entityDB,setEntityDB]=useState([]);
  const [dbLoaded,setDbLoaded]=useState(false);
  const [recent,setRecent]=useState([]);
  const [favorites,setFavorites]=useState([]);

  useEffect(()=>{
    DrugDosing.filter({},{limit:500}).then(records=>{
      setEntityDB(records.map(normalizeEntityDrug));
      setDbLoaded(true);
    }).catch(()=>setDbLoaded(true));
  },[]);

  const crcl=useMemo(()=>calcCrCl({age:pt.age,wt:pt.wt,scr:pt.scr,sex:pt.sex}),[pt.age,pt.wt,pt.scr,pt.sex]);
  const ibw=useMemo(()=>calcIBW(pt.ht,pt.sex),[pt.ht,pt.sex]);

  const addToIx=useCallback(async({name,generic})=>{
    if(ixDrugs.find(d=>d.name===name)||ixDrugs.length>=6) return;
    setIxDrugs(p=>[...p,{name,generic,rxcui:null,resolving:true}]);
    const rxcui=await getRxCUI(generic||name);
    setIxDrugs(p=>p.map(d=>d.name===name?{...d,rxcui,resolving:false}:d));
  },[ixDrugs]);

  const addToRecent=useCallback((drug)=>{
    const entry={name:drug.name||"",gen:drug.gen||"",cat:drug.cat||"",id:drug.id||""};
    setRecent(p=>[entry,...p.filter(d=>d.name!==entry.name)].slice(0,10));
  },[]);

  const TABS=[
    {id:"rx",       icon:"⚗",  label:"Rx Lookup"},
    {id:"scenario", icon:"🚨", label:"Scenarios"},
    {id:"wt",       icon:"⚖",  label:"Weight / Drip"},
    {id:"ix",       icon:"🔬", label:"Interactions",badge:ixDrugs.length>0?ixDrugs.length:null},
    {id:"build",    icon:"📋", label:"Rx Builder"},
    {id:"ai",       icon:"🤖", label:"AI Pharmacist"},
    {id:"recent",   icon:"🕐", label:"Recent",badge:recent.length>0?recent.length:null},
  ];

  return(
    <div style={{display:"flex",minHeight:"100vh",background:T.bg,color:T.txt}}>
      <NotryaNav currentHub="UnifiedPharmacologyHub" />
      <div style={{flex:1,overflow:"auto",display:"flex",flexDirection:"column",minWidth:0}}>
        <NotryaHubHeader hubName="Unified Pharmacology Hub" category="Pharmacology" homeUrl="/" />
        <NotryaPatientBar />
      <div style={{padding:"20px 18px 60px",fontFamily:"DM Sans,sans-serif"}}>

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
      {tab==="rx"      &&<RxLookupTab   pt={pt} crcl={crcl} onAddToIx={addToIx} entityDB={entityDB} onNewDrug={d=>setEntityDB(p=>[...p,d])} onRecent={addToRecent}/>}
      {tab==="scenario" &&<ScenarioTab    pt={pt} crcl={crcl} entityDB={entityDB}/>}
      {tab==="wt"       &&<WeightDripTab  pt={pt} entityDB={entityDB}/>}
      {tab==="ix"       &&<InteractionTab ixDrugs={ixDrugs} setIxDrugs={setIxDrugs}/>}
      {tab==="build"    &&<RxBuilderTab   pt={pt} crcl={crcl} entityDB={entityDB}/>}
      {tab==="ai"       &&<AIPharmacistTab pt={pt} crcl={crcl} ibw={ibw}/>}
      {tab==="recent"   &&<RecentTab recent={recent} favorites={favorites}
          onPick={d=>{setTab("rx");addToRecent(d);}}
          onFav={d=>setFavorites(p=>p.find(f=>f.name===d.name)?p:[...p,d])}
          onUnfav={d=>setFavorites(p=>p.filter(f=>f.name!==d.name))}/>}

      <div style={{marginTop:40,textAlign:"center"}}>
        <span style={{fontFamily:"JetBrains Mono,monospace",fontSize:9,color:T.dim,letterSpacing:1.5}}>
          NOTRYA · UNIFIED PHARMACOLOGY HUB · CLINICAL DECISION SUPPORT ONLY · VERIFY WITH PHARMACIST
        </span>
      </div>
      </div>
      </div>
    </div>
  );
}