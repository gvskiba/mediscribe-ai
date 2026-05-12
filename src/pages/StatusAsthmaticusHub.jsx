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
const sL   = (c = T.blue) => ({ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: c, margin: "18px 0 10px", display: "flex", alignItems: "center", gap: 8 });
const dv   = { height: 1, background: T.border, margin: "10px 0" };
const inp  = { padding: "9px 12px", background: T.glassMid, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 13, fontFamily: T.mono, fontWeight: 600, outline: "none" };

export default function StatusAsthmaticusHub({ onBack }) {
  const navigate = useNavigate();
  const handleBack = () => onBack ? onBack() : navigate("/CriticalProtocolsPage");

  const [tab, setTab]   = useState(0);
  const [sev, setSev]   = useState(null);
  const [wt, setWt]     = useState("");
  const [phase, setPhase] = useState(1);
  const TABS = ["Recognition", "Treatment", "Intubation", "Monitoring"];

  const wtNum = parseFloat(wt);
  const mgDose  = !isNaN(wtNum) && wt ? Math.min(wtNum * 25, 2000).toFixed(0) : null;
  const mgDoseKg = !isNaN(wtNum) && wt ? (wtNum * 25).toFixed(0) : null;

  const SEVERITY = [
    { label: "Mild",     color: T.green,  criteria: ["SpO₂ ≥ 95% on room air", "Speaks in full sentences", "HR &lt; 100 bpm", "RR &lt; 20/min", "PEFR ≥ 70% predicted or personal best", "No accessory muscle use"], action: "Albuterol 2.5–5 mg neb q 20 min × 3 · oral steroids · observe 1h" },
    { label: "Moderate", color: T.gold,   criteria: ["SpO₂ 90–94%", "Speaks in phrases", "HR 100–120 bpm", "RR 20–30/min", "PEFR 40–69% predicted", "Accessory muscle use"], action: "Albuterol + ipratropium q 20 min × 3 · IV/PO steroids · supplemental O₂ · consider admission" },
    { label: "Severe",   color: T.amber,  criteria: ["SpO₂ &lt; 90%", "Speaks in words only", "HR &gt; 120 bpm", "RR &gt; 30/min", "PEFR &lt; 40% predicted", "Marked accessory muscle use · paradoxical breathing"], action: "Continuous albuterol · IV Mg sulfate · IV steroids · NPPV · ICU admission · prepare for intubation" },
    { label: "Near Fatal / Life-Threatening", color: T.coral, criteria: ["Silent chest (no wheezing) — air movement absent", "Altered mentation · cyanosis", "Respiratory arrest or arrest imminent", "PaCO₂ &gt; 42 mmHg (CO₂ retention = failure)"], action: "Immediate RSI · ketamine induction · emergent ventilator management · consider epinephrine" },
  ];

  const selSev = SEVERITY.find(s => s.label === sev);

  const TREATMENT_PHASES = [
    {
      n: 1, label: "BRONCHODILATORS", color: T.blue, time: "0–20 min",
      agents: [
        { drug: "Albuterol (SABA)", dose: "2.5 mg nebulized q 20 min × 3 → continuous nebulization (10–15 mg/h) if severe", note: "Cornerstone of treatment · continuous preferred over intermittent for severe attacks · MDI + spacer equivalent to neb if cooperative patient (4–8 puffs = 2.5 mg neb)", color: T.blue },
        { drug: "Ipratropium (SAMA)", dose: "0.5 mg nebulized q 20 min × 3 (first 3h only)", note: "Add to albuterol in moderate-severe · reduces hospitalization rate · anticholinergic bronchodilation · NOT for ongoing maintenance therapy", color: T.teal },
        { drug: "Levalbuterol", dose: "1.25 mg neb q 20 min × 3 (half-dose of albuterol)", note: "R-isomer only · theoretically fewer cardiac side effects · more expensive · no clear clinical advantage over racemic albuterol in ED", color: T.blue },
      ],
    },
    {
      n: 2, label: "CORTICOSTEROIDS", color: T.gold, time: "0–30 min",
      agents: [
        { drug: "Methylprednisolone (Solu-Medrol)", dose: "125 mg IV once (severe) or 40–60 mg IV q 6h if ICU", note: "IV for severe/unable to take PO · reduces inflammation · effect begins in 4–6h · do NOT delay waiting for IV access — give PO first if faster", color: T.gold },
        { drug: "Prednisone / Prednisolone", dose: "40–60 mg PO (mild-moderate) · equally effective as IV if tolerated", note: "Bioavailability equivalent to IV in stable patients · continue for 5 days · no taper needed for short courses &lt; 2 weeks", color: T.gold },
        { drug: "Dexamethasone", dose: "12 mg PO/IV × 1–2 doses (emerging evidence)", note: "Single or 2-dose regimen improving adherence · similar efficacy to 5-day prednisone in some trials · longer half-life (24–72h) allows fewer doses", color: T.amber },
      ],
    },
    {
      n: 3, label: "MAGNESIUM SULFATE", color: T.purple, time: "30–60 min (severe/near-fatal)",
      agents: [
        { drug: "Magnesium Sulfate IV", dose: "25–50 mg/kg IV (max 2g) over 20 min", note: "Smooth muscle relaxant · bronchodilator · reduces hospital admissions in severe asthma (MAGPIE trial) · give for PEFR &lt; 40% or near-fatal features · monitor for hypotension · decrease DTRs", color: T.purple },
        { drug: "Nebulized Magnesium (isotonic)", dose: "151 mg isotonic MgSO₄ nebulized (UK studies)", note: "May augment SABA response · less systemic effect · 3Mg trial data · adjunct option · less commonly used in US ED practice", color: T.purple },
      ],
    },
    {
      n: 4, label: "HELIOX", color: T.teal, time: "Adjunct (severe)",
      agents: [
        { drug: "Heliox (Helium-Oxygen mixture)", dose: "70:30 or 80:20 helium:oxygen ratio · titrate to SpO₂ ≥ 92%", note: "Lower density than nitrogen → reduces turbulent flow → less work of breathing · use as nebulizer driving gas (enhances albuterol delivery) · most benefit when FiO₂ requirement allows high helium concentration (need SpO₂ adequate on 30% O₂)", color: T.teal },
      ],
    },
    {
      n: 5, label: "KETAMINE", color: T.coral, time: "Severe / Pre-intubation",
      agents: [
        { drug: "Ketamine", dose: "0.5–1 mg/kg IV slow (dissociative) OR 0.1–0.5 mg/kg/h infusion", note: "Bronchodilator (catecholamine release + direct effect) · preserves respiratory drive · ideal pre-intubation agent in status asthmaticus · also sedation for agitated severe asthmatic · increases secretions (give glycopyrrolate 0.2 mg IV) · dysphoric emergence reactions", color: T.coral },
      ],
    },
    {
      n: 6, label: "EPINEPHRINE", color: T.amber, time: "Severe / Anaphylaxis-triggered",
      agents: [
        { drug: "Epinephrine (IM)", dose: "0.3–0.5 mg IM (1:1,000) q 15–20 min", note: "For anaphylaxis-triggered asthma or life-threatening bronchospasm unresponsive to SABA · consider in severe near-fatal attack as bridge to intubation · alpha + beta effects", color: T.amber },
        { drug: "Epinephrine (IV infusion)", dose: "1–10 mcg/min IV infusion (titrate)", note: "Last resort for refractory status asthmaticus unresponsive to all other agents · significant cardiovascular risk · ICU only · monitor for cardiac arrhythmias · tachycardia · hypertension", color: T.coral },
      ],
    },
  ];

  // ── TAB 0: RECOGNITION ──────────────────────────────────────────────────
  const T0 = (
    <div>
      <div style={aBox(T.coral, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, marginBottom: 2 }}>Status Asthmaticus — Bronchospasm Refractory to Initial Therapy</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>Defined as acute severe asthma not responding to initial β2-agonist + steroid therapy. Mortality 0.1–0.5% but rising in adults. Key: early aggressive treatment prevents intubation. CO₂ retention = impending respiratory failure.</div>
      </div>

      <div style={sL()}>Severity Classification — tap to expand</div>
      {SEVERITY.map(s => (
        <div key={s.label}
          style={{ ...G(), padding: "12px 14px", marginBottom: 8, border: `1.5px solid ${sev === s.label ? s.color + "70" : T.border}`, background: sev === s.label ? s.color + "0d" : T.glass, cursor: "pointer", transition: "all 0.2s" }}
          onClick={() => setSev(sev === s.label ? null : s.label)}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.label}</span>
            <span style={{ fontSize: 13, color: sev === s.label ? s.color : T.dim }}>{sev === s.label ? "▲" : "▼"}</span>
          </div>
          {sev === s.label && (
            <div style={{ marginTop: 10, paddingTop: 8, borderTop: `1px solid ${s.color}30` }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
                {s.criteria.map((c, i) => <span key={i} style={{ ...tag(s.color), fontSize: 10 }}>{c}</span>)}
              </div>
              <div style={aBox(s.color, 0)}>
                <div style={{ fontSize: 11, fontWeight: 700, color: s.color, marginBottom: 2 }}>Management</div>
                <div style={{ fontSize: 11.5, color: T.muted }}>{s.action}</div>
              </div>
            </div>
          )}
        </div>
      ))}

      <div style={sL(T.coral)}>Ominous Signs — Treat as Near-Fatal</div>
      {["Silent chest — absent wheeze means no air movement (NOT improvement)",
        "Pulsus paradoxus &gt; 15 mmHg — severe air trapping",
        "PaCO₂ ≥ 42 mmHg (normocapnia or hypercapnia = CO₂ retention = respiratory failure)",
        "SpO₂ &lt; 90% despite high-flow oxygen",
        "Cyanosis · altered mentation · diaphoresis",
        "Unable to speak · one-word dyspnea"].map((s, i) => (
        <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 8, marginBottom: 5 }}>
          <span style={{ color: T.coral, flexShrink: 0 }}>⚠</span>{s}
        </div>
      ))}

      <div style={sL(T.gold)}>Triggers — Common Precipitants</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
        {[
          { t: "URTI / Viral", d: "Most common · rhinovirus · RSV · influenza", color: T.blue },
          { t: "Allergen exposure", d: "Pollen · mold · pet dander · dust mites", color: T.teal },
          { t: "Air pollutants", d: "Smoke · ozone · particulates · wildfire smoke", color: T.amber },
          { t: "NSAID / Aspirin", d: "Samter's triad · COX-1 inhibition → LT production", color: T.coral },
          { t: "Beta-blockers", d: "Non-selective (propranolol) &gt; selective · avoid in asthma", color: T.gold },
          { t: "Exercise", d: "Cold dry air · most common trigger in children · LABA pre-exercise", color: T.green },
          { t: "GERD", d: "Microaspiration · reflex bronchoconstriction · nocturnal symptoms", color: T.purple },
          { t: "Non-compliance", d: "Missed ICS/LABA · steroid phobia · financial barriers", color: "#888" },
        ].map(({ t, d, color }) => (
          <div key={t} style={{ ...G({ borderRadius: 9 }), padding: "9px 11px" }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color, marginBottom: 2 }}>{t}</div>
            <div style={{ fontSize: 11, color: T.muted }}>{d}</div>
          </div>
        ))}
      </div>

      <div style={sL(T.teal)}>Peak Flow (PEFR) Interpretation</div>
      {[
        { range: "≥ 70%", zone: "Green Zone", significance: "Mild obstruction · likely safe for discharge with outpatient follow-up", color: T.green },
        { range: "40–69%", zone: "Yellow Zone", significance: "Moderate obstruction · observe in ED · may require admission", color: T.gold },
        { range: "&lt; 40%", zone: "Red Zone", significance: "Severe obstruction · admission · IV medications · ICU consideration", color: T.coral },
      ].map(({ range, zone, significance, color }) => (
        <div key={range} style={{ ...G({ borderRadius: 9 }), padding: "9px 12px", marginBottom: 6, display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 700, color, minWidth: 55 }}>{range}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color }}>{zone}</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>{significance}</div>
          </div>
        </div>
      ))}
    </div>
  );

  // ── TAB 1: TREATMENT ────────────────────────────────────────────────────
  const T1 = (
    <div>
      <div style={aBox(T.blue, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.blue, marginBottom: 2 }}>Step-Up Protocol — Escalate Every 20 Minutes Without Improvement</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>Begin all medications simultaneously for severe attacks. Do not wait for one to work before adding next. Continuous monitoring during every treatment phase.</div>
      </div>

      <div style={sL(T.purple)}>Magnesium Sulfate Dose Calculator</div>
      <div style={{ ...card({ marginBottom: 12 }) }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
          <input value={wt} onChange={e => setWt(e.target.value)} placeholder="Weight (kg)" type="number"
            style={{ ...inp, flex: 1 }} />
          <span style={{ fontSize: 12, color: T.muted }}>kg</span>
        </div>
        {mgDose && (
          <div style={aBox(T.purple, 0)}>
            <div style={{ fontSize: 11, color: T.muted, marginBottom: 2 }}>Magnesium Sulfate 25–50 mg/kg IV over 20 min · max 2g</div>
            <div style={{ fontFamily: T.mono, fontSize: 18, fontWeight: 800, color: T.purple }}>
              {Math.min(parseFloat(mgDoseKg), 2000).toFixed(0)} mg
            </div>
            <div style={{ fontFamily: T.mono, fontSize: 13, color: T.muted, marginTop: 2 }}>
              = {(Math.min(parseFloat(mgDoseKg), 2000) / 1000).toFixed(1)} g IV over 20 min
            </div>
          </div>
        )}
      </div>

      {TREATMENT_PHASES.map(({ n, label, color, time, agents }) => {
        const open = phase === n;
        return (
          <div key={n}
            style={{ ...G(), padding: "12px 14px", marginBottom: 9, border: `1.5px solid ${open ? color + "65" : T.border}`, background: open ? color + "0d" : T.glass, cursor: "pointer", transition: "all 0.2s" }}
            onClick={() => setPhase(open ? 0 : n)}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: open ? color + "25" : T.glass, border: `2px solid ${open ? color : T.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: open ? color : T.muted, transition: "all 0.2s" }}>{n}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 800, color: open ? color : T.muted, letterSpacing: "0.05em" }}>{label}</div>
                <div style={{ ...tag(color), fontSize: 9, marginTop: 3 }}>{time}</div>
              </div>
              <div style={{ fontSize: 13, color: open ? color : T.dim }}>{open ? "▲" : "▼"}</div>
            </div>
            {open && (
              <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${color}30` }}>
                {agents.map(({ drug, dose, note, color: dc }) => (
                  <div key={drug} style={{ ...G({ borderRadius: 10, marginBottom: 8 }), padding: "11px 13px", borderLeft: `3px solid ${dc}` }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: dc, marginBottom: 4 }}>{drug}</div>
                    <div style={{ fontFamily: T.mono, fontSize: 12, color: T.white, marginBottom: 4 }}>{dose}</div>
                    <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{note}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <div style={sL(T.teal)}>NPPV — Non-Invasive Positive Pressure Ventilation</div>
      <div style={{ ...card({ marginBottom: 12 }) }}>
        <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.5, marginBottom: 8 }}>
          BiPAP for severe asthma reduces need for intubation. <span style={{ color: T.teal, fontWeight: 600 }}>Initial settings: IPAP 8–10 / EPAP 3–5 cmH₂O</span> → titrate IPAP to 12–15 as tolerated.
        </div>
        {[
          { ind: "Indications",        val: "PEFR &lt; 40% not improving after initial treatment · RR &gt; 30 · hypercapnia (PaCO₂ &gt; 42) · respiratory fatigue · hypoxia despite O₂", color: T.teal },
          { ind: "Contraindications",  val: "Vomiting · inability to cooperate · hemodynamic instability · GCS &lt; 10 · respiratory arrest · mask intolerance", color: T.coral },
          { ind: "Monitoring",         val: "Reassess clinically at 30 and 60 min · ABG/VBG at 1h · prepare for intubation if no improvement", color: T.gold },
        ].map(({ ind, val, color }) => (
          <div key={ind} style={{ display: "flex", gap: 10, paddingBottom: 6, marginBottom: 6, borderBottom: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color, minWidth: 130, flexShrink: 0 }}>{ind}</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>{val}</div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── TAB 2: INTUBATION ───────────────────────────────────────────────────
  const T2 = (
    <div>
      <div style={aBox(T.coral, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, marginBottom: 2 }}>⚠ Intubation in Status Asthmaticus is HIGH RISK — Avoid If Possible</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>Intubation carries significant morbidity in asthma: dynamic hyperinflation → auto-PEEP → hypotension → pneumothorax. Exhaust all medical options first. If intubation required: prepare for a difficult post-intubation course.</div>
      </div>

      <div style={sL()}>Indications for Intubation</div>
      {["Respiratory arrest or arrest imminent",
        "Altered mentation (GCS ≤ 13) — cannot protect airway",
        "Severe hypoxia (SpO₂ &lt; 88%) despite maximum O₂ + NPPV",
        "Extreme fatigue — patient cannot maintain respiratory effort",
        "Rising PaCO₂ &gt; 55 mmHg despite aggressive therapy",
        "Silent chest + hemodynamic instability"].map((s, i) => (
        <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 8, marginBottom: 5 }}>
          <span style={{ color: T.coral, flexShrink: 0 }}>●</span>{s}
        </div>
      ))}

      <div style={sL()}>RSI — Drug Selection</div>
      {[
        { drug: "Ketamine (PREFERRED induction)", dose: "1.5–2 mg/kg IV", note: "Bronchodilator · catecholamine release → bronchodilation · maintains respiratory drive if subtherapeutic dose used for NIV · IDEAL for asthma RSI · increases secretions (glycopyrrolate 0.2 mg IV pre-ketamine)", color: T.teal },
        { drug: "Propofol (alternative)", dose: "1–2 mg/kg IV", note: "Bronchodilatory properties · reduces airway resistance · hypotension risk at induction · reduce dose to 0.5–1 mg/kg if hemodynamically compromised", color: T.blue },
        { drug: "Rocuronium (paralytic)", dose: "1.2 mg/kg IV", note: "Preferred paralytic · avoids histamine release (succinylcholine can worsen bronchospasm in theory though rarely significant clinically) · 60-sec onset · reversible with sugammadex", color: T.gold },
        { drug: "Succinylcholine", dose: "1.5 mg/kg IV", note: "Acceptable alternative · short duration · minimal clinical difference in triggering bronchospasm vs rocuronium · useful if short duration desired for anticipated difficult intubation", color: T.amber },
      ].map(({ drug, dose, note, color }) => (
        <div key={drug} style={{ ...G(), padding: "10px 13px", marginBottom: 7, borderLeft: `3px solid ${color}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 3 }}>{drug}</div>
          <div style={{ fontFamily: T.mono, fontSize: 12, color: T.white, marginBottom: 3 }}>{dose}</div>
          <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{note}</div>
        </div>
      ))}

      <div style={sL(T.purple)}>Post-Intubation Ventilator Strategy</div>
      <div style={{ ...aBox(T.amber, 14) }}>
        <div style={{ fontSize: 11.5, color: T.muted }}>
          <span style={{ color: T.amber, fontWeight: 700 }}>Goal: "Permissive hypercapnia" strategy — </span>
          Allow CO₂ to rise slowly rather than hyperventilating. Prioritize exhalation. Prevents dynamic hyperinflation (auto-PEEP) → barotrauma → hemodynamic collapse.
        </div>
      </div>
      {[
        { setting: "Tidal Volume",    value: "6–8 mL/kg IBW",             rationale: "Lung-protective · prevents overdistension" },
        { setting: "Respiratory Rate", value: "10–14 breaths/min (LOW)",  rationale: "More time for exhalation · reduces air trapping" },
        { setting: "I:E Ratio",        value: "1:3 to 1:4 (long expiration)", rationale: "Ensures full exhalation before next breath · reduces auto-PEEP" },
        { setting: "PEEP",             value: "0–5 cmH₂O (LOW)",           rationale: "Avoid external PEEP augmenting intrinsic auto-PEEP · minimize unless plateau pressure low" },
        { setting: "FiO₂",             value: "100% → wean to SpO₂ ≥ 92%", rationale: "Titrate to effect" },
        { setting: "Plateau Pressure", value: "Target &lt; 30 cmH₂O",        rationale: "Marker of lung overdistension · reduce TV/RR if high" },
        { setting: "pH target",        value: "≥ 7.15 acceptable",         rationale: "Permissive hypercapnia — pH 7.15–7.25 tolerated to avoid barotrauma" },
      ].map(({ setting, value, rationale }) => (
        <div key={setting} style={{ ...G({ borderRadius: 9 }), padding: "9px 12px", marginBottom: 6, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 700, color: T.purple, minWidth: 130, flexShrink: 0 }}>{setting}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: T.mono, fontSize: 12, color: T.white, marginBottom: 2 }}>{value}</div>
            <div style={{ fontSize: 11, color: T.muted }}>{rationale}</div>
          </div>
        </div>
      ))}

      <div style={sL(T.coral)}>Post-Intubation Complications to Watch</div>
      {[
        { comp: "Dynamic Hyperinflation / Auto-PEEP", mgmt: "Disconnect from ventilator 60 sec → passive exhalation (dramatic improvement in BP) · reduce RR further · increase expiratory time · sedation to eliminate patient effort" },
        { comp: "Pneumothorax",                       mgmt: "High peak pressures + sudden hemodynamic collapse → needle decompression immediately → chest tube · see TensionPneumothoraxHub" },
        { comp: "Hypotension post-intubation",        mgmt: "Usually auto-PEEP or sedation-induced vasoplegia · disconnect circuit → decompress · then 500 mL NS bolus · vasopressors if refractory" },
        { comp: "Mucus plugging / Inspissated secretions", mgmt: "Humidified gas · saline lavage via ET tube · regular suction · mucolytics (NAC) · consider bronchoscopy for persistent lobar collapse" },
      ].map(({ comp, mgmt }) => (
        <div key={comp} style={{ ...G(), padding: "10px 13px", marginBottom: 7, borderLeft: `3px solid ${T.coral}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, marginBottom: 2 }}>{comp}</div>
          <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{mgmt}</div>
        </div>
      ))}
    </div>
  );

  // ── TAB 3: MONITORING ───────────────────────────────────────────────────
  const T3 = (
    <div>
      <div style={sL()}>Response Assessment</div>
      {[
        { freq: "Every 20 min (ED phase)", items: "PEFR · SpO₂ · RR · HR · accessory muscle use · ability to speak full sentences · auscultation", color: T.coral },
        { freq: "At 1h",                  items: "ABG or VBG (if severe) · PEFR trend · clinical reassessment · admission vs discharge decision", color: T.gold },
        { freq: "Every 4h (admitted)",    items: "PEFR · respiratory status · steroid response · bronchodilator interval lengthening possible · BMP if on continuous neb (hypokalemia) · Mg level if repleted", color: T.teal },
        { freq: "Continuous (severe)",    items: "SpO₂ · cardiac monitor (tachycardia from albuterol) · EtCO₂ if intubated · peak pressures (if ventilated)", color: T.purple },
      ].map(({ freq, items, color }) => (
        <div key={freq} style={{ ...G(), padding: "9px 12px", marginBottom: 6, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div style={{ fontFamily: T.mono, fontSize: 11.5, fontWeight: 700, color, minWidth: 150, flexShrink: 0 }}>{freq}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{items}</div>
        </div>
      ))}

      <div style={sL(T.green)}>Discharge Criteria</div>
      <div style={{ ...card({ background: "rgba(34,197,94,0.07)", borderColor: "rgba(34,197,94,0.25)", marginBottom: 14 }) }}>
        {["PEFR ≥ 70% predicted or personal best after treatment",
          "SpO₂ ≥ 95% on room air",
          "Minimal or no wheezing · no accessory muscle use",
          "Able to speak in full sentences",
          "Tolerating oral medications",
          "Reliable access to rescue inhaler (albuterol MDI) prescribed",
          "Short oral steroid course prescribed (prednisone 5 days or dexamethasone 2 days)",
          "Primary care or pulmonology follow-up arranged within 3–5 days",
          "Trigger identification and counseling completed"].map((c, i) => (
          <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 8, marginBottom: 5 }}>
            <span style={{ color: T.green }}>✓</span>{c}
          </div>
        ))}
      </div>

      <div style={sL(T.coral)}>Admission Criteria</div>
      {["PEFR &lt; 70% after 3h of treatment in ED",
        "Persistent hypoxia (SpO₂ &lt; 94%) on room air",
        "Prior near-fatal asthma attack (intubation history) · high-risk patient",
        "Relapse within 1 week of prior ED visit",
        "Oral steroid non-compliance · poor inhaler technique",
        "Significant comorbidities · elderly · pediatric &lt; 2 years",
        "Psychiatric illness limiting self-care",
        "Inability to access medications or follow-up"].map((s, i) => (
        <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 8, marginBottom: 5 }}>
          <span style={{ color: T.coral }}>●</span>{s}
        </div>
      ))}

      <div style={sL(T.teal)}>Albuterol Side Effects — Monitor</div>
      {[
        { se: "Hypokalemia", mgmt: "K⁺ shift into cells from β2-agonist · check K⁺ with prolonged continuous albuterol · supplement if &lt; 3.0 mEq/L", color: T.gold },
        { se: "Tachycardia", mgmt: "Expected · usually resolves with discontinuation · SVT or VT rare · rule out other causes if rate &gt; 150 or hemodynamic compromise", color: T.amber },
        { se: "Hypoxia (paradoxical)", mgmt: "V/Q mismatch worsening early in treatment (vasodilation in poorly ventilated areas) · supplement O₂ · improves with continued therapy · monitor SpO₂ continuously", color: T.coral },
        { se: "Tremor / Anxiety",    mgmt: "Expected · usually tolerated · dose-dependent · no treatment needed unless severe", color: T.teal },
      ].map(({ se, mgmt, color }) => (
        <div key={se} style={{ ...G(), padding: "9px 12px", marginBottom: 6, borderLeft: `3px solid ${color}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 2 }}>{se}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{mgmt}</div>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: `radial-gradient(ellipse 70% 40% at 15% 0%, rgba(59,130,246,0.09) 0%, transparent 60%), radial-gradient(ellipse 50% 35% at 85% 95%, rgba(244,63,94,0.07) 0%, transparent 55%), ${T.bg}`, fontFamily: T.sans, color: T.white, paddingBottom: 80 }}>
      <div style={{ padding: "20px 20px 0" }}>
        <button onClick={handleBack} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", color: T.teal, fontSize: 13, fontFamily: T.sans, cursor: "pointer", padding: "4px 0", marginBottom: 16 }}>
          ← Critical Protocols
        </button>
        <div>
          <span style={pill("linear-gradient(135deg,#3b82f6,#1e3a8a)")}>❤️ Cardiac / Pulm</span>
          <span style={pill("linear-gradient(135deg,#0d9488,#065f46)")}>NAEPP / GINA 2023</span>
        </div>
        <h1 style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 700, margin: "0 0 4px", lineHeight: 1.15 }}>Status Asthmaticus</h1>
        <p style={{ color: T.muted, fontSize: 12, margin: "0 0 20px" }}>Severity grading · 6-phase step-up protocol · Mg calculator · Ketamine RSI · Permissive hypercapnia · Discharge criteria</p>
      </div>
      <div style={{ display: "flex", gap: 4, padding: "0 20px", marginBottom: 18, overflowX: "auto", scrollbarWidth: "none" }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            style={{ padding: "7px 15px", borderRadius: 9, border: `1.5px solid ${tab === i ? T.blue : T.border}`, background: tab === i ? "rgba(59,130,246,0.14)" : T.glass, color: tab === i ? T.blue : T.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.sans, whiteSpace: "nowrap", transition: "all 0.18s", backdropFilter: "blur(8px)" }}>
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