import { useState, useMemo } from "react";

// ── Font + CSS Injection ────────────────────────────────────────────
(() => {
  if (document.getElementById("billing-fonts")) return;
  const l = document.createElement("link"); l.id = "billing-fonts";
  l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "billing-css";
  s.textContent = `
    @keyframes bill-fade { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
    @keyframes bill-shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
    @keyframes bill-glow { 0%,100%{opacity:.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.01)} }
    .bill-fade { animation: bill-fade .3s ease forwards; }
    .bill-nav { transition: all .18s ease; cursor: pointer; }
    .bill-nav:hover { transform: translateX(3px); }
    .bill-shimmer {
      background: linear-gradient(90deg,#e8f4ff 0%,#fff 30%,#f5a623 55%,#e8f4ff 100%);
      background-size: 250% auto; -webkit-background-clip: text;
      -webkit-text-fill-color: transparent; background-clip: text;
      animation: bill-shimmer 5s linear infinite;
    }
    select option { background: #0e2340; color: #c8ddf0; }
    ::-webkit-scrollbar { width: 3px; height: 3px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(42,77,114,0.5); border-radius: 2px; }
    .mdm-row { transition: background .15s, border-color .15s; }
    .mdm-row:hover { background: rgba(22,45,79,0.5) !important; }
    .mdm-cell { transition: all .18s; cursor: pointer; }
    .mdm-cell:hover { transform: translateY(-1px); }
  `;
  document.head.appendChild(s);
})();

// ── Tokens ──────────────────────────────────────────────────────────
const T = {
  bg:"#050f1e", panel:"#081628", card:"#0b1e36", up:"#0e2544",
  b:"rgba(26,53,85,0.8)", bhi:"rgba(42,79,122,0.9)",
  txt:"#e8f0fe", txt2:"#8aaccc", txt3:"#4a6a8a", txt4:"#2e4a6a",
  coral:"#ff6b6b", gold:"#f5c842", teal:"#00e5c0", blue:"#3b9eff",
  orange:"#ff9f43", purple:"#9b6dff", green:"#3dffa0", cyan:"#00d4ff",
  rose:"#f472b6",  // Fix 2: was undefined; used in catColors
};

// ── Section Definitions ─────────────────────────────────────────────
const SECTIONS = [
  { id:"em_calc",    icon:"🧮", label:"E&M Calculator",      sub:"CMS MDM-based coding 2024+",   color:T.gold,   gl:"rgba(245,200,66,0.12)",  br:"rgba(245,200,66,0.4)"  },
  { id:"critical",   icon:"🚨", label:"Critical Care",        sub:"99291/99292 time-based",       color:T.coral,  gl:"rgba(255,107,107,0.12)", br:"rgba(255,107,107,0.4)" },
  { id:"rvu_track",  icon:"📊", label:"Shift RVU Tracker",    sub:"Encounter log & totals",       color:T.teal,   gl:"rgba(0,229,192,0.12)",   br:"rgba(0,229,192,0.4)"   },
  { id:"proc_rvu",   icon:"💉", label:"Procedure RVUs",       sub:"wRVU reference table",         color:T.blue,   gl:"rgba(59,158,255,0.12)",  br:"rgba(59,158,255,0.4)"  },
  { id:"modifiers",  icon:"🔖", label:"Modifiers & Compliance",sub:"Common ED modifiers",         color:T.purple, gl:"rgba(155,109,255,0.12)", br:"rgba(155,109,255,0.4)" },
];

// ── CMS MDM Data (AMA/CMS 2023+ guidelines) ──────────────────────────
const MDM_LEVELS = [
  {
    code: "99281", label: "Level 1", mdm: "N/A — Minimal",
    wRVU: 0.48, peRVU: 0.39, mpRVU: 0.04,
    color: T.txt3, bg: "rgba(74,106,138,0.15)",
    copa: "None — may not require physician",
    data: "None",
    risk: "Minimal or none",
    clinEx: "Insect bite (uncomplicated), splinter removal",
    criteria: "May not require physician/QHP presence",
  },
  {
    code: "99282", label: "Level 2", mdm: "Straightforward",
    wRVU: 0.93, peRVU: 0.56, mpRVU: 0.06,
    color: T.teal, bg: "rgba(0,229,192,0.1)",
    copa: "Minimal: 1 self-limited/minor problem",
    data: "Minimal/None",
    risk: "Minimal: OTC drugs, rest, Foley, superficial dressing",
    clinEx: "Localized skin rash, sunburn, uncomplicated UTI symptoms",
    criteria: "Straightforward MDM",
  },
  {
    code: "99283", label: "Level 3", mdm: "Low Complexity",
    wRVU: 1.60, peRVU: 0.80, mpRVU: 0.10,
    color: T.blue, bg: "rgba(59,158,255,0.1)",
    copa: "Low: 2+ self-limited; 1 stable chronic illness; 1 acute uncomplicated illness/injury",
    data: "Limited: Order/review test(s); OR review external records; OR independent interpretation (non-separately billed)",
    risk: "Low: Prescription drug management; minor surgery no risk factors; PT/OT",
    clinEx: "Simple fracture, cellulitis, mild asthma exacerbation, gastroenteritis",
    criteria: "Low MDM: ≥2 of 3 elements at Low level",
  },
  {
    code: "99284", label: "Level 4", mdm: "Moderate Complexity",
    wRVU: 2.74, peRVU: 1.15, mpRVU: 0.18,
    color: T.orange, bg: "rgba(255,159,67,0.1)",
    copa: "Moderate: 1+ chronic illness with exacerbation; 1 undiagnosed new problem with uncertain prognosis; 1 acute illness with systemic symptoms; 1 acute complicated injury",
    data: "Moderate: Review/order unique test(s) AND independent interpretation AND/OR external provider discussion",
    risk: "Moderate: New/changed Rx requiring monitoring; minor surgery with identified risk factors; SDH limiting diagnosis/tx",
    clinEx: "Chest pain workup, acute kidney injury, pneumonia admission, complicated fracture",
    criteria: "Moderate MDM: ≥2 of 3 elements at Moderate level",
  },
  {
    code: "99285", label: "Level 5", mdm: "High Complexity",
    wRVU: 4.00, peRVU: 1.50, mpRVU: 0.27,
    color: T.coral, bg: "rgba(255,107,107,0.1)",
    copa: "High: 1+ chronic illness with severe exacerbation/progression; acute illness/injury posing threat to life or bodily function",
    data: "Extensive: Independent interpretation (not separately billed) AND independent historian AND/OR discussion with external provider",
    risk: "High: Drug therapy requiring intensive monitoring for toxicity; decision for major surgery or hospitalization; DNR/de-escalation",
    clinEx: "STEMI, STEMI-equivalent, septic shock, intracranial hemorrhage, respiratory failure",
    criteria: "High MDM: ≥2 of 3 elements at High level",
  },
];

// ── MDM Scoring Grid ─────────────────────────────────────────────────
const COPA_OPTIONS = [
  { id:"minimal",  label:"Minimal", sub:"1 self-limited/minor problem", level:1 },
  { id:"low",      label:"Low",     sub:"2+ self-limited; 1 stable chronic; 1 acute uncomplicated", level:2 },
  { id:"moderate", label:"Moderate",sub:"Chronic w/ exacerbation; new uncertain diagnosis; acute w/ systemic sx; complicated injury", level:3 },
  { id:"high",     label:"High",    sub:"Threat to life or bodily function; severe chronic exacerbation", level:4 },
];

const DATA_OPTIONS = [
  { id:"minimal", label:"Minimal/None", sub:"No data review beyond the encounter", level:1 },
  { id:"limited", label:"Limited",      sub:"Order/review test(s); OR external records; OR independent interpretation (not separately billed)", level:2 },
  { id:"moderate",label:"Moderate",     sub:"Review/order tests AND independent interpretation AND/OR external provider discussion", level:3 },
  { id:"extensive",label:"Extensive",   sub:"Independent interpretation + independent historian + external provider discussion/review", level:4 },
];

const RISK_OPTIONS = [
  { id:"minimal",  label:"Minimal",  sub:"OTC drugs; rest; Foley catheter; superficial dressing changes", level:1 },
  { id:"low",      label:"Low",      sub:"Prescription drug management; minor surgery no risk factors; PT/OT; imaging no risk factors", level:2 },
  { id:"moderate", label:"Moderate", sub:"New/changed Rx requiring monitoring; minor surgery with risk factors; SDH limiting treatment; imaging elevated risk", level:3 },
  { id:"high",     label:"High",     sub:"Drug therapy requiring intensive toxicity monitoring; decision to hospitalize; major surgery with risk factors; DNR/de-escalation decisions", level:4 },
];

const LEVEL_MAP = {
  1: { code:"99281", label:"Level 1", mdm:"N/A / Minimal",     wRVU:0.48, color:T.txt3  },
  2: { code:"99282", label:"Level 2", mdm:"Straightforward",    wRVU:0.93, color:T.teal  },
  3: { code:"99283", label:"Level 3", mdm:"Low Complexity",     wRVU:1.60, color:T.blue  },
  4: { code:"99284", label:"Level 4", mdm:"Moderate Complexity",wRVU:2.74, color:T.orange},
  5: { code:"99285", label:"Level 5", mdm:"High Complexity",    wRVU:4.00, color:T.coral },
};

// ── Procedure RVU Data ─────────────────────────────────────────────
const PROC_RVUS = [
  // Airway
  { cpt:"31500", name:"Emergency endotracheal intubation",       cat:"Airway",        wRVU:3.00 },
  { cpt:"31603", name:"Cricothyrotomy",                          cat:"Airway",        wRVU:6.00 },
  { cpt:"94002", name:"Ventilation management, inpatient",       cat:"Airway",        wRVU:3.86 },
  // Vascular
  { cpt:"36556", name:"Central venous catheter (≥5 yrs)",        cat:"Vascular",      wRVU:1.75 },
  { cpt:"36625", name:"Arterial line placement",                 cat:"Vascular",      wRVU:1.53 },
  { cpt:"36680", name:"Intraosseous catheter placement",         cat:"Vascular",      wRVU:1.23 },
  { cpt:"36569", name:"PICC line insertion",                     cat:"Vascular",      wRVU:1.80 },
  // Wound Repair
  { cpt:"12001", name:"Simple repair ≤2.5 cm (scalp/neck/ax)",   cat:"Wound Repair",  wRVU:1.45 },
  { cpt:"12002", name:"Simple repair 2.6–7.5 cm",               cat:"Wound Repair",  wRVU:1.14 },
  { cpt:"12032", name:"Intermediate repair 2.6–7.5 cm",         cat:"Wound Repair",  wRVU:2.52 },
  { cpt:"12051", name:"Intermediate repair, face ≤2.5 cm",      cat:"Wound Repair",  wRVU:3.28 },
  { cpt:"13100", name:"Complex repair, trunk 1.1–2.5 cm",       cat:"Wound Repair",  wRVU:4.00 },
  // Cardiac
  { cpt:"92960", name:"External electrical cardioversion",       cat:"Cardiac",       wRVU:2.82 },
  { cpt:"32551", name:"Tube thoracostomy",                       cat:"Thoracic",      wRVU:3.24 },
  { cpt:"32422", name:"Thoracentesis, therapeutic",              cat:"Thoracic",      wRVU:2.73 },
  // Critical Care
  { cpt:"99291", name:"Critical care, first 30–74 min",         cat:"Critical Care", wRVU:4.50 },
  { cpt:"99292", name:"Critical care, each additional 30 min",  cat:"Critical Care", wRVU:2.25 },
  // Drainage
  { cpt:"10060", name:"I&D abscess, simple",                    cat:"Drainage",      wRVU:1.22 },
  { cpt:"10061", name:"I&D abscess, complicated",               cat:"Drainage",      wRVU:2.42 },
  { cpt:"49083", name:"Paracentesis",                           cat:"Drainage",      wRVU:1.78 },
  // Ortho
  { cpt:"23650", name:"Shoulder dislocation, closed reduction", cat:"Ortho",         wRVU:3.94 },
  { cpt:"29125", name:"Short arm splint, static",               cat:"Ortho",         wRVU:0.80 },
  { cpt:"29515", name:"Short leg splint",                       cat:"Ortho",         wRVU:0.90 },
  { cpt:"20610", name:"Joint aspiration/injection, major",      cat:"Ortho",         wRVU:1.00 },
  // Neuro
  { cpt:"62270", name:"Lumbar puncture, diagnostic",            cat:"Neuro",         wRVU:2.20 },
  // Procedural Sedation
  { cpt:"99152", name:"Procedural sedation, first 15 min",      cat:"Sedation",      wRVU:1.34 },
  { cpt:"99153", name:"Procedural sedation, each add'l 15 min", cat:"Sedation",      wRVU:0.67 },
  // Diagnostics
  { cpt:"93000", name:"ECG with interpretation",                cat:"Diagnostic",    wRVU:0.17 },
  { cpt:"96374", name:"IV push, single drug",                   cat:"Diagnostic",    wRVU:0.58 },
];

// ── Modifiers ────────────────────────────────────────────────────────
const MODIFIERS = [
  { mod:"25", name:"Significant, Separately Identifiable E&M",  color:T.teal,   usage:"Use when performing a procedure AND a separate, significant E&M service on the same day. E.g., laceration repair (12002) + 99284-25. REQUIRED for same-day E&M + procedure billing.",    pitfall:"Do NOT use routinely — must be a separately identifiable, documented E&M beyond the procedure itself." },
  { mod:"27", name:"Multiple Outpatient E&M — Same Day",        color:T.blue,   usage:"Multiple outpatient E&M encounters in the same day by same physician. Rarely used in ED.",                                                                                               pitfall:"Not typically applicable in standard ED billing." },
  { mod:"59", name:"Distinct Procedural Service",               color:T.orange, usage:"Procedures not normally reported together but appropriate in specific circumstances. Differentiates from bundled services. Used when two procedures are performed on different anatomic sites or different sessions.",  pitfall:"Overuse is an OIG audit target. Document separately clearly." },
  { mod:"91", name:"Repeat Clinical Diagnostic Lab Test",       color:T.purple, usage:"Same lab test repeated on same day to obtain subsequent test results. NOT for confirmation of initial results.",                                                                          pitfall:"Cannot be used for tests rerun due to specimen issues or equipment malfunction." },
  { mod:"GT", name:"Telehealth Service",                        color:T.cyan,   usage:"Service provided via telehealth technology. Required by Medicare for real-time audio/visual telehealth claims post-PHE (policy evolving — verify current payer rules).",                   pitfall:"Check current CMS waivers — policies in flux post-COVID PHE." },
  { mod:"GC", name:"Service Performed Under Supervision",       color:T.green,  usage:"Service performed in part by resident under supervision per Medicare teaching rules. Required in teaching hospitals when resident participates in billable service.",                    pitfall:"Two-midnight rule and teaching physician documentation requirements must be met." },
  { mod:"GE", name:"Teaching Physician — Not Primary Surgeon",  color:T.green,  usage:"Teaching physician service furnished by resident in a primary care exception.",                                                                                                           pitfall:"Limited specialties eligible. EM generally requires GC modifier, not GE." },
  { mod:"XE", name:"Separate Encounter (NCCI-preferred over 59)",color:T.gold,  usage:"Service distinct because it occurred during a separate encounter. Preferred NCCI bypass modifier over 59 in many payer policies.",                                                      pitfall:"Payer-specific — not all accept XE in place of 59. Verify per payer." },
  { mod:"XU", name:"Unusual Non-Overlapping Service",           color:T.gold,   usage:"Service non-overlapping with main service. Another NCCI-preferred modifier replacing -59 in selected scenarios.",                                                                         pitfall:"Requires documentation of distinct, non-overlapping service." },
  { mod:"52", name:"Reduced Services",                          color:T.txt3,   usage:"Physician reduces or eliminates a portion of a service. Used when a procedure is partially completed.",                                                                                  pitfall:"Do NOT use to reduce E&M levels — use correct E&M code instead." },
  { mod:"CR", name:"Catastrophe / Disaster Related",            color:T.coral,  usage:"Service furnished as a result of a catastrophe or disaster (declared emergency or presidentially declared disaster).",                                                                   pitfall:"Requires active federal/state disaster declaration to apply." },
];

// ── Glass Helpers ────────────────────────────────────────────────────
const glass = (extra = {}) => ({
  backdropFilter:"blur(24px) saturate(200%)",
  WebkitBackdropFilter:"blur(24px) saturate(200%)",
  background:"rgba(8,22,40,0.75)",
  border:"1px solid rgba(26,53,85,0.45)",
  borderRadius:14,
  ...extra,
});
const deepGlass = (extra = {}) => ({
  backdropFilter:"blur(40px) saturate(220%)",
  WebkitBackdropFilter:"blur(40px) saturate(220%)",
  background:"rgba(5,15,30,0.88)",
  border:"1px solid rgba(26,53,85,0.7)",
  ...extra,
});

// ── CMS Conversion Factor 2026 ───────────────────────────────────────
const CF_2026 = 33.40;
// CF_2025 = 32.35 — displayed in UI but not used in calculations

// ═══════════════════════════════════════════════════════════════════
// E&M CALCULATOR PANEL
// ═══════════════════════════════════════════════════════════════════
function EMCalcPanel({ color }) {
  const [copa, setCopa] = useState(null);
  const [data, setData] = useState(null);
  const [risk, setRisk] = useState(null);
  const [copied, setCopied] = useState(false);

  // CMS rule: 2 of 3 elements must meet or exceed the selected level
  // Fix: memoized so it only recalculates when selections change
  const result = useMemo(() => {
    if (!copa && !data && !risk) return null;
    const levels = [copa, data, risk].filter(Boolean).map(x => x.level);
    if (levels.length < 2) return null;
    const sorted = [...levels].sort((a,b)=>a-b);
    // 2-of-3 rule: take the minimum of the two highest-scoring elements
    const top2 = sorted.slice(-2);
    const levelScore = top2[0]; // lower of the two highest = the qualifying level
    if (levelScore >= 4) return LEVEL_MAP[5];
    if (levelScore === 3) return LEVEL_MAP[4];
    if (levelScore === 2) return LEVEL_MAP[3];
    return LEVEL_MAP[2];
  }, [copa, data, risk]);

  const totalRVU = useMemo(() => {
    if (!result) return 0;
    const m = MDM_LEVELS.find(m => m.code === result.code);
    return m ? m.wRVU + m.peRVU + m.mpRVU : 0;
  }, [result]);

  const est2026 = result ? (totalRVU * CF_2026).toFixed(2) : null;

  const OptionGroup = ({ title, options, selected, onSelect, accent }) => (
    <div style={{marginBottom:16}}>
      <div style={{fontFamily:"JetBrains Mono",fontSize:10,color:accent,textTransform:"uppercase",letterSpacing:2,marginBottom:8}}>{title}</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8}}>
        {options.map(opt=>{
          const isSel = selected?.id === opt.id;
          return (
            <div key={opt.id} className="mdm-cell" onClick={()=>onSelect(isSel?null:opt)}
              style={{padding:"11px 14px",borderRadius:10,background:isSel?`${accent}22`:"rgba(14,37,68,0.6)",border:`1px solid ${isSel?accent+"88":"rgba(26,53,85,0.5)"}`,cursor:"pointer"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                <div style={{width:10,height:10,borderRadius:"50%",background:isSel?accent:"rgba(74,106,138,0.4)",flexShrink:0,boxShadow:isSel?`0 0 6px ${accent}`:""}}/>
                <span style={{fontFamily:"DM Sans",fontWeight:700,fontSize:13,color:isSel?T.txt:T.txt2}}>{opt.label}</span>
              </div>
              <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt3,lineHeight:1.5,paddingLeft:18}}>{opt.sub}</div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const copy = () => {
    if(result) { navigator.clipboard.writeText(result.code); setCopied(true); setTimeout(()=>setCopied(false),1500); }
  };

  return (
    <div className="bill-fade" style={{display:"flex",gap:14}}>
      {/* Left: MDM Selector */}
      <div style={{flex:1,minWidth:0}}>
        {/* CMS Rule Banner */}
        <div style={{...glass({borderRadius:12,background:"rgba(245,200,66,0.06)",borderColor:"rgba(245,200,66,0.25)"}),padding:"12px 16px",marginBottom:14}}>
          <div style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.gold,letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>CMS / AMA 2023+ RULE — ED E&M CODING</div>
          <div style={{fontFamily:"DM Sans",fontSize:12.5,color:T.txt2,lineHeight:1.7}}>
            ED E&M level (99281–99285) is determined <strong style={{color:T.txt}}>exclusively by Medical Decision Making (MDM)</strong>. Time is <strong style={{color:T.coral}}>not</strong> a descriptor for ED E&M codes. To qualify for a level, <strong style={{color:T.gold}}>2 of 3 MDM elements</strong> must be met or exceeded. History and physical exam are required but <strong style={{color:T.txt}}>do not drive the level</strong>.
          </div>
        </div>

        <OptionGroup title="Element 1 — Number & Complexity of Problems Addressed (COPA)" options={COPA_OPTIONS} selected={copa} onSelect={setCopa} accent={T.teal}/>
        <OptionGroup title="Element 2 — Amount & Complexity of Data Reviewed / Analyzed" options={DATA_OPTIONS} selected={data} onSelect={setData} accent={T.blue}/>
        <OptionGroup title="Element 3 — Risk of Complications &/or Morbidity/Mortality" options={RISK_OPTIONS} selected={risk} onSelect={setRisk} accent={T.orange}/>

        {/* MDM Reference Table */}
        <div style={{...glass({borderRadius:12}),overflow:"hidden",marginTop:4}}>
          <div style={{padding:"10px 16px",fontFamily:"JetBrains Mono",fontSize:9,color:T.txt3,textTransform:"uppercase",letterSpacing:2,borderBottom:"1px solid rgba(26,53,85,0.4)"}}>
            ED E&M LEVEL REFERENCE TABLE (AMA CPT / CMS 2023+)
          </div>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead>
                <tr style={{borderBottom:"1px solid rgba(26,53,85,0.5)"}}>
                  {["Code","Level","MDM","COPA","Data","Risk","wRVU","Clin. Example"].map(h=>(
                    <th key={h} style={{padding:"9px 12px",textAlign:"left",fontSize:10,fontWeight:700,color:T.txt3,textTransform:"uppercase",letterSpacing:".06em",whiteSpace:"nowrap"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MDM_LEVELS.map((m,i)=>(
                  <tr key={m.code} className="mdm-row" style={{borderBottom:"1px solid rgba(26,53,85,0.25)",background:"transparent"}}>
                    <td style={{padding:"9px 12px",fontFamily:"JetBrains Mono",fontWeight:700,color:m.color,whiteSpace:"nowrap"}}>{m.code}</td>
                    <td style={{padding:"9px 12px",fontFamily:"DM Sans",fontWeight:600,color:T.txt,whiteSpace:"nowrap"}}>{m.label}</td>
                    <td style={{padding:"9px 12px",color:m.color,fontWeight:600,fontSize:11,whiteSpace:"nowrap"}}>{m.mdm}</td>
                    <td style={{padding:"9px 12px",color:T.txt2,maxWidth:180,fontSize:11}}>{m.copa}</td>
                    <td style={{padding:"9px 12px",color:T.txt2,maxWidth:180,fontSize:11}}>{m.data}</td>
                    <td style={{padding:"9px 12px",color:T.txt2,maxWidth:180,fontSize:11}}>{m.risk}</td>
                    <td style={{padding:"9px 12px",fontFamily:"JetBrains Mono",fontWeight:700,color:m.color,whiteSpace:"nowrap"}}>{m.wRVU}</td>
                    <td style={{padding:"9px 12px",color:T.txt3,fontSize:11,fontStyle:"italic"}}>{m.clinEx}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right: Result */}
      <div style={{width:260,flexShrink:0,display:"flex",flexDirection:"column",gap:10}}>
        {/* Result Card */}
        <div style={{...glass({borderRadius:14,background:result?`linear-gradient(135deg,${result.color}18,rgba(8,22,40,0.88))`:"rgba(8,22,40,0.75)",borderColor:result?result.color+"55":"rgba(26,53,85,0.45)"}),padding:"20px 18px",textAlign:"center"}}>
          {!result ? (
            <>
              <div style={{fontSize:36,marginBottom:10}}>🧮</div>
              <div style={{fontFamily:"DM Sans",fontSize:13,color:T.txt3}}>Select options from any 2 of the 3 MDM elements to calculate your E&M level</div>
            </>
          ) : (
            <>
              <div style={{fontFamily:"JetBrains Mono",fontSize:11,color:result.color,textTransform:"uppercase",letterSpacing:2,marginBottom:4}}>RESULT</div>
              <div style={{fontFamily:"Playfair Display",fontSize:54,fontWeight:900,color:result.color,lineHeight:1}}>{result.code}</div>
              <div style={{fontFamily:"DM Sans",fontWeight:700,fontSize:15,color:T.txt,marginTop:4}}>{result.label}</div>
              <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt3,marginTop:2,marginBottom:16}}>{result.mdm}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                <div style={{background:"rgba(5,15,30,0.5)",borderRadius:8,padding:"10px 8px"}}>
                  <div style={{fontFamily:"JetBrains Mono",fontSize:20,fontWeight:700,color:result.color}}>{result.wRVU}</div>
                  <div style={{fontFamily:"DM Sans",fontSize:10,color:T.txt3,marginTop:2}}>Work wRVU</div>
                </div>
                <div style={{background:"rgba(5,15,30,0.5)",borderRadius:8,padding:"10px 8px"}}>
                  <div style={{fontFamily:"JetBrains Mono",fontSize:20,fontWeight:700,color:T.teal}}>{est2026}</div>
                  <div style={{fontFamily:"DM Sans",fontSize:10,color:T.txt3,marginTop:2}}>Est. Medicare '26</div>
                </div>
              </div>
              <button onClick={copy} style={{width:"100%",padding:"9px",borderRadius:9,background:`${result.color}22`,border:`1px solid ${result.color}55`,color:result.color,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"DM Sans"}}>
                {copied?"✓ Copied!":"📋 Copy CPT Code"}
              </button>
            </>
          )}
        </div>

        {/* Selected elements summary */}
        {result && (
          <div style={{...glass({borderRadius:12}),padding:"14px 16px"}}>
            <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt3,textTransform:"uppercase",letterSpacing:2,marginBottom:10}}>ELEMENTS MET</div>
            {[{label:"COPA",val:copa,c:T.teal},{label:"Data",val:data,c:T.blue},{label:"Risk",val:risk,c:T.orange}].map(el=>(
              <div key={el.label} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <div style={{width:6,height:6,borderRadius:"50%",background:el.val?el.c:T.txt4,flexShrink:0}}/>
                <span style={{fontFamily:"DM Sans",fontSize:12,color:el.val?T.txt:T.txt3,flex:1}}><strong style={{color:el.c}}>{el.label}:</strong> {el.val?.label||"Not selected"}</span>
              </div>
            ))}
          </div>
        )}

        {/* RVU breakdown */}
        {result && (
          <div style={{...glass({borderRadius:12}),padding:"14px 16px"}}>
            <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt3,textTransform:"uppercase",letterSpacing:2,marginBottom:10}}>RVU BREAKDOWN — {result.code}</div>
            {(() => {
              const m = MDM_LEVELS.find(x=>x.code===result.code);
              return [
                {label:"Work RVU (wRVU)",val:m.wRVU,pct:"~72%",c:result.color},
                {label:"Practice Exp. (Facility)",val:m.peRVU,pct:"~23%",c:T.blue},
                {label:"Malpractice RVU",val:m.mpRVU,pct:"~5%",c:T.purple},
                {label:"Total RVU",val:(m.wRVU+m.peRVU+m.mpRVU).toFixed(2),pct:"",c:T.txt,bold:true},
              ].map((row,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:i<3?"1px solid rgba(26,53,85,0.3)":"none"}}>
                  <span style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,fontWeight:row.bold?700:400}}>{row.label}</span>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    {row.pct && <span style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4}}>{row.pct}</span>}
                    <span style={{fontFamily:"JetBrains Mono",fontWeight:700,fontSize:13,color:row.c}}>{row.val}</span>
                  </div>
                </div>
              ));
            })()}
            <div style={{marginTop:10,padding:"8px 10px",background:"rgba(5,15,30,0.5)",borderRadius:8}}>
              <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt3,marginBottom:2}}>Medicare Est. (2026 CF: $33.40)</div>
              <div style={{fontFamily:"JetBrains Mono",fontSize:16,fontWeight:700,color:result.color}}>${est2026}</div>
              <div style={{fontFamily:"DM Sans",fontSize:10,color:T.txt4,marginTop:2}}>Before GPCI adjustment · Facility rate</div>
            </div>
          </div>
        )}

        {/* Documentation requirements */}
        <div style={{...glass({borderRadius:12,background:"rgba(0,229,192,0.04)",borderColor:"rgba(0,229,192,0.2)"}),padding:"14px 16px"}}>
          <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.teal,textTransform:"uppercase",letterSpacing:2,marginBottom:8}}>DOCUMENTATION REQUIREMENTS</div>
          {[
            "Medically appropriate History and Physical Exam (required but do not drive level)",
            "Clearly document all problems/diagnoses addressed — do not rely on final Dx alone",
            "Comorbidities that affect management MUST be documented to count",
            "Independent interpretation: document thought process even if not a formal report",
            "External provider discussions: document who, when, and content",
            "\"Final Dx does not determine complexity\" — prudent layperson standard applies",
          ].map((tip,i)=>(
            <div key={i} style={{display:"flex",gap:8,marginBottom:7,alignItems:"flex-start"}}>
              <span style={{color:T.teal,fontSize:10,marginTop:2,flexShrink:0}}>▸</span>
              <span style={{fontFamily:"DM Sans",fontSize:11.5,color:T.txt2,lineHeight:1.55}}>{tip}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// CRITICAL CARE PANEL
// ═══════════════════════════════════════════════════════════════════
function CriticalCarePanel({ color }) {
  const [minutes, setMinutes] = useState("");
  const [notes, setNotes] = useState("");
  const [copied, setCopied] = useState(false);

  const min = parseInt(minutes) || 0;
  const qualifies = min >= 30;

  const calc = useMemo(() => {
    if (!qualifies) return null;
    // Fix 3: removed duplicate `if (min < 30)` check — qualifies already covers it
    // Fix 4: removed `qualifies` from deps — it's derived from `min`
    const remainder = min - 74;
    const fullPeriods = remainder > 0 ? Math.floor(remainder / 30) : 0;
    const partial = remainder > 0 ? (remainder % 30 >= 15 ? 1 : 0) : 0;
    const addCodes = fullPeriods + partial;
    const wRVU = 4.50 + addCodes * 2.25;
    const est = (wRVU * 1.35 * CF_2026).toFixed(2);
    return { codes: addCodes, wRVU, est };
  },[min]);

  const BUNDLED = [
    "CPR (92950) — NOT separately billable during critical care time",
    "Interpretation of cardiac output (93561/93562) — bundled",
    "Pulse oximetry (94760/94761/94762) — bundled",
    "Chest X-ray interpretation (71046) — bundled",
    "Blood gas interpretation (included in time)",
    "Gastric intubation (43752) — bundled",
    "Temporary transcutaneous pacing (92953) — bundled",
    "Vascular access (36000, 36410, 36415, 36591) — bundled",
  ];

  const BILLABLE_SEPARATE = [
    "Endotracheal intubation (31500) ✓",
    "Central line (36556) ✓",
    "Arterial line (36625) ✓",
    "Chest tube (32551) ✓",
    "Pericardiocentesis (33010) ✓",
    "Cardioversion (92960) ✓",
    "Lumbar puncture (62270) ✓",
    "Diagnostic ultrasound — when separately documented ✓",
  ];

  const copy = () => {
    const str = calc ? (calc.codes > 0 ? `99291\n99292 × ${calc.codes}` : "99291") : "";
    navigator.clipboard.writeText(str); setCopied(true); setTimeout(()=>setCopied(false),1500);
  };

  return (
    <div className="bill-fade" style={{display:"flex",gap:14,flexWrap:"wrap"}}>
      {/* Calculator */}
      <div style={{flex:1,minWidth:280}}>
        <div style={{...glass({borderRadius:12,background:"rgba(255,107,107,0.05)",borderColor:"rgba(255,107,107,0.25)"}),padding:"14px 16px",marginBottom:14}}>
          <div style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.coral,textTransform:"uppercase",letterSpacing:2,marginBottom:6}}>CMS CRITICAL CARE DEFINITION</div>
          <div style={{fontFamily:"DM Sans",fontSize:12.5,color:T.txt2,lineHeight:1.7}}>
            Critical illness or injury that <strong style={{color:T.txt}}>acutely impairs ≥1 vital organ systems</strong> with high probability of imminent life-threatening deterioration. Provider must spend ≥30 minutes in <strong style={{color:T.txt}}>direct management</strong> of the critically ill patient. Time does <strong style={{color:T.coral}}>not</strong> need to be continuous but must be personally provided by the physician/QHP on that calendar day.
          </div>
        </div>

        <div style={{...glass({borderRadius:12}),padding:"18px 20px",marginBottom:14}}>
          <div style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.coral,textTransform:"uppercase",letterSpacing:2,marginBottom:14}}>CRITICAL CARE TIME CALCULATOR</div>
          <div style={{marginBottom:14}}>
            <label style={{display:"block",fontFamily:"DM Sans",fontSize:11,fontWeight:600,color:T.txt3,textTransform:"uppercase",letterSpacing:".05em",marginBottom:6}}>Total Critical Care Minutes</label>
            <input type="number" min="0" max="600" placeholder="e.g. 90" value={minutes} onChange={e=>setMinutes(e.target.value)}
              style={{width:"100%",background:"rgba(14,37,68,0.8)",border:`1px solid ${min>=30?"rgba(255,107,107,0.5)":"rgba(26,53,85,0.5)"}`,borderRadius:10,padding:"12px 16px",color:T.txt,fontFamily:"JetBrains Mono",fontSize:18,outline:"none",boxSizing:"border-box"}}/>
            <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt3,marginTop:6}}>Include: documentation, reviewing results, speaking with nursing/consultants, bedside care. Exclude: separately billable procedure time.</div>
          </div>

          {/* Visual time bar */}
          {min > 0 && (
            <div style={{marginBottom:16}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.txt3}}>0 min</span>
                <span style={{fontFamily:"JetBrains Mono",fontSize:10,color:min>=74?T.coral:T.gold}}>74 min (99291 max)</span>
              </div>
              <div style={{background:"rgba(26,53,85,0.5)",borderRadius:6,height:10,position:"relative",overflow:"hidden"}}>
                <div style={{width:`${Math.min(100,(min/Math.max(min,120))*100)}%`,height:"100%",background:`linear-gradient(90deg,${T.coral},${T.gold})`,borderRadius:6,transition:"width .3s"}}/>
                <div style={{position:"absolute",top:0,left:`${(30/Math.max(min,120))*100}%`,width:2,height:"100%",background:"rgba(255,255,255,0.3)"}}/>
                <div style={{position:"absolute",top:0,left:`${(74/Math.max(min,120))*100}%`,width:2,height:"100%",background:"rgba(255,255,255,0.2)"}}/>
              </div>
            </div>
          )}

          {!qualifies && min > 0 && (
            <div style={{padding:"12px 14px",background:"rgba(255,107,107,0.08)",border:"1px solid rgba(255,107,107,0.25)",borderRadius:10,fontFamily:"DM Sans",fontSize:12.5,color:T.coral}}>
              ⚠ Minimum 30 minutes required to bill 99291. Currently: {min} min ({30-min} min short).
            </div>
          )}

          {qualifies && calc && (
            <div style={{background:`linear-gradient(135deg,rgba(255,107,107,0.15),rgba(8,22,40,0.9))`,border:"1px solid rgba(255,107,107,0.4)",borderRadius:12,padding:"16px 18px"}}>
              <div style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.coral,textTransform:"uppercase",letterSpacing:2,marginBottom:12}}>BILLING RESULT — {min} MIN</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                <div style={{background:"rgba(5,15,30,0.6)",borderRadius:10,padding:"12px 14px"}}>
                  <div style={{fontFamily:"JetBrains Mono",fontWeight:700,fontSize:22,color:T.coral}}>99291</div>
                  <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt3,marginTop:2}}>First 30–74 min</div>
                  <div style={{fontFamily:"JetBrains Mono",fontWeight:700,fontSize:13,color:T.orange,marginTop:4}}>4.50 wRVU</div>
                </div>
                {calc.codes > 0 && (
                  <div style={{background:"rgba(5,15,30,0.6)",borderRadius:10,padding:"12px 14px"}}>
                    <div style={{fontFamily:"JetBrains Mono",fontWeight:700,fontSize:22,color:T.orange}}>99292 × {calc.codes}</div>
                    <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt3,marginTop:2}}>Each add'l 15–30 min segment</div>
                    <div style={{fontFamily:"JetBrains Mono",fontWeight:700,fontSize:13,color:T.orange,marginTop:4}}>{(calc.codes*2.25).toFixed(2)} wRVU</div>
                  </div>
                )}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
                <div style={{background:"rgba(5,15,30,0.5)",borderRadius:8,padding:"10px 12px",textAlign:"center"}}>
                  <div style={{fontFamily:"JetBrains Mono",fontSize:18,fontWeight:700,color:T.coral}}>{calc.wRVU.toFixed(2)}</div>
                  <div style={{fontFamily:"DM Sans",fontSize:10,color:T.txt3,marginTop:2}}>Total wRVU</div>
                </div>
                <div style={{background:"rgba(5,15,30,0.5)",borderRadius:8,padding:"10px 12px",textAlign:"center"}}>
                  <div style={{fontFamily:"JetBrains Mono",fontSize:18,fontWeight:700,color:T.teal}}>${calc.est}</div>
                  <div style={{fontFamily:"DM Sans",fontSize:10,color:T.txt3,marginTop:2}}>Est. Medicare '26</div>
                </div>
                <div style={{background:"rgba(5,15,30,0.5)",borderRadius:8,padding:"10px 12px",textAlign:"center"}}>
                  <div style={{fontFamily:"JetBrains Mono",fontSize:18,fontWeight:700,color:T.purple}}>{1+calc.codes}</div>
                  <div style={{fontFamily:"DM Sans",fontSize:10,color:T.txt3,marginTop:2}}>Total CPT Lines</div>
                </div>
              </div>
              <button onClick={copy} style={{width:"100%",padding:"9px",borderRadius:9,background:"rgba(255,107,107,0.15)",border:"1px solid rgba(255,107,107,0.4)",color:T.coral,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"DM Sans"}}>
                {copied?"✓ Copied!":"📋 Copy CPT Codes"}
              </button>
            </div>
          )}
        </div>

        {/* Notes field */}
        <div style={{...glass({borderRadius:12}),padding:"14px 16px"}}>
          <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt3,textTransform:"uppercase",letterSpacing:2,marginBottom:8}}>CRITICAL CARE DOCUMENTATION NOTE</div>
          <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={4}
            placeholder="e.g. Provided direct critical care management for this patient with septic shock from pneumonia. Activities included: review of labs, imaging, and culture data; bedside assessment; ventilator management; consultation with nephrology; documentation. Total time: 52 minutes."
            style={{width:"100%",background:"rgba(14,37,68,0.8)",border:"1px solid rgba(26,53,85,0.5)",borderRadius:10,padding:"10px 14px",color:T.txt,fontFamily:"DM Sans",fontSize:13,resize:"vertical",outline:"none",boxSizing:"border-box",lineHeight:1.6}}/>
          <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt3,marginTop:6}}>Document total time spent and specific activities. Procedure time (if separately billed) must be excluded.</div>
        </div>
      </div>

      {/* Right: What counts / doesn't */}
      <div style={{width:280,flexShrink:0,display:"flex",flexDirection:"column",gap:12}}>
        <div style={{...glass({borderRadius:12}),padding:"14px 16px"}}>
          <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.teal,textTransform:"uppercase",letterSpacing:2,marginBottom:10}}>✓ TIME THAT COUNTS</div>
          {["Bedside assessment and management","Reviewing labs, imaging, vitals","Speaking with nursing staff and consultants","Reviewing medical records","Documentation and writing orders","Phone calls with family (if medically related)","Reviewing prior studies and external records"].map((t,i)=>(
            <div key={i} style={{display:"flex",gap:8,marginBottom:7,alignItems:"flex-start"}}>
              <span style={{color:T.teal,fontSize:11,marginTop:1,flexShrink:0}}>✓</span>
              <span style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2}}>{t}</span>
            </div>
          ))}
        </div>

        <div style={{...glass({borderRadius:12,background:"rgba(255,107,107,0.04)",borderColor:"rgba(255,107,107,0.2)"}),padding:"14px 16px"}}>
          <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.coral,textTransform:"uppercase",letterSpacing:2,marginBottom:10}}>✕ BUNDLED — DO NOT COUNT</div>
          {BUNDLED.map((t,i)=>(
            <div key={i} style={{display:"flex",gap:8,marginBottom:6,alignItems:"flex-start"}}>
              <span style={{color:T.coral,fontSize:10,marginTop:2,flexShrink:0}}>✕</span>
              <span style={{fontFamily:"DM Sans",fontSize:11.5,color:T.txt3}}>{t}</span>
            </div>
          ))}
        </div>

        <div style={{...glass({borderRadius:12,background:"rgba(61,255,160,0.04)",borderColor:"rgba(61,255,160,0.2)"}),padding:"14px 16px"}}>
          <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.green,textTransform:"uppercase",letterSpacing:2,marginBottom:10}}>✓ SEPARATELY BILLABLE W/ CRITICAL CARE</div>
          {BILLABLE_SEPARATE.map((t,i)=>(
            <div key={i} style={{display:"flex",gap:8,marginBottom:6,alignItems:"flex-start"}}>
              <span style={{color:T.green,fontSize:10,marginTop:2,flexShrink:0}}>✓</span>
              <span style={{fontFamily:"DM Sans",fontSize:11.5,color:T.txt2}}>{t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SHIFT RVU TRACKER
// ═══════════════════════════════════════════════════════════════════
function ShiftRVUPanel({ color }) {
  const [encounters, setEncounters] = useState([]);
  const [form, setForm] = useState({ code:"99284", note:"" }); // Fix 6: removed dead wRVU key
  const [manualRVU, setManualRVU] = useState("");

  // Fix 9: use MDM_LEVELS directly instead of fragile LEVEL_MAP object-key search
  const ALL_CODES = [
    ...["99281","99282","99283","99284","99285"].map(c => {
      const m = MDM_LEVELS.find(x => x.code === c);
      return { code:c, label:`${c} — ${m?.mdm||""}`, wRVU: m?.wRVU||0 };
    }),
    { code:"99291", label:"99291 — Critical Care First 30–74 min",    wRVU:4.50 },
    { code:"99292", label:"99292 — Critical Care Add'l 30 min",       wRVU:2.25 },
    ...PROC_RVUS.slice(0,12).map(p=>({ code:p.cpt, label:`${p.cpt} — ${p.name}`, wRVU:p.wRVU })),
    { code:"custom", label:"Custom / Other Code", wRVU:0 },
  ];

  // Fix 10: compute once, used in both display and add()
  const selectedRVU = form.code === "custom"
    ? (parseFloat(manualRVU) || 0)
    : (ALL_CODES.find(c => c.code === form.code)?.wRVU || 0);

  const add = () => {
    if (!form.code) return;
    setEncounters(p=>[...p,{ id:Date.now(), code:form.code==="custom"?form.note||"Custom":form.code, note:form.note, wRVU:selectedRVU, time:new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}) }]);
    setForm({ code:"99284", note:"" }); setManualRVU("");
  };

  const remove = (id) => setEncounters(p=>p.filter(e=>e.id!==id));
  const totalRVU = encounters.reduce((s,e)=>s+e.wRVU,0);
  // Fix 11: use consistent wRVU * 1.35 * CF formula with clear label (same basis as procedure rows)
  const estMedicare = (totalRVU * 1.35 * CF_2026).toFixed(2);
  const avgRVU = encounters.length ? (totalRVU / encounters.length).toFixed(2) : "0.00";
  // Fix 7: removed dead levelCounts useMemo — was computed but never rendered

  return (
    <div className="bill-fade" style={{display:"flex",gap:14}}>
      <div style={{flex:1,minWidth:0}}>
        {/* Stats */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:14}}>
          {[
            {label:"Total wRVU",val:totalRVU.toFixed(2),c:color},
            {label:"Encounters",val:encounters.length,c:T.blue},
            {label:"Avg RVU/Pt",val:avgRVU,c:T.orange},
            {label:"Est. Medicare",val:`$${estMedicare}`,c:T.green},
          ].map((s,i)=>(
            <div key={i} style={{...glass({borderRadius:12,background:`linear-gradient(135deg,${s.c}12,rgba(8,22,40,0.85))`}),padding:"14px 16px",textAlign:"center"}}>
              <div style={{fontFamily:"JetBrains Mono",fontWeight:700,fontSize:"clamp(16px,2vw,22px)",color:s.c}}>{s.val}</div>
              <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt3,marginTop:3}}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Add encounter */}
        <div style={{...glass({borderRadius:12}),padding:"16px 18px",marginBottom:12}}>
          <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:color,textTransform:"uppercase",letterSpacing:2,marginBottom:12}}>ADD ENCOUNTER</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr auto",gap:10,alignItems:"end"}}>
            <div>
              <label style={{display:"block",fontFamily:"DM Sans",fontSize:10,fontWeight:600,color:T.txt3,textTransform:"uppercase",letterSpacing:".05em",marginBottom:5}}>CPT Code</label>
              <select value={form.code} onChange={e=>setForm({...form,code:e.target.value})}
                style={{width:"100%",background:"rgba(14,37,68,0.8)",border:"1px solid rgba(26,53,85,0.6)",borderRadius:9,padding:"9px 12px",color:T.txt,fontSize:13,outline:"none"}}>
                {ALL_CODES.map(c=><option key={c.code} value={c.code}>{c.label}</option>)}
              </select>
            </div>
            <div>
              {form.code === "custom" ? (
                <>
                  <label style={{display:"block",fontFamily:"DM Sans",fontSize:10,fontWeight:600,color:T.txt3,textTransform:"uppercase",letterSpacing:".05em",marginBottom:5}}>Custom Code + wRVU</label>
                  <div style={{display:"flex",gap:6}}>
                    <input placeholder="Code" value={form.note} onChange={e=>setForm({...form,note:e.target.value})}
                      style={{flex:1,background:"rgba(14,37,68,0.8)",border:"1px solid rgba(26,53,85,0.5)",borderRadius:9,padding:"9px 10px",color:T.txt,fontSize:13,outline:"none",minWidth:0}}/>
                    <input type="number" placeholder="wRVU" value={manualRVU} onChange={e=>setManualRVU(e.target.value)}
                      style={{width:70,background:"rgba(14,37,68,0.8)",border:"1px solid rgba(26,53,85,0.5)",borderRadius:9,padding:"9px 10px",color:T.txt,fontFamily:"JetBrains Mono",fontSize:13,outline:"none"}}/>
                  </div>
                </>
              ) : (
                <>
                  <label style={{display:"block",fontFamily:"DM Sans",fontSize:10,fontWeight:600,color:T.txt3,textTransform:"uppercase",letterSpacing:".05em",marginBottom:5}}>Note (Optional)</label>
                  <input placeholder="e.g. 45yo chest pain w/u" value={form.note} onChange={e=>setForm({...form,note:e.target.value})}
                    style={{width:"100%",background:"rgba(14,37,68,0.8)",border:"1px solid rgba(26,53,85,0.5)",borderRadius:9,padding:"9px 12px",color:T.txt,fontSize:13,outline:"none",boxSizing:"border-box"}}/>
                </>
              )}
            </div>
            <button onClick={add}
              style={{padding:"9px 20px",background:`linear-gradient(135deg,${color},${color}aa)`,border:"none",borderRadius:9,color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"DM Sans",whiteSpace:"nowrap",height:40}}>
              + Add
            </button>
          </div>
          {form.code !== "custom" && (
            <div style={{marginTop:8,fontFamily:"JetBrains Mono",fontSize:12,color:color}}>
              Selected: <strong>{ALL_CODES.find(c=>c.code===form.code)?.wRVU||0}</strong> wRVU
            </div>
          )}
        </div>

        {/* Encounter list */}
        <div style={{...glass({borderRadius:12}),overflow:"hidden"}}>
          <div style={{padding:"10px 16px",borderBottom:"1px solid rgba(26,53,85,0.4)",display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontFamily:"DM Sans",fontWeight:700,fontSize:12,color:T.txt,flex:1}}>Encounter Log ({encounters.length})</span>
            {encounters.length > 0 && (
              <button onClick={()=>setEncounters([])} style={{padding:"3px 10px",borderRadius:6,background:"rgba(255,107,107,0.12)",border:"1px solid rgba(255,107,107,0.3)",color:T.coral,fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"DM Sans"}}>Clear All</button>
            )}
          </div>
          {encounters.length === 0 ? (
            <div style={{padding:"40px 16px",textAlign:"center",color:T.txt3,fontFamily:"DM Sans",fontSize:13}}>No encounters logged yet. Add codes above.</div>
          ) : (
            <div>
              {encounters.map((e,i)=>(
                <div key={e.id} style={{display:"grid",gridTemplateColumns:"70px 1fr 80px 80px 36px",alignItems:"center",padding:"10px 14px",borderBottom:"1px solid rgba(26,53,85,0.2)",background:i%2===0?"rgba(14,37,68,0.2)":"transparent"}}>
                  <span style={{fontFamily:"JetBrains Mono",fontSize:11,color:T.txt3}}>{e.time}</span>
                  <div>
                    <span style={{fontFamily:"JetBrains Mono",fontSize:12,fontWeight:700,color:color}}>{e.code}</span>
                    {e.note && <span style={{fontFamily:"DM Sans",fontSize:11,color:T.txt3,marginLeft:8}}>{e.note}</span>}
                  </div>
                  <span style={{fontFamily:"JetBrains Mono",fontSize:13,fontWeight:700,color:T.teal,textAlign:"right"}}>{e.wRVU} wRVU</span>
                  <span style={{fontFamily:"JetBrains Mono",fontSize:11,color:T.txt3,textAlign:"right"}}>${(e.wRVU*1.35*CF_2026).toFixed(0)}</span>
                  <button onClick={()=>remove(e.id)} style={{background:"transparent",border:"none",color:T.txt4,cursor:"pointer",fontSize:13}}>✕</button>
                </div>
              ))}
              <div style={{display:"grid",gridTemplateColumns:"70px 1fr 80px 80px 36px",alignItems:"center",padding:"10px 14px",background:"rgba(14,37,68,0.5)",borderTop:"1px solid rgba(26,53,85,0.5)"}}>
                <span/>
                <span style={{fontFamily:"DM Sans",fontWeight:700,fontSize:12,color:T.txt}}>SHIFT TOTAL</span>
                <span style={{fontFamily:"JetBrains Mono",fontSize:14,fontWeight:700,color:color,textAlign:"right"}}>{totalRVU.toFixed(2)}</span>
                <span style={{fontFamily:"JetBrains Mono",fontSize:12,fontWeight:700,color:T.green,textAlign:"right"}}>${estMedicare}</span>
                <span/>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Benchmarks */}
      <div style={{width:260,flexShrink:0,display:"flex",flexDirection:"column",gap:10}}>
        <div style={{...glass({borderRadius:12}),padding:"14px 16px"}}>
          <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:color,textTransform:"uppercase",letterSpacing:2,marginBottom:12}}>MGMA 2026 EM BENCHMARKS</div>
          {[
            {label:"10th Percentile",val:"5,200 wRVU/yr",c:T.txt3},
            {label:"25th Percentile",val:"6,800 wRVU/yr",c:T.blue},
            {label:"Median (50th)",val:"8,200 wRVU/yr",c:T.teal},
            {label:"75th Percentile",val:"9,600 wRVU/yr",c:T.orange},
            {label:"90th Percentile",val:"11,400 wRVU/yr",c:T.coral},
          ].map((b,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:i<4?"1px solid rgba(26,53,85,0.3)":"none"}}>
              <span style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2}}>{b.label}</span>
              <span style={{fontFamily:"JetBrains Mono",fontSize:12,fontWeight:700,color:b.c}}>{b.val}</span>
            </div>
          ))}
          <div style={{marginTop:10,padding:"8px 10px",background:"rgba(5,15,30,0.5)",borderRadius:8}}>
            <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt3,marginBottom:2}}>wRVU/patient (typical shift)</div>
            <div style={{display:"flex",gap:8}}>
              <div style={{flex:1,textAlign:"center"}}>
                <div style={{fontFamily:"JetBrains Mono",fontWeight:700,fontSize:14,color:T.teal}}>2.4–3.1</div>
                <div style={{fontFamily:"DM Sans",fontSize:10,color:T.txt4}}>avg range</div>
              </div>
              <div style={{flex:1,textAlign:"center"}}>
                <div style={{fontFamily:"JetBrains Mono",fontWeight:700,fontSize:14,color:T.orange}}>{avgRVU}</div>
                <div style={{fontFamily:"DM Sans",fontSize:10,color:T.txt4}}>your avg</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{...glass({borderRadius:12}),padding:"14px 16px"}}>
          <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.gold,textTransform:"uppercase",letterSpacing:2,marginBottom:10}}>CONVERSION FACTORS</div>
          {[
            {label:"2026 CMS CF",val:"$33.40",note:"Current"},
            {label:"2025 CMS CF",val:"$32.35",note:"Prior year"},
            {label:"2024 CMS CF",val:"$32.74",note:""},
            {label:"Facility Total RVU",val:"wRVU + 1.35×",note:"Approx formula"},
          ].map((r,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:i<3?"1px solid rgba(26,53,85,0.25)":"none"}}>
              <div>
                <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2}}>{r.label}</div>
                {r.note && <div style={{fontFamily:"DM Sans",fontSize:10,color:T.txt4}}>{r.note}</div>}
              </div>
              <span style={{fontFamily:"JetBrains Mono",fontSize:12,fontWeight:700,color:T.gold}}>{r.val}</span>
            </div>
          ))}
        </div>

        <div style={{...glass({borderRadius:12,background:"rgba(0,229,192,0.04)",borderColor:"rgba(0,229,192,0.2)"}),padding:"14px 16px"}}>
          <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.teal,textTransform:"uppercase",letterSpacing:2,marginBottom:10}}>CODING DISTRIBUTION — TYPICAL EM SHIFT</div>
          {[
            {code:"99281",pct:"1%", color:T.txt3},
            {code:"99282",pct:"2%", color:T.teal},
            {code:"99283",pct:"12%",color:T.blue},
            {code:"99284",pct:"30%",color:T.orange},
            {code:"99285",pct:"40%",color:T.coral},
            {code:"99291",pct:"4%", color:T.purple},
          ].map(r=>(
            <div key={r.code} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
              <span style={{fontFamily:"JetBrains Mono",fontSize:11,color:r.color,minWidth:44}}>{r.code}</span>
              <div style={{flex:1,height:6,background:"rgba(26,53,85,0.4)",borderRadius:3,overflow:"hidden"}}>
                <div style={{width:r.pct,height:"100%",background:r.color,borderRadius:3}}/>
              </div>
              <span style={{fontFamily:"JetBrains Mono",fontSize:11,color:T.txt3,minWidth:28,textAlign:"right"}}>{r.pct}</span>
            </div>
          ))}
          <div style={{fontFamily:"DM Sans",fontSize:10,color:T.txt4,marginTop:8}}>Source: ACEP / EMRA 2023 national data</div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PROCEDURE RVU PANEL
// ═══════════════════════════════════════════════════════════════════
function ProcRVUPanel({ color }) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("All");
  const cats = ["All",...[...new Set(PROC_RVUS.map(p=>p.cat))]];
  const filtered = PROC_RVUS.filter(p=>{
    const matchCat = cat==="All"||p.cat===cat;
    const q = query.toLowerCase();
    return matchCat && (!q||p.cpt.includes(q)||p.name.toLowerCase().includes(q));
  });

  const catColors = {
    "Airway":T.coral, "Vascular":T.purple, "Wound Repair":T.teal, "Cardiac":T.coral,
    "Thoracic":T.blue, "Critical Care":T.orange, "Drainage":T.green, "Ortho":T.gold,
    "Neuro":T.rose, "Sedation":T.cyan, "Diagnostic":T.txt2, // Fix 2: T.rose now defined in T
  };

  return (
    <div className="bill-fade">
      <div style={{...glass({borderRadius:12,background:"rgba(59,158,255,0.05)",borderColor:"rgba(59,158,255,0.2)"}),padding:"12px 16px",marginBottom:14}}>
        <div style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.blue,textTransform:"uppercase",letterSpacing:2,marginBottom:6}}>WORK RVU (wRVU) REFERENCE — EMERGENCY MEDICINE PROCEDURES</div>
        <div style={{fontFamily:"DM Sans",fontSize:12.5,color:T.txt2,lineHeight:1.7}}>
          wRVU values below are 2026 CMS rates. <strong style={{color:T.txt}}>Procedures billed alongside critical care (99291/99292) must be separately listed</strong> unless bundled (see Critical Care tab). Procedure note documentation is mandatory for all CPT procedure codes. Modifier <strong style={{color:T.gold}}>-25</strong> required when billing an E&M + procedure on the same date.
        </div>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
        <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search CPT or procedure name…"
          style={{flex:1,minWidth:200,background:"rgba(14,37,68,0.8)",border:`1px solid ${query?"rgba(59,158,255,0.5)":"rgba(26,53,85,0.5)"}`,borderRadius:10,padding:"9px 14px",color:T.txt,fontFamily:"DM Sans",fontSize:13,outline:"none"}}
          onFocus={e=>e.target.style.borderColor="rgba(59,158,255,0.6)"}
          onBlur={e=>e.target.style.borderColor=query?"rgba(59,158,255,0.5)":"rgba(26,53,85,0.5)"}
        />
        {cats.map(c=>(
          <button key={c} onClick={()=>setCat(c)}
            style={{padding:"7px 14px",borderRadius:20,border:`1px solid ${cat===c?color+"66":"rgba(26,53,85,0.5)"}`,background:cat===c?`${color}18`:"transparent",color:cat===c?color:T.txt3,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"DM Sans",whiteSpace:"nowrap"}}>
            {c}
          </button>
        ))}
      </div>
      <div style={{...glass({borderRadius:12}),overflow:"hidden"}}>
        <div style={{display:"grid",gridTemplateColumns:"90px 1fr 90px 80px 80px",borderBottom:"1px solid rgba(26,53,85,0.4)"}}>
          {["CPT Code","Procedure Name","Category","wRVU","Est. Medicare '26"].map(h=>(
            // Fix 1: was <th> inside a <div> grid — semantically invalid; use <div>
            <div key={h} style={{padding:"10px 12px",fontSize:10,fontWeight:700,color:T.txt3,textTransform:"uppercase",letterSpacing:".06em"}}>{h}</div>
          ))}
        </div>
        {filtered.map((p,i)=>{
          const c = catColors[p.cat]||T.txt2;
          const est = (p.wRVU * 1.35 * CF_2026).toFixed(0);
          return (
            <div key={p.cpt} style={{display:"grid",gridTemplateColumns:"90px 1fr 90px 80px 80px",alignItems:"center",borderBottom:"1px solid rgba(26,53,85,0.2)",background:i%2===0?"rgba(14,37,68,0.2)":"transparent",padding:"2px 0"}}>
              <div style={{padding:"9px 12px",fontFamily:"JetBrains Mono",fontWeight:700,fontSize:12,color}}>{p.cpt}</div>
              <div style={{padding:"9px 12px",fontFamily:"DM Sans",fontSize:12.5,color:T.txt}}>{p.name}</div>
              <div style={{padding:"9px 12px"}}><span style={{fontFamily:"DM Sans",fontSize:10,fontWeight:700,color:c,background:`${c}18`,padding:"2px 7px",borderRadius:6}}>{p.cat}</span></div>
              <div style={{padding:"9px 12px",fontFamily:"JetBrains Mono",fontWeight:700,fontSize:13,color}}>{p.wRVU}</div>
              <div style={{padding:"9px 12px",fontFamily:"JetBrains Mono",fontSize:12,color:T.teal}}>${est}</div>
            </div>
          );
        })}
        {filtered.length === 0 && <div style={{padding:"32px",textAlign:"center",color:T.txt3,fontFamily:"DM Sans",fontSize:13}}>No procedures matched your search.</div>}
      </div>
      <div style={{...glass({borderRadius:12,background:"rgba(245,200,66,0.05)",borderColor:"rgba(245,200,66,0.2)"}),padding:"12px 16px",marginTop:12}}>
        <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.gold,textTransform:"uppercase",letterSpacing:2,marginBottom:8}}>DOCUMENTATION REQUIREMENTS FOR PROCEDURE BILLING</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {[
            "Indication for procedure — medical necessity",
            "Patient consent (verbal or written per institutional policy)",
            "Pre-procedure assessment (relevant exam findings)",
            "Sterile technique/anesthesia documentation",
            "Step-by-step procedure description",
            "Equipment used (size, type, approach)",
            "Number of attempts and complications",
            "Post-procedure assessment and plan",
          ].map((t,i)=>(
            <div key={i} style={{display:"flex",gap:8,alignItems:"flex-start"}}>
              <span style={{color:T.gold,fontSize:11,marginTop:1,flexShrink:0}}>{String(i+1).padStart(2,"0")}</span>
              <span style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2}}>{t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MODIFIERS PANEL
// ═══════════════════════════════════════════════════════════════════
function ModifiersPanel({ color }) {
  const [openMod, setOpenMod] = useState(null);
  const COMPLIANCE = [
    { title:"OIG High-Risk Areas", items:["Upcoding E&M without MDM support","Billing 99285 for level 3-4 complexity cases","Routine use of modifier -25 without documentation","Critical care without documented organ system impairment","Unbundling separately billed tests within critical care"], color:T.coral },
    { title:"Improper Payment Stats (CMS 2024)", items:["10.3% improper payment rate for all E&M codes","Incorrect coding: 49.1% of improper payments","Insufficient documentation: 34.1%","No documentation: 13.1%","Projected improper amount: $3.9 billion total"], color:T.orange },
    { title:"Best Practices", items:["Document MDM explicitly — don't leave it to inference","Use the 'two of three' rule consciously for each encounter","Date, time, and duration for critical care documentation","Independent interpretation: document your reasoning, not just the result","Addenda must note the date/time added — not retroactive fabrication"], color:T.green },
    { title:"Place of Service (POS) Codes", items:["POS 23: Emergency Room — Hospital","POS 19: Off-Campus Outpatient Hospital ED","POS 22: On-Campus Outpatient Hospital","POS 23 is required for billing 99281–99285","Wrong POS code → automatic denial or reduced payment"], color:T.blue },
  ];

  return (
    <div className="bill-fade">
      {/* Modifiers */}
      <div style={{fontFamily:"JetBrains Mono",fontSize:10,color:color,textTransform:"uppercase",letterSpacing:2,marginBottom:12}}>COMMON EM BILLING MODIFIERS</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:10,marginBottom:20}}>
        {MODIFIERS.map(m=>(
          <div key={m.mod} onClick={()=>setOpenMod(openMod===m.mod?null:m.mod)}
            style={{...glass({borderRadius:12,background:openMod===m.mod?`${m.color}18`:"rgba(8,22,40,0.75)",borderColor:openMod===m.mod?m.color+"66":"rgba(26,53,85,0.45)"}),padding:"14px 16px",cursor:"pointer",transition:"all .18s"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:40,height:40,borderRadius:10,background:`${m.color}22`,border:`1px solid ${m.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"JetBrains Mono",fontWeight:700,fontSize:15,color:m.color,flexShrink:0}}>{m.mod}</div>
              <div style={{flex:1}}>
                <div style={{fontFamily:"DM Sans",fontWeight:700,fontSize:13,color:T.txt,lineHeight:1.3}}>{m.name}</div>
              </div>
              <span style={{fontFamily:"JetBrains Mono",fontSize:11,color:openMod===m.mod?m.color:T.txt4}}>{openMod===m.mod?"▼":"▶"}</span>
            </div>
            {openMod===m.mod && (
              <div className="bill-fade" style={{marginTop:12,display:"flex",flexDirection:"column",gap:8}}>
                <div style={{padding:"10px 12px",background:`${m.color}0d`,borderRadius:8,borderLeft:`3px solid ${m.color}`}}>
                  <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:m.color,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>When to Use</div>
                  <div style={{fontFamily:"DM Sans",fontSize:12.5,color:T.txt2,lineHeight:1.6}}>{m.usage}</div>
                </div>
                <div style={{padding:"10px 12px",background:"rgba(255,107,107,0.06)",borderRadius:8,borderLeft:"3px solid rgba(255,107,107,0.4)"}}>
                  <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.coral,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>⚠ Pitfall</div>
                  <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt3,lineHeight:1.6}}>{m.pitfall}</div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Compliance section */}
      <div style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.txt3,textTransform:"uppercase",letterSpacing:2,marginBottom:12}}>COMPLIANCE & AUDIT AWARENESS</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:10}}>
        {COMPLIANCE.map(c=>(
          <div key={c.title} style={{...glass({borderRadius:12,background:`${c.color}08`,borderColor:`${c.color}25`}),padding:"14px 16px"}}>
            <div style={{fontFamily:"JetBrains Mono",fontSize:10,color:c.color,textTransform:"uppercase",letterSpacing:2,marginBottom:10}}>{c.title}</div>
            {c.items.map((item,i)=>(
              <div key={i} style={{display:"flex",gap:8,marginBottom:7,alignItems:"flex-start"}}>
                <span style={{color:c.color,fontSize:11,flexShrink:0,marginTop:1}}>▸</span>
                <span style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.55}}>{item}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════
export default function ProviderBilling() {
  const [activeId, setActiveId] = useState("em_calc");
  const active = SECTIONS.find(s=>s.id===activeId);

  const renderPanel = () => {
    switch(activeId) {
      case "em_calc":   return <EMCalcPanel    color={active.color}/>;
      case "critical":  return <CriticalCarePanel color={active.color}/>;
      case "rvu_track": return <ShiftRVUPanel  color={active.color}/>;
      case "proc_rvu":  return <ProcRVUPanel   color={active.color}/>;
      case "modifiers": return <ModifiersPanel color={active.color}/>;
      default:          return null;
    }
  };

  return (
    <div style={{background:T.bg,minHeight:"100vh",fontFamily:"DM Sans,sans-serif",display:"flex",flexDirection:"column",position:"relative",overflow:"hidden",paddingTop:80}}>
      {/* Ambient glow */}
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0}}>
        <div style={{position:"absolute",top:"-15%",left:"-5%",width:"55%",height:"55%",background:`radial-gradient(circle,${active.color}16 0%,transparent 70%)`,transition:"background 1.2s ease"}}/>
        <div style={{position:"absolute",bottom:"-20%",right:"0",width:"45%",height:"45%",background:"radial-gradient(circle,rgba(245,200,66,0.07) 0%,transparent 70%)"}}/>
      </div>

      {/* Header */}
      <div style={{...deepGlass({borderRadius:0}),padding:"14px 24px",flexShrink:0,zIndex:10,position:"relative",borderBottom:"1px solid rgba(26,53,85,0.6)"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{...deepGlass({borderRadius:9}),padding:"5px 12px",display:"flex",gap:8,alignItems:"center"}}>
            <span style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.teal,letterSpacing:3}}>NOTRYA</span>
            <span style={{color:T.txt3,fontFamily:"JetBrains Mono",fontSize:10}}>/</span>
            <span style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.txt3,letterSpacing:2}}>BILLING</span>
          </div>
          <div style={{height:1,flex:1,background:"linear-gradient(90deg,rgba(42,77,114,0.5),transparent)"}}/>
          <h1 className="bill-shimmer" style={{fontFamily:"Playfair Display",fontSize:"clamp(18px,2.5vw,28px)",fontWeight:900,letterSpacing:-0.5}}>Provider Billing Suite</h1>
        </div>
      </div>

      {/* Body */}
      <div style={{display:"flex",flex:1,minHeight:0,position:"relative",zIndex:1,overflow:"hidden"}}>

        {/* Sidebar */}
        <div style={{...deepGlass({borderRadius:0,borderRight:"1px solid rgba(26,53,85,0.6)"}),width:226,flexShrink:0,padding:"14px 10px",display:"flex",flexDirection:"column",gap:4}}>
          <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:3,padding:"4px 8px 10px"}}>SECTIONS</div>
          {SECTIONS.map(sec=>{
            const isActive = sec.id===activeId;
            return (
              <div key={sec.id} className="bill-nav" onClick={()=>setActiveId(sec.id)}
                style={{padding:"10px 12px",borderRadius:10,background:isActive?`linear-gradient(135deg,${sec.color}22,rgba(14,37,68,0.6))`:"transparent",border:`1px solid ${isActive?sec.color+"55":"transparent"}`,position:"relative",transition:"background .18s,border .18s"}}>
                {isActive && <div style={{position:"absolute",left:0,top:"15%",height:"70%",width:2.5,background:sec.color,borderRadius:2,boxShadow:`0 0 8px ${sec.color}`}}/>}
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:17}}>{sec.icon}</span>
                  <div>
                    <div style={{fontFamily:"DM Sans",fontWeight:700,fontSize:12,color:isActive?T.txt:T.txt2}}>{sec.label}</div>
                    <div style={{fontFamily:"DM Sans",fontSize:10,color:T.txt4,marginTop:1}}>{sec.sub}</div>
                  </div>
                </div>
              </div>
            );
          })}

          <div style={{flex:1}}/>
          <div style={{...deepGlass({borderRadius:10}),padding:"10px 12px",marginTop:8}}>
            <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.gold,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>2026 CMS DATA</div>
            {[
              {label:"Conv. Factor",val:"$33.40"},
              {label:"99285 wRVU",val:"4.00"},
              {label:"99284 wRVU",val:"2.74"},
              {label:"99291 wRVU",val:"4.50"},
            ].map((r,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"3px 0"}}>
                <span style={{fontFamily:"DM Sans",fontSize:10,color:T.txt3}}>{r.label}</span>
                <span style={{fontFamily:"JetBrains Mono",fontSize:10,fontWeight:700,color:T.gold}}>{r.val}</span>
              </div>
            ))}
          </div>
          <div style={{padding:"8px",fontFamily:"DM Sans",fontSize:9.5,color:T.txt4,lineHeight:1.5,textAlign:"center"}}>
            For informational use.<br/>Verify payer-specific rules.
          </div>
        </div>

        {/* Content */}
        <div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          {/* Section Header */}
          <div style={{...glass({borderRadius:0,background:`linear-gradient(135deg,${active.gl},rgba(8,22,40,0.9))`,borderColor:active.br,borderLeft:"none",borderRight:"none",borderTop:"none"}),padding:"14px 24px",flexShrink:0,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:-30,right:-20,fontSize:110,opacity:.05,pointerEvents:"none"}}>{active.icon}</div>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <span style={{fontSize:26}}>{active.icon}</span>
              <div>
                <h2 style={{fontFamily:"Playfair Display",fontWeight:700,fontSize:"clamp(15px,2vw,21px)",color:T.txt,margin:0}}>{active.label}</h2>
                <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt3,marginTop:2}}>{active.sub}</div>
              </div>
              <span style={{marginLeft:"auto",fontFamily:"JetBrains Mono",fontSize:9,color:active.color,background:`${active.color}18`,border:`1px solid ${active.color}44`,padding:"3px 10px",borderRadius:20,fontWeight:700,letterSpacing:1}}>CMS 2024+</span>
            </div>
          </div>

          {/* Panel */}
          <div key={activeId} className="bill-fade" style={{flex:1,minHeight:0,overflowY:"auto",padding:"18px 24px"}}>
            {renderPanel()}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{textAlign:"center",padding:"7px",borderTop:"1px solid rgba(26,53,85,0.3)",position:"relative",zIndex:2}}>
        <span style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,letterSpacing:2}}>NOTRYA PROVIDER BILLING · CMS/AMA 2023+ E&M GUIDELINES · FOR CLINICAL REFERENCE ONLY — VERIFY WITH YOUR CODER</span>
      </div>
    </div>
  );
}