import React from "react";

export default function AbnormalFindingsPanel({ vitals, labs, imaging }) {
  const getAbnormalFindings = () => {
    const findings = [];

    // Check vitals
    if (vitals?.[0]) {
      const v = vitals[0];
      if (v.spo2 < 95) findings.push({ type: "critical", text: `SpO₂ ${v.spo2}% - Low oxygen` });
      if (v.heartRate > 100) findings.push({ type: "warning", text: `HR ${v.heartRate} - Tachycardia` });
      if (v.temperature > 101) findings.push({ type: "warning", text: `Fever ${v.temperature}°F` });
    }

    // Check labs
    const criticalLabs = labs?.filter(l => l.criticalFlag);
    if (criticalLabs?.length) {
      findings.push({ type: "critical", text: `${criticalLabs.length} critical lab value(s)` });
    }

    // Check imaging
    const criticalImaging = imaging?.filter(i => i.readStatus === "critical");
    if (criticalImaging?.length) {
      findings.push({ type: "critical", text: `${criticalImaging.length} critical imaging finding(s)` });
    }

    return findings;
  };

  const findings = getAbnormalFindings();
  const severityIcons = { critical: "🚨", warning: "⚠️", abnormal: "📍" };
  const severityColors = { critical: "#ff5c6c", warning: "#f5a623", abnormal: "#f472b6" };

  return (
    <div
      style={{
        background: "#0e2340",
        border: "1px solid #1e3a5f",
        borderLeft: "3px solid #ff5c6c",
        borderRadius: "8px",
        padding: "10px",
        overflow: "auto",
        flex: 1,
        minHeight: 0,
      }}
    >
      <h3 style={{ color: "#e8f4ff", fontSize: "12px", fontWeight: 600, margin: "0 0 8px 0", display: "flex", gap: "4px" }}>
        ⚠️ Abnormal Findings
      </h3>
      {findings.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {findings.map((finding, idx) => (
            <div key={idx} style={{ display: "flex", gap: "6px", alignItems: "flex-start" }}>
              <span style={{ fontSize: "14px", minWidth: "14px", lineHeight: "1.4" }}>
                {severityIcons[finding.type]}
              </span>
              <p
                style={{
                  color: severityColors[finding.type],
                  fontSize: "10px",
                  margin: 0,
                  lineHeight: "1.4",
                }}
              >
                {finding.text}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ color: "#4a7299", fontSize: "10px", margin: 0, fontStyle: "italic" }}>
          No significant abnormal findings detected
        </p>
      )}
    </div>
  );
}