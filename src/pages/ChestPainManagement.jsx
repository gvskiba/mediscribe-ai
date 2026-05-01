// ChestPainManagement.jsx — Notrya ChestPainHub
// ACS Protocol, Disposition, Vitals, STEMI overlay, Fibrinolysis, Sgarbossa, Shock, Return Precautions
// Constraints: no form, no localStorage, straight quotes only, single react import

import { useState, useMemo } from "react";
import {
  T, FF, ACS_STEPS, dispositionRec, heartStrata, edacsRisk,
  calcSgarbossa, sgarbossaInterp,
} from "./ChestPainLogic";
import { Bul, InfoBox } from "./ChestPainCalculators";


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
    mdm += "\n" + rec.plan.map((p,i)=>`${i+1}. ${p}`).join("\n");
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
      {rec && (
        <div style={{ marginTop:12 }}>
          <div style={{ fontFamily:FF.mono, fontSize:10, color:T.txt4, letterSpacing:1.2,
            textTransform:"uppercase", marginBottom:6 }}>Continue in Notrya</div>
          <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
            {[
              { label:"ECG Hub",    color:T.blue,   hub:"ECGHub"    },
              { label:"Shock Hub",  color:T.coral,  hub:"ShockHub"  },
              { label:"ERx Hub",    color:T.teal,   hub:"ERxHub"    },
              { label:"Airway Hub", color:T.purple, hub:"AirwayHub" },
            ].map(h => (
              <button key={h.hub}
                onClick={()=>window.dispatchEvent(new CustomEvent("notrya-navigate",{detail:{hub:h.hub}}))}
                style={{ padding:"7px 12px", borderRadius:8, cursor:"pointer",
                  fontFamily:FF.sans, fontWeight:600, fontSize:11,
                  border:`1px solid ${h.color}55`,
                  background:`${h.color}0a`, color:h.color }}>
                {h.label} →
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══ CARDIOGENIC SHOCK PANEL ══════════════════════════════════════════════
export function CardiogenicShockPanel() {
  const [open, setOpen] = useState(false);
  if (!open) return (
    <button onClick={()=>setOpen(true)}
      style={{ width:"100%", minHeight:40, borderRadius:9, cursor:"pointer", marginBottom:8,
        fontFamily:FF.sans, fontWeight:700, fontSize:12,
        border:"1.5px solid rgba(255,107,107,0.45)",
        background:"rgba(255,107,107,0.06)", color:T.coral,
        display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
      Cardiogenic Shock Protocol
    </button>
  );
  return (
    <div style={{ marginBottom:10, padding:"12px 14px", borderRadius:10,
      background:"rgba(14,28,58,0.97)", border:"2px solid rgba(255,107,107,0.45)" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <div style={{ fontFamily:FF.serif, fontSize:16, fontWeight:900, color:T.coral }}>Cardiogenic Shock</div>
        <button onClick={()=>setOpen(false)}
          style={{ background:"transparent", border:"none", color:T.txt3, cursor:"pointer", fontSize:18, fontWeight:700 }}>×</button>
      </div>
      {[
        { color:T.coral, label:"Diagnosis", items:[
          "SBP < 90 mmHg × 30 min OR vasopressors required to maintain SBP ≥ 90",
          "End-organ hypoperfusion: cool extremities, oliguria, altered mentation",
          "Pulmonary congestion (clinical or radiographic)",
          "Reduced cardiac output (CI < 2.2 L/min/m² if PA catheter available)",
        ]},
        { color:T.orange, label:"Immediate", items:[
          "Supplemental O₂, intubate if respiratory failure",
          "STEMI shock → emergent PCI is the definitive therapy",
          "Bedside echo: LV/RV function, tamponade, mechanical complications",
          "Correct reversible causes: arrhythmia, tamponade, pneumothorax",
        ]},
        { color:T.blue, label:"Vasopressors", items:[
          "Norepinephrine 0.1–0.5 mcg/kg/min IV — first-line (SOAP-II trial); MAP target ≥ 65",
          "Dobutamine 2.5–20 mcg/kg/min IV — add for low output / high filling pressures",
          "Dopamine 5–15 mcg/kg/min — second-line only (higher mortality vs NE in SOAP-II)",
          "Vasopressin 0.03–0.04 u/min — adjunct for refractory vasodilation",
          "Avoid phenylephrine — increases afterload with no inotropy",
        ]},
        { color:T.purple, label:"Mechanical Circulatory Support", items:[
          "IABP: reduces afterload, augments diastolic pressure; easiest to place",
          "Impella CP/5.5: 3.7–5.5 L/min support; preferred in high-risk PCI",
          "VA-ECMO: rescue for refractory CS; highest complication rate",
          "SCAI shock classification A–E guides escalation timing",
          "Escalate early if MAP < 65 despite 2 vasopressors",
        ]},
        { color:T.gold, label:"Avoid", items:[
          "Aggressive diuresis in RV shock (preload-dependent)",
          "Beta-blockers acutely in cardiogenic shock",
          "Nitrates if SBP < 90 or RV infarction suspected",
        ]},
      ].map((sect,i) => (
        <div key={i} style={{ marginBottom:8, padding:"8px 12px", borderRadius:8,
          background:`${sect.color}09`, borderLeft:`3px solid ${sect.color}` }}>
          <div style={{ fontFamily:FF.mono, fontSize:9, color:sect.color,
            letterSpacing:1.2, textTransform:"uppercase", marginBottom:5 }}>{sect.label}</div>
          {sect.items.map((item,j) => <Bul key={j} c={sect.color}>{item}</Bul>)}
        </div>
      ))}
    </div>
  );
}

// ═══ VITALS BAR + TROP COUNTDOWN ═════════════════════════════════════════
export function VitalsBar({ sbp,setSbp,hr,setHr,weight,weightUnit,setWeight,setWeightUnit,
    tropArrivalTime,setTropArrivalTime,t0,
    creatinine,setCreatinine,crcl,doorTime,setDoorTime,ekgTime,setEkgTime,
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
        <div style={{ display:"flex", alignItems:"center", gap:5 }}>
          <div style={{ fontFamily:FF.mono, fontSize:10, color:T.txt4, letterSpacing:1 }}>Cr</div>
          <input type="number" value={creatinine} onChange={e=>setCreatinine(e.target.value)}
            placeholder="--" style={{ width:52, padding:"4px 7px",
              background:"rgba(14,28,58,0.94)", border:"1px solid rgba(35,70,115,0.62)",
              borderRadius:6, outline:"none", fontFamily:FF.mono, fontSize:13,
              fontWeight:700, color:T.purple }} />
          <span style={{ fontFamily:FF.mono, fontSize:10, color:T.txt4 }}>mg/dL</span>
          {(crcl !== null && crcl !== undefined) && (
            <div style={{ fontFamily:FF.mono, fontSize:10, fontWeight:700,
              padding:"2px 8px", borderRadius:5,
              color:crcl<30?T.coral:crcl<60?T.gold:T.teal,
              border:`1px solid ${crcl<30?T.coral:crcl<60?T.gold:T.teal}44`,
              background:crcl<30?"rgba(255,107,107,0.1)":crcl<60?"rgba(245,200,66,0.08)":"rgba(0,229,192,0.07)" }}>
              CrCl {crcl}{crcl<30?" ↓ reduce enox":""}
            </div>
          )}
        </div>
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

// ═══ STEMI OVERLAY ════════════════════════════════════════════════════════
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
        <FibrinolysisChecklist />
        <SgarbossaPanel />
      </div>
    </div>
  );
}

// ═══ FIBRINOLYSIS CHECKLIST ════════════════════════════════════════════════
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
                border:`1px solid ${items[i]===(opt==="Yes")?(opt==="Yes"?T.coral:T.teal)+"66":"rgba(35,70,115,0.62)"}`,
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

// ═══ SGARBOSSA PANEL ══════════════════════════════════════════════════════
export function SgarbossaPanel() {
  const [crit, setCrit]       = useState({});
  const [smithST, setSmithST] = useState("");
  const [smithS,  setSmithS]  = useState("");
  const score      = calcSgarbossa({ concordantSTE:crit.cste, concordantSTD:crit.cstd, discordantSTE:crit.dste });
  const smithRatio = smithST && smithS ? Math.abs(parseFloat(smithST)/parseFloat(smithS)) : null;
  const smithPos   = smithRatio !== null && smithRatio >= 0.25;
  const result     = sgarbossaInterp(score, smithPos);
  return (
    <div style={{ margin:"12px 0", padding:"12px 14px", borderRadius:10,
      background:`${result.color}0a`, border:`1px solid ${result.color}33` }}>
      <div style={{ fontFamily:FF.mono, fontSize:10, color:result.color,
        letterSpacing:1.2, textTransform:"uppercase", marginBottom:8 }}>
        Sgarbossa Criteria — LBBB / Paced Rhythm
      </div>
      {[
        { k:"cste", pts:5, label:"Concordant STE ≥ 1 mm in any lead" },
        { k:"cstd", pts:3, label:"Concordant STD ≥ 1 mm in V1–V3" },
        { k:"dste", pts:2, label:"Excessively discordant STE ≥ 5 mm" },
      ].map(f => (
        <button key={f.k} onClick={()=>setCrit(p=>({...p,[f.k]:!p[f.k]}))}
          style={{ display:"flex", alignItems:"center", gap:9, width:"100%",
            padding:"7px 10px", borderRadius:8, cursor:"pointer", marginBottom:5,
            border:`1px solid ${crit[f.k]?T.coral+"55":"rgba(35,70,115,0.65)"}`,
            background:crit[f.k]?"rgba(255,107,107,0.1)":"transparent" }}>
          <div style={{ width:18, height:18, borderRadius:4, flexShrink:0,
            border:`2px solid ${crit[f.k]?T.coral:"rgba(42,79,122,0.55)"}`,
            background:crit[f.k]?T.coral:"transparent",
            display:"flex", alignItems:"center", justifyContent:"center" }}>
            {crit[f.k]&&<span style={{ color:"#050f1e", fontSize:11, fontWeight:900 }}>✓</span>}
          </div>
          <span style={{ fontFamily:FF.sans, fontSize:12, color:T.txt2, flex:1 }}>{f.label}</span>
          <span style={{ fontFamily:FF.mono, fontSize:10, color:T.coral }}>{f.pts} pts</span>
        </button>
      ))}
      <div style={{ display:"flex", gap:8, alignItems:"center", margin:"8px 0 4px" }}>
        <div style={{ fontFamily:FF.sans, fontSize:11, color:T.txt3, flex:1 }}>Modified Smith: STE ÷ S-wave ≥ 0.25</div>
        <input type="number" value={smithST} onChange={e=>setSmithST(e.target.value)}
          placeholder="STE mm"
          style={{ width:68, padding:"4px 7px", background:"rgba(14,28,58,0.94)",
            border:"1px solid rgba(35,70,115,0.65)", borderRadius:6, outline:"none",
            fontFamily:FF.mono, fontSize:12, color:T.coral }} />
        <span style={{ color:T.txt4, fontFamily:FF.mono, fontSize:12 }}>/</span>
        <input type="number" value={smithS} onChange={e=>setSmithS(e.target.value)}
          placeholder="S mm"
          style={{ width:68, padding:"4px 7px", background:"rgba(14,28,58,0.94)",
            border:"1px solid rgba(35,70,115,0.65)", borderRadius:6, outline:"none",
            fontFamily:FF.mono, fontSize:12, color:T.blue }} />
        {smithRatio!==null&&(
          <div style={{ fontFamily:FF.mono, fontSize:11, fontWeight:700, color:smithPos?T.coral:T.teal }}>
            {smithRatio.toFixed(2)}{smithPos?" ✓":""}
          </div>
        )}
      </div>
      <div style={{ padding:"7px 11px", borderRadius:7,
        background:`${result.color}15`, border:`1px solid ${result.color}44` }}>
        <div style={{ fontFamily:FF.serif, fontWeight:700, fontSize:13, color:result.color, marginBottom:2 }}>{result.label}</div>
        <div style={{ fontFamily:FF.sans, fontSize:11, color:T.txt2, lineHeight:1.5 }}>{result.rec}</div>
      </div>
    </div>
  );
}

// ═══ MASSIVE PE FAST LANE ═════════════════════════════════════════════════
export function MassivePEPanel() {
  const [open, setOpen] = useState(false);
  if (!open) return (
    <button onClick={() => setOpen(true)}
      style={{ width:"100%", minHeight:40, borderRadius:9, cursor:"pointer",
        marginTop:8, fontFamily:FF.sans, fontWeight:700, fontSize:12,
        border:"1.5px solid rgba(255,107,107,0.45)",
        background:"rgba(255,107,107,0.06)", color:T.coral,
        display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
      Massive PE Protocol — Systemic Lysis / Embolectomy
    </button>
  );
  return (
    <div style={{ marginTop:8, padding:"12px 14px", borderRadius:10,
      background:"rgba(14,28,58,0.97)", border:"2px solid rgba(255,107,107,0.45)" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <div style={{ fontFamily:FF.serif, fontSize:16, fontWeight:900, color:T.coral }}>Massive PE</div>
        <button onClick={() => setOpen(false)}
          style={{ background:"transparent", border:"none", color:T.txt3,
            cursor:"pointer", fontSize:18, fontWeight:700 }}>×</button>
      </div>
      {[
        { color:T.coral, label:"Systemic Thrombolysis Dosing", items:[
          "Alteplase (tPA): 100 mg IV over 2 hours (preferred regimen, FDA-approved)",
          "Arrest / no IV access: 50 mg IV bolus (2019 ESC rescue thrombolysis)",
          "Heparin: HOLD during infusion, restart when aPTT < 80s after lysis completes",
          "Monitor: BP, O2 sat, neuro status q15 min during infusion",
        ]},
        { color:T.red, label:"Absolute Contraindications to Lysis", items:[
          "Any prior intracranial hemorrhage",
          "Ischemic stroke within 3 months",
          "Active significant internal bleeding (not menses)",
          "Intracranial or intraspinal surgery or trauma within 2 months",
          "Known intracranial neoplasm or AVM",
        ]},
        { color:T.orange, label:"Catheter-Directed Therapy (CDT)", items:[
          "Indication: lysis contraindicated OR failed systemic lysis OR submassive with deterioration",
          "Alteplase CDT dose: 1–2 mg/hr per catheter × 12–24h (much lower bleeding risk)",
          "Requires IR or cardiology with CDT capability",
          "EKOS ultrasound-assisted CDT: 1 mg/hr per catheter × 15h in SEATTLE-II trial",
        ]},
        { color:T.purple, label:"Surgical Embolectomy", items:[
          "Indication: lysis fails, contraindicated, or patient in cardiac arrest",
          "Requires cardiac surgery and cardiopulmonary bypass capability",
          "Notify cardiothoracic surgery early in any patient with massive PE",
          "Transfer immediately if not available at your center",
        ]},
        { color:T.gold, label:"Hemodynamic Support", items:[
          "Norepinephrine 0.1–0.5 mcg/kg/min — first-line vasopressor for PE shock",
          "Avoid aggressive fluid resuscitation: RV already overdistended, fluids worsen RV failure",
          "Cautious fluid bolus 500 mL if clear underfilling, then reassess",
          "Mechanical ventilation: high-risk, causes RV afterload spike — prepare for arrest",
        ]},
      ].map((sect, i) => (
        <div key={i} style={{ marginBottom:8, padding:"8px 12px", borderRadius:8,
          background:`${sect.color}09`, borderLeft:`3px solid ${sect.color}` }}>
          <div style={{ fontFamily:FF.mono, fontSize:9, color:sect.color,
            letterSpacing:1.2, textTransform:"uppercase", marginBottom:5 }}>{sect.label}</div>
          {sect.items.map((item, j) => <Bul key={j} c={sect.color}>{item}</Bul>)}
        </div>
      ))}
    </div>
  );
}

// ═══ RETURN PRECAUTIONS ═══════════════════════════════════════════════════
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