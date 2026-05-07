import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";
const SepsisBundle = base44.entities.SepsisBundle;

(() => {
  if (document.getElementById("sep-css")) return;
  const l = document.createElement("link"); l.id = "sep-f"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "sep-css";
  s.textContent = `
    *{box-sizing:border-box;}
    @keyframes sepIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
    @keyframes sepPulse{0%,100%{opacity:1}50%{opacity:.35}}
    @keyframes sepSpin{to{transform:rotate(360deg)}}
    @keyframes sepTick{0%{transform:scale(1)}50%{transform:scale(1.08)}100%{transform:scale(1)}}
    .sep-in{animation:sepIn .2s ease both;}
    .sep-pulse{animation:sepPulse 1.2s ease-in-out infinite;}
    .sep-tick{animation:sepTick 1s ease-in-out infinite;}
    ::-webkit-scrollbar{width:3px;} ::-webkit-scrollbar-thumb{background:rgba(255,96,96,.25);border-radius:2px;}
    input::placeholder,textarea::placeholder{color:rgba(221,230,240,.2);}
    input:focus,textarea:focus,select:focus{border-color:rgba(255,96,96,.6)!important;outline:none;}
    select option{background:#0d1b2e;}
  `;
  document.head.appendChild(s);
})();

const T = {
  bg:"#07111f", card:"rgba(255,255,255,0.04)", bdr:"rgba(255,255,255,0.08)",
  coral:"#ff6060", cD:"rgba(255,96,96,0.12)", cB:"rgba(255,96,96,0.25)",
  gold:"#f0a500", gD:"rgba(240,165,0,0.12)",
  green:"#4ade80", grnD:"rgba(74,222,128,0.1)",
  teal:"#00b4d8", tD:"rgba(0,180,216,0.12)",
  orange:"#ff9f43", oD:"rgba(255,159,67,0.12)",
  purple:"#9b6dff", pD:"rgba(155,109,255,0.12)",
  txt:"#dde6f0", mut:"rgba(221,230,240,0.55)", dim:"rgba(221,230,240,0.28)",
};
const gl = (x={}) => ({backdropFilter:"blur(14px)",background:T.card,border:`1px solid ${T.bdr}`,borderRadius:12,...x});
const ab = (c=T.coral,x={}) => ({padding:"8px 18px",borderRadius:9,cursor:"pointer",border:`1px solid ${c}55`,background:`${c}18`,color:c,fontFamily:"DM Sans,sans-serif",fontSize:13,fontWeight:700,transition:"all .16s",...x});
const tg = (c,x={}) => ({borderRadius:6,padding:"3px 9px",fontSize:10,fontWeight:700,background:`${c}18`,border:`1px solid ${c}30`,color:c,...x});
const Spin = () => <span style={{display:"inline-block",width:12,height:12,border:"2px solid rgba(255,96,96,.2)",borderTopColor:T.coral,borderRadius:"50%",animation:"sepSpin .7s linear infinite"}}/>;

const toHHMM = (d) => d ? `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}` : "";
const nowHHMM = () => toHHMM(new Date());
const diffMin = (a, b) => { if (!a||!b) return null; return Math.round((b-a)/60000); };
const fmtMin = (n) => { if (n===null||n===undefined) return "—"; if (n<60) return `${n} min`; return `${Math.floor(n/60)}h ${n%60}m`; };

const BUNDLE = [
  { id:"cultures", label:"Blood Cultures",  icon:"🩸", desc:"Draw ≥2 sets of blood cultures before antibiotics", target:60, shock_target:60 },
  { id:"lactate",  label:"Measure Lactate", icon:"🔬", desc:"Serum or plasma lactate level — draw immediately",  target:60, shock_target:60 },
  { id:"abx",      label:"Antibiotics",     icon:"💊", desc:"Broad-spectrum antibiotics administered IV",        target:60, shock_target:60 },
  { id:"fluids",   label:"IV Fluids",       icon:"💧", desc:"30 mL/kg crystalloid for MAP <65 or lactate ≥4 mmol/L", target:180, shock_target:60 },
];

const ABX_OPTIONS = [
  "Pip-Tazo 4.5g IV q6h",
  "Pip-Tazo 4.5g + Vancomycin",
  "Cefepime 2g IV q8h",
  "Cefepime 2g + Vancomycin",
  "Meropenem 1g IV q8h",
  "Meropenem 1g + Vancomycin",
  "Ceftriaxone 2g IV",
  "Ceftriaxone 2g + Azithromycin 500mg",
  "Amp-Sulbactam 3g IV q6h",
  "Other (see notes)",
];

const VASO_OPTIONS = [
  "Norepinephrine 0.01-0.5 mcg/kg/min",
  "Vasopressin 0.03 units/min (add-on)",
  "Epinephrine 0.05-0.5 mcg/kg/min",
  "Dopamine 5-20 mcg/kg/min",
  "Other (see notes)",
];

export default function SepsisBundleTracker() {
  const [recogTime,   setRecogTime]  = useState(nowHHMM());
  const [recogSet,    setRecogSet]   = useState(false);
  const [recogDate,   setRecogDate]  = useState(new Date());
  const [stamps,      setStamps]     = useState({});
  const [lactateVal,  setLactateVal] = useState("");
  const [mapVal,      setMapVal]     = useState("");
  const [fluidVol,    setFluidVol]   = useState("");
  const [abxSel,      setAbxSel]     = useState("");
  const [vasoReq,     setVasoReq]    = useState(false);
  const [vasoSel,     setVasoSel]    = useState("");
  const [vasoTime,    setVasoTime]   = useState(null);
  const [repeatLac,   setRepeatLac]  = useState(null);
  const [disposition, setDispo]      = useState("");
  const [provider,    setProvider]   = useState("");
  const [notes,       setNotes]      = useState("");
  const [now,         setNow]        = useState(new Date());
  const [saving,      setSaving]     = useState(false);
  const [saved,       setSaved]      = useState(false);
  const [toast,       setToast]      = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(timerRef.current);
  }, []);

  const recogDate_ = useMemo(() => {
    if (!recogSet) return null;
    const [h, m] = recogTime.split(":").map(Number);
    const d = new Date(recogDate); d.setHours(h, m, 0, 0); return d;
  }, [recogSet, recogTime, recogDate]);

  const shockCriteria = parseFloat(lactateVal) >= 4 || (mapVal && parseFloat(mapVal) < 65);

  const stampEl   = (id) => { if (!recogSet) return; setStamps(p => ({...p, [id]: new Date()})); };
  const unstampEl = (id) => setStamps(p => ({...p, [id]: null}));

  const complianceReport = useMemo(() => {
    if (!recogDate_) return null;
    const results = BUNDLE.map(el => {
      const t = stamps[el.id];
      if (!t) return {id: el.id, status: "missing", mins: null};
      const mins = diffMin(recogDate_, t);
      const limit = shockCriteria ? el.shock_target : el.target;
      return {id: el.id, status: mins <= limit ? "on_time" : "late", mins};
    });
    const allDone = results.every(r => r.status !== "missing");
    const allOnTime = results.every(r => r.status === "on_time");
    return {results, allDone, compliant: allDone && allOnTime};
  }, [stamps, recogDate_, shockCriteria]);

  const showToast = (msg, c = T.green) => {
    setToast({msg, c});
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    if (!recogDate_) return;
    setSaving(true);
    try {
      const payload = {
        encounter_date: new Date().toISOString().slice(0, 10),
        recognition_time: recogTime,
        cultures_time: stamps.cultures ? toHHMM(stamps.cultures) : null,
        cultures_minutes: diffMin(recogDate_, stamps.cultures),
        lactate_time: stamps.lactate ? toHHMM(stamps.lactate) : null,
        lactate_minutes: diffMin(recogDate_, stamps.lactate),
        lactate_value: lactateVal ? parseFloat(lactateVal) : null,
        antibiotics_time: stamps.abx ? toHHMM(stamps.abx) : null,
        antibiotics_minutes: diffMin(recogDate_, stamps.abx),
        antibiotic_selected: abxSel,
        fluids_time: stamps.fluids ? toHHMM(stamps.fluids) : null,
        fluids_minutes: diffMin(recogDate_, stamps.fluids),
        fluids_volume_ml: fluidVol ? parseFloat(fluidVol) : null,
        map_on_arrival: mapVal ? parseFloat(mapVal) : null,
        vasopressor_required: vasoReq,
        vasopressor_agent: vasoSel,
        vasopressor_time: vasoTime ? toHHMM(vasoTime) : null,
        lactate_repeat_time: repeatLac ? toHHMM(repeatLac) : null,
        septic_shock: shockCriteria,
        lactate_criteria: parseFloat(lactateVal) >= 4,
        hypotension_criteria: mapVal ? parseFloat(mapVal) < 65 : false,
        sep1_compliant: complianceReport?.compliant || false,
        disposition, provider_name: provider, compliance_notes: notes,
      };
      await SepsisBundle.create(payload);
      setSaved(true);
      showToast("✓ Bundle saved to quality log");
    } catch(e) { showToast("Save failed: " + e.message, T.coral); }
    setSaving(false);
  };

  const BundleCard = ({el}) => {
    const done   = !!stamps[el.id];
    const mins   = done ? diffMin(recogDate_, stamps[el.id]) : recogDate_ ? diffMin(recogDate_, now) : null;
    const limit  = shockCriteria ? el.shock_target : el.target;
    const status = !recogSet ? "idle" : done ? (mins <= limit ? "ok" : "late") : mins > limit ? "overdue" : "pending";
    const statusCfg = {
      idle:    {c: T.dim,   l: "Not started"},
      pending: {c: T.teal,  l: "Pending"},
      ok:      {c: T.green, l: "✓ On time"},
      late:    {c: T.gold,  l: "⚠ Late"},
      overdue: {c: T.coral, l: "Overdue"},
    }[status];

    return (
      <div style={{...gl({padding:"14px 16px",borderLeft:`4px solid ${statusCfg.c}`,background:`${statusCfg.c}08`})}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
          <div style={{display:"flex",alignItems:"center",gap:9}}>
            <span style={{fontSize:20}}>{el.icon}</span>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:T.txt}}>{el.label}</div>
              <div style={{fontSize:10,color:T.mut,lineHeight:1.4,marginTop:1}}>{el.desc}</div>
            </div>
          </div>
          <span style={{...tg(statusCfg.c),fontSize:10,flexShrink:0}}>{statusCfg.l}</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
          {!done ? (
            <button onClick={() => stampEl(el.id)} disabled={!recogSet}
              style={{...ab(statusCfg.c, {padding:"6px 14px",fontSize:12,opacity:!recogSet?0.4:1})}}>
              Mark Done — {nowHHMM()}
            </button>
          ) : (
            <>
              <span style={{fontFamily:"JetBrains Mono,monospace",fontSize:13,fontWeight:700,color:statusCfg.c}}>{toHHMM(stamps[el.id])}</span>
              <span style={{fontSize:11,color:T.mut}}>{fmtMin(mins)} after recognition</span>
              <span style={{fontSize:10,color:T.dim}}>Target: {limit === 60 ? "60 min" : "3h"}</span>
              <button onClick={() => unstampEl(el.id)} style={{...ab(T.dim,{padding:"3px 9px",fontSize:10})}}>Undo</button>
            </>
          )}
          {!done && recogDate_ && (
            <span style={{fontFamily:"JetBrains Mono,monospace",fontSize:11,color:status==="overdue"?T.coral:T.mut,
              ...(status==="pending"?{animation:"sepPulse 1.2s ease-in-out infinite"}:{})}}>
              {fmtMin(mins)} elapsed
            </span>
          )}
        </div>

        {el.id==="abx" && done && (
          <div style={{marginTop:10}}>
            <select value={abxSel} onChange={e=>setAbxSel(e.target.value)}
              style={{background:"rgba(13,27,46,.8)",border:`1px solid ${T.bdr}`,borderRadius:8,padding:"7px 11px",color:T.txt,fontFamily:"DM Sans,sans-serif",fontSize:12,width:"100%",cursor:"pointer"}}>
              <option value="">Select antibiotic regimen...</option>
              {ABX_OPTIONS.map(o=><option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        )}

        {el.id==="lactate" && done && (
          <div style={{marginTop:10,display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
            <div style={{position:"relative"}}>
              <input type="number" value={lactateVal} onChange={e=>setLactateVal(e.target.value)}
                placeholder="Lactate value"
                style={{background:"rgba(13,27,46,.8)",border:`1px solid ${T.bdr}`,borderRadius:8,padding:"6px 40px 6px 11px",color:T.txt,fontFamily:"DM Sans,sans-serif",fontSize:13,width:160}}/>
              <span style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",fontSize:9,color:T.dim,pointerEvents:"none"}}>mmol/L</span>
            </div>
            {parseFloat(lactateVal)>=2 && parseFloat(lactateVal)<4 && (
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:11,color:T.gold}}>Lactate ≥2 — repeat within 2h</span>
                {!repeatLac
                  ? <button onClick={()=>setRepeatLac(new Date())} style={{...ab(T.gold,{padding:"4px 10px",fontSize:10})}}>Mark Repeat Drawn</button>
                  : <span style={{fontFamily:"JetBrains Mono,monospace",fontSize:11,color:T.gold}}>{toHHMM(repeatLac)} ✓</span>
                }
              </div>
            )}
            {parseFloat(lactateVal)>=4 && <span style={{...tg(T.coral),fontSize:10}}>⚠ SHOCK CRITERIA — 60 min targets apply</span>}
          </div>
        )}

        {el.id==="fluids" && done && (
          <div style={{marginTop:10,position:"relative",display:"inline-block"}}>
            <input type="number" value={fluidVol} onChange={e=>setFluidVol(e.target.value)}
              placeholder="Volume given"
              style={{background:"rgba(13,27,46,.8)",border:`1px solid ${T.bdr}`,borderRadius:8,padding:"6px 36px 6px 11px",color:T.txt,fontFamily:"DM Sans,sans-serif",fontSize:13,width:170}}/>
            <span style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",fontSize:9,color:T.dim,pointerEvents:"none"}}>mL</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{background:T.bg,minHeight:"100vh",padding:"20px 18px 60px",fontFamily:"DM Sans,sans-serif",color:T.txt}}>
      {toast && (
        <div className="sep-in" style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:"rgba(8,20,40,.96)",border:`1px solid ${toast.c}40`,borderRadius:10,padding:"10px 20px",fontSize:13,fontWeight:700,color:toast.c,zIndex:200,pointerEvents:"none"}}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:12}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:44,height:44,borderRadius:11,background:T.cD,border:`1px solid ${T.cB}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>🚨</div>
          <div>
            <h1 style={{margin:0,fontFamily:"Playfair Display,serif",fontSize:22,color:T.coral,letterSpacing:"-0.5px",lineHeight:1}}>Sepsis Bundle Tracker</h1>
            <p style={{margin:"3px 0 0",fontSize:12,color:T.mut}}>CMS SEP-1 Hour-1 Bundle · Real-time compliance · Quality log</p>
          </div>
        </div>
        {recogSet && complianceReport && (
          <div style={{...gl({padding:"10px 16px",border:`1px solid ${complianceReport.compliant?T.green+"55":T.coral+"55"}`,background:complianceReport.compliant?T.grnD:T.cD})}}>
            <div style={{fontSize:10,color:complianceReport.compliant?T.green:T.coral,fontFamily:"JetBrains Mono,monospace",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase"}}>
              SEP-1 {complianceReport.compliant?"COMPLIANT":"NOT COMPLIANT"}
            </div>
            <div style={{fontSize:11,color:T.mut,marginTop:2}}>
              {complianceReport.results.filter(r=>r.status==="on_time").length}/4 elements on time
            </div>
          </div>
        )}
      </div>

      {/* Recognition time */}
      <div style={{...gl({padding:"14px 18px",marginBottom:16,borderLeft:`4px solid ${recogSet?T.coral:T.dim}`})}}>
        <div style={{fontSize:9,color:recogSet?T.coral:T.dim,fontFamily:"JetBrains Mono,monospace",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:10,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
          T=0 — Time Sepsis Recognized
          {shockCriteria && <span style={{...tg(T.coral)}}>⚠ SEPTIC SHOCK — 60 min targets</span>}
        </div>
        <div style={{display:"flex",gap:12,alignItems:"center",flexWrap:"wrap"}}>
          <input type="time" value={recogTime} onChange={e=>setRecogTime(e.target.value)}
            style={{background:"rgba(13,27,46,.8)",border:`1px solid ${recogSet?T.coral+"55":T.bdr}`,borderRadius:9,padding:"9px 13px",color:T.txt,fontFamily:"JetBrains Mono,monospace",fontSize:16,fontWeight:700}}/>
          {!recogSet ? (
            <button onClick={() => setRecogSet(true)} style={{...ab(T.coral,{fontSize:14,padding:"9px 22px"})}}>
              🚨 Start Bundle Clock
            </button>
          ) : (
            <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
              <span className="sep-tick" style={{fontFamily:"JetBrains Mono,monospace",fontSize:13,color:T.coral}}>
                {fmtMin(diffMin(recogDate_, now))} elapsed
              </span>
              <button onClick={() => setRecogSet(false)} style={{...ab(T.dim,{padding:"5px 12px",fontSize:11})}}>Reset Clock</button>
            </div>
          )}
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <div style={{position:"relative"}}>
              <input type="number" value={mapVal} onChange={e=>setMapVal(e.target.value)} placeholder="MAP"
                style={{background:"rgba(13,27,46,.8)",border:`1px solid ${mapVal&&parseFloat(mapVal)<65?T.coral+"55":T.bdr}`,borderRadius:8,padding:"7px 38px 7px 11px",color:T.txt,fontFamily:"JetBrains Mono,monospace",fontSize:13,fontWeight:600,width:110}}/>
              <span style={{position:"absolute",right:7,top:"50%",transform:"translateY(-50%)",fontSize:9,color:T.dim,pointerEvents:"none"}}>mmHg</span>
            </div>
            {mapVal && parseFloat(mapVal)<65 && <span style={{...tg(T.coral),fontSize:10}}>MAP &lt;65 — Shock</span>}
          </div>
        </div>
      </div>

      {/* Bundle elements */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
        {BUNDLE.map(el => <BundleCard key={el.id} el={el}/>)}
      </div>

      {/* Vasopressor */}
      {(shockCriteria || stamps.fluids) && (
        <div style={{...gl({padding:"14px 16px",marginBottom:16,borderLeft:`3px solid ${vasoReq?T.orange:T.dim}`})}}>
          <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap",marginBottom:vasoReq?12:0}}>
            <span style={{fontSize:13,fontWeight:700,color:T.txt}}>💊 Vasopressor Required?</span>
            <button onClick={()=>setVasoReq(p=>!p)} style={{...ab(vasoReq?T.orange:T.dim,{padding:"5px 14px",fontSize:11})}}>
              {vasoReq?"✓ Yes — Required":"No / Not yet"}
            </button>
            {vasoReq && !vasoTime && (
              <button onClick={()=>setVasoTime(new Date())} style={{...ab(T.orange,{padding:"5px 14px",fontSize:11})}}>
                Mark Initiated — {nowHHMM()}
              </button>
            )}
            {vasoTime && <span style={{fontFamily:"JetBrains Mono,monospace",fontSize:12,color:T.orange}}>{toHHMM(vasoTime)} — {fmtMin(diffMin(recogDate_,vasoTime))} post-recognition</span>}
          </div>
          {vasoReq && (
            <select value={vasoSel} onChange={e=>setVasoSel(e.target.value)}
              style={{background:"rgba(13,27,46,.8)",border:`1px solid ${T.bdr}`,borderRadius:8,padding:"7px 11px",color:T.txt,fontFamily:"DM Sans,sans-serif",fontSize:12,width:"100%",cursor:"pointer"}}>
              <option value="">Select vasopressor...</option>
              {VASO_OPTIONS.map(o=><option key={o} value={o}>{o}</option>)}
            </select>
          )}
        </div>
      )}

      {/* Compliance summary */}
      {recogSet && complianceReport && (
        <div className="sep-in" style={{...gl({padding:"14px 18px",marginBottom:16,border:`1px solid ${complianceReport.compliant?T.green+"40":T.coral+"30"}`})}}>
          <div style={{fontSize:9,color:T.dim,fontFamily:"JetBrains Mono,monospace",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:12}}>Bundle Compliance Summary</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:12}}>
            {complianceReport.results.map(r => {
              const el = BUNDLE.find(b => b.id === r.id);
              const c = r.status==="on_time"?T.green:r.status==="late"?T.gold:T.coral;
              return (
                <div key={r.id} style={{background:`${c}10`,borderRadius:9,padding:"10px 12px",border:`1px solid ${c}30`,textAlign:"center"}}>
                  <div style={{fontSize:16,marginBottom:4}}>{el?.icon}</div>
                  <div style={{fontSize:10,color:T.mut,marginBottom:4}}>{el?.label}</div>
                  <div style={{fontFamily:"JetBrains Mono,monospace",fontSize:13,fontWeight:700,color:c}}>
                    {r.status==="missing"?"—":fmtMin(r.mins)}
                  </div>
                  <div style={{fontSize:9,color:c,marginTop:2}}>
                    {r.status==="missing"?"Not done":r.status==="on_time"?"On time":r.status==="late"?"Late":"Overdue"}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{...gl({padding:"10px 14px",background:complianceReport.compliant?T.grnD:T.cD,border:`1px solid ${complianceReport.compliant?T.green+"40":T.coral+"30"}`})}}>
            <div style={{fontSize:13,fontWeight:700,color:complianceReport.compliant?T.green:T.coral}}>
              {complianceReport.compliant?"✓ SEP-1 Bundle Compliant":"⚠ SEP-1 Bundle Incomplete or Late"}
            </div>
            <div style={{fontSize:11,color:T.mut,marginTop:3}}>
              {shockCriteria?"Septic shock criteria — all elements required within 60 min":"Sepsis without shock — fluids within 3h; other elements within 60 min"}
            </div>
          </div>
        </div>
      )}

      {/* Save to quality log */}
      <div style={{...gl({padding:"14px 18px",marginBottom:16})}}>
        <div style={{fontSize:9,color:T.teal,fontFamily:"JetBrains Mono,monospace",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:12}}>Save to Quality Log</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
          <div>
            <div style={{fontSize:8,color:T.dim,fontFamily:"JetBrains Mono,monospace",letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>Provider</div>
            <input value={provider} onChange={e=>setProvider(e.target.value)} placeholder="Treating provider"
              style={{background:"rgba(13,27,46,.8)",border:`1px solid ${T.bdr}`,borderRadius:8,padding:"8px 12px",color:T.txt,fontFamily:"DM Sans,sans-serif",fontSize:13,width:"100%"}}/>
          </div>
          <div>
            <div style={{fontSize:8,color:T.dim,fontFamily:"JetBrains Mono,monospace",letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>Disposition</div>
            <select value={disposition} onChange={e=>setDispo(e.target.value)}
              style={{background:"rgba(13,27,46,.8)",border:`1px solid ${T.bdr}`,borderRadius:8,padding:"8px 12px",color:T.txt,fontFamily:"DM Sans,sans-serif",fontSize:13,width:"100%",cursor:"pointer"}}>
              <option value="">Select disposition...</option>
              {["MICU","SICU","Step-down","Telemetry floor","General floor","Transfer","Expired in ED"].map(d=><option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div style={{gridColumn:"1/-1"}}>
            <div style={{fontSize:8,color:T.dim,fontFamily:"JetBrains Mono,monospace",letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>Compliance Notes</div>
            <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={2}
              placeholder="Reason for any late or missing elements..."
              style={{background:"rgba(13,27,46,.8)",border:`1px solid ${T.bdr}`,borderRadius:8,padding:"8px 12px",color:T.txt,fontFamily:"DM Sans,sans-serif",fontSize:13,width:"100%",resize:"vertical",lineHeight:1.6}}/>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving||!recogSet||saved}
          style={{...ab(T.teal,{display:"flex",alignItems:"center",gap:8,fontSize:13,padding:"10px 24px",opacity:(!recogSet||saving||saved)?0.4:1})}}>
          {saving?<><Spin/>Saving...</>:saved?"✓ Saved to Log":"💾 Save Bundle to Quality Log"}
        </button>
        {saved && <div style={{fontSize:11,color:T.green,marginTop:8}}>Bundle encounter saved. Start new encounter to reset.</div>}
      </div>

      <div style={{textAlign:"center",marginTop:20}}>
        <span style={{fontFamily:"JetBrains Mono,monospace",fontSize:9,color:T.dim,letterSpacing:1.5}}>
          NOTRYA · SEPSIS BUNDLE TRACKER · CMS SEP-1 COMPLIANCE · VERIFY ALL CLINICAL DECISIONS WITH CURRENT PROTOCOLS
        </span>
      </div>
    </div>
  );
}