// QuickNotePhase2Panel.jsx
// Phase 2 input card: Labs, Imaging, EKG, Recheck Vitals, Generate Disposition
// Exported: Phase2Panel

import React from "react";
import { InputZone } from "./QuickNoteComponents";

export function Phase2Panel({
  labs, setLabs, imaging, setImaging, ekg, setEkg, newVitals, setNewVitals,
  p2Busy, p1Busy, p2Error, phase2Ready, mdmResult,
  dispResult, dispColor,
  setRef, makeKeyDown,
  runDisposition,
}) {
  return (
    <div className="qn-fade" style={{ marginBottom:14,
      background:"rgba(8,22,40,.5)", border:"1px solid rgba(59,158,255,.35)",
      borderRadius:14, padding:"16px" }}>

      {/* Phase header */}
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
        <div style={{ width:24, height:24, borderRadius:"50%",
          background:"rgba(59,158,255,.15)", border:"1px solid rgba(59,158,255,.4)",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontFamily:"'JetBrains Mono',monospace", fontSize:11,
          fontWeight:700, color:"var(--qn-blue)", flexShrink:0 }}>2</div>
        <div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
            fontSize:15, color:"var(--qn-blue)" }}>Workup & Disposition</div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
            color:"var(--qn-txt4)", letterSpacing:.8 }}>
            Enter results → AI generates reevaluation, plan, and discharge Rx
          </div>
        </div>
        {dispResult && (
          <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:6,
            padding:"4px 10px", borderRadius:7,
            background:`${dispColor(dispResult.disposition)}12`,
            border:`1px solid ${dispColor(dispResult.disposition)}40` }}>
            <div style={{ width:7, height:7, borderRadius:"50%",
              background:dispColor(dispResult.disposition), flexShrink:0 }} />
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
              color:dispColor(dispResult.disposition), letterSpacing:.5 }}>
              {dispResult.disposition}
            </span>
          </div>
        )}
      </div>

      {/* Labs + Imaging row */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
        <InputZone label="Labs" value={labs} onChange={setLabs} phase={2}
          rows={4} kbdHint="Alt+L"
          placeholder="Paste lab results — CBC, BMP, troponin, lactate, UA, coags..."
          onRef={setRef(5)}
          onKeyDown={makeKeyDown(5, false, runDisposition)} />
        <InputZone label="Imaging / Studies" value={imaging} onChange={setImaging} phase={2}
          rows={4}
          placeholder="Paste imaging results — CXR, CT, US, POCUS findings..."
          onRef={setRef(6)}
          onKeyDown={makeKeyDown(6, false, runDisposition)} />
        <InputZone label="EKG / ECG" value={ekg} onChange={setEkg} phase={2}
          rows={3}
          placeholder="e.g. NSR rate 72, normal axis, no ST changes, QTc 420ms — or paste full ECG interpretation..."
          onRef={setRef(7)}
          onKeyDown={makeKeyDown(7, false, runDisposition)} />
      </div>

      {/* Recheck vitals */}
      <div style={{ marginBottom:14 }}>
        <InputZone label="Re-check Vitals / Response to Treatment" value={newVitals}
          onChange={setNewVitals} phase={2}
          rows={2}
          placeholder="e.g. After IVF 1L: HR 88 BP 128/76 SpO2 99% — pain improved to 3/10"
          onRef={setRef(8)}
          onKeyDown={makeKeyDown(8, true, runDisposition)} />
      </div>

      {/* Workup warning */}
      {!phase2Ready && mdmResult && (
        <div style={{ marginBottom:12, padding:"7px 11px", borderRadius:8,
          background:"rgba(245,200,66,.07)", border:"1px solid rgba(245,200,66,.3)",
          fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"var(--qn-gold)",
          display:"flex", alignItems:"center", gap:7 }}>
          <span style={{ flexShrink:0 }}>⚠</span>
          No workup data entered. Enter at least one result above for a workup-informed disposition, or generate now for a clinical-impression-only assessment.
        </div>
      )}

      {/* Generate disposition button */}
      <button className="qn-btn" onClick={runDisposition}
        disabled={p2Busy || !mdmResult || p1Busy}
        style={{ width:"100%",
          border:`1px solid ${p2Busy || p1Busy ? "rgba(42,79,122,.3)" : "rgba(59,158,255,.5)"}`,
          background:p2Busy || p1Busy
            ? "rgba(14,37,68,.5)"
            : "linear-gradient(135deg,rgba(59,158,255,.15),rgba(59,158,255,.04))",
          color:p2Busy || p1Busy ? "var(--qn-txt4)" : "var(--qn-blue)" }}>
        {p2Busy ? (
          <><span className="qn-busy-dot">●</span>Generating Reevaluation &amp; Disposition...</>
        ) : (
          <>✦ Generate Reevaluation + Disposition  <span style={{ fontFamily:"'JetBrains Mono',monospace",
            fontSize:10, opacity:.6 }}>[Cmd+Enter]</span></>
        )}
      </button>

      {p2Error && (
        <div style={{ marginTop:8, padding:"8px 11px", borderRadius:8,
          background:"rgba(255,107,107,.08)", border:"1px solid rgba(255,107,107,.3)",
          fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"var(--qn-coral)" }}>
          {p2Error}
        </div>
      )}
    </div>
  );
}