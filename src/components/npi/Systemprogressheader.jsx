// SystemProgressHeader.jsx — prev/next arrows + dot strip for ROS and PE tabs
export default function SystemProgressHeader({ systems, activeIdx, onSelect, getDot }) {
  const sys    = systems[activeIdx];
  const atStart = activeIdx === 0;
  const atEnd   = activeIdx === systems.length - 1;

  const btnBase = {
    display:"flex", alignItems:"center", justifyContent:"center",
    width:30, height:30, borderRadius:7, border:"none", cursor:"pointer",
    fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:14,
    transition:"all .15s", flexShrink:0,
  };

  return (
    <div style={{ flexShrink:0, borderBottom:"1px solid rgba(26,53,85,0.45)",
      background:"rgba(5,15,30,0.55)", padding:"10px 16px 8px",
      display:"flex", flexDirection:"column", gap:7 }}>

      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <button onClick={() => onSelect(activeIdx - 1)} disabled={atStart}
          style={{ ...btnBase,
            background: atStart ? "transparent" : "rgba(0,229,192,0.08)",
            color: atStart ? "rgba(42,77,114,0.4)" : "var(--npi-teal)",
            cursor: atStart ? "default" : "pointer" }}>
          &#9664;
        </button>
        <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center",
          gap:6, padding:"4px 0" }}>
          <span style={{ fontSize:16 }}>{sys.icon}</span>
          <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
            fontSize:13, color:"var(--npi-txt)" }}>{sys.label}</span>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
            color:"var(--npi-txt4)", letterSpacing:1 }}>
            {activeIdx + 1}/{systems.length}
          </span>
        </div>
        <button onClick={() => onSelect(activeIdx + 1)} disabled={atEnd}
          style={{ ...btnBase,
            background: atEnd ? "transparent" : "rgba(0,229,192,0.08)",
            color: atEnd ? "rgba(42,77,114,0.4)" : "var(--npi-teal)",
            cursor: atEnd ? "default" : "pointer" }}>
          &#9654;
        </button>
      </div>

      <div style={{ display:"flex", gap:4, justifyContent:"center", alignItems:"center" }}>
        {systems.map((s, i) => {
          const dot = getDot(s.id);
          const isActive = i === activeIdx;
          const bg = isActive
            ? "var(--npi-teal)"
            : dot === "done"    ? "rgba(0,229,192,0.45)"
            : dot === "partial" ? "rgba(245,200,66,0.6)"
            : "rgba(42,77,114,0.45)";
          return (
            <button key={s.id} onClick={() => onSelect(i)} title={s.label}
              style={{ height:7, width: isActive ? 22 : 7, borderRadius:4,
                border:"none", background:bg, cursor:"pointer", padding:0,
                transition:"all .18s ease", flexShrink:0 }} />
          );
        })}
      </div>
    </div>
  );
}