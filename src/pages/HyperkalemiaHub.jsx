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
  bg: "#0a1628",
  glass: "rgba(255,255,255,0.04)",
  glassMid: "rgba(255,255,255,0.07)",
  border: "rgba(255,255,255,0.08)",
  teal: "#14b8a6", gold: "#f59e0b", coral: "#f43f5e",
  green: "#22c55e", blue: "#3b82f6", purple: "#a78bfa", amber: "#fb923c",
  white: "#f0f4f8", muted: "rgba(240,244,248,0.55)", dim: "rgba(240,244,248,0.28)",
  sans: "'DM Sans', sans-serif", serif: "'Playfair Display', serif", mono: "'JetBrains Mono', monospace",
};
const G   = (x = {}) => ({ background: T.glass, backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", border: `1px solid ${T.border}`, borderRadius: 14, ...x });
const pill = (bg) => ({ display: "inline-block", background: bg, borderRadius: 6, padding: "3px 10px", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", marginRight: 6, marginBottom: 10 });
const tag  = (c)  => ({ display: "inline-block", background: c + "22", border: `1px solid ${c}44`, borderRadius: 5, padding: "2px 8px", fontSize: 10.5, fontWeight: 600, color: c });
const card = (x = {}) => ({ ...G(), padding: "14px 16px", ...x });
const aBox = (c, mb = 10) => ({ background: c + "14", border: `1px solid ${c}40`, borderRadius: 10, padding: "10px 14px", marginBottom: mb });
const sL   = (c = T.teal) => ({ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: c, margin: "18px 0 10px", display: "flex", alignItems: "center", gap: 8 });

// ── Data ─────────────────────────────────────────────────────────────────────
const ECG_CHANGES = [
  { range: "5.5 – 6.0", color: T.gold,   ecg: "Peaked, narrow, symmetric T waves (tenting)", risk: "Low" },
  { range: "6.0 – 6.5", color: T.amber,  ecg: "PR prolongation · Early QRS widening", risk: "Moderate" },
  { range: "6.5 – 7.0", color: T.amber,  ecg: "Flattened / absent P waves · Widened QRS", risk: "High" },
  { range: "7.0 – 8.0", color: T.coral,  ecg: "Absent P waves · Bizarre wide QRS · LBBB/RBBB pattern", risk: "Critical" },
  { range: "> 8.0",     color: T.coral,  ecg: "Sine wave pattern → ventricular fibrillation / asystole", risk: "Fatal" },
];

const CDIGFAST = [
  { letter: "C", word: "Cell Lysis",        detail: "Rhabdomyolysis · tumor lysis syndrome · massive hemolysis · crush injury · massive transfusion" },
  { letter: "D", word: "Drugs",             detail: "ACE inhibitors · ARBs · K-sparing diuretics (spironolactone) · NSAIDs · trimethoprim · heparin · succinylcholine · digoxin toxicity · beta-blockers" },
  { letter: "I", word: "Insufficiency",     detail: "Renal failure (AKI or CKD) — most common cause · reduced urinary K+ excretion" },
  { letter: "G", word: "GI / Intake",       detail: "High-K+ foods · K+ supplements · GI bleeding with reabsorption · high-K+ IV fluids (KCl drips)" },
  { letter: "F", word: "False (Pseudo)",    detail: "Hemolyzed sample · thrombocytosis (PLT > 500k) · leukocytosis (WBC > 50k) · prolonged tourniquet · fist clenching" },
  { letter: "A", word: "Adrenal / Aldosterone", detail: "Hypoaldosteronism · Addison's disease · type 4 RTA · congenital adrenal hyperplasia" },
  { letter: "S", word: "Shift (Transcellular)", detail: "Metabolic acidosis (K+ exits cells) · insulin deficiency / DKA · hypertonicity · exercise · beta-blocker overdose · succinylcholine" },
  { letter: "T", word: "Type 4 RTA",       detail: "Hyporeninemic hypoaldosteronism · common in diabetics with mild-to-moderate CKD · often medication-related" },
];

const ELIMINATE = [
  { drug: "Furosemide", dose: "40–80 mg IV", onset: "1–2 h", note: "If adequate renal function · give with IVF if volume-depleted", color: T.teal },
  { drug: "Patiromer (Veltassa)", dose: "8.4g PO daily", onset: "7–24 h", note: "Better GI tolerance than SPS · hold other meds 3h before/after", color: T.teal },
  { drug: "Sodium Zirconium (Lokelma)", dose: "10g PO TID × 48h", onset: "1–2 h", note: "Fastest oral agent (FDA-approved) · acute + chronic hyperkalemia", color: T.green },
  { drug: "Sodium Polystyrene Sulfonate (Kayexalate)", dose: "15–30g PO/PR", onset: "4–6 h", note: "Avoid post-op / bowel obstruction / ileus — intestinal necrosis risk", color: T.gold },
  { drug: "Hemodialysis", dose: "Urgent nephrology", onset: "Immediate", note: "Most definitive · removes 25–50 mEq/h · for severe/refractory hyperkalemia", color: T.coral },
];

import { useNavigate } from "react-router-dom";
import NotryaHubHeader from "@/components/HubHeader/NotryaHubHeader";
import NotryaNav from "@/components/HubHeader/NotryaNav";

// ── Main Component ───────────────────────────────────────────────────────────
export default function HyperkalemiaHub({ onBack }) {
  const navigate = useNavigate();
  const handleBack = () => onBack ? onBack() : navigate("/CriticalProtocolsPage");
  const [tab, setTab]       = useState(0);
  const [kLevel, setKLevel] = useState("");
  const [step, setStep]     = useState(1);
  const TABS = ["Recognition", "Causes", "Treatment", "Monitoring"];

  const kNum   = parseFloat(kLevel);
  const isNum  = !isNaN(kNum) && kLevel !== "";
  const sev    = isNum ? kNum >= 6.5 ? "severe" : kNum >= 6.0 ? "moderate" : kNum >= 5.5 ? "mild" : "normal" : null;
  const sevMeta = {
    normal:   { label: "Normal / Low",  color: T.green,  action: "Investigate and treat underlying cause",                          ecgRisk: "None" },
    mild:     { label: "Mild",          color: T.gold,   action: "Shift + Eliminate · Monitor ECG · Treat cause",                   ecgRisk: "Peaked T waves" },
    moderate: { label: "Moderate",      color: T.amber,  action: "Calcium if ECG changes · Shift + Eliminate · Cardiac monitoring", ecgRisk: "PR prolongation · QRS widening" },
    severe:   { label: "Severe",        color: T.coral,  action: "Calcium NOW · Shift + Eliminate · Urgent nephrology · Likely HD", ecgRisk: "Wide QRS · Absent P waves · Risk of VF" },
  };

  // ── TAB 0: RECOGNITION ────────────────────────────────────────────────────
  const T0 = (
    <div>
      <div style={aBox(T.coral, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, marginBottom: 2 }}>Treat ECG changes regardless of K⁺ level</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>Any K⁺ with widened QRS, absent P waves, or sine wave pattern is a cardiac emergency. Do not wait for lab confirmation.</div>
      </div>

      <div style={sL()}>Enter Potassium Level</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
          <input
            value={kLevel}
            onChange={e => setKLevel(e.target.value)}
            placeholder="e.g. 6.2"
            type="number"
            step="0.1"
            style={{ flex: 1, padding: "10px 14px", background: T.glassMid, border: `1px solid ${isNum ? (sevMeta[sev]?.color || T.border) : T.border}`, borderRadius: 9, color: T.white, fontSize: 16, fontFamily: T.mono, fontWeight: 700, outline: "none" }}
          />
          <span style={{ fontSize: 13, color: T.muted, whiteSpace: "nowrap" }}>mEq/L</span>
        </div>
        {sev && sevMeta[sev] && (
          <div style={{ ...aBox(sevMeta[sev].color, 0) }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: sevMeta[sev].color }}>{sevMeta[sev].label} Hyperkalemia</span>
              <span style={{ ...tag(sevMeta[sev].color) }}>K⁺ {kLevel}</span>
            </div>
            <div style={{ fontSize: 11.5, color: T.muted, marginBottom: 4 }}>
              <span style={{ color: sevMeta[sev].color, fontWeight: 600 }}>ECG risk: </span>{sevMeta[sev].ecgRisk}
            </div>
            <div style={{ fontSize: 11.5, color: sevMeta[sev].color, fontWeight: 600 }}>→ {sevMeta[sev].action}</div>
          </div>
        )}
      </div>

      <div style={sL(T.gold)}>ECG Changes by Potassium Level</div>
      {ECG_CHANGES.map(({ range, color, ecg, risk }) => (
        <div key={range} style={{ ...G(), padding: "11px 14px", marginBottom: 8, borderLeft: `3px solid ${color}`, display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 700, color, minWidth: 70, flexShrink: 0 }}>{range}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: T.white, marginBottom: 2 }}>{ecg}</div>
          </div>
          <div style={{ ...tag(color), flexShrink: 0 }}>{risk}</div>
        </div>
      ))}

      <div style={sL(T.teal)}>Severity Thresholds</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {[
          { label: "Mild", range: "5.0–5.9", color: T.gold },
          { label: "Moderate", range: "6.0–6.4", color: T.amber },
          { label: "Severe", range: "≥ 6.5", color: T.coral },
        ].map(({ label, range, color }) => (
          <div key={label} style={{ ...card({ padding: "12px", textAlign: "center", borderColor: color + "40" }) }}>
            <div style={{ fontSize: 11, fontWeight: 700, color, marginBottom: 4 }}>{label}</div>
            <div style={{ fontFamily: T.mono, fontSize: 13, color: T.white }}>{range}</div>
            <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>mEq/L</div>
          </div>
        ))}
      </div>
      <div style={{ ...aBox(T.gold, 0), marginTop: 10 }}>
        <div style={{ fontSize: 11.5, color: T.muted }}>
          <span style={{ color: T.gold, fontWeight: 600 }}>Pseudohyperkalemia: </span>
          Always confirm with repeat non-hemolyzed sample if no ECG changes and clinical picture doesn't fit. Thrombocytosis (PLT &gt; 500k) or leukocytosis (WBC &gt; 50k) can falsely elevate K⁺.
        </div>
      </div>
    </div>
  );

  // ── TAB 1: CAUSES ─────────────────────────────────────────────────────────
  const T1 = (
    <div>
      <div style={aBox(T.teal, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.teal, marginBottom: 2 }}>C-DIGFAST Mnemonic</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>Systematic approach to identifying the etiology of hyperkalemia. Multiple causes often coexist — treat all contributing factors.</div>
      </div>

      {CDIGFAST.map(({ letter, word, detail }) => (
        <div key={letter} style={{ ...G(), padding: "13px 15px", marginBottom: 8, display: "flex", gap: 14, alignItems: "flex-start" }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: T.teal + "22", border: `1.5px solid ${T.teal}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: T.teal, fontFamily: T.mono, flexShrink: 0 }}>
            {letter}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.white, marginBottom: 3 }}>{word}</div>
            <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.5 }}>{detail}</div>
          </div>
        </div>
      ))}

      <div style={sL(T.gold)}>Workup</div>
      <div style={{ ...card() }}>
        {[
          { test: "Repeat BMP", why: "Confirm — rule out pseudohyperkalemia" },
          { test: "12-lead ECG", why: "Immediate — guide treatment urgency" },
          { test: "BUN / Creatinine", why: "Renal function assessment" },
          { test: "Urinalysis + urine electrolytes", why: "Urine K+ and TTKG if adrenal cause suspected" },
          { test: "Serum aldosterone / renin", why: "If adrenal etiology suspected" },
          { test: "ABG / VBG", why: "Acid-base status — metabolic acidosis shifts K+ out of cells" },
          { test: "Medication reconciliation", why: "ACE-I / ARB / K-sparing diuretics / TMP" },
          { test: "CBC", why: "Rule out thrombocytosis or leukocytosis (pseudohyperkalemia)" },
        ].map(({ test, why }, i) => (
          <div key={test} style={{ display: "flex", gap: 10, paddingBottom: 7, marginBottom: 7, borderBottom: i < 7 ? `1px solid ${T.border}` : "none" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.teal, minWidth: 160, flexShrink: 0 }}>{test}</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>{why}</div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── TAB 2: TREATMENT ──────────────────────────────────────────────────────
  const STEPS = [
    {
      n: 1, label: "STABILIZE", sublabel: "Membrane Protection", color: T.coral,
      bg: "rgba(244,63,94,0.10)", icon: "🛡",
      when: "Any ECG changes · K⁺ ≥ 6.5 · or symptomatic (weakness, palpitations)",
      note: "Does NOT lower K⁺ — buys time while other treatments take effect",
      agents: [
        { drug: "Calcium Gluconate 1g IV", dose: "Over 2–3 min (preferred — less caustic)", onset: "1–3 min", duration: "30–60 min" },
        { drug: "Calcium Chloride 1g IV", dose: "Over 2–3 min · central line preferred (3× more elemental Ca)", onset: "1–3 min", duration: "30–60 min" },
      ],
      pearl: "Repeat q 5 min if ECG changes persist. Hold if patient on digoxin (calcium can worsen toxicity — give slowly over 20 min).",
    },
    {
      n: 2, label: "SHIFT", sublabel: "Push K⁺ Into Cells", color: T.gold,
      bg: "rgba(245,158,11,0.10)", icon: "⬇",
      when: "All moderate-to-severe hyperkalemia — start simultaneously with calcium",
      note: "Temporary effect only (4–6h) — must follow with elimination",
      agents: [
        { drug: "Regular Insulin 10 units IV", dose: "+ Dextrose 25g (1 amp D50) if glucose < 250 mg/dL", onset: "15–30 min", duration: "4–6 h" },
        { drug: "Albuterol 10–20 mg nebulized", dose: "High-dose · synergistic with insulin", onset: "15–30 min", duration: "2 h" },
        { drug: "Sodium Bicarbonate 150 mEq IV", dose: "Over 2–4h · only effective if metabolic acidosis present", onset: "30–60 min", duration: "Variable" },
      ],
      pearl: "Monitor glucose q 1h after insulin — hypoglycemia risk. Bicarb has minimal effect in ESRD. Albuterol may not work if on non-selective beta-blockers.",
    },
    {
      n: 3, label: "ELIMINATE", sublabel: "Remove K⁺ from Body", color: T.teal,
      bg: "rgba(20,184,166,0.10)", icon: "🗑",
      when: "All patients — definitive treatment. Choose agent based on renal function and urgency.",
      note: "This is the only step that actually removes potassium from the body",
      agents: [],
      pearl: "Dialysis is the fastest and most reliable elimination method for severe/refractory cases.",
    },
  ];

  const T2 = (
    <div>
      <div style={aBox(T.teal, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.teal, marginBottom: 2 }}>3-Step Approach: Stabilize → Shift → Eliminate</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>Steps 1 and 2 begin simultaneously for moderate-severe disease. Step 3 must follow — shift is temporary.</div>
      </div>

      <div style={sL()}>Treatment Ladder — tap to expand</div>

      {STEPS.map(({ n, label, sublabel, color, bg, icon, when, note, agents, pearl }) => (
        <div key={n}
          style={{ ...G(), padding: "14px 16px", marginBottom: 10, border: `1.5px solid ${step >= n ? color + "66" : T.border}`, background: step >= n ? bg : T.glass, cursor: "pointer", transition: "all 0.2s" }}
          onClick={() => setStep(step === n ? 0 : n)}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: step >= n ? color + "28" : T.glass, border: `2px solid ${step >= n ? color : T.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0, transition: "all 0.2s" }}>
              {icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 800, color: step >= n ? color : T.muted, letterSpacing: "0.05em" }}>STEP {n} — {label}</div>
              <div style={{ fontSize: 11.5, color: step >= n ? T.muted : T.dim, marginTop: 1 }}>{sublabel}</div>
            </div>
            <div style={{ fontSize: 14, color: step === n ? color : T.dim }}>{step === n ? "▲" : "▼"}</div>
          </div>

          {step === n && (
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${color}30` }}>
              <div style={{ ...aBox(color, 10) }}>
                <div style={{ fontSize: 11, fontWeight: 700, color, marginBottom: 2 }}>When to use</div>
                <div style={{ fontSize: 11.5, color: T.muted }}>{when}</div>
              </div>

              {agents.map(({ drug, dose, onset, duration }) => (
                <div key={drug} style={{ ...G({ marginBottom: 8, borderRadius: 10 }), padding: "11px 13px" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 4 }}>{drug}</div>
                  <div style={{ fontSize: 11.5, color: T.muted, marginBottom: 6, lineHeight: 1.4 }}>{dose}</div>
                  <div style={{ display: "flex", gap: 14 }}>
                    <span style={{ fontSize: 10.5, color: T.dim }}>Onset: <span style={{ fontFamily: T.mono, color: T.white }}>{onset}</span></span>
                    <span style={{ fontSize: 10.5, color: T.dim }}>Duration: <span style={{ fontFamily: T.mono, color: T.white }}>{duration}</span></span>
                  </div>
                </div>
              ))}

              {n === 3 && ELIMINATE.map(({ drug, dose, onset, note: agentNote, color: ac }) => (
                <div key={drug} style={{ ...G({ marginBottom: 8, borderRadius: 10, borderLeft: `3px solid ${ac}` }), padding: "11px 13px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: ac }}>{drug}</span>
                    <span style={{ fontFamily: T.mono, fontSize: 11, color: ac }}>{onset}</span>
                  </div>
                  <div style={{ fontFamily: T.mono, fontSize: 11.5, color: T.white, marginBottom: 3 }}>{dose}</div>
                  <div style={{ fontSize: 11, color: T.muted }}>{agentNote}</div>
                </div>
              ))}

              <div style={{ ...aBox(T.gold, 0), marginTop: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.gold, marginBottom: 2 }}>⚡ Pearl</div>
                <div style={{ fontSize: 11.5, color: T.muted }}>{pearl}</div>
              </div>

              <div style={{ fontSize: 11.5, color: T.dim, marginTop: 10, fontStyle: "italic" }}>
                Note: {note}
              </div>
            </div>
          )}
        </div>
      ))}

      <div style={{ ...aBox(T.coral, 0) }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: T.coral, marginBottom: 2 }}>⚠ Digoxin Toxicity + Hyperkalemia</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>
          Calcium is relatively contraindicated (may worsen digoxin toxicity). If needed: give calcium gluconate 1g over 20–30 min slow infusion. Consider Digibind (digoxin-specific antibodies) for severe toxicity.
        </div>
      </div>
    </div>
  );

  // ── TAB 3: MONITORING ─────────────────────────────────────────────────────
  const T3 = (
    <div>
      <div style={sL(T.teal)}>Recheck Schedule</div>
      {[
        { time: "15–30 min", action: "Repeat ECG after calcium administration", color: T.coral },
        { time: "1 hour", action: "Glucose check after insulin · Recheck K⁺", color: T.gold },
        { time: "2 hours", action: "Repeat K⁺ and ECG if initial changes present", color: T.gold },
        { time: "4–6 hours", action: "Recheck K⁺ after shift agents wear off · ensure elimination in progress", color: T.teal },
        { time: "Continuous", action: "Cardiac monitor until K⁺ < 5.5 and ECG normalized", color: T.green },
      ].map(({ time, action, color }) => (
        <div key={time} style={{ ...G(), padding: "11px 14px", marginBottom: 8, display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 700, color, minWidth: 80, flexShrink: 0 }}>{time}</div>
          <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.4 }}>{action}</div>
        </div>
      ))}

      <div style={sL(T.green)}>Response Targets</div>
      {[
        "K⁺ trending down from baseline",
        "ECG normalization: peaked T waves resolving, QRS narrowing",
        "Glucose 80–180 mg/dL after insulin administration",
        "Resolution of symptoms (weakness, palpitations, chest pain)",
        "MAP ≥ 65 mmHg · stable rhythm on monitor",
      ].map((t, i) => (
        <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 8, marginBottom: 6 }}>
          <span style={{ color: T.green }}>✓</span>{t}
        </div>
      ))}

      <div style={sL(T.coral)}>Escalation Triggers</div>
      {[
        "K⁺ not falling after 1h of treatment → reassess cause and consider HD",
        "ECG worsening (QRS widening, new arrhythmia) → repeat calcium + urgent nephrology",
        "Glucose < 70 mg/dL after insulin → D50 1 amp IV, recheck q 15 min",
        "Hypotension or hemodynamic instability → IV fluid bolus, vasopressors if needed",
        "Respiratory failure or severe weakness → airway management",
      ].map((t, i) => (
        <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 8, marginBottom: 7, lineHeight: 1.4 }}>
          <span style={{ color: T.coral, flexShrink: 0 }}>⚠</span>{t}
        </div>
      ))}

      <div style={sL(T.gold)}>Common Pitfalls</div>
      <div style={{ ...card() }}>
        {[
          { pitfall: "Treating without ECG", fix: "Always get 12-lead immediately — ECG drives urgency, not K⁺ number alone" },
          { pitfall: "Skipping elimination", fix: "Insulin/albuterol only shift K⁺ temporarily — always ensure elimination is underway" },
          { pitfall: "Forgetting glucose monitoring", fix: "Hypoglycemia after insulin is common and dangerous — check q 1h minimum" },
          { pitfall: "Bicarb in ESRD", fix: "Minimal effect in dialysis patients — prioritize insulin + albuterol + HD" },
          { pitfall: "Calcium in digoxin toxicity", fix: "Give slowly over 20–30 min or consider Digibind first" },
        ].map(({ pitfall, fix }, i) => (
          <div key={i} style={{ paddingBottom: 8, marginBottom: 8, borderBottom: i < 4 ? `1px solid ${T.border}` : "none" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.gold, marginBottom: 2 }}>⚠ {pitfall}</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>{fix}</div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: `radial-gradient(ellipse 70% 40% at 20% 0%, rgba(20,184,166,0.09) 0%, transparent 60%), radial-gradient(ellipse 50% 35% at 85% 95%, rgba(245,158,11,0.07) 0%, transparent 55%), ${T.bg}`, fontFamily: T.sans, color: T.white }}>
      <NotryaNav currentHub="HyperkalemiaHub" />
      <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", minWidth: 0, paddingBottom: 80 }}>
        <NotryaHubHeader hubName="Hyperkalemia Hub" category="Critical Care" homeUrl="/" />

      <div style={{ display: "flex", gap: 4, padding: "0 20px", marginBottom: 18, overflowX: "auto", scrollbarWidth: "none" }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            style={{ padding: "7px 15px", borderRadius: 9, border: `1.5px solid ${tab === i ? T.teal : T.border}`, background: tab === i ? "rgba(20,184,166,0.14)" : T.glass, color: tab === i ? T.teal : T.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.sans, whiteSpace: "nowrap", transition: "all 0.18s", backdropFilter: "blur(8px)" }}>
            {t}
          </button>
        ))}
      </div>

      <div style={{ padding: "0 20px" }}>
        {tab === 0 && T0}
        {tab === 1 && T1}
        {tab === 2 && T2}
        {tab === 3 && T3}
      </div>
      </div>
    </div>
  );
}