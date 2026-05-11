// QuickNoteDispositionCard — Final Impression / disposition card
import { DispositionResult } from "./QuickNoteComponents";
import { SDMBlock, AttestationBlock, NursingHandoff } from "./QuickNoteExtras";
import { DispositionCriteriaBuilder } from "@/components/quicknote/QuickNoteDispositionCriteria";
import { dispColor } from "./QuickNoteComponents";

export default function QuickNoteDispositionCard({
  dispResult, setDispResult, mdmResult,
  copiedDisch, setCopiedDisch,
  copiedDischargeOnly, copyDischargeOnly, copyDischargeInstructions,
  showSDM, setShowSDM, showAttestation, setShowAttestation,
  showNursingHandoff, setShowNursingHandoff,
  signOutBusy, signOutDone, generateSignOut,
  providerInfo, demo,
}) {
  const color = dispColor(dispResult.disposition);
  return (
    <div style={{marginBottom:14,padding:"16px",background:"rgba(8,22,40,.5)",
      border:`1px solid ${color}30`,borderRadius:14}} className="print-body">

      {/* Header */}
      <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:14}}>
        <span style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:15,color}}>Final Impression</span>
        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color,letterSpacing:.5,
          background:`${color}18`,border:`1px solid ${color}40`,borderRadius:4,padding:"2px 7px"}}>Post-Results</span>
        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:"var(--qn-txt4)",letterSpacing:1,textTransform:"uppercase",background:"rgba(59,158,255,.1)",border:"1px solid rgba(59,158,255,.2)",borderRadius:4,padding:"2px 7px"}}>ACEP Guidelines</span>
      </div>

      <DispositionResult result={dispResult} copiedDisch={copiedDisch} setCopiedDisch={setCopiedDisch}
        onDiagExplanationEdit={text=>setDispResult(prev=>({...prev,discharge_instructions:{...(prev.discharge_instructions||{}),diagnosis_explanation:text}}))} />
      <DispositionCriteriaBuilder disposition={dispResult.disposition}
        onAddToNote={text=>setDispResult(prev=>({...prev,disposition_rationale:(prev.disposition_rationale?prev.disposition_rationale+" ":"")+text}))} />

      {/* Discharge actions */}
      {dispResult?.discharge_instructions?.diagnosis_explanation&&
       dispResult?.disposition&&
       !dispResult.disposition.toLowerCase().includes("admit")&&
       !dispResult.disposition.toLowerCase().includes("icu")&&(
        <div style={{marginTop:8,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
          <button onClick={copyDischargeInstructions}
            style={{padding:"7px 16px",borderRadius:8,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:11,
              border:`1px solid ${copiedDischargeOnly?"rgba(61,255,160,.5)":"rgba(61,255,160,.35)"}`,
              background:copiedDischargeOnly?"rgba(61,255,160,.15)":"rgba(61,255,160,.07)",color:"var(--qn-green)"}}>
            {copiedDischargeOnly?"✓ Copied":"🖨 Copy Discharge Instructions"}
            {!copiedDischargeOnly&&<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,opacity:.5,marginLeft:6}}>[Shift+4]</span>}
          </button>
          <button onClick={()=>{const dx=encodeURIComponent(dispResult?.final_diagnosis||mdmResult?.working_diagnosis||"");navigator.clipboard?.writeText(dispResult?.final_diagnosis||mdmResult?.working_diagnosis||"").catch(()=>{});window.open(`/DischargeRxCard${dx?"?dx="+dx:""}`, "_blank");}}
            style={{padding:"7px 16px",borderRadius:8,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:11,
              border:"1px solid rgba(245,200,66,.4)",background:"rgba(245,200,66,.07)",color:"var(--qn-gold)"}}>
            💊 Open Rx Card
          </button>
        </div>
      )}

      {/* Post-dispo extras */}
      <div style={{display:"flex",gap:6,marginTop:10,flexWrap:"wrap"}} className="no-print">
        {[
          {key:"sdm",label:"Shared Decision Making",active:showSDM,setActive:setShowSDM,c:"rgba(59,158,255"},
          {key:"att",label:"Physician Attestation",active:showAttestation,setActive:setShowAttestation,c:"rgba(155,109,255"},
          {key:"nur",label:"Nursing Handoff",active:showNursingHandoff,setActive:setShowNursingHandoff,c:"rgba(61,255,160"},
        ].map(({key,label,active,setActive,c})=>(
          <button key={key} onClick={()=>setActive(s=>!s)}
            style={{padding:"5px 12px",borderRadius:7,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",fontSize:8,fontWeight:700,
              border:`1px solid ${active?c+",.5)":"rgba(42,79,122,.4)"}`,
              background:active?c+",.1)":"transparent",color:active?c+",1)":"var(--qn-txt4)",letterSpacing:.5}}>
            {active?"▲":"▼"} {label}
          </button>
        ))}
        <button onClick={generateSignOut} disabled={signOutBusy}
          style={{padding:"5px 12px",borderRadius:7,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",fontSize:8,fontWeight:700,
            border:`1px solid ${signOutDone?"rgba(61,255,160,.5)":signOutBusy?"rgba(42,79,122,.3)":"rgba(245,200,66,.4)"}`,
            background:signOutDone?"rgba(61,255,160,.1)":signOutBusy?"rgba(14,37,68,.4)":"rgba(245,200,66,.07)",
            color:signOutDone?"var(--qn-green)":signOutBusy?"var(--qn-txt4)":"var(--qn-gold)"}}>
          {signOutDone?"✓ Sent":signOutBusy?"● Generating…":"→ Generate Sign-Out"}
        </button>
      </div>
      {showSDM&&<SDMBlock disposition={dispResult.disposition} patientName={[demo?.firstName,demo?.lastName].filter(Boolean).join(" ")} />}
      {showAttestation&&<AttestationBlock providerName={providerInfo.name} credentials={providerInfo.credentials} facility={providerInfo.facility} mdmLevel={mdmResult?.mdm_level} />}
      {showNursingHandoff&&<NursingHandoff patientName={[demo?.firstName,demo?.lastName].filter(Boolean).join(" ")} diagnosis={dispResult.final_diagnosis||mdmResult?.working_diagnosis||""} disposition={dispResult.disposition} />}
    </div>
  );
}