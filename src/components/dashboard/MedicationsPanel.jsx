import React from "react";
import { formatDistanceToNow } from "date-fns";

export default function MedicationsPanel({ medications }) {
  return (
    <div
      style={{
        background: "#0e2340",
        border: "1px solid #1e3a5f",
        borderLeft: "3px solid #f472b6",
        borderRadius: "8px",
        padding: "10px",
        minHeight: "120px",
      }}
    >
      <h3 style={{ color: "#e8f4ff", fontSize: "12px", fontWeight: 600, margin: "0 0 8px 0", display: "flex", gap: "4px" }}>
        💊 Medications Given
      </h3>
      {medications?.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "10px" }}>
          {medications.slice(0, 5).map((med, idx) => (
            <div
              key={idx}
              style={{
                background: med.isControlled ? "rgba(245,166,35,0.1)" : "transparent",
                padding: "6px",
                borderRadius: "4px",
                borderLeft: med.isControlled ? "2px solid #f5a623" : "none",
              }}
            >
              <p style={{ color: "#e8f4ff", margin: "0 0 2px 0", fontWeight: 500 }}>
                {med.drugName}
                {med.isControlled && <span style={{ color: "#f5a623", marginLeft: "4px" }}>⚠</span>}
              </p>
              <p style={{ color: "#4a7299", margin: "0 0 1px 0" }}>
                {med.dose} {med.route}
              </p>
              <p style={{ color: "#2a4d72", margin: 0 }}>
                {med.givenAt ? formatDistanceToNow(new Date(med.givenAt), { addSuffix: true }) : ""}
              </p>
            </div>
          ))}
          {medications.length > 5 && (
            <p style={{ color: "#4a7299", fontSize: "9px", margin: "4px 0 0 0" }}>
              +{medications.length - 5} more
            </p>
          )}
        </div>
      ) : (
        <p style={{ color: "#4a7299", fontSize: "10px", margin: 0, fontStyle: "italic" }}>
          No medications administered yet
        </p>
      )}
    </div>
  );
}