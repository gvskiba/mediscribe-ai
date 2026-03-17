import { useEffect } from "react";

const CAT_COLOR = {
  all: "#00c4a0", anticoag: "#ef4444", cardiac: "#f97316", psych: "#8b5cf6",
  analgesic: "#fb7185", abx: "#22c55e", gi: "#f59e0b", other: "#06b6d4",
};

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 20 }}>
    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#4a6080", marginBottom: 8, paddingBottom: 6, borderBottom: "1px solid rgba(0,196,160,0.12)" }}>
      {title}
    </div>
    {children}
  </div>
);

const Pill = ({ text, color = "rgba(0,196,160,0.08)", border = "rgba(0,196,160,0.2)", textColor = "#00c4a0" }) => (
  <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 5, background: color, border: `1px solid ${border}`, color: textColor, display: "inline-block", marginRight: 6, marginBottom: 4 }}>
    {text}
  </span>
);

export default function MedDetailModal({ med, onClose }) {
  const color = CAT_COLOR[med.category] || "#00c4a0";

  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: "#0d1628", border: "1px solid rgba(0,196,160,0.2)", borderRadius: 14, width: "100%", maxWidth: 780, maxHeight: "90vh", overflowY: "auto", fontFamily: "'Inter', sans-serif", color: "#e2e8f0" }}
      >
        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid rgba(0,196,160,0.12)", background: "#111e33", borderRadius: "14px 14px 0 0", position: "sticky", top: 0, zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 14, height: 14, borderRadius: "50%", background: color, flexShrink: 0, marginTop: 3 }} />
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#e2e8f0" }}>{med.name}</h2>
                  {med.brand && <span style={{ fontSize: 12, color: "#4a6080" }}>({med.brand})</span>}
                  {med.highAlert && (
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", letterSpacing: ".06em" }}>
                      ⚠ HIGH ALERT
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 3 }}>
                  {med.drugClass}
                  {med.pregnancy && <span style={{ marginLeft: 12, padding: "1px 7px", borderRadius: 4, background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.25)", color: "#8b5cf6", fontSize: 11 }}>Pregnancy {med.pregnancy}</span>}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
            >✕</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px" }}>

          {/* Indications */}
          {med.indications && (
            <Section title="Indications">
              <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7 }}>{med.indications}</div>
            </Section>
          )}

          {/* Mechanism */}
          {med.mechanism && (
            <Section title="Mechanism of Action">
              <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7, padding: "10px 14px", background: "rgba(0,196,160,0.04)", border: "1px solid rgba(0,196,160,0.12)", borderRadius: 8 }}>
                {med.mechanism}
              </div>
            </Section>
          )}

          {/* Dosing */}
          {med.dosing?.length > 0 && (
            <Section title="Dosing">
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {med.dosing.map((d, i) => (
                  <div key={i} style={{ background: "#162240", border: "1px solid rgba(0,196,160,0.1)", borderRadius: 8, padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0" }}>{d.indication}</span>
                      <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 4, background: "rgba(0,196,160,0.08)", border: "1px solid rgba(0,196,160,0.2)", color: "#00c4a0" }}>{d.route}</span>
                      {d.duration && <span style={{ fontSize: 10, color: "#4a6080" }}>{d.duration}</span>}
                    </div>
                    <div style={{ fontSize: 13, fontFamily: "monospace", color: "#00c4a0", fontWeight: 700, marginBottom: d.notes ? 4 : 0 }}>{d.dose}</div>
                    {d.notes && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>📝 {d.notes}</div>}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* PK Grid */}
          <Section title="Pharmacokinetics">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10 }}>
              {[
                { label: "Half-Life", value: med.halfLife },
                { label: "Protein Binding", value: med.pb },
                { label: "Bioavailability", value: med.ba },
                { label: "Vd", value: med.vd },
                { label: "Renal Excretion", value: med.renalExc },
              ].filter(item => item.value).map(item => (
                <div key={item.label} style={{ background: "#162240", borderRadius: 8, padding: "10px 12px", border: "1px solid rgba(0,196,160,0.08)" }}>
                  <div style={{ fontSize: 9, letterSpacing: ".1em", textTransform: "uppercase", color: "#4a6080", marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 13, fontFamily: "monospace", color: "#00c4a0", fontWeight: 700 }}>{item.value}</div>
                </div>
              ))}
            </div>
          </Section>

          {/* Renal Dosing */}
          {med.renal?.length > 0 && (
            <Section title="Renal Dosing Adjustments">
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Tier / CrCl", "Dose", "Notes"].map(h => (
                      <th key={h} style={{ textAlign: "left", fontSize: 9, letterSpacing: ".1em", textTransform: "uppercase", color: "#4a6080", padding: "0 10px 8px 0" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {med.renal.map((r, i) => (
                    <tr key={i} style={{ borderTop: "1px solid rgba(0,196,160,0.08)" }}>
                      <td style={{ padding: "8px 10px 8px 0", fontSize: 12, color: "#94a3b8" }}>{r.tier}</td>
                      <td style={{ padding: "8px 10px 8px 0", fontSize: 12, fontFamily: "monospace", color: "#00c4a0", fontWeight: 600 }}>{r.dose}</td>
                      <td style={{ padding: "8px 0", fontSize: 11, color: "#4a6080" }}>{r.note || r.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          )}

          {/* Hepatic */}
          {med.hepatic && (
            <Section title="Hepatic Considerations">
              <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>{med.hepatic}</div>
            </Section>
          )}

          {/* Contraindications + Warnings side by side */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
            {med.contraindications?.length > 0 && (
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#4a6080", marginBottom: 8 }}>Contraindications</div>
                {med.contraindications.map((ci, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, fontSize: 12, color: "#ef4444", padding: "4px 0", alignItems: "flex-start" }}>
                    <span style={{ flexShrink: 0, marginTop: 1 }}>✕</span><span>{ci}</span>
                  </div>
                ))}
              </div>
            )}
            {med.warnings?.length > 0 && (
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#4a6080", marginBottom: 8 }}>Warnings</div>
                {med.warnings.map((w, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, fontSize: 12, color: "#f59e0b", padding: "4px 0", alignItems: "flex-start" }}>
                    <span style={{ flexShrink: 0, marginTop: 1 }}>⚠</span><span style={{ color: "#94a3b8" }}>{w}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Interactions */}
          {med.interactions?.length > 0 && (
            <Section title="Drug Interactions">
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {med.interactions.map((ix, i) => (
                  <div key={i} style={{ fontSize: 12, color: "#94a3b8", padding: "7px 12px", background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.12)", borderRadius: 7, display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <span style={{ color: "#ef4444", flexShrink: 0 }}>⚡</span>{ix}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Monitoring */}
          {med.monitoring && (
            <Section title="Monitoring Parameters">
              <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7, padding: "10px 14px", background: "rgba(59,130,246,0.04)", border: "1px solid rgba(59,130,246,0.12)", borderRadius: 8 }}>
                🔬 {med.monitoring}
              </div>
            </Section>
          )}

          {/* Pediatric Dosing */}
          {med.ped?.mgkg && (
            <Section title="Pediatric Dosing">
              <div style={{ padding: "12px 14px", background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)", borderRadius: 8 }}>
                <div style={{ fontSize: 13, fontFamily: "monospace", color: "#8b5cf6", fontWeight: 700, marginBottom: 4 }}>
                  {med.ped.mgkg} mg/kg {med.ped.route} (max {med.ped.max} {med.ped.unit})
                </div>
                {med.ped.notes && <div style={{ fontSize: 11, color: "#94a3b8" }}>{med.ped.notes}</div>}
              </div>
            </Section>
          )}

          {/* Tags */}
          <div style={{ paddingTop: 16, borderTop: "1px solid rgba(0,196,160,0.08)", display: "flex", flexWrap: "wrap", gap: 6 }}>
            <Pill text={med.category} />
            <Pill text={med.drugClass} color="rgba(59,130,246,0.08)" border="rgba(59,130,246,0.2)" textColor="#3b82f6" />
            {med.pregnancy && <Pill text={`Pregnancy ${med.pregnancy}`} color="rgba(139,92,246,0.08)" border="rgba(139,92,246,0.2)" textColor="#8b5cf6" />}
          </div>
        </div>
      </div>
    </div>
  );
}