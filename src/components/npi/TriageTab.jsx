import { ESI_CFG } from "@/components/npi/npiData";

export default function TriageTab({ esiLevel, setEsiLevel, triage, setTriage, avpu, setAvpu, pain, setPain, onAdvance }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

      <div>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--npi-txt4)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:10 }}>
          ESI Level — Emergency Severity Index
        </div>
        <div style={{ display:"flex", gap:8 }}>
          {ESI_CFG.map(({ level, label, color, desc }) => {
            const active = esiLevel === String(level);
            return (
              <button key={level} onClick={() => setEsiLevel(String(level))}
                style={{ flex:1, padding:"12px 6px", borderRadius:10, cursor:"pointer", transition:"all .14s",
                  border:`2px solid ${active ? color : "rgba(42,77,114,0.4)"}`,
                  background: active ? `${color}18` : "rgba(14,37,68,0.5)" }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:24, fontWeight:700, color: active ? color : "var(--npi-txt3)" }}>{level}</div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600, marginTop:2, color: active ? color : "var(--npi-txt3)" }}>{label}</div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:"var(--npi-txt4)", marginTop:3 }}>{desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--npi-txt4)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:8 }}>
          Triage Assessment Note
        </div>
        <textarea value={triage} onChange={e => setTriage(e.target.value)} rows={4}
          placeholder="Document presenting complaint, initial appearance, chief concern..."
          style={{ width:"100%", background:"rgba(14,37,68,0.8)",
            border:"1px solid rgba(26,53,85,0.55)", borderTop:"2px solid rgba(0,229,192,0.3)",
            borderRadius:9, padding:"9px 12px", color:"var(--npi-txt)",
            fontFamily:"'DM Sans',sans-serif", fontSize:13, outline:"none",
            resize:"none", boxSizing:"border-box" }} />
      </div>

      <div>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--npi-txt4)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:8 }}>
          Mental Status — AVPU
        </div>
        <div style={{ display:"flex", gap:8 }}>
          {["Alert","Verbal","Pain","Unresponsive"].map(v => {
            const active = avpu === v;
            return (
              <button key={v} onClick={() => setAvpu(v)}
                style={{ flex:1, padding:"9px 4px", borderRadius:8, cursor:"pointer",
                  border:`1px solid ${active ? "rgba(59,158,255,0.5)" : "rgba(42,77,114,0.4)"}`,
                  background: active ? "rgba(59,158,255,0.1)" : "transparent",
                  color: active ? "#3b9eff" : "var(--npi-txt3)",
                  fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight: active ? 600 : 400 }}>
                {v}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--npi-txt4)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:8 }}>
          Pain Score (0\u201310)
        </div>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {Array.from({ length:11 }, (_, i) => i).map(i => {
            const col   = i <= 3 ? "#00e5c0" : i <= 6 ? "#f5c842" : "#ff6b6b";
            const active = pain === String(i);
            return (
              <button key={i} onClick={() => setPain(String(i))}
                style={{ width:38, height:38, borderRadius:8, cursor:"pointer",
                  border:`1px solid ${active ? col+"88" : "rgba(42,77,114,0.35)"}`,
                  background: active ? col+"18" : "transparent",
                  color: active ? col : "var(--npi-txt3)",
                  fontFamily:"'JetBrains Mono',monospace", fontSize:13, fontWeight: active ? 700 : 400 }}>
                {i}
              </button>
            );
          })}
        </div>
      </div>

      {(esiLevel || triage || avpu) && (
        <div style={{ padding:"10px 14px", borderRadius:9,
          background:"rgba(0,229,192,0.05)", border:"1px solid rgba(0,229,192,0.2)",
          fontFamily:"'DM Sans',sans-serif", fontSize:12, display:"flex", gap:12, flexWrap:"wrap" }}>
          {esiLevel && <span><span style={{ color:"var(--npi-teal)", fontWeight:700 }}>ESI {esiLevel}</span></span>}
          {avpu     && <span style={{ color:"var(--npi-txt3)" }}>AVPU: {avpu}</span>}
          {pain     && <span style={{ color:"var(--npi-txt3)" }}>Pain: {pain}/10</span>}
        </div>
      )}

      {onAdvance && (
        <div style={{ display:"flex", justifyContent:"flex-end", marginTop:8 }}>
          <button onClick={onAdvance}
            style={{ padding:"9px 22px", borderRadius:9, background:"linear-gradient(135deg,#00e5c0,#00b4d8)",
              border:"none", color:"#050f1e", fontFamily:"'DM Sans',sans-serif", fontWeight:700,
              fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
            Continue to Demographics &#9654;
          </button>
        </div>
      )}
    </div>
  );
}