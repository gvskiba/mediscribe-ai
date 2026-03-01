import React from "react";
import { differenceInMinutes, differenceInHours } from "date-fns";

export default function QuickStats({ encounter, vitals }) {
  const los = encounter?.arrivalDateTime
    ? (() => {
        const minutes = differenceInMinutes(new Date(), new Date(encounter.arrivalDateTime));
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
      })()
    : "—";

  const esiMap = { 1: "ESI-1", 2: "ESI-2", 3: "ESI-3", 4: "ESI-4", 5: "ESI-5" };
  const esiColor = {
    1: "#ff5c6c",
    2: "#ff5c6c",
    3: "#f5a623",
    4: "#00d4bc",
    5: "#2ecc71",
  };

  const chips = [
    { icon: "⏱", label: "Length of Stay", value: los },
    { icon: "🚦", label: "Triage / ESI", value: esiMap[encounter?.esiScore] || "—", color: esiColor[encounter?.esiScore] },
    { icon: "👨‍⚕️", label: "Attending", value: encounter?.attendingPhysician || "—" },
    { icon: "📍", label: "Status", value: encounter?.encounterStatus?.toUpperCase() || "—" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "11px" }}>
      {chips.map((chip, idx) => (
        <div
          key={idx}
          style={{
            background: "#0e2340",
            border: "1px solid #1e3a5f",
            borderRadius: "8px",
            padding: "10px",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: "16px", margin: "0 0 4px 0" }}>{chip.icon}</p>
          <p style={{ color: "#4a7299", fontSize: "10px", margin: "0 0 4px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            {chip.label}
          </p>
          <p
            style={{
              color: chip.color || "#e8f4ff",
              fontSize: "13px",
              fontWeight: 600,
              margin: 0,
            }}
          >
            {chip.value}
          </p>
        </div>
      ))}
    </div>
  );
}