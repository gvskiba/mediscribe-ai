// ── VitalsCDSPanel.jsx ───────────────────────────────────────────────────────
// Renders triggered vitals CDS flags inside the existing CDS overlay.
// Import this component into NewPatientInput.jsx and place it at the top of
// the CDS overlay scroll area, above Beers Criteria and CC risk hints.
//
// Props:
//   flags   — array returned by getVitalsCDSFlags()
//   onNav   — optional (section: string) => void  to navigate to a tab
// ─────────────────────────────────────────────────────────────────────────────

// No imports needed — this renders using inline styles matching the NPI design
// system (CSS variables set by npiStyles.js are available in the parent).

export default function VitalsCDSPanel({ flags = [], onNav }) {
  if (!flags.length) return null;

  const critical = flags.filter(f => f.tier === "critical");
  const advisory = flags.filter(f => f.tier === "advisory");
  const info     = flags.filter(f => f.tier === "info");

  const TIER_META = {
    critical: { col: "#ff6b6b", bg: "rgba(255,107,107,0.09)", bd: "rgba(255,107,107,0.45)", bl: "#ff6b6b", label: "CRITICAL",  lc: "rgba(255,107,107,0.75)" },
    advisory: { col: "#f5c842", bg: "rgba(245,200,66,0.07)",  bd: "rgba(245,200,66,0.35)",  bl: "rgba(245,200,66,0.7)", label: "ADVISORY", lc: "rgba(245,200,66,0.65)" },
    info:     { col: "#3b9eff", bg: "rgba(59,158,255,0.06)",  bd: "rgba(59,158,255,0.25)",  bl: "rgba(59,158,255,0.5)", label: "INFO",     lc: "rgba(59,158,255,0.6)"  },
  };

  function Group({ items, tier }) {
    if (!items.length) return null;
    const meta = TIER_META[tier];
    return (
      <div style={{ margin: "12px 12px 0" }}>
        {/* Group header */}
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8, paddingLeft: 2 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: meta.col, boxShadow: tier === "critical" ? `0 0 5px ${meta.col}` : "none" }} />
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: meta.lc, letterSpacing: "1.5px", textTransform: "uppercase" }}>
            {meta.label} — Vitals Triggered
          </span>
        </div>

        {items.map(flag => (
          <div key={flag.id} style={{ padding: "10px 12px", borderRadius: 9, background: meta.bg, border: `1px solid ${meta.bd}`, borderLeft: `3px solid ${meta.bl}`, marginBottom: 8 }}>

            {/* Title row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5, gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ fontSize: 13, lineHeight: 1, flexShrink: 0 }}>{flag.icon}</span>
                <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 700, color: meta.col }}>
                  {flag.title}
                </span>
              </div>
              {flag.score && (
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: meta.col, background: `${meta.col}15`, border: `1px solid ${meta.col}30`, borderRadius: 4, padding: "1px 7px", whiteSpace: "nowrap", flexShrink: 0 }}>
                  {flag.score}
                </span>
              )}
            </div>

            {/* Rationale */}
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "var(--npi-txt3)", marginBottom: 5, lineHeight: 1.55 }}>
              {flag.rationale}
            </div>

            {/* Action */}
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: meta.col, marginBottom: flag.evidence ? 7 : 0, lineHeight: 1.5 }}>
              → {flag.action}
            </div>

            {/* Footer: evidence + nav */}
            {flag.evidence && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 5, paddingTop: 5, borderTop: `1px solid ${meta.bd}`, gap: 8 }}>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: "var(--npi-txt4)", letterSpacing: "0.05em" }}>
                  {flag.evidence}
                </span>
                {/* Context-sensitive navigation shortcuts */}
                {flag.id === "qsofa-2" && onNav && (
                  <button onClick={() => onNav("sepsis")}
                    style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 600, padding: "2px 9px", borderRadius: 5, cursor: "pointer", border: `1px solid ${meta.bd}`, background: meta.bg, color: meta.col }}>
                    Open Sepsis Hub →
                  </button>
                )}
                {(flag.id === "severe-tachycardia" || flag.id === "syncope-arrhythmia" || flag.id === "heart-score-context") && onNav && (
                  <button onClick={() => onNav("chart")}
                    style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 600, padding: "2px 9px", borderRadius: 5, cursor: "pointer", border: `1px solid ${meta.bd}`, background: meta.bg, color: meta.col }}>
                    Go to Chart →
                  </button>
                )}
                {flag.id === "severe-hypoxia" && onNav && (
                  <button onClick={() => onNav("vit")}
                    style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 600, padding: "2px 9px", borderRadius: 5, cursor: "pointer", border: `1px solid ${meta.bd}`, background: meta.bg, color: meta.col }}>
                    Update Vitals →
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <Group items={critical} tier="critical" />
      <Group items={advisory} tier="advisory" />
      <Group items={info}     tier="info" />
    </>
  );
}