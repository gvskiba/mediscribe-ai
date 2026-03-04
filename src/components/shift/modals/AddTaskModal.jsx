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

export default function AddTaskModal({ isOpen, onClose, shiftId }) {
  const queryClient = useQueryClient();
  const [taskText, setTaskText] = useState("");
  const [priority, setPriority] = useState("routine");

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.tasks.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      onClose();
      setTaskText("");
      setPriority("routine");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!taskText.trim()) return;

    createMutation.mutate({
      shift_id: shiftId,
      task_text: taskText,
      priority: priority,
      status: "open",
      created_at: new Date(),
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
        <div style={{ fontSize: 16, fontWeight: 700, color: T.bright, marginBottom: 20 }}>✓ Add Task</div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#4a7299", marginBottom: 6 }}>
              Task *
            </label>
            <input
              type="text"
              required
              value={taskText}
              onChange={(e) => setTaskText(e.target.value)}
              placeholder="e.g., Call cardiology consult"
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
              <option value="urgent">Urgent</option>
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
              {createMutation.isPending ? "Adding…" : "✓ Add Task"}
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