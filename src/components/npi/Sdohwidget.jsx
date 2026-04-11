import { SDOH_DOMAINS, TIER_COLORS } from "@/components/npi/npiData";

export default function SDOHWidget({ sdoh, setSdoh, onAdvance }) {
  const positiveCount = Object.values(sdoh).filter(v => v === "2").length;
  const concernCount  = Object.values(sdoh).filter(v => v === "1").length;
  const screenedCount = Object.values(sdoh).filter(Boolean).length;
  const g0136Eligible = screenedCount >= 4;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
        <div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:700, color:"var(--npi-txt)" }}>
            SDOH Screening
          </div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"var(--npi-txt4)", marginTop:2 }}>
            Social Determinants of Health — CMS Gravity Protocol
          </div>
        </div>
        {g0136Eligible && (
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, letterSpacing:1.5, textTransform:"uppercase",
            padding:"4px 10px", borderRadius:6, background:"rgba(0,229,192,0.1)",
            border:"1px solid rgba(0,229,192,0.35)", color:"var(--npi-teal)" }}>
            G0136 Billable
          </span>
        )}
      </div>

      {positiveCount > 0 && (
        <div style={{ padding:"10px 14px", borderRadius:9, background:"rgba(255,107,107,0.07)",
          border:"1px solid rgba(255,107,107,0.3)", fontFamily:"'DM Sans',sans-serif", fontSize:12,
          color:"#ff8a8a", display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:14 }}>&#x26A0;</span>
          <span><strong>{positiveCount}</strong> positive screen{positiveCount>1?"s":""} — document social risk in MDM (counts as Moderate Risk, AMA CPT 2023)</span>
        </div>
      )}

      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {SDOH_DOMAINS.map(d => (
          <div key={d.key} style={{ padding:"10px 12px", borderRadius:9,
            background:"rgba(14,37,68,0.6)",
            border:`1px solid ${sdoh[d.key]==="2"?"rgba(255,107,107,0.35)":sdoh[d.key]==="1"?"rgba(245,200,66,0.3)":"rgba(26,53,85,0.5)"}`}}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600, color:"var(--npi-txt)", display:"flex", alignItems:"center", gap:6 }}>
                {d.icon} {d.label}
              </span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--npi-txt4)" }}>{d.q}</span>
            </div>
            <div style={{ display:"flex", gap:6 }}>
              {d.opts.map((opt, i) => {
                const active = sdoh[d.key] === String(i);
                const col = TIER_COLORS[String(i)];
                return (
                  <button key={i} onClick={() => setSdoh(p => ({ ...p, [d.key]: active ? "" : String(i) }))}
                    style={{ flex:1, padding:"6px 4px", borderRadius:7, cursor:"pointer", fontSize:11,
                      fontFamily:"'DM Sans',sans-serif", fontWeight: active ? 600 : 400,
                      border:`1px solid ${active ? col+"88" : "rgba(42,77,114,0.35)"}`,
                      background: active ? col+"18" : "transparent",
                      color: active ? col : "var(--npi-txt4)", transition:"all .12s" }}>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--npi-txt4)", letterSpacing:1,
        display:"flex", gap:16, paddingTop:4 }}>
        <span>{screenedCount}/6 domains screened</span>
        {concernCount > 0  && <span style={{ color:"#f5c842" }}>{concernCount} at-risk</span>}
        {positiveCount > 0 && <span style={{ color:"#ff8a8a" }}>{positiveCount} positive</span>}
        {!g0136Eligible && screenedCount > 0 && <span>Screen {4-screenedCount} more for G0136</span>}
      </div>

      {onAdvance && (
        <div style={{ display:"flex", justifyContent:"flex-end", marginTop:8 }}>
          <button onClick={onAdvance}
            style={{ padding:"9px 22px", borderRadius:9, background:"linear-gradient(135deg,#00e5c0,#00b4d8)",
              border:"none", color:"#050f1e", fontFamily:"'DM Sans',sans-serif", fontWeight:700,
              fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
            Continue to HPI &#9654;
          </button>
        </div>
      )}
    </div>
  );
}