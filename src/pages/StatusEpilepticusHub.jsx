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
const G    = (x = {}) => ({ background: T.glass, backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", border: `1px solid ${T.border}`, borderRadius: 14, ...x });
const pill = (bg)     => ({ display: "inline-block", background: bg, borderRadius: 6, padding: "3px 10px", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", marginRight: 6, marginBottom: 10 });
const tag  = (c)      => ({ display: "inline-block", background: c + "22", border: `1px solid ${c}44`, borderRadius: 5, padding: "2px 8px", fontSize: 10.5, fontWeight: 600, color: c });
const card = (x = {}) => ({ ...G(), padding: "14px 16px", ...x });
const aBox = (c, mb = 10) => ({ background: c + "14", border: `1px solid ${c}40`, borderRadius: 10, padding: "10px 14px", marginBottom: mb });
const sL   = (c = T.purple) => ({ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: c, margin: "18px 0 10px", display: "flex", alignItems: "center", gap: 8 });

// ── Data ─────────────────────────────────────────────────────────────────────
const PHASES = [
  {
    phase: 1, time: "0 – 5 min", label: "STABILIZE", color: T.green,
    bg: "rgba(34,197,94,0.09)", icon: "⚡",
    summary: "ABCs · IV/IO access · O₂ · continuous monitoring",
    agents: [
      { name: "Thiamine 100 mg IV",          note: "Before dextrose in adults — always" },
      { name: "Dextrose 50% (D50) 50 mL IV", note: "If glucose < 60 or unknown — do not delay" },
      { name: "Oxygen",                       note: "High-flow · prepare for intubation if refractory" },
      { name: "IV/IO access",                 note: "Two large-bore IVs · draw labs simultaneously" },
    ],
    pearl: "Draw labs with IV placement: BMP, glucose, Mg, Ca, CBC, LFTs, AED levels, tox screen, β-hCG. Do not delay benzodiazepines for labs.",
  },
  {
    phase: 2, time: "5 – 20 min", label: "BENZODIAZEPINES", color: T.teal,
    bg: "rgba(20,184,166,0.09)", icon: "1️⃣",
    summary: "First-line — choose one based on access. Can repeat once after 5 min.",
    agents: [
      { name: "Lorazepam (Ativan)",   dose: "0.1 mg/kg IV",  max: "4 mg/dose",  note: "Preferred if IV access · onset 2–3 min" },
      { name: "Midazolam (Versed)",   dose: "0.2 mg/kg IM",  max: "10 mg",      note: "Preferred if no IV access (RAMPART trial — non-inferior to lorazepam IV)" },
      { name: "Diazepam (Valium)",    dose: "0.15 mg/kg IV", max: "10 mg/dose", note: "Alt IV option · or rectal 0.2–0.5 mg/kg if no access" },
      { name: "Intranasal Midazolam", dose: "0.2 mg/kg IN",  max: "10 mg",      note: "Peds-friendly · use atomizer · onset 3–5 min" },
    ],
    pearl: "Repeat once after 5 min if seizure continues. If 2 doses given without response, move to phase 3 — do not give a 3rd benzo.",
  },
  {
    phase: 3, time: "20 – 40 min", label: "SECOND-LINE AEDs", color: T.gold,
    bg: "rgba(245,158,11,0.09)", icon: "2️⃣",
    summary: "Give ONE agent. Levetiracetam preferred — fewer interactions and monitoring requirements.",
    agents: [
      { name: "Levetiracetam (Keppra)", dose: "60 mg/kg IV over 10 min", max: "4,500 mg", note: "Preferred · no cardiac monitoring needed · minimal drug interactions" },
      { name: "Fosphenytoin",           dose: "20 mg PE/kg IV at 150 mg PE/min", max: "1,500 mg PE", note: "Cardiac monitoring required · hold if hypotension or bradycardia · avoid in Na-channel blockade OD" },
      { name: "Valproic Acid",          dose: "40 mg/kg IV over 10 min", max: "3,000 mg", note: "Avoid in pregnancy, liver disease, metabolic disorders, pancreatitis" },
      { name: "Phenobarbital",          dose: "15–20 mg/kg IV at 50–100 mg/min", max: "No hard cap", note: "High risk respiratory depression + hypotension · have airway ready" },
    ],
    pearl: "ESETT trial (2019): levetiracetam, fosphenytoin, and valproate have equivalent efficacy (~47%). Choose based on patient factors and side effect profile.",
  },
  {
    phase: 4, time: "> 40 min", label: "REFRACTORY SE", color: T.amber,
    bg: "rgba(251,146,60,0.09)", icon: "3️⃣",
    summary: "ICU transfer · continuous EEG · anesthetic infusion · intubation required.",
    agents: [
      { name: "Propofol",   dose: "1–2 mg/kg IV bolus",   infusion: "20–200 mcg/kg/min", note: "Titrate to burst suppression on EEG · watch for propofol infusion syndrome (triglycerides, lactic acidosis)" },
      { name: "Midazolam",  dose: "0.2 mg/kg IV bolus",   infusion: "0.05–2 mg/kg/h",   note: "Good hemodynamic profile · tachyphylaxis with prolonged use" },
      { name: "Ketamine",   dose: "1.5 mg/kg IV bolus",   infusion: "1.2–10 mg/kg/h",   note: "NMDA antagonist · use if hemodynamically unstable · does NOT worsen ICP as previously thought" },
      { name: "Phenobarbital", dose: "15–20 mg/kg IV",    infusion: "—",                 note: "If not already given in phase 3" },
    ],
    pearl: "Titrate anesthetic to burst suppression on continuous EEG. Target: 1–2 bursts/min. Maintain for 24–48h then taper slowly.",
  },
  {
    phase: 5, time: "≥ 24 h", label: "SUPER-REFRACTORY SE", color: T.coral,
    bg: "rgba(244,63,94,0.09)", icon: "🚨",
    summary: "Neurology / neurocritical care essential. Consider autoimmune etiology.",
    agents: [
      { name: "Pentobarbital coma", dose: "5–15 mg/kg load IV",      infusion: "0.5–10 mg/kg/h", note: "Deepest barbiturate coma · profound hypotension · vasopressors typically required" },
      { name: "Immunotherapy",      dose: "IVIG 2g/kg over 5 days",  infusion: "—",               note: "If autoimmune encephalitis suspected (anti-NMDA, LGI1, GABA-B) · or steroids + plasmapheresis" },
      { name: "Ketogenic diet",     dose: "4:1 fat:carb ratio via NG", infusion: "—",             note: "Evidence in peds and adults · takes days to take effect · consult dietitian" },
      { name: "Hypothermia",        dose: "Target 32–35°C",           infusion: "—",               note: "Limited evidence · may be neuroprotective · avoid if infection present" },
    ],
    pearl: "Always investigate for autoimmune encephalitis in super-refractory SE — anti-NMDA receptor encephalitis, LGI1, CASPR2, GABA-B. Send CSF + serum panels.",
  },
];

const VITAMINS = [
  { letter: "V", word: "Vascular",              detail: "Ischemic stroke · hemorrhagic stroke · CVST · hypertensive encephalopathy · vasculitis" },
  { letter: "I", word: "Infectious",            detail: "Bacterial meningitis · viral encephalitis (HSV most common) · brain abscess · septic encephalopathy" },
  { letter: "T", word: "Toxic / Drugs",         detail: "Alcohol withdrawal · cocaine · amphetamines · bupropion · tramadol · isoniazid · AED non-compliance · overdose" },
  { letter: "A", word: "Autoimmune",            detail: "Anti-NMDA receptor · LGI1 · CASPR2 · GABA-B · AMPA receptor encephalitis · MS · lupus CNS" },
  { letter: "M", word: "Metabolic",             detail: "Hyponatremia (most common metabolic cause) · hypoglycemia · hypocalcemia · hypomagnesemia · uremia · hepatic encephalopathy" },
  { letter: "I", word: "Idiopathic / Epilepsy", detail: "Breakthrough seizure · AED non-compliance · subtherapeutic levels · fever lowering seizure threshold" },
  { letter: "N", word: "Neoplastic",            detail: "Primary brain tumor · metastases · paraneoplastic syndromes · leptomeningeal carcinomatosis" },
  { letter: "S", word: "Structural / Systemic", detail: "TBI · post-surgical · hypoxic-ischemic injury · eclampsia · PRES · cerebral edema" },
];

import { useNavigate } from "react-router-dom";

// ── Main Component ───────────────────────────────────────────────────────────
export default function StatusEpilepticusHub({ onBack }) {
  const navigate = useNavigate();
  const handleBack = () => onBack ? onBack() : navigate("/CriticalProtocolsPage");
  const [tab, setTab]     = useState(0);
  const [phase, setPhase] = useState(1);
  const TABS = ["Recognition", "Treatment", "Workup", "Monitoring"];

  // ── TAB 0: RECOGNITION ────────────────────────────────────────────────────
  const T0 = (
    <div>
      <div style={aBox(T.coral, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, marginBottom: 2 }}>Time = Neurons</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>Every minute of uncontrolled seizure activity causes irreversible neuronal injury. Do not wait — treat immediately at the 5-minute mark.</div>
      </div>

      <div style={sL()}>Definitions</div>
      {[
        { term: "Status Epilepticus (SE)", def: "Seizure lasting ≥ 5 minutes OR ≥ 2 discrete seizures without return to baseline consciousness between them", color: T.gold },
        { term: "Refractory SE", def: "Failure of adequate doses of 2 antiepileptic agents (benzodiazepine + one second-line AED)", color: T.amber },
        { term: "Super-Refractory SE", def: "SE continuing or recurring ≥ 24 hours after initiation of anesthetic therapy", color: T.coral },
      ].map(({ term, def, color }) => (
        <div key={term} style={{ ...card({ marginBottom: 10, borderLeft: `3px solid ${color}` }) }}>
          <div style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 4 }}>{term}</div>
          <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.5 }}>{def}</div>
        </div>
      ))}

      <div style={sL()}>Seizure Types</div>
      <div style={{ display: "grid", gap: 8 }}>
        {[
          { type: "Generalized Convulsive SE (GCSE)", desc: "Tonic-clonic activity · most recognized · most dangerous · may progress to subtle/non-convulsive", urgent: true },
          { type: "Non-Convulsive SE (NCSE)", desc: "Subtle or absent motor activity · altered mentation only · EEG required to diagnose · frequently missed", urgent: true },
          { type: "Subtle SE", desc: "Late manifestation of prolonged GCSE · minor twitching of face/extremities · only EEG shows ongoing electrical activity", urgent: true },
          { type: "Focal SE", desc: "Seizure confined to one area · may have preserved awareness (previously 'simple partial') or impaired (previously 'complex partial')", urgent: false },
          { type: "Absence SE", desc: "Continuous or recurrent absence seizures · staring · mild automatisms · fluctuating responsiveness", urgent: false },
        ].map(({ type, desc, urgent }) => (
          <div key={type} style={{ ...G(), padding: "11px 14px", display: "flex", gap: 12, alignItems: "flex-start", borderLeft: `3px solid ${urgent ? T.coral : T.gold}` }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: urgent ? T.coral : T.gold, marginBottom: 3 }}>{type}</div>
              <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{desc}</div>
            </div>
            {urgent && <div style={{ ...tag(T.coral), flexShrink: 0, whiteSpace: "nowrap" }}>EEG</div>}
          </div>
        ))}
      </div>

      <div style={{ ...aBox(T.purple, 0), marginTop: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.purple, marginBottom: 3 }}>🧠 Non-Convulsive SE</div>
        <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.5 }}>
          Consider NCSE in ANY patient with altered mental status, especially post-ictal patients not returning to baseline within 30 minutes. Continuous EEG is the only way to diagnose and monitor treatment response.
        </div>
      </div>
    </div>
  );

  // ── TAB 1: TREATMENT ──────────────────────────────────────────────────────
  const T1 = (
    <div>
      <div style={aBox(T.purple, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.purple, marginBottom: 2 }}>Sequential Protocol — Advance rapidly through phases</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>Do not repeat benzodiazepines beyond 2 doses. If 2 AEDs fail → anesthetic infusion + ICU. Tap each phase to expand.</div>
      </div>

      {/* Timeline bar */}
      <div style={{ display: "flex", gap: 2, marginBottom: 16, padding: "0 2px" }}>
        {["0–5 min", "5–20 min", "20–40 min", "> 40 min", "≥ 24 h"].map((t, i) => (
          <div key={t} style={{ flex: 1, textAlign: "center" }}>
            <div style={{ height: 4, background: phase > i ? PHASES[i].color : T.border, borderRadius: 2, marginBottom: 4, transition: "background 0.3s" }} />
            <div style={{ fontSize: 9, color: phase > i ? PHASES[i].color : T.dim, fontFamily: T.mono, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t}</div>
          </div>
        ))}
      </div>

      {PHASES.map(({ phase: ph, time, label, color, bg, icon, summary, agents, pearl }) => {
        const isActive = phase === ph;
        return (
          <div key={ph}
            style={{ ...G(), padding: "13px 15px", marginBottom: 9, border: `1.5px solid ${phase >= ph ? color + "60" : T.border}`, background: phase >= ph ? bg : T.glass, cursor: "pointer", transition: "all 0.2s" }}
            onClick={() => setPhase(isActive ? 0 : ph)}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: phase >= ph ? color + "25" : T.glass, border: `2px solid ${phase >= ph ? color : T.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0, transition: "all 0.2s" }}>
                {icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                  <span style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 800, color: phase >= ph ? color : T.muted, letterSpacing: "0.05em" }}>PHASE {ph} — {label}</span>
                  <span style={{ ...tag(color), fontSize: 10 }}>{time}</span>
                </div>
                <div style={{ fontSize: 11.5, color: phase >= ph ? T.muted : T.dim }}>{summary}</div>
              </div>
              <div style={{ fontSize: 14, color: isActive ? color : T.dim, flexShrink: 0 }}>{isActive ? "▲" : "▼"}</div>
            </div>

            {isActive && (
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${color}30` }}>
                {agents.map(({ name, dose, max, infusion, note }) => (
                  <div key={name} style={{ ...G({ borderRadius: 10, marginBottom: 8 }), padding: "11px 13px" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 4 }}>{name}</div>
                    {dose && (
                      <div style={{ fontFamily: T.mono, fontSize: 12, color: T.white, marginBottom: 2 }}>
                        {dose}{max ? <span style={{ color: T.dim }}> · max {max}</span> : ""}
                      </div>
                    )}
                    {infusion && (
                      <div style={{ fontFamily: T.mono, fontSize: 11.5, color: T.teal, marginBottom: 2 }}>Infusion: {infusion}</div>
                    )}
                    <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4, marginTop: 3 }}>{note}</div>
                  </div>
                ))}
                <div style={{ ...aBox(T.gold, 0), marginTop: 6 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.gold, marginBottom: 2 }}>⚡ Pearl</div>
                  <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.5 }}>{pearl}</div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  // ── TAB 2: WORKUP ─────────────────────────────────────────────────────────
  const T2 = (
    <div>
      <div style={sL()}>Immediate Labs</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        {[
          { test: "Point-of-care glucose",    why: "Immediate — before dextrose · treat if < 60 mg/dL" },
          { test: "BMP + Mg + Ca + Phos",     why: "Electrolyte causes — hyponatremia most common metabolic trigger" },
          { test: "CBC with differential",     why: "Infection · leukemia · thrombocytopenia" },
          { test: "LFTs + Ammonia",           why: "Hepatic encephalopathy · valproate toxicity" },
          { test: "AED levels",               why: "Subtherapeutic levels in known epileptics" },
          { test: "Urine + serum tox screen", why: "Drugs of abuse · bupropion · tramadol · INH · cocaine" },
          { test: "Blood cultures × 2",       why: "If febrile or meningitis suspected" },
          { test: "β-hCG",                    why: "Eclampsia · medication safety · MRI contrast" },
          { test: "Lactate",                  why: "Elevated post-ictal (expected) · monitor trend" },
          { test: "TSH",                      why: "Thyroid storm as trigger" },
          { test: "ABG / VBG",               why: "Acid-base · respiratory status · CO₂ retention" },
        ].map(({ test, why }, i) => (
          <div key={test} style={{ display: "flex", gap: 10, paddingBottom: 7, marginBottom: 7, borderBottom: i < 10 ? `1px solid ${T.border}` : "none" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.purple, minWidth: 170, flexShrink: 0 }}>{test}</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>{why}</div>
          </div>
        ))}
      </div>

      <div style={sL()}>Imaging</div>
      {[
        { modality: "Head CT — non-contrast", timing: "After stabilization (don't delay treatment)", indication: "Hemorrhage · mass effect · herniation · acute structural cause" },
        { modality: "MRI Brain w/ + w/o contrast", timing: "If CT negative + unexplained SE", indication: "Encephalitis · PRES · cortical dysplasia · subtle ischemia · autoimmune" },
        { modality: "CT Angiography", timing: "If vascular cause suspected", indication: "CVST · vasculitis · aneurysm" },
      ].map(({ modality, timing, indication }) => (
        <div key={modality} style={{ ...card({ marginBottom: 8 }) }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.purple, marginBottom: 3 }}>{modality}</div>
          <div style={{ fontSize: 11, color: T.teal, marginBottom: 3, fontFamily: T.mono }}>{timing}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{indication}</div>
        </div>
      ))}

      <div style={sL()}>Underlying Causes — VITAMINS</div>
      {VITAMINS.map(({ letter, word, detail }) => (
        <div key={`${letter}-${word}`} style={{ ...G(), padding: "11px 14px", marginBottom: 7, display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: T.purple + "22", border: `1.5px solid ${T.purple}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, color: T.purple, fontFamily: T.mono, flexShrink: 0 }}>
            {letter}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.white, marginBottom: 2 }}>{word}</div>
            <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.45 }}>{detail}</div>
          </div>
        </div>
      ))}

      <div style={{ ...aBox(T.purple, 0), marginTop: 10 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: T.purple, marginBottom: 3 }}>Lumbar Puncture</div>
        <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.5 }}>
          Perform if meningitis or encephalitis suspected and CT shows no contraindication (no mass effect, herniation, or papilledema). Do not delay empiric treatment while awaiting LP — start dexamethasone + antibiotics ± acyclovir first.
        </div>
      </div>
    </div>
  );

  // ── TAB 3: MONITORING ─────────────────────────────────────────────────────
  const T3 = (
    <div>
      <div style={sL()}>EEG Indications</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.purple, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Order STAT EEG if:</div>
        {[
          "Refractory SE or failure of 2 AED agents",
          "Post-ictal state not resolving within 30 minutes",
          "Altered mental status with no clear cause",
          "Subtle motor activity (eye twitching, jaw clenching) after apparent cessation",
          "Patient on anesthetic infusions (need to titrate to burst suppression)",
          "Suspected non-convulsive SE",
        ].map((t, i) => (
          <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 8, marginBottom: 5 }}>
            <span style={{ color: T.purple }}>●</span>{t}
          </div>
        ))}
      </div>

      <div style={sL()}>EEG Targets — Refractory SE</div>
      {[
        { target: "Seizure suppression", desc: "No ictal activity on continuous EEG — minimum goal", color: T.gold },
        { target: "Burst suppression", desc: "1–2 bursts/min with interburst intervals — preferred target for anesthetic therapy", color: T.teal },
        { target: "Flat (isoelectric)", desc: "Only for extreme cases — significant risk of permanent injury", color: T.coral },
      ].map(({ target, desc, color }) => (
        <div key={target} style={{ ...G(), padding: "11px 14px", marginBottom: 8, borderLeft: `3px solid ${color}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 2 }}>{target}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{desc}</div>
        </div>
      ))}

      <div style={sL()}>Concurrent Management</div>
      {[
        { item: "Airway",        detail: "Intubate if refractory SE, anesthetics required, or GCS ≤ 8 post-ictally" },
        { item: "Hyperthermia",  detail: "Treat aggressively — fever lowers seizure threshold and worsens neuronal injury. Target < 37.5°C" },
        { item: "Hypoglycemia",  detail: "Maintain glucose 140–180 mg/dL — avoid hypoglycemia" },
        { item: "Hyponatremia",  detail: "Correct slowly (max 8–10 mEq/L per 24h) unless severe symptomatic — osmotic demyelination risk" },
        { item: "BP Management", detail: "Permissive hypertension acutely post-SE. Treat fosphenytoin-related hypotension with IVF ± vasopressors" },
        { item: "Infection",     detail: "Empiric meningitis coverage (ceftriaxone + vancomycin + acyclovir) if febrile and meningitis possible — before LP" },
      ].map(({ item, detail }, i) => (
        <div key={item} style={{ display: "flex", gap: 12, paddingBottom: 8, marginBottom: 8, borderBottom: i < 5 ? `1px solid ${T.border}` : "none" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.purple, minWidth: 130, flexShrink: 0 }}>{item}</div>
          <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{detail}</div>
        </div>
      ))}

      <div style={sL()}>Disposition</div>
      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ ...card({ background: "rgba(244,63,94,0.07)", borderColor: "rgba(244,63,94,0.25)" }) }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.coral, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>ICU Criteria</div>
          {["Refractory or super-refractory SE", "Anesthetic infusion required", "Intubated", "Hemodynamic instability", "Continuous EEG monitoring needed"].map((t, i) => (
            <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 8, marginBottom: 5 }}><span style={{ color: T.coral }}>●</span>{t}</div>
          ))}
        </div>
        <div style={{ ...card({ background: "rgba(34,197,94,0.07)", borderColor: "rgba(34,197,94,0.25)" }) }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.green, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Step-Down / Monitored Bed</div>
          {["Responded to benzodiazepine alone", "Returned to neurological baseline", "Identifiable and treatable cause", "No recurrence during observation"].map((t, i) => (
            <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 8, marginBottom: 5 }}><span style={{ color: T.green }}>✓</span>{t}</div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: `radial-gradient(ellipse 70% 40% at 15% 0%, rgba(167,139,250,0.10) 0%, transparent 60%), radial-gradient(ellipse 50% 35% at 85% 95%, rgba(244,63,94,0.07) 0%, transparent 55%), ${T.bg}`, fontFamily: T.sans, color: T.white, paddingBottom: 80 }}>

      <div style={{ padding: "20px 20px 0" }}>
        <button onClick={handleBack} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", color: T.teal, fontSize: 13, fontFamily: T.sans, cursor: "pointer", padding: "4px 0", marginBottom: 16 }}>
          ← Critical Protocols
        </button>
        <div>
          <span style={pill("linear-gradient(135deg,#a78bfa,#6d28d9)")}>🧠 Neurologic</span>
          <span style={pill("linear-gradient(135deg,#0d9488,#065f46)")}>ESETT 2019</span>
        </div>
        <h1 style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 700, margin: "0 0 4px", lineHeight: 1.15 }}>Status Epilepticus</h1>
        <p style={{ color: T.muted, fontSize: 12, margin: "0 0 20px" }}>5-phase sequential protocol · Benzo → AED → Anesthetic · VITAMINS causes</p>
      </div>

      <div style={{ display: "flex", gap: 4, padding: "0 20px", marginBottom: 18, overflowX: "auto", scrollbarWidth: "none" }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            style={{ padding: "7px 15px", borderRadius: 9, border: `1.5px solid ${tab === i ? T.purple : T.border}`, background: tab === i ? "rgba(167,139,250,0.14)" : T.glass, color: tab === i ? T.purple : T.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.sans, whiteSpace: "nowrap", transition: "all 0.18s", backdropFilter: "blur(8px)" }}>
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