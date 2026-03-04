import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const T = {
  panel: "#0d2240",
  edge: "#162d4f",
  border: "#1e3a5f",
  text: "#c8ddf0",
  bright: "#e8f4ff",
  teal: "#00d4bc",
};

export default function AddOrderModal({ isOpen, onClose, patientId }) {
  const queryClient = useQueryClient();
  const [orderType, setOrderType] = useState("lab");
  const [orderName, setOrderName] = useState("");
  const [priority, setPriority] = useState("routine");

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.orders.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      onClose();
      setOrderType("lab");
      setOrderName("");
      setPriority("routine");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!orderName.trim()) return;

    createMutation.mutate({
      encounter_id: patientId,
      order_type: orderType,
      order_name: orderName,
      priority: priority,
      status: "pending",
      ordered_at: new Date(),
    });
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}>
      <div
        style={{
          background: T.panel,
          border: `1px solid ${T.border}`,
          borderRadius: 12,
          padding: 24,
          maxWidth: 400,
          width: "90%",
        }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: T.bright, marginBottom: 20 }}>⊕ Add Order</div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#4a7299", marginBottom: 6 }}>
              Order Type
            </label>
            <select
              value={orderType}
              onChange={(e) => setOrderType(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                background: T.edge,
                border: `1px solid ${T.border}`,
                borderRadius: 6,
                color: T.bright,
                fontSize: 12,
              }}>
              <option value="lab">Lab</option>
              <option value="imaging">Imaging</option>
              <option value="medication">Medication</option>
              <option value="consult">Consult</option>
              <option value="procedure">Procedure</option>
              <option value="nursing">Nursing</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#4a7299", marginBottom: 6 }}>
              Order Name *
            </label>
            <input
              type="text"
              required
              value={orderName}
              onChange={(e) => setOrderName(e.target.value)}
              placeholder="e.g., EKG"
              style={{
                width: "100%",
                padding: "8px 12px",
                background: T.edge,
                border: `1px solid ${T.border}`,
                borderRadius: 6,
                color: T.bright,
                fontSize: 12,
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#4a7299", marginBottom: 6 }}>
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                background: T.edge,
                border: `1px solid ${T.border}`,
                borderRadius: 6,
                color: T.bright,
                fontSize: 12,
              }}>
              <option value="routine">Routine</option>
              <option value="stat">Stat</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="submit"
              disabled={createMutation.isPending}
              style={{
                flex: 1,
                padding: "10px 16px",
                background: "linear-gradient(135deg,#00d4bc,#00a896)",
                color: "#fff",
                fontWeight: 700,
                fontSize: 13,
                borderRadius: 6,
                border: "none",
                cursor: createMutation.isPending ? "not-allowed" : "pointer",
                opacity: createMutation.isPending ? 0.6 : 1,
              }}>
              {createMutation.isPending ? "Adding…" : "⊕ Add Order"}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: "10px 16px",
                background: "transparent",
                color: T.text,
                border: `1px solid ${T.border}`,
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
              }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}