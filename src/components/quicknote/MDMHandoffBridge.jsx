// MDMHandoffBridge.jsx
// Saves the AI-drafted MDM narrative + action plan into a HandoffEntry.pending_items

import { useState } from "react";
import { base44 } from "@/api/base44Client";

export function MDMHandoffBridge({ mdmResult, treatmentPlan, actionPlan, cc }) {
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [entries,    setEntries]    = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(false);

  const buildPendingText = () => {
    const parts = [];
    if (mdmResult?.working_diagnosis) parts.push(`Dx: ${mdmResult.working_diagnosis} (${mdmResult.mdm_level || ""})`);
    if (mdmResult?.mdm_narrative?.trim()) parts.push(`\nMDM:\n${mdmResult.mdm_narrative.trim()}`);
    if (treatmentPlan?.trim()) parts.push(`\nTreatment Plan:\n${treatmentPlan.trim()}`);
    if (actionPlan?.trim()) parts.push(`\nAction Items:\n${actionPlan.trim()}`);
    return parts.join("\n");
  };

  const loadEntries = async () => {
    setLoadingEntries(true);
    try {
      const results = await base44.entities.HandoffEntry.list("-created_date", 20);
      setEntries((results || []).filter(e => !e.acknowledged));
    } catch (e) {
      console.error("HandoffEntry load failed:", e);
    } finally {
      setLoadingEntries(false);
    }
  };

  const handleOpen = async () => {
    setShowPicker(true);
    setSaved(false);
    setError(null);
    await loadEntries();
  };

  const saveToEntry = async (entryId) => {
    setSaving(true); setError(null);
    try {
      const text = buildPendingText();
      const existing = entries.find(e => e.id === entryId);
      const merged = existing?.pending_items
        ? existing.pending_items + "\n\n---\n" + text
        : text;
      await base44.entities.HandoffEntry.update(entryId, { pending_items: merged });
      setSaved(true);
      setShowPicker(false);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError("Save failed: " + (e.message || "try again"));
    } finally {
      setSaving(false);
    }
  };

  const createNewEntry = async () => {
    setSaving(true); setError(null);
    try {
      const text = buildPendingText();
      await base44.entities.HandoffEntry.create({ pending_items: text });
      setSaved(true);
      setShowPicker(false);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError("Create failed: " + (e.message || "try again"));
    } finally {
      setSaving(false);
    }
  };

  if (!mdmResult) return null;

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={showPicker ? () => setShowPicker(false) : handleOpen}
        disabled={saving}
        style={{
          padding: "4px 12px", borderRadius: 7, cursor: "pointer",
          fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 11,
          border: `1px solid ${saved ? "rgba(61,255,160,.5)" : "rgba(155,109,255,.4)"}`,
          background: saved ? "rgba(61,255,160,.1)" : "rgba(155,109,255,.07)",
          color: saved ? "var(--qn-green)" : "var(--qn-purple)", transition: "all .15s",
        }}
      >
        {saved ? "✓ Saved to Handoff" : saving ? "● Saving…" : "→ Send to Handoff"}
      </button>

      {showPicker && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 200,
          background: "rgba(8,22,40,.97)", border: "1px solid rgba(42,79,122,.5)",
          borderRadius: 10, padding: 14, minWidth: 280, maxWidth: 360,
          boxShadow: "0 8px 32px rgba(0,0,0,.5)",
        }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fontWeight: 700,
            color: "var(--qn-purple)", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 10 }}>
            Save MDM to HandoffEntry
          </div>

          <button
            onClick={createNewEntry}
            disabled={saving}
            style={{
              width: "100%", padding: "8px 12px", borderRadius: 7, cursor: "pointer",
              fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 12, textAlign: "left",
              border: "1px solid rgba(0,229,192,.4)", background: "rgba(0,229,192,.07)",
              color: "var(--qn-teal)", marginBottom: 8,
            }}
          >
            + Create new HandoffEntry
          </button>

          {loadingEntries ? (
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8,
              color: "var(--qn-txt4)", padding: "4px 0" }}>Loading open entries…</div>
          ) : entries.length > 0 ? (
            <>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8,
                color: "var(--qn-txt4)", marginBottom: 6, letterSpacing: .5 }}>
                OR APPEND TO EXISTING:
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 180, overflowY: "auto" }}>
                {entries.map(entry => (
                  <button
                    key={entry.id}
                    onClick={() => saveToEntry(entry.id)}
                    disabled={saving}
                    style={{
                      padding: "7px 10px", borderRadius: 7, cursor: "pointer", textAlign: "left",
                      fontFamily: "'DM Sans',sans-serif", fontSize: 11,
                      border: "1px solid rgba(42,79,122,.4)", background: "rgba(14,37,68,.5)",
                      color: "var(--qn-txt2)",
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 11, color: "var(--qn-txt)",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {entry.ipass?.slice(0, 40) || entry.pending_items?.slice(0, 40) || "Unnamed entry"}
                      {(entry.ipass?.length > 40 || entry.pending_items?.length > 40) ? "…" : ""}
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 7,
                      color: "var(--qn-txt4)", marginTop: 2 }}>
                      {entry.worry ? "⚠ Worry" : ""} {new Date(entry.created_date).toLocaleDateString()}
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8,
              color: "rgba(107,158,200,.4)", padding: "2px 0" }}>No open handoff entries</div>
          )}

          {error && (
            <div style={{ marginTop: 8, fontFamily: "'JetBrains Mono',monospace", fontSize: 8,
              color: "var(--qn-coral)" }}>{error}</div>
          )}
        </div>
      )}
    </div>
  );
}