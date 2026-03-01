import React from "react";

export default function ClinicalSummaryPanel({ encounter }) {
  return (
    <div
      style={{
        background: "#0e2340",
        border: "1px solid #1e3a5f",
        borderLeft: "3px solid #00d4bc",
        borderRadius: "8px",
        padding: "10px",
        overflow: "auto",
        flex: 1,
        minHeight: 0,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <h3 style={{ color: "#e8f4ff", fontSize: "12px", fontWeight: 600, margin: 0, display: "flex", gap: "4px" }}>
          📋 Clinical Summary
        </h3>
        <button
          style={{
            background: "rgba(155,109,255,0.2)",
            border: "1px solid #9b6dff",
            color: "#9b6dff",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "9px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          ⚡ AI Refresh
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "11px" }}>
        <div>
          <p style={{ color: "#4a7299", fontSize: "9px", margin: "0 0 2px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Chief Complaint
          </p>
          <p style={{ color: "#c8ddf0", margin: 0 }}>
            {encounter?.chiefComplaint || "—"}
          </p>
        </div>
        <div>
          <p style={{ color: "#4a7299", fontSize: "9px", margin: "0 0 2px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Encounter Status
          </p>
          <p style={{ color: "#c8ddf0", margin: 0 }}>
            {encounter?.encounterStatus?.toUpperCase() || "—"}
          </p>
        </div>
        <div>
          <p style={{ color: "#4a7299", fontSize: "9px", margin: "0 0 2px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Attending
          </p>
          <p style={{ color: "#c8ddf0", margin: 0 }}>
            {encounter?.attendingPhysician || "—"}
          </p>
        </div>
      </div>
    </div>
  );
}