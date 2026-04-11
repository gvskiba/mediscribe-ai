import { SDOH_DOMAINS, TIER_COLORS } from "@/components/npi/npiData";

export default function SDOHWidget({ sdoh, setSdoh, onAdvance }) {
  const setDomain = (key, val) => setSdoh(prev => ({ ...prev, [key]: val }));
  const positivCount = Object.values(sdoh).filter(v => v === "2").length;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--npi-txt4)", letterSpacing:1.5, textTransform:"uppercase" }}>
        Social Determinants of Health Screening
      </div>

      {positivCount > 0 && (
        <div style={{ padding:"10px 14px", borderRadius:9, background:"rgba(255,107,107,0.08)", border:"1px solid rgba(255,107,107,0.3)", fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"#ff8a8a" }}>
          ⚠ {positivCount} positive SDOH screen{positivCount > 1 ? "s" : ""} — document in MDM as Moderate Risk (CMS G0136)
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:12 }}>
        {SDOH_DOMAINS.map(d => {
          const val = sdoh[d.key] || "";
          return (
            <div key={d.key} style={{ padding:"12px 14px", borderRadius:10,
              background:"rgba(14,37,68,0.7)", border:"1px solid rgba(26,53,85,0.55)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                <span style={{ fontSize:16 }}>{d.icon}</span>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, color:"var(--npi-txt)" }}>{d.label}</span>
              </div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"var(--npi-txt3)", marginBottom:10 }}>{d.q}</div>
              <div style={{ display:"flex", gap:6 }}>
                {d.opts.map((opt, i) => {
                  const tier = String(i);
                  const isSelected = val === tier;
                  const col = TIER_COLORS[tier] || "#8892a4";
                  return (
                    <button key={i} onClick={() => setDomain(d.key, isSelected ? "" : tier)}
                      style={{ flex:1, padding:"6px 4px", borderRadius:7, fontSize:10,
                        fontFamily:"'DM Sans',sans-serif", fontWeight:isSelected?700:400,
                        cursor:"pointer", textAlign:"center", lineHeight:1.3, transition:"all .15s",
                        background: isSelected ? `${col}22` : "rgba(8,24,48,0.4)",
                        border: isSelected ? `1px solid ${col}` : "1px solid rgba(26,53,85,0.4)",
                        color: isSelected ? col : "var(--npi-txt4)" }}>
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {onAdvance && (
        <div style={{ display:"flex", justifyContent:"flex-end", marginTop:8 }}>
          <button onClick={onAdvance}
            style={{ padding:"9px 22px", borderRadius:9, background:"linear-gradient(135deg,#00e5c0,#00b4d8)",
              border:"none", color:"#050f1e", fontFamily:"'DM Sans',sans-serif", fontWeight:700,
              fontSize:13, cursor:"pointer" }}>
            Continue to Patient Summary &#9654;
          </button>
        </div>
      )}
    </div>
  );
}