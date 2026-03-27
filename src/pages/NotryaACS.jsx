import { useState, useRef, useEffect, useCallback } from "react";

// ════════════════════════════════════════════════════════════
//  SHARED DESIGN PRIMITIVES
// ════════════════════════════════════════════════════════════
const nowTime = () => { const d=new Date(); return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; };

function CORBadge({cor}){
  const MAP={I:{bg:"rgba(0,229,192,.12)",br:"rgba(0,229,192,.4)",c:"var(--teal)"},IIa:{bg:"rgba(59,158,255,.12)",br:"rgba(59,158,255,.4)",c:"var(--blue)"},IIb:{bg:"rgba(245,200,66,.12)",br:"rgba(245,200,66,.4)",c:"var(--gold)"},III:{bg:"rgba(255,107,107,.12)",br:"rgba(255,107,107,.4)",c:"var(--coral)"}};
  const s=MAP[cor]||MAP.IIa;
  return <span style={{fontSize:10,fontFamily:"'JetBrains Mono',monospace",fontWeight:700,padding:"2px 7px",borderRadius:20,background:s.bg,border:`1px solid ${s.br}`,color:s.c,whiteSpace:"nowrap"}}>COR {cor}</span>;
}

const Arrow=()=>(
  <div style={{display:"flex",flexDirection:"column",alignItems:"center",margin:"2px 0"}}>
    <div style={{width:2,height:14,background:"var(--border-hi)"}}/>
    <div style={{width:0,height:0,borderLeft:"7px solid transparent",borderRight:"7px solid transparent",borderTop:"9px solid var(--border-hi)"}}/>
  </div>
);

function FlowNode({type,text,sub,items,badge,color,branches}){
  const col={coral:"var(--coral)",orange:"var(--orange)",blue:"var(--blue)",teal:"var(--teal)",gold:"var(--gold)",purple:"var(--purple)",green:"var(--green)"}[color]||"var(--blue)";
  const bg={coral:"rgba(255,107,107,.07)",orange:"rgba(255,159,67,.07)",blue:"rgba(59,158,255,.07)",teal:"rgba(0,229,192,.07)",gold:"rgba(245,200,66,.07)",purple:"rgba(155,109,255,.1)",green:"rgba(61,255,160,.07)"}[color]||"rgba(59,158,255,.07)";
  const br={coral:"rgba(255,107,107,.3)",orange:"rgba(255,159,67,.3)",blue:"rgba(59,158,255,.3)",teal:"rgba(0,229,192,.3)",gold:"rgba(245,200,66,.3)",purple:"rgba(155,109,255,.3)",green:"rgba(61,255,160,.3)"}[color]||"rgba(59,158,255,.3)";

  if(type==="start") return(
    <div style={{background:"rgba(155,109,255,.12)",border:"1px solid rgba(155,109,255,.35)",borderRadius:30,padding:"10px 28px",textAlign:"center",maxWidth:520,width:"100%"}}>
      <div style={{fontSize:13,fontWeight:600,color:"var(--purple)"}}>{text}</div>
      {sub&&<div style={{fontSize:11,color:"var(--txt3)",marginTop:3}}>{sub}</div>}
    </div>
  );
  if(type==="action") return(
    <div style={{background:bg,border:`1px solid ${br}`,borderRadius:10,padding:"11px 16px",maxWidth:520,width:"100%"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:items?.length?7:0}}>
        <div style={{fontSize:13,fontWeight:700,color:col}}>{text}</div>
        {badge&&<span style={{fontSize:9,background:col,color:"#000",borderRadius:20,padding:"2px 8px",fontFamily:"'JetBrains Mono',monospace",fontWeight:700,whiteSpace:"nowrap",marginLeft:8}}>{badge}</span>}
      </div>
      {sub&&<div style={{fontSize:11,color:"var(--txt3)",marginBottom:items?.length?6:0,lineHeight:1.4}}>{sub}</div>}
      {items?.map((it,j)=><div key={j} style={{display:"flex",alignItems:"flex-start",gap:6,fontSize:12,color:"var(--txt2)",marginBottom:2}}><span style={{color:col,flexShrink:0,marginTop:1}}>▸</span>{it}</div>)}
    </div>
  );
  if(type==="decision") return(
    <div style={{width:"100%",maxWidth:560}}>
      <div style={{background:"rgba(245,200,66,.08)",border:"1px solid rgba(245,200,66,.3)",borderRadius:10,padding:"9px 16px",textAlign:"center",marginBottom:8}}>
        <div style={{fontSize:12,fontWeight:700,color:"var(--gold)"}}>⬡ {text}</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:`repeat(${branches.length},1fr)`,gap:8}}>
        {branches.map((b,j)=>{
          const bc={coral:"var(--coral)",orange:"var(--orange)",blue:"var(--blue)",teal:"var(--teal)",gold:"var(--gold)"}[b.color]||"var(--blue)";
          const bbg={coral:"rgba(255,107,107,.08)",orange:"rgba(255,159,67,.08)",blue:"rgba(59,158,255,.08)",teal:"rgba(0,229,192,.07)",gold:"rgba(245,200,66,.08)"}[b.color]||"rgba(59,158,255,.08)";
          return(<div key={j} style={{background:bbg,border:`1px solid ${bc}40`,borderRadius:8,padding:"9px 10px",textAlign:"center"}}>
            {b.tag&&<div style={{fontSize:9,fontWeight:700,color:bc,fontFamily:"'JetBrains Mono',monospace",marginBottom:4}}>{b.tag}</div>}
            <div style={{fontSize:11,color:"var(--txt2)",lineHeight:1.45,whiteSpace:"pre-line"}}>{b.label}</div>
          </div>);
        })}
      </div>
    </div>
  );
  if(type==="outcome") return(
    <div style={{background:bg,border:`1px solid ${br}`,borderRadius:10,padding:"10px 18px",maxWidth:520,width:"100%",textAlign:"center"}}>
      <div style={{fontSize:13,fontWeight:700,color:col}}>{text}</div>
      {sub&&<div style={{fontSize:11,color:"var(--txt3)",marginTop:4,lineHeight:1.4}}>{sub}</div>}
    </div>
  );
  return null;
}

function PageHeader({icon,title,badge,badgeColor,sub,extra}){
  const bc={coral:"var(--coral)",teal:"var(--teal)",blue:"var(--blue)",gold:"var(--gold)",purple:"var(--purple)",orange:"var(--orange)"}[badgeColor]||"var(--teal)";
  const bbg={coral:"rgba(255,107,107,.12)",teal:"rgba(0,229,192,.1)",blue:"rgba(59,158,255,.12)",gold:"rgba(245,200,66,.1)",purple:"rgba(155,109,255,.12)",orange:"rgba(255,159,67,.1)"}[badgeColor]||"rgba(0,229,192,.1)";
  const bbr={coral:"rgba(255,107,107,.3)",teal:"rgba(0,229,192,.3)",blue:"rgba(59,158,255,.3)",gold:"rgba(245,200,66,.3)",purple:"rgba(155,109,255,.3)",orange:"rgba(255,159,67,.3)"}[badgeColor]||"rgba(0,229,192,.3)";
  const borderColor={coral:"var(--coral)",teal:"var(--teal)",blue:"var(--blue)",gold:"var(--gold)",purple:"var(--purple)",orange:"var(--orange)"}[badgeColor]||"var(--teal)";
  return(
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12,background:"var(--bg-panel)",border:"1px solid var(--border)",borderRadius:12,padding:"14px 18px",borderLeft:`3px solid ${borderColor}`}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:44,height:44,borderRadius:12,background:`linear-gradient(135deg,${bbg},rgba(155,109,255,.1))`,border:`1px solid ${bbr}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{icon}</div>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700,color:"var(--txt)"}}>{title}</span>
            <span style={{fontSize:9,fontFamily:"'JetBrains Mono',monospace",background:bbg,color:bc,border:`1px solid ${bbr}`,borderRadius:20,padding:"2px 9px",fontWeight:700}}>{badge}</span>
          </div>
          <div style={{fontSize:11,color:"var(--txt3)",marginTop:2}}>{sub}</div>
        </div>
      </div>
      {extra}
    </div>
  );
}

function SectionBox({icon,title,sub,children}){
  return(
    <div style={{background:"var(--bg-panel)",border:"1px solid var(--border)",borderRadius:12,padding:"18px 20px"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,paddingBottom:12,borderBottom:"1px solid var(--border)"}}>
        <span style={{fontSize:18}}>{icon}</span>
        <div>
          <div style={{fontSize:14,fontWeight:700,color:"var(--txt)"}}>{title}</div>
          {sub&&<div style={{fontSize:11,color:"var(--txt3)"}}>{sub}</div>}
        </div>
        <span style={{marginLeft:"auto",fontSize:10,fontFamily:"'JetBrains Mono',monospace",fontWeight:700,padding:"3px 10px",borderRadius:20,background:"linear-gradient(90deg,rgba(0,229,192,.12),rgba(59,158,255,.12))",border:"1px solid rgba(0,229,192,.3)",color:"var(--teal)"}}>Guideline-Integrated</span>
      </div>
      {children}
    </div>
  );
}

function FlowChart({nodes}){
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:0}}>
      {nodes.map((n,i)=>{
        if(n.arrow) return <Arrow key={i}/>;
        return <FlowNode key={i} {...n}/>;
      })}
    </div>
  );
}

function DrugTable({rows}){
  const cats=[...new Set(rows.map(r=>r.cat))];
  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      {cats.map(cat=>(
        <div key={cat}>
          <div style={{fontSize:10,color:"var(--txt3)",textTransform:"uppercase",letterSpacing:".07em",fontWeight:700,marginBottom:6,paddingBottom:4,borderBottom:"1px solid var(--border)"}}>{cat}</div>
          {rows.filter(r=>r.cat===cat).map((rx,i)=>(
            <div key={i} style={{background:"var(--bg-up)",border:"1px solid var(--border)",borderRadius:8,padding:"8px 12px",display:"grid",gridTemplateColumns:"170px 1fr auto",gap:10,alignItems:"start",marginBottom:4}}>
              <div>
                <div style={{fontSize:12,fontWeight:600,color:"var(--txt)"}}>{rx.drug}</div>
                {rx.note&&<div style={{fontSize:10,color:"var(--txt3)",marginTop:2}}>{rx.note}</div>}
              </div>
              <div style={{fontSize:12,color:"var(--txt2)",fontFamily:"'JetBrains Mono',monospace",lineHeight:1.4}}>{rx.dose}</div>
              <CORBadge cor={rx.cor}/>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function TimeBanner({targets}){
  return(
    <div style={{display:"flex",gap:8}}>
      {targets.map((t,i)=>(
        <div key={i} style={{flex:1,background:"var(--bg-up)",border:"1px solid var(--border)",borderRadius:8,padding:"8px 12px",display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:16}}>{t.icon}</span>
          <div>
            <div style={{fontSize:10,color:"var(--txt3)"}}>{t.label}</div>
            <div style={{fontSize:14,fontWeight:700,color:t.color||"var(--blue)",fontFamily:"'JetBrains Mono',monospace"}}>{t.target}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  PAGE 1 — ADULT TACHYCARDIA (ACLS 2025)
// ════════════════════════════════════════════════════════════
const TACHY_DRUGS=[
  {cat:"Unstable → Electrical",   drug:"Synchronized Cardioversion",dose:"Narrow/regular: 50–100J · Narrow/irregular (AFib): 120–200J biphasic · Wide/regular: 100J · Wide/irregular: defibrillation dose (unsync)", cor:"I",  loe:"B", note:"Sedate conscious patient first if time permits. Do NOT delay for unstable patient."},
  {cat:"Stable Narrow Regular",   drug:"Vagal Maneuvers",           dose:"Modified Valsalva (recumbent, strain × 15 s, then supine leg raise) — first-line before medications", cor:"I",  loe:"B", note:"Effective in ~50% of SVT."},
  {cat:"Stable Narrow Regular",   drug:"Adenosine",                 dose:"6 mg rapid IV push + 20 mL NS flush; if no conversion: 12 mg × 2", cor:"I",  loe:"B", note:"⚠ Do NOT use for irregular or pre-excited AFib. Can cause transient asystole."},
  {cat:"Stable Narrow Regular",   drug:"Diltiazem (CCB)",           dose:"0.25 mg/kg IV over 2 min (max 25 mg); may repeat 0.35 mg/kg after 15 min → infusion 5–15 mg/h", cor:"I",  loe:"B", note:"Rate control for AFib/flutter. Avoid if EF < 40%."},
  {cat:"Stable Narrow Regular",   drug:"Metoprolol (β-Blocker)",    dose:"2.5–5 mg IV over 2 min; may repeat up to 3 doses",   cor:"I",  loe:"B", note:"Alternative to diltiazem. Avoid in bronchospasm / decompensated HF."},
  {cat:"Stable Wide Regular",     drug:"Procainamide",              dose:"20–50 mg/min IV until arrhythmia suppressed, hypotension, or QRS ↑ > 50%; max 17 mg/kg → maintenance 1–4 mg/min", cor:"IIa",loe:"B", note:"Avoid if prolonged QT or CHF. Preferred for stable monomorphic VT."},
  {cat:"Stable Wide Regular",     drug:"Amiodarone",                dose:"150 mg IV over 10 min; repeat prn → maintenance 1 mg/min × 6 h, then 0.5 mg/min × 18 h", cor:"IIa",loe:"B", note:"Use if procainamide unavailable or contraindicated."},
  {cat:"Stable Wide Regular",     drug:"Sotalol",                   dose:"100 mg (1.5 mg/kg) IV over 5 min",                  cor:"IIb",loe:"B", note:"Do NOT use if prolonged QT, HF, or hypokalemia."},
  {cat:"Torsades de Pointes",     drug:"Magnesium Sulfate",         dose:"1–2 g IV over 5–60 min (loading); maintenance infusion 0.5–1 g/h", cor:"IIb",loe:"C", note:"First-line for TdP or suspected hypomagnesaemia. Also for polymorphic VT + long QT."},
  {cat:"AFib / AFl Rate Control", drug:"Anticoagulation",           dose:"Assess CHA₂DS₂-VASc score. Start anticoagulation if AFib onset unknown or > 48 h (haemodynamic instability = cardiovert emergently regardless)", cor:"I",  loe:"A", note:"DOACs preferred. Bridging or TEE if cardioversion needed."},
];

function TachycardiaPage(){
  const[tab,setTab]=useState("algorithm");
  const TABS=[{id:"algorithm",label:"Algorithm",icon:"🔄"},{id:"drugs",label:"Drug Reference",icon:"💊"},{id:"cardioversion",label:"Cardioversion",icon:"⚡"}];
  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <PageHeader icon="⚡" title="Adult Tachycardia" badge="ACLS 2025" badgeColor="gold" sub="HR > 100 bpm with pulse · Stable vs Unstable assessment · AHA/ACLS 2025 Guideline"/>
      <TimeBanner targets={[
        {icon:"📋",label:"Assess Stability",target:"Immediate",color:"var(--coral)"},
        {icon:"⚡",label:"Cardiovert (Unstable)",target:"< 3 min",color:"var(--gold)"},
        {icon:"💊",label:"Adenosine (SVT)",target:"Rapid IV push",color:"var(--teal)"},
        {icon:"🔍",label:"12-Lead ECG",target:"STAT",color:"var(--blue)"},
      ]}/>
      <div style={{display:"flex",gap:4,background:"var(--bg-panel)",border:"1px solid var(--border)",borderRadius:10,padding:4}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:7,fontSize:12,fontWeight:tab===t.id?700:500,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",whiteSpace:"nowrap",transition:"all .2s",background:tab===t.id?"rgba(245,200,66,.12)":"transparent",border:tab===t.id?"1px solid rgba(245,200,66,.3)":"1px solid transparent",color:tab===t.id?"var(--gold)":"var(--txt3)"}}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>
      <SectionBox icon={TABS.find(t=>t.id===tab)?.icon} title={TABS.find(t=>t.id===tab)?.label+" — Adult Tachycardia with Pulse"} sub="AHA/ACLS 2025 Algorithm">
        {tab==="algorithm"&&<FlowChart nodes={[
          {type:"start",text:"Tachycardia with pulse — HR > 100 bpm (symptomatic usually > 150 bpm)"},
          {arrow:true},
          {type:"action",color:"blue",text:"Initial Assessment",badge:"Immediate",items:["Open/maintain airway · Assist breathing · Supplemental O₂ if SpO₂ < 94%","12-lead ECG — identify rhythm","IV access · BP · SpO₂ · Continuous monitor","Treat reversible causes (H's & T's)"]},
          {arrow:true},
          {type:"decision",text:"Patient haemodynamically STABLE?",branches:[
            {color:"coral",tag:"UNSTABLE",label:"Hypotension · Altered mental status · Signs of shock · Ischaemic chest pain · Acute HF"},
            {color:"teal",tag:"STABLE",label:"Adequate perfusion · No shock · Normal mentation · No ischaemic pain"},
          ]},
          {arrow:true},
          {type:"action",color:"coral",text:"UNSTABLE — Immediate Synchronized Cardioversion",badge:"< 3 min",items:["Sedate conscious patient if time permits (do NOT delay if deteriorating)","Narrow/regular SVT → 50–100 J","Narrow/irregular (AFib) → 120–200 J biphasic","Wide/regular → 100 J","Wide/irregular → defibrillation dose (NOT synchronized — risk of VF)","Re-assess rhythm after each shock"]},
          {arrow:true},
          {type:"decision",text:"QRS Duration?",branches:[
            {color:"blue",tag:"NARROW < 0.12s",label:"Supraventricular origin likely · Regular or Irregular?"},
            {color:"orange",tag:"WIDE ≥ 0.12s",label:"Ventricular origin until proven otherwise · Regular or Irregular?"},
          ]},
          {arrow:true},
          {type:"action",color:"blue",text:"Stable Narrow QRS — Regular Rhythm (SVT)",items:["1️⃣  Vagal maneuvers — modified Valsalva (first-line)","2️⃣  Adenosine 6 mg rapid IV push + NS flush; if no conversion → 12 mg × 2","3️⃣  If persistent: Diltiazem 0.25 mg/kg IV OR Metoprolol 2.5–5 mg IV","Consult cardiology if refractory"]},
          {arrow:true},
          {type:"action",color:"orange",text:"Stable Narrow QRS — Irregular (AFib / AFL / MAT)",items:["Rate control: Diltiazem or Metoprolol","Rhythm control: Amiodarone or electrical cardioversion if < 48 h onset or haemodynamically guided","Anticoagulation: Assess CHA₂DS₂-VASc — DOAC preferred","⚠ Do NOT give adenosine to irregular wide-complex tachycardia (risk VF)"]},
          {arrow:true},
          {type:"action",color:"gold",text:"Stable Wide QRS — Regular (Monomorphic VT suspected)",items:["Expert consultation strongly recommended","Procainamide 20–50 mg/min IV (max 17 mg/kg) OR","Amiodarone 150 mg over 10 min OR Sotalol 100 mg IV","⚠ Avoid adenosine for irregular or polymorphic wide-complex tachycardia"]},
          {arrow:true},
          {type:"action",color:"gold",text:"Torsades de Pointes (polymorphic VT + long QT)",items:["Mg sulphate 1–2 g IV over 5–60 min (loading)","Correct electrolytes (K⁺, Mg²⁺)","Withdraw offending drugs","If unstable → immediate unsynchronised defibrillation"]},
          {arrow:true},
          {type:"outcome",color:"teal",text:"Expert Consultation + Post-Conversion Care",sub:"Identify and treat underlying cause · ECG monitoring · Consider electrophysiology referral · Anticoagulation if indicated"},
        ]}/>}
        {tab==="drugs"&&<DrugTable rows={TACHY_DRUGS}/>}
        {tab==="cardioversion"&&(
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              {[
                {rhythm:"SVT (narrow, regular)",energy:"50–100 J",type:"Sync",color:"var(--blue)"},
                {rhythm:"AFib (narrow, irregular)",energy:"120–200 J biphasic",type:"Sync",color:"var(--blue)"},
                {rhythm:"AFL / SVT (narrow)",energy:"50–100 J",type:"Sync",color:"var(--blue)"},
                {rhythm:"Monomorphic VT (wide, regular)",energy:"100 J",type:"Sync",color:"var(--orange)"},
                {rhythm:"Polymorphic VT / TdP",energy:"Defib dose (200 J biphasic)",type:"UNSYNC",color:"var(--coral)"},
                {rhythm:"VF / Pulseless VT",energy:"200 J biphasic (first shock)",type:"UNSYNC",color:"var(--coral)"},
              ].map((c,i)=>(
                <div key={i} style={{background:"var(--bg-up)",border:"1px solid var(--border)",borderRadius:10,padding:"12px 14px"}}>
                  <div style={{fontSize:11,color:"var(--txt3)",marginBottom:6}}>{c.rhythm}</div>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <div style={{fontSize:18,fontWeight:700,color:c.color,fontFamily:"'JetBrains Mono',monospace"}}>{c.energy}</div>
                    <span style={{fontSize:9,background:c.type==="UNSYNC"?"rgba(255,107,107,.15)":"rgba(59,158,255,.12)",color:c.type==="UNSYNC"?"var(--coral)":"var(--blue)",border:`1px solid ${c.type==="UNSYNC"?"rgba(255,107,107,.4)":"rgba(59,158,255,.3)"}`,borderRadius:20,padding:"2px 8px",fontFamily:"'JetBrains Mono',monospace",fontWeight:700}}>{c.type}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{fontSize:10,color:"var(--txt4)",fontFamily:"'JetBrains Mono',monospace",padding:"10px 12px",background:"var(--bg-card)",borderRadius:8,border:"1px solid var(--border)",lineHeight:1.7}}>
              ⚠ Always sync on R-wave for organized rhythms · Sedate conscious patients before cardioversion if time permits · NEVER sync for polymorphic VT or VF · Confirm synchronization marker on ECG before shock delivery<br/>
              Source: AHA/ACLS 2025 Algorithm — cpr.heart.org
            </div>
          </div>
        )}
      </SectionBox>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  PAGE 2 — ADULT BRADYCARDIA (ACLS 2025)
// ════════════════════════════════════════════════════════════
const BRADY_DRUGS=[
  {cat:"First-Line",    drug:"Atropine",               dose:"1 mg IV/IO bolus; repeat q3–5 min; max 3 mg total",                                          cor:"I",  loe:"B", note:"Blocks vagal nerve → ↑ SA/AV node rate. Ineffective for Mobitz II / 3rd-degree block."},
  {cat:"Second-Line",   drug:"Transcutaneous Pacing",   dose:"Set rate 60–80 bpm; start at 0 mA, ↑ mA until capture; sedate patient before if conscious", cor:"I",  loe:"B", note:"First-line for Mobitz II / 3rd-degree block. Perform IMMEDIATELY — do not wait for atropine in high-degree block."},
  {cat:"Second-Line",   drug:"Dopamine Infusion",        dose:"5–20 mcg/kg/min IV; titrate to heart rate & BP",                                            cor:"IIa",loe:"B", note:"β₁ + α agonist → ↑ HR + CO. Equal alternative to TCP if atropine fails."},
  {cat:"Second-Line",   drug:"Epinephrine Infusion",     dose:"2–10 mcg/min IV; titrate to response",                                                      cor:"IIa",loe:"B", note:"Powerful β/α agonist. Use when dopamine ineffective."},
  {cat:"Specialist",    drug:"Transvenous Pacing",       dose:"Via femoral / subclavian / internal jugular; set rate 60–80 bpm, output 10–20 mA above threshold", cor:"I", loe:"C", note:"Definitive bridge when TCP fails. Expert consultation required."},
  {cat:"Special Cases", drug:"Glucagon",                 dose:"3 mg IV bolus; then 3 mg/h infusion if needed",                                             cor:"IIa",loe:"C", note:"β-blocker OR calcium channel blocker overdose — specific antidote."},
  {cat:"Special Cases", drug:"Calcium Chloride",         dose:"1 g (10 mL of 10%) IV slow push over 10 min",                                              cor:"IIa",loe:"C", note:"Calcium channel blocker overdose or hyperkalemia-induced bradycardia."},
  {cat:"Special Cases", drug:"High-dose Insulin",        dose:"1 U/kg IV bolus then 0.5–1 U/kg/h + D50W",                                                 cor:"IIb",loe:"C", note:"Severe CCB/β-blocker toxicity. Monitor glucose q15–30 min."},
];

function BradycardiaPage(){
  const[tab,setTab]=useState("algorithm");
  const TABS=[{id:"algorithm",label:"Algorithm",icon:"🔄"},{id:"drugs",label:"Drug Reference",icon:"💊"},{id:"causes",label:"H's & T's",icon:"🔍"}];
  const HS_TS=[
    {cat:"H's",items:[["Hypovolaemia","IV fluids, transfusion"],["Hypoxia","O₂, airway management"],["Hydrogen ion (Acidosis)","NaHCO₃, treat cause"],["Hypo/Hyperkalaemia","Correct K⁺; Ca²⁺ for hyperkalaemia"],["Hypothermia","Active re-warming — warm IV fluids, blankets, warmed O₂"]]},
    {cat:"T's",items:[["Tension Pneumothorax","Needle decompression → chest tube"],["Tamponade (cardiac)","Pericardiocentesis / ECHO"],["Toxins","β-blockers, CCBs, digoxin toxicity — specific antidotes"],["Thrombosis (PE / MI)","Thrombolytics / heparin / cath lab"],["Trauma","Haemorrhage control, surgery"]]},
  ];
  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <PageHeader icon="🔻" title="Adult Bradycardia" badge="ACLS 2025" badgeColor="blue" sub="HR < 50 bpm · Symptomatic assessment · AHA/ACLS 2025 Guideline"/>
      <TimeBanner targets={[
        {icon:"📋",label:"Identify Symptoms",target:"Immediate",color:"var(--coral)"},
        {icon:"💊",label:"Atropine 1st dose",target:"< 2 min",color:"var(--teal)"},
        {icon:"🔌",label:"TCP if no response",target:"< 5 min",color:"var(--gold)"},
        {icon:"📡",label:"Transvenous Pacing",target:"If TCP fails",color:"var(--blue)"},
      ]}/>
      <div style={{display:"flex",gap:4,background:"var(--bg-panel)",border:"1px solid var(--border)",borderRadius:10,padding:4}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:7,fontSize:12,fontWeight:tab===t.id?700:500,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",whiteSpace:"nowrap",transition:"all .2s",background:tab===t.id?"rgba(59,158,255,.12)":"transparent",border:tab===t.id?"1px solid rgba(59,158,255,.3)":"1px solid transparent",color:tab===t.id?"var(--blue)":"var(--txt3)"}}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>
      <SectionBox icon={TABS.find(t=>t.id===tab)?.icon} title={TABS.find(t=>t.id===tab)?.label+" — Adult Bradycardia with Pulse"} sub="AHA/ACLS 2025 Algorithm">
        {tab==="algorithm"&&<FlowChart nodes={[
          {type:"start",text:"Bradycardia with pulse — HR typically < 50 bpm"},
          {arrow:true},
          {type:"action",color:"blue",text:"Initial Assessment",badge:"Immediate",items:["Maintain patent airway · Assist breathing · O₂ if SpO₂ < 94%","12-lead ECG — identify block type","IV/IO access · Continuous monitoring","Consider reversible causes (H's & T's)"]},
          {arrow:true},
          {type:"decision",text:"Signs / Symptoms of Haemodynamic Compromise?",branches:[
            {color:"teal",tag:"ADEQUATE PERFUSION",label:"Asymptomatic or mild symptoms\n→ Monitor & observe\n→ Treat underlying cause"},
            {color:"coral",tag:"POOR PERFUSION",label:"Hypotension · Altered mental status\nSigns of shock · Ischaemia\nAcute heart failure"},
          ]},
          {arrow:true},
          {type:"decision",text:"What is the Block Type?",branches:[
            {color:"blue",tag:"1st Degree / Mobitz I",label:"Atropine likely effective\nStart with atropine first"},
            {color:"coral",tag:"Mobitz II / 3rd Degree",label:"Atropine UNLIKELY effective\n→ IMMEDIATE TCP\nDo not delay"},
          ]},
          {arrow:true},
          {type:"action",color:"teal",text:"Atropine — First-Line Treatment",badge:"Mobitz I / Sinus Brady",items:["Atropine 1 mg IV bolus","Repeat q3–5 min if no response","Max total dose 3 mg","⚠ Ineffective for Mobitz II / 3rd-degree — proceed directly to TCP"]},
          {arrow:true},
          {type:"decision",text:"Response to Atropine?",branches:[
            {color:"teal",tag:"RESOLVED",label:"HR ↑ · Symptoms resolved\nMonitor · Treat underlying cause\nConsider specialist referral"},
            {color:"coral",tag:"INADEQUATE",label:"Persistent bradycardia\nPoor perfusion continues"},
          ]},
          {arrow:true},
          {type:"action",color:"orange",text:"Second-Line: TCP + Vasopressor Infusions",items:["Transcutaneous Pacing (TCP) — set 60–80 bpm, ↑ mA until electrical & mechanical capture","AND/OR Dopamine infusion 5–20 mcg/kg/min","OR Epinephrine infusion 2–10 mcg/min","Sedate patient before TCP if haemodynamically able","Expert consultation — cardiology / EP specialist"]},
          {arrow:true},
          {type:"outcome",color:"teal",text:"Transvenous Pacing if Refractory",sub:"Definitive bridge · Central venous access required · EP / Cardiology consultation mandatory · Consider permanent pacemaker evaluation"},
        ]}/>}
        {tab==="drugs"&&<DrugTable rows={BRADY_DRUGS}/>}
        {tab==="causes"&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            {HS_TS.map((group,i)=>(
              <div key={i} style={{background:"var(--bg-up)",border:"1px solid var(--border)",borderRadius:10,padding:"14px 16px"}}>
                <div style={{fontSize:13,fontWeight:700,color:i===0?"var(--blue)":"var(--orange)",marginBottom:12,fontFamily:"'JetBrains Mono',monospace"}}>{group.cat}</div>
                {group.items.map(([cause,tx],j)=>(
                  <div key={j} style={{display:"grid",gridTemplateColumns:"1fr 1.2fr",gap:8,marginBottom:8,paddingBottom:8,borderBottom:j<group.items.length-1?"1px solid var(--border)":"none"}}>
                    <div style={{fontSize:12,fontWeight:600,color:"var(--txt)"}}>{cause}</div>
                    <div style={{fontSize:11,color:"var(--txt3)"}}>{tx}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </SectionBox>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  PAGE 3 — PEDIATRIC ACLS (PALS 2025)
// ════════════════════════════════════════════════════════════
const PALS_DRUGS=[
  {cat:"Cardiac Arrest",drug:"Epinephrine",dose:"0.01 mg/kg IV/IO q3–5 min (0.1 mL/kg of 1:10,000)\nET dose: 0.1 mg/kg (1:1,000) if no IV/IO\nMax single dose: 1 mg",cor:"I",loe:"B",note:"First vasopressor for all pediatric cardiac arrest rhythms."},
  {cat:"Cardiac Arrest",drug:"Amiodarone",dose:"5 mg/kg IV/IO bolus (shockable rhythm — VF/pVT)\nRepeat up to 2× (max 15 mg/kg/day)",cor:"IIb",loe:"B",note:"Refractory VF / pulseless VT. Alternative: Lidocaine."},
  {cat:"Cardiac Arrest",drug:"Lidocaine",dose:"1 mg/kg IV/IO bolus → maintenance 20–50 mcg/kg/min",cor:"IIb",loe:"B",note:"Alternative to amiodarone for VF/pVT."},
  {cat:"Bradycardia",drug:"Atropine",dose:"0.02 mg/kg IV/IO (min 0.1 mg, max 0.5 mg per dose)\nRepeat once if needed · Max total 1 mg",cor:"IIa",loe:"C",note:"For vagally mediated bradycardia / increased vagal tone / heart block."},
  {cat:"Bradycardia",drug:"Epinephrine",dose:"0.01 mg/kg IV/IO q3–5 min (1:10,000 concentration)",cor:"I",loe:"C",note:"Bradycardia with poor perfusion despite oxygenation — CPR indicated if HR < 60 with poor perfusion."},
  {cat:"SVT (Stable)",drug:"Adenosine",dose:"0.1 mg/kg IV/IO rapid push (max 6 mg)\n2nd dose: 0.2 mg/kg (max 12 mg)",cor:"I",loe:"B",note:"Flush immediately with 5–10 mL NS. ECG monitoring essential."},
  {cat:"SVT (Stable)",drug:"Amiodarone (SVT/VT)",dose:"5 mg/kg IV/IO over 20–60 min if perfusing",cor:"IIa",loe:"C",note:"For SVT/VT refractory to other treatments."},
  {cat:"SVT (Stable)",drug:"Procainamide",dose:"15 mg/kg IV/IO over 30–60 min (do NOT use with amiodarone)",cor:"IIa",loe:"C",note:"Alternative to amiodarone. Monitor ECG and BP during infusion."},
];

const PALS_DEFIB=[
  {rhythm:"VF / pVT — 1st shock",energy:"2 J/kg",type:"Async"},
  {rhythm:"VF / pVT — subsequent",energy:"4 J/kg (max 10 J/kg)",type:"Async"},
  {rhythm:"SVT — unstable",energy:"0.5–1 J/kg",type:"Sync"},
  {rhythm:"SVT — repeat shock",energy:"2 J/kg",type:"Sync"},
  {rhythm:"VT with pulse — unstable",energy:"0.5–1 J/kg → 2 J/kg",type:"Sync"},
];

function PediatricsPage(){
  const[tab,setTab]=useState("cardiac");
  const TABS=[{id:"cardiac",label:"Cardiac Arrest",icon:"💔"},{id:"brady",label:"Bradycardia",icon:"🔻"},{id:"tachy",label:"Tachycardia",icon:"⚡"},{id:"drugs",label:"Drug Reference",icon:"💊"},{id:"defib",label:"Defibrillation",icon:"🔌"}];
  const WEIGHTS=[{color:"grey",lbl:"3–5 kg"},{color:"pink",lbl:"6–7 kg"},{color:"red",lbl:"8–9 kg"},{color:"purple",lbl:"10–11 kg"},{color:"yellow",lbl:"12–14 kg"},{color:"white",lbl:"15–18 kg"},{color:"blue",lbl:"19–23 kg"},{color:"orange",lbl:"24–29 kg"},{color:"green",lbl:"30–36 kg"}];
  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <PageHeader icon="👶" title="Pediatric ACLS" badge="PALS 2025" badgeColor="purple" sub="AHA/AAP Pediatric Advanced Life Support · 2025 Guidelines · Weight-based dosing"/>
      <TimeBanner targets={[
        {icon:"💔",label:"Start CPR",target:"Immediately",color:"var(--coral)"},
        {icon:"⚡",label:"1st Defib (VF/pVT)",target:"2 J/kg",color:"var(--gold)"},
        {icon:"💉",label:"Epinephrine",target:"0.01 mg/kg q3–5min",color:"var(--teal)"},
        {icon:"📋",label:"Vascular Access",target:"IO if no IV < 90s",color:"var(--blue)"},
      ]}/>
      <div style={{display:"flex",gap:4,overflowX:"auto",background:"var(--bg-panel)",border:"1px solid var(--border)",borderRadius:10,padding:4}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:7,fontSize:12,fontWeight:tab===t.id?700:500,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",whiteSpace:"nowrap",flexShrink:0,transition:"all .2s",background:tab===t.id?"rgba(155,109,255,.12)":"transparent",border:tab===t.id?"1px solid rgba(155,109,255,.3)":"1px solid transparent",color:tab===t.id?"var(--purple)":"var(--txt3)"}}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>
      <SectionBox icon={TABS.find(t=>t.id===tab)?.icon} title={`${TABS.find(t=>t.id===tab)?.label} — Pediatric ACLS`} sub="AHA/AAP PALS 2025 · All doses weight-based">
        {tab==="cardiac"&&<FlowChart nodes={[
          {type:"start",text:"Paediatric cardiac arrest — no pulse or not breathing normally"},
          {arrow:true},
          {type:"action",color:"coral",text:"High-Quality CPR",badge:"Start immediately",items:["Rate: 100–120/min · Depth: ≥ ⅓ AP diameter (≈4 cm infant, ≈5 cm child)","Allow full chest recoil · Minimise interruptions (CCF ≥ 60%)","1 rescuer: 30:2 ratio · 2 rescuers: 15:2 ratio","IO access if IV not established within 90 sec"]},
          {arrow:true},
          {type:"action",color:"blue",text:"Attach monitor/defibrillator — Check rhythm",badge:"2 min CPR cycles",items:[]},
          {arrow:true},
          {type:"decision",text:"Rhythm Shockable?",branches:[
            {color:"coral",tag:"SHOCKABLE",label:"VF · Pulseless VT\n→ Defibrillate 2 J/kg\nResume CPR immediately"},
            {color:"blue",tag:"NON-SHOCKABLE",label:"Asystole · PEA\n→ CPR + Epinephrine\n0.01 mg/kg q3–5 min"},
          ]},
          {arrow:true},
          {type:"action",color:"coral",text:"Shockable Rhythm — VF / pVT",items:["Shock 2 J/kg → resume CPR for 2 min → check rhythm","If persistent: shock 4 J/kg → CPR → Epinephrine 0.01 mg/kg IV/IO","If persistent: shock 4 J/kg → CPR → Amiodarone 5 mg/kg OR Lidocaine 1 mg/kg","Escalate defibrillation to max 10 J/kg","Identify and treat reversible causes (H's & T's)"]},
          {arrow:true},
          {type:"action",color:"blue",text:"Non-Shockable — Asystole / PEA",items:["CPR continuously · Check rhythm every 2 min","Epinephrine 0.01 mg/kg IV/IO q3–5 min","Advanced airway: ETT or supraglottic (1 breath/2–3 sec = 20–30/min)","Identify and treat reversible causes","Consider ECPR if reversible cause or in-hospital arrest"]},
          {arrow:true},
          {type:"outcome",color:"teal",text:"ROSC → Post-Cardiac Arrest Care",sub:"Target SpO₂ 94–99% · Avoid hyperthermia · Targeted Temperature Management · Treat seizures · PICU admission"},
        ]}/>}
        {tab==="brady"&&<FlowChart nodes={[
          {type:"start",text:"Paediatric bradycardia — HR < 60 bpm with poor perfusion"},
          {arrow:true},
          {type:"action",color:"blue",text:"Support ABCs",badge:"Immediate",items:["Maintain airway · Positive pressure ventilation if inadequate breathing","O₂ — target SpO₂ ≥ 94%","Cardiac monitor · IV/IO access"]},
          {arrow:true},
          {type:"decision",text:"Cardiopulmonary compromise?",branches:[
            {color:"teal",tag:"ADEQUATE",label:"Observe & monitor\nConsult paediatric cardiology\nTreat underlying cause"},
            {color:"coral",tag:"COMPROMISED",label:"Hypotension · Altered consciousness\nSigns of shock despite oxygenation"},
          ]},
          {arrow:true},
          {type:"decision",text:"HR < 60 despite adequate oxygenation & ventilation?",branches:[
            {color:"coral",tag:"YES",label:"Begin CPR\n2-rescuer 15:2 ratio\nHigh-quality compressions"},
            {color:"teal",tag:"NO — HR ≥ 60",label:"Observe · Support ABCs\nTreat reversible causes\nConsult paediatric cardiology"},
          ]},
          {arrow:true},
          {type:"action",color:"orange",text:"Medications — Bradycardia",items:["Epinephrine 0.01 mg/kg IV/IO q3–5 min (preferred)","Atropine 0.02 mg/kg IV/IO (min 0.1 mg, max 0.5 mg)","Transcutaneous pacing for refractory cases"]},
          {arrow:true},
          {type:"outcome",color:"teal",text:"ROSC / Haemodynamic stability achieved",sub:"Paediatric cardiology referral · Consider permanent pacemaker if high-degree AV block · Treat reversible causes"},
        ]}/>}
        {tab==="tachy"&&<FlowChart nodes={[
          {type:"start",text:"Paediatric tachycardia — HR > age-appropriate normal with poor perfusion"},
          {arrow:true},
          {type:"action",color:"blue",text:"Initial Assessment",items:["IV/IO access · O₂ · Continuous monitoring","12-lead ECG if available","Assess pulse · Perfusion · Mental status · BP"]},
          {arrow:true},
          {type:"decision",text:"Haemodynamically stable?",branches:[
            {color:"coral",tag:"UNSTABLE",label:"Altered mental status\nHypotension · Poor perfusion\nSigns of shock"},
            {color:"teal",tag:"STABLE",label:"Adequate perfusion\nConscious & alert"},
          ]},
          {arrow:true},
          {type:"action",color:"coral",text:"UNSTABLE — Synchronized Cardioversion",items:["SVT: 0.5–1 J/kg → 2 J/kg if no conversion","VT with pulse: 0.5–1 J/kg → 2 J/kg","Sedate if conscious and time allows","Immediate: do NOT delay in deteriorating patient"]},
          {arrow:true},
          {type:"decision",text:"QRS Duration?",branches:[
            {color:"blue",tag:"NARROW < 0.09s",label:"SVT likely\nVagal maneuvers first"},
            {color:"orange",tag:"WIDE ≥ 0.09s",label:"VT until proven otherwise\nExpert consultation"},
          ]},
          {arrow:true},
          {type:"action",color:"blue",text:"Stable SVT — Narrow QRS",items:["Vagal maneuvers (ice to face in infants; Valsalva in older children)","Adenosine 0.1 mg/kg IV rapid push (max 6 mg); 2nd dose 0.2 mg/kg (max 12 mg)","If refractory: Amiodarone 5 mg/kg over 20–60 min OR Procainamide 15 mg/kg over 30–60 min","Consult paediatric cardiology"]},
          {arrow:true},
          {type:"action",color:"orange",text:"Stable VT — Wide QRS",items:["Expert consultation mandatory","Amiodarone 5 mg/kg IV over 20–60 min","OR Procainamide 15 mg/kg IV over 30–60 min (not with amiodarone)","Do NOT give adenosine for irregular wide-complex tachycardia"]},
          {arrow:true},
          {type:"outcome",color:"teal",text:"Conversion to Sinus Rhythm",sub:"Identify and treat underlying cause · Paediatric cardiology referral · Consider electrophysiology for recurrent SVT"},
        ]}/>}
        {tab==="drugs"&&<DrugTable rows={PALS_DRUGS}/>}
        {tab==="defib"&&(
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8,marginBottom:4}}>
              {PALS_DEFIB.map((d,i)=>(
                <div key={i} style={{background:"var(--bg-up)",border:"1px solid var(--border)",borderRadius:10,padding:"10px 12px",textAlign:"center"}}>
                  <div style={{fontSize:10,color:"var(--txt3)",marginBottom:6,lineHeight:1.3}}>{d.rhythm}</div>
                  <div style={{fontSize:15,fontWeight:700,color:"var(--gold)",fontFamily:"'JetBrains Mono',monospace",marginBottom:5}}>{d.energy}</div>
                  <span style={{fontSize:9,background:d.type==="Sync"?"rgba(59,158,255,.12)":"rgba(255,107,107,.12)",color:d.type==="Sync"?"var(--blue)":"var(--coral)",border:`1px solid ${d.type==="Sync"?"rgba(59,158,255,.3)":"rgba(255,107,107,.3)"}`,borderRadius:20,padding:"2px 7px",fontFamily:"'JetBrains Mono',monospace",fontWeight:700}}>{d.type}</span>
                </div>
              ))}
            </div>
            <div style={{background:"var(--bg-up)",border:"1px solid rgba(155,109,255,.3)",borderRadius:10,padding:"14px 16px"}}>
              <div style={{fontSize:11,fontWeight:700,color:"var(--purple)",marginBottom:10}}>Broselow Tape Color Bands (Weight Estimation)</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {WEIGHTS.map((w,i)=>(
                  <div key={i} style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:8,padding:"6px 10px",textAlign:"center"}}>
                    <div style={{fontSize:10,fontWeight:600,color:"var(--txt)",fontFamily:"'JetBrains Mono',monospace"}}>{w.color.toUpperCase()}</div>
                    <div style={{fontSize:9,color:"var(--txt3)",marginTop:2}}>{w.lbl}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{fontSize:10,color:"var(--txt4)",fontFamily:"'JetBrains Mono',monospace",padding:"10px 12px",background:"var(--bg-card)",borderRadius:8,border:"1px solid var(--border)",lineHeight:1.7}}>
              Source: AHA/AAP PALS 2025 Guidelines · cpr.heart.org · All doses WEIGHT-BASED · Use Broselow tape for dose estimation · ⚠ Double-check all weight-based calculations
            </div>
          </div>
        )}
      </SectionBox>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  PAGE 4 — CARDIAC ARREST IN PREGNANCY (AHA 2020)
// ════════════════════════════════════════════════════════════
const PREGNANCY_ABCDEFGH=[
  {letter:"A",label:"Anaesthetic complications",detail:"Local anaesthetic systemic toxicity, failed intubation, high spinal, aspiration — early call to anaesthesiology"},
  {letter:"B",label:"Bleeding",detail:"Haemorrhage, DIC, placenta praevia/abruption, uterine rupture, postpartum haemorrhage"},
  {letter:"C",label:"Cardiovascular",detail:"MI, aortic dissection, peripartum cardiomyopathy, congenital heart disease, arrhythmia"},
  {letter:"D",label:"Drugs",detail:"Magnesium toxicity (give Ca²⁺ antidote), oxytocin bolus, insulin, opioid toxicity"},
  {letter:"E",label:"Embolic",detail:"Pulmonary embolism (massive), amniotic fluid embolism — most common non-obstetric cause"},
  {letter:"F",label:"Fever / sepsis",detail:"Chorioamnionitis, pyelonephritis, septic abortion, Group A Strep — early antibiotics, source control"},
  {letter:"G",label:"General H's & T's",detail:"Standard reversible causes: Hypovolaemia, Hypoxia, Hypo/Hyperkalemia, Hypothermia, Tension PTX, Tamponade, Thrombosis, Toxins"},
  {letter:"H",label:"Hypertension / eclampsia",detail:"Severe-range BP, eclamptic seizures, HELLP syndrome — IV MgSO₄, antihypertensives, expedite delivery"},
];

function PregnancyPage(){
  const[tab,setTab]=useState("algorithm");
  const[gestAge,setGestAge]=useState("");const[rosc,setROSC]=useState(false);const[minutes,setMinutes]=useState("");
  const TABS=[{id:"algorithm",label:"Algorithm",icon:"🔄"},{id:"checklist",label:"Concurrent Actions",icon:"✅"},{id:"causes",label:"ABCDEFGH Causes",icon:"🔍"},{id:"pmcd",label:"PMCD Decision",icon:"⚕"}];
  const gestNum=parseFloat(gestAge)||0;const pmcdIndicated=gestNum>=20;const mins=parseFloat(minutes)||0;const pmcdUrgent=mins>=4;
  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <PageHeader icon="🤰" title="Cardiac Arrest in Pregnancy" badge="AHA 2020" badgeColor="purple" sub="In-hospital ACLS algorithm · Maternal resuscitation + Perimortem Caesarean Delivery · AHA 2020 Scientific Statement"/>
      <div style={{background:"rgba(155,109,255,.08)",border:"1px solid rgba(155,109,255,.3)",borderRadius:10,padding:"10px 16px",display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:20}}>⚠️</span>
        <div style={{fontSize:12,color:"var(--txt2)",lineHeight:1.5}}>
          <strong style={{color:"var(--purple)"}}>Dual-patient emergency.</strong> Standard ACLS applies with critical modifications. Simultaneous maternal + obstetric interventions required from minute 0. Assemble maternal cardiac arrest team AND neonatal team immediately.
        </div>
      </div>
      <TimeBanner targets={[
        {icon:"🔄",label:"CPR + LUD",target:"Immediately",color:"var(--coral)"},
        {icon:"✈️",label:"IV above diaphragm",target:"0–2 min",color:"var(--orange)"},
        {icon:"🫁",label:"Advanced airway",target:"Earliest opportunity",color:"var(--gold)"},
        {icon:"🔪",label:"PMCD if no ROSC",target:"By 5 min",color:"var(--purple)"},
      ]}/>
      <div style={{display:"flex",gap:4,overflowX:"auto",background:"var(--bg-panel)",border:"1px solid var(--border)",borderRadius:10,padding:4}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:7,fontSize:12,fontWeight:tab===t.id?700:500,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",whiteSpace:"nowrap",flexShrink:0,transition:"all .2s",background:tab===t.id?"rgba(155,109,255,.12)":"transparent",border:tab===t.id?"1px solid rgba(155,109,255,.3)":"1px solid transparent",color:tab===t.id?"var(--purple)":"var(--txt3)"}}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>
      <SectionBox icon={TABS.find(t=>t.id===tab)?.icon} title={`${TABS.find(t=>t.id===tab)?.label} — Cardiac Arrest in Pregnancy`} sub="AHA 2020 In-Hospital Algorithm">
        {tab==="algorithm"&&<FlowChart nodes={[
          {type:"start",text:"Pregnant patient — cardiac arrest · No pulse · Call maternal cardiac arrest team + neonatal team STAT"},
          {arrow:true},
          {type:"action",color:"purple",text:"Immediately — Start BLS/ACLS + Obstetric Interventions SIMULTANEOUSLY",badge:"Time 0",items:["HIGH-QUALITY CPR — compressions slightly higher on sternum (diaphragm elevated)","Manual Left Uterine Displacement (LUD) — continuous throughout; one rescuer dedicated","100% O₂ — most experienced provider manages airway; early intubation (difficult airway common)","IV access ABOVE diaphragm (arm/central line) — aortocaval compression impairs lower extremity IV","Defibrillate per standard ACLS — same energy doses as non-pregnant","Epinephrine 1 mg IV/IO q3–5 min (preferred over vasopressin)"]},
          {arrow:true},
          {type:"action",color:"orange",text:"Special Obstetric Interventions",items:["If on IV Magnesium sulphate → STOP infusion immediately + give Calcium chloride 1 g IV (antidote)","Remove fetal monitors (do NOT delay resuscitation for monitoring)","Place patient supine — NOT tilted (LUD achieves aortocaval relief without compromising compressions)","Smaller ETT may be needed (airway oedema in pregnancy)","Waveform capnography to confirm ETT placement + monitor CPR quality"]},
          {arrow:true},
          {type:"decision",text:"ROSC achieved within 4 minutes of arrest?",branches:[
            {color:"teal",tag:"ROSC ACHIEVED",label:"Continue maternal stabilisation\nFoetal monitoring\nICU / obstetric care\nAddress arrest aetiology"},
            {color:"coral",tag:"NO ROSC by 4 min",label:"Prepare PMCD NOW\nGoal: deliver by 5 min\nIf uterus at/above umbilicus\n(≥ 20 weeks gestation)"},
          ]},
          {arrow:true},
          {type:"action",color:"coral",text:"Perimortem Caesarean Delivery (PMCD) — Resuscitative Hysterotomy",badge:"By 5 min from arrest",items:["Do NOT delay to transfer to OR — perform at bedside","Vertical midline incision is fastest — do NOT close until ROSC stable","Delivers fetus → relieves aortocaval compression → dramatically ↑ venous return → ↑ CPR efficacy","Neonatal team present for resuscitation","Continue ACLS during and after PMCD","PMCD improves maternal outcomes even if fetus is not viable"]},
          {arrow:true},
          {type:"outcome",color:"teal",text:"Post-ROSC Care — Maternal + Foetal",sub:"ICU admission · Targeted Temperature Management · Haemodynamic support · Treat arrest aetiology · Neonatal care · Obstetric/MFM consultation"},
        ]}/>}
        {tab==="checklist"&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            {[
              {title:"🏥 Maternal Team Actions",color:"var(--teal)",items:["High-quality CPR (100–120/min, adequate depth)","Airway management (most experienced provider)","100% O₂ — 1 breath/6 sec once advanced airway placed","IV/IO above diaphragm","Defibrillation (same doses as non-pregnant)","Epinephrine 1 mg IV q3–5 min (not vasopressin)","Treat reversible causes (ABCDEFGH)","Stop Mg²⁺ → give Ca²⁺ if on magnesium","Waveform capnography for ETT confirmation"]},
              {title:"🤰 Obstetric Team Actions",color:"var(--purple)",items:["Manual Left Uterine Displacement — continuous throughout","Detach fetal monitors immediately","Document gestational age / fundal height","Prepare perimortem caesarean delivery kit","PMCD if no ROSC by 4 min (fundus ≥ umbilicus)","Perform PMCD at bedside — do NOT transfer","Oxytocin + uterotonic agents ready post-delivery","Neonatal team briefed and present","Assess for pregnancy-related aetiology (AFE, eclampsia, haemorrhage)"]},
            ].map((section,i)=>(
              <div key={i} style={{background:"var(--bg-up)",border:"1px solid var(--border)",borderRadius:10,padding:"14px 16px"}}>
                <div style={{fontSize:12,fontWeight:700,color:section.color,marginBottom:10}}>{section.title}</div>
                {section.items.map((item,j)=>(
                  <div key={j} style={{display:"flex",alignItems:"flex-start",gap:8,marginBottom:7,fontSize:12,color:"var(--txt2)"}}>
                    <span style={{color:section.color,flexShrink:0,marginTop:1}}>▸</span>{item}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
        {tab==="causes"&&(
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            <div style={{fontSize:11,color:"var(--txt3)",marginBottom:4}}>Maternal cardiac arrest aetiology mnemonic — <span style={{color:"var(--purple)",fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}>ABCDEFGH</span></div>
            {PREGNANCY_ABCDEFGH.map((c,i)=>(
              <div key={i} style={{display:"grid",gridTemplateColumns:"36px 160px 1fr",gap:12,alignItems:"center",background:"var(--bg-up)",border:"1px solid var(--border)",borderRadius:8,padding:"10px 14px"}}>
                <div style={{width:32,height:32,borderRadius:8,background:"rgba(155,109,255,.15)",border:"1px solid rgba(155,109,255,.3)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'JetBrains Mono',monospace",fontSize:16,fontWeight:700,color:"var(--purple)"}}>{c.letter}</div>
                <div style={{fontSize:12,fontWeight:600,color:"var(--txt)"}}>{c.label}</div>
                <div style={{fontSize:11,color:"var(--txt3)",lineHeight:1.4}}>{c.detail}</div>
              </div>
            ))}
          </div>
        )}
        {tab==="pmcd"&&(
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
              <div>
                <label style={{fontSize:9,color:"var(--txt3)",textTransform:"uppercase",letterSpacing:".06em",fontWeight:700,display:"block",marginBottom:4}}>Gestational Age (weeks)</label>
                <input type="number" value={gestAge} onChange={e=>setGestAge(e.target.value)} placeholder="e.g. 28"
                  style={{width:"100%",background:"var(--bg-up)",border:"1px solid var(--border)",borderRadius:6,padding:"7px 10px",color:"var(--txt)",fontFamily:"'DM Sans',sans-serif",fontSize:13,outline:"none"}}/>
                {gestAge&&<div style={{marginTop:5,fontSize:11,fontFamily:"'JetBrains Mono',monospace",color:pmcdIndicated?"var(--coral)":"var(--teal)"}}>
                  {pmcdIndicated?"⚠ PMCD may be indicated (≥ 20 wk)":"✓ PMCD not indicated (< 20 wk)"}
                </div>}
              </div>
              <div>
                <label style={{fontSize:9,color:"var(--txt3)",textTransform:"uppercase",letterSpacing:".06em",fontWeight:700,display:"block",marginBottom:4}}>Minutes since arrest</label>
                <input type="number" value={minutes} onChange={e=>setMinutes(e.target.value)} placeholder="Enter minutes…"
                  style={{width:"100%",background:"var(--bg-up)",border:`1px solid ${pmcdUrgent&&minutes?"var(--coral)":"var(--border)"}`,borderRadius:6,padding:"7px 10px",color:"var(--txt)",fontFamily:"'DM Sans',sans-serif",fontSize:13,outline:"none"}}/>
                {minutes&&<div style={{marginTop:5,fontSize:11,fontFamily:"'JetBrains Mono',monospace",color:pmcdUrgent?"var(--coral)":"var(--gold)"}}>
                  {pmcdUrgent?"🚨 PERFORM PMCD NOW":"⏳ < 4 min — continue ACLS"}
                </div>}
              </div>
              <div style={{display:"flex",alignItems:"flex-end",paddingBottom:2}}>
                <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:12,color:"var(--txt2)"}}>
                  <input type="checkbox" checked={rosc} onChange={e=>setROSC(e.target.checked)} style={{width:16,height:16,accentColor:"var(--teal)",cursor:"pointer"}}/>
                  ROSC achieved
                </label>
              </div>
            </div>
            {(gestAge||minutes)&&(
              <div style={{borderRadius:12,padding:"14px 18px",background:rosc?"rgba(0,229,192,.08)":pmcdIndicated&&pmcdUrgent?"rgba(255,107,107,.1)":pmcdIndicated?"rgba(245,200,66,.08)":"rgba(0,229,192,.08)",border:`1.5px solid ${rosc?"rgba(0,229,192,.4)":pmcdIndicated&&pmcdUrgent?"rgba(255,107,107,.4)":pmcdIndicated?"rgba(245,200,66,.3)":"rgba(0,229,192,.35)"}`}}>
                <div style={{fontSize:18,fontWeight:700,color:rosc?"var(--teal)":pmcdIndicated&&pmcdUrgent?"var(--coral)":pmcdIndicated?"var(--gold)":"var(--teal)",fontFamily:"'JetBrains Mono',monospace",marginBottom:8}}>
                  {rosc?"✅ ROSC ACHIEVED":pmcdIndicated&&pmcdUrgent?"🚨 PMCD INDICATED — ACT NOW":pmcdIndicated?"⚠ PMCD ON STANDBY":"✓ PMCD NOT INDICATED"}
                </div>
                <div style={{fontSize:12,color:"var(--txt2)",lineHeight:1.6}}>
                  {rosc?"ROSC achieved. Continue maternal stabilisation, foetal monitoring, ICU admission. Address underlying arrest aetiology."
                  :pmcdIndicated&&pmcdUrgent?`No ROSC at ${minutes} minutes. Gestational age ${gestAge} weeks (≥ 20 wks). PERFORM PERIMORTEM CAESAREAN DELIVERY IMMEDIATELY. Do NOT transfer to OR — perform at bedside. Continue CPR during and after. Neonatal team must be present.`
                  :pmcdIndicated?`Gestational age ${gestAge} weeks — PMCD is indicated if no ROSC. Continue ACLS. Prepare PMCD equipment now. If no ROSC by 4 min, begin PMCD — goal delivery by 5 min.`
                  :`Gestational age ${gestAge} weeks (< 20 wks) — foetal delivery unlikely to improve maternal haemodynamics. Focus on standard ACLS + identify and treat reversible causes.`}
                </div>
              </div>
            )}
            <div style={{background:"var(--bg-up)",border:"1px solid var(--border)",borderRadius:10,padding:"14px 16px"}}>
              <div style={{fontSize:12,fontWeight:700,color:"var(--purple)",marginBottom:10}}>PMCD Procedural Notes — Resuscitative Hysterotomy</div>
              {["Vertical midline incision (fastest access — no need to close until haemodynamically stable)","No need for sterile field preparation — speed is paramount","Do NOT wait for surgical consent in cardiac arrest","Continue CPR during procedure — compressions must not stop","Deliver fetus + placenta → relieves aortocaval compression → ↑ venous return dramatically","Uterotonic agents (oxytocin 10–40 units/500 mL NS) post-delivery to prevent PPH","Neonatal resuscitation team manages infant immediately after delivery","PMCD improves maternal survival even if fetus is not viable (aortocaval relief benefit)"].map((note,i)=>(
                <div key={i} style={{display:"flex",alignItems:"flex-start",gap:8,marginBottom:7,fontSize:12,color:"var(--txt2)"}}>
                  <span style={{color:"var(--purple)",flexShrink:0,marginTop:1}}>{i+1}.</span>{note}
                </div>
              ))}
            </div>
            <div style={{fontSize:10,color:"var(--txt4)",fontFamily:"'JetBrains Mono',monospace",padding:"10px 12px",background:"var(--bg-card)",borderRadius:8,border:"1px solid var(--border)",lineHeight:1.7}}>
              Reference: AHA 2020 Scientific Statement on Maternal Resuscitation · Circulation. 2015;132:1747-1773<br/>
              ⚠ Clinical decision support only. Requires immediate senior obstetric + anaesthetic + resuscitation team involvement.
            </div>
          </div>
        )}
      </SectionBox>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  PAGE 5 — ACS (preserved from original)
// ════════════════════════════════════════════════════════════
const TNK_ABSOLUTE=[{id:"a1",label:"Any prior intracranial haemorrhage (ICH)"},{id:"a2",label:"Known structural cerebrovascular lesion (AVM / aneurysm)"},{id:"a3",label:"Known intracranial malignancy (primary or metastatic)"},{id:"a4",label:"Ischaemic stroke within 3 months"},{id:"a5",label:"Suspected aortic dissection"},{id:"a6",label:"Active bleeding / bleeding diathesis (excluding menses)"},{id:"a7",label:"Significant closed-head / facial trauma within 3 months"},{id:"a8",label:"Intracranial or intraspinal surgery within 2 months"},{id:"a9",label:"Severe uncontrolled HTN (SBP > 180 / DBP > 110) unresponsive to therapy"}];
const TNK_RELATIVE=[{id:"r1",label:"History of chronic, severe, poorly controlled hypertension"},{id:"r2",label:"BP on presentation SBP > 180 or DBP > 110 (responding to Rx)"},{id:"r3",label:"History of prior ischaemic stroke > 3 months ago"},{id:"r4",label:"Dementia or known intracranial pathology not covered by absolute CIs"},{id:"r5",label:"Traumatic or prolonged CPR (> 10 min) within 3 weeks"},{id:"r6",label:"Major surgery within 3 weeks"},{id:"r7",label:"Recent (2–4 weeks) internal bleeding (GI / GU)"},{id:"r8",label:"Non-compressible vascular punctures"},{id:"r9",label:"Active peptic ulcer disease"},{id:"r10",label:"Oral anticoagulant therapy (INR > 1.7)"},{id:"r11",label:"Pregnancy"},{id:"r12",label:"Age > 75 years (dose-reduce)"},{id:"r13",label:"Weight < 60 kg"}];
const TNK_DOSING=[{weight:"< 60 kg",dose:"30 mg",vol:"6 mL"},{weight:"60–<70 kg",dose:"35 mg",vol:"7 mL"},{weight:"70–<80 kg",dose:"40 mg",vol:"8 mL"},{weight:"80–<90 kg",dose:"45 mg",vol:"9 mL"},{weight:"≥ 90 kg",dose:"50 mg",vol:"10 mL"}];
const STEMI_RX=[{cat:"Antiplatelet",drug:"Aspirin (ASA)",dose:"324 mg PO (chewed) loading dose — STAT",cor:"I",loe:"A",note:"Give immediately unless true allergy."},{cat:"Antiplatelet",drug:"Ticagrelor",dose:"180 mg PO load → 90 mg BID",cor:"I",loe:"B",note:"Preferred P2Y₁₂ inhibitor."},{cat:"Antiplatelet",drug:"Prasugrel",dose:"60 mg PO load → 10 mg daily",cor:"I",loe:"B",note:"No prior TIA/stroke."},{cat:"Anticoagulation",drug:"UFH",dose:"60 U/kg IV (max 4,000 U) → 12 U/kg/h",cor:"I",loe:"C",note:"Standard for primary PCI."},{cat:"Anticoagulation",drug:"Bivalirudin",dose:"0.75 mg/kg IV → 1.75 mg/kg/h",cor:"IIa",loe:"A",note:"Less bleeding than UFH."},{cat:"Reperfusion",drug:"Primary PCI",dose:"Door-to-balloon ≤ 90 min / ≤ 120 min (transfer)",cor:"I",loe:"A",note:"Gold standard."},{cat:"Reperfusion",drug:"TNK (Tenecteplase)",dose:"Weight-based single IV bolus — see TNK tab",cor:"I",loe:"A",note:"If PCI > 120 min. Needle ≤ 30 min."},{cat:"Adjunct",drug:"β-Blocker (Metoprolol)",dose:"25–50 mg PO q6–12h",cor:"I",loe:"A",note:"Start within 24 h if no CI."},{cat:"Adjunct",drug:"High-Intensity Statin",dose:"Atorvastatin 80 mg PO STAT",cor:"I",loe:"A",note:"Regardless of baseline LDL."},{cat:"Adjunct",drug:"ACE-I / ARB",dose:"Lisinopril 2.5–5 mg PO within 24 h",cor:"I",loe:"A",note:"EF < 40%, HF, HTN, DM."}];
const NSTEMI_RX=[{cat:"Antiplatelet",drug:"Aspirin",dose:"324 mg PO chewed — STAT",cor:"I",loe:"A",note:""},{cat:"Antiplatelet",drug:"Ticagrelor",dose:"180 mg PO load → 90 mg BID",cor:"I",loe:"B",note:"Preferred unless OAC."},{cat:"Anticoagulation",drug:"Enoxaparin",dose:"1 mg/kg SQ BID",cor:"I",loe:"A",note:"Preferred LMWH."},{cat:"Anticoagulation",drug:"Fondaparinux",dose:"2.5 mg SQ daily",cor:"I",loe:"B",note:"High bleed risk."},{cat:"Reperfusion",drug:"Urgent PCI (< 2 h)",dose:"Refractory ischaemia / haemodynamic instability / cardiogenic shock",cor:"I",loe:"B",note:"IMMEDIATE."},{cat:"Reperfusion",drug:"Early Invasive (< 24 h)",dose:"GRACE > 140, new STD, elevated hs-cTn",cor:"I",loe:"A",note:"High-risk."},{cat:"Adjunct",drug:"High-Intensity Statin",dose:"Atorvastatin 80 mg PO STAT",cor:"I",loe:"A",note:"Do not wait for lipids."},{cat:"Adjunct",drug:"ACE-I / ARB",dose:"Start before discharge",cor:"I",loe:"A",note:"EF < 40%, DM, HTN."}];
const STEMI_WORKUP=[{icon:"⚡",time:"0 min",label:"12-Lead ECG",detail:"Obtain & interpret within 10 min. Right-sided leads V3R–V4R for RV MI.",class1:true},{icon:"🧬",time:"0 min",label:"High-Sensitivity Troponin",detail:"0h + 1–3h serial draws.",class1:true},{icon:"🩸",time:"0 min",label:"Labs — STAT Panel",detail:"CBC, CMP, PT/INR, aPTT, BMP, LFTs, T&S.",class1:true},{icon:"📷",time:"0 min",label:"Portable CXR",detail:"Cardiomegaly, pulmonary oedema, wide mediastinum.",class1:true},{icon:"🔊",time:"ASAP",label:"Bedside Echo (POCUS)",detail:"LV function, wall motion, effusion, tamponade.",class1:false},{icon:"💉",time:"0 min",label:"IV Access × 2 + Monitoring",detail:"Continuous monitoring, SpO₂, BP q5 min.",class1:true}];

function TNKChecker(){
  const[abs,setAbs]=useState({});const[rel,setRel]=useState({});const[weight,setWeight]=useState("");const[over75,setOver75]=useState(false);const[pciTime,setPciTime]=useState("");
  const absCount=Object.values(abs).filter(Boolean).length;const relCount=Object.values(rel).filter(Boolean).length;const pciMins=parseInt(pciTime)||0;const pciDelay=pciMins>120;
  const wt=parseFloat(weight);const doseRow=!isNaN(wt)&&wt>0?(wt<60?TNK_DOSING[0]:wt<70?TNK_DOSING[1]:wt<80?TNK_DOSING[2]:wt<90?TNK_DOSING[3]:TNK_DOSING[4]):null;
  let rec="UNDETERMINED",recCol="var(--txt3)",recBg="rgba(74,106,138,.15)",recBr="rgba(74,106,138,.3)",recIcon="❓",recDetail="Complete checklist and enter estimated PCI time.";
  if(absCount>0){rec="CONTRAINDICATED";recCol="var(--coral)";recBg="rgba(255,107,107,.1)";recBr="rgba(255,107,107,.4)";recIcon="🚫";recDetail=`${absCount} absolute CI(s). TNK CONTRAINDICATED. Pursue PCI regardless of time.`;}
  else if(!pciTime){rec="AWAITING DATA";recIcon="⏳";recDetail="Enter estimated minutes to PCI.";}
  else if(!pciDelay){rec="PCI PREFERRED";recCol="var(--teal)";recBg="rgba(0,229,192,.08)";recBr="rgba(0,229,192,.35)";recIcon="🏥";recDetail=`PCI time: ${pciMins} min (≤ 120 min). Primary PCI PREFERRED. Do NOT give TNK.`;}
  else if(relCount>=3){rec="HIGH CAUTION";recCol="var(--gold)";recBg="rgba(245,200,66,.1)";recBr="rgba(245,200,66,.4)";recIcon="⚠️";recDetail=`PCI > 120 min AND ${relCount} relative CIs. Senior/cardiology decision required.`;}
  else{rec="TNK INDICATED";recCol="var(--teal)";recBg="rgba(0,229,192,.12)";recBr="rgba(0,229,192,.5)";recIcon="✅";const ds=doseRow?` Dose: ${doseRow.dose} (${doseRow.vol}).${over75?" ⚠ Age > 75 — consider 50% dose reduction.":""}`: " Enter weight for dose.";recDetail=`No absolute CIs. PCI unavailable (${pciMins} min > 120 min). ${relCount>0?relCount+" relative CI(s). ":""}TNK INDICATED. Door-to-needle ≤ 30 min.${ds}`;}
  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{background:recBg,border:`1.5px solid ${recBr}`,borderRadius:12,padding:"13px 16px"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:7}}><span style={{fontSize:20}}>{recIcon}</span><div><div style={{fontSize:10,color:"var(--txt3)",textTransform:"uppercase",letterSpacing:".08em",fontFamily:"'JetBrains Mono',monospace"}}>TNK Recommendation</div><div style={{fontSize:16,fontWeight:700,color:recCol,fontFamily:"'JetBrains Mono',monospace"}}>{rec}</div></div></div>
        <div style={{fontSize:12,color:"var(--txt2)",lineHeight:1.6}}>{recDetail}</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
        <div><label style={{fontSize:9,color:"var(--txt3)",textTransform:"uppercase",letterSpacing:".06em",fontWeight:700,display:"block",marginBottom:4}}>Weight (kg)</label><input type="number" value={weight} onChange={e=>setWeight(e.target.value)} placeholder="kg…" style={{width:"100%",background:"var(--bg-up)",border:"1px solid var(--border)",borderRadius:6,padding:"7px 10px",color:"var(--txt)",fontFamily:"'DM Sans',sans-serif",fontSize:13,outline:"none"}}/>{doseRow&&<div style={{marginTop:4,fontSize:11,color:"var(--teal)",fontFamily:"'JetBrains Mono',monospace"}}>Dose: <strong>{doseRow.dose}</strong> ({doseRow.vol})</div>}</div>
        <div><label style={{fontSize:9,color:"var(--txt3)",textTransform:"uppercase",letterSpacing:".06em",fontWeight:700,display:"block",marginBottom:4}}>Est. min to PCI</label><input type="number" value={pciTime} onChange={e=>setPciTime(e.target.value)} placeholder="minutes…" style={{width:"100%",background:"var(--bg-up)",border:`1px solid ${pciDelay&&pciTime?"var(--coral)":"var(--border)"}`,borderRadius:6,padding:"7px 10px",color:"var(--txt)",fontFamily:"'DM Sans',sans-serif",fontSize:13,outline:"none"}}/>{pciTime&&<div style={{marginTop:4,fontSize:11,color:pciDelay?"var(--coral)":"var(--teal)",fontFamily:"'JetBrains Mono',monospace"}}>{pciDelay?"⚠ >120 min":"✓ PCI preferred"}</div>}</div>
        <div style={{display:"flex",alignItems:"flex-end",paddingBottom:2}}><label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:12,color:"var(--txt2)"}}><input type="checkbox" checked={over75} onChange={e=>setOver75(e.target.checked)} style={{width:16,height:16,accentColor:"var(--teal)"}}/>Age &gt; 75</label></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6}}>
        {TNK_DOSING.map((d,i)=>{const active=doseRow&&doseRow.dose===d.dose;return(<div key={i} style={{background:active?"rgba(0,229,192,.12)":"var(--bg-up)",border:`1px solid ${active?"rgba(0,229,192,.5)":"var(--border)"}`,borderRadius:8,padding:"8px 10px",textAlign:"center"}}><div style={{fontSize:10,color:"var(--txt3)",marginBottom:3}}>{d.weight}</div><div style={{fontSize:14,fontWeight:700,color:active?"var(--teal)":"var(--txt)",fontFamily:"'JetBrains Mono',monospace"}}>{d.dose}</div><div style={{fontSize:10,color:"var(--txt3)",marginTop:2}}>{d.vol}</div></div>);})}
      </div>
      <div style={{fontSize:11,fontWeight:700,color:"var(--coral)",marginBottom:6}}>🚫 Absolute Contraindications{absCount>0&&<span style={{marginLeft:8,fontSize:10,background:"rgba(255,107,107,.2)",color:"var(--coral)",border:"1px solid rgba(255,107,107,.4)",borderRadius:20,padding:"1px 7px"}}>{absCount}</span>}</div>
      <div style={{display:"flex",flexDirection:"column",gap:4}}>{TNK_ABSOLUTE.map(c=>{const on=abs[c.id];return(<label key={c.id} style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",background:on?"rgba(255,107,107,.1)":"var(--bg-up)",border:`1px solid ${on?"rgba(255,107,107,.4)":"var(--border)"}`,borderRadius:7,padding:"7px 12px",transition:"all .15s"}}><input type="checkbox" checked={!!on} onChange={e=>setAbs(p=>({...p,[c.id]:e.target.checked}))} style={{width:15,height:15,accentColor:"var(--coral)",cursor:"pointer",flexShrink:0}}/><span style={{fontSize:12,color:on?"var(--coral)":"var(--txt2)"}}>{c.label}</span></label>);})}</div>
      <div style={{fontSize:11,fontWeight:700,color:"var(--gold)",marginBottom:6,marginTop:4}}>⚠️ Relative Contraindications{relCount>0&&<span style={{marginLeft:8,fontSize:10,background:"rgba(245,200,66,.15)",color:"var(--gold)",border:"1px solid rgba(245,200,66,.4)",borderRadius:20,padding:"1px 7px"}}>{relCount}</span>}</div>
      <div style={{display:"flex",flexDirection:"column",gap:4}}>{TNK_RELATIVE.map(c=>{const on=rel[c.id];return(<label key={c.id} style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",background:on?"rgba(245,200,66,.08)":"var(--bg-up)",border:`1px solid ${on?"rgba(245,200,66,.35)":"var(--border)"}`,borderRadius:7,padding:"7px 12px",transition:"all .15s"}}><input type="checkbox" checked={!!on} onChange={e=>setRel(p=>({...p,[c.id]:e.target.checked}))} style={{width:15,height:15,accentColor:"var(--gold)",cursor:"pointer",flexShrink:0}}/><span style={{fontSize:12,color:on?"var(--gold)":"var(--txt2)"}}>{c.label}</span></label>);})}</div>
      <div style={{fontSize:10,color:"var(--txt4)",fontFamily:"'JetBrains Mono',monospace",lineHeight:1.6,padding:"10px 12px",background:"var(--bg-card)",borderRadius:8,border:"1px solid var(--border)"}}>
        Reference: 2025 ACC/AHA/ACEP ACS Guideline · FDA TNKase PI · ⚠ Clinical decision support only.
      </div>
    </div>
  );
}

function CardiologyConsult(){
  const[consultTime,setConsultTime]=useState("");const[callbackTime,setCallbackTime]=useState("");const[cardiologist,setCardiologist]=useState("");const[recommendation,setRecommendation]=useState("");const[saved,setSaved]=useState(false);const[disposition,setDisposition]=useState("");const[urgency,setUrgency]=useState("");
  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
        {[{label:"Consult Time",value:consultTime||"—",icon:"📞",color:"var(--blue)"},{label:"Cardiologist",value:cardiologist||"—",icon:"🫀",color:"var(--teal)"},{label:"Urgency",value:urgency||"—",icon:"⚡",color:"var(--coral)"}].map((s,i)=>(
          <div key={i} style={{background:"var(--bg-up)",border:"1px solid var(--border)",borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:20}}>{s.icon}</span><div><div style={{fontSize:9,color:"var(--txt3)",textTransform:"uppercase",letterSpacing:".06em"}}>{s.label}</div><div style={{fontSize:13,fontWeight:700,color:s.color,fontFamily:"'JetBrains Mono',monospace"}}>{s.value}</div></div></div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        {[{label:"Time Cardiology Consulted",val:consultTime,set:setConsultTime},{label:"Time Called Back",val:callbackTime,set:setCallbackTime}].map((f,i)=>(
          <div key={i}><label style={{fontSize:9,color:"var(--txt3)",textTransform:"uppercase",letterSpacing:".06em",fontWeight:700,display:"block",marginBottom:4}}>{f.label}</label><div style={{display:"flex",gap:6}}><input type="time" value={f.val} onChange={e=>f.set(e.target.value)} style={{flex:1,background:"var(--bg-up)",border:"1px solid var(--border)",borderRadius:6,padding:"7px 10px",color:"var(--txt)",fontFamily:"'JetBrains Mono',monospace",fontSize:13,outline:"none"}}/><button onClick={()=>f.set(nowTime())} style={{background:"rgba(59,158,255,.15)",border:"1px solid rgba(59,158,255,.3)",borderRadius:6,padding:"0 10px",color:"var(--blue)",fontSize:11,cursor:"pointer",whiteSpace:"nowrap"}}>Now</button></div></div>
        ))}
        <div><label style={{fontSize:9,color:"var(--txt3)",textTransform:"uppercase",letterSpacing:".06em",fontWeight:700,display:"block",marginBottom:4}}>Cardiologist Name</label><input value={cardiologist} onChange={e=>setCardiologist(e.target.value)} placeholder="Dr. …" style={{width:"100%",background:"var(--bg-up)",border:"1px solid var(--border)",borderRadius:6,padding:"7px 10px",color:"var(--txt)",fontFamily:"'DM Sans',sans-serif",fontSize:13,outline:"none"}}/></div>
        <div><label style={{fontSize:9,color:"var(--txt3)",textTransform:"uppercase",letterSpacing:".06em",fontWeight:700,display:"block",marginBottom:4}}>Urgency</label><div style={{display:"flex",gap:5}}>{[{v:"STAT",c:"var(--coral)",bg:"rgba(255,107,107,.15)",br:"rgba(255,107,107,.4)"},{v:"Urgent",c:"var(--gold)",bg:"rgba(245,200,66,.12)",br:"rgba(245,200,66,.3)"},{v:"Routine",c:"var(--blue)",bg:"rgba(59,158,255,.12)",br:"rgba(59,158,255,.3)"}].map(({v,c,bg,br})=><button key={v} onClick={()=>setUrgency(v)} style={{flex:1,padding:"7px 0",borderRadius:6,fontSize:11,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",fontWeight:700,background:urgency===v?bg:"var(--bg-up)",border:`1px solid ${urgency===v?br:"var(--border)"}`,color:urgency===v?c:"var(--txt3)"}}>{v}</button>)}</div></div>
        <div style={{gridColumn:"1/-1"}}><label style={{fontSize:9,color:"var(--txt3)",textTransform:"uppercase",letterSpacing:".06em",fontWeight:700,display:"block",marginBottom:4}}>Recommended Disposition</label><select value={disposition} onChange={e=>setDisposition(e.target.value)} style={{width:"100%",background:"var(--bg-up)",border:"1px solid var(--border)",borderRadius:6,padding:"7px 10px",color:"var(--txt)",fontFamily:"'DM Sans',sans-serif",fontSize:13,outline:"none"}}><option value="">— Select —</option><option>Cath lab — emergent</option><option>CCU / Cardiac ICU admission</option><option>Telemetry floor admission</option><option>Transfer to PCI-capable centre</option><option>Medical management / observation</option><option>Discharge with outpatient follow-up</option></select></div>
      </div>
      <div><label style={{fontSize:9,color:"var(--txt3)",textTransform:"uppercase",letterSpacing:".06em",fontWeight:700,display:"block",marginBottom:4}}>Recommendations / Notes</label><textarea value={recommendation} onChange={e=>setRecommendation(e.target.value)} rows={4} placeholder="Document cardiologist's recommendations…" style={{width:"100%",background:"var(--bg-up)",border:"1px solid var(--border)",borderRadius:8,padding:"10px 12px",color:"var(--txt)",fontFamily:"'DM Sans',sans-serif",fontSize:13,outline:"none",resize:"vertical",lineHeight:1.5}}/></div>
      <button onClick={()=>{setSaved(true);setTimeout(()=>setSaved(false),2500);}} style={{background:saved?"rgba(0,229,192,.2)":"var(--teal)",color:saved?"var(--teal)":"var(--bg)",border:`1px solid ${saved?"rgba(0,229,192,.5)":"transparent"}`,borderRadius:8,padding:"10px 0",fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:700,cursor:"pointer",transition:"all .3s",width:"100%"}}>{saved?"✓ Consult Saved":"💾 Save Cardiology Consult"}</button>
    </div>
  );
}

function ACSPage(){
  const[acsType,setAcsType]=useState("STEMI");const[activeTab,setActiveTab]=useState("algorithm");const[checked,setChecked]=useState({});
  const TABS=[{id:"algorithm",label:"Algorithm",icon:"🔄"},{id:"workup",label:"Workup",icon:"✅"},{id:"treatment",label:"Pharmacotherapy",icon:"💊"},{id:"tnk",label:"TNK Tool",icon:"💉"},{id:"cardiology",label:"Cardiology Consult",icon:"📞"}];
  const timeTargets=acsType==="STEMI"
    ?[{icon:"📋",label:"Door-to-ECG",target:"≤ 10 min",color:"var(--blue)"},{icon:"🏥",label:"Door-to-Balloon",target:"≤ 90 min",color:"var(--teal)"},{icon:"💉",label:"Door-to-Needle",target:"≤ 30 min",color:"var(--coral)"},{icon:"⏱",label:"FMC-to-Device",target:"≤ 120 min",color:"var(--gold)"}]
    :[{icon:"📋",label:"Door-to-ECG",target:"≤ 10 min",color:"var(--blue)"},{icon:"🧬",label:"Troponin Result",target:"≤ 60 min",color:"var(--purple)"},{icon:"🏥",label:"High-Risk PCI",target:"≤ 2 h",color:"var(--coral)"},{icon:"⏱",label:"Early Invasive",target:"≤ 24 h",color:"var(--gold)"}];
  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <PageHeader icon="🫀" title="Acute Coronary Syndrome" badge="2025 ACC/AHA" badgeColor="coral" sub="Evidence-based ACS management · ACEP · AHA · ACC · SCAI guidelines integrated"
        extra={<div style={{display:"flex",gap:8,alignItems:"center"}}><span style={{fontSize:10,color:"var(--txt3)",textTransform:"uppercase",letterSpacing:".06em",fontFamily:"'JetBrains Mono',monospace"}}>Type:</span>{[{v:"STEMI",color:"var(--coral)",bg:"rgba(255,107,107,.15)",br:"rgba(255,107,107,.5)"},{v:"NSTEMI",color:"var(--orange)",bg:"rgba(255,159,67,.12)",br:"rgba(255,159,67,.4)"},{v:"UA",color:"var(--gold)",bg:"rgba(245,200,66,.12)",br:"rgba(245,200,66,.4)"}].map(({v,color,bg,br})=><button key={v} onClick={()=>setAcsType(v)} style={{padding:"6px 14px",borderRadius:20,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",transition:"all .2s",background:acsType===v?bg:"var(--bg-up)",border:`1.5px solid ${acsType===v?br:"var(--border)"}`,color:acsType===v?color:"var(--txt3)"}}>{v}</button>)}</div>}
      />
      <TimeBanner targets={timeTargets}/>
      <div style={{display:"flex",gap:4,background:"var(--bg-panel)",border:"1px solid var(--border)",borderRadius:10,padding:4}}>
        {TABS.map(t=><button key={t.id} onClick={()=>setActiveTab(t.id)} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:7,fontSize:12,fontWeight:activeTab===t.id?700:500,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",whiteSpace:"nowrap",flexShrink:0,transition:"all .2s",background:activeTab===t.id?"rgba(255,107,107,.12)":"transparent",border:activeTab===t.id?"1px solid rgba(255,107,107,.3)":"1px solid transparent",color:activeTab===t.id?"var(--coral)":"var(--txt3)"}}><span>{t.icon}</span>{t.label}</button>)}
      </div>
      <SectionBox icon={TABS.find(t=>t.id===activeTab)?.icon} title={`${TABS.find(t=>t.id===activeTab)?.label} — ${acsType}`} sub="2025 ACC/AHA/ACEP/NAEMSP/SCAI ACS Guideline">
        {activeTab==="algorithm"&&<FlowChart nodes={[
          {type:"start",text:"Patient presents with chest pain / ACS symptoms"},
          {arrow:true},{type:"action",color:"blue",text:"Immediate Assessment",badge:"0–10 min",items:["12-lead ECG within 10 min","IV access × 2, O₂ monitoring","ASA 324 mg PO (if no allergy)","Vital signs, O₂ sat, pain scale"]},
          {arrow:true},{type:"decision",text:"ECG Interpretation",branches:[{color:"coral",tag:"STEMI",label:"STE ≥ 1 mm in ≥ 2 leads\nOR New LBBB"},{color:"blue",tag:"UA/Low",label:"Normal / Non-diagnostic\nSerial ECG + hs-cTn"},{color:"orange",tag:"NSTE-ACS",label:"ST Depression\nT-wave changes"}]},
          {arrow:true},
          ...(acsType==="STEMI"?[
            {type:"action",color:"coral",text:"STEMI Activation — Cath Lab Alert",badge:"< 10 min",items:["Activate STEMI protocol IMMEDIATELY","Cardiology STAT","ASA + P2Y₁₂ loading","UFH or bivalirudin"]},
            {arrow:true},{type:"decision",text:"PCI-capable centre ≤ 120 min?",branches:[{color:"teal",tag:"YES",label:"Primary PCI\nD2B ≤ 90 min"},{color:"gold",tag:"NO",label:"TNK fibrinolysis\nD2N ≤ 30 min\nTransfer 3–24 h"}]},
            {arrow:true},{type:"outcome",color:"teal",text:"Complete Revascularisation (Class I — 2025)",sub:"Staged non-culprit PCI recommended — except cardiogenic shock"},
          ]:[
            {type:"action",color:"orange",text:"NSTE-ACS Management",badge:"< 30 min",items:["hs-cTn 0h + 1–3h serial","ASA + ticagrelor preferred","Enoxaparin / fondaparinux","GRACE / TIMI risk scoring"]},
            {arrow:true},{type:"decision",text:"Risk Stratification (GRACE Score)",branches:[{color:"coral",tag:"HIGH",label:"GRACE > 140\nUrgent / < 2–24 h cath"},{color:"blue",tag:"LOW/MED",label:"Selective invasive\nOptimise medical Rx"}]},
            {arrow:true},{type:"outcome",color:"teal",text:"Angiography ± PCI / CABG",sub:"Complete revascularisation (Class I). Intracoronary imaging to guide PCI (Class I — 2025)."},
          ]),
          {arrow:true},{type:"outcome",color:"blue",text:"Secondary Prevention & Discharge",sub:"DAPT ≥ 12 months · High-intensity statin · ACE-I/ARB · β-blocker · LDL < 55 mg/dL · Cardiac rehab"},
        ]}/>}
        {activeTab==="workup"&&<div style={{display:"flex",flexDirection:"column",gap:7}}>{STEMI_WORKUP.map((w,i)=>{const done=checked[w.icon+i];return(<div key={i} onClick={()=>setChecked(p=>({...p,[w.icon+i]:!done}))} style={{display:"grid",gridTemplateColumns:"32px 1fr auto",gap:10,alignItems:"center",background:done?"rgba(0,229,192,.05)":"var(--bg-up)",border:`1px solid ${done?"rgba(0,229,192,.3)":"var(--border)"}`,borderRadius:8,padding:"9px 12px",cursor:"pointer",transition:"all .2s"}}><div style={{width:28,height:28,borderRadius:8,background:done?"rgba(0,229,192,.15)":"rgba(59,158,255,.08)",border:`1px solid ${done?"rgba(0,229,192,.4)":"rgba(59,158,255,.25)"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>{done?"✓":w.icon}</div><div><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:12,fontWeight:600,color:done?"var(--teal)":"var(--txt)",textDecoration:done?"line-through":"none"}}>{w.label}</span>{w.class1&&<span style={{fontSize:9,background:"rgba(0,229,192,.12)",color:"var(--teal)",border:"1px solid rgba(0,229,192,.3)",borderRadius:20,padding:"1px 6px",fontFamily:"'JetBrains Mono',monospace",fontWeight:700}}>COR I</span>}</div><div style={{fontSize:11,color:"var(--txt3)",marginTop:2}}>{w.detail}</div></div><div style={{fontSize:9,color:"var(--txt4)",fontFamily:"'JetBrains Mono',monospace",whiteSpace:"nowrap"}}>{w.time}</div></div>);})}</div>}
        {activeTab==="treatment"&&<DrugTable rows={acsType==="STEMI"?STEMI_RX:NSTEMI_RX}/>}
        {activeTab==="tnk"&&<>{acsType!=="STEMI"&&<div style={{background:"rgba(245,200,66,.1)",border:"1px solid rgba(245,200,66,.3)",borderRadius:8,padding:"8px 14px",fontSize:11,color:"var(--gold)",marginBottom:14}}>⚠ TNK indicated for STEMI only. Switch to STEMI above.</div>}<TNKChecker/></>}
        {activeTab==="cardiology"&&<CardiologyConsult/>}
      </SectionBox>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  PLACEHOLDER
// ════════════════════════════════════════════════════════════
function PlaceholderPage({section}){
  const meta={chart:{icon:"📊",title:"Patient Chart",sub:"Full patient chart overview"},demographics:{icon:"👤",title:"Demographics",sub:"Patient info & contacts"},cc:{icon:"💬",title:"Chief Complaint",sub:"Primary reason for visit"},vitals:{icon:"📈",title:"Vitals",sub:"Current and trending vitals"},meds:{icon:"💊",title:"Meds & PMH",sub:"Medications, allergies, history"},ros:{icon:"🔍",title:"Review of Systems",sub:"Systematic symptom review"},exam:{icon:"🩺",title:"Physical Exam",sub:"Examination findings"},mdm:{icon:"⚖️",title:"MDM",sub:"Medical decision making"},orders:{icon:"📋",title:"Orders",sub:"Lab, imaging & medication orders"},discharge:{icon:"🚪",title:"Discharge",sub:"Instructions & follow-up"},erplan:{icon:"🗺️",title:"ER Plan Builder",sub:"Track the patient's ER care plan"},erx:{icon:"💉",title:"eRx",sub:"Electronic prescribing"},procedures:{icon:"✂️",title:"Procedures",sub:"Procedure documentation"}}[section]||{icon:"📄",title:"Section",sub:""};
  return(<>
    <div className="page-header"><span className="page-header-icon">{meta.icon}</span><div><div className="page-title">{meta.title}</div><div className="page-subtitle">{meta.sub}</div></div><div className="page-header-right"><button className="btn-ghost">+ Add Item</button></div></div>
    <div className="section-box"><div className="card"><p className="text-muted text-sm">Select a section from the bottom navigation to begin documenting.</p></div></div>
  </>);
}

// ════════════════════════════════════════════════════════════
//  NAV DATA
// ════════════════════════════════════════════════════════════
const NAV_DATA={
  intake:[
    {section:"chart",        abbr:"Pc",icon:"📊",label:"Patient Chart",    dot:"done"},
    {section:"demographics", abbr:"Dm",icon:"👤",label:"Demographics",     dot:"partial"},
    {section:"cc",           abbr:"Cc",icon:"💬",label:"Chief Complaint",  dot:"empty"},
    {section:"vitals",       abbr:"Vt",icon:"📈",label:"Vitals",           dot:"empty"},
  ],
  documentation:[
    {section:"meds",  abbr:"Rx",icon:"💊",label:"Meds & PMH",        dot:"empty"},
    {section:"ros",   abbr:"Rs",icon:"🔍",label:"Review of Systems", dot:"empty"},
    {section:"exam",  abbr:"Pe",icon:"🩺",label:"Physical Exam",     dot:"empty"},
    {section:"mdm",   abbr:"Md",icon:"⚖️",label:"MDM",               dot:"empty"},
  ],
  disposition:[
    {section:"orders",    abbr:"Or",icon:"📋",label:"Orders",          dot:"empty"},
    {section:"discharge", abbr:"Dc",icon:"🚪",label:"Discharge",       dot:"empty"},
    {section:"erplan",    abbr:"Ep",icon:"🗺️",label:"ER Plan Builder", dot:"empty"},
  ],
  tools:[
    {section:"acs",       abbr:"CS",icon:"🫀",label:"ACS Protocol",        dot:"empty"},
    {section:"tachy",     abbr:"Tc",icon:"⚡",label:"Adult Tachycardia",   dot:"empty"},
    {section:"brady",     abbr:"Br",icon:"🔻",label:"Adult Bradycardia",   dot:"empty"},
    {section:"peds",      abbr:"Pd",icon:"👶",label:"Pediatric ACLS",      dot:"empty"},
    {section:"pregnancy", abbr:"Pg",icon:"🤰",label:"Arrest in Pregnancy", dot:"empty"},
  ],
};
const GROUP_META=[{key:"intake",icon:"📋",label:"Intake"},{key:"documentation",icon:"🩺",label:"Documentation"},{key:"disposition",icon:"🚪",label:"Disposition"},{key:"tools",icon:"🔧",label:"Tools"}];
const SIDEBAR_BTNS=[{icon:"🏠",label:"Home"},{icon:"📊",label:"Dash"},{icon:"👥",label:"Patients",active:true},{icon:"🔄",label:"Shift"},"sep",{icon:"💊",label:"Drugs"},{icon:"🧮",label:"Calc"}];
const QUICK_ACTIONS=[{icon:"📋",label:"Summarise",prompt:"Summarise what I have entered so far."},{icon:"🔍",label:"Check",prompt:"What am I missing? Check my entries for completeness."},{icon:"📝",label:"Draft Note",prompt:"Generate a draft note from the data entered."},{icon:"🧠",label:"DDx",prompt:"Suggest differential diagnoses based on current data."}];
const ALL_SECTIONS=Object.values(NAV_DATA).flat();
const SYSTEM_PROMPT="You are Notrya AI — a helpful AI assistant embedded in an emergency medicine documentation platform. Respond in 2–4 concise, actionable sentences. Be direct. Never fabricate data. If unsure, say so.";
const PROTOCOL_SECTIONS=["acs","tachy","brady","peds","pregnancy"];

// ════════════════════════════════════════════════════════════
//  MAIN SHELL
// ════════════════════════════════════════════════════════════
export default function NotryaACS(){
  const[activeGroup,setActiveGroup]=useState("tools");
  const[activeSection,setActiveSection]=useState("acs");
  const[navDots]=useState(()=>{const m={};ALL_SECTIONS.forEach(s=>(m[s.section]=s.dot));return m;});
  const[clock,setClock]=useState("");
  useEffect(()=>{const tick=()=>{const d=new Date();setClock(String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0"))};tick();const id=setInterval(tick,10000);return()=>clearInterval(id);},[]);
  const currentItem=ALL_SECTIONS.find(s=>s.section===activeSection);
  const pageAbbr=currentItem?.abbr||"Nt";
  const[aiOpen,setAiOpen]=useState(false);const[aiMsgs,setAiMsgs]=useState([{role:"sys",text:"Notrya AI ready — select a quick action or ask a clinical question."}]);const[aiInput,setAiInput]=useState("");const[aiLoading,setAiLoading]=useState(false);const[unread,setUnread]=useState(0);const[history,setHistory]=useState([]);
  const msgsRef=useRef(null);const inputRef=useRef(null);const pillsRef=useRef(null);
  useEffect(()=>{msgsRef.current?.scrollTo({top:msgsRef.current.scrollHeight,behavior:"smooth"});},[aiMsgs,aiLoading]);
  useEffect(()=>{if(aiOpen)setTimeout(()=>inputRef.current?.focus(),280);},[aiOpen]);
  useEffect(()=>{const h=e=>{if(e.key==="Escape"&&aiOpen)setAiOpen(false)};window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h);},[aiOpen]);
  useEffect(()=>{const h=e=>{if(["INPUT","TEXTAREA","SELECT"].includes(e.target.tagName))return;if(e.key==="ArrowRight"||e.key==="ArrowLeft"){const idx=ALL_SECTIONS.findIndex(s=>s.section===activeSection);const next=e.key==="ArrowRight"?idx+1:idx-1;if(next>=0&&next<ALL_SECTIONS.length)selectSection(ALL_SECTIONS[next].section);}};window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h);},[activeSection]);
  useEffect(()=>{pillsRef.current?.querySelector(".bn-sub-pill.active")?.scrollIntoView({behavior:"smooth",inline:"center",block:"nearest"});},[activeSection,activeGroup]);
  const selectGroup=useCallback(group=>{setActiveGroup(group);const items=NAV_DATA[group];setActiveSection(prev=>items.find(i=>i.section===prev)?prev:items[0].section);},[]);
  const selectSection=useCallback(sectionId=>{setActiveSection(sectionId);for(const[group,items]of Object.entries(NAV_DATA)){if(items.find(i=>i.section===sectionId)){setActiveGroup(group);break;}}},[]);
  const getGroupBadge=useCallback(groupKey=>{const items=NAV_DATA[groupKey];const allDone=items.every(i=>navDots[i.section]==="done");const anyStarted=items.some(i=>navDots[i.section]==="done"||navDots[i.section]==="partial");return allDone?"done":anyStarted?"partial":"empty";},[navDots]);
  const toggleAI=useCallback(()=>setAiOpen(o=>{if(!o)setUnread(0);return!o;}),[]);
  const sendMessage=useCallback(async text=>{
    if(!text.trim()||aiLoading)return;
    setAiMsgs(m=>[...m,{role:"user",text:text.trim()}]);setAiInput("");setAiLoading(true);
    const ctx=`Active section: ${currentItem?.label||"Unknown"} | Group: ${activeGroup}`;
    const newHistory=[...history,{role:"user",content:ctx+"\n\n"+text.trim()}];setHistory(newHistory);
    try{const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:SYSTEM_PROMPT,messages:newHistory})});
      const data=await res.json();const reply=data.content?.[0]?.text||"No response received.";
      setHistory(h=>[...h,{role:"assistant",content:reply}]);setAiMsgs(m=>[...m,{role:"bot",text:reply}]);
      setAiOpen(open=>{if(!open)setUnread(u=>u+1);return open;});
    }catch{setAiMsgs(m=>[...m,{role:"sys",text:"⚠ Connection error — please try again."}]);}
    finally{setAiLoading(false);}
  },[aiLoading,history,currentItem,activeGroup]);
  const handleAIKey=e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage(aiInput);}};
  const renderMsg=text=>text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\n/g,"<br>").replace(/\*\*(.*?)\*\*/g,'<strong style="color:#00e5c0">$1</strong>');
  const subItems=NAV_DATA[activeGroup]||[];
  return(<>
    <style>{CSS}</style>
    <aside className="icon-sidebar">
      <div className="isb-logo"><div className="isb-logo-box">{pageAbbr}</div></div>
      <div className="isb-scroll">{SIDEBAR_BTNS.map((b,i)=>b==="sep"?<div key={i} className="isb-sep"/>:<div key={i} className={`isb-btn${b.active?" active":""}`} title={b.label}><span>{b.icon}</span><span className="isb-lbl">{b.label}</span></div>)}</div>
      <div className="isb-bottom"><div className="isb-btn" title="Settings"><span>⚙️</span><span className="isb-lbl">Settings</span></div></div>
    </aside>
    <header className="top-bar">
      <div className="top-row-1">
        <span className="nav-welcome">Welcome, <strong>Dr. Gabriel Skiba</strong></span><div className="nav-sep"/>
        <div className="nav-stat"><span className="nav-stat-val">0</span><span className="nav-stat-lbl">Active</span></div>
        <div className="nav-stat"><span className="nav-stat-val alert">14</span><span className="nav-stat-lbl">Pending</span></div>
        <div className="nav-stat"><span className="nav-stat-val">—</span><span className="nav-stat-lbl">Orders</span></div>
        <div className="nav-stat"><span className="nav-stat-val">11.6</span><span className="nav-stat-lbl">Hours</span></div>
        <div className="nav-right"><div className="nav-time">{clock}</div><div className="nav-ai-on"><div className="nav-ai-dot"/> AI ON</div><button className="nav-new-pt">+ New Patient</button></div>
      </div>
      <div className="top-row-2">
        <span className="chart-badge">[CHART-ID]</span><span className="pt-name">— Patient —</span><span className="pt-meta">Age · Sex · DOB</span><span className="pt-cc">CC: —</span><div className="vb-div"/>
        {[{l:"BP",v:"—"},{l:"HR",v:"—"},{l:"RR",v:"—"},{l:"SpO₂",v:"—"},{l:"T",v:"—"},{l:"GCS",v:"—"}].map(vt=><div key={vt.l} className="vb-vital"><span className="lbl">{vt.l}</span><span className="val">{vt.v}</span></div>)}
        <div className="vb-div"/><span className="status-badge status-stable">STABLE</span><span className="status-badge status-room">Room —</span>
        <div className="chart-actions"><button className="btn-ghost">📋 Orders</button><button className="btn-ghost">📝 SOAP Note</button><button className="btn-coral">🚪 Discharge</button><button className="btn-primary" onClick={()=>setAiMsgs(m=>[...m,{role:"sys",text:"💾 Chart saved successfully."}])}>💾 Save Chart</button></div>
      </div>
    </header>
    <div className="main-wrap">
      <main className="content">
        {activeSection==="acs"       && <ACSPage/>}
        {activeSection==="tachy"     && <TachycardiaPage/>}
        {activeSection==="brady"     && <BradycardiaPage/>}
        {activeSection==="peds"      && <PediatricsPage/>}
        {activeSection==="pregnancy" && <PregnancyPage/>}
        {!PROTOCOL_SECTIONS.includes(activeSection) && <PlaceholderPage section={activeSection}/>}
      </main>
    </div>
    <div className={`n-scrim${aiOpen?" open":""}`} onClick={toggleAI}/>
    <div className={`n-overlay${aiOpen?" open":""}`}>
      <div className="n-hdr">
        <div className="n-hdr-top"><div className="n-avatar">🤖</div><div className="n-hdr-info"><div className="n-hdr-name">Notrya AI</div><div className="n-hdr-sub"><span className="dot"/> claude-sonnet-4 · online</div></div><button className="n-close" onClick={toggleAI}>✕</button></div>
        <div className="n-quick">{QUICK_ACTIONS.map(q=><button key={q.label} className="n-qbtn" onClick={()=>sendMessage(q.prompt)} disabled={aiLoading}>{q.icon} {q.label}</button>)}</div>
      </div>
      <div className="n-msgs" ref={msgsRef}>
        {aiMsgs.map((m,i)=><div key={i} className={`n-msg ${m.role}`} dangerouslySetInnerHTML={{__html:renderMsg(m.text)}}/>)}
        {aiLoading&&<div className="n-dots"><span/><span/><span/></div>}
      </div>
      <div className="n-input-bar">
        <textarea ref={inputRef} className="n-ta" rows={1} placeholder="Ask anything…" value={aiInput} onChange={e=>setAiInput(e.target.value)} onKeyDown={handleAIKey} onInput={e=>{e.target.style.height="auto";e.target.style.height=Math.min(e.target.scrollHeight,90)+"px";}} disabled={aiLoading}/>
        <button className="n-send" onClick={()=>sendMessage(aiInput)} disabled={aiLoading||!aiInput.trim()}>↑</button>
      </div>
    </div>
    <button className={`n-fab${aiOpen?" open":""}`} onClick={toggleAI}><span className="n-fab-icon">{aiOpen?"✕":"🤖"}</span><span className={`n-fab-badge${unread>0?" show":""}`}>{unread>9?"9+":unread}</span></button>
    <nav className="bottom-nav">
      <div className="bn-sub-wrap"><div className="bn-sub-row" ref={pillsRef}>{subItems.map(item=><button key={item.section} className={`bn-sub-pill${item.section===activeSection?" active":""}`} onClick={()=>selectSection(item.section)}><span className="pill-icon">{item.icon}</span>{item.label}<span className={`pill-dot ${navDots[item.section]}`}/></button>)}</div></div>
      <div className="bn-groups">{GROUP_META.map(g=><button key={g.key} className={`bn-group-tab${g.key===activeGroup?" active":""}`} onClick={()=>selectGroup(g.key)}><div className="bn-group-icon">{g.icon}<span className={`bn-group-badge ${getGroupBadge(g.key)}`}/></div><span className="bn-group-label">{g.label}</span></button>)}</div>
    </nav>
  </>);
}

const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap');
:root{--bg:#050f1e;--bg-panel:#081628;--bg-card:#0b1e36;--bg-up:#0e2544;--border:#1a3555;--border-hi:#2a4f7a;--blue:#3b9eff;--cyan:#00d4ff;--teal:#00e5c0;--gold:#f5c842;--purple:#9b6dff;--coral:#ff6b6b;--green:#3dffa0;--orange:#ff9f43;--txt:#e8f0fe;--txt2:#8aaccc;--txt3:#4a6a8a;--txt4:#2e4a6a;--icon-sb:56px;--top-h:88px;--bot-h:108px;--r:8px;--rl:12px;}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body,#root{height:100%;background:var(--bg);color:var(--txt);font-family:'DM Sans',sans-serif;font-size:14px;overflow:hidden}
.icon-sidebar{position:fixed;top:0;left:0;bottom:0;width:var(--icon-sb);background:#040d19;border-right:1px solid var(--border);display:flex;flex-direction:column;align-items:center;z-index:200}
.isb-logo{width:100%;height:48px;flex-shrink:0;display:flex;align-items:center;justify-content:center;border-bottom:1px solid var(--border)}
.isb-logo-box{width:30px;height:30px;background:var(--blue);border-radius:7px;display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-size:13px;font-weight:700;color:white;cursor:pointer;transition:filter .15s}
.isb-logo-box:hover{filter:brightness(1.2)}
.isb-scroll{flex:1;width:100%;display:flex;flex-direction:column;align-items:center;padding:8px 0;gap:2px;overflow-y:auto}
.isb-btn{width:42px;height:42px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;border-radius:6px;cursor:pointer;transition:all .15s;color:var(--txt3);border:1px solid transparent;font-size:15px}
.isb-btn:hover{background:var(--bg-up);border-color:var(--border);color:var(--txt2)}
.isb-btn.active{background:rgba(59,158,255,.1);border-color:rgba(59,158,255,.3);color:var(--blue)}
.isb-lbl{font-size:8px;line-height:1;white-space:nowrap}
.isb-sep{width:30px;height:1px;background:var(--border);margin:4px 0;flex-shrink:0}
.isb-bottom{padding:8px 0;border-top:1px solid var(--border);display:flex;flex-direction:column;align-items:center;gap:2px}
.top-bar{position:fixed;top:0;left:var(--icon-sb);right:0;height:var(--top-h);background:var(--bg-panel);border-bottom:1px solid var(--border);z-index:100;display:flex;flex-direction:column}
.top-row-1{height:44px;flex-shrink:0;display:flex;align-items:center;padding:0 14px;gap:8px;border-bottom:1px solid rgba(26,53,85,.5)}
.nav-welcome{font-size:12px;color:var(--txt2);font-weight:500;white-space:nowrap}
.nav-welcome strong{color:var(--txt);font-weight:600}
.nav-sep{width:1px;height:20px;background:var(--border);flex-shrink:0}
.nav-stat{display:flex;align-items:center;gap:5px;background:var(--bg-up);border:1px solid var(--border);border-radius:6px;padding:3px 10px;cursor:pointer}
.nav-stat-val{font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:600;color:var(--txt)}
.nav-stat-val.alert{color:var(--gold)}
.nav-stat-lbl{font-size:9px;color:var(--txt3);text-transform:uppercase;letter-spacing:.04em}
.nav-right{margin-left:auto;display:flex;align-items:center;gap:6px}
.nav-time{background:var(--bg-up);border:1px solid var(--border);border-radius:6px;padding:3px 10px;font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--txt2)}
.nav-ai-on{display:flex;align-items:center;gap:4px;background:rgba(0,229,192,.08);border:1px solid rgba(0,229,192,.3);border-radius:6px;padding:3px 10px;font-size:11px;font-weight:600;color:var(--teal)}
.nav-ai-dot{width:6px;height:6px;border-radius:50%;background:var(--teal);animation:ai-pulse 2s ease-in-out infinite}
@keyframes ai-pulse{0%,100%{box-shadow:0 0 0 0 rgba(0,229,192,.4)}50%{box-shadow:0 0 0 5px rgba(0,229,192,0)}}
.nav-new-pt{background:var(--teal);color:var(--bg);border:none;border-radius:6px;padding:4px 12px;font-size:11px;font-weight:700;cursor:pointer;transition:filter .15s;white-space:nowrap}
.nav-new-pt:hover{filter:brightness(1.15)}
.top-row-2{height:44px;flex-shrink:0;display:flex;align-items:center;padding:0 14px;gap:8px;overflow:hidden}
.pt-name{font-family:'Playfair Display',serif;font-size:14px;font-weight:600;color:var(--txt);white-space:nowrap}
.pt-meta{font-size:11px;color:var(--txt3);white-space:nowrap}
.pt-cc{font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:600;color:var(--orange);white-space:nowrap}
.vb-div{width:1px;height:18px;background:var(--border);flex-shrink:0}
.vb-vital{display:flex;align-items:center;gap:3px;font-family:'JetBrains Mono',monospace;font-size:10.5px;white-space:nowrap}
.vb-vital .lbl{color:var(--txt4);font-size:9px}
.vb-vital .val{color:var(--txt2)}
.chart-badge{font-family:'JetBrains Mono',monospace;font-size:10px;background:var(--bg-up);border:1px solid var(--border);border-radius:20px;padding:1px 8px;color:var(--teal);white-space:nowrap}
.status-badge{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:600;padding:2px 8px;border-radius:4px;white-space:nowrap}
.status-stable{background:rgba(0,229,192,.1);color:var(--teal);border:1px solid rgba(0,229,192,.3)}
.status-room{background:rgba(0,229,192,.1);color:var(--teal);border:1px solid rgba(0,229,192,.3)}
.chart-actions{margin-left:auto;display:flex;align-items:center;gap:5px;flex-shrink:0}
.btn-ghost{background:var(--bg-up);border:1px solid var(--border);border-radius:6px;padding:4px 10px;font-size:11px;color:var(--txt2);cursor:pointer;transition:all .15s;display:inline-flex;align-items:center;gap:4px;white-space:nowrap;font-family:'DM Sans',sans-serif}
.btn-ghost:hover{border-color:var(--border-hi);color:var(--txt)}
.btn-primary{background:var(--teal);color:var(--bg);border:none;border-radius:6px;padding:4px 12px;font-size:11px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:4px;white-space:nowrap;font-family:'DM Sans',sans-serif}
.btn-coral{background:rgba(255,107,107,.15);color:var(--coral);border:1px solid rgba(255,107,107,.3);border-radius:6px;padding:4px 12px;font-size:11px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:4px;white-space:nowrap;font-family:'DM Sans',sans-serif}
.main-wrap{position:fixed;top:var(--top-h);left:var(--icon-sb);right:0;bottom:var(--bot-h);display:flex}
.content{flex:1;overflow-y:auto;padding:18px 28px 30px;display:flex;flex-direction:column;gap:18px}
.page-header{display:flex;align-items:center;gap:10px}
.page-header-icon{font-size:20px}
.page-title{font-family:'Playfair Display',serif;font-size:20px;font-weight:600;color:var(--txt)}
.page-subtitle{font-size:12px;color:var(--txt3);margin-top:1px}
.page-header-right{margin-left:auto;display:flex;align-items:center;gap:6px}
.section-box{background:var(--bg-panel);border:1px solid var(--border);border-radius:var(--rl);padding:16px 18px}
.sec-header{display:flex;align-items:center;gap:10px;margin-bottom:14px}
.sec-icon{font-size:16px}
.sec-title{font-size:14px;font-weight:600;color:var(--txt)}
.sec-subtitle{font-size:11px;color:var(--txt3);margin-top:1px}
.card{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--rl);padding:14px 16px}
.field{display:flex;flex-direction:column;gap:3px}
.field-label{font-size:9px;color:var(--txt3);text-transform:uppercase;letter-spacing:.06em;font-weight:500}
.field-input{background:var(--bg-up);border:1px solid var(--border);border-radius:6px;padding:7px 10px;color:var(--txt);font-family:'DM Sans',sans-serif;font-size:13px;outline:none;width:100%}
.field-textarea{background:var(--bg-up);border:1px solid var(--border);border-radius:6px;padding:8px 10px;color:var(--txt);font-family:'DM Sans',sans-serif;font-size:13px;outline:none;resize:vertical;min-height:70px;width:100%;line-height:1.5}
.field-select{background:var(--bg-up);border:1px solid var(--border);border-radius:6px;padding:7px 10px;color:var(--txt);font-family:'DM Sans',sans-serif;font-size:13px;outline:none;cursor:pointer;width:100%}
.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.col-full{grid-column:1/-1}
.badge{font-size:11px;font-family:'JetBrains Mono',monospace;padding:2px 9px;border-radius:20px;font-weight:600;white-space:nowrap}
.badge-teal{background:rgba(0,229,192,.12);color:var(--teal);border:1px solid rgba(0,229,192,.3)}
.chip{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:12px;cursor:pointer;border:1px solid var(--border);background:var(--bg-up);color:var(--txt2);transition:all .15s;user-select:none}
.chip.selected{background:rgba(59,158,255,.15);border-color:var(--blue);color:var(--blue)}
.flex{display:flex}.gap-6{gap:6px}.ml-auto{margin-left:auto}.mb-8{margin-bottom:8px}
.text-muted{color:var(--txt3)}.text-sm{font-size:12px}
.bottom-nav{position:fixed;bottom:0;left:var(--icon-sb);right:0;height:var(--bot-h);background:var(--bg-panel);border-top:1px solid var(--border);z-index:100;display:flex;flex-direction:column}
.bn-sub-wrap{position:relative;flex-shrink:0;height:44px}
.bn-sub-wrap::before,.bn-sub-wrap::after{content:'';position:absolute;top:0;bottom:0;width:24px;z-index:2;pointer-events:none}
.bn-sub-wrap::before{left:0;background:linear-gradient(90deg,var(--bg-panel) 0%,transparent 100%)}
.bn-sub-wrap::after{right:0;background:linear-gradient(-90deg,var(--bg-panel) 0%,transparent 100%)}
.bn-sub-row{height:44px;display:flex;align-items:center;padding:0 12px;gap:6px;overflow-x:auto;overflow-y:hidden;border-bottom:1px solid rgba(26,53,85,.4);scrollbar-width:none}
.bn-sub-row::-webkit-scrollbar{display:none}
.bn-sub-pill{display:flex;align-items:center;gap:5px;padding:5px 14px;border-radius:20px;font-size:12px;font-weight:500;color:var(--txt3);background:transparent;border:1px solid transparent;cursor:pointer;transition:all .2s;white-space:nowrap;flex-shrink:0;font-family:'DM Sans',sans-serif}
.bn-sub-pill:hover{color:var(--txt2);background:var(--bg-up);border-color:var(--border)}
.bn-sub-pill.active{color:var(--blue);background:rgba(59,158,255,.1);border-color:rgba(59,158,255,.35);font-weight:600}
.bn-sub-pill .pill-icon{font-size:12px}
.bn-sub-pill .pill-dot{width:5px;height:5px;border-radius:50%;flex-shrink:0}
.bn-sub-pill .pill-dot.done{background:var(--teal);box-shadow:0 0 4px rgba(0,229,192,.5)}
.bn-sub-pill .pill-dot.partial{background:var(--orange)}
.bn-sub-pill .pill-dot.empty{background:var(--txt4)}
.bn-groups{height:64px;flex-shrink:0;display:flex;align-items:stretch}
.bn-group-tab{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;cursor:pointer;position:relative;transition:all .2s;border:none;background:none;font-family:'DM Sans',sans-serif;padding:6px 0}
.bn-group-tab::before{content:'';position:absolute;top:0;left:20%;right:20%;height:2px;background:var(--blue);border-radius:0 0 2px 2px;transform:scaleX(0);transition:transform .25s cubic-bezier(.34,1.56,.64,1)}
.bn-group-tab.active::before{transform:scaleX(1)}
.bn-group-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px;background:transparent;border:1px solid transparent;transition:all .2s;position:relative}
.bn-group-tab:hover .bn-group-icon{background:var(--bg-up);border-color:var(--border)}
.bn-group-tab.active .bn-group-icon{background:rgba(59,158,255,.1);border-color:rgba(59,158,255,.3)}
.bn-group-badge{position:absolute;top:2px;right:2px;width:8px;height:8px;border-radius:50%;border:1.5px solid var(--bg-panel)}
.bn-group-badge.done{background:var(--teal)}
.bn-group-badge.partial{background:var(--orange)}
.bn-group-badge.empty{background:transparent;border-color:transparent}
.bn-group-label{font-size:9px;font-weight:500;letter-spacing:.04em;text-transform:uppercase;color:var(--txt4);transition:color .2s}
.bn-group-tab:hover .bn-group-label{color:var(--txt3)}
.bn-group-tab.active .bn-group-label{color:var(--blue);font-weight:600}
.bn-group-tab+.bn-group-tab{border-left:1px solid rgba(26,53,85,.4)}
.n-scrim{position:fixed;inset:0;z-index:9997;background:rgba(3,8,16,.4);backdrop-filter:blur(2px);opacity:0;pointer-events:none;transition:opacity .3s}
.n-scrim.open{opacity:1;pointer-events:auto}
.n-fab{position:fixed;bottom:124px;right:24px;z-index:9999;width:56px;height:56px;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,var(--teal) 0%,#00b4d8 100%);box-shadow:0 6px 24px rgba(0,229,192,.35);transition:all .35s cubic-bezier(.34,1.56,.64,1);animation:n-ring 3s ease-in-out infinite}
.n-fab:hover{transform:scale(1.12)}
.n-fab.open{animation:none;background:linear-gradient(135deg,var(--coral) 0%,#e05555 100%);transform:rotate(90deg)}
@keyframes n-ring{0%,100%{box-shadow:0 6px 24px rgba(0,229,192,.35),0 0 0 0 rgba(0,229,192,.28)}50%{box-shadow:0 6px 24px rgba(0,229,192,.35),0 0 0 12px rgba(0,229,192,0)}}
.n-fab-icon{font-size:24px;line-height:1}
.n-fab-badge{position:absolute;top:-3px;right:-3px;min-width:20px;height:20px;border-radius:10px;background:var(--coral);color:#fff;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;border:2.5px solid var(--bg);padding:0 5px;opacity:0;transform:scale(0);transition:all .3s cubic-bezier(.34,1.56,.64,1)}
.n-fab-badge.show{opacity:1;transform:scale(1)}
.n-overlay{position:fixed;bottom:194px;right:24px;z-index:9998;width:340px;height:520px;background:#081628;border:1px solid var(--border);border-radius:20px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,.55);opacity:0;transform:translateY(20px) scale(.94);pointer-events:none;transition:all .35s cubic-bezier(.34,1.56,.64,1)}
.n-overlay.open{opacity:1;transform:translateY(0) scale(1);pointer-events:auto}
.n-hdr{padding:16px 16px 12px;flex-shrink:0;border-bottom:1px solid var(--border)}
.n-hdr-top{display:flex;align-items:center;gap:10px;margin-bottom:12px}
.n-avatar{width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,var(--teal),var(--blue));display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
.n-hdr-info{flex:1}
.n-hdr-name{font-family:'Playfair Display',serif;font-size:15px;font-weight:600;color:var(--txt)}
.n-hdr-sub{font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--txt3);margin-top:2px;display:flex;align-items:center;gap:4px}
.n-hdr-sub .dot{width:5px;height:5px;border-radius:50%;background:var(--teal)}
.n-close{width:30px;height:30px;border-radius:8px;border:1px solid var(--border);background:var(--bg-up);color:var(--txt3);font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center}
.n-quick{display:flex;flex-wrap:wrap;gap:5px}
.n-qbtn{padding:5px 11px;border-radius:20px;font-size:11px;font-family:'DM Sans',sans-serif;cursor:pointer;transition:all .2s;background:var(--bg-up);border:1px solid var(--border);color:var(--txt2);display:flex;align-items:center;gap:4px}
.n-qbtn:hover{border-color:rgba(0,229,192,.4);color:var(--teal);background:rgba(0,229,192,.06)}
.n-qbtn:disabled{opacity:.4;cursor:not-allowed}
.n-msgs{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:8px}
.n-msgs::-webkit-scrollbar{width:4px}
.n-msgs::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px}
.n-msg{padding:10px 13px;border-radius:12px;font-size:12.5px;line-height:1.65;max-width:88%;font-family:'DM Sans',sans-serif}
.n-msg.sys{background:rgba(14,37,68,.6);color:var(--txt3);border:1px solid rgba(26,53,85,.5);align-self:center;max-width:100%;text-align:center;font-size:11px;font-style:italic;border-radius:8px}
.n-msg.user{background:rgba(59,158,255,.12);border:1px solid rgba(59,158,255,.22);color:var(--txt);align-self:flex-end;border-radius:14px 14px 3px 14px}
.n-msg.bot{background:rgba(0,229,192,.06);border:1px solid rgba(0,229,192,.15);color:var(--txt);align-self:flex-start;border-radius:14px 14px 14px 3px}
.n-dots{display:flex;gap:5px;padding:12px 14px;align-self:flex-start;align-items:center}
.n-dots span{width:7px;height:7px;border-radius:50%;background:var(--teal);animation:n-bounce 1.2s ease-in-out infinite}
.n-dots span:nth-child(2){animation-delay:.15s}.n-dots span:nth-child(3){animation-delay:.3s}
@keyframes n-bounce{0%,80%,100%{transform:translateY(0);opacity:.35}40%{transform:translateY(-7px);opacity:1}}
.n-input-bar{padding:10px 14px 16px;flex-shrink:0;border-top:1px solid var(--border);display:flex;gap:8px;align-items:flex-end}
.n-ta{flex:1;background:var(--bg-up);border:1px solid var(--border);border-radius:12px;padding:9px 13px;color:var(--txt);font-family:'DM Sans',sans-serif;font-size:12.5px;outline:none;resize:none;min-height:40px;max-height:90px;line-height:1.5;transition:border-color .2s}
.n-ta:focus{border-color:var(--teal)}
.n-ta::placeholder{color:var(--txt4)}
.n-ta:disabled{opacity:.5}
.n-send{width:40px;height:40px;flex-shrink:0;background:linear-gradient(135deg,var(--teal),#00b4d8);border:none;border-radius:12px;color:var(--bg);font-size:18px;font-weight:700;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center}
.n-send:hover{transform:scale(1.08)}
.n-send:disabled{opacity:.4;cursor:not-allowed;transform:none}
::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:var(--border);border-radius:3px}::-webkit-scrollbar-thumb:hover{background:var(--border-hi)}
`;