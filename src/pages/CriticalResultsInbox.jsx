import { useState, useEffect, useCallback, useMemo } from "react";
import { base44 } from "@/api/base44Client";
const Patient = base44.entities.Patient;
const ClinicalResult = base44.entities.ClinicalResult;

const PREFIX = "cri";

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
    @keyframes ${PREFIX}pulse { 0%,100%{opacity:1} 50%{opacity:0.25} }
    @keyframes ${PREFIX}ring  { 0%,100%{box-shadow:0 0 0 0 rgba(255,68,68,0.5)} 70%{box-shadow:0 0 0 12px rgba(255,68,68,0)} }
    .${PREFIX}-fade  { animation:${PREFIX}fade  .22s ease both; }
    .${PREFIX}-pulse { animation:${PREFIX}pulse 1.6s ease-in-out infinite; }
    .${PREFIX}-ring  { animation:${PREFIX}ring  2s ease-out infinite; }
    .${PREFIX}-shim  {
      background:linear-gradient(90deg,#f2f7ff 0%,#fff 25%,#ff4444 40%,#ff9f43 60%,#3b9eff 80%,#f2f7ff 100%);
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

// ── CRITICALITY CONFIG ────────────────────────────────────────────────
const CRIT_CFG = {
  panic:    { color:T.red,    label:"PANIC",    icon:"🚨", bg:"rgba(255,68,68,0.08)"    },
  critical: { color:T.orange, label:"CRITICAL", icon:"⚠️",  bg:"rgba(255,159,67,0.07)"  },
  abnormal: { color:T.gold,   label:"ABNORMAL", icon:"⚡", bg:"rgba(245,200,66,0.06)"  },
};

const TYPE_ICON = {
  lab:"🔬", radiology:"🩻", ekg:"❤️", vitals:"📊", other:"📋",
};

// ── ESCALATION THRESHOLDS (minutes) ──────────────────────────────────
const ESC = [
  { min:0,  max:15,  color:T.teal,   label:"Just In",      ring:false },
  { min:15, max:30,  color:T.gold,   label:"Pending",      ring:false },
  { min:30, max:60,  color:T.orange, label:"Overdue",      ring:false },
  { min:60, max:999, color:T.red,    label:"ESCALATE NOW", ring:true  },
];

function getEsc(mins) {
  return ESC.find(e => mins >= e.min && mins < e.max) || ESC[ESC.length-1];
}

function minsAgo(isoStr, now) {
  if (!isoStr) return null;
  return Math.max(0, Math.floor((now - new Date(isoStr).getTime()) / 60000));
}

function fmtTime(isoStr) {
  if (!isoStr) return "—";
  return new Date(isoStr).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
}

function fmtElapsed(mins) {
  if (mins === null || mins === undefined) return "—";
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60); const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// ══════════════════════════════════════════════════════════════════════
//  MODULE-SCOPE PRIMITIVES
// ══════════════════════════════════════════════════════════════════════

function AmbientBg() {
  return (
    <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0 }}>
      {[
        { l:"8%",  t:"12%", r:320, c:"rgba(255,68,68,0.04)"    },
        { l:"90%", t:"15%", r:280, c:"rgba(255,159,67,0.04)"   },
        { l:"78%", t:"80%", r:300, c:"rgba(59,158,255,0.04)"   },
        { l:"15%", t:"82%", r:240, c:"rgba(155,109,255,0.035)" },
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
        <span style={{ fontFamily:"JetBrains Mono", fontSize:10, color:T.txt3, letterSpacing:2 }}>CRITICAL INBOX</span>
      </div>
      <div style={{ height:1, flex:1, background:"linear-gradient(90deg,rgba(255,68,68,0.5),transparent)" }}/>
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

function StatTile({ value, label, sub, color, pulse }) {
  return (
    <div style={{
      ...glass, padding:"9px 13px", borderRadius:10,
      borderLeft:`3px solid ${color}`,
      background:`linear-gradient(135deg,${color}12,rgba(8,22,40,0.8))`,
    }}>
      <div className={pulse ? `${PREFIX}-pulse` : ""}
        style={{ fontFamily:"JetBrains Mono", fontSize:16, fontWeight:700, color, lineHeight:1 }}>{value}</div>
      <div style={{ fontFamily:"DM Sans", fontWeight:600, color:T.txt, fontSize:10, margin:"3px 0" }}>{label}</div>
      {sub && <div style={{ fontFamily:"DM Sans", fontSize:9, color:T.txt4 }}>{sub}</div>}
    </div>
  );
}

function Toast({ msg, isError }) {
  return (
    <div style={{
      position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)",
      background:"rgba(8,22,40,0.96)",
      border:`1px solid ${isError ? T.red+"55" : "rgba(0,229,192,0.4)"}`,
      borderRadius:10, padding:"10px 20px", fontFamily:"DM Sans", fontWeight:600,
      fontSize:13, color:isError ? T.coral : T.teal,
      zIndex:99999, pointerEvents:"none", animation:`${PREFIX}fade .2s ease both`,
    }}>{msg}</div>
  );
}

function SkeletonCard() {
  return (
    <div style={{
      ...glass, height:130, borderRadius:14,
      background:"linear-gradient(135deg,rgba(14,37,68,0.5),rgba(8,22,40,0.3))",
      animation:`${PREFIX}pulse 1.8s ease-in-out infinite`,
    }}/>
  );
}

// ── Escalation Timer Badge ────────────────────────────────────────────
function EscBadge({ mins, compact }) {
  if (mins === null) return null;
  const e = getEsc(mins);
  return (
    <div className={e.ring ? `${PREFIX}-ring` : ""}
      style={{
        display:"inline-flex", alignItems:"center", gap:compact ? 4 : 6,
        padding: compact ? "2px 8px" : "4px 11px", borderRadius:20,
        border:`1px solid ${e.color}45`,
        background:`${e.color}13`,
      }}>
      {!compact && e.ring && (
        <span className={`${PREFIX}-pulse`} style={{ fontSize:10 }}>🚨</span>
      )}
      <span style={{
        fontFamily:"JetBrains Mono", fontWeight:700,
        fontSize: compact ? 9 : 11, color:e.color,
      }}>{fmtElapsed(mins)}</span>
      {!compact && (
        <span style={{ fontFamily:"DM Sans", fontSize:9, color:e.color, fontWeight:600 }}>
          {e.label}
        </span>
      )}
    </div>
  );
}

// ── Ack Modal ─────────────────────────────────────────────────────────
function AckModal({ result, patient, onClose, onAck, onNotify }) {
  const [name,    setName]    = useState("");
  const [note,    setNote]    = useState("");
  const [busy,    setBusy]    = useState(false);
  const [mode,    setMode]    = useState("ack"); // "ack" | "notify"

  const cfg = CRIT_CFG[result.critical_level] || CRIT_CFG.critical;

  async function submit() {
    if (!name.trim()) return;
    setBusy(true);
    if (mode === "ack") await onAck(result.id, name.trim(), note.trim());
    else await onNotify(result.id, name.trim(), note.trim());
    setBusy(false);
  }

  return (
    <div
      style={{
        position:"fixed", inset:0, zIndex:1000,
        background:"rgba(3,8,18,0.9)", backdropFilter:"blur(8px)",
        display:"flex", alignItems:"center", justifyContent:"center", padding:16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          ...glass, width:"100%", maxWidth:460,
          boxShadow:`0 24px 80px rgba(0,0,0,0.7),0 0 40px ${cfg.color}14`,
          borderColor:`${cfg.color}28`,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding:"14px 16px 10px",
          borderBottom:"1px solid rgba(42,79,122,0.3)",
          display:"flex", justifyContent:"space-between", alignItems:"flex-start",
        }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
              <span style={{
                fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700,
                padding:"2px 7px", borderRadius:20,
                background:`${cfg.color}18`, border:`1px solid ${cfg.color}40`,
                color:cfg.color, letterSpacing:.5,
              }}>{cfg.icon} {cfg.label}</span>
              <span style={{ fontFamily:"DM Sans", fontWeight:700, fontSize:14, color:T.txt }}>
                {result.name}
              </span>
            </div>
            <div style={{ fontFamily:"JetBrains Mono", fontSize:13, fontWeight:700, color:cfg.color }}>
              {result.value} {result.unit}
              {result.ref_range && (
                <span style={{ fontFamily:"DM Sans", fontSize:10, color:T.txt4, fontWeight:400, marginLeft:6 }}>
                  (ref: {result.ref_range})
                </span>
              )}
            </div>
            <div style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt4, marginTop:3 }}>
              Rm {patient?.room} · {patient?.cc} · {patient?.provider}
            </div>
          </div>
          <button onClick={onClose} style={{
            background:"rgba(42,79,122,0.28)", border:"1px solid rgba(42,79,122,0.5)",
            borderRadius:8, color:T.txt3, cursor:"pointer",
            fontFamily:"DM Sans", fontSize:13, fontWeight:600, padding:"4px 10px",
          }}>✕</button>
        </div>

        <div style={{ padding:"14px 16px" }}>
          {/* Mode toggle */}
          <div style={{
            ...glass, padding:"4px", display:"flex", gap:3, marginBottom:12, borderRadius:10,
          }}>
            {[
              { id:"ack",    label:"Acknowledge",    color:T.green  },
              { id:"notify", label:"Log Notification", color:T.blue },
            ].map(m => (
              <button key={m.id} onClick={() => setMode(m.id)} style={{
                flex:1, fontFamily:"DM Sans", fontWeight:600, fontSize:11,
                padding:"7px", borderRadius:8, cursor:"pointer", transition:"all .12s",
                border:`1px solid ${mode===m.id ? m.color+"50" : "transparent"}`,
                background: mode===m.id ? `${m.color}14` : "transparent",
                color: mode===m.id ? m.color : T.txt3,
              }}>
                {m.id === "ack" ? "✅ " : "📞 "}{m.label}
              </button>
            ))}
          </div>

          <div style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt4, marginBottom:10 }}>
            {mode === "ack"
              ? "Confirms you have reviewed this critical result and taken appropriate action."
              : "Records that the assigned provider has been notified. Result remains in inbox until acknowledged."}
          </div>

          {/* Provider name */}
          <div style={{ marginBottom:8 }}>
            <div style={{
              fontFamily:"JetBrains Mono", fontSize:7, fontWeight:700, color:T.txt4,
              letterSpacing:1.5, textTransform:"uppercase", marginBottom:4,
            }}>Your Name *</div>
            <input
              type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Dr. Reyes, NP Williams, etc."
              autoFocus
              style={{
                background:"rgba(14,37,68,0.8)",
                border:`1px solid ${name ? T.teal+"45" : "rgba(42,79,122,0.4)"}`,
                borderRadius:8, padding:"9px 12px",
                fontFamily:"DM Sans", fontSize:13, color:T.txt,
                outline:"none", width:"100%",
              }}
            />
          </div>

          {/* Optional note */}
          <div style={{ marginBottom:12 }}>
            <div style={{
              fontFamily:"JetBrains Mono", fontSize:7, fontWeight:700, color:T.txt4,
              letterSpacing:1.5, textTransform:"uppercase", marginBottom:4,
            }}>Action Taken (optional)</div>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
              placeholder="e.g. Called Dr. Chen, ordered repeat K+, started calcium gluconate..."
              style={{
                background:"rgba(14,37,68,0.8)",
                border:"1px solid rgba(42,79,122,0.35)",
                borderRadius:8, padding:"8px 12px",
                fontFamily:"DM Sans", fontSize:12, color:T.txt,
                outline:"none", width:"100%", resize:"none", lineHeight:1.5,
              }}
            />
          </div>

          {/* Submit */}
          <button
            onClick={submit}
            disabled={!name.trim() || busy}
            style={{
              width:"100%", fontFamily:"DM Sans", fontWeight:700, fontSize:13,
              padding:"11px", borderRadius:9,
              cursor: name.trim() && !busy ? "pointer" : "not-allowed",
              border:`1px solid ${mode==="ack" ? T.green : T.blue}40`,
              background:`${mode==="ack" ? T.green : T.blue}12`,
              color: mode==="ack" ? T.green : T.blue,
              opacity: !name.trim() || busy ? 0.5 : 1, transition:"opacity .12s",
            }}>
            {busy ? "Saving..." : mode === "ack" ? "✅ Confirm Acknowledgment" : "📞 Log Notification"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Critical Result Card ──────────────────────────────────────────────
function ResultCard({ result, patient, now, onOpen }) {
  const cfg        = CRIT_CFG[result.critical_level] || CRIT_CFG.critical;
  const typeIcon   = TYPE_ICON[result.result_type] || TYPE_ICON.other;
  const resultMins = minsAgo(result.resulted_at, now);
  const esc        = resultMins !== null ? getEsc(resultMins) : null;
  const isAcked    = result.acknowledged;
  const ackMins    = result.acknowledged_at ? minsAgo(result.resulted_at, new Date(result.acknowledged_at)) : null;

  return (
    <div className={`${PREFIX}-fade`} style={{
      ...glass, padding:0, overflow:"hidden",
      border:`1px solid rgba(42,79,122,0.3)`,
      borderLeft:`3px solid ${isAcked ? T.txt4 : cfg.color}`,
      opacity: isAcked ? 0.72 : 1,
      background: !isAcked && esc?.ring
        ? `linear-gradient(135deg,${T.red}0b,rgba(8,22,40,0.82))`
        : "rgba(8,22,40,0.78)",
    }}>
      {/* Top row */}
      <div style={{ padding:"10px 13px 8px", display:"flex", gap:10, alignItems:"flex-start" }}>

        {/* Left: result details */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:7, flexWrap:"wrap", marginBottom:4 }}>
            <span style={{ fontSize:13 }}>{typeIcon}</span>
            <span style={{ fontFamily:"DM Sans", fontWeight:700, fontSize:13, color:T.txt }}>
              {result.name}
            </span>
            <span style={{
              fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700,
              padding:"2px 7px", borderRadius:20,
              background:`${cfg.color}18`, border:`1px solid ${cfg.color}40`,
              color:cfg.color,
            }}>{cfg.icon} {cfg.label}</span>
            {result.notified_by && !isAcked && (
              <span style={{
                fontFamily:"JetBrains Mono", fontSize:7,
                padding:"2px 6px", borderRadius:20,
                background:`${T.blue}12`, border:`1px solid ${T.blue}28`,
                color:T.blue,
              }}>📞 NOTIFIED</span>
            )}
          </div>

          {/* Value */}
          <div style={{ display:"flex", alignItems:"baseline", gap:8, marginBottom:4 }}>
            <span style={{
              fontFamily:"JetBrains Mono", fontWeight:700, fontSize:20,
              color: isAcked ? T.txt3 : cfg.color, lineHeight:1,
            }}>{result.value}</span>
            {result.unit && (
              <span style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt4 }}>{result.unit}</span>
            )}
            {result.ref_range && (
              <span style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.txt4 }}>
                ref: {result.ref_range}
              </span>
            )}
          </div>

          {/* Patient row */}
          <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
            <span style={{
              fontFamily:"JetBrains Mono", fontWeight:700, fontSize:13,
              color: isAcked ? T.txt4 : T.txt2,
            }}>Rm {patient?.room || "?"}</span>
            <span style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt3 }}>
              {patient?.cc || "—"}
            </span>
            <span style={{ fontFamily:"DM Sans", fontSize:10, color:T.txt4 }}>
              {patient?.age}{patient?.sex}
            </span>
          </div>
        </div>

        {/* Right: timer or acked badge */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:5, flexShrink:0 }}>
          {isAcked ? (
            <span style={{
              fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700,
              padding:"3px 9px", borderRadius:20,
              background:`${T.green}14`, border:`1px solid ${T.green}35`,
              color:T.green,
            }}>✓ ACKED</span>
          ) : (
            <EscBadge mins={resultMins}/>
          )}
        </div>
      </div>

      {/* Middle row: Provider + nurse */}
      <div style={{
        borderTop:"1px solid rgba(42,79,122,0.22)",
        padding:"5px 13px", display:"flex", gap:8, alignItems:"center",
      }}>
        <span style={{ fontSize:9 }}>🩺</span>
        <span style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt2, fontWeight:500, flex:1 }}>
          {patient?.provider || "Unassigned"}
        </span>
        <span style={{ fontSize:9 }}>👩‍⚕️</span>
        <span style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt3, flex:1 }}>
          {patient?.nurse || "—"}
        </span>
        {!patient?.provider && (
          <span style={{
            fontFamily:"JetBrains Mono", fontSize:7, fontWeight:700,
            padding:"2px 6px", borderRadius:20,
            background:`${T.red}14`, border:`1px solid ${T.red}30`, color:T.coral,
          }}>NO PROVIDER</span>
        )}
      </div>

      {/* Timestamp row */}
      <div style={{
        borderTop:"1px solid rgba(42,79,122,0.22)",
        padding:"5px 13px",
        display:"flex", gap:12, flexWrap:"wrap", alignItems:"center",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:4 }}>
          <span style={{ fontFamily:"JetBrains Mono", fontSize:8, color:T.txt4 }}>RESULTED</span>
          <span style={{ fontFamily:"JetBrains Mono", fontSize:9, fontWeight:700, color:T.txt3 }}>
            {fmtTime(result.resulted_at)}
          </span>
        </div>
        {result.notified_at && (
          <div style={{ display:"flex", alignItems:"center", gap:4 }}>
            <span style={{ fontFamily:"JetBrains Mono", fontSize:8, color:T.txt4 }}>NOTIFIED</span>
            <span style={{ fontFamily:"JetBrains Mono", fontSize:9, fontWeight:700, color:T.blue }}>
              {fmtTime(result.notified_at)}
            </span>
            {result.notified_by && (
              <span style={{ fontFamily:"DM Sans", fontSize:9, color:T.txt4 }}>
                {result.notified_by}
              </span>
            )}
          </div>
        )}
        {isAcked && (
          <div style={{ display:"flex", alignItems:"center", gap:4 }}>
            <span style={{ fontFamily:"JetBrains Mono", fontSize:8, color:T.green }}>ACKED</span>
            <span style={{ fontFamily:"JetBrains Mono", fontSize:9, fontWeight:700, color:T.green }}>
              {fmtTime(result.acknowledged_at)}
            </span>
            {result.acknowledged_by && (
              <span style={{ fontFamily:"DM Sans", fontSize:9, color:T.txt3 }}>
                {result.acknowledged_by}
              </span>
            )}
            {ackMins !== null && (
              <span style={{ fontFamily:"JetBrains Mono", fontSize:8, color:T.txt4 }}>
                ({fmtElapsed(ackMins)} response)
              </span>
            )}
          </div>
        )}
        {result.action_note && (
          <div style={{ fontFamily:"DM Sans", fontSize:10, color:T.txt4, flex:"1 1 100%", paddingTop:1 }}>
            📝 {result.action_note}
          </div>
        )}
      </div>

      {/* Action row */}
      {!isAcked && (
        <div style={{ borderTop:"1px solid rgba(42,79,122,0.22)", padding:"7px 10px" }}>
          <button onClick={onOpen} style={{
            width:"100%", fontFamily:"DM Sans", fontWeight:700, fontSize:12,
            padding:"8px", borderRadius:8, cursor:"pointer",
            border:`1px solid ${cfg.color}40`, background:`${cfg.color}0e`, color:cfg.color,
            display:"flex", alignItems:"center", justifyContent:"center", gap:6,
          }}>
            {esc?.ring ? "🚨 ACKNOWLEDGE NOW" : "✅ Acknowledge / Log Action"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Audit Trail Drawer ────────────────────────────────────────────────
function AuditDrawer({ items, onClose }) {
  return (
    <div
      style={{
        position:"fixed", inset:0, zIndex:999,
        background:"rgba(3,8,18,0.85)", backdropFilter:"blur(6px)",
        display:"flex", alignItems:"center", justifyContent:"center", padding:16,
      }}
      onClick={onClose}
    >
      <div
        style={{ ...glass, width:"100%", maxWidth:560, maxHeight:"80vh", overflow:"hidden", display:"flex", flexDirection:"column" }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{
          padding:"14px 16px 10px",
          borderBottom:"1px solid rgba(42,79,122,0.3)",
          display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0,
        }}>
          <span style={{ fontFamily:"DM Sans", fontWeight:700, fontSize:15, color:T.txt }}>
            📋 Acknowledgment Audit Trail
          </span>
          <button onClick={onClose} style={{
            background:"rgba(42,79,122,0.28)", border:"1px solid rgba(42,79,122,0.5)",
            borderRadius:8, color:T.txt3, cursor:"pointer",
            fontFamily:"DM Sans", fontSize:13, fontWeight:600, padding:"4px 10px",
          }}>✕</button>
        </div>

        <div style={{ overflowY:"auto", padding:"12px" }}>
          {items.length === 0 ? (
            <div style={{ textAlign:"center", padding:"30px 0", color:T.txt4, fontFamily:"DM Sans", fontSize:13 }}>
              No acknowledged results yet
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {items.map((r, i) => {
                const cfg      = CRIT_CFG[r.critical_level] || CRIT_CFG.critical;
                const ackMins  = r.acknowledged_at ? minsAgo(r.resulted_at, new Date(r.acknowledged_at)) : null;
                return (
                  <div key={r.id || i} style={{
                    ...glass, padding:"10px 13px", borderRadius:10,
                    borderLeft:`3px solid ${T.green}`,
                    background:"rgba(8,22,40,0.6)",
                  }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                      <div style={{ display:"flex", gap:7, alignItems:"center" }}>
                        <span style={{ fontFamily:"DM Sans", fontWeight:700, fontSize:12, color:T.txt }}>
                          {r.name}
                        </span>
                        <span style={{
                          fontFamily:"JetBrains Mono", fontSize:7, color:cfg.color,
                          background:`${cfg.color}14`, padding:"1px 6px", borderRadius:10,
                          border:`1px solid ${cfg.color}30`,
                        }}>{cfg.label}</span>
                      </div>
                      <span style={{ fontFamily:"JetBrains Mono", fontSize:11, fontWeight:700, color:cfg.color }}>
                        {r.value} {r.unit}
                      </span>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6 }}>
                      {[
                        { label:"Resulted",      val:fmtTime(r.resulted_at),    color:T.txt4  },
                        { label:"Acknowledged",  val:fmtTime(r.acknowledged_at),color:T.green },
                        { label:"Response Time", val:fmtElapsed(ackMins),        color:ackMins > 60 ? T.red : ackMins > 30 ? T.orange : T.green },
                      ].map(({ label, val, color }) => (
                        <div key={label}>
                          <div style={{ fontFamily:"JetBrains Mono", fontSize:7, color:T.txt4, letterSpacing:1.2, textTransform:"uppercase", marginBottom:1 }}>{label}</div>
                          <div style={{ fontFamily:"JetBrains Mono", fontSize:11, fontWeight:700, color }}>{val}</div>
                        </div>
                      ))}
                    </div>
                    {r.acknowledged_by && (
                      <div style={{ fontFamily:"DM Sans", fontSize:10, color:T.txt4, marginTop:4 }}>
                        By: {r.acknowledged_by}
                        {r.action_note && ` — ${r.action_note}`}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
//  MAIN EXPORT
// ══════════════════════════════════════════════════════════════════════

export default function CriticalResultsInbox({ onBack }) {
  const [results,   setResults]   = useState([]);
  const [patients,  setPatients]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [now,       setNow]       = useState(Date.now());
  const [lastFetch, setLastFetch] = useState(null);
  const [filter,    setFilter]    = useState("unacked");
  const [typeFilter,setTypeFilter]= useState("all");
  const [sortMode,  setSortMode]  = useState("oldest");
  const [modal,     setModal]     = useState(null); // { result, patient }
  const [showAudit, setShowAudit] = useState(false);
  const [toast,     setToast]     = useState({ msg:"", err:false });
  const [myProvider,setMyProvider]= useState("");

  // ── Live clock ────────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  // ── Data fetch ────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      const [rawResults, rawPatients] = await Promise.all([
        ClinicalResult.filter({ flag: "critical" }),
        Patient.list(),
      ]);
      setResults(rawResults || []);
      setPatients(rawPatients || []);
      setLastFetch(new Date());
    } catch {
      showToast("Error loading results", true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const t = setInterval(fetchAll, 30000);
    return () => clearInterval(t);
  }, [fetchAll]);

  // ── Auto-set my provider ──────────────────────────────────────────
  useEffect(() => {
    if (!myProvider && patients.length > 0 && patients[0].provider) {
      setMyProvider(patients[0].provider);
    }
  }, [patients, myProvider]);

  // ── Toast helper ──────────────────────────────────────────────────
  function showToast(msg, err = false) {
    setToast({ msg, err });
    setTimeout(() => setToast({ msg:"", err:false }), 2400);
  }

  // ── Write: Acknowledge ────────────────────────────────────────────
  const handleAck = useCallback(async (id, name, note) => {
    try {
      await ClinicalResult.update(id, {
        acknowledged:    true,
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: name,
        action_note:     note || undefined,
      });
      showToast(`Acknowledged by ${name}`);
      setModal(null);
      fetchAll();
    } catch {
      showToast("Error saving acknowledgment", true);
    }
  }, [fetchAll]);

  // ── Write: Notify ─────────────────────────────────────────────────
  const handleNotify = useCallback(async (id, name, note) => {
    try {
      await ClinicalResult.update(id, {
        notified_at: new Date().toISOString(),
        notified_by: name,
        action_note: note || undefined,
      });
      showToast(`Notification logged by ${name}`);
      setModal(null);
      fetchAll();
    } catch {
      showToast("Error logging notification", true);
    }
  }, [fetchAll]);

  // ── Derived data ──────────────────────────────────────────────────
  const enriched = useMemo(() =>
    results.map(r => ({
      ...r,
      _patient: patients.find(p => p.id === r.patient) || null,
    })),
  [results, patients]);

  const unacked    = useMemo(() => enriched.filter(r => !r.acknowledged), [enriched]);
  const escalating = useMemo(() => unacked.filter(r => minsAgo(r.resulted_at, now) >= 60), [unacked, now]);
  const ackedToday = useMemo(() => enriched.filter(r => r.acknowledged), [enriched]);

  const avgResponse = useMemo(() => {
    const times = ackedToday
      .filter(r => r.resulted_at && r.acknowledged_at)
      .map(r => minsAgo(r.resulted_at, new Date(r.acknowledged_at)));
    if (!times.length) return null;
    return Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  }, [ackedToday]);

  // ── Filter + sort ─────────────────────────────────────────────────
  const visible = useMemo(() => {
    let list = enriched;
    if (filter === "unacked")  list = list.filter(r => !r.acknowledged);
    if (filter === "acked")    list = list.filter(r => r.acknowledged);
    if (filter === "mine")     list = list.filter(r => r._patient?.provider === myProvider);
    if (filter === "escalate") list = list.filter(r => !r.acknowledged && minsAgo(r.resulted_at, now) >= 30);
    if (typeFilter !== "all")  list = list.filter(r => r.result_type === typeFilter);

    const sorted = [...list].sort((a, b) => {
      const ta = new Date(a.resulted_at || 0).getTime();
      const tb = new Date(b.resulted_at || 0).getTime();
      if (sortMode === "oldest") return ta - tb;
      if (sortMode === "newest") return tb - ta;
      const ra = (a._patient?.room || "").padStart(4,"0");
      const rb = (b._patient?.room || "").padStart(4,"0");
      return ra.localeCompare(rb);
    });

    // Always put escalating (>60min) at top if showing unacked
    if (filter !== "acked") {
      const esc   = sorted.filter(r => !r.acknowledged && minsAgo(r.resulted_at, now) >= 60);
      const rest  = sorted.filter(r => !(  !r.acknowledged && minsAgo(r.resulted_at, now) >= 60));
      return [...esc, ...rest];
    }
    return sorted;
  }, [enriched, filter, typeFilter, sortMode, myProvider, now]);

  const FILTERS = [
    { id:"unacked",  label:"Unacknowledged", color:T.red,    count:unacked.length  },
    { id:"escalate", label:"Escalating",     color:T.orange, count:escalating.length },
    { id:"mine",     label:"My Patients",    color:T.blue,   count:enriched.filter(r=>!r.acknowledged && r._patient?.provider===myProvider).length },
    { id:"all",      label:"All",            color:T.teal,   count:enriched.length },
    { id:"acked",    label:"Acknowledged",   color:T.green,  count:ackedToday.length },
  ];

  const TYPE_FILTERS = [
    { id:"all",       label:"All Types"  },
    { id:"lab",       label:"🔬 Lab"     },
    { id:"radiology", label:"🩻 Radiology"},
    { id:"ekg",       label:"❤️ EKG"     },
    { id:"vitals",    label:"📊 Vitals"  },
  ];

  return (
    <div style={{
      fontFamily:"DM Sans, sans-serif", background:T.bg, minHeight:"100vh",
      position:"relative", overflowX:"hidden", color:T.txt,
    }}>
      <AmbientBg/>
      {toast.msg && <Toast msg={toast.msg} isError={toast.err}/>}
      {modal && (
        <AckModal
          result={modal.result}
          patient={modal.patient}
          onClose={() => setModal(null)}
          onAck={handleAck}
          onNotify={handleNotify}
        />
      )}
      {showAudit && <AuditDrawer items={ackedToday} onClose={() => setShowAudit(false)}/>}

      <div style={{ position:"relative", zIndex:1, maxWidth:1400, margin:"0 auto", padding:"0 16px" }}>

        {/* Header */}
        <div style={{ padding:"18px 0 14px" }}>
          <HubBadge onBack={onBack}/>
          <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
            <div>
              <h1 className={`${PREFIX}-shim`} style={{
                fontFamily:"Playfair Display", fontSize:"clamp(22px,3.5vw,36px)",
                fontWeight:900, letterSpacing:-1, lineHeight:1.1, marginBottom:4,
              }}>Critical Results Inbox</h1>
              <p style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt3 }}>
                All patients · Lab · Radiology · EKG · Acknowledgment audit trail · Live
              </p>
            </div>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              {lastFetch && (
                <span style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.txt4 }}>
                  ● {lastFetch.toLocaleTimeString()}
                </span>
              )}
              <button onClick={() => setShowAudit(true)} style={{
                fontFamily:"DM Sans", fontWeight:600, fontSize:11,
                padding:"6px 12px", borderRadius:8, cursor:"pointer",
                border:"1px solid rgba(42,79,122,0.4)",
                background:"rgba(14,37,68,0.5)", color:T.txt3,
              }}>📋 Audit Trail</button>
            </div>
          </div>
        </div>

        {/* Stats banner */}
        <div style={{
          display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",
          gap:10, marginBottom:14,
        }}>
          <StatTile
            value={loading ? "—" : unacked.length}
            label="Unacknowledged" sub="Needs action"
            color={unacked.length > 0 ? T.red : T.teal}
            pulse={unacked.length > 0}
          />
          <StatTile
            value={loading ? "—" : escalating.length}
            label="Escalating" sub=">60 min unacked"
            color={escalating.length > 0 ? T.red : T.txt4}
            pulse={escalating.length > 0}
          />
          <StatTile
            value={loading ? "—" : ackedToday.length}
            label="Acknowledged" sub="Completed"
            color={T.green}
          />
          <StatTile
            value={loading || avgResponse === null ? "—" : fmtElapsed(avgResponse)}
            label="Avg Response" sub="Ack time today"
            color={avgResponse > 60 ? T.red : avgResponse > 30 ? T.orange : T.green}
          />
        </div>

        {/* Critical escalation banner */}
        {!loading && escalating.length > 0 && (
          <div className={`${PREFIX}-fade`} style={{
            ...glass, padding:"10px 14px", marginBottom:12,
            border:`1px solid ${T.red}40`,
            borderLeft:`4px solid ${T.red}`,
            background:`${T.red}0b`,
            display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8,
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span className={`${PREFIX}-pulse`} style={{ fontSize:16 }}>🚨</span>
              <span style={{ fontFamily:"DM Sans", fontWeight:700, fontSize:13, color:T.red }}>
                {escalating.length} critical result{escalating.length > 1 ? "s" : ""} unacknowledged for over 1 hour — immediate action required
              </span>
            </div>
            <button onClick={() => { setFilter("escalate"); setTypeFilter("all"); }} style={{
              fontFamily:"DM Sans", fontWeight:700, fontSize:11,
              padding:"5px 12px", borderRadius:8, cursor:"pointer",
              border:`1px solid ${T.red}45`, background:`${T.red}15`, color:T.red,
            }}>View Escalating →</button>
          </div>
        )}

        {/* Filters */}
        <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:8 }}>
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{
              fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700,
              padding:"4px 11px", borderRadius:20, cursor:"pointer",
              textTransform:"uppercase", letterSpacing:.8, transition:"all .12s",
              border:`1px solid ${filter===f.id ? f.color+"66" : f.color+"22"}`,
              background: filter===f.id ? `${f.color}16` : `${f.color}05`,
              color: filter===f.id ? f.color : T.txt3,
              display:"flex", alignItems:"center", gap:5,
            }}>
              {f.label}
              {f.count > 0 && (
                <span style={{
                  background: filter===f.id ? f.color : `${f.color}30`,
                  color: filter===f.id ? "#050f1e" : f.color,
                  borderRadius:10, padding:"0px 5px",
                  fontFamily:"JetBrains Mono", fontSize:8,
                }}>{f.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Type + Sort controls */}
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:14, alignItems:"center" }}>
          <div style={{ display:"flex", gap:4, flex:1, flexWrap:"wrap" }}>
            {TYPE_FILTERS.map(f => (
              <button key={f.id} onClick={() => setTypeFilter(f.id)} style={{
                fontFamily:"DM Sans", fontWeight:600, fontSize:10,
                padding:"3px 10px", borderRadius:20, cursor:"pointer",
                border:`1px solid ${typeFilter===f.id ? T.teal+"50" : "rgba(42,79,122,0.3)"}`,
                background: typeFilter===f.id ? `${T.teal}10` : "transparent",
                color: typeFilter===f.id ? T.teal : T.txt4, transition:"all .1s",
              }}>{f.label}</button>
            ))}
          </div>
          <div style={{ display:"flex", gap:4 }}>
            {[
              { id:"oldest", label:"Oldest First" },
              { id:"newest", label:"Newest First" },
              { id:"room",   label:"By Room"      },
            ].map(s => (
              <button key={s.id} onClick={() => setSortMode(s.id)} style={{
                fontFamily:"DM Sans", fontWeight:600, fontSize:10,
                padding:"3px 10px", borderRadius:20, cursor:"pointer",
                border:`1px solid ${sortMode===s.id ? T.blue+"50" : "rgba(42,79,122,0.3)"}`,
                background: sortMode===s.id ? `${T.blue}10` : "transparent",
                color: sortMode===s.id ? T.blue : T.txt4, transition:"all .1s",
              }}>{s.label}</button>
            ))}
          </div>
        </div>

        {/* My provider pill */}
        {filter === "mine" && (
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12, flexWrap:"wrap" }}>
            <span style={{ fontFamily:"JetBrains Mono", fontSize:8, color:T.txt4, letterSpacing:1.5, textTransform:"uppercase" }}>Viewing as:</span>
            {[...new Set(patients.map(p => p.provider).filter(Boolean))].sort().map(pv => (
              <button key={pv} onClick={() => setMyProvider(pv)} style={{
                fontFamily:"DM Sans", fontWeight:600, fontSize:11,
                padding:"3px 11px", borderRadius:20, cursor:"pointer",
                border:`1px solid ${myProvider===pv ? T.blue+"55" : "rgba(42,79,122,0.35)"}`,
                background: myProvider===pv ? `${T.blue}12` : "transparent",
                color: myProvider===pv ? T.blue : T.txt3, transition:"all .1s",
              }}>{pv}</button>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{
            display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",
            gap:10, marginBottom:24,
          }}>
            {[...Array(6)].map((_, i) => <SkeletonCard key={i}/>)}
          </div>
        )}

        {/* Empty state */}
        {!loading && visible.length === 0 && (
          <div style={{
            ...glass, padding:"48px", textAlign:"center",
            display:"flex", flexDirection:"column", alignItems:"center", gap:10, marginBottom:24,
          }}>
            <span style={{ fontSize:36 }}>
              {filter === "unacked" ? "✅" : filter === "acked" ? "📋" : "🔬"}
            </span>
            <span style={{ fontFamily:"DM Sans", fontSize:15, color:T.txt2, fontWeight:700 }}>
              {filter === "unacked" ? "All criticals acknowledged" : "No results"}
            </span>
            <span style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt4 }}>
              {filter === "unacked"
                ? "No pending critical results — great work."
                : "No results match the current filter."}
            </span>
          </div>
        )}

        {/* Result grid */}
        {!loading && visible.length > 0 && (
          <div style={{
            display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",
            gap:10, marginBottom:24,
          }}>
            {visible.map(r => (
              <ResultCard
                key={r.id}
                result={r}
                patient={r._patient}
                now={now}
                onOpen={() => setModal({ result:r, patient:r._patient })}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign:"center", paddingBottom:24 }}>
          <span style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.txt4, letterSpacing:1.5 }}>
            NOTRYA · CRITICAL RESULTS INBOX · PATIENT SAFETY TOOL · ALL PROVIDERS
          </span>
        </div>

      </div>
    </div>
  );
}