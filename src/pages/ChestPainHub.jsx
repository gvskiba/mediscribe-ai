// ChestPainHub.jsx — Notrya ChestPainHub shell, state, guided workflow, main export
// Constraints: no form, no localStorage, straight quotes, single react import

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  T, FF, TABS, HEART_ITEMS, GUIDED_STEPS, dispositionRec, heartStrata,
  calcTrop, evalHST, calcEDACS, edacsRisk, calcGRACE, graceInterp,
  WELLS_ITEMS, PERC_ITEMS, ADDRS_ITEMS, wellsInterp, addrsInterp, calcCrCl,
  SPESI_ITEMS, spesiInterp, TIMI_ITEMS, timiInterp,
} from "./ChestPainLogic";
import {
  TabBtn, SummaryStrip, HeartTab, TroponinTab, EdacsTab,
  NavBtn, SkipBtn, TimiPanel,
} from "./ChestPainCalculators";
import {
  DifferentialsTab,
} from "./ChestPainDDx";
import {
  ProtocolTab, DispoTab, VitalsBar, STEMIOverlay, CardiogenicShockPanel,
} from "./ChestPainManagement";


if (typeof document !== "undefined") {
  if (!document.getElementById("cph-fonts")) {
    const l = document.createElement("link");
    l.id = "cph-fonts"; l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
    document.head.appendChild(l);
    const s = document.createElement("style"); s.id = "cph-css";
    s.textContent = `
      @keyframes cph-fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
      .cph-fade{animation:cph-fade .2s ease forwards}
      @keyframes shimmer-cph{0%{background-position:-200% center}100%{background-position:200% center}}
      .shimmer-cph{background:linear-gradient(90deg,#e8f0fe 0%,#ff9f43 40%,#ff6b6b 65%,#e8f0fe 100%);
        background-size:250% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;
        background-clip:text;animation:shimmer-cph 4s linear infinite;}
    `;
    document.head.appendChild(s);
  }
}

function GuidedHeader({ step, total, label, color, onTabsSwitch }) {
  const pct = step === 0 ? 0 : Math.round((step / (total - 1)) * 100);
  return (
    <div style={{ marginBottom:20 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {step > 0 && (
            <div style={{ fontFamily:FF.mono, fontSize:10, color:T.txt4, letterSpacing:1 }}>
              STEP {step} / {total - 1}
            </div>
          )}
          {label && (
            <div style={{ fontFamily:FF.serif, fontSize:14, fontWeight:700, color:color || T.txt2 }}>
              {label}
            </div>
          )}
        </div>
        <button onClick={onTabsSwitch}
          style={{ fontFamily:FF.mono, fontSize:10, padding:"3px 10px", borderRadius:6, cursor:"pointer",
            letterSpacing:1, textTransform:"uppercase", border:"1px solid rgba(35,70,115,0.72)",
            background:"transparent", color:T.txt4 }}>
          Reference →
        </button>
      </div>
      {step > 0 && (
        <div style={{ height:4, borderRadius:2, background:"rgba(35,70,115,0.65)" }}>
          <div style={{ height:"100%", borderRadius:2, width:`${pct}%`, transition:"width .3s ease",
            background:`linear-gradient(90deg,${T.coral},${T.blue})` }} />
        </div>
      )}
    </div>
  );
}

function GuidedOption({ opt, selected, color, onSelect }) {
  const isSel = selected === opt.val;
  return (
    <button onClick={() => onSelect(opt.val)}
      style={{ display:"flex", alignItems:"center", gap:14, width:"100%", minHeight:64, padding:"14px 16px",
        borderRadius:12, cursor:"pointer", textAlign:"left",
        border:`1.5px solid ${isSel ? color+"88" : "rgba(35,70,115,0.72)"}`, marginBottom:10, transition:"all .12s",
        background:isSel
          ? `linear-gradient(135deg,${color}20,${color}08)`
          : "rgba(14,28,58,0.82)", borderLeft:`4px solid ${isSel ? color : "rgba(35,70,115,0.62)"}` }}>
      <div style={{ width:36, height:36, borderRadius:"50%", flexShrink:0,
        display:"flex", alignItems:"center", justifyContent:"center", background:isSel ? color : "rgba(18,40,80,0.8)",
        fontFamily:FF.mono, fontWeight:900, fontSize:16, color:isSel ? "#050f1e" : T.txt4 }}>
        {opt.val}
      </div>
      <div style={{ flex:1 }}>
        <div style={{ fontFamily:FF.sans, fontWeight:600, fontSize:14, color:isSel ? color : T.txt }}>
          {opt.label}
        </div>
        {opt.sub && (
          <div style={{ fontFamily:FF.sans, fontSize:11, color:T.txt4, marginTop:3, lineHeight:1.45 }}>
            {opt.sub}
          </div>
        )}
      </div>
      {isSel && (
        <div style={{ width:22, height:22, borderRadius:"50%", flexShrink:0,
          background:color, display:"flex", alignItems:"center",
          justifyContent:"center", color:"#050f1e", fontSize:13, fontWeight:900 }}>
          ✓
        </div>
      )}
    </button>
  );
}


// === ENCOUNTER LOG ========================================================
function EncounterLog({ log }) {
  if (!log || log.length === 0) return null;
  return (
    <div style={{ marginBottom:10, padding:"8px 12px", borderRadius:9,
      background:"rgba(14,28,58,0.88)", border:"1px solid rgba(35,70,115,0.65)" }}>
      <div style={{ fontFamily:FF.mono, fontSize:10, color:T.txt4, letterSpacing:1.2,
        textTransform:"uppercase", marginBottom:6 }}>Session Log</div>
      {log.map((enc, i) => {
        const timeStr = new Date(enc.ts).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
        const stCol = enc.strata==="Low Risk"?T.teal:enc.strata==="High Risk"?T.coral:T.gold;
        const tCol  = enc.tropInterp==="acs"?T.coral:enc.tropInterp==="elevated"?T.gold:enc.tropInterp==="normal"?T.teal:T.txt4;
        return (
          <div key={i} style={{ display:"flex", gap:10, alignItems:"center",
            padding:"4px 0", borderTop:i>0?"1px solid rgba(35,70,115,0.4)":"none" }}>
            <div style={{ fontFamily:FF.mono, fontSize:10, color:T.txt4, minWidth:38 }}>{timeStr}</div>
            {enc.heartScore!==null && (
              <div style={{ fontFamily:FF.mono, fontSize:11, fontWeight:700, color:stCol }}>
                HEART {enc.heartScore}
              </div>
            )}
            {enc.tropInterp && (
              <div style={{ fontFamily:FF.mono, fontSize:10, color:tCol }}>{enc.tropInterp}</div>
            )}
            {enc.strata && enc.strata!=="--" && (
              <div style={{ fontFamily:FF.sans, fontSize:10, color:stCol }}>{enc.strata}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function GuidedWorkflow({
  step, setStep,
  heartScores, setHeartScores,
  t0,setT0,t1,setT1,t2,setT2,uln,setULN,unit,setUnit,tropMode,setTropMode,
  edacsFields,setEdacsFields,edacsNegTrop,setEdacsNegTrop,
  tropResult,tropInterp,heartTotal,edacsScore,
  wellsScore,wellsInterResult,addrsScore,addrsResult,
  onTabsSwitch,onReset,
}) {
  const current   = GUIDED_STEPS[step];
  const heartItem = current.heartKey ? HEART_ITEMS.find(i => i.key === current.heartKey) : null;
  const handleHeartSelect = useCallback((key, val) => {
    setHeartScores(p => ({ ...p, [key]:val }));
    setTimeout(() => setStep(s => s+1), 200);
  }, [setHeartScores, setStep]);
  const canAdvanceTrop  = t0 !== "";
  const canAdvanceEdacs = (parseInt(edacsFields.age)||0) >= 18;
  const stepIdx = GUIDED_STEPS.findIndex(s => s.id === current.id);

  // WELCOME
  if (current.type === "welcome") return (
    <div className="cph-fade">
      <GuidedHeader step={0} total={GUIDED_STEPS.length} label="" onTabsSwitch={onTabsSwitch} />
      <div style={{ textAlign:"center", padding:"24px 0 32px" }}>
        <div style={{ fontSize:52, marginBottom:16 }}>❤️</div>
        <h2 style={{ fontFamily:FF.serif, fontSize:"clamp(22px,5vw,34px)", fontWeight:900,
          color:T.txt, letterSpacing:-0.5, marginBottom:8 }}>Chest Pain Evaluation</h2>
        <p style={{ fontFamily:FF.sans, fontSize:13, color:T.txt3, lineHeight:1.65,
          maxWidth:340, margin:"0 auto 32px" }}>
          Guided bedside workflow. Complete each screen in sequence for a risk-stratified disposition.
        </p>
        <div style={{ display:"flex", flexDirection:"column", gap:10, maxWidth:380, margin:"0 auto" }}>
          <button onClick={() => setStep(1)}
            style={{ width:"100%", minHeight:58, borderRadius:13, cursor:"pointer",
              fontFamily:FF.sans, fontWeight:700, fontSize:16, border:"1.5px solid rgba(255,107,107,0.5)",
              background:"linear-gradient(135deg,rgba(255,107,107,0.18),rgba(255,107,107,0.06))", color:T.coral }}>
            Start Evaluation →
          </button>
          <button onClick={onTabsSwitch}
            style={{ width:"100%", minHeight:44, borderRadius:10, cursor:"pointer",
              fontFamily:FF.sans, fontWeight:600, fontSize:13,
              border:"1px solid rgba(35,70,115,0.68)", background:"transparent", color:T.txt4 }}>
            Open Reference Mode
          </button>
        </div>
      </div>
      {heartTotal !== null && (
        <div style={{ padding:"10px 14px", borderRadius:9,
          background:"rgba(0,229,192,0.07)", border:"1px solid rgba(0,229,192,0.25)",
          fontFamily:FF.sans, fontSize:11, color:T.teal, textAlign:"center" }}>
          Previous evaluation in progress — tap Start to continue
        </div>
      )}
    </div>
  );

  // HEART steps (one branch handles all 5 via heartItem)
  if (current.type === "heart" && heartItem) return (
    <div className="cph-fade">
      <GuidedHeader step={stepIdx} total={GUIDED_STEPS.length}
        label={heartItem.label} color={heartItem.color} onTabsSwitch={onTabsSwitch} />
      <div style={{ fontFamily:FF.sans, fontSize:12, color:T.txt3, marginBottom:14, lineHeight:1.55 }}>
        {heartItem.hint}
      </div>
      {heartItem.options.map(opt => (
        <GuidedOption key={opt.val} opt={opt} selected={heartScores[heartItem.key]}
          color={heartItem.color} onSelect={v => handleHeartSelect(heartItem.key, v)} />
      ))}
      <div style={{ display:"flex", gap:10, marginTop:4 }}>
        <NavBtn active onClick={() => setStep(s => s-1)} c={T.txt3} compact>← Back</NavBtn>
        <NavBtn active={heartScores[heartItem.key] !== undefined}
          onClick={() => heartScores[heartItem.key] !== undefined && setStep(s => s+1)}
          c={heartItem.color}>Next →</NavBtn>
      </div>
    </div>
  );

  // TROPONIN step — delegates to existing TroponinTab
  if (current.type === "troponin") return (
    <div className="cph-fade">
      <GuidedHeader step={stepIdx} total={GUIDED_STEPS.length}
        label="Troponin Values" color={T.blue} onTabsSwitch={onTabsSwitch} />
      <TroponinTab t0={t0} setT0={setT0} t1={t1} setT1={setT1} t2={t2} setT2={setT2}
        uln={uln} setULN={setULN} unit={unit} setUnit={setUnit} mode={tropMode} setMode={setTropMode} />
      <div style={{ display:"flex", gap:10, marginTop:12 }}>
        <NavBtn active onClick={() => setStep(s => s-1)} c={T.txt3} compact>← Back</NavBtn>
        <NavBtn active={canAdvanceTrop} onClick={() => canAdvanceTrop && setStep(s => s+1)} c={T.blue}>Next →</NavBtn>
      </div>
      <SkipBtn onClick={() => setStep(s => s+1)}>Skip — troponin pending / not yet resulted</SkipBtn>
    </div>
  );

  // EDACS step — delegates to existing EdacsTab
  if (current.type === "edacs") return (
    <div className="cph-fade">
      <GuidedHeader step={stepIdx} total={GUIDED_STEPS.length}
        label="EDACS Screen" color={T.purple} onTabsSwitch={onTabsSwitch} />
      <EdacsTab fields={edacsFields} setFields={setEdacsFields}
        negTrop={edacsNegTrop} setNegTrop={setEdacsNegTrop} />
      <div style={{ display:"flex", gap:10, marginTop:12 }}>
        <NavBtn active onClick={() => setStep(s => s-1)} c={T.txt3} compact>← Back</NavBtn>
        <NavBtn active={canAdvanceEdacs} onClick={() => canAdvanceEdacs && setStep(s => s+1)} c={T.purple}>View Disposition →</NavBtn>
      </div>
      <SkipBtn onClick={() => setStep(s => s+1)}>Skip EDACS</SkipBtn>
    </div>
  );

  // DISPO step — delegates to existing DispoTab
  if (current.type === "dispo") {
    const rec = dispositionRec(heartTotal, tropInterp);
    return (
      <div className="cph-fade">
        <GuidedHeader step={stepIdx} total={GUIDED_STEPS.length}
          label="Disposition" color={rec ? rec.color : T.teal} onTabsSwitch={onTabsSwitch} />
        <DispoTab heartScore={heartTotal} tropInterp={tropInterp}
          edacsScore={edacsScore} edacsNegTrop={edacsNegTrop} tropResult={tropResult}
          wellsScore={wellsScore} wellsInterResult={wellsInterResult}
          addrsScore={addrsScore} addrsResult={addrsResult}
          sbp={sbp} hr={hr} weight={weight} weightUnit={weightUnit}
          creatinine={creatinine} chiefComplaint={chiefComplaint} />
        <div style={{ display:"flex", gap:10, marginTop:12 }}>
          <NavBtn active onClick={() => setStep(s => s-1)} c={T.txt3} compact>← Back</NavBtn>
          <NavBtn active onClick={onTabsSwitch} c={T.blue}>Full Reference →</NavBtn>
        </div>
        <button onClick={onReset}
          style={{ width:"100%", marginTop:10, minHeight:44, borderRadius:10, cursor:"pointer",
            fontFamily:FF.sans, fontWeight:600, fontSize:12, border:"1px solid rgba(255,107,107,0.35)",
            background:"rgba(255,107,107,0.06)", color:T.coral }}>
          New Patient — Reset All
        </button>
      </div>
    );
  }

  return null;
}

export default function ChestPainHub({ embedded = false, onBack }) {
  const [tab,        setTab]        = useState("heart");
  const [uiMode,     setUiMode]     = useState("guided");   // "guided" | "tabs"
  const [guidedStep, setGuidedStep] = useState(0);

  // HEART
  const [heartScores, setHeartScores] = useState({});

  // Troponin — lifted so DispoTab, SummaryStrip, and HST logic can all read it
  const [t0, setT0] = useState(""); const [t1, setT1] = useState("");
  const [t2, setT2] = useState(""); const [uln, setULN] = useState("0.04");
  const [unit, setUnit] = useState("ng/mL"); const [mode, setMode] = useState("conventional");

  // EDACS — lifted so state persists across tab switches
  const [edacsFields, setEdacsFields] = useState({
    age:"", sex:"M", diaphoresis:false, radiation:false, inspiratory:false, palpation:false, knownCAD:false,
  });
  const [edacsNegTrop, setEdacsNegTrop] = useState(true);

  // DDx — lifted so state persists across tab switches
  const [ddxSub, setDdxSub] = useState("pe");
  const [wells,  setWells]  = useState({});
  const [perc,   setPerc]   = useState({});
  const [addrs,  setAddrs]  = useState({});

  // Protocol expanded state -- persistent
  const [protocolExpanded, setProtocolExpanded] = useState(null);
  const [graceAge,     setGraceAge]     = useState("");
  const [timi,         setTimi]         = useState({});
  const [encounterLog, setEncounterLog] = useState([]); // { ts, heartScore, strata, tropInterp, dispo }
  // GRACE + clinical inputs
  const [killip,        setKillip]       = useState(1);
  const [cardiacArrest, setCardiacArrest]= useState(false);
  const [creatinine,    setCreatinine]   = useState("");
  const [chiefComplaint,setChiefComplaint]=useState("");
  // ACS timeline
  const [doorTime,      setDoorTime]     = useState(null);
  const [ekgTime,       setEkgTime]      = useState(null);
  const [cathTime,      setCathTime]     = useState(null);
  const [symptomMins,   setSymptomMins]  = useState("");
  // sPESI local state lifted to main so it persists
  const [spesi,         setSpesi]        = useState({});
  // P2-P5: vitals, weight, trop arrival timestamp, STEMI overlay
  const [sbp,             setSbp]             = useState("");
  const [hr,              setHr]              = useState("");
  const [weight,          setWeight]          = useState("");
  const [weightUnit,      setWeightUnit]      = useState("kg");
  const [tropArrivalTime, setTropArrivalTime] = useState(null);
  const [stemiOpen,       setStemiOpen]       = useState(false);

  const heartTotal = useMemo(() => {
    const vals = HEART_ITEMS.map(i => heartScores[i.key]);
    if (vals.some(v => v === undefined)) return null;
    return vals.reduce((s, v) => s + v, 0);
  }, [heartScores]);

  const tropResult = useMemo(() => calcTrop(t0,t1,t2,uln), [t0,t1,t2,uln]);

  // HST fix: derive tropInterp from the correct protocol
  const tropInterp = useMemo(() => {
    if (mode === "hst") {
      const r = evalHST(t0, t1);
      if (!r) return null;
      if (r.result === "rule_out") return "normal";
      if (r.result === "rule_in")  return "acs";
      return "elevated";
    }
    return tropResult ? tropResult.interp : null;
  }, [mode, t0, t1, tropResult]);

  const edacsScore = useMemo(() => {
    const a = parseInt(edacsFields.age) || 0;
    return a >= 18 ? calcEDACS(edacsFields) : null;
  }, [edacsFields]);

  const wellsScore       = useMemo(() => WELLS_ITEMS.reduce((s,i) => s + (wells[i.key] ? i.pts : 0), 0), [wells]);
  const wellsInterResult = useMemo(() => wellsInterp(wellsScore), [wellsScore]);
  const addrsScore       = useMemo(() => ADDRS_ITEMS.reduce((s,i) => s + (addrs[i.key] ? 1 : 0), 0), [addrs]);
  const addrsResult      = useMemo(() => addrsInterp(addrsScore), [addrsScore]);

  const weightKg = useMemo(() => {
    const w = parseFloat(weight);
    return (!isNaN(w) && w > 0) ? (weightUnit==="lbs" ? w*0.453592 : w) : null;
  }, [weight, weightUnit]);

  const crcl = useMemo(() =>
    calcCrCl(edacsFields.age, weightKg, edacsFields.sex, creatinine),
    [edacsFields.age, edacsFields.sex, weightKg, creatinine]);

  const graceScore = useMemo(() => calcGRACE({
    age: graceAge || edacsFields.age, hr, sbp,
    creatinine, killip, cardiacArrest,
    stDev: (heartScores.ecg||0) >= 1,
    enzymes: tropInterp && tropInterp !== "normal",
  }), [edacsFields.age, graceAge, hr, sbp, creatinine, killip, cardiacArrest, heartScores.ecg, tropInterp]);

  const graceResult = useMemo(() => graceInterp(graceScore), [graceScore]);

  const handleBack = useCallback(() => {
    if (onBack) onBack(); else window.history.back();
  }, [onBack]);

  // Wire cross-hub navigation to shell
  useEffect(() => {
    const h = (e) => {
      const target = e?.detail?.hub;
      if (!target) return;
      // Re-dispatch as notrya-hub-request for NotryaLayout to handle
      window.dispatchEvent(new CustomEvent("notrya-hub-request", { detail:{ hub:target }, bubbles:true }));
    };
    window.addEventListener("notrya-navigate", h);
    return () => window.removeEventListener("notrya-navigate", h);
  }, []);

  return (
    <div style={{ fontFamily:FF.sans, background:embedded ? "transparent" : T.bg,
      minHeight:embedded ? "auto" : "100vh", color:T.txt }}>
      <div style={{ maxWidth:900, margin:"0 auto", padding:embedded ? "0" : "0 16px" }}>

        {!embedded && (
          <div style={{ padding:"18px 0 14px" }}>
            <button onClick={handleBack}
              style={{ marginBottom:10, display:"inline-flex", alignItems:"center", gap:7,
                fontFamily:FF.sans, fontSize:12, fontWeight:600,
                padding:"5px 14px", borderRadius:8, background:"rgba(14,28,58,0.88)",
                border:"1px solid rgba(35,70,115,0.75)", color:T.txt3, cursor:"pointer" }}>
              ← Back to Hub
            </button>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
              <div style={{ background:"rgba(14,28,58,0.94)", border:"1px solid rgba(35,70,115,0.75)",
                borderRadius:10, padding:"5px 12px", display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontFamily:FF.mono, fontSize:10, color:T.purple, letterSpacing:3 }}>NOTRYA</span>
                <span style={{ color:T.txt4, fontFamily:FF.mono, fontSize:10 }}>/</span>
                <span style={{ fontFamily:FF.mono, fontSize:10, color:T.txt3, letterSpacing:2 }}>CHEST PAIN</span>
              </div>
              <div style={{ height:1, flex:1, background:"linear-gradient(90deg,rgba(255,107,107,0.5),transparent)" }} />
            </div>
            <h1 className="shimmer-cph"
              style={{ fontFamily:FF.serif, fontSize:"clamp(22px,4vw,38px)",
                fontWeight:900, letterSpacing:-0.5, lineHeight:1.1 }}>
              Chest Pain Hub
            </h1>
            <p style={{ fontFamily:FF.sans, fontSize:12, color:T.txt4, marginTop:4 }}>
              HEART Score · Serial Troponin · EDACS · PE / Dissection / Pericarditis · ACS Protocol · Disposition
            </p>
          </div>
        )}

        {/* Mode toggle */}
        <div style={{ display:"flex", gap:6, marginBottom:12 }}>
          {[
            {id:"guided",  label:"🎯 Guided",    desc:"Bedside workflow"},
            {id:"tabs",    label:"📚 Reference", desc:"All tools"},
          ].map(m => (
            <button key={m.id} onClick={() => setUiMode(m.id)}
              style={{ flex:1, padding:"9px 12px", borderRadius:10, cursor:"pointer",
                fontFamily:FF.sans, fontWeight:600, fontSize:12,
                border:`1.5px solid ${uiMode===m.id ? T.coral+"66" : "rgba(35,70,115,0.68)"}`, background:uiMode===m.id
                  ? "linear-gradient(135deg,rgba(255,107,107,0.15),rgba(255,107,107,0.05))"
                  : "rgba(14,28,58,0.80)", color:uiMode===m.id ? T.coral : T.txt2 }}>
              {m.label}
              <div style={{ fontFamily:FF.mono, fontSize:10, color:uiMode===m.id ? T.coral : T.txt3, opacity:1,
                letterSpacing:0.5, marginTop:2 }}>{m.desc}</div>
            </button>
          ))}
        </div>

        {/* Vitals bar */}
        <VitalsBar sbp={sbp} setSbp={setSbp} hr={hr} setHr={setHr}
          weight={weight} weightUnit={weightUnit}
          setWeight={setWeight} setWeightUnit={setWeightUnit}
          tropArrivalTime={tropArrivalTime} setTropArrivalTime={setTropArrivalTime} t0={t0}
          creatinine={creatinine} setCreatinine={setCreatinine} crcl={crcl}
          doorTime={doorTime} setDoorTime={setDoorTime}
          ekgTime={ekgTime} setEkgTime={setEkgTime}
          cathTime={cathTime} setCathTime={setCathTime}
          symptomMins={symptomMins} setSymptomMins={setSymptomMins}
          chiefComplaint={chiefComplaint} setChiefComplaint={setChiefComplaint} />

        <CardiogenicShockPanel />
        {/* STEMI fast lane */}
        <button onClick={() => setStemiOpen(true)}
          style={{ width:"100%", minHeight:44, borderRadius:10, cursor:"pointer",
            marginBottom:12, fontFamily:FF.sans, fontWeight:700, fontSize:13, border:"1.5px solid rgba(255,68,68,0.55)",
            background:"linear-gradient(135deg,rgba(255,68,68,0.15),rgba(255,68,68,0.05))",
            color:T.red, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
          STEMI Activation Protocol
          <span style={{ fontFamily:FF.mono, fontSize:10,
            color:"rgba(255,68,68,0.6)" }}>TAP TO OPEN</span>
        </button>
        <STEMIOverlay open={stemiOpen} onClose={() => setStemiOpen(false)} weightKg={weightKg} />

        {uiMode === "guided" ? (
          <GuidedWorkflow
            step={guidedStep} setStep={setGuidedStep}
            heartScores={heartScores} setHeartScores={setHeartScores}
            t0={t0} setT0={setT0} t1={t1} setT1={setT1}
            t2={t2} setT2={setT2} uln={uln} setULN={setULN}
            tropMode={mode} setTropMode={setMode}
            edacsFields={edacsFields} setEdacsFields={setEdacsFields}
            edacsNegTrop={edacsNegTrop} setEdacsNegTrop={setEdacsNegTrop}
            tropResult={tropResult} tropInterp={tropInterp}
            heartTotal={heartTotal} edacsScore={edacsScore}
            wellsScore={wellsScore} wellsInterResult={wellsInterResult}
            addrsScore={addrsScore} addrsResult={addrsResult}
            onTabsSwitch={() => setUiMode("tabs")}
            onReset={() => {
              setHeartScores({}); setT0(""); setT1(""); setT2("");
              setULN("0.04"); setMode("conventional");
              setEdacsFields({ age:"", sex:"M", diaphoresis:false,
                radiation:false, inspiratory:false, palpation:false, knownCAD:false });
              setEdacsNegTrop(true);
              setWells({}); setPerc({}); setAddrs({});
              setTropArrivalTime(null);
              setKillip(1); setCardiacArrest(false);
              setCreatinine(""); setChiefComplaint("");
              setDoorTime(null); setEkgTime(null); setCathTime(null);
              setSymptomMins(""); setSpesi({});
              setGuidedStep(0);
            }}
          />
        ) : (
          <>
            <div style={{ display:"flex", gap:4, flexWrap:"wrap", padding:"6px",
              marginBottom:12, background:"rgba(14,28,58,0.88)",
              border:"1px solid rgba(35,70,115,0.68)", borderRadius:12 }}>
              {TABS.map(t => (
                <TabBtn key={t.id} tab={t} active={tab===t.id}
                  onClick={() => setTab(t.id)} />
              ))}
            </div>
            <SummaryStrip heartScore={heartTotal} tropInterp={tropInterp}
              edacsScore={edacsScore} edacsNegTrop={edacsNegTrop} />
            <EncounterLog log={encounterLog} />
            <div>
              {tab === "heart"    && <HeartTab scores={heartScores}
                setScores={setHeartScores} tropInterp={tropInterp}
                killip={killip} setKillip={setKillip}
                cardiacArrest={cardiacArrest} setCardiacArrest={setCardiacArrest}
                graceScore={graceScore} graceResult={graceResult}
                graceAge={graceAge} setGraceAge={setGraceAge} />}
              {tab === "heart" && <TimiPanel timi={timi} setTimi={setTimi} />}
              {tab === "troponin" && <TroponinTab t0={t0} setT0={setT0}
                t1={t1} setT1={setT1} t2={t2} setT2={setT2}
                uln={uln} setULN={setULN} unit={unit} setUnit={setUnit}
                mode={mode} setMode={setMode} />}
              {tab === "edacs"    && <EdacsTab fields={edacsFields}
                setFields={setEdacsFields} negTrop={edacsNegTrop}
                setNegTrop={setEdacsNegTrop} />}
              {tab === "ddx"      && <DifferentialsTab ddxSub={ddxSub}
                setDdxSub={setDdxSub} wells={wells} setWells={setWells}
                perc={perc} setPerc={setPerc} addrs={addrs} setAddrs={setAddrs}
                hr={hr} sbp={sbp} spesi={spesi} setSpesi={setSpesi} />}
              {tab === "protocol" && <ProtocolTab expanded={protocolExpanded}
                setExpanded={setProtocolExpanded} weightKg={weightKg} crcl={crcl} />}
              {tab === "dispo"    && <DispoTab heartScore={heartTotal}
                tropInterp={tropInterp} edacsScore={edacsScore}
                edacsNegTrop={edacsNegTrop} tropResult={tropResult}
                wellsScore={wellsScore} wellsInterResult={wellsInterResult}
                addrsScore={addrsScore} addrsResult={addrsResult}
                sbp={sbp} hr={hr} weight={weight} weightUnit={weightUnit}
                creatinine={creatinine} chiefComplaint={chiefComplaint} />}
            </div>
          </>
        )}

        {!embedded && (
          <div style={{ textAlign:"center", padding:"24px 0 16px",
            fontFamily:FF.mono, fontSize:10, color:T.txt4, letterSpacing:1.5 }}>
            NOTRYA CHEST PAIN HUB · CLINICAL DECISION SUPPORT ONLY
            · HEART (BACKUS 2010) · ESC 0/1H · EDACS (FLAWS 2016)
            · WELLS PE · ADD-RS (ROGERS 2011) · ACC/AHA 2021 · ACEP 2024
          </div>
        )}
      </div>
    </div>
  );
}