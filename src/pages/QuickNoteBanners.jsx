// QuickNoteBanners.jsx — Named banner components for QuickNote
// Exported: PatientBanner, FatigueBanner, UndoToast, NhResumeBanner,
//           VhImportBanner, VhAnalysisCard, AddendumBanner

export function PatientBanner({ demo }) {
  if (!demo) return null;
  const name = [demo.firstName, demo.lastName].filter(Boolean).join(" ");
  if (!name && !demo.mrn && !demo.dob) return null;
  return (
    <div style={{ marginBottom:10, padding:"8px 14px", borderRadius:10,
      background:"rgba(59,158,255,.08)", border:"1px solid rgba(59,158,255,.3)",
      display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
      <span style={{ fontSize:14 }}>👤</span>
      {name && <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
        fontWeight:700, color:"var(--qn-blue)" }}>{name}</span>}
      {demo.mrn && <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
        color:"var(--qn-txt4)" }}>MRN: {demo.mrn}</span>}
      {demo.dob && <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
        color:"var(--qn-txt4)" }}>DOB: {demo.dob}</span>}
    </div>
  );
}

export function FatigueBanner({ onDismiss }) {
  return (
    <div style={{ marginBottom:10, padding:"8px 14px", borderRadius:10,
      background:"rgba(245,200,66,.08)", border:"1px solid rgba(245,200,66,.3)",
      display:"flex", alignItems:"center", gap:10 }}>
      <span style={{ fontSize:14 }}>⚠️</span>
      <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
        fontWeight:600, color:"var(--qn-gold)", flex:1 }}>
        Fatigue risk hours — cognitive bias increases after 17:00 and before 07:00.
        Review differentials carefully.
      </span>
      <button onClick={onDismiss}
        style={{ background:"transparent", border:"none", cursor:"pointer",
          fontFamily:"'JetBrains Mono',monospace", fontSize:11,
          color:"var(--qn-txt4)", padding:"0 4px" }}>✕</button>
    </div>
  );
}

export function UndoToast({ onUndo, onDismiss }) {
  return (
    <div style={{ marginBottom:10, padding:"8px 14px", borderRadius:10,
      background:"rgba(255,107,107,.1)", border:"1px solid rgba(255,107,107,.4)",
      display:"flex", alignItems:"center", gap:10 }}>
      <span style={{ fontSize:14 }}>⚠</span>
      <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
        fontWeight:600, color:"var(--qn-coral)", flex:1 }}>
        Encounter cleared
      </span>
      <button onClick={onUndo}
        style={{ padding:"5px 14px", borderRadius:7, cursor:"pointer",
          fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:12,
          border:"1px solid rgba(255,107,107,.5)", background:"rgba(255,107,107,.15)",
          color:"var(--qn-coral)", transition:"all .15s" }}>
        ↩ Undo (6s)
      </button>
      <button onClick={onDismiss}
        style={{ background:"transparent", border:"none", cursor:"pointer",
          fontFamily:"'JetBrains Mono',monospace", fontSize:11,
          color:"var(--qn-txt4)", padding:"0 4px" }}>✕</button>
    </div>
  );
}

export function NhResumeBanner({ onDismiss }) {
  return (
    <div style={{ marginBottom:10, padding:"8px 14px", borderRadius:10,
      background:"rgba(59,158,255,.08)", border:"1px solid rgba(59,158,255,.35)",
      display:"flex", alignItems:"center", gap:10 }}>
      <span style={{ fontSize:14 }}>📋</span>
      <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
        fontWeight:600, color:"var(--qn-blue)", flex:1 }}>
        Note resumed from history — CC, HPI, ROS, PE, Labs, and Imaging pre-filled
      </span>
      <button onClick={onDismiss}
        style={{ background:"transparent", border:"none", cursor:"pointer",
          fontFamily:"'JetBrains Mono',monospace", fontSize:11,
          color:"var(--qn-txt4)", padding:"0 4px" }}>✕</button>
    </div>
  );
}

export function VhImportBanner({ onDismiss }) {
  return (
    <div style={{ marginBottom:10, padding:"8px 14px", borderRadius:10,
      background:"rgba(0,229,192,.08)", border:"1px solid rgba(0,229,192,.35)",
      display:"flex", alignItems:"center", gap:10 }}>
      <span style={{ fontSize:14 }}>💓</span>
      <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
        fontWeight:600, color:"var(--qn-teal)", flex:1 }}>
        Vitals imported from VitalsHub — pre-filled in Triage Vitals field
      </span>
      <button onClick={onDismiss}
        style={{ background:"transparent", border:"none", cursor:"pointer",
          fontFamily:"'JetBrains Mono',monospace", fontSize:11,
          color:"var(--qn-txt4)", padding:"0 4px" }}>✕</button>
    </div>
  );
}

export function VhAnalysisCard({ vhAnalysis, onDismiss }) {
  if (!vhAnalysis) return null;
  return (
    <div style={{ marginBottom:10, padding:"12px 14px", borderRadius:10,
      background:"rgba(155,109,255,.07)", border:"1px solid rgba(155,109,255,.3)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
          fontWeight:700, color:"var(--qn-purple)", letterSpacing:1,
          textTransform:"uppercase" }}>VitalsHub Analysis — included in MDM</span>
        <div style={{ flex:1 }} />
        <button onClick={onDismiss}
          style={{ background:"transparent", border:"none", cursor:"pointer",
            fontFamily:"'JetBrains Mono',monospace", fontSize:11,
            color:"var(--qn-txt4)", padding:"0 4px" }}>✕</button>
      </div>
      <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
        color:"var(--qn-txt2)", lineHeight:1.7, marginBottom:6 }}>
        {vhAnalysis.trend_narrative}
      </div>
      {vhAnalysis.clinical_flags?.length > 0 && (
        <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
          {vhAnalysis.clinical_flags.map((f, i) => (
            <span key={i} style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:"var(--qn-txt3)", background:"rgba(42,79,122,.25)",
              border:"1px solid rgba(42,79,122,.4)", borderRadius:5,
              padding:"2px 8px", lineHeight:1.5 }}>{f}</span>
          ))}
        </div>
      )}
      <div style={{ marginTop:7, fontFamily:"'JetBrains Mono',monospace", fontSize:8,
        color:"rgba(155,109,255,.6)", letterSpacing:.4 }}>
        This analysis is passed to the MDM AI as additional context. Dismiss to exclude it.
      </div>
    </div>
  );
}

export function AddendumBanner({ addendumRef }) {
  if (!addendumRef) return null;
  return (
    <div style={{ marginBottom:10, padding:"10px 14px", borderRadius:10,
      background:"rgba(59,158,255,.07)", border:"1px solid rgba(59,158,255,.35)" }}>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
        fontWeight:700, color:"var(--qn-blue)", letterSpacing:1.2,
        textTransform:"uppercase", marginBottom:6 }}>
        Addendum Mode — Phase 2 only · Original note reference
      </div>
      <div style={{ display:"flex", gap:16, flexWrap:"wrap",
        fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"var(--qn-txt2)" }}>
        {addendumRef.cc && <span><span style={{ color:"var(--qn-txt4)" }}>CC: </span>{addendumRef.cc}</span>}
        {addendumRef.working_diagnosis && <span><span style={{ color:"var(--qn-txt4)" }}>Dx: </span>{addendumRef.working_diagnosis}</span>}
        {addendumRef.mdm_level && <span><span style={{ color:"var(--qn-txt4)" }}>MDM: </span>{addendumRef.mdm_level}</span>}
        {addendumRef.patient_identifier && <span><span style={{ color:"var(--qn-txt4)" }}>MRN: </span>{addendumRef.patient_identifier}</span>}
      </div>
    </div>
  );
}