import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ChevronDown, ChevronRight, User, Clock, Calendar, TrendingUp, Filter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const T = {
  navy: "#050f1e",
  slate: "#0b1d35",
  panel: "#0d2240",
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

export default function CollapsiblePatientList({ onSelectPatient, selectedPatient }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [sortBy, setSortBy] = useState("date"); // date, name, shift

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ["activePatients"],
    queryFn: async () => {
      const notes = await base44.entities.ClinicalNote.list("-created_date", 50);
      return notes.filter(n => n.status !== "finalized" && !n.archived);
    },
  });

  const sortedPatients = [...patients].sort((a, b) => {
    if (sortBy === "date") {
      return new Date(b.created_date) - new Date(a.created_date);
    } else if (sortBy === "name") {
      return (a.patient_name || "").localeCompare(b.patient_name || "");
    } else if (sortBy === "shift") {
      const getShift = (date) => {
        const hour = new Date(date).getHours();
        if (hour >= 7 && hour < 15) return 0; // Day
        if (hour >= 15 && hour < 23) return 1; // Evening
        return 2; // Night
      };
      return getShift(a.created_date) - getShift(b.created_date);
    }
    return 0;
  });

  const getShiftLabel = (date) => {
    const hour = new Date(date).getHours();
    if (hour >= 7 && hour < 15) return { label: "Day", color: T.amber };
    if (hour >= 15 && hour < 23) return { label: "Eve", color: T.teal };
    return { label: "Night", color: T.dim };
  };

  return (
    <div style={{
      background: T.panel,
      border: `1px solid ${T.border}`,
      borderRadius: 14,
      overflow: "hidden",
    }}>
      {/* Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          padding: "12px 16px",
          borderBottom: isExpanded ? `1px solid ${T.border}` : "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          transition: "all 0.2s",
          background: "rgba(22,45,79,0.4)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {isExpanded ? (
            <ChevronDown size={16} style={{ color: T.teal }} />
          ) : (
            <ChevronRight size={16} style={{ color: T.dim }} />
          )}
          <User size={14} style={{ color: T.teal }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: T.bright, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Active Patients
          </span>
          <span style={{
            fontSize: 10,
            fontWeight: 700,
            padding: "2px 8px",
            borderRadius: 6,
            background: "rgba(0,212,188,0.15)",
            color: T.teal,
            border: "1px solid rgba(0,212,188,0.3)",
          }}>
            {patients.length}
          </span>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden" }}
          >
            {/* Sort Controls */}
            <div style={{
              padding: "10px 16px",
              borderBottom: `1px solid ${T.border}`,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}>
              <Filter size={12} style={{ color: T.dim }} />
              <span style={{ fontSize: 10, color: T.dim, marginRight: 4 }}>Sort:</span>
              {[
                { id: "date", label: "Date", icon: Calendar },
                { id: "name", label: "Name", icon: User },
                { id: "shift", label: "Shift", icon: Clock },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setSortBy(id)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 6,
                    fontSize: 10,
                    fontWeight: 600,
                    cursor: "pointer",
                    border: `1px solid ${sortBy === id ? T.teal : T.border}`,
                    background: sortBy === id ? "rgba(0,212,188,0.1)" : "transparent",
                    color: sortBy === id ? T.teal : T.dim,
                    transition: "all 0.15s",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Icon size={10} />
                  {label}
                </button>
              ))}
            </div>

            {/* Patient List */}
            <div style={{ maxHeight: 280, overflowY: "auto" }}>
              {isLoading ? (
                <div style={{ padding: 20, textAlign: "center", color: T.dim, fontSize: 11 }}>
                  Loading patients...
                </div>
              ) : sortedPatients.length === 0 ? (
                <div style={{ padding: 20, textAlign: "center", color: T.dim, fontSize: 11 }}>
                  No active patients
                </div>
              ) : (
                sortedPatients.map((patient) => {
                  const isSelected = selectedPatient?.id === patient.id;
                  const shift = getShiftLabel(patient.created_date);
                  const date = new Date(patient.created_date);
                  
                  return (
                    <div
                      key={patient.id}
                      onClick={() => onSelectPatient(patient)}
                      style={{
                        padding: "10px 16px",
                        borderBottom: `1px solid ${T.border}`,
                        cursor: "pointer",
                        transition: "all 0.15s",
                        background: isSelected ? "rgba(0,212,188,0.06)" : "transparent",
                        borderLeft: `3px solid ${isSelected ? T.teal : "transparent"}`,
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = T.edge;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = "transparent";
                        }
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                        <div style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: isSelected ? T.teal : T.bright,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          flex: 1,
                        }}>
                          {patient.patient_name || "Unknown Patient"}
                        </div>
                        <div style={{
                          fontSize: 9,
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: 4,
                          background: `${shift.color}20`,
                          color: shift.color,
                          border: `1px solid ${shift.color}40`,
                        }}>
                          {shift.label}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 10, color: T.dim }}>
                        <span>{patient.patient_age || "—"}y</span>
                        <span>·</span>
                        <span>{patient.patient_gender || "—"}</span>
                        <span>·</span>
                        <span>{date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}</span>
                      </div>
                      {patient.chief_complaint && (
                        <div style={{
                          fontSize: 10,
                          color: T.muted,
                          marginTop: 4,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}>
                          CC: {patient.chief_complaint}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}