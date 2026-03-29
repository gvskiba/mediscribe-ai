import { useState, useMemo } from "react";
import React from "react";

const T = {
  navy: "#050f1e", slate: "#0b1d35", panel: "#0e2340", edge: "#162d4f",
  border: "#1e3a5f", muted: "#2a4d72", dim: "#4a7299", text: "#c8ddf0",
  bright: "#e8f4ff", teal: "#00d4bc", amber: "#f5a623", red: "#ff5c6c",
  green: "#2ecc71", purple: "#9b6dff", rose: "#f472b6", blue: "#3b9eff",
};

const glass = (extra = {}) => ({
  backdropFilter: "blur(24px) saturate(200%)",
  WebkitBackdropFilter: "blur(24px) saturate(200%)",
  background: "rgba(8,22,40,0.75)",
  border: "1px solid rgba(30,58,95,0.55)",
  borderRadius: 16,
  ...extra,
});

// E&M Complexity Definitions
const EM_CODES_ED = [
  {
    code: "99281", name: "ED Visit — Problem Focused", rvu: 1.0,
    hpi: "Brief", ros: "Problem-pertinent", exam: "Limited", mdm: "Minimal/Self-limited",
    minHistory: 1, minExam: 1, minMDM: 1,
  },
  {
    code: "99282", name: "ED Visit — Expanded Problem Focused", rvu: 1.25,
    hpi: "Brief", ros: "Problem-pertinent", exam: "Expanded", mdm: "Low",
    minHistory: 1, minExam: 2, minMDM: 2,
  },
  {
    code: "99283", name: "ED Visit — Detailed", rvu: 1.5,
    hpi: "Detailed", ros: "Extended", exam: "Detailed", mdm: "Moderate",
    minHistory: 2, minExam: 2, minMDM: 3,
  },
  {
    code: "99284", name: "ED Visit — High Complexity", rvu: 2.0,
    hpi: "Comprehensive", ros: "Complete", exam: "Comprehensive", mdm: "High",
    minHistory: 3, minExam: 3, minMDM: 4,
  },
  {
    code: "99285", name: "ED Visit — Critical/Resuscitation", rvu: 2.5,
    hpi: "Comprehensive", ros: "Complete", exam: "Comprehensive", mdm: "Critical",
    minHistory: 3, minExam: 3, minMDM: 5,
  },
];

// Analyze clinical note content for complexity
function analyzeComplexity(noteData) {
  let hpiLevel = 0, rosLevel = 0, examLevel = 0, mdmLevel = 0;

  // HPI Complexity (1-3 points)
  if (noteData.history_of_present_illness) {
    const hpi = noteData.history_of_present_illness.length;
    if (hpi > 500) hpiLevel = 3; // Comprehensive
    else if (hpi > 200) hpiLevel = 2; // Detailed
    else hpiLevel = 1; // Brief
  }

  // ROS Complexity (1-3 points based on system count)
  if (noteData.review_of_systems) {
    const rosSystems = (noteData.review_of_systems.match(/\b(denies|reports|positive|negative|yes|no)\b/gi) || []).length;
    if (rosSystems >= 10) rosLevel = 3; // Complete
    else if (rosSystems >= 5) rosLevel = 2; // Extended
    else rosLevel = 1; // Problem-pertinent
  }

  // Physical Exam Complexity (1-3 points based on system count)
  if (noteData.physical_exam) {
    const examSystems = (noteData.physical_exam.match(/\b(HEENT|Neck|Chest|Heart|Lungs|Abdomen|Extremities|Neuro|Skin|Psych)\b/gi) || []).length;
    if (examSystems >= 8) examLevel = 3; // Comprehensive
    else if (examSystems >= 4) examLevel = 2; // Detailed
    else examLevel = 1; // Limited
  }

  // MDM Complexity (1-5 points)
  if (noteData.assessment || noteData.plan) {
    const fullContent = (noteData.assessment || "") + (noteData.plan || "");
    const diagnosisCount = (fullContent.match(/\d{1,3}\.\d{1,2}/g) || []).length; // ICD-10 codes
    const interventionCount = (fullContent.match(/\b(medication|procedure|imaging|admit|consult|discharge)\b/gi) || []).length;
    const riskFactors = (fullContent.match(/\b(critical|unstable|acute|severe|emergency)\b/gi) || []).length;

    if (riskFactors > 0 || diagnosisCount > 4) mdmLevel = 5; // Critical
    else if (diagnosisCount > 3 || interventionCount > 4) mdmLevel = 4; // High
    else if (diagnosisCount > 1 || interventionCount > 2) mdmLevel = 3; // Moderate
    else if (diagnosisCount > 0 || interventionCount > 0) mdmLevel = 2; // Low
    else mdmLevel = 1; // Minimal
  }

  return { hpiLevel, rosLevel, examLevel, mdmLevel };
}

// Calculate appropriate E&M code
function calculateEMCode(complexity) {
  const { hpiLevel, rosLevel, examLevel, mdmLevel } = complexity;
  const historyScore = Math.max(hpiLevel, rosLevel);
  const totalScore = Math.max(historyScore, examLevel, mdmLevel);

  // Find matching code (requires 2 of 3 elements)
  for (const code of [...EM_CODES_ED].reverse()) {
    const matches = [
      historyScore >= code.minHistory,
      examLevel >= code.minExam,
      mdmLevel >= code.minMDM,
    ].filter(Boolean).length;

    if (matches >= 2) return code;
  }

  return EM_CODES_ED[0]; // Default to 99281
}

export default function EMCalculator({ noteData: incomingNoteData }) {
  const [noteData, setNoteData] = useState({
    history_of_present_illness: "",
    review_of_systems: "",
    physical_exam: "",
    assessment: "",
    plan: "",
    patient_name: "",
    date_of_visit: new Date().toISOString().split("T")[0],
  });

  // Auto-fill from incoming note data
  React.useEffect(() => {
    if (incomingNoteData) {
      setNoteData(prev => ({
        ...prev,
        history_of_present_illness: incomingNoteData.history_of_present_illness || prev.history_of_present_illness,
        review_of_systems: incomingNoteData.review_of_systems || prev.review_of_systems,
        physical_exam: incomingNoteData.physical_exam || prev.physical_exam,
        assessment: incomingNoteData.assessment || prev.assessment,
        plan: incomingNoteData.plan || prev.plan,
        patient_name: incomingNoteData.patient_name || prev.patient_name,
        date_of_visit: incomingNoteData.date_of_visit || prev.date_of_visit,
      }));
    }
  }, [incomingNoteData]);

  const [showBreakdown, setShowBreakdown] = useState(false);

  const complexity = useMemo(() => analyzeComplexity(noteData), [noteData]);
  const emCode = useMemo(() => calculateEMCode(complexity), [complexity]);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
  };

  const complexityLabels = {
    1: "Limited / Problem-Focused",
    2: "Expanded",
    3: "Detailed",
    4: "High",
    5: "Critical",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, height: "100%" }}>
      {/* Input Section */}
      <div style={{ ...glass(), padding: "16px 18px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: T.dim, marginBottom: 5, textTransform: "uppercase", letterSpacing: ".05em" }}>
              Patient Name
            </label>
            <input
              type="text"
              placeholder="e.g., John Doe"
              value={noteData.patient_name}
              onChange={(e) => setNoteData({ ...noteData, patient_name: e.target.value })}
              style={{ width: "100%", background: "rgba(14,37,68,0.8)", border: "1px solid rgba(30,58,95,0.6)", borderRadius: 8, padding: "9px 12px", color: T.bright, fontSize: 13, outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: T.dim, marginBottom: 5, textTransform: "uppercase", letterSpacing: ".05em" }}>
              Date of Visit
            </label>
            <input
              type="date"
              value={noteData.date_of_visit}
              onChange={(e) => setNoteData({ ...noteData, date_of_visit: e.target.value })}
              style={{ width: "100%", background: "rgba(14,37,68,0.8)", border: "1px solid rgba(30,58,95,0.6)", borderRadius: 8, padding: "9px 12px", color: T.bright, fontSize: 13, outline: "none", boxSizing: "border-box" }}
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
          {[
            { key: "history_of_present_illness", label: "History of Present Illness" },
            { key: "review_of_systems", label: "Review of Systems" },
            { key: "physical_exam", label: "Physical Exam Findings" },
            { key: "assessment", label: "Assessment / Diagnoses" },
            { key: "plan", label: "Plan / Interventions" },
          ].map((field) => (
            <div key={field.key}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: T.dim, marginBottom: 5, textTransform: "uppercase", letterSpacing: ".05em" }}>
                {field.label}
              </label>
              <textarea
                placeholder="Paste or type the clinical content here…"
                value={noteData[field.key]}
                onChange={(e) => setNoteData({ ...noteData, [field.key]: e.target.value })}
                rows={3}
                style={{
                  width: "100%",
                  background: "rgba(14,37,68,0.8)",
                  border: "1px solid rgba(30,58,95,0.6)",
                  borderRadius: 8,
                  padding: "9px 12px",
                  color: T.bright,
                  fontSize: 13,
                  outline: "none",
                  boxSizing: "border-box",
                  resize: "vertical",
                  fontFamily: "DM Sans, sans-serif",
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Result Card */}
      <div style={{ ...glass({ background: `linear-gradient(135deg,${T.teal}18,rgba(8,22,40,0.85))`, borderColor: T.teal + "66" }), padding: "18px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
          <div>
            <div style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: T.teal, textTransform: "uppercase", letterSpacing: 2, marginBottom: 4 }}>
              Calculated Code
            </div>
            <div style={{ fontFamily: "Playfair Display", fontSize: 32, fontWeight: 700, color: T.bright, lineHeight: 1 }}>
              {emCode.code}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "DM Sans", fontSize: 14, fontWeight: 600, color: T.bright, marginBottom: 6 }}>
              {emCode.name}
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div>
                <span style={{ fontFamily: "JetBrains Mono", fontSize: 12, color: T.teal, fontWeight: 700 }}>
                  {emCode.rvu} RVU
                </span>
              </div>
              <div style={{ height: 1, width: 1, background: T.border }} />
              <div>
                <span style={{ fontFamily: "DM Sans", fontSize: 12, color: T.dim }}>
                  History: {emCode.hpi} · Exam: {emCode.exam} · MDM: {emCode.mdm}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => handleCopy(emCode.code)}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              background: T.teal + "22",
              border: `1px solid ${T.teal}55`,
              color: T.teal,
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "DM Sans",
            }}
          >
            📋 Copy Code
          </button>
        </div>

        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          style={{ fontSize: 12, color: T.dim, background: "transparent", border: "none", cursor: "pointer", textDecoration: "underline" }}
        >
          {showBreakdown ? "Hide Breakdown ▼" : "Show Breakdown ▶"}
        </button>
      </div>

      {/* Complexity Breakdown */}
      {showBreakdown && (
        <div className="proc-fade" style={{ ...glass(), padding: "16px 18px" }}>
          <div style={{ fontFamily: "Playfair Display", fontSize: 16, fontWeight: 700, color: T.bright, marginBottom: 12 }}>
            Complexity Analysis
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
            {[
              { label: "HPI", value: complexity.hpiLevel, color: T.purple },
              { label: "ROS", value: complexity.rosLevel, color: T.rose },
              { label: "Exam", value: complexity.examLevel, color: T.blue },
              { label: "MDM", value: complexity.mdmLevel, color: T.green },
            ].map((item) => (
              <div key={item.label} style={{ ...glass({ background: `${item.color}12`, borderColor: `${item.color}44` }), padding: "12px 14px", textAlign: "center" }}>
                <div style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: item.color, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
                  {item.label}
                </div>
                <div style={{ fontFamily: "Playfair Display", fontSize: 24, fontWeight: 700, color: item.color, marginBottom: 6 }}>
                  {item.value}/3
                </div>
                <div style={{ fontSize: 10, color: T.dim }}>
                  {complexityLabels[item.value]}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 12, color: T.text, lineHeight: 1.6 }}>
              <strong style={{ color: T.bright }}>E&M Calculation Logic:</strong>
              <br />
              Based on AMA/CMS guidelines, a code requires <strong>2 of 3</strong> key elements: History, Exam, and Medical Decision Making.
              <br />
              <br />
              <strong>Your Result:</strong> {emCode.code} requires History ≥{emCode.minHistory}, Exam ≥{emCode.minExam}, and MDM ≥{emCode.minMDM}.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}