import { useState, useCallback, useMemo } from "react";

// ── Font + CSS Injection ─────────────────────────────────────────
(() => {
  if (document.getElementById("airway-fonts")) return;
  const l = document.createElement("link"); l.id = "airway-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "airway-css";
  s.textContent = `
    *{box-sizing:border-box;margin:0;padding:0;}
    ::-webkit-scrollbar{width:3px;height:3px;}
    ::-webkit-scrollbar-track{background:transparent;}
    ::-webkit-scrollbar-thumb{background:rgba(42,79,122,0.5);border-radius:2px;}
    @keyframes fadeSlide{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.55}}
    @keyframes countUp{from{opacity:0;transform:scale(.8)}to{opacity:1;transform:scale(1)}}
    .fade-in{animation:fadeSlide .22s ease forwards;}
    .shimmer-text{background:linear-gradient(90deg,#e8f0fe 0%,#fff 30%,#ff6b6b 52%,#f5c842 72%,#e8f0fe 100%);background-size:250% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 5s linear infinite;}
    .cico-pulse{animation:pulse 1.4s ease-in-out infinite;}
    .dose-num{animation:countUp .18s ease forwards;}
    .drug-card:hover{transform:translateY(-1px);transition:transform .14s;}
    .check-row:hover{background:rgba(0,229,192,0.05)!important;}
    .algo-step:hover{border-color:rgba(0,229,192,0.3)!important;}
  `;
  document.head.appendChild(s);
})();

// ── Design Tokens ─────────────────────────────────────────────────
const T = {
  bg:"#050f1e", panel:"#081628", card:"#0b1e36", up:"#0e2544",
  b:"rgba(26,53,85,0.8)", bhi:"rgba(42,79,122,0.9)",
  txt:"#e8f0fe", txt2:"#8aaccc", txt3:"#4a6a8a", txt4:"#2e4a6a",
  red:"#ff4444", coral:"#ff6b6b", orange:"#ff9f43",
  yellow:"#f5c842", green:"#3dffa0", teal:"#00e5c0",
  blue:"#3b9eff", purple:"#9b6dff", cyan:"#00d4ff", rose:"#f472b6",
};
const glass = {
  backdropFilter:"blur(24px) saturate(200%)",
  WebkitBackdropFilter:"blur(24px) saturate(200%)",
  background:"rgba(8,22,40,0.78)",
  border:"1px solid rgba(42,79,122,0.35)",
  borderRadius:14,
};

// ── RSI Drug Database ─────────────────────────────────────────────
const RSI_DRUGS = [
  // ── Induction Agents ──
  { id:"ketamine", name:"Ketamine", cat:"Induction", color:T.teal, pref:"first-line",
    dose:"1.5–2 mg/kg IV", calc:w=>({min:w*1.5, max:w*2, unit:"mg"}),
    maxDose:"No hard ceiling", onset:"45–60 sec", duration:"10–20 min",
    conc:"50 mg/mL (dilute 500mg/10mL vial)", vol:w=>`${(w*1.5/50).toFixed(1)}–${(w*2/50).toFixed(1)} mL`,
    indications:["Hemodynamic instability / shock","Bronchospasm / status asthmaticus","Trauma with unknown volume status","Excited delirium syndrome","Pediatric RSI (universal)"],
    cautions:["Aortic dissection or hypertensive emergency","Active psychosis (relative)","Increases secretions — prepare suction","ICP elevation: largely debunked — use is acceptable"],
    pearl:"First-line induction for most EM RSI. Hemodynamically preserving. The ICP concern is a persistent myth — current evidence does not support withholding ketamine for elevated ICP.",
    badge:"PREFERRED EM", badgeColor:T.teal },
  { id:"etomidate", name:"Etomidate", cat:"Induction", color:T.blue, pref:"standard",
    dose:"0.3 mg/kg IV", calc:w=>({min:w*0.3, max:w*0.3, unit:"mg"}),
    maxDose:"20 mg typical max", onset:"15–45 sec", duration:"5–15 min",
    conc:"2 mg/mL (20mg/10mL)", vol:w=>`${(w*0.3/2).toFixed(1)} mL`,
    indications:["Hemodynamically unstable patient","Seizure requiring intubation","Neutral hemodynamic profile needed"],
    cautions:["Septic shock — adrenal suppression (single dose significance debated)","Addison's disease / adrenal insufficiency","Does NOT provide analgesia — patient may be aware"],
    pearl:"Most hemodynamically neutral induction agent. Single-dose adrenal suppression in sepsis is clinically debated but many still avoid it — ketamine is a strong alternative.",
    badge:"HEMODYNAMICALLY NEUTRAL", badgeColor:T.blue },
  { id:"propofol", name:"Propofol", cat:"Induction", color:T.purple, pref:"stable-only",
    dose:"1.5–2 mg/kg IV slow push", calc:w=>({min:w*1.5, max:w*2.0, unit:"mg"}),
    maxDose:"200 mg typical", onset:"15–30 sec", duration:"5–10 min",
    conc:"10 mg/mL (200mg/20mL)", vol:w=>`${(w*1.5/10).toFixed(1)}–${(w*2.0/10).toFixed(1)} mL`,
    indications:["Hemodynamically stable patient","Elevated ICP (reduces cerebral metabolic demand)","Status epilepticus requiring intubation","ICU-initiated intubation"],
    cautions:["Hypotension — major limitation in EM","Egg/soy allergy (relative CI)","Shock states — AVOID","Pain on injection — not analgesic"],
    pearl:"Avoid in EM RSI except in normotensive patients. Significant hypotension even in euvolemic patients. Ideal for elective ICU intubation.",
    badge:"STABLE PATIENTS ONLY", badgeColor:T.purple },
  // ── Paralytics ──
  { id:"succinylcholine", name:"Succinylcholine", cat:"Paralytic", color:T.coral, pref:"first-line",
    dose:"1.5 mg/kg IV (2 mg/kg if < 10 kg)", calc:w=>({min:w*1.5, max:w*1.5, unit:"mg"}),
    maxDose:"200 mg", onset:"45–60 sec", duration:"9–13 min",
    conc:"20 mg/mL (200mg/10mL)", vol:w=>`${(w*1.5/20).toFixed(1)} mL`,
    indications:["Standard RSI — ultra-fast onset","Rapid recovery needed (cannot intubate scenario)","Succinylcholine-specific indications"],
    cautions:[
      "ABSOLUTE CI: Known hyperkalemia (K⁺ > 5.5) or conditions causing K⁺ rise",
      "Burns > 24 hours old (hyperkalemia risk persists for months)",
      "Crush injury / rhabdomyolysis > 72 hours old",
      "Denervating injuries: stroke, SCI, GBS, ALS > 72 hours",
      "Myopathies: Duchenne, Becker — cardiac arrest from hyperkalemia",
      "Personal or family history of malignant hyperthermia",
      "Pseudocholinesterase deficiency — prolonged paralysis",
    ],
    pearl:"Fastest onset paralytic in RSI. The short duration (Phase I block) is its safety advantage in cannot-intubate scenarios. ALWAYS verify no K⁺ contraindications first.",
    badge:"FASTEST ONSET", badgeColor:T.coral },
  { id:"rocuronium", name:"Rocuronium", cat:"Paralytic", color:T.orange, pref:"alternative",
    dose:"1.2 mg/kg IV (RSI dose)", calc:w=>({min:w*1.2, max:w*1.2, unit:"mg"}),
    maxDose:"No defined max — dose by weight", onset:"45–60 sec at 1.2 mg/kg", duration:"30–60 min",
    conc:"10 mg/mL (50mg/5mL)", vol:w=>`${(w*1.2/10).toFixed(1)} mL`,
    indications:["Succinylcholine contraindicated","Preferred in known hyperkalemia states","Standard RSI alternative","Prolonged paralysis needed"],
    cautions:["Prolonged duration — cannot rely on offset if cannot intubate","Must have Sugammadex (16 mg/kg) immediately available","Standard intubating dose is 0.6 mg/kg — use 1.2 mg/kg for RSI-quality conditions","Hepatic/biliary disease prolongs duration"],
    pearl:"Use 1.2 mg/kg (double the standard dose) for RSI conditions. MUST have Sugammadex bedside. At 1.2 mg/kg onset is equivalent to succinylcholine.",
    badge:"SUCCINYLCHOLINE CI", badgeColor:T.orange },
  // ── Pretreatment ──
  { id:"fentanyl", name:"Fentanyl", cat:"Pretreatment", color:T.yellow, pref:"situational",
    dose:"3 mcg/kg IV (3 min before induction)", calc:w=>({min:w*3, max:w*3, unit:"mcg"}),
    maxDose:"200–300 mcg typical", onset:"3–5 min (must give early)", duration:"30–60 min",
    conc:"50 mcg/mL (100mcg/2mL)", vol:w=>`${(w*3/50).toFixed(1)} mL`,
    indications:["Blunt hemodynamic response to laryngoscopy","Elevated ICP — blunts ICP spike","Aortic dissection / hypertensive emergency","Cardiac ischemia where tachycardia harmful"],
    cautions:["Give 3 min BEFORE induction — timing is critical","Hypotension risk if patient already hemodynamically compromised","Chest wall rigidity at high doses (rare at this dose)"],
    pearl:"Give 3 minutes before intubation — not simultaneous with induction. In elevated ICP or HTN emergency, this is a key pre-treatment. Skip in hypotensive patients.",
    badge:"3 MIN BEFORE RSI", badgeColor:T.yellow },
  { id:"lidocaine", name:"Lidocaine", cat:"Pretreatment", color:T.blue, pref:"situational",
    dose:"1.5 mg/kg IV (3 min before)", calc:w=>({min:w*1.5, max:w*1.5, unit:"mg"}),
    maxDose:"300 mg", onset:"3–5 min", duration:"10–20 min",
    conc:"20 mg/mL (100mg/5mL)", vol:w=>`${(w*1.5/20).toFixed(1)} mL`,
    indications:["Elevated ICP — blunts ICP spike during laryngoscopy","Reactive airway disease — reduces bronchospasm risk"],
    cautions:["Evidence for ICP benefit is limited — fentanyl is more reliable","Known lidocaine / amide allergy","Heart block without pacemaker"],
    pearl:"Evidence is mixed but widely used in TBI/elevated ICP settings. Reasonable to include when ICP elevation is a concern and time permits.",
    badge:"ICP / BRONCHOSPASM", badgeColor:T.blue },
  { id:"atropine", name:"Atropine", cat:"Pretreatment", color:T.green, pref:"pediatric",
    dose:"0.02 mg/kg IV (min 0.1 mg, max 1 mg)", calc:w=>({min:Math.max(w*0.02,0.1), max:Math.min(Math.max(w*0.02,0.1),1.0), unit:"mg"}),
    maxDose:"1 mg IV", onset:"1–2 min", duration:"15–30 min",
    conc:"0.4 mg/mL (0.4mg/1mL)", vol:w=>`${(Math.max(w*0.02,0.1)/0.4).toFixed(1)} mL`,
    indications:["Pediatric RSI < 1 year (succinylcholine vagotonic effect)","All ages when succinylcholine given to peds (some guidelines)","Anticipated bradycardia from laryngoscopy"],
    cautions:["Not routinely needed in adults","Tachycardia — use caution in ischemia","Minimum dose 0.1 mg — paradoxical bradycardia if dose too low"],
    pearl:"Required pretreatment in infants < 1 year before succinylcholine. Many centers give to all pediatric patients receiving succinylcholine. Not indicated in routine adult RSI.",
    badge:"PEDS STANDARD", badgeColor:T.green },
  // ── Reversal ──
  { id:"sugammadex", name:"Sugammadex", cat:"Reversal", color:T.teal, pref:"reversal",
    dose:"16 mg/kg IV (cannot intubate cannot oxygenate)", calc:w=>({min:w*16, max:w*16, unit:"mg"}),
    maxDose:"No defined maximum", onset:"< 3 min to reversal", duration:"N/A — reversal agent",
    conc:"200 mg/2mL or 200 mg/5mL (various)", vol:w=>`${(w*16/200).toFixed(1)} vials (200mg vials)`,
    indications:["CICO scenario — immediately reverse rocuronium","Unexpected cannot intubate after rocuronium"],
    cautions:["ONLY reverses rocuronium and vecuronium (NOT succinylcholine)","Must have IMMEDIATELY available when rocuronium used for RSI","Renal failure prolongs sugammadex clearance — monitor for recurarization"],
    pearl:"MUST be at bedside before giving rocuronium for RSI. In CICO scenario: 16 mg/kg reverses full RSI-dose rocuronium in < 3 minutes. This is the rescue for the cannot-intubate rocuronium patient.",
    badge:"CICO RESCUE", badgeColor:T.red },
];

// ── LEMON Assessment Data ─────────────────────────────────────────
const LEMON = [
  { id:"look", letter:"L", label:"Look Externally", items:[
    "Facial or airway trauma / bleeding / secretions in airway",
    "Short or immobile neck",
    "Morbid obesity / thick neck circumference",
    "Large tongue relative to mouth size",
    "Prominent incisors / significant overbite",
    "Beard / facial hair obscuring landmarks",
    "Trismus / jaw rigidity / limited mouth opening",
  ]},
  { id:"eval", letter:"E", label:"Evaluate 3-3-2 Rule", items:[
    "Inter-incisor distance < 3 finger-widths (< 4 cm)",
    "Hyoid-to-mental distance < 3 finger-widths (< 4 cm)",
    "Thyroid-to-floor-of-mouth distance < 2 finger-widths (< 2.5 cm)",
  ]},
  { id:"mall", letter:"M", label:"Mallampati Score", items:[
    "Mallampati III — soft palate, base of uvula visible only",
    "Mallampati IV — only hard palate visible (worst)",
  ]},
  { id:"obst", letter:"O", label:"Obstruction", items:[
    "Epiglottitis or supraglottic edema",
    "Peritonsillar / retropharyngeal abscess",
    "Angioedema (tongue, uvular, laryngeal)",
    "Foreign body in airway",
    "Expanding neck hematoma",
    "Tracheal deviation / mass effect",
  ]},
  { id:"neck", letter:"N", label:"Neck Mobility", items:[
    "C-spine immobilization (collar in place)",
    "Ankylosing spondylitis / cervical fusion",
    "Cervical spine injury — manual in-line stabilization required",
    "Severe cervical arthritis / significant kyphosis",
  ]},
];

// ── Post-Intubation Vent Scenarios ────────────────────────────────
const VENT_PRESETS = [
  { id:"standard", label:"Standard",  icon:"🫁", color:T.teal,
    tv:"6–8 mL/kg IBW", rr:"12–16/min", fio2:"100% → titrate SpO₂ ≥ 95%",
    peep:"5 cmH₂O", ie:"1:2", pip:"< 35 cmH₂O",
    goal:"SpO₂ 94–98%, EtCO₂ 35–45 mmHg",
    notes:["Confirm ETT position with EtCO₂ and CXR","Titrate FiO₂ down as tolerated","Start sedation (propofol or ketamine infusion)","Orogastric tube, Foley, repeat exam"],
  },
  { id:"ards", label:"ARDS",     icon:"🌡️", color:T.red,
    tv:"6 mL/kg IBW (strict lung-protective)", rr:"14–20/min (titrate pH ≥ 7.25)", fio2:"Per ARDSnet FiO₂/PEEP table",
    peep:"8–15 cmH₂O (higher with worse oxygenation)", ie:"1:2", pip:"Plateau pressure < 30 cmH₂O",
    goal:"SpO₂ 88–95% acceptable, permissive hypercapnia pH ≥ 7.20",
    notes:["Plateau pressure target: < 30 cmH₂O — check with breath hold + flow pause","Driving pressure (plateau − PEEP) < 15 cmH₂O associated with survival benefit","ARDSnet FiO₂/PEEP table: if FiO₂ 0.5 → PEEP 8; FiO₂ 0.7 → PEEP 10; FiO₂ 0.9 → PEEP 14","Consider prone positioning if P/F ratio < 150 for 12+ hours","Early paralysis (cisatracurium) if P/F < 150 + severe dysynchrony"],
  },
  { id:"copd", label:"COPD / Asthma", icon:"💨", color:T.orange,
    tv:"6–8 mL/kg IBW", rr:"10–14/min (reduce to allow expiratory time)", fio2:"100% → titrate",
    peep:"5 cmH₂O (intrinsic PEEP often present — do not add external PEEP routinely)", ie:"1:4 to 1:5 (prolonged expiration)",
    pip:"Minimize — target Ppeak < 50, Pplat < 30",
    goal:"Permissive hypercapnia (pH ≥ 7.20, PaCO₂ up to 80) acceptable — prevent dynamic hyperinflation",
    notes:["Disconnect from vent and manually compress chest to release auto-PEEP if hemodynamic collapse","AutoPEEP detection: end-expiratory pause → flow returns to zero before next breath","Ketamine infusion preferred sedation — bronchodilator effect","Avoid breath stacking — allow full expiration before next breath","Heliox (70:30) can reduce resistance in severe bronchospasm"],
  },
  { id:"tbi", label:"TBI / ↑ICP", icon:"🧠", color:T.purple,
    tv:"6–8 mL/kg IBW", rr:"14–18/min (target PaCO₂ 35–40 mmHg)", fio2:"100% → SpO₂ ≥ 98%",
    peep:"5 cmH₂O (higher PEEP may ↑ICP — use cautiously)", ie:"1:2",
    pip:"< 35 cmH₂O",
    goal:"PaCO₂ 35–40 mmHg strictly. SpO₂ ≥ 95%. MAP ≥ 80 mmHg. CPP > 60 mmHg",
    notes:["Brief hyperventilation (PaCO₂ 30–35) ONLY for acute herniation as bridge to definitive treatment","AVOID prolonged hypocapnia — causes cerebral vasoconstriction and ischemia","Elevate HOB 30° after tube secured","PEEP > 8 may impair cerebral venous drainage — use minimum effective PEEP","Avoid hypotension (SBP < 90) — devastating in TBI","Sedation: propofol (ICP reduction) + fentanyl infusion"],
  },
  { id:"shock", label:"Hemodynamic Shock", icon:"❤️", color:T.coral,
    tv:"6–8 mL/kg IBW", rr:"12–16/min", fio2:"100% initially",
    peep:"0–5 cmH₂O (minimize — every breath reduces venous return)", ie:"1:2 to 1:3",
    pip:"As low as possible",
    goal:"Maintain MAP ≥ 65 mmHg. Minimize vent pressures that impair venous return",
    notes:["Positive pressure ventilation reduces preload — anticipate BP drop at intubation","Fluid bolus before intubation if time permits","Norepinephrine or push-dose epinephrine ready before laryngoscopy","Consider permissive hypercapnia to minimize minute ventilation and pressure","RV failure: avoid high PEEP, maintain sinus rhythm, consider inhaled pulmonary vasodilator"],
  },
];

// ── Surgical Airway Checklist ─────────────────────────────────────
const SURGICAL_STEPS = [
  { phase:"Confirm CICO", color:T.red, icon:"🚨",
    items:[
      "Two failed intubation attempts with optimal technique",
      "Cannot oxygenate with bag-valve-mask despite 2-person technique",
      "Supraglottic airway failed or not available",
      "CALL IT: 'This is a CICO situation — performing surgical airway'",
    ]},
  { phase:"Positioning & Prep", color:T.orange, icon:"⚡",
    items:[
      "Maximal neck extension (place roll under shoulders if time permits)",
      "Identify thyroid cartilage with dominant hand",
      "Walk down midline: thyroid cartilage → CTM → cricoid cartilage",
      "CTM is soft tissue between thyroid and cricoid — approximately 1 cm wide, 2.5 cm wide",
      "Prep skin with betadine or ChloraPrep if accessible — do not delay for this",
    ]},
  { phase:"Scalpel-Finger-Bougie Technique", color:T.yellow, icon:"✂️",
    items:[
      "Stabilize larynx: non-dominant thumb and middle finger straddle thyroid cartilage",
      "Vertical skin incision: 3–4 cm vertical stab over CTM (avoids vessels)",
      "Tracheal hook (if available): retract thyroid cartilage superiorly for exposure",
      "Horizontal CTM incision: stab incision through inferior half of CTM — inferior placement avoids cricothyroid arteries (superior edge)",
      "Insert bougie (or dilator finger first) through CTM incision — aim caudally",
      "Railroad ETT 6.0 cuffed over bougie — only advance to 3–4 cm below CTM (do not advance too deep — right mainstem)",
      "Inflate cuff, ventilate, confirm EtCO₂",
    ]},
  { phase:"Confirmation & Securing", color:T.green, icon:"✅",
    items:[
      "Bilateral breath sounds — right side equal to left (right mainstem risk is high with surgical airway)",
      "EtCO₂ waveform confirmation — mandatory",
      "Secure tube: ties/tape + written marking at skin level",
      "CXR — confirm ETT tip 2–4 cm above carina",
      "Document CICO event, technique, attempts, and disposition plan",
      "ENT / thoracic surgery notification for formal tracheostomy within 24–72 hours",
    ]},
];

// ── VL vs DL Decision Factors ─────────────────────────────────────
const VL_INDICATIONS = [
  "Predicted difficult airway (LEMON ≥ 4)",
  "C-spine immobilization in place",
  "Morbid obesity / short thick neck",
  "Reduced mouth opening (> 2 cm adequate for VL blade)",
  "Failed DL — mandatory switch to VL on second attempt",
  "Inexperienced intubator (VL provides shared view for coaching)",
  "Unstable C-spine — hyperangulated blade minimizes neck movement",
  "Large tongue / anterior airway (grade 3–4 Cormack-Lehane on DL)",
];
const DL_INDICATIONS = [
  "Experienced operator with DL, no predicted difficulty",
  "Blood / vomit-filled airway (VL camera can obscure — SALAD technique + DL preferred by some)",
  "Equipment failure / VL unavailable",
  "Extremely time-critical intubation where DL is faster for the operator",
  "Subglottic stenosis / fixed obstruction (VL provides less force for passage)",
];
const VL_TIPS = [
  "Hyperangulated blades (C-MAC D-Blade, GlideScope): great view but requires stylet shaped to blade curvature — cannot use standard technique",
  "Macintosh-style VL blades (C-MAC MAC, McGrath MAC): familiar feel + video — best for training and most EM situations",
  "SALAD suction technique: suction catheter in left oropharynx frees right side for blade, continuous suction during laryngoscopy",
  "External laryngeal manipulation (BURP, Sellick): BURP moves larynx backward-upward-rightward to improve view",
  "Bougie-first technique: insert bougie under direct or video view before advancing ETT — reduces failed first pass",
];

const TABS = [
  {id:"rsi",     label:"RSI Calculator",   icon:"💉"},
  {id:"lemon",   label:"Airway Assessment", icon:"🔍"},
  {id:"algo",    label:"Algorithm",         icon:"🧭"},
  {id:"scope",   label:"VL vs DL",         icon:"🎥"},
  {id:"vent",    label:"Post-Intubation",   icon:"🫁"},
  {id:"surgical",label:"Surgical Airway",   icon:"✂️"},
];

// ── Module-Scope Primitives ───────────────────────────────────────
function AmbientBg() {
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0}}>
      <div style={{position:"absolute",top:"-12%",left:"-8%",width:"50%",height:"50%",background:"radial-gradient(circle,rgba(255,107,107,0.08) 0%,transparent 70%)"}}/>
      <div style={{position:"absolute",bottom:"-10%",right:"-5%",width:"45%",height:"45%",background:"radial-gradient(circle,rgba(0,229,192,0.07) 0%,transparent 70%)"}}/>
      <div style={{position:"absolute",top:"38%",left:"28%",width:"34%",height:"34%",background:"radial-gradient(circle,rgba(155,109,255,0.05) 0%,transparent 70%)"}}/>
    </div>
  );
}

function DrugCard({ drug, weight, expanded, onToggle }) {
  const dose = weight > 0 ? drug.calc(weight) : null;
  const vol  = weight > 0 ? drug.vol(weight) : null;
  const catColors = {Induction:T.blue, Paralytic:T.coral, Pretreatment:T.yellow, Reversal:T.red};
  const catColor = catColors[drug.cat] || T.teal;
  return (
    <div className="drug-card" onClick={onToggle}
      style={{...glass, overflow:"hidden", borderTop:`3px solid ${drug.color}`,
        border:`1px solid ${expanded?drug.color+"55":"rgba(42,79,122,0.35)"}`,
        borderTopColor:drug.color, cursor:"pointer"}}>
      <div style={{padding:"12px 14px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,marginBottom:8}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:3,flexWrap:"wrap"}}>
              <span style={{fontFamily:"Playfair Display",fontSize:15,fontWeight:700,color:drug.color}}>{drug.name}</span>
              <span style={{fontFamily:"JetBrains Mono",fontSize:8,fontWeight:700,color:drug.badgeColor,background:`${drug.badgeColor}18`,border:`1px solid ${drug.badgeColor}44`,padding:"1px 6px",borderRadius:4,textTransform:"uppercase",letterSpacing:0.8}}>{drug.badge}</span>
              <span style={{fontFamily:"JetBrains Mono",fontSize:8,color:catColor,background:`${catColor}12`,border:`1px solid ${catColor}33`,padding:"1px 6px",borderRadius:4,textTransform:"uppercase"}}>{drug.cat}</span>
            </div>
            <div style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.txt3}}>{drug.dose}</div>
          </div>
          <span style={{color:T.txt4,fontSize:12,flexShrink:0}}>{expanded?"▲":"▼"}</span>
        </div>
        {/* Calculated dose strip */}
        {dose ? (
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
            <div style={{padding:"7px 10px",background:`${drug.color}12`,border:`1px solid ${drug.color}33`,borderRadius:8,textAlign:"center"}}>
              <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.txt4,marginBottom:3,textTransform:"uppercase"}}>Dose</div>
              <div className="dose-num" style={{fontFamily:"JetBrains Mono",fontWeight:700,fontSize:15,color:drug.color,lineHeight:1}}>
                {dose.min === dose.max ? `${Math.round(dose.min)}` : `${Math.round(dose.min)}–${Math.round(dose.max)}`}
                <span style={{fontSize:10,fontWeight:400,marginLeft:2}}>{dose.unit}</span>
              </div>
            </div>
            <div style={{padding:"7px 10px",background:"rgba(14,37,68,0.6)",border:"1px solid rgba(42,79,122,0.3)",borderRadius:8,textAlign:"center"}}>
              <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.txt4,marginBottom:3,textTransform:"uppercase"}}>Volume</div>
              <div style={{fontFamily:"JetBrains Mono",fontWeight:700,fontSize:13,color:T.teal,lineHeight:1}}>{vol}</div>
            </div>
            <div style={{padding:"7px 10px",background:"rgba(14,37,68,0.6)",border:"1px solid rgba(42,79,122,0.3)",borderRadius:8,textAlign:"center"}}>
              <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.txt4,marginBottom:3,textTransform:"uppercase"}}>Onset</div>
              <div style={{fontFamily:"JetBrains Mono",fontWeight:700,fontSize:11,color:T.txt2,lineHeight:1}}>{drug.onset}</div>
            </div>
          </div>
        ) : (
          <div style={{padding:"7px 10px",background:"rgba(14,37,68,0.4)",border:"1px solid rgba(42,79,122,0.2)",borderRadius:8,fontFamily:"DM Sans",fontSize:11,color:T.txt4,textAlign:"center"}}>
            Enter patient weight above to calculate dose
          </div>
        )}
      </div>
      {expanded && (
        <div className="fade-in" style={{borderTop:"1px solid rgba(42,79,122,0.3)",padding:"12px 14px 14px"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:10}}>
            <div>
              <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.txt4,textTransform:"uppercase",letterSpacing:1.5,marginBottom:7}}>Indications</div>
              {drug.indications.map((item,i) => (
                <div key={i} style={{display:"flex",gap:6,marginBottom:4}}>
                  <span style={{color:drug.color,fontSize:8,marginTop:2,flexShrink:0}}>▸</span>
                  <span style={{fontFamily:"DM Sans",fontSize:11,color:T.txt2,lineHeight:1.5}}>{item}</span>
                </div>
              ))}
            </div>
            <div>
              <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.coral,textTransform:"uppercase",letterSpacing:1.5,marginBottom:7}}>Cautions / CI</div>
              {drug.cautions.map((item,i) => (
                <div key={i} style={{display:"flex",gap:6,marginBottom:4}}>
                  <span style={{color:T.coral,fontSize:8,marginTop:2,flexShrink:0}}>⚠</span>
                  <span style={{fontFamily:"DM Sans",fontSize:11,color:T.txt2,lineHeight:1.5}}>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{padding:"9px 12px",background:`${drug.color}08`,border:`1px solid ${drug.color}22`,borderRadius:8,display:"flex",gap:8}}>
            <span style={{fontSize:12,flexShrink:0,marginTop:1}}>💎</span>
            <span style={{fontFamily:"DM Sans",fontSize:12,color:T.txt,lineHeight:1.6,fontStyle:"italic"}}>{drug.pearl}</span>
          </div>
          {weight > 0 && (
            <div style={{marginTop:8,padding:"7px 12px",background:"rgba(14,37,68,0.6)",border:"1px solid rgba(42,79,122,0.3)",borderRadius:7,fontFamily:"JetBrains Mono",fontSize:10,color:T.txt3}}>
              Conc: {drug.conc} · Duration: {drug.duration} · Max: {drug.maxDose}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BulletRow({ text, color, small }) {
  return (
    <div style={{display:"flex",gap:7,alignItems:"flex-start",marginBottom:4}}>
      <span style={{color:color||T.teal,fontSize:small?8:9,marginTop:small?3:2,flexShrink:0}}>▸</span>
      <span style={{fontFamily:"DM Sans",fontSize:small?11:12,color:T.txt2,lineHeight:1.5}}>{text}</span>
    </div>
  );
}

function CheckItem({ text, checked, onToggle, color }) {
  return (
    <div className="check-row" onClick={onToggle}
      style={{display:"flex",gap:10,alignItems:"flex-start",padding:"7px 10px",borderRadius:8,cursor:"pointer",background:checked?`${color||T.teal}0d`:"transparent",border:`1px solid ${checked?(color||T.teal)+"33":"rgba(42,79,122,0.15)"}`,marginBottom:4,transition:"all .12s"}}>
      <div style={{width:16,height:16,borderRadius:4,border:`2px solid ${checked?(color||T.teal):T.txt4}`,background:checked?(color||T.teal):"transparent",flexShrink:0,marginTop:1,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .12s"}}>
        {checked && <span style={{color:"#050f1e",fontSize:10,fontWeight:900,lineHeight:1}}>✓</span>}
      </div>
      <span style={{fontFamily:"DM Sans",fontSize:12,color:checked?T.txt:T.txt2,lineHeight:1.5,textDecoration:checked?"line-through":undefined,textDecorationColor:"rgba(255,255,255,0.25)"}}>{text}</span>
    </div>
  );
}

function VentCard({ preset, active, onSelect }) {
  return (
    <div onClick={onSelect}
      style={{...glass,cursor:"pointer",overflow:"hidden",borderLeft:`4px solid ${preset.color}`,border:`1px solid ${active?preset.color+"55":"rgba(42,79,122,0.35)"}`,borderLeftColor:preset.color,background:active?`linear-gradient(135deg,${preset.color}12,rgba(8,22,40,0.8))`:"rgba(8,22,40,0.78)"}}>
      <div style={{padding:"10px 14px",display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontSize:18}}>{preset.icon}</span>
        <span style={{fontFamily:"Playfair Display",fontWeight:700,fontSize:14,color:active?preset.color:T.txt}}>{preset.label}</span>
        {active && <span style={{marginLeft:"auto",fontFamily:"JetBrains Mono",fontSize:9,color:preset.color,background:`${preset.color}18`,padding:"1px 7px",borderRadius:4}}>ACTIVE</span>}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────
export default function AirwayHub() {
  const [tab,        setTab]        = useState("rsi");
  const [weight,     setWeight]     = useState("");
  const [expanded,   setExpanded]   = useState(null);
  const [lemonItems, setLemonItems] = useState(new Set());
  const [checked,    setChecked]    = useState(new Set());
  const [ventPreset, setVentPreset] = useState("standard");
  const [height,     setHeight]     = useState("");
  const [sex,        setSex]        = useState("M");
  const [algoStep,   setAlgoStep]   = useState(0);

  const wt = parseFloat(weight) || 0;

  const toggleDrug   = useCallback(id => setExpanded(p => p === id ? null : id), []);
  const toggleLemon  = useCallback(id => setLemonItems(p => { const n = new Set(p); n.has(id)?n.delete(id):n.add(id); return n; }), []);
  const toggleCheck  = useCallback(id => setChecked(p => { const n = new Set(p); n.has(id)?n.delete(id):n.add(id); return n; }), []);

  const lemonScore = useMemo(() => lemonItems.size, [lemonItems]);
  const lemonRisk  = useMemo(() => {
    if (lemonScore === 0) return null;
    if (lemonScore >= 4) return { label:"HIGH RISK", sub:"Predicted difficult airway — modify approach", color:T.red };
    if (lemonScore >= 2) return { label:"MODERATE RISK", sub:"Prepare for possible difficulty", color:T.orange };
    return { label:"LOW RISK", sub:"Standard RSI appropriate with standard backup", color:T.green };
  }, [lemonScore]);

  const ibw = useMemo(() => {
    const h = parseFloat(height) || 0;
    if (!h) return null;
    const base = sex === "M" ? 50 : 45.5;
    return Math.round(base + 2.3 * (h - 60));
  }, [height, sex]);

  const activeVent = VENT_PRESETS.find(v => v.id === ventPreset);
  const tvRange = ibw ? `${Math.round(ibw*6)}–${Math.round(ibw*8)} mL` : "6–8 mL/kg IBW";

  const RSI_CATS = ["Induction","Paralytic","Pretreatment","Reversal"];

  return (
    <div style={{fontFamily:"DM Sans, sans-serif",background:T.bg,minHeight:"100vh",position:"relative",overflow:"hidden",color:T.txt}}>
      <AmbientBg/>
      <div style={{position:"relative",zIndex:1,maxWidth:1440,margin:"0 auto",padding:"0 16px"}}>

        {/* ── Header ──────────────────────────────────────────── */}
        <div style={{padding:"18px 0 14px"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
            <div style={{backdropFilter:"blur(40px)",WebkitBackdropFilter:"blur(40px)",background:"rgba(5,15,30,0.9)",border:"1px solid rgba(42,79,122,0.6)",borderRadius:10,padding:"5px 12px",display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.teal,letterSpacing:3}}>NOTRYA</span>
              <span style={{color:T.txt4,fontFamily:"JetBrains Mono",fontSize:10}}>/</span>
              <span style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.txt3,letterSpacing:2}}>AIRWAY HUB</span>
            </div>
            <div style={{height:1,flex:1,background:"linear-gradient(90deg,rgba(42,79,122,0.6),transparent)"}}/>
          </div>
          <h1 className="shimmer-text" style={{fontFamily:"Playfair Display",fontSize:"clamp(24px,4vw,40px)",fontWeight:900,letterSpacing:-1,lineHeight:1.1}}>Airway Hub</h1>
          <p style={{fontFamily:"DM Sans",fontSize:12,color:T.txt3,marginTop:4}}>RSI calculator · Airway assessment · Difficult airway algorithm · VL vs DL · Post-intubation vent · Surgical airway</p>
        </div>

        {/* ── Stat Banner ─────────────────────────────────────── */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:10,marginBottom:16}}>
          {[
            {label:"RSI Sequence",  value:"3 min",         sub:"T-minus to drugs",          color:T.teal  },
            {label:"Succinylcholine",value:"1.5 mg/kg",    sub:"RSI intubating dose",        color:T.coral },
            {label:"Rocuronium RSI",value:"1.2 mg/kg",    sub:"Double standard dose",        color:T.orange},
            {label:"Sugammadex CICO",value:"16 mg/kg",    sub:"Must be at bedside w/ Roc",   color:T.red   },
            {label:"LEMON ≥ 4",    value:"Difficult",      sub:"Modify approach",             color:T.yellow},
            {label:"CICO Threshold",value:"2 Failed",      sub:"Attempts → surgical airway",  color:T.purple},
          ].map((b,i) => (
            <div key={i} style={{...glass,padding:"9px 13px",borderLeft:`3px solid ${b.color}`,background:`linear-gradient(135deg,${b.color}12,rgba(8,22,40,0.8))`,borderRadius:10}}>
              <div style={{fontFamily:"JetBrains Mono",fontSize:14,fontWeight:700,color:b.color,lineHeight:1}}>{b.value}</div>
              <div style={{fontFamily:"DM Sans",fontWeight:600,color:T.txt,fontSize:10,margin:"3px 0"}}>{b.label}</div>
              <div style={{fontFamily:"DM Sans",fontSize:10,color:T.txt4}}>{b.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Tabs ────────────────────────────────────────────── */}
        <div style={{...glass,padding:"6px",display:"flex",gap:5,marginBottom:16,flexWrap:"wrap"}}>
          {TABS.map(t => (
            <button key={t.id} onClick={()=>{setTab(t.id);setExpanded(null);}}
              style={{flex:"1 1 auto",fontFamily:"DM Sans",fontWeight:600,fontSize:12,padding:"9px 8px",borderRadius:10,border:`1px solid ${tab===t.id?"rgba(255,107,107,0.5)":"transparent"}`,background:tab===t.id?"linear-gradient(135deg,rgba(255,107,107,0.18),rgba(255,107,107,0.07))":"transparent",color:tab===t.id?T.coral:T.txt3,cursor:"pointer",textAlign:"center",transition:"all .15s",whiteSpace:"nowrap"}}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ════════════════════════════════════════════════════ */}
        {/* RSI CALCULATOR                                       */}
        {/* ════════════════════════════════════════════════════ */}
        {tab === "rsi" && (
          <div className="fade-in">
            {/* Weight input */}
            <div style={{...glass,padding:"16px 20px",marginBottom:16,borderLeft:`4px solid ${T.teal}`}}>
              <div style={{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
                <div style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.teal,textTransform:"uppercase",letterSpacing:2}}>Patient Weight</div>
                <div style={{display:"flex",alignItems:"center",gap:8,background:"rgba(14,37,68,0.8)",border:`2px solid ${wt>0?"rgba(0,229,192,0.5)":"rgba(42,79,122,0.4)"}`,borderRadius:10,padding:"8px 14px"}}>
                  <input type="number" min="1" max="300" value={weight} onChange={e=>setWeight(e.target.value)} placeholder="e.g. 80"
                    style={{background:"transparent",border:"none",outline:"none",color:T.txt,fontFamily:"JetBrains Mono",fontSize:22,fontWeight:700,width:70}}/>
                  <span style={{fontFamily:"JetBrains Mono",fontSize:12,color:wt>0?T.teal:T.txt4,fontWeight:700}}>kg</span>
                </div>
                {wt > 0 && (
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    {[
                      {label:"Ketamine 2 mg/kg",    val:`${Math.round(wt*2)} mg`,    color:T.teal  },
                      {label:"Etomidate 0.3 mg/kg", val:`${Math.round(wt*0.3)} mg`,  color:T.blue  },
                      {label:"Succinylcholine 1.5", val:`${Math.round(wt*1.5)} mg`,  color:T.coral },
                      {label:"Rocuronium 1.2",      val:`${Math.round(wt*1.2)} mg`,  color:T.orange},
                    ].map((d,i) => (
                      <div key={i} style={{padding:"5px 12px",background:`${d.color}15`,border:`1px solid ${d.color}44`,borderRadius:20,display:"flex",gap:6,alignItems:"center"}}>
                        <span style={{fontFamily:"DM Sans",fontSize:10,color:T.txt3}}>{d.label}:</span>
                        <span style={{fontFamily:"JetBrains Mono",fontSize:12,fontWeight:700,color:d.color}}>{d.val}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {RSI_CATS.map(cat => (
              <div key={cat} style={{marginBottom:16}}>
                <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:2,marginBottom:8,paddingLeft:2}}>
                  {cat === "Induction" && "── Induction Agents"}
                  {cat === "Paralytic" && "── Paralytics"}
                  {cat === "Pretreatment" && "── Pretreatment / Adjuncts"}
                  {cat === "Reversal" && "── Reversal"}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(380px,1fr))",gap:10}}>
                  {RSI_DRUGS.filter(d=>d.cat===cat).map(drug => (
                    <DrugCard key={drug.id} drug={drug} weight={wt} expanded={expanded===drug.id} onToggle={()=>toggleDrug(drug.id)}/>
                  ))}
                </div>
              </div>
            ))}

            {/* RSI Sequence Timeline */}
            <div style={{...glass,padding:"16px 20px",marginTop:8,borderLeft:`3px solid ${T.teal}`}}>
              <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.teal,textTransform:"uppercase",letterSpacing:2,marginBottom:14}}>RSI Sequence Timeline</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:10}}>
                {[
                  {t:"T −15 min",label:"Preparation",color:T.txt3,items:["IV access × 2 confirmed","Preoxygenate NRB 15L/min","Position: sniffing + ramp","Draw up all medications","BVM ready, suction on","Team brief: roles + backup plan"]},
                  {t:"T −3 min",label:"Pretreatment",color:T.yellow,items:["Fentanyl 3 mcg/kg IV (if indicated)","Lidocaine 1.5 mg/kg (if elevated ICP)","Atropine (peds only)","Continue apneic oxygenation 15L NC","Final check: ETCO₂ attached","Confirm ETT size and stylet shape"]},
                  {t:"T 0",label:"Induction + Paralytic",color:T.coral,items:["Push induction agent (ketamine or etomidate)","SIMULTANEOUS: push paralytic","Maintain cricoid pressure (optional/controversial)","Count to 45 seconds","Maintain oxygenation via NC","DO NOT bag-mask (aspiration risk)"]},
                  {t:"T +45 sec",label:"Laryngoscopy",color:T.teal,items:["Laryngoscopy when jaw relaxed","BURP if view poor (Cormack-Lehane ≥ 3)","Bougie if anterior airway","ETT 7.0–8.0 men, 6.5–7.5 women","Inflate cuff immediately","STOP at T+90 sec if unsuccessful"]},
                  {t:"T +60 sec",label:"Confirmation",color:T.green,items:["EtCO₂ waveform — mandatory","Bilateral breath sounds","Chest rise symmetrical","SpO₂ trend improving","Secure tube with ties + tape","Chest X-ray order placed"]},
                  {t:"T +5 min",label:"Post-Intubation",color:T.purple,items:["Sedation infusion: propofol or ketamine","Analgesia: fentanyl infusion","Vent settings per indication","Orogastric tube placement","Foley catheter if not placed","Document: ETT depth, CXR result"]},
                ].map((phase,i) => (
                  <div key={i} style={{padding:"12px 14px",background:`${phase.color}0a`,border:`1px solid ${phase.color}25`,borderRadius:10}}>
                    <div style={{fontFamily:"JetBrains Mono",fontSize:10,fontWeight:700,color:phase.color,marginBottom:2}}>{phase.t}</div>
                    <div style={{fontFamily:"DM Sans",fontWeight:600,fontSize:12,color:T.txt,marginBottom:8}}>{phase.label}</div>
                    {phase.items.map((item,j) => <BulletRow key={j} text={item} color={phase.color} small/>)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════ */}
        {/* LEMON ASSESSMENT                                     */}
        {/* ════════════════════════════════════════════════════ */}
        {tab === "lemon" && (
          <div className="fade-in">
            <div style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.yellow,textTransform:"uppercase",letterSpacing:2,marginBottom:6}}>
              LEMON Airway Assessment — Click Each Positive Finding
            </div>
            <div style={{padding:"10px 14px",background:"rgba(245,200,66,0.07)",border:"1px solid rgba(245,200,66,0.2)",borderRadius:10,marginBottom:14,fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.7}}>
              📋 <strong style={{color:T.yellow}}>Score ≥ 4 = predicted difficult airway.</strong> Check all applicable findings. Each checked item contributes one point. Use in combination with clinical gestalt — experienced providers may intubate despite high LEMON scores.
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              {/* Checklist column */}
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                {LEMON.map(cat => (
                  <div key={cat.id} style={{...glass,padding:"14px 16px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                      <div style={{width:28,height:28,borderRadius:"50%",background:"rgba(245,200,66,0.15)",border:"1px solid rgba(245,200,66,0.4)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        <span style={{fontFamily:"JetBrains Mono",fontSize:12,fontWeight:700,color:T.yellow}}>{cat.letter}</span>
                      </div>
                      <div>
                        <div style={{fontFamily:"DM Sans",fontWeight:700,fontSize:13,color:T.txt}}>{cat.label}</div>
                        <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.txt4}}>
                          {[...lemonItems].filter(id=>cat.items.some((_,j)=>`${cat.id}-${j}` === id)).length} / {cat.items.length} selected
                        </div>
                      </div>
                    </div>
                    {cat.items.map((item,j) => {
                      const itemId = `${cat.id}-${j}`;
                      return (
                        <CheckItem key={itemId} text={item} checked={lemonItems.has(itemId)}
                          onToggle={()=>toggleLemon(itemId)} color={T.yellow}/>
                      );
                    })}
                  </div>
                ))}
                <button onClick={()=>setLemonItems(new Set())}
                  style={{fontFamily:"DM Sans",fontWeight:600,fontSize:11,color:T.txt4,background:"rgba(42,79,122,0.15)",border:"1px solid rgba(42,79,122,0.3)",borderRadius:8,padding:"8px",cursor:"pointer"}}>
                  Clear All Findings
                </button>
              </div>

              {/* Score + interpretation column */}
              <div style={{position:"sticky",top:16,alignSelf:"start",display:"flex",flexDirection:"column",gap:12}}>
                <div style={{...glass,padding:"22px 24px",textAlign:"center"}}>
                  <div style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.txt4,textTransform:"uppercase",letterSpacing:2,marginBottom:10}}>LEMON Score</div>
                  <div style={{fontFamily:"JetBrains Mono",fontSize:72,fontWeight:900,lineHeight:1,color:lemonScore>=4?T.red:lemonScore>=2?T.orange:lemonScore>0?T.green:T.txt4}}>{lemonScore}</div>
                  <div style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.txt4,marginTop:4,marginBottom:14}}>OUT OF {LEMON.reduce((a,c)=>a+c.items.length,0)} FINDINGS</div>
                  {lemonRisk ? (
                    <div style={{padding:"12px 16px",background:`${lemonRisk.color}12`,border:`1px solid ${lemonRisk.color}44`,borderRadius:10}}>
                      <div style={{fontFamily:"JetBrains Mono",fontSize:13,fontWeight:700,color:lemonRisk.color,marginBottom:4}}>{lemonRisk.label}</div>
                      <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.5}}>{lemonRisk.sub}</div>
                    </div>
                  ) : (
                    <div style={{padding:"12px 16px",background:"rgba(42,79,122,0.15)",border:"1px solid rgba(42,79,122,0.3)",borderRadius:10,fontFamily:"DM Sans",fontSize:12,color:T.txt4}}>Select positive findings to calculate score</div>
                  )}
                </div>

                {/* LEMON interpretation reference */}
                <div style={{...glass,padding:"16px 18px"}}>
                  <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:1.5,marginBottom:10}}>Score Interpretation</div>
                  {[{s:"0–1",l:"Standard RSI",c:T.green,d:"Video laryngoscopy available as backup but DL acceptable for experienced operators"},
                    {s:"2–3",l:"Moderate Risk",c:T.orange,d:"Have VL set up as primary or immediate backup. Plan A and Plan B verbalized to team"},
                    {s:"4–5",l:"Difficult Airway",c:T.red,d:"VL as first attempt. Consider awake intubation or delayed sequence intubation (DSI)"},
                    {s:"≥ 6",l:"Extreme Risk",c:T.red,d:"Awake intubation (fiberoptic), awake surgical airway, or front-of-neck access prepared before induction"},
                  ].map((row,i) => (
                    <div key={i} style={{display:"flex",gap:10,padding:"7px 10px",background:"rgba(14,37,68,0.4)",borderRadius:7,marginBottom:5,border:`1px solid ${row.c}22`}}>
                      <span style={{fontFamily:"JetBrains Mono",fontSize:11,fontWeight:700,color:row.c,minWidth:36,flexShrink:0}}>{row.s}</span>
                      <div>
                        <div style={{fontFamily:"DM Sans",fontWeight:700,fontSize:12,color:row.c,marginBottom:2}}>{row.l}</div>
                        <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt3,lineHeight:1.4}}>{row.d}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Additional assessment tools */}
                <div style={{...glass,padding:"14px 16px"}}>
                  <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:1.5,marginBottom:10}}>Complementary Assessment</div>
                  {[
                    {label:"Cormack-Lehane Grade", tip:"Grade 1: full glottis; Grade 2: posterior only; Grade 3: epiglottis only; Grade 4: neither glottis nor epiglottis. Grade 3–4 = difficult."},
                    {label:"Upper Lip Bite Test",   tip:"Class I: lower incisors bite above upper lip vermilion; Class III: cannot bite upper lip at all → difficult."},
                    {label:"Thyromental distance",  tip:"< 6 cm (< 3 finger-widths) = anterior airway. Measured from thyroid notch to mentum with neck extended."},
                    {label:"Neck circumference",    tip:"> 40 cm in males associated with difficult mask ventilation and intubation. OSA + large neck = major risk factor."},
                  ].map((item,i) => (
                    <div key={i} style={{marginBottom:8}}>
                      <div style={{fontFamily:"DM Sans",fontWeight:700,fontSize:12,color:T.teal,marginBottom:2}}>{item.label}</div>
                      <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt3,lineHeight:1.5}}>{item.tip}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════ */}
        {/* DIFFICULT AIRWAY ALGORITHM                          */}
        {/* ════════════════════════════════════════════════════ */}
        {tab === "algo" && (
          <div className="fade-in">
            <div style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.coral,textTransform:"uppercase",letterSpacing:2,marginBottom:6}}>
              EM Difficult Airway Algorithm — Click Each Step to Expand
            </div>
            <div style={{padding:"10px 14px",background:"rgba(255,107,107,0.07)",border:"1px solid rgba(255,107,107,0.2)",borderRadius:10,marginBottom:14,fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.7}}>
              🚨 <strong style={{color:T.coral}}>In every airway emergency:</strong> Verbalize your plan to the team before induction. State Plan A, Plan B, and the CICO threshold out loud. The highest risk moment is loss of airway after induction — prevent it with preparation, not reaction.
            </div>

            {[
              { step:"PREPARE — Before Any RSI", icon:"🛠️", color:T.teal, alwaysOpen:true,
                content:[
                  {head:"Preoxygenation (3–5 minutes)",  items:["NRB at 15L/min with good seal × 3–5 min — goal: SpO₂ 100%, denitrogenate lungs","NC at 15L/min left in place during RSI (apneic oxygenation — extends safe apnea time to 3–8 min)","HFNC at 60L/min if available — superior preoxygenation and apneic oxygenation","BVM 8 breaths in 60 sec if SpO₂ < 93% and no aspiration risk before induction"]},
                  {head:"Positioning", items:["Ear-to-sternal-notch alignment (sniffing position + ramping) — critical for obese patients","Bed at intubator's xiphoid level","Shoulder roll for surgical airway access position"]},
                  {head:"Equipment Check", items:["VL on, camera working, screen visible","ETT × 2 (planned size + one smaller), stylet, 10 mL syringe for cuff","Suction catheter: Yankauer attached and running","BVM attached to O₂, PEEP valve 5 cmH₂O attached","Surgical airway kit in room: scalpel, bougie, ETT 6.0, tracheal hook"]},
                ]
              },
              { step:"DECISION — Anticipated Difficult Airway?", icon:"🔍", color:T.yellow,
                content:[
                  {head:"Use Standard RSI if:", items:["LEMON score < 4 AND no single high-risk LEMON factor","Operator experience with standard RSI","VL available as backup","No obstruction, angioedema, or massive bleeding in airway"]},
                  {head:"Modify Approach (LEMON ≥ 4) if:", items:["LEMON ≥ 4 — discuss with team, state backup plan","Angioedema / epiglottitis / deep space infection — awake look first","Massive hemoptysis / emesis — SALAD technique prepared","C-spine injury — manual in-line stabilization ready, hyperangulated VL preferred","Predicted grade 3–4 Cormack-Lehane — VL primary, bougie in hand"]},
                  {head:"Modified RSI Options:", items:["Video laryngoscopy as primary attempt (not backup)","Delayed sequence intubation (DSI): ketamine 1 mg/kg for sedation + preoxygenation, then RSI","Awake fiberoptic intubation (time permitting): topical anesthesia + transtracheal block","Awake cricothyrotomy if complete obstruction and cannot oxygenate"]},
                ]
              },
              { step:"ATTEMPT 1 — First Pass Success Goal", icon:"1️⃣", color:T.blue,
                content:[
                  {head:"Optimize First Attempt", items:["VL preferred for any difficulty prediction, teaching environment, or inexperienced intubator","Direct laryngoscopy: Macintosh 3–4 or Miller (anterior airways)","BURP (Backward, Upward, Rightward Pressure) by assistant — improves grade by 1–2","Bougie in non-dominant hand: pass if grade 2b–3, feel tracheal rings and carina","Maximum of 90 seconds total laryngoscopy time before surfacing patient","STOP at 90 seconds — BVM ventilate, reassess, do not make third attempt same way"]},
                  {head:"First Pass Metrics", items:["First-pass success rate target: > 90%","If grade 3–4 on first look: call for VL immediately if not already in use","Confirm with EtCO₂ before moving on — do not secure tube without waveform EtCO₂"]},
                ]
              },
              { step:"ATTEMPT 2 — CHANGE SOMETHING", icon:"2️⃣", color:T.orange,
                content:[
                  {head:"Change Something — Never Same Attempt Twice", items:["Switch from DL to VL (or VL blade type: Macintosh to hyperangulated)","Different operator: senior clinician or airway-experienced provider","Different positioning: increase ramp, reposition patient","Smaller ETT size (go down 0.5 mm)","Bougie-first technique if not used on attempt 1","Bimanual laryngoscopy: second provider provides external manipulation","Maximum 2 attempts by same operator — third attempt by different provider only"]},
                ]
              },
              { step:"RESCUE — Supraglottic Airway (SGD)", icon:"🫁", color:T.purple,
                content:[
                  {head:"Deploy SGD After 2 Failed Intubation Attempts", items:["LMA (standard): sizes 3 (< 50 kg), 4 (50–70 kg), 5 (70–100 kg), 6 (> 100 kg)","LMA Supreme / Proseal: preferred over classic — gastric drain port reduces aspiration risk","King LT / King LTS-D: excellent blind insertion device, less operator skill required","Igel: no cuff inflation needed — fastest insertion","SGD is rescue oxygenation — do not wait too long to insert"]},
                  {head:"SGD Limitations", items:["Does not protect airway from aspiration","Seal pressure often < 25 cmH₂O — may not work with poor lung compliance","Cannot be used if oral/pharyngeal obstruction (angioedema, foreign body)","Maximum inflation pressure: 20–22 cmH₂O before cuff leak — limit TV accordingly"]},
                ]
              },
              { step:"⚠ CICO — Surgical Airway", icon:"🚨", color:T.red, cico:true,
                content:[
                  {head:"CICO Declaration — Must Be Verbalized", items:["'This is a CICO situation. I am performing a surgical airway.'","Two failed intubation attempts + failed SGD = CICO","Cannot oxygenate: SpO₂ falling despite BVM + SGD","Do not hesitate — unnecessary delay = death"]},
                  {head:"Immediate Parallel Actions", items:["Call ENT/surgery for emergent tracheostomy — start process","Prepare scalpel-finger-bougie technique (see Surgical Airway tab)","Rocuronium patient? → Sugammadex 16 mg/kg IV immediately (< 3 min reversal)","Do not use needle cricothyrotomy in adults — cannot ventilate adequately > 30–45 min","Jet ventilation via transtracheal catheter buys time but risks barotrauma — use only with functioning expiratory pathway"]},
                ]
              },
            ].map((step,i) => {
              const isOpen = algoStep === i || step.alwaysOpen;
              return (
                <div key={i} className="algo-step" onClick={()=>setAlgoStep(isOpen&&!step.alwaysOpen?-1:i)}
                  style={{...glass,overflow:"hidden",borderLeft:`4px solid ${step.color}`,marginBottom:10,cursor:step.alwaysOpen?"default":"pointer",
                    border:`1px solid ${step.cico?"rgba(255,68,68,0.4)":isOpen?step.color+"44":"rgba(42,79,122,0.35)"}`,
                    borderLeftColor:step.color,background:step.cico?"rgba(255,68,68,0.05)":"rgba(8,22,40,0.78)",
                    transition:"border-color .15s"}}>
                  <div style={{padding:"13px 16px",display:"flex",alignItems:"center",gap:12}}>
                    <span style={{fontSize:step.cico?24:18,flexShrink:0}}>{step.icon}</span>
                    <div style={{flex:1}}>
                      <div style={{fontFamily:"DM Sans",fontWeight:700,fontSize:step.cico?15:13,color:step.color,lineHeight:1.2}}>{step.step}</div>
                    </div>
                    {!step.alwaysOpen && <span style={{color:T.txt4,fontSize:12}}>{isOpen?"▲":"▼"}</span>}
                    {step.cico && <div className="cico-pulse" style={{width:10,height:10,borderRadius:"50%",background:T.red,flexShrink:0}}/>}
                  </div>
                  {(isOpen || step.alwaysOpen) && (
                    <div className="fade-in" style={{padding:"0 16px 16px",borderTop:`1px solid ${step.color}22`}}>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12,marginTop:12}}>
                        {step.content.map((section,j) => (
                          <div key={j} style={{padding:"12px 14px",background:`${step.color}08`,border:`1px solid ${step.color}20`,borderRadius:10}}>
                            <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:step.color,textTransform:"uppercase",letterSpacing:1.5,marginBottom:8}}>{section.head}</div>
                            {section.items.map((item,k) => <BulletRow key={k} text={item} color={step.color}/>)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ════════════════════════════════════════════════════ */}
        {/* VIDEO vs DIRECT LARYNGOSCOPY                        */}
        {/* ════════════════════════════════════════════════════ */}
        {tab === "scope" && (
          <div className="fade-in">
            <div style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.blue,textTransform:"uppercase",letterSpacing:2,marginBottom:6}}>
              Video Laryngoscopy vs Direct Laryngoscopy — Decision Framework
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:16}}>
              {/* VL */}
              <div style={{...glass,padding:"18px 20px",borderTop:`4px solid ${T.teal}`,background:"linear-gradient(135deg,rgba(0,229,192,0.06),rgba(8,22,40,0.85))"}}>
                <div style={{fontFamily:"Playfair Display",fontSize:18,fontWeight:700,color:T.teal,marginBottom:4}}>🎥 Video Laryngoscopy</div>
                <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.teal,textTransform:"uppercase",letterSpacing:1.5,marginBottom:12}}>Prefer or Use First for These Situations</div>
                {VL_INDICATIONS.map((item,i) => <BulletRow key={i} text={item} color={T.teal}/>)}
              </div>
              {/* DL */}
              <div style={{...glass,padding:"18px 20px",borderTop:`4px solid ${T.orange}`,background:"linear-gradient(135deg,rgba(255,159,67,0.06),rgba(8,22,40,0.85))"}}>
                <div style={{fontFamily:"Playfair Display",fontSize:18,fontWeight:700,color:T.orange,marginBottom:4}}>🔦 Direct Laryngoscopy</div>
                <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.orange,textTransform:"uppercase",letterSpacing:1.5,marginBottom:12}}>Situations Where DL May Be Preferable</div>
                {DL_INDICATIONS.map((item,i) => <BulletRow key={i} text={item} color={T.orange}/>)}
              </div>
            </div>

            {/* VL Tips */}
            <div style={{...glass,padding:"16px 20px",marginBottom:14,borderLeft:`3px solid ${T.teal}`}}>
              <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.teal,textTransform:"uppercase",letterSpacing:2,marginBottom:10}}>VL Technical Pearls</div>
              {VL_TIPS.map((tip,i) => <BulletRow key={i} text={tip} color={T.teal}/>)}
            </div>

            {/* Blade comparison */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12,marginBottom:14}}>
              {[
                { blade:"C-MAC MAC 3/4", type:"Standard VL", color:T.teal,
                  desc:"Video-enhanced Macintosh. Best for transitioning from DL — familiar blade geometry. Can be used as DL if screen fails. Best all-around EM VL blade.",
                  use:"Most EM intubations. Preferred for training.", tip:"Tube delivery same as DL — no special stylet required"},
                { blade:"GlideScope / D-Blade", type:"Hyperangulated VL", color:T.blue,
                  desc:"Steep 60° blade angle. Excellent view even in anterior airways. Requires pre-bent J-shaped stylet matching blade curvature.",
                  use:"Predicted grade 3–4. Failed standard VL.", tip:"Must use GlideRite rigid stylet or pre-shape tube to 90° hockey stick. Cannot remove bougie through blade geometry"},
                { blade:"McGrath MAC", type:"Portable VL", color:T.purple,
                  desc:"Compact, battery-powered, portable. Excellent for prehospital, transport intubations, and small facilities. Macintosh-style blade.",
                  use:"Transport/prehospital, limited-resource settings", tip:"Standard tube delivery technique. Screen attaches directly to blade"},
                { blade:"C-MAC Pocket Monitor", type:"Portable Standard VL", color:T.orange,
                  desc:"Compact display with standard C-MAC blades. Allows coaching and team visualization. Waterproof.",
                  use:"Resus bay with team teaching, or portable", tip:"Same blade geometry as full C-MAC station"},
              ].map((b,i) => (
                <div key={i} style={{...glass,padding:"14px 16px",borderLeft:`3px solid ${b.color}`}}>
                  <div style={{fontFamily:"DM Sans",fontWeight:700,fontSize:14,color:b.color,marginBottom:2}}>{b.blade}</div>
                  <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.txt4,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>{b.type}</div>
                  <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.6,marginBottom:8}}>{b.desc}</div>
                  <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt3,marginBottom:5}}><strong style={{color:T.txt}}>Use for:</strong> {b.use}</div>
                  <div style={{padding:"6px 9px",background:`${b.color}0a`,border:`1px solid ${b.color}22`,borderRadius:6,fontFamily:"DM Sans",fontSize:11,color:b.color}}>💎 {b.tip}</div>
                </div>
              ))}
            </div>

            {/* SALAD technique */}
            <div style={{...glass,padding:"16px 20px",borderLeft:`3px solid ${T.red}`}}>
              <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.red,textTransform:"uppercase",letterSpacing:2,marginBottom:10}}>🩸 SALAD Technique — Contaminated Airway (Blood / Vomit)</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                {[
                  {head:"Setup", items:["Large-bore suction (Yankauer or DuCanto catheter) in LEFT oropharynx","Suction running continuously throughout laryngoscopy","Freeing the RIGHT side for blade insertion","Head of bed elevated 20–30° if not contraindicated","Two suction devices preferred: one fixed left, one mobile"]},
                  {head:"Technique", items:["Insert blade right side, displace tongue left — as normal DL/VL","Yankauer stays left and superior — constant active suction","ETT passes right side, below the suction catheter","Do NOT stop suction to intubate — intubate through the suction","Inflate cuff immediately after tube passes cords","Confirm EtCO₂ before removing suction catheter"]},
                ].map((s,i) => (
                  <div key={i} style={{padding:"10px 12px",background:"rgba(255,68,68,0.06)",border:"1px solid rgba(255,68,68,0.2)",borderRadius:9}}>
                    <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.red,textTransform:"uppercase",letterSpacing:1.5,marginBottom:8}}>{s.head}</div>
                    {s.items.map((item,j) => <BulletRow key={j} text={item} color={T.red}/>)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════ */}
        {/* POST-INTUBATION VENT SETTINGS                       */}
        {/* ════════════════════════════════════════════════════ */}
        {tab === "vent" && (
          <div className="fade-in">
            <div style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.teal,textTransform:"uppercase",letterSpacing:2,marginBottom:6}}>
              Post-Intubation Ventilator Settings — Select Clinical Scenario
            </div>

            {/* IBW Calculator */}
            <div style={{...glass,padding:"14px 18px",marginBottom:14,borderLeft:`3px solid ${T.blue}`}}>
              <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.blue,textTransform:"uppercase",letterSpacing:1.5,marginBottom:10}}>IBW Calculator — Tidal Volume Basis</div>
              <div style={{display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
                <div style={{display:"flex",gap:6,alignItems:"center"}}>
                  <span style={{fontFamily:"DM Sans",fontSize:12,color:T.txt3}}>Sex:</span>
                  {["M","F"].map(s => (
                    <button key={s} onClick={()=>setSex(s)} style={{padding:"5px 14px",borderRadius:7,background:sex===s?`${T.blue}22`:"transparent",border:`1px solid ${sex===s?T.blue:"rgba(42,79,122,0.3)"}`,color:sex===s?T.blue:T.txt3,fontFamily:"DM Sans",fontWeight:600,fontSize:12,cursor:"pointer"}}>
                      {s==="M"?"Male":"Female"}
                    </button>
                  ))}
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8,background:"rgba(14,37,68,0.8)",border:`1.5px solid ${height?"rgba(59,158,255,0.5)":"rgba(42,79,122,0.4)"}`,borderRadius:9,padding:"6px 12px"}}>
                  <input type="number" min="48" max="84" value={height} onChange={e=>setHeight(e.target.value)} placeholder="e.g. 68"
                    style={{background:"transparent",border:"none",outline:"none",color:T.txt,fontFamily:"JetBrains Mono",fontSize:18,fontWeight:700,width:52}}/>
                  <span style={{fontFamily:"JetBrains Mono",fontSize:11,color:T.txt4}}>inches</span>
                </div>
                {ibw && (
                  <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                    <div style={{padding:"6px 14px",background:"rgba(59,158,255,0.12)",border:"1px solid rgba(59,158,255,0.3)",borderRadius:8}}>
                      <span style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.txt4}}>IBW: </span>
                      <span style={{fontFamily:"JetBrains Mono",fontSize:14,fontWeight:700,color:T.blue}}>{ibw} kg</span>
                    </div>
                    <div style={{padding:"6px 14px",background:"rgba(0,229,192,0.12)",border:"1px solid rgba(0,229,192,0.3)",borderRadius:8}}>
                      <span style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.txt4}}>TV 6 mL/kg: </span>
                      <span style={{fontFamily:"JetBrains Mono",fontSize:14,fontWeight:700,color:T.teal}}>{Math.round(ibw*6)} mL</span>
                    </div>
                    <div style={{padding:"6px 14px",background:"rgba(0,229,192,0.07)",border:"1px solid rgba(0,229,192,0.2)",borderRadius:8}}>
                      <span style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.txt4}}>TV 8 mL/kg: </span>
                      <span style={{fontFamily:"JetBrains Mono",fontSize:14,fontWeight:700,color:T.teal}}>{Math.round(ibw*8)} mL</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Preset selector */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:8,marginBottom:14}}>
              {VENT_PRESETS.map(p => <VentCard key={p.id} preset={p} active={ventPreset===p.id} onSelect={()=>setVentPreset(p.id)}/>)}
            </div>

            {/* Active preset detail */}
            {activeVent && (
              <div className="fade-in" key={ventPreset}>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10,marginBottom:14}}>
                  {[
                    {label:"Tidal Volume",    val:tvRange !== "6–8 mL/kg IBW" && activeVent.id==="ards" ? `${ibw ? Math.round(ibw*6)+"mL" : "6"} mL/kg IBW` : tvRange, raw:activeVent.tv, color:activeVent.color},
                    {label:"Resp Rate",       val:activeVent.rr,   color:activeVent.color},
                    {label:"FiO₂",           val:activeVent.fio2, color:activeVent.color},
                    {label:"PEEP",           val:activeVent.peep, color:activeVent.color},
                    {label:"I:E Ratio",      val:activeVent.ie,   color:activeVent.color},
                    {label:"Peak / Plateau", val:activeVent.pip,  color:activeVent.color},
                  ].map((param,i) => (
                    <div key={i} style={{...glass,padding:"12px 14px",borderLeft:`3px solid ${param.color}`,background:`linear-gradient(135deg,${param.color}10,rgba(8,22,40,0.8))`}}>
                      <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.txt4,textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>{param.label}</div>
                      <div style={{fontFamily:"JetBrains Mono",fontSize:ibw&&i===0?18:13,fontWeight:700,color:param.color,lineHeight:1.2}}>
                        {ibw && i===0 ? (activeVent.id==="ards"?`${Math.round(ibw*6)} mL`:`${Math.round(ibw*6)}–${Math.round(ibw*8)} mL`) : param.val}
                      </div>
                      {i===0 && <div style={{fontFamily:"DM Sans",fontSize:9,color:T.txt4,marginTop:3}}>{activeVent.tv}</div>}
                    </div>
                  ))}
                </div>
                <div style={{...glass,padding:"14px 18px",marginBottom:14,background:`${activeVent.color}06`,border:`1px solid ${activeVent.color}25`}}>
                  <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:activeVent.color,textTransform:"uppercase",letterSpacing:1.5,marginBottom:4}}>Goal</div>
                  <div style={{fontFamily:"DM Sans",fontSize:13,color:T.txt,lineHeight:1.6,marginBottom:10}}>{activeVent.goal}</div>
                  <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:1.5,marginBottom:8}}>Management Notes</div>
                  {activeVent.notes.map((note,i) => <BulletRow key={i} text={note} color={activeVent.color}/>)}
                </div>
              </div>
            )}

            {/* Post-intubation sedation */}
            <div style={{...glass,padding:"16px 20px",borderLeft:`3px solid ${T.purple}`}}>
              <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.purple,textTransform:"uppercase",letterSpacing:2,marginBottom:12}}>Post-Intubation Sedation & Analgesia</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:10}}>
                {[
                  {drug:"Propofol",      dose:"5–50 mcg/kg/min IV infusion",     ind:"Standard sedation, elevated ICP (reduces CMRO₂)",    warn:"Propofol infusion syndrome if > 48h at high doses; significant hypotension",         color:T.purple},
                  {drug:"Ketamine",      dose:"0.1–0.5 mg/kg/hr IV infusion",    ind:"Hemodynamic instability, bronchospasm, burn patients", warn:"Increases secretions; tachycardia/HTN — favorable in shock",                        color:T.teal  },
                  {drug:"Midazolam",     dose:"0.02–0.1 mg/kg/hr IV infusion",   ind:"Seizure, alcohol withdrawal, propofol adjunct",       warn:"Accumulation with prolonged use; active metabolites in renal failure; paradoxical agitation",color:T.blue  },
                  {drug:"Fentanyl",      dose:"25–100 mcg/hr IV infusion",       ind:"Analgesia-first sedation — all intubated patients",   warn:"Chest wall rigidity at high bolus doses; opioid tolerance with prolonged use",       color:T.orange},
                  {drug:"Dexmedetomidine",dose:"0.2–1.5 mcg/kg/hr IV infusion", ind:"Cooperative sedation, extubation planning, alcohol withdrawal",warn:"Bradycardia + hypotension; load 1 mcg/kg × 10 min; minimal respiratory depression",color:T.teal  },
                  {drug:"Cisatracurium", dose:"0.1–0.2 mg/kg/hr IV (NMBA)",     ind:"Severe ARDS (P/F < 150), severe dysynchrony",         warn:"Requires adequate sedation; ICU-acquired weakness; train-of-four monitoring required",  color:T.red   },
                ].map((agent,i) => (
                  <div key={i} style={{padding:"12px 14px",background:`${agent.color}08`,border:`1px solid ${agent.color}22`,borderRadius:10}}>
                    <div style={{fontFamily:"DM Sans",fontWeight:700,fontSize:13,color:agent.color,marginBottom:3}}>{agent.drug}</div>
                    <div style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.txt2,marginBottom:5}}>{agent.dose}</div>
                    <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt3,marginBottom:5,lineHeight:1.5}}>{agent.ind}</div>
                    <div style={{fontFamily:"DM Sans",fontSize:11,color:T.orange,lineHeight:1.4,fontStyle:"italic"}}>⚠ {agent.warn}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════ */}
        {/* SURGICAL AIRWAY CHECKLIST                           */}
        {/* ════════════════════════════════════════════════════ */}
        {tab === "surgical" && (
          <div className="fade-in">
            <div style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.red,textTransform:"uppercase",letterSpacing:2,marginBottom:6}}>
              Surgical Airway — Scalpel-Finger-Bougie Cricothyrotomy
            </div>
            <div style={{padding:"10px 14px",background:"rgba(255,68,68,0.1)",border:"2px solid rgba(255,68,68,0.4)",borderRadius:10,marginBottom:14,fontFamily:"DM Sans",fontSize:13,color:T.red,lineHeight:1.7,fontWeight:700}}>
              🚨 DO NOT DELAY. The scalpel-finger-bougie technique is the fastest, most reliable surgical airway method in CICO. Practice this mentally before every resuscitation shift. Hesitation kills.
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              {/* Checklist */}
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                {SURGICAL_STEPS.map((phase,pi) => (
                  <div key={pi} style={{...glass,padding:"14px 16px",borderLeft:`4px solid ${phase.color}`}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                      <span style={{fontSize:20}}>{phase.icon}</span>
                      <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:phase.color,textTransform:"uppercase",letterSpacing:1.5}}>{phase.phase}</div>
                      <span style={{marginLeft:"auto",fontFamily:"JetBrains Mono",fontSize:8,color:T.txt4}}>
                        {phase.items.filter((_,j)=>checked.has(`${pi}-${j}`)).length}/{phase.items.length}
                      </span>
                    </div>
                    {phase.items.map((item,j) => (
                      <CheckItem key={j} text={item} checked={checked.has(`${pi}-${j}`)} onToggle={()=>toggleCheck(`${pi}-${j}`)} color={phase.color}/>
                    ))}
                  </div>
                ))}
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>setChecked(new Set())}
                    style={{flex:1,fontFamily:"DM Sans",fontWeight:600,fontSize:11,color:T.txt4,background:"rgba(42,79,122,0.15)",border:"1px solid rgba(42,79,122,0.3)",borderRadius:8,padding:"8px",cursor:"pointer"}}>
                    Reset Checklist
                  </button>
                  <button onClick={()=>setChecked(new Set(SURGICAL_STEPS.flatMap((p,pi)=>p.items.map((_,j)=>`${pi}-${j}`))))}
                    style={{flex:1,fontFamily:"DM Sans",fontWeight:600,fontSize:11,color:T.green,background:"rgba(61,255,160,0.1)",border:"1px solid rgba(61,255,160,0.25)",borderRadius:8,padding:"8px",cursor:"pointer"}}>
                    Mark All Complete
                  </button>
                </div>
              </div>

              {/* Anatomy + Alternatives */}
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                {/* Anatomy reference */}
                <div style={{...glass,padding:"16px 18px",borderLeft:`3px solid ${T.yellow}`}}>
                  <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.yellow,textTransform:"uppercase",letterSpacing:1.5,marginBottom:10}}>Anatomic Landmarks — Cricothyroid Membrane (CTM)</div>
                  {[
                    "The CTM is the soft triangular membrane between the thyroid cartilage (above) and the cricoid cartilage (below)",
                    "Midline landmark: run finger from thyroid notch inferiorly — first soft tissue depression is the CTM",
                    "Average CTM dimensions: 9 mm tall × 30 mm wide — the inferior 1/3 is the target (avoids superior cricothyroid arteries)",
                    "Cricothyroid arteries run along the SUPERIOR margin of the CTM — make incision in the INFERIOR half",
                    "CTM becomes difficult to palpate in obesity, neck hematoma, or prior neck surgery — ultrasound identification is recommended",
                    "Ultrasound CTM identification: probe transverse on midline, identify thyroid → slide caudally to CTM (hyperechoic flash artifact)",
                  ].map((item,i) => <BulletRow key={i} text={item} color={T.yellow}/>)}
                </div>

                {/* Needle cricothyrotomy note */}
                <div style={{...glass,padding:"14px 16px",borderLeft:`3px solid ${T.orange}`}}>
                  <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.orange,textTransform:"uppercase",letterSpacing:1.5,marginBottom:8}}>Needle Cricothyrotomy — Limitations</div>
                  {[
                    "14g angiocath through CTM provides INADEQUATE ventilation for adults — CO₂ accumulates rapidly",
                    "Jet ventilation (50 psi oxygen via high-pressure tubing) required — not BVM ventilation",
                    "Maximum safe duration: 30–45 minutes before hypercarbia becomes critical",
                    "Requires PATENT UPPER AIRWAY for expiration — barotrauma without outlet is fatal",
                    "Use only as a bridge to definitive surgical airway — not as definitive management",
                    "In children < 8 years: needle cricothyrotomy + jet ventilation IS the preferred technique (CTM too small for tube)",
                  ].map((item,i) => <BulletRow key={i} text={item} color={T.orange}/>)}
                </div>

                {/* Emergency tracheotomy vs cricothyrotomy */}
                <div style={{...glass,padding:"14px 16px",borderLeft:`3px solid ${T.blue}`}}>
                  <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.blue,textTransform:"uppercase",letterSpacing:1.5,marginBottom:8}}>Cricothyrotomy vs Emergency Tracheotomy</div>
                  {[
                    "Cricothyrotomy is FASTER and SAFER than emergency tracheotomy in CICO",
                    "Emergency tracheotomy requires more anatomic dissection — significantly more blood loss risk",
                    "Tracheotomy preferred for: infants (< 2 yr), subglottic pathology, known CTM obstruction",
                    "After CICO stabilization: formal tracheotomy by ENT/surgery within 24–72 hours (cricothyrotomy to tracheotomy conversion)",
                    "Prolonged cricothyrotomy (> 72 hours) associated with subglottic stenosis — timely conversion is mandatory",
                  ].map((item,i) => <BulletRow key={i} text={item} color={T.blue}/>)}
                </div>

                {/* Post-surgical airway management */}
                <div style={{...glass,padding:"14px 16px",borderLeft:`3px solid ${T.green}`}}>
                  <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.green,textTransform:"uppercase",letterSpacing:1.5,marginBottom:8}}>Post-Surgical Airway — Immediate Orders</div>
                  {[
                    "Confirm EtCO₂ waveform — non-negotiable",
                    "CXR: confirm ETT tip position, rule out pneumothorax",
                    "Right mainstem intubation is a common complication — advance ETT only 3–4 cm past CTM",
                    "Secure tube: commercial tube holder + suture through skin flange if available",
                    "ENT/surgery consult for planned tracheotomy conversion",
                    "Document: indication for CICO, technique used, attempts, time from decision to definitive airway",
                    "Consider ethics/family discussion if prolonged critical illness anticipated",
                  ].map((item,i) => <BulletRow key={i} text={item} color={T.green}/>)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{textAlign:"center",paddingBottom:24,paddingTop:14}}>
          <span style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,letterSpacing:1.5}}>
            NOTRYA AIRWAY HUB · VERIFY ALL DOSES WITH CURRENT CLINICAL GUIDELINES · RSI IS A HIGH-STAKES PROCEDURE — BACKUP PLAN BEFORE EVERY INDUCTION
          </span>
        </div>
      </div>
    </div>
  );
}