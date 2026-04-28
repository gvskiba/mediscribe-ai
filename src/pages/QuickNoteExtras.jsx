// QuickNoteExtras.jsx
// SDM block, Provider Attestation, Nursing Handoff, Prior Visits panel
// Exported: SDMBlock, AttestationBlock, NursingHandoff, PriorVisitsPanel

import React, { useState } from "react";

// ─── SHARED DECISION MAKING BLOCK ────────────────────────────────────────────
export function SDMBlock({ disposition, patientName }) {
  const [copied, setCopied] = useState(false);
  const [customized, setCustomized] = useState(false);
  const [extra, setExtra] = useState("");

  const baseText = `Shared Decision Making:\nRisks, benefits, and alternatives to ${disposition || "the proposed plan"} were discussed with ${patientName ? "the patient, " + patientName + "," : "the patient"} and/or their representative in clear, understandable language. The patient verbalized understanding of their diagnosis, the recommended treatment plan, the potential complications of the plan, and the reason for the recommended ${disposition?.toLowerCase().includes("admit") ? "admission" : "disposition"}. The patient was given the opportunity to ask questions, all of which were addressed. The patient agreed with the proposed plan.${extra ? "\n" + extra : ""}`;

  const copy = () => {
    navigator.clipboard.writeText(baseText).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{ marginBottom:10, padding:"12px 14px", borderRadius:10,
      background:"rgba(59,158,255,.05)", border:"1px solid rgba(59,158,255,.3)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700,
          color:"var(--qn-blue)", letterSpacing:1, textTransform:"uppercase", flex:1 }}>
          Shared Decision Making
        </span>
        <button onClick={() => setCustomized(c => !c)}
          style={{ padding:"2px 8px", borderRadius:5, cursor:"pointer",
            fontFamily:"'JetBrains Mono',monospace", fontSize:7, fontWeight:700,
            border:`1px solid ${customized ? "rgba(59,158,255,.5)" : "rgba(42,79,122,.4)"}`,
            background:"transparent",
            color:customized ? "var(--qn-blue)" : "var(--qn-txt4)",
            letterSpacing:.4, transition:"all .15s" }}>
          {customized ? "▲ Less" : "+ Add Detail"}
        </button>
        <button onClick={copy}
          style={{ padding:"3px 10px", borderRadius:6, cursor:"pointer",
            fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
            border:`1px solid ${copied ? "rgba(61,255,160,.5)" : "rgba(59,158,255,.4)"}`,
            background:copied ? "rgba(61,255,160,.1)" : "rgba(59,158,255,.08)",
            color:copied ? "var(--qn-green)" : "var(--qn-blue)",
            letterSpacing:.4, transition:"all .15s" }}>
          {copied ? "✓ Copied" : "Copy SDM"}
        </button>
      </div>
      <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
        color:"var(--qn-txt2)", lineHeight:1.7, whiteSpace:"pre-wrap" }}>
        {baseText}
      </div>
      {customized && (
        <textarea value={extra} onChange={e => setExtra(e.target.value)}
          rows={2} placeholder="Add additional context (e.g. interpreter used, specific concerns addressed)..."
          style={{ marginTop:8, width:"100%", padding:"6px 9px", borderRadius:7, fontSize:11,
            background:"rgba(14,37,68,.8)", border:"1px solid rgba(59,158,255,.3)",
            color:"var(--qn-txt)", fontFamily:"'DM Sans',sans-serif",
            outline:"none", resize:"vertical", boxSizing:"border-box", lineHeight:1.55 }} />
      )}
      <div style={{ marginTop:6, fontFamily:"'JetBrains Mono',monospace", fontSize:7,
        color:"rgba(59,158,255,.5)", letterSpacing:.4 }}>
        CMS requirement for borderline dispositions — paste into Physician Documentation field
      </div>
    </div>
  );
}

// ─── PROVIDER ATTESTATION BLOCK ───────────────────────────────────────────────
export function AttestationBlock({ providerName, credentials, facility, mdmLevel }) {
  const [copied, setCopied] = useState(false);
  const now = new Date().toLocaleString("en-US", {
    month:"short", day:"numeric", year:"numeric",
    hour:"2-digit", minute:"2-digit"
  });
  const name = [providerName, credentials].filter(Boolean).join(", ");
  const text = `Physician Attestation:\nI personally evaluated this patient, reviewed the history, physical examination, and all available data, and agree with the documentation above. This note accurately reflects my assessment, medical decision making, and the medical necessity for the provided care.\n\nMDM Level: ${mdmLevel || "See MDM section"}\nFacility: ${facility || "Emergency Department"}\n\n${name || "_____________, MD"}\nEmergency Medicine\n${now}`;

  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{ marginBottom:10, padding:"12px 14px", borderRadius:10,
      background:"rgba(155,109,255,.05)", border:"1px solid rgba(155,109,255,.3)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700,
          color:"var(--qn-purple)", letterSpacing:1, textTransform:"uppercase", flex:1 }}>
          Physician Attestation
        </span>
        <button onClick={copy}
          style={{ padding:"3px 10px", borderRadius:6, cursor:"pointer",
            fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
            border:`1px solid ${copied ? "rgba(61,255,160,.5)" : "rgba(155,109,255,.4)"}`,
            background:copied ? "rgba(61,255,160,.1)" : "rgba(155,109,255,.08)",
            color:copied ? "var(--qn-green)" : "var(--qn-purple)",
            letterSpacing:.4, transition:"all .15s" }}>
          {copied ? "✓ Copied" : "Copy Attestation"}
        </button>
      </div>
      <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
        color:"var(--qn-txt2)", lineHeight:1.7, whiteSpace:"pre-wrap" }}>
        {text}
      </div>
      {!providerName && (
        <div style={{ marginTop:6, padding:"5px 8px", borderRadius:6,
          background:"rgba(245,200,66,.07)", border:"1px solid rgba(245,200,66,.25)",
          fontFamily:"'JetBrains Mono',monospace", fontSize:7,
          color:"var(--qn-gold)", letterSpacing:.4 }}>
          Set your name in Settings → User Preferences to auto-populate this block
        </div>
      )}
    </div>
  );
}

// ─── NURSING HANDOFF BLOCK ────────────────────────────────────────────────────
export function NursingHandoff({ patientName, diagnosis, disposition }) {
  const [copied,  setCopied]  = useState(false);
  const [precautions, setPrecautions] = useState(3);
  const [prescriptions, setPrescriptions] = useState("");
  const [followup, setFollowup] = useState("");
  const [expanded, setExpanded] = useState(false);

  const now = new Date().toLocaleString("en-US", { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" });

  const text = [
    `Discharge Documentation — ${now}`,
    `Patient: ${patientName || "_______________"}`,
    `Diagnosis: ${diagnosis || "_______________"}`,
    `Disposition: ${disposition || "Discharge"}`,
    "",
    "Discharge instructions reviewed verbally with patient and/or responsible party.",
    `Patient able to verbalize at least ${precautions} return-to-ED precautions.`,
    `Patient understands their diagnosis and follow-up plan.`,
    followup ? `Follow-up: ${followup}` : "",
    prescriptions ? `Prescriptions provided: ${prescriptions}` : "",
    "",
    "Discharge documentation completed. Patient ambulatory at time of discharge.",
  ].filter(Boolean).join("\n");

  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{ marginBottom:10, borderRadius:10,
      background:"rgba(61,255,160,.04)", border:"1px solid rgba(61,255,160,.25)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px",
        cursor:"pointer" }} onClick={() => setExpanded(e => !e)}>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700,
          color:"var(--qn-green)", letterSpacing:1, textTransform:"uppercase", flex:1 }}>
          Nursing Handoff / Discharge Documentation
        </span>
        <button onClick={e => { e.stopPropagation(); copy(); }}
          style={{ padding:"3px 10px", borderRadius:6, cursor:"pointer",
            fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
            border:`1px solid ${copied ? "rgba(61,255,160,.6)" : "rgba(61,255,160,.3)"}`,
            background:copied ? "rgba(61,255,160,.15)" : "transparent",
            color:copied ? "var(--qn-green)" : "rgba(61,255,160,.7)",
            letterSpacing:.4, transition:"all .15s" }}>
          {copied ? "✓ Copied" : "Copy"}
        </button>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
          color:"var(--qn-txt4)" }}>{expanded ? "▲" : "▼"}</span>
      </div>

      {expanded && (
        <div style={{ padding:"0 14px 14px", borderTop:"1px solid rgba(61,255,160,.15)" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:10, marginBottom:8 }}>
            <div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
                color:"var(--qn-txt4)", letterSpacing:.8, textTransform:"uppercase",
                marginBottom:3 }}>Precautions Verbalized</div>
              <div style={{ display:"flex", gap:5 }}>
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => setPrecautions(n)}
                    style={{ padding:"3px 8px", borderRadius:5, cursor:"pointer",
                      fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700,
                      border:`1px solid ${precautions===n ? "rgba(61,255,160,.5)" : "rgba(42,79,122,.35)"}`,
                      background:precautions===n ? "rgba(61,255,160,.12)" : "transparent",
                      color:precautions===n ? "var(--qn-green)" : "var(--qn-txt4)",
                      transition:"all .12s" }}>{n}</button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
                color:"var(--qn-txt4)", letterSpacing:.8, textTransform:"uppercase",
                marginBottom:3 }}>Follow-up</div>
              <input value={followup} onChange={e => setFollowup(e.target.value)}
                placeholder="e.g. PCP in 3-5 days"
                style={{ width:"100%", padding:"4px 7px", borderRadius:6, fontSize:11,
                  background:"rgba(14,37,68,.8)", border:"1px solid rgba(42,79,122,.4)",
                  color:"var(--qn-txt)", fontFamily:"'DM Sans',sans-serif",
                  outline:"none", boxSizing:"border-box" }} />
            </div>
          </div>
          <div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
              color:"var(--qn-txt4)", letterSpacing:.8, textTransform:"uppercase",
              marginBottom:3 }}>Prescriptions Provided</div>
            <input value={prescriptions} onChange={e => setPrescriptions(e.target.value)}
              placeholder="e.g. Amoxicillin 500mg, Ibuprofen 600mg — or leave blank"
              style={{ width:"100%", padding:"4px 7px", borderRadius:6, fontSize:11,
                background:"rgba(14,37,68,.8)", border:"1px solid rgba(42,79,122,.4)",
                color:"var(--qn-txt)", fontFamily:"'DM Sans',sans-serif",
                outline:"none", boxSizing:"border-box" }} />
          </div>
          <div style={{ marginTop:10, padding:"10px 12px", borderRadius:8,
            background:"rgba(14,37,68,.5)", border:"1px solid rgba(42,79,122,.25)",
            fontFamily:"'DM Sans',sans-serif", fontSize:11,
            color:"var(--qn-txt2)", lineHeight:1.7, whiteSpace:"pre-wrap" }}>
            {text}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PRIOR VISITS PANEL ───────────────────────────────────────────────────────
export function PriorVisitsPanel({ visits, loading, onLoad }) {
  const [expanded, setExpanded] = useState(false);

  if (!onLoad) return null;

  return (
    <div style={{ marginBottom:10, borderRadius:10,
      background:"rgba(8,22,40,.5)", border:"1px solid rgba(42,79,122,.35)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 14px",
        cursor:"pointer" }}
        onClick={() => { setExpanded(e => !e); if (!expanded && !visits && !loading) onLoad(); }}>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700,
          color:"var(--qn-txt4)", letterSpacing:1, textTransform:"uppercase", flex:1 }}>
          📋 Prior Visits
          {visits?.length > 0 && (
            <span style={{ marginLeft:8, color:"var(--qn-blue)" }}>{visits.length} found</span>
          )}
        </span>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
          color:"var(--qn-txt4)" }}>{expanded ? "▲" : "▼"}</span>
      </div>

      {expanded && (
        <div style={{ padding:"0 14px 14px", borderTop:"1px solid rgba(42,79,122,.2)" }}>
          {loading && (
            <div style={{ padding:"12px 0", fontFamily:"'DM Sans',sans-serif",
              fontSize:11, color:"var(--qn-txt4)", textAlign:"center" }}>
              Loading prior visits…
            </div>
          )}
          {!loading && (!visits || !visits.length) && (
            <div style={{ padding:"12px 0", fontFamily:"'DM Sans',sans-serif",
              fontSize:11, color:"var(--qn-txt4)", textAlign:"center" }}>
              No prior visits found
            </div>
          )}
          {visits?.map((v, i) => (
            <div key={i} style={{ marginTop:10, padding:"10px 12px", borderRadius:9,
              background:"rgba(14,37,68,.5)",
              border:"1px solid rgba(42,79,122,.3)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                  fontWeight:700, color:"var(--qn-txt4)", letterSpacing:.5 }}>
                  {v.encounter_date || "Date unknown"}
                </span>
                {v.disposition && (
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
                    color:"var(--qn-txt4)", background:"rgba(42,79,122,.3)",
                    borderRadius:4, padding:"1px 6px" }}>
                    {v.disposition}
                  </span>
                )}
                {i === 0 && (
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
                    color:"var(--qn-teal)", background:"rgba(0,229,192,.1)",
                    border:"1px solid rgba(0,229,192,.25)", borderRadius:4, padding:"1px 6px" }}>
                    Most Recent
                  </span>
                )}
              </div>
              {v.cc && (
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                  fontWeight:600, color:"var(--qn-txt2)", marginBottom:3 }}>
                  CC: {v.cc}
                </div>
              )}
              {v.working_diagnosis && (
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                  color:"var(--qn-txt3)" }}>Dx: {v.working_diagnosis}</div>
              )}
              {v.mdm_level && (
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                  color:"var(--qn-txt4)", marginTop:3 }}>MDM: {v.mdm_level}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}