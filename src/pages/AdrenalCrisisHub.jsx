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
const sL   = (c = T.gold) => ({ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: c, margin: "18px 0 10px", display: "flex", alignItems: "center", gap: 8 });
const dv   = { height: 1, background: T.border, margin: "10px 0" };
const inp  = { padding: "9px 12px", background: T.glassMid, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 13, fontFamily: T.mono, fontWeight: 600, outline: "none" };

// ── Data ─────────────────────────────────────────────────────────────────────
const TYPES = [
  {
    type: "Primary (Addison's Disease)", color: T.coral, short: "PAI",
    mechanism: "Destruction of adrenal cortex → cortisol AND aldosterone deficiency",
    causes: ["Autoimmune adrenalitis (most common in developed world)", "Tuberculosis (most common worldwide)", "Bilateral adrenal hemorrhage (anticoagulation, sepsis → Waterhouse-Friderichsen)", "Metastatic disease (lung, breast, melanoma)", "Fungal infections (histoplasma, coccidioides)", "HIV-related (CMV, cryptococcal, Kaposi's)"],
    electrolytes: "Hyponatremia + Hyperkalemia (aldosterone deficiency → salt wasting)",
    acth: "↑↑ ACTH (pituitary overdriving → hyperpigmentation)",
    aldosterone: "↓ (salt wasting, volume depletion)",
    pigment: true,
  },
  {
    type: "Secondary (Pituitary / HPA Suppression)", color: T.blue, short: "SAI",
    mechanism: "Inadequate ACTH from pituitary → cortisol deficiency · aldosterone intact",
    causes: ["Exogenous corticosteroid use (most common) — any dose > 5 mg prednisolone/day > 1 month", "Pituitary tumor / Sheehan's syndrome / empty sella", "Traumatic brain injury / surgery / radiation to pituitary", "Hypophysitis (autoimmune, pembrolizumab/checkpoint inhibitor)", "Pituitary apoplexy"],
    electrolytes: "Hyponatremia only (SIADH-like) — NO hyperkalemia (aldosterone preserved)",
    acth: "↓ or inappropriately normal ACTH",
    aldosterone: "Normal (RAAS intact)",
    pigment: false,
  },
];

const PRECIPITANTS = [
  { l: "I", w: "Infection",               d: "Most common precipitant · any systemic infection · especially GI (emesis prevents oral steroids) · UTI · pneumonia · sepsis" },
  { l: "I", w: "Illness / Surgery / Trauma", d: "Physiologic stress dramatically increases cortisol requirement · major surgery → 8–10× normal cortisol need · failure to stress-dose = crisis" },
  { l: "I", w: "Inadequate Dosing",       d: "Missed doses · vomiting (cannot absorb PO steroids) · poor medication adherence · sudden withdrawal of chronic exogenous steroids" },
  { l: "I", w: "Iatrogenic / Other",      d: "Bilateral adrenal hemorrhage from anticoagulation or DIC · drugs (ketoconazole, fluconazole, rifampin, phenytoin — alter cortisol metabolism) · checkpoint inhibitor hypophysitis" },
];

const TAPER = [
  { day: "Day 1 (Crisis)",  dose: "Hydrocortisone 100 mg IV q 6–8h OR 200 mg/24h continuous infusion", color: T.coral },
  { day: "Day 2–3",         dose: "Hydrocortisone 50 mg IV q 8h (as clinically improving)",            color: T.amber },
  { day: "Day 3–4",         dose: "Hydrocortisone 25 mg PO q 8h (when tolerating PO)",                color: T.gold },
  { day: "Day 4–5",         dose: "Hydrocortisone 20 mg AM + 10 mg noon + 10 mg PM (physiologic replacement)", color: T.teal },
  { day: "Maintenance",     dose: "Hydrocortisone 15–20 mg AM + 5–10 mg PM + Fludrocortisone 0.1 mg daily if primary", color: T.green },
];

const STEROID_EQUIV = [
  { drug: "Hydrocortisone",     dose: "20 mg",   mineralocorticoid: "Yes (moderate)", half_life: "8–12 h",  color: T.gold },
  { drug: "Prednisone",         dose: "5 mg",    mineralocorticoid: "Minimal",        half_life: "12–36 h", color: T.blue },
  { drug: "Methylprednisolone", dose: "4 mg",    mineralocorticoid: "None",           half_life: "12–36 h", color: T.teal },
  { drug: "Dexamethasone",      dose: "0.75 mg", mineralocorticoid: "None",           half_life: "36–72 h", color: T.purple },
];

import { useNavigate } from "react-router-dom";

// ── Main Component ───────────────────────────────────────────────────────────
export default function AdrenalCrisisHub({ onBack }) {
  const navigate = useNavigate();
  const handleBack = () => onBack ? onBack() : navigate("/CriticalProtocolsPage");
  const [tab, setTab]           = useState(0);
  const [type, setType]         = useState(null);
  const [cortisol, setCortisol] = useState("");
  const TABS = ["Recognition", "Treatment", "Workup", "Monitoring"];

  const selType = TYPES.find(t => t.type === type);

  const cortisolNum   = parseFloat(cortisol);
  const cortisolInterp = !isNaN(cortisolNum) && cortisol !== ""
    ? cortisolNum < 3   ? { label: "Diagnostic of adrenal insufficiency", color: T.coral }
    : cortisolNum < 15  ? { label: "Strongly suggests adrenal insufficiency in critically ill patient", color: T.amber }
    : cortisolNum < 18  ? { label: "Borderline — consider cosyntropin stimulation test", color: T.gold }
    : { label: "Normal — adrenal insufficiency less likely", color: T.green }
    : null;

  // ── TAB 0: RECOGNITION ────────────────────────────────────────────────────
  const Tab0 = (
    <div>
      <div style={aBox(T.coral, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, marginBottom: 2 }}>Mortality 6–15% Per Episode — Recognition is the Challenge</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>Classic presentation mimics septic shock. The distinguishing clue: shock refractory to fluids and pressors that resolves dramatically with hydrocortisone. Always consider in unexplained shock with hyponatremia + eosinophilia.</div>
      </div>

      <div style={sL()}>Type of Adrenal Insufficiency — tap to compare</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {TYPES.map(t => (
          <button key={t.type}
            style={{ flex: 1, padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${type === t.type ? t.color : T.border}`, background: type === t.type ? t.color + "18" : T.glass, color: type === t.type ? t.color : T.muted, fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: T.sans, transition: "all 0.2s", lineHeight: 1.3 }}
            onClick={() => setType(type === t.type ? null : t.type)}>
            <div style={{ fontSize: 14, marginBottom: 3 }}>{t.short === "PAI" ? "🫘" : "🧠"}</div>
            {t.short}
          </button>
        ))}
      </div>

      {selType && (
        <div style={{ ...card({ border: `1.5px solid ${selType.color}55`, marginBottom: 14 }) }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: selType.color, marginBottom: 6 }}>{selType.type}</div>
          <div style={{ fontSize: 11.5, color: T.muted, marginBottom: 10, fontStyle: "italic" }}>{selType.mechanism}</div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Causes</div>
          {selType.causes.map((c, i) => <div key={i} style={{ fontSize: 11.5, color: T.muted, display: "flex", gap: 7, marginBottom: 4 }}><span style={{ color: selType.color }}>●</span>{c}</div>)}
          <div style={dv} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { label: "Electrolytes",       val: selType.electrolytes, color: selType.color },
              { label: "ACTH",               val: selType.acth,         color: selType.short === "PAI" ? T.coral : T.blue },
              { label: "Aldosterone",        val: selType.aldosterone,  color: selType.color },
              { label: "Hyperpigmentation",  val: selType.pigment ? "Present (↑ ACTH → melanocortin)" : "Absent (low ACTH)", color: selType.pigment ? T.amber : T.teal },
            ].map(({ label, val, color }) => (
              <div key={label} style={{ ...G({ borderRadius: 9 }), padding: "9px 11px" }}>
                <div style={{ fontSize: 10, color: T.dim, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</div>
                <div style={{ fontSize: 11, color, lineHeight: 1.4 }}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={sL()}>Clinical Presentation</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
        <div style={card({ padding: "12px 13px", borderLeft: `3px solid ${T.amber}` })}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.amber, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 7 }}>Prodrome (hrs–days)</div>
          {["Profound fatigue / weakness", "Anorexia · nausea · vomiting", "Abdominal pain (mimics acute abdomen)", "Myalgia / arthralgia", "Low-grade fever"].map((s, i) => (
            <div key={i} style={{ fontSize: 11, color: T.muted, marginBottom: 4, display: "flex", gap: 5 }}><span style={{ color: T.amber }}>●</span>{s}</div>
          ))}
        </div>
        <div style={card({ padding: "12px 13px", borderLeft: `3px solid ${T.coral}` })}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.coral, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 7 }}>Acute Crisis</div>
          {["Hemodynamic collapse / shock", "Hypotension refractory to fluids", "Altered mentation / confusion", "High fever (infection or cortisol deficiency)", "Hypoglycemia (esp. secondary)"].map((s, i) => (
            <div key={i} style={{ fontSize: 11, color: T.muted, marginBottom: 4, display: "flex", gap: 5 }}><span style={{ color: T.coral }}>●</span>{s}</div>
          ))}
        </div>
      </div>

      <div style={sL(T.teal)}>Diagnostic Clues — Unexplained Shock</div>
      {[
        { clue: "Hyponatremia + hyperkalemia", detail: "Classic electrolyte pattern of primary adrenal insufficiency (Addison's)", color: T.coral },
        { clue: "Eosinophilia",               detail: "Often missed — eosinophils are normally suppressed by cortisol → eosinophilia in cortisol deficiency", color: T.teal },
        { clue: "Hypoglycemia",               detail: "Especially in secondary AI — cortisol is a major counter-regulatory hormone to insulin", color: T.gold },
        { clue: "Hyperpigmentation",          detail: "Primary only — bronze/brown skin creases, mucous membranes, scars, gingiva → chronic ACTH elevation", color: T.amber },
        { clue: "Shock + known steroid use",  detail: "Any patient on chronic steroids who develops hemodynamic instability → adrenal crisis until proven otherwise", color: T.purple },
        { clue: "Refractory to vasopressors", detail: "Cortisol is required for vascular response to catecholamines — adrenal crisis causes vasoplegic, catecholamine-resistant shock", color: T.coral },
      ].map(({ clue, detail, color }) => (
        <div key={clue} style={{ ...G(), padding: "10px 13px", marginBottom: 7, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div style={{ ...tag(color), flexShrink: 0, whiteSpace: "nowrap", fontSize: 10 }}>{clue}</div>
          <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{detail}</div>
        </div>
      ))}

      <div style={sL(T.purple)}>Precipitants — 4 Is</div>
      {PRECIPITANTS.map(({ l, w, d }) => (
        <div key={l + w} style={{ ...G(), padding: "11px 13px", marginBottom: 7, display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: T.purple + "22", border: `1.5px solid ${T.purple}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, color: T.purple, fontFamily: T.mono, flexShrink: 0 }}>{l}</div>
          <div><div style={{ fontSize: 12, fontWeight: 700, color: T.white, marginBottom: 2 }}>{w}</div><div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.45 }}>{d}</div></div>
        </div>
      ))}

      <div style={aBox(T.coral, 0)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, marginBottom: 3 }}>Waterhouse-Friderichsen Syndrome</div>
        <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.5 }}>Bilateral adrenal hemorrhage from overwhelming sepsis (classically N. meningitidis). Catastrophic — acute onset adrenal crisis + purpuric rash + shock. Treat simultaneously: antibiotics + hydrocortisone + aggressive resuscitation. Very high mortality.</div>
      </div>
    </div>
  );

  // ── TAB 1: TREATMENT ──────────────────────────────────────────────────────
  const Tab1 = (
    <div>
      <div style={{ ...G({ borderRadius: 14, border: `2px solid ${T.gold}60`, background: "rgba(245,158,11,0.10)", marginBottom: 16 }), padding: "16px" }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: T.gold, marginBottom: 8 }}>⚡ HYDROCORTISONE 100 mg IV — GIVE IMMEDIATELY</div>
        <div style={{ fontFamily: T.mono, fontSize: 18, color: T.gold, fontWeight: 800, marginBottom: 4 }}>100 mg IV push STAT</div>
        <div style={{ fontFamily: T.mono, fontSize: 13, color: T.muted, marginBottom: 8 }}>Then 50–100 mg IV q 6–8h · OR 200 mg/24h continuous infusion</div>
        <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.5 }}>
          Do NOT wait for cortisol level or cosyntropin test. Draw cortisol level immediately BEFORE giving hydrocortisone — then treat immediately. If diagnosis uncertain and test needed: use dexamethasone 4 mg IV (does not cross-react with cortisol assay) then send cortisol → cosyntropin stimulation test.
        </div>
      </div>

      <div style={sL()}>Sequential Treatment Protocol</div>
      {[
        { n: 1, label: "Hydrocortisone",             color: T.gold,   detail: "100 mg IV push → 50–100 mg IV q 6–8h or 200 mg/24h infusion · Provides glucocorticoid AND mineralocorticoid effect at high doses" },
        { n: 2, label: "IV Fluids",                  color: T.teal,   detail: "0.9% NS 1–2L rapidly over first 1–2h · Use D5NS if hypoglycemic · Avoid hypotonic fluids (worsen hyponatremia) · Replace volume deficit (often 2–5L total)" },
        { n: 3, label: "Glucose",                    color: T.amber,  detail: "If hypoglycemic: D50W 50 mL IV push → D5NS maintenance · Check glucose q 1h · Hypoglycemia resolves with cortisol replacement" },
        { n: 4, label: "Treat Precipitant",          color: T.blue,   detail: "Blood cultures × 2 before antibiotics · Broad-spectrum antibiotics if infection suspected · Identify and treat underlying trigger" },
        { n: 5, label: "Vasopressors (if needed)",   color: T.coral,  detail: "Norepinephrine 0.05–0.5 mcg/kg/min if refractory to fluids + hydrocortisone · Most adrenal crises respond to cortisol replacement alone — pressors often brief" },
        { n: 6, label: "Fludrocortisone (Primary AI only)", color: T.purple, detail: "0.05–0.1 mg PO daily — start when tolerating PO · Not needed acutely (high-dose hydrocortisone has mineralocorticoid effect) · Primary AI only — not secondary" },
      ].map(({ n, label, color, detail }) => (
        <div key={n} style={{ ...card({ marginBottom: 8 }), display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: color + "22", border: `1.5px solid ${color}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color, flexShrink: 0 }}>{n}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.5 }}>{detail}</div>
          </div>
        </div>
      ))}

      <div style={sL(T.blue)}>Glucocorticoid Equivalency Table</div>
      <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: 420 }}>
          {[{ h: true, drug: "Drug", dose: "Anti-inflam. equiv.", mc: "Mineralocorticoid", hl: "Half-life" }].concat(
            STEROID_EQUIV.map(s => ({ drug: s.drug, dose: s.dose, mc: s.mineralocorticoid, hl: s.half_life, color: s.color, h: false }))
          ).map(({ drug, dose, mc, hl, color, h }, i) => (
            <div key={drug} style={{ display: "flex", borderBottom: `1px solid ${T.border}`, background: h ? T.glassMid : i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)", padding: "8px 12px", gap: 4 }}>
              <div style={{ flex: 2, fontSize: h ? 9.5 : 12, fontWeight: h ? 700 : 600, color: h ? T.muted : (color || T.white), textTransform: h ? "uppercase" : "none", letterSpacing: h ? "0.07em" : 0 }}>{drug}</div>
              <div style={{ flex: 1, fontFamily: h ? T.sans : T.mono, fontSize: h ? 9.5 : 12, color: h ? T.muted : T.gold, textTransform: h ? "uppercase" : "none", letterSpacing: h ? "0.07em" : 0 }}>{dose}</div>
              <div style={{ flex: 1.5, fontSize: h ? 9.5 : 11, color: T.muted, textTransform: h ? "uppercase" : "none", letterSpacing: h ? "0.07em" : 0 }}>{mc}</div>
              <div style={{ flex: 1, fontFamily: h ? T.sans : T.mono, fontSize: h ? 9.5 : 11, color: h ? T.muted : T.teal, textTransform: h ? "uppercase" : "none", letterSpacing: h ? "0.07em" : 0 }}>{hl}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...aBox(T.gold, 0), marginTop: 12 }}>
        <div style={{ fontSize: 11.5, color: T.muted }}>
          <span style={{ color: T.gold, fontWeight: 600 }}>Stress Dosing Rule: </span>Hydrocortisone 100 mg IV covers 8× normal cortisol output. At doses &gt; 50 mg/day, separate mineralocorticoid replacement (fludrocortisone) is NOT needed — hydrocortisone provides adequate mineralocorticoid effect.
        </div>
      </div>
    </div>
  );

  // ── TAB 2: WORKUP ─────────────────────────────────────────────────────────
  const Tab2 = (
    <div>
      <div style={aBox(T.coral, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, marginBottom: 2 }}>Draw Cortisol BEFORE Treating — Then Treat Immediately</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>Do not delay hydrocortisone waiting for results. A random cortisol &lt; 18 mcg/dL in a critically ill patient strongly suggests adrenal insufficiency.</div>
      </div>

      <div style={sL()}>Random Cortisol Interpreter</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
          <input value={cortisol} onChange={e => setCortisol(e.target.value)} placeholder="Cortisol level (mcg/dL)" type="number" step="0.1"
            style={{ ...inp, flex: 1, fontSize: 16, fontWeight: 700 }} />
          <span style={{ fontSize: 12, color: T.muted }}>mcg/dL</span>
        </div>
        {cortisolInterp ? (
          <div style={aBox(cortisolInterp.color, 0)}>
            <div style={{ fontSize: 13, fontWeight: 700, color: cortisolInterp.color, marginBottom: 3 }}>{cortisolInterp.label}</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>
              {parseFloat(cortisol) < 18 ? "Treat empirically with hydrocortisone if clinical suspicion present. Consider cosyntropin stimulation test once stable." : "Normal cortisol in a critically ill patient does not exclude relative adrenal insufficiency — clinical context matters."}
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 11.5, color: T.dim }}>Enter cortisol level above to interpret</div>
        )}
      </div>

      {[
        { val: "< 3 mcg/dL",      interp: "Diagnostic of adrenal insufficiency — treat",                color: T.coral },
        { val: "3–15 mcg/dL",     interp: "Strongly suggests AI in critically ill — treat empirically", color: T.amber },
        { val: "15–18 mcg/dL",    interp: "Borderline — cosyntropin stimulation test recommended",      color: T.gold },
        { val: "> 18–20 mcg/dL",  interp: "Normal — AI less likely (in non-critically ill patients)",   color: T.green },
      ].map(({ val, interp, color }) => (
        <div key={val} style={{ ...G(), padding: "9px 12px", marginBottom: 6, display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 700, color, minWidth: 110, flexShrink: 0 }}>{val}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{interp}</div>
        </div>
      ))}

      <div style={sL(T.teal)}>Cosyntropin Stimulation Test</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.teal, marginBottom: 8 }}>Protocol</div>
        {[
          { n: 1, step: "Draw baseline serum cortisol",                 time: "T = 0" },
          { n: 2, step: "Cosyntropin (synthetic ACTH) 250 mcg IV push", time: "T = 0" },
          { n: 3, step: "Draw cortisol at 30 and 60 minutes",           time: "T = 30 + 60 min" },
        ].map(({ n, step, time }) => (
          <div key={n} style={{ display: "flex", gap: 10, marginBottom: 7, alignItems: "center" }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: T.teal + "22", border: `1px solid ${T.teal}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: T.teal, flexShrink: 0 }}>{n}</div>
            <div style={{ flex: 1, fontSize: 12, color: T.muted }}>{step}</div>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold }}>{time}</div>
          </div>
        ))}
        <div style={dv} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div style={aBox(T.green, 0)}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.green, marginBottom: 2 }}>Normal (No AI)</div>
            <div style={{ fontFamily: T.mono, fontSize: 13, color: T.white }}>Peak cortisol &gt; 18–20 mcg/dL</div>
          </div>
          <div style={aBox(T.coral, 0)}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.coral, marginBottom: 2 }}>Adrenal Insufficiency</div>
            <div style={{ fontFamily: T.mono, fontSize: 13, color: T.white }}>Peak cortisol &lt; 18 mcg/dL</div>
          </div>
        </div>
        <div style={{ ...aBox(T.gold, 0), marginTop: 10 }}>
          <div style={{ fontSize: 11.5, color: T.muted }}>
            <span style={{ color: T.gold, fontWeight: 600 }}>If already gave hydrocortisone: </span>Use dexamethasone 4 mg IV instead — it does not cross-react with the cortisol assay, allowing a valid stimulation test even after dexamethasone treatment.
          </div>
        </div>
      </div>

      <div style={sL(T.gold)}>Essential Labs</div>
      <div style={{ ...card({ marginBottom: 12 }) }}>
        {[
          { test: "Serum cortisol (STAT)",     why: "Draw BEFORE hydrocortisone · random level < 15 in sick = AI likely" },
          { test: "Plasma ACTH",               why: "High (> 100 pg/mL) = primary · Low/normal = secondary · draw simultaneously with cortisol" },
          { test: "BMP",                       why: "Hyponatremia + hyperkalemia (primary) · hypoglycemia · pre-renal azotemia" },
          { test: "CBC with differential",     why: "Eosinophilia (overlooked clue) · leukocytosis from infection or demargination" },
          { test: "Blood cultures × 2",        why: "Infection is most common precipitant — blood cultures before antibiotics" },
          { test: "TSH + free T4",             why: "Hypothyroidism and adrenal insufficiency often coexist (polyglandular autoimmune)" },
          { test: "Aldosterone + renin",       why: "Low aldosterone + high renin = primary AI · normal = secondary" },
          { test: "21-hydroxylase antibodies", why: "If autoimmune cause suspected — positive in 70–90% of autoimmune Addison's" },
          { test: "Lactate",                   why: "Lactic acidosis from hypoperfusion in shock" },
        ].map(({ test, why }, i) => (
          <div key={test} style={{ display: "flex", gap: 10, paddingBottom: 6, marginBottom: 6, borderBottom: i < 8 ? `1px solid ${T.border}` : "none" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.gold, minWidth: 180, flexShrink: 0 }}>{test}</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>{why}</div>
          </div>
        ))}
      </div>

      <div style={sL(T.purple)}>Imaging</div>
      {[
        { modality: "CT Abdomen (adrenal protocol)", when: "If bilateral adrenal hemorrhage suspected (anticoagulation, sepsis, shock) · bilateral adrenal masses / metastases", color: T.coral },
        { modality: "MRI Pituitary with Gad",        when: "Secondary AI with no obvious cause · pituitary apoplexy suspected · post-partum (Sheehan's) · headache + visual field defects", color: T.purple },
        { modality: "Chest X-ray / CT Chest",        when: "TB (bilateral adrenal calcifications on CT) · metastatic disease · histoplasmosis", color: T.teal },
      ].map(({ modality, when, color }) => (
        <div key={modality} style={{ ...G(), padding: "10px 13px", marginBottom: 7, borderLeft: `3px solid ${color}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 2 }}>{modality}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{when}</div>
        </div>
      ))}
    </div>
  );

  // ── TAB 3: MONITORING ─────────────────────────────────────────────────────
  const Tab3 = (
    <div>
      <div style={sL()}>Response to Treatment — Expected Timeline</div>
      {[
        { time: "30–60 min",   expect: "BP begins improving · mental status clearing · glucose stabilizing · typically dramatic response", color: T.coral },
        { time: "2–6 hours",   expect: "Hemodynamic stability without vasopressors · nausea/vomiting resolving", color: T.amber },
        { time: "12–24 hours", expect: "Patient alert and oriented · tolerating PO · electrolytes improving (Na+ normalizing)", color: T.gold },
        { time: "24–48 hours", expect: "Transition to oral steroids · taper begins if clinically stable · identify and treating precipitant", color: T.teal },
      ].map(({ time, expect, color }) => (
        <div key={time} style={{ ...G(), padding: "10px 13px", marginBottom: 7, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div style={{ fontFamily: T.mono, fontSize: 11.5, fontWeight: 700, color, minWidth: 90, flexShrink: 0 }}>{time}</div>
          <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{expect}</div>
        </div>
      ))}

      <div style={aBox(T.coral, 14)}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: T.coral, marginBottom: 2 }}>No improvement in 2–4h → Reassess</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>Consider: inadequate hydrocortisone dose · untreated infection · alternative diagnosis (septic shock from another source) · adrenal hemorrhage requiring surgical evaluation · pituitary apoplexy</div>
      </div>

      <div style={sL()}>Monitoring Parameters</div>
      {[
        { freq: "Every 30 min × 2h", items: "BP · HR · SpO₂ · mental status · urine output",                          color: T.coral },
        { freq: "Every 1h",          items: "Glucose · vasopressor dose titration · urine output",                     color: T.gold },
        { freq: "Every 4–6h",        items: "BMP (Na⁺ · K⁺ · glucose · creatinine) · clinical reassessment",          color: T.teal },
        { freq: "At 24h",            items: "Repeat cortisol if diagnosis uncertain · assess readiness for PO · BMP",  color: T.green },
      ].map(({ freq, items, color }) => (
        <div key={freq} style={{ ...G(), padding: "9px 12px", marginBottom: 6, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div style={{ fontFamily: T.mono, fontSize: 11.5, fontWeight: 700, color, minWidth: 130, flexShrink: 0 }}>{freq}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{items}</div>
        </div>
      ))}

      <div style={sL(T.teal)}>Hydrocortisone Taper Protocol</div>
      {TAPER.map(({ day, dose, color }) => (
        <div key={day} style={{ ...card({ marginBottom: 7, borderLeft: `3px solid ${color}` }) }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color, minWidth: 80, flexShrink: 0 }}>{day}</span>
            <span style={{ fontFamily: T.mono, fontSize: 11.5, color: T.white, lineHeight: 1.4 }}>{dose}</span>
          </div>
        </div>
      ))}

      <div style={sL(T.purple)}>Sick Day Rules — Patient Education</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        {[
          { rule: "Minor illness (fever, flu, mild GI)",  action: "Double or triple usual steroid dose × 5–7 days · do NOT skip doses · resume normal dose when recovered" },
          { rule: "Vomiting / unable to take PO",         action: "Inject IM hydrocortisone immediately (emergency kit) → go to ED for IV hydrocortisone · do NOT wait" },
          { rule: "Major surgery / trauma",               action: "100 mg hydrocortisone IV peri-operatively · inform anesthesia and surgeon of adrenal insufficiency · stress dose for 24–48h post-op" },
          { rule: "Dental procedures (minor)",            action: "Double dose day of procedure · resume normal dose next day" },
        ].map(({ rule, action }, i) => (
          <div key={i} style={{ paddingBottom: 8, marginBottom: 8, borderBottom: i < 3 ? `1px solid ${T.border}` : "none" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.purple, marginBottom: 3 }}>{rule}</div>
            <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{action}</div>
          </div>
        ))}
      </div>

      <div style={sL(T.gold)}>Disposition &amp; Follow-Up</div>
      <div style={{ ...card() }}>
        {[
          { label: "ICU",           detail: "Hemodynamic instability · vasopressor-dependent · GCS < 13 · active seizures or severe hypoglycemia · bilateral adrenal hemorrhage" },
          { label: "Telemetry",     detail: "Stabilizing but requires continuous IV hydrocortisone and monitoring · significant electrolyte abnormalities" },
          { label: "Step-Down",     detail: "Hemodynamically stable · transitioning to PO steroids · electrolytes normalizing · Endocrinology consult" },
          { label: "Endocrinology", detail: "Consult for all newly diagnosed adrenal insufficiency · guide long-term replacement · arrange follow-up within 2–4 weeks" },
          { label: "Patient Ed.",   detail: "Medical alert bracelet (MUST) · emergency IM injection kit prescription · sick day rules verbally taught · written instructions · primary care follow-up" },
        ].map(({ label, detail }, i) => (
          <div key={i} style={{ display: "flex", gap: 10, paddingBottom: 7, marginBottom: 7, borderBottom: i < 4 ? `1px solid ${T.border}` : "none" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.gold, minWidth: 110, flexShrink: 0 }}>{label}</div>
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
          <span style={pill("linear-gradient(135deg,#0d9488,#065f46)")}>Endocrine Society</span>
        </div>
        <h1 style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 700, margin: "0 0 4px", lineHeight: 1.15 }}>Adrenal Crisis</h1>
        <p style={{ color: T.muted, fontSize: 12, margin: "0 0 20px" }}>Primary vs Secondary AI · 4 Is precipitants · Hydrocortisone protocol · Cosyntropin test · Sick day rules</p>
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