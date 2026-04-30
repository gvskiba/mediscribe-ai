// ChestPainPanels.jsx — Notrya ChestPainHub UI components
// Micro-components, tab panels, bedside tools
// Constraints: no form, no localStorage, straight quotes, single react import

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  T, FF, HEART_ITEMS, heartStrata, TROPONIN_UNITS, HST, evalHST, calcTrop,
  calcEDACS, edacsRisk, WELLS_ITEMS, PERC_ITEMS, wellsInterp,
  ADDRS_ITEMS, addrsInterp, ACS_STEPS, dispositionRec,
  DDX_REF, DDX_TABS, SPESI_ITEMS, spesiInterp, calcGRACE, graceInterp,
} from "./ChestPainLogic";


// ═══ REUSABLE COMPONENTS ═════════════════════════════════════════════════════════
export function TabBtn({ tab, active, onClick }) {
  return (
    <button onClick={onClick}
      style={{ display:"flex", alignItems:"center", gap:5,
        padding:"7px 11px", borderRadius:9, cursor:"pointer", transition:"all .15s",
        border:`1.5px solid ${active ? tab.color+"cc" : "rgba(35,70,115,0.65)"}`,
        background:active ? `linear-gradient(135deg,${tab.color}24,${tab.color}0c)` : "rgba(14,28,58,0.80)",
        color:active ? tab.color : T.txt3, fontFamily:FF.sans, fontWeight:active ? 700 : 500, fontSize:11.5 }}>
      <span style={{ fontSize:13 }}>{tab.icon}</span>
      <span>{tab.label}</span>
    </button>
  );
}

export function ScoreOption({ item, val, selected, onSelect }) {
  const isSelected = selected === val;
  const opt = item.options.find(o => o.val === val);
  return (
    <button onClick={() => onSelect(val)}
      style={{ display:"flex", alignItems:"center", gap:10, width:"100%", padding:"8px 12px", borderRadius:8,
        cursor:"pointer", textAlign:"left", border:`1px solid ${isSelected ? item.color+"55" : "rgba(35,70,115,0.72)"}`,
        transition:"all .12s", marginBottom:4,
        background:isSelected ? `linear-gradient(135deg,${item.color}18,${item.color}08)` : "rgba(14,28,58,0.80)",
        borderLeft:`3px solid ${isSelected ? item.color : "rgba(35,70,115,0.65)"}` }}>
      <div style={{ width:24, height:24, borderRadius:"50%", flexShrink:0,
        display:"flex", alignItems:"center", justifyContent:"center",
        background:isSelected ? item.color : "rgba(18,40,80,0.7)", fontFamily:FF.mono, fontWeight:900,
        fontSize:11, color:isSelected ? "#050f1e" : T.txt4 }}>
        {val}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontFamily:FF.sans, fontWeight:600, fontSize:12, color:isSelected ? item.color : T.txt2 }}>
          {opt?.label}
        </div>
        {opt?.sub && <div style={{ fontFamily:FF.sans, fontSize:10,
          color:T.txt4, marginTop:1 }}>{opt.sub}</div>}
      </div>
    </button>
  );
}

export function InfoBox({ color, icon, title, children }) {
  return (
    <div style={{ padding:"10px 13px", borderRadius:9, marginBottom:8,
      background:`${color}0a`, border:`1px solid ${color}33`, borderLeft:`3px solid ${color}` }}>
      {title && (
        <div style={{ fontFamily:FF.mono, fontSize:10, color,
          letterSpacing:1.5, textTransform:"uppercase", marginBottom:6 }}>
          {icon && <span style={{ marginRight:5 }}>{icon}</span>}{title}
        </div>
      )}
      {children}
    </div>
  );
}

export function CheckRow({ label, sub, checked, onChange, pts, color }) {
  const c = color || (pts !== undefined && pts > 0 ? T.coral : T.teal);
  return (
    <button onClick={onChange}
      style={{ display:"flex", alignItems:"center", gap:9, width:"100%",
        padding:"9px 12px", borderRadius:8, cursor:"pointer", textAlign:"left",
        marginBottom:5, transition:"background .1s", border:`1px solid ${checked ? c+"55" : "rgba(35,70,115,0.68)"}`,
        background:checked ? `${c}10` : "rgba(14,28,58,0.75)",
        borderLeft:`3px solid ${checked ? c : "rgba(35,70,115,0.65)"}` }}>
      <div style={{ width:18, height:18, borderRadius:4, flexShrink:0,
        border:`2px solid ${checked ? c : "rgba(42,79,122,0.55)"}`, background:checked ? c : "transparent",
        display:"flex", alignItems:"center", justifyContent:"center" }}>
        {checked && <span style={{ color:"#050f1e", fontSize:10, fontWeight:900 }}>✓</span>}
      </div>
      <div style={{ flex:1 }}>
        <span style={{ fontFamily:FF.sans, fontSize:12, color:T.txt2 }}>{label}</span>
        {sub && <div style={{ fontFamily:FF.sans, fontSize:9.5, color:T.txt4, marginTop:2, lineHeight:1.4 }}>{sub}</div>}
      </div>
      {pts !== undefined && (
        <span style={{ fontFamily:FF.mono, fontSize:10, fontWeight:700,
          color:pts > 0 ? T.coral : T.teal, flexShrink:0 }}>
          {pts > 0 ? "+" : ""}{pts} pts
        </span>
      )}
    </button>
  );
}

export function TroponinField({ label, value, onChange, uln }) {
  const v = parseFloat(value), over = !isNaN(v) && uln > 0 && v > uln;
  return (
    <div style={{ flex:1 }}>
      <div style={{ fontFamily:FF.mono, fontSize:10, color:T.txt4,
        letterSpacing:1.3, textTransform:"uppercase", marginBottom:4 }}>{label}</div>
      <input type="number" value={value} onChange={e => onChange(e.target.value)} placeholder="0.00"
        style={{ width:"100%", padding:"9px 11px", background:"rgba(14,28,58,0.93)",
          border:`1px solid ${over ? T.coral+"88" : value ? T.blue+"55" : "rgba(35,70,115,0.65)"}`,
          borderRadius:8, outline:"none", fontFamily:FF.mono,
          fontSize:20, fontWeight:700, color:over ? T.coral : T.blue }} />
      {over && <div style={{ fontFamily:FF.sans, fontSize:10, color:T.coral, marginTop:3 }}>{(v/uln).toFixed(1)}× ULN</div>}
    </div>
  );
}

// ═══ SUMMARY STRIP ════════════════════════════════════════════════════════
export function SummaryStrip({ heartScore, tropInterp, edacsScore, edacsNegTrop }) {
  const hs = heartScore !== null ? heartStrata(heartScore) : null;
  const er = edacsScore !== null ? edacsRisk(edacsScore, edacsNegTrop) : null;
  const tropColor = tropInterp === "acs" ? T.coral : tropInterp === "elevated" ? T.gold : tropInterp === "normal" ? T.teal : T.txt4;
  const hasAny = heartScore !== null || tropInterp || edacsScore !== null;
  if (!hasAny) return null;
  return (
    <div style={{ display:"flex", gap:6, marginBottom:12, padding:"8px 10px",
      borderRadius:9, background:"rgba(14,28,58,0.88)", border:"1px solid rgba(35,70,115,0.72)" }}>
      {[
        { label:"HEART", val:heartScore !== null ? heartScore : "--", color:hs ? hs.color : T.txt4, sub:hs ? hs.label : "incomplete" },
        { label:"Troponin", val:tropInterp || "--", color:tropColor, sub:tropInterp ? "" : "not entered" },
        { label:"EDACS", val:edacsScore !== null ? edacsScore : "--", color:er ? er.color : T.txt4, sub:er ? er.label : "incomplete" },
      ].map(it => (
        <div key={it.label} style={{ flex:1, textAlign:"center", padding:"4px 0" }}>
          <div style={{ fontFamily:FF.mono, fontSize:10, color:T.txt4,
            letterSpacing:1, textTransform:"uppercase", marginBottom:2 }}>{it.label}</div>
          <div style={{ fontFamily:FF.mono, fontSize:17, fontWeight:700, color:it.color, lineHeight:1 }}>{it.val}</div>
          {it.sub && <div style={{ fontFamily:FF.sans, fontSize:8.5, color:T.txt4, marginTop:2 }}>{it.sub}</div>}
        </div>
      ))}
    </div>
  );
}

// ═══ MICRO COMPONENTS ════════════════════════════════════════════════════════
// Bul: bullet point row used throughout DDx / Protocol
export function Bul({ c, children }) {
  return (
    <div style={{ display:"flex", gap:7, alignItems:"flex-start", marginBottom:5 }}>
      <span style={{ color:c||T.txt3, fontSize:10, marginTop:3, flexShrink:0 }}>▸</span>
      <span style={{ fontFamily:FF.sans, fontSize:11, color:T.txt2, lineHeight:1.55 }}>{children}</span>
    </div>
  );
}

// NavBtn: guided workflow navigation button
export function NavBtn({ active, c, onClick, children, compact }) {
  return (
    <button onClick={onClick}
      style={{ flex:compact?"0 0 100px":1, minHeight:52, borderRadius:11,
        cursor:active?"pointer":"default", fontFamily:FF.sans, fontWeight:700, fontSize:14,
        border:`1.5px solid ${active?(c||T.blue)+"77":"rgba(35,70,115,0.6)"}`,
        background:active?`linear-gradient(135deg,${c||T.blue}22,${c||T.blue}08)`:"rgba(5,13,32,0.5)",
        color:active?(c||T.blue):T.txt4, transition:"all .15s" }}>
      {children}
    </button>
  );
}

// SkipBtn: small secondary skip button in guided workflow
export function SkipBtn({ onClick, children }) {
  return (
    <button onClick={onClick}
      style={{ width:"100%", marginTop:8, minHeight:40, borderRadius:8, cursor:"pointer",
        fontFamily:FF.sans, fontWeight:500, fontSize:11,
        border:"1px solid rgba(35,70,115,0.6)", background:"transparent", color:T.txt4 }}>
      {children}
    </button>
  );
}

// ═══ HEART TAB ═══════════════════════════════════════════════════════════
export function HeartTab({ scores, setScores, tropInterp, killip, setKillip, cardiacArrest, setCardiacArrest, graceScore, graceResult }) {
  const total  = Object.values(scores).reduce((s, v) => s + (v ?? 0), 0);
  const allSet = HEART_ITEMS.every(i => scores[i.key] !== undefined);
  const strata = allSet ? heartStrata(total) : null;

  // Suggested troponin_h value from actual troponin result
  const suggestedTropH = tropInterp === "acs" ? 2 : tropInterp === "elevated" ? 1 : tropInterp === "normal" ? 0 : null;

  return (
    <div className="cph-fade">
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
        marginBottom:16, padding:"12px 16px", borderRadius:11, background:"rgba(14,28,58,0.93)",
        border:`1px solid ${strata ? strata.color+"55" : "rgba(35,70,115,0.72)"}` }}>
        <div>
          <div style={{ fontFamily:FF.serif, fontSize:13, fontWeight:700, color:T.txt3, marginBottom:2 }}>HEART Score</div>
          <div style={{ fontFamily:FF.sans, fontSize:10, color:T.txt4, lineHeight:1.5 }}>
            {allSet ? strata.rec : "Select all 5 components to calculate"}
          </div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontFamily:FF.serif, fontSize:52, fontWeight:900, lineHeight:1,
            color:strata ? strata.color : T.txt4 }}>{total}</div>
          {strata && <div style={{ fontFamily:FF.mono, fontSize:10, letterSpacing:1.5,
            textTransform:"uppercase", color:strata.color, marginTop:2 }}>
            {strata.label} · {strata.mace} 30d MACE</div>}
        </div>
      </div>

      {HEART_ITEMS.map(item => (
        <div key={item.key} style={{ marginBottom:14 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:22, height:22, borderRadius:"50%", background:item.color,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontFamily:FF.serif, fontWeight:900, fontSize:10, color:"#050f1e" }}>
                {item.key[0].toUpperCase()}
              </div>
              <span style={{ fontFamily:FF.serif, fontWeight:700, fontSize:13, color:item.color }}>{item.label}</span>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              {/* Cross-tab troponin nudge */}
              {item.key === "troponin_h" && suggestedTropH !== null && scores.troponin_h !== suggestedTropH && (
                <div style={{ fontFamily:FF.mono, fontSize:7.5, color:T.gold, letterSpacing:0.5,
                  background:"rgba(245,200,66,0.1)", border:"1px solid rgba(245,200,66,0.45)",
                  borderRadius:5, padding:"2px 8px", cursor:"pointer"
                  }} onClick={()=>setScores(p=>({...p,troponin_h:suggestedTropH}))}>
                  Trop → {suggestedTropH} (tap to apply)
                </div>
              )}
              <span style={{ fontFamily:FF.mono, fontSize:10, color:T.txt3 }}>{item.hint}</span>
              {scores[item.key] !== undefined && (
                <div style={{ width:22, height:22, borderRadius:"50%", background:item.color,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontFamily:FF.mono, fontWeight:900, fontSize:11, color:"#050f1e" }}>
                  {scores[item.key]}
                </div>
              )}
            </div>
          </div>
          {[0,1,2].map(val => (
            <ScoreOption key={val} item={item} val={val} selected={scores[item.key]}
              onSelect={v => setScores(p => ({ ...p, [item.key]:v }))} />
          ))}
        </div>
      ))}

      {Object.values(scores).some(v => v !== undefined) && (
        <button onClick={() => setScores({})}
          style={{ marginTop:6, fontFamily:FF.sans, fontSize:11, fontWeight:600,
            padding:"5px 14px", borderRadius:7, cursor:"pointer",
            border:"1px solid rgba(35,70,115,0.72)", background:"transparent", color:T.txt4 }}>
          ↺ Reset
        </button>
      )}


      {/* GRACE Score */}
      {Object.values(scores).some(v=>v!==undefined) && (
        <div style={{ marginTop:16, padding:"12px 14px", borderRadius:10,
          background:"rgba(14,28,58,0.94)", border:"1px solid rgba(35,70,115,0.68)" }}>
          <div style={{ fontFamily:FF.mono, fontSize:10, color:T.blue, letterSpacing:1.2,
            textTransform:"uppercase", marginBottom:6 }}>
            GRACE Score
            <span style={{ fontFamily:FF.sans, color:T.txt3, fontSize:11, fontWeight:400,
              letterSpacing:0, textTransform:"none", marginLeft:6 }}>ACC/AHA 2021 invasive timing</span>
          </div>
          <div style={{ marginBottom:8 }}>
            <div style={{ fontFamily:FF.mono, fontSize:10, color:T.txt4, marginBottom:5 }}>Killip Class</div>
            <div style={{ display:"flex", gap:5 }}>
              {[[1,"I—No HF"],[2,"II—Rales"],[3,"III—Edema"],[4,"IV—Shock"]].map(([v,l])=>(
                <button key={v} onClick={()=>setKillip(v)}
                  style={{ flex:1, padding:"6px 4px", borderRadius:7, cursor:"pointer",
                    fontFamily:FF.sans, fontSize:10, fontWeight:600,
                    border:`1px solid ${killip===v?T.blue+"77":"rgba(35,70,115,0.62)"}`,
                    background:killip===v?"rgba(59,158,255,0.12)":"transparent",
                    color:killip===v?T.blue:T.txt3 }}>{l}</button>
              ))}
            </div>
          </div>
          <button onClick={()=>setCardiacArrest(p=>!p)}
            style={{ display:"flex", alignItems:"center", gap:9, width:"100%",
              padding:"8px 10px", borderRadius:8, cursor:"pointer", marginBottom:10,
              border:`1px solid ${cardiacArrest?T.coral+"55":"rgba(35,70,115,0.62)"}`,
              background:cardiacArrest?"rgba(255,107,107,0.08)":"transparent" }}>
            <div style={{ width:18, height:18, borderRadius:4, flexShrink:0,
              border:`2px solid ${cardiacArrest?T.coral:"rgba(42,79,122,0.55)"}`,
              background:cardiacArrest?T.coral:"transparent",
              display:"flex", alignItems:"center", justifyContent:"center" }}>
              {cardiacArrest&&<span style={{ color:"#050f1e", fontSize:11, fontWeight:900 }}>✓</span>}
            </div>
            <span style={{ fontFamily:FF.sans, fontSize:12, color:T.txt2 }}>Cardiac arrest at admission (+39 pts)</span>
          </button>
          {graceScore!==null&&graceResult?(
            <div style={{ padding:"10px 12px", borderRadius:8,
              background:`${graceResult.color}0a`, border:`1px solid ${graceResult.color}33` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                <div style={{ fontFamily:FF.serif, fontWeight:700, fontSize:15, color:graceResult.color }}>{graceResult.label}</div>
                <div style={{ fontFamily:FF.mono, fontSize:28, fontWeight:900, color:graceResult.color }}>{graceScore}</div>
              </div>
              <div style={{ fontFamily:FF.mono, fontSize:10, color:graceResult.color, marginBottom:3 }}>30-day mortality: {graceResult.mortality}</div>
              <div style={{ fontFamily:FF.sans, fontSize:11, color:T.txt2, lineHeight:1.5 }}>{graceResult.rec}</div>
            </div>
          ):(
            <div style={{ fontFamily:FF.sans, fontSize:11, color:T.txt4 }}>
              Requires age (EDACS tab), HR + SBP (vitals bar) to calculate.
            </div>
          )}
        </div>
      )}    </div>
  );
}

// ═══ TROPONIN TAB ═════════════════════════════════════════════════════════
export function TroponinTab({ t0,setT0,t1,setT1,t2,setT2,uln,setULN,unit,setUnit,mode,setMode }) {
  const result    = useMemo(() => calcTrop(t0,t1,t2,uln), [t0,t1,t2,uln]);
  const hstResult = useMemo(() => mode === "hst" ? evalHST(t0,t1) : null, [mode,t0,t1]);

  return (
    <div className="cph-fade">
      <div style={{ display:"flex", gap:7, marginBottom:14 }}>
        {[{id:"conventional",label:"Conventional cTn"},{id:"hst",label:"hs-cTnI (0/1h Protocol)"}].map(m => (
          <button key={m.id} onClick={() => setMode(m.id)}
            style={{ flex:1, padding:"7px 0", borderRadius:8, cursor:"pointer",
              fontFamily:FF.sans, fontWeight:600, fontSize:11, transition:"all .12s",
              border:`1px solid ${mode===m.id ? T.blue+"66" : "rgba(35,70,115,0.68)"}`,
              background:mode===m.id ? "rgba(59,158,255,0.1)" : "transparent", color:mode===m.id ? T.blue : T.txt4 }}>
            {m.label}
          </button>
        ))}
      </div>

      {mode === "conventional" ? (
        <>
          <div style={{ marginBottom:12 }}>
            <div style={{ fontFamily:FF.mono, fontSize:10, color:T.txt4,
              letterSpacing:1.3, textTransform:"uppercase", marginBottom:4 }}>
              Upper Limit of Normal (your lab)
            </div>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              <input type="number" value={uln} onChange={e => setULN(e.target.value)}
                style={{ width:110, padding:"7px 11px", background:"rgba(14,28,58,0.93)",
                  border:"1px solid rgba(59,158,255,0.35)", borderRadius:7, outline:"none",
                  fontFamily:FF.mono, fontSize:14, fontWeight:700, color:T.blue }} />
              <div style={{ display:"flex", gap:5 }}>
                {TROPONIN_UNITS.map(u => (
                  <button key={u} onClick={() => setUnit(u)}
                    style={{ fontFamily:FF.mono, fontSize:10, padding:"3px 9px",
                      borderRadius:5, cursor:"pointer", letterSpacing:0.5,
                      border:`1px solid ${unit===u ? T.blue+"55" : "rgba(35,70,115,0.65)"}`,
                      background:unit===u ? "rgba(59,158,255,0.1)" : "transparent", color:unit===u ? T.blue : T.txt4 }}>
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display:"flex", gap:10, marginBottom:12 }}>
            <TroponinField label="0h (Arrival)" value={t0} onChange={setT0} uln={parseFloat(uln)} />
            <TroponinField label="3h" value={t1} onChange={setT1} uln={parseFloat(uln)} />
            <TroponinField label="6h" value={t2} onChange={setT2} uln={parseFloat(uln)} />
          </div>

          {result && (
            <InfoBox color={result.interp==="acs"?T.coral:result.interp==="elevated"?T.gold:T.teal}
              icon={result.interp==="acs"?"🚨":result.interp==="elevated"?"⚠":"✓"}
              title={result.interp==="acs"?"Significant Troponin Rise":result.interp==="elevated"?"Troponin Elevated":"Troponin Normal"}>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
                {[
                  { label:"Peak", val:result.peak?.toFixed(3) },
                  { label:"× ULN", val:result.fold?.toFixed(1)||"--" },
                  { label:"Δ 0→3h", val:result.delta?result.delta+"%":"--" },
                  { label:"Trend", val:result.trend ? result.trend.arrow : "--",
                    color:result.trend ? result.trend.color : T.txt4, sub:result.trend ? result.trend.label : "" },
                ].map(s => (
                  <div key={s.label} style={{ textAlign:"center" }}>
                    <div style={{ fontFamily:FF.mono, fontSize:10, color:T.txt4, letterSpacing:1 }}>{s.label}</div>
                    <div style={{ fontFamily:FF.mono, fontSize:18, fontWeight:700,
                      color:s.color || (result.interp==="acs"?T.coral:result.interp==="elevated"?T.gold:T.teal),
                      lineHeight:1 }}>{s.val||"--"}</div>
                    {s.sub && <div style={{ fontFamily:FF.sans, fontSize:8.5, color:T.txt4, marginTop:1 }}>{s.sub}</div>}
                  </div>
                ))}
              </div>
              {result.interp==="acs" && (
                <div style={{ marginTop:8, fontFamily:FF.sans, fontSize:11, color:T.coral, lineHeight:1.55 }}>
                  Rising troponin pattern consistent with AMI — initiate ACS protocol and cardiology consult
                </div>
              )}
            </InfoBox>
          )}
        </>
      ) : (
        <>
          <InfoBox color={T.blue} title="ESC 0/1h Protocol — Elecsys hs-cTnI">
            <div style={{ fontFamily:FF.sans, fontSize:11, color:T.txt3, lineHeight:1.65 }}>
              Rule-out: 0h &lt; 5 ng/L, or 0h &lt; 12 ng/L + Δ1h &lt; 3 ng/L &nbsp;| Rule-in: 0h ≥ 52 ng/L, or Δ1h ≥ 6 ng/L
            </div>
          </InfoBox>
          <div style={{ display:"flex", gap:10, margin:"12px 0" }}>
            <TroponinField label="0h hs-cTnI (ng/L)" value={t0} onChange={setT0} uln={52} />
            <TroponinField label="1h hs-cTnI (ng/L)" value={t1} onChange={setT1} uln={52} />
          </div>
          {hstResult && (
            <InfoBox color={hstResult.color}
              icon={hstResult.result==="rule_out"?"✓":hstResult.result==="rule_in"?"🚨":"⚠"}
              title={hstResult.label}>
              <div style={{ fontFamily:FF.sans, fontSize:12, color:T.txt2, lineHeight:1.65 }}>{hstResult.detail}</div>
            </InfoBox>
          )}
        </>
      )}
    </div>
  );
}

// ═══ EDACS TAB ═══════════════════════════════════════════════════════════
export function EdacsTab({ fields, setFields, negTrop, setNegTrop }) {
  const setF  = (k, v) => setFields(p => ({ ...p, [k]:v }));
  const age   = parseInt(fields.age) || 0;
  const ageInvalid = fields.age !== "" && age < 18;
  const score = age >= 18 ? calcEDACS(fields) : null;
  const risk  = score !== null ? edacsRisk(score, negTrop) : null;

  return (
    <div className="cph-fade">
      <InfoBox color={T.purple} title="EDACS Low-Risk Criteria">
        <div style={{ fontFamily:FF.sans, fontSize:11, color:T.txt3, lineHeight:1.6 }}>
          Score &lt; 16 + negative troponin = safe for early discharge. Validated in Flaws et al, Heart 2016 — 99.7% sensitivity for 30-day ACS. Valid ages 18+.
        </div>
      </InfoBox>

      <div style={{ display:"flex", gap:10, marginBottom:12 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:FF.mono, fontSize:10, color:T.txt4,
            letterSpacing:1.3, textTransform:"uppercase", marginBottom:4 }}>Age</div>
          <input type="number" value={fields.age} onChange={e => setF("age", e.target.value)} placeholder="years"
            style={{ width:"100%", padding:"9px 11px", background:"rgba(14,28,58,0.93)",
              border:`1px solid ${ageInvalid ? T.coral+"88" : fields.age ? T.purple+"55" : "rgba(35,70,115,0.65)"}`,
              borderRadius:8, outline:"none", fontFamily:FF.mono,
              fontSize:18, fontWeight:700, color:ageInvalid ? T.coral : T.purple }} />
          {ageInvalid && <div style={{ fontFamily:FF.sans, fontSize:10, color:T.coral, marginTop:3 }}>EDACS validated for age ≥ 18</div>}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:FF.mono, fontSize:10, color:T.txt4,
            letterSpacing:1.3, textTransform:"uppercase", marginBottom:4 }}>Sex</div>
          <div style={{ display:"flex", gap:6 }}>
            {[["M","Male"],["F","Female"]].map(([v,l]) => (
              <button key={v} onClick={() => setF("sex", v)}
                style={{ flex:1, padding:"9px 0", borderRadius:8, cursor:"pointer",
                  fontFamily:FF.sans, fontWeight:600, fontSize:12,
                  border:`1px solid ${fields.sex===v ? T.purple+"66" : "rgba(35,70,115,0.68)"}`,
                  background:fields.sex===v ? "rgba(155,109,255,0.12)" : "transparent",
                  color:fields.sex===v ? T.purple : T.txt4 }}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {[
        { key:"diaphoresis", pts:3,  label:"Diaphoresis present" },
        { key:"radiation",   pts:5,  label:"Pain radiates to arm or shoulder" },
        { key:"inspiratory", pts:-4, label:"Pain is SOLELY pleuritic/inspiratory" },
        { key:"palpation",   pts:-6, label:"Pain REPRODUCED by palpation" },
        { key:"knownCAD",    pts:12, label:"Known CAD (prior MI, PCI, CABG)" },
      ].map(f => (
        <CheckRow key={f.key} label={f.label} pts={f.pts} checked={fields[f.key]}
          onChange={() => setF(f.key, !fields[f.key])} />
      ))}
      <CheckRow label="Serial troponin negative (required for low-risk pathway)" checked={negTrop}
        color={negTrop ? T.teal : T.coral} onChange={() => setNegTrop(!negTrop)} />

      {score !== null && risk && (
        <div style={{ marginTop:14, padding:"12px 14px", borderRadius:10,
          background:`${risk.color}09`, border:`1px solid ${risk.color}38` }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
            <span style={{ fontFamily:FF.serif, fontWeight:700, fontSize:16, color:risk.color }}>{risk.label}</span>
            <span style={{ fontFamily:FF.mono, fontSize:36, fontWeight:900, color:risk.color }}>{score}</span>
          </div>
          <div style={{ fontFamily:FF.sans, fontSize:11, color:T.txt3, lineHeight:1.6 }}>{risk.rec}</div>
        </div>
      )}
    </div>
  );
}

export function RefSection({ data }) {
  return (
    <>
      <InfoBox color={data.color}>
        <div style={{ fontFamily:FF.sans, fontSize:11, color:data.introAlert?T.coral:T.txt3, fontWeight:data.introAlert?600:400, lineHeight:1.6 }}>{data.intro}</div>
      </InfoBox>
      {data.sections.map((sect,i) => (
        <div key={i} style={{ marginBottom:10 }}>
          <div style={{ fontFamily:FF.mono, fontSize:10, color:sect.c, letterSpacing:1.5, textTransform:"uppercase", marginBottom:5 }}>{sect.label}</div>
          {sect.items.map((item,j) => <Bul key={j} c={sect.c}>{item}</Bul>)}
        </div>
      ))}
    </>
  );
}

export function DifferentialsTab({ ddxSub,setDdxSub,wells,setWells,perc,setPerc,addrs,setAddrs,hr,sbp,spesi,setSpesi }) {
  const wellsScore      = WELLS_ITEMS.reduce((s,i) => s + (wells[i.key] ? i.pts : 0), 0);
  const wellsInterResult = wellsInterp(wellsScore);
  const percAllMet      = PERC_ITEMS.every(i => perc[i.key]);
  const addrsScore      = ADDRS_ITEMS.reduce((s,i) => s + (addrs[i.key] ? 1 : 0), 0);
  const addrsResult     = addrsInterp(addrsScore);

  return (
    <div className="cph-fade">
      <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:12 }}>
        {DDX_TABS.map(t => (
          <button key={t.id} onClick={() => setDdxSub(t.id)}
            style={{ padding:"5px 11px", borderRadius:7, cursor:"pointer",
              fontFamily:FF.sans, fontWeight:600, fontSize:11,
              border:`1px solid ${ddxSub===t.id ? t.color+"66" : "rgba(35,70,115,0.68)"}`,
              background:ddxSub===t.id ? `${t.color}14` : "transparent", color:ddxSub===t.id ? t.color : T.txt4 }}>
            {t.label}
          </button>
        ))}
      </div>

      {ddxSub === "pe" && (
        <div>
          <InfoBox color={T.blue} title="Wells Criteria for PE">
            <div style={{ fontFamily:FF.sans, fontSize:10.5, color:T.txt3, lineHeight:1.5 }}>
              Pre-test probability score. Apply PERC if low risk (Wells ≤ 1) in low-prevalence setting.
            </div>
          </InfoBox>
          {WELLS_ITEMS.map(it => (
            <CheckRow key={it.key} label={it.label} pts={it.pts} checked={!!wells[it.key]}
              color={T.blue} onChange={() => setWells(p => ({ ...p, [it.key]:!p[it.key] }))} />
          ))}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
            padding:"10px 14px", borderRadius:9, margin:"10px 0",
            background:`${wellsInterResult.color}0c`, border:`1px solid ${wellsInterResult.color}44` }}>
            <div>
              <div style={{ fontFamily:FF.serif, fontWeight:700, fontSize:15, color:wellsInterResult.color }}>{wellsInterResult.label}</div>
              <div style={{ fontFamily:FF.sans, fontSize:10.5, color:T.txt3, marginTop:3, lineHeight:1.5, maxWidth:280 }}>{wellsInterResult.sub}</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontFamily:FF.mono, fontSize:32, fontWeight:900, color:wellsInterResult.color, lineHeight:1 }}>{wellsScore.toFixed(1)}</div>
              <div style={{ fontFamily:FF.mono, fontSize:10, color:wellsInterResult.color, letterSpacing:1 }}>{wellsInterResult.action}</div>
            </div>
          </div>
          {wellsScore <= 1 && (
            <>
              <div style={{ fontFamily:FF.mono, fontSize:10, color:T.teal,
                letterSpacing:1.5, textTransform:"uppercase", margin:"10px 0 6px" }}>
                PERC Rule — all 8 must be met to exclude PE
              </div>
              {PERC_ITEMS.map(it => (
                <CheckRow key={it.key} label={it.label} checked={!!perc[it.key]}
                  color={T.teal} onChange={() => setPerc(p => ({ ...p, [it.key]:!p[it.key] }))} />
              ))}
              {percAllMet && (
                <InfoBox color={T.teal} icon="✓" title="PERC Negative — PE Excluded">
                  <div style={{ fontFamily:FF.sans, fontSize:11, color:T.teal, lineHeight:1.5 }}>
                    All 8 PERC criteria met + Wells ≤ 1 — PE safely excluded without D-dimer or imaging.
                  </div>
                </InfoBox>
              )}
            </>
          )}
          <button onClick={() => { setWells({}); setPerc({}); }}
            style={{ marginTop:4, fontFamily:FF.sans, fontSize:11, fontWeight:600,
              padding:"5px 14px", borderRadius:7, cursor:"pointer",

              border:"1px solid rgba(35,70,115,0.72)", background:"transparent", color:T.txt4 }}>
            ↺ Reset
          </button>
          {/* sPESI */}
          <div style={{ marginTop:14, padding:"12px 13px", borderRadius:10,
            background:"rgba(14,28,58,0.94)", border:"1px solid rgba(35,70,115,0.68)" }}>
            <div style={{ fontFamily:FF.mono, fontSize:10, color:T.blue, letterSpacing:1.2,
              textTransform:"uppercase", marginBottom:8 }}>
              sPESI
              <span style={{ fontFamily:FF.sans, color:T.txt3, fontWeight:400, fontSize:11,
                textTransform:"none", letterSpacing:0, marginLeft:4 }}>PE severity once diagnosed</span>
            </div>
            {SPESI_ITEMS.map(it => {
              const autoVal=(it.key==="sp_hr"&&parseInt(hr)>=110)||(it.key==="sp_sbp"&&parseInt(sbp)<100&&parseInt(sbp)>0);
              const checked=!!(spesi&&spesi[it.key])||autoVal;
              return (
                <button key={it.key} onClick={()=>setSpesi&&setSpesi(p=>({...p,[it.key]:!p[it.key]}))}
                  style={{ display:"flex", alignItems:"center", gap:9, width:"100%",
                    padding:"7px 10px", borderRadius:8, cursor:"pointer", marginBottom:5,
                    border:`1px solid ${checked?T.blue+"55":"rgba(35,70,115,0.65)"}`,
                    background:checked?"rgba(59,158,255,0.08)":"transparent" }}>
                  <div style={{ width:18, height:18, borderRadius:4, flexShrink:0,
                    border:`2px solid ${checked?T.blue:"rgba(42,79,122,0.55)"}`,
                    background:checked?T.blue:"transparent",
                    display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {checked&&<span style={{ color:"#050f1e", fontSize:11, fontWeight:900 }}>✓</span>}
                  </div>
                  <span style={{ fontFamily:FF.sans, fontSize:12, color:T.txt2, flex:1 }}>{it.label}</span>
                  {autoVal&&<span style={{ fontFamily:FF.mono, fontSize:10, color:T.orange }}>auto</span>}
                </button>
              );
            })}
            {(()=>{
              const score=SPESI_ITEMS.reduce((s,i)=>{
                const auto=(i.key==="sp_hr"&&parseInt(hr)>=110)||(i.key==="sp_sbp"&&parseInt(sbp)<100&&parseInt(sbp)>0);
                return s+((spesi&&spesi[i.key])||auto?1:0);
              },0);
              const r=spesiInterp(score);
              return (
                <div style={{ marginTop:8, padding:"8px 11px", borderRadius:8,
                  background:`${r.color}0a`, border:`1px solid ${r.color}33` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div style={{ fontFamily:FF.serif, fontWeight:700, fontSize:14, color:r.color }}>{r.label}</div>
                    <div style={{ fontFamily:FF.mono, fontSize:24, fontWeight:900, color:r.color }}>{score}/6</div>
                  </div>
                  <div style={{ fontFamily:FF.mono, fontSize:10, color:r.color, marginBottom:2 }}>30-day mortality: {r.mortality}</div>
                  <div style={{ fontFamily:FF.sans, fontSize:11, color:T.txt2, lineHeight:1.5 }}>{r.rec}</div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {ddxSub === "dissect" && (
        <div>
          <InfoBox color={T.coral} title="ADD-RS — Aortic Dissection Detection Risk Score">
            <div style={{ fontFamily:FF.sans, fontSize:10.5, color:T.txt3, lineHeight:1.5 }}>
              Rogers et al, Circulation 2011. One point per category (max 3). Guides imaging threshold. Always order as <strong>CT Aortogram</strong> (arterial phase, chest+abdomen+pelvis) — not generic CT chest.
            </div>
          </InfoBox>
          {ADDRS_ITEMS.map(it => (
            <CheckRow key={it.key} label={it.label} sub={it.sub} checked={!!addrs[it.key]}
              color={T.coral} onChange={() => setAddrs(p => ({ ...p, [it.key]:!p[it.key] }))} />
          ))}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
            padding:"10px 14px", borderRadius:9, margin:"10px 0",
            background:`${addrsResult.color}0c`, border:`1px solid ${addrsResult.color}44` }}>
            <div style={{ flex:1, marginRight:12 }}>
              <div style={{ fontFamily:FF.serif, fontWeight:700, fontSize:15, color:addrsResult.color }}>{addrsResult.label}</div>
              <div style={{ fontFamily:FF.sans, fontSize:10.5, color:T.txt3, marginTop:3, lineHeight:1.5 }}>{addrsResult.rec}</div>
            </div>
            <div style={{ fontFamily:FF.mono, fontSize:36, fontWeight:900, color:addrsResult.color, lineHeight:1, flexShrink:0 }}>{addrsScore}</div>
          </div>
          <InfoBox color={T.gold} icon="💡" title="Critical Pearl">
            <div style={{ fontFamily:FF.sans, fontSize:11, color:T.txt3, lineHeight:1.6 }}>
              HTN + anterior chest pain + wide mediastinum on CXR = high suspicion. BP differential &gt;20 mmHg between arms is pathognomonic. D-dimer &gt;500 ng/mL has 97% sensitivity for type A dissection (IRAD 2009). Do NOT anticoagulate before dissection is excluded.
            </div>
          </InfoBox>
          <button onClick={() => setAddrs({})}
            style={{ marginTop:4, fontFamily:FF.sans, fontSize:11, fontWeight:600,
              padding:"5px 14px", borderRadius:7, cursor:"pointer",
              border:"1px solid rgba(35,70,115,0.72)", background:"transparent", color:T.txt4 }}>
            ↺ Reset
          </button>
        </div>
      )}

      {ddxSub === "peri"    && <RefSection data={DDX_REF.peri} />}

      {ddxSub === "pneumo"    && <RefSection data={DDX_REF.pneumo} />}

      {ddxSub === "boerhaave" && <RefSection data={DDX_REF.boerhaave} />}
    </div>
  );
}

// ═══ PROTOCOL TAB ═════════════════════════════════════════════════════════
export function ProtocolTab({ expanded, setExpanded, weightKg, crcl }) {
  const doses = weightKg ? {
    ufhBolus: Math.min(Math.round(weightKg*60), 4000), ufhInf:   Math.min(Math.round(weightKg*12), 1000),
    enox:     weightKg.toFixed(0),
    enoxFreq: crcl!==null ? (crcl<30 ? "q24h (CrCl"+crcl+"<30)" : "q12h") : "q12h", tnk:      Math.min((weightKg*0.5).toFixed(1), 50),
  } : null;
  return (
    <div className="cph-fade">
      {doses && (
        <div style={{ marginBottom:12, padding:"10px 13px", borderRadius:9,
          background:"rgba(59,158,255,0.08)", border:"1px solid rgba(59,158,255,0.3)" }}>
          <div style={{ fontFamily:FF.mono, fontSize:10, color:T.blue, letterSpacing:1.2, marginBottom:6 }}>
            COMPUTED DOSES -- {weightKg.toFixed(1)} kg
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
            {[
              { label:"UFH Bolus",   val:`${doses.ufhBolus.toLocaleString()} u`,  sub:"60 u/kg, max 4,000" },
              { label:"UFH Infusion",val:`${doses.ufhInf} u/hr`,                  sub:"12 u/kg/hr, max 1,000" },
              { label:"Enoxaparin",  val:`${doses.enox} mg SQ`,                   sub:`1 mg/kg ${doses.enoxFreq||"q12h"}${crcl!==null?", CrCl "+crcl+" mL/min":""}` },
              { label:"TNK",         val:`${doses.tnk} mg`,                        sub:"0.5 mg/kg, max 50" },
            ].map(d => (
              <div key={d.label} style={{ textAlign:"center" }}>
                <div style={{ fontFamily:FF.mono, fontSize:10,
                  color:T.txt4, letterSpacing:0.8, marginBottom:2 }}>{d.label}</div>
                <div style={{ fontFamily:FF.mono, fontSize:13,
                  fontWeight:700, color:T.blue }}>{d.val}</div>
                <div style={{ fontFamily:FF.sans, fontSize:8.5,
                  color:T.txt4 }}>{d.sub}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {ACS_STEPS.map((section, i) => (
        <div key={i} style={{ marginBottom:6, borderRadius:10, overflow:"hidden",
          border:`1px solid ${expanded===i ? section.color+"55" : "rgba(35,70,115,0.65)"}` }}>
          <button onClick={() => setExpanded(p => p===i ? null : i)}
            style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
              width:"100%", padding:"10px 13px", cursor:"pointer", border:"none", textAlign:"left",
              background:`linear-gradient(135deg,${section.color}0c,rgba(14,28,58,0.97))` }}>
            <div style={{ display:"flex", alignItems:"center", gap:9 }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:section.color, flexShrink:0 }} />
              <span style={{ fontFamily:FF.serif, fontWeight:700, fontSize:13, color:section.color }}>{section.title}</span>
            </div>
            <span style={{ color:T.txt4, fontSize:10 }}>{expanded===i ? "▲" : "▼"}</span>
          </button>
          {expanded === i && (
            <div style={{ padding:"8px 13px 12px", borderTop:`1px solid ${section.color}22`, background:"rgba(14,28,58,0.88)" }}>
              {section.steps.map((step, j) => (
                <div key={j} style={{ display:"flex", gap:8, alignItems:"flex-start", marginBottom:7 }}>
                  <span style={{ color:section.color, fontSize:10, marginTop:3, flexShrink:0 }}>▸</span>
                  <span style={{ fontFamily:FF.sans, fontSize:11.5, color:T.txt2, lineHeight:1.6 }}>{step}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      <InfoBox color={T.gold} icon="💎" title="Key Pearls">
        <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
          {[
            "Door-to-EKG < 10 min is a class I recommendation — wire into your triage workflow",
            "TNK (tenecteplase) single bolus preferred over alteplase when PCI unavailable — ACEP 2024",
            "Ticagrelor preferred over clopidogrel (PLATO) — avoid if prior stroke/TIA",
            "Morphine associated with worse outcomes in NSTEMI — use cautiously",
            "Oxygen only if SpO2 < 90% — hyperoxia is harmful in normoxic ACS",
          ].map((p, i) => (
            <Bul key={i} c={T.gold}>{p}</Bul>
          ))}
        </div>
      </InfoBox>
    </div>
  );
}

// ═══ DISPO TAB ════════════════════════════════════════════════════════════
export function DispoTab({ heartScore, tropInterp, edacsScore, edacsNegTrop, tropResult,
    wellsScore, wellsInterResult, addrsScore, addrsResult,
    sbp="", hr="", weight="", weightUnit="kg", creatinine="", chiefComplaint="" }) {
  const rec          = useMemo(() => dispositionRec(heartScore, tropInterp), [heartScore, tropInterp]);
  const [copied,     setCopied]    = useState(false);
  const [copiedMDM,  setCopiedMDM] = useState(false);
  const [showReturn, setShowReturn]= useState(false);

  const hs = heartScore !== null ? heartStrata(heartScore) : null;
  const er = edacsScore !== null ? edacsRisk(edacsScore, edacsNegTrop) : null;

  const generateMDM = () => {
    if (!rec || !hs) return "";
    const ptDesc = chiefComplaint ? `Patient presented with ${chiefComplaint}` : "Patient presented with chest pain";
    const tropDesc = tropInterp==="acs"
      ? "rising troponin consistent with acute myocardial injury"
      : tropInterp==="elevated"
      ? "mildly elevated troponin without significant rise on serial testing"
      : "negative serial troponin";
    const edacsLine = er ? ` EDACS score ${edacsScore} is ${er.label.toLowerCase()} risk.` : "";
    let mdm = `${ptDesc} and was risk-stratified for acute coronary syndrome. HEART score ${heartScore}/10 (${hs.label}), estimated 30-day MACE ${hs.mace}. Biomarker evaluation: ${tropDesc}.${edacsLine}`;
    if (wellsScore>0) mdm += ` Wells PE score ${wellsScore.toFixed(1)}: ${wellsInterResult?.label?.toLowerCase()} probability.`;
    if (addrsScore>0) mdm += ` ADD-RS ${addrsScore}/3 for aortic dissection.`;
    mdm += ` Clinical decision: ${rec.dispo.toLowerCase()}. `;
    mdm += rec.plan.map((p,i)=>`${i+1}. ${p}`).join(" ");
    return mdm;
  };
  const handleCopyMDM = () => {
    if (navigator.clipboard)
      navigator.clipboard.writeText(generateMDM())
        .then(()=>{ setCopiedMDM(true); setTimeout(()=>setCopiedMDM(false),2500); });
  };

  const generateNote = () => {
    const lines = ["CHEST PAIN EVALUATION -- NOTRYA CLINICAL SUPPORT"];
    if (chiefComplaint) lines.push(`Chief complaint: ${chiefComplaint}`);
    const vitalParts = [sbp?`SBP ${sbp}`:null, hr?`HR ${hr}`:null, weight?`Wt ${weight}${weightUnit}`:null, creatinine?`Cr ${creatinine} mg/dL`:null].filter(Boolean);
    if (vitalParts.length) lines.push(`Vitals: ${vitalParts.join(", ")}`);
    if (hs) lines.push(`HEART Score: ${heartScore}/10 (${hs.label}) — est. 30-day MACE ${hs.mace}`);
    if (tropResult) {
      const foldStr = tropResult.fold ? ` (${tropResult.fold.toFixed(1)}× ULN)` : "";
      const t1str   = !isNaN(tropResult.v1) ? `, 3h: ${tropResult.v1}` : "";
      const t2str   = !isNaN(tropResult.v2) ? `, 6h: ${tropResult.v2}` : "";
      const trendStr = tropResult.trend ? ` [${tropResult.trend.label}]` : "";
      lines.push(`Troponin 0h: ${tropResult.v0}${foldStr}${t1str}${t2str}${trendStr} — ${
        tropInterp === "acs" ? "rising pattern consistent with AMI" :
        tropInterp === "elevated" ? "elevated without significant rise" : "within normal limits"}`);
    }
    if (er) lines.push(`EDACS: ${edacsScore} — ${er.label} (troponin ${edacsNegTrop ? "negative" : "positive"})`);
    if (wellsScore > 0) lines.push(`Wells PE: ${wellsScore.toFixed(1)} — ${wellsInterResult?.label} (${wellsInterResult?.action})`);
    if (addrsScore > 0) lines.push(`ADD-RS (Aortic Dissection): ${addrsScore}/3 — ${addrsResult?.label}`);
    if (rec) {
      lines.push(`Disposition: ${rec.dispo}`);
      rec.plan.forEach((p, i) => lines.push(`  ${i+1}. ${p}`));
    }
    lines.push("** Clinical decision support only — physician judgment required **");
    return lines.join("\n");
  };

  const handleCopy = () => {
    const text = generateNote();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); });
    }
  };

  if (heartScore === null) {
    return (
      <div className="cph-fade" style={{ padding:"24px 0", textAlign:"center" }}>
        <div style={{ fontSize:32, marginBottom:12 }}>💓</div>
        <div style={{ fontFamily:FF.sans, fontSize:13, color:T.txt4, lineHeight:1.7 }}>
          Complete HEART Score to begin. Then add Troponin result to generate disposition.
        </div>
      </div>
    );
  }

  if (tropInterp === null) {
    return (
      <div className="cph-fade" style={{ padding:"24px 0", textAlign:"center" }}>
        <div style={{ fontSize:32, marginBottom:12 }}>🔬</div>
        <div style={{ fontFamily:FF.sans, fontSize:13, color:T.txt4, lineHeight:1.7 }}>
          HEART Score complete ({heartScore}/10). Enter troponin values on the Troponin tab to generate disposition.
        </div>
      </div>
    );
  }

  return (
    <div className="cph-fade">
      <div style={{ padding:"16px", borderRadius:12, marginBottom:14,
        background:`${rec.color}0c`, border:`2px solid ${rec.color}55` }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
          <span style={{ fontSize:32 }}>{rec.icon}</span>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:FF.serif, fontWeight:900, fontSize:22, color:rec.color }}>{rec.dispo}</div>
            <div style={{ fontFamily:FF.sans, fontSize:11, color:T.txt3, marginTop:2 }}>{rec.detail}</div>
          </div>
          <button onClick={handleCopy}
            style={{ padding:"7px 12px", borderRadius:8, cursor:"pointer",
              fontFamily:FF.mono, fontSize:10, fontWeight:700, letterSpacing:0.5, flexShrink:0,
              border:`1px solid ${copied ? T.teal+"66" : rec.color+"44"}`,
              background:copied ? "rgba(0,229,192,0.1)" : `${rec.color}0a`, color:copied ? T.teal : rec.color }}>
            {copied ? "COPIED ✓" : "COPY NOTE"}
          </button>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
          {rec.plan.map((p, i) => (
            <div key={i} style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
              <span style={{ fontFamily:FF.mono, fontSize:10, color:rec.color,
                minWidth:18, marginTop:1, fontWeight:700 }}>{i+1}.</span>
              <span style={{ fontFamily:FF.sans, fontSize:12, color:T.txt2, lineHeight:1.6 }}>{p}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
        {[
          { label:"HEART",   val:heartScore !== null ? heartScore : "--",                    color:T.coral  },
          { label:"Troponin",val:tropInterp || "unknown",                                    color:T.blue   },
          { label:"Strata",  val:heartScore !== null ? heartStrata(heartScore).label : "--", color:rec.color },
        ].map(s => (
          <div key={s.label} style={{ padding:"10px", borderRadius:9, textAlign:"center",
            background:"rgba(14,28,58,0.88)", border:"1px solid rgba(35,70,115,0.68)" }}>
            <div style={{ fontFamily:FF.mono, fontSize:10, color:T.txt4,
              letterSpacing:1, textTransform:"uppercase", marginBottom:4 }}>{s.label}</div>
            <div style={{ fontFamily:FF.mono, fontSize:14, fontWeight:700, color:s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* P6: MDM Note + P7: Return Precautions */}
      {rec && (
        <div style={{ display:"flex", gap:8, marginTop:12, marginBottom:4 }}>
          <button onClick={handleCopyMDM}
            style={{ flex:1, padding:"8px 10px", borderRadius:8, cursor:"pointer",
              fontFamily:FF.mono, fontSize:10, fontWeight:700, letterSpacing:0.5,
              border:`1px solid ${copiedMDM ? T.teal+"66" : T.purple+"44"}`,
              background:copiedMDM ? "rgba(0,229,192,0.1)" : "rgba(155,109,255,0.08)",
              color:copiedMDM ? T.teal : T.purple }}>
            {copiedMDM ? "COPIED" : "MDM Note"}
          </button>
          {rec.dispo === "Safe Discharge" && (
            <button onClick={() => setShowReturn(p => !p)}
              style={{ flex:1, padding:"8px 10px", borderRadius:8, cursor:"pointer",
                fontFamily:FF.mono, fontSize:10, fontWeight:700, letterSpacing:0.5,
                border:`1px solid ${showReturn ? T.teal+"66" : "rgba(35,70,115,0.68)"}`,
                background:showReturn ? "rgba(0,229,192,0.1)" : "transparent", color:showReturn ? T.teal : T.txt4 }}>
              Return Precautions
            </button>
          )}
        </div>
      )}
      {showReturn && rec?.dispo === "Safe Discharge" && <ReturnPrecautions />}
    </div>
  );
}

// === VITALS BAR + TROP COUNTDOWN =========================================
export function VitalsBar({ sbp,setSbp,hr,setHr,weight,weightUnit,setWeight,setWeightUnit,
    tropArrivalTime,setTropArrivalTime,t0,
    creatinine,setCreatinine,doorTime,setDoorTime,ekgTime,setEkgTime,
    cathTime,setCathTime,symptomMins,setSymptomMins,chiefComplaint,setChiefComplaint }) {
  const sbpN = parseInt(sbp)||0, hrN = parseInt(hr)||0;
  const sbpLow = sbpN>0 && sbpN<90, hrHigh = hrN>0 && hrN>100;
  const draw3h = tropArrivalTime ? new Date(tropArrivalTime + 3*60*60*1000) : null;
  const draw3hStr = draw3h ? draw3h.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}) : null;
  const now = new Date();
  const overdue = draw3h && now > draw3h;
  const mins = draw3h && !overdue ? Math.round((draw3h-now)/60000) : null;
  return (
    <div style={{ marginBottom:10, padding:"8px 12px", borderRadius:9,
      background:"rgba(14,28,58,0.93)", border:"1px solid rgba(35,70,115,0.72)" }}>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
        {[
          { label:"SBP", val:sbp, set:setSbp, alert:sbpLow, ac:T.coral,  al:"LOW"  },
          { label:"HR",  val:hr,  set:setHr,  alert:hrHigh, ac:T.orange, al:"TACH" },
        ].map(f => (
          <div key={f.label} style={{ display:"flex", alignItems:"center", gap:5 }}>
            <div style={{ fontFamily:FF.mono, fontSize:10, letterSpacing:1,
              color:f.alert ? f.ac : T.txt3, minWidth:24 }}>{f.label}</div>
            <input type="number" value={f.val} onChange={e => f.set(e.target.value)}
              placeholder="--" style={{ width:56, padding:"4px 7px", background:"rgba(14,28,58,0.93)",
                border:`1px solid ${f.alert ? f.ac+"88" : "rgba(35,70,115,0.65)"}`, borderRadius:6, outline:"none",
                fontFamily:FF.mono, fontSize:13, fontWeight:700, color:f.alert ? f.ac : T.txt }} />
            {f.alert && <div style={{ fontFamily:FF.sans, fontSize:10,
              color:f.ac, fontWeight:700 }}>{f.al}</div>}
          </div>
        ))}
        <div style={{ display:"flex", alignItems:"center", gap:5 }}>
          <div style={{ fontFamily:FF.mono, fontSize:10,
            color:T.txt4, letterSpacing:1, minWidth:20 }}>WT</div>
          <input type="number" value={weight} onChange={e => setWeight(e.target.value)}
            placeholder="--" style={{ width:56, padding:"4px 7px", background:"rgba(14,28,58,0.93)",
              border:"1px solid rgba(35,70,115,0.65)", borderRadius:6, outline:"none",
              fontFamily:FF.mono, fontSize:13, fontWeight:700, color:T.blue }} />
          <div style={{ display:"flex", gap:3 }}>
            {["kg","lbs"].map(u => (
              <button key={u} onClick={() => setWeightUnit(u)}
                style={{ fontFamily:FF.mono, fontSize:10, padding:"2px 5px", borderRadius:4, cursor:"pointer",
                  border:`1px solid ${weightUnit===u ? T.blue+"55" : "rgba(35,70,115,0.6)"}`,
                  background:weightUnit===u ? "rgba(59,158,255,0.1)" : "transparent",
                  color:weightUnit===u ? T.blue : T.txt4 }}>{u}</button>
            ))}
          </div>
        </div>
        {/* Creatinine */}
        <div style={{ display:"flex", alignItems:"center", gap:5 }}>
          <div style={{ fontFamily:FF.mono, fontSize:10, color:T.txt4, letterSpacing:1 }}>Cr</div>
          <input type="number" value={creatinine} onChange={e=>setCreatinine(e.target.value)}
            placeholder="--" style={{ width:52, padding:"4px 7px",
              background:"rgba(14,28,58,0.94)", border:"1px solid rgba(35,70,115,0.62)",
              borderRadius:6, outline:"none", fontFamily:FF.mono, fontSize:13,
              fontWeight:700, color:T.purple }} />
          <span style={{ fontFamily:FF.mono, fontSize:10, color:T.txt4 }}>mg/dL</span>
        </div>
        {/* Chief complaint */}
        <input value={chiefComplaint} onChange={e=>setChiefComplaint(e.target.value)}
          placeholder="Chief complaint..."
          style={{ flex:1, minWidth:120, padding:"4px 8px",
            background:"rgba(14,28,58,0.94)", border:"1px solid rgba(35,70,115,0.62)",
            borderRadius:6, outline:"none", fontFamily:FF.sans, fontSize:11, color:T.txt }} />
        {t0 && !tropArrivalTime && (
          <button onClick={() => setTropArrivalTime(Date.now())}
            style={{ fontFamily:FF.mono, fontSize:10, padding:"4px 10px", borderRadius:6, cursor:"pointer",
              border:"1px solid rgba(59,158,255,0.45)", background:"rgba(59,158,255,0.1)", color:T.blue }}>
            Mark 0h
          </button>
        )}
        {draw3hStr && (
          <div style={{ fontFamily:FF.mono, fontSize:10, padding:"4px 9px", borderRadius:6,
            border:`1px solid ${overdue ? T.coral+"66" : T.teal+"44"}`,
            background:overdue ? "rgba(255,107,107,0.1)" : "rgba(0,229,192,0.08)", color:overdue ? T.coral : T.teal }}>
            3h draw {overdue ? "OVERDUE" : `due ${draw3hStr}`}{!overdue && mins!==null ? ` (${mins}m)` : ""}
          </div>
        )}
      </div>
      {sbpLow && (
        <div style={{ marginTop:7, fontFamily:FF.sans, fontSize:10,
          color:T.coral, lineHeight:1.5, padding:"5px 9px", borderRadius:6,
          border:"1px solid rgba(255,107,107,0.3)", background:"rgba(255,107,107,0.08)" }}>
          SBP {sbp} mmHg -- Hold nitrates and diuretics. IV fluid bolus if RV infarct. Vasopressors if cardiogenic shock.
        </div>
      )}
      {hrHigh && (
        <div style={{ marginTop:7, fontFamily:FF.sans, fontSize:10,
          color:T.orange, lineHeight:1.5, padding:"5px 9px", borderRadius:6,
          border:"1px solid rgba(255,159,67,0.3)", background:"rgba(255,159,67,0.08)" }}>
          HR {hr} bpm -- Wells PE hr_gt100 criterion met. Consider ACS vs PE vs demand ischemia.
        </div>
      )}
      {/* ACS Timeline */}
      <div style={{ marginTop:7, display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
        {[
          { label:"Door",     t:doorTime, set:setDoorTime },
          { label:"EKG",      t:ekgTime,  set:setEkgTime  },
          { label:"Cath lab", t:cathTime, set:setCathTime  },
        ].map(item => {
          const mins = item.t && doorTime ? Math.round((item.t - doorTime)/60000) : null;
          const isEkg = item.label==="EKG", isCath = item.label==="Cath lab";
          const over = isEkg?(mins!==null&&mins>10):isCath?(mins!==null&&mins>90):false;
          return (
            <div key={item.label} style={{ display:"flex", alignItems:"center", gap:4 }}>
              {!item.t ? (
                <button onClick={()=>item.set(Date.now())}
                  style={{ fontFamily:FF.mono, fontSize:10, padding:"3px 8px", borderRadius:5,
                    cursor:"pointer", border:"1px solid rgba(35,70,115,0.62)",
                    background:"transparent", color:T.txt4 }}>
                  {item.label}
                </button>
              ) : (
                <div style={{ fontFamily:FF.mono, fontSize:10, padding:"3px 8px", borderRadius:5,
                  border:`1px solid ${over?T.coral+"66":T.teal+"44"}`,
                  background:over?"rgba(255,107,107,0.1)":"rgba(0,229,192,0.08)",
                  color:over?T.coral:T.teal }}>
                  {item.label} {mins!==null?`${mins}m`:""}
                  {over&&isEkg?" ⚠":over&&isCath?" ⚠":""}
                </div>
              )}
            </div>
          );
        })}
        {symptomMins !== "" && (
          <div style={{ fontFamily:FF.mono, fontSize:10, color:T.txt3 }}>
            onset {symptomMins}m ago
          </div>
        )}
        <input type="number" value={symptomMins} onChange={e=>setSymptomMins(e.target.value)}
          placeholder="onset min"
          style={{ width:70, padding:"3px 7px", background:"rgba(14,28,58,0.94)",
            border:"1px solid rgba(35,70,115,0.62)", borderRadius:5, outline:"none",
            fontFamily:FF.mono, fontSize:10, color:T.txt2 }} />
      </div>
    </div>
  );
}

// === STEMI OVERLAY ========================================================
export function STEMIOverlay({ open, onClose, weightKg }) {
  if (!open) return null;
  const wValid = weightKg > 0;
  const ufhPCI   = wValid ? Math.min(Math.round(weightKg*70), 10000) : null;
  const ufhBolus = wValid ? Math.min(Math.round(weightKg*60), 4000)  : null;
  const tnk      = wValid ? Math.min((weightKg*0.5).toFixed(1), 50)  : null;
  const enox     = wValid ? weightKg.toFixed(0) : null;
  return (
    <div style={{ position:"fixed", inset:0, zIndex:9999, overflowY:"auto", background:"rgba(10,18,40,0.99)" }}>
      <div style={{ maxWidth:700, margin:"0 auto", padding:"0 16px 32px" }}>
        <div style={{ padding:"16px 0 10px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontFamily:FF.serif, fontSize:22, fontWeight:900, color:T.red }}>
              STEMI Activation Protocol
            </div>
            <div style={{ fontFamily:FF.mono, fontSize:10, color:T.coral, letterSpacing:1.5, marginTop:4 }}>
              DOOR-TO-BALLOON TARGET: 90 MIN -- FIBRINOLYSIS: 30 MIN
            </div>
          </div>
          <button onClick={onClose}
            style={{ width:38, height:38, borderRadius:"50%", cursor:"pointer",
              fontWeight:900, fontSize:20, border:"1px solid rgba(255,68,68,0.5)",
              background:"rgba(255,68,68,0.12)", color:T.red }}>x</button>
        </div>
        {wValid && (
          <div style={{ padding:"8px 12px", borderRadius:8, marginBottom:12,
            background:"rgba(59,158,255,0.08)", border:"1px solid rgba(59,158,255,0.3)" }}>
            <div style={{ fontFamily:FF.mono, fontSize:10, color:T.blue, letterSpacing:1.2, marginBottom:6 }}>
              COMPUTED DOSES -- {weightKg.toFixed(1)} kg
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
              {[
                { label:"UFH (PCI)", val:`${ufhPCI?.toLocaleString()} u`,  sub:"70 u/kg bolus" },
                { label:"UFH (Lytic)", val:`${ufhBolus?.toLocaleString()} u`, sub:"60 u/kg bolus" },
                { label:"TNK", val:`${tnk} mg`, sub:"0.5 mg/kg IV, max 50" },
                { label:"Enoxaparin", val:`${enox} mg`, sub:"1 mg/kg SQ" },
              ].map(d => (
                <div key={d.label} style={{ textAlign:"center" }}>
                  <div style={{ fontFamily:FF.mono, fontSize:10,
                    color:T.txt4, letterSpacing:0.8, marginBottom:2 }}>{d.label}</div>
                  <div style={{ fontFamily:FF.mono, fontSize:13,
                    fontWeight:700, color:T.blue }}>{d.val}</div>
                  <div style={{ fontFamily:FF.sans, fontSize:8.5,
                    color:T.txt4 }}>{d.sub}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {[
          { color:T.red, label:"IMMEDIATE ACTIONS", steps:[
            "Activate cath lab -- single call for full team",
            "12-lead EKG to interventionalist -- door-to-EKG < 10 min",
            "Aspirin 325 mg chew + Ticagrelor 180 mg (or Clopidogrel 600 mg)",
            "IV access x2, CBC/BMP/coag, type and screen, continuous monitoring",
          ]},
          { color:T.orange, label:"STEMI EQUIVALENTS -- ACTIVATE CATH LAB", steps:[
            "Posterior MI: ST depression V1-V3 + dominant R -- confirm with V7-V9",
            "de Winter T-waves: upsloping STD + tall peaked T waves V1-V6",
            "Wellens (A/B): biphasic or deeply inverted T waves V2-V3 in pain-free ECG",
            "Hyperacute T-waves: broad-based tall asymmetric T waves in 2+ contiguous leads",
            "LBBB + ischemia: Sgarbossa concordant STE >=1mm in any lead = activate",
          ]},
          { color:T.purple, label:"FIBRINOLYSIS (PCI NOT AVAILABLE WITHIN 120 MIN)", steps:[
            wValid ? `TNK: ${tnk} mg IV single bolus (0.5 mg/kg x ${weightKg.toFixed(0)} kg, max 50 mg)` : "TNK: 0.5 mg/kg IV single bolus, max 50 mg",
            "Absolute CIs checked in Fibrinolysis Checklist below",
            "After lysis: transfer IMMEDIATELY to PCI center (pharmacoinvasive strategy)",
          ]},
          { color:T.gold, label:"INFERIOR MI / RV INFARCT", steps:[
            "V4R STE >=1mm = RV involvement -- obtain right-sided leads",
            "HOLD nitrates and diuretics -- preload dependent, will precipitate shock",
            "NS 500 mL IV bolus for hypotension, repeat as needed",
            "Temporary pacing for symptomatic bradycardia or complete heart block",
          ]},
        ].map((sect,i) => (
          <div key={i} style={{ marginBottom:10, padding:"12px 14px", borderRadius:10,
            background:`${sect.color}09`, border:`1px solid ${sect.color}33`, borderLeft:`3px solid ${sect.color}` }}>
            <div style={{ fontFamily:FF.mono, fontSize:10,
              color:sect.color, letterSpacing:1.5, textTransform:"uppercase",
              marginBottom:8 }}>{sect.label}</div>
            {sect.steps.map((step,j) => (
              <div key={j} style={{ display:"flex", gap:8, alignItems:"flex-start", marginBottom:6 }}>
                <span style={{ color:sect.color, fontSize:10, marginTop:3, flexShrink:0 }}>-</span>
                <span style={{ fontFamily:FF.sans,
                  fontSize:12, color:T.txt2, lineHeight:1.6 }}>{step}</span>
              </div>
            ))}
          </div>
        ))}

        {/* Fibrinolysis go/no-go checklist */}
        <FibrinolysisChecklist />
      </div>
    </div>
  );
}

// === FIBRINOLYSIS CHECKLIST
export function FibrinolysisChecklist() {
  const [items, setItems] = useState({});
  const CI_LIST = [
    "Prior intracranial hemorrhage (any)",
    "Known structural cerebral vascular lesion (e.g. AVM)",
    "Known malignant intracranial neoplasm",
    "Ischemic stroke within 3 months",
    "Suspected aortic dissection",
    "Active bleeding or bleeding diathesis (excluding menses)",
    "Significant closed-head / facial trauma within 3 months",
    "Intracranial or intraspinal surgery within 2 months",
  ];
  const anyYes = Object.values(items).some(Boolean);
  const allChecked = CI_LIST.every((_,i)=>items[i]!==undefined);
  const cleared = allChecked && !anyYes;
  return (
    <div style={{ margin:"12px 0", padding:"12px 14px", borderRadius:10,
      background:`${anyYes?T.coral:cleared?T.teal:T.blue}0a`,
      border:`1px solid ${anyYes?T.coral:cleared?T.teal:T.blue}33` }}>
      <div style={{ fontFamily:FF.mono, fontSize:10, color:anyYes?T.coral:cleared?T.teal:T.blue,
        letterSpacing:1.2, textTransform:"uppercase", marginBottom:8 }}>
        TNK / Fibrinolysis Contraindication Checklist
      </div>
      <div style={{ fontFamily:FF.sans, fontSize:10, color:T.txt3, marginBottom:8 }}>
        Mark YES for any item present — one YES = absolute contraindication
      </div>
      {CI_LIST.map((label,i)=>(
        <div key={i} style={{ display:"flex", gap:6, marginBottom:5 }}>
          {["No","Yes"].map(opt=>(
            <button key={opt} onClick={()=>setItems(p=>({...p,[i]:opt==="Yes"}))}
              style={{ padding:"4px 10px", borderRadius:6, cursor:"pointer",
                fontFamily:FF.sans, fontSize:10, fontWeight:600,
                border:`1px solid ${items[i]===( opt==="Yes")?( opt==="Yes"?T.coral:T.teal)+"66":"rgba(35,70,115,0.62)"}`,
                background:items[i]===(opt==="Yes")?(opt==="Yes"?"rgba(255,107,107,0.12)":"rgba(0,229,192,0.1)"):"transparent",
                color:items[i]===(opt==="Yes")?(opt==="Yes"?T.coral:T.teal):T.txt4 }}>
              {opt}
            </button>
          ))}
          <span style={{ fontFamily:FF.sans, fontSize:11, color:items[i]===true?T.coral:T.txt2,
            lineHeight:1.4, flex:1 }}>{label}</span>
        </div>
      ))}
      {(anyYes||cleared) && (
        <div style={{ marginTop:8, padding:"7px 11px", borderRadius:7,
          background:`${anyYes?T.coral:T.teal}15`,
          border:`1px solid ${anyYes?T.coral:T.teal}55`,
          fontFamily:FF.sans, fontWeight:700, fontSize:12,
          color:anyYes?T.coral:T.teal }}>
          {anyYes ? "⚠ CONTRAINDICATED — absolute CI present. Consider mechanical reperfusion." : "✓ CLEARED — no absolute contraindications identified"}
        </div>
      )}
    </div>
  );
}

// === RETURN PRECAUTIONS ===================================================
export function ReturnPrecautions() {
  const [copied, setCopied] = useState(false);
  const text = [
    "RETURN TO THE EMERGENCY DEPARTMENT IMMEDIATELY if you experience:",
    "- Chest pain, pressure, or tightness",
    "- Shortness of breath or difficulty breathing",
    "- Rapid or irregular heartbeat / palpitations",
    "- Sweating, nausea, or feeling faint",
    "- Pain spreading to arm, jaw, neck, or back",
    "- Sudden dizziness or loss of consciousness",
    "",
    "FOLLOW-UP: See your doctor or cardiologist within 72 hours.",
    "Take aspirin 81 mg daily unless instructed otherwise.",
  ].join("\n");
  return (
    <div style={{ marginBottom:12, padding:"12px 14px", borderRadius:10,
      background:"rgba(0,229,192,0.07)", border:"1px solid rgba(0,229,192,0.3)" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <div style={{ fontFamily:FF.mono, fontSize:10, color:T.teal, letterSpacing:1.5, textTransform:"uppercase" }}>
          Patient Return Precautions
        </div>
        <button onClick={() => navigator.clipboard && navigator.clipboard.writeText(text).then(
            () => { setCopied(true); setTimeout(()=>setCopied(false),2500); })}
          style={{ padding:"5px 11px", borderRadius:6, cursor:"pointer", fontFamily:FF.mono, fontSize:10, fontWeight:700,
            border:`1px solid ${copied ? T.teal+"88" : T.teal+"44"}`,
            background:copied ? "rgba(0,229,192,0.15)" : "transparent", color:T.teal }}>
          {copied ? "COPIED" : "COPY"}
        </button>
      </div>
      {["Return immediately for chest pain, pressure, tightness, or shortness of breath",
        "Return for sweating, palpitations, pain radiating to arm/jaw/neck/back, or fainting",
        "Return for sudden dizziness or loss of consciousness",
        "Follow up with your doctor within 72 hours",
        "Take aspirin 81 mg daily unless your doctor says otherwise",
      ].map((item, i) => (
        <div key={i} style={{ display:"flex", gap:7, alignItems:"flex-start", marginBottom:5 }}>
          <span style={{ color:T.teal, fontSize:10, marginTop:2, flexShrink:0 }}>{">"}</span>
          <span style={{ fontFamily:FF.sans, fontSize:12,
            color:T.txt2, lineHeight:1.55 }}>{item}</span>
        </div>
      ))}
    </div>
  );
}

// ═══ END OF ChestPainPanels ═══════════════════════════════════════════════════