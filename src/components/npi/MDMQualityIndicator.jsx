// MDMQualityIndicator.jsx
// Real-time MDM documentation quality scorecard.
// Evaluates completeness and billing defensibility of MDM fields,
// surfacing specific gaps before note finalization.
//
// Scoring dimensions (5 total, 20 pts each = 100):
//   1. E/M Level set (COPA + Risk selected)
//   2. Rationale documented (copaRationale or riskRationale present)
//   3. Data documented (dataLevel computed — labs, imaging, Cat2/3)
//   4. Differential / presenting concern populated
//   5. Narrative built and non-empty
//
// Props:
//   mdmState       object   — from useNPIState
//   autoDataLevel  string   — "none" | "limited" | "moderate" | "high"
//   compact        bool     — pill-only mode (no panel expansion)
//   onClick        fn()     — optional drill-down handler
//
// Constraints: no form, no localStorage, no router, straight quotes only,
//   single react import, border before borderTop/etc.

import { useMemo, useState } from "react";

const T = {
  txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", blue:"#3b9eff",
  orange:"#ff9f43", green:"#3dffa0", purple:"#9b6dff",
};

// ── Scoring engine ─────────────────────────────────────────────────────────────
function scoreMDM(mdmState, autoDataLevel) {
  const items = [];

  // 1. E/M Level set
  const levelSet = Boolean(mdmState.copa && mdmState.risk);
  items.push({
    key:"level",
    label:"E/M Level Set",
    desc:levelSet
      ? `COPA: ${mdmState.copa} · Risk: ${mdmState.risk}`
      : "Select COPA and Risk to establish E/M level",
    points:20,
    earned:levelSet ? 20 : 0,
    pass:levelSet,
    icon:"🏷️",
    action:"Select level in MDM builder or use Auto-populate",
  });

  // 2. Rationale documented
  const copaLen  = (mdmState.copaRationale || "").trim().length;
  const riskLen  = (mdmState.riskRationale || "").trim().length;
  const hasRationale = copaLen >= 20 || riskLen >= 20;
  const ratPts = copaLen >= 20 && riskLen >= 20 ? 20 : (copaLen >= 20 || riskLen >= 20) ? 10 : 0;
  items.push({
    key:"rationale",
    label:"Clinical Rationale",
    desc:hasRationale
      ? `${copaLen >= 20 ? "COPA" : ""}${copaLen >= 20 && riskLen >= 20 ? " + " : ""}${riskLen >= 20 ? "Risk" : ""} rationale documented`
      : "No rationale text — auditors require specific clinical justification",
    points:20,
    earned:ratPts,
    pass:hasRationale,
    partial: ratPts > 0 && ratPts < 20,
    icon:"📝",
    action:"Add rationale explaining why this COPA/Risk level was chosen",
  });

  // 3. Data documented
  const dataLevelMap = { none:0, limited:14, moderate:17, high:20 };
  const dataPts = dataLevelMap[autoDataLevel] || 0;
  const dataPass = dataPts >= 14;
  items.push({
    key:"data",
    label:"Data Complexity",
    desc:autoDataLevel && autoDataLevel !== "none"
      ? `${autoDataLevel.charAt(0).toUpperCase() + autoDataLevel.slice(1)} — labs, imaging, or CDRs documented`
      : "No data elements checked — document labs/imaging ordered or reviewed",
    points:20,
    earned:dataPts,
    pass:dataPass,
    partial: dataPts > 0 && dataPts < 20,
    icon:"🔬",
    action:"Add lab counts, imaging counts, or CDRs (Cat2) in the Data section",
  });

  // 4. Differential documented
  const diff = mdmState.diffDx || {};
  const diffLen = [
    (diff.presentingConcern || "").trim().length,
    (diff.highRiskConsidered || "").trim().length,
    (diff.workingDx || "").trim().length,
  ].reduce((a, b) => a + b, 0);
  const diffPts = diffLen >= 60 ? 20 : diffLen >= 20 ? 12 : diffLen > 0 ? 6 : 0;
  const diffPass = diffLen >= 20;
  items.push({
    key:"diff",
    label:"Differential / Presenting Concern",
    desc:diffLen >= 20
      ? "Presenting concern and/or DDx populated — audit protection active"
      : "Empty — document presenting concern + high-risk conditions ruled out",
    points:20,
    earned:diffPts,
    pass:diffPass,
    partial: diffPts > 0 && diffPts < 20,
    icon:"🧠",
    action:"Fill Presenting Concern and High-Risk Conditions in the Differential section",
  });

  // 5. Narrative built
  const narrLen  = (mdmState.narrative || "").trim().length;
  const narrPts  = narrLen >= 200 ? 20 : narrLen >= 80 ? 12 : narrLen > 0 ? 6 : 0;
  const narrPass = narrLen >= 80;
  items.push({
    key:"narrative",
    label:"MDM Narrative",
    desc:narrLen >= 200
      ? `${narrLen} chars — comprehensive narrative present`
      : narrLen > 0
        ? `${narrLen} chars — narrative started but may be incomplete`
        : "No narrative — click Build Narrative to generate",
    points:20,
    earned:narrPts,
    pass:narrPass,
    partial: narrPts > 0 && narrPts < 20,
    icon:"📋",
    action:"Click Build Narrative after selecting COPA and Risk",
  });

  const total   = items.reduce((s, i) => s + i.earned, 0);
  const passing = items.filter(i => i.pass).length;
  const grade   = total >= 90 ? "A" : total >= 75 ? "B" : total >= 55 ? "C" : total >= 35 ? "D" : "F";
  const color   = total >= 90 ? T.green : total >= 75 ? T.teal : total >= 55 ? T.gold : T.coral;

  return { items, total, passing, grade, color };
}

// ── Score arc (SVG ring) ───────────────────────────────────────────────────────
function ScoreRing({ score, color, size = 52 }) {
  const r     = (size - 8) / 2;
  const circ  = 2 * Math.PI * r;
  const dash  = (score / 100) * circ;
  return (
    <svg width={size} height={size} style={{ flexShrink:0 }}>
      <circle cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="rgba(26,53,85,0.6)" strokeWidth={5} />
      <circle cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={5}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition:"stroke-dasharray .4s ease" }} />
      <text x={size / 2} y={size / 2 + 1}
        textAnchor="middle" dominantBaseline="middle"
        fontFamily="'JetBrains Mono',monospace" fontSize={12}
        fontWeight="700" fill={color}>
        {score}
      </text>
    </svg>
  );
}

// ── Row item ──────────────────────────────────────────────────────────────────
function QRow({ item, showAction }) {
  const dotColor = item.pass ? T.teal : item.partial ? T.gold : T.coral;
  return (
    <div style={{ display:"flex", alignItems:"flex-start", gap:9,
      padding:"7px 10px", borderRadius:8,
      background:item.pass ? "rgba(0,229,192,0.04)" : "rgba(8,22,40,0.55)",
      border:`1px solid ${item.pass ? "rgba(0,229,192,0.15)" : item.partial ? "rgba(245,200,66,0.15)" : "rgba(255,107,107,0.12)"}` }}>
      <div style={{ display:"flex", alignItems:"center", gap:6, width:22, flexShrink:0, paddingTop:1 }}>
        <div style={{ width:7, height:7, borderRadius:"50%",
          background:dotColor,
          boxShadow:item.pass ? `0 0 5px ${dotColor}66` : "none",
          flexShrink:0 }} />
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", alignItems:"center",
          justifyContent:"space-between", gap:8, marginBottom:2 }}>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
            fontWeight:600, color:item.pass ? T.txt2 : T.txt3 }}>
            {item.icon} {item.label}
          </span>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
            fontWeight:700, flexShrink:0,
            color:item.earned === item.points ? T.teal : item.earned > 0 ? T.gold : T.txt4 }}>
            {item.earned}/{item.points}
          </span>
        </div>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
          color:item.pass ? "rgba(130,174,206,0.8)" : T.coral, lineHeight:1.45 }}>
          {item.desc}
        </div>
        {!item.pass && showAction && (
          <div style={{ marginTop:4, fontFamily:"'DM Sans',sans-serif", fontSize:9,
            color:"rgba(245,200,66,0.6)", fontStyle:"italic" }}>
            → {item.action}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────
export default function MDMQualityIndicator({
  mdmState, autoDataLevel, compact = false, onClick,
}) {
  const [expanded, setExpanded] = useState(false);
  const { items, total, passing, grade, color } = useMemo(
    () => scoreMDM(mdmState || {}, autoDataLevel || "none"),
    [mdmState, autoDataLevel]
  );

  const toggle = () => {
    if (onClick) { onClick(); return; }
    setExpanded(p => !p);
  };

  // ── Compact pill mode ──────────────────────────────────────────────────────
  if (compact) {
    return (
      <button onClick={toggle}
        title={`MDM Quality: ${total}/100 — ${passing}/5 checks passed`}
        style={{ display:"inline-flex", alignItems:"center", gap:6,
          padding:"3px 10px", borderRadius:20, cursor:"pointer",
          border:`1px solid ${color}44`,
          background:`${color}0d`,
          fontFamily:"'JetBrains Mono',monospace", fontSize:9,
          letterSpacing:1, color }}>
        <div style={{ width:6, height:6, borderRadius:"50%", background:color,
          boxShadow:`0 0 4px ${color}88` }} />
        MDM {total}/100 · {grade}
      </button>
    );
  }

  // ── Full panel mode ────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", color:T.txt }}>

      {/* Header row — always visible */}
      <button onClick={toggle}
        style={{ width:"100%", display:"flex", alignItems:"center",
          gap:12, padding:"11px 13px", borderRadius:expanded ? "10px 10px 0 0" : 10,
          cursor:"pointer", textAlign:"left",
          border:`1px solid ${color}33`,
          borderBottom:expanded ? `1px solid rgba(26,53,85,0.4)` : `1px solid ${color}33`,
          background:`${color}09`,
          transition:"border-radius .15s" }}>

        <ScoreRing score={total} color={color} size={48} />

        <div style={{ flex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:2 }}>
            <span style={{ fontFamily:"'Playfair Display',serif",
              fontWeight:700, fontSize:13, color }}>
              MDM Quality Score
            </span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
              fontWeight:700, letterSpacing:1, padding:"1px 7px",
              borderRadius:4, background:`${color}18`,
              border:`1px solid ${color}44`, color }}>
              {grade}
            </span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:T.txt4, marginLeft:2 }}>
              {passing}/5 checks
            </span>
          </div>
          <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
            {items.map(item => (
              <div key={item.key} style={{ width:7, height:7, borderRadius:"50%",
                background:item.pass ? T.teal : item.partial ? T.gold : "rgba(42,79,122,0.5)",
                title:item.label }} />
            ))}
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9,
              color:T.txt4, marginLeft:3 }}>
              {total >= 90 ? "Audit-ready" : total >= 75 ? "Near complete" : total >= 55 ? "Gaps present" : "Significant gaps"}
            </span>
          </div>
        </div>

        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10,
          color:T.txt4, flexShrink:0 }}>
          {expanded ? "▲" : "▼"}
        </span>
      </button>

      {/* Expanded detail panel */}
      {expanded && (
        <div style={{ padding:"12px 13px", borderRadius:"0 0 10px 10px",
          background:"rgba(8,22,40,0.6)",
          border:`1px solid ${color}22`,
          borderTop:"none",
          display:"flex", flexDirection:"column", gap:6 }}>

          {/* Score bar */}
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
            <div style={{ flex:1, height:5, borderRadius:3,
              background:"rgba(26,53,85,0.5)", overflow:"hidden" }}>
              <div style={{ height:"100%", borderRadius:3,
                width:`${total}%`, background:color,
                transition:"width .4s ease" }} />
            </div>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
              color, fontWeight:700, flexShrink:0 }}>
              {total}/100
            </span>
          </div>

          {/* Check rows */}
          {items.map(item => (
            <QRow key={item.key} item={item} showAction={!item.pass} />
          ))}

          {/* Billing defensibility summary */}
          {total >= 75 && (
            <div style={{ marginTop:4, padding:"7px 10px", borderRadius:7,
              background:"rgba(61,255,160,0.06)",
              border:"1px solid rgba(61,255,160,0.2)" }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:T.green, letterSpacing:1.5, textTransform:"uppercase",
                marginBottom:3 }}>
                Billing Defensibility
              </div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
                color:"rgba(61,255,160,0.8)", lineHeight:1.5 }}>
                {total >= 90
                  ? "Documentation supports the assigned E/M level under AMA CPT 2023 MDM criteria. All key elements present."
                  : "Documentation is largely complete. Review any partial items before finalization."}
              </div>
            </div>
          )}
          {total < 55 && (
            <div style={{ marginTop:4, padding:"7px 10px", borderRadius:7,
              background:"rgba(255,107,107,0.06)",
              border:"1px solid rgba(255,107,107,0.22)" }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:T.coral, letterSpacing:1.5, textTransform:"uppercase",
                marginBottom:3 }}>
                Audit Risk
              </div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
                color:"rgba(255,107,107,0.8)", lineHeight:1.5 }}>
                Significant documentation gaps. E/M level may be challenged on audit.
                Complete COPA, Risk rationale, differential, and narrative before signing.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}