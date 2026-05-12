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
const sL   = (c = T.gold) => ({ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: c, margin: "18px 0 10px", display: "flex", alignItems: "center", gap: 8 });
const dv   = { height: 1, background: T.border, margin: "10px 0" };
const inp  = { padding: "9px 12px", background: T.glassMid, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 13, fontFamily: T.mono, fontWeight: 600, outline: "none" };

const CAUSES_TOP = [
  {
    cause: "Primary Hyperparathyroidism", pct: "~50%", color: T.gold, outpatient: true,
    detail: "Most common cause overall (outpatient) · usually mild (10.5–12 mg/dL) · autonomous PTH secretion · adenoma (80%) > hyperplasia > carcinoma · associated with MEN1/MEN2A",
    dx: "Elevated PTH (inappropriate normal or high) · low phosphate · hypercalciuria · osteoporosis · nephrolithiasis",
    tx: "Parathyroidectomy (curative) · cinacalcet for non-surgical candidates · adequate hydration · bisphosphonates for bone protection",
  },
  {
    cause: "Malignancy-Associated", pct: "~45%", color: T.coral, outpatient: false,
    detail: "Most common cause of HYPERCALCEMIC CRISIS (inpatient) · 4 mechanisms: PTHrP secretion (squamous cell · RCC · bladder) · osteolytic metastases (breast · multiple myeloma) · 1,25-OH2D production (lymphoma · granulomas) · ectopic PTH (rare)",
    dx: "PTH suppressed (low) · PTHrP elevated (humoral) · or osteolytic mets on imaging",
    tx: "Aggressive hydration · bisphosphonates · calcitonin · treat underlying malignancy · denosumab for bisphosphonate-refractory disease",
  },
  {
    cause: "Granulomatous Disease", pct: "~5%", color: T.purple,
    detail: "Sarcoidosis · TB · histoplasmosis · berylliosis · Crohn's disease · macrophages convert 25-OH-D to 1,25-OH2-D (calcitriol) → increased intestinal calcium absorption",
    dx: "Low PTH · elevated calcitriol (1,25-OH2D) · serum ACE elevated in sarcoidosis · calcium worsens in sunlight exposure",
    tx: "Glucocorticoids (hydrocortisone 200–300 mg/day or prednisone 40 mg/day) dramatically effective · avoid sun and vitamin D · hydroxychloroquine for chronic sarcoidosis",
  },
  {
    cause: "Vitamin D Toxicity", pct: "Rare", color: T.teal,
    detail: "Excessive supplementation (> 4000 IU/day chronically) · elevated 25-OH-D (not 1,25-OH2D) · fat-soluble vitamin → prolonged toxicity · can last weeks after stopping",
    dx: "Very high 25-OH-D (> 150 ng/mL) · suppressed PTH · normal calcitriol",
    tx: "Stop vitamin D · glucocorticoids · aggressive hydration · bisphosphonates if severe",
  },
  {
    cause: "Milk-Alkali Syndrome", pct: "Increasing", color: T.teal,
    detail: "Excessive calcium carbonate intake (OTC antacids · calcium supplements) + metabolic alkalosis + AKI · now 3rd most common cause due to supplement overuse",
    dx: "Hypercalcemia · metabolic alkalosis · elevated creatinine (AKI) · suppressed PTH",
    tx: "Stop calcium supplements and antacids · IV hydration · resolves in most cases without bisphosphonates",
  },
  {
    cause: "Medications", pct: "5–10%", color: T.blue,
    detail: "Thiazide diuretics (↓ renal Ca excretion) · lithium (alters PTH set point) · vitamin A toxicity · theophylline toxicity · immobilization (bone resorption) · excessive calcium infusions",
    dx: "Medication history · suppressed PTH (most) · elevated PTH with lithium/thiazide",
    tx: "Discontinue offending agent · hydration · bisphosphonates if severe",
  },
];

export default function HypercalcemiaHub({ onBack }) {
  const navigate = useNavigate();
  const handleBack = () => onBack ? onBack() : navigate("/CriticalProtocolsPage");

  const [tab, setTab]     = useState(0);
  const [ca, setCa]       = useState("");
  const [alb, setAlb]     = useState("");
  const [ionCa, setIonCa] = useState("");
  const [cause, setCause] = useState(null);
  const TABS = ["Recognition", "Treatment", "Workup", "Monitoring"];

  const caNum  = parseFloat(ca);
  const albNum = parseFloat(alb);
  const ionNum = parseFloat(ionCa);

  // Corrected calcium: corrected Ca = total Ca + 0.8 × (4.0 - albumin)
  const corrCa = !isNaN(caNum) && !isNaN(albNum) && ca !== "" && alb !== ""
    ? (caNum + 0.8 * (4.0 - albNum)).toFixed(1) : null;

  const caToUse = corrCa ? parseFloat(corrCa) : !isNaN(ionNum) && ionCa !== "" ? ionNum * 2.5 : !isNaN(caNum) ? caNum : null;

  const sev = caToUse === null ? null
    : caToUse >= 14    ? { label: "Hypercalcemic Crisis", color: T.coral, action: "Immediate IV saline + furosemide + bisphosphonate + calcitonin + ICU" }
    : caToUse >= 12    ? { label: "Severe Hypercalcemia", color: T.amber, action: "Aggressive hydration + calcitonin + bisphosphonate + nephrology" }
    : caToUse >= 10.5  ? { label: "Mild-Moderate", color: T.gold,  action: "Identify cause · hydration · treat underlying condition" }
    : { label: "Normal", color: T.green, action: "Normal calcium — no acute treatment needed" };

  const selCause = CAUSES_TOP.find(c => c.cause === cause);

  // ── TAB 0: RECOGNITION ──────────────────────────────────────────────────
  const T0 = (
    <div>
      <div style={aBox(T.coral, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, marginBottom: 2 }}>Hypercalcemic Crisis — Total Ca &gt; 14 mg/dL or Ionized Ca &gt; 3.5 mmol/L</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>"Bones, stones, groans, and psychic moans." Rapid onset of severe hypercalcemia causes life-threatening cardiac arrhythmias, AKI, pancreatitis, and neurological deterioration. Treat aggressively.</div>
      </div>

      <div style={sL()}>Calcium Calculator — Corrected + Severity</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.07em" }}>Total Ca (mg/dL)</div>
            <input value={ca} onChange={e => setCa(e.target.value)} placeholder="12.5" type="number" step="0.1"
              style={{ ...inp, width: "100%", boxSizing: "border-box" }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.07em" }}>Albumin (g/dL)</div>
            <input value={alb} onChange={e => setAlb(e.target.value)} placeholder="4.0" type="number" step="0.1"
              style={{ ...inp, width: "100%", boxSizing: "border-box" }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.07em" }}>Ionized Ca (mmol/L)</div>
            <input value={ionCa} onChange={e => setIonCa(e.target.value)} placeholder="1.35" type="number" step="0.01"
              style={{ ...inp, width: "100%", boxSizing: "border-box" }} />
          </div>
        </div>
        {corrCa && (
          <div style={{ ...G({ borderRadius: 9, marginBottom: 8 }), padding: "9px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 10, color: T.dim, marginBottom: 2 }}>Corrected Ca = Total + 0.8 × (4.0 − Albumin)</div>
            </div>
            <div style={{ fontFamily: T.mono, fontSize: 18, fontWeight: 800, color: T.gold }}>{corrCa} mg/dL</div>
          </div>
        )}
        {sev && (
          <div style={aBox(sev.color, 0)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: sev.color }}>{sev.label}</span>
              <span style={{ ...tag(sev.color) }}>{corrCa ? `Corrected: ${corrCa}` : ionCa ? `iCa: ${ionCa}` : `Total: ${ca}`} mg/dL</span>
            </div>
            <div style={{ fontSize: 11.5, color: sev.color, fontWeight: 600 }}>→ {sev.action}</div>
          </div>
        )}
      </div>

      {[
        { range: "≥ 14 mg/dL",    label: "Crisis", color: T.coral },
        { range: "12–13.9 mg/dL", label: "Severe", color: T.amber },
        { range: "10.5–11.9 mg/dL", label: "Mild-Moderate", color: T.gold },
        { range: "< 10.5 mg/dL",  label: "Normal", color: T.green },
      ].map(({ range, label, color }) => (
        <div key={range} style={{ ...G({ borderRadius: 9 }), padding: "8px 12px", marginBottom: 5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 700, color }}>{range}</span>
          <span style={{ ...tag(color), fontSize: 10 }}>{label}</span>
        </div>
      ))}

      <div style={sL()}>Clinical Presentation — "Bones, Stones, Groans, Moans"</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
        {[
          { cat: "🦴 Bones", color: T.gold, items: ["Bone pain", "Pathologic fractures", "Osteitis fibrosa cystica", "Subperiosteal resorption on X-ray"] },
          { cat: "🪨 Stones", color: T.teal, items: ["Nephrolithiasis (calcium oxalate)", "Nephrocalcinosis", "Polyuria / polydipsia", "AKI (hypercalcemic nephropathy)"] },
          { cat: "😖 Groans", color: T.amber, items: ["Nausea / vomiting", "Constipation", "Anorexia", "Acute pancreatitis", "Peptic ulcer disease"] },
          { cat: "🧠 Moans", color: T.purple, items: ["Fatigue / weakness", "Depression", "Confusion", "Stupor / coma (crisis)", "Shortened QT on ECG"] },
        ].map(({ cat, color, items }) => (
          <div key={cat} style={card({ padding: "11px 12px", borderLeft: `3px solid ${color}` })}>
            <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 7 }}>{cat}</div>
            {items.map((item, i) => <div key={i} style={{ fontSize: 11, color: T.muted, marginBottom: 3, display: "flex", gap: 5 }}><span style={{ color }}>●</span>{item}</div>)}
          </div>
        ))}
      </div>

      <div style={sL(T.teal)}>Causes — tap to expand</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
        {CAUSES_TOP.map(c => (
          <button key={c.cause} onClick={() => setCause(cause === c.cause ? null : c.cause)}
            style={{ padding: "6px 12px", borderRadius: 8, border: `1.5px solid ${cause === c.cause ? c.color : T.border}`, background: cause === c.cause ? c.color + "20" : T.glass, color: cause === c.cause ? c.color : T.muted, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: T.sans, transition: "all 0.15s" }}>
            {c.cause} <span style={{ opacity: 0.6 }}>({c.pct})</span>
          </button>
        ))}
      </div>
      {selCause && (
        <div style={{ ...card({ border: `1.5px solid ${selCause.color}55`, marginBottom: 14 }) }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: selCause.color, marginBottom: 6 }}>{selCause.cause}</div>
          <div style={{ fontSize: 11.5, color: T.muted, marginBottom: 8, lineHeight: 1.5 }}>{selCause.detail}</div>
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>Diagnosis</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>{selCause.dx}</div>
          </div>
          <div style={aBox(selCause.color, 0)}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: selCause.color, marginBottom: 2 }}>Treatment</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>{selCause.tx}</div>
          </div>
        </div>
      )}
    </div>
  );

  // ── TAB 1: TREATMENT ────────────────────────────────────────────────────
  const T1 = (
    <div>
      <div style={aBox(T.coral, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, marginBottom: 2 }}>4-Pronged Attack: Hydrate + Calcitonin + Bisphosphonate + Treat Cause</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>Saline dilutes calcium and increases renal excretion. Calcitonin works fastest (hours). Bisphosphonates most potent but take 48–72h. Must address underlying cause for durable effect.</div>
      </div>

      <div style={sL()}>Step-by-Step Protocol</div>
      {[
        {
          n: 1, label: "IV Normal Saline — First and Most Important", color: T.blue,
          detail: "0.9% NS 200–500 mL/h until euvolemic → then 100–200 mL/h · Goal UO 100–150 mL/h · Typical volume 4–6L in first 24h · Restores GFR → increases renal calcium excretion · Avoids worsening hypercalcemia-induced nephrogenic DI",
          pearl: "Do NOT use hypotonic fluids or dextrose — use only isotonic saline. Aggressive hydration alone can lower calcium by 1–3 mg/dL.",
        },
        {
          n: 2, label: "Furosemide (Loop Diuretic)", color: T.teal,
          detail: "20–40 mg IV once euvolemic · ONLY after adequate volume replacement · Increases renal calcium excretion in tubules · Do NOT give before volume replete (worsens hypercalcemia) · Modern evidence: less essential than once thought — prioritize hydration",
          pearl: "Old teaching: 'saline and Lasix.' Modern approach: saline is the priority. Furosemide only AFTER volume replete to maintain UO.",
        },
        {
          n: 3, label: "Calcitonin — Fastest Effect", color: T.gold,
          detail: "4 units/kg IM or SQ q 12h · Onset: 4–6 hours · Lowers Ca by 1–2 mg/dL · Inhibits osteoclast bone resorption + increases renal calcium excretion · Tachyphylaxis develops within 48–72h — use as bridge to bisphosphonate",
          pearl: "Salmon calcitonin is fastest acting of all agents. Use as a bridge while waiting for bisphosphonate effect. Test dose 1 unit IM before full dose (rare hypersensitivity).",
        },
        {
          n: 4, label: "Bisphosphonate — Most Potent", color: T.coral,
          detail: "Zoledronic acid 4 mg IV over 15 min (preferred) OR Pamidronate 60–90 mg IV over 2–4h · Onset: 48–72h · Duration: 2–4 weeks (zoledronate) · Inhibits osteoclast bone resorption · Most effective for malignancy-associated hypercalcemia",
          pearl: "Zoledronic acid superior to pamidronate (faster, more potent, shorter infusion). Adjust dose if creatinine elevated. Avoid if CrCl < 35 mL/min — use denosumab instead.",
        },
        {
          n: 5, label: "Glucocorticoids — Granulomatous + Hematologic", color: T.purple,
          detail: "Hydrocortisone 200–300 mg/day IV (or prednisone 40–60 mg/day PO) · Effective in: sarcoidosis · lymphoma · vitamin D toxicity · multiple myeloma · Mechanism: reduces 1,25-OH2D production · macrophage inhibition · Onset: 2–5 days",
          pearl: "Dramatically effective for granulomatous disease — consider if suspected sarcoid, lymphoma, or unexplained hypercalcemia with elevated calcitriol.",
        },
      ].map(({ n, label, color, detail, pearl }) => (
        <div key={n} style={{ ...card({ marginBottom: 9, borderLeft: `3px solid ${color}` }), display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: color + "22", border: `1.5px solid ${color}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color, flexShrink: 0 }}>{n}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4, marginBottom: 6 }}>{detail}</div>
            <div style={aBox(T.gold, 0)}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.gold, marginBottom: 1 }}>⚡ Pearl</div>
              <div style={{ fontSize: 11.5, color: T.muted }}>{pearl}</div>
            </div>
          </div>
        </div>
      ))}

      <div style={sL(T.teal)}>Additional Agents</div>
      {[
        { drug: "Denosumab (Prolia/Xgeva)", dose: "120 mg SQ", note: "RANKL inhibitor · for bisphosphonate-refractory or renal failure (CrCl < 35) · onset 4–7 days · duration 4+ weeks · no renal dose adjustment needed", color: T.teal },
        { drug: "Cinacalcet (Sensipar)",    dose: "30–60 mg PO BID", note: "Calcimimetic · for primary hyperparathyroidism (non-surgical) · increases CaSR sensitivity → decreases PTH · does not improve bone density", color: T.blue },
        { drug: "Gallium Nitrate",          dose: "200 mg/m² IV × 5 days", note: "Inhibits bone resorption · second-line for malignancy · requires adequate hydration · nephrotoxic · rarely used", color: T.purple },
        { drug: "Dialysis",                 dose: "Low-calcium dialysate", note: "Most definitive · for renal failure + hypercalcemic crisis · rapidly removes calcium · nephrology consult immediately", color: T.coral },
      ].map(({ drug, dose, note, color }) => (
        <div key={drug} style={{ ...G(), padding: "10px 13px", marginBottom: 7, borderLeft: `3px solid ${color}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color }}>{drug}</span>
            <span style={{ fontFamily: T.mono, fontSize: 11, color }}>{dose}</span>
          </div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{note}</div>
        </div>
      ))}

      <div style={sL(T.amber)}>Drug Comparison — Speed vs Duration</div>
      <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: 420 }}>
          {[{ h: true, drug: "Agent", onset: "Onset", duration: "Duration", drop: "Ca drop" }].concat([
            { drug: "IV Saline",     onset: "Hours",    duration: "Transient", drop: "1–3 mg/dL",  color: T.blue },
            { drug: "Calcitonin",    onset: "4–6h",     duration: "48–72h",   drop: "1–2 mg/dL",  color: T.gold },
            { drug: "Zoledronate",   onset: "48–72h",   duration: "2–4 wks",  drop: "2–4 mg/dL",  color: T.coral },
            { drug: "Pamidronate",   onset: "48–72h",   duration: "1–2 wks",  drop: "2–4 mg/dL",  color: T.amber },
            { drug: "Glucocorticoids", onset: "2–5 days", duration: "Variable", drop: "Variable",  color: T.purple },
            { drug: "Denosumab",     onset: "4–7 days", duration: "4+ wks",   drop: "2–3 mg/dL",  color: T.teal },
          ]).map(({ drug, onset, duration, drop, color, h }, i) => (
            <div key={drug} style={{ display: "flex", borderBottom: `1px solid ${T.border}`, background: h ? T.glassMid : i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)", padding: "7px 10px", gap: 4 }}>
              <div style={{ flex: 2, fontSize: h ? 9.5 : 12, fontWeight: h ? 700 : 600, color: h ? T.muted : (color || T.white), textTransform: h ? "uppercase" : "none", letterSpacing: h ? "0.07em" : 0 }}>{drug}</div>
              <div style={{ flex: 1, fontFamily: h ? T.sans : T.mono, fontSize: h ? 9.5 : 11, color: h ? T.muted : T.teal, textTransform: h ? "uppercase" : "none" }}>{onset}</div>
              <div style={{ flex: 1, fontFamily: h ? T.sans : T.mono, fontSize: h ? 9.5 : 11, color: h ? T.muted : T.gold, textTransform: h ? "uppercase" : "none" }}>{duration}</div>
              <div style={{ flex: 1, fontFamily: h ? T.sans : T.mono, fontSize: h ? 9.5 : 11, color: h ? T.muted : T.coral, textTransform: h ? "uppercase" : "none" }}>{drop}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── TAB 2: WORKUP ────────────────────────────────────────────────────────
  const T2 = (
    <div>
      <div style={sL()}>Essential Labs</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        {[
          { test: "Ionized Ca",                    why: "Gold standard · not affected by albumin · total Ca with albumin correction is second best" },
          { test: "Corrected Total Ca",             why: "Total Ca + 0.8 × (4.0 - albumin) · use when ionized Ca unavailable" },
          { test: "Intact PTH (iPTH)",             why: "HIGH (or inappropriately normal) = primary hyperparathyroidism · LOW (suppressed) = malignancy/vitamin D toxicity/granulomas" },
          { test: "PTHrP (PTH-related protein)",   why: "Elevated in humoral hypercalcemia of malignancy (HHM) · squamous cell · RCC · breast · bladder" },
          { test: "25-OH Vitamin D",               why: "Elevated in vitamin D toxicity · normal in sarcoidosis (1,25-OH2D elevated)" },
          { test: "1,25-OH2 Vitamin D (Calcitriol)", why: "Elevated in granulomatous disease (sarcoid · TB) and lymphoma · not routine" },
          { test: "Phosphate",                     why: "Low in primary HPT and HHM · high in vitamin D toxicity and renal failure" },
          { test: "BMP",                            why: "Creatinine (AKI from hypercalcemia) · adjust bisphosphonate if CrCl < 35 · K⁺ for diuresis" },
          { test: "24h urine Ca + Cr",             why: "Familial hypocalciuric hypercalcemia (FHH): low urine Ca (< 100 mg/day) despite hypercalcemia — CaSR mutation · benign · no treatment needed" },
          { test: "SPEP / UPEP",                   why: "Multiple myeloma screening · protein gap · Bence Jones proteins" },
          { test: "ACE level",                     why: "Elevated in sarcoidosis · not sensitive or specific but supportive" },
        ].map(({ test, why }, i) => (
          <div key={test} style={{ display: "flex", gap: 10, paddingBottom: 6, marginBottom: 6, borderBottom: i < 10 ? `1px solid ${T.border}` : "none" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.gold, minWidth: 180, flexShrink: 0 }}>{test}</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>{why}</div>
          </div>
        ))}
      </div>

      <div style={sL(T.teal)}>PTH-Based Diagnostic Algorithm</div>
      {[
        { pth: "PTH HIGH or normal (20–65 pg/mL)", dx: "Primary hyperparathyroidism · Familial hypocalciuric hypercalcemia (FHH) · Lithium-induced · Tertiary HPT (CKD) · MEN syndrome", color: T.gold },
        { pth: "PTH LOW (&lt; 20 pg/mL)", dx: "Malignancy (check PTHrP) · Vitamin D toxicity · Granulomatous disease (check calcitriol) · Immobilization · Milk-alkali syndrome", color: T.coral },
      ].map(({ pth, dx, color }) => (
        <div key={pth} style={{ ...card({ marginBottom: 8, borderLeft: `3px solid ${color}` }) }}>
          <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 4 }}>{pth}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{dx}</div>
        </div>
      ))}

      <div style={sL(T.purple)}>Cardiac — ECG Changes</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        {[
          { finding: "Shortened QTc", significance: "Most classic finding · risk of VT/VF in severe hypercalcemia (&gt; 14 mg/dL)", color: T.coral },
          { finding: "Prolonged PR interval", significance: "First-degree AV block · may progress", color: T.amber },
          { finding: "Wide QRS", significance: "Severe cases · electromechanical dissociation possible", color: T.gold },
          { finding: "J-wave (Osborn wave)", significance: "Associated with hypercalcemia in some cases", color: T.teal },
          { finding: "ST changes / T-wave flattening", significance: "Diffuse · myocardial irritability in crisis · LVH from chronic HPT", color: T.blue },
        ].map(({ finding, significance, color }, i) => (
          <div key={finding} style={{ display: "flex", gap: 10, paddingBottom: 6, marginBottom: 6, borderBottom: i < 4 ? `1px solid ${T.border}` : "none" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color, minWidth: 160, flexShrink: 0 }}>{finding}</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>{significance}</div>
          </div>
        ))}
      </div>

      <div style={sL(T.blue)}>Imaging</div>
      {[
        { img: "Neck Ultrasound",       ind: "Parathyroid adenoma localization · pre-op for parathyroidectomy · sensitivity 70–80%", color: T.teal },
        { img: "Sestamibi Scan (Tc-99m)", ind: "Parathyroid adenoma · highest sensitivity for single adenoma (85–95%) · combined with SPECT for 3D localization", color: T.gold },
        { img: "4D CT Parathyroid",     ind: "Best for ectopic parathyroid · second-line if sestamibi equivocal", color: T.blue },
        { img: "Chest X-ray / CT Chest", ind: "Lung malignancy (squamous cell) · sarcoidosis (hilar adenopathy) · lymphoma", color: T.coral },
        { img: "Bone Survey / DEXA",    ind: "Subperiosteal resorption (HPT) · lytic lesions (myeloma) · osteoporosis · nephrocalcinosis on KUB", color: T.amber },
      ].map(({ img, ind, color }) => (
        <div key={img} style={{ ...G(), padding: "9px 12px", marginBottom: 6, borderLeft: `3px solid ${color}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 2 }}>{img}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{ind}</div>
        </div>
      ))}
    </div>
  );

  // ── TAB 3: MONITORING ───────────────────────────────────────────────────
  const T3 = (
    <div>
      <div style={sL()}>Monitoring Schedule</div>
      {[
        { freq: "Every 2–4h",   items: "Ionized Ca or corrected Ca · urine output · mental status · cardiac monitoring", color: T.coral },
        { freq: "Every 6–8h",   items: "BMP (creatinine · K⁺) · Mg (furosemide causes Mg wasting) · phosphate", color: T.gold },
        { freq: "Every 12–24h", items: "ECG · fluid balance reassessment · reassess bisphosphonate response · blood cultures if infection suspected", color: T.teal },
        { freq: "Continuous",   items: "Cardiac monitor (QTc · arrhythmia) · SpO₂ · BP", color: T.purple },
      ].map(({ freq, items, color }) => (
        <div key={freq} style={{ ...G(), padding: "9px 12px", marginBottom: 6, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div style={{ fontFamily: T.mono, fontSize: 11.5, fontWeight: 700, color, minWidth: 100, flexShrink: 0 }}>{freq}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{items}</div>
        </div>
      ))}

      <div style={sL(T.green)}>Treatment Response Targets</div>
      {[
        { target: "Calcium",    goal: "Total Ca &lt; 12 mg/dL · ionized Ca &lt; 1.5 mmol/L",      color: T.gold },
        { target: "Urine Output", goal: "100–150 mL/h during aggressive hydration phase",     color: T.teal },
        { target: "Creatinine", goal: "Trending down (AKI from hypercalcemia should improve)", color: T.blue },
        { target: "QTc",        goal: "Normalizing toward &gt; 400 ms",                          color: T.green },
        { target: "Mental status", goal: "Improving confusion / resolving encephalopathy",    color: T.purple },
      ].map(({ target, goal, color }) => (
        <div key={target} style={{ ...G({ borderRadius: 9 }), padding: "9px 12px", marginBottom: 6, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color, minWidth: 110, flexShrink: 0 }}>{target}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{goal}</div>
        </div>
      ))}

      <div style={sL(T.coral)}>Escalation Triggers</div>
      {["Calcium not falling after 6–12h of aggressive saline → add calcitonin if not started · confirm zoledronate given",
        "AKI worsening (creatinine rising despite hydration) → dialysis consideration · nephrology urgent consult",
        "New cardiac arrhythmia (QTc shortening → VT risk) → continuous telemetry · electrolyte correction",
        "Altered mentation not improving → reassess diagnosis · repeat Ca · consider brain imaging",
        "Bisphosphonate refractory → denosumab 120 mg SQ · dialysis consultation"].map((t, i) => (
        <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 8, marginBottom: 6, lineHeight: 1.4 }}>
          <span style={{ color: T.coral, flexShrink: 0 }}>⚠</span>{t}
        </div>
      ))}

      <div style={sL(T.purple)}>Disposition</div>
      <div style={{ ...card() }}>
        {[
          { level: "ICU",      detail: "Ca &gt; 14 mg/dL · altered mentation · hemodynamic instability · AKI requiring monitoring · cardiac arrhythmia · requiring IV bisphosphonate + calcitonin + continuous monitoring" },
          { level: "Telemetry", detail: "Ca 12–14 mg/dL · responding to hydration · mild AKI · awaiting bisphosphonate effect · cardiac monitoring required" },
          { level: "Floor",    detail: "Ca 10.5–12 mg/dL · stable · workup underway · oral hydration adequate · endocrinology/oncology consultation arranged" },
          { level: "Outpatient", detail: "Mild asymptomatic Ca 10.5–11.5 · primary HPT confirmed · parathyroidectomy evaluation · endocrinology follow-up · adequate PO hydration · avoid thiazides and calcium supplements" },
        ].map(({ level, detail }, i) => (
          <div key={i} style={{ display: "flex", gap: 10, paddingBottom: 7, marginBottom: 7, borderBottom: i < 3 ? `1px solid ${T.border}` : "none" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.purple, minWidth: 80, flexShrink: 0 }}>{level}</div>
            <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{detail}</div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: `radial-gradient(ellipse 70% 40% at 15% 0%, rgba(245,158,11,0.09) 0%, transparent 60%), radial-gradient(ellipse 50% 35% at 85% 95%, rgba(244,63,94,0.07) 0%, transparent 55%), ${T.bg}`, fontFamily: T.sans, color: T.white, paddingBottom: 80 }}>
      <div style={{ padding: "20px 20px 0" }}>
        <button onClick={handleBack} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", color: T.teal, fontSize: 13, fontFamily: T.sans, cursor: "pointer", padding: "4px 0", marginBottom: 16 }}>
          ← Critical Protocols
        </button>
        <div>
          <span style={pill("linear-gradient(135deg,#14b8a6,#065f46)")}>⚗️ Metabolic</span>
          <span style={pill("linear-gradient(135deg,#f59e0b,#b45309)")}>Endocrine Society</span>
        </div>
        <h1 style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 700, margin: "0 0 4px", lineHeight: 1.15 }}>Hypercalcemic Crisis</h1>
        <p style={{ color: T.muted, fontSize: 12, margin: "0 0 20px" }}>Corrected Ca calculator · Causes by PTH · Saline + calcitonin + bisphosphonate · Drug speed comparison · ECG changes</p>
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
        {tab === 0 && T0}{tab === 1 && T1}{tab === 2 && T2}{tab === 3 && T3}
      </div>
    </div>
  );
}