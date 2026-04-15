// TrackBoardView.jsx — Embeddable ED tracking board view
//
// A self-contained, reusable component that renders the live patient grid,
// stat tiles, filter tabs, and patient detail modal. Does NOT include the
// full page chrome (nav header, notification panel, ambient background) —
// those remain in the full TrackingBoard page.
//
// Use this when you want to embed a live patient grid inside another page
// (e.g. CommandCenter, PatientWorkspace, Dashboard).
//
// Props:
//   onOpenStudio  fn(patient) — called when user opens Note Studio for a patient
//   onNavigate    fn(path)    — used for quick-action navigation links
//   compact       bool        — renders smaller cards without quick-action buttons
//   maxHeight     string      — CSS max-height for the scrollable card grid
//   hideStats     bool        — hide the stat tiles row
//   hideHeader    bool        — hide "ED Tracking Board" title strip
//
// Constraints: straight quotes only, no localStorage, single react import

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { base44 } from "@/api/base44Client";

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:"#050f1e", txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", red:"#ff4444", coral:"#ff6b6b",
  green:"#3dffa0", blue:"#3b9eff", purple:"#9b6dff", orange:"#ff9f43",
};

const glass = {
  backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)",
  background:"rgba(8,22,40,0.75)", border:"1px solid rgba(42,79,122,0.35)",
  borderRadius:12,
};

const STATUS = {
  critical:{ label:"CRITICAL",  color:T.red    },
  results: { label:"RESULTS ▶", color:T.blue   },
  pending: { label:"PENDING",   color:T.gold   },
  stable:  { label:"STABLE",    color:T.teal   },
  waiting: { label:"WAITING",   color:T.txt4   },
};

const STATUS_RANK = { critical:0, results:1, pending:2, stable:3, waiting:4 };

// ── CSS injection (idempotent) ─────────────────────────────────────────────────
(() => {
  const id = "tbv-styles";
  if (document.getElementById(id)) return;
  const s = document.createElement("style");
  s.id = id;
  s.textContent = `
    @keyframes tbv-fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
    @keyframes tbv-pulse{0%,100%{opacity:1}50%{opacity:0.35}}
    @keyframes tbv-spin{to{transform:rotate(360deg)}}
    .tbv-fade{animation:tbv-fade .2s ease both}
    .tbv-pulse{animation:tbv-pulse 2s ease-in-out infinite}
    .tbv-spin{animation:tbv-spin .9s linear infinite}
    .tbv-card:hover{border-color:rgba(59,158,255,0.35)!important;box-shadow:0 4px 20px rgba(0,0,0,0.35)!important}
    .tbv-qbtn:hover{filter:brightness(1.15)}
    .tbv-row:hover{background:rgba(42,79,122,0.12)!important}
  `;
  document.head.appendChild(s);
})();

// ── Helpers ────────────────────────────────────────────────────────────────────
function losText(arrivedMinutes) {
  if (arrivedMinutes < 60) return `${arrivedMinutes}m`;
  return `${Math.floor(arrivedMinutes / 60)}h ${arrivedMinutes % 60}m`;
}

function enrichPatient(p, notes) {
  return {
    ...p,
    room:      p.patient_id || "—",
    cc:        p.chronic_conditions?.[0] || "Unknown CC",
    age:       p.date_of_birth
      ? `${new Date().getFullYear() - new Date(p.date_of_birth).getFullYear()}`
      : "—",
    sex:       p.gender ? p.gender[0].toUpperCase() : "",
    provider:  p.created_by || "Unassigned",
    nurse:     "Unassigned",
    status:    "waiting",
    arrived:   Math.max(0, Math.round((Date.now() - new Date(p.created_date)) / 60000)),
    orders:    [],
    results:   [],
    note:      notes.find(n =>
      n.patient_id === p.id || n.patient_name === p.patient_name
    ) || { hpi:"", assessment:"", plan:"" },
    noteDraft: !(notes.find(n => n.patient_id === p.id)?.status === "finalized"),
  };
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function StatTile({ value, label, sub, color }) {
  return (
    <div style={{ ...glass, padding:"9px 13px", borderLeft:`3px solid ${color}`,
      background:`linear-gradient(135deg,${color}10,rgba(8,22,40,0.75))` }}>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:14, fontWeight:700,
        color, lineHeight:1 }}>{value}</div>
      <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600, color:T.txt,
        fontSize:10, margin:"3px 0" }}>{label}</div>
      {sub && <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9, color:T.txt4 }}>{sub}</div>}
    </div>
  );
}

function QuickBtn({ icon, label, count, color, onClick, compact }) {
  if (compact) return null;
  const c = color || T.teal;
  return (
    <button className="tbv-qbtn" onClick={onClick}
      style={{ flex:"1 1 auto", display:"flex", alignItems:"center",
        justifyContent:"center", gap:4,
        fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
        padding:"5px 6px", borderRadius:7, cursor:"pointer",
        border:`1px solid ${c}28`, background:`${c}0c`, color:c,
        transition:"all .12s" }}>
      <span style={{ fontSize:10 }}>{icon}</span>
      <span>{label}</span>
      {count > 0 && (
        <span style={{ background:c, color:"#050f1e", borderRadius:20,
          padding:"1px 5px", fontFamily:"'JetBrains Mono',monospace",
          fontSize:7, fontWeight:700, lineHeight:"13px" }}>{count}</span>
      )}
    </button>
  );
}

function PatientCard({ patient, onCardClick, onNote, onOrders, onResults, compact, hasAlert }) {
  const st   = STATUS[patient.status] || STATUS.waiting;
  const pend = patient.orders.filter(o => o.status === "pending");
  const crit = patient.results.filter(r => r.flag === "critical" && !r.acknowledged);

  return (
    <div className="tbv-fade tbv-card"
      style={{ ...glass, padding:0, overflow:"hidden",
        borderLeft:`3px solid ${st.color}`, cursor:"pointer",
        transition:"border-color .15s, box-shadow .15s",
        boxShadow: hasAlert
          ? `0 0 0 1px ${T.red}50, 0 4px 18px ${T.red}14` : undefined }}>

      {patient.status === "critical" && (
        <div className="tbv-pulse" style={{ position:"absolute", inset:0, pointerEvents:"none",
          background:`radial-gradient(ellipse at 20% 20%,${T.red}08 0%,transparent 65%)` }} />
      )}

      {/* Main row */}
      <div onClick={onCardClick} style={{ padding:"10px 12px 8px",
        display:"flex", justifyContent:"space-between",
        alignItems:"flex-start", gap:8 }}>
        <div style={{ display:"flex", alignItems:"baseline", gap:8 }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:20,
            fontWeight:700, color:st.color, lineHeight:1, minWidth:24 }}>
            {patient.room}
          </span>
          <div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:700,
              fontSize:12, color:T.txt, lineHeight:1.2 }}>{patient.cc}</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9,
              color:T.txt4, marginTop:1 }}>
              {patient.age}{patient.sex} · {losText(patient.arrived)} ago
            </div>
          </div>
        </div>
        <div style={{ display:"flex", flexDirection:"column",
          alignItems:"flex-end", gap:3, flexShrink:0 }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
            fontWeight:700, padding:"2px 7px", borderRadius:20,
            background:`${st.color}16`, border:`1px solid ${st.color}38`,
            color:st.color, letterSpacing:.5 }}>{st.label}</span>
          {patient.noteDraft && (
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:6,
              fontWeight:700, padding:"1px 6px", borderRadius:20,
              background:`${T.orange}12`, border:`1px solid ${T.orange}30`,
              color:T.orange }}>DRAFT</span>
          )}
        </div>
      </div>

      {/* Provider / nurse */}
      <div onClick={onCardClick} style={{ borderTop:"1px solid rgba(42,79,122,0.25)",
        padding:"5px 12px", display:"flex", gap:8 }}>
        <div style={{ flex:1, display:"flex", alignItems:"center", gap:4 }}>
          <span style={{ fontSize:9 }}>🩺</span>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
            color:T.txt2, fontWeight:500 }}>{patient.provider}</span>
        </div>
        <div style={{ flex:1, display:"flex", alignItems:"center", gap:4 }}>
          <span style={{ fontSize:9 }}>👩‍⚕️</span>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
            color:T.txt3 }}>{patient.nurse}</span>
        </div>
      </div>

      {/* Pending order chips */}
      {pend.length > 0 && (
        <div onClick={onCardClick} style={{ borderTop:"1px solid rgba(42,79,122,0.25)",
          padding:"4px 12px", display:"flex", flexWrap:"wrap", gap:3 }}>
          {pend.slice(0, 4).map(o => (
            <span key={o.id} style={{ fontFamily:"'JetBrains Mono',monospace",
              fontSize:6, fontWeight:700, padding:"2px 6px", borderRadius:20,
              background:`${T.gold}0c`, border:`1px solid ${T.gold}28`,
              color:T.gold }}>
              {o.urgency === "stat" ? "⚡ " : "· "}{o.name}
            </span>
          ))}
          {pend.length > 4 && (
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:6,
              color:T.txt4, padding:"2px 4px" }}>+{pend.length - 4} more</span>
          )}
        </div>
      )}

      {/* Action buttons */}
      {!compact && (
        <div style={{ borderTop:"1px solid rgba(42,79,122,0.25)",
          padding:"6px 8px", display:"flex", gap:4 }}>
          <QuickBtn icon="📝" label="Note"
            color={patient.noteDraft ? T.orange : T.teal}
            onClick={onNote} />
          <QuickBtn icon="⚡" label="Orders"
            color={T.gold} count={pend.length}
            onClick={onOrders} />
          <QuickBtn icon="🔬" label="Results"
            color={crit.length > 0 ? T.red : T.blue}
            count={patient.results.length}
            onClick={onResults} />
        </div>
      )}
    </div>
  );
}

function PatientModal({ patient, onClose, onSignNote, onNavigate }) {
  const st = STATUS[patient.status] || STATUS.waiting;
  const [tab, setTab] = useState("note");
  const pendCt = patient.orders.filter(o => o.status === "pending").length;
  const critCt = patient.results.filter(r => r.flag === "critical" && !r.acknowledged).length;

  const TABS = [
    { id:"note",    icon:"📝", label:"Note",    color:patient.noteDraft ? T.orange : T.teal },
    { id:"orders",  icon:"⚡", label:"Orders",  color:T.gold,                                count:pendCt },
    { id:"results", icon:"🔬", label:"Results", color:critCt > 0 ? T.red : T.blue,           count:patient.results.length },
  ];

  return (
    <div onClick={onClose}
      style={{ position:"fixed", inset:0, zIndex:2000,
        background:"rgba(3,8,18,0.85)", backdropFilter:"blur(8px)",
        display:"flex", alignItems:"center", justifyContent:"center",
        padding:16 }}>
      <div onClick={e => e.stopPropagation()}
        style={{ ...glass, width:"100%", maxWidth:520, maxHeight:"88vh",
          overflow:"hidden", display:"flex", flexDirection:"column",
          boxShadow:`0 24px 80px rgba(0,0,0,0.7),0 0 40px ${st.color}12`,
          borderColor:`${st.color}28` }}>

        {/* Header */}
        <div style={{ padding:"14px 16px 10px",
          borderBottom:"1px solid rgba(42,79,122,0.35)",
          display:"flex", alignItems:"flex-start",
          justifyContent:"space-between", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"baseline", gap:10 }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:22,
              fontWeight:700, color:st.color, lineHeight:1 }}>Rm {patient.room}</span>
            <div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:700,
                fontSize:15, color:T.txt }}>{patient.cc}</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                color:T.txt4 }}>{patient.age}{patient.sex} · {patient.provider}</div>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            {onNavigate && (
              <button onClick={() => { onClose(); onNavigate("/NewPatientInput"); }}
                style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
                  padding:"4px 10px", borderRadius:7, cursor:"pointer",
                  border:`1px solid ${T.teal}40`, background:`${T.teal}10`, color:T.teal }}>
                Open Chart
              </button>
            )}
            <button onClick={onClose}
              style={{ background:"rgba(42,79,122,0.28)",
                border:"1px solid rgba(42,79,122,0.5)",
                borderRadius:8, color:T.txt3, cursor:"pointer",
                fontFamily:"'DM Sans',sans-serif", fontSize:13,
                fontWeight:600, padding:"4px 10px" }}>✕</button>
          </div>
        </div>

        {/* Tab strip */}
        <div style={{ ...glass, margin:"10px 12px 0", padding:"4px",
          display:"flex", gap:4, borderRadius:9, flexShrink:0 }}>
          {TABS.map(mt => (
            <button key={mt.id} onClick={() => setTab(mt.id)}
              style={{ flex:1, fontFamily:"'DM Sans',sans-serif", fontWeight:600,
                fontSize:12, padding:"7px 6px", borderRadius:7, cursor:"pointer",
                border:`1px solid ${tab === mt.id ? mt.color + "55" : "transparent"}`,
                background:tab === mt.id ? `${mt.color}14` : "transparent",
                color:tab === mt.id ? mt.color : T.txt3,
                display:"flex", alignItems:"center", justifyContent:"center",
                gap:5, transition:"all .12s" }}>
              <span>{mt.icon}</span>
              <span>{mt.label}</span>
              {mt.count > 0 && (
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                  fontWeight:700, background:mt.color, color:"#050f1e",
                  borderRadius:20, padding:"1px 5px" }}>{mt.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab body */}
        <div className="tbv-fade" style={{ flex:1, overflowY:"auto", padding:"12px" }}>

          {tab === "note" && (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {[
                { key:"hpi",        label:"HPI",        color:T.teal   },
                { key:"assessment", label:"ASSESSMENT",  color:T.gold   },
                { key:"plan",       label:"PLAN",        color:T.blue   },
              ].map(({ key, label, color }) => (
                <div key={key} style={{ ...glass, padding:"11px 14px",
                  borderLeft:`3px solid ${color}`, background:`${color}06` }}>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                    fontWeight:700, color, letterSpacing:2,
                    textTransform:"uppercase", marginBottom:6 }}>{label}</div>
                  <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13,
                    color:T.txt2, lineHeight:1.65 }}>
                    {patient.note?.[key] || (
                      <span style={{ color:T.txt4, fontStyle:"italic" }}>
                        Not documented
                      </span>
                    )}
                  </p>
                </div>
              ))}
              {patient.noteDraft && onSignNote && (
                <button onClick={() => { onSignNote(patient.id); onClose(); }}
                  style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:700,
                    fontSize:12, padding:"10px", borderRadius:9, cursor:"pointer",
                    border:`1px solid ${T.green}40`, background:`${T.green}10`,
                    color:T.green }}>
                  ✅ Sign Note
                </button>
              )}
            </div>
          )}

          {tab === "orders" && (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {patient.orders.length === 0 && (
                <div style={{ ...glass, padding:"28px", textAlign:"center",
                  color:T.txt4, fontFamily:"'DM Sans',sans-serif", fontSize:12 }}>
                  No orders placed
                </div>
              )}
              {patient.orders.map(o => {
                const isPend = o.status === "pending";
                return (
                  <div key={o.id} style={{ ...glass, padding:"9px 13px",
                    display:"flex", alignItems:"center", justifyContent:"space-between",
                    borderLeft:`3px solid ${isPend ? T.gold : T.txt4}`,
                    background:isPend ? `${T.gold}07` : "rgba(8,22,40,0.5)" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      {isPend && (
                        <span className="tbv-pulse" style={{ display:"inline-block",
                          width:6, height:6, borderRadius:"50%",
                          background:T.gold, flexShrink:0 }} />
                      )}
                      {!isPend && (
                        <span style={{ color:T.green, fontSize:10 }}>✓</span>
                      )}
                      <span style={{ fontFamily:"'DM Sans',sans-serif",
                        fontWeight:600, fontSize:12, color:T.txt }}>{o.name}</span>
                    </div>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace",
                      fontSize:7, fontWeight:700, padding:"2px 7px", borderRadius:20,
                      background: o.urgency === "stat"
                        ? `${T.red}14` : `${T.txt4}14`,
                      border:`1px solid ${o.urgency === "stat" ? T.red : T.txt4}30`,
                      color: o.urgency === "stat" ? T.red : T.txt4 }}>
                      {o.urgency.toUpperCase()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {tab === "results" && (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {patient.results.length === 0 && (
                <div style={{ ...glass, padding:"28px", textAlign:"center",
                  color:T.txt4, fontFamily:"'DM Sans',sans-serif", fontSize:12 }}>
                  No results yet — orders in progress
                </div>
              )}
              {patient.results.map(r => {
                const fc = r.flag === "critical" ? T.red
                  : r.flag === "abnormal" ? T.gold : T.green;
                return (
                  <div key={r.id} style={{ ...glass, padding:"10px 13px",
                    display:"flex", alignItems:"center", gap:10,
                    borderLeft:`3px solid ${fc}`, background:`${fc}07` }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontFamily:"'DM Sans',sans-serif",
                        fontWeight:600, fontSize:12, color:T.txt }}>{r.name}</div>
                      {r.ref_range && (
                        <div style={{ fontFamily:"'JetBrains Mono',monospace",
                          fontSize:8, color:T.txt4, marginTop:2 }}>
                          Ref: {r.ref_range}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontFamily:"'JetBrains Mono',monospace",
                        fontSize:12, fontWeight:700, color:fc }}>{r.value}</div>
                      {r.unit && (
                        <div style={{ fontFamily:"'JetBrains Mono',monospace",
                          fontSize:8, color:T.txt4 }}>{r.unit}</div>
                      )}
                    </div>
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

// ── Main export ────────────────────────────────────────────────────────────────
export default function TrackBoardView({
  onOpenStudio,
  onNavigate,
  compact = false,
  maxHeight = "auto",
  hideStats = false,
  hideHeader = false,
}) {
  const [patients,     setPatients]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [lastFetch,    setLastFetch]    = useState(null);
  const [boardView,    setBoardView]    = useState("all");
  const [myProvider,   setMyProvider]   = useState("");
  const [modal,        setModal]        = useState(null);
  const [toast,        setToast]        = useState("");
  const toastTimer = useRef(null);

  // ── Data fetch ─────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      const [pts, notes] = await Promise.all([
        base44.entities.Patient.list(),
        base44.entities.ClinicalNote.list(),
      ]);
      const enriched = pts.map(p => enrichPatient(p, notes));
      setPatients(enriched);
      setLastFetch(new Date());
      if (!myProvider && enriched.length > 0) {
        setMyProvider(enriched[0].provider);
      }
    } catch (err) {
      console.error("TrackBoardView fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [myProvider]);

  useEffect(() => {
    fetchAll();
    const iv = setInterval(fetchAll, 30000);
    return () => clearInterval(iv);
  }, [fetchAll]);

  // ── Toast helper ───────────────────────────────────────────────────────────
  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2200);
  }, []);

  // ── Sign note ──────────────────────────────────────────────────────────────
  const handleSignNote = useCallback(async (patientId) => {
    try {
      const notes = await base44.entities.ClinicalNote.filter({ patient_id: patientId });
      if (notes.length) {
        await base44.entities.ClinicalNote.update(notes[0].id, { status:"finalized" });
      }
      showToast("Note signed!");
      fetchAll();
    } catch {
      showToast("Error signing note");
    }
  }, [fetchAll, showToast]);

  // ── Derived data ───────────────────────────────────────────────────────────
  const providers = useMemo(() =>
    [...new Set(patients.map(p => p.provider))].filter(Boolean).sort()
  , [patients]);

  const visible = useMemo(() => {
    if (boardView === "mine")    return patients.filter(p => p.provider === myProvider);
    if (boardView === "pending") return patients.filter(p =>
      p.orders.some(o => o.status === "pending") || p.noteDraft
    );
    return patients;
  }, [boardView, myProvider, patients]);

  const sorted = useMemo(() =>
    [...visible].sort((a, b) =>
      (STATUS_RANK[a.status] ?? 4) - (STATUS_RANK[b.status] ?? 4)
    )
  , [visible]);

  const stats = useMemo(() => ({
    total:    patients.length,
    critical: patients.filter(p => p.status === "critical").length,
    pending:  patients.filter(p => p.orders.some(o => o.status === "pending")).length,
    mine:     patients.filter(p => p.provider === myProvider).length,
  }), [patients, myProvider]);

  const BOARD_TABS = [
    { id:"all",     icon:"🏥", label:"All"     },
    { id:"mine",    icon:"👤", label:"Mine"    },
    { id:"pending", icon:"⏳", label:"Pending" },
  ];

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", color:T.txt,
      background:"transparent", position:"relative" }}>

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", bottom:24, left:"50%",
          transform:"translateX(-50%)",
          background:"rgba(8,22,40,0.96)",
          border:"1px solid rgba(0,229,192,0.4)",
          borderRadius:10, padding:"10px 20px",
          fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:13,
          color:T.teal, zIndex:9999, pointerEvents:"none" }}>
          {toast}
        </div>
      )}

      {/* Patient modal */}
      {modal && (
        <PatientModal
          patient={modal}
          onClose={() => setModal(null)}
          onSignNote={handleSignNote}
          onNavigate={onNavigate}
        />
      )}

      {/* Optional header strip */}
      {!hideHeader && (
        <div style={{ display:"flex", alignItems:"center",
          justifyContent:"space-between", marginBottom:12,
          flexWrap:"wrap", gap:6 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
              color:T.teal, letterSpacing:2, textTransform:"uppercase" }}>
              ED Tracking Board
            </span>
            {loading && (
              <span className="tbv-spin" style={{ display:"inline-block",
                width:10, height:10, borderRadius:"50%",
                border:`2px solid ${T.teal}33`,
                borderTopColor:T.teal }} />
            )}
          </div>
          {lastFetch && (
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:T.txt4, letterSpacing:.5 }}>
              ● {lastFetch.toLocaleTimeString()}
            </span>
          )}
        </div>
      )}

      {/* Stats row */}
      {!hideStats && (
        <div style={{ display:"grid",
          gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))",
          gap:8, marginBottom:12 }}>
          <StatTile value={loading ? "—" : stats.total}    label="Total"    sub="census"          color={T.teal}   />
          <StatTile value={loading ? "—" : stats.critical} label="Critical" sub="needs attention"  color={T.red}    />
          <StatTile value={loading ? "—" : stats.pending}  label="Pending"  sub="orders awaiting" color={T.gold}   />
          <StatTile value={loading ? "—" : stats.mine}     label="My List"  sub={myProvider}       color={T.blue}   />
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ ...glass, padding:"4px", display:"flex",
        gap:4, marginBottom:10 }}>
        {BOARD_TABS.map(bt => (
          <button key={bt.id} onClick={() => setBoardView(bt.id)}
            style={{ flex:"1 1 auto",
              fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
              padding:"7px 6px", borderRadius:8, cursor:"pointer",
              textAlign:"center", transition:"all .12s",
              border:`1px solid ${boardView === bt.id ? T.teal + "45" : "transparent"}`,
              background:boardView === bt.id
                ? `linear-gradient(135deg,${T.teal}14,${T.teal}06)` : "transparent",
              color:boardView === bt.id ? T.teal : T.txt3 }}>
            {bt.icon} {bt.label}
            {bt.id === "pending" && stats.pending > 0 && (
              <span style={{ marginLeft:5, fontFamily:"'JetBrains Mono',monospace",
                fontSize:7, fontWeight:700, background:T.gold,
                color:"#050f1e", borderRadius:20, padding:"1px 5px" }}>
                {stats.pending}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Provider filter (mine view) */}
      {boardView === "mine" && providers.length > 1 && (
        <div style={{ display:"flex", alignItems:"center",
          gap:6, marginBottom:10, flexWrap:"wrap" }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, letterSpacing:1.5, textTransform:"uppercase" }}>
            Viewing:
          </span>
          {providers.map(p => (
            <button key={p} onClick={() => setMyProvider(p)}
              style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600,
                fontSize:10, padding:"3px 10px", borderRadius:20, cursor:"pointer",
                border:`1px solid ${myProvider === p ? T.blue + "55" : "rgba(42,79,122,0.4)"}`,
                background:myProvider === p ? `${T.blue}12` : "transparent",
                color:myProvider === p ? T.blue : T.txt3,
                transition:"all .12s" }}>{p}</button>
          ))}
        </div>
      )}

      {/* Patient grid */}
      <div style={{ maxHeight, overflowY:maxHeight !== "auto" ? "auto" : undefined,
        scrollbarWidth:"thin" }}>

        {/* Loading skeletons */}
        {loading && (
          <div style={{ display:"grid",
            gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:10 }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="tbv-pulse"
                style={{ ...glass, height:150, borderRadius:12,
                  background:"linear-gradient(135deg,rgba(14,37,68,0.5),rgba(8,22,40,0.3))" }} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && sorted.length === 0 && (
          <div style={{ ...glass, padding:"36px", textAlign:"center",
            display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:28 }}>🏥</span>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13,
              color:T.txt2, fontWeight:600 }}>No patients</span>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
              color:T.txt4 }}>
              {boardView === "mine"
                ? `None assigned to ${myProvider}`
                : "No patients match this filter"}
            </span>
          </div>
        )}

        {/* Cards */}
        {!loading && sorted.length > 0 && (
          <div style={{ display:"grid",
            gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:10 }}>
            {sorted.map(p => (
              <PatientCard
                key={p.id}
                patient={p}
                compact={compact}
                onCardClick={() => setModal(p)}
                onNote={() => setModal(p)}
                onOrders={() => setModal(p)}
                onResults={() => setModal(p)}
                hasAlert={false}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}