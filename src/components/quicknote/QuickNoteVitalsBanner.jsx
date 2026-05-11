// Vitals interpretation banner — Feature #1
export default function QuickNoteVitalsBanner({ flags }) {
  if (!flags?.length) return null;
  return (
    <div style={{ marginBottom:10,borderRadius:10,overflow:"hidden",background:"rgba(8,22,40,.6)",
      border:"1px solid rgba(255,107,107,.3)" }}>
      <div style={{ display:"flex",alignItems:"center",gap:8,padding:"7px 14px",
        background:"rgba(255,107,107,.08)",borderBottom:"1px solid rgba(255,107,107,.2)" }}>
        <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:8,fontWeight:700,
          color:"var(--qn-coral)",letterSpacing:1.5,textTransform:"uppercase" }}>⚡ Vitals Interpretation</span>
        <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:7,color:"rgba(255,107,107,.5)" }}>
          sync · no AI · triage vitals
        </span>
      </div>
      <div style={{ padding:"8px 14px",display:"flex",flexDirection:"column",gap:6 }}>
        {flags.map((flag,i) => (
          <div key={i} style={{ display:"flex",alignItems:"flex-start",gap:10,padding:"7px 10px",borderRadius:7,
            background:flag.level==="critical"?"rgba(255,107,107,.08)":"rgba(245,200,66,.06)",
            border:`1px solid ${flag.level==="critical"?"rgba(255,107,107,.3)":"rgba(245,200,66,.25)"}` }}>
            <div style={{ width:8,height:8,borderRadius:"50%",flexShrink:0,marginTop:3,
              background:flag.level==="critical"?"var(--qn-coral)":"var(--qn-gold)",
              boxShadow:flag.level==="critical"?"0 0 6px rgba(255,107,107,.5)":"0 0 6px rgba(245,200,66,.4)" }} />
            <div style={{ flex:1 }}>
              <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:700,marginRight:8,
                color:flag.level==="critical"?"var(--qn-coral)":"var(--qn-gold)" }}>{flag.label}</span>
              <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"var(--qn-txt3)",lineHeight:1.5 }}>
                {flag.detail}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}