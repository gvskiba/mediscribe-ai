import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { createPageUrl } from "../utils";

const T = {
  navy: "#050f1e",
  slate: "#0b1d35",
  panel: "#0e2340",
  edge: "#162d4f",
  border: "#1e3a5f",
  muted: "#2a4d72",
  dim: "#4a7299",
  text: "#c8ddf0",
  bright: "#e8f4ff",
  teal: "#00d4bc",
  amber: "#f5a623",
  red: "#ff5c6c",
  green: "#2ecc71",
};

export default function OrdersQueue() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        // Placeholder: In a real app, fetch from orders entity
        setOrders([
          { id: 1, patient: "John Doe", order: "CBC, BMP", status: "pending", time: "10:30 AM" },
          { id: 2, patient: "Jane Smith", order: "Chest X-Ray", status: "in_progress", time: "10:15 AM" },
          { id: 3, patient: "Mike Johnson", order: "ECG", status: "pending", time: "09:45 AM" },
        ]);
      } catch (error) {
        console.error("Failed to load orders:", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const statusConfig = {
    pending: { icon: Clock, color: T.amber, label: "Pending" },
    in_progress: { icon: Clock, color: T.teal, label: "In Progress" },
    completed: { icon: CheckCircle2, color: T.green, label: "Completed" },
  };

  return (
    <div style={{ minHeight: "100vh", background: T.navy, padding: "20px" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px", display: "flex", alignItems: "center", gap: "12px" }}>
        <a href={createPageUrl("Dashboard")} style={{ cursor: "pointer" }}>
          <ArrowLeft className="w-5 h-5" style={{ color: T.teal }} />
        </a>
        <h1 style={{ fontSize: "28px", color: T.bright, fontWeight: 700, margin: 0 }}>Orders Queue</h1>
      </div>

      {/* Orders List */}
      <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: "12px", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "32px", textAlign: "center", color: T.dim }}>Loading orders…</div>
        ) : orders.length === 0 ? (
          <div style={{ padding: "32px", textAlign: "center", color: T.dim }}>No orders in queue</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}`, background: T.edge }}>
                <th style={{ padding: "12px 16px", textAlign: "left", color: T.dim, fontSize: "12px", fontWeight: 600 }}>Patient</th>
                <th style={{ padding: "12px 16px", textAlign: "left", color: T.dim, fontSize: "12px", fontWeight: 600 }}>Order</th>
                <th style={{ padding: "12px 16px", textAlign: "left", color: T.dim, fontSize: "12px", fontWeight: 600 }}>Status</th>
                <th style={{ padding: "12px 16px", textAlign: "left", color: T.dim, fontSize: "12px", fontWeight: 600 }}>Time</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, idx) => {
                const config = statusConfig[order.status];
                const Icon = config.icon;
                return (
                  <tr
                    key={order.id}
                    style={{
                      borderBottom: idx < orders.length - 1 ? `1px solid ${T.border}` : "none",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = T.edge; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <td style={{ padding: "12px 16px", color: T.bright, fontSize: "13px" }}>{order.patient}</td>
                    <td style={{ padding: "12px 16px", color: T.text, fontSize: "13px" }}>{order.order}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Icon className="w-4 h-4" style={{ color: config.color }} />
                        <span style={{ color: config.color, fontSize: "12px", fontWeight: 600 }}>{config.label}</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", color: T.dim, fontSize: "12px" }}>{order.time}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}