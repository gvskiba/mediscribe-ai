import { useState, useCallback, useRef } from "react";
import { InvokeLLM } from "@/integrations/Core";
import { DrugDosing } from "@/api/entities";

(() => {
  if (document.getElementById("drc-css")) return;
  const l = document.createElement("link"); l.id = "drc-f"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "drc-css";
  s.textContent = `
    *{box-sizing:border-box;}
    @keyframes drcIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
    @keyframes drcSpin{to{transform:rotate(360deg)}}
    .drc-in{animation:drcIn .22s ease both;}
    .drc-hov:hover{background:rgba(255,255,255,.07)!important;border-color:rgba(0,180,216,.38)!important;}
    ::-webkit-scrollbar{width:3px;height:3px;}
    ::-webkit-scrollbar-thumb{background:rgba(0,180,216,.22);border-radius:2px;}
    input::placeholder,textarea::placeholder{color:rgba(221,230,240,.18);}
    input:focus,textarea:focus{border-color:rgba(0,180,216,.55)!important;outline:none;}
    select option{background:#0d1b2e;}
  `;
  document.head.appendChild(s);
})();

const T = {
  bg:"#07111f", card:"rgba(255,255,255,0.04)", bdr:"rgba(255,255,255,0.08)",
  teal:"#00b4d8", tD:"rgba(0,180,216,0.12)", tB:"rgba(0,180,216,0.25)",
  gold:"#f0a500", gD:"rgba(240,165,0,0.12)",
  coral:"#ff6060", cD:"rgba(255,96,96,0.12)",
  green:"#4ade80", grnD:"rgba(74,222,128,0.1)",
  purple:"#9b6dff", pD:"rgba(155,109,255,0.12)",
  orange:"#ff9f43", oD:"rgba(255,159,67,0.12)",
  txt:"#dde6f0", mut:"rgba(221,230,240,0.55)", dim:"rgba(221,230,240,0.28)",
};

const gl = (x={}) => ({backdropFilter:"blur(14px)",background:T.card,border:`1px solid ${T.bdr}`,borderRadius:12,...x});
const ib = (x={}) => ({width:"100%",background:"rgba(13,27,46,.8)",border:`1px solid ${T.bdr}`,borderRadius:8,padding:"8px 12px",color:T.txt,fontFamily:"DM Sans,sans-serif",fontSize:13,transition:"border-color .15s",...x});
const Sp = () => <span style={{display:"inline-block",width:13,height:13,border:"2px solid rgba(0,180,216,.2)",borderTopColor:T.teal,borderRadius:"50%",animation:"drcSpin .7s linear infinite"}}/>;

// ── Copy Button ────────────────────────────────────────────────────────────────
function CopyBtn({text, label="📋 Copy", color=T.teal, full=false}) {
  const [done,setDone] = useState(false);
  const copy = () => {
    if(!text?.trim()) return;
    navigator.clipboard?.writeText(text.trim()).then(()=>{setDone(true);setTimeout(()=>setDone(false),1800);});
  };
  return(
    <button onClick={copy} disabled={!text?.trim()} style={{
      padding:full?"10px 0":"5px 14px", width:full?"100%":"auto",
      borderRadius:8, cursor:text?.trim()?"pointer":"not-allowed",
      border:`1px solid ${done?T.green+"55":color+"55"}`,
      background:done?T.grnD:`${color}18`, color:done?T.green:color,
      fontFamily:"DM Sans,sans-serif", fontWeight:700, fontSize:full?13:11,
      opacity:text?.trim()?1:.35, transition:"all .15s", display:full?"flex":"inline-flex",
      alignItems:"center", justifyContent:"center", gap:6,
    }}>
      {done?"✓ Copied":label}
    </button>
  );
}

// ── Card Section ───────────────────────────────────────────────────────────────
function CardSection({label, color=T.teal, icon, copyText, children}) {
  return(
    <div style={{...gl({marginBottom:10,overflow:"hidden",borderLeft:`3px solid ${color}55`})}}>
      <div style={{padding:"9px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1px solid ${T.bdr}`}}>
        <div style={{display:"flex",alignItems:"center",gap:7}}>
          {icon&&<span style={{fontSize:14}}>{icon}</span>}
          <span style={{fontSize:9,fontWeight:700,color,fontFamily:"JetBrains Mono,monospace",letterSpacing:1.5,textTransform:"uppercase"}}>{label}</span>
        </div>
        {copyText&&<CopyBtn text={copyText} color={color}/>}
      </div>
      <div style={{padding:"10px 14px"}}>{children}</div>
    </div>
  );
}

// ── APIs ───────────────────────────────────────────────────────────────────────
const searchFDA = async q => {
  const e = encodeURIComponent(q);
  for (const u of [
    `https://api.fda.gov/drug/label.json?search=openfda.generic_name:"${e}"&limit=6`,
    `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${e}"&limit=6`,
  ]) {
    try { const r=await fetch(u); if(r.ok){const d=await r.json();if(d.results?.length) return d.results;} } catch {}
  }
  return [];
};
const fdaName = d => d?.openfda?.brand_name?.[0]||d?.openfda?.generic_name?.[0]||"Unknown";
const fdaGen  = d => d?.openfda?.generic_name?.[0]||d?.openfda?.substance_name?.[0]||"";
const trunc   = (s="",n=400) => s.length>n ? s.slice(0,n)+"..." : s;

const normalizeDB = r => ({
  id:r.drug_id, name:r.name, gen:r.generic_name, cat:r.category,
  sigs:(()=>{try{return JSON.parse(r.standard_sigs_json||"[]");}catch{return[];}})(),
  monitoring:r.monitoring||"", peds:r.peds_dose||"",
});

// ── Main Component ─────────────────────────────────────────────────────────────
export default function DischargeRxCard() {
  const [q,setQ]         = useState("");
  const [fdaRes,setFdaRes] = useState([]);
  const [localRes,setLocalRes] = useState([]);
  const [entityDB,setEntityDB] = useState([]);
  const [dbLoaded,setDbLoaded] = useState(false);
  const [sel,setSel]     = useState(null);
  const [dbDrug,setDbDrug] = useState(null);
  const [searching,setSearching] = useState(false);

  // Patient / context
  const [indication,setIndication] = useState("");
  const [ptAge,setPtAge]   = useState("");
  const [ptWt,setPtWt]     = useState("");
  const [crcl,setCrcl]     = useState("");
  const [allergy,setAllergy] = useState("");
  const [isPeds,setIsPeds] = useState(false);

  // Output
  const [card,setCard]   = useState(null);
  const [loading,setLoading] = useState(false);
  const [mode,setMode]   = useState("discharge"); // "discharge" | "ed"

  const deb = useRef(null);

  // Pre-populate indication from URL param (set by QuickNote discharge handoff)
  useState(()=>{
    const params = new URLSearchParams(window.location.search);
    const dxParam = params.get("dx");
    if (dxParam?.trim()) setIndication(dxParam.trim());
  });

  // Load entity DB once
  useState(()=>{
    if(dbLoaded) return;
    DrugDosing.filter({},{limit:500}).then(r=>{setEntityDB(r.map(normalizeDB));setDbLoaded(true);}).catch(()=>setDbLoaded(true));
  });

  const doSearch = useCallback(v => {
    setQ(v);
    if(deb.current) clearTimeout(deb.current);
    if(!v.trim()||v.length<1){setFdaRes([]);setLocalRes([]);return;}
    const lq = v.toLowerCase();
    setLocalRes(entityDB.filter(d=>d.name.toLowerCase().includes(lq)||d.gen.toLowerCase().includes(lq)).slice(0,4));
    deb.current = setTimeout(async()=>{
      setSearching(true);
      const r = await searchFDA(v);
      setFdaRes(r);
      setSearching(false);
    }, 250);
  },[entityDB]);

  const pick = (drug, isLocal=false) => {
    const name = isLocal ? drug.name : fdaName(drug);
    const gen  = isLocal ? drug.gen  : fdaGen(drug);
    setSel(isLocal ? {_local:true, name, gen, drug} : drug);
    setDbDrug(isLocal ? drug : entityDB.find(d=>d.name.toLowerCase().includes(gen.toLowerCase())||d.gen.toLowerCase().includes(gen.toLowerCase()))||null);
    setQ(name); setFdaRes([]); setLocalRes([]); setCard(null);
  };

  const generate = async () => {
    if(!sel||loading) return;
    setLoading(true); setCard(null);
    const name = sel._local ? sel.name : fdaName(sel);
    const gen  = sel._local ? sel.gen  : fdaGen(sel);

    const fdaLabel = sel._local ? "" : [
      sel.indications_and_usage?.[0]   ? `Indications: ${trunc(sel.indications_and_usage[0],300)}`  : "",
      sel.dosage_and_administration?.[0]? `Dosing: ${trunc(sel.dosage_and_administration[0],300)}`   : "",
      sel.contraindications?.[0]        ? `Contraindications: ${trunc(sel.contraindications[0],250)}`: "",
      sel.warnings?.[0]                 ? `Warnings: ${trunc(sel.warnings[0],200)}`                  : "",
      sel.boxed_warning?.[0]            ? `BOXED WARNING: ${trunc(sel.boxed_warning[0],200)}`        : "",
      sel.drug_interactions?.[0]        ? `Interactions: ${trunc(sel.drug_interactions[0],200)}`     : "",
    ].filter(Boolean).join("\n");

    const ptCtx = [
      ptAge   ? `Age: ${ptAge} yr`             : "",
      isPeds  ? "PEDIATRIC PATIENT"             : "",
      ptWt    ? `Weight: ${ptWt} kg`           : "",
      crcl    ? `CrCl: ${crcl} mL/min`         : "",
      allergy ? `Allergies: ${allergy}`         : "",
    ].filter(Boolean).join(", ");

    const isDischarge = mode === "discharge";

    try {
      const r = await InvokeLLM({
        prompt: `You are a senior emergency medicine pharmacist. Generate a ${isDischarge ? "discharge prescription" : "ED bedside"} medication card for:

Drug: ${name} (${gen})
Indication: ${indication || "not specified"}
Patient context: ${ptCtx || "adult, no specific parameters"}
${dbDrug?.sigs?.length ? `Known sigs: ${dbDrug.sigs.join("; ")}` : ""}
${fdaLabel}

${isDischarge
  ? `Focus on DISCHARGE context: outpatient formulation and dose, how long to take it, absolute contraindications in plain language, what to avoid, side effects to watch for, and when to return to the ED. Patient-friendly language where appropriate.`
  : `Focus on ED context: IV/IM dose, onset, critical safety, monitoring. Physician-facing clinical language.`
}

For duration, be indication-specific (e.g. "5 days for uncomplicated UTI", "10 days for strep pharyngitis").
For contraindications, list only ABSOLUTE contraindications — conditions where the drug must never be used.
For avoid_with, include food, alcohol, activities, and drug classes to avoid.
For return_precautions, list specific symptoms that warrant returning to the ED.`,
        response_json_schema: {
          type:"object",
          properties:{
            dose:              {type:"string"},
            how_to_take:       {type:"string"},
            duration:          {type:"string"},
            absolute_contraindications: {type:"array", items:{type:"string"}},
            key_interactions:  {type:"array", items:{type:"string"}},
            avoid_with:        {type:"array", items:{type:"string"}},
            side_effects_watch:{type:"array", items:{type:"string"}},
            return_precautions:{type:"array", items:{type:"string"}},
            patient_instructions:{type:"string"},
            clinical_note:     {type:"string"},
          },
          required:["dose","duration","absolute_contraindications","key_interactions","avoid_with","return_precautions"],
        },
      });
      setCard(r);
    } catch { setCard({_err:true}); }
    setLoading(false);
  };

  // Build full copy text
  const fullCardText = card && !card._err ? [
    `MEDICATION: ${sel?._local?sel.name:fdaName(sel)} (${sel?._local?sel.gen:fdaGen(sel)})`,
    indication ? `INDICATION: ${indication}` : "",
    "",
    `DOSE: ${card.dose||"—"}`,
    card.how_to_take ? `HOW TO TAKE: ${card.how_to_take}` : "",
    `DURATION: ${card.duration||"—"}`,
    "",
    card.absolute_contraindications?.length
      ? `DO NOT USE IF:\n${card.absolute_contraindications.map(c=>`  • ${c}`).join("\n")}`
      : "",
    card.key_interactions?.length
      ? `DRUG INTERACTIONS:\n${card.key_interactions.map(i=>`  • ${i}`).join("\n")}`
      : "",
    card.avoid_with?.length
      ? `AVOID:\n${card.avoid_with.map(a=>`  • ${a}`).join("\n")}`
      : "",
    card.side_effects_watch?.length
      ? `WATCH FOR:\n${card.side_effects_watch.map(s=>`  • ${s}`).join("\n")}`
      : "",
    card.return_precautions?.length
      ? `RETURN TO ED IF:\n${card.return_precautions.map(r=>`  • ${r}`).join("\n")}`
      : "",
    card.patient_instructions ? `\nPATIENT INSTRUCTIONS:\n${card.patient_instructions}` : "",
  ].filter(Boolean).join("\n") : "";

  const drugName = sel ? (sel._local ? sel.name : fdaName(sel)) : "";
  const drugGen  = sel ? (sel._local ? sel.gen  : fdaGen(sel))  : "";

  return(
    <div style={{background:T.bg,minHeight:"100vh",padding:"20px 18px 60px",fontFamily:"DM Sans,sans-serif",color:T.txt}}>

      {/* Header */}
      <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:22}}>
        <div style={{width:44,height:44,borderRadius:11,background:T.gD,border:`1px solid ${T.gold}40`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>💊</div>
        <div>
          <h1 style={{margin:0,fontFamily:"Playfair Display,serif",fontSize:22,color:T.gold,letterSpacing:"-0.5px",lineHeight:1}}>Discharge Rx Card</h1>
          <p style={{margin:"3px 0 0",fontSize:12,color:T.mut}}>Dose · Duration · Contraindications · Patient instructions · Section-by-section copy</p>
        </div>
        {/* ED vs Discharge toggle */}
        <div style={{marginLeft:"auto",display:"flex",background:T.card,border:`1px solid ${T.bdr}`,borderRadius:9,padding:3,gap:3}}>
          {[["discharge","🏠 Discharge"],["ed","🏥 ED Use"]].map(([m,l])=>(
            <button key={m} onClick={()=>{setMode(m);setCard(null);}} style={{padding:"6px 14px",borderRadius:7,border:"none",cursor:"pointer",fontFamily:"DM Sans,sans-serif",fontSize:12,fontWeight:700,background:mode===m?T.gold:"transparent",color:mode===m?"#060e1a":T.mut,transition:"all .16s"}}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 420px",gap:20,alignItems:"start"}}>

        {/* ── LEFT: Search + Inputs ─────────────────────────────────────── */}
        <div>
          {/* Drug search */}
          <div style={{...gl({padding:"14px 16px",marginBottom:14})}}>
            <div style={{fontSize:9,color:T.gold,fontFamily:"JetBrains Mono,monospace",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:10}}>Search Medication</div>
            <div style={{position:"relative",marginBottom:localRes.length>0||fdaRes.length>0?0:0}}>
              <span style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",fontSize:15,color:T.gold,pointerEvents:"none"}}>🔍</span>
              <input value={q} onChange={e=>doSearch(e.target.value)}
                onKeyDown={e=>e.key==="Escape"&&(setQ(""),setFdaRes([]),setLocalRes([]),setSel(null))}
                placeholder="Drug name or generic..." style={{...ib({paddingLeft:42})}}/>
              {searching&&<span style={{position:"absolute",right:13,top:"50%",transform:"translateY(-50%)",fontSize:11,color:T.dim}}>Searching...</span>}
            </div>

            {/* Local results */}
            {localRes.length>0&&!sel&&(
              <div style={{...gl({marginTop:8,overflow:"hidden",border:`1px solid ${T.gold}30`})}}>
                <div style={{padding:"4px 12px",fontSize:8,color:T.gold,fontFamily:"JetBrains Mono,monospace",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",borderBottom:`1px solid ${T.bdr}`}}>⚡ Formulary</div>
                {localRes.map((d,i)=>(
                  <div key={i} className="drc-hov" onClick={()=>pick(d,true)} style={{padding:"9px 14px",cursor:"pointer",borderBottom:i<localRes.length-1?`1px solid ${T.bdr}`:"none",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div><div style={{fontSize:12,fontWeight:700,color:T.gold}}>{d.name}</div><div style={{fontSize:10,color:T.mut}}>{d.gen} · {d.cat}</div></div>
                    <span style={{fontSize:9,color:T.gold}}>→</span>
                  </div>
                ))}
              </div>
            )}

            {/* FDA results */}
            {fdaRes.length>0&&!sel&&(
              <div style={{...gl({marginTop:8,overflow:"hidden"})}}>
                {fdaRes.map((d,i)=>(
                  <div key={i} className="drc-hov" onClick={()=>pick(d,false)} style={{padding:"9px 14px",cursor:"pointer",borderBottom:i<fdaRes.length-1?`1px solid ${T.bdr}`:"none"}}>
                    <div style={{fontSize:12,fontWeight:700,color:T.txt}}>{fdaName(d)}</div>
                    <div style={{fontSize:10,color:T.mut}}>{fdaGen(d)}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Selected drug */}
            {sel&&(
              <div className="drc-in" style={{marginTop:10,display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",borderRadius:9,background:T.gD,border:`1px solid ${T.gold}35`}}>
                <div>
                  <div style={{fontSize:14,fontWeight:700,color:T.gold}}>{drugName}</div>
                  <div style={{fontSize:11,color:T.mut}}>{drugGen}</div>
                </div>
                <button onClick={()=>{setSel(null);setQ("");setCard(null);}} style={{background:"none",border:"none",color:T.coral,cursor:"pointer",fontSize:18,padding:0,lineHeight:1}}>✕</button>
              </div>
            )}
          </div>

          {/* Context inputs */}
          <div style={{...gl({padding:"14px 16px",marginBottom:14})}}>
            <div style={{fontSize:9,color:T.teal,fontFamily:"JetBrains Mono,monospace",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:12}}>Clinical Context</div>
            <div style={{marginBottom:10}}>
              <div style={{fontSize:8,color:T.dim,fontFamily:"JetBrains Mono,monospace",letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>Indication / Diagnosis</div>
              <input value={indication} onChange={e=>setIndication(e.target.value)}
                placeholder="e.g. Community-acquired pneumonia, Uncomplicated UTI, Skin infection..."
                style={{...ib()}}/>
              <div style={{fontSize:10,color:T.dim,marginTop:4}}>Affects duration recommendation</div>
            </div>

            {/* Patient context */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
              {[["Age","ptAge",ptAge,setPtAge,"yr",60],["Weight","ptWt",ptWt,setPtWt,"kg",70],["CrCl","crcl",crcl,setCrcl,"mL/min",90]].map(([l,k,v,set,u,w])=>(
                <div key={k}>
                  <div style={{fontSize:8,color:T.dim,fontFamily:"JetBrains Mono,monospace",letterSpacing:1,textTransform:"uppercase",marginBottom:3}}>{l}</div>
                  <div style={{position:"relative"}}>
                    <input type="number" value={v} onChange={e=>set(e.target.value)} placeholder="—"
                      style={{...ib({paddingRight:32,fontSize:12})}}/>
                    <span style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",fontSize:9,color:T.dim,pointerEvents:"none"}}>{u}</span>
                  </div>
                </div>
              ))}
              <div>
                <div style={{fontSize:8,color:T.coral,fontFamily:"JetBrains Mono,monospace",letterSpacing:1,textTransform:"uppercase",marginBottom:3}}>Allergies</div>
                <input value={allergy} onChange={e=>setAllergy(e.target.value)} placeholder="e.g. Penicillin"
                  style={{...ib({border:`1px solid ${allergy?T.coral+"50":T.bdr}`,fontSize:12})}}/>
              </div>
            </div>

            {/* Pediatric toggle */}
            <button onClick={()=>setIsPeds(p=>!p)} style={{padding:"6px 14px",borderRadius:7,cursor:"pointer",border:`1px solid ${isPeds?T.gold+"55":T.bdr}`,background:isPeds?T.gD:"transparent",color:isPeds?T.gold:T.mut,fontSize:12,fontWeight:700,fontFamily:"DM Sans,sans-serif"}}>
              {isPeds?"👶 Pediatric Mode":"+ Pediatric Patient"}
            </button>
          </div>

          {/* Generate button */}
          <button onClick={generate} disabled={!sel||loading}
            style={{width:"100%",padding:"12px",borderRadius:10,cursor:sel?"pointer":"not-allowed",border:`1px solid ${T.gold}55`,background:sel?T.gD:T.card,color:sel?T.gold:T.dim,fontFamily:"DM Sans,sans-serif",fontSize:14,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:10,opacity:!sel||loading?.5:1,transition:"all .16s"}}>
            {loading?<><Sp/>Generating {mode==="discharge"?"Discharge":"ED"} Card...</>:`⚡ Generate ${mode==="discharge"?"Discharge":"ED"} Medication Card`}
          </button>
        </div>

        {/* ── RIGHT: Output Card ────────────────────────────────────────── */}
        <div style={{position:"sticky",top:16}}>
          {!card&&!loading&&(
            <div style={{textAlign:"center",padding:"60px 20px",color:T.dim}}>
              <div style={{fontSize:40,marginBottom:12}}>💊</div>
              <div style={{fontSize:14,color:T.mut,marginBottom:6}}>Search a drug and generate the card</div>
              <div style={{fontSize:11,lineHeight:1.7}}>
                {mode==="discharge"
                  ? "Discharge dose · Duration · Contraindications\nWhat to avoid · When to return to ED\nPatient instructions"
                  : "ED dose · Onset/duration · Critical safety\nKey interactions · Monitoring parameters"}
              </div>
            </div>
          )}

          {loading&&(
            <div style={{...gl({padding:"40px",textAlign:"center"})}}>
              <Sp/>
              <div style={{fontSize:12,color:T.mut,marginTop:12}} className="drc-in">
                Analyzing {indication?"indication-specific dosing and":""}drug data...
              </div>
            </div>
          )}

          {card&&!card._err&&!loading&&(
            <div className="drc-in">
              {/* Drug header */}
              <div style={{...gl({padding:"14px 16px",marginBottom:12,border:`2px solid ${T.gold}55`,background:T.gD})}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                  <div>
                    <h2 style={{margin:"0 0 3px",fontFamily:"Playfair Display,serif",fontSize:18,color:T.gold,lineHeight:1.1}}>{drugName}</h2>
                    <div style={{fontSize:11,color:T.mut,fontStyle:"italic"}}>{drugGen}</div>
                  </div>
                  <span style={{borderRadius:7,padding:"3px 10px",fontSize:10,fontWeight:700,background:mode==="discharge"?T.gD:T.tD,border:`1px solid ${mode==="discharge"?T.gold:T.teal}40`,color:mode==="discharge"?T.gold:T.teal}}>
                    {mode==="discharge"?"🏠 Discharge":"🏥 ED Use"}
                  </span>
                </div>
                {indication&&<div style={{fontSize:11,color:T.txt}}>Indication: <strong>{indication}</strong></div>}
              </div>

              {/* Dose + How to take + Duration */}
              <CardSection label="Dose & How to Take" color={T.teal} icon="💊"
                copyText={[card.dose,card.how_to_take,card.duration&&`Duration: ${card.duration}`].filter(Boolean).join("\n")}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:card.how_to_take?8:0}}>
                  {[["Dose",card.dose,T.teal],["Duration",card.duration,T.purple]].map(([l,v,c])=>(
                    <div key={l} style={{background:`${c}10`,borderRadius:8,padding:"10px 12px",border:`1px solid ${c}20`}}>
                      <div style={{fontSize:8,color:T.dim,fontFamily:"JetBrains Mono,monospace",letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>{l}</div>
                      <div style={{fontSize:13,fontWeight:700,color:c,fontFamily:"JetBrains Mono,monospace",lineHeight:1.4}}>{v||"—"}</div>
                    </div>
                  ))}
                </div>
                {card.how_to_take&&<div style={{fontSize:12,color:T.txt,lineHeight:1.6}}>{card.how_to_take}</div>}
              </CardSection>

              {/* Absolute Contraindications */}
              {card.absolute_contraindications?.length>0&&(
                <CardSection label="Do NOT Use If" color={T.coral} icon="🚫"
                  copyText={card.absolute_contraindications.map(c=>`• ${c}`).join("\n")}>
                  {card.absolute_contraindications.map((ci,i)=>(
                    <div key={i} style={{display:"flex",gap:8,padding:"5px 0",borderBottom:i<card.absolute_contraindications.length-1?`1px solid ${T.bdr}`:"none",alignItems:"flex-start"}}>
                      <span style={{color:T.coral,fontSize:14,flexShrink:0,lineHeight:1.4}}>⊘</span>
                      <span style={{fontSize:12,color:T.txt,lineHeight:1.55}}>{ci}</span>
                    </div>
                  ))}
                </CardSection>
              )}

              {/* Key Interactions */}
              {card.key_interactions?.length>0&&(
                <CardSection label="Drug Interactions" color={T.gold} icon="⚡"
                  copyText={card.key_interactions.map(i=>`• ${i}`).join("\n")}>
                  {card.key_interactions.map((ix,i)=>(
                    <div key={i} style={{fontSize:12,color:T.mut,padding:"4px 0",lineHeight:1.55,borderBottom:i<card.key_interactions.length-1?`1px solid ${T.bdr}`:"none"}}>• {ix}</div>
                  ))}
                </CardSection>
              )}

              {/* Avoid With */}
              {card.avoid_with?.length>0&&(
                <CardSection label="Avoid While Taking" color={T.orange} icon="🚧"
                  copyText={card.avoid_with.map(a=>`• ${a}`).join("\n")}>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    {card.avoid_with.map((a,i)=>(
                      <span key={i} style={{borderRadius:20,padding:"4px 11px",fontSize:11,background:T.oD,border:`1px solid ${T.orange}25`,color:T.orange,fontWeight:600}}>{a}</span>
                    ))}
                  </div>
                </CardSection>
              )}

              {/* Side Effects to Watch */}
              {card.side_effects_watch?.length>0&&(
                <CardSection label="Watch For" color={T.gold} icon="👁"
                  copyText={card.side_effects_watch.map(s=>`• ${s}`).join("\n")}>
                  {card.side_effects_watch.map((se,i)=>(
                    <div key={i} style={{fontSize:12,color:T.mut,padding:"3px 0",lineHeight:1.5}}>• {se}</div>
                  ))}
                </CardSection>
              )}

              {/* Return Precautions */}
              {card.return_precautions?.length>0&&(
                <CardSection label="Return to ED If" color={T.coral} icon="🏥"
                  copyText={card.return_precautions.map(r=>`• ${r}`).join("\n")}>
                  {card.return_precautions.map((rp,i)=>(
                    <div key={i} style={{display:"flex",gap:8,padding:"4px 0",borderBottom:i<card.return_precautions.length-1?`1px solid ${T.bdr}`:"none",alignItems:"flex-start"}}>
                      <span style={{color:T.coral,fontSize:12,flexShrink:0,marginTop:1}}>→</span>
                      <span style={{fontSize:12,color:T.txt,lineHeight:1.55,fontWeight:500}}>{rp}</span>
                    </div>
                  ))}
                </CardSection>
              )}

              {/* Patient Instructions */}
              {card.patient_instructions&&(
                <CardSection label="Patient Instructions" color={T.purple} icon="📄"
                  copyText={card.patient_instructions}>
                  <p style={{margin:0,fontSize:12,color:T.txt,lineHeight:1.7}}>{card.patient_instructions}</p>
                </CardSection>
              )}

              {/* Clinical note */}
              {card.clinical_note&&(
                <div style={{fontSize:10,color:T.dim,lineHeight:1.6,padding:"8px 12px",borderRadius:8,border:`1px solid ${T.bdr}`,marginBottom:10}}>
                  📋 {card.clinical_note}
                </div>
              )}

              {/* Full copy */}
              <CopyBtn text={fullCardText} label="📋 Copy Full Card for EHR" color={T.gold} full/>
              <div style={{fontSize:9,color:T.dim,marginTop:8,textAlign:"center"}}>AI-generated · Verify against current prescribing references</div>
            </div>
          )}

          {card?._err&&(
            <div style={{...gl({padding:"20px",textAlign:"center"})}}>
              <div style={{fontSize:12,color:T.coral,marginBottom:10}}>Card generation failed. Check connection and retry.</div>
              <button onClick={generate} style={{padding:"7px 18px",borderRadius:8,cursor:"pointer",border:`1px solid ${T.teal}55`,background:T.tD,color:T.teal,fontFamily:"DM Sans,sans-serif",fontSize:12,fontWeight:700}}>Retry</button>
            </div>
          )}
        </div>
      </div>

      <div style={{marginTop:40,textAlign:"center"}}>
        <span style={{fontFamily:"JetBrains Mono,monospace",fontSize:9,color:T.dim,letterSpacing:1.5}}>NOTRYA · DISCHARGE RX CARD · AI-GENERATED · VERIFY BEFORE PRESCRIBING · NOT A SUBSTITUTE FOR CLINICAL JUDGMENT</span>
      </div>
    </div>
  );
}