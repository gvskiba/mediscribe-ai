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
const sL   = (c = T.teal) => ({ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: c, margin: "18px 0 10px", display: "flex", alignItems: "center", gap: 8 });
const dv   = { height: 1, background: T.border, margin: "10px 0" };
const inp  = { padding: "9px 12px", background: T.glassMid, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 13, fontFamily: T.mono, fontWeight: 600, outline: "none" };

// ── CK Severity ───────────────────────────────────────────────────────────────
const CK_LEVELS = [
  { range: "< 1,000",        label: "Normal / Borderline", color: T.green,  risk: "Low",      action: "Investigate cause · outpatient follow-up" },
  { range: "1,000–5,000",    label: "Mild",                color: T.gold,   risk: "Low–Med",  action: "IV hydration · monitor CK + creatinine · admit if symptomatic" },
  { range: "5,000–15,000",   label: "Moderate",            color: T.amber,  risk: "Moderate", action: "Aggressive IVF · nephrology if creatinine rising · admit" },
  { range: "15,000–100,000", label: "Severe",              color: T.coral,  risk: "High",     action: "Aggressive IVF · nephrology consult · ICU if AKI + hyperkalemia" },
  { range: "> 100,000",      label: "Massive",             color: T.coral,  risk: "Critical", action: "ICU · bicarb alkalization · nephrology · likely dialysis · DIC workup" },
];

// ── MUSCLE Mnemonic ───────────────────────────────────────────────────────────
const MUSCLE = [
  { l: "M", w: "Medications / Toxins",           d: "Statins · fibrates · colchicine · antipsychotics (NMS) · cocaine · alcohol · heroin · amphetamines · PCP · ketamine" },
  { l: "U", w: "Unaccustomed Exercise / Trauma", d: "Extreme exertion (marathon, military training) · crush injury · compartment syndrome · electric shock · lightning" },
  { l: "S", w: "Seizures / Status Epilepticus",  d: "Prolonged tonic-clonic activity → massive muscle damage · often missed as a rhabdo cause" },
  { l: "C", w: "Compression / Immobility",       d: "Prolonged coma · positional compression · bariatric patients · found-down syndrome" },
  { l: "L", w: "Lytes / Metabolic",              d: "Hypokalemia · hypophosphatemia · hyponatremia · hypothyroidism · DKA · hyperosmolar states" },
  { l: "E", w: "Elevated Temperature",           d: "Heat stroke · NMS · serotonin syndrome · malignant hyperthermia · hyperthyroidism · infections (influenza, COVID-19, EBV)" },
];

import { useNavigate } from "react-router-dom";

// ── Main Component ───────────────────────────────────────────────────────────
export default function RhabdomyolysisHub({ onBack }) {
  const navigate = useNavigate();
  const handleBack = () => onBack ? onBack() : navigate("/CriticalProtocolsPage");
  const [tab, setTab]           = useState(0);
  const [ck, setCk]             = useState("");
  const [wt, setWt]             = useState("");
  const [alkalize, setAlkalize] = useState(false);
  const [compTab, setCompTab]   = useState("AKI");
  const TABS = ["Recognition", "Treatment", "Complications", "Monitoring"];

  const ckNum = parseFloat(ck);
  const isNum = !isNaN(ckNum) && ck !== "";
  const ckSev = !isNum ? null
    : ckNum > 100000 ? CK_LEVELS[4]
    : ckNum > 15000  ? CK_LEVELS[3]
    : ckNum > 5000   ? CK_LEVELS[2]
    : ckNum > 1000   ? CK_LEVELS[1]
    : CK_LEVELS[0];

  const fluidRate = wt && !isNaN(wt) ? {
    standard: (parseFloat(wt) * 1.5 * 60).toFixed(0),
    goal_uo:  (parseFloat(wt) * 3).toFixed(0),
  } : null;

  // ── TAB 0: RECOGNITION ────────────────────────────────────────────────────
  const Tab0 = (
    <div>
      <div style={aBox(T.amber, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.amber, marginBottom: 2 }}>Classic Triad — present in only ~10% of cases</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
          {["Muscle pain / weakness", "Dark cola-colored urine", "Elevated CK"].map(s => (
            <span key={s} style={{ ...tag(T.amber), fontSize: 11 }}>{s}</span>
          ))}
        </div>
        <div style={{ fontSize: 11.5, color: T.muted, marginTop: 8 }}>Most cases are asymptomatic or present with only 1–2 features. High index of suspicion in any patient with a predisposing cause.</div>
      </div>

      <div style={sL()}>CK Severity Classifier</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
          <input value={ck} onChange={e => setCk(e.target.value)} placeholder="CK level (U/L)" type="number"
            style={{ ...inp, flex: 1, fontSize: 16, fontWeight: 700 }} />
          <span style={{ fontSize: 12, color: T.muted }}>U/L</span>
        </div>
        {ckSev ? (
          <div style={{ ...aBox(ckSev.color, 0) }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: ckSev.color }}>{ckSev.label}</span>
              <span style={{ ...tag(ckSev.color) }}>AKI Risk: {ckSev.risk}</span>
            </div>
            <div style={{ fontFamily: T.mono, fontSize: 12, color: T.muted, marginBottom: 4 }}>CK {ckSev.range} U/L</div>
            <div style={{ fontSize: 11.5, color: ckSev.color, fontWeight: 600 }}>→ {ckSev.action}</div>
          </div>
        ) : (
          <div style={{ fontSize: 11.5, color: T.dim, textAlign: "center" }}>Enter CK level above to classify severity</div>
        )}
      </div>

      {CK_LEVELS.map(({ range, label, color, action }) => (
        <div key={range} style={{ ...G(), padding: "10px 13px", marginBottom: 6, display: "flex", gap: 12, alignItems: "flex-start", borderLeft: `3px solid ${color}` }}>
          <div style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 700, color, minWidth: 110, flexShrink: 0 }}>{range}</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.white, marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 11, color: T.muted }}>{action}</div>
          </div>
        </div>
      ))}

      <div style={sL(T.gold)}>Clinical Features</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
        {[
          { label: "Symptoms", color: T.amber, items: ["Myalgia (localized or diffuse)", "Muscle weakness", "Muscle swelling / tenderness", "Dark tea / cola urine", "Nausea / vomiting", "Fever (if hyperthermia cause)"] },
          { label: "Labs",     color: T.teal,  items: ["↑↑ CK (hallmark)", "Urinalysis: +blood, NO RBCs", "Hyperkalemia", "Hypocalcemia (early)", "Hyperphosphatemia", "↑ Creatinine / BUN"] },
        ].map(({ label, color, items }) => (
          <div key={label} style={card({ padding: "12px 13px", borderLeft: `3px solid ${color}` })}>
            <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 7 }}>{label}</div>
            {items.map((item, i) => <div key={i} style={{ fontSize: 11.5, color: T.muted, marginBottom: 4, display: "flex", gap: 5 }}><span style={{ color }}>●</span>{item}</div>)}
          </div>
        ))}
      </div>

      <div style={aBox(T.blue, 14)}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: T.blue, marginBottom: 3 }}>🔬 Urine Dipstick Pearl</div>
        <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.5 }}>Positive heme on dipstick WITHOUT red blood cells on microscopy = myoglobinuria (not hematuria). Myoglobin molecules are small enough to pass glomerular filtration and cross-react with heme assay.</div>
      </div>

      <div style={sL(T.purple)}>Causes — MUSCLE Mnemonic</div>
      {MUSCLE.map(({ l, w, d }) => (
        <div key={l + w} style={{ ...G(), padding: "11px 13px", marginBottom: 7, display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: T.purple + "22", border: `1.5px solid ${T.purple}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, color: T.purple, fontFamily: T.mono, flexShrink: 0 }}>{l}</div>
          <div><div style={{ fontSize: 12, fontWeight: 700, color: T.white, marginBottom: 2 }}>{w}</div><div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.45 }}>{d}</div></div>
        </div>
      ))}
    </div>
  );

  // ── TAB 1: TREATMENT ──────────────────────────────────────────────────────
  const Tab1 = (
    <div>
      <div style={aBox(T.teal, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.teal, marginBottom: 2 }}>Aggressive IV Hydration is the Cornerstone</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>Early, aggressive IV fluid resuscitation is the most evidence-based intervention. Goal urine output 200–300 mL/h (1–3 mL/kg/h) until CK trending down.</div>
      </div>

      <div style={sL()}>IV Fluid Protocol</div>
      <div style={{ ...card({ marginBottom: 12 }) }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.teal, marginBottom: 10 }}>Weight-Based Rate Calculator</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
          <input value={wt} onChange={e => setWt(e.target.value)} placeholder="Weight (kg)" type="number"
            style={{ ...inp, flex: 1 }} />
          <span style={{ fontSize: 12, color: T.muted }}>kg</span>
        </div>
        {fluidRate ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div style={{ ...G({ borderRadius: 9 }), padding: "10px 12px" }}>
              <div style={{ fontSize: 10, color: T.dim, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.07em" }}>Initial rate (1.5 mL/kg/h)</div>
              <div style={{ fontFamily: T.mono, fontSize: 16, color: T.teal, fontWeight: 800 }}>{fluidRate.standard} mL/h</div>
            </div>
            <div style={{ ...G({ borderRadius: 9 }), padding: "10px 12px" }}>
              <div style={{ fontSize: 10, color: T.dim, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.07em" }}>Target UO (3 mL/kg/h)</div>
              <div style={{ fontFamily: T.mono, fontSize: 16, color: T.green, fontWeight: 800 }}>{fluidRate.goal_uo} mL/h</div>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 11.5, color: T.dim }}>Enter weight above for personalized rates</div>
        )}
      </div>

      {[
        { phase: "Phase 1 — Initial Resuscitation",  time: "0–2h",                          color: T.coral, detail: "0.9% NS 1–1.5 L/h · bolus 500 mL–1L if hemodynamically unstable · Foley catheter for accurate UO measurement" },
        { phase: "Phase 2 — Aggressive Maintenance", time: "2–24h",                         color: T.gold,  detail: "0.9% NS 1–1.5 mL/kg/h (titrate to UO goal) · typical total: 6–12 L in first 24h · reassess fluid status q 2h" },
        { phase: "Phase 3 — Taper with CK decline",  time: "CK < 5,000 + UO adequate",     color: T.teal,  detail: "Gradually reduce IV rate · transition to PO hydration · D/C Foley when stable · continue until CK in safe range" },
      ].map(({ phase, time, color, detail }) => (
        <div key={phase} style={{ ...card({ marginBottom: 8, borderLeft: `3px solid ${color}` }) }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color }}>{phase}</span>
            <span style={{ ...tag(color), fontSize: 10 }}>{time}</span>
          </div>
          <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{detail}</div>
        </div>
      ))}

      <div style={sL(T.blue)}>Urine Alkalization — Sodium Bicarbonate</div>
      <div style={{ ...card({ marginBottom: 12 }) }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: T.blue }}>Add NaHCO₃ to IVF?</span>
          <button
            style={{ padding: "6px 14px", borderRadius: 8, border: `1.5px solid ${alkalize ? T.blue : T.border}`, background: alkalize ? "rgba(59,130,246,0.2)" : T.glass, color: alkalize ? T.blue : T.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.sans }}
            onClick={() => setAlkalize(!alkalize)}>
            {alkalize ? "✓ Using Bicarb" : "Not Using Bicarb"}
          </button>
        </div>
        {alkalize ? (
          <div>
            <div style={aBox(T.blue, 10)}>
              <div style={{ fontFamily: T.mono, fontSize: 13, color: T.blue, fontWeight: 700, marginBottom: 4 }}>
                150 mEq NaHCO₃ in 1L D5W · infuse at maintenance rate
              </div>
              <div style={{ fontSize: 11.5, color: T.muted }}>Target urine pH 6.5–7.5 · check urine pH hourly with dipstick</div>
            </div>
            <div style={{ fontSize: 11.5, color: T.muted, marginBottom: 8, lineHeight: 1.5 }}>
              <span style={{ color: T.blue, fontWeight: 600 }}>Rationale: </span>Myoglobin is less nephrotoxic in alkaline urine. Prevents precipitation of Tamm-Horsfall protein-myoglobin casts in tubules.
            </div>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: T.coral, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Stop Bicarb if:</div>
            {["Serum pH > 7.50 (metabolic alkalosis)", "Serum Ca²⁺ < 7 mg/dL (alkalosis worsens hypocalcemia → seizures)", "No response in urine pH despite infusion", "Signs of pulmonary edema from volume overload"].map((s, i) => (
              <div key={i} style={{ fontSize: 11.5, color: T.muted, display: "flex", gap: 7, marginBottom: 4 }}>
                <span style={{ color: T.coral, flexShrink: 0 }}>✗</span>{s}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.5 }}>
            Evidence is limited for alkalization over NS alone. Most experts add bicarb for CK &gt; 15,000–30,000 or when urine pH &lt; 6.5 despite adequate NS hydration. Discuss with nephrology.
          </div>
        )}
      </div>

      <div style={sL(T.gold)}>Electrolyte Management</div>
      {[
        { e: "Hyperkalemia",      mgmt: "Treat per hyperkalemia protocol — calcium first if ECG changes · insulin/dextrose · eliminate (furosemide if adequate UO) · dialysis if refractory", color: T.coral, urgent: true },
        { e: "Hypocalcemia",      mgmt: "DO NOT treat asymptomatic hypocalcemia — calcium deposits in damaged muscle; repletion worsens calcinosis. Treat ONLY if symptomatic (seizures, arrhythmia, tetany) with calcium gluconate 1g IV", color: T.gold, urgent: false },
        { e: "Hyperphosphatemia", mgmt: "Dietary restriction · phosphate binders if severe · resolves with hydration in most cases", color: T.blue, urgent: false },
        { e: "Hyperuricemia",     mgmt: "Usually resolves with aggressive hydration · monitor uric acid · allopurinol not routinely needed acutely", color: T.teal, urgent: false },
      ].map(({ e, mgmt, color, urgent }) => (
        <div key={e} style={{ ...G(), padding: "11px 13px", marginBottom: 8, borderLeft: `3px solid ${color}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 3 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color }}>{e}</span>
            {urgent && <span style={{ ...tag(T.coral), fontSize: 9 }}>URGENT</span>}
          </div>
          <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{mgmt}</div>
        </div>
      ))}

      <div style={sL(T.coral)}>Medications to AVOID</div>
      <div style={{ ...card() }}>
        {["NSAIDs — nephrotoxic, worsen AKI",
          "ACE inhibitors / ARBs — reduce GFR acutely",
          "IV contrast — nephrotoxic (defer non-urgent imaging)",
          "Aminoglycosides — nephrotoxic unless essential",
          "Furosemide in hypovolemic patients — may worsen AKI by reducing renal perfusion (use only if volume-overloaded)"].map((m, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: i < 4 ? 7 : 0, paddingBottom: i < 4 ? 7 : 0, borderBottom: i < 4 ? `1px solid ${T.border}` : "none" }}>
            <span style={{ color: T.coral, flexShrink: 0 }}>✗</span>
            <div style={{ fontSize: 11.5, color: T.muted }}>{m}</div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── TAB 2: COMPLICATIONS ──────────────────────────────────────────────────
  const COMP_TABS = ["AKI", "Compartment", "Cardiac", "DIC"];
  const Tab2 = (
    <div>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 14 }}>
        {COMP_TABS.map(c => (
          <button key={c}
            style={{ padding: "7px 14px", borderRadius: 9, border: `1.5px solid ${compTab === c ? T.coral : T.border}`, background: compTab === c ? "rgba(244,63,94,0.15)" : T.glass, color: compTab === c ? T.coral : T.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.sans, transition: "all 0.15s" }}
            onClick={() => setCompTab(c)}>{c}</button>
        ))}
      </div>

      {compTab === "AKI" && (
        <div>
          <div style={aBox(T.coral, 14)}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, marginBottom: 2 }}>Myoglobin-Induced AKI — Most Feared Complication</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>Myoglobin causes direct tubular toxicity, tubular cast obstruction, and renal vasoconstriction. AKI occurs in 10–40% of rhabdomyolysis. Risk increases dramatically with CK &gt; 15,000–20,000.</div>
          </div>
          <div style={sL()}>AKI Mechanisms</div>
          {["Direct tubular toxicity — myoglobin generates free radicals and lipid peroxidation",
            "Tubular obstruction — myoglobin + Tamm-Horsfall protein → casts (especially in acidic, concentrated urine)",
            "Renal vasoconstriction — myoglobin releases vasoactive mediators",
            "Volume depletion — third-spacing into damaged muscle worsens renal hypoperfusion"].map((m, i) => (
            <div key={i} style={{ fontSize: 11.5, color: T.muted, display: "flex", gap: 8, marginBottom: 6 }}><span style={{ color: T.coral }}>●</span>{m}</div>
          ))}
          <div style={sL(T.teal)}>AKI Monitoring</div>
          {[
            { item: "Creatinine + BUN",    freq: "q 4–6h initially", note: "Rising creatinine = AKI developing — escalate IVF and nephrology" },
            { item: "Urine Output (Foley)", freq: "Hourly",           note: "Target 200–300 mL/h (1–3 mL/kg/h) · oliguria = alarm" },
            { item: "Urine color",          freq: "Each void",        note: "Dark → pink → yellow = myoglobin clearing" },
            { item: "Urine pH",             freq: "Hourly",           note: "Target 6.5–7.5 if using bicarb alkalization" },
            { item: "BMP",                  freq: "q 4–6h",           note: "K⁺ · bicarbonate · creatinine trend" },
          ].map(({ item, freq, note }) => (
            <div key={item} style={{ ...G(), padding: "9px 12px", marginBottom: 6, display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.teal, minWidth: 120, flexShrink: 0 }}>{item}</div>
              <div>
                <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 2 }}>{freq}</div>
                <div style={{ fontSize: 11.5, color: T.muted }}>{note}</div>
              </div>
            </div>
          ))}
          <div style={sL(T.coral)}>Dialysis Indications</div>
          {["Refractory hyperkalemia (K⁺ > 6.5 despite treatment)",
            "Severe metabolic acidosis (pH < 7.1)",
            "Volume overload unresponsive to diuretics",
            "Symptomatic uremia (pericarditis, encephalopathy)",
            "Oliguria / anuria despite adequate IVF resuscitation"].map((d, i) => (
            <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 8, marginBottom: 5 }}><span style={{ color: T.coral }}>●</span>{d}</div>
          ))}
        </div>
      )}

      {compTab === "Compartment" && (
        <div>
          <div style={aBox(T.amber, 14)}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.amber, marginBottom: 2 }}>Compartment Syndrome — Can Be Both Cause AND Complication</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>Rhabdomyolysis → fluid shifts into muscle → increased compartment pressure → reduced perfusion → more muscle necrosis. High suspicion in crush injuries, comatose patients, vascular injuries.</div>
          </div>
          <div style={sL(T.amber)}>5 Ps (Classic Signs)</div>
          {[
            { p: "Pain",                detail: "Severe, out of proportion to injury · Pain with PASSIVE STRETCH of muscles in the compartment (most sensitive sign)" },
            { p: "Pressure",            detail: "Tense, woody compartment on palpation · Compartment pressure > 30 mmHg OR within 30 mmHg of diastolic BP → fasciotomy" },
            { p: "Paresthesias",        detail: "Numbness / tingling → nerve ischemia (early sign)" },
            { p: "Paralysis",           detail: "Motor weakness → late and ominous finding" },
            { p: "Pallor / Pulselessness", detail: "Late findings — do NOT wait for these — act on pain + pressure + paresthesias" },
          ].map(({ p, detail }) => (
            <div key={p} style={{ ...card({ marginBottom: 8 }), display: "flex", gap: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: T.amber + "22", border: `1.5px solid ${T.amber}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: T.amber, fontFamily: T.mono, flexShrink: 0 }}>{p[0]}</div>
              <div><div style={{ fontSize: 12, fontWeight: 700, color: T.amber, marginBottom: 2 }}>{p}</div><div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{detail}</div></div>
            </div>
          ))}
          <div style={sL(T.coral)}>Compartment Pressure Measurement</div>
          <div style={{ ...card() }}>
            {[
              { label: "Normal",               val: "< 10–15 mmHg",                                                        color: T.green },
              { label: "Monitor closely",      val: "15–30 mmHg",                                                          color: T.gold },
              { label: "Fasciotomy threshold", val: "> 30 mmHg OR ΔP < 30 mmHg (diastolic BP − compartment pressure)",    color: T.coral },
            ].map(({ label, val, color }, i) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 7, marginBottom: 7, borderBottom: i < 2 ? `1px solid ${T.border}` : "none" }}>
                <span style={{ fontSize: 12, color: T.muted }}>{label}</span>
                <span style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 700, color }}>{val}</span>
              </div>
            ))}
            <div style={{ ...aBox(T.coral, 0) }}>
              <div style={{ fontSize: 11.5, color: T.coral, fontWeight: 600 }}>Emergent fasciotomy is definitive treatment — call surgery immediately if threshold met</div>
            </div>
          </div>
        </div>
      )}

      {compTab === "Cardiac" && (
        <div>
          <div style={aBox(T.coral, 14)}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, marginBottom: 2 }}>Cardiac Arrhythmias — Primary Killer in Severe Rhabdomyolysis</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>Hyperkalemia from cellular release of K⁺ is the main cardiac risk. Continuous cardiac monitoring mandatory for moderate-severe cases.</div>
          </div>
          <div style={sL()}>Electrolyte-Driven Arrhythmia Risk</div>
          {[
            { cause: "Hyperkalemia",      arrhythmia: "Peaked T waves → widened QRS → sine wave → VF / asystole",                     mgmt: "Calcium gluconate 1g IV + insulin/dextrose + eliminate · dialysis if refractory", color: T.coral },
            { cause: "Hypocalcemia",      arrhythmia: "Prolonged QT → torsades de pointes · tetany · seizures",                       mgmt: "Calcium gluconate if symptomatic ONLY (1g IV) — avoid if asymptomatic", color: T.gold },
            { cause: "Metabolic Acidosis", arrhythmia: "Worsens hyperkalemia effects on cardiac membrane · arrhythmia risk amplified", mgmt: "Bicarb if pH < 7.1 · treat underlying acidosis", color: T.amber },
          ].map(({ cause, arrhythmia, mgmt, color }) => (
            <div key={cause} style={{ ...card({ marginBottom: 8, borderLeft: `3px solid ${color}` }) }}>
              <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 4 }}>{cause}</div>
              <div style={{ fontSize: 11.5, color: T.muted, marginBottom: 4 }}><span style={{ fontWeight: 600, color: T.white }}>Risk: </span>{arrhythmia}</div>
              <div style={{ fontSize: 11.5, color: T.muted }}><span style={{ fontWeight: 600, color }}>Mgmt: </span>{mgmt}</div>
            </div>
          ))}
          <div style={sL(T.teal)}>Cardiac Monitoring Protocol</div>
          {["12-lead ECG on admission — look for peaked T waves, widened QRS",
            "Continuous telemetry for all moderate-severe rhabdomyolysis",
            "Repeat ECG with each K⁺ result if hyperkalemic",
            "QTc monitoring if hypocalcemia or QT-prolonging medications",
            "Cardiology consult if hemodynamic instability or refractory arrhythmia"].map((m, i) => (
            <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 8, marginBottom: 5 }}><span style={{ color: T.teal }}>▸</span>{m}</div>
          ))}
        </div>
      )}

      {compTab === "DIC" && (
        <div>
          <div style={aBox(T.purple, 14)}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.purple, marginBottom: 2 }}>DIC — Disseminated Intravascular Coagulation</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>Massive muscle injury releases thromboplastin → systemic coagulation activation → consumption of clotting factors + platelets. Less common but life-threatening.</div>
          </div>
          <div style={sL(T.purple)}>DIC Workup — Send if CK &gt; 15,000</div>
          {["PT / INR (prolonged → factor consumption)",
            "PTT (prolonged)",
            "Fibrinogen (low < 150 mg/dL = consumptive)",
            "D-dimer (elevated — often markedly)",
            "Platelet count (thrombocytopenia)",
            "Peripheral smear (schistocytes — microangiopathic)"].map((t, i) => (
            <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 8, marginBottom: 5 }}><span style={{ color: T.purple }}>●</span>{t}</div>
          ))}
          <div style={sL(T.coral)}>DIC Treatment</div>
          {[
            { tx: "FFP",               detail: "10–15 mL/kg IV if bleeding or invasive procedure planned (replaces factors)" },
            { tx: "Cryoprecipitate",   detail: "1 pool (10 units) if fibrinogen < 100–150 mg/dL (rich in fibrinogen, factor VIII, vWF)" },
            { tx: "Platelets",         detail: "Transfuse if < 50,000 with bleeding · < 20,000 without bleeding" },
            { tx: "Treat the cause",   detail: "Address underlying rhabdomyolysis → remove trigger · aggressive IVF → organ support" },
            { tx: "Hematology consult", detail: "For guidance on transfusion strategy and anticoagulation in DIC" },
          ].map(({ tx, detail }) => (
            <div key={tx} style={{ ...G(), padding: "10px 13px", marginBottom: 7, borderLeft: `3px solid ${T.purple}` }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.purple, marginBottom: 2 }}>{tx}</div>
              <div style={{ fontSize: 11.5, color: T.muted }}>{detail}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ── TAB 3: MONITORING ─────────────────────────────────────────────────────
  const Tab3 = (
    <div>
      <div style={sL()}>CK Trending — Expected Course</div>
      {[
        { time: "0–24h",      expect: "CK peaks within 12–24h of injury · may continue rising if ongoing muscle damage", color: T.coral },
        { time: "24–72h",     expect: "CK should begin declining if cause eliminated and hydration adequate · expect 50% decrease per 24–48h", color: T.gold },
        { time: "> 72h",      expect: "Continued CK elevation → ongoing muscle damage · missed compartment syndrome · new injury · incomplete treatment of cause", color: T.teal },
        { time: "Safe range", expect: "CK < 5,000 with stable creatinine + adequate UO → consider transitioning to oral hydration", color: T.green },
      ].map(({ time, expect, color }) => (
        <div key={time} style={{ ...G(), padding: "10px 13px", marginBottom: 7, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div style={{ fontFamily: T.mono, fontSize: 11.5, fontWeight: 700, color, minWidth: 80, flexShrink: 0 }}>{time}</div>
          <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{expect}</div>
        </div>
      ))}

      <div style={sL()}>Monitoring Schedule</div>
      {[
        { freq: "Hourly",      items: "Urine output (Foley) · urine color · urine dipstick pH (if on bicarb)",             color: T.coral },
        { freq: "Every 4–6h", items: "BMP (K⁺ · Cr · HCO₃) · repeat ECG if hyperkalemic · neuro checks",                 color: T.gold },
        { freq: "Every 6–12h", items: "CK level · LDH · coagulation panel (if severe)",                                   color: T.teal },
        { freq: "Every 24h",  items: "CBC · LFTs · phosphate · uric acid · serum Mg · reassess CK trend",                 color: T.green },
        { freq: "Continuous", items: "Cardiac monitor for all moderate-severe rhabdomyolysis",                             color: T.purple },
      ].map(({ freq, items, color }) => (
        <div key={freq} style={{ ...G(), padding: "9px 12px", marginBottom: 6, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div style={{ fontFamily: T.mono, fontSize: 11.5, fontWeight: 700, color, minWidth: 100, flexShrink: 0 }}>{freq}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{items}</div>
        </div>
      ))}

      <div style={sL(T.coral)}>Escalation Triggers</div>
      {["Oliguria (UO < 0.5 mL/kg/h) despite IVF → escalate rate + nephrology · consider bicarb if not already",
        "Rising creatinine > 0.5 mg/dL → nephrology consult urgently",
        "K⁺ > 5.5 or ECG changes → hyperkalemia protocol immediately",
        "CK rising after initial decline → new muscle injury or compartment syndrome",
        "Coagulopathy developing (PT/PTT rising, falling platelets) → DIC workup + hematology"].map((t, i) => (
        <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 8, marginBottom: 7, lineHeight: 1.4 }}>
          <span style={{ color: T.coral, flexShrink: 0 }}>⚠</span>{t}
        </div>
      ))}

      <div style={sL(T.green)}>Discharge Criteria</div>
      <div style={{ ...card({ background: "rgba(34,197,94,0.07)", borderColor: "rgba(34,197,94,0.25)", marginBottom: 14 }) }}>
        {["CK trending down (ideally < 5,000 U/L)", "Creatinine stable at or near baseline", "K⁺ normal on oral regimen", "Urine clear (no myoglobinuria)", "Adequate urine output on oral hydration", "Underlying cause identified and treated/controlled", "No signs of compartment syndrome", "Patient tolerating PO and ambulatory"].map((t, i) => (
          <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 8, marginBottom: 5 }}>
            <span style={{ color: T.green }}>✓</span>{t}
          </div>
        ))}
      </div>

      <div style={sL(T.purple)}>Disposition</div>
      <div style={{ ...card() }}>
        {[
          { level: "ICU",         criteria: "CK > 50,000 · AKI requiring dialysis · hemodynamic instability · DIC · compartment syndrome requiring fasciotomy · hyperkalemia with ECG changes" },
          { level: "Telemetry",   criteria: "CK 5,000–50,000 · any AKI (rising creatinine) · K⁺ > 5.0 · requiring continuous IV fluids and monitoring" },
          { level: "Observation", criteria: "CK 1,000–5,000 · creatinine stable · K⁺ normal · expected to respond to aggressive oral or IV hydration over 24h" },
          { level: "Discharge",   criteria: "All discharge criteria met · reliable outpatient follow-up in 48–72h for repeat CK and BMP · cause identified and treated" },
        ].map(({ level, criteria }, i) => (
          <div key={i} style={{ display: "flex", gap: 10, paddingBottom: 7, marginBottom: 7, borderBottom: i < 3 ? `1px solid ${T.border}` : "none" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.purple, minWidth: 100, flexShrink: 0 }}>{level}</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>{criteria}</div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: `radial-gradient(ellipse 70% 40% at 15% 0%, rgba(20,184,166,0.09) 0%, transparent 60%), radial-gradient(ellipse 50% 35% at 85% 95%, rgba(251,146,60,0.08) 0%, transparent 55%), ${T.bg}`, fontFamily: T.sans, color: T.white, paddingBottom: 80 }}>

      <div style={{ padding: "20px 20px 0" }}>
        <button onClick={handleBack} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", color: T.teal, fontSize: 13, fontFamily: T.sans, cursor: "pointer", padding: "4px 0", marginBottom: 16 }}>
          ← Critical Protocols
        </button>
        <div>
          <span style={pill("linear-gradient(135deg,#14b8a6,#065f46)")}>⚗️ Metabolic</span>
          <span style={pill("linear-gradient(135deg,#f97316,#b45309)")}>Nephrology</span>
        </div>
        <h1 style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 700, margin: "0 0 4px", lineHeight: 1.15 }}>Rhabdomyolysis</h1>
        <p style={{ color: T.muted, fontSize: 12, margin: "0 0 20px" }}>CK severity classifier · MUSCLE causes · Aggressive IVF protocol · Alkalization · Compartment syndrome · AKI</p>
      </div>

      <div style={{ display: "flex", gap: 4, padding: "0 20px", marginBottom: 18, overflowX: "auto", scrollbarWidth: "none" }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            style={{ padding: "7px 15px", borderRadius: 9, border: `1.5px solid ${tab === i ? T.teal : T.border}`, background: tab === i ? "rgba(20,184,166,0.14)" : T.glass, color: tab === i ? T.teal : T.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.sans, whiteSpace: "nowrap", transition: "all 0.18s", backdropFilter: "blur(8px)" }}>
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