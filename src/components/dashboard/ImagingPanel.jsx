import React from "react";

export default function ImagingPanel({ imaging }) {
  const statusColors = {
    ordered: "#2a4d72",
    in_progress: "#f5a623",
    prelim: "#9b6dff",
    final: "#2ecc71",
    critical: "#ff5c6c",
  };

  const modalityIcons = {
    CXR: "🫁",
    CT: "💻",
    MRI: "🧲",
    US: "🔊",
    XR: "🦴",
    Echo: "🫀",
    EKG: "📈",
    Other: "🔍",
  };

  return (
    <div
      style={{
        background: "#0e2340",
        border: "1px solid #1e3a5f",
        borderLeft: "3px solid #9b6dff",
        borderRadius: "8px",
        padding: "10px",
        minHeight: "120px",
      }}
    >
      <h3 style={{ color: "#e8f4ff", fontSize: "12px", fontWeight: 600, margin: "0 0 8px 0", display: "flex", gap: "4px" }}>
        🫀 Imaging Ordered
      </h3>
      {imaging?.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "10px" }}>
          {imaging.slice(0, 4).map((img, idx) => (
            <div key={idx}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                <p style={{ color: "#e8f4ff", margin: 0, fontWeight: 500 }}>
                  <span style={{ marginRight: "4px" }}>
                    {modalityIcons[img.modalityType] || "🔍"}
                  </span>
                  {img.studyName}
                </p>
                <span
                  style={{
                    background: statusColors[img.readStatus] || "#2a4d72",
                    color: ["critical", "ordered"].includes(img.readStatus) ? "#fff" : "#050f1e",
                    padding: "2px 6px",
                    borderRadius: "3px",
                    fontSize: "8px",
                    fontWeight: 600,
                  }}
                >
                  {img.readStatus?.toUpperCase()}
                </span>
              </div>
              {img.impression && (
                <p style={{ color: "#4a7299", fontSize: "9px", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {img.impression}
                </p>
              )}
            </div>
          ))}
          {imaging.length > 4 && (
            <p style={{ color: "#4a7299", fontSize: "9px", margin: "4px 0 0 0" }}>
              +{imaging.length - 4} more
            </p>
          )}
        </div>
      ) : (
        <p style={{ color: "#4a7299", fontSize: "10px", margin: 0, fontStyle: "italic" }}>
          No imaging ordered yet
        </p>
      )}
    </div>
  );
}