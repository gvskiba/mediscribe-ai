// QuickNotePhase2Panel.jsx  v11.4
// Phase 2 panel: Labs (AI recs + chip selector), Imaging (AI recs + chip selector),
// EKG (AI interpret), New Vitals, Consults, Critical Flags, Generate Disposition
// Exported: Phase2Panel

import React, { useState } from "react";
import { RecentLabsPanel } from "./QuickNoteRecentLabs";

// ─── Shared styles ────────────────────────────────────────────────────────────
const TEXTAREA = {
  width:"100%", boxSizing:"border-box", resize:"vertical",
  padding:"9px 12px", borderRadius:8,
  background:"rgba(14,37,68,.5)", border:"1px solid rgba(42,79,122,.4)",
  color:"var(--qn-txt1)", fontFamily:"'DM Sans',sans-serif",
  fontSize:13, lineHeight:1.55, outline:"none", transition:"border-color .15s",
};
const FOCUS_ON  = e => e.target.style.borderColor = "rgba(0,229,192,.5)";
const FOCUS_OFF = e => e.target.style.borderColor = "rgba(42,79,122,.4)";
const LABEL = {
  fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
  color:"var(--qn-txt4)", letterSpacing:1, textTransform:"uppercase",
};

// ─── Priority color map ───────────────────────────────────────────────────────
const PRIORITY_STYLE = {
  immediate: { color:"var(--qn-coral)",  bg:"rgba(255,107,107,.1)",  bd:"rgba(255,107,107,.35)", label:"IMMEDIATE" },
  urgent:    { color:"var(--qn-gold)",   bg:"rgba(245,200,66,.1)",   bd:"rgba(245,200,66,.3)",   label:"URGENT"    },
  consider:  { color:"var(--qn-txt3)",   bg:"rgba(42,79,122,.15)",   bd:"rgba(42,79,122,.4)",    label:"CONSIDER"  },
  recommended:{ color:"var(--qn-blue)",  bg:"rgba(59,158,255,.1)",   bd:"rgba(59,158,255,.35)",  label:"INDICATED" },
};

// ─── Lab chip selector ────────────────────────────────────────────────────────
function LabChipSelector({ labRecs, labRecsBusy, onAddLab, addedLabs }) {
  if (!labRecs && !labRecsBusy) return null;
  if (labRecsBusy) return (
    <div style={{ padding:"8px 12px", borderRadius:8, background:"rgba(14,37,68,.4)",
      border:"1px solid rgba(42,79,122,.3)", marginTop:6,
      fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:"var(--qn-txt4)" }}>
      ● Generating lab recommendations…
    </div>
  );
  if (!labRecs) return null;

  const groups = [
    { key:"immediate", items:labRecs.immediate||[] },
    { key:"urgent",    items:labRecs.urgent||[]    },
    { key:"consider",  items:labRecs.consider||[]  },
  ].filter(g => g.items.length > 0);

  return (
    <div className="qn-fade" style={{ marginTop:6, padding:"10px 12px", borderRadius:10,
      background:"rgba(8,22,40,.5)", border:"1px solid rgba(59,158,255,.25)" }}>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
        color:"var(--qn-blue)", letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>
        AI Lab Recommendations · click to add
      </div>
      {groups.map(({ key, items }) => {
        const ps = PRIORITY_STYLE[key] || PRIORITY_STYLE.consider;
        return (
          <div key={key} style={{ marginBottom:8 }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7, fontWeight:700,
              color:ps.color, letterSpacing:1, textTransform:"uppercase", marginBottom:5 }}>
              {ps.label}
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
              {items.map((lab, i) => {
                const added = addedLabs.includes(lab.name);
                return (
                  <button key={i}
                    onClick={() => onAddLab(lab.name, key)}
                    title={lab.rationale}
                    style={{ padding:"4px 10px", borderRadius:6, cursor:"pointer",
                      fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600,
                      transition:"all .15s",
                      border:`1px solid ${added ? "rgba(61,255,160,.5)" : ps.bd}`,
                      background:added ? "rgba(61,255,160,.1)" : ps.bg,
                      color:added ? "var(--qn-green)" : ps.color }}>
                    {added && "✓ "}{lab.name}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      <div style={{ marginTop:6, fontFamily:"'JetBrains Mono',monospace", fontSize:7,
        color:"rgba(107,158,200,.45)", letterSpacing:.4 }}>
        Hover any chip for clinical rationale · based on ACEP/ACC/AHA guidelines
      </div>
    </div>
  );
}

// ─── Imaging chip selector ─────────────────────────────────────────────────────
function ImagingChipSelector({ imagingRecs, imagingRecsBusy, onAddImaging, addedImaging }) {
  if (!imagingRecs && !imagingRecsBusy) return null;
  if (imagingRecsBusy) return (
    <div style={{ padding:"8px 12px", borderRadius:8, background:"rgba(14,37,68,.4)",
      border:"1px solid rgba(42,79,122,.3)", marginTop:6,
      fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:"var(--qn-txt4)" }}>
      ● Generating imaging recommendations…
    </div>
  );
  if (!imagingRecs) return null;

  const groups = [
    { key:"recommended", items:imagingRecs.recommended||[] },
    { key:"consider",    items:imagingRecs.consider||[]    },
  ].filter(g => g.items.length > 0);

  return (
    <div className="qn-fade" style={{ marginTop:6, padding:"10px 12px", borderRadius:10,
      background:"rgba(8,22,40,.5)", border:"1px solid rgba(155,109,255,.25)" }}>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
        color:"var(--qn-purple)", letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>
        AI Imaging Recommendations · click to add
      </div>
      {groups.map(({ key, items }) => {
        const ps = key === "recommended" ? PRIORITY_STYLE.recommended : PRIORITY_STYLE.consider;
        return (
          <div key={key} style={{ marginBottom:8 }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7, fontWeight:700,
              color:ps.color, letterSpacing:1, textTransform:"uppercase", marginBottom:5 }}>
              {ps.label}
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
              {items.map((img, i) => {
                const added = addedImaging.includes(img.modality);
                return (
                  <button key={i}
                    onClick={() => onAddImaging(img.modality, img.guideline)}
                    title={`${img.indication}${img.guideline ? " · " + img.guideline : ""}`}
                    style={{ padding:"4px 10px", borderRadius:6, cursor:"pointer",
                      fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600,
                      transition:"all .15s",
                      border:`1px solid ${added ? "rgba(61,255,160,.5)" : ps.bd}`,
                      background:added ? "rgba(61,255,160,.1)" : ps.bg,
                      color:added ? "var(--qn-green)" : ps.color }}>
                    {added && "✓ "}{img.modality}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      <div style={{ marginTop:6, fontFamily:"'JetBrains Mono',monospace", fontSize:7,
        color:"rgba(107,158,200,.45)", letterSpacing:.4 }}>
        Hover any chip for indication and guideline source
      </div>
    </div>
  );
}

// ─── Consult entry row ────────────────────────────────────────────────────────
function ConsultRow({ consult, onChange, onRemove }) {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 80px 1fr auto", gap:6,
      marginBottom:6, alignItems:"start" }}>
      {[
        { key:"service",        placeholder:"Service (e.g. Cardiology)" },
        { key:"provider",       placeholder:"Provider (e.g. Dr. Smith)"  },
        { key:"time",           placeholder:"Time"                        },
        { key:"recommendation", placeholder:"Recommendation / plan"       },
      ].map(({ key, placeholder }) => (
        <input key={key} type="text" value={consult[key]||""}
          onChange={e => onChange(key, e.target.value)}
          placeholder={placeholder}
          style={{ padding:"6px 9px", borderRadius:6,
            background:"rgba(14,37,68,.6)", border:"1px solid rgba(42,79,122,.4)",
            color:"var(--qn-txt)", fontFamily:"'DM Sans',sans-serif", fontSize:11,
            outline:"none", width:"100%", boxSizing:"border-box" }} />
      ))}
      <button onClick={onRemove}
        style={{ padding:"6px 10px", borderRadius:6, cursor:"pointer",
          border:"1px solid rgba(255,107,107,.3)", background:"rgba(255,107,107,.07)",
          color:"var(--qn-coral)", fontFamily:"'JetBrains Mono',monospace",
          fontSize:10, fontWeight:700 }}>✕</button>
    </div>
  );
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────
export function Phase2Panel({
  // Result fields
  labs,       setLabs,
  imaging,    setImaging,
  ekg,        setEkg,
  newVitals,  setNewVitals,
  // Status
  p2Busy, p1Busy, p2Error,
  phase2Ready, mdmResult, dispResult,
  // Styling
  dispColor,
  // Refs + nav
  setRef, makeKeyDown,
  // Submit
  runDisposition,
  // Consults
  consults, setConsults,
  onConsultsChange,
  // Critical flags (from parent sync detector)
  criticalFlags,
  // EKG AI interpret
  ekgBusy, onEkgInterpret,
  // v11.4: AI lab recommendations
  labRecs, labRecsBusy, generateLabRecs,
  // v11.4: AI imaging recommendations
  imagingRecs, imagingRecsBusy, generateImagingRecs,
  // patient id for recent labs lookup
  patientId,
}) {
  // Track which chips have been added (for UI state)
  const [addedLabs,    setAddedLabs]    = useState([]);
  const [addedImaging, setAddedImaging] = useState([]);
  const [showConsults, setShowConsults] = useState(false);

  const handleAddLab = (labName, priority) => {
    const prefix = priority === "immediate" ? "STAT: " : "";
    const line   = `${prefix}${labName}`;
    setLabs(prev => prev.trim() ? prev.trim() + "\n" + line : line);
    setAddedLabs(prev => prev.includes(labName) ? prev : [...prev, labName]);
  };

  const handleAddImaging = (modality, guideline) => {
    const line = guideline ? `${modality} (${guideline})` : modality;
    setImaging(prev => prev.trim() ? prev.trim() + "\n" + line : line);
    setAddedImaging(prev => prev.includes(modality) ? prev : [...prev, modality]);
  };

  const addConsult = () => {
    const next = [...(consults||[]), { service:"", provider:"", time:"", recommendation:"" }];
    setConsults(next);
    if (onConsultsChange) onConsultsChange(next);
    setShowConsults(true);
  };

  const updateConsult = (idx, field, val) => {
    const next = (consults||[]).map((c,i) => i===idx ? {...c,[field]:val} : c);
    setConsults(next);
    if (onConsultsChange) onConsultsChange(next);
  };

  return (
    <div style={{ marginBottom:14, background:"rgba(8,22,40,.5)",
      border:"1px solid rgba(59,158,255,.3)", borderRadius:14, padding:"16px" }}>

      {/* Phase header */}
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14, flexWrap:"wrap" }}>
        <div style={{ width:24, height:24, borderRadius:"50%",
          background:"rgba(59,158,255,.15)", border:"1px solid rgba(59,158,255,.4)",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontFamily:"'JetBrains Mono',monospace", fontSize:11,
          fontWeight:700, color:"var(--qn-blue)", flexShrink:0 }}>2</div>
        <div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
            fontSize:15, color:"var(--qn-blue)" }}>Results & Disposition</div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
            color:"var(--qn-txt4)", letterSpacing:.8 }}>
            Enter results → AI updates MDM → generates disposition
          </div>
        </div>
        {dispResult && (
          <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:6,
            padding:"4px 10px", borderRadius:7,
            background:`${dispColor(dispResult.disposition)}18`,
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

      {/* Critical Flags Banner */}
      {criticalFlags?.length > 0 && (
        <div style={{ marginBottom:12, padding:"8px 12px", borderRadius:8,
          background:"rgba(255,107,107,.1)", border:"1px solid rgba(255,107,107,.45)",
          display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            fontWeight:700, color:"var(--qn-coral)", letterSpacing:1,
            textTransform:"uppercase", flexShrink:0 }}>⚠ Critical Values</span>
          {criticalFlags.map((f,i) => (
            <span key={i} style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
              fontWeight:700, color:"var(--qn-coral)",
              background:"rgba(255,107,107,.12)", border:"1px solid rgba(255,107,107,.4)",
              borderRadius:5, padding:"2px 8px" }}>
              {f.label}: {f.value}
            </span>
          ))}
        </div>
      )}

      {/* ── Labs ─────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom:12 }}>
        {/* Labs label row */}
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6, flexWrap:"wrap" }}>
          <span style={{ ...LABEL, flex:1 }}>Laboratory Results</span>

          {/* v11.4: AI Lab Recommendations button */}
          {mdmResult && (
            <button
              onClick={generateLabRecs}
              disabled={labRecsBusy}
              title="AI-recommended labs based on working diagnosis and guidelines"
              style={{ padding:"3px 11px", borderRadius:6, cursor:"pointer",
                fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
                transition:"all .15s",
                border:`1px solid ${labRecsBusy ? "rgba(42,79,122,.3)" : "rgba(59,158,255,.5)"}`,
                background:labRecsBusy ? "rgba(14,37,68,.4)" : "rgba(59,158,255,.1)",
                color:labRecsBusy ? "var(--qn-txt4)" : "var(--qn-blue)" }}>
              {labRecsBusy ? "● Loading…" : labRecs ? "↻ Re-run Labs" : "💡 AI Lab Recs"}
            </button>
          )}

          {/* Recent labs pull button */}
          <RecentLabsPanel
            patientId={patientId}
            currentLabs={labs}
            onImport={(text) => setLabs(text)}
          />

          {/* Clear recs toggle */}
          {labRecs && (
            <button onClick={() => { setAddedLabs([]); }}
              style={{ padding:"3px 8px", borderRadius:5, cursor:"pointer",
                fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                border:"1px solid rgba(42,79,122,.3)", background:"transparent",
                color:"var(--qn-txt4)", transition:"all .15s" }}>
              Clear
            </button>
          )}
        </div>

        <textarea
          rows={4} value={labs}
          onChange={e => setLabs(e.target.value)}
          placeholder="Paste or type lab results — or use 💡 AI Lab Recs above to select evidence-based labs for this presentation…"
          data-phase="2"
          onKeyDown={makeKeyDown ? makeKeyDown(5, false, runDisposition) : undefined}
          style={{ ...TEXTAREA }}
          onFocus={FOCUS_ON} onBlur={FOCUS_OFF}
        />

        {/* Lab chip selector */}
        <LabChipSelector
          labRecs={labRecs}
          labRecsBusy={labRecsBusy}
          onAddLab={handleAddLab}
          addedLabs={addedLabs}
        />
      </div>

      {/* ── Imaging ──────────────────────────────────────────────────────── */}
      <div style={{ marginBottom:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6, flexWrap:"wrap" }}>
          <span style={{ ...LABEL, flex:1 }}>Imaging Results</span>

          {/* v11.4: AI Imaging Recommendations button */}
          {mdmResult && (
            <button
              onClick={generateImagingRecs}
              disabled={imagingRecsBusy}
              title="AI-recommended imaging based on working diagnosis and guidelines"
              style={{ padding:"3px 11px", borderRadius:6, cursor:"pointer",
                fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
                transition:"all .15s",
                border:`1px solid ${imagingRecsBusy ? "rgba(42,79,122,.3)" : "rgba(155,109,255,.5)"}`,
                background:imagingRecsBusy ? "rgba(14,37,68,.4)" : "rgba(155,109,255,.1)",
                color:imagingRecsBusy ? "var(--qn-txt4)" : "var(--qn-purple)" }}>
              {imagingRecsBusy ? "● Loading…" : imagingRecs ? "↻ Re-run Imaging" : "💡 AI Imaging Recs"}
            </button>
          )}
          {imagingRecs && (
            <button onClick={() => setAddedImaging([])}
              style={{ padding:"3px 8px", borderRadius:5, cursor:"pointer",
                fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                border:"1px solid rgba(42,79,122,.3)", background:"transparent",
                color:"var(--qn-txt4)", transition:"all .15s" }}>
              Clear
            </button>
          )}
        </div>

        <textarea
          rows={3} value={imaging}
          onChange={e => setImaging(e.target.value)}
          placeholder="Paste or type imaging results — or use 💡 AI Imaging Recs above…"
          data-phase="2"
          onKeyDown={makeKeyDown ? makeKeyDown(6, false, runDisposition) : undefined}
          style={{ ...TEXTAREA }}
          onFocus={FOCUS_ON} onBlur={FOCUS_OFF}
        />

        {/* Imaging chip selector */}
        <ImagingChipSelector
          imagingRecs={imagingRecs}
          imagingRecsBusy={imagingRecsBusy}
          onAddImaging={handleAddImaging}
          addedImaging={addedImaging}
        />
      </div>

      {/* ── EKG + New Vitals row ──────────────────────────────────────────── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>

        {/* EKG */}
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
            <span style={{ ...LABEL, flex:1 }}>EKG</span>
            {ekg.trim() && (
              <button
                onClick={() => onEkgInterpret(ekg)}
                disabled={ekgBusy}
                title="AI EKG interpretation for chart documentation"
                style={{ padding:"3px 10px", borderRadius:6, cursor:"pointer",
                  fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
                  border:`1px solid ${ekgBusy ? "rgba(42,79,122,.3)" : "rgba(245,200,66,.4)"}`,
                  background:ekgBusy ? "rgba(14,37,68,.4)" : "rgba(245,200,66,.07)",
                  color:ekgBusy ? "var(--qn-txt4)" : "var(--qn-gold)",
                  letterSpacing:.5, transition:"all .15s" }}>
                {ekgBusy ? "● …" : "✦ Interpret"}
              </button>
            )}
          </div>
          <textarea
            rows={3} value={ekg}
            onChange={e => setEkg(e.target.value)}
            placeholder="e.g. NSR 76 bpm, normal axis, no ST changes — or paste raw EKG data then click Interpret…"
            data-phase="2"
            style={{ ...TEXTAREA, fontSize:12 }}
            onFocus={FOCUS_ON} onBlur={FOCUS_OFF}
          />
        </div>

        {/* New Vitals */}
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
            <span style={{ ...LABEL, flex:1 }}>Recheck Vitals</span>
          </div>
          <textarea
            rows={3} value={newVitals}
            onChange={e => setNewVitals(e.target.value)}
            placeholder="e.g. HR 84  BP 128/76  RR 16  SpO2 99%  T 37.1 — reassessment at 60 min post-treatment…"
            data-phase="2"
            onKeyDown={makeKeyDown ? makeKeyDown(7, false, runDisposition) : undefined}
            style={{ ...TEXTAREA, fontFamily:"'JetBrains Mono',monospace", fontSize:12 }}
            onFocus={FOCUS_ON} onBlur={FOCUS_OFF}
          />
        </div>
      </div>

      {/* ── Consults ─────────────────────────────────────────────────────── */}
      <div style={{ marginBottom:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
          <span style={{ ...LABEL, flex:1 }}>Consults</span>
          <button onClick={addConsult}
            style={{ padding:"3px 11px", borderRadius:6, cursor:"pointer",
              fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
              border:"1px solid rgba(0,229,192,.35)", background:"rgba(0,229,192,.07)",
              color:"var(--qn-teal)", letterSpacing:.5, transition:"all .15s" }}>
            + Add Consult
          </button>
          {consults.length > 0 && (
            <button onClick={() => setShowConsults(s => !s)}
              style={{ padding:"3px 8px", borderRadius:5, cursor:"pointer",
                fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                border:"1px solid rgba(42,79,122,.35)", background:"transparent",
                color:"var(--qn-txt4)", transition:"all .15s" }}>
              {showConsults ? "▲ Hide" : `▼ Show (${consults.length})`}
            </button>
          )}
        </div>

        {consults.length > 0 && showConsults && (
          <div style={{ padding:"10px 12px", borderRadius:8,
            background:"rgba(14,37,68,.4)", border:"1px solid rgba(42,79,122,.3)" }}>
            {consults.map((c, i) => (
              <ConsultRow
                key={i}
                consult={c}
                onChange={(field, val) => updateConsult(i, field, val)}
                onRemove={() => {
                  const next = (consults||[]).filter((_,idx) => idx !== i);
                  setConsults(next);
                  if (onConsultsChange) onConsultsChange(next);
                }}
              />
            ))}
          </div>
        )}

        {consults.length > 0 && !showConsults && (
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {consults.map((c, i) => (
              <span key={i} style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:"var(--qn-teal)", background:"rgba(0,229,192,.08)",
                border:"1px solid rgba(0,229,192,.25)", borderRadius:5, padding:"2px 9px" }}>
                {c.service || "Consult"}{c.provider ? ` — Dr. ${c.provider}` : ""}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Generate Disposition ──────────────────────────────────────────── */}
      <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
        {p2Error && (
          <div style={{ flex:1, padding:"6px 10px", borderRadius:6,
            background:"rgba(255,107,107,.08)", border:"1px solid rgba(255,107,107,.3)",
            fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"var(--qn-coral)" }}>
            {p2Error}
          </div>
        )}
        <div style={{ flex:1 }} />
        <button
          onClick={runDisposition}
          disabled={p2Busy || p1Busy || !mdmResult}
          style={{ padding:"10px 28px", borderRadius:10,
            cursor:p2Busy||p1Busy||!mdmResult ? "not-allowed" : "pointer",
            fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:13,
            border:`1px solid ${p2Busy||p1Busy ? "rgba(42,79,122,.3)" : mdmResult ? "rgba(59,158,255,.5)" : "rgba(42,79,122,.3)"}`,
            background:p2Busy||p1Busy ? "rgba(14,37,68,.6)"
              : mdmResult ? "linear-gradient(135deg,rgba(59,158,255,.18),rgba(59,158,255,.08))"
              : "rgba(14,37,68,.4)",
            color:p2Busy||p1Busy ? "var(--qn-txt4)" : mdmResult ? "var(--qn-blue)" : "var(--qn-txt4)",
            transition:"all .18s", letterSpacing:.2,
            boxShadow:mdmResult&&!p2Busy ? "0 0 18px rgba(59,158,255,.12)" : "none",
            opacity:!mdmResult ? .45 : 1 }}>
          {p2Busy
            ? <><span style={{ marginRight:6 }}>●</span>Generating Disposition…</>
            : dispResult
            ? "↻ Re-run Disposition"
            : <>Generate Final Impression → <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, opacity:.5, marginLeft:8 }}>⌘↵</span></>
          }
        </button>
      </div>
    </div>
  );
}