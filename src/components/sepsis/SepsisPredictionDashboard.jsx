import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Activity, Thermometer, Heart, Wind, Droplet, Clock } from "lucide-react";

const C = {
  navy:"#050f1e", slate:"#0b1d35", panel:"#0d2240", edge:"#162d4f",
  border:"#1e3a5f", muted:"#2a4d72", dim:"#4a7299", text:"#c8ddf0",
  bright:"#e8f4ff", teal:"#00d4bc", amber:"#f5a623", red:"#ff5c6c",
  green:"#2ecc71", purple:"#9b6dff", blue:"#4a90d9",
};

// ── Sepsis scoring algorithms ──────────────────────────────────────
function calculateQSOFA(vitals) {
  let score = 0;
  if (vitals.rr >= 22) score++; // Respiratory rate ≥22
  if (vitals.sbp <= 100) score++; // Systolic BP ≤100
  if (vitals.gcs && vitals.gcs < 15) score++; // Altered mental status (GCS <15)
  return score;
}

function calculateSIRS(vitals, labs) {
  let score = 0;
  const temp = vitals.temp;
  const hr = vitals.hr;
  const rr = vitals.rr;
  const wbc = labs.find(l => l.test_name?.toLowerCase().includes("wbc"))?.result;

  if (temp && (temp > 100.4 || temp < 96.8)) score++; // Temperature >38°C or <36°C
  if (hr && hr > 90) score++; // Heart rate >90
  if (rr && rr > 20) score++; // Respiratory rate >20
  if (wbc && (parseFloat(wbc) > 12 || parseFloat(wbc) < 4)) score++; // WBC >12k or <4k

  return score;
}

function assessSepsisRisk(patient) {
  const vitals = patient.vital_signs || {};
  const labs = patient.lab_findings || [];
  
  const qsofa = calculateQSOFA({
    rr: vitals.respiratory_rate?.value,
    sbp: vitals.blood_pressure?.systolic,
    gcs: vitals.gcs?.value,
  });

  const sirs = calculateSIRS({
    temp: vitals.temperature?.value,
    hr: vitals.heart_rate?.value,
    rr: vitals.respiratory_rate?.value,
  }, labs);

  const lactate = labs.find(l => l.test_name?.toLowerCase().includes("lactate"));
  const lactateCritical = lactate && parseFloat(lactate.result) >= 2.0;

  let risk = "low";
  let color = C.green;
  let alerts = [];

  if (qsofa >= 2) {
    risk = "high";
    color = C.red;
    alerts.push({ text: `qSOFA ≥2 (score: ${qsofa})`, severity: "critical" });
  } else if (qsofa === 1) {
    risk = "moderate";
    color = C.amber;
    alerts.push({ text: `qSOFA = 1`, severity: "warning" });
  }

  if (sirs >= 2) {
    alerts.push({ text: `SIRS ≥2 (score: ${sirs})`, severity: sirs >= 3 ? "critical" : "warning" });
    if (risk === "low") {
      risk = "moderate";
      color = C.amber;
    }
  }

  if (lactateCritical) {
    alerts.push({ text: `Lactate ≥2.0 (${lactate.result})`, severity: "critical" });
    risk = "high";
    color = C.red;
  }

  // Check for organ dysfunction markers
  const creatinine = labs.find(l => l.test_name?.toLowerCase().includes("creatinine"));
  const bilirubin = labs.find(l => l.test_name?.toLowerCase().includes("bilirubin"));
  
  if (creatinine && parseFloat(creatinine.result) > 2.0) {
    alerts.push({ text: "Renal dysfunction", severity: "warning" });
  }
  if (bilirubin && parseFloat(bilirubin.result) > 2.0) {
    alerts.push({ text: "Hepatic dysfunction", severity: "warning" });
  }

  return { risk, color, qsofa, sirs, alerts, lactateCritical };
}

export default function SepsisPredictionDashboard({ patients, onPatientClick }) {
  const [sepsisData, setSepsisData] = useState([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const analyzed = patients.map(p => ({
      ...p,
      sepsis: assessSepsisRisk(p),
    }));

    const sorted = analyzed.sort((a, b) => {
      const riskOrder = { high: 3, moderate: 2, low: 1 };
      return riskOrder[b.sepsis.risk] - riskOrder[a.sepsis.risk];
    });

    setSepsisData(sorted);
  }, [patients]);

  const highRisk = sepsisData.filter(p => p.sepsis.risk === "high");
  const moderateRisk = sepsisData.filter(p => p.sepsis.risk === "moderate");
  const displayed = showAll ? sepsisData : sepsisData.filter(p => p.sepsis.risk !== "low");

  if (highRisk.length === 0 && moderateRisk.length === 0) {
    return (
      <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:14, padding:"16px 20px", marginBottom:24 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:"rgba(46,204,113,.1)", border:"1px solid rgba(46,204,113,.28)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Activity size={18} style={{ color:C.green }} />
          </div>
          <div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:700, color:C.bright, letterSpacing:"-.01em" }}>Sepsis Surveillance</div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:C.green, marginTop:2 }}>✓ NO HIGH-RISK PATIENTS DETECTED</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom:24 }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:14 }}>
        <div style={{ width:40, height:40, borderRadius:11, background:"rgba(255,92,108,.12)", border:"1px solid rgba(255,92,108,.35)", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <AlertTriangle size={20} style={{ color:C.red }} />
        </div>
        <div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, color:C.bright, letterSpacing:"-.02em" }}>Sepsis Risk Alert</div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.dim, marginTop:2, letterSpacing:".08em" }}>REAL-TIME qSOFA · SIRS · LACTATE MONITORING</div>
        </div>

        <div style={{ display:"flex", gap:7, marginLeft:8 }}>
          {[
            { label:`${highRisk.length} High Risk`, c:C.red },
            { label:`${moderateRisk.length} Moderate`, c:C.amber },
          ].map(s => (
            <div key={s.label} style={{ padding:"3px 10px", borderRadius:8, background:`${s.c}14`, border:`1px solid ${s.c}35`, fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700, color:s.c }}>
              {s.label}
            </div>
          ))}
        </div>

        <div style={{ flex:1 }} />

        <button onClick={() => setShowAll(!showAll)} style={{ padding:"5px 12px", borderRadius:8, fontSize:10, fontWeight:700, fontFamily:"'JetBrains Mono',monospace", cursor:"pointer", background:C.edge, border:`1px solid ${C.border}`, color:C.dim }}>
          {showAll ? "SHOW RISKS ONLY" : "SHOW ALL"}
        </button>
      </div>

      {/* Patient cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(400px, 1fr))", gap:12 }}>
        <AnimatePresence>
          {displayed.map((p, i) => {
            const s = p.sepsis;
            return (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity:0, scale:0.95 }}
                animate={{ opacity:1, scale:1 }}
                exit={{ opacity:0, scale:0.95 }}
                transition={{ delay:i*.04, duration:.2 }}
                onClick={() => onPatientClick && onPatientClick(p)}
                style={{ background:s.risk==="high"?"rgba(255,92,108,.08)":s.risk==="moderate"?"rgba(245,166,35,.06)":C.panel, border:`2px solid ${s.risk==="high"?"rgba(255,92,108,.4)":s.risk==="moderate"?"rgba(245,166,35,.35)":C.border}`, borderRadius:14, padding:"14px 16px", cursor:"pointer", transition:"all .15s", position:"relative", overflow:"hidden" }}
                whileHover={{ y:-2, boxShadow:`0 8px 24px ${s.color}22` }}
              >
                {/* Risk banner */}
                <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${s.color},${s.color}66)` }} />

                {/* Header row */}
                <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:12 }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:15, color:C.bright, letterSpacing:"-.01em", marginBottom:2 }}>{p.patient_name}</div>
                    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.dim }}>{p.patient_age}y {p.patient_gender?.toUpperCase()} · MRN {p.patient_id} · Room {p.room || "—"}</div>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700, padding:"3px 10px", borderRadius:7, background:s.risk==="high"?"rgba(255,92,108,.18)":"rgba(245,166,35,.14)", border:`1px solid ${s.color}55`, color:s.color }}>
                      {s.risk.toUpperCase()} RISK
                    </span>
                  </div>
                </div>

                {/* CC */}
                <div style={{ fontSize:12, color:C.text, marginBottom:12, padding:"8px 10px", background:C.edge, borderRadius:8, border:`1px solid ${C.border}` }}>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:C.dim, letterSpacing:".1em", marginRight:6 }}>CC:</span>
                  {p.chief_complaint || "No chief complaint"}
                </div>

                {/* Scores row */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:12 }}>
                  {[
                    { label:"qSOFA", score:s.qsofa, max:3, critical:2 },
                    { label:"SIRS", score:s.sirs, max:4, critical:2 },
                    { label:"Lactate", score:s.lactateCritical?"HIGH":"OK", max:null, critical:null },
                  ].map(metric => {
                    const isCritical = metric.max ? metric.score >= metric.critical : metric.score === "HIGH";
                    return (
                      <div key={metric.label} style={{ background:isCritical?"rgba(255,92,108,.1)":"rgba(74,144,217,.06)", border:`1px solid ${isCritical?C.red+"44":C.border}`, borderRadius:9, padding:"8px 10px", textAlign:"center" }}>
                        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:C.muted, letterSpacing:".1em", marginBottom:3 }}>{metric.label}</div>
                        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:18, fontWeight:700, color:isCritical?C.red:C.blue }}>
                          {metric.max ? `${metric.score}/${metric.max}` : metric.score}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Alerts */}
                {s.alerts.length > 0 && (
                  <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                    {s.alerts.map((alert, idx) => (
                      <div key={idx} style={{ display:"flex", alignItems:"center", gap:7, padding:"6px 10px", borderRadius:8, background:alert.severity==="critical"?"rgba(255,92,108,.09)":"rgba(245,166,35,.07)", border:`1px solid ${alert.severity==="critical"?C.red+"33":C.amber+"33"}` }}>
                        <div style={{ width:5, height:5, borderRadius:"50%", background:alert.severity==="critical"?C.red:C.amber, flexShrink:0 }} />
                        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:alert.severity==="critical"?C.red:C.amber, flex:1 }}>{alert.text}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Action indicator */}
                {s.risk === "high" && (
                  <div style={{ marginTop:12, padding:"8px 12px", borderRadius:8, background:"rgba(255,92,108,.12)", border:`1px solid ${C.red}44`, display:"flex", alignItems:"center", gap:8 }}>
                    <Clock size={14} style={{ color:C.red }} />
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700, color:C.red, letterSpacing:".06em" }}>IMMEDIATE SEPSIS PROTOCOL RECOMMENDED</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {displayed.length === 0 && (
        <div style={{ padding:"24px", textAlign:"center", color:C.muted, fontSize:12, background:C.panel, border:`1px solid ${C.border}`, borderRadius:12 }}>
          No patients meet sepsis risk criteria.
        </div>
      )}
    </div>
  );
}