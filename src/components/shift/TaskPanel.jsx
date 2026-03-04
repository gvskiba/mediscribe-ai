import React from "react";

const T = {
  border: "#1e3a5f",
  text: "#c8ddf0",
  bright: "#e8f4ff",
  teal: "#00d4bc",
  red: "#ff5c6c",
  amber: "#f5a623",
  edge: "#162d4f",
};

export default function TaskPanel({ tasks, onAddTask }) {
  const openTasks = tasks.filter((t) => t.status === "open");

  return (
    <div
      style={{
        borderTop: `1px solid ${T.border}`,
        padding: "20px",
        background: "rgba(14,35,64,0.3)",
      }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, maxWidth: "1400px", margin: "0 auto 16px" }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: T.bright }}>✓ Tasks & Reminders</div>
        <span
          style={{
            padding: "4px 10px",
            borderRadius: 6,
            background: openTasks.length > 0 ? T.red + "22" : "transparent",
            color: openTasks.length > 0 ? T.red : T.text,
            fontSize: 12,
            fontWeight: 600,
          }}>
          {openTasks.length}
        </span>
        <button
          onClick={onAddTask}
          style={{
            marginLeft: "auto",
            padding: "6px 14px",
            background: "rgba(0,212,188,0.1)",
            color: T.teal,
            border: `1px solid rgba(0,212,188,0.25)`,
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,212,188,0.2)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(0,212,188,0.1)")}>
          ➕ Add Task
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 12,
          maxWidth: "1400px",
          margin: "0 auto",
        }}>
        {openTasks.length === 0 ? (
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "32px", color: T.text }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
            <div style={{ fontWeight: 600, color: T.bright }}>No open tasks</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>You're all caught up!</div>
          </div>
        ) : (
          openTasks.map((task, idx) => (
            <div
              key={idx}
              style={{
                padding: 14,
                background: T.edge,
                border: `1px solid ${task.priority === "urgent" ? T.red : T.border}`,
                borderRadius: 8,
                fontSize: 12,
              }}>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <input
                  type="checkbox"
                  style={{
                    marginTop: 2,
                    cursor: "pointer",
                    width: 16,
                    height: 16,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: T.bright }}>{task.task_text}</div>
                  {task.task_type && (
                    <div style={{ fontSize: 10, color: "#4a7299", marginTop: 4 }}>📋 {task.task_type}</div>
                  )}
                </div>
              </div>
              {task.priority === "urgent" && (
                <div
                  style={{
                    marginTop: 8,
                    padding: "2px 6px",
                    borderRadius: 3,
                    background: T.red + "22",
                    color: T.red,
                    fontSize: 10,
                    fontWeight: 600,
                    display: "inline-block",
                  }}>
                  🚨 Urgent
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}