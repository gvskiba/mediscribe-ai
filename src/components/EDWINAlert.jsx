// EDWINAlert.jsx
// Compact alert chip / banner that communicates the current EDWIN crowding score
// to clinical staff. Designed to match the HuddleBoard design system.
//
// Props:
//   score          number | null  — pre-computed EDWIN score (pass null to hide)
//   attendingCount number         — used only if score is not provided (auto-compute)
//   totalBays      number         — used only if score is not provided (auto-compute)
//   patients       array          — used only if score is not provided (auto-compute)
//   variant        "chip"|"card"  — "chip" (default) = inline badge; "card" = full stat card
//   onClick        func           — optional click handler (e.g. open config)
//   className      string         — optional extra class

import { useMemo } from "react";

// ── Design tokens (mirror HuddleBoard) ───────────────────────────────────────
const T = {
  bg:"#050f1e", card:"#0b1e36", up:"#0e2544",
  bd:"rgba(26,53,85,0.8)", txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", orange:"#ff9f43",
};

// ── EDWIN computation (mirrors HuddleBoard) ──────────────────────────────────
function computeEDWIN(patients = [], attendingCount = 3, totalBays = 20) {
  const roomed   = patients.filter(p => p.status === "roomed");
  const boarders = patients.filter(p => p.status === "boarded").length;
  const avail    = totalBays - boarders;
  if (!attendingCount || avail <= 0) return null;
  const numerator = roomed.reduce((s, p) => s + (p.esiLevel || 3), 0);
  return Math.round((numerator / (attendingCount * avail)) * 10) / 10;
}

function edwinColor(score) {
  if (score === null) return T.txt4;
  if (score >= 6)    return T.coral;
  if (score >= 4)    return T.orange;
  if (score >= 2)    return T.gold;
  return T.teal;
}

function edwinLabel(score) {
  if (score === null) return "N/A";
  if (score >= 6)    return "Severe";
  if (score >= 4)    return "Overcrowded";
  if (score >= 2)    return "Busy";
  return "Not Busy";
}

function edwinIcon(score) {
  if (score === null) return "—";
  if (score >= 6)    return "🚨";
  if (score >= 4)    return "⚠️";
  if (score >= 2)    return "📈";
  return "✓";
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function EDWINAlert({
  score: scoreProp = null,
  attendingCount = 3,
  totalBays = 20,
  patients = [],
  variant = "chip",
  onClick,
  className,
}) {
  const score = useMemo(
    () => scoreProp !== null ? scoreProp : computeEDWIN(patients, attendingCount, totalBays),
    [scoreProp, patients, attendingCount, totalBays]
  );

  if (score === null) return null;

  const color = edwinColor(score);
  const label = edwinLabel(score);
  const icon  = edwinIcon(score);

  // ── Chip variant — inline badge ─────────────────────────────────────────────
  if (variant === "chip") {
    return (
      <div
        className={className}
        onClick={onClick}
        title={`EDWIN Crowding Index: ${score} — ${label}. Formula: Σ(patients × ESI) / (attendings × available bays)`}
        style={{
          display:"inline-flex", alignItems:"center", gap:6,
          padding:"4px 10px", borderRadius:7, cursor: onClick ? "pointer" : "default",
          background:`${color}12`, border:`1px solid ${color}44`,
          fontFamily:"'JetBrains Mono',monospace", userSelect:"none",
          transition:"all .15s",
        }}
      >
        <span style={{ fontSize:12, lineHeight:1 }}>{icon}</span>
        <span style={{ fontSize:11, fontWeight:700, color, letterSpacing:"0.3px" }}>
          EDWIN {score}
        </span>
        <span style={{
          fontSize:9, color, background:`${color}20`,
          border:`1px solid ${color}30`, borderRadius:4, padding:"1px 6px",
          letterSpacing:"0.8px", textTransform:"uppercase",
        }}>
          {label}
        </span>
      </div>
    );
  }

  // ── Card variant — full stat card ───────────────────────────────────────────
  return (
    <div
      className={className}
      onClick={onClick}
      title="EDWIN Crowding Index — click to configure"
      style={{
        padding:"12px 16px", borderRadius:10,
        background: T.card,
        border:`1px solid ${color}28`, borderTop:`2px solid ${color}66`,
        minWidth:100, cursor: onClick ? "pointer" : "default",
        transition:"background .15s",
      }}
    >
      {/* Score */}
      <div style={{
        display:"flex", alignItems:"baseline", gap:6, marginBottom:2,
      }}>
        <span style={{
          fontFamily:"'Playfair Display',serif", fontSize:26,
          fontWeight:900, color, lineHeight:1,
        }}>
          {score}
        </span>
        <span style={{ fontSize:14, lineHeight:1 }}>{icon}</span>
      </div>

      {/* Label row */}
      <div style={{
        fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.txt4,
        letterSpacing:"1.2px", textTransform:"uppercase", marginBottom:2,
      }}>
        EDWIN
      </div>
      <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color, fontWeight:600 }}>
        {label}
      </div>

      {/* Threshold guide */}
      <div style={{
        marginTop:8, display:"flex", flexDirection:"column", gap:3,
      }}>
        {[
          { range:"< 2",  lbl:"Not Busy",   col:T.teal   },
          { range:"2–4",  lbl:"Busy",        col:T.gold   },
          { range:"4–6",  lbl:"Overcrowded", col:T.orange },
          { range:"≥ 6",  lbl:"Severe",      col:T.coral  },
        ].map(({ range, lbl, col }) => (
          <div key={range} style={{ display:"flex", alignItems:"center", gap:5 }}>
            <div style={{
              width:6, height:6, borderRadius:3, flexShrink:0,
              background: color === col ? col : `${col}50`,
            }} />
            <span style={{
              fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color: color === col ? col : T.txt4, letterSpacing:"0.3px",
            }}>
              {range} — {lbl}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}