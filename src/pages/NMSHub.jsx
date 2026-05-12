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
const sL   = (c = T.purple) => ({ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: c, margin: "18px 0 10px", display: "flex", alignItems: "center", gap: 8 });
const dv   = { height: 1, background: T.border, margin: "10px 0" };

const NMS_FEATURES = [
  { id: "hyperthermia", label: "Hyperthermia (> 38°C / 100.4°F)", pts: 2 },
  { id: "rigidity",     label: "Muscular rigidity (lead-pipe or cogwheel)", pts: 2 },
  { id: "altered",      label: "Altered mental status (confusion · agitation · coma)", pts: 2 },
  { id: "autonomic",    label: "Autonomic instability (diaphoresis · tachycardia · BP lability · tachypnea · incontinence)", pts: 2 },
  { id: "drug",         label: "Precipitating drug (dopamine antagonist or DA agonist withdrawal)", pts: 1 },
  { id: "elevated_ck",  label: "Elevated CK (> 1000 U/L or markedly elevated)", pts: 1 },
];

const COMPARISON = {
  NMS: {
    color: T.purple, label: "NMS",
    onset: "Days to weeks after drug initiation or dose change",
    trigger: "Dopamine antagonists (antipsychotics, metoclopramide, prochlorperazine, droperidol) · DA agonist withdrawal",
    rigidity: "Lead-pipe / cogwheel · severe · generalized",
    tremor: "Present (pill-rolling or coarse)",
    hyperthermia: "Moderate-high (38–40°C) · can exceed 41°C in severe",
    autonomic: "Labile BP · diaphoresis · tachycardia · tachypnea",
    clonus: "ABSENT or minimal",
    reflexes: "Normal or bradyreflexia",
    ck: "MARKEDLY elevated (often > 1000, can be > 100,000)",
    treatment: "Stop offending drug · bromocriptine/dantrolene · benzodiazepines · cooling",
  },
  SS: {
    color: T.gold, label: "Serotonin Syndrome",
    onset: "RAPID — hours after drug addition or overdose",
    trigger: "Serotonergic drugs: SSRIs · SNRIs · MAOIs · triptans · tramadol · linezolid · fentanyl · St John's Wort",
    rigidity: "Mild or absent · more prominent in lower extremities",
    tremor: "Present · fine or coarse",
    hyperthermia: "Can be severe (> 41°C in severe SS)",
    autonomic: "Tachycardia · diaphoresis · mydriasis · diarrhea",
    clonus: "PRESENT (spontaneous · inducible · ocular) — HALLMARK",
    reflexes: "HYPERREFLEXIA — key distinguishing feature",
    ck: "Mildly elevated (less prominent than NMS)",
    treatment: "Stop serotonergic drugs · cyproheptadine · benzodiazepines · cooling",
  },
  MH: {
    color: T.coral, label: "Malignant Hyperthermia",
    onset: "MINUTES during anesthesia (succinylcholine or volatile agents)",
    trigger: "Inhalational anesthetics (halothane · desflurane · sevoflurane) · succinylcholine · genetic predisposition (RYR1 mutation)",
    rigidity: "Masseter spasm + generalized rigidity · first sign often masseter",
    tremor: "Variable · may be absent",
    hyperthermia: "VERY HIGH (> 40–42°C) · rapid rise · mottled skin",
    autonomic: "Tachycardia · mixed autonomic",
    clonus: "Absent",
    reflexes: "Variable",
    ck: "Markedly elevated · myoglobinuria",
    treatment: "DANTROLENE 2.5 mg/kg IV (specific antidote) · stop triggering agents · aggressive cooling · call MH hotline: 1-800-644-9737",
  },
  AC: {
    color: T.amber, label: "Anticholinergic",
    onset: "Hours after ingestion or drug exposure",
    trigger: "Diphenhydramine · tricyclic antidepressants · scopolamine · benztropine · jimsonweed · atropine",
    rigidity: "ABSENT — characteristic absence distinguishes from NMS",
    tremor: "Mild",
    hyperthermia: "Moderate (38–40°C) · dry hot skin",
    autonomic: "Mydriasis (key) · dry skin (hot/dry/red) · urinary retention · decreased bowel sounds",
    clonus: "Absent",
    reflexes: "Normal",
    ck: "Mildly elevated or normal",
    treatment: "Physostigmine 1–2 mg IV (if no TCA toxicity) · benzodiazepines · cooling · supportive",
  },
};

export default function NMSHub({ onBack }) {
  const navigate = useNavigate();
  const handleBack = () => onBack ? onBack() : navigate("/CriticalProtocolsPage");

  const [tab, setTab]   = useState(0);
  const [nmsVals, setNmsVals] = useState({});
  const [comparison, setComparison] = useState("NMS");
  const TABS = ["Recognition", "Treatment", "Differential", "Monitoring"];

  const nmsScore = NMS_FEATURES.reduce((s, i) => s + (nmsVals[i.id] ? i.pts : 0), 0);
  const nmsInterp = nmsScore >= 7 ? { label: "NMS Likely — Treat immediately", color: T.coral }
    : nmsScore >= 5 ? { label: "NMS Possible — High clinical suspicion", color: T.amber }
    : nmsScore >= 3 ? { label: "NMS Possible — Continue workup", color: T.gold }
    : { label: "NMS Less Likely", color: T.teal };

  const toggleNms = (id) => setNmsVals(p => ({ ...p, [id]: !p[id] }));

  const selComp = COMPARISON[comparison];

  // ── TAB 0: RECOGNITION ──────────────────────────────────────────────────
  const T0 = (
    <div>
      <div style={aBox(T.coral, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, marginBottom: 2 }}>NMS — Rare but Potentially Fatal Drug Reaction · Mortality 10–20%</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>NMS is a diagnosis of exclusion. It requires exposure to a dopamine antagonist (or DA agonist withdrawal), hyperthermia, rigidity, and autonomic instability. The tetrad distinguishes NMS from other syndromes.</div>
      </div>

      <div style={sL()}>Diagnostic Criteria — Levenson (Modified DSM)</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        <div style={{ fontSize: 11.5, color: T.muted, marginBottom: 10 }}>All 3 MAJOR criteria OR 2 major + 4 minor criteria — check all that apply</div>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: T.purple, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Major Criteria</div>
        {["Hyperthermia (> 38°C)", "Severe muscle rigidity", "Recent dopamine antagonist use or DA agonist withdrawal"].map((c, i) => (
          <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 8, marginBottom: 5 }}>
            <span style={{ color: T.purple }}>●</span>{c}
          </div>
        ))}
        <div style={dv} />
        <div style={{ fontSize: 10.5, fontWeight: 700, color: T.gold, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Minor Criteria</div>
        {["Tachycardia", "Abnormal BP (hyper or hypotension)", "Tachypnea or hypoxia", "Diaphoresis or sialorrhea", "Tremor", "Incontinence", "Altered consciousness", "Leukocytosis", "Elevated CK"].map((c, i) => (
          <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 8, marginBottom: 4 }}>
            <span style={{ color: T.gold }}>●</span>{c}
          </div>
        ))}
      </div>

      <div style={sL()}>Quick NMS Likelihood Scorer</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        {NMS_FEATURES.map(item => (
          <div key={item.id} onClick={() => toggleNms(item.id)}
            style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 8, cursor: "pointer" }}>
            <div style={{ width: 20, height: 20, borderRadius: 5, border: `1.5px solid ${nmsVals[item.id] ? T.purple : T.border}`, background: nmsVals[item.id] ? T.purple + "30" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: nmsVals[item.id] ? T.purple : T.dim, flexShrink: 0, marginTop: 1 }}>
              {nmsVals[item.id] && "✓"}
            </div>
            <div style={{ flex: 1, fontSize: 12, color: nmsVals[item.id] ? T.white : T.muted, lineHeight: 1.4 }}>{item.label}</div>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: nmsVals[item.id] ? T.purple : T.dim, flexShrink: 0 }}>+{item.pts}</div>
          </div>
        ))}
        <div style={dv} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 14, fontWeight: 700 }}>Likelihood Score</span>
          <span style={{ fontFamily: T.mono, fontSize: 24, fontWeight: 800, color: nmsInterp.color }}>{nmsScore}</span>
        </div>
        <div style={{ ...aBox(nmsInterp.color, 4), marginTop: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: nmsInterp.color }}>{nmsInterp.label}</div>
        </div>
        <button onClick={() => setNmsVals({})} style={{ marginTop: 8, padding: "5px 12px", borderRadius: 7, border: `1px solid ${T.border}`, background: T.glass, color: T.dim, fontSize: 11, cursor: "pointer", fontFamily: T.sans }}>Reset</button>
      </div>

      <div style={sL(T.amber)}>Precipitating Drugs</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {[
          { cat: "Typical Antipsychotics (high risk)", drugs: "Haloperidol · fluphenazine · chlorpromazine · perphenazine · thioridazine" },
          { cat: "Atypical Antipsychotics (lower risk)", drugs: "Olanzapine · risperidone · quetiapine · clozapine · aripiprazole · ziprasidone" },
          { cat: "Antiemetics (frequently missed!)", drugs: "Metoclopramide · prochlorperazine · promethazine · droperidol · domperidone" },
          { cat: "DA Agonist Withdrawal", drugs: "Abrupt levodopa/carbidopa stop · amantadine withdrawal · parkinsonian medications stopped" },
          { cat: "Other DA Antagonists", drugs: "Lithium augmentation · tetrabenazine · reserpine" },
          { cat: "Rare Associations", drugs: "Amoxapine (TCA) · MAOI combinations · cocaine withdrawal (dopamine depletion)" },
        ].map(({ cat, drugs }) => (
          <div key={cat} style={{ ...G({ borderRadius: 9 }), padding: "10px 12px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.amber, marginBottom: 3 }}>{cat}</div>
            <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.35 }}>{drugs}</div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── TAB 1: TREATMENT ────────────────────────────────────────────────────
  const T1 = (
    <div>
      <div style={aBox(T.coral, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, marginBottom: 2 }}>Stop the Drug First — Then Support</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>Mortality 10–20% without treatment. Immediate cessation of the offending drug is the most critical intervention. Recovery typically 1–2 weeks after drug stopped. ICU admission for all confirmed NMS.</div>
      </div>

      <div style={sL()}>Immediate Management — Sequence</div>
      {[
        { n: 1, label: "STOP all dopamine antagonists immediately", detail: "Discontinue antipsychotics · antiemetics · other dopaminergic agents · If on depot antipsychotic (fluphenazine decanoate) — longer course expected · notify prescribing team", color: T.coral },
        { n: 2, label: "IV access + aggressive cooling", detail: "Cold IV fluids · cooling blankets · ice packs to axillae/groin/neck · target < 38.5°C · Acetaminophen for fever (NOT adequate alone — NMS is not a fever) · evaporative cooling if severe", color: T.blue },
        { n: 3, label: "Benzodiazepines — first-line pharmacotherapy", detail: "Lorazepam 1–2 mg IV q 4–6h (or diazepam 5–10 mg IV) · reduces agitation · decreases muscle activity → reduces CK and hyperthermia · safest initial agent · use generously", color: T.teal },
        { n: 4, label: "Bromocriptine — DA agonist", detail: "2.5 mg PO/NG q 8h → titrate to 5–10 mg TID based on response · Restores dopaminergic tone · most evidence for mild-moderate NMS · takes 24–48h to see full effect · monitor BP (hypotension) · discontinue gradually after resolution", color: T.gold },
        { n: 5, label: "Dantrolene — muscle relaxant", detail: "1–2.5 mg/kg IV q 6h (max 10 mg/kg/day) · reduces muscle rigidity and hyperthermia by blocking calcium release from SR · most benefit in severe cases with life-threatening hyperthermia + rigidity · hepatotoxic with prolonged use · max 10 days PO · less evidence than bromocriptine", color: T.amber },
        { n: 6, label: "Supportive care", detail: "Hydration (IV NS for rhabdomyolysis — see RhabdomyolysisHub) · intubation if airway compromised · vasopressors for hemodynamic instability · DVT prophylaxis · nutrition · dialysis for refractory hyperkalemia or AKI", color: T.purple },
      ].map(({ n, label, detail, color }) => (
        <div key={n} style={{ ...card({ marginBottom: 8, borderLeft: `3px solid ${color}` }), display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ width: 26, height: 26, borderRadius: "50%", background: color + "22", border: `1.5px solid ${color}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color, flexShrink: 0 }}>{n}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{detail}</div>
          </div>
        </div>
      ))}

      <div style={sL(T.teal)}>Drug Dosing Reference</div>
      {[
        { drug: "Bromocriptine", mechanism: "D2 agonist · restores dopaminergic tone", dose: "Start 2.5 mg PO q 8h → 5–10 mg TID", onset: "24–48h", notes: "Nausea common · avoid abrupt discontinuation · taper over 10 days after resolution", color: T.gold },
        { drug: "Dantrolene",    mechanism: "Blocks RYR1 · reduces Ca release from SR → muscle relaxation", dose: "1–2.5 mg/kg IV q 6h · max 10 mg/kg/day · oral 50–200 mg/day in divided doses", onset: "Rapid (IV)", notes: "Hepatotoxic with prolonged use · LFTs q 48h · max 10 days oral · do NOT use with calcium channel blockers (cardiovascular collapse)", color: T.amber },
        { drug: "Lorazepam",     mechanism: "GABA-A agonist · reduces psychomotor agitation and rigidity", dose: "1–2 mg IV q 4–6h PRN · higher doses if needed", onset: "Minutes", notes: "Safest first-line pharmacotherapy · especially useful while cause being determined · titrate to effect", color: T.teal },
        { drug: "Amantadine",    mechanism: "NMDA antagonist + DA reuptake inhibitor", dose: "100 mg PO/NG BID-TID", onset: "24–48h", notes: "Alternative to bromocriptine · may have synergistic effect · useful for DA agonist withdrawal NMS (Parkinson's)", color: T.blue },
      ].map(({ drug, mechanism, dose, onset, notes, color }) => (
        <div key={drug} style={{ ...card({ marginBottom: 9, borderLeft: `3px solid ${color}` }) }}>
          <div style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 3 }}>{drug}</div>
          <div style={{ fontSize: 11, color: T.dim, marginBottom: 6 }}>{mechanism}</div>
          <div style={{ fontFamily: T.mono, fontSize: 11.5, color: T.white, marginBottom: 5 }}>{dose}</div>
          <div style={{ display: "flex", gap: 14, marginBottom: 5 }}>
            <span style={{ fontSize: 10.5, color: T.dim }}>Onset: <span style={{ color: T.white }}>{onset}</span></span>
          </div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{notes}</div>
        </div>
      ))}

      <div style={aBox(T.coral, 0)}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: T.coral, marginBottom: 3 }}>⚠ ECT (Electroconvulsive Therapy)</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>Considered for refractory NMS that fails pharmacotherapy. Evidence limited but case series show benefit. Requires anesthesia consultation. Not first-line.</div>
      </div>
    </div>
  );

  // ── TAB 2: DIFFERENTIAL ─────────────────────────────────────────────────
  const T2 = (
    <div>
      <div style={aBox(T.purple, 16)}>
        <div style={{ fontSize: 11.5, color: T.muted }}>
          <span style={{ color: T.purple, fontWeight: 700 }}>Critical distinction: </span>
          NMS · Serotonin Syndrome · Malignant Hyperthermia · Anticholinergic toxidrome all cause hyperthermia + altered mental status but have very different treatments. Misdiagnosis is dangerous.
        </div>
      </div>

      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 14 }}>
        {Object.entries(COMPARISON).map(([key, val]) => (
          <button key={key} onClick={() => setComparison(key)}
            style={{ padding: "7px 14px", borderRadius: 9, border: `1.5px solid ${comparison === key ? val.color : T.border}`, background: comparison === key ? val.color + "20" : T.glass, color: comparison === key ? val.color : T.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.sans, transition: "all 0.15s" }}>
            {val.label}
          </button>
        ))}
      </div>

      {selComp && (
        <div style={{ ...card({ border: `1.5px solid ${selComp.color}55` }) }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: selComp.color, marginBottom: 12 }}>{selComp.label}</div>
          {[
            { label: "Onset",         val: selComp.onset },
            { label: "Trigger",       val: selComp.trigger },
            { label: "Rigidity",      val: selComp.rigidity },
            { label: "Tremor",        val: selComp.tremor },
            { label: "Hyperthermia",  val: selComp.hyperthermia },
            { label: "Autonomic",     val: selComp.autonomic },
            { label: "Clonus",        val: selComp.clonus },
            { label: "Reflexes",      val: selComp.reflexes },
            { label: "CK",            val: selComp.ck },
            { label: "Treatment",     val: selComp.treatment },
          ].map(({ label, val }, i) => {
            const isKey = label === "Clonus" || label === "Reflexes" || label === "Rigidity";
            return (
              <div key={label} style={{ display: "flex", gap: 10, paddingBottom: 7, marginBottom: 7, borderBottom: i < 9 ? `1px solid ${T.border}` : "none" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.muted, minWidth: 100, flexShrink: 0 }}>{label}</div>
                <div style={{ fontSize: 12, color: isKey ? selComp.color : T.muted, fontWeight: isKey ? 700 : 400 }}>{val}</div>
              </div>
            );
          })}
        </div>
      )}

      <div style={sL(T.teal)}>Key Distinguishing Features at a Glance</div>
      <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: 480 }}>
          {[{ h: true, f: "Feature", nms: "NMS", ss: "Serotonin Syndrome", mh: "Malignant Hyperthermia" }].concat([
            { f: "Onset", nms: "Days-weeks", ss: "Hours", mh: "Minutes (OR)", h: false },
            { f: "Rigidity", nms: "Lead-pipe", ss: "Mild/absent", mh: "Masseter spasm", h: false },
            { f: "Clonus", nms: "ABSENT", ss: "PRESENT ✓", mh: "Absent", h: false },
            { f: "Reflexes", nms: "Normal/↓", ss: "HYPERREFLEXIA ✓", mh: "Variable", h: false },
            { f: "CK", nms: "Very high", ss: "Mild-mod", mh: "Very high", h: false },
            { f: "Setting", nms: "Psych meds", ss: "Serotonergic drugs", mh: "Anesthesia", h: false },
            { f: "Antidote", nms: "Bromocriptine", ss: "Cyproheptadine", mh: "DANTROLENE ⚡", h: false },
          ]).map(({ f, nms, ss, mh, h }, i) => (
            <div key={f} style={{ display: "flex", borderBottom: `1px solid ${T.border}`, background: h ? T.glassMid : i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)", padding: "7px 8px", gap: 4 }}>
              <div style={{ flex: 1.2, fontSize: h ? 9.5 : 11.5, fontWeight: h ? 700 : 400, color: h ? T.muted : T.muted, textTransform: h ? "uppercase" : "none", letterSpacing: h ? "0.07em" : 0 }}>{f}</div>
              <div style={{ flex: 1.5, fontSize: h ? 9.5 : 11.5, fontWeight: h ? 700 : 400, color: h ? T.muted : T.purple, textTransform: h ? "uppercase" : "none" }}>{nms}</div>
              <div style={{ flex: 1.5, fontSize: h ? 9.5 : 11.5, fontWeight: h ? 700 : 400, color: h ? T.muted : T.gold, textTransform: h ? "uppercase" : "none" }}>{ss}</div>
              <div style={{ flex: 1.5, fontSize: h ? 9.5 : 11.5, fontWeight: h ? 700 : 400, color: h ? T.muted : T.coral, textTransform: h ? "uppercase" : "none" }}>{mh}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...aBox(T.coral, 0), marginTop: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, marginBottom: 3 }}>MH Emergency — Dantrolene is Specific Antidote</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>If MH suspected: 2.5 mg/kg IV dantrolene IMMEDIATELY. Call MH hotline: 1-800-MH-HYPER (1-800-644-9737). Stop all volatile anesthetics. Switch to TIVA. Cool aggressively.</div>
      </div>
    </div>
  );

  // ── TAB 3: MONITORING ───────────────────────────────────────────────────
  const T3 = (
    <div>
      <div style={sL()}>Monitoring Schedule</div>
      {[
        { freq: "Every 2h × 24h", items: "Temperature (rectal/esophageal) · HR · BP · RR · SpO₂ · mental status · muscle rigidity assessment", color: T.coral },
        { freq: "Every 4–6h",     items: "CK (trending down = improving · rising = worsening) · creatinine · K⁺ · urine output · urine color (myoglobinuria)", color: T.gold },
        { freq: "Every 12h",      items: "LFTs (dantrolene hepatotoxicity if used) · CBC · coagulation (DIC screen if CK very high) · ABG if respiratory compromise", color: T.teal },
        { freq: "Continuous",     items: "Cardiac monitor · SpO₂ · arterial line BP if hemodynamically unstable · continuous temperature probe", color: T.purple },
      ].map(({ freq, items, color }) => (
        <div key={freq} style={{ ...G(), padding: "9px 12px", marginBottom: 6, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div style={{ fontFamily: T.mono, fontSize: 11.5, fontWeight: 700, color, minWidth: 120, flexShrink: 0 }}>{freq}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{items}</div>
        </div>
      ))}

      <div style={sL(T.green)}>Resolution Criteria</div>
      {["Temperature < 38°C consistently for 24h without active cooling",
        "CK trending down toward normal or near-normal",
        "Rigidity resolving — improved muscle tone",
        "Mental status returning toward baseline",
        "Autonomic instability resolved (stable HR and BP)",
        "Able to swallow → transition to oral bromocriptine (if started)",
        "Rhabdomyolysis resolved (CK < 1000) before discharge"].map((c, i) => (
        <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 8, marginBottom: 5 }}>
          <span style={{ color: T.green }}>✓</span>{c}
        </div>
      ))}

      <div style={sL(T.amber)}>Complications to Watch</div>
      {[
        { comp: "Rhabdomyolysis / AKI", mgmt: "Aggressive IVF · target UO 200–300 mL/h · see RhabdomyolysisHub · dialysis if refractory hyperkalemia or anuric", color: T.amber },
        { comp: "DIC",                  mgmt: "FFP + cryoprecipitate if bleeding · platelets if < 50k · treat underlying NMS (cooling + stop drug) · hematology consult", color: T.coral },
        { comp: "Respiratory Failure",  mgmt: "Intubate for airway protection (rigidity may compromise respiration) · ARDS possible · avoid succinylcholine (hyperkalemia risk from rhabdomyolysis)", color: T.blue },
        { comp: "Aspiration Pneumonia", mgmt: "Altered mentation + poor airway reflexes → early intubation · broad-spectrum antibiotics if suspected aspiration · CXR · cultures", color: T.teal },
        { comp: "Autonomic Instability", mgmt: "Propranolol for tachycardia (with caution — bradycardia) · labetalol for hypertension · atropine for bradycardia · cautious NE for hypotension · avoid anticholinergics", color: T.gold },
      ].map(({ comp, mgmt, color }) => (
        <div key={comp} style={{ ...G(), padding: "10px 13px", marginBottom: 7, borderLeft: `3px solid ${color}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 2 }}>{comp}</div>
          <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{mgmt}</div>
        </div>
      ))}

      <div style={sL(T.purple)}>Antipsychotic Rechallenge — When / How</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        {["Wait minimum 2 weeks after COMPLETE resolution of NMS (CK normal · afebrile · no rigidity)",
          "If rechallenge necessary: use low-potency typical or atypical antipsychotic (clozapine has lowest NMS risk)",
          "Start at very low dose · titrate slowly",
          "Avoid high-potency typicals (haloperidol · fluphenazine) — highest NMS risk",
          "Inform patient and family of recurrence risk (~30%) · document clearly"].map((s, i) => (
          <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 8, marginBottom: 5 }}>
            <span style={{ color: T.purple }}>▸</span>{s}
          </div>
        ))}
      </div>

      <div style={sL(T.gold)}>Disposition</div>
      <div style={{ ...card() }}>
        {[
          { level: "ICU",          detail: "All confirmed NMS · temperature > 39°C · rigidity + rhabdomyolysis · hemodynamic instability · altered mentation · respiratory compromise · requiring IV dantrolene or IV bromocriptine" },
          { level: "Neurology/Psychiatry Consult", detail: "All NMS cases · medication management · antipsychotic rechallenge plan · underlying psychiatric illness management · depot antipsychotic management" },
          { level: "Step-Down",    detail: "Improving temperature and CK · tolerating oral medications · mental status clearing · hemodynamically stable · 2–4h temperature stability · transitioning to oral bromocriptine/amantadine" },
        ].map(({ level, detail }, i) => (
          <div key={i} style={{ display: "flex", gap: 10, paddingBottom: 7, marginBottom: 7, borderBottom: i < 2 ? `1px solid ${T.border}` : "none" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.purple, minWidth: 160, flexShrink: 0 }}>{level}</div>
            <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{detail}</div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: `radial-gradient(ellipse 70% 40% at 15% 0%, rgba(167,139,250,0.09) 0%, transparent 60%), radial-gradient(ellipse 50% 35% at 85% 95%, rgba(244,63,94,0.07) 0%, transparent 55%), ${T.bg}`, fontFamily: T.sans, color: T.white, paddingBottom: 80 }}>
      <div style={{ padding: "20px 20px 0" }}>
        <button onClick={handleBack} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", color: T.teal, fontSize: 13, fontFamily: T.sans, cursor: "pointer", padding: "4px 0", marginBottom: 16 }}>
          ← Critical Protocols
        </button>
        <div>
          <span style={pill("linear-gradient(135deg,#a78bfa,#6d28d9)")}>⚗️ Metabolic</span>
          <span style={pill("linear-gradient(135deg,#0d9488,#065f46)")}>DSM-5 / Levenson</span>
        </div>
        <h1 style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 700, margin: "0 0 4px", lineHeight: 1.15 }}>Neuroleptic Malignant Syndrome</h1>
        <p style={{ color: T.muted, fontSize: 12, margin: "0 0 20px" }}>NMS likelihood scorer · Bromocriptine + Dantrolene · NMS vs SS vs MH vs Anticholinergic · Rechallenge guidance</p>
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
        {tab === 0 && T0}{tab === 1 && T1}{tab === 2 && T2}{tab === 3 && T3}
      </div>
    </div>
  );
}