// ChestPainCalculators.jsx — Notrya ChestPainHub
// Micro-components + clinical score calculators
// Constraints: no form, no localStorage, straight quotes, single react import

import { useState, useMemo } from "react";
import {
  T, FF, HEART_ITEMS, heartStrata, TROPONIN_UNITS, HST, evalHST, calcTrop,
  calcEDACS, edacsRisk, SPESI_ITEMS, spesiInterp, calcGRACE, graceInterp,
  TIMI_ITEMS, timiInterp,
} from "./ChestPainLogic";

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