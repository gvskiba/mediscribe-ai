// QuickNoteMDMCard — Initial Impression / MDM result card
import { MDMResult } from "./QuickNoteComponents";
import { MDMPlanEntry } from "./QuickNoteExtras";
import { GuidelineAssist } from "@/components/quicknote/QuickNoteGuidelines";
import { MDMPhraseTemplates } from "@/components/quicknote/MDMPhraseTemplates";
import { buildMDMBlock } from "./QuickNotePrompts";

export default function QuickNoteMDMCard({
  mdmResult, setMdmResult, isBounceback, mdmInitialTs,
  copiedMDM, setCopiedMDM, copiedMDMFull, setCopiedMDMFull,
  workupRationale, setWorkupRationale, workupRationaleBusy, runWorkupRationale, copiedWorkup, setCopiedWorkup,
  treatmentPlan, setTreatmentPlan, actionPlan, setActionPlan,
  treatmentPlanBusy, generateClinicalPlan,
  mdmHistory, showMdmHistory, setShowMdmHistory,
  rerunAddendumBusy, runMDMAddendum,
  setDispResult, setP2Open, setLabRecs, setImagingRecs,
}) {
  return (
    <div style={{marginBottom:14,padding:"16px",background:"rgba(8,22,40,.5)",
      border:"1px solid rgba(0,229,192,.2)",borderRadius:14}} className="print-body">

      {/* Header row */}
      <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:14,flexWrap:"wrap"}}>
        <span style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:15,color:"var(--qn-teal)"}}>Initial Impression</span>
        {mdmInitialTs&&<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:"var(--qn-teal)",letterSpacing:.5,background:"rgba(0,229,192,.1)",border:"1px solid rgba(0,229,192,.25)",borderRadius:4,padding:"2px 7px"}}>⏱ {mdmInitialTs}</span>}
        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:"var(--qn-txt4)",letterSpacing:1,textTransform:"uppercase",background:"rgba(0,229,192,.1)",border:"1px solid rgba(0,229,192,.2)",borderRadius:4,padding:"2px 7px"}}>AMA/CMS 2023 · ACEP</span>
        {isBounceback&&<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:"var(--qn-coral)",background:"rgba(255,107,107,.1)",border:"1px solid rgba(255,107,107,.35)",borderRadius:4,padding:"2px 7px"}}>⚠ Bounceback</span>}
        <div style={{flex:1}} />
        <button onClick={runWorkupRationale} disabled={workupRationaleBusy}
          style={{padding:"4px 11px",borderRadius:7,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",fontSize:8,fontWeight:700,
            border:`1px solid ${workupRationaleBusy?"rgba(42,79,122,.3)":"rgba(245,200,66,.4)"}`,
            background:workupRationaleBusy?"rgba(14,37,68,.4)":"rgba(245,200,66,.07)",
            color:workupRationaleBusy?"var(--qn-txt4)":"var(--qn-gold)",letterSpacing:.4,transition:"all .15s"}}>
          {workupRationaleBusy?"● …":"✦ Workup Rationale"}
        </button>
        <button onClick={()=>{navigator.clipboard.writeText(buildMDMBlock(mdmResult,{treatmentPlan,actionPlan})).then(()=>{setCopiedMDMFull(true);setTimeout(()=>setCopiedMDMFull(false),2000);});}}
          style={{padding:"4px 12px",borderRadius:7,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:11,
            border:`1px solid ${copiedMDMFull?"rgba(61,255,160,.5)":"rgba(0,229,192,.35)"}`,
            background:copiedMDMFull?"rgba(61,255,160,.1)":"rgba(0,229,192,.07)",
            color:copiedMDMFull?"var(--qn-green)":"var(--qn-teal)",transition:"all .15s"}}>
          {copiedMDMFull?"✓ MDM Copied":"Copy MDM"}
        </button>
        <button onClick={()=>{setMdmResult(null);setDispResult(null);setP2Open(false);setWorkupRationale(null);setLabRecs(null);setImagingRecs(null);}}
          style={{padding:"4px 12px",borderRadius:7,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:11,
            border:"1px solid rgba(245,200,66,.35)",background:"rgba(245,200,66,.07)",color:"var(--qn-gold)"}}>↩ Re-run MDM</button>
        <button onClick={runMDMAddendum} disabled={rerunAddendumBusy}
          style={{padding:"4px 12px",borderRadius:7,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:11,
            border:`1px solid ${rerunAddendumBusy?"rgba(42,79,122,.3)":"rgba(155,109,255,.4)"}`,
            background:rerunAddendumBusy?"rgba(14,37,68,.4)":"rgba(155,109,255,.07)",
            color:rerunAddendumBusy?"var(--qn-txt4)":"var(--qn-purple)",transition:"all .15s"}}>
          {rerunAddendumBusy?"● …":"+ Addendum Re-run"}
        </button>
      </div>

      <MDMResult result={mdmResult} copiedMDM={copiedMDM} setCopiedMDM={setCopiedMDM}
        onNarrativeEdit={text=>setMdmResult(prev=>({...prev,mdm_narrative:text}))} />

      {/* Clinical Plan */}
      <div style={{marginTop:12,padding:"12px 14px",borderRadius:10,
        background:"rgba(14,37,68,.4)",border:"1px solid rgba(42,79,122,.3)"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,flexWrap:"wrap"}}>
          <span style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:14,color:"var(--qn-txt2)",flex:1}}>My Clinical Plan</span>
          <button onClick={generateClinicalPlan} disabled={treatmentPlanBusy}
            title="AI generates evidence-based treatment plan and action items from working diagnosis"
            style={{padding:"5px 14px",borderRadius:7,cursor:"pointer",
              fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:11,transition:"all .15s",
              border:`1px solid ${treatmentPlanBusy?"rgba(42,79,122,.3)":"rgba(0,229,192,.5)"}`,
              background:treatmentPlanBusy?"rgba(14,37,68,.4)":"rgba(0,229,192,.1)",
              color:treatmentPlanBusy?"var(--qn-txt4)":"var(--qn-teal)",
              boxShadow:treatmentPlanBusy?"none":"0 0 12px rgba(0,229,192,.08)"}}>
            {treatmentPlanBusy
              ? <><span style={{marginRight:5}}>●</span>Generating Plan…</>
              : (treatmentPlan||actionPlan) ? "↻ Re-generate Plan" : "✦ AI Generate Plan"}
          </button>
          {(treatmentPlan||actionPlan)&&(
            <button onClick={()=>{setTreatmentPlan("");setActionPlan("");}}
              style={{padding:"5px 10px",borderRadius:7,cursor:"pointer",
                fontFamily:"'JetBrains Mono',monospace",fontSize:8,fontWeight:700,
                border:"1px solid rgba(42,79,122,.35)",background:"transparent",color:"var(--qn-txt4)"}}>Clear</button>
          )}
        </div>
        {!treatmentPlan&&!actionPlan&&!treatmentPlanBusy&&(
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:"rgba(107,158,200,.4)",letterSpacing:.4,marginBottom:8}}>
            Click ✦ AI Generate Plan to get an evidence-based treatment plan and action item checklist for this presentation
          </div>
        )}
        <MDMPlanEntry treatmentPlan={treatmentPlan} setTreatmentPlan={setTreatmentPlan}
          actionPlan={actionPlan} setActionPlan={setActionPlan} />
      </div>

      <GuidelineAssist workingDx={mdmResult?.working_diagnosis||""} mdmNarrative={mdmResult?.mdm_narrative||""}
        onInsertSentence={text=>setMdmResult(prev=>({...prev,mdm_narrative:prev?.mdm_narrative?prev.mdm_narrative+"\n\n"+text:text}))} />

      <MDMPhraseTemplates
        currentNarrative={mdmResult?.mdm_narrative||""}
        onInsert={text=>setMdmResult(prev=>({...prev,mdm_narrative:prev?.mdm_narrative?prev.mdm_narrative+"\n\n"+text:text}))}
      />

      {/* Why this complexity level */}
      {mdmResult.mdm_level&&(
        <details style={{marginTop:10}}>
          <summary style={{cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",fontSize:8,fontWeight:700,color:"var(--qn-txt4)",letterSpacing:1,textTransform:"uppercase",listStyle:"none"}}>
            ▶ Why {mdmResult.mdm_level} complexity?
          </summary>
          <div style={{marginTop:8,padding:"10px 12px",borderRadius:8,background:"rgba(14,37,68,.5)",border:"1px solid rgba(42,79,122,.3)"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
              {[
                {label:"Problem Complexity",value:mdmResult.problem_complexity,color:"var(--qn-teal)"},
                {label:"Data Complexity",   value:mdmResult.data_complexity,   color:"var(--qn-blue)"},
                {label:"Risk Level",        value:mdmResult.risk_tier,         color:"var(--qn-gold)"},
              ].map(({label,value,color})=>(
                <div key={label}>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,color:"var(--qn-txt4)",letterSpacing:.8,textTransform:"uppercase",marginBottom:4}}>{label}</div>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600,color,lineHeight:1.4}}>{value||"—"}</div>
                </div>
              ))}
            </div>
            {mdmResult.risk_rationale&&<div style={{marginTop:8,fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"var(--qn-txt2)",lineHeight:1.6,paddingTop:8,borderTop:"1px solid rgba(42,79,122,.25)"}}>{mdmResult.risk_rationale}</div>}
            <div style={{marginTop:6,fontFamily:"'JetBrains Mono',monospace",fontSize:7,color:"rgba(107,158,200,.45)"}}>MDM level driven by HIGHEST column — Problem, Data, or Risk</div>
          </div>
        </details>
      )}

      {/* Workup rationale */}
      {workupRationale&&(
        <div className="qn-fade" style={{marginTop:10,padding:"12px 14px",borderRadius:10,background:"rgba(245,200,66,.05)",border:"1px solid rgba(245,200,66,.3)"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
            <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:700,color:"var(--qn-gold)",letterSpacing:1,textTransform:"uppercase",flex:1}}>Workup Rationale</span>
            <button onClick={()=>{navigator.clipboard.writeText(workupRationale).then(()=>{setCopiedWorkup(true);setTimeout(()=>setCopiedWorkup(false),2000);});}}
              style={{padding:"2px 9px",borderRadius:5,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",fontSize:8,fontWeight:700,
                border:`1px solid ${copiedWorkup?"rgba(61,255,160,.5)":"rgba(245,200,66,.4)"}`,
                background:copiedWorkup?"rgba(61,255,160,.1)":"transparent",
                color:copiedWorkup?"var(--qn-green)":"var(--qn-gold)"}}>
              {copiedWorkup?"✓ Copied":"Copy"}
            </button>
          </div>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"var(--qn-txt2)",lineHeight:1.75}}>{workupRationale}</div>
        </div>
      )}

      {/* Clinical progression history */}
      {mdmHistory.length>1&&(
        <div style={{marginTop:10}}>
          <button onClick={()=>setShowMdmHistory(p=>!p)}
            style={{padding:"3px 10px",borderRadius:6,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",fontSize:8,fontWeight:700,
              border:`1px solid ${showMdmHistory?"rgba(155,109,255,.5)":"rgba(42,79,122,.35)"}`,
              background:showMdmHistory?"rgba(155,109,255,.08)":"transparent",
              color:showMdmHistory?"var(--qn-purple)":"var(--qn-txt4)"}}>
            {showMdmHistory?"▲":"▼"} Clinical Progression ({mdmHistory.length} entries)
          </button>
          {showMdmHistory&&(
            <div style={{marginTop:8,display:"flex",flexDirection:"column",gap:6}}>
              {mdmHistory.map((h,i)=>(
                <div key={i} style={{padding:"9px 12px",borderRadius:8,
                  background:i===mdmHistory.length-1?"rgba(155,109,255,.07)":"rgba(14,37,68,.4)",
                  border:`1px solid ${i===mdmHistory.length-1?"rgba(155,109,255,.3)":"rgba(42,79,122,.25)"}`}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                    <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,fontWeight:700,
                      color:i===mdmHistory.length-1?"var(--qn-purple)":"var(--qn-txt4)",letterSpacing:.8,textTransform:"uppercase"}}>{h.trigger}</span>
                    <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:"var(--qn-txt4)"}}>{h.ts}</span>
                    <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:"var(--qn-gold)",background:"rgba(245,200,66,.1)",border:"1px solid rgba(245,200,66,.25)",borderRadius:3,padding:"1px 5px"}}>{h.mdm_level}</span>
                    <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"var(--qn-txt2)",flex:1}}>{h.working_diagnosis}</span>
                  </div>
                  {h.mdm_narrative&&<div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"var(--qn-txt3)",lineHeight:1.5}}>{h.mdm_narrative.slice(0,200)}{h.mdm_narrative.length>200?"…":""}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}