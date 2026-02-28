import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "../../utils";

const T = {
  panel: "#0e2340",
  border: "#1e3a5f",
  text: "#c8ddf0",
  dim: "#4a7299",
  teal: "#00d4bc",
};

export default function ActivePatientsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && patients.length === 0) {
      loadPatients();
    }
  }, [isOpen]);

  const loadPatients = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const notes = await base44.entities.ClinicalNote.list("-created_date", 50);
      const todaysNotes = notes.filter(
        (n) => n.created_date.startsWith(today) && n.patient_name
      );
      const uniquePatients = Array.from(
        new Map(
          todaysNotes.map((n) => [
            n.patient_name,
            {
              id: n.id,
              name: n.patient_name,
              age: n.patient_age || "N/A",
              chief_complaint: n.chief_complaint || "No complaint listed",
            },
          ])
        ).values()
      );
      setPatients(uniquePatients.slice(0, 7));
    } catch (error) {
      console.error("Failed to load patients:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: "4px 8px",
          borderRadius: "6px",
          background: "#0e2340",
          border: `1px solid ${T.border}`,
          fontSize: "8px",
          color: T.dim,
          fontWeight: 600,
          cursor: "pointer",
          transition: "all 0.15s",
          textAlign: "center",
          minWidth: "60px",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = T.teal;
          e.currentTarget.style.color = T.teal;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = T.border;
          e.currentTarget.style.color = T.dim;
        }}
      >
        <div>Active Patients</div>
        <div style={{ fontSize: "11px", fontWeight: 700 }}>
          {patients.length}
        </div>
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            marginTop: "8px",
            background: T.panel,
            border: `1px solid ${T.border}`,
            borderRadius: "8px",
            width: "320px",
            maxHeight: "400px",
            overflowY: "auto",
            zIndex: 50,
            boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {loading ? (
            <div
              style={{
                padding: "16px",
                textAlign: "center",
                color: T.dim,
                fontSize: "12px",
              }}
            >
              Loading patients…
            </div>
          ) : patients.length === 0 ? (
            <div
              style={{
                padding: "16px",
                textAlign: "center",
                color: T.dim,
                fontSize: "12px",
              }}
            >
              No active patients today
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "2px", padding: "8px" }}>
              {patients.map((patient) => (
                <button
                  key={patient.id}
                  onClick={() => {
                    window.location.href = createPageUrl(
                      `NoteDetail?id=${patient.id}`
                    );
                    setIsOpen(false);
                  }}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "6px",
                    background: "transparent",
                    border: `1px solid ${T.border}`,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(0,212,188,0.08)";
                    e.currentTarget.style.borderColor = T.teal;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.borderColor = T.border;
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: T.text,
                      marginBottom: "4px",
                    }}
                  >
                    {patient.name}
                  </div>
                  <div style={{ fontSize: "11px", color: T.dim }}>
                    Age: {patient.age} • CC: {patient.chief_complaint}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}