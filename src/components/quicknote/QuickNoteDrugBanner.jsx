// Drug interaction banner — Feature #9
export default function QuickNoteDrugBanner({ drugCheckBusy, drugInteractions, drugCheckDismissed,
  setDrugCheckDismissed, parsedMeds, runDrugInteractionCheck }) {
  if (!drugCheckBusy && (!drugInteractions || drugCheckDismissed)) return null;
  return (
    <div style={{ marginBottom:10,borderRadius:10,overflow:"hidden",background:"rgba(8,22,40,.55)",
      border:`1px solid ${drugCheckBusy?"rgba(42,79,122,.35)":drugInteractions?.clean?"rgba(61,255,160,.3)":"rgba(255,107,107,.35)"}` }}>
      <div style={{ display:"flex",alignItems:"center",gap:9,padding:"8px 14px",
        background:drugInteractions?.clean?"rgba(61,255,160,.05)":"rgba(255,107,107,.05)" }}>
        <span style={{ fontSize:13 }}>{drugCheckBusy?"⏳":drugInteractions?.clean?"✓":"⚠"}</span>
        <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:8,fontWeight:700,letterSpacing:1,
          textTransform:"uppercase",flex:1,
          color:drugCheckBusy?"var(--qn-txt4)":drugInteractions?.clean?"var(--qn-green)":"var(--qn-coral)" }}>
          {drugCheckBusy?"Checking drug interactions…":drugInteractions?.clean?"No significant interactions found":"Drug Safety Alert"}
        </span>
        {!drugCheckBusy && parsedMeds?.length > 0 && (
          <button onClick={runDrugInteractionCheck} style={{ padding:"3px 10px",borderRadius:5,cursor:"pointer",
            fontFamily:"'JetBrains Mono',monospace",fontSize:8,fontWeight:700,
            border:"1px solid rgba(42,79,122,.4)",background:"transparent",color:"var(--qn-txt4)" }}>↻ Re-run</button>
        )}
        {!drugCheckBusy && (
          <button onClick={() => setDrugCheckDismissed(true)} style={{ padding:"3px 8px",borderRadius:5,cursor:"pointer",
            fontFamily:"'JetBrains Mono',monospace",fontSize:8,
            border:"1px solid rgba(42,79,122,.3)",background:"transparent",color:"var(--qn-txt4)" }}>✕</button>
        )}
      </div>
      {!drugCheckBusy && !drugInteractions?.clean && (
        <div style={{ padding:"10px 14px",display:"flex",flexDirection:"column",gap:8 }}>
          {drugInteractions?.interactions?.map((item,i) => (
            <div key={`int-${i}`} style={{ padding:"9px 12px",borderRadius:8,
              background:item.severity==="major"?"rgba(255,107,107,.08)":"rgba(245,200,66,.06)",
              border:`1px solid ${item.severity==="major"?"rgba(255,107,107,.3)":"rgba(245,200,66,.25)"}` }}>
              <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:5 }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:7,fontWeight:700,
                  letterSpacing:1,textTransform:"uppercase",borderRadius:4,padding:"2px 7px",
                  color:item.severity==="major"?"var(--qn-coral)":"var(--qn-gold)",
                  background:item.severity==="major"?"rgba(255,107,107,.15)":"rgba(245,200,66,.12)",
                  border:`1px solid ${item.severity==="major"?"rgba(255,107,107,.4)":"rgba(245,200,66,.3)"}` }}>
                  {item.severity?.toUpperCase()||"INTERACTION"}
                </span>
                <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"var(--qn-txt)",fontWeight:700 }}>
                  {item.drugs_involved}
                </span>
              </div>
              <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"var(--qn-txt2)",lineHeight:1.6,marginBottom:5 }}>
                {item.interaction}
              </div>
              <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"var(--qn-teal)",fontWeight:600 }}>
                → {item.recommendation}
              </div>
            </div>
          ))}
          {drugInteractions?.contraindications?.map((item,i) => (
            <div key={`ci-${i}`} style={{ padding:"9px 12px",borderRadius:8,
              background:"rgba(155,109,255,.07)",border:"1px solid rgba(155,109,255,.3)" }}>
              <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:5 }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:7,fontWeight:700,
                  color:"var(--qn-purple)",background:"rgba(155,109,255,.12)",
                  border:"1px solid rgba(155,109,255,.3)",borderRadius:4,padding:"2px 7px",
                  letterSpacing:1,textTransform:"uppercase" }}>CONTRAINDICATION</span>
                <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"var(--qn-txt)",fontWeight:700 }}>
                  {item.drug}
                </span>
              </div>
              <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"var(--qn-txt2)",lineHeight:1.6,marginBottom:5 }}>
                {item.reason}
              </div>
              <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"var(--qn-teal)",fontWeight:600 }}>
                → {item.recommendation}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}