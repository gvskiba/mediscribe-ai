// WeightDoseHub.jsx
// Weight-based drug dosing calculator for critical ED medications.
// Auto-populates weight from encounter data. Includes infusion rate calculator.

import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";

(() => {
  if (document.getElementById("dose-fonts")) return;
  const l = document.createElement("link");
  l.id = "dose-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "dose-css";
  s.textContent = `
    @keyframes dose-fade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
    .dose-fade{animation:dose-fade .18s ease forwards;}
    @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
    .shimmer-text{
      background:linear-gradient(90deg,#e8f0fe 0%,#fff 30%,#9b6dff 52%,#00e5c0 72%,#e8f0fe 100%);
      background-size:250% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;
      background-clip:text;animation:shimmer 5s linear infinite;}
  `;
  document.head.appendChild(s);
})();

const T = {
  bg:"#050f1e", panel:"#081628", card:"#0b1e36",
  txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", blue:"#3b9eff",
  orange:"#ff9f43", purple:"#9b6dff", green:"#3dffa0", cyan:"#00d4ff", red:"#ff4444",
};

const DRUGS = [
  // RSI / AIRWAY
  {
    id:"etomidate", name:"Etomidate", cat:"rsi", color:T.teal, weightBasis:"AW",
    indication:"RSI induction (hemodynamically unstable)",
    bolus:{ dose:0.3, unit:"mg/kg", max:30, conc:"2 mg/mL (10mL vial = 20mg)",
      notes:"Single dose. Adrenal suppression concern with repeated use or sepsis." },
  },
  {
    id:"ketamine_rsi", name:"Ketamine (RSI)", cat:"rsi", color:T.orange, weightBasis:"AW",
    indication:"RSI induction — preferred in hypotension, bronchospasm, head trauma",
    bolus:{ dose:1.5, unit:"mg/kg", max:200, conc:"10 mg/mL or 50 mg/mL",
      notes:"Maintains hemodynamics. Raises ICP minimally at standard doses — no longer contraindicated in TBI." },
  },
  {
    id:"propofol_rsi", name:"Propofol (RSI)", cat:"rsi", color:T.blue, weightBasis:"AW",
    indication:"RSI induction — hemodynamically stable patients",
    bolus:{ dose:1.5, unit:"mg/kg", max:200, conc:"10 mg/mL (200mg/20mL vial)",
      notes:"Reduce to 1.0 mg/kg in elderly or ASA III-IV. Significant hypotension risk." },
  },
  {
    id:"succinylcholine", name:"Succinylcholine", cat:"rsi", color:T.coral, weightBasis:"AW",
    indication:"RSI depolarizing paralytic",
    bolus:{ dose:1.5, unit:"mg/kg", max:200, conc:"20 mg/mL",
      notes:"Avoid >72h post-burn, crush, or denervation injury — fatal hyperkalemia risk. Check K+ in CKD." },
  },
  {
    id:"rocuronium", name:"Rocuronium", cat:"rsi", color:T.purple, weightBasis:"AW",
    indication:"RSI non-depolarizing paralytic (succinylcholine contraindication)",
    bolus:{ dose:1.2, unit:"mg/kg", max:200, conc:"10 mg/mL",
      notes:"1.2 mg/kg for RSI (provides ~60min paralysis). 0.6 mg/kg for standard intubation. Reversed by sugammadex 16 mg/kg." },
  },
  {
    id:"midazolam_pre", name:"Midazolam (pre-RSI)", cat:"rsi", color:T.purple, weightBasis:"AW",
    indication:"Pre-RSI sedation / anxiolysis",
    bolus:{ dose:0.05, unit:"mg/kg", max:5, conc:"1 mg/mL or 5 mg/mL",
      notes:"0.05-0.1 mg/kg. Use lower end in elderly or hemodynamically compromised." },
  },
  {
    id:"fentanyl_rsi", name:"Fentanyl (pre-RSI)", cat:"rsi", color:T.blue, weightBasis:"AW",
    indication:"Pre-RSI blunting of sympathetic response",
    bolus:{ dose:3, unit:"mcg/kg", max:200, conc:"50 mcg/mL",
      notes:"3 mcg/kg IV push 3 minutes before laryngoscopy. Blunts hypertensive/tachycardic response." },
  },

  // VASOPRESSORS
  {
    id:"norepi", name:"Norepinephrine", cat:"vasopress", color:T.red, weightBasis:"AW",
    indication:"Septic shock — first-line vasopressor",
    infusion:{ low:0.01, high:3.0, unit:"mcg/kg/min", start:0.1,
      concentrations:[
        { label:"4 mg in 250 mL (16 mcg/mL)", mcgPerMl:16 },
        { label:"8 mg in 250 mL (32 mcg/mL)", mcgPerMl:32 },
        { label:"4 mg in 500 mL (8 mcg/mL)",  mcgPerMl:8  },
      ],
      notes:"Titrate to MAP >=65. Central line preferred. Can run peripherally short-term in extremis." },
  },
  {
    id:"epi_drip", name:"Epinephrine (drip)", cat:"vasopress", color:T.coral, weightBasis:"AW",
    indication:"Anaphylaxis / refractory shock / bradycardia",
    bolus:{ dose:0.01, unit:"mg/kg", max:0.5, conc:"1:1000 (1mg/mL) or 1:10000 (0.1mg/mL)",
      notes:"0.01 mg/kg IM (thigh) for anaphylaxis — max 0.5mg. Repeat q5-15min." },
    infusion:{ low:0.01, high:1.0, unit:"mcg/kg/min", start:0.1,
      concentrations:[
        { label:"2 mg in 250 mL (8 mcg/mL)",  mcgPerMl:8  },
        { label:"4 mg in 250 mL (16 mcg/mL)", mcgPerMl:16 },
      ],
      notes:"Titrate in 0.05-0.1 mcg/kg/min increments. Cardiogenic and distributive shock." },
  },
  {
    id:"dopamine", name:"Dopamine", cat:"vasopress", color:T.orange, weightBasis:"AW",
    indication:"Bradycardia unresponsive to atropine / cardiogenic shock",
    infusion:{ low:2, high:20, unit:"mcg/kg/min", start:5,
      concentrations:[
        { label:"400 mg in 250 mL (1600 mcg/mL)", mcgPerMl:1600 },
        { label:"200 mg in 250 mL (800 mcg/mL)",  mcgPerMl:800  },
      ],
      notes:"2-5: renal/mesenteric. 5-10: inotrope. 10-20: vasopressor. Arrhythmogenic at high doses." },
  },
  {
    id:"phenylephrine", name:"Phenylephrine", cat:"vasopress", color:T.gold, weightBasis:"AW",
    indication:"Vasodilatory hypotension — no tachycardia desired",
    infusion:{ low:0.5, high:6, unit:"mcg/kg/min", start:1,
      concentrations:[
        { label:"100 mg in 250 mL (400 mcg/mL)", mcgPerMl:400 },
      ],
      notes:"Pure alpha-1 agonist — no inotropy. Useful when tachycardia is harmful (HOCM, critical AS)." },
  },

  // REVERSAL AGENTS
  {
    id:"naloxone", name:"Naloxone", cat:"reversal", color:T.green, weightBasis:"AW",
    indication:"Opioid reversal",
    bolus:{ dose:0.4, unit:"mg", max:2, conc:"0.4 mg/mL or 1 mg/mL",
      notes:"0.4-2mg IV/IM/IN. Titrate to respirations — avoid precipitating withdrawal. Half-life 60-90 min; repeat dosing likely. IN: 2mg per nostril (Narcan 4mg/0.1mL)." },
  },
  {
    id:"sugammadex", name:"Sugammadex", cat:"reversal", color:T.purple, weightBasis:"AW",
    indication:"Rocuronium / vecuronium reversal",
    bolus:{ dose:16, unit:"mg/kg", max:999, conc:"200 mg/2mL vial",
      notes:"16 mg/kg for immediate reversal of RSI-dose rocuronium (cannot intubate/cannot oxygenate). 4 mg/kg for deep block reversal. 2 mg/kg for moderate block." },
  },
  {
    id:"flumazenil", name:"Flumazenil", cat:"reversal", color:T.cyan, weightBasis:"fixed",
    indication:"Benzodiazepine reversal",
    bolus:{ dose:0.2, unit:"mg", max:1, conc:"0.1 mg/mL",
      notes:"0.2mg IV over 30 sec, repeat 0.2mg q1min to max 1mg. Short half-life — re-sedation likely. Contraindicated if seizure controlled by BZD; may precipitate status." },
  },
  {
    id:"tranexamic", name:"Tranexamic Acid (TXA)", cat:"reversal", color:T.coral, weightBasis:"fixed",
    indication:"Major hemorrhage — within 3 hours of injury",
    bolus:{ dose:1000, unit:"mg", max:1000, conc:"100 mg/mL (10mL = 1g)",
      notes:"1g IV over 10 min THEN 1g IV over 8 hours. >3h from injury: no mortality benefit. Do not use in isolated TBI without systemic hemorrhage." },
  },
  {
    id:"vitk", name:"Vitamin K (IV)", cat:"reversal", color:T.gold, weightBasis:"fixed",
    indication:"Warfarin reversal — non-emergent",
    bolus:{ dose:10, unit:"mg", max:10, conc:"10 mg/mL",
      notes:"10mg IV over 20-60 min (anaphylaxis risk with rapid infusion). Effect onset 6-12h; full effect 24h. Use 4F-PCC for emergent reversal." },
  },
  {
    id:"pcc4f", name:"4F-PCC (Kcentra)", cat:"reversal", color:T.orange, weightBasis:"AW",
    indication:"Emergent warfarin reversal",
    bolus:{ dose:25, unit:"units/kg", max:2500, conc:"Per vial — reconstitute",
      notes:"INR 2-3.9: 25 units/kg (max 2500). INR 4-6: 35 units/kg (max 3500). INR >6: 50 units/kg (max 5000). Always give Vitamin K concurrently." },
  },

  // SEDATION / ANALGESIA
  {
    id:"fentanyl", name:"Fentanyl", cat:"sedation", color:T.blue, weightBasis:"AW",
    indication:"IV analgesia",
    bolus:{ dose:1, unit:"mcg/kg", max:150, conc:"50 mcg/mL",
      notes:"1-2 mcg/kg IV. Titrate 25 mcg q5min to effect. Onset 2-3 min, duration 30-60 min. IN: 1.5 mcg/kg (max 4mcg/kg) via MAD." },
  },
  {
    id:"ketamine_analg", name:"Ketamine (sub-dissociative)", cat:"sedation", color:T.orange, weightBasis:"AW",
    indication:"Sub-dissociative analgesia / procedural adjunct",
    bolus:{ dose:0.3, unit:"mg/kg", max:35, conc:"10 mg/mL or 50 mg/mL",
      notes:"0.3 mg/kg IV over 10-15 min (push too fast = emergence). Excellent for procedural pain and opioid-sparing. IN: 0.5-1 mg/kg." },
  },
  {
    id:"ketamine_psa", name:"Ketamine (dissociative PSA)", cat:"sedation", color:T.gold, weightBasis:"AW",
    indication:"Procedural sedation and analgesia",
    bolus:{ dose:1.5, unit:"mg/kg", max:200, conc:"10 mg/mL or 50 mg/mL",
      notes:"1-2 mg/kg IV (onset 1 min) or 4-5 mg/kg IM (onset 3-5 min). Maintain airway. Consider midazolam 0.05 mg/kg for emergence phenomena in adults." },
  },
  {
    id:"propofol_psa", name:"Propofol (PSA)", cat:"sedation", color:T.teal, weightBasis:"AW",
    indication:"Procedural sedation — brief, deep",
    bolus:{ dose:1.0, unit:"mg/kg", max:200, conc:"10 mg/mL",
      notes:"1-1.5 mg/kg IV over 60 sec. Titrate 0.5 mg/kg q3min. Apnea risk — BVM at bedside. Hypotension common." },
  },
  {
    id:"midazolam", name:"Midazolam", cat:"sedation", color:T.purple, weightBasis:"AW",
    indication:"Procedural anxiolysis / seizure (adjunct to BZD)",
    bolus:{ dose:0.05, unit:"mg/kg", max:5, conc:"1 mg/mL or 5 mg/mL",
      notes:"0.05-0.1 mg/kg IV. IM: 0.2 mg/kg (max 10mg) for agitation. IN: 0.2 mg/kg (max 10mg) for seizure." },
  },
  {
    id:"lorazepam", name:"Lorazepam", cat:"sedation", color:T.purple, weightBasis:"AW",
    indication:"Seizure / anxiolysis / alcohol withdrawal",
    bolus:{ dose:0.05, unit:"mg/kg", max:4, conc:"2 mg/mL or 4 mg/mL",
      notes:"0.05-0.1 mg/kg IV (max 4mg/dose). Status epilepticus: 4mg IV (adult). May repeat x1 in 5-10 min. Respiratory depression risk." },
  },
  {
    id:"morphine", name:"Morphine", cat:"sedation", color:T.blue, weightBasis:"AW",
    indication:"Moderate-severe pain (opioid naive)",
    bolus:{ dose:0.05, unit:"mg/kg", max:4, conc:"2 mg/mL or 10 mg/mL",
      notes:"0.05-0.1 mg/kg IV q3-4h. Start low in elderly. Histamine release; avoid in true morphine allergy — use fentanyl." },
  },

  // RESUSCITATION
  {
    id:"epi_arrest", name:"Epinephrine (cardiac arrest)", cat:"resus", color:T.red, weightBasis:"AW",
    indication:"Cardiac arrest (all rhythms)",
    bolus:{ dose:0.01, unit:"mg/kg", max:1, conc:"0.1 mg/mL (1:10,000)",
      notes:"1mg IV/IO q3-5min (adult). Pediatric: 0.01 mg/kg (0.1 mL/kg of 1:10,000). IO if no IV access." },
  },
  {
    id:"amiodarone_arrest", name:"Amiodarone (arrest)", cat:"resus", color:T.orange, weightBasis:"AW",
    indication:"VF / pulseless VT refractory to defibrillation",
    bolus:{ dose:5, unit:"mg/kg", max:300, conc:"50 mg/mL",
      notes:"300mg IV/IO rapid push (adult, 1st dose) after 3rd shock. Pediatric: 5 mg/kg. 2nd dose: 150mg (adult)." },
  },
  {
    id:"lidocaine_arrest", name:"Lidocaine (arrest)", cat:"resus", color:T.gold, weightBasis:"AW",
    indication:"VF / pVT — amiodarone alternative",
    bolus:{ dose:1.5, unit:"mg/kg", max:150, conc:"20 mg/mL",
      notes:"1-1.5 mg/kg IV push. Can repeat 0.5-0.75 mg/kg q5min, max 3 mg/kg total. Maintenance: 1-4 mg/min infusion." },
  },
  {
    id:"bicarb", name:"Sodium Bicarbonate", cat:"resus", color:T.teal, weightBasis:"AW",
    indication:"Hyperkalemic arrest / TCA overdose / severe acidosis",
    bolus:{ dose:1, unit:"mEq/kg", max:100, conc:"1 mEq/mL (8.4%)",
      notes:"1 mEq/kg IV push for cardiac arrest with hyperkalemia or TCA. TCA: 1-2 mEq/kg IV until QRS narrows or pH 7.45-7.55." },
  },
  {
    id:"magnesium", name:"Magnesium Sulfate", cat:"resus", color:T.purple, weightBasis:"fixed",
    indication:"Torsades de pointes / severe asthma / eclampsia",
    bolus:{ dose:2000, unit:"mg", max:4000, conc:"500 mg/mL (50%) or 100 mg/mL (10%)",
      notes:"Torsades: 2g IV push. Asthma: 2g IV over 20 min. Eclampsia: 4-6g IV load over 15-20 min. Pediatric: 25-50 mg/kg (max 2g)." },
  },
  {
    id:"calcium", name:"Calcium Gluconate", cat:"resus", color:T.green, weightBasis:"AW",
    indication:"Hyperkalemia / calcium channel blocker OD / hypocalcemia",
    bolus:{ dose:30, unit:"mg/kg", max:3000, conc:"100 mg/mL (10%)",
      notes:"Hyperkalemia: 1-3g IV. CCB OD: 3g IV, may repeat. Pediatric: 60 mg/kg (max 3g). Calcium chloride (3x elemental Ca) preferred in arrest." },
  },

  // WEIGHT-BASED ANTIBIOTICS
  {
    id:"vancomycin", name:"Vancomycin", cat:"abx", color:T.coral, weightBasis:"AW",
    indication:"MRSA / gram-positive coverage",
    bolus:{ dose:25, unit:"mg/kg", max:3000, conc:"5 mg/mL (infuse over 60-90 min)",
      notes:"Loading dose 25 mg/kg (AUC-guided dosing preferred). Infuse over 60-90 min. Max infusion rate 10 mg/min (Red Man Syndrome risk). Adjust for renal function." },
  },
  {
    id:"gentamicin", name:"Gentamicin (once-daily)", cat:"abx", color:T.blue, weightBasis:"IBW",
    indication:"Gram-negative / synergy / pyelonephritis",
    bolus:{ dose:5, unit:"mg/kg", max:500, conc:"10 mg/mL",
      notes:"5 mg/kg IBW q24h. Use IBW (or adjusted BW if obese). Monitor trough <1 mcg/mL. Nephrotoxic — check creatinine daily." },
  },
];

const CATS = [
  { id:"all",       label:"All",           color:T.teal   },
  { id:"rsi",       label:"RSI / Airway",  color:T.orange },
  { id:"vasopress", label:"Vasopressors",  color:T.red    },
  { id:"reversal",  label:"Reversal",      color:T.green  },
  { id:"sedation",  label:"Sedation",      color:T.purple },
  { id:"resus",     label:"Resuscitation", color:T.coral  },
  { id:"abx",       label:"Antibiotics",   color:T.blue   },
];

function calcBolus(drug, weightKg) {
  const b = drug.bolus;
  if (!b) return null;
  const wt = parseFloat(weightKg) || 0;
  if (!wt) return null;

  let doseAmt, doseLabel, excessMax, doseUnit = "mg";

  if (b.unit === "mg/kg") {
    doseAmt = b.dose * wt;
    doseLabel = `${b.dose} mg/kg x ${wt} kg`;
    excessMax = b.max && doseAmt > b.max;
    if (excessMax) doseAmt = b.max;
  } else if (b.unit === "mcg/kg") {
    doseAmt = b.dose * wt;
    doseLabel = `${b.dose} mcg/kg x ${wt} kg`;
    excessMax = b.max && doseAmt > b.max;
    if (excessMax) doseAmt = b.max;
    return { doseAmt, doseUnit:"mcg", doseLabel, excessMax, conc:b.conc };
  } else if (b.unit === "units/kg") {
    doseAmt = b.dose * wt;
    doseLabel = `${b.dose} units/kg x ${wt} kg`;
    excessMax = b.max && doseAmt > b.max;
    if (excessMax) doseAmt = b.max;
    return { doseAmt, doseUnit:"units", doseLabel, excessMax, conc:b.conc };
  } else if (b.unit === "mEq/kg") {
    doseAmt = b.dose * wt;
    doseLabel = `${b.dose} mEq/kg x ${wt} kg`;
    excessMax = b.max && doseAmt > b.max;
    if (excessMax) doseAmt = b.max;
    return { doseAmt, doseUnit:"mEq", doseLabel, excessMax, conc:b.conc };
  } else {
    doseAmt = b.dose;
    doseLabel = "Fixed dose";
    excessMax = false;
  }
  return { doseAmt, doseUnit, doseLabel, excessMax, conc:b.conc };
}

function calcInfusionRate(dosePerKgMin, weightKg, mcgPerMl) {
  if (!dosePerKgMin || !weightKg || !mcgPerMl) return 0;
  return (dosePerKgMin * weightKg * 60) / mcgPerMl;
}

function DrugCard({ drug, weightKg, ibwKg }) {
  const wt = drug.weightBasis === "IBW" ? (ibwKg || weightKg) : weightKg;
  const bolusCalc = calcBolus(drug, wt);

  const [infDose,    setInfDose]    = useState(() => drug.infusion?.start || drug.infusion?.low || 0);
  const [infConcIdx, setInfConcIdx] = useState(0);

  const concs   = drug.infusion?.concentrations || [];
  const selConc = concs[infConcIdx];
  const infRate = selConc
    ? calcInfusionRate(infDose, parseFloat(wt)||0, selConc.mcgPerMl)
    : null;

  return (
    <div style={{ padding:"12px 14px", borderRadius:10,
      background:"rgba(8,22,40,0.7)",
      border:`1px solid rgba(26,53,85,0.4)`,
      borderLeft:`3px solid ${drug.color}` }}>

      <div style={{ display:"flex", alignItems:"flex-start",
        justifyContent:"space-between", marginBottom:6, gap:8 }}>
        <div>
          <div style={{ fontFamily:"'Playfair Display',serif",
            fontWeight:700, fontSize:13, color:drug.color }}>
            {drug.name}
          </div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
            color:T.txt4, marginTop:1 }}>{drug.indication}</div>
        </div>
        {drug.weightBasis === "IBW" && (
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.gold, letterSpacing:1, textTransform:"uppercase",
            background:"rgba(245,200,66,0.1)",
            border:"1px solid rgba(245,200,66,0.3)",
            borderRadius:4, padding:"2px 6px", flexShrink:0 }}>IBW</span>
        )}
      </div>

      {bolusCalc && wt > 0 && (
        <div style={{ padding:"8px 10px", borderRadius:8, marginBottom:8,
          background:bolusCalc.excessMax
            ? "rgba(255,107,107,0.1)"
            : `${drug.color}0c`,
          border:`1px solid ${bolusCalc.excessMax ? "rgba(255,107,107,0.4)" : drug.color+"30"}` }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, letterSpacing:1, marginBottom:3 }}>
            {bolusCalc.doseLabel} {bolusCalc.excessMax ? "(MAX DOSE APPLIED)" : ""}
          </div>
          <div style={{ display:"flex", alignItems:"baseline", gap:8 }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace",
              fontSize:22, fontWeight:700,
              color: bolusCalc.excessMax ? T.coral : drug.color,
              lineHeight:1 }}>
              {bolusCalc.doseAmt % 1 === 0
                ? bolusCalc.doseAmt
                : bolusCalc.doseAmt.toFixed(1)}
            </span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace",
              fontSize:12, color:T.txt3 }}>{bolusCalc.doseUnit}</span>
            {bolusCalc.excessMax && (
              <span style={{ fontFamily:"'JetBrains Mono',monospace",
                fontSize:9, color:T.coral, letterSpacing:1 }}>MAX DOSE</span>
            )}
          </div>
          {bolusCalc.conc && (
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
              color:T.txt4, marginTop:3 }}>
              Concentration: {bolusCalc.conc}
            </div>
          )}
        </div>
      )}

      {!wt && bolusCalc !== null && drug.bolus && (
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
          color:T.txt4, fontStyle:"italic", marginBottom:6 }}>
          Enter weight above to calculate dose
        </div>
      )}

      {drug.infusion && wt > 0 && (
        <div style={{ padding:"8px 10px", borderRadius:8,
          background:"rgba(14,37,68,0.5)",
          border:"1px solid rgba(42,79,122,0.3)", marginBottom:8 }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, letterSpacing:1, marginBottom:6 }}>
            INFUSION RATE CALCULATOR
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
            <button onClick={() => setInfDose(p => Math.max(drug.infusion.low||0, parseFloat((p-0.05).toFixed(3))))}
              style={{ width:24, height:24, borderRadius:5, cursor:"pointer",
                border:`1px solid ${drug.color}44`,
                background:`${drug.color}10`, color:drug.color,
                fontWeight:700, fontSize:13, lineHeight:1 }}>-</button>
            <span style={{ fontFamily:"'JetBrains Mono',monospace",
              fontSize:14, fontWeight:700, color:drug.color, minWidth:50,
              textAlign:"center" }}>
              {infDose.toFixed(infDose < 1 ? 3 : 2)}
            </span>
            <button onClick={() => setInfDose(p => Math.min(drug.infusion.high||999, parseFloat((p+0.05).toFixed(3))))}
              style={{ width:24, height:24, borderRadius:5, cursor:"pointer",
                border:`1px solid ${drug.color}44`,
                background:`${drug.color}10`, color:drug.color,
                fontWeight:700, fontSize:13, lineHeight:1 }}>+</button>
            <span style={{ fontFamily:"'JetBrains Mono',monospace",
              fontSize:9, color:T.txt4, letterSpacing:1 }}>
              {drug.infusion.unit}
            </span>
          </div>
          {concs.length > 0 && (
            <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:6 }}>
              {concs.map((c, i) => (
                <button key={i} onClick={() => setInfConcIdx(i)}
                  style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                    padding:"2px 8px", borderRadius:4, cursor:"pointer",
                    letterSpacing:0.5,
                    border:`1px solid ${infConcIdx===i ? drug.color+"66" : "rgba(42,79,122,0.35)"}`,
                    background:infConcIdx===i ? `${drug.color}15` : "transparent",
                    color:infConcIdx===i ? drug.color : T.txt4 }}>
                  {c.label}
                </button>
              ))}
            </div>
          )}
          {infRate !== null && (
            <div style={{ display:"flex", alignItems:"baseline", gap:6 }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace",
                fontSize:18, fontWeight:700, color:drug.color }}>
                {infRate.toFixed(1)}
              </span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace",
                fontSize:11, color:T.txt3 }}>mL/hr</span>
            </div>
          )}
        </div>
      )}

      <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10.5,
        color:T.txt4, lineHeight:1.6 }}>
        {drug.bolus?.notes || drug.infusion?.notes || ""}
      </div>
    </div>
  );
}

function WeightBar({ weightKg, setWeightKg, ibwKg, setIbwKg, source }) {
  const [showIBW, setShowIBW] = useState(false);
  const [heightCm, setHeightCm] = useState("");
  const [sex, setSex] = useState("M");

  const calcIBW = useCallback(() => {
    const h = parseFloat(heightCm);
    if (!h) return;
    const hInches = h / 2.54;
    const ibw = sex === "M"
      ? Math.max(0, 50 + 2.3 * (hInches - 60))
      : Math.max(0, 45.5 + 2.3 * (hInches - 60));
    setIbwKg(ibw.toFixed(1));
  }, [heightCm, sex, setIbwKg]);

  return (
    <div style={{ padding:"11px 14px", borderRadius:10, marginBottom:12,
      background:"rgba(8,22,40,0.75)",
      border:"1px solid rgba(42,79,122,0.45)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
        <div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, letterSpacing:1.3, textTransform:"uppercase", marginBottom:4 }}>
            Actual Weight
            {source && <span style={{ color:T.teal, marginLeft:6 }}>from encounter</span>}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <input type="number" value={weightKg}
              onChange={e => setWeightKg(e.target.value)}
              placeholder="kg"
              style={{ width:72, padding:"6px 10px",
                background:"rgba(14,37,68,0.75)",
                border:`1px solid ${weightKg ? "rgba(0,229,192,0.5)" : "rgba(42,79,122,0.4)"}`,
                borderRadius:7, outline:"none",
                fontFamily:"'JetBrains Mono',monospace", fontSize:16,
                fontWeight:700, color:T.teal }} />
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.txt4 }}>kg</span>
          </div>
        </div>
        <div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, letterSpacing:1.3, textTransform:"uppercase", marginBottom:4 }}>
            IBW (Devine)
            <button onClick={() => setShowIBW(p => !p)}
              style={{ marginLeft:6, fontFamily:"'JetBrains Mono',monospace",
                fontSize:7, color:T.gold, background:"transparent", border:"none",
                cursor:"pointer", letterSpacing:1, textTransform:"uppercase" }}>
              {showIBW ? "hide" : "calculate"}
            </button>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <input type="number" value={ibwKg}
              onChange={e => setIbwKg(e.target.value)}
              placeholder="kg"
              style={{ width:72, padding:"6px 10px",
                background:"rgba(14,37,68,0.75)",
                border:`1px solid ${ibwKg ? "rgba(245,200,66,0.5)" : "rgba(42,79,122,0.4)"}`,
                borderRadius:7, outline:"none",
                fontFamily:"'JetBrains Mono',monospace", fontSize:16,
                fontWeight:700, color:T.gold }} />
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.txt4 }}>kg</span>
          </div>
        </div>
        {parseFloat(weightKg) > 0 && parseFloat(weightKg) < 40 && (
          <div style={{ padding:"6px 12px", borderRadius:8,
            background:"rgba(245,200,66,0.1)",
            border:"1px solid rgba(245,200,66,0.35)" }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
              color:T.gold, letterSpacing:1, textTransform:"uppercase", fontWeight:700 }}>
              Pediatric Weight
            </div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:T.gold }}>
              Verify all doses against pediatric references
            </div>
          </div>
        )}
      </div>
      {showIBW && (
        <div style={{ display:"flex", alignItems:"flex-end", gap:8, marginTop:10, flexWrap:"wrap" }}>
          <div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:T.txt4, letterSpacing:1.2, textTransform:"uppercase", marginBottom:3 }}>Height (cm)</div>
            <input type="number" value={heightCm}
              onChange={e => setHeightCm(e.target.value)}
              placeholder="175"
              style={{ width:80, padding:"5px 8px",
                background:"rgba(14,37,68,0.75)",
                border:"1px solid rgba(42,79,122,0.4)",
                borderRadius:6, outline:"none",
                fontFamily:"'DM Sans',sans-serif", fontSize:13, color:T.txt }} />
          </div>
          <div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:T.txt4, letterSpacing:1.2, textTransform:"uppercase", marginBottom:3 }}>Sex</div>
            <div style={{ display:"flex", gap:4 }}>
              {["M","F"].map(s => (
                <button key={s} onClick={() => setSex(s)}
                  style={{ padding:"5px 10px", borderRadius:6, cursor:"pointer",
                    border:`1px solid ${sex===s ? T.gold+"66" : "rgba(42,79,122,0.35)"}`,
                    background:sex===s ? "rgba(245,200,66,0.12)" : "transparent",
                    color:sex===s ? T.gold : T.txt4,
                    fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:12 }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <button onClick={calcIBW}
            style={{ padding:"6px 14px", borderRadius:7, cursor:"pointer",
              border:"1px solid rgba(245,200,66,0.45)",
              background:"rgba(245,200,66,0.1)", color:T.gold,
              fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:12 }}>
            Calculate IBW
          </button>
        </div>
      )}
      <div style={{ marginTop:8, fontFamily:"'JetBrains Mono',monospace", fontSize:7.5,
        color:"rgba(42,79,122,0.6)", letterSpacing:1 }}>
        VERIFY ALL DOSES INDEPENDENTLY · MAX DOSES AUTOMATICALLY APPLIED · IBW REQUIRED FOR GENTAMICIN · AW FOR RSI PARALYTICS
      </div>
    </div>
  );
}

export default function WeightDoseHub({ embedded = false, demo, vitals }) {
  const navigate = useNavigate();
  const encWeight = vitals?.weight || demo?.weight || "";
  const [weightKg, setWeightKg] = useState(encWeight);
  const [ibwKg,    setIbwKg]    = useState("");
  const [cat,      setCat]      = useState("all");

  const filtered = useMemo(() =>
    DRUGS.filter(d => cat === "all" || d.cat === cat),
    [cat]
  );

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif",
      background: embedded ? "transparent" : T.bg,
      minHeight:  embedded ? "auto" : "100vh",
      color:T.txt }}>
      <div style={{ maxWidth:1200, margin:"0 auto",
        padding: embedded ? "0" : "0 16px" }}>

        {!embedded && (
          <div style={{ padding:"18px 0 14px" }}>
            <button onClick={() => navigate("/hub")}
              style={{ marginBottom:10, display:"inline-flex", alignItems:"center", gap:7,
                fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600,
                background:"rgba(14,37,68,0.7)",
                border:"1px solid rgba(42,79,122,0.5)",
                borderRadius:8, padding:"5px 14px", color:T.txt3, cursor:"pointer" }}>
              Back to Hub
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
                  fontSize:10, color:T.txt3, letterSpacing:2 }}>DOSING</span>
              </div>
              <div style={{ height:1, flex:1,
                background:"linear-gradient(90deg,rgba(0,229,192,0.5),transparent)" }} />
            </div>
            <h1 className="shimmer-text"
              style={{ fontFamily:"'Playfair Display',serif",
                fontSize:"clamp(22px,4vw,38px)", fontWeight:900,
                letterSpacing:-0.5, lineHeight:1.1 }}>
              Weight-Based Drug Dosing
            </h1>
            <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
              color:T.txt4, marginTop:4 }}>
              {DRUGS.length} Critical Drugs · RSI · Vasopressors · Reversal · Sedation · Resuscitation · Live Infusion Rates
            </p>
          </div>
        )}

        {embedded && (
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
            <span style={{ fontFamily:"'Playfair Display',serif",
              fontWeight:700, fontSize:15, color:T.teal }}>Drug Dosing</span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace",
              fontSize:8, color:T.txt4, letterSpacing:1.5, textTransform:"uppercase",
              background:"rgba(0,229,192,0.1)",
              border:"1px solid rgba(0,229,192,0.25)",
              borderRadius:4, padding:"2px 7px" }}>
              {DRUGS.length} drugs
            </span>
            {encWeight && (
              <span style={{ fontFamily:"'JetBrains Mono',monospace",
                fontSize:9, color:T.teal, marginLeft:"auto" }}>
                {encWeight} kg loaded
              </span>
            )}
          </div>
        )}

        <WeightBar
          weightKg={weightKg}
          setWeightKg={setWeightKg}
          ibwKg={ibwKg}
          setIbwKg={setIbwKg}
          source={Boolean(encWeight)} />

        <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:12 }}>
          {CATS.map(c => (
            <button key={c.id} onClick={() => setCat(c.id)}
              style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                fontWeight:700, padding:"4px 12px", borderRadius:20,
                cursor:"pointer", textTransform:"uppercase", letterSpacing:1,
                transition:"all .12s",
                border:`1px solid ${cat===c.id ? c.color+"77" : c.color+"33"}`,
                background:cat===c.id ? `${c.color}18` : "transparent",
                color:cat===c.id ? c.color : T.txt4 }}>
              {c.label} ({DRUGS.filter(d => c.id==="all"||d.cat===c.id).length})
            </button>
          ))}
        </div>

        <div style={{ display:"grid",
          gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",
          gap:10, marginBottom:24 }}>
          {filtered.map(drug => (
            <DrugCard key={drug.id} drug={drug} weightKg={weightKg} ibwKg={ibwKg} />
          ))}
        </div>

        {!embedded && (
          <div style={{ textAlign:"center", paddingBottom:24,
            fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, letterSpacing:1.5 }}>
            NOTRYA DOSING HUB · VERIFY ALL CALCULATIONS INDEPENDENTLY · MAX DOSES AUTOMATICALLY APPLIED · NOT A SUBSTITUTE FOR CLINICAL JUDGMENT
          </div>
        )}
      </div>
    </div>
  );
}