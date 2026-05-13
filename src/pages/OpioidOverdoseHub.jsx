import { useState } from "react";

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
const sL   = (c = T.amber) => ({ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: c, margin: "18px 0 10px", display: "flex", alignItems: "center", gap: 8 });
const dv   = { height: 1, background: T.border, margin: "10px 0" };

const OPIOIDS = [
  { id: "heroin",   name: "Heroin / Morphine",       color: T.gold,   halfLife: "2–4h",       concern: "Standard naloxone dosing effective · naloxone outlasts drug · observe 1–2h after last dose", duration: "Short — 30–60 min" },
  { id: "fentanyl", name: "Illicit Fentanyl / Carfentanil", color: T.coral, halfLife: "2–4h (extremely potent)", concern: "⚠ May need repeated high-dose naloxone or infusion · carfentanil is 10,000× morphine · high doses required · watch for re-sedation", duration: "Short — but extreme potency means more naloxone needed" },
  { id: "methadone", name: "Methadone",              color: T.coral,  halfLife: "24–36h",     concern: "⚠ NALOXONE HALF-LIFE (30–90 min) MUCH SHORTER THAN METHADONE · naloxone infusion essential · observe minimum 6–12h · almost always admit", duration: "Very long — 24–36h" },
  { id: "buprenorphine", name: "Buprenorphine",      color: T.amber,  halfLife: "24–42h",     concern: "Partial agonist with high receptor affinity · partial reversal expected · may need high naloxone doses · respiratory depression usually mild · observe 4–6h minimum", duration: "Long — 24–42h" },
  { id: "oxycodone", name: "Oxycodone / Hydrocodone IR", color: T.gold, halfLife: "3–6h",   concern: "Standard dosing effective · observe 2–4h after last naloxone dose", duration: "Intermediate" },
  { id: "er",       name: "Extended-Release Opioids", color: T.amber,  halfLife: "8–24h+",    concern: "⚠ Naloxone infusion likely needed · observe minimum 4–6h · multiple redosing required · consider admission for all ER opioid OD", duration: "Long — naloxone infusion often required" },
];

const COWS_ITEMS = [
  { id: "pulse",   label: "Resting pulse rate",        opts: ["≤ 80 = 0", "81–100 = 1", "101–120 = 2", "> 120 = 4"] },
  { id: "sweating", label: "Sweating",                 opts: ["No sweat = 0", "Barely perceptible = 1", "Beads on forehead = 3", "Drenching = 4"] },
  { id: "restlessness", label: "Restlessness",         opts: ["Able to sit still = 0", "Reports difficulty sitting still = 1", "Frequent shifting = 3", "Unable to sit still = 5"] },
  { id: "pupil",   label: "Pupil size",                opts: ["Pinpoint or normal = 0", "Possibly larger = 1", "Moderately dilated = 2", "Markedly dilated = 5"] },
  { id: "gi",      label: "GI upset",                  opts: ["None = 0", "Stomach cramps = 1", "Nausea / loose stool = 3", "Vomiting / diarrhea = 5"] },
  { id: "tremor",  label: "Tremor",                    opts: ["None = 0", "Mild = 1", "Moderate = 2", "Severe = 4"] },
  { id: "yawning", label: "Yawning",                   opts: ["None = 0", "1×/observation = 1", "3×/observation = 2", "Several times = 4"] },
  { id: "anxiety", label: "Anxiety / irritability",    opts: ["None = 0", "Mildly anxious = 1", "Moderately anxious = 2", "Very anxious / severe = 5"] },
  { id: "goose",   label: "Gooseflesh / piloerection", opts: ["None = 0", "Barely visible = 1", "Prominent = 3", "Prominent gooseflesh = 5"] },
  { id: "bone",    label: "Bone / joint aches",        opts: ["None = 0", "Mild = 1", "Severe = 2", "Incapacitating = 4"] },
  { id: "nose",    label: "Runny nose / tearing",      opts: ["None = 0", "Sniffling = 1", "Frequent = 2", "Streaming = 4"] },
];

const COWS_SCORES = [
  { pts: [0, 1], label: "No withdrawal", color: T.green },
  { pts: [2, 4],  label: "Not significant", color: T.teal },
  { pts: [5, 12], label: "Mild withdrawal", color: T.gold },
  { pts: [13, 24], label: "Moderate withdrawal", color: T.amber },
  { pts: [25, 36], label: "Moderately severe", color: T.coral },
  { pts: [37, 99], label: "Severe withdrawal", color: T.coral },
];

export default function OpioidOverdoseHub({ onBack }) {
  const [tab, setTab]     = useState(0);
  const [route, setRoute] = useState("IV");
  const [opioid, setOpioid] = useState(null);
  const [cows, setCows]   = useState({});
  const TABS = ["Recognition", "Naloxone", "Observation", "Harm Reduction"];

  const selOpioid = OPIOIDS.find(o => o.id === opioid);

  const cowsTotal = COWS_ITEMS.reduce((sum, item) => {
    const val = cows[item.id];
    if (val === undefined) return sum;
    const match = item.opts[val].match(/= (\d+)/);
    return sum + (match ? parseInt(match[1]) : 0);
  }, 0);

  const cowsInterp = COWS_SCORES.find(s => cowsTotal >= s.pts[0] && cowsTotal <= s.pts[1]);

  const suboxoneDose = cowsTotal >= 8
    ? "8 mg SL initial dose · observe 1h · add 4–8 mg if withdrawal not controlled · max 24 mg day 1"
    : "COWS ≥ 8 required before giving buprenorphine";

  // ── TAB 0: RECOGNITION ──────────────────────────────────────────────────
  const T0 = (
    <div>
      <div style={{ ...G({ borderRadius: 14, border: `2px solid ${T.coral}55`, background: "rgba(244,63,94,0.09)", marginBottom: 16 }), padding: "14px" }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: T.coral, marginBottom: 6 }}>Opioid Overdose Triad</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
          {["🔴 Miosis (pinpoint pupils)", "🫁 Respiratory depression (RR < 12)", "😶 Altered mentation / coma"].map(s => (
            <span key={s} style={{ ...tag(T.coral), fontSize: 11 }}>{s}</span>
          ))}
        </div>
        <div style={{ fontSize: 11.5, color: T.muted }}>Not all three required. Any suspected opioid OD with respiratory depression → give naloxone immediately. Do not wait for pupil exam. In fentanyl OD, onset is seconds.</div>
      </div>

      <div style={sL()}>Full Clinical Picture</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
        <div style={card({ padding: "12px 13px", borderLeft: `3px solid ${T.amber}` })}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.amber, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 7 }}>CNS / Respiratory</div>
          {["Miosis (pinpoint) — hallmark", "Depressed LOC / coma", "RR < 12 or apnea", "Shallow / agonal respirations", "Snoring respirations", "Cyanosis (late sign)", "Flaccid muscle tone"].map((s, i) => (
            <div key={i} style={{ fontSize: 11, color: T.muted, marginBottom: 3, display: "flex", gap: 5 }}><span style={{ color: T.amber }}>●</span>{s}</div>
          ))}
        </div>
        <div style={card({ padding: "12px 13px", borderLeft: `3px solid ${T.blue}` })}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.blue, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 7 }}>Cardiovascular / Other</div>
          {["Bradycardia (variable)", "Hypotension", "Hypothermia", "Decreased bowel sounds", "Urinary retention", "Track marks (IV use)", "Skin-popping marks (delayed absorption)"].map((s, i) => (
            <div key={i} style={{ fontSize: 11, color: T.muted, marginBottom: 3, display: "flex", gap: 5 }}><span style={{ color: T.blue }}>●</span>{s}</div>
          ))}
        </div>
      </div>

      <div style={sL(T.gold)}>Opioid Type — Clinical Implications</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
        {OPIOIDS.map(o => (
          <button key={o.id} onClick={() => setOpioid(opioid === o.id ? null : o.id)}
            style={{ padding: "6px 12px", borderRadius: 8, border: `1.5px solid ${opioid === o.id ? o.color : T.border}`, background: opioid === o.id ? o.color + "20" : T.glass, color: opioid === o.id ? o.color : T.muted, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: T.sans, transition: "all 0.15s" }}>
            {o.name.split(" / ")[0]}
          </button>
        ))}
      </div>
      {selOpioid && (
        <div style={{ ...card({ border: `1.5px solid ${selOpioid.color}55`, marginBottom: 14 }) }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: selOpioid.color, marginBottom: 8 }}>{selOpioid.name}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
            {[{ l: "Half-Life", v: selOpioid.halfLife }, { l: "Effect Duration", v: selOpioid.duration }].map(({ l, v }) => (
              <div key={l} style={{ ...G({ borderRadius: 8 }), padding: "8px 10px" }}>
                <div style={{ fontSize: 10, color: T.dim, marginBottom: 2 }}>{l}</div>
                <div style={{ fontFamily: T.mono, fontSize: 11.5, color: T.white }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={aBox(selOpioid.color, 0)}>
            <div style={{ fontSize: 11, fontWeight: 700, color: selOpioid.color, marginBottom: 2 }}>Clinical Concern</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>{selOpioid.concern}</div>
          </div>
        </div>
      )}

      <div style={sL(T.purple)}>Differential Diagnosis</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
        {[
          { d: "Hypoglycemia",          clue: "Check glucose FIRST — corrects in seconds · no miosis required", color: T.gold },
          { d: "Benzodiazepine OD",     clue: "No miosis · no reversal with naloxone · flumazenil rarely indicated", color: T.blue },
          { d: "Alcohol intoxication",  clue: "Normal pupils · ETOH odor · elevated osmol gap", color: T.amber },
          { d: "Carbon Monoxide",       clue: "SpO₂ falsely normal · co-exposure · COHgb level", color: T.coral },
          { d: "CNS event (stroke/SDH)", clue: "Focal deficits · unequal pupils · no response to naloxone · CT head", color: T.purple },
          { d: "Mixed overdose",         clue: "Partial response to naloxone · mixed toxidrome · always check APAP", color: T.teal },
        ].map(({ d, clue, color }) => (
          <div key={d} style={{ ...G({ borderRadius: 9 }), padding: "9px 11px" }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color, marginBottom: 2 }}>{d}</div>
            <div style={{ fontSize: 11, color: T.muted }}>{clue}</div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── TAB 1: NALOXONE ──────────────────────────────────────────────────────
  const T1 = (
    <div>
      <div style={aBox(T.amber, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.amber, marginBottom: 4 }}>Naloxone — Competitive Opioid Antagonist · Half-life 30–90 min</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>Goal: restore respiratory drive (RR ≥ 12, SpO₂ ≥ 94%) — NOT full consciousness. Titrate carefully. Precipitated withdrawal = vomiting + aspiration risk + catecholamine surge. Shorter half-life than most opioids — re-sedation is common.</div>
      </div>

      <div style={sL()}>Route Selector</div>
      <div style={{ display: "flex", gap: 5, marginBottom: 14 }}>
        {["IV", "IM", "IN", "SQ", "ET"].map(r => (
          <button key={r} onClick={() => setRoute(r)}
            style={{ flex: 1, padding: "8px 4px", borderRadius: 8, border: `1.5px solid ${route === r ? T.amber : T.border}`, background: route === r ? "rgba(251,146,60,0.18)" : T.glass, color: route === r ? T.amber : T.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.sans, transition: "all 0.15s" }}>
            {r}
          </button>
        ))}
      </div>

      {route === "IV" && (
        <div style={{ ...card({ marginBottom: 14 }) }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.amber, marginBottom: 10 }}>IV — Titrated Approach (Preferred in Clinical Setting)</div>
          {[
            { ind: "Opioid-naive / gentle reversal (prescribed opioids)", dose: "0.04 mg IV q 2–3 min · titrate up to RR ≥ 12", note: "Start low to prevent acute withdrawal and aspiration. Titrate — do not slam." },
            { ind: "Standard reversal",                                    dose: "0.4 mg IV q 2–3 min · repeat PRN · up to 10 mg total", note: "Repeat every 20–90 min as naloxone wears off before the opioid" },
            { ind: "Cardiac arrest / immediate life threat",               dose: "2 mg IV push · may repeat ×3 (total 6 mg) · if no response after 10 mg → likely not pure opioid OD", note: "Full reversal acceptable — acute withdrawal tolerable vs death" },
          ].map(({ ind, dose, note }) => (
            <div key={ind} style={{ ...G({ borderRadius: 9, marginBottom: 8 }), padding: "11px 13px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.amber, marginBottom: 4 }}>{ind}</div>
              <div style={{ fontFamily: T.mono, fontSize: 13, color: T.coral, fontWeight: 700, marginBottom: 4 }}>{dose}</div>
              <div style={{ fontSize: 11.5, color: T.muted }}>{note}</div>
            </div>
          ))}
        </div>
      )}

      {route === "IM" && (
        <div style={{ ...card({ marginBottom: 14 }) }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.amber, marginBottom: 8 }}>IM — Prehospital / No IV Access</div>
          <div style={aBox(T.amber, 0)}>
            <div style={{ fontFamily: T.mono, fontSize: 20, fontWeight: 800, color: T.amber, marginBottom: 4 }}>0.4 mg IM · repeat q 2–3 min PRN</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>Onset 3–5 min vs 1–2 min IV · anterolateral thigh preferred · repeat up to 10 mg total · auto-injector (Evzio 0.4 mg) · widely used by EMS and lay-responders</div>
          </div>
        </div>
      )}

      {route === "IN" && (
        <div style={{ ...card({ marginBottom: 14 }) }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.teal, marginBottom: 8 }}>Intranasal — Community / Lay-Responder Standard</div>
          <div style={aBox(T.teal, 0)}>
            <div style={{ fontFamily: T.mono, fontSize: 20, fontWeight: 800, color: T.teal, marginBottom: 4 }}>4 mg (Narcan nasal spray) per nostril · repeat q 2–3 min</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>No needle required · onset 3–5 min · equivalent to 0.4 mg IM · one spray per nostril · alternate nostrils for repeat doses · available OTC at pharmacies nationwide · standard lay-responder and EMS route in most states</div>
          </div>
        </div>
      )}

      {route === "SQ" && (
        <div style={{ ...card({ marginBottom: 14 }) }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.blue, marginBottom: 8 }}>Subcutaneous — When IV / IM Not Possible</div>
          <div style={aBox(T.blue, 0)}>
            <div style={{ fontFamily: T.mono, fontSize: 20, fontWeight: 800, color: T.blue, marginBottom: 4 }}>0.4 mg SQ · repeat q 2–3 min PRN</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>Slower absorption than IM · less reliable in circulatory collapse (poor perfusion) · acceptable when other routes unavailable · same dosing as IM · establish IV access as soon as possible</div>
          </div>
        </div>
      )}

      {route === "ET" && (
        <div style={{ ...card({ marginBottom: 14 }) }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.purple, marginBottom: 8 }}>Endotracheal — Last Resort (Intubated, No IV/IO)</div>
          <div style={aBox(T.purple, 0)}>
            <div style={{ fontFamily: T.mono, fontSize: 20, fontWeight: 800, color: T.purple, marginBottom: 4 }}>2–2.5× IV dose diluted in 10 mL NS</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>Inject down ET tube → 5 bag-valve-mask ventilations · unpredictable absorption · establish IV/IO access immediately · use only as bridge · absorption highly variable</div>
          </div>
        </div>
      )}

      <div style={sL(T.coral)}>Naloxone Infusion — Long-Acting Opioids</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.5, marginBottom: 10 }}>
          Use when: methadone · extended-release opioids · required repeated boluses · re-sedation after initial reversal.
        </div>
        {[
          { step: "Step 1", action: "Determine effective reversal dose", detail: "Note how many mg produced adequate reversal (RR ≥ 12, SpO₂ ≥ 94%)" },
          { step: "Step 2", action: "Hourly rate = ⅔ of effective dose per hour", detail: "Example: 0.8 mg reversed → infuse at 0.5–0.6 mg/h" },
          { step: "Step 3", action: "Mix: 8 mg naloxone in 250 mL NS (32 mcg/mL)", detail: "Run at calculated rate · bolus if re-sedation occurs" },
          { step: "Step 4", action: "Titrate every 30 min", detail: "Target RR ≥ 12 · SpO₂ ≥ 94% · GCS improving · watch for withdrawal signs with over-correction" },
        ].map(({ step, action, detail }) => (
          <div key={step} style={{ display: "flex", gap: 10, marginBottom: 7 }}>
            <div style={{ width: 52, height: 22, borderRadius: 5, background: T.coral + "22", border: `1px solid ${T.coral}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: T.coral, flexShrink: 0 }}>{step}</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, marginBottom: 1 }}>{action}</div>
              <div style={{ fontSize: 11.5, color: T.muted }}>{detail}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={sL(T.teal)}>Precipitated Withdrawal — Avoid Aggressive Reversal</div>
      <div style={aBox(T.teal, 0)}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: T.teal, marginBottom: 4 }}>Titrate naloxone to RR ≥ 12 — NOT to full consciousness</div>
        <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.5, marginBottom: 8 }}>Acute opioid withdrawal = vomiting + aspiration risk + catecholamine surge + extreme agitation. A sedated but breathing patient is safer than a combative withdrawing patient.</div>
        {["Vomiting → aspiration (highest risk in CNS-depressed patient)", "Pulmonary edema (mechanism unclear but well-documented)", "Catecholamine surge → hypertension · arrhythmia", "Extreme agitation → patient leaving AMA before cleared", "Risk of re-overdose after early departure"].map((s, i) => (
          <div key={i} style={{ fontSize: 11.5, color: T.muted, display: "flex", gap: 7, marginBottom: 3 }}>
            <span style={{ color: T.coral }}>⚠</span>{s}
          </div>
        ))}
      </div>
    </div>
  );

  // ── TAB 2: OBSERVATION ──────────────────────────────────────────────────
  const T2 = (
    <div>
      <div style={aBox(T.gold, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.gold, marginBottom: 2 }}>Observation Duration = Opioid Half-Life, Not Naloxone</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>Naloxone (30–90 min) wears off before most opioids. The "wake and walk" discharge approach is dangerous for long-acting opioids. Duration of observation is determined by what the patient took.</div>
      </div>

      <div style={sL()}>Observation by Opioid Type</div>
      {[
        { opioid: "Heroin / Short-acting IV morphine",       obs: "1–2h after last naloxone dose",     admit: false, color: T.green,  note: "Discharge if alert · RR ≥ 12 · SpO₂ ≥ 95% RA · no further naloxone needed" },
        { opioid: "Oxycodone IR / Hydrocodone IR",           obs: "2–4h after last naloxone dose",     admit: false, color: T.teal,   note: "Watch for re-sedation as absorption continues · delayed peak possible" },
        { opioid: "ER/LA Opioids (OxyContin, MS Contin)",   obs: "4–6h minimum · often longer",       admit: true,  color: T.amber,  note: "High re-sedation risk · naloxone infusion often needed · strongly consider admission" },
        { opioid: "Methadone",                               obs: "Minimum 6–12h · almost always admit", admit: true, color: T.coral,  note: "Half-life 24–36h · far outlasts naloxone · ICU-level monitoring · naloxone infusion standard · QTc monitoring" },
        { opioid: "Fentanyl patches (transdermal)",          obs: "12–24h minimum",                    admit: true,  color: T.coral,  note: "Remove patch immediately · skin depot continues releasing · naloxone infusion · ICU consideration" },
        { opioid: "Buprenorphine",                           obs: "4–6h minimum",                      admit: null,  color: T.blue,   note: "Partial agonist — partial reversal expected · high naloxone doses required · respiratory depression usually mild · may initiate buprenorphine treatment in ED" },
      ].map(({ opioid, obs, admit, color, note }) => (
        <div key={opioid} style={{ ...card({ marginBottom: 8, borderLeft: `3px solid ${color}` }) }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 5 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color }}>{opioid}</span>
            <span style={{ ...tag(admit ? T.coral : admit === false ? T.green : T.gold), fontSize: 9, whiteSpace: "nowrap", marginLeft: 6 }}>{obs}</span>
          </div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{note}</div>
        </div>
      ))}

      <div style={sL(T.green)}>Discharge Criteria — ALL Required</div>
      <div style={{ ...card({ background: "rgba(34,197,94,0.07)", borderColor: "rgba(34,197,94,0.25)", marginBottom: 14 }) }}>
        {["Alert and oriented to baseline mental status",
          "RR ≥ 12/min consistently without stimulation during observation period",
          "SpO₂ ≥ 95% on room air without supplemental oxygen",
          "No repeat naloxone required during observation period",
          "Acetaminophen level checked (coingestant screening)",
          "Urine tox screen reviewed",
          "Naloxone prescription provided (Narcan nasal spray 4 mg × 2)",
          "Naloxone education completed — patient AND companion",
          "Addiction medicine referral offered / warm handoff arranged",
          "Return precautions given · reliable discharge plan"].map((c, i) => (
          <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 8, marginBottom: 5 }}>
            <span style={{ color: T.green }}>✓</span>{c}
          </div>
        ))}
      </div>

      <div style={sL(T.coral)}>Admission Criteria</div>
      {["Long-acting or extended-release opioid ingested",
        "Methadone overdose (nearly always admit)",
        "Required > 2 doses naloxone for adequate reversal",
        "Currently on naloxone infusion",
        "Significant coingestants (benzodiazepines, alcohol, tricyclics)",
        "Aspiration pneumonia (hypoxia · infiltrate · fever)",
        "Hemodynamic instability",
        "Unstable psychiatric status · active suicidal ideation"].map((s, i) => (
        <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 8, marginBottom: 5 }}>
          <span style={{ color: T.coral }}>●</span>{s}
        </div>
      ))}
    </div>
  );

  // ── TAB 3: HARM REDUCTION ────────────────────────────────────────────────
  const T3 = (
    <div>
      <div style={aBox(T.purple, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.purple, marginBottom: 2 }}>The ED Visit Is a Critical Intervention Opportunity</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>Patients who survive overdose are at highest risk of fatal overdose in the days immediately after — not months. ED-initiated buprenorphine is 6× more likely to achieve treatment retention at 30 days vs referral alone (D'Onofrio 2015 JAMA). Every patient leaves with naloxone.</div>
      </div>

      <div style={sL()}>COWS Score — Buprenorphine Readiness Calculator</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        <div style={{ fontSize: 11.5, color: T.muted, marginBottom: 10 }}>Buprenorphine requires COWS ≥ 8 (mild withdrawal) before initiation — prevents precipitated withdrawal. Tap each item to score.</div>
        {COWS_ITEMS.map(item => (
          <div key={item.id} style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: T.muted, marginBottom: 5 }}>{item.label}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {item.opts.map((opt, idx) => {
                const sel = cows[item.id] === idx;
                const pts = parseInt(opt.match(/= (\d+)/)?.[1] || "0");
                return (
                  <div key={idx} onClick={() => setCows(p => ({ ...p, [item.id]: p[item.id] === idx ? undefined : idx }))}
                    style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", borderRadius: 7, border: `1px solid ${sel ? T.amber + "70" : T.border}`, background: sel ? "rgba(251,146,60,0.15)" : T.glassMid, cursor: "pointer", transition: "all 0.12s" }}>
                    <span style={{ fontSize: 11.5, color: sel ? T.white : T.muted }}>{opt.split(" = ")[0]}</span>
                    <span style={{ fontFamily: T.mono, fontSize: 11, fontWeight: 700, color: sel ? T.amber : T.dim }}>+{pts}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        <div style={dv} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 700 }}>COWS Total</span>
          <span style={{ fontFamily: T.mono, fontSize: 28, fontWeight: 800, color: cowsInterp?.color || T.dim }}>{cowsTotal}</span>
        </div>
        {cowsInterp && (
          <div style={aBox(cowsInterp.color, 8)}>
            <div style={{ fontSize: 13, fontWeight: 700, color: cowsInterp.color, marginBottom: 3 }}>{cowsInterp.label}</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>{cowsTotal >= 8 ? "Buprenorphine initiation appropriate" : "Wait until COWS ≥ 8 before giving buprenorphine"}</div>
          </div>
        )}
        <div style={aBox(cowsTotal >= 8 ? T.teal : T.border.replace("0.08","0.3"), 0)}>
          <div style={{ fontSize: 11, fontWeight: 700, color: cowsTotal >= 8 ? T.teal : T.dim, marginBottom: 2 }}>Buprenorphine Dosing</div>
          <div style={{ fontSize: 11.5, color: cowsTotal >= 8 ? T.muted : T.dim }}>{suboxoneDose}</div>
        </div>
        <button onClick={() => setCows({})} style={{ marginTop: 8, padding: "5px 12px", borderRadius: 7, border: `1px solid ${T.border}`, background: T.glass, color: T.dim, fontSize: 11, cursor: "pointer", fontFamily: T.sans }}>Reset COWS</button>
      </div>

      <div style={sL(T.teal)}>MOUD — Medications for Opioid Use Disorder</div>
      {[
        { drug: "Buprenorphine / Naloxone (Suboxone)",  color: T.teal,
          when: "COWS ≥ 8 (mild-moderate withdrawal) · ≥ 12–24h since last full-agonist opioid · patient motivated · NOT in setting of active fentanyl on board without appropriate precautions",
          dose: "8 mg SL initial → 4–8 mg additional if needed → 16–24 mg first day · prescribe 7-day bridge (X-waiver no longer required since 2023)",
          evidence: "D'Onofrio 2015 JAMA: ED-initiated buprenorphine → 6× more likely to engage in treatment at 30 days · gold standard for ED MOUD initiation" },
        { drug: "Methadone",                            color: T.gold,
          when: "NOT initiated in ED (requires DEA-licensed OTP) · exception: patients already on maintenance can receive dose verification",
          dose: "Refer to opioid treatment program · document dose verification if on maintenance treatment",
          evidence: "Reduces overdose mortality by 50–70% · access barriers significant · advocate for OTP referral" },
        { drug: "Naltrexone (Vivitrol / Revia)",        color: T.blue,
          when: "After 7–10 days opioid-free · no opioids in system (precipitates severe withdrawal) · motivated for abstinence · usually not feasible in acute ED",
          dose: "IM: 380 mg monthly injection · Oral: 50 mg daily (adherence challenging)",
          evidence: "Highly effective for motivated patients · adherence much better with monthly injection vs daily pill" },
      ].map(({ drug, color, when, dose, evidence }) => (
        <div key={drug} style={{ ...card({ marginBottom: 10, borderLeft: `3px solid ${color}` }) }}>
          <div style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 6 }}>{drug}</div>
          {[{ l: "When", v: when }, { l: "Dosing", v: dose }, { l: "Evidence", v: evidence }].map(({ l, v }) => (
            <div key={l} style={{ display: "flex", gap: 10, paddingBottom: 5, marginBottom: 5, borderBottom: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 12, fontWeight: 700, color, minWidth: 60, flexShrink: 0 }}>{l}</div>
              <div style={{ fontSize: 11.5, color: T.muted }}>{v}</div>
            </div>
          ))}
        </div>
      ))}

      <div style={sL(T.coral)}>Take-Home Naloxone — Every Single Patient</div>
      {["Prescribe Narcan nasal spray 4 mg × 2 kits (one for patient · one for someone they live with)",
        "Demonstrate IN technique before discharge · teach rescue breathing + recovery position",
        "Give IN naloxone → call 911 → rescue breathing → 2nd dose if no response in 2–3 min",
        "Good Samaritan Laws in most states — legal protection for calling 911 during OD",
        "Naloxone available OTC without prescription at most US pharmacies",
        "Provide fentanyl test strips where supply contamination is high · drug checking services",
        "Never use alone — tell someone · carry naloxone · use in a safe place"].map((s, i) => (
        <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 8, marginBottom: 6 }}>
          <span style={{ color: T.coral }}>▸</span>{s}
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: `radial-gradient(ellipse 70% 40% at 15% 0%, rgba(251,146,60,0.09) 0%, transparent 60%), radial-gradient(ellipse 50% 35% at 85% 95%, rgba(167,139,250,0.07) 0%, transparent 55%), ${T.bg}`, fontFamily: T.sans, color: T.white, paddingBottom: 80 }}>
      <div style={{ padding: "20px 20px 0" }}>
        {onBack && (
          <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", color: T.teal, fontSize: 13, fontFamily: T.sans, cursor: "pointer", padding: "4px 0", marginBottom: 16 }}>
            ← Critical Protocols
          </button>
        )}
        <div>
          <span style={pill("linear-gradient(135deg,#fb923c,#b45309)")}>☠️ Toxicologic</span>
          <span style={pill("linear-gradient(135deg,#0d9488,#065f46)")}>SAMHSA / ACEP 2023</span>
        </div>
        <h1 style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 700, margin: "0 0 4px", lineHeight: 1.15 }}>Opioid Overdose</h1>
        <p style={{ color: T.muted, fontSize: 12, margin: "0 0 20px" }}>Overdose triad · Multi-route naloxone · Infusion protocol · Observation by opioid type · COWS calculator · Buprenorphine initiation</p>
      </div>

      <div style={{ display: "flex", gap: 4, padding: "0 20px", marginBottom: 18, overflowX: "auto", scrollbarWidth: "none" }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            style={{ padding: "7px 15px", borderRadius: 9, border: `1.5px solid ${tab === i ? T.amber : T.border}`, background: tab === i ? "rgba(251,146,60,0.14)" : T.glass, color: tab === i ? T.amber : T.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.sans, whiteSpace: "nowrap", transition: "all 0.18s", backdropFilter: "blur(8px)" }}>
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
  );
}