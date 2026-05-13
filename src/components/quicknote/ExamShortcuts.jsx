// ExamShortcuts.jsx
// Clickable phrase library for rapid physical exam documentation.
// Select from normal/abnormal findings per organ system — appends to exam textarea.

import { useState } from "react";

const EXAM_SYSTEMS = {
  General: {
    negative: [
      "Alert and oriented x4, in no acute distress",
      "Well-appearing, well-nourished",
      "No acute distress, comfortable at rest",
    ],
    positive: [
      "Appears ill, diaphoretic",
      "Pale, diaphoretic, ill-appearing",
      "Morbidly obese, labored breathing",
    ],
  },
  HEENT: {
    negative: [
      "Normocephalic, atraumatic. PERRL, EOMI. Oropharynx clear, no erythema or exudate. TMs clear bilaterally.",
      "No scleral icterus. Neck supple, no LAD, no meningismus.",
      "No facial droop. Tongue midline.",
    ],
    positive: [
      "Scleral icterus present",
      "Left TM erythematous with decreased mobility",
      "Pharyngeal erythema with tonsillar exudates",
      "Neck stiffness, positive Kernig's sign",
      "Facial droop — left sided",
    ],
  },
  Cardiovascular: {
    negative: [
      "Regular rate and rhythm. Normal S1 S2. No murmurs, rubs, or gallops. No JVD. Peripheral pulses 2+ and equal.",
      "No peripheral edema. Capillary refill < 2 seconds.",
    ],
    positive: [
      "Irregular rate and rhythm",
      "2/6 systolic ejection murmur at RUSB, radiating to carotids",
      "S3 gallop present",
      "JVD present at 45 degrees",
      "2+ pitting edema bilateral lower extremities",
      "Diminished peripheral pulses bilateral lower extremities",
    ],
  },
  Pulmonary: {
    negative: [
      "Clear to auscultation bilaterally. No wheezes, rales, or rhonchi. Respiratory effort unlabored.",
      "Good air movement bilaterally. Equal breath sounds.",
    ],
    positive: [
      "Diffuse expiratory wheezing",
      "Bilateral basilar crackles",
      "Decreased breath sounds at right base",
      "Rhonchi bilateral upper lobes",
      "Increased work of breathing, accessory muscle use",
      "Stridor present",
    ],
  },
  Abdomen: {
    negative: [
      "Soft, non-tender, non-distended. Bowel sounds present in all four quadrants. No guarding or rigidity.",
      "No hepatosplenomegaly. No pulsatile masses.",
    ],
    positive: [
      "Tenderness to palpation RLQ with guarding",
      "Tenderness RUQ, positive Murphy's sign",
      "Diffuse tenderness with involuntary guarding and rigidity",
      "Distended, tympanic. Hypoactive bowel sounds.",
      "Positive McBurney's point tenderness",
      "CVA tenderness right > left",
      "Pulsatile midline mass",
    ],
  },
  Musculoskeletal: {
    negative: [
      "Full range of motion all extremities. No edema. No bony tenderness.",
      "No joint swelling, erythema, or effusion.",
    ],
    positive: [
      "Point tenderness over distal radius",
      "Knee effusion with limited range of motion",
      "Erythema, warmth, and swelling left great toe",
      "Tenderness to palpation lumbar spine, paraspinal spasm",
      "Decreased ROM shoulder, positive impingement sign",
    ],
  },
  Neurological: {
    negative: [
      "Alert and oriented x4. CN II-XII intact. Motor 5/5 bilateral. Sensation intact. DTRs 2+ and equal. Gait normal.",
      "No focal deficits. Speech fluent and clear.",
    ],
    positive: [
      "Left-sided facial droop",
      "Right arm drift on pronator drift testing",
      "Slurred speech",
      "Ataxic gait",
      "Decreased sensation left lower extremity in stocking distribution",
      "NIHSS score documented separately",
    ],
  },
  Skin: {
    negative: [
      "Skin warm and dry. No rash, cyanosis, or jaundice.",
      "No petechiae or purpura.",
    ],
    positive: [
      "Erythematous macular rash diffuse",
      "Petechiae bilateral lower extremities",
      "Urticaria diffuse",
      "Wound with erythema, warmth, and purulent discharge",
      "Jaundice noted",
      "Cyanosis of the fingertips",
    ],
  },
  Psychiatric: {
    negative: [
      "Cooperative, appropriate affect. Normal mood and insight. No SI/HI. Thought process linear and goal-directed.",
    ],
    positive: [
      "Flat affect, diminished eye contact",
      "Endorses active suicidal ideation with plan",
      "Disorganized thought process",
      "Agitated, combative",
      "Auditory hallucinations reported",
    ],
  },
};

const SYSTEM_COLORS = {
  General: "#64748b",
  HEENT: "#3b82f6",
  Cardiovascular: "#ef4444",
  Pulmonary: "#06b6d4",
  Abdomen: "#f59e0b",
  Musculoskeletal: "#8b5cf6",
  Neurological: "#ec4899",
  Skin: "#84cc16",
  Psychiatric: "#a78bfa",
};

export default function ExamShortcuts({ onInsert }) {
  const [activeSystem, setActiveSystem] = useState("General");
  const [open, setOpen] = useState(false);
  const [inserted, setInserted] = useState(null);

  const handleInsert = (phrase) => {
    onInsert(phrase);
    setInserted(phrase);
    setTimeout(() => setInserted(null), 1500);
  };

  const col = SYSTEM_COLORS[activeSystem] || "#64748b";
  const sys = EXAM_SYSTEMS[activeSystem];

  return (
    <div style={{ marginTop: 6 }}>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          padding: "3px 11px", borderRadius: 6, cursor: "pointer",
          fontFamily: "'JetBrains Mono',monospace", fontSize: 8, fontWeight: 700,
          letterSpacing: .5, textTransform: "uppercase", transition: "all .15s",
          border: `1px solid ${open ? "rgba(0,229,192,.5)" : "rgba(42,79,122,.35)"}`,
          background: open ? "rgba(0,229,192,.1)" : "transparent",
          color: open ? "var(--qn-teal)" : "var(--qn-txt4)",
        }}
      >
        {open ? "▲ Exam Shortcuts" : "▼ Exam Shortcuts"}
      </button>

      {open && (
        <div style={{
          marginTop: 8, borderRadius: 10,
          background: "rgba(8,22,40,.75)", border: "1px solid rgba(42,79,122,.45)",
          padding: "11px 13px",
        }}>
          {/* System tabs */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 11 }}>
            {Object.keys(EXAM_SYSTEMS).map(sys => {
              const c = SYSTEM_COLORS[sys];
              const active = activeSystem === sys;
              return (
                <button key={sys} onClick={() => setActiveSystem(sys)}
                  style={{
                    padding: "3px 9px", borderRadius: 5, cursor: "pointer",
                    fontFamily: "'JetBrains Mono',monospace", fontSize: 7, fontWeight: 700,
                    letterSpacing: .4, transition: "all .12s",
                    border: `1px solid ${active ? c : "rgba(42,79,122,.35)"}`,
                    background: active ? `${c}22` : "transparent",
                    color: active ? c : "var(--qn-txt4)",
                  }}>
                  {sys}
                </button>
              );
            })}
          </div>

          {/* Negative findings */}
          <div style={{ marginBottom: 9 }}>
            <div style={{
              fontFamily: "'JetBrains Mono',monospace", fontSize: 7, fontWeight: 700,
              color: "rgba(61,255,160,.65)", letterSpacing: 1, textTransform: "uppercase",
              marginBottom: 5,
            }}>Normal / Negative</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {sys.negative.map((phrase, i) => (
                <button key={i} onClick={() => handleInsert(phrase)}
                  style={{
                    textAlign: "left", padding: "6px 10px", borderRadius: 7,
                    cursor: "pointer", transition: "all .12s",
                    border: inserted === phrase ? "1px solid rgba(61,255,160,.55)" : "1px solid rgba(42,79,122,.3)",
                    background: inserted === phrase ? "rgba(61,255,160,.1)" : "rgba(14,37,68,.5)",
                    color: inserted === phrase ? "var(--qn-green)" : "var(--qn-txt2)",
                    fontFamily: "'DM Sans',sans-serif", fontSize: 11,
                  }}
                >
                  {inserted === phrase ? "✓ Added" : phrase}
                </button>
              ))}
            </div>
          </div>

          {/* Positive findings */}
          <div>
            <div style={{
              fontFamily: "'JetBrains Mono',monospace", fontSize: 7, fontWeight: 700,
              color: "rgba(255,107,107,.65)", letterSpacing: 1, textTransform: "uppercase",
              marginBottom: 5,
            }}>Abnormal / Positive</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {sys.positive.map((phrase, i) => (
                <button key={i} onClick={() => handleInsert(phrase)}
                  style={{
                    padding: "4px 10px", borderRadius: 6, cursor: "pointer",
                    transition: "all .12s",
                    border: inserted === phrase ? "1px solid rgba(255,107,107,.7)" : "1px solid rgba(255,107,107,.3)",
                    background: inserted === phrase ? "rgba(255,107,107,.15)" : "rgba(255,107,107,.06)",
                    color: inserted === phrase ? "var(--qn-coral)" : "rgba(255,107,107,.8)",
                    fontFamily: "'DM Sans',sans-serif", fontSize: 10,
                  }}
                >
                  {inserted === phrase ? "✓" : "+"} {phrase}
                </button>
              ))}
            </div>
          </div>

          <div style={{
            marginTop: 10, fontFamily: "'JetBrains Mono',monospace", fontSize: 7,
            color: "var(--qn-txt4)", letterSpacing: .3,
          }}>
            Click any phrase to append it to the Physical Exam field.
          </div>
        </div>
      )}
    </div>
  );
}