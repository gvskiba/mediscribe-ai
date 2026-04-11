import { useState } from "react";
import { ROS_RAIL_SYSTEMS, PE_RAIL_SYSTEMS } from "@/components/npi/npiData";

export default function TemplateSuggestionsBar({ template, mode, onDismiss, onJumpToSystem }) {
  const [showHints, setShowHints] = useState(false);
  const systems     = mode === "ros" ? ROS_RAIL_SYSTEMS : PE_RAIL_SYSTEMS;
  const priorityIds = mode === "ros" ? template.rosPriority : template.pePriority;
  const hints       = mode === "ros" ? template.rosHints : template.peHints;
  const col         = template.color;

  const prioritySystems = priorityIds.map(id => systems.find(s => s.id === id)).filter(Boolean);
  const hintIds         = priorityIds.filter(id => hints?.[id]);

  const btnBase = {
    fontFamily:"'JetBrains Mono',monospace", fontSize:9, letterSpacing:1,
    textTransform:"uppercase", padding:"3px 9px", borderRadius:5,
    cursor:"pointer", transition:"all .12s",
  };

  return (
    <div style={{ padding:"9px 16px 11px",
      borderBottom:"1px solid rgba(26,53,85,0.5)",
      borderLeft:`3px solid ${col}`,
      background:"rgba(5,12,26,0.75)", flexShrink:0 }}>

      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
          <span style={{ fontSize:13 }}>{template.icon}</span>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
            letterSpacing:1.5, textTransform:"uppercase", color:col }}>
            Template applied
          </span>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
            color:"var(--npi-txt)", fontWeight:600 }}>
            {template.label}
          </span>
          {template.riskScore && (
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
              padding:"2px 7px", borderRadius:4,
              border:`1px solid ${col}44`, background:`${col}10`, color:col }}>
              {template.riskScore}
            </span>
          )}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
          {hintIds.length > 0 && (
            <button onClick={() => setShowHints(h => !h)}
              style={{ ...btnBase,
                border:`1px solid ${showHints ? col+"66" : "rgba(42,77,114,0.4)"}`,
                background: showHints ? `${col}15` : "transparent",
                color: showHints ? col : "var(--npi-txt4)" }}>
              {showHints ? "Hide hints" : "Show hints"}
            </button>
          )}
          <button onClick={onDismiss}
            style={{ ...btnBase, border:"1px solid rgba(42,77,114,0.4)",
              background:"transparent", color:"var(--npi-txt4)" }}>
            Dismiss
          </button>
        </div>
      </div>

      <div style={{ display:"flex", gap:6, marginTop:8, flexWrap:"wrap" }}>
        {prioritySystems.map((sys, i) => {
          const isPrimary = i === 0;
          return (
            <button key={sys.id}
              onClick={() => onJumpToSystem(systems.findIndex(s => s.id === sys.id))}
              style={{ display:"flex", alignItems:"center", gap:5,
                padding: isPrimary ? "5px 11px" : "4px 10px",
                borderRadius:20, cursor:"pointer", border:"none", outline:"none",
                background: isPrimary ? `${col}22` : "rgba(14,37,68,0.8)",
                boxShadow: isPrimary ? `0 0 0 1px ${col}55` : "0 0 0 1px rgba(42,77,114,0.35)",
                transition:"all .13s" }}>
              <span style={{ fontSize:11 }}>{sys.icon}</span>
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                fontWeight: isPrimary ? 700 : 500,
                color: isPrimary ? col : "var(--npi-txt3)" }}>
                {sys.label}
              </span>
              {isPrimary && (
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
                  color:col, letterSpacing:1, textTransform:"uppercase" }}>primary</span>
              )}
            </button>
          );
        })}
      </div>

      {showHints && hintIds.length > 0 && (
        <div style={{ marginTop:10, display:"grid",
          gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:7 }}>
          {hintIds.slice(0, 4).map(id => {
            const sys  = systems.find(s => s.id === id);
            const hint = hints[id];
            if (!sys || !hint) return null;
            const isRos = typeof hint === "object" && ("pos" in hint || "neg" in hint);
            return (
              <div key={id} style={{ padding:"8px 11px", borderRadius:8,
                background:"rgba(14,37,68,0.75)", border:"1px solid rgba(26,53,85,0.45)" }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                  color:col, letterSpacing:1, textTransform:"uppercase", marginBottom:6 }}>
                  {sys.icon} {sys.label}
                </div>
                {isRos ? (
                  <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                    {hint.pos && hint.pos.length > 0 && (
                      <div>
                        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                          color:"#ff8a8a", letterSpacing:1, marginBottom:4 }}>LIKELY +</div>
                        <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                          {hint.pos.map(p => (
                            <span key={p} style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
                              padding:"2px 6px", borderRadius:3,
                              background:"rgba(255,107,107,0.1)", border:"1px solid rgba(255,107,107,0.25)",
                              color:"#ff8a8a" }}>{p}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {hint.neg && hint.neg.length > 0 && (
                      <div>
                        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                          color:"var(--npi-teal)", letterSpacing:1, marginBottom:4 }}>RULE OUT</div>
                        <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                          {hint.neg.map(n => (
                            <span key={n} style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
                              padding:"2px 6px", borderRadius:3,
                              background:"rgba(0,229,192,0.07)", border:"1px solid rgba(0,229,192,0.2)",
                              color:"var(--npi-teal)" }}>{n}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                    color:"var(--npi-txt3)", lineHeight:1.5 }}>{hint}</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}