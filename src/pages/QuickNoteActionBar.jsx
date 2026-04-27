// QuickNoteActionBar.jsx
import React from "react";
// Bottom action bar: phase indicator, format toggle, EHR copy buttons, secondary actions
// Exported: ActionBar

export function ActionBar({
  mdmResult, dispResult,
  copiedP1, copiedP2, copied, savedNote, saving, sentToNPI, sendingNPI,
  formatMode, setFormatMode,
  copyPhase1, copyPhase2, copyNote, saveNote, sendToNPI,
  onNewEncounter,
}) {
  return (
    <div className="no-print">
      {/* Phase indicator + format toggle */}
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8,
        padding:"6px 14px", borderRadius:8,
        background:"rgba(8,22,40,.5)", border:"1px solid rgba(42,79,122,.25)" }}>
        <div style={{ display:"flex", gap:12, flex:1 }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
            fontWeight:700, letterSpacing:.8,
            color: mdmResult ? "var(--qn-teal)" : "var(--qn-txt4)",
            textTransform:"uppercase" }}>
            {mdmResult ? "✓" : "○"} Phase 1: Initial Documentation
          </span>
          <span style={{ color:"rgba(42,79,122,.6)", fontSize:9 }}>|</span>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
            fontWeight:700, letterSpacing:.8,
            color: dispResult ? "var(--qn-purple)" : "var(--qn-txt4)",
            textTransform:"uppercase" }}>
            {dispResult ? "✓" : "○"} Phase 2: Reevaluation &amp; Disposition
          </span>
        </div>
        {/* Format toggle */}
        <div style={{ display:"flex", gap:4, alignItems:"center" }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
            color:"var(--qn-txt4)", letterSpacing:.5, textTransform:"uppercase" }}>
            Format:
          </span>
          {[["plain","Plain Text"],["epic","Epic"]].map(([v,l]) => (
            <button key={v} onClick={() => setFormatMode(v)}
              style={{ padding:"2px 8px", borderRadius:4, cursor:"pointer",
                fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                border:`1px solid ${formatMode === v ? "rgba(0,229,192,.45)" : "rgba(42,79,122,.35)"}`,
                background:formatMode === v ? "rgba(0,229,192,.12)" : "transparent",
                color:formatMode === v ? "var(--qn-teal)" : "var(--qn-txt4)",
                transition:"all .12s" }}>{l}</button>
          ))}
        </div>
      </div>

      {/* Primary EHR copy buttons */}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", padding:"10px 14px",
        borderRadius:10, background:"rgba(8,22,40,.6)",
        border:"1px solid rgba(42,79,122,.3)", marginBottom:8 }}>

        {mdmResult && (
          <button onClick={copyPhase1}
            style={{ padding:"9px 20px", borderRadius:8, cursor:"pointer",
              fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:12,
              transition:"all .15s",
              border:`1px solid ${copiedP1 ? "rgba(61,255,160,.6)" : "rgba(0,229,192,.5)"}`,
              background:copiedP1 ? "rgba(61,255,160,.15)" : "rgba(0,229,192,.12)",
              color:copiedP1 ? "var(--qn-green)" : "var(--qn-teal)",
              boxShadow:copiedP1 ? "none" : "0 0 12px rgba(0,229,192,.12)" }}>
            {copiedP1 ? "✓ Phase 1 Copied — Paste into EHR" : "📋 Copy Initial Note  "}
            {!copiedP1 && <span style={{ fontFamily:"'JetBrains Mono',monospace",
              fontSize:9, opacity:.6 }}>[Shift+1]</span>}
          </button>
        )}

        {dispResult && (
          <button onClick={copyPhase2}
            style={{ padding:"9px 20px", borderRadius:8, cursor:"pointer",
              fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:12,
              transition:"all .15s",
              border:`1px solid ${copiedP2 ? "rgba(61,255,160,.6)" : "rgba(155,109,255,.5)"}`,
              background:copiedP2 ? "rgba(61,255,160,.15)" : "rgba(155,109,255,.12)",
              color:copiedP2 ? "var(--qn-green)" : "var(--qn-purple)",
              boxShadow:copiedP2 ? "none" : "0 0 12px rgba(155,109,255,.12)" }}>
            {copiedP2 ? "✓ Phase 2 Copied — Paste into EHR" : "📋 Copy Reevaluation & Disposition  "}
            {!copiedP2 && <span style={{ fontFamily:"'JetBrains Mono',monospace",
              fontSize:9, opacity:.6 }}>[Shift+2]</span>}
          </button>
        )}

        <div style={{ flex:1 }} />

        {/* Secondary actions */}
        <div style={{ display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>
          <button onClick={saveNote} disabled={saving}
            style={{ padding:"7px 14px", borderRadius:7, cursor:"pointer",
              fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
              border:`1px solid ${savedNote ? "rgba(61,255,160,.5)" : "rgba(0,229,192,.3)"}`,
              background:savedNote ? "rgba(61,255,160,.1)" : "rgba(14,37,68,.6)",
              color:savedNote ? "var(--qn-green)" : "var(--qn-teal)",
              opacity:saving ? .6 : 1, transition:"all .15s" }}>
            {saving ? "Saving…" : savedNote ? "✓ Saved" : "Save Note"}
          </button>
          <button onClick={() => window.location.href = "/NoteHistory"}
            style={{ padding:"7px 14px", borderRadius:7, cursor:"pointer",
              fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
              border:"1px solid rgba(42,79,122,.4)", background:"rgba(14,37,68,.6)",
              color:"var(--qn-txt3)", transition:"all .15s" }}>
            History →
          </button>
          <button onClick={sendToNPI} disabled={sendingNPI}
            style={{ padding:"7px 14px", borderRadius:7, cursor:"pointer",
              fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
              border:`1px solid ${sentToNPI ? "rgba(61,255,160,.5)" : "rgba(155,109,255,.35)"}`,
              background:"rgba(14,37,68,.6)",
              color:sentToNPI ? "var(--qn-green)" : "var(--qn-purple)",
              opacity:sendingNPI ? .6 : 1, transition:"all .15s" }}>
            {sendingNPI ? "…" : sentToNPI ? "✓ NPI" : "→ NPI"}
          </button>
          <button onClick={copyNote}
            style={{ padding:"7px 14px", borderRadius:7, cursor:"pointer",
              fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
              border:`1px solid ${copied ? "rgba(61,255,160,.5)" : "rgba(42,79,122,.4)"}`,
              background:"rgba(14,37,68,.6)",
              color:copied ? "var(--qn-green)" : "var(--qn-txt4)",
              transition:"all .15s" }}>
            {copied ? "✓" : "Full Note"}
          </button>
          <button onClick={onNewEncounter}
            style={{ padding:"7px 14px", borderRadius:7, cursor:"pointer",
              fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
              border:"1px solid rgba(255,107,107,.3)", background:"rgba(14,37,68,.6)",
              color:"var(--qn-coral)", transition:"all .15s" }}>
            New Encounter
          </button>
        </div>
      </div>

      <div style={{ textAlign:"right", fontFamily:"'JetBrains Mono',monospace",
        fontSize:8, color:"rgba(107,158,200,.35)", letterSpacing:.5 }}>
        Shift+1 copy initial note · Shift+2 copy reevaluation · C full note
      </div>
    </div>
  );
}