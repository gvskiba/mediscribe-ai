import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "../../utils";
import { FileText, Calendar } from "lucide-react";

export default function TopBar() {
  const [user, setUser] = useState(null);
  const [time, setTime] = useState(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }));
  const [stats, setStats] = useState({
    activePatients: 0,
    notesPending: 0,
    ordersQueue: 0,
    shiftHours: 0
  });

  useEffect(() => {
    base44.auth.me().then(u => setUser(u)).catch(() => setUser(null));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const notes = await base44.entities.ClinicalNote.list();
        const patients = new Set(notes.map(n => n.patient_name)).size;
        const pending = notes.filter(n => n.status === "draft").length;
        
        setStats({
          activePatients: patients,
          notesPending: pending,
          ordersQueue: 12,
          shiftHours: 4.2
        });
      } catch (e) {
        console.error("Failed to fetch stats:", e);
      }
    };
    fetchStats();
  }, []);

  const specialty = user?.role === "admin" ? "Admin" : "Emergency Medicine";

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 50,
      background: "linear-gradient(90deg, #0f172a 0%, #1e293b 100%)",
      borderBottom: "1px solid #334155",
      padding: "12px 20px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      color: "#e2e8f0"
    }}>
      {/* Left: Logo */}
      <div style={{
        width: 70,
        height: 52,
        borderRadius: 12,
        background: "#f5f5f5",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        marginRight: "30px"
      }}>
        <span style={{ fontSize: 20, fontWeight: 800, color: "#1e1b4b", letterSpacing: "-0.5px" }}>
          medn<span style={{ color: "#6d28d9" }}>u.</span>
        </span>
      </div>

      {/* Welcome */}
      <div style={{ fontSize: "14px", fontWeight: 500, minWidth: "150px", display: "flex", alignItems: "center", gap: "8px" }}>
        <Calendar className="w-5 h-5" style={{ color: "#0ea5e9" }} />
        Welcome, {user?.full_name?.split(" ")[0]?.toLowerCase() || "user"}
      </div>

      {/* Center: Stats */}
      <div style={{ display: "flex", gap: "12px", flex: 1, justifyContent: "center" }}>
        {[
          { label: "Active Patients", value: stats.activePatients },
          { label: "Notes Pending", value: stats.notesPending },
          { label: "Orders Queue", value: stats.ordersQueue },
          { label: "Shift Hours", value: stats.shiftHours }
        ].map((stat) => (
          <div key={stat.label} style={{
            background: "rgba(30, 41, 59, 0.8)",
            border: "1px solid #475569",
            borderRadius: "6px",
            padding: "8px 12px",
            textAlign: "center",
            fontSize: "11px"
          }}>
            <div style={{ color: "#94a3b8", fontSize: "10px", marginBottom: "2px" }}>{stat.label}</div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#0ea5e9" }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Right: Actions */}
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <div style={{
          background: "rgba(220, 38, 38, 0.15)",
          border: "1px solid #dc2626",
          borderRadius: "4px",
          padding: "4px 8px",
          fontSize: "11px",
          fontWeight: 600,
          color: "#fca5a5"
        }}>
          {specialty}
        </div>
        <div style={{
          background: "#0ea5e9",
          borderRadius: "4px",
          padding: "4px 8px",
          fontSize: "11px",
          fontWeight: 600,
          color: "#ffffff"
        }}>
          {time}
        </div>
        <button style={{
          background: "#10b981",
          border: "none",
          borderRadius: "4px",
          padding: "4px 8px",
          fontSize: "11px",
          fontWeight: 600,
          color: "#ffffff",
          cursor: "pointer"
        }}>
          + AI ON
        </button>
        <button
          onClick={async () => {
            const newNote = await base44.entities.ClinicalNote.create({
              raw_note: "",
              patient_name: "New Patient",
              status: "draft"
            });
            window.location.href = createPageUrl(`NoteDetail?id=${newNote.id}`);
          }}
          style={{
            background: "#14b8a6",
            border: "none",
            borderRadius: "4px",
            padding: "4px 8px",
            fontSize: "11px",
            fontWeight: 600,
            color: "#ffffff",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px"
          }}>
          + New Note
        </button>
      </div>
    </div>
  );
}