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

export default function RightSidebar({ shift }) {
  const pendingOrders = shift.patients.flatMap((p) => p.orders?.filter((o) => ["pending", "resulted"].includes(o.status)) || []);
  const unsignedNotes = shift.patients.filter((p) => p.note_status !== "signed");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, overflowY: "auto", maxHeight: "calc(100vh - 240px)" }}>
      {/* Pending Orders */}
      <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10, padding: 14, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: T.bright }}>⏳ Pending Orders</span>
          <span
            style={{
              padding: "2px 8px",
              borderRadius: 4,
              background: pendingOrders.length > 0 ? T.amber + "22" : "transparent",
              color: pendingOrders.length > 0 ? T.amber : T.text,
              fontSize: 11,
              fontWeight: 600,
            }}>
            {pendingOrders.length}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 240, overflowY: "auto" }}>
          {pendingOrders.length === 0 ? (
            <div style={{ fontSize: 12, color: "#4a7299", textAlign: "center", padding: "16px 0" }}>✅ No pending orders</div>
          ) : (
            pendingOrders.map((order, idx) => (
              <div key={idx} style={{ padding: 10, background: T.edge, borderRadius: 6, fontSize: 11 }}>
                <div style={{ fontWeight: 600, color: T.bright }}>{order.order_name}</div>
                <div style={{ fontSize: 9, color: "#4a7299", marginTop: 2 }}>{order.order_type}</div>
                <div
                  style={{
                    marginTop: 6,
                    padding: "2px 6px",
                    borderRadius: 3,
                    background: order.status === "critical" ? T.red + "22" : "#4a90d9" + "22",
                    color: order.status === "critical" ? T.red : "#4a90d9",
                    fontSize: 9,
                    fontWeight: 600,
                    display: "inline-block",
                  }}>
                  {order.status === "critical" ? "🚨 CRITICAL" : "⏳ Pending"}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Unsigned Notes */}
      <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10, padding: 14, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: T.bright }}>📝 Unsigned Notes</span>
          <span
            style={{
              padding: "2px 8px",
              borderRadius: 4,
              background: unsignedNotes.length > 0 ? T.amber + "22" : T.green + "22",
              color: unsignedNotes.length > 0 ? T.amber : T.green,
              fontSize: 11,
              fontWeight: 600,
            }}>
            {unsignedNotes.length}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 220, overflowY: "auto" }}>
          {unsignedNotes.length === 0 ? (
            <div style={{ fontSize: 12, color: T.green, textAlign: "center", padding: "16px 0" }}>✅ All notes signed</div>
          ) : (
            unsignedNotes.map((patient) => (
              <div key={patient.id} style={{ padding: 10, background: T.edge, borderRadius: 6, fontSize: 11 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background:
                        patient.note_status === "in_progress"
                          ? T.amber
                          : patient.note_status === "drafted"
                          ? "#4a90d9"
                          : T.red,
                    }}
                  />
                  <div style={{ fontWeight: 600, color: T.bright }}>Room {patient.room}</div>
                </div>
                <div style={{ fontSize: 10, color: "#4a7299", marginTop: 4 }}>{patient.chief_complaint}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Shift Stats */}
      <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10, padding: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.bright, marginBottom: 12 }}>📊 My Shift Stats</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[
            { label: "👤 Seen", value: shift.patients.length + shift.closedPatients.length },
            { label: "✅ Discharged", value: shift.closedPatients.filter((p) => p.disposition === "discharge").length },
            { label: "🔬 Procedures", value: shift.procedures },
            { label: "📝 Doc Rate", value: "—" },
          ].map((stat, idx) => (
            <div key={idx} style={{ padding: 10, background: T.edge, borderRadius: 6, textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "#4a7299", marginBottom: 4 }}>{stat.label}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.teal, fontFamily: "JetBrains Mono, monospace" }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}