import { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";

const InvokeLLM = (params) => base44.integrations.Core.InvokeLLM(params);

(() => {
  if (document.getElementById("mrc-css")) return;
  const l = document.createElement("link"); l.id = "mrc-f"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "mrc-css";
  s.textContent = `*{box-sizing:border-box;}@keyframes mrcIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}@keyframes mrcSpin{to{transform:rotate(360deg)}}.mrc-in{animation:mrcIn .22s ease both;}::-webkit-scrollbar{width:3px;height:3px;}::-webkit-scrollbar-thumb{background:rgba(0,180,216,.25);border-radius:2px;}textarea::placeholder,input::placeholder{color:rgba(221,230,240,.2);}textarea:focus,input:focus{border-color:rgba(0,180,216,.6)!important;outline:none;}`;
  document.head.appendChild(s);
})();

const T={bg:"#07111f",card:"rgba(255,255,255,0.04)",bdr:"rgba(255,255,255,0.08)",teal:"#00b4d8",tD:"rgba(0,180,216,0.12)",tB:"rgba(0,180,216,0.25)",gold:"#f0a500",gD:"rgba(240,165,0,0.12)",coral:"#ff6060",cD:"rgba(255,96,96,0.12)",green:"#4ade80",grnD:"rgba(74,222,128,0.1)",purple:"#9b6dff",pD:"rgba(155,109,255,0.12)",orange:"#ff9f43",oD:"rgba(255,159,67,0.12)",txt:"#dde6f0",mut:"rgba(221,230,240,0.55)",dim:"rgba(221,230,240,0.28)"};
const gl=(x={})=>({backdropFilter:"blur(14px)",background:T.card,border:`1px solid ${T.bdr}`,borderRadius:12,...x});
const ab=(c=T.teal,x={})=>({padding:"8px 18px",borderRadius:9,cursor:"pointer",border:`1px solid ${c}55`,background:`${c}18`,color:c,fontFamily:"DM Sans,sans-serif",fontSize:13,fontWeight:700,transition:"all .16s",...x});
const tg=(c,x={})=>({borderRadius:5,padding:"2px 8px",fontSize:10,fontWeight:700,background:`${c}18`,border:`1px solid ${c}30`,color:c,...x});
const Spin=()=><span style={{display:"inline-block",width:13,height:13,border:"2px solid rgba(0,180,216,.2)",borderTopColor:T.teal,borderRadius:"50%",animation:"mrcSpin .7s linear infinite"}}/>;

export default function MedRecHub() {
  const [homeMeds,setHomeMeds]=useState("");
  const [edMeds,setEdMeds]=useState("");
  const [age,setAge]=useState(""); const [crcl,setCrcl]=useState(""); const [allergy,setAllergy]=useState("");
  const [result,setResult]=useState(null); const [loading,setLoading]=useState(false);
  const [copied,setCopied]=useState(false);

  const run=async()=>{
    if(!homeMeds.trim()||loading) return;
    setLoading(true); setResult(null);
    try {
      const r=await InvokeLLM({
        prompt:`You are a clinical ED pharmacist performing medication reconciliation.

Patient context: ${[age?`Age: ${age}yr`:"",crcl?`CrCl: ${crcl} mL/min`:"",allergy?`Allergies: ${allergy}`:""].filter(Boolean).join(", ")||"No patient parameters provided"}

HOME MEDICATIONS:
${homeMeds}

${edMeds.trim()?`PLANNED ED MEDICATIONS:\n${edMeds}\n`:""}

Perform a comprehensive medication reconciliation:
1. Flag any significant drug-drug interactions between home meds and ED meds
2. Identify renally-dosed drugs that may need adjustment based on provided CrCl
3. Flag any drugs that should be held in the ED setting (metformin, anticoagulants before procedures, etc.)
4. Identify any allergy conflicts
5. Recommend any home medications that should be continued vs held during ED stay

Be specific, clinical, and actionable. Flag severity: critical, major, moderate.`,
        response_json_schema:{
          type:"object",
          properties:{
            interactions:{type:"array",items:{type:"object",properties:{
              drug_a:{type:"string"},drug_b:{type:"string"},
              severity:{type:"string"},description:{type:"string"},recommendation:{type:"string"}},
              required:["drug_a","drug_b","severity","description","recommendation"]}},
            renal_flags:{type:"array",items:{type:"object",properties:{
              drug:{type:"string"},issue:{type:"string"},recommendation:{type:"string"}},
              required:["drug","issue","recommendation"]}},
            hold_list:{type:"array",items:{type:"object",properties:{
              drug:{type:"string"},reason:{type:"string"},resume_when:{type:"string"}},
              required:["drug","reason"]}},
            allergy_flags:{type:"array",items:{type:"string"}},
            continue_list:{type:"array",items:{type:"string"}},
            summary:{type:"string"},
          },
          required:["interactions","renal_flags","hold_list","continue_list","summary"],
        },
      });
      setResult(r);
    } catch { setResult({_err:true}); }
    setLoading(false);
  };

  const sevColor={critical:T.coral,major:T.coral,moderate:T.gold,minor:T.mut};
  const sevBg={critical:T.cD,major:T.cD,moderate:T.gD,minor:T.card};

  const copyReport=()=>{
    if(!result) return;
    const lines=[
      "=== MEDICATION RECONCILIATION REPORT ===",
      `Patient: ${[age?`Age ${age}yr`:"",crcl?`CrCl ${crcl} mL/min`:"",allergy?`Allergies: ${allergy}`:""].filter(Boolean).join(", ")||"—"}`,
      "",
      "SUMMARY:",result.summary||"—","",
      "INTERACTIONS:",
      ...(result.interactions||[]).map(i=>`• ${i.drug_a} + ${i.drug_b} [${i.severity?.toUpperCase()}]: ${i.description}. Recommendation: ${i.recommendation}`),
      "",
      "RENAL FLAGS:",
      ...(result.renal_flags||[]).map(r=>`• ${r.drug}: ${r.issue}. Recommendation: ${r.recommendation}`),
      "",
      "HOLD LIST:",
      ...(result.hold_list||[]).map(h=>`• ${h.drug}: ${h.reason}. Resume when: ${h.resume_when}`),
      "",
      "CONTINUE:",
      ...(result.continue_list||[]).map(d=>`• ${d}`),
    ].join("\n");
    navigator.clipboard?.writeText(lines).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2500);});
  };

  const totalFlags=result?(result.interactions?.length||0)+(result.renal_flags?.length||0)+(result.hold_list?.length||0)+(result.allergy_flags?.length||0):0;

  return(
    <div style={{background:T.bg,minHeight:"100vh",padding:"20px 18px 60px",fontFamily:"DM Sans,sans-serif",color:T.txt}}>

      {/* Header */}
      <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:22}}>
        <div style={{width:44,height:44,borderRadius:11,background:T.tD,border:`1px solid ${T.tB}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>📋</div>
        <div>
          <h1 style={{margin:0,fontFamily:"Playfair Display,serif",fontSize:22,color:T.teal,letterSpacing:"-0.5px",lineHeight:1}}>Medication Reconciliation</h1>
          <p style={{margin:"3px 0 0",fontSize:12,color:T.mut}}>AI-powered med rec · Drug-drug interactions · Renal flags · Hold list · Allergy conflicts</p>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:14}}>
        {/* Left column — inputs */}
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {/* Patient context */}
          <div style={{...gl({padding:"12px 16px"})}}>
            <div style={{fontSize:9,color:T.teal,fontFamily:"JetBrains Mono,monospace",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:10}}>Patient Context</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
              {[["Age","age",age,setAge,"yr"],["CrCl","crcl",crcl,setCrcl,"mL/min"]].map(([l,k,v,set,u])=>(
                <div key={k}>
                  <div style={{fontSize:8,color:T.dim,fontFamily:"JetBrains Mono,monospace",letterSpacing:1,textTransform:"uppercase",marginBottom:3}}>{l}</div>
                  <div style={{position:"relative"}}>
                    <input type="number" value={v} onChange={e=>set(e.target.value)} placeholder="—"
                      style={{background:"rgba(13,27,46,.8)",border:`1px solid ${T.bdr}`,borderRadius:8,padding:"7px 28px 7px 11px",color:T.txt,fontFamily:"JetBrains Mono,monospace",fontSize:13,fontWeight:600,width:"100%"}}/>
                    <span style={{position:"absolute",right:7,top:"50%",transform:"translateY(-50%)",fontSize:9,color:T.dim,pointerEvents:"none"}}>{u}</span>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <div style={{fontSize:8,color:T.coral,fontFamily:"JetBrains Mono,monospace",letterSpacing:1,textTransform:"uppercase",marginBottom:3}}>Allergies</div>
              <input value={allergy} onChange={e=>setAllergy(e.target.value)} placeholder="e.g. Penicillin, Sulfa"
                style={{background:"rgba(13,27,46,.8)",border:`1px solid ${allergy?T.coral+"50":T.bdr}`,borderRadius:8,padding:"7px 11px",color:T.txt,fontFamily:"DM Sans,sans-serif",fontSize:12,width:"100%"}}/>
            </div>
          </div>

          {/* Home meds */}
          <div style={{...gl({padding:"12px 16px",flex:1})}}>
            <div style={{fontSize:9,color:T.gold,fontFamily:"JetBrains Mono,monospace",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>Home Medications *</div>
            <textarea value={homeMeds} onChange={e=>setHomeMeds(e.target.value)} rows={8}
              placeholder={"Paste or type home medication list:\ne.g.\nMetformin 1000mg PO BID\nLisinopril 10mg PO daily\nAtorvastatin 40mg PO nightly\nWarfarin 5mg PO daily\nMetoprolol succinate 50mg PO daily"}
              style={{background:"rgba(13,27,46,.8)",border:`1px solid ${homeMeds?T.gold+"50":T.bdr}`,borderRadius:8,padding:"9px 12px",color:T.txt,fontFamily:"DM Sans,sans-serif",fontSize:12,width:"100%",resize:"vertical",lineHeight:1.6}}/>
          </div>

          {/* ED meds */}
          <div style={{...gl({padding:"12px 16px"})}}>
            <div style={{fontSize:9,color:T.teal,fontFamily:"JetBrains Mono,monospace",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>Planned ED Medications (optional)</div>
            <textarea value={edMeds} onChange={e=>setEdMeds(e.target.value)} rows={4}
              placeholder={"e.g.\nCeftriaxone 2g IV\nVancomycin 25 mg/kg IV\nPip-Tazo 4.5g IV"}
              style={{background:"rgba(13,27,46,.8)",border:`1px solid ${T.bdr}`,borderRadius:8,padding:"9px 12px",color:T.txt,fontFamily:"DM Sans,sans-serif",fontSize:12,width:"100%",resize:"vertical",lineHeight:1.6}}/>
          </div>

          <button onClick={run} disabled={!homeMeds.trim()||loading}
            style={{...ab(T.teal,{display:"flex",alignItems:"center",gap:8,justifyContent:"center",opacity:(!homeMeds.trim()||loading)?.4:1})}}>
            {loading?<><Spin/>Running Med Rec...</>:"🔍 Run Medication Reconciliation"}
          </button>
        </div>

        {/* Right column — results */}
        <div>
          {!result&&!loading&&(
            <div style={{textAlign:"center",padding:"80px 20px",color:T.dim}}>
              <div style={{fontSize:40,marginBottom:12}}>📋</div>
              <div style={{fontSize:14,color:T.mut,marginBottom:5}}>Enter home medications and run reconciliation</div>
              <div style={{fontSize:11}}>AI flags interactions, renal issues, hold list, and allergy conflicts</div>
            </div>
          )}

          {loading&&(
            <div style={{...gl({padding:"40px",textAlign:"center"})}}>
              <Spin/>
              <div style={{fontSize:12,color:T.mut,marginTop:12}} className="mrc-in">Analyzing medications, interactions, and renal dosing...</div>
            </div>
          )}

          {result&&!result._err&&!loading&&(
            <div className="mrc-in">
              {/* Summary banner */}
              <div style={{...gl({padding:"12px 16px",marginBottom:12,border:`2px solid ${totalFlags>3?T.coral+"55":totalFlags>0?T.gold+"55":T.green+"55"}`,background:totalFlags>3?T.cD:totalFlags>0?T.gD:T.grnD})}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                  <div style={{fontSize:13,fontWeight:700,color:totalFlags>3?T.coral:totalFlags>0?T.gold:T.green}}>
                    {totalFlags===0?"✓ No significant flags found":`⚠ ${totalFlags} flag${totalFlags!==1?"s":""} found`}
                  </div>
                  <button onClick={copyReport} style={{...ab(T.teal,{padding:"4px 12px",fontSize:11})}}>
                    {copied?"✓ Copied":"📋 Copy Report"}
                  </button>
                </div>
                <div style={{fontSize:12,color:T.txt,lineHeight:1.6}}>{result.summary}</div>
              </div>

              {/* Allergy flags */}
              {result.allergy_flags?.length>0&&(
                <div style={{...gl({padding:"12px 16px",marginBottom:10,border:`2px solid ${T.coral}55`,background:T.cD})}}>
                  <div style={{fontSize:9,color:T.coral,fontFamily:"JetBrains Mono,monospace",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>🚨 Allergy Conflicts</div>
                  {result.allergy_flags.map((f,i)=><div key={i} style={{fontSize:12,color:T.txt,marginBottom:3}}>• {f}</div>)}
                </div>
              )}

              {/* Interactions */}
              {result.interactions?.length>0&&(
                <div style={{marginBottom:12}}>
                  <div style={{fontSize:9,color:T.coral,fontFamily:"JetBrains Mono,monospace",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>Drug-Drug Interactions ({result.interactions.length})</div>
                  {result.interactions.map((ix,i)=>{
                    const c=sevColor[ix.severity?.toLowerCase()]||T.mut;
                    const bg=sevBg[ix.severity?.toLowerCase()]||T.card;
                    return(
                      <div key={i} style={{...gl({padding:"11px 14px",marginBottom:8,borderLeft:`3px solid ${c}`,background:bg})}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5,flexWrap:"wrap"}}>
                          <span style={{...tg(c),fontSize:10}}>{ix.severity?.toUpperCase()||"—"}</span>
                          <span style={{fontSize:13,fontWeight:700,color:T.txt}}>{ix.drug_a}</span>
                          <span style={{color:T.dim}}>×</span>
                          <span style={{fontSize:13,fontWeight:700,color:T.txt}}>{ix.drug_b}</span>
                        </div>
                        <div style={{fontSize:12,color:T.mut,marginBottom:5,lineHeight:1.55}}>{ix.description}</div>
                        <div style={{fontSize:11,color:c,fontWeight:600}}>→ {ix.recommendation}</div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Renal flags */}
              {result.renal_flags?.length>0&&(
                <div style={{marginBottom:12}}>
                  <div style={{fontSize:9,color:T.gold,fontFamily:"JetBrains Mono,monospace",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>Renal Dosing Flags ({result.renal_flags.length})</div>
                  {result.renal_flags.map((r,i)=>(
                    <div key={i} style={{...gl({padding:"10px 14px",marginBottom:7,borderLeft:`3px solid ${T.gold}`,background:T.gD})}}>
                      <div style={{fontSize:12,fontWeight:700,color:T.gold,marginBottom:3}}>{r.drug}</div>
                      <div style={{fontSize:12,color:T.mut,marginBottom:4}}>{r.issue}</div>
                      <div style={{fontSize:11,color:T.gold,fontWeight:600}}>→ {r.recommendation}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Hold list */}
              {result.hold_list?.length>0&&(
                <div style={{marginBottom:12}}>
                  <div style={{fontSize:9,color:T.orange,fontFamily:"JetBrains Mono,monospace",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>Hold List — Do Not Continue ({result.hold_list.length})</div>
                  {result.hold_list.map((h,i)=>(
                    <div key={i} style={{...gl({padding:"10px 14px",marginBottom:7,borderLeft:`3px solid ${T.orange}`,background:T.oD})}}>
                      <div style={{fontSize:12,fontWeight:700,color:T.orange,marginBottom:3}}>{h.drug}</div>
                      <div style={{fontSize:12,color:T.mut,marginBottom:3}}>{h.reason}</div>
                      <div style={{fontSize:10,color:T.dim}}>Resume when: {h.resume_when}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Continue list */}
              {result.continue_list?.length>0&&(
                <div>
                  <div style={{fontSize:9,color:T.green,fontFamily:"JetBrains Mono,monospace",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>Continue During ED Stay</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    {result.continue_list.map((d,i)=><span key={i} style={{...tg(T.green),fontSize:11}}>✓ {d}</span>)}
                  </div>
                </div>
              )}

              <div style={{fontSize:9,color:T.dim,marginTop:10}}>AI-generated · Verify with clinical pharmacist · Not a substitute for pharmacist med rec</div>
            </div>
          )}
          {result?._err&&<div style={{fontSize:12,color:T.coral,marginTop:20}}>Reconciliation failed. Check connection and retry.</div>}
        </div>
      </div>

      <div style={{textAlign:"center",marginTop:20}}>
        <span style={{fontFamily:"JetBrains Mono,monospace",fontSize:9,color:T.dim,letterSpacing:1.5}}>NOTRYA · MEDICATION RECONCILIATION · AI-GENERATED · VERIFY WITH CLINICAL PHARMACIST BEFORE CLINICAL USE</span>
      </div>
    </div>
  );
}