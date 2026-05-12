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
const sL   = (c = T.amber) => ({ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: c, margin: "18px 0 10px", display: "flex", alignItems: "center", gap: 8 });
const dv   = { height: 1, background: T.border, margin: "10px 0" };

// ── BWPS Score Data ───────────────────────────────────────────────────────────
const BWPS_CATEGORIES = [
  {
    cat: "Temperature", icon: "🌡",
    options: [
      { label: "< 37.2°C (< 99°F)",           pts: 0 },
      { label: "37.2–37.7°C (99–99.9°F)",      pts: 5 },
      { label: "37.8–38.2°C (100–100.8°F)",    pts: 10 },
      { label: "38.3–38.8°C (101–101.8°F)",    pts: 15 },
      { label: "38.9–39.4°C (102–103°F)",      pts: 20 },
      { label: "39.5–39.9°C (103–103.9°F)",    pts: 25 },
      { label: "≥ 40°C (≥ 104°F)",             pts: 30 },
    ],
  },
  {
    cat: "CNS Effects", icon: "🧠",
    options: [
      { label: "None",                                             pts: 0 },
      { label: "Mild (agitation)",                                 pts: 10 },
      { label: "Moderate (delirium, psychosis, extreme lethargy)", pts: 20 },
      { label: "Severe (seizures, coma)",                          pts: 30 },
    ],
  },
  {
    cat: "GI / Hepatic", icon: "🔴",
    options: [
      { label: "None",                                              pts: 0 },
      { label: "Moderate (nausea/vomiting/diarrhea/abdominal pain)", pts: 10 },
      { label: "Severe (unexplained jaundice)",                     pts: 20 },
    ],
  },
  {
    cat: "Heart Rate", icon: "❤️",
    options: [
      { label: "< 100 bpm",    pts: 0 },
      { label: "100–109 bpm",  pts: 5 },
      { label: "110–119 bpm",  pts: 10 },
      { label: "120–129 bpm",  pts: 15 },
      { label: "130–139 bpm",  pts: 20 },
      { label: "≥ 140 bpm",    pts: 25 },
    ],
  },
  {
    cat: "Atrial Fibrillation", icon: "〜",
    options: [
      { label: "Absent",  pts: 0 },
      { label: "Present", pts: 10 },
    ],
  },
  {
    cat: "Congestive Heart Failure", icon: "🫁",
    options: [
      { label: "Absent",                     pts: 0 },
      { label: "Mild (pedal edema)",         pts: 5 },
      { label: "Moderate (bibasilar rales)", pts: 10 },
      { label: "Severe (pulmonary edema)",   pts: 15 },
    ],
  },
  {
    cat: "Precipitant History", icon: "⚡",
    options: [
      { label: "None identified",                              pts: 0 },
      { label: "Positive (infection, surgery, iodine load, etc.)", pts: 10 },
    ],
  },
];

const TX_STEPS = [
  {
    n: 1, label: "BETA-BLOCKER", timing: "Immediately — first", color: T.blue,
    bg: "rgba(59,130,246,0.09)", icon: "1️⃣",
    rationale: "Controls HR, tremor, diaphoresis, hemodynamics. High-dose propranolol also blocks peripheral T4→T3 conversion.",
    agents: [
      { drug: "Propranolol",        dose: "60–80 mg PO q 4–6h",                              alt: "OR 0.5–1 mg IV over 10 min q 15 min (max 6 mg IV total)",      note: "Preferred — blocks T4→T3 peripheral conversion at high doses" },
      { drug: "Esmolol",            dose: "500 mcg/kg bolus → 50–200 mcg/kg/min infusion",    alt: "If unable to take PO or hemodynamically unstable",              note: "Easiest to titrate — ultra-short acting" },
      { drug: "Atenolol / Metoprolol", dose: "25–50 mg PO q 6h (atenolol) or 25–50 mg IV",  alt: "Alternatives if propranolol unavailable",                        note: "Less effect on T4→T3 conversion" },
    ],
    avoid: "Avoid beta-blockers if cardiogenic shock or severe bronchospasm — use cautiously with heart block",
  },
  {
    n: 2, label: "THIONAMIDE", timing: "Immediately after beta-blocker — BEFORE iodine", color: T.coral,
    bg: "rgba(244,63,94,0.09)", icon: "2️⃣",
    rationale: "Blocks new thyroid hormone synthesis. PTU preferred in storm — also blocks peripheral T4→T3 conversion. Takes 1–2 weeks to fully work.",
    agents: [
      { drug: "PTU (Propylthiouracil)", dose: "500–1000 mg PO loading dose → 250 mg q 4h",  alt: "Give via NG tube if unable to swallow",                          note: "PREFERRED in thyroid storm — dual mechanism (synthesis + conversion blockade)" },
      { drug: "Methimazole",            dose: "20–40 mg PO q 4–6h",                          alt: "If PTU unavailable or severe hepatotoxicity concern",            note: "Does NOT block peripheral conversion · preferred in pregnancy (except 1st trimester)" },
    ],
    avoid: "No IV formulation exists for either agent — always PO or NG",
  },
  {
    n: 3, label: "IODINE", timing: "≥ 1 HOUR AFTER thionamide — critical delay", color: T.gold,
    bg: "rgba(245,158,11,0.09)", icon: "3️⃣",
    rationale: "Blocks thyroid hormone RELEASE (Wolff-Chaikoff effect). MUST give thionamide first — iodine without thionamide provides substrate for MORE hormone synthesis (Jod-Basedow).",
    agents: [
      { drug: "SSKI (Saturated KI)",  dose: "5 drops (250 mg) PO q 6h",                   alt: "Mix in water or juice",                             note: "Most commonly used · rapid onset" },
      { drug: "Lugol's Solution",     dose: "8–10 drops PO q 6–8h",                        alt: "Contains 5% iodine + 10% KI",                       note: "Alternative to SSKI" },
      { drug: "Sodium Iodide",        dose: "500 mg IV q 12h",                              alt: "If unable to take PO",                              note: "IV formulation — only if PO route impossible" },
    ],
    avoid: "NEVER give iodine before thionamide — will worsen thyroid storm by providing hormone synthesis substrate",
  },
  {
    n: 4, label: "GLUCOCORTICOIDS", timing: "With or after iodine", color: T.teal,
    bg: "rgba(20,184,166,0.09)", icon: "4️⃣",
    rationale: "Blocks peripheral T4→T3 conversion. Treats relative adrenal insufficiency from hypermetabolic state. Anti-inflammatory effects.",
    agents: [
      { drug: "Dexamethasone",   dose: "2 mg IV q 6h × 4 doses", alt: "Preferred — longest duration, most potent T4→T3 blockade", note: "Does not interfere with cortisol assay" },
      { drug: "Hydrocortisone",  dose: "100 mg IV q 8h",          alt: "Alternative if dexamethasone unavailable",                  note: "Also provides mineralocorticoid effect" },
    ],
    avoid: "Not contraindicated in thyroid storm — benefit outweighs risk even without confirmed adrenal insufficiency",
  },
  {
    n: 5, label: "ADJUNCTS", timing: "Simultaneously", color: T.purple,
    bg: "rgba(167,139,250,0.09)", icon: "5️⃣",
    rationale: "Supportive treatments targeting fever, enterohepatic hormone recirculation, and refractory cases.",
    agents: [
      { drug: "Acetaminophen",         dose: "650–1000 mg PO/PR/IV q 6h",  alt: "For fever reduction",                              note: "AVOID aspirin/NSAIDs — displace T4/T3 from protein binding" },
      { drug: "Cholestyramine",        dose: "4g PO q 6h",                  alt: "Reduces enterohepatic recirculation of T3/T4",     note: "Adjunct — binds thyroid hormones in gut" },
      { drug: "Benzodiazepines",       dose: "Lorazepam 1–2 mg IV",         alt: "Diazepam 5–10 mg IV",                              note: "Symptomatic control of CNS hyperactivity / seizures" },
      { drug: "Plasmapheresis / TPE",  dose: "Per apheresis team",           alt: "Last resort for refractory storm",                 note: "Removes circulating T3/T4 directly — very high-mortality cases only" },
    ],
    avoid: "Aspirin and NSAIDs are specifically contraindicated — increase free T3/T4",
  },
];

import { useNavigate } from "react-router-dom";

// ── Main Component ───────────────────────────────────────────────────────────
export default function ThyroidStormHub({ onBack }) {
  const navigate = useNavigate();
  const handleBack = () => onBack ? onBack() : navigate("/CriticalProtocolsPage");
  const [tab, setTab]       = useState(0);
  const [bwps, setBwps]     = useState({});
  const [txStep, setTxStep] = useState(null);
  const TABS = ["Recognition", "Treatment", "Workup", "Monitoring"];

  const bwpsScore = BWPS_CATEGORIES.reduce((sum, cat) => {
    const sel = bwps[cat.cat];
    return sum + (sel !== undefined ? cat.options[sel].pts : 0);
  }, 0);

  const bwpsInterp = bwpsScore >= 45
    ? { label: "THYROID STORM",       color: T.coral, action: "Treat aggressively — full protocol immediately" }
    : bwpsScore >= 25
    ? { label: "IMPENDING STORM",     color: T.amber, action: "Treat as storm — do not wait for labs" }
    : { label: "Unlikely Thyroid Storm", color: T.green, action: "Consider alternative diagnosis · monitor closely if high suspicion" };

  const completedCats = Object.keys(bwps).length;

  // ── TAB 0: RECOGNITION ────────────────────────────────────────────────────
  const Tab0 = (
    <div>
      <div style={aBox(T.coral, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, marginBottom: 2 }}>Clinical Diagnosis — Do NOT Wait for Labs to Treat</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>Thyroid storm is diagnosed clinically using the Burch-Wartofsky Point Scale. TFTs do not distinguish storm from uncomplicated thyrotoxicosis. Mortality 10–30% even with treatment.</div>
      </div>

      <div style={sL()}>Burch-Wartofsky Point Scale (BWPS) Calculator</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: T.amber }}>Complete all categories</span>
          <span style={{ fontSize: 11, color: T.dim }}>{completedCats} / {BWPS_CATEGORIES.length} completed</span>
        </div>

        {BWPS_CATEGORIES.map(cat => (
          <div key={cat.cat} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: T.white, marginBottom: 6 }}>
              {cat.icon} {cat.cat}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {cat.options.map((opt, idx) => {
                const sel = bwps[cat.cat] === idx;
                return (
                  <div key={idx}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 11px", borderRadius: 8, border: `1px solid ${sel ? T.amber + "80" : T.border}`, background: sel ? "rgba(245,158,11,0.14)" : T.glassMid, cursor: "pointer", transition: "all 0.15s" }}
                    onClick={() => setBwps(p => ({ ...p, [cat.cat]: p[cat.cat] === idx ? undefined : idx }))}>
                    <span style={{ fontSize: 11.5, color: sel ? T.white : T.muted }}>{opt.label}</span>
                    <span style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 700, color: sel ? T.amber : T.dim }}>+{opt.pts}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div style={dv} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: T.white }}>BWPS Score</span>
          <span style={{ fontFamily: T.mono, fontSize: 28, fontWeight: 800, color: bwpsInterp.color }}>{bwpsScore}</span>
        </div>
        <div style={aBox(bwpsInterp.color, 0)}>
          <div style={{ fontSize: 13, fontWeight: 800, color: bwpsInterp.color, marginBottom: 3 }}>{bwpsInterp.label}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{bwpsInterp.action}</div>
        </div>
        <button onClick={() => setBwps({})}
          style={{ marginTop: 10, padding: "5px 12px", borderRadius: 7, border: `1px solid ${T.border}`, background: T.glass, color: T.dim, fontSize: 11, cursor: "pointer", fontFamily: T.sans }}>
          Reset Score
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 7, marginBottom: 16 }}>
        {[{ range: "< 25", label: "Unlikely", color: T.green }, { range: "25–44", label: "Impending", color: T.amber }, { range: "≥ 45", label: "Storm", color: T.coral }].map(({ range, label, color }) => (
          <div key={range} style={{ ...G({ borderRadius: 9 }), padding: "10px", textAlign: "center", borderColor: color + "40" }}>
            <div style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 800, color }}>{range}</div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={sL()}>Clinical Features</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
        <div style={card({ padding: "12px 13px", borderLeft: `3px solid ${T.amber}` })}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.amber, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 7 }}>Hyperthyroid Features</div>
          {["Heat intolerance / diaphoresis", "Weight loss despite hyperphagia", "Tremor / restlessness", "Goiter (Graves' / toxic nodule)", "Exophthalmos (Graves' disease)", "Lid lag / lid retraction"].map((s, i) => (
            <div key={i} style={{ fontSize: 11, color: T.muted, marginBottom: 3, display: "flex", gap: 5 }}><span style={{ color: T.amber }}>●</span>{s}</div>
          ))}
        </div>
        <div style={card({ padding: "12px 13px", borderLeft: `3px solid ${T.coral}` })}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.coral, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 7 }}>Storm-Specific</div>
          {["High fever (often > 40°C)", "Extreme tachycardia (often > 140)", "Atrial fibrillation", "Delirium / psychosis / coma", "Heart failure / pulmonary edema", "Jaundice (hepatic dysfunction)"].map((s, i) => (
            <div key={i} style={{ fontSize: 11, color: T.muted, marginBottom: 3, display: "flex", gap: 5 }}><span style={{ color: T.coral }}>●</span>{s}</div>
          ))}
        </div>
      </div>

      <div style={sL(T.purple)}>Common Precipitants</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
        {[
          { p: "Infection",           d: "Most common — any systemic infection",                    color: T.coral },
          { p: "Surgery / Procedures", d: "Thyroid surgery without prep · any major surgery",       color: T.amber },
          { p: "Iodine Load",          d: "IV contrast · amiodarone (37% iodine) · supplements",    color: T.gold },
          { p: "RAI in Unprepared",    d: "Radioiodine without antithyroid pre-treatment",          color: T.amber },
          { p: "Medication Cessation", d: "Abrupt stop of PTU/methimazole",                        color: T.blue },
          { p: "Acute Illness",        d: "MI · PE · stroke · trauma · childbirth · DKA",           color: T.purple },
        ].map(({ p, d, color }) => (
          <div key={p} style={{ ...G({ borderRadius: 9 }), padding: "10px 12px" }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color, marginBottom: 2 }}>{p}</div>
            <div style={{ fontSize: 11, color: T.muted }}>{d}</div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── TAB 1: TREATMENT ──────────────────────────────────────────────────────
  const Tab1 = (
    <div>
      <div style={{ ...G({ borderRadius: 14, border: `2px solid ${T.coral}50`, background: "rgba(244,63,94,0.08)", marginBottom: 16 }), padding: "14px" }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: T.coral, marginBottom: 6 }}>⚠ TREATMENT ORDER IS CRITICAL</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["1. Beta-blocker", "2. PTU/Methimazole", "3. Iodine (≥1h after PTU)", "4. Dexamethasone", "5. Adjuncts"].map((s, i) => (
            <span key={i} style={{ ...tag([T.blue, T.coral, T.gold, T.teal, T.purple][i]), fontSize: 10.5 }}>{s}</span>
          ))}
        </div>
        <div style={{ fontSize: 11.5, color: T.muted, marginTop: 8 }}>
          Iodine before thionamide = Jod-Basedow = catastrophic worsening. Always PTU first, then wait ≥1h, then iodine.
        </div>
      </div>

      {TX_STEPS.map(({ n, label, timing, color, bg, icon, rationale, agents, avoid }) => {
        const open = txStep === n;
        return (
          <div key={n}
            style={{ ...G(), padding: "13px 15px", marginBottom: 9, border: `1.5px solid ${open ? color + "65" : T.border}`, background: open ? bg : T.glass, cursor: "pointer", transition: "all 0.2s" }}
            onClick={() => setTxStep(open ? null : n)}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: open ? color + "25" : T.glass, border: `2px solid ${open ? color : T.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0, transition: "all 0.2s" }}>{icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 800, color: open ? color : T.muted, letterSpacing: "0.05em" }}>STEP {n} — {label}</div>
                <div style={{ ...tag(color), fontSize: 9.5, marginTop: 4 }}>{timing}</div>
              </div>
              <div style={{ fontSize: 13, color: open ? color : T.dim }}>{open ? "▲" : "▼"}</div>
            </div>

            {open && (
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${color}30` }}>
                <div style={aBox(color, 12)}>
                  <div style={{ fontSize: 11, fontWeight: 700, color, marginBottom: 2 }}>Rationale</div>
                  <div style={{ fontSize: 11.5, color: T.muted }}>{rationale}</div>
                </div>

                {agents.map(({ drug, dose, alt, note }) => (
                  <div key={drug} style={{ ...G({ borderRadius: 10, marginBottom: 8 }), padding: "11px 13px" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 4 }}>{drug}</div>
                    <div style={{ fontFamily: T.mono, fontSize: 12, color: T.white, marginBottom: 3 }}>{dose}</div>
                    <div style={{ fontSize: 11.5, color: T.dim, marginBottom: 3 }}>{alt}</div>
                    <div style={{ fontSize: 11.5, color: T.muted }}>{note}</div>
                  </div>
                ))}

                <div style={aBox(T.coral, 0)}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.coral, marginBottom: 2 }}>✗ Avoid</div>
                  <div style={{ fontSize: 11.5, color: T.muted }}>{avoid}</div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <div style={sL(T.teal)}>Complication-Specific Treatment</div>
      {[
        { comp: "Atrial Fibrillation", tx: "Rate control with propranolol (preferred) · avoid digoxin — thyrotoxicosis causes digoxin resistance · cardioversion deferred until euthyroid (high recurrence) · anticoagulate per CHA₂DS₂-VASc", color: T.blue },
        { comp: "Hyperthermia",        tx: "Cooling blankets · ice packs · acetaminophen · AVOID aspirin/NSAIDs (displace T4/T3 from protein binding → worsen toxicity)", color: T.amber },
        { comp: "Heart Failure",       tx: "Loop diuretics (after rate control with beta-blocker) · afterload reduction · avoid vasodilators if tachycardic without rate control first", color: T.coral },
        { comp: "Agitation / Seizures", tx: "Benzodiazepines (lorazepam 1–2 mg IV) for immediate control · standard AED protocol for status epilepticus · physical cooling for hyperthermia-induced seizures", color: T.purple },
      ].map(({ comp, tx, color }) => (
        <div key={comp} style={{ ...G(), padding: "11px 13px", marginBottom: 8, borderLeft: `3px solid ${color}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 3 }}>{comp}</div>
          <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{tx}</div>
        </div>
      ))}
    </div>
  );

  // ── TAB 2: WORKUP ─────────────────────────────────────────────────────────
  const Tab2 = (
    <div>
      <div style={aBox(T.amber, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.amber, marginBottom: 2 }}>TFTs Do NOT Diagnose Thyroid Storm</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>Thyroid hormone levels in thyroid storm are NOT higher than in uncomplicated thyrotoxicosis. Clinical score (BWPS) makes the diagnosis. Order TFTs to confirm hyperthyroidism and identify etiology.</div>
      </div>

      <div style={sL()}>Thyroid Function Tests</div>
      {[
        { test: "TSH",         expected: "Suppressed (< 0.01 mIU/L) — always in thyroid storm",     interp: "Normal TSH essentially rules out thyroid storm", color: T.coral },
        { test: "Free T4",     expected: "Elevated (often markedly)",                                interp: "Cannot distinguish storm from uncomplicated thyrotoxicosis by level alone", color: T.amber },
        { test: "Free T3",     expected: "Elevated — often disproportionately high",                 interp: "T3 toxicosis: elevated T3 with normal T4 (seen with toxic nodule)", color: T.gold },
        { test: "TSI / TRAb",  expected: "Positive in Graves' disease (70–95% sensitivity)",         interp: "Confirms autoimmune etiology · TSI = stimulating, TRAb = binding antibody", color: T.teal },
        { test: "Anti-TPO / Anti-TG", expected: "May be positive in Graves' / Hashimoto's",        interp: "Elevated in autoimmune thyroiditis — less specific than TSI", color: T.blue },
      ].map(({ test, expected, interp, color }) => (
        <div key={test} style={{ ...card({ marginBottom: 8 }) }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 5 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color }}>{test}</span>
            <span style={{ fontFamily: T.mono, fontSize: 11, color, marginLeft: 8 }}>{expected}</span>
          </div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{interp}</div>
        </div>
      ))}

      <div style={sL(T.teal)}>Essential Ancillary Labs</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        {[
          { test: "BMP",              why: "Hypercalcemia (thyrotoxicosis activates osteoclasts) · pre-renal AKI · glucose" },
          { test: "LFTs",             why: "Hepatic dysfunction common in storm · PTU and methimazole both hepatotoxic — baseline essential" },
          { test: "CBC",              why: "Infection as precipitant · PTU/methimazole-induced agranulocytosis (rare but fatal — WBC important)" },
          { test: "Coagulation",      why: "DIC from hepatic failure · consumptive coagulopathy in severe storm" },
          { test: "Blood cultures",   why: "Infection is most common precipitant — cultures before antibiotics if febrile" },
          { test: "Cortisol",         why: "Relative adrenal insufficiency may coexist — Graves' + adrenal insufficiency (polyglandular autoimmune type 2)" },
          { test: "Calcium",          why: "Hypercalcemia in thyrotoxicosis (PTH-independent bone resorption)" },
          { test: "β-hCG",            why: "Pregnancy — molar pregnancy (hCG cross-reacts with TSH receptor) · gestational thyrotoxicosis" },
        ].map(({ test, why }, i) => (
          <div key={test} style={{ display: "flex", gap: 10, paddingBottom: 6, marginBottom: 6, borderBottom: i < 7 ? `1px solid ${T.border}` : "none" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.teal, minWidth: 110, flexShrink: 0 }}>{test}</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>{why}</div>
          </div>
        ))}
      </div>

      <div style={sL(T.purple)}>Cardiac Investigations</div>
      {[
        { test: "12-Lead ECG",    find: "Sinus tachycardia · atrial fibrillation · ST changes from rate-related ischemia · SVT", color: T.blue },
        { test: "Echocardiogram", find: "Thyrotoxic cardiomyopathy · high-output heart failure · LV dilation · pulmonary hypertension · RV strain if AF", color: T.teal },
        { test: "Chest X-ray",    find: "Pulmonary edema (high-output HF) · pleural effusions · cardiomegaly", color: T.purple },
      ].map(({ test, find, color }) => (
        <div key={test} style={{ ...G(), padding: "10px 13px", marginBottom: 7, borderLeft: `3px solid ${color}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 2 }}>{test}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{find}</div>
        </div>
      ))}

      <div style={sL(T.gold)}>Thyroid Imaging</div>
      {[
        { mod: "Thyroid Ultrasound",      use: "Goiter characterization · toxic nodule vs diffuse Graves' · vascularity (Graves' = markedly increased on Doppler)", color: T.gold },
        { mod: "Radioiodine Uptake (RAIU)", use: "Differentiates hyperthyroidism causes — CONTRAINDICATED in acute storm · after stabilization only · Graves' = diffuse; toxic nodule = focal; thyroiditis = low uptake", color: T.amber },
      ].map(({ mod, use, color }) => (
        <div key={mod} style={{ ...G(), padding: "10px 13px", marginBottom: 7, borderLeft: `3px solid ${color}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 2 }}>{mod}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{use}</div>
        </div>
      ))}
    </div>
  );

  // ── TAB 3: MONITORING ─────────────────────────────────────────────────────
  const Tab3 = (
    <div>
      <div style={sL()}>Response Targets</div>
      {[
        { target: "Heart Rate",     goal: "< 100 bpm",            note: "Primary endpoint · titrate beta-blocker to achieve", color: T.coral },
        { target: "Temperature",    goal: "< 37.5°C (< 99.5°F)",  note: "Active cooling + acetaminophen · fever resolution expected 12–24h", color: T.amber },
        { target: "Mental Status",  goal: "Return to baseline",    note: "Agitation and delirium resolve as HR and temperature normalize", color: T.purple },
        { target: "Blood Pressure", goal: "MAP ≥ 65 mmHg",         note: "Hypotension from high-output failure or distributive shock", color: T.blue },
        { target: "Free T4 / T3",   goal: "Trending down",         note: "TFTs may not normalize for 1–4 weeks even with effective treatment — clinical response is primary guide", color: T.teal },
        { target: "Urine Output",   goal: "≥ 0.5 mL/kg/h",        note: "Renal hypoperfusion from high-output failure or dehydration", color: T.green },
      ].map(({ target, goal, note, color }) => (
        <div key={target} style={{ ...G(), padding: "9px 12px", marginBottom: 6, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color, minWidth: 120, flexShrink: 0 }}>{target}</div>
          <div>
            <div style={{ fontFamily: T.mono, fontSize: 12, color: T.white, marginBottom: 2 }}>{goal}</div>
            <div style={{ fontSize: 11, color: T.muted }}>{note}</div>
          </div>
        </div>
      ))}

      <div style={sL()}>Monitoring Schedule</div>
      {[
        { freq: "Every 30 min × 4h", items: "HR · BP · temperature · mental status · SpO₂",                      color: T.coral },
        { freq: "Every 2–4h",        items: "Glucose · urine output · neuro checks · response to propranolol",    color: T.gold },
        { freq: "Every 6–12h",       items: "BMP · LFTs (PTU/MMI toxicity) · CBC (agranulocytosis watch)",        color: T.teal },
        { freq: "At 24–48h",         items: "Free T4 / free T3 / TSH · echocardiogram if HF persists · BWPS",    color: T.green },
        { freq: "Continuous",        items: "Cardiac monitor for AF and arrhythmia detection",                    color: T.purple },
      ].map(({ freq, items, color }) => (
        <div key={freq} style={{ ...G(), padding: "9px 12px", marginBottom: 6, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div style={{ fontFamily: T.mono, fontSize: 11.5, fontWeight: 700, color, minWidth: 130, flexShrink: 0 }}>{freq}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{items}</div>
        </div>
      ))}

      <div style={aBox(T.coral, 14)}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: T.coral, marginBottom: 3 }}>⚠ PTU / Methimazole Side Effects — Monitor Closely</div>
        <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.5 }}>
          Agranulocytosis (0.2–0.5%): fever + sore throat in patient on thionamide → STOP drug immediately → CBC STAT (ANC &lt; 500 = agranulocytosis). Hepatotoxicity: PTU &gt; methimazole (rare severe hepatitis). Check LFTs at baseline and during treatment.
        </div>
      </div>

      <div style={sL(T.teal)}>Escalation / Refractory Storm</div>
      {["HR > 140 despite adequate propranolol → switch to esmolol infusion + check compliance · add digoxin if AF with HF (despite resistance)",
        "Temperature > 40°C refractory → active external cooling + acetaminophen + treat infection aggressively",
        "Hemodynamic instability → ICU · vasopressors · consider plasmapheresis/TPE to remove circulating hormone",
        "Refractory to all medical therapy → plasmapheresis or therapeutic plasma exchange (TPE) — removes T3/T4 directly",
        "New-onset jaundice → hepatic failure from storm · stop PTU (switch to methimazole) · liver team consult"].map((t, i) => (
        <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 8, marginBottom: 7, lineHeight: 1.4 }}>
          <span style={{ color: T.coral, flexShrink: 0 }}>⚠</span>{t}
        </div>
      ))}

      <div style={sL(T.purple)}>Disposition &amp; Long-Term</div>
      <div style={{ ...card() }}>
        {[
          { label: "ICU",             detail: "All confirmed thyroid storm · BWPS ≥ 45 · hemodynamic instability · altered mentation · arrhythmia · cardiac failure" },
          { label: "Step-Down",       detail: "BWPS 25–44 (impending) · stable HR and temp · responding to treatment · close telemetry monitoring · endocrinology involved" },
          { label: "Endocrinology",   detail: "Consult immediately · guide thionamide dosing · plan for definitive therapy (RAI vs. surgery vs. long-term PTU) · follow-up within 1 week of discharge" },
          { label: "Definitive Rx",   detail: "After euthyroid state achieved: radioiodine ablation (Graves', most common) · thyroidectomy (large goiter, pregnancy, failed RAI) · long-term methimazole (18–24 months)" },
          { label: "Avoid Recurrence", detail: "Never abruptly stop antithyroid medications · stress-dose with illness · avoid iodine loads without thionamide coverage · check WBC if fever/sore throat on PTU/MMI" },
        ].map(({ label, detail }, i) => (
          <div key={i} style={{ display: "flex", gap: 10, paddingBottom: 7, marginBottom: 7, borderBottom: i < 4 ? `1px solid ${T.border}` : "none" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.purple, minWidth: 120, flexShrink: 0 }}>{label}</div>
            <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{detail}</div>
          </div>
        ))}
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
          <span style={pill("linear-gradient(135deg,#f59e0b,#b45309)")}>🔬 Endocrine</span>
          <span style={pill("linear-gradient(135deg,#0d9488,#065f46)")}>Burch-Wartofsky 1993</span>
        </div>
        <h1 style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 700, margin: "0 0 4px", lineHeight: 1.15 }}>Thyroid Storm</h1>
        <p style={{ color: T.muted, fontSize: 12, margin: "0 0 20px" }}>Interactive BWPS calculator · Treatment order matters · PTU before iodine · Dexamethasone · Complication management</p>
      </div>

      <div style={{ display: "flex", gap: 4, padding: "0 20px", marginBottom: 18, overflowX: "auto", scrollbarWidth: "none" }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            style={{ padding: "7px 15px", borderRadius: 9, border: `1.5px solid ${tab === i ? T.amber : T.border}`, background: tab === i ? "rgba(245,158,11,0.14)" : T.glass, color: tab === i ? T.amber : T.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.sans, whiteSpace: "nowrap", transition: "all 0.18s", backdropFilter: "blur(8px)" }}>
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