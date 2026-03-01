import React from "react";

export default function DiagnosesPanel({ assessment, dischargeSummary }) {
  return (
    <div
      style={{
        background: "#0e2340",
        border: "1px solid #1e3a5f",
        borderLeft: "3px solid #9b6dff",
        borderRadius: "8px",
        padding: "10px",
        overflow: "auto",
        flex: 1,
        minHeight: 0,
      }}
    >
      <h3 style={{ color: "#e8f4ff", fontSize: "12px", fontWeight: 600, margin: "0 0 8px 0", display: "flex", gap: "4px" }}>
        🧠 Diagnoses
      </h3>

      {/* Initial Diagnosis */}
      <div style={{ marginBottom: "10px", paddingBottom: "10px", borderBottom: "1px solid #1e3a5f" }}>
        <p style={{ color: "#f5a623", fontSize: "10px", fontWeight: 600, margin: "0 0 4px 0", textTransform: "uppercase" }}>
          Initial Impression
        </p>
        {assessment?.initialDiagnosis ? (
          <>
            <p style={{ color: "#e8f4ff", fontSize: "11px", margin: "0 0 4px 0", fontWeight: 500 }}>
              {assessment.initialDiagnosis}
            </p>
            {assessment.initialIcd10 && (
              <p style={{ color: "#4a7299", fontSize: "9px", margin: 0, fontFamily: "JetBrains Mono" }}>
                {assessment.initialIcd10}
              </p>
            )}
          </>
        ) : (
          <p style={{ color: "#4a7299", fontSize: "10px", margin: 0, fontStyle: "italic" }}>
            Assessment not yet completed
          </p>
        )}
      </div>

      {/* Final Diagnosis */}
      <div>
        <p style={{ color: "#2ecc71", fontSize: "10px", fontWeight: 600, margin: "0 0 4px 0", textTransform: "uppercase" }}>
          Final Diagnosis
        </p>
        {dischargeSummary?.finalDiagnosis ? (
          <>
            <p style={{ color: "#e8f4ff", fontSize: "11px", margin: "0 0 4px 0", fontWeight: 500 }}>
              {dischargeSummary.finalDiagnosis}
            </p>
            {dischargeSummary.finalIcd10 && (
              <p style={{ color: "#4a7299", fontSize: "9px", margin: 0, fontFamily: "JetBrains Mono" }}>
                {dischargeSummary.finalIcd10}
              </p>
            )}
          </>
        ) : (
          <p style={{ color: "#4a7299", fontSize: "10px", margin: 0, fontStyle: "italic" }}>
            Pending — awaiting discharge
          </p>
        )}
      </div>
    </div>
  );
}