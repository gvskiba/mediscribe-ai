import{useState,useCallback}from"react";
import ChestPainHub        from"@/pages/ChestPainHub";
import ECGHub              from"@/pages/ECGHub";
import CardiacTamponadeHub from"@/pages/CardiacTamponadeHub";
import STEMIHub            from"@/pages/STEMIHub";

// ── HOME PROTOCOLS (10 entries) ──────────────────────────────
const HOME_PROTOCOLS=[
  {id:"acs",       icon:"🫀",abbr:"ACS",  title:"Acute Coronary Syndrome",         subtitle:"STEMI · NSTEMI · Unstable Angina",                    badge:"2025 ACC/AHA", tagline:"D2B ≤ 90 min · TNK calculator · 6-tab protocol",       color:"#ff6b6b",glow:"rgba(255,107,107,.35)",glass:"rgba(255,107,107,.07)",border:"rgba(255,107,107,.28)",accent:"#ff9999",stat:{value:"≤90",unit:"min",label:"Door-to-Balloon"},tags:["STEMI","NSTEMI","TNK","ACS Protocol"]},
  {id:"stemi",     icon:"🗺️",abbr:"STEMI",title:"STEMI Hub",                        subtitle:"Territory · Equivalents · Activation · Complications", badge:"2025 ACC/AHA", tagline:"Territory localizer · STEMI equivalents · Activation",  color:"#ff6b6b",glow:"rgba(255,107,107,.35)",glass:"rgba(255,107,107,.07)",border:"rgba(255,107,107,.28)",accent:"#ff9999",stat:{value:"≤90",unit:"min",label:"Door-to-Balloon"},tags:["De Winter","Wellens","RV Infarct","Complications"]},
  {id:"cardiac-risk",icon:"📊",abbr:"RISK",title:"Cardiac Risk",                    subtitle:"HEART · TIMI · GRACE · Risk Stratification",            badge:"Multi-Score",  tagline:"Stratify chest pain · Risk-adjusted disposition",        color:"#f5c842",glow:"rgba(245,200,66,.35)",glass:"rgba(245,200,66,.07)",border:"rgba(245,200,66,.28)",accent:"#f7d474",stat:{value:"HEART",unit:"score",label:"Primary tool"},tags:["HEART Score","TIMI","GRACE","Stratification"]},
  {id:"chest-pain",icon:"💔",abbr:"CP",   title:"Chest Pain Hub",                   subtitle:"DDx · Workup · Dispo · POCUS",                          badge:"ACEP 2025",   tagline:"Comprehensive chest pain evaluation pathway",             color:"#ff9f43",glow:"rgba(255,159,67,.35)",glass:"rgba(255,159,67,.07)",border:"rgba(255,159,67,.28)",accent:"#ffb77a",stat:{value:"ACS",unit:"1st",label:"R/O priority"},tags:["PE","Dissection","Pericarditis","DDx"]},
  {id:"ecg",       icon:"📈",abbr:"ECG",  title:"ECG Hub",                          subtitle:"Rhythm · Blocks · Ischaemia · Patterns",                 badge:"12-Lead",     tagline:"Systematic ECG interpretation · Pattern recognition",     color:"#3b9eff",glow:"rgba(59,158,255,.35)",glass:"rgba(59,158,255,.07)",border:"rgba(59,158,255,.28)",accent:"#6db8ff",stat:{value:"12",unit:"leads",label:"Full analysis"},tags:["WPW","LBBB","ST Changes","Patterns"]},
  {id:"tachy",     icon:"⚡",abbr:"TACHY",title:"Tachycardia",                       subtitle:"SVT · VT · AFib · Cardioversion Energies",               badge:"ACLS 2025",   tagline:"Stable vs unstable · Cardioversion guide · Drug reference",color:"#f5c842",glow:"rgba(245,200,66,.35)",glass:"rgba(245,200,66,.07)",border:"rgba(245,200,66,.28)",accent:"#f7d474",stat:{value:"< 3",unit:"min",label:"Cardiovert unstable"},tags:["SVT","VT","AFib","Cardioversion"]},
  {id:"brady",     icon:"🔻",abbr:"BRADY",title:"Bradycardia",                       subtitle:"Symptomatic · TCP · Transvenous · H's & T's",            badge:"ACLS 2025",   tagline:"Atropine → TCP → vasopressors · Mobitz II directive",     color:"#3b9eff",glow:"rgba(59,158,255,.35)",glass:"rgba(59,158,255,.07)",border:"rgba(59,158,255,.28)",accent:"#6db8ff",stat:{value:"1 mg",unit:"atropine",label:"First-line"},tags:["AV Block","TCP","Atropine","Transvenous"]},
  {id:"tamponade", icon:"💧",abbr:"TAMP", title:"Cardiac Tamponade",                 subtitle:"Beck's Triad · POCUS · Pericardiocentesis",              badge:"ACC/AHA · Echo",tagline:"Bedside POCUS diagnosis · Subxiphoid technique",          color:"#00d4ff",glow:"rgba(0,212,255,.35)",glass:"rgba(0,212,255,.06)",border:"rgba(0,212,255,.25)",accent:"#33dcff",stat:{value:"50 mL",unit:"drained",label:"Can be lifesaving"},tags:["Beck's Triad","POCUS","Pericardiocentesis"]},
  {id:"peds",      icon:"👶",abbr:"PALS", title:"Pediatric ACLS",                   subtitle:"Cardiac Arrest · Brady · Tachy · PALS Drugs",             badge:"PALS 2025",   tagline:"Weight-based dosing · PALS algorithms · Defib reference", color:"#9b6dff",glow:"rgba(155,109,255,.35)",glass:"rgba(155,109,255,.09)",border:"rgba(155,109,255,.28)",accent:"#b594ff",stat:{value:"15:2",unit:"ratio",label:"2-rescuer CPR"},tags:["PALS","Defibrillation","Epi","Amiodarone"]},
  {id:"pregnancy", icon:"🤰",abbr:"OB",   title:"Cardiac Arrest in Pregnancy",       subtitle:"PMCD · LUD · Maternal Resuscitation",                    badge:"AHA 2020",    tagline:"Dual-patient emergency · Perimortem C-section by 5 min", color:"#00e5c0",glow:"rgba(0,229,192,.3)",glass:"rgba(0,229,192,.06)",border:"rgba(0,229,192,.25)",accent:"#33eccc",stat:{value:"5 min",unit:"PMCD",label:"If no ROSC"},tags:["LUD","ABCDEFGH","PMCD Tool"]},
];

// ── SHARED UI PRIMITIVES ──────────────────────────────────────
function GlassPageHeader({icon,title,badge,badgeColor,sub,onBack,extra}){
  const bc=badgeColor==="coral"?"rgba(255,107,107,.1)":badgeColor==="purple"?"rgba(155,109,255,.1)":"rgba(0,229,192,.1)";
  const bbc=badgeColor==="coral"?"var(--coral)":badgeColor==="purple"?"var(--purple)":"var(--teal)";
  const bbr=badgeColor==="coral"?"rgba(255,107,107,.3)":badgeColor==="purple"?"rgba(155,109,255,.3)":"rgba(0,229,192,.3)";
  return(
    <div style={{background:"rgba(8,22,40,.75)",border:"1px solid var(--border)",borderRadius:12,padding:"14px 18px",backdropFilter:"blur(16px)",display:"flex",gap:12,alignItems:"center",justifyContent:"space-between",flexWrap:"wrap"}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        {onBack&&<button onClick={onBack} style={{background:"rgba(59,158,255,.1)",border:"1px solid rgba(59,158,255,.25)",borderRadius:8,padding:"6px 12px",color:"var(--blue)",fontSize:12,fontFamily:"'JetBrains Mono',monospace"}}>back</button>}
        <span style={{fontSize:28}}>{icon}</span>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            <h2 style={{fontSize:17,fontWeight:700,fontFamily:"'Playfair Display',serif",color:"var(--txt)",margin:0}}>{title}</h2>
            {badge&&<span style={{fontSize:9,background:bc,color:bbc,border:`1px solid ${bbr}`,borderRadius:20,padding:"2px 8px",fontFamily:"'JetBrains Mono',monospace",fontWeight:700}}>{badge}</span>}
          </div>
          {sub&&<div style={{fontSize:11,color:"var(--txt3)",marginTop:2}}>{sub}</div>}
        </div>
      </div>
      {extra&&<div>{extra}</div>}
    </div>
  );
}

function GlassSectionBox({icon,title,sub,children}){
  return(
    <div style={{background:"rgba(8,22,40,.65)",border:"1px solid var(--border)",borderRadius:12,padding:"16px 18px",backdropFilter:"blur(12px)"}}>
      {(icon||title)&&<div style={{marginBottom:14,paddingBottom:10,borderBottom:"1px solid rgba(26,53,85,.6)"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {icon&&<span style={{fontSize:16}}>{icon}</span>}
          <span style={{fontSize:13,fontWeight:600,color:"var(--txt)",fontFamily:"'DM Sans',sans-serif"}}>{title}</span>
        </div>
        {sub&&<div style={{fontSize:10,color:"var(--txt3)",marginTop:3,fontFamily:"'JetBrains Mono',monospace"}}>{sub}</div>}
      </div>}
      {children}
    </div>
  );
}

function TimeBanner({targets}){
  return(
    <div style={{display:"grid",gridTemplateColumns:`repeat(${targets.length},1fr)`,gap:8}}>
      {targets.map((t,i)=>(
        <div key={i} style={{background:"rgba(8,22,40,.6)",border:`1px solid ${t.color}40`,borderRadius:10,padding:"10px 8px",textAlign:"center",backdropFilter:"blur(8px)"}}>
          <div style={{fontSize:16,marginBottom:2}}>{t.icon}</div>
          <div style={{fontSize:13,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",color:t.color,lineHeight:1.1}}>{t.target}</div>
          <div style={{fontSize:9,color:"var(--txt3)",marginTop:2,lineHeight:1.3}}>{t.label}</div>
        </div>
      ))}
    </div>
  );
}

function FlowChart({nodes}){
  const clr=c=>({
    coral:{bg:"rgba(255,107,107,.07)",br:"rgba(255,107,107,.28)",c:"var(--coral)"},
    orange:{bg:"rgba(255,159,67,.07)",br:"rgba(255,159,67,.28)",c:"var(--orange)"},
    blue:{bg:"rgba(59,158,255,.07)",br:"rgba(59,158,255,.28)",c:"var(--blue)"},
    teal:{bg:"rgba(0,229,192,.07)",br:"rgba(0,229,192,.3)",c:"var(--teal)"},
    gold:{bg:"rgba(245,200,66,.07)",br:"rgba(245,200,66,.28)",c:"var(--gold)"},
    purple:{bg:"rgba(155,109,255,.09)",br:"rgba(155,109,255,.28)",c:"var(--purple)"},
  })[c]||{bg:"rgba(14,37,68,.4)",br:"var(--border)",c:"var(--txt)"};
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
      {nodes.map((n,i)=>{
        if(n.arrow) return<div key={i} style={{fontSize:16,color:"var(--txt4)",lineHeight:1,padding:"1px 0"}}>&#8595;</div>;
        if(n.type==="decision") return(
          <div key={i} style={{width:"100%",maxWidth:540,marginBottom:2}}>
            <div style={{background:"rgba(59,158,255,.07)",border:"1px solid rgba(59,158,255,.3)",borderRadius:10,padding:"9px 14px",textAlign:"center",fontSize:12,fontWeight:700,color:"var(--blue)",marginBottom:6}}>{n.text}</div>
            <div style={{display:"grid",gridTemplateColumns:`repeat(${n.branches.length},1fr)`,gap:8}}>
              {n.branches.map((b,j)=>{const t=clr(b.color);return(
                <div key={j} style={{background:t.bg,border:`1px solid ${t.br}`,borderRadius:8,padding:"8px 10px",textAlign:"center"}}>
                  {b.tag&&<div style={{fontSize:9,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",color:t.c,marginBottom:3}}>{b.tag}</div>}
                  <div style={{fontSize:10.5,color:"var(--txt)",whiteSpace:"pre-line",lineHeight:1.4}}>{b.label}</div>
                </div>
              );})}
            </div>
          </div>
        );
        const t=n.type==="start"?{bg:"rgba(59,158,255,.1)",br:"rgba(59,158,255,.4)",c:"var(--blue)"}:n.type==="outcome"?clr("teal"):clr(n.color);
        return(
          <div key={i} style={{background:t.bg,border:`1px solid ${t.br}`,borderRadius:10,padding:"10px 14px",width:"100%",maxWidth:540}}>
            <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
              <span style={{fontSize:12,fontWeight:700,color:t.c,flex:1,lineHeight:1.3}}>{n.text}</span>
              {n.badge&&<span style={{fontSize:9,background:t.bg,border:`1px solid ${t.br}`,borderRadius:20,padding:"1px 7px",color:t.c,fontFamily:"'JetBrains Mono',monospace",fontWeight:700,flexShrink:0}}>{n.badge}</span>}
            </div>
            {n.sub&&<div style={{fontSize:10,color:"var(--txt3)",marginTop:3}}>{n.sub}</div>}
            {n.items?.length>0&&<ul style={{margin:"5px 0 0",paddingLeft:16,display:"flex",flexDirection:"column",gap:2}}>{n.items.map((it,k)=><li key={k} style={{fontSize:11,color:"var(--txt3)",lineHeight:1.4}}>{it}</li>)}</ul>}
          </div>
        );
      })}
    </div>
  );
}

function DrugTable({rows}){
  if(!rows?.length) return null;
  return(
    <div style={{display:"flex",flexDirection:"column",gap:6}}>
      {rows.map((r,i)=>(
        <div key={i} style={{background:i%2===0?"rgba(14,37,68,.4)":"rgba(8,22,40,.3)",border:"1px solid rgba(26,53,85,.5)",borderRadius:8,padding:"10px 12px",backdropFilter:"blur(6px)"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5,flexWrap:"wrap"}}>
            {r.cat&&<span style={{fontSize:9,background:"rgba(59,158,255,.1)",border:"1px solid rgba(59,158,255,.25)",borderRadius:20,padding:"1px 7px",color:"var(--blue)",fontFamily:"'JetBrains Mono',monospace",fontWeight:700,flexShrink:0}}>{r.cat}</span>}
            <span style={{fontSize:12,fontWeight:700,color:"var(--txt)",fontFamily:"'DM Sans',sans-serif"}}>{r.drug}</span>
            {r.cor&&<span style={{fontSize:9,background:r.cor==="I"?"rgba(0,229,192,.1)":"rgba(245,200,66,.1)",color:r.cor==="I"?"var(--teal)":"var(--gold)",border:`1px solid ${r.cor==="I"?"rgba(0,229,192,.3)":"rgba(245,200,66,.3)"}`,borderRadius:20,padding:"1px 6px",fontFamily:"'JetBrains Mono',monospace",fontWeight:700,marginLeft:"auto",flexShrink:0}}>COR {r.cor}</span>}
          </div>
          <div style={{fontSize:11,color:"var(--teal)",fontFamily:"'JetBrains Mono',monospace",marginBottom:r.note?4:0,lineHeight:1.4,whiteSpace:"pre-line"}}>{r.dose}</div>
          {r.note&&<div style={{fontSize:10.5,color:"var(--txt3)",lineHeight:1.4}}>{r.note}</div>}
        </div>
      ))}
    </div>
  );
}

function ProtocolCard({p,onClick,index}){
  const[hov,setHov]=useState(false);
  return(
    <div onClick={()=>onClick(p.id)} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{background:hov?p.glass:"rgba(8,22,40,.7)",border:`1px solid ${hov?p.border:"rgba(26,53,85,.6)"}`,borderRadius:12,padding:"12px",cursor:"pointer",transition:"all .2s",backdropFilter:"blur(12px)",boxShadow:hov?`0 4px 20px ${p.glow}`:"none"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
        <span style={{fontSize:22}}>{p.icon}</span>
        <span style={{fontSize:8,background:"rgba(14,37,68,.7)",border:"1px solid rgba(26,53,85,.7)",borderRadius:20,padding:"2px 6px",color:"var(--txt4)",fontFamily:"'JetBrains Mono',monospace"}}>{p.abbr}</span>
      </div>
      <div style={{fontSize:11,fontWeight:700,color:hov?p.color:"var(--txt)",transition:"color .2s",fontFamily:"'DM Sans',sans-serif",lineHeight:1.3,marginBottom:3}}>{p.title}</div>
      <div style={{fontSize:9,color:"var(--txt4)",lineHeight:1.4}}>{p.tagline}</div>
      {p.stat&&<div style={{marginTop:7,paddingTop:7,borderTop:`1px solid ${p.border}`,display:"flex",alignItems:"baseline",gap:3}}>
        <span style={{fontSize:14,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",color:p.color}}>{p.stat.value}</span>
        <span style={{fontSize:8,color:p.color}}>{p.stat.unit}</span>
        <span style={{fontSize:8,color:"var(--txt4)",marginLeft:"auto"}}>{p.stat.label}</span>
      </div>}
    </div>
  );
}

function ACSHomePage({onNavigate}){
  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{textAlign:"center",padding:"18px 0 6px"}}>
        <h1 style={{fontSize:26,fontWeight:700,fontFamily:"'Playfair Display',serif",color:"var(--coral)",marginBottom:4}}>Emergency Cardiology</h1>
        <div style={{fontSize:11,color:"var(--txt3)"}}>10 protocols · AHA/ACC/ACEP 2025 Guidelines</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:4}}>
        {[{icon:"📋",label:"Protocols",val:"10",color:"var(--blue)"},{icon:"⚡",label:"D2B Target",val:"90min",color:"var(--coral)"},{icon:"🎯",label:"Guidelines",val:"2025",color:"var(--teal)"}].map((s,i)=>(
          <div key={i} style={{background:"rgba(8,22,40,.6)",border:"1px solid var(--border)",borderRadius:10,padding:"10px",textAlign:"center",backdropFilter:"blur(8px)"}}>
            <div style={{fontSize:16,marginBottom:2}}>{s.icon}</div>
            <div style={{fontSize:15,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",color:s.color}}>{s.val}</div>
            <div style={{fontSize:9,color:"var(--txt4)"}}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:10}}>
        {["acs","stemi","cardiac-risk","chest-pain","ecg"].map((id,i)=>{const p=HOME_PROTOCOLS.find(x=>x.id===id);return p?<ProtocolCard key={p.id} p={p} onClick={onNavigate} index={i}/>:null;})}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:22}}>
        {["tachy","brady","tamponade","peds","pregnancy"].map((id,i)=>{const p=HOME_PROTOCOLS.find(x=>x.id===id);return p?<ProtocolCard key={p.id} p={p} onClick={onNavigate} index={i+5}/>:null;})}
      </div>
    </div>
  );
}

// ── PROTOCOL DATA ─────────────────────────────────────────────
const STEMI_WORKUP=[
  {icon:"📋",label:"12-Lead ECG",class1:true,detail:"Within 10 min of arrival · Repeat if initial non-diagnostic · Posterior leads V7-V9 if inferior MI",time:"0-10 min"},
  {icon:"💊",label:"Aspirin 324 mg PO (chew)",class1:true,detail:"Immediate unless contraindicated · Do NOT withhold for possible CABG",time:"0-5 min"},
  {icon:"🩸",label:"IV Access x 2",class1:true,detail:"Large-bore antecubital preferred · IO if no IV within 90 sec",time:"0-5 min"},
  {icon:"🧬",label:"Labs - hs-cTnI/T, CBC, BMP, Coag, T&S",class1:true,detail:"STAT send · Do NOT delay cath activation for results",time:"0-10 min"},
  {icon:"📡",label:"Continuous Monitoring + Defib Pads",class1:true,detail:"12-lead telemetry · SpO2 · BP q5 min · pads applied immediately",time:"Immediately"},
  {icon:"🏥",label:"Cath Lab Activation - single call",class1:true,detail:"Cardiology + IR + cath team simultaneously · ETA communicated",time:"< 10 min"},
  {icon:"💉",label:"Anticoagulation",class1:true,detail:"UFH 60 U/kg IV (max 4,000 U) then 12 U/kg/h OR Bivalirudin 0.75 mg/kg then 1.75 mg/kg/h",time:"< 30 min"},
  {icon:"🔵",label:"P2Y12 Loading",class1:true,detail:"Ticagrelor 180 mg PO (preferred) OR Prasugrel 60 mg · Clopidogrel if CABG cannot be excluded",time:"< 60 min"},
  {icon:"📊",label:"Echo / POCUS",class1:false,detail:"If diagnosis uncertain · wall motion · EF · effusion · valve pathology",time:"Early"},
  {icon:"🩻",label:"CXR",class1:false,detail:"Do NOT delay cath for CXR · assess for widened mediastinum · POCUS preferred",time:"Opportunistic"},
];

const TNK_ABSOLUTE=[
  "Prior intracranial haemorrhage (any time)",
  "Ischaemic stroke within 3 months",
  "Intracranial neoplasm or structural cerebrovascular lesion",
  "Significant closed head or facial trauma within 3 months",
  "Active internal bleeding (not menses)",
  "Suspected aortic dissection",
  "Severe uncontrolled hypertension (SBP > 180 or DBP > 110 refractory to treatment)",
];

const TNK_RELATIVE=[
  "Prior ischaemic stroke > 3 months ago",
  "SBP > 180 or DBP > 110 on presentation (controlled now)",
  "Traumatic or prolonged CPR > 10 min",
  "Major surgery within 3 weeks",
  "Internal bleeding within 2-4 weeks",
  "Non-compressible vascular puncture",
  "Pregnancy",
  "Active peptic ulcer disease",
  "Current anticoagulant use (INR > 2 or therapeutic DOAC)",
  "Dementia",
];

const TNK_DOSING=[
  {weight:"< 60 kg",  dose:"30 mg"},
  {weight:"60-69 kg", dose:"35 mg"},
  {weight:"70-79 kg", dose:"40 mg"},
  {weight:"80-89 kg", dose:"45 mg"},
  {weight:">= 90 kg", dose:"50 mg"},
];

const STEMI_RX=[
  {cat:"Antiplatelet", drug:"Aspirin",               dose:"324 mg PO chew - immediately",                            note:"COR I - do NOT withhold for possible CABG"},
  {cat:"Antiplatelet", drug:"Ticagrelor (preferred)", dose:"180 mg PO load then 90 mg BID",                          note:"COR I - hold >= 5 days before CABG"},
  {cat:"Anticoagulant",drug:"UFH",                   dose:"60 U/kg IV (max 4,000) then 12 U/kg/h",                  note:"COR I - target aPTT 50-70 sec"},
  {cat:"Anticoagulant",drug:"Bivalirudin",            dose:"0.75 mg/kg IV then 1.75 mg/kg/h",                        note:"COR IIa - alternative to UFH for primary PCI"},
  {cat:"Lipid",        drug:"High-Intensity Statin",  dose:"Atorvastatin 80 mg OR Rosuvastatin 40 mg PO",            note:"COR I - start immediately, regardless of LDL"},
  {cat:"Beta-Blocker", drug:"Metoprolol",             dose:"25-50 mg PO q6h x 24h then XR form",                    note:"COR I - start within 24h if no HF, shock, or high-degree block"},
  {cat:"Vasodilator",  drug:"Nitroglycerin",          dose:"SL 0.4 mg q5 min x 3 then IV 5-200 mcg/min",            note:"CONTRAINDICATED: RV infarct, SBP < 90, PDE5 inhibitor use"},
];

const NSTEMI_RX=[
  {cat:"Antiplatelet", drug:"Aspirin",               dose:"162-325 mg PO chew",                                      note:"COR I - immediate; true allergy only contraindication"},
  {cat:"Antiplatelet", drug:"Ticagrelor",            dose:"180 mg PO load then 90 mg BID",                           note:"COR I - preferred over clopidogrel for NSTE-ACS"},
  {cat:"Anticoagulant",drug:"Enoxaparin",            dose:"1 mg/kg SC BID (CrCl > 30) · 1 mg/kg IV for early PCI", note:"COR I - preferred over UFH for NSTE-ACS"},
  {cat:"Anticoagulant",drug:"Fondaparinux",          dose:"2.5 mg SC daily",                                         note:"COR I - preferred if no PCI planned; avoid CrCl < 30"},
  {cat:"Lipid",        drug:"High-Intensity Statin", dose:"Atorvastatin 80 mg OR Rosuvastatin 40 mg PO",             note:"COR I - same-day initiation"},
  {cat:"Beta-Blocker", drug:"Metoprolol",            dose:"25-50 mg PO q6h early oral",                              note:"COR I - avoid if decompensated HF or high-degree block"},
  {cat:"ACE-I",        drug:"Ramipril",              dose:"2.5 mg PO BID (titrate up)",                              note:"COR I - within 24h if EF < 40%, hypertension, or DM"},
  {cat:"Vasodilator",  drug:"Nitroglycerin",         dose:"SL for active chest pain then IV 5-200 mcg/min",          note:"COR I - ongoing ischaemia; avoid if hypotension or RV infarct"},
];

const TERRITORIES=[
  {lead:"II, III, aVF",     territory:"Inferior",           artery:"RCA (80%) · LCx (20%)",       color:"orange",caveat:"Check V3R/V4R for RV infarct · avoid nitrates if RV involvement · AV block common with proximal RCA"},
  {lead:"V1-V4",            territory:"Anterior / Septal",  artery:"LAD (proximal)",               color:"coral", caveat:"Highest mortality · largest territory · cardiogenic shock risk · watch for new LBBB or complete heart block"},
  {lead:"V3-V5",            territory:"Anterior",           artery:"LAD (mid)",                    color:"coral", caveat:"Moderate-sized infarct · LV function generally better preserved than proximal LAD occlusion"},
  {lead:"I, aVL, V5-V6",   territory:"Lateral",            artery:"LCx or diagonal branch",       color:"blue",  caveat:"May coexist with anterior or inferior STEMI · isolated lateral MI often small territory"},
  {lead:"V1-V6 + I + aVL", territory:"Extensive Anterior", artery:"Proximal LAD (pre-diagonal)",  color:"coral", caveat:"Very high mortality · complete LAD territory · cardiogenic shock very likely · consider LVAD early"},
  {lead:"V1-V2 STD + tall R",territory:"Posterior",        artery:"RCA or LCx",                   color:"purple",caveat:"STEMI equivalent · order posterior leads V7-V9 (STE >= 0.5mm confirms) · often missed as NSTEMI"},
  {lead:"V3R, V4R",         territory:"Right Ventricle",   artery:"Proximal RCA",                 color:"gold",  caveat:"Complicates 25-40% inferior MI · avoid nitrates/diuretics/morphine · fluid resuscitate · preload dependent"},
];

const STEMI_EQUIVALENTS=[
  {eq:"New LBBB",color:"coral",detail:"New or presumed-new LBBB + ischemic symptoms = STEMI equivalent · activate cath lab · Sgarbossa criteria: concordant STE >= 1mm, discordant STE >= 5mm (Smith-modified >= 25% of S-wave), STD >= 1mm V1-V3"},
  {eq:"De Winter T-Waves",color:"orange",detail:"Upsloping STD >= 1mm at J-point + tall symmetric T-waves V1-V6 · LAD occlusion equivalent · often misread as NSTEMI · immediate cath lab regardless of troponin result"},
  {eq:"Posterior STEMI",color:"purple",detail:"STD V1-V2 + dominant R wave >= 0.04s + upright T wave = posterior STEMI · confirm with V7-V9 (STE >= 0.5mm) · RCA or LCx · order posterior leads proactively for all inferior MI"},
  {eq:"Wellens Syndrome",color:"blue",detail:"Type A: biphasic T-waves V2-V3 · Type B: deeply inverted T-waves V2-V3 · occurs during pain-free interval · critical proximal LAD stenosis · HIGH risk massive anterior MI · do NOT stress test · urgent cath"},
  {eq:"aVR Elevation + Diffuse STD",color:"coral",detail:"STE in aVR >= 1mm + diffuse ST depression >= 6 leads · left main or proximal LAD equivalent · cardiogenic shock likely · highest mortality STEMI pattern · immediate interventional cardiology consultation"},
];

const TERR_COLORS={
  coral: {bg:"rgba(255,107,107,0.07)",br:"rgba(255,107,107,0.28)",c:"var(--coral)"},
  orange:{bg:"rgba(255,159,67,0.07)", br:"rgba(255,159,67,0.28)", c:"var(--orange)"},
  blue:  {bg:"rgba(59,158,255,0.07)", br:"rgba(59,158,255,0.28)", c:"var(--blue)"},
  gold:  {bg:"rgba(245,200,66,0.07)", br:"rgba(245,200,66,0.28)", c:"var(--gold)"},
  purple:{bg:"rgba(155,109,255,0.09)",br:"rgba(155,109,255,0.28)",c:"var(--purple)"},
};

const TACHY_DRUGS=[
  {cat:"Unstable - Electrical",drug:"Synchronized Cardioversion",dose:"Narrow/regular: 50-100J · Narrow/irregular (AFib): 120-200J biphasic · Wide/regular: 100J · Wide/irregular: defibrillation dose (UNSYNC)",cor:"I",loe:"B",note:"Sedate conscious patient if time permits - do NOT delay for unstable patient."},
  {cat:"Stable Narrow Regular",drug:"Vagal Maneuvers",dose:"Modified Valsalva (recumbent, strain x 15 s, then supine leg raise) - first-line before drugs",cor:"I",loe:"B",note:"Effective in ~50% of SVT."},
  {cat:"Stable Narrow Regular",drug:"Adenosine",dose:"6 mg rapid IV push + 20 mL NS flush; if no conversion: 12 mg x 2",cor:"I",loe:"B",note:"Do NOT use for irregular or pre-excited AFib - can precipitate VF."},
  {cat:"Stable Narrow Regular",drug:"Diltiazem (CCB)",dose:"0.25 mg/kg IV over 2 min (max 25 mg); repeat 0.35 mg/kg after 15 min then infusion 5-15 mg/h",cor:"I",loe:"B",note:"Rate control for AFib/flutter. Avoid if EF < 40%."},
  {cat:"Stable Narrow Regular",drug:"Metoprolol (beta-Blocker)",dose:"2.5-5 mg IV over 2 min; may repeat up to 3 doses",cor:"I",loe:"B",note:"Alternative to diltiazem. Avoid in bronchospasm / decompensated HF."},
  {cat:"Stable Wide Regular",drug:"Procainamide",dose:"20-50 mg/min IV until arrhythmia suppressed, hypotension, or QRS > 50%; max 17 mg/kg then maintenance 1-4 mg/min",cor:"IIa",loe:"B",note:"Preferred for stable monomorphic VT. Avoid if prolonged QT or CHF."},
  {cat:"Stable Wide Regular",drug:"Amiodarone",dose:"150 mg IV over 10 min; repeat prn then maintenance 1 mg/min x 6h, then 0.5 mg/min x 18h",cor:"IIa",loe:"B",note:"Use if procainamide unavailable or contraindicated."},
  {cat:"Stable Wide Regular",drug:"Sotalol",dose:"100 mg (1.5 mg/kg) IV over 5 min",cor:"IIb",loe:"B",note:"Do NOT use if prolonged QT, HF, or hypokalaemia."},
  {cat:"Torsades de Pointes",drug:"Magnesium Sulfate",dose:"1-2 g IV over 5-60 min (loading); maintenance infusion 0.5-1 g/h",cor:"IIb",loe:"C",note:"First-line for TdP. Correct K+ (target > 4.0) and Mg2+. Also for polymorphic VT + long QT."},
  {cat:"AFib / AFl - Anticoag",drug:"Anticoagulation",dose:"Assess CHA2DS2-VASc score · Start if AFib onset unknown or > 48h · Haemodynamic instability = cardiovert emergently regardless",cor:"I",loe:"A",note:"DOACs preferred. TEE or bridging if elective cardioversion needed."},
];

const BRADY_DRUGS=[
  {cat:"First-Line",  drug:"Atropine",             dose:"1 mg IV/IO bolus; repeat q3-5 min; max 3 mg total",cor:"I",  loe:"B",note:"Blocks vagal tone. Ineffective for Mobitz II / 3rd-degree block - go straight to TCP."},
  {cat:"Second-Line", drug:"Transcutaneous Pacing", dose:"Set rate 60-80 bpm; start at 0 mA, increase until electrical + mechanical capture; sedate if conscious",cor:"I",loe:"B",note:"First-line for Mobitz II / 3rd-degree block. Confirm mechanical capture by palpating pulse."},
  {cat:"Second-Line", drug:"Dopamine Infusion",     dose:"5-20 mcg/kg/min IV; titrate to heart rate and BP",cor:"IIa",loe:"B",note:"beta1 + alpha agonist. Equal alternative to TCP if atropine fails."},
  {cat:"Second-Line", drug:"Epinephrine Infusion",  dose:"2-10 mcg/min IV; titrate to response",cor:"IIa",loe:"B",note:"Use when dopamine is insufficient or unavailable."},
  {cat:"Specialist",  drug:"Transvenous Pacing",    dose:"Via femoral / subclavian / internal jugular · set rate 60-80 bpm · output 10-20 mA above capture threshold",cor:"I",loe:"C",note:"Definitive bridge when TCP fails · expert consultation required · EP/cardiology mandatory."},
  {cat:"Special Cases",drug:"Glucagon",             dose:"3 mg IV bolus; then 3 mg/h infusion if needed",cor:"IIa",loe:"C",note:"beta-blocker OR calcium channel blocker overdose - specific antidote."},
  {cat:"Special Cases",drug:"Calcium Chloride",     dose:"1 g (10 mL of 10%) IV slow push over 10 min",cor:"IIa",loe:"C",note:"Calcium channel blocker overdose or hyperkalaemia-induced bradycardia."},
  {cat:"Special Cases",drug:"High-Dose Insulin (HIE)",dose:"1 U/kg IV bolus then 0.5-1 U/kg/h infusion + D50W titrated to maintain glucose 100-250 mg/dL",cor:"IIb",loe:"C",note:"Severe CCB or beta-blocker toxicity. Monitor glucose q15-30 min. Onset 15-45 min."},
];

const PALS_DEFIB=[
  {rhythm:"VF / pVT - 1st shock",         energy:"2 J/kg",               type:"Async"},
  {rhythm:"VF / pVT - subsequent shocks", energy:"4 J/kg (max 10 J/kg)", type:"Async"},
  {rhythm:"SVT - unstable (1st shock)",   energy:"0.5-1 J/kg",           type:"Sync"},
  {rhythm:"SVT - repeat shock",           energy:"2 J/kg",               type:"Sync"},
  {rhythm:"VT with pulse - unstable",     energy:"0.5-1 J/kg then 2 J/kg",type:"Sync"},
];

const PALS_DRUGS=[
  {cat:"Cardiac Arrest",drug:"Epinephrine",        dose:"0.01 mg/kg IV/IO q3-5 min (0.1 mL/kg of 1:10,000)\nET dose: 0.1 mg/kg (1:1,000) if no IV/IO · Max single dose: 1 mg",cor:"I",  loe:"B",note:"First vasopressor for all pediatric cardiac arrest rhythms."},
  {cat:"Cardiac Arrest",drug:"Amiodarone",         dose:"5 mg/kg IV/IO bolus (shockable rhythm - VF/pVT)\nRepeat up to 2x (max 15 mg/kg/day)",cor:"IIb",loe:"B",note:"Refractory VF / pulseless VT. Alternative: Lidocaine."},
  {cat:"Cardiac Arrest",drug:"Lidocaine",          dose:"1 mg/kg IV/IO bolus then maintenance 20-50 mcg/kg/min",cor:"IIb",loe:"B",note:"Alternative to amiodarone for VF/pVT. Use one or the other - do NOT combine."},
  {cat:"Bradycardia",   drug:"Atropine",           dose:"0.02 mg/kg IV/IO (min 0.1 mg, max 0.5 mg per dose)\nRepeat once if needed · Max total 1 mg",cor:"IIa",loe:"C",note:"For vagally mediated bradycardia or heart block. Pre-intubation vagal block in neonates."},
  {cat:"Bradycardia",   drug:"Epinephrine",        dose:"0.01 mg/kg IV/IO q3-5 min (1:10,000 concentration)",cor:"I",  loe:"C",note:"Bradycardia with poor perfusion despite oxygenation - CPR if HR < 60 bpm with poor perfusion."},
  {cat:"SVT (Stable)",  drug:"Adenosine",          dose:"0.1 mg/kg IV/IO rapid push (max 6 mg)\n2nd dose: 0.2 mg/kg (max 12 mg)",cor:"I",loe:"B",note:"Flush immediately with 5-10 mL NS. Use proximal IV. Continuous ECG monitoring essential."},
  {cat:"SVT (Stable)",  drug:"Amiodarone (SVT/VT)",dose:"5 mg/kg IV/IO over 20-60 min (perfusing rhythm)",cor:"IIa",loe:"C",note:"For SVT/VT refractory to adenosine. Do NOT combine with procainamide."},
  {cat:"SVT (Stable)",  drug:"Procainamide",       dose:"15 mg/kg IV/IO over 30-60 min (do NOT combine with amiodarone)",cor:"IIa",loe:"C",note:"Alternative to amiodarone. Monitor ECG and BP continuously during infusion."},
];

// ── SUB-COMPONENTS ────────────────────────────────────────────
function TNKChecker(){
  const[weight,setWeight]=useState("");
  const[ci,setCi]=useState({});
  const w=parseFloat(weight);
  const dose=!w?null:w<60?"30 mg":w<70?"35 mg":w<80?"40 mg":w<90?"45 mg":"50 mg";
  const absCI=TNK_ABSOLUTE.filter((_,i)=>ci["a"+i]);
  const relCI=TNK_RELATIVE.filter((_,i)=>ci["r"+i]);
  return(
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
        <div style={{flex:1,minWidth:160}}>
          <div style={{fontSize:10,color:"var(--txt3)",marginBottom:4,fontFamily:"'JetBrains Mono',monospace"}}>Patient weight (kg)</div>
          <input type="number" placeholder="e.g. 75" value={weight} onChange={e=>setWeight(e.target.value)}
            style={{width:"100%",background:"rgba(14,37,68,.6)",border:"1px solid var(--border)",borderRadius:8,padding:"8px 12px",color:"var(--txt)",fontSize:14,fontFamily:"'JetBrains Mono',monospace"}}/>
        </div>
        {dose&&<div style={{background:"rgba(0,229,192,.07)",border:"1px solid rgba(0,229,192,.3)",borderRadius:10,padding:"10px 16px",textAlign:"center",flexShrink:0}}>
          <div style={{fontSize:22,fontWeight:700,color:"var(--teal)",fontFamily:"'JetBrains Mono',monospace"}}>{dose}</div>
          <div style={{fontSize:9,color:"var(--txt3)"}}>TNK - single IV bolus over 5-10 sec</div>
        </div>}
      </div>
      <div style={{fontSize:11,fontWeight:700,color:"var(--coral)"}}>Absolute Contraindications - tap to flag</div>
      {TNK_ABSOLUTE.map((c,i)=>(
        <div key={i} onClick={()=>setCi(p=>({...p,["a"+i]:!p["a"+i]}))}
          style={{display:"flex",gap:10,alignItems:"center",padding:"7px 10px",borderRadius:7,cursor:"pointer",background:ci["a"+i]?"rgba(255,107,107,.1)":"rgba(14,37,68,.35)",border:`1px solid ${ci["a"+i]?"rgba(255,107,107,.4)":"var(--border)"}`}}>
          <span style={{fontSize:14}}>{ci["a"+i]?"X":""}</span>
          <span style={{fontSize:11,color:ci["a"+i]?"var(--coral)":"var(--txt3)"}}>{c}</span>
        </div>
      ))}
      {absCI.length>0&&<div style={{background:"rgba(255,107,107,.08)",border:"2px solid rgba(255,107,107,.5)",borderRadius:10,padding:"10px 14px",fontSize:12,fontWeight:700,color:"var(--coral)",textAlign:"center"}}>ABSOLUTE CONTRAINDICATION - TNK is CONTRAINDICATED</div>}
      {absCI.length===0&&<>
        <div style={{fontSize:11,fontWeight:700,color:"var(--orange)"}}>Relative Contraindications</div>
        {TNK_RELATIVE.map((c,i)=>(
          <div key={i} onClick={()=>setCi(p=>({...p,["r"+i]:!p["r"+i]}))}
            style={{display:"flex",gap:10,alignItems:"center",padding:"7px 10px",borderRadius:7,cursor:"pointer",background:ci["r"+i]?"rgba(255,159,67,.1)":"rgba(14,37,68,.35)",border:`1px solid ${ci["r"+i]?"rgba(255,159,67,.4)":"var(--border)"}`}}>
            <span style={{fontSize:14}}>{ci["r"+i]?"!":""}</span>
            <span style={{fontSize:11,color:ci["r"+i]?"var(--orange)":"var(--txt3)"}}>{c}</span>
          </div>
        ))}
        {relCI.length>=2&&<div style={{background:"rgba(255,159,67,.08)",border:"1px solid rgba(255,159,67,.4)",borderRadius:10,padding:"9px 14px",fontSize:11,color:"var(--orange)",textAlign:"center"}}>{relCI.length} relative CIs present - weigh benefit vs. risk · cardiology consultation</div>}
        {dose&&absCI.length===0&&<div style={{background:"rgba(0,229,192,.07)",border:"1px solid rgba(0,229,192,.3)",borderRadius:10,padding:"9px 14px",fontSize:12,fontWeight:700,color:"var(--teal)",textAlign:"center"}}>TNK {dose} IV - no absolute contraindications identified · 2025 ACC/AHA</div>}
      </>}
    </div>
  );
}

function CardiologyConsult(){
  const items=[
    {cat:"Patient ID",  items:["Name / Age / MRN","Chief complaint + onset","Initial VS: BP, HR, SpO2"]},
    {cat:"Situation",   items:["ACS type (STEMI / NSTEMI / UA)","ECG findings - leads involved","Troponin trend (0h / 1h / 3h)"]},
    {cat:"Clinical",    items:["Pain character, radiation, diaphoresis","Killip class / haemodynamic status","Relevant PMH: prior PCI/CABG, HF, DM"]},
    {cat:"Workup Done", items:["ECG, labs, echo if available","Contrast allergy · Renal function","Current medications + anticoagulation status"]},
    {cat:"Ask",         items:["Cath lab activation or admit?","PCI vs. lytics vs. medical management","Timing - immediate vs. early vs. elective"]},
  ];
  return(
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
      {items.map((s,i)=>(
        <div key={i} style={{background:"rgba(14,37,68,.45)",border:"1px solid var(--border)",borderRadius:10,padding:"12px 14px",backdropFilter:"blur(8px)"}}>
          <div style={{fontSize:11,fontWeight:700,color:"var(--blue)",marginBottom:8,fontFamily:"'JetBrains Mono',monospace"}}>{s.cat}</div>
          {s.items.map((it,j)=><div key={j} style={{fontSize:11,color:"var(--txt3)",paddingLeft:10,borderLeft:"2px solid rgba(59,158,255,.25)",marginBottom:5,lineHeight:1.4}}>{it}</div>)}
        </div>
      ))}
    </div>
  );
}

// ── ACS PAGE (Phase 4b - 6 tabs) ─────────────────────────────
function ACSPage({onBack}){
  const[acsType,setAcsType]=useState("STEMI");
  const[tab,setTab]=useState("algorithm");
  const[checked,setChecked]=useState({});
  const[selTerritory,setSelTerritory]=useState(null);
  const TABS=[
    {id:"algorithm",  label:"Algorithm", icon:"D"},
    {id:"workup",     label:"Workup",    icon:"C"},
    {id:"treatment",  label:"Rx",        icon:"R"},
    {id:"tnk",        label:"TNK Tool",  icon:"T"},
    {id:"stemi-map",  label:"STEMI Map", icon:"M"},
    {id:"cardiology", label:"Consult",   icon:"S"},
  ];
  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <GlassPageHeader icon="🫀" title="Acute Coronary Syndrome" badge="2025 ACC/AHA" badgeColor="coral"
        sub="STEMI · NSTEMI · Unstable Angina" onBack={onBack}
        extra={
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {[{v:"STEMI",c:"var(--coral)",bg:"rgba(255,107,107,.15)",br:"rgba(255,107,107,.5)"},{v:"NSTEMI",c:"var(--orange)",bg:"rgba(255,159,67,.12)",br:"rgba(255,159,67,.4)"},{v:"UA",c:"var(--gold)",bg:"rgba(245,200,66,.12)",br:"rgba(245,200,66,.4)"}].map(({v,c,bg,br})=>(
              <button key={v} onClick={()=>setAcsType(v)}
                style={{padding:"6px 14px",borderRadius:20,fontSize:12,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",transition:"all .2s",background:acsType===v?bg:"rgba(14,37,68,.5)",border:`1.5px solid ${acsType===v?br:"rgba(26,53,85,.7)"}`,color:acsType===v?c:"var(--txt3)"}}>
                {v}
              </button>
            ))}
          </div>
        }
      />
      <TimeBanner targets={acsType==="STEMI"
        ?[{icon:"📋",label:"Door-to-ECG",target:"10 min",color:"var(--blue)"},{icon:"🏥",label:"D2B",target:"90 min",color:"var(--teal)"},{icon:"💉",label:"D2N (TNK)",target:"30 min",color:"var(--coral)"},{icon:"T",label:"FMC-to-Device",target:"120 min",color:"var(--gold)"}]
        :[{icon:"📋",label:"Door-to-ECG",target:"10 min",color:"var(--blue)"},{icon:"🧬",label:"Troponin",target:"60 min",color:"var(--purple)"},{icon:"🏥",label:"High-Risk PCI",target:"2 h",color:"var(--coral)"},{icon:"T",label:"Early Invasive",target:"24 h",color:"var(--gold)"}]}
      />
      <div style={{display:"flex",gap:4,overflowX:"auto",background:"rgba(8,22,40,0.65)",border:"1px solid rgba(26,53,85,.75)",borderRadius:10,padding:4,backdropFilter:"blur(12px)",scrollbarWidth:"none"}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{display:"flex",alignItems:"center",gap:5,padding:"7px 12px",borderRadius:7,fontSize:11,fontWeight:tab===t.id?700:500,fontFamily:"'DM Sans',sans-serif",whiteSpace:"nowrap",flexShrink:0,transition:"all .2s",background:tab===t.id?"rgba(255,107,107,.12)":"transparent",border:tab===t.id?"1px solid rgba(255,107,107,.3)":"1px solid transparent",color:tab===t.id?"var(--coral)":"var(--txt3)"}}>
            {t.label}
          </button>
        ))}
      </div>
      <GlassSectionBox title={TABS.find(t=>t.id===tab)?.label+" - "+acsType} sub="2025 ACC/AHA/ACEP/NAEMSP/SCAI">
        {tab==="algorithm"&&<FlowChart nodes={[
          {type:"start",text:"Chest pain / ACS symptoms"},
          {arrow:true},
          {type:"action",color:"blue",text:"Immediate Assessment",badge:"0-10 min",items:["12-lead ECG within 10 min","IV x 2 · O2 monitoring","ASA 324 mg PO","Vital signs · SpO2"]},
          {arrow:true},
          {type:"decision",text:"ECG Interpretation",branches:[
            {color:"coral",tag:"STEMI",label:"STE >= criteria\nOR New LBBB"},
            {color:"blue",tag:"UA",label:"Normal ECG\nSerial + hs-cTn"},
            {color:"orange",tag:"NSTE-ACS",label:"STD / T-wave\nchanges"},
          ]},
          {arrow:true},
          ...(acsType==="STEMI"
            ?[{type:"action",color:"coral",text:"STEMI Activation",badge:"< 10 min",items:["Cath lab alert STAT","Cardiology consult","ASA + P2Y12 load","UFH / bivalirudin"]},{arrow:true},{type:"decision",text:"PCI <= 120 min?",branches:[{color:"teal",tag:"YES",label:"Primary PCI\nD2B <= 90 min"},{color:"gold",tag:"NO",label:"TNK fibrinolysis\nD2N <= 30 min"}]}]
            :[{type:"action",color:"orange",text:"NSTE-ACS Management",badge:"< 30 min",items:["hs-cTn 0h + 1-3h","ASA + ticagrelor","Enoxaparin","GRACE / TIMI risk"]},{arrow:true},{type:"decision",text:"GRACE Risk?",branches:[{color:"coral",tag:"HIGH > 140",label:"Urgent cath\n< 2-24 h"},{color:"blue",tag:"LOW/MED",label:"Selective invasive\nMedical Rx first"}]}]
          ),
          {arrow:true},
          {type:"outcome",color:"teal",text:"Complete Revascularisation (Class I - 2025)",sub:"DAPT · Statin · ACE-I · beta-blocker · Cardiac rehab"},
        ]}/>}
        {tab==="workup"&&(
          <div style={{display:"flex",flexDirection:"column",gap:7}}>
            {STEMI_WORKUP.map((w,i)=>{const done=checked[w.icon+i];return(
              <div key={i} onClick={()=>setChecked(p=>({...p,[w.icon+i]:!done}))}
                style={{display:"grid",gridTemplateColumns:"32px 1fr auto",gap:10,alignItems:"center",background:done?"rgba(0,229,192,.05)":"rgba(14,37,68,.4)",border:`1px solid ${done?"rgba(0,229,192,.3)":"rgba(26,53,85,.7)"}`,borderRadius:8,padding:"9px 12px",cursor:"pointer",transition:"all .2s",backdropFilter:"blur(8px)"}}>
                <div style={{width:28,height:28,borderRadius:8,background:done?"rgba(0,229,192,.15)":"rgba(59,158,255,.08)",border:`1px solid ${done?"rgba(0,229,192,.4)":"rgba(59,158,255,.25)"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>{done?"✓":w.icon}</div>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontSize:12,fontWeight:600,color:done?"var(--teal)":"var(--txt)",textDecoration:done?"line-through":"none"}}>{w.label}</span>
                    {w.class1&&<span style={{fontSize:9,background:"rgba(0,229,192,.1)",color:"var(--teal)",border:"1px solid rgba(0,229,192,.3)",borderRadius:20,padding:"1px 6px",fontFamily:"'JetBrains Mono',monospace",fontWeight:700}}>COR I</span>}
                  </div>
                  <div style={{fontSize:11,color:"var(--txt3)",marginTop:2}}>{w.detail}</div>
                </div>
                <div style={{fontSize:9,color:"var(--txt4)",fontFamily:"'JetBrains Mono',monospace",whiteSpace:"nowrap"}}>{w.time}</div>
              </div>
            );})}
          </div>
        )}
        {tab==="treatment"&&<DrugTable rows={acsType==="STEMI"?STEMI_RX:NSTEMI_RX}/>}
        {tab==="tnk"&&<>{acsType!=="STEMI"&&<div style={{background:"rgba(245,200,66,.08)",border:"1px solid rgba(245,200,66,.3)",borderRadius:8,padding:"8px 14px",fontSize:11,color:"var(--gold)",marginBottom:14}}>TNK indicated for STEMI only.</div>}<TNKChecker/></>}
        {tab==="stemi-map"&&(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {acsType!=="STEMI"&&<div style={{background:"rgba(245,200,66,.08)",border:"1px solid rgba(245,200,66,.3)",borderRadius:8,padding:"8px 14px",fontSize:11,color:"var(--gold)"}}>Territory localizer is most relevant for STEMI - shown for reference.</div>}
            <div style={{fontSize:10,color:"var(--txt3)",fontFamily:"'JetBrains Mono',monospace",letterSpacing:".08em",textTransform:"uppercase",marginBottom:2}}>Territory Localizer - tap lead group to expand</div>
            <div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:14}}>
              {TERRITORIES.map(t=>{const isOpen=selTerritory===t.lead;const tc=TERR_COLORS[t.color]||TERR_COLORS.coral;return(
                <div key={t.lead} onClick={()=>setSelTerritory(isOpen?null:t.lead)}
                  style={{background:isOpen?tc.bg:"rgba(14,37,68,.4)",border:`1px solid ${isOpen?tc.br:"var(--border)"}`,borderRadius:8,padding:"9px 12px",cursor:"pointer",transition:"all .18s",backdropFilter:"blur(8px)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
                    <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:700,color:tc.c,minWidth:130,flexShrink:0}}>{t.lead}</span>
                    <span style={{fontSize:12,color:"var(--txt)",flex:1}}>{t.territory}</span>
                    <span style={{fontSize:9,background:tc.bg,border:`1px solid ${tc.br}`,borderRadius:20,padding:"2px 8px",color:tc.c,fontFamily:"'JetBrains Mono',monospace",fontWeight:600,flexShrink:0,whiteSpace:"nowrap"}}>{t.artery}</span>
                  </div>
                  {isOpen&&<div style={{marginTop:8,paddingTop:8,borderTop:`1px solid ${tc.br}`,fontSize:11.5,color:tc.c,lineHeight:1.4}}>{t.caveat}</div>}
                </div>
              );})}
            </div>
            <div style={{fontSize:10,color:"var(--txt3)",fontFamily:"'JetBrains Mono',monospace",letterSpacing:".08em",textTransform:"uppercase",marginBottom:6}}>STEMI Equivalents - Do Not Miss</div>
            {STEMI_EQUIVALENTS.map(({eq,detail,color})=>{const tc=TERR_COLORS[color]||TERR_COLORS.coral;return(
              <div key={eq} style={{background:"rgba(14,37,68,.4)",border:"1px solid var(--border)",borderRadius:8,padding:"9px 12px",borderLeft:`3px solid ${tc.c}`,backdropFilter:"blur(8px)",marginBottom:6}}>
                <div style={{fontSize:12,fontWeight:700,color:tc.c,marginBottom:3}}>{eq}</div>
                <div style={{fontSize:11.5,color:"var(--txt3)",lineHeight:1.45}}>{detail}</div>
              </div>
            );})}
            <div style={{fontSize:10,color:"var(--blue)",padding:"8px 12px",borderRadius:8,background:"rgba(59,158,255,.07)",border:"1px solid rgba(59,158,255,.25)",lineHeight:1.6,marginTop:4}}>
              Full activation checklist, medications, post-STEMI complications - see STEMI Hub in the Tools tab
            </div>
          </div>
        )}
        {tab==="cardiology"&&<CardiologyConsult/>}
      </GlassSectionBox>
    </div>
  );
}

// ── TACHYCARDIA PAGE (Phase 3 B1) ────────────────────────────
function TachycardiaPage({onBack}){
  const[tab,setTab]=useState("algorithm");
  const TABS=[{id:"algorithm",label:"Algorithm",icon:"D"},{id:"drugs",label:"Drug Reference",icon:"R"},{id:"cardioversion",label:"Cardioversion",icon:"C"}];
  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <GlassPageHeader icon="⚡" title="Adult Tachycardia" badge="ACLS 2025" badgeColor="coral" sub="HR > 100 bpm with pulse · Stable vs Unstable · AHA/ACLS 2025 Guideline" onBack={onBack}/>
      <TimeBanner targets={[{icon:"📋",label:"Assess Stability",target:"Immediate",color:"var(--coral)"},{icon:"C",label:"Cardiovert Unstable",target:"< 3 min",color:"var(--gold)"},{icon:"💊",label:"Adenosine SVT",target:"Rapid IV push",color:"var(--teal)"},{icon:"📈",label:"12-Lead ECG",target:"STAT",color:"var(--blue)"}]}/>
      <div style={{display:"flex",gap:4,background:"rgba(8,22,40,0.65)",border:"1px solid rgba(26,53,85,.75)",borderRadius:10,padding:4,backdropFilter:"blur(12px)"}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:7,fontSize:12,fontWeight:tab===t.id?700:500,fontFamily:"'DM Sans',sans-serif",whiteSpace:"nowrap",transition:"all .2s",background:tab===t.id?"rgba(245,200,66,.12)":"transparent",border:tab===t.id?"1px solid rgba(245,200,66,.3)":"1px solid transparent",color:tab===t.id?"var(--gold)":"var(--txt3)"}}>
            {t.label}
          </button>
        ))}
      </div>
      <GlassSectionBox title={TABS.find(t=>t.id===tab)?.label+" - Adult Tachycardia with Pulse"} sub="AHA/ACLS 2025 Algorithm">
        {tab==="algorithm"&&<FlowChart nodes={[
          {type:"start",text:"Tachycardia with pulse - HR > 100 bpm (symptomatic usually > 150 bpm)"},
          {arrow:true},
          {type:"action",color:"blue",text:"Initial Assessment",badge:"Immediate",items:["Airway, breathing, O2 if SpO2 < 94%","12-lead ECG - identify rhythm","IV access, BP, SpO2, continuous monitor","Treat reversible causes (H's and T's)"]},
          {arrow:true},
          {type:"decision",text:"Haemodynamically STABLE?",branches:[{color:"coral",tag:"UNSTABLE",label:"Hypotension · Altered MS\nShock · Ischaemia · AHF"},{color:"teal",tag:"STABLE",label:"Adequate perfusion\nNo shock signs"}]},
          {arrow:true},
          {type:"action",color:"coral",text:"UNSTABLE - Immediate Synchronized Cardioversion",badge:"< 3 min",items:["Sedate if conscious and time permits - never delay","Narrow/regular: 50-100 J · AFib: 120-200 J biphasic","Wide/regular: 100 J · Polymorphic VT: defibrillate (UNSYNC)","Re-assess rhythm after each shock"]},
          {arrow:true},
          {type:"decision",text:"QRS Duration?",branches:[{color:"blue",tag:"NARROW < 0.12s",label:"SVT likely\nRegular or irregular?"},{color:"orange",tag:"WIDE >= 0.12s",label:"VT until proven otherwise\nRegular or irregular?"}]},
          {arrow:true},
          {type:"action",color:"blue",text:"Stable Narrow - Regular (SVT)",items:["Vagal maneuvers - modified Valsalva (first-line)","Adenosine 6 mg rapid IV push then 12 mg x 2","Diltiazem 0.25 mg/kg IV OR Metoprolol 2.5-5 mg IV","Cardiology consult if refractory"]},
          {arrow:true},
          {type:"action",color:"orange",text:"Stable Narrow - Irregular (AFib / AFL / MAT)",items:["Rate control: Diltiazem or Metoprolol IV","Rhythm control: Amiodarone or cardioversion if < 48h","Anticoagulation: CHA2DS2-VASc - DOAC preferred","Never give adenosine or verapamil to wide irregular tachycardia (risk VF)"]},
          {arrow:true},
          {type:"action",color:"gold",text:"Stable Wide - Regular (Monomorphic VT suspected)",items:["Expert consultation strongly recommended","Procainamide 20-50 mg/min IV (max 17 mg/kg) - preferred","OR Amiodarone 150 mg over 10 min · OR Sotalol 100 mg IV","Avoid verapamil, diltiazem in wide-complex - may cause haemodynamic collapse"]},
          {arrow:true},
          {type:"action",color:"gold",text:"Torsades de Pointes - Polymorphic VT + Long QT",items:["Mg sulphate 1-2 g IV over 5-60 min","Correct K+ (target > 4.0) and Mg2+ (target > 2.0)","Withdraw all QT-prolonging drugs","If unstable - immediate unsynchronised defibrillation"]},
          {arrow:true},
          {type:"outcome",color:"teal",text:"Expert Consultation + Post-Conversion Care",sub:"Identify + treat underlying cause · ECG monitoring · EP referral for recurrent SVT · Anticoagulation if indicated"},
        ]}/>}
        {tab==="drugs"&&<DrugTable rows={TACHY_DRUGS}/>}
        {tab==="cardioversion"&&(
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {[
                {rhythm:"SVT (narrow, regular)",         energy:"50-100 J",                  type:"Sync",  color:"var(--blue)"},
                {rhythm:"AFib (narrow, irregular)",       energy:"120-200 J biphasic",        type:"Sync",  color:"var(--blue)"},
                {rhythm:"AFL / SVT (narrow)",             energy:"50-100 J",                  type:"Sync",  color:"var(--blue)"},
                {rhythm:"Monomorphic VT (wide, regular)", energy:"100 J",                     type:"Sync",  color:"var(--orange)"},
                {rhythm:"Polymorphic VT / TdP",          energy:"200 J biphasic (defib dose)",type:"UNSYNC",color:"var(--coral)"},
                {rhythm:"VF / Pulseless VT",              energy:"200 J biphasic (1st shock)",type:"UNSYNC",color:"var(--coral)"},
              ].map((c,i)=>(
                <div key={i} style={{background:"rgba(14,37,68,0.5)",border:"1px solid var(--border)",borderRadius:10,padding:"12px 14px",backdropFilter:"blur(8px)"}}>
                  <div style={{fontSize:11,color:"var(--txt3)",marginBottom:6}}>{c.rhythm}</div>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <div style={{fontSize:16,fontWeight:700,color:c.color,fontFamily:"'JetBrains Mono',monospace"}}>{c.energy}</div>
                    <span style={{fontSize:9,background:c.type==="UNSYNC"?"rgba(255,107,107,.15)":"rgba(59,158,255,.12)",color:c.type==="UNSYNC"?"var(--coral)":"var(--blue)",border:`1px solid ${c.type==="UNSYNC"?"rgba(255,107,107,.4)":"rgba(59,158,255,.3)"}`,borderRadius:20,padding:"2px 8px",fontFamily:"'JetBrains Mono',monospace",fontWeight:700}}>{c.type}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{fontSize:10,color:"var(--txt4)",fontFamily:"'JetBrains Mono',monospace",padding:"10px 12px",background:"rgba(14,37,68,.4)",borderRadius:8,border:"1px solid var(--border)",lineHeight:1.8,backdropFilter:"blur(8px)"}}>
              Always sync on R-wave for organized rhythms · Sedate conscious patients before cardioversion if time permits · NEVER sync for polymorphic VT or VF · Source: AHA/ACLS 2025 - cpr.heart.org
            </div>
          </div>
        )}
      </GlassSectionBox>
    </div>
  );
}

// ── BRADYCARDIA PAGE (Phase 3 B2) ────────────────────────────
function BradycardiaPage({onBack}){
  const[tab,setTab]=useState("algorithm");
  const HTS=[
    {cat:"H's",items:[["Hypovolaemia","IV fluids · blood transfusion"],["Hypoxia","O2 · airway management"],["Hydrogen ion (Acidosis)","NaHCO3 · treat underlying cause"],["Hypo/Hyperkalaemia","Correct K+ · Ca2+ for hyperkalaemia"],["Hypothermia","Active re-warming - warm IV fluids · warm O2"]]},
    {cat:"T's",items:[["Tension PTX","Needle decompression then chest tube"],["Tamponade (cardiac)","Pericardiocentesis / bedside POCUS"],["Toxins","beta-blockers · CCBs · digoxin - specific antidotes"],["Thrombosis (PE/MI)","Thrombolytics / heparin / cath lab"],["Trauma","Haemorrhage control · surgery"]]},
  ];
  const TABS=[{id:"algorithm",label:"Algorithm",icon:"D"},{id:"drugs",label:"Drug Reference",icon:"R"},{id:"causes",label:"H's and T's",icon:"S"}];
  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <GlassPageHeader icon="🔻" title="Adult Bradycardia" badge="ACLS 2025" badgeColor="blue" sub="HR < 50 bpm · Symptomatic assessment · AHA/ACLS 2025 Guideline" onBack={onBack}/>
      <TimeBanner targets={[{icon:"📋",label:"Identify Symptoms",target:"Immediate",color:"var(--coral)"},{icon:"💊",label:"Atropine 1st dose",target:"< 2 min",color:"var(--teal)"},{icon:"P",label:"TCP if no response",target:"< 5 min",color:"var(--gold)"},{icon:"T",label:"Transvenous Pacing",target:"If TCP fails",color:"var(--blue)"}]}/>
      <div style={{display:"flex",gap:4,background:"rgba(8,22,40,0.65)",border:"1px solid rgba(26,53,85,.75)",borderRadius:10,padding:4,backdropFilter:"blur(12px)"}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:7,fontSize:12,fontWeight:tab===t.id?700:500,fontFamily:"'DM Sans',sans-serif",whiteSpace:"nowrap",transition:"all .2s",background:tab===t.id?"rgba(59,158,255,.12)":"transparent",border:tab===t.id?"1px solid rgba(59,158,255,.3)":"1px solid transparent",color:tab===t.id?"var(--blue)":"var(--txt3)"}}>
            {t.label}
          </button>
        ))}
      </div>
      <GlassSectionBox title={TABS.find(t=>t.id===tab)?.label+" - Adult Bradycardia with Pulse"} sub="AHA/ACLS 2025 Algorithm">
        {tab==="algorithm"&&<FlowChart nodes={[
          {type:"start",text:"Bradycardia with pulse - HR typically < 50 bpm"},
          {arrow:true},
          {type:"action",color:"blue",text:"Initial Assessment",badge:"Immediate",items:["Airway, breathing, O2 if SpO2 < 94%","12-lead ECG - identify block type","IV/IO access · Continuous monitoring","Consider reversible causes (H's and T's)"]},
          {arrow:true},
          {type:"decision",text:"Signs / Symptoms of Haemodynamic Compromise?",branches:[{color:"teal",tag:"ADEQUATE PERFUSION",label:"Asymptomatic / mild\nMonitor · Treat cause"},{color:"coral",tag:"POOR PERFUSION",label:"Hypotension · AMS\nShock · Ischaemia · AHF"}]},
          {arrow:true},
          {type:"decision",text:"What is the Block Type?",branches:[{color:"blue",tag:"1st Degree / Mobitz I",label:"Atropine likely effective\nStart with atropine"},{color:"coral",tag:"Mobitz II / 3rd Degree",label:"Atropine UNLIKELY effective\nTCP IMMEDIATELY"}]},
          {arrow:true},
          {type:"action",color:"teal",text:"Atropine - First-Line",badge:"Mobitz I / Sinus Brady",items:["1 mg IV/IO bolus · repeat q3-5 min · max 3 mg total","Ineffective in Mobitz II / 3rd-degree - proceed straight to TCP","Avoid doses < 0.5 mg (paradoxical bradycardia)"]},
          {arrow:true},
          {type:"decision",text:"Response to Atropine?",branches:[{color:"teal",tag:"RESOLVED",label:"HR up · Symptoms improved\nMonitor · Treat cause"},{color:"coral",tag:"INADEQUATE",label:"Persistent bradycardia\nPoor perfusion continues"}]},
          {arrow:true},
          {type:"action",color:"orange",text:"Second-Line: TCP + Vasopressor Infusions",items:["Transcutaneous Pacing - set 60-80 bpm · increase mA until capture · sedate first if able","AND/OR Dopamine 5-20 mcg/kg/min IV","OR Epinephrine 2-10 mcg/min IV","Expert consultation - cardiology / EP"]},
          {arrow:true},
          {type:"outcome",color:"teal",text:"Transvenous Pacing if Refractory",sub:"Definitive bridge · Central venous access · EP/Cardiology mandatory · Evaluate for permanent pacemaker"},
        ]}/>}
        {tab==="drugs"&&<DrugTable rows={BRADY_DRUGS}/>}
        {tab==="causes"&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            {HTS.map((g,i)=>(
              <div key={i} style={{background:"rgba(14,37,68,.5)",border:"1px solid var(--border)",borderRadius:10,padding:"14px 16px",backdropFilter:"blur(8px)"}}>
                <div style={{fontSize:13,fontWeight:700,color:i===0?"var(--blue)":"var(--orange)",marginBottom:12,fontFamily:"'JetBrains Mono',monospace"}}>{g.cat}</div>
                {g.items.map(([cause,tx],j)=>(
                  <div key={j} style={{display:"grid",gridTemplateColumns:"1fr 1.2fr",gap:8,marginBottom:8,paddingBottom:8,borderBottom:j<g.items.length-1?"1px solid rgba(26,53,85,.5)":"none"}}>
                    <div style={{fontSize:12,fontWeight:600,color:"var(--txt)"}}>{cause}</div>
                    <div style={{fontSize:11,color:"var(--txt3)",lineHeight:1.4}}>{tx}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </GlassSectionBox>
    </div>
  );
}

// ── PEDIATRICS PAGE (Phase 3 B3) ─────────────────────────────
function PediatricsPage({onBack}){
  const[tab,setTab]=useState("cardiac");
  const TABS=[{id:"cardiac",label:"Cardiac Arrest",icon:"H"},{id:"brady",label:"Bradycardia",icon:"B"},{id:"tachy",label:"Tachycardia",icon:"T"},{id:"drugs",label:"Drug Reference",icon:"R"},{id:"defib",label:"Defibrillation",icon:"D"}];
  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <GlassPageHeader icon="👶" title="Pediatric ACLS" badge="PALS 2025" badgeColor="purple" sub="AHA/AAP Pediatric Advanced Life Support · 2025 Guidelines · Weight-based dosing" onBack={onBack}/>
      <TimeBanner targets={[{icon:"H",label:"Start CPR",target:"Immediately",color:"var(--coral)"},{icon:"D",label:"1st Defib VF/pVT",target:"2 J/kg",color:"var(--gold)"},{icon:"💉",label:"Epinephrine",target:"0.01 mg/kg q3-5min",color:"var(--teal)"},{icon:"V",label:"Vascular Access",target:"IO if no IV < 90s",color:"var(--blue)"}]}/>
      <div style={{display:"flex",gap:4,overflowX:"auto",background:"rgba(8,22,40,0.65)",border:"1px solid rgba(26,53,85,.75)",borderRadius:10,padding:4,backdropFilter:"blur(12px)"}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:7,fontSize:12,fontWeight:tab===t.id?700:500,fontFamily:"'DM Sans',sans-serif",whiteSpace:"nowrap",flexShrink:0,transition:"all .2s",background:tab===t.id?"rgba(155,109,255,.12)":"transparent",border:tab===t.id?"1px solid rgba(155,109,255,.3)":"1px solid transparent",color:tab===t.id?"var(--purple)":"var(--txt3)"}}>
            {t.label}
          </button>
        ))}
      </div>
      <GlassSectionBox title={TABS.find(t=>t.id===tab)?.label+" - Pediatric ACLS"} sub="AHA/AAP PALS 2025 · All doses weight-based">
        {tab==="cardiac"&&<FlowChart nodes={[
          {type:"start",text:"Paediatric cardiac arrest - no pulse or not breathing normally"},
          {arrow:true},
          {type:"action",color:"coral",text:"High-Quality CPR",badge:"Start immediately",items:["Rate: 100-120/min · Depth: >= 1/3 AP diameter (approx 4 cm infant, 5 cm child)","Full chest recoil · Minimise interruptions (CCF >= 60%)","1 rescuer: 30:2 · 2 rescuers: 15:2","IO if IV not established within 90 sec"]},
          {arrow:true},
          {type:"action",color:"blue",text:"Attach monitor/defibrillator - check rhythm",badge:"2 min CPR cycles",items:[]},
          {arrow:true},
          {type:"decision",text:"Rhythm Shockable?",branches:[{color:"coral",tag:"SHOCKABLE",label:"VF · Pulseless VT\nDefibrillate 2 J/kg\nResume CPR immediately"},{color:"blue",tag:"NON-SHOCKABLE",label:"Asystole · PEA\nCPR + Epinephrine\n0.01 mg/kg q3-5 min"}]},
          {arrow:true},
          {type:"action",color:"coral",text:"Shockable - VF / pVT",items:["Shock 2 J/kg then CPR 2 min then check rhythm","If persistent: shock 4 J/kg then CPR then Epinephrine 0.01 mg/kg IV/IO","If persistent: shock 4 J/kg then CPR then Amiodarone 5 mg/kg OR Lidocaine 1 mg/kg","Escalate defib to max 10 J/kg · Identify H's and T's"]},
          {arrow:true},
          {type:"action",color:"blue",text:"Non-Shockable - Asystole / PEA",items:["CPR continuously · check rhythm every 2 min","Epinephrine 0.01 mg/kg IV/IO q3-5 min","Advanced airway: 1 breath/2-3 sec (20-30/min) once placed","Consider ECPR if reversible cause or in-hospital arrest"]},
          {arrow:true},
          {type:"outcome",color:"teal",text:"ROSC - Post-Cardiac Arrest Care",sub:"Target SpO2 94-99% · Avoid hyperthermia · TTM consideration · Treat seizures · PICU"},
        ]}/>}
        {tab==="brady"&&<FlowChart nodes={[
          {type:"start",text:"Paediatric bradycardia - HR < 60 bpm with poor perfusion"},
          {arrow:true},
          {type:"action",color:"blue",text:"Support ABCs",badge:"Immediate",items:["Airway · positive pressure ventilation if breathing inadequate","O2 - target SpO2 >= 94%","Monitor · IV/IO access"]},
          {arrow:true},
          {type:"decision",text:"HR < 60 despite adequate oxygenation + ventilation?",branches:[{color:"coral",tag:"YES - compromised",label:"Begin CPR 15:2\nEpi 0.01 mg/kg IV/IO"},{color:"teal",tag:"NO - HR >= 60",label:"Observe · ABCs\nTreat cause · Cardiology"}]},
          {arrow:true},
          {type:"action",color:"teal",text:"Atropine for vagal bradycardia",items:["0.02 mg/kg IV/IO (min 0.1 mg, max 0.5 mg) · repeat once if needed","Useful for vagal-mediated bradycardia and pre-intubation"]},
          {arrow:true},
          {type:"outcome",color:"teal",text:"TCP for refractory bradycardia",sub:"Paediatric cardiology referral · Identify + treat reversible causes · Transvenous pacing if TCP fails"},
        ]}/>}
        {tab==="tachy"&&<FlowChart nodes={[
          {type:"start",text:"Paediatric tachycardia - HR > age-appropriate upper limit"},
          {arrow:true},
          {type:"decision",text:"Haemodynamically stable?",branches:[{color:"coral",tag:"UNSTABLE",label:"Sync cardioversion\nSVT: 0.5-1 J/kg then 2 J/kg\nVT: 0.5-1 J/kg then 2 J/kg"},{color:"teal",tag:"STABLE",label:"Narrow: vagal + adenosine\nWide: expert consultation"}]},
          {arrow:true},
          {type:"action",color:"blue",text:"Stable SVT - Narrow QRS",items:["Vagal maneuvers (ice to face in infant · Valsalva in older child)","Adenosine 0.1 mg/kg IV rapid push (max 6 mg) then 0.2 mg/kg","If refractory: Amiodarone 5 mg/kg IV over 20-60 min OR Procainamide 15 mg/kg"]},
          {arrow:true},
          {type:"outcome",color:"teal",text:"Conversion to sinus rhythm",sub:"Paediatric cardiology referral · EP consultation for recurrent SVT"},
        ]}/>}
        {tab==="drugs"&&<DrugTable rows={PALS_DRUGS}/>}
        {tab==="defib"&&(
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr",gap:8}}>
              {PALS_DEFIB.map((d,i)=>(
                <div key={i} style={{background:"rgba(14,37,68,.5)",border:"1px solid var(--border)",borderRadius:10,padding:"12px 14px",backdropFilter:"blur(8px)"}}>
                  <div style={{fontSize:11,color:"var(--txt3)",marginBottom:6}}>{d.rhythm}</div>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <div style={{fontSize:18,fontWeight:700,color:d.type==="Async"?"var(--coral)":"var(--teal)",fontFamily:"'JetBrains Mono',monospace"}}>{d.energy}</div>
                    <span style={{fontSize:9,background:d.type==="Async"?"rgba(255,107,107,.15)":"rgba(0,229,192,.1)",color:d.type==="Async"?"var(--coral)":"var(--teal)",border:`1px solid ${d.type==="Async"?"rgba(255,107,107,.4)":"rgba(0,229,192,.3)"}`,borderRadius:20,padding:"2px 8px",fontFamily:"'JetBrains Mono',monospace",fontWeight:700}}>{d.type}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {[{label:"Paediatric pads",val:"<= 10 kg",detail:"Use 4.5 cm paediatric paddles",color:"var(--purple)"},{label:"Adult pads",val:"> 10 kg",detail:"Use 8-12 cm adult paddles",color:"var(--blue)"},{label:"Max defib energy",val:"10 J/kg",detail:"Or adult dose (200 J biphasic)",color:"var(--gold)"},{label:"After each shock",val:"CPR first",detail:"Resume CPR immediately - no pulse check first",color:"var(--coral)"}].map((s,i)=>(
                <div key={i} style={{background:"rgba(14,37,68,.5)",border:"1px solid var(--border)",borderRadius:8,padding:"10px 12px",backdropFilter:"blur(8px)"}}>
                  <div style={{fontSize:10,color:"var(--txt3)",marginBottom:2}}>{s.label}</div>
                  <div style={{fontSize:14,fontWeight:700,color:s.color,fontFamily:"'JetBrains Mono',monospace",marginBottom:2}}>{s.val}</div>
                  <div style={{fontSize:10,color:"var(--txt4)"}}>{s.detail}</div>
                </div>
              ))}
            </div>
            <div style={{fontSize:10,color:"var(--txt4)",fontFamily:"'JetBrains Mono',monospace",padding:"10px 12px",background:"rgba(14,37,68,.4)",borderRadius:8,border:"1px solid var(--border)",lineHeight:1.8,backdropFilter:"blur(8px)"}}>
              AP or antero-lateral pad placement both acceptable · Confirm pulseless before defibrillating · Resume CPR immediately after shock<br/>Source: AHA/AAP PALS 2025 Guidelines - cpr.heart.org
            </div>
          </div>
        )}
      </GlassSectionBox>
    </div>
  );
}

// ── CARDIAC RISK PAGE ─────────────────────────────────────────
function CardiacRiskPage({onBack}){
  const[tab,setTab]=useState("heart");
  const TABS=[{id:"heart",label:"HEART Score",icon:"H"},{id:"timi",label:"TIMI",icon:"T"},{id:"grace",label:"GRACE",icon:"G"}];
  const HEART_ROWS=[
    {factor:"History",    low:"0 - Slightly suspicious",     mid:"1 - Moderately suspicious",    high:"2 - Highly suspicious"},
    {factor:"ECG",        low:"0 - Normal",                  mid:"1 - Non-specific repolarization",high:"2 - Significant ST deviation"},
    {factor:"Age",        low:"0 - < 45",                    mid:"1 - 45-64",                    high:"2 - >= 65"},
    {factor:"Risk Factors",low:"0 - No known risk factors",  mid:"1 - 1-2 risk factors",         high:"2 - >= 3 or atherosclerosis hx"},
    {factor:"Troponin",   low:"0 - <= Normal limit",         mid:"1 - 1-3x normal limit",        high:"2 - > 3x normal limit"},
  ];
  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <GlassPageHeader icon="📊" title="Cardiac Risk Stratification" badge="Multi-Score" badgeColor="teal" sub="HEART · TIMI · GRACE - ACS Risk Stratification Tools" onBack={onBack}/>
      <div style={{display:"flex",gap:4,background:"rgba(8,22,40,.65)",border:"1px solid rgba(26,53,85,.75)",borderRadius:10,padding:4,backdropFilter:"blur(12px)"}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"7px 14px",borderRadius:7,fontSize:12,fontWeight:tab===t.id?700:500,fontFamily:"'DM Sans',sans-serif",transition:"all .2s",background:tab===t.id?"rgba(245,200,66,.12)":"transparent",border:tab===t.id?"1px solid rgba(245,200,66,.3)":"1px solid transparent",color:tab===t.id?"var(--gold)":"var(--txt3)"}}>
            {t.label}
          </button>
        ))}
      </div>
      <GlassSectionBox title={TABS.find(t=>t.id===tab)?.label} sub="Evidence-based ACS risk stratification">
        {tab==="heart"&&(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                <thead><tr style={{borderBottom:"1px solid var(--border)"}}>
                  {["Factor","0 points","1 point","2 points"].map((h,i)=><th key={i} style={{padding:"7px 10px",textAlign:"left",color:"var(--txt3)",fontFamily:"'JetBrains Mono',monospace",fontWeight:600,whiteSpace:"nowrap"}}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {HEART_ROWS.map((r,i)=>(
                    <tr key={i} style={{borderBottom:"1px solid rgba(26,53,85,.4)",background:i%2===0?"rgba(14,37,68,.3)":"transparent"}}>
                      <td style={{padding:"7px 10px",fontWeight:700,color:"var(--gold)",fontFamily:"'JetBrains Mono',monospace",whiteSpace:"nowrap"}}>{r.factor}</td>
                      <td style={{padding:"7px 10px",color:"var(--teal)",fontSize:10.5}}>{r.low}</td>
                      <td style={{padding:"7px 10px",color:"var(--orange)",fontSize:10.5}}>{r.mid}</td>
                      <td style={{padding:"7px 10px",color:"var(--coral)",fontSize:10.5}}>{r.high}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
              {[{range:"0-3",label:"Low Risk",color:"var(--teal)",bg:"rgba(0,229,192,.07)",br:"rgba(0,229,192,.3)",detail:"Discharge + outpatient follow-up"},{range:"4-6",label:"Moderate Risk",color:"var(--orange)",bg:"rgba(255,159,67,.07)",br:"rgba(255,159,67,.3)",detail:"Observation + serial troponin"},{range:"7-10",label:"High Risk",color:"var(--coral)",bg:"rgba(255,107,107,.07)",br:"rgba(255,107,107,.3)",detail:"Early invasive strategy"}].map((s,i)=>(
                <div key={i} style={{background:s.bg,border:`1px solid ${s.br}`,borderRadius:8,padding:"10px 12px",textAlign:"center"}}>
                  <div style={{fontSize:18,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",color:s.color}}>{s.range}</div>
                  <div style={{fontSize:11,fontWeight:700,color:s.color,marginBottom:3}}>{s.label}</div>
                  <div style={{fontSize:10,color:"var(--txt3)"}}>{s.detail}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {tab==="timi"&&(
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {["Age >= 65 years","3 or more CAD risk factors (FHx, HTN, hypercholesterolaemia, DM, active smoker)","Prior coronary stenosis >= 50%","ST deviation >= 0.5 mm on presenting ECG","2 or more anginal events in prior 24 h","ASA use in past 7 days","Elevated cardiac biomarkers (troponin or CK-MB)"].map((c,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 10px",background:"rgba(14,37,68,.4)",borderRadius:7,border:"1px solid var(--border)"}}>
                <span style={{fontSize:11,color:"var(--txt3)"}}>{c}</span>
                <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,fontWeight:700,color:"var(--gold)",flexShrink:0,marginLeft:8}}>+1</span>
              </div>
            ))}
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginTop:4}}>
              {[{range:"0-2",risk:"Low (< 5%)",color:"var(--teal)"},{range:"3-4",risk:"Moderate (13-20%)",color:"var(--orange)"},{range:"5-7",risk:"High (> 26%)",color:"var(--coral)"}].map((s,i)=>(
                <div key={i} style={{background:"rgba(14,37,68,.5)",border:"1px solid var(--border)",borderRadius:8,padding:"9px 12px",textAlign:"center"}}>
                  <div style={{fontSize:16,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",color:s.color}}>{s.range}</div>
                  <div style={{fontSize:10,color:"var(--txt3)",marginTop:2}}>{s.risk}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {tab==="grace"&&(
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            <div style={{fontSize:11,color:"var(--txt3)",lineHeight:1.6,padding:"10px 14px",background:"rgba(14,37,68,.4)",borderRadius:8,border:"1px solid var(--border)"}}>
              GRACE score uses 8 variables: age, heart rate, SBP, creatinine, Killip class, ST deviation, cardiac arrest at presentation, and elevated troponin. Recommended for all ACS to guide revascularisation timing.
            </div>
            {[{tier:"Low (< 108)",risk:"< 1% in-hospital mortality",action:"Medical management · Non-urgent cath",color:"var(--teal)"},{tier:"Moderate (108-140)",risk:"1-3% in-hospital mortality",action:"Early invasive strategy <= 24h",color:"var(--orange)"},{tier:"High (> 140)",risk:"> 3% in-hospital mortality",action:"Urgent invasive strategy <= 2h",color:"var(--coral)"}].map((s,i)=>(
              <div key={i} style={{background:"rgba(14,37,68,.5)",border:"1px solid var(--border)",borderLeft:`3px solid ${s.color}`,borderRadius:8,padding:"10px 14px"}}>
                <div style={{fontSize:12,fontWeight:700,color:s.color,marginBottom:3}}>{s.tier}</div>
                <div style={{fontSize:11,color:"var(--txt3)",marginBottom:3}}>{s.risk}</div>
                <div style={{fontSize:11,color:"var(--txt)"}}>{s.action}</div>
              </div>
            ))}
            <div style={{fontSize:10,color:"var(--txt4)",fontFamily:"'JetBrains Mono',monospace",marginTop:2}}>Use GRACE 2.0 calculator: gracescore.org</div>
          </div>
        )}
      </GlassSectionBox>
    </div>
  );
}

// ── PREGNANCY PAGE ────────────────────────────────────────────
function PregnancyPage({onBack}){
  const[tab,setTab]=useState("algorithm");
  const TABS=[{id:"algorithm",label:"Algorithm",icon:"D"},{id:"lud",label:"LUD",icon:"L"},{id:"pmcd",label:"PMCD",icon:"P"},{id:"drugs",label:"ABCDEFGH",icon:"A"}];
  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <GlassPageHeader icon="🤰" title="Cardiac Arrest in Pregnancy" badge="AHA 2020" badgeColor="teal" sub="Maternal Resuscitation · PMCD · LUD · Dual-Patient Emergency" onBack={onBack}/>
      <TimeBanner targets={[{icon:"C",label:"Start CPR",target:"Immediate",color:"var(--coral)"},{icon:"L",label:"LUD",target:"Manual lateral",color:"var(--blue)"},{icon:"D",label:"PMCD decision",target:"4 min no ROSC",color:"var(--gold)"},{icon:"B",label:"PMCD delivery",target:"<= 5 min",color:"var(--teal)"}]}/>
      <div style={{display:"flex",gap:4,background:"rgba(8,22,40,.65)",border:"1px solid rgba(26,53,85,.75)",borderRadius:10,padding:4,backdropFilter:"blur(12px)"}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"7px 10px",borderRadius:7,fontSize:11,fontWeight:tab===t.id?700:500,fontFamily:"'DM Sans',sans-serif",transition:"all .2s",background:tab===t.id?"rgba(0,229,192,.1)":"transparent",border:tab===t.id?"1px solid rgba(0,229,192,.3)":"1px solid transparent",color:tab===t.id?"var(--teal)":"var(--txt3)"}}>
            {t.label}
          </button>
        ))}
      </div>
      <GlassSectionBox title={TABS.find(t=>t.id===tab)?.label} sub="AHA 2020 · ACOG · Maternal Cardiac Arrest Guidelines">
        {tab==="algorithm"&&<FlowChart nodes={[
          {type:"start",text:"Maternal cardiac arrest - confirmed pulselessness"},
          {arrow:true},
          {type:"action",color:"coral",text:"Simultaneous immediate actions",badge:"0-1 min",items:["Call code · OB + Neonatal team to bedside","Remove fetal monitors · Position supine","Manual LUD - push uterus left to decompress IVC","High-quality CPR - hands slightly higher on sternum"]},
          {arrow:true},
          {type:"action",color:"blue",text:"Standard ACLS + Obstetric Modifications",badge:"Ongoing",items:["Defib as standard - safe for foetus","Airway first - pregnant airway difficult; video laryngoscopy preferred","IV access above diaphragm preferred","All standard ACLS drugs at standard doses"]},
          {arrow:true},
          {type:"decision",text:"ROSC achieved by 4 minutes?",branches:[{color:"teal",tag:"ROSC",label:"Standard post-arrest care\nOB monitoring · PICU"},{color:"coral",tag:"NO ROSC",label:"Prepare PMCD\nDeliver by 5 min of arrest"}]},
          {arrow:true},
          {type:"outcome",color:"teal",text:"Post-Arrest Care",sub:"Targeted temperature management · Foetal monitoring · Obstetric ICU · Neurology consult"},
        ]}/>}
        {tab==="lud"&&(
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {[
              {title:"Why LUD?",detail:"The gravid uterus (> 20 weeks) compresses the IVC and aorta when supine - reduces cardiac output by up to 30% - makes CPR ineffective. Manual LUD restores venous return and stroke volume.",color:"var(--blue)"},
              {title:"Technique - Manual LUD",detail:"Rescuer stands at patient's left side · Uses both hands to push uterus leftward and upward · Maintain during all CPR · Do NOT tilt the board - tilted CPR is ineffective. Keep patient supine with manual displacement only.",color:"var(--teal)"},
              {title:"Threshold",detail:"Perform LUD for any pregnant patient with fundus at or above the umbilicus (approximately >= 20 weeks gestation).",color:"var(--gold)"},
              {title:"Who does LUD?",detail:"A dedicated team member performs LUD continuously - this person does nothing else. CPR is performed by others. Call for OB early.",color:"var(--orange)"},
            ].map((s,i)=>(
              <div key={i} style={{background:"rgba(14,37,68,.5)",border:"1px solid var(--border)",borderLeft:`3px solid ${s.color}`,borderRadius:8,padding:"10px 14px"}}>
                <div style={{fontSize:12,fontWeight:700,color:s.color,marginBottom:4}}>{s.title}</div>
                <div style={{fontSize:11.5,color:"var(--txt3)",lineHeight:1.5}}>{s.detail}</div>
              </div>
            ))}
          </div>
        )}
        {tab==="pmcd"&&(
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            <div style={{background:"rgba(255,107,107,.08)",border:"1px solid rgba(255,107,107,.35)",borderRadius:8,padding:"10px 14px",fontSize:12,fontWeight:700,color:"var(--coral)",textAlign:"center"}}>
              PMCD Goal: Delivery within 5 minutes of arrest onset · Begin at 4 min if no ROSC
            </div>
            {[
              {step:"1",title:"Decision - 4 min mark",detail:"If no ROSC by 4 min - immediate PMCD to deliver by 5 min. Do NOT wait for OR or surgeon. ED can perform bedside."},
              {step:"2",title:"Team",detail:"OB + Neonatal team at bedside. If unavailable, emergency physician proceeds. NICU team for resuscitation of neonate."},
              {step:"3",title:"Equipment",detail:"Scalpel (No. 10 blade) · Retractors · Neonatal warmer in room · Continue CPR until uterus delivered."},
              {step:"4",title:"Technique",detail:"Vertical midline incision from umbilicus to pubis · Through uterus · Deliver infant · Clamp and cut cord · Remove placenta if able · Pack uterus."},
              {step:"5",title:"After delivery",detail:"CPR often becomes effective after uterus emptied · IVC decompressed · Continue ACLS · OB manages uterus · Neonatal team manages newborn."},
            ].map((s,i)=>(
              <div key={i} style={{display:"grid",gridTemplateColumns:"28px 1fr",gap:10,padding:"9px 12px",background:"rgba(14,37,68,.45)",border:"1px solid var(--border)",borderRadius:8}}>
                <div style={{width:24,height:24,borderRadius:"50%",background:"rgba(255,107,107,.15)",border:"1px solid rgba(255,107,107,.4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"var(--coral)",flexShrink:0}}>{s.step}</div>
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:"var(--txt)",marginBottom:3}}>{s.title}</div>
                  <div style={{fontSize:11,color:"var(--txt3)",lineHeight:1.4}}>{s.detail}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        {tab==="drugs"&&(
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            <div style={{fontSize:11,color:"var(--txt3)",padding:"8px 12px",background:"rgba(14,37,68,.4)",borderRadius:7,border:"1px solid var(--border)",lineHeight:1.6,marginBottom:4}}>
              Standard ACLS medications at standard doses - no dose adjustments for pregnancy. The ABCDEFGH framework organises the maternal arrest response.
            </div>
            {[
              {letter:"A",title:"Airway",detail:"Video laryngoscopy preferred - pregnant airway difficult. RSI with cricoid pressure."},
              {letter:"B",title:"Breathing",detail:"100% O2 · SpO2 target > 94% · Avoid hyperventilation (reduces placental perfusion)."},
              {letter:"C",title:"CPR + Circulation",detail:"High-quality compressions · slightly higher hand position · LUD continuously."},
              {letter:"D",title:"Defibrillation",detail:"Standard energies - safe for foetus. Do NOT delay defibrillation."},
              {letter:"E",title:"IV + Epinephrine",detail:"IV access above diaphragm · Epi 1 mg IV q3-5 min (standard ACLS)."},
              {letter:"F",title:"Foetal assessment",detail:"Remove fetal monitors during CPR (artifact). Assess foetal status post-ROSC."},
              {letter:"G",title:"Go to cause",detail:"H's and T's - plus: Mg toxicity, placental abruption, amniotic fluid embolism."},
              {letter:"H",title:"HELP / Hands",detail:"OB + Neonatology + Anaesthesia at bedside · continuous multidisciplinary team."},
            ].map((s,i)=>(
              <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"8px 12px",background:"rgba(14,37,68,.4)",borderRadius:7,border:"1px solid var(--border)"}}>
                <div style={{width:24,height:24,borderRadius:6,background:"rgba(0,229,192,.12)",border:"1px solid rgba(0,229,192,.35)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"var(--teal)",flexShrink:0}}>{s.letter}</div>
                <div><span style={{fontSize:12,fontWeight:600,color:"var(--txt)"}}>{s.title} - </span><span style={{fontSize:11,color:"var(--txt3)"}}>{s.detail}</span></div>
              </div>
            ))}
          </div>
        )}
      </GlassSectionBox>
    </div>
  );
}

function ChestPainHubPage({onBack}){return <ChestPainHub onBack={onBack}/>;}
function ECGHubPage({onBack}){return <ECGHub onBack={onBack}/>;}

// ── CONFIG ────────────────────────────────────────────────────
const NAV_DATA={
  tools:[
    {section:"cardiac-home",abbr:"CH",  icon:"💗", label:"Cardiac Hub Home"},
    {section:"acs",          abbr:"ACS",icon:"🫀", label:"ACS Protocol"},
    {section:"stemi",        abbr:"St", icon:"M",  label:"STEMI Hub"},
    {section:"cardiac-risk", abbr:"Rx", icon:"📊", label:"Cardiac Risk Scores"},
    {section:"chest-pain",   abbr:"CP", icon:"💔", label:"Chest Pain Hub"},
    {section:"ecg",          abbr:"ECG",icon:"📈", label:"ECG Hub"},
    {section:"tachy",        abbr:"Tc", icon:"⚡", label:"Adult Tachycardia"},
    {section:"brady",        abbr:"Br", icon:"🔻", label:"Adult Bradycardia"},
    {section:"tamponade",    abbr:"Tm", icon:"💧", label:"Cardiac Tamponade"},
    {section:"peds",         abbr:"Pd", icon:"👶", label:"Pediatric ACLS"},
    {section:"pregnancy",    abbr:"Pg", icon:"🤰", label:"Arrest in Pregnancy"},
  ],
};

const PROTOCOL_SECTIONS=["cardiac-home","acs","stemi","cardiac-risk","chest-pain","ecg","tachy","brady","tamponade","peds","pregnancy"];

// ── CSS ───────────────────────────────────────────────────────
const GLASS_CSS=`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=JetBrains+Mono:wght@400;700&family=DM+Sans:wght@400;500;600;700&display=swap');
:root{--coral:#ff6b6b;--orange:#ff9f43;--blue:#3b9eff;--teal:#00e5c0;--gold:#f5c842;--purple:#9b6dff;--txt:#e8f3ff;--txt2:#b8d4f0;--txt3:#7a9fc0;--txt4:#4a6a88;--border:rgba(26,53,85,0.75);--bg:#060c19;}
*{box-sizing:border-box;margin:0;padding:0;}
body{background:var(--bg);color:var(--txt);font-family:'DM Sans',sans-serif;}
button{font-family:inherit;cursor:pointer;border:none;}
input[type=number]{outline:none;}
::-webkit-scrollbar{width:4px;height:4px;}
::-webkit-scrollbar-track{background:transparent;}
::-webkit-scrollbar-thumb{background:rgba(59,158,255,.3);border-radius:2px;}`;

// ── MAIN HUB ──────────────────────────────────────────────────
export default function CardiacHub(){
  const[section,setSection]=useState("cardiac-home");
  const[navTab,setNavTab]=useState("home");
  const goTo=useCallback((s)=>{setSection(s);setNavTab("home");},[]);
  const backToHub=useCallback(()=>{setSection("cardiac-home");setNavTab("home");},[]);
  return(
    <>
      <style>{GLASS_CSS}</style>
      <div style={{minHeight:"100vh",background:"var(--bg)",color:"var(--txt)",display:"flex",flexDirection:"column"}}>
        <div style={{background:"rgba(6,12,25,.95)",borderBottom:"1px solid var(--border)",padding:"12px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",backdropFilter:"blur(16px)",position:"sticky",top:0,zIndex:100}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:22}}>💗</span>
            <div>
              <div style={{fontSize:15,fontWeight:700,fontFamily:"'Playfair Display',serif",color:"var(--coral)"}}>Cardiac Hub</div>
              <div style={{fontSize:9,color:"var(--txt4)",fontFamily:"'JetBrains Mono',monospace",letterSpacing:".1em"}}>NOTRYA - EMERGENCY CARDIOLOGY</div>
            </div>
          </div>
          <div style={{fontSize:10,color:"var(--txt4)",fontFamily:"'JetBrains Mono',monospace"}}>10 protocols</div>
        </div>
        <div style={{flex:1,padding:"16px 20px 80px",maxWidth:900,width:"100%",margin:"0 auto"}}>
          {section==="cardiac-home"&&navTab==="home"&&<ACSHomePage onNavigate={goTo}/>}
          {navTab==="tools"&&(
            <div style={{display:"flex",flexDirection:"column",gap:8,paddingTop:8}}>
              <div style={{fontSize:10,color:"var(--txt3)",fontFamily:"'JetBrains Mono',monospace",letterSpacing:".1em",textTransform:"uppercase",marginBottom:4}}>All Protocols</div>
              {NAV_DATA.tools.map((t,i)=>(
                <div key={i} onClick={()=>goTo(t.section)}
                  style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",background:"rgba(8,22,40,.65)",border:"1px solid var(--border)",borderRadius:10,cursor:"pointer",backdropFilter:"blur(8px)"}}>
                  <span style={{fontSize:20}}>{t.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:600,color:"var(--txt)"}}>{t.label}</div>
                    <div style={{fontSize:9,color:"var(--txt4)",fontFamily:"'JetBrains Mono',monospace",marginTop:2}}>{t.abbr}</div>
                  </div>
                  <span style={{color:"var(--txt4)",fontSize:16}}>></span>
                </div>
              ))}
            </div>
          )}
          {section==="acs"          &&<ACSPage onBack={backToHub}/>}
          {section==="stemi"        &&<STEMIHub embedded={true} onBack={backToHub}/>}
          {section==="cardiac-risk" &&<CardiacRiskPage onBack={backToHub}/>}
          {section==="chest-pain"   &&<ChestPainHubPage onBack={backToHub}/>}
          {section==="ecg"          &&<ECGHubPage onBack={backToHub}/>}
          {section==="tachy"        &&<TachycardiaPage onBack={backToHub}/>}
          {section==="brady"        &&<BradycardiaPage onBack={backToHub}/>}
          {section==="tamponade"    &&<CardiacTamponadeHub embedded={true} onBack={backToHub}/>}
          {section==="peds"         &&<PediatricsPage onBack={backToHub}/>}
          {section==="pregnancy"    &&<PregnancyPage onBack={backToHub}/>}
        </div>
        <div style={{position:"fixed",bottom:0,left:0,right:0,background:"rgba(6,12,25,.95)",borderTop:"1px solid var(--border)",backdropFilter:"blur(16px)",zIndex:100}}>
          <div style={{display:"flex",maxWidth:900,margin:"0 auto"}}>
            {[{id:"home",label:"Home",icon:"🏠"},{id:"tools",label:"Protocols",icon:"🫀"}].map(t=>(
              <button key={t.id} onClick={()=>{setNavTab(t.id);if(t.id==="home")setSection("cardiac-home");}}
                style={{flex:1,padding:"12px 0 10px",background:"none",display:"flex",flexDirection:"column",alignItems:"center",gap:3,color:navTab===t.id?"var(--coral)":"var(--txt4)",transition:"color .2s"}}>
                <span style={{fontSize:18}}>{t.icon}</span>
                <span style={{fontSize:9,fontFamily:"'JetBrains Mono',monospace",fontWeight:navTab===t.id?700:400}}>{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}