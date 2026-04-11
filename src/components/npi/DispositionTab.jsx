import { useState } from "react";
import { DISPOSITION_OPTS } from "@/components/npi/npiData";

export default function DispositionTab({ disposition, setDisposition, dispReason, setDispReason, dispTime, setDispTime, onAdvance }) {
  const [showTime, setShowTime] = useState(false);

  const selected = DISPOSITION_OPTS.find(d => d.val === disposition);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--npi-txt4)", letterSpacing:1.5, textTransform:"uppercase" }}>
        Patient Disposition
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:10 }}>
        {DISPOSITION_OPTS.map(opt => {
          const isSelected = disposition === opt.val;
          return (
            <button key={opt.val} onClick={() => setDisposition(isSelected ? "" : opt.val)}
              style={{ padding:"14px 10px", borderRadius:10, cursor:"pointer", textAlign:"center",
                fontFamily:"'DM Sans',sans-serif", transition:"all .15s",
                background: isSelected ? `${opt.color}18` : "rgba(14,37,68,0.7)",
                border: isSelected ? `2px solid ${opt.color}` : "1px solid rgba(26,53,85,0.55)",
                color: isSelected ? opt.color : "var(--npi-txt3)" }}>
              <div style={{ fontSize:22, marginBottom:6 }}>{opt.icon}</div>
              <div style={{ fontSize:12, fontWeight:600 }}>{opt.label}</div>
              <div style={{ fontSize:10, marginTop:3, opacity:.7 }}>{opt.desc}</div>
            </button>
          );
        })}
      </div>

      {disposition && (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:"var(--npi-txt4)", letterSpacing:1.5, textTransform:"uppercase" }}>
            Reason / Notes
          </div>
          <textarea value={dispReason} onChange={e => setDispReason(e.target.value)}
            placeholder={`Reason for ${selected?.label || disposition}...`} rows={3}
            style={{ background:"rgba(8,24,48,0.6)", border:"1px solid rgba(26,53,85,0.55)",
              borderRadius:7, padding:"8px 10px", color:"var(--npi-txt)",
              fontFamily:"'DM Sans',sans-serif", fontSize:13, outline:"none",
              width:"100%", resize:"none", boxSizing:"border-box" }} />

          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <button onClick={() => setShowTime(s => !s)}
              style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"var(--npi-txt4)",
                background:"none", border:"none", cursor:"pointer", padding:0 }}>
              {showTime ? "▾" : "▸"} Set departure time
            </button>
            {showTime && (
              <input type="time" value={dispTime} onChange={e => setDispTime(e.target.value)}
                style={{ background:"rgba(8,24,48,0.6)", border:"1px solid rgba(26,53,85,0.55)",
                  borderRadius:6, padding:"4px 8px", color:"var(--npi-txt)",
                  fontFamily:"'DM Sans',sans-serif", fontSize:12, outline:"none" }} />
            )}
            {dispTime && <span style={{ fontSize:11, color:"var(--npi-teal)", fontFamily:"'JetBrains Mono',monospace" }}>Departure: {dispTime}</span>}
          </div>
        </div>
      )}

      {onAdvance && (
        <div style={{ display:"flex", justifyContent:"flex-end", marginTop:8 }}>
          <button onClick={onAdvance}
            style={{ padding:"9px 22px", borderRadius:9, background:"linear-gradient(135deg,#00e5c0,#00b4d8)",
              border:"none", color:"#050f1e", fontFamily:"'DM Sans',sans-serif",
              fontWeight:700, fontSize:13, cursor:"pointer" }}>
            Continue to Handoff &#9654;
          </button>
        </div>
      )}
    </div>
  );
}