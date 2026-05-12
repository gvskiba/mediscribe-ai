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
  green: "#22c55e", blue: "#3b82f6", purple: "#a78bfa", amber: "#fb923c", pink: "#f472b6",
  white: "#f0f4f8", muted: "rgba(240,244,248,0.55)", dim: "rgba(240,244,248,0.28)",
  sans: "'DM Sans', sans-serif", serif: "'Playfair Display', serif", mono: "'JetBrains Mono', monospace",
};
const G    = (x = {}) => ({ background: T.glass, backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", border: `1px solid ${T.border}`, borderRadius: 14, ...x });
const pill = (bg)     => ({ display: "inline-block", background: bg, borderRadius: 6, padding: "3px 10px", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", marginRight: 6, marginBottom: 10 });
const tag  = (c)      => ({ display: "inline-block", background: c + "22", border: `1px solid ${c}44`, borderRadius: 5, padding: "2px 8px", fontSize: 10.5, fontWeight: 600, color: c });
const card = (x = {}) => ({ ...G(), padding: "14px 16px", ...x });
const aBox = (c, mb = 10) => ({ background: c + "14", border: `1px solid ${c}40`, borderRadius: 10, padding: "10px 14px", marginBottom: mb });
const sL   = (c = T.pink) => ({ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: c, margin: "18px 0 10px", display: "flex", alignItems: "center", gap: 8 });
const dv   = { height: 1, background: T.border, margin: "10px 0" };
const inp  = { padding: "9px 12px", background: T.glassMid, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 13, fontFamily: T.mono, fontWeight: 600, outline: "none" };

export default function HELLPHub({ onBack }) {
  const [tab, setTab]   = useState(0);
  const [classType, setClassType] = useState("Mississippi");
  const [ldh, setLdh]   = useState("");
  const [ast, setAst]   = useState("");
  const [plt, setPlt]   = useState("");
  const TABS = ["Recognition", "Classification", "Treatment", "Monitoring"];

  const ldhNum = parseFloat(ldh);
  const astNum = parseFloat(ast);
  const pltNum = parseFloat(plt);

  // Mississippi Class (most common US classification)
  const missClass = (() => {
    if (!ldh || !ast || !plt) return null;
    const ldh_met = ldhNum >= 600;
    const ast_met = astNum >= 70;
    if (!ldh_met || !ast_met) return { cls: "Incomplete HELLP", color: T.gold, detail: "One or more criteria not met — partial HELLP · still carries significant risk · treat as HELLP" };
    if (pltNum < 50) return { cls: "Class I (Severe)", color: T.coral, detail: "PLT < 50k · highest risk · delivery indicated regardless of gestational age · ICU" };
    if (pltNum < 100) return { cls: "Class II (Moderate)", color: T.amber, detail: "PLT 50–100k · significant risk · delivery planning · corticosteroids + MgSO₄" };
    return { cls: "Class III (Mild)", color: T.gold, detail: "PLT 100–150k · mild thrombocytopenia · close monitoring · ≥ 34 weeks → deliver · < 34 weeks consider corticosteroids for fetal lung maturity + close monitoring" };
  })();

  // ── TAB 0: RECOGNITION ──────────────────────────────────────────────────
  const T0 = (
    <div>
      <div style={aBox(T.coral, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, marginBottom: 2 }}>HELLP — Delivery is the Only Definitive Treatment</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>HELLP = Hemolysis + Elevated Liver enzymes + Low Platelets. A severe variant of preeclampsia. Maternal mortality 1–3%. Fetal mortality 10–35%. Only cure is delivery. Stabilize, then deliver — timing depends on gestational age and severity.</div>
      </div>

      <div style={sL()}>HELLP Acronym — Diagnostic Criteria</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 14 }}>
        {[
          { letter: "H", full: "Hemolysis", criteria: "Schistocytes on smear · elevated LDH (&gt; 600) · elevated indirect bilirubin · low haptoglobin · microangiopathic", color: T.coral },
          { letter: "EL", full: "Elevated Liver", criteria: "AST ≥ 70 IU/L · ALT elevated · LDH ≥ 600 IU/L · severe cases: AST &gt; 2000 · hepatic capsule hematoma risk · epigastric/RUQ pain", color: T.amber },
          { letter: "LP", full: "Low Platelets", criteria: "PLT &lt; 100k (diagnostic threshold in most classifications) · nadir often &lt; 50k in severe HELLP · DIC develops in 20–40%", color: T.gold },
        ].map(({ letter, full, criteria, color }) => (
          <div key={letter} style={card({ padding: "12px", textAlign: "center", borderLeft: `3px solid ${color}` })}>
            <div style={{ fontFamily: T.mono, fontSize: 20, fontWeight: 800, color, marginBottom: 3 }}>{letter}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 6 }}>{full}</div>
            <div style={{ fontSize: 10.5, color: T.muted, textAlign: "left" }}>{criteria}</div>
          </div>
        ))}
      </div>

      <div style={sL(T.purple)}>Clinical Presentation</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
        <div style={card({ padding: "12px 13px", borderLeft: `3px solid ${T.amber}` })}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.amber, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 7 }}>Symptoms</div>
          {["RUQ or epigastric pain (90%) — key symptom", "Malaise / fatigue (90%)", "Nausea / vomiting (50%)", "Headache (50%)", "Visual changes (25%)", "Edema (variable)", "May be asymptomatic (labs only)"].map((s, i) => (
            <div key={i} style={{ fontSize: 11, color: T.muted, marginBottom: 3, display: "flex", gap: 5 }}><span style={{ color: T.amber }}>●</span>{s}</div>
          ))}
        </div>
        <div style={card({ padding: "12px 13px", borderLeft: `3px solid ${T.coral}` })}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.coral, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 7 }}>Danger Signs</div>
          {["PLT &lt; 50k → bleeding risk", "RUQ pain + elevated LFTs → hepatic hematoma", "Sudden severe epigastric pain → hepatic rupture", "Hypertensive emergency (SBP ≥ 160)", "Altered mentation → eclampsia", "Signs of DIC → consumptive coagulopathy", "Oliguria &lt; 30 mL/h → AKI"].map((s, i) => (
            <div key={i} style={{ fontSize: 11, color: T.muted, marginBottom: 3, display: "flex", gap: 5 }}><span style={{ color: T.coral }}>⚠</span>{s}</div>
          ))}
        </div>
      </div>

      <div style={sL(T.teal)}>Key Lab Abnormalities</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        {[
          { test: "LDH",                  threshold: "≥ 600 IU/L",    note: "Elevated from hemolysis + hepatic injury · most sensitive marker" },
          { test: "AST",                  threshold: "≥ 70 IU/L",     note: "Hepatocellular injury · AST &gt; ALT typical (unlike hepatitis) · severe: &gt; 2000 IU/L" },
          { test: "Platelet count",       threshold: "&lt; 100k (diagnostic) · &lt; 50k = class I severe", note: "Progressive decline is key · trend matters more than single value" },
          { test: "Peripheral smear",     threshold: "Schistocytes present", note: "Microangiopathic hemolytic anemia · mandatory to check" },
          { test: "Total/Indirect bilirubin", threshold: "Indirect &gt; 1.2 mg/dL", note: "Hemolysis marker · jaundice in severe cases" },
          { test: "Haptoglobin",          threshold: "Low (&lt; 25 mg/dL)", note: "Most specific hemolysis marker · drops before LDH rises" },
          { test: "Uric acid",            threshold: "Elevated",       note: "Not diagnostic but correlates with severity · &gt; 5.5 mg/dL concerning" },
          { test: "Fibrinogen / PT / aPTT", threshold: "Abnormal in DIC", note: "20–40% of HELLP develops DIC · check coagulation panel · fibrinogen &lt; 300 = significant" },
        ].map(({ test, threshold, note }, i) => (
          <div key={test} style={{ display: "flex", gap: 10, paddingBottom: 6, marginBottom: 6, borderBottom: i < 7 ? `1px solid ${T.border}` : "none" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.gold, minWidth: 160, flexShrink: 0 }}>{test}</div>
            <div>
              <div style={{ fontFamily: T.mono, fontSize: 11.5, color: T.coral, marginBottom: 1 }}>{threshold}</div>
              <div style={{ fontSize: 11, color: T.muted }}>{note}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={sL(T.gold)}>Gestational Timing</div>
      {[
        { ga: "&lt; 24 weeks", finding: "Pre-viable · extremely rare · high maternal morbidity · delivery after stabilization · intensive counseling", color: T.coral },
        { ga: "24–34 weeks", finding: "Premature fetus · consider 48h delay for corticosteroids (betamethasone) if stable · deliver if deteriorating or at 34 weeks · neonatology involvement critical", color: T.amber },
        { ga: "≥ 34 weeks", finding: "Near or at term · deliver promptly · corticosteroids not required · proceed to delivery mode discussion · vaginal if cervix favorable and no other contraindication", color: T.teal },
        { ga: "Postpartum",   finding: "15–30% of HELLP develops postpartum (within 48–72h of delivery) · more common than recognized · treat same as antepartum · may develop after apparently normal delivery", color: T.purple },
      ].map(({ ga, finding, color }) => (
        <div key={ga} style={{ ...G({ borderRadius: 9 }), padding: "9px 12px", marginBottom: 6, borderLeft: `3px solid ${color}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 2 }}>{ga}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{finding}</div>
        </div>
      ))}
    </div>
  );

  // ── TAB 1: CLASSIFICATION ───────────────────────────────────────────────
  const T1 = (
    <div>
      <div style={sL()}>Live HELLP Classifier</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          {["Mississippi", "Tennessee"].map(c => (
            <button key={c} onClick={() => setClassType(c)}
              style={{ flex: 1, padding: "8px", borderRadius: 9, border: `1.5px solid ${classType === c ? T.pink : T.border}`, background: classType === c ? "rgba(244,114,182,0.16)" : T.glass, color: classType === c ? T.pink : T.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.sans, transition: "all 0.15s" }}>
              {c} Classification
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.07em" }}>LDH (IU/L)</div>
            <input value={ldh} onChange={e => setLdh(e.target.value)} placeholder="700" type="number" style={{ ...inp, width: "100%", boxSizing: "border-box" }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.07em" }}>AST (IU/L)</div>
            <input value={ast} onChange={e => setAst(e.target.value)} placeholder="120" type="number" style={{ ...inp, width: "100%", boxSizing: "border-box" }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.07em" }}>Platelets (×10⁹/L)</div>
            <input value={plt} onChange={e => setPlt(e.target.value)} placeholder="75" type="number" style={{ ...inp, width: "100%", boxSizing: "border-box" }} />
          </div>
        </div>

        {missClass && (
          <div style={aBox(missClass.color, 0)}>
            <div style={{ fontFamily: T.mono, fontSize: 16, fontWeight: 800, color: missClass.color, marginBottom: 4 }}>{missClass.cls}</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>{missClass.detail}</div>
          </div>
        )}
      </div>

      <div style={sL()}>Mississippi Classification</div>
      {[
        { cls: "Class I (Severe)", criteria: "PLT &lt; 50k · LDH ≥ 600 · AST or ALT ≥ 70", mgmt: "Delivery regardless of gestational age · ICU admission · platelet transfusion if &lt; 20k or bleeding · expect worsening 24–48h postpartum", color: T.coral },
        { cls: "Class II (Moderate)", criteria: "PLT 50–100k · LDH ≥ 600 · AST or ALT ≥ 70", mgmt: "Delivery at ≥ 34 weeks · corticosteroids if &lt; 34 weeks and stable · close monitoring · may consider brief stabilization", color: T.amber },
        { cls: "Class III (Mild)", criteria: "PLT 100–150k · LDH ≥ 600 · AST or ALT ≥ 70", mgmt: "Delivery at ≥ 34 weeks · close monitoring · serial labs q 12h · corticosteroids if &lt; 34 weeks · may worsen rapidly — do not be reassured by mild classification", color: T.gold },
      ].map(({ cls, criteria, mgmt, color }) => (
        <div key={cls} style={{ ...card({ marginBottom: 8, borderLeft: `3px solid ${color}` }) }}>
          <div style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 5 }}>{cls}</div>
          <div style={{ fontSize: 11.5, color: T.dim, marginBottom: 6 }}>{criteria}</div>
          <div style={aBox(color, 0)}>
            <div style={{ fontSize: 11, fontWeight: 700, color, marginBottom: 2 }}>Management</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>{mgmt}</div>
          </div>
        </div>
      ))}

      <div style={sL(T.blue)}>Tennessee Classification (Martin)</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
          <div style={{ ...G({ borderRadius: 9 }), padding: "10px 12px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, marginBottom: 6 }}>Complete HELLP</div>
            {["LDH ≥ 600 IU/L", "AST ≥ 70 IU/L", "PLT &lt; 100k"].map((s, i) => <div key={i} style={{ fontSize: 11.5, color: T.muted, marginBottom: 3 }}>● {s}</div>)}
          </div>
          <div style={{ ...G({ borderRadius: 9 }), padding: "10px 12px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.gold, marginBottom: 6 }}>Partial HELLP</div>
            <div style={{ fontSize: 11.5, color: T.muted, marginBottom: 3 }}>Only 1 or 2 criteria met</div>
            <div style={{ fontSize: 11, color: T.dim }}>Still significant risk · treat accordingly · may evolve to complete HELLP</div>
          </div>
        </div>
        <div style={{ fontSize: 11.5, color: T.muted }}>Tennessee classification distinguishes complete vs partial HELLP. Mississippi adds severity grading by platelet count. Both are used clinically. Mississippi is more commonly cited in US practice.</div>
      </div>
    </div>
  );

  // ── TAB 2: TREATMENT ────────────────────────────────────────────────────
  const T2 = (
    <div>
      <div style={{ ...G({ borderRadius: 14, border: `2px solid ${T.coral}55`, background: "rgba(244,63,94,0.08)", marginBottom: 16 }), padding: "14px" }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: T.coral, marginBottom: 4 }}>Delivery is the Only Cure — Stabilize Then Deliver</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>There is no medical treatment for HELLP that eliminates the disease process. All interventions are temporizing. At ≥ 34 weeks: deliver promptly. At &lt; 34 weeks: short course of steroids for fetal lung maturity (if maternal condition allows) then deliver.</div>
      </div>

      <div style={sL()}>Simultaneous Management Protocol</div>
      {[
        { n: 1, label: "Magnesium Sulfate — Seizure Prophylaxis", color: T.purple,
          detail: "Loading dose: 4–6 g IV over 15–20 min → Maintenance: 1–2 g/h continuous infusion · Prevents eclampsia · Continue 24–48h postpartum · Monitor for toxicity: loss of DTRs (first sign) → respiratory depression → cardiac arrest · Antidote: calcium gluconate 1g IV",
          dose: "Load: 4g IV over 15 min → 1–2 g/h maintenance" },
        { n: 2, label: "Antihypertensive Therapy", color: T.coral,
          detail: "Treat SBP ≥ 160 or DBP ≥ 110 urgently (within 30–60 min) · Target SBP 140–155 / DBP 90–100 (do NOT lower too aggressively — fetal perfusion depends on maternal BP) · avoid ACE inhibitors / ARBs in pregnancy",
          dose: "Labetalol 20 mg IV q 10 min (max 300 mg) · OR Hydralazine 5–10 mg IV q 20 min · OR Nifedipine 10 mg PO q 20 min · OR Nicardipine infusion 2–10 mg/h if severe" },
        { n: 3, label: "Corticosteroids (&lt; 34 weeks)", color: T.blue,
          detail: "Betamethasone 12 mg IM × 2 doses (24h apart) for fetal lung maturity · May also transiently improve maternal platelet count (controversial) · Do NOT delay delivery for steroids if maternal condition worsening or ≥ 34 weeks",
          dose: "Betamethasone 12 mg IM q 24h × 2 doses" },
        { n: 4, label: "Blood Product Support", color: T.gold,
          detail: "Platelet transfusion: PLT &lt; 20k or &lt; 50k with active bleeding or pre-delivery · FFP + cryoprecipitate for DIC (20–40% of HELLP) · Target fibrinogen &gt; 200 mg/dL before delivery · 1:1:1 ratio if massive hemorrhage · TXA 1g IV if bleeding",
          dose: "PLT &lt; 50k pre-delivery: transfuse to &gt; 50k · PLT &lt; 20k: transfuse regardless" },
        { n: 5, label: "DELIVERY", color: T.pink,
          detail: "Vaginal delivery preferred if cervix favorable and no obstetric contraindications · Cesarean if rapid delivery needed + unfavorable cervix · Regional anesthesia: safe if PLT &gt; 70k · General anesthesia if PLT &lt; 70k or emergent · Coordinate with OB + anesthesia + NICU beforehand",
          dose: "Mode based on obstetric indication + cervical status + maternal stability" },
      ].map(({ n, label, color, detail, dose }) => (
        <div key={n} style={{ ...card({ marginBottom: 9, borderLeft: `3px solid ${color}` }), display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ width: 26, height: 26, borderRadius: "50%", background: color + "22", border: `1.5px solid ${color}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color, flexShrink: 0 }}>{n}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 4 }}>{label}</div>
            <div style={{ fontFamily: T.mono, fontSize: 11.5, color: T.white, marginBottom: 4 }}>{dose}</div>
            <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{detail}</div>
          </div>
        </div>
      ))}

      <div style={sL(T.coral)}>Life-Threatening Complications</div>
      {[
        { comp: "Hepatic Capsule Hematoma / Rupture", color: T.coral,
          detail: "Severe RUQ pain + shoulder tip pain + hypovolemic shock + rising LFTs → hepatic rupture is catastrophic · CT abdomen confirms · Emergency surgery (packing + vascular control) · Interventional radiology embolization · Maternal mortality 50–75%",
          urgent: true },
        { comp: "DIC",                                color: T.amber,
          detail: "20–40% of HELLP · abruption is common precipitant · treat aggressively: FFP + cryoprecipitate + platelets + TXA · fibrinogen &lt; 200 = significant DIC · delivery resolves underlying cause",
          urgent: true },
        { comp: "Eclampsia (Seizure)",                color: T.purple,
          detail: "MgSO₄ is prophylaxis AND treatment · For breakthrough seizure: additional 2g MgSO₄ IV bolus · if no IV: diazepam 10 mg IM · protect airway · left lateral position · fetal monitoring · deliver after stabilization · phenytoin inferior to Mg for eclampsia",
          urgent: true },
        { comp: "Acute Kidney Injury",                color: T.blue,
          detail: "From hypertension + DIC + hemorrhagic shock · monitor creatinine + urine output closely · target UO ≥ 30 mL/h · avoid nephrotoxins · nephrology involvement if AKI develops · usually reversible with delivery",
          urgent: false },
        { comp: "PRES (Posterior Reversible Encephalopathy)", color: T.teal,
          detail: "Vasogenic edema from hypertension → occipital headache + visual changes + seizures + AMS · MRI: T2/FLAIR hyperintensity in posterior white matter · BP control resolves PRES in most cases · MRI brain if neurological symptoms",
          urgent: false },
      ].map(({ comp, detail, color, urgent }) => (
        <div key={comp} style={{ ...G(), padding: "10px 13px", marginBottom: 7, borderLeft: `3px solid ${color}` }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color }}>{comp}</span>
            {urgent && <span style={{ ...tag(T.coral), fontSize: 9 }}>URGENT</span>}
          </div>
          <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{detail}</div>
        </div>
      ))}
    </div>
  );

  // ── TAB 3: MONITORING ───────────────────────────────────────────────────
  const T3 = (
    <div>
      <div style={sL()}>Monitoring Schedule</div>
      {[
        { freq: "Every 6–8h (antepartum)", items: "CBC (PLT trend critical) · LDH · AST/ALT · creatinine · urine output · BP (continuous if severe HTN) · fetal monitoring (CTG) · urine protein", color: T.coral },
        { freq: "Every 12h",               items: "Coagulation panel (PT · aPTT · fibrinogen) if PLT declining · peripheral smear for new schistocytes · LFTs · renal function", color: T.gold },
        { freq: "Every 24h postpartum",   items: "Most labs worsen 24–48h postpartum (peak severity) before improving · expect PLT nadir at 24–48h · improving LDH suggests recovery · follow until PLT rising", color: T.teal },
        { freq: "Continuous",              items: "BP monitoring (q 15 min if severe HTN) · fetal monitoring · MgSO₄ infusion · DTR assessment (q 1h) · urine output (Foley) · SpO₂ if pulmonary edema", color: T.purple },
      ].map(({ freq, items, color }) => (
        <div key={freq} style={{ ...G(), padding: "9px 12px", marginBottom: 6, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div style={{ fontFamily: T.mono, fontSize: 11.5, fontWeight: 700, color, minWidth: 160, flexShrink: 0 }}>{freq}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{items}</div>
        </div>
      ))}

      <div style={sL(T.purple)}>Magnesium Toxicity Monitoring</div>
      <div style={{ ...card({ marginBottom: 14, background: "rgba(167,139,250,0.07)", borderColor: "rgba(167,139,250,0.3)" }) }}>
        {[
          { level: "Therapeutic (seizure prophylaxis)", serum: "4–7 mEq/L", signs: "None", action: "Continue current dose" },
          { level: "Mild toxicity",                     serum: "7–10 mEq/L", signs: "Loss of DTRs · flushing · nausea", action: "Reduce dose · check serum Mg" },
          { level: "Moderate toxicity",                 serum: "10–15 mEq/L", signs: "Respiratory depression · ECG changes · prolonged PR/QRS", action: "Stop infusion · calcium gluconate 1g IV · supportive" },
          { level: "Severe toxicity / Arrest",          serum: "&gt; 15 mEq/L", signs: "Respiratory arrest · cardiac arrest", action: "STOP immediately · calcium gluconate 1–2g IV PUSH · respiratory support · ACLS if arrest" },
        ].map(({ level, serum, signs, action }, i) => (
          <div key={i} style={{ display: "flex", gap: 8, paddingBottom: 7, marginBottom: 7, borderBottom: i < 3 ? `1px solid ${T.border}` : "none" }}>
            <div style={{ flex: 2 }}>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: [T.green, T.gold, T.amber, T.coral][i], marginBottom: 1 }}>{level}</div>
              <div style={{ fontFamily: T.mono, fontSize: 11, color: T.dim }}>{serum}</div>
            </div>
            <div style={{ flex: 2, fontSize: 11, color: T.muted }}>{signs}</div>
            <div style={{ flex: 2, fontSize: 11, color: T.muted }}>{action}</div>
          </div>
        ))}
        <div style={{ fontSize: 10.5, color: T.dim, marginTop: 6 }}>Monitor DTRs hourly · clinical monitoring preferred · check serum Mg if toxicity suspected · UO ≥ 25 mL/h required for safe Mg clearance (renally cleared)</div>
      </div>

      <div style={sL(T.coral)}>Postpartum Course</div>
      {["Most HELLP worsens 24–48h postpartum before improving — reassure team and patient this is expected",
        "PLT nadir typically at 24–48h postpartum · begin improving by 72–96h",
        "LDH and LFTs peak 24–48h postpartum · should trend down within 3–5 days",
        "Continue MgSO₄ for 24–48h postpartum (eclampsia risk persists)",
        "Most HELLP patients recover fully within 1–2 weeks postpartum",
        "Recurrence risk in subsequent pregnancies: 3–25% · counsel about preeclampsia risk · aspirin from 12 weeks in next pregnancy · close MFM follow-up"].map((s, i) => (
        <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 8, marginBottom: 6, lineHeight: 1.4 }}>
          <span style={{ color: i < 5 ? T.gold : T.teal, flexShrink: 0 }}>▸</span>{s}
        </div>
      ))}

      <div style={sL(T.teal)}>Disposition</div>
      <div style={{ ...card() }}>
        {[
          { level: "OB-ICU or High-Risk L&D", detail: "All confirmed HELLP · Class I (PLT &lt; 50k) · BP ≥ 160/110 despite treatment · AKI · DIC · neurological symptoms · hepatic hematoma suspected · hemodynamic instability post-delivery" },
          { level: "MFM (Maternal-Fetal Medicine)", detail: "All HELLP cases · delivery timing decisions · corticosteroid administration · fetal monitoring · labor management · transfer to tertiary center if &lt; 34 weeks and facility cannot provide appropriate level of care" },
          { level: "NICU",                      detail: "All deliveries &lt; 34 weeks · coordinate neonatology in advance · decision about delivery mode and timing should include NICU team" },
          { level: "Follow-up (6–12 weeks)",    detail: "BP check (40% remain hypertensive postpartum) · labs to confirm resolution (PLT · LFTs · creatinine) · counseling on future pregnancy risks · aspirin prophylaxis for next pregnancy (75–150 mg from 12 weeks to 36 weeks)" },
        ].map(({ level, detail }, i) => (
          <div key={i} style={{ display: "flex", gap: 10, paddingBottom: 7, marginBottom: 7, borderBottom: i < 3 ? `1px solid ${T.border}` : "none" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.pink, minWidth: 150, flexShrink: 0 }}>{level}</div>
            <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{detail}</div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: `radial-gradient(ellipse 70% 40% at 15% 0%, rgba(244,114,182,0.09) 0%, transparent 60%), radial-gradient(ellipse 50% 35% at 85% 95%, rgba(244,63,94,0.07) 0%, transparent 55%), ${T.bg}`, fontFamily: T.sans, color: T.white, paddingBottom: 80 }}>
      <div style={{ padding: "20px 20px 0" }}>
        {onBack && (<button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", color: T.teal, fontSize: 13, fontFamily: T.sans, cursor: "pointer", padding: "4px 0", marginBottom: 16 }}>← Critical Protocols</button>)}
        <div>
          <span style={pill("linear-gradient(135deg,#f472b6,#be185d)")}>🤰 Obstetric</span>
          <span style={pill("linear-gradient(135deg,#f59e0b,#b45309)")}>ACOG / Martin 2021</span>
        </div>
        <h1 style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 700, margin: "0 0 4px", lineHeight: 1.15 }}>HELLP Syndrome</h1>
        <p style={{ color: T.muted, fontSize: 12, margin: "0 0 20px" }}>Mississippi + Tennessee classifier · Live lab calculator · MgSO₄ protocol · Antihypertensives · Delivery timing · Mg toxicity monitoring</p>
      </div>
      <div style={{ display: "flex", gap: 4, padding: "0 20px", marginBottom: 18, overflowX: "auto", scrollbarWidth: "none" }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            style={{ padding: "7px 15px", borderRadius: 9, border: `1.5px solid ${tab === i ? T.pink : T.border}`, background: tab === i ? "rgba(244,114,182,0.14)" : T.glass, color: tab === i ? T.pink : T.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.sans, whiteSpace: "nowrap", transition: "all 0.18s", backdropFilter: "blur(8px)" }}>
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