import { useState, useEffect, useCallback, useMemo } from "react";
import { base44 } from "@/api/base44Client";
const Patient = base44.entities.Patient;
const ClinicalResult = base44.entities.ClinicalResult;
const Order = base44.entities.Order;
const ClinicalNote = base44.entities.ClinicalNote;
const DispositionRecord = base44.entities.DispositionRecord;
const InvokeLLM = (params) => base44.integrations.Core.InvokeLLM(params);

const PREFIX = "cne";

(() => {
  const fontId = `${PREFIX}-fonts`;
  if (document.getElementById(fontId)) return;
  const l = document.createElement("link");
  l.id = fontId; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = `${PREFIX}-css`;
  s.textContent = `
    * { box-sizing:border-box; margin:0; padding:0; }
    ::-webkit-scrollbar { width:3px; height:3px; }
    ::-webkit-scrollbar-track { background:transparent; }
    ::-webkit-scrollbar-thumb { background:rgba(42,79,122,.5); border-radius:2px; }
    @keyframes ${PREFIX}fade  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
    @keyframes ${PREFIX}shim  { 0%,100%{background-position:-200% center} 50%{background-position:200% center} }
    @keyframes ${PREFIX}orb0  { 0%,100%{transform:translate(-50%,-50%) scale(1)}    50%{transform:translate(-50%,-50%) scale(1.1)} }
    @keyframes ${PREFIX}orb1  { 0%,100%{transform:translate(-50%,-50%) scale(1.07)} 50%{transform:translate(-50%,-50%) scale(.92)} }
    @keyframes ${PREFIX}orb2  { 0%,100%{transform:translate(-50%,-50%) scale(.95)}  50%{transform:translate(-50%,-50%) scale(1.09)} }
    @keyframes ${PREFIX}pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
    @keyframes ${PREFIX}think { 0%{opacity:.3;transform:scale(.9)} 50%{opacity:1;transform:scale(1)} 100%{opacity:.3;transform:scale(.9)} }
    .${PREFIX}-fade  { animation:${PREFIX}fade  .22s ease both; }
    .${PREFIX}-pulse { animation:${PREFIX}pulse 1.8s ease-in-out infinite; }
    .${PREFIX}-think { animation:${PREFIX}think 1.2s ease-in-out infinite; }
    .${PREFIX}-shim  {
      background:linear-gradient(90deg,#f2f7ff 0%,#9b6dff 25%,#00e5c0 55%,#3b9eff 80%,#f2f7ff 100%);
      background-size:250% auto; -webkit-background-clip:text;
      -webkit-text-fill-color:transparent; background-clip:text;
      animation:${PREFIX}shim 5s linear infinite;
    }
  `;
  document.head.appendChild(s);
})();

const T = {
  bg:"#050f1e", txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", red:"#ff4444", green:"#3dffa0",
  blue:"#3b9eff", purple:"#9b6dff", orange:"#ff9f43", coral:"#ff6b6b",
};

const glass = {
  backdropFilter:"blur(20px) saturate(180%)", WebkitBackdropFilter:"blur(20px) saturate(180%)",
  background:"rgba(8,22,40,0.78)", border:"1px solid rgba(42,79,122,0.35)", borderRadius:14,
};

// ── CONVERGENCE CONFIG ────────────────────────────────────────────────
const CONV = {
  complete:    { label:"Complete",   color:T.teal,   icon:"✓", desc:"Workup done, dispo set"         },
  converging:  { label:"Converging", color:T.green,  icon:"→", desc:"Story coherent, trajectory clear"},
  developing:  { label:"Developing", color:T.gold,   icon:"◎", desc:"Workup in progress"              },
  fragmented:  { label:"Fragmented", color:T.red,    icon:"⚡", desc:"Data inconsistent or unclear"    },
};

// ── HELPERS ───────────────────────────────────────────────────────────
function fmtMins(mins) {
  if (!mins) return "—";
  return mins < 60 ? `${mins}m` : `${Math.floor(mins/60)}h${mins%60>0?` ${mins%60}m`:""}`;
}

function minsAgo(iso) {
  if (!iso) return null;
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
}

function computeConvergence(patient, orders, results, notes, dispos) {
  const note   = notes.find(n => n.patient === patient.id);
  const dispo  = dispos.find(d => d.patient === patient.id);
  const ptOrds = orders.filter(o => o.patient === patient.id);
  const ptRes  = results.filter(r => r.patient === patient.id);
  const mins   = minsAgo(patient.arrived_at);

  if (dispo?.dispo_status === "complete" || dispo?.dispo_status === "ready") return "complete";

  const unackedCrit = ptRes.some(r => r.flag === "critical" && !r.acknowledged);
  if (unackedCrit) return "fragmented";

  const hasAssessment = note?.assessment && note.assessment.trim().length > 10;
  if (!hasAssessment && mins > 120) return "fragmented";

  const statPending = ptOrds.some(o => o.status === "pending" && o.urgency === "stat");
  if (!hasAssessment) return "developing";
  if (statPending) return "developing";
  if (hasAssessment && note?.signed) return "converging";
  return "developing";
}

function buildPatientContext(patient, orders, results, notes, dispos) {
  const note   = notes.find(n => n.patient === patient.id);
  const dispo  = dispos.find(d => d.patient === patient.id);
  const ptOrds = orders.filter(o => o.patient === patient.id);
  const ptRes  = results.filter(r => r.patient === patient.id);
  const mins   = minsAgo(patient.arrived_at);

  const parts = [
    `PATIENT: ${patient.age}${patient.sex}, Room ${patient.room}, ${fmtMins(mins)} in ED`,
    `CC: ${patient.cc} | Status: ${(patient.status||"").toUpperCase()}`,
    `PROVIDER: ${patient.provider || "Unassigned"} | NURSE: ${patient.nurse || "Unassigned"}`,
  ];

  if (ptRes.length) {
    parts.push(`\nRESULTS (${ptRes.length}):`);
    ptRes.forEach(r => {
      const ack = r.flag === "critical" && !r.acknowledged ? " ⚠️ UNACKNOWLEDGED CRITICAL" : "";
      parts.push(`  ${r.name}: ${r.value}${r.unit ? " "+r.unit : ""} [${(r.flag||"normal").toUpperCase()}]${ack}`);
    });
  } else parts.push("\nRESULTS: None yet");

  if (ptOrds.length) {
    parts.push(`\nORDERS:`);
    ptOrds.forEach(o => parts.push(`  ${o.name}: ${(o.status||"").toUpperCase()} (${o.urgency||""})`));
  }

  if (note) {
    parts.push(`\nNOTE (${note.signed ? "SIGNED" : "DRAFT"}):`);
    if (note.hpi)        parts.push(`  HPI: ${note.hpi}`);
    if (note.assessment) parts.push(`  ASSESSMENT: ${note.assessment}`);
    if (note.plan)       parts.push(`  PLAN: ${note.plan}`);
  } else parts.push("\nNOTE: Not yet documented");

  if (dispo) {
    parts.push(`\nDISPOSITION: ${(dispo.dispo_type||"undecided").toUpperCase()} — ${(dispo.dispo_status||"pending").toUpperCase()}`);
    if (dispo.accepting_service) parts.push(`  Service: ${dispo.accepting_service}`);
    if (dispo.destination)       parts.push(`  Destination: ${dispo.destination}`);
    if (dispo.est_dispo_time)    parts.push(`  Est. time: ${dispo.est_dispo_time}`);
  } else parts.push("\nDISPOSITION: Not yet decided");

  return parts.join("\n");
}

// ══════════════════════════════════════════════════════════════════════
//  MODULE-SCOPE PRIMITIVES
// ══════════════════════════════════════════════════════════════════════

function AmbientBg() {
  return (
    <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0 }}>
      {[
        { l:"8%",  t:"18%", r:340, c:"rgba(155,109,255,0.055)" },
        { l:"88%", t:"12%", r:280, c:"rgba(0,229,192,0.045)"   },
        { l:"72%", t:"76%", r:320, c:"rgba(59,158,255,0.040)"  },
        { l:"22%", t:"80%", r:250, c:"rgba(245,200,66,0.035)"  },
      ].map((o,i) => (
        <div key={i} style={{
          position:"absolute", left:o.l, top:o.t,
          width:o.r*2, height:o.r*2, borderRadius:"50%",
          background:`radial-gradient(circle,${o.c} 0%,transparent 68%)`,
          transform:"translate(-50%,-50%)",
          animation:`${PREFIX}orb${i%3} ${8+i*1.3}s ease-in-out infinite`,
        }}/>
      ))}
    </div>
  );
}

function HubBadge({ onBack }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:9 }}>
      <div style={{
        backdropFilter:"blur(40px)", WebkitBackdropFilter:"blur(40px)",
        background:"rgba(5,15,30,0.9)", border:"1px solid rgba(42,79,122,0.6)",
        borderRadius:10, padding:"5px 12px", display:"flex", alignItems:"center", gap:8,
      }}>
        <span style={{ fontFamily:"JetBrains Mono", fontSize:10, color:T.gold, letterSpacing:3 }}>NOTRYA</span>
        <span style={{ color:T.txt4, fontFamily:"JetBrains Mono", fontSize:10 }}>/</span>
        <span style={{ fontFamily:"JetBrains Mono", fontSize:10, color:T.purple, letterSpacing:2 }}>NARRATIVE ENGINE</span>
      </div>
      <div style={{ height:1, flex:1, background:"linear-gradient(90deg,rgba(155,109,255,0.5),transparent)" }}/>
      {onBack && (
        <button onClick={onBack} style={{
          fontFamily:"DM Sans", fontSize:11, fontWeight:600, padding:"5px 14px",
          borderRadius:8, cursor:"pointer", border:"1px solid rgba(42,79,122,0.5)",
          background:"rgba(14,37,68,0.6)", color:T.txt3,
        }}>← Hub</button>
      )}
    </div>
  );
}

function Toast({ msg, err }) {
  return (
    <div style={{
      position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)",
      background:"rgba(8,22,40,0.96)", borderRadius:10, padding:"10px 20px",
      border:`1px solid ${err ? T.red+"55" : T.purple+"55"}`,
      fontFamily:"DM Sans", fontWeight:600, fontSize:13,
      color:err ? T.coral : T.purple, zIndex:99999, pointerEvents:"none",
      animation:`${PREFIX}fade .2s ease both`,
    }}>{msg}</div>
  );
}

function ThinkingDots() {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:5 }}>
      {[0,1,2].map(i => (
        <div key={i} className={`${PREFIX}-think`} style={{
          width:6, height:6, borderRadius:"50%", background:T.purple,
          animationDelay:`${i*0.2}s`,
        }}/>
      ))}
    </div>
  );
}

// ── Convergence Badge ─────────────────────────────────────────────────
function ConvBadge({ state, compact }) {
  const c = CONV[state] || CONV.developing;
  return (
    <span style={{
      fontFamily:"JetBrains Mono", fontSize: compact ? 7 : 8, fontWeight:700,
      padding: compact ? "2px 6px" : "2px 8px", borderRadius:20,
      background:`${c.color}18`, border:`1px solid ${c.color}40`,
      color:c.color, letterSpacing:.5, flexShrink:0,
      display:"inline-flex", alignItems:"center", gap:3,
    }}>
      {c.icon} {compact ? state.toUpperCase() : c.label.toUpperCase()}
    </span>
  );
}

// ── Shift Commander Card ──────────────────────────────────────────────
function CommanderCard({ patient, convState, narrative, onClick, isSelected }) {
  const c    = CONV[convState] || CONV.developing;
  const mins = minsAgo(patient.arrived_at);
  const hasNarrative = narrative?.status === "done" && narrative?.oneliner;

  return (
    <div
      onClick={onClick}
      style={{
        ...glass, padding:"10px 12px", cursor:"pointer",
        border:`1px solid ${isSelected ? T.purple+"55" : `rgba(42,79,122,0.3)`}`,
        borderLeft:`3px solid ${c.color}`,
        background: isSelected
          ? `linear-gradient(135deg,${T.purple}0e,rgba(8,22,40,0.82))`
          : convState === "fragmented"
          ? `linear-gradient(135deg,${T.red}09,rgba(8,22,40,0.78))`
          : "rgba(8,22,40,0.78)",
        transition:"all .15s",
      }}
    >
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:8, marginBottom:5 }}>
        <div style={{ display:"flex", alignItems:"baseline", gap:7 }}>
          <span style={{
            fontFamily:"JetBrains Mono", fontWeight:700, fontSize:20,
            color:c.color, lineHeight:1, flexShrink:0,
          }}>{patient.room}</span>
          <div>
            <div style={{ fontFamily:"DM Sans", fontWeight:700, fontSize:12, color:T.txt, lineHeight:1.2 }}>
              {patient.cc}
            </div>
            <div style={{ fontFamily:"DM Sans", fontSize:9, color:T.txt4 }}>
              {patient.age}{patient.sex} · {fmtMins(mins)} ago
            </div>
          </div>
        </div>
        <ConvBadge state={convState} compact/>
      </div>

      {/* One-liner or status */}
      <div style={{ minHeight:28 }}>
        {narrative?.status === "loading" ? (
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <ThinkingDots/>
            <span style={{ fontFamily:"DM Sans", fontSize:10, color:T.txt4 }}>Thinking...</span>
          </div>
        ) : hasNarrative ? (
          <div style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt3, lineHeight:1.45 }}>
            {narrative.oneliner}
          </div>
        ) : (
          <div style={{ fontFamily:"DM Sans", fontSize:10, color:T.txt4, fontStyle:"italic" }}>
            {patient.provider || "No provider assigned"}
          </div>
        )}
      </div>

      {/* Narrative breaks chips */}
      {narrative?.breaks?.length > 0 && (
        <div style={{ display:"flex", gap:3, flexWrap:"wrap", marginTop:5 }}>
          {narrative.breaks.slice(0,2).map((b, i) => (
            <span key={i} style={{
              fontFamily:"JetBrains Mono", fontSize:6, fontWeight:700,
              padding:"2px 6px", borderRadius:20,
              background:`${b.severity === "critical" ? T.red : T.orange}12`,
              border:`1px solid ${b.severity === "critical" ? T.red : T.orange}30`,
              color:b.severity === "critical" ? T.coral : T.orange,
            }}>⚡ {b.finding}</span>
          ))}
          {narrative.breaks.length > 2 && (
            <span style={{ fontFamily:"JetBrains Mono", fontSize:6, color:T.txt4 }}>
              +{narrative.breaks.length - 2} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ── Narrative Panel ───────────────────────────────────────────────────
function NarrativePanel({ narrative, onGenerate, patient }) {
  if (narrative?.status === "loading") {
    return (
      <div style={{
        ...glass, padding:"28px", display:"flex",
        flexDirection:"column", alignItems:"center", gap:12,
        background:`${T.purple}08`,
      }}>
        <ThinkingDots/>
        <div style={{ fontFamily:"DM Sans", fontSize:13, color:T.purple, fontWeight:600 }}>
          Synthesizing clinical story...
        </div>
        <div style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt4, textAlign:"center" }}>
          Reviewing labs, orders, vitals, and clinical notes
        </div>
      </div>
    );
  }

  if (!narrative || narrative.status === "idle" || narrative.status === "error") {
    return (
      <div style={{ ...glass, padding:"20px", textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:10 }}>
        <span style={{ fontSize:28 }}>🧠</span>
        <div style={{ fontFamily:"DM Sans", fontSize:13, color:T.txt2, fontWeight:600 }}>No narrative generated yet</div>
        {narrative?.status === "error" && (
          <div style={{ fontFamily:"DM Sans", fontSize:11, color:T.coral }}>Generation failed — try again</div>
        )}
        <button onClick={onGenerate} style={{
          fontFamily:"DM Sans", fontWeight:700, fontSize:12,
          padding:"10px 22px", borderRadius:9, cursor:"pointer",
          border:`1px solid ${T.purple}45`, background:`${T.purple}12`, color:T.purple,
        }}>🧠 Generate Patient Story</button>
      </div>
    );
  }

  const { text, oneliner, breaks = [], watchFor, convergence } = narrative;

  return (
    <div className={`${PREFIX}-fade`} style={{ display:"flex", flexDirection:"column", gap:10 }}>
      {/* Narrative body */}
      <div style={{
        ...glass, padding:"16px",
        borderLeft:`3px solid ${T.purple}`,
        background:`${T.purple}07`,
      }}>
        <div style={{
          display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10,
        }}>
          <div style={{ fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700, color:T.purple, letterSpacing:2, textTransform:"uppercase" }}>
            Clinical Story
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <ConvBadge state={convergence || "developing"}/>
            <button onClick={onGenerate} style={{
              fontFamily:"DM Sans", fontWeight:600, fontSize:9,
              padding:"3px 8px", borderRadius:6, cursor:"pointer",
              border:"1px solid rgba(42,79,122,0.4)",
              background:"transparent", color:T.txt4,
            }}>↺ Refresh</button>
          </div>
        </div>
        <p style={{ fontFamily:"DM Sans", fontSize:13, color:T.txt, lineHeight:1.75, fontWeight:400 }}>
          {text}
        </p>
      </div>

      {/* Watch for */}
      {watchFor && (
        <div style={{
          ...glass, padding:"10px 14px",
          borderLeft:`3px solid ${T.gold}`, background:`${T.gold}08`,
          display:"flex", alignItems:"center", gap:8,
        }}>
          <span style={{ fontSize:14, flexShrink:0 }}>👁</span>
          <div>
            <div style={{ fontFamily:"JetBrains Mono", fontSize:7, fontWeight:700, color:T.gold, letterSpacing:1.5, textTransform:"uppercase", marginBottom:2 }}>Watch For</div>
            <div style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt2 }}>{watchFor}</div>
          </div>
        </div>
      )}

      {/* Narrative breaks */}
      {breaks.length > 0 && (
        <div>
          <div style={{ fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700, color:T.red, letterSpacing:2, textTransform:"uppercase", marginBottom:7 }}>
            ⚡ Narrative Breaks — Data Inconsistencies
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {breaks.map((b, i) => {
              const bc = b.severity === "critical" ? T.red : T.orange;
              return (
                <div key={i} style={{
                  ...glass, padding:"10px 13px",
                  borderLeft:`3px solid ${bc}`,
                  background:`${bc}0b`,
                }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8, marginBottom:4 }}>
                    <span style={{
                      fontFamily:"JetBrains Mono", fontSize:9, fontWeight:700, color:bc,
                    }}>{b.finding}</span>
                    <span style={{
                      fontFamily:"JetBrains Mono", fontSize:7, fontWeight:700,
                      padding:"2px 6px", borderRadius:20,
                      background:`${bc}14`, border:`1px solid ${bc}30`,
                      color:bc, flexShrink:0,
                    }}>{(b.severity||"warning").toUpperCase()}</span>
                  </div>
                  <div style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt2, lineHeight:1.55 }}>
                    {b.concern}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Pre-Discharge Safety Check Panel ─────────────────────────────────
function SafetyCheckPanel({ check, onRun, patient }) {
  if (check?.status === "loading") {
    return (
      <div style={{
        ...glass, padding:"28px", display:"flex", flexDirection:"column", alignItems:"center", gap:12,
      }}>
        <ThinkingDots/>
        <div style={{ fontFamily:"DM Sans", fontSize:13, color:T.teal, fontWeight:600 }}>
          Reviewing case for discharge safety...
        </div>
        <div style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt4, textAlign:"center" }}>
          Checking labs · medications · diagnosis · follow-up · vital trends
        </div>
      </div>
    );
  }

  if (!check || check.status === "idle" || check.status === "error") {
    return (
      <div style={{ ...glass, padding:"24px", textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
        <div style={{ fontSize:32 }}>🛡️</div>
        <div style={{ fontFamily:"DM Sans", fontSize:14, color:T.txt2, fontWeight:700 }}>Pre-Discharge Safety Check</div>
        <div style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt4, maxWidth:320, lineHeight:1.6 }}>
          AI reviews labs, medications, diagnosis, follow-up, and vital trends before this patient leaves.
        </div>
        {check?.status === "error" && (
          <div style={{ fontFamily:"DM Sans", fontSize:11, color:T.coral }}>Check failed — try again</div>
        )}
        <button onClick={onRun} style={{
          fontFamily:"DM Sans", fontWeight:800, fontSize:13,
          padding:"12px 28px", borderRadius:10, cursor:"pointer",
          border:`1px solid ${T.teal}45`, background:`${T.teal}12`, color:T.teal,
        }}>🛡️ Run Safety Check</button>
      </div>
    );
  }

  const { safeToDischarge, overallRisk, concerns = [], confirmBefore = [], dischargeReadiness, followupRequired = [] } = check;
  const riskColor = overallRisk === "high" ? T.red : overallRisk === "moderate" ? T.orange : T.green;

  return (
    <div className={`${PREFIX}-fade`} style={{ display:"flex", flexDirection:"column", gap:10 }}>
      {/* Overall verdict */}
      <div style={{
        ...glass, padding:"14px 16px",
        borderLeft:`4px solid ${safeToDischarge ? T.green : T.red}`,
        background:`${safeToDischarge ? T.green : T.red}0c`,
        display:"flex", alignItems:"center", justifyContent:"space-between", gap:12,
      }}>
        <div style={{ flex:1 }}>
          <div style={{
            fontFamily:"JetBrains Mono", fontSize:10, fontWeight:700,
            color:safeToDischarge ? T.green : T.red, letterSpacing:1.5, marginBottom:4,
          }}>
            {safeToDischarge ? "✅ CLEARED FOR DISCHARGE" : "⚠️ CONCERNS — REVIEW BEFORE DISCHARGE"}
          </div>
          <div style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt2, lineHeight:1.55 }}>
            {dischargeReadiness}
          </div>
        </div>
        <div style={{ textAlign:"center", flexShrink:0 }}>
          <div style={{ fontFamily:"JetBrains Mono", fontWeight:700, fontSize:13, color:riskColor }}>
            {(overallRisk||"low").toUpperCase()}
          </div>
          <div style={{ fontFamily:"DM Sans", fontSize:9, color:T.txt4 }}>RISK</div>
        </div>
      </div>

      {/* Concerns */}
      {concerns.length > 0 && (
        <div>
          <div style={{ fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700, color:T.orange, letterSpacing:2, textTransform:"uppercase", marginBottom:7 }}>
            Concerns Identified
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {concerns.map((c, i) => {
              const cc = c.category === "labs" ? T.blue : c.category === "medications" ? T.red : c.category === "diagnosis" ? T.orange : T.gold;
              return (
                <div key={i} style={{
                  ...glass, padding:"10px 13px",
                  borderLeft:`3px solid ${cc}`, background:`${cc}08`,
                }}>
                  <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:3 }}>
                    <span style={{
                      fontFamily:"JetBrains Mono", fontSize:7, fontWeight:700,
                      padding:"1px 6px", borderRadius:20,
                      background:`${cc}14`, color:cc, border:`1px solid ${cc}28`,
                    }}>{(c.category||"other").toUpperCase()}</span>
                    <span style={{ fontFamily:"DM Sans", fontWeight:600, fontSize:12, color:T.txt }}>{c.issue}</span>
                  </div>
                  <div style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt3, paddingLeft:2 }}>
                    ▸ {c.action}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Confirm before discharge */}
      {confirmBefore.length > 0 && (
        <div style={{ ...glass, padding:"12px 14px", borderLeft:`3px solid ${T.purple}`, background:`${T.purple}07` }}>
          <div style={{ fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700, color:T.purple, letterSpacing:2, textTransform:"uppercase", marginBottom:8 }}>
            Confirm Before Discharge
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
            {confirmBefore.map((item, i) => (
              <ConfirmItem key={i} text={item}/>
            ))}
          </div>
        </div>
      )}

      {/* Follow-up required */}
      {followupRequired.length > 0 && (
        <div style={{ ...glass, padding:"12px 14px", background:"rgba(8,22,40,0.6)" }}>
          <div style={{ fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700, color:T.blue, letterSpacing:2, textTransform:"uppercase", marginBottom:7 }}>
            Follow-Up Required
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
            {followupRequired.map((f, i) => (
              <span key={i} style={{
                fontFamily:"DM Sans", fontSize:11, fontWeight:500,
                padding:"4px 10px", borderRadius:20,
                background:`${T.blue}0e`, border:`1px solid ${T.blue}25`, color:T.blue,
              }}>→ {f}</span>
            ))}
          </div>
        </div>
      )}

      <button onClick={onRun} style={{
        fontFamily:"DM Sans", fontWeight:600, fontSize:11, padding:"7px",
        borderRadius:8, cursor:"pointer", border:"1px solid rgba(42,79,122,0.4)",
        background:"transparent", color:T.txt4,
      }}>↺ Re-run Safety Check</button>
    </div>
  );
}

function ConfirmItem({ text }) {
  const [checked, setChecked] = useState(false);
  return (
    <div onClick={() => setChecked(p => !p)} style={{ display:"flex", alignItems:"flex-start", gap:8, cursor:"pointer" }}>
      <div style={{
        width:16, height:16, borderRadius:4, flexShrink:0, marginTop:1,
        border:`2px solid ${checked ? T.teal : "rgba(42,79,122,0.5)"}`,
        background: checked ? T.teal : "transparent",
        display:"flex", alignItems:"center", justifyContent:"center",
        transition:"all .12s",
      }}>
        {checked && <span style={{ fontSize:9, color:"#050f1e", fontWeight:700 }}>✓</span>}
      </div>
      <span style={{
        fontFamily:"DM Sans", fontSize:12, color: checked ? T.txt4 : T.txt,
        textDecoration: checked ? "line-through" : "none",
        transition:"all .12s", lineHeight:1.45,
      }}>{text}</span>
    </div>
  );
}

// ── Smart Handoff Panel ───────────────────────────────────────────────
function HandoffPanel({ handoff, onGenerate }) {
  if (handoff?.status === "loading") {
    return (
      <div style={{ ...glass, padding:"28px", display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
        <ThinkingDots/>
        <div style={{ fontFamily:"DM Sans", fontSize:13, color:T.blue, fontWeight:600 }}>Generating I-PASS handoff...</div>
      </div>
    );
  }

  if (!handoff || handoff.status === "idle" || handoff.status === "error") {
    return (
      <div style={{ ...glass, padding:"24px", textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:10 }}>
        <div style={{ fontSize:30 }}>📋</div>
        <div style={{ fontFamily:"DM Sans", fontSize:14, color:T.txt2, fontWeight:700 }}>Smart I-PASS Handoff</div>
        <div style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt4, maxWidth:300, lineHeight:1.6 }}>
          Auto-generates a structured handoff from the clinical story, orders, and pending items.
        </div>
        {handoff?.status === "error" && <div style={{ fontFamily:"DM Sans", fontSize:11, color:T.coral }}>Generation failed — try again</div>}
        <button onClick={onGenerate} style={{
          fontFamily:"DM Sans", fontWeight:700, fontSize:13,
          padding:"11px 26px", borderRadius:10, cursor:"pointer",
          border:`1px solid ${T.blue}40`, background:`${T.blue}10`, color:T.blue,
        }}>📋 Generate Handoff</button>
      </div>
    );
  }

  function copyText() {
    if (navigator.clipboard) navigator.clipboard.writeText(handoff.text || "");
  }

  // Parse sections from text
  const sections = (handoff.text || "").split(/\*\*(I|P|A|S) —/).filter(Boolean);

  return (
    <div className={`${PREFIX}-fade`} style={{ display:"flex", flexDirection:"column", gap:10 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700, color:T.blue, letterSpacing:2, textTransform:"uppercase" }}>
          I-PASS Handoff
        </div>
        <div style={{ display:"flex", gap:6 }}>
          <button onClick={copyText} style={{
            fontFamily:"DM Sans", fontWeight:600, fontSize:10,
            padding:"4px 10px", borderRadius:7, cursor:"pointer",
            border:`1px solid ${T.blue}35`, background:`${T.blue}0a`, color:T.blue,
          }}>📋 Copy</button>
          <button onClick={onGenerate} style={{
            fontFamily:"DM Sans", fontWeight:600, fontSize:10,
            padding:"4px 10px", borderRadius:7, cursor:"pointer",
            border:"1px solid rgba(42,79,122,0.4)", background:"transparent", color:T.txt4,
          }}>↺ Refresh</button>
        </div>
      </div>
      <div style={{
        ...glass, padding:"16px",
        borderLeft:`3px solid ${T.blue}`, background:`${T.blue}07`,
        fontFamily:"DM Sans", fontSize:13, color:T.txt, lineHeight:1.8,
        whiteSpace:"pre-wrap",
      }}>
        {handoff.text}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
//  MAIN EXPORT
// ══════════════════════════════════════════════════════════════════════

export default function ClinicalNarrativeEngine({ onBack }) {
  const [patients,   setPatients]   = useState([]);
  const [orders,     setOrders]     = useState([]);
  const [results,    setResults]    = useState([]);
  const [notes,      setNotes]      = useState([]);
  const [dispos,     setDispos]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [lastFetch,  setLastFetch]  = useState(null);
  const [selected,   setSelected]   = useState(null);
  const [detailTab,  setDetailTab]  = useState("story");
  const [narratives, setNarratives] = useState({});
  const [checks,     setChecks]     = useState({});
  const [handoffs,   setHandoffs]   = useState({});
  const [convFilter, setConvFilter] = useState("all");
  const [toast,      setToast]      = useState({ msg:"", err:false });

  function showToast(msg, err = false) {
    setToast({ msg, err });
    setTimeout(() => setToast({ msg:"", err:false }), 2400);
  }

  // ── Data fetch ────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      const [pts, ords, res, nts, dps] = await Promise.all([
        Patient.list(), Order.list(), ClinicalResult.list(),
        ClinicalNote.list(), DispositionRecord.list(),
      ]);
      setPatients(pts || []);
      setOrders(ords || []);
      setResults(res || []);
      setNotes(nts || []);
      setDispos(dps || []);
      setLastFetch(new Date());
    } catch {
      showToast("Error loading patient data", true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const t = setInterval(fetchAll, 60000);
    return () => clearInterval(t);
  }, [fetchAll]);

  // ── Convergence map ───────────────────────────────────────────────
  const convMap = useMemo(() => {
    const m = {};
    patients.forEach(p => {
      m[p.id] = computeConvergence(p, orders, results, notes, dispos);
    });
    return m;
  }, [patients, orders, results, notes, dispos]);

  // ── AI: Generate Narrative ────────────────────────────────────────
  const generateNarrative = useCallback(async (patient) => {
    const id = patient.id;
    setNarratives(prev => ({ ...prev, [id]: { status:"loading" } }));
    try {
      const ctx = buildPatientContext(patient, orders, results, notes, dispos);
      const prompt = `You are a senior emergency medicine attending physician. Synthesize a living clinical narrative for this patient.

${ctx}

Return ONLY valid JSON — no markdown, no backticks:
{
  "oneliner": "One sentence: [age][sex] [CC], [key finding]. [Next decision point or trajectory].",
  "text": "3-5 sentence synthesis written like a curbside verbal report to a colleague. Include: established findings, what's changing, current trajectory, and what the key decision point is. Use specific values and times. Be clinically precise.",
  "convergence": "converging|developing|fragmented|complete",
  "breaks": [{"severity":"critical|warning","finding":"specific lab/exam/vital","concern":"why this contradicts the working story"}],
  "watchFor": "The single next thing that will change this patient's story."
}`;

      const raw = await InvokeLLM({ prompt, add_context_from_previous_calls: false });
      const text = typeof raw === "string" ? raw : raw?.content || "";
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      setNarratives(prev => ({ ...prev, [id]: { ...parsed, status:"done", generatedAt: new Date() } }));
    } catch {
      setNarratives(prev => ({ ...prev, [id]: { status:"error" } }));
      showToast("Narrative generation failed", true);
    }
  }, [orders, results, notes, dispos]);

  // ── AI: Pre-Discharge Safety Check ───────────────────────────────
  const runSafetyCheck = useCallback(async (patient) => {
    const id = patient.id;
    setChecks(prev => ({ ...prev, [id]: { status:"loading" } }));
    try {
      const ctx = buildPatientContext(patient, orders, results, notes, dispos);
      const prompt = `You are an emergency medicine patient safety expert. Perform a pre-discharge safety review.

${ctx}

Check systematically: unacknowledged criticals, diagnostic gaps, drug interactions in discharge meds, vital trends, unsigned notes, missing follow-up, unresolved red flags, return precautions needed.

Return ONLY valid JSON:
{
  "safeToDischarge": true or false,
  "overallRisk": "low|moderate|high",
  "concerns": [{"category":"labs|imaging|diagnosis|medications|followup|vitals|history","issue":"specific problem","action":"what to do about it"}],
  "confirmBefore": ["specific thing to verify before discharge"],
  "dischargeReadiness": "1-2 sentence overall assessment.",
  "followupRequired": ["specific follow-up item"]
}`;

      const raw = await InvokeLLM({ prompt, add_context_from_previous_calls: false });
      const text = typeof raw === "string" ? raw : raw?.content || "";
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      setChecks(prev => ({ ...prev, [id]: { ...parsed, status:"done", generatedAt: new Date() } }));
    } catch {
      setChecks(prev => ({ ...prev, [id]: { status:"error" } }));
      showToast("Safety check failed", true);
    }
  }, [orders, results, notes, dispos]);

  // ── AI: Smart Handoff ─────────────────────────────────────────────
  const generateHandoff = useCallback(async (patient) => {
    const id = patient.id;
    setHandoffs(prev => ({ ...prev, [id]: { status:"loading" } }));
    try {
      const ctx = buildPatientContext(patient, orders, results, notes, dispos);
      const prompt = `Generate an I-PASS structured handoff for an emergency medicine shift change.

${ctx}

Format as plain text with these exact headers:
**I — ILLNESS SEVERITY:** [Critical / Unstable / Stable / Good]
**P — PATIENT SUMMARY:** [2-3 sentences: who is this patient, what brought them in, where are they in their workup]
**A — ACTION LIST:**
  1. [Pending action — responsible party]
  2. [Next step needed]
**S — SITUATION AWARENESS:**
  - If [trigger]: [action to take]
  - If [trigger]: [action to take]
**S — SYNTHESIS:** [One sentence for the incoming provider]

Be specific, clinical, and concise. Use real values from the record.`;

      const raw = await InvokeLLM({ prompt, add_context_from_previous_calls: false });
      const text = typeof raw === "string" ? raw : (raw?.content || "Handoff generation failed");
      setHandoffs(prev => ({ ...prev, [id]: { text, status:"done", generatedAt: new Date() } }));
    } catch {
      setHandoffs(prev => ({ ...prev, [id]: { status:"error" } }));
      showToast("Handoff generation failed", true);
    }
  }, [orders, results, notes, dispos]);

  // ── Filtered + sorted patients ────────────────────────────────────
  const visiblePatients = useMemo(() => {
    let list = patients;
    if (convFilter !== "all") list = list.filter(p => convMap[p.id] === convFilter);
    const rank = { fragmented:0, developing:1, converging:2, complete:3 };
    return [...list].sort((a, b) => (rank[convMap[a.id]] ?? 2) - (rank[convMap[b.id]] ?? 2));
  }, [patients, convMap, convFilter]);

  const selectedPatient = useMemo(() => patients.find(p => p.id === selected), [patients, selected]);

  const stats = useMemo(() => ({
    total:      patients.length,
    fragmented: patients.filter(p => convMap[p.id] === "fragmented").length,
    converging: patients.filter(p => convMap[p.id] === "converging").length,
    complete:   patients.filter(p => convMap[p.id] === "complete").length,
  }), [patients, convMap]);

  const DETAIL_TABS = [
    { id:"story",   label:"Story",          icon:"🧠" },
    { id:"safety",  label:"Safety Check",   icon:"🛡️" },
    { id:"handoff", label:"Handoff",        icon:"📋" },
  ];

  return (
    <div style={{
      fontFamily:"DM Sans, sans-serif", background:T.bg, minHeight:"100vh",
      position:"relative", overflowX:"hidden", color:T.txt,
    }}>
      <AmbientBg/>
      {toast.msg && <Toast msg={toast.msg} err={toast.err}/>}

      <div style={{ position:"relative", zIndex:1, maxWidth:1500, margin:"0 auto", padding:"0 16px" }}>

        {/* Header */}
        <div style={{ padding:"18px 0 14px" }}>
          <HubBadge onBack={onBack}/>
          <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
            <div>
              <h1 className={`${PREFIX}-shim`} style={{
                fontFamily:"Playfair Display", fontSize:"clamp(22px,3.5vw,38px)",
                fontWeight:900, letterSpacing:-1, lineHeight:1.1, marginBottom:4,
              }}>Clinical Narrative Engine</h1>
              <p style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt3 }}>
                Living patient stories · Narrative break detection · Pre-discharge safety · Smart handoff
              </p>
            </div>
            {lastFetch && (
              <span style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.txt4 }}>
                ● {lastFetch.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))", gap:10, marginBottom:14 }}>
          {[
            { value:loading?"—":stats.total,      label:"Total Patients",  color:T.purple },
            { value:loading?"—":stats.fragmented,  label:"Fragmented",     color:T.red,    pulse:stats.fragmented>0 },
            { value:loading?"—":stats.converging,  label:"Converging",     color:T.green  },
            { value:loading?"—":stats.complete,    label:"Complete",        color:T.teal   },
          ].map(s => (
            <div key={s.label} style={{
              ...glass, padding:"9px 13px", borderRadius:10,
              borderLeft:`3px solid ${s.color}`,
              background:`linear-gradient(135deg,${s.color}12,rgba(8,22,40,0.8))`,
            }}>
              <div className={s.pulse ? `${PREFIX}-pulse` : ""} style={{ fontFamily:"JetBrains Mono", fontSize:16, fontWeight:700, color:s.color }}>{s.value}</div>
              <div style={{ fontFamily:"DM Sans", fontWeight:600, color:T.txt, fontSize:10, marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Convergence filter */}
        <div style={{ display:"flex", gap:5, marginBottom:12, flexWrap:"wrap" }}>
          <button onClick={() => setConvFilter("all")} style={{
            fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700,
            padding:"4px 11px", borderRadius:20, cursor:"pointer",
            border:`1px solid ${convFilter==="all" ? T.purple+"60" : T.purple+"22"}`,
            background: convFilter==="all" ? `${T.purple}14` : `${T.purple}05`,
            color: convFilter==="all" ? T.purple : T.txt3,
          }}>All ({patients.length})</button>
          {Object.entries(CONV).map(([k, v]) => {
            const ct = patients.filter(p => convMap[p.id] === k).length;
            return (
              <button key={k} onClick={() => setConvFilter(k)} style={{
                fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700,
                padding:"4px 11px", borderRadius:20, cursor:"pointer",
                border:`1px solid ${convFilter===k ? v.color+"60" : v.color+"22"}`,
                background: convFilter===k ? `${v.color}14` : `${v.color}05`,
                color: convFilter===k ? v.color : T.txt3,
              }}>{v.icon} {v.label} ({ct})</button>
            );
          })}
        </div>

        {/* Main split layout */}
        <div style={{
          display:"grid",
          gridTemplateColumns: selectedPatient ? "280px 1fr" : "1fr",
          gap:12, marginBottom:24, alignItems:"start",
        }}>

          {/* Left: Shift Commander grid */}
          <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
            {loading && [...Array(5)].map((_, i) => (
              <div key={i} style={{
                ...glass, height:95, borderRadius:14,
                background:"linear-gradient(135deg,rgba(14,37,68,0.5),rgba(8,22,40,0.3))",
                animation:`${PREFIX}pulse 1.8s ease-in-out ${i*0.1}s infinite`,
              }}/>
            ))}
            {!loading && visiblePatients.length === 0 && (
              <div style={{ ...glass, padding:"30px", textAlign:"center" }}>
                <div style={{ fontFamily:"DM Sans", fontSize:13, color:T.txt4 }}>No patients match filter</div>
              </div>
            )}
            {!loading && visiblePatients.map(p => (
              <CommanderCard
                key={p.id}
                patient={p}
                convState={convMap[p.id] || "developing"}
                narrative={narratives[p.id]}
                isSelected={selected === p.id}
                onClick={() => {
                  setSelected(prev => prev === p.id ? null : p.id);
                  setDetailTab("story");
                }}
              />
            ))}
          </div>

          {/* Right: Patient detail */}
          {selectedPatient && (
            <div className={`${PREFIX}-fade`} style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {/* Patient header */}
              <div style={{
                ...glass, padding:"12px 14px",
                borderLeft:`3px solid ${CONV[convMap[selectedPatient.id]]?.color || T.purple}`,
                display:"flex", alignItems:"center", justifyContent:"space-between",
              }}>
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:2 }}>
                    <span style={{
                      fontFamily:"JetBrains Mono", fontWeight:700, fontSize:22,
                      color:CONV[convMap[selectedPatient.id]]?.color || T.purple, lineHeight:1,
                    }}>Rm {selectedPatient.room}</span>
                    <span style={{ fontFamily:"DM Sans", fontWeight:700, fontSize:15, color:T.txt }}>
                      {selectedPatient.cc}
                    </span>
                    <ConvBadge state={convMap[selectedPatient.id] || "developing"}/>
                  </div>
                  <div style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt4 }}>
                    {selectedPatient.age}{selectedPatient.sex} · {selectedPatient.provider} · {fmtMins(minsAgo(selectedPatient.arrived_at))} in ED
                  </div>
                </div>
                <button onClick={() => setSelected(null)} style={{
                  background:"rgba(42,79,122,0.28)", border:"1px solid rgba(42,79,122,0.5)",
                  borderRadius:8, color:T.txt3, cursor:"pointer",
                  fontFamily:"DM Sans", fontSize:12, fontWeight:600, padding:"4px 10px",
                }}>✕</button>
              </div>

              {/* Detail tabs */}
              <div style={{ ...glass, padding:"4px", display:"flex", gap:3 }}>
                {DETAIL_TABS.map(dt => (
                  <button key={dt.id} onClick={() => setDetailTab(dt.id)} style={{
                    flex:1, fontFamily:"DM Sans", fontWeight:600, fontSize:12,
                    padding:"8px 6px", borderRadius:9, cursor:"pointer", textAlign:"center",
                    border:`1px solid ${detailTab===dt.id ? T.purple+"50" : "transparent"}`,
                    background: detailTab===dt.id ? `${T.purple}14` : "transparent",
                    color: detailTab===dt.id ? T.purple : T.txt3, transition:"all .12s",
                  }}>{dt.icon} {dt.label}</button>
                ))}
              </div>

              {/* Tab content */}
              {detailTab === "story" && (
                <NarrativePanel
                  narrative={narratives[selectedPatient.id]}
                  patient={selectedPatient}
                  onGenerate={() => generateNarrative(selectedPatient)}
                />
              )}
              {detailTab === "safety" && (
                <SafetyCheckPanel
                  check={checks[selectedPatient.id]}
                  patient={selectedPatient}
                  onRun={() => runSafetyCheck(selectedPatient)}
                />
              )}
              {detailTab === "handoff" && (
                <HandoffPanel
                  handoff={handoffs[selectedPatient.id]}
                  onGenerate={() => generateHandoff(selectedPatient)}
                />
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ textAlign:"center", paddingBottom:24 }}>
          <span style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.txt4, letterSpacing:1.5 }}>
            NOTRYA · CLINICAL NARRATIVE ENGINE · AI-ASSISTED — PHYSICIAN JUDGMENT REQUIRED
          </span>
        </div>
      </div>
    </div>
  );
}