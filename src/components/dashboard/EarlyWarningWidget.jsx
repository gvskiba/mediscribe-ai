import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";

const T = {
  navy: "#050f1e", slate: "#0b1d35", panel: "#0e2340", edge: "#162d4f",
  border: "#1e3a5f", muted: "#2a4d72", dim: "#4a7299", text: "#c8ddf0",
  bright: "#e8f4ff", teal: "#00d4bc", amber: "#f5a623", red: "#ff5c6c",
  green: "#2ecc71", purple: "#9b6dff", gold: "#fbbf24",
};

// Sepsis / deterioration scoring from vital signs
function scoreSepsisRisk(note) {
  let score = 0;
  const flags = [];
  const vs = note.vital_signs || {};

  // SIRS criteria
  const temp = vs.temperature?.value;
  const hr = vs.heart_rate?.value;
  const rr = vs.respiratory_rate?.value;
  const spo2 = vs.oxygen_saturation?.value;
  const sbp = vs.blood_pressure?.systolic;
  const dbp = vs.blood_pressure?.diastolic;

  if (temp) {
    const tempF = vs.temperature?.unit === "C" ? temp * 9 / 5 + 32 : temp;
    if (tempF > 100.4) { score += 2; flags.push({ label: `Fever ${tempF.toFixed(1)}°F`, sev: "warn" }); }
    if (tempF < 96.8)  { score += 2; flags.push({ label: `Hypothermia ${tempF.toFixed(1)}°F`, sev: "crit" }); }
  }
  if (hr)  { if (hr > 100) { score += 2; flags.push({ label: `Tachycardia HR ${hr}`, sev: hr > 130 ? "crit" : "warn" }); } }
  if (rr)  { if (rr > 20)  { score += 2; flags.push({ label: `Tachypnea RR ${rr}`, sev: rr > 25 ? "crit" : "warn" }); } }
  if (spo2){ if (spo2 < 92){ score += 3; flags.push({ label: `Low SpO₂ ${spo2}%`, sev: spo2 < 88 ? "crit" : "warn" }); } }
  if (sbp) { if (sbp < 90) { score += 4; flags.push({ label: `Hypotension SBP ${sbp}`, sev: "crit" }); } }

  // Lab findings
  const labs = note.lab_findings || [];
  labs.forEach(lab => {
    const name = (lab.test_name || "").toLowerCase();
    const result = parseFloat(lab.result) || 0;
    const status = lab.status;
    if (name.includes("lactate") && result >= 2.0) {
      score += result >= 4 ? 5 : 3;
      flags.push({ label: `Lactate ${result} mmol/L`, sev: result >= 4 ? "crit" : "warn" });
    }
    if ((name.includes("wbc") || name.includes("white blood")) ) {
      if (result > 12 || result < 4) {
        score += 2;
        flags.push({ label: `Abnormal WBC ${result}`, sev: "warn" });
      }
    }
    if (name.includes("creatinine") && result > 2.0) {
      score += 2;
      flags.push({ label: `Elevated Creatinine ${result}`, sev: result > 3 ? "crit" : "warn" });
    }
    if (name.includes("procalcitonin") && result > 0.5) {
      score += 2;
      flags.push({ label: `Elevated PCT ${result}`, sev: result > 2 ? "crit" : "warn" });
    }
    if (status === "critical") {
      score += 3;
      flags.push({ label: `Critical: ${lab.test_name}`, sev: "crit" });
    }
  });

  // Mention of sepsis/infection in diagnoses or assessment
  const text = `${note.assessment || ""} ${note.plan || ""} ${note.chief_complaint || ""}`.toLowerCase();
  if (text.includes("sepsis") || text.includes("bacteremia") || text.includes("shock")) {
    score += 3;
    flags.push({ label: "Sepsis/Shock mentioned", sev: "warn" });
  }
  if (text.includes("septic shock")) {
    score += 2;
    flags.push({ label: "Septic shock noted", sev: "crit" });
  }

  return { score, flags };
}

function getRiskLevel(score) {
  if (score >= 10) return { level: "CRITICAL", color: T.red, bg: "rgba(255,92,108,0.08)", border: "rgba(255,92,108,0.3)", icon: "🚨" };
  if (score >= 6)  return { level: "HIGH",     color: T.amber, bg: "rgba(245,166,35,0.08)", border: "rgba(245,166,35,0.3)", icon: "⚠️" };
  if (score >= 3)  return { level: "ELEVATED",  color: T.gold, bg: "rgba(251,191,36,0.06)", border: "rgba(251,191,36,0.25)", icon: "⚡" };
  return null; // no alert
}

const PROTOCOLS = [
  { label: "Sepsis 1-hr Bundle", url: "https://www.sccm.org/getattachment/SurvivingSepsisCampaign/SSCBundle.pdf", color: T.red },
  { label: "Surviving Sepsis 2024", url: "https://www.sccm.org/SurvivingSepsisCampaign/Guidelines", color: T.amber },
  { label: "SIRS / qSOFA Criteria", url: "https://www.mdcalc.com/calc/1096/sirs-criteria-sepsis", color: T.teal },
  { label: "Shock Protocol", url: "https://www.acep.org/patient-care/clinical-policies-and-guidelines/", color: T.purple },
];

export default function EarlyWarningWidget() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [showProtocols, setShowProtocols] = useState(false);

  const analyze = async () => {
    setLoading(true);
    try {
      // Get today's draft notes (active patients)
      const notes = await base44.entities.ClinicalNote.filter({ status: "draft" }, "-updated_date", 20);
      const found = [];
      (notes || []).forEach(note => {
        const { score, flags } = scoreSepsisRisk(note);
        const risk = getRiskLevel(score);
        if (risk && flags.length > 0) {
          found.push({ note, score, flags, risk });
        }
      });
      // Sort by score descending
      found.sort((a, b) => b.score - a.score);
      setAlerts(found);
      setLastChecked(new Date());
    } catch (err) {
      console.error("EarlyWarning analysis failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    analyze();
    const interval = setInterval(analyze, 5 * 60 * 1000); // refresh every 5 min
    return () => clearInterval(interval);
  }, []);

  const criticalCount = alerts.filter(a => a.risk.level === "CRITICAL").length;
  const highCount = alerts.filter(a => a.risk.level === "HIGH").length;

  return (
    <div style={{ background: T.panel, border: `1px solid ${criticalCount > 0 ? "rgba(255,92,108,0.4)" : T.border}`, borderRadius: "14px", overflow: "hidden", display: "flex", flexDirection: "column", fontFamily: "DM Sans, sans-serif" }}>
      {/* Header */}
      <div style={{ padding: "12px 16px 10px", borderBottom: `1px solid ${T.border}`, background: criticalCount > 0 ? "rgba(255,92,108,0.05)" : "rgba(245,166,35,0.03)", display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ fontSize: "18px" }}>{criticalCount > 0 ? "🚨" : "🛡️"}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: T.bright }}>Early Warning System</div>
          <div style={{ fontSize: "10px", color: T.dim, marginTop: "1px" }}>Sepsis & Clinical Deterioration Monitor</div>
        </div>
        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          {criticalCount > 0 && (
            <span style={{ background: T.red, color: "#fff", fontSize: "10px", fontWeight: 800, padding: "2px 8px", borderRadius: "12px" }}>
              {criticalCount} CRIT
            </span>
          )}
          {highCount > 0 && (
            <span style={{ background: T.amber, color: T.navy, fontSize: "10px", fontWeight: 800, padding: "2px 8px", borderRadius: "12px" }}>
              {highCount} HIGH
            </span>
          )}
          <button
            onClick={analyze}
            title="Refresh"
            style={{ background: "rgba(0,212,188,0.1)", border: `1px solid rgba(0,212,188,0.2)`, borderRadius: "6px", color: T.teal, fontSize: "10px", fontWeight: 700, padding: "3px 8px", cursor: "pointer" }}
          >
            ↻
          </button>
        </div>
      </div>

      {/* Alerts List */}
      <div style={{ flex: 1, overflowY: "auto", maxHeight: "340px" }}>
        {loading ? (
          <div style={{ padding: "24px", textAlign: "center", color: T.dim, fontSize: "12px" }}>
            <div style={{ marginBottom: "6px", fontSize: "18px" }}>⏳</div>
            Analyzing patient vitals & labs…
          </div>
        ) : alerts.length === 0 ? (
          <div style={{ padding: "24px", textAlign: "center", color: T.dim }}>
            <div style={{ fontSize: "28px", marginBottom: "8px" }}>✅</div>
            <div style={{ fontSize: "13px", fontWeight: 600, color: T.green }}>No active alerts</div>
            <div style={{ fontSize: "11px", marginTop: "4px" }}>All monitored patients are within normal parameters</div>
          </div>
        ) : (
          alerts.map((alert, idx) => {
            const isOpen = expanded === idx;
            const { note, score, flags, risk } = alert;
            return (
              <div key={note.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                {/* Alert Row */}
                <div
                  onClick={() => setExpanded(isOpen ? null : idx)}
                  style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", cursor: "pointer", background: isOpen ? risk.bg : "transparent", transition: "background 0.15s" }}
                  onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = "rgba(22,45,79,0.5)"; }}
                  onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = "transparent"; }}
                >
                  <span style={{ fontSize: "14px" }}>{risk.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: T.bright, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {note.patient_name || "Unknown Patient"}
                    </div>
                    <div style={{ fontSize: "10px", color: T.dim, marginTop: "2px" }}>
                      {note.patient_id ? `MRN: ${note.patient_id} · ` : ""}{flags[0]?.label}
                      {flags.length > 1 ? ` +${flags.length - 1} more` : ""}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: "10px", fontWeight: 800, color: risk.color, background: risk.bg, border: `1px solid ${risk.border}`, borderRadius: "6px", padding: "2px 7px" }}>
                      {risk.level}
                    </div>
                    <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "10px", color: T.dim, marginTop: "3px" }}>
                      Score: {score}
                    </div>
                  </div>
                  <div style={{ color: T.dim, fontSize: "10px" }}>{isOpen ? "▲" : "▼"}</div>
                </div>

                {/* Expanded Detail */}
                {isOpen && (
                  <div style={{ padding: "10px 14px 14px", background: risk.bg, borderTop: `1px solid ${risk.border}` }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "10px" }}>
                      {flags.map((f, fi) => (
                        <span key={fi} style={{
                          fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "5px",
                          background: f.sev === "crit" ? "rgba(255,92,108,0.15)" : "rgba(245,166,35,0.12)",
                          border: `1px solid ${f.sev === "crit" ? "rgba(255,92,108,0.35)" : "rgba(245,166,35,0.3)"}`,
                          color: f.sev === "crit" ? T.red : T.amber
                        }}>
                          {f.label}
                        </span>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: "7px" }}>
                      <button
                        onClick={() => window.location.href = createPageUrl(`NoteDetail?id=${note.id}`)}
                        style={{ flex: 1, padding: "7px 10px", borderRadius: "7px", background: `linear-gradient(135deg, ${risk.color}22, ${risk.color}11)`, border: `1px solid ${risk.border}`, color: risk.color, fontSize: "11px", fontWeight: 700, cursor: "pointer" }}
                      >
                        View Note →
                      </button>
                      <button
                        onClick={() => setShowProtocols(true)}
                        style={{ padding: "7px 10px", borderRadius: "7px", background: "rgba(155,109,255,0.1)", border: "1px solid rgba(155,109,255,0.25)", color: T.purple, fontSize: "11px", fontWeight: 700, cursor: "pointer" }}
                      >
                        Protocols
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: "8px 14px", borderTop: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "10px", color: T.dim, flex: 1 }}>
          {lastChecked ? `Last checked ${lastChecked.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}` : "Not yet checked"}
        </span>
        <button
          onClick={() => setShowProtocols(true)}
          style={{ fontSize: "10px", fontWeight: 700, color: T.purple, background: "rgba(155,109,255,0.08)", border: "1px solid rgba(155,109,255,0.2)", borderRadius: "6px", padding: "3px 9px", cursor: "pointer" }}
        >
          📋 Protocols
        </button>
      </div>

      {/* Protocols Modal */}
      {showProtocols && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setShowProtocols(false)}
        >
          <div
            style={{ background: T.slate, border: `1px solid ${T.border}`, borderRadius: "16px", width: 420, padding: "0 0 16px", overflow: "hidden" }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: "16px 20px 12px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "20px" }}>📋</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "15px", fontWeight: 700, color: T.bright }}>Hospital Protocols</div>
                <div style={{ fontSize: "11px", color: T.dim }}>Sepsis & Clinical Deterioration</div>
              </div>
              <button onClick={() => setShowProtocols(false)} style={{ background: "none", border: "none", color: T.dim, fontSize: "18px", cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ padding: "14px 20px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ fontSize: "11px", color: T.dim, marginBottom: "2px" }}>
                Click any protocol to open the official guideline resource in a new tab.
              </div>
              {PROTOCOLS.map((p, i) => (
                <a
                  key={i}
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", borderRadius: "10px", background: `${p.color}10`, border: `1px solid ${p.color}30`, textDecoration: "none", transition: "all 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = `${p.color}20`; e.currentTarget.style.borderColor = `${p.color}55`; }}
                  onMouseLeave={e => { e.currentTarget.style.background = `${p.color}10`; e.currentTarget.style.borderColor = `${p.color}30`; }}
                >
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: p.color, flexShrink: 0 }} />
                  <span style={{ fontSize: "13px", fontWeight: 600, color: T.bright, flex: 1 }}>{p.label}</span>
                  <span style={{ fontSize: "11px", color: p.color }}>↗</span>
                </a>
              ))}
            </div>
            <div style={{ padding: "8px 20px 0", borderTop: `1px solid ${T.border}` }}>
              <div style={{ fontSize: "10px", color: T.dim, textAlign: "center" }}>
                Links open official society guidelines and MDCalc tools
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}