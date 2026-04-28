// QuickNotePhase2Panel.jsx
// Phase 2 input card: Labs, Imaging, EKG (structured), Recheck Vitals,
//                     Consult Documentation, Critical Flags, Generate Disposition
// Exported: Phase2Panel

import React, { useState } from "react";
import { InputZone } from "./QuickNoteComponents";

function EkgInterpreter({ ekg, setEkg, ekgBusy, onInterpret }) {
  const [fields, setFields] = useState({
    rate:"", rhythm:"", axis:"", pr:"", qrs:"", qtc:"", st:"", impression:"",
  });
  const [expanded, setExpanded] = useState(false);
  const update = (k, v) => setFields(f => ({ ...f, [k]: v }));
  const applyStructured = () => {
    const parts = [
      fields.rate     ? `Rate ${fields.rate} bpm`      : null,
      fields.rhythm   ? `Rhythm: ${fields.rhythm}`      : null,
      fields.axis     ? `Axis: ${fields.axis}`          : null,
      fields.pr       ? `PR ${fields.pr}ms`             : null,
      fields.qrs      ? `QRS ${fields.qrs}ms`           : null,
      fields.qtc      ? `QTc ${fields.qtc}ms`           : null,
      fields.st       ? `ST: ${fields.st}`              : null,
      fields.impression ? `Impression: ${fields.impression}` : null,
    ].filter(Boolean);
    if (parts.length) setEkg(parts.join(", "));
  };
  const hasFields = Object.values(fields).some(v => v.trim());

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700,
          color:"var(--qn-txt4)", letterSpacing:1.5, textTransform:"uppercase", flex:1 }}>
          EKG / ECG
        </div>
        <button onClick={() => setExpanded(e => !e)}
          style={{ padding:"2px 9px", borderRadius:5, cursor:"pointer",
            fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
            border:`1px solid ${expanded ? "rgba(0,229,192,.45)" : "rgba(42,79,122,.4)"}`,
            background:expanded ? "rgba(0,229,192,.08)" : "transparent",
            color:expanded ? "var(--qn-teal)" : "var(--qn-txt4)",
            letterSpacing:.4, transition:"all .15s" }}>
          {expanded ? "▲ Structured" : "▼ Structured Input"}
        </button>
        {ekg.trim() && (
          <button onClick={() => onInterpret && onInterpret(ekg)} disabled={ekgBusy}
            style={{ padding:"2px 9px", borderRadius:5, cursor:"pointer",
              fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
              border:`1px solid ${ekgBusy ? "rgba(42,79,122,.3)" : "rgba(59,158,255,.4)"}`,
              background:ekgBusy ? "rgba(14,37,68,.4)" : "rgba(59,158,255,.07)",
              color:ekgBusy ? "var(--qn-txt4)" : "var(--qn-blue)",
              letterSpacing:.4, transition:"all .15s" }}>
            {ekgBusy ? "● …" : "✦ AI Interpret"}
          </button>
        )}
      </div>
      {expanded && (
        <div style={{ marginBottom:8, padding:"10px 12px", borderRadius:9,
          background:"rgba(59,158,255,.05)", border:"1px solid rgba(59,158,255,.25)" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6, marginBottom:7 }}>
            {[
              { key:"rate",  label:"Rate (bpm)", placeholder:"e.g. 72"     },
              { key:"rhythm",label:"Rhythm",     placeholder:"e.g. NSR"    },
              { key:"axis",  label:"Axis",       placeholder:"e.g. Normal" },
              { key:"pr",    label:"PR (ms)",    placeholder:"e.g. 160"    },
              { key:"qrs",   label:"QRS (ms)",   placeholder:"e.g. 88"     },
              { key:"qtc",   label:"QTc (ms)",   placeholder:"e.g. 440"    },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
                  color:"var(--qn-txt4)", letterSpacing:.8, textTransform:"uppercase",
                  marginBottom:3 }}>{label}</div>
                <input value={fields[key]} onChange={e => update(key, e.target.value)}
                  placeholder={placeholder}
                  style={{ width:"100%", padding:"4px 7px", borderRadius:6, fontSize:10,
                    background:"rgba(14,37,68,.8)", border:"1px solid rgba(42,79,122,.45)",
                    color:"var(--qn-txt)", fontFamily:"'JetBrains Mono',monospace",
                    outline:"none", boxSizing:"border-box" }} />
              </div>
            ))}
          </div>
          {[
            { key:"st",         label:"ST Segments / Other", placeholder:"e.g. No ST elevation or depression, no T-wave changes" },
            { key:"impression", label:"Impression",          placeholder:"e.g. Normal sinus rhythm, no acute ischemic changes" },
          ].map(({ key, label, placeholder }) => (
            <div key={key} style={{ marginBottom:7 }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
                color:"var(--qn-txt4)", letterSpacing:.8, textTransform:"uppercase",
                marginBottom:3 }}>{label}</div>
              <input value={fields[key]} onChange={e => update(key, e.target.value)}
                placeholder={placeholder}
                style={{ width:"100%", padding:"4px 7px", borderRadius:6, fontSize:10,
                  background:"rgba(14,37,68,.8)", border:"1px solid rgba(42,79,122,.45)",
                  color:"var(--qn-txt)", fontFamily:"'DM Sans',sans-serif",
                  outline:"none", boxSizing:"border-box" }} />
            </div>
          ))}
          {hasFields && (
            <button onClick={applyStructured}
              style={{ padding:"4px 12px", borderRadius:6, cursor:"pointer",
                fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
                border:"1px solid rgba(59,158,255,.4)", background:"rgba(59,158,255,.1)",
                color:"var(--qn-blue)", transition:"all .15s" }}>
              Apply to EKG Field →
            </button>
          )}
        </div>
      )}
      <textarea value={ekg} onChange={e => setEkg(e.target.value)}
        className="qn-ta p2-active" rows={2} data-phase={2}
        placeholder="Paste or use structured input above — rate, rhythm, intervals, ST changes, impression..." />
    </div>
  );
}

function ConsultDocs({ consults, setConsults }) {
  const [expanded, setExpanded] = useState(false);
  const add = () => setConsults(prev => [...prev,
    { id:`cons-${Date.now()}`, service:"", provider:"", time:"", recommendation:"" }]);
  const update = (id, f, v) => setConsults(prev => prev.map(c => c.id===id ? {...c,[f]:v} : c));
  const remove = (id) => setConsults(prev => prev.filter(c => c.id !== id));
  return (
    <div style={{ marginBottom:12, borderRadius:9,
      background:"rgba(8,22,40,.4)", border:"1px solid rgba(42,79,122,.3)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px",
        cursor:"pointer" }} onClick={() => setExpanded(e => !e)}>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700,
          color:"var(--qn-txt4)", letterSpacing:1.2, textTransform:"uppercase", flex:1 }}>
          Consult Documentation
          {consults.length > 0 && <span style={{ marginLeft:8, color:"var(--qn-teal)" }}>
            {consults.length} consult{consults.length>1?"s":""}
          </span>}
        </span>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
          color:"rgba(42,79,122,.7)", letterSpacing:.4 }}>Adds to MDM data complexity</span>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
          color:"var(--qn-txt4)" }}>{expanded ? "▲" : "▼"}</span>
      </div>
      {expanded && (
        <div style={{ padding:"0 12px 12px", borderTop:"1px solid rgba(42,79,122,.2)" }}>
          {consults.length === 0 && (
            <div style={{ padding:"10px 0", fontFamily:"'DM Sans',sans-serif",
              fontSize:11, color:"var(--qn-txt4)", textAlign:"center" }}>
              No consults documented
            </div>
          )}
          {consults.map(c => (
            <div key={c.id} style={{ marginTop:10, padding:"10px", borderRadius:8,
              background:"rgba(14,37,68,.5)", border:"1px solid rgba(42,79,122,.3)" }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr auto auto",
                gap:7, marginBottom:7 }}>
                {[
                  { f:"service",  label:"Service",  ph:"e.g. Cardiology", type:"text" },
                  { f:"provider", label:"Provider", ph:"Dr. name",         type:"text" },
                ].map(({ f, label, ph }) => (
                  <div key={f}>
                    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
                      color:"var(--qn-txt4)", letterSpacing:.8, textTransform:"uppercase",
                      marginBottom:3 }}>{label}</div>
                    <input value={c[f]} onChange={e => update(c.id, f, e.target.value)}
                      placeholder={ph}
                      style={{ width:"100%", padding:"4px 7px", borderRadius:6, fontSize:11,
                        background:"rgba(8,22,40,.8)", border:"1px solid rgba(42,79,122,.4)",
                        color:"var(--qn-txt)", fontFamily:"'DM Sans',sans-serif",
                        outline:"none", boxSizing:"border-box" }} />
                  </div>
                ))}
                <div>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
                    color:"var(--qn-txt4)", letterSpacing:.8, textTransform:"uppercase",
                    marginBottom:3 }}>Time</div>
                  <input type="time" value={c.time} onChange={e => update(c.id, "time", e.target.value)}
                    style={{ padding:"4px 7px", borderRadius:6, fontSize:11,
                      background:"rgba(8,22,40,.8)", border:"1px solid rgba(42,79,122,.4)",
                      color:"var(--qn-txt)", fontFamily:"'JetBrains Mono',monospace",
                      outline:"none", width:90 }} />
                </div>
                <button onClick={() => remove(c.id)}
                  style={{ alignSelf:"flex-end", background:"transparent", border:"none",
                    cursor:"pointer", color:"var(--qn-txt4)", fontSize:16,
                    lineHeight:1, padding:"4px" }}>×</button>
              </div>
              <div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
                  color:"var(--qn-txt4)", letterSpacing:.8, textTransform:"uppercase",
                  marginBottom:3 }}>Recommendation</div>
                <textarea value={c.recommendation}
                  onChange={e => update(c.id, "recommendation", e.target.value)}
                  rows={2} placeholder="Consult recommendations and plan..."
                  style={{ width:"100%", padding:"5px 8px", borderRadius:6, fontSize:11,
                    background:"rgba(8,22,40,.8)", border:"1px solid rgba(42,79,122,.4)",
                    color:"var(--qn-txt)", fontFamily:"'DM Sans',sans-serif",
                    outline:"none", resize:"vertical", boxSizing:"border-box",
                    lineHeight:1.55 }} />
              </div>
            </div>
          ))}
          <button onClick={add} style={{ marginTop:8, padding:"5px 14px", borderRadius:7,
            cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
            border:"1px solid rgba(0,229,192,.35)", background:"rgba(0,229,192,.07)",
            color:"var(--qn-teal)", transition:"all .15s" }}>+ Add Consult</button>
        </div>
      )}
    </div>
  );
}

function CriticalFlagsBar({ flags }) {
  if (!flags || !flags.length) return null;
  return (
    <div style={{ marginBottom:12, padding:"10px 12px", borderRadius:9,
      background:"rgba(255,68,68,.08)", border:"1px solid rgba(255,68,68,.4)" }}>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700,
        color:"var(--qn-red)", letterSpacing:1.2, textTransform:"uppercase", marginBottom:8 }}>
        ⚡ Critical Values Detected
      </div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
        {flags.map((f, i) => (
          <div key={i} style={{ padding:"3px 10px", borderRadius:6,
            background:"rgba(255,68,68,.12)", border:"1px solid rgba(255,68,68,.35)" }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
              fontWeight:700, color:"var(--qn-red)" }}>{f.label}</span>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
              color:"rgba(255,200,200,.9)", marginLeft:6 }}>{f.value}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop:6, fontFamily:"'DM Sans',sans-serif", fontSize:10,
        color:"rgba(255,150,150,.7)", lineHeight:1.4 }}>
        Verify before generating disposition — these will be flagged in result flags.
      </div>
    </div>
  );
}

export function Phase2Panel({
  labs, setLabs, imaging, setImaging, ekg, setEkg, newVitals, setNewVitals,
  p2Busy, p1Busy, p2Error, phase2Ready, mdmResult, dispResult, dispColor,
  setRef, makeKeyDown, runDisposition,
  consults, setConsults,
  criticalFlags,
  ekgBusy, onEkgInterpret,
}) {
  return (
    <div className="qn-fade" style={{ marginBottom:14, background:"rgba(8,22,40,.5)",
      border:"1px solid rgba(59,158,255,.35)", borderRadius:14, padding:"16px" }}>

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

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
        <InputZone label="Labs" value={labs} onChange={setLabs} phase={2} rows={4}
          kbdHint="Alt+L"
          placeholder="Paste lab results — CBC, BMP, troponin, lactate, UA, coags..."
          onRef={setRef(5)} onKeyDown={makeKeyDown(5, false, runDisposition)} />
        <InputZone label="Imaging / Studies" value={imaging} onChange={setImaging}
          phase={2} rows={4}
          placeholder="Paste imaging results — CXR, CT, US, POCUS findings..."
          onRef={setRef(6)} onKeyDown={makeKeyDown(6, false, runDisposition)} />
      </div>

      <CriticalFlagsBar flags={criticalFlags} />

      <div style={{ marginBottom:12 }}>
        <EkgInterpreter ekg={ekg} setEkg={setEkg}
          ekgBusy={ekgBusy} onInterpret={onEkgInterpret} />
      </div>

      <div style={{ marginBottom:12 }}>
        <InputZone label="Re-check Vitals / Response to Treatment" value={newVitals}
          onChange={setNewVitals} phase={2} rows={2}
          placeholder="e.g. After IVF 1L: HR 88 BP 128/76 SpO2 99% — pain improved to 3/10"
          onRef={setRef(7)} onKeyDown={makeKeyDown(7, true, runDisposition)} />
      </div>

      <ConsultDocs consults={consults} setConsults={setConsults} />

      {!phase2Ready && mdmResult && (
        <div style={{ marginBottom:12, padding:"7px 11px", borderRadius:8,
          background:"rgba(245,200,66,.07)", border:"1px solid rgba(245,200,66,.3)",
          fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"var(--qn-gold)",
          display:"flex", alignItems:"center", gap:7 }}>
          <span>⚠</span>
          No workup data entered. Enter at least one result above for a workup-informed disposition, or generate now for a clinical-impression-only assessment.
        </div>
      )}

      <button className="qn-btn" onClick={runDisposition}
        disabled={p2Busy || !mdmResult || p1Busy}
        style={{ width:"100%",
          border:`1px solid ${p2Busy||p1Busy ? "rgba(42,79,122,.3)" : "rgba(59,158,255,.5)"}`,
          background:p2Busy||p1Busy ? "rgba(14,37,68,.5)"
            : "linear-gradient(135deg,rgba(59,158,255,.15),rgba(59,158,255,.04))",
          color:p2Busy||p1Busy ? "var(--qn-txt4)" : "var(--qn-blue)" }}>
        {p2Busy
          ? <><span className="qn-busy-dot">●</span>Generating Reevaluation &amp; Disposition...</>
          : <>✦ Generate Reevaluation + Disposition  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, opacity:.6 }}>[Cmd+Enter]</span></>
        }
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