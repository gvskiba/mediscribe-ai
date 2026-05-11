// QuickNoteHPIScaffold — collapsible HPI scaffold panel
export default function QuickNoteHPIScaffold({ scaffold, hpi, setHpi, open, setOpen }) {
  if (!scaffold || hpi.trim() === scaffold.text.trim()) return null;
  return (
    <div style={{marginBottom:10,background:"rgba(59,158,255,.04)",border:"1px solid rgba(59,158,255,.2)",borderRadius:12,overflow:"hidden"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
        padding:"7px 14px",borderBottom:open?"1px solid rgba(59,158,255,.15)":"none",cursor:"pointer"}}
        onClick={()=>setOpen(p=>!p)}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:700,color:"var(--qn-blue)",letterSpacing:1.5,textTransform:"uppercase"}}>
            💡 HPI Scaffold — {scaffold.cc}
          </span>
          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,
            color:hpi.trim()?"var(--qn-gold)":"var(--qn-txt4)",
            background:hpi.trim()?"rgba(245,200,66,.1)":"rgba(59,158,255,.1)",
            border:`1px solid ${hpi.trim()?"rgba(245,200,66,.25)":"rgba(59,158,255,.2)"}`,
            borderRadius:4,padding:"1px 6px"}}>
            {hpi.trim()?"Compare / Reload":"Click to expand"}
          </span>
        </div>
        <span style={{color:"var(--qn-txt4)",fontSize:11}}>{open?"▲":"▼"}</span>
      </div>
      {open&&(
        <div style={{padding:"10px 14px"}}>
          <pre style={{margin:"0 0 10px",fontFamily:"'DM Sans',sans-serif",fontSize:11,
            color:"var(--qn-txt2)",lineHeight:1.75,background:"rgba(59,158,255,.04)",
            borderRadius:8,padding:"10px 14px",border:"1px solid rgba(59,158,255,.12)",
            whiteSpace:"pre-wrap",wordBreak:"break-word"}}>
            {scaffold.text}
          </pre>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <button onClick={()=>{setHpi(scaffold.text);setOpen(false);}}
              style={{padding:"5px 14px",borderRadius:7,cursor:"pointer",
                border:"1px solid rgba(59,158,255,.45)",background:"rgba(59,158,255,.1)",
                color:"var(--qn-blue)",fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:700}}>
              {hpi.trim()?"↩ Replace HPI with scaffold":"↓ Insert into HPI"}
            </button>
            {hpi.trim()&&(
              <button onClick={()=>{setHpi(prev=>scaffold.text+"\n\n"+prev);setOpen(false);}}
                style={{padding:"5px 14px",borderRadius:7,cursor:"pointer",
                  border:"1px solid rgba(245,200,66,.4)",background:"rgba(245,200,66,.07)",
                  color:"var(--qn-gold)",fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:700}}>
                ↑ Prepend scaffold
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}