import { useState, useEffect, useCallback, useRef } from "react";

// ── Font injection ─────────────────────────────────────────────────────────────
(() => {
  if (typeof document === "undefined") return;
  if (document.getElementById("resus-fonts")) return;
  const l = document.createElement("link");
  l.id = "resus-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "resus-css";
  s.textContent = `
    @keyframes resus-fade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
    .resus-fade{animation:resus-fade .15s ease forwards;}
    @keyframes pulse-ring{0%{box-shadow:0 0 0 0 rgba(255,68,68,0.5)}70%{box-shadow:0 0 0 12px rgba(255,68,68,0)}100%{box-shadow:0 0 0 0 rgba(255,68,68,0)}}
    .pulse-ring{animation:pulse-ring 1.5s ease-out infinite;}
    @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
    .shimmer-text{background:linear-gradient(90deg,#e8f0fe 0%,#fff 30%,#ff4444 52%,#ff9f43 72%,#e8f0fe 100%);
    background-size:250% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;
    background-clip:text;animation:shimmer 4s linear infinite;}
  `;
  document.head.appendChild(s);
})();

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:"#050f1e", panel:"#081628",
  txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", blue:"#3b9eff",
  orange:"#ff9f43", purple:"#9b6dff", green:"#3dffa0", red:"#ff4444",
};

// ── Rhythms ───────────────────────────────────────────────────────────────────
const RHYTHMS = [
  { id:"vfpvt",   label:"VF / pVT",    icon:"⚡", color:T.red,    shockable:true  },
  { id:"pea",     label:"PEA",         icon:"〰️", color:T.orange, shockable:false },
  { id:"asystole",label:"Asystole",    icon:"—",  color:T.txt4,   shockable:false },
  { id:"brady",   label:"Bradycardia", icon:"🐢", color:T.blue,   shockable:false },
  { id:"svt",     label:"SVT / Tachy", icon:"⚡", color:T.purple, shockable:false },
  { id:"rosc",    label:"Post-ROSC",   icon:"✅", color:T.green,  shockable:false },
];

// ── Rhythm-specific checklists ────────────────────────────────────────────────
const CHECKLISTS = {
  vfpvt:[
    { id:"cpr_start",   text:"CPR started — 100–120 compressions/min, 2–2.4 inch depth",    urgent:true  },
    { id:"monitor",     text:"Cardiac monitor attached — confirm VF/pVT on ≥2 leads",        urgent:true  },
    { id:"defibrillate",text:"SHOCK delivered (unsynchronized) — minimize pause pre-shock",  urgent:true  },
    { id:"cpr_resume",  text:"CPR immediately resumed for 2 minutes post-shock",             urgent:true  },
    { id:"iv_io",       text:"IV or IO access established",                                  urgent:false },
    { id:"epi1",        text:"Epinephrine 1 mg IV/IO given (after 2nd shock if shockable)",  urgent:true  },
    { id:"airway",      text:"Advanced airway considered — do not interrupt CPR for intubation", urgent:false },
    { id:"amio1",       text:"Amiodarone 300 mg IV/IO (after 3rd shock — VF/pVT refractory)", urgent:false },
    { id:"rhythm_check",text:"Rhythm check every 2 minutes — minimize interruption",         urgent:false },
    { id:"epi_cont",    text:"Epinephrine 1 mg q3–5 min throughout",                        urgent:false },
    { id:"amio2",       text:"Amiodarone 150 mg IV/IO second dose if still refractory",     urgent:false },
    { id:"causes",      text:"Reversible causes (H's and T's) addressed — see panel",       urgent:false },
  ],
  pea:[
    { id:"cpr_start",  text:"CPR started immediately — high-quality, minimally interrupted", urgent:true  },
    { id:"iv_io",      text:"IV or IO access — epinephrine 1 mg q3–5 min",                  urgent:true  },
    { id:"epi1",       text:"Epinephrine 1 mg IV/IO given",                                  urgent:true  },
    { id:"causes",     text:"Reversible causes identified and being addressed (H's and T's)",urgent:true  },
    { id:"airway",     text:"Advanced airway — ventilations asynchronous once placed",       urgent:false },
    { id:"ultrasound", text:"Bedside ultrasound during rhythm check — cardiac standstill vs activity", urgent:false },
    { id:"rate_check", text:"Rate: narrow complex PEA is more reversible — identify cause", urgent:false  },
    { id:"epi_cont",   text:"Epinephrine q3–5 min — document each dose time",               urgent:false },
  ],
  asystole:[
    { id:"confirm",    text:"Confirm asystole in ≥2 leads — check leads, gain, connections", urgent:true  },
    { id:"cpr_start",  text:"CPR immediately — high quality, minimize pauses",               urgent:true  },
    { id:"iv_io",      text:"IV or IO access — epinephrine 1 mg q3–5 min",                  urgent:true  },
    { id:"epi1",       text:"Epinephrine 1 mg IV/IO given",                                  urgent:true  },
    { id:"airway",     text:"Advanced airway — asynchronous ventilations 10/min once placed",urgent:false },
    { id:"causes",     text:"Reversible causes — especially hypoxia, tamponade, tension PTX",urgent:true  },
    { id:"no_shock",   text:"Do NOT shock asystole — confirm rhythm before defibrillating", urgent:true   },
    { id:"prognosis",  text:"Prolonged asystole without reversible cause — discuss prognosis",urgent:false },
  ],
  brady:[
    { id:"abcs",          text:"Assess: airway, breathing, O2 — is patient symptomatic?",       urgent:true  },
    { id:"12lead",        text:"12-lead EKG — identify: block type, ACS, drug effect",          urgent:true  },
    { id:"atropine",      text:"Atropine 1 mg IV (if symptomatic) — repeat q3–5 min, max 3 mg", urgent:true  },
    { id:"transcutaneous",text:"Transcutaneous pacing — for high-degree block, atropine failure",urgent:true  },
    { id:"dopamine",      text:"Dopamine 2–20 mcg/kg/min if pacing unavailable",                urgent:false },
    { id:"epi_brady",     text:"Epinephrine 2–10 mcg/min infusion — bridge to transvenous pacing",urgent:false},
    { id:"transvenous",   text:"Transvenous pacing (TVP) — for persistent high-degree block",   urgent:false },
    { id:"cause",         text:"Identify and treat underlying cause: ACS, Lyme, drugs, hyperkalemia",urgent:false},
  ],
  svt:[
    { id:"stable_check",text:"Is patient STABLE? (stable BP, no AMS, no chest pain at rest)",  urgent:true  },
    { id:"vagal",       text:"Vagal maneuvers first: Valsalva, modified Valsalva (500 mL bolus position)", urgent:true },
    { id:"adenosine1",  text:"Adenosine 6 mg rapid IV push + 20 mL NS flush — arm vein preferred",urgent:true },
    { id:"adenosine2",  text:"Adenosine 12 mg if first dose fails — repeat once at 12 mg",     urgent:false },
    { id:"monitor_post",text:"Monitor 30 seconds post-adenosine — capture transient arrhythmia",urgent:false },
    { id:"rate_control",text:"If AF/flutter: rate control (diltiazem, metoprolol) not adenosine",urgent:false},
    { id:"unstable",    text:"If UNSTABLE: synchronized cardioversion 50–100 J immediately",   urgent:true  },
    { id:"accessory",   text:"WPW suspected: avoid adenosine, diltiazem, verapamil — call cardiology",urgent:true },
  ],
  rosc:[
    { id:"airway_rosc",  text:"Secure airway — intubate if not already, confirm placement",     urgent:true  },
    { id:"vent_settings",text:"Ventilator: TV 6 mL/kg IBW, RR 10–12, FiO2 100% (titrate to SpO2 94–98%)",urgent:true},
    { id:"no_hypervent", text:"Avoid hyperventilation — target ETCO2 35–40 mmHg, PaCO2 40–45", urgent:true  },
    { id:"bp_target",    text:"Target SBP ≥90 mmHg (ideally MAP ≥65) — start vasopressor if needed",urgent:true},
    { id:"12lead_rosc",  text:"12-lead EKG immediately — STEMI or STEMI-equivalent → cath lab", urgent:true  },
    { id:"ttm",          text:"TTM / targeted temperature management: if not following commands — 32–36°C × 24h",urgent:true},
    { id:"glucose",      text:"Blood glucose: target 140–180 mg/dL — treat hypoglycemia immediately",urgent:false},
    { id:"cath_lab",     text:"If STEMI or high suspicion — activate cath lab regardless of consciousness",urgent:true},
    { id:"neuro",        text:"Neuro: avoid hyperthermia (>37.7°C worsens neurologic outcome)", urgent:false },
    { id:"disposition",  text:"ICU admission — continuous monitoring, repeat 12-lead, echo",    urgent:false },
  ],
};

// ── H's and T's ───────────────────────────────────────────────────────────────
const HS = [
  { id:"hypovolemia", label:"Hypovolemia",        action:"IVF 1–2L NS or blood products — check for bleeding source" },
  { id:"hypoxia",     label:"Hypoxia",            action:"100% FiO2, confirm airway, check BVM seal and tube placement" },
  { id:"hydrogen",    label:"H+ (Acidosis)",      action:"Sodium bicarbonate 1 mEq/kg IV if pH <7.1; treat underlying cause" },
  { id:"hypokalemia", label:"Hypo/Hyperkalemia",  action:"Calcium gluconate 1g IV for hyperK; potassium replacement for hypoK" },
  { id:"hypothermia", label:"Hypothermia",        action:"Active warming; ACLS protocols modified — no shock until >30°C" },
];

const TS = [
  { id:"tension",      label:"Tension Pneumothorax", action:"Immediate needle decompression (2nd ICS MCL or 4th ICS AAL) — then chest tube" },
  { id:"tamponade",    label:"Cardiac Tamponade",    action:"Bedside echo → pericardiocentesis — bilateral effusion in PEA" },
  { id:"toxins",       label:"Toxins / Drugs",       action:"Sodium bicarbonate (TCA), naloxone (opioid), calcium + HDI (CCB) — see ToxHub" },
  { id:"thrombosis_pe",label:"Thrombosis (PE)",      action:"Systemic TPA 100 mg IV over 2h (50 mg push in arrest) — continue CPR 60–90 min" },
  { id:"thrombosis_mi",label:"Thrombosis (MI)",      action:"STEMI in arrest — activate cath lab; TPA if cath unavailable" },
];

// ── Adult shock energy ────────────────────────────────────────────────────────
const ADULT_ENERGY = {
  defibrillation:     { first:200, subsequent:200, max:360, label:"Defibrillation (biphasic)" },
  cardioversion_afib: { first:120, subsequent:200, max:360, label:"Cardioversion — AF/Flutter" },
  cardioversion_svt:  { first:50,  subsequent:100, max:200, label:"Cardioversion — SVT/VT"   },
};

function fmt(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

// ── Checklist item ────────────────────────────────────────────────────────────
function CheckItem({ item, checked, onToggle }) {
  return (
    <button onClick={onToggle}
      style={{ display:"flex", alignItems:"flex-start", gap:9, width:"100%",
        padding:"8px 10px", borderRadius:8, cursor:"pointer",
        textAlign:"left", transition:"all .12s", marginBottom:4,
        border:`1px solid ${checked
          ? "rgba(61,255,160,0.35)"
          : item.urgent ? "rgba(255,107,107,0.25)" : "rgba(26,53,85,0.35)"}`,
        background:checked
          ? "rgba(61,255,160,0.07)"
          : item.urgent ? "rgba(255,107,107,0.05)" : "rgba(8,22,40,0.5)" }}>
      <div style={{ width:18, height:18, borderRadius:4, flexShrink:0, marginTop:1,
        border:`2px solid ${checked ? T.green : item.urgent ? T.coral : "rgba(42,79,122,0.5)"}`,
        background:checked ? T.green : "transparent",
        display:"flex", alignItems:"center", justifyContent:"center" }}>
        {checked && <span style={{ color:T.bg, fontSize:10, fontWeight:900, lineHeight:1 }}>✓</span>}
      </div>
      <div style={{ flex:1 }}>
        <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
          color:checked ? T.txt3 : T.txt,
          textDecoration:checked ? "line-through" : "none",
          fontWeight:item.urgent && !checked ? 600 : 400 }}>
          {item.text}
        </span>
        {item.urgent && !checked && (
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
            color:T.coral, letterSpacing:1, textTransform:"uppercase", marginLeft:8 }}>
            urgent
          </span>
        )}
      </div>
    </button>
  );
}

// ── CPR Timer ─────────────────────────────────────────────────────────────────
function CPRTimer() {
  const [running,   setRunning]   = useState(false);
  const [elapsed,   setElapsed]   = useState(0);
  const [cycleTime, setCycleTime] = useState(0);
  const [cycles,    setCycles]    = useState(0);
  const intervalRef = useRef(null);
  const CYCLE = 120;

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setElapsed(p => p + 1);
        setCycleTime(p => {
          if (p + 1 >= CYCLE) { setCycles(c => c + 1); return 0; }
          return p + 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const reset = () => { setRunning(false); setElapsed(0); setCycleTime(0); setCycles(0); };
  const cyclePct    = Math.round((cycleTime / CYCLE) * 100);
  const urgentCycle = cycleTime >= 100;

  return (
    <div style={{ padding:"12px 14px", borderRadius:10, marginBottom:10,
      background: running ? "rgba(255,68,68,0.08)" : "rgba(8,22,40,0.7)",
      border:`1px solid ${running ? "rgba(255,68,68,0.4)" : "rgba(26,53,85,0.4)"}` }}>
      <div style={{ display:"flex", alignItems:"center",
        justifyContent:"space-between", marginBottom:10, flexWrap:"wrap", gap:8 }}>
        <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
          fontSize:13, color:running ? T.red : T.txt }}>CPR Timer</div>
        <div style={{ display:"flex", gap:6 }}>
          <button onClick={() => setRunning(p => !p)}
            className={running ? "pulse-ring" : ""}
            style={{ padding:"6px 18px", borderRadius:8, cursor:"pointer",
              fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:12,
              transition:"all .15s",
              border:`1px solid ${running ? T.red+"77" : T.green+"66"}`,
              background:running ? "rgba(255,68,68,0.15)" : "rgba(61,255,160,0.12)",
              color:running ? T.red : T.green }}>
            {running ? "⏸ Pause" : elapsed > 0 ? "▶ Resume" : "▶ Start CPR"}
          </button>
          <button onClick={reset}
            style={{ padding:"6px 12px", borderRadius:8, cursor:"pointer",
              fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              letterSpacing:1, textTransform:"uppercase",
              border:"1px solid rgba(42,79,122,0.4)",
              background:"transparent", color:T.txt4 }}>Reset</button>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr",
        gap:8, marginBottom:10 }}>
        {[
          { label:"Total Time",  val:fmt(elapsed),    color:T.txt  },
          { label:"Cycle Timer", val:fmt(cycleTime),  color:urgentCycle ? T.red : T.gold },
          { label:"Cycles Done", val:String(cycles),  color:T.teal },
        ].map(b => (
          <div key={b.label} style={{ textAlign:"center", padding:"7px 8px",
            borderRadius:8, background:"rgba(14,37,68,0.5)",
            border:"1px solid rgba(26,53,85,0.3)" }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace",
              fontSize:22, fontWeight:700, color:b.color, lineHeight:1 }}>{b.val}</div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace",
              fontSize:7, color:T.txt4, letterSpacing:1,
              textTransform:"uppercase", marginTop:2 }}>{b.label}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom:4 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, letterSpacing:1 }}>2-MIN CYCLE</span>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:urgentCycle ? T.red : T.txt4, fontWeight:700 }}>
            {urgentCycle ? "RHYTHM CHECK SOON" : `${CYCLE - cycleTime}s remaining`}
          </span>
        </div>
        <div style={{ height:8, background:"rgba(26,53,85,0.4)",
          borderRadius:4, overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${cyclePct}%`,
            background:urgentCycle
              ? `linear-gradient(90deg,${T.gold},${T.red})`
              : `linear-gradient(90deg,${T.teal},${T.gold})`,
            borderRadius:4, transition:"width 1s linear" }} />
        </div>
      </div>
      <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:T.txt4 }}>
        Rhythm check every 2 minutes — minimize pause to &lt;10 seconds
      </div>
    </div>
  );
}

// ── Epinephrine timer ─────────────────────────────────────────────────────────
function EpiTimer() {
  const [doses,   setDoses]   = useState([]);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const intRef = useRef(null);

  useEffect(() => {
    if (running) {
      intRef.current = setInterval(() => setElapsed(p => p + 1), 1000);
    } else {
      clearInterval(intRef.current);
    }
    return () => clearInterval(intRef.current);
  }, [running]);

  const lastDose      = doses[doses.length - 1] ?? null;
  const sinceLastDose = lastDose !== null ? elapsed - lastDose : null;
  const dueIn         = sinceLastDose !== null ? Math.max(0, 180 - sinceLastDose) : null;
  const overdue       = sinceLastDose !== null && sinceLastDose > 300;
  const dueSoon       = dueIn !== null && dueIn <= 30 && dueIn > 0;
  const due           = dueIn === 0 || (sinceLastDose !== null && sinceLastDose >= 180);

  const giveEpi = () => {
    if (!running) setRunning(true);
    setDoses(p => [...p, elapsed]);
  };

  return (
    <div style={{ padding:"11px 13px", borderRadius:10, marginBottom:10,
      background:due ? "rgba(255,68,68,0.1)" : dueSoon ? "rgba(245,200,66,0.08)" : "rgba(8,22,40,0.65)",
      border:`1px solid ${due ? "rgba(255,68,68,0.45)" : dueSoon ? "rgba(245,200,66,0.35)" : "rgba(26,53,85,0.4)"}` }}>
      <div style={{ display:"flex", alignItems:"center",
        justifyContent:"space-between", marginBottom:8, flexWrap:"wrap", gap:6 }}>
        <div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
            fontSize:13, color:due ? T.red : dueSoon ? T.gold : T.txt }}>
            Epinephrine Timer
          </div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, letterSpacing:1 }}>
            1 mg IV/IO q3–5 min · {doses.length} dose{doses.length !== 1 ? "s" : ""} given
          </div>
        </div>
        <button onClick={giveEpi}
          style={{ padding:"7px 18px", borderRadius:8, cursor:"pointer",
            fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:12,
            transition:"all .15s",
            border:`1px solid ${T.red+"66"}`,
            background:"rgba(255,68,68,0.15)", color:T.red }}>
          💉 Epi Given Now
        </button>
      </div>

      {lastDose !== null && (
        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
          <div style={{ padding:"5px 10px", borderRadius:7,
            background:`${due ? T.red : dueSoon ? T.gold : T.teal}12`,
            border:`1px solid ${due ? T.red : dueSoon ? T.gold : T.teal}33` }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
              color:T.txt4, letterSpacing:1, textTransform:"uppercase", marginBottom:2 }}>
              Since Last Dose</div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:16,
              fontWeight:700, color:due ? T.red : dueSoon ? T.gold : T.teal }}>
              {fmt(sinceLastDose)}
            </div>
          </div>
          <div style={{ padding:"5px 10px", borderRadius:7,
            background:"rgba(42,79,122,0.15)",
            border:"1px solid rgba(42,79,122,0.3)" }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
              color:T.txt4, letterSpacing:1, textTransform:"uppercase", marginBottom:2 }}>
              {due ? "NEXT DOSE DUE" : "Next Dose In"}</div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:16,
              fontWeight:700, color:due ? T.red : T.txt3 }}>
              {due ? "NOW" : fmt(dueIn)}
            </div>
          </div>
          {overdue && (
            <div style={{ display:"flex", alignItems:"center", padding:"5px 10px",
              borderRadius:7, background:"rgba(255,68,68,0.1)",
              border:"1px solid rgba(255,68,68,0.3)" }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace",
                fontSize:9, color:T.red, fontWeight:700, letterSpacing:1 }}>
                ⚠ OVERDUE {fmt(sinceLastDose - 300)} AGO
              </span>
            </div>
          )}
        </div>
      )}

      {doses.length > 0 && (
        <div style={{ marginTop:7, fontFamily:"'JetBrains Mono',monospace",
          fontSize:8, color:T.txt4, letterSpacing:0.5 }}>
          Dose log: {doses.map((d, i) => `#${i+1} T+${fmt(d)}`).join("  ·  ")}
        </div>
      )}
    </div>
  );
}

// ── Shock energy panel ────────────────────────────────────────────────────────
function ShockPanel({ isPeds, weightKg }) {
  const [shockCount,   setShockCount]   = useState(0);
  const [shockLog,     setShockLog]     = useState([]);
  const [selectedType, setSelectedType] = useState("defibrillation");

  const pedsFirst = Math.round((parseFloat(weightKg)||0) * 2);
  const pedsSub   = Math.min(Math.round((parseFloat(weightKg)||0) * 4), 360);

  const energy = isPeds && parseFloat(weightKg) > 0
    ? (shockCount === 0 ? pedsFirst : pedsSub)
    : ADULT_ENERGY[selectedType]
      ? (shockCount === 0 ? ADULT_ENERGY[selectedType].first : ADULT_ENERGY[selectedType].subsequent)
      : 200;

  const deliver = () => {
    const e = energy;
    setShockCount(p => p + 1);
    setShockLog(p => [...p, { num:p.length+1, energy:e }]);
  };

  return (
    <div style={{ padding:"11px 13px", borderRadius:10, marginBottom:10,
      background:"rgba(255,68,68,0.07)",
      border:"1px solid rgba(255,68,68,0.3)" }}>
      <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
        fontSize:13, color:T.red, marginBottom:10 }}>
        ⚡ Defibrillation / Cardioversion
        {isPeds && (
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
            color:T.gold, marginLeft:10, letterSpacing:1 }}>PALS MODE</span>
        )}
      </div>

      {!isPeds && (
        <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:10 }}>
          {Object.entries(ADULT_ENERGY).map(([key, val]) => (
            <button key={key} onClick={() => setSelectedType(key)}
              style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                padding:"3px 10px", borderRadius:20, cursor:"pointer",
                letterSpacing:0.5,
                border:`1px solid ${selectedType===key ? T.red+"66" : "rgba(42,79,122,0.35)"}`,
                background:selectedType===key ? "rgba(255,68,68,0.15)" : "transparent",
                color:selectedType===key ? T.red : T.txt4 }}>
              {val.label}
            </button>
          ))}
        </div>
      )}

      <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
            color:T.txt4, letterSpacing:1, marginBottom:2 }}>
            {shockCount === 0 ? "1ST SHOCK" : `SHOCK #${shockCount+1}`}
          </div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace",
            fontSize:32, fontWeight:700, color:T.red, lineHeight:1 }}>{energy}</div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace",
            fontSize:10, color:T.txt4 }}>Joules</div>
        </div>
        <div style={{ flex:1 }}>
          <button onClick={deliver}
            style={{ width:"100%", padding:"10px 0", borderRadius:9,
              cursor:"pointer", fontFamily:"'DM Sans',sans-serif",
              fontWeight:700, fontSize:13, transition:"all .15s",
              border:"1px solid rgba(255,68,68,0.6)",
              background:"linear-gradient(135deg,rgba(255,68,68,0.22),rgba(255,68,68,0.08))",
              color:T.red }}>
            ⚡ SHOCK DELIVERED
          </button>
          {isPeds && parseFloat(weightKg) > 0 && (
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:T.txt4, marginTop:4, textAlign:"center" }}>
              {parseFloat(weightKg)} kg · 1st: 2 J/kg ({pedsFirst} J) · Subsequent: 4 J/kg ({pedsSub} J)
            </div>
          )}
        </div>
        {shockCount > 0 && (
          <div style={{ textAlign:"right" }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
              color:T.txt4, letterSpacing:1, marginBottom:3 }}>SHOCKS</div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace",
              fontSize:20, fontWeight:700, color:T.coral }}>{shockCount}</div>
          </div>
        )}
      </div>

      {shockLog.length > 0 && (
        <div style={{ marginTop:8, fontFamily:"'JetBrains Mono',monospace",
          fontSize:8, color:T.txt4, letterSpacing:0.5 }}>
          Log: {shockLog.map(s => `#${s.num} ${s.energy}J`).join("  ·  ")}
        </div>
      )}
    </div>
  );
}

// ── H's and T's panel ─────────────────────────────────────────────────────────
function HsTs({ checked, onToggle }) {
  return (
    <div style={{ padding:"11px 13px", borderRadius:10, marginBottom:10,
      background:"rgba(8,22,40,0.7)",
      border:"1px solid rgba(42,79,122,0.4)" }}>
      <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
        fontSize:13, color:T.txt, marginBottom:10 }}>
        Reversible Causes — H's and T's
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
        <div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.blue, letterSpacing:1.5, textTransform:"uppercase", marginBottom:6 }}>H's</div>
          {HS.map(h => (
            <button key={h.id} onClick={() => onToggle(h.id)}
              style={{ display:"flex", alignItems:"flex-start", gap:7,
                width:"100%", padding:"7px 8px", borderRadius:7,
                cursor:"pointer", textAlign:"left", marginBottom:4, transition:"all .12s",
                border:`1px solid ${checked[h.id] ? "rgba(61,255,160,0.35)" : "rgba(42,79,122,0.3)"}`,
                background:checked[h.id] ? "rgba(61,255,160,0.07)" : "rgba(14,37,68,0.4)" }}>
              <div style={{ width:14, height:14, borderRadius:3, flexShrink:0, marginTop:2,
                border:`2px solid ${checked[h.id] ? T.green : "rgba(42,79,122,0.5)"}`,
                background:checked[h.id] ? T.green : "transparent",
                display:"flex", alignItems:"center", justifyContent:"center" }}>
                {checked[h.id] && <span style={{ color:T.bg, fontSize:8, fontWeight:900 }}>✓</span>}
              </div>
              <div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600,
                  color:checked[h.id] ? T.txt3 : T.txt,
                  textDecoration:checked[h.id] ? "line-through" : "none" }}>{h.label}</div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9,
                  color:T.txt4, lineHeight:1.4, marginTop:1 }}>{h.action}</div>
              </div>
            </button>
          ))}
        </div>
        <div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.coral, letterSpacing:1.5, textTransform:"uppercase", marginBottom:6 }}>T's</div>
          {TS.map(t => (
            <button key={t.id} onClick={() => onToggle(t.id)}
              style={{ display:"flex", alignItems:"flex-start", gap:7,
                width:"100%", padding:"7px 8px", borderRadius:7,
                cursor:"pointer", textAlign:"left", marginBottom:4, transition:"all .12s",
                border:`1px solid ${checked[t.id] ? "rgba(61,255,160,0.35)" : "rgba(42,79,122,0.3)"}`,
                background:checked[t.id] ? "rgba(61,255,160,0.07)" : "rgba(14,37,68,0.4)" }}>
              <div style={{ width:14, height:14, borderRadius:3, flexShrink:0, marginTop:2,
                border:`2px solid ${checked[t.id] ? T.green : "rgba(42,79,122,0.5)"}`,
                background:checked[t.id] ? T.green : "transparent",
                display:"flex", alignItems:"center", justifyContent:"center" }}>
                {checked[t.id] && <span style={{ color:T.bg, fontSize:8, fontWeight:900 }}>✓</span>}
              </div>
              <div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600,
                  color:checked[t.id] ? T.txt3 : T.txt,
                  textDecoration:checked[t.id] ? "line-through" : "none" }}>{t.label}</div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9,
                  color:T.txt4, lineHeight:1.4, marginTop:1 }}>{t.action}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────
export default function ResusHub({ embedded = false, onBack, demo, vitals }) {

  const [rhythm,     setRhythm]     = useState("vfpvt");
  const [checkState, setCheckState] = useState({});
  const [htChecked,  setHtChecked]  = useState({});
  const [weightKg,   setWeightKg]   = useState(
    vitals?.weight || demo?.weight || ""
  );

  const isPeds    = parseFloat(weightKg) > 0 && parseFloat(weightKg) < 40;
  const rConfig   = RHYTHMS.find(r => r.id === rhythm);
  const checklist = CHECKLISTS[rhythm] || [];
  const doneCount = checklist.filter(i => checkState[i.id]).length;

  const toggleCheck = useCallback((id) => setCheckState(p => ({ ...p, [id]:!p[id] })), []);
  const toggleHT    = useCallback((id) => setHtChecked(p => ({ ...p, [id]:!p[id] })), []);
  const resetAll    = useCallback(() => { setCheckState({}); setHtChecked({}); }, []);
  const handleRhythm = useCallback((id) => { setRhythm(id); setCheckState({}); }, []);

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif",
      background: embedded ? "transparent" : T.bg,
      minHeight:  embedded ? "auto" : "100vh",
      color:T.txt }}>

      <div style={{ maxWidth:1200, margin:"0 auto",
        padding: embedded ? "0" : "0 16px" }}>

        {!embedded && (
          <div style={{ padding:"18px 0 14px" }}>
            <button onClick={() => onBack ? onBack() : window.history.back()}
              style={{ marginBottom:10,
                display:"inline-flex", alignItems:"center", gap:7,
                fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600,
                background:"rgba(14,37,68,0.7)",
                border:"1px solid rgba(42,79,122,0.5)",
                borderRadius:8, padding:"5px 14px",
                color:T.txt3, cursor:"pointer" }}>
              ← Back to Hub
            </button>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
              <div style={{ background:"rgba(5,15,30,0.9)",
                border:"1px solid rgba(42,79,122,0.6)",
                borderRadius:10, padding:"5px 12px",
                display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:10, color:T.purple, letterSpacing:3 }}>NOTRYA</span>
                <span style={{ color:T.txt4, fontFamily:"'JetBrains Mono',monospace", fontSize:10 }}>/</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:10, color:T.txt3, letterSpacing:2 }}>RESUS</span>
              </div>
              <div style={{ height:1, flex:1,
                background:"linear-gradient(90deg,rgba(255,68,68,0.5),transparent)" }} />
            </div>
            <h1 className="shimmer-text"
              style={{ fontFamily:"'Playfair Display',serif",
                fontSize:"clamp(22px,4vw,38px)", fontWeight:900,
                letterSpacing:-0.5, lineHeight:1.1 }}>
              Resuscitation Checklist
            </h1>
            <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
              color:T.txt4, marginTop:4 }}>
              ACLS / PALS · CPR Timer · Epi Tracker · Shock Energy · H's &amp; T's · Post-ROSC
            </p>
          </div>
        )}

        {embedded && (
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
            <span style={{ fontFamily:"'Playfair Display',serif",
              fontWeight:700, fontSize:15, color:T.red }}>Resuscitation</span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:T.txt4, letterSpacing:1.5, textTransform:"uppercase",
              background:"rgba(255,68,68,0.1)",
              border:"1px solid rgba(255,68,68,0.25)",
              borderRadius:4, padding:"2px 7px" }}>ACLS · PALS</span>
          </div>
        )}

        {/* Weight + PALS bar */}
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 13px",
          borderRadius:9, marginBottom:10,
          background:`${isPeds ? T.gold : "rgba(8,22,40,0.65)"}0d`,
          border:`1px solid ${isPeds ? T.gold+"44" : "rgba(26,53,85,0.4)"}` }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
            color:T.txt4, letterSpacing:1, flexShrink:0 }}>WEIGHT</span>
          <input type="number" value={weightKg}
            onChange={e => setWeightKg(e.target.value)}
            placeholder="kg"
            style={{ width:65, padding:"4px 8px",
              background:"rgba(14,37,68,0.75)",
              border:`1px solid ${weightKg ? T.teal+"55" : "rgba(42,79,122,0.4)"}`,
              borderRadius:6, outline:"none",
              fontFamily:"'JetBrains Mono',monospace", fontSize:15,
              fontWeight:700, color:T.teal, textAlign:"right" }} />
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.txt4 }}>kg</span>
          {isPeds && (
            <div style={{ display:"flex", alignItems:"center", gap:6, padding:"3px 10px",
              borderRadius:20, background:"rgba(245,200,66,0.12)",
              border:"1px solid rgba(245,200,66,0.35)" }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                fontWeight:700, color:T.gold, letterSpacing:1 }}>
                🧒 PALS MODE — weight-based dosing active
              </span>
            </div>
          )}
          <div style={{ marginLeft:"auto", display:"flex", gap:5 }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:T.txt4, letterSpacing:1 }}>
              {doneCount}/{checklist.length} checked
            </span>
            <button onClick={resetAll}
              style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                padding:"3px 10px", borderRadius:6, cursor:"pointer",
                letterSpacing:1, textTransform:"uppercase",
                border:"1px solid rgba(42,79,122,0.4)",
                background:"transparent", color:T.txt4 }}>Reset All</button>
          </div>
        </div>

        {/* Rhythm selector */}
        <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:12 }}>
          {RHYTHMS.map(r => {
            const active = rhythm === r.id;
            return (
              <button key={r.id} onClick={() => handleRhythm(r.id)}
                style={{ display:"flex", alignItems:"center", gap:6,
                  fontFamily:"'DM Sans',sans-serif", fontWeight:700,
                  fontSize:12, padding:"8px 16px", borderRadius:9,
                  cursor:"pointer", transition:"all .15s",
                  border:`1px solid ${active ? r.color+"77" : "rgba(26,53,85,0.4)"}`,
                  background:active
                    ? `linear-gradient(135deg,${r.color}20,${r.color}08)`
                    : "rgba(8,22,40,0.6)",
                  color:active ? r.color : T.txt4 }}>
                <span style={{ fontSize:15 }}>{r.icon}</span>
                {r.label}
                {r.shockable && active && (
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
                    letterSpacing:1, background:"rgba(255,68,68,0.2)",
                    border:"1px solid rgba(255,68,68,0.4)",
                    borderRadius:4, padding:"1px 5px", color:T.red }}>SHOCKABLE</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Main layout */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 380px",
          gap:12, alignItems:"start" }}>

          {/* Left: checklist + H's and T's */}
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
              <span style={{ fontSize:22 }}>{rConfig?.icon}</span>
              <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
                fontSize:18, color:rConfig?.color || T.txt }}>{rConfig?.label}</span>
              <div style={{ flex:1, height:1,
                background:`linear-gradient(90deg,${rConfig?.color || T.txt4}44,transparent)` }} />
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                color:doneCount === checklist.length ? T.green : T.txt4, letterSpacing:1 }}>
                {doneCount}/{checklist.length} complete
              </span>
            </div>

            <div style={{ marginBottom:12 }}>
              {checklist.map(item => (
                <CheckItem key={item.id} item={item}
                  checked={Boolean(checkState[item.id])}
                  onToggle={() => toggleCheck(item.id)} />
              ))}
            </div>

            <HsTs checked={htChecked} onToggle={toggleHT} />
          </div>

          {/* Right: timers + shock */}
          <div>
            <CPRTimer />
            {(rhythm === "vfpvt" || rhythm === "pea" || rhythm === "asystole") && <EpiTimer />}
            {(rhythm === "vfpvt" || rhythm === "svt") && (
              <ShockPanel isPeds={isPeds} weightKg={weightKg} />
            )}

            {/* Quick reference */}
            <div style={{ padding:"10px 13px", borderRadius:9,
              background:"rgba(8,22,40,0.65)",
              border:"1px solid rgba(26,53,85,0.4)" }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:T.txt4, letterSpacing:1.5, textTransform:"uppercase", marginBottom:8 }}>
                Quick Reference
              </div>
              {[
                { label:"CPR rate",       val:"100–120/min",            color:T.red    },
                { label:"CPR depth",      val:"2–2.4 inches",           color:T.red    },
                { label:"Ventilation",    val:"10/min (advanced airway)",color:T.blue  },
                { label:"Pause for check",val:"<10 seconds",            color:T.gold   },
                { label:"Epinephrine",    val:"1 mg IV/IO q3–5 min",    color:T.orange },
                { label:"Amiodarone",     val:"300 mg → 150 mg",        color:T.orange },
                ...(isPeds ? [
                  { label:"Peds epi",   val:`${Math.round((parseFloat(weightKg)||0)*0.01*10)/10} mg (0.01 mg/kg)`, color:T.gold },
                  { label:"Peds amiod", val:`${Math.round((parseFloat(weightKg)||0)*5)} mg (5 mg/kg)`,            color:T.gold },
                ] : []),
              ].map(r => (
                <div key={r.label} style={{ display:"flex", justifyContent:"space-between",
                  padding:"4px 0", borderBottom:"1px solid rgba(26,53,85,0.2)" }}>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace",
                    fontSize:9, color:T.txt4 }}>{r.label}</span>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace",
                    fontSize:9, fontWeight:700, color:r.color }}>{r.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {!embedded && (
          <div style={{ textAlign:"center", padding:"24px 0 16px",
            fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, letterSpacing:1.5 }}>
            NOTRYA RESUS · ACLS 2020 · PALS 2020 · AHA GUIDELINES · VERIFY WITH LOCAL PROTOCOLS AND CURRENT STANDARDS
          </div>
        )}
      </div>
    </div>
  );
}