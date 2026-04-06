import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Patient, ClinicalResult, Order, ClinicalNote,
  DispositionRecord, ShiftHandoff, HandoffEntry,
} from "@/api/entities";
import { InvokeLLM } from "@/integrations/Core";

const PREFIX = "sox";

(() => {
  const id = `${PREFIX}-fonts`;
  if (document.getElementById(id)) return;
  const l = document.createElement("link");
  l.id = id; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = `${PREFIX}-css`;
  s.textContent = `
    * { box-sizing:border-box; margin:0; padding:0; }
    ::-webkit-scrollbar { width:3px; } ::-webkit-scrollbar-track { background:transparent; }
    ::-webkit-scrollbar-thumb { background:rgba(42,79,122,.5); border-radius:2px; }
    @keyframes ${PREFIX}fade  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
    @keyframes ${PREFIX}shim  { 0%,100%{background-position:-200% center} 50%{background-position:200% center} }
    @keyframes ${PREFIX}pulse { 0%,100%{opacity:1} 50%{opacity:.28} }
    @keyframes ${PREFIX}think { 0%{opacity:.3;transform:scale(.9)} 50%{opacity:1;transform:scale(1)} 100%{opacity:.3;transform:scale(.9)} }
    @keyframes ${PREFIX}orb0  { 0%,100%{transform:translate(-50%,-50%) scale(1)}    50%{transform:translate(-50%,-50%) scale(1.1)} }
    @keyframes ${PREFIX}orb1  { 0%,100%{transform:translate(-50%,-50%) scale(1.07)} 50%{transform:translate(-50%,-50%) scale(.92)} }
    @keyframes ${PREFIX}check { 0%{transform:scale(.5);opacity:0} 60%{transform:scale(1.15)} 100%{transform:scale(1);opacity:1} }
    .${PREFIX}-fade  { animation:${PREFIX}fade  .22s ease both; }
    .${PREFIX}-pulse { animation:${PREFIX}pulse 1.8s ease-in-out infinite; }
    .${PREFIX}-think { animation:${PREFIX}think 1.2s ease-in-out infinite; }
    .${PREFIX}-check { animation:${PREFIX}check .3s ease both; }
    .${PREFIX}-shim  {
      background:linear-gradient(90deg,#f2f7ff 0%,#fff 20%,#00e5c0 45%,#f5c842 70%,#f2f7ff 100%);
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
  background:"rgba(8,22,40,0.82)", border:"1px solid rgba(42,79,122,0.35)", borderRadius:14,
};

const CONV_CFG = {
  complete:  { color:T.teal,  icon:"✓", label:"COMPLETE"   },
  converging:{ color:T.green, icon:"→", label:"CONVERGING"  },
  developing:{ color:T.gold,  icon:"◎", label:"DEVELOPING"  },
  fragmented:{ color:T.red,   icon:"⚡", label:"FRAGMENTED"  },
};

// ── HELPERS ───────────────────────────────────────────────────────────
function minsAgo(iso) {
  if (!iso) return null;
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
}
function fmtElapsed(m) {
  if (m === null || m === undefined) return "—";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60); const r = m % 60;
  return r ? `${h}h ${r}m` : `${h}h`;
}
function fmtTs(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
}
function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString([], { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" });
}

function convState(patient, orders, results, notes, dispos) {
  const note  = notes.find(n => n.patient === patient.id);
  const dispo = dispos.find(d => d.patient === patient.id);
  const ptRes = results.filter(r => r.patient === patient.id);
  const ptOrd = orders.filter(o => o.patient === patient.id);
  const mins  = minsAgo(patient.arrived_at);
  if (dispo?.dispo_status === "complete" || dispo?.dispo_status === "ready") return "complete";
  if (ptRes.some(r => r.flag === "critical" && !r.acknowledged)) return "fragmented";
  if (!note?.assessment && mins > 120) return "fragmented";
  if (ptOrd.some(o => o.status === "pending" && o.urgency === "stat")) return "developing";
  if (!note?.assessment) return "developing";
  return note?.signed ? "converging" : "developing";
}

function buildIpassContext(patient, orders, results, notes, dispos) {
  const note  = notes.find(n => n.patient === patient.id);
  const dispo = dispos.find(d => d.patient === patient.id);
  const ptRes = results.filter(r => r.patient === patient.id);
  const ptOrd = orders.filter(o => o.patient === patient.id);
  const pending = ptOrd.filter(o => o.status === "pending");
  const crits   = ptRes.filter(r => r.flag === "critical");

  return [
    `${patient.age}${patient.sex} Rm ${patient.room} | CC: ${patient.cc} | ${fmtElapsed(minsAgo(patient.arrived_at))} in ED`,
    note?.hpi        ? `HPI: ${note.hpi}`               : "",
    note?.assessment ? `ASSESSMENT: ${note.assessment}` : "",
    note?.plan       ? `PLAN: ${note.plan}`              : "",
    crits.length     ? `CRITICAL RESULTS: ${crits.map(r => `${r.name} ${r.value}${r.unit?" "+r.unit:""}${!r.acknowledged?" [UNACKED]":""}`).join(", ")}` : "",
    pending.length   ? `PENDING: ${pending.map(o => `${o.name} (${o.urgency})`).join(", ")}` : "",
    dispo            ? `DISPO: ${(dispo.dispo_type||"undecided").toUpperCase()} — ${(dispo.dispo_status||"").toUpperCase()}${dispo.destination?" → "+dispo.destination:""}` : "DISPO: Not decided",
  ].filter(Boolean).join("\n");
}

// ══════════════════════════════════════════════════════════════════════
//  MODULE-SCOPE PRIMITIVES
// ══════════════════════════════════════════════════════════════════════

function AmbientBg() {
  return (
    <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0 }}>
      {[
        { l:"12%", t:"20%", r:300, c:"rgba(0,229,192,0.045)",  a:0 },
        { l:"88%", t:"12%", r:260, c:"rgba(245,200,66,0.04)",  a:1 },
        { l:"70%", t:"76%", r:310, c:"rgba(59,158,255,0.038)", a:0 },
        { l:"20%", t:"80%", r:240, c:"rgba(155,109,255,0.035)",a:1 },
      ].map((o,i) => (
        <div key={i} style={{
          position:"absolute", left:o.l, top:o.t, width:o.r*2, height:o.r*2,
          borderRadius:"50%", background:`radial-gradient(circle,${o.c} 0%,transparent 68%)`,
          transform:"translate(-50%,-50%)",
          animation:`${PREFIX}orb${o.a} ${9+i*1.4}s ease-in-out infinite`,
        }}/>
      ))}
    </div>
  );
}

function Toast({ msg, err }) {
  return (
    <div style={{
      position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)",
      background:"rgba(8,22,40,0.96)", borderRadius:10, padding:"10px 20px",
      border:`1px solid ${err ? T.red+"55" : T.teal+"45"}`,
      fontFamily:"DM Sans", fontWeight:600, fontSize:13,
      color:err ? T.coral : T.teal, zIndex:9999, pointerEvents:"none",
      animation:`${PREFIX}fade .2s ease both`,
    }}>{msg}</div>
  );
}

function ThinkDots() {
  return (
    <div style={{ display:"flex", gap:4, alignItems:"center" }}>
      {[0,1,2].map(i => (
        <div key={i} className={`${PREFIX}-think`} style={{ width:5, height:5, borderRadius:"50%", background:T.gold, animationDelay:`${i*.2}s` }}/>
      ))}
    </div>
  );
}

function Chip({ label, color, small, pulse }) {
  return (
    <span className={pulse ? `${PREFIX}-pulse` : ""} style={{
      fontFamily:"JetBrains Mono", fontSize:small?7:8, fontWeight:700,
      padding: small ? "1px 6px" : "2px 8px", borderRadius:20, display:"inline-flex", alignItems:"center",
      background:`${color}18`, border:`1px solid ${color}40`, color, flexShrink:0,
    }}>{label}</span>
  );
}

function IField({ label, value, onChange, placeholder, multiline, rows }) {
  const base = {
    background:"rgba(14,37,68,0.8)", borderRadius:8, padding:"8px 11px",
    fontFamily:"DM Sans", fontSize:12, color:T.txt, outline:"none", width:"100%",
    border:`1px solid ${value ? "rgba(0,229,192,0.28)" : "rgba(42,79,122,0.4)"}`,
    transition:"border-color .12s", lineHeight:1.55,
  };
  return (
    <div>
      {label && (
        <div style={{ fontFamily:"JetBrains Mono", fontSize:7, fontWeight:700, color:T.txt4, letterSpacing:1.5, textTransform:"uppercase", marginBottom:4 }}>
          {label}
        </div>
      )}
      {multiline
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows||3} style={{ ...base, resize:"vertical" }}/>
        : <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={base}/>
      }
    </div>
  );
}

// ── Handoff Patient Card (Outgoing) ───────────────────────────────────
function OutgoingCard({ patient, entry, conv, onWorry, onWorryReason, onIpassChange, onGenerate, generating }) {
  const cc     = CONV_CFG[conv] || CONV_CFG.developing;
  const mins   = minsAgo(patient.arrived_at);
  const isAcked = !!entry?.acknowledged_at;

  return (
    <div className={`${PREFIX}-fade`} style={{
      ...glass, overflow:"hidden",
      border:"1px solid rgba(42,79,122,0.3)",
      borderLeft:`3px solid ${entry?.worry ? T.red : cc.color}`,
      background: entry?.worry
        ? `linear-gradient(135deg,${T.red}0a,rgba(8,22,40,0.82))`
        : "rgba(8,22,40,0.82)",
    }}>
      {/* Card header */}
      <div style={{ padding:"10px 13px 8px", display:"flex", alignItems:"flex-start", gap:10, justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"baseline", gap:8 }}>
          <span style={{ fontFamily:"JetBrains Mono", fontWeight:700, fontSize:22, color:entry?.worry ? T.red : cc.color, lineHeight:1 }}>
            {patient.room}
          </span>
          <div>
            <div style={{ fontFamily:"DM Sans", fontWeight:700, fontSize:13, color:T.txt, lineHeight:1.2 }}>{patient.cc}</div>
            <div style={{ fontFamily:"DM Sans", fontSize:9, color:T.txt4 }}>{patient.age}{patient.sex} · {fmtElapsed(mins)} in ED · {patient.provider}</div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
          <Chip label={`${cc.icon} ${cc.label}`} color={cc.color} small/>
          {/* Worry toggle */}
          <button onClick={onWorry} style={{
            fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700,
            padding:"3px 9px", borderRadius:20, cursor:"pointer",
            border:`1px solid ${entry?.worry ? T.red+"55" : "rgba(42,79,122,0.4)"}`,
            background: entry?.worry ? `${T.red}18` : "transparent",
            color: entry?.worry ? T.red : T.txt4,
            transition:"all .12s",
          }}>{entry?.worry ? "🚩 WORRIED" : "+ Flag"}</button>
        </div>
      </div>

      {/* Worry reason */}
      {entry?.worry && (
        <div style={{ padding:"0 13px 8px" }}>
          <IField
            placeholder="Reason for concern (e.g. hemodynamically borderline, diagnosis uncertain...)"
            value={entry.worry_reason || ""}
            onChange={onWorryReason}
          />
        </div>
      )}

      {/* I-PASS section */}
      <div style={{ borderTop:"1px solid rgba(42,79,122,0.22)", padding:"9px 13px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
          <div style={{ fontFamily:"JetBrains Mono", fontSize:7, fontWeight:700, color:T.gold, letterSpacing:1.5, textTransform:"uppercase" }}>
            I-PASS Handoff
          </div>
          <button onClick={onGenerate} disabled={generating} style={{
            fontFamily:"DM Sans", fontWeight:700, fontSize:9, padding:"3px 9px",
            borderRadius:6, cursor:generating?"not-allowed":"pointer",
            border:`1px solid ${T.gold}35`, background:`${T.gold}0e`, color:T.gold,
            opacity:generating?.6:1,
          }}>
            {generating ? "Generating..." : entry?.ipass ? "↺ Regenerate" : "🤖 Generate"}
          </button>
        </div>

        {generating ? (
          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 0" }}>
            <ThinkDots/>
            <span style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt4 }}>Synthesizing handoff...</span>
          </div>
        ) : entry?.ipass ? (
          <textarea
            value={entry.ipass}
            onChange={e => onIpassChange(e.target.value)}
            rows={7}
            style={{
              background:"rgba(14,37,68,0.7)", border:"1px solid rgba(42,79,122,0.28)",
              borderRadius:8, padding:"9px 11px", fontFamily:"DM Sans", fontSize:12,
              color:T.txt, outline:"none", width:"100%", resize:"vertical", lineHeight:1.65,
            }}
          />
        ) : (
          <div style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt4, fontStyle:"italic", padding:"4px 0" }}>
            Click Generate to create the I-PASS handoff for this patient
          </div>
        )}
      </div>
    </div>
  );
}

// ── Handoff Patient Card (Incoming) ───────────────────────────────────
function IncomingCard({ patient, entry, conv, onAck, ackName }) {
  const cc    = CONV_CFG[conv] || CONV_CFG.developing;
  const acked = !!entry?.acknowledged_at;
  const [open, setOpen] = useState(!acked);

  return (
    <div className={`${PREFIX}-fade`} style={{
      ...glass, overflow:"hidden",
      border:"1px solid rgba(42,79,122,0.3)",
      borderLeft:`3px solid ${acked ? T.green : entry?.worry ? T.red : cc.color}`,
      opacity: acked ? 0.75 : 1,
    }}>
      {/* Header row */}
      <div onClick={() => setOpen(p => !p)} style={{
        padding:"10px 13px 8px", display:"flex", alignItems:"center", gap:10, cursor:"pointer",
      }}>
        <span style={{ fontFamily:"JetBrains Mono", fontWeight:700, fontSize:20, color:acked?T.green:entry?.worry?T.red:cc.color, lineHeight:1 }}>
          {patient.room}
        </span>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:"DM Sans", fontWeight:700, fontSize:13, color:T.txt }}>{patient.cc}</div>
          <div style={{ fontFamily:"DM Sans", fontSize:9, color:T.txt4 }}>{patient.age}{patient.sex} · {patient.provider} · {fmtElapsed(minsAgo(patient.arrived_at))} in ED</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
          {entry?.worry && <Chip label="🚩 WORRY" color={T.red} small/>}
          <Chip label={`${cc.icon} ${cc.label}`} color={cc.color} small/>
          {acked
            ? <Chip label="✓ RECEIVED" color={T.green} small/>
            : <span style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.txt4 }}>{open?"▲":"▼"}</span>
          }
        </div>
      </div>

      {open && !acked && (
        <div className={`${PREFIX}-fade`} style={{ borderTop:"1px solid rgba(42,79,122,0.22)" }}>
          {/* Worry reason */}
          {entry?.worry && entry.worry_reason && (
            <div style={{ padding:"8px 13px", background:`${T.red}09` }}>
              <div style={{ fontFamily:"JetBrains Mono", fontSize:7, fontWeight:700, color:T.red, letterSpacing:1.5, textTransform:"uppercase", marginBottom:3 }}>
                Outgoing Provider — Concerned
              </div>
              <div style={{ fontFamily:"DM Sans", fontSize:12, color:T.coral }}>{entry.worry_reason}</div>
            </div>
          )}

          {/* I-PASS */}
          <div style={{ padding:"9px 13px" }}>
            <div style={{ fontFamily:"JetBrains Mono", fontSize:7, fontWeight:700, color:T.gold, letterSpacing:1.5, textTransform:"uppercase", marginBottom:6 }}>
              I-PASS Handoff
            </div>
            {entry?.ipass ? (
              <pre style={{
                fontFamily:"DM Sans", fontSize:12, color:T.txt, lineHeight:1.7,
                whiteSpace:"pre-wrap", background:"rgba(14,37,68,0.5)",
                padding:"10px 12px", borderRadius:8, marginBottom:10,
                border:"1px solid rgba(42,79,122,0.2)",
              }}>{entry.ipass}</pre>
            ) : (
              <div style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt4, fontStyle:"italic", marginBottom:10 }}>
                No handoff generated for this patient
              </div>
            )}
            <button onClick={onAck} style={{
              width:"100%", fontFamily:"DM Sans", fontWeight:700, fontSize:12,
              padding:"10px", borderRadius:9, cursor:"pointer",
              border:`1px solid ${T.green}45`, background:`${T.green}10`, color:T.green,
            }}>✅ I've Read This — Acknowledge</button>
          </div>
        </div>
      )}

      {acked && (
        <div style={{ padding:"5px 13px 8px", fontFamily:"DM Sans", fontSize:10, color:T.txt4 }}>
          Acknowledged by {entry.acknowledged_by || ackName} at {fmtTs(entry.acknowledged_at)}
        </div>
      )}
    </div>
  );
}

// ── Handoff Log Entry ─────────────────────────────────────────────────
function HandoffLogCard({ handoff }) {
  const dur = handoff.completed_at && handoff.started_at
    ? Math.round((new Date(handoff.completed_at) - new Date(handoff.started_at)) / 60000)
    : null;

  return (
    <div style={{
      ...glass, padding:"12px 14px",
      borderLeft:`3px solid ${handoff.status==="complete" ? T.green : T.gold}`,
    }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
        <div>
          <div style={{ fontFamily:"DM Sans", fontWeight:700, fontSize:13, color:T.txt, marginBottom:2 }}>
            {handoff.outgoing_provider} → {handoff.incoming_provider || "Pending"}
          </div>
          <div style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt4 }}>
            {fmtDate(handoff.started_at)}
            {dur ? ` · ${fmtElapsed(dur)} duration` : ""}
          </div>
        </div>
        <Chip label={handoff.status === "complete" ? "COMPLETE" : "IN PROGRESS"} color={handoff.status==="complete" ? T.green : T.gold}/>
      </div>
      {handoff.shift_notes && (
        <div style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt3, lineHeight:1.55, marginTop:6, fontStyle:"italic" }}>
          "{handoff.shift_notes}"
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
//  MAIN EXPORT
// ══════════════════════════════════════════════════════════════════════

export default function ShiftSignOut({ onBack, onNavigate, currentProvider }) {
  // ── Core data ─────────────────────────────────────────────────────
  const [patients,  setPatients]  = useState([]);
  const [orders,    setOrders]    = useState([]);
  const [results,   setResults]   = useState([]);
  const [notes,     setNotes]     = useState([]);
  const [dispos,    setDispos]    = useState([]);
  const [handoffs,  setHandoffs]  = useState([]);
  const [loading,   setLoading]   = useState(true);

  // ── UI state ──────────────────────────────────────────────────────
  const [phase,       setPhase]       = useState("setup"); // setup|outgoing|incoming|complete|log
  const [role,        setRole]        = useState("");      // "out"|"in"
  const [myName,      setMyName]      = useState(currentProvider || "");
  const [otherName,   setOtherName]   = useState("");
  const [shiftNotes,  setShiftNotes]  = useState("");
  const [activeHandoff, setActiveHandoff] = useState(null);
  const [entries,     setEntries]     = useState({}); // patientId → {ipass,worry,worry_reason,acknowledged_at,acknowledged_by}
  const [generating,  setGenerating]  = useState({}); // patientId → bool
  const [generatingAll, setGeneratingAll] = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [toast,       setToast]       = useState({ msg:"", err:false });

  function showToast(msg, err = false) { setToast({ msg, err }); setTimeout(() => setToast({ msg:"", err:false }), 2400); }

  // ── Fetch ─────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      const [pts, ords, res, nts, dps, hoffs] = await Promise.all([
        Patient.list(), Order.list(), ClinicalResult.list(),
        ClinicalNote.list(), DispositionRecord.list(), ShiftHandoff.list(),
      ]);
      setPatients(pts || []); setOrders(ords || []); setResults(res || []);
      setNotes(nts || []); setDispos(dps || []);
      setHandoffs((hoffs || []).sort((a, b) => new Date(b.started_at) - new Date(a.started_at)));
    } catch { showToast("Error loading data", true); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Enriched data ─────────────────────────────────────────────────
  const myPatients = useMemo(() =>
    patients
      .filter(p => role === "out" ? p.provider === myName : true)
      .sort((a, b) => {
        // Worry flag patients first, then by convergence
        const wa = entries[a.id]?.worry ? 0 : 1;
        const wb = entries[b.id]?.worry ? 0 : 1;
        if (wa !== wb) return wa - wb;
        const rank = { fragmented:0, developing:1, converging:2, complete:3 };
        const ca = convState(a, orders, results, notes, dispos);
        const cb = convState(b, orders, results, notes, dispos);
        return (rank[ca] ?? 2) - (rank[cb] ?? 2);
      }),
  [patients, orders, results, notes, dispos, role, myName, entries]);

  const incomingPatients = useMemo(() => {
    if (!activeHandoff) return [];
    return patients.filter(p => p.provider === activeHandoff.outgoing_provider);
  }, [patients, activeHandoff]);

  const convMap = useMemo(() => {
    const m = {};
    patients.forEach(p => { m[p.id] = convState(p, orders, results, notes, dispos); });
    return m;
  }, [patients, orders, results, notes, dispos]);

  const stats = useMemo(() => ({
    total:    myPatients.length,
    worried:  myPatients.filter(p => entries[p.id]?.worry).length,
    generated:myPatients.filter(p => entries[p.id]?.ipass).length,
    acked:    Object.values(entries).filter(e => e.acknowledged_at).length,
  }), [myPatients, entries]);

  // ── Entry helpers ─────────────────────────────────────────────────
  function updateEntry(patientId, patch) {
    setEntries(prev => ({ ...prev, [patientId]: { ...(prev[patientId] || {}), ...patch } }));
  }

  // ── AI: generate one I-PASS ───────────────────────────────────────
  async function generateOne(patient) {
    setGenerating(prev => ({ ...prev, [patient.id]: true }));
    try {
      const ctx = buildIpassContext(patient, orders, results, notes, dispos);
      const raw = await InvokeLLM({
        prompt: `You are an emergency medicine attending signing out to the incoming provider. Generate a structured I-PASS handoff for this patient.

${ctx}

Format as plain text with these exact headers:
**I — ILLNESS SEVERITY:** [Critical / Unstable / Stable / Good]
**P — PATIENT SUMMARY:** [2-3 sentence narrative of who this patient is and where they are in their workup]
**A — ACTION LIST:**
  1. [Specific pending task — who is responsible]
  2. [Next step needed]
**S — SITUATION AWARENESS:**
  - If [specific trigger]: [specific action for the incoming provider]
  - If [specific trigger]: [specific action]
**S — SYNTHESIS:** [One sentence — the single most important thing the incoming provider needs to know]

Be specific, use actual lab values and room numbers. Keep it to what a colleague needs to take safe care of this patient for the next 4 hours.`,
        add_context_from_previous_calls: false,
      });
      const text = typeof raw === "string" ? raw : raw?.content || "";
      updateEntry(patient.id, { ipass: text.trim() });
    } catch { showToast(`Failed to generate for Rm ${patient.room}`, true); }
    finally { setGenerating(prev => ({ ...prev, [patient.id]: false })); }
  }

  // ── AI: generate all ──────────────────────────────────────────────
  async function generateAll() {
    setGeneratingAll(true);
    for (const pt of myPatients) {
      if (!entries[pt.id]?.ipass) await generateOne(pt);
    }
    setGeneratingAll(false);
    showToast("All handoffs generated");
  }

  // ── Start handoff (save to entity) ────────────────────────────────
  async function startHandoff() {
    if (!myName.trim()) { showToast("Enter your name", true); return; }
    setSaving(true);
    try {
      const record = await ShiftHandoff.create({
        outgoing_provider: role === "out" ? myName : otherName,
        incoming_provider: role === "in"  ? myName : otherName,
        started_at: new Date().toISOString(),
        shift_notes: shiftNotes,
        status: "active",
      });
      setActiveHandoff(record);
      setPhase(role === "out" ? "outgoing" : "incoming");
    } catch { showToast("Error starting handoff", true); }
    finally { setSaving(false); }
  }

  // ── Complete handoff (outgoing) ───────────────────────────────────
  async function completeHandoff() {
    if (!activeHandoff) return;
    setSaving(true);
    try {
      // Save all entries
      await Promise.all(myPatients.map(pt => {
        const e = entries[pt.id] || {};
        return HandoffEntry.create({
          handoff_record:   activeHandoff.id,
          patient:          pt.id,
          ipass:            e.ipass || "",
          worry:            e.worry || false,
          worry_reason:     e.worry_reason || "",
          pending_items:    "",
          acknowledged:     false,
        });
      }));
      await ShiftHandoff.update(activeHandoff.id, { status:"pending_ack", completed_at: new Date().toISOString() });
      setPhase("complete");
      showToast("Handoff sent");
    } catch { showToast("Error completing handoff", true); }
    finally { setSaving(false); }
  }

  // ── Acknowledge one patient (incoming) ───────────────────────────
  async function acknowledgeOne(patientId) {
    updateEntry(patientId, { acknowledged_at: new Date().toISOString(), acknowledged_by: myName });
    // Try to persist if activeHandoff exists
    if (activeHandoff) {
      try {
        const allEntries = await HandoffEntry.filter({ handoff_record: activeHandoff.id, patient: patientId });
        if (allEntries?.length) {
          await HandoffEntry.update(allEntries[0].id, {
            acknowledged:    true,
            acknowledged_at: new Date().toISOString(),
            acknowledged_by: myName,
          });
        }
      } catch { /* persist best-effort */ }
    }
  }

  // ── Copy full handoff to clipboard ───────────────────────────────
  function copyAll() {
    const lines = [
      `SHIFT HANDOFF — ${new Date().toLocaleString()}`,
      `FROM: ${role==="out" ? myName : otherName}  →  TO: ${role==="in" ? myName : otherName}`,
      shiftNotes ? `\nSHIFT NOTES: ${shiftNotes}` : "",
      "",
      ...myPatients.map(pt => {
        const e = entries[pt.id] || {};
        return [
          `${"─".repeat(48)}`,
          `ROOM ${pt.room} — ${pt.cc} — ${pt.age}${pt.sex}${e.worry ? " 🚩 WORRIED" : ""}`,
          e.worry_reason ? `CONCERN: ${e.worry_reason}` : "",
          e.ipass || "(No handoff generated)",
          "",
        ].filter(Boolean).join("\n");
      }),
    ].join("\n");

    if (navigator.clipboard) navigator.clipboard.writeText(lines).then(() => showToast("Handoff copied to clipboard"));
    else showToast("Select text manually to copy");
  }

  // ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ background:T.bg, minHeight:"100vh", color:T.txt, fontFamily:"DM Sans, sans-serif", position:"relative", overflowX:"hidden" }}>
      <AmbientBg/>
      {toast.msg && <Toast msg={toast.msg} err={toast.err}/>}

      <div style={{ position:"relative", zIndex:1, maxWidth:900, margin:"0 auto", padding:"0 16px" }}>

        {/* ── HEADER ────────────────────────────────────────────── */}
        <div style={{ padding:"16px 0 12px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
              <span style={{ fontFamily:"JetBrains Mono", fontSize:10, color:T.gold, letterSpacing:3 }}>NOTRYA</span>
              <span style={{ color:T.txt4, fontFamily:"JetBrains Mono", fontSize:10 }}>/</span>
              <span style={{ fontFamily:"JetBrains Mono", fontSize:10, color:T.gold, letterSpacing:2 }}>SHIFT SIGN-OUT</span>
            </div>
            <h1 className={`${PREFIX}-shim`} style={{ fontFamily:"Playfair Display", fontWeight:900, fontSize:"clamp(22px,3.5vw,34px)", letterSpacing:-1, lineHeight:1.05 }}>
              {phase === "setup"    ? "Start Handoff"
               : phase === "outgoing" ? `Signing Out — ${myName}`
               : phase === "incoming" ? `Taking Over — ${myName}`
               : phase === "complete" ? "Handoff Complete"
               : "Handoff Log"}
            </h1>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            {phase !== "setup" && (
              <button onClick={() => { setPhase("setup"); setActiveHandoff(null); }} style={{
                fontFamily:"DM Sans", fontWeight:600, fontSize:11, padding:"5px 12px",
                borderRadius:8, cursor:"pointer", border:"1px solid rgba(42,79,122,0.5)",
                background:"rgba(14,37,68,0.6)", color:T.txt3,
              }}>← Restart</button>
            )}
            <button onClick={() => setPhase("log")} style={{
              fontFamily:"DM Sans", fontWeight:600, fontSize:11, padding:"5px 12px",
              borderRadius:8, cursor:"pointer", border:"1px solid rgba(42,79,122,0.5)",
              background:"rgba(14,37,68,0.6)", color:T.txt3,
            }}>📋 Log</button>
            {onBack && (
              <button onClick={onBack} style={{
                fontFamily:"DM Sans", fontWeight:600, fontSize:11, padding:"5px 12px",
                borderRadius:8, cursor:"pointer", border:"1px solid rgba(42,79,122,0.5)",
                background:"rgba(14,37,68,0.6)", color:T.txt3,
              }}>← Home</button>
            )}
          </div>
        </div>

        {/* ═══ SETUP PHASE ══════════════════════════════════════ */}
        {phase === "setup" && (
          <div className={`${PREFIX}-fade`} style={{ display:"flex", flexDirection:"column", gap:14, maxWidth:500, margin:"0 auto", paddingBottom:40 }}>
            <p style={{ fontFamily:"DM Sans", fontSize:13, color:T.txt3, lineHeight:1.7, textAlign:"center" }}>
              Structured I-PASS handoff with AI-generated summaries, worry flags, and bilateral acknowledgment.
            </p>

            {/* Role selection */}
            <div style={{ ...glass, padding:"6px" }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:4 }}>
                {[
                  { id:"out", label:"I'm Signing Out", icon:"👋", color:T.gold },
                  { id:"in",  label:"I'm Taking Over", icon:"👋🏽", color:T.teal },
                ].map(r => (
                  <button key={r.id} onClick={() => setRole(r.id)} style={{
                    padding:"20px 16px", borderRadius:10, cursor:"pointer", textAlign:"center",
                    border:`1px solid ${role===r.id ? r.color+"55" : "transparent"}`,
                    background: role===r.id ? `${r.color}14` : "transparent",
                    display:"flex", flexDirection:"column", alignItems:"center", gap:10,
                    transition:"all .15s",
                  }}>
                    <span style={{ fontSize:28 }}>{r.icon}</span>
                    <span style={{ fontFamily:"DM Sans", fontWeight:700, fontSize:13, color:role===r.id ? r.color : T.txt3 }}>{r.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {role && (
              <div className={`${PREFIX}-fade`} style={{ ...glass, padding:"16px", display:"flex", flexDirection:"column", gap:12 }}>
                <IField
                  label="Your Name"
                  value={myName}
                  onChange={setMyName}
                  placeholder={role==="out" ? "Dr. Reyes" : "Dr. Chen"}
                />
                <IField
                  label={role==="out" ? "Incoming Provider (optional)" : "Outgoing Provider — search by name"}
                  value={otherName}
                  onChange={setOtherName}
                  placeholder={role==="out" ? "Dr. Chen" : "Dr. Reyes"}
                />
                {role === "out" && (
                  <IField
                    label="Shift Notes (optional)"
                    value={shiftNotes}
                    onChange={setShiftNotes}
                    placeholder="Anything the incoming provider should know about the department — waiting room status, system issues, resource constraints..."
                    multiline rows={3}
                  />
                )}
                <button onClick={startHandoff} disabled={!myName.trim() || saving} style={{
                  fontFamily:"DM Sans", fontWeight:800, fontSize:14, padding:"14px",
                  borderRadius:10, cursor:myName.trim()&&!saving?"pointer":"not-allowed",
                  border:`1px solid ${role==="out" ? T.gold : T.teal}50`,
                  background:`${role==="out" ? T.gold : T.teal}12`,
                  color:role==="out" ? T.gold : T.teal,
                  opacity:!myName.trim()||saving?.5:1,
                }}>
                  {saving ? "Starting..." : role==="out" ? "Start My Sign-Out →" : "View Incoming Patients →"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ═══ OUTGOING PHASE ═══════════════════════════════════ */}
        {phase === "outgoing" && (
          <div className={`${PREFIX}-fade`} style={{ paddingBottom:40 }}>
            {/* Stats + actions bar */}
            <div style={{ ...glass, padding:"10px 14px", marginBottom:12, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
              <div style={{ display:"flex", gap:16 }}>
                {[
                  { v:stats.total,     label:"Patients",   color:T.teal  },
                  { v:stats.worried,   label:"Flagged",     color:T.red,   pulse:stats.worried>0 },
                  { v:stats.generated, label:"Handoffs",    color:T.gold  },
                ].map(s => (
                  <div key={s.label}>
                    <div className={s.pulse?`${PREFIX}-pulse`:""} style={{ fontFamily:"JetBrains Mono", fontWeight:700, fontSize:18, color:s.color, lineHeight:1 }}>{s.v}</div>
                    <div style={{ fontFamily:"DM Sans", fontSize:9, color:T.txt4, marginTop:1 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ display:"flex", gap:7 }}>
                <button onClick={generateAll} disabled={generatingAll} style={{
                  fontFamily:"DM Sans", fontWeight:700, fontSize:11, padding:"7px 14px",
                  borderRadius:8, cursor:"pointer", border:`1px solid ${T.gold}40`,
                  background:`${T.gold}0e`, color:T.gold,
                  opacity:generatingAll?.6:1,
                }}>{generatingAll ? "Generating..." : "🤖 Generate All"}</button>
                <button onClick={copyAll} style={{
                  fontFamily:"DM Sans", fontWeight:600, fontSize:11, padding:"7px 12px",
                  borderRadius:8, cursor:"pointer", border:"1px solid rgba(42,79,122,0.4)",
                  background:"transparent", color:T.txt3,
                }}>📋 Copy All</button>
              </div>
            </div>

            {/* Shift notes display */}
            {shiftNotes && (
              <div style={{
                ...glass, padding:"9px 13px", marginBottom:12,
                borderLeft:`3px solid ${T.blue}`, background:`${T.blue}07`,
                fontFamily:"DM Sans", fontSize:12, color:T.txt2, fontStyle:"italic",
              }}>📌 {shiftNotes}</div>
            )}

            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {loading && [...Array(4)].map((_, i) => (
                <div key={i} style={{ ...glass, height:120, animation:`${PREFIX}pulse 1.8s ease-in-out ${i*.1}s infinite` }}/>
              ))}
              {!loading && myPatients.map(pt => (
                <OutgoingCard
                  key={pt.id}
                  patient={pt}
                  entry={entries[pt.id] || {}}
                  conv={convMap[pt.id] || "developing"}
                  onWorry={() => updateEntry(pt.id, { worry: !entries[pt.id]?.worry })}
                  onWorryReason={v => updateEntry(pt.id, { worry_reason: v })}
                  onIpassChange={v => updateEntry(pt.id, { ipass: v })}
                  onGenerate={() => generateOne(pt)}
                  generating={!!generating[pt.id]}
                />
              ))}
            </div>

            {/* Complete handoff */}
            {!loading && myPatients.length > 0 && (
              <div style={{ marginTop:16 }}>
                <button onClick={completeHandoff} disabled={saving} style={{
                  width:"100%", fontFamily:"DM Sans", fontWeight:800, fontSize:14,
                  padding:"15px", borderRadius:11, cursor:"pointer",
                  border:`1px solid ${T.green}50`, background:`${T.green}12`, color:T.green,
                  opacity:saving?.6:1,
                }}>{saving ? "Sending..." : `✅ Complete Sign-Out — ${myPatients.length} Patients`}</button>
              </div>
            )}
          </div>
        )}

        {/* ═══ INCOMING PHASE ═══════════════════════════════════ */}
        {phase === "incoming" && (
          <div className={`${PREFIX}-fade`} style={{ paddingBottom:40 }}>
            <div style={{ ...glass, padding:"10px 14px", marginBottom:12, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
              <div style={{ display:"flex", gap:16 }}>
                {[
                  { v:incomingPatients.length, label:"Total",       color:T.teal  },
                  { v:incomingPatients.filter(p=>entries[p.id]?.worry).length, label:"Flagged", color:T.red },
                  { v:stats.acked,              label:"Acknowledged", color:T.green },
                ].map(s => (
                  <div key={s.label}>
                    <div style={{ fontFamily:"JetBrains Mono", fontWeight:700, fontSize:18, color:s.color, lineHeight:1 }}>{s.v}</div>
                    <div style={{ fontFamily:"DM Sans", fontSize:9, color:T.txt4, marginTop:1 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              {stats.acked === incomingPatients.length && incomingPatients.length > 0 && (
                <Chip label="✓ ALL RECEIVED" color={T.green}/>
              )}
            </div>

            {activeHandoff?.shift_notes && (
              <div style={{ ...glass, padding:"9px 13px", marginBottom:12, borderLeft:`3px solid ${T.blue}`, background:`${T.blue}07`, fontFamily:"DM Sans", fontSize:12, color:T.txt2, fontStyle:"italic" }}>
                📌 Shift Note from {activeHandoff.outgoing_provider}: {activeHandoff.shift_notes}
              </div>
            )}

            <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
              {incomingPatients.map(pt => (
                <IncomingCard
                  key={pt.id}
                  patient={pt}
                  entry={entries[pt.id] || {}}
                  conv={convMap[pt.id] || "developing"}
                  onAck={() => acknowledgeOne(pt.id)}
                  ackName={myName}
                />
              ))}
              {incomingPatients.length === 0 && (
                <div style={{ ...glass, padding:"36px", textAlign:"center" }}>
                  <div style={{ fontFamily:"DM Sans", fontSize:13, color:T.txt4 }}>
                    No patients found for {activeHandoff?.outgoing_provider || otherName}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ COMPLETE PHASE ═══════════════════════════════════ */}
        {phase === "complete" && (
          <div className={`${PREFIX}-fade`} style={{ textAlign:"center", padding:"48px 24px" }}>
            <div className={`${PREFIX}-check`} style={{ fontSize:56, marginBottom:16 }}>✅</div>
            <div style={{ fontFamily:"Playfair Display", fontWeight:900, fontSize:32, color:T.green, marginBottom:8 }}>
              Handoff Complete
            </div>
            <div style={{ fontFamily:"DM Sans", fontSize:14, color:T.txt2, marginBottom:28, lineHeight:1.65 }}>
              {myPatients.length} patients handed off to {otherName || "incoming provider"}.<br/>
              The incoming provider will acknowledge each patient individually.
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, maxWidth:400, margin:"0 auto 28px" }}>
              {[
                { v:myPatients.length, label:"Patients",  color:T.teal  },
                { v:stats.worried,     label:"Flagged",    color:T.red   },
                { v:stats.generated,   label:"Handoffs",   color:T.gold  },
              ].map(s => (
                <div key={s.label} style={{ ...glass, padding:"12px", borderLeft:`3px solid ${s.color}` }}>
                  <div style={{ fontFamily:"JetBrains Mono", fontWeight:700, fontSize:22, color:s.color }}>{s.v}</div>
                  <div style={{ fontFamily:"DM Sans", fontSize:10, color:T.txt4, marginTop:2 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ display:"flex", gap:10, justifyContent:"center", flexWrap:"wrap" }}>
              <button onClick={copyAll} style={{
                fontFamily:"DM Sans", fontWeight:700, fontSize:13, padding:"11px 24px",
                borderRadius:9, cursor:"pointer", border:`1px solid ${T.teal}40`,
                background:`${T.teal}10`, color:T.teal,
              }}>📋 Copy Full Handoff</button>
              {onBack && (
                <button onClick={onBack} style={{
                  fontFamily:"DM Sans", fontWeight:600, fontSize:13, padding:"11px 20px",
                  borderRadius:9, cursor:"pointer", border:"1px solid rgba(42,79,122,0.5)",
                  background:"transparent", color:T.txt3,
                }}>← Command Center</button>
              )}
            </div>
          </div>
        )}

        {/* ═══ LOG PHASE ════════════════════════════════════════ */}
        {phase === "log" && (
          <div className={`${PREFIX}-fade`} style={{ paddingBottom:40 }}>
            <div style={{ fontFamily:"DM Sans", fontSize:13, color:T.txt3, marginBottom:16 }}>
              {handoffs.length} handoff{handoffs.length !== 1 ? "s" : ""} on record
            </div>
            {loading && <div style={{ ...glass, height:80, animation:`${PREFIX}pulse 1.8s ease-in-out infinite` }}/>}
            {!loading && handoffs.length === 0 && (
              <div style={{ ...glass, padding:"36px", textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:28 }}>📋</span>
                <div style={{ fontFamily:"DM Sans", fontSize:13, color:T.txt4 }}>No handoffs recorded yet</div>
              </div>
            )}
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {handoffs.map(h => <HandoffLogCard key={h.id} handoff={h}/>)}
            </div>
          </div>
        )}

        <div style={{ textAlign:"center", padding:"16px 0 24px" }}>
          <span style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.txt4, letterSpacing:1.5 }}>
            NOTRYA · SHIFT SIGN-OUT · PATIENT SAFETY TOOL
          </span>
        </div>

      </div>
    </div>
  );
}
