import React from "react";

const T = {
  border: "#1e3a5f",
  text: "#c8ddf0",
  bright: "#e8f4ff",
  teal: "#00d4bc",
  amber: "#f5a623",
};

export default function ShiftHeader({ shift, elapsed, onAddPatient }) {
  const shiftStart = new Date(shift.shift_start);
  const shiftEnd = new Date(shiftStart.getTime() + shift.shift_duration_hours * 3600000);
  const minutesRemaining = Math.floor((shiftEnd - Date.now()) / 60000);

  return (
    <div
      style={{
        padding: "14px 22px",
        borderBottom: `1px solid rgba(30,58,95,0.6)`,
        display: "flex",
        alignItems: "center",
        gap: 24,
        flexWrap: "wrap",
      }}>
      <div>
        <div style={{ fontSize: 18, fontWeight: 700, color: T.bright }}>🏥 Shift Dashboard</div>
        <div style={{ fontSize: 12, color: "#4a7299", marginTop: 2 }}>Emergency Department</div>
      </div>

      <div style={{ display: "flex", gap: 20, marginLeft: "auto" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "#4a7299", marginBottom: 4 }}>Started</div>
          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 13, color: T.teal, fontWeight: 600 }}>
            {shiftStart.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "#4a7299", marginBottom: 4 }}>Ends At</div>
          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 13, color: minutesRemaining < 60 ? T.amber : T.bright, fontWeight: 600 }}>
            {shiftEnd.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={onAddPatient}
          style={{
            padding: "8px 16px",
            background: "linear-gradient(135deg,#00d4bc,#00a896)",
            color: "#fff",
            fontWeight: 600,
            fontSize: 13,
            borderRadius: 6,
            border: "none",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}>
          ➕ Add Patient
        </button>
        <button
          style={{
            padding: "8px 16px",
            background: "rgba(155,109,255,0.1)",
            color: "#9b6dff",
            fontWeight: 600,
            fontSize: 13,
            borderRadius: 6,
            border: "1px solid rgba(155,109,255,0.25)",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(155,109,255,0.2)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(155,109,255,0.1)")}>
          🤖 Generate Sign-Out
        </button>
      </div>
    </div>
  );
}