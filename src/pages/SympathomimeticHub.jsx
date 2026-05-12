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

const AGENTS = [
  {
    id: "cocaine", name: "Cocaine", color: T.coral,
    moa: "Blocks catecholamine reuptake (NE + dopamine + serotonin) + Na-channel blockade (local anesthetic)",
    onset: "Intranasal: 3–5 min · IV/smoked: 10–30 sec · duration: 30–90 min",
    features: "Euphoria · tachycardia · hypertension · hyperthermia · dilated pupils · coronary vasospasm · chest pain (ACS + vasospasm) · agitation · seizures (high doses)",
    unique: "Sodium channel blockade → wide QRS → can mimic TCA toxicity on ECG · levamisole in supply → agranulocytosis · coronary vasospasm even in young patients without atherosclerosis",
    tx: "Benzodiazepines first-line (address catecholamine excess AND Na channel effects) · NTG + Ca-channel blocker for chest pain/vasospasm · avoid beta-blockers (unopposed alpha → worse hypertension + vasospasm) · bicarbonate for wide QRS",
    avoid: "Beta-blockers (absolute contraindication — unopposed alpha stimulation) · physostigmine · hyperthermia worsens all effects",
  },
  {
    id: "methamphetamine", name: "Methamphetamine / Amphetamines", color: T.amber,
    moa: "Reverses catecholamine transporters → massive NE + dopamine release · inhibits MAO · indirect sympathomimetic",
    onset: "Smoked/IV: seconds · oral: 20–60 min · duration: 8–24 hours (MUCH longer than cocaine)",
    features: "Prolonged agitation · hyperthermia (severe) · tachycardia · hypertension · psychosis (paranoia · visual/tactile hallucinations) · bruxism · repetitive behaviors · rhabdomyolysis · cardiac arrhythmias",
    unique: "Duration 8–24h → much longer clinical course than cocaine · hyperthermia from prolonged muscle activity + psychomotor agitation is most dangerous manifestation · methamphetamine psychosis can persist for days/weeks · cardiomyopathy with chronic use",
    tx: "High-dose benzodiazepines for agitation/seizures · aggressive cooling for hyperthermia · antipsychotics only as adjunct (haloperidol or droperidol — lowers seizure threshold so add benzos first) · IV hydration for rhabdomyolysis",
    avoid: "Beta-blockers · underestimating duration (patient may look better then deteriorate) · delaying cooling",
  },
  {
    id: "mdma", name: "MDMA / Ecstasy / Molly", color: T.purple,
    moa: "Massive serotonin release + NE + dopamine · serotonergic predominance distinguishes from pure sympathomimetics",
    onset: "Oral: 30–45 min · peak: 90 min · duration: 4–6h",
    features: "Empathogenic effects · moderate sympathomimetic · hyperthermia · hyponatremia (SIADH + excessive water intake) · serotonin syndrome features (clonus + hyperreflexia) · jaw clenching (bruxism) · mydriasis",
    unique: "Hyponatremia = major cause of MDMA deaths (excessive hypotonic fluid intake + SIADH) · serotonin syndrome features may overlap (clonus distinguishes from pure sympathomimetic) · contaminants in supply (fentanyl · methamphetamine) may dominate presentation · hyperthermia + rhabdomyolysis in rave settings (exertion + heat)",
    tx: "Aggressive cooling for hyperthermia · treat hyponatremia with 3% NaCl if symptomatic · benzodiazepines for agitation/seizures · cyproheptadine if serotonin syndrome features prominent · restrict free water",
    avoid: "Hypotonic fluids (worsens hyponatremia) · aggressive fluid repletion without Na monitoring · missing serotonin syndrome component",
  },
  {
    id: "ppa_pseudo", name: "Pseudoephedrine / PPA / Decongestants", color: T.blue,
    moa: "Alpha-1 and beta-adrenergic agonism · indirect sympathomimetic via catecholamine release",
    onset: "Oral: 30–60 min · duration: 4–6h (IR) · 12h (ER formulations)",
    features: "Hypertension (often severe and disproportionate) · reflex bradycardia with PPA · tachycardia with pseudoephedrine · headache · insomnia · anxiety · urinary retention (alpha effect)",
    unique: "Phenylpropanolamine (PPA) withdrawn from US market 2000 — hemorrhagic stroke risk · pseudoephedrine can cause severe isolated hypertension with reflex bradycardia (appears different from classic sympathomimetic) · extended-release decongestants: prolonged hypertension course",
    tx: "Benzodiazepines · phentolamine or nicardipine for severe hypertension · labetalol acceptable (alpha + beta) · watch for reflex bradycardia after alpha blockade",
    avoid: "Pure beta-blockers (unopposed alpha) · underestimating duration of ER formulations",
  },
  {
    id: "bath_salts", name: "Synthetic Cathinones (Bath Salts / Flakka)", color: T.teal,
    moa: "Cathinone derivatives → massive monoamine release (NE + dopamine + serotonin) · similar to methamphetamine but often more potent",
    onset: "Insufflation/IV: minutes · oral: 15–45 min · duration: highly variable (2–8h typical, can be much longer)",
    features: "EXTREME agitation · paranoid psychosis · violence and combativeness · superhuman strength reported · hyperthermia · tachycardia · hypertension · chest pain · rhabdomyolysis · excited delirium",
    unique: "Excited delirium syndrome — hyperthermia + psychomotor agitation + sudden cardiac death risk · extreme physical restraint + catecholamine surge → death · not detected on standard urine tox screens · often mislabeled as other substances · highly unpredictable potency batch-to-batch",
    tx: "Benzos in large doses · antipsychotics as adjunct (benperidol or droperidol · haloperidol) · aggressive cooling for hyperthermia · avoid physical restraint when possible (catecholamine surge) · chemical sedation preferred · ketamine for excited delirium if refractory to benzos + antipsychotics",
    avoid: "Physical restraint alone (worsens catecholamine surge + heat generation) · standard urine drug screens (won't detect most synthetic cathinones) · standard dosing of sedatives (often require much higher doses)",
  },
];

const TOXIDROMES = [
  { name: "Sympathomimetic",  color: T.amber,  hr: "↑↑", bp: "↑↑", temp: "↑", pupils: "Mydriasis", skin: "Diaphoretic", mental: "Agitated", bs: "↑", reflexes: "Normal or ↑" },
  { name: "Anticholinergic",  color: T.gold,   hr: "↑",  bp: "↑",  temp: "↑", pupils: "Mydriasis", skin: "Dry/Hot/Red", mental: "Confused", bs: "↓", reflexes: "Normal" },
  { name: "Cholinergic (SLUDGE)", color: T.teal, hr: "↓", bp: "↓", temp: "Normal", pupils: "Miosis", skin: "Diaphoretic", mental: "Confused", bs: "↑↑↑", reflexes: "Normal" },
  { name: "Sedative/Hypnotic", color: T.blue,  hr: "↓",  bp: "↓",  temp: "↓", pupils: "Normal",   skin: "Normal",    mental: "Sedated", bs: "↓", reflexes: "↓" },
  { name: "Opioid",           color: T.purple, hr: "↓",  bp: "↓",  temp: "↓", pupils: "Miosis",   skin: "Normal",    mental: "Coma",    bs: "↓", reflexes: "↓" },
];

export default function SympathomimeticHub() {
  const [tab, setTab]   = useState(0);
  const [agent, setAgent] = useState(null);
  const TABS = ["Recognition", "Treatment", "Complications", "Monitoring"];

  const selAgent = AGENTS.find(a => a.id === agent);

  // ── TAB 0: RECOGNITION ──────────────────────────────────────────────────
  const T0 = (
    <div>
      <div style={aBox(T.coral, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, marginBottom: 2 }}>Sympathomimetic Toxidrome — Catecholamine Excess</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>Stimulant toxicity is a hyperadrenergic state. Core features: tachycardia + hypertension + hyperthermia + agitation + mydriasis. Hyperthermia is the deadliest manifestation — body temperature correlates with mortality.</div>
      </div>

      <div style={sL()}>Classic Toxidrome Features</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
        {[
          { sys: "Cardiovascular", color: T.coral,  items: ["Tachycardia (often > 130)", "Hypertension (may be severe)", "Wide complex tachycardia (cocaine Na channel)", "Coronary vasospasm (cocaine)", "Arrhythmias", "STEMI / ACS (cocaine)"] },
          { sys: "CNS",           color: T.amber,  items: ["Agitation / restlessness", "Anxiety · psychosis", "Tremor", "Seizures (high doses)", "Stroke (hypertensive + vasospasm)", "Altered mentation / excited delirium"] },
          { sys: "Autonomic",     color: T.gold,   items: ["Hyperthermia (most dangerous)", "Diaphoresis (wet skin)", "Mydriasis (dilated pupils)", "Dry mouth possible (variable)", "Urinary retention (alpha effect)", "Tachypnea"] },
          { sys: "Metabolic",     color: T.teal,   items: ["Rhabdomyolysis (hyperthermia + agitation)", "Hyperglycemia (catecholamine)", "Metabolic acidosis (lactic)", "Hyponatremia (MDMA)", "Hyperkalemia (rhabdo)", "Elevated CK / LDH"] },
        ].map(({ sys, color, items }) => (
          <div key={sys} style={card({ padding: "12px 13px", borderLeft: `3px solid ${color}` })}>
            <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 7 }}>{sys}</div>
            {items.map((s, i) => <div key={i} style={{ fontSize: 11, color: T.muted, marginBottom: 3, display: "flex", gap: 5 }}><span style={{ color }}>●</span>{s}</div>)}
          </div>
        ))}
      </div>

      <div style={sL(T.purple)}>Agent Selector — Clinical Implications</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
        {AGENTS.map(a => (
          <button key={a.id} onClick={() => setAgent(agent === a.id ? null : a.id)}
            style={{ padding: "6px 12px", borderRadius: 8, border: `1.5px solid ${agent === a.id ? a.color : T.border}`, background: agent === a.id ? a.color + "20" : T.glass, color: agent === a.id ? a.color : T.muted, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: T.sans, transition: "all 0.15s" }}>
            {a.name.split(" / ")[0]}
          </button>
        ))}
      </div>
      {selAgent && (
        <div style={{ ...card({ border: `1.5px solid ${selAgent.color}55`, marginBottom: 14 }) }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: selAgent.color, marginBottom: 10 }}>{selAgent.name}</div>
          {[
            { l: "Mechanism",     v: selAgent.moa },
            { l: "Onset / Duration", v: selAgent.onset },
            { l: "Key Features",  v: selAgent.features },
            { l: "Unique Danger", v: selAgent.unique },
          ].map(({ l, v }) => (
            <div key={l} style={{ display: "flex", gap: 10, paddingBottom: 7, marginBottom: 7, borderBottom: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: selAgent.color, minWidth: 115, flexShrink: 0 }}>{l}</div>
              <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{v}</div>
            </div>
          ))}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div style={aBox(T.teal, 0)}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.teal, marginBottom: 2 }}>Treatment Highlights</div>
              <div style={{ fontSize: 11.5, color: T.muted }}>{selAgent.tx}</div>
            </div>
            <div style={aBox(T.coral, 0)}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.coral, marginBottom: 2 }}>Avoid</div>
              <div style={{ fontSize: 11.5, color: T.muted }}>{selAgent.avoid}</div>
            </div>
          </div>
        </div>
      )}

      <div style={sL(T.blue)}>Toxidrome Comparison — Quick Differentiator</div>
      <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: 520 }}>
          {TOXIDROMES.map((row, idx) => (
            <div key={row.name} style={{ display: "flex", borderBottom: `1px solid ${T.border}`, background: idx === 0 ? row.color + "10" : idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)", padding: "8px 10px", gap: 4, border: idx === 0 ? `1px solid ${row.color}30` : "none", borderRadius: idx === 0 ? 8 : 0, marginBottom: idx === 0 ? 4 : 0 }}>
              <div style={{ flex: 2, fontSize: idx === 0 ? 12 : 11.5, fontWeight: 700, color: row.color }}>{row.name}</div>
              {[row.hr, row.bp, row.temp, row.pupils, row.skin, row.mental].map((val, vi) => (
                <div key={vi} style={{ flex: 1.2, fontSize: 11, color: T.muted, textAlign: "center" }}>{val}</div>
              ))}
            </div>
          ))}
          <div style={{ display: "flex", padding: "5px 10px", gap: 4 }}>
            <div style={{ flex: 2, fontSize: 9.5, fontWeight: 700, color: T.dim, textTransform: "uppercase", letterSpacing: "0.07em" }}>Toxidrome</div>
            {["HR", "BP", "Temp", "Pupils", "Skin", "Mental"].map((h, i) => (
              <div key={i} style={{ flex: 1.2, fontSize: 9.5, color: T.dim, textAlign: "center", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // ── TAB 1: TREATMENT ────────────────────────────────────────────────────
  const T1 = (
    <div>
      <div style={aBox(T.amber, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.amber, marginBottom: 2 }}>Treatment Priority: Cool + Sedate + Control BP · Benzodiazepines First for Everything</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>Benzodiazepines address nearly every dangerous manifestation: reduces CNS excitation, lowers catecholamine tone, decreases muscle activity (reducing hyperthermia), controls seizures, and lowers BP/HR. Start here before anything else.</div>
      </div>

      <div style={sL()}>Step-by-Step Protocol</div>
      {[
        { n: 1, label: "BENZODIAZEPINES — First and Always", color: T.teal, time: "Immediately",
          detail: "Lorazepam 2–4 mg IV q 5–10 min (titrate to effect) OR Diazepam 5–10 mg IV q 5 min OR Midazolam 2–5 mg IV/IM for very agitated patient who cannot have IV placed. Benzodiazepines control agitation, reduce catecholamine excess, decrease heat generation, control seizures, and lower HR/BP. Give generously.",
          pearl: "Underdosing benzos is the most common mistake. Use IV diazepam for rapid titration in severe cases — its long duration prevents re-agitation. Escalate dose rapidly if no response." },
        { n: 2, label: "COOLING — Hyperthermia Kills", color: T.coral, time: "Simultaneously",
          detail: "Evaporative cooling (spray + fan) for all patients with temp > 38.5°C · Ice water immersion for temp > 40°C · Ice packs to axillae/groin/neck as adjunct · Cold IV fluids · Target < 38.5°C within 30 min · STOP at 38°C to prevent overshoot. Antipyretics NOT effective (not fever — thermogenic mechanism).",
          pearl: "Hyperthermia > 40°C has exponential mortality. Do not wait for fever to be 'high enough' — start cooling with first vital signs showing temperature elevation. Chemical sedation reduces heat generation." },
        { n: 3, label: "BLOOD PRESSURE CONTROL", color: T.gold, time: "If refractory to benzos",
          detail: "Phentolamine 1–5 mg IV bolus → most specific (pure alpha blocker) · Nicardipine 5 mg/h IV infusion (titrate) · Labetalol 10–20 mg IV (alpha + beta — acceptable in stimulant toxicity EXCEPT cocaine) · Nitroprusside 0.3–10 mcg/kg/min for hypertensive emergency. Target SBP < 180 in most cases; lower if end-organ damage signs.",
          pearl: "Most hypertension resolves with adequate benzos + cooling. Reserve direct vasodilators for persistent severe hypertension (SBP > 180) after benzodiazepines given." },
        { n: 4, label: "SEIZURE MANAGEMENT", color: T.purple, time: "If seizures occur",
          detail: "Benzodiazepines first-line (lorazepam 4 mg IV) — same mechanism as agitation control · Phenobarbital 15–20 mg/kg IV for refractory seizures · Avoid phenytoin/levetiracetam as first-line (sodium channel drugs less effective for toxicological seizures) · Propofol + intubation for status epilepticus",
          pearl: "Seizures from stimulant toxicity increase heat generation dramatically. Each seizure → temperature spike. Aggressive seizure control = aggressive temperature control." },
        { n: 5, label: "AVOID BETA-BLOCKERS", color: T.amber, time: "Critical avoidance",
          detail: "Beta-blockers (especially non-selective like propranolol) are CONTRAINDICATED in cocaine toxicity and should be avoided in all stimulant toxicity. By blocking beta-2 vasodilation, you leave alpha-1 vasoconstriction unopposed → severe hypertension + worsened coronary vasospasm + end-organ ischemia.",
          pearl: "Even 'cardioselective' beta-1 blockers can worsen cocaine-induced coronary vasospasm. Use labetalol only if dual alpha + beta blockade is needed (not pure beta)." },
      ].map(({ n, label, color, time, detail, pearl }) => (
        <div key={n} style={{ ...card({ marginBottom: 9, borderLeft: `3px solid ${color}` }), cursor: "default" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: color + "22", border: `1.5px solid ${color}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color, flexShrink: 0 }}>{n}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 3 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color }}>{label}</span>
                <span style={{ ...tag(color), fontSize: 9, whiteSpace: "nowrap", marginLeft: 6 }}>{time}</span>
              </div>
            </div>
          </div>
          <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.45, marginBottom: 8 }}>{detail}</div>
          <div style={aBox(color, 0)}>
            <div style={{ fontSize: 11, fontWeight: 700, color, marginBottom: 1 }}>⚡ Pearl</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>{pearl}</div>
          </div>
        </div>
      ))}

      <div style={sL(T.purple)}>Agitation Management — Sedation Ladder</div>
      {[
        { step: "Mild agitation",    tx: "Lorazepam 2 mg IV/IM · calm environment · reduce stimulation · verbal de-escalation", color: T.teal },
        { step: "Moderate agitation", tx: "Lorazepam 2–4 mg IV q 5–10 min · consider adding droperidol 5 mg IM/IV as adjunct · avoid haloperidol alone (lowers seizure threshold) · total benzo dose may reach 20–40 mg diazepam equivalents", color: T.gold },
        { step: "Severe / Excited Delirium", tx: "Midazolam 5–10 mg IM (onset ~2 min) OR Ketamine 4 mg/kg IM (dissociative — rapid · maintains airway) · followed by IV access and benzo titration · prepare for intubation", color: T.coral },
        { step: "Refractory / Intubated", tx: "Propofol infusion 5–50 mcg/kg/min · midazolam infusion · continuous monitoring · paralysis if refractory hyperthermia despite sedation", color: T.purple },
      ].map(({ step, tx, color }) => (
        <div key={step} style={{ ...G(), padding: "10px 13px", marginBottom: 7, borderLeft: `3px solid ${color}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 2 }}>{step}</div>
          <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{tx}</div>
        </div>
      ))}

      <div style={sL(T.teal)}>Cocaine Chest Pain — Specific Protocol</div>
      <div style={{ ...card({ marginBottom: 14, background: "rgba(20,184,166,0.07)", borderColor: "rgba(20,184,166,0.3)" }) }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.teal, marginBottom: 8 }}>Cocaine-Induced Chest Pain — Dual Mechanism</div>
        <div style={{ fontSize: 11.5, color: T.muted, marginBottom: 10 }}>Cocaine causes chest pain via: (1) Coronary vasospasm (alpha-1 mediated) + (2) Increased myocardial O2 demand (tachycardia + hypertension) + (3) Accelerated atherosclerosis (chronic use) + (4) Platelet activation.</div>
        {[
          { drug: "Benzodiazepines",       dose: "Lorazepam 2–4 mg IV · first-line for all cocaine chest pain · reduces catecholamine excess", color: T.teal },
          { drug: "Nitroglycerin",          dose: "0.4 mg SL q 5 min · then IV if needed · treats vasospasm + ischemia", color: T.gold },
          { drug: "Calcium Channel Blocker", dose: "Verapamil 5 mg IV or Diltiazem 15–25 mg IV · coronary vasospasm treatment · especially if refractory to NTG", color: T.purple },
          { drug: "Aspirin",               dose: "325 mg PO · antiplatelet effect · cocaine activates platelets", color: T.blue },
          { drug: "Phentolamine",           dose: "1–5 mg IV · for refractory hypertension · pure alpha-blocker · avoids beta-blocker problem", color: T.amber },
        ].map(({ drug, dose, color }) => (
          <div key={drug} style={{ display: "flex", gap: 10, paddingBottom: 6, marginBottom: 6, borderBottom: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color, minWidth: 160, flexShrink: 0 }}>{drug}</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>{dose}</div>
          </div>
        ))}
        <div style={aBox(T.coral, 0)}>
          <div style={{ fontSize: 11.5, color: T.muted }}>
            <span style={{ color: T.coral, fontWeight: 700 }}>Beta-blockers CONTRAINDICATED in cocaine chest pain — </span>
            unopposed alpha → worsened vasospasm + increased ischemia. Even labetalol is controversial in acute cocaine chest pain, though its alpha-blocking properties make it more acceptable than pure beta-blockers.
          </div>
        </div>
      </div>
    </div>
  );

  // ── TAB 2: COMPLICATIONS ─────────────────────────────────────────────────
  const T2 = (
    <div>
      <div style={sL()}>Life-Threatening Complications</div>
      {[
        {
          comp: "Hyperthermia (> 40°C)", icon: "🌡", color: T.coral, urgent: true,
          mech: "Excess muscle activity + impaired heat dissipation (vasoconstriction) + direct thermogenic effect of catecholamines",
          mgmt: "Ice water immersion (fastest) · evaporative cooling · cold IV fluids · paralysis + intubation if refractory (eliminates all muscle heat generation) · antipyretics NOT effective · target < 38.5°C within 30 min · stop at 38°C",
        },
        {
          comp: "Rhabdomyolysis", icon: "💪", color: T.gold, urgent: false,
          mech: "Sustained muscle activity + hyperthermia + direct toxin effect on muscle cells",
          mgmt: "Aggressive IVF (NS 1–1.5 mL/kg/h) · target UO 200–300 mL/h · serial CK q 6h · see RhabdomyolysisHub · hyperkalemia monitoring · AKI watch · bicarb alkalization if CK > 15,000",
        },
        {
          comp: "Cocaine-Induced MI / ACS", icon: "❤️", color: T.coral, urgent: true,
          mech: "Coronary vasospasm + accelerated thrombus + increased O2 demand from tachycardia/hypertension + sodium channel blockade causing dysrhythmia",
          mgmt: "Benzos + NTG + aspirin + CCB for vasospasm · primary PCI for true STEMI · avoid beta-blockers · TIMI scoring applies · troponin elevation common without true ACS (myocarditis / demand ischemia) · cocaine-positive urine does not preclude PCI",
        },
        {
          comp: "Intracerebral Hemorrhage / Stroke", icon: "🧠", color: T.purple, urgent: true,
          mech: "Severe hypertension + vasospasm + accelerated atherosclerosis + platelet activation",
          mgmt: "Emergent CT head for focal neuro deficits or severe headache · BP control (nicardipine or clevidipine) · neurosurgery consult · avoid anticoagulation if hemorrhagic stroke · thrombotic stroke treated per AIS protocol (see AcuteIschemicStrokeHub)",
        },
        {
          comp: "Wide-Complex Tachycardia (Cocaine)", icon: "〰", color: T.amber, urgent: true,
          mech: "Sodium channel blockade (cocaine has local anesthetic properties) → widened QRS → VT morphology · may mimic TCA toxicity on ECG",
          mgmt: "Sodium bicarbonate 1–2 mEq/kg IV bolus (reverses sodium channel blockade · same as TCA toxicity) · repeat PRN · avoid lidocaine (same mechanism) · amiodarone acceptable · avoid class Ic antiarrhythmics · defibrillation for VF/pVT",
        },
        {
          comp: "Excited Delirium Syndrome", icon: "⚡", color: T.coral, urgent: true,
          mech: "Extreme catecholamine surge + hyperthermia + metabolic acidosis + physical restraint → sudden cardiac arrest (mechanism unclear: catecholamine cardiotoxicity vs positional asphyxia)",
          mgmt: "Chemical sedation URGENTLY (ketamine 4 mg/kg IM fastest · or midazolam 10 mg IM) · minimize physical restraint · immediate cooling · airway management · ACLS if arrests · high mortality without rapid chemical sedation",
        },
      ].map(({ comp, icon, color, urgent, mech, mgmt }) => (
        <div key={comp} style={{ ...card({ marginBottom: 9, borderLeft: `3px solid ${color}` }) }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 18 }}>{icon}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color }}>{comp}</span>
            {urgent && <span style={{ ...tag(T.coral), fontSize: 9 }}>URGENT</span>}
          </div>
          <div style={{ fontSize: 11.5, color: T.dim, marginBottom: 6 }}>{mech}</div>
          <div style={aBox(color, 0)}>
            <div style={{ fontSize: 11, fontWeight: 700, color, marginBottom: 2 }}>Management</div>
            <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{mgmt}</div>
          </div>
        </div>
      ))}

      <div style={sL(T.gold)}>ECG Findings by Agent</div>
      {[
        { agent: "Cocaine", findings: "Wide QRS (Na-channel) · ST elevation (vasospasm or ACS) · QTc prolongation · sinus tachycardia · VT · Brugada-pattern (type A flecainide-like)", color: T.coral },
        { agent: "Methamphetamine", findings: "Sinus tachycardia · atrial fibrillation · VT/VF (cardiomyopathy) · LVH (chronic hypertension) · premature beats · AV block rare", color: T.amber },
        { agent: "MDMA", findings: "Sinus tachycardia · QTc prolongation (hyponatremia) · ST changes if hyperthermia severe · AF possible", color: T.purple },
      ].map(({ agent, findings, color }) => (
        <div key={agent} style={{ ...G(), padding: "9px 12px", marginBottom: 6, borderLeft: `3px solid ${color}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 2 }}>{agent}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{findings}</div>
        </div>
      ))}
    </div>
  );

  // ── TAB 3: MONITORING ───────────────────────────────────────────────────
  const T3 = (
    <div>
      <div style={sL()}>Monitoring Schedule</div>
      {[
        { freq: "Every 15–30 min", items: "Temperature (rectal for accuracy) · HR · BP · RR · SpO2 · agitation level · seizure activity", color: T.coral },
        { freq: "Every 1–2h",      items: "CK (initial + trending) · BMP (electrolytes · creatinine · glucose) · mental status assessment · response to sedation", color: T.gold },
        { freq: "Every 4–6h",      items: "LFTs · CBC · coagulation · urine myoglobin (if rhabdo suspected) · serial ECG (cocaine: QRS width · QTc) · ABG if respiratory compromise", color: T.teal },
        { freq: "Continuous",      items: "Cardiac monitor · SpO2 · EtCO2 if intubated · temperature probe if hyperthermia active treatment", color: T.purple },
      ].map(({ freq, items, color }) => (
        <div key={freq} style={{ ...G(), padding: "9px 12px", marginBottom: 6, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div style={{ fontFamily: T.mono, fontSize: 11.5, fontWeight: 700, color, minWidth: 130, flexShrink: 0 }}>{freq}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{items}</div>
        </div>
      ))}

      <div style={sL(T.teal)}>Treatment Targets</div>
      {[
        { t: "Temperature",   goal: "< 38.5°C (target) · STOP cooling at 38°C (prevent overshoot)", color: T.coral },
        { t: "Heart Rate",    goal: "< 100–110 bpm with benzodiazepines · persistent tachycardia = inadequate sedation or ongoing sympathetic excess", color: T.amber },
        { t: "SBP",           goal: "< 180 mmHg · lower if end-organ damage (stroke · MI · papilledema)", color: T.gold },
        { t: "Agitation",     goal: "Patient calm and cooperative or appropriately sedated · RASS 0 to −1", color: T.teal },
        { t: "CK",            goal: "Trending down · < 1000 before discharge · IVF until UO 200–300 mL/h", color: T.blue },
        { t: "QRS Width",     goal: "< 120 ms (cocaine) · bicarb if widening despite treatment", color: T.purple },
      ].map(({ t, goal, color }) => (
        <div key={t} style={{ ...G({ borderRadius: 9 }), padding: "9px 12px", marginBottom: 6, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color, minWidth: 110, flexShrink: 0 }}>{t}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{goal}</div>
        </div>
      ))}

      <div style={sL(T.coral)}>Escalation Triggers</div>
      {["Temperature > 40°C → ice water immersion + paralysis if not responding to sedation",
        "Persistent agitation despite > 20 mg diazepam equivalents → intubation + propofol infusion",
        "Cardiac arrest (cocaine VF/VT) → ACLS + sodium bicarbonate 1–2 mEq/kg IV",
        "Focal neurological deficit → emergent CT head (stroke · ICH)",
        "QRS > 120 ms (cocaine) → sodium bicarbonate immediately + cardiology consult",
        "STEMI on ECG → emergent cath lab activation (cocaine does not exclude PCI candidacy) · cardiology and toxicology co-management",
        "Rising CK > 15,000 + oliguria → nephrology · IVF escalation · consider bicarb alkalization"].map((t, i) => (
        <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 8, marginBottom: 6, lineHeight: 1.4 }}>
          <span style={{ color: T.coral, flexShrink: 0 }}>⚠</span>{t}
        </div>
      ))}

      <div style={sL(T.green)}>Discharge Criteria</div>
      {["Hemodynamically stable (HR < 100 · BP < 160/100) without active medications × 4–6h",
        "Temperature normalized to baseline · no recurrence of hyperthermia",
        "Mental status returned to baseline",
        "CK trending down and < 1000 (if rhabdomyolysis present) · creatinine stable",
        "ECG normal (cocaine: QRS < 120 · QTc normal · no ischemia) · troponin assessed",
        "No evidence of end-organ damage (renal · cardiac · neurologic)",
        "Social work / addiction medicine consultation offered · follow-up arranged",
        "Harm reduction counseling: fentanyl contamination risk · test strips · naloxone education"].map((s, i) => (
        <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 8, marginBottom: 5 }}>
          <span style={{ color: T.green }}>✓</span>{s}
        </div>
      ))}

      <div style={sL(T.purple)}>Disposition</div>
      <div style={{ ...card() }}>
        {[
          { level: "ICU",           detail: "Hyperthermia > 40°C · excited delirium · rhabdomyolysis (CK > 10,000) · hemodynamic instability · intubation required · stroke or ICH · cocaine STEMI · refractory seizures · wide-complex arrhythmia" },
          { level: "Telemetry",     detail: "Chest pain with ECG changes · troponin elevation · moderate rhabdomyolysis · persistent tachycardia / hypertension requiring IV medications · significant electrolyte derangements · psychiatric comorbidity" },
          { level: "Observation",   detail: "Mild-moderate agitation resolved · normal vitals × 4–6h · cocaine chest pain ruled out · CK mildly elevated but trending down · urine drug screen positive without complications" },
          { level: "Discharge",     detail: "Meets all discharge criteria above · addiction medicine / behavioral health referral · naloxone prescription (fentanyl contamination risk) · harm reduction education · return precautions" },
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
    <div style={{ minHeight: "100vh", background: `radial-gradient(ellipse 70% 40% at 15% 0%, rgba(251,146,60,0.09) 0%, transparent 60%), radial-gradient(ellipse 50% 35% at 85% 95%, rgba(244,63,94,0.08) 0%, transparent 55%), ${T.bg}`, fontFamily: T.sans, color: T.white, paddingBottom: 80 }}>
      <div style={{ padding: "20px 20px 0" }}>
        <div>
          <span style={pill("linear-gradient(135deg,#fb923c,#b45309)")}>☠️ Toxicologic</span>
          <span style={pill("linear-gradient(135deg,#0d9488,#065f46)")}>Toxicology / ACEP</span>
        </div>
        <h1 style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 700, margin: "0 0 4px", lineHeight: 1.15 }}>Sympathomimetic Toxidrome</h1>
        <p style={{ color: T.muted, fontSize: 12, margin: "0 0 20px" }}>
          Cocaine · Meth · MDMA · Bath Salts · Benzodiazepines first · Avoid beta-blockers · Cooling · Cocaine chest pain protocol
        </p>
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