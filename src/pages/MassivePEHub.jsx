import { useState } from "react";

// ── Font Loader ──────────────────────────────────────────────────────────────
(() => {
  if (typeof document === "undefined") return;
  const l = document.createElement("link");
  l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap";
  document.head.appendChild(l);
})();

// ── Tokens ───────────────────────────────────────────────────────────────────
const T = {
  bg: "#0a1628", glass: "rgba(255,255,255,0.04)", glassMid: "rgba(255,255,255,0.07)",
  border: "rgba(255,255,255,0.08)", teal: "#14b8a6", gold: "#f59e0b", coral: "#f43f5e",
  green: "#22c55e", blue: "#3b82f6", purple: "#a78bfa", amber: "#fb923c",
  white: "#f0f4f8", muted: "rgba(240,244,248,0.55)", dim: "rgba(240,244,248,0.28)",
  sans: "'DM Sans', sans-serif", serif: "'Playfair Display', serif", mono: "'JetBrains Mono', monospace",
};
const G    = (x = {}) => ({ background: T.glass, backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", border: `1px solid ${T.border}`, borderRadius: 14, ...x });
const pill = (bg)     => ({ display: "inline-block", background: bg, borderRadius: 6, padding: "3px 10px", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", marginRight: 6, marginBottom: 10 });
const tag  = (c)      => ({ display: "inline-block", background: c + "22", border: `1px solid ${c}44`, borderRadius: 5, padding: "2px 8px", fontSize: 10.5, fontWeight: 600, color: c });
const card = (x = {}) => ({ ...G(), padding: "14px 16px", ...x });
const aBox = (c, mb = 10) => ({ background: c + "14", border: `1px solid ${c}40`, borderRadius: 10, padding: "10px 14px", marginBottom: mb });
const sL   = (c = T.blue) => ({ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: c, margin: "18px 0 10px", display: "flex", alignItems: "center", gap: 8 });
const dv   = { height: 1, background: T.border, margin: "10px 0" };
const inp  = { width: "100%", padding: "9px 12px", background: T.glassMid, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 14, fontFamily: T.mono, fontWeight: 600, outline: "none", boxSizing: "border-box" };

// ── Data ─────────────────────────────────────────────────────────────────────
const SPESI_ITEMS = [
  { id: "age",    label: "Age > 80 years",                        pts: 1 },
  { id: "cancer", label: "Active cancer",                          pts: 1 },
  { id: "cardio", label: "Chronic cardiopulmonary disease",         pts: 1 },
  { id: "hr",     label: "HR ≥ 110 bpm",                          pts: 1 },
  { id: "sbp",    label: "SBP < 100 mmHg",                        pts: 1 },
  { id: "spo2",   label: "SpO₂ < 90%",                            pts: 1 },
];

const WELLS_ITEMS = [
  { id: "dvt",   label: "Clinical signs/symptoms of DVT",           pts: 3.0 },
  { id: "alt",   label: "Alternative diagnosis less likely than PE", pts: 3.0 },
  { id: "hr",    label: "Heart rate > 100 bpm",                     pts: 1.5 },
  { id: "imm",   label: "Immobilization or surgery within 4 weeks", pts: 1.5 },
  { id: "prior", label: "Prior DVT or PE",                          pts: 1.5 },
  { id: "hemo",  label: "Hemoptysis",                               pts: 1.0 },
  { id: "malig", label: "Malignancy (treatment within 6 months / palliative)", pts: 1.0 },
];

const PERC_ITEMS = [
  { id: "age",   label: "Age < 50" },
  { id: "hr",    label: "HR < 100 bpm" },
  { id: "spo2",  label: "SpO₂ ≥ 95% on room air" },
  { id: "hemo",  label: "No hemoptysis" },
  { id: "estro", label: "No exogenous estrogen use" },
  { id: "prior", label: "No prior DVT or PE" },
  { id: "leg",   label: "No unilateral leg swelling" },
  { id: "surg",  label: "No surgery or trauma within 4 weeks" },
];

const CI_LYTICS_ABS = [
  "Any prior intracranial hemorrhage",
  "Structural cerebral vascular lesion (AVM)",
  "Intracranial malignancy",
  "Ischemic stroke within 3 months",
  "Suspected aortic dissection",
  "Active significant internal bleeding (excluding menses)",
  "Significant closed-head or facial trauma within 3 months",
  "Intracranial or intraspinal surgery within 3 months",
];

const CI_LYTICS_REL = [
  "BP > 185/110 despite treatment",
  "Major surgery, serious trauma, or obstetric delivery within 10 days",
  "Pregnancy",
  "Active peptic ulcer or recent GI bleeding",
  "Recent invasive procedure (cardiac cath, lumbar puncture < 10 days)",
  "Traumatic CPR > 10 min",
  "Age > 75 (increased ICH risk)",
];

// ── Main Component ───────────────────────────────────────────────────────────
export default function MassivePEHub({ onBack }) {
  const [tab, setTab]     = useState(0);
  const [spesi, setSpesi] = useState({});
  const [wells, setWells] = useState({});
  const [perc, setPerc]   = useState({});
  const [age, setAge]     = useState("");
  const TABS = ["Risk Stratification", "Diagnosis", "Treatment", "Monitoring"];

  const spesiScore = SPESI_ITEMS.reduce((s, i) => s + (spesi[i.id] ? i.pts : 0), 0);
  const wellsScore = WELLS_ITEMS.reduce((s, i) => s + (wells[i.id] ? i.pts : 0), 0);
  const percAll    = PERC_ITEMS.every(i => perc[i.id]);
  const percCount  = PERC_ITEMS.filter(i => perc[i.id]).length;
  const ageAdj     = age && !isNaN(age) && parseInt(age) > 50 ? parseInt(age) * 10 : null;

  const spesiRisk = spesiScore === 0
    ? { label: "Low Risk", color: T.green,  action: "30-day mortality ~1% · Outpatient treatment candidate (if no other concerns)" }
    : { label: "Higher Risk", color: T.coral, action: "Hospitalization required · further risk stratification needed" };

  const wellsRisk = wellsScore > 4
    ? { label: "PE Likely (> 4)", color: T.coral, action: "Proceed directly to CT-PA — do not obtain D-dimer first" }
    : { label: "PE Unlikely (≤ 4)", color: T.gold, action: "Obtain D-dimer — if negative (age-adjusted), PE excluded" };

  const toggle = (setter, id) => setter(prev => ({ ...prev, [id]: !prev[id] }));
  const checkBox = (checked, color = T.teal) => ({
    width: 18, height: 18, borderRadius: 4,
    border: `1.5px solid ${checked ? color : T.border}`,
    background: checked ? color + "30" : "transparent",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 11, color: checked ? color : T.dim, flexShrink: 0, cursor: "pointer",
  });

  // ── TAB 0: RISK STRATIFICATION ────────────────────────────────────────────
  const Tab0 = (
    <div>
      <div style={sL()}>PE Risk Classification</div>
      {[
        { label: "Massive PE", sub: "High-Risk", color: T.coral,
          criteria: ["SBP < 90 mmHg sustained > 15 min OR drop > 40 mmHg from baseline", "Cardiac arrest requiring CPR", "Severe bradycardia with signs of shock"],
          action: "Systemic thrombolytics if no CI · surgical embolectomy if CI · ECMO bridge" },
        { label: "Submassive PE — Intermediate-High", sub: "Intermediate-Risk", color: T.amber,
          criteria: ["Normotensive (SBP ≥ 90)", "RV dysfunction on echo or CT (RV/LV > 0.9)", "AND elevated troponin or BNP/NT-proBNP"],
          action: "Anticoagulate + monitor closely · consider CDT or systemic lytics if deteriorating · PERT consult" },
        { label: "Submassive PE — Intermediate-Low", sub: "Intermediate-Risk", color: T.gold,
          criteria: ["Normotensive", "RV dysfunction OR elevated biomarkers (not both)"],
          action: "Anticoagulate · hospitalization · close monitoring for deterioration" },
        { label: "Low-Risk PE", sub: "Low-Risk", color: T.green,
          criteria: ["Normotensive", "No RV dysfunction", "No biomarker elevation", "sPESI = 0"],
          action: "DOAC · consider outpatient treatment if sPESI 0 + reliable follow-up + no hypoxia" },
      ].map(({ label, sub, color, criteria, action }) => (
        <div key={label} style={{ ...card({ marginBottom: 10, borderLeft: `3px solid ${color}` }) }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 2 }}>{label}</div>
              <div style={tag(color)}>{sub}</div>
            </div>
          </div>
          {criteria.map((c, i) => (
            <div key={i} style={{ fontSize: 11.5, color: T.muted, display: "flex", gap: 7, marginBottom: 4 }}>
              <span style={{ color, flexShrink: 0 }}>●</span>{c}
            </div>
          ))}
          <div style={{ ...aBox(color, 0), marginTop: 8 }}>
            <div style={{ fontSize: 11.5, color }}>{action}</div>
          </div>
        </div>
      ))}

      <div style={sL(T.purple)}>RV Dysfunction — Diagnostic Criteria</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.purple, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Echo Findings</div>
        {["RV/LV diameter ratio > 0.9 (apical 4-chamber)", "McConnell's sign: RV free wall hypokinesis with preserved apical motion", "D-sign: interventricular septal flattening in parasternal short-axis", "Elevated RVSP via tricuspid regurgitation jet (> 40 mmHg)", "Loss of IVC respiratory variation (volume overload)"].map((f, i) => (
          <div key={i} style={{ fontSize: 11.5, color: T.muted, display: "flex", gap: 7, marginBottom: 4 }}><span style={{ color: T.purple }}>●</span>{f}</div>
        ))}
        <div style={dv} />
        <div style={{ fontSize: 11, fontWeight: 700, color: T.blue, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>CT-PA Findings</div>
        {["RV/LV diameter ratio > 0.9 on axial CT", "Pulmonary artery diameter > aorta diameter", "Interventricular septal flattening or bowing left", "Contrast reflux into IVC / hepatic veins (severe RV failure)"].map((f, i) => (
          <div key={i} style={{ fontSize: 11.5, color: T.muted, display: "flex", gap: 7, marginBottom: 4 }}><span style={{ color: T.blue }}>●</span>{f}</div>
        ))}
      </div>

      <div style={sL(T.teal)}>Simplified PESI Calculator</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        {SPESI_ITEMS.map(item => (
          <div key={item.id} style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8, cursor: "pointer" }}
            onClick={() => toggle(setSpesi, item.id)}>
            <div style={checkBox(spesi[item.id])}>{spesi[item.id] && "✓"}</div>
            <div style={{ flex: 1, fontSize: 12, color: spesi[item.id] ? T.white : T.muted }}>{item.label}</div>
            <div style={{ fontFamily: T.mono, fontSize: 12, color: spesi[item.id] ? T.coral : T.dim }}>+{item.pts}</div>
          </div>
        ))}
        <div style={dv} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: T.white }}>sPESI Score</span>
          <span style={{ fontFamily: T.mono, fontSize: 22, fontWeight: 800, color: spesiScore === 0 ? T.green : T.coral }}>{spesiScore}</span>
        </div>
        <div style={{ ...aBox(spesiRisk.color, 0), marginTop: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: spesiRisk.color, marginBottom: 2 }}>{spesiRisk.label}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{spesiRisk.action}</div>
        </div>
      </div>
    </div>
  );

  // ── TAB 1: DIAGNOSIS ──────────────────────────────────────────────────────
  const Tab1 = (
    <div>
      <div style={aBox(T.blue, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.blue, marginBottom: 2 }}>Diagnostic Strategy</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>Massive PE with hemodynamic instability → CT-PA directly (or bedside echo if unstable for CT) · Do NOT delay treatment waiting for imaging.</div>
      </div>

      <div style={sL(T.green)}>PERC Rule — Rule Out Without Testing</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        <div style={{ fontSize: 11.5, color: T.muted, marginBottom: 10 }}>If pre-test probability is LOW and ALL 8 criteria are met → PE excluded without further testing</div>
        {PERC_ITEMS.map(item => (
          <div key={item.id} style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 7, cursor: "pointer" }}
            onClick={() => toggle(setPerc, item.id)}>
            <div style={checkBox(perc[item.id], T.green)}>{perc[item.id] && "✓"}</div>
            <div style={{ fontSize: 12, color: perc[item.id] ? T.white : T.muted }}>{item.label}</div>
          </div>
        ))}
        <div style={dv} />
        <div style={{ ...aBox(percAll ? T.green : T.gold, 0) }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: percAll ? T.green : T.gold, marginBottom: 2 }}>
            {percAll ? "✓ PERC Negative — PE excluded (low pre-test probability)" : `${percCount} / 8 criteria met${percCount < 8 ? " — PERC not negative" : ""}`}
          </div>
          {!percAll && <div style={{ fontSize: 11.5, color: T.muted }}>All 8 must be met to use PERC rule. Proceed to Wells + D-dimer.</div>}
        </div>
      </div>

      <div style={sL()}>Wells Criteria Calculator</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        {WELLS_ITEMS.map(item => (
          <div key={item.id} style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8, cursor: "pointer" }}
            onClick={() => toggle(setWells, item.id)}>
            <div style={checkBox(wells[item.id])}>{wells[item.id] && "✓"}</div>
            <div style={{ flex: 1, fontSize: 12, color: wells[item.id] ? T.white : T.muted }}>{item.label}</div>
            <div style={{ fontFamily: T.mono, fontSize: 12, color: wells[item.id] ? T.teal : T.dim }}>+{item.pts}</div>
          </div>
        ))}
        <div style={dv} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: T.white }}>Wells Score</span>
          <span style={{ fontFamily: T.mono, fontSize: 22, fontWeight: 800, color: wellsScore > 4 ? T.coral : T.gold }}>{wellsScore.toFixed(1)}</span>
        </div>
        <div style={{ ...aBox(wellsRisk.color, 0), marginTop: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: wellsRisk.color, marginBottom: 2 }}>{wellsRisk.label}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{wellsRisk.action}</div>
        </div>
      </div>

      <div style={sL(T.teal)}>D-Dimer Thresholds</div>
      <div style={{ ...card({ marginBottom: 12 }) }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
          <input value={age} onChange={e => setAge(e.target.value)} placeholder="Patient age" type="number"
            style={{ ...inp, flex: 1, fontSize: 13 }} />
          <span style={{ fontSize: 12, color: T.muted, flexShrink: 0 }}>years</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { label: "Standard threshold",                val: "500 mcg/L (< 500 = negative)",               color: T.teal },
            { label: "Age-adjusted (age > 50)",           val: ageAdj ? `${ageAdj} mcg/L (age × 10)` : "Enter age above", color: T.gold },
            { label: "YEARS algorithm (0 YEARS criteria)", val: "< 1,000 mcg/L rules out PE",                color: T.purple },
          ].map(({ label, val, color }) => (
            <div key={label} style={{ ...G({ borderRadius: 9 }), padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11.5, color: T.muted }}>{label}</span>
              <span style={{ fontFamily: T.mono, fontSize: 12, color, fontWeight: 600 }}>{val}</span>
            </div>
          ))}
        </div>
        <div style={{ ...aBox(T.gold, 0), marginTop: 10 }}>
          <div style={{ fontSize: 11.5, color: T.muted }}>D-dimer is elevated in pregnancy, malignancy, sepsis, post-op, age, and heart failure — low specificity. Use only in low pre-test probability patients.</div>
        </div>
      </div>

      <div style={sL(T.coral)}>Imaging Selection</div>
      {[
        { mod: "CT Pulmonary Angiography (CT-PA)",  color: T.blue,   detail: "First-line definitive imaging · Sensitivity 83–100% · Specificity 96% · Look for saddle embolus, bilateral PE, RV/LV ratio > 0.9" },
        { mod: "Bedside Echo (POCUS)",              color: T.teal,   detail: "For hemodynamically unstable patients who cannot go to CT · McConnell's sign and D-sign support PE · RV strain pattern" },
        { mod: "V/Q Scan",                          color: T.gold,   detail: "Preferred when CT-PA contraindicated (renal failure, contrast allergy, pregnancy) · High probability scan confirms PE" },
        { mod: "Lower Extremity Duplex US",         color: T.purple, detail: "DVT found in 70% of PE patients · DVT alone confirms VTE and initiates anticoagulation · cannot diagnose PE directly" },
      ].map(({ mod, color, detail }) => (
        <div key={mod} style={{ ...G(), padding: "11px 13px", marginBottom: 8, borderLeft: `3px solid ${color}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 3 }}>{mod}</div>
          <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{detail}</div>
        </div>
      ))}
    </div>
  );

  // ── TAB 2: TREATMENT ──────────────────────────────────────────────────────
  const Tab2 = (
    <div>
      <div style={sL()}>Treatment Decision by Risk Tier</div>
      {[
        { risk: "MASSIVE PE", color: T.coral, bg: "rgba(244,63,94,0.08)",
          steps: [
            { label: "Start UFH immediately",                detail: "80 units/kg IV bolus → 18 units/kg/h infusion — stop if surgical/CDT planned" },
            { label: "Systemic tPA (if no absolute CI)",     detail: "Alteplase 100mg IV over 2h · If arrest: 50mg IV push → continue CPR × 90 min" },
            { label: "If absolute CI to lytics",             detail: "Surgical embolectomy (cardiac surgery STAT) or catheter embolectomy" },
            { label: "If hemodynamically unstable",          detail: "VA-ECMO as bridge · vasopressor: norepinephrine 0.1–0.5 mcg/kg/min · avoid aggressive IVF (worsens RV failure)" },
          ] },
        { risk: "SUBMASSIVE — Intermediate-High", color: T.amber, bg: "rgba(251,146,60,0.08)",
          steps: [
            { label: "Anticoagulate immediately",            detail: "UFH preferred (reversible if escalation needed) · 80 units/kg bolus → 18 units/kg/h" },
            { label: "PERT consult (if available)",          detail: "Pulmonary Embolism Response Team — multidisciplinary decision making" },
            { label: "Monitor for clinical deterioration",   detail: "If hemodynamics worsen: consider systemic lytics or CDT" },
            { label: "CDT consideration",                    detail: "Catheter-directed thrombolysis (24mg tPA over 24h) — lower bleeding risk than systemic" },
          ] },
        { risk: "LOW RISK / SUBMASSIVE-LOW", color: T.green, bg: "rgba(34,197,94,0.07)",
          steps: [
            { label: "DOAC preferred",                       detail: "Rivaroxaban 15mg BID × 21d → 20mg daily · or Apixaban 10mg BID × 7d → 5mg BID" },
            { label: "Heparin bridge if DOAC unavailable",   detail: "Enoxaparin 1mg/kg SQ q12h or fondaparinux · then warfarin bridge to therapeutic INR" },
            { label: "Outpatient treatment (sPESI = 0)",     detail: "If reliable follow-up, no hypoxia, tolerating PO, no social barriers · discharge with DOAC + 5-day follow-up" },
          ] },
      ].map(({ risk, color, bg, steps }) => (
        <div key={risk} style={{ ...card({ marginBottom: 12, background: bg, borderColor: color + "40" }) }}>
          <div style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 10 }}>{risk}</div>
          {steps.map(({ label, detail }, i) => (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: color + "22", border: `1px solid ${color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color, flexShrink: 0 }}>{i + 1}</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.white, marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{detail}</div>
              </div>
            </div>
          ))}
        </div>
      ))}

      <div style={sL(T.teal)}>Anticoagulation Dosing Reference</div>
      {[
        { drug: "UFH (Unfractionated Heparin)",  dose: "80 units/kg IV bolus → 18 units/kg/h infusion",                           note: "Preferred for massive PE — reversible with protamine · use weight-based nomogram · target aPTT 60–100 sec", color: T.coral },
        { drug: "Enoxaparin (Lovenox)",          dose: "1 mg/kg SQ q 12h (treatment dose)",                                       note: "Avoid if CrCl < 30 mL/min · reduce to 1mg/kg q 24h if CrCl 15–30 · check anti-Xa 4h after 2nd dose if obese or renal", color: T.teal },
        { drug: "Rivaroxaban (Xarelto)",         dose: "15 mg BID with food × 21d → 20 mg daily",                                 note: "No bridging needed · avoid in severe renal failure (CrCl < 15) · avoid in antiphospholipid syndrome", color: T.blue },
        { drug: "Apixaban (Eliquis)",            dose: "10 mg BID × 7d → 5 mg BID",                                               note: "No bridging needed · preferred in CKD · avoid in antiphospholipid syndrome", color: T.blue },
        { drug: "Fondaparinux",                  dose: "5 mg (< 50kg) / 7.5 mg (50–100kg) / 10 mg (> 100kg) SQ daily",           note: "Avoid if CrCl < 30 · HIT-safe (no cross-reactivity)", color: T.purple },
      ].map(({ drug, dose, note, color }) => (
        <div key={drug} style={{ ...G(), padding: "11px 13px", marginBottom: 8, borderLeft: `3px solid ${color}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 3 }}>{drug}</div>
          <div style={{ fontFamily: T.mono, fontSize: 11.5, color: T.white, marginBottom: 4 }}>{dose}</div>
          <div style={{ fontSize: 11, color: T.muted }}>{note}</div>
        </div>
      ))}

      <div style={sL(T.coral)}>Thrombolytic Contraindications (Alteplase)</div>
      <div style={{ display: "grid", gap: 10 }}>
        <div style={card({ background: "rgba(244,63,94,0.07)", borderColor: "rgba(244,63,94,0.3)" })}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.coral, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Absolute — Do NOT Give</div>
          {CI_LYTICS_ABS.map((c, i) => <div key={i} style={{ fontSize: 11.5, color: T.muted, display: "flex", gap: 7, marginBottom: 4 }}><span style={{ color: T.coral, flexShrink: 0 }}>✗</span>{c}</div>)}
        </div>
        <div style={card({ background: "rgba(245,158,11,0.07)", borderColor: "rgba(245,158,11,0.25)" })}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.gold, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Relative — Weigh Risk vs. Benefit</div>
          {CI_LYTICS_REL.map((c, i) => <div key={i} style={{ fontSize: 11.5, color: T.muted, display: "flex", gap: 7, marginBottom: 4 }}><span style={{ color: T.gold, flexShrink: 0 }}>⚠</span>{c}</div>)}
        </div>
      </div>
    </div>
  );

  // ── TAB 3: MONITORING ─────────────────────────────────────────────────────
  const Tab3 = (
    <div>
      <div style={sL()}>Hemodynamic Targets</div>
      {[
        { target: "MAP",      val: "≥ 65 mmHg",      note: "Higher if baseline hypertensive", color: T.green },
        { target: "HR",       val: "< 100 bpm",       note: "Tachycardia reflects ongoing RV strain", color: T.teal },
        { target: "SpO₂",    val: "≥ 94%",            note: "Supplemental O₂ · HFNC if needed · avoid intubation if possible (positive pressure worsens RV)", color: T.blue },
        { target: "RVSP",     val: "Trending down",   note: "Serial echo or clinical improvement", color: T.purple },
        { target: "Troponin", val: "Trending down",   note: "Peak troponin correlates with RV injury severity", color: T.gold },
      ].map(({ target, val, note, color }) => (
        <div key={target} style={{ ...G(), padding: "10px 13px", marginBottom: 7, display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 700, color, minWidth: 80, flexShrink: 0 }}>{target}</div>
          <div style={{ fontFamily: T.mono, fontSize: 13, color: T.white, minWidth: 90, flexShrink: 0 }}>{val}</div>
          <div style={{ fontSize: 11, color: T.muted }}>{note}</div>
        </div>
      ))}

      <div style={{ ...aBox(T.coral, 14) }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: T.coral, marginBottom: 3 }}>⚠ Avoid in RV Failure</div>
        <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.5 }}>
          Large volume IVF boluses (worsen RV dilation) · Positive pressure ventilation if possible (reduces preload, worsens RV) · Vasodilators (worsen hypotension) · Aggressive sedation in spontaneously breathing patient
        </div>
      </div>

      <div style={sL(T.gold)}>Post-Thrombolytic Monitoring</div>
      {[
        { time: "0–2 hours",   action: "Continuous BP, HR, SpO₂ q 15 min · recheck echo at 2h after tPA",                                               color: T.coral },
        { time: "2–6 hours",   action: "Hemodynamic reassessment · if no improvement → escalate (repeat tPA vs. surgical)",                              color: T.amber },
        { time: "6–24 hours",  action: "Transition to anticoagulation 12h after tPA completion if stable · UFH (no bolus, infusion only)",               color: T.gold },
        { time: "24–48 hours", action: "Recheck troponin, BNP · repeat echo · consider transition to DOAC if stable",                                    color: T.teal },
      ].map(({ time, action, color }) => (
        <div key={time} style={{ ...G(), padding: "10px 13px", marginBottom: 7, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div style={{ fontFamily: T.mono, fontSize: 11.5, fontWeight: 700, color, minWidth: 85, flexShrink: 0 }}>{time}</div>
          <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{action}</div>
        </div>
      ))}

      <div style={sL(T.teal)}>Escalation Triggers</div>
      {["SBP < 90 or new vasopressor requirement after initial treatment",
        "Worsening hypoxia despite O₂ — prepare for intubation (cautious) or ECMO",
        "New cardiac arrest — 50mg tPA IV push if lytics not yet given",
        "Echo showing worsening RV dilation or new RV failure signs",
        "Troponin rising at 6h after treatment"].map((t, i) => (
        <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 8, marginBottom: 6, lineHeight: 1.4 }}>
          <span style={{ color: T.coral, flexShrink: 0 }}>⚠</span>{t}
        </div>
      ))}

      <div style={sL(T.purple)}>Disposition & Long-Term</div>
      <div style={{ ...card() }}>
        {[
          { label: "ICU",                       detail: "Massive PE · submassive with deterioration · post-thrombolytics · vasopressor-dependent" },
          { label: "Step-Down",                 detail: "Submassive-high on UFH infusion · post-CDT · close monitoring required" },
          { label: "Telemetry Floor",           detail: "Submassive-low · stable intermediate-risk · close observation" },
          { label: "Outpatient",                detail: "Low-risk with sPESI = 0 · DOAC initiated · reliable follow-up in 5 days · no hypoxia" },
          { label: "Hypercoagulability workup", detail: "Unprovoked PE → thrombophilia panel (factor V Leiden, prothrombin mutation, antiphospholipid, protein C/S, antithrombin)" },
          { label: "Anticoag duration",         detail: "Provoked: 3 months · Unprovoked first episode: ≥ 3 months then reassess · Recurrent or cancer-associated: indefinite" },
        ].map(({ label, detail }, i) => (
          <div key={i} style={{ display: "flex", gap: 10, paddingBottom: 7, marginBottom: 7, borderBottom: i < 5 ? `1px solid ${T.border}` : "none" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.purple, minWidth: 110, flexShrink: 0 }}>{label}</div>
            <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{detail}</div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: `radial-gradient(ellipse 70% 40% at 15% 0%, rgba(59,130,246,0.09) 0%, transparent 60%), radial-gradient(ellipse 50% 35% at 85% 95%, rgba(244,63,94,0.08) 0%, transparent 55%), ${T.bg}`, fontFamily: T.sans, color: T.white, paddingBottom: 80 }}>

      <div style={{ padding: "20px 20px 0" }}>
        {onBack && (
          <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", color: T.teal, fontSize: 13, fontFamily: T.sans, cursor: "pointer", padding: "4px 0", marginBottom: 16 }}>
            ← Critical Protocols
          </button>
        )}
        <div>
          <span style={pill("linear-gradient(135deg,#3b82f6,#1e3a8a)")}>❤️ Cardiac / Pulm</span>
          <span style={pill("linear-gradient(135deg,#0d9488,#065f46)")}>ESC 2019 / AHA</span>
        </div>
        <h1 style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 700, margin: "0 0 4px", lineHeight: 1.15 }}>Massive / Submassive PE</h1>
        <p style={{ color: T.muted, fontSize: 12, margin: "0 0 20px" }}>sPESI calculator · PERC + Wells · Thrombolytic decision tree · Anticoagulation dosing</p>
      </div>

      <div style={{ display: "flex", gap: 4, padding: "0 20px", marginBottom: 18, overflowX: "auto", scrollbarWidth: "none" }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            style={{ padding: "7px 15px", borderRadius: 9, border: `1.5px solid ${tab === i ? T.blue : T.border}`, background: tab === i ? "rgba(59,130,246,0.14)" : T.glass, color: tab === i ? T.blue : T.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.sans, whiteSpace: "nowrap", transition: "all 0.18s", backdropFilter: "blur(8px)" }}>
            {t}
          </button>
        ))}
      </div>

      <div style={{ padding: "0 20px" }}>
        {tab === 0 && Tab0}
        {tab === 1 && Tab1}
        {tab === 2 && Tab2}
        {tab === 3 && Tab3}
      </div>
    </div>
  );
}