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
const sL   = (c = T.blue) => ({ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: c, margin: "18px 0 10px", display: "flex", alignItems: "center", gap: 8 });
const dv   = { height: 1, background: T.border, margin: "10px 0" };
const chip = (c, a) => ({ padding: "7px 14px", borderRadius: 9, border: `1.5px solid ${a ? c : T.border}`, background: a ? c + "22" : T.glass, color: a ? c : T.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.sans, transition: "all 0.15s", backdropFilter: "blur(8px)" });

// ── Data ─────────────────────────────────────────────────────────────────────
const MNEMONICS = [
  {
    name: "LEMON", title: "Difficult Laryngoscopy", color: T.coral,
    items: [
      { l: "L", w: "Look Externally",       d: "Obesity · short neck · facial trauma · burns · angioedema · micrognathia · large tongue" },
      { l: "E", w: "Evaluate 3-3-2",        d: "Mouth opening < 3 fingers · hyoid-chin < 3 fingers · thyroid notch-floor of mouth < 2 fingers" },
      { l: "M", w: "Mallampati",            d: "Class III–IV (uvula not visible) predicts difficult laryngoscopy" },
      { l: "O", w: "Obstruction",           d: "Epiglottitis · peritonsillar abscess · Ludwig's angina · angioedema · foreign body · tumor" },
      { l: "N", w: "Neck Mobility",         d: "C-spine injury · ankylosing spondylitis · severe arthritis · halo/collar in place" },
    ],
  },
  {
    name: "MOANS", title: "Difficult BVM Ventilation", color: T.gold,
    items: [
      { l: "M", w: "Mask Seal",             d: "Beard · facial trauma · anatomic distortion" },
      { l: "O", w: "Obesity / Obstruction", d: "BMI > 26 increases difficulty · upper airway obstruction" },
      { l: "A", w: "Age > 55",              d: "Reduced muscle tone · increased compliance" },
      { l: "N", w: "No Teeth",              d: "Edentulous patients — poor mask seal" },
      { l: "S", w: "Stiff Lungs",           d: "Severe COPD · asthma · pulmonary fibrosis · ARDS · pregnancy" },
    ],
  },
  {
    name: "RODS", title: "Difficult SGA / LMA", color: T.purple,
    items: [
      { l: "R", w: "Restricted Mouth",      d: "Opening < 2.5 cm · trismus · temporomandibular joint disease" },
      { l: "O", w: "Obstruction",           d: "Laryngeal or subglottic pathology — LMA will not bypass" },
      { l: "D", w: "Distorted Airway",      d: "Radiation fibrosis · hematoma · abscess · tumor distortion" },
      { l: "S", w: "Stiff Lungs",           d: "High airway pressures exceed LMA seal pressure → aspiration risk" },
    ],
  },
  {
    name: "SMART", title: "Difficult Surgical Airway", color: T.amber,
    items: [
      { l: "S", w: "Surgery / Scar",        d: "Prior neck surgery · tracheostomy · radiation fibrosis" },
      { l: "M", w: "Mass",                  d: "Goiter · hematoma · tumor distorting cricothyroid membrane" },
      { l: "A", w: "Access / Anatomy",      d: "Obesity · short neck · inability to extend neck · subcutaneous emphysema" },
      { l: "R", w: "Radiation",             d: "Tissue induration · fibrosis · poor wound healing post-procedure" },
      { l: "T", w: "Tumor",                 d: "Laryngeal or tracheal tumor — distorted landmarks" },
    ],
  },
];

const RSI_STEPS = [
  { n: 1, p: "PREPARATION",           color: T.teal,   icon: "📋", time: "T − 10 min",
    items: ["Video laryngoscope + direct laryngoscope (backup)", "Suction (Yankauer) — running and in hand", "ET tube: 7.5 male / 7.0 female · syringe · stylet · tape", "BVM + O₂ source connected", "Monitoring: SpO₂, EtCO₂, cardiac, BP", "IV access confirmed · drugs drawn up and labeled", "Team roles assigned · surgeon notified if surgical airway risk"] },
  { n: 2, p: "PRE-OXYGENATION",       color: T.blue,   icon: "🫁", time: "T − 3 min",
    items: ["NRB mask at 15 L/min × 3 min (denitrogenation)", "Position: 20° head-up / ramped if obese (ear-to-sternal notch line)", "HFNC 40–60 L/min during laryngoscopy (apneic oxygenation)", "BVM if SpO₂ < 93% despite NRB — do not delay for SpO₂ < 90%", "Target SpO₂ ≥ 95% before induction"] },
  { n: 3, p: "PRE-TREATMENT",         color: T.purple, icon: "💉", time: "T − 3 min",
    items: ["Lidocaine 1.5 mg/kg IV — reactive airways or elevated ICP (limited evidence)", "Fentanyl 3 mcg/kg IV — blunt sympathetic response (hypertensive emergency · aortic dissection · elevated ICP)", "Atropine 0.02 mg/kg IV — bradycardia prophylaxis in peds < 1 year", "These are adjuncts — do not delay induction"] },
  { n: 4, p: "PARALYSIS + INDUCTION", color: T.coral,  icon: "⚡", time: "T − 0",
    items: ["Give induction agent THEN paralytic in rapid succession", "Do NOT ventilate after induction (risk of gastric insufflation)", "Apply cricoid pressure (Sellick) if full stomach — controversial, abandon if impeding view", "Wait for fasciculations to stop (succinylcholine) or 60 sec (rocuronium)"] },
  { n: 5, p: "POSITIONING",           color: T.gold,   icon: "🛏", time: "T + 0",
    items: ["Sniffing position: neck flexed, head extended (align oral-pharyngeal-laryngeal axes)", "Ramped position for obese: elevate shoulders/torso until ear-sternal notch horizontal", "BURP maneuver PRN: Backward-Upward-Rightward Pressure on larynx", "Bimanual laryngoscopy: assistant applies external laryngeal manipulation per direct feedback"] },
  { n: 6, p: "PLACEMENT",             color: T.amber,  icon: "🔦", time: "T + 45 sec",
    items: ["Insert blade · lift to expose cords — do NOT lever on teeth", "Insert tube through cords under direct vision · depth 21–23 cm at lip", "Inflate cuff · remove stylet", "Confirm: waveform capnography (gold standard) · bilateral breath sounds · CXR"] },
  { n: 7, p: "POST-INTUBATION",       color: T.green,  icon: "✓",  time: "T + 2 min",
    items: ["Vent settings: TV 6–8 mL/kg IBW · RR 12–16 · PEEP 5 · FiO₂ 100% then wean", "Sedation: propofol 5–50 mcg/kg/min or midazolam 0.02–0.1 mg/kg/h", "Analgesia: fentanyl 25–200 mcg/h infusion", "NG/OG tube · HOB 30–45° · repeat SpO₂ and EtCO₂", "CXR to confirm tube position (2–4 cm above carina)"] },
];

const INDUCTION = [
  { drug: "Ketamine",  dose: "1.5–2 mg/kg IV",  onset: "45 sec", color: T.coral,
    pros: ["Hemodynamically neutral/stimulating — preferred in shock", "Bronchodilator — preferred in asthma/bronchospasm", "Maintains airway tone", "Analgesic properties"],
    cons: ["Increases secretions (consider glycopyrrolate)", "Emergence reactions (less relevant in RSI)", "Relative caution in severe hypertension / aortic dissection"],
    preferred: "Hypotension · Shock · Asthma · Bronchospasm" },
  { drug: "Etomidate", dose: "0.3 mg/kg IV",     onset: "45 sec", color: T.gold,
    pros: ["Hemodynamically neutral", "Reduces ICP / cerebral metabolic demand", "No significant histamine release"],
    cons: ["Single-dose adrenal suppression (avoid in septic shock — controversial)", "No analgesia", "Myoclonus (not a seizure)"],
    preferred: "Cardiovascular instability · Elevated ICP (not sepsis)" },
  { drug: "Propofol",  dose: "1.5–2 mg/kg IV",   onset: "30 sec", color: T.blue,
    pros: ["Smooth rapid induction", "Anticonvulsant properties", "Reduces ICP and metabolic demand"],
    cons: ["Significant hypotension (reduce to 0.5–1 mg/kg if any hemodynamic compromise)", "No analgesia", "Contraindicated in egg/soy allergy (rare)"],
    preferred: "Elevated ICP · Status epilepticus · Hemodynamically stable" },
  { drug: "Midazolam", dose: "0.1–0.3 mg/kg IV", onset: "90 sec", color: T.purple,
    pros: ["Widely available", "Amnestic", "Anticonvulsant"],
    cons: ["Slow onset — not ideal for RSI", "Significant hypotension", "Unpredictable depth of sedation"],
    preferred: "Use only when other agents unavailable" },
];

const PARALYTICS = [
  { drug: "Succinylcholine", dose: "1.5 mg/kg IV", obese: "2 mg/kg", onset: "45 sec", duration: "8–12 min", color: T.coral,
    type: "Depolarizing",
    ci: ["Hyperkalemia or risk (burns > 24h · crush > 3d · SCI > 72h · prolonged immobility · rhabdomyolysis)", "Personal or family history of malignant hyperthermia", "Myopathies / muscular dystrophy", "Plasma cholinesterase deficiency"],
    notes: "Raises K⁺ transiently by 0.5–1 mEq/L (safe if baseline K⁺ < 5.5 and no CI). Preferred when short duration desired or difficult airway anticipated." },
  { drug: "Rocuronium", dose: "1.2 mg/kg IV", obese: "1.2 mg/kg TBW", onset: "60 sec", duration: "45–70 min", color: T.teal,
    type: "Non-Depolarizing",
    ci: ["Known rocuronium/vecuronium allergy"],
    notes: "Fully reversible with sugammadex 16 mg/kg IV (rapid reversal in < 3 min). Use when succinylcholine is contraindicated or high-dose RSI. Safe in hyperkalemia." },
];

import { useNavigate } from "react-router-dom";
import NotryaHubHeader from "@/components/HubHeader/NotryaHubHeader";

// ── Main Component ───────────────────────────────────────────────────────────
export default function AirwayRSIHub({ onBack }) {
  const navigate = useNavigate();
  const handleBack = () => onBack ? onBack() : navigate("/CriticalProtocolsPage");
  const [tab, setTab]           = useState(0);
  const [mnemonic, setMnemonic] = useState("LEMON");
  const [rsiStep, setRsiStep]   = useState(1);
  const [induction, setInduction] = useState(null);
  const [paralytic, setParalytic] = useState(null);
  const TABS = ["Assessment", "RSI Protocol", "Medications", "Failed Airway"];

  const selMnem = MNEMONICS.find(m => m.name === mnemonic);
  const selInd  = INDUCTION.find(d => d.drug === induction);
  const selPar  = PARALYTICS.find(d => d.drug === paralytic);

  // ── TAB 0: ASSESSMENT ─────────────────────────────────────────────────────
  const Tab0 = (
    <div>
      <div style={sL()}>Indications for Intubation</div>
      {[
        { ind: "Airway Failure",            detail: "Unable to maintain or protect airway · GCS ≤ 8 · absent gag · massive secretions · blood · vomitus", color: T.coral },
        { ind: "Oxygenation Failure",       detail: "SpO₂ < 90% despite high-flow O₂ · refractory hypoxemia · ARDS", color: T.amber },
        { ind: "Ventilation Failure",       detail: "Rising PaCO₂ with acidosis · respiratory exhaustion · unable to protect against aspiration", color: T.gold },
        { ind: "Anticipated Deterioration", detail: "Burn / inhalation injury · angioedema · deep neck space infection · rapidly evolving clinical picture", color: T.blue },
      ].map(({ ind, detail, color }) => (
        <div key={ind} style={{ ...card({ marginBottom: 8, borderLeft: `3px solid ${color}` }) }}>
          <div style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 3 }}>{ind}</div>
          <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{detail}</div>
        </div>
      ))}

      <div style={sL()}>Difficult Airway Mnemonics</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {MNEMONICS.map(m => (
          <button key={m.name} style={chip(m.color, mnemonic === m.name)} onClick={() => setMnemonic(m.name)}>
            {m.name}
          </button>
        ))}
      </div>

      {selMnem && (
        <div style={{ ...card({ border: `1.5px solid ${selMnem.color}50` }), marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <div style={{ fontFamily: T.mono, fontSize: 16, fontWeight: 800, color: selMnem.color }}>{selMnem.name}</div>
              <div style={{ fontSize: 11.5, color: T.muted }}>{selMnem.title}</div>
            </div>
            <div style={tag(selMnem.color)}>Difficult if ≥ 2</div>
          </div>
          {selMnem.items.map(({ l, w, d }) => (
            <div key={`${selMnem.name}-${l}`} style={{ display: "flex", gap: 12, marginBottom: 10, alignItems: "flex-start" }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: selMnem.color + "22", border: `1.5px solid ${selMnem.color}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: selMnem.color, fontFamily: T.mono, flexShrink: 0 }}>{l}</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.white, marginBottom: 2 }}>{w}</div>
                <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{d}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={aBox(T.coral, 0)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, marginBottom: 3 }}>If ≥ 2 factors in ANY mnemonic</div>
        <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.5 }}>
          Notify senior physician · Prepare surgical airway backup · Consider awake intubation (fiberoptic) · Have sugammadex drawn up · Activate difficult airway protocol
        </div>
      </div>
    </div>
  );

  // ── TAB 1: RSI PROTOCOL ───────────────────────────────────────────────────
  const Tab1 = (
    <div>
      <div style={aBox(T.blue, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.blue, marginBottom: 2 }}>7 Ps of RSI</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>Rapid Sequence Intubation — simultaneous induction + paralysis to minimize aspiration risk. Tap each step to expand.</div>
      </div>

      <div style={{ display: "flex", gap: 2, marginBottom: 14 }}>
        {RSI_STEPS.map((s) => (
          <div key={s.n} style={{ flex: 1 }}>
            <div style={{ height: 3, background: rsiStep >= s.n ? s.color : T.border, borderRadius: 2, marginBottom: 3, transition: "background 0.25s" }} />
            <div style={{ fontSize: 8, color: rsiStep >= s.n ? s.color : T.dim, textAlign: "center", fontFamily: T.mono }}>{s.n}</div>
          </div>
        ))}
      </div>

      {RSI_STEPS.map(({ n, p, color, icon, time, items }) => {
        const open = rsiStep === n;
        return (
          <div key={n}
            style={{ ...G(), padding: "12px 14px", marginBottom: 8, border: `1.5px solid ${rsiStep >= n ? color + "55" : T.border}`, background: rsiStep >= n ? color + "0d" : T.glass, cursor: "pointer", transition: "all 0.2s" }}
            onClick={() => setRsiStep(open ? 0 : n)}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: rsiStep >= n ? color + "28" : T.glass, border: `2px solid ${rsiStep >= n ? color : T.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0, transition: "all 0.2s" }}>{icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 800, color: rsiStep >= n ? color : T.muted, letterSpacing: "0.05em" }}>{n}. {p}</div>
                <div style={{ fontSize: 10.5, color: rsiStep >= n ? color + "bb" : T.dim, fontFamily: T.mono, marginTop: 1 }}>{time}</div>
              </div>
              <div style={{ fontSize: 13, color: open ? color : T.dim }}>{open ? "▲" : "▼"}</div>
            </div>
            {open && (
              <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${color}30` }}>
                {items.map((item, i) => (
                  <div key={i} style={{ fontSize: 11.5, color: T.muted, display: "flex", gap: 8, marginBottom: 6, lineHeight: 1.45 }}>
                    <span style={{ color, flexShrink: 0 }}>▸</span>{item}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  // ── TAB 2: MEDICATIONS ────────────────────────────────────────────────────
  const Tab2 = (
    <div>
      <div style={sL()}>Induction Agent — select one</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
        {INDUCTION.map(d => (
          <button key={d.drug} style={chip(d.color, induction === d.drug)} onClick={() => setInduction(induction === d.drug ? null : d.drug)}>{d.drug}</button>
        ))}
      </div>

      {selInd && (
        <div style={{ ...card({ border: `1.5px solid ${selInd.color}55`, marginBottom: 16 }) }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: selInd.color, fontFamily: T.mono }}>{selInd.drug}</div>
              <div style={{ fontFamily: T.mono, fontSize: 13, color: T.white, marginTop: 2 }}>{selInd.dose}</div>
              <div style={{ fontSize: 11, color: T.dim, marginTop: 1 }}>Onset: {selInd.onset}</div>
            </div>
            <div style={tag(selInd.color)}>Induction</div>
          </div>
          <div style={aBox(T.green, 10)}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: T.green, marginBottom: 5 }}>PREFERRED FOR</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>{selInd.preferred}</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: T.teal, marginBottom: 5 }}>ADVANTAGES</div>
              {selInd.pros.map((p, i) => <div key={i} style={{ fontSize: 11, color: T.muted, marginBottom: 4, display: "flex", gap: 6 }}><span style={{ color: T.teal }}>+</span>{p}</div>)}
            </div>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: T.coral, marginBottom: 5 }}>CAUTIONS</div>
              {selInd.cons.map((c, i) => <div key={i} style={{ fontSize: 11, color: T.muted, marginBottom: 4, display: "flex", gap: 6 }}><span style={{ color: T.coral }}>–</span>{c}</div>)}
            </div>
          </div>
        </div>
      )}

      <div style={sL(T.coral)}>Paralytic — select one</div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {PARALYTICS.map(d => (
          <button key={d.drug} style={{ ...chip(d.color, paralytic === d.drug), flex: 1 }} onClick={() => setParalytic(paralytic === d.drug ? null : d.drug)}>{d.drug}</button>
        ))}
      </div>

      {selPar && (
        <div style={{ ...card({ border: `1.5px solid ${selPar.color}55`, marginBottom: 14 }) }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: selPar.color, fontFamily: T.mono }}>{selPar.drug}</div>
              <div style={{ fontSize: 10.5, color: T.muted, marginTop: 1 }}>{selPar.type}</div>
            </div>
            <div style={tag(selPar.color)}>{selPar.duration}</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: 12 }}>
            {[
              { label: "Standard dose", val: selPar.dose },
              { label: "Obese dose",    val: selPar.obese },
              { label: "Onset",         val: selPar.onset },
            ].map(({ label, val }) => (
              <div key={label} style={{ ...G({ borderRadius: 8 }), padding: "8px 10px", textAlign: "center" }}>
                <div style={{ fontSize: 9.5, color: T.dim, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</div>
                <div style={{ fontFamily: T.mono, fontSize: 12, color: T.white, fontWeight: 600 }}>{val}</div>
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: T.coral, marginBottom: 6 }}>CONTRAINDICATIONS</div>
            {selPar.ci.map((c, i) => <div key={i} style={{ fontSize: 11.5, color: T.muted, display: "flex", gap: 7, marginBottom: 5 }}><span style={{ color: T.coral, flexShrink: 0 }}>✗</span>{c}</div>)}
          </div>
          <div style={dv} />
          <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.5 }}>{selPar.notes}</div>
          {selPar.drug === "Rocuronium" && (
            <div style={{ ...aBox(T.teal, 0), marginTop: 10 }}>
              <div style={{ fontSize: 11.5, color: T.teal, fontWeight: 600 }}>Reversal: Sugammadex 16 mg/kg IV → full reversal in &lt; 3 min</div>
            </div>
          )}
        </div>
      )}

      <div style={sL(T.gold)}>Adjuncts Quick Reference</div>
      {[
        { drug: "Lidocaine",      dose: "1.5 mg/kg IV", use: "Reactive airways or elevated ICP — give 3 min before induction" },
        { drug: "Fentanyl",       dose: "3 mcg/kg IV",  use: "Blunt sympathetic surge — hypertensive emergency, aortic dissection, elevated ICP" },
        { drug: "Glycopyrrolate", dose: "0.2 mg IV",    use: "Reduce ketamine-induced secretions · bradycardia prevention in peds" },
        { drug: "Sugammadex",     dose: "16 mg/kg IV",  use: "Reversal of rocuronium/vecuronium — can't intubate, can't oxygenate with rocuronium" },
      ].map(({ drug, dose, use }) => (
        <div key={drug} style={{ ...G(), padding: "10px 13px", marginBottom: 7, display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ minWidth: 120, flexShrink: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.gold }}>{drug}</div>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.white, marginTop: 2 }}>{dose}</div>
          </div>
          <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{use}</div>
        </div>
      ))}
    </div>
  );

  // ── TAB 3: FAILED AIRWAY ──────────────────────────────────────────────────
  const Tab3 = (
    <div>
      <div style={aBox(T.coral, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, marginBottom: 2 }}>CICO — Can't Intubate, Can't Oxygenate</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>Surgical airway is the ONLY option in CICO. Do not delay with repeated intubation attempts. Declare the emergency aloud to the team.</div>
      </div>

      <div style={sL()}>Failed Airway Algorithm</div>
      {[
        { state: "Can't intubate — CAN ventilate", color: T.gold, steps: ["Call for help immediately", "Continue BVM oxygenation — maintain SpO₂", "Place LMA / i-gel / King LT as bridge", "Prepare for video laryngoscopy or fiberoptic", "Consider awake technique if time allows", "Do NOT make more than 3 intubation attempts"] },
        { state: "Can't intubate — CAN'T ventilate (CICO)", color: T.coral, steps: ["Declare CICO aloud — activate surgical airway", "Last attempt: LMA or i-gel (may allow enough oxygenation)", "Immediate cricothyrotomy — scalpel-finger-tube technique", "While performing: one provider continues BVM", "Call trauma surgery / ENT to bedside", "Prepare for emergent tracheostomy if cricothyrotomy fails"] },
      ].map(({ state, color, steps }) => (
        <div key={state} style={{ ...card({ marginBottom: 12, border: `1.5px solid ${color}50`, background: color + "0a" }) }}>
          <div style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 10 }}>{state}</div>
          {steps.map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: 6 }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: color + "22", border: `1px solid ${color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color, flexShrink: 0 }}>{i + 1}</div>
              <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{s}</div>
            </div>
          ))}
        </div>
      ))}

      <div style={sL(T.amber)}>Rescue Airway Devices</div>
      {[
        { device: "LMA / i-gel",                  use: "Supraglottic airway — bridge device · sizes 3 (< 50 kg) / 4 (50–70 kg) / 5 (> 70 kg)" },
        { device: "King LT",                       use: "Blind insertion supraglottic · dual balloon · useful in prehospital and difficult anatomy" },
        { device: "Video Laryngoscope",            use: "GlideScope / C-MAC — improved grade of view · use hyperangulated blade for anterior airways" },
        { device: "Fiberoptic / Flexible scope",   use: "Awake intubation gold standard · requires topicalization · requires specialist in most EDs" },
        { device: "Bougie / Tracheal introducer",  use: "Use with every intubation attempt — significantly improves first-pass success" },
      ].map(({ device, use }) => (
        <div key={device} style={{ ...G(), padding: "10px 13px", marginBottom: 7, borderLeft: `3px solid ${T.amber}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.amber, marginBottom: 2 }}>{device}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{use}</div>
        </div>
      ))}

      <div style={sL(T.coral)}>Cricothyrotomy — Scalpel-Finger-Tube</div>
      <div style={{ ...card({ border: `1.5px solid ${T.coral}40` }) }}>
        {[
          "Identify cricothyroid membrane (CTM) — midline, between thyroid and cricoid cartilage",
          "Stabilize larynx with non-dominant hand (laryngeal handshake)",
          "Horizontal stab incision through skin and CTM (10–15 mm)",
          "Insert finger into trachea to maintain access and confirm position",
          "Insert 6.0 cuffed ETT or bougie → tube (6.0) along finger",
          "Inflate cuff · ventilate · confirm waveform capnography",
          "Secure tube · prepare for definitive surgical airway (tracheostomy)",
        ].map((step, i) => (
          <div key={i} style={{ display: "flex", gap: 10, marginBottom: i < 6 ? 8 : 0 }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: T.coral + "22", border: `1px solid ${T.coral}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: T.coral, flexShrink: 0 }}>{i + 1}</div>
            <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{step}</div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: `radial-gradient(ellipse 70% 40% at 15% 0%, rgba(59,130,246,0.10) 0%, transparent 60%), radial-gradient(ellipse 50% 35% at 85% 95%, rgba(244,63,94,0.08) 0%, transparent 55%), ${T.bg}`, fontFamily: T.sans, color: T.white, paddingBottom: 80 }}>

      <NotryaHubHeader hubName="Airway / RSI" category="Critical Care" homeUrl="/" />
      <div style={{ padding: "16px 20px 0" }}></div>

      <div style={{ display: "flex", gap: 4, padding: "0 20px", marginBottom: 18, overflowX: "auto", scrollbarWidth: "none" }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            style={{ padding: "7px 15px", borderRadius: 9, border: `1.5px solid ${tab === i ? T.blue : T.border}`, background: tab === i ? "rgba(59,130,246,0.14)" : T.glass, color: tab === i ? T.blue : T.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.sans, whiteSpace: "nowrap", transition: "all 0.18s", backdropFilter: "blur(8px)" }}>
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