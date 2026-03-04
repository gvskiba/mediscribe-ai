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

export default function AddPatientModal({ isOpen, onClose, shiftId }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    room: "",
    acuity: "3",
    chief_complaint: "",
    patient_age: "",
    patient_sex: "Unknown",
    hr: "",
    bp: "",
    spo2: "",
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.encounters.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["encounters"] });
      onClose();
      setFormData({
        room: "",
        acuity: "3",
        chief_complaint: "",
        patient_age: "",
        patient_sex: "Unknown",
        hr: "",
        bp: "",
        spo2: "",
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.chief_complaint.trim()) return;

    createMutation.mutate({
      shift_id: shiftId,
      room: formData.room,
      acuity: formData.acuity,
      chief_complaint: formData.chief_complaint,
      patient_age: formData.patient_age ? parseInt(formData.patient_age) : null,
      patient_sex: formData.patient_sex,
      vitals: {
        hr: formData.hr ? parseInt(formData.hr) : null,
        bp: formData.bp,
        spo2: formData.spo2 ? parseInt(formData.spo2) : null,
      },
      arrival_time: new Date(),
      disposition: "pending",
      note_status: "not_started",
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
        <div style={{ fontSize: 16, fontWeight: 700, color: T.bright, marginBottom: 20 }}>
          ➕ Add Patient to Board
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#4a7299", marginBottom: 6 }}>
                Room / Bed
              </label>
              <input
                type="text"
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                placeholder="e.g., 1A"
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
                ESI Acuity *
              </label>
              <select
                value={formData.acuity}
                onChange={(e) => setFormData({ ...formData, acuity: e.target.value })}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  background: T.edge,
                  border: `1px solid ${T.border}`,
                  borderRadius: 6,
                  color: T.bright,
                  fontSize: 12,
                }}>
                <option value="1">1 — Immediate</option>
                <option value="2">2 — Emergent</option>
                <option value="3">3 — Urgent</option>
                <option value="4">4 — Less Urgent</option>
                <option value="5">5 — Non-Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#4a7299", marginBottom: 6 }}>
              Chief Complaint *
            </label>
            <input
              type="text"
              required
              value={formData.chief_complaint}
              onChange={(e) => setFormData({ ...formData, chief_complaint: e.target.value })}
              placeholder="e.g., chest pain"
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

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#4a7299", marginBottom: 6 }}>
                Age
              </label>
              <input
                type="number"
                value={formData.patient_age}
                onChange={(e) => setFormData({ ...formData, patient_age: e.target.value })}
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
                Sex
              </label>
              <select
                value={formData.patient_sex}
                onChange={(e) => setFormData({ ...formData, patient_sex: e.target.value })}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  background: T.edge,
                  border: `1px solid ${T.border}`,
                  borderRadius: 6,
                  color: T.bright,
                  fontSize: 12,
                }}>
                <option value="M">M</option>
                <option value="F">F</option>
                <option value="Other">Other</option>
                <option value="Unknown">Unknown</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#4a7299", marginBottom: 6 }}>
                HR
              </label>
              <input
                type="number"
                value={formData.hr}
                onChange={(e) => setFormData({ ...formData, hr: e.target.value })}
                placeholder="bpm"
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
                BP
              </label>
              <input
                type="text"
                value={formData.bp}
                onChange={(e) => setFormData({ ...formData, bp: e.target.value })}
                placeholder="120/80"
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
                SpO₂ %
              </label>
              <input
                type="number"
                value={formData.spo2}
                onChange={(e) => setFormData({ ...formData, spo2: e.target.value })}
                min="70"
                max="100"
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
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
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
              {createMutation.isPending ? "Adding…" : "➕ Add Patient"}
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