// ChestPainCalculators.jsx — Notrya ChestPainHub
// Micro-components + clinical score calculators
// Constraints: no form, no localStorage, straight quotes, single react import

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  T, FF, HEART_ITEMS, heartStrata, TROPONIN_UNITS, HST, evalHST, calcTrop,
  calcEDACS, edacsRisk, SPESI_ITEMS, spesiInterp, calcGRACE, graceInterp,
  TIMI_ITEMS, timiInterp,
} from "./ChestPainLogic";


// ChestPainPanels.jsx — Notrya ChestPainHub UI components
// Micro-components, tab panels, bedside tools
// Constraints: no form, no localStorage, straight quotes, single react import

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  T, FF, HEART_ITEMS, heartStrata, TROPONIN_UNITS, HST, evalHST, calcTrop,
  calcEDACS, edacsRisk, WELLS_ITEMS, PERC_ITEMS, wellsInterp,
  ADDRS_ITEMS, addrsInterp, ACS_STEPS, dispositionRec,
  DDX_REF, DDX_TABS, SPESI_ITEMS, spesiInterp, calcGRACE, graceInterp,
  TIMI_ITEMS, timiInterp, calcSgarbossa, sgarbossaInterp,
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
export function HeartTab({ scores, setScores, tropInterp, killip, setKillip, cardiacArrest, setCardiacArrest, graceScore, graceResult, graceAge, setGraceAge }) {
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
                </button>
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
          <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:8 }}>
            <div style={{ fontFamily:FF.sans, fontSize:11, color:T.txt3 }}>Age:</div>
            <input type="number" value={graceAge||(edacsFields?.age||"")} onChange={e=>setGraceAge&&setGraceAge(e.target.value)}
              placeholder="yrs"
              style={{ width:60, padding:"4px 8px", background:"rgba(14,28,58,0.94)",
                border:"1px solid rgba(35,70,115,0.65)", borderRadius:6, outline:"none",
                fontFamily:FF.mono, fontSize:13, fontWeight:700, color:T.blue }} />
            <div style={{ fontFamily:FF.sans, fontSize:10, color:T.txt4 }}>Overrides EDACS age. HR + SBP from vitals bar.</div>
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

// === TIMI PANEL ==========================================================
export function TimiPanel({ timi, setTimi }) {
  const score  = TIMI_ITEMS.reduce((s,i)=>s+(timi[i.key]?1:0),0);
  const result = timiInterp(score);
  return (
    <div style={{ padding:"12px 14px", borderRadius:10, marginTop:10,
      background:"rgba(14,28,58,0.94)", border:"1px solid rgba(35,70,115,0.68)" }}>
      <div style={{ fontFamily:FF.mono, fontSize:10, color:T.orange, letterSpacing:1.2,
        textTransform:"uppercase", marginBottom:8 }}>
        TIMI Risk Score
        <span style={{ fontFamily:FF.sans, color:T.txt3, fontSize:11, fontWeight:400,
          letterSpacing:0, textTransform:"none", marginLeft:6 }}>UA / NSTEMI</span>
      </div>
      {TIMI_ITEMS.map(it => (
        <button key={it.key} onClick={()=>setTimi(p=>({...p,[it.key]:!p[it.key]}))}
          style={{ display:"flex", alignItems:"center", gap:9, width:"100%",
            padding:"7px 10px", borderRadius:8, cursor:"pointer", marginBottom:5,
            border:`1px solid ${timi[it.key]?T.orange+"55":"rgba(35,70,115,0.65)"}`,
            background:timi[it.key]?"rgba(255,159,67,0.08)":"transparent" }}>
          <div style={{ width:18, height:18, borderRadius:4, flexShrink:0,
            border:`2px solid ${timi[it.key]?T.orange:"rgba(42,79,122,0.55)"}`,
            background:timi[it.key]?T.orange:"transparent",
            display:"flex", alignItems:"center", justifyContent:"center" }}>
            {timi[it.key]&&<span style={{ color:"#050f1e", fontSize:11, fontWeight:900 }}>✓</span>}
          </div>
          <span style={{ fontFamily:FF.sans, fontSize:12, color:T.txt2, flex:1 }}>{it.label}</span>
          <span style={{ fontFamily:FF.mono, fontSize:10, color:T.orange }}>+1</span>
        </button>
      ))}
      <div style={{ marginTop:8, padding:"8px 11px", borderRadius:8,
        background:`${result.color}0a`, border:`1px solid ${result.color}33` }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:3 }}>
          <div style={{ fontFamily:FF.serif, fontWeight:700, fontSize:14, color:result.color }}>{result.label}</div>
          <div style={{ fontFamily:FF.mono, fontSize:24, fontWeight:900, color:result.color }}>{score}/7</div>
        </div>
        <div style={{ fontFamily:FF.mono, fontSize:10, color:result.color, marginBottom:2 }}>14-day MACE: {result.mortality}</div>
        <div style={{ fontFamily:FF.sans, fontSize:11, color:T.txt2, lineHeight:1.5 }}>{result.rec}</div>
      </div>
    </div>
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