// QuickNoteTimeline.jsx  v11.5
// Feature #3 — Timeline Auto-Stamp
// - Now button on every row
// - Door-to-physician metric (green ≤30min, gold ≤60min, red >60min)
// - Total ED time metric
// - onStamp prop for auto-stamping from QuickNote.jsx
// Export: TimelineCard

import React, { useMemo } from "react";

function parseTimeToMin(t) {
  if (!t) return null;
  try {
    const m12 = t.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (m12) {
      let h = parseInt(m12[1]);
      const m = parseInt(m12[2]);
      const ap = m12[3].toUpperCase();
      if (ap==="PM"&&h!==12) h+=12;
      if (ap==="AM"&&h===12) h=0;
      return h*60+m;
    }
    const m24 = t.trim().match(/^(\d{1,2}):(\d{2})$/);
    if (m24) return parseInt(m24[1])*60+parseInt(m24[2]);
    return null;
  } catch { return null; }
}

function calcMins(from, to) {
  const a=parseTimeToMin(from), b=parseTimeToMin(to);
  if (a===null||b===null) return null;
  const d=b-a; return d>=0?d:null;
}

function EventRow({ event, onChange, onNow }) {
  return (
    <div style={{
      display:"grid", gridTemplateColumns:"160px 110px 1fr",
      gap:8, alignItems:"center", padding:"5px 0",
      borderBottom:"1px solid rgba(42,79,122,.15)",
    }}>
      <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
        color:"var(--qn-txt2)", fontWeight:event.time?600:400 }}>
        {event.label}
      </span>
      <div style={{ display:"flex", gap:5, alignItems:"center" }}>
        <input type="text" value={event.time}
          onChange={e => onChange("time", e.target.value)}
          placeholder="HH:MM AM"
          style={{ flex:1, padding:"4px 7px", borderRadius:5, minWidth:0,
            background:"rgba(14,37,68,.6)", border:"1px solid rgba(42,79,122,.4)",
            color:event.time?"var(--qn-txt)":"var(--qn-txt4)",
            fontFamily:"'JetBrains Mono',monospace", fontSize:11, outline:"none" }}
          onFocus={e => e.target.style.borderColor="rgba(0,229,192,.5)"}
          onBlur={e => e.target.style.borderColor="rgba(42,79,122,.4)"} />
        <button onClick={onNow} title="Stamp current time" style={{
          padding:"3px 7px", borderRadius:5, cursor:"pointer",
          fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
          border:"1px solid rgba(0,229,192,.35)", background:"rgba(0,229,192,.07)",
          color:"var(--qn-teal)", flexShrink:0, transition:"all .14s",
        }}
          onMouseEnter={e => { e.currentTarget.style.background="rgba(0,229,192,.15)"; e.currentTarget.style.borderColor="rgba(0,229,192,.6)"; }}
          onMouseLeave={e => { e.currentTarget.style.background="rgba(0,229,192,.07)"; e.currentTarget.style.borderColor="rgba(0,229,192,.35)"; }}>
          Now
        </button>
      </div>
      <input type="text" value={event.notes}
        onChange={e => onChange("notes", e.target.value)}
        placeholder="Notes (optional)"
        style={{ padding:"4px 8px", borderRadius:5,
          background:"rgba(14,37,68,.5)", border:"1px solid rgba(42,79,122,.3)",
          color:"var(--qn-txt3)", fontFamily:"'DM Sans',sans-serif", fontSize:11, outline:"none" }}
        onFocus={e => e.target.style.borderColor="rgba(59,158,255,.5)"}
        onBlur={e => e.target.style.borderColor="rgba(42,79,122,.3)"} />
    </div>
  );
}

export function TimelineCard({ timestamps, setTimestamps, onStamp }) {
  const [open, setOpen] = React.useState(false);

  const updateEvent = (id, field, value) =>
    setTimestamps(prev => prev.map(e => e.id===id ? {...e,[field]:value} : e));

  const stampNow = (id) => {
    const ts = new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});
    setTimestamps(prev => prev.map(e => e.id===id ? {...e,time:ts} : e));
  };

  const doorToPhysician = useMemo(() => {
    const triage    = timestamps.find(e => e.id==="triage")?.time;
    const physician = timestamps.find(e => e.id==="physician")?.time;
    const diff = calcMins(triage, physician);
    if (diff===null) return null;
    return { mins:diff, label:`${diff} min door-to-physician` };
  }, [timestamps]);

  const totalEDTime = useMemo(() => {
    const triage = timestamps.find(e => e.id==="triage")?.time;
    const dispo  = timestamps.find(e => e.id==="disposition")?.time;
    const diff = calcMins(triage, dispo);
    if (diff===null) return null;
    const h=Math.floor(diff/60), m=diff%60;
    return h>0 ? `${h}h ${m}m total ED time` : `${m}m total ED time`;
  }, [timestamps]);

  const stampedCount = timestamps.filter(e => !!e.time).length;

  const d2pColor = doorToPhysician
    ? doorToPhysician.mins<=30 ? "var(--qn-green)"
      : doorToPhysician.mins<=60 ? "var(--qn-gold)"
      : "var(--qn-coral)"
    : null;
  const d2pBorder = doorToPhysician
    ? doorToPhysician.mins<=30 ? "rgba(61,255,160,.3)"
      : doorToPhysician.mins<=60 ? "rgba(245,200,66,.3)"
      : "rgba(255,107,107,.3)"
    : null;
  const d2pBg = doorToPhysician
    ? doorToPhysician.mins<=30 ? "rgba(61,255,160,.08)"
      : doorToPhysician.mins<=60 ? "rgba(245,200,66,.08)"
      : "rgba(255,107,107,.08)"
    : null;

  return (
    <div style={{ marginBottom:14, borderRadius:12, background:"rgba(8,22,40,.5)",
      border:"1px solid rgba(42,79,122,.35)", overflow:"hidden" }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 14px",
        cursor:"pointer", borderBottom:open?"1px solid rgba(42,79,122,.3)":"none" }}
        onClick={() => setOpen(o => !o)}>
        <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
          fontSize:13, color:"var(--qn-txt2)", flex:1 }}>
          Encounter Timeline
        </span>
        {!open && (
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            {doorToPhysician && (
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:d2pColor, background:d2pBg, border:`1px solid ${d2pBorder}`,
                borderRadius:4, padding:"2px 8px" }}>
                ⏱ {doorToPhysician.label}
              </span>
            )}
            {totalEDTime && (
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
                color:"rgba(107,158,200,.5)" }}>{totalEDTime}</span>
            )}
            {!doorToPhysician && stampedCount > 0 && (
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
                color:"rgba(107,158,200,.5)" }}>{stampedCount}/{timestamps.length} stamped</span>
            )}
          </div>
        )}
        <span style={{ color:"var(--qn-txt4)", fontSize:11 }}>{open?"▲":"▼"}</span>
      </div>

      {open && (
        <div style={{ padding:"10px 14px" }}>
          {/* Metric chips */}
          {(doorToPhysician||totalEDTime) && (
            <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap" }}>
              {doorToPhysician && (
                <div style={{ padding:"5px 12px", borderRadius:7,
                  background:d2pBg, border:`1px solid ${d2pBorder}` }}>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                    fontWeight:700, color:d2pColor }}>⏱ {doorToPhysician.label}</span>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
                    color:"rgba(107,158,200,.5)", marginLeft:8 }}>
                    {doorToPhysician.mins<=30?"✓ within target":doorToPhysician.mins<=60?"near target":"above target"}
                  </span>
                </div>
              )}
              {totalEDTime && (
                <div style={{ padding:"5px 12px", borderRadius:7,
                  background:"rgba(59,158,255,.07)", border:"1px solid rgba(59,158,255,.25)" }}>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:"var(--qn-blue)" }}>
                    🕐 {totalEDTime}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Column headers */}
          <div style={{ display:"grid", gridTemplateColumns:"160px 110px 1fr", gap:8, marginBottom:6 }}>
            {["Event","Time","Notes"].map(h => (
              <span key={h} style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
                fontWeight:700, color:"var(--qn-txt4)", letterSpacing:1, textTransform:"uppercase" }}>
                {h}
              </span>
            ))}
          </div>

          {timestamps.map(event => (
            <EventRow key={event.id} event={event}
              onChange={(field, value) => updateEvent(event.id, field, value)}
              onNow={() => stampNow(event.id)} />
          ))}

          <div style={{ display:"flex", justifyContent:"flex-end", marginTop:10 }}>
            <button onClick={() => setTimestamps(prev => prev.map(e => ({...e,time:"",notes:""})))}
              style={{ padding:"4px 10px", borderRadius:6, cursor:"pointer",
                fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
                border:"1px solid rgba(42,79,122,.35)", background:"transparent",
                color:"var(--qn-txt4)" }}>
              Clear all
            </button>
          </div>
          <div style={{ marginTop:8, fontFamily:"'JetBrains Mono',monospace", fontSize:7,
            color:"rgba(107,158,200,.4)", letterSpacing:.4 }}>
            Door-to-physician ≤30 min = green · 31–60 min = yellow · &gt;60 min = red · CMS ED quality metrics
          </div>
        </div>
      )}
    </div>
  );
}