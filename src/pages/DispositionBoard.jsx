import { useState, useEffect, useCallback, useMemo } from "react";
import { Patient, DispositionRecord } from "@/api/entities";

const PREFIX = "dsp";

(() => {
  const fontId = `${PREFIX}-fonts`;
  if (document.getElementById(fontId)) return;
  const l = document.createElement("link");
  l.id = fontId; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = `${PREFIX}-css`;
  s.textContent = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    ::-webkit-scrollbar { width: 3px; height: 3px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(42,79,122,.5); border-radius: 2px; }
    @keyframes ${PREFIX}fade { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
    @keyframes ${PREFIX}shim { 0%,100%{background-position:-200% center} 50%{background-position:200% center} }
    @keyframes ${PREFIX}orb0 { 0%,100%{transform:translate(-50%,-50%) scale(1)}    50%{transform:translate(-50%,-50%) scale(1.1)}  }
    @keyframes ${PREFIX}orb1 { 0%,100%{transform:translate(-50%,-50%) scale(1.07)} 50%{transform:translate(-50%,-50%) scale(.92)}   }
    @keyframes ${PREFIX}orb2 { 0%,100%{transform:translate(-50%,-50%) scale(.95)}  50%{transform:translate(-50%,-50%) scale(1.09)} }
    @keyframes ${PREFIX}pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
    .${PREFIX}-fade  { animation:${PREFIX}fade .22s ease both; }
    .${PREFIX}-pulse { animation:${PREFIX}pulse 2s ease-in-out infinite; }
    .${PREFIX}-shim  {
      background:linear-gradient(90deg,#f2f7ff 0%,#fff 25%,#00e5c0 50%,#3b9eff 75%,#f2f7ff 100%);
      background-size:250% auto; -webkit-background-clip:text;
      -webkit-text-fill-color:transparent; background-clip:text;
      animation:${PREFIX}shim 6s linear infinite;
    }
  `;
  document.head.appendChild(s);
})();

// ── DESIGN TOKENS (v2) ────────────────────────────────────────────────
const T = {
  bg:"#050f1e", txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", red:"#ff4444", coral:"#ff6b6b",
  green:"#3dffa0", blue:"#3b9eff", purple:"#9b6dff", orange:"#ff9f43",
};

const glass = {
  backdropFilter:"blur(20px) saturate(180%)",
  WebkitBackdropFilter:"blur(20px) saturate(180%)",
  background:"rgba(8,22,40,0.78)",
  border:"1px solid rgba(42,79,122,0.35)",
  borderRadius:14,
};

// ── DISPO CONFIGS ─────────────────────────────────────────────────────
const DISPO_TYPE = {
  admit:       { label:"Admit",       color:T.blue,   icon:"🏥" },
  discharge:   { label:"Discharge",   color:T.green,  icon:"🏠" },
  transfer:    { label:"Transfer",    color:T.purple, icon:"🚑" },
  observation: { label:"Observation", color:T.teal,   icon:"👁️" },
  ama:         { label:"AMA",         color:T.orange, icon:"⚠️" },
};

const DISPO_STATUS = {
  pending:   { label:"Pending Decision", color:T.txt4,   step:0 },
  requested: { label:"Bed Requested",    color:T.gold,   step:1 },
  arranged:  { label:"Bed Confirmed",    color:T.blue,   step:2 },
  boarding:  { label:"Boarding",         color:T.orange, step:3 },
  ready:     { label:"Ready to Go",      color:T.green,  step:4 },
  complete:  { label:"Complete",         color:T.teal,   step:5 },
};

const STATUS_STEPS = ["pending","requested","arranged","boarding","ready","complete"];

// ── HELPERS ───────────────────────────────────────────────────────────
function boardingColor(mins) {
  if (mins < 120) return T.green;
  if (mins < 240) return T.gold;
  if (mins < 360) return T.orange;
  return T.red;
}

function fmtDuration(mins) {
  if (mins === null || mins === undefined) return "—";
  if (mins < 60)  return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function fmtTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
}

function boardingMins(record, now) {
  if (!record || !record.boarding_start) return null;
  return Math.max(0, Math.round((now - new Date(record.boarding_start)) / 60000));
}

// ══════════════════════════════════════════════════════════════════════
//  MODULE-SCOPE PRIMITIVES
// ══════════════════════════════════════════════════════════════════════

function AmbientBg() {
  return (
    <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0 }}>
      {[
        { l:"12%", t:"18%", r:320, c:"rgba(59,158,255,0.055)"  },
        { l:"85%", t:"12%", r:270, c:"rgba(0,229,192,0.045)"   },
        { l:"75%", t:"75%", r:350, c:"rgba(155,109,255,0.038)" },
        { l:"20%", t:"78%", r:230, c:"rgba(245,200,66,0.038)"  },
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

function HubBadge({ name, onBack }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:9 }}>
      <div style={{
        backdropFilter:"blur(40px)", WebkitBackdropFilter:"blur(40px)",
        background:"rgba(5,15,30,0.9)", border:"1px solid rgba(42,79,122,0.6)",
        borderRadius:10, padding:"5px 12px",
        display:"flex", alignItems:"center", gap:8,
      }}>
        <span style={{ fontFamily:"JetBrains Mono", fontSize:10, color:T.gold, letterSpacing:3 }}>NOTRYA</span>
        <span style={{ color:T.txt4, fontFamily:"JetBrains Mono", fontSize:10 }}>/</span>
        <span style={{ fontFamily:"JetBrains Mono", fontSize:10, color:T.txt3, letterSpacing:2 }}>{name.toUpperCase()}</span>
      </div>
      <div style={{ height:1, flex:1, background:"linear-gradient(90deg,rgba(0,229,192,0.5),transparent)" }}/>
      {onBack && (
        <button onClick={onBack} style={{
          fontFamily:"DM Sans", fontSize:11, fontWeight:600,
          padding:"5px 14px", borderRadius:8, cursor:"pointer",
          border:"1px solid rgba(42,79,122,0.5)",
          background:"rgba(14,37,68,0.6)", color:T.txt3,
        }}>← Hub</button>
      )}
    </div>
  );
}

function StatTile({ value, label, sub, color }) {
  return (
    <div style={{
      ...glass, padding:"9px 13px", borderRadius:10,
      borderLeft:`3px solid ${color}`,
      background:`linear-gradient(135deg,${color}12,rgba(8,22,40,0.8))`,
    }}>
      <div style={{ fontFamily:"JetBrains Mono", fontSize:13, fontWeight:700, color, lineHeight:1 }}>{value}</div>
      <div style={{ fontFamily:"DM Sans", fontWeight:600, color:T.txt, fontSize:10, margin:"3px 0" }}>{label}</div>
      {sub && <div style={{ fontFamily:"DM Sans", fontSize:9, color:T.txt4 }}>{sub}</div>}
    </div>
  );
}

function Toast({ msg }) {
  return (
    <div style={{
      position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)",
      background:"rgba(8,22,40,0.96)", border:"1px solid rgba(0,229,192,0.4)",
      borderRadius:10, padding:"10px 20px",
      fontFamily:"DM Sans", fontWeight:600, fontSize:13, color:T.teal,
      zIndex:99999, pointerEvents:"none",
      animation:`${PREFIX}fade .2s ease both`,
    }}>{msg}</div>
  );
}

function SkeletonCard() {
  return (
    <div style={{
      ...glass, height:190, borderRadius:14,
      background:"linear-gradient(135deg,rgba(14,37,68,0.5),rgba(8,22,40,0.3))",
      animation:`${PREFIX}pulse 1.8s ease-in-out infinite`,
    }}/>
  );
}

// ── Boarding Timer — the most important visual on a dispo card ─────────
function BoardingTimer({ mins }) {
  if (mins === null) return null;
  const color  = boardingColor(mins);
  const urgent = mins >= 240;
  return (
    <div style={{
      display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:"8px 12px",
      background:`${color}0d`,
      borderTop:"1px solid rgba(42,79,122,0.25)",
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
        {urgent && (
          <span className={`${PREFIX}-pulse`} style={{ fontSize:12 }}>🚨</span>
        )}
        <span style={{
          fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700,
          color, letterSpacing:1.5, textTransform:"uppercase",
        }}>Boarding</span>
      </div>
      <span style={{
        fontFamily:"JetBrains Mono", fontSize:17, fontWeight:700,
        color, lineHeight:1,
      }}>{fmtDuration(mins)}</span>
    </div>
  );
}

// ── Dispo Card ────────────────────────────────────────────────────────
function DispoCard({ patient, record, now, onOpen, onSetDispo }) {
  const dt   = record ? (DISPO_TYPE[record.dispo_type]   || DISPO_TYPE.admit)  : null;
  const ds   = record ? (DISPO_STATUS[record.dispo_status] || DISPO_STATUS.pending) : null;
  const bmins = record ? boardingMins(record, now) : null;
  const accentColor = dt ? dt.color : T.txt4;
  const mins = patient.arrived_at
    ? Math.round((now - new Date(patient.arrived_at)) / 60000)
    : null;
  const arrTxt = mins !== null
    ? (mins < 60 ? `${mins}m` : `${Math.floor(mins/60)}h ${mins%60}m`)
    : "—";

  return (
    <div className={`${PREFIX}-fade`} style={{
      ...glass, padding:0, overflow:"hidden",
      borderLeft:`3px solid ${accentColor}`,
      position:"relative",
    }}>
      {/* Critical boarding glow */}
      {bmins !== null && bmins >= 360 && (
        <div className={`${PREFIX}-pulse`} style={{
          position:"absolute", inset:0, pointerEvents:"none",
          background:`radial-gradient(ellipse at 20% 20%,${T.red}0c 0%,transparent 65%)`,
        }}/>
      )}

      {/* Row 1: Room, CC, dispo type */}
      <div style={{
        padding:"10px 12px 8px",
        display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8,
      }}>
        <div style={{ display:"flex", alignItems:"baseline", gap:8 }}>
          <span style={{
            fontFamily:"JetBrains Mono", fontSize:22, fontWeight:700,
            color:accentColor, lineHeight:1, minWidth:28, flexShrink:0,
          }}>{patient.room}</span>
          <div>
            <div style={{ fontFamily:"DM Sans", fontWeight:700, fontSize:13, color:T.txt, lineHeight:1.2 }}>
              {patient.cc}
            </div>
            <div style={{ fontFamily:"DM Sans", fontSize:10, color:T.txt4, marginTop:1 }}>
              {patient.age}{patient.sex} · {arrTxt} in ED
            </div>
          </div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:3, flexShrink:0 }}>
          {dt ? (
            <span style={{
              fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700,
              padding:"2px 7px", borderRadius:20,
              background:`${dt.color}18`, border:`1px solid ${dt.color}40`,
              color:dt.color, letterSpacing:.5,
            }}>{dt.icon} {dt.label.toUpperCase()}</span>
          ) : (
            <span style={{
              fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700,
              padding:"2px 7px", borderRadius:20,
              background:`${T.txt4}14`, border:`1px solid ${T.txt4}30`,
              color:T.txt4,
            }}>UNDECIDED</span>
          )}
          {ds && (
            <span style={{
              fontFamily:"JetBrains Mono", fontSize:7, fontWeight:700,
              padding:"2px 6px", borderRadius:20,
              background:`${ds.color}13`, border:`1px solid ${ds.color}32`,
              color:ds.color,
            }}>{ds.label.toUpperCase()}</span>
          )}
        </div>
      </div>

      {/* Row 2: Provider / Nurse */}
      <div style={{
        borderTop:"1px solid rgba(42,79,122,0.25)",
        padding:"5px 12px", display:"flex", gap:8,
      }}>
        <div style={{ flex:1, display:"flex", alignItems:"center", gap:5 }}>
          <span style={{ fontSize:9 }}>🩺</span>
          <span style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt2, fontWeight:500 }}>{patient.provider}</span>
        </div>
        <div style={{ flex:1, display:"flex", alignItems:"center", gap:5 }}>
          <span style={{ fontSize:9 }}>👩‍⚕️</span>
          <span style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt3 }}>{patient.nurse}</span>
        </div>
      </div>

      {/* Row 3: Accepting / Destination (if record exists) */}
      {record && (record.accepting_service || record.destination) && (
        <div style={{
          borderTop:"1px solid rgba(42,79,122,0.25)",
          padding:"6px 12px", display:"flex", flexDirection:"column", gap:2,
        }}>
          {record.accepting_service && (
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ fontSize:10 }}>{dt ? dt.icon : "🏥"}</span>
              <span style={{ fontFamily:"DM Sans", fontWeight:600, fontSize:12, color:T.txt }}>
                {record.accepting_service}
              </span>
              {record.destination && (
                <span style={{ fontFamily:"JetBrains Mono", fontSize:9, color:accentColor }}>
                  → {record.destination}
                </span>
              )}
            </div>
          )}
          {record.accepting_physician && (
            <div style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt3, paddingLeft:20 }}>
              {record.accepting_physician}
            </div>
          )}
          {record.est_dispo_time && (
            <div style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.txt4, paddingLeft:20 }}>
              Est: {record.est_dispo_time}
            </div>
          )}
        </div>
      )}

      {/* Row 4: Boarding timer (only if boarding_start set) */}
      <BoardingTimer mins={bmins}/>

      {/* Row 5: Actions */}
      <div style={{ borderTop:"1px solid rgba(42,79,122,0.25)", padding:"7px 10px", display:"flex", gap:5 }}>
        {record ? (
          <button onClick={onOpen} style={{
            flex:1, fontFamily:"DM Sans", fontWeight:700, fontSize:11,
            padding:"6px 8px", borderRadius:8, cursor:"pointer",
            border:`1px solid ${accentColor}35`, background:`${accentColor}0d`, color:accentColor,
          }}>✏️ Update Dispo</button>
        ) : (
          <button onClick={onSetDispo} style={{
            flex:1, fontFamily:"DM Sans", fontWeight:700, fontSize:11,
            padding:"6px 8px", borderRadius:8, cursor:"pointer",
            border:`1px solid ${T.gold}40`, background:`${T.gold}0e`, color:T.gold,
          }}>+ Set Disposition</button>
        )}
        {record && record.dispo_status !== "complete" && (
          <button onClick={onOpen} style={{
            fontFamily:"DM Sans", fontWeight:600, fontSize:11,
            padding:"6px 10px", borderRadius:8, cursor:"pointer",
            border:"1px solid rgba(42,79,122,0.4)",
            background:"transparent", color:T.txt3,
          }}>⏱</button>
        )}
      </div>
    </div>
  );
}

// ── Update Panel (inside modal) ───────────────────────────────────────
function UpdatePanel({ patientId, record, onSave, onToast, onStartBoarding }) {
  const [dtype,    setDtype]    = useState(record?.dispo_type        || "admit");
  const [dstatus,  setDstatus]  = useState(record?.dispo_status      || "pending");
  const [acPhys,   setAcPhys]   = useState(record?.accepting_physician || "");
  const [acSvc,    setAcSvc]    = useState(record?.accepting_service   || "");
  const [dest,     setDest]     = useState(record?.destination         || "");
  const [estTime,  setEstTime]  = useState(record?.est_dispo_time      || "");
  const [notes,    setNotes]    = useState(record?.notes               || "");
  const [saving,   setSaving]   = useState(false);

  async function handleSave() {
    setSaving(true);
    const payload = {
      patient:             patientId,
      dispo_type:          dtype,
      dispo_status:        dstatus,
      accepting_physician: acPhys,
      accepting_service:   acSvc,
      destination:         dest,
      est_dispo_time:      estTime,
      notes,
    };
    await onSave(record?.id || null, payload);
    setSaving(false);
  }

  async function handleStartBoarding() {
    if (!record) return;
    await onStartBoarding(record.id);
  }

  const iField = {
    background:"rgba(14,37,68,0.8)",
    border:"1px solid rgba(42,79,122,0.4)",
    borderRadius:8, padding:"7px 11px",
    fontFamily:"DM Sans", fontSize:12, color:T.txt,
    outline:"none", width:"100%", transition:"border-color .12s",
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

      {/* Dispo Type */}
      <div>
        <div style={{
          fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700,
          color:T.txt4, letterSpacing:2, textTransform:"uppercase", marginBottom:7,
        }}>Disposition Type</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
          {Object.entries(DISPO_TYPE).map(([k, v]) => (
            <button key={k} onClick={() => setDtype(k)} style={{
              fontFamily:"DM Sans", fontWeight:600, fontSize:11,
              padding:"5px 12px", borderRadius:20, cursor:"pointer",
              border:`1px solid ${dtype===k ? v.color+"60" : "rgba(42,79,122,0.35)"}`,
              background: dtype===k ? `${v.color}14` : "transparent",
              color: dtype===k ? v.color : T.txt3,
              transition:"all .12s",
            }}>{v.icon} {v.label}</button>
          ))}
        </div>
      </div>

      {/* Status Stepper */}
      <div>
        <div style={{
          fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700,
          color:T.txt4, letterSpacing:2, textTransform:"uppercase", marginBottom:7,
        }}>Status</div>
        <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
          {STATUS_STEPS.map(s => {
            const cfg    = DISPO_STATUS[s];
            const active = dstatus === s;
            const past   = cfg.step < (DISPO_STATUS[dstatus]?.step ?? 0);
            return (
              <button key={s} onClick={() => setDstatus(s)} style={{
                display:"flex", alignItems:"center", gap:10,
                padding:"8px 12px", borderRadius:9, cursor:"pointer",
                border:`1px solid ${active ? cfg.color+"55" : "rgba(42,79,122,0.3)"}`,
                background: active ? `${cfg.color}15` : "transparent",
                color: active ? cfg.color : past ? T.txt4 : T.txt3,
                textAlign:"left", transition:"all .12s",
              }}>
                <span style={{
                  width:8, height:8, borderRadius:"50%", flexShrink:0,
                  background: active ? cfg.color : past ? `${T.txt4}50` : "rgba(42,79,122,0.4)",
                }}/>
                <span style={{ fontFamily:"DM Sans", fontWeight:active ? 700 : 400, fontSize:12 }}>
                  {cfg.label}
                </span>
                {active && (
                  <span style={{
                    marginLeft:"auto", fontFamily:"JetBrains Mono", fontSize:8,
                    color:cfg.color, letterSpacing:1,
                  }}>CURRENT</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Boarding start button — only shows if status is boarding/arranged but no boarding_start */}
      {(dstatus === "boarding" || dstatus === "arranged") && record && !record.boarding_start && (
        <button onClick={handleStartBoarding} style={{
          fontFamily:"DM Sans", fontWeight:700, fontSize:12,
          padding:"10px", borderRadius:9, cursor:"pointer",
          border:`1px solid ${T.orange}45`, background:`${T.orange}10`, color:T.orange,
        }}>⏱ Start Boarding Timer Now</button>
      )}

      {/* Clinical fields */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
        {[
          { label:"Accepting Physician", val:acPhys, set:setAcPhys, placeholder:"Dr. Smith" },
          { label:"Accepting Service",   val:acSvc,  set:setAcSvc,  placeholder:"Cardiology" },
          { label:"Destination",         val:dest,   set:setDest,   placeholder:"CCU, Floor 4B, St. Mary's" },
          { label:"Est. Dispo Time",     val:estTime,set:setEstTime, placeholder:"~30 min, 3:00 PM" },
        ].map(({ label, val, set, placeholder }) => (
          <div key={label}>
            <div style={{
              fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700,
              color:T.txt4, letterSpacing:1.5, textTransform:"uppercase", marginBottom:5,
            }}>{label}</div>
            <input
              type="text" value={val} onChange={e => set(e.target.value)}
              placeholder={placeholder}
              style={iField}
            />
          </div>
        ))}
      </div>

      {/* Notes */}
      <div>
        <div style={{
          fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700,
          color:T.txt4, letterSpacing:1.5, textTransform:"uppercase", marginBottom:5,
        }}>Notes</div>
        <textarea
          value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Pending transport, family notified, awaiting bed assignment..."
          rows={3}
          style={{
            ...iField,
            resize:"vertical", lineHeight:1.55,
          }}
        />
      </div>

      <button onClick={handleSave} disabled={saving} style={{
        fontFamily:"DM Sans", fontWeight:700, fontSize:13,
        padding:"11px", borderRadius:9,
        cursor: saving ? "not-allowed" : "pointer",
        border:`1px solid ${T.teal}40`, background:`${T.teal}12`, color:T.teal,
        opacity: saving ? 0.6 : 1, transition:"opacity .12s",
      }}>{saving ? "Saving..." : record ? "Save Changes" : "Create Disposition"}</button>
    </div>
  );
}

// ── Timeline Panel ────────────────────────────────────────────────────
function TimelinePanel({ patient, record }) {
  const arrivalMins = patient.arrived_at
    ? Math.round((Date.now() - new Date(patient.arrived_at)) / 60000)
    : null;

  const events = [
    { label:"Patient Arrived",        time:patient.arrived_at,       color:T.teal,   icon:"🚪" },
    { label:"Dispo Decision",         time:record?.created_at,        color:T.blue,   icon:"📋" },
    { label:"Bed / Transport Request",time:record?.bed_request_time,  color:T.gold,   icon:"📞" },
    { label:"Bed / Transport Confirmed",time:record?.bed_assigned_time,color:T.green, icon:"✅" },
    { label:"Boarding Started",       time:record?.boarding_start,    color:T.orange, icon:"⏱" },
  ].filter(e => e.time);

  if (!events.length) {
    return (
      <div style={{
        ...glass, padding:"30px", textAlign:"center",
        display:"flex", flexDirection:"column", alignItems:"center", gap:8,
      }}>
        <span style={{ fontSize:24 }}>📋</span>
        <span style={{ fontFamily:"DM Sans", fontSize:13, color:T.txt3 }}>No timeline events yet</span>
      </div>
    );
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
      {arrivalMins !== null && (
        <div style={{
          ...glass, padding:"9px 14px", marginBottom:12,
          borderLeft:`3px solid ${T.teal}`, background:`${T.teal}07`,
          display:"flex", justifyContent:"space-between", alignItems:"center",
        }}>
          <span style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt2 }}>Total ED Time</span>
          <span style={{ fontFamily:"JetBrains Mono", fontSize:14, fontWeight:700, color:T.teal }}>
            {fmtDuration(arrivalMins)}
          </span>
        </div>
      )}
      {events.map((e, i) => (
        <div key={i} style={{ display:"flex", gap:12, paddingBottom:14, position:"relative" }}>
          {i < events.length - 1 && (
            <div style={{
              position:"absolute", left:12, top:28, width:1,
              height:"calc(100% - 14px)",
              background:"rgba(42,79,122,0.35)",
            }}/>
          )}
          <div style={{
            width:25, height:25, borderRadius:"50%", flexShrink:0,
            background:`${e.color}20`, border:`2px solid ${e.color}50`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:11, zIndex:1,
          }}>{e.icon}</div>
          <div style={{ flex:1, paddingTop:2 }}>
            <div style={{ fontFamily:"DM Sans", fontWeight:600, fontSize:13, color:T.txt }}>
              {e.label}
            </div>
            <div style={{ fontFamily:"JetBrains Mono", fontSize:10, color:e.color, marginTop:2 }}>
              {fmtTime(e.time)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────
function DispoModal({ patient, record, onClose, onSave, onToast, onStartBoarding }) {
  const [tab, setTab] = useState("update");
  const dt  = record ? (DISPO_TYPE[record.dispo_type] || DISPO_TYPE.admit) : null;

  const TABS = [
    { id:"update",   label:"Update",   icon:"✏️" },
    { id:"timeline", label:"Timeline", icon:"⏱"  },
  ];

  return (
    <div
      style={{
        position:"fixed", inset:0, zIndex:1000,
        background:"rgba(3,8,18,0.88)", backdropFilter:"blur(8px)",
        display:"flex", alignItems:"center", justifyContent:"center", padding:"16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          ...glass, width:"100%", maxWidth:520,
          maxHeight:"90vh", overflow:"hidden",
          display:"flex", flexDirection:"column",
          boxShadow:`0 24px 80px rgba(0,0,0,0.7),0 0 40px ${dt ? dt.color : T.blue}14`,
          borderColor:`${dt ? dt.color : T.blue}28`,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding:"14px 16px 10px",
          borderBottom:"1px solid rgba(42,79,122,0.35)",
          display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexShrink:0,
        }}>
          <div style={{ display:"flex", alignItems:"baseline", gap:10 }}>
            <span style={{
              fontFamily:"JetBrains Mono", fontSize:24, fontWeight:700,
              color:dt ? dt.color : T.blue, lineHeight:1,
            }}>Rm {patient.room}</span>
            <div>
              <div style={{ fontFamily:"DM Sans", fontWeight:700, fontSize:15, color:T.txt }}>{patient.cc}</div>
              <div style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt4 }}>
                {patient.age}{patient.sex} · {patient.provider} · {patient.nurse}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{
            background:"rgba(42,79,122,0.28)", border:"1px solid rgba(42,79,122,0.5)",
            borderRadius:8, color:T.txt3, cursor:"pointer",
            fontFamily:"DM Sans", fontSize:13, fontWeight:600, padding:"4px 10px",
          }}>✕</button>
        </div>

        {/* Tab bar */}
        <div style={{
          ...glass, margin:"10px 12px 0",
          padding:"4px", display:"flex", gap:4, borderRadius:10, flexShrink:0,
        }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex:1, fontFamily:"DM Sans", fontWeight:600, fontSize:12,
              padding:"8px 6px", borderRadius:8, cursor:"pointer",
              border:`1px solid ${tab===t.id ? T.teal+"55" : "transparent"}`,
              background: tab===t.id ? `${T.teal}16` : "transparent",
              color: tab===t.id ? T.teal : T.txt3,
              display:"flex", alignItems:"center", justifyContent:"center", gap:5,
              transition:"all .12s",
            }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className={`${PREFIX}-fade`} style={{ flex:1, overflowY:"auto", padding:"12px" }}>
          {tab === "update" && (
            <UpdatePanel
              patientId={patient.id}
              record={record}
              onSave={onSave}
              onToast={onToast}
              onStartBoarding={onStartBoarding}
            />
          )}
          {tab === "timeline" && (
            <TimelinePanel patient={patient} record={record}/>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
//  MAIN EXPORT
// ══════════════════════════════════════════════════════════════════════

export default function DispositionBoard({ onBack }) {
  const [patients,  setPatients]  = useState([]);
  const [records,   setRecords]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [lastFetch, setLastFetch] = useState(null);
  const [now,       setNow]       = useState(Date.now());
  const [filter,    setFilter]    = useState("all");
  const [modal,     setModal]     = useState(null);
  const [toast,     setToast]     = useState("");

  // ── Live clocks ────────────────────────────────────────────────────
  // Boarding timers update every minute
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(t);
  }, []);

  // ── Data fetching ──────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      const [pts, recs] = await Promise.all([
        Patient.list(),
        DispositionRecord.list(),
      ]);
      setPatients(pts);
      setRecords(recs);
      setLastFetch(new Date());
    } catch (err) {
      console.error("DispositionBoard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  // ── Toast helper ───────────────────────────────────────────────────
  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  }, []);

  // ── Write operations ───────────────────────────────────────────────
  const handleSave = useCallback(async (recordId, payload) => {
    try {
      if (recordId) {
        await DispositionRecord.update(recordId, payload);
        showToast("Disposition updated");
      } else {
        await DispositionRecord.create(payload);
        showToast("Disposition created");
      }
      setModal(null);
      fetchAll();
    } catch {
      showToast("Error saving disposition");
    }
  }, [fetchAll, showToast]);

  const handleStartBoarding = useCallback(async (recordId) => {
    try {
      await DispositionRecord.update(recordId, {
        boarding_start: new Date().toISOString(),
        dispo_status:   "boarding",
      });
      showToast("Boarding timer started");
      fetchAll();
    } catch {
      showToast("Error starting timer");
    }
  }, [fetchAll, showToast]);

  const handleMarkComplete = useCallback(async (recordId) => {
    try {
      await DispositionRecord.update(recordId, { dispo_status: "complete" });
      showToast("Patient marked complete");
      setModal(null);
      fetchAll();
    } catch {
      showToast("Error updating status");
    }
  }, [fetchAll, showToast]);

  // ── Join + derived data ────────────────────────────────────────────
  const enriched = useMemo(() =>
    patients.map(p => ({
      patient: p,
      record:  records.find(r => r.patient === p.id) ?? null,
    })),
  [patients, records]);

  const visible = useMemo(() => {
    if (filter === "all")      return enriched;
    if (filter === "undecided") return enriched.filter(e => !e.record);
    if (filter === "boarding")  return enriched.filter(e => e.record?.dispo_status === "boarding");
    if (filter === "ready")     return enriched.filter(e => e.record?.dispo_status === "ready");
    return enriched.filter(e => e.record?.dispo_type === filter);
  }, [enriched, filter]);

  // Sort: longest boarding first, then by arrived_at
  const sorted = useMemo(() =>
    [...visible].sort((a, b) => {
      const bmA = boardingMins(a.record, now) ?? -1;
      const bmB = boardingMins(b.record, now) ?? -1;
      if (bmA !== bmB) return bmB - bmA;
      const tA = a.patient.arrived_at ? new Date(a.patient.arrived_at) : 0;
      const tB = b.patient.arrived_at ? new Date(b.patient.arrived_at) : 0;
      return tA - tB;
    }),
  [visible, now]);

  const stats = useMemo(() => {
    const boarding    = enriched.filter(e => e.record?.boarding_start);
    const bMins       = boarding.map(e => boardingMins(e.record, now)).filter(Boolean);
    const avgBoarding = bMins.length
      ? Math.round(bMins.reduce((a, b) => a + b, 0) / bMins.length)
      : null;
    return {
      total:      enriched.length,
      boarding:   boarding.length,
      avgBoarding,
      ready:      enriched.filter(e => e.record?.dispo_status === "ready").length,
      undecided:  enriched.filter(e => !e.record).length,
    };
  }, [enriched, now]);

  const FILTER_PILLS = [
    { id:"all",        label:"All",         color:T.teal   },
    { id:"admit",      label:"Admit",        color:T.blue   },
    { id:"discharge",  label:"Discharge",    color:T.green  },
    { id:"transfer",   label:"Transfer",     color:T.purple },
    { id:"observation",label:"Observation",  color:T.teal   },
    { id:"boarding",   label:"Boarding Now", color:T.orange },
    { id:"ready",      label:"Ready to Go",  color:T.green  },
    { id:"undecided",  label:"Undecided",    color:T.txt4   },
  ];

  return (
    <div style={{
      fontFamily:"DM Sans, sans-serif",
      background:T.bg, minHeight:"100vh",
      position:"relative", overflowX:"hidden", color:T.txt,
    }}>
      <AmbientBg/>
      {toast && <Toast msg={toast}/>}
      {modal && (
        <DispoModal
          patient={modal.patient}
          record={modal.record}
          onClose={() => setModal(null)}
          onToast={showToast}
          onSave={handleSave}
          onStartBoarding={handleStartBoarding}
        />
      )}

      <div style={{ position:"relative", zIndex:1, maxWidth:1400, margin:"0 auto", padding:"0 16px" }}>

        {/* Header */}
        <div style={{ padding:"18px 0 14px" }}>
          <HubBadge name="DISPOSITION" onBack={onBack}/>
          <h1 className={`${PREFIX}-shim`} style={{
            fontFamily:"Playfair Display",
            fontSize:"clamp(22px,3.5vw,36px)",
            fontWeight:900, letterSpacing:-1, lineHeight:1.1, marginBottom:4,
          }}>
            Disposition Board
          </h1>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:6 }}>
            <p style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt3 }}>
              Admit · Discharge · Transfer · Boarding times · Bed status at a glance
            </p>
            {lastFetch && (
              <span style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.txt4 }}>
                ● Updated {lastFetch.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {/* Stats banner */}
        <div style={{
          display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",
          gap:10, marginBottom:16,
        }}>
          <StatTile value={loading ? "—" : stats.total}      label="Total Patients"  sub="ED census"            color={T.blue}   />
          <StatTile value={loading ? "—" : stats.boarding}   label="Boarding"        sub="In hallway/waiting"   color={T.orange} />
          <StatTile
            value={loading || stats.avgBoarding === null ? "—" : fmtDuration(stats.avgBoarding)}
            label="Avg Boarding"  sub="Active boarders"      color={stats.avgBoarding >= 240 ? T.red : T.gold}
          />
          <StatTile value={loading ? "—" : stats.ready}      label="Ready to Go"     sub="Awaiting departure"   color={T.green}  />
          <StatTile value={loading ? "—" : stats.undecided}  label="No Dispo Yet"    sub="Decision needed"      color={T.txt4}   />
        </div>

        {/* Critical boarding alert banner */}
        {!loading && enriched.some(e => {
          const b = boardingMins(e.record, now);
          return b !== null && b >= 360;
        }) && (
          <div style={{
            ...glass, padding:"9px 14px", marginBottom:12,
            border:"1px solid rgba(255,68,68,0.35)",
            borderLeft:`3px solid ${T.red}`,
            background:`${T.red}09`,
            display:"flex", alignItems:"center", gap:8,
          }}>
            <span className={`${PREFIX}-pulse`} style={{ fontSize:14 }}>🚨</span>
            <span style={{ fontFamily:"DM Sans", fontWeight:700, fontSize:12, color:T.red }}>
              {enriched.filter(e => { const b = boardingMins(e.record, now); return b !== null && b >= 360; }).length} patient(s) boarding over 6 hours — escalation required
            </span>
          </div>
        )}

        {/* Filter pills */}
        <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:14 }}>
          {FILTER_PILLS.map(fp => (
            <button key={fp.id} onClick={() => setFilter(fp.id)} style={{
              fontFamily:"JetBrains Mono", fontSize:9, fontWeight:700,
              padding:"4px 12px", borderRadius:20, cursor:"pointer",
              textTransform:"uppercase", letterSpacing:1, transition:"all .12s",
              border:`1px solid ${filter===fp.id ? fp.color+"77" : fp.color+"28"}`,
              background: filter===fp.id ? `${fp.color}18` : `${fp.color}06`,
              color: filter===fp.id ? fp.color : T.txt3,
            }}>{fp.label}</button>
          ))}
        </div>

        {/* Loading skeletons */}
        {loading && (
          <div style={{
            display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))",
            gap:12, marginBottom:24,
          }}>
            {[...Array(8)].map((_, i) => (
              <div key={i} style={{ animationDelay:`${i*0.08}s` }}>
                <SkeletonCard/>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && sorted.length === 0 && (
          <div style={{
            ...glass, padding:"40px", textAlign:"center",
            display:"flex", flexDirection:"column", alignItems:"center", gap:10,
          }}>
            <span style={{ fontSize:32 }}>🏥</span>
            <span style={{ fontFamily:"DM Sans", fontSize:14, color:T.txt2, fontWeight:600 }}>No patients</span>
            <span style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt4 }}>No patients match this filter</span>
          </div>
        )}

        {/* Patient grid */}
        {!loading && sorted.length > 0 && (
          <div style={{
            display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))",
            gap:12, marginBottom:24,
          }}>
            {sorted.map(({ patient, record }) => (
              <DispoCard
                key={patient.id}
                patient={patient}
                record={record}
                now={now}
                onOpen={()     => setModal({ patient, record })}
                onSetDispo={()=> setModal({ patient, record: null })}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign:"center", paddingBottom:24 }}>
          <span style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.txt4, letterSpacing:1.5 }}>
            NOTRYA · ED DISPOSITION BOARD · CLINICAL DECISION SUPPORT ONLY
          </span>
        </div>

      </div>
    </div>
  );
}