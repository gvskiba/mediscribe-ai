import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";

const T = {
  panel: "#0d2240",
  edge: "#162d4f",
  border: "#1e3a5f",
  text: "#c8ddf0",
  bright: "#e8f4ff",
  teal: "#00d4bc",
  red: "#ff5c6c",
  amber: "#f5a623",
};

export default function EndShiftModal({ isOpen, onClose, shiftId }) {
  const queryClient = useQueryClient();
  const [incoming, setIncoming] = useState("");
  const [notes, setNotes] = useState("");

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.shifts.update(shiftId, data),
    onSuccess: () => {
      window.location.href = createPageUrl("Dashboard");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate({
      status: "closed",
      shift_end: new Date(),
      incoming_provider: incoming,
      handoff_notes: notes,
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
          maxWidth: 500,
          width: "90%",
        }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: T.bright, marginBottom: 6 }}>
          🔴 End Shift
        </div>
        <div style={{ fontSize: 12, color: "#4a7299", marginBottom: 20 }}>
          Confirm your shift closure and handoff details
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#4a7299", marginBottom: 6 }}>
              Incoming Provider
            </label>
            <input
              type="text"
              value={incoming}
              onChange={(e) => setIncoming(e.target.value)}
              placeholder="Name of incoming provider"
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
              Handoff Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Key handoff points, patients of concern, etc."
              rows={4}
              style={{
                width: "100%",
                padding: "8px 12px",
                background: T.edge,
                border: `1px solid ${T.border}`,
                borderRadius: 6,
                color: T.bright,
                fontSize: 12,
                fontFamily: "DM Sans, sans-serif",
                boxSizing: "border-box",
                resize: "vertical",
              }}
            />
          </div>

          <div style={{ padding: 12, background: T.edge, borderRadius: 6, borderLeft: `3px solid ${T.amber}` }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.amber, marginBottom: 4 }}>⚠️ Important</div>
            <div style={{ fontSize: 11, color: T.text, lineHeight: 1.5 }}>
              Ensure all urgent notes are signed and critical results have been communicated before ending your shift.
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              style={{
                flex: 1,
                padding: "10px 16px",
                background: "rgba(255,92,108,0.1)",
                color: T.red,
                fontWeight: 700,
                fontSize: 13,
                borderRadius: 6,
                border: `1px solid rgba(255,92,108,0.3)`,
                cursor: updateMutation.isPending ? "not-allowed" : "pointer",
                opacity: updateMutation.isPending ? 0.6 : 1,
              }}>
              {updateMutation.isPending ? "Ending…" : "🔴 End Shift"}
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