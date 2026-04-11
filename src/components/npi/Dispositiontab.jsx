import { DISPOSITION_OPTS } from "@/components/npi/npiData";

export default function DispositionTab({ disposition, setDisposition, dispReason, setDispReason, dispTime, setDispTime, onAdvance }) {
  const sel = DISPOSITION_OPTS.find(o => o.val === disposition);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

      <div>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--npi-txt4)",
          letterSpacing:1.5, textTransform:"uppercase", marginBottom:10 }}>
          Disposition Decision — Required Before Sign &amp; Save
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
          {DISPOSITION_OPTS.map(({ val, icon, label, color, desc }) => {
            const active = disposition === val;
            return (
              <button key={val} onClick={() => setDisposition(active ? "" : val)}
                style={{ padding:"12px 8px", borderRadius:10, cursor:"pointer", textAlign:"center",
                  border:`2px solid ${active ? color : "rgba(42,77,114,0.4)"}`,
                  background: active ? `${color}18` : "rgba(14,37,68,0.5)",
                  transition:"all .14s" }}>
                <div style={{ fontSize:22, marginBottom:4 }}>{icon}</div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600,
                  color: active ? color : "var(--npi-txt3)" }}>{label}</div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
                  color:"var(--npi-txt4)", marginTop:2 }}>{desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {disposition && (
        <>
          <div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--npi-txt4)",
              letterSpacing:1.5, textTransform:"uppercase", marginBottom:8 }}>
              Disposition Reason / Instructions
            </div>
            <textarea value={dispReason} onChange={e => setDispReason(e.target.value)} rows={3}
              placeholder={`Document reason for ${disposition}, follow-up plan, return precautions...`}
              style={{ width:"100%", background:"rgba(14,37,68,0.8)",
                border:"1px solid rgba(26,53,85,0.55)", borderTop:"2px solid rgba(0,229,192,0.3)",
                borderRadius:9, padding:"9px 12px", color:"var(--npi-txt)",
                fontFamily:"'DM Sans',sans-serif", fontSize:13, outline:"none",
                resize:"none", boxSizing:"border-box" }} />
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
            <div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--npi-txt4)",
                letterSpacing:1.5, textTransform:"uppercase", marginBottom:6 }}>Departure Time</div>
              <input type="time" value={dispTime} onChange={e => setDispTime(e.target.value)}
                style={{ background:"rgba(14,37,68,0.8)", border:"1px solid rgba(26,53,85,0.55)",
                  borderRadius:8, padding:"7px 10px", color:"var(--npi-txt)",
                  fontFamily:"'JetBrains Mono',monospace", fontSize:13, outline:"none" }} />
            </div>
            <div style={{ flex:1, padding:"10px 14px", borderRadius:9,
              background:"rgba(0,229,192,0.05)", border:"1px solid rgba(0,229,192,0.2)",
              fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"var(--npi-teal)",
              display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:18 }}>{sel?.icon}</span>
              <span><strong>{sel?.label}</strong>{dispTime ? ` \u2014 ${dispTime}` : ""}</span>
            </div>
          </div>
        </>
      )}

      {onAdvance && (
        <div style={{ display:"flex", justifyContent:"flex-end", marginTop:8 }}>
          <button onClick={onAdvance}
            style={{ padding:"9px 22px", borderRadius:9, background:"linear-gradient(135deg,#00e5c0,#00b4d8)",
              border:"none", color:"#050f1e", fontFamily:"'DM Sans',sans-serif", fontWeight:700,
              fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
            Proceed to Discharge &#9654;
          </button>
        </div>
      )}
    </div>
  );
}