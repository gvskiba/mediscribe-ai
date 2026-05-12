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
const sL   = (c = T.amber) => ({ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: c, margin: "18px 0 10px", display: "flex", alignItems: "center", gap: 8 });
const dv   = { height: 1, background: T.border, margin: "10px 0" };
const inp  = { padding: "9px 12px", background: T.glassMid, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 13, fontFamily: T.mono, fontWeight: 600, outline: "none" };

const CIWA_ITEMS = [
  { id: "nausea",  label: "Nausea / Vomiting",     max: 7, desc: "0=None · 1=mild nausea, no vomiting · 4=intermittent nausea with dry heaves · 7=constant nausea, frequent vomiting" },
  { id: "tremor",  label: "Tremor",                max: 7, desc: "0=No tremor · 1=not visible but felt · 4=moderate, arms extended · 7=severe, unable to cooperate" },
  { id: "diaphoresis", label: "Diaphoresis",       max: 7, desc: "0=No sweat visible · 1=barely perceptible · 4=beads of sweat on forehead · 7=drenching" },
  { id: "anxiety", label: "Anxiety",               max: 7, desc: "0=No anxiety · 1=mildly anxious · 4=moderately anxious/guarded · 7=acute panic state" },
  { id: "agitation",label: "Agitation",            max: 7, desc: "0=Normal · 1=somewhat more than normal · 4=moderately fidgety/restless · 7=paces or thrashes" },
  { id: "tactile",  label: "Tactile Disturbances", max: 7, desc: "0=None · 1=very mild itching · 4=moderate hallucinations · 7=continuous hallucinations" },
  { id: "auditory", label: "Auditory Disturbances",max: 7, desc: "0=None · 1=very mild harshness · 4=moderate hallucinations · 7=continuous hallucinations" },
  { id: "visual",   label: "Visual Disturbances",  max: 7, desc: "0=None · 1=very mild sensitivity · 4=moderate hallucinations · 7=continuous hallucinations" },
  { id: "headache", label: "Headache / Fullness",  max: 7, desc: "0=None · 1=very mild · 4=moderately severe · 7=extremely severe" },
  { id: "orient",   label: "Orientation",          max: 4, desc: "0=Oriented · 1=date uncertain · 2=date disoriented · 3=place disoriented · 4=person/place/date disoriented" },
];

export default function AlcoholWithdrawalHub({ onBack }) {
  const navigate = useNavigate();
  const handleBack = () => onBack ? onBack() : navigate("/CriticalProtocolsPage");

  const [tab, setTab]   = useState(0);
  const [ciwa, setCiwa] = useState({});
  const [wt, setWt]     = useState("");
  const [protocol, setProtocol] = useState("symptom");
  const TABS = ["Recognition", "CIWA + Treatment", "Medications", "Monitoring"];

  const ciwaScore = CIWA_ITEMS.reduce((s, i) => s + (ciwa[i.id] || 0), 0);
  const ciwaInterp = ciwaScore >= 20 ? { label: "Severe Withdrawal / DTs", color: T.coral, action: "Aggressive IV benzodiazepines · ICU · intubation if refractory" }
    : ciwaScore >= 15 ? { label: "Moderate-Severe",     color: T.amber, action: "IV benzodiazepines · close monitoring · admission" }
    : ciwaScore >= 8  ? { label: "Moderate",             color: T.gold,  action: "PO or IV benzos q 1h PRN · admission · monitor q 4h" }
    : { label: "Mild",                                   color: T.teal,  action: "PO benzos PRN · consider discharge with close follow-up if reliable social support · ambulatory detox protocols in selected patients" };

  const wtNum = parseFloat(wt);
  const phenoLoad = !isNaN(wtNum) && wt ? (wtNum * 20).toFixed(0) : null;

  // ── TAB 0: RECOGNITION ──────────────────────────────────────────────────
  const T0 = (
    <div>
      <div style={aBox(T.coral, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, marginBottom: 2 }}>Alcohol Withdrawal — Mortality up to 5% for DTs Without Treatment</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>AWS is a hyperadrenergic state from GABA-A downregulation and NMDA upregulation after abrupt cessation. Delirium tremens (DTs) — the most severe form — carries 5–15% mortality untreated. Early treatment prevents escalation.</div>
      </div>

      <div style={sL()}>Timeline of Alcohol Withdrawal</div>
      {[
        { time: "6–12 hours",  phase: "Minor Withdrawal",  features: "Tremor · anxiety · diaphoresis · tachycardia · GI upset · insomnia · mild hypertension", color: T.teal },
        { time: "12–24 hours", phase: "Alcoholic Hallucinosis", features: "Visual/auditory/tactile hallucinations with INTACT orientation (sensorium clear) · patient knows hallucinations are not real · 25% of withdrawing patients", color: T.gold },
        { time: "24–48 hours", phase: "Withdrawal Seizures", features: "Generalized tonic-clonic · typically brief self-limited · multiple seizures common · status epilepticus in 3% · GCSE carries high mortality · treat and monitor · may recur", color: T.amber },
        { time: "48–72 hours", phase: "Delirium Tremens", features: "Confusion + disorientation + hallucinations + autonomic instability (fever · severe tachycardia · hypertension · diaphoresis) · mortality up to 15% without treatment", color: T.coral },
      ].map(({ time, phase, features, color }) => (
        <div key={time} style={{ ...card({ marginBottom: 9, borderLeft: `3px solid ${color}` }) }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color }}>{phase}</span>
            <span style={{ ...tag(color), fontSize: 9 }}>{time}</span>
          </div>
          <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{features}</div>
        </div>
      ))}

      <div style={aBox(T.gold, 14)}>
        <div style={{ fontSize: 11.5, color: T.muted }}>
          <span style={{ color: T.gold, fontWeight: 600 }}>Seizure Pearl: </span>
          Alcohol withdrawal seizures occur with a FALLING blood alcohol level — NOT at zero. A patient still intoxicated can begin seizing as their level drops. Ask when the last drink was, not just current BAL.
        </div>
      </div>

      <div style={sL(T.coral)}>High-Risk Features for Severe Withdrawal</div>
      {["Prior history of DTs or withdrawal seizures — strongest predictor",
        "Multiple prior detoxifications ('kindling phenomenon' — each withdrawal worse)",
        "Daily heavy alcohol use (> 8 drinks/day) for > 1 week",
        "Long duration of heavy use (years)",
        "Comorbid medical illness (liver disease · infection · trauma · malnutrition)",
        "Concurrent benzodiazepine or other CNS depressant use",
        "Elevated baseline CIWA on presentation",
        "Age &gt; 65"].map((s, i) => (
        <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 8, marginBottom: 5 }}>
          <span style={{ color: T.coral, flexShrink: 0 }}>●</span>{s}
        </div>
      ))}

      <div style={sL(T.purple)}>Differential Diagnosis</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
        {[
          { d: "Benzodiazepine withdrawal", clue: "Similar syndrome · longer timeline · history of BZD use", color: T.blue },
          { d: "Stimulant toxicity",         clue: "Cocaine · meth · autonomic instability + hypertension · tox screen", color: T.amber },
          { d: "Thyroid storm",              clue: "Fever + tachycardia · goiter · BWPS calculator (see ThyroidStormHub)", color: T.gold },
          { d: "Meningitis/Encephalitis",    clue: "Fever + altered mentation · LP if not clearly withdrawal · neck stiffness", color: T.coral },
          { d: "Hypoglycemia / Wernicke's",  clue: "Check glucose + thiamine immediately in every alcohol patient", color: T.teal },
          { d: "Serotonin syndrome",         clue: "Clonus + hyperreflexia · serotonergic drug history · see NMSHub", color: T.purple },
        ].map(({ d, clue, color }) => (
          <div key={d} style={{ ...G({ borderRadius: 9 }), padding: "9px 11px" }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color, marginBottom: 2 }}>{d}</div>
            <div style={{ fontSize: 11, color: T.muted }}>{clue}</div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── TAB 1: CIWA + TREATMENT ──────────────────────────────────────────
  const T1 = (
    <div>
      <div style={sL()}>CIWA-Ar Score Calculator</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        <div style={{ fontSize: 11.5, color: T.muted, marginBottom: 10 }}>Tap each item to score 0→max</div>
        {CIWA_ITEMS.map(item => (
          <div key={item.id} style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: T.muted }}>{item.label}</span>
              <span style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 700, color: (ciwa[item.id] || 0) > 0 ? T.amber : T.dim }}>
                {ciwa[item.id] || 0}
              </span>
            </div>
            <div style={{ fontSize: 10, color: T.dim, marginBottom: 5 }}>{item.desc}</div>
            <div style={{ display: "flex", gap: 3 }}>
              {Array.from({ length: item.max + 1 }, (_, i) => (
                <button key={i}
                  style={{ flex: 1, padding: "4px 0", borderRadius: 5, border: `1px solid ${(ciwa[item.id] || 0) === i ? T.amber : T.border}`, background: (ciwa[item.id] || 0) === i ? "rgba(251,146,60,0.2)" : T.glass, color: (ciwa[item.id] || 0) === i ? T.amber : T.dim, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: T.mono, transition: "all 0.1s" }}
                  onClick={() => setCiwa(p => ({ ...p, [item.id]: i }))}>
                  {i}
                </button>
              ))}
            </div>
          </div>
        ))}
        <div style={dv} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 700 }}>CIWA-Ar Total</span>
          <span style={{ fontFamily: T.mono, fontSize: 28, fontWeight: 800, color: ciwaInterp.color }}>{ciwaScore}</span>
        </div>
        <div style={aBox(ciwaInterp.color, 4)}>
          <div style={{ fontSize: 13, fontWeight: 700, color: ciwaInterp.color, marginBottom: 3 }}>{ciwaInterp.label}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{ciwaInterp.action}</div>
        </div>
        <button onClick={() => setCiwa({})} style={{ marginTop: 8, padding: "5px 12px", borderRadius: 7, border: `1px solid ${T.border}`, background: T.glass, color: T.dim, fontSize: 11, cursor: "pointer", fontFamily: T.sans }}>Reset</button>
      </div>

      <div style={sL()}>Protocol Selection</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {[{ k: "symptom", l: "Symptom-Triggered (preferred)" }, { k: "fixed", l: "Fixed-Schedule" }].map(({ k, l }) => (
          <button key={k} onClick={() => setProtocol(k)}
            style={{ flex: 1, padding: "8px", borderRadius: 9, border: `1.5px solid ${protocol === k ? T.amber : T.border}`, background: protocol === k ? "rgba(251,146,60,0.15)" : T.glass, color: protocol === k ? T.amber : T.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.sans, transition: "all 0.15s" }}>
            {l}
          </button>
        ))}
      </div>

      {protocol === "symptom" ? (
        <div style={{ ...card({ marginBottom: 14 }) }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.amber, marginBottom: 8 }}>Symptom-Triggered Protocol (CIWA-driven) — Preferred</div>
          <div style={{ fontSize: 11.5, color: T.muted, marginBottom: 10 }}>Administer benzodiazepine only when CIWA-Ar ≥ 8. Reassess every 1h. Advantage: less total benzodiazepine administered, faster treatment.</div>
          {[
            { ciwaRange: "CIWA 8–14", benzo: "Lorazepam 1–2 mg IV/PO", color: T.gold },
            { ciwaRange: "CIWA 15–19", benzo: "Lorazepam 2–4 mg IV OR Diazepam 10–20 mg PO", color: T.amber },
            { ciwaRange: "CIWA ≥ 20 (severe/DTs)", benzo: "Lorazepam 4 mg IV q 5–15 min until controlled OR Diazepam 10 mg IV q 5–10 min", color: T.coral },
          ].map(({ ciwaRange, benzo, color }) => (
            <div key={ciwaRange} style={{ ...G({ borderRadius: 9, marginBottom: 7 }), padding: "10px 12px", borderLeft: `3px solid ${color}` }}>
              <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 3 }}>{ciwaRange}</div>
              <div style={{ fontFamily: T.mono, fontSize: 12, color: T.white }}>{benzo}</div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ ...card({ marginBottom: 14 }) }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.blue, marginBottom: 8 }}>Fixed-Schedule Protocol</div>
          <div style={{ fontSize: 11.5, color: T.muted, marginBottom: 10 }}>Use when CIWA monitoring not reliable (delirium, inability to assess). Diazepam preferred — long half-life provides smooth coverage, self-tapering.</div>
          {[
            { drug: "Diazepam", schedule: "10 mg PO q 6h × 4 doses → 5 mg q 6h × 8 doses", note: "Standard taper · long-acting preferred for self-tapering via active metabolites" },
            { drug: "Chlordiazepoxide", schedule: "50–100 mg PO q 6h × 4 → 25–50 mg q 6h × 8 doses", note: "Alternative · long-acting · commonly used in medical detox units" },
            { drug: "Lorazepam (if liver disease)", schedule: "1–2 mg PO q 6h × 4 doses → 0.5–1 mg q 6h × 8 doses", note: "No hepatic metabolism (glucuronidation only) · preferred in liver failure · cirrhosis · shortest acting of the three" },
          ].map(({ drug, schedule, note }) => (
            <div key={drug} style={{ ...G({ borderRadius: 9, marginBottom: 7 }), padding: "10px 12px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.blue, marginBottom: 3 }}>{drug}</div>
              <div style={{ fontFamily: T.mono, fontSize: 11.5, color: T.white, marginBottom: 3 }}>{schedule}</div>
              <div style={{ fontSize: 11.5, color: T.muted }}>{note}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ── TAB 2: MEDICATIONS ──────────────────────────────────────────────────
  const T2 = (
    <div>
      <div style={sL()}>Benzodiazepines — First-Line</div>
      {[
        { drug: "Diazepam (Valium)",      dose: "5–20 mg IV/PO q 5–15 min PRN (severe) OR fixed taper schedule", note: "Long-acting (36–200h) → smooth self-tapering via active metabolites (nordazepam) · preferred for DTs · avoid in severe liver disease", color: T.blue },
        { drug: "Lorazepam (Ativan)",     dose: "1–4 mg IV/PO/IM q 15–30 min PRN", note: "Intermediate-acting · no hepatic Phase I metabolism (safer in liver disease) · IV preferred for DTs · GOLD STANDARD for AWS", color: T.teal },
        { drug: "Chlordiazepoxide (Librium)", dose: "25–100 mg PO q 4–6h", note: "Long-acting · oral only (no IV) · medical detox units · smooth taper · NOT ideal for severe DTs (no IV route)", color: T.gold },
        { drug: "Midazolam (Versed)",     dose: "1–5 mg IV q 5 min (ICU / refractory DTs)", note: "Short-acting · ideal for continuous infusion in ICU-level refractory DTs · intubated patients · titrate to sedation level · accumulates with prolonged use", color: T.purple },
      ].map(({ drug, dose, note, color }) => (
        <div key={drug} style={{ ...G(), padding: "10px 13px", marginBottom: 7, borderLeft: `3px solid ${color}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 3 }}>{drug}</div>
          <div style={{ fontFamily: T.mono, fontSize: 11.5, color: T.white, marginBottom: 3 }}>{dose}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{note}</div>
        </div>
      ))}

      <div style={sL(T.coral)}>Phenobarbital — Adjunct / Refractory DTs</div>
      <div style={{ ...card({ marginBottom: 12 }) }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, marginBottom: 8 }}>Phenobarbital Loading — Weight-Based</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
          <input value={wt} onChange={e => setWt(e.target.value)} placeholder="Weight (kg)" type="number"
            style={{ ...inp, flex: 1 }} />
          <span style={{ fontSize: 12, color: T.muted }}>kg</span>
        </div>
        {phenoLoad && (
          <div style={aBox(T.coral, 8)}>
            <div style={{ fontSize: 11, color: T.muted, marginBottom: 2 }}>Phenobarbital 20 mg/kg IV (max 1g) — loading dose over 30 min</div>
            <div style={{ fontFamily: T.mono, fontSize: 20, fontWeight: 800, color: T.coral }}>
              {Math.min(parseFloat(phenoLoad), 1000).toFixed(0)} mg IV over 30 min
            </div>
          </div>
        )}
        {[
          { ind: "Indication",  val: "Benzodiazepine-refractory DTs · severe AWS with contraindication to benzos · benzo-tolerant patients · ED-initiated phenobarbital reduces ICU admissions (Ho 2019 ACEP)" },
          { ind: "Mechanism",   val: "GABA-A positive allosteric modulator (like benzos but different binding site) · additive/synergistic with benzos · long half-life (2–6 days) → smooth self-taper" },
          { ind: "Caution",     val: "Respiratory depression risk (especially combined with benzos) · airway monitoring essential · avoid if severe COPD/respiratory compromise unless intubated" },
        ].map(({ ind, val }) => (
          <div key={ind} style={{ display: "flex", gap: 10, paddingBottom: 6, marginBottom: 6, borderBottom: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.coral, minWidth: 80, flexShrink: 0 }}>{ind}</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>{val}</div>
          </div>
        ))}
      </div>

      <div style={sL(T.gold)}>Adjunctive Medications</div>
      {[
        { drug: "Thiamine (Vitamin B1)", dose: "100–500 mg IV before any glucose", note: "ALWAYS BEFORE glucose · prevents Wernicke's encephalopathy · 500 mg IV TID × 3 days for high-risk patients (ataxia · confusion · malnourished) · classic triad: confusion + ataxia + ophthalmoplegia (Wernicke's)", color: T.gold },
        { drug: "Dextrose / Glucose",   dose: "D50 25–50 mL IV or D10W 100 mL IV", note: "Check glucose in every alcohol patient · hypoglycemia common from impaired gluconeogenesis · give AFTER thiamine", color: T.teal },
        { drug: "Magnesium Sulfate",    dose: "2–4 g IV over 30–60 min", note: "Depleted in chronic alcohol use · hypomagnesemia lowers seizure threshold · replace to Mg > 2 mEq/L · may reduce withdrawal severity", color: T.blue },
        { drug: "Multivitamin / Folate", dose: "1 MVI + Folic acid 1 mg IV/PO daily", note: "Folate deficiency common · thiamine and folate together · zinc and other micronutrients for alcohol-associated liver disease", color: T.purple },
        { drug: "Haloperidol",          dose: "2–5 mg IV/IM for agitation (adjunct only)", note: "ADJUNCT to benzos — does NOT treat withdrawal or prevent seizures · lowers seizure threshold · use only for hallucinatory agitation uncontrolled with benzos · never monotherapy for AWS", color: T.amber },
        { drug: "Dexmedetomidine",      dose: "0.2–1.5 mcg/kg/h IV infusion (ICU)", note: "Alpha-2 agonist · useful adjunct for autonomic instability and agitation · reduces benzo requirements in ICU · does NOT prevent seizures · requires ICU monitoring", color: T.teal },
      ].map(({ drug, dose, note, color }) => (
        <div key={drug} style={{ ...G(), padding: "10px 13px", marginBottom: 7, borderLeft: `3px solid ${color}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 3 }}>{drug}</div>
          <div style={{ fontFamily: T.mono, fontSize: 11.5, color: T.white, marginBottom: 3 }}>{dose}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{note}</div>
        </div>
      ))}

      <div style={sL(T.teal)}>Seizure Management</div>
      <div style={{ ...card() }}>
        {[
          { step: "First-line",   detail: "Benzodiazepines (lorazepam 4 mg IV) — treat underlying withdrawal · seizures self-limited in most cases · seizure from AWS responds to benzos better than AEDs", color: T.teal },
          { step: "Refractory",   detail: "Phenobarbital 20 mg/kg IV · propofol infusion if intubated · levetiracetam as adjunct (limited evidence) · intubation if status epilepticus", color: T.coral },
          { step: "AEDs (avoid)", detail: "Phenytoin / fosphenytoin NOT effective for AWS seizures — sodium channel mechanism does not address GABA/NMDA pathophysiology · only for comorbid epilepsy", color: T.amber },
          { step: "Imaging",      detail: "CT head for: first-time seizure without prior AWS history · focal deficits · trauma · fever + meningismus · failure to return to baseline after postictal period", color: T.purple },
        ].map(({ step, detail, color }, i) => (
          <div key={i} style={{ display: "flex", gap: 10, paddingBottom: 7, marginBottom: 7, borderBottom: i < 3 ? `1px solid ${T.border}` : "none" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color, minWidth: 80, flexShrink: 0 }}>{step}</div>
            <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{detail}</div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── TAB 3: MONITORING ───────────────────────────────────────────────────
  const T3 = (
    <div>
      <div style={sL()}>CIWA-Ar Monitoring Schedule</div>
      {[
        { freq: "q 1h (severe / DTs)",   items: "CIWA-Ar score · RR · HR · BP · temp · mental status · need for PRN benzo", color: T.coral },
        { freq: "q 2h (moderate)",       items: "CIWA-Ar · vital signs · response to last benzo dose", color: T.gold },
        { freq: "q 4h (mild / stable)",  items: "CIWA-Ar · vital signs · benzo level of sedation (over-sedation risk)", color: T.teal },
        { freq: "Continuous (ICU/DTs)",  items: "Cardiac monitor · SpO₂ · EtCO₂ if intubated · arterial line if hemodynamically unstable", color: T.purple },
      ].map(({ freq, items, color }) => (
        <div key={freq} style={{ ...G(), padding: "9px 12px", marginBottom: 6, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div style={{ fontFamily: T.mono, fontSize: 11.5, fontWeight: 700, color, minWidth: 150, flexShrink: 0 }}>{freq}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{items}</div>
        </div>
      ))}

      <div style={sL(T.teal)}>Essential Labs</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        {[
          { test: "Blood glucose",    why: "Hypoglycemia common · check immediately · give thiamine BEFORE glucose" },
          { test: "BMP",              why: "Hyponatremia (water intoxication or SIADH) · hypokalemia · hypomagnesemia · glucose · renal function for benzo clearance" },
          { test: "Mg + Phosphate",  why: "Both depleted in chronic alcohol use · Mg replacement reduces seizure threshold · phosphate for rhabdo / respiratory muscle function" },
          { test: "LFTs + INR",       why: "Hepatic function determines benzo choice (lorazepam for severe liver disease) · INR elevated = synthetic dysfunction" },
          { test: "BAL (serum ETOH)", why: "Quantify intoxication · does not diagnose withdrawal · BAL < 100 with symptoms of withdrawal = significant dependency" },
          { test: "CBC",              why: "Thrombocytopenia (alcohol-associated · marrow suppression · hypersplenism) · macrocytic anemia (folate deficiency) · leukocytosis (infection vs stress)" },
          { test: "Urine tox screen", why: "Detect coingestants (benzos · opioids · stimulants · GHB) · polydrug use extremely common" },
          { test: "Thiamine level",   why: "If available · does not change management (give thiamine regardless) · academic interest" },
        ].map(({ test, why }, i) => (
          <div key={test} style={{ display: "flex", gap: 10, paddingBottom: 6, marginBottom: 6, borderBottom: i < 7 ? `1px solid ${T.border}` : "none" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.amber, minWidth: 140, flexShrink: 0 }}>{test}</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>{why}</div>
          </div>
        ))}
      </div>

      <div style={sL(T.coral)}>ICU Admission Criteria — DTs</div>
      {["CIWA-Ar ≥ 20 despite initial treatment",
        "Refractory seizures or status epilepticus",
        "Requirement for > 40 mg diazepam (or equivalent) in first 4h",
        "Hemodynamic instability (HR > 150 · SBP > 200 · temp > 39°C)",
        "Respiratory depression or airway compromise",
        "Severe electrolyte derangements (Na < 120 · Mg < 1.0)",
        "Significant coingestants",
        "Intubation required for airway or sedation management"].map((s, i) => (
        <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 8, marginBottom: 5 }}>
          <span style={{ color: T.coral }}>●</span>{s}
        </div>
      ))}

      <div style={sL(T.purple)}>Wernicke's Encephalopathy — Never Miss</div>
      <div style={{ ...card({ background: "rgba(167,139,250,0.07)", borderColor: "rgba(167,139,250,0.3)" }) }}>
        <div style={{ fontSize: 11.5, color: T.muted, marginBottom: 8 }}>
          Classic triad present in only 16% of cases at autopsy — give thiamine empirically to ALL chronic alcohol users with ANY neurological symptoms.
        </div>
        {[{ f: "Classic Triad", v: "Confusion · Ataxia · Ophthalmoplegia (ANY one = give thiamine)" },
          { f: "Thiamine Dose", v: "500 mg IV TID × 3 days for suspected Wernicke's · 100 mg IV for prophylaxis" },
          { f: "Give Before",   v: "Always BEFORE dextrose — glucose metabolism depletes thiamine → precipitates Wernicke's in thiamine-deficient patient" },
          { f: "Risk Factors",  v: "Prolonged alcohol use · malnutrition · bariatric surgery · hyperemesis · TPN without thiamine · anorexia" },
        ].map(({ f, v }) => (
          <div key={f} style={{ display: "flex", gap: 10, paddingBottom: 5, marginBottom: 5, borderBottom: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.purple, minWidth: 100, flexShrink: 0 }}>{f}</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={sL(T.gold)}>Disposition</div>
      <div style={{ ...card() }}>
        {[
          { level: "ICU",          detail: "DTs · refractory seizures · hemodynamic instability · intubation · benzo requirements > 40 mg diazepam equivalents in 4h" },
          { level: "Medical Floor", detail: "Moderate AWS (CIWA 8–19) · first-time seizure evaluated · significant medical comorbidities · electrolyte derangements · unreliable social support" },
          { level: "Inpatient Detox", detail: "Mild-moderate AWS in patients unable to safely detox outpatient · prior DT history · psychiatric comorbidity · limited access to follow-up" },
          { level: "Discharge",    detail: "Mild AWS (CIWA < 8 after observation) · reliable social support · no high-risk features · able to take oral medications · able to return if worsening · prescription for chlordiazepoxide or diazepam taper · 24h follow-up arranged · naltrexone or acamprosate if AUD treatment desired" },
        ].map(({ level, detail }, i) => (
          <div key={i} style={{ display: "flex", gap: 10, paddingBottom: 7, marginBottom: 7, borderBottom: i < 3 ? `1px solid ${T.border}` : "none" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.purple, minWidth: 110, flexShrink: 0 }}>{level}</div>
            <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{detail}</div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: `radial-gradient(ellipse 70% 40% at 15% 0%, rgba(251,146,60,0.09) 0%, transparent 60%), radial-gradient(ellipse 50% 35% at 85% 95%, rgba(244,63,94,0.07) 0%, transparent 55%), ${T.bg}`, fontFamily: T.sans, color: T.white, paddingBottom: 80 }}>
      <div style={{ padding: "20px 20px 0" }}>
        <button onClick={handleBack} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", color: T.teal, fontSize: 13, fontFamily: T.sans, cursor: "pointer", padding: "4px 0", marginBottom: 16 }}>
          ← Critical Protocols
        </button>
        <div>
          <span style={pill("linear-gradient(135deg,#fb923c,#b45309)")}>☠️ Toxicologic</span>
          <span style={pill("linear-gradient(135deg,#0d9488,#065f46)")}>ASAM / Sullivan 1989</span>
        </div>
        <h1 style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 700, margin: "0 0 4px", lineHeight: 1.15 }}>Alcohol Withdrawal / DTs</h1>
        <p style={{ color: T.muted, fontSize: 12, margin: "0 0 20px" }}>Withdrawal timeline · CIWA-Ar calculator · Symptom-triggered protocol · Phenobarbital loading · Wernicke's prevention</p>
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
        {tab === 0 && T0}{tab === 1 && T1}{tab === 2 && T2}{tab === 3 && T3}
      </div>
    </div>
  );
}