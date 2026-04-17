// AcuteStrokeTab — live clocks, tPA window status, VAN screen, ASPECTS,
// weight-based dosing, and thrombectomy criteria (standard + DAWN + DEFUSE-3).

import React, { useCallback } from "react";

const T = {
  bg:"#030b18", panel:"rgba(8,24,48,0.55)", card:"rgba(4,14,32,0.6)",
  up:"rgba(20,55,100,0.3)", border:"rgba(255,255,255,0.08)",
  blue:"#3b9eff", teal:"#00e5c0", gold:"#f5c842",
  coral:"#ff6b6b", orange:"#ff9f43", purple:"#b06aff",
  txt:"#e8f0fe", txt2:"#8aaccc", txt3:"#4a6a8a", txt4:"#2e4a6a",
};

function fmtElapsed(ms) {
  if (!ms || ms < 0) return null;
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2,"0")}m`;
  return `${m}m ${String(ss).padStart(2,"0")}s`;
}
function clockCol(elapsed, targetMs) {
  if (!elapsed || !targetMs) return T.txt4;
  const p = elapsed / targetMs;
  if (p >= 1) return T.coral;
  if (p >= 0.75) return T.gold;
  return T.teal;
}

function ClockCard({ label, elapsed, targetMs, note, tick }) {
  const col = clockCol(elapsed, targetMs);
  const pct = elapsed && targetMs ? Math.min((elapsed / targetMs) * 100, 100) : 0;
  return (
    <div style={{ padding:"14px 16px", borderRadius:12, background:T.card,
      border:`1px solid ${col}33`, borderTop:`2px solid ${col}`,
      display:"flex", flexDirection:"column", gap:8, flex:"1 1 160px", minWidth:160,
      backdropFilter:"blur(16px)" }}>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.txt4,
        letterSpacing:"1.2px", textTransform:"uppercase" }}>{label}</div>
      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:900,
        color: elapsed ? col : T.txt4, lineHeight:1 }}>
        {elapsed ? fmtElapsed(elapsed) : "\u2014"}
      </div>
      {targetMs && (
        <div style={{ height:4, borderRadius:2, background:"rgba(255,255,255,0.06)", overflow:"hidden" }}>
          <div style={{ height:"100%", borderRadius:2, background:col,
            width:`${pct}%`, transition:"width .5s" }} />
        </div>
      )}
      {note && <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:T.txt4 }}>{note}</div>}
    </div>
  );
}

function CriteriaRow({ label, met, note }) {
  return (
    <div style={{ display:"flex", alignItems:"flex-start", gap:8, padding:"5px 0" }}>
      <div style={{ width:18, height:18, borderRadius:4, flexShrink:0, marginTop:1,
        background: met ? `${T.teal}20` : `${T.coral}12`,
        border:`1.5px solid ${met ? T.teal+"55" : T.coral+"33"}`,
        display:"flex", alignItems:"center", justifyContent:"center" }}>
        <span style={{ fontSize:10, color: met ? T.teal : T.coral }}>{met ? "\u2713" : "\u2715"}</span>
      </div>
      <div>
        <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
          color: met ? T.txt2 : T.txt4 }}>{label}</span>
        {note && <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:T.txt4,
          marginTop:1 }}>{note}</div>}
      </div>
    </div>
  );
}

export default function AcuteStrokeTab({
  tick, doorTime, setDoorTime, lkwClock, setLkwClock,
  acuteWeight, setAcuteWeight, acuteExcl3h, setAcuteExcl3h,
  acuteExcl4h, setAcuteExcl4h, vanScreen, setVanScreen,
  acuteAspects, setAcuteAspects, nihssTotal,
  EXCL_3H_ACUTE, EXCL_4H_ACUTE, ASPECTS_ACUTE,
}) {
  const now         = Date.now();
  const doorElapsed = doorTime ? now - doorTime : null;
  const lkwElapsed  = lkwClock ? now - lkwClock : null;
  const lkwMins     = lkwElapsed ? Math.floor(lkwElapsed / 60000) : null;
  const in3h        = lkwMins !== null && lkwMins <= 180;
  const in4h        = lkwMins !== null && lkwMins <= 270;
  const in6h        = lkwMins !== null && lkwMins <= 360;

  const has3hExcl   = Object.values(acuteExcl3h).some(Boolean);
  const has4hExcl   = Object.values(acuteExcl4h).some(Boolean) || nihssTotal > 25;

  const tpaEligible3h = !has3hExcl && in3h;
  const tpaEligible4h = !has3hExcl && !has4hExcl && in4h;
  const tpaEligible   = tpaEligible3h || tpaEligible4h;

  const wtNum       = parseFloat(acuteWeight) || 0;
  const tpaDose     = wtNum > 0 ? Math.min(wtNum * 0.9, 90) : null;
  const tpaBolus    = tpaDose ? Math.round(tpaDose * 0.1 * 10) / 10 : null;
  const tpaInfusion = tpaDose ? Math.round(tpaDose * 0.9 * 10) / 10 : null;

  const aspectsScore  = 10 - Object.values(acuteAspects).filter(Boolean).length;
  const vanPositive   = vanScreen.v || vanScreen.a || vanScreen.n;
  const lvoLikelihood = vanPositive && nihssTotal >= 6 ? "High" : vanPositive || nihssTotal >= 10 ? "Moderate" : "Low";
  const lvoColor      = lvoLikelihood === "High" ? T.coral : lvoLikelihood === "Moderate" ? T.gold : T.teal;
  const aspectsColor  = aspectsScore >= 8 ? T.teal : aspectsScore >= 6 ? T.gold : T.coral;

  const stdEligible    = in6h && nihssTotal >= 6 && aspectsScore >= 6 && !has3hExcl;
  const dawnEligible   = lkwMins !== null && lkwMins > 360 && lkwMins <= 1440 && nihssTotal >= 10;
  const defuseEligible = lkwMins !== null && lkwMins > 360 && lkwMins <= 960 && nihssTotal >= 6;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>

      {/* ── CLOCKS ─────────────────────────────────── */}
      <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
        {[
          {label:"Door Time",      ts:doorTime, set:setDoorTime},
          {label:"Last Known Well", ts:lkwClock, set:setLkwClock},
        ].map(({label, ts, set}) => (
          <div key={label} style={{ padding:"12px 16px", borderRadius:12, background:T.panel,
            border:`1px solid ${T.border}`, flex:"1 1 200px", backdropFilter:"blur(16px)" }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.txt4,
              letterSpacing:"1.2px", textTransform:"uppercase", marginBottom:8 }}>{label}</div>
            {ts ? (
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:13,
                  fontWeight:700, color:T.txt }}>
                  {new Date(ts).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false})}
                </span>
                <button onClick={() => set(null)}
                  style={{ background:"none", border:"none", cursor:"pointer",
                    color:T.txt4, fontSize:12, padding:"1px 4px" }}>✕</button>
              </div>
            ) : (
              <button onClick={() => set(Date.now())}
                style={{ padding:"6px 14px", borderRadius:7, cursor:"pointer",
                  border:`1px solid ${T.blue}55`, background:`${T.blue}12`,
                  color:T.blue, fontFamily:"'DM Sans',sans-serif",
                  fontSize:12, fontWeight:600 }}>
                Set to Now
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Clock cards */}
      <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
        <ClockCard label="Door to CT" elapsed={doorElapsed} targetMs={25*60*1000} note="Target: ≤25 min (JC standard)" tick={tick} />
        <ClockCard label="Door to Needle" elapsed={doorElapsed} targetMs={60*60*1000} note="Target: ≤60 min (JC standard)" tick={tick} />
        <ClockCard label="Since Last Known Well" elapsed={lkwElapsed} targetMs={270*60*1000} note="tPA window closes at 4.5h" tick={tick} />
        <ClockCard label="Thrombectomy Window" elapsed={lkwElapsed} targetMs={360*60*1000} note="Standard MT window: 6h from LKW" tick={tick} />
      </div>

      {/* Window status */}
      {lkwElapsed && (
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {[
            {label:"3h tPA window",     open:in3h,  time:"180 min"},
            {label:"4.5h tPA window",   open:in4h,  time:"270 min"},
            {label:"6h MT window",      open:in6h,  time:"360 min"},
            {label:"Extended MT (DAWN)",open:lkwMins<=1440, time:"24h"},
          ].map(w => (
            <div key={w.label} style={{ display:"flex", alignItems:"center", gap:7,
              padding:"6px 12px", borderRadius:20,
              background: w.open ? `${T.teal}10` : `${T.coral}08`,
              border:`1px solid ${w.open ? T.teal+"33" : T.coral+"25"}`,
              backdropFilter:"blur(8px)" }}>
              <div style={{ width:7, height:7, borderRadius:"50%",
                background: w.open ? T.teal : T.coral }} />
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                color: w.open ? T.teal : T.txt4, fontWeight:600 }}>
                {w.label}
              </span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.txt4 }}>
                {w.open ? "OPEN" : "CLOSED"}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── tPA ELIGIBILITY + DOSING ───────────────── */}
      <div className="sa-panel-glass">
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
          <div style={{ width:10, height:10, borderRadius:"50%", flexShrink:0,
            background: tpaEligible ? T.teal : lkwClock ? T.coral : T.txt4 }} />
          <div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:700,
              color: tpaEligible ? T.teal : lkwClock ? T.coral : T.txt4 }}>
              {!lkwClock ? "Set last known well time above"
                : tpaEligible3h ? "tPA eligible — within 3-hour window"
                : tpaEligible4h ? "tPA eligible — within 4.5-hour window (additional exclusions apply)"
                : has3hExcl     ? "Contraindicated — absolute exclusion present"
                : !in4h         ? "Window closed — beyond 4.5 hours from LKW"
                : "Not eligible — exclusion criteria met"}
            </div>
            {lkwMins !== null && (
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.txt4, marginTop:3 }}>
                {lkwMins}m since LKW · NIHSS {nihssTotal}
              </div>
            )}
          </div>
        </div>

        {/* Weight + dose */}
        <div style={{ display:"flex", gap:14, alignItems:"flex-start", flexWrap:"wrap", marginBottom:14 }}>
          <div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.txt4,
              letterSpacing:"1px", textTransform:"uppercase", marginBottom:6 }}>Weight (kg)</div>
            <input type="number" inputMode="decimal" placeholder="kg"
              value={acuteWeight} onChange={e => setAcuteWeight(e.target.value)}
              style={{ width:80, background:"rgba(4,14,32,0.7)", border:`1px solid ${T.border}`, borderRadius:8,
                padding:"8px 10px", color:T.txt, fontFamily:"'JetBrains Mono',monospace",
                fontSize:16, fontWeight:700, outline:"none", textAlign:"center" }} />
          </div>
          {tpaDose && (
            <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
              {[
                {label:"Total dose", val:`${tpaDose.toFixed(1)} mg`},
                {label:"IV bolus (10% over 1 min)", val:`${tpaBolus} mg`},
                {label:"Infusion (90% over 60 min)", val:`${tpaInfusion} mg`},
              ].map(d => (
                <div key={d.label}>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.txt4,
                    letterSpacing:"1px", textTransform:"uppercase", marginBottom:4 }}>{d.label}</div>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:900,
                    color:T.blue }}>{d.val}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick exclusion checklists */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }} className="sa-2col">
          {[
            {title:"3h — Absolute Exclusions", items:EXCL_3H_ACUTE, state:acuteExcl3h, set:setAcuteExcl3h, col:T.coral},
            {title:"4.5h — Additional Exclusions", items:EXCL_4H_ACUTE, state:acuteExcl4h, set:setAcuteExcl4h, col:T.orange},
          ].map(({title, items, state, set, col}) => (
            <div key={title}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:col,
                letterSpacing:"1.2px", textTransform:"uppercase", marginBottom:8 }}>{title}</div>
              {items.map(ex => {
                const ck = !!state[ex.id];
                return (
                  <div key={ex.id} onClick={() => set(p => ({...p,[ex.id]:!p[ex.id]}))}
                    className={`sa-chk-exc${ck?" on":""}`}>
                    <div className="sa-chk-box">{ck&&<span style={{color:"white",fontSize:10,fontWeight:900}}>✕</span>}</div>
                    <span className="sa-chk-label" style={{fontSize:11,color:ck?T.txt4:T.txt2}}>{ex.label}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* ── VAN SCREEN + LVO ───────────────────────── */}
      <div className="sa-panel-glass">
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12, flexWrap:"wrap", gap:10 }}>
          <div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.blue,
              letterSpacing:"1.2px", textTransform:"uppercase", marginBottom:3 }}>LVO Screen</div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:900, color:lvoColor }}>
              {lvoLikelihood} Likelihood
            </div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:T.txt4, marginTop:2 }}>
              VAN+ and NIHSS ≥6 indicates high probability of large vessel occlusion
            </div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:900,
              color: nihssTotal >= 6 ? T.blue : T.txt4 }}>{nihssTotal}</div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.txt4,
              textTransform:"uppercase", letterSpacing:"1px" }}>NIHSS</div>
          </div>
        </div>

        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16 }}>
          {[
            {key:"v", lbl:"V — Vision",  desc:"Gaze deviation or hemianopia"},
            {key:"a", lbl:"A — Aphasia", desc:"Word-finding or comprehension deficit"},
            {key:"n", lbl:"N — Neglect", desc:"Hemispatial inattention or extinction"},
          ].map(({key, lbl, desc}) => {
            const on = vanScreen[key];
            return (
              <div key={key} onClick={() => setVanScreen(p => ({...p,[key]:!p[key]}))}
                style={{ flex:"1 1 140px", padding:"12px 14px", borderRadius:10,
                  background: on ? `${T.blue}14` : T.up,
                  border:`1px solid ${on ? T.blue+"55" : T.border}`,
                  cursor:"pointer", transition:"all .15s", backdropFilter:"blur(8px)" }}>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:900,
                  color: on ? T.blue : T.txt4 }}>{lbl.split(" — ")[0]}</div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600,
                  color: on ? T.txt : T.txt3, marginTop:2 }}>{lbl.split(" — ")[1]}</div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:T.txt4,
                  marginTop:3 }}>{desc}</div>
              </div>
            );
          })}
        </div>

        {/* ASPECTS */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.blue,
            letterSpacing:"1.2px", textTransform:"uppercase" }}>
            ASPECTS — MCA Territory (mark involved regions)
          </div>
          <div style={{ display:"flex", alignItems:"baseline", gap:6 }}>
            <span style={{ fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:900,
              color:aspectsColor }}>{aspectsScore}</span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.txt4 }}>
              / 10 &nbsp; {aspectsScore >= 6 ? "favorable" : "poor prognosis"}
            </span>
          </div>
        </div>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {ASPECTS_ACUTE.map(r => {
            const on = !!acuteAspects[r.id];
            return (
              <div key={r.id} onClick={() => setAcuteAspects(p => ({...p,[r.id]:!p[r.id]}))}
                style={{ display:"flex", flexDirection:"column", alignItems:"center",
                  padding:"8px 12px", borderRadius:8, cursor:"pointer",
                  background: on ? `${T.coral}12` : T.up,
                  border:`1px solid ${on ? T.coral+"55" : T.border}`,
                  minWidth:56, transition:"all .12s" }}>
                <span style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:900,
                  color: on ? T.coral : T.txt3 }}>{r.label}</span>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9, color:T.txt4,
                  textAlign:"center", lineHeight:1.3, marginTop:2 }}>{r.desc}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── THROMBECTOMY CRITERIA ───────────────────── */}
      <div className="sa-panel-glass">
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color: stdEligible ? T.teal : T.txt4,
          letterSpacing:"1.2px", textTransform:"uppercase", marginBottom:10 }}>
          Standard Window — ≤6h from LKW
        </div>
        <CriteriaRow label="LKW ≤6 hours ago (360 min)" met={!!in6h}
          note={lkwMins !== null ? `${lkwMins} min since LKW` : "Set LKW above"} />
        <CriteriaRow label="NIHSS ≥6" met={nihssTotal >= 6}
          note={`Current NIHSS: ${nihssTotal}`} />
        <CriteriaRow label="ASPECTS ≥6" met={aspectsScore >= 6}
          note={`Current ASPECTS: ${aspectsScore}/10`} />
        <CriteriaRow label="No absolute tPA contraindications" met={!has3hExcl} />
        <div style={{ marginTop:10, padding:"8px 12px", borderRadius:8,
          background: stdEligible ? `${T.teal}10` : `${T.coral}08`,
          border:`1px solid ${stdEligible ? T.teal+"33" : T.coral+"25"}` }}>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:700,
            color: stdEligible ? T.teal : T.txt4 }}>
            {!lkwClock ? "Set LKW time first" : stdEligible ? "Meets standard MT criteria — consider neurovascular consultation" : "Does not meet standard criteria — evaluate extended window"}
          </span>
        </div>
      </div>

      {/* Extended windows */}
      <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
        {[
          {
            title:"DAWN Trial (6–24h)", eligible:dawnEligible,
            criteria:[
              {label:"LKW 6–24h ago", met:lkwMins!==null && lkwMins>360 && lkwMins<=1440},
              {label:"NIHSS ≥10", met:nihssTotal>=10, note:`NIHSS ${nihssTotal}`},
              {label:"Mismatch on imaging (CTP/MRI)", met:null, note:"Requires imaging"},
            ],
          },
          {
            title:"DEFUSE-3 (6–16h)", eligible:defuseEligible,
            criteria:[
              {label:"LKW 6–16h ago", met:lkwMins!==null && lkwMins>360 && lkwMins<=960},
              {label:"NIHSS ≥6", met:nihssTotal>=6, note:`NIHSS ${nihssTotal}`},
              {label:"Ischemic core <70 mL", met:null, note:"Requires CTP"},
              {label:"Mismatch ratio ≥1.8", met:null, note:"Requires CTP/MRI"},
            ],
          },
        ].map(({title, eligible, criteria}) => (
          <div key={title} className="sa-panel-glass" style={{ flex:"1 1 260px",
            borderColor: eligible ? T.orange+"44" : T.border }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color: eligible ? T.orange : T.txt4,
              letterSpacing:"1.2px", textTransform:"uppercase", marginBottom:8 }}>
              {title}
            </div>
            {criteria.map((c, i) => (
              <CriteriaRow key={i} label={c.label}
                met={c.met === null ? false : c.met} note={c.note} />
            ))}
          </div>
        ))}
      </div>

      <div className="sa-card">
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt4, lineHeight:1.6 }}>
          <strong style={{color:T.txt3}}>Posterior circulation (basilar):</strong> Consider MT regardless of time from onset
          with progressive or fluctuating deficits, basilar occlusion confirmed on CTA,
          and NIHSS in any range. No established upper time limit. Neurovascular consultation recommended.
        </div>
      </div>
    </div>
  );
}