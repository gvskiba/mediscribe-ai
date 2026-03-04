import React from "react";

const T = {
  border: "#1e3a5f",
  text: "#c8ddf0",
  bright: "#e8f4ff",
  teal: "#00d4bc",
  amber: "#f5a623",
  red: "#ff5c6c",
  green: "#2ecc71",
};

export default function StatsRibbon({ shift }) {
  const stats = [
    {
      id: "total",
      label: "Total Patients",
      value: shift.patients.length + shift.closedPatients.length,
      icon: "👥",
    },
    {
      id: "active",
      label: "🔵 Active",
      value: shift.patients.length,
      icon: "🔵",
    },
    {
      id: "disch",
      label: "✅ Discharged",
      value: shift.closedPatients.filter((p) => p.disposition === "discharge").length,
      icon: "✅",
    },
    {
      id: "admit",
      label: "🏥 Admitted",
      value: shift.closedPatients.filter((p) => ["admit", "observation"].includes(p.disposition)).length,
      icon: "🏥",
    },
    {
      id: "los",
      label: "⏱ Avg LOS",
      value: "—",
      icon: "⏱",
    },
    {
      id: "proc",
      label: "🔬 Procedures",
      value: shift.procedures,
      icon: "🔬",
    },
    {
      id: "unsigned",
      label: "📝 Unsigned",
      value: shift.patients.filter((p) => p.note_status !== "signed").length,
      alert: shift.patients.filter((p) => p.note_status !== "signed").length > 0,
    },
    {
      id: "tasks",
      label: "✓ Open Tasks",
      value: shift.tasks.filter((t) => t.status === "open").length,
      alert: shift.tasks.filter((t) => t.status === "open").length > 0,
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(8, 1fr)",
        borderBottom: `1px solid rgba(30,58,95,0.6)`,
        background: "rgba(14,35,64,0.2)",
      }}>
      {stats.map((stat, idx) => (
        <div
          key={stat.id}
          style={{
            padding: "14px 16px",
            borderRight: idx < stats.length - 1 ? `1px solid rgba(30,58,95,0.4)` : "none",
            textAlign: "center",
          }}>
          <div style={{ fontSize: 11, color: "#4a7299", marginBottom: 6, fontWeight: 600 }}>{stat.label}</div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: stat.alert ? T.red : T.teal,
              fontFamily: "JetBrains Mono, monospace",
            }}>
            {stat.value}
          </div>
        </div>
      ))}
    </div>
  );
}