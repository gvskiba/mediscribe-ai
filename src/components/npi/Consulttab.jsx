// ConsultTab.jsx
import { useState } from "react";

export default function ConsultTab({ consults, setConsults, onAdvance }) {
  const [svcIn,  setSvcIn]  = useState("");
  const [qIn,    setQIn]    = useState("");
  const [respIn, setRespIn] = useState({});

  const elapsed = ts => {
    const m = Math.floor((Date.now() - ts) / 60000);
    return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;
  };

  function addConsult(svc, q) {
    if (!svc.trim()) return;
    setConsults(prev => [...prev, {
      id: Date.now(), service: svc.trim(), question: q.trim(),
      requestedAt: Date.now(), status: "pending", response: "",
    }]);
    setSvcIn(""); setQIn("");
  }

  function markReceived(id, resp) {
    setConsults(prev => prev.map(c => c.id === id ? { ...c, status:"completed", response:resp } : c));
    setRespIn(p => { const n = { ...p }; delete n[id]; return n; });
  }

  const inputBase = {
    background:"rgba(8,24,48,0.6)", border:"1px solid rgba(26,53,85,0.55)",
    borderRadius:7, padding:"7px 10px", color:"var(--npi-txt)",
    fontFamily:"'DM Sans',sans-serif", fontSize:13, outline:"none",
    width:"100%", boxSizing:"border-box",
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

      <div style={{ padding:"14px 16px", borderRadius:10, background:"rgba(14,37,68,0.7)",
        border:"1px solid rgba(26,53,85,0.55)", borderTop:"2px solid rgba(0,229,192,0.35)" }}>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--npi-txt4)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:12 }}>
          Request New Consult
        </div>
        <input value={svcIn} onChange={e => setSvcIn(e.target.value)}
          placeholder="Consulting service (e.g. Cardiology, Surgery, Neurology)"
          style={{ ...inputBase, marginBottom:8 }} />
        <textarea value={qIn} onChange={e => setQIn(e.target.value)}
          placeholder="Clinical question / reason for consult..." rows={2}
          style={{ ...inputBase, resize:"none", marginBottom:10 }} />
        <button onClick={() => addConsult(svcIn, qIn)}
          style={{ padding:"7px 18px", borderRadius:7, border:"1px solid rgba(0,229,192,0.4)",
            background:"rgba(0,229,192,0.1)", color:"var(--npi-teal)",
            fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600, cursor:"pointer" }}>
          + Add Consult
        </button>
      </div>

      {consults.length > 0 ? (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--npi-txt4)", letterSpacing:1.5, textTransform:"uppercase" }}>
            Active Consults ({consults.length})
          </div>
          {consults.map(c => (
            <div key={c.id} style={{ padding:"12px 14px", borderRadius:10,
              background:"rgba(14,37,68,0.7)",
              border:`1px solid ${c.status === "completed" ? "rgba(0,229,192,0.25)" : "rgba(245,200,66,0.25)"}` }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight:600, color:"var(--npi-txt)" }}>
                  {c.service}
                </span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:"var(--npi-txt4)" }}>
                  {elapsed(c.requestedAt)} ago
                </span>
              </div>
              {c.question && (
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"var(--npi-txt3)", marginBottom:8 }}>
                  {c.question}
                </div>
              )}
              {c.status === "pending" ? (
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <input value={respIn[c.id] || ""} onChange={e => setRespIn(p => ({ ...p, [c.id]:e.target.value }))}
                    placeholder="Consultant response / recommendations..."
                    style={{ flex:1, background:"rgba(8,24,48,0.6)", border:"1px solid rgba(26,53,85,0.55)",
                      borderRadius:6, padding:"5px 9px", color:"var(--npi-txt)",
                      fontFamily:"'DM Sans',sans-serif", fontSize:12, outline:"none" }} />
                  <button onClick={() => markReceived(c.id, respIn[c.id] || "")}
                    style={{ padding:"5px 12px", borderRadius:6, border:"1px solid rgba(0,229,192,0.4)",
                      background:"rgba(0,229,192,0.08)", color:"var(--npi-teal)",
                      fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600,
                      cursor:"pointer", whiteSpace:"nowrap" }}>
                    Mark Received
                  </button>
                </div>
              ) : (
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ color:"var(--npi-teal)", fontSize:11 }}>\u2713 Received</span>
                  {c.response && (
                    <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"var(--npi-txt3)" }}>
                      {c.response}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign:"center", color:"var(--npi-txt4)", fontFamily:"'DM Sans',sans-serif", fontSize:13, padding:"28px 0" }}>
          No consults requested yet
        </div>
      )}

      {onAdvance && (
        <div style={{ display:"flex", justifyContent:"flex-end", marginTop:8 }}>
          <button onClick={onAdvance}
            style={{ padding:"9px 22px", borderRadius:9, background:"linear-gradient(135deg,#00e5c0,#00b4d8)",
              border:"none", color:"#050f1e", fontFamily:"'DM Sans',sans-serif", fontWeight:700,
              fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
            Continue to Clinical Note &#9654;
          </button>
        </div>
      )}
    </div>
  );
}