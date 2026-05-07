import { useState, useMemo } from "react";

(() => {
  if (document.getElementById("rmm-css")) return;
  const l = document.createElement("link"); l.id = "rmm-f"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "rmm-css";
  s.textContent = `
    *{box-sizing:border-box;}
    @keyframes rmmIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
    .rmm-in{animation:rmmIn .2s ease both;}
    ::-webkit-scrollbar{width:3px;} ::-webkit-scrollbar-thumb{background:rgba(240,165,0,.25);border-radius:2px;}
    input::placeholder{color:rgba(221,230,240,.2);}
    input:focus{border-color:rgba(240,165,0,.6)!important;outline:none;}
  `;
  document.head.appendChild(s);
})();

const T = {
  bg:"#07111f", card:"rgba(255,255,255,0.04)", bdr:"rgba(255,255,255,0.08)",
  coral:"#ff6060", cD:"rgba(255,96,96,0.12)",
  gold:"#f0a500", gD:"rgba(240,165,0,0.12)", gB:"rgba(240,165,0,0.25)",
  green:"#4ade80", grnD:"rgba(74,222,128,0.1)",
  teal:"#00b4d8", tD:"rgba(0,180,216,0.12)",
  purple:"#9b6dff", pD:"rgba(155,109,255,0.12)",
  txt:"#dde6f0", mut:"rgba(221,230,240,0.55)", dim:"rgba(221,230,240,0.28)",
};
const gl = (x={}) => ({backdropFilter:"blur(14px)",background:T.card,border:`1px solid ${T.bdr}`,borderRadius:12,...x});

const K = Math.log(4) / 8;
const treatmentThreshold = (hours) => {
  if (hours < 4 || hours > 24) return null;
  return 150 * Math.exp(-K * (hours - 4));
};

const CURVE_POINTS = Array.from({length: 41}, (_, i) => {
  const t = 4 + i * 0.5;
  return {t, level: 150 * Math.exp(-K * (t - 4))};
});

const nacDosing = (wt) => {
  const w = parseFloat(wt);
  if (!w || w <= 0) return null;
  return [
    {phase:"Loading dose",   dose: Math.round(w * 150 * 10) / 10, rate:"over 60 min",  conc:"200 mg/mL (diluted)", note:"Anaphylactoid reaction most likely with first bag — slow if reaction"},
    {phase:"Second infusion",dose: Math.round(w * 50  * 10) / 10, rate:"over 4 hours", conc:"200 mg/mL (diluted)", note:""},
    {phase:"Third infusion", dose: Math.round(w * 100 * 10) / 10, rate:"over 16 hours",conc:"200 mg/mL (diluted)", note:"Continue until INR <2, AST <100, patient clinically improving"},
  ];
};

function Nomogram({hours, level}) {
  const W = 340; const H = 220;
  const padL = 52; const padR = 14; const padT = 14; const padB = 36;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const tMin = 4; const tMax = 24;
  const lMax = 200;

  const tx = (t) => padL + (t - tMin) / (tMax - tMin) * chartW;
  const ty = (l) => padT + (1 - l / lMax) * chartH;

  const curvePath = CURVE_POINTS.map((p, i) =>
    `${i === 0 ? "M" : "L"}${tx(p.t).toFixed(1)},${ty(p.level).toFixed(1)}`
  ).join(" ");

  const h = parseFloat(hours);
  const lv = parseFloat(level);
  const ptX = hours && h >= tMin && h <= tMax ? tx(h) : null;
  const ptY = level && !isNaN(lv) ? ty(lv) : null;
  const threshold = h ? treatmentThreshold(h) : null;
  const aboveThreshold = threshold !== null && lv >= threshold;

  const timeGrid  = [4, 6, 8, 10, 12, 16, 20, 24];
  const levelGrid = [0, 50, 100, 150, 200];

  return (
    <svg width={W} height={H} style={{borderRadius:10,overflow:"visible"}}>
      <path d={`M${tx(4)},${padT} ${curvePath.replace("M","L")} L${tx(24)},${padT} Z`} fill="rgba(255,96,96,0.07)"/>
      <path d={`${curvePath} L${tx(24)},${ty(0)} L${tx(4)},${ty(0)} Z`} fill="rgba(74,222,128,0.06)"/>
      {timeGrid.map(t=>(
        <g key={t}>
          <line x1={tx(t)} y1={padT} x2={tx(t)} y2={padT+chartH} stroke="rgba(255,255,255,.06)" strokeWidth={1}/>
          <text x={tx(t)} y={padT+chartH+14} textAnchor="middle" fontFamily="JetBrains Mono,monospace" fontSize={8} fill="rgba(221,230,240,.35)">{t}h</text>
        </g>
      ))}
      {levelGrid.map(l=>(
        <g key={l}>
          <line x1={padL} y1={ty(l)} x2={padL+chartW} y2={ty(l)} stroke="rgba(255,255,255,.06)" strokeWidth={1}/>
          <text x={padL-6} y={ty(l)+4} textAnchor="end" fontFamily="JetBrains Mono,monospace" fontSize={8} fill="rgba(221,230,240,.35)">{l}</text>
        </g>
      ))}
      <line x1={padL} y1={padT} x2={padL} y2={padT+chartH} stroke="rgba(255,255,255,.2)" strokeWidth={1}/>
      <line x1={padL} y1={padT+chartH} x2={padL+chartW} y2={padT+chartH} stroke="rgba(255,255,255,.2)" strokeWidth={1}/>
      <path d={curvePath} fill="none" stroke={T.gold} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round"/>
      <text x={tx(13)} y={ty(65)} fontFamily="DM Sans,sans-serif" fontSize={9} fill={T.coral} fontWeight={700}>TREAT with NAC</text>
      <text x={tx(13)} y={ty(18)} fontFamily="DM Sans,sans-serif" fontSize={9} fill={T.green}>No treatment needed</text>
      <text x={W/2} y={H-2} textAnchor="middle" fontFamily="DM Sans,monospace" fontSize={9} fill={T.dim}>Hours post-ingestion</text>
      <text x={8} y={H/2} textAnchor="middle" fontFamily="JetBrains Mono,monospace" fontSize={8} fill={T.dim} transform={`rotate(-90,8,${H/2})`}>mcg/mL</text>
      {ptX && ptY && (
        <>
          <line x1={ptX} y1={padT} x2={ptX} y2={padT+chartH} stroke={aboveThreshold?T.coral:T.green} strokeWidth={1} strokeDasharray="4 3"/>
          <line x1={padL} y1={ptY} x2={padL+chartW} y2={ptY} stroke={aboveThreshold?T.coral:T.green} strokeWidth={1} strokeDasharray="4 3"/>
          <circle cx={ptX} cy={ptY} r={6} fill={aboveThreshold?T.coral:T.green} stroke="rgba(7,17,31,1)" strokeWidth={2}/>
        </>
      )}
    </svg>
  );
}

export default function RumackMatthewCalculator() {
  const [hours,    setHours]    = useState("");
  const [level,    setLevel]    = useState("");
  const [wt,       setWt]       = useState("");
  const [highRisk, setHighRisk] = useState(false);

  const threshold  = useMemo(() => hours ? treatmentThreshold(parseFloat(hours)) : null, [hours]);
  const aboveLine  = threshold !== null && level ? parseFloat(level) >= threshold : null;
  const earlyLevel = hours ? parseFloat(hours) < 4  : null;
  const lateLevel  = hours ? parseFloat(hours) > 24 : null;
  const dosingRows = useMemo(() => nacDosing(wt), [wt]);

  const interpretation = useMemo(() => {
    if (earlyLevel) return {label:"Level drawn too early", c:T.gold, detail:"Acetaminophen levels drawn before 4h post-ingestion are not interpretable on the Rumack-Matthew nomogram. Redraw at 4h."};
    if (lateLevel)  return {label:"Level drawn after 24h",  c:T.gold, detail:"Levels after 24h are not reliably interpretable. If hepatotoxicity present (elevated AST/ALT, coagulopathy), initiate NAC empirically. Consult toxicology."};
    if (aboveLine === null) return null;
    if (aboveLine)  return {label:"ABOVE treatment line — Initiate NAC", c:T.coral, detail:`Level ${level} mcg/mL at ${hours}h is above the treatment threshold (${threshold?.toFixed(1)} mcg/mL at ${hours}h). Initiate N-Acetylcysteine immediately.`};
    if (!aboveLine && highRisk) return {label:"Below treatment line — High-risk patient", c:T.gold, detail:`Level is below the standard treatment line but high-risk factors are present. Consider treatment. Consult toxicology or poison control (1-800-222-1222).`};
    return {label:"Below treatment line — Treatment not indicated", c:T.green, detail:`Level ${level} mcg/mL at ${hours}h is below the treatment threshold. Continue clinical monitoring, LFTs, and INR at 24h.`};
  }, [earlyLevel, lateLevel, aboveLine, highRisk, level, hours, threshold]);

  return (
    <div style={{background:T.bg,minHeight:"100vh",padding:"20px 18px 60px",fontFamily:"DM Sans,sans-serif",color:T.txt}}>

      {/* Header */}
      <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:22}}>
        <div style={{width:44,height:44,borderRadius:11,background:T.gD,border:`1px solid ${T.gB}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>⚗️</div>
        <div>
          <h1 style={{margin:0,fontFamily:"Playfair Display,serif",fontSize:22,color:T.gold,letterSpacing:"-0.5px",lineHeight:1}}>Rumack-Matthew Nomogram</h1>
          <p style={{margin:"3px 0 0",fontSize:12,color:T.mut}}>Acetaminophen toxicity · NAC treatment threshold · Weight-based dosing</p>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 360px",gap:16,alignItems:"start"}}>

        {/* Left */}
        <div>
          <div style={{...gl({padding:"16px 18px",marginBottom:14})}}>
            <div style={{fontSize:9,color:T.gold,fontFamily:"JetBrains Mono,monospace",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:12}}>Patient Parameters</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:12}}>
              {[
                ["Hours Post-Ingestion","hours",hours,setHours,"hr","4-24h window"],
                ["Serum APAP Level","level",level,setLevel,"mcg/mL","4h minimum"],
                ["Patient Weight","wt",wt,setWt,"kg","for NAC dosing"],
              ].map(([l,k,val,set,u,hint]) => (
                <div key={k}>
                  <div style={{fontSize:8,color:T.dim,fontFamily:"JetBrains Mono,monospace",letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>{l}</div>
                  <div style={{position:"relative"}}>
                    <input type="number" value={val} onChange={e=>set(e.target.value)} placeholder="—"
                      style={{background:"rgba(13,27,46,.8)",border:`1px solid ${T.bdr}`,borderRadius:8,padding:"8px 28px 8px 11px",color:T.txt,fontFamily:"JetBrains Mono,monospace",fontSize:14,fontWeight:700,width:"100%"}}/>
                    <span style={{position:"absolute",right:7,top:"50%",transform:"translateY(-50%)",fontSize:9,color:T.dim,pointerEvents:"none"}}>{u}</span>
                  </div>
                  <div style={{fontSize:9,color:T.dim,marginTop:3}}>{hint}</div>
                </div>
              ))}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
              <button onClick={()=>setHighRisk(p=>!p)}
                style={{padding:"5px 14px",borderRadius:7,cursor:"pointer",border:`1px solid ${highRisk?T.gold+"55":T.bdr}`,background:highRisk?T.gD:"transparent",color:highRisk?T.gold:T.mut,fontSize:12,fontWeight:700,fontFamily:"DM Sans,sans-serif"}}>
                {highRisk?"✓ High-Risk Patient":"Standard Risk"}
              </button>
              <span style={{fontSize:10,color:T.dim}}>High risk: chronic EtOH, malnutrition, CYP450 inducers (rifampin, carbamazepine, phenytoin, INH)</span>
            </div>
          </div>

          <div style={{...gl({padding:"16px 18px",marginBottom:14})}}>
            <div style={{fontSize:9,color:T.dim,fontFamily:"JetBrains Mono,monospace",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:12}}>Rumack-Matthew Nomogram — Treatment Line</div>
            <Nomogram hours={hours} level={level}/>
            {threshold && hours && !earlyLevel && !lateLevel && (
              <div style={{marginTop:10,fontSize:11,color:T.mut}}>
                Treatment threshold at <strong style={{color:T.gold,fontFamily:"JetBrains Mono,monospace"}}>{parseFloat(hours).toFixed(0)}h</strong>:{" "}
                <strong style={{color:T.gold,fontFamily:"JetBrains Mono,monospace"}}>{threshold.toFixed(1)} mcg/mL</strong>
              </div>
            )}
          </div>

          <div style={{...gl({padding:"14px 16px"})}}>
            <div style={{fontSize:9,color:T.dim,fontFamily:"JetBrains Mono,monospace",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:10}}>Treatment Threshold Reference</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:5}}>
              {[4,6,8,10,12,16,20,24].map(h => {
                const thr = treatmentThreshold(h);
                const isCurrent = hours && Math.abs(parseFloat(hours)-h) < 0.5;
                return (
                  <div key={h} style={{background:isCurrent?T.gD:T.card,borderRadius:7,padding:"7px 6px",textAlign:"center",border:`1px solid ${isCurrent?T.gold+"55":T.bdr}`}}>
                    <div style={{fontSize:9,color:isCurrent?T.gold:T.dim}}>{h}h</div>
                    <div style={{fontFamily:"JetBrains Mono,monospace",fontWeight:700,fontSize:12,color:isCurrent?T.gold:T.mut}}>{thr?.toFixed(0)}</div>
                  </div>
                );
              })}
            </div>
            <div style={{fontSize:9,color:T.dim,marginTop:8}}>mcg/mL — treatment threshold at each time point. For high-risk patients, consider treating at lower levels.</div>
          </div>
        </div>

        {/* Right */}
        <div style={{position:"sticky",top:16}}>
          {interpretation && (
            <div className="rmm-in" style={{...gl({padding:"14px 16px",marginBottom:12,border:`2px solid ${interpretation.c}40`,background:`${interpretation.c}08`})}}>
              <div style={{fontSize:14,fontWeight:700,color:interpretation.c,marginBottom:8}}>{interpretation.label}</div>
              <div style={{fontSize:12,color:T.txt,lineHeight:1.65}}>{interpretation.detail}</div>
              {aboveLine && <div style={{marginTop:10,fontSize:11,color:T.coral,fontWeight:700}}>→ Contact Poison Control if needed: 1-800-222-1222</div>}
            </div>
          )}

          {(aboveLine || (highRisk && aboveLine === false)) && (
            <div className="rmm-in">
              <div style={{...gl({padding:"14px 16px",marginBottom:10,border:`1px solid ${T.gold}35`})}}>
                <div style={{fontSize:9,color:T.gold,fontFamily:"JetBrains Mono,monospace",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:10}}>NAC Protocol (IV Acetadote)</div>
                {!wt ? (
                  <div style={{fontSize:11,color:T.dim}}>Enter patient weight above to calculate doses</div>
                ) : dosingRows?.map((row, i) => (
                  <div key={i} style={{background:i===0?T.gD:T.card,borderRadius:9,padding:"10px 12px",marginBottom:8,border:`1px solid ${i===0?T.gold+"30":T.bdr}`}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                      <span style={{fontSize:10,color:T.gold,fontWeight:700,fontFamily:"JetBrains Mono,monospace"}}>Bag {i+1}: {row.phase}</span>
                      <span style={{fontSize:10,color:T.mut}}>{row.rate}</span>
                    </div>
                    <div style={{fontFamily:"JetBrains Mono,monospace",fontWeight:700,fontSize:20,color:T.gold,marginBottom:3}}>{row.dose} mg</div>
                    <div style={{fontSize:10,color:T.mut}}>{row.conc}</div>
                    {row.note && <div style={{fontSize:10,color:T.coral,marginTop:4}}>{row.note}</div>}
                  </div>
                ))}
                <div style={{fontSize:9,color:T.dim,marginTop:4}}>Total NAC: {wt?Math.round(parseFloat(wt)*300):"—"} mg over 21 hours</div>
              </div>
              <div style={{...gl({padding:"12px 14px",background:T.pD,border:`1px solid ${T.purple}25`})}}>
                <div style={{fontSize:9,color:T.purple,fontFamily:"JetBrains Mono,monospace",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>Anaphylactoid Reaction Management</div>
                <div style={{fontSize:11,color:T.mut,lineHeight:1.65}}>
                  Risk ~5-10% with first bag. If urticaria, bronchospasm, or hypotension:<br/>
                  1. Stop infusion<br/>
                  2. Diphenhydramine 50mg IV<br/>
                  3. Resume at 50% rate when resolved<br/>
                  4. Restart at full rate after 30 min if tolerated<br/>
                  ⚠️ True anaphylaxis is rare — do NOT withhold NAC if indicated
                </div>
              </div>
            </div>
          )}

          <div style={{...gl({padding:"12px 14px",marginTop:12})}}>
            <div style={{fontSize:9,color:T.teal,fontFamily:"JetBrains Mono,monospace",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>Monitoring Parameters</div>
            {[
              "AST/ALT, INR, creatinine — baseline and q8-12h",
              "Serum APAP level q4h until declining",
              "Glucose (hypoglycemia in severe hepatotoxicity)",
              "LFTs peak 48-72h post-ingestion",
              "Continue NAC until INR <2 and AST <100 IU/L",
              "Transplant evaluation if King's College criteria met",
            ].map((m, i) => (
              <div key={i} style={{fontSize:11,color:T.mut,padding:"3px 0",borderBottom:i<5?`1px solid ${T.bdr}`:"none",lineHeight:1.5}}>• {m}</div>
            ))}
          </div>

          <div style={{...gl({padding:"10px 14px",marginTop:10,background:T.gD,border:`1px solid ${T.gold}25`})}}>
            <div style={{fontSize:10,color:T.gold,fontWeight:700,marginBottom:4}}>Staggered Overdose / Unknown Time</div>
            <div style={{fontSize:11,color:T.mut,lineHeight:1.6}}>For staggered ingestion, extended-release formulation, or unknown ingestion time, the nomogram is not applicable. Treat empirically with NAC if any concern. Consult toxicology or Poison Control.</div>
          </div>
        </div>
      </div>

      <div style={{marginTop:40,textAlign:"center"}}>
        <span style={{fontFamily:"JetBrains Mono,monospace",fontSize:9,color:T.dim,letterSpacing:1.5}}>
          NOTRYA · RUMACK-MATTHEW NOMOGRAM · CONSULT POISON CONTROL (1-800-222-1222) · VERIFY WITH CLINICAL JUDGMENT
        </span>
      </div>
    </div>
  );
}