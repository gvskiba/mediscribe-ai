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
const chip = (c, a) => ({ padding: "7px 14px", borderRadius: 9, border: `1.5px solid ${a ? c : T.border}`, background: a ? c + "22" : T.glass, color: a ? c : T.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.sans, transition: "all 0.15s", backdropFilter: "blur(8px)" });

// ── Data ─────────────────────────────────────────────────────────────────────
const SEVERITY = [
  {
    label: "Mild DKA", color: T.gold,
    criteria: ["pH 7.25–7.30", "Bicarbonate 15–18 mEq/L", "Anion gap > 12", "Glucose > 250 mg/dL", "Alert / awake"],
    disposition: "ED monitored bed · may not require ICU"
  },
  {
    label: "Moderate DKA", color: T.amber,
    criteria: ["pH 7.00–7.24", "Bicarbonate 10–14 mEq/L", "Anion gap > 12", "Glucose > 250 mg/dL", "Alert or drowsy"],
    disposition: "Step-down or ICU depending on trajectory"
  },
  {
    label: "Severe DKA", color: T.coral,
    criteria: ["pH < 7.00", "Bicarbonate < 10 mEq/L", "Anion gap > 12", "Glucose > 250 mg/dL", "Stupor or coma"],
    disposition: "ICU admission required"
  },
];

const EUGLYCEMIC_FLAGS = [
  "Recent SGLT-2 inhibitor use (empagliflozin, dapagliflozin, canagliflozin)",
  "Pregnancy (gestational DKA can be euglycemic)",
  "Reduced carbohydrate intake / fasting",
  "Insulin administered en route",
  "Glucose may be < 200 mg/dL — DO NOT withhold insulin",
];

const FLUID_STEPS = [
  { step: "Initial Bolus", detail: "1 L NS over 1 hour · repeat if hemodynamically unstable · avoid in CHF/renal failure", color: T.teal },
  { step: "Corrected Na⁺", detail: "Add 1.6 mEq for every 100 mg/dL glucose above 100 to get corrected Na⁺. If corrected Na⁺ normal or high → 0.45% NaCl. If low → 0.9% NaCl", color: T.blue },
  { step: "Ongoing Rate", detail: "250–500 mL/h 0.9% or 0.45% NaCl until glucose ≤ 250 mg/dL · then add dextrose", color: T.purple },
  { step: "Add Dextrose", detail: "When glucose ≤ 250 mg/dL → switch to D5W-0.45% NaCl · continue insulin drip · target glucose 150–200 mg/dL", color: T.gold },
];

const K_PROTOCOLS = [
  { k: "K⁺ < 3.3 mEq/L",  action: "HOLD insulin · Replace K⁺ 20–40 mEq/h IV until ≥ 3.3 · then start insulin", color: T.coral, urgent: true },
  { k: "K⁺ 3.3–5.0 mEq/L", action: "Start insulin · Add 20–30 mEq K⁺ per liter of IVF · check K⁺ every 2 hours", color: T.gold, urgent: false },
  { k: "K⁺ > 5.0 mEq/L",  action: "Start insulin · NO potassium supplementation · monitor K⁺ every 2 hours", color: T.teal, urgent: false },
];

const INSULIN_PROTOCOL = [
  { phase: "Initial", detail: "0.1 units/kg/h regular insulin IV infusion (no bolus recommended in current ADA guidelines)", note: "Alternatively: 0.14 units/kg/h if no bolus given" },
  { phase: "Target drop", detail: "Target glucose drop of 50–75 mg/dL per hour", note: "If not dropping 50 mg/dL in first hour → double infusion rate" },
  { phase: "At glucose ≤ 250", detail: "Reduce insulin to 0.02–0.05 units/kg/h · switch IVF to D5 solution", note: "Do NOT stop insulin drip — continue until anion gap closes" },
  { phase: "Resolution criteria", detail: "Glucose < 200 mg/dL AND bicarbonate ≥ 15 mEq/L AND pH ≥ 7.3 AND anion gap ≤ 12", note: "ALL three criteria must be met before stopping drip" },
  { phase: "Transition to SQ", detail: "Overlap SQ long-acting insulin by 1–2 hours before stopping drip", note: "If new DM: start 0.5 units/kg/day split between long-acting and rapid-acting" },
];

const PRECIPITANTS = [
  { letter: "I", word: "Infection",             detail: "Most common cause — UTI, pneumonia, soft tissue · febrile workup: UA, CXR, cultures" },
  { letter: "I", word: "Insulin Non-Compliance", detail: "Missed doses · pump failure · running out of insulin · medication cost issues" },
  { letter: "I", word: "Ischemia / Infarction",  detail: "MI, stroke, mesenteric ischemia — troponin and EKG in all patients" },
  { letter: "I", word: "Intoxication",           detail: "Cocaine, alcohol, SGLT-2 inhibitors, corticosteroids, atypical antipsychotics" },
  { letter: "I", word: "Iatrogenic",             detail: "Steroids · thiazide diuretics · second-generation antipsychotics" },
  { letter: "I", word: "Ischemia (Pancreatitis)", detail: "Lipase if abdominal pain present · can be falsely elevated in DKA" },
];

const MONITORING = [
  { freq: "Every hour ×4",      params: "Glucose · mental status · urine output" },
  { freq: "Every 2 hours",      params: "BMP (Na, K, CO₂, creatinine) · anion gap recalculation · clinical reassessment" },
  { freq: "Every 4 hours",      params: "VBG or ABG for pH/bicarb trending · phosphorus · Mg" },
  { freq: "Every 4–6 hours",    params: "Calcium · LFTs if abnormal at baseline" },
  { freq: "At resolution",      params: "Repeat full BMP · confirm all 3 resolution criteria met · safe to transition" },
];

const COMPLICATIONS = [
  { comp: "Cerebral Edema",       detail: "Most feared — primarily in peds · headache, altered mentation, Cushing's triad · treat with mannitol 0.5–1 g/kg IV or hypertonic saline · avoid rapid fluid shifts", color: T.coral },
  { comp: "Hypokalemia",          detail: "Most common electrolyte complication · EKG changes (U waves, ST changes, wide QRS) · fatal arrhythmia if unrecognized · hold insulin if K⁺ < 3.3", color: T.gold },
  { comp: "Hypoglycemia",         detail: "Occurs when dextrose not added at glucose ≤ 250 mg/dL or insulin not reduced · check glucose hourly", color: T.amber },
  { comp: "ARDS / Pulmonary Edema", detail: "Excessive IVF resuscitation · monitor respiratory status · limit fluids in elderly and heart failure patients", color: T.blue },
  { comp: "Hyperchloremic Acidosis", detail: "From large-volume normal saline · anion gap closes but pH stays low · benign, self-resolving · do not resume insulin drip", color: T.purple },
  { comp: "Thrombosis",           detail: "DKA is a hypercoagulable state · consider DVT prophylaxis (enoxaparin) especially if immobile", color: T.teal },
];

import { useNavigate } from "react-router-dom";

// ── Main Component ───────────────────────────────────────────────────────────
export default function DKAHub({ onBack }) {
  const navigate = useNavigate();
  const handleBack = () => onBack ? onBack() : navigate("/CriticalProtocolsPage");
  const [tab, setTab]     = useState(0);
  const [step, setStep]   = useState(null);
  const [weight, setWeight] = useState("");
  const TABS = ["Diagnosis", "Treatment", "Monitoring", "Complications"];

  const wt = parseFloat(weight) || 0;
  const insulinRate = wt ? (wt * 0.1).toFixed(1) : "—";
  const insulinAlt  = wt ? (wt * 0.14).toFixed(1) : "—";

  // ── TAB 0: DIAGNOSIS ──────────────────────────────────────────────────────
  const Tab0 = (
    <div>
      <div style={sL()}>Diagnostic Criteria — ALL THREE required</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
        {[
          { label: "Hyperglycemia", val: "> 250 mg/dL", sub: "(may be lower with SGLT-2i)", color: T.gold },
          { label: "Acidosis",      val: "pH < 7.3",    sub: "or bicarb < 18 mEq/L",       color: T.coral },
          { label: "Ketonemia",     val: "Ketones +",   sub: "serum or urine",               color: T.amber },
        ].map(({ label, val, sub, color }) => (
          <div key={label} style={{ ...G({ borderRadius: 12 }), padding: "12px 10px", textAlign: "center", border: `1.5px solid ${color}40` }}>
            <div style={{ fontSize: 10, color: T.dim, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>{label}</div>
            <div style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 800, color }}>{val}</div>
            <div style={{ fontSize: 9.5, color: T.dim, marginTop: 3 }}>{sub}</div>
          </div>
        ))}
      </div>

      <div style={sL()}>Severity Classification</div>
      {SEVERITY.map(({ label, color, criteria, disposition }) => (
        <div key={label} style={{ ...card({ marginBottom: 10, borderLeft: `3px solid ${color}` }) }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color }}>{label}</div>
            <div style={{ ...tag(color), fontSize: 10 }}>{disposition.split(" ·")[0]}</div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {criteria.map((c, i) => (
              <span key={i} style={{ ...tag(color), fontSize: 10, marginRight: 0, marginBottom: 0 }}>{c}</span>
            ))}
          </div>
          <div style={{ fontSize: 11, color: T.dim, marginTop: 7 }}>{disposition}</div>
        </div>
      ))}

      <div style={sL(T.amber)}>Euglycemic DKA — Do Not Miss</div>
      <div style={aBox(T.amber, 0)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.amber, marginBottom: 6 }}>Glucose may be NORMAL or LOW</div>
        {EUGLYCEMIC_FLAGS.map((f, i) => (
          <div key={i} style={{ fontSize: 11.5, color: T.muted, display: "flex", gap: 8, marginBottom: 5 }}>
            <span style={{ color: T.amber, flexShrink: 0 }}>⚠</span>{f}
          </div>
        ))}
      </div>

      <div style={sL(T.purple)}>Anion Gap Calculation</div>
      <div style={{ ...card() }}>
        <div style={{ fontFamily: T.mono, fontSize: 13, color: T.white, marginBottom: 6 }}>AG = Na⁺ − (Cl⁻ + HCO₃⁻)</div>
        <div style={{ fontSize: 11.5, color: T.muted, marginBottom: 6 }}>Normal: 8–12 mEq/L (albumin-corrected: add 2.5 for each 1 g/dL decrease in albumin below 4)</div>
        <div style={dv} />
        <div style={{ fontFamily: T.mono, fontSize: 12, color: T.purple, marginBottom: 4 }}>Corrected Na⁺ = Na⁺ + 1.6 × [(Glucose − 100) / 100]</div>
        <div style={{ fontSize: 11, color: T.muted }}>Use corrected Na⁺ to guide fluid tonicity selection</div>
      </div>

      <div style={sL(T.coral)}>Precipitating Causes — 6 I's</div>
      {PRECIPITANTS.map(({ letter, word, detail }) => (
        <div key={word} style={{ ...G(), padding: "11px 14px", marginBottom: 7, display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: T.coral + "22", border: `1.5px solid ${T.coral}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: T.coral, fontFamily: T.mono, flexShrink: 0 }}>{letter}</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.white, marginBottom: 2 }}>{word}</div>
            <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{detail}</div>
          </div>
        </div>
      ))}
    </div>
  );

  // ── TAB 1: TREATMENT ──────────────────────────────────────────────────────
  const Tab1 = (
    <div>
      {/* Weight calculator */}
      <div style={{ ...card({ border: `1.5px solid ${T.blue}40`, marginBottom: 16 }) }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.blue, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Insulin Dose Calculator</div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
          <input
            type="number"
            placeholder="Weight (kg)"
            value={weight}
            onChange={e => setWeight(e.target.value)}
            style={{ flex: 1, background: T.glass, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 12px", color: T.white, fontSize: 13, fontFamily: T.mono, outline: "none" }}
          />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div style={{ ...G({ borderRadius: 8 }), padding: "10px", textAlign: "center" }}>
            <div style={{ fontSize: 9.5, color: T.dim, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>0.1 u/kg/h</div>
            <div style={{ fontFamily: T.mono, fontSize: 16, fontWeight: 800, color: T.blue }}>{insulinRate} u/h</div>
          </div>
          <div style={{ ...G({ borderRadius: 8 }), padding: "10px", textAlign: "center" }}>
            <div style={{ fontSize: 9.5, color: T.dim, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>0.14 u/kg/h (alt)</div>
            <div style={{ fontFamily: T.mono, fontSize: 16, fontWeight: 800, color: T.teal }}>{insulinAlt} u/h</div>
          </div>
        </div>
      </div>

      <div style={sL(T.teal)}>Step 1 — Fluids</div>
      {FLUID_STEPS.map(({ step: s, detail, color }) => (
        <div key={s} style={{ ...G(), padding: "11px 14px", marginBottom: 8, borderLeft: `3px solid ${color}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 3 }}>{s}</div>
          <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{detail}</div>
        </div>
      ))}

      <div style={sL(T.coral)}>Step 2 — Potassium</div>
      <div style={aBox(T.coral, 14)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, marginBottom: 2 }}>Check K⁺ BEFORE starting insulin</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>Insulin drives K⁺ intracellularly — fatal hypokalemia if not addressed first</div>
      </div>
      {K_PROTOCOLS.map(({ k, action, color, urgent }) => (
        <div key={k} style={{ ...card({ marginBottom: 8, border: `1.5px solid ${color}50`, background: color + "08" }) }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 800, color }}>{k}</div>
            {urgent && <div style={{ ...tag(T.coral), fontSize: 9 }}>HOLD INSULIN</div>}
          </div>
          <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{action}</div>
        </div>
      ))}

      <div style={sL(T.gold)}>Step 3 — Insulin</div>
      {INSULIN_PROTOCOL.map(({ phase, detail, note }, i) => {
        const open = step === i;
        return (
          <div key={i}
            style={{ ...G(), padding: "11px 14px", marginBottom: 8, cursor: "pointer", transition: "all 0.2s", border: open ? `1.5px solid ${T.gold}55` : `1px solid ${T.border}` }}
            onClick={() => setStep(open ? null : i)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.gold }}>{phase}</div>
              <div style={{ fontSize: 12, color: open ? T.gold : T.dim }}>{open ? "▲" : "▼"}</div>
            </div>
            <div style={{ fontSize: 11.5, color: T.muted, marginTop: 3 }}>{detail}</div>
            {open && (
              <div style={{ ...aBox(T.gold, 0), marginTop: 10 }}>
                <div style={{ fontSize: 11.5, color: T.muted }}>{note}</div>
              </div>
            )}
          </div>
        );
      })}

      <div style={sL(T.purple)}>Bicarbonate — When to Give</div>
      <div style={aBox(T.purple, 0)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.purple, marginBottom: 4 }}>ADA recommends only if pH &lt; 6.9</div>
        {[
          "100 mEq NaHCO₃ in 400 mL sterile water + 20 mEq KCl over 2 hours",
          "Repeat every 2 hours until pH ≥ 7.0",
          "Do NOT use routinely — worsens hypokalemia, CNS acidosis, cerebral edema risk",
        ].map((t, i) => (
          <div key={i} style={{ fontSize: 11.5, color: T.muted, display: "flex", gap: 8, marginBottom: 4 }}>
            <span style={{ color: T.purple }}>▸</span>{t}
          </div>
        ))}
      </div>
    </div>
  );

  // ── TAB 2: MONITORING ─────────────────────────────────────────────────────
  const Tab2 = (
    <div>
      <div style={sL()}>Monitoring Schedule</div>
      {MONITORING.map(({ freq, params }) => (
        <div key={freq} style={{ ...G(), padding: "11px 14px", marginBottom: 8, display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ minWidth: 130, flexShrink: 0 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, fontWeight: 700, color: T.blue }}>{freq}</div>
          </div>
          <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{params}</div>
        </div>
      ))}

      <div style={sL(T.gold)}>Resolution Criteria — ALL required</div>
      <div style={{ ...card({ border: `1.5px solid ${T.green}40`, background: T.green + "08", marginBottom: 14 }) }}>
        {[
          { crit: "Glucose < 200 mg/dL",             color: T.green },
          { crit: "Serum bicarbonate ≥ 15 mEq/L",    color: T.green },
          { crit: "Venous pH ≥ 7.3",                  color: T.green },
          { crit: "Anion gap ≤ 12 mEq/L",            color: T.green },
        ].map(({ crit, color }, i) => (
          <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 10, marginBottom: i < 3 ? 8 : 0, alignItems: "center" }}>
            <div style={{ width: 20, height: 20, borderRadius: "50%", background: color + "20", border: `1.5px solid ${color}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color, flexShrink: 0 }}>✓</div>
            {crit}
          </div>
        ))}
      </div>

      <div style={sL(T.amber)}>Transition to Subcutaneous Insulin</div>
      {[
        { step: "Timing", detail: "Give long-acting SQ insulin 1–2 hours BEFORE stopping IV drip to prevent rebound DKA" },
        { step: "New DM", detail: "Start 0.5 units/kg/day total daily dose · split 50/50 between basal and bolus" },
        { step: "Known DM", detail: "Resume home insulin regimen if adherent · adjust if reason for DKA was dosing issue" },
        { step: "Insulin pump", detail: "Resume pump only if reason for DKA was not pump failure · verify settings with endocrine" },
      ].map(({ step: s, detail }, i) => (
        <div key={s} style={{ display: "flex", gap: 12, paddingBottom: 8, marginBottom: 8, borderBottom: i < 3 ? `1px solid ${T.border}` : "none" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.amber, minWidth: 110, flexShrink: 0 }}>{s}</div>
          <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{detail}</div>
        </div>
      ))}

      <div style={sL(T.teal)}>Initial Workup Checklist</div>
      <div style={{ ...card() }}>
        {[
          "BMP · CBC · Mg · Phos · Ca",
          "VBG (pH, bicarb) — repeat every 2–4h",
          "Serum ketones (beta-hydroxybutyrate preferred over urine)",
          "Urinalysis + urine culture",
          "Blood cultures × 2 if febrile",
          "EKG — hyperkalemia changes, ischemia",
          "Troponin — MI as precipitant",
          "Chest X-ray — pneumonia",
          "Lipase — pancreatitis",
          "HbA1c — new DM vs. suboptimal control",
          "Urine pregnancy test (females of childbearing age)",
        ].map((item, i) => (
          <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 8, marginBottom: i < 10 ? 6 : 0 }}>
            <span style={{ color: T.teal, flexShrink: 0 }}>□</span>{item}
          </div>
        ))}
      </div>
    </div>
  );

  // ── TAB 3: COMPLICATIONS ──────────────────────────────────────────────────
  const Tab3 = (
    <div>
      <div style={aBox(T.coral, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, marginBottom: 2 }}>Most feared: Cerebral Edema (peds) · Hypokalemia · Hypoglycemia</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>Anticipate and monitor proactively — most complications are iatrogenic and preventable.</div>
      </div>

      {COMPLICATIONS.map(({ comp, detail, color }) => (
        <div key={comp} style={{ ...card({ marginBottom: 10, borderLeft: `3px solid ${color}` }) }}>
          <div style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 5 }}>{comp}</div>
          <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.5 }}>{detail}</div>
        </div>
      ))}

      <div style={sL(T.purple)}>HHS vs DKA — Key Differences</div>
      <div style={{ ...card() }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0 }}>
          {[
            ["Feature", "DKA", "HHS"],
            ["Glucose", "> 250", "> 600"],
            ["pH", "< 7.3", "> 7.3"],
            ["Bicarb", "< 18", "> 18"],
            ["Ketones", "Positive", "Trace/Neg"],
            ["Osmolality", "< 320", "> 320"],
            ["Onset", "Hours", "Days"],
            ["DM type", "T1 > T2", "T2"],
          ].map((row, ri) => (
            row.map((cell, ci) => (
              <div key={`${ri}-${ci}`} style={{
                padding: "8px 10px",
                borderBottom: ri < 7 ? `1px solid ${T.border}` : "none",
                borderRight: ci < 2 ? `1px solid ${T.border}` : "none",
                fontSize: ri === 0 ? 10 : 11.5,
                fontWeight: ri === 0 || ci === 0 ? 700 : 400,
                color: ri === 0 ? T.purple : ci === 0 ? T.white : T.muted,
                textTransform: ri === 0 ? "uppercase" : "none",
                letterSpacing: ri === 0 ? "0.06em" : "normal",
                fontFamily: ci > 0 && ri > 0 ? T.mono : T.sans,
              }}>
                {cell}
              </div>
            ))
          ))}
        </div>
      </div>

      <div style={sL(T.gold)}>Disposition</div>
      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ ...card({ background: T.coral + "08", borderColor: T.coral + "30" }) }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.coral, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>ICU</div>
          {["Severe DKA (pH < 7.0 or bicarb < 10)", "Altered mental status / coma", "Hemodynamic instability", "Cerebral edema", "Requiring BiPAP or intubation"].map((t, i) => (
            <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 8, marginBottom: 5 }}><span style={{ color: T.coral }}>●</span>{t}</div>
          ))}
        </div>
        <div style={{ ...card({ background: T.green + "08", borderColor: T.green + "30" }) }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.green, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Step-Down / Floor</div>
          {["Mild-moderate DKA", "Alert and cooperative", "Hemodynamically stable", "Tolerating PO fluids", "Resolution within 12–24h anticipated"].map((t, i) => (
            <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 8, marginBottom: 5 }}><span style={{ color: T.green }}>✓</span>{t}</div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: `radial-gradient(ellipse 70% 40% at 15% 0%, rgba(245,158,11,0.09) 0%, transparent 60%), radial-gradient(ellipse 50% 35% at 85% 95%, rgba(244,63,94,0.07) 0%, transparent 55%), ${T.bg}`, fontFamily: T.sans, color: T.white, paddingBottom: 80 }}>

      <div style={{ padding: "20px 20px 0" }}>
        <button onClick={handleBack} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", color: T.teal, fontSize: 13, fontFamily: T.sans, cursor: "pointer", padding: "4px 0", marginBottom: 16 }}>
          ← Critical Protocols
        </button>
        <div>
          <span style={pill("linear-gradient(135deg,#f59e0b,#b45309)")}>🍬 Endocrine</span>
          <span style={pill("linear-gradient(135deg,#0d9488,#065f46)")}>ADA 2024</span>
        </div>
        <h1 style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 700, margin: "0 0 4px", lineHeight: 1.15 }}>Diabetic Ketoacidosis</h1>
        <p style={{ color: T.muted, fontSize: 12, margin: "0 0 20px" }}>Diagnosis · Severity · Fluids · Insulin · Potassium · Monitoring · Complications</p>
      </div>

      <div style={{ display: "flex", gap: 4, padding: "0 20px", marginBottom: 18, overflowX: "auto", scrollbarWidth: "none" }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            style={{ padding: "7px 15px", borderRadius: 9, border: `1.5px solid ${tab === i ? T.gold : T.border}`, background: tab === i ? "rgba(245,158,11,0.14)" : T.glass, color: tab === i ? T.gold : T.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.sans, whiteSpace: "nowrap", transition: "all 0.18s", backdropFilter: "blur(8px)" }}>
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