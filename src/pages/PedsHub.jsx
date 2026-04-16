// PedsHub.jsx — Pediatric Emergency Medicine Hub
// Broselow tape color estimator, weight-based resuscitation drug dosing,
// age-adjusted vital sign norms, pediatric fluid calculator, and airway sizing.
//
// Constraints: no form, no localStorage, no router, no sonner, no alert,
//   straight quotes only, border before borderTop/etc.,
//   finally { setBusy(false) } on async functions

import { useState, useCallback, useMemo } from "react";

// ── Font injection ────────────────────────────────────────────────────────────
(() => {
  if (document.getElementById("hub-fonts-peds")) return;
  const l = document.createElement("link");
  l.id = "hub-fonts-peds"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
})();

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:"#050f1e", panel:"#081628", card:"#0b1e36", up:"#0e2544",
  bd:"rgba(26,53,85,0.8)", txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", blue:"#3b9eff",
  orange:"#ff9f43", purple:"#9b6dff", green:"#3dffa0",
  accent:"#3b9eff",  // hub accent — blue for peds
};

// ── Broselow tape ─────────────────────────────────────────────────────────────
const BROSELOW = [
  { color:"grey",   hex:"#9e9e9e", kg:[3,5],   ageLabel:"0–3 months",       etSize:"3.0–3.5 uncuffed", blade:"0 straight" },
  { color:"pink",   hex:"#f06292", kg:[6,7],   ageLabel:"3–6 months",       etSize:"3.5 uncuffed",     blade:"1 straight" },
  { color:"red",    hex:"#ef5350", kg:[8,9],   ageLabel:"6–9 months",       etSize:"3.5–4.0 uncuffed", blade:"1 straight" },
  { color:"purple", hex:"#ab47bc", kg:[10,11], ageLabel:"9–18 months",      etSize:"4.0 uncuffed",     blade:"1 straight" },
  { color:"yellow", hex:"#fdd835", kg:[12,14], ageLabel:"18 months–3 years",etSize:"4.0–4.5 uncuffed", blade:"2 straight/curved" },
  { color:"white",  hex:"#e0e0e0", kg:[15,18], ageLabel:"3–4 years",        etSize:"4.5 uncuffed",     blade:"2 straight/curved" },
  { color:"blue",   hex:"#42a5f5", kg:[19,22], ageLabel:"4–6 years",        etSize:"5.0 cuffed",       blade:"2 curved" },
  { color:"orange", hex:"#ff7043", kg:[23,26], ageLabel:"6–8 years",        etSize:"5.5 cuffed",       blade:"2–3 curved" },
  { color:"green",  hex:"#66bb6a", kg:[27,34], ageLabel:"8–10 years",       etSize:"6.0 cuffed",       blade:"3 curved" },
  { color:"teal",   hex:"#26c6da", kg:[35,40], ageLabel:">10 years",        etSize:"6.5–7.0 cuffed",   blade:"3 curved" },
];

function getBroselow(wt) {
  if (!wt || wt <= 0) return null;
  return BROSELOW.find(b => wt >= b.kg[0] && wt <= b.kg[1]) || (wt > 40 ? BROSELOW[9] : null);
}

// ── Drug table ────────────────────────────────────────────────────────────────
// Each drug: { id, name, category, doseText, calc(wt)→{dose,unit,note} }
const DRUGS = [
  // ── Cardiac arrest ────────────────────────────────────────────────────────
  {
    id:"epi-arrest", name:"Epinephrine", category:"Cardiac Arrest",
    doseText:"0.01 mg/kg IV/IO q3-5min · max 1 mg",
    calc: wt => { const d = Math.min(wt * 0.01, 1); return { dose:d.toFixed(2), unit:"mg IV/IO", note:"= " + (d*10).toFixed(1) + " mL of 0.1 mg/mL (1:10,000)" }; },
  },
  {
    id:"atropine", name:"Atropine", category:"Cardiac Arrest",
    doseText:"0.02 mg/kg IV · min 0.1 mg · max 0.5 mg (child) / 1 mg (adolescent)",
    calc: wt => { const d = Math.min(Math.max(wt * 0.02, 0.1), wt < 20 ? 0.5 : 1); return { dose:d.toFixed(2), unit:"mg IV/IO", note:"min 0.1 mg to avoid paradoxical bradycardia" }; },
  },
  {
    id:"amiodarone", name:"Amiodarone", category:"Cardiac Arrest",
    doseText:"5 mg/kg IV/IO · max 300 mg",
    calc: wt => { const d = Math.min(wt * 5, 300); return { dose:d.toFixed(0), unit:"mg IV/IO", note:"give over 20–60 min for perfusing rhythm; rapid push in arrest" }; },
  },
  {
    id:"bicarb", name:"Sodium Bicarbonate", category:"Cardiac Arrest",
    doseText:"1 mEq/kg IV · max 50 mEq",
    calc: wt => { const d = Math.min(wt, 50); return { dose:d.toFixed(0), unit:"mEq IV", note:"= " + d.toFixed(0) + " mL of 1 mEq/mL (8.4%)" }; },
  },
  {
    id:"calcium", name:"Calcium Gluconate (10%)", category:"Cardiac Arrest",
    doseText:"60–100 mg/kg IV · max 3 g",
    calc: wt => { const d = Math.min(wt * 60, 3000); return { dose:(d/100).toFixed(1), unit:"mL of 10% solution IV", note:d.toFixed(0) + " mg elemental · give slowly over 5 min" }; },
  },
  {
    id:"adenosine", name:"Adenosine", category:"Cardiac Arrest",
    doseText:"0.1 mg/kg IV rapid push · max 6 mg (1st dose)",
    calc: wt => { const d = Math.min(wt * 0.1, 6); return { dose:d.toFixed(1), unit:"mg IV rapid push", note:"flush immediately; 2nd dose 0.2 mg/kg max 12 mg" }; },
  },
  // ── RSI / Airway ──────────────────────────────────────────────────────────
  {
    id:"ketamine", name:"Ketamine (RSI)", category:"RSI / Sedation",
    doseText:"1–2 mg/kg IV · 4 mg/kg IM",
    calc: wt => { const iv = Math.min(wt * 1.5, 300); const im = Math.min(wt * 4, 500); return { dose:iv.toFixed(0), unit:"mg IV", note:"or " + im.toFixed(0) + " mg IM · preferred in hemodynamically unstable" }; },
  },
  {
    id:"etomidate", name:"Etomidate (RSI)", category:"RSI / Sedation",
    doseText:"0.3 mg/kg IV · max 30 mg",
    calc: wt => { const d = Math.min(wt * 0.3, 30); return { dose:d.toFixed(1), unit:"mg IV", note:"caution in adrenal insufficiency; single dose ED use acceptable" }; },
  },
  {
    id:"succs", name:"Succinylcholine", category:"RSI / Sedation",
    doseText:"2 mg/kg IV (<10 kg) · 1.5 mg/kg (>10 kg) · max 150 mg",
    calc: wt => { const dose = wt < 10 ? 2 : 1.5; const d = Math.min(wt * dose, 150); return { dose:d.toFixed(0), unit:"mg IV", note:wt < 10 ? "infant dose (2 mg/kg)" : "child/adult dose (1.5 mg/kg)" }; },
  },
  {
    id:"roc", name:"Rocuronium", category:"RSI / Sedation",
    doseText:"1.2 mg/kg IV · max 100 mg",
    calc: wt => { const d = Math.min(wt * 1.2, 100); return { dose:d.toFixed(0), unit:"mg IV", note:"sugammadex reversal: 16 mg/kg max 200 mg" }; },
  },
  {
    id:"midaz", name:"Midazolam", category:"RSI / Sedation",
    doseText:"0.1 mg/kg IV · 0.2 mg/kg IM · max 5 mg",
    calc: wt => { const iv = Math.min(wt * 0.1, 5); const im = Math.min(wt * 0.2, 5); return { dose:iv.toFixed(2), unit:"mg IV", note:"or " + im.toFixed(2) + " mg IM" }; },
  },
  // ── Seizure ───────────────────────────────────────────────────────────────
  {
    id:"loraze", name:"Lorazepam (status)", category:"Seizure",
    doseText:"0.1 mg/kg IV/IO · max 4 mg",
    calc: wt => { const d = Math.min(wt * 0.1, 4); return { dose:d.toFixed(2), unit:"mg IV/IO", note:"may repeat once; give over 2 min" }; },
  },
  {
    id:"diazr", name:"Diazepam (rectal)", category:"Seizure",
    doseText:"0.5 mg/kg PR · max 20 mg",
    calc: wt => { const d = Math.min(wt * 0.5, 20); return { dose:d.toFixed(1), unit:"mg PR", note:"when no IV access" }; },
  },
  {
    id:"keppra", name:"Levetiracetam (status)", category:"Seizure",
    doseText:"60 mg/kg IV · max 4,500 mg",
    calc: wt => { const d = Math.min(wt * 60, 4500); return { dose:d.toFixed(0), unit:"mg IV", note:"infuse over 5–15 min" }; },
  },
  {
    id:"phenytoin", name:"Fosphenytoin", category:"Seizure",
    doseText:"20 mg PE/kg IV · max 1,500 mg PE",
    calc: wt => { const d = Math.min(wt * 20, 1500); return { dose:d.toFixed(0), unit:"mg PE IV", note:"max rate 3 mg PE/kg/min" }; },
  },
  // ── Analgesia ─────────────────────────────────────────────────────────────
  {
    id:"fent", name:"Fentanyl", category:"Analgesia",
    doseText:"1–2 mcg/kg IV · 2 mcg/kg IN · max 100 mcg",
    calc: wt => { const iv = Math.min(wt * 1.5, 100); const ins = Math.min(wt * 2, 100); return { dose:iv.toFixed(0), unit:"mcg IV", note:"or " + ins.toFixed(0) + " mcg IN (100 mcg/mL nasal)" }; },
  },
  {
    id:"morphine", name:"Morphine", category:"Analgesia",
    doseText:"0.1 mg/kg IV · max 4 mg per dose",
    calc: wt => { const d = Math.min(wt * 0.1, 4); return { dose:d.toFixed(2), unit:"mg IV", note:"titrate q20min; monitor resp" }; },
  },
  // ── Antibiotics / Other ───────────────────────────────────────────────────
  {
    id:"dextrose", name:"Dextrose (hypoglycemia)", category:"Metabolic",
    doseText:"<1 yr: D10W 5–10 mL/kg · >1 yr: D25W 2–4 mL/kg · max 25 g",
    calc: wt => { const d = wt < 10 ? Math.min(wt * 5, 250) : Math.min(wt * 2, 250); const conc = wt < 10 ? "D10W" : "D25W"; return { dose:d.toFixed(0), unit:`mL of ${conc} IV`, note:"= " + (d * (wt < 10 ? 0.1 : 0.25)).toFixed(1) + " g glucose" }; },
  },
  {
    id:"epi-ana", name:"Epinephrine (anaphylaxis)", category:"Anaphylaxis",
    doseText:"0.01 mg/kg IM (1:1,000) · max 0.5 mg",
    calc: wt => { const d = Math.min(wt * 0.01, 0.5); return { dose:d.toFixed(2), unit:"mg IM (1:1,000)", note:"= " + d.toFixed(2) + " mL of 1 mg/mL · anterolateral thigh" }; },
  },
  {
    id:"ondansetron", name:"Ondansetron", category:"Antiemetic",
    doseText:"0.15 mg/kg IV · max 4 mg",
    calc: wt => { const d = Math.min(wt * 0.15, 4); return { dose:d.toFixed(2), unit:"mg IV/PO", note:"give over 2 min IV" }; },
  },
];

const DRUG_CATEGORIES = [...new Set(DRUGS.map(d => d.category))];

// ── Age-adjusted vital sign norms ─────────────────────────────────────────────
const VITAL_NORMS = [
  { age:"Newborn (0–1 mo)",    hr:[100,160], sbp:[60,90],   rr:[30,60], wt:"2.5–4 kg"  },
  { age:"Infant (1–12 mo)",    hr:[100,160], sbp:[70,100],  rr:[25,40], wt:"4–10 kg"   },
  { age:"Toddler (1–3 yr)",    hr:[90,150],  sbp:[80,110],  rr:[20,30], wt:"10–14 kg"  },
  { age:"Preschool (3–6 yr)",  hr:[80,140],  sbp:[80,110],  rr:[20,25], wt:"14–23 kg"  },
  { age:"School (6–12 yr)",    hr:[70,120],  sbp:[85,120],  rr:[15,20], wt:"23–40 kg"  },
  { age:"Adolescent (>12 yr)", hr:[60,100],  sbp:[90,130],  rr:[12,18], wt:"40+ kg"    },
];

// ── Min SBP by age (PALS 2020) ────────────────────────────────────────────────
// Min SBP = 70 + (2 × age in years)
function minSBP(ageYears) {
  if (ageYears === null) return null;
  if (ageYears < 1) return 60;
  return 70 + 2 * Math.floor(ageYears);
}

// ── Fluid calculator ──────────────────────────────────────────────────────────
// Maintenance (Holliday-Segar), resuscitation bolus, deficit replacement
function calcMaintenance(wt) {
  if (!wt || wt <= 0) return null;
  let rate;
  if      (wt <= 10) rate = wt * 4;
  else if (wt <= 20) rate = 40 + (wt - 10) * 2;
  else               rate = 60 + (wt - 20) * 1;
  return { hourly: rate.toFixed(0), daily: (rate * 24).toFixed(0) };
}

// ── Sub-components ────────────────────────────────────────────────────────────
function TabBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick}
      style={{ padding:"9px 18px", border:"none", borderBottom: active ? `2px solid ${T.blue}` : "2px solid transparent", background:"transparent", color: active ? T.blue : T.txt4, fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight: active ? 700 : 400, cursor:"pointer", transition:"all .15s", whiteSpace:"nowrap" }}>
      {children}
    </button>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.txt4, letterSpacing:"1.5px", textTransform:"uppercase", marginBottom:8 }}>
      {children}
    </div>
  );
}

function DoseCard({ drug, wt }) {
  const result = wt && wt > 0 ? drug.calc(wt) : null;
  return (
    <div style={{ padding:"11px 13px", borderRadius:10, background:T.card, border:`1px solid ${T.bd}`, borderLeft:`3px solid ${T.blue}` }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:8, flexWrap:"wrap", marginBottom:6 }}>
        <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:700, color:T.txt }}>{drug.name}</span>
        {result && (
          <div style={{ textAlign:"right", flexShrink:0 }}>
            <span style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:900, color:T.teal }}>{result.dose}</span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.teal, marginLeft:5 }}>{result.unit}</span>
          </div>
        )}
      </div>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.txt4, marginBottom: result?.note ? 4 : 0 }}>
        {drug.doseText}
      </div>
      {result?.note && (
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt3, marginTop:3, lineHeight:1.5 }}>
          {result.note}
        </div>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function PedsHub() {
  const [tab,          setTab]          = useState("dosing");
  const [weightInput,  setWeightInput]  = useState("");
  const [ageYears,     setAgeYears]     = useState("");
  const [ageMonths,    setAgeMonths]    = useState("");
  const [activeCat,    setActiveCat]    = useState("All");
  const [drugSearch,   setDrugSearch]   = useState("");

  const wt           = parseFloat(weightInput) || 0;
  const ageYrs       = parseFloat(ageYears)    || null;
  const ageMos       = parseFloat(ageMonths)   || null;
  const totalAgeYrs  = ageYrs !== null ? ageYrs + (ageMos || 0) / 12 : ageMos !== null ? ageMos / 12 : null;

  const broselow   = getBroselow(wt);
  const maintenance = calcMaintenance(wt);

  // Estimate weight from age if no weight entered
  const estWeight = useMemo(() => {
    if (wt > 0) return null;
    if (totalAgeYrs === null) return null;
    if (totalAgeYrs < 1) return Math.round(totalAgeYrs * 12 * 0.45 + 3.5);
    if (totalAgeYrs < 10) return Math.round((totalAgeYrs * 2) + 8);
    return Math.round((totalAgeYrs * 3) + 7);
  }, [wt, totalAgeYrs]);

  const effectiveWt = wt > 0 ? wt : (estWeight || 0);

  const filteredDrugs = useMemo(() => DRUGS.filter(d => {
    const catMatch = activeCat === "All" || d.category === activeCat;
    const searchMatch = !drugSearch || d.name.toLowerCase().includes(drugSearch.toLowerCase()) || d.category.toLowerCase().includes(drugSearch.toLowerCase());
    return catMatch && searchMatch;
  }), [activeCat, drugSearch]);

  const minBP = totalAgeYrs !== null ? minSBP(totalAgeYrs) : null;

  return (
    <div style={{ background:T.bg, minHeight:"calc(100vh - 88px)", color:T.txt, fontFamily:"'DM Sans',sans-serif" }}>

      {/* ── Header ── */}
      <div style={{ padding:"20px 24px 0" }}>
        <div style={{ display:"flex", alignItems:"flex-start", gap:20, marginBottom:20, flexWrap:"wrap" }}>
          <div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:900, color:T.txt, marginBottom:4 }}>
              Pediatric Hub
            </div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.txt4 }}>
              Weight-based dosing · Broselow tape · Age-adjusted vitals · Fluid calculator
            </div>
          </div>

          {/* Weight + age input strip */}
          <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginLeft:"auto" }}>
            <div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.txt4, letterSpacing:"1.2px", textTransform:"uppercase", marginBottom:4 }}>Weight (kg)</div>
              <input
                type="number" inputMode="decimal" placeholder="e.g. 18"
                value={weightInput} onChange={e => setWeightInput(e.target.value)}
                style={{ width:90, background:T.up, border:`1px solid ${T.bd}`, borderRadius:7, padding:"7px 10px", color:T.txt, fontFamily:"'JetBrains Mono',monospace", fontSize:14, fontWeight:700, outline:"none", textAlign:"center" }}
              />
            </div>
            <div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.txt4, letterSpacing:"1.2px", textTransform:"uppercase", marginBottom:4 }}>Age (yr)</div>
              <input
                type="number" inputMode="decimal" placeholder="0"
                value={ageYears} onChange={e => setAgeYears(e.target.value)}
                style={{ width:70, background:T.up, border:`1px solid ${T.bd}`, borderRadius:7, padding:"7px 10px", color:T.txt, fontFamily:"'JetBrains Mono',monospace", fontSize:13, outline:"none", textAlign:"center" }}
              />
            </div>
            <div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.txt4, letterSpacing:"1.2px", textTransform:"uppercase", marginBottom:4 }}>Age (mo)</div>
              <input
                type="number" inputMode="decimal" placeholder="0"
                value={ageMonths} onChange={e => setAgeMonths(e.target.value)}
                style={{ width:70, background:T.up, border:`1px solid ${T.bd}`, borderRadius:7, padding:"7px 10px", color:T.txt, fontFamily:"'JetBrains Mono',monospace", fontSize:13, outline:"none", textAlign:"center" }}
              />
            </div>
          </div>
        </div>

        {/* Broselow color bar */}
        {(wt > 0 || estWeight) && broselow && (
          <div style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 14px", borderRadius:10, background:T.card, border:`1px solid ${broselow.hex}55`, borderLeft:`4px solid ${broselow.hex}`, marginBottom:16, flexWrap:"wrap" }}>
            <div style={{ width:28, height:28, borderRadius:6, background:broselow.hex, flexShrink:0 }} />
            <div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:14, fontWeight:700, color:broselow.hex, textTransform:"capitalize" }}>
                Broselow {broselow.color} — {broselow.kg[0]}–{broselow.kg[1]} kg
              </div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt3, marginTop:2 }}>
                {broselow.ageLabel} · ET tube: {broselow.etSize} · Laryngoscope: {broselow.blade}
              </div>
            </div>
            <div style={{ marginLeft:"auto", display:"flex", gap:16, flexWrap:"wrap" }}>
              {maintenance && (
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:900, color:T.teal }}>{maintenance.hourly}</div>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.txt4, textTransform:"uppercase", letterSpacing:"0.08em" }}>mL/hr maint.</div>
                </div>
              )}
              {minBP !== null && (
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:900, color:T.gold }}>{minBP}</div>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.txt4, textTransform:"uppercase", letterSpacing:"0.08em" }}>min SBP mmHg</div>
                </div>
              )}
              <div style={{ textAlign:"center" }}>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:900, color:T.blue }}>{(effectiveWt * 20).toFixed(0)}</div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.txt4, textTransform:"uppercase", letterSpacing:"0.08em" }}>mL bolus NS</div>
              </div>
            </div>
          </div>
        )}

        {/* Estimated weight notice */}
        {!wt && estWeight && (
          <div style={{ padding:"7px 12px", borderRadius:7, background:"rgba(245,200,66,.07)", border:"1px solid rgba(245,200,66,.3)", marginBottom:12, fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.gold }}>
            \u26a0 Estimated weight {estWeight} kg from age — enter actual weight for accurate dosing
          </div>
        )}

        {/* Tab bar */}
        <div style={{ display:"flex", gap:0, borderBottom:`1px solid ${T.bd}` }}>
          {[["dosing","💊 Drug Dosing"],["vitals","📊 Vital Norms"],["fluids","💧 Fluids"],["airway","🫁 Airway"]].map(([id, lbl]) => (
            <TabBtn key={id} active={tab===id} onClick={() => setTab(id)}>{lbl}</TabBtn>
          ))}
        </div>
      </div>

      <div style={{ padding:"20px 24px 60px" }}>

        {/* ══ DRUG DOSING TAB ══ */}
        {tab === "dosing" && (
          <div>
            {!effectiveWt && (
              <div style={{ padding:"40px 20px", textAlign:"center", color:T.txt4, fontFamily:"'DM Sans',sans-serif", fontSize:13 }}>
                Enter weight or age above to calculate doses
              </div>
            )}
            {effectiveWt > 0 && (
              <>
                {/* Filter row */}
                <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap", alignItems:"center" }}>
                  <input
                    placeholder="Search drugs..."
                    value={drugSearch} onChange={e => setDrugSearch(e.target.value)}
                    style={{ background:T.up, border:`1px solid ${T.bd}`, borderRadius:7, padding:"6px 12px", color:T.txt, fontFamily:"'DM Sans',sans-serif", fontSize:12, outline:"none", width:180 }}
                  />
                  <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                    {["All", ...DRUG_CATEGORIES].map(cat => (
                      <button key={cat} onClick={() => setActiveCat(cat)}
                        style={{ padding:"4px 11px", borderRadius:20, border:`1px solid ${activeCat===cat ? "rgba(59,158,255,.5)" : T.bd}`, background: activeCat===cat ? "rgba(59,158,255,.12)" : "transparent", color: activeCat===cat ? T.blue : T.txt4, fontFamily:"'DM Sans',sans-serif", fontSize:10, fontWeight: activeCat===cat ? 600 : 400, cursor:"pointer", transition:"all .12s", whiteSpace:"nowrap" }}>
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Drug cards — grouped by category */}
                {DRUG_CATEGORIES.filter(cat => activeCat === "All" || cat === activeCat).map(cat => {
                  const drugs = filteredDrugs.filter(d => d.category === cat);
                  if (!drugs.length) return null;
                  return (
                    <div key={cat} style={{ marginBottom:20 }}>
                      <SectionLabel>{cat}</SectionLabel>
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:8 }}>
                        {drugs.map(d => <DoseCard key={d.id} drug={d} wt={effectiveWt} />)}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}

        {/* ══ VITAL NORMS TAB ══ */}
        {tab === "vitals" && (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div style={{ padding:"9px 12px", borderRadius:8, background:"rgba(59,158,255,.06)", border:"1px solid rgba(59,158,255,.2)", fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt3, marginBottom:4 }}>
              Minimum SBP by age (PALS 2020): <strong style={{ color:T.txt }}>70 + (2 × age in years)</strong>. Values below suggest decompensated shock.
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:8 }}>
              {VITAL_NORMS.map(n => (
                <div key={n.age} style={{ padding:"12px 14px", borderRadius:10, background:T.card, border:`1px solid ${T.bd}` }}>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:13, fontWeight:700, color:T.txt, marginBottom:8 }}>{n.age}</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                    {[
                      { lbl:"HR", val:`${n.hr[0]}–${n.hr[1]}`, unit:"bpm",    col:T.coral },
                      { lbl:"SBP",val:`${n.sbp[0]}–${n.sbp[1]}`,unit:"mmHg",  col:T.gold  },
                      { lbl:"RR", val:`${n.rr[0]}–${n.rr[1]}`, unit:"/min",   col:T.blue  },
                      { lbl:"Wt", val:n.wt,                    unit:"",       col:T.teal  },
                    ].map(v => (
                      <div key={v.lbl} style={{ textAlign:"center", padding:"6px 8px", borderRadius:7, background:T.up }}>
                        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.txt4, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:3 }}>{v.lbl}</div>
                        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:700, color:v.col }}>{v.val}</div>
                        {v.unit && <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.txt4 }}>{v.unit}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ FLUIDS TAB ══ */}
        {tab === "fluids" && (
          <div style={{ display:"flex", flexDirection:"column", gap:14, maxWidth:640 }}>
            {!effectiveWt ? (
              <div style={{ padding:"40px 20px", textAlign:"center", color:T.txt4, fontSize:13 }}>Enter weight above to calculate fluid volumes</div>
            ) : (
              <>
                {[
                  { label:"Resuscitation Bolus (NS/LR)",     val:(effectiveWt*20).toFixed(0),  unit:"mL", note:"20 mL/kg — reassess after each bolus; max 60 mL/kg in sepsis", col:T.coral },
                  { label:"Maintenance (Holliday-Segar)",    val:maintenance?.hourly,           unit:"mL/hr", note:`${maintenance?.daily} mL/day total`, col:T.blue },
                  { label:"Blood (pRBC) Transfusion",        val:(effectiveWt*10).toFixed(0),  unit:"mL", note:"10 mL/kg — give over 3–4h; target Hgb ≥7", col:T.gold },
                  { label:"FFP",                             val:(effectiveWt*10).toFixed(0),  unit:"mL", note:"10–15 mL/kg for coagulopathy", col:T.purple },
                  { label:"Platelets",                       val:(effectiveWt*5).toFixed(0),   unit:"mL", note:"5–10 mL/kg — 1 apheresis unit ≈ 200–300 mL", col:T.orange },
                  { label:"Dextrose bolus (D10W, <1 yr)",    val:(effectiveWt*5).toFixed(0),   unit:"mL D10W", note:"0.5 g/kg glucose · = " + (effectiveWt*5*0.1).toFixed(1) + " g glucose", col:T.teal },
                  { label:"Dextrose bolus (D25W, >1 yr)",    val:(effectiveWt*2).toFixed(0),   unit:"mL D25W", note:"0.5 g/kg glucose · = " + (effectiveWt*2*0.25).toFixed(1) + " g glucose", col:T.teal },
                ].map(r => (
                  <div key={r.label} style={{ display:"flex", alignItems:"center", padding:"12px 16px", borderRadius:10, background:T.card, border:`1px solid ${T.bd}`, borderLeft:`3px solid ${r.col}`, gap:14 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, color:T.txt, marginBottom:3 }}>{r.label}</div>
                      <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt4 }}>{r.note}</div>
                    </div>
                    <div style={{ textAlign:"right", flexShrink:0 }}>
                      <span style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:900, color:r.col }}>{r.val}</span>
                      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:r.col, marginLeft:5 }}>{r.unit}</span>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* ══ AIRWAY TAB ══ */}
        {tab === "airway" && (
          <div style={{ display:"flex", flexDirection:"column", gap:10, maxWidth:700 }}>
            <div style={{ padding:"9px 12px", borderRadius:8, background:"rgba(59,158,255,.06)", border:"1px solid rgba(59,158,255,.2)", fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt3, marginBottom:4 }}>
              Uncuffed tubes preferred &lt;8 years. Cuffed tubes acceptable at all ages with careful cuff pressure monitoring (&lt;20–25 cmH₂O).
              Uncuffed size formula: <strong style={{ color:T.txt }}>(Age ÷ 4) + 4</strong>. Cuffed: <strong style={{ color:T.txt }}>(Age ÷ 4) + 3.5</strong>.
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:8 }}>
              {BROSELOW.map(b => (
                <div key={b.color} style={{ padding:"12px 14px", borderRadius:10, background:T.card, border:`1px solid ${b.hex}44`, borderLeft:`3px solid ${b.hex}` }}>
                  <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:9 }}>
                    <div style={{ width:14, height:14, borderRadius:3, background:b.hex, flexShrink:0 }} />
                    <span style={{ fontFamily:"'Playfair Display',serif", fontSize:13, fontWeight:700, color:b.hex, textTransform:"capitalize" }}>{b.color}</span>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.txt4 }}>{b.kg[0]}–{b.kg[1]} kg · {b.ageLabel}</span>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                    {[
                      { lbl:"ET Tube", val:b.etSize },
                      { lbl:"Blade", val:b.blade },
                      { lbl:"Depth (lip)", val:b.kg[1] < 10 ? (Math.round(b.kg[1] * 0.5) + 9) + "–" + (Math.round(b.kg[1] * 0.5) + 11) + " cm" : (Math.round((b.kg[0]+b.kg[1])/2 * 0.3) + 9) + " cm" },
                      { lbl:"LMA size", val:b.kg[1] <= 5 ? "1" : b.kg[1] <= 10 ? "1.5" : b.kg[1] <= 20 ? "2" : b.kg[1] <= 30 ? "2.5" : "3" },
                    ].map(r => (
                      <div key={r.lbl} style={{ display:"flex", justifyContent:"space-between", fontFamily:"'DM Sans',sans-serif", fontSize:11 }}>
                        <span style={{ color:T.txt4 }}>{r.lbl}</span>
                        <span style={{ color:T.txt, fontWeight:600 }}>{r.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}