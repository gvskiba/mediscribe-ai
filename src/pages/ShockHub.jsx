import { useState } from "react";

const T = {
  bg: "#050f1e", panel: "#081628", card: "#0b1e36", up: "#0e2544",
  txt: "#e8f0fe", txt2: "#8aaccc", txt3: "#4a6a8a", txt4: "#2e4a6a",
  red: "#ff4444", coral: "#ff6b6b", orange: "#ff9f43",
  yellow: "#f5c842", green: "#3dffa0", teal: "#00e5c0",
  blue: "#3b9eff", purple: "#9b6dff", cyan: "#00d4ff",
};

const glass = {
  backdropFilter: "blur(24px) saturate(200%)",
  WebkitBackdropFilter: "blur(24px) saturate(200%)",
  background: "rgba(8,22,40,0.78)",
  border: "1px solid rgba(42,79,122,0.35)",
  borderRadius: 14,
};

const SHOCK_TYPES = [
  {
    id: "septic",
    name: "Septic Shock",
    icon: "🦠",
    color: T.yellow,
    definition: "Infection + hypotension despite fluid resuscitation",
    lactate: "> 2 mmol/L",
    resuscitation: "Early broad-spectrum antibiotics, lactate-directed fluids, vasopressors",
    physiology: "Vasodilation, endothelial dysfunction, maldistribution",
    targets: "MAP ≥ 65, ScvO₂ ≥ 70%, urine output ≥ 0.5 mL/kg/hr",
  },
  {
    id: "cardiogenic",
    name: "Cardiogenic Shock",
    icon: "🫀",
    color: T.coral,
    definition: "Pump failure → reduced cardiac output + hypotension",
    lactate: "> 2 mmol/L (due to poor perfusion)",
    resuscitation: "Inotropes (dobutamine/milrinone), vasopressors, mechanical support",
    physiology: "Reduced ejection fraction, elevated filling pressures",
    targets: "MAP ≥ 65, CI ≥ 2.2, wedge < 18, urine output ≥ 0.5 mL/kg/hr",
  },
  {
    id: "hypovolemic",
    name: "Hypovolemic Shock",
    icon: "🩸",
    color: T.red,
    definition: "Inadequate intravascular volume → reduced preload",
    lactate: "> 2 mmol/L (poor tissue perfusion)",
    resuscitation: "Rapid fluid bolus 30 mL/kg, activate massive transfusion, hemorrhage control",
    physiology: "Reduced venous return, tachycardia, vasoconstriction",
    targets: "MAP ≥ 65, HR < 100, urine output ≥ 0.5 mL/kg/hr",
  },
  {
    id: "obstructive",
    name: "Obstructive Shock",
    icon: "🫁",
    color: T.orange,
    definition: "Mechanical obstruction to blood flow (PE, tamponade, tension PTX)",
    lactate: "> 2 mmol/L (pump failure consequence)",
    resuscitation: "Fluid may worsen (tamponade) — treat cause: decompress PTX, pericardiocentesis, thrombolytics",
    physiology: "Increased afterload, reduced preload (variable)",
    targets: "MAP ≥ 65, CVP normalized, urine output ≥ 0.5 mL/kg/hr",
  },
  {
    id: "distributive",
    name: "Distributive Shock (Non-septic)",
    icon: "🌡️",
    color: T.purple,
    definition: "Vasodilation + maldistribution (anaphylaxis, spinal, SIRS)",
    lactate: "> 2 mmol/L (vasodilation + mismatch)",
    resuscitation: "Fluids, vasopressors, treat cause (epinephrine for anaphylaxis, spinal precautions)",
    physiology: "Vasodilation, loss of autoregulation",
    targets: "MAP ≥ 65, ScvO₂ ≥ 70%, urine output ≥ 0.5 mL/kg/hr",
  },
];

const MANAGEMENT_STEPS = [
  {
    phase: "Recognize Shock",
    color: T.red,
    items: [
      "SBP < 90 mmHg OR MAP < 65 mmHg for > 5 min",
      "Signs of hypoperfusion: altered mental status, cool extremities, oliguria, lactate > 2",
      "Do NOT wait for normal lactate to treat (lactate is LATE finding)",
    ],
  },
  {
    phase: "Immediate Actions (First 10 minutes)",
    color: T.coral,
    items: [
      "Call for help — two-person team minimum",
      "100% O₂, supplemental as needed — target SpO₂ ≥ 95%",
      "Place on cardiac monitor, continuous pulse ox, cuff BP q5 min",
      "Establish two large-bore IVs (18g or larger)",
      "Draw labs: CBC, CMP, lactate, PT/PTT, blood cultures (if sepsis suspected), type & cross",
      "Start fluid bolus immediately (see type-specific)",
      "Have vasopressors drawn up (epinephrine, norepinephrine, phenylephrine)",
    ],
  },
  {
    phase: "Identify Shock Type (AMPLE + Exam)",
    color: T.orange,
    items: [
      "Allergies? Medications? PMH? Last meal? Events leading up?",
      "Vital signs trend — when did BP start falling? Progressive or sudden?",
      "Skin: warm/dry (sepsis), cool/clammy (hypovolemic/cardiogenic), asymmetric (PE/aortic)?",
      "JVD? (elevated in cardiogenic, obstructive; flat in hypovolemic)",
      "Lung sounds? (crackles → pulmonary edema/cardiogenic; clear → distributive/septic)",
      "Abdomen? (bleeding, free fluid, peritonitis, pulsatile mass)",
      "Recent trauma, surgery, transfusion reactions?",
      "CXR, ECG, labs, point-of-care ultrasound (POCUS) if available",
    ],
  },
  {
    phase: "Fluid Resuscitation & Vasopressor Selection",
    color: T.yellow,
    items: [
      "Hypovolemic: Normal saline 30 mL/kg bolus, activate MTP for hemorrhage",
      "Septic: Normal saline 30 mL/kg, consider vasopressor if SBP remains < 90 after fluids",
      "Cardiogenic: CAUTION with fluids — may worsen pulmonary edema. Use inotropes first",
      "Obstructive: Fluids depend on type (PE: caution; tamponade: fluids can help transiently)",
      "Distributive (anaphylaxis): Epinephrine 0.3–0.5 mg IM immediately, then fluids + antihistamines",
    ],
  },
  {
    phase: "Vasopressor Initiation",
    color: T.blue,
    items: [
      "Norepinephrine: first-line for most shock types (septic, cardiogenic, distributive)",
      "Epinephrine: second-line or anaphylaxis (IM first if true anaphylaxis)",
      "Phenylephrine: pure alpha-1, use if tachycardia problematic (but reduces CO)",
      "Dosing: norepinephrine 0.01–3 mcg/kg/min titrated to MAP ≥ 65",
      "Infuse through central line if available; peripheral acceptable in acute setting",
    ],
  },
  {
    phase: "Source Control & Diagnostics",
    color: T.green,
    items: [
      "Sepsis: Blood cultures, broad-spectrum antibiotics within 1 hour, source removal (abscess drainage, etc.)",
      "Hemorrhagic: Activate MTP, direct hemostasis (tourniquet, pelvic binder, pressure), OR notification",
      "PE: Thrombolytics or embolectomy consideration if massive + hemodynamically unstable",
      "Tamponade: Pericardiocentesis if suspected (Beck's triad: JVD, muffled heart sounds, hypotension)",
      "Tension PTX: Needle decompression (2nd ICS midclavicular), then chest tube",
    ],
  },
];

const MONITORING = [
  { param: "Blood Pressure", target: "MAP ≥ 65 mmHg", method: "Continuous cuff or A-line" },
  { param: "Heart Rate", target: "< 100 bpm (variable by type)", method: "Continuous cardiac monitor" },
  { param: "Oxygen Saturation", target: "≥ 95%", method: "Pulse oximetry, ABG if hypoxic" },
  { param: "Lactate", target: "Trend down (< 2 mmol/L normal)", method: "Venous or arterial gas q1–2h" },
  { param: "Urine Output", target: "≥ 0.5 mL/kg/hr", method: "Foley catheter, hourly checks" },
  { param: "ScvO₂", target: "≥ 70% (if central line)", method: "Central venous catheter blood gas" },
];

export default function ShockHub() {
  const [activeType, setActiveType] = useState("septic");
  const [activeTab, setActiveTab] = useState("types");

  const activeShock = SHOCK_TYPES.find(s => s.id === activeType);

  return (
    <div style={{ fontFamily: "DM Sans, sans-serif", background: T.bg, minHeight: "100vh", color: T.txt }}>
      {/* Header */}
      <div style={{ background: T.panel, borderBottom: `1px solid rgba(42,79,122,0.4)`, padding: "20px 24px" }}>
        <h1 style={{ fontFamily: "Playfair Display", fontSize: 28, fontWeight: 900, margin: "0 0 8px 0" }}>
          🚨 Shock Hub
        </h1>
        <p style={{ fontSize: 12, color: T.txt3, margin: 0 }}>
          Classification · Management protocols · Lactate-directed resuscitation
        </p>
      </div>

      {/* Tabs */}
      <div style={{ padding: "16px 24px", borderBottom: `1px solid rgba(42,79,122,0.2)` }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            { id: "types", label: "Shock Types", icon: "📊" },
            { id: "management", label: "Management", icon: "⚡" },
            { id: "monitoring", label: "Monitoring", icon: "📈" },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                background: activeTab === t.id ? "rgba(59,158,255,0.15)" : "transparent",
                border: `1px solid ${activeTab === t.id ? "rgba(59,158,255,0.4)" : "rgba(42,79,122,0.3)"}`,
                color: activeTab === t.id ? T.blue : T.txt3,
                fontFamily: "DM Sans",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "24px" }}>
        {activeTab === "types" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: 24 }}>
              {SHOCK_TYPES.map(s => (
                <button
                  key={s.id}
                  onClick={() => setActiveType(s.id)}
                  style={{
                    ...glass,
                    padding: "14px 12px",
                    borderLeft: `4px solid ${s.color}`,
                    border: `1px solid ${activeType === s.id ? s.color + "66" : "rgba(42,79,122,0.35)"}`,
                    borderLeftColor: s.color,
                    background: activeType === s.id ? `linear-gradient(135deg,${s.color}12,rgba(8,22,40,0.8))` : glass.background,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: 12, color: s.color }}>{s.name}</div>
                </button>
              ))}
            </div>

            {activeShock && (
              <div style={{ ...glass, padding: "20px 24px" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: activeShock.color, marginBottom: 12 }}>
                  {activeShock.icon} {activeShock.name}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
                  {[
                    { label: "Definition", value: activeShock.definition, color: activeShock.color },
                    { label: "Lactate", value: activeShock.lactate, color: activeShock.color },
                    { label: "Physiology", value: activeShock.physiology, color: activeShock.color },
                    { label: "Resuscitation", value: activeShock.resuscitation, color: activeShock.color },
                    { label: "Targets", value: activeShock.targets, color: activeShock.color },
                  ].map((item, i) => (
                    <div key={i} style={{ padding: "10px 12px", background: `${item.color}08`, border: `1px solid ${item.color}22`, borderRadius: 10 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: item.color, textTransform: "uppercase", marginBottom: 6 }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: 12, color: T.txt2, lineHeight: 1.5 }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "management" && (
          <div style={{ display: "grid", gap: 12 }}>
            {MANAGEMENT_STEPS.map((step, i) => (
              <div key={i} style={{ ...glass, padding: "16px 18px", borderLeft: `4px solid ${step.color}` }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: step.color, marginBottom: 10 }}>
                  {step.phase}
                </div>
                {step.items.map((item, j) => (
                  <div key={j} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "flex-start" }}>
                    <span style={{ color: step.color, marginTop: 2, flexShrink: 0 }}>▸</span>
                    <span style={{ fontSize: 12, color: T.txt2, lineHeight: 1.5 }}>{item}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {activeTab === "monitoring" && (
          <div style={{ ...glass, padding: "20px 24px" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid rgba(42,79,122,0.4)` }}>
                    <th style={{ textAlign: "left", padding: "12px 8px", color: T.teal, fontWeight: 700, fontSize: 12 }}>
                      Parameter
                    </th>
                    <th style={{ textAlign: "left", padding: "12px 8px", color: T.teal, fontWeight: 700, fontSize: 12 }}>
                      Target
                    </th>
                    <th style={{ textAlign: "left", padding: "12px 8px", color: T.teal, fontWeight: 700, fontSize: 12 }}>
                      Monitoring Method
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {MONITORING.map((row, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid rgba(42,79,122,0.2)`, background: i % 2 === 0 ? "rgba(14,37,68,0.2)" : "transparent" }}>
                      <td style={{ padding: "12px 8px", fontSize: 12, fontWeight: 600, color: T.txt }}>{row.param}</td>
                      <td style={{ padding: "12px 8px", fontSize: 12, color: T.txt2 }}>{row.target}</td>
                      <td style={{ padding: "12px 8px", fontSize: 12, color: T.txt3 }}>{row.method}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}