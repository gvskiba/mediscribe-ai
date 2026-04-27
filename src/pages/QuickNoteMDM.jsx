// QuickNoteMDM.jsx
// MDM result display — differential, audit trail, narrative editor
// Extracted from QuickNoteComponents.jsx
// Exports: DifferentialCard, QuickDDxCard, MDMResult

import { useState } from "react";

// ─── LOCAL HELPERS ───────────────────────────────────────────────────────────
const s = (v) => (typeof v === 'string' ? v : v == null ? '' : String(v));

function mdmLevelColor(level) {
  const l = (level || '').toLowerCase();
  if (l.includes('high'))            return '#ff4444';
  if (l.includes('moderate'))        return '#ff9f43';
  if (l.includes('low'))             return '#f5c842';
  if (l.includes('straightforward')) return '#3dffa0';
  return '#3b9eff';
}

function SectionLabel({ children, color, style }) {
  return (
    <div className="qn-section-lbl"
      style={{ color: color || 'var(--qn-txt4)', marginBottom:4, ...style }}>
      {children}
    </div>
  );
}

// ─── DIFFERENTIAL HELPERS ────────────────────────────────────────────────────
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
      background: isMNM ? "rgba(255,68,68,.05)" : pc.bg,
      transition:"all .15s" }}>
      {/* Row header */}
      <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px",
        cursor:"pointer" }} onClick={onToggle}>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
          color:"var(--qn-txt4)", flexShrink:0, minWidth:16 }}>{idx + 1}.</span>
        {isMNM && (
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
            fontWeight:700, color:"var(--qn-red)",
            background:"rgba(255,68,68,.15)", border:"1px solid rgba(255,68,68,.4)",
            borderRadius:3, padding:"1px 5px", letterSpacing:.6,
            flexShrink:0 }}>⚠ MUST NOT MISS</span>
        )}
        <span style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:700,
          fontSize:12, color: isMNM ? "var(--qn-red)" : "var(--qn-txt)",
          flex:1, lineHeight:1.3 }}>{s(item.diagnosis)}</span>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          fontWeight:700, color:pc.color,
          background:pc.bg, border:`1px solid ${pc.bd}`,
          borderRadius:4, padding:"1px 6px", letterSpacing:.6,
          flexShrink:0 }}>{pc.label}</span>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
          color:"var(--qn-txt4)" }}>{expanded ? "▲" : "▼"}</span>
      </div>
      {/* Expanded reasoning */}
      {expanded && (
        <div style={{ padding:"0 10px 9px", borderTop:"1px solid rgba(42,79,122,.2)" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:8 }}>
            <div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
                color:"var(--qn-teal)", letterSpacing:1, textTransform:"uppercase",
                marginBottom:4 }}>Supporting</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                color:"var(--qn-txt2)", lineHeight:1.5 }}>
                {s(item.supporting_evidence) || "—"}
              </div>
            </div>
            <div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
                color:"var(--qn-txt4)", letterSpacing:1, textTransform:"uppercase",
                marginBottom:4 }}>Against</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                color:"var(--qn-txt4)", lineHeight:1.5 }}>
                {s(item.against) || "—"}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Full differential card — used inside MDMResult
export function DifferentialCard({ differential }) {
  const [expandedIdx, setExpandedIdx] = useState(null);
  const mustNotMiss = (differential || []).filter(d => d.must_not_miss);

  // If still the old string[] format, render legacy flat list
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
      <div style={{ marginTop:6, fontFamily:"'JetBrains Mono',monospace", fontSize:7,
        color:"rgba(107,158,200,.4)", letterSpacing:.5 }}>
        Click any item to expand reasoning
      </div>
    </div>
  );
}

// Quick DDx card — used in Phase 1 before MDM runs
export function QuickDDxCard({ items, onDismiss, onRerun, busy }) {
  const [expandedIdx, setExpandedIdx] = useState(null);
  const mustNotMiss = (items || []).filter(d => d.must_not_miss);

  return (
    <div className="qn-fade" style={{ marginTop:8, padding:"12px 14px",
      borderRadius:12, background:"rgba(155,109,255,.06)",
      border:"1px solid rgba(155,109,255,.3)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
          fontWeight:700, color:"var(--qn-purple)", letterSpacing:1.2,
          textTransform:"uppercase", flex:1 }}>
          Quick DDx
        </span>
        {mustNotMiss.length > 0 && (
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:"var(--qn-red)", background:"rgba(255,68,68,.1)",
            border:"1px solid rgba(255,68,68,.3)", borderRadius:4,
            padding:"1px 7px", letterSpacing:.4 }}>
            ⚠ {mustNotMiss.length} must-not-miss
          </span>
        )}
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color:"rgba(155,109,255,.5)", letterSpacing:.3 }}>
          Superseded when MDM runs
        </span>
        <button onClick={onRerun} disabled={busy}
          style={{ padding:"2px 8px", borderRadius:5, cursor:"pointer",
            fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            border:"1px solid rgba(155,109,255,.3)",
            background:"transparent", color:"var(--qn-txt4)" }}>
          ↺
        </button>
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
      <div style={{ marginTop:7, fontFamily:"'JetBrains Mono',monospace", fontSize:7,
        color:"rgba(107,158,200,.4)", letterSpacing:.5 }}>
        Click any item to expand reasoning · Based on CC and HPI only
      </div>
    </div>
  );
}

// ─── MDM RESULT DISPLAY ───────────────────────────────────────────────────────
export function MDMResult({ result, copiedMDM, setCopiedMDM, onNarrativeEdit }) {
  if (!result) return null;
  const lc = mdmLevelColor(result.mdm_level);
  const [auditOpen, setAuditOpen] = useState(false);

  // E&M 2023 criteria explanation per field
  const PROBLEM_CRITERIA = {
    "1 self-limited or minor problem":              { level:"Straightforward", col:"Problem" },
    "1 stable chronic illness":                     { level:"Low",             col:"Problem" },
    "2+ self-limited problems":                     { level:"Low",             col:"Problem" },
    "1+ chronic illness with exacerbation":         { level:"Moderate",        col:"Problem" },
    "Undiagnosed new problem with uncertain prognosis":{ level:"Moderate",     col:"Problem" },
    "Acute illness with systemic symptoms":         { level:"Moderate",        col:"Problem" },
    "Acute or chronic illness posing threat to life or function":{ level:"High", col:"Problem" },
  };
  const DATA_CRITERIA = {
    "Minimal or none":                              { level:"Straightforward", col:"Data" },
    "Limited — ordering or reviewing tests":        { level:"Low",             col:"Data" },
    "Moderate — independent interpretation of results":{ level:"Moderate",    col:"Data" },
    "Moderate — discussion with treating provider": { level:"Moderate",        col:"Data" },
    "Extensive — independent interpretation and provider discussion":{ level:"High", col:"Data" },
  };
  const RISK_CRITERIA = {
    "Minimal":{ level:"Straightforward", col:"Risk",
      note:"Self-limited, OTC meds, no prescribed Rx" },
    "Low":    { level:"Low",             col:"Risk",
      note:"Prescription drug management, minor surgery" },
    "Moderate":{ level:"Moderate",       col:"Risk",
      note:"New Rx, minor procedure, observation" },
    "High":   { level:"High",            col:"Risk",
      note:"Intensive Rx monitoring, hospitalization, or major surgery" },
  };
  const probInfo = Object.entries(PROBLEM_CRITERIA).find(([k]) =>
    (result.problem_complexity||"").toLowerCase().includes(k.toLowerCase().slice(0,20)))?.[1];
  const dataInfo = Object.entries(DATA_CRITERIA).find(([k]) =>
    (result.data_complexity||"").toLowerCase().includes(k.toLowerCase().slice(0,20)))?.[1];
  const riskKey  = Object.keys(RISK_CRITERIA).find(k =>
    (result.risk_tier||"").toLowerCase().includes(k.toLowerCase()));
  const riskInfo = riskKey ? RISK_CRITERIA[riskKey] : null;

  return (
    <div className="qn-fade">

      {/* Level badge */}
      <div style={{ marginBottom:12, padding:"11px 14px", borderRadius:10,
        background:`${lc}10`, border:`2px solid ${lc}44` }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div>
            <div className="qn-section-lbl" style={{ color:lc, marginBottom:2 }}>MDM Complexity</div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
              fontSize:20, color:lc, letterSpacing:-.3 }}>
              {s(result.mdm_level) || "—"}
            </div>
          </div>
          <div style={{ width:1, height:36, background:`${lc}30`, flexShrink:0 }} />
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
              color:"var(--qn-txt4)", letterSpacing:1, marginBottom:3 }}>
              PROBLEM · DATA · RISK
            </div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
              color:"var(--qn-txt2)", lineHeight:1.5 }}>
              {[result.problem_complexity, result.data_complexity, result.risk_tier]
                .filter(Boolean).join("  ·  ")}
            </div>
          </div>
          {/* Audit trail toggle */}
          <button onClick={() => setAuditOpen(o => !o)}
            style={{ padding:"3px 10px", borderRadius:6, cursor:"pointer",
              fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
              border:`1px solid ${lc}44`, background:`${lc}0c`,
              color:lc, letterSpacing:.5, textTransform:"uppercase",
              transition:"all .15s", flexShrink:0 }}>
            {auditOpen ? "Hide Why ▲" : "Why? ▼"}
          </button>
        </div>

        {/* Audit trail — collapsible */}
        {auditOpen && (
          <div style={{ marginTop:10, paddingTop:10,
            borderTop:`1px solid ${lc}25` }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:lc, letterSpacing:1.2, textTransform:"uppercase",
              marginBottom:8 }}>AMA/CMS 2023 E&M — Complexity Reasoning</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
              {[
                { label:"Problem", value:result.problem_complexity, info:probInfo,
                  borderColor:"rgba(155,109,255,.3)", bgColor:"rgba(155,109,255,.06)" },
                { label:"Data",    value:result.data_complexity,    info:dataInfo,
                  borderColor:"rgba(59,158,255,.3)",  bgColor:"rgba(59,158,255,.06)" },
                { label:"Risk",    value:result.risk_tier,          info:riskInfo,
                  borderColor:`${lc}33`,              bgColor:`${lc}06` },
              ].map(({ label, value, info, borderColor, bgColor }) => (
                <div key={label} style={{ padding:"8px 10px", borderRadius:8,
                  background:bgColor, border:`1px solid ${borderColor}` }}>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                    fontWeight:700, letterSpacing:1, textTransform:"uppercase",
                    color:"var(--qn-txt4)", marginBottom:4 }}>{label}</div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                    fontWeight:600, color:"var(--qn-txt)", lineHeight:1.4,
                    marginBottom:4 }}>
                    {s(value) || "—"}
                  </div>
                  {info && (
                    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                      color:lc, letterSpacing:.3 }}>
                      → Drives {info.level} level
                      {info.note && (
                        <div style={{ color:"var(--qn-txt4)", marginTop:2 }}>{info.note}</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div style={{ marginTop:7, fontFamily:"'JetBrains Mono',monospace", fontSize:7,
              color:"rgba(107,158,200,.4)", letterSpacing:.5 }}>
              ACEP GUIDANCE: MDM level determined by HIGHEST column — not an average ·
              AMA/CMS 2023 E&M Guidelines
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
                padding:"2px 9px" }}>{f}</span>
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

      {/* Treatment Recommendations — evidence-based in-ED treatments */}
      {result.treatment_recommendations?.length > 0 && (
        <div style={{ padding:"10px 12px", borderRadius:9, marginBottom:10,
          background:"rgba(8,22,40,.7)", border:"1px solid rgba(42,79,122,.45)" }}>
          <SectionLabel color="var(--qn-teal)">Treatment Recommendations</SectionLabel>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {result.treatment_recommendations.map((t, i) => {
              const evColor =
                t.evidence_level === "Class I"         ? "var(--qn-green)"  :
                t.evidence_level === "Class IIa"       ? "var(--qn-teal)"   :
                t.evidence_level === "Class IIb"       ? "var(--qn-gold)"   :
                t.evidence_level === "Class III"       ? "var(--qn-coral)"  :
                                                         "var(--qn-blue)";
              const evBg =
                t.evidence_level === "Class I"         ? "rgba(61,255,160,.08)"   :
                t.evidence_level === "Class IIa"       ? "rgba(0,229,192,.06)"    :
                t.evidence_level === "Class IIb"       ? "rgba(245,200,66,.07)"   :
                t.evidence_level === "Class III"       ? "rgba(255,107,107,.07)"  :
                                                         "rgba(59,158,255,.06)";
              const evBd =
                t.evidence_level === "Class I"         ? "rgba(61,255,160,.3)"    :
                t.evidence_level === "Class IIa"       ? "rgba(0,229,192,.28)"    :
                t.evidence_level === "Class IIb"       ? "rgba(245,200,66,.3)"    :
                t.evidence_level === "Class III"       ? "rgba(255,107,107,.3)"   :
                                                         "rgba(59,158,255,.28)";
              return (
                <div key={i} style={{ padding:"8px 10px", borderRadius:8,
                  background:evBg, border:`1px solid ${evBd}` }}>
                  <div style={{ display:"flex", alignItems:"center", gap:7,
                    flexWrap:"wrap", marginBottom:3 }}>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                      fontWeight:700, color:evColor,
                      background:`${evColor}18`, border:`1px solid ${evBd}`,
                      borderRadius:4, padding:"1px 7px", letterSpacing:.8,
                      textTransform:"uppercase", flexShrink:0 }}>
                      {s(t.evidence_level)}
                    </span>
                    <span style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:700,
                      fontSize:12, color:"var(--qn-txt)", flex:1 }}>
                      {s(t.intervention)}
                    </span>
                  </div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                    color:"var(--qn-txt3)", lineHeight:1.5, marginBottom:t.guideline_ref || t.notes ? 4 : 0 }}>
                    {s(t.indication)}
                  </div>
                  {t.guideline_ref && (
                    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                      color:"var(--qn-blue)", letterSpacing:.3, marginBottom:t.notes ? 2 : 0 }}>
                      {s(t.guideline_ref)}
                    </div>
                  )}
                  {t.notes && (
                    <div style={{ display:"flex", gap:5, alignItems:"flex-start" }}>
                      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                        color:"var(--qn-gold)", flexShrink:0 }}>⚠</span>
                      <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
                        color:"var(--qn-gold)", lineHeight:1.5 }}>{s(t.notes)}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recommended Actions — this-visit tier */}
      {result.recommended_actions?.length > 0 && (
        <div style={{ padding:"9px 12px", borderRadius:9, marginBottom:10,
          background:"rgba(59,158,255,.06)", border:"1px solid rgba(59,158,255,.28)" }}>
          <SectionLabel color="var(--qn-blue)">Recommended Actions — This Visit</SectionLabel>
          {result.recommended_actions.map((a, i) => {
            // Defensive: if AI returns an object instead of a string, format it gracefully
            let text;
            if (typeof a === "string") {
              text = a;
            } else if (a && typeof a === "object") {
              // Extract meaningful fields in priority order
              const parts = [];
              const f = a;
              if (f.test_name || f.name)   parts.push(f.test_name || f.name);
              if (f.timing)                 parts.push("in " + f.timing);
              if (f.indication)             parts.push(f.indication);
              if (f.decision_threshold || f.threshold)
                parts.push("→ " + (f.decision_threshold || f.threshold));
              if (f.action)                 parts.push(f.action);
              if (f.recommendation)         parts.push(f.recommendation);
              text = parts.length ? parts.join(" — ") : JSON.stringify(a);
            } else {
              text = String(a);
            }
            return (
              <div key={i} style={{ display:"flex", gap:7, alignItems:"flex-start", marginBottom:4 }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                  color:"var(--qn-blue)", flexShrink:0, minWidth:16 }}>{i + 1}.</span>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                  color:"var(--qn-txt2)", lineHeight:1.5 }}>{text}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* MDM Narrative */}
      {result.mdm_narrative && (
        <MDMNarrativeCard
          narrative={s(result.mdm_narrative)}
          copiedMDM={copiedMDM}
          setCopiedMDM={setCopiedMDM}
          onEdit={onNarrativeEdit}
        />
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
            color:"var(--qn-blue)", letterSpacing:1, textTransform:"uppercase" }}>
            ACEP Policy:{" "}
          </span>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
            color:"var(--qn-txt2)" }}>{s(result.acep_policy_ref)}</span>
        </div>
      )}

      {/* Related Hubs — derived from working diagnosis */}
      {(() => {
        const dx = (result.working_diagnosis || "").toLowerCase();
        const catId =
          /chest|cardiac|acs|mi|stemi|nstemi|angina|pe|embol|syncope|palpit|dvt|hemoptysis/.test(dx) ? "cardiac" :
          /abdom|appy|pancreat|bowel|obstruct|gall|biliary|bleed|gi|hepat|jaundice|diarrhea/.test(dx) ? "abdominal" :
          /stroke|tia|seizure|headache|ams|dement|psych|enceph|altered|vertigo|vision/.test(dx) ? "neuro" :
          /fracture|disloc|sprain|msk|ortho|back|spine|fall|trauma|wound|laceration/.test(dx) ? "msk" :
          /eye|ocular|ear|otitis|pharyngit|tonsil|epistaxis|dental|peritonsillar|facial/.test(dx) ? "ent" :
          /pregnan|ectopic|pelvic|ovarian|uterine|vaginal|cervical|scrotal|torsion|uti|renal/.test(dx) ? "obgyn" :
          /overdose|ingestion|toxic|poison|withdrawal|anaphylaxis|allergic|envenomation/.test(dx) ? "tox" :
          /cellulitis|abscess|rash|derm|hypoglyc|diabetic|dka|hyperglycemia|sepsis|fever|infect|pneumonia/.test(dx) ? "derm" : null;
        if (!catId) return null;
        return <HubStrip catId={catId} label="Related Hubs" />;
      })()}
    </div>
  );
}