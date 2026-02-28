import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Clock } from "lucide-react";
import { createPageUrl } from "../utils";

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
  teal: "#00d4bc",
  amber: "#f5a623",
};

export default function ShiftHours() {
  const [selectedHours, setSelectedHours] = useState(12);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const load = async () => {
      const u = await base44.auth.me();
      setUser(u);
      setSelectedHours(u?.clinical_settings?.shift_duration || 12);
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({
        clinical_settings: {
          ...user?.clinical_settings,
          shift_duration: selectedHours,
        },
      });
      window.location.href = createPageUrl("Dashboard");
    } catch (error) {
      console.error("Failed to save shift hours:", error);
      setSaving(false);
    }
  };

  const hourOptions = [12, 24, 36, 48, 72];

  return (
    <div style={{ minHeight: "100vh", background: T.navy, padding: "20px" }}>
      {/* Header */}
      <div style={{ marginBottom: "40px", display: "flex", alignItems: "center", gap: "12px" }}>
        <a href={createPageUrl("Dashboard")} style={{ cursor: "pointer" }}>
          <ArrowLeft className="w-5 h-5" style={{ color: T.teal }} />
        </a>
        <h1 style={{ fontSize: "28px", color: T.bright, fontWeight: 700, margin: 0 }}>Shift Hours</h1>
      </div>

      {/* Card */}
      <div style={{ maxWidth: "400px", margin: "0 auto" }}>
        <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: "14px", padding: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
            <Clock className="w-6 h-6" style={{ color: T.amber }} />
            <h2 style={{ fontSize: "18px", color: T.bright, fontWeight: 600, margin: 0 }}>Select Duration</h2>
          </div>

          <p style={{ color: T.dim, fontSize: "13px", marginBottom: "20px" }}>
            Choose your shift duration to track work hours and breaks.
          </p>

          {/* Hour Options */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
            {hourOptions.map((hours) => (
              <button
                key={hours}
                onClick={() => setSelectedHours(hours)}
                style={{
                  padding: "14px 16px",
                  borderRadius: "8px",
                  border: selectedHours === hours ? `2px solid ${T.teal}` : `1px solid ${T.border}`,
                  background: selectedHours === hours ? `rgba(0,212,188,0.1)` : T.edge,
                  color: selectedHours === hours ? T.teal : T.text,
                  fontSize: "14px",
                  fontWeight: selectedHours === hours ? 600 : 500,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
                onMouseEnter={(e) => {
                  if (selectedHours !== hours) {
                    e.currentTarget.style.borderColor = T.teal;
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedHours !== hours) {
                    e.currentTarget.style.borderColor = T.border;
                  }
                }}
              >
                <span>{hours} Hours</span>
                {selectedHours === hours && <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: T.teal }} />}
              </button>
            ))}
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: "8px",
              background: `linear-gradient(135deg, ${T.teal}, #00a896)`,
              border: "none",
              color: T.navy,
              fontSize: "13px",
              fontWeight: 600,
              cursor: saving ? "not-allowed" : "pointer",
              transition: "opacity 0.2s",
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? "Saving…" : "Save Shift Hours"}
          </button>
        </div>
      </div>
    </div>
  );
}