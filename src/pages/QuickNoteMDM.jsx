// QuickNoteMDM.jsx
// MDM result display components extracted from QuickNoteComponents
// DifferentialCard, QuickDDxCard, MDMResult

import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";

function s(v) {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object") {
    const f = v;
    const parts = [];
    if (f.test_name || f.name)  parts.push(f.test_name || f.name);
    if (f.timing)                parts.push("in " + f.timing);
    if (f.indication)            parts.push(f.indication);
    if (f.decision_threshold || f.threshold) parts.push("→ " + (f.decision_threshold || f.threshold));
    if (f.action)                parts.push(f.action);
    if (f.recommendation)        parts.push(f.recommendation);
    if (f.intervention)          parts.push(f.intervention);
    return parts.length ? parts.join(" — ") : JSON.stringify(v);
  }
  return String(v);
}

function SectionLabel({ children, color = "var(--qn-txt4)" }) {
  return (
    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700,
      color, letterSpacing:1.5, textTransform:"uppercase", marginBottom:6 }}>
      {children}
    </div>
  );
}

function mdmLevelColor(level) {
  const l = (level || "").toLowerCase();
  if (l.includes("high"))             return "#ff4444";
  if (l.includes("moderate"))         return "#ff9f43";
  if (l.includes("low"))              return "#f5c842";
  if (l.includes("straightforward"))  return "#3dffa0";
  return "#3b9eff";
}

const PROB_CONFIG = {
  high:     { color:"var(--qn-coral)",  bg:"rgba(255,107,107,.1)",  bd:"rgba(255,107,107,.35)", label:"HIGH"    },
  moderate: { color:"var(--qn-gold)",   bg:"rgba(245,200,66,.08)",  bd:"rgba(245,200,66,.3)",   label:"MOD"     },
  low:      { color:"var(--qn-txt3)",   bg:"rgba(130,174,206,.07)", bd:"rgba(130,174,206,.25)", label:"LOW"     },
};

function DDxItem({ item, idx, expanded, onToggle }) {
  const prob  = (item.probability || "low").toLowerCase();
  const pc    = PROB_CONFIG[prob] || PROB_CONFIG.low;
  const isMNM = item.must_not_miss;

  return (
    <div style={{ borderRadius:9, overflow:"hidden",
      border:`1px solid ${isMNM ? "rgba(255,68,68,.4)" : pc.bd}`,
      background: isMNM ? "rgba(255,68,68,.05)" : pc.bg }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px",
        cursor:"pointer" }} onClick={onToggle}>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
          color:"var(--qn-txt4)", flexShrink:0, minWidth:16 }}>{idx + 1}.</span>
        {isMNM && (
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
            fontWeight:700, color:"var(--qn-red)",
            background:"rgba(255,68,68,.15)", border:"1px solid rgba(255,68,68,.4)",
            borderRadius:3, padding:"1px 5px", letterSpacing:.6, flexShrink:0 }}>⚠ MUST NOT MISS</span>
        )}
        <span style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:700,
          fontSize:12, color: isMNM ? "var(--qn-red)" : "var(--qn-txt)",
          flex:1, lineHeight:1.3 }}>{s(item.diagnosis)}</span>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          fontWeight:700, color:pc.color, background:pc.bg,
          border:`1px solid ${pc.bd}`, borderRadius:4,
          padding:"1px 6px", letterSpacing:.6, flexShrink:0 }}>{pc.label}</span>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
          color:"var(--qn-txt4)" }}>{expanded ? "▲" : "▼"}</span>
      </div>
      {expanded && (
        <div style={{ padding:"0 10px 9px", borderTop:"1px solid rgba(42,79,122,.2)" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:8 }}>
            <div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
                color:"var(--qn-teal)", letterSpacing:1, textTransform:"uppercase", marginBottom:4 }}>Supporting</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                color:"var(--qn-txt2)", lineHeight:1.5 }}>{s(item.supporting_evidence) || "—"}</div>
            </div>
            <div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
                color:"var(--qn-txt4)", letterSpacing:1, textTransform:"uppercase", marginBottom:4 }}>Against</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                color:"var(--qn-txt4)", lineHeight:1.5 }}>{s(item.against) || "—"}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function DifferentialCard({ differential }) {
  const [expandedIdx, setExpandedIdx] = useState(null);
  const mustNotMiss = (differential || []).filter(d => d.must_not_miss);

  if (differential?.length && typeof differential[0] === "string") {
    return (
      <div className="qn-card">
        <SectionLabel>Differential</SectionLabel>
        {differential.map((d, i) => (
          <div key={i} style={{ display:"flex", gap:6, alignItems:"flex-start", marginBottom:3 }}>
            <span style={{ color:"var(--qn-txt4)", fontFamily:"'JetBrains Mono',monospace",
              fontSize:9, marginTop:2, flexShrink:0 }}>{i + 1}.</span>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
              color:"var(--qn-txt2)" }}>{s(d)}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="qn-card">
      <div style={{ display:"flex", alignItems:"center", marginBottom:8 }}>
        <SectionLabel style={{ marginBottom:0, flex:1 }}>Differential Diagnosis</SectionLabel>
        {mustNotMiss.length > 0 && (
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:"var(--qn-red)", letterSpacing:.4 }}>
            {mustNotMiss.length} must-not-miss
          </span>
        )}
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
        {(differential || []).map((item, i) => (
          <DDxItem key={i} item={item} idx={i}
            expanded={expandedIdx === i}
            onToggle={() => setExpandedIdx(expandedIdx === i ? null : i)} />
        ))}
      </div>
    </div>
  );
}

export function QuickDDxCard({ items, onDismiss, onRerun, busy }) {
  const [expandedIdx, setExpandedIdx] = useState(null);
  const mustNotMiss = (items || []).filter(d => d.must_not_miss);

  return (
    <div className="qn-fade" style={{ marginTop:8, padding:"12px 14px", borderRadius:12,
      background:"rgba(155,109,255,.06)", border:"1px solid rgba(155,109,255,.3)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
          fontWeight:700, color:"var(--qn-purple)", letterSpacing:1.2,
          textTransform:"uppercase", flex:1 }}>Quick DDx</span>
        {mustNotMiss.length > 0 && (
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:"var(--qn-red)", background:"rgba(255,68,68,.1)",
            border:"1px solid rgba(255,68,68,.3)", borderRadius:4,
            padding:"1px 7px", letterSpacing:.4 }}>
            ⚠ {mustNotMiss.length} must-not-miss
          </span>
        )}
        <button onClick={onRerun} disabled={busy}
          style={{ padding:"2px 8px", borderRadius:5, cursor:"pointer",
            fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            border:"1px solid rgba(155,109,255,.3)", background:"transparent",
            color:"var(--qn-txt4)" }}>↺</button>
        <button onClick={onDismiss}
          style={{ background:"transparent", border:"none", cursor:"pointer",
            color:"var(--qn-txt4)", fontSize:12, padding:"0 2px" }}>✕</button>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
        {(items || []).map((item, i) => (
          <DDxItem key={i} item={item} idx={i}
            expanded={expandedIdx === i}
            onToggle={() => setExpandedIdx(expandedIdx === i ? null : i)} />
        ))}
      </div>
    </div>
  );
}

function MDMNarrativeCard({ narrative, copiedMDM, setCopiedMDM, onEdit }) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(narrative);
  const [saved,   setSaved]   = useState(false);

  useEffect(() => {
    const handler = () => setEditing(true);
    window.addEventListener("qn-edit-narrative", handler);
    return () => window.removeEventListener("qn-edit-narrative", handler);
  }, []);

  useEffect(() => {
    if (narrative !== draft && !editing) setDraft(narrative);
  }, [narrative]);

  const handleSave = () => {
    if (onEdit) onEdit(draft);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const copy = () => {
    navigator.clipboard.writeText(draft || narrative).then(() => {
      setCopiedMDM(true);
      setTimeout(() => setCopiedMDM(false), 2000);
    });
  };

  return (
    <div className="qn-card" style={{ marginBottom:10 }}>
      <div style={{ display:"flex", alignItems:"center", marginBottom:6 }}>
        <SectionLabel color="var(--qn-teal)" style={{ marginBottom:0, flex:1 }}>MDM Narrative — Chart-Ready</SectionLabel>
        <div style={{ display:"flex", gap:5 }}>
          {!editing ? (
            <>
              <button onClick={copy}
                style={{ padding:"2px 10px", borderRadius:6, cursor:"pointer",
                  fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
                  border:`1px solid ${copiedMDM ? "rgba(61,255,160,.5)" : "rgba(0,229,192,.35)"}`,
                  background:copiedMDM ? "rgba(61,255,160,.1)" : "rgba(0,229,192,.07)",
                  color:copiedMDM ? "var(--qn-green)" : "var(--qn-teal)",
                  letterSpacing:.5, textTransform:"uppercase" }}>
                {copiedMDM ? "✓ Copied" : "Copy"}
              </button>
              <button onClick={() => { setDraft(narrative); setEditing(true); }}
                style={{ padding:"2px 8px", borderRadius:6, cursor:"pointer",
                  fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                  border:"1px solid rgba(0,229,192,.3)",
                  background:"rgba(0,229,192,.06)", color:"var(--qn-teal)" }}>
                ✎ Edit {saved && <span style={{ color:"var(--qn-green)", marginLeft:4 }}>✓</span>}
              </button>
            </>
          ) : (
            <>
              <button onClick={handleSave}
                style={{ padding:"2px 10px", borderRadius:6, cursor:"pointer",
                  fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
                  border:"1px solid rgba(61,255,160,.5)",
                  background:"rgba(61,255,160,.12)", color:"var(--qn-green)" }}>
                ✓ Save
              </button>
              <button onClick={() => { setDraft(narrative); setEditing(false); }}
                style={{ padding:"2px 8px", borderRadius:6, cursor:"pointer",
                  fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                  border:"1px solid rgba(42,79,122,.4)",
                  background:"transparent", color:"var(--qn-txt4)" }}>
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
      {editing ? (
        <textarea value={draft} onChange={e => setDraft(e.target.value)}
          rows={5} autoFocus
          style={{ background:"rgba(14,37,68,.75)", border:"1px solid rgba(0,229,192,.4)",
            borderRadius:8, padding:"10px 12px", color:"var(--qn-txt)",
            fontFamily:"'DM Sans',sans-serif", fontSize:12, lineHeight:1.75,
            outline:"none", width:"100%", boxSizing:"border-box", resize:"vertical" }} />
      ) : (
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
          color:"var(--qn-txt2)", lineHeight:1.75, whiteSpace:"pre-wrap" }}>
          {s(narrative)}
        </div>
      )}
    </div>
  );
}

export function MDMResult({ result, copiedMDM, setCopiedMDM, onNarrativeEdit }) {
  const [auditOpen, setAuditOpen] = useState(false);
  if (!result) return null;
  const lc = mdmLevelColor(result.mdm_level);

  return (
    <div className="qn-fade">
      {/* Level badge */}
      <div style={{ marginBottom:12, padding:"11px 14px", borderRadius:10,
        background:`${lc}10`, border:`2px solid ${lc}44` }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700,
              color:lc, letterSpacing:1.5, textTransform:"uppercase", marginBottom:2 }}>MDM Complexity</div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
              fontSize:20, color:lc, letterSpacing:-.3 }}>{s(result.mdm_level) || "—"}</div>
          </div>
          <div style={{ width:1, height:36, background:`${lc}30`, flexShrink:0 }} />
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
              color:"var(--qn-txt4)", letterSpacing:1, marginBottom:3 }}>PROBLEM · DATA · RISK</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
              color:"var(--qn-txt2)", lineHeight:1.5 }}>
              {[result.problem_complexity, result.data_complexity, result.risk_tier]
                .filter(Boolean).join("  ·  ")}
            </div>
          </div>
          <button onClick={() => setAuditOpen(o => !o)}
            style={{ padding:"3px 10px", borderRadius:6, cursor:"pointer",
              fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
              border:`1px solid ${lc}44`, background:`${lc}0c`,
              color:lc, letterSpacing:.5, textTransform:"uppercase", flexShrink:0 }}>
            {auditOpen ? "Hide Why ▲" : "Why? ▼"}
          </button>
        </div>
        {auditOpen && (
          <div style={{ marginTop:10, paddingTop:10, borderTop:`1px solid ${lc}25` }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:lc, letterSpacing:1.2, textTransform:"uppercase", marginBottom:8 }}>
              AMA/CMS 2023 E&M — Complexity Reasoning
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
              {[
                { label:"Problem", value:result.problem_complexity, borderColor:"rgba(155,109,255,.3)", bgColor:"rgba(155,109,255,.06)" },
                { label:"Data",    value:result.data_complexity,    borderColor:"rgba(59,158,255,.3)",  bgColor:"rgba(59,158,255,.06)"  },
                { label:"Risk",    value:result.risk_tier,          borderColor:`${lc}33`,              bgColor:`${lc}06`               },
              ].map(({ label, value, borderColor, bgColor }) => (
                <div key={label} style={{ padding:"8px 10px", borderRadius:8,
                  background:bgColor, border:`1px solid ${borderColor}` }}>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                    fontWeight:700, letterSpacing:1, textTransform:"uppercase",
                    color:"var(--qn-txt4)", marginBottom:4 }}>{label}</div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                    fontWeight:600, color:"var(--qn-txt)", lineHeight:1.4 }}>
                    {s(value) || "—"}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop:7, fontFamily:"'JetBrains Mono',monospace", fontSize:7,
              color:"rgba(107,158,200,.4)", letterSpacing:.5 }}>
              ACEP GUIDANCE: MDM level determined by HIGHEST column — not an average · AMA/CMS 2023 E&M Guidelines
            </div>
          </div>
        )}
      </div>

      {/* Working Dx + Differential */}
      {(result.working_diagnosis || result.differential?.length > 0) && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
          {result.working_diagnosis && (
            <div className="qn-card">
              <SectionLabel>Working Diagnosis</SectionLabel>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600,
                fontSize:13, color:"var(--qn-txt)", lineHeight:1.45 }}>
                {s(result.working_diagnosis)}
              </div>
            </div>
          )}
          {result.differential?.length > 0 && (
            <DifferentialCard differential={result.differential} />
          )}
        </div>
      )}

      {/* Red flags */}
      {result.red_flags?.length > 0 && (
        <div style={{ padding:"9px 12px", borderRadius:9, marginBottom:10,
          background:"rgba(255,68,68,.08)", border:"1px solid rgba(255,68,68,.35)" }}>
          <SectionLabel color="var(--qn-red)">Red Flags Identified</SectionLabel>
          <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
            {result.red_flags.map((f, i) => (
              <span key={i} style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                color:"var(--qn-coral)", background:"rgba(255,68,68,.1)",
                border:"1px solid rgba(255,68,68,.28)", borderRadius:6,
                padding:"2px 9px" }}>{s(f)}</span>
            ))}
          </div>
        </div>
      )}

      {/* Critical actions */}
      {result.critical_actions?.length > 0 && (
        <div style={{ padding:"9px 12px", borderRadius:9, marginBottom:10,
          background:"rgba(0,229,192,.06)", border:"1px solid rgba(0,229,192,.28)" }}>
          <SectionLabel color="var(--qn-teal)">Critical Actions</SectionLabel>
          {result.critical_actions.map((a, i) => (
            <div key={i} style={{ display:"flex", gap:7, alignItems:"flex-start", marginBottom:4 }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                color:"var(--qn-teal)", flexShrink:0, minWidth:16 }}>{i + 1}.</span>
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                color:"var(--qn-txt2)", lineHeight:1.5 }}>{s(a)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Treatment recommendations */}
      {result.treatment_recommendations?.length > 0 && (
        <div style={{ padding:"10px 12px", borderRadius:9, marginBottom:10,
          background:"rgba(8,22,40,.7)", border:"1px solid rgba(42,79,122,.45)" }}>
          <SectionLabel color="var(--qn-teal)">Treatment Recommendations</SectionLabel>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {result.treatment_recommendations.map((t, i) => {
              const evColor =
                t.evidence_level === "Class I"   ? "var(--qn-green)"  :
                t.evidence_level === "Class IIa" ? "var(--qn-teal)"   :
                t.evidence_level === "Class IIb" ? "var(--qn-gold)"   :
                t.evidence_level === "Class III" ? "var(--qn-coral)"  :
                                                   "var(--qn-blue)";
              return (
                <div key={i} style={{ padding:"8px 10px", borderRadius:8,
                  background:"rgba(14,37,68,.5)", border:"1px solid rgba(42,79,122,.3)" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:7, flexWrap:"wrap", marginBottom:3 }}>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                      fontWeight:700, color:evColor, borderRadius:4, padding:"1px 7px",
                      border:`1px solid ${evColor}44`, letterSpacing:.8,
                      textTransform:"uppercase", flexShrink:0 }}>
                      {s(t.evidence_level)}
                    </span>
                    <span style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:700,
                      fontSize:12, color:"var(--qn-txt)", flex:1 }}>{s(t.intervention)}</span>
                  </div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                    color:"var(--qn-txt3)", lineHeight:1.5 }}>{s(t.indication)}</div>
                  {t.guideline_ref && (
                    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                      color:"var(--qn-blue)", letterSpacing:.3 }}>{s(t.guideline_ref)}</div>
                  )}
                  {t.notes && (
                    <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
                      color:"var(--qn-gold)" }}>⚠ {s(t.notes)}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recommended actions */}
      {result.recommended_actions?.length > 0 && (
        <div style={{ padding:"9px 12px", borderRadius:9, marginBottom:10,
          background:"rgba(59,158,255,.06)", border:"1px solid rgba(59,158,255,.28)" }}>
          <SectionLabel color="var(--qn-blue)">Recommended Actions — This Visit</SectionLabel>
          {result.recommended_actions.map((a, i) => (
            <div key={i} style={{ display:"flex", gap:7, alignItems:"flex-start", marginBottom:4 }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                color:"var(--qn-blue)", flexShrink:0, minWidth:16 }}>{i + 1}.</span>
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                color:"var(--qn-txt2)", lineHeight:1.5 }}>{s(a)}</span>
            </div>
          ))}
        </div>
      )}

      {/* MDM Narrative */}
      {result.mdm_narrative && (
        <MDMNarrativeCard narrative={s(result.mdm_narrative)}
          copiedMDM={copiedMDM} setCopiedMDM={setCopiedMDM}
          onEdit={onNarrativeEdit} />
      )}

      {/* Data reviewed + Risk rationale */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
        {result.data_reviewed && (
          <div className="qn-card">
            <SectionLabel>Data Reviewed</SectionLabel>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
              color:"var(--qn-txt3)", lineHeight:1.6 }}>{s(result.data_reviewed)}</div>
          </div>
        )}
        {result.risk_rationale && (
          <div className="qn-card">
            <SectionLabel>Risk Rationale</SectionLabel>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
              color:"var(--qn-txt3)", lineHeight:1.6 }}>{s(result.risk_rationale)}</div>
          </div>
        )}
      </div>

      {result.acep_policy_ref && (
        <div style={{ padding:"7px 11px", borderRadius:8,
          background:"rgba(59,158,255,.07)", border:"1px solid rgba(59,158,255,.25)" }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
            color:"var(--qn-blue)", letterSpacing:1, textTransform:"uppercase" }}>ACEP Policy: </span>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
            color:"var(--qn-txt2)" }}>{s(result.acep_policy_ref)}</span>
        </div>
      )}
    </div>
  );
}