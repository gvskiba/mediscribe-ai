import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Activity, Clock } from "lucide-react";

const T = {
  panel: "#0e2340",
  border: "#1e3a5f",
  text: "#c8ddf0",
  bright: "#e8f4ff",
  dim: "#4a7299",
  teal: "#00d4bc",
};

const getTimeAgo = (date) => {
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

export default function NotesActivityWidget() {
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadActivity = async () => {
      try {
        const notes = await base44.entities.ClinicalNote.list('-updated_date', 8);
        setRecentActivity(notes || []);
      } catch (error) {
        console.error("Failed to load activity:", error);
      } finally {
        setLoading(false);
      }
    };
    loadActivity();
  }, []);

  return (
    <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: "14px", padding: "16px", display: "flex", flexDirection: "column", gap: "10px", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
        <Activity className="w-4 h-4" style={{ color: T.teal }} />
        <div style={{ fontSize: "13px", color: T.bright, fontWeight: 600 }}>Recent Activity</div>
      </div>

      {loading ? (
        <div style={{ fontSize: "12px", color: T.dim }}>Loading...</div>
      ) : recentActivity.length === 0 ? (
        <div style={{ fontSize: "12px", color: T.dim, padding: "12px", textAlign: "center" }}>No recent activity</div>
      ) : (
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
          {recentActivity.map((note) => (
            <div
              key={note.id}
              onClick={() => window.location.href = `?page=NoteDetail&id=${note.id}`}
              style={{
                padding: "8px 10px",
                borderRadius: "8px",
                background: `rgba(0,212,188,0.08)`,
                border: `1px solid ${T.border}`,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = `rgba(0,212,188,0.15)`; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = `rgba(0,212,188,0.08)`; }}
            >
              <div style={{ fontSize: "12px", color: T.text, fontWeight: 500 }}>{note.patient_name}</div>
              <div style={{ fontSize: "10px", color: T.dim, display: "flex", alignItems: "center", gap: "4px", marginTop: "3px" }}>
                <Clock className="w-3 h-3" />
                {getTimeAgo(note.updated_date)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}