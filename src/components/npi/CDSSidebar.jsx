// CDSSidebar.jsx — Clinical Decision Support sidebar for NPI encounter
// Uses the existing runCDSRules engine from lib/cdsRules.js.
//
// Behavior:
//   - Runs all CDS rules on every prop change (memoized)
//   - Groups alerts by severity: critical → warning → info
//   - Critical alerts are always visible and non-dismissable
//   - Warning + info alerts are individually dismissable per session
//   - Collapsible to a narrow icon strip to save horizontal space
//   - Badge on collapsed state shows critical count
//
// Props:
//   medications  array   — med list from encounter
//   allergies    array   — allergy list
//   vitals       object  — { bp, hr, rr, spo2, temp, gcs }
//   pmhSelected  object  — { conditionKey: bool }
//   age          string  — patient age
//   cc           object  — { text: string }
//
// Wiring in NewPatientInput.jsx:
//   import CDSSidebar from "@/components/npi/CDSSidebar";
//   <CDSSidebar medications={medications} allergies={allergies}
//     vitals={vitals} pmhSelected={pmhSelected}
//     age={demo?.age} cc={cc} />
//
// Constraints: no form, no localStorage, no router, straight quotes only,
//   single react import, border before borderTop/etc.

import { useMemo, useState } from "react";
import { runCDSRules } from "@/lib/cdsRules";

const T = {
  bg:"#050f1e", panel:"#081628",
  txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", blue:"#3b9eff",
  orange:"#ff9f43", purple:"#9b6dff", green:"#3dffa0",
};

const SEV_CONFIG = {
  critical: { color:T.coral,  bg:"rgba(255,107,107,0.07)", bd:"rgba(255,107,107,0.28)", label:"Critical", icon:"🔴", dismissable:false },
  warning:  { color:T.orange, bg:"rgba(255,159,67,0.07)",  bd:"rgba(255,159,67,0.25)",  label:"Warning",  icon:"🟡", dismissable:true  },
  info:     { color:T.blue,   bg:"rgba(59,158,255,0.06)",  bd:"rgba(59,158,255,0.2)",   label:"Info",     icon:"ℹ️", dismissable:true  },
};

function AlertCard({ alert, onDismiss }) {
  const cfg = SEV_CONFIG[alert.severity] || SEV_CONFIG.info;
  return (
    <div style={{ margin:"3px 8px", padding:"9px 10px", borderRadius:8,
      background:cfg.bg,
      border:`1px solid ${cfg.bd}`,
      borderLeft:`3px solid ${cfg.color}` }}>
      <div style={{ display:"flex", alignItems:"flex-start",
        gap:6, marginBottom:cfg.dismissable ? 4 : 5 }}>
        <span style={{ fontSize:10, flexShrink:0, lineHeight:1.3 }}>{cfg.icon}</span>
        <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
          fontWeight:700, color:cfg.color, lineHeight:1.3, flex:1 }}>
          {alert.title}
        </span>
        {cfg.dismissable && onDismiss && (
          <button onClick={() => onDismiss(alert.id)}
            style={{ background:"none", border:"none", color:T.txt4,
              fontSize:9, cursor:"pointer", padding:0, flexShrink:0, lineHeight:1 }}>
            ✕
          </button>
        )}
      </div>
      <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9.5,
        color:T.txt3, lineHeight:1.55, paddingLeft:16 }}>
        {alert.detail}
      </div>
      {alert.category && (
        <div style={{ marginTop:4, paddingLeft:16,
          fontFamily:"'JetBrains Mono',monospace", fontSize:7,
          color:cfg.color, opacity:.6, letterSpacing:.8,
          textTransform:"uppercase" }}>
          {alert.category}
        </div>
      )}
    </div>
  );
}

export default function CDSSidebar({
  medications, allergies, vitals, pmhSelected, age, cc,
}) {
  const [dismissed, setDismissed] = useState(new Set());
  const [collapsed, setCollapsed] = useState(false);

  const allAlerts = useMemo(() => runCDSRules({
    medications: medications || [],
    allergies:   allergies   || [],
    vitals:      vitals      || {},
    pmhSelected: pmhSelected || {},
    age:         age         || "",
    cc:          cc?.text    || "",
  }), [medications, allergies, vitals, pmhSelected, age, cc]);

  const visible  = allAlerts.filter(a => !dismissed.has(a.id));
  const critical = visible.filter(a => a.severity === "critical");
  const warning  = visible.filter(a => a.severity === "warning");
  const info     = visible.filter(a => a.severity === "info");

  const dismiss = (id) => setDismissed(prev => new Set([...prev, id]));

  // ── Collapsed state ────────────────────────────────────────────────────────
  if (collapsed) {
    return (
      <aside style={{ width:32, flexShrink:0,
        display:"flex", flexDirection:"column", alignItems:"center",
        borderLeft:"1px solid rgba(26,53,85,0.5)",
        background:"rgba(5,10,22,0.6)",
        paddingTop:10, gap:8 }}>
        <button onClick={() => setCollapsed(false)}
          title="Expand CDS alerts"
          style={{ background:"none", border:"none",
            cursor:"pointer", display:"flex", flexDirection:"column",
            alignItems:"center", gap:5, padding:"4px 0" }}>
          {critical.length > 0 && (
            <div style={{ width:16, height:16, borderRadius:"50%",
              background:T.coral, display:"flex", alignItems:"center",
              justifyContent:"center",
              boxShadow:`0 0 6px ${T.coral}88`,
              fontFamily:"'JetBrains Mono',monospace",
              fontSize:8, fontWeight:900, color:"#050f1e" }}>
              {critical.length}
            </div>
          )}
          {warning.length > 0 && critical.length === 0 && (
            <div style={{ width:16, height:16, borderRadius:"50%",
              background:T.orange, display:"flex", alignItems:"center",
              justifyContent:"center",
              fontFamily:"'JetBrains Mono',monospace",
              fontSize:8, fontWeight:900, color:"#050f1e" }}>
              {warning.length}
            </div>
          )}
          <span style={{ fontSize:10, writingMode:"vertical-rl",
            color:T.txt4, fontFamily:"'JetBrains Mono',monospace",
            letterSpacing:1.5, fontSize:7, textTransform:"uppercase" }}>
            CDS
          </span>
          <span style={{ fontSize:9, color:T.txt4 }}>◂</span>
        </button>
      </aside>
    );
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  if (visible.length === 0) {
    return (
      <aside style={{ width:210, flexShrink:0,
        display:"flex", flexDirection:"column",
        borderLeft:"1px solid rgba(26,53,85,0.5)",
        background:"rgba(5,10,22,0.6)" }}>
        <div style={{ display:"flex", alignItems:"center",
          justifyContent:"space-between", gap:6,
          padding:"8px 10px",
          borderBottom:"1px solid rgba(26,53,85,0.4)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <div style={{ width:6, height:6, borderRadius:"50%",
              background:T.teal,
              boxShadow:`0 0 5px ${T.teal}77` }} />
            <span style={{ fontFamily:"'JetBrains Mono',monospace",
              fontSize:8, color:T.teal, letterSpacing:1.5,
              textTransform:"uppercase" }}>CDS</span>
          </div>
          <button onClick={() => setCollapsed(true)}
            style={{ background:"none", border:"none", color:T.txt4,
              fontSize:10, cursor:"pointer", padding:0 }}>▸</button>
        </div>
        <div style={{ flex:1, display:"flex", alignItems:"center",
          justifyContent:"center", padding:16 }}>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:20, marginBottom:6 }}>✓</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
              color:T.teal, lineHeight:1.5 }}>
              No active alerts
            </div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9,
              color:T.txt4, marginTop:3, lineHeight:1.5 }}>
              CDS is monitoring vitals, medications, and allergies
            </div>
          </div>
        </div>
      </aside>
    );
  }

  // ── Full sidebar ───────────────────────────────────────────────────────────
  return (
    <aside style={{ width:220, flexShrink:0,
      display:"flex", flexDirection:"column",
      borderLeft:"1px solid rgba(26,53,85,0.5)",
      background:"rgba(5,10,22,0.6)",
      overflow:"hidden" }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center",
        justifyContent:"space-between", gap:6,
        padding:"8px 10px", flexShrink:0,
        borderBottom:"1px solid rgba(26,53,85,0.4)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          {critical.length > 0 && (
            <div style={{ width:7, height:7, borderRadius:"50%",
              background:T.coral, flexShrink:0,
              animation:"cds-pulse 2s ease-in-out infinite",
              boxShadow:`0 0 6px ${T.coral}88` }} />
          )}
          {critical.length === 0 && warning.length > 0 && (
            <div style={{ width:7, height:7, borderRadius:"50%",
              background:T.orange, flexShrink:0 }} />
          )}
          {critical.length === 0 && warning.length === 0 && (
            <div style={{ width:7, height:7, borderRadius:"50%",
              background:T.blue, flexShrink:0 }} />
          )}
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, textTransform:"uppercase", letterSpacing:1.5 }}>
            CDS
          </span>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color: critical.length > 0 ? T.coral
              : warning.length > 0 ? T.orange : T.txt4,
            fontWeight:700 }}>
            · {visible.length}
          </span>
          {critical.length > 0 && (
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              fontWeight:900, color:T.coral }}>
              {critical.length}!
            </span>
          )}
        </div>
        <button onClick={() => setCollapsed(true)}
          title="Collapse sidebar"
          style={{ background:"none", border:"none", color:T.txt4,
            fontSize:10, cursor:"pointer", padding:0, lineHeight:1 }}>
          ▸
        </button>
      </div>

      <style>{`
        @keyframes cds-pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(255,107,107,0.4); }
          50%      { box-shadow: 0 0 0 5px rgba(255,107,107,0); }
        }
      `}</style>

      {/* Alert list */}
      <div style={{ flex:1, overflowY:"auto", padding:"6px 0",
        scrollbarWidth:"none" }}>

        {[
          { list:critical, key:"critical" },
          { list:warning,  key:"warning"  },
          { list:info,     key:"info"     },
        ].map(({ list, key }) => {
          if (!list.length) return null;
          const cfg = SEV_CONFIG[key];
          return (
            <div key={key}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace",
                fontSize:7, color:cfg.color, textTransform:"uppercase",
                letterSpacing:1.5, padding:"6px 10px 3px", opacity:.8 }}>
                {cfg.label} · {list.length}
              </div>
              {list.map(alert => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onDismiss={cfg.dismissable ? dismiss : null}
                />
              ))}
            </div>
          );
        })}

        {/* Dismissed footer */}
        {dismissed.size > 0 && (
          <div style={{ padding:"8px 10px",
            borderTop:"1px solid rgba(26,53,85,0.35)",
            marginTop:6 }}>
            <button onClick={() => setDismissed(new Set())}
              style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
                color:T.txt4, letterSpacing:1, textTransform:"uppercase",
                background:"none", border:"none", cursor:"pointer",
                padding:0 }}>
              ↺ Restore {dismissed.size} dismissed
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}