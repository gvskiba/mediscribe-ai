// QuickNoteRecentLabs.jsx
// Fetches the most recent lab values for the active patient and lets the
// provider pull them into the QuickNote labs text field with one click.

import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";

function parseLabsFromNote(note) {
  // Try structured lab_findings first
  if (note.lab_findings?.length) {
    return note.lab_findings.map(l =>
      `${l.test_name}: ${l.result}${l.unit ? " " + l.unit : ""}${l.status && l.status !== "normal" ? " [" + l.status.toUpperCase() + "]" : ""}`
    ).filter(Boolean);
  }
  // Fallback: use labs_raw text
  if (note.labs_raw?.trim()) {
    return note.labs_raw.trim().split("\n").filter(l => l.trim());
  }
  return [];
}

function formatEncounterDate(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch { return dateStr; }
}

export function RecentLabsPanel({ patientId, onImport, currentLabs }) {
  const [records,  setRecords]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [open,     setOpen]     = useState(false);
  const [imported, setImported] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);

  const fetchLabs = useCallback(async () => {
    setLoading(true);
    try {
      // Query ClinicalNotes with labs for this patient — most recent first
      const filter = patientId
        ? { patient_identifier: patientId }
        : {};
      const results = await base44.entities.ClinicalNote.list(filter, "-encounter_date", 20);
      const withLabs = (results || [])
        .map(n => ({ ...n, _parsedLabs: parseLabsFromNote(n) }))
        .filter(n => n._parsedLabs.length > 0)
        .slice(0, 5); // keep 5 most recent encounters with lab data
      setRecords(withLabs);
    } catch (e) {
      console.error("RecentLabs fetch failed:", e);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    if (open && records.length === 0 && !loading) {
      fetchLabs();
    }
  }, [open]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        title="Pull recent lab results from patient history"
        style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: "3px 11px", borderRadius: 6, cursor: "pointer",
          fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 11,
          border: "1px solid rgba(61,255,160,.4)",
          background: "rgba(61,255,160,.07)",
          color: "var(--qn-green)", transition: "all .15s",
        }}
      >
        📋 Recent Labs
      </button>
    );
  }

  const selected = records[selectedIdx];
  const labs = selected?._parsedLabs || [];

  const handleImport = () => {
    if (!labs.length) return;
    const labText = labs.join("\n");
    onImport(labText);
    setImported(true);
    setTimeout(() => setImported(false), 3000);
  };

  const handleAppend = () => {
    if (!labs.length) return;
    const labText = labs.join("\n");
    onImport((currentLabs?.trim() ? currentLabs.trim() + "\n" : "") + labText);
    setImported(true);
    setTimeout(() => setImported(false), 3000);
  };

  return (
    <div style={{
      marginTop: 8, borderRadius: 10, overflow: "hidden",
      border: "1px solid rgba(61,255,160,.3)",
      background: "rgba(8,22,40,.8)",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "8px 12px",
        borderBottom: "1px solid rgba(42,79,122,.4)",
        background: "rgba(14,37,68,.5)",
      }}>
        <span style={{
          fontFamily: "'JetBrains Mono',monospace", fontSize: 8, fontWeight: 700,
          color: "var(--qn-green)", letterSpacing: 1, textTransform: "uppercase", flex: 1,
        }}>
          📋 Recent Lab Results
        </span>
        {imported && (
          <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "var(--qn-green)" }}>
            ✓ Imported
          </span>
        )}
        <button
          onClick={() => { fetchLabs(); }}
          disabled={loading}
          style={{
            padding: "2px 8px", borderRadius: 5, cursor: "pointer",
            fontFamily: "'JetBrains Mono',monospace", fontSize: 8,
            border: "1px solid rgba(42,79,122,.4)", background: "transparent",
            color: "var(--qn-txt4)",
          }}
        >
          {loading ? "●" : "↺"}
        </button>
        <button
          onClick={() => setOpen(false)}
          style={{
            background: "transparent", border: "none", cursor: "pointer",
            color: "var(--qn-txt4)", fontSize: 14, padding: "0 2px",
          }}
        >✕</button>
      </div>

      {loading && (
        <div style={{
          padding: "14px 16px", fontFamily: "'JetBrains Mono',monospace",
          fontSize: 9, color: "var(--qn-txt4)", letterSpacing: .5,
        }}>
          ● Loading recent lab records…
        </div>
      )}

      {!loading && records.length === 0 && (
        <div style={{
          padding: "14px 16px", fontFamily: "'DM Sans',sans-serif",
          fontSize: 12, color: "var(--qn-txt4)", fontStyle: "italic",
        }}>
          No prior lab records found{patientId ? " for this patient" : ""}.<br />
          <span style={{ fontSize: 10 }}>Labs are pulled from finalized QuickNote records.</span>
        </div>
      )}

      {!loading && records.length > 0 && (
        <div style={{ padding: "10px 12px" }}>
          {/* Encounter selector tabs */}
          {records.length > 1 && (
            <div style={{ display: "flex", gap: 5, marginBottom: 10, flexWrap: "wrap" }}>
              {records.map((rec, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedIdx(i)}
                  style={{
                    padding: "3px 10px", borderRadius: 6, cursor: "pointer",
                    fontFamily: "'JetBrains Mono',monospace", fontSize: 8,
                    border: `1px solid ${i === selectedIdx ? "rgba(61,255,160,.5)" : "rgba(42,79,122,.35)"}`,
                    background: i === selectedIdx ? "rgba(61,255,160,.1)" : "transparent",
                    color: i === selectedIdx ? "var(--qn-green)" : "var(--qn-txt4)",
                  }}
                >
                  {i === 0 ? "Latest" : `Visit ${i + 1}`}
                  {rec.encounter_date && (
                    <span style={{ marginLeft: 4, opacity: .6 }}>
                      {formatEncounterDate(rec.encounter_date)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Visit context */}
          {selected && (
            <div style={{
              marginBottom: 8, padding: "5px 10px", borderRadius: 7,
              background: "rgba(42,79,122,.15)", border: "1px solid rgba(42,79,122,.3)",
              display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
            }}>
              {selected.encounter_date && (
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: "var(--qn-txt4)" }}>
                  {formatEncounterDate(selected.encounter_date)}
                </span>
              )}
              {selected.cc && (
                <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "var(--qn-txt2)" }}>
                  CC: {selected.cc}
                </span>
              )}
              {selected.working_diagnosis && (
                <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "var(--qn-teal)" }}>
                  Dx: {selected.working_diagnosis}
                </span>
              )}
            </div>
          )}

          {/* Lab values list */}
          <div style={{
            maxHeight: 180, overflowY: "auto",
            display: "flex", flexDirection: "column", gap: 3, marginBottom: 10,
          }}>
            {labs.map((line, i) => {
              const isCritical = /\[CRITICAL\]/i.test(line);
              const isAbnormal = /\[ABNORMAL\]/i.test(line);
              return (
                <div key={i} style={{
                  fontFamily: "'JetBrains Mono',monospace", fontSize: 10,
                  padding: "3px 8px", borderRadius: 5,
                  background: isCritical ? "rgba(255,68,68,.08)" : isAbnormal ? "rgba(245,200,66,.07)" : "rgba(14,37,68,.5)",
                  border: `1px solid ${isCritical ? "rgba(255,68,68,.3)" : isAbnormal ? "rgba(245,200,66,.25)" : "rgba(42,79,122,.25)"}`,
                  color: isCritical ? "var(--qn-coral)" : isAbnormal ? "var(--qn-gold)" : "var(--qn-txt2)",
                }}>
                  {line}
                </div>
              );
            })}
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 7 }}>
            <button
              onClick={handleImport}
              style={{
                padding: "5px 14px", borderRadius: 7, cursor: "pointer",
                fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 11,
                border: "1px solid rgba(61,255,160,.5)",
                background: "rgba(61,255,160,.12)", color: "var(--qn-green)",
              }}
            >
              ↓ Replace Labs with These
            </button>
            {currentLabs?.trim() && (
              <button
                onClick={handleAppend}
                style={{
                  padding: "5px 14px", borderRadius: 7, cursor: "pointer",
                  fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 11,
                  border: "1px solid rgba(59,158,255,.45)",
                  background: "rgba(59,158,255,.08)", color: "var(--qn-blue)",
                }}
              >
                + Append to Labs
              </button>
            )}
          </div>
          <div style={{
            marginTop: 6, fontFamily: "'JetBrains Mono',monospace", fontSize: 7,
            color: "rgba(107,158,200,.4)", letterSpacing: .4,
          }}>
            From finalized QuickNote records · review before using in MDM
          </div>
        </div>
      )}
    </div>
  );
}