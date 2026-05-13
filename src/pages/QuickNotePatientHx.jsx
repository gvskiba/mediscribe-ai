// QuickNotePatientHx.jsx
// PMH constants + computePMHMDM + PMHTab component
// Imported by QuickNote.jsx
import { useState } from "react";

// ─── PMH CONSTANTS ──────────────────────────────────────────────
const PMH_CATS = {
  Cardiovascular:["HTN","CAD","CHF","Atrial fibrillation","Prior MI","PVD","Cardiomyopathy","Valvular disease","Pacemaker/ICD","Aortic aneurysm"],
  Pulmonary:["Asthma","COPD","OSA","Pulmonary HTN","Prior PE","Bronchiectasis","Interstitial lung disease"],
  "Metabolic/Endo":["DM Type 2","DM Type 1","Obesity","Hypothyroidism","Hyperthyroidism","Hyperlipidemia","Metabolic syndrome","Adrenal insufficiency"],
  Neurological:["Stroke/TIA","Seizure disorder","Migraines","Parkinson's","Dementia","Neuropathy","Multiple sclerosis"],
  "GI/Hepatic":["GERD","PUD","IBD","Cirrhosis","NAFLD","Pancreatitis","Diverticulosis","GI bleed history"],
  Renal:["CKD","ESRD on HD","Renal transplant","Prior AKI","Nephrolithiasis","Proteinuria"],
  Hematologic:["Anemia","Thrombocytopenia","On anticoagulation","Coagulopathy","Prior DVT/PE","Sickle cell disease"],
  Psychiatric:["Depression","Anxiety","Bipolar disorder","Schizophrenia","PTSD","Substance use disorder"],
  Oncologic:["Active malignancy","Prior malignancy","On chemotherapy","On immunotherapy","Immunocompromised"],
  Other:["HIV/AIDS","Autoimmune disease","Transplant recipient","Chronic pain","Fibromyalgia","Thyroid disease"],
};
const PMH_CAT_ICONS={Cardiovascular:"\u2665",Pulmonary:"\uD83E\uDEB1","Metabolic/Endo":"\u26A1",Neurological:"\uD83E\uDDE0","GI/Hepatic":"\uD83D\uDD35",Renal:"\uD83D\uDCA7",Hematologic:"\uD83E\uDE78",Psychiatric:"\uD83E\uDDE9",Oncologic:"\u26A0",Other:"\uFF0B"};
const PMH_PRI_STYLE={
  Immediate:{dot:"#ef4444",bg:"rgba(239,68,68,0.12)",badge:"#ef4444"},
  Urgent:   {dot:"#f59e0b",bg:"rgba(245,158,11,0.12)",badge:"#f59e0b"},
  Routine:  {dot:"#64748b",bg:"rgba(100,116,139,0.12)",badge:"#64748b"},
};
const PMH_MDM_HIGH=new Set(["Active malignancy","ESRD on HD","On chemotherapy","On immunotherapy","Immunocompromised","Cirrhosis","On anticoagulation","Coagulopathy","Substance use disorder","Transplant recipient","Renal transplant","HIV/AIDS","Pulmonary HTN","Cardiomyopathy","CHF"]);
const PMH_MDM_MOD=new Set(["HTN","CAD","DM Type 2","DM Type 1","Atrial fibrillation","COPD","Asthma","CKD","Prior MI","Prior PE","Prior DVT/PE","Stroke/TIA","Seizure disorder","Hypothyroidism","Hyperthyroidism","Hyperlipidemia","IBD","Pancreatitis","Sickle cell disease","Anemia","Thrombocytopenia","Prior malignancy","Depression","Bipolar disorder","Schizophrenia","PTSD","Parkinson's","Dementia","Aortic aneurysm","Valvular disease","Pacemaker/ICD","Interstitial lung disease","OSA","GI bleed history","Autoimmune disease"]);
function computePMHMDM(list){
  const high=list.filter(c=>PMH_MDM_HIGH.has(c)),mod=list.filter(c=>PMH_MDM_MOD.has(c)),other=list.filter(c=>!PMH_MDM_HIGH.has(c)&&!PMH_MDM_MOD.has(c));
  let level="Low",rationale="Minimal comorbidity burden";
  if(high.length>=1){level="High";rationale=`${high.length} high-complexity condition${high.length>1?"s":""}: ${high.slice(0,2).join(", ")}${high.length>2?"...":""}`; }
  else if(mod.length>=3){level="High";rationale=`${mod.length} chronic conditions \u2014 \u22653 elevates to High (AMA 2021)`;}
  else if(mod.length>=1){level="Moderate";rationale=`${mod.length} established chronic condition${mod.length>1?"s":""}`;}
  else if(list.length>0){level="Low-Moderate";rationale="Minor or unclassified conditions present";}
  return {level,rationale,high,mod,other};
}

// ─── PMH TAB COMPONENT ────────────────────────────────────────────
function PMHTab({pmh,setPmh,psh,setPsh,patientMeds,setPatientMeds,patientAllergies,setPatientAllergies,chiefComplaint,hpi,onOrderQueueChange,onMDMDataChange}){
  const teal="#0d9488",gold="#d4a017",bdr="rgba(42,79,122,.4)";
  const [mode,setMode]=useState("select");
  const [activeCat,setActiveCat]=useState("Cardiovascular");
  const [searchQ,setSearchQ]=useState("");
  const [pasteText,setPasteText]=useState("");
  const [customInput,setCustomInput]=useState("");
  const [pshInput,setPshInput]=useState("");
  const [medInput,setMedInput]=useState("");
  const [aInput,setAInput]=useState("");
  const [workupRecs,setWorkupRecs]=useState([]);
  const [analyzing,setAnalyzing]=useState(false);
  const [recsOpen,setRecsOpen]=useState(false);
  const [parseMsg,setParseMsg]=useState("");
  const [analyzeErr,setAnalyzeErr]=useState("");
  const [orderQueue,setOrderQueue]=useState([]);
  const [showQueue,setShowQueue]=useState(false);
  const [showMDM,setShowMDM]=useState(false);
  const [orderSent,setOrderSent]=useState(false);
  const [mdmSent,setMdmSent]=useState(false);
  const [copiedAll,setCopiedAll]=useState(false);

  const allConds=Object.values(PMH_CATS).flat();
  const filtered=searchQ.length>1?allConds.filter(c=>c.toLowerCase().includes(searchQ.toLowerCase())):[];
  const mdmData=computePMHMDM(pmh);
  const MDM_COL={High:"#ef4444",Moderate:"#f59e0b","Low-Moderate":"#a78bfa",Low:"#64748b"};
  const mdmColor=MDM_COL[mdmData.level]||"#64748b";

  const toggle=c=>setPmh(p=>p.includes(c)?p.filter(x=>x!==c):[...p,c]);
  const remPmh=c=>setPmh(p=>p.filter(x=>x!==c));
  const remPsh=c=>setPsh(p=>p.filter(x=>x!==c));
  const remMed=c=>setPatientMeds(p=>p.filter(x=>x!==c));
  const remA=c=>setPatientAllergies(p=>p.filter(x=>x!==c));
  const addCust=()=>{const v=customInput.trim();if(v&&!pmh.includes(v))setPmh(p=>[...p,v]);setCustomInput("");};
  const addPsh=()=>{const v=pshInput.trim();if(v&&!psh.includes(v))setPsh(p=>[...p,v]);setPshInput("");};
  const addMed=()=>{const v=medInput.trim();if(v&&!patientMeds.includes(v))setPatientMeds(p=>[...p,v]);setMedInput("");};
  const addA=()=>{const v=aInput.trim();if(v&&!patientAllergies.includes(v))setPatientAllergies(p=>[...p,v]);setAInput("");};

  const isQueued=rec=>orderQueue.some(o=>o.recommendation===rec.recommendation);
  const addToQ=rec=>{if(!isQueued(rec))setOrderQueue(p=>[...p,rec]);};
  const remFromQ=rec=>setOrderQueue(p=>p.filter(o=>o.recommendation!==rec.recommendation));
  const addAllPri=pr=>{const add=workupRecs.filter(r=>r.priority===pr&&!isQueued(r));setOrderQueue(p=>[...p,...add]);setShowQueue(true);};

  const parsePaste=async()=>{
    if(!pasteText.trim())return;setParseMsg("Parsing\u2026");
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,
          system:'Extract structured medical history. Return ONLY valid JSON, no markdown. Format: {"pmh":[],"psh":[],"medications":[],"allergies":[]}',
          messages:[{role:"user",content:"Extract PMH, PSH, medications, allergies:\n\n"+pasteText}]})}); 
      const data=await res.json();
      const parsed=JSON.parse((data.content?.[0]?.text||"{}").replace(/```json|```/g,"").trim());
      if(parsed.pmh?.length)setPmh(p=>[...new Set([...p,...parsed.pmh])]);
      if(parsed.psh?.length)setPsh(p=>[...new Set([...p,...parsed.psh])]);
      if(parsed.medications?.length)setPatientMeds(p=>[...new Set([...p,...parsed.medications])]);
      if(parsed.allergies?.length)setPatientAllergies(p=>[...new Set([...p,...parsed.allergies])]);
      const tot=(parsed.pmh?.length||0)+(parsed.psh?.length||0)+(parsed.medications?.length||0)+(parsed.allergies?.length||0);
      setParseMsg("\u2713 Extracted "+tot+" item"+(tot!==1?"s":""));setPasteText("");
    }catch{setParseMsg("Parse error \u2014 review manually");}
  };

  const analyzeWorkup=async()=>{
    if(!chiefComplaint&&!hpi&&!pmh.length){setAnalyzeErr("Add CC, HPI, or PMH items first");return;}
    setAnalyzeErr("");setAnalyzing(true);setRecsOpen(true);setWorkupRecs([]);setOrderQueue([]);
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,
          system:'Emergency medicine CDS. Return ONLY a valid JSON array, no markdown. Each item: {"category":"Labs|Imaging|Consults|Monitoring|Medications","recommendation":"string","rationale":"string under 15 words","priority":"Immediate|Urgent|Routine","evidence":"guideline tag"}. Max 10. Only what context supports.',
          messages:[{role:"user",content:`CC: ${chiefComplaint||"Not provided"}\nHPI: ${hpi||"Not provided"}\nPMH: ${pmh.join(", ")||"None"}\nPSH: ${psh.join(", ")||"None"}\nMeds: ${patientMeds.join(", ")||"None"}\nAllergies: ${patientAllergies.join(", ")||"NKDA"}\n\nGenerate workup recommendations.`}]})}); 
      const data=await res.json();
      const recs=JSON.parse((data.content?.[0]?.text||"[]").replace(/```json|```/g,"").trim());
      if(Array.isArray(recs)){
        setWorkupRecs(recs);
        const imm=recs.filter(r=>r.priority==="Immediate");
        setOrderQueue(imm);if(imm.length)setShowQueue(true);
      }
    }catch{setAnalyzeErr("Analysis failed \u2014 check connection");}
    setAnalyzing(false);
  };

  const sendToOrders=()=>{if(onOrderQueueChange)onOrderQueueChange(orderQueue);setOrderSent(true);setTimeout(()=>setOrderSent(false),3000);};
  const sendToMDM=()=>{if(onMDMDataChange)onMDMDataChange(mdmData);setMdmSent(true);setTimeout(()=>setMdmSent(false),3000);};
  const copyAll=()=>{const t=workupRecs.map(r=>`[${r.priority.toUpperCase()}] ${r.category}: ${r.recommendation} \u2014 ${r.rationale}`).join("\n");navigator.clipboard.writeText(t).then(()=>{setCopiedAll(true);setTimeout(()=>setCopiedAll(false),2000);});};

  const card={background:"rgba(8,22,40,.55)",border:`1px solid ${bdr}`,borderRadius:12,padding:"13px 16px",marginBottom:9};
  const inp={width:"100%",background:"rgba(14,37,68,.6)",border:"1px solid rgba(42,79,122,.45)",borderRadius:8,padding:"8px 11px",color:"var(--qn-txt)",fontSize:12,outline:"none",boxSizing:"border-box",fontFamily:"'DM Sans',sans-serif"};
  const modeBtn=a=>({padding:"5px 14px",borderRadius:7,fontSize:11,fontWeight:600,cursor:"pointer",border:`1px solid ${a?teal:bdr}`,background:a?"rgba(13,148,136,0.18)":"transparent",color:a?teal:"var(--qn-txt4)"});
  const addBtn=col=>({padding:"7px 13px",background:`${col||teal}20`,border:`1px solid ${col||teal}`,borderRadius:7,color:col||teal,fontSize:12,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0});
  const chip=(sel,col)=>({display:"inline-flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:16,fontSize:11,fontWeight:500,cursor:"pointer",border:`1px solid ${sel?col||teal:bdr}`,background:sel?`${col||teal}22`:"transparent",color:sel?col||teal:"var(--qn-txt4)",margin:"2px"});
  const catTab=a=>({padding:"4px 10px",borderRadius:14,fontSize:9,fontWeight:700,cursor:"pointer",border:`1px solid ${a?gold:bdr}`,background:a?"rgba(212,160,23,0.13)":"transparent",color:a?gold:"var(--qn-txt4)",margin:"2px",fontFamily:"'JetBrains Mono',monospace"});
  const ta={width:"100%",background:"rgba(14,37,68,.6)",border:"1px solid rgba(42,79,122,.45)",borderRadius:8,padding:"9px 11px",color:"var(--qn-txt)",fontSize:12,outline:"none",minHeight:90,resize:"vertical",boxSizing:"border-box",fontFamily:"'DM Sans',sans-serif"};
  const primBtn={padding:"8px 20px",background:`linear-gradient(135deg,${teal},#0f766e)`,border:"none",borderRadius:9,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"};
  const row={display:"flex",gap:8,alignItems:"center"};
  const chipRow={display:"flex",flexWrap:"wrap",gap:5,marginTop:7,minHeight:26};
  const recCard=p=>({background:PMH_PRI_STYLE[p]?.bg||"rgba(100,116,139,0.1)",border:"1px solid rgba(42,79,122,.35)",borderRadius:9,padding:"10px 13px",display:"flex",gap:9,alignItems:"flex-start",marginBottom:6});
  const dotSt=p=>({width:7,height:7,borderRadius:"50%",background:PMH_PRI_STYLE[p]?.dot||"#64748b",flexShrink:0,marginTop:4});
  const catBadge={fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:8,background:"rgba(13,148,136,0.15)",color:teal,fontFamily:"'JetBrains Mono',monospace"};
  const spinner={width:14,height:14,border:"2px solid rgba(42,79,122,.4)",borderTop:`2px solid ${teal}`,borderRadius:"50%",animation:"pmhspin 0.7s linear infinite"};
  const qBtn=q=>({padding:"3px 9px",borderRadius:5,fontSize:10,fontWeight:700,cursor:"pointer",border:`1px solid ${q?"#ef4444":teal}`,background:q?"rgba(239,68,68,0.12)":`rgba(13,148,136,0.12)`,color:q?"#ef4444":teal,flexShrink:0,whiteSpace:"nowrap"});
  const lbl={fontSize:9,fontWeight:700,letterSpacing:"0.08em",color:"var(--qn-txt4)",textTransform:"uppercase",marginBottom:7,fontFamily:"'JetBrains Mono',monospace"};

  const Chips=({items,onRemove,col})=>(
    <div style={chipRow}>
      {!items.length&&<span style={{fontSize:11,color:"var(--qn-txt4)",fontStyle:"italic"}}>None added</span>}
      {items.map(i=><span key={i} style={chip(true,col)}>{i}<span style={{cursor:"pointer",color:"var(--qn-txt4)",marginLeft:3,fontSize:10,fontWeight:700}} onClick={()=>onRemove(i)}>&#x2715;</span></span>)}
    </div>
  );

  return (
    <div style={{marginBottom:14}}>
      <style>{`@keyframes pmhspin{to{transform:rotate(360deg)}}`}</style>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}} className="no-print">
        <span style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:14,color:"var(--qn-teal)"}}>Patient History</span>
        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:"var(--qn-txt4)",letterSpacing:1.5,textTransform:"uppercase",background:"rgba(0,229,192,.08)",border:"1px solid rgba(0,229,192,.2)",borderRadius:4,padding:"2px 7px"}}>PMH \u00B7 PSH \u00B7 Meds \u00B7 Allergies \u00B7 AI Workup</span>
        {pmh.length>0&&<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:mdmColor,background:`${mdmColor}20`,border:`1px solid ${mdmColor}44`,borderRadius:4,padding:"2px 8px"}}>{mdmData.level.toUpperCase()} COMPLEXITY</span>}
      </div>
      <div style={card} className="no-print">
        <div style={{display:"flex",gap:7,marginBottom:13,flexWrap:"wrap"}}>
          {["search","select","paste"].map(m=>(
            <button key={m} style={modeBtn(mode===m)} onClick={()=>setMode(m)}>
              {m==="search"?"Search":m==="select"?"Select":"Paste"}
            </button>
          ))}
          <span style={{marginLeft:"auto",fontSize:11,color:"var(--qn-txt4)",alignSelf:"center"}}>{pmh.length} dx</span>
        </div>
        {mode==="search"&&(
          <div>
            <input style={inp} placeholder="Search conditions (e.g. HTN, COPD, cirrhosis)..." value={searchQ} onChange={e=>setSearchQ(e.target.value)}/>
            {filtered.length>0&&<div style={{marginTop:9}}>{filtered.map(c=><span key={c} style={chip(pmh.includes(c))} onClick={()=>toggle(c)}>{pmh.includes(c)?"\u2713 ":""}{c}</span>)}</div>}
            {searchQ.length>1&&!filtered.length&&(
              <div style={{...row,marginTop:9}}>
                <span style={{fontSize:11,color:"var(--qn-txt4)"}}>No match</span>
                <button style={addBtn()} onClick={()=>{toggle(searchQ);setSearchQ("");}}>Add "{searchQ}"</button>
              </div>
            )}
          </div>
        )}
        {mode==="select"&&(
          <div>
            <div style={{display:"flex",flexWrap:"wrap",marginBottom:11}}>
              {Object.keys(PMH_CATS).map(cat=>(
                <button key={cat} style={catTab(activeCat===cat)} onClick={()=>setActiveCat(cat)}>{cat}</button>
              ))}
            </div>
            <div>{PMH_CATS[activeCat].map(c=><span key={c} style={chip(pmh.includes(c))} onClick={()=>toggle(c)}>{pmh.includes(c)?"\u2713 ":""}{c}</span>)}</div>
            <div style={{...row,marginTop:12}}>
              <input style={inp} placeholder="Add custom condition..." value={customInput} onChange={e=>setCustomInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")addCust();}}/>
              <button style={addBtn()} onClick={addCust}>Add</button>
            </div>
          </div>
        )}
        {mode==="paste"&&(
          <div>
            <div style={lbl}>Paste history, med list, or prior note</div>
            <textarea style={ta} placeholder={"Paste here...\nE.g. PMH: HTN, DM2, CAD s/p CABG\nMeds: metoprolol 25mg\nAllergies: penicillin (rash)"} value={pasteText} onChange={e=>setPasteText(e.target.value)}/>
            <div style={{...row,marginTop:9}}>
              <button style={primBtn} onClick={parsePaste}>AI Parse and Extract</button>
              {parseMsg&&<span style={{fontSize:11,color:parseMsg.startsWith("\u2713")?"var(--qn-teal)":"var(--qn-coral)"}}>{parseMsg}</span>}
            </div>
          </div>
        )}
        <div style={{borderTop:"1px solid rgba(42,79,122,.3)",paddingTop:12,marginTop:13}}>
          <div style={lbl}>Past Medical History</div>
          <Chips items={pmh} onRemove={remPmh} col={teal}/>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:9}} className="no-print">
        <div style={card}>
          <div style={{fontSize:12,fontWeight:600,color:"var(--qn-txt2)",marginBottom:9}}>Past Surgical History</div>
          <div style={row}>
            <input style={inp} placeholder="e.g. CABG 2018, appendectomy..." value={pshInput} onChange={e=>setPshInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")addPsh();}}/>
            <button style={addBtn("#a78bfa")} onClick={addPsh}>Add</button>
          </div>
          <Chips items={psh} onRemove={remPsh} col="#a78bfa"/>
        </div>
        <div style={card}>
          <div style={{fontSize:12,fontWeight:600,color:"var(--qn-txt2)",marginBottom:9}}>Allergies</div>
          <div style={row}>
            <input style={inp} placeholder="e.g. Penicillin (rash)..." value={aInput} onChange={e=>setAInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")addA();}}/>
            <button style={addBtn("var(--qn-coral)")} onClick={addA}>Add</button>
          </div>
          <Chips items={patientAllergies} onRemove={remA} col="var(--qn-coral)"/>
        </div>
      </div>
      <div style={card} className="no-print">
        <div style={{fontSize:12,fontWeight:600,color:"var(--qn-txt2)",marginBottom:9}}>Current Medications</div>
        <div style={row}>
          <input style={inp} placeholder="e.g. Metoprolol 25mg daily..." value={medInput} onChange={e=>setMedInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")addMed();}}/>
          <button style={addBtn(gold)} onClick={addMed}>Add</button>
        </div>
        <Chips items={patientMeds} onRemove={remMed} col={gold}/>
      </div>
      {pmh.length>0&&(
        <div style={{...card,border:`1px solid ${mdmColor}44`}} className="no-print">
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",marginBottom:showMDM?13:0}} onClick={()=>setShowMDM(o=>!o)}>
            <div style={{display:"flex",alignItems:"center",gap:9}}>
              <span style={{fontSize:12,fontWeight:700,color:"var(--qn-txt2)"}}>MDM Comorbidity</span>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,fontWeight:800,padding:"2px 9px",borderRadius:6,background:`${mdmColor}20`,color:mdmColor}}>{mdmData.level.toUpperCase()}</span>
            </div>
            <div style={{display:"flex",gap:7,alignItems:"center"}}>
              <button style={{...addBtn(mdmColor),padding:"5px 13px",fontSize:11,fontWeight:700}} onClick={e=>{e.stopPropagation();sendToMDM();}}>
                {mdmSent?"Sent":"Send to MDM"}
              </button>
              <span style={{color:"var(--qn-txt4)",fontSize:13}}>{showMDM?"\u25B2":"\u25BC"}</span>
            </div>
          </div>
          {showMDM&&(
            <div>
              <div style={{fontSize:12,color:"var(--qn-txt4)",marginBottom:11}}>{mdmData.rationale}</div>
              {mdmData.high.length>0&&(<div style={{marginBottom:10}}><div style={{...lbl,color:"#ef4444"}}>High complexity (AMA 2021)</div><div>{mdmData.high.map(c=><span key={c} style={{...chip(true,"#ef4444"),margin:"2px"}}>{c}</span>)}</div></div>)}
              {mdmData.mod.length>0&&(<div style={{marginBottom:10}}><div style={{...lbl,color:"#f59e0b"}}>Moderate complexity</div><div>{mdmData.mod.map(c=><span key={c} style={{...chip(true,"#f59e0b"),margin:"2px"}}>{c}</span>)}</div></div>)}
              {mdmData.other.length>0&&(<div style={{marginBottom:10}}><div style={lbl}>Unclassified / Minor</div><div>{mdmData.other.map(c=><span key={c} style={{...chip(false),margin:"2px"}}>{c}</span>)}</div></div>)}
              <div style={{background:"rgba(14,37,68,.5)",borderRadius:8,padding:"9px 13px",fontSize:11,color:"var(--qn-txt4)",borderLeft:`3px solid ${mdmColor}`}}>
                <strong style={{color:"var(--qn-txt2)"}}>AMA 2021 </strong>
                {mdmData.level==="High"&&"High: severe comorbidity, exacerbation of chronic illness, or highly complex problems."}
                {mdmData.level==="Moderate"&&"Moderate: 2+ stable chronic conditions, new condition requiring workup, or established condition worsening."}
                {mdmData.level==="Low-Moderate"&&"Low-Moderate: minor or unclassified conditions, verify clinical context."}
                {mdmData.level==="Low"&&"Low: minimal comorbidity burden."}
              </div>
            </div>
          )}
        </div>
      )}
      <div style={{...card,border:"1px solid rgba(0,229,192,.3)"}} className="no-print">
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",marginBottom:recsOpen?13:0}} onClick={()=>setRecsOpen(o=>!o)}>
          <div style={{display:"flex",alignItems:"center",gap:9}}>
            <span style={{fontSize:13,fontWeight:700,color:"var(--qn-teal)",fontFamily:"'Playfair Display',serif"}}>AI Workup Recommendations</span>
            {workupRecs.length>0&&<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,fontWeight:700,padding:"2px 8px",borderRadius:8,background:"rgba(0,229,192,.12)",color:"var(--qn-teal)"}}>{workupRecs.length} recs</span>}
          </div>
          <div style={{display:"flex",gap:7,alignItems:"center"}}>
            {workupRecs.length>0&&<button style={{...addBtn(),padding:"5px 11px",fontSize:11}} onClick={e=>{e.stopPropagation();copyAll();}}>{copiedAll?"Copied":"Copy All"}</button>}
            <button style={primBtn} onClick={e=>{e.stopPropagation();analyzeWorkup();}}>
              {analyzing?"Analyzing...":"Analyze"}
            </button>
            <span style={{color:"var(--qn-txt4)",fontSize:13}}>{recsOpen?"\u25B2":"\u25BC"}</span>
          </div>
        </div>
        {analyzeErr&&<div style={{color:"var(--qn-coral)",fontSize:11,marginTop:5}}>{analyzeErr}</div>}
        {recsOpen&&(
          <div>
            {analyzing&&<div style={{...row,padding:"12px 0"}}><div style={spinner}/><span style={{color:"var(--qn-txt4)",fontSize:12}}>Analyzing CC + HPI + PMH...</span></div>}
            {!analyzing&&!workupRecs.length&&<div style={{color:"var(--qn-txt4)",fontSize:12,fontStyle:"italic"}}>Click Analyze to generate evidence-based recommendations.</div>}
            {!analyzing&&workupRecs.length>0&&(
              <div style={{...row,flexWrap:"wrap",gap:7,marginBottom:12,paddingBottom:12,borderBottom:"1px solid rgba(42,79,122,.3)"}}>
                <span style={{fontSize:11,color:"var(--qn-txt4)"}}>Stage to orders:</span>
                {["Immediate","Urgent","Routine"].map(p=>{const cnt=workupRecs.filter(r=>r.priority===p).length;if(!cnt)return null;return <button key={p} style={{...addBtn(PMH_PRI_STYLE[p].badge),padding:"4px 11px",fontSize:10}} onClick={()=>addAllPri(p)}>+ All {p} ({cnt})</button>;})} 
                {orderQueue.length>0&&<span style={{marginLeft:"auto",fontSize:11,color:"var(--qn-teal)",fontWeight:600}}>{orderQueue.length} staged</span>}
              </div>
            )}
            {!analyzing&&workupRecs.length>0&&["Immediate","Urgent","Routine"].map(priority=>{
              const grp=workupRecs.filter(r=>r.priority===priority);if(!grp.length)return null;
              return (
                <div key={priority} style={{marginBottom:14}}>
                  <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.1em",color:PMH_PRI_STYLE[priority]?.dot,marginBottom:7,textTransform:"uppercase",fontFamily:"'JetBrains Mono',monospace"}}>
                    {priority}
                  </div>
                  {grp.map((rec,i)=>(
                    <div key={i} style={recCard(priority)}>
                      <div style={dotSt(priority)}/>
                      <div style={{flex:1}}>
                        <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap",marginBottom:3}}>
                          <span style={{fontSize:12,fontWeight:600,color:"var(--qn-txt)"}}>{rec.recommendation}</span>
                          <span style={catBadge}>{rec.category}</span>
                          {rec.evidence&&<span style={{fontSize:9,color:"var(--qn-txt4)",fontStyle:"italic"}}>{rec.evidence}</span>}
                          <button style={{...qBtn(isQueued(rec)),marginLeft:"auto"}} onClick={()=>{isQueued(rec)?remFromQ(rec):addToQ(rec);setShowQueue(true);}}>
                            {isQueued(rec)?"Staged":"+ Orders"}
                          </button>
                        </div>
                        <div style={{fontSize:11,color:"var(--qn-txt4)"}}>{rec.rationale}</div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
            {!analyzing&&workupRecs.length>0&&<div style={{fontSize:10,color:"var(--qn-txt4)",borderTop:"1px solid rgba(42,79,122,.3)",paddingTop:9}}>AI recommendations are clinical decision support only. Always apply clinical judgment.</div>}
          </div>
        )}
      </div>
      {orderQueue.length>0&&(
        <div style={{...card,border:"1px solid rgba(245,200,66,.35)"}} className="no-print">
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",marginBottom:showQueue?12:0}} onClick={()=>setShowQueue(o=>!o)}>
            <div style={{display:"flex",alignItems:"center",gap:9}}>
              <span style={{fontSize:12,fontWeight:700,color:"var(--qn-gold)"}}>Order Queue</span>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,fontWeight:800,padding:"2px 9px",borderRadius:6,background:"rgba(245,200,66,.15)",color:"var(--qn-gold)"}}>{orderQueue.length} staged</span>
            </div>
            <div style={{display:"flex",gap:7,alignItems:"center"}}>
              <button style={{padding:"7px 17px",background:"linear-gradient(135deg,#d4a017,#b8860b)",border:"none",borderRadius:9,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}} onClick={e=>{e.stopPropagation();sendToOrders();}}>
                {orderSent?"Sent":"Pre-fill Labs and Imaging"}
              </button>
              <span style={{color:"var(--qn-txt4)",fontSize:13}}>{showQueue?"\u25B2":"\u25BC"}</span>
            </div>
          </div>
          {showQueue&&(
            <div>
              {["Immediate","Urgent","Routine"].map(priority=>{
                const grp=orderQueue.filter(o=>o.priority===priority);if(!grp.length)return null;
                return (
                  <div key={priority} style={{marginBottom:10}}>
                    <div style={{fontSize:9,fontWeight:700,color:PMH_PRI_STYLE[priority]?.dot,letterSpacing:"0.08em",marginBottom:6,textTransform:"uppercase",fontFamily:"'JetBrains Mono',monospace"}}>{priority}</div>
                    {grp.map((o,i)=>(
                      <div key={i} style={{display:"flex",alignItems:"center",gap:9,padding:"7px 11px",background:"rgba(14,37,68,.5)",borderRadius:7,marginBottom:5}}>
                        <span style={catBadge}>{o.category}</span>
                        <span style={{fontSize:12,color:"var(--qn-txt)",flex:1}}>{o.recommendation}</span>
                        <span style={{fontSize:10,color:"var(--qn-txt4)"}}>{o.rationale}</span>
                        <button style={{...qBtn(true),padding:"2px 7px",fontSize:10}} onClick={()=>remFromQ(o)}>x</button>
                      </div>
                    ))}
                  </div>
                );
              })}
              <div style={{borderTop:"1px solid rgba(42,79,122,.3)",paddingTop:9,fontSize:10,color:"var(--qn-txt4)"}}>Pre-fill appends staged orders into Labs and Imaging fields for review before MDM generation.</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


export { PMH_CATS, PMH_CAT_ICONS, PMH_PRI_STYLE, PMH_MDM_HIGH, PMH_MDM_MOD, computePMHMDM, PMHTab };