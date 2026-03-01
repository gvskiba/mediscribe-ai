import React from "react";

export default function LabsPanel({ labs }) {
  const statusColors = {
    ordered: "#2a4d72",
    pending: "#f5a623",
    resulted: "#00d4bc",
    critical: "#ff5c6c",
    final: "#2ecc71",
  };

  return (
    <div
      style={{
        background: "#0e2340",
        border: "1px solid #1e3a5f",
        borderLeft: "3px solid #00d4bc",
        borderRadius: "8px",
        padding: "10px",
        minHeight: "120px",
      }}
    >
      <h3 style={{ color: "#e8f4ff", fontSize: "12px", fontWeight: 600, margin: "0 0 8px 0", display: "flex", gap: "4px" }}>
        🔬 Labs Ordered
      </h3>
      {labs?.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "10px" }}>
          {labs.slice(0, 4).map((lab, idx) => (
            <div key={idx}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                <p style={{ color: "#e8f4ff", margin: 0, fontWeight: 500 }}>
                  {lab.panelName}
                </p>
                <span
                  style={{
                    background: statusColors[lab.resultStatus] || "#2a4d72",
                    color: lab.resultStatus === "critical" ? "#fff" : "#050f1e",
                    padding: "2px 6px",
                    borderRadius: "3px",
                    fontSize: "9px",
                    fontWeight: 600,
                  }}
                >
                  {lab.resultStatus?.toUpperCase()}
                </span>
              </div>
              {lab.criticalFlag && (
                <p style={{ color: "#ff5c6c", fontSize: "9px", margin: 0 }}>🚨 Critical value</p>
              )}
            </div>
          ))}
          {labs.length > 4 && (
            <p style={{ color: "#4a7299", fontSize: "9px", margin: "4px 0 0 0" }}>
              +{labs.length - 4} more
            </p>
          )}
        </div>
      ) : (
        <p style={{ color: "#4a7299", fontSize: "10px", margin: 0, fontStyle: "italic" }}>
          No lab orders yet
        </p>
      )}
    </div>
  );
}