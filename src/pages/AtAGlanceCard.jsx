// AtAGlanceCard.jsx
// Live "At a Glance" summary derived entirely from existing MDM + disposition state.
// Zero AI calls — pure computation. Updates automatically as each phase completes.
// Exported: AtAGlanceCard

import React, { useState, useMemo } from "react";

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function mdmLevelColor(level) {
  if (!level) return "var(--qn-txt4)";
  const l = level.toLowerCase();
  if (l.includes("high"))            return "var(--qn-red)";
  if (l.includes("moderate"))        return "var(--qn-orange)";
  if (l.includes("low"))             return "var(--qn-gold)";
  if (l.includes("straightforward")) return "var(--qn-green)";
  return "var(--qn-txt3)";
}

function dispColor(disp) {
  if (!disp) return "var(--qn-txt4)";
  const d = disp.toLowerCase();
  if (d.includes("icu"))      return "var(--qn-red)";
  if (d.includes("admit"))    return "var(--qn-coral)";
  if (d.includes("obs"))      return "var(--qn-orange)";
  if (d.includes("transfer")) return "var(--qn-purple)";
  return "var(--qn-green)";
}

function Row({ label, value, valueColor, mono, badge, children }) {
  if (!value && !children) return null;
  return (
    <div style={{ display:"flex", gap:10, alignItems:"baseline",
      padding:"4px 0", borderBottom:"1px solid rgba(42,79,122,.12)" }}>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
        fontWeight:700, color:"var(--qn-txt4)", letterSpacing:1.2,
        textTransform:"uppercase", flexShrink:0, minWidth:90 }}>
        {label}
      </div>
      <div style={{ fontFamily: mono ? "'JetBrains Mono',monospace" : "'DM Sans',sans-serif",
        fontSize: mono ? 10 : 12, color: valueColor || "var(--qn-txt2)",
        lineHeight:1.5, flex:1 }}>
        {children || value}
      </div>
      {badge && (
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
          fontWeight:700, color:badge.color,
          background:badge.bg, border:`1px solid ${badge.bd}`,
          borderRadius:5, padding:"1px 7px", flexShrink:0,
          letterSpacing:.5, textTransform:"uppercase" }}>
          {badge.label}
        </div>
      )}
    </div>
  );
}

// ─── AT A GLANCE CARD ─────────────────────────────────────────────────────────
export function AtAGlanceCard({
  cc, vitals, hpi, mdmResult, dispResult,
  labs, imaging, newVitals,
  demo, parsedMeds, parsedAllergies,
  treatmentPlan, actionPlan,
  interventions,
}) {
  const [collapsed, setCollapsed]   = useState(false);
  const [copied,    setCopied]      = useState(false);

  // Derive phase status
  const hasP1   = Boolean(cc || hpi);
  const hasMDM  = Boolean(mdmResult);
  const hasP2   = Boolean(labs || imaging || newVitals);
  const hasDisp = Boolean(dispResult);

  const phase = !hasMDM ? "Phase 1 — Initial Assessment"
    : !hasDisp           ? "Phase 2 — Workup & Disposition"
    :                      "Complete — Ready to Save";

  const phaseColor = !hasMDM ? "var(--qn-gold)"
    : !hasDisp               ? "var(--qn-blue)"
    :                          "var(--qn-green)";

  // Patient line
  const patientLine = useMemo(() => {
    const parts = [];
    if (demo?.age)  parts.push(`${demo.age}yo`);
    if (demo?.sex)  parts.push(demo.sex);
    if (cc)         parts.push(cc.slice(0, 40) + (cc.length > 40 ? "…" : ""));
    return parts.join("  ·  ") || null;
  }, [demo, cc]);

  // Red flags — deduplicated
  const redFlags = useMemo(() => {
    const flags = new Set([
      ...(mdmResult?.red_flags || []),
    ]);
    // Pull critical values from vitals text heuristically
    const v = vitals || "";
    if (/HR\s*[1-9][4-9]\d|HR\s*[2-9]\d\d/i.test(v)) flags.add("Tachycardia");
    if (/HR\s*[1-5]\d(?!\d)/i.test(v))                 flags.add("Bradycardia");
    if (/SpO2\s*[0-8]\d/i.test(v))                     flags.add("Hypoxia");
    if (/BP\s*[0-8]\d\s*\//i.test(v))                  flags.add("Hypotension");
    return [...flags].slice(0, 5);
  }, [mdmResult, vitals]);

  // Confirmed interventions given
  const givenItems = useMemo(() =>
    (interventions || [])
      .filter(i => i.confirmed !== false && i.type === "medication" && i.name)
      .map(i => [i.name, i.dose_route].filter(Boolean).join(" "))
      .slice(0, 4),
    [interventions]
  );

  // Build copy text
  const buildCopyText = () => {
    const lines = [];
    const now = new Date().toLocaleString("en-US", {
      month:"short", day:"numeric", hour:"2-digit", minute:"2-digit"
    });
    lines.push(`AT A GLANCE — ${now}`);
    if (patientLine) lines.push(patientLine);
    lines.push(`Status: ${phase}`);
    lines.push("");
    if (mdmResult?.working_diagnosis) lines.push(`Working Dx: ${mdmResult.working_diagnosis}`);
    if (dispResult?.final_diagnosis)  lines.push(`Final Dx:   ${dispResult.final_diagnosis}`);
    if (mdmResult?.mdm_level)         lines.push(`MDM:        ${mdmResult.mdm_level}`);
    if (mdmResult?.risk_tier)         lines.push(`Risk:       ${mdmResult.risk_tier}`);
    if (redFlags.length) lines.push(`Red Flags:  ${redFlags.join(" · ")}`);
    if (mdmResult?.critical_actions?.length) {
      lines.push("");
      lines.push("Critical Actions:");
      mdmResult.critical_actions.forEach(a => lines.push(`  • ${a}`));
    }
    if (dispResult?.disposition)      lines.push(`\nDisposition: ${dispResult.disposition}`);
    if (dispResult?.reevaluation_note)lines.push(`Reevaluation: ${dispResult.reevaluation_note}`);
    if (givenItems.length)            lines.push(`Given: ${givenItems.join(", ")}`);
    if (treatmentPlan?.trim())        lines.push(`\nTx Plan:\n${treatmentPlan.trim()}`);
    if (actionPlan?.trim())           lines.push(`\nActions:\n${actionPlan.trim()}`);
    return lines.join("\n");
  };

  const copy = () => {
    navigator.clipboard.writeText(buildCopyText()).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!hasP1 && !hasMDM) return null;

  return (
    <div className="qn-fade" style={{ marginBottom:12, borderRadius:12,
      background:"rgba(8,22,40,.65)",
      border:`1px solid ${phaseColor}33`,
      boxShadow:`0 0 0 1px ${phaseColor}0a` }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ display:"flex", alignItems:"center", gap:8,
        padding:"9px 14px", cursor:"pointer",
        borderBottom: collapsed ? "none" : `1px solid rgba(42,79,122,.2)` }}
        onClick={() => setCollapsed(c => !c)}>

        {/* Phase indicator dot */}
        <div style={{ width:8, height:8, borderRadius:"50%",
          background:phaseColor, flexShrink:0,
          boxShadow:`0 0 6px ${phaseColor}66`,
          animation: !hasDisp ? "qnpulse 2s ease-in-out infinite" : "none" }} />

        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
          fontWeight:700, color:phaseColor, letterSpacing:1.2,
          textTransform:"uppercase", flex:1 }}>
          At a Glance
          {patientLine && (
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
              fontWeight:400, color:"var(--qn-txt3)", letterSpacing:0,
              textTransform:"none", marginLeft:10 }}>
              {patientLine}
            </span>
          )}
        </span>

        {/* Phase badge */}
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
          fontWeight:700, color:phaseColor,
          background:`${phaseColor}12`,
          border:`1px solid ${phaseColor}35`,
          borderRadius:5, padding:"2px 8px",
          letterSpacing:.5, textTransform:"uppercase", flexShrink:0 }}>
          {phase}
        </div>

        {/* Copy + collapse */}
        {!collapsed && (
          <button onClick={e => { e.stopPropagation(); copy(); }}
            style={{ padding:"2px 9px", borderRadius:5, cursor:"pointer",
              fontFamily:"'JetBrains Mono',monospace", fontSize:7, fontWeight:700,
              border:`1px solid ${copied ? "rgba(61,255,160,.5)" : "rgba(42,79,122,.4)"}`,
              background:copied ? "rgba(61,255,160,.1)" : "transparent",
              color:copied ? "var(--qn-green)" : "var(--qn-txt4)",
              letterSpacing:.4, transition:"all .15s", flexShrink:0 }}>
            {copied ? "✓" : "Copy"}
          </button>
        )}
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
          color:"var(--qn-txt4)", flexShrink:0 }}>
          {collapsed ? "▼" : "▲"}
        </span>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      {!collapsed && (
        <div style={{ padding:"10px 14px 12px",
          display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 24px" }}>

          {/* ── Left column ─────────────────────────────────────────────── */}
          <div>
            {/* Diagnosis */}
            {(mdmResult?.working_diagnosis || dispResult?.final_diagnosis) && (
              <Row label={dispResult ? "Final Dx" : "Working Dx"}
                value={dispResult?.final_diagnosis || mdmResult?.working_diagnosis}
                valueColor="var(--qn-txt)" />
            )}

            {/* MDM level */}
            {mdmResult?.mdm_level && (
              <Row label="MDM"
                value={mdmResult.mdm_level}
                valueColor={mdmLevelColor(mdmResult.mdm_level)}
                badge={{
                  label: mdmResult.risk_tier || mdmResult.mdm_level,
                  color: mdmLevelColor(mdmResult.mdm_level),
                  bg:    `${mdmLevelColor(mdmResult.mdm_level)}12`,
                  bd:    `${mdmLevelColor(mdmResult.mdm_level)}35`,
                }} />
            )}

            {/* Red flags */}
            {redFlags.length > 0 && (
              <Row label="⚠ Flags">
                <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                  {redFlags.map((f, i) => (
                    <span key={i} style={{ fontFamily:"'JetBrains Mono',monospace",
                      fontSize:8, fontWeight:700, color:"var(--qn-coral)",
                      background:"rgba(255,107,107,.1)",
                      border:"1px solid rgba(255,107,107,.3)",
                      borderRadius:5, padding:"1px 7px" }}>
                      {f}
                    </span>
                  ))}
                </div>
              </Row>
            )}

            {/* Disposition */}
            {dispResult?.disposition && (
              <Row label="Disposition"
                value={dispResult.disposition}
                valueColor={dispColor(dispResult.disposition)} />
            )}

            {/* Reevaluation / treatment response */}
            {dispResult?.treatment_response && (
              <Row label="Response"
                value={dispResult.treatment_response}
                valueColor="var(--qn-txt3)" />
            )}

            {/* Meds / allergies summary */}
            {(parsedMeds?.length > 0 || parsedAllergies?.length > 0) && (
              <Row label="Meds / Allg">
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                  color:"var(--qn-txt3)" }}>
                  {parsedMeds?.length > 0
                    ? `${parsedMeds.length} med${parsedMeds.length>1?"s":""}`
                    : "No meds"}
                  {parsedAllergies?.length > 0
                    ? ` · ${parsedAllergies.map(a=>a.allergen).join(", ")}`
                    : " · NKDA"}
                </span>
              </Row>
            )}
          </div>

          {/* ── Right column ────────────────────────────────────────────── */}
          <div>
            {/* Critical actions */}
            {mdmResult?.critical_actions?.length > 0 && (
              <Row label="Critical">
                <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
                  {mdmResult.critical_actions.map((a, i) => (
                    <div key={i} style={{ display:"flex", gap:6,
                      alignItems:"baseline" }}>
                      <span style={{ color:"var(--qn-red)", fontSize:10,
                        fontWeight:700, flexShrink:0 }}>!</span>
                      <span style={{ fontFamily:"'DM Sans',sans-serif",
                        fontSize:11, color:"var(--qn-txt2)",
                        lineHeight:1.4 }}>{a}</span>
                    </div>
                  ))}
                </div>
              </Row>
            )}

            {/* Treatments given */}
            {givenItems.length > 0 && (
              <Row label="Given">
                <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
                  {givenItems.map((item, i) => (
                    <span key={i} style={{ fontFamily:"'JetBrains Mono',monospace",
                      fontSize:9, color:"var(--qn-txt3)" }}>• {item}</span>
                  ))}
                </div>
              </Row>
            )}

            {/* Physician plan summary */}
            {(treatmentPlan?.trim() || actionPlan?.trim()) && (
              <Row label="My Plan">
                <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
                  {[
                    ...(treatmentPlan?.trim().split("\n").filter(Boolean).slice(0, 2) || []),
                    ...(actionPlan?.trim().split("\n").filter(Boolean).slice(0, 2)   || []),
                  ].map((line, i) => (
                    <span key={i} style={{ fontFamily:"'DM Sans',sans-serif",
                      fontSize:11, color:"var(--qn-txt3)",
                      overflow:"hidden", textOverflow:"ellipsis",
                      whiteSpace:"nowrap" }}>{line}</span>
                  ))}
                  {((treatmentPlan?.trim().split("\n").length || 0) +
                    (actionPlan?.trim().split("\n").length || 0)) > 4 && (
                    <span style={{ fontFamily:"'JetBrains Mono',monospace",
                      fontSize:7, color:"var(--qn-txt4)" }}>
                      + more — see plan below
                    </span>
                  )}
                </div>
              </Row>
            )}

            {/* Follow-up */}
            {dispResult?.discharge_instructions?.followup && (
              <Row label="Follow-up"
                value={dispResult.discharge_instructions.followup}
                valueColor="var(--qn-txt3)" />
            )}

            {/* Pending workup indicator */}
            {hasMDM && !hasDisp && (
              <Row label="Pending">
                <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                  {!labs    && <span style={{ fontFamily:"'JetBrains Mono',monospace",
                    fontSize:7, color:"var(--qn-gold)",
                    background:"rgba(245,200,66,.1)",
                    border:"1px solid rgba(245,200,66,.3)",
                    borderRadius:4, padding:"1px 6px" }}>Labs</span>}
                  {!imaging && <span style={{ fontFamily:"'JetBrains Mono',monospace",
                    fontSize:7, color:"var(--qn-gold)",
                    background:"rgba(245,200,66,.1)",
                    border:"1px solid rgba(245,200,66,.3)",
                    borderRadius:4, padding:"1px 6px" }}>Imaging</span>}
                  {!newVitals && <span style={{ fontFamily:"'JetBrains Mono',monospace",
                    fontSize:7, color:"var(--qn-gold)",
                    background:"rgba(245,200,66,.1)",
                    border:"1px solid rgba(245,200,66,.3)",
                    borderRadius:4, padding:"1px 6px" }}>Recheck Vitals</span>}
                </div>
              </Row>
            )}
          </div>
        </div>
      )}

      {/* ── MDM narrative preview ───────────────────────────────────────── */}
      {!collapsed && mdmResult?.mdm_narrative && (
        <div style={{ margin:"0 14px 12px", padding:"8px 12px", borderRadius:9,
          background:"rgba(14,37,68,.5)", border:"1px solid rgba(42,79,122,.25)" }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
            color:"var(--qn-txt4)", letterSpacing:.8, textTransform:"uppercase",
            marginBottom:5 }}>MDM Narrative</div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
            color:"var(--qn-txt2)", lineHeight:1.75 }}>
            {mdmResult.mdm_narrative}
          </div>
        </div>
      )}

      {/* Footer hint */}
      {!collapsed && (
        <div style={{ padding:"0 14px 8px",
          fontFamily:"'JetBrains Mono',monospace", fontSize:7,
          color:"rgba(42,79,122,.5)", letterSpacing:.4 }}>
          Derived from structured fields — updates live · Copy for sign-out or handoff
        </div>
      )}
    </div>
  );
}