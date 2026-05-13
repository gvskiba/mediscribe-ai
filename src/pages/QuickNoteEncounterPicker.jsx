// QuickNoteEncounterPicker.jsx
// Loads recent encounters and lets the provider click one to auto-fill CC + age
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

export function EncounterPicker({ onSelect }) {
  const [encounters, setEncounters] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [open, setOpen]             = useState(false);
  const [applied, setApplied]       = useState(null);

  useEffect(() => {
    setLoading(true);
    base44.entities.encounters
      .list("-created_date", 20)
      .then(res => {
        const active = (res || []).filter(
          e => e.chief_complaint && e.disposition === "pending"
        ).slice(0, 12);
        setEncounters(active);
      })
      .catch(() => setEncounters([]))
      .finally(() => setLoading(false));
  }, []);

  if (!loading && !encounters.length) return null;

  const teal = "#0d9488";
  const bdr  = "rgba(42,79,122,.4)";

  const acuityColor = a => ({ 1:"#ef4444", 2:"#f97316", 3:"#eab308", 4:"#22c55e", 5:"#64748b" }[parseInt(a)] || "#64748b");

  const handleSelect = enc => {
    onSelect({
      cc:  enc.chief_complaint || "",
      age: enc.patient_age != null ? String(enc.patient_age) : "",
      vitals: enc.vitals ? [
        enc.vitals.hr   ? `HR ${enc.vitals.hr}`      : null,
        enc.vitals.bp   ? `BP ${enc.vitals.bp}`      : null,
        enc.vitals.rr   ? `RR ${enc.vitals.rr}`      : null,
        enc.vitals.spo2 ? `SpO2 ${enc.vitals.spo2}%` : null,
        enc.vitals.temp ? `T ${enc.vitals.temp}`      : null,
      ].filter(Boolean).join("  ") : "",
    });
    setApplied(enc.id);
    setOpen(false);
    setTimeout(() => setApplied(null), 3000);
  };

  return (
    <div style={{ marginBottom: 10 }} className="no-print">
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "5px 13px", borderRadius: 8, cursor: "pointer",
            fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fontWeight: 700,
            letterSpacing: ".06em", textTransform: "uppercase",
            border: `1px solid ${open ? teal : bdr}`,
            background: open ? "rgba(13,148,136,.15)" : "rgba(14,37,68,.5)",
            color: open ? teal : "var(--qn-txt4)", transition: "all .15s",
          }}
        >
          {loading ? "⏳" : "⚡"} Import from Tracking Board
          {encounters.length > 0 && (
            <span style={{
              fontFamily: "'JetBrains Mono',monospace", fontSize: 8,
              background: "rgba(13,148,136,.2)", color: teal,
              borderRadius: 4, padding: "1px 6px",
            }}>{encounters.length}</span>
          )}
          <span style={{ fontSize: 10 }}>{open ? "▲" : "▼"}</span>
        </button>
        {applied && (
          <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: teal }}>
            ✓ Encounter imported
          </span>
        )}
      </div>

      {open && (
        <div style={{
          marginTop: 8, borderRadius: 10, overflow: "hidden",
          border: `1px solid ${bdr}`,
          background: "rgba(8,22,40,.85)",
        }}>
          <div style={{
            padding: "7px 14px", borderBottom: `1px solid ${bdr}`,
            fontFamily: "'JetBrains Mono',monospace", fontSize: 8,
            color: "var(--qn-txt4)", letterSpacing: ".1em", textTransform: "uppercase",
          }}>
            Active Encounters — click to auto-fill CC &amp; Age
          </div>
          {encounters.map(enc => (
            <button
              key={enc.id}
              onClick={() => handleSelect(enc)}
              style={{
                width: "100%", textAlign: "left", display: "flex",
                alignItems: "center", gap: 10,
                padding: "9px 14px", borderBottom: `1px solid rgba(42,79,122,.2)`,
                background: "transparent", border: "none", cursor: "pointer",
                transition: "background .12s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(13,148,136,.08)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              {enc.acuity && (
                <span style={{
                  fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fontWeight: 800,
                  color: acuityColor(enc.acuity),
                  background: `${acuityColor(enc.acuity)}18`,
                  border: `1px solid ${acuityColor(enc.acuity)}44`,
                  borderRadius: 5, padding: "2px 6px", flexShrink: 0,
                }}>ESI {enc.acuity}</span>
              )}
              {enc.room && (
                <span style={{
                  fontFamily: "'JetBrains Mono',monospace", fontSize: 8,
                  color: "var(--qn-txt4)", flexShrink: 0,
                }}>Rm {enc.room}</span>
              )}
              <span style={{
                fontFamily: "'DM Sans',sans-serif", fontSize: 12,
                fontWeight: 600, color: "var(--qn-txt)", flex: 1,
              }}>{enc.chief_complaint}</span>
              {enc.patient_age != null && (
                <span style={{
                  fontFamily: "'JetBrains Mono',monospace", fontSize: 9,
                  color: "var(--qn-txt4)", flexShrink: 0,
                }}>{enc.patient_age}yo {enc.patient_sex || ""}</span>
              )}
              <span style={{
                fontFamily: "'JetBrains Mono',monospace", fontSize: 8,
                color: teal, flexShrink: 0,
              }}>→ Import</span>
            </button>
          ))}
          {!loading && !encounters.length && (
            <div style={{
              padding: "12px 14px", fontFamily: "'DM Sans',sans-serif",
              fontSize: 12, color: "var(--qn-txt4)", fontStyle: "italic",
            }}>No active pending encounters found.</div>
          )}
        </div>
      )}
    </div>
  );
}