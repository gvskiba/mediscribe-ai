import React, { useState, useMemo, useEffect } from "react";
import { Copy, AlertCircle } from "lucide-react";

const T = {
  navy: "#050f1e",
  slate: "#0b1d35",
  panel: "#0e2340",
  edge: "#162d4f",
  border: "#1e3a5f",
  muted: "#2a4d72",
  dim: "#4a7299",
  text: "#c8ddf0",
  bright: "#e8f4ff",
  teal: "#00d4bc",
  amber: "#f5a623",
  red: "#ff5c6c",
  green: "#2ecc71",
};

const DRUG_DATABASE = [
  {
    id: "epinephrine",
    name: "Epinephrine (IV)",
    icon: "💉",
    dosages: [
      { condition: "Cardiac Arrest", dose: 0.01, unit: "mg/kg", frequency: "Every 3-5 min", max: "1 mg/dose" },
      { condition: "Anaphylaxis (IM)", dose: 0.01, unit: "mg/kg", frequency: "Single dose", max: "0.5 mg" },
      { condition: "Septic Shock (Infusion)", dose: "0.1-1.4 mcg/kg/min", unit: "mcg/kg/min", frequency: "Titrate", max: "Varies" },
    ],
  },
  {
    id: "amiodarone",
    name: "Amiodarone",
    icon: "⚡",
    dosages: [
      { condition: "VF/pVT (Arrest)", dose: 300, unit: "mg IV push", frequency: "First dose", note: "Then 150 mg at 3-5 min" },
      { condition: "Stable VT/SVT", dose: 150, unit: "mg IV over 10 min", frequency: "Initial", note: "Repeat q10 min up to 2.2 g/day" },
    ],
  },
  {
    id: "atropine",
    name: "Atropine",
    icon: "🧠",
    dosages: [
      { condition: "Bradycardia", dose: 0.5, unit: "mg IV", frequency: "Repeat q3-5 min", max: "3 mg total" },
      { condition: "Cardiac Arrest", dose: 1, unit: "mg IV", frequency: "One dose", note: "May repeat q3-5 min" },
      { condition: "Organophosphate", dose: 2, unit: "mg IV", frequency: "Repeat q5-10 min", note: "Titrate until atropinization" },
    ],
  },
  {
    id: "succinylcholine",
    name: "Succinylcholine (RSI)",
    icon: "🫁",
    dosages: [
      { condition: "Intubation", dose: 1.5, unit: "mg/kg IV", frequency: "Single dose", max: "100 mg" },
      { condition: "Pediatric", dose: 2, unit: "mg/kg IV", frequency: "Single dose", max: "150 mg" },
    ],
  },
  {
    id: "ketamine",
    name: "Ketamine",
    icon: "😴",
    dosages: [
      { condition: "RSI (Induction)", dose: 1, unit: "mg/kg IV", frequency: "Single dose", max: "100 mg" },
      { condition: "Sedation", dose: 0.5, unit: "mg/kg IV", frequency: "Titrate", note: "Repeat q10-15 min PRN" },
      { condition: "Analgesia", dose: 0.3, unit: "mg/kg IV", frequency: "Repeat q15-30 min", note: "Reduces hemodynamic effects" },
    ],
  },
  {
    id: "propofol",
    name: "Propofol",
    icon: "💤",
    dosages: [
      { condition: "RSI (Induction)", dose: 1.5, unit: "mg/kg IV", frequency: "Single dose", max: "120 mg" },
      { condition: "Sedation (Infusion)", dose: "25-75", unit: "mcg/kg/min", frequency: "Titrate", note: "Reduce if hypotensive" },
    ],
  },
  {
    id: "rocuronium",
    name: "Rocuronium",
    icon: "🔒",
    dosages: [
      { condition: "RSI (Paralysis)", dose: 1.2, unit: "mg/kg IV", frequency: "Single dose", max: "100 mg" },
      { condition: "Maintenance", dose: 0.15, unit: "mg/kg IV", frequency: "PRN (5-10 min)", note: "Monitor via train-of-four" },
    ],
  },
  {
    id: "fentanyl",
    name: "Fentanyl",
    icon: "💊",
    dosages: [
      { condition: "Analgesia (IV)", dose: 1, unit: "mcg/kg IV", frequency: "Titrate", max: "100 mcg/dose" },
      { condition: "Sedation", dose: 0.5, unit: "mcg/kg IV", frequency: "Repeat q10-15 min", max: "50 mcg/dose" },
      { condition: "Procedural", dose: 1, unit: "mcg/kg IV", frequency: "Single dose", max: "100 mcg" },
    ],
  },
  {
    id: "midazolam",
    name: "Midazolam",
    icon: "💤",
    dosages: [
      { condition: "Sedation (IV)", dose: 0.05, unit: "mg/kg IV", frequency: "Titrate q2-3 min", max: "4 mg/dose" },
      { condition: "Seizure (IM/Buccal)", dose: 0.1, unit: "mg/kg", frequency: "Single dose", max: "10 mg" },
      { condition: "Intubation (IV)", dose: 0.1, unit: "mg/kg IV", frequency: "Single dose", max: "8 mg" },
    ],
  },
  {
    id: "vasopressin",
    name: "Vasopressin",
    icon: "🩸",
    dosages: [
      { condition: "Cardiac Arrest", dose: 40, unit: "units IV push", frequency: "Single dose (replaces 1 Epi)", note: "Given once during arrest" },
    ],
  },
  {
    id: "sodium-bicarb",
    name: "Sodium Bicarbonate",
    icon: "⚗️",
    dosages: [
      { condition: "TCA Overdose", dose: 1, unit: "mEq/kg IV", frequency: "Repeat q2-5 min", note: "Target pH 7.45-7.55" },
      { condition: "Metabolic Acidosis", dose: "Calculated", unit: "by formula", frequency: "Titrate", note: "0.3 × kg × (HCO3 deficit)" },
    ],
  },
  {
    id: "dextrose",
    name: "Dextrose (D50)",
    icon: "🍬",
    dosages: [
      { condition: "Hypoglycemia", dose: 0.5, unit: "g/kg IV", frequency: "Single dose", note: "0.5 g/kg = 1 mL/kg of D50" },
      { condition: "Pediatric", dose: 0.25, unit: "g/kg IV", frequency: "Single dose", note: "Use D25 or D10 to avoid extravasation" },
    ],
  },
  {
    id: "calcium",
    name: "Calcium Chloride",
    icon: "🧂",
    dosages: [
      { condition: "Hypocalcemia", dose: 10, unit: "mg/kg IV", frequency: "Over 5-10 min", max: "1000 mg/dose" },
      { condition: "Hyperkalemia", dose: 10, unit: "mg/kg IV", frequency: "Over 2-5 min", note: "Repeat if widened QRS" },
    ],
  },
  {
    id: "magnesium",
    name: "Magnesium Sulfate",
    icon: "✨",
    dosages: [
      { condition: "Torsades de Pointes", dose: 1, unit: "g IV", frequency: "Over 5-20 min", max: "2 g" },
      { condition: "Eclampsia", dose: 4, unit: "g IV", frequency: "Over 20 min", note: "Then 1-2 g/h infusion" },
    ],
  },
  {
    id: "naloxone",
    name: "Naloxone (Narcan)",
    icon: "🚨",
    dosages: [
      { condition: "Opioid Overdose (IV)", dose: 0.04, unit: "mg/kg IV", frequency: "Repeat q2-3 min", max: "10 mg" },
      { condition: "Opioid Overdose (IM/IN)", dose: 0.04, unit: "mg/kg", frequency: "Repeat q2-3 min", max: "10 mg" },
    ],
  },
  {
    id: "flumazenil",
    name: "Flumazenil",
    icon: "💊",
    dosages: [
      { condition: "Benzodiazepine Overdose", dose: 0.01, unit: "mg/kg IV", frequency: "Repeat q1 min", max: "0.2 mg/dose, 1 mg total" },
    ],
  },
];

export default function QuickDrugDosingCalculator() {
  const [weight, setWeight] = useState("");
  const [selectedDrug, setSelectedDrug] = useState(DRUG_DATABASE[0].id);
  const [selectedDosage, setSelectedDosage] = useState(0);
  const [calculatedDose, setCalculatedDose] = useState(null);

  const drug = useMemo(() => DRUG_DATABASE.find(d => d.id === selectedDrug), [selectedDrug]);
  const dosageInfo = drug?.dosages[selectedDosage] || {};

  const calculateDose = () => {
    if (!weight || isNaN(weight) || weight <= 0) {
      setCalculatedDose(null);
      return;
    }

    const w = parseFloat(weight);
    const doseStr = dosageInfo.dose?.toString() || "";

    let result = null;
    if (doseStr.includes("-")) {
      const [min, max] = doseStr.split("-").map(d => parseFloat(d));
      result = `${(min * w).toFixed(1)}-${(max * w).toFixed(1)}`;
    } else if (!isNaN(doseStr)) {
      result = (parseFloat(doseStr) * w).toFixed(1);
    } else {
      result = doseStr;
    }

    setCalculatedDose({
      dose: result,
      unit: dosageInfo.unit,
      frequency: dosageInfo.frequency || "",
      max: dosageInfo.max || "",
      note: dosageInfo.note || "",
    });
  };

  useEffect(() => {
    if (weight) calculateDose();
  }, [weight, selectedDrug, selectedDosage]);

  const copyToClipboard = () => {
    const text = `${drug.name} (${dosageInfo.condition}): ${calculatedDose.dose} ${calculatedDose.unit}${calculatedDose.frequency ? ` - ${calculatedDose.frequency}` : ""}`;
    navigator.clipboard.writeText(text);
  };

  return (
    <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 13, overflow: "hidden" }}>
      <div style={{ padding: "16px 18px", background: "rgba(22,45,79,0.9)", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.bright }}>💊 Quick Drug Dosing Calculator</div>
        <div style={{ fontSize: 11, color: T.dim, marginTop: 2 }}>Emergency medication weight-based dosing</div>
      </div>

      <div style={{ padding: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Left Column: Inputs */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Weight Input */}
          <div>
            <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: T.dim, marginBottom: 6 }}>
              Patient Weight (kg) <span style={{ color: T.amber }}>*</span>
            </label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="e.g., 70"
              style={{
                width: "100%",
                background: T.edge,
                border: `1px solid ${T.border}`,
                borderRadius: 8,
                padding: "10px 12px",
                color: T.bright,
                fontSize: 13,
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Drug Selection */}
          <div>
            <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: T.dim, marginBottom: 6 }}>
              Medication
            </label>
            <select
              value={selectedDrug}
              onChange={(e) => {
                setSelectedDrug(e.target.value);
                setSelectedDosage(0);
              }}
              style={{
                width: "100%",
                background: T.edge,
                border: `1px solid ${T.border}`,
                borderRadius: 8,
                padding: "10px 12px",
                color: T.bright,
                fontSize: 13,
              }}
            >
              {DRUG_DATABASE.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.icon} {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Condition/Dosage Selection */}
          <div>
            <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: T.dim, marginBottom: 6 }}>
              Clinical Condition
            </label>
            <select
              value={selectedDosage}
              onChange={(e) => setSelectedDosage(parseInt(e.target.value))}
              style={{
                width: "100%",
                background: T.edge,
                border: `1px solid ${T.border}`,
                borderRadius: 8,
                padding: "10px 12px",
                color: T.bright,
                fontSize: 13,
              }}
            >
              {drug?.dosages.map((d, idx) => (
                <option key={idx} value={idx}>
                  {d.condition}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Column: Result */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {calculatedDose ? (
            <>
              <div style={{ background: "rgba(0,212,188,0.08)", border: `1px solid rgba(0,212,188,0.25)`, borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 11, color: T.dim, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                  Calculated Dosage
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: T.teal, fontFamily: "JetBrains Mono, monospace", marginBottom: 4 }}>
                  {calculatedDose.dose}
                </div>
                <div style={{ fontSize: 12, color: T.text, marginBottom: 8 }}>
                  {calculatedDose.unit}
                </div>

                {calculatedDose.frequency && (
                  <div style={{ fontSize: 11, color: T.dim, marginBottom: 6 }}>
                    <strong style={{ color: T.text }}>Frequency:</strong> {calculatedDose.frequency}
                  </div>
                )}

                {calculatedDose.max && (
                  <div style={{ fontSize: 11, color: T.amber, display: "flex", gap: 6 }}>
                    <AlertCircle style={{ width: 14, height: 14, flexShrink: 0, marginTop: 1 }} />
                    <span>
                      <strong>Max:</strong> {calculatedDose.max}
                    </span>
                  </div>
                )}

                {calculatedDose.note && (
                  <div style={{ fontSize: 11, color: T.dim, marginTop: 8, paddingTop: 8, borderTop: `1px solid rgba(200,221,240,0.1)` }}>
                    <strong style={{ color: T.text }}>Note:</strong> {calculatedDose.note}
                  </div>
                )}

                <button
                  onClick={copyToClipboard}
                  style={{
                    marginTop: 10,
                    width: "100%",
                    padding: "8px 12px",
                    background: "rgba(0,212,188,0.15)",
                    border: `1px solid rgba(0,212,188,0.3)`,
                    borderRadius: 6,
                    color: T.teal,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <Copy style={{ width: 12, height: 12 }} /> Copy Dosing
                </button>
              </div>
            </>
          ) : (
            <div style={{ background: "rgba(74,114,153,0.1)", border: `1px solid rgba(74,114,153,0.2)`, borderRadius: 10, padding: 16, textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>💊</div>
              <div style={{ fontSize: 12, color: T.dim }}>Enter patient weight to calculate dosage</div>
            </div>
          )}
        </div>
      </div>

      {/* Drug Notes Footer */}
      <div style={{ background: "rgba(11,29,53,0.5)", borderTop: `1px solid ${T.border}`, padding: "12px 16px" }}>
        <div style={{ fontSize: 10, color: T.muted, display: "flex", gap: 8 }}>
          <AlertCircle style={{ width: 12, height: 12, flexShrink: 0, marginTop: 1 }} />
          <span>
            <strong>Clinical Note:</strong> Always verify dosing with current guidelines and institutional protocols. This calculator is for reference only.
          </span>
        </div>
      </div>
    </div>
  );
}