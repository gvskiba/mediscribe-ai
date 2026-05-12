import { useState } from "react";
import { useNavigate } from "react-router-dom";

(() => {
  if (typeof document === "undefined") return;
  const l = document.createElement("link");
  l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap";
  document.head.appendChild(l);
})();

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
const inp  = { padding: "9px 12px", background: T.glassMid, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 13, fontFamily: T.mono, fontWeight: 600, outline: "none" };

const CAUSES_DATA = [
  {
    id: "siadh", label: "SIADH", color: T.blue,
    criteria: "Hypotonic hyponatremia · urine Na > 40 · urine Osm > 100 · euvolemic · no diuretics · no adrenal/thyroid disease",
    causes: "CNS disease (stroke · SAH · meningitis) · pulmonary disease (pneumonia · TB · COPD) · drugs (SSRIs · carbamazepine · cyclophosphamide · NSAIDs · PPIs · opioids) · malignancy (small cell lung · head/neck) · surgery · pain",
    tx: "Fluid restriction 500–800 mL/day (first-line) · Salt tablets (1–3g TID) · Loop diuretics · Vaptans (tolvaptan) for severe SIADH",
  },
  {
    id: "hypovol", label: "Hypovolemic", color: T.amber,
    criteria: "Hypotonic hyponatremia · urine Na < 20 (extrarenal) or > 40 (renal loss/diuretic) · signs of volume depletion · BUN/Cr elevated",
    causes: "GI losses (vomiting · diarrhea) · sweating · burns · diuretics (thiazides >> loop) · cerebral salt wasting · adrenal insufficiency",
    tx: "Isotonic saline (0.9% NS) to restore volume · remove diuretic · fludrocortisone for CSW/AI · Na will correct as volume restores",
  },
  {
    id: "hypervol", label: "Hypervolemic", color: T.teal,
    criteria: "Hypotonic hyponatremia · urine Na < 20 · edema · ascites · elevated JVP · low albumin",
    causes: "Heart failure · cirrhosis · nephrotic syndrome · advanced renal failure",
    tx: "Fluid restriction · loop diuretics · treat underlying condition (diuresis for HF · TIPS for cirrhosis) · vaptans controversial in cirrhosis",
  },
  {
    id: "hypo_thyroid", label: "Hypothyroidism", color: T.purple,
    criteria: "Can mimic SIADH · euvolemic · check TSH routinely in new hyponatremia",
    causes: "Primary hypothyroidism · pituitary failure (secondary) · Hashimoto's",
    tx: "Levothyroxine replacement · Na corrects slowly with thyroid replacement",
  },
  {
    id: "adrenal", label: "Adrenal Insufficiency", color: T.gold,
    criteria: "Hypovolemic or euvolemic · urine Na high (aldosterone deficiency) · check cortisol · may have hyperkalemia (primary AI)",
    causes: "Primary AI (Addison's) · secondary AI (pituitary) · abrupt steroid withdrawal",
    tx: "Hydrocortisone 100 mg IV → stress dose replacement · see AdrenalCrisisHub · Na corrects with cortisol replacement",
  },
  {
    id: "pseudo", label: "Pseudohyponatremia", color: T.muted.replace("0.55","1"),
    criteria: "Normal or elevated measured osmolality · presence of osmotically active substances · triglycerides or proteins do NOT lower true Na",
    causes: "Severe hyperlipidemia (triglycerides > 1500) · severe hyperproteinemia (multiple myeloma · IV immunoglobulin) · hyperglycemia (calculate corrected Na)",
    tx: "Treat underlying condition · no Na correction needed for pseudohyponatremia",
  },
];

export default function HyponatremiaHub({ onBack }) {
  const navigate = useNavigate();
  const handleBack = () => onBack ? onBack() : navigate("/CriticalProtocolsPage");

  const [tab, setTab]   = useState(0);
  const [na, setNa]     = useState("");
  const [wt, setWt]     = useState("");
  const [sex, setSex]   = useState("M");
  const [uNa, setUNa]   = useState("");
  const [uOsm, setUOsm] = useState("");
  const [sOsm, setSOsm] = useState("");
  const [gluc, setGluc] = useState("");
  const [cause, setCause] = useState(null);
  const TABS = ["Recognition", "Workup", "Treatment", "Monitoring"];

  const naNum   = parseFloat(na);
  const wtNum   = parseFloat(wt);
  const glucNum = parseFloat(gluc);
  const uNaNum  = parseFloat(uNa);
  const uOsmNum = parseFloat(uOsm);
  const sOsmNum = parseFloat(sOsm);

  const sev = isNaN(naNum) || na === "" ? null
    : naNum < 120 ? { label: "Severe", color: T.coral, risk: "Cerebral herniation · seizures · respiratory arrest", action: "3% NaCl bolus immediately if symptomatic" }
    : naNum < 125 ? { label: "Severe-Moderate", color: T.amber, risk: "Seizures · altered mentation · high herniation risk", action: "3% NaCl + urgent nephrology · ICU" }
    : naNum < 130 ? { label: "Moderate", color: T.gold, risk: "Neurological symptoms likely", action: "3% NaCl if symptomatic · fluid restrict if asymptomatic" }
    : naNum < 135 ? { label: "Mild", color: T.teal, risk: "Usually asymptomatic", action: "Treat underlying cause · fluid restriction if SIADH" }
    : { label: "Normal", color: T.green, risk: "None", action: "No specific treatment needed" };

  // Corrected Na for hyperglycemia
  const corrNa = !isNaN(naNum) && !isNaN(glucNum) && gluc !== "" && na !== ""
    ? (naNum + 1.6 * ((glucNum - 100) / 100)).toFixed(1) : null;

  // Adrogue-Madias formula for 3% NaCl
  const tbw = !isNaN(wtNum) && wt !== "" ? (sex === "M" ? wtNum * 0.6 : wtNum * 0.5) : null;
  const mlPerMeq = tbw !== null && !isNaN(naNum) && na !== "" && naNum < 514
    ? ((tbw + 1) * 1000 / (514 - naNum)).toFixed(0) : null;
  const bolus100ml = tbw !== null && !isNaN(naNum) && na !== "" && naNum < 514
    ? (100 * (514 - naNum) / ((tbw + 1) * 1000)).toFixed(2) : null;

  // Urine Na interpretation
  const uNaInterp = !isNaN(uNaNum) && uNa !== ""
    ? uNaNum < 20 ? { label: "< 20 — Low Urine Na", interp: "Suggests hypovolemia · extrarenal Na loss (vomiting · diarrhea · burns) · low effective arterial volume (HF · cirrhosis)", color: T.gold }
    : uNaNum > 40 ? { label: "> 40 — High Urine Na", interp: "Suggests SIADH · hypothyroidism · adrenal insufficiency · diuretic use · reset osmostat · renal salt wasting", color: T.coral }
    : { label: "20–40 — Indeterminate", interp: "Clinical context required · may overlap between SIADH and hypovolemia", color: T.amber }
    : null;

  const selCause = CAUSES_DATA.find(c => c.id === cause);

  // ── TAB 0: RECOGNITION ──────────────────────────────────────────────────
  const T0 = (
    <div>
      <div style={aBox(T.coral, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, marginBottom: 2 }}>Symptomatic Hyponatremia = Neurological Emergency</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>The brain cannot tolerate rapid osmotic shifts. Cerebral edema causes herniation. Overcorrection causes osmotic demyelination syndrome (ODS). The rate of correction is as important as the absolute sodium value.</div>
      </div>

      <div style={sL()}>Na⁺ Severity + Symptom Classifier</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
          <input value={na} onChange={e => setNa(e.target.value)} placeholder="Serum Na⁺ (mEq/L)" type="number" step="1"
            style={{ ...inp, flex: 1, fontSize: 18, fontWeight: 800 }} />
          <span style={{ fontSize: 13, color: T.muted }}>mEq/L</span>
        </div>
        {sev && (
          <div style={aBox(sev.color, 6)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: sev.color }}>{sev.label} Hyponatremia</span>
              <span style={{ ...tag(sev.color) }}>Na⁺ {na}</span>
            </div>
            <div style={{ fontSize: 11.5, color: T.muted, marginBottom: 3 }}><span style={{ color: sev.color, fontWeight: 600 }}>Risk: </span>{sev.risk}</div>
            <div style={{ fontSize: 11.5, color: sev.color, fontWeight: 600 }}>→ {sev.action}</div>
          </div>
        )}
      </div>

      {[
        { range: "< 120",   label: "Severe",           color: T.coral },
        { range: "120–124", label: "Severe-Moderate",  color: T.amber },
        { range: "125–129", label: "Moderate",         color: T.gold },
        { range: "130–134", label: "Mild",             color: T.teal },
        { range: "135–145", label: "Normal",           color: T.green },
      ].map(({ range, label, color }) => (
        <div key={range} style={{ ...G({ borderRadius: 9 }), padding: "8px 12px", marginBottom: 5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 700, color }}>{range} mEq/L</span>
          <span style={{ ...tag(color), fontSize: 10 }}>{label}</span>
        </div>
      ))}

      <div style={sL()}>Symptom Spectrum</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
        {[
          { sev: "Mild", color: T.teal, syms: ["Nausea", "Headache", "Malaise", "Fatigue", "Cognitive slowing"] },
          { sev: "Moderate", color: T.gold, syms: ["Confusion", "Agitation", "Weakness", "Gait instability", "Personality changes"] },
          { sev: "Severe", color: T.coral, syms: ["Seizures", "Coma", "Respiratory arrest", "Brainstem herniation", "Posturing"] },
        ].map(({ sev: s, color, syms }) => (
          <div key={s} style={card({ padding: "11px 12px", borderLeft: `3px solid ${color}` })}>
            <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 7 }}>{s}</div>
            {syms.map((sym, i) => <div key={i} style={{ fontSize: 11, color: T.muted, marginBottom: 3, display: "flex", gap: 5 }}><span style={{ color }}>●</span>{sym}</div>)}
          </div>
        ))}
      </div>

      <div style={sL(T.gold)}>Corrected Na⁺ for Hyperglycemia</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.07em" }}>Measured Na⁺</div>
            <input value={na} onChange={e => setNa(e.target.value)} placeholder="Na (mEq/L)" type="number" style={{ ...inp, width: "100%", boxSizing: "border-box" }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.07em" }}>Glucose (mg/dL)</div>
            <input value={gluc} onChange={e => setGluc(e.target.value)} placeholder="Glucose" type="number" style={{ ...inp, width: "100%", boxSizing: "border-box" }} />
          </div>
        </div>
        {corrNa && (
          <div style={aBox(T.gold, 0)}>
            <div style={{ fontSize: 11, color: T.muted, marginBottom: 2 }}>Corrected Na⁺ = Na + 1.6 × ((Glucose − 100) / 100)</div>
            <div style={{ fontFamily: T.mono, fontSize: 20, fontWeight: 800, color: T.gold }}>{corrNa} mEq/L</div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 3 }}>True Na⁺ when hyperglycemia is treated — if corrected Na is normal, hyponatremia is due to glucose alone</div>
          </div>
        )}
      </div>

      <div style={aBox(T.coral, 0)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, marginBottom: 4 }}>⚠ Osmotic Demyelination Syndrome (ODS) — Pontine Myelinolysis</div>
        <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.5 }}>
          Caused by TOO RAPID correction of chronic hyponatremia. Neurons adapt to chronic hyponatremia — rapid correction causes osmotic shift → myelin sheath destruction. Irreversible. Prevention is the only treatment.
        </div>
        <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 5 }}>
          <span style={tag(T.coral)}>Max correction 8–10 mEq/L per 24h</span>
          <span style={tag(T.gold)}>Max correction 18 mEq/L per 48h</span>
          <span style={tag(T.amber)}>Symptoms: dysarthria · dysphagia · paraparesis · locked-in</span>
        </div>
      </div>
    </div>
  );

  // ── TAB 1: WORKUP ────────────────────────────────────────────────────────
  const T1 = (
    <div>
      <div style={aBox(T.blue, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.blue, marginBottom: 2 }}>3-Step Diagnostic Approach</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>Step 1: Is it truly hypotonic? Step 2: What is the volume status? Step 3: What is the urine Na and osmolality?</div>
      </div>

      <div style={sL()}>Urine Sodium Interpreter</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
          <input value={uNa} onChange={e => setUNa(e.target.value)} placeholder="Urine Na (mEq/L)" type="number" style={{ ...inp, flex: 1 }} />
          <span style={{ fontSize: 12, color: T.muted }}>mEq/L</span>
        </div>
        {uNaInterp && (
          <div style={aBox(uNaInterp.color, 0)}>
            <div style={{ fontSize: 12, fontWeight: 700, color: uNaInterp.color, marginBottom: 3 }}>{uNaInterp.label}</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>{uNaInterp.interp}</div>
          </div>
        )}
      </div>

      <div style={sL(T.teal)}>Volume Status Assessment — Clinical</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 14 }}>
        {[
          { label: "Hypovolemic", color: T.gold, signs: ["Dry mucous membranes", "Flat JVP", "Tachycardia", "Orthostatic hypotension", "Skin turgor poor", "BUN/Cr > 20:1"] },
          { label: "Euvolemic", color: T.teal, signs: ["Normal BP/HR", "Normal JVP", "No edema", "Normal skin turgor", "Suggests SIADH", "Check TSH/cortisol"] },
          { label: "Hypervolemic", color: T.blue, signs: ["Peripheral edema", "Elevated JVP", "Pulmonary rales", "Ascites", "S3 gallop (HF)", "Low albumin"] },
        ].map(({ label, color, signs }) => (
          <div key={label} style={card({ padding: "11px 12px", borderLeft: `3px solid ${color}` })}>
            <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 7 }}>{label}</div>
            {signs.map((s, i) => <div key={i} style={{ fontSize: 10.5, color: T.muted, marginBottom: 3, display: "flex", gap: 4 }}><span style={{ color }}>●</span>{s}</div>)}
          </div>
        ))}
      </div>

      <div style={sL()}>Select Suspected Cause</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
        {CAUSES_DATA.map(c => (
          <button key={c.id} onClick={() => setCause(cause === c.id ? null : c.id)}
            style={{ padding: "6px 12px", borderRadius: 8, border: `1.5px solid ${cause === c.id ? c.color : T.border}`, background: cause === c.id ? c.color + "20" : T.glass, color: cause === c.id ? c.color : T.muted, fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: T.sans, transition: "all 0.15s" }}>
            {c.label}
          </button>
        ))}
      </div>

      {selCause && (
        <div style={{ ...card({ border: `1.5px solid ${selCause.color}55`, marginBottom: 14 }) }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: selCause.color, marginBottom: 8 }}>{selCause.label}</div>
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>Diagnostic Criteria</div>
            <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{selCause.criteria}</div>
          </div>
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>Causes</div>
            <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{selCause.causes}</div>
          </div>
          <div style={aBox(selCause.color, 0)}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: selCause.color, marginBottom: 2 }}>Treatment</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>{selCause.tx}</div>
          </div>
        </div>
      )}

      <div style={sL(T.gold)}>Essential Labs</div>
      <div style={{ ...card() }}>
        {[
          { test: "Serum osmolality",    why: "Confirm true hypotonic hyponatremia (< 280 mOsm/kg) vs pseudohyponatremia" },
          { test: "Urine osmolality",    why: "< 100 = dilutional (primary polydipsia / beer potomania) · > 100 suggests ADH effect (SIADH · hypovolemia)" },
          { test: "Urine Na",            why: "< 20 = hypovolemia/low effective volume · > 40 = SIADH/adrenal/renal loss" },
          { test: "BMP",                 why: "Glucose (corrected Na) · K⁺ (AI) · creatinine (renal failure) · BUN/Cr ratio" },
          { test: "TSH",                 why: "Hypothyroidism mimics SIADH · check routinely in new euvolemic hyponatremia" },
          { test: "Cortisol / cosyntropin", why: "Adrenal insufficiency · especially if hypovolemic or hemodynamically unstable" },
          { test: "Uric acid",           why: "Low in SIADH (increased renal excretion) · normal/high in hypovolemia" },
          { test: "Serum protein / lipids", why: "Rule out pseudohyponatremia (severe hyperlipidemia or hyperproteinemia)" },
        ].map(({ test, why }, i) => (
          <div key={test} style={{ display: "flex", gap: 10, paddingBottom: 6, marginBottom: 6, borderBottom: i < 7 ? `1px solid ${T.border}` : "none" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.gold, minWidth: 170, flexShrink: 0 }}>{test}</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>{why}</div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── TAB 2: TREATMENT ────────────────────────────────────────────────────
  const T2 = (
    <div>
      <div style={{ ...G({ borderRadius: 14, border: `2px solid ${T.coral}55`, background: "rgba(244,63,94,0.08)", marginBottom: 16 }), padding: "14px" }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: T.coral, marginBottom: 4 }}>⚠ Maximum Correction Limits</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[
            { label: "8–10 mEq/L per 24h", note: "Standard max", color: T.coral },
            { label: "18 mEq/L per 48h",   note: "48h limit", color: T.amber },
            { label: "Chronic: 6–8 mEq/L", note: "Unknown duration → more cautious", color: T.gold },
          ].map(({ label, note, color }) => (
            <div key={label} style={{ ...G({ borderRadius: 9 }), padding: "8px 12px" }}>
              <div style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 700, color }}>{label}</div>
              <div style={{ fontSize: 10, color: T.dim }}>{note}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={sL()}>3% NaCl Dose Calculator (Symptomatic / Severe)</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <div style={{ flex: 2 }}>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.07em" }}>Na⁺ (mEq/L)</div>
            <input value={na} onChange={e => setNa(e.target.value)} placeholder="130" type="number" style={{ ...inp, width: "100%", boxSizing: "border-box" }} />
          </div>
          <div style={{ flex: 2 }}>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.07em" }}>Weight (kg)</div>
            <input value={wt} onChange={e => setWt(e.target.value)} placeholder="70" type="number" style={{ ...inp, width: "100%", boxSizing: "border-box" }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.07em" }}>Sex</div>
            <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", border: `1px solid ${T.border}`, height: 39 }}>
              {["M", "F"].map(s => (
                <button key={s} onClick={() => setSex(s)}
                  style={{ flex: 1, background: sex === s ? T.blue + "30" : T.glass, color: sex === s ? T.blue : T.muted, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: T.mono, transition: "all 0.15s" }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
        {mlPerMeq && bolus100ml && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div style={aBox(T.coral, 0)}>
              <div style={{ fontSize: 10, color: T.muted, marginBottom: 2 }}>mL 3% NaCl to raise Na⁺ by 1 mEq/L</div>
              <div style={{ fontFamily: T.mono, fontSize: 20, fontWeight: 800, color: T.coral }}>{mlPerMeq} mL</div>
            </div>
            <div style={aBox(T.gold, 0)}>
              <div style={{ fontSize: 10, color: T.muted, marginBottom: 2 }}>Na⁺ rise from 100 mL bolus</div>
              <div style={{ fontFamily: T.mono, fontSize: 20, fontWeight: 800, color: T.gold }}>{bolus100ml} mEq/L</div>
            </div>
          </div>
        )}
      </div>

      <div style={sL(T.coral)}>Severe Symptomatic (Seizures / Coma / Herniation)</div>
      <div style={{ ...card({ marginBottom: 12, background: "rgba(244,63,94,0.07)", borderColor: "rgba(244,63,94,0.3)" }) }}>
        {[
          { step: "100 mL 3% NaCl IV over 10 min", note: "Bolus immediately — repeat up to 3× until symptoms resolve", color: T.coral },
          { step: "Target: raise Na⁺ by 4–6 mEq/L",  note: "This is typically enough to stop seizures / reduce herniation · then switch to slower controlled correction", color: T.amber },
          { step: "After symptom control: slower rate", note: "1–2 mEq/L per hour until Na⁺ ≥ 120 · then stay within 8–10 mEq/L per 24h total", color: T.gold },
          { step: "Check Na⁺ every 2h",               note: "Adjust rate · risk of overcorrection highest in beer potomania and primary polydipsia (rapidly reversible cause)", color: T.teal },
        ].map(({ step, note, color }, i) => (
          <div key={i} style={{ display: "flex", gap: 10, paddingBottom: 7, marginBottom: 7, borderBottom: i < 3 ? `1px solid ${T.border}` : "none" }}>
            <div style={{ fontFamily: T.mono, fontSize: 11.5, fontWeight: 700, color, minWidth: 20 }}>{i + 1}.</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 2 }}>{step}</div>
              <div style={{ fontSize: 11.5, color: T.muted }}>{note}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={sL(T.gold)}>Moderate Symptomatic (Confusion / Nausea / Vomiting)</div>
      <div style={{ ...card({ marginBottom: 12 }) }}>
        {["3% NaCl infusion at 0.5–2 mL/kg/h (typically 30–50 mL/h) · or 150 mL 3% over 20 min × 1",
          "Target: raise Na⁺ by 4–6 mEq/L over first 6h",
          "Check Na⁺ q 2–4h · adjust rate based on response",
          "Total correction ≤ 8–10 mEq/L per 24h"].map((s, i) => (
          <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 8, marginBottom: 5 }}>
            <span style={{ color: T.gold }}>▸</span>{s}
          </div>
        ))}
      </div>

      <div style={sL(T.teal)}>Treatment by Etiology</div>
      {[
        { etio: "SIADH", tx: "Fluid restriction 500–800 mL/day (first-line) · Salt tablets 1–3g TID · loop diuretics (furosemide + salt) · Vaptans (tolvaptan 15 mg/day — use only in hospital, risk of rapid overcorrection) · treat underlying cause", color: T.blue },
        { etio: "Hypovolemic", tx: "0.9% NS to restore volume · Na will correct as volume replaced · caution: if SIADH later develops (common in post-op), Na may over-correct — monitor closely", color: T.amber },
        { etio: "Hypervolemic (HF/Cirrhosis)", tx: "Fluid restriction + loop diuretics · treat underlying disease · vaptans controversial (tolvaptan hepatotoxic in cirrhosis) · avoid over-diuresis", color: T.teal },
        { etio: "Adrenal Insufficiency", tx: "Hydrocortisone 100 mg IV — Na will auto-correct · avoid 3% NaCl (over-correction risk very high when aldosterone restored) · see AdrenalCrisisHub", color: T.gold },
        { etio: "Hypothyroidism", tx: "Levothyroxine replacement · slow correction over days-weeks · 3% NaCl for acute symptomatic episodes only", color: T.purple },
        { etio: "Beer Potomania / Primary Polydipsia", tx: "Highest overcorrection risk — Na can rise rapidly when cause reversed · fluids stopped → concentrated urine → rapid Na rise · consider prophylactic desmopressin to slow correction · monitor q 2h", color: T.coral },
      ].map(({ etio, tx, color }) => (
        <div key={etio} style={{ ...G(), padding: "10px 13px", marginBottom: 7, borderLeft: `3px solid ${color}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 2 }}>{etio}</div>
          <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{tx}</div>
        </div>
      ))}

      <div style={sL(T.purple)}>Desmopressin (DDAVP) — Overcorrection Prevention</div>
      <div style={{ ...card() }}>
        <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.5, marginBottom: 8 }}>
          If Na⁺ is rising faster than 10 mEq/L per 24h → give DDAVP 2 mcg IV or SQ to slow or stop correction (⇧ ADH effect → water retention). Most useful in reversible causes (beer potomania · thiazide diuretics · hypovolemia corrected with saline).
        </div>
        <div style={aBox(T.purple, 0)}>
          <div style={{ fontFamily: T.mono, fontSize: 14, fontWeight: 700, color: T.purple }}>Desmopressin 2 mcg IV/SQ</div>
          <div style={{ fontSize: 11.5, color: T.muted, marginTop: 3 }}>Give 1–2 mcg q 8h to clamp ADH effect and prevent overcorrection · continue 3% NaCl at reduced rate if still symptomatic · monitor Na q 2h</div>
        </div>
      </div>
    </div>
  );

  // ── TAB 3: MONITORING ───────────────────────────────────────────────────
  const T3 = (
    <div>
      <div style={sL()}>Correction Rate Monitoring</div>
      {[
        { freq: "Every 2h",  items: "Serum Na⁺ during active 3% NaCl infusion · calculate rate of correction · adjust infusion accordingly", color: T.coral },
        { freq: "Every 4h",  items: "Na⁺ during slower correction phase · urine output · neurological assessment", color: T.gold },
        { freq: "Every 6h",  items: "Urine electrolytes (spot urine Na + Cr) if etiology unclear · adjust treatment strategy", color: T.teal },
        { freq: "Every 24h", items: "Electrolytes · BMP · reassess volume status · review 24h correction total against limits", color: T.green },
      ].map(({ freq, items, color }) => (
        <div key={freq} style={{ ...G(), padding: "9px 12px", marginBottom: 6, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div style={{ fontFamily: T.mono, fontSize: 11.5, fontWeight: 700, color, minWidth: 90, flexShrink: 0 }}>{freq}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{items}</div>
        </div>
      ))}

      <div style={sL(T.coral)}>High-Risk Overcorrection Scenarios</div>
      <div style={{ ...card({ background: "rgba(244,63,94,0.07)", borderColor: "rgba(244,63,94,0.3)", marginBottom: 14 }) }}>
        {["Beer potomania / low solute intake — urine can dilute rapidly when intake stops",
          "Primary polydipsia — when fluid restriction begins, urine concentrates rapidly",
          "Hypovolemia corrected with saline — once volume restored, ADH shuts off → rapid free water excretion",
          "Thiazide diuretic stopped — Na rapidly corrects when diuretic effect wanes",
          "Adrenal insufficiency treated with hydrocortisone — aldosterone effect restored → rapid Na rise"].map((r, i) => (
          <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 8, marginBottom: 5 }}>
            <span style={{ color: T.coral, flexShrink: 0 }}>⚠</span>{r}
          </div>
        ))}
        <div style={{ ...aBox(T.gold, 0), marginTop: 8 }}>
          <div style={{ fontSize: 11.5, color: T.muted }}>In these scenarios: check Na⁺ q 2h · have desmopressin ready · consider prophylactic DDAVP if Na rising faster than target</div>
        </div>
      </div>

      <div style={sL(T.gold)}>ODS Recognition — Too Late to Prevent, Must Recognize</div>
      {["Symptoms appear 1–6 days after overcorrection",
        "Initial improvement in encephalopathy → then NEW neurological deterioration",
        "Dysarthria · dysphagia · weakness · behavioral changes · locked-in syndrome (severe)",
        "MRI: T2 hyperintensity in pons (central pontine myelinolysis) or extrapontine areas",
        "No proven treatment · supportive care · some evidence for re-lowering Na with 5% dextrose + DDAVP if caught early"].map((s, i) => (
        <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 8, marginBottom: 5 }}>
          <span style={{ color: T.gold }}>●</span>{s}
        </div>
      ))}

      <div style={sL(T.purple)}>Disposition</div>
      <div style={{ ...card() }}>
        {[
          { level: "ICU",          detail: "Na⁺ < 120 mEq/L with symptoms · active seizures or coma · requiring 3% NaCl infusion · hemodynamic instability · need for q 2h Na⁺ checks" },
          { level: "Telemetry/Floor", detail: "Na⁺ 120–129 with mild-moderate symptoms · stable during slower correction · oral treatment established · reliable monitoring · clear etiology identified" },
          { level: "Observation",  detail: "Mild symptomatic Na⁺ 125–134 · workup underway · expected rapid correction (hypovolemia) · reliable outpatient follow-up plan" },
          { level: "Discharge",    detail: "Mild asymptomatic (Na⁺ ≥ 130) · cause identified and being treated (fluid restriction · thiazide stopped) · repeat labs in 24–48h arranged · nephrology outpatient if SIADH" },
        ].map(({ level, detail }, i) => (
          <div key={i} style={{ display: "flex", gap: 10, paddingBottom: 7, marginBottom: 7, borderBottom: i < 3 ? `1px solid ${T.border}` : "none" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.purple, minWidth: 120, flexShrink: 0 }}>{level}</div>
            <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{detail}</div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: `radial-gradient(ellipse 70% 40% at 15% 0%, rgba(59,130,246,0.09) 0%, transparent 60%), radial-gradient(ellipse 50% 35% at 85% 95%, rgba(244,63,94,0.07) 0%, transparent 55%), ${T.bg}`, fontFamily: T.sans, color: T.white, paddingBottom: 80 }}>
      <div style={{ padding: "20px 20px 0" }}>
        <button onClick={handleBack} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", color: T.teal, fontSize: 13, fontFamily: T.sans, cursor: "pointer", padding: "4px 0", marginBottom: 16 }}>
          ← Critical Protocols
        </button>
        <div>
          <span style={pill("linear-gradient(135deg,#14b8a6,#065f46)")}>⚗️ Metabolic</span>
          <span style={pill("linear-gradient(135deg,#3b82f6,#1e3a8a)")}>EJE 2022 / NEJM</span>
        </div>
        <h1 style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 700, margin: "0 0 4px", lineHeight: 1.15 }}>Severe Hyponatremia</h1>
        <p style={{ color: T.muted, fontSize: 12, margin: "0 0 20px" }}>Na⁺ severity classifier · Corrected Na · SIADH vs hypovolemic · 3% NaCl calculator · ODS prevention · DDAVP rescue</p>
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
        {tab === 0 && T0}{tab === 1 && T1}{tab === 2 && T2}{tab === 3 && T3}
      </div>
    </div>
  );
}