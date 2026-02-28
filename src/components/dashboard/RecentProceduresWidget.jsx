import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Stethoscope, ChevronRight } from "lucide-react";

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
  green: "#2ecc71",
  teal: "#00d4bc",
};

export default function RecentProceduresWidget() {
  const [procedures, setProcedures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const procs = await base44.entities.ProcedureLog.list("-date_performed", 5);
        setProcedures(procs || []);
      } catch (error) {
        console.error("Failed to load procedures:", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: "14px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
          <Stethoscope className="w-4 h-4" style={{ color: T.green }} />
          <div style={{ fontSize: "13px", color: T.bright, fontWeight: 600 }}>
            Recent Procedures
          </div>
        </div>
        <p style={{ fontSize: "11px", color: T.dim, margin: 0 }}>Latest procedure logs</p>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {loading ? (
          <div style={{ padding: "12px 16px", textAlign: "center", color: T.dim, fontSize: "12px" }}>Loading…</div>
        ) : procedures.length === 0 ? (
          <div style={{ padding: "12px 16px", textAlign: "center", color: T.dim, fontSize: "12px" }}>
            No recent procedures
          </div>
        ) : (
          procedures.map((proc, idx) => (
            <div
              key={proc.id}
              style={{
                padding: "10px 14px",
                borderBottom: idx < procedures.length - 1 ? `1px solid ${T.border}` : "none",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = T.edge; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <div style={{ fontSize: "12px", color: T.bright, fontWeight: 500, marginBottom: "4px" }}>
                {proc.procedure_name}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "10px", color: T.dim }}>
                <span>{proc.patient_name}</span>
                {proc.outcome && (
                  <span style={{ background: proc.outcome === "successful" ? "rgba(46,204,113,0.15)" : "rgba(255,92,108,0.15)", padding: "2px 6px", borderRadius: "3px", color: proc.outcome === "successful" ? T.green : "#ff5c6c" }}>
                    {proc.outcome}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}