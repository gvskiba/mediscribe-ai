import React from "react";

const T = {
  panel: "#0d2240",
  edge: "#162d4f",
  border: "#1e3a5f",
  text: "#c8ddf0",
  bright: "#e8f4ff",
  teal: "#00d4bc",
  amber: "#f5a623",
  red: "#ff5c6c",
  green: "#2ecc71",
};

const ACUITY_COLORS = {
  "1": { bg: "#ff5c6c", text: "#fff" },
  "2": { bg: "#f5a623", text: "#050f1e" },
  "3": { bg: "#f5d623", text: "#050f1e" },
  "4": { bg: "#2ecc71", text: "#050f1e" },
  "5": { bg: "#4a7299", text: "#e8f4ff" },
};

export default function PatientBoard({ patients, currentFilter, onFilterChange, onAddOrder }) {
  const filters = [
    { label: "All", value: "all" },
    { label: "🔴 Critical", value: "critical" },
    { label: "📝 Unsigned", value: "unsigned" },
    { label: "⏳ Pending", value: "pending" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: T.bright }}>Active Patients</span>
        <span style={{ padding: "2px 8px", borderRadius: 4, background: T.teal + "22", color: T.teal, fontSize: 11, fontWeight: 600 }}>
          {patients.length}
        </span>
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => onFilterChange(f.value)}
            style={{
              padding: "5px 12px",
              borderRadius: 6,
              background: currentFilter === f.value ? T.teal + "22" : "transparent",
              border: `1px solid ${currentFilter === f.value ? T.teal : T.border}`,
              color: currentFilter === f.value ? T.teal : T.text,
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
            }}>
            {f.label}
          </button>
        ))}
      </div>

      <div
        style={{
          background: T.panel,
          border: `1px solid ${T.border}`,
          borderRadius: 10,
          overflow: "hidden",
        }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "32px 54px 1fr 100px 80px 64px 56px",
            gap: 8,
            padding: "10px 12px",
            background: T.edge,
            borderBottom: `1px solid ${T.border}`,
            fontSize: 10,
            fontWeight: 700,
            color: "#4a7299",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}>
          <div>ESI</div>
          <div>Room</div>
          <div>Patient / CC</div>
          <div>Time In</div>
          <div>Orders</div>
          <div>Note</div>
          <div></div>
        </div>

        {patients.length === 0 ? (
          <div style={{ padding: "32px 16px", textAlign: "center", color: T.text }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>🏥</div>
            <div>No patients on board</div>
          </div>
        ) : (
          patients.map((patient) => (
            <div
              key={patient.id}
              style={{
                display: "grid",
                gridTemplateColumns: "32px 54px 1fr 100px 80px 64px 56px",
                gap: 8,
                padding: "10px 12px",
                borderBottom: `1px solid rgba(30,58,95,0.3)`,
                alignItems: "center",
                fontSize: 12,
                color: T.text,
              }}>
              <div
                style={{
                  padding: "4px 8px",
                  borderRadius: 4,
                  background: ACUITY_COLORS[patient.acuity]?.bg,
                  color: ACUITY_COLORS[patient.acuity]?.text,
                  fontSize: 11,
                  fontWeight: 700,
                  textAlign: "center",
                }}>
                {patient.acuity}
              </div>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: T.teal }}>
                {patient.room || "—"}
              </div>
              <div>
                <div style={{ fontWeight: 600, color: T.bright }}>{patient.chief_complaint}</div>
                <div style={{ fontSize: 10, color: "#4a7299", marginTop: 2 }}>
                  {patient.patient_age ? `${patient.patient_age}y` : "—"} {patient.patient_sex || "—"}
                </div>
              </div>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10 }}>
                {patient.arrival_time ? new Date(patient.arrival_time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—"}
              </div>
              <div style={{ textAlign: "center" }}>
                {patient.orders?.filter((o) => o.status === "pending").length > 0 ? (
                  <span style={{ color: T.amber }}>⏳ {patient.orders.length}</span>
                ) : (
                  <span style={{ color: "#4a7299" }}>—</span>
                )}
              </div>
              <div
                style={{
                  padding: "2px 6px",
                  borderRadius: 4,
                  background:
                    patient.note_status === "signed"
                      ? T.green + "22"
                      : patient.note_status === "drafted"
                      ? "#4a90d9" + "22"
                      : T.red + "22",
                  color:
                    patient.note_status === "signed"
                      ? T.green
                      : patient.note_status === "drafted"
                      ? "#4a90d9"
                      : T.red,
                  fontSize: 9,
                  fontWeight: 600,
                  textAlign: "center",
                }}>
                {patient.note_status === "signed" ? "✓" : patient.note_status === "drafted" ? "Draft" : "None"}
              </div>
              <button
                onClick={() => onAddOrder(patient.id)}
                style={{
                  padding: "4px 8px",
                  background: "transparent",
                  border: `1px solid ${T.border}`,
                  borderRadius: 4,
                  color: T.teal,
                  fontSize: 11,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = T.teal + "11")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                ⊕ Add
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}