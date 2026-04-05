import { useState, useEffect, useRef, useCallback } from "react";

const T = {
  bg:"#050f1e", panel:"#081628", card:"#0b1e36",
  teal:"#00e5c0", gold:"#f5c842", red:"#ff4444", coral:"#ff6b6b",
  green:"#3dffa0", blue:"#3b9eff", purple:"#9b6dff", orange:"#ff9f43",
  txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
};

function pad(n) { return String(n).padStart(2, "0"); }
function fmtTime(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

const DRUGS = [
  { id:"epi",    name:"Epinephrine",  dose:"1mg IV/IO",  interval:180, color:T.orange },
  { id:"amio",   name:"Amiodarone",   dose:"300mg IV",   interval:300, color:T.purple },
  { id:"bicarb", name:"Bicarb",       dose:"1 mEq/kg",   interval:600, color:T.blue   },
  { id:"ca",     name:"Calcium Cl",   dose:"1g IV",      interval:600, color:T.teal   },
];

const RHYTHMS = ["VF","Pulseless VT","PEA","Asystole","Unknown"];

function CircleTimer({ elapsed, total, color, label, size = 90 }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const progress = Math.min(elapsed / total, 1);
  const urgent = progress >= 0.75;
  const overdue = progress >= 1;
  const dashOffset = circ * (1 - progress);

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
      <div style={{ position:"relative", width:size, height:size }}>
        <svg width={size} height={size} style={{ transform:"rotate(-90deg)" }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none"
            stroke="rgba(42,79,122,0.3)" strokeWidth={6} />
          <circle cx={size/2} cy={size/2} r={r} fill="none"
            stroke={overdue ? T.red : urgent ? T.gold : color}
            strokeWidth={6} strokeDasharray={circ}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{ transition:"stroke-dashoffset .5s linear, stroke .3s" }}
          />
        </svg>
        <div style={{
          position:"absolute", inset:0,
          display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center",
        }}>
          <span style={{
            fontFamily:"JetBrains Mono", fontSize:size > 80 ? 14 : 11, fontWeight:700,
            color: overdue ? T.red : urgent ? T.gold : color,
          }}>{fmtTime(Math.max(0, total - elapsed))}</span>
        </div>
      </div>
      <span style={{ fontFamily:"DM Sans", fontSize:10, color:T.txt3, textAlign:"center" }}>{label}</span>
    </div>
  );
}

function PulseRing({ active }) {
  return (
    <div style={{ position:"relative", display:"inline-flex" }}>
      {active && (
        <span style={{
          position:"absolute", inset:"-6px",
          borderRadius:"50%",
          border:`2px solid ${T.red}`,
          animation:"resus-ping 1s ease-out infinite",
        }} />
      )}
      <span style={{
        display:"inline-block", width:14, height:14,
        borderRadius:"50%",
        background: active ? T.red : "rgba(42,79,122,0.4)",
        boxShadow: active ? `0 0 10px ${T.red}80` : "none",
        transition:"all .3s",
      }} />
    </div>
  );
}

export default function ResuscitationTimer({ onClose }) {
  const [running,       setRunning]       = useState(false);
  const [elapsed,       setElapsed]       = useState(0);      // total code time (secs)
  const [cprElapsed,    setCprElapsed]    = useState(0);      // secs since last CPR cycle start
  const [pulseElapsed,  setPulseElapsed]  = useState(0);      // secs since last pulse check
  const [drugTimers,    setDrugTimers]    = useState(() =>
    Object.fromEntries(DRUGS.map(d => [d.id, 0]))             // secs since last given
  );
  const [shocks,        setShocks]        = useState(0);
  const [rhythm,        setRhythm]        = useState("Unknown");
  const [rosc,          setRosc]          = useState(false);
  const [log,           setLog]           = useState([]);
  const [drugGiven,     setDrugGiven]     = useState({});     // flash state

  const CPR_CYCLE  = 120;  // 2-minute CPR cycles
  const PULSE_INT  = 120;  // pulse check every 2 min

  const intervalRef = useRef(null);

  const addLog = useCallback((msg, color = T.teal) => {
    const time = elapsed;
    setLog(prev => [{ msg, time, color, id: Date.now() }, ...prev].slice(0, 30));
  }, [elapsed]);

  useEffect(() => {
    if (running && !rosc) {
      intervalRef.current = setInterval(() => {
        setElapsed(e => e + 1);
        setCprElapsed(c => c + 1);
        setPulseElapsed(p => p + 1);
        setDrugTimers(prev => {
          const next = {};
          DRUGS.forEach(d => { next[d.id] = (prev[d.id] || 0) + 1; });
          return next;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, rosc]);

  // Auto-alerts via log
  const prevCprRef   = useRef(0);
  const prevPulseRef = useRef(0);
  const prevDrugRef  = useRef({});

  useEffect(() => {
    if (!running) return;
    // CPR cycle complete
    if (cprElapsed > 0 && cprElapsed % CPR_CYCLE === 0 && cprElapsed !== prevCprRef.current) {
      prevCprRef.current = cprElapsed;
      addLog("⚡ CPR cycle complete — consider rhythm check", T.gold);
    }
    // Pulse check
    if (pulseElapsed > 0 && pulseElapsed % PULSE_INT === 0 && pulseElapsed !== prevPulseRef.current) {
      prevPulseRef.current = pulseElapsed;
      addLog("👆 Time for a pulse check!", T.orange);
    }
    // Drug alerts
    DRUGS.forEach(d => {
      const t = drugTimers[d.id];
      if (t > 0 && t % d.interval === 0 && t !== prevDrugRef.current[d.id]) {
        prevDrugRef.current = { ...prevDrugRef.current, [d.id]: t };
        addLog(`💊 ${d.name} DUE — ${d.dose}`, d.color);
      }
    });
  }, [elapsed, cprElapsed, pulseElapsed, drugTimers, running, addLog]);

  function handleStart() {
    if (!running && elapsed === 0) addLog("🚨 Code started", T.red);
    setRunning(r => !r);
  }

  function handleReset() {
    setRunning(false);
    setElapsed(0);
    setCprElapsed(0);
    setPulseElapsed(0);
    setDrugTimers(Object.fromEntries(DRUGS.map(d => [d.id, 0])));
    setShocks(0);
    setRosc(false);
    setLog([]);
    prevCprRef.current = 0;
    prevPulseRef.current = 0;
    prevDrugRef.current = {};
  }

  function handleCPRReset() {
    setCprElapsed(0);
    addLog("🔄 CPR cycle reset", T.teal);
  }

  function handlePulseCheck() {
    setPulseElapsed(0);
    addLog("👆 Pulse check performed", T.blue);
  }

  function handleShock() {
    const n = shocks + 1;
    setShocks(n);
    setCprElapsed(0);
    addLog(`⚡ SHOCK #${n} delivered — ${rhythm} — resuming CPR`, T.red);
  }

  function handleDrugGiven(drug) {
    setDrugTimers(prev => ({ ...prev, [drug.id]: 0 }));
    setDrugGiven(prev => ({ ...prev, [drug.id]: true }));
    setTimeout(() => setDrugGiven(prev => ({ ...prev, [drug.id]: false })), 1200);
    addLog(`💊 ${drug.name} ${drug.dose} given`, drug.color);
  }

  function handleROSC() {
    setRunning(false);
    setRosc(true);
    addLog(`✅ ROSC achieved at ${fmtTime(elapsed)}`, T.green);
  }

  const shockable = rhythm === "VF" || rhythm === "Pulseless VT";
  const urgentDrugs = DRUGS.filter(d => drugTimers[d.id] >= d.interval);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes resus-ping { 0%{transform:scale(1);opacity:1} 100%{transform:scale(2);opacity:0} }
        @keyframes resus-flash { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .resus-urgent { animation: resus-flash 0.6s ease-in-out 3; }
      `}</style>

      <div style={{
        fontFamily:"DM Sans, sans-serif", color:T.txt,
        background:T.bg, borderRadius:16,
        border:`1px solid rgba(42,79,122,0.4)`,
        overflow:"hidden", display:"flex", flexDirection:"column",
        maxWidth:760, margin:"0 auto",
        boxShadow:`0 24px 80px rgba(0,0,0,0.7), 0 0 40px ${rosc ? T.green : T.red}18`,
      }}>

        {/* ── Header ── */}
        <div style={{
          background:T.panel, borderBottom:"1px solid rgba(42,79,122,0.4)",
          padding:"12px 16px", display:"flex", alignItems:"center", gap:12,
        }}>
          <PulseRing active={running && !rosc} />
          <span style={{ fontFamily:"JetBrains Mono", fontSize:10, fontWeight:700, color:T.coral, letterSpacing:2 }}>RESUSCITATION</span>
          <div style={{ flex:1 }} />
          {rosc && (
            <span style={{ fontFamily:"JetBrains Mono", fontSize:10, fontWeight:700,
              padding:"3px 10px", borderRadius:20, background:`${T.green}18`,
              border:`1px solid ${T.green}45`, color:T.green }}>✅ ROSC</span>
          )}
          {onClose && (
            <button onClick={onClose} style={{
              background:"rgba(42,79,122,0.3)", border:"1px solid rgba(42,79,122,0.5)",
              borderRadius:7, color:T.txt3, cursor:"pointer",
              fontFamily:"DM Sans", fontSize:13, fontWeight:600, padding:"3px 10px",
            }}>✕</button>
          )}
        </div>

        <div style={{ display:"flex", gap:0 }}>

          {/* ── Left: Main controls ── */}
          <div style={{ flex:"1 1 0", padding:"16px", display:"flex", flexDirection:"column", gap:14, borderRight:"1px solid rgba(42,79,122,0.3)" }}>

            {/* Total code time */}
            <div style={{ textAlign:"center" }}>
              <div style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.txt4, letterSpacing:2, textTransform:"uppercase", marginBottom:4 }}>Code Time</div>
              <div style={{
                fontFamily:"JetBrains Mono", fontSize:52, fontWeight:700, lineHeight:1,
                color: rosc ? T.green : running ? T.coral : T.txt2,
                textShadow: running && !rosc ? `0 0 20px ${T.red}40` : "none",
                transition:"color .3s",
              }}>{fmtTime(elapsed)}</div>
            </div>

            {/* Start / Stop / Reset */}
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={handleStart} disabled={rosc} style={{
                flex:2, fontFamily:"DM Sans", fontWeight:700, fontSize:14,
                padding:"11px", borderRadius:10, cursor:rosc?"not-allowed":"pointer",
                border:`1px solid ${running ? T.gold+"55" : T.red+"55"}`,
                background: running ? `${T.gold}14` : `${T.red}14`,
                color: running ? T.gold : T.red,
                opacity: rosc ? 0.4 : 1, transition:"all .15s",
              }}>{running ? "⏸ Pause" : elapsed === 0 ? "🚨 Start Code" : "▶ Resume"}</button>
              <button onClick={handleReset} style={{
                flex:1, fontFamily:"DM Sans", fontWeight:600, fontSize:12,
                padding:"11px", borderRadius:10, cursor:"pointer",
                border:"1px solid rgba(42,79,122,0.4)",
                background:"rgba(14,37,68,0.6)", color:T.txt3,
              }}>Reset</button>
            </div>

            {/* Rhythm selector */}
            <div>
              <div style={{ fontFamily:"JetBrains Mono", fontSize:8, color:T.txt4, letterSpacing:1.5, textTransform:"uppercase", marginBottom:6 }}>Rhythm</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                {RHYTHMS.map(r => (
                  <button key={r} onClick={() => setRhythm(r)} style={{
                    fontFamily:"JetBrains Mono", fontSize:9, fontWeight:700,
                    padding:"4px 10px", borderRadius:20, cursor:"pointer",
                    border:`1px solid ${rhythm===r ? (r==="VF"||r==="Pulseless VT" ? T.red+"60" : T.blue+"55") : "rgba(42,79,122,0.35)"}`,
                    background: rhythm===r ? (r==="VF"||r==="Pulseless VT" ? `${T.red}14` : `${T.blue}14`) : "transparent",
                    color: rhythm===r ? (r==="VF"||r==="Pulseless VT" ? T.red : T.blue) : T.txt3,
                    transition:"all .12s",
                  }}>{r}</button>
                ))}
              </div>
            </div>

            {/* Timers row */}
            <div style={{ display:"flex", justifyContent:"space-around", padding:"10px 0" }}>
              <CircleTimer elapsed={cprElapsed} total={CPR_CYCLE} color={T.teal} label="CPR Cycle" />
              <CircleTimer elapsed={pulseElapsed} total={PULSE_INT} color={T.blue} label="Pulse Check" />
            </div>

            {/* CPR + Pulse actions */}
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={handleCPRReset} style={{
                flex:1, fontFamily:"DM Sans", fontWeight:700, fontSize:12,
                padding:"9px", borderRadius:9, cursor:"pointer",
                border:`1px solid ${T.teal}45`, background:`${T.teal}10`, color:T.teal,
              }}>🔄 New CPR Cycle</button>
              <button onClick={handlePulseCheck} style={{
                flex:1, fontFamily:"DM Sans", fontWeight:700, fontSize:12,
                padding:"9px", borderRadius:9, cursor:"pointer",
                border:`1px solid ${T.blue}45`, background:`${T.blue}10`, color:T.blue,
              }}>👆 Pulse Check</button>
            </div>

            {/* Shock button */}
            <button onClick={handleShock} disabled={!running || rosc} style={{
              fontFamily:"DM Sans", fontWeight:700, fontSize:14,
              padding:"12px", borderRadius:10, cursor:(!running||rosc)?"not-allowed":"pointer",
              border:`2px solid ${shockable ? T.red+"80" : "rgba(42,79,122,0.3)"}`,
              background: shockable ? `${T.red}16` : "rgba(14,37,68,0.4)",
              color: shockable ? T.red : T.txt4,
              opacity:(!running||rosc)?0.4:1, transition:"all .15s",
              display:"flex", alignItems:"center", justifyContent:"center", gap:8,
            }}>
              <span style={{ fontSize:18 }}>⚡</span>
              <span>SHOCK #{shocks + 1}</span>
              {shocks > 0 && (
                <span style={{ fontFamily:"JetBrains Mono", fontSize:10,
                  padding:"2px 8px", borderRadius:20, background:`${T.red}20`,
                  color:T.red, border:`1px solid ${T.red}40` }}>
                  {shocks} delivered
                </span>
              )}
            </button>

            {/* ROSC */}
            <button onClick={handleROSC} disabled={rosc} style={{
              fontFamily:"DM Sans", fontWeight:700, fontSize:13,
              padding:"10px", borderRadius:9,
              cursor:rosc?"not-allowed":"pointer",
              border:`1px solid ${T.green}45`, background:`${T.green}10`, color:T.green,
              opacity:rosc?0.5:1, transition:"all .15s",
            }}>✅ ROSC Achieved</button>

          </div>

          {/* ── Right: Drugs + Log ── */}
          <div style={{ flex:"1 1 0", padding:"16px", display:"flex", flexDirection:"column", gap:14 }}>

            {/* Drug timers */}
            <div>
              <div style={{ fontFamily:"JetBrains Mono", fontSize:8, color:T.txt4, letterSpacing:1.5, textTransform:"uppercase", marginBottom:8 }}>Medications</div>
              <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                {DRUGS.map(drug => {
                  const t = drugTimers[drug.id];
                  const overdue = t >= drug.interval;
                  const pct = Math.min(t / drug.interval, 1);
                  const flash = drugGiven[drug.id];
                  return (
                    <div key={drug.id} className={flash ? "resus-urgent" : ""} style={{
                      borderRadius:9, overflow:"hidden",
                      border:`1px solid ${overdue ? drug.color+"60" : "rgba(42,79,122,0.3)"}`,
                      background: overdue ? `${drug.color}0d` : "rgba(8,22,40,0.6)",
                      transition:"border-color .3s",
                    }}>
                      {/* Progress bar */}
                      <div style={{ height:3, background:"rgba(42,79,122,0.3)", position:"relative" }}>
                        <div style={{
                          position:"absolute", top:0, left:0, height:"100%",
                          width:`${pct * 100}%`,
                          background: overdue ? drug.color : `${drug.color}80`,
                          transition:"width .5s linear",
                        }} />
                      </div>
                      <div style={{ padding:"7px 10px", display:"flex", alignItems:"center", gap:8 }}>
                        <div style={{ flex:1 }}>
                          <div style={{ fontFamily:"DM Sans", fontWeight:700, fontSize:12, color:T.txt }}>
                            {drug.name}
                          </div>
                          <div style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.txt4 }}>{drug.dose}</div>
                        </div>
                        <div style={{ textAlign:"right" }}>
                          {overdue ? (
                            <div style={{ fontFamily:"JetBrains Mono", fontSize:10, fontWeight:700, color:drug.color }}>DUE NOW</div>
                          ) : (
                            <div style={{ fontFamily:"JetBrains Mono", fontSize:10, color:T.txt4 }}>
                              {fmtTime(drug.interval - t)}
                            </div>
                          )}
                          <div style={{ fontFamily:"JetBrains Mono", fontSize:8, color:T.txt4 }}>
                            {t > 0 ? `last: ${fmtTime(t)} ago` : "not given"}
                          </div>
                        </div>
                        <button onClick={() => handleDrugGiven(drug)} style={{
                          fontFamily:"DM Sans", fontWeight:700, fontSize:10,
                          padding:"5px 10px", borderRadius:7, cursor:"pointer",
                          border:`1px solid ${drug.color}50`,
                          background:`${drug.color}14`, color:drug.color,
                          flexShrink:0, transition:"all .12s",
                        }}>Given</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Event log */}
            <div style={{ flex:1, display:"flex", flexDirection:"column", minHeight:0 }}>
              <div style={{ fontFamily:"JetBrains Mono", fontSize:8, color:T.txt4, letterSpacing:1.5, textTransform:"uppercase", marginBottom:6 }}>
                Event Log
              </div>
              <div style={{
                flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:4,
                maxHeight:200,
              }}>
                {log.length === 0 && (
                  <div style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt4, fontStyle:"italic", padding:"8px 0" }}>
                    Events will appear here...
                  </div>
                )}
                {log.map(entry => (
                  <div key={entry.id} style={{
                    display:"flex", alignItems:"baseline", gap:8,
                    padding:"5px 8px", borderRadius:7,
                    background:"rgba(8,22,40,0.7)",
                    border:`1px solid ${entry.color}25`,
                    borderLeft:`3px solid ${entry.color}`,
                  }}>
                    <span style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.txt4, flexShrink:0 }}>
                      {fmtTime(entry.time)}
                    </span>
                    <span style={{ fontFamily:"DM Sans", fontSize:11, color:entry.color, fontWeight:600 }}>
                      {entry.msg}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Urgent alerts */}
            {urgentDrugs.length > 0 && running && (
              <div style={{
                borderRadius:9, padding:"8px 12px",
                background:`${T.red}0d`, border:`1px solid ${T.red}40`,
                display:"flex", flexDirection:"column", gap:4,
              }}>
                <div style={{ fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700, color:T.red, letterSpacing:1.5 }}>
                  ⚠ OVERDUE MEDICATIONS
                </div>
                {urgentDrugs.map(d => (
                  <div key={d.id} style={{ fontFamily:"DM Sans", fontSize:12, fontWeight:700, color:d.color }}>
                    {d.name} — {d.dose}
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>

        {/* ── Footer summary ── */}
        {elapsed > 0 && (
          <div style={{
            background:T.panel, borderTop:"1px solid rgba(42,79,122,0.3)",
            padding:"8px 16px", display:"flex", gap:20, flexWrap:"wrap",
          }}>
            {[
              { label:"Total Time",  val:fmtTime(elapsed),      color:T.txt2   },
              { label:"Shocks",      val:shocks,                 color:T.red    },
              { label:"Rhythm",      val:rhythm,                 color:T.blue   },
              { label:"Status",      val:rosc ? "ROSC" : running ? "Active" : "Paused",
                color: rosc ? T.green : running ? T.coral : T.gold },
            ].map(({ label, val, color }) => (
              <div key={label}>
                <div style={{ fontFamily:"JetBrains Mono", fontSize:7, color:T.txt4, letterSpacing:1.5, textTransform:"uppercase" }}>{label}</div>
                <div style={{ fontFamily:"JetBrains Mono", fontSize:13, fontWeight:700, color }}>{val}</div>
              </div>
            ))}
          </div>
        )}

      </div>
    </>
  );
}