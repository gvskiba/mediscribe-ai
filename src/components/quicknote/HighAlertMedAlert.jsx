// High-Alert Medication Alert
// Watches medsRaw for ISMP high-alert medications from DrugDosing entity
// Shows a modal with standard dosage and safety precautions when detected

import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";

// ISMP high-alert medications — static fallback list used when DB has no records
const ISMP_STATIC = [
  {
    name: "Warfarin", generic_name: "warfarin", drug_id: "warfarin",
    ismp_high_alert: true, category: "anticoagulant",
    standard_dose: "2–10 mg PO daily — dose individualized per INR target",
    contraindications: "Active bleeding, pregnancy, severe hepatic disease",
    monitoring: "INR (target 2–3 for most indications; 2.5–3.5 for mechanical valves). Weekly INR until stable, then monthly.",
    interactions_json: JSON.stringify(["Aspirin/NSAIDs — increases bleeding risk", "Amiodarone — potentiates anticoagulation", "Rifampin — reduces anticoagulation", "Antibiotics — variable INR effect"]),
    wt_note: "Narrow therapeutic index — even small dose changes alter INR significantly",
  },
  {
    name: "Heparin (unfractionated)", generic_name: "heparin", drug_id: "heparin",
    ismp_high_alert: true, category: "anticoagulant",
    standard_dose: "VTE treatment: 80 units/kg IV bolus, then 18 units/kg/hr infusion",
    contraindications: "Active major bleeding, HIT, severe thrombocytopenia",
    monitoring: "aPTT q6h until therapeutic (60–100 sec); platelet count q48h to monitor for HIT",
    interactions_json: JSON.stringify(["Thrombolytics — additive bleeding", "NSAIDs — increased hemorrhage", "Glycoprotein IIb/IIIa inhibitors — additive risk"]),
    wt_note: "Weight-based dosing — use actual body weight. Verify concentration at bedside. HIT risk after ≥4 days.",
  },
  {
    name: "Insulin (all types)", generic_name: "insulin", drug_id: "insulin",
    ismp_high_alert: true, category: "metabolic",
    standard_dose: "DKA: 0.1 units/kg/hr IV infusion. Sliding scale: per institutional protocol",
    contraindications: "Hypoglycemia (blood glucose < 100 mg/dL without supplemental glucose)",
    monitoring: "Blood glucose q1h on infusion; q4h on sliding scale. Potassium levels — hypokalemia risk with infusions",
    interactions_json: JSON.stringify(["Beta-blockers — mask hypoglycemia symptoms", "Corticosteroids — increase insulin requirements", "Alcohol — enhanced hypoglycemia"]),
    wt_note: "Never abbreviate 'U' as units — write out 'units' to prevent 10-fold dosing errors. Verify basal vs bolus type.",
  },
  {
    name: "Concentrated Electrolytes (KCl, NaCl 3%)", generic_name: "concentrated electrolytes", drug_id: "conc_electrolytes",
    ismp_high_alert: true, category: "metabolic",
    standard_dose: "KCl: ≤10 mEq/hr peripheral, ≤20 mEq/hr central. NaCl 3%: 1–2 mL/kg/hr for severe symptomatic hyponatremia",
    contraindications: "KCl undiluted IV push is FATAL. 3% NaCl rapid correction risks osmotic demyelination",
    monitoring: "Serum electrolytes q4h during replacement. Continuous cardiac monitoring for KCl infusions >10 mEq/hr",
    interactions_json: JSON.stringify(["ACE inhibitors/ARBs with KCl — additive hyperkalemia", "Diuretics with KCl — variable effect"]),
    wt_note: "NEVER administer concentrated KCl undiluted — cardiac arrest risk. Sodium correction ≤10–12 mEq/L per 24h to avoid ODS.",
  },
  {
    name: "Opioids (IV/Epidural)", generic_name: "morphine/hydromorphone/fentanyl", drug_id: "iv_opioids",
    ismp_high_alert: true, category: "analgesic",
    standard_dose: "Morphine: 0.1 mg/kg IV q4h PRN. Hydromorphone: 0.015 mg/kg IV q4h. Fentanyl: 1–2 mcg/kg IV",
    contraindications: "Severe respiratory depression, paralytic ileus, hypersensitivity",
    monitoring: "Respiratory rate, sedation score, pain score. Naloxone at bedside for all IV opioid patients",
    interactions_json: JSON.stringify(["Benzodiazepines — FDA black box: enhanced respiratory depression", "Muscle relaxants — additive CNS depression", "MAOIs — serotonin syndrome / fatal interaction", "Alcohol — additive sedation"]),
    wt_note: "Use actual body weight for dosing. Reduce dose 25–50% in elderly, renal or hepatic impairment. Concurrent benzodiazepine use requires close monitoring.",
  },
  {
    name: "Neuromuscular Blocking Agents", generic_name: "succinylcholine/rocuronium/vecuronium", drug_id: "nmba",
    ismp_high_alert: true, category: "rsi",
    standard_dose: "Succinylcholine: 1.5 mg/kg IV. Rocuronium: 1.2 mg/kg IV (RSI). Vecuronium: 0.1 mg/kg IV",
    contraindications: "Succinylcholine: hyperkalemia, burn/crush injury >72h, denervation injury, malignant hyperthermia hx",
    monitoring: "Requires ventilatory support. Sugammadex (16 mg/kg) available for rocuronium/vecuronium reversal",
    interactions_json: JSON.stringify(["Aminoglycosides — prolonged blockade", "Lithium — enhanced blockade", "Magnesium — potentiated blockade"]),
    wt_note: "Patient will be paralyzed — adequate sedation/analgesia MUST be ensured. Sugammadex reversal for rocuronium available.",
  },
  {
    name: "Chemotherapy Agents", generic_name: "antineoplastics", drug_id: "chemo",
    ismp_high_alert: true, category: "other",
    standard_dose: "Refer to oncology-approved protocol — NEVER administer without verified treatment plan",
    contraindications: "Without verified oncology order, pregnancy, severe organ dysfunction (protocol-specific)",
    monitoring: "CBC, renal/hepatic function per protocol. Extravasation precautions for vesicants",
    interactions_json: JSON.stringify(["Multiple interactions — always verify with clinical pharmacist before co-administration"]),
    wt_note: "ED providers should consult oncology before any chemotherapy administration in the ED setting.",
  },
  {
    name: "Hypertonic Saline (3% NaCl)", generic_name: "sodium chloride 3%", drug_id: "hypertonic_saline",
    ismp_high_alert: true, category: "metabolic",
    standard_dose: "ICP: 2 mL/kg IV bolus over 10 min. Symptomatic hyponatremia: 100 mL IV over 10 min, repeat ×2 PRN",
    contraindications: "Sodium ≥ 145 mEq/L, hyperchloremia, volume overload without adequate monitoring",
    monitoring: "Serum Na q2h until stable — correct no faster than 1–2 mEq/L/hr (max 10–12 mEq/L/24h to prevent ODS)",
    interactions_json: JSON.stringify(["Lithium — altered excretion"]),
    wt_note: "Central line preferred. Osmotic demyelination syndrome risk with correction > 10–12 mEq/L per 24 hours.",
  },
  {
    name: "IV Digoxin", generic_name: "digoxin", drug_id: "digoxin",
    ismp_high_alert: true, category: "cardiac",
    standard_dose: "AF rate control: 0.25 mg IV q6h × 3 doses, then 0.125–0.25 mg daily. Check level at 6h",
    contraindications: "Ventricular fibrillation, WPW, bradycardia without pacemaker, hypokalemia",
    monitoring: "Digoxin level (therapeutic 0.5–2 ng/mL), potassium, renal function. Toxicity risk > 2 ng/mL",
    interactions_json: JSON.stringify(["Amiodarone — doubles digoxin level", "Verapamil/diltiazem — increased toxicity", "Hypokalemia — potentiates toxicity", "Quinidine — increases levels 50%"]),
    wt_note: "Narrow therapeutic index. Renal clearance — reduce dose in CKD. Digibind for toxicity > 10 ng/mL or life-threatening arrhythmia.",
  },
];

// Normalize a medication name for matching
function normalizeName(s = "") {
  return s.toLowerCase().replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim();
}

// Score match between typed med text and a drug record
function matchScore(typed, drug) {
  const t = normalizeName(typed);
  const names = [drug.name, drug.generic_name, drug.drug_id].filter(Boolean).map(normalizeName);
  for (const n of names) {
    if (t.includes(n) || n.includes(t)) return 2;
    // partial word match
    const words = n.split(" ");
    if (words.some(w => w.length > 3 && t.includes(w))) return 1;
  }
  return 0;
}

// Parse individual med tokens from the raw meds textarea
function parseMedTokens(medsRaw = "") {
  return medsRaw
    .split(/[\n,;]+/)
    .map(s => s.trim())
    .filter(s => s.length > 2);
}

export default function HighAlertMedAlert({ medsRaw = "" }) {
  const [alert, setAlert] = useState(null); // { drug, typed }
  const [dismissed, setDismissed] = useState(new Set()); // dismissed drug_ids
  const [dbDrugs, setDbDrugs] = useState(null); // null = not loaded yet
  const [copied, setCopied] = useState(false);

  // Load high-alert drugs from DB once
  useEffect(() => {
    base44.entities.DrugDosing.filter({ ismp_high_alert: true })
      .then(results => setDbDrugs(results?.length ? results : ISMP_STATIC))
      .catch(() => setDbDrugs(ISMP_STATIC));
  }, []);

  // Check medsRaw for high-alert matches
  useEffect(() => {
    if (!dbDrugs || !medsRaw.trim()) return;
    const tokens = parseMedTokens(medsRaw);
    if (!tokens.length) return;

    for (const token of tokens) {
      for (const drug of dbDrugs) {
        if (dismissed.has(drug.drug_id)) continue;
        const score = matchScore(token, drug);
        if (score > 0) {
          setAlert({ drug, typed: token });
          return;
        }
      }
    }
  }, [medsRaw, dbDrugs, dismissed]);

  const dismiss = useCallback(() => {
    if (alert) {
      setDismissed(prev => new Set([...prev, alert.drug.drug_id]));
      setAlert(null);
    }
  }, [alert]);

  const copyAlert = useCallback(() => {
    if (!alert) return;
    const d = alert.drug;
    const interactions = (() => { try { return JSON.parse(d.interactions_json || "[]"); } catch { return []; } })();
    const text = [
      `⚠ HIGH-ALERT MEDICATION: ${d.name}`,
      `Standard Dose: ${d.standard_dose || "See protocol"}`,
      d.contraindications ? `Contraindications: ${d.contraindications}` : null,
      d.monitoring ? `Monitoring: ${d.monitoring}` : null,
      interactions.length ? `Key Interactions: ${interactions.join(" | ")}` : null,
      d.wt_note ? `Safety Note: ${d.wt_note}` : null,
    ].filter(Boolean).join("\n");
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }, [alert]);

  if (!alert) return null;

  const { drug } = alert;
  const interactions = (() => { try { return JSON.parse(drug.interactions_json || "[]"); } catch { return []; } })();

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(5,10,20,0.82)", backdropFilter: "blur(6px)",
        padding: 16,
      }}
      onClick={dismiss}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 560,
          borderRadius: 16,
          background: "rgba(8,18,36,0.98)",
          border: "2px solid rgba(255,61,61,0.7)",
          boxShadow: "0 0 60px rgba(255,61,61,0.15), 0 24px 80px rgba(0,0,0,0.8)",
          overflow: "hidden",
          fontFamily: "'DM Sans', sans-serif",
          animation: "qn-slide-in .2s ease",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "14px 18px",
          background: "rgba(255,61,61,0.12)",
          borderBottom: "1px solid rgba(255,61,61,0.4)",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: "rgba(255,61,61,0.2)",
            border: "1px solid rgba(255,61,61,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, flexShrink: 0,
          }}>⚠️</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 8, fontWeight: 700, color: "rgba(255,80,80,1)",
              letterSpacing: 1.8, textTransform: "uppercase", marginBottom: 2,
            }}>
              ISMP High-Alert Medication Detected
            </div>
            <div style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 700, fontSize: 17, color: "#fff", lineHeight: 1.2,
            }}>
              {drug.name}
            </div>
          </div>
          <button
            onClick={dismiss}
            style={{
              background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)",
              borderRadius: 7, color: "rgba(130,170,206,1)", cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600,
              padding: "5px 11px", whiteSpace: "nowrap", flexShrink: 0,
            }}
          >✕ Dismiss</button>
        </div>

        {/* Body */}
        <div style={{ padding: "16px 18px", maxHeight: "60vh", overflowY: "auto" }}>

          {/* Standard Dose — prominent */}
          <div style={{
            padding: "12px 16px", borderRadius: 10, marginBottom: 12,
            background: "rgba(255,61,61,0.07)", border: "1px solid rgba(255,61,61,0.3)",
          }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 8, fontWeight: 700,
              color: "rgba(255,80,80,.8)", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 5,
            }}>Standard Dose</div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700,
              color: "#f2f7ff", lineHeight: 1.55,
            }}>{drug.standard_dose || "Refer to protocol — no standard dose on record"}</div>
          </div>

          {/* Contraindications */}
          {drug.contraindications && (
            <div style={{
              padding: "10px 14px", borderRadius: 9, marginBottom: 10,
              background: "rgba(255,159,67,0.06)", border: "1px solid rgba(255,159,67,0.3)",
            }}>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 8, fontWeight: 700,
                color: "rgba(255,159,67,.85)", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 4,
              }}>Contraindications</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#b8d4f0", lineHeight: 1.65 }}>
                {drug.contraindications}
              </div>
            </div>
          )}

          {/* Monitoring */}
          {drug.monitoring && (
            <div style={{
              padding: "10px 14px", borderRadius: 9, marginBottom: 10,
              background: "rgba(59,158,255,0.06)", border: "1px solid rgba(59,158,255,0.25)",
            }}>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 8, fontWeight: 700,
                color: "rgba(59,158,255,.85)", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 4,
              }}>Required Monitoring</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#b8d4f0", lineHeight: 1.65 }}>
                {drug.monitoring}
              </div>
            </div>
          )}

          {/* Key Interactions */}
          {interactions.length > 0 && (
            <div style={{
              padding: "10px 14px", borderRadius: 9, marginBottom: 10,
              background: "rgba(155,109,255,0.06)", border: "1px solid rgba(155,109,255,0.25)",
            }}>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 8, fontWeight: 700,
                color: "rgba(155,109,255,.85)", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 6,
              }}>Key Drug Interactions</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {interactions.map((inter, i) => (
                  <div key={i} style={{ display: "flex", gap: 7, alignItems: "flex-start" }}>
                    <div style={{ width: 4, height: 4, borderRadius: "50%", background: "rgba(155,109,255,.6)", flexShrink: 0, marginTop: 5 }} />
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11.5, color: "#b8d4f0", lineHeight: 1.55 }}>{inter}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Safety note */}
          {drug.wt_note && (
            <div style={{
              padding: "10px 14px", borderRadius: 9, marginBottom: 10,
              background: "rgba(245,200,66,0.06)", border: "1px solid rgba(245,200,66,0.25)",
            }}>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 8, fontWeight: 700,
                color: "rgba(245,200,66,.85)", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 4,
              }}>⚠ Safety Note</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#b8d4f0", lineHeight: 1.65 }}>
                {drug.wt_note}
              </div>
            </div>
          )}

          {/* ISMP footer */}
          <div style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 8,
            color: "rgba(90,130,168,.6)", letterSpacing: .5,
            marginTop: 4,
          }}>
            ISMP High-Alert Medication · Requires heightened clinical vigilance · Verify with pharmacy
          </div>
        </div>

        {/* Footer actions */}
        <div style={{
          padding: "10px 18px",
          borderTop: "1px solid rgba(26,53,85,0.5)",
          display: "flex", gap: 8, alignItems: "center",
        }}>
          <button
            onClick={copyAlert}
            style={{
              padding: "7px 15px", borderRadius: 8, cursor: "pointer",
              border: `1px solid ${copied ? "rgba(61,255,160,.5)" : "rgba(0,229,192,.35)"}`,
              background: copied ? "rgba(61,255,160,.1)" : "rgba(0,229,192,.07)",
              color: copied ? "rgba(61,255,160,1)" : "rgba(0,229,192,1)",
              fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600,
              transition: "all .15s",
            }}
          >{copied ? "✓ Copied" : "Copy Alert"}</button>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "rgba(90,130,168,.6)", flex: 1 }}>
            Detected: <em style={{ color: "rgba(130,170,206,.7)" }}>{alert.typed}</em>
          </span>
          <button
            onClick={dismiss}
            style={{
              padding: "7px 15px", borderRadius: 8, cursor: "pointer",
              border: "1px solid rgba(26,53,85,.5)",
              background: "rgba(14,37,68,.5)",
              color: "rgba(90,130,168,1)",
              fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600,
            }}
          >I Acknowledge — Dismiss</button>
        </div>
      </div>
    </div>
  );
}