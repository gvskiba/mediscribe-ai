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
const G = (x = {}) => ({ background: T.glass, backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", border: `1px solid ${T.border}`, borderRadius: 14, ...x });

// ── Helpers ───────────────────────────────────────────────────────────────────
const pill  = (bg) => ({ display: "inline-block", background: bg, borderRadius: 6, padding: "3px 10px", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", marginRight: 6, marginBottom: 10 });
const tag   = (c)  => ({ display: "inline-block", background: c + "22", border: `1px solid ${c}44`, borderRadius: 5, padding: "2px 8px", fontSize: 10.5, fontWeight: 600, color: c });
const card  = (x = {}) => ({ ...G(), padding: "14px 16px", ...x });
const aBox  = (c, mb = 10) => ({ background: c + "14", border: `1px solid ${c}40`, borderRadius: 10, padding: "10px 14px", marginBottom: mb });
const sL    = (c = T.teal) => ({ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: c, margin: "18px 0 10px", display: "flex", alignItems: "center", gap: 8 });
const dv    = { height: 1, background: T.border, margin: "10px 0" };
const nb    = (c = T.coral) => ({ width: 26, height: 26, borderRadius: "50%", background: c + "22", border: `1.5px solid ${c}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: c, flexShrink: 0 });
const row   = (x = {}) => ({ display: "flex", alignItems: "flex-start", gap: 12, ...x });

// ── Data ─────────────────────────────────────────────────────────────────────
const SEVERITY = [
  { level: "Mild", color: T.gold, bg: "rgba(245,158,11,0.10)",
    features: ["Urticaria / flushing / pruritus", "Angioedema (no airway involvement)", "Rhinorrhea / conjunctivitis"],
    action: "Epinephrine IM · Antihistamines · Observe ≥ 2h" },
  { level: "Moderate", color: T.amber, bg: "rgba(251,146,60,0.10)",
    features: ["Skin + GI symptoms (nausea, vomiting, cramps)", "Mild bronchospasm / wheeze", "Mild hypotension (responsive to fluids)"],
    action: "Epinephrine IM · O₂ · IV access + fluids · Observe ≥ 4h" },
  { level: "Severe", color: T.coral, bg: "rgba(244,63,94,0.10)",
    features: ["Severe bronchospasm / stridor / laryngeal edema", "Cardiovascular collapse / shock", "Altered mentation / loss of consciousness"],
    action: "Epinephrine IM/IV · Airway management · Aggressive resuscitation · Admit" },
];

const SECOND_LINE = [
  { drug: "Diphenhydramine", dose: "25–50 mg IV/IM", role: "H1 blocker — pruritus / urticaria adjunct", color: T.blue },
  { drug: "Famotidine", dose: "20 mg IV", role: "H2 blocker — adjunct (limited evidence)", color: T.blue },
  { drug: "Methylprednisolone", dose: "125 mg IV", role: "Prevent biphasic reaction · NOT acute treatment", color: T.purple },
  { drug: "Albuterol", dose: "2.5–5 mg nebulized", role: "Bronchospasm adjunct — never replace epinephrine", color: T.teal },
  { drug: "Glucagon", dose: "1–5 mg IV over 5 min", role: "Beta-blocker–refractory hypotension · repeat q 5 min", color: T.gold },
  { drug: "Norepinephrine", dose: "0.1–1 mcg/kg/min", role: "Vasopressor for refractory anaphylactic shock", color: T.coral },
];

const RISK_FACTORS = [
  "Severe initial reaction requiring multiple epinephrine doses",
  "Delayed epinephrine administration (> 30 min from onset)",
  "Large allergen exposure (ingested > injected > contact)",
  "Unknown trigger (cannot avoid re-exposure)",
  "Asthma or significant respiratory comorbidity",
  "Prior biphasic or severe anaphylaxis history",
];

// ── Main Component ───────────────────────────────────────────────────────────
export default function AnaphylaxisHub({ onBack }) {
  const [tab, setTab] = useState(0);
  const [severity, setSeverity] = useState(null);
  const [weight, setWeight] = useState("");
  const TABS = ["Recognition", "Treatment", "Monitoring", "Disposition"];

  const epiDose = weight && !isNaN(weight) ? Math.min(parseFloat(weight) * 0.01, 0.5).toFixed(2) : null;

  // ── TAB 0: RECOGNITION ────────────────────────────────────────────────────
  const Tab0 = (
    <div>
      <div style={aBox(T.coral, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, marginBottom: 2 }}>Sampson Criteria 2006</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>Anaphylaxis is likely when ANY ONE of the following three criteria is met after exposure to a known or possible allergen</div>
      </div>

      {[
        { n: 1, c: T.coral, title: "Criterion 1 — Skin + Systemic", body: "Acute skin/mucosal involvement (hives, pruritus, flushing, lip/tongue/uvula swelling) AND at least one of: respiratory compromise, reduced BP, or end-organ symptoms" },
        { n: 2, c: T.gold, title: "Criterion 2 — Two or More Systems", body: "Two or more of the following rapidly after allergen exposure: skin/mucosal involvement · respiratory compromise · reduced BP · persistent GI symptoms" },
        { n: 3, c: T.green, title: "Criterion 3 — Known Allergen + Hypotension", body: "Reduced blood pressure after exposure to a previously known allergen for that patient (even without skin findings)" },
      ].map(({ n, c, title, body }) => (
        <div key={n} style={{ ...card({ marginBottom: 10, borderLeft: `3px solid ${c}` }) }}>
          <div style={{ ...row(), marginBottom: 6 }}>
            <div style={nb(c)}>{n}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: c }}>{title}</div>
          </div>
          <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.55, paddingLeft: 38 }}>{body}</div>
        </div>
      ))}

      <div style={sL()}>Severity Assessment — select presentation</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {SEVERITY.map(s => (
          <div key={s.level}
            style={{ ...G(), padding: "13px 15px", border: `1.5px solid ${severity === s.level ? s.color + "70" : T.border}`, background: severity === s.level ? s.bg : T.glass, cursor: "pointer", transition: "all 0.18s" }}
            onClick={() => setSeverity(severity === s.level ? null : s.level)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: severity === s.level ? 10 : 0 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.level}</span>
              <div style={{ ...tag(s.color) }}>{severity === s.level ? "▲ selected" : "tap to select"}</div>
            </div>
            {severity === s.level && (
              <div>
                {s.features.map((f, i) => (
                  <div key={i} style={{ fontSize: 11.5, color: T.muted, display: "flex", gap: 7, marginBottom: 4 }}>
                    <span style={{ color: s.color }}>●</span>{f}
                  </div>
                ))}
                <div style={dv} />
                <div style={{ fontSize: 11.5, color: s.color, fontWeight: 600 }}>→ {s.action}</div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={sL(T.gold)}>Common Triggers</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {[
          { cat: "Foods", items: "Peanuts · tree nuts · shellfish · fish · milk · eggs · wheat" },
          { cat: "Medications", items: "β-lactams · NSAIDs · ACE inhibitors · radiocontrast · biologics" },
          { cat: "Venom", items: "Hymenoptera (bees · wasps · hornets · fire ants)" },
          { cat: "Latex", items: "Surgical/exam gloves · balloons · catheter equipment" },
          { cat: "Idiopathic", items: "No trigger identified in up to 30% of cases" },
          { cat: "Exercise", items: "Exercise-induced — often food-dependent (EIAnA)" },
        ].map(({ cat, items }) => (
          <div key={cat} style={card({ padding: "10px 13px" })}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.gold, marginBottom: 4 }}>{cat}</div>
            <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.45 }}>{items}</div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── TAB 1: TREATMENT ──────────────────────────────────────────────────────
  const Tab1 = (
    <div>
      <div style={aBox(T.coral, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, marginBottom: 2 }}>⚡ Epinephrine First — Always</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>No absolute contraindication to epinephrine in anaphylaxis. Antihistamines alone are NOT adequate treatment.</div>
      </div>

      <div style={sL(T.coral)}>Step 1 — Epinephrine (First Line)</div>

      <div style={{ ...card({ marginBottom: 12, border: `1.5px solid ${T.coral}40` }) }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, marginBottom: 10 }}>Weight-Based IM Dose Calculator</div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
          <input
            value={weight}
            onChange={e => setWeight(e.target.value)}
            placeholder="Weight (kg)"
            type="number"
            style={{ flex: 1, padding: "9px 12px", background: T.glassMid, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 13, fontFamily: T.mono, outline: "none" }}
          />
          <span style={{ fontSize: 12, color: T.muted }}>kg</span>
        </div>
        {epiDose ? (
          <div style={aBox(T.coral, 0)}>
            <div style={{ fontSize: 11, color: T.muted, marginBottom: 3 }}>Epinephrine 1:1,000 (1 mg/mL) IM</div>
            <div style={{ fontFamily: T.mono, fontSize: 20, color: T.coral, fontWeight: 700 }}>{epiDose} mg</div>
            <div style={{ fontFamily: T.mono, fontSize: 13, color: T.muted, marginTop: 2 }}>{epiDose} mL · anterolateral thigh · repeat q 5–15 min</div>
          </div>
        ) : (
          <div style={{ fontSize: 11.5, color: T.dim }}>
            Standard adult dose: <span style={{ fontFamily: T.mono, color: T.coral }}>0.3–0.5 mg IM</span> (0.3–0.5 mL of 1:1,000) anterolateral thigh
          </div>
        )}
      </div>

      <div style={{ ...card({ marginBottom: 14, background: "rgba(244,63,94,0.07)", borderColor: "rgba(244,63,94,0.3)" }) }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, marginBottom: 8 }}>IV Epinephrine — Refractory Shock / Arrest</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            { label: "Cardiac Arrest", dose: "1 mg IV push (1:10,000) q 3–5 min" },
            { label: "Refractory Shock", dose: "0.1–0.2 mg IV slow push (1:10,000)" },
            { label: "Infusion", dose: "0.1–1 mcg/kg/min — titrate to MAP ≥ 65" },
          ].map(({ label, dose }) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", paddingBottom: 5, borderBottom: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 11.5, color: T.muted }}>{label}</span>
              <span style={{ fontFamily: T.mono, fontSize: 11.5, color: T.coral }}>{dose}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={sL(T.teal)}>Step 2 — Simultaneous Supportive Measures</div>
      {[
        { step: "Position", detail: "Supine + legs elevated · Sitting upright if respiratory compromise · Trendelenburg if cardiac arrest" },
        { step: "Oxygen", detail: "High-flow O₂ via NRB mask · Prepare for intubation if stridor or severe angioedema" },
        { step: "IV Access", detail: "Two large-bore IVs · 1–2L NS bolus if hypotensive · titrate to BP response" },
        { step: "Monitor", detail: "Continuous cardiac monitor · pulse ox · BP q 5 min" },
      ].map(({ step, detail }, i) => (
        <div key={i} style={{ ...card({ marginBottom: 8 }), ...row() }}>
          <div style={nb(T.teal)}>{i + 1}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{step}</div>
            <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.5 }}>{detail}</div>
          </div>
        </div>
      ))}

      <div style={sL(T.blue)}>Step 3 — Adjunct Medications</div>
      <div style={{ fontSize: 11, color: T.muted, marginBottom: 10 }}>These do NOT replace epinephrine. Give after epinephrine is administered.</div>
      {SECOND_LINE.map(({ drug, dose, role, color }) => (
        <div key={drug} style={{ ...G(), padding: "11px 14px", marginBottom: 8, borderLeft: `3px solid ${color}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color }}>{drug}</span>
            <span style={{ fontFamily: T.mono, fontSize: 11.5, color }}>{dose}</span>
          </div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{role}</div>
        </div>
      ))}
    </div>
  );

  // ── TAB 2: MONITORING ─────────────────────────────────────────────────────
  const Tab2 = (
    <div>
      <div style={sL(T.gold)}>Biphasic Anaphylaxis</div>
      <div style={aBox(T.gold, 14)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.gold, marginBottom: 3 }}>Recurrence after apparent resolution</div>
        <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.55 }}>
          Occurs in <span style={{ color: T.gold, fontWeight: 600 }}>5–20%</span> of cases · Peak onset <span style={{ color: T.gold, fontWeight: 600 }}>8–10 hours</span> after initial reaction · Range 1–72h
        </div>
      </div>

      <div style={sL(T.coral)}>Biphasic Risk Factors</div>
      {RISK_FACTORS.map((r, i) => (
        <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 8, marginBottom: 7, lineHeight: 1.4 }}>
          <span style={{ color: T.coral, flexShrink: 0 }}>●</span>{r}
        </div>
      ))}

      <div style={sL(T.teal)}>Minimum Observation Duration</div>
      {[
        { risk: "Low risk (mild, single epi dose, rapid complete response, known trigger)", duration: "2–4 hours", color: T.green },
        { risk: "Moderate risk (moderate severity, 2 epi doses, slow response, unknown trigger)", duration: "4–6 hours", color: T.gold },
        { risk: "High risk (severe, refractory, biphasic hx, asthma, remote area)", duration: "≥ 12–24 hours · consider admit", color: T.coral },
      ].map(({ risk, duration, color }) => (
        <div key={risk} style={{ ...card({ marginBottom: 8, borderLeft: `3px solid ${color}` }) }}>
          <div style={{ fontFamily: T.mono, fontSize: 14, fontWeight: 700, color, marginBottom: 4 }}>{duration}</div>
          <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{risk}</div>
        </div>
      ))}

      <div style={sL(T.green)}>Response Targets</div>
      {[
        "Resolution of urticaria / angioedema",
        "SpO₂ ≥ 95% on room air",
        "MAP ≥ 65 mmHg without vasopressors",
        "No stridor · normal voice quality",
        "Alert and oriented · no altered mentation",
      ].map((t, i) => (
        <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 8, marginBottom: 6 }}>
          <span style={{ color: T.green }}>✓</span>{t}
        </div>
      ))}

      <div style={sL(T.coral)}>Failure to Respond — Consider</div>
      {[
        "Beta-blocker use → glucagon 1–5 mg IV",
        "ACE inhibitor–induced angioedema (bradykinin-mediated — epi often ineffective; icatibant or C1 esterase inhibitor)",
        "Scombroid or other histamine-mediated reaction",
        "Cardiac event (myocardial infarction, arrhythmia) mimicking or complicating anaphylaxis",
        "Vasovagal syncope (bradycardia, not tachycardia; no urticaria)",
      ].map((t, i) => (
        <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 8, marginBottom: 7, lineHeight: 1.4 }}>
          <span style={{ color: T.coral, flexShrink: 0 }}>⚠</span>{t}
        </div>
      ))}
    </div>
  );

  // ── TAB 3: DISPOSITION ────────────────────────────────────────────────────
  const Tab3 = (
    <div>
      <div style={{ display: "grid", gap: 10, marginBottom: 18 }}>
        <div style={{ ...card({ background: "rgba(34,197,94,0.07)", borderColor: "rgba(34,197,94,0.25)" }) }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.green, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>✓ Discharge Criteria (ALL must be met)</div>
          {[
            "Symptom-free for minimum observation period",
            "Hemodynamically stable without vasopressors",
            "No respiratory symptoms or oxygen requirement",
            "Epinephrine auto-injector prescribed and patient educated",
            "Patient understands biphasic risk and return precautions",
            "Follow-up with allergist arranged",
          ].map((t, i) => (
            <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 8, marginBottom: 5 }}><span style={{ color: T.green }}>✓</span>{t}</div>
          ))}
        </div>

        <div style={{ ...card({ background: "rgba(244,63,94,0.07)", borderColor: "rgba(244,63,94,0.25)" }) }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.coral, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>⚠ Admit Criteria</div>
          {[
            "Severe initial reaction (intubation, ICU-level care)",
            "Refractory to epinephrine or requiring vasopressor infusion",
            "Protracted course or slow response",
            "Significant comorbidities (asthma, cardiac disease)",
            "No access to epinephrine auto-injector at home",
            "Lives alone or remotely from emergency care",
          ].map((t, i) => (
            <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 8, marginBottom: 5 }}><span style={{ color: T.coral }}>●</span>{t}</div>
          ))}
        </div>
      </div>

      <div style={sL(T.teal)}>Discharge Prescriptions</div>
      {[
        { drug: "Epinephrine auto-injector", detail: "EpiPen 0.3 mg · Prescribe TWO devices · Demonstrate technique · Rx in chart" },
        { drug: "Diphenhydramine", detail: "25–50 mg PO q 6h × 3 days for residual urticaria" },
        { drug: "Prednisone", detail: "40–60 mg PO daily × 3–5 days (biphasic prevention — limited evidence)" },
        { drug: "Famotidine (optional)", detail: "20 mg PO BID × 3 days" },
      ].map(({ drug, detail }) => (
        <div key={drug} style={{ ...G(), padding: "11px 14px", marginBottom: 8, borderLeft: `3px solid ${T.teal}` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.teal, marginBottom: 3 }}>{drug}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{detail}</div>
        </div>
      ))}

      <div style={sL(T.gold)}>Discharge Instructions</div>
      <div style={{ ...card() }}>
        {[
          "Return immediately if symptoms recur (rash, throat swelling, difficulty breathing, dizziness)",
          "Carry epinephrine at ALL times — use at first sign of severe allergic reaction",
          "Avoid known and suspected triggers",
          "Wear medical alert bracelet if severe allergy",
          "Follow-up with allergist within 1–4 weeks for skin testing and allergen identification",
          "Consider venom immunotherapy if insect sting trigger identified",
        ].map((t, i) => (
          <div key={i} style={{ fontSize: 11.5, color: T.muted, paddingLeft: 10, borderLeft: `2px solid ${T.border}`, lineHeight: 1.5, marginBottom: i < 5 ? 7 : 0 }}>{t}</div>
        ))}
      </div>
    </div>
  );

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: `radial-gradient(ellipse 70% 40% at 15% 0%, rgba(244,63,94,0.09) 0%, transparent 60%), radial-gradient(ellipse 50% 35% at 85% 95%, rgba(20,184,166,0.07) 0%, transparent 55%), ${T.bg}`, fontFamily: T.sans, color: T.white, paddingBottom: 80 }}>

      <div style={{ padding: "20px 20px 0" }}>
        {onBack && (
          <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", color: T.teal, fontSize: 13, fontFamily: T.sans, cursor: "pointer", padding: "4px 0", marginBottom: 16 }}>
            ← Critical Protocols
          </button>
        )}
        <div>
          <span style={pill("linear-gradient(135deg,#f43f5e,#be185d)")}>🔴 Resuscitation</span>
          <span style={pill("linear-gradient(135deg,#0d9488,#065f46)")}>Sampson 2006</span>
        </div>
        <h1 style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 700, margin: "0 0 4px", lineHeight: 1.15 }}>Anaphylaxis</h1>
        <p style={{ color: T.muted, fontSize: 12, margin: "0 0 20px" }}>Recognition · Epinephrine dosing · Biphasic risk · Disposition</p>
      </div>

      <div style={{ display: "flex", gap: 4, padding: "0 20px", marginBottom: 18, overflowX: "auto", scrollbarWidth: "none" }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            style={{ padding: "7px 15px", borderRadius: 9, border: `1.5px solid ${tab === i ? T.coral : T.border}`, background: tab === i ? "rgba(244,63,94,0.14)" : T.glass, color: tab === i ? T.coral : T.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.sans, whiteSpace: "nowrap", transition: "all 0.18s", backdropFilter: "blur(8px)" }}>
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