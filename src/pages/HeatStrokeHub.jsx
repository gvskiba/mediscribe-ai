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

const COOLING_METHODS = [
  {
    id: "ice_water", label: "Ice Water Immersion", color: T.blue,
    rate: "0.2–0.35°C/min — FASTEST", best: "Exertional heat stroke · young healthy patients · most evidence",
    how: "Immerse entire body in ice water (1–5°C) · continuously stir water around body · continuous temperature monitoring · 15–20 min typically sufficient",
    avoid: "Elderly · combative patients · cardiac arrhythmia risk · logistical challenges in ED",
  },
  {
    id: "evap", label: "Evaporative Cooling", color: T.teal,
    rate: "0.1–0.2°C/min", best: "Classic heat stroke · elderly · ICU patients · available in most EDs",
    how: "Strip clothing · continuous tepid water spray (15°C) over entire body · high-flow fan directed at patient · IV cool fluids simultaneously",
    avoid: "Inefficient in high-humidity environments",
  },
  {
    id: "cold_iv", label: "Cold IV Fluids", color: T.teal,
    rate: "0.03–0.06°C/min — ADJUNCT ONLY", best: "Adjunct to surface cooling · simultaneously with any primary method",
    how: "0.9% NS at 4°C · 1–2L IV bolus rapidly · combination with evaporative cooling significantly improves rate",
    avoid: "As sole cooling method — insufficient alone for heat stroke",
  },
  {
    id: "ice_packs", label: "Ice Packs to Neck/Groin/Axillae", color: T.gold,
    rate: "Modest — < 0.1°C/min alone", best: "Adjunct · always used with primary method · not primary cooling",
    how: "Ice packs to bilateral axillae · groin · neck · back of neck · change frequently",
    avoid: "As sole primary method for heat stroke",
  },
  {
    id: "intravascular", label: "Intravascular Cooling (Catheter)", color: T.purple,
    rate: "0.1–0.4°C/min (controlled)", best: "ICU · post-arrest · malignant hyperthermia · NMS · when surface methods insufficient",
    how: "Endovascular cooling catheter (Arctic Sun / CoolGard) · femoral or subclavian placement · automated temperature feedback loop · target temperature maintenance",
    avoid: "Requires expertise · invasive · typically ICU-level intervention",
  },
];

export default function HeatStrokeHub({ onBack }) {
  const navigate = useNavigate();
  const handleBack = () => onBack ? onBack() : navigate("/CriticalProtocolsPage");

  const [tab, setTab]       = useState(0);
  const [type, setType]     = useState(null);
  const [temp, setTemp]     = useState("");
  const [unit, setUnit]     = useState("C");
  const [method, setMethod] = useState(null);
  const TABS = ["Recognition", "Cooling", "Complications", "Monitoring"];

  const tempNum = parseFloat(temp);
  const tempC   = !isNaN(tempNum) && temp !== "" ? (unit === "F" ? (tempNum - 32) * 5 / 9 : tempNum) : null;
  const tempF   = tempC !== null ? (tempC * 9 / 5 + 32).toFixed(1) : null;
  const tempSev = tempC === null ? null
    : tempC >= 41   ? { label: "Severe — Immediate Cooling", color: T.coral }
    : tempC >= 40   ? { label: "Heat Stroke Range — Urgent Cooling", color: T.amber }
    : tempC >= 38.5 ? { label: "Heat Exhaustion Range — Aggressive Cooling", color: T.gold }
    : { label: "Below Threshold", color: T.green };

  // ── TAB 0: RECOGNITION ──────────────────────────────────────────────────
  const T0 = (
    <div>
      <div style={aBox(T.coral, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, marginBottom: 2 }}>Temperature &gt; 40°C (104°F) + CNS Dysfunction = Heat Stroke Until Proven Otherwise</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>Mortality 10–65% depending on peak temperature, duration of hyperthermia, and delay to cooling. Every minute of delay above 40°C causes end-organ damage. Cool first, diagnose second.</div>
      </div>

      <div style={sL()}>Temperature Converter + Severity</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
          <input value={temp} onChange={e => setTemp(e.target.value)} placeholder={`Temp (°${unit})`} type="number" step="0.1"
            style={{ flex: 1, padding: "9px 12px", background: T.glassMid, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 16, fontFamily: T.mono, fontWeight: 700, outline: "none" }} />
          <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", border: `1px solid ${T.border}` }}>
            {["C", "F"].map(u => (
              <button key={u} onClick={() => { setUnit(u); setTemp(""); }}
                style={{ padding: "9px 14px", background: unit === u ? T.amber + "30" : T.glass, color: unit === u ? T.amber : T.muted, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: T.mono, transition: "all 0.15s" }}>
                °{u}
              </button>
            ))}
          </div>
        </div>
        {tempC !== null && (
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <div style={{ ...G({ borderRadius: 9 }), padding: "9px 12px", flex: 1, textAlign: "center" }}>
                <div style={{ fontSize: 10, color: T.dim, marginBottom: 2 }}>CELSIUS</div>
                <div style={{ fontFamily: T.mono, fontSize: 18, fontWeight: 800, color: T.amber }}>{tempC.toFixed(1)}°C</div>
              </div>
              <div style={{ ...G({ borderRadius: 9 }), padding: "9px 12px", flex: 1, textAlign: "center" }}>
                <div style={{ fontSize: 10, color: T.dim, marginBottom: 2 }}>FAHRENHEIT</div>
                <div style={{ fontFamily: T.mono, fontSize: 18, fontWeight: 800, color: T.amber }}>{tempF}°F</div>
              </div>
            </div>
            {tempSev && (
              <div style={aBox(tempSev.color, 0)}>
                <div style={{ fontSize: 12, fontWeight: 700, color: tempSev.color }}>{tempSev.label}</div>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={sL()}>Classic vs Exertional Heat Stroke</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {["Classic", "Exertional"].map(t => (
          <button key={t} onClick={() => setType(type === t ? null : t)}
            style={{ flex: 1, padding: "9px", borderRadius: 10, border: `1.5px solid ${type === t ? T.amber : T.border}`, background: type === t ? "rgba(251,146,60,0.15)" : T.glass, color: type === t ? T.amber : T.muted, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: T.sans, transition: "all 0.15s" }}>
            {t === "Classic" ? "☀️ Classic" : "🏃 Exertional"}
          </button>
        ))}
      </div>

      {type === "Classic" && (
        <div style={{ ...card({ border: `1.5px solid ${T.amber}50`, marginBottom: 14 }) }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.amber, marginBottom: 8 }}>Classic Heat Stroke (CHS)</div>
          {[
            { f: "Population", v: "Elderly · infants · chronic illness · medications impairing thermoregulation" },
            { f: "Onset",      v: "Gradual over days · during heat waves · indoor exposure (no AC)" },
            { f: "Sweating",   v: "Classically DRY skin (impaired sweating) — though may be present" },
            { f: "Core Temp",  v: "> 40°C (104°F)" },
            { f: "CNS",        v: "Altered mentation · delirium · coma · seizures" },
            { f: "Risk drugs",  v: "Diuretics · anticholinergics · beta-blockers · antipsychotics · alcohol" },
          ].map(({ f, v }, i) => (
            <div key={f} style={{ display: "flex", gap: 10, paddingBottom: 6, marginBottom: 6, borderBottom: i < 5 ? `1px solid ${T.border}` : "none" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.amber, minWidth: 90, flexShrink: 0 }}>{f}</div>
              <div style={{ fontSize: 11.5, color: T.muted }}>{v}</div>
            </div>
          ))}
          <div style={aBox(T.gold, 0)}>
            <div style={{ fontSize: 11.5, color: T.muted }}>Preferred cooling: <span style={{ color: T.gold, fontWeight: 600 }}>Evaporative cooling</span> (ice water immersion poorly tolerated by elderly)</div>
          </div>
        </div>
      )}

      {type === "Exertional" && (
        <div style={{ ...card({ border: `1.5px solid ${T.coral}50`, marginBottom: 14 }) }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.coral, marginBottom: 8 }}>Exertional Heat Stroke (EHS)</div>
          {[
            { f: "Population", v: "Athletes · military personnel · manual laborers · young healthy individuals" },
            { f: "Onset",      v: "Rapid onset during intense exertion · high ambient temp + humidity" },
            { f: "Sweating",   v: "Usually WET (profuse diaphoresis) — distinguishes from classic" },
            { f: "Core Temp",  v: "> 40°C · often > 41–42°C in severe cases" },
            { f: "CNS",        v: "Ataxia → confusion → collapse → coma" },
            { f: "Complications", v: "Rhabdomyolysis · AKI · DIC · hepatic failure · much more common than classic" },
          ].map(({ f, v }, i) => (
            <div key={f} style={{ display: "flex", gap: 10, paddingBottom: 6, marginBottom: 6, borderBottom: i < 5 ? `1px solid ${T.border}` : "none" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.coral, minWidth: 100, flexShrink: 0 }}>{f}</div>
              <div style={{ fontSize: 11.5, color: T.muted }}>{v}</div>
            </div>
          ))}
          <div style={aBox(T.coral, 0)}>
            <div style={{ fontSize: 11.5, color: T.muted }}>Preferred cooling: <span style={{ color: T.coral, fontWeight: 600 }}>Ice water immersion</span> — fastest rate, best evidence for EHS</div>
          </div>
        </div>
      )}

      <div style={sL(T.purple)}>Differential Diagnosis — Hyperthermia + CNS Dysfunction</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
        {[
          { d: "Neuroleptic Malignant Syndrome", clue: "Antipsychotic use · rigidity · autonomic instability · subacute onset", color: T.purple },
          { d: "Serotonin Syndrome",  clue: "Serotonergic drugs · clonus · hyperreflexia · agitation · rapid onset", color: T.blue },
          { d: "Malignant Hyperthermia", clue: "Anesthetic exposure · succinylcholine · rigidity · masseter spasm · genetic", color: T.coral },
          { d: "Thyroid Storm",        clue: "Exophthalmos · goiter · AF · prior thyroid disease · BWPS ≥ 45", color: T.amber },
          { d: "Anticholinergic Toxidrome", clue: "Hot/dry/red/blind/mad · urinary retention · dilated pupils · tachycardia", color: T.gold },
          { d: "CNS Infection",        clue: "Meningismus · fever + headache · CSF pleocytosis · rash · immunocompromised", color: T.teal },
        ].map(({ d, clue, color }) => (
          <div key={d} style={{ ...G({ borderRadius: 9 }), padding: "10px 12px" }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color, marginBottom: 2 }}>{d}</div>
            <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.35 }}>{clue}</div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── TAB 1: COOLING ──────────────────────────────────────────────────────
  const T1 = (
    <div>
      <div style={aBox(T.coral, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, marginBottom: 2 }}>Target: Core Temp ≤ 39°C within 30 minutes</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>Each 30-min delay above 40°C significantly increases mortality and end-organ injury. Stop cooling at 39°C (102.2°F) to prevent overshoot hypothermia.</div>
      </div>

      <div style={sL()}>Cooling Method Selector</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
        {COOLING_METHODS.map(m => (
          <div key={m.id}
            style={{ ...G(), padding: "11px 14px", border: `1.5px solid ${method === m.id ? m.color + "70" : T.border}`, background: method === m.id ? m.color + "0d" : T.glass, cursor: "pointer", transition: "all 0.2s" }}
            onClick={() => setMethod(method === m.id ? null : m.id)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: m.color }}>{m.label}</span>
                <span style={{ ...tag(m.color), fontSize: 9 }}>{m.rate}</span>
              </div>
              <span style={{ fontSize: 13, color: method === m.id ? m.color : T.dim }}>{method === m.id ? "▲" : "▼"}</span>
            </div>
            {method === m.id && (
              <div style={{ marginTop: 10, paddingTop: 8, borderTop: `1px solid ${m.color}30` }}>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: T.green, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Best For</div>
                  <div style={{ fontSize: 11.5, color: T.muted }}>{m.best}</div>
                </div>
                <div style={aBox(m.color, 8)}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: m.color, marginBottom: 3 }}>How To</div>
                  <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.5 }}>{m.how}</div>
                </div>
                {m.avoid && (
                  <div style={{ fontSize: 11.5, color: T.muted }}>
                    <span style={{ color: T.coral, fontWeight: 600 }}>Cautions: </span>{m.avoid}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={sL(T.teal)}>Cooling Rate Comparison</div>
      {[
        { m: "Ice Water Immersion", rate: "0.20–0.35°C/min", rank: 1, color: T.blue },
        { m: "Intravascular Catheter", rate: "0.10–0.40°C/min (controlled)", rank: 2, color: T.purple },
        { m: "Evaporative + Fan", rate: "0.10–0.20°C/min", rank: 3, color: T.teal },
        { m: "Cold IV Fluids (adjunct)", rate: "0.03–0.06°C/min", rank: 4, color: T.gold },
        { m: "Ice Packs to groins/axillae", rate: "< 0.10°C/min (adjunct)", rank: 5, color: T.amber },
      ].map(({ m, rate, rank, color }) => (
        <div key={m} style={{ ...G({ borderRadius: 9 }), padding: "9px 12px", marginBottom: 6, display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ fontFamily: T.mono, fontSize: 14, fontWeight: 800, color, minWidth: 20 }}>{rank}</div>
          <div style={{ flex: 1, fontSize: 12, color: T.white }}>{m}</div>
          <div style={{ fontFamily: T.mono, fontSize: 11, color }}>{rate}</div>
        </div>
      ))}

      <div style={sL(T.gold)}>Do NOT Use</div>
      {[
        { drug: "Antipyretics (acetaminophen / NSAIDs)", reason: "Heat stroke is NOT a fever — hypothalamic set-point is normal. Antipyretics are INEFFECTIVE and delay proper cooling." },
        { drug: "Dantrolene",   reason: "No evidence for heat stroke · reserve for malignant hyperthermia and NMS only" },
        { drug: "Benzodiazepines for shivering alone", reason: "Shivering during cooling is counterproductive but don't sedate if patient is protecting airway — treat with surface warming once below 39°C" },
      ].map(({ drug, reason }) => (
        <div key={drug} style={{ ...G(), padding: "10px 13px", marginBottom: 7 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, marginBottom: 2 }}>✗ {drug}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{reason}</div>
        </div>
      ))}
    </div>
  );

  // ── TAB 2: COMPLICATIONS ─────────────────────────────────────────────────
  const T2 = (
    <div>
      <div style={aBox(T.amber, 14)}>
        <div style={{ fontSize: 11.5, color: T.muted }}>
          <span style={{ color: T.amber, fontWeight: 600 }}>Multi-organ failure is common — </span>
          End-organ injury severity directly correlates with peak temperature and duration. All organs susceptible to direct thermal injury and ischemia from circulatory failure.
        </div>
      </div>

      {[
        {
          organ: "CNS", icon: "🧠", color: T.purple,
          mech: "Direct thermal neuronal injury · cerebral edema · loss of blood-brain barrier integrity",
          findings: "Altered mentation (key diagnostic criterion) · cerebellar ataxia · seizures (30%) · coma · cerebral edema on CT",
          mgmt: "Cool rapidly · seizure protocol (see StatusEpilepticusHub) · avoid hyperthermia recurrence · CT head if focal deficits or persistent altered mentation · mannitol if cerebral edema signs",
        },
        {
          organ: "Rhabdomyolysis / AKI", icon: "💪", color: T.gold,
          mech: "Direct muscle cell thermal damage + ischemia → myoglobin release → tubular toxicity",
          findings: "Elevated CK (often massively elevated in EHS > 100,000) · dark urine · rising creatinine · hyperkalemia · hypocalcemia · hyperphosphatemia",
          mgmt: "Aggressive IVF (NS 1–1.5 mL/kg/h) · target UO 200–300 mL/h · see RhabdomyolysisHub · consider bicarb alkalization if CK > 15,000 · nephrology consult for AKI · dialysis if refractory hyperkalemia or anuric AKI",
        },
        {
          organ: "Hepatic Failure", icon: "🟫", color: T.amber,
          mech: "Direct hepatocyte thermal injury + splanchnic ischemia · zone 3 centrilobular necrosis",
          findings: "LFTs begin rising 12–24h post-exposure · peak at 48–72h · can be massively elevated · coagulopathy (INR elevation) · jaundice · rarely acute liver failure requiring transplant",
          mgmt: "Serial LFTs · coagulation monitoring · avoid hepatotoxins (acetaminophen if LFTs elevated, NSAIDs) · vitamin K for coagulopathy · hepatology consult if INR > 2 · rarely NAC for hepatic failure",
        },
        {
          organ: "DIC / Coagulopathy", icon: "🩸", color: T.coral,
          mech: "Thermal endothelial damage → tissue factor release → consumptive coagulopathy · hyperthermia directly impairs clotting enzyme function",
          findings: "Elevated PT/INR · elevated D-dimer · low fibrinogen · thrombocytopenia · bleeding from IV sites · petechiae",
          mgmt: "FFP for active bleeding + INR > 1.5 · Cryoprecipitate if fibrinogen < 100 · Platelets if < 50k · Treat underlying cause (cooling resolves DIC) · avoid heparin in DIC with bleeding",
        },
        {
          organ: "Cardiovascular", icon: "❤️", color: T.coral,
          mech: "High-output state → cardiac demand · direct myocardial thermal injury · arrhythmias from electrolyte derangements",
          findings: "Initial vasodilation + high CO → hemodynamic collapse · arrhythmias (AF · VT) · troponin elevation · hypotension",
          mgmt: "Fluid resuscitation (guided by volume status — avoid overload) · vasopressors (NE) for refractory hypotension · cardiac monitoring · treat arrhythmias · echo if hemodynamic compromise",
        },
        {
          organ: "Pulmonary (ARDS)", icon: "🫁", color: T.blue,
          mech: "Aspiration during LOC · ARDS from systemic inflammatory response · direct thermal airway injury",
          findings: "Hypoxia · bilateral infiltrates on CXR · ARDS criteria (P/F ratio < 200) · aspiration pneumonitis",
          mgmt: "Lung-protective ventilation (TV 6 mL/kg IBW · PEEP 5–10 · FiO₂ lowest possible) · ARDS protocol · prone positioning if P/F < 150 · treat aspiration pneumonia · avoid overhydration (worsens ARDS)",
        },
      ].map(({ organ, icon, color, mech, findings, mgmt }) => (
        <div key={organ} style={{ ...card({ marginBottom: 10, borderLeft: `3px solid ${color}` }) }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 18 }}>{icon}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color }}>{organ}</span>
          </div>
          <div style={{ marginBottom: 6 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>Mechanism</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>{mech}</div>
          </div>
          <div style={{ marginBottom: 6 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>Findings</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>{findings}</div>
          </div>
          <div style={aBox(color, 0)}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color, marginBottom: 2 }}>Management</div>
            <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{mgmt}</div>
          </div>
        </div>
      ))}
    </div>
  );

  // ── TAB 3: MONITORING ───────────────────────────────────────────────────
  const T3 = (
    <div>
      <div style={sL()}>Core Temperature Monitoring</div>
      {[
        { site: "Rectal (gold standard)", detail: "Most accurate core temp · rectal probe at 10 cm depth · mandatory for heat stroke management · continuous monitoring during cooling", color: T.coral },
        { site: "Esophageal",             detail: "Accurate in intubated patients · lower esophageal probe · real-time continuous · preferred in ICU", color: T.gold },
        { site: "Bladder (Foley temp)",   detail: "Accurate when urine flow adequate · practical for monitored patients · may lag with low UO", color: T.teal },
        { site: "Oral / Axillary / Tympanic", detail: "AVOID in heat stroke — unreliable · environmental confounding · peripheral measurements do not reflect core temperature · misleading in rapidly changing states", color: T.dim.replace("0.28", "1") },
      ].map(({ site, detail, color }) => (
        <div key={site} style={{ ...G(), padding: "9px 12px", marginBottom: 6, borderLeft: `3px solid ${color}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 2 }}>{site}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{detail}</div>
        </div>
      ))}

      <div style={sL()}>Monitoring Schedule</div>
      {[
        { freq: "Every 5 min during cooling", items: "Core temperature (rectal/esophageal) · HR · BP · SpO₂ · mental status", color: T.coral },
        { freq: "Every 30 min",               items: "Temperature trend · reassess cooling efficacy · UO · neuro checks", color: T.amber },
        { freq: "Every 1–2h",                 items: "BMP · lactate · CK (initial + q 6h) · coagulation if DIC suspected", color: T.gold },
        { freq: "Every 6h",                   items: "LFTs · CBC · ABG · full reassessment of end-organ function", color: T.teal },
        { freq: "Continuous",                 items: "Cardiac monitor · SpO₂ · arterial line BP (if hemodynamically unstable)", color: T.purple },
      ].map(({ freq, items, color }) => (
        <div key={freq} style={{ ...G(), padding: "9px 12px", marginBottom: 6, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div style={{ fontFamily: T.mono, fontSize: 11.5, fontWeight: 700, color, minWidth: 150, flexShrink: 0 }}>{freq}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{items}</div>
        </div>
      ))}

      <div style={sL(T.green)}>Cooling Endpoint — Stop at 39°C</div>
      <div style={aBox(T.green, 14)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.green, marginBottom: 4 }}>Remove patient from cooling modality at 39°C (102.2°F)</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>Temperature continues to drop 1–2°C after cessation of active cooling (thermal momentum). Stopping at 39°C prevents overshoot hypothermia (&lt; 36°C) which causes shivering, arrhythmias, and coagulopathy.</div>
      </div>

      <div style={sL(T.coral)}>Escalation Triggers</div>
      {["Temperature > 40°C for > 30 min despite active cooling → escalate to ice water immersion or intravascular cooling",
        "Seizures → benzodiazepines + AED per SE protocol + ensure airway",
        "Shock unresponsive to cooling + IVF → vasopressors (NE) · consider cardiac causes",
        "Rising CK > 15,000 → nephrology consult · aggressive IVF · bicarb consideration",
        "Coagulopathy (INR > 1.5) → check fibrinogen · DIC protocol",
        "Temperature rebound above 39°C after initial cooling → recurrence of exposure · ensure environment is cool · repeat cooling if > 40°C"].map((t, i) => (
        <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 8, marginBottom: 6, lineHeight: 1.4 }}>
          <span style={{ color: T.coral, flexShrink: 0 }}>⚠</span>{t}
        </div>
      ))}

      <div style={sL(T.purple)}>Disposition</div>
      <div style={{ ...card() }}>
        {[
          { level: "ICU",          detail: "All confirmed heat stroke · persistent altered mentation · end-organ failure (AKI · hepatic failure · DIC) · hemodynamic instability · temperature > 41°C on arrival" },
          { level: "Telemetry",    detail: "Responded well to ED cooling · temperature < 39°C maintained · mild end-organ abnormalities · reliable observation" },
          { level: "Observation",  detail: "Heat exhaustion (no CNS dysfunction) · borderline temperature · ruling out rhabdomyolysis or AKI" },
          { level: "Discharge",    detail: "ONLY heat cramps or mild heat exhaustion · temperature normalized · labs normal · reliable home environment (AC) · clear return precautions · follow-up in 24–48h · avoid exercise for 1–2 weeks" },
        ].map(({ level, detail }, i) => (
          <div key={i} style={{ display: "flex", gap: 10, paddingBottom: 7, marginBottom: 7, borderBottom: i < 3 ? `1px solid ${T.border}` : "none" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.purple, minWidth: 90, flexShrink: 0 }}>{level}</div>
            <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{detail}</div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: `radial-gradient(ellipse 70% 40% at 15% 0%, rgba(251,146,60,0.10) 0%, transparent 60%), radial-gradient(ellipse 50% 35% at 85% 95%, rgba(244,63,94,0.07) 0%, transparent 55%), ${T.bg}`, fontFamily: T.sans, color: T.white, paddingBottom: 80 }}>
      <div style={{ padding: "20px 20px 0" }}>
        <button onClick={handleBack} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", color: T.teal, fontSize: 13, fontFamily: T.sans, cursor: "pointer", padding: "4px 0", marginBottom: 16 }}>
          ← Critical Protocols
        </button>
        <div>
          <span style={pill("linear-gradient(135deg,#fb923c,#b45309)")}>🚨 Resuscitation</span>
          <span style={pill("linear-gradient(135deg,#0d9488,#065f46)")}>ACSM / EM Guidelines</span>
        </div>
        <h1 style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 700, margin: "0 0 4px", lineHeight: 1.15 }}>Heat Stroke</h1>
        <p style={{ color: T.muted, fontSize: 12, margin: "0 0 20px" }}>Classic vs Exertional · Temp converter · Cooling method selector · Rate comparison · Multi-organ complications</p>
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