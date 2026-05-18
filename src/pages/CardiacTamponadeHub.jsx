import { useState } from "react";

// ════════════════════════════════════════════════════════════
//  CARDIAC TAMPONADE HUB — Phase 1 Port to Notrya Glassmorphism
//  Original: standalone T/G design system
//  Ported:   Notrya CSS vars + glassmorphism primitives
//  Props:    onBack (fn) · embedded (bool)
// ════════════════════════════════════════════════════════════

// ── Color accent palette (matches Notrya CardiacHub vars) ──
const A = {
  coral:  { bg:"rgba(255,107,107,0.07)",  br:"rgba(255,107,107,0.30)",  c:"var(--coral)"  },
  teal:   { bg:"rgba(0,229,192,0.07)",    br:"rgba(0,229,192,0.30)",    c:"var(--teal)"   },
  blue:   { bg:"rgba(59,158,255,0.07)",   br:"rgba(59,158,255,0.30)",   c:"var(--blue)"   },
  gold:   { bg:"rgba(245,200,66,0.07)",   br:"rgba(245,200,66,0.30)",   c:"var(--gold)"   },
  purple: { bg:"rgba(155,109,255,0.09)",  br:"rgba(155,109,255,0.30)",  c:"var(--purple)" },
  orange: { bg:"rgba(255,159,67,0.07)",   br:"rgba(255,159,67,0.30)",   c:"var(--orange)" },
  green:  { bg:"rgba(61,255,160,0.07)",   br:"rgba(61,255,160,0.30)",   c:"var(--green)"  },
};

// ── Style helpers ───────────────────────────────────────────
const gBox = (extra={}) => ({
  background:"rgba(8,22,40,0.65)",
  backdropFilter:"blur(16px)",
  WebkitBackdropFilter:"blur(16px)",
  border:"1px solid var(--border)",
  borderRadius:12,
  ...extra,
});

const aBox = (key, mb=10) => ({
  background:A[key].bg,
  border:`1px solid ${A[key].br}`,
  borderRadius:10,
  padding:"10px 14px",
  marginBottom:mb,
});

// ── Shared micro-components ─────────────────────────────────
function Bul({c, children}){
  return(
    <div style={{display:"flex",gap:7,alignItems:"flex-start",marginBottom:5}}>
      <span style={{color:c||"var(--txt3)",fontSize:10,marginTop:3,flexShrink:0}}>▸</span>
      <span style={{fontSize:12,color:"var(--txt2)",lineHeight:1.55,fontFamily:"'DM Sans',sans-serif"}}>{children}</span>
    </div>
  );
}

function SLabel({c="var(--teal)",children}){
  return(
    <div style={{fontSize:10,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:c,margin:"18px 0 10px",display:"flex",alignItems:"center",gap:8}}>
      <div style={{height:1,width:20,background:c,opacity:.3,flexShrink:0}}/>
      {children}
      <div style={{height:1,flex:1,background:c,opacity:.15}}/>
    </div>
  );
}

function SensBadge({label, value}){
  const col = label==="Sens" ? "var(--teal)" : "var(--purple)";
  const bg  = label==="Sens" ? "rgba(0,229,192,0.1)" : "rgba(155,109,255,0.1)";
  const br  = label==="Sens" ? "rgba(0,229,192,0.3)" : "rgba(155,109,255,0.3)";
  return(
    <span style={{fontSize:9,background:bg,border:`1px solid ${br}`,borderRadius:20,padding:"1px 7px",color:col,fontFamily:"'JetBrains Mono',monospace",fontWeight:700,whiteSpace:"nowrap"}}>
      {label}: {value}
    </span>
  );
}

// ════════════════════════════════════════════════════════════
//  CLINICAL DATA
// ════════════════════════════════════════════════════════════

const CAUSES = [
  { cause:"Malignancy",             pct:"~50%",    color:"coral",
    detail:"Lung · breast · lymphoma · leukemia · melanoma · most common cause of large effusion · often bloody · tamponade may be first presentation",
    tx:"Pericardiocentesis + cytology · oncology consult · possible sclerotherapy or pericardial window for recurrence" },
  { cause:"Idiopathic / Viral",     pct:"~15–20%", color:"blue",
    detail:"Most common cause overall including small effusions · Coxsackievirus · echovirus · usually self-limited",
    tx:"NSAIDs + colchicine · steroids for refractory · pericardiocentesis if large + hemodynamic compromise" },
  { cause:"Post-Cardiac Procedure", pct:"~10%",    color:"orange",
    detail:"Cardiac surgery · PCI · ablation · device implantation · pacemaker/ICD leads · diagnosis often delayed 24–72h",
    tx:"Emergent pericardiocentesis · cardiac surgery if hematoma / clot" },
  { cause:"Aortic Dissection (A)",  pct:"~5%",     color:"coral",
    detail:"Retrograde dissection → hemopericardium · DO NOT drain → removes tamponading pressure on aortic tear → catastrophic hemorrhage",
    tx:"IMMEDIATE cardiac surgery — pericardiocentesis is CONTRAINDICATED. The effusion is a safety valve." },
  { cause:"Uremic Pericarditis",    pct:"~5%",     color:"gold",
    detail:"CKD/ESRD · fibrinous exudate · bloody effusion · large volume · usually responds to dialysis",
    tx:"Urgent dialysis (intensive) · pericardiocentesis if hemodynamically compromised + not responding to dialysis" },
  { cause:"Trauma / Hemopericardium", pct:"~5%",   color:"orange",
    detail:"Penetrating trauma · blunt cardiac injury · iatrogenic (post-procedure) · rapidly accumulating blood → rapid tamponade despite small volume",
    tx:"Emergent surgical drainage · pericardiocentesis as temporizing bridge for penetrating trauma" },
  { cause:"Hypothyroidism",         pct:"Rare",    color:"purple",
    detail:"Slowly accumulating effusion · often asymptomatic until large · low-density fluid on echo · check TSH in unexplained large effusion",
    tx:"Thyroid replacement · effusion resolves slowly · pericardiocentesis if hemodynamic compromise" },
  { cause:"Bacterial / Purulent",   pct:"Rare",    color:"teal",
    detail:"Post-sternotomy infection · immunocompromised · septicemia · high mortality without drainage · fibrinous/loculated",
    tx:"Emergent pericardiocentesis + irrigation + surgical drainage · IV antibiotics · pericardial window" },
];

const POCUS_VIEWS = {
  Subcostal: {
    color:"teal",
    findings:[
      "Pericardial effusion (echo-free space around heart)",
      "RV collapse during diastole — most sensitive sign",
      "RA collapse during systole — early sign",
      "Exaggerated cardiac motion ('swinging heart')",
      "Plethoric IVC (> 2.1 cm, < 50% collapse with sniff)",
    ],
    how:"Subxiphoid position · indicator toward patient's left · aim toward left shoulder · liver as acoustic window",
    pearl:"Start here in any emergency — fastest view to rule in tamponade. RV diastolic collapse is the most sensitive echo sign.",
  },
  "Par. Long": {
    color:"blue",
    findings:[
      "Posterior effusion (echo-free space behind LV)",
      "RA or RV wall motion abnormalities",
      "Effusion size estimation: small < 1cm · moderate 1–2cm · large > 2cm",
      "Fibrinous strands or septations (exudative vs transudative)",
    ],
    how:"Left sternal border · 3rd–4th intercostal space · indicator toward right shoulder",
    pearl:"Best view for effusion size quantification. Posterior effusions in PLAX are the most common early location to see fluid.",
  },
  "Apical 4C": {
    color:"purple",
    findings:[
      "RA / LA collapse during systole",
      "Exaggerated septal movement with respiration (correlate of pulsus paradoxus)",
      "Mitral E-wave variation > 25% with respiration",
      "Tricuspid E-wave variation > 40% with respiration",
    ],
    how:"Patient left lateral decubitus · apex of LV · indicator toward right shoulder",
    pearl:"Use Doppler here to demonstrate respiratory variation in mitral/tricuspid flow — confirms tamponade physiology before clinical decompensation.",
  },
  "IVC View": {
    color:"gold",
    findings:[
      "IVC > 2.1 cm = elevated CVP",
      "IVC collapse < 50% with sniff = plethoric IVC",
      "Confirms elevated right-sided pressures",
      "Collapsing IVC = low CVP (not tamponade unless effusion confirmed)",
    ],
    how:"Rotate probe from cardiac subcostal view · image IVC entering right atrium",
    pearl:"Plethoric IVC (large, non-collapsing) in the context of effusion and hemodynamic compromise = tamponade until proven otherwise.",
  },
};

// ════════════════════════════════════════════════════════════
//  TAB CONTENT
// ════════════════════════════════════════════════════════════

function RecognitionTab(){
  const [openCause, setOpenCause] = useState(null);
  const selCause = CAUSES.find(c=>c.cause===openCause);

  return(
    <div>
      {/* Critical alert */}
      <div style={{...aBox("coral",16)}}>
        <div style={{fontSize:12,fontWeight:700,color:"var(--coral)",marginBottom:4}}>Tamponade is a Clinical + Hemodynamic Diagnosis — Do NOT Wait for Echo</div>
        <div style={{fontSize:11.5,color:"var(--txt3)",lineHeight:1.6}}>Cardiac tamponade = pericardial effusion compressing cardiac chambers → obstructive shock. Rate of accumulation matters MORE than volume — 150 mL rapid accumulation can cause tamponade; 2L slowly accumulated may not.</div>
      </div>

      {/* Beck's Triad */}
      <SLabel c="var(--coral)">Beck's Triad — Classic (Rarely All Three Present)</SLabel>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:14}}>
        {[
          {sign:"Hypotension",detail:"Reduced cardiac output from restricted filling · narrow pulse pressure",color:"coral"},
          {sign:"Elevated JVP",detail:"Venous congestion as blood backs up · JVD · Kussmaul's sign",color:"orange"},
          {sign:"Muffled Heart Sounds",detail:"Fluid surrounding heart attenuates sounds · difficult to auscultate",color:"gold"},
        ].map(({sign,detail,color})=>(
          <div key={sign} style={{...gBox({padding:"12px 13px",borderLeft:`3px solid ${A[color].c}`})}}>
            <div style={{fontSize:13,fontWeight:700,color:A[color].c,marginBottom:4,fontFamily:"'DM Sans',sans-serif"}}>{sign}</div>
            <div style={{fontSize:11,color:"var(--txt3)",lineHeight:1.4}}>{detail}</div>
          </div>
        ))}
      </div>

      {/* Clinical Presentation */}
      <SLabel c="var(--gold)">Full Clinical Presentation</SLabel>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
        <div style={{...gBox({padding:"12px 13px",borderLeft:"3px solid var(--orange)"})}}>
          <div style={{fontSize:11,fontWeight:700,color:"var(--orange)",textTransform:"uppercase",letterSpacing:".07em",marginBottom:7}}>Symptoms</div>
          {["Dyspnea · orthopnea","Chest pressure or fullness","Anxiety · restlessness","Syncope or near-syncope","Fatigue · weakness","Palpitations"].map((s,i)=><Bul key={i} c="var(--orange)">{s}</Bul>)}
        </div>
        <div style={{...gBox({padding:"12px 13px",borderLeft:"3px solid var(--coral)"})}}>
          <div style={{fontSize:11,fontWeight:700,color:"var(--coral)",textTransform:"uppercase",letterSpacing:".07em",marginBottom:7}}>Signs</div>
          {["Tachycardia (almost universal)","Hypotension / narrow pulse pressure","JVD / elevated JVP","Pulsus paradoxus > 10 mmHg","Ewart's sign (dullness at left base)","Kussmaul's sign (JVP rises with inspiration)"].map((s,i)=><Bul key={i} c="var(--coral)">{s}</Bul>)}
        </div>
      </div>

      {/* Pulsus Paradoxus */}
      <SLabel c="var(--purple)">Pulsus Paradoxus — Measuring at the Bedside</SLabel>
      <div style={{...gBox({padding:"14px 16px",marginBottom:14})}}>
        <div style={{fontSize:11.5,color:"var(--txt3)",lineHeight:1.5,marginBottom:10}}>
          Normal: SBP drops 0–10 mmHg during inspiration. In tamponade: exaggerated drop {">"} 10 mmHg due to ventricular interdependence.
        </div>
        {[
          {n:1, step:"Inflate BP cuff above systolic pressure"},
          {n:2, step:"Slowly deflate until Korotkoff sounds heard ONLY during expiration — note this pressure"},
          {n:3, step:"Continue deflating until sounds heard throughout respiratory cycle — note this pressure"},
          {n:4, step:"Difference between the two pressures = pulsus paradoxus"},
          {n:5, step:"> 10 mmHg = significant · > 20 mmHg = severe tamponade physiology"},
        ].map(({n,step})=>(
          <div key={n} style={{display:"flex",gap:10,marginBottom:6}}>
            <div style={{width:22,height:22,borderRadius:"50%",background:"rgba(155,109,255,0.15)",border:"1px solid rgba(155,109,255,0.4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"var(--purple)",flexShrink:0}}>{n}</div>
            <div style={{fontSize:11.5,color:"var(--txt2)",marginTop:2,lineHeight:1.4}}>{step}</div>
          </div>
        ))}
        <div style={{...aBox("gold",0),marginTop:10}}>
          <div style={{fontSize:11.5,color:"var(--txt3)"}}>Pulsus may be absent in: severe AR · ASD · pulmonary HTN · LV dysfunction · positive pressure ventilation (paradox reversed)</div>
        </div>
      </div>

      {/* ECG Findings */}
      <SLabel c="var(--teal)">ECG Findings</SLabel>
      {[
        {finding:"Electrical alternans", detail:"Alternating QRS axis/amplitude — 'swinging heart' · pathognomonic for large effusion · ~20% sensitivity but highly specific · virtually diagnostic when present", color:"teal"},
        {finding:"Sinus tachycardia",   detail:"Almost universal — compensatory mechanism to maintain cardiac output", color:"gold"},
        {finding:"Low voltage QRS",     detail:"< 5 mm in limb leads · < 10 mm precordial leads · fluid attenuates electrical signal", color:"orange"},
        {finding:"PR depression",       detail:"Diffuse PR depression + saddle-shaped ST elevation = concurrent pericarditis (not tamponade alone)", color:"blue"},
      ].map(({finding,detail,color})=>(
        <div key={finding} style={{...gBox({padding:"9px 12px",marginBottom:6,borderLeft:`3px solid ${A[color].c}`})}}>
          <div style={{fontSize:12,fontWeight:700,color:A[color].c,marginBottom:2}}>{finding}</div>
          <div style={{fontSize:11.5,color:"var(--txt3)"}}>{detail}</div>
        </div>
      ))}

      {/* Causes */}
      <SLabel c="var(--orange)">Causes — tap to expand</SLabel>
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
        {CAUSES.map(c=>(
          <button key={c.cause} onClick={()=>setOpenCause(openCause===c.cause?null:c.cause)}
            style={{padding:"5px 11px",borderRadius:8,border:`1.5px solid ${openCause===c.cause?A[c.color].br:"var(--border)"}`,background:openCause===c.cause?A[c.color].bg:"rgba(14,37,68,0.5)",color:openCause===c.cause?A[c.color].c:"var(--txt3)",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",transition:"all 0.15s",backdropFilter:"blur(8px)"}}>
            {c.cause}
          </button>
        ))}
      </div>
      {selCause&&(
        <div style={{...gBox({border:`1.5px solid ${A[selCause.color].br}`,padding:"14px 16px",marginBottom:8})}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
            <span style={{fontSize:13,fontWeight:700,color:A[selCause.color].c}}>{selCause.cause}</span>
            <span style={{fontSize:10,color:"var(--txt4)",fontFamily:"'JetBrains Mono',monospace"}}>{selCause.pct}</span>
          </div>
          <div style={{fontSize:11.5,color:"var(--txt3)",marginBottom:10,lineHeight:1.55}}>{selCause.detail}</div>
          {selCause.color==="coral"&&selCause.cause.includes("Aortic")&&(
            <div style={{background:"rgba(255,107,107,0.12)",border:"2px solid rgba(255,107,107,0.5)",borderRadius:8,padding:"8px 12px",marginBottom:8}}>
              <div style={{fontSize:11,fontWeight:800,color:"var(--coral)"}}>⚠ DO NOT PERICARDIOCENTESIS</div>
            </div>
          )}
          <div style={aBox(selCause.color,0)}>
            <div style={{fontSize:11,fontWeight:700,color:A[selCause.color].c,marginBottom:3}}>Treatment</div>
            <div style={{fontSize:11.5,color:"var(--txt3)"}}>{selCause.tx}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function PocusTab(){
  const [view, setView] = useState("Subcostal");
  const sv = POCUS_VIEWS[view];
  const vc = A[sv.color];

  return(
    <div>
      <div style={aBox("teal",16)}>
        <div style={{fontSize:12,fontWeight:700,color:"var(--teal)",marginBottom:4}}>POCUS is the Diagnostic Tool of Choice</div>
        <div style={{fontSize:11.5,color:"var(--txt3)",lineHeight:1.6}}>Bedside echo diagnoses tamponade in minutes. Sensitivity 95–100% for hemodynamically significant effusions in experienced hands. Start with subcostal — fastest view to rule in.</div>
      </div>

      {/* View selector */}
      <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:14}}>
        {Object.keys(POCUS_VIEWS).map(v=>{
          const vc2=A[POCUS_VIEWS[v].color];
          return(
            <button key={v} onClick={()=>setView(v)}
              style={{padding:"7px 14px",borderRadius:9,border:`1.5px solid ${view===v?vc2.br:"var(--border)"}`,background:view===v?vc2.bg:"rgba(14,37,68,0.5)",color:view===v?vc2.c:"var(--txt3)",fontSize:11.5,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",transition:"all 0.15s",backdropFilter:"blur(8px)"}}>
              {v}
            </button>
          );
        })}
      </div>

      {/* View detail */}
      <div style={{...gBox({border:`1.5px solid ${vc.br}`,padding:"14px 16px",marginBottom:14})}}>
        <div style={{fontSize:13,fontWeight:700,color:vc.c,marginBottom:10,fontFamily:"'Playfair Display',serif"}}>{view} View</div>
        <div style={{fontSize:10.5,fontWeight:700,color:"var(--txt3)",textTransform:"uppercase",letterSpacing:".08em",marginBottom:6}}>How to Obtain</div>
        <div style={{fontSize:11.5,color:"var(--txt3)",marginBottom:12,lineHeight:1.5}}>{sv.how}</div>
        <div style={{fontSize:10.5,fontWeight:700,color:vc.c,textTransform:"uppercase",letterSpacing:".08em",marginBottom:6}}>Key Findings</div>
        {sv.findings.map((f,i)=><Bul key={i} c={vc.c}>{f}</Bul>)}
        <div style={{...aBox("gold",0),marginTop:10}}>
          <div style={{fontSize:11,fontWeight:700,color:"var(--gold)",marginBottom:3}}>⚡ Pearl</div>
          <div style={{fontSize:11.5,color:"var(--txt3)"}}>{sv.pearl}</div>
        </div>
      </div>

      {/* Echo signs hierarchy */}
      <SLabel c="var(--teal)">Echo Signs — Hierarchy of Sensitivity</SLabel>
      {[
        {sign:"RA systolic collapse",                    sens:"High",    spec:"Moderate", detail:"Earliest sign · RA free wall inverts during systole · appears before hemodynamic compromise",           color:"gold"},
        {sign:"RV diastolic collapse",                   sens:"Highest", spec:"High",     detail:"Most sensitive sign · RV free wall indents in diastole · cardiac output falling · best in subcostal / parasternal short", color:"coral"},
        {sign:"Mitral E-wave variation > 25%",           sens:"High",    spec:"High",     detail:"Doppler finding = tamponade physiology even before clinical signs · use 4-chamber view · confirms ventricular interdependence", color:"purple"},
        {sign:"Plethoric IVC (> 2.1 cm, < 50% collapse)",sens:"High",    spec:"Moderate", detail:"Reflects elevated right heart pressures · combined with effusion + RV collapse = strong tamponade evidence", color:"blue"},
        {sign:"Electrical alternans on ECG",             sens:"Low",     spec:"High",     detail:"Pathognomonic but only ~20% sensitive · large effusions only · swinging heart motion",                color:"teal"},
      ].map(({sign,sens,spec,detail,color})=>(
        <div key={sign} style={{...gBox({padding:"10px 12px",marginBottom:7,borderLeft:`3px solid ${A[color].c}`})}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4,gap:8}}>
            <span style={{fontSize:12,fontWeight:700,color:A[color].c,flex:1}}>{sign}</span>
            <div style={{display:"flex",gap:4,flexShrink:0}}>
              <SensBadge label="Sens" value={sens}/>
              <SensBadge label="Spec" value={spec}/>
            </div>
          </div>
          <div style={{fontSize:11.5,color:"var(--txt3)"}}>{detail}</div>
        </div>
      ))}

      {/* Effusion size */}
      <SLabel c="var(--coral)">Effusion Size Classification</SLabel>
      {[
        {size:"Trivial / Small", depth:"< 0.5 cm", vol:"< 100 mL",    sig:"Usually not hemodynamically significant · monitor with serial echo",              color:"green"},
        {size:"Moderate",        depth:"0.5–2 cm",  vol:"100–500 mL",  sig:"Hemodynamic significance depends on rate of accumulation and RV collapse signs",   color:"gold"},
        {size:"Large",           depth:"2–4 cm",    vol:"500–1000 mL", sig:"High risk of tamponade · assess for RV collapse + pulsus paradoxus",               color:"orange"},
        {size:"Very Large",      depth:"> 4 cm",    vol:"> 1000 mL",   sig:"Tamponade very likely if symptomatic · urgent drainage",                           color:"coral"},
      ].map(({size,depth,vol,sig,color})=>(
        <div key={size} style={{...gBox({borderRadius:9,padding:"9px 12px",marginBottom:6,borderLeft:`3px solid ${A[color].c}`})}}>
          <div style={{display:"flex",gap:10,marginBottom:3,alignItems:"center"}}>
            <span style={{fontSize:12,fontWeight:700,color:A[color].c,minWidth:100}}>{size}</span>
            <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"var(--txt)"}}>{depth} · {vol}</span>
          </div>
          <div style={{fontSize:11.5,color:"var(--txt3)"}}>{sig}</div>
        </div>
      ))}
    </div>
  );
}

function PericardiocentesisTab(){
  return(
    <div>
      <div style={aBox("coral",12)}>
        <div style={{fontSize:12,fontWeight:700,color:"var(--coral)",marginBottom:4}}>Pericardiocentesis — Lifesaving Procedure in Tamponade</div>
        <div style={{fontSize:11.5,color:"var(--txt3)",lineHeight:1.6}}>Even 50–100 mL of fluid removal can dramatically improve hemodynamics. Use echo guidance whenever available. Call cardiology/CT surgery for complex cases.</div>
      </div>

      {/* Dissection warning */}
      <div style={{background:"rgba(255,107,107,0.10)",border:"2px solid rgba(255,107,107,0.45)",borderRadius:12,padding:"13px 14px",marginBottom:14}}>
        <div style={{fontSize:12,fontWeight:800,color:"var(--coral)",marginBottom:6}}>⚠ AORTIC DISSECTION — DO NOT DRAIN</div>
        <div style={{fontSize:11.5,color:"var(--txt3)",lineHeight:1.5}}>Pericardiocentesis in Type A aortic dissection removes the tamponading pressure on the aortic tear → catastrophic hemorrhage. The effusion is a safety valve. Take immediately to cardiac surgery — do not drain first.</div>
      </div>

      {/* Step-by-step */}
      <SLabel>Pericardiocentesis Technique — Step by Step</SLabel>
      {[
        {n:1, step:"Patient Preparation",      detail:"HOB 30–45° (heart closer to chest wall) · continuous ECG + SpO₂ monitoring · large-bore IV · atropine drawn up (vagal reaction) · echo guidance set up · confirm effusion location and optimal entry point", color:"teal"},
        {n:2, step:"Subxiphoid Approach",      detail:"Entry point: 1 cm below xiphoid and 1 cm left of midline · direction: toward left shoulder at 30–45° from skin surface · alternative: parasternal (3rd–5th ICS) for anterior effusions", color:"blue"},
        {n:3, step:"Echo-Guided Insertion",    detail:"Bubble test: agitated saline flush into needle — bubbles seen in pericardial space (not cardiac chambers) confirm correct location · track needle tip toward effusion on real-time echo", color:"purple"},
        {n:4, step:"ECG Monitoring",           detail:"Connect alligator clip from ECG lead to needle hub · ST elevation or premature beats = needle touching myocardium → PULL BACK immediately · historical technique — echo guidance is preferred", color:"gold"},
        {n:5, step:"Fluid Aspiration",         detail:"Aspirate 50–100 mL → reassess hemodynamics immediately · bloody fluid check: pericardial blood does not clot after several hours (defibrinated) — if it clots rapidly, suspect ventricular entry · send for cytology, cultures, cell count, LDH, protein", color:"orange"},
        {n:6, step:"Pericardial Drain",        detail:"Convert to Seldinger technique → pigtail catheter · leave drain for 24–48h if significant reaccumulation · gravity drainage or gentle suction · remove when output < 25 mL/day", color:"coral"},
      ].map(({n,step,detail,color})=>(
        <div key={n} style={{...gBox({padding:"11px 14px",marginBottom:8}),display:"flex",gap:12,alignItems:"flex-start"}}>
          <div style={{width:26,height:26,borderRadius:"50%",background:A[color].bg,border:`1.5px solid ${A[color].br}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:A[color].c,flexShrink:0}}>{n}</div>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:A[color].c,marginBottom:3}}>{step}</div>
            <div style={{fontSize:11.5,color:"var(--txt3)",lineHeight:1.45}}>{detail}</div>
          </div>
        </div>
      ))}

      {/* Fluid analysis */}
      <SLabel c="var(--gold)">Pericardial Fluid Analysis</SLabel>
      <div style={{...gBox({padding:"14px 16px",marginBottom:14})}}>
        {[
          {test:"Appearance",    dx:"Serous = transudative (HF · hypoalbuminemia) · Hemorrhagic = malignancy / trauma / post-procedure · Purulent = infectious"},
          {test:"LDH / Protein", dx:"Light's criteria — Exudate: protein > 3g/dL OR LDH > 200 IU/L OR fluid/serum ratio > 0.5"},
          {test:"Cell count",    dx:"Lymphocytes predominant = malignancy / TB / viral · PMNs = bacterial · Eosinophils = post-cardiac injury syndrome"},
          {test:"Cytology",      dx:"Malignant cells · sensitivity 70–80% for malignant effusion · send ≥ 50 mL for best yield"},
          {test:"Culture",       dx:"Bacterial · fungal · AFB · pericardial culture sensitivity varies · low yield for viral etiologies"},
          {test:"Hematocrit",    dx:"Pericardial blood does not clot after first 24h (defibrinated) · rapid clotting suggests ventricular entry"},
          {test:"ADA",           dx:"Adenosine deaminase > 40 IU/L suggests TB pericarditis in correct clinical context"},
        ].map(({test,dx},i)=>(
          <div key={test} style={{display:"flex",gap:10,paddingBottom:6,marginBottom:6,borderBottom:i<6?"1px solid var(--border)":"none"}}>
            <div style={{fontSize:12,fontWeight:600,color:"var(--gold)",minWidth:120,flexShrink:0}}>{test}</div>
            <div style={{fontSize:11.5,color:"var(--txt3)",lineHeight:1.4}}>{dx}</div>
          </div>
        ))}
      </div>

      {/* Surgical options */}
      <SLabel c="var(--purple)">Surgical Options</SLabel>
      {[
        {opt:"Pericardial Window",  detail:"Subxiphoid surgical approach · creates permanent drainage opening · best for recurrent malignant effusions · prevents reaccumulation · can be done under local anesthesia · pleuropericardial window if coexisting pleural effusion", color:"purple"},
        {opt:"Pericardiectomy",     detail:"Complete pericardial removal · used for constrictive pericarditis (post-radiation · TB · post-op) · rarely needed acutely · major surgery with significant morbidity · thoracotomy required", color:"blue"},
        {opt:"Sclerotherapy",       detail:"Instillation of sclerosing agent (tetracycline · bleomycin · cisplatin) after drainage · malignant effusions · prevents reaccumulation · less common than pericardial window", color:"teal"},
      ].map(({opt,detail,color})=>(
        <div key={opt} style={{...gBox({padding:"10px 13px",marginBottom:7,borderLeft:`3px solid ${A[color].c}`})}}>
          <div style={{fontSize:12,fontWeight:700,color:A[color].c,marginBottom:3}}>{opt}</div>
          <div style={{fontSize:11.5,color:"var(--txt3)"}}>{detail}</div>
        </div>
      ))}
    </div>
  );
}

function MonitoringTab(){
  return(
    <div>
      {/* Stabilization */}
      <SLabel>Immediate Stabilization — Bridge to Drainage</SLabel>
      {[
        {tx:"IV Fluid Challenge",                       detail:"500 mL–1L NS bolus · increases RV preload → temporarily improves CO · buys time until drainage · watch for worsening JVD · do NOT over-resuscitate", color:"teal"},
        {tx:"Avoid Diuretics",                          detail:"Diuretics reduce preload → worsens tamponade physiology · completely contraindicated unless there is clear separate fluid overload · tamponade requires preload", color:"coral"},
        {tx:"Vasopressors",                             detail:"Norepinephrine 0.05–0.5 mcg/kg/min if hypotension persists despite fluids · maintain coronary perfusion while preparing for drainage · do NOT delay drainage for hemodynamic optimization", color:"gold"},
        {tx:"Avoid PPV if Possible",                    detail:"Positive pressure reduces RV preload → worsens tamponade · if intubation required: pre-drain if possible · use lowest PEEP · expect hemodynamic deterioration with induction · ketamine preferred (maintains SVR) · have pericardiocentesis set ready at induction", color:"orange"},
        {tx:"Position",                                 detail:"Semi-recumbent (30–45°) · reduces cardiac compression · improves hemodynamics slightly · do NOT lay flat · sitting upright for lucid patients", color:"blue"},
      ].map(({tx,detail,color})=>(
        <div key={tx} style={{...gBox({padding:"10px 13px",marginBottom:7,borderLeft:`3px solid ${A[color].c}`})}}>
          <div style={{fontSize:12,fontWeight:700,color:A[color].c,marginBottom:3}}>{tx}</div>
          <div style={{fontSize:11.5,color:"var(--txt3)",lineHeight:1.4}}>{detail}</div>
        </div>
      ))}

      {/* Post-drainage monitoring */}
      <SLabel c="var(--green)">Post-Drainage Monitoring</SLabel>
      {[
        {freq:"q15 min × 2h", items:"BP · HR · JVP reassessment · SpO₂ · pericardial drain output · echo reassessment",                              color:"coral"},
        {freq:"q1h × 6h",     items:"Drain output (mL) · hemodynamic stability · reaccumulation signs · vital signs trend",                          color:"gold"},
        {freq:"q4–6h",        items:"Echo for reaccumulation · electrolytes · CBC · coags · labs per underlying cause",                               color:"teal"},
        {freq:"Daily",         items:"Drain output · decide on drain removal (< 25 mL/day) · cause workup · oncology/cardiology disposition plan",     color:"green"},
      ].map(({freq,items,color})=>(
        <div key={freq} style={{...gBox({padding:"9px 12px",marginBottom:6}),display:"flex",gap:10,alignItems:"flex-start"}}>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:700,color:A[color].c,minWidth:120,flexShrink:0}}>{freq}</div>
          <div style={{fontSize:11.5,color:"var(--txt3)"}}>{items}</div>
        </div>
      ))}

      {/* Escalation */}
      <SLabel c="var(--coral)">Escalation Triggers</SLabel>
      {[
        "BP < 90 despite fluids + vasopressors → emergent pericardiocentesis, even without echo guidance",
        "Drain output suddenly stops (clot) → flush gently with 10 mL NS · if no output → reposition or replace catheter",
        "Echo shows reaccumulation to pre-drainage size → prolonged drainage vs. pericardial window evaluation",
        "Bloody output not decreasing after 24h → hemopericardium (post-op · trauma) → urgent cardiac surgery evaluation",
        "Cardiac arrest developing → pericardiocentesis during ACLS · open thoracotomy if PEA from tamponade",
      ].map((t,i)=>(
        <div key={i} style={{fontSize:12,color:"var(--txt2)",display:"flex",gap:8,marginBottom:7,lineHeight:1.45,fontFamily:"'DM Sans',sans-serif"}}>
          <span style={{color:"var(--coral)",flexShrink:0,marginTop:1}}>⚠</span>{t}
        </div>
      ))}

      {/* Disposition */}
      <SLabel c="var(--purple)">Disposition</SLabel>
      <div style={{...gBox({padding:"14px 16px"})}}>
        {[
          {level:"ICU",                        detail:"All hemodynamically significant tamponade · post-pericardiocentesis monitoring · malignant effusion · hemopericardium · active vasopressor requirement · drain in situ"},
          {level:"Cardiology ICU / CCU",       detail:"Post-procedure monitoring · cardiac cause (post-MI · post-procedure) · high risk of reaccumulation · needs cardiology + cardiac surgery on-call availability"},
          {level:"Telemetry",                  detail:"Small stable effusion without hemodynamic compromise · drain removed · pericarditis + effusion responding to NSAIDs/colchicine · serial echo every 24–48h"},
          {level:"CT Surgery Consult",         detail:"Aortic dissection · post-cardiac surgery hemopericardium · loculated effusion · failure of needle drainage · recurrent effusion (pericardial window) · any bloody drain output not clearing after 24–48h"},
        ].map(({level,detail},i)=>(
          <div key={i} style={{display:"flex",gap:10,paddingBottom:7,marginBottom:7,borderBottom:i<3?"1px solid var(--border)":"none"}}>
            <div style={{fontSize:12,fontWeight:700,color:"var(--purple)",minWidth:170,flexShrink:0}}>{level}</div>
            <div style={{fontSize:11.5,color:"var(--txt3)",lineHeight:1.4}}>{detail}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  MAIN EXPORT
// ════════════════════════════════════════════════════════════
const TABS_META = [
  {label:"Recognition",       icon:"🔍"},
  {label:"POCUS Diagnosis",   icon:"🔊"},
  {label:"Pericardiocentesis",icon:"💉"},
  {label:"Monitoring",        icon:"📊"},
];

export default function CardiacTamponadeHub({onBack, embedded=false}){
  const [tab, setTab] = useState(0);

  return(
    <div style={{display:"flex",flexDirection:"column",gap:14,fontFamily:"'DM Sans',sans-serif"}}>

      {/* Page Header — matches GlassPageHeader pattern from CardiacHub */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12,background:"rgba(8,22,40,0.72)",border:"1px solid rgba(255,107,107,0.28)",borderRadius:14,padding:"14px 18px",borderLeft:"3px solid var(--coral)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",boxShadow:"0 4px 24px rgba(0,0,0,0.4)"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          {onBack&&(
            <button onClick={onBack} style={{background:"rgba(26,53,85,0.6)",border:"1px solid rgba(42,79,122,0.6)",borderRadius:8,padding:"5px 10px",color:"var(--txt3)",fontSize:11,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",backdropFilter:"blur(8px)"}}>
              ← Back
            </button>
          )}
          <div style={{width:44,height:44,borderRadius:12,background:"rgba(255,107,107,0.12)",border:"1px solid rgba(255,107,107,0.30)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>❤️</div>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700,color:"var(--txt)"}}>Cardiac Tamponade</span>
              <span style={{fontSize:9,fontFamily:"'JetBrains Mono',monospace",background:"rgba(255,107,107,0.10)",color:"var(--coral)",border:"1px solid rgba(255,107,107,0.30)",borderRadius:20,padding:"2px 9px",fontWeight:700}}>ACC/AHA · Echo</span>
            </div>
            <div style={{fontSize:11,color:"var(--txt3)",marginTop:2}}>Beck's triad · Pulsus paradoxus · 4-view POCUS guide · Pericardiocentesis · Aortic dissection warning</div>
          </div>
        </div>
      </div>

      {/* Time Banner — matches TimeBanner pattern */}
      <div style={{display:"flex",gap:8}}>
        {[
          {icon:"🔍",label:"Suspect tamponade",   target:"Clinical dx first",        color:"var(--coral)"},
          {icon:"🔊",label:"Bedside POCUS",        target:"Subcostal immediately",    color:"var(--teal)"},
          {icon:"💉",label:"Drain 50–100 mL",      target:"Dramatic improvement",     color:"var(--gold)"},
          {icon:"⚠️",label:"Aortic dissection",    target:"DO NOT drain → OR",        color:"var(--orange)"},
        ].map((t,i)=>(
          <div key={i} style={{flex:1,background:"rgba(8,22,40,0.65)",border:"1px solid var(--border)",borderRadius:8,padding:"8px 10px",display:"flex",alignItems:"center",gap:8,backdropFilter:"blur(10px)"}}>
            <span style={{fontSize:14,flexShrink:0}}>{t.icon}</span>
            <div>
              <div style={{fontSize:9,color:"var(--txt3)"}}>{t.label}</div>
              <div style={{fontSize:11,fontWeight:700,color:t.color,fontFamily:"'JetBrains Mono',monospace"}}>{t.target}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tab Bar — matches CardiacHub tab pattern */}
      <div style={{display:"flex",gap:4,background:"rgba(8,22,40,0.65)",border:"1px solid rgba(26,53,85,0.75)",borderRadius:10,padding:4,backdropFilter:"blur(12px)"}}>
        {TABS_META.map((t,i)=>(
          <button key={t.label} onClick={()=>setTab(i)}
            style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:7,fontSize:12,fontWeight:tab===i?700:500,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",whiteSpace:"nowrap",flexShrink:0,flex:1,justifyContent:"center",transition:"all .2s",background:tab===i?"rgba(255,107,107,0.12)":"transparent",border:tab===i?"1px solid rgba(255,107,107,0.30)":"1px solid transparent",color:tab===i?"var(--coral)":"var(--txt3)"}}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* Content — matches GlassSectionBox pattern */}
      <div style={{background:"rgba(8,22,40,0.65)",border:"1px solid rgba(26,53,85,0.75)",borderRadius:14,padding:"18px 20px",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",boxShadow:"0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,paddingBottom:12,borderBottom:"1px solid rgba(26,53,85,0.6)"}}>
          <span style={{fontSize:18}}>{TABS_META[tab].icon}</span>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:"var(--txt)"}}>{TABS_META[tab].label} — Cardiac Tamponade</div>
            <div style={{fontSize:11,color:"var(--txt3)"}}>ACC/AHA · Echo Societies · Evidence-Based</div>
          </div>
          <span style={{marginLeft:"auto",fontSize:10,fontFamily:"'JetBrains Mono',monospace",fontWeight:700,padding:"3px 10px",borderRadius:20,background:"linear-gradient(90deg,rgba(0,229,192,.1),rgba(59,158,255,.1))",border:"1px solid rgba(0,229,192,.25)",color:"var(--teal)"}}>Guideline-Integrated</span>
        </div>
        {tab===0 && <RecognitionTab/>}
        {tab===1 && <PocusTab/>}
        {tab===2 && <PericardiocentesisTab/>}
        {tab===3 && <MonitoringTab/>}
      </div>

    </div>
  );
}